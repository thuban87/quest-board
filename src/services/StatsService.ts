/**
 * Stats Service
 * 
 * Handles stat calculations, derived stats, and XP-based stat gains.
 */

import {
    Character,
    CharacterClass,
    CharacterStats,
    StatType,
    CLASS_INFO,
    DEFAULT_STATS
} from '../models/Character';
import { getStatBoostFromPowerUps, expirePowerUps } from './PowerUpService';
import { aggregateGearStats } from './CombatService';

/**
 * Derived stats calculated from primary stats
 */
export interface DerivedStats {
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    attack: number;
    defense: number;
    critChance: number;
    speed: number;
}

/**
 * XP required to gain +1 stat point in a category
 */
export const XP_PER_STAT_POINT = 100;

/**
 * Get stat cap based on level (max bonus from quests = level × 2)
 */
export function getStatCap(level: number): number {
    return level * 2;
}

/**
 * Get total stat value (base + quest bonuses + power-up boosts + gear bonuses)
 */
export function getTotalStat(character: Character, stat: StatType): number {
    const base = character.baseStats?.[stat] || 10;
    const questBonus = character.statBonuses?.[stat] || 0;

    // Include power-up stat boosts (from buffs like Level Up, Limit Break)
    const activePowerUps = expirePowerUps(character.activePowerUps || []);
    const powerUpBoost = getStatBoostFromPowerUps(activePowerUps, stat);

    // Include gear stat bonuses
    const gearStats = aggregateGearStats(character.equippedGear);
    const gearBonus = gearStats.statBonuses[stat] || 0;

    return base + questBonus + powerUpBoost + gearBonus;
}

/**
 * Get all total stats
 */
export function getTotalStats(character: Character): CharacterStats {
    return {
        strength: getTotalStat(character, 'strength'),
        intelligence: getTotalStat(character, 'intelligence'),
        wisdom: getTotalStat(character, 'wisdom'),
        constitution: getTotalStat(character, 'constitution'),
        dexterity: getTotalStat(character, 'dexterity'),
        charisma: getTotalStat(character, 'charisma'),
    };
}

/**
 * Calculate derived stats from primary stats
 */
export function calculateDerivedStats(character: Character): DerivedStats {
    const stats = getTotalStats(character);
    const level = character.level;

    const maxHp = 50 + (stats.constitution * 5) + (level * 10);
    const maxMana = 30 + (stats.intelligence * 5) + (level * 5);

    return {
        hp: maxHp, // Current HP (full for now, combat will track this)
        maxHp,
        mana: maxMana,
        maxMana,
        attack: stats.strength,
        defense: Math.floor(stats.constitution / 2),
        critChance: stats.dexterity * 0.5,
        speed: 10 + Math.floor(stats.dexterity / 2),
    };
}

/**
 * Get the stat type for a quest category based on character class
 */
export function getStatForCategory(
    character: Character,
    category: string,
    customMappings?: Record<string, string>
): StatType {
    const normalized = category.toLowerCase().trim();

    // Check custom user mappings first
    if (customMappings?.[normalized]) {
        return customMappings[normalized] as StatType;
    }

    // Check class-specific mapping
    const classInfo = CLASS_INFO[character.class];
    if (classInfo.categoryStatMap[normalized]) {
        return classInfo.categoryStatMap[normalized];
    }

    // Fallback to class primary stat
    return classInfo.primaryStats[0];
}

/**
 * Process XP earned and update stat bonuses
 * Returns updated character with new stat bonuses if applicable
 */
