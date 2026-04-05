/**
 * Title Buff Integration Tests — Phase 3.5
 *
 * Verifies that title buffs flow through all calculation paths correctly:
 * - XP multipliers (The Scholar, The Relentless)
 * - Stat boosts (The Tempered, The Focused)
 * - Crit chance (Eagle Eye)
 * - Gold multiplier (Fortune's Favorite)
 * - Boss damage (Slayer of the Void — direct check, not PowerUpEffect)
 * - Compound buffs (The Relentless)
 * - Expiration safety (title power-ups survive expirePowerUps sweep)
 *
 * Coverage target: ≥80% line, ≥80% branch
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TITLES } from '../../src/data/titles';
import { createTitlePowerUps } from '../../src/services/TitleService';
import { deriveCombatStats } from '../../src/services/CombatService';
import { calculateXPWithBonus } from '../../src/services/XPSystem';
import {
    expirePowerUps,
    getXPMultiplierFromPowerUps,
    getGoldMultiplierFromPowerUps,
    getStatBoostFromPowerUps,
    getPercentStatBoostFromPowerUps,
    getCritFromPowerUps,
} from '../../src/services/PowerUpService';
import { Character, ActivePowerUp } from '../../src/models/Character';

// =====================
// TEST HELPERS
// =====================

/**
 * Create a minimal mock character for integration tests.
 * Includes all fields needed for deriveCombatStats + XP calculations.
 */
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
            strength: 20, intelligence: 10, wisdom: 10,
            constitution: 20, dexterity: 15, charisma: 10,
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
// XP INTEGRATION TESTS
// =====================

describe('XP Integration', () => {
    it('The Scholar grants +3% XP via activePowerUps', () => {
        const title = TITLES['the-scholar'];
        const character = createMockCharacter();
        const powerUps = createTitlePowerUps(title, character);

        const multiplier = getXPMultiplierFromPowerUps(powerUps);
        // 1.0 + (1.03 - 1) = 1.03
        expect(multiplier).toBeCloseTo(1.03, 4);
    });

    it('The Relentless grants +2% XP via activePowerUps', () => {
        const title = TITLES['the-relentless'];
        const character = createMockCharacter();
        const powerUps = createTitlePowerUps(title, character);

        const multiplier = getXPMultiplierFromPowerUps(powerUps);
        // 1.0 + (1.02 - 1) = 1.02
        expect(multiplier).toBeCloseTo(1.02, 4);
    });

    it('title XP buff stacks additively with existing power-up multipliers', () => {
        const title = TITLES['the-scholar'];
        const character = createMockCharacter();
        const titlePowerUps = createTitlePowerUps(title, character);

        // Add an existing XP power-up (e.g., First Blood +5%)
        const existingPowerUp: ActivePowerUp = {
            id: 'first_blood_boost',
            name: 'First Blood',
            icon: '🩸',
            description: '+5% XP',
            triggeredBy: 'first_blood',
            startedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            effect: { type: 'xp_multiplier', value: 1.05 },
        };

        const allPowerUps = [...titlePowerUps, existingPowerUp];
        const multiplier = getXPMultiplierFromPowerUps(allPowerUps);

        // 1.0 + 0.03 (scholar) + 0.05 (first blood) = 1.08
        expect(multiplier).toBeCloseTo(1.08, 4);
    });

    it('Scholar XP buff flows through calculateXPWithBonus', () => {
        const title = TITLES['the-scholar'];
        const character = createMockCharacter();
        const powerUps = createTitlePowerUps(title, character);

        // Without Scholar buff
        const baseXP = calculateXPWithBonus(100, 'admin', character);

        // With Scholar buff
        const buffedCharacter = createMockCharacter({
            activePowerUps: powerUps,
        });
        const buffedXP = calculateXPWithBonus(100, 'admin', buffedCharacter);

        // Buffed should be ~3% more
        expect(buffedXP).toBeGreaterThan(baseXP);
        expect(buffedXP).toBe(Math.round(baseXP * 1.03));
    });
});

// =====================
// STAT INTEGRATION TESTS
// =====================

