/**
 * Title Model
 * 
 * Represents an unlockable character title with optional passive buff.
 * Titles are cosmetic (prestige) or buff (cosmetic + passive micro-buff).
 * Buff titles inject as passive ActivePowerUp entries via TitleService.
 * 
 * Import pattern: Direct imports (not added to models/index.ts barrel).
 */

import { PowerUpEffect } from './Character';
import { TITLES } from '../data/titles';

/**
 * Title rarity tiers — drives CSS styling only, no mechanical effect
 */
export type TitleRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Title buff definition — the passive effect(s) granted when equipped
 */
export interface TitleBuff {
    /** Human-readable buff description: "+5% Gold from all sources" */
    label: string;
    /** The PowerUpEffect(s) to inject as passive ActivePowerUp entries.
     *  Single effect for most titles, array for multi-buff titles like The Relentless. */
    effect: PowerUpEffect | PowerUpEffect[];
}

/**
 * Title definition
 */
export interface Title {
    /** Unique identifier, e.g. 'the-novice', 'fortune-favored' */
    id: string;
    /** Display text: "The Novice" */
    name: string;
    /** Flavor text + buff description */
    description: string;
    /** Shown in modal for locked titles: "Maintain a 7-day streak" */
    unlockCondition: string;
    /** Icon for lists/export */
    emoji: string;
    /** Rarity tier — determines CSS styling */
    rarity: TitleRarity;
    /** If present, this title grants a passive buff when equipped */
    buff?: TitleBuff;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Look up a title by ID from the TITLES registry.
 * 
 * @param id - Title ID to look up
 * @returns The Title object, or undefined if not found
 */
export function getTitleById(id: string): Title | undefined {
    return TITLES[id];
}

/**
 * Check if a title grants a passive buff when equipped.
 * 
 * @param title - Title to check
 * @returns true if the title has a buff, false if cosmetic-only
 */
export function isBuffTitle(title: Title): boolean {
    return !!title.buff;
}
