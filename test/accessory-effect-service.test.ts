/**
 * AccessoryEffectService Tests
 *
 * Phase 2.5: Tests for src/services/AccessoryEffectService.ts
 * Coverage target: ≥80% line, ≥80% branch
 * 
 * Test cases from brainstorm lines 446–457:
 * - Gold multiplier (single, stacking, source:'all', empty)
 * - XP multiplier (per source, first_daily, stat_gain)
 * - Combat bonus (each type, multi-defense)
 * - Passive procs (lifesteal, poison, none)
 * - Conditional bonus (HP threshold met/unmet)
 * - Stat multiplier (Heart of the Wyrm, non-stat items)
 * - Loot bonus (smelt double, gear tier stacking)
 * - Utility bonus (streak shield count, stamina cap)
 * - Dungeon bonus (map reveal boolean, auto-revive boolean, golden chest number)
 * - Edge cases (T1/no templateId, empty gear, null slots, invalid templateId)
 * - Multi-effect accessories (Warlord's War Band)
 */

import { describe, it, expect } from 'vitest';
import { EquippedGearMap, GearItem, createEmptyEquippedGear } from '../src/models/Gear';
import {
    getGoldMultiplier,
    getXPMultiplier,
    getCombatBonus,
    getConditionalBonus,
    getPassiveProc,
    getLootBonus,
    getUtilityBonus,
    getDungeonBonus,
    getStatMultiplier,
} from '../src/services/AccessoryEffectService';

// =====================
// TEST HELPERS
// =====================

/**
 * Create a minimal GearItem for an accessory slot with a given templateId.
 * Only fields needed for AccessoryEffectService are populated.
 */
function makeAccessory(templateId: string, slot: 'accessory1' | 'accessory2' | 'accessory3' = 'accessory1'): GearItem {
    return {
        id: `test-${templateId}`,
        name: `Test ${templateId}`,
        description: '',
        slot,
        tier: 'adept',
        level: 10,
        stats: { primaryStat: 'strength', primaryValue: 1 },
        sellValue: 10,
        iconEmoji: '💍',
        source: 'combat',
        acquiredAt: new Date().toISOString(),
        templateId,
    };
}

/**
 * Create an EquippedGearMap with accessories in specific slots.
 */
function makeGearWith(...accessories: Array<{ templateId: string; slot: 'accessory1' | 'accessory2' | 'accessory3' }>): EquippedGearMap {
    const gear = createEmptyEquippedGear();
    for (const acc of accessories) {
        gear[acc.slot] = makeAccessory(acc.templateId, acc.slot);
    }
    return gear;
}

/**
 * Create a T1 accessory (no templateId — pure stat stick).
 */
function makeT1Accessory(slot: 'accessory1' | 'accessory2' | 'accessory3' = 'accessory1'): GearItem {
    return {
        id: 'test-t1-acc',
        name: 'Iron Band',
        description: '',
        slot,
        tier: 'common',
        level: 3,
        stats: { primaryStat: 'strength', primaryValue: 5 },
        sellValue: 5,
        iconEmoji: '💍',
        source: 'combat',
        acquiredAt: new Date().toISOString(),
        // No templateId — T1 auto-generated
    };
}

// =====================
// GOLD MULTIPLIER
// =====================

