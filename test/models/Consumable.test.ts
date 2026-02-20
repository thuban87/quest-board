/**
 * Consumable Model Tests
 *
 * Unit tests for src/models/Consumable.ts:
 * - All 30 consumable definitions valid
 * - getHpPotionForLevel returns correct tier at each breakpoint
 * - getMpPotionForLevel edge cases (L1, L7, L8, L40)
 * - All helper arrays contain correct IDs
 * - ConsumableEffect enum completeness
 */

import { describe, it, expect } from 'vitest';
import {
    CONSUMABLES,
    ConsumableEffect,
    ConsumableRarity,
    getHpPotionForLevel,
    getMpPotionForLevel,
    HP_POTION_IDS,
    MP_POTION_IDS,
    STAT_ELIXIR_IDS,
    CLEANSING_IDS,
    ENCHANTMENT_IDS,
    TACTICAL_IDS,
    DROP_RATES,
} from '../../src/models/Consumable';

// =====================
// DATA INTEGRITY
// =====================

describe('Consumable Definitions', () => {
    const allIds = Object.keys(CONSUMABLES);

    it('contains exactly 30 consumable definitions', () => {
        expect(allIds.length).toBe(30);
    });

    it('all consumables have required fields', () => {
        for (const [id, def] of Object.entries(CONSUMABLES)) {
            expect(def.id, `${id} missing id`).toBe(id);
            expect(def.name, `${id} missing name`).toBeDefined();
            expect(def.description, `${id} missing description`).toBeDefined();
            expect(def.effect, `${id} missing effect`).toBeDefined();
            expect(def.rarity, `${id} missing rarity`).toBeDefined();
            expect(typeof def.effectValue, `${id} effectValue not number`).toBe('number');
            expect(def.emoji, `${id} missing emoji`).toBeDefined();
            expect(Array.isArray(def.levelRange), `${id} levelRange not array`).toBe(true);
            expect(def.levelRange).toHaveLength(2);
            expect(def.levelRange[0]).toBeLessThanOrEqual(def.levelRange[1]);
        }
    });

    it('all consumable IDs use kebab-case', () => {
        for (const id of allIds) {
            expect(id, `${id} is not kebab-case`).toMatch(/^[a-z][a-z0-9-]*$/);
        }
    });

    it('all consumable names are non-empty strings', () => {
        for (const [id, def] of Object.entries(CONSUMABLES)) {
            expect(def.name.trim().length, `${id} has empty name`).toBeGreaterThan(0);
        }
    });

    it('all consumable rarities are valid enum values', () => {
        const validRarities = Object.values(ConsumableRarity);
        for (const [id, def] of Object.entries(CONSUMABLES)) {
            expect(validRarities, `${id} has invalid rarity`).toContain(def.rarity);
        }
    });

    it('all consumable effects are valid enum values', () => {
        const validEffects = Object.values(ConsumableEffect);
        for (const [id, def] of Object.entries(CONSUMABLES)) {
            expect(validEffects, `${id} has invalid effect`).toContain(def.effect);
        }
    });

    it('id field matches object key for every consumable', () => {
        for (const [key, def] of Object.entries(CONSUMABLES)) {
            expect(def.id).toBe(key);
        }
    });
});

// =====================
// HP POTIONS
// =====================

