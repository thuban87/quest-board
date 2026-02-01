/**
 * Monster Skill Definitions
 * 
 * All monster skills organized by affinity pool.
 * Skills are assigned to monsters at creation time via MonsterService.
 * 
 * Design: Pokemon Gen 1 style - simple, focused, one job per skill (mostly).
 * 
 * @see docs/development/Monster Skills Planning.md for design rationale
 */

import { MonsterSkill, ElementalType } from '../models/Skill';
import { MonsterTier } from '../config/combatConfig';

// =====================
// GENERAL PHYSICAL SKILLS (19 Total)
// Shared by all monsters with "none" affinity
// =====================

export const GENERAL_PHYSICAL_SKILLS: Record<string, MonsterSkill> = {
    // Basic Attacks (5)
    gen_bite: {
        id: 'gen_bite',
        name: 'Bite',
        icon: '🦷',
        elementalType: 'Physical',
        power: 130, // 1.3x ATK
        damageType: 'physical',
        weight: 100,
        category: 'damage',
    },
    gen_claw: {
        id: 'gen_claw',
        name: 'Claw',
        icon: '🐾',
        elementalType: 'Physical',
        power: 140, // 1.4x ATK
        damageType: 'physical',
        weight: 100,
        category: 'damage',
    },
    gen_slam: {
        id: 'gen_slam',
        name: 'Slam',
        icon: '💥',
        elementalType: 'Physical',
        power: 150, // 1.5x ATK
        damageType: 'physical',
        weight: 90,
        category: 'damage',
    },
    gen_strike: {
        id: 'gen_strike',
        name: 'Strike',
        icon: '👊',
        elementalType: 'Physical',
        power: 120, // 1.2x ATK
        damageType: 'physical',
        weight: 100,
        category: 'damage',
    },
    gen_charge: {
        id: 'gen_charge',
        name: 'Charge',
        icon: '🐂',
        elementalType: 'Physical',
        power: 180, // 1.8x ATK
        damageType: 'physical',
        weight: 70,
        category: 'damage',
    },

    // Debuff Skills (4)
    gen_weaken: {
        id: 'gen_weaken',
        name: 'Intimidate',
        icon: '😤',
        elementalType: 'Physical',
        power: 0,
        damageType: 'physical',
        weight: 50,
        category: 'debuff',
        stageEffect: { stat: 'atk', stages: -1, target: 'enemy' },
    },
    gen_armor_break: {
        id: 'gen_armor_break',
        name: 'Armor Break',
        icon: '🔨',
        elementalType: 'Physical',
        power: 0,
        damageType: 'physical',
        weight: 50,
        category: 'debuff',
        stageEffect: { stat: 'def', stages: -1, target: 'enemy' },
    },
    gen_slow: {
        id: 'gen_slow',
        name: 'Hamstring',
        icon: '🦵',
        elementalType: 'Physical',
        power: 0,
        damageType: 'physical',
        weight: 40,
        category: 'debuff',
        stageEffect: { stat: 'speed', stages: -1, target: 'enemy' },
    },
    gen_snarl: {
        id: 'gen_snarl',
        name: 'Snarl',
        icon: '😠',
        elementalType: 'Physical',
        power: 0,
        damageType: 'physical',
        weight: 50,
        category: 'debuff',
        stageEffect: { stat: 'atk', stages: -1, target: 'enemy' },
    },

    // Buff Skills (3)
    gen_enrage: {
        id: 'gen_enrage',
        name: 'Enrage',
        icon: '😡',
        elementalType: 'Physical',
        power: 0,
        damageType: 'physical',
        weight: 40,
        category: 'buff',
        stageEffect: { stat: 'atk', stages: 1, target: 'self' },
    },
    gen_harden: {
        id: 'gen_harden',
        name: 'Harden',
        icon: '🛡️',
        elementalType: 'Physical',
        power: 0,
        damageType: 'physical',
        weight: 40,
        category: 'buff',
        stageEffect: { stat: 'def', stages: 1, target: 'self' },
    },
    gen_focus: {
        id: 'gen_focus',
        name: 'Focus',
        icon: '🎯',
        elementalType: 'Physical',
        power: 0,
        damageType: 'physical',
        weight: 35,
        category: 'buff',
        stageEffect: { stat: 'atk', stages: 1, target: 'self' },
    },

    // Status/Hybrid Attacks (7)
    gen_rend: {
        id: 'gen_rend',
        name: 'Rend',
        icon: '🩸',
        elementalType: 'Physical',
        power: 140, // 1.4x ATK
        damageType: 'physical',
        weight: 70,
        category: 'hybrid',
        statusEffect: { type: 'bleed', chance: 40, duration: 3, severity: 'minor' },
    },
    gen_bash: {
        id: 'gen_bash',
        name: 'Bash',
        icon: '🏏',
        elementalType: 'Physical',
        power: 160, // 1.6x ATK
        damageType: 'physical',
        weight: 65,
        category: 'hybrid',
        statusEffect: { type: 'stun', chance: 30, duration: 1 },
    },
    gen_maul: {
        id: 'gen_maul',
        name: 'Maul',
        icon: '🐻',
        elementalType: 'Physical',
        power: 200, // 2.0x ATK
        damageType: 'physical',
        weight: 60,
        category: 'hybrid',
        statusEffect: { type: 'stun', chance: 25, duration: 1 },
    },
    gen_poison_fang: {
        id: 'gen_poison_fang',
        name: 'Poison Fang',
        icon: '🐍',
        elementalType: 'Poison',
        power: 120, // 1.2x ATK
        damageType: 'physical',
        weight: 60,
        category: 'hybrid',
        statusEffect: { type: 'poison', chance: 50, duration: 4, severity: 'minor' },
    },
    gen_crushing_blow: {
        id: 'gen_crushing_blow',
        name: 'Crushing Blow',
        icon: '⚒️',
        elementalType: 'Physical',
        power: 180, // 1.8x ATK
        damageType: 'physical',
        weight: 55,
        category: 'hybrid',
        stageEffect: { stat: 'def', stages: -1, target: 'enemy' },
    },
    gen_frenzy: {
        id: 'gen_frenzy',
        name: 'Frenzy',
        icon: '🔥',
        elementalType: 'Physical',
        power: 150, // 1.5x ATK
        damageType: 'physical',
        weight: 80,
        category: 'hybrid',
        useCondition: 'low_hp',
        stageEffect: { stat: 'atk', stages: 1, target: 'self' },
    },
    gen_howl: {
        id: 'gen_howl',
        name: 'Howl',
        icon: '🐺',
        elementalType: 'Physical',
        power: 0,
        damageType: 'physical',
        weight: 45,
        category: 'utility',
        selfCure: true, // Removes all debuffs from self
    },
};

