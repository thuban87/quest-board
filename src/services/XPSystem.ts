/**
 * XP System Service
 * 
 * Handles XP calculations, class bonuses, level progression, and class perks.
 */

import { Character, CharacterClass, CLASS_INFO, getLevelTier } from '../models/Character';
import { getXPMultiplierFromPowerUps } from './PowerUpService';

/**
 * XP thresholds for each level (1-40)
 * 
 * 5-Tier Progression aligned with getLevelTier():
 * Tier 1 (Levels 1-8):   Acolyte - Fast progression (tutorial phase)
 * Tier 2 (Levels 9-16):  Squire - Moderate (habit building)
 * Tier 3 (Levels 17-24): Knight - Challenging (mastery)
 * Tier 4 (Levels 25-32): Champion - Hard (late game)
 * Tier 5 (Levels 33-40): Divine Avatar - Epic (endgame)
 * 
 * Timeline: ~6 months of daily play to reach Level 40
 * Design: Fast early game for dopamine/retention, harder late game for achievement
 */
export const XP_THRESHOLDS: number[] = [
    0,       // Level 1
    500,     // Level 2 (Tier 1: +500)
    1060,    // Level 3 (+560)
    1680,    // Level 4 (+620)
    2360,    // Level 5 (+680)
    3100,    // Level 6 (+740)
    3900,    // Level 7 (+800)
    4760,    // Level 8 (+860)
    5760,    // Level 9 (Tier 2: +1000)
    6860,    // Level 10 (+1100)
    8060,    // Level 11 (+1200)
    9360,    // Level 12 (+1300)
    10760,   // Level 13 (+1400)
    12260,   // Level 14 (+1500)
    13860,   // Level 15 (+1600)
    15560,   // Level 16 (+1700)
    17160,   // Level 17 (Tier 3: +1600)
    18880,   // Level 18 (+1720)
    20720,   // Level 19 (+1840)
    22680,   // Level 20 (+1960)
    24760,   // Level 21 (+2080)
    26960,   // Level 22 (+2200)
    29280,   // Level 23 (+2320)
    31720,   // Level 24 (+2440)
    33920,   // Level 25 (Tier 4: +2200)
    36260,   // Level 26 (+2340)
    38740,   // Level 27 (+2480)
    41360,   // Level 28 (+2620)
    44120,   // Level 29 (+2760)
    47020,   // Level 30 (+2900)
    50060,   // Level 31 (+3040)
    53240,   // Level 32 (+3180)
    56340,   // Level 33 (Tier 5: +3100)
    59600,   // Level 34 (+3260)
    63020,   // Level 35 (+3420)
    66600,   // Level 36 (+3580)
    70340,   // Level 37 (+3740)
    74240,   // Level 38 (+3900)
    78300,   // Level 39 (+4060)
    82520,   // Level 40 (+4220) - Max Level
];

/**
 * Training mode XP thresholds (100 XP per level, 10 levels max)
 */
export const TRAINING_XP_THRESHOLDS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900];

/**
 * Max training level before graduation
 */
export const MAX_TRAINING_LEVEL = 10;

/**
 * Max character level
 */
export const MAX_LEVEL = 40;

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
    if (currentLevel >= MAX_LEVEL) return XP_THRESHOLDS[MAX_LEVEL - 1];
    return XP_THRESHOLDS[currentLevel] || 1200;
}

/**
 * Get XP progress within current level (0-1)
 */
export function getXPProgress(totalXP: number): number {
    const level = calculateLevel(totalXP);
    if (level >= MAX_LEVEL) return 1;

    const currentThreshold = XP_THRESHOLDS[level - 1];
    const nextThreshold = XP_THRESHOLDS[level];
    const xpInLevel = totalXP - currentThreshold;
    const xpNeeded = nextThreshold - currentThreshold;

    return Math.min(1, xpInLevel / xpNeeded);
}

/**
 * Get XP progress for a character (handles both training mode and regular mode)
 * Consolidates duplicated calculation logic from components.
 */
export function getXPProgressForCharacter(character: Character): number {
    if (character.isTrainingMode) {
        const currentThreshold = TRAINING_XP_THRESHOLDS[character.trainingLevel - 1] || 0;
        const nextThreshold = TRAINING_XP_THRESHOLDS[character.trainingLevel] || TRAINING_XP_THRESHOLDS[9];
        const xpInLevel = character.trainingXP - currentThreshold;
        const xpNeeded = nextThreshold - currentThreshold;
        return xpNeeded > 0 ? Math.min(1, xpInLevel / xpNeeded) : 1;
    }
    return getXPProgress(character.totalXP);
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
            // Self-Care Aura: Wellness streaks grant stacking bonus (+5% per day, cap 25%)
            if (options.isStreak && options.streakDays &&
                categoryMatchesClass(category, 'cleric')) {
                totalXP *= 1 + (0.05 * Math.min(options.streakDays, 5)); // Cap at 25% (5 days * 5%)
            }
            break;
    }

    // Apply power-up XP multipliers (from active buffs like First Blood, Flow State, etc.)
    if (character.activePowerUps && character.activePowerUps.length > 0) {
        const powerUpMultiplier = getXPMultiplierFromPowerUps(character.activePowerUps, category);
        if (powerUpMultiplier > 1.0) {
            totalXP *= powerUpMultiplier;
        }
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
            2: `${classInfo.emoji} Your power grows! You've reached Tier 2.`,
            3: `${classInfo.emoji} Impressive! Your ${classInfo.name} abilities are maturing.`,
            4: `${classInfo.emoji} Remarkable! Few reach this level of mastery.`,
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
