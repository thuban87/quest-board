/**
 * Battle Service
 * 
 * Handles combat turn execution, state transitions, and outcomes.
 * Works with battleStore for state and CombatService for damage math.
 */

import { useBattleStore, BattleMonster, CombatState, PlayerAction, CombatLogEntry } from '../store/battleStore';
import { useCharacterStore } from '../store/characterStore';
import {
    CombatStats,
    deriveCombatStats,
    deriveCombatStatsForRaid,
    calculateDamage,
    DamageResult,
} from './CombatService';
import { Monster } from '../models/Monster';
import { createRandomMonster, createMonster } from './MonsterService';
import { lootGenerationService } from './LootGenerationService';
import {
    DEFEAT_GOLD_PENALTY,
    MonsterTier,
    CRIT_MULTIPLIER,
    ELITE_LEVEL_UNLOCK,
    ELITE_BOUNTY_CHANCE,
    ELITE_OVERWORLD_CHANCE,
    ELITE_NAME_PREFIXES,
    SPEED_BASE,
    getStageMultiplier,
} from '../config/combatConfig';
import { checkLevelUp, LevelUpResult } from './XPSystem';
import { Character } from '../models/Character';
import { selectMonsterSkillAI } from '../data/monsterSkills';
import { MonsterSkill } from '../models/Skill';
import { getStatusDisplayName } from '../models/StatusEffect';

// =====================
// SAVE CALLBACK (set by main.ts)
// =====================

/**
 * Module-level save callback for persisting character data after battle.
 * Set via setSaveCallback from main.ts plugin initialization.
 */
let saveCallback: (() => Promise<void>) | null = null;

/**
 * Set the save callback for battle outcomes.
 * Called from main.ts during plugin initialization.
 */
export function setSaveCallback(callback: () => Promise<void>): void {
    saveCallback = callback;
}

// =====================
// LEVEL-UP CALLBACK (set by main.ts)
// =====================

/**
 * Level-up callback options for showing the level-up modal.
 */
export interface LevelUpCallbackOptions {
    characterClass: string;
    newLevel: number;
    tierChanged: boolean;
    isTrainingMode: boolean;
    onGraduate?: () => void;
}

/**
 * Module-level level-up callback for showing level-up modal after battle.
 * Set via setLevelUpCallback from main.ts plugin initialization.
 */
let levelUpCallback: ((options: LevelUpCallbackOptions) => void) | null = null;

/**
 * Set the level-up callback for battle XP gains.
 * Called from main.ts during plugin initialization.
 */
export function setLevelUpCallback(callback: (options: LevelUpCallbackOptions) => void): void {
    levelUpCallback = callback;
}

/**
 * Trigger the level-up modal if a level-up occurred.
 * Used by handleVictory and can be called from other XP sources.
 */
export function triggerLevelUpIfNeeded(oldXP: number, newXP: number, isTrainingMode: boolean): void {
    const result = checkLevelUp(oldXP, newXP, isTrainingMode);
    if (result.didLevelUp && levelUpCallback) {
        const character = useCharacterStore.getState().character;
        if (character) {
            levelUpCallback({
                characterClass: character.class,
                newLevel: result.newLevel,
                tierChanged: result.tierChanged,
                isTrainingMode,
                onGraduate: isTrainingMode && result.newLevel >= 10 ? () => {
                    useCharacterStore.getState().graduate();
                } : undefined,
            });
        }
    }
}

// =====================
// TYPE CONVERSIONS
// =====================

/**
 * Convert Monster instance to BattleMonster (for store)
 */
export function monsterToBattleMonster(monster: Monster): BattleMonster {
    return {
        id: monster.id,
        templateId: monster.templateId,  // For sprite path resolution
        name: monster.name,
        tier: monster.tier,
        level: monster.level,
        maxHP: monster.maxHP,
        currentHP: monster.currentHP,
        attack: monster.attack,
        defense: monster.defense,
        magicDefense: monster.magicDefense,
        critChance: monster.critChance,
        dodgeChance: monster.dodgeChance,
        emoji: monster.emoji,
        goldReward: monster.goldReward,
        xpReward: monster.xpReward,

        // Phase 5: Skills System
        skills: monster.skills ?? [],
        statStages: monster.battleState?.statStages ?? { atk: 0, def: 0, speed: 0 },
        statusEffects: monster.battleState?.statusEffects ?? [],
        skillsUsedThisBattle: monster.battleState?.skillsUsedThisBattle ?? [],
    };
}

// =====================
// BATTLE INITIALIZATION
// =====================

/**
 * Start a random encounter battle.
 * For overworld fights, 30% chance to spawn elite at L5+.
 * Returns true if battle started successfully.
 */
