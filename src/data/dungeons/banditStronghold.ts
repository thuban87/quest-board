import type { DungeonTemplate } from '../../models/Dungeon';

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
                { position: [3, 2], pool: ['rogue-dwarf'] },
                { position: [7, 2], pool: ['rogue-dwarf'] },
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
                { position: [5, 1], pool: ['rogue-dwarf'] },
                { position: [5, 3], pool: ['dark-ranger'] },
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
                { position: [3, 3], pool: ['rogue-dwarf'] },
                { position: [7, 3], pool: ['rogue-dwarf'] },
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
                { position: [3, 4], pool: ['rogue-dwarf'] },
                { position: [7, 4], pool: ['rogue-dwarf'] },
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
                { position: [3, 3], pool: ['rogue-dwarf'] },
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
                { position: [3, 4], pool: ['dark-ranger'] },
                { position: [7, 4], pool: ['dark-ranger'] },
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
                { position: [5, 5], pool: ['shadow-elf'] },
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
                { position: [5, 1], pool: ['shadow-elf'] },
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
                { position: [3, 2], pool: ['shadow-elf'] },
                { position: [7, 2], pool: ['shadow-elf'] },
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
                { position: [3, 4], pool: ['shadow-elf'] },
                { position: [7, 4], pool: ['shadow-elf'] },
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
                { position: [5, 1], pool: ['shadow-elf'] },
                { position: [3, 3], pool: ['berserker'] },
                { position: [7, 3], pool: ['berserker'] },
                { position: [5, 5], pool: ['shadow-elf'] },
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
                { position: [5, 2], pool: ['river-troll'], isBoss: true },
                { position: [3, 3], pool: ['berserker'] },
                { position: [7, 3], pool: ['berserker'] },
            ],
        },
    ],
};
