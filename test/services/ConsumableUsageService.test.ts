/**
 * ConsumableUsageService Tests
 *
 * Unit tests for src/services/ConsumableUsageService.ts:
 * - HP/MP restore with clamping
 * - CLEANSE_DOT removes only DoTs (burn/poison/bleed/curse), keeps other effects
 * - CLEANSE_CURSE_CC removes curse + hard CC, keeps DoTs
 * - DIRECT_DAMAGE formula: base + perLevel * level, killing blow returns victory
 * - GUARANTEED_RETREAT calls copyVolatileStatusToPersistent, returns retreat
 * - Unknown item returns error
 * - Unimplemented effect returns error
 *
 * Coverage target: ≥80% line, ≥80% branch
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

import { useBattleStore } from '../../src/store/battleStore';
import { executeConsumable, ConsumableResult } from '../../src/services/ConsumableUsageService';
import { ConsumableEffect } from '../../src/models/Consumable';

// Mock BattleService — we only need copyVolatileStatusToPersistent
vi.mock('../../src/services/BattleService', () => ({
    copyVolatileStatusToPersistent: vi.fn(),
    battleService: {},
}));

import { copyVolatileStatusToPersistent } from '../../src/services/BattleService';
import { StatusEffect, StatusEffectType, StatusSeverity } from '../../src/models/StatusEffect';

// =====================
// HELPERS
// =====================

/** Create a StatusEffect with defaults for testing */
function makeEffect(type: StatusEffectType, duration: number): StatusEffect {
    return { id: `test-${type}`, type, duration, source: 'monster', severity: 'minor' };
}

/** Create a minimal battle store state suitable for testing */
function setupBattleState(overrides: Record<string, any> = {}) {
    useBattleStore.setState({
        isInCombat: true,
        state: 'PLAYER_INPUT',
        playerCurrentHP: 100,
        playerCurrentMana: 50,
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
            attackStyle: 'physical',
            damageModifier: 1.0,
            attackName: 'Attack',
            critMultiplier: 1.5,
        },
        monster: {
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
        },
        player: {
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
        },
        turnNumber: 3,
        log: [],
        ...overrides,
    });
}

// =====================
// SETUP
// =====================

beforeEach(() => {
    setupBattleState();
    vi.clearAllMocks();
});

// =====================
// UNKNOWN / ERROR CASES
// =====================

describe('executeConsumable — error handling', () => {
    it('returns error for unknown item ID', () => {
        const result = executeConsumable('nonexistent-item', 10);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown item');
    });

    it('returns logMessage and endsTurn false on error', () => {
        const result = executeConsumable('nonexistent-item', 10);
        expect(result.logMessage).toBe('');
        expect(result.endsTurn).toBe(false);
    });
});

// =====================
// HP RESTORE
// =====================

describe('executeConsumable — HP_RESTORE', () => {
    it('restores HP by effectValue', () => {
        setupBattleState({ playerCurrentHP: 50 });

        const result = executeConsumable('hp-potion-minor', 1);

        expect(result.success).toBe(true);
        expect(result.endsTurn).toBe(true);
        expect(result.logMessage).toContain('+130 HP');

        const state = useBattleStore.getState();
        expect(state.playerCurrentHP).toBe(180); // 50 + 130
    });

    it('clamps HP to maxHP', () => {
        setupBattleState({ playerCurrentHP: 190 });

        const result = executeConsumable('hp-potion-minor', 1);

        expect(result.success).toBe(true);
        const state = useBattleStore.getState();
        expect(state.playerCurrentHP).toBe(200); // capped at maxHP
    });

    it('does not end battle', () => {
        const result = executeConsumable('hp-potion-minor', 1);
        expect(result.endsBattle).toBeUndefined();
    });
});

// =====================
// MANA RESTORE
// =====================

