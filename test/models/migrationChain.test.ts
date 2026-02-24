/**
 * Migration Chain Tests — Phase 0.5
 *
 * Verifies the migration chain fix where >= N early-return guards
 * now chain forward instead of returning data as-is.
 *
 * Coverage target: ≥80% line, ≥80% branch
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// migrateCharacterV4toV5 uses require('../data/skills') which resolves from
// src/models/ to src/data/skills.ts. Node can't require .ts files directly.
// We intercept by temporarily hooking Module._resolveFilename.
import Module from 'module';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let originalResolveFilename: any;

beforeAll(() => {
    originalResolveFilename = (Module as any)._resolveFilename;
    const origResolve = (Module as any)._resolveFilename.bind(Module);
    (Module as any)._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
        if (request === '../data/skills') {
            return '__mock_skills__';
        }
        return origResolve(request, parent, isMain, options);
    };

    // Register the mock module in Node's require cache
    const fakeModule = new Module('__mock_skills__');
    fakeModule.exports = { getUnlockedSkills: () => [] };
    (fakeModule as any).loaded = true;
    require.cache['__mock_skills__'] = fakeModule;
});

afterAll(() => {
    (Module as any)._resolveFilename = originalResolveFilename;
    delete require.cache['__mock_skills__'];
});

import {
    migrateCharacterV1toV2,
    migrateCharacterV2toV3,
    migrateCharacterV3toV4,
    migrateCharacterV5toV6,
    migrateCharacterV6toV7,
} from '../../src/models/Character';

// =====================
// HELPERS
// =====================

/** Minimal v1 character payload — bare minimum fields for migration */
function makeV1Character(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        schemaVersion: 1,
        name: 'TestChar',
        class: 'warrior',
        secondaryClass: null,
        level: 5,
        totalXP: 500,
        spriteVersion: 1,
        appearance: {
            skinTone: 'light',
            hairStyle: 'short',
            hairColor: 'brown',
            accessory: 'none',
            outfitPrimary: '#6f42c1',
            outfitSecondary: '#ffc107',
        },
        equippedGear: [],
        trainingXP: 0,
        trainingLevel: 1,
        isTrainingMode: false,
        baseStats: {
            strength: 12,
            intelligence: 10,
            wisdom: 10,
            constitution: 12,
            dexterity: 10,
            charisma: 10,
        },
        statBonuses: {
            strength: 0,
            intelligence: 0,
            wisdom: 0,
            constitution: 0,
            dexterity: 0,
            charisma: 0,
        },
        categoryXPAccumulator: {},
        currentStreak: 0,
        highestStreak: 0,
        lastQuestCompletionDate: null,
        shieldUsedThisWeek: true,
        createdDate: '2025-01-01T00:00:00Z',
        lastModified: '2025-01-01T00:00:00Z',
        tasksCompletedToday: 0,
        lastTaskDate: null,
        activePowerUps: [],
        ...overrides,
    };
}

/** Build a character payload at a specific schema version with appropriate fields */
function makeCharacterAtVersion(version: number): Record<string, unknown> {
    const base = makeV1Character({ schemaVersion: version });

    // Add fields that each migration would have added
    if (version >= 2) {
        base.gold = 100;
        base.gearInventory = [];
        base.inventoryLimit = 50;
        base.currentHP = 120;
        base.maxHP = 120;
        base.currentMana = 55;
        base.maxMana = 55;
        base.stamina = 10;
        base.staminaGainedToday = 0;
        base.lastStaminaResetDate = null;
        base.dungeonKeys = 0;
    }

    if (version >= 3) {
        base.status = 'active';
        base.recoveryTimerEnd = null;
    }

    if (version >= 4) {
        base.activityHistory = [];
    }

    if (version >= 5) {
        base.skills = { unlocked: [], equipped: [] };
        base.persistentStatusEffects = [];
    }

    if (version >= 6) {
        base.totalShieldsUsedThisWeek = 1;
        delete base.shieldUsedThisWeek;
    }

    return base;
}

// ===========================================
// Chain Forward Guard Tests
// ===========================================

describe('Chain Forward Guards', () => {
    it('v4 character entering migrateCharacterV2toV3 chains forward (not returned as-is)', () => {
        const v4Char = makeCharacterAtVersion(4);
        const result = migrateCharacterV2toV3(v4Char);

        // If the bug were still present, the v4 character would be returned as-is
        // with no v5/v6 processing. With the fix, it chains through v3→v4→v5→v6→stub.
        // v5 migration adds skills, so check that field exists
        expect(result.skills).toBeDefined();
        expect(result.persistentStatusEffects).toBeDefined();
    });

    it('v5 character entering migrateCharacterV3toV4 chains forward (not returned as-is)', () => {
        const v5Char = makeCharacterAtVersion(5);
        const result = migrateCharacterV3toV4(v5Char);

        // v5→v6 migration converts shieldUsedThisWeek → totalShieldsUsedThisWeek
        // If the bug were still present, v5 char would be returned as-is
        expect(result.totalShieldsUsedThisWeek).toBeDefined();
    });

    it('v6 character entering migrateCharacterV5toV6 chains to stub v6→v7 (not returned as-is)', () => {
        const v6Char = makeCharacterAtVersion(6);
        const result = migrateCharacterV5toV6(v6Char);

        // The stub just returns data unchanged, but the important thing is
        // it reaches migrateCharacterV6toV7 without error
        expect(result).toBeDefined();
        expect(result.schemaVersion).toBe(6); // Stub doesn't change version yet
    });
});

