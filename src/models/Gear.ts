/**
 * Gear & Loot System Data Models
 * 
 * Phase 3A: Core gear types, interfaces, and utility functions.
 */

import { StatType } from './Character';

// ============================================
// Gear Slots
// ============================================

/**
 * All equipment slots available to a character.
 * 6 primary armor slots + 3 accessory slots.
 */
export type GearSlot =
    | 'head'
    | 'chest'
    | 'legs'
    | 'boots'
    | 'weapon'
    | 'shield'
    | 'accessory1'
    | 'accessory2'
    | 'accessory3';

/** Primary armor slots (excluding accessories) */
export const PRIMARY_GEAR_SLOTS: GearSlot[] = ['head', 'chest', 'legs', 'boots', 'weapon', 'shield'];

/** All gear slots */
export const ALL_GEAR_SLOTS: GearSlot[] = [...PRIMARY_GEAR_SLOTS, 'accessory1', 'accessory2', 'accessory3'];

/** Display names for gear slots */
export const GEAR_SLOT_NAMES: Record<GearSlot, string> = {
    head: 'Head',
    chest: 'Chest',
    legs: 'Legs',
    boots: 'Boots',
    weapon: 'Weapon',
    shield: 'Shield',
    accessory1: 'Accessory 1',
    accessory2: 'Accessory 2',
    accessory3: 'Accessory 3',
};

/** Emoji icons for gear slots */
export const GEAR_SLOT_ICONS: Record<GearSlot, string> = {
    head: '🪖',
    chest: '🎽',
    legs: '👖',
    boots: '🥾',
    weapon: '⚔️',
    shield: '🛡️',
    accessory1: '💍',
    accessory2: '💍',
    accessory3: '💍',
};

// ============================================
// Armor & Weapon Types
// ============================================

/**
 * Armor weight types - determines which classes can equip
 */
export type ArmorType = 'cloth' | 'leather' | 'mail' | 'plate';

/**
 * Weapon types - determines which classes can equip
 */
export type WeaponType =
    | 'sword'
    | 'axe'
    | 'mace'
    | 'dagger'
    | 'staff'
    | 'wand'
    | 'bow'
    | 'shield';  // Shields are a weapon type for restriction purposes

/** Display names for armor types */
export const ARMOR_TYPE_NAMES: Record<ArmorType, string> = {
    cloth: 'Cloth',
    leather: 'Leather',
    mail: 'Mail',
    plate: 'Plate',
};

/** Display names for weapon types */
export const WEAPON_TYPE_NAMES: Record<WeaponType, string> = {
    sword: 'Sword',
    axe: 'Axe',
    mace: 'Mace',
    dagger: 'Dagger',
    staff: 'Staff',
    wand: 'Wand',
    bow: 'Bow',
    shield: 'Shield',
};

/** Emojis for armor types */
export const ARMOR_TYPE_ICONS: Record<ArmorType, string> = {
    cloth: '🧵',
    leather: '🦊',
    mail: '⛓️',
    plate: '🛡️',
};

/** Emojis for weapon types */
export const WEAPON_TYPE_ICONS: Record<WeaponType, string> = {
    sword: '⚔️',
    axe: '🪓',
    mace: '🔨',
    dagger: '🗡️',
    staff: '🪄',
    wand: '✨',
    bow: '🏹',
    shield: '🛡️',
};

// Import CharacterClass type for restrictions
import { CharacterClass } from './Character';

/**
 * Which armor types each class can equip
 * Classes can equip their tier and below (plate can equip all)
 */
export const CLASS_ARMOR_PROFICIENCY: Record<CharacterClass, ArmorType[]> = {
    scholar: ['cloth'],
    technomancer: ['cloth', 'leather'],
    bard: ['cloth', 'leather'],
    rogue: ['cloth', 'leather'],
    cleric: ['cloth', 'leather', 'mail'],
    paladin: ['cloth', 'leather', 'mail', 'plate'],
    warrior: ['cloth', 'leather', 'mail', 'plate'],
};

/**
 * Which weapon types each class can equip
 */
export const CLASS_WEAPON_PROFICIENCY: Record<CharacterClass, WeaponType[]> = {
    warrior: ['sword', 'axe', 'mace', 'shield'],
    paladin: ['sword', 'mace', 'shield'],
    rogue: ['sword', 'dagger', 'bow'],
    bard: ['sword', 'dagger', 'bow'],
    cleric: ['mace', 'staff', 'wand', 'shield'],
    scholar: ['staff', 'wand', 'dagger'],
    technomancer: ['staff', 'wand', 'dagger', 'bow'],
};

/**
 * Check if a class can equip an armor type
 */
export function canEquipArmor(characterClass: CharacterClass, armorType: ArmorType): boolean {
    return CLASS_ARMOR_PROFICIENCY[characterClass].includes(armorType);
}