describe('getGoldMultiplier', () => {
    it('returns correct value for single quest gold accessory', () => {
        const gear = makeGearWith({ templateId: 'merchants_signet', slot: 'accessory1' });
        expect(getGoldMultiplier(gear, 'quest')).toBeCloseTo(0.10);
    });

    it('returns correct value for combat gold accessory', () => {
        const gear = makeGearWith({ templateId: 'coin_collectors_token', slot: 'accessory1' });
        expect(getGoldMultiplier(gear, 'combat')).toBeCloseTo(0.15);
    });

    it('stacks multiple gold accessories additively', () => {
        const gear = makeGearWith(
            { templateId: 'merchants_signet', slot: 'accessory1' },      // +10% quest gold
            { templateId: 'alchemists_purse', slot: 'accessory2' },      // +25% ALL gold
        );
        // quest: 0.10 (signet) + 0.25 (purse, source:'all') = 0.35
        expect(getGoldMultiplier(gear, 'quest')).toBeCloseTo(0.35);
    });

    it('source "all" includes effects in specific source queries', () => {
        const gear = makeGearWith({ templateId: 'alchemists_purse', slot: 'accessory1' }); // gold_all: 0.25
        expect(getGoldMultiplier(gear, 'quest')).toBeCloseTo(0.25);
        expect(getGoldMultiplier(gear, 'combat')).toBeCloseTo(0.25);
        expect(getGoldMultiplier(gear, 'dungeon')).toBeCloseTo(0.25);
        expect(getGoldMultiplier(gear, 'sell')).toBeCloseTo(0.25);
        expect(getGoldMultiplier(gear, 'daily')).toBeCloseTo(0.25);
    });

    it('querying "all" returns only gold_all effects (not specific sources)', () => {
        const gear = makeGearWith(
            { templateId: 'merchants_signet', slot: 'accessory1' },  // gold_quest: 0.10
            { templateId: 'alchemists_purse', slot: 'accessory2' },  // gold_all: 0.25
        );
        // 'all' query should only return gold_all effects
        expect(getGoldMultiplier(gear, 'all')).toBeCloseTo(0.25);
    });

    it('returns 0 when no accessories equipped', () => {
        const gear = createEmptyEquippedGear();
        expect(getGoldMultiplier(gear, 'quest')).toBe(0);
    });
});

// =====================
// XP MULTIPLIER
// =====================

describe('getXPMultiplier', () => {
    it('returns correct value for quest XP accessory', () => {
        const gear = makeGearWith({ templateId: 'scholars_monocle', slot: 'accessory1' }); // xp_quest: 0.10
        expect(getXPMultiplier(gear, 'quest')).toBeCloseTo(0.10);
    });

    it('returns correct value for combat XP accessory', () => {
        const gear = makeGearWith({ templateId: 'battle_medallion', slot: 'accessory1' }); // xp_combat: 0.15
        expect(getXPMultiplier(gear, 'combat')).toBeCloseTo(0.15);
    });

    it('stat_gain returns Apprentice\'s Loop value', () => {
        const gear = makeGearWith({ templateId: 'apprentices_loop', slot: 'accessory1' }); // xp_stat_gain: 0.05
        expect(getXPMultiplier(gear, 'stat_gain')).toBeCloseTo(0.05);
    });

    it('first_daily returns correct value', () => {
        const gear = makeGearWith({ templateId: 'early_bird_brooch', slot: 'accessory1' }); // xp_first_daily: 0.10
        expect(getXPMultiplier(gear, 'first_daily')).toBeCloseTo(0.10);
    });

    it('recurring returns correct value', () => {
        const gear = makeGearWith({ templateId: 'dedicated_workers_pin', slot: 'accessory1' }); // xp_recurring: 0.20
        expect(getXPMultiplier(gear, 'recurring')).toBeCloseTo(0.20);
    });

    it('xp_all included in specific source queries', () => {
        const gear = makeGearWith({ templateId: 'ring_of_completionist', slot: 'accessory1' }); // xp_all: 0.05
        expect(getXPMultiplier(gear, 'quest')).toBeCloseTo(0.05);
        expect(getXPMultiplier(gear, 'combat')).toBeCloseTo(0.05);
    });

    it('stacks multiple XP sources additively', () => {
        const gear = makeGearWith(
            { templateId: 'scholars_monocle', slot: 'accessory1' },       // xp_quest: 0.10
            { templateId: 'ring_of_completionist', slot: 'accessory2' },  // xp_all: 0.05
        );
        expect(getXPMultiplier(gear, 'quest')).toBeCloseTo(0.15);
    });

    it('returns 0 for no accessories', () => {
        const gear = createEmptyEquippedGear();
        expect(getXPMultiplier(gear, 'quest')).toBe(0);
    });
});

// =====================
// COMBAT BONUS
// =====================