export function startRandomBattle(
    playerLevel: number,
    tier: MonsterTier = 'overworld',
    options?: { isBounty?: boolean; questId?: string }
): boolean {
    const characterStore = useCharacterStore.getState();
    const character = characterStore.character;
    if (!character) {
        console.warn('[BattleService] No character loaded');
        return false;
    }

    // Block fights when unconscious
    if (character.status === 'unconscious') {
        console.warn('[BattleService] Cannot start fight - character is unconscious');
        return false;
    }

    // Elite spawn: 15% chance for overworld when L5+
    let effectiveTier = tier;
    if (tier === 'overworld' && character.level >= ELITE_LEVEL_UNLOCK) {
        if (Math.random() < ELITE_OVERWORLD_CHANCE) {
            effectiveTier = 'elite';
        }
    }

    const monster = createRandomMonster(playerLevel, effectiveTier);
    if (!monster) {
        console.warn('[BattleService] Failed to create monster');
        return false;
    }

    // Apply random name prefix for elite mobs
    // Strip all existing prefixes (monster prefix + tier prefix) before adding elite name
    if (effectiveTier === 'elite') {
        const prefix = ELITE_NAME_PREFIXES[Math.floor(Math.random() * ELITE_NAME_PREFIXES.length)];
        // Remove any existing prefixes: Fierce/Sturdy/Ancient + Elite/Dungeon/Boss
        const baseName = monster.name
            .replace(/^(Fierce |Sturdy |Ancient )/, '')
            .replace(/^(Elite |Dungeon |Boss: |RAID BOSS: )/, '');
        monster.name = `${prefix} ${baseName}`;
    }

    return startBattleWithMonster(monster, options);
}

/**
 * Start a battle with a specific monster template.
 */
export function startBattleWithTemplate(
    templateId: string,
    level: number,
    tier: MonsterTier = 'overworld',
    options?: { isBounty?: boolean; questId?: string }
): boolean {
    const monster = createMonster(templateId, level, tier);
    if (!monster) {
        console.warn(`[BattleService] Unknown template: ${templateId}`);
        return false;
    }

    return startBattleWithMonster(monster, options);
}

/**
 * Start a battle with a specific monster instance.
 */
export function startBattleWithMonster(
    monster: Monster,
    options?: { isBounty?: boolean; questId?: string }
): boolean {
    const character = useCharacterStore.getState().character;
    if (!character) {
        console.warn('[BattleService] No character loaded');
        return false;
    }

    // Derive player combat stats (use raid penalty if applicable)
    const playerStats = monster.tier === 'raid_boss'
        ? deriveCombatStatsForRaid(character)
        : deriveCombatStats(character);

    // Start battle in store
    const battleMonster = monsterToBattleMonster(monster);
    useBattleStore.getState().startBattle(playerStats, battleMonster, options);

    // Phase 5: Hydrate BattlePlayer from Character
    const battlePlayer = hydrateBattlePlayer(character, playerStats);
    useBattleStore.getState().setPlayer(battlePlayer);

    return true;
}

/**
 * Hydrate BattlePlayer from Character and derived combat stats.
 * Called at battle start to create the volatile battle state.
 */
function hydrateBattlePlayer(character: Character, stats: CombatStats): import('../store/battleStore').BattlePlayer {
    return {
        // Combat stats from deriveCombatStats
        maxHP: stats.maxHP,
        currentHP: stats.currentHP,
        maxMana: stats.maxMana,
        currentMana: stats.currentMana,
        physicalAttack: stats.physicalAttack,
        magicAttack: stats.magicAttack,
        defense: stats.defense,
        magicDefense: stats.magicDefense,
        speed: SPEED_BASE + (character.baseStats.dexterity + (character.statBonuses?.dexterity || 0)),
        critChance: stats.critChance,
        dodgeChance: stats.dodgeChance,

        // VOLATILE: Initialize fresh for this battle
        statStages: { atk: 0, def: 0, speed: 0 },
        volatileStatusEffects: [...(character.persistentStatusEffects || [])], // Copy in
        skillsUsedThisBattle: [],
        turnsInBattle: 0,
    };
}

/**
 * Copy volatile status effects back to persistent storage.
 * Called on battle end (victory, defeat, retreat) to persist status effects between battles.
 */
function copyVolatileStatusToPersistent(): void {
    const player = useBattleStore.getState().player;
    if (!player) return;

    const character = useCharacterStore.getState().character;
    if (!character) return;

    // Copy volatile status effects back to persistent storage
    useCharacterStore.getState().setCharacter({
        ...character,
        persistentStatusEffects: [...player.volatileStatusEffects],
        lastModified: new Date().toISOString(),
    });
}

// =====================
// TURN EXECUTION
// =====================

/**
 * Execute the player's turn based on selected action.
 */
