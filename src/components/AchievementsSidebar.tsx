/**
 * Achievements Sidebar Component
 * 
 * Displays all achievements with unlocked on top (color) and locked below (greyed).
 * Accessed from Character Sheet by clicking "Achievements" stat.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { App } from 'obsidian';
import { Achievement, isUnlocked, getProgressPercent } from '../models/Achievement';
import { useCharacterStore } from '../store/characterStore';
import { AchievementService } from '../services/AchievementService';

interface AchievementsSidebarProps {
    app: App;
    badgeFolder: string;
    onBack: () => void;
}

export const AchievementsSidebar: React.FC<AchievementsSidebarProps> = ({
    app,
    badgeFolder,
    onBack,
}) => {
    const achievements = useCharacterStore((state) => state.achievements);
    const [badgePaths, setBadgePaths] = useState<Record<string, string | null>>({});
    const achievementService = new AchievementService(app.vault, badgeFolder);

    // Load badge paths
    useEffect(() => {
        const loadBadges = async () => {
            const paths: Record<string, string | null> = {};
            for (const achievement of achievements) {
                paths[achievement.id] = await achievementService.getBadgeResourcePath(app, achievement);
            }
            setBadgePaths(paths);
        };
        loadBadges();
    }, [achievements, app, badgeFolder]);

    // Sort achievements: unlocked first
    const sortedAchievements = achievementService.getSortedAchievements(achievements);
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
                        badgePath={badgePaths[achievement.id]}
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
    badgePath: string | null;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, badgePath }) => {
    const unlocked = isUnlocked(achievement);
    const progress = getProgressPercent(achievement);

    return (
        <div className={`qb-achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
            {/* Badge/Emoji */}
            <div className="qb-achievement-badge">
                {badgePath ? (
                    <img
                        src={badgePath}
                        alt={achievement.name}
                        className={unlocked ? '' : 'qb-badge-locked'}
                    />
                ) : (
                    <span className="qb-achievement-emoji">{achievement.emoji}</span>
                )}
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
