/**
 * Accessories Data Tests
 *
 * Phase 1.5: Data integrity tests for src/data/accessories.ts
 * 
 * Test cases from brainstorm lines 379–394:
 * - All templates have valid fields
 * - No duplicate templateId values
 * - All effect types valid
 * - Stat values non-negative (unless hasNegativeEffect)
 * - Boss accessories reference valid boss IDs
 * - T1 name pools non-empty, no duplicates
 * - Registry lookup functions
 * - Lazy initialization behavior
 * - createUniqueItem() includes templateId
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    AccessoryEffectType,
    AccessoryTemplate,
    AccessoryTier,
    AccessoryType,
    ACCESSORY_TIER_POOLS,
    getAllAccessoryTemplates,
    getAccessoryTemplate,
    getAccessoryTemplatesByTier,
    generateT1AccessoryName,
    T1_NAME_POOLS,
    T1_RING_PREFIXES,
    T1_RING_BASES,
    T1_RING_SUFFIXES,
    T1_AMULET_PREFIXES,
    T1_AMULET_BASES,
    T1_AMULET_SUFFIXES,
    T1_CHARM_PREFIXES,
    T1_CHARM_BASES,
    T1_CHARM_SUFFIXES,
    _resetRegistry,
    _isRegistryInitialized,
} from '../src/data/accessories';
import { getBossTemplates } from '../src/data/monsters';
import { createUniqueItem, UNIQUE_ITEMS } from '../src/data/uniqueItems';

// =====================
// CONSTANTS
// =====================

/** All valid AccessoryEffectType values (must match union in accessories.ts) */
const VALID_EFFECT_TYPES: AccessoryEffectType[] = [
    'gold_quest', 'gold_combat', 'gold_dungeon', 'gold_sell', 'gold_daily', 'gold_all',
    'xp_quest', 'xp_combat', 'xp_dungeon', 'xp_recurring', 'xp_first_daily', 'xp_stat_gain', 'xp_all',
    'combat_crit', 'combat_dodge', 'combat_block', 'combat_phys_def', 'combat_mag_def',
    'combat_max_hp', 'combat_max_mana', 'combat_crit_damage', 'combat_attack', 'combat_fire_resist',
    'conditional_crit_above_75', 'conditional_attack_below_50',
    'proc_lifesteal', 'proc_poison_chance',
    'loot_gear_tier', 'loot_gear_drop', 'loot_set_chance', 'loot_smelt_double',
    'utility_stamina_cap', 'utility_potion_healing', 'utility_streak_shield', 'utility_boss_consumable',
    'dungeon_map_reveal', 'dungeon_golden_chest', 'dungeon_auto_revive',
    'stat_multiplier_all',
];

const VALID_ACCESSORY_TYPES: AccessoryType[] = ['ring', 'amulet', 'charm'];
const VALID_TIERS: AccessoryTier[] = ['T1', 'T2', 'T3', 'T4'];

// =====================
// DATA INTEGRITY
// =====================

describe('Accessory Template Definitions', () => {
    const allTemplates = getAllAccessoryTemplates();

    it('contains at least 50 templates', () => {
        expect(allTemplates.length).toBeGreaterThanOrEqual(50);
    });

    it('all templates have valid, non-empty templateId', () => {
        for (const t of allTemplates) {
            expect(t.templateId, `template missing templateId`).toBeDefined();
            expect(t.templateId.trim().length, `${t.templateId} has empty templateId`).toBeGreaterThan(0);
        }
    });

    it('all templates have valid, non-empty name', () => {
        for (const t of allTemplates) {
            expect(t.name, `${t.templateId} missing name`).toBeDefined();
            expect(t.name.trim().length, `${t.templateId} has empty name`).toBeGreaterThan(0);
        }
    });

    it('all templates have valid accessoryType', () => {
        for (const t of allTemplates) {
            expect(VALID_ACCESSORY_TYPES, `${t.templateId} has invalid accessoryType: ${t.accessoryType}`)
                .toContain(t.accessoryType);
        }
    });

    it('all templates have valid tier', () => {
        for (const t of allTemplates) {
            expect(VALID_TIERS, `${t.templateId} has invalid tier: ${t.tier}`)
                .toContain(t.tier);
        }
    });

    it('no curated templates use T1 tier (T1 is auto-generated only)', () => {
        for (const t of allTemplates) {
            expect(t.tier, `${t.templateId} should not be T1 — curated templates are T2+`).not.toBe('T1');
        }
    });

    it('all templates have at least one effect', () => {
        for (const t of allTemplates) {
            expect(t.effects.length, `${t.templateId} has no effects`).toBeGreaterThanOrEqual(1);
        }
    });

    it('all templates have a stats object', () => {
        for (const t of allTemplates) {
            expect(t.stats, `${t.templateId} missing stats`).toBeDefined();
            expect(typeof t.stats, `${t.templateId} stats is not an object`).toBe('object');
        }
    });
});