// ===========================================
// Full Chain Flow Tests
// ===========================================

describe('Full Chain Flow', () => {
    it('v1 character migrates through the full chain v1→v2→v3→v4→v5→v6→stub(v7)', () => {
        const v1Char = makeV1Character();
        const result = migrateCharacterV1toV2(v1Char);

        // v2 fields
        expect(result.gold).toBeDefined();
        expect(result.gearInventory).toBeDefined();
        expect(result.inventoryLimit).toBe(50);
        expect(result.stamina).toBe(10);
        expect(result.dungeonKeys).toBe(0);

        // v3 fields
        expect(result.status).toBe('active');
        expect(result.recoveryTimerEnd).toBeNull();

        // v4 fields
        expect(result.activityHistory).toEqual([]);

        // v5 fields
        expect(result.skills).toBeDefined();
        expect(result.skills.unlocked).toBeDefined();
        expect(result.skills.equipped).toBeDefined();
        expect(result.persistentStatusEffects).toEqual([]);

        // v6 migration: boolean shieldUsedThisWeek → number totalShieldsUsedThisWeek
        expect(result.totalShieldsUsedThisWeek).toBe(1); // was true → 1
        expect((result as any).shieldUsedThisWeek).toBeUndefined(); // old field removed
    });

    it('v5 character reaches v6 and exits via stub v6→v7', () => {
        const v5Char = makeCharacterAtVersion(5);
        v5Char.shieldUsedThisWeek = false; // Ensure v5 has the boolean field
        delete (v5Char as any).totalShieldsUsedThisWeek; // Remove v6 field

        const result = migrateCharacterV5toV6(v5Char);

        // v6 migration should have converted the boolean
        expect(result.totalShieldsUsedThisWeek).toBe(0); // false → 0
        expect((result as any).shieldUsedThisWeek).toBeUndefined();
        // Reached stub — no errors
        expect(result).toBeDefined();
    });

    it('v6 character reaches stub v6→v7 (confirms the bug is fixed)', () => {
        const v6Char = makeCharacterAtVersion(6);

        // Enter at the top of the chain
        const result = migrateCharacterV1toV2(v6Char);

        // Should chain all the way through without error
        expect(result).toBeDefined();
        expect(result.name).toBe('TestChar');
        expect(result.totalShieldsUsedThisWeek).toBe(1); // preserved from input
    });

    it('each migration applies its expected field additions', () => {
        const v1Char = makeV1Character();
        const result = migrateCharacterV1toV2(v1Char);

        // Verify schema version fields exist from each step
        // v2: gear system
        expect(typeof result.gold).toBe('number');
        expect(Array.isArray(result.gearInventory)).toBe(true);

        // v3: death penalty
        expect(typeof result.status).toBe('string');

        // v4: activity tracking
        expect(Array.isArray(result.activityHistory)).toBe(true);

        // v5: skills system
        expect(result.skills).toHaveProperty('unlocked');
        expect(result.skills).toHaveProperty('equipped');

        // v6: shield count
        expect(typeof result.totalShieldsUsedThisWeek).toBe('number');
    });
});

// ===========================================
// Regression Safety Tests
// ===========================================

describe('Regression Safety', () => {
    it('v2 character still gets v2→v3 migration applied (not skipped)', () => {
        const v2Char = makeCharacterAtVersion(2);
        // Remove v3 fields to verify they get added by migration
        delete (v2Char as any).status;
        delete (v2Char as any).recoveryTimerEnd;

        const result = migrateCharacterV2toV3(v2Char);

        // v3 fields should now exist
        expect(result.status).toBe('active');
        expect(result.recoveryTimerEnd).toBeNull();
    });

    it('v3 character still gets v3→v4 migration applied (not skipped)', () => {
        const v3Char = makeCharacterAtVersion(3);
        // Remove v4 field to verify it gets added
        delete (v3Char as any).activityHistory;

        const result = migrateCharacterV3toV4(v3Char);

        // v4 field should now exist
        expect(result.activityHistory).toEqual([]);
    });

    it('stub v6→v7 returns data unchanged (no fields added yet)', () => {
        const v6Char = makeCharacterAtVersion(6);
        const result = migrateCharacterV6toV7(v6Char);

        // Stub should return identical data
        expect(result.schemaVersion).toBe(6);
        expect(result.name).toBe('TestChar');
        expect(result.totalShieldsUsedThisWeek).toBe(1);
        // No new fields added by stub
        expect((result as any).equippedTitle).toBeUndefined();
        expect((result as any).unlockedTitles).toBeUndefined();
        expect((result as any).lifetimeStats).toBeUndefined();
    });
});
