/**
 * Consumable Item Model
 * 
 * Items that can be used from inventory for various effects.
 */

/**
 * Consumable rarity levels
 */
export enum ConsumableRarity {
    COMMON = 'common',
    RARE = 'rare',
    EPIC = 'epic',
}

/**
 * Consumable effect types
 */
export enum ConsumableEffect {
    POMODORO = 'pomodoro',       // Start 25-minute timer
    STREAK_RESTORE = 'streak',   // Restore broken streak
    SKIP_TASK = 'skip',          // Auto-complete trivial task
    XP_BOOST = 'xp-boost',       // Temporary XP multiplier
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
    effectValue: number; // e.g., 25 for 25-min timer, 1.2 for 20% boost
    emoji: string;
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
 */
export const CONSUMABLES: Record<string, ConsumableDefinition> = {
    'potion-of-focus': {
        id: 'potion-of-focus',
        name: 'Potion of Focus',
        description: 'Start a 25-minute Pomodoro timer for deep focus',
        effect: ConsumableEffect.POMODORO,
        rarity: ConsumableRarity.COMMON,
        effectValue: 25,
        emoji: '🧪',
    },
    'scroll-of-pardon': {
        id: 'scroll-of-pardon',
        name: 'Scroll of Pardon',
        description: 'Restore a broken daily streak',
        effect: ConsumableEffect.STREAK_RESTORE,
        rarity: ConsumableRarity.RARE,
        effectValue: 1,
        emoji: '📜',
    },
    'coin-of-bribery': {
        id: 'coin-of-bribery',
        name: 'Coin of Bribery',
        description: 'Auto-complete one trivial task',
        effect: ConsumableEffect.SKIP_TASK,
        rarity: ConsumableRarity.RARE,
        effectValue: 1,
        emoji: '🪙',
    },
    'elixir-of-experience': {
        id: 'elixir-of-experience',
        name: 'Elixir of Experience',
        description: 'Gain 20% bonus XP for the next hour',
        effect: ConsumableEffect.XP_BOOST,
        rarity: ConsumableRarity.EPIC,
        effectValue: 1.2,
        emoji: '✨',
    },
};

/**
 * Drop rates by rarity (percentage)
 */
export const DROP_RATES: Record<ConsumableRarity, number> = {
    [ConsumableRarity.COMMON]: 15,
    [ConsumableRarity.RARE]: 5,
    [ConsumableRarity.EPIC]: 1,
};
