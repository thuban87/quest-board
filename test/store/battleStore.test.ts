/**
 * BattleStore Tests — ConsumableBuff Actions
 *
 * Unit tests for addConsumableBuff and tickConsumableBuffs actions.
 * Tests buff addition, replacement, tick decrementing, expiry,
 * and DEF_STAGE_BOOST reversal on expiry.
 *
 * Coverage target: ≥80% line, ≥80% branch on ConsumableBuff actions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage for Zustand persist middleware
const localStorageMock = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(() => null),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

import { useBattleStore, ConsumableBuff, BattlePlayer } from '../../src/store/battleStore';
import { ConsumableEffect } from '../../src/models/Consumable';

// =====================
// HELPERS
// =====================

/** Create a minimal BattlePlayer with defaults suitable for testing */
function makePlayer(overrides: Partial<BattlePlayer> = {}): BattlePlayer {
    return {
        maxHP: 200,
        currentHP: 100,
        maxMana: 100,
        currentMana: 50,
        physicalAttack: 50,
        magicAttack: 30,
        defense: 20,
        magicDefense: 15,
        speed: 10,
        critChance: 10,
        dodgeChance: 5,
        statStages: { atk: 0, def: 0, speed: 0 },
        volatileStatusEffects: [],
        skillsUsedThisBattle: [],
        turnsInBattle: 0,
        consumableBuffs: [],
        ...overrides,
    };
}

/** Create a DEF_STAGE_BOOST ConsumableBuff */
function makeDefBuff(turns: number = 4, stages: number = 2): ConsumableBuff {
    return {
        type: ConsumableEffect.DEF_STAGE_BOOST,
        turnsRemaining: turns,
        chance: 0,
        statusType: null,
        stageChange: stages,
    };
}

/** Create an enchantment ConsumableBuff */
function makeEnchantBuff(
    type: ConsumableEffect = ConsumableEffect.ENCHANT_BURN,
    turns: number = 5
): ConsumableBuff {
    return {
        type,
        turnsRemaining: turns,
        chance: 20,
        statusType: 'burn',
    };
}

// =====================
// SETUP
// =====================

beforeEach(() => {
    useBattleStore.setState({
        isInCombat: true,
        state: 'PLAYER_INPUT',
        player: makePlayer(),
        playerCurrentHP: 100,
        playerCurrentMana: 50,
        turnNumber: 3,
        log: [],
        playerStats: {
            maxHP: 200,
            maxMana: 100,
            currentHP: 100,
            currentMana: 50,
            physicalAttack: 50,
            magicAttack: 30,
            defense: 20,
            magicDefense: 15,
            critChance: 10,
            dodgeChance: 5,
            blockChance: 0,
            fireResist: 0,
            critDamageBonus: 0,
            attackStyle: 'physical',
            damageModifier: 1.0,
            attackName: 'Attack',
            critMultiplier: 1.5,
        },
    });
});

// =====================
// addConsumableBuff
// =====================

describe('addConsumableBuff', () => {
    it('adds buff to player', () => {
        const buff = makeDefBuff();
        useBattleStore.getState().addConsumableBuff(buff);

        const player = useBattleStore.getState().player!;
        expect(player.consumableBuffs).toHaveLength(1);
        expect(player.consumableBuffs[0]).toEqual(buff);
    });

    it('replaces existing buff of same type', () => {
        const buff1 = makeDefBuff(4, 2);
        const buff2 = makeDefBuff(3, 1); // Same type, different values

        useBattleStore.getState().addConsumableBuff(buff1);
        useBattleStore.getState().addConsumableBuff(buff2);

        const player = useBattleStore.getState().player!;
        expect(player.consumableBuffs).toHaveLength(1);
        expect(player.consumableBuffs[0].turnsRemaining).toBe(3); // Second buff's value
        expect(player.consumableBuffs[0].stageChange).toBe(1);
    });

    it('allows different types to coexist', () => {
        useBattleStore.getState().addConsumableBuff(makeDefBuff());
        useBattleStore.getState().addConsumableBuff(makeEnchantBuff());

        const player = useBattleStore.getState().player!;
        expect(player.consumableBuffs).toHaveLength(2);
    });

    it('no-op when no player', () => {
        useBattleStore.setState({ player: null });

        // Should not throw
        expect(() => {
            useBattleStore.getState().addConsumableBuff(makeDefBuff());
        }).not.toThrow();

        expect(useBattleStore.getState().player).toBeNull();
    });
});