export function executePlayerTurn(action: PlayerAction): void {
    const store = useBattleStore.getState();

    if (store.state !== 'PLAYER_INPUT' || !store.monster || !store.playerStats) {
        console.warn('[BattleService] Invalid state for player turn');
        return;
    }

    // Phase 5: Check if player should skip turn due to hard CC
    const player = store.player;
    if (player) {
        const skipCheck = shouldSkipTurn(player as any);
        if (skipCheck.skip) {
            // Log the skip
            store.addLogEntry({
                turn: store.turnNumber,
                actor: 'player',
                action: `You are ${skipCheck.reason}!`,
                result: 'miss',
            });

            // Tick status effects (decrement durations, apply DoT, clear stun)
            const tickResult = tickStatusEffects(player as any, store.turnNumber);

            // Apply DoT damage
            if (tickResult.damageTaken > 0) {
                const newHP = Math.max(0, store.playerCurrentHP - tickResult.damageTaken);
                store.updatePlayerHP(newHP);

                for (const entry of tickResult.logEntries) {
                    store.addLogEntry({
                        turn: store.turnNumber,
                        actor: 'player',
                        action: entry,
                    });
                }

                // Check for death from DoT
                if (newHP <= 0) {
                    handleDefeat();
                    return;
                }
            }

            // Persist updated status effects to store
            store.updatePlayer({ volatileStatusEffects: [...player.volatileStatusEffects] });

            // Skip to enemy turn without processing player action
            store.advanceState('ENEMY_TURN');
            executeMonsterTurn();
            return;
        }
    }

    store.selectAction(action);
    store.advanceState('PROCESSING_TURN');

    switch (action) {
        case 'attack':
            executePlayerAttack();
            break;
        case 'defend':
            executePlayerDefend();
            break;
        case 'skill':
            executePlayerSkill();
            break;
        case 'retreat':
            executePlayerRetreat();
            break;
        case 'item':
            // Item usage handled separately via consumables
            // For now, skip turn
            store.advanceState('ENEMY_TURN');
            break;
    }
}

/**
 * Execute player attack action
 */
function executePlayerAttack(): void {
    const store = useBattleStore.getState();
    const { playerStats, monster, playerCurrentHP, playerCurrentMana } = store;

    if (!playerStats || !monster) return;

    // Calculate damage based on attack style
    const { damage, attackPower, defenderDef, result } = calculatePlayerDamage(playerStats, monster);

    // Apply damage
    const newMonsterHP = Math.max(0, monster.currentHP - damage);
    store.updateMonsterHP(newMonsterHP);

    // Log the attack
    store.addLogEntry({
        turn: store.turnNumber,
        actor: 'player',
        action: playerStats.attackName,
        damage,
        result,
        newHP: newMonsterHP,
    });

    // Transition to animation, then check outcome
    store.advanceState('ANIMATING_PLAYER');

    // After animation (simulate with timeout for now)
    setTimeout(() => {
        checkBattleOutcome();
    }, 500);
}

/**
 * Calculate player damage using attack style logic
 */
function calculatePlayerDamage(
    player: CombatStats,
    monster: BattleMonster
): { damage: number; attackPower: number; defenderDef: number; result: DamageResult } {
    let attackPower: number;
    let defenderDef: number;

    switch (player.attackStyle) {
        case 'magic':
            attackPower = player.magicAttack;
            defenderDef = monster.magicDefense;
            break;

        case 'hybrid_physical':
            // Paladin: 70% physical + 30% magic
            const physDmg1 = player.physicalAttack - monster.defense;
            const magDmg1 = player.magicAttack - monster.magicDefense;
            attackPower = Math.floor(Math.max(1, physDmg1) * 0.7 + Math.max(1, magDmg1) * 0.3);
            defenderDef = 0; // Already factored in
            break;

        case 'hybrid_magic':
            // Bard: 30% physical + 70% magic
            const physDmg2 = player.physicalAttack - monster.defense;
            const magDmg2 = player.magicAttack - monster.magicDefense;
            attackPower = Math.floor(Math.max(1, physDmg2) * 0.3 + Math.max(1, magDmg2) * 0.7);
            defenderDef = 0; // Already factored in
            break;

        default: // physical
            attackPower = player.physicalAttack;
            defenderDef = monster.defense;
            break;
    }

    // Apply class damage modifier
    attackPower = Math.floor(attackPower * player.damageModifier);

    // Phase 5: Get stat stages from BattlePlayer and BattleMonster
    const battlePlayer = useBattleStore.getState().player;
    const playerAtkStage = battlePlayer?.statStages.atk ?? 0;
    const monsterDefStage = monster.statStages?.def ?? 0;

    // Calculate with dodge, crit, variance, and stat stages
    const damageResult = calculateDamage(
        attackPower,
        player.critChance,
        defenderDef,
        monster.dodgeChance,
        0, // Monsters don't have block
        playerAtkStage,
        monsterDefStage
    );

    return {
        damage: damageResult.damage,
        attackPower,
        defenderDef,
        result: damageResult.result,
    };
}

/**
 * Execute player defend action
 */
