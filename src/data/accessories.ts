/**
 * Accessories Data File
 * 
 * Contains all curated accessory templates (T2–T4), boss-specific accessories,
 * T1 procedural name pools, and the lazy-initialized template registry.
 * 
 * Ring of the Completionist and Amulet of Dedication migrated from uniqueItems.ts.
 * 
 * ~650 lines — acceptable for a data file per project guidelines.
 */

import { StatType } from '../models/Character';

// ============================================
// Accessory Effect Types
// ============================================

/**
 * All valid accessory effect types.
 * Grouped by the AccessoryEffectService method that resolves them.
 */
export type AccessoryEffectType =
    // Gold multipliers (getGoldMultiplier)
    | 'gold_quest'
    | 'gold_combat'
    | 'gold_dungeon'
    | 'gold_sell'
    | 'gold_daily'
    | 'gold_all'
    // XP multipliers (getXPMultiplier)
    | 'xp_quest'
    | 'xp_combat'
    | 'xp_dungeon'
    | 'xp_recurring'
    | 'xp_first_daily'
    | 'xp_stat_gain'
    | 'xp_all'
    // Combat bonuses (getCombatBonus)
    | 'combat_crit'
    | 'combat_dodge'
    | 'combat_block'
    | 'combat_phys_def'
    | 'combat_mag_def'
    | 'combat_max_hp'
    | 'combat_max_mana'
    | 'combat_crit_damage'
    | 'combat_attack'
    | 'combat_fire_resist'
    // Conditional bonuses (getConditionalBonus)
    | 'conditional_crit_above_75'
    | 'conditional_attack_below_50'
    // Passive procs (getPassiveProc)
    | 'proc_lifesteal'
    | 'proc_poison_chance'
    // Loot bonuses (getLootBonus)
    | 'loot_gear_tier'
    | 'loot_gear_drop'
    | 'loot_set_chance'
    | 'loot_smelt_double'
    // Utility bonuses (getUtilityBonus)
    | 'utility_stamina_cap'
    | 'utility_potion_healing'
    | 'utility_streak_shield'
    | 'utility_boss_consumable'
    // Dungeon bonuses (getDungeonBonus)
    | 'dungeon_map_reveal'
    | 'dungeon_golden_chest'
    | 'dungeon_auto_revive'
    // Stat multipliers (getStatMultiplier)
    | 'stat_multiplier_all';

// ============================================
// Accessory Interfaces
// ============================================

/**
 * A single effect on an accessory template.
 * Supports multi-effect accessories (e.g., +5% phys def AND +5% attack).
 */
export interface AccessoryEffect {
    /** Effect type — must be a valid AccessoryEffectType */
    type: AccessoryEffectType;
    /** Effect value (percentage as decimal, e.g., 0.10 = 10%) */
    value: number;
    /** Optional source filter for gold/XP multipliers */
    source?: string;
}

/**
 * Cosmetic accessory slot type (ring / amulet / charm).
 * Any accessory type can equip in any accessory1/2/3 slot.
 */
export type AccessoryType = 'ring' | 'amulet' | 'charm';

/**
 * Accessory tier — T1 is auto-generated, T2–T4 are curated.
 */
export type AccessoryTier = 'T1' | 'T2' | 'T3' | 'T4';

/**
 * A curated accessory template with fixed abilities.
 * T1 accessories are auto-generated and don't use templates.
 */
export interface AccessoryTemplate {
    /** Unique template identifier */
    templateId: string;
    /** Display name */
    name: string;
    /** Cosmetic accessory type (ring / amulet / charm) */
    accessoryType: AccessoryType;
    /** Accessory tier (T2–T4 for curated items) */
    tier: AccessoryTier;
    /** Stat bonuses — uses Partial<Record<StatType, number>> for flexibility */
    stats: Partial<Record<StatType, number>>;
    /** Passive effects (one or more) */
    effects: AccessoryEffect[];
    /** True for trade-off items with negative effects (e.g., Void Shard's -5% HP) */
    hasNegativeEffect?: boolean;
    /** Boss template ID if this is a boss-exclusive drop */
    bossTemplateId?: string;
}

