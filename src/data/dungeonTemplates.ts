/**
 * Test Dungeon Templates
 * 
 * Hand-crafted dungeons for development and testing.
 * These serve as examples for how to create custom dungeons.
 */

import type { DungeonTemplate } from '../models/Dungeon';

// ============================================
// Test Cave - Development Testing
// ============================================

/**
 * Simple test dungeon for development.
 * Single room for testing rendering and movement.
 */
export const TEST_CAVE: DungeonTemplate = {
    id: 'test_cave',
    name: 'Test Cave',
    description: 'A small cave for testing the exploration system.',
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
            width: 9,
            height: 7,
            layout: [
                '#########',
                '#.......#',
                '#.......#',
                '#...P...#',
                '#.......#',
                '#.......#',
                '####.####',
            ],
            doors: {
                '4,6': { targetRoom: 'combat1', targetEntry: 'north' },
            },
        },
        {
            id: 'combat1',
            type: 'combat',
            width: 9,
            height: 7,
            layout: [
                '####.####',
                '#.......#',
                '#.......#',
                '#...M...#',
                '#.......#',
                '#.......#',
                '####.####',
            ],
            doors: {
                '4,0': { targetRoom: 'entry', targetEntry: 'south' },
                '4,6': { targetRoom: 'treasure', targetEntry: 'north' },
            },
            monsters: [
                { position: [4, 3], pool: ['goblin'], isBoss: false },
            ],
        },
        {
            id: 'treasure',
            type: 'treasure',
            width: 9,
            height: 7,
            layout: [
                '####.####',
                '#.......#',
                '#..C.C..#',
                '#.......#',
                '#...O...#',
                '#.......#',
                '#########',
            ],
            doors: {
                '4,0': { targetRoom: 'combat1', targetEntry: 'south' },
            },
            chests: [
                { position: [3, 2], tier: 'adept' },
                { position: [5, 2], tier: 'journeyman' },
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
            height: 9,
            layout: [
                '###########',
                '#.........#',
                '#.........#',
                '#.........#',
                '#....P....#',
                '#.........#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,8': { targetRoom: 'fork', targetEntry: 'north' },
            },
        },
        {
            id: 'fork',
            type: 'combat',
            width: 15,
            height: 9,
            layout: [
                '#####.#####....',
                '#.........#....',
                '#....M....#....',
                '#.........#....',
                '.....M.........',
                '#.........#....',
                '#.........#....',
                '#.........#....',
                '##.#####.##....',
            ],
            doors: {
                '5,0': { targetRoom: 'entrance', targetEntry: 'south' },
                '2,8': { targetRoom: 'treasure_left', targetEntry: 'north' },
                '8,8': { targetRoom: 'guard_room', targetEntry: 'north' },
            },
            monsters: [
                { position: [5, 2], pool: ['goblin'] },
                { position: [5, 4], pool: ['goblin'] },
            ],
        },
        {
            id: 'treasure_left',
            type: 'treasure',
            width: 7,
            height: 7,
            layout: [
                '##.####',
                '#.....#',
                '#..C..#',
                '#.....#',
                '#.....#',
                '#.....#',
                '#######',
            ],
            doors: {
                '2,0': { targetRoom: 'fork', targetEntry: 'south' },
            },
            chests: [
                { position: [3, 2], tier: 'adept' },
            ],
        },
        {
            id: 'guard_room',
            type: 'combat',
            width: 9,
            height: 9,
            layout: [
                '####.####',
                '#.......#',
                '#..M.M..#',
                '#.......#',
                '#.......#',
                '#.......#',
                '#.......#',
                '#.......#',
                '####.####',
            ],
            doors: {
                '4,0': { targetRoom: 'fork', targetEntry: 'south' },
                '4,8': { targetRoom: 'boss_lair', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 2], pool: ['hobgoblin'] },
                { position: [5, 2], pool: ['hobgoblin'] },
            ],
        },
        {
            id: 'boss_lair',
            type: 'boss',
            width: 13,
            height: 11,
            layout: [
                '####..####...',
                '#..........#.',
                '#..........#.',
                '#..........#.',
                '#.....M....#.',
                '#..........#.',
                '#..........#.',
                '#...C..C...#.',
                '#..........#.',
                '#....O.....#.',
                '#############',
            ],
            doors: {
                '4,0': { targetRoom: 'guard_room', targetEntry: 'south' },
            },
            chests: [
                { position: [4, 7], tier: 'master' },
                { position: [7, 7], tier: 'master' },
            ],
            monsters: [
                { position: [6, 4], pool: ['bugbear'], isBoss: true },
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