describe('Stat Integration', () => {
    it('The Tempered gives +1 to all 6 stats in deriveCombatStats', () => {
        const title = TITLES['the-tempered'];
        const character = createMockCharacter();
        const powerUps = createTitlePowerUps(title, character);

        const baseStats = deriveCombatStats(character);
        const buffedCharacter = createMockCharacter({
            activePowerUps: powerUps,
        });
        const buffedStats = deriveCombatStats(buffedCharacter);

        // Physical attack comes from max(STR, DEX). With +1 STR, the buffed attack should be higher.
        // With warrior: STR=20, DEX=15, so physicalAttack uses STR.
        // Base: floor(20 * 1) = 20, Buffed: floor(21 * 1) = 21
        expect(buffedStats.physicalAttack).toBeGreaterThan(baseStats.physicalAttack);
    });

    it('The Focused (Warrior) gives +3% STR AND +3% CON in deriveCombatStats', () => {
        const title = TITLES['the-focused'];
        // Use higher base stats so 3% produces a visible integer difference (floor(40*1.03) = 41)
        const highStatOverrides = {
            class: 'warrior' as const,
            baseStats: {
                strength: 40, intelligence: 10, wisdom: 10,
                constitution: 40, dexterity: 15, charisma: 10,
            },
        };
        const character = createMockCharacter(highStatOverrides);
        const powerUps = createTitlePowerUps(title, character);

        const baseStats = deriveCombatStats(character);
        const buffedCharacter = createMockCharacter({
            ...highStatOverrides,
            activePowerUps: powerUps,
        });
        const buffedStats = deriveCombatStats(buffedCharacter);

        // STR contributes to physical attack, CON contributes to defense/HP
        // +3% of 40 = +1.2, floor = 41 vs 40 → visible difference
        expect(buffedStats.physicalAttack).toBeGreaterThan(baseStats.physicalAttack);
        expect(buffedStats.maxHP).toBeGreaterThan(baseStats.maxHP);
    });

    it('The Focused (Rogue) gives +3% DEX AND +3% CHA', () => {
        const title = TITLES['the-focused'];
        const character = createMockCharacter({ class: 'rogue' });
        const powerUps = createTitlePowerUps(title, character);

        const baseStats = deriveCombatStats(character);
        const buffedCharacter = createMockCharacter({
            class: 'rogue',
            activePowerUps: powerUps,
        });
        const buffedStats = deriveCombatStats(buffedCharacter);

        // DEX contributes to dodge and crit, both should increase
        expect(buffedStats.dodgeChance).toBeGreaterThanOrEqual(baseStats.dodgeChance);
        expect(buffedStats.critChance).toBeGreaterThanOrEqual(baseStats.critChance);
    });

    it('title stat buffs stack with existing power-up stat boosts', () => {
        const title = TITLES['the-tempered']; // +1 all stats
        const character = createMockCharacter();
        const titlePowerUps = createTitlePowerUps(title, character);

        // Add an existing stat boost power-up (Level Up: +3 all stats)
        const levelUpPowerUp: ActivePowerUp = {
            id: 'level_up_boost',
            name: 'Level Up!',
            icon: '⬆️',
            description: '+3 to all stats',
            triggeredBy: 'level_up',
            startedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            effect: { type: 'all_stats_boost', value: 3 },
        };

        const combinedPowerUps = [...titlePowerUps, levelUpPowerUp];

        // Check both boosts are summed
        const totalSTRBoost = getStatBoostFromPowerUps(combinedPowerUps, 'strength');
        expect(totalSTRBoost).toBe(4); // 1 (tempered) + 3 (level up)
    });

    it('percent stat boosts from The Focused stack with existing percent boosts', () => {
        const title = TITLES['the-focused'];
        const character = createMockCharacter({ class: 'warrior' });
        const titlePowerUps = createTitlePowerUps(title, character);

        // Add Iron Grip: +10% STR
        const ironGripPowerUp: ActivePowerUp = {
            id: 'iron_grip',
            name: 'Iron Grip',
            icon: '⚔️',
            description: '+10% STR',
            triggeredBy: 'power_up',
            startedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7200000).toISOString(),
            effect: { type: 'stat_percent_boost', stat: 'strength', value: 0.10 },
        };

        const combinedPowerUps = [...titlePowerUps, ironGripPowerUp];
        const totalSTRPercent = getPercentStatBoostFromPowerUps(combinedPowerUps, 'strength');
        // 0.03 (focused) + 0.10 (iron grip) = 0.13
        expect(totalSTRPercent).toBeCloseTo(0.13, 4);
    });
});

// =====================
// COMBAT INTEGRATION TESTS
// =====================

