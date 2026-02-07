/**
 * Achievements Sidebar Component
 * 
 * Displays all achievements with unlocked on top (color) and locked below (greyed).
 * Accessed from Character Sheet by clicking "Achievements" stat.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { App } from 'obsidian';
import { Achievement, isUnlocked, getProgressPercent } from '../models/Achievement';
import { useCharacterStore } from '../store/characterStore';
import { AchievementService, calculateAchievementProgress } from '../services/AchievementService';

interface AchievementsSidebarProps {
    app: App;
    onBack: () => void;
}

export const AchievementsSidebar: React.FC<AchievementsSidebarProps> = ({
    app,
    onBack,
}) => {
    const achievements = useCharacterStore((state) => state.achievements);
    const character = useCharacterStore((state) => state.character);
    const achievementService = new AchievementService(app.vault);

    // Calculate progress using shared utility (single source of truth)
    const achievementsWithProgress = useMemo(
        () => calculateAchievementProgress(achievements, character),
        [achievements, character]
    );

    // Sort achievements: unlocked first
    const sortedAchievements = achievementService.getSortedAchievements(achievementsWithProgress);
    const unlockedCount = achievementService.getUnlockedCount(achievements);

    return (
        <div className="qb-achievements-sidebar">
            {/* Header */}
            <div className="qb-achievements-header">
                <button className="qb-back-btn" onClick={onBack}>
                    ← Back
                </button>
                <h2>🏆 Achievements</h2>
                <span className="qb-achievements-count">
                    {unlockedCount}/{achievements.length}
                </span>
            </div>

            {/* Achievement Grid */}
            <div className="qb-achievements-grid">
                {sortedAchievements.map((achievement) => (
                    <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                    />
                ))}
            </div>
        </div>
    );
};

/**
 * Individual achievement card
 */
interface AchievementCardProps {
    achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
    const unlocked = isUnlocked(achievement);
    const progress = getProgressPercent(achievement);

    return (
        <div className={`qb-achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
            {/* Emoji */}
            <div className="qb-achievement-badge">
                <span className="qb-achievement-emoji">{achievement.emoji}</span>
            </div>

            {/* Name */}
            <div className="qb-achievement-name">{achievement.name}</div>

            {/* Description / Progress */}
            <div className="qb-achievement-desc">
                {unlocked ? (
                    <span className="qb-unlocked-date">
                        {new Date(achievement.unlockedAt!).toLocaleDateString()}
                    </span>
                ) : (
                    <>
                        <span>{achievement.description}</span>
                        {achievement.trigger.type !== 'manual' && (
                            <div className="qb-achievement-progress">
                                <div className="qb-achievement-progress-bar">
                                    <div
                                        className="qb-achievement-progress-fill"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="qb-achievement-progress-text">
                                    {achievement.progress || 0}/{achievement.trigger.target}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* XP Bonus indicator */}
            <div className="qb-achievement-xp">
                +{achievement.xpBonus} XP
            </div>
        </div>
    );
};