// ============================================
// Level-Gated Tier Pool
// ============================================

/**
 * Tier weights by player level bracket.
 * Used when an accessory slot is selected from the gear drop pool.
 */
export const ACCESSORY_TIER_POOLS: { maxLevel: number; weights: Record<AccessoryTier, number> }[] = [
    { maxLevel: 5, weights: { T1: 100, T2: 0, T3: 0, T4: 0 } },
    { maxLevel: 15, weights: { T1: 80, T2: 20, T3: 0, T4: 0 } },
    { maxLevel: 25, weights: { T1: 55, T2: 35, T3: 10, T4: 0 } },
    { maxLevel: 35, weights: { T1: 30, T2: 35, T3: 25, T4: 10 } },
    { maxLevel: 40, weights: { T1: 15, T2: 30, T3: 30, T4: 25 } },
];

// ============================================
// T2 Curated Accessories — Economy & Gold (5)
// ============================================

const MERCHANTS_SIGNET: AccessoryTemplate = {
    templateId: 'merchants_signet',
    name: "Merchant's Signet",
    accessoryType: 'ring',
    tier: 'T2',
    stats: { charisma: 8, wisdom: 4 },
    effects: [{ type: 'gold_quest', value: 0.10 }],
};

const COIN_COLLECTORS_TOKEN: AccessoryTemplate = {
    templateId: 'coin_collectors_token',
    name: "Coin Collector's Token",
    accessoryType: 'charm',
    tier: 'T2',
    stats: { charisma: 6 },
    effects: [{ type: 'gold_combat', value: 0.15 }],
};

const MISERS_PENDANT: AccessoryTemplate = {
    templateId: 'misers_pendant',
    name: "Miser's Pendant",
    accessoryType: 'amulet',
    tier: 'T2',
    stats: { wisdom: 10 },
    effects: [{ type: 'gold_sell', value: 0.20 }],
};

const FORTUNE_COOKIE_CHARM: AccessoryTemplate = {
    templateId: 'fortune_cookie_charm',
    name: 'Fortune Cookie Charm',
    accessoryType: 'charm',
    tier: 'T2',
    stats: { charisma: 4, wisdom: 4 },
    effects: [{ type: 'gold_dungeon', value: 0.10 }],
};

const TAXMANS_RING: AccessoryTemplate = {
    templateId: 'taxmans_ring',
    name: "Taxman's Ring",
    accessoryType: 'ring',
    tier: 'T2',
    stats: { intelligence: 6, charisma: 6 },
    effects: [{ type: 'gold_daily', value: 1.00 }], // Doubles gold from daily quests
};

// ============================================
// T2 Curated Accessories — Combat (6)
// ============================================

const BERSERKERS_BAND: AccessoryTemplate = {
    templateId: 'berserkers_band',
    name: "Berserker's Band",
    accessoryType: 'ring',
    tier: 'T2',
    stats: { strength: 12 },
    effects: [{ type: 'combat_crit', value: 0.05 }],
};

const GUARDIANS_TALISMAN: AccessoryTemplate = {
    templateId: 'guardians_talisman',
    name: "Guardian's Talisman",
    accessoryType: 'amulet',
    tier: 'T2',
    stats: { constitution: 10, dexterity: 4 },
    effects: [{ type: 'combat_block', value: 0.08 }],
};

const WINDRUNNERS_ANKLET: AccessoryTemplate = {
    templateId: 'windrunners_anklet',
    name: "Windrunner's Anklet",
    accessoryType: 'charm',
    tier: 'T2',
    stats: { dexterity: 10 },
    effects: [{ type: 'combat_dodge', value: 0.06 }],
};

const VAMPIRES_FANG: AccessoryTemplate = {
    templateId: 'vampires_fang',
    name: "Vampire's Fang",
    accessoryType: 'ring',
    tier: 'T2',
    stats: { strength: 8, dexterity: 4 },
    effects: [{ type: 'proc_lifesteal', value: 0.05 }],
};

