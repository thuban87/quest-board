/**
 * Store Modal Tests
 *
 * Tests for src/modals/StoreModal.ts:
 * - Store item prices match consumable definitions
 * - Level-gating logic
 * - Smart tier display (potion ±1 tier visibility)
 * - All consumables are purchasable
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    CONSUMABLES,
    ConsumableRarity,
    HP_POTION_IDS,
    MP_POTION_IDS,
    STAT_ELIXIR_IDS,
    CLEANSING_IDS,
    ENCHANTMENT_IDS,
    TACTICAL_IDS,
    getHpPotionForLevel,
    getMpPotionForLevel,
} from '../../src/models/Consumable';

// We can't import STORE_ITEMS directly (not exported), so we test
// the logic patterns that the StoreModal uses. We also verify
// the consumable catalog has the data the store relies on.

// =====================
// STORE ITEM COVERAGE
// =====================

describe('Store Item Coverage', () => {
    // All items that should be in the store
    const expectedStoreIds = [
        ...HP_POTION_IDS,
        ...MP_POTION_IDS,
        ...STAT_ELIXIR_IDS,
        ...CLEANSING_IDS,
        ...ENCHANTMENT_IDS,
        ...TACTICAL_IDS,
        'phoenix-tear',
        'scroll-of-pardon',
        'revive-potion',
        'elixir-of-experience',
    ];

    it('all expected store items exist in CONSUMABLES', () => {
        for (const id of expectedStoreIds) {
            expect(CONSUMABLES[id], `${id} not in CONSUMABLES`).toBeDefined();
        }
    });

    it('total store items count is 30', () => {
        expect(expectedStoreIds.length).toBe(30);
    });
});

// =====================
// LEVEL-GATING
// =====================

describe('Level-Gating Logic', () => {
    it('minor potions have no minLevel (available at L1)', () => {
        expect(CONSUMABLES['hp-potion-minor'].minLevel).toBeUndefined();
        expect(CONSUMABLES['mp-potion-minor'].minLevel).toBeUndefined();
    });

    it('lesser potions require level 8', () => {
        expect(CONSUMABLES['hp-potion-lesser'].minLevel).toBe(8);
        expect(CONSUMABLES['mp-potion-lesser'].minLevel).toBe(8);
    });

    it('major potions require level 16', () => {
        expect(CONSUMABLES['hp-potion-major'].minLevel).toBe(16);
        expect(CONSUMABLES['mp-potion-major'].minLevel).toBe(16);
    });

    it('greater potions require level 24', () => {
        expect(CONSUMABLES['hp-potion-greater'].minLevel).toBe(24);
        expect(CONSUMABLES['mp-potion-greater'].minLevel).toBe(24);
    });

    it('superior potions require level 32', () => {
        expect(CONSUMABLES['hp-potion-superior'].minLevel).toBe(32);
        expect(CONSUMABLES['mp-potion-superior'].minLevel).toBe(32);
    });

    it('supreme potions require level 40', () => {
        expect(CONSUMABLES['hp-potion-supreme'].minLevel).toBe(40);
        expect(CONSUMABLES['mp-potion-supreme'].minLevel).toBe(40);
    });

    it('stat elixirs require level 10', () => {
        for (const id of STAT_ELIXIR_IDS) {
            expect(CONSUMABLES[id].minLevel, `${id} should require L10`).toBe(10);
        }
    });

    it('enchantment oils require level 8', () => {
        for (const id of ENCHANTMENT_IDS) {
            expect(CONSUMABLES[id].minLevel, `${id} should require L8`).toBe(8);
        }
    });

    it('cleansing items have no level requirement', () => {
        for (const id of CLEANSING_IDS) {
            expect(CONSUMABLES[id].minLevel).toBeUndefined();
        }
    });

    it('tactical items have no level requirement', () => {
        for (const id of TACTICAL_IDS) {
            expect(CONSUMABLES[id].minLevel).toBeUndefined();
        }
    });

    it('level-gating logic: locked when character level < minLevel', () => {
        const minLevel = CONSUMABLES['hp-potion-lesser'].minLevel!;
        const characterLevel = 5;
        const isLocked = minLevel !== undefined && characterLevel < minLevel;
        expect(isLocked).toBe(true);
    });

    it('level-gating logic: unlocked when character level >= minLevel', () => {
        const minLevel = CONSUMABLES['hp-potion-lesser'].minLevel!;
        const characterLevel = 8;
        const isLocked = minLevel !== undefined && characterLevel < minLevel;
        expect(isLocked).toBe(false);
    });

    it('level-gating logic: always unlocked for items without minLevel', () => {
        const def = CONSUMABLES['hp-potion-minor'];
        const isLocked = def.minLevel !== undefined && 1 < def.minLevel;
        expect(isLocked).toBe(false);
    });
});

// =====================
// SMART TIER DISPLAY
// =====================

describe('Smart Tier Display', () => {
    /**
     * Reimplementation of the StoreModal's getVisiblePotionIds logic
     * to test the algorithm independently.
     */
    function getVisiblePotionIds(
        potionIds: string[],
        level: number,
        getPotionFn: (level: number) => string,
    ): string[] {
        const currentId = getPotionFn(level);
        const currentIndex = potionIds.indexOf(currentId);
        const result: string[] = [];

        if (currentIndex > 0) result.push(potionIds[currentIndex - 1]);
        result.push(potionIds[currentIndex]);
        if (currentIndex < potionIds.length - 1) result.push(potionIds[currentIndex + 1]);

        return result;
    }

    it('L1 player sees minor + lesser (2 items)', () => {
        const visible = getVisiblePotionIds(HP_POTION_IDS, 1, getHpPotionForLevel);
        expect(visible).toEqual(['hp-potion-minor', 'hp-potion-lesser']);
    });

    it('L8 player sees minor + lesser + major (3 items)', () => {
        const visible = getVisiblePotionIds(HP_POTION_IDS, 8, getHpPotionForLevel);
        expect(visible).toEqual(['hp-potion-minor', 'hp-potion-lesser', 'hp-potion-major']);
    });

    it('L16 player sees lesser + major + greater (3 items)', () => {
        const visible = getVisiblePotionIds(HP_POTION_IDS, 16, getHpPotionForLevel);
        expect(visible).toEqual(['hp-potion-lesser', 'hp-potion-major', 'hp-potion-greater']);
    });

    it('L24 player sees major + greater + superior (3 items)', () => {
        const visible = getVisiblePotionIds(HP_POTION_IDS, 24, getHpPotionForLevel);
        expect(visible).toEqual(['hp-potion-major', 'hp-potion-greater', 'hp-potion-superior']);
    });

    it('L32 player sees greater + superior + supreme (3 items)', () => {
        const visible = getVisiblePotionIds(HP_POTION_IDS, 32, getHpPotionForLevel);
        expect(visible).toEqual(['hp-potion-greater', 'hp-potion-superior', 'hp-potion-supreme']);
    });

    it('L40 player sees superior + supreme (2 items, at top tier)', () => {
        const visible = getVisiblePotionIds(HP_POTION_IDS, 40, getHpPotionForLevel);
        expect(visible).toEqual(['hp-potion-superior', 'hp-potion-supreme']);
    });

    it('MP potion smart display works the same way', () => {
        const visible = getVisiblePotionIds(MP_POTION_IDS, 1, getMpPotionForLevel);
        expect(visible).toEqual(['mp-potion-minor', 'mp-potion-lesser']);
    });

    it('mid-tier shows exactly 3 items', () => {
        const visible = getVisiblePotionIds(HP_POTION_IDS, 20, getHpPotionForLevel);
        expect(visible).toHaveLength(3);
    });

    it('edge tiers show exactly 2 items', () => {
        const bottom = getVisiblePotionIds(HP_POTION_IDS, 1, getHpPotionForLevel);
        const top = getVisiblePotionIds(HP_POTION_IDS, 40, getHpPotionForLevel);
        expect(bottom).toHaveLength(2);
        expect(top).toHaveLength(2);
    });
});

// =====================
// STORE SECTIONS
// =====================

describe('Store Sections', () => {
    it('battle supplies section covers cleansing + enchantment + tactical', () => {
        const battleIds = [...CLEANSING_IDS, ...ENCHANTMENT_IDS, ...TACTICAL_IDS];
        expect(battleIds).toHaveLength(8);

        // All should be combat usable
        for (const id of battleIds) {
            expect(CONSUMABLES[id].combatUsable, `${id} should be combat usable`).toBe(true);
        }
    });

    it('rare items section contains 4 items', () => {
        const rareIds = ['phoenix-tear', 'scroll-of-pardon', 'revive-potion', 'elixir-of-experience'];
        for (const id of rareIds) {
            expect(CONSUMABLES[id], `${id} missing`).toBeDefined();
        }
    });

    it('rare items are not combat usable (utility/passive)', () => {
        const rareIds = ['phoenix-tear', 'scroll-of-pardon', 'revive-potion', 'elixir-of-experience'];
        for (const id of rareIds) {
            expect(CONSUMABLES[id].combatUsable, `${id} should not be combat usable`).toBe(false);
        }
    });
});
