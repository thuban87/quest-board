/**
 * LootGenerationService Tests — Phase 4.5
 *
 * Unit tests for consumable drop methods:
 * - rollCombatConsumable: per-tier drop chances, rare item cascades, boss-only items
 * - rollQuestConsumable (via generateQuestLoot): cumulative weight distribution
 * - generateChestLoot: golden chest consumable branch
 *
 * Coverage target: ≥80% line, ≥80% branch on consumable-related methods
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { LootGenerationService } from '../../src/services/LootGenerationService';
import {
    getHpPotionForLevel,
    getMpPotionForLevel,
    ENCHANTMENT_IDS,
    STAT_ELIXIR_IDS,
    CLEANSING_IDS,
    TACTICAL_IDS,
} from '../../src/models/Consumable';
import type { MonsterTier } from '../../src/config/combatConfig';

// Mock dependencies that LootGenerationService imports
vi.mock('../../src/data/uniqueItems', () => ({
    createUniqueItem: vi.fn(() => null),
}));

vi.mock('../../src/services/SetBonusService', () => ({
    setBonusService: {
        getSetFromQuestPath: vi.fn(() => null),
    },
}));

vi.mock('../../src/services/PowerUpService', () => ({
    getGoldMultiplierFromPowerUps: vi.fn(() => 1.0),
    expirePowerUps: vi.fn((pups: any[]) => pups),
}));

// =====================
// HELPERS
// =====================

/** Create a minimal Character for testing */
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
        shieldUsedThisWeek: false,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        tasksCompletedToday: 0,
        lastTaskDate: null,
        activePowerUps: [],
        gold: 500,
        gearInventory: [],
        inventoryLimit: 50,
        currentHP: 500,
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

let service: LootGenerationService;
let mathRandomSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    service = new LootGenerationService();
    mathRandomSpy = vi.spyOn(Math, 'random');
});

afterEach(() => {
    mathRandomSpy.mockRestore();
});

/** Narrow a LootReward to its consumable variant for assertions */
function asConsumable(reward: import('../../src/models/Gear').LootReward | null) {
    expect(reward).not.toBeNull();
    expect(reward!.type).toBe('consumable');
    return reward as { type: 'consumable'; itemId: string; quantity: number };
}

// =====================================================
// rollCombatConsumable — direct tests (now public)
// =====================================================

describe('rollCombatConsumable — base drop chance', () => {
    it('returns null when base drop check fails for overworld (25%)', () => {
        // Overworld threshold is 0.25; returning 0.25 means >= 0.25, so no drop
        mathRandomSpy.mockReturnValue(0.25);

        const result = service.rollCombatConsumable('overworld', 10);
        expect(result).toBeNull();
    });

    it('returns null when base drop check fails for dungeon (40%)', () => {
        mathRandomSpy.mockReturnValue(0.40);

        const result = service.rollCombatConsumable('dungeon', 10);
        expect(result).toBeNull();
    });

    it('drops consumable when base check passes for boss (85%)', () => {
        // Pass base check, then skip phoenix (>= 0.01), skip oil (>= 0.08),
        // skip elixir (>= 0.05), then HP potion (< 0.6)
        mathRandomSpy
            .mockReturnValueOnce(0.0)   // base check: 0.0 < 0.85 → pass
            .mockReturnValueOnce(0.5)   // phoenix check: 0.5 >= 0.01 → skip
            .mockReturnValueOnce(0.5)   // oil check: 0.5 >= 0.08 → skip
            .mockReturnValueOnce(0.5)   // elixir check: 0.5 >= 0.05 → skip
            .mockReturnValueOnce(0.3);  // HP/MP split: 0.3 < 0.6 → HP

        const result = service.rollCombatConsumable('boss', 10);
        const c = asConsumable(result);
        expect(c.itemId).toBe(getHpPotionForLevel(10));
    });

    it('drops consumable when base check passes for raid_boss (95%)', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)   // base: pass
            .mockReturnValueOnce(0.5)   // phoenix: skip
            .mockReturnValueOnce(0.5)   // oil: skip
            .mockReturnValueOnce(0.5)   // elixir: skip
            .mockReturnValueOnce(0.3);  // HP potion

        const result = service.rollCombatConsumable('raid_boss', 10);
        expect(result).not.toBeNull();
    });
});

