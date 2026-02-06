/**
 * CharacterStats - Gold, quests completed, active quests, achievements, total XP.
 *
 * Shared sub-component used by both CharacterSidebar and CharacterPage.
 */

import React from 'react';
import { Character } from '../../models/Character';

interface CharacterStatsProps {
    character: Character;
    completedQuests: number;
    activeQuests: number;
    achievementCount: number;
    onViewAchievements?: () => void;
}

export const CharacterStats: React.FC<CharacterStatsProps> = ({
    character,
    completedQuests,
    activeQuests,
    achievementCount,
    onViewAchievements,
}) => {
    return (
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
                    <span className="qb-stat-value">{activeQuests}</span>
                    <span className="qb-stat-label">Active Quests</span>
                </div>
                <div
                    className={`qb-stat-item ${onViewAchievements ? 'clickable' : ''}`}
                    onClick={onViewAchievements}
                    style={{ cursor: onViewAchievements ? 'pointer' : 'default' }}
                    title="View Achievements"
                >
                    <span className="qb-stat-value">🏆 {achievementCount}</span>
                    <span className="qb-stat-label">Achievements</span>
                </div>
                <div className="qb-stat-item">
                    <span className="qb-stat-value">{character.totalXP}</span>
                    <span className="qb-stat-label">Total XP</span>
                </div>
            </div>
        </div>
    );
};
