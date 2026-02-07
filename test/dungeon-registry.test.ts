/**
 * Dungeon Registry Tests
 * 
 * Tests for the dungeon template registry functions.
 * Written TDD-style: these tests target the new modular structure
 * and will fail until the refactor is complete.
 * 
 * Tests cover:
 * - getDungeonTemplate() - lookup by ID
 * - getAllDungeonTemplates() - list all templates
 * - registerUserDungeons() / clearUserDungeons() - user template management
 * - getRandomDungeon() - random selection excluding test_cave
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    getDungeonTemplate,
    getAllDungeonTemplates,
    registerUserDungeons,
    clearUserDungeons,
    getRandomDungeon,
    // Individual dungeon exports (should be available after modularization)
    TEST_CAVE,
    GOBLIN_CAVE,
    FOREST_RUINS,
    CASTLE_CRYPT,
    BANDIT_STRONGHOLD,
    THORNWOOD_LABYRINTH,
} from '../src/data/dungeons';
import type { DungeonTemplate } from '../src/models/Dungeon';

describe('Dungeon Template Registry', () => {
    // Clean up user dungeons after each test to avoid test pollution
    afterEach(() => {
        clearUserDungeons();
    });

    describe('Built-in Templates', () => {
        it('should have exactly 6 built-in dungeon templates', () => {
            const all = getAllDungeonTemplates();
            expect(all.length).toBe(6);
        });

        it('all individual dungeon consts should be exported', () => {
            expect(TEST_CAVE).toBeDefined();
            expect(GOBLIN_CAVE).toBeDefined();
            expect(FOREST_RUINS).toBeDefined();
            expect(CASTLE_CRYPT).toBeDefined();
            expect(BANDIT_STRONGHOLD).toBeDefined();
            expect(THORNWOOD_LABYRINTH).toBeDefined();
        });

        it('each dungeon should have required fields', () => {
            const all = getAllDungeonTemplates();
            for (const dungeon of all) {
                expect(dungeon.id).toBeDefined();
                expect(dungeon.name).toBeDefined();
                expect(dungeon.description).toBeDefined();
                expect(dungeon.baseDifficulty).toMatch(/^(easy|medium|hard)$/);
                expect(dungeon.tileSet).toMatch(/^(cave|forest|dungeon|castle)$/);
                expect(dungeon.lootBias).toBeDefined();
                expect(dungeon.lootBias.primarySlots).toBeInstanceOf(Array);
                expect(dungeon.rooms).toBeInstanceOf(Array);
                expect(dungeon.rooms.length).toBeGreaterThan(0);
            }
        });

        it('should have correct dungeon IDs', () => {
            const ids = getAllDungeonTemplates().map((d: DungeonTemplate) => d.id);
            expect(ids).toContain('test_cave');
            expect(ids).toContain('goblin_cave');
            expect(ids).toContain('forest_ruins');
            expect(ids).toContain('castle_crypt');
            expect(ids).toContain('bandit_stronghold');
            expect(ids).toContain('thornwood_labyrinth');
        });
    });

    describe('getDungeonTemplate()', () => {
        it('should return a dungeon by ID', () => {
            const goblin = getDungeonTemplate('goblin_cave');
            expect(goblin).not.toBeNull();
            expect(goblin?.name).toBe('Goblin Cave');
            expect(goblin?.baseDifficulty).toBe('easy');
        });

        it('should return null for invalid ID', () => {
            const missing = getDungeonTemplate('nonexistent_dungeon');
            expect(missing).toBeNull();
        });

        it('should prioritize user dungeons over built-in', () => {
            // Register a user dungeon with the same ID as a built-in
            const customGoblin: DungeonTemplate = {
                id: 'goblin_cave',
                name: 'Custom Goblin Cave',
                description: 'A user-defined version',
                baseDifficulty: 'hard',
                tileSet: 'dungeon',
                lootBias: { primarySlots: ['weapon'], description: 'Custom loot' },
                rooms: [{
                    id: 'entry',
                    type: 'entry',
                    width: 11,
                    height: 7,
                    layout: ['###########', '#....P....#', '###########'],
                    doors: {},
                }],
            };
            registerUserDungeons([customGoblin]);

            const result = getDungeonTemplate('goblin_cave');
            expect(result?.name).toBe('Custom Goblin Cave');
            expect(result?.baseDifficulty).toBe('hard');
        });
    });

    describe('User Dungeon Management', () => {
        const mockUserDungeon: DungeonTemplate = {
            id: 'user_my_custom_dungeon',
            name: 'My Custom Dungeon',
            description: 'A test user dungeon',
            baseDifficulty: 'medium',
            tileSet: 'forest',
            lootBias: { primarySlots: ['chest'], description: 'Test loot' },
            rooms: [{
                id: 'entry',
                type: 'entry',
                width: 11,
                height: 7,
                layout: ['###########', '#....P....#', '###########'],
                doors: {},
            }],
        };

        it('registerUserDungeons should add user dungeons', () => {
            expect(getAllDungeonTemplates().length).toBe(6); // Built-in only

            registerUserDungeons([mockUserDungeon]);

            expect(getAllDungeonTemplates().length).toBe(7); // Built-in + 1 user
            expect(getDungeonTemplate('user_my_custom_dungeon')).not.toBeNull();
        });

        it('registerUserDungeons should replace previous user dungeons', () => {
            registerUserDungeons([mockUserDungeon]);
            expect(getAllDungeonTemplates().length).toBe(7);

            // Register a different set
            const anotherDungeon: DungeonTemplate = {
                ...mockUserDungeon,
                id: 'user_another_dungeon',
                name: 'Another Dungeon',
            };
            registerUserDungeons([anotherDungeon]);

            expect(getAllDungeonTemplates().length).toBe(7); // Still 7, not 8
            expect(getDungeonTemplate('user_my_custom_dungeon')).toBeNull(); // Old one gone
            expect(getDungeonTemplate('user_another_dungeon')).not.toBeNull(); // New one present
        });

        it('clearUserDungeons should remove all user dungeons', () => {
            registerUserDungeons([mockUserDungeon]);
            expect(getDungeonTemplate('user_my_custom_dungeon')).not.toBeNull();

            clearUserDungeons();

            expect(getDungeonTemplate('user_my_custom_dungeon')).toBeNull();
            expect(getAllDungeonTemplates().length).toBe(6); // Back to built-in only
        });
    });

    describe('getRandomDungeon()', () => {
        it('should return a valid dungeon template', () => {
            const dungeon = getRandomDungeon();
            expect(dungeon).toBeDefined();
            expect(dungeon.id).toBeDefined();
            expect(dungeon.name).toBeDefined();
        });

        it('should never return test_cave', () => {
            // Run 100 times to be statistically confident
            for (let i = 0; i < 100; i++) {
                const dungeon = getRandomDungeon();
                expect(dungeon.id).not.toBe('test_cave');
            }
        });

        it('should include user dungeons in random selection', () => {
            // Add a user dungeon with a distinctive ID
            const userDungeon: DungeonTemplate = {
                id: 'user_test_random',
                name: 'User Random Test',
                description: 'Test',
                baseDifficulty: 'easy',
                tileSet: 'cave',
                lootBias: { primarySlots: ['weapon'], description: 'Test' },
                rooms: [{
                    id: 'entry',
                    type: 'entry',
                    width: 11,
                    height: 7,
                    layout: ['###########', '#....P....#', '###########'],
                    doors: {},
                }],
            };
            registerUserDungeons([userDungeon]);

            // Run many times - user dungeon should appear sometimes
            const selectedIds = new Set<string>();
            for (let i = 0; i < 100; i++) {
                selectedIds.add(getRandomDungeon().id);
            }

            expect(selectedIds.has('user_test_random')).toBe(true);
        });
    });

    describe('Dungeon Data Integrity', () => {
        it('TEST_CAVE should be an easy cave dungeon with 3 rooms', () => {
            expect(TEST_CAVE.id).toBe('test_cave');
            expect(TEST_CAVE.baseDifficulty).toBe('easy');
            expect(TEST_CAVE.tileSet).toBe('cave');
            expect(TEST_CAVE.rooms.length).toBe(3);
        });

        it('GOBLIN_CAVE should be an easy cave dungeon with 5 rooms', () => {
            expect(GOBLIN_CAVE.id).toBe('goblin_cave');
            expect(GOBLIN_CAVE.baseDifficulty).toBe('easy');
            expect(GOBLIN_CAVE.tileSet).toBe('cave');
            expect(GOBLIN_CAVE.rooms.length).toBe(5);
        });

        it('FOREST_RUINS should be a medium forest dungeon with 8 rooms', () => {
            expect(FOREST_RUINS.id).toBe('forest_ruins');
            expect(FOREST_RUINS.baseDifficulty).toBe('medium');
            expect(FOREST_RUINS.tileSet).toBe('forest');
            expect(FOREST_RUINS.rooms.length).toBe(8);
        });

        it('CASTLE_CRYPT should be a medium dungeon with 10 rooms', () => {
            expect(CASTLE_CRYPT.id).toBe('castle_crypt');
            expect(CASTLE_CRYPT.baseDifficulty).toBe('medium');
            expect(CASTLE_CRYPT.tileSet).toBe('dungeon');
            expect(CASTLE_CRYPT.rooms.length).toBe(10);
        });

        it('BANDIT_STRONGHOLD should be a hard castle dungeon with 20 rooms', () => {
            expect(BANDIT_STRONGHOLD.id).toBe('bandit_stronghold');
            expect(BANDIT_STRONGHOLD.baseDifficulty).toBe('hard');
            expect(BANDIT_STRONGHOLD.tileSet).toBe('castle');
            expect(BANDIT_STRONGHOLD.rooms.length).toBe(20);
        });

        it('THORNWOOD_LABYRINTH should be a hard forest dungeon with 20 rooms', () => {
            expect(THORNWOOD_LABYRINTH.id).toBe('thornwood_labyrinth');
            expect(THORNWOOD_LABYRINTH.baseDifficulty).toBe('hard');
            expect(THORNWOOD_LABYRINTH.tileSet).toBe('forest');
            expect(THORNWOOD_LABYRINTH.rooms.length).toBe(20);
        });

        it('every room should have an entry room', () => {
            const all = getAllDungeonTemplates();
            for (const dungeon of all) {
                const entryRoom = dungeon.rooms.find((r: { type: string }) => r.type === 'entry');
                expect(entryRoom).toBeDefined();
            }
        });
    });
});