describe('rollCombatConsumable — HP/MP potion default', () => {
    it('returns HP potion when final roll < 0.6', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)   // base: pass overworld
            .mockReturnValueOnce(0.5)   // oil: skip (>= 0.04)
            .mockReturnValueOnce(0.5)   // elixir: skip (>= 0.02)
            .mockReturnValueOnce(0.3);  // HP/MP: 0.3 < 0.6 → HP

        const result = service.rollCombatConsumable('overworld', 30);
        expect(asConsumable(result).itemId).toBe(getHpPotionForLevel(30));
    });

    it('returns MP potion when final roll >= 0.6', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)   // base: pass
            .mockReturnValueOnce(0.5)   // oil: skip
            .mockReturnValueOnce(0.5)   // elixir: skip
            .mockReturnValueOnce(0.7);  // HP/MP: 0.7 >= 0.6 → MP

        const result = service.rollCombatConsumable('overworld', 30);
        expect(asConsumable(result).itemId).toBe(getMpPotionForLevel(30));
    });

    it('returns level-appropriate potion for monster level', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)   // base: pass
            .mockReturnValueOnce(0.5)   // oil: skip
            .mockReturnValueOnce(0.5)   // elixir: skip
            .mockReturnValueOnce(0.0);  // HP

        const result = service.rollCombatConsumable('overworld', 1);
        expect(asConsumable(result).itemId).toBe(getHpPotionForLevel(1));

        // Reset and test L30
        mathRandomSpy
            .mockReturnValueOnce(0.0)
            .mockReturnValueOnce(0.5)
            .mockReturnValueOnce(0.5)
            .mockReturnValueOnce(0.0);

        const result2 = service.rollCombatConsumable('overworld', 30);
        expect(asConsumable(result2).itemId).toBe(getHpPotionForLevel(30));
    });
});

describe('rollCombatConsumable — Phoenix Tear', () => {
    it('drops Phoenix Tear from boss when roll < 0.01', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)     // base: pass boss
            .mockReturnValueOnce(0.005);  // phoenix: 0.005 < 0.01 → drop!

        const result = service.rollCombatConsumable('boss', 10);
        const c = asConsumable(result);
        expect(c.itemId).toBe('phoenix-tear');
        expect(c.quantity).toBe(1);
    });

    it('drops Phoenix Tear from raid_boss when roll < 0.01', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)
            .mockReturnValueOnce(0.005);

        const result = service.rollCombatConsumable('raid_boss', 10);
        expect(asConsumable(result).itemId).toBe('phoenix-tear');
    });

    it('never drops Phoenix Tear from overworld (non-boss skips check)', () => {
        // For overworld, isHighTier is false, so phoenix check is skipped entirely.
        // The cascade goes: base → oil → elixir → HP/MP
        mathRandomSpy
            .mockReturnValueOnce(0.0)     // base: pass
            .mockReturnValueOnce(0.5)     // oil: skip
            .mockReturnValueOnce(0.5)     // elixir: skip
            .mockReturnValueOnce(0.0);    // HP potion

        const result = service.rollCombatConsumable('overworld', 10);
        expect(asConsumable(result).itemId).not.toBe('phoenix-tear');
    });

    it('never drops Phoenix Tear from dungeon (non-boss)', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)
            .mockReturnValueOnce(0.5)
            .mockReturnValueOnce(0.5)
            .mockReturnValueOnce(0.0);

        const result = service.rollCombatConsumable('dungeon', 10);
        expect(asConsumable(result).itemId).not.toBe('phoenix-tear');
    });
});