// =====================
// DARK SKILLS (6 Total)
// For Undead and Night Elves
// =====================

export const DARK_SKILLS: Record<string, MonsterSkill> = {
    dark_shadow_strike: {
        id: 'dark_shadow_strike',
        name: 'Shadow Strike',
        icon: '🗡️',
        elementalType: 'Dark',
        power: 160, // 1.6x ATK
        damageType: 'magic',
        weight: 90,
        category: 'damage',
    },
    dark_life_drain: {
        id: 'dark_life_drain',
        name: 'Life Drain',
        icon: '💀',
        elementalType: 'Dark',
        power: 140, // 1.4x ATK
        damageType: 'magic',
        weight: 70,
        category: 'hybrid',
        lifesteal: 0.30, // Heal for 30% of damage dealt
    },
    dark_curse: {
        id: 'dark_curse',
        name: 'Curse',
        icon: '☠️',
        elementalType: 'Dark',
        power: 0,
        damageType: 'magic',
        weight: 50,
        category: 'status',
        statusEffect: { type: 'curse', chance: 100, duration: 4, severity: 'moderate' },
    },
    dark_fear: {
        id: 'dark_fear',
        name: 'Fear',
        icon: '👻',
        elementalType: 'Dark',
        power: 0,
        damageType: 'magic',
        weight: 45,
        category: 'debuff',
        stageEffect: { stat: 'atk', stages: -2, target: 'enemy' },
    },
    dark_necrotic_touch: {
        id: 'dark_necrotic_touch',
        name: 'Necrotic Touch',
        icon: '🖐️',
        elementalType: 'Dark',
        power: 130, // 1.3x ATK
        damageType: 'magic',
        weight: 65,
        category: 'hybrid',
        statusEffect: { type: 'curse', chance: 40, duration: 3, severity: 'minor' },
    },
    dark_shadow_bolt: {
        id: 'dark_shadow_bolt',
        name: 'Shadow Bolt',
        icon: '⚫',
        elementalType: 'Dark',
        power: 200, // 2.0x ATK
        damageType: 'magic',
        weight: 75,
        category: 'damage',
    },
};