const IRONHIDE_BROOCH: AccessoryTemplate = {
    templateId: 'ironhide_brooch',
    name: 'Ironhide Brooch',
    accessoryType: 'amulet',
    tier: 'T2',
    stats: { constitution: 8 },
    effects: [{ type: 'combat_phys_def', value: 0.10 }],
};

const SPELL_WARD_PENDANT: AccessoryTemplate = {
    templateId: 'spell_ward_pendant',
    name: 'Spell Ward Pendant',
    accessoryType: 'amulet',
    tier: 'T2',
    stats: { wisdom: 8, intelligence: 6 },
    effects: [{ type: 'combat_mag_def', value: 0.10 }],
};

// ============================================
// T2 Curated Accessories — XP & Progression (6)
// ============================================

const SCHOLARS_MONOCLE: AccessoryTemplate = {
    templateId: 'scholars_monocle',
    name: "Scholar's Monocle",
    accessoryType: 'charm',
    tier: 'T2',
    stats: { intelligence: 8, wisdom: 6 },
    effects: [{ type: 'xp_quest', value: 0.10 }],
};

const BATTLE_MEDALLION: AccessoryTemplate = {
    templateId: 'battle_medallion',
    name: 'Battle Medallion',
    accessoryType: 'amulet',
    tier: 'T2',
    stats: { strength: 6, constitution: 6 },
    effects: [{ type: 'xp_combat', value: 0.15 }],
};

const EXPLORERS_COMPASS: AccessoryTemplate = {
    templateId: 'explorers_compass',
    name: "Explorer's Compass",
    accessoryType: 'charm',
    tier: 'T2',
    stats: { wisdom: 6 },
    effects: [{ type: 'xp_dungeon', value: 0.15 }],
};

const APPRENTICES_LOOP: AccessoryTemplate = {
    templateId: 'apprentices_loop',
    name: "Apprentice's Loop",
    accessoryType: 'ring',
    tier: 'T2',
    stats: { intelligence: 10 },
    effects: [{ type: 'xp_stat_gain', value: 0.05 }],
};

const DEDICATED_WORKERS_PIN: AccessoryTemplate = {
    templateId: 'dedicated_workers_pin',
    name: "Dedicated Worker's Pin",
    accessoryType: 'charm',
    tier: 'T2',
    stats: { constitution: 4, wisdom: 4 },
    effects: [{ type: 'xp_recurring', value: 0.20 }],
};

const EARLY_BIRD_BROOCH: AccessoryTemplate = {
    templateId: 'early_bird_brooch',
    name: 'Early Bird Brooch',
    accessoryType: 'charm',
    tier: 'T2',
    stats: { dexterity: 6 },
    effects: [{ type: 'xp_first_daily', value: 0.10 }],
};

// ============================================
// T3 Curated Accessories — Loot & Drop Rate (4)
// ============================================

const LUCKY_RABBITS_FOOT: AccessoryTemplate = {
    templateId: 'lucky_rabbits_foot',
    name: "Lucky Rabbit's Foot",
    accessoryType: 'charm',
    tier: 'T3',
    stats: { charisma: 6, dexterity: 4 },
    effects: [{ type: 'loot_gear_tier', value: 0.05 }],
};

const TREASURE_HUNTERS_LOOP: AccessoryTemplate = {
    templateId: 'treasure_hunters_loop',
    name: "Treasure Hunter's Loop",
    accessoryType: 'ring',
    tier: 'T3',
    stats: { charisma: 8 },
    effects: [{ type: 'loot_gear_drop', value: 0.10 }],
};

const BLACKSMITHS_FAVOR: AccessoryTemplate = {
    templateId: 'blacksmiths_favor',
    name: "Blacksmith's Favor",
    accessoryType: 'ring',
    tier: 'T3',
    stats: { strength: 6 },
    effects: [{ type: 'loot_smelt_double', value: 0.15 }],
};

const COLLECTORS_MONOCLE: AccessoryTemplate = {
    templateId: 'collectors_monocle',
    name: "Collector's Monocle",
    accessoryType: 'charm',
    tier: 'T3',
    stats: {},
    effects: [{ type: 'loot_set_chance', value: 0.10 }],
};

// ============================================
// T3 Curated Accessories — Survival, Utility & Economy (5)
// ============================================