describe('executeConsumable — MANA_RESTORE', () => {
    it('restores MP by effectValue', () => {
        setupBattleState({ playerCurrentMana: 20 });

        const result = executeConsumable('mp-potion-minor', 1);

        expect(result.success).toBe(true);
        expect(result.endsTurn).toBe(true);
        expect(result.logMessage).toContain('+35 MP');

        const state = useBattleStore.getState();
        expect(state.playerCurrentMana).toBe(55); // 20 + 35
    });

    it('clamps MP to maxMana', () => {
        setupBattleState({ playerCurrentMana: 90 });

        const result = executeConsumable('mp-potion-minor', 1);

        expect(result.success).toBe(true);
        const state = useBattleStore.getState();
        expect(state.playerCurrentMana).toBe(100); // capped at maxMana
    });
});

// =====================
// CLEANSE DOT
// =====================

describe('executeConsumable — CLEANSE_DOT', () => {
    it('removes burn, poison, and bleed effects', () => {
        setupBattleState();
        useBattleStore.setState({
            player: {
                ...useBattleStore.getState().player!,
                volatileStatusEffects: [
                    makeEffect('burn', 3),
                    makeEffect('poison', 2),
                    makeEffect('bleed', 4),
                ],
            },
        });

        const result = executeConsumable('purifying-salve', 1);

        expect(result.success).toBe(true);
        expect(result.endsTurn).toBe(true);
        expect(result.logMessage).toContain('Purifying Salve');

        const player = useBattleStore.getState().player!;
        expect(player.volatileStatusEffects).toHaveLength(0);
    });

    it('keeps non-DoT effects (e.g., paralyze)', () => {
        setupBattleState();
        useBattleStore.setState({
            player: {
                ...useBattleStore.getState().player!,
                volatileStatusEffects: [
                    makeEffect('burn', 3),
                    makeEffect('paralyze', 2),
                ],
            },
        });

        executeConsumable('purifying-salve', 1);

        const player = useBattleStore.getState().player!;
        expect(player.volatileStatusEffects).toHaveLength(1);
        expect(player.volatileStatusEffects[0].type).toBe('paralyze');
    });

    it('succeeds even when no DoT effects are present', () => {
        const result = executeConsumable('purifying-salve', 1);
        expect(result.success).toBe(true);
    });

    it('returns error when no player exists', () => {
        useBattleStore.setState({ player: null });
        const result = executeConsumable('purifying-salve', 1);
        expect(result.success).toBe(false);
        expect(result.error).toBe('No player');
    });
});

// =====================
// CLEANSE CURSE + CC
// =====================

describe('executeConsumable — CLEANSE_CURSE_CC', () => {
    it('removes curse and hard CC effects (paralyze, sleep, freeze, stun)', () => {
        setupBattleState();
        useBattleStore.setState({
            player: {
                ...useBattleStore.getState().player!,
                volatileStatusEffects: [
                    makeEffect('curse', 3),
                    makeEffect('paralyze', 2),
                    makeEffect('sleep', 1),
                    makeEffect('freeze', 2),
                    makeEffect('stun', 1),
                ],
            },
        });

        const result = executeConsumable('sacred-water', 1);

        expect(result.success).toBe(true);
        expect(result.logMessage).toContain('Sacred Water');

        const player = useBattleStore.getState().player!;
        expect(player.volatileStatusEffects).toHaveLength(0);
    });

    it('keeps DoT effects (burn, poison, bleed) intact', () => {
        setupBattleState();
        useBattleStore.setState({
            player: {
                ...useBattleStore.getState().player!,
                volatileStatusEffects: [
                    makeEffect('curse', 3),
                    makeEffect('burn', 2),
                    makeEffect('poison', 4),
                ],
            },
        });

        executeConsumable('sacred-water', 1);

        const player = useBattleStore.getState().player!;
        expect(player.volatileStatusEffects).toHaveLength(2);
        expect(player.volatileStatusEffects.map(e => e.type)).toEqual(['burn', 'poison']);
    });

    it('returns error when no player exists', () => {
        useBattleStore.setState({ player: null });
        const result = executeConsumable('sacred-water', 1);
        expect(result.success).toBe(false);
        expect(result.error).toBe('No player');
    });
});

