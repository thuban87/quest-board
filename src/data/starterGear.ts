/**
 * Starter Gear Definitions
 * 
 * Phase 3A: Default gear assigned to new characters.
 * All items are Common tier, Level 1.
 */

import { GearItem, GearSlot, generateGearId } from '../models/Gear';

/**
 * Starter gear templates (without ID/acquiredAt - added at creation time)
 */
type StarterGearTemplate = Omit<GearItem, 'id' | 'acquiredAt'>;

const STARTER_TEMPLATES: Record<GearSlot, StarterGearTemplate | null> = {
    head: {
        name: 'Cloth Hood',
        description: 'A simple cloth hood that offers minimal protection.',
        slot: 'head',
        tier: 'common',
        level: 1,
        stats: {
            primaryStat: 'wisdom',
            primaryValue: 1,
            magicDefense: 1,
        },
        sellValue: 3,
        iconEmoji: '🪖',
        source: 'starter',
    },
    chest: {
        name: 'Linen Tunic',
        description: 'A basic linen tunic. Better than nothing.',
        slot: 'chest',
        tier: 'common',
        level: 1,
        stats: {
            primaryStat: 'constitution',
            primaryValue: 2,
            defense: 2,
        },
        sellValue: 5,
        iconEmoji: '🎽',
        source: 'starter',
    },
    legs: {
        name: 'Simple Pants',
        description: 'Plain pants that provide basic coverage.',
        slot: 'legs',
        tier: 'common',
        level: 1,
        stats: {
            primaryStat: 'constitution',
            primaryValue: 1,
            defense: 1,
        },
        sellValue: 3,
        iconEmoji: '👖',
        source: 'starter',
    },
    boots: {
        name: 'Worn Sandals',
        description: 'Old sandals. They get the job done.',
        slot: 'boots',
        tier: 'common',
        level: 1,
        stats: {
            primaryStat: 'dexterity',
            primaryValue: 1,
            dodgeChance: 1,
        },
        sellValue: 3,
        iconEmoji: '🥾',
        source: 'starter',
    },
    weapon: {
        name: 'Wooden Sword',
        description: 'A practice sword made of wood. Surprisingly sturdy.',
        slot: 'weapon',
        tier: 'common',
        level: 1,
        stats: {
            primaryStat: 'strength',
            primaryValue: 2,
            attackPower: 3,
        },
        sellValue: 5,
        iconEmoji: '⚔️',
        source: 'starter',
    },
    shield: {
        name: 'Wooden Buckler',
        description: 'A small wooden shield. Blocks some attacks.',
        slot: 'shield',
        tier: 'common',
        level: 1,
        stats: {
            primaryStat: 'constitution',
            primaryValue: 1,
            defense: 1,
            blockChance: 5,
        },
        sellValue: 4,
        iconEmoji: '🛡️',
        source: 'starter',
    },
    // Accessories start empty
    accessory1: null,
    accessory2: null,
    accessory3: null,
};

/**
 * Generate a starter gear item for a specific slot.
 * Returns null for accessory slots (they start empty).
 */
export function generateStarterGear(slot: GearSlot): GearItem | null {
    const template = STARTER_TEMPLATES[slot];
    if (!template) return null;

    return {
        ...template,
        id: generateGearId(),
        acquiredAt: new Date().toISOString(),
    };
}

/**
 * Generate all starter gear for a new character.
 * Returns an array of 6 items (armor slots only).
 */
export function generateAllStarterGear(): GearItem[] {
    const slots: GearSlot[] = ['head', 'chest', 'legs', 'boots', 'weapon', 'shield'];
    const gear: GearItem[] = [];

    for (const slot of slots) {
        const item = generateStarterGear(slot);
        if (item) {
            gear.push(item);
        }
    }

    return gear;
}

/**
 * Create an equipped gear map with starter gear in each armor slot.
 */
export function createStarterEquippedGear(): Record<GearSlot, GearItem | null> {
    return {
        head: generateStarterGear('head'),
        chest: generateStarterGear('chest'),
        legs: generateStarterGear('legs'),
        boots: generateStarterGear('boots'),
        weapon: generateStarterGear('weapon'),
        shield: generateStarterGear('shield'),
        accessory1: null,
        accessory2: null,
        accessory3: null,
    };
}
