/**
 * StreakDisplay - Current and best streak with motivational message.
 *
 * Shared sub-component used by both CharacterSidebar and CharacterPage.
 */

import React from 'react';
import { getStreakDisplay, getStreakMessage } from '../../services/StreakService';

interface StreakDisplayProps {
    currentStreak: number;
    highestStreak: number;
    compact?: boolean;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
    currentStreak,
    highestStreak,
    compact = false,
}) => {
    return (
        <div className="qb-sheet-streak">
            <h3>🔥 Activity Streak</h3>
            <div className="qb-streak-info">
                <div className="qb-streak-current">
                    <span className="qb-streak-label">Current</span>
                    <span className="qb-streak-value">{getStreakDisplay(currentStreak)}</span>
                </div>
                <div className="qb-streak-best">
                    <span className="qb-streak-label">Best</span>
                    <span className="qb-streak-value">{highestStreak} days</span>
                </div>
            </div>
            <p className="qb-streak-message">{getStreakMessage(currentStreak)}</p>
        </div>
    );
};