describe('getCombatBonus', () => {
    it('returns crit bonus', () => {
        const gear = makeGearWith({ templateId: 'berserkers_band', slot: 'accessory1' }); // combat_crit: 0.05
        expect(getCombatBonus(gear, 'crit')).toBeCloseTo(0.05);
    });

    it('returns dodge bonus', () => {
        const gear = makeGearWith({ templateId: 'windrunners_anklet', slot: 'accessory1' }); // combat_dodge: 0.06
        expect(getCombatBonus(gear, 'dodge')).toBeCloseTo(0.06);
    });

    it('returns block bonus', () => {
        const gear = makeGearWith({ templateId: 'guardians_talisman', slot: 'accessory1' }); // combat_block: 0.08
        expect(getCombatBonus(gear, 'block')).toBeCloseTo(0.08);
    });

    it('returns physical defense bonus', () => {
        const gear = makeGearWith({ templateId: 'ironhide_brooch', slot: 'accessory1' }); // combat_phys_def: 0.10
        expect(getCombatBonus(gear, 'physDef')).toBeCloseTo(0.10);
    });

    it('returns magic defense bonus', () => {
        const gear = makeGearWith({ templateId: 'spell_ward_pendant', slot: 'accessory1' }); // combat_mag_def: 0.10
        expect(getCombatBonus(gear, 'magDef')).toBeCloseTo(0.10);
    });

    it('returns max HP bonus', () => {
        const gear = makeGearWith({ templateId: 'stoneblood_amulet', slot: 'accessory1' }); // combat_max_hp: 0.15
        expect(getCombatBonus(gear, 'maxHp')).toBeCloseTo(0.15);
    });

    it('returns max mana bonus', () => {
        const gear = makeGearWith({ templateId: 'mana_wellspring_ring', slot: 'accessory1' }); // combat_max_mana: 0.15
        expect(getCombatBonus(gear, 'maxMana')).toBeCloseTo(0.15);
    });

    it('returns crit damage bonus', () => {
        const gear = makeGearWith({ templateId: 'tyrants_knuckle_ring', slot: 'accessory1' }); // combat_crit_damage: 0.10
        expect(getCombatBonus(gear, 'critDamage')).toBeCloseTo(0.10);
    });

    it('physical and magic defense sum correctly from multiple accessories', () => {
        const gear = makeGearWith(
            { templateId: 'ironhide_brooch', slot: 'accessory1' },     // combat_phys_def: 0.10
            { templateId: 'scythe_fragment_pendant', slot: 'accessory2' }, // combat_phys_def: 0.10
        );
        expect(getCombatBonus(gear, 'physDef')).toBeCloseTo(0.20);
    });

    it('returns 0 for types with no equipped bonus', () => {
        const gear = makeGearWith({ templateId: 'merchants_signet', slot: 'accessory1' }); // gold only
        expect(getCombatBonus(gear, 'crit')).toBe(0);
        expect(getCombatBonus(gear, 'dodge')).toBe(0);
    });
});

// =====================
// PASSIVE PROCS
// =====================

describe('getPassiveProc', () => {
    it('returns lifesteal percentage', () => {
        const gear = makeGearWith({ templateId: 'vampires_fang', slot: 'accessory1' }); // proc_lifesteal: 0.05
        expect(getPassiveProc(gear, 'lifesteal')).toBeCloseTo(0.05);
    });

    it('returns poison chance percentage', () => {
        const gear = makeGearWith({ templateId: 'toxic_fang_charm', slot: 'accessory1' }); // proc_poison_chance: 0.10
        expect(getPassiveProc(gear, 'poisonChance')).toBeCloseTo(0.10);
    });

    it('stacks poison chance from multiple sources', () => {
        const gear = makeGearWith(
            { templateId: 'toxic_fang_charm', slot: 'accessory1' },    // proc_poison_chance: 0.10
            { templateId: 'venomtip_fang_ring', slot: 'accessory2' },  // proc_poison_chance: 0.08
        );
        expect(getPassiveProc(gear, 'poisonChance')).toBeCloseTo(0.18);
    });

    it('returns 0 when no proc accessories equipped', () => {
        const gear = makeGearWith({ templateId: 'merchants_signet', slot: 'accessory1' });
        expect(getPassiveProc(gear, 'lifesteal')).toBe(0);
        expect(getPassiveProc(gear, 'poisonChance')).toBe(0);
    });
});

// =====================
// CONDITIONAL BONUS
// =====================

