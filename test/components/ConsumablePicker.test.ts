/**
 * ConsumablePicker Tests — Phase 4.5
 *
 * Tests for the categorized ConsumablePicker grouping logic
 * in src/components/BattleView.tsx.
 *
 * ConsumablePicker is a non-exported local component, so we re-implement
 * the pure categorization logic here (same approach used for
 * getVisiblePotionIds in StoreModal.test.ts).
 *
 * Coverage target: category grouping, empty category filtering,
 * combat-usable filtering, type class assignment
 */

import { describe, it, expect } from 'vitest';
import {
    CONSUMABLES,
    ConsumableEffect,
    HP_POTION_IDS,
    MP_POTION_IDS,
    CLEANSING_IDS,
    ENCHANTMENT_IDS,
    TACTICAL_IDS,
} from '../../src/models/Consumable';

// =====================
// HELPERS
// =====================

/** Inventory item shape matching the characterStore format */
interface InventoryItem {
    itemId: string;
    quantity: number;
}

/** All combat-usable effect types (mirrors ConsumablePicker) */
const COMBAT_EFFECTS = [
    ConsumableEffect.HP_RESTORE,
    ConsumableEffect.MANA_RESTORE,
    ConsumableEffect.CLEANSE_DOT,
    ConsumableEffect.CLEANSE_CURSE_CC,
    ConsumableEffect.DIRECT_DAMAGE,
    ConsumableEffect.GUARANTEED_RETREAT,
    ConsumableEffect.DEF_STAGE_BOOST,
    ConsumableEffect.ENCHANT_BURN,
    ConsumableEffect.ENCHANT_POISON,
    ConsumableEffect.ENCHANT_FREEZE,
];

/** Category set lookup (mirrors ConsumablePicker) */
const potionIds = new Set([...HP_POTION_IDS, ...MP_POTION_IDS]);
const cleansingIds = new Set(CLEANSING_IDS);
const enchantmentIds = new Set(ENCHANTMENT_IDS);
const tacticalIds = new Set(TACTICAL_IDS);

/**
 * Re-implementation of ConsumablePicker's categorization logic.
 * Returns array of categories with non-empty item lists.
 */
function categorizeConsumables(inventory: InventoryItem[]) {
    // Filter to combat-usable items
    const available = inventory.filter(item => {
        const def = CONSUMABLES[item.itemId];
        if (!def) return false;
        return def.combatUsable !== false && COMBAT_EFFECTS.includes(def.effect);
    });

    // Group into categories
    return [
        { label: 'Potions', items: available.filter(i => potionIds.has(i.itemId)) },
        { label: 'Cleansing', items: available.filter(i => cleansingIds.has(i.itemId)) },
        { label: 'Enchantments', items: available.filter(i => enchantmentIds.has(i.itemId)) },
        { label: 'Tactical', items: available.filter(i => tacticalIds.has(i.itemId)) },
    ].filter(cat => cat.items.length > 0);
}

/**
 * Re-implementation of ConsumablePicker's type class logic.
 */
function getTypeClass(itemId: string): string {
    if (enchantmentIds.has(itemId)) return 'qb-type-enchantment';
    if (tacticalIds.has(itemId)) return 'qb-type-tactical';
    return '';
}

// =====================
// CATEGORY GROUPING
// =====================

