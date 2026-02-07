/**
 * Achievement Service
 * 
 * Handles checking achievement conditions and unlocking.
 */

import { Vault } from 'obsidian';
import { Achievement, isUnlocked } from '../models/Achievement';
import { getDefaultAchievements } from '../data/achievements';
import { Character } from '../models/Character';

/**
 * Result of checking achievements
 */
export interface AchievementCheckResult {
    newlyUnlocked: Achievement[];
    totalXpBonus: number;
}

/**
 * Calculate current progress for achievements based on character state.
 * SINGLE SOURCE OF TRUTH - used by both sidebar and modal views.
 * 
 * @param achievements - Array of achievements
 * @param character - Current character state
 * @param totalQuestsCompleted - Optional count of total completed quests
 * @returns New array with updated progress values
 */
export function calculateAchievementProgress(
    achievements: Achievement[],
    character: Character | null,
    totalQuestsCompleted?: number
): Achievement[] {
    if (!character) return achievements;

    return achievements.map(a => {
        if (isUnlocked(a)) return a;

        let progress = a.progress || 0;
        switch (a.trigger.type) {
            case 'level':
                progress = character.isTrainingMode ? character.trainingLevel : character.level;
                break;
            case 'streak':
                progress = character.currentStreak || 0;
                break;
            case 'quest_count':
                if (totalQuestsCompleted !== undefined) {
                    progress = totalQuestsCompleted;
                }
                break;
            // category_count uses cached progress
        }
        return { ...a, progress };
    });
}

/**
 * Achievement Service
 */
export class AchievementService {
    private vault: Vault;

    constructor(vault: Vault) {
        this.vault = vault;
    }

    /**
     * Initialize achievements array - merges defaults with saved state
     */
    initializeAchievements(savedAchievements: Achievement[]): Achievement[] {
        const defaults = getDefaultAchievements();
        const achievementMap = new Map<string, Achievement>();

        // Start with defaults
        for (const achievement of defaults) {
            achievementMap.set(achievement.id, { ...achievement });
        }

        // Overlay saved state (preserves unlock dates, progress, custom achievements)
        for (const saved of savedAchievements) {
            if (achievementMap.has(saved.id)) {
                // Merge saved state into default
                const existing = achievementMap.get(saved.id)!;
                achievementMap.set(saved.id, {
                    ...existing,
                    unlockedAt: saved.unlockedAt,
                    progress: saved.progress,
                });
            } else {
                // Custom achievement - keep as-is
                achievementMap.set(saved.id, saved);
            }
        }

        return Array.from(achievementMap.values());
    }

    /**
     * Check level achievements
     */
    checkLevelAchievements(
        achievements: Achievement[],
        currentLevel: number
    ): AchievementCheckResult {
        const newlyUnlocked: Achievement[] = [];
        let totalXpBonus = 0;

        for (const achievement of achievements) {
            if (isUnlocked(achievement)) continue;
            if (achievement.trigger.type !== 'level') continue;

            // Update progress
            achievement.progress = currentLevel;

            // Check if unlocked
            if (currentLevel >= achievement.trigger.target) {
                achievement.unlockedAt = new Date().toISOString();
                newlyUnlocked.push(achievement);
                totalXpBonus += achievement.xpBonus;
            }
        }

        return { newlyUnlocked, totalXpBonus };
    }

    /**
     * Check category count achievements (applications, interviews, etc.)
     */
    checkCategoryCountAchievements(
        achievements: Achievement[],
        category: string,
        count: number
    ): AchievementCheckResult {
        const newlyUnlocked: Achievement[] = [];
        let totalXpBonus = 0;

        for (const achievement of achievements) {
            if (isUnlocked(achievement)) continue;
            if (achievement.trigger.type !== 'category_count') continue;
            if (achievement.trigger.category !== category) continue;

            // Update progress
            achievement.progress = count;

            // Check if unlocked
            if (count >= achievement.trigger.target) {
                achievement.unlockedAt = new Date().toISOString();
                newlyUnlocked.push(achievement);
                totalXpBonus += achievement.xpBonus;
            }
        }

        return { newlyUnlocked, totalXpBonus };
    }

    /**
     * Check streak achievements
     */
    checkStreakAchievements(
        achievements: Achievement[],
        currentStreak: number
    ): AchievementCheckResult {
        const newlyUnlocked: Achievement[] = [];
        let totalXpBonus = 0;

        for (const achievement of achievements) {
            if (isUnlocked(achievement)) continue;
            if (achievement.trigger.type !== 'streak') continue;

            // Update progress
            achievement.progress = currentStreak;

            // Check if unlocked
            if (currentStreak >= achievement.trigger.target) {
                achievement.unlockedAt = new Date().toISOString();
                newlyUnlocked.push(achievement);
                totalXpBonus += achievement.xpBonus;
            }
        }

        return { newlyUnlocked, totalXpBonus };
    }

    /**
     * Check total quest count achievement
     */
    checkQuestCountAchievements(
        achievements: Achievement[],
        totalQuestsCompleted: number
    ): AchievementCheckResult {
        const newlyUnlocked: Achievement[] = [];
        let totalXpBonus = 0;

        for (const achievement of achievements) {
            if (isUnlocked(achievement)) continue;
            if (achievement.trigger.type !== 'quest_count') continue;

            // Update progress
            achievement.progress = totalQuestsCompleted;

            // Check if unlocked
            if (totalQuestsCompleted >= achievement.trigger.target) {
                achievement.unlockedAt = new Date().toISOString();
                newlyUnlocked.push(achievement);
                totalXpBonus += achievement.xpBonus;
            }
        }

        return { newlyUnlocked, totalXpBonus };
    }

    /**
     * Manually unlock an achievement (for special achievements)
     */
    unlockAchievement(achievements: Achievement[], achievementId: string): Achievement | null {
        const achievement = achievements.find(a => a.id === achievementId);
        if (!achievement || isUnlocked(achievement)) return null;

        achievement.unlockedAt = new Date().toISOString();
        return achievement;
    }


    /**
     * Add a custom achievement
     */
    addCustomAchievement(
        achievements: Achievement[],
        achievement: Omit<Achievement, 'category'>
    ): Achievement {
        const customAchievement: Achievement = {
            ...achievement,
            category: 'custom',
        };
        achievements.push(customAchievement);
        return customAchievement;
    }

    /**
     * Get achievements sorted: unlocked first, then by category
     */
    getSortedAchievements(achievements: Achievement[]): Achievement[] {
        return [...achievements].sort((a, b) => {
            // Unlocked first
            if (isUnlocked(a) && !isUnlocked(b)) return -1;
            if (!isUnlocked(a) && isUnlocked(b)) return 1;

            // Then by category
            const categoryOrder = ['milestone', 'quest_count', 'streak', 'special', 'custom'];
            const aIndex = categoryOrder.indexOf(a.category);
            const bIndex = categoryOrder.indexOf(b.category);
            if (aIndex !== bIndex) return aIndex - bIndex;

            // Then by target value
            return a.trigger.target - b.trigger.target;
        });
    }

    /**
     * Get count of unlocked achievements
     */
    getUnlockedCount(achievements: Achievement[]): number {
        return achievements.filter(a => isUnlocked(a)).length;
    }
}
