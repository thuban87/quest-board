/**
 * Title Service
 * 
 * Manages title grants, equipping/unequipping, and passive power-up lifecycle.
 * Titles inject as passive ActivePowerUp entries (triggeredBy: 'title').
 * 
 * TitleService owns the business logic. Stores own the state mutations.
 * AchievementService remains stateless — caller-side code handles the
 * grantTitle() call after achievement checks.
 */

import { Title, getTitleById, isBuffTitle } from '../models/Title';
import { Character, ActivePowerUp, CLASS_INFO, PowerUpEffect, StatType } from '../models/Character';
import { useCharacterStore } from '../store/characterStore';
import { TITLES } from '../data/titles';

/**
 * Grant a title to the current character.
 * Adds the title to unlockedTitles if not already present.
 * Does NOT show a Notice — callers control timing (E2 pattern).
 * 
 * @param titleId - ID of the title to grant
 * @returns The Title object if valid and newly granted, null otherwise
 */
export function grantTitle(titleId: string): Title | null {
    const title = getTitleById(titleId);
    if (!title) {
        console.warn(`[TitleService] Unknown title ID: ${titleId}`);
        return null;
    }

    const character = useCharacterStore.getState().character;
    if (!character) {
        console.warn('[TitleService] No character loaded, cannot grant title');
        return null;
    }

    // Already unlocked — no-op
    if (character.unlockedTitles.includes(titleId)) {
        return null;
    }

    useCharacterStore.getState().addUnlockedTitle(titleId);
    return title;
}

/**
 * Equip or unequip a title on the current character.
 * Manages passive power-up lifecycle via surgical store actions:
 * 1. Remove all power-ups with triggeredBy === 'title'
 * 2. If equipping a buff title, add new title power-ups
 * 
 * @param titleId - Title ID to equip, or null to unequip
 */
export function equipTitle(titleId: string | null): void {
    const character = useCharacterStore.getState().character;
    if (!character) {
        console.warn('[TitleService] No character loaded, cannot equip title');
        return;
    }

    // Validate title ID if equipping
    if (titleId !== null) {
        const title = getTitleById(titleId);
        if (!title) {
            console.warn(`[TitleService] Unknown title ID: ${titleId}`);
            return;
        }

        // Must be unlocked
        if (!character.unlockedTitles.includes(titleId)) {
            console.warn(`[TitleService] Title not unlocked: ${titleId}`);
            return;
        }
    }

    // Step 1: Remove old title power-ups
    useCharacterStore.getState().removePowerUpsByTrigger('title');

    // Step 2: Set equipped title
    useCharacterStore.getState().setEquippedTitle(titleId);

    // Step 3: Add new title power-ups (if equipping a buff title)
    if (titleId !== null) {
        const title = getTitleById(titleId)!;
        // Re-read character after state updates
        const updatedCharacter = useCharacterStore.getState().character;
        if (updatedCharacter && isBuffTitle(title)) {
            const powerUps = createTitlePowerUps(title, updatedCharacter);
            if (powerUps.length > 0) {
                useCharacterStore.getState().addPowerUps(powerUps);
            }
        }
    }
}

/**
 * Get all unlocked titles for a character as Title objects.
 * Filters out invalid/stale IDs that no longer exist in the registry.
 * 
 * @param character - Character to get titles for
 * @returns Array of valid Title objects
 */
export function getUnlockedTitles(character: Character): Title[] {
    return character.unlockedTitles
        .map(id => getTitleById(id))
        .filter((t): t is Title => t !== undefined);
}

/**
 * Get the currently equipped title for a character.
 * Returns null if no title equipped or if the equipped title ID is invalid.
 * 
 * @param character - Character to check
 * @returns The equipped Title, or null
 */
export function getEquippedTitle(character: Character): Title | null {
    if (!character.equippedTitle) return null;
    return getTitleById(character.equippedTitle) ?? null;
}

/**
 * Create ActivePowerUp entries for a buff title.
 * Returns empty array for cosmetic (non-buff) titles.
 * 
 * Handles special cases:
 * - "The Focused": Two stat_percent_boost entries from character's primary class stats
 * - "The Relentless": Two entries (all_stats_boost + xp_multiplier)
 * - Single-buff titles: One entry
 * 
 * All returned entries have triggeredBy: 'title' and expiresAt: null.
 * 
 * @param title - Title to create power-ups for
 * @param character - Character (needed for class-based resolution)
 * @returns Array of ActivePowerUp entries
 */
export function createTitlePowerUps(title: Title, character: Character): ActivePowerUp[] {
    if (!title.buff) return [];

    const now = new Date().toISOString();
    const effects: PowerUpEffect[] = [];

    // Handle "The Focused" — resolve both primary class stats
    if (title.id === 'the-focused') {
        const classInfo = CLASS_INFO[character.class];
        const [stat1, stat2] = classInfo.primaryStats;
        effects.push(
            { type: 'stat_percent_boost', stat: stat1, value: 0.03 },
            { type: 'stat_percent_boost', stat: stat2, value: 0.03 }
        );
    } else if (Array.isArray(title.buff.effect)) {
        // Multi-buff title (e.g., "The Relentless")
        effects.push(...title.buff.effect);
    } else {
        // Single-buff title
        effects.push(title.buff.effect);
    }

    return effects.map((effect, index): ActivePowerUp => ({
        id: effects.length > 1
            ? `title-buff-${title.id}-${index}`
            : `title-buff-${title.id}`,
        name: title.name,
        icon: title.emoji,
        description: title.buff!.label,
        triggeredBy: 'title',
        startedAt: now,
        expiresAt: null,
        effect,
    }));
}
