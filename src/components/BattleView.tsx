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

// =====================
// TYPES
// =====================

interface BattleViewProps {
    onBattleEnd: () => void;
    onShowLoot?: (loot: LootDrop) => void;
    onOpenRecoveryModal?: () => void;
    playerSpritePath?: string;
    backgroundPath?: string;
}

// =====================
// SUB-COMPONENTS
// =====================

/**
 * Monster display section
 */
function MonsterDisplay() {
    const monster = useBattleStore(state => state.monster);
    const monsterHP = useBattleStore(state => state.monster?.currentHP ?? 0);
    const monsterMaxHP = useBattleStore(state => state.monster?.maxHP ?? 1);
    const combatState = useBattleStore(state => state.state);

    if (!monster) return null;

    const hpPercent = Math.max(0, (monsterHP / monsterMaxHP) * 100);

    // Determine tint class based on monster name prefix
    let tintClass = '';
    if (monster.name.startsWith('Fierce')) tintClass = 'qb-tint-fierce';
    else if (monster.name.startsWith('Sturdy')) tintClass = 'qb-tint-sturdy';
    else if (monster.name.startsWith('Ancient')) tintClass = 'qb-tint-ancient';

    // Elite class for red glow animation
    const eliteClass = monster.tier === 'elite' ? 'qb-elite-monster' : '';

    // Animation class based on state
    const animClass = combatState === 'ANIMATING_ENEMY' ? 'qb-monster-attacking' : '';

    return (
        <div className={`qb-battle-monster ${eliteClass}`}>
            <div className="qb-monster-info">
                <span className="qb-monster-name">
                    {monster.name}
                    {monster.tier === 'elite' && <span className="qb-elite-badge">ELITE</span>}
                </span>
                <span className="qb-monster-level">Lv. {monster.level}</span>
            </div>
            <div className="qb-hp-bar qb-monster-hp">
                <div
                    className="qb-hp-fill"
                    style={{ width: `${hpPercent}%` }}
                />
                <span className="qb-hp-text">{monsterHP} / {monsterMaxHP}</span>
            </div>
            <div className={`qb-monster-sprite ${tintClass} ${animClass}`}>
                <span className="qb-sprite-emoji">{monster.emoji}</span>
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
    const isDefending = useBattleStore(state => state.isPlayerDefending);
    const combatState = useBattleStore(state => state.state);
    const character = useCharacterStore(state => state.character);

    if (!playerStats || !character) return null;

    const hpPercent = Math.max(0, (playerHP / playerStats.maxHP) * 100);
    const manaPercent = Math.max(0, (playerMana / playerStats.maxMana) * 100);
    const classInfo = CLASS_INFO[character.class];

    // Animation class based on state
    const animClass = combatState === 'ANIMATING_PLAYER' ? 'qb-player-attacking' : '';

    return (
        <div className="qb-battle-player">
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
            <div className="qb-player-info">
                <span className="qb-player-name">{character.name}</span>
                <span className="qb-player-class">Lv. {character.level} {classInfo.name}</span>
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
        const actor = entry.actor === 'player' ? 'You' : 'Enemy';
        let message = `${actor} used ${entry.action}`;

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
            message = `💚 ${entry.action}`;
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
 */
interface ActionButtonsProps {
    onAction: (action: PlayerAction) => void;
    onItemClick: () => void;
    disabled: boolean;
}

function ActionButtons({ onAction, onItemClick, disabled }: ActionButtonsProps) {
    const isMobile = Platform.isMobile;

    return (
        <div className={`qb-battle-actions ${isMobile ? 'mobile' : ''}`}>
            <button
                className="qb-action-btn qb-action-attack"
                onClick={() => onAction('attack')}
                disabled={disabled}
            >
                ⚔️ Attack
            </button>
            <button
                className="qb-action-btn qb-action-defend"
                onClick={() => onAction('defend')}
                disabled={disabled}
            >
                🛡️ Defend
            </button>
            <button
                className="qb-action-btn qb-action-run"
                onClick={() => onAction('retreat')}
                disabled={disabled}
            >
                🏃 Run
            </button>
            <button
                className="qb-action-btn qb-action-item"
                onClick={onItemClick}
                disabled={disabled}
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

export const BattleView: React.FC<BattleViewProps> = ({ onBattleEnd, onShowLoot, onOpenRecoveryModal, playerSpritePath, backgroundPath }) => {
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
    const isMobile = Platform.isMobile;

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
        resetBattle();
        onBattleEnd();
    };

    // Handle return from defeat/retreat
    const handleReturn = () => {
        resetBattle();
        onBattleEnd();
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
            <MonsterDisplay />
            <CombatLog />
            <PlayerDisplay spritePath={playerSpritePath} />
            <ActionButtons
                onAction={handleAction}
                onItemClick={() => setShowItemPicker(true)}
                disabled={actionsDisabled}
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
