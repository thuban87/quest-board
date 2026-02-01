/**
 * Monster Types
 * 
 * Type definitions for the monster system.
 * Runtime monster instances are created from templates via MonsterService.
 */

import { MonsterTier } from '../config/combatConfig';
import { MonsterSkill, ElementalType } from './Skill';
import { StatusEffect } from './StatusEffect';

// =====================
// MONSTER CATEGORIES
// =====================

export type MonsterCategory =
    | 'beasts'
    | 'undead'
    | 'goblins'
    | 'trolls'
    | 'night_elves'
    | 'dwarves'
    | 'dragonkin'
    | 'aberrations';

export const MONSTER_CATEGORY_ICONS: Record<MonsterCategory, string> = {
    beasts: '🐺',
    undead: '💀',
    goblins: '👺',
    trolls: '🧌',
    night_elves: '🧛',
    dwarves: '⛏️',
    dragonkin: '🐉',
    aberrations: '👁️',
};

// =====================
// ELEMENTAL AFFINITIES
// =====================

export type ElementalAffinity = 'none' | 'dark' | 'earth' | 'fire' | 'arcane';

// =====================
// MONSTER PREFIX SYSTEM
// =====================

export type MonsterPrefix = 'none' | 'fierce' | 'sturdy' | 'ancient';

export interface PrefixConfig {
    namePrefix: string;
    hpMultiplier: number;
    attackMultiplier: number;
    defenseMultiplier: number;
    xpMultiplier: number;
    tint: string; // CSS color for UI tinting
}

export const PREFIX_CONFIG: Record<MonsterPrefix, PrefixConfig> = {
    none: {
        namePrefix: '',
        hpMultiplier: 1.0,
        attackMultiplier: 1.0,
        defenseMultiplier: 1.0,
        xpMultiplier: 1.0,
        tint: '',
    },
    fierce: {
        namePrefix: 'Fierce ',
        hpMultiplier: 1.0,
        attackMultiplier: 1.1, // +10% attack
        defenseMultiplier: 1.0,
        xpMultiplier: 1.1,
        tint: 'var(--color-red)',
    },
    sturdy: {
        namePrefix: 'Sturdy ',
        hpMultiplier: 1.1, // +10% HP
        attackMultiplier: 1.0,
        defenseMultiplier: 1.0,
        xpMultiplier: 1.1,
        tint: 'var(--color-green)',
    },
    ancient: {
        namePrefix: 'Ancient ',
        hpMultiplier: 1.2, // +20% HP
        attackMultiplier: 1.2, // +20% attack
        defenseMultiplier: 1.2, // +20% defense
        xpMultiplier: 1.5,
        tint: 'var(--color-purple)',
    },
};

/** Prefix drop rates (should sum to 100) */
export const PREFIX_DROP_RATES: Record<MonsterPrefix, number> = {
    none: 60,
    fierce: 20,
    sturdy: 15,
    ancient: 5,
};

// =====================
// MONSTER TEMPLATE
// =====================

/**
 * Static monster template - defines a monster type.
 * Templates are stored in src/data/monsters.ts
 */
export interface MonsterTemplate {
    id: string;
    name: string;
    description: string;
    category: MonsterCategory;
    affinity: ElementalAffinity;

    // Base stats at level 1
    baseHP: number;
    baseAttack: number;
    baseDefense: number;
    baseMagicDefense: number;
    baseSpeed: number; // For initiative

    // Per-level growth (uses 7.5% exponential formula)
    // These are multipliers on the standard growth values
    hpGrowth: number;      // Default 1.0, tank = 1.2, glass cannon = 0.8
    attackGrowth: number;
    defenseGrowth: number;
    magicDefGrowth: number;

    // Stat variance (±percentage on final stats)
    statVariance: number; // Default 0.15 (15%)

    // Rewards
    baseGold: [number, number]; // [min, max] per level
    baseXP: number; // Multiplied by level

    // Visual
    emoji: string;
    spriteId?: string; // Future: actual sprite asset

    // Loot configuration (optional)
    uniqueDropId?: string; // ID from uniqueItems.ts for boss drops
    lootTierBonus?: number; // +/- tier for loot rolls

    // Skills System (Phase 5)
    skillPool?: string[]; // IDs of skills this monster can use
    inherentType?: ElementalType; // Elemental type for damage calculations

    // Boss System
    /** If true, this is a boss template with signature skills and special UI */
    isBoss?: boolean;
}

// =====================
// MONSTER INSTANCE
// =====================

/**
 * Runtime monster instance - a specific monster in combat.
 * Created from a template via MonsterService.createMonster()
 */
export interface Monster {
    // Identity
    id: string; // Unique instance ID
    templateId: string;
    name: string; // Includes prefix, e.g. "Fierce Goblin"
    description: string;
    category: MonsterCategory;
    affinity: ElementalAffinity;
    prefix: MonsterPrefix;
    tier: MonsterTier;
    level: number;

    // Combat stats (calculated from template + level + tier + prefix)
    maxHP: number;
    currentHP: number;
    attack: number;
    defense: number;
    magicDefense: number;
    speed: number;
    critChance: number;
    dodgeChance: number;

    // Rewards
    goldReward: number;
    xpReward: number;
    uniqueDropId?: string;
    lootTierBonus: number;

    // Visual
    emoji: string;
    spriteId?: string;
    tint: string; // From prefix

    // Skills System (Phase 5)
    skills: MonsterSkill[]; // Skills this monster has equipped
    battleState: {
        /** Stat stage modifiers (-6 to +6) */
        statStages: { atk: number; def: number; speed: number };
        /** Active status effects */
        statusEffects: StatusEffect[];
        /** Skills already used this battle (for once-per-battle skills) */
        skillsUsedThisBattle: string[];
    };
}

// =====================
// HELPER TYPES
// =====================

/**
 * Monster spawn options
 */
export interface MonsterSpawnOptions {
    tier?: MonsterTier;
    forcePrefix?: MonsterPrefix;
    templateId?: string; // Specific monster instead of random
}