describe('HP Potions', () => {
    const hpPotions = HP_POTION_IDS.map(id => CONSUMABLES[id]);

    it('has exactly 6 HP potion tiers', () => {
        expect(HP_POTION_IDS).toHaveLength(6);
    });

    it('all HP potion IDs exist in CONSUMABLES', () => {
        for (const id of HP_POTION_IDS) {
            expect(CONSUMABLES[id], `${id} missing from CONSUMABLES`).toBeDefined();
        }
    });

    it('all HP potions have HP_RESTORE effect', () => {
        for (const potion of hpPotions) {
            expect(potion.effect).toBe(ConsumableEffect.HP_RESTORE);
        }
    });

    it('HP potion values increase with tier', () => {
        for (let i = 1; i < hpPotions.length; i++) {
            expect(
                hpPotions[i].effectValue,
                `${hpPotions[i].id} should restore more than ${hpPotions[i - 1].id}`,
            ).toBeGreaterThan(hpPotions[i - 1].effectValue);
        }
    });

    it('HP potion values match plan specifications', () => {
        const expectedValues: Record<string, number> = {
            'hp-potion-minor': 130,
            'hp-potion-lesser': 265,
            'hp-potion-major': 450,
            'hp-potion-greater': 660,
            'hp-potion-superior': 880,
            'hp-potion-supreme': 1200,
        };

        for (const [id, expected] of Object.entries(expectedValues)) {
            expect(CONSUMABLES[id].effectValue, `${id} has wrong effectValue`).toBe(expected);
        }
    });

    it('HP potion level ranges are contiguous and non-overlapping', () => {
        // Each tier's max should be < next tier's min (or overlap by 1 at the boundary)
        for (let i = 1; i < hpPotions.length; i++) {
            const prev = hpPotions[i - 1];
            const curr = hpPotions[i];
            expect(
                prev.levelRange[1],
                `${prev.id} max level should be < ${curr.id} min level`,
            ).toBeLessThan(curr.levelRange[0]);
        }
    });

    it('all HP potions are combat usable', () => {
        for (const potion of hpPotions) {
            expect(potion.combatUsable, `${potion.id} should be combatUsable`).toBe(true);
        }
    });
});

// =====================
// MP POTIONS
// =====================

describe('MP Potions', () => {
    const mpPotions = MP_POTION_IDS.map(id => CONSUMABLES[id]);

    it('has exactly 6 MP potion tiers', () => {
        expect(MP_POTION_IDS).toHaveLength(6);
    });

    it('all MP potion IDs exist in CONSUMABLES', () => {
        for (const id of MP_POTION_IDS) {
            expect(CONSUMABLES[id], `${id} missing from CONSUMABLES`).toBeDefined();
        }
    });

    it('all MP potions have MANA_RESTORE effect', () => {
        for (const potion of mpPotions) {
            expect(potion.effect).toBe(ConsumableEffect.MANA_RESTORE);
        }
    });

    it('MP potion values increase with tier', () => {
        for (let i = 1; i < mpPotions.length; i++) {
            expect(
                mpPotions[i].effectValue,
                `${mpPotions[i].id} should restore more than ${mpPotions[i - 1].id}`,
            ).toBeGreaterThan(mpPotions[i - 1].effectValue);
        }
    });

    it('MP potion values match plan specifications', () => {
        const expectedValues: Record<string, number> = {
            'mp-potion-minor': 35,
            'mp-potion-lesser': 60,
            'mp-potion-major': 100,
            'mp-potion-greater': 150,
            'mp-potion-superior': 200,
            'mp-potion-supreme': 270,
        };

        for (const [id, expected] of Object.entries(expectedValues)) {
            expect(CONSUMABLES[id].effectValue, `${id} has wrong effectValue`).toBe(expected);
        }
    });
});

// =====================
// getHpPotionForLevel
// =====================