export function processXPForStats(
    character: Character,
    category: string,
    xpGained: number,
    customMappings?: Record<string, string>
): { character: Character; statGained: StatType | null; newStatValue: number | null } {
    const stat = getStatForCategory(character, category, customMappings);
    const statCap = getStatCap(character.level);

    // Get current bonus for this stat
    const currentBonus = character.statBonuses?.[stat] || 0;

    // Already at cap?
    if (currentBonus >= statCap) {
        return { character, statGained: null, newStatValue: null };
    }

    // Get current accumulator for this category
    const accumulator = { ...(character.categoryXPAccumulator || {}) };
    const currentAccum = accumulator[category] || 0;
    const newAccum = currentAccum + xpGained;

    // Check if we've hit the threshold
    if (newAccum >= XP_PER_STAT_POINT) {
        // Grant stat point(s)
        const pointsToGrant = Math.floor(newAccum / XP_PER_STAT_POINT);
        const remainder = newAccum % XP_PER_STAT_POINT;

        // Calculate how many we can actually grant (up to cap)
        const availableRoom = statCap - currentBonus;
        const actualGrant = Math.min(pointsToGrant, availableRoom);

        if (actualGrant > 0) {
            // Update stat bonuses - IMPORTANT: fallback to zeros, not DEFAULT_STATS
            const zeroBonuses = { strength: 0, intelligence: 0, wisdom: 0, constitution: 0, dexterity: 0, charisma: 0 };
            const newStatBonuses = {
                ...(character.statBonuses || zeroBonuses),
                [stat]: currentBonus + actualGrant
            };

            // Update accumulator
            accumulator[category] = remainder;

            const updatedCharacter: Character = {
                ...character,
                statBonuses: newStatBonuses,
                categoryXPAccumulator: accumulator,
                lastModified: new Date().toISOString(),
            };

            return {
                character: updatedCharacter,
                statGained: stat,
                newStatValue: getTotalStat(updatedCharacter, stat)
            };
        }
    }

    // Just update accumulator, no stat gain yet
    accumulator[category] = newAccum;
    const updatedCharacter: Character = {
        ...character,
        categoryXPAccumulator: accumulator,
    };

    return { character: updatedCharacter, statGained: null, newStatValue: null };
}

/**
 * Apply level-up stat gains with EXPONENTIAL scaling
 * 
 * Aligned with gear system formula. Higher levels = bigger stat gains.
 * 
 * Formula per level:
 *   Primary stats: base + (level * 0.5)  → levels 1-10: +2-6, levels 30-40: +16-21
 *   Other stats:   base + (level * 0.25) → levels 1-10: +1-3, levels 30-40: +8-11
 * 
 * This creates exponential feel: level 40 stat gains are ~4x level 1 gains.
 */
export function applyLevelUpStats(character: Character): Character {
    const classInfo = CLASS_INFO[character.class];
    const newBaseStats = { ...character.baseStats };
    const newLevel = character.level; // This is the NEW level we just reached

    // Exponential growth: stat gain increases with level
    // Primary stats get higher scaling factor
    const primaryGain = Math.floor(2 + (newLevel * 0.5));  // Level 1: +2, Level 10: +7, Level 40: +22
    const secondaryGain = Math.floor(1 + (newLevel * 0.25)); // Level 1: +1, Level 10: +3, Level 40: +11

    // Apply primary stat gains
    for (const primaryStat of classInfo.primaryStats) {
        newBaseStats[primaryStat] += primaryGain;
    }

    // Apply secondary stat gains
    const allStats: StatType[] = ['strength', 'intelligence', 'wisdom', 'constitution', 'dexterity', 'charisma'];
    for (const stat of allStats) {
        if (!classInfo.primaryStats.includes(stat)) {
            newBaseStats[stat] += secondaryGain;
        }
    }

    return {
        ...character,
        baseStats: newBaseStats,
        lastModified: new Date().toISOString(),
    };
}

/**
 * Get stat XP progress for display (e.g., "+45/100 XP")
 */
export function getStatXPProgress(
    character: Character,
    category: string
): { current: number; max: number } {
    const accumulator = character.categoryXPAccumulator || {};
    return {
        current: accumulator[category] || 0,
        max: XP_PER_STAT_POINT,
    };
}

/**
 * Short stat name for display
 */
export const STAT_ABBREVIATIONS: Record<StatType, string> = {
    strength: 'STR',
    intelligence: 'INT',
    wisdom: 'WIS',
    constitution: 'CON',
    dexterity: 'DEX',
    charisma: 'CHA',
};

/**
 * Full stat name for display
 */
export const STAT_NAMES: Record<StatType, string> = {
    strength: 'Strength',
    intelligence: 'Intelligence',
    wisdom: 'Wisdom',
    constitution: 'Constitution',
    dexterity: 'Dexterity',
    charisma: 'Charisma',
};
