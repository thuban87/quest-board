/**
 * CharacterStore Tests — Consumable Actions
 *
 * Unit tests for removeInventoryItem (boolean return) and
 * useStatElixir (ActivePowerUp creation).
 *
 * Coverage target: ≥80% line, ≥80% branch on tested actions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCharacterStore } from '../../src/store/characterStore';

// =====================
// HELPERS
// =====================

/** Create a minimal Character for seeding the store */
function makeCharacter(overrides: Partial<any> = {}): any {
    return {
        schemaVersion: 2,
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
        shieldUsedThisWeek: false,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
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

// =====================
// removeInventoryItem
// =====================

describe('removeInventoryItem', () => {
    beforeEach(() => {
        useCharacterStore.setState({
            character: makeCharacter(),
            inventory: [
                { itemId: 'hp-potion-minor', quantity: 3, acquiredDate: '2026-01-01' },
                { itemId: 'phoenix-tear', quantity: 1, acquiredDate: '2026-01-01' },
            ],
        });
    });

    it('returns false when item not found', () => {
        const result = useCharacterStore.getState().removeInventoryItem('nonexistent');
        expect(result).toBe(false);
    });

    it('returns false on insufficient quantity', () => {
        // Only 1 phoenix tear, try to remove 2
        const result = useCharacterStore.getState().removeInventoryItem('phoenix-tear', 2);
        expect(result).toBe(false);
    });

    it('returns true on successful removal', () => {
        const result = useCharacterStore.getState().removeInventoryItem('hp-potion-minor', 1);
        expect(result).toBe(true);
    });

    it('decrements quantity correctly', () => {
        useCharacterStore.getState().removeInventoryItem('hp-potion-minor', 1);
        const item = useCharacterStore.getState().inventory.find(i => i.itemId === 'hp-potion-minor');
        expect(item!.quantity).toBe(2);
    });

    it('removes item entirely when quantity reaches 0', () => {
        useCharacterStore.getState().removeInventoryItem('phoenix-tear', 1);
        const item = useCharacterStore.getState().inventory.find(i => i.itemId === 'phoenix-tear');
        expect(item).toBeUndefined();
    });

    it('removes item when quantity equals removal amount', () => {
        useCharacterStore.getState().removeInventoryItem('hp-potion-minor', 3);
        const item = useCharacterStore.getState().inventory.find(i => i.itemId === 'hp-potion-minor');
        expect(item).toBeUndefined();
    });
});

// =====================
// useStatElixir
// =====================

describe('useStatElixir', () => {
    let dateNowSpy: ReturnType<typeof vi.spyOn>;
    const fixedTime = new Date('2026-02-20T12:00:00Z').getTime();

    beforeEach(() => {
        dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(fixedTime);
        useCharacterStore.setState({
            character: makeCharacter(),
            inventory: [
                { itemId: 'elixir-bull', quantity: 2, acquiredDate: '2026-01-01' },
                { itemId: 'hp-potion-minor', quantity: 5, acquiredDate: '2026-01-01' },
            ],
        });
    });

    afterEach(() => {
        dateNowSpy.mockRestore();
    });

    it('creates correct ActivePowerUp', () => {
        const result = useCharacterStore.getState().useStatElixir('elixir-bull');
        expect(result).toBe(true);

        const character = useCharacterStore.getState().character!;
        expect(character.activePowerUps).toHaveLength(1);

        const powerUp = character.activePowerUps[0];
        expect(powerUp.effect.type).toBe('stat_percent_boost');
        expect((powerUp.effect as any).stat).toBe('strength');
        expect((powerUp.effect as any).value).toBe(0.10);
        expect(powerUp.name).toBe('Elixir of the Bull');
        expect(powerUp.icon).toBe('🐂');
        expect(powerUp.triggeredBy).toBe('consumable');
    });

    it('sets expiry 1 hour from now', () => {
        useCharacterStore.getState().useStatElixir('elixir-bull');

        const character = useCharacterStore.getState().character!;
        const powerUp = character.activePowerUps[0];

        const expiresAt = new Date(powerUp.expiresAt!).getTime();
        const startedAt = new Date(powerUp.startedAt).getTime();
        const durationMs = expiresAt - startedAt;

        // 60 minutes * 60 seconds * 1000 ms = 3,600,000 ms
        expect(durationMs).toBe(60 * 60 * 1000);
    });

    it('consumes inventory item', () => {
        useCharacterStore.getState().useStatElixir('elixir-bull');

        const item = useCharacterStore.getState().inventory.find(i => i.itemId === 'elixir-bull');
        expect(item!.quantity).toBe(1); // Was 2, now 1
    });

    it('returns false for non-stat_boost items', () => {
        const result = useCharacterStore.getState().useStatElixir('hp-potion-minor');
        expect(result).toBe(false);
    });

    it('returns false when no character', () => {
        useCharacterStore.setState({ character: null });
        const result = useCharacterStore.getState().useStatElixir('elixir-bull');
        expect(result).toBe(false);
    });

    it('returns false when item not in inventory', () => {
        const result = useCharacterStore.getState().useStatElixir('elixir-fox');
        expect(result).toBe(false);
    });

    it('returns false for unknown item ID', () => {
        const result = useCharacterStore.getState().useStatElixir('nonexistent-elixir');
        expect(result).toBe(false);
    });

    it('generates unique powerUp ID', () => {
        useCharacterStore.getState().useStatElixir('elixir-bull');
        const character = useCharacterStore.getState().character!;
        const powerUp = character.activePowerUps[0];
        expect(powerUp.id).toContain('elixir_strength_');
    });
});