const HEALERS_CRYSTAL: AccessoryTemplate = {
    templateId: 'healers_crystal',
    name: "Healer's Crystal",
    accessoryType: 'amulet',
    tier: 'T3',
    stats: { wisdom: 10 },
    effects: [{ type: 'utility_potion_healing', value: 0.20 }],
};

const STAMINA_SASH: AccessoryTemplate = {
    templateId: 'stamina_sash',
    name: 'Stamina Sash',
    accessoryType: 'charm',
    tier: 'T3',
    stats: { dexterity: 6, constitution: 4 },
    effects: [{ type: 'utility_stamina_cap', value: 5 }],
};

const MANA_WELLSPRING_RING: AccessoryTemplate = {
    templateId: 'mana_wellspring_ring',
    name: 'Mana Wellspring Ring',
    accessoryType: 'ring',
    tier: 'T3',
    stats: { intelligence: 10 },
    effects: [{ type: 'combat_max_mana', value: 0.15 }],
};

const STREAK_SHIELD_CHARM: AccessoryTemplate = {
    templateId: 'streak_shield_charm',
    name: 'Streak Shield Charm',
    accessoryType: 'charm',
    tier: 'T3',
    stats: { charisma: 4, wisdom: 4 },
    effects: [{ type: 'utility_streak_shield', value: 1 }],
};

const ALCHEMISTS_PURSE: AccessoryTemplate = {
    templateId: 'alchemists_purse',
    name: "Alchemist's Purse",
    accessoryType: 'charm',
    tier: 'T3',
    stats: {},
    effects: [{ type: 'gold_all', value: 0.25 }],
};

// ============================================
// T4 Curated Accessories — Legendary (4)
// ============================================

const PHOENIX_FEATHER: AccessoryTemplate = {
    templateId: 'phoenix_feather',
    name: 'Phoenix Feather',
    accessoryType: 'charm',
    tier: 'T4',
    stats: { constitution: 6 },
    effects: [{ type: 'dungeon_auto_revive', value: 1 }],
};

const MAGPIES_BROOCH: AccessoryTemplate = {
    templateId: 'magpies_brooch',
    name: "Magpie's Brooch",
    accessoryType: 'charm',
    tier: 'T4',
    stats: { charisma: 4 },
    effects: [{ type: 'utility_boss_consumable', value: 1 }],
};

const PROSPECTORS_PENDANT: AccessoryTemplate = {
    templateId: 'prospectors_pendant',
    name: "Prospector's Pendant",
    accessoryType: 'amulet',
    tier: 'T4',
    stats: { wisdom: 6, intelligence: 4 },
    effects: [{ type: 'dungeon_golden_chest', value: 0.10 }],
};

const CARTOGRAPHERS_LENS: AccessoryTemplate = {
    templateId: 'cartographers_lens',
    name: "Cartographer's Lens",
    accessoryType: 'charm',
    tier: 'T4',
    stats: { wisdom: 8 },
    effects: [{ type: 'dungeon_map_reveal', value: 1 }],
};

// ============================================
// Achievement Accessories (migrated from uniqueItems.ts)
// ============================================

const RING_OF_THE_COMPLETIONIST: AccessoryTemplate = {
    templateId: 'ring_of_completionist',
    name: 'Ring of the Completionist',
    accessoryType: 'ring',
    tier: 'T4',
    stats: { wisdom: 20, intelligence: 10, charisma: 10 },
    effects: [{ type: 'xp_all', value: 0.05 }],
};

const AMULET_OF_DEDICATION: AccessoryTemplate = {
    templateId: 'amulet_of_dedication',
    name: 'Amulet of Dedication',
    accessoryType: 'amulet',
    tier: 'T3',
    stats: { constitution: 18, wisdom: 12 },
    effects: [{ type: 'utility_streak_shield', value: 1 }],
};

// ============================================
// Boss-Specific Accessories (20)
// ============================================