// =====================
// UNIQUENESS
// =====================

describe('Template ID Uniqueness', () => {
    const allTemplates = getAllAccessoryTemplates();

    it('no duplicate templateId values', () => {
        const ids = allTemplates.map(t => t.templateId);
        const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
        expect(duplicates, `Duplicate templateIds found: ${duplicates.join(', ')}`).toHaveLength(0);
    });

    it('no duplicate names', () => {
        const names = allTemplates.map(t => t.name);
        const duplicates = names.filter((name, idx) => names.indexOf(name) !== idx);
        expect(duplicates, `Duplicate names found: ${duplicates.join(', ')}`).toHaveLength(0);
    });
});

// =====================
// EFFECT VALIDATION
// =====================

describe('Accessory Effect Validation', () => {
    const allTemplates = getAllAccessoryTemplates();

    it('all effect type values are valid AccessoryEffectType members', () => {
        for (const t of allTemplates) {
            for (const effect of t.effects) {
                expect(
                    VALID_EFFECT_TYPES,
                    `${t.templateId} has invalid effect type: ${effect.type}`
                ).toContain(effect.type);
            }
        }
    });

    it('all effect values are numbers', () => {
        for (const t of allTemplates) {
            for (const effect of t.effects) {
                expect(typeof effect.value, `${t.templateId} effect ${effect.type} value is not a number`).toBe('number');
            }
        }
    });

    it('stat values are non-negative unless hasNegativeEffect is true', () => {
        for (const t of allTemplates) {
            for (const effect of t.effects) {
                if (!t.hasNegativeEffect) {
                    expect(
                        effect.value,
                        `${t.templateId} effect ${effect.type} has negative value but hasNegativeEffect is not true`
                    ).toBeGreaterThanOrEqual(0);
                }
            }
        }
    });

    it('templates with hasNegativeEffect actually have at least one negative effect', () => {
        const negativeTemplates = allTemplates.filter(t => t.hasNegativeEffect);
        for (const t of negativeTemplates) {
            const hasNegative = t.effects.some(e => e.value < 0);
            expect(hasNegative, `${t.templateId} has hasNegativeEffect=true but no negative values`).toBe(true);
        }
    });
});

// =====================
// BOSS ACCESSORIES
// =====================

describe('Boss Accessories', () => {
    const allTemplates = getAllAccessoryTemplates();
    const bossTemplates = allTemplates.filter(t => t.bossTemplateId);

    it('has 20 boss-specific accessories', () => {
        expect(bossTemplates).toHaveLength(20);
    });

    it('all boss accessories reference valid boss template IDs from monsters.ts', () => {
        const validBossIds = getBossTemplates().map(b => b.id);
        for (const t of bossTemplates) {
            expect(
                validBossIds,
                `${t.templateId} references unknown boss: ${t.bossTemplateId}`
            ).toContain(t.bossTemplateId);
        }
    });

    it('no two boss accessories reference the same boss', () => {
        const bossIds = bossTemplates.map(t => t.bossTemplateId);
        const uniqueBossIds = new Set(bossIds);
        expect(uniqueBossIds.size, 'Multiple accessories reference the same boss').toBe(bossIds.length);
    });
});

// =====================
// TIER DISTRIBUTION
// =====================

