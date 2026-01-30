/**
 * Combat Configuration
 * 
 * Tuned balance constants extracted from combat-simulator.test.ts v25.
 * Target: Casual-friendly 50%+ win rate floor across all classes and encounter tiers.
 */

import { CharacterClass } from '../models/Character';

// =====================
// ATTACK STYLES
// =====================

export type AttackStyle = 'physical' | 'magic' | 'hybrid_physical' | 'hybrid_magic';

/**
 * Class combat configuration
 * - attackStyle: How the class deals damage
 * - damageModifier: Base damage bonus (1.0 = normal)
 * - hpModifier: HP bonus (1.1 = +10%)
 */
export interface ClassCombatConfig {
    attackStyle: AttackStyle;
    damageModifier: number;
    hpModifier: number;
    attackName: string;
}

export const CLASS_COMBAT_CONFIG: Record<CharacterClass, ClassCombatConfig> = {
    warrior: {
        attackStyle: 'physical',
        damageModifier: 1.0,
        hpModifier: 1.1,
        attackName: 'Slash',
    },
    paladin: {
        attackStyle: 'hybrid_physical',
        damageModifier: 1.1,
        hpModifier: 1.05,
        attackName: 'Holy Strike',
    },
    technomancer: {
        attackStyle: 'magic',
        damageModifier: 1.15,
        hpModifier: 1.0,
        attackName: 'Arcane Bolt',
    },
    scholar: {
        attackStyle: 'magic',
        damageModifier: 1.1,
        hpModifier: 1.15,
        attackName: 'Mind Blast',
    },
    rogue: {
        attackStyle: 'physical',
        damageModifier: 1.15,
        hpModifier: 1.0,
        attackName: 'Backstab',
    },
    cleric: {
        attackStyle: 'magic',
        damageModifier: 1.0,
        hpModifier: 1.1,
        attackName: 'Smite',
    },
    bard: {
        attackStyle: 'hybrid_magic',
        damageModifier: 1.1,
        hpModifier: 1.05,
        attackName: 'Dissonance',
    },
};

// =====================
// LEVEL MODIFIERS
// =====================

/**
 * Level-specific damage and HP modifiers for granular balance.
 * Boosts weak spots, nerfs dominant ranges.
 */
export function getLevelModifier(cls: CharacterClass, level: number): { damage: number; hp: number } {
    let damage = 1.0;
    let hp = 1.0;

    // TANKS (Warrior, Cleric): Softened penalties for casual game
    if (cls === 'warrior') {
        hp = 1.1;
        if (level >= 18 && level <= 22) {
            damage = 1.15;
        } else if (level >= 15) {
            damage = 0.85;
        }
    }
    if (cls === 'cleric') {
        hp = 1.1;
        if (level >= 13 && level <= 17) {
            damage = 1.2;
        } else if (level >= 18 && level <= 22) {
            damage = 1.15;
        } else if (level >= 23) {
            damage = 0.85;
        }
    }

    // GLASS CANNONS (Technomancer, Rogue): Nerf late, boost early
    if (cls === 'technomancer' || cls === 'rogue') {
        if (level >= 3 && level <= 7) {
            damage = 1.3;
            hp = 1.15;
        } else if (level >= 20) {
            damage = 0.85;
        }
    }

    // HYBRIDS (Paladin, Bard): Boost weak level ranges
    if (cls === 'paladin') {
        if (level >= 3 && level <= 7) {
            damage = 1.4;
            hp = 1.2;
        } else if (level >= 8 && level <= 12) {
            damage = 1.35;
            hp = 1.15;
        } else if (level >= 18 && level <= 22) {
            damage = 1.25;
            hp = 1.1;
        } else if (level >= 23) {
            damage = 0.9;
        }
    }
    if (cls === 'bard') {
        if (level >= 3 && level <= 7) {
            damage = 1.4;
            hp = 1.2;
        } else if (level >= 20) {
            damage = 0.9;
        }
    }

    // SCHOLAR: Extra HP, nerf late damage
    if (cls === 'scholar') {
        hp = 1.1;
        if (level >= 20) {
            damage = 0.9;
        }
    }

    return { damage, hp };
}