// =====================
// EARTH SKILLS (5 Total)
// For Dwarves
// =====================

export const EARTH_SKILLS: Record<string, MonsterSkill> = {
    earth_stone_throw: {
        id: 'earth_stone_throw',
        name: 'Stone Throw',
        icon: '🪨',
        elementalType: 'Earth',
        power: 150, // 1.5x ATK
        damageType: 'physical',
        weight: 85,
        category: 'damage',
    },
    earth_quake: {
        id: 'earth_quake',
        name: 'Tremor',
        icon: '🌍',
        elementalType: 'Earth',
        power: 130, // 1.3x ATK
        damageType: 'physical',
        weight: 60,
        category: 'hybrid',
        stageEffect: { stat: 'speed', stages: -1, target: 'enemy' },
    },
    earth_rock_shield: {
        id: 'earth_rock_shield',
        name: 'Rock Shield',
        icon: '🏔️',
        elementalType: 'Earth',
        power: 0,
        damageType: 'physical',
        weight: 50,
        category: 'buff',
        stageEffect: { stat: 'def', stages: 2, target: 'self' },
    },
    earth_boulder_slam: {
        id: 'earth_boulder_slam',
        name: 'Boulder Slam',
        icon: '🪨',
        elementalType: 'Earth',
        power: 220, // 2.2x ATK
        damageType: 'physical',
        weight: 70,
        category: 'damage',
    },
    earth_seismic_strike: {
        id: 'earth_seismic_strike',
        name: 'Seismic Strike',
        icon: '💢',
        elementalType: 'Earth',
        power: 180, // 1.8x ATK
        damageType: 'physical',
        weight: 65,
        category: 'hybrid',
        statusEffect: { type: 'stun', chance: 30, duration: 1 },
    },
};

// =====================
// FIRE SKILLS (5 Total)
// For Dragonkin
// =====================

export const FIRE_SKILLS: Record<string, MonsterSkill> = {
    fire_flame_burst: {
        id: 'fire_flame_burst',
        name: 'Flame Burst',
        icon: '🔥',
        elementalType: 'Fire',
        power: 160, // 1.6x ATK
        damageType: 'magic',
        weight: 90,
        category: 'damage',
    },
    fire_breath: {
        id: 'fire_breath',
        name: 'Fire Breath',
        icon: '🐉',
        elementalType: 'Fire',
        power: 180, // 1.8x ATK
        damageType: 'magic',
        weight: 80,
        category: 'hybrid',
        statusEffect: { type: 'burn', chance: 40, duration: 3, severity: 'minor' },
    },
    fire_inferno: {
        id: 'fire_inferno',
        name: 'Inferno',
        icon: '🌋',
        elementalType: 'Fire',
        power: 200, // 2.0x ATK
        damageType: 'magic',
        weight: 70,
        category: 'hybrid',
        statusEffect: { type: 'burn', chance: 50, duration: 4, severity: 'moderate' },
    },
    fire_heat_wave: {
        id: 'fire_heat_wave',
        name: 'Heat Wave',
        icon: '🥵',
        elementalType: 'Fire',
        power: 0,
        damageType: 'magic',
        weight: 50,
        category: 'debuff',
        stageEffect: { stat: 'def', stages: -1, target: 'enemy' },
    },
    fire_burning_claw: {
        id: 'fire_burning_claw',
        name: 'Burning Claw',
        icon: '🐲',
        elementalType: 'Fire',
        power: 140, // 1.4x ATK
        damageType: 'physical',
        weight: 75,
        category: 'hybrid',
        statusEffect: { type: 'burn', chance: 35, duration: 3, severity: 'minor' },
    },
};