describe('getHpPotionForLevel', () => {
    it('returns minor for levels 1-7', () => {
        expect(getHpPotionForLevel(1)).toBe('hp-potion-minor');
        expect(getHpPotionForLevel(4)).toBe('hp-potion-minor');
        expect(getHpPotionForLevel(7)).toBe('hp-potion-minor');
    });

    it('returns lesser for levels 8-15', () => {
        expect(getHpPotionForLevel(8)).toBe('hp-potion-lesser');
        expect(getHpPotionForLevel(12)).toBe('hp-potion-lesser');
        expect(getHpPotionForLevel(15)).toBe('hp-potion-lesser');
    });

    it('returns major for levels 16-23', () => {
        expect(getHpPotionForLevel(16)).toBe('hp-potion-major');
        expect(getHpPotionForLevel(20)).toBe('hp-potion-major');
        expect(getHpPotionForLevel(23)).toBe('hp-potion-major');
    });

    it('returns greater for levels 24-31', () => {
        expect(getHpPotionForLevel(24)).toBe('hp-potion-greater');
        expect(getHpPotionForLevel(28)).toBe('hp-potion-greater');
        expect(getHpPotionForLevel(31)).toBe('hp-potion-greater');
    });

    it('returns superior for levels 32-39', () => {
        expect(getHpPotionForLevel(32)).toBe('hp-potion-superior');
        expect(getHpPotionForLevel(35)).toBe('hp-potion-superior');
        expect(getHpPotionForLevel(39)).toBe('hp-potion-superior');
    });

    it('returns supreme for level 40+', () => {
        expect(getHpPotionForLevel(40)).toBe('hp-potion-supreme');
        expect(getHpPotionForLevel(50)).toBe('hp-potion-supreme');
    });

    it('handles edge case: level 0 returns minor', () => {
        expect(getHpPotionForLevel(0)).toBe('hp-potion-minor');
    });

    it('returns a valid CONSUMABLES key at every breakpoint', () => {
        const breakpoints = [1, 7, 8, 15, 16, 23, 24, 31, 32, 39, 40];
        for (const level of breakpoints) {
            const id = getHpPotionForLevel(level);
            expect(CONSUMABLES[id], `No consumable found for ${id} at level ${level}`).toBeDefined();
        }
    });
});

// =====================
// getMpPotionForLevel
// =====================

describe('getMpPotionForLevel', () => {
    it('returns minor for levels 1-7', () => {
        expect(getMpPotionForLevel(1)).toBe('mp-potion-minor');
        expect(getMpPotionForLevel(7)).toBe('mp-potion-minor');
    });

    it('returns lesser for levels 8-15', () => {
        expect(getMpPotionForLevel(8)).toBe('mp-potion-lesser');
        expect(getMpPotionForLevel(15)).toBe('mp-potion-lesser');
    });

    it('returns major for levels 16-23', () => {
        expect(getMpPotionForLevel(16)).toBe('mp-potion-major');
        expect(getMpPotionForLevel(23)).toBe('mp-potion-major');
    });

    it('returns greater for levels 24-31', () => {
        expect(getMpPotionForLevel(24)).toBe('mp-potion-greater');
        expect(getMpPotionForLevel(31)).toBe('mp-potion-greater');
    });

    it('returns superior for levels 32-39', () => {
        expect(getMpPotionForLevel(32)).toBe('mp-potion-superior');
        expect(getMpPotionForLevel(39)).toBe('mp-potion-superior');
    });

    it('returns supreme for level 40+', () => {
        expect(getMpPotionForLevel(40)).toBe('mp-potion-supreme');
    });

    it('handles edge case: level 0 returns minor', () => {
        expect(getMpPotionForLevel(0)).toBe('mp-potion-minor');
    });
});

// =====================
// STAT ELIXIRS
// =====================