const FANG_OF_THE_PACK_LEADER: AccessoryTemplate = {
    templateId: 'fang_of_pack_leader',
    name: 'Fang of the Pack Leader',
    accessoryType: 'ring',
    tier: 'T3',
    stats: {},
    effects: [{ type: 'conditional_crit_above_75', value: 0.08 }],
    bossTemplateId: 'boss-alpha-wolf',
};

const HIBERNATION_STONE: AccessoryTemplate = {
    templateId: 'hibernation_stone',
    name: 'Hibernation Stone',
    accessoryType: 'amulet',
    tier: 'T3',
    stats: {},
    effects: [{ type: 'utility_potion_healing', value: 0.20 }],
    bossTemplateId: 'boss-grizzled-ancient',
};

const CROWN_OF_THE_SWARM: AccessoryTemplate = {
    templateId: 'crown_of_the_swarm',
    name: 'Crown of the Swarm',
    accessoryType: 'charm',
    tier: 'T4',
    stats: {},
    effects: [{ type: 'gold_combat', value: 0.20 }],
    bossTemplateId: 'boss-rat-king',
};

const SCYTHE_FRAGMENT_PENDANT: AccessoryTemplate = {
    templateId: 'scythe_fragment_pendant',
    name: 'Scythe Fragment Pendant',
    accessoryType: 'amulet',
    tier: 'T3',
    stats: {},
    effects: [{ type: 'combat_phys_def', value: 0.10 }],
    bossTemplateId: 'boss-bone-collector',
};

const PHYLACTERY_SHARD: AccessoryTemplate = {
    templateId: 'phylactery_shard',
    name: 'Phylactery Shard',
    accessoryType: 'charm',
    tier: 'T4',
    stats: {},
    effects: [
        { type: 'combat_max_mana', value: 0.15 },
        { type: 'combat_mag_def', value: 0.10 },
    ],
    bossTemplateId: 'boss-lich',
};

const SPECTRAL_OATH_RING: AccessoryTemplate = {
    templateId: 'spectral_oath_ring',
    name: 'Spectral Oath Ring',
    accessoryType: 'ring',
    tier: 'T3',
    stats: {},
    effects: [{ type: 'combat_dodge', value: 0.08 }],
    bossTemplateId: 'boss-wraith-lord',
};

const WARLORDS_WAR_BAND: AccessoryTemplate = {
    templateId: 'warlords_war_band',
    name: "Warlord's War Band",
    accessoryType: 'ring',
    tier: 'T2',
    stats: {},
    effects: [
        { type: 'combat_phys_def', value: 0.05 },
        { type: 'combat_attack', value: 0.05 },
    ],
    bossTemplateId: 'boss-goblin-warlord',
};

const TYRANTS_KNUCKLE_RING: AccessoryTemplate = {
    templateId: 'tyrants_knuckle_ring',
    name: "Tyrant's Knuckle Ring",
    accessoryType: 'ring',
    tier: 'T3',
    stats: {},
    effects: [{ type: 'combat_crit_damage', value: 0.10 }],
    bossTemplateId: 'boss-bugbear-tyrant',
};

const STONEBLOOD_AMULET: AccessoryTemplate = {
    templateId: 'stoneblood_amulet',
    name: 'Stoneblood Amulet',
    accessoryType: 'amulet',
    tier: 'T3',
    stats: {},
    effects: [{ type: 'combat_max_hp', value: 0.15 }],
    bossTemplateId: 'boss-mountain-troll',
};

const TOXIC_FANG_CHARM: AccessoryTemplate = {
    templateId: 'toxic_fang_charm',
    name: 'Toxic Fang Charm',
    accessoryType: 'charm',
    tier: 'T3',
    stats: {},
    effects: [{ type: 'proc_poison_chance', value: 0.10 }],
    bossTemplateId: 'boss-swamp-horror',
};

const SHADES_STEP_ANKLET: AccessoryTemplate = {
    templateId: 'shades_step_anklet',
    name: "Shade's Step Anklet",
    accessoryType: 'charm',
    tier: 'T4',
    stats: {},
    effects: [
        { type: 'combat_dodge', value: 0.12 },
        { type: 'combat_crit', value: 0.08 },
    ],
    bossTemplateId: 'boss-shadow-assassin',
};