describe('Tier Distribution', () => {
    const allTemplates = getAllAccessoryTemplates();

    it('T2 templates count is 18 (17 general + 1 boss)', () => {
        expect(getAccessoryTemplatesByTier('T2')).toHaveLength(18);
    });

    it('T3 templates count is correct', () => {
        const t3 = getAccessoryTemplatesByTier('T3');
        expect(t3.length).toBeGreaterThanOrEqual(9);
    });

    it('T4 templates count is correct', () => {
        const t4 = getAccessoryTemplatesByTier('T4');
        expect(t4.length).toBeGreaterThanOrEqual(4);
    });

    it('all tiers returned by getAccessoryTemplatesByTier match the requested tier', () => {
        for (const tier of ['T2', 'T3', 'T4'] as AccessoryTier[]) {
            const templates = getAccessoryTemplatesByTier(tier);
            for (const t of templates) {
                expect(t.tier, `${t.templateId} returned for tier ${tier} but is actually ${t.tier}`).toBe(tier);
            }
        }
    });
});

// =====================
// TIER POOL VALIDATION
// =====================

describe('Accessory Tier Pools', () => {
    it('has entries for all level brackets', () => {
        expect(ACCESSORY_TIER_POOLS.length).toBe(5);
    });

    it('level brackets are ordered and non-overlapping', () => {
        for (let i = 1; i < ACCESSORY_TIER_POOLS.length; i++) {
            expect(ACCESSORY_TIER_POOLS[i].maxLevel).toBeGreaterThan(ACCESSORY_TIER_POOLS[i - 1].maxLevel);
        }
    });

    it('all weight values are non-negative', () => {
        for (const pool of ACCESSORY_TIER_POOLS) {
            for (const [tier, weight] of Object.entries(pool.weights)) {
                expect(weight, `Tier ${tier} at maxLevel ${pool.maxLevel} has negative weight`).toBeGreaterThanOrEqual(0);
            }
        }
    });

    it('each bracket weights sum to 100', () => {
        for (const pool of ACCESSORY_TIER_POOLS) {
            const sum = Object.values(pool.weights).reduce((a, b) => a + b, 0);
            expect(sum, `maxLevel ${pool.maxLevel} weights sum to ${sum}, expected 100`).toBe(100);
        }
    });

    it('lowest bracket is 100% T1', () => {
        expect(ACCESSORY_TIER_POOLS[0].weights.T1).toBe(100);
        expect(ACCESSORY_TIER_POOLS[0].weights.T2).toBe(0);
        expect(ACCESSORY_TIER_POOLS[0].weights.T3).toBe(0);
        expect(ACCESSORY_TIER_POOLS[0].weights.T4).toBe(0);
    });

    it('highest bracket has all tiers represented', () => {
        const highest = ACCESSORY_TIER_POOLS[ACCESSORY_TIER_POOLS.length - 1];
        for (const tier of VALID_TIERS) {
            expect(highest.weights[tier], `Highest bracket missing tier ${tier}`).toBeGreaterThan(0);
        }
    });
});

// =====================
// REGISTRY FUNCTIONS
// =====================

describe('Registry Functions', () => {
    it('getAccessoryTemplate returns correct template by ID', () => {
        const template = getAccessoryTemplate('merchants_signet');
        expect(template).not.toBeNull();
        expect(template!.name).toBe("Merchant's Signet");
        expect(template!.tier).toBe('T2');
    });

    it('getAccessoryTemplate returns null for unknown ID', () => {
        expect(getAccessoryTemplate('nonexistent_template')).toBeNull();
    });

    it('getAccessoryTemplate returns null for empty string', () => {
        expect(getAccessoryTemplate('')).toBeNull();
    });

    it('all templates are accessible via getAccessoryTemplate', () => {
        const allTemplates = getAllAccessoryTemplates();
        for (const t of allTemplates) {
            const retrieved = getAccessoryTemplate(t.templateId);
            expect(retrieved, `${t.templateId} not found in registry`).not.toBeNull();
            expect(retrieved!.templateId).toBe(t.templateId);
        }
    });

    it('getAccessoryTemplatesByTier returns empty array for T1 (no curated T1 items)', () => {
        expect(getAccessoryTemplatesByTier('T1')).toHaveLength(0);
    });
});