describe('Stat Elixirs', () => {
    it('has exactly 6 stat elixir IDs', () => {
        expect(STAT_ELIXIR_IDS).toHaveLength(6);
    });

    it('all stat elixir IDs exist in CONSUMABLES', () => {
        for (const id of STAT_ELIXIR_IDS) {
            expect(CONSUMABLES[id], `${id} missing from CONSUMABLES`).toBeDefined();
        }
    });

    it('all stat elixirs have STAT_BOOST effect', () => {
        for (const id of STAT_ELIXIR_IDS) {
            expect(CONSUMABLES[id].effect).toBe(ConsumableEffect.STAT_BOOST);
        }
    });

    it('all stat elixirs have minLevel 10', () => {
        for (const id of STAT_ELIXIR_IDS) {
            expect(CONSUMABLES[id].minLevel, `${id} missing minLevel`).toBe(10);
        }
    });

    it('all stat elixirs have 60 minute duration', () => {
        for (const id of STAT_ELIXIR_IDS) {
            expect(CONSUMABLES[id].realTimeDurationMinutes).toBe(60);
        }
    });

    it('all stat elixirs boost 10%', () => {
        for (const id of STAT_ELIXIR_IDS) {
            expect(CONSUMABLES[id].effectValue).toBe(0.10);
        }
    });

    it('each stat elixir targets a unique stat', () => {
        const targets = STAT_ELIXIR_IDS.map(id => CONSUMABLES[id].statTarget);
        const uniqueTargets = new Set(targets);
        expect(uniqueTargets.size).toBe(6);
    });

    it('stat elixirs cover all 6 stats', () => {
        const expectedStats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        const actualStats = STAT_ELIXIR_IDS.map(id => CONSUMABLES[id].statTarget);
        for (const stat of expectedStats) {
            expect(actualStats, `Missing stat: ${stat}`).toContain(stat);
        }
    });

    it('stat elixirs are not combat usable', () => {
        for (const id of STAT_ELIXIR_IDS) {
            expect(CONSUMABLES[id].combatUsable).toBe(false);
        }
    });
});

// =====================
// HELPER ARRAYS
// =====================

describe('Helper Arrays', () => {
    it('CLEANSING_IDS contains correct items', () => {
        expect(CLEANSING_IDS).toContain('purifying-salve');
        expect(CLEANSING_IDS).toContain('sacred-water');
        expect(CLEANSING_IDS).toHaveLength(2);
    });

    it('ENCHANTMENT_IDS contains correct items', () => {
        expect(ENCHANTMENT_IDS).toContain('oil-immolation');
        expect(ENCHANTMENT_IDS).toContain('venom-coating');
        expect(ENCHANTMENT_IDS).toContain('frostbite-tincture');
        expect(ENCHANTMENT_IDS).toHaveLength(3);
    });

    it('TACTICAL_IDS contains correct items', () => {
        expect(TACTICAL_IDS).toContain('firebomb');
        expect(TACTICAL_IDS).toContain('smoke-bomb');
        expect(TACTICAL_IDS).toContain('ironbark-ward');
        expect(TACTICAL_IDS).toHaveLength(3);
    });

    it('all helper array IDs exist in CONSUMABLES', () => {
        const allHelperIds = [
            ...HP_POTION_IDS, ...MP_POTION_IDS,
            ...STAT_ELIXIR_IDS, ...CLEANSING_IDS,
            ...ENCHANTMENT_IDS, ...TACTICAL_IDS,
        ];
        for (const id of allHelperIds) {
            expect(CONSUMABLES[id], `${id} not in CONSUMABLES`).toBeDefined();
        }
    });

    it('no ID appears in more than one helper array', () => {
        const arrays = [HP_POTION_IDS, MP_POTION_IDS, STAT_ELIXIR_IDS, CLEANSING_IDS, ENCHANTMENT_IDS, TACTICAL_IDS];
        const allIds = arrays.flat();
        const uniqueIds = new Set(allIds);
        expect(uniqueIds.size).toBe(allIds.length);
    });
});

// =====================
// ENCHANTMENT OILS
// =====================

describe('Enchantment Oils', () => {
    it('all have 5-turn duration', () => {
        for (const id of ENCHANTMENT_IDS) {
            expect(CONSUMABLES[id].turnDuration).toBe(5);
        }
    });

    it('all have minLevel 8', () => {
        for (const id of ENCHANTMENT_IDS) {
            expect(CONSUMABLES[id].minLevel).toBe(8);
        }
    });

    it('all have statusType and statusChance', () => {
        for (const id of ENCHANTMENT_IDS) {
            const def = CONSUMABLES[id];
            expect(def.statusType, `${id} missing statusType`).toBeDefined();
            expect(def.statusChance, `${id} missing statusChance`).toBeDefined();
            expect(def.statusChance).toBeGreaterThan(0);
            expect(def.statusChance).toBeLessThanOrEqual(100);
        }
    });

    it('proc chances match plan: burn 20%, poison 25%, freeze 15%', () => {
        expect(CONSUMABLES['oil-immolation'].statusChance).toBe(20);
        expect(CONSUMABLES['venom-coating'].statusChance).toBe(25);
        expect(CONSUMABLES['frostbite-tincture'].statusChance).toBe(15);
    });
});

