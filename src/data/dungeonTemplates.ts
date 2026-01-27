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
                '#..~...~..#',
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
// Castle Crypt - Undead Medium Dungeon (10 rooms)
// ============================================

/**
 * Castle Crypt - Ancient tomb beneath a ruined castle.
 * 10 rooms with undead enemies and hidden treasures.
 * Medium difficulty with skeleton/zombie focus.
 */
export const CASTLE_CRYPT: DungeonTemplate = {
    id: 'castle_crypt',
    name: 'Castle Crypt',
    description: 'Dusty tombs filled with ancient bones and restless dead.',
    baseDifficulty: 'medium',
    tileSet: 'dungeon',
    lootBias: {
        primarySlots: ['weapon', 'shield'],
        description: 'Good for weapons and shields',
    },
    rooms: [
        {
            // Room 1: Entry
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
                '5,6': { targetRoom: 'antechamber', targetEntry: 'north' },
            },
        },
        {
            // Room 2: Antechamber
            id: 'antechamber',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'entry', targetEntry: 'south' },
                '5,6': { targetRoom: 'crypt_hall', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 2], pool: ['skeleton'] },
                { position: [7, 2], pool: ['skeleton'] },
            ],
        },
        {
            // Room 3: Crypt Hall - Central hub
            id: 'crypt_hall',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#....M....#',
                '...........',
                '#....M.....',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'antechamber', targetEntry: 'south' },
                '0,2': { targetRoom: 'west_tomb', targetEntry: 'east' },
                '10,3': { targetRoom: 'east_tomb', targetEntry: 'west' },
                '5,6': { targetRoom: 'bone_pit', targetEntry: 'north' },
            },
            monsters: [
                { position: [5, 1], pool: ['skeleton'] },
                { position: [5, 3], pool: ['zombie'] },
            ],
        },
        {
            // Room 4: West Tomb
            id: 'west_tomb',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#....C....#',
                '...........',
                '#.........#',
                '#....M....#',
                '#.........#',
                '###########',
            ],
            doors: {
                '10,2': { targetRoom: 'crypt_hall', targetEntry: 'west' },
            },
            chests: [
                { position: [5, 1], tier: 'adept' },
            ],
            monsters: [
                { position: [5, 4], pool: ['skeleton', 'mimic'] },
            ],
        },
        {
            // Room 5: East Tomb
            id: 'east_tomb',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#....C....#',
                '...........',
                '#.........#',
                '#....M....#',
                '#....C....#',
                '###########',
            ],
            doors: {
                '0,2': { targetRoom: 'crypt_hall', targetEntry: 'east' },
            },
            chests: [
                { position: [5, 1], tier: 'adept' },
                { position: [5, 5], tier: 'journeyman' },
            ],
            monsters: [
                { position: [5, 4], pool: ['mimic'] },
            ],
        },
        {
            // Room 6: Bone Pit
            id: 'bone_pit',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'crypt_hall', targetEntry: 'south' },
                '5,6': { targetRoom: 'catacombs', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 2], pool: ['skeleton'] },
                { position: [7, 2], pool: ['skeleton'] },
                { position: [3, 4], pool: ['zombie'] },
                { position: [7, 4], pool: ['zombie'] },
            ],
        },
        {
            // Room 7: Catacombs
            id: 'catacombs',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#..M......#',
                '...........',
                '#......M...',
                '#.........#',
                '#..M......#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'bone_pit', targetEntry: 'south' },
                '0,2': { targetRoom: 'ossuary', targetEntry: 'east' },
                '10,3': { targetRoom: 'sarcophagus_room', targetEntry: 'west' },
                '5,6': { targetRoom: 'inner_sanctum', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 1], pool: ['zombie'] },
                { position: [7, 3], pool: ['zombie'] },
                { position: [3, 5], pool: ['skeleton'] },
            ],
        },
        {
            // Room 8: Ossuary (west branch)
            id: 'ossuary',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#..C...C..#',
                '...........',
                '#.........#',
                '#....M....#',
                '#.........#',
                '###########',
            ],
            doors: {
                '10,2': { targetRoom: 'catacombs', targetEntry: 'west' },
            },
            chests: [
                { position: [3, 1], tier: 'journeyman' },
                { position: [7, 1], tier: 'journeyman' },
            ],
            monsters: [
                { position: [5, 4], pool: ['skeleton', 'zombie'] },
            ],
        },
        {
            // Room 9: Sarcophagus Room (east branch)
            id: 'sarcophagus_room',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#....M....#',
                '...........',
                '#.........#',
                '#..M...M..#',
                '#....C....#',
                '###########',
            ],
            doors: {
                '0,2': { targetRoom: 'catacombs', targetEntry: 'east' },
            },
            chests: [
                { position: [5, 5], tier: 'master' },
            ],
            monsters: [
                { position: [5, 1], pool: ['skeleton'] },
                { position: [3, 4], pool: ['zombie'] },
                { position: [7, 4], pool: ['zombie'] },
            ],
        },
        {
            // Room 10: Inner Sanctum (Boss)
            id: 'inner_sanctum',
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
                '5,0': { targetRoom: 'catacombs', targetEntry: 'south' },
            },
            chests: [
                { position: [3, 4], tier: 'master' },
                { position: [7, 4], tier: 'master' },
            ],
            monsters: [
                { position: [5, 2], pool: ['eye_beast'], isBoss: true },
            ],
        },
    ],
};

