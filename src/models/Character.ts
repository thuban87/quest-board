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
 * Stat types (D&D-inspired)
 */
export type StatType = 'strength' | 'intelligence' | 'wisdom' | 'constitution' | 'dexterity' | 'charisma';

/**
 * Character stats structure
 */
export interface CharacterStats {
    strength: number;
    intelligence: number;
    wisdom: number;
    constitution: number;
    dexterity: number;
    charisma: number;
}

/**
 * Default starting stats (base 10 for all)
 */
export const DEFAULT_STATS: CharacterStats = {
    strength: 10,
    intelligence: 10,
    wisdom: 10,
    constitution: 10,
    dexterity: 10,
    charisma: 10,
};

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
    /** Primary stats for this class (get +2 per level) */
    primaryStats: [StatType, StatType];
    /** Class-specific category to stat mapping */
    categoryStatMap: Record<string, StatType>;
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
        primaryStats: ['strength', 'constitution'],
        categoryStatMap: {
            fitness: 'strength', exercise: 'strength',
            health: 'constitution', wellness: 'constitution',
            coding: 'intelligence', dev: 'intelligence',
            study: 'intelligence', research: 'intelligence',
            social: 'charisma', networking: 'charisma',
            creative: 'dexterity', efficiency: 'dexterity',
            planning: 'wisdom', admin: 'wisdom',
        },
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
        primaryStats: ['strength', 'wisdom'],
        categoryStatMap: {
            fitness: 'strength', exercise: 'strength',
            health: 'strength', wellness: 'strength', // Discipline
            coding: 'intelligence', dev: 'intelligence',
            study: 'wisdom', research: 'wisdom',
            social: 'wisdom', networking: 'wisdom', // Leadership
            creative: 'dexterity', efficiency: 'dexterity',
            planning: 'wisdom', admin: 'wisdom',
        },
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
        primaryStats: ['intelligence', 'dexterity'],
        categoryStatMap: {
            fitness: 'constitution', exercise: 'constitution',
            health: 'constitution', wellness: 'wisdom',
            coding: 'intelligence', dev: 'intelligence',
            study: 'intelligence', research: 'intelligence',
            social: 'charisma', networking: 'charisma',
            creative: 'dexterity', efficiency: 'dexterity',
            planning: 'wisdom', admin: 'wisdom',
        },
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
        primaryStats: ['intelligence', 'wisdom'],
        categoryStatMap: {
            fitness: 'constitution', exercise: 'constitution',
            health: 'wisdom', wellness: 'wisdom',
            coding: 'intelligence', dev: 'intelligence',
            study: 'intelligence', research: 'intelligence',
            social: 'charisma', networking: 'charisma',
            creative: 'dexterity', efficiency: 'dexterity',
            planning: 'wisdom', admin: 'wisdom',
        },
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
        primaryStats: ['dexterity', 'charisma'],
        categoryStatMap: {
            fitness: 'dexterity', exercise: 'dexterity',
            health: 'constitution', wellness: 'constitution',
            coding: 'intelligence', dev: 'intelligence',
            study: 'intelligence', research: 'intelligence',
            social: 'charisma', networking: 'charisma',
            creative: 'dexterity', efficiency: 'dexterity',
            planning: 'intelligence', admin: 'intelligence',
        },
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
        primaryStats: ['wisdom', 'constitution'],
        categoryStatMap: {
            fitness: 'constitution', exercise: 'constitution',
            health: 'wisdom', wellness: 'wisdom', // Holistic care
            coding: 'intelligence', dev: 'intelligence',
            study: 'wisdom', research: 'wisdom',
            social: 'charisma', networking: 'charisma',
            creative: 'dexterity', efficiency: 'dexterity',
            planning: 'wisdom', admin: 'wisdom',
        },
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
        primaryStats: ['charisma', 'dexterity'],
        categoryStatMap: {
            fitness: 'dexterity', exercise: 'dexterity',
            health: 'constitution', wellness: 'constitution',
            coding: 'intelligence', dev: 'intelligence',
            study: 'wisdom', research: 'wisdom',
            social: 'charisma', networking: 'charisma',
            creative: 'dexterity', efficiency: 'dexterity',
            planning: 'charisma', admin: 'charisma',
        },
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

    /** Current level (1-40) */
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

    /** Training mode level (I-X = 1-10) */
    trainingLevel: number;

    /** Whether in training mode */
    isTrainingMode: boolean;

    /** Base stats (from level + class) */
    baseStats: CharacterStats;

    /** Bonus stats from quests (capped at level × 2 per stat) */
    statBonuses: CharacterStats;

    /** XP accumulator for stat gains (100 XP in category = +1 stat) */
    categoryXPAccumulator: Record<string, number>;

    /** Current streak (consecutive days with quest completions) */
    currentStreak: number;

    /** Highest streak ever achieved */
    highestStreak: number;

    /** Last date a quest was completed (ISO date string, date only) */
    lastQuestCompletionDate: string | null;

    /** Paladin shield used this week (resets Monday) */
    shieldUsedThisWeek: boolean;

    /** ISO 8601 date string */
    createdDate: string;

    /** ISO 8601 date string */
    lastModified: string;
}

/**
 * Get starting stats for a class (base 10, +2 to primary stats)
 */
export function getStartingStatsForClass(characterClass: CharacterClass): CharacterStats {
    const classInfo = CLASS_INFO[characterClass];
    const stats = { ...DEFAULT_STATS };

    // Add +2 to each primary stat
    for (const primaryStat of classInfo.primaryStats) {
        stats[primaryStat] += 2;
    }

    return stats;
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
        baseStats: getStartingStatsForClass(characterClass),
        statBonuses: { ...DEFAULT_STATS, strength: 0, intelligence: 0, wisdom: 0, constitution: 0, dexterity: 0, charisma: 0 },
        categoryXPAccumulator: {},
        currentStreak: 0,
        highestStreak: 0,
        lastQuestCompletionDate: null,
        shieldUsedThisWeek: false,
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