// =====================
// TACTICAL CONSUMABLES
// =====================

describe('Tactical Consumables', () => {
    it('firebomb has damageFormula with base 40 and perLevel 8', () => {
        const fb = CONSUMABLES['firebomb'];
        expect(fb.damageFormula).toBeDefined();
        expect(fb.damageFormula?.base).toBe(40);
        expect(fb.damageFormula?.perLevel).toBe(8);
    });

    it('smoke bomb has GUARANTEED_RETREAT effect', () => {
        expect(CONSUMABLES['smoke-bomb'].effect).toBe(ConsumableEffect.GUARANTEED_RETREAT);
    });

    it('ironbark ward has stageChange with +2 def for 4 turns', () => {
        const ward = CONSUMABLES['ironbark-ward'];
        expect(ward.stageChange).toBeDefined();
        expect(ward.stageChange?.stat).toBe('def');
        expect(ward.stageChange?.stages).toBe(2);
        expect(ward.turnDuration).toBe(4);
    });

    it('all tactical items are combat usable', () => {
        for (const id of TACTICAL_IDS) {
            expect(CONSUMABLES[id].combatUsable).toBe(true);
        }
    });
});

// =====================
// SPECIAL ITEMS
// =====================

describe('Special Items', () => {
    it('phoenix tear revives with 30% HP', () => {
        const tear = CONSUMABLES['phoenix-tear'];
        expect(tear.effect).toBe(ConsumableEffect.PHOENIX_REVIVE);
        expect(tear.effectValue).toBe(0.30);
        expect(tear.rarity).toBe(ConsumableRarity.EPIC);
    });

    it('scroll of pardon restores streaks', () => {
        const scroll = CONSUMABLES['scroll-of-pardon'];
        expect(scroll.effect).toBe(ConsumableEffect.STREAK_RESTORE);
        expect(scroll.combatUsable).toBe(false);
    });

    it('elixir of experience gives 20% XP boost', () => {
        const elixir = CONSUMABLES['elixir-of-experience'];
        expect(elixir.effect).toBe(ConsumableEffect.XP_BOOST);
        expect(elixir.effectValue).toBe(1.2);
        expect(elixir.combatUsable).toBe(false);
    });

    it('revive potion revives with 25% HP', () => {
        const revive = CONSUMABLES['revive-potion'];
        expect(revive.effect).toBe(ConsumableEffect.REVIVE);
        expect(revive.effectValue).toBe(0.25);
        expect(revive.combatUsable).toBe(false);
    });
});

// =====================
// DROP RATES
// =====================

describe('Drop Rates', () => {
    it('all rarities have a drop rate', () => {
        for (const rarity of Object.values(ConsumableRarity)) {
            expect(DROP_RATES[rarity], `${rarity} missing drop rate`).toBeDefined();
            expect(DROP_RATES[rarity]).toBeGreaterThan(0);
        }
    });

    it('rarer items have lower drop rates', () => {
        expect(DROP_RATES[ConsumableRarity.COMMON]).toBeGreaterThan(DROP_RATES[ConsumableRarity.ADEPT]);
        expect(DROP_RATES[ConsumableRarity.ADEPT]).toBeGreaterThan(DROP_RATES[ConsumableRarity.MASTER]);
        expect(DROP_RATES[ConsumableRarity.MASTER]).toBeGreaterThan(DROP_RATES[ConsumableRarity.EPIC]);
    });
});