// =====================
// LAZY INITIALIZATION
// =====================

describe('Lazy Initialization', () => {
    beforeEach(() => {
        _resetRegistry();
    });

    it('registry is not initialized before first access', () => {
        expect(_isRegistryInitialized()).toBe(false);
    });

    it('registry is initialized after first getAccessoryTemplate call', () => {
        getAccessoryTemplate('merchants_signet');
        expect(_isRegistryInitialized()).toBe(true);
    });

    it('registry is initialized after first getAllAccessoryTemplates call (via getAccessoryTemplatesByTier)', () => {
        _resetRegistry();
        // getAllAccessoryTemplates doesn't use the registry, but getAccessoryTemplate does
        getAccessoryTemplate('berserkers_band');
        expect(_isRegistryInitialized()).toBe(true);
    });

    it('_resetRegistry clears the registry', () => {
        getAccessoryTemplate('merchants_signet');
        expect(_isRegistryInitialized()).toBe(true);
        _resetRegistry();
        expect(_isRegistryInitialized()).toBe(false);
    });
});

// =====================
// T1 NAME POOLS
// =====================

describe('T1 Name Pools', () => {
    it('all ring name pool arrays are non-empty', () => {
        expect(T1_RING_PREFIXES.length).toBeGreaterThan(0);
        expect(T1_RING_BASES.length).toBeGreaterThan(0);
        expect(T1_RING_SUFFIXES.length).toBeGreaterThan(0);
    });

    it('all amulet name pool arrays are non-empty', () => {
        expect(T1_AMULET_PREFIXES.length).toBeGreaterThan(0);
        expect(T1_AMULET_BASES.length).toBeGreaterThan(0);
        expect(T1_AMULET_SUFFIXES.length).toBeGreaterThan(0);
    });

    it('all charm name pool arrays are non-empty', () => {
        expect(T1_CHARM_PREFIXES.length).toBeGreaterThan(0);
        expect(T1_CHARM_BASES.length).toBeGreaterThan(0);
        expect(T1_CHARM_SUFFIXES.length).toBeGreaterThan(0);
    });

    it('ring prefixes contain no duplicates', () => {
        const unique = new Set(T1_RING_PREFIXES);
        expect(unique.size, 'Duplicate ring prefixes found').toBe(T1_RING_PREFIXES.length);
    });

    it('ring bases contain no duplicates', () => {
        const unique = new Set(T1_RING_BASES);
        expect(unique.size, 'Duplicate ring bases found').toBe(T1_RING_BASES.length);
    });

    it('ring suffixes contain no duplicates', () => {
        const unique = new Set(T1_RING_SUFFIXES);
        expect(unique.size, 'Duplicate ring suffixes found').toBe(T1_RING_SUFFIXES.length);
    });

    it('amulet prefixes contain no duplicates', () => {
        const unique = new Set(T1_AMULET_PREFIXES);
        expect(unique.size, 'Duplicate amulet prefixes found').toBe(T1_AMULET_PREFIXES.length);
    });

    it('amulet bases contain no duplicates', () => {
        const unique = new Set(T1_AMULET_BASES);
        expect(unique.size, 'Duplicate amulet bases found').toBe(T1_AMULET_BASES.length);
    });

    it('amulet suffixes contain no duplicates', () => {
        const unique = new Set(T1_AMULET_SUFFIXES);
        expect(unique.size, 'Duplicate amulet suffixes found').toBe(T1_AMULET_SUFFIXES.length);
    });

    it('charm prefixes contain no duplicates', () => {
        const unique = new Set(T1_CHARM_PREFIXES);
        expect(unique.size, 'Duplicate charm prefixes found').toBe(T1_CHARM_PREFIXES.length);
    });

    it('charm bases contain no duplicates', () => {
        const unique = new Set(T1_CHARM_BASES);
        expect(unique.size, 'Duplicate charm bases found').toBe(T1_CHARM_BASES.length);
    });

    it('charm suffixes contain no duplicates', () => {
        const unique = new Set(T1_CHARM_SUFFIXES);
        expect(unique.size, 'Duplicate charm suffixes found').toBe(T1_CHARM_SUFFIXES.length);
    });

    it('T1_NAME_POOLS has entries for all 3 accessory types', () => {
        for (const type of VALID_ACCESSORY_TYPES) {
            expect(T1_NAME_POOLS[type], `Missing name pool for ${type}`).toBeDefined();
            expect(T1_NAME_POOLS[type].prefixes.length).toBeGreaterThan(0);
            expect(T1_NAME_POOLS[type].bases.length).toBeGreaterThan(0);
            expect(T1_NAME_POOLS[type].suffixes.length).toBeGreaterThan(0);
        }
    });
});

