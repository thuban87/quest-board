/**
 * Test Character Generator Service
 * 
 * Generates fully configured test characters for balance testing.
 * Automatically sets level, stats, gear, skills, and resources.
 */

import {
    Character,
    CharacterClass,
    CharacterStats,
    CLASS_INFO,
    DEFAULT_STATS,
    DEFAULT_APPEARANCE,
    CHARACTER_SCHEMA_VERSION,
} from '../models/Character';
import {
    GearTier,
    EquippedGearMap,
    CLASS_WEAPON_PROFICIENCY,
} from '../models/Gear';
import { XP_THRESHOLDS } from './XPSystem';
import { getUnlockedSkills } from '../data/skills';


// =====================
// STAT SCALING
// =====================

/**
 * Calculate base stats for a class at a given level.
 * Primary stats get +1 per 2 levels, secondaries get +1 per 4 levels.
 */
export function calculateStatsForLevel(characterClass: CharacterClass, level: number): CharacterStats {
    const classInfo = CLASS_INFO[characterClass];
    const stats = { ...DEFAULT_STATS };

    // Primary stats: +2 base (from class) + 1 per 2 levels
    for (const primaryStat of classInfo.primaryStats) {
        stats[primaryStat] += 2 + Math.floor(level / 2);
    }

    // All stats: +1 per 5 levels (natural growth)
    const allStatBonus = Math.floor(level / 5);
    for (const stat of Object.keys(stats) as (keyof CharacterStats)[]) {
        stats[stat] += allStatBonus;
    }

    return stats;
}

// =====================
// GEAR GENERATION
// =====================

import { lootGenerationService } from './LootGenerationService';

/**
 * Get appropriate gear tier for a level (biased toward typical drops)
 */
function getTierForLevel(level: number): GearTier {
    // Match the tier ranges from TIER_INFO.levelRange
    if (level <= 5) return 'common';
    if (level <= 15) return 'adept';
    if (level <= 25) return 'journeyman';
    if (level <= 35) return 'master';
    return 'epic';
}

/**
 * Get a slightly better tier for key slots (weapon, chest)
 */
function getEnhancedTierForLevel(level: number): GearTier {
    if (level <= 5) return 'adept';
    if (level <= 15) return 'journeyman';
    if (level <= 25) return 'master';
    if (level <= 35) return 'epic';
    return 'legendary';
}

/**
 * Generate a complete gear set for a class at a given level
 * Uses the REAL loot generation service for accurate stats
 */
export function generateTestGear(characterClass: CharacterClass, level: number): EquippedGearMap {
    const baseTier = getTierForLevel(level);
    const enhancedTier = getEnhancedTierForLevel(level);

    // Use the actual loot generation service to create realistic gear
    const gear: EquippedGearMap = {
        head: lootGenerationService.generateGearItem('head', baseTier, level, 'quest', undefined, characterClass),
        chest: lootGenerationService.generateGearItem('chest', enhancedTier, level, 'quest', undefined, characterClass),
        legs: lootGenerationService.generateGearItem('legs', baseTier, level, 'quest', undefined, characterClass),
        boots: lootGenerationService.generateGearItem('boots', baseTier, level, 'quest', undefined, characterClass),
        weapon: lootGenerationService.generateGearItem('weapon', enhancedTier, level, 'quest', undefined, characterClass),
        shield: CLASS_WEAPON_PROFICIENCY[characterClass].includes('shield')
            ? lootGenerationService.generateGearItem('shield', baseTier, level, 'quest', undefined, characterClass)
            : null,
        accessory1: level >= 10 ? lootGenerationService.generateGearItem('accessory1', baseTier, level, 'quest', undefined, characterClass) : null,
        accessory2: level >= 20 ? lootGenerationService.generateGearItem('accessory2', baseTier, level, 'quest', undefined, characterClass) : null,
        accessory3: level >= 30 ? lootGenerationService.generateGearItem('accessory3', baseTier, level, 'quest', undefined, characterClass) : null,
    };

    return gear;
}

// =====================
// FULL CHARACTER GENERATION
// =====================

/**
 * Generate a complete test character with all appropriate stats, gear, and skills.
 */
export function generateTestCharacter(
    characterClass: CharacterClass,
    level: number,
    existingCharacter?: Character
): Character {
    const now = new Date().toISOString();
    const classInfo = CLASS_INFO[characterClass];

    // Calculate stats for this level
    const baseStats = calculateStatsForLevel(characterClass, level);

    // Calculate XP for this level
    const totalXP = level <= 1 ? 0 : (XP_THRESHOLDS[level - 1] || 0) + 100;

    // Get skills unlocked at this level
    const unlockedSkills = getUnlockedSkills(characterClass, level);
    const unlockedIds = unlockedSkills.map(s => s.id);
    // Equip up to 5 skills (exclude Meditate from auto-equip)
    const equippedIds = unlockedSkills
        .filter(s => s.id !== 'meditate')
        .slice(0, 5)
        .map(s => s.id);

    // Generate gear
    const equippedGear = generateTestGear(characterClass, level);

    // Calculate HP/Mana from stats (simplified - combatService will derive accurate values)
    const maxHP = 50 + (baseStats.constitution * 5) + (level * 10);
    const maxMana = 20 + (baseStats.intelligence * 3) + (level * 5);

    // Build character - preserve existing fields where appropriate
    const character: Character = {
        schemaVersion: CHARACTER_SCHEMA_VERSION,
        name: existingCharacter?.name || `Test ${classInfo.name}`,
        class: characterClass,
        secondaryClass: level >= 25 ? existingCharacter?.secondaryClass || null : null,
        level,
        totalXP,
        spriteVersion: (existingCharacter?.spriteVersion || 0) + 1,
        appearance: existingCharacter?.appearance || {
            ...DEFAULT_APPEARANCE,
            outfitPrimary: classInfo.primaryColor,
        },
        equippedGear,
        trainingXP: 900, // Max training XP (graduated)
        trainingLevel: 10, // Max training level
        isTrainingMode: false,
        baseStats,
        statBonuses: { strength: 0, intelligence: 0, wisdom: 0, constitution: 0, dexterity: 0, charisma: 0 },
        categoryXPAccumulator: {},
        currentStreak: existingCharacter?.currentStreak || 0,
        highestStreak: existingCharacter?.highestStreak || 0,
        lastQuestCompletionDate: existingCharacter?.lastQuestCompletionDate || null,
        shieldUsedThisWeek: false,
        createdDate: existingCharacter?.createdDate || now,
        lastModified: now,
        tasksCompletedToday: 0,
        lastTaskDate: null,
        activePowerUps: [],

        // Resources
        gold: 1000 + (level * 100),
        gearInventory: existingCharacter?.gearInventory || [],
        inventoryLimit: 50,

        // Combat
        currentHP: maxHP,
        maxHP,
        currentMana: maxMana,
        maxMana,
        stamina: 10,
        staminaGainedToday: 0,
        lastStaminaResetDate: null,

        // Exploration
        dungeonKeys: 5,
        dungeonExplorationHistory: existingCharacter?.dungeonExplorationHistory || {},

        // Status
        status: 'active',
        recoveryTimerEnd: null,

        // Activity
        activityHistory: existingCharacter?.activityHistory || [],

        // Skills
        skills: {
            unlocked: unlockedIds,
            equipped: equippedIds,
        },
        persistentStatusEffects: [],
    };

    return character;
}