// =====================
// ARCANE SKILLS (6 Total)
// For Aberrations
// =====================

export const ARCANE_SKILLS: Record<string, MonsterSkill> = {
    arcane_blast: {
        id: 'arcane_blast',
        name: 'Arcane Blast',
        icon: '✨',
        elementalType: 'Arcane',
        power: 170, // 1.7x ATK
        damageType: 'magic',
        weight: 85,
        category: 'damage',
    },
    arcane_mana_burn: {
        // NOTE: Mana drain effect not implemented - monsters don't have mana
        // Kept as a flavor skill with just damage
        id: 'arcane_mana_burn',
        name: 'Mana Burn',
        icon: '💠',
        elementalType: 'Arcane',
        power: 120, // 1.2x ATK
        damageType: 'magic',
        weight: 70,
        category: 'damage',
    },
    arcane_mind_spike: {
        id: 'arcane_mind_spike',
        name: 'Mind Spike',
        icon: '🧠',
        elementalType: 'Arcane',
        power: 150, // 1.5x ATK
        damageType: 'magic',
        weight: 75,
        category: 'hybrid',
        statusEffect: { type: 'confusion', chance: 40, duration: 2 },
    },
    arcane_dispel: {
        id: 'arcane_dispel',
        name: 'Dispel',
        icon: '🌀',
        elementalType: 'Arcane',
        power: 0,
        damageType: 'magic',
        weight: 60,
        category: 'utility',
        selfCure: true, // Removes all debuffs from self
    },
    arcane_reality_warp: {
        id: 'arcane_reality_warp',
        name: 'Reality Warp',
        icon: '🌌',
        elementalType: 'Arcane',
        power: 190, // 1.9x ATK
        damageType: 'magic',
        weight: 65,
        category: 'hybrid',
        statusEffect: { type: 'confusion', chance: 30, duration: 2 },
    },
    arcane_nullify: {
        id: 'arcane_nullify',
        name: 'Nullify',
        icon: '⭕',
        elementalType: 'Arcane',
        power: 0,
        damageType: 'magic',
        weight: 55,
        category: 'utility',
        selfCure: true, // Removes all debuffs from self
    },
};

// =====================
// BOSS SIGNATURE SKILLS (20 Total)
// Unique skills for boss monsters
// =====================

