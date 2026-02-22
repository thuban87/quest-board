/**
 * useDungeonBonuses Hook
 *
 * Extracts and memoizes all dungeon-related accessory bonuses.
 * Used by DungeonView and child components to avoid redundant calculations.
 */

import { useMemo } from 'react';
import { EquippedGearMap } from '../models/Gear';
import { getDungeonBonus, getGoldMultiplier, getXPMultiplier } from '../services/AccessoryEffectService';

/** Computed dungeon bonuses from equipped accessories */
export interface DungeonBonuses {
    /** Gold multiplier for dungeon rewards (e.g. 1.2 = +20%) */
    goldMultiplier: number;
    /** XP multiplier for dungeon rewards (e.g. 1.1 = +10%) */
    xpMultiplier: number;
    /** Bonus chance for golden chest upgrades (0-1) */
    goldenChestBonus: number;
    /** Whether the dungeon map is fully revealed on entry */
    hasMapReveal: boolean;
    /** Whether an auto-revive is available (Phoenix Feather) */
    hasAutoRevive: boolean;
}

/**
 * Memoizes dungeon accessory bonuses from equipped gear.
 * 
 * @param equippedGear - The character's currently equipped gear map
 * @returns Computed dungeon bonuses
 */
export function useDungeonBonuses(equippedGear: EquippedGearMap): DungeonBonuses {
    return useMemo(() => ({
        goldMultiplier: 1 + getGoldMultiplier(equippedGear, 'dungeon'),
        xpMultiplier: 1 + getXPMultiplier(equippedGear, 'dungeon'),
        goldenChestBonus: getDungeonBonus(equippedGear, 'goldenChest') as number,
        hasMapReveal: !!getDungeonBonus(equippedGear, 'mapReveal'),
        hasAutoRevive: !!getDungeonBonus(equippedGear, 'autoRevive'),
    }), [equippedGear]);
}
