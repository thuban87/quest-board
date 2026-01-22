/**
 * Character Sheet Component
 * 
 * Displays character sprite, stats, XP progress, and gear slots.
 */

import React, { useMemo } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { useQuestStore } from '../store/questStore';
import { CLASS_INFO, getTrainingLevelDisplay, StatType } from '../models/Character';
import { QuestStatus } from '../models/QuestStatus';
import { getXPProgress, getXPForNextLevel, XP_THRESHOLDS, TRAINING_XP_THRESHOLDS } from '../services/XPSystem';
import { getTotalStats, calculateDerivedStats, STAT_ABBREVIATIONS, STAT_NAMES, getStatCap } from '../services/StatsService';
import { getStreakDisplay, getStreakMessage } from '../services/StreakService';
import { getClassPerkAsPowerUp, getTimeRemaining, isExpiringSoon, expirePowerUps } from '../services/PowerUpService';

interface CharacterSheetProps {
    onBack: () => void;
    onViewAchievements?: () => void;
    spriteFolder?: string;
    spriteResourcePath?: string;  // Pre-computed resource path from vault
}

const GEAR_SLOTS = [
    { id: 'head', label: 'Head', emoji: '👑' },
    { id: 'chest', label: 'Chest', emoji: '🛡️' },
    { id: 'legs', label: 'Legs', emoji: '👖' },
    { id: 'boots', label: 'Boots', emoji: '👢' },
    { id: 'weapon', label: 'Weapon', emoji: '⚔️' },
    { id: 'shield', label: 'Shield', emoji: '🛡️' },
];

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ onBack, onViewAchievements, spriteFolder, spriteResourcePath }) => {
    const character = useCharacterStore((state) => state.character);
    const achievements = useCharacterStore((state) => state.achievements);
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
                                    console.log('Sprite failed to load:', spriteResourcePath);
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
                    {GEAR_SLOTS.map((slot) => (
                        <div key={slot.id} className="qb-gear-slot" title={slot.label}>
                            <div className="qb-gear-slot-icon">{slot.emoji}</div>
                            <span className="qb-gear-slot-label">{slot.label}</span>
                            <div className="qb-gear-slot-empty">Empty</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Primary Stats */}
            <div className="qb-sheet-primary-stats">
                <h3>Attributes</h3>
                <div className="qb-primary-stats-grid">
                    {(['strength', 'intelligence', 'wisdom', 'constitution', 'dexterity', 'charisma'] as StatType[]).map((stat) => {
                        const totalStats = getTotalStats(character);
                        const baseValue = character.baseStats?.[stat] || 10;
                        const bonusValue = character.statBonuses?.[stat] || 0;
                        const totalValue = totalStats[stat];
                        const cap = getStatCap(character.level);
                        const isPrimary = CLASS_INFO[character.class].primaryStats.includes(stat);

                        return (
                            <div
                                key={stat}
                                className={`qb-primary-stat ${isPrimary ? 'primary' : ''}`}
                                title={`${STAT_NAMES[stat]}\nBase from level: ${baseValue}\nQuest bonus: ${bonusValue} (max ${cap} at Level ${character.level})`}
                            >
                                <span className="qb-stat-abbr">{STAT_ABBREVIATIONS[stat]}</span>
                                <span className="qb-stat-total">{totalValue}</span>
                                {bonusValue > 0 && (
                                    <span className="qb-stat-bonus">+{bonusValue}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Derived Stats */}
            <div className="qb-sheet-derived-stats">
                <h3>Combat Stats</h3>
                {(() => {
                    const derived = calculateDerivedStats(character);
                    return (
                        <div className="qb-derived-stats-grid">
                            <div className="qb-derived-stat">
                                <span className="qb-derived-label">❤️ HP</span>
                                <span className="qb-derived-value">{derived.maxHp}</span>
                            </div>
                            <div className="qb-derived-stat">
                                <span className="qb-derived-label">💧 Mana</span>
                                <span className="qb-derived-value">{derived.maxMana}</span>
                            </div>
                            <div className="qb-derived-stat">
                                <span className="qb-derived-label">⚔️ Attack</span>
                                <span className="qb-derived-value">{derived.attack}</span>
                            </div>
                            <div className="qb-derived-stat">
                                <span className="qb-derived-label">🛡️ Defense</span>
                                <span className="qb-derived-value">{derived.defense}</span>
                            </div>
                            <div className="qb-derived-stat">
                                <span className="qb-derived-label">⚡ Speed</span>
                                <span className="qb-derived-value">{derived.speed}</span>
                            </div>
                            <div className="qb-derived-stat">
                                <span className="qb-derived-label">🎯 Crit</span>
                                <span className="qb-derived-value">{derived.critChance.toFixed(1)}%</span>
                            </div>
                        </div>
                    );
                })()}
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
