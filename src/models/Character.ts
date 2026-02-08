/**
 * Character Data Model
 * 
 * Character data structure with spriteVersion for cache invalidation.
 * Moved from settings.ts for proper separation of concerns.
 */

/** Current character schema version */
export const CHARACTER_SCHEMA_VERSION = 5;

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

// ============================================
// Phase 4: Activity Tracking
// ============================================

/**
 * Activity event types for progress tracking
 */
export type ActivityEventType =
    | 'quest_complete'
    | 'bounty_victory'
    | 'bounty_defeat'
    | 'dungeon_complete';

/**
 * Activity event for progress history tracking
 */
export interface ActivityEvent {
    /** Event type */
    type: ActivityEventType;
    /** Date of event (YYYY-MM-DD) */
    date: string;
    /** Full ISO timestamp */
    timestamp: string;
    /** XP gained from this event */
    xpGained: number;
    /** Gold gained from this event */
    goldGained: number;
    /** Quest ID (for quest completions) */
    questId?: string;
    /** Quest name (for display) */
    questName?: string;
    /** Quest category */
    category?: string;
    /** Dungeon template ID (for dungeon completions) */
    dungeonId?: string;
    /** Monster ID (for bounty fights) */
    monsterId?: string;
    /** Human-readable description */
    details?: string;
}

/** Maximum number of activity events to keep in history */
export const MAX_ACTIVITY_HISTORY = 1000;

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
    /** Inherent elemental type for this class (affects type effectiveness) */
    inherentType: import('./Skill').ElementalType;
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
        inherentType: 'Physical',
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
        inherentType: 'Light',
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
        inherentType: 'Lightning',
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
        inherentType: 'Arcane',
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
        inherentType: 'Dark',
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
        inherentType: 'Light',
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
        inherentType: 'Arcane',
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
    | { type: 'stat_percent_boost'; stat: StatType; value: number }  // 0.10 = +10% of calculated stat
    | { type: 'all_stats_percent_boost'; value: number }             // 0.05 = +5% to ALL stats
    | { type: 'all_stats_boost'; value: number }
    | { type: 'crit_chance'; value: number }          // Percentage (e.g., 10 = 10%)
    | { type: 'gold_multiplier'; value: number }      // 1.05 = +5% gold per stack
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
export type CollisionPolicy = 'refresh' | 'stack' | 'stack_refresh' | 'extend' | 'ignore';

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

    // ========== Phase 4: Activity Tracking ==========

    /** Activity history for progress tracking (capped at MAX_ACTIVITY_HISTORY) */
    activityHistory: ActivityEvent[];

    // ========== Phase 5: Skills System ==========

    /** Skills loadout */
    skills: {
        /** All learned skill IDs */
        unlocked: string[];
        /** Currently equipped skills (max 5) */
        equipped: string[];
    };

    /** Status effects that persist between battles (cleared by Long Rest or death recovery) */
    persistentStatusEffects: import('./StatusEffect').StatusEffect[];

    /** Map of trigger ID → last fired date (YYYY-MM-DD) for daily cooldowns */
    triggerCooldowns?: Record<string, string>;
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

        // Phase 4: Activity Tracking
        activityHistory: [],

        // Phase 5: Skills System
        skills: {
            unlocked: [],
            equipped: [],
        },
        persistentStatusEffects: [],
        triggerCooldowns: {},
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
    if ((oldData.schemaVersion as number) >= 2) {
        return migrateCharacterV2toV3(oldData);
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
    // Already v3 or higher? Chain to next migration
    if (oldData.schemaVersion === 3) {
        return migrateCharacterV3toV4(oldData);
    }
    if ((oldData.schemaVersion as number) >= 4) {
        return oldData as unknown as Character;
    }

    // Build migrated character
    const migrated: Record<string, unknown> = {
        // Copy all existing fields
        ...(oldData as object),

        // Bump schema version
        schemaVersion: 3,

        // Phase 3B Step 9: Death Penalty defaults
        status: (oldData.status as string) ?? 'active',
        recoveryTimerEnd: (oldData.recoveryTimerEnd as string | null) ?? null,
    };

    // Chain to v3 → v4 migration
    return migrateCharacterV3toV4(migrated);
}

/**
 * Migrate character data from schema v3 to schema v4.
 * Adds activityHistory array for progress tracking.
 * 
 * @param oldData - Character data at schema v3
 * @returns Migrated character data conforming to schema v4
 */