// ============================================
// Bandit Stronghold - Humanoid Hard Dungeon (20 rooms)
// ============================================

/**
 * Bandit Stronghold - A sprawling fortified camp of dangerous outlaws.
 * 20 rooms with humanoid enemies and multiple wings.
 * Hard difficulty with berserkers and shadow elves.
 */
export const BANDIT_STRONGHOLD: DungeonTemplate = {
    id: 'bandit_stronghold',
    name: 'Bandit Stronghold',
    description: 'A fortified camp of ruthless bandits and their savage leaders.',
    baseDifficulty: 'hard',
    tileSet: 'castle',
    lootBias: {
        primarySlots: ['chest', 'weapon'],
        description: 'Good for armor and weapons',
    },
    rooms: [
        {
            // Room 1: Entry Gate
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
                '5,6': { targetRoom: 'courtyard', targetEntry: 'north' },
            },
        },
        {
            // Room 2: Outer Courtyard
            id: 'courtyard',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'entry', targetEntry: 'south' },
                '5,6': { targetRoom: 'main_hall', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 2], pool: ['rogue_dwarf'] },
                { position: [7, 2], pool: ['rogue_dwarf'] },
            ],
        },
        {
            // Room 3: Main Hall - Central Hub
            id: 'main_hall',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#....M....#',
                '...........',
                '#....M....#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'courtyard', targetEntry: 'south' },
                '0,2': { targetRoom: 'west_wing', targetEntry: 'east' },
                '10,3': { targetRoom: 'east_wing', targetEntry: 'west' },
                '5,6': { targetRoom: 'inner_hall', targetEntry: 'north' },
            },
            monsters: [
                { position: [5, 1], pool: ['rogue_dwarf'] },
                { position: [5, 3], pool: ['dark_ranger'] },
            ],
        },
        {
            // Room 4: West Wing Entrance
            id: 'west_wing',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#.........#',
                '...........',
                '#..M...M..#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '10,2': { targetRoom: 'main_hall', targetEntry: 'west' },
                '5,6': { targetRoom: 'barracks', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 3], pool: ['rogue_dwarf'] },
                { position: [7, 3], pool: ['rogue_dwarf'] },
            ],
        },
        {
            // Room 5: Barracks
            id: 'barracks',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#..M...M..#',
                '#.........#',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'west_wing', targetEntry: 'south' },
                '5,6': { targetRoom: 'mess_hall', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 1], pool: ['berserker'] },
                { position: [7, 1], pool: ['berserker'] },
                { position: [3, 4], pool: ['rogue_dwarf'] },
                { position: [7, 4], pool: ['rogue_dwarf'] },
            ],
        },
        {
            // Room 6: Mess Hall
            id: 'mess_hall',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#..C......#',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#.........#',
                '###########',
            ],
            doors: {
                '5,0': { targetRoom: 'barracks', targetEntry: 'south' },
            },
            chests: [
                { position: [3, 1], tier: 'adept' },
            ],
            monsters: [
                { position: [3, 3], pool: ['rogue_dwarf'] },
                { position: [7, 3], pool: ['berserker'] },
            ],
        },
        {
            // Room 7: East Wing Entrance
            id: 'east_wing',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#.........#',
                '#.........#',
                '...........',
                '#..M...M..#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '0,3': { targetRoom: 'main_hall', targetEntry: 'east' },
                '5,6': { targetRoom: 'armory', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 4], pool: ['dark_ranger'] },
                { position: [7, 4], pool: ['dark_ranger'] },
            ],
        },
        {
            // Room 8: Armory
            id: 'armory',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#..C...C..#',
                '#.........#',
                '#....M....#',
                '#.........#',
                '#....C....#',
                '###########',
            ],
            doors: {
                '5,0': { targetRoom: 'east_wing', targetEntry: 'south' },
            },
            chests: [
                { position: [3, 1], tier: 'journeyman' },
                { position: [7, 1], tier: 'journeyman' },
                { position: [5, 5], tier: 'master' },
            ],
            monsters: [
                { position: [5, 3], pool: ['mimic'] },
            ],
        },
        {
            // Room 9: Inner Hall
            id: 'inner_hall',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '...........',
                '#..M...M..#',
                '#.........#',
                '#....M....#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'main_hall', targetEntry: 'south' },
                '0,2': { targetRoom: 'dungeon_stairs', targetEntry: 'east' },
                '10,3': { targetRoom: 'treasury_hall', targetEntry: 'west' },
                '5,6': { targetRoom: 'war_room', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 3], pool: ['hobgoblin'] },
                { position: [7, 3], pool: ['hobgoblin'] },
                { position: [5, 5], pool: ['shadow_elf'] },
            ],
        },
        {
            // Room 10: Dungeon Stairs
            id: 'dungeon_stairs',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#.........#',
                '...........',
                '#..M......#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '10,2': { targetRoom: 'inner_hall', targetEntry: 'west' },
                '5,6': { targetRoom: 'prison', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 3], pool: ['hobgoblin'] },
            ],
        },
        {
            // Room 11: Prison
            id: 'prison',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#..C......#',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#.........#',
                '###########',
            ],
            doors: {
                '5,0': { targetRoom: 'dungeon_stairs', targetEntry: 'south' },
            },
            chests: [
                { position: [3, 1], tier: 'journeyman' },
            ],
            monsters: [
                { position: [3, 3], pool: ['skeleton'] },
                { position: [7, 3], pool: ['zombie'] },
            ],
        },
        {
            // Room 12: Treasury Hall
            id: 'treasury_hall',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#....M....#',
                '#.........#',
                '...........',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '0,3': { targetRoom: 'inner_hall', targetEntry: 'east' },
                '5,6': { targetRoom: 'treasury', targetEntry: 'north' },
            },
            monsters: [
                { position: [5, 1], pool: ['shadow_elf'] },
            ],
        },
        {
            // Room 13: Treasury
            id: 'treasury',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#..C...C..#',
                '#.........#',
                '#....M....#',
                '#..C...C..#',
                '#.........#',
                '###########',
            ],
            doors: {
                '5,0': { targetRoom: 'treasury_hall', targetEntry: 'south' },
            },
            chests: [
                { position: [3, 1], tier: 'master' },
                { position: [7, 1], tier: 'master' },
                { position: [3, 4], tier: 'journeyman' },
                { position: [7, 4], tier: 'journeyman' },
            ],
            monsters: [
                { position: [5, 3], pool: ['mimic'] },
            ],
        },
        {
            // Room 14: War Room
            id: 'war_room',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'inner_hall', targetEntry: 'south' },
                '5,6': { targetRoom: 'officer_quarters', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 2], pool: ['shadow_elf'] },
                { position: [7, 2], pool: ['shadow_elf'] },
                { position: [3, 4], pool: ['hobgoblin'] },
                { position: [7, 4], pool: ['hobgoblin'] },
            ],
        },
        {
            // Room 15: Officer Quarters
            id: 'officer_quarters',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#..C......#',
                '...........',
                '#....M....#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'war_room', targetEntry: 'south' },
                '0,2': { targetRoom: 'captains_room', targetEntry: 'east' },
                '10,3': { targetRoom: 'lieutenants_room', targetEntry: 'west' },
                '5,6': { targetRoom: 'training_hall', targetEntry: 'north' },
            },
            chests: [
                { position: [3, 1], tier: 'journeyman' },
            ],
            monsters: [
                { position: [5, 3], pool: ['berserker'] },
            ],
        },
        {
            // Room 16: Captain's Room
            id: 'captains_room',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#..C...C..#',
                '...........',
                '#....M....#',
                '#.........#',
                '#.........#',
                '###########',
            ],
            doors: {
                '10,2': { targetRoom: 'officer_quarters', targetEntry: 'west' },
            },
            chests: [
                { position: [3, 1], tier: 'master' },
                { position: [7, 1], tier: 'master' },
            ],
            monsters: [
                { position: [5, 3], pool: ['berserker'] },
            ],
        },
        {
            // Room 17: Lieutenant's Room
            id: 'lieutenants_room',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#....C....#',
                '#.........#',
                '...........',
                '#..M...M..#',
                '#.........#',
                '###########',
            ],
            doors: {
                '0,3': { targetRoom: 'officer_quarters', targetEntry: 'east' },
            },
            chests: [
                { position: [5, 1], tier: 'journeyman' },
            ],
            monsters: [
                { position: [3, 4], pool: ['shadow_elf'] },
                { position: [7, 4], pool: ['shadow_elf'] },
            ],
        },
        {
            // Room 18: Training Hall
            id: 'training_hall',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'officer_quarters', targetEntry: 'south' },
                '5,6': { targetRoom: 'throne_antechamber', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 2], pool: ['berserker'] },
                { position: [7, 2], pool: ['berserker'] },
                { position: [3, 4], pool: ['berserker'] },
                { position: [7, 4], pool: ['berserker'] },
            ],
        },
        {
            // Room 19: Throne Antechamber
            id: 'throne_antechamber',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#....M....#',
                '#.........#',
                '#..M...M..#',
                '#.........#',
                '#....M....#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'training_hall', targetEntry: 'south' },
                '5,6': { targetRoom: 'throne_room', targetEntry: 'north' },
            },
            monsters: [
                { position: [5, 1], pool: ['shadow_elf'] },
                { position: [3, 3], pool: ['berserker'] },
                { position: [7, 3], pool: ['berserker'] },
                { position: [5, 5], pool: ['shadow_elf'] },
            ],
        },
        {
            // Room 20: Throne Room (Boss)
            id: 'throne_room',
            type: 'boss',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#....M....#',
                '#..M...M..#',
                '#..C...C..#',
                '#....O....#',
                '###########',
            ],
            doors: {
                '5,0': { targetRoom: 'throne_antechamber', targetEntry: 'south' },
            },
            chests: [
                { position: [3, 4], tier: 'epic' },
                { position: [7, 4], tier: 'epic' },
            ],
            monsters: [
                { position: [5, 2], pool: ['river_troll'], isBoss: true },
                { position: [3, 3], pool: ['berserker'] },
                { position: [7, 3], pool: ['berserker'] },
            ],
        },
    ],
};

// ============================================
// Registry
// ============================================

/** Built-in dungeon templates */
const BUILTIN_TEMPLATES: Record<string, DungeonTemplate> = {
    test_cave: TEST_CAVE,
    goblin_cave: GOBLIN_CAVE,
    forest_ruins: FOREST_RUINS,
    castle_crypt: CASTLE_CRYPT,
    bandit_stronghold: BANDIT_STRONGHOLD,
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
    console.log(`[DungeonRegistry] Registered ${templates.length} user dungeon(s)`);
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