function executePlayerDefend(): void {
    const store = useBattleStore.getState();

    store.setPlayerDefending(true);
    store.addLogEntry({
        turn: store.turnNumber,
        actor: 'player',
        action: 'Defend',
        result: 'hit',
    });

    // Skip to enemy turn
    store.advanceState('ENEMY_TURN');
    executeMonsterTurn();
}

/**
 * Execute player retreat attempt
 */
function executePlayerRetreat(): void {
    const store = useBattleStore.getState();
    const character = useCharacterStore.getState().character;

    if (!character || !store.playerStats) return;

    // Run chance: 30% + (CHA * 2%)
    const charisma = character.baseStats.charisma + (character.statBonuses?.charisma || 0);
    const runChance = 30 + (charisma * 2);
    const roll = Math.random() * 100;

    if (roll < runChance) {
        // Successful retreat
        store.addLogEntry({
            turn: store.turnNumber,
            actor: 'player',
            action: 'Retreat',
            result: 'hit',
        });

        // Phase 5: Copy volatile status effects back to persistent storage
        copyVolatileStatusToPersistent();

        store.endBattle('retreat');
    } else {
        // Failed retreat - take 15% HP damage
        const damage = Math.floor(store.playerStats.maxHP * 0.15);
        const newHP = Math.max(0, store.playerCurrentHP - damage);
        store.updatePlayerHP(newHP);

        store.addLogEntry({
            turn: store.turnNumber,
            actor: 'player',
            action: 'Failed Retreat',
            damage,
            result: 'hit',
            newHP,
        });

        // Check if died from retreat
        if (newHP <= 0) {
            handleDefeat();
        } else {
            // Enemy gets a turn
            store.advanceState('ENEMY_TURN');
            executeMonsterTurn();
        }
    }
}

// =====================
// MONSTER TURN
// =====================

/**
 * Execute the monster's turn using skill AI.
 * Phase 4C: Monsters now use skills instead of basic attacks.
 */
export function executeMonsterTurn(): void {
    const store = useBattleStore.getState();
    const { monster, player, playerStats, playerCurrentHP, isPlayerDefending } = store;

    if (!monster || !playerStats) return;

    // Phase 5: Check if monster should skip turn due to hard CC
    const skipCheck = shouldSkipTurn(monster as any);
    if (skipCheck.skip) {
        // Log the skip
        store.addLogEntry({
            turn: store.turnNumber,
            actor: 'monster',
            action: `${monster.name} is ${skipCheck.reason}!`,
            result: 'miss',
        });

        // Tick monster's status effects (decrement durations, apply DoT, clear stun)
        const tickResult = tickStatusEffects(monster as any, store.turnNumber);

        // Apply DoT damage to monster
        if (tickResult.damageTaken > 0) {
            const newHP = Math.max(0, monster.currentHP - tickResult.damageTaken);
            store.updateMonsterHP(newHP);

            for (const entry of tickResult.logEntries) {
                store.addLogEntry({
                    turn: store.turnNumber,
                    actor: 'monster',
                    action: entry,
                });
            }

            // Check for victory from DoT
            if (newHP <= 0) {
                handleVictory();
                return;
            }
        }

        // Persist updated status effects to store
        store.updateMonster({ statusEffects: [...(monster.statusEffects ?? [])] });

        // Advance turn and return to player input
        store.incrementTurn();
        store.advanceState('PLAYER_INPUT');
        return;
    }

    // Phase 4C: Select a skill using AI
    const selectedSkill = selectMonsterSkillAI(
        monster.currentHP,
        monster.maxHP,
        monster.skills,
        monster.skillsUsedThisBattle ?? []
    );

    // If monster has no skills, fall back to basic attack
    if (!selectedSkill) {
        executeMonsterBasicAttack();
        return;
    }

    // Execute the selected skill
    executeMonsterSkill(selectedSkill);
}

/**
 * Execute a monster skill with full effect handling.
 * Handles damage, status effects, stage changes, lifesteal, and self-cure.
 */
