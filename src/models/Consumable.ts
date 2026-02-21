/**
 * Consumable Item Model
 *
 * Items that can be used from inventory for various effects.
 * Tiered potions restore HP/Mana based on character level range.
 * New consumable types include stat elixirs, cleansing items,
 * enchantment oils, tactical items, and the Phoenix Tear.
 */

import type { StatType } from './Character';
import type { StatusEffectType } from './StatusEffect';

/**
 * Consumable rarity levels (matches gear tiers for consistency)
 */
export enum ConsumableRarity {
    COMMON = 'common',
    ADEPT = 'adept',
    MASTER = 'master',
    EPIC = 'epic',
}

/**
 * Consumable effect types
 */
export enum ConsumableEffect {
    // Existing
    HP_RESTORE = 'hp_restore',
    MANA_RESTORE = 'mana_restore',
    REVIVE = 'revive',
    STREAK_RESTORE = 'streak',
    XP_BOOST = 'xp_boost',

    // New - Phase 2
    CLEANSE_DOT = 'cleanse_dot',
    CLEANSE_CURSE_CC = 'cleanse_curse_cc',
    DIRECT_DAMAGE = 'direct_damage',
    GUARANTEED_RETREAT = 'guaranteed_retreat',
    DEF_STAGE_BOOST = 'def_stage_boost',

    // New - Phase 3
    STAT_BOOST = 'stat_boost',
    PHOENIX_REVIVE = 'phoenix_revive',
    ENCHANT_BURN = 'enchant_burn',
    ENCHANT_POISON = 'enchant_poison',
    ENCHANT_FREEZE = 'enchant_freeze',
}

/**
 * Consumable item definition
 */
export interface ConsumableDefinition {
    id: string;
    name: string;
    description: string;
    effect: ConsumableEffect;
    rarity: ConsumableRarity;
    /** Effect value: HP/MP restored, or multiplier for boosts */
    effectValue: number;
    emoji: string;
    /** Optimal level range for this consumable [min, max] */
    levelRange: [number, number];

    // New optional fields

    /** Duration in battle turns (for enchantments, wards) */
    turnDuration?: number;
    /** Duration in minutes (for stat elixirs) */
    realTimeDurationMinutes?: number;
    /** Target stat for stat elixirs */
    statTarget?: StatType;
    /** Status effect type inflicted by enchantment oils */
    statusType?: StatusEffectType;
    /** Proc chance for enchantment oils (0-100) */
    statusChance?: number;
    /** Stat stage change (for Ironbark Ward) */
    stageChange?: { stat: 'atk' | 'def' | 'speed'; stages: number };
    /** Damage formula for direct damage items: base + perLevel * level */
    damageFormula?: { base: number; perLevel: number };
    /** Minimum level to purchase/use */
    minLevel?: number;
    /** Whether this item is usable in combat */
    combatUsable?: boolean;
}

/**
 * Consumable item in inventory
 */
export interface InventoryItem {
    itemId: string;
    quantity: number;
    acquiredDate: string;
}

/**
 * All available consumables
 *
 * HP/Mana potions use 6 tiers (every ~8 levels) with flat healing values
 * calibrated to restore ~50-55% of median HP at introduction level,
 * decaying to ~25-40% by the next tier.
 */