export function migrateCharacterV3toV4(oldData: Record<string, unknown>): Character {
    // Already v4 or higher? Chain to next migration
    if (oldData.schemaVersion === 4) {
        return migrateCharacterV4toV5(oldData);
    }
    if ((oldData.schemaVersion as number) >= 5) {
        return oldData as unknown as Character;
    }

    // Build migrated character
    const migrated: Record<string, unknown> = {
        // Copy all existing fields
        ...(oldData as object),

        // Bump schema version
        schemaVersion: 4,

        // Phase 4: Activity Tracking defaults
        activityHistory: (oldData.activityHistory as ActivityEvent[]) ?? [],
    };

    // Chain to v4 → v5 migration
    return migrateCharacterV4toV5(migrated);
}

/**
 * Migrate character data from schema v4 to schema v5.
 * Adds skills system fields with smart loadout based on class and level.
 * 
 * @param oldData - Character data at schema v4
 * @returns Migrated character data conforming to schema v5
 */
export function migrateCharacterV4toV5(oldData: Record<string, unknown>): Character {
    // Already v5 or higher? Return as-is
    if ((oldData.schemaVersion as number) >= 5) {
        return oldData as unknown as Character;
    }

    // Import skills lazily to avoid circular dependencies
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getUnlockedSkills } = require('../data/skills');

    const characterClass = oldData.class as CharacterClass;
    const level = (oldData.level as number) ?? 1;

    // Get skills unlocked at current level for this class
    const unlockedSkills = getUnlockedSkills(characterClass, level) as import('./Skill').Skill[];
    const unlockedIds = unlockedSkills.map((s: import('./Skill').Skill) => s.id);

    // Build smart default loadout (max 5 skills)
    const equippedIds = getDefaultSkillLoadout(unlockedSkills, 5);

    // Build migrated character by combining old data with new fields
    // Use unknown intermediate to satisfy TypeScript's strict type checking
    const migrated = {
        ...oldData,

        // Bump schema version
        schemaVersion: 5,

        // Phase 5: Skills System - populated with smart defaults
        skills: {
            unlocked: unlockedIds,
            equipped: equippedIds,
        },

        // Persistent status effects (empty for fresh migration)
        persistentStatusEffects: [],
    } as unknown as Character;

    return migrated;
}

/**
 * Build a smart default loadout that prioritizes skill variety:
 * 1. Include highest-level heal (if available)
 * 2. Include highest-level buff (if available)
 * 3. Include ultimate skill (if available, usesPerBattle defined)
 * 4. Fill remaining slots with highest-level damage skills
 * 
 * @param skills - Available skills to choose from
 * @param slots - Maximum number of slots to fill
 * @returns Array of skill IDs for the loadout
 */
function getDefaultSkillLoadout(skills: import('./Skill').Skill[], slots: number): string[] {
    const result: string[] = [];
    const used = new Set<string>();

    type SkillType = import('./Skill').Skill;

    // Helper to pick best skill matching criteria
    const pickBest = (filter: (s: SkillType) => boolean): SkillType | null => {
        const candidates = skills.filter(s => !used.has(s.id) && filter(s));
        if (candidates.length === 0) return null;
        // Sort by learn level descending (highest = strongest)
        candidates.sort((a, b) => b.learnLevel - a.learnLevel);
        return candidates[0];
    };

    // Priority 1: One heal skill (Meditate counts as heal category)
    const heal = pickBest(s => s.category === 'heal');
    if (heal) { result.push(heal.id); used.add(heal.id); }

    // Priority 2: One buff skill
    const buff = pickBest(s => s.category === 'buff');
    if (buff) { result.push(buff.id); used.add(buff.id); }

    // Priority 3: Ultimate skill (usesPerBattle defined = once per battle)
    const ultimate = pickBest(s => s.usesPerBattle !== undefined);
    if (ultimate) { result.push(ultimate.id); used.add(ultimate.id); }

    // Priority 4: Fill remaining with highest-level damage/hybrid skills
    while (result.length < slots) {
        const damage = pickBest(s => s.category === 'damage' || s.category === 'hybrid');
        if (!damage) break;
        result.push(damage.id);
        used.add(damage.id);
    }

    // If still not full, add any remaining skills (debuffs, cures, etc.)
    while (result.length < slots) {
        const any = pickBest(() => true);
        if (!any) break;
        result.push(any.id);
        used.add(any.id);
    }

    return result;
}