function executeMonsterSkill(skill: MonsterSkill): void {
    const store = useBattleStore.getState();
    const { monster, player, playerStats, playerCurrentHP, isPlayerDefending } = store;

    if (!monster || !playerStats || !player) return;

    let damage = 0;
    let damageResult: DamageResult = 'hit';
    const logMessages: string[] = [];

    // Calculate damage if skill has power > 0
    if (skill.power > 0) {
        // Get stat stages
        const monsterAtkStage = monster.statStages?.atk ?? 0;
        const playerDefStage = player.statStages.def ?? 0;

        // Calculate base attack power with skill multiplier
        const baseAttack = Math.floor(monster.attack * (skill.power / 100));

        // Determine which defense to use based on damage type
        const playerDef = skill.damageType === 'magic' ? playerStats.magicDefense : playerStats.defense;

        // Calculate damage
        const result = calculateDamage(
            baseAttack,
            monster.critChance,
            playerDef,
            playerStats.dodgeChance,
            playerStats.blockChance,
            monsterAtkStage,
            playerDefStage
        );

        damage = result.damage;
        damageResult = result.result;

        // Defending halves damage
        if (isPlayerDefending) {
            damage = Math.floor(damage * 0.5);
        }

        // Apply lifesteal if present
        if (skill.lifesteal && skill.lifesteal > 0 && damage > 0) {
            const healAmount = Math.floor(damage * skill.lifesteal);
            const newMonsterHP = Math.min(monster.maxHP, monster.currentHP + healAmount);
            store.updateMonsterHP(newMonsterHP);
            logMessages.push(`Drained ${healAmount} HP!`);
        }
    }

    // Apply status effect if present and chance succeeds
    if (skill.statusEffect && Math.random() * 100 < skill.statusEffect.chance) {
        const effectId = `monster_${skill.id}_${store.turnNumber}_${Date.now()}`;
        const effect: import('../models/StatusEffect').StatusEffect = {
            id: effectId,
            type: skill.statusEffect.type,
            duration: skill.statusEffect.duration,
            severity: skill.statusEffect.severity,
            source: 'monster',
            sourceSkillId: skill.id,
        };

        // Add to player's volatile status effects
        const newEffects = [...player.volatileStatusEffects, effect];
        store.updatePlayer({ volatileStatusEffects: newEffects });
        // Use proper past tense for status effect messages
        const statusName = getStatusDisplayName(skill.statusEffect.type);
        logMessages.push(`You are now ${statusName}!`);
    }

    // Apply stage effect if present
    if (skill.stageEffect) {
        if (skill.stageEffect.target === 'self') {
            // Buff monster
            const newStages = { ...monster.statStages };
            newStages[skill.stageEffect.stat] = Math.max(-6, Math.min(6,
                (newStages[skill.stageEffect.stat] ?? 0) + skill.stageEffect.stages
            ));
            store.updateMonster({ statStages: newStages });
            const statName = skill.stageEffect.stat.toUpperCase();
            const direction = skill.stageEffect.stages > 0 ? 'rose' : 'fell';
            logMessages.push(`${monster.name}'s ${statName} ${direction}!`);
        } else {
            // Debuff player
            const newStages = { ...player.statStages };
            newStages[skill.stageEffect.stat] = Math.max(-6, Math.min(6,
                (newStages[skill.stageEffect.stat] ?? 0) + skill.stageEffect.stages
            ));
            store.updatePlayer({ statStages: newStages });
            const statName = skill.stageEffect.stat.toUpperCase();
            const direction = skill.stageEffect.stages > 0 ? 'rose' : 'fell';
            logMessages.push(`Your ${statName} ${direction}!`);
        }
    }

    // Self-cure: remove all debuffs from monster
    if (skill.selfCure) {
        const currentEffects = monster.statusEffects ?? [];
        if (currentEffects.length > 0) {
            store.updateMonster({ statusEffects: [] });
            logMessages.push(`${monster.name} cured all ailments!`);
        }
    }

    // Apply damage to player
    let newHP = playerCurrentHP;
    if (damage > 0) {
        newHP = Math.max(0, playerCurrentHP - damage);
        store.updatePlayerHP(newHP);
    }

    // Build log entry - include skill name and damage
    store.addLogEntry({
        turn: store.turnNumber,
        actor: 'monster',
        action: `${skill.icon} ${skill.name}`,
        damage: damage > 0 ? damage : undefined,
        result: damageResult,
        newHP: damage > 0 ? newHP : undefined,
    });

    // Log additional effects as separate entries (no "Enemy used" prefix)
    // Use 'player' actor since these are descriptions of what happened TO the player
    for (const msg of logMessages) {
        store.addLogEntry({
            turn: store.turnNumber,
            actor: 'player', // Shows without "Enemy used" prefix
            action: msg,
            result: 'hit',
        });
    }

    store.advanceState('ANIMATING_ENEMY');

    // After animation, check outcome and advance turn
    setTimeout(() => {
        const currentStore = useBattleStore.getState();
        if (currentStore.playerCurrentHP <= 0) {
            handleDefeat();
        } else {
            // Next turn
            currentStore.incrementTurn();
            currentStore.advanceState('PLAYER_INPUT');
        }
    }, 500);
}

/**
 * Fallback basic attack when monster has no skills.
 */