// =====================
// tickConsumableBuffs
// =====================

describe('tickConsumableBuffs', () => {
    it('decrements turnsRemaining', () => {
        useBattleStore.setState({
            player: makePlayer({
                consumableBuffs: [makeDefBuff(3)],
            }),
        });

        useBattleStore.getState().tickConsumableBuffs();

        const player = useBattleStore.getState().player!;
        expect(player.consumableBuffs).toHaveLength(1);
        expect(player.consumableBuffs[0].turnsRemaining).toBe(2);
    });

    it('removes buff when turnsRemaining reaches 0', () => {
        useBattleStore.setState({
            player: makePlayer({
                consumableBuffs: [makeEnchantBuff(ConsumableEffect.ENCHANT_BURN, 1)],
            }),
        });

        useBattleStore.getState().tickConsumableBuffs();

        const player = useBattleStore.getState().player!;
        expect(player.consumableBuffs).toHaveLength(0);
    });

    it('reverses DEF_STAGE_BOOST on expiry', () => {
        // Player has +2 DEF stages from Ironbark Ward, buff about to expire
        useBattleStore.setState({
            player: makePlayer({
                statStages: { atk: 0, def: 2, speed: 0 },
                consumableBuffs: [makeDefBuff(1, 2)], // 1 turn left, +2 stages
            }),
        });

        useBattleStore.getState().tickConsumableBuffs();

        const player = useBattleStore.getState().player!;
        expect(player.consumableBuffs).toHaveLength(0);
        expect(player.statStages.def).toBe(0); // Reversed from +2 to 0
    });

    it('does not reverse DEF when buff still active', () => {
        useBattleStore.setState({
            player: makePlayer({
                statStages: { atk: 0, def: 2, speed: 0 },
                consumableBuffs: [makeDefBuff(3, 2)], // 3 turns left
            }),
        });

        useBattleStore.getState().tickConsumableBuffs();

        const player = useBattleStore.getState().player!;
        expect(player.statStages.def).toBe(2); // Unchanged
    });

    it('removes enchantment silently on expiry (no stage change)', () => {
        useBattleStore.setState({
            player: makePlayer({
                statStages: { atk: 0, def: 0, speed: 0 },
                consumableBuffs: [makeEnchantBuff(ConsumableEffect.ENCHANT_BURN, 1)],
            }),
        });

        useBattleStore.getState().tickConsumableBuffs();

        const player = useBattleStore.getState().player!;
        expect(player.consumableBuffs).toHaveLength(0);
        expect(player.statStages.def).toBe(0); // Unchanged
    });

    it('no-op when no player', () => {
        useBattleStore.setState({ player: null });
        expect(() => {
            useBattleStore.getState().tickConsumableBuffs();
        }).not.toThrow();
    });

    it('no-op when no buffs', () => {
        useBattleStore.setState({
            player: makePlayer({ consumableBuffs: [] }),
        });

        useBattleStore.getState().tickConsumableBuffs();

        const player = useBattleStore.getState().player!;
        expect(player.consumableBuffs).toHaveLength(0);
    });

    it('handles multiple buffs with mixed expiry', () => {
        useBattleStore.setState({
            player: makePlayer({
                statStages: { atk: 0, def: 2, speed: 0 },
                consumableBuffs: [
                    makeDefBuff(1, 2),                                      // Expiring (reverses DEF)
                    makeEnchantBuff(ConsumableEffect.ENCHANT_BURN, 3),     // Still active
                ],
            }),
        });

        useBattleStore.getState().tickConsumableBuffs();

        const player = useBattleStore.getState().player!;
        expect(player.consumableBuffs).toHaveLength(1); // Only enchant remains
        expect(player.consumableBuffs[0].type).toBe(ConsumableEffect.ENCHANT_BURN);
        expect(player.consumableBuffs[0].turnsRemaining).toBe(2);
        expect(player.statStages.def).toBe(0); // DEF reversed
    });
});
