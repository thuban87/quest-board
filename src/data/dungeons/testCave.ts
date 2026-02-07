import type { DungeonTemplate } from '../../models/Dungeon';

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
