/**
 * Title Data & Migration Tests — Phase 1.5
 *
 * Tests title data integrity, achievement→title reference integrity,
 * and v6→v7 schema migration with lifetimeStats backfill.
 *
 * Coverage target: ≥80% line, ≥80% branch
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

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

import { TITLES, STARTING_TITLE_ID } from '../../src/data/titles';
import { getTitleById, isBuffTitle, TitleRarity } from '../../src/models/Title';
import { DEFAULT_ACHIEVEMENTS } from '../../src/data/achievements';
import {
    migrateCharacterV6toV7,
    migrateCharacterV1toV2,
} from '../../src/models/Character';

// =====================
// HELPERS
// =====================

const VALID_RARITIES: TitleRarity[] = ['common', 'rare', 'epic', 'legendary'];

const VALID_POWER_UP_TYPES = [
    'xp_multiplier',
    'xp_category_multiplier',
    'stat_boost',
    'stat_percent_boost',
    'all_stats_percent_boost',
    'all_stats_boost',
    'crit_chance',
    'gold_multiplier',
    'streak_shield',
    'class_perk',
];

/** Build a minimal v6 character payload for migration testing */
function makeV6Character(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        schemaVersion: 6,
        name: 'TestChar',
        class: 'warrior',
        secondaryClass: null,
        level: 15,
        totalXP: 10000,
        spriteVersion: 1,
        appearance: {
            skinTone: 'light',
            hairStyle: 'short',
            hairColor: 'brown',
            accessory: 'none',
            outfitPrimary: '#ff0000',
            outfitSecondary: '#ffc107',
        },
        equippedGear: {},
        trainingXP: 0,
        trainingLevel: 1,
        isTrainingMode: false,
        baseStats: {
            strength: 12, intelligence: 10, wisdom: 10,
            constitution: 12, dexterity: 10, charisma: 10,
        },
        statBonuses: {
            strength: 0, intelligence: 0, wisdom: 0,
            constitution: 0, dexterity: 0, charisma: 0,
        },
        categoryXPAccumulator: {},
        currentStreak: 0,
        highestStreak: 0,
        lastQuestCompletionDate: null,
        totalShieldsUsedThisWeek: 0,
        createdDate: '2025-01-01T00:00:00Z',
        lastModified: '2025-01-01T00:00:00Z',
        tasksCompletedToday: 0,
        lastTaskDate: null,
        activePowerUps: [],
        gold: 100,
        gearInventory: [],
        inventoryLimit: 50,
        currentHP: 500,
        maxHP: 500,
        currentMana: 100,
        maxMana: 100,
        stamina: 10,
        staminaGainedToday: 0,
        lastStaminaResetDate: null,
        dungeonKeys: 0,
        dungeonExplorationHistory: {},
        status: 'active',
        recoveryTimerEnd: null,
        activityHistory: [],
        skills: { unlocked: [], equipped: [] },
        persistentStatusEffects: [],
        triggerCooldowns: {},
        ...overrides,
    };
}

// ===========================================
// Title Data Integrity
// ===========================================

describe('Title Data Integrity', () => {
    const titleEntries = Object.entries(TITLES);

    it('every title has a valid id matching its key', () => {
        for (const [key, title] of titleEntries) {
            expect(title.id).toBe(key);
        }
    });

    it('every title has a non-empty name, description, and emoji', () => {
        for (const [, title] of titleEntries) {
            expect(title.name.length).toBeGreaterThan(0);
            expect(title.description.length).toBeGreaterThan(0);
            expect(title.emoji.length).toBeGreaterThan(0);
        }
    });

    it('every title has a non-empty unlockCondition', () => {
        for (const [, title] of titleEntries) {
            expect(title.unlockCondition.length).toBeGreaterThan(0);
        }
    });

    it('every title rarity is valid', () => {
        for (const [, title] of titleEntries) {
            expect(VALID_RARITIES).toContain(title.rarity);
        }
    });

    it('buff titles have valid PowerUpEffect types', () => {
        for (const [, title] of titleEntries) {
            if (!title.buff) continue;

            const effects = Array.isArray(title.buff.effect)
                ? title.buff.effect
                : [title.buff.effect];

            for (const effect of effects) {
                expect(VALID_POWER_UP_TYPES).toContain(effect.type);
            }
        }
    });

    it('buff titles have a non-empty label', () => {
        for (const [, title] of titleEntries) {
            if (!title.buff) continue;
            expect(title.buff.label.length).toBeGreaterThan(0);
        }
    });

    it('registry has exactly 12 titles', () => {
        expect(titleEntries.length).toBe(12);
    });

    it('STARTING_TITLE_ID points to a valid title', () => {
        expect(TITLES[STARTING_TITLE_ID]).toBeDefined();
        expect(TITLES[STARTING_TITLE_ID].id).toBe('the-novice');
    });
});

// ===========================================
// Helper Functions
// ===========================================

