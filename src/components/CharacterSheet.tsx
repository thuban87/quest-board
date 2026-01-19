/**
 * Character Sheet Component
 * 
 * Displays character stats, XP progress, and placeholder sprite.
 */

import React from 'react';
import { useCharacterStore } from '../store/characterStore';
import { useQuestStore } from '../store/questStore';
import { CLASS_INFO, getTrainingLevelDisplay } from '../models/Character';
import { QuestStatus } from '../models/QuestStatus';
import { getXPProgress, getXPForNextLevel, calculateLevel, XP_THRESHOLDS } from '../services/XPSystem';

interface CharacterSheetProps {
    onBack: () => void;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ onBack }) => {
    const character = useCharacterStore((state) => state.character);
    const achievements = useCharacterStore((state) => state.achievements);
    const quests = useQuestStore((state) => state.quests);

    if (!character) return null;

    const classInfo = CLASS_INFO[character.class];
    const isTraining = character.isTrainingMode;

    // Calculate XP progress
    const currentXP = isTraining ? character.trainingXP : character.totalXP;
    const currentLevel = isTraining ? character.trainingLevel : character.level;
    const xpProgress = isTraining
        ? (character.trainingXP % 100) / 100
        : getXPProgress(character.totalXP);
    const nextLevelXP = isTraining
        ? 100
        : getXPForNextLevel(character.level);
    const currentThreshold = isTraining
        ? (character.trainingLevel - 1) * 100
        : (XP_THRESHOLDS[character.level - 1] || 0);

    // Calculate stats
    const completedQuests = quests
        ? Array.from(quests.values()).filter(q => q.status === QuestStatus.COMPLETED).length
        : 0;
    const totalQuests = quests ? quests.size : 0;

    return (
        <div className="qb-character-sheet">
            {/* Back Button */}
            <button className="qb-back-btn" onClick={onBack}>
                ← Back to Board
            </button>

            {/* Character Header */}
            <div className="qb-sheet-header">
                <div
                    className="qb-sheet-sprite"
                    style={{ backgroundColor: classInfo.primaryColor }}
                >
                    <span className="qb-sheet-emoji">{classInfo.emoji}</span>
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

            {/* XP Bar */}
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

            {/* Class Perk */}
            <div className="qb-sheet-perk">
                <h3>{classInfo.perkName}</h3>
                <p>{classInfo.perkDescription}</p>
                <p className="qb-perk-bonus">
                    +{classInfo.bonusPercent}% XP on {classInfo.bonusCategories.slice(0, 3).join(', ')} quests
                </p>
            </div>

            {/* Stats */}
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

            {/* Training Mode Toggle */}
            {isTraining && (
                <div className="qb-training-notice">
                    <p>🎓 You are in <strong>Training Mode</strong></p>
                    <p>Complete quests to reach Training Level IV, then graduate to the real game!</p>
                </div>
            )}
        </div>
    );
};
