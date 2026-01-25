/**
 * Consumable Item Model
 * 
 * Items that can be used from inventory for various effects.
 * Tiered potions restore HP/Mana based on character level range.
 */

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
    HP_RESTORE = 'hp_restore',       // Restore health points
    MANA_RESTORE = 'mana_restore',   // Restore mana points
    STREAK_RESTORE = 'streak',       // Restore broken streak (future)
    XP_BOOST = 'xp_boost',           // Temporary XP multiplier (future)
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
 * HP/Mana potions are tiered to match level ranges:
 * - Minor (L1-10): ~10-15% of max HP/MP at those levels
 * - Lesser (L11-20): ~10-15% of max HP/MP at those levels  
 * - Greater (L21-30): ~10-15% of max HP/MP at those levels
 * - Superior (L31-40): ~10-15% of max HP/MP at those levels
 * 
 * These are intentionally modest to give a "small bump" without
 * making players with potions invincible.
 */
export const CONSUMABLES: Record<string, ConsumableDefinition> = {
    // === HP POTIONS ===
    'hp-potion-minor': {
        id: 'hp-potion-minor',
        name: 'Minor Health Potion',
        description: 'Restores 50 HP. Best for adventurers level 1-10.',
        effect: ConsumableEffect.HP_RESTORE,
        rarity: ConsumableRarity.COMMON,
        effectValue: 50,
        emoji: '🧪',
        levelRange: [1, 10],
    },
    'hp-potion-lesser': {
        id: 'hp-potion-lesser',
        name: 'Lesser Health Potion',
        description: 'Restores 120 HP. Suited for level 11-20.',
        effect: ConsumableEffect.HP_RESTORE,
        rarity: ConsumableRarity.ADEPT,
        effectValue: 120,
        emoji: '🧪',
        levelRange: [11, 20],
    },
    'hp-potion-greater': {
        id: 'hp-potion-greater',
        name: 'Greater Health Potion',
        description: 'Restores 250 HP. For veterans level 21-30.',
        effect: ConsumableEffect.HP_RESTORE,
        rarity: ConsumableRarity.MASTER,
        effectValue: 250,
        emoji: '❤️‍🔥',
        levelRange: [21, 30],
    },
    'hp-potion-superior': {
        id: 'hp-potion-superior',
        name: 'Superior Health Potion',
        description: 'Restores 500 HP. Legendary brew for level 31-40.',
        effect: ConsumableEffect.HP_RESTORE,
        rarity: ConsumableRarity.EPIC,
        effectValue: 500,
        emoji: '💖',
        levelRange: [31, 40],
    },

    // === MANA POTIONS ===
    'mp-potion-minor': {
        id: 'mp-potion-minor',
        name: 'Minor Mana Potion',
        description: 'Restores 30 MP. Best for spellcasters level 1-10.',
        effect: ConsumableEffect.MANA_RESTORE,
        rarity: ConsumableRarity.COMMON,
        effectValue: 30,
        emoji: '🔮',
        levelRange: [1, 10],
    },
    'mp-potion-lesser': {
        id: 'mp-potion-lesser',
        name: 'Lesser Mana Potion',
        description: 'Restores 75 MP. Suited for level 11-20.',
        effect: ConsumableEffect.MANA_RESTORE,
        rarity: ConsumableRarity.ADEPT,
        effectValue: 75,
        emoji: '🔮',
        levelRange: [11, 20],
    },
    'mp-potion-greater': {
        id: 'mp-potion-greater',
        name: 'Greater Mana Potion',
        description: 'Restores 150 MP. For archmages level 21-30.',
        effect: ConsumableEffect.MANA_RESTORE,
        rarity: ConsumableRarity.MASTER,
        effectValue: 150,
        emoji: '💎',
        levelRange: [21, 30],
    },
    'mp-potion-superior': {
        id: 'mp-potion-superior',
        name: 'Superior Mana Potion',
        description: 'Restores 300 MP. Arcane elixir for level 31-40.',
        effect: ConsumableEffect.MANA_RESTORE,
        rarity: ConsumableRarity.EPIC,
        effectValue: 300,
        emoji: '✨',
        levelRange: [31, 40],
    },

    // === UTILITY CONSUMABLES (Future Implementation) ===
    'scroll-of-pardon': {
        id: 'scroll-of-pardon',
        name: 'Scroll of Pardon',
        description: 'Restore a broken daily streak',
        effect: ConsumableEffect.STREAK_RESTORE,
        rarity: ConsumableRarity.MASTER,
        effectValue: 1,
        emoji: '📜',
        levelRange: [1, 40],
    },
    'elixir-of-experience': {
        id: 'elixir-of-experience',
        name: 'Elixir of Experience',
        description: 'Gain 20% bonus XP for the next hour',
        effect: ConsumableEffect.XP_BOOST,
        rarity: ConsumableRarity.EPIC,
        effectValue: 1.2,
        emoji: '⭐',
        levelRange: [1, 40],
    },
};

/**
 * Get appropriate HP potion for a given level
 */
export function getHpPotionForLevel(level: number): string {
    if (level <= 10) return 'hp-potion-minor';
    if (level <= 20) return 'hp-potion-lesser';
    if (level <= 30) return 'hp-potion-greater';
    return 'hp-potion-superior';
}

/**
 * Get appropriate Mana potion for a given level
 */
export function getMpPotionForLevel(level: number): string {
    if (level <= 10) return 'mp-potion-minor';
    if (level <= 20) return 'mp-potion-lesser';
    if (level <= 30) return 'mp-potion-greater';
    return 'mp-potion-superior';
}

/**
 * Get all HP potion IDs
 */
export const HP_POTION_IDS = [
    'hp-potion-minor',
    'hp-potion-lesser',
    'hp-potion-greater',
    'hp-potion-superior',
];

/**
 * Get all Mana potion IDs
 */
export const MP_POTION_IDS = [
    'mp-potion-minor',
    'mp-potion-lesser',
    'mp-potion-greater',
    'mp-potion-superior',
];

/**
 * Drop rates by rarity (percentage chance per loot roll)
 */
export const DROP_RATES: Record<ConsumableRarity, number> = {
    [ConsumableRarity.COMMON]: 20,   // 20% base chance
    [ConsumableRarity.ADEPT]: 12,    // 12% base chance
    [ConsumableRarity.MASTER]: 5,    // 5% base chance
    [ConsumableRarity.EPIC]: 2,      // 2% base chance
};