describe('getConditionalBonus', () => {
    it('returns crit bonus when HP > 75%', () => {
        const gear = makeGearWith({ templateId: 'fang_of_pack_leader', slot: 'accessory1' }); // conditional_crit_above_75: 0.08
        expect(getConditionalBonus(gear, 'crit_above_75', 80, 100)).toBeCloseTo(0.08);
    });

    it('returns 0 for crit bonus when HP < 75%', () => {
        const gear = makeGearWith({ templateId: 'fang_of_pack_leader', slot: 'accessory1' });
        expect(getConditionalBonus(gear, 'crit_above_75', 70, 100)).toBe(0);
    });

    it('returns 0 for crit bonus when HP exactly 75%', () => {
        const gear = makeGearWith({ templateId: 'fang_of_pack_leader', slot: 'accessory1' });
        // 75% is NOT > 75%, so should return 0
        expect(getConditionalBonus(gear, 'crit_above_75', 75, 100)).toBe(0);
    });

    it('returns attack bonus when HP < 50%', () => {
        const gear = makeGearWith({ templateId: 'runestone_pendant', slot: 'accessory1' }); // conditional_attack_below_50: 0.10
        expect(getConditionalBonus(gear, 'attack_below_50', 40, 100)).toBeCloseTo(0.10);
    });

    it('returns 0 for attack bonus when HP > 50%', () => {
        const gear = makeGearWith({ templateId: 'runestone_pendant', slot: 'accessory1' });
        expect(getConditionalBonus(gear, 'attack_below_50', 60, 100)).toBe(0);
    });

    it('returns 0 when no conditional accessories equipped', () => {
        const gear = makeGearWith({ templateId: 'merchants_signet', slot: 'accessory1' });
        expect(getConditionalBonus(gear, 'crit_above_75', 100, 100)).toBe(0);
    });

    it('handles maxHP of 0 gracefully (no division by zero)', () => {
        const gear = makeGearWith({ templateId: 'fang_of_pack_leader', slot: 'accessory1' });
        expect(getConditionalBonus(gear, 'crit_above_75', 0, 0)).toBe(0);
    });
});

// =====================
// STAT MULTIPLIER
// =====================

describe('getStatMultiplier', () => {
    it('Heart of the Wyrm returns 0.10 for all stat types', () => {
        const gear = makeGearWith({ templateId: 'heart_of_the_wyrm', slot: 'accessory1' }); // stat_multiplier_all: 0.10
        const stats: Array<'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'> = [
            'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
        ];
        for (const stat of stats) {
            expect(getStatMultiplier(gear, stat), `stat: ${stat}`).toBeCloseTo(0.10);
        }
    });

    it('returns 0 for items without stat_multiplier_all effect', () => {
        const gear = makeGearWith({ templateId: 'merchants_signet', slot: 'accessory1' });
        expect(getStatMultiplier(gear, 'strength')).toBe(0);
    });

    it('returns 0 for empty gear', () => {
        const gear = createEmptyEquippedGear();
        expect(getStatMultiplier(gear, 'strength')).toBe(0);
    });
});

// =====================
// LOOT BONUS
// =====================

describe('getLootBonus', () => {
    it('returns smelt double chance', () => {
        const gear = makeGearWith({ templateId: 'blacksmiths_favor', slot: 'accessory1' }); // loot_smelt_double: 0.15
        expect(getLootBonus(gear, 'smeltDouble')).toBeCloseTo(0.15);
    });

    it('returns gear tier upgrade chance', () => {
        const gear = makeGearWith({ templateId: 'lucky_rabbits_foot', slot: 'accessory1' }); // loot_gear_tier: 0.05
        expect(getLootBonus(gear, 'gearTier')).toBeCloseTo(0.05);
    });

    it('returns gear drop bonus', () => {
        const gear = makeGearWith({ templateId: 'treasure_hunters_loop', slot: 'accessory1' }); // loot_gear_drop: 0.10
        expect(getLootBonus(gear, 'gearDrop')).toBeCloseTo(0.10);
    });

    it('stacks gear drop from multiple accessories', () => {
        const gear = makeGearWith(
            { templateId: 'treasure_hunters_loop', slot: 'accessory1' }, // loot_gear_drop: 0.10
            { templateId: 'greedy_maw_token', slot: 'accessory2' },     // loot_gear_drop: 0.15
        );
        expect(getLootBonus(gear, 'gearDrop')).toBeCloseTo(0.25);
    });

    it('returns set piece chance', () => {
        const gear = makeGearWith({ templateId: 'collectors_monocle', slot: 'accessory1' }); // loot_set_chance: 0.10
        expect(getLootBonus(gear, 'setChance')).toBeCloseTo(0.10);
    });

    it('returns 0 for no loot accessories', () => {
        const gear = makeGearWith({ templateId: 'berserkers_band', slot: 'accessory1' }); // combat only
        expect(getLootBonus(gear, 'gearTier')).toBe(0);
    });
});