export const CONSUMABLES: Record<string, ConsumableDefinition> = {
    // === HP POTIONS (6 tiers) ===
    'hp-potion-minor': {
        id: 'hp-potion-minor',
        name: 'Minor Health Potion',
        description: 'Restores 130 HP. A simple but effective remedy.',
        effect: ConsumableEffect.HP_RESTORE,
        rarity: ConsumableRarity.COMMON,
        effectValue: 130,
        emoji: '🧪',
        levelRange: [1, 7],
        combatUsable: true,
    },
    'hp-potion-lesser': {
        id: 'hp-potion-lesser',
        name: 'Lesser Health Potion',
        description: 'Restores 265 HP. Brewed for seasoned adventurers.',
        effect: ConsumableEffect.HP_RESTORE,
        rarity: ConsumableRarity.ADEPT,
        effectValue: 265,
        emoji: '🧪',
        levelRange: [8, 15],
        minLevel: 8,
        combatUsable: true,
    },
    'hp-potion-major': {
        id: 'hp-potion-major',
        name: 'Major Health Potion',
        description: 'Restores 450 HP. A potent healing draught.',
        effect: ConsumableEffect.HP_RESTORE,
        rarity: ConsumableRarity.ADEPT,
        effectValue: 450,
        emoji: '❤️‍🔥',
        levelRange: [16, 23],
        minLevel: 16,
        combatUsable: true,
    },
    'hp-potion-greater': {
        id: 'hp-potion-greater',
        name: 'Greater Health Potion',
        description: 'Restores 660 HP. Master-crafted restorative.',
        effect: ConsumableEffect.HP_RESTORE,
        rarity: ConsumableRarity.MASTER,
        effectValue: 660,
        emoji: '❤️‍🔥',
        levelRange: [24, 31],
        minLevel: 24,
        combatUsable: true,
    },
    'hp-potion-superior': {
        id: 'hp-potion-superior',
        name: 'Superior Health Potion',
        description: 'Restores 880 HP. An exceptional elixir.',
        effect: ConsumableEffect.HP_RESTORE,
        rarity: ConsumableRarity.EPIC,
        effectValue: 880,
        emoji: '💖',
        levelRange: [32, 39],
        minLevel: 32,
        combatUsable: true,
    },
    'hp-potion-supreme': {
        id: 'hp-potion-supreme',
        name: 'Supreme Health Potion',
        description: 'Restores 1200 HP. The pinnacle of healing arts.',
        effect: ConsumableEffect.HP_RESTORE,
        rarity: ConsumableRarity.EPIC,
        effectValue: 1200,
        emoji: '💖',
        levelRange: [40, 40],
        minLevel: 40,
        combatUsable: true,
    },

    // === MANA POTIONS (6 tiers) ===
    'mp-potion-minor': {
        id: 'mp-potion-minor',
        name: 'Minor Mana Potion',
        description: 'Restores 35 MP. A small arcane refreshment.',
        effect: ConsumableEffect.MANA_RESTORE,
        rarity: ConsumableRarity.COMMON,
        effectValue: 35,
        emoji: '🔮',
        levelRange: [1, 7],
        combatUsable: true,
    },
    'mp-potion-lesser': {
        id: 'mp-potion-lesser',
        name: 'Lesser Mana Potion',
        description: 'Restores 60 MP. Brewed for practiced spellcasters.',
        effect: ConsumableEffect.MANA_RESTORE,
        rarity: ConsumableRarity.ADEPT,
        effectValue: 60,
        emoji: '🔮',
        levelRange: [8, 15],
        minLevel: 8,
        combatUsable: true,
    },
    'mp-potion-major': {
        id: 'mp-potion-major',
        name: 'Major Mana Potion',
        description: 'Restores 100 MP. A rich mana infusion.',
        effect: ConsumableEffect.MANA_RESTORE,
        rarity: ConsumableRarity.ADEPT,
        effectValue: 100,
        emoji: '💎',
        levelRange: [16, 23],
        minLevel: 16,
        combatUsable: true,
    },
    'mp-potion-greater': {
        id: 'mp-potion-greater',
        name: 'Greater Mana Potion',
        description: 'Restores 150 MP. Distilled from rare reagents.',
        effect: ConsumableEffect.MANA_RESTORE,
        rarity: ConsumableRarity.MASTER,
        effectValue: 150,
        emoji: '💎',
        levelRange: [24, 31],
        minLevel: 24,
        combatUsable: true,
    },
    'mp-potion-superior': {
        id: 'mp-potion-superior',
        name: 'Superior Mana Potion',
        description: 'Restores 200 MP. An arcane masterwork.',
        effect: ConsumableEffect.MANA_RESTORE,
        rarity: ConsumableRarity.EPIC,
        effectValue: 200,
        emoji: '✨',
        levelRange: [32, 39],
        minLevel: 32,
        combatUsable: true,
    },
    'mp-potion-supreme': {
        id: 'mp-potion-supreme',
        name: 'Supreme Mana Potion',
        description: 'Restores 270 MP. Pure crystallized mana.',
        effect: ConsumableEffect.MANA_RESTORE,
        rarity: ConsumableRarity.EPIC,
        effectValue: 270,
        emoji: '✨',
        levelRange: [40, 40],
        minLevel: 40,
        combatUsable: true,
    },

    // === STAT ELIXIRS (6 items, L10+) ===
    'elixir-bull': {
        id: 'elixir-bull',
        name: 'Elixir of the Bull',
        description: 'Boosts Strength by 10% for 1 hour.',
        effect: ConsumableEffect.STAT_BOOST,
        rarity: ConsumableRarity.MASTER,
        effectValue: 0.10,
        emoji: '🐂',
        levelRange: [10, 40],
        minLevel: 10,
        realTimeDurationMinutes: 60,
        statTarget: 'strength',
        combatUsable: false,
    },
    'elixir-fox': {
        id: 'elixir-fox',
        name: 'Elixir of the Fox',
        description: 'Boosts Dexterity by 10% for 1 hour.',
        effect: ConsumableEffect.STAT_BOOST,
        rarity: ConsumableRarity.MASTER,
        effectValue: 0.10,
        emoji: '🦊',
        levelRange: [10, 40],
        minLevel: 10,
        realTimeDurationMinutes: 60,
        statTarget: 'dexterity',
        combatUsable: false,
    },
    'elixir-bear': {
        id: 'elixir-bear',
        name: 'Elixir of the Bear',
        description: 'Boosts Constitution by 10% for 1 hour.',
        effect: ConsumableEffect.STAT_BOOST,
        rarity: ConsumableRarity.MASTER,
        effectValue: 0.10,
        emoji: '🐻',
        levelRange: [10, 40],
        minLevel: 10,
        realTimeDurationMinutes: 60,
        statTarget: 'constitution',
        combatUsable: false,
    },
    'elixir-owl': {
        id: 'elixir-owl',
        name: 'Elixir of the Owl',
        description: 'Boosts Intelligence by 10% for 1 hour.',
        effect: ConsumableEffect.STAT_BOOST,
        rarity: ConsumableRarity.MASTER,
        effectValue: 0.10,
        emoji: '🦉',
        levelRange: [10, 40],
        minLevel: 10,
        realTimeDurationMinutes: 60,
        statTarget: 'intelligence',
        combatUsable: false,
    },
    'elixir-sage': {
        id: 'elixir-sage',
        name: 'Elixir of the Sage',
        description: 'Boosts Wisdom by 10% for 1 hour.',
        effect: ConsumableEffect.STAT_BOOST,
        rarity: ConsumableRarity.MASTER,
        effectValue: 0.10,
        emoji: '🧙',
        levelRange: [10, 40],
        minLevel: 10,
        realTimeDurationMinutes: 60,
        statTarget: 'wisdom',
        combatUsable: false,
    },
    'elixir-serpent': {
        id: 'elixir-serpent',
        name: 'Elixir of the Serpent',
        description: 'Boosts Charisma by 10% for 1 hour.',
        effect: ConsumableEffect.STAT_BOOST,
        rarity: ConsumableRarity.MASTER,
        effectValue: 0.10,
        emoji: '🐍',
        levelRange: [10, 40],
        minLevel: 10,
        realTimeDurationMinutes: 60,
        statTarget: 'charisma',
        combatUsable: false,
    },

    // === CLEANSING ITEMS ===
    'purifying-salve': {
        id: 'purifying-salve',
        name: 'Purifying Salve',
        description: 'Remove all burn, poison, and bleed effects.',
        effect: ConsumableEffect.CLEANSE_DOT,
        rarity: ConsumableRarity.ADEPT,
        effectValue: 1,
        emoji: '🩹',
        levelRange: [1, 40],
        combatUsable: true,
    },
    'sacred-water': {
        id: 'sacred-water',
        name: 'Sacred Water',
        description: 'Remove curse and all paralyze, sleep, freeze, stun effects.',
        effect: ConsumableEffect.CLEANSE_CURSE_CC,
        rarity: ConsumableRarity.MASTER,
        effectValue: 1,
        emoji: '💧',
        levelRange: [1, 40],
        combatUsable: true,
    },

    // === ENCHANTMENT OILS (5 turns, L8+) ===
    'oil-immolation': {
        id: 'oil-immolation',
        name: 'Oil of Immolation',
        description: 'Attacks have a 20% chance to inflict Burn for 5 turns.',
        effect: ConsumableEffect.ENCHANT_BURN,
        rarity: ConsumableRarity.MASTER,
        effectValue: 0,
        emoji: '🔥',
        levelRange: [8, 40],
        minLevel: 8,
        turnDuration: 5,
        statusType: 'burn',
        statusChance: 20,
        combatUsable: true,
    },
    'venom-coating': {
        id: 'venom-coating',
        name: 'Venom Coating',
        description: 'Attacks have a 25% chance to inflict Poison for 5 turns.',
        effect: ConsumableEffect.ENCHANT_POISON,
        rarity: ConsumableRarity.MASTER,
        effectValue: 0,
        emoji: '☠️',
        levelRange: [8, 40],
        minLevel: 8,
        turnDuration: 5,
        statusType: 'poison',
        statusChance: 25,
        combatUsable: true,
    },
    'frostbite-tincture': {
        id: 'frostbite-tincture',
        name: 'Frostbite Tincture',
        description: 'Attacks have a 15% chance to inflict Freeze for 5 turns.',
        effect: ConsumableEffect.ENCHANT_FREEZE,
        rarity: ConsumableRarity.MASTER,
        effectValue: 0,
        emoji: '❄️',
        levelRange: [8, 40],
        minLevel: 8,
        turnDuration: 5,
        statusType: 'freeze',
        statusChance: 15,
        combatUsable: true,
    },

    // === TACTICAL CONSUMABLES ===
    'firebomb': {
        id: 'firebomb',
        name: 'Firebomb',
        description: 'Deal fire damage equal to 40 + 8 per level.',
        effect: ConsumableEffect.DIRECT_DAMAGE,
        rarity: ConsumableRarity.ADEPT,
        effectValue: 0,
        emoji: '💣',
        levelRange: [1, 40],
        damageFormula: { base: 40, perLevel: 8 },
        combatUsable: true,
    },
    'smoke-bomb': {
        id: 'smoke-bomb',
        name: 'Smoke Bomb',
        description: 'Guaranteed retreat from any battle.',
        effect: ConsumableEffect.GUARANTEED_RETREAT,
        rarity: ConsumableRarity.ADEPT,
        effectValue: 1,
        emoji: '💨',
        levelRange: [1, 40],
        combatUsable: true,
    },
    'ironbark-ward': {
        id: 'ironbark-ward',
        name: 'Ironbark Ward',
        description: '+2 DEF stages for 4 turns.',
        effect: ConsumableEffect.DEF_STAGE_BOOST,
        rarity: ConsumableRarity.MASTER,
        effectValue: 2,
        emoji: '🛡️',
        levelRange: [1, 40],
        turnDuration: 4,
        stageChange: { stat: 'def', stages: 2 },
        combatUsable: true,
    },

    // === PHOENIX TEAR ===
    'phoenix-tear': {
        id: 'phoenix-tear',
        name: 'Phoenix Tear',
        description: 'Auto-revive on combat death with 30% HP.',
        effect: ConsumableEffect.PHOENIX_REVIVE,
        rarity: ConsumableRarity.EPIC,
        effectValue: 0.30,
        emoji: '🪶',
        levelRange: [1, 40],
        combatUsable: false,
    },

    // === UTILITY CONSUMABLES ===
    'scroll-of-pardon': {
        id: 'scroll-of-pardon',
        name: 'Scroll of Pardon',
        description: 'Restore a broken daily streak.',
        effect: ConsumableEffect.STREAK_RESTORE,
        rarity: ConsumableRarity.MASTER,
        effectValue: 1,
        emoji: '📜',
        levelRange: [1, 40],
        combatUsable: false,
    },
    'elixir-of-experience': {
        id: 'elixir-of-experience',
        name: 'Elixir of Experience',
        description: 'Gain 20% bonus XP for the next hour.',
        effect: ConsumableEffect.XP_BOOST,
        rarity: ConsumableRarity.EPIC,
        effectValue: 1.2,
        emoji: '⭐',
        levelRange: [1, 40],
        combatUsable: false,
    },
    'revive-potion': {
        id: 'revive-potion',
        name: 'Revive Potion',
        description: 'Revives from unconscious state with 25% HP.',
        effect: ConsumableEffect.REVIVE,
        rarity: ConsumableRarity.MASTER,
        effectValue: 0.25,
        emoji: '💫',
        levelRange: [1, 40],
        combatUsable: false,
    },
};