// =====================
// COMBAT CONSTANTS
// =====================

/** Critical hit multiplier (2.0x for satisfying big numbers) */
export const CRIT_MULTIPLIER = 2.0;

/** Maximum dodge chance (25%) */
export const DODGE_CAP = 25;

/** Base crit chance per DEX point (0.5%) */
export const CRIT_PER_DEX = 0.5;

/** Dodge chance per DEX point (0.25% - reduced from 0.5 for balance) */
export const DODGE_PER_DEX = 0.25;

/** Damage variance (±10%) */
export const DAMAGE_VARIANCE = 0.1;

/** Minimum damage per hit */
export const MIN_DAMAGE = 1;

// =====================
// SPEED SYSTEM (Phase 5)
// =====================

/** Base speed value for turn order calculation */
export const SPEED_BASE = 10;

// =====================
// STAT STAGES (Phase 5)
// =====================

/** Minimum stat stage (Pokemon-style -6) */
export const MIN_STAGE = -6;

/** Maximum stat stage (Pokemon-style +6) */
export const MAX_STAGE = 6;

/** Multiplier per stage (50% per stage = 1.5x at +1, 2.25x at +2, etc.) */
export const STAGE_MULTIPLIER_PERCENT = 0.50;

/**
 * Get the multiplier for a given stat stage.
 * Stage 0 = 1.00x
 * Stage +1 = 1.50x, +2 = 2.25x, +3 = 3.38x, ... +6 = 11.39x
 * Stage -1 = 0.67x, -2 = 0.50x, -3 = 0.40x, ... -6 = 0.09x
 * Formula: 1.5^stage for positive, 1/(1.5^|stage|) for negative
 */
export function getStageMultiplier(stage: number): number {
    const clampedStage = Math.max(MIN_STAGE, Math.min(MAX_STAGE, stage));
    return Math.pow(1 + STAGE_MULTIPLIER_PERCENT, clampedStage);
}

// =====================
// GEAR TIER MULTIPLIERS
// =====================

import { GearTier } from '../models/Gear';

export const TIER_STAT_MULTIPLIERS: Record<GearTier, number> = {
    common: 0.5,
    adept: 1.0,
    journeyman: 1.5,
    master: 2.0,
    epic: 2.5,
    legendary: 3.0,
};

/**
 * Get expected gear tier for a character level
 */
export function getExpectedTierForLevel(level: number): GearTier {
    if (level <= 5) return 'common';
    if (level <= 12) return 'adept';
    if (level <= 20) return 'journeyman';
    if (level <= 28) return 'master';
    if (level <= 35) return 'epic';
    return 'legendary';
}

// =====================
// MONSTER TIER MULTIPLIERS
// =====================

export type MonsterTier = 'overworld' | 'elite' | 'dungeon' | 'boss' | 'raid_boss';

export interface MonsterTierConfig {
    hpMultiplier: number;
    attackMultiplier: number;
    defenseMultiplier: number;
    critBonus: number;
    namePrefix: string;
}

