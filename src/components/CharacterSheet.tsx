/**
 * Character Sheet Component
 * 
 * Displays character sprite, stats, XP progress, and gear slots.
 */

import React from 'react';
import { useCharacterStore } from '../store/characterStore';
import { useQuestStore } from '../store/questStore';
import { CLASS_INFO, getTrainingLevelDisplay } from '../models/Character';
import { QuestStatus } from '../models/QuestStatus';
import { getXPProgress, getXPForNextLevel, XP_THRESHOLDS } from '../services/XPSystem';

interface CharacterSheetProps {
    onBack: () => void;
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

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ onBack, spriteFolder, spriteResourcePath }) => {
    const character = useCharacterStore((state) => state.character);
    const achievements = useCharacterStore((state) => state.achievements);
    const quests = useQuestStore((state) => state.quests);

    if (!character) return null;

    const classInfo = CLASS_INFO[character.class];
    const isTraining = character.isTrainingMode;

    const currentXP = isTraining ? character.trainingXP : character.totalXP;
    const currentLevel = isTraining ? character.trainingLevel : character.level;
    const xpProgress = isTraining
        ? (character.trainingXP % 100) / 100
        : getXPProgress(character.totalXP);
    const nextLevelXP = isTraining ? 100 : getXPForNextLevel(character.level);
    const currentThreshold = isTraining
        ? (character.trainingLevel - 1) * 100
        : (XP_THRESHOLDS[character.level - 1] || 0);

    const completedQuests = quests
        ? Array.from(quests.values()).filter(q => q.status === QuestStatus.COMPLETED).length
        : 0;
    const totalQuests = quests ? quests.size : 0;

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
                    <div className="qb-stat-item">
                        <span className="qb-stat-value">{achievements.length}</span>
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
                    <p>Complete quests to reach Training Level IV, then graduate to the real game!</p>
                </div>
            )}
        </div>
    );
};