describe('Title Helper Functions', () => {
    it('getTitleById() returns correct title', () => {
        const title = getTitleById('the-novice');
        expect(title).toBeDefined();
        expect(title!.name).toBe('The Novice');
    });

    it('getTitleById() returns undefined for nonexistent ID', () => {
        const title = getTitleById('nonexistent-title-id');
        expect(title).toBeUndefined();
    });

    it('isBuffTitle() returns true for buff titles', () => {
        expect(isBuffTitle(TITLES['the-scholar'])).toBe(true);
        expect(isBuffTitle(TITLES['fortune-favored'])).toBe(true);
        expect(isBuffTitle(TITLES['eagle-eye'])).toBe(true);
        expect(isBuffTitle(TITLES['the-tempered'])).toBe(true);
        expect(isBuffTitle(TITLES['the-relentless'])).toBe(true);
        expect(isBuffTitle(TITLES['the-focused'])).toBe(true);
    });

    it('isBuffTitle() returns false for cosmetic titles', () => {
        expect(isBuffTitle(TITLES['the-novice'])).toBe(false);
        expect(isBuffTitle(TITLES['questrunner'])).toBe(false);
        expect(isBuffTitle(TITLES['streak-keeper'])).toBe(false);
        expect(isBuffTitle(TITLES['dungeon-delver'])).toBe(false);
        expect(isBuffTitle(TITLES['the-dedicated'])).toBe(false);
    });

    it('isBuffTitle() returns false for slayer-of-the-void (no PowerUpEffect)', () => {
        expect(isBuffTitle(TITLES['slayer-of-the-void'])).toBe(false);
    });
});

// ===========================================
// Achievement-Title Reference Integrity
// ===========================================

describe('Achievement-Title Reference Integrity', () => {
    const achievementsWithTitles = DEFAULT_ACHIEVEMENTS.filter(a => a.grantedTitleId);

    it('every grantedTitleId points to a valid title in TITLES', () => {
        for (const achievement of achievementsWithTitles) {
            expect(
                TITLES[achievement.grantedTitleId!],
                `Achievement "${achievement.id}" references unknown title "${achievement.grantedTitleId}"`
            ).toBeDefined();
        }
    });

    it('no duplicate grantedTitleId across achievements (1:1 mapping)', () => {
        const titleIds = achievementsWithTitles.map(a => a.grantedTitleId!);
        const unique = new Set(titleIds);
        expect(unique.size).toBe(titleIds.length);
    });

    it('exactly 11 achievements have grantedTitleId (the-novice is auto-granted)', () => {
        // 12 titles total, but the-novice is auto-granted (no achievement)
        expect(achievementsWithTitles.length).toBe(11);
    });

    it('every title except the-novice maps to an achievement', () => {
        const grantedIds = new Set(achievementsWithTitles.map(a => a.grantedTitleId));
        for (const [titleId] of Object.entries(TITLES)) {
            if (titleId === 'the-novice') continue;
            expect(
                grantedIds.has(titleId),
                `Title "${titleId}" has no achievement mapping`
            ).toBe(true);
        }
    });
});

// ===========================================
// Schema Migration v6 → v7
// ===========================================