/**
 * Get appropriate HP potion for a given level
 */
export function getHpPotionForLevel(level: number): string {
    if (level <= 7) return 'hp-potion-minor';
    if (level <= 15) return 'hp-potion-lesser';
    if (level <= 23) return 'hp-potion-major';
    if (level <= 31) return 'hp-potion-greater';
    if (level <= 39) return 'hp-potion-superior';
    return 'hp-potion-supreme';
}

/**
 * Get appropriate Mana potion for a given level
 */
export function getMpPotionForLevel(level: number): string {
    if (level <= 7) return 'mp-potion-minor';
    if (level <= 15) return 'mp-potion-lesser';
    if (level <= 23) return 'mp-potion-major';
    if (level <= 31) return 'mp-potion-greater';
    if (level <= 39) return 'mp-potion-superior';
    return 'mp-potion-supreme';
}

/**
 * All HP potion IDs in tier order
 */
export const HP_POTION_IDS = [
    'hp-potion-minor',
    'hp-potion-lesser',
    'hp-potion-major',
    'hp-potion-greater',
    'hp-potion-superior',
    'hp-potion-supreme',
];

/**
 * All Mana potion IDs in tier order
 */
export const MP_POTION_IDS = [
    'mp-potion-minor',
    'mp-potion-lesser',
    'mp-potion-major',
    'mp-potion-greater',
    'mp-potion-superior',
    'mp-potion-supreme',
];

/**
 * Stat elixir IDs
 */
export const STAT_ELIXIR_IDS = [
    'elixir-bull', 'elixir-fox', 'elixir-bear',
    'elixir-owl', 'elixir-sage', 'elixir-serpent',
];

/**
 * Cleansing item IDs
 */
export const CLEANSING_IDS = ['purifying-salve', 'sacred-water'];

/**
 * Enchantment oil IDs
 */
export const ENCHANTMENT_IDS = ['oil-immolation', 'venom-coating', 'frostbite-tincture'];

/**
 * Tactical consumable IDs
 */
export const TACTICAL_IDS = ['firebomb', 'smoke-bomb', 'ironbark-ward'];

/**
 * Drop rates by rarity (percentage chance per loot roll)
 */
export const DROP_RATES: Record<ConsumableRarity, number> = {
    [ConsumableRarity.COMMON]: 20,   // 20% base chance
    [ConsumableRarity.ADEPT]: 12,    // 12% base chance
    [ConsumableRarity.MASTER]: 5,    // 5% base chance
    [ConsumableRarity.EPIC]: 2,      // 2% base chance
};