const MATRIARCHS_DARK_SIGIL: AccessoryTemplate = {
    templateId: 'matriarchs_dark_sigil',
    name: "Matriarch's Dark Sigil",
    accessoryType: 'ring',
    tier: 'T4',
    stats: {},
    effects: [
        { type: 'combat_mag_def', value: 0.15 },
        { type: 'xp_combat', value: 0.10 },
    ],
    bossTemplateId: 'boss-dark-matriarch',
};

const IRONFORGE_SEAL: AccessoryTemplate = {
    templateId: 'ironforge_seal',
    name: 'Ironforge Seal',
    accessoryType: 'ring',
    tier: 'T3',
    stats: {},
    effects: [
        { type: 'combat_phys_def', value: 0.15 },
        { type: 'combat_block', value: 0.05 },
    ],
    bossTemplateId: 'boss-ironforge-champion',
};

const RUNESTONE_PENDANT: AccessoryTemplate = {
    templateId: 'runestone_pendant',
    name: 'Runestone Pendant',
    accessoryType: 'amulet',
    tier: 'T3',
    stats: {},
    effects: [{ type: 'conditional_attack_below_50', value: 0.10 }],
    bossTemplateId: 'boss-rune-berserker',
};

const MOLTEN_SCALE_CHARM: AccessoryTemplate = {
    templateId: 'molten_scale_charm',
    name: 'Molten Scale Charm',
    accessoryType: 'charm',
    tier: 'T3',
    stats: {},
    effects: [
        { type: 'combat_fire_resist', value: 0.10 },
        { type: 'combat_phys_def', value: 0.05 },
    ],
    bossTemplateId: 'boss-elder-drake',
};

const VENOMTIP_FANG_RING: AccessoryTemplate = {
    templateId: 'venomtip_fang_ring',
    name: 'Venomtip Fang Ring',
    accessoryType: 'ring',
    tier: 'T3',
    stats: {},
    effects: [{ type: 'proc_poison_chance', value: 0.08 }],
    bossTemplateId: 'boss-wyvern-matriarch',
};

const HEART_OF_THE_WYRM: AccessoryTemplate = {
    templateId: 'heart_of_the_wyrm',
    name: 'Heart of the Wyrm',
    accessoryType: 'amulet',
    tier: 'T4',
    stats: {},
    effects: [{ type: 'stat_multiplier_all', value: 0.10 }],
    bossTemplateId: 'boss-ancient-dragon',
};

const GREEDY_MAW_TOKEN: AccessoryTemplate = {
    templateId: 'greedy_maw_token',
    name: 'Greedy Maw Token',
    accessoryType: 'charm',
    tier: 'T3',
    stats: {},
    effects: [
        { type: 'loot_gear_drop', value: 0.15 },
        { type: 'gold_dungeon', value: 0.15 },
    ],
    bossTemplateId: 'boss-the-devourer',
};

const ALL_SEEING_EYE: AccessoryTemplate = {
    templateId: 'all_seeing_eye',
    name: 'All-Seeing Eye',
    accessoryType: 'charm',
    tier: 'T4',
    stats: {},
    effects: [
        { type: 'dungeon_map_reveal', value: 1 },
        { type: 'combat_mag_def', value: 0.10 },
    ],
    bossTemplateId: 'boss-beholder',
};

const VOID_SHARD: AccessoryTemplate = {
    templateId: 'void_shard',
    name: 'Void Shard',
    accessoryType: 'amulet',
    tier: 'T4',
    stats: {},
    effects: [
        { type: 'xp_all', value: 0.10 },
        { type: 'combat_max_hp', value: -0.05 },
    ],
    hasNegativeEffect: true,
    bossTemplateId: 'boss-void-spawn',
};

// ============================================
// All Curated Templates (for registry)
// ============================================