export const MONSTER_TIER_CONFIG: Record<MonsterTier, MonsterTierConfig> = {
    overworld: {
        hpMultiplier: 1.0,
        attackMultiplier: 1.0,
        defenseMultiplier: 1.0,
        critBonus: 5,
        namePrefix: '',
    },
    elite: {
        hpMultiplier: 1.05,      // V3 - tuned from elite balance sim
        attackMultiplier: 1.02,  // V3 - slightly harder than overworld
        defenseMultiplier: 1.0,  // V3 - no defense bonus
        critBonus: 6,            // V3 - modest crit bonus
        namePrefix: 'Elite ',    // Default prefix (actual uses random variety)
    },
    dungeon: {
        hpMultiplier: 1.02,  // Was 1.05 - tuned from simulation v25
        attackMultiplier: 1.01,  // Was 1.0
        defenseMultiplier: 1.0,
        critBonus: 5,
        namePrefix: 'Dungeon ',
    },
    boss: {
        hpMultiplier: 1.06,  // Was 1.15 - tuned from simulation v25
        attackMultiplier: 1.04,  // Was 1.05
        defenseMultiplier: 1.0,
        critBonus: 6,
        namePrefix: 'Boss: ',
    },
    raid_boss: {
        hpMultiplier: 1.1,  // Was 1.2 - tuned from simulation v25
        attackMultiplier: 1.06,  // Was 1.05
        defenseMultiplier: 1.0,
        critBonus: 6,
        namePrefix: 'RAID BOSS: ',
    },
};

// =====================
// MONSTER POWER SCALING
// =====================

/** Base monster power multiplier (applied to HP and ATK) */
export const BASE_MONSTER_POWER = 1.12;

// =====================
// ELITE SPAWN CONFIG
// =====================

/** Minimum level to encounter elite monsters */
export const ELITE_LEVEL_UNLOCK = 5;

/** Base chance for bounty to spawn elite (30%) */
export const ELITE_BOUNTY_CHANCE = 0.30;

/** Base chance for overworld fight to spawn elite (15%) */
export const ELITE_OVERWORLD_CHANCE = 0.15;

/** Name prefixes for elite monsters (random selection) */
export const ELITE_NAME_PREFIXES = [
    'Elite',
    'Champion',
    'Veteran',
    'Alpha',
    'Savage',
    'Enraged',
];

/**
 * Level-specific monster power curve.
 * Adjusts difficulty at different level ranges.
 * Values below 1.0 = easier, above 1.0 = harder
 */
export function getMonsterPowerMultiplier(level: number): number {
    if (level <= 3) return 0.92;   // Early game buffer
    if (level <= 5) return 0.89;   // L4-5 slightly easier
    if (level <= 12) return 0.91;  // L6-12
    if (level <= 19) return 0.95;  // L13-19
    if (level <= 29) return 0.98;  // L20-29
    if (level <= 32) return 0.91;  // "Welcome to your 30s" hidden buff
    if (level <= 35) return 0.93;  // L33-35
    return 0.94;                   // L36+
}

/** Tank penalty for raid bosses (Warrior, Cleric get -15% damage) */
export const RAID_BOSS_TANK_PENALTY = 0.85;

// =====================
// STAMINA CONSTANTS
// =====================

/** Maximum current stamina pool */
export const MAX_STAMINA = 10;

/** Stamina earned per completed task */
export const STAMINA_PER_TASK = 2;

/** Stamina cost per random fight */
export const STAMINA_PER_FIGHT = 1;

/** Maximum stamina that can be earned per day */
export const MAX_DAILY_STAMINA = 50;

/** Quest bounty fights are free (no stamina cost) */
export const QUEST_BOUNTY_FREE = true;

// =====================
// HP/MANA FORMULAS
// =====================

/** 
 * HP Formula: 200 + (Constitution * 2) + (Level * 10) + GearBonus
 * Note: Tanks (Warrior/Cleric) use CON×1 to balance their high CON
 * Tuned from simulation v25 for early game survivability
 */
export const HP_BASE = 200;  // Was 50
export const HP_PER_CON = 2;  // Was 5 - reduced to balance tank dominance
export const HP_PER_CON_TANK = 1;  // Tanks get reduced CON→HP scaling
export const HP_PER_LEVEL = 10;

/**
 * Mana Formula: 20 + (Intelligence * 3) + (Level * 5) + GearBonus
 */
export const MANA_BASE = 20;
export const MANA_PER_INT = 3;
export const MANA_PER_LEVEL = 5;

