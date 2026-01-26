/**
 * Test Dungeon Templates
 * 
 * Hand-crafted dungeons for development and testing.
 * These serve as examples for how to create custom dungeons.
 * 
 * Size Constraints (at 2x scale / 128px tiles):
 * - Max width: 11 tiles (no horizontal scroll)
 * - Max height: 7 tiles (no vertical scroll)
 * - Taller rooms (21+ height) will scroll vertically
 */

import type { DungeonTemplate } from '../models/Dungeon';

// ============================================
// Test Cave - Development Testing
// ============================================

/**
 * Simple test dungeon for development.
 * Tests rendering, movement, and vertical scrolling.
 * 
 * Room 1: Standard 11×7 entry
 * Room 2: TALL 11×21 for scroll testing
 * Room 3: Standard 11×7 treasure room
 */
export const TEST_CAVE: DungeonTemplate = {
    id: 'test_cave',
    name: 'Test Cave',
    description: 'A test cave for development. Includes a tall scrolling room.',
    baseDifficulty: 'easy',
    tileSet: 'cave',
    lootBias: {
        primarySlots: ['weapon'],
        description: 'Testing only',
    },
    rooms: [
        {
            id: 'entry',
            type: 'entry',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#.........#',
                '#.........#',
                '#....P....#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,6': { targetRoom: 'tall_corridor', targetEntry: 'north' },
            },
        },
        {
            // TALL ROOM - 21 height for scroll testing
            id: 'tall_corridor',
            type: 'combat',
            width: 11,
            height: 21,
            layout: [
                '#####.#####',
                '#.........#',
                '#.........#',
                '#.........#',
                '#....M....#',
                '#.........#',
                '#.........#',
                '#.........#',
                '#..#...#..#',
                '#..#...#..#',
                '#.........#',
                '#.........#',
                '#....M....#',
                '#.........#',
                '#.........#',
                '#..#...#..#',
                '#..#...#..#',
                '#.........#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'entry', targetEntry: 'south' },
                '5,20': { targetRoom: 'treasure', targetEntry: 'north' },
            },
            monsters: [
                { position: [5, 4], pool: ['goblin'], isBoss: false },
                { position: [5, 12], pool: ['goblin'], isBoss: false },
            ],
        },
        {
            id: 'treasure',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#..C...C..#',
                '#.........#',
                '#....O....#',
                '#.........#',
                '###########',
            ],
            doors: {
                '5,0': { targetRoom: 'tall_corridor', targetEntry: 'south' },
            },
            chests: [
                { position: [3, 2], tier: 'adept' },
                { position: [7, 2], tier: 'journeyman' },
            ],
        },
    ],
};

// ============================================
// Goblin Cave - First Real Dungeon
// ============================================

/**
 * Goblin Cave - The first proper dungeon.
 * 5 rooms with increasing difficulty.
 * All rooms sized 11×7 for consistent display.
 */
export const GOBLIN_CAVE: DungeonTemplate = {
    id: 'goblin_cave',
    name: 'Goblin Cave',
    description: 'A damp cave infested with goblins. Watch your step!',
    baseDifficulty: 'easy',
    tileSet: 'cave',
    lootBias: {
        primarySlots: ['weapon', 'head'],
        description: 'Good for weapons and helms',
    },
    rooms: [
        {
            id: 'entrance',
            type: 'entry',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#.........#',
                '#.........#',
                '#....P....#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,6': { targetRoom: 'fork', targetEntry: 'north' },
            },
        },
        {
            id: 'fork',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#....M....#',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '##.#####.##',
            ],
            doors: {
                '5,0': { targetRoom: 'entrance', targetEntry: 'south' },
                '2,6': { targetRoom: 'treasure_left', targetEntry: 'north' },
                '8,6': { targetRoom: 'guard_room', targetEntry: 'north' },
            },
            monsters: [
                { position: [5, 2], pool: ['goblin'] },
                { position: [3, 4], pool: ['goblin'] },
                { position: [7, 4], pool: ['goblin'] },
            ],
        },
        {
            id: 'treasure_left',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '##.########',
                '#.........#',
                '#....C....#',
                '#.........#',
                '#.........#',
                '#.........#',
                '###########',
            ],
            doors: {
                '2,0': { targetRoom: 'fork', targetEntry: 'south' },
            },
            chests: [
                { position: [5, 2], tier: 'adept' },
            ],
        },
        {
            id: 'guard_room',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '########.##',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '8,0': { targetRoom: 'fork', targetEntry: 'south' },
                '5,6': { targetRoom: 'boss_lair', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 2], pool: ['hobgoblin'] },
                { position: [7, 2], pool: ['hobgoblin'] },
            ],
        },
        {
            id: 'boss_lair',
            type: 'boss',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#....M....#',
                '#.........#',
                '#..C...C..#',
                '#....O....#',
                '###########',
            ],
            doors: {
                '5,0': { targetRoom: 'guard_room', targetEntry: 'south' },
            },
            chests: [
                { position: [3, 4], tier: 'master' },
                { position: [7, 4], tier: 'master' },
            ],
            monsters: [
                { position: [5, 2], pool: ['bugbear'], isBoss: true },
            ],
        },
    ],
};

// ============================================
// Registry
// ============================================

/** All available dungeon templates */
export const DUNGEON_TEMPLATES: Record<string, DungeonTemplate> = {
    test_cave: TEST_CAVE,
    goblin_cave: GOBLIN_CAVE,
};

/**
 * Get a dungeon template by ID.
 */
export function getDungeonTemplate(id: string): DungeonTemplate | null {
    return DUNGEON_TEMPLATES[id] ?? null;
}

/**
 * Get all dungeon templates as an array.
 */
export function getAllDungeonTemplates(): DungeonTemplate[] {
    return Object.values(DUNGEON_TEMPLATES);
}