function executeMonsterBasicAttack(): void {
    const store = useBattleStore.getState();
    const { monster, player, playerStats, playerCurrentHP, isPlayerDefending } = store;

    if (!monster || !playerStats) return;

    const monsterAtkStage = monster.statStages?.atk ?? 0;
    const playerDefStage = player?.statStages.def ?? 0;

    const damageResult = calculateDamage(
        monster.attack,
        monster.critChance,
        playerStats.defense,
        playerStats.dodgeChance,
        playerStats.blockChance,
        monsterAtkStage,
        playerDefStage
    );

    let damage = damageResult.damage;

    if (isPlayerDefending) {
        damage = Math.floor(damage * 0.5);
    }

    const newHP = Math.max(0, playerCurrentHP - damage);
    store.updatePlayerHP(newHP);

    store.addLogEntry({
        turn: store.turnNumber,
        actor: 'monster',
        action: 'Attack',
        damage,
        result: damageResult.result,
        newHP,
    });

    store.advanceState('ANIMATING_ENEMY');

    setTimeout(() => {
        const currentStore = useBattleStore.getState();
        if (currentStore.playerCurrentHP <= 0) {
            handleDefeat();
        } else {
            currentStore.incrementTurn();
            currentStore.advanceState('PLAYER_INPUT');
        }
    }, 500);
}

// =====================
// OUTCOME HANDLING
// =====================

/**
 * Check if battle has ended (victory/defeat)
 */
function checkBattleOutcome(): void {
    const store = useBattleStore.getState();

    if (!store.monster) return;

    if (store.monster.currentHP <= 0) {
        handleVictory();
    } else if (store.playerCurrentHP <= 0) {
        handleDefeat();
    } else {
        // Continue battle - monster's turn
        store.advanceState('ENEMY_TURN');
        executeMonsterTurn();
    }
}

/**
 * Handle player victory
 */
function handleVictory(): void {
    const store = useBattleStore.getState();
    const characterStore = useCharacterStore.getState();
    const { monster, lootBonus } = store;
    const character = characterStore.character;

    if (!monster || !character) return;

    // Capture old XP for level-up check
    const oldXP = character.isTrainingMode ? character.trainingXP : character.totalXP;
    const isTrainingMode = character.isTrainingMode;

    // Award XP
    characterStore.addXP(monster.xpReward);

    // Get new XP after award
    const updatedChar = useCharacterStore.getState().character;
    const newXP = updatedChar?.isTrainingMode ? updatedChar.trainingXP : updatedChar?.totalXP ?? 0;

    // Award gold
    characterStore.updateGold(monster.goldReward);

    // Sync HP/Mana to character (battle damage persists)
    // Need to set absolute values, not delta, and update stored maxHP to derived value
    // IMPORTANT: Get fresh character AFTER addXP/updateGold to preserve those changes
    const updatedCharacter = useCharacterStore.getState().character;
    if (updatedCharacter && store.playerStats) {
        useCharacterStore.getState().setCharacter({
            ...updatedCharacter,
            currentHP: store.playerCurrentHP,
            maxHP: store.playerStats.maxHP, // Store derived maxHP so comparisons work next time
            currentMana: store.playerCurrentMana,
            maxMana: store.playerStats.maxMana,
            lastModified: new Date().toISOString(),
        });
    }

    // End battle
    store.endBattle('victory');

    // Phase 5: Copy volatile status effects back to persistent storage
    copyVolatileStatusToPersistent();

    // === ACTIVITY LOGGING (Phase 4) ===
    // Log combat victory for progress tracking (all fights, not just bounties)
    // IMPORTANT: This must happen BEFORE saveCallback so activity history is persisted
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    useCharacterStore.getState().logActivity({
        type: 'bounty_victory',
        date: dateString,
        xpGained: monster.xpReward,
        goldGained: monster.goldReward,
        monsterId: monster.templateId || monster.id,
        details: `Defeated ${monster.name}`,
    });

    // Persist character data (XP, gold, HP, activity history)
    if (saveCallback) {
        saveCallback().catch(err => console.error('[BattleService] Save failed:', err));
    }

    // Check for level-up and show modal if needed
    triggerLevelUpIfNeeded(oldXP, newXP, isTrainingMode);

    // Loot is generated separately when victory modal is shown
    // The lootBonus is stored for the modal to use
}

/**
 * Handle player defeat
 */
function handleDefeat(): void {
    const store = useBattleStore.getState();
    const characterStore = useCharacterStore.getState();
    const character = characterStore.character;

    if (!character) return;

    // Calculate 10% gold penalty (applied in setCharacter below)
    const goldLost = Math.floor(character.gold * DEFEAT_GOLD_PENALTY);

    // Set HP to 0 (defeated), status to unconscious - preserve derived maxHP for next session
    if (store.playerStats) {
        characterStore.setCharacter({
            ...character,
            gold: character.gold - goldLost,
            currentHP: 0,
            maxHP: store.playerStats.maxHP,
            status: 'unconscious',
            lastModified: new Date().toISOString(),
        });
    } else {
        // Fallback: just set HP to 0, status to unconscious
        characterStore.setCharacter({
            ...character,
            gold: character.gold - goldLost,
            currentHP: 0,
            status: 'unconscious',
            lastModified: new Date().toISOString(),
        });
    }

    store.endBattle('defeat');

    // Phase 5: Copy volatile status effects back to persistent storage
    copyVolatileStatusToPersistent();

    // === ACTIVITY LOGGING (Phase 4) ===
    // Log combat defeat for progress tracking
    // IMPORTANT: This must happen BEFORE saveCallback so activity history is persisted
    if (store.monster) {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        useCharacterStore.getState().logActivity({
            type: 'bounty_defeat',
            date: dateString,
            xpGained: 0,
            goldGained: -goldLost,
            monsterId: store.monster.templateId || store.monster.id,
            details: `Lost to ${store.monster.name}`,
        });
    }

    // Persist character data (gold penalty, HP = 0, unconscious, activity history)
    if (saveCallback) {
        saveCallback().catch(err => console.error('[BattleService] Save failed:', err));
    }
}