/**
 * Check if a class can equip a weapon type
 */
export function canEquipWeapon(characterClass: CharacterClass, weaponType: WeaponType): boolean {
    return CLASS_WEAPON_PROFICIENCY[characterClass].includes(weaponType);
}

/**
 * Check if a class can equip a gear item
 */
export function canEquipGear(characterClass: CharacterClass, item: GearItem): boolean {
    // Accessories have no class restrictions
    if (item.slot.startsWith('accessory')) {
        return true;
    }

    // Check weapon proficiency
    if (item.slot === 'weapon' || item.slot === 'shield') {
        if (!item.weaponType) return true; // Legacy items without type
        return canEquipWeapon(characterClass, item.weaponType);
    }

    // Check armor proficiency
    if (!item.armorType) return true; // Legacy items without type
    return canEquipArmor(characterClass, item.armorType);
}

// ============================================
// Gear Tiers
// ============================================

/**
 * Quality tiers for gear items.
 * Common is training-only, Legendary is ultra-rare.
 */
export type GearTier =
    | 'common'
    | 'adept'
    | 'journeyman'
    | 'master'
    | 'epic'
    | 'legendary';

/** All tiers in order of quality */
export const GEAR_TIERS: GearTier[] = ['common', 'adept', 'journeyman', 'master', 'epic', 'legendary'];

/** Tier display info */
export interface TierInfo {
    name: string;
    color: string;
    emoji: string;
    /** Multiplier for stat calculation (exponential scaling) */
    statMultiplier: number;
    /** Level range this tier typically drops */
    levelRange: [number, number];
}

/** Tier metadata for display and calculations */
export const TIER_INFO: Record<GearTier, TierInfo> = {
    common: {
        name: 'Common',
        color: '#9e9e9e',
        emoji: '🔘',
        statMultiplier: 0.5,
        levelRange: [1, 5],
    },
    adept: {
        name: 'Adept',
        color: '#4caf50',
        emoji: '🟢',
        statMultiplier: 1.0,
        levelRange: [1, 15],
    },
    journeyman: {
        name: 'Journeyman',
        color: '#2196f3',
        emoji: '🔵',
        statMultiplier: 1.5,
        levelRange: [5, 25],
    },
    master: {
        name: 'Master',
        color: '#9c27b0',
        emoji: '🟣',
        statMultiplier: 2.0,
        levelRange: [15, 35],
    },
    epic: {
        name: 'Epic',
        color: '#ff9800',
        emoji: '🟠',
        statMultiplier: 2.5,
        levelRange: [25, 40],
    },
    legendary: {
        name: 'Legendary',
        color: '#ffd700',
        emoji: '🟡',
        statMultiplier: 3.0,
        levelRange: [30, 40],
    },
};

/**
 * Get the next tier up (for smelting)
 */
export function getNextTier(tier: GearTier): GearTier | null {
    const index = GEAR_TIERS.indexOf(tier);
    if (index === -1 || index >= GEAR_TIERS.length - 1) return null;
    return GEAR_TIERS[index + 1];
}

// ============================================
// Gear Stats
// ============================================

/**
 * Stats provided by a gear item.
 */
export interface GearStats {
    /** Primary stat type this gear boosts */
    primaryStat: StatType;
    /** Primary stat value */
    primaryValue: number;

    /** Optional secondary stat bonuses */
    secondaryStats?: Partial<Record<StatType, number>>;

    /** Combat bonuses (calculated from stats + slot) */
    attackPower?: number;
    defense?: number;
    magicDefense?: number;
    blockChance?: number;      // Shields only (percentage)
    critChance?: number;       // Weapons, some accessories
    dodgeChance?: number;      // Boots, light armor
}

// ============================================
// Gear Item
// ============================================

/**
 * Source of the gear item
 */
export type GearSource = 'quest' | 'combat' | 'exploration' | 'shop' | 'starter' | 'smelt';

/**
 * A single gear item in inventory or equipped.
 * Each item is unique (procedurally generated stats).
 */
export interface GearItem {
    /** Unique identifier (UUID) */
    id: string;

    /** Display name */
    name: string;

    /** Flavor text description */
    description: string;

    /** Which slot this equips to */
    slot: GearSlot;

    /** Armor weight type (cloth/leather/mail/plate) - for armor slots */
    armorType?: ArmorType;

    /** Weapon type (sword/axe/staff/etc.) - for weapon/shield slots */
    weaponType?: WeaponType;

    /** Quality tier */
    tier: GearTier;

    /** Item level (1-40) */
    level: number;

    /** Stat bonuses provided */
    stats: GearStats;

    /** Gold received when sold */
    sellValue: number;

    /** Sprite asset ID (optional) */
    spriteId?: string;

