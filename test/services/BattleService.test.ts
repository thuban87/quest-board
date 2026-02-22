/**
 * BattleService Tests — Phoenix Tear Intercept
 *
 * Unit tests for handleDefeat() Phoenix Tear logic.
 * Tests auto-revive, HP/mana restoration, inventory consumption,
 * battle state continuation, and normal defeat fallback.
 *
 * Coverage target: ≥80% on Phoenix Tear path of handleDefeat
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

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

// Mock BalanceTestingService (imported by BattleService)
vi.mock('../../src/services/BalanceTestingService', () => ({
    startBattleTracking: vi.fn(),
    trackSkillUse: vi.fn(),
    trackDamageTaken: vi.fn(),
    trackStageChange: vi.fn(),
    trackStatusEffect: vi.fn(),
    updateTurnCount: vi.fn(),
    finalizeBattle: vi.fn(),
    isBalanceTestingEnabled: vi.fn(() => false),
}));

// Mock MonsterService
vi.mock('../../src/services/MonsterService', () => ({
    createRandomMonster: vi.fn(),
    createMonster: vi.fn(),
}));

// Mock LootGenerationService
vi.mock('../../src/services/LootGenerationService', () => ({
    lootGenerationService: {
        generateLoot: vi.fn(() => ({ gear: [], consumables: [] })),
    },
}));

// Partial mock XPSystem — keep real calculateTrainingLevel/calculateLevel for characterStore
vi.mock('../../src/services/XPSystem', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        checkLevelUp: vi.fn(() => ({ didLevelUp: false, oldLevel: 1, newLevel: 1, tierChanged: false })),
    };
});

// Mock monsterSkills
vi.mock('../../src/data/monsterSkills', () => ({
    selectMonsterSkillAI: vi.fn(() => null),
}));

import { useBattleStore, BattlePlayer, BattleMonster } from '../../src/store/battleStore';
import { useCharacterStore } from '../../src/store/characterStore';
import { handleDefeat, setSaveCallback } from '../../src/services/BattleService';

// =====================
// HELPERS
// =====================

/** Create a minimal BattlePlayer for testing */
function makePlayer(overrides: Partial<BattlePlayer> = {}): BattlePlayer {
    return {
        maxHP: 1000,
        currentHP: 0,
        maxMana: 200,
        currentMana: 100,
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

/** Create a minimal BattleMonster */
function makeMonster(): BattleMonster {
    return {
        id: 'test-monster-1',
        templateId: 'goblin',
        name: 'Test Goblin',
        tier: 'overworld',
        level: 5,
        maxHP: 200,
        currentHP: 150,
        attack: 25,
        defense: 10,
        magicDefense: 5,
        critChance: 5,
        dodgeChance: 5,
        emoji: '👹',
        goldReward: 50,
        xpReward: 100,
        skills: [],
        statStages: { atk: 0, def: 0, speed: 0 },
        statusEffects: [],
        skillsUsedThisBattle: [],
    };
}

/** Create a minimal Character */
function makeCharacter(overrides: Partial<any> = {}): any {
    return {
        schemaVersion: 5,
        name: 'Tester',
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
        currentStreak: 5,
        highestStreak: 10,
        lastQuestCompletionDate: null,
        shieldUsedThisWeek: false,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        tasksCompletedToday: 0,
        lastTaskDate: null,
        activePowerUps: [],
        gold: 500,
        gearInventory: [],
        inventoryLimit: 50,
        currentHP: 0,
        maxHP: 1000,
        currentMana: 100,
        maxMana: 200,
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
// SETUP
// =====================

beforeEach(() => {
    // Set up a mock save callback
    setSaveCallback(vi.fn(() => Promise.resolve()));

    // Set up battle store with an active battle
    useBattleStore.setState({
        isInCombat: true,
        state: 'PROCESSING_TURN',
        player: makePlayer(),
        playerCurrentHP: 0,
        playerCurrentMana: 100,
        playerStats: {
            maxHP: 1000,
            maxMana: 200,
            currentHP: 0,
            currentMana: 100,
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
        monster: makeMonster(),
        turnNumber: 5,
        log: [],
        lootBonus: 1.0,
        isBountyFight: false,
        sourceQuestId: null,
    });
});

// =====================
// PHOENIX TEAR TESTS
// =====================

describe('handleDefeat — Phoenix Tear intercept', () => {
    it('consumes Phoenix Tear from inventory on death', () => {
        // Seed character with Phoenix Tear in inventory
        useCharacterStore.setState({
            character: makeCharacter(),
            inventory: [
                { itemId: 'phoenix-tear', quantity: 1, acquiredDate: new Date().toISOString() },
            ],
        });

        handleDefeat();

        // Phoenix Tear should be consumed
        const inventory = useCharacterStore.getState().inventory;
        const tear = inventory.find(i => i.itemId === 'phoenix-tear');
        expect(tear).toBeUndefined();
    });

    it('restores HP to 30% of max', () => {
        useCharacterStore.setState({
            character: makeCharacter(),
            inventory: [
                { itemId: 'phoenix-tear', quantity: 1, acquiredDate: new Date().toISOString() },
            ],
        });

        handleDefeat();

        const hp = useBattleStore.getState().playerCurrentHP;
        expect(hp).toBe(Math.floor(1000 * 0.30)); // 300
    });

    it('restores mana with 30% floor', () => {
        // Set pre-death mana to 20 (below 30% of 200 = 60)
        useBattleStore.setState({
            playerCurrentMana: 20,
            player: makePlayer({ currentMana: 20 }),
        });
        useCharacterStore.setState({
            character: makeCharacter(),
            inventory: [
                { itemId: 'phoenix-tear', quantity: 1, acquiredDate: new Date().toISOString() },
            ],
        });

        handleDefeat();

        const mana = useBattleStore.getState().playerCurrentMana;
        expect(mana).toBe(Math.floor(200 * 0.30)); // 60 (floor kicks in)
    });

    it('preserves pre-death mana when above 30% floor', () => {
        // Pre-death mana = 150 (above 30% of 200 = 60)
        useBattleStore.setState({
            playerCurrentMana: 150,
            player: makePlayer({ currentMana: 150 }),
        });
        useCharacterStore.setState({
            character: makeCharacter(),
            inventory: [
                { itemId: 'phoenix-tear', quantity: 1, acquiredDate: new Date().toISOString() },
            ],
        });

        handleDefeat();

        const mana = useBattleStore.getState().playerCurrentMana;
        expect(mana).toBe(150); // Preserved (above floor)
    });

    it('battle continues — state advances to PLAYER_INPUT', () => {
        useCharacterStore.setState({
            character: makeCharacter(),
            inventory: [
                { itemId: 'phoenix-tear', quantity: 1, acquiredDate: new Date().toISOString() },
            ],
        });

        handleDefeat();

        const state = useBattleStore.getState().state;
        expect(state).toBe('PLAYER_INPUT');
    });

    it('logs revival message', () => {
        useCharacterStore.setState({
            character: makeCharacter(),
            inventory: [
                { itemId: 'phoenix-tear', quantity: 1, acquiredDate: new Date().toISOString() },
            ],
        });

        handleDefeat();

        const log = useBattleStore.getState().log;
        const revivalEntry = log.find(e => e.action.includes('Phoenix Tear'));
        expect(revivalEntry).toBeDefined();
        expect(revivalEntry!.result).toBe('heal');
    });
});

describe('handleDefeat — normal defeat (no tear)', () => {
    it('sets character to unconscious with gold penalty', () => {
        useCharacterStore.setState({
            character: makeCharacter({ gold: 500 }),
            inventory: [], // No Phoenix Tear
        });

        handleDefeat();

        const character = useCharacterStore.getState().character!;
        expect(character.status).toBe('unconscious');
        expect(character.currentHP).toBe(0);
        // 10% penalty on 500 = 50 lost
        expect(character.gold).toBe(450);
    });

    it('ends battle with defeat outcome', () => {
        useCharacterStore.setState({
            character: makeCharacter(),
            inventory: [],
        });

        handleDefeat();

        const state = useBattleStore.getState().state;
        expect(state).toBe('DEFEAT');
    });
});