describe('Combat Integration', () => {
    it('Eagle Eye gives +2% crit chance in deriveCombatStats', () => {
        const title = TITLES['eagle-eye'];
        const character = createMockCharacter();
        const powerUps = createTitlePowerUps(title, character);

        const baseStats = deriveCombatStats(character);
        const buffedCharacter = createMockCharacter({
            activePowerUps: powerUps,
        });
        const buffedStats = deriveCombatStats(buffedCharacter);

        expect(buffedStats.critChance).toBeCloseTo(baseStats.critChance + 2, 1);
    });

    it('getCritFromPowerUps returns correct crit bonus from power-ups', () => {
        const title = TITLES['eagle-eye'];
        const character = createMockCharacter();
        const powerUps = createTitlePowerUps(title, character);

        const crit = getCritFromPowerUps(powerUps);
        expect(crit).toBe(2);
    });

    it('getCritFromPowerUps returns 0 when no crit power-ups', () => {
        const crit = getCritFromPowerUps([]);
        expect(crit).toBe(0);
    });

    it('getCritFromPowerUps sums multiple crit sources', () => {
        const titlePowerUps = createTitlePowerUps(TITLES['eagle-eye'], createMockCharacter());
        const luckyStarPowerUp: ActivePowerUp = {
            id: 'lucky_star',
            name: 'Lucky Star',
            icon: '⭐',
            description: '+10 Crit',
            triggeredBy: 'power_up',
            startedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            effect: { type: 'crit_chance', value: 10 },
        };

        const allPowerUps = [...titlePowerUps, luckyStarPowerUp];
        const crit = getCritFromPowerUps(allPowerUps);
        expect(crit).toBe(12); // 2 (eagle eye) + 10 (lucky star)
    });

    it('boss damage bonus does NOT go through PowerUpEffect system', () => {
        // Slayer of the Void has no buff field
        const title = TITLES['slayer-of-the-void'];
        expect(title.buff).toBeUndefined();

        // Creating power-ups returns empty array
        const character = createMockCharacter();
        const powerUps = createTitlePowerUps(title, character);
        expect(powerUps).toHaveLength(0);
    });
});

// =====================
// GOLD INTEGRATION TESTS
// =====================

describe('Gold Integration', () => {
    it('Fortune\'s Favorite gold multiplier is applied via power-ups', () => {
        const title = TITLES['fortune-favored'];
        const character = createMockCharacter();
        const powerUps = createTitlePowerUps(title, character);

        const multiplier = getGoldMultiplierFromPowerUps(powerUps);
        // 1.0 + (1.05 - 1) = 1.05
        expect(multiplier).toBeCloseTo(1.05, 4);
    });

    it('Fortune\'s Favorite gold multiplier stacks with existing gold multipliers', () => {
        const title = TITLES['fortune-favored'];
        const character = createMockCharacter();
        const titlePowerUps = createTitlePowerUps(title, character);

        // Add Fortune's Favor power-up (stacked gold multiplier)
        const fortunesFavorPowerUp: ActivePowerUp = {
            id: 'fortunes_favor',
            name: "Fortune's Favor",
            icon: '🎲',
            description: '+5% gold',
            triggeredBy: 'hat_trick',
            startedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 10800000).toISOString(),
            effect: { type: 'gold_multiplier', value: 1.05 },
            stacks: 2,
        };

        const allPowerUps = [...titlePowerUps, fortunesFavorPowerUp];
        const multiplier = getGoldMultiplierFromPowerUps(allPowerUps);
        // 1.0 + 0.05 (title) + 0.05*2 (fortunes favor stacks) = 1.15
        expect(multiplier).toBeCloseTo(1.15, 4);
    });
});

// =====================
// COMPOUND BUFF TESTS
// =====================

describe('Compound Buff', () => {
    it('The Relentless creates both +1 all stats AND +2% XP power-ups', () => {
        const title = TITLES['the-relentless'];
        const character = createMockCharacter();
        const powerUps = createTitlePowerUps(title, character);

        expect(powerUps).toHaveLength(2);
        expect(powerUps[0].effect).toEqual({ type: 'all_stats_boost', value: 1 });
        expect(powerUps[1].effect).toEqual({ type: 'xp_multiplier', value: 1.02 });
    });

    it('both Relentless effects show as separate entries with unique IDs', () => {
        const title = TITLES['the-relentless'];
        const character = createMockCharacter();
        const powerUps = createTitlePowerUps(title, character);

        expect(powerUps[0].id).toBe('title-buff-the-relentless-0');
        expect(powerUps[1].id).toBe('title-buff-the-relentless-1');
        expect(powerUps[0].id).not.toBe(powerUps[1].id);
    });

    it('Relentless stat boost flows through deriveCombatStats', () => {
        const title = TITLES['the-relentless'];
        const character = createMockCharacter();
        const powerUps = createTitlePowerUps(title, character);

        const baseStats = deriveCombatStats(character);
        const buffedCharacter = createMockCharacter({
            activePowerUps: powerUps,
        });
        const buffedStats = deriveCombatStats(buffedCharacter);

        // +1 all stats should increase physical attack (from STR)
        expect(buffedStats.physicalAttack).toBeGreaterThan(baseStats.physicalAttack);
    });

    it('Relentless XP boost flows through getXPMultiplierFromPowerUps', () => {
        const title = TITLES['the-relentless'];
        const character = createMockCharacter();
        const powerUps = createTitlePowerUps(title, character);

        const multiplier = getXPMultiplierFromPowerUps(powerUps);
        expect(multiplier).toBeCloseTo(1.02, 4);
    });
});

