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
} from '../config/combatConfig';

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
// TYPE CONVERSIONS
// =====================

/**
 * Convert Monster instance to BattleMonster (for store)
 */
export function monsterToBattleMonster(monster: Monster): BattleMonster {
    return {
        id: monster.id,
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
    };
}

// =====================
// BATTLE INITIALIZATION
// =====================

/**
 * Start a random encounter battle.
 * Returns true if battle started successfully.
 */
export function startRandomBattle(
    playerLevel: number,
    tier: MonsterTier = 'overworld',
    options?: { isBounty?: boolean; questId?: string }
): boolean {
    const character = useCharacterStore.getState().character;
    if (!character) {
        console.warn('[BattleService] No character loaded');
        return false;
    }

    const monster = createRandomMonster(playerLevel, tier);
    if (!monster) {
        console.warn('[BattleService] Failed to create monster');
        return false;
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

    console.log('[BattleService] Battle started:', {
        player: character.name,
        playerHP: playerStats.currentHP,
        monster: monster.name,
        monsterHP: monster.maxHP,
        tier: monster.tier,
    });

    return true;
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

    store.selectAction(action);
    store.advanceState('PROCESSING_TURN');

    switch (action) {
        case 'attack':
            executePlayerAttack();
            break;
        case 'defend':
            executePlayerDefend();
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

    console.log(`[BattleService] Player ${playerStats.attackName}: ${damage} damage (${result})`);

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

    // Calculate with dodge, crit, variance
    const damageResult = calculateDamage(
        attackPower,
        player.critChance,
        defenderDef,
        monster.dodgeChance,
        0 // Monsters don't have block
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

    console.log('[BattleService] Player defending');

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

        console.log('[BattleService] Retreat successful');
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

        console.log(`[BattleService] Retreat failed, took ${damage} damage`);

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
 * Execute the monster's turn (auto-attack)
 */
export function executeMonsterTurn(): void {
    const store = useBattleStore.getState();
    const { monster, playerStats, playerCurrentHP, isPlayerDefending } = store;

    if (!monster || !playerStats) return;

    // Monster always attacks
    const damageResult = calculateDamage(
        monster.attack,
        monster.critChance,
        playerStats.defense,
        playerStats.dodgeChance,
        playerStats.blockChance
    );

    let damage = damageResult.damage;

    // Defending halves damage
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

    console.log(`[BattleService] ${monster.name} attacks: ${damage} damage (${damageResult.result})`);

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

    if (!monster) return;

    console.log('[BattleService] Victory!', {
        monster: monster.name,
        xp: monster.xpReward,
        gold: monster.goldReward,
    });

    // Award XP
    characterStore.addXP(monster.xpReward);

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

    // Persist character data (XP, gold, HP)
    if (saveCallback) {
        saveCallback().catch(err => console.error('[BattleService] Save failed:', err));
    }

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

    // Set HP to 0 (defeated) - preserve derived maxHP for next session
    if (store.playerStats) {
        characterStore.setCharacter({
            ...character,
            gold: character.gold - goldLost,
            currentHP: 0,
            maxHP: store.playerStats.maxHP,
            lastModified: new Date().toISOString(),
        });
    } else {
        // Fallback: just set HP to 0
        characterStore.setCharacter({
            ...character,
            gold: character.gold - goldLost,
            currentHP: 0,
            lastModified: new Date().toISOString(),
        });
    }

    console.log('[BattleService] Defeat!', {
        goldLost,
    });

    store.endBattle('defeat');

    // Persist character data (gold penalty, HP = 0)
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

    // Map monster tier to loot tier
    const lootTier = monster.tier === 'raid_boss' || monster.tier === 'boss'
        ? 'boss'
        : monster.tier === 'elite'
            ? 'elite'
            : 'normal';

    const loot = lootGenerationService.generateCombatLoot(
        lootTier,
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
// EXPORTS
// =====================

export const battleService = {
    startRandomBattle,
    startBattleWithTemplate,
    startBattleWithMonster,
    executePlayerTurn,
    executeMonsterTurn,
    generateVictoryLoot,
    canStartRandomFight,
    consumeStaminaForFight,
    getBattleStateSummary,
};
