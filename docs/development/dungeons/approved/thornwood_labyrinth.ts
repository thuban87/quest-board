import { DungeonTemplate } from '../../../../src/models/Dungeon';

/**
 * THORNWOOD LABYRINTH
 * A hard-difficulty forest maze dungeon with 20 rooms and 30 monsters.
 * 
 * Architecture: Maze - complex interconnected rooms with multiple paths
 * Theme: A cursed forest where ancient trees have twisted into living walls,
 *        and the spirits of fallen hunters haunt the overgrown paths.
 * 
 * Monster Distribution:
 * - Beasts: wolves, bears, giant-rats (forest predators)
 * - Undead: skeletons, zombies, ghosts (fallen hunters/travelers)
 * - Boss: The Hollow Stag - a spectral deer lord corrupted by dark magic
 */
export const THORNWOOD_LABYRINTH: DungeonTemplate = {
    id: 'thornwood_labyrinth',
    name: 'Thornwood Labyrinth',
    description: 'A cursed maze of twisted trees and overgrown ruins. The spirits of those who wandered in and never left still roam these paths, alongside feral beasts that have made the labyrinth their hunting ground.',
    baseDifficulty: 'hard',
    tileSet: 'forest',
    lootBias: {
        primarySlots: ['weapon', 'legs', 'chest'],
        description: 'Rich in armor and weapons from fallen adventurers',
    },
    rooms: [
        // ===== ENTRY ZONE =====
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
                '##.#####.##',
            ],
            doors: {
                '2,6': { targetRoom: 'west_path_1', targetEntry: 'north' },
                '8,6': { targetRoom: 'east_path_1', targetEntry: 'north' },
            },
        },

        // ===== WEST PATH =====
        {
            id: 'west_path_1',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '##.########',
                '#.........#',
                '#..M......#',
                '#.........#',
                '#......M..#',
                '#.........#',
                '######.####',
            ],
            doors: {
                '2,0': { targetRoom: 'entry', targetEntry: 'south' },
                '6,6': { targetRoom: 'west_hub', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 2], pool: ['wolf'] },
                { position: [7, 4], pool: ['wolf'] },
            ],
        },
        {
            id: 'west_hub',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '######.####',
                '#.........#',
                '#..M...M..#',
                '.....C.....',
                '#.........#',
                '#.........#',
                '.##.###.##.',
            ],
            doors: {
                '6,0': { targetRoom: 'west_path_1', targetEntry: 'south' },
                '0,3': { targetRoom: 'dead_end_west_1', targetEntry: 'east' },
                '10,3': { targetRoom: 'central_crossing', targetEntry: 'west' },
                '3,6': { targetRoom: 'west_path_2', targetEntry: 'north' },
                '7,6': { targetRoom: 'west_path_3', targetEntry: 'north' },
            },
            chests: [
                { position: [5, 3], tier: 'adept' },
            ],
            monsters: [
                { position: [3, 2], pool: ['skeleton'] },
                { position: [7, 2], pool: ['zombie'] },
            ],
        },
        {
            id: 'dead_end_west_1',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#.........#',
                '#..C...C..#',
                '#..........',
                '#.........#',
                '#.........#',
                '###########',
            ],
            doors: {
                '10,3': { targetRoom: 'west_hub', targetEntry: 'west' },
            },
            chests: [
                { position: [3, 2], tier: 'journeyman' },
                { position: [7, 2], tier: 'journeyman' },
            ],
        },
        {
            id: 'west_path_2',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '###.#######',
                '#.........#',
                '#...M.....#',
                '#.........#',
                '#.....M...#',
                '#.........#',
                '#######.###',
            ],
            doors: {
                '3,0': { targetRoom: 'west_hub', targetEntry: 'south' },
                '7,6': { targetRoom: 'south_corridor', targetEntry: 'north' },
            },
            monsters: [
                { position: [4, 2], pool: ['giant-rat'] },
                { position: [6, 4], pool: ['giant-rat'] },
            ],
        },
        {
            id: 'west_path_3',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#######.###',
                '#.........#',
                '#.M.......#',
                '#.........#',
                '#.......M.#',
                '#.........#',
                '###.#######',
            ],
            doors: {
                '7,0': { targetRoom: 'west_hub', targetEntry: 'south' },
                '3,6': { targetRoom: 'center_south', targetEntry: 'north' },
            },
            monsters: [
                { position: [2, 2], pool: ['wolf'] },
                { position: [8, 4], pool: ['skeleton'] },
            ],
        },

        // ===== EAST PATH =====
        {
            id: 'east_path_1',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '########.##',
                '#.........#',
                '#......M..#',
                '#.........#',
                '#..M......#',
                '#.........#',
                '####.######',
            ],
            doors: {
                '8,0': { targetRoom: 'entry', targetEntry: 'south' },
                '4,6': { targetRoom: 'east_hub', targetEntry: 'north' },
            },
            monsters: [
                { position: [7, 2], pool: ['bear'] },
                { position: [3, 4], pool: ['wolf'] },
            ],
        },
        {
            id: 'east_hub',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '####.######',
                '#.........#',
                '#..M...M..#',
                '...........',
                '#.........#',
                '#.........#',
                '.##.###.##.',
            ],
            doors: {
                '4,0': { targetRoom: 'east_path_1', targetEntry: 'south' },
                '0,3': { targetRoom: 'central_crossing', targetEntry: 'east' },
                '10,3': { targetRoom: 'dead_end_east_1', targetEntry: 'west' },
                '3,6': { targetRoom: 'east_path_2', targetEntry: 'north' },
                '7,6': { targetRoom: 'east_path_3', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 2], pool: ['ghost'] },
                { position: [7, 2], pool: ['zombie'] },
            ],
        },
        {
            id: 'dead_end_east_1',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#.........#',
                '#.........#',
                '....C.C...#',
                '#.........#',
                '#.........#',
                '###########',
            ],
            doors: {
                '0,3': { targetRoom: 'east_hub', targetEntry: 'east' },
            },
            chests: [
                { position: [4, 3], tier: 'journeyman' },
                { position: [6, 3], tier: 'master' },
            ],
        },
        {
            id: 'east_path_2',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '###.#######',
                '#.........#',
                '#.....M...#',
                '#.........#',
                '#...M.....#',
                '#.........#',
                '#######.###',
            ],
            doors: {
                '3,0': { targetRoom: 'east_hub', targetEntry: 'south' },
                '7,6': { targetRoom: 'center_south', targetEntry: 'north' },
            },
            monsters: [
                { position: [6, 2], pool: ['skeleton'] },
                { position: [4, 4], pool: ['skeleton'] },
            ],
        },
        {
            id: 'east_path_3',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#######.###',
                '#.........#',
                '#.M.......#',
                '#.........#',
                '#.......M.#',
                '#.........#',
                '###.#######',
            ],
            doors: {
                '7,0': { targetRoom: 'east_hub', targetEntry: 'south' },
                '3,6': { targetRoom: 'south_corridor', targetEntry: 'north' },
            },
            monsters: [
                { position: [2, 2], pool: ['bear'] },
                { position: [8, 4], pool: ['ghost'] },
            ],
        },

        // ===== CENTRAL ZONE =====
        {
            id: 'central_crossing',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#..M...M..#',
                '....C......',
                '#..M...M..#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,0': { targetRoom: 'north_passage', targetEntry: 'south' },
                '0,3': { targetRoom: 'west_hub', targetEntry: 'east' },
                '10,3': { targetRoom: 'east_hub', targetEntry: 'west' },
                '5,6': { targetRoom: 'center_south', targetEntry: 'north' },
            },
            chests: [
                { position: [4, 3], tier: 'journeyman' },
            ],
            monsters: [
                { position: [3, 2], pool: ['zombie'] },
                { position: [7, 2], pool: ['zombie'] },
                { position: [3, 4], pool: ['wolf'] },
                { position: [7, 4], pool: ['wolf'] },
            ],
        },
        {
            id: 'north_passage',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '###.###.###',
                '#.........#',
                '#...M.M...#',
                '#.........#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '3,0': { targetRoom: 'dead_end_north', targetEntry: 'south' },
                '7,0': { targetRoom: 'pre_boss', targetEntry: 'south' },
                '5,6': { targetRoom: 'central_crossing', targetEntry: 'north' },
            },
            monsters: [
                { position: [4, 2], pool: ['ghost'] },
                { position: [6, 2], pool: ['ghost'] },
            ],
        },
        {
            id: 'dead_end_north',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#....C....#',
                '#.........#',
                '#..C...C..#',
                '#.........#',
                '#.........#',
                '###.#######',
            ],
            doors: {
                '3,6': { targetRoom: 'north_passage', targetEntry: 'north' },
            },
            chests: [
                { position: [5, 1], tier: 'master' },
                { position: [3, 3], tier: 'journeyman' },
                { position: [7, 3], tier: 'journeyman' },
            ],
        },
        {
            id: 'center_south',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '###.#.#.###',
                '#.........#',
                '#.M.....M.#',
                '#.........#',
                '#.........#',
                '#.........#',
                '###########',
            ],
            doors: {
                '3,0': { targetRoom: 'west_path_3', targetEntry: 'south' },
                '5,0': { targetRoom: 'central_crossing', targetEntry: 'south' },
                '7,0': { targetRoom: 'east_path_2', targetEntry: 'south' },
            },
            monsters: [
                { position: [2, 2], pool: ['bear'] },
                { position: [8, 2], pool: ['skeleton'] },
            ],
        },

        // ===== SOUTH CORRIDOR =====
        {
            id: 'south_corridor',
            type: 'combat',
            width: 11,
            height: 7,
            layout: [
                '###.###.###',
                '#.........#',
                '#..M......#',
                '#.........#',
                '#......M..#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '3,0': { targetRoom: 'east_path_3', targetEntry: 'south' },
                '7,0': { targetRoom: 'west_path_2', targetEntry: 'south' },
                '5,6': { targetRoom: 'south_dead_end', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 2], pool: ['giant-rat'] },
                { position: [7, 4], pool: ['giant-rat'] },
            ],
        },
        {
            id: 'south_dead_end',
            type: 'treasure',
            width: 11,
            height: 7,
            layout: [
                '#####.#####',
                '#.........#',
                '#..C...C..#',
                '#.........#',
                '#.........#',
                '#.........#',
                '###########',
            ],
            doors: {
                '5,0': { targetRoom: 'south_corridor', targetEntry: 'south' },
            },
            chests: [
                { position: [3, 2], tier: 'master' },
                { position: [7, 2], tier: 'journeyman' },
            ],
        },

        // ===== BOSS ZONE =====
        {
            id: 'pre_boss',
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
                '###.#######',
            ],
            doors: {
                '5,0': { targetRoom: 'boss_room', targetEntry: 'south' },
                '3,6': { targetRoom: 'north_passage', targetEntry: 'north' },
            },
            monsters: [
                { position: [3, 2], pool: ['skeleton'] },
                { position: [7, 2], pool: ['skeleton'] },
                { position: [3, 4], pool: ['zombie'] },
                { position: [7, 4], pool: ['zombie'] },
            ],
        },
        {
            id: 'boss_room',
            type: 'boss',
            width: 11,
            height: 14,
            layout: [
                '###########',
                '#.........#',
                '#..C...C..#',
                '#.........#',
                '#...M.M...#',
                '#.........#',
                '#.........#',
                '#....M....#',
                '#.........#',
                '#.........#',
                '#..C...C..#',
                '#.........#',
                '#....O....#',
                '#####.#####',
            ],
            doors: {
                '5,13': { targetRoom: 'pre_boss', targetEntry: 'north' },
            },
            chests: [
                { position: [3, 2], tier: 'master' },
                { position: [7, 2], tier: 'master' },
                { position: [3, 10], tier: 'legendary' },
                { position: [7, 10], tier: 'master' },
            ],
            monsters: [
                { position: [4, 4], pool: ['ghost'] },
                { position: [6, 4], pool: ['ghost'] },
                { position: [5, 7], pool: ['hollow-stag'], isBoss: true },
            ],
        },
    ],
};