/**
 * Generate loot after victory.
 * Called when showing victory rewards.
 */
export function generateVictoryLoot(): ReturnType<typeof lootGenerationService.generateCombatLoot> {
    const store = useBattleStore.getState();
    const character = useCharacterStore.getState().character;
    const { monster, lootBonus } = store;

    if (!monster || !character) return [];

    // Pass actual monster tier directly to loot service
    const loot = lootGenerationService.generateCombatLoot(
        monster.tier,
        monster.level,
        character,
        undefined // No unique drop ID for random fights
    );

    return loot;
}

// =====================
// BATTLE UTILITIES
// =====================

/**
 * Check if player can start a random fight (has stamina)
 */
export function canStartRandomFight(): boolean {
    const character = useCharacterStore.getState().character;
    return character ? character.stamina >= 1 : false;
}

/**
 * Consume stamina for a random fight
 */
export function consumeStaminaForFight(): boolean {
    const characterStore = useCharacterStore.getState();
    return characterStore.consumeStamina();
}

/**
 * Get current battle state summary for UI
 */
export function getBattleStateSummary() {
    const store = useBattleStore.getState();

    return {
        isInCombat: store.isInCombat,
        state: store.state,
        playerHP: store.playerCurrentHP,
        playerMaxHP: store.playerStats?.maxHP ?? 0,
        monsterHP: store.monster?.currentHP ?? 0,
        monsterMaxHP: store.monster?.maxHP ?? 0,
        monsterName: store.monster?.name ?? '',
        turnNumber: store.turnNumber,
        log: store.log,
    };
}

// =====================
// SKILL EXECUTION
// =====================

// Import skill and status services at module scope
// These will be used by executePlayerSkill
import {
    executeSkill,
    getSkillById,
    validateSkillUse,
    isIncapacitated,
    SkillResult,
    SkillExecutionContext,
} from './SkillService';
import { tickStatusEffects, wakeFromSleep, breakFreeze, shouldSkipTurn } from './StatusEffectService';
import { ElementalType, CLASS_ELEMENTAL_TYPES } from '../models/Skill';

/**
 * Currently selected skill ID for execution.
 * Set by UI before calling executePlayerTurn('skill').
 */
let selectedSkillId: string | null = null;

/**
 * Set the skill ID to execute on next skill action.
 * Called by BattleView when player selects a skill.
 */
export function setSelectedSkill(skillId: string): void {
    selectedSkillId = skillId;
}

/**
 * Get the currently selected skill ID.
 */
export function getSelectedSkill(): string | null {
    return selectedSkillId;
}

/**
 * Clear the selected skill after use.
 */
export function clearSelectedSkill(): void {
    selectedSkillId = null;
}

/**
 * Execute a player skill action.
 * Called when action === 'skill' in executePlayerTurn.
 */
