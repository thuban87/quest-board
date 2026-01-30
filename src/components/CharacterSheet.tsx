/**
 * Character Sheet Component
 * 
 * Displays character sprite, stats, XP progress, and gear slots.
 */

import React, { useMemo } from 'react';
import { useCharacterStore, selectActiveSetBonuses } from '../store/characterStore';
import { setBonusService } from '../services/SetBonusService';
import { useQuestStore } from '../store/questStore';
import { CLASS_INFO, getTrainingLevelDisplay, StatType } from '../models/Character';
import { QuestStatus } from '../models/QuestStatus';
import { GearSlot, GearItem, TIER_INFO, GEAR_SLOT_NAMES, ALL_GEAR_SLOTS } from '../models/Gear';
import { getXPProgress, getXPForNextLevel, XP_THRESHOLDS, TRAINING_XP_THRESHOLDS } from '../services/XPSystem';
import { getTotalStats, calculateDerivedStats, STAT_ABBREVIATIONS, STAT_NAMES, getStatCap } from '../services/StatsService';
import { getStreakDisplay, getStreakMessage } from '../services/StreakService';
import { getClassPerkAsPowerUp, getTimeRemaining, isExpiringSoon, expirePowerUps } from '../services/PowerUpService';
import { deriveCombatStats, aggregateGearStats } from '../services/CombatService';

interface CharacterSheetProps {
    onBack: () => void;
    onViewAchievements?: () => void;
    onOpenInventory?: () => void;
    /** Open inventory filtered to a specific gear slot */
    onOpenInventoryForSlot?: (slot: GearSlot) => void;
    onOpenBlacksmith?: () => void;
    /** Open skill loadout modal */
    onOpenSkillLoadout?: () => void;
    spriteFolder?: string;
    spriteResourcePath?: string;  // Pre-computed resource path from vault
}

const GEAR_SLOTS_CONFIG = [
    { slot: 'head' as GearSlot, label: 'Head', emoji: '👑' },
    { slot: 'chest' as GearSlot, label: 'Chest', emoji: '🛡️' },
    { slot: 'legs' as GearSlot, label: 'Legs', emoji: '👖' },
    { slot: 'boots' as GearSlot, label: 'Boots', emoji: '👢' },
    { slot: 'weapon' as GearSlot, label: 'Weapon', emoji: '⚔️' },
    { slot: 'shield' as GearSlot, label: 'Shield', emoji: '🛡️' },
];

/**
 * Generate a tooltip string for a gear item
 */