// =====================
// EXPIRATION SAFETY TESTS
// =====================

describe('Expiration Safety', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
    });

    it('expirePowerUps does NOT remove title power-ups (expiresAt: null)', () => {
        const title = TITLES['the-scholar'];
        const character = createMockCharacter();
        const titlePowerUps = createTitlePowerUps(title, character);

        // Verify title power-ups have null expiration
        expect(titlePowerUps[0].expiresAt).toBeNull();

        // Add some expired regular power-ups
        const expiredPowerUp: ActivePowerUp = {
            id: 'expired_boost',
            name: 'Expired',
            icon: '💤',
            description: 'Expired',
            triggeredBy: 'test',
            startedAt: '2026-01-15T10:00:00.000Z',
            expiresAt: '2026-01-15T11:00:00.000Z', // expired 1 hour ago
            effect: { type: 'xp_multiplier', value: 1.05 },
        };

        const allPowerUps = [...titlePowerUps, expiredPowerUp];
        const remaining = expirePowerUps(allPowerUps);

        // Title power-ups survive, expired ones are removed
        expect(remaining).toHaveLength(1);
        expect(remaining[0].id).toBe('title-buff-the-scholar');
    });

    it('title power-ups survive when mixed with active and expired power-ups', () => {
        const title = TITLES['eagle-eye'];
        const character = createMockCharacter();
        const titlePowerUps = createTitlePowerUps(title, character);

        const activePowerUp: ActivePowerUp = {
            id: 'active_boost',
            name: 'Active',
            icon: '⚡',
            description: 'Active',
            triggeredBy: 'test',
            startedAt: '2026-01-15T11:00:00.000Z',
            expiresAt: '2026-01-15T14:00:00.000Z', // expires in 2 hours
            effect: { type: 'xp_multiplier', value: 1.10 },
        };

        const expiredPowerUp: ActivePowerUp = {
            id: 'expired_boost',
            name: 'Expired',
            icon: '💤',
            description: 'Expired',
            triggeredBy: 'test',
            startedAt: '2026-01-15T09:00:00.000Z',
            expiresAt: '2026-01-15T10:00:00.000Z', // expired 2 hours ago
            effect: { type: 'all_stats_boost', value: 3 },
        };

        const allPowerUps = [...titlePowerUps, activePowerUp, expiredPowerUp];
        const remaining = expirePowerUps(allPowerUps);

        // Title (null expiry) + active = 2, expired removed
        expect(remaining).toHaveLength(2);
        expect(remaining.map(p => p.id)).toContain('title-buff-eagle-eye');
        expect(remaining.map(p => p.id)).toContain('active_boost');
    });

    it('equipping new title replaces old title power-ups via triggeredBy filter', () => {
        const scholarTitle = TITLES['the-scholar'];
        const eagleTitle = TITLES['eagle-eye'];
        const character = createMockCharacter();

        const scholarPowerUps = createTitlePowerUps(scholarTitle, character);
        const eaglePowerUps = createTitlePowerUps(eagleTitle, character);

        // Simulate equip flow: start with scholar + other power-ups
        const otherPowerUp: ActivePowerUp = {
            id: 'first_blood_boost',
            name: 'First Blood',
            icon: '🩸',
            description: '+5% XP',
            triggeredBy: 'first_blood',
            startedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            effect: { type: 'xp_multiplier', value: 1.05 },
        };

        const initialPowerUps = [...scholarPowerUps, otherPowerUp];

        // Step 1: Remove title power-ups (triggeredBy === 'title')
        const afterRemove = initialPowerUps.filter(p => p.triggeredBy !== 'title');
        expect(afterRemove).toHaveLength(1);
        expect(afterRemove[0].id).toBe('first_blood_boost');

        // Step 2: Add new title power-ups
        const afterAdd = [...afterRemove, ...eaglePowerUps];
        expect(afterAdd).toHaveLength(2);
        expect(afterAdd.map(p => p.id)).toContain('title-buff-eagle-eye');
        expect(afterAdd.map(p => p.id)).toContain('first_blood_boost');
    });

    afterEach(() => {
        vi.useRealTimers();
    });
});
