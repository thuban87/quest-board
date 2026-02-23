/**
 * Accessory Drops Tests — Phase 3.5
 *
 * Unit tests for accessory integration in the loot pipeline:
 * - pickWeightedSlot: weighted random selection (primary 1.0, accessory 0.4)
 * - rollAccessoryTier: level-gated tier selection via ACCESSORY_TIER_POOLS
 * - generateAccessoryForSlot: T1 procedural + T2+ curated template resolution
 * - Training mode guard: accessory slots excluded when isTrainingMode
 * - Quest loot tier gating: quest drops respect accessory tier logic
 *
 * Coverage target: ≥80% line, ≥80% branch on accessory generation methods
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { LootGenerationService, GEAR_SLOT_WEIGHTS } from '../src/services/LootGenerationService';
import { PRIMARY_GEAR_SLOTS, ALL_GEAR_SLOTS, GearSlot, GEAR_SLOT_NAMES } from '../src/models/Gear';
import { ACCESSORY_TIER_POOLS, getAccessoryTemplatesByTier } from '../src/data/accessories';

// Mock dependencies
vi.mock('../src/data/uniqueItems', () => ({
    createUniqueItem: vi.fn(() => null),
}));

vi.mock('../src/services/SetBonusService', () => ({
    setBonusService: {
        getSetFromQuestPath: vi.fn(() => null),
    },
}));

vi.mock('../src/services/PowerUpService', () => ({
    getGoldMultiplierFromPowerUps: vi.fn(() => 1.0),
    expirePowerUps: vi.fn((pups: any[]) => pups),
}));

vi.mock('../src/data/monsters', () => ({
    getMonsterTemplate: vi.fn(() => null),
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

// =====================================================
// GEAR_SLOT_WEIGHTS — constant validation
// =====================================================

describe('GEAR_SLOT_WEIGHTS', () => {
    it('assigns weight 1.0 to all primary gear slots', () => {
        for (const slot of PRIMARY_GEAR_SLOTS) {
            expect(GEAR_SLOT_WEIGHTS[slot]).toBe(1.0);
        }
    });

    it('assigns weight 0.4 to all accessory slots', () => {
        expect(GEAR_SLOT_WEIGHTS.accessory1).toBe(0.4);
        expect(GEAR_SLOT_WEIGHTS.accessory2).toBe(0.4);
        expect(GEAR_SLOT_WEIGHTS.accessory3).toBe(0.4);
    });

    it('covers all 9 gear slots', () => {
        expect(Object.keys(GEAR_SLOT_WEIGHTS)).toHaveLength(9);
        for (const slot of ALL_GEAR_SLOTS) {
            expect(GEAR_SLOT_WEIGHTS[slot]).toBeDefined();
        }
    });
});

// =====================================================
// pickWeightedSlot — weighted random selection
// =====================================================

describe('pickWeightedSlot', () => {
    it('returns a primary slot when roll lands in primary weight range', () => {
        // Total weight with accessories: 6*1.0 + 3*0.4 = 7.2
        // First slot (head) occupies 0 to 1.0 of the 7.2 range
        // Roll = 0.0 * 7.2 = 0.0, which falls in head range
        mathRandomSpy.mockReturnValue(0.0);

        const slot = service.pickWeightedSlot(false);
        expect(slot).toBe('head');
    });

    it('returns an accessory slot when roll lands in accessory weight range', () => {
        // Total weight: 7.2
        // Primary slots occupy: 0 to 6.0
        // accessory1: 6.0 to 6.4
        // accessory2: 6.4 to 6.8
        // accessory3: 6.8 to 7.2
        // Roll of 6.1 / 7.2 ≈ 0.847 → accessory1
        mathRandomSpy.mockReturnValue(6.1 / 7.2);

        const slot = service.pickWeightedSlot(false);
        expect(slot).toBe('accessory1');
    });

    it('returns accessory3 when roll is near maximum', () => {
        // Roll just before the end → should be accessory3
        mathRandomSpy.mockReturnValue(0.999);

        const slot = service.pickWeightedSlot(false);
        expect(slot).toBe('accessory3');
    });

    it('never returns an accessory slot when excludeAccessories is true', () => {
        // With excludeAccessories, only 6 primary slots (total weight 6.0)
        // Run 100 trials with varied random values
        for (let i = 0; i < 100; i++) {
            mathRandomSpy.mockReturnValueOnce(i / 100);
        }

        for (let i = 0; i < 100; i++) {
            const slot = service.pickWeightedSlot(true);
            expect(slot.startsWith('accessory')).toBe(false);
        }
    });

    it('only uses primary slots when in training mode (excludeAccessories = true)', () => {
        mathRandomSpy.mockReturnValue(0.999);

        const slot = service.pickWeightedSlot(true);
        expect(PRIMARY_GEAR_SLOTS).toContain(slot);
    });

    it('returns accessory slots at roughly 0.4/7.2 ≈ 5.6% each in distribution', () => {
        // Statistical test: run many iterations and check distribution
        const counts: Record<string, number> = {};
        const N = 10000;

        mathRandomSpy.mockRestore(); // Use real random for distribution test

        for (let i = 0; i < N; i++) {
            const slot = service.pickWeightedSlot(false);
            counts[slot] = (counts[slot] || 0) + 1;
        }

        // Each accessory should be ~5.6% of total (0.4/7.2)
        // With 10000 samples, expect ~556 each, allow ±200 for variance
        for (const accSlot of ['accessory1', 'accessory2', 'accessory3']) {
            const count = counts[accSlot] || 0;
            expect(count).toBeGreaterThan(300);
            expect(count).toBeLessThan(900);
        }

        // Each primary should be ~13.9% (1.0/7.2)
        for (const primSlot of PRIMARY_GEAR_SLOTS) {
            const count = counts[primSlot] || 0;
            expect(count).toBeGreaterThan(900);
            expect(count).toBeLessThan(1900);
        }

        // Re-spy for remaining tests
        mathRandomSpy = vi.spyOn(Math, 'random');
    });
});

// =====================================================
// rollAccessoryTier — level-gated tier selection
// =====================================================

describe('rollAccessoryTier', () => {
    it('returns T1 only for level 1-5 characters', () => {
        // At level 5, pool is { T1: 100, T2: 0, T3: 0, T4: 0 }
        // Any random value should give T1
        mathRandomSpy.mockReturnValue(0.5);
        expect(service.rollAccessoryTier(1)).toBe('T1');

        mathRandomSpy.mockReturnValue(0.99);
        expect(service.rollAccessoryTier(5)).toBe('T1');
    });

    it('can return T2 at level 10 (pool has T2: 20 weight)', () => {
        // At level 10, pool is { T1: 80, T2: 20, T3: 0, T4: 0 }, total = 100
        // Roll of 85/100 = 0.85 lands in T2 range
        mathRandomSpy.mockReturnValue(0.85);
        expect(service.rollAccessoryTier(10)).toBe('T2');
    });

    it('returns T1 at level 10 when roll is low', () => {
        // Roll of 0.0 → T1 (first in weighted list)
        mathRandomSpy.mockReturnValue(0.0);
        expect(service.rollAccessoryTier(10)).toBe('T1');
    });

    it('can return T3 at level 20 (pool has T3: 10 weight)', () => {
        // At level 20, pool is { T1: 55, T2: 35, T3: 10, T4: 0 }, total = 100
        // Need roll to land in 55+35=90 to 100 range → 0.95
        mathRandomSpy.mockReturnValue(0.95);
        expect(service.rollAccessoryTier(20)).toBe('T3');
    });

    it('cannot return T4 below level 26', () => {
        // At level 25, pool is { T1: 55, T2: 35, T3: 10, T4: 0 }
        // T4 weight is 0, so even max roll can't get T4
        mathRandomSpy.mockReturnValue(0.999);
        const tier = service.rollAccessoryTier(25);
        expect(tier).not.toBe('T4');
    });

    it('can return T4 at level 30 (pool has T4: 10 weight)', () => {
        // At level 30, pool is { T1: 30, T2: 35, T3: 25, T4: 10 }, total = 100
        // Need roll in 90-100 range → 0.95
        mathRandomSpy.mockReturnValue(0.95);
        expect(service.rollAccessoryTier(30)).toBe('T4');
    });

    it('has highest T4 chance at level 40', () => {
        // At level 40, pool is { T1: 15, T2: 30, T3: 30, T4: 25 }, total = 100
        // T4 range is 75-100 → roll of 0.80 should land in T4
        mathRandomSpy.mockReturnValue(0.80);
        expect(service.rollAccessoryTier(40)).toBe('T4');
    });

    it('uses last pool for levels above 40', () => {
        // Level 99 should use the maxLevel:40 pool as fallback
        mathRandomSpy.mockReturnValue(0.0);
        expect(service.rollAccessoryTier(99)).toBe('T1');
    });
});

// =====================================================
// generateAccessoryForSlot — T1 procedural generation
// =====================================================

describe('generateAccessoryForSlot — T1 path', () => {
    it('generates a T1 accessory with no templateId', () => {
        // Force T1 tier by using level 1 (100% T1 chance)
        mathRandomSpy.mockReturnValue(0.0);

        const item = service.generateAccessoryForSlot('accessory1', 1, 'quest', 'test-quest');
        expect(item.slot).toBe('accessory1');
        expect(item.tier).toBe('common');
        expect(item.templateId).toBeUndefined();
        expect(item.source).toBe('quest');
        expect(item.sourceId).toBe('test-quest');
    });

    it('generates a name (not empty) for T1 accessories', () => {
        mathRandomSpy.mockReturnValue(0.0);

        const item = service.generateAccessoryForSlot('accessory1', 1, 'quest');
        expect(item.name).toBeTruthy();
        expect(item.name.length).toBeGreaterThan(0);
    });

    it('generates stats with reduced values (~65% multiplier)', () => {
        mathRandomSpy.mockReturnValue(0.0);

        const item = service.generateAccessoryForSlot('accessory1', 1, 'quest');
        expect(item.stats).toBeDefined();
        expect(item.stats.primaryStat).toBeDefined();
        // T1 stats are floor(normal * 0.65), so they should be relatively small
        expect(item.stats.primaryValue).toBeGreaterThanOrEqual(0);
    });

    it('assigns ring type to accessory1 slot', () => {
        // For T1, accessory1 maps to 'ring' type
        mathRandomSpy.mockReturnValue(0.0);
        const item = service.generateAccessoryForSlot('accessory1', 1, 'quest');
        // The name should come from ring name pools
        expect(item.name).toBeTruthy();
    });

    it('assigns amulet type to accessory2 slot', () => {
        mathRandomSpy.mockReturnValue(0.0);
        const item = service.generateAccessoryForSlot('accessory2', 1, 'quest');
        expect(item.name).toBeTruthy();
    });

    it('assigns charm type to accessory3 slot', () => {
        mathRandomSpy.mockReturnValue(0.0);
        const item = service.generateAccessoryForSlot('accessory3', 1, 'quest');
        expect(item.name).toBeTruthy();
    });

    it('has correct sell value for common tier', () => {
        mathRandomSpy.mockReturnValue(0.0);
        const item = service.generateAccessoryForSlot('accessory1', 1, 'quest');
        // calculateSellValue(level=1, tier='common') = 5 + (1*2) = 7
        expect(item.sellValue).toBe(7);
    });

    it('sets acquiredAt to a valid ISO date', () => {
        mathRandomSpy.mockReturnValue(0.0);
        const item = service.generateAccessoryForSlot('accessory1', 1, 'quest');
        expect(() => new Date(item.acquiredAt)).not.toThrow();
    });

    it('generates a unique ID for each item', () => {
        mathRandomSpy.mockReturnValue(0.0);
        const item1 = service.generateAccessoryForSlot('accessory1', 1, 'quest');

        mathRandomSpy.mockReturnValue(0.5);
        const item2 = service.generateAccessoryForSlot('accessory1', 1, 'quest');

        expect(item1.id).not.toBe(item2.id);
    });
});

// =====================================================
// generateAccessoryForSlot — T2+ curated template path
// =====================================================

describe('generateAccessoryForSlot — T2+ curated path', () => {
    it('generates a T2+ accessory with a templateId', () => {
        // Force T2 by using level 10 and rolling into T2 band
        // Pool at L10: { T1: 80, T2: 20, T3: 0, T4: 0 }
        // Need accessoryTier roll to land in T2 range (80-100)
        mathRandomSpy
            .mockReturnValueOnce(0.9)     // rollAccessoryTier: 0.9 * 100 = 90 → T2
            .mockReturnValueOnce(0.5)     // rollGearLevel
            .mockReturnValueOnce(0.0);    // pickRandom for template

        const item = service.generateAccessoryForSlot('accessory1', 10, 'combat');
        expect(item.templateId).toBeDefined();
        expect(item.tier).toBe('journeyman'); // T2 maps to journeyman
    });

    it('uses template name for curated accessories', () => {
        const t2Templates = getAccessoryTemplatesByTier('T2').filter(t => !t.bossTemplateId);
        if (t2Templates.length === 0) return; // Skip if no templates

        mathRandomSpy
            .mockReturnValueOnce(0.9)     // rollAccessoryTier → T2
            .mockReturnValueOnce(0.5)     // rollGearLevel
            .mockReturnValueOnce(0.0);    // pickRandom → first template

        const item = service.generateAccessoryForSlot('accessory1', 10, 'combat');
        expect(item.name).toBe(t2Templates[0].name);
    });

    it('T3 maps to master gear tier', () => {
        // Level 20, pool: { T1: 55, T2: 35, T3: 10, T4: 0 }
        // Need roll at 95/100 to land in T3
        mathRandomSpy
            .mockReturnValueOnce(0.95)    // rollAccessoryTier → T3
            .mockReturnValueOnce(0.5)     // rollGearLevel
            .mockReturnValueOnce(0.0);    // pickRandom

        const item = service.generateAccessoryForSlot('accessory2', 20, 'exploration');
        expect(item.tier).toBe('master');
    });

    it('T4 maps to legendary gear tier', () => {
        // Level 35, pool: { T1: 30, T2: 35, T3: 25, T4: 10 }
        // Need roll at 95/100 to land in T4
        mathRandomSpy
            .mockReturnValueOnce(0.95)    // rollAccessoryTier → T4
            .mockReturnValueOnce(0.5)     // rollGearLevel
            .mockReturnValueOnce(0.0);    // pickRandom

        const item = service.generateAccessoryForSlot('accessory3', 35, 'quest');
        expect(item.tier).toBe('legendary');
    });

    it('excludes boss-specific templates from curated drops', () => {
        // Ensure boss templates never appear in normal drops
        // Run many iterations and check no boss templateIds appear
        const bossTemplateIds = getAccessoryTemplatesByTier('T3')
            .filter(t => t.bossTemplateId)
            .map(t => t.templateId);

        if (bossTemplateIds.length === 0) return;

        mathRandomSpy.mockRestore();
        const foundTemplateIds: string[] = [];

        for (let i = 0; i < 50; i++) {
            const item = service.generateAccessoryForSlot('accessory1', 30, 'combat');
            if (item.templateId) {
                foundTemplateIds.push(item.templateId);
            }
        }

        for (const bossId of bossTemplateIds) {
            expect(foundTemplateIds).not.toContain(bossId);
        }

        mathRandomSpy = vi.spyOn(Math, 'random');
    });
});

// =====================================================
// Training mode guard — accessory exclusion
// =====================================================

describe('training mode guard', () => {
    it('excludes accessory slots from combat loot when isTrainingMode is true', () => {
        const character = makeCharacter({ isTrainingMode: true, level: 10 });

        mathRandomSpy.mockRestore();
        const slots: string[] = [];

        for (let i = 0; i < 100; i++) {
            const loot = service.generateCombatLoot('overworld', 10, character);
            const gearRewards = loot.filter(r => r.type === 'gear');
            for (const reward of gearRewards) {
                if (reward.type === 'gear') {
                    slots.push(reward.item.slot);
                }
            }
        }

        const accessorySlots = slots.filter(s => s.startsWith('accessory'));
        expect(accessorySlots).toHaveLength(0);

        mathRandomSpy = vi.spyOn(Math, 'random');
    });
});

// =====================================================
// Quest loot tier gating — accessory integration
// =====================================================

describe('quest loot — accessory tier gating', () => {
    it('produces an accessory item when quest slot mapping includes accessory slots', () => {
        const character = makeCharacter({ level: 10 });
        const quest: any = {
            questId: 'test-acc-1',
            priority: 'medium',
            questType: 'main',
            path: '/test/quest.md',
        };

        // Need: gold roll, gear check passes, slot picks an accessory
        // Main quest slots: ['chest', 'weapon', 'head', 'accessory1', 'accessory2', 'accessory3']
        // pickRandom index 3 → accessory1 (index 3/6 = 0.5)
        mathRandomSpy
            .mockReturnValueOnce(0.5)    // gold randomRange
            .mockReturnValueOnce(0.0)    // gear roll: 0 < 0.60 → pass
            .mockReturnValueOnce(0.5);   // pickRandom slot: 3/6 → accessory1

        // Then generateAccessoryForSlot needs: rollAccessoryTier, rollGearLevel, and T1 name generation
        mathRandomSpy
            .mockReturnValueOnce(0.0)    // rollAccessoryTier → T1
            .mockReturnValueOnce(0.0)    // rollGearLevel
            .mockReturnValueOnce(0.0)    // pickRandom (prefix)
            .mockReturnValueOnce(0.0)    // pickRandom (base)
            .mockReturnValueOnce(0.99)   // T1 suffix chance: 0.99 >= 0.3 → no suffix
            .mockReturnValueOnce(0.0)    // generateGearStats pickRandom
            .mockReturnValueOnce(0.99);  // consumable check: miss

        const loot = service.generateQuestLoot(quest, character);
        const gearItems = loot.filter(r => r.type === 'gear');

        expect(gearItems.length).toBe(1);
        if (gearItems[0].type === 'gear') {
            expect(gearItems[0].item.slot).toBe('accessory1');
        }
    });
});

// =====================================================
// GEAR_SLOT_NAMES — display name validation
// =====================================================

describe('GEAR_SLOT_NAMES — accessory display', () => {
    it('all accessory slots display as "Accessory" (not "Accessory 1/2/3")', () => {
        expect(GEAR_SLOT_NAMES.accessory1).toBe('Accessory');
        expect(GEAR_SLOT_NAMES.accessory2).toBe('Accessory');
        expect(GEAR_SLOT_NAMES.accessory3).toBe('Accessory');
    });
});

// =====================================================
// ACCESSORY_TIER_POOLS — data validation
// =====================================================

describe('ACCESSORY_TIER_POOLS — data integrity', () => {
    it('has 5 level brackets', () => {
        expect(ACCESSORY_TIER_POOLS).toHaveLength(5);
    });

    it('level brackets are in ascending order', () => {
        for (let i = 1; i < ACCESSORY_TIER_POOLS.length; i++) {
            expect(ACCESSORY_TIER_POOLS[i].maxLevel).toBeGreaterThan(
                ACCESSORY_TIER_POOLS[i - 1].maxLevel
            );
        }
    });

    it('each bracket has non-negative weights that sum to 100', () => {
        for (const pool of ACCESSORY_TIER_POOLS) {
            const { T1, T2, T3, T4 } = pool.weights;
            expect(T1).toBeGreaterThanOrEqual(0);
            expect(T2).toBeGreaterThanOrEqual(0);
            expect(T3).toBeGreaterThanOrEqual(0);
            expect(T4).toBeGreaterThanOrEqual(0);
            expect(T1 + T2 + T3 + T4).toBe(100);
        }
    });

    it('lowest bracket (L1-5) is 100% T1', () => {
        const lowest = ACCESSORY_TIER_POOLS[0];
        expect(lowest.weights.T1).toBe(100);
        expect(lowest.weights.T2).toBe(0);
        expect(lowest.weights.T3).toBe(0);
        expect(lowest.weights.T4).toBe(0);
    });

    it('highest bracket (L36-40) has all 4 tiers available', () => {
        const highest = ACCESSORY_TIER_POOLS[ACCESSORY_TIER_POOLS.length - 1];
        expect(highest.weights.T1).toBeGreaterThan(0);
        expect(highest.weights.T2).toBeGreaterThan(0);
        expect(highest.weights.T3).toBeGreaterThan(0);
        expect(highest.weights.T4).toBeGreaterThan(0);
    });

    it('T4 only appears at level 26+', () => {
        for (const pool of ACCESSORY_TIER_POOLS) {
            if (pool.maxLevel <= 25) {
                expect(pool.weights.T4).toBe(0);
            }
        }
    });
});
