/**
 * XP System Service
 * 
 * Handles XP calculations, class bonuses, level progression, and class perks.
 */

import { Character, CharacterClass, CLASS_INFO, getLevelTier } from '../models/Character';

/**
 * XP thresholds for each level (1-30)
 * Based on age milestones
 */
export const XP_THRESHOLDS: number[] = [
    0,      // Level 1 (start)
    200,    // Level 2
    400,    // Level 3  
    750,    // Level 4
    1100,   // Level 5
    1650,   // Level 6
    2200,   // Level 7
    2800,   // Level 8
    3500,   // Level 9
    4300,   // Level 10
    5200,   // Level 11
    6100,   // Level 12
    6700,   // Level 13
    7400,   // Level 14
    8200,   // Level 15
    9100,   // Level 16
    10100,  // Level 17
    11100,  // Level 18
    12200,  // Level 19
    13400,  // Level 20
    14300,  // Level 21
    15400,  // Level 22
    16600,  // Level 23
    17900,  // Level 24
    19100,  // Level 25
    20500,  // Level 26
    22000,  // Level 27
    23600,  // Level 28
    25300,  // Level 29
    27000,  // Level 30
];

/**
 * Training mode XP thresholds (75 XP per level, 10 levels max)
 */
export const TRAINING_XP_THRESHOLDS = [0, 75, 150, 225, 300, 375, 450, 525, 600, 675];

/**
 * Max training level before graduation
 */
export const MAX_TRAINING_LEVEL = 10;

/**
 * Level-up result
 */
export interface LevelUpResult {
    didLevelUp: boolean;
    oldLevel: number;
    newLevel: number;
    tierChanged: boolean;
    oldTier: number;
    newTier: number;
}

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): number {
    for (let level = XP_THRESHOLDS.length - 1; level >= 0; level--) {
        if (totalXP >= XP_THRESHOLDS[level]) {
            return level + 1;
        }
    }
    return 1;
}

/**
 * Calculate training level from training XP
 */
export function calculateTrainingLevel(trainingXP: number): number {
    for (let level = TRAINING_XP_THRESHOLDS.length - 1; level >= 0; level--) {
        if (trainingXP >= TRAINING_XP_THRESHOLDS[level]) {
            return Math.min(level + 1, MAX_TRAINING_LEVEL);
        }
    }
    return 1;
}

/**
 * Check if character is ready to graduate from training
 */
export function canGraduate(trainingLevel: number): boolean {
    return trainingLevel >= MAX_TRAINING_LEVEL;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
    if (currentLevel >= 30) return XP_THRESHOLDS[29];
    return XP_THRESHOLDS[currentLevel] || 200;
}

/**
 * Get XP progress within current level (0-1)
 */
export function getXPProgress(totalXP: number): number {
    const level = calculateLevel(totalXP);
    if (level >= 30) return 1;

    const currentThreshold = XP_THRESHOLDS[level - 1];
    const nextThreshold = XP_THRESHOLDS[level];
    const xpInLevel = totalXP - currentThreshold;
    const xpNeeded = nextThreshold - currentThreshold;

    return Math.min(1, xpInLevel / xpNeeded);
}

/**
 * Check if a category matches a class's bonus categories
 */
export function categoryMatchesClass(
    category: string,
    characterClass: CharacterClass
): boolean {
    const classInfo = CLASS_INFO[characterClass];
    const normalizedCategory = category.toLowerCase().trim();

    return classInfo.bonusCategories.some(
        bonus => normalizedCategory.includes(bonus.toLowerCase())
    );
}

/**
 * Get class bonus multiplier for a category
 * Returns 1.0 (no bonus) or 1.15 (15% bonus) based on class
 */
export function getClassBonus(
    characterClass: CharacterClass,
    category: string
): number {
    if (categoryMatchesClass(category, characterClass)) {
        return 1 + (CLASS_INFO[characterClass].bonusPercent / 100);
    }
    return 1.0;
}

/**
 * Get combined class bonus (primary + secondary if unlocked)
 */
