/**
 * Character Data Model
 * 
 * Character data structure with spriteVersion for cache invalidation.
 * Moved from settings.ts for proper separation of concerns.
 */

/** Current character schema version */
export const CHARACTER_SCHEMA_VERSION = 3;

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
 * @deprecated Legacy equipped gear format (schema v1). Use EquippedGearMap from Gear.ts instead.
 */
export interface LegacyEquippedGear {
    slot: 'weapon' | 'armor' | 'accessory1' | 'accessory2' | 'accessory3';
    itemId: string;
}

/**
 * Power-up effect types
 */
export type PowerUpEffect =
    | { type: 'xp_multiplier'; value: number }        // 1.5 = +50% XP total
    | { type: 'xp_category_multiplier'; value: number; category: string }  // Category-specific
    | { type: 'stat_boost'; stat: StatType; value: number }
    | { type: 'all_stats_boost'; value: number }
    | { type: 'crit_chance'; value: number }          // Percentage (e.g., 10 = 10%)
    | { type: 'streak_shield' }                        // Prevents one streak reset
    | { type: 'class_perk'; description: string };     // Passive class bonus

/**
 * Duration specification for power-ups
 */
export type PowerUpDuration =
    | { type: 'hours'; value: number }
    | { type: 'uses'; value: number }
    | { type: 'until_midnight' }
    | { type: 'until_used' }                          // Single use (streak shield)
    | { type: 'passive' };                            // Never expires (class perks)

/**
 * Collision policy when triggering a power-up that's already active
 */
export type CollisionPolicy = 'refresh' | 'stack' | 'extend' | 'ignore';

/**
 * Notification type for when power-up triggers
 */
export type PowerUpNotificationType = 'toast' | 'modal' | 'silent';

/**
 * Active power-up on a character
 */
export interface ActivePowerUp {
    /** Unique effect ID (e.g., "flow_state", "first_blood_boost") */
    id: string;

    /** Display name (e.g., "Flow State", "First Blood") */
    name: string;

    /** Icon for display (emoji or icon class) */
    icon: string;

    /** Description for tooltip */
    description: string;

    /** Which trigger granted this (e.g., "first_blood", "level_up") */
    triggeredBy: string;

    /** When the power-up was granted */
    startedAt: string;

    /** When it expires (null = never / passive) */
    expiresAt: string | null;

    /** The actual effect */
    effect: PowerUpEffect;

    /** For stackable effects (e.g., Momentum stacks) */
    stacks?: number;

    /** For use-limited effects (e.g., "next 3 tasks") */
    usesRemaining?: number;
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

    /** Equipped gear items (schema v2: Record<GearSlot, GearItem | null>) */
    equippedGear: import('./Gear').EquippedGearMap;

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

    /** Tasks completed today (for First Blood trigger - resets at midnight) */
    tasksCompletedToday: number;

    /** Date of last task completion for daily reset check (YYYY-MM-DD local) */
    lastTaskDate: string | null;

    /** Active power-ups and buffs (includes class perk as passive) */
    activePowerUps: ActivePowerUp[];

    // ========== Phase 3A: Gear System ==========

    /** Gold currency */
    gold: number;

    /** Gear inventory (unique items, cannot stack) */
    gearInventory: import('./Gear').GearItem[];

    /** Maximum gear inventory slots (default 50) */
    inventoryLimit: number;

    // ========== Phase 3B: Fight System ==========

    /** Current HP (persists between fights) */
    currentHP: number;

    /** Maximum HP (calculated from Constitution + level) */
    maxHP: number;

    /** Current Mana (persists between fights) */
    currentMana: number;

    /** Maximum Mana (calculated from Intelligence + level) */
    maxMana: number;

    /** Stamina for random fights (max 10, +2 per task, -1 per fight) */
    stamina: number;

    /** Stamina earned today (resets at midnight, capped at 50) */
    staminaGainedToday: number;

    /** Date of last stamina reset (YYYY-MM-DD) */
    lastStaminaResetDate: string | null;

    // ========== Phase 3C: Exploration System ==========

    /** Dungeon keys (earned from quests, consumed on dungeon exit) */
    dungeonKeys: number;

    /** Permanent exploration history per dungeon template (for map fog of war) */
    dungeonExplorationHistory: Record<string, string[]>;

    // ========== Phase 3B Step 9: Death Penalty ==========

    /** Character status (active, unconscious, etc.) */
    status: string;

    /** ISO timestamp when recovery timer ends (null = no active timer) */
    recoveryTimerEnd: string | null;
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
    const baseStats = getStartingStatsForClass(characterClass);

    // Calculate starting HP and Mana from base stats
    // HP: 50 + (Constitution * 5) + (Level * 10)
    // Mana: 20 + (Intelligence * 3) + (Level * 5)
    const maxHP = 50 + (baseStats.constitution * 5) + (1 * 10);
    const maxMana = 20 + (baseStats.intelligence * 3) + (1 * 5);

