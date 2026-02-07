/**
 * Dungeon Template Registry
 *
 * Manages built-in and user-created dungeon templates.
 * Individual dungeons are defined in separate files for easy editing.
 */

import type { DungeonTemplate } from '../../models/Dungeon';

// Import all built-in dungeons
import { TEST_CAVE } from './testCave';
import { GOBLIN_CAVE } from './goblinCave';
import { FOREST_RUINS } from './forestRuins';
import { CASTLE_CRYPT } from './castleCrypt';
import { BANDIT_STRONGHOLD } from './banditStronghold';
import { THORNWOOD_LABYRINTH } from './thornwoodLabyrinth';

// Re-export individual dungeons (for direct access if ever needed)
export { TEST_CAVE, GOBLIN_CAVE, FOREST_RUINS, CASTLE_CRYPT, BANDIT_STRONGHOLD, THORNWOOD_LABYRINTH };

/** Built-in dungeon templates */
const BUILTIN_TEMPLATES: Record<string, DungeonTemplate> = {
    test_cave: TEST_CAVE,
    goblin_cave: GOBLIN_CAVE,
    forest_ruins: FOREST_RUINS,
    castle_crypt: CASTLE_CRYPT,
    bandit_stronghold: BANDIT_STRONGHOLD,
    thornwood_labyrinth: THORNWOOD_LABYRINTH,
};

/** User-loaded dungeon templates (cleared on reload) */
let userTemplates: Record<string, DungeonTemplate> = {};

/** All available dungeon templates (built-in + user) */
export const DUNGEON_TEMPLATES: Record<string, DungeonTemplate> = BUILTIN_TEMPLATES;

/**
 * Get a dungeon template by ID.
 */
export function getDungeonTemplate(id: string): DungeonTemplate | null {
    return userTemplates[id] ?? BUILTIN_TEMPLATES[id] ?? null;
}

/**
 * Get all dungeon templates as an array (built-in + user).
 */
export function getAllDungeonTemplates(): DungeonTemplate[] {
    return [...Object.values(BUILTIN_TEMPLATES), ...Object.values(userTemplates)];
}

/**
 * Register user-created dungeons loaded from markdown files.
 * Called on plugin load after parsing user dungeon folder.
 */
export function registerUserDungeons(templates: DungeonTemplate[]): void {
    userTemplates = {};
    for (const template of templates) {
        userTemplates[template.id] = template;
    }
}

/**
 * Clear all user dungeons (called before reload).
 */
export function clearUserDungeons(): void {
    userTemplates = {};
}

/**
 * Get a random dungeon template from all available.
 */
export function getRandomDungeon(): DungeonTemplate {
    const all = getAllDungeonTemplates();
    // Exclude test_cave from random selection
    const selectable = all.filter(t => t.id !== 'test_cave');
    return selectable[Math.floor(Math.random() * selectable.length)];
}
