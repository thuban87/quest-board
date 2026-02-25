/**
 * TitleService Tests — Phase 2.5
 *
 * Tests for TitleService methods: grantTitle, equipTitle, getUnlockedTitles,
 * getEquippedTitle, createTitlePowerUps.
 *
 * Coverage target: ≥80% line, ≥80% branch
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TITLES } from '../../src/data/titles';
import { createTitlePowerUps, getUnlockedTitles, getEquippedTitle } from '../../src/services/TitleService';
import { Character, CLASS_INFO } from '../../src/models/Character';

// =====================
// TEST HELPERS
// =====================

function createMockCharacter(overrides: Partial<Character> = {}): Character {
    return {
        schemaVersion: 7,
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
        equippedGear: {
            head: null, chest: null, legs: null, boots: null,
            weapon: null, shield: null,
            accessory1: null, accessory2: null, accessory3: null,
        },
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
        currentHP: 100,
        maxHP: 100,
        currentMana: 50,
        maxMana: 50,
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
        equippedTitle: null,
        unlockedTitles: ['the-novice'],
        lifetimeStats: {
            questsCompleted: 0,
            battlesWon: 0,
            bossesDefeated: 0,
            dungeonsCompleted: 0,
            dungeonAttempts: 0,
            goldEarned: 0,
        },
        ...overrides,
    } as Character;
}

// =====================
// createTitlePowerUps TESTS
// =====================

describe('createTitlePowerUps', () => {
    it('returns empty array for cosmetic title (no buff)', () => {
        const title = TITLES['the-novice'];
        const character = createMockCharacter();
        const result = createTitlePowerUps(title, character);
        expect(result).toEqual([]);
    });

    it('returns empty array for slayer-of-the-void (no buff field)', () => {
        const title = TITLES['slayer-of-the-void'];
        const character = createMockCharacter();
        const result = createTitlePowerUps(title, character);
        expect(result).toEqual([]);
    });

    it('creates single power-up for single-buff title (The Scholar)', () => {
        const title = TITLES['the-scholar'];
        const character = createMockCharacter();
        const result = createTitlePowerUps(title, character);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('title-buff-the-scholar');
        expect(result[0].triggeredBy).toBe('title');
        expect(result[0].expiresAt).toBeNull();
        expect(result[0].effect).toEqual({ type: 'xp_multiplier', value: 1.03 });
        expect(result[0].name).toBe('The Scholar');
        expect(result[0].icon).toBe('📚');
    });

    it('creates single power-up for Fortune\'s Favorite (gold_multiplier)', () => {
        const title = TITLES['fortune-favored'];
        const character = createMockCharacter();
        const result = createTitlePowerUps(title, character);

        expect(result).toHaveLength(1);
        expect(result[0].effect).toEqual({ type: 'gold_multiplier', value: 1.05 });
    });

    it('creates single power-up for Eagle Eye (crit_chance)', () => {
        const title = TITLES['eagle-eye'];
        const character = createMockCharacter();
        const result = createTitlePowerUps(title, character);

        expect(result).toHaveLength(1);
        expect(result[0].effect).toEqual({ type: 'crit_chance', value: 2 });
    });

    it('creates single power-up for The Tempered (all_stats_boost)', () => {
        const title = TITLES['the-tempered'];
        const character = createMockCharacter();
        const result = createTitlePowerUps(title, character);

        expect(result).toHaveLength(1);
        expect(result[0].effect).toEqual({ type: 'all_stats_boost', value: 1 });
    });

    // The Focused — class-specific primary stats
    it('creates two power-ups for The Focused based on warrior class', () => {
        const title = TITLES['the-focused'];
        const character = createMockCharacter({ class: 'warrior' });
        const result = createTitlePowerUps(title, character);

        expect(result).toHaveLength(2);
        // Warrior primary stats: strength, constitution
        expect(result[0].effect).toEqual({ type: 'stat_percent_boost', stat: 'strength', value: 0.03 });
        expect(result[1].effect).toEqual({ type: 'stat_percent_boost', stat: 'constitution', value: 0.03 });
        // Indexed IDs
        expect(result[0].id).toBe('title-buff-the-focused-0');
        expect(result[1].id).toBe('title-buff-the-focused-1');
    });

    it('creates correct power-ups for The Focused with scholar class', () => {
        const title = TITLES['the-focused'];
        const character = createMockCharacter({ class: 'scholar' });
        const result = createTitlePowerUps(title, character);

        expect(result).toHaveLength(2);
        // Scholar primary stats: intelligence, wisdom
        expect(result[0].effect).toEqual({ type: 'stat_percent_boost', stat: 'intelligence', value: 0.03 });
        expect(result[1].effect).toEqual({ type: 'stat_percent_boost', stat: 'wisdom', value: 0.03 });
    });

    it('creates correct power-ups for The Focused with rogue class', () => {
        const title = TITLES['the-focused'];
        const character = createMockCharacter({ class: 'rogue' });
        const result = createTitlePowerUps(title, character);

        expect(result).toHaveLength(2);
        // Rogue primary stats: dexterity, charisma
        expect(result[0].effect).toEqual({ type: 'stat_percent_boost', stat: 'dexterity', value: 0.03 });
        expect(result[1].effect).toEqual({ type: 'stat_percent_boost', stat: 'charisma', value: 0.03 });
    });

    // The Relentless — multi-buff title
    it('creates two power-ups for The Relentless (multi-buff)', () => {
        const title = TITLES['the-relentless'];
        const character = createMockCharacter();
        const result = createTitlePowerUps(title, character);

        expect(result).toHaveLength(2);
        expect(result[0].effect).toEqual({ type: 'all_stats_boost', value: 1 });
        expect(result[1].effect).toEqual({ type: 'xp_multiplier', value: 1.02 });
        expect(result[0].id).toBe('title-buff-the-relentless-0');
        expect(result[1].id).toBe('title-buff-the-relentless-1');
    });

    // Common properties
    it('all returned power-ups have triggeredBy: title and null expiresAt', () => {
        const buffTitles = Object.values(TITLES).filter(t => t.buff);

        for (const title of buffTitles) {
            const character = createMockCharacter();
            const result = createTitlePowerUps(title, character);
            for (const powerUp of result) {
                expect(powerUp.triggeredBy).toBe('title');
                expect(powerUp.expiresAt).toBeNull();
                expect(powerUp.startedAt).toBeTruthy();
            }
        }
    });

    // Covers all 7 classes for The Focused
    it('The Focused resolves correctly for all 7 classes', () => {
        const title = TITLES['the-focused'];
        const classes = Object.keys(CLASS_INFO) as (keyof typeof CLASS_INFO)[];

        for (const cls of classes) {
            const character = createMockCharacter({ class: cls });
            const result = createTitlePowerUps(title, character);

            expect(result).toHaveLength(2);
            const [stat1, stat2] = CLASS_INFO[cls].primaryStats;
            expect(result[0].effect).toEqual({ type: 'stat_percent_boost', stat: stat1, value: 0.03 });
            expect(result[1].effect).toEqual({ type: 'stat_percent_boost', stat: stat2, value: 0.03 });
        }
    });
});

// =====================
// getUnlockedTitles TESTS
// =====================

describe('getUnlockedTitles', () => {
    it('returns Title objects for unlocked IDs', () => {
        const character = createMockCharacter({
            unlockedTitles: ['the-novice', 'questrunner'],
        });

        const result = getUnlockedTitles(character);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('the-novice');
        expect(result[1].id).toBe('questrunner');
    });

    it('filters out invalid/stale title IDs', () => {
        const character = createMockCharacter({
            unlockedTitles: ['the-novice', 'deleted-title', 'questrunner'],
        });

        const result = getUnlockedTitles(character);

        expect(result).toHaveLength(2);
        expect(result.map(t => t.id)).toEqual(['the-novice', 'questrunner']);
    });

    it('returns empty array if no unlocked titles', () => {
        const character = createMockCharacter({
            unlockedTitles: [],
        });

        const result = getUnlockedTitles(character);
        expect(result).toEqual([]);
    });

    it('returns empty array if all IDs are invalid', () => {
        const character = createMockCharacter({
            unlockedTitles: ['fake-1', 'fake-2'],
        });

        const result = getUnlockedTitles(character);
        expect(result).toEqual([]);
    });
});

// =====================
// getEquippedTitle TESTS
// =====================

describe('getEquippedTitle', () => {
    it('returns null when no title equipped', () => {
        const character = createMockCharacter({ equippedTitle: null });
        const result = getEquippedTitle(character);
        expect(result).toBeNull();
    });

    it('returns Title object when valid title equipped', () => {
        const character = createMockCharacter({ equippedTitle: 'the-novice' });
        const result = getEquippedTitle(character);
        expect(result).not.toBeNull();
        expect(result!.id).toBe('the-novice');
        expect(result!.name).toBe('The Novice');
    });

    it('returns null for invalid equipped title ID', () => {
        const character = createMockCharacter({ equippedTitle: 'nonexistent' });
        const result = getEquippedTitle(character);
        expect(result).toBeNull();
    });
});