export const BOSS_SIGNATURE_SKILLS: Record<string, MonsterSkill> = {
    // === BEASTS ===
    boss_alpha_howl: {
        id: 'boss_alpha_howl',
        name: 'Alpha Howl',
        icon: '🐺',
        elementalType: 'Physical',
        power: 0,
        damageType: 'physical',
        weight: 60,
        category: 'buff',
        stageEffect: { stat: 'atk', stages: 2, target: 'self' },
    },
    boss_hibernate: {
        id: 'boss_hibernate',
        name: 'Hibernate',
        icon: '😴',
        elementalType: 'Physical',
        power: 0,
        damageType: 'physical',
        weight: 40,
        category: 'utility',
        useCondition: 'low_hp',
        selfCure: true,
        healPercent: 0.20, // 20% HP heal (nerfed from 40%)
    },
    boss_swarm: {
        id: 'boss_swarm',
        name: 'Swarm',
        icon: '🐀',
        elementalType: 'Physical',
        power: 250, // Total 2.5x, split into 5 hits of 0.5x
        damageType: 'physical',
        weight: 80,
        category: 'damage',
        multiHit: 5,
    },

    // === UNDEAD ===
    boss_reaper_strike: {
        id: 'boss_reaper_strike',
        name: 'Reaper Strike',
        icon: '💀',
        elementalType: 'Dark',
        power: 250, // 2.5x damage
        damageType: 'magic',
        weight: 85,
        category: 'hybrid',
        stageEffect: { stat: 'def', stages: -3, target: 'enemy' }, // Simplified defense ignore
    },
    boss_death_grasp: {
        id: 'boss_death_grasp',
        name: 'Death Grasp',
        icon: '☠️',
        elementalType: 'Dark',
        power: 300, // 3.0x damage
        damageType: 'magic',
        weight: 75,
        category: 'hybrid',
        statusEffect: { type: 'curse', chance: 100, duration: 4, severity: 'moderate' },
    },
    boss_spectral_slash: {
        id: 'boss_spectral_slash',
        name: 'Spectral Slash',
        icon: '👻',
        elementalType: 'Physical',
        power: 220, // 2.2x damage
        damageType: 'physical',
        weight: 90,
        category: 'hybrid',
        stageEffect: { stat: 'def', stages: -3, target: 'enemy' }, // Simplified defense ignore
    },

    // === GOBLINS ===
    boss_war_cry: {
        id: 'boss_war_cry',
        name: 'War Cry',
        icon: '⚔️',
        elementalType: 'Physical',
        power: 0,
        damageType: 'physical',
        weight: 65,
        category: 'hybrid',
        stageEffect: { stat: 'atk', stages: 2, target: 'self' },
        statusEffect: { type: 'stun', chance: 40, duration: 1 },
    },
    boss_earthquake_slam: {
        id: 'boss_earthquake_slam',
        name: 'Earthquake Slam',
        icon: '💥',
        elementalType: 'Physical',
        power: 280, // 2.8x damage
        damageType: 'physical',
        weight: 70,
        category: 'hybrid',
        stageEffect: { stat: 'speed', stages: -2, target: 'enemy' },
    },

    // === TROLLS ===
    boss_regenerate: {
        id: 'boss_regenerate',
        name: 'Regenerate',
        icon: '💚',
        elementalType: 'Earth',
        power: 0,
        damageType: 'physical',
        weight: 50,
        category: 'utility',
        useCondition: 'low_hp',
        healPercent: 0.15, // 15% HP heal (nerfed from 35%, active not passive)
    },
    boss_toxic_cloud: {
        id: 'boss_toxic_cloud',
        name: 'Toxic Cloud',
        icon: '☠',
        elementalType: 'Poison',
        power: 0,
        damageType: 'magic',
        weight: 60,
        category: 'status',
        statusEffect: { type: 'poison', chance: 100, duration: 3, severity: 'moderate' },
    },

    // === NIGHT ELVES ===
    boss_vanish_strike: {
        id: 'boss_vanish_strike',
        name: 'Vanish Strike',
        icon: '🌑',
        elementalType: 'Dark',
        power: 320, // 3.2x damage (no priority, just high damage)
        damageType: 'magic',
        weight: 75,
        category: 'damage',
    },
    boss_void_rift: {
        id: 'boss_void_rift',
        name: 'Void Rift',
        icon: '🌌',
        elementalType: 'Dark',
        power: 280, // 2.8x damage
        damageType: 'magic',
        weight: 80,
        category: 'hybrid',
        statusEffect: { type: 'confusion', chance: 60, duration: 3 },
    },

    // === DWARVES ===
    boss_hammer_fall: {
        id: 'boss_hammer_fall',
        name: 'Hammer Fall',
        icon: '⚒️',
        elementalType: 'Earth',
        power: 260, // 2.6x damage
        damageType: 'physical',
        weight: 85,
        category: 'hybrid',
        stageEffect: { stat: 'def', stages: -2, target: 'enemy' },
    },
    boss_rune_rage: {
        id: 'boss_rune_rage',
        name: 'Rune Rage',
        icon: '⚡',
        elementalType: 'Earth',
        power: 350, // 3.5x damage
        damageType: 'physical',
        weight: 70,
        category: 'hybrid',
        stageEffect: { stat: 'atk', stages: 2, target: 'self' },
    },

    // === DRAGONKIN ===
    boss_dragon_roar: {
        id: 'boss_dragon_roar',
        name: 'Dragon Roar',
        icon: '🐲',
        elementalType: 'Fire',
        power: 240, // 2.4x damage
        damageType: 'magic',
        weight: 75,
        category: 'hybrid',
        stageEffect: { stat: 'atk', stages: -2, target: 'enemy' },
    },
    boss_tail_whip: {
        id: 'boss_tail_whip',
        name: 'Tail Whip',
        icon: '🦎',
        elementalType: 'Poison',
        power: 200, // 2.0x damage
        damageType: 'physical',
        weight: 80,
        category: 'hybrid',
        statusEffect: { type: 'poison', chance: 100, duration: 4, severity: 'moderate' },
        stageEffect: { stat: 'speed', stages: -1, target: 'enemy' },
    },
    boss_apocalypse_flame: {
        id: 'boss_apocalypse_flame',
        name: 'Apocalypse Flame',
        icon: '🔥',
        elementalType: 'Fire',
        power: 400, // 4.0x damage
        damageType: 'magic',
        weight: 65,
        category: 'hybrid',
        statusEffect: { type: 'burn', chance: 90, duration: 4, severity: 'moderate' },
    },

    // === ABERRATIONS ===
    boss_consume: {
        id: 'boss_consume',
        name: 'Consume',
        icon: '🦷',
        elementalType: 'Physical',
        power: 280, // 2.8x damage
        damageType: 'physical',
        weight: 70,
        category: 'hybrid',
        lifesteal: 0.50, // 50% lifesteal
    },
    boss_disintegration_ray: {
        id: 'boss_disintegration_ray',
        name: 'Disintegration Ray',
        icon: '👁️',
        elementalType: 'Arcane',
        power: 380, // 3.8x damage (no special ignore, just high power)
        damageType: 'magic',
        weight: 75,
        category: 'damage',
    },
    boss_void_grasp: {
        id: 'boss_void_grasp',
        name: 'Void Grasp',
        icon: '🦑',
        elementalType: 'Arcane',
        power: 250, // 2.5x damage
        damageType: 'magic',
        weight: 80,
        category: 'hybrid',
        statusEffect: { type: 'curse', chance: 100, duration: 4, severity: 'moderate' },
        stageEffect: { stat: 'speed', stages: -2, target: 'enemy' },
    },
};

