import type { DungeonTemplate } from '../../models/Dungeon';

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
                { position: [5, 1], pool: ['wolf', 'giant-rat'] },
                { position: [5, 3], pool: ['wolf'] },
                { position: [5, 5], pool: ['wolf', 'giant-rat'] },
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
                { position: [5, 2], pool: ['cave-troll'], isBoss: true },
            ],
        },
    ],
};