describe('rollCombatConsumable — enchantment oils', () => {
    it('drops enchantment oil from overworld at 4% threshold', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)     // base: pass
            .mockReturnValueOnce(0.03);   // oil: 0.03 < 0.04 → drop

        // pickRandom will also use Math.random — provide a value
        mathRandomSpy.mockReturnValueOnce(0.0); // picks first ENCHANTMENT_ID

        const result = service.rollCombatConsumable('overworld', 10);
        expect(ENCHANTMENT_IDS).toContain(asConsumable(result).itemId);
    });

    it('drops enchantment oil from dungeon at 6% threshold', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)     // base: pass
            .mockReturnValueOnce(0.05);   // oil: 0.05 < 0.06 → drop

        mathRandomSpy.mockReturnValueOnce(0.0);

        const result = service.rollCombatConsumable('dungeon', 10);
        expect(ENCHANTMENT_IDS).toContain(asConsumable(result).itemId);
    });

    it('skips oil when roll exceeds threshold', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)     // base: pass
            .mockReturnValueOnce(0.05)    // oil: 0.05 >= 0.04 for overworld → skip
            .mockReturnValueOnce(0.5)     // elixir: skip
            .mockReturnValueOnce(0.0);    // HP

        const result = service.rollCombatConsumable('overworld', 10);
        expect(ENCHANTMENT_IDS).not.toContain(asConsumable(result).itemId);
    });
});

describe('rollCombatConsumable — stat elixirs', () => {
    it('drops stat elixir from elite at 5% threshold', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)     // base: pass
            .mockReturnValueOnce(0.5)     // oil: skip (>= 0.08 for elite)
            .mockReturnValueOnce(0.04);   // elixir: 0.04 < 0.05 → drop

        mathRandomSpy.mockReturnValueOnce(0.0); // pickRandom

        const result = service.rollCombatConsumable('elite', 10);
        expect(STAT_ELIXIR_IDS).toContain(asConsumable(result).itemId);
    });

    it('skips elixir from overworld when roll >= 2% threshold', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)     // base: pass
            .mockReturnValueOnce(0.5)     // oil: skip
            .mockReturnValueOnce(0.02)    // elixir: 0.02 >= 0.02 → skip
            .mockReturnValueOnce(0.0);    // HP

        const result = service.rollCombatConsumable('overworld', 10);
        expect(STAT_ELIXIR_IDS).not.toContain(asConsumable(result).itemId);
    });
});

describe('rollCombatConsumable — result structure', () => {
    it('always returns quantity 1', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)
            .mockReturnValueOnce(0.5)
            .mockReturnValueOnce(0.5)
            .mockReturnValueOnce(0.0);

        const result = service.rollCombatConsumable('overworld', 10);
        expect(asConsumable(result).quantity).toBe(1);
    });

    it('always returns type consumable', () => {
        mathRandomSpy
            .mockReturnValueOnce(0.0)
            .mockReturnValueOnce(0.5)
            .mockReturnValueOnce(0.5)
            .mockReturnValueOnce(0.0);

        const result = service.rollCombatConsumable('overworld', 10);
        expect(result!.type).toBe('consumable');
    });
});

// =====================================================
// generateCombatLoot — consumable integration
// =====================================================

describe('generateCombatLoot — consumable rewards', () => {
    it('includes consumable when rollCombatConsumable returns a drop', () => {
        const character = makeCharacter();

        // Force gear not to drop, but consumable to drop
        mathRandomSpy
            .mockReturnValueOnce(0.99)   // gear check: miss
            .mockReturnValueOnce(0.0)    // consumable base: hit overworld
            .mockReturnValueOnce(0.5)    // oil: skip
            .mockReturnValueOnce(0.5)    // elixir: skip
            .mockReturnValueOnce(0.0);   // HP potion

        const loot = service.generateCombatLoot('overworld', 10, character);
        const consumables = loot.filter(r => r.type === 'consumable');
        expect(consumables.length).toBe(1);
    });

    it('excludes consumable when rollCombatConsumable returns null', () => {
        const character = makeCharacter();

        mathRandomSpy
            .mockReturnValueOnce(0.99)   // gear: miss
            .mockReturnValueOnce(0.99);  // consumable base: miss

        const loot = service.generateCombatLoot('overworld', 10, character);
        const consumables = loot.filter(r => r.type === 'consumable');
        expect(consumables.length).toBe(0);
    });

    it('always includes gold reward', () => {
        const character = makeCharacter();
        mathRandomSpy.mockReturnValue(0.99); // miss everything

        const loot = service.generateCombatLoot('overworld', 10, character);
        const gold = loot.filter(r => r.type === 'gold');
        expect(gold.length).toBe(1);
    });
});

// =====================================================
// generateChestLoot — golden chest consumable branch
// =====================================================