// =====================
// UNIFIED SKILL LOOKUP
// =====================

export const ALL_MONSTER_SKILLS: Record<string, MonsterSkill> = {
    ...GENERAL_PHYSICAL_SKILLS,
    ...DARK_SKILLS,
    ...EARTH_SKILLS,
    ...FIRE_SKILLS,
    ...ARCANE_SKILLS,
    ...BOSS_SIGNATURE_SKILLS,
};

// =====================
// SKILL SELECTION HELPERS
// =====================

/**
 * Get MonsterSkill objects from a pool of skill IDs.
 * Filters out any invalid IDs.
 */
export function getMonsterSkillsFromPool(skillIds: string[]): MonsterSkill[] {
    return skillIds
        .map(id => ALL_MONSTER_SKILLS[id])
        .filter((skill): skill is MonsterSkill => skill !== undefined);
}

/**
 * Select skills for a monster based on tier.
 * - Normal (overworld/dungeon): 2 skills - highest weight + 1 random
 * - Elite: 3 skills - top 2 weight + 1 random
 * - Boss/Raid: 4 skills - all from pool (or all if pool < 4)
 */
export function selectSkillsForTier(skillPoolIds: string[], tier: MonsterTier): MonsterSkill[] {
    const pool = getMonsterSkillsFromPool(skillPoolIds);

    if (pool.length === 0) {
        return [];
    }

    // Sort by weight descending
    const sorted = [...pool].sort((a, b) => b.weight - a.weight);

    let count: number;
    switch (tier) {
        case 'boss':
        case 'raid_boss':
            count = 4;
            break;
        case 'elite':
            count = 3;
            break;
        default: // overworld, dungeon
            count = 2;
    }

    // If pool is smaller than desired count, use all
    if (pool.length <= count) {
        return pool;
    }

    // Always include highest weight skill(s) based on count
    const guaranteed = sorted.slice(0, Math.min(count - 1, sorted.length));
    const remaining = sorted.slice(guaranteed.length);

    // Fill remaining slots with random selection
    const result = [...guaranteed];
    while (result.length < count && remaining.length > 0) {
        const randomIndex = Math.floor(Math.random() * remaining.length);
        result.push(remaining.splice(randomIndex, 1)[0]);
    }

    return result;
}