// =====================
// DIRECT DAMAGE (FIREBOMB)
// =====================

describe('executeConsumable — DIRECT_DAMAGE', () => {
    it('deals base + perLevel * level damage', () => {
        // Firebomb: base 40, perLevel 8
        const result = executeConsumable('firebomb', 10);

        expect(result.success).toBe(true);
        expect(result.logMessage).toContain('Firebomb');
        // 40 + 8 * 10 = 120 damage
        expect(result.logMessage).toContain('120');

        const monster = useBattleStore.getState().monster!;
        expect(monster.currentHP).toBe(380); // 500 - 120
    });

    it('ends turn when monster survives', () => {
        const result = executeConsumable('firebomb', 10);
        expect(result.endsTurn).toBe(true);
        expect(result.endsBattle).toBeUndefined();
    });

    it('triggers victory when monster HP drops to 0', () => {
        // Set monster to low HP so Firebomb kills it
        useBattleStore.setState({
            monster: {
                ...useBattleStore.getState().monster!,
                currentHP: 50, // Firebomb at L10 = 120 > 50
            },
        });

        const result = executeConsumable('firebomb', 10);

        expect(result.success).toBe(true);
        expect(result.endsBattle).toBe('victory');
        expect(result.endsTurn).toBe(false); // Victory overrides turn

        const monster = useBattleStore.getState().monster!;
        expect(monster.currentHP).toBe(0);
    });

    it('scales damage with character level', () => {
        // Level 1: 40 + 8*1 = 48
        executeConsumable('firebomb', 1);
        const hpAfterL1 = useBattleStore.getState().monster!.currentHP;
        expect(hpAfterL1).toBe(452);

        // Reset and test level 40: 40 + 8*40 = 360
        setupBattleState();
        executeConsumable('firebomb', 40);
        const hpAfterL40 = useBattleStore.getState().monster!.currentHP;
        expect(hpAfterL40).toBe(140);
    });

    it('clamps monster HP to 0 (not negative)', () => {
        useBattleStore.setState({
            monster: {
                ...useBattleStore.getState().monster!,
                currentHP: 10,
            },
        });

        executeConsumable('firebomb', 40); // 360 damage > 10 HP

        const monster = useBattleStore.getState().monster!;
        expect(monster.currentHP).toBe(0);
    });

    it('returns error when no monster exists', () => {
        useBattleStore.setState({ monster: null });
        const result = executeConsumable('firebomb', 10);
        expect(result.success).toBe(false);
        expect(result.error).toBe('No monster');
    });
});

// =====================
// GUARANTEED RETREAT (SMOKE BOMB)
// =====================

describe('executeConsumable — GUARANTEED_RETREAT', () => {
    it('calls copyVolatileStatusToPersistent', () => {
        executeConsumable('smoke-bomb', 1);
        expect(copyVolatileStatusToPersistent).toHaveBeenCalledOnce();
    });

    it('returns retreat result', () => {
        const result = executeConsumable('smoke-bomb', 1);
        expect(result.success).toBe(true);
        expect(result.endsBattle).toBe('retreat');
        expect(result.endsTurn).toBe(false); // Retreat ends battle, not turn
        expect(result.logMessage).toContain('Smoke Bomb');
    });
});

// =====================
// RESULT STRUCTURE
// =====================

describe('ConsumableResult structure', () => {
    it('successful results always have logMessage', () => {
        const items = ['hp-potion-minor', 'mp-potion-minor', 'purifying-salve', 'sacred-water', 'firebomb', 'smoke-bomb'];
        for (const id of items) {
            const result = executeConsumable(id, 10);
            expect(result.logMessage.length, `${id} should have logMessage`).toBeGreaterThan(0);
        }
    });

    it('error results have empty logMessage', () => {
        const result = executeConsumable('nonexistent', 10);
        expect(result.logMessage).toBe('');
    });
});
