/**
 * Battle View Component
 * 
 * Full-page combat interface with monster/player display,
 * action buttons, HP bars, and combat log.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'obsidian';
import { useBattleStore, CombatLogEntry, PlayerAction } from '../store/battleStore';
import { useCharacterStore } from '../store/characterStore';
import { CLASS_INFO } from '../models/Character';
import { CONSUMABLES, ConsumableEffect } from '../models/Consumable';
import { battleService } from '../services/BattleService';
import { LootDrop } from '../models/Gear';
import { getSkillById } from '../data/skills';
import { Skill } from '../models/Skill';
import { StatusEffect, getStatusIcon, getStatusDisplayName } from '../models/StatusEffect';
import { formatSkillTooltipBattle } from '../utils/skillFormatters';


// =====================
// TYPES
// =====================

interface BattleViewProps {
    onBattleEnd: () => void;
    onShowLoot?: (loot: LootDrop) => void;
    onDefeat?: () => void;  // Custom defeat handler (for dungeon death modal)
    onOpenRecoveryModal?: () => void;
    playerSpritePath?: string;
    monsterSpritePath?: string;
    backgroundPath?: string;
}

// =====================
// STAGE INDICATORS
// =====================

interface StageIndicatorsProps {
    stages: { atk: number; def: number; speed: number };
    compact?: boolean;
}

/**
 * Display stat stage modifiers (+/- indicators)
 */
function StageIndicators({ stages, compact = false }: StageIndicatorsProps) {
    const indicators: { stat: string; value: number; icon: string }[] = [];

    if (stages.atk !== 0) {
        indicators.push({ stat: 'ATK', value: stages.atk, icon: '⚔️' });
    }
    if (stages.def !== 0) {
        indicators.push({ stat: 'DEF', value: stages.def, icon: '🛡️' });
    }
    if (stages.speed !== 0) {
        indicators.push({ stat: 'SPD', value: stages.speed, icon: '⚡' });
    }

    if (indicators.length === 0) return null;

    return (
        <div className={`qb-stage-indicators ${compact ? 'qb-stage-compact' : ''}`}>
            {indicators.map(({ stat, value, icon }) => (
                <span
                    key={stat}
                    className={`qb-stage-indicator ${value > 0 ? 'qb-stage-buff' : 'qb-stage-debuff'}`}
                    title={`${stat} ${value > 0 ? '+' : ''}${value} stages`}
                >
                    {icon} {value > 0 ? '+' : ''}{value}
                </span>
            ))}
        </div>
    );
}

// =====================
// STATUS INDICATORS
// =====================

interface StatusIndicatorsProps {
    effects: StatusEffect[];
    compact?: boolean;
}

/**
 * Display active status effects with icons
 */
function StatusIndicators({ effects, compact = false }: StatusIndicatorsProps) {
    if (!effects || effects.length === 0) return null;

    return (
        <div className={`qb-status-indicators ${compact ? 'qb-status-compact' : ''}`}>
            {effects.map((effect) => (
                <span
                    key={effect.id}
                    className={`qb-status-indicator qb-status-${effect.type}`}
                    title={`${getStatusDisplayName(effect.type)}${effect.duration > 0 ? ` (${effect.duration} turns)` : ''}`}
                >
                    {getStatusIcon(effect.type)}
                </span>
            ))}
        </div>
    );
}

// =====================
// SUB-COMPONENTS
// =====================

/**
 * Monster display section
 */