// =====================
// UTILITY BONUS
// =====================

describe('getUtilityBonus', () => {
    it('returns streak shield count (1 for Charm)', () => {
        const gear = makeGearWith({ templateId: 'streak_shield_charm', slot: 'accessory1' }); // utility_streak_shield: 1
        expect(getUtilityBonus(gear, 'streakShield')).toBe(1);
    });

    it('stacks streak shield from multiple sources', () => {
        const gear = makeGearWith(
            { templateId: 'streak_shield_charm', slot: 'accessory1' },  // utility_streak_shield: 1
            { templateId: 'amulet_of_dedication', slot: 'accessory2' }, // utility_streak_shield: 1
        );
        expect(getUtilityBonus(gear, 'streakShield')).toBe(2);
    });

    it('returns stamina cap flat bonus', () => {
        const gear = makeGearWith({ templateId: 'stamina_sash', slot: 'accessory1' }); // utility_stamina_cap: 5
        expect(getUtilityBonus(gear, 'staminaCap')).toBe(5);
    });

    it('returns potion healing bonus', () => {
        const gear = makeGearWith({ templateId: 'healers_crystal', slot: 'accessory1' }); // utility_potion_healing: 0.20
        expect(getUtilityBonus(gear, 'potionHealing')).toBeCloseTo(0.20);
    });

    it('returns boss consumable flag', () => {
        const gear = makeGearWith({ templateId: 'magpies_brooch', slot: 'accessory1' }); // utility_boss_consumable: 1
        expect(getUtilityBonus(gear, 'bossConsumable')).toBe(1);
    });

    it('returns 0 for no utility accessories', () => {
        const gear = createEmptyEquippedGear();
        expect(getUtilityBonus(gear, 'streakShield')).toBe(0);
    });
});

// =====================
// DUNGEON BONUS
// =====================

describe('getDungeonBonus', () => {
    it('map reveal returns true when equipped', () => {
        const gear = makeGearWith({ templateId: 'cartographers_lens', slot: 'accessory1' }); // dungeon_map_reveal: 1
        expect(getDungeonBonus(gear, 'mapReveal')).toBe(true);
    });

    it('map reveal returns false when not equipped', () => {
        const gear = createEmptyEquippedGear();
        expect(getDungeonBonus(gear, 'mapReveal')).toBe(false);
    });

    it('auto-revive returns true when equipped', () => {
        const gear = makeGearWith({ templateId: 'phoenix_feather', slot: 'accessory1' }); // dungeon_auto_revive: 1
        expect(getDungeonBonus(gear, 'autoRevive')).toBe(true);
    });

    it('auto-revive returns false when not equipped', () => {
        const gear = createEmptyEquippedGear();
        expect(getDungeonBonus(gear, 'autoRevive')).toBe(false);
    });

    it('golden chest returns percentage bonus', () => {
        const gear = makeGearWith({ templateId: 'prospectors_pendant', slot: 'accessory1' }); // dungeon_golden_chest: 0.10
        expect(getDungeonBonus(gear, 'goldenChest')).toBeCloseTo(0.10);
    });

    it('golden chest returns 0 when not equipped', () => {
        const gear = createEmptyEquippedGear();
        expect(getDungeonBonus(gear, 'goldenChest')).toBe(0);
    });

    it('map reveal is non-stacking (still true with multiple sources)', () => {
        const gear = makeGearWith(
            { templateId: 'cartographers_lens', slot: 'accessory1' },  // dungeon_map_reveal: 1
            { templateId: 'all_seeing_eye', slot: 'accessory2' },      // dungeon_map_reveal: 1
        );
        expect(getDungeonBonus(gear, 'mapReveal')).toBe(true);
    });
});

// =====================
// EDGE CASES
// =====================

