/**
 * Achievement Model
 * 
 * Represents an unlockable achievement with trigger conditions.
 */

/**
 * Achievement categories
 */
export type AchievementCategory = 'milestone' | 'quest_count' | 'streak' | 'special' | 'custom';

/**
 * Trigger types for automatic unlocking
 */
export type AchievementTriggerType = 'level' | 'quest_count' | 'streak' | 'category_count' | 'manual';

/**
 * Achievement trigger condition
 */
export interface AchievementTrigger {
    type: AchievementTriggerType;
    target: number;           // Target value to reach (e.g., 10 for level 10)
    category?: string;        // For category_count: "applications", "interviews"
}

/**
 * Achievement definition
 */
export interface Achievement {
    id: string;               // Unique ID: "level-10", "applications-50"
    name: string;             // Display name: "Veteran Adventurer"
    description: string;      // Unlock requirement: "Reach Level 10"
    emoji: string;            // Fallback emoji if no badge
    category: AchievementCategory;
    trigger: AchievementTrigger;
    xpBonus: number;          // XP awarded on unlock

    // State (set when unlocked)
    unlockedAt?: string;      // ISO date string
    progress?: number;        // Current progress toward target
}

/**
 * Check if an achievement is unlocked
 */
export function isUnlocked(achievement: Achievement): boolean {
    return !!achievement.unlockedAt;
}

/**
 * Get progress percentage (0-100)
 */
export function getProgressPercent(achievement: Achievement): number {
    if (isUnlocked(achievement)) return 100;
    const progress = achievement.progress || 0;
    return Math.min(100, Math.round((progress / achievement.trigger.target) * 100));
}
