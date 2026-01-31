/**
 * Skill Model
 * 
 * Defines skills, elemental types, and skill categories for the combat system.
 * Pokemon Gen 1 inspired with type effectiveness and stage mechanics.
 */

import { StatusEffectType, StatusSeverity } from './StatusEffect';
import { CharacterClass } from './Character';

// =====================
// ELEMENTAL TYPES
// =====================

/**
 * Elemental types for skills and combatants.
 * Each class has an inherent type that affects damage calculations.
 */
export type ElementalType =
    | 'Physical'   // Warrior, base attacks
    | 'Fire'       // Burn effects
    | 'Ice'        // Freeze effects
    | 'Lightning'  // Technomancer
    | 'Earth'      // Defensive
    | 'Arcane'     // Scholar, Bard
    | 'Dark'       // Rogue
    | 'Light'      // Paladin, Cleric
    | 'Poison'     // DoT specialty
    | 'Nature'     // Healing, growth
    | 'Psychic';   // Mind effects

/**
 * Mapping of classes to their inherent elemental type
 */
export const CLASS_ELEMENTAL_TYPES: Record<CharacterClass, ElementalType> = {
    warrior: 'Physical',
    paladin: 'Light',
    technomancer: 'Lightning',
    scholar: 'Arcane',
    rogue: 'Dark',
    cleric: 'Light',
    bard: 'Arcane',
};

// =====================
// SKILL CATEGORIES
// =====================

/**
 * Skill categories that determine behavior
 */
export type SkillCategory =
    | 'damage'   // Deals damage to target
    | 'heal'     // Restores HP to self or ally
    | 'buff'     // Raises stats (stages)
    | 'debuff'   // Lowers enemy stats (stages)
    | 'cure'     // Removes status effects
    | 'status'   // Applies status effects
    | 'hybrid';  // Multiple effects (e.g., damage + status)

// =====================
// SKILL EFFECT TYPES
// =====================

/**
 * Damage effect for skills
 */
export interface SkillDamageEffect {
    type: 'damage';
    /** Percentage of ATK stat (100 = 1.0x ATK) */
    power: number;
    /** Physical uses STR/physicalAttack, Magic uses INT/magicAttack */
    damageType: 'physical' | 'magic';
    /** If true, ignores target's DEF stage modifiers */
    ignoresStages?: boolean;
    /** Bonus crit chance for this skill (added to base) */
    critBonus?: number;
    /** Lifesteal percentage (0-1.0) - heal for this percentage of damage dealt */
    lifesteal?: number;
}

/**
 * Healing effect for skills
 */
export interface SkillHealEffect {
    type: 'heal';
    /** Percentage of max HP to restore */
    power: number;
    /** Target of heal */
    target: 'self' | 'ally';
}

/**
 * Stage modification effect
 */
export interface SkillStageEffect {
    type: 'stage';
    /** Which stat to modify */
    stat: 'atk' | 'def' | 'speed';
    /** Stage change (-6 to +6 range, clamped) */
    stages: number;
    /** Who receives the stage change */
    target: 'self' | 'enemy';
}

/**
 * Status application effect
 */
export interface SkillStatusEffect {
    type: 'status';
    /** Status effect to apply */
    statusType: StatusEffectType;
    /** Duration in turns (-1 = until cured) */
    duration: number;
    /** Severity for DoT effects */
    severity?: StatusSeverity;
    /** Chance to apply (0-100, 100 = guaranteed) */
    chance: number;
    /** Target of status */
    target: 'self' | 'enemy';
}

/**
 * Cure status effect
 */
export interface SkillCureEffect {
    type: 'cure';
    /** Which statuses to cure (empty = all) */
    cures: StatusEffectType[] | 'all';
    /** Target of cure */
    target: 'self' | 'ally';
}

/**
 * Mana restoration effect (for Meditate)
 */
export interface SkillManaEffect {
    type: 'mana';
    /** Percentage of max mana to restore */
    power: number;
}

/**
 * Union of all skill effects
 */
export type SkillEffect =
    | SkillDamageEffect
    | SkillHealEffect
    | SkillStageEffect
    | SkillStatusEffect
    | SkillCureEffect
    | SkillManaEffect;

// =====================
// SKILL INTERFACE
// =====================

/**
 * Player skill definition
 */
export interface Skill {
    /** Unique skill ID (e.g., 'warrior_power_strike') */
    id: string;

    /** Display name */
    name: string;

    /** Short description for tooltips */
    description: string;

    /** Icon (emoji or icon class) */
    icon: string;

    /** Elemental type for damage calculations */
    elementalType: ElementalType;

    /** Skill category */
    category: SkillCategory;

    /** Mana cost (0 for free skills like Meditate) */
    manaCost: number;

    /** Effects applied when skill is used */
    effects: SkillEffect[];

    /** Which class can learn this (empty = universal) */
    requiredClass: CharacterClass[];

    /** Level required to unlock */
    learnLevel: number;

    /** Usage limit per battle (undefined = unlimited) */
    usesPerBattle?: number;
}

/**
 * Monster skill (simplified version)
 */
export interface MonsterSkill {
    /** Skill ID */
    id: string;

    /** Display name */
    name: string;

    /** Icon */
    icon: string;

    /** Elemental type */
    elementalType: ElementalType;

    /** Damage power (percentage of ATK, 100 = 1.0x) */
    power: number;

    /** Physical or magic damage */
    damageType: 'physical' | 'magic';

    /** Optional status effect to apply */
    statusEffect?: {
        type: StatusEffectType;
        chance: number;
        duration: number;
        severity?: StatusSeverity;
    };

    /** Optional stage modification */
    stageEffect?: {
        stat: 'atk' | 'def' | 'speed';
        stages: number;
        target: 'self' | 'enemy';
    };

    /** AI weight for skill selection (higher = more likely) */
    weight: number;

    // =====================
    // Phase 4C Additions
    // =====================

    /** Skill category for AI behavior hints */
    category?: 'damage' | 'buff' | 'debuff' | 'status' | 'hybrid' | 'utility';

    /** Use condition for AI (defaults to 'always') */
    useCondition?: 'always' | 'low_hp';

    /** If true, removes all debuffs from self (for dispel skills) */
    selfCure?: boolean;

    /** Lifesteal percentage (0-1.0) for life drain skills */
    lifesteal?: number;
}

// =====================
// HELPER FUNCTIONS
// =====================

/**
 * Get skills available for a class at a given level
 */
export function getAvailableSkills(
    allSkills: Skill[],
    characterClass: CharacterClass,
    level: number
): Skill[] {
    return allSkills.filter(skill =>
        skill.learnLevel <= level &&
        (skill.requiredClass.length === 0 || skill.requiredClass.includes(characterClass))
    );
}

/**
 * Check if a skill can be used (has mana, not used if once-per-battle)
 */
export function canUseSkill(
    skill: Skill,
    currentMana: number,
    usedThisBattle: string[]
): { canUse: boolean; reason?: string } {
    if (currentMana < skill.manaCost) {
        return { canUse: false, reason: `Not enough mana (need ${skill.manaCost})` };
    }

    if (skill.usesPerBattle !== undefined && usedThisBattle.includes(skill.id)) {
        return { canUse: false, reason: 'Already used this battle' };
    }

    return { canUse: true };
}
