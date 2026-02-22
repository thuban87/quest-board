/**
 * AccessoryEffectService
 * 
 * Central resolver for accessory abilities. Pure functions only — accepts
 * EquippedGearMap as parameter, no store coupling.
 * 
 * 9 grouped methods covering ~40 effect types. Adding a new variant of an
 * existing category = data entry only, zero method changes.
 * 
 * @see src/data/accessories.ts for effect type definitions and templates
 */

import { EquippedGearMap, GearItem } from '../models/Gear';
import { StatType } from '../models/Character';
import {
    AccessoryEffect,
    AccessoryEffectType,
    getAccessoryTemplate,
} from '../data/accessories';

// ============================================
// Types
// ============================================

/** Gold multiplier source types */
export type GoldSource = 'quest' | 'combat' | 'dungeon' | 'daily' | 'sell' | 'all';

/** XP multiplier source types */
export type XPSource = 'quest' | 'combat' | 'dungeon' | 'recurring' | 'first_daily' | 'stat_gain' | 'all';

/** Combat bonus types */
export type CombatBonusType = 'crit' | 'dodge' | 'block' | 'physDef' | 'magDef' | 'maxHp' | 'maxMana' | 'critDamage' | 'attack' | 'fire_resist';

/** Conditional bonus types */
export type ConditionalBonusType = 'crit_above_75' | 'attack_below_50';

/** Passive proc types */
export type PassiveProcType = 'lifesteal' | 'poisonChance';

/** Loot bonus types */
export type LootBonusType = 'gearTier' | 'gearDrop' | 'setChance' | 'smeltDouble';

/** Utility bonus types */
export type UtilityBonusType = 'staminaCap' | 'potionHealing' | 'streakShield' | 'bossConsumable';

/** Dungeon bonus types */
export type DungeonBonusType = 'mapReveal' | 'goldenChest' | 'autoRevive';

// ============================================
// Effect Type Mapping
// ============================================

/**
 * Maps API parameter names to their AccessoryEffectType values.
 * This prevents string concatenation and keeps the mapping explicit.
 */

const GOLD_EFFECT_MAP: Record<GoldSource, AccessoryEffectType> = {
    quest: 'gold_quest',
    combat: 'gold_combat',
    dungeon: 'gold_dungeon',
    daily: 'gold_daily',
    sell: 'gold_sell',
    all: 'gold_all',
};

const XP_EFFECT_MAP: Record<XPSource, AccessoryEffectType> = {
    quest: 'xp_quest',
    combat: 'xp_combat',
    dungeon: 'xp_dungeon',
    recurring: 'xp_recurring',
    first_daily: 'xp_first_daily',
    stat_gain: 'xp_stat_gain',
    all: 'xp_all',
};

const COMBAT_EFFECT_MAP: Record<CombatBonusType, AccessoryEffectType> = {
    crit: 'combat_crit',
    dodge: 'combat_dodge',
    block: 'combat_block',
    physDef: 'combat_phys_def',
    magDef: 'combat_mag_def',
    maxHp: 'combat_max_hp',
    maxMana: 'combat_max_mana',
    critDamage: 'combat_crit_damage',
    attack: 'combat_attack',
    fire_resist: 'combat_fire_resist',
};

const CONDITIONAL_EFFECT_MAP: Record<ConditionalBonusType, AccessoryEffectType> = {
    crit_above_75: 'conditional_crit_above_75',
    attack_below_50: 'conditional_attack_below_50',
};

const PROC_EFFECT_MAP: Record<PassiveProcType, AccessoryEffectType> = {
    lifesteal: 'proc_lifesteal',
    poisonChance: 'proc_poison_chance',
};

const LOOT_EFFECT_MAP: Record<LootBonusType, AccessoryEffectType> = {
    gearTier: 'loot_gear_tier',
    gearDrop: 'loot_gear_drop',
    setChance: 'loot_set_chance',
    smeltDouble: 'loot_smelt_double',
};

const UTILITY_EFFECT_MAP: Record<UtilityBonusType, AccessoryEffectType> = {
    staminaCap: 'utility_stamina_cap',
    potionHealing: 'utility_potion_healing',
    streakShield: 'utility_streak_shield',
    bossConsumable: 'utility_boss_consumable',
};

const DUNGEON_EFFECT_MAP: Record<DungeonBonusType, AccessoryEffectType> = {
    mapReveal: 'dungeon_map_reveal',
    goldenChest: 'dungeon_golden_chest',
    autoRevive: 'dungeon_auto_revive',
};

// ============================================
// Internal Helpers
// ============================================

/** Accessory slot keys for extraction */
const ACCESSORY_SLOTS = ['accessory1', 'accessory2', 'accessory3'] as const;

/**
 * Extract all effects from equipped accessories.
 * Skips null slots, items without templateId (T1), and unknown templates.
 */
