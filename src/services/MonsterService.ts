/**
 * Monster Service
 * 
 * Creates monster instances from templates with level scaling,
 * tier modifiers, and prefix system.
 */

import {
    Monster,
    MonsterTemplate,
    MonsterPrefix,
    MonsterSpawnOptions,
    PREFIX_CONFIG,
    PREFIX_DROP_RATES,
} from '../models/Monster';
import { MONSTER_TEMPLATES, getMonsterTemplate } from '../data/monsters';
import { MonsterTier, MONSTER_TIER_CONFIG, BASE_MONSTER_POWER, getMonsterPowerMultiplier } from '../config/combatConfig';

// =====================
// CONSTANTS
// =====================

/** Standard growth values per level (multiplied by template growth rates) */
const BASE_HP_GROWTH = 24;
const BASE_ATTACK_GROWTH = 8;
const BASE_DEFENSE_GROWTH = 3.5;
const BASE_MAGIC_DEF_GROWTH = 3.5;
const BASE_SPEED_GROWTH = 0.5;

/** Base crit and dodge chances for monsters */
const BASE_CRIT_CHANCE = 5;
const BASE_DODGE_CHANCE = 5;
const DODGE_PER_LEVEL = 0.2;

// =====================
// MONSTER CREATION
// =====================

/**
 * Create a monster instance from a template.
 * Applies level scaling, tier modifiers, and prefix bonuses.
 */
export function createMonster(
    templateId: string,
    level: number,
    tier: MonsterTier = 'overworld',
    options: MonsterSpawnOptions = {}
): Monster | null {
    const template = getMonsterTemplate(templateId);
    if (!template) {
        console.warn(`[MonsterService] Template not found: ${templateId}`);
        return null;
    }

    // Roll or use forced prefix
    const prefix = options.forcePrefix ?? rollPrefix();
    const prefixConfig = PREFIX_CONFIG[prefix];
    const tierConfig = MONSTER_TIER_CONFIG[tier];

    // Calculate scaled stats
    const scaledStats = calculateScaledStats(template, level);

    // Apply tier multipliers
    let hp = Math.floor(scaledStats.hp * tierConfig.hpMultiplier);
    let attack = Math.floor(scaledStats.attack * tierConfig.attackMultiplier);
    let defense = Math.floor(scaledStats.defense * tierConfig.defenseMultiplier);
    let magicDefense = Math.floor(scaledStats.magicDefense * tierConfig.defenseMultiplier);

    // Apply monster power scaling (tuned from simulation v25)
    const powerMultiplier = BASE_MONSTER_POWER * getMonsterPowerMultiplier(level);
    hp = Math.floor(hp * powerMultiplier);
    attack = Math.floor(attack * powerMultiplier);

    // Apply prefix multipliers
    hp = Math.floor(hp * prefixConfig.hpMultiplier);
    attack = Math.floor(attack * prefixConfig.attackMultiplier);
    defense = Math.floor(defense * prefixConfig.defenseMultiplier);
    magicDefense = Math.floor(magicDefense * prefixConfig.defenseMultiplier);

    // Apply stat variance (±X%)
    const variance = template.statVariance;
    hp = applyVariance(hp, variance);
    attack = applyVariance(attack, variance);
    defense = applyVariance(defense, variance);
    magicDefense = applyVariance(magicDefense, variance);

    // Calculate crit and dodge
    const critChance = tierConfig.critBonus;
    const dodgeChance = Math.min(15, BASE_DODGE_CHANCE + level * DODGE_PER_LEVEL);

    // Calculate rewards
    const [minGold, maxGold] = template.baseGold;
    const goldBase = randomRange(minGold, maxGold) * level;
    const goldReward = Math.floor(goldBase * tierConfig.hpMultiplier); // Harder = more gold
    const xpReward = Math.floor(template.baseXP * level * prefixConfig.xpMultiplier);

    // Build display name
    const displayName = `${prefixConfig.namePrefix}${tierConfig.namePrefix}${template.name}`;

    return {
        id: generateMonsterId(),
        templateId: template.id,
        name: displayName,
        description: template.description,
        category: template.category,
        affinity: template.affinity,
        prefix,
        tier,
        level,

        maxHP: hp,
        currentHP: hp,
        attack,
        defense,
        magicDefense,
        speed: scaledStats.speed,
        critChance,
        dodgeChance,

        goldReward,
        xpReward,
        uniqueDropId: template.uniqueDropId,
        lootTierBonus: template.lootTierBonus ?? 0,

        emoji: template.emoji,
        spriteId: template.spriteId,
        tint: prefixConfig.tint,
    };
}