// =====================
// T1 NAME GENERATION
// =====================

describe('generateT1AccessoryName', () => {
    it('generates a non-empty string for each accessory type', () => {
        for (const type of VALID_ACCESSORY_TYPES) {
            const name = generateT1AccessoryName(type);
            expect(name.trim().length, `Generated empty name for ${type}`).toBeGreaterThan(0);
        }
    });

    it('generated names contain at least 2 words (prefix + base)', () => {
        for (const type of VALID_ACCESSORY_TYPES) {
            // Generate many to cover both suffix and no-suffix paths
            for (let i = 0; i < 20; i++) {
                const name = generateT1AccessoryName(type);
                const words = name.split(' ');
                expect(words.length, `Generated name "${name}" has fewer than 2 words`).toBeGreaterThanOrEqual(2);
            }
        }
    });

    it('ring names use ring pool words', () => {
        const name = generateT1AccessoryName('ring');
        const words = name.split(' ');
        expect(T1_RING_PREFIXES).toContain(words[0]);
        // Second word should be a base name
        expect(T1_RING_BASES).toContain(words[1]);
    });

    it('amulet names use amulet pool words', () => {
        const name = generateT1AccessoryName('amulet');
        const words = name.split(' ');
        expect(T1_AMULET_PREFIXES).toContain(words[0]);
        expect(T1_AMULET_BASES).toContain(words[1]);
    });

    it('charm names use charm pool words', () => {
        const name = generateT1AccessoryName('charm');
        const words = name.split(' ');
        expect(T1_CHARM_PREFIXES).toContain(words[0]);
        expect(T1_CHARM_BASES).toContain(words[1]);
    });
});

// =====================
// ACHIEVEMENT ACCESSORIES (migrated from uniqueItems)
// =====================

describe('Achievement Accessories', () => {
    it('Ring of the Completionist exists in accessory templates', () => {
        const ring = getAccessoryTemplate('ring_of_completionist');
        expect(ring).not.toBeNull();
        expect(ring!.name).toBe('Ring of the Completionist');
        expect(ring!.accessoryType).toBe('ring');
        expect(ring!.tier).toBe('T4');
    });

    it('Amulet of Dedication exists in accessory templates', () => {
        const amulet = getAccessoryTemplate('amulet_of_dedication');
        expect(amulet).not.toBeNull();
        expect(amulet!.name).toBe('Amulet of Dedication');
        expect(amulet!.accessoryType).toBe('amulet');
        expect(amulet!.tier).toBe('T3');
    });

    it('Ring/Amulet are NOT in uniqueItems registry anymore', () => {
        expect(UNIQUE_ITEMS['ring_of_completionist']).toBeUndefined();
        expect(UNIQUE_ITEMS['amulet_of_dedication']).toBeUndefined();
    });
});

// =====================
// createUniqueItem() templateId
// =====================

describe('createUniqueItem templateId', () => {
    it('returns item with templateId matching the input template', () => {
        const item = createUniqueItem('goblin_kings_crown');
        expect(item).not.toBeNull();
        expect(item!.templateId).toBe('goblin_kings_crown');
    });

    it('returns item with templateId for all existing unique items', () => {
        for (const templateId of Object.keys(UNIQUE_ITEMS)) {
            const item = createUniqueItem(templateId);
            expect(item, `createUniqueItem returned null for ${templateId}`).not.toBeNull();
            expect(item!.templateId, `${templateId} missing templateId in created item`).toBe(templateId);
        }
    });

    it('returns null for unknown template', () => {
        expect(createUniqueItem('nonexistent_item')).toBeNull();
    });
});