/** All 52 curated accessory templates (30 general + 20 boss + 2 achievement) */
const ALL_TEMPLATES: AccessoryTemplate[] = [
    // T2 — Economy & Gold
    MERCHANTS_SIGNET, COIN_COLLECTORS_TOKEN, MISERS_PENDANT, FORTUNE_COOKIE_CHARM, TAXMANS_RING,
    // T2 — Combat
    BERSERKERS_BAND, GUARDIANS_TALISMAN, WINDRUNNERS_ANKLET, VAMPIRES_FANG, IRONHIDE_BROOCH, SPELL_WARD_PENDANT,
    // T2 — XP & Progression
    SCHOLARS_MONOCLE, BATTLE_MEDALLION, EXPLORERS_COMPASS, APPRENTICES_LOOP, DEDICATED_WORKERS_PIN, EARLY_BIRD_BROOCH,
    // T3 — Loot & Drop Rate
    LUCKY_RABBITS_FOOT, TREASURE_HUNTERS_LOOP, BLACKSMITHS_FAVOR, COLLECTORS_MONOCLE,
    // T3 — Survival, Utility & Economy
    HEALERS_CRYSTAL, STAMINA_SASH, MANA_WELLSPRING_RING, STREAK_SHIELD_CHARM, ALCHEMISTS_PURSE,
    // T4 — Legendary
    PHOENIX_FEATHER, MAGPIES_BROOCH, PROSPECTORS_PENDANT, CARTOGRAPHERS_LENS,
    // Achievement accessories (migrated from uniqueItems.ts)
    RING_OF_THE_COMPLETIONIST, AMULET_OF_DEDICATION,
    // Boss-specific accessories
    FANG_OF_THE_PACK_LEADER, HIBERNATION_STONE, CROWN_OF_THE_SWARM, SCYTHE_FRAGMENT_PENDANT,
    PHYLACTERY_SHARD, SPECTRAL_OATH_RING, WARLORDS_WAR_BAND, TYRANTS_KNUCKLE_RING,
    STONEBLOOD_AMULET, TOXIC_FANG_CHARM, SHADES_STEP_ANKLET, MATRIARCHS_DARK_SIGIL,
    IRONFORGE_SEAL, RUNESTONE_PENDANT, MOLTEN_SCALE_CHARM, VENOMTIP_FANG_RING,
    HEART_OF_THE_WYRM, GREEDY_MAW_TOKEN, ALL_SEEING_EYE, VOID_SHARD,
];

// ============================================
// Lazy-Initialized Template Registry
// ============================================

/** Lazy-initialized Map of templateId → AccessoryTemplate */
let _templateRegistry: Map<string, AccessoryTemplate> | null = null;

/**
 * Build the template registry on first access.
 * Lazy initialization avoids loading 50+ templates at module import time.
 */
function getRegistry(): Map<string, AccessoryTemplate> {
    if (_templateRegistry === null) {
        _templateRegistry = new Map();
        for (const template of ALL_TEMPLATES) {
            _templateRegistry.set(template.templateId, template);
        }
    }
    return _templateRegistry;
}

/**
 * Get an accessory template by its ID.
 * Returns null if the ID is not found.
 */
export function getAccessoryTemplate(templateId: string): AccessoryTemplate | null {
    return getRegistry().get(templateId) ?? null;
}

/**
 * Get all accessory templates for a specific tier.
 */
export function getAccessoryTemplatesByTier(tier: AccessoryTier): AccessoryTemplate[] {
    return ALL_TEMPLATES.filter(t => t.tier === tier);
}

/**
 * Get all accessory templates (for validation/testing).
 */
export function getAllAccessoryTemplates(): AccessoryTemplate[] {
    return [...ALL_TEMPLATES];
}

/**
 * Reset the template registry (for testing — allows verifying lazy init).
 * @internal
 */
export function _resetRegistry(): void {
    _templateRegistry = null;
}

/**
 * Check if the template registry has been initialized.
 * @internal
 */
export function _isRegistryInitialized(): boolean {
    return _templateRegistry !== null;
}

// ============================================
// T1 Procedural Name Pools
// ============================================

/** T1 Ring name prefixes */
export const T1_RING_PREFIXES = [
    'Copper', 'Iron', 'Silver', 'Gold', 'Bronze', 'Tin', 'Brass', 'Steel', 'Cobalt',
    'Rusted', 'Tarnished', 'Polished', 'Rough-Cut', 'Scratched', 'Dull', 'Gleaming',
    'Worn', 'Battered', 'Chipped', 'Simple',
];

