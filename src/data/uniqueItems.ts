/**
 * Unique Items Registry
 * 
 * Pre-defined unique gear items with fixed stats.
 * These are special drops from bosses, achievements, or special events.
 * Unlike procedural gear, unique items have fixed, memorable effects.
 */

import { GearItem, GearSlot, GearTier, GEAR_SLOT_ICONS, generateGearId } from '../models/Gear';
import { StatType } from '../models/Character';

/**
 * Unique item definition (template for creating instances)
 */
export interface UniqueItemTemplate {
    /** Unique identifier for this template */
    templateId: string;

    /** Display name */
    name: string;

    /** Flavor text */
    description: string;

    /** Equipment slot */
    slot: GearSlot;

    /** Quality tier (usually Epic or Legendary) */
    tier: GearTier;

    /** Item level */
    level: number;

    /** Primary stat */
    primaryStat: StatType;

    /** Primary stat value */
    primaryValue: number;

    /** Secondary stats */
    secondaryStats?: Partial<Record<StatType, number>>;

    /** Combat bonuses */
    attackPower?: number;
    defense?: number;
    magicDefense?: number;
    blockChance?: number;
    critChance?: number;
    dodgeChance?: number;

    /** Custom sprite ID (optional) */
    spriteId?: string;

    /** Custom emoji icon */
    iconEmoji?: string;
}

// ============================================
// Boss Drop Uniques
// ============================================

/**
 * Goblin King's Crown - Drops from defeating the Goblin King boss
 */
const GOBLIN_KINGS_CROWN: UniqueItemTemplate = {
    templateId: 'goblin_kings_crown',
    name: "Goblin King's Crown",
    description: 'A tarnished crown that once sat upon the brow of the Goblin King. It whispers of hoarded treasures.',
    slot: 'head',
    tier: 'legendary',
    level: 10,
    primaryStat: 'intelligence',
    primaryValue: 25,
    secondaryStats: {
        charisma: 10,
    },
    attackPower: 5,
    defense: 15,
    iconEmoji: '👑',
};

/**
 * Stormbringer Blade - Epic weapon from lightning-themed boss
 */
const STORMBRINGER_BLADE: UniqueItemTemplate = {
    templateId: 'stormbringer_blade',
    name: 'Stormbringer Blade',
    description: 'This blade crackles with barely contained lightning. Each strike echoes like distant thunder.',
    slot: 'weapon',
    tier: 'epic',
    level: 15,
    primaryStat: 'strength',
    primaryValue: 30,
    secondaryStats: {
        dexterity: 8,
    },
    attackPower: 45,
    critChance: 12,
    iconEmoji: '⚡',
};

/**
 * Aegis of the Steadfast - Legendary shield from tank boss
 */
const AEGIS_OF_THE_STEADFAST: UniqueItemTemplate = {
    templateId: 'aegis_of_the_steadfast',
    name: 'Aegis of the Steadfast',
    description: 'An ancient shield that has never been breached. Its bearer cannot be moved.',
    slot: 'shield',
    tier: 'legendary',
    level: 20,
    primaryStat: 'constitution',
    primaryValue: 35,
    defense: 50,
    magicDefense: 25,
    blockChance: 25,
    iconEmoji: '🛡️',
};

/**
 * Shadowstep Boots - Drops from rogue-type boss
 */
const SHADOWSTEP_BOOTS: UniqueItemTemplate = {
    templateId: 'shadowstep_boots',
    name: 'Shadowstep Boots',
    description: 'Boots woven from living shadow. Your footsteps make no sound.',
    slot: 'boots',
    tier: 'epic',
    level: 12,
    primaryStat: 'dexterity',
    primaryValue: 28,
    dodgeChance: 18,
    iconEmoji: '👟',
};

/**
 * Plate of the Fallen Hero - Legendary chest piece
 */
const PLATE_OF_THE_FALLEN_HERO: UniqueItemTemplate = {
    templateId: 'plate_of_fallen_hero',
    name: 'Plate of the Fallen Hero',
    description: 'This armor belonged to a legendary warrior who fell protecting their allies. Their courage lives on.',
    slot: 'chest',
    tier: 'legendary',
    level: 25,
    primaryStat: 'constitution',
    primaryValue: 40,
    secondaryStats: {
        strength: 15,
    },
    defense: 60,
    magicDefense: 30,
    iconEmoji: '🎖️',
};

/**
 * Legguards of Endurance - Master tier leg armor
 */
const LEGGUARDS_OF_ENDURANCE: UniqueItemTemplate = {
    templateId: 'legguards_of_endurance',
    name: 'Legguards of Endurance',
    description: 'Crafted for marathon runners in ancient times. Your spirit never tires.',
    slot: 'legs',
    tier: 'master',
    level: 18,
    primaryStat: 'constitution',
    primaryValue: 25,
    secondaryStats: {
        dexterity: 10,
    },
    defense: 35,
    dodgeChance: 5,
    iconEmoji: '🦿',
};

