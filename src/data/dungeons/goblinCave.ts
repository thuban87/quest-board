import type { DungeonTemplate } from '../../models/Dungeon';

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