function getGearTooltip(item: GearItem): string {
    const tierInfo = TIER_INFO[item.tier];
    const lines = [
        `${item.name}`,
        `${tierInfo.emoji} ${tierInfo.name} • Level ${item.level}`,
        '',
        `+${item.stats.primaryValue} ${item.stats.primaryStat.charAt(0).toUpperCase() + item.stats.primaryStat.slice(1)}`,
    ];

    // Add secondary stats (it's a Record<StatType, number>)
    if (item.stats.secondaryStats) {
        for (const [stat, value] of Object.entries(item.stats.secondaryStats)) {
            if (value && value > 0) {
                lines.push(`+${value} ${stat.charAt(0).toUpperCase() + stat.slice(1)}`);
            }
        }
    }
    if (item.stats.attackPower) {
        lines.push(`+${item.stats.attackPower} Attack Power`);
    }
    if (item.stats.defense) {
        lines.push(`+${item.stats.defense} Defense`);
    }
    if (item.stats.critChance) {
        lines.push(`+${item.stats.critChance}% Crit Chance`);
    }
    if (item.stats.blockChance) {
        lines.push(`+${item.stats.blockChance}% Block Chance`);
    }

    return lines.join('\n');
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ onBack, onViewAchievements, onOpenInventory, onOpenInventoryForSlot, onOpenBlacksmith, onOpenSkillLoadout, spriteFolder, spriteResourcePath }) => {
    const character = useCharacterStore((state) => state.character);
    const achievements = useCharacterStore((state) => state.achievements);
    const activeSetBonuses = useCharacterStore(selectActiveSetBonuses);
    const quests = useQuestStore((state) => state.quests);

    if (!character) return null;

    const classInfo = CLASS_INFO[character.class];
    const isTraining = character.isTrainingMode;

    const currentXP = isTraining ? character.trainingXP : character.totalXP;
    const currentLevel = isTraining ? character.trainingLevel : character.level;

    // Calculate XP progress for current level
    const currentThreshold = isTraining
        ? (TRAINING_XP_THRESHOLDS[character.trainingLevel - 1] || 0)
        : (XP_THRESHOLDS[character.level - 1] || 0);
    const nextLevelXP = isTraining
        ? (TRAINING_XP_THRESHOLDS[character.trainingLevel] || TRAINING_XP_THRESHOLDS[9])
        : getXPForNextLevel(character.level);
    const xpInLevel = currentXP - currentThreshold;
    const xpNeeded = nextLevelXP - currentThreshold;
    const xpProgress = xpNeeded > 0 ? Math.min(1, xpInLevel / xpNeeded) : 1;

    const completedQuests = quests
        ? Array.from(quests.values()).filter(q => q.status === QuestStatus.COMPLETED).length
        : 0;
    const totalQuests = quests ? quests.size : 0;

    // Compute all active buffs: class perk + active power-ups (with expired ones cleaned)
    const allBuffs = useMemo(() => {
        const classPerk = getClassPerkAsPowerUp(character);
        const activePowerUps = expirePowerUps(character.activePowerUps || []);
        return [classPerk, ...activePowerUps];
    }, [character]);

    // Compute combat stats for accurate HP/Mana display (includes gear bonuses)
    const combatStats = useMemo(() => {
        return deriveCombatStats(character);
    }, [character]);

    return (
        <div className="qb-character-sheet">
            <button className="qb-back-btn" onClick={onBack}>
                ← Back to Board
            </button>

            <div className="qb-sheet-header">
                <div className="qb-sheet-sprite-container">
                    <div
                        className="qb-sheet-sprite"
                        style={{ borderColor: classInfo.primaryColor, backgroundColor: classInfo.primaryColor + '33' }}
                    >
                        {spriteResourcePath ? (
                            <img
                                src={spriteResourcePath}
                                alt={`${character.name} sprite`}
                                className="qb-sprite-image"
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <span className={`qb-sprite-placeholder ${spriteResourcePath ? 'hidden' : ''}`}>{classInfo.emoji}</span>
                    </div>
                    <div className="qb-sprite-shadow" />
                </div>

                <div className="qb-sheet-info">
                    <h2 className="qb-sheet-name">{character.name}</h2>
                    <p className="qb-sheet-class">
                        {isTraining && 'Training '}
                        Level {isTraining ? getTrainingLevelDisplay(currentLevel) : currentLevel} {classInfo.name}
                    </p>
                    {character.secondaryClass && (
                        <p className="qb-sheet-secondary">
                            + {CLASS_INFO[character.secondaryClass].name}
                        </p>
                    )}
                </div>

                {/* Active Buffs Display */}
                <div className="qb-active-buffs">
                    {allBuffs.map((buff) => {
                        const timeLeft = getTimeRemaining(buff);
                        const expiring = isExpiringSoon(buff);
                        return (
                            <div
                                key={buff.id}
                                className={`qb-buff-icon ${expiring ? 'qb-buff-expiring' : ''} ${buff.expiresAt === null ? 'qb-buff-passive' : ''}`}
                                title={`${buff.name}\n${buff.description}${timeLeft ? `\n${timeLeft}` : ''}`}
                            >
                                <span className="qb-buff-emoji">{buff.icon}</span>
                                {buff.stacks && buff.stacks > 1 && (
                                    <span className="qb-buff-stack">{buff.stacks}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="qb-sheet-xp-section">
                <div className="qb-sheet-xp-header">
                    <span>Experience</span>
                    <span>{currentXP - currentThreshold} / {nextLevelXP - currentThreshold} XP</span>
                </div>
                <div className="qb-sheet-xp-bar">
                    <div
                        className="qb-sheet-xp-fill"
                        style={{
                            width: `${xpProgress * 100}%`,
                            backgroundColor: classInfo.primaryColor
                        }}
                    />
                </div>
                <p className="qb-sheet-xp-total">
                    Total XP: {character.totalXP}
                    {isTraining && ` (Training: ${character.trainingXP})`}
                </p>
            </div>

            {/* HP / Mana / Stamina Bars - Live Resource Display */}
            <div className="qb-sheet-resources">
                <h3>⚡ Resources</h3>
                <div className="qb-resources-grid">
                    {/* HP Bar */}
                    <div className="qb-resource-item">
                        <div className="qb-resource-header">
                            <span className="qb-resource-label">❤️ HP</span>
                            <span className="qb-resource-values">
                                {character.currentHP ?? combatStats.maxHP} / {combatStats.maxHP}
                            </span>
                        </div>
                        <div className="qb-resource-bar qb-bar-hp">
                            <div
                                className="qb-resource-fill"
                                style={{
                                    width: `${((character.currentHP ?? combatStats.maxHP) / combatStats.maxHP) * 100}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Mana Bar */}
                    <div className="qb-resource-item">
                        <div className="qb-resource-header">
                            <span className="qb-resource-label">💧 Mana</span>
                            <span className="qb-resource-values">
                                {character.currentMana ?? combatStats.maxMana} / {combatStats.maxMana}
                            </span>
                        </div>
                        <div className="qb-resource-bar qb-bar-mana">
                            <div
                                className="qb-resource-fill"
                                style={{
                                    width: `${((character.currentMana ?? combatStats.maxMana) / combatStats.maxMana) * 100}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Stamina Bar */}
                    <div className="qb-resource-item">
                        <div className="qb-resource-header">
                            <span className="qb-resource-label">⚡ Stamina</span>
                            <span className="qb-resource-values">
                                {character.stamina ?? 10} / 10
                            </span>
                        </div>
                        <div className="qb-resource-bar qb-bar-stamina">
                            <div
                                className="qb-resource-fill"
                                style={{
                                    width: `${((character.stamina ?? 10) / 10) * 100}%`,
                                }}
                            />
                        </div>
                        <div className="qb-stamina-hint">
                            {(character.staminaGainedToday ?? 0) >= 500
                                ? "You've hit your daily stamina cap. Try again tomorrow!"
                                : "Complete quests to earn stamina for combat"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Streak Display */}
            <div className="qb-sheet-streak">
                <h3>🔥 Activity Streak</h3>
                <div className="qb-streak-info">
                    <div className="qb-streak-current">
                        <span className="qb-streak-label">Current</span>
                        <span className="qb-streak-value">{getStreakDisplay(character.currentStreak || 0)}</span>
                    </div>
                    <div className="qb-streak-best">
                        <span className="qb-streak-label">Best</span>
                        <span className="qb-streak-value">{character.highestStreak || 0} days</span>
                    </div>
                </div>
                <p className="qb-streak-message">{getStreakMessage(character.currentStreak || 0)}</p>
            </div>

            <div className="qb-sheet-gear">
                <h3>Equipment</h3>
                <div className="qb-gear-grid">
                    {GEAR_SLOTS_CONFIG.map(({ slot, label, emoji }) => {
                        const equippedItem = character.equippedGear?.[slot];
                        const handleSlotClick = () => {
                            if (onOpenInventoryForSlot) {
                                onOpenInventoryForSlot(slot);
                            } else if (onOpenInventory) {
                                onOpenInventory();
                            }
                        };

                        return (
                            <div
                                key={slot}
                                className={`qb-gear-slot ${equippedItem ? `qb-tier-${equippedItem.tier}` : ''}`}
                                title={equippedItem ? getGearTooltip(equippedItem) : `${label} - Click to equip`}
                                onClick={handleSlotClick}
                            >
                                <div
                                    className="qb-gear-slot-icon"
                                    style={equippedItem ? { borderColor: TIER_INFO[equippedItem.tier].color } : {}}
                                >
                                    {equippedItem?.iconEmoji || emoji}
                                </div>
                                <span className="qb-gear-slot-label">{label}</span>
                                {equippedItem ? (
                                    <div
                                        className="qb-gear-slot-name"
                                        style={{ color: TIER_INFO[equippedItem.tier].color }}
                                    >
                                        {equippedItem.name}
                                    </div>
                                ) : (
                                    <div className="qb-gear-slot-empty">Empty</div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {onOpenInventory && (
                    <button
                        className="qb-inventory-btn-main"
                        onClick={onOpenInventory}
                    >
                        🎒 Open Inventory
                    </button>
                )}
                {onOpenBlacksmith && (
                    <button
                        className="qb-blacksmith-btn-main"
                        onClick={onOpenBlacksmith}
                    >
                        🔨 Blacksmith
                    </button>
                )}
                {onOpenSkillLoadout && (
                    <button
                        className="qb-skills-btn-main"
                        onClick={onOpenSkillLoadout}
                    >
                        ⚔️ Manage Skills
                    </button>
                )}
            </div>

            {/* Active Set Bonuses */}
            {activeSetBonuses.length > 0 && (
                <div className="qb-sheet-sets">
                    <h3>⚔️ Set Bonuses</h3>
                    <div className="qb-sets-list">
                        {activeSetBonuses.map((set) => (
                            <div key={set.setId} className="qb-set-item">
                                <div className="qb-set-header">
                                    <span className="qb-set-name">{set.setName}</span>
                                    <span className="qb-set-count">({set.equippedCount}/6)</span>
                                </div>
                                <div className="qb-set-bonuses">
                                    {set.bonuses.map((bonus, idx) => {
                                        const isActive = bonus.pieces <= set.equippedCount;
                                        return (
                                            <div
                                                key={idx}
                                                className={`qb-set-bonus ${isActive ? 'active' : 'inactive'}`}
                                            >
                                                <span className="qb-set-pieces">({bonus.pieces})</span>
                                                <span className="qb-set-effect">
                                                    {setBonusService.formatBonusEffect(bonus.effect)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Primary Stats */}
            <div className="qb-sheet-primary-stats">
                <h3>Attributes</h3>
                <div className="qb-primary-stats-grid">
                    {(['strength', 'intelligence', 'wisdom', 'constitution', 'dexterity', 'charisma'] as StatType[]).map((stat) => {
                        const totalStats = getTotalStats(character);
                        const baseValue = character.baseStats?.[stat] || 10;
                        const questBonus = character.statBonuses?.[stat] || 0;
                        const totalValue = totalStats[stat];

                        // Calculate gear bonus properly using aggregateGearStats
                        const aggregatedGear = aggregateGearStats(character.equippedGear);
                        const gearBonus = aggregatedGear.statBonuses[stat] || 0;

                        // Power-up boost is what's left after base, quest, and gear
                        const powerUpBoost = totalValue - baseValue - questBonus - gearBonus;
                        const cap = getStatCap(character.level);
                        const isPrimary = CLASS_INFO[character.class].primaryStats.includes(stat);
                        const hasBuff = powerUpBoost > 0 || gearBonus > 0;

                        return (
                            <div
                                key={stat}
                                className={`qb-primary-stat ${isPrimary ? 'primary' : ''} ${hasBuff ? 'buffed' : ''}`}
                                title={`${STAT_NAMES[stat]}\nBase from level: ${baseValue}\nQuest bonus: ${questBonus} (max ${cap} at Level ${character.level})${gearBonus > 0 ? `\nGear: +${gearBonus}` : ''}${powerUpBoost > 0 ? `\nPower-up: +${powerUpBoost}` : ''}`}
                            >
                                <span className="qb-stat-abbr">{STAT_ABBREVIATIONS[stat]}</span>
                                <span className="qb-stat-total">{totalValue}</span>
                                {questBonus > 0 && (
                                    <span className="qb-stat-bonus">+{questBonus}</span>
                                )}
                                {powerUpBoost > 0 && (
                                    <span className="qb-stat-buff">⬆{powerUpBoost}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Derived Stats */}
            <div className="qb-sheet-derived-stats">
                <h3>Combat Stats</h3>
                <div className="qb-derived-stats-grid">
                    <div className="qb-derived-stat">
                        <span className="qb-derived-label">❤️ Max HP</span>
                        <span className="qb-derived-value">{combatStats.maxHP}</span>
                    </div>
                    <div className="qb-derived-stat">
                        <span className="qb-derived-label">💧 Max Mana</span>
                        <span className="qb-derived-value">{combatStats.maxMana}</span>
                    </div>
                    <div className="qb-derived-stat">
                        <span className="qb-derived-label">⚔️ Physical Atk</span>
                        <span className="qb-derived-value">{combatStats.physicalAttack}</span>
                    </div>
                    <div className="qb-derived-stat">
                        <span className="qb-derived-label">✨ Magic Atk</span>
                        <span className="qb-derived-value">{combatStats.magicAttack}</span>
                    </div>
                    <div className="qb-derived-stat">
                        <span className="qb-derived-label">🛡️ Defense</span>
                        <span className="qb-derived-value">{combatStats.defense}</span>
                    </div>
                    <div className="qb-derived-stat">
                        <span className="qb-derived-label">🔮 Magic Def</span>
                        <span className="qb-derived-value">{combatStats.magicDefense}</span>
                    </div>
                    <div className="qb-derived-stat">
                        <span className="qb-derived-label">🎯 Crit %</span>
                        <span className="qb-derived-value">{combatStats.critChance.toFixed(1)}%</span>
                    </div>
                    <div className="qb-derived-stat">
                        <span className="qb-derived-label">💨 Dodge %</span>
                        <span className="qb-derived-value">{combatStats.dodgeChance.toFixed(1)}%</span>
                    </div>
                    {combatStats.blockChance > 0 && (
                        <div className="qb-derived-stat">
                            <span className="qb-derived-label">🛡️ Block %</span>
                            <span className="qb-derived-value">{combatStats.blockChance.toFixed(1)}%</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="qb-sheet-perk">
                <h3>{classInfo.perkName}</h3>
                <p>{classInfo.perkDescription}</p>
                <p className="qb-perk-bonus">
                    +{classInfo.bonusPercent}% XP on {classInfo.bonusCategories.slice(0, 3).join(', ')} quests
                </p>
            </div>

            <div className="qb-sheet-stats">
                <h3>Stats</h3>
                <div className="qb-stats-grid">
                    <div className="qb-stat-item qb-stat-gold" title="Gold earned from quests and combat">
                        <span className="qb-stat-value">🪙 {character.gold?.toLocaleString() ?? 0}</span>
                        <span className="qb-stat-label">Gold</span>
                    </div>
                    <div className="qb-stat-item">
                        <span className="qb-stat-value">{completedQuests}</span>
                        <span className="qb-stat-label">Quests Completed</span>
                    </div>
                    <div className="qb-stat-item">
                        <span className="qb-stat-value">{totalQuests - completedQuests}</span>
                        <span className="qb-stat-label">Active Quests</span>
                    </div>
                    <div
                        className={`qb-stat-item ${onViewAchievements ? 'clickable' : ''}`}
                        onClick={onViewAchievements}
                        style={{ cursor: onViewAchievements ? 'pointer' : 'default' }}
                        title="View Achievements"
                    >
                        <span className="qb-stat-value">🏆 {achievements.filter(a => a.unlockedAt).length}</span>
                        <span className="qb-stat-label">Achievements</span>
                    </div>
                    <div className="qb-stat-item">
                        <span className="qb-stat-value">{character.totalXP}</span>
                        <span className="qb-stat-label">Total XP</span>
                    </div>
                </div>
            </div>

            {isTraining && (
                <div className="qb-training-notice">
                    <p>🎓 You are in <strong>Training Mode</strong></p>
                    <p>Complete quests to reach Training Level X, then graduate to the real game!</p>
                </div>
            )}
        </div>
    );
};