describe('generateChestLoot — golden chest consumables', () => {
    it('drops cleansing/tactical item when roll < 0.3', () => {
        const character = makeCharacter();
        const pool = [...CLEANSING_IDS, ...TACTICAL_IDS];

        mathRandomSpy
            .mockReturnValueOnce(0.5)    // gold randomRange
            .mockReturnValueOnce(0.0)    // gear: golden always drops (< 1.0)
            .mockReturnValueOnce(0.5)    // rollTier
            .mockReturnValueOnce(0.5)    // rollGearLevel
            .mockReturnValueOnce(0.0)    // pickRandom (slot)
            .mockReturnValueOnce(0.0)    // pickRandom (name prefix)
            .mockReturnValueOnce(0.0)    // pickRandom (name base)
            .mockReturnValueOnce(0.5)    // pickRandom (stat)
            .mockReturnValueOnce(0.0)    // pickRandom (weapon type)
            .mockReturnValueOnce(0.5)    // generateDescription
            .mockReturnValueOnce(0.1)    // set piece chance: < 0.4 but mock returns null
            .mockReturnValueOnce(0.1)    // chest consumable: < 0.3 → cleansing/tactical
            .mockReturnValueOnce(0.0);   // pickRandom for consumable

        const loot = service.generateChestLoot('golden', 10, character);
        const consumables = loot.filter(r => r.type === 'consumable');
        expect(consumables.length).toBe(1);
        expect(pool).toContain((consumables[0] as any).itemId);
    });

    it('drops HP/MP potion with quantity 2 when roll >= 0.3', () => {
        const character = makeCharacter();

        mathRandomSpy
            .mockReturnValueOnce(0.5)    // gold
            .mockReturnValueOnce(0.0)    // gear check
            .mockReturnValueOnce(0.5)    // rollTier
            .mockReturnValueOnce(0.5)    // rollGearLevel
            .mockReturnValueOnce(0.0)    // pickRandom (slot)
            .mockReturnValueOnce(0.0)    // pickRandom (name prefix)
            .mockReturnValueOnce(0.0)    // pickRandom (name base)
            .mockReturnValueOnce(0.5)    // pickRandom (stat)
            .mockReturnValueOnce(0.0)    // pickRandom (weapon type)
            .mockReturnValueOnce(0.5)    // generateDescription
            .mockReturnValueOnce(0.5)    // set piece chance: >= 0.4 → skip
            .mockReturnValueOnce(0.5)    // chest consumable: >= 0.3 → HP/MP potion
            .mockReturnValueOnce(0.3);   // HP/MP split: < 0.5 → HP

        const loot = service.generateChestLoot('golden', 10, character);
        const consumables = loot.filter(r => r.type === 'consumable');
        expect(consumables.length).toBe(1);
        expect((consumables[0] as any).quantity).toBe(2);
    });

    it('does not include consumable for wooden chest', () => {
        const character = makeCharacter();
        mathRandomSpy.mockReturnValue(0.99); // miss gear

        const loot = service.generateChestLoot('wooden', 10, character);
        const consumables = loot.filter(r => r.type === 'consumable');
        expect(consumables.length).toBe(0);
    });

    it('does not include consumable for iron chest', () => {
        const character = makeCharacter();
        mathRandomSpy.mockReturnValue(0.99); // miss gear

        const loot = service.generateChestLoot('iron', 10, character);
        const consumables = loot.filter(r => r.type === 'consumable');
        expect(consumables.length).toBe(0);
    });
});

// =====================================================
// rollQuestConsumable — weight distribution
// =====================================================