function getEquippedAccessoryEffects(gear: EquippedGearMap): AccessoryEffect[] {
    const effects: AccessoryEffect[] = [];

    for (const slot of ACCESSORY_SLOTS) {
        const item: GearItem | null = gear[slot];
        if (!item || !item.templateId) continue;

        const template = getAccessoryTemplate(item.templateId);
        if (!template) continue;

        for (const effect of template.effects) {
            effects.push(effect);
        }
    }

    return effects;
}

/**
 * Sum effect values matching a specific effect type.
 */
function sumEffects(effects: AccessoryEffect[], effectType: AccessoryEffectType): number {
    let total = 0;
    for (const effect of effects) {
        if (effect.type === effectType) {
            total += effect.value;
        }
    }
    return total;
}

// ============================================
// Public API — 9 Grouped Methods
// ============================================

/**
 * Get total gold multiplier from equipped accessories.
 * 
 * When querying a specific source (e.g., 'quest'), also includes
 * effects with source 'all' (e.g., Alchemist's Purse +25% from ALL sources).
 * When querying 'all', returns ONLY effects explicitly tagged 'gold_all'.
 * 
 * @param gear - Character's equipped gear map
 * @param source - Gold source to query
 * @returns Additive multiplier (e.g., 0.35 = +35%)
 */
export function getGoldMultiplier(gear: EquippedGearMap, source: GoldSource): number {
    const effects = getEquippedAccessoryEffects(gear);
    const effectType = GOLD_EFFECT_MAP[source];
    let total = sumEffects(effects, effectType);

    // Include 'all' effects when querying a specific source
    if (source !== 'all') {
        total += sumEffects(effects, 'gold_all');
    }

    return total;
}

/**
 * Get total XP multiplier from equipped accessories.
 * 
 * Same 'all' inclusion logic as getGoldMultiplier.
 * 
 * @param gear - Character's equipped gear map
 * @param source - XP source to query
 * @returns Additive multiplier (e.g., 0.25 = +25%)
 */
export function getXPMultiplier(gear: EquippedGearMap, source: XPSource): number {
    const effects = getEquippedAccessoryEffects(gear);
    const effectType = XP_EFFECT_MAP[source];
    let total = sumEffects(effects, effectType);

    // Include 'all' effects when querying a specific source
    if (source !== 'all') {
        total += sumEffects(effects, 'xp_all');
    }

    return total;
}

/**
 * Get total combat stat bonus from equipped accessories.
 * Returns passive stat modifiers (always-on during combat).
 * 
 * @param gear - Character's equipped gear map
 * @param type - Combat bonus type to query
 * @returns Additive bonus (percentage as decimal, e.g., 0.05 = +5%)
 */
export function getCombatBonus(gear: EquippedGearMap, type: CombatBonusType): number {
    const effects = getEquippedAccessoryEffects(gear);
    return sumEffects(effects, COMBAT_EFFECT_MAP[type]);
}

/**
 * Get conditional bonus from equipped accessories.
 * Evaluates HP-threshold conditions before returning bonus.
 * 
 * @param gear - Character's equipped gear map
 * @param type - Conditional bonus type
 * @param currentHP - Character's current HP
 * @param maxHP - Character's maximum HP
 * @returns Bonus value if condition met, 0 otherwise
 */
export function getConditionalBonus(
    gear: EquippedGearMap,
    type: ConditionalBonusType,
    currentHP: number,
    maxHP: number,
): number {
    const effects = getEquippedAccessoryEffects(gear);
    const rawValue = sumEffects(effects, CONDITIONAL_EFFECT_MAP[type]);

    if (rawValue === 0) return 0;

    // Evaluate conditions
    const hpPercent = maxHP > 0 ? currentHP / maxHP : 0;

    switch (type) {
        case 'crit_above_75':
            return hpPercent > 0.75 ? rawValue : 0;
        case 'attack_below_50':
            return hpPercent < 0.50 ? rawValue : 0;
        default:
            return 0;
    }
}

/**
 * Get passive proc chance from equipped accessories.
 * Returns proc effects that trigger on-hit during combat.
 * 
 * @param gear - Character's equipped gear map
 * @param type - Proc type to query
 * @returns Proc chance as decimal (e.g., 0.10 = 10%)
 */
export function getPassiveProc(gear: EquippedGearMap, type: PassiveProcType): number {
    const effects = getEquippedAccessoryEffects(gear);
    return sumEffects(effects, PROC_EFFECT_MAP[type]);
}

/**
 * Get loot bonus from equipped accessories.
 * 
 * @param gear - Character's equipped gear map
 * @param type - Loot bonus type to query
 * @returns Bonus value (percentage as decimal or flat amount)
 */
export function getLootBonus(gear: EquippedGearMap, type: LootBonusType): number {
    const effects = getEquippedAccessoryEffects(gear);
    return sumEffects(effects, LOOT_EFFECT_MAP[type]);
}