/**
 * Select a skill for a monster to use this turn.
 * Uses weighted random with condition modifiers.
 * 
 * @param monster - The monster (for HP check)
 * @param skills - Available skills
 * @param usedThisBattle - Skills already used (for once-per-battle, future feature)
 */
export function selectMonsterSkillAI(
    monsterCurrentHP: number,
    monsterMaxHP: number,
    skills: MonsterSkill[],
    usedThisBattle: string[] = []
): MonsterSkill | null {
    if (skills.length === 0) {
        return null;
    }

    // Filter out any once-per-battle skills that were used (future feature)
    const available = skills.filter(s => !usedThisBattle.includes(s.id));
    if (available.length === 0) {
        return null;
    }

    // Check if monster is low HP (< 30%)
    const isLowHP = monsterCurrentHP / monsterMaxHP < 0.30;

    // Calculate adjusted weights
    const weightedPool: { skill: MonsterSkill; adjustedWeight: number }[] = available.map(skill => {
        let weight = skill.weight;

        // Boost low_hp skills when HP is low
        if (skill.useCondition === 'low_hp' && isLowHP) {
            weight *= 3;
        }

        return { skill, adjustedWeight: weight };
    });

    // Weighted random selection
    const totalWeight = weightedPool.reduce((sum, item) => sum + item.adjustedWeight, 0);
    let roll = Math.random() * totalWeight;

    for (const { skill, adjustedWeight } of weightedPool) {
        roll -= adjustedWeight;
        if (roll <= 0) {
            return skill;
        }
    }

    // Fallback to first skill
    return available[0];
}

// =====================
// TIER DAMAGE SCALING (COMMENTED OUT)
// =====================

/**
 * DEFERRED: Additional tier-based skill damage scaling.
 *
 * Not implemented in V1 because:
 * - MONSTER_TIER_CONFIG already applies attackMultiplier to monster stats
 * - Adding skill-specific bonus may over-tune elite/boss difficulty
 * - Revisit after deployment with real gameplay data
 *
 * Uncomment and apply in BattleService.executeMonsterSkill() if needed.
 */
// export const TIER_SKILL_DAMAGE_BONUS: Record<MonsterTier, number> = {
//     overworld: 1.0,    // No bonus
//     dungeon: 1.0,      // No bonus
//     elite: 1.10,       // +10% skill damage
//     boss: 1.15,        // +15% skill damage
//     raid_boss: 1.20,   // +20% skill damage
// };
//
// export function getTierSkillDamageMultiplier(tier: MonsterTier): number {
//     return TIER_SKILL_DAMAGE_BONUS[tier];
// }