    // Import starter gear function inline to avoid circular deps
    // Will be replaced with actual starter gear in characterStore
    const emptyEquippedGear = {
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
        equippedGear: emptyEquippedGear,
        trainingXP: 0,
        trainingLevel: 1,
        isTrainingMode: true, // Start in training mode
        baseStats,
        statBonuses: { strength: 0, intelligence: 0, wisdom: 0, constitution: 0, dexterity: 0, charisma: 0 },
        categoryXPAccumulator: {},
        currentStreak: 0,
        highestStreak: 0,
        lastQuestCompletionDate: null,
        shieldUsedThisWeek: false,
        createdDate: now,
        lastModified: now,
        tasksCompletedToday: 0,
        lastTaskDate: null,
        activePowerUps: [],

        // Phase 3A: Gear System
        gold: 0,
        gearInventory: [],
        inventoryLimit: 50,

        // Phase 3B: Fight System
        currentHP: maxHP,
        maxHP,
        currentMana: maxMana,
        maxMana,
        stamina: 10,  // Start with full stamina
        staminaGainedToday: 0,
        lastStaminaResetDate: null,

        // Phase 3C: Exploration System
        dungeonKeys: 0,
        dungeonExplorationHistory: {},

        // Phase 3B Step 9: Death Penalty
        status: 'active',
        recoveryTimerEnd: null,
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

// ============================================
// Schema Migration Functions (Phase 3A)
// ============================================

/**
 * Get today's date as YYYY-MM-DD string
 */
function getLocalDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Convert old equipped gear format (schema v1) to new format (schema v2).
 * Old: EquippedGear[] with { slot, itemId }
 * New: Record<GearSlot, GearItem | null>
 */
export function migrateEquippedGear(oldFormat: unknown): import('./Gear').EquippedGearMap {
    // Start with empty map
    const newFormat: import('./Gear').EquippedGearMap = {
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

    // If already in new format (object with slot keys), validate and return
    if (oldFormat && typeof oldFormat === 'object' && !Array.isArray(oldFormat)) {
        const obj = oldFormat as Record<string, unknown>;
        // Check if it has the expected slot keys
        if ('weapon' in obj || 'head' in obj || 'chest' in obj) {
            // Already in new format, copy over valid slots
            const slots: (keyof import('./Gear').EquippedGearMap)[] = [
                'head', 'chest', 'legs', 'boots', 'weapon', 'shield',
                'accessory1', 'accessory2', 'accessory3'
            ];
            for (const slot of slots) {
                if (slot in obj && obj[slot] !== null && typeof obj[slot] === 'object') {
                    newFormat[slot] = obj[slot] as import('./Gear').GearItem;
                }
            }
            return newFormat;
        }
    }

    // Old format was an empty array or not convertible
    // Return empty slots (starter gear will be assigned separately in migration)
    return newFormat;
}

/**
 * Calculate max HP for a character based on their stats and level.
 * Formula: 50 + (Constitution * 5) + (Level * 10)
 */
export function calculateMaxHP(character: { baseStats?: CharacterStats; level?: number }): number {
    const con = character.baseStats?.constitution ?? 10;
    const level = character.level ?? 1;
    return 50 + (con * 5) + (level * 10);
}

/**
 * Calculate max Mana for a character based on their stats and level.
 * Formula: 20 + (Intelligence * 3) + (Level * 5)
 */
export function calculateMaxMana(character: { baseStats?: CharacterStats; level?: number }): number {
    const int = character.baseStats?.intelligence ?? 10;
    const level = character.level ?? 1;
    return 20 + (int * 3) + (level * 5);
}

/**
 * Migrate character data from schema v1 to schema v2.
 * Adds all new Phase 3 fields with appropriate defaults.
 * 
 * @param oldData - Character data (possibly from older schema)
 * @returns Migrated character data conforming to schema v2
 */
export function migrateCharacterV1toV2(oldData: Record<string, unknown>): Character {
    // Already v2 or higher? Chain to next migration
    if (oldData.schemaVersion === 2) {
        return migrateCharacterV2toV3(oldData);
    }
    if ((oldData.schemaVersion as number) >= 3) {
        return oldData as unknown as Character;
    }

    // Calculate HP/Mana based on existing stats
    const maxHP = calculateMaxHP(oldData as { baseStats?: CharacterStats; level?: number });
    const maxMana = calculateMaxMana(oldData as { baseStats?: CharacterStats; level?: number });

    // Build migrated character
    const migrated: Record<string, unknown> = {
        // Copy all existing fields
        ...(oldData as object),

        // Bump schema version
        schemaVersion: 2,

        // Migrate equipped gear format
        equippedGear: migrateEquippedGear(oldData.equippedGear),

        // Phase 3A: Gear System defaults
        gold: (oldData.gold as number) ?? 0,
        gearInventory: (oldData.gearInventory as import('./Gear').GearItem[]) ?? [],
        inventoryLimit: (oldData.inventoryLimit as number) ?? 50,

        // Phase 3B: Fight System defaults
        currentHP: (oldData.currentHP as number) ?? maxHP,
        maxHP: (oldData.maxHP as number) ?? maxHP,
        currentMana: (oldData.currentMana as number) ?? maxMana,
        maxMana: (oldData.maxMana as number) ?? maxMana,
        stamina: (oldData.stamina as number) ?? 10,
        staminaGainedToday: (oldData.staminaGainedToday as number) ?? 0,
        lastStaminaResetDate: (oldData.lastStaminaResetDate as string | null) ?? getLocalDateString(),

        // Phase 3C: Exploration defaults
        dungeonKeys: (oldData.dungeonKeys as number) ?? 0,
    };

    // Chain to v2 → v3 migration
    return migrateCharacterV2toV3(migrated);
}

/**
 * Migrate character data from schema v2 to schema v3.
 * Adds status and recoveryTimerEnd fields for death penalty system.
 * 
 * @param oldData - Character data at schema v2
 * @returns Migrated character data conforming to schema v3
 */
export function migrateCharacterV2toV3(oldData: Record<string, unknown>): Character {
    // Already v3 or higher? Return as-is
    if ((oldData.schemaVersion as number) >= 3) {
        return oldData as unknown as Character;
    }

    // Build migrated character
    const migrated: Character = {
        // Copy all existing fields
        ...(oldData as object),

        // Bump schema version
        schemaVersion: 3,

        // Phase 3B Step 9: Death Penalty defaults
        status: (oldData.status as string) ?? 'active',
        recoveryTimerEnd: (oldData.recoveryTimerEnd as string | null) ?? null,
    } as Character;

    return migrated;
}

