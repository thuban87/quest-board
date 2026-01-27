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
// Forest Ruins - Meandering Outdoor Dungeon
// ============================================

/**
 * Forest Ruins - A half-outside, half-ruins exploration.
 * 8 rooms with meandering paths and treasure branches.
 * Uses East/West door transitions in addition to North/South.
 * 
 * Layout:
 *   [Entry]──E──[Crossroads]──S──[South Combat]──S──[Boss Lair]
 *                    │                  │
 *                    W                  E
 *                    │                  │
 *            [West Treasure]    [East Ruins]──E──[Hidden Cache]
 *                                       │
 *                                       S
 *                                       │
 *                               [Guard Post]
 */
export const FOREST_RUINS: DungeonTemplate = {
    id: 'forest_ruins',
    name: 'Forest Ruins',
    description: 'Ancient ruins reclaimed by nature. Many paths lead to forgotten treasures.',
    baseDifficulty: 'medium',
    tileSet: 'forest',
    lootBias: {
        primarySlots: ['chest', 'legs'],
        description: 'Good for armor drops',
    },
    rooms: [
        {
            // Room 1: Forest Entry - Safe starting area
            id: 'entry',
            type: 'entry',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#.........#',
                '#..B...B..#',
                '#....P....#',
                '#.........#',
                '#..~...~..#',
                '#####.#####',
            ],
            doors: {
                '5,6': { targetRoom: 'crossroads', targetEntry: 'north' },
            },
        },
        {
            // Room 2: Crossroads - Hub with 3 exits
            id: 'crossroads',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#....M....#',
                '#.........#',
                '.....M.....',
                '#.........#',
                '#....M....#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'entry', targetEntry: 'south' },
                '0,3': { targetRoom: 'west_treasure', targetEntry: 'east' },
                '5,6': { targetRoom: 'south_combat', targetEntry: 'north' },
            },
            monsters: [
                { position: [5, 1], pool: ['wolf', 'giant_rat'] },
                { position: [5, 3], pool: ['wolf'] },
                { position: [5, 5], pool: ['wolf', 'giant_rat'] },
            ],
        },
        {
            // Room 3: West Treasure Branch - Dead end with loot
            id: 'west_treasure',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#..C......#',
                '#.........#',
                '#..........',
                '#....B....#',
                '#.........#',
                '###########',
            ],
            doors: {
                '10,3': { targetRoom: 'crossroads', targetEntry: 'west' },
            },
            chests: [
                { position: [3, 1], tier: 'adept' },
            ],
        },
        {
            // Room 4: South Combat - Connections east and south
            id: 'south_combat',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#..M...M...',
                '#..........',
                '#.........#',
                '#..~.~.~..#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'crossroads', targetEntry: 'south' },
                '10,2': { targetRoom: 'east_ruins', targetEntry: 'west' },
                '10,3': { targetRoom: 'east_ruins', targetEntry: 'west' },
                '5,6': { targetRoom: 'boss_lair', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 2], pool: ['skeleton', 'ghost'] },
                { position: [7, 2], pool: ['skeleton'] },
            ],
        },
        {
            // Room 5: East Ruins - Interior ruins section
            id: 'east_ruins',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#..M......#',
                '...........',
                '...........',
                '#.........#',
                '#..M......#',
                '#####.#####',
            ],
            doors: {
                '0,2': { targetRoom: 'south_combat', targetEntry: 'east' },
                '0,3': { targetRoom: 'south_combat', targetEntry: 'east' },
                '10,2': { targetRoom: 'hidden_cache', targetEntry: 'west' },
                '10,3': { targetRoom: 'hidden_cache', targetEntry: 'west' },
                '5,6': { targetRoom: 'guard_post', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 1], pool: ['skeleton', 'zombie'] },
                { position: [3, 5], pool: ['zombie'] },
            ],
        },
        {
            // Room 6: Hidden Cache - Treasure room east of ruins
            id: 'hidden_cache',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#....C....#',
                '..........#',
                '..........#',
                '#.........#',
                '#....C....#',
                '###########',
            ],
            doors: {
                '0,2': { targetRoom: 'east_ruins', targetEntry: 'east' },
                '0,3': { targetRoom: 'east_ruins', targetEntry: 'east' },
            },
            chests: [
                { position: [5, 1], tier: 'journeyman' },
                { position: [5, 5], tier: 'adept' },
            ],
        },
        {
            // Room 7: Guard Post - Last combat before boss
            id: 'guard_post',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#..M...M..#',
                '#....B....#',
                '#..M...M..#',
                '#.........#',
                '###########',
            ],
            doors: {
                '5,0': { targetRoom: 'east_ruins', targetEntry: 'south' },
            },
            monsters: [
                { position: [3, 2], pool: ['hobgoblin'] },
                { position: [7, 2], pool: ['hobgoblin'] },
                { position: [3, 4], pool: ['skeleton'] },
                { position: [7, 4], pool: ['skeleton'] },
            ],
        },
        {
            // Room 8: Boss Lair - Final room with boss and portal
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
                '5,0': { targetRoom: 'south_combat', targetEntry: 'south' },
            },
            chests: [
                { position: [3, 4], tier: 'master' },
                { position: [7, 4], tier: 'master' },
            ],
            monsters: [
                { position: [5, 2], pool: ['cave_troll'], isBoss: true },
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
    forest_ruins: FOREST_RUINS,
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
