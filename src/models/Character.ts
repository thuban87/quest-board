/**
 * Character Data Model
 * 
 * Character data structure with spriteVersion for cache invalidation.
 * Moved from settings.ts for proper separation of concerns.
 */

/** Current character schema version */
export const CHARACTER_SCHEMA_VERSION = 1;

/**
 * Character class types
 */
export type CharacterClass =
    | 'warrior'
    | 'paladin'
    | 'technomancer'
    | 'scholar'
    | 'rogue'
    | 'cleric'
    | 'bard';

/**
 * Class metadata for display and XP bonuses
 */
export interface ClassInfo {
    id: CharacterClass;
    name: string;
    description: string;
    bonusCategories: string[];
    bonusPercent: number;
    perkName: string;
    perkDescription: string;
    emoji: string;
    primaryColor: string;
}

/**
 * All available classes with their metadata
 */
export const CLASS_INFO: Record<CharacterClass, ClassInfo> = {
    warrior: {
        id: 'warrior',
        name: 'Warrior',
        description: 'Executor & Task Slayer',
        bonusCategories: ['admin', 'completion', 'household'],
        bonusPercent: 15,
        perkName: 'Task Slayer',
        perkDescription: 'Completion streaks grant additional 5% XP',
        emoji: '⚔️',
        primaryColor: '#dc3545',
    },
    paladin: {
        id: 'paladin',
        name: 'Paladin',
        description: 'Defender & Supporter',
        bonusCategories: ['health', 'social'],
        bonusPercent: 15,
        perkName: 'Shield of Discipline',
        perkDescription: 'One missed day per week doesn\'t break your streak',
        emoji: '🛡️',
        primaryColor: '#ffc107',
    },
    technomancer: {
        id: 'technomancer',
        name: 'Technomancer',
        description: 'Builder & Creator',
        bonusCategories: ['dev', 'creative', 'project'],
        bonusPercent: 15,
        perkName: 'Code Warrior',
        perkDescription: 'Multi-day project quests grant 25% bonus XP',
        emoji: '💻',
        primaryColor: '#28a745',
    },
    scholar: {
        id: 'scholar',
        name: 'Scholar',
        description: 'Learner & Academic',
        bonusCategories: ['academic', 'study', 'research'],
        bonusPercent: 15,
        perkName: 'Knowledge Seeker',
        perkDescription: 'Reading/studying for 30+ minutes grants bonus XP',
        emoji: '📚',
        primaryColor: '#6f42c1',
    },
    rogue: {
        id: 'rogue',
        name: 'Rogue',
        description: 'Strategist & Efficient',
        bonusCategories: ['quick-wins', 'efficiency'],
        bonusPercent: 15,
        perkName: 'Clever Shortcut',
        perkDescription: 'Complete quests faster than estimated for 20% bonus XP',
        emoji: '🗡️',
        primaryColor: '#343a40',
    },
    cleric: {
        id: 'cleric',
        name: 'Cleric',
        description: 'Healer & Wellness',
        bonusCategories: ['health', 'fitness', 'medical', 'wellness'],
        bonusPercent: 15,
        perkName: 'Self-Care Aura',
        perkDescription: 'Wellness streaks grant stacking bonus (+5% per day)',
        emoji: '✨',
        primaryColor: '#17a2b8',
    },
    bard: {
        id: 'bard',
        name: 'Bard',
        description: 'Charmer & Social',
        bonusCategories: ['social', 'dating', 'friendship'],
        bonusPercent: 15,
        perkName: 'Charming Presence',
        perkDescription: 'Social battery recharges faster after social quests',
        emoji: '🎵',
        primaryColor: '#e83e8c',
    },
};

/**
 * Character appearance configuration
 */
export interface CharacterAppearance {
    skinTone: 'light' | 'medium' | 'tan' | 'dark';
    hairStyle: 'short' | 'medium' | 'long' | 'bald';
    hairColor: 'brown' | 'black' | 'blonde' | 'red';
    accessory: 'none' | 'glasses' | 'hat' | 'headphones';
    outfitPrimary: string;
    outfitSecondary: string;
}

/**
 * Default appearance values
 */
export const DEFAULT_APPEARANCE: CharacterAppearance = {
    skinTone: 'light',
    hairStyle: 'short',
    hairColor: 'brown',
    accessory: 'none',
    outfitPrimary: '#6f42c1',
    outfitSecondary: '#ffc107',
};

/**
 * Equipped gear item
 */
export interface EquippedGear {
    slot: 'weapon' | 'armor' | 'accessory1' | 'accessory2' | 'accessory3';
    itemId: string;
}

/**
 * Character data structure
 */
export interface Character {
    /** Schema version for migrations */
    schemaVersion: number;

    /** Character display name */
    name: string;

    /** Primary class */
    class: CharacterClass;

    /** Secondary class (unlocked at level 25) */
    secondaryClass: CharacterClass | null;

    /** Current level (1-30) */
    level: number;

    /** Total XP earned */
    totalXP: number;

    /** Sprite cache version - increment when appearance changes */
    spriteVersion: number;

    /** Appearance customization */
    appearance: CharacterAppearance;

    /** Equipped gear items */
    equippedGear: EquippedGear[];

    /** Training mode XP (separate pool) */
    trainingXP: number;

    /** Training mode level (I-IV = 1-4) */
    trainingLevel: number;

    /** Whether in training mode */
    isTrainingMode: boolean;

    /** ISO 8601 date string */
    createdDate: string;

    /** ISO 8601 date string */
    lastModified: string;
}

/**
 * Create a new character with default values
 */
export function createCharacter(
    name: string,
    characterClass: CharacterClass,
    appearance: Partial<CharacterAppearance> = {}
): Character {
    const classInfo = CLASS_INFO[characterClass];
    const now = new Date().toISOString();

    return {
        schemaVersion: CHARACTER_SCHEMA_VERSION,
        name,
        class: characterClass,
        secondaryClass: null,
        level: 1,
        totalXP: 0,
        spriteVersion: 1,
        appearance: {
            ...DEFAULT_APPEARANCE,
            outfitPrimary: classInfo.primaryColor,
            ...appearance,
        },
        equippedGear: [],
        trainingXP: 0,
        trainingLevel: 1,
        isTrainingMode: true, // Start in training mode
        createdDate: now,
        lastModified: now,
    };
}

/**
 * Get the level tier (1-5) for visual/sprite progression
 * Tier 1: Levels 1-8   (Acolyte)
 * Tier 2: Levels 9-16  (Squire)
 * Tier 3: Levels 17-24 (Knight)
 * Tier 4: Levels 25-32 (Champion)
 * Tier 5: Levels 33-40 (Divine Avatar)
 */
export function getLevelTier(level: number): number {
    if (level <= 8) return 1;
    if (level <= 16) return 2;
    if (level <= 24) return 3;
    if (level <= 32) return 4;
    return 5;
}

/**
 * Convert training level to Roman numeral (I-X)
 */
export function getTrainingLevelDisplay(level: number): string {
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return numerals[Math.min(level - 1, 9)] || 'I';
}