export function executePlayerSkill(): void {
    const store = useBattleStore.getState();
    const { player, playerStats, monster, playerCurrentMana } = store;
    const character = useCharacterStore.getState().character;

    if (!player || !playerStats || !monster || !character) {
        console.warn('[BattleService] Invalid state for skill execution');
        store.advanceState('PLAYER_INPUT');
        return;
    }

    // Validate skill selection
    if (!selectedSkillId) {
        console.warn('[BattleService] No skill selected');
        store.advanceState('PLAYER_INPUT');
        return;
    }

    // Get skill definition
    const skill = getSkillById(selectedSkillId);
    if (!skill) {
        console.warn(`[BattleService] Skill not found: ${selectedSkillId}`);
        clearSelectedSkill();
        store.advanceState('PLAYER_INPUT');
        return;
    }

    // Validate skill use
    const validation = validateSkillUse(
        skill,
        playerCurrentMana,
        player.skillsUsedThisBattle,
        isIncapacitated(player as any)
    );

    if (!validation.valid) {
        store.addLogEntry({
            turn: store.turnNumber,
            actor: 'player',
            action: `${skill.name} failed`,
            result: 'miss',
        });
        clearSelectedSkill();
        store.advanceState('PLAYER_INPUT');
        return;
    }

    // Get elemental types for effectiveness
    const userType: ElementalType = CLASS_ELEMENTAL_TYPES[character.class];
    const targetType: ElementalType = monster.statStages
        ? (monster as any).elementalType ?? 'Physical'
        : 'Physical';

    // Create execution context
    const context: SkillExecutionContext = {
        user: player as any,
        target: monster as any,
        userType,
        targetType,
        skillType: skill.elementalType,
        turnNumber: store.turnNumber,
    };

    // Execute the skill
    const result = executeSkill(skill, context);

    // Deduct mana cost
    const newMana = Math.max(0, playerCurrentMana - skill.manaCost);
    store.updatePlayerMana(newMana);

    // Track skill usage for once-per-battle skills
    if (skill.usesPerBattle !== undefined) {
        store.updatePlayer({
            skillsUsedThisBattle: [...player.skillsUsedThisBattle, skill.id],
        });
    }

    // Apply damage to monster
    if (result.damage && result.damage > 0) {
        const newMonsterHP = Math.max(0, monster.currentHP - result.damage);
        store.updateMonsterHP(newMonsterHP);

        // Wake from sleep on direct damage
        if ((monster as any).statusEffects?.some((e: any) => e.type === 'sleep')) {
            wakeFromSleep(monster as any);
        }

        // Fire breaks freeze
        if (skill.elementalType === 'Fire') {
            breakFreeze(monster as any, 'Fire');
        }
    }

    // Apply healing to player
    if (result.healing && result.healing > 0) {
        const newHP = Math.min(player.maxHP, player.currentHP + result.healing);
        store.updatePlayerHP(newHP);
    }

    // Apply mana restoration (Meditate)
    if (result.manaRestored && result.manaRestored > 0) {
        const restoredMana = Math.min(player.maxMana, newMana + result.manaRestored);
        store.updatePlayerMana(restoredMana);
    }

    // Apply stage changes to player/monster
    if (result.stageChanges) {
        for (const change of result.stageChanges) {
            if (change.target === 'self') {
                store.updatePlayer({
                    statStages: {
                        ...player.statStages,
                        [change.stat]: (player.statStages[change.stat] ?? 0) + change.delta,
                    },
                });
            } else {
                // Monster stage changes update the monster object
                const currentMonster = store.monster!;
                store.updateMonsterHP(currentMonster.currentHP); // Trigger update
            }
        }
    }

    // Log the skill use
    store.addLogEntry({
        turn: store.turnNumber,
        actor: 'player',
        action: skill.name,
        damage: result.damage,
        result: result.isCrit ? 'critical' : result.damage ? 'hit' : 'heal',
        newHP: monster.currentHP - (result.damage ?? 0),
    });

    // Add additional log entries (type effectiveness, etc.)
    for (const logEntry of result.logEntries) {
        store.addLogEntry({
            turn: store.turnNumber,
            actor: 'player',
            action: logEntry,
        });
    }

    // Clear selected skill
    clearSelectedSkill();

    // Transition to animation, then check outcome
    store.advanceState('ANIMATING_PLAYER');

    // After animation, check outcome
    setTimeout(() => {
        checkBattleOutcomeWithStatusTick();
    }, 500);
}

/**
 * Check battle outcome and tick status effects at end of turn.
 */
function checkBattleOutcomeWithStatusTick(): void {
    const store = useBattleStore.getState();

    if (!store.monster) return;

    // Check for victory/defeat first
    if (store.monster.currentHP <= 0) {
        handleVictory();
        return;
    }

    if (store.playerCurrentHP <= 0) {
        handleDefeat();
        return;
    }

    // Tick status effects on player (DoT damage, duration, expiration)
    const player = store.player;
    if (player) {
        const tickResult = tickStatusEffects(player as any, store.turnNumber);

        // Apply DoT damage
        if (tickResult.damageTaken > 0) {
            const newHP = Math.max(0, store.playerCurrentHP - tickResult.damageTaken);
            store.updatePlayerHP(newHP);

            // Log DoT damage
            for (const entry of tickResult.logEntries) {
                store.addLogEntry({
                    turn: store.turnNumber,
                    actor: 'player',
                    action: entry,
                });
            }

            // Check for death from DoT
            if (newHP <= 0) {
                handleDefeat();
                return;
            }
        }

        // Persist updated status effects (stun cleared, durations decremented)
        store.updatePlayer({ volatileStatusEffects: [...player.volatileStatusEffects] });
    }

    // Continue battle - monster's turn
    store.advanceState('ENEMY_TURN');
    executeMonsterTurn();
}

// =====================
// EXPORTS
// =====================


export const battleService = {
    startRandomBattle,
    startBattleWithTemplate,
    startBattleWithMonster,
    executePlayerTurn,
    executePlayerSkill,
    executeMonsterTurn,
    generateVictoryLoot,
    canStartRandomFight,
    consumeStaminaForFight,
    getBattleStateSummary,
    setSelectedSkill,
    getSelectedSkill,
    clearSelectedSkill,
};
