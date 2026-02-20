/**
 * StatusEffectService Tests — processConsumableBuffProcs
 *
 * Unit tests for the pure function processConsumableBuffProcs().
 * Tests proc RNG, status application to monster, guard clauses,
 * and single-proc-per-call behavior.
 *
 * Coverage target: ≥80% line, ≥80% branch on processConsumableBuffProcs
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { processConsumableBuffProcs } from '../../src/services/StatusEffectService';
import { BattleMonster, ConsumableBuff } from '../../src/store/battleStore';
import { ConsumableEffect } from '../../src/models/Consumable';

// =====================
// HELPERS
// =====================

/** Create a minimal BattleMonster for testing */
function makeMonster(overrides: Partial<BattleMonster> = {}): BattleMonster {
    return {
        id: 'test-monster',
        templateId: 'goblin',
        name: 'Goblin',
        tier: 'overworld',
        level: 5,
        maxHP: 500,
        currentHP: 500,
        attack: 30,
        defense: 10,
        magicDefense: 5,
        critChance: 5,
        dodgeChance: 5,
        emoji: '👹',
        goldReward: 10,
        xpReward: 20,
        skills: [],
        statStages: { atk: 0, def: 0, speed: 0 },
        statusEffects: [],
        skillsUsedThisBattle: [],
        ...overrides,
    };
}

/** Create a burn enchantment buff */
function makeBurnBuff(chance: number = 20, turns: number = 5): ConsumableBuff {
    return {
        type: ConsumableEffect.ENCHANT_BURN,
        turnsRemaining: turns,
        chance,
        statusType: 'burn',
    };
}

/** Create a poison enchantment buff */
function makePoisonBuff(chance: number = 25): ConsumableBuff {
    return {
        type: ConsumableEffect.ENCHANT_POISON,
        turnsRemaining: 5,
        chance,
        statusType: 'poison',
    };
}

/** Create a DEF_STAGE_BOOST buff (should be skipped by proc system) */
function makeDefStageBuff(): ConsumableBuff {
    return {
        type: ConsumableEffect.DEF_STAGE_BOOST,
        turnsRemaining: 4,
        chance: 0,
        statusType: null,
        stageChange: 2,
    };
}

// =====================
// SETUP
// =====================

let randomSpy: ReturnType<typeof vi.spyOn>;

afterEach(() => {
    if (randomSpy) randomSpy.mockRestore();
});

// =====================
// GUARD CLAUSES
// =====================

describe('processConsumableBuffProcs — guard clauses', () => {
    it('returns false on 0 damage', () => {
        const result = processConsumableBuffProcs(0, makeMonster(), [makeBurnBuff()]);
        expect(result.procOccurred).toBe(false);
    });

    it('returns false on negative damage', () => {
        const result = processConsumableBuffProcs(-5, makeMonster(), [makeBurnBuff()]);
        expect(result.procOccurred).toBe(false);
    });

    it('returns false on empty buffs array', () => {
        const result = processConsumableBuffProcs(50, makeMonster(), []);
        expect(result.procOccurred).toBe(false);
    });

    it('returns false on null/undefined buffs', () => {
        const result = processConsumableBuffProcs(50, makeMonster(), null as any);
        expect(result.procOccurred).toBe(false);
    });

    it('skips DEF_STAGE_BOOST buffs (no statusType)', () => {
        // DEF buff has statusType: null and chance: 0 — should never proc
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0); // Always passes
        const result = processConsumableBuffProcs(50, makeMonster(), [makeDefStageBuff()]);
        expect(result.procOccurred).toBe(false);
    });
});

// =====================
// PROC BEHAVIOR
// =====================

describe('processConsumableBuffProcs — proc behavior', () => {
    it('procs when RNG succeeds', () => {
        // Burn buff has 20% chance. Math.random() * 100 < 20 means random < 0.20
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.10); // 10 < 20 → procs
        const result = processConsumableBuffProcs(50, makeMonster(), [makeBurnBuff(20)]);

        expect(result.procOccurred).toBe(true);
        expect(result.updatedMonster).toBeDefined();
        expect(result.logMessage).toBeDefined();
    });

    it('does not proc when RNG fails', () => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99); // 99 >= 20 → no proc
        const result = processConsumableBuffProcs(50, makeMonster(), [makeBurnBuff(20)]);

        expect(result.procOccurred).toBe(false);
    });

    it('applies status effect to monster on proc', () => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);
        const result = processConsumableBuffProcs(50, makeMonster(), [makeBurnBuff()]);

        expect(result.procOccurred).toBe(true);
        expect(result.updatedMonster!.statusEffects).toBeDefined();
        expect(result.updatedMonster!.statusEffects!.length).toBeGreaterThan(0);
        expect(result.updatedMonster!.statusEffects![0].type).toBe('burn');
    });

    it('only one proc per call (first enchantment buff wins)', () => {
        // Both have 100% chance — only the first one should proc
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.01);
        const result = processConsumableBuffProcs(
            50,
            makeMonster(),
            [makeBurnBuff(100), makePoisonBuff(100)]
        );

        expect(result.procOccurred).toBe(true);
        // First buff is burn, so that should be the one that procs
        expect(result.logMessage).toContain('Burning');
    });

    it('does not mutate original monster', () => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);
        const monster = makeMonster();
        const originalEffects = monster.statusEffects;

        processConsumableBuffProcs(50, monster, [makeBurnBuff()]);

        // Original monster should be unchanged
        expect(monster.statusEffects).toBe(originalEffects);
        expect(monster.statusEffects).toHaveLength(0);
    });

    it('log message includes status display name', () => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);
        const result = processConsumableBuffProcs(50, makeMonster(), [makeBurnBuff()]);

        expect(result.logMessage).toContain('Burning');
        expect(result.logMessage).toContain('enchantment');
    });
});