// ============================================
// Achievement Uniques
// ============================================

/**
 * Ring of the Completionist - Reward for 100 quests completed
 */
const RING_OF_THE_COMPLETIONIST: UniqueItemTemplate = {
    templateId: 'ring_of_completionist',
    name: 'Ring of the Completionist',
    description: 'Awarded to those who have completed 100 quests. It glows brighter with each new accomplishment.',
    slot: 'accessory1',
    tier: 'legendary',
    level: 15,
    primaryStat: 'wisdom',
    primaryValue: 20,
    secondaryStats: {
        intelligence: 10,
        charisma: 10,
    },
    iconEmoji: '💫',
};

/**
 * Amulet of Dedication - Reward for 30-day streak
 */
const AMULET_OF_DEDICATION: UniqueItemTemplate = {
    templateId: 'amulet_of_dedication',
    name: 'Amulet of Dedication',
    description: 'Forged from crystallized willpower. Proof of 30 days of unwavering commitment.',
    slot: 'accessory2',
    tier: 'epic',
    level: 10,
    primaryStat: 'constitution',
    primaryValue: 18,
    secondaryStats: {
        wisdom: 12,
    },
    iconEmoji: '📿',
};

// ============================================
// Registry
// ============================================

/**
 * All unique item templates by ID
 */
export const UNIQUE_ITEMS: Record<string, UniqueItemTemplate> = {
    // Boss drops
    [GOBLIN_KINGS_CROWN.templateId]: GOBLIN_KINGS_CROWN,
    [STORMBRINGER_BLADE.templateId]: STORMBRINGER_BLADE,
    [AEGIS_OF_THE_STEADFAST.templateId]: AEGIS_OF_THE_STEADFAST,
    [SHADOWSTEP_BOOTS.templateId]: SHADOWSTEP_BOOTS,
    [PLATE_OF_THE_FALLEN_HERO.templateId]: PLATE_OF_THE_FALLEN_HERO,
    [LEGGUARDS_OF_ENDURANCE.templateId]: LEGGUARDS_OF_ENDURANCE,

    // Achievement rewards
    [RING_OF_THE_COMPLETIONIST.templateId]: RING_OF_THE_COMPLETIONIST,
    [AMULET_OF_DEDICATION.templateId]: AMULET_OF_DEDICATION,
};

/**
 * Get a unique item template by ID
 */
export function getUniqueItemTemplate(templateId: string): UniqueItemTemplate | null {
    return UNIQUE_ITEMS[templateId] || null;
}

/**
 * Create a GearItem instance from a unique item template.
 * This creates a new instance with a unique ID.
 */
export function createUniqueItem(
    templateId: string,
    source: 'quest' | 'combat' | 'exploration' = 'combat',
    sourceId?: string
): GearItem | null {
    const template = getUniqueItemTemplate(templateId);
    if (!template) {
        console.warn(`[UniqueItems] Unknown template: ${templateId}`);
        return null;
    }

    return {
        id: generateGearId(),
        name: template.name,
        description: template.description,
        slot: template.slot,
        tier: template.tier,
        level: template.level,
        stats: {
            primaryStat: template.primaryStat,
            primaryValue: template.primaryValue,
            secondaryStats: template.secondaryStats,
            attackPower: template.attackPower,
            defense: template.defense,
            magicDefense: template.magicDefense,
            blockChance: template.blockChance,
            critChance: template.critChance,
            dodgeChance: template.dodgeChance,
        },
        sellValue: 0, // Unique items cannot be sold (or could have high value)
        spriteId: template.spriteId,
        iconEmoji: template.iconEmoji || GEAR_SLOT_ICONS[template.slot],
        source,
        sourceId,
        acquiredAt: new Date().toISOString(),
        isUnique: true,
    };
}

/**
 * Get all unique items for a specific slot (for loot tables)
 */
export function getUniqueItemsBySlot(slot: GearSlot): UniqueItemTemplate[] {
    return Object.values(UNIQUE_ITEMS).filter(item => item.slot === slot);
}

/**
 * Get all unique items of a specific tier or higher
 */
export function getUniqueItemsByMinTier(minTier: GearTier): UniqueItemTemplate[] {
    const TIER_ORDER: GearTier[] = ['common', 'adept', 'journeyman', 'master', 'epic', 'legendary'];
    const minIndex = TIER_ORDER.indexOf(minTier);
    return Object.values(UNIQUE_ITEMS).filter(item => {
        const itemIndex = TIER_ORDER.indexOf(item.tier);
        return itemIndex >= minIndex;
    });
}