/** T1 Ring base names */
export const T1_RING_BASES = [
    'Ring', 'Band', 'Loop', 'Signet', 'Circlet', 'Coil', 'Hoop', 'Spiral', 'Twist',
];

/** T1 Ring suffixes (~30% chance to appear) */
export const T1_RING_SUFFIXES = [
    'of Fortitude', 'of Precision', 'of Endurance', 'of Cunning', 'of Focus',
    'of Resilience', 'of Vigor', 'of Tenacity', 'of Grit', 'of Insight',
];

/** T1 Amulet name prefixes */
export const T1_AMULET_PREFIXES = [
    'Wooden', 'Stone', 'Crystal', 'Jade', 'Obsidian', 'Amber', 'Bone', 'Coral',
    'Glass', 'Quartz', 'Pewter', 'Ivory', 'Onyx', 'Opal', 'Turquoise',
    'Weathered', 'Cracked', 'Faded', 'Dented', 'Plain',
];

/** T1 Amulet base names */
export const T1_AMULET_BASES = [
    'Amulet', 'Pendant', 'Necklace', 'Talisman', 'Medallion', 'Locket', 'Torc', 'Gorget', 'Chain',
];

/** T1 Amulet suffixes (~30% chance to appear) */
export const T1_AMULET_SUFFIXES = [
    'of Protection', 'of Warding', 'of Shielding', 'of Vitality', 'of Calm',
    'of Resolve', 'of Steadiness', 'of Balance', 'of Grounding', 'of Shelter',
];

/** T1 Charm name prefixes */
export const T1_CHARM_PREFIXES = [
    'Lucky', 'Old', 'Dusty', 'Faded', 'Cracked', 'Bent', 'Tiny', 'Strange',
    'Curious', 'Odd', 'Worn', 'Battered', 'Forgotten', 'Found', 'Salvaged',
    'Crude', 'Rough', 'Patchwork', 'Makeshift', 'Scavenged',
];

/** T1 Charm base names */
export const T1_CHARM_BASES = [
    'Charm', 'Trinket', 'Token', 'Bauble', 'Fetish', 'Talisman', 'Ornament', 'Keepsake', 'Relic',
];

/** T1 Charm suffixes (~30% chance to appear) */
export const T1_CHARM_SUFFIXES = [
    'of Luck', 'of Chance', 'of Fortune', 'of Fate', 'of Whimsy',
    'of Hope', 'of Perseverance', 'of Patience', 'of Curiosity', 'of Wonder',
];

/** All T1 name pools organized by accessory type */
export const T1_NAME_POOLS: Record<AccessoryType, {
    prefixes: string[];
    bases: string[];
    suffixes: string[];
}> = {
    ring: { prefixes: T1_RING_PREFIXES, bases: T1_RING_BASES, suffixes: T1_RING_SUFFIXES },
    amulet: { prefixes: T1_AMULET_PREFIXES, bases: T1_AMULET_BASES, suffixes: T1_AMULET_SUFFIXES },
    charm: { prefixes: T1_CHARM_PREFIXES, bases: T1_CHARM_BASES, suffixes: T1_CHARM_SUFFIXES },
};

/**
 * Generate a random T1 accessory name.
 * Pattern: [Prefix] [Base Name] [Suffix?] 
 * Suffix appears ~30% of the time.
 * 
 * @param type - Accessory type to generate name for
 * @returns Generated name (e.g., "Iron Band of Precision", "Cracked Pendant")
 */
export function generateT1AccessoryName(type: AccessoryType): string {
    const pool = T1_NAME_POOLS[type];
    const prefix = pool.prefixes[Math.floor(Math.random() * pool.prefixes.length)];
    const base = pool.bases[Math.floor(Math.random() * pool.bases.length)];

    // ~30% chance for a suffix
    if (Math.random() < 0.3) {
        const suffix = pool.suffixes[Math.floor(Math.random() * pool.suffixes.length)];
        return `${prefix} ${base} ${suffix}`;
    }

    return `${prefix} ${base}`;
}