/**
 * Calculate raw scaled stats at a given level (before tier/prefix modifiers)
 */
function calculateScaledStats(
    template: MonsterTemplate,
    level: number
): { hp: number; attack: number; defense: number; magicDefense: number; speed: number } {
    let hp = template.baseHP;
    let attack = template.baseAttack;
    let defense = template.baseDefense;
    let magicDefense = template.baseMagicDefense;
    let speed = template.baseSpeed;

    // Apply exponential growth for each level (7.5% per level, matching combat simulator)
    for (let lvl = 2; lvl <= level; lvl++) {
        const multiplier = 1 + (lvl * 0.075);

        hp += Math.floor(BASE_HP_GROWTH * multiplier * template.hpGrowth);
        attack += Math.floor(BASE_ATTACK_GROWTH * multiplier * template.attackGrowth);
        defense += Math.floor(BASE_DEFENSE_GROWTH * multiplier * template.defenseGrowth);
        magicDefense += Math.floor(BASE_MAGIC_DEF_GROWTH * multiplier * template.magicDefGrowth);
        speed += Math.floor(BASE_SPEED_GROWTH * multiplier);
    }

    return { hp, attack, defense, magicDefense, speed };
}

// =====================
// PREFIX SYSTEM
// =====================

/**
 * Roll a random monster prefix based on drop rates.
 * 60% none, 20% fierce, 15% sturdy, 5% ancient
 */
export function rollPrefix(): MonsterPrefix {
    const roll = Math.random() * 100;
    let cumulative = 0;

    for (const [prefix, rate] of Object.entries(PREFIX_DROP_RATES)) {
        cumulative += rate;
        if (roll < cumulative) {
            return prefix as MonsterPrefix;
        }
    }

    return 'none';
}

// =====================
// MONSTER SELECTION
// =====================

/**
 * Select a random monster template.
 * Optionally filter by category.
 */
export function getRandomMonsterTemplate(category?: string): MonsterTemplate {
    let pool = MONSTER_TEMPLATES;

    if (category) {
        pool = pool.filter(t => t.category === category);
    }

    if (pool.length === 0) {
        pool = MONSTER_TEMPLATES; // Fallback to all
    }

    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Select a monster level based on player level.
 * Weighted toward player level (bell curve within ±3 levels).
 */
export function selectMonsterLevel(playerLevel: number): number {
    const minLevel = Math.max(1, playerLevel - 3);
    const maxLevel = Math.min(43, playerLevel + 3);

    const roll = Math.random() * 100;

    let level: number;
    if (roll < 50) {
        // 50% chance: same level
        level = playerLevel;
    } else if (roll < 75) {
        // 25% chance: ±1 level
        level = playerLevel + randomRange(-1, 1);
    } else if (roll < 90) {
        // 15% chance: ±2 levels
        level = playerLevel + randomRange(-2, 2);
    } else {
        // 10% chance: full range
        level = randomRange(minLevel, maxLevel);
    }

    // Clamp to valid level range
    return Math.max(1, Math.min(43, level));
}

/**
 * Create a random monster encounter.
 * Main entry point for /fight command.
 */
export function createRandomMonster(
    playerLevel: number,
    tier: MonsterTier = 'overworld'
): Monster | null {
    const template = getRandomMonsterTemplate();
    const level = selectMonsterLevel(playerLevel);

    return createMonster(template.id, level, tier);
}

// =====================
// UTILITIES
// =====================

/**
 * Apply random variance to a stat (±variance%)
 */
function applyVariance(value: number, variance: number): number {
    const delta = value * variance;
    const adjustment = (Math.random() * 2 - 1) * delta;
    return Math.max(1, Math.floor(value + adjustment));
}

/**
 * Generate random integer in range (inclusive)
 */
function randomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate unique monster instance ID
 */
function generateMonsterId(): string {
    return `monster_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// =====================
// EXPORTS
// =====================

export const monsterService = {
    createMonster,
    createRandomMonster,
    getRandomMonsterTemplate,
    selectMonsterLevel,
    rollPrefix,
};
