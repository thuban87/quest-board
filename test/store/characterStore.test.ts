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

// =====================
// Title System Store Actions (Phase 1.5)
// =====================

describe('setEquippedTitle', () => {
    beforeEach(() => {
        useCharacterStore.setState({
            character: makeCharacter({
                equippedTitle: null,
                unlockedTitles: ['the-novice', 'eagle-eye'],
                lifetimeStats: {
                    questsCompleted: 0, battlesWon: 0, bossesDefeated: 0,
                    dungeonsCompleted: 0, dungeonAttempts: 0, goldEarned: 0,
                },
            }),
        });
    });

    it('sets equippedTitle to a title ID', () => {
        useCharacterStore.getState().setEquippedTitle('eagle-eye');
        expect(useCharacterStore.getState().character!.equippedTitle).toBe('eagle-eye');
    });

    it('clears equippedTitle when set to null', () => {
        useCharacterStore.getState().setEquippedTitle('eagle-eye');
        useCharacterStore.getState().setEquippedTitle(null);
        expect(useCharacterStore.getState().character!.equippedTitle).toBeNull();
    });

    it('does nothing when no character', () => {
        useCharacterStore.setState({ character: null });
        useCharacterStore.getState().setEquippedTitle('eagle-eye');
        expect(useCharacterStore.getState().character).toBeNull();
    });
});

describe('addUnlockedTitle', () => {
    beforeEach(() => {
        useCharacterStore.setState({
            character: makeCharacter({
                equippedTitle: null,
                unlockedTitles: ['the-novice'],
                lifetimeStats: {
                    questsCompleted: 0, battlesWon: 0, bossesDefeated: 0,
                    dungeonsCompleted: 0, dungeonAttempts: 0, goldEarned: 0,
                },
            }),
        });
    });

    it('adds a new title to unlockedTitles', () => {
        useCharacterStore.getState().addUnlockedTitle('eagle-eye');
        expect(useCharacterStore.getState().character!.unlockedTitles).toEqual(['the-novice', 'eagle-eye']);
    });

    it('does not duplicate when adding the same title twice', () => {
        useCharacterStore.getState().addUnlockedTitle('eagle-eye');
        useCharacterStore.getState().addUnlockedTitle('eagle-eye');
        expect(useCharacterStore.getState().character!.unlockedTitles).toEqual(['the-novice', 'eagle-eye']);
    });

    it('does nothing when no character', () => {
        useCharacterStore.setState({ character: null });
        useCharacterStore.getState().addUnlockedTitle('eagle-eye');
        expect(useCharacterStore.getState().character).toBeNull();
    });
});

describe('incrementLifetimeStat', () => {
    beforeEach(() => {
        useCharacterStore.setState({
            character: makeCharacter({
                equippedTitle: null,
                unlockedTitles: ['the-novice'],
                lifetimeStats: {
                    questsCompleted: 5, battlesWon: 3, bossesDefeated: 1,
                    dungeonsCompleted: 0, dungeonAttempts: 2, goldEarned: 100,
                },
            }),
        });
    });

    it('increments battlesWon correctly', () => {
        useCharacterStore.getState().incrementLifetimeStat('battlesWon', 1);
        expect(useCharacterStore.getState().character!.lifetimeStats.battlesWon).toBe(4);
    });

    it('increments goldEarned by arbitrary amount', () => {
        useCharacterStore.getState().incrementLifetimeStat('goldEarned', 50);
        expect(useCharacterStore.getState().character!.lifetimeStats.goldEarned).toBe(150);
    });

    it('does not affect other stats', () => {
        useCharacterStore.getState().incrementLifetimeStat('battlesWon', 1);
        const stats = useCharacterStore.getState().character!.lifetimeStats;
        expect(stats.questsCompleted).toBe(5);
        expect(stats.bossesDefeated).toBe(1);
        expect(stats.goldEarned).toBe(100);
    });

    it('does nothing when no character', () => {
        useCharacterStore.setState({ character: null });
        useCharacterStore.getState().incrementLifetimeStat('battlesWon', 1);
        expect(useCharacterStore.getState().character).toBeNull();
    });
});

describe('removePowerUpsByTrigger', () => {
    beforeEach(() => {
        useCharacterStore.setState({
            character: makeCharacter({
                equippedTitle: null,
                unlockedTitles: ['the-novice'],
                lifetimeStats: {
                    questsCompleted: 0, battlesWon: 0, bossesDefeated: 0,
                    dungeonsCompleted: 0, dungeonAttempts: 0, goldEarned: 0,
                },
                activePowerUps: [
                    { id: 'title-1', name: 'Title Buff', icon: '⭐', description: 'test', triggeredBy: 'title', startedAt: '2026-01-01', expiresAt: null, effect: { type: 'xp_multiplier', value: 1.03 } },
                    { id: 'consumable-1', name: 'Elixir', icon: '🧪', description: 'test', triggeredBy: 'consumable', startedAt: '2026-01-01', expiresAt: '2026-01-02', effect: { type: 'stat_percent_boost', stat: 'strength', value: 0.1 } },
                    { id: 'title-2', name: 'Another Title Buff', icon: '🎯', description: 'test', triggeredBy: 'title', startedAt: '2026-01-01', expiresAt: null, effect: { type: 'gold_multiplier', value: 1.05 } },
                    { id: 'power-up-1', name: 'Hat Trick', icon: '🎩', description: 'test', triggeredBy: 'hat_trick', startedAt: '2026-01-01', expiresAt: '2026-01-02', effect: { type: 'xp_multiplier', value: 1.1 } },
                ],
            }),
        });
    });

    it('removes only power-ups with the matching trigger', () => {
        useCharacterStore.getState().removePowerUpsByTrigger('title');
        const powerUps = useCharacterStore.getState().character!.activePowerUps;

        expect(powerUps).toHaveLength(2);
        expect(powerUps.map(p => p.id)).toEqual(['consumable-1', 'power-up-1']);
    });

    it('does not affect power-ups with different triggers', () => {
        useCharacterStore.getState().removePowerUpsByTrigger('title');
        const powerUps = useCharacterStore.getState().character!.activePowerUps;

        expect(powerUps.find(p => p.triggeredBy === 'consumable')).toBeDefined();
        expect(powerUps.find(p => p.triggeredBy === 'hat_trick')).toBeDefined();
    });

    it('does nothing when no matching trigger exists', () => {
        useCharacterStore.getState().removePowerUpsByTrigger('nonexistent');
        const powerUps = useCharacterStore.getState().character!.activePowerUps;
        expect(powerUps).toHaveLength(4);
    });

    it('does nothing when no character', () => {
        useCharacterStore.setState({ character: null });
        useCharacterStore.getState().removePowerUpsByTrigger('title');
        expect(useCharacterStore.getState().character).toBeNull();
    });
});