export function getCombinedClassBonus(
    character: Character,
    category: string
): number {
    let bonus = getClassBonus(character.class, category);

    // Secondary class adds half bonus
    if (character.secondaryClass) {
        const secondaryBonus = getClassBonus(character.secondaryClass, category);
        if (secondaryBonus > 1.0) {
            bonus += (secondaryBonus - 1) * 0.5; // Half of secondary bonus
        }
    }

    return bonus;
}

/**
 * Calculate XP with all applicable bonuses
 */
export function calculateXPWithBonus(
    baseXP: number,
    category: string,
    character: Character,
    options: {
        isStreak?: boolean;
        streakDays?: number;
        isMultiDayProject?: boolean;
        completedFasterThanEstimate?: boolean;
    } = {}
): number {
    let totalXP = baseXP;

    // Apply class bonus
    totalXP *= getCombinedClassBonus(character, category);

    // Apply class-specific perks
    const classInfo = CLASS_INFO[character.class];

    switch (character.class) {
        case 'warrior':
            // Task Slayer: Completion streaks grant additional 5% XP
            if (options.isStreak && options.streakDays && options.streakDays > 1) {
                totalXP *= 1.05;
            }
            break;

        case 'technomancer':
            // Code Warrior: Multi-day project quests grant 25% bonus XP
            if (options.isMultiDayProject) {
                totalXP *= 1.25;
            }
            break;

        case 'rogue':
            // Clever Shortcut: Complete quests faster than estimated for 20% bonus XP
            if (options.completedFasterThanEstimate) {
                totalXP *= 1.20;
            }
            break;

        case 'cleric':
            // Self-Care Aura: Wellness streaks grant stacking bonus (+5% per day)
            if (options.isStreak && options.streakDays &&
                categoryMatchesClass(category, 'cleric')) {
                totalXP *= 1 + (0.05 * Math.min(options.streakDays, 7)); // Cap at 35%
            }
            break;
    }

    return Math.round(totalXP);
}

/**
 * Check if XP gain resulted in level up
 */
export function checkLevelUp(
    oldXP: number,
    newXP: number,
    isTrainingMode: boolean
): LevelUpResult {
    if (isTrainingMode) {
        const oldLevel = calculateTrainingLevel(oldXP);
        const newLevel = calculateTrainingLevel(newXP);

        return {
            didLevelUp: newLevel > oldLevel,
            oldLevel,
            newLevel,
            tierChanged: false,
            oldTier: 1,
            newTier: 1,
        };
    }

    const oldLevel = calculateLevel(oldXP);
    const newLevel = calculateLevel(newXP);
    const oldTier = getLevelTier(oldLevel);
    const newTier = getLevelTier(newLevel);

    return {
        didLevelUp: newLevel > oldLevel,
        oldLevel,
        newLevel,
        tierChanged: newTier > oldTier,
        oldTier,
        newTier,
    };
}

/**
 * Calculate class change cost
 * Cost = current level × 100 XP
 */
export function getClassChangeCost(level: number): number {
    return level * 100;
}

/**
 * Check if character can afford class change
 */
export function canAffordClassChange(character: Character): boolean {
    const cost = getClassChangeCost(character.level);
    return character.totalXP >= cost;
}

/**
 * Get level-up celebration message based on class
 */
export function getLevelUpMessage(
    characterClass: CharacterClass,
    newLevel: number,
    tierChanged: boolean
): string {
    const classInfo = CLASS_INFO[characterClass];

    if (tierChanged) {
        const tierMessages: Record<number, string> = {
            2: `${classInfo.emoji} Your power grows! You've reached a new tier of strength.`,
            3: `${classInfo.emoji} Impressive! Your ${classInfo.name} abilities are maturing.`,
            4: `${classInfo.emoji} Remarkable progress! Few reach this level of mastery.`,
            5: `${classInfo.emoji} LEGENDARY! You have achieved ultimate ${classInfo.name} status!`,
        };
        const tier = getLevelTier(newLevel);
        return tierMessages[tier] || `${classInfo.emoji} Level ${newLevel}!`;
    }

    const messages = [
        `${classInfo.emoji} Level ${newLevel}! Keep up the great work!`,
        `${classInfo.emoji} You've reached Level ${newLevel}! Onward!`,
        `${classInfo.emoji} Level ${newLevel} achieved! Your journey continues!`,
    ];

    return messages[newLevel % messages.length];
}