    /** Emoji fallback for display */
    iconEmoji: string;

    /** How this item was obtained */
    source: GearSource;

    /** ID of quest/monster that dropped this */
    sourceId?: string;

    /** When the item was acquired (ISO date) */
    acquiredAt: string;

    // --- Set Bonus Fields ---

    /** Normalized set ID (folder path hash) */
    setId?: string;

    /** Display name for the set */
    setName?: string;

    // --- Legendary Fields ---

    /** Quick check for legendary */
    isLegendary?: boolean;

    /** Custom legendary name (e.g., "The Accountant's Greataxe") */
    legendaryName?: string;

    /** Flavor text for legendary lore */
    legendaryLore?: string;

    /** Quest ID that spawned this legendary */
    originQuestId?: string;

    /** Snapshot of quest title (for display if quest deleted) */
    originQuestTitle?: string;

    /** Snapshot of quest category */
    originQuestCategory?: string;

    // --- Internal State ---

    /** For smelting transaction safety */
    status?: 'pending_smelt';

    /** Whether this is a unique (non-procedural) item */
    isUnique?: boolean;
}

// ============================================
// Equipped Gear Type
// ============================================

/**
 * Character's equipped gear - one item per slot (or null if empty)
 */
export type EquippedGearMap = Record<GearSlot, GearItem | null>;

/**
 * Create an empty equipped gear map
 */
export function createEmptyEquippedGear(): EquippedGearMap {
    return {
        head: null,
        chest: null,
        legs: null,
        boots: null,
        weapon: null,
        shield: null,
        accessory1: null,
        accessory2: null,
        accessory3: null,
    };
}

// ============================================
// Loot Rewards
// ============================================

/**
 * Discriminated union for loot rewards.
 * A single chest/quest can reward multiple of these.
 */
export type LootReward =
    | { type: 'gear'; item: GearItem }
    | { type: 'consumable'; itemId: string; quantity: number }
    | { type: 'gold'; amount: number };

/**
 * A collection of loot from a single source (quest, chest, monster)
 */
export type LootDrop = LootReward[];

// ============================================
// Set Bonuses
// ============================================

/**
 * Effect provided by set bonuses
 */
export type SetBonusEffect =
    | { type: 'stat_bonus'; stat: StatType; value: number }
    | { type: 'xp_bonus'; category: string; percent: number }
    | { type: 'gold_bonus'; category: string; percent: number }
    | { type: 'title'; title: string };

/**
 * A gear set definition (project-based)
 */
export interface GearSet {
    /** Unique identifier (normalized folder path) */
    id: string;

    /** Display name (folder name) */
    name: string;

    /** Source folder path */
    folderPath: string;

    /** Bonuses at different piece counts */
    bonuses: SetBonus[];
}

/**
 * A single set bonus at a piece threshold
 */
export interface SetBonus {
    /** Pieces required to activate (2, 4, or 6) */
    pieces: number;
    /** Effect provided */
    effect: SetBonusEffect;
}

/**
 * Active set bonus state for equipped gear
 */
export interface ActiveSetBonus {
    /** Set identifier */
    setId: string;
    /** Display name */
    setName: string;
    /** Number of equipped pieces from this set */
    equippedCount: number;
    /** All possible bonuses for this set */
    bonuses: SetBonus[];
    /** Bonuses that are currently active (piece threshold met) */
    activeBonuses: SetBonus[];
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate base stat value using exponential scaling.
 * High-tier + high-level = significantly more powerful.
 */
export function calculateBaseStatValue(gearLevel: number, tier: GearTier): number {
    const tierMultiplier = TIER_INFO[tier].statMultiplier;

    // Formula: (level * 3) + (tierMultiplier * level)
    // Creates exponential feel where tier matters MORE at high levels
    const baseValue = (gearLevel * 3) + (tierMultiplier * gearLevel);

    return Math.floor(baseValue);
}

/**
 * Calculate sell value for a gear item.
 */
export function calculateSellValue(level: number, tier: GearTier): number {
    const tierBase: Record<GearTier, number> = {
        common: 5,
        adept: 15,
        journeyman: 40,
        master: 100,
        epic: 250,
        legendary: 500,
    };

    return tierBase[tier] + (level * 2);
}

/**
 * Normalize a folder path to create a stable set ID.
 * Resilient to minor folder renames.
 */
export function normalizeSetId(folderPath: string): string {
    return folderPath
        .replace(/^.*\/quests\//, '')  // Remove vault prefix
        .toLowerCase()
        .replace(/\s+/g, '_')          // Spaces to underscores
        .replace(/[^a-z0-9_]/g, '');   // Remove special chars
}

/**
 * Generate a UUID for gear items.
 * Uses crypto.randomUUID if available, fallback for older environments.
 */
export function generateGearId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
