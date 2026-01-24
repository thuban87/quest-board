/**
 * Gear Migration Tests
 * 
 * Phase 3A: Tests for character schema v1 to v2 migration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    migrateCharacterV1toV2,
    migrateEquippedGear,
    calculateMaxHP,
    calculateMaxMana,
    CHARACTER_SCHEMA_VERSION,
} from '../src/models/Character';
import { GearSlot, ALL_GEAR_SLOTS } from '../src/models/Gear';

// ============================================
// Test Data: Mock v1 Character
// ============================================

function createMockV1Character() {
    return {
        schemaVersion: 1,
        name: 'Test Hero',
        class: 'warrior',
        secondaryClass: null,
        level: 10,
        totalXP: 5000,
        spriteVersion: 1,
        appearance: {
            skinTone: 'light',
            hairStyle: 'short',
            hairColor: 'brown',
            accessory: 'none',
            outfitPrimary: '#dc3545',
            outfitSecondary: '#ffc107',
        },
        equippedGear: [], // Old format: empty array
        trainingXP: 1000,
        trainingLevel: 5,
        isTrainingMode: false,
        baseStats: {
            strength: 12,
            intelligence: 10,
            wisdom: 10,
            constitution: 14, // Warrior has +2 CON, +2 STR
            dexterity: 10,
            charisma: 10,
        },
        statBonuses: {
            strength: 2,
            intelligence: 0,
            wisdom: 0,
            constitution: 1,
            dexterity: 0,
            charisma: 0,
        },
        categoryXPAccumulator: {},
        currentStreak: 5,
        highestStreak: 10,
        lastQuestCompletionDate: '2026-01-23',
        shieldUsedThisWeek: false,
        createdDate: '2026-01-01T00:00:00.000Z',
        lastModified: '2026-01-23T00:00:00.000Z',
        tasksCompletedToday: 3,
        lastTaskDate: '2026-01-23',
        activePowerUps: [],
    };
}

// ============================================
// migrateEquippedGear Tests
// ============================================

describe('migrateEquippedGear', () => {
    it('should convert empty array to empty gear map', () => {
        const result = migrateEquippedGear([]);

        // All slots should be null
        for (const slot of ALL_GEAR_SLOTS) {
            expect(result[slot]).toBeNull();
        }
    });

    it('should convert null/undefined to empty gear map', () => {
        const resultNull = migrateEquippedGear(null);
        const resultUndefined = migrateEquippedGear(undefined);

        for (const slot of ALL_GEAR_SLOTS) {
            expect(resultNull[slot]).toBeNull();
            expect(resultUndefined[slot]).toBeNull();
        }
    });

    it('should preserve already-migrated gear map format', () => {
        const mockGearItem = {
            id: 'test-gear-1',
            name: 'Iron Sword',
            description: 'A sturdy iron sword',
            slot: 'weapon' as GearSlot,
            tier: 'adept' as const,
            level: 5,
            stats: { primaryStat: 'strength' as const, primaryValue: 10, attackPower: 15 },
            sellValue: 25,
            iconEmoji: '⚔️',
            source: 'quest' as const,
            acquiredAt: '2026-01-20T00:00:00.000Z',
        };

        const alreadyMigrated = {
            head: null,
            chest: null,
            legs: null,
            boots: null,
            weapon: mockGearItem,
            shield: null,
            accessory1: null,
            accessory2: null,
            accessory3: null,
        };

        const result = migrateEquippedGear(alreadyMigrated);

        expect(result.weapon).toEqual(mockGearItem);
        expect(result.head).toBeNull();
    });

    it('should handle malformed data gracefully', () => {
        // Random object that's not a valid format
        const result = migrateEquippedGear({ foo: 'bar' });

        for (const slot of ALL_GEAR_SLOTS) {
            expect(result[slot]).toBeNull();
        }
    });
});

// ============================================
// calculateMaxHP Tests
// ============================================

describe('calculateMaxHP', () => {
    it('should calculate HP for level 1 character with base stats', () => {
        const char = { baseStats: { constitution: 10 }, level: 1 } as any;
        // Formula: 50 + (CON * 5) + (Level * 10)
        // 50 + (10 * 5) + (1 * 10) = 50 + 50 + 10 = 110
        expect(calculateMaxHP(char)).toBe(110);
    });

    it('should calculate HP for level 10 warrior with high constitution', () => {
        const char = { baseStats: { constitution: 14 }, level: 10 } as any;
        // 50 + (14 * 5) + (10 * 10) = 50 + 70 + 100 = 220
        expect(calculateMaxHP(char)).toBe(220);
    });

    it('should handle missing baseStats with defaults', () => {
        const char = { level: 5 } as any;
        // Default CON = 10
        // 50 + (10 * 5) + (5 * 10) = 50 + 50 + 50 = 150
        expect(calculateMaxHP(char)).toBe(150);
    });

    it('should handle missing level with default 1', () => {
        const char = { baseStats: { constitution: 12 } } as any;
        // 50 + (12 * 5) + (1 * 10) = 50 + 60 + 10 = 120
        expect(calculateMaxHP(char)).toBe(120);
    });
});

// ============================================
// calculateMaxMana Tests
// ============================================

describe('calculateMaxMana', () => {
    it('should calculate Mana for level 1 character with base stats', () => {
        const char = { baseStats: { intelligence: 10 }, level: 1 } as any;
        // Formula: 20 + (INT * 3) + (Level * 5)
        // 20 + (10 * 3) + (1 * 5) = 20 + 30 + 5 = 55
        expect(calculateMaxMana(char)).toBe(55);
    });

    it('should calculate Mana for level 15 scholar with high intelligence', () => {
        const char = { baseStats: { intelligence: 16 }, level: 15 } as any;
        // 20 + (16 * 3) + (15 * 5) = 20 + 48 + 75 = 143
        expect(calculateMaxMana(char)).toBe(143);
    });
});

// ============================================
// migrateCharacterV1toV2 Tests
// ============================================

describe('migrateCharacterV1toV2', () => {
    it('should upgrade schema version to 2', () => {
        const v1Char = createMockV1Character();
        const result = migrateCharacterV1toV2(v1Char);

        expect(result.schemaVersion).toBe(2);
    });

    it('should preserve all existing v1 fields', () => {
        const v1Char = createMockV1Character();
        const result = migrateCharacterV1toV2(v1Char);

        expect(result.name).toBe('Test Hero');
        expect(result.class).toBe('warrior');
        expect(result.level).toBe(10);
        expect(result.totalXP).toBe(5000);
        expect(result.currentStreak).toBe(5);
        expect(result.highestStreak).toBe(10);
    });

    it('should add gold with default 0', () => {
        const v1Char = createMockV1Character();
        const result = migrateCharacterV1toV2(v1Char);

        expect(result.gold).toBe(0);
    });

    it('should add gearInventory as empty array', () => {
        const v1Char = createMockV1Character();
        const result = migrateCharacterV1toV2(v1Char);

        expect(result.gearInventory).toEqual([]);
    });

    it('should add inventoryLimit with default 50', () => {
        const v1Char = createMockV1Character();
        const result = migrateCharacterV1toV2(v1Char);

        expect(result.inventoryLimit).toBe(50);
    });

    it('should calculate and add HP fields', () => {
        const v1Char = createMockV1Character();
        const result = migrateCharacterV1toV2(v1Char);

        // Level 10, CON 14
        // maxHP = 50 + (14 * 5) + (10 * 10) = 220
        expect(result.maxHP).toBe(220);
        expect(result.currentHP).toBe(220);
    });

    it('should calculate and add Mana fields', () => {
        const v1Char = createMockV1Character();
        const result = migrateCharacterV1toV2(v1Char);

        // Level 10, INT 10
        // maxMana = 20 + (10 * 3) + (10 * 5) = 100
        expect(result.maxMana).toBe(100);
        expect(result.currentMana).toBe(100);
    });

    it('should add stamina fields', () => {
        const v1Char = createMockV1Character();
        const result = migrateCharacterV1toV2(v1Char);

        expect(result.stamina).toBe(10);
        expect(result.staminaGainedToday).toBe(0);
        expect(result.lastStaminaResetDate).toBeTruthy(); // Should be today's date
    });

    it('should add dungeonKeys with default 0', () => {
        const v1Char = createMockV1Character();
        const result = migrateCharacterV1toV2(v1Char);

        expect(result.dungeonKeys).toBe(0);
    });

    it('should convert equippedGear to new format', () => {
        const v1Char = createMockV1Character();
        const result = migrateCharacterV1toV2(v1Char);

        // Should be an object with all slots
        expect(result.equippedGear).toHaveProperty('head');
        expect(result.equippedGear).toHaveProperty('weapon');
        expect(result.equippedGear).toHaveProperty('accessory3');
    });

    it('should not re-migrate already v2 characters', () => {
        const v2Char = {
            ...createMockV1Character(),
            schemaVersion: 2,
            gold: 500,
            gearInventory: [],
            inventoryLimit: 75, // Custom limit
            currentHP: 200,
            maxHP: 200,
            currentMana: 80,
            maxMana: 80,
            stamina: 5,
            staminaGainedToday: 10,
            lastStaminaResetDate: '2026-01-22',
            dungeonKeys: 3,
            equippedGear: {
                head: null, chest: null, legs: null, boots: null,
                weapon: null, shield: null,
                accessory1: null, accessory2: null, accessory3: null,
            },
        };

        const result = migrateCharacterV1toV2(v2Char as any);

        // Should preserve existing values
        expect(result.gold).toBe(500);
        expect(result.inventoryLimit).toBe(75);
        expect(result.dungeonKeys).toBe(3);
        expect(result.currentHP).toBe(200);
    });

    it('should preserve existing gold if already set', () => {
        const v1WithGold = {
            ...createMockV1Character(),
            gold: 250, // Already has gold somehow
        };

        const result = migrateCharacterV1toV2(v1WithGold);

        expect(result.gold).toBe(250);
    });
});

// ============================================
// Edge Cases
// ============================================

describe('Migration Edge Cases', () => {
    it('should handle character with minimal data', () => {
        const minimal = {
            schemaVersion: 1,
            name: 'Minimal',
            class: 'warrior',
        };

        const result = migrateCharacterV1toV2(minimal);

        expect(result.schemaVersion).toBe(2);
        expect(result.gold).toBe(0);
        expect(result.gearInventory).toEqual([]);
    });

    it('should handle character with null baseStats', () => {
        const noStats = {
            schemaVersion: 1,
            name: 'No Stats',
            class: 'warrior',
            level: 5,
            baseStats: null,
        };

        const result = migrateCharacterV1toV2(noStats as any);

        // Should use default CON 10 and INT 10
        // HP: 50 + (10*5) + (5*10) = 150
        // Mana: 20 + (10*3) + (5*5) = 75
        expect(result.maxHP).toBe(150);
        expect(result.maxMana).toBe(75);
    });
});