function MonsterDisplay({ spritePath }: { spritePath?: string }) {
    const monster = useBattleStore(state => state.monster);
    const monsterHP = useBattleStore(state => state.monster?.currentHP ?? 0);
    const monsterMaxHP = useBattleStore(state => state.monster?.maxHP ?? 1);
    const combatState = useBattleStore(state => state.state);

    if (!monster) return null;

    const hpPercent = Math.max(0, (monsterHP / monsterMaxHP) * 100);
    const monsterStages = monster.statStages ?? { atk: 0, def: 0, speed: 0 };

    // Determine tint class based on monster name prefix
    let tintClass = '';
    if (monster.name.startsWith('Fierce')) tintClass = 'qb-tint-fierce';
    else if (monster.name.startsWith('Sturdy')) tintClass = 'qb-tint-sturdy';
    else if (monster.name.startsWith('Ancient')) tintClass = 'qb-tint-ancient';

    // Elite class for red glow animation
    const eliteClass = monster.tier === 'elite' ? 'qb-elite-monster' : '';

    // Boss class for pulsing red border
    const isBoss = monster.tier === 'boss' || monster.tier === 'raid_boss';
    const bossClass = isBoss ? 'qb-boss-monster' : '';
    const bossSpriteClass = isBoss ? 'qb-boss-sprite' : '';

    // Animation class based on state
    const animClass = combatState === 'ANIMATING_ENEMY' ? 'qb-monster-attacking' : '';

    // Get tier badge text
    const tierBadge = monster.tier === 'raid_boss' ? 'RAID BOSS' :
        monster.tier === 'boss' ? 'BOSS' :
            monster.tier === 'elite' ? 'ELITE' : null;

    return (
        <div className={`qb-battle-monster ${eliteClass} ${bossClass}`}>
            <div className="qb-monster-info">
                <span className="qb-monster-name">
                    {monster.name}
                    {tierBadge && (
                        <span className={`qb-tier-badge qb-tier-${monster.tier}`}>
                            {tierBadge}
                        </span>
                    )}
                </span>
                <span className="qb-monster-level">Lv. {monster.level}</span>
            </div>
            <div className={`qb-hp-bar qb-monster-hp ${isBoss ? 'qb-boss-hp-bar' : ''}`}>
                <div
                    className="qb-hp-fill"
                    style={{ width: `${hpPercent}%` }}
                />
                <span className="qb-hp-text">{monsterHP} / {monsterMaxHP}</span>
            </div>
            <StageIndicators stages={monsterStages} compact />
            <StatusIndicators effects={monster.statusEffects ?? []} compact />
            <div className={`qb-monster-sprite ${tintClass} ${animClass} ${bossSpriteClass}`}>
                {spritePath ? (
                    <img
                        src={spritePath}
                        alt={`${monster.name} sprite`}
                        className="qb-sprite-image"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}
                <span className={`qb-sprite-emoji ${spritePath ? 'hidden' : ''}`}>{monster.emoji}</span>
            </div>
        </div>
    );
}

/**
 * Player display section
 */
function PlayerDisplay({ spritePath }: { spritePath?: string }) {
    const playerStats = useBattleStore(state => state.playerStats);
    const playerHP = useBattleStore(state => state.playerCurrentHP);
    const playerMana = useBattleStore(state => state.playerCurrentMana);
    const player = useBattleStore(state => state.player);
    const isDefending = useBattleStore(state => state.isPlayerDefending);
    const combatState = useBattleStore(state => state.state);
    const character = useCharacterStore(state => state.character);

    if (!playerStats || !character) return null;

    const hpPercent = Math.max(0, (playerHP / playerStats.maxHP) * 100);
    const manaPercent = Math.max(0, (playerMana / playerStats.maxMana) * 100);
    const classInfo = CLASS_INFO[character.class];
    const playerStages = player?.statStages ?? { atk: 0, def: 0, speed: 0 };

    // Animation class based on state
    const animClass = combatState === 'ANIMATING_PLAYER' ? 'qb-player-attacking' : '';

    return (
        <div className="qb-battle-player">
            <div className="qb-player-info">
                <span className="qb-player-name">{character.name}</span>
                <span className="qb-player-class">Lv. {character.level} {classInfo.name}</span>
                <StageIndicators stages={playerStages} />
                <StatusIndicators effects={player?.volatileStatusEffects ?? []} />
            </div>
            <div className={`qb-player-sprite ${animClass}`}>
                {spritePath ? (
                    <img
                        src={spritePath}
                        alt={`${character.name} sprite`}
                        className="qb-sprite-image"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}
                <span className={`qb-sprite-emoji ${spritePath ? 'hidden' : ''}`}>{classInfo.emoji}</span>
                {isDefending && <span className="qb-defending-indicator">🛡️</span>}
            </div>
            <div className="qb-player-bars">
                <div className="qb-hp-bar qb-player-hp">
                    <div
                        className="qb-hp-fill"
                        style={{ width: `${hpPercent}%` }}
                    />
                    <span className="qb-hp-text">❤️ {playerHP} / {playerStats.maxHP}</span>
                </div>
                <div className="qb-mana-bar">
                    <div
                        className="qb-mana-fill"
                        style={{ width: `${manaPercent}%` }}
                    />
                    <span className="qb-mana-text">💧 {playerMana} / {playerStats.maxMana}</span>
                </div>
            </div>
        </div>
    );
}

/**
 * Combat log with latest message prominently displayed
 */
function CombatLog() {
    const log = useBattleStore(state => state.log);
    const logRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new entries
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [log.length]);

    const latestEntry = log.length > 0 ? log[log.length - 1] : null;

    // Format log entry for display
    const formatLogEntry = (entry: CombatLogEntry): string => {
        const action = entry.action;

        // Special messages that should display as-is (no actor prefix)
        // Patterns that must be at the START of the message
        const startsWithPatterns = [
            "It's super effective",
            "It's not very effective",
            "Used ",
            "Dealt ",
            "Restored ",
            "Cured",
            "Critical hit",
            "You are ",  // "You are stunned!" or "You are now Bleeding!"
            "Enemy is ",
            "Your ",
            "Enemy's ",
            "Took ",  // DoT damage: "Took 68 burning damage!"
            "No longer",  // "No longer stunned!"
        ];

        // Patterns that can appear ANYWHERE in the message
        const containsPatterns = [
            " wore off",  // "Burning wore off!"
            "'s ",  // Possessive messages like "Wolf's ATK rose!"
            " is stunned",  // Monster CC: "Wolf is stunned!"
            " is asleep",
            " is frozen",
            " is paralyzed",
        ];

        const isSystemMessage =
            startsWithPatterns.some(pattern => action.startsWith(pattern)) ||
            containsPatterns.some(pattern => action.includes(pattern));

        if (isSystemMessage) {
            return action;
        }

        const actor = entry.actor === 'player' ? 'You' : 'Enemy';
        let message = `${actor} used ${action}`;

        if (entry.damage !== undefined && entry.damage > 0) {
            message += ` for ${entry.damage} damage`;
        }

        if (entry.result === 'critical') {
            message = `💥 CRITICAL! ${message}`;
        } else if (entry.result === 'miss') {
            message = `❌ MISS! ${actor}'s attack missed!`;
        } else if (entry.result === 'blocked') {
            message = `🛡️ BLOCKED! ${message}`;
        } else if (entry.result === 'heal') {
            message = `💚 ${action}`;
        }

        return message;
    };

    // Get CSS class for latest message based on result
    const getMessageClass = (entry: CombatLogEntry | null): string => {
        if (!entry) return '';
        switch (entry.result) {
            case 'critical': return 'qb-msg-crit';
            case 'miss': return 'qb-msg-miss';
            case 'blocked': return 'qb-msg-blocked';
            case 'heal': return 'qb-msg-heal';
            default: return entry.actor === 'player' ? 'qb-msg-player' : 'qb-msg-enemy';
        }
    };

    return (
        <div className="qb-combat-log-container">
            {latestEntry && (
                <div className={`qb-combat-latest ${getMessageClass(latestEntry)}`}>
                    {formatLogEntry(latestEntry)}
                </div>
            )}
            <div className="qb-combat-log" ref={logRef}>
                {log.slice(0, -1).map((entry, idx) => (
                    <div key={idx} className={`qb-log-entry ${getMessageClass(entry)}`}>
                        <span className="qb-log-turn">T{entry.turn}</span>
                        <span className="qb-log-text">{formatLogEntry(entry)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Consumable picker for item usage
 */
interface ConsumablePickerProps {
    onSelect: (itemId: string) => void;
    onCancel: () => void;
}

function ConsumablePicker({ onSelect, onCancel }: ConsumablePickerProps) {
    const inventory = useCharacterStore(state => state.inventory);

    // Filter to only HP/Mana potions that player has
    const availableConsumables = inventory.filter(item => {
        const def = CONSUMABLES[item.itemId];
        return def && (
            def.effect === ConsumableEffect.HP_RESTORE ||
            def.effect === ConsumableEffect.MANA_RESTORE
        );
    });

    if (availableConsumables.length === 0) {
        return (
            <div className="qb-consumable-picker">
                <div className="qb-picker-header">
                    <span>🧪 Use Item</span>
                    <button className="qb-picker-close" onClick={onCancel}>✕</button>
                </div>
                <div className="qb-picker-empty">
                    No potions available!
                </div>
            </div>
        );
    }

    return (
        <div className="qb-consumable-picker">
            <div className="qb-picker-header">
                <span>🧪 Use Item</span>
                <button className="qb-picker-close" onClick={onCancel}>✕</button>
            </div>
            <div className="qb-picker-items">
                {availableConsumables.map(item => {
                    const def = CONSUMABLES[item.itemId];
                    if (!def) return null;

                    const effectText = def.effect === ConsumableEffect.HP_RESTORE
                        ? `+${def.effectValue} HP`
                        : `+${def.effectValue} MP`;

                    return (
                        <button
                            key={item.itemId}
                            className="qb-picker-item"
                            onClick={() => onSelect(item.itemId)}
                        >
                            <span className="qb-item-emoji">{def.emoji}</span>
                            <span className="qb-item-name">{def.name}</span>
                            <span className="qb-item-effect">{effectText}</span>
                            <span className="qb-item-qty">x{item.quantity}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Action buttons for combat
 * Supports main menu (3x2: Attack, Skills, Defend, Run, Meditate, Item)
 * and skills submenu (2x3: 5 skill slots + Back)
 */
interface ActionButtonsProps {
    onAction: (action: PlayerAction) => void;
    onItemClick: () => void;
    disabled: boolean;
    isAutoAttacking: boolean;
    onToggleAutoAttack: () => void;
}

type ActionMenu = 'main' | 'skills';

function ActionButtons({ onAction, onItemClick, disabled, isAutoAttacking, onToggleAutoAttack }: ActionButtonsProps) {
    const [currentMenu, setCurrentMenu] = useState<ActionMenu>('main');
    const isMobile = Platform.isMobile;
    const character = useCharacterStore(state => state.character);
    const playerMana = useBattleStore(state => state.playerCurrentMana);
    const player = useBattleStore(state => state.player);

    // Get equipped skills for battle (exclude Meditate - it has its own button)
    const equippedSkills = React.useMemo(() => {
        if (!character?.skills?.equipped) return [];
        // Get skill data for equipped skill IDs (filter out Meditate)
        return character.skills.equipped
            .filter((id: string) => id !== 'universal_meditate')
            .map((id: string) => getSkillById(id))
            .filter((s): s is Skill => s !== undefined && s !== null)
            .slice(0, 5);
    }, [character?.skills?.equipped]);

    // Placeholder handlers
    const handleMeditate = () => {
        // Meditate is universal_meditate skill
        battleService.setSelectedSkill('universal_meditate');
        onAction('skill');
    };

    const handleSkillUse = (skillId: string) => {
        battleService.setSelectedSkill(skillId);
        onAction('skill');
    };

    // Check if a skill can be used (enough mana)
    const canUseSkill = (skill: Skill): boolean => {
        return playerMana >= skill.manaCost;
    };

    // Check if skill was used this battle (for once-per-battle skills)
    const isSkillUsedThisBattle = (skill: Skill): boolean => {
        if (!skill.usesPerBattle || !player) return false;
        return player.skillsUsedThisBattle.includes(skill.id);
    };

    // Skills submenu
    if (currentMenu === 'skills') {
        return (
            <div className={`qb-battle-actions qb-skills-menu ${isMobile ? 'mobile' : ''}`}>
                {equippedSkills.map((skill, idx) => {
                    const canUse = canUseSkill(skill) && !isSkillUsedThisBattle(skill);
                    const usedOnce = isSkillUsedThisBattle(skill);
                    return (
                        <button
                            key={skill.id}
                            className={`qb-action-btn qb-action-skill ${!canUse ? 'qb-skill-disabled' : ''}`}
                            onClick={() => handleSkillUse(skill.id)}
                            disabled={disabled || !canUse}
                            title={formatSkillTooltipBattle(skill)}
                        >
                            <span className="qb-skill-icon">{skill.icon}</span>
                            <span className="qb-skill-name">{skill.name}</span>
                            <span className="qb-skill-cost">{skill.manaCost}</span>
                            {usedOnce && <span className="qb-skill-used">USED</span>}
                        </button>
                    );
                })}
                {/* Fill empty slots if less than 5 skills */}
                {Array.from({ length: Math.max(0, 5 - equippedSkills.length) }).map((_, idx) => (
                    <button
                        key={`empty-${idx}`}
                        className="qb-action-btn qb-action-skill qb-skill-empty"
                        disabled={true}
                    >
                        <span className="qb-skill-icon">🔒</span>
                        <span className="qb-skill-name">Locked</span>
                    </button>
                ))}
                <button
                    className="qb-action-btn qb-action-back"
                    onClick={() => setCurrentMenu('main')}
                >
                    ← Back
                </button>
            </div>
        );
    }


    // Main menu (3x2 grid)
    return (
        <div className={`qb-battle-actions ${isMobile ? 'mobile' : ''}`}>
            {/* Row 1: Attack, Skills, Defend */}
            <button
                className={`qb-action-btn qb-action-attack ${isAutoAttacking ? 'qb-auto-attacking' : ''}`}
                onClick={onToggleAutoAttack}
                disabled={disabled && !isAutoAttacking}
            >
                {isAutoAttacking ? '⚔️ Stop' : '⚔️ Attack'}
            </button>
            <button
                className="qb-action-btn qb-action-skills"
                onClick={() => setCurrentMenu('skills')}
                disabled={disabled || isAutoAttacking}
            >
                🔥 Skills
            </button>
            <button
                className="qb-action-btn qb-action-defend"
                onClick={() => onAction('defend')}
                disabled={disabled || isAutoAttacking}
            >
                🛡️ Defend
            </button>
            {/* Row 2: Run, Meditate, Item */}
            <button
                className="qb-action-btn qb-action-run"
                onClick={() => onAction('retreat')}
                disabled={disabled || isAutoAttacking}
            >
                🏃 Run
            </button>
            <button
                className="qb-action-btn qb-action-meditate"
                onClick={handleMeditate}
                disabled={disabled || isAutoAttacking}
            >
                🧘 Meditate
            </button>
            <button
                className="qb-action-btn qb-action-item"
                onClick={onItemClick}
                disabled={disabled || isAutoAttacking}
            >
                🧪 Item
            </button>
        </div>
    );
}


/**
 * Victory screen
 */
interface VictoryScreenProps {
    onCollectRewards: () => void;
}

function VictoryScreen({ onCollectRewards }: VictoryScreenProps) {
    const monster = useBattleStore(state => state.monster);

    if (!monster) return null;

    return (
        <div className="qb-battle-outcome qb-victory">
            <div className="qb-outcome-icon">🏆</div>
            <h2>Victory!</h2>
            <p>You defeated the {monster.name}!</p>
            <div className="qb-victory-rewards">
                <span>⭐ +{monster.xpReward} XP</span>
                <span>🪙 +{monster.goldReward} Gold</span>
            </div>
            <button className="qb-btn-primary" onClick={onCollectRewards}>
                Collect Rewards
            </button>
        </div>
    );
}

/**
 * Defeat screen
 */
interface DefeatScreenProps {
    onReturn: () => void;
    onOpenRecoveryModal?: () => void;
}

function DefeatScreen({ onReturn, onOpenRecoveryModal }: DefeatScreenProps) {
    const monster = useBattleStore(state => state.monster);
    const character = useCharacterStore(state => state.character);

    // Calculate gold lost (10%)
    const goldLost = character ? Math.floor(character.gold * 0.1) : 0;

    return (
        <div className="qb-battle-outcome qb-defeat">
            <div className="qb-outcome-icon">💀</div>
            <h2>Defeated!</h2>
            <p>You were defeated by {monster?.name ?? 'the enemy'}...</p>
            <div className="qb-defeat-penalty">
                <span>🪙 -{goldLost} Gold lost</span>
            </div>
            <div className="qb-defeat-buttons">
                {onOpenRecoveryModal && (
                    <button className="qb-btn-secondary" onClick={onOpenRecoveryModal}>
                        💊 Recovery Options
                    </button>
                )}
                <button className="qb-btn-primary" onClick={onReturn}>
                    Return to Board
                </button>
            </div>
        </div>
    );
}

/**
 * Retreat screen
 */
interface RetreatScreenProps {
    onReturn: () => void;
}

function RetreatScreen({ onReturn }: RetreatScreenProps) {
    return (
        <div className="qb-battle-outcome qb-retreat">
            <div className="qb-outcome-icon">🏃</div>
            <h2>Escaped!</h2>
            <p>You managed to flee from battle.</p>
            <button className="qb-btn-primary" onClick={onReturn}>
                Return to Board
            </button>
        </div>
    );
}

// =====================
// MAIN COMPONENT
// =====================

export const BattleView: React.FC<BattleViewProps> = ({ onBattleEnd, onShowLoot, onDefeat, onOpenRecoveryModal, playerSpritePath, monsterSpritePath, backgroundPath }) => {
    const combatState = useBattleStore(state => state.state);
    const isInCombat = useBattleStore(state => state.isInCombat);
    const resetBattle = useBattleStore(state => state.resetBattle);
    const addLogEntry = useBattleStore(state => state.addLogEntry);
    const updatePlayerHP = useBattleStore(state => state.updatePlayerHP);
    const updatePlayerMana = useBattleStore(state => state.updatePlayerMana);
    const advanceState = useBattleStore(state => state.advanceState);
    const playerHP = useBattleStore(state => state.playerCurrentHP);
    const playerMana = useBattleStore(state => state.playerCurrentMana);
    const playerMaxHP = useBattleStore(state => state.playerStats?.maxHP ?? 1);
    const playerMaxMana = useBattleStore(state => state.playerStats?.maxMana ?? 1);
    const turnNumber = useBattleStore(state => state.turnNumber);

    const removeInventoryItem = useCharacterStore(state => state.removeInventoryItem);

    const [showItemPicker, setShowItemPicker] = useState(false);
    const [isAutoAttacking, setIsAutoAttacking] = useState(false);
    const autoAttackRef = useRef<number | null>(null);
    const isMobile = Platform.isMobile;

    // Auto-attack interval effect
    useEffect(() => {
        if (isAutoAttacking && combatState === 'PLAYER_INPUT') {
            // Start auto-attack loop
            autoAttackRef.current = window.setInterval(() => {
                const currentState = useBattleStore.getState().state;
                if (currentState === 'PLAYER_INPUT') {
                    battleService.executePlayerTurn('attack');
                }
            }, 500);
        } else {
            // Clear interval when not auto-attacking or combat ended
            if (autoAttackRef.current) {
                clearInterval(autoAttackRef.current);
                autoAttackRef.current = null;
            }
        }

        return () => {
            if (autoAttackRef.current) {
                clearInterval(autoAttackRef.current);
                autoAttackRef.current = null;
            }
        };
    }, [isAutoAttacking, combatState]);

    // Stop auto-attack when battle ends
    useEffect(() => {
        if (combatState === 'VICTORY' || combatState === 'DEFEAT' || combatState === 'RETREATED') {
            setIsAutoAttacking(false);
        }
    }, [combatState]);

    // Call onDefeat when state becomes DEFEAT (for dungeon death modal)
    const hasCalledDefeat = useRef(false);
    useEffect(() => {
        if (combatState === 'DEFEAT' && onDefeat && !hasCalledDefeat.current) {
            hasCalledDefeat.current = true;
            onDefeat();
        }
        // Reset on new battle
        if (combatState === 'PLAYER_INPUT') {
            hasCalledDefeat.current = false;
        }
    }, [combatState, onDefeat]);

    // Determine if actions should be disabled
    const actionsDisabled = combatState !== 'PLAYER_INPUT';

    // Handle player action
    const handleAction = (action: PlayerAction) => {
        if (action === 'item') {
            setShowItemPicker(true);
        } else {
            battleService.executePlayerTurn(action);
        }
    };

    // Toggle auto-attack mode
    const handleToggleAutoAttack = () => {
        if (isAutoAttacking) {
            setIsAutoAttacking(false);
        } else {
            // Start auto-attack by doing immediate attack then enabling loop
            battleService.executePlayerTurn('attack');
            setIsAutoAttacking(true);
        }
    };

    // Handle item usage
    const handleItemUse = (itemId: string) => {
        const def = CONSUMABLES[itemId];
        if (!def) return;

        // Apply effect
        if (def.effect === ConsumableEffect.HP_RESTORE) {
            const newHP = Math.min(playerMaxHP, playerHP + def.effectValue);
            updatePlayerHP(newHP);
            addLogEntry({
                turn: turnNumber,
                actor: 'player',
                action: `Used ${def.name}: +${def.effectValue} HP`,
                result: 'heal',
            });
        } else if (def.effect === ConsumableEffect.MANA_RESTORE) {
            const newMana = Math.min(playerMaxMana, playerMana + def.effectValue);
            updatePlayerMana(newMana);
            addLogEntry({
                turn: turnNumber,
                actor: 'player',
                action: `Used ${def.name}: +${def.effectValue} MP`,
                result: 'heal',
            });
        }

        // Remove from inventory
        removeInventoryItem(itemId, 1);

        // Close picker
        setShowItemPicker(false);

        // Using item costs your turn - advance to enemy turn
        advanceState('ENEMY_TURN');

        // Call monster turn
        battleService.executeMonsterTurn();
    };

    // Handle victory rewards collection
    const handleCollectRewards = () => {
        if (onShowLoot) {
            const loot = battleService.generateVictoryLoot();
            onShowLoot(loot);
        }
        // Call onBattleEnd FIRST so parent can read battle state (VICTORY)
        onBattleEnd();
        resetBattle();
    };

    // Handle return from defeat/retreat
    const handleReturn = () => {
        // Call onBattleEnd FIRST so parent can read battle state (RETREATED)
        onBattleEnd();
        resetBattle();
    };

    // Show outcome screens
    if (combatState === 'VICTORY') {
        return (
            <div className={`qb-battle-view ${isMobile ? 'mobile' : ''}`}>
                <VictoryScreen onCollectRewards={handleCollectRewards} />
            </div>
        );
    }

    if (combatState === 'DEFEAT') {
        // If onDefeat is provided (dungeon context), use it instead of showing DefeatScreen
        if (onDefeat) {
            // Call once and let the parent handle the defeat UI
            return (
                <div className={`qb-battle-view ${isMobile ? 'mobile' : ''}`}>
                    <div className="qb-battle-loading">
                        <span>Processing...</span>
                    </div>
                </div>
            );
        }
        return (
            <div className={`qb-battle-view ${isMobile ? 'mobile' : ''}`}>
                <DefeatScreen onReturn={handleReturn} onOpenRecoveryModal={onOpenRecoveryModal} />
            </div>
        );
    }

    if (combatState === 'RETREATED') {
        return (
            <div className={`qb-battle-view ${isMobile ? 'mobile' : ''}`}>
                <RetreatScreen onReturn={handleReturn} />
            </div>
        );
    }

    // Main battle UI
    const bgStyle = backgroundPath ? {
        backgroundImage: `url(${backgroundPath})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    } : {};

    return (
        <div className={`qb-battle-view ${isMobile ? 'mobile' : ''}`} style={bgStyle}>
            <MonsterDisplay spritePath={monsterSpritePath} />
            <CombatLog />
            <PlayerDisplay spritePath={playerSpritePath} />
            <ActionButtons
                onAction={handleAction}
                onItemClick={() => setShowItemPicker(true)}
                disabled={actionsDisabled}
                isAutoAttacking={isAutoAttacking}
                onToggleAutoAttack={handleToggleAutoAttack}
            />

            {showItemPicker && (
                <div className="qb-picker-overlay">
                    <ConsumablePicker
                        onSelect={handleItemUse}
                        onCancel={() => setShowItemPicker(false)}
                    />
                </div>
            )}
        </div>
    );
};