describe('Schema Migration v6→v7', () => {
    it('v6 payload migrates to v7 with correct defaults', () => {
        const v6Char = makeV6Character();
        const result = migrateCharacterV6toV7(v6Char);

        expect(result.schemaVersion).toBe(7);
        expect(result.equippedTitle).toBeNull();
        expect(result.unlockedTitles).toEqual(['the-novice']);
        expect(result.lifetimeStats).toEqual({
            questsCompleted: 0,
            battlesWon: 0,
            bossesDefeated: 0,
            dungeonsCompleted: 0,
            dungeonAttempts: 0,
            goldEarned: 0,
        });
    });

    it('v7 payload passes through untouched', () => {
        const v7Char = makeV6Character({
            schemaVersion: 7,
            equippedTitle: 'the-scholar',
            unlockedTitles: ['the-novice', 'the-scholar'],
            lifetimeStats: {
                questsCompleted: 42,
                battlesWon: 10,
                bossesDefeated: 2,
                dungeonsCompleted: 1,
                dungeonAttempts: 3,
                goldEarned: 500,
            },
        });
        const result = migrateCharacterV6toV7(v7Char);

        expect(result.schemaVersion).toBe(7);
        expect(result.equippedTitle).toBe('the-scholar');
        expect(result.unlockedTitles).toEqual(['the-novice', 'the-scholar']);
        expect(result.lifetimeStats.questsCompleted).toBe(42);
    });

    it('v5 payload chains through v5→v6→v7', () => {
        const v5Char = makeV6Character({
            schemaVersion: 5,
            shieldUsedThisWeek: true,
        });
        delete (v5Char as any).totalShieldsUsedThisWeek;

        const result = migrateCharacterV1toV2(v5Char);

        expect(result.schemaVersion).toBe(7);
        expect(result.equippedTitle).toBeNull();
        expect(result.unlockedTitles).toEqual(['the-novice']);
        expect(result.lifetimeStats).toBeDefined();
    });

    it('backfills lifetimeStats from activityHistory correctly', () => {
        const v6Char = makeV6Character({
            activityHistory: [
                { type: 'quest_complete', date: '2026-01-01', timestamp: '2026-01-01T10:00:00Z', xpGained: 50, goldGained: 10 },
                { type: 'quest_complete', date: '2026-01-02', timestamp: '2026-01-02T10:00:00Z', xpGained: 50, goldGained: 15 },
                { type: 'quest_complete', date: '2026-01-03', timestamp: '2026-01-03T10:00:00Z', xpGained: 50, goldGained: 0 },
                { type: 'quest_complete', date: '2026-01-04', timestamp: '2026-01-04T10:00:00Z', xpGained: 50, goldGained: 20 },
                { type: 'quest_complete', date: '2026-01-05', timestamp: '2026-01-05T10:00:00Z', xpGained: 50, goldGained: 5 },
                { type: 'bounty_victory', date: '2026-01-06', timestamp: '2026-01-06T10:00:00Z', xpGained: 100, goldGained: 30 },
                { type: 'bounty_victory', date: '2026-01-07', timestamp: '2026-01-07T10:00:00Z', xpGained: 100, goldGained: 25 },
                { type: 'bounty_victory', date: '2026-01-08', timestamp: '2026-01-08T10:00:00Z', xpGained: 100, goldGained: 0 },
                { type: 'dungeon_complete', date: '2026-01-09', timestamp: '2026-01-09T10:00:00Z', xpGained: 200, goldGained: 50 },
                { type: 'dungeon_complete', date: '2026-01-10', timestamp: '2026-01-10T10:00:00Z', xpGained: 200, goldGained: 40 },
            ],
        });

        const result = migrateCharacterV6toV7(v6Char);

        expect(result.lifetimeStats.questsCompleted).toBe(5);
        expect(result.lifetimeStats.battlesWon).toBe(3);
        expect(result.lifetimeStats.bossesDefeated).toBe(0); // Cannot determine retroactively
        expect(result.lifetimeStats.dungeonsCompleted).toBe(0); // Cannot distinguish completed vs attempted
        expect(result.lifetimeStats.dungeonAttempts).toBe(2);
        expect(result.lifetimeStats.goldEarned).toBe(10 + 15 + 20 + 5 + 30 + 25 + 50 + 40); // 195
    });

    it('backfills with empty activityHistory yields all-zero lifetimeStats', () => {
        const v6Char = makeV6Character({ activityHistory: [] });
        const result = migrateCharacterV6toV7(v6Char);

        expect(result.lifetimeStats).toEqual({
            questsCompleted: 0,
            battlesWon: 0,
            bossesDefeated: 0,
            dungeonsCompleted: 0,
            dungeonAttempts: 0,
            goldEarned: 0,
        });
    });

    it('backfills with missing activityHistory (undefined) yields all-zero lifetimeStats', () => {
        const v6Char = makeV6Character();
        delete (v6Char as any).activityHistory;
        const result = migrateCharacterV6toV7(v6Char);

        expect(result.lifetimeStats).toEqual({
            questsCompleted: 0,
            battlesWon: 0,
            bossesDefeated: 0,
            dungeonsCompleted: 0,
            dungeonAttempts: 0,
            goldEarned: 0,
        });
    });

    it('ignores bounty_defeat events in backfill counts', () => {
        const v6Char = makeV6Character({
            activityHistory: [
                { type: 'bounty_defeat', date: '2026-01-01', timestamp: '2026-01-01T10:00:00Z', xpGained: 0, goldGained: 0 },
                { type: 'bounty_victory', date: '2026-01-02', timestamp: '2026-01-02T10:00:00Z', xpGained: 100, goldGained: 30 },
            ],
        });

        const result = migrateCharacterV6toV7(v6Char);

        expect(result.lifetimeStats.battlesWon).toBe(1); // Only victories count
    });

    it('preserves existing character fields during migration', () => {
        const v6Char = makeV6Character({
            name: 'SpecialChar',
            level: 25,
            gold: 999,
            currentStreak: 7,
        });

        const result = migrateCharacterV6toV7(v6Char);

        expect(result.name).toBe('SpecialChar');
        expect(result.level).toBe(25);
        expect(result.gold).toBe(999);
        expect(result.currentStreak).toBe(7);
    });
});

// ===========================================
// Invalid Title Validation (data-level)
// ===========================================

describe('Invalid Title Validation', () => {
    it('getTitleById returns undefined for stale/invalid title ID', () => {
        expect(getTitleById('deleted-title-xyz')).toBeUndefined();
        expect(getTitleById('')).toBeUndefined();
    });
});