describe('Edge Cases', () => {
    it('T1 item with no templateId contributes nothing', () => {
        const gear = createEmptyEquippedGear();
        gear.accessory1 = makeT1Accessory('accessory1');
        expect(getGoldMultiplier(gear, 'quest')).toBe(0);
        expect(getCombatBonus(gear, 'crit')).toBe(0);
        expect(getXPMultiplier(gear, 'quest')).toBe(0);
    });

    it('empty EquippedGearMap returns 0 for all methods', () => {
        const gear = createEmptyEquippedGear();
        expect(getGoldMultiplier(gear, 'quest')).toBe(0);
        expect(getXPMultiplier(gear, 'quest')).toBe(0);
        expect(getCombatBonus(gear, 'crit')).toBe(0);
        expect(getConditionalBonus(gear, 'crit_above_75', 100, 100)).toBe(0);
        expect(getPassiveProc(gear, 'lifesteal')).toBe(0);
        expect(getLootBonus(gear, 'gearTier')).toBe(0);
        expect(getUtilityBonus(gear, 'streakShield')).toBe(0);
        expect(getDungeonBonus(gear, 'mapReveal')).toBe(false);
        expect(getStatMultiplier(gear, 'strength')).toBe(0);
    });

    it('null slots are skipped gracefully', () => {
        const gear = createEmptyEquippedGear();
        // All accessory slots are already null from createEmptyEquippedGear
        expect(getGoldMultiplier(gear, 'quest')).toBe(0);
    });

    it('invalid templateId (not in registry) is skipped', () => {
        const gear = createEmptyEquippedGear();
        gear.accessory1 = makeAccessory('nonexistent_template_xyz');
        expect(getGoldMultiplier(gear, 'quest')).toBe(0);
        expect(getCombatBonus(gear, 'crit')).toBe(0);
    });

    it('primary gear slots are ignored (only accessory1/2/3 matter)', () => {
        const gear = createEmptyEquippedGear();
        // Put a "template" item in a non-accessory slot — it should be ignored
        gear.weapon = {
            ...makeAccessory('merchants_signet'),
            slot: 'weapon',
        };
        expect(getGoldMultiplier(gear, 'quest')).toBe(0);
    });
});

// =====================
// MULTI-EFFECT ACCESSORIES
// =====================

describe('Multi-Effect Accessories', () => {
    it('Warlord\'s War Band returns correct values for both physDef and attack', () => {
        const gear = makeGearWith({ templateId: 'warlords_war_band', slot: 'accessory1' });
        // combat_phys_def: 0.05, combat_attack: 0.05
        expect(getCombatBonus(gear, 'physDef')).toBeCloseTo(0.05);
        expect(getCombatBonus(gear, 'attack')).toBeCloseTo(0.05);
    });

    it('Shade\'s Step Anklet returns both dodge and crit', () => {
        const gear = makeGearWith({ templateId: 'shades_step_anklet', slot: 'accessory1' });
        // combat_dodge: 0.12, combat_crit: 0.08
        expect(getCombatBonus(gear, 'dodge')).toBeCloseTo(0.12);
        expect(getCombatBonus(gear, 'crit')).toBeCloseTo(0.08);
    });

    it('Phylactery Shard returns both max mana and magic defense', () => {
        const gear = makeGearWith({ templateId: 'phylactery_shard', slot: 'accessory1' });
        // combat_max_mana: 0.15, combat_mag_def: 0.10
        expect(getCombatBonus(gear, 'maxMana')).toBeCloseTo(0.15);
        expect(getCombatBonus(gear, 'magDef')).toBeCloseTo(0.10);
    });

    it('All-Seeing Eye returns both map reveal and magic defense', () => {
        const gear = makeGearWith({ templateId: 'all_seeing_eye', slot: 'accessory1' });
        // dungeon_map_reveal: 1, combat_mag_def: 0.10
        expect(getDungeonBonus(gear, 'mapReveal')).toBe(true);
        expect(getCombatBonus(gear, 'magDef')).toBeCloseTo(0.10);
    });

    it('Void Shard returns XP boost and negative HP (trade-off)', () => {
        const gear = makeGearWith({ templateId: 'void_shard', slot: 'accessory1' });
        // xp_all: 0.10, combat_max_hp: -0.05
        expect(getXPMultiplier(gear, 'quest')).toBeCloseTo(0.10);
        expect(getCombatBonus(gear, 'maxHp')).toBeCloseTo(-0.05);
    });

    it('Matriarch\'s Dark Sigil returns mag defense and combat XP', () => {
        const gear = makeGearWith({ templateId: 'matriarchs_dark_sigil', slot: 'accessory1' });
        // combat_mag_def: 0.15, xp_combat: 0.10
        expect(getCombatBonus(gear, 'magDef')).toBeCloseTo(0.15);
        expect(getXPMultiplier(gear, 'combat')).toBeCloseTo(0.10);
    });
});