describe('rollQuestConsumable (via generateQuestLoot)', () => {
    // Total weight: 70 + 40 + 10 + 10 + 5 = 135
    // HP: 0–70, MP: 70–110, Revive: 110–120, Cleansing: 120–130, Tactical: 130–135
    // Math.random() is called: roll = Math.random() * 135

    it('drops HP potion when roll falls in HP band (0-70)', () => {
        const character = makeCharacter({ level: 10 });
        const quest: any = {
            questId: 'test-1',
            priority: 'medium',
            questType: 'main',
            path: '/test/quest.md',
        };

        // We need to get the quest loot path to call rollQuestConsumable.
        // Control: gold randomRange, gear roll (miss), consumable roll (hit), then quest weight roll
        mathRandomSpy
            .mockReturnValueOnce(0.5)    // gold randomRange
            .mockReturnValueOnce(0.99)   // gear slot+roll: miss (>= 0.60)
            .mockReturnValueOnce(0.0)    // consumable check: < 0.45 → get consumable
            .mockReturnValueOnce(0.0);   // quest weight roll: 0 * 135 = 0 → HP band

        const loot = service.generateQuestLoot(quest, character);
        const consumables = loot.filter(r => r.type === 'consumable');
        expect(consumables.length).toBe(1);
        expect((consumables[0] as any).itemId).toBe(getHpPotionForLevel(10));
    });

    it('drops MP potion when roll falls in MP band (70-110)', () => {
        const character = makeCharacter({ level: 10 });
        const quest: any = {
            questId: 'test-2',
            priority: 'medium',
            questType: 'main',
            path: '/test/quest.md',
        };

        mathRandomSpy
            .mockReturnValueOnce(0.5)    // gold
            .mockReturnValueOnce(0.99)   // gear: miss
            .mockReturnValueOnce(0.0)    // consumable: hit
            .mockReturnValueOnce(0.6);   // weight roll: 0.6 * 135 = 81 → MP band (70-110)

        const loot = service.generateQuestLoot(quest, character);
        const consumables = loot.filter(r => r.type === 'consumable');
        expect(consumables.length).toBe(1);
        expect((consumables[0] as any).itemId).toBe(getMpPotionForLevel(10));
    });

    it('drops revive potion when roll falls in revive band (110-120)', () => {
        const character = makeCharacter({ level: 10 });
        const quest: any = {
            questId: 'test-3',
            priority: 'medium',
            questType: 'main',
            path: '/test/quest.md',
        };

        mathRandomSpy
            .mockReturnValueOnce(0.5)    // gold
            .mockReturnValueOnce(0.99)   // gear: miss
            .mockReturnValueOnce(0.0)    // consumable: hit
            .mockReturnValueOnce(0.83);  // weight: 0.83 * 135 ≈ 112 → revive band (110-120)

        const loot = service.generateQuestLoot(quest, character);
        const consumables = loot.filter(r => r.type === 'consumable');
        expect(consumables.length).toBe(1);
        expect((consumables[0] as any).itemId).toBe('revive-potion');
    });

    it('drops cleansing item when roll falls in cleansing band (120-130)', () => {
        const character = makeCharacter({ level: 10 });
        const quest: any = {
            questId: 'test-4',
            priority: 'medium',
            questType: 'main',
            path: '/test/quest.md',
        };

        mathRandomSpy
            .mockReturnValueOnce(0.5)    // gold
            .mockReturnValueOnce(0.99)   // gear: miss
            .mockReturnValueOnce(0.0)    // consumable: hit
            .mockReturnValueOnce(0.91)   // weight: 0.91 * 135 ≈ 123 → cleansing band (120-130)
            .mockReturnValueOnce(0.0);   // pickRandom for cleansing item

        const loot = service.generateQuestLoot(quest, character);
        const consumables = loot.filter(r => r.type === 'consumable');
        expect(consumables.length).toBe(1);
        expect(CLEANSING_IDS).toContain((consumables[0] as any).itemId);
    });

    it('drops tactical item when roll falls in tactical band (130-135)', () => {
        const character = makeCharacter({ level: 10 });
        const quest: any = {
            questId: 'test-5',
            priority: 'medium',
            questType: 'main',
            path: '/test/quest.md',
        };

        mathRandomSpy
            .mockReturnValueOnce(0.5)    // gold
            .mockReturnValueOnce(0.99)   // gear: miss
            .mockReturnValueOnce(0.0)    // consumable: hit
            .mockReturnValueOnce(0.97)   // weight: 0.97 * 135 ≈ 131 → tactical band (130-135)
            .mockReturnValueOnce(0.0);   // pickRandom for tactical item

        const loot = service.generateQuestLoot(quest, character);
        const consumables = loot.filter(r => r.type === 'consumable');
        expect(consumables.length).toBe(1);
        expect(TACTICAL_IDS).toContain((consumables[0] as any).itemId);
    });
});