describe('addPowerUps', () => {
    beforeEach(() => {
        useCharacterStore.setState({
            character: makeCharacter({
                equippedTitle: null,
                unlockedTitles: ['the-novice'],
                lifetimeStats: {
                    questsCompleted: 0, battlesWon: 0, bossesDefeated: 0,
                    dungeonsCompleted: 0, dungeonAttempts: 0, goldEarned: 0,
                },
                activePowerUps: [
                    { id: 'existing-1', name: 'Existing Buff', icon: '⚡', description: 'test', triggeredBy: 'consumable', startedAt: '2026-01-01', expiresAt: '2026-01-02', effect: { type: 'xp_multiplier', value: 1.05 } },
                ],
            }),
        });
    });

    it('appends power-ups to the existing array', () => {
        useCharacterStore.getState().addPowerUps([
            { id: 'title-1', name: 'Title Buff', icon: '⭐', description: 'test', triggeredBy: 'title', startedAt: '2026-01-01', expiresAt: null, effect: { type: 'xp_multiplier', value: 1.03 } },
        ]);
        const powerUps = useCharacterStore.getState().character!.activePowerUps;
        expect(powerUps).toHaveLength(2);
        expect(powerUps[0].id).toBe('existing-1');
        expect(powerUps[1].id).toBe('title-1');
    });

    it('appends multiple power-ups at once', () => {
        useCharacterStore.getState().addPowerUps([
            { id: 'title-1', name: 'Buff 1', icon: '⭐', description: 'test', triggeredBy: 'title', startedAt: '2026-01-01', expiresAt: null, effect: { type: 'xp_multiplier', value: 1.03 } },
            { id: 'title-2', name: 'Buff 2', icon: '🎯', description: 'test', triggeredBy: 'title', startedAt: '2026-01-01', expiresAt: null, effect: { type: 'gold_multiplier', value: 1.05 } },
        ]);
        const powerUps = useCharacterStore.getState().character!.activePowerUps;
        expect(powerUps).toHaveLength(3);
    });

    it('does nothing when no character', () => {
        useCharacterStore.setState({ character: null });
        useCharacterStore.getState().addPowerUps([
            { id: 'title-1', name: 'Buff', icon: '⭐', description: 'test', triggeredBy: 'title', startedAt: '2026-01-01', expiresAt: null, effect: { type: 'xp_multiplier', value: 1.03 } },
        ]);
        expect(useCharacterStore.getState().character).toBeNull();
    });
});

describe('Surgical remove → add sequence', () => {
    it('removePowerUpsByTrigger then addPowerUps produces correct state', () => {
        useCharacterStore.setState({
            character: makeCharacter({
                equippedTitle: null,
                unlockedTitles: ['the-novice'],
                lifetimeStats: {
                    questsCompleted: 0, battlesWon: 0, bossesDefeated: 0,
                    dungeonsCompleted: 0, dungeonAttempts: 0, goldEarned: 0,
                },
                activePowerUps: [
                    { id: 'old-title-1', name: 'Old Buff', icon: '⭐', description: 'test', triggeredBy: 'title', startedAt: '2026-01-01', expiresAt: null, effect: { type: 'xp_multiplier', value: 1.03 } },
                    { id: 'consumable-1', name: 'Elixir', icon: '🧪', description: 'test', triggeredBy: 'consumable', startedAt: '2026-01-01', expiresAt: '2026-01-02', effect: { type: 'stat_percent_boost', stat: 'strength', value: 0.1 } },
                ],
            }),
        });

        // Simulate title swap: remove old title buffs, add new ones
        useCharacterStore.getState().removePowerUpsByTrigger('title');
        useCharacterStore.getState().addPowerUps([
            { id: 'new-title-1', name: 'New Buff', icon: '🎯', description: 'test', triggeredBy: 'title', startedAt: '2026-01-01', expiresAt: null, effect: { type: 'gold_multiplier', value: 1.05 } },
        ]);

        const powerUps = useCharacterStore.getState().character!.activePowerUps;
        expect(powerUps).toHaveLength(2);
        expect(powerUps[0].id).toBe('consumable-1'); // Preserved
        expect(powerUps[1].id).toBe('new-title-1');  // New
    });
});
