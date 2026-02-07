import type { DungeonTemplate } from '../../models/Dungeon';

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
                { position: [5, 2], pool: ['eye-beast'], isBoss: true },
            ],
        },
    ],
};