describe('ConsumablePicker — category grouping', () => {
    it('groups HP potions into Potions category', () => {
        const inventory: InventoryItem[] = [
            { itemId: 'hp-potion-minor', quantity: 3 },
        ];

        const categories = categorizeConsumables(inventory);
        expect(categories).toHaveLength(1);
        expect(categories[0].label).toBe('Potions');
        expect(categories[0].items).toHaveLength(1);
    });

    it('groups MP potions into Potions category', () => {
        const inventory: InventoryItem[] = [
            { itemId: 'mp-potion-minor', quantity: 2 },
        ];

        const categories = categorizeConsumables(inventory);
        expect(categories).toHaveLength(1);
        expect(categories[0].label).toBe('Potions');
    });

    it('groups cleansing items into Cleansing category', () => {
        const inventory: InventoryItem[] = [
            { itemId: 'purifying-salve', quantity: 1 },
        ];

        const categories = categorizeConsumables(inventory);
        expect(categories).toHaveLength(1);
        expect(categories[0].label).toBe('Cleansing');
    });

    it('groups enchantment oils into Enchantments category', () => {
        const inventory: InventoryItem[] = [
            { itemId: 'oil-immolation', quantity: 1 },
        ];

        const categories = categorizeConsumables(inventory);
        expect(categories).toHaveLength(1);
        expect(categories[0].label).toBe('Enchantments');
    });

    it('groups tactical items into Tactical category', () => {
        const inventory: InventoryItem[] = [
            { itemId: 'firebomb', quantity: 2 },
            { itemId: 'smoke-bomb', quantity: 1 },
        ];

        const categories = categorizeConsumables(inventory);
        expect(categories).toHaveLength(1);
        expect(categories[0].label).toBe('Tactical');
        expect(categories[0].items).toHaveLength(2);
    });

    it('creates multiple categories when items span groups', () => {
        const inventory: InventoryItem[] = [
            { itemId: 'hp-potion-minor', quantity: 5 },
            { itemId: 'purifying-salve', quantity: 1 },
            { itemId: 'oil-immolation', quantity: 1 },
            { itemId: 'firebomb', quantity: 3 },
        ];

        const categories = categorizeConsumables(inventory);
        expect(categories).toHaveLength(4);
        expect(categories.map(c => c.label)).toEqual([
            'Potions', 'Cleansing', 'Enchantments', 'Tactical',
        ]);
    });
});

// =====================
// EMPTY CATEGORY FILTERING
// =====================

describe('ConsumablePicker — empty category filtering', () => {
    it('hides empty categories', () => {
        const inventory: InventoryItem[] = [
            { itemId: 'hp-potion-minor', quantity: 1 },
            { itemId: 'firebomb', quantity: 1 },
        ];

        const categories = categorizeConsumables(inventory);
        expect(categories).toHaveLength(2);
        expect(categories.map(c => c.label)).toEqual(['Potions', 'Tactical']);
        // Cleansing and Enchantments are hidden
    });

    it('returns empty array when no items in inventory', () => {
        const categories = categorizeConsumables([]);
        expect(categories).toHaveLength(0);
    });
});

// =====================
// COMBAT USABILITY FILTERING
// =====================

describe('ConsumablePicker — combat usability', () => {
    it('excludes non-combat-usable items', () => {
        const inventory: InventoryItem[] = [
            { itemId: 'scroll-of-pardon', quantity: 1 },   // combatUsable: false
            { itemId: 'revive-potion', quantity: 1 },       // combatUsable: false
            { itemId: 'elixir-of-experience', quantity: 1 },// combatUsable: false
            { itemId: 'hp-potion-minor', quantity: 1 },     // combatUsable: true
        ];

        const categories = categorizeConsumables(inventory);
        // Only hp-potion-minor should appear
        expect(categories).toHaveLength(1);
        expect(categories[0].label).toBe('Potions');
        expect(categories[0].items).toHaveLength(1);
    });

    it('excludes unknown items gracefully', () => {
        const inventory: InventoryItem[] = [
            { itemId: 'nonexistent-potion', quantity: 1 },
            { itemId: 'hp-potion-minor', quantity: 1 },
        ];

        const categories = categorizeConsumables(inventory);
        expect(categories).toHaveLength(1);
        expect(categories[0].items).toHaveLength(1);
    });
});

// =====================
// TYPE CLASS ASSIGNMENT
// =====================

describe('ConsumablePicker — type class assignment', () => {
    it('assigns qb-type-enchantment to enchantment items', () => {
        for (const id of ENCHANTMENT_IDS) {
            expect(getTypeClass(id)).toBe('qb-type-enchantment');
        }
    });

    it('assigns qb-type-tactical to tactical items', () => {
        for (const id of TACTICAL_IDS) {
            expect(getTypeClass(id)).toBe('qb-type-tactical');
        }
    });

    it('assigns empty string to potions and cleansing items', () => {
        expect(getTypeClass('hp-potion-minor')).toBe('');
        expect(getTypeClass('purifying-salve')).toBe('');
    });
});
