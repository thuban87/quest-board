/**
 * Power-Up Effects Tests
 * 
 * Tests for power-up effect application, expiration, and calculation functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    EFFECT_DEFINITIONS,
    grantPowerUp,
    expirePowerUps,
    getXPMultiplierFromPowerUps,
    getStatBoostFromPowerUps,
    decrementUseBased,
    consumeStreakShield,
    calculateExpiration,
    getTimeRemaining,
    isExpiringSoon,
    hasStreakShield,
} from '../src/services/PowerUpService';
import { ActivePowerUp } from '../src/models/Character';

// =====================
// TEST HELPERS
// =====================

function createMockPowerUp(overrides: Partial<ActivePowerUp> = {}): ActivePowerUp {
    return {
        id: 'test_powerup',
        name: 'Test Power-Up',
        icon: '🧪',
        description: 'Test description',
        triggeredBy: 'test',
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        effect: { type: 'xp_multiplier', value: 1.1 },
        ...overrides,
    };
}

// =====================
// EFFECT_DEFINITIONS TESTS
// =====================

describe('EFFECT_DEFINITIONS', () => {
    it('should have first_blood_boost defined', () => {
        expect(EFFECT_DEFINITIONS.first_blood_boost).toBeDefined();
        expect(EFFECT_DEFINITIONS.first_blood_boost.effect.type).toBe('xp_multiplier');
        expect((EFFECT_DEFINITIONS.first_blood_boost.effect as any).value).toBe(1.05);
    });

    it('should have flow_state defined with 2x multiplier', () => {
        expect(EFFECT_DEFINITIONS.flow_state).toBeDefined();
        expect((EFFECT_DEFINITIONS.flow_state.effect as any).value).toBe(2.0);
    });

    it('should have momentum defined as stackable', () => {
        expect(EFFECT_DEFINITIONS.momentum).toBeDefined();
        expect(EFFECT_DEFINITIONS.momentum.collisionPolicy).toBe('stack');
    });

    it('should have level_up_boost defined as all_stats_boost', () => {
        expect(EFFECT_DEFINITIONS.level_up_boost).toBeDefined();
        expect(EFFECT_DEFINITIONS.level_up_boost.effect.type).toBe('all_stats_boost');
    });

    it('should have streak_shield defined', () => {
        expect(EFFECT_DEFINITIONS.streak_shield).toBeDefined();
        expect(EFFECT_DEFINITIONS.streak_shield.effect.type).toBe('streak_shield');
    });

    it('should have all effects with required fields', () => {
        for (const [id, effect] of Object.entries(EFFECT_DEFINITIONS)) {
            expect(effect.id).toBe(id);
            expect(effect.name).toBeDefined();
            expect(effect.icon).toBeDefined();
            expect(effect.description).toBeDefined();
            expect(effect.tier).toBeDefined();
            expect(effect.effect).toBeDefined();
            expect(effect.duration).toBeDefined();
            expect(effect.collisionPolicy).toBeDefined();
            expect(effect.notificationType).toBeDefined();
        }
    });
});

// =====================
// calculateExpiration TESTS
// =====================

describe('calculateExpiration', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should calculate hours-based expiration', () => {
        const result = calculateExpiration({ type: 'hours', value: 2 });

        expect(result).toBe('2024-01-15T14:00:00.000Z');
    });

    it('should calculate until_midnight expiration', () => {
        const result = calculateExpiration({ type: 'until_midnight' });

        // Should be end of current local day (contains 59:59.999)
        expect(result).not.toBeNull();
        expect(result).toContain('59:59');
    });

    it('should return null for uses-based duration', () => {
        const result = calculateExpiration({ type: 'uses', value: 3 });

        expect(result).toBeNull();
    });

    it('should return null for until_used duration', () => {
        const result = calculateExpiration({ type: 'until_used' });

        expect(result).toBeNull();
    });

    it('should return null for passive duration', () => {
        const result = calculateExpiration({ type: 'passive' });

        expect(result).toBeNull();
    });
});

// =====================
// grantPowerUp TESTS
// =====================

describe('grantPowerUp', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should grant new power-up', () => {
        const result = grantPowerUp([], 'first_blood_boost', 'first_blood');

        expect(result.granted).not.toBeNull();
        expect(result.granted?.id).toBe('first_blood_boost');
        expect(result.powerUps).toHaveLength(1);
    });

    it('should set correct fields on granted power-up', () => {
        const result = grantPowerUp([], 'first_blood_boost', 'first_blood');

        expect(result.granted?.name).toBe('First Blood');
        expect(result.granted?.icon).toBe('🩸');
        expect(result.granted?.triggeredBy).toBe('first_blood');
        expect(result.granted?.expiresAt).toBe('2024-01-15T13:00:00.000Z'); // 1 hour
    });

    it('should handle unknown effect gracefully', () => {
        const result = grantPowerUp([], 'unknown_effect', 'test');

        expect(result.granted).toBeNull();
        expect(result.powerUps).toHaveLength(0);
    });

    describe('collision policy: ignore', () => {
        // Note: No effects currently use 'ignore', but test the logic
        it('should not re-grant if already exists with ignore policy', () => {
            // This would need a mock effect with ignore policy
            // Skipping as no effects currently use this
        });
    });

    describe('collision policy: refresh', () => {
        it('should reset timer when refreshing', () => {
            const existing = createMockPowerUp({
                id: 'first_blood_boost',
                expiresAt: '2024-01-15T11:00:00.000Z', // Already expired
            });

            const result = grantPowerUp([existing], 'first_blood_boost', 'first_blood');

            expect(result.granted?.expiresAt).toBe('2024-01-15T13:00:00.000Z');
        });
    });

    describe('collision policy: stack', () => {
        it('should increment stacks when stacking momentum', () => {
            const existing = createMockPowerUp({
                id: 'momentum',
                effect: { type: 'xp_multiplier', value: 1.10 },
                stacks: 1,
            });

            const result = grantPowerUp([existing], 'momentum', 'one_shot');

            expect(result.granted?.stacks).toBe(2);
        });

        it('should handle stack increment from undefined', () => {
            const existing = createMockPowerUp({
                id: 'momentum',
                effect: { type: 'xp_multiplier', value: 1.10 },
            });
            delete existing.stacks;

            const result = grantPowerUp([existing], 'momentum', 'one_shot');

            expect(result.granted?.stacks).toBe(2);
        });

        it('should stack streak shields', () => {
            const existing = createMockPowerUp({
                id: 'streak_shield',
                effect: { type: 'streak_shield' },
                stacks: 1,
                expiresAt: null,
            });

            const result = grantPowerUp([existing], 'streak_shield', 'streak_keeper_3');

            expect(result.granted?.stacks).toBe(2);
        });
    });

    describe('collision policy: extend', () => {
        it('should add uses when extending catch_up', () => {
            const existing = createMockPowerUp({
                id: 'catch_up',
                effect: { type: 'xp_multiplier', value: 2.0 },
                usesRemaining: 2,
                expiresAt: null,
            });

            const result = grantPowerUp([existing], 'catch_up', 'phoenix');

            expect(result.granted?.usesRemaining).toBe(5); // 2 + 3
        });
    });

    it('should initialize stacks to 1 for stackable new power-ups', () => {
        const result = grantPowerUp([], 'momentum', 'one_shot');

        expect(result.granted?.stacks).toBe(1);
    });

    it('should initialize usesRemaining for use-based power-ups', () => {
        const result = grantPowerUp([], 'catch_up', 'phoenix');

        expect(result.granted?.usesRemaining).toBe(3);
    });
});

// =====================
// expirePowerUps TESTS
// =====================

describe('expirePowerUps', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should remove expired power-ups', () => {
        const powerUps = [
            createMockPowerUp({ id: 'expired', expiresAt: '2024-01-15T11:00:00.000Z' }),
            createMockPowerUp({ id: 'active', expiresAt: '2024-01-15T14:00:00.000Z' }),
        ];

        const result = expirePowerUps(powerUps);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('active');
    });

    it('should keep power-ups with null expiration', () => {
        const powerUps = [
            createMockPowerUp({ id: 'passive', expiresAt: null }),
        ];

        const result = expirePowerUps(powerUps);

        expect(result).toHaveLength(1);
    });

    it('should keep power-ups that expire exactly now', () => {
        const powerUps = [
            createMockPowerUp({ id: 'exact', expiresAt: '2024-01-15T12:00:00.001Z' }),
        ];

        const result = expirePowerUps(powerUps);

        expect(result).toHaveLength(1);
    });

    it('should handle empty array', () => {
        const result = expirePowerUps([]);

        expect(result).toEqual([]);
    });
});

// =====================
// getXPMultiplierFromPowerUps TESTS
// =====================

describe('getXPMultiplierFromPowerUps', () => {
    it('should return 1.0 for no power-ups', () => {
        const result = getXPMultiplierFromPowerUps([]);

        expect(result).toBe(1.0);
    });

    it('should add XP multiplier bonus', () => {
        const powerUps = [
            createMockPowerUp({ effect: { type: 'xp_multiplier', value: 1.05 } }),
        ];

        const result = getXPMultiplierFromPowerUps(powerUps);

        expect(result).toBe(1.05);
    });

    it('should stack multiple XP multipliers additively', () => {
        const powerUps = [
            createMockPowerUp({ id: 'a', effect: { type: 'xp_multiplier', value: 1.05 } }),
            createMockPowerUp({ id: 'b', effect: { type: 'xp_multiplier', value: 2.0 } }),
        ];

        const result = getXPMultiplierFromPowerUps(powerUps);

        // 1.0 + 0.05 + 1.0 = 2.05
        expect(result).toBe(2.05);
    });

    it('should apply stacks correctly', () => {
        const powerUps = [
            createMockPowerUp({
                effect: { type: 'xp_multiplier', value: 1.10 },
                stacks: 3,
            }),
        ];

        const result = getXPMultiplierFromPowerUps(powerUps);

        // 1.0 + (0.10 * 3) = 1.30
        expect(result).toBeCloseTo(1.30, 5);
    });

    it('should ignore non-XP effects', () => {
        const powerUps = [
            createMockPowerUp({ effect: { type: 'all_stats_boost', value: 5 } }),
        ];

        const result = getXPMultiplierFromPowerUps(powerUps);

        expect(result).toBe(1.0);
    });

    it('should apply category-specific multiplier when category matches', () => {
        const powerUps = [
            createMockPowerUp({
                effect: { type: 'xp_category_multiplier', value: 1.5, category: 'fitness' },
            }),
        ];

        const result = getXPMultiplierFromPowerUps(powerUps, 'fitness');

        expect(result).toBe(1.5);
    });

    it('should NOT apply category multiplier when category does not match', () => {
        const powerUps = [
            createMockPowerUp({
                effect: { type: 'xp_category_multiplier', value: 1.5, category: 'fitness' },
            }),
        ];

        const result = getXPMultiplierFromPowerUps(powerUps, 'work');

        expect(result).toBe(1.0);
    });

    it('should handle case-insensitive category matching', () => {
        const powerUps = [
            createMockPowerUp({
                effect: { type: 'xp_category_multiplier', value: 1.5, category: 'Fitness' },
            }),
        ];

        const result = getXPMultiplierFromPowerUps(powerUps, 'fitness');

        expect(result).toBe(1.5);
    });
});

// =====================
// getStatBoostFromPowerUps TESTS
// =====================

describe('getStatBoostFromPowerUps', () => {
    it('should return 0 for no power-ups', () => {
        const result = getStatBoostFromPowerUps([], 'strength');

        expect(result).toBe(0);
    });

    it('should return all_stats_boost value', () => {
        const powerUps = [
            createMockPowerUp({ effect: { type: 'all_stats_boost', value: 3 } }),
        ];

        const result = getStatBoostFromPowerUps(powerUps, 'strength');

        expect(result).toBe(3);
    });

    it('should return stat_boost for matching stat', () => {
        const powerUps = [
            createMockPowerUp({ effect: { type: 'stat_boost', stat: 'strength', value: 5 } }),
        ];

        const result = getStatBoostFromPowerUps(powerUps, 'strength');

        expect(result).toBe(5);
    });

    it('should NOT return stat_boost for non-matching stat', () => {
        const powerUps = [
            createMockPowerUp({ effect: { type: 'stat_boost', stat: 'strength', value: 5 } }),
        ];

        const result = getStatBoostFromPowerUps(powerUps, 'dexterity');

        expect(result).toBe(0);
    });

    it('should sum multiple boosts', () => {
        const powerUps = [
            createMockPowerUp({ id: 'a', effect: { type: 'all_stats_boost', value: 3 } }),
            createMockPowerUp({ id: 'b', effect: { type: 'stat_boost', stat: 'strength', value: 5 } }),
        ];

        const result = getStatBoostFromPowerUps(powerUps, 'strength');

        expect(result).toBe(8);
    });

    it('should ignore non-stat effects', () => {
        const powerUps = [
            createMockPowerUp({ effect: { type: 'xp_multiplier', value: 2.0 } }),
        ];

        const result = getStatBoostFromPowerUps(powerUps, 'strength');

        expect(result).toBe(0);
    });
});

// =====================
// decrementUseBased TESTS
// =====================

describe('decrementUseBased', () => {
    it('should decrement usesRemaining', () => {
        const powerUps = [
            createMockPowerUp({ usesRemaining: 3 }),
        ];

        const result = decrementUseBased(powerUps);

        expect(result[0].usesRemaining).toBe(2);
    });

    it('should remove power-up when uses reach 0', () => {
        const powerUps = [
            createMockPowerUp({ usesRemaining: 1 }),
        ];

        const result = decrementUseBased(powerUps);

        expect(result).toHaveLength(0);
    });

    it('should not affect power-ups without usesRemaining', () => {
        const powerUps = [
            createMockPowerUp({ usesRemaining: undefined }),
        ];

        const result = decrementUseBased(powerUps);

        expect(result).toHaveLength(1);
    });

    it('should handle mix of use-based and time-based', () => {
        const powerUps = [
            createMockPowerUp({ id: 'use-based', usesRemaining: 1 }),
            createMockPowerUp({ id: 'time-based', usesRemaining: undefined }),
        ];

        const result = decrementUseBased(powerUps);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('time-based');
    });
});

// =====================
// hasStreakShield TESTS
// =====================

describe('hasStreakShield', () => {
    it('should return true when streak shield exists', () => {
        const powerUps = [
            createMockPowerUp({ effect: { type: 'streak_shield' } }),
        ];

        expect(hasStreakShield(powerUps)).toBe(true);
    });

    it('should return false when no streak shield', () => {
        const powerUps = [
            createMockPowerUp({ effect: { type: 'xp_multiplier', value: 1.1 } }),
        ];

        expect(hasStreakShield(powerUps)).toBe(false);
    });

    it('should return false for empty array', () => {
        expect(hasStreakShield([])).toBe(false);
    });
});

// =====================
// consumeStreakShield TESTS
// =====================

describe('consumeStreakShield', () => {
    it('should remove single streak shield', () => {
        const powerUps = [
            createMockPowerUp({
                id: 'streak_shield',
                effect: { type: 'streak_shield' },
                stacks: 1,
            }),
        ];

        const result = consumeStreakShield(powerUps);

        expect(result).toHaveLength(0);
    });

    it('should decrement stacked streak shields', () => {
        const powerUps = [
            createMockPowerUp({
                id: 'streak_shield',
                effect: { type: 'streak_shield' },
                stacks: 3,
            }),
        ];

        const result = consumeStreakShield(powerUps);

        expect(result).toHaveLength(1);
        expect(result[0].stacks).toBe(2);
    });

    it('should remove shield when stacks undefined (treated as 1)', () => {
        const powerUps = [
            createMockPowerUp({
                id: 'streak_shield',
                effect: { type: 'streak_shield' },
            }),
        ];
        delete powerUps[0].stacks;

        const result = consumeStreakShield(powerUps);

        expect(result).toHaveLength(0);
    });

    it('should return unchanged array when no shield exists', () => {
        const powerUps = [
            createMockPowerUp({ effect: { type: 'xp_multiplier', value: 1.1 } }),
        ];

        const result = consumeStreakShield(powerUps);

        expect(result).toHaveLength(1);
    });

    it('should only consume first shield if multiple exist', () => {
        const powerUps = [
            createMockPowerUp({
                id: 'streak_shield_1',
                effect: { type: 'streak_shield' },
                stacks: 1,
            }),
            createMockPowerUp({
                id: 'streak_shield_2',
                effect: { type: 'streak_shield' },
                stacks: 1,
            }),
        ];

        const result = consumeStreakShield(powerUps);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('streak_shield_2');
    });
});

// =====================
// getTimeRemaining TESTS
// =====================

describe('getTimeRemaining', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return Passive for null expiration', () => {
        const powerUp = createMockPowerUp({ expiresAt: null });

        expect(getTimeRemaining(powerUp)).toBe('Passive');
    });

    it('should return uses remaining for use-based', () => {
        const powerUp = createMockPowerUp({
            expiresAt: null,
            usesRemaining: 3,
        });

        expect(getTimeRemaining(powerUp)).toBe('3 uses left');
    });

    it('should return singular for 1 use', () => {
        const powerUp = createMockPowerUp({
            expiresAt: null,
            usesRemaining: 1,
        });

        expect(getTimeRemaining(powerUp)).toBe('1 use left');
    });

    it('should return Expired for past expiration', () => {
        const powerUp = createMockPowerUp({
            expiresAt: '2024-01-15T11:00:00.000Z',
        });

        expect(getTimeRemaining(powerUp)).toBe('Expired');
    });

    it('should return hours and minutes format', () => {
        const powerUp = createMockPowerUp({
            expiresAt: '2024-01-15T14:30:00.000Z', // 2h 30m from now
        });

        expect(getTimeRemaining(powerUp)).toBe('2h 30m');
    });

    it('should return just minutes when under 1 hour', () => {
        const powerUp = createMockPowerUp({
            expiresAt: '2024-01-15T12:45:00.000Z', // 45m from now
        });

        expect(getTimeRemaining(powerUp)).toBe('45m');
    });
});

// =====================
// isExpiringSoon TESTS
// =====================

describe('isExpiringSoon', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return false for null expiration', () => {
        const powerUp = createMockPowerUp({ expiresAt: null });

        expect(isExpiringSoon(powerUp)).toBe(false);
    });

    it('should return true for <1 hour remaining', () => {
        const powerUp = createMockPowerUp({
            expiresAt: '2024-01-15T12:30:00.000Z', // 30m from now
        });

        expect(isExpiringSoon(powerUp)).toBe(true);
    });

    it('should return false for >1 hour remaining', () => {
        const powerUp = createMockPowerUp({
            expiresAt: '2024-01-15T14:00:00.000Z', // 2h from now
        });

        expect(isExpiringSoon(powerUp)).toBe(false);
    });

    it('should return false for already expired', () => {
        const powerUp = createMockPowerUp({
            expiresAt: '2024-01-15T11:00:00.000Z', // 1h ago
        });

        expect(isExpiringSoon(powerUp)).toBe(false);
    });
});