// =====================
// LOOT & ECONOMY
// =====================

/** Quest bounty loot luck bonus (2.0 = +200%) */
export const QUEST_BOUNTY_LOOT_BONUS = 2.0;

/** Gold penalty on defeat (10%) */
export const DEFEAT_GOLD_PENALTY = 0.10;

/** Revive potion cost from store */
export const REVIVE_POTION_COST = 200;

// =====================
// TYPE EFFECTIVENESS (Phase 5)
// =====================

export type ElementalType =
    | 'Physical' | 'Fire' | 'Ice' | 'Lightning'
    | 'Earth' | 'Arcane' | 'Dark' | 'Light'
    | 'Poison' | 'Nature' | 'Psychic';

/**
 * Type effectiveness chart (Pokemon-style)
 * - strong: 2x damage dealt
 * - weak: 0.5x damage dealt
 * - immune: never (all types can damage all types)
 */
export const TYPE_CHART: Record<ElementalType, { strong: ElementalType[]; weak: ElementalType[] }> = {
    Physical: { strong: ['Arcane'], weak: ['Earth', 'Dark'] },
    Fire: { strong: ['Ice', 'Nature'], weak: ['Fire', 'Earth'] },
    Ice: { strong: ['Nature', 'Lightning'], weak: ['Fire', 'Ice'] },
    Lightning: { strong: ['Fire', 'Psychic'], weak: ['Earth', 'Lightning'] },
    Earth: { strong: ['Lightning', 'Physical'], weak: ['Nature', 'Ice'] },
    Arcane: { strong: ['Dark', 'Psychic'], weak: ['Physical', 'Light'] },
    Dark: { strong: ['Light', 'Psychic'], weak: ['Arcane', 'Dark'] },
    Light: { strong: ['Dark', 'Poison'], weak: ['Arcane', 'Light'] },
    Poison: { strong: ['Nature', 'Physical'], weak: ['Light', 'Earth'] },
    Nature: { strong: ['Earth', 'Psychic'], weak: ['Fire', 'Poison'] },
    Psychic: { strong: ['Poison', 'Physical'], weak: ['Dark', 'Arcane'] },
};

/**
 * Get type effectiveness multiplier for attacker type vs defender type.
 * @returns 2.0 for super effective, 0.5 for not very effective, 1.0 for neutral
 */
export function getTypeEffectiveness(attackerType: ElementalType, defenderType: ElementalType): number {
    const typeData = TYPE_CHART[attackerType];
    if (typeData.strong.includes(defenderType)) return 2.0;
    if (typeData.weak.includes(defenderType)) return 0.5;
    return 1.0;
}

// =====================
// STATUS EFFECT DAMAGE (Phase 5)
// =====================

/** DoT damage as percentage of max HP per turn */
export const STATUS_DOT_PERCENT: Record<string, { minor: number; moderate: number; severe: number }> = {
    burn: { minor: 0.04, moderate: 0.06, severe: 0.08 },
    poison: { minor: 0.03, moderate: 0.05, severe: 0.08 }, // Per stack
    bleed: { minor: 0.04, moderate: 0.06, severe: 0.10 },
    curse: { minor: 0.02, moderate: 0.04, severe: 0.06 },
};

/** Paralysis skip chance (25% chance to lose turn) */
export const PARALYZE_SKIP_CHANCE = 0.25;

/** Confusion self-hit chance (33% chance to hit self) */
export const CONFUSION_SELF_HIT_CHANCE = 0.33;

/** Burn physical damage reduction (25% less physical damage dealt) */
export const BURN_DAMAGE_REDUCTION = 0.25;

/** Character inherent type resistance (10% damage reduction vs own type) */
export const INHERENT_TYPE_RESISTANCE = 0.10;

// =====================
// RESOURCE REGENERATION (Phase 5)
// =====================

/** HP/Mana restored per task completion (7% of max) */
export const TASK_REGEN_PERCENT = 0.07;