/**
 * Get utility bonus from equipped accessories.
 * 
 * @param gear - Character's equipped gear map
 * @param type - Utility bonus type to query
 * @returns Bonus value (count for shields, flat for stamina, percentage for healing)
 */
export function getUtilityBonus(gear: EquippedGearMap, type: UtilityBonusType): number {
    const effects = getEquippedAccessoryEffects(gear);
    return sumEffects(effects, UTILITY_EFFECT_MAP[type]);
}

/**
 * Get dungeon bonus from equipped accessories.
 * 
 * For 'mapReveal' and 'autoRevive', returns boolean (any equipped = true).
 * For 'goldenChest', returns additive percentage bonus.
 * 
 * @param gear - Character's equipped gear map
 * @param type - Dungeon bonus type to query
 * @returns boolean for mapReveal/autoRevive, number for goldenChest
 */
export function getDungeonBonus(gear: EquippedGearMap, type: DungeonBonusType): number | boolean {
    const effects = getEquippedAccessoryEffects(gear);
    const total = sumEffects(effects, DUNGEON_EFFECT_MAP[type]);

    // Map reveal and auto-revive are boolean (non-stacking)
    if (type === 'mapReveal' || type === 'autoRevive') {
        return total > 0;
    }

    return total;
}

/**
 * Get stat multiplier from equipped accessories.
 * Used for "all stats" percentage boosts (e.g., Heart of the Wyrm +10% ALL stats).
 * 
 * Wired into StatsService.ts:getTotalStat() as a multiplicative bonus
 * applied after all other stat calculations.
 * 
 * @param gear - Character's equipped gear map
 * @param _stat - Stat type (currently unused — all-stats items apply uniformly)
 * @returns Multiplier as decimal (e.g., 0.10 = +10%)
 */
export function getStatMultiplier(gear: EquippedGearMap, _stat: StatType): number {
    const effects = getEquippedAccessoryEffects(gear);
    return sumEffects(effects, 'stat_multiplier_all');
}

// ============================================
// Human-Readable Effect Labels
// ============================================

/**
 * Human-readable display labels for every AccessoryEffectType.
 * Used by tooltips and inventory modals instead of stripping prefixes.
 */
export const EFFECT_DISPLAY_LABELS: Record<string, string> = {
    // Gold
    gold_quest: 'quest gold',
    gold_combat: 'combat gold',
    gold_dungeon: 'dungeon gold',
    gold_daily: 'daily quest gold',
    gold_sell: 'sell value',
    gold_all: 'all gold',
    // XP
    xp_quest: 'quest XP',
    xp_combat: 'combat XP',
    xp_dungeon: 'dungeon XP',
    xp_recurring: 'recurring quest XP',
    xp_first_daily: 'first daily XP',
    xp_stat_gain: 'stat gain XP',
    xp_all: 'all XP',
    // Combat
    combat_crit: 'crit chance',
    combat_dodge: 'dodge chance',
    combat_block: 'block chance',
    combat_phys_def: 'physical defense',
    combat_mag_def: 'magic defense',
    combat_max_hp: 'max HP',
    combat_max_mana: 'max mana',
    combat_crit_damage: 'crit damage',
    combat_attack: 'attack power',
    combat_fire_resist: 'fire resistance',
    // Conditional
    conditional_crit_above_75: 'crit chance (above 75% HP)',
    conditional_attack_below_50: 'attack power (below 50% HP)',
    // Procs
    proc_lifesteal: 'lifesteal on hit',
    proc_poison_chance: 'poison chance on hit',
    // Loot
    loot_gear_tier: 'gear tier upgrade chance',
    loot_gear_drop: 'gear drop rate',
    loot_set_chance: 'set piece chance',
    loot_smelt_double: 'smelting double-tier chance',
    // Utility
    utility_stamina_cap: 'daily stamina cap',
    utility_potion_healing: 'potion healing',
    utility_streak_shield: 'streak shields per week',
    utility_boss_consumable: 'boss consumable drop',
    // Dungeon
    dungeon_map_reveal: 'dungeon map reveal',
    dungeon_golden_chest: 'golden chest chance',
    dungeon_auto_revive: 'auto-revive on death',
    // Stat multiplier
    stat_multiplier_all: 'all stats',
};

/**
 * Format an accessory effect as a human-readable string.
 * Example: { type: 'gold_quest', value: 0.10 } → "+10% quest gold"
 */
export function formatEffectLabel(effect: AccessoryEffect): string {
    const sign = effect.value >= 0 ? '+' : '';
    const pct = Math.abs(effect.value) < 1
        ? `${sign}${Math.round(effect.value * 100)}%`
        : `${sign}${effect.value}`;
    const label = EFFECT_DISPLAY_LABELS[effect.type] || effect.type.replace(/_/g, ' ');
    return `${pct} ${label}`;
}
