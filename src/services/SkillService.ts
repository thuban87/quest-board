/**
 * Skill Service
 * 
 * Orchestrator for skill execution in combat.
 * Handles validation, mana costs, damage calculation, and effect application.
 * Delegates heavy lifting to CombatService and StatusEffectService.
 * 
 * @see Skills Implementation Guide.md for full specification
 */

import {
    Skill,
    SkillEffect,
    SkillDamageEffect,
    SkillHealEffect,
    SkillStageEffect,
    SkillStatusEffect,
    SkillCureEffect,
    SkillManaEffect,
    ElementalType,
    canUseSkill,
} from '../models/Skill';
import {
    StatusEffect,
    StatusEffectType,
    StatusSeverity,
    isHardCC,
    isDoTEffect,
    getStatusDisplayName,
} from '../models/StatusEffect';
import {
    getStageMultiplier,
    MIN_STAGE,
    MAX_STAGE,
    DAMAGE_VARIANCE,
    MIN_DAMAGE,
    CRIT_MULTIPLIER,
} from '../config/combatConfig';
import { BattlePlayer, BattleMonster } from '../store/battleStore';

// =====================
// TYPE EFFECTIVENESS
// =====================

/**
 * Type effectiveness chart (Pokemon-style)
 * - strong: 2x damage dealt
 * - weak: 0.5x damage dealt
 * - immune: never (all types can damage all types in V1)
 */
export const TYPE_CHART: Record<ElementalType, { strong: ElementalType[]; weak: ElementalType[] }> = {
    Physical: { strong: ['Arcane'], weak: ['Earth', 'Dark'] },
    Fire: { strong: ['Ice', 'Nature'], weak: ['Fire', 'Earth'] },
    Ice: { strong: ['Nature', 'Lightning'], weak: ['Fire', 'Ice'] },
    Lightning: { strong: ['Fire', 'Psychic'], weak: ['Earth', 'Lightning'] },
    Earth: { strong: ['Lightning', 'Physical'], weak: ['Nature', 'Ice'] },
    Arcane: { strong: ['Dark', 'Psychic'], weak: ['Light'] },  // Physical removed for Scholar balance
    Dark: { strong: ['Light', 'Psychic'], weak: ['Arcane', 'Dark'] },
    Light: { strong: ['Dark', 'Poison'], weak: ['Arcane', 'Light'] },
    Poison: { strong: ['Nature', 'Physical'], weak: ['Light', 'Earth'] },
    Nature: { strong: ['Earth', 'Psychic'], weak: ['Fire', 'Poison'] },
    Psychic: { strong: ['Poison', 'Physical'], weak: ['Dark', 'Arcane'] },
};

/**
 * Get type effectiveness multiplier
 * @param attackType - Elemental type of the attack
 * @param defenderType - Inherent type of the defender
 * @returns Multiplier (2.0 = super effective, 0.5 = not very effective, 1.0 = neutral)
 */
export function getTypeEffectiveness(attackType: ElementalType, defenderType: ElementalType): number {
    const chart = TYPE_CHART[attackType];
    if (!chart) return 1.0;

    if (chart.strong.includes(defenderType)) {
        return 2.0; // Super effective
    }
    if (chart.weak.includes(defenderType)) {
        return 0.5; // Not very effective
    }
    return 1.0; // Neutral
}

// =====================
// SKILL RESULT INTERFACE
// =====================

/**
 * Result of executing a skill
 * Contains all information needed for BattleService to update state and log
 */
export interface SkillResult {
    success: boolean;
    skillId: string;
    skillName: string;

    // What happened
    damage?: number;
    healing?: number;
    manaRestored?: number;
    stageChanges?: { stat: 'atk' | 'def' | 'speed'; delta: number; target: 'self' | 'enemy'; capped?: boolean }[];
    statusApplied?: { type: StatusEffectType; target: 'self' | 'enemy'; severity?: StatusSeverity };
    statusCured?: StatusEffectType[];
    lifesteal?: number;

    // Combat result
    isCrit?: boolean;
    typeEffectiveness?: 'super_effective' | 'not_very_effective' | 'neutral';

    // For combat log
    logEntries: string[];

    // Mana consumed
    manaCost: number;
}

/**
 * Combatant type for skill execution (player or monster)
 */
export type Combatant = BattlePlayer | BattleMonster;

/**
 * Type guard to check if combatant is a player
 */
export function isBattlePlayer(combatant: Combatant): combatant is BattlePlayer {
    return 'volatileStatusEffects' in combatant;
}

/**
 * Get attack power based on combatant type and skill damage type.
 * - Players: Use physicalAttack or magicAttack based on skill
 * - Monsters: Use single attack value (damageType determines player defense used)
 */
function getAttackPower(combatant: Combatant, damageType: 'physical' | 'magic'): number {
    if (isBattlePlayer(combatant)) {
        return damageType === 'physical'
            ? combatant.physicalAttack
            : combatant.magicAttack;
    }
    // Monsters use single attack value for all damage types
    return combatant.attack;
}

/**
 * Get max mana from combatant (monsters have unlimited mana)
 */
function getMaxMana(combatant: Combatant): number {
    if (isBattlePlayer(combatant)) {
        return combatant.maxMana;
    }
    return 9999; // Monsters don't track mana
}

/**
 * Get status effects from combatant
 */
function getStatusEffects(combatant: Combatant): StatusEffect[] {
    if (isBattlePlayer(combatant)) {
        return combatant.volatileStatusEffects ?? [];
    }
    return combatant.statusEffects ?? [];
}

/**
 * Context needed for skill execution
 */
export interface SkillExecutionContext {
    user: Combatant;
    target: Combatant;
    userType: ElementalType;
    targetType: ElementalType;
    skillType: ElementalType; // The skill's elemental type for effectiveness
    turnNumber: number;
}

// =====================
// SKILL SERVICE
// =====================

/**
 * Execute a skill and return the result.
 * This is the main entry point for skill execution.
 * 
 * @param skill - The skill to execute
 * @param context - Execution context with user, target, and battle info
 * @returns SkillResult describing what happened
 */
export function executeSkill(skill: Skill, context: SkillExecutionContext): SkillResult {
    const { user, target, userType, targetType, turnNumber } = context;

    const result: SkillResult = {
        success: true,
        skillId: skill.id,
        skillName: skill.name,
        logEntries: [],
        manaCost: skill.manaCost,
    };

    // NOTE: BattleService already logs the skill name, so we don't add "Used X!" here

    // Process each effect in order
    for (const effect of skill.effects) {
        processEffect(effect, context, result);
    }

    return result;
}

/**
 * Process a single skill effect
 */
function processEffect(
    effect: SkillEffect,
    context: SkillExecutionContext,
    result: SkillResult
): void {
    switch (effect.type) {
        case 'damage':
            processDamageEffect(effect, context, result);
            break;
        case 'heal':
            processHealEffect(effect, context, result);
            break;
        case 'stage':
            processStageEffect(effect, context, result);
            break;
        case 'status':
            processStatusEffect(effect, context, result);
            break;
        case 'cure':
            processCureEffect(effect, context, result);
            break;
        case 'mana':
            processManaEffect(effect, context, result);
            break;
    }
}

// =====================
// EFFECT PROCESSORS
// =====================

/**
 * Process damage effect
 */
function processDamageEffect(
    effect: SkillDamageEffect,
    context: SkillExecutionContext,
    result: SkillResult
): void {
    const { user, target, skillType, targetType } = context;

    // Get base attack power using helper (handles player physical/magic split vs monster single attack)
    const baseAttack = getAttackPower(user, effect.damageType);

    // Apply ATK stage multiplier
    const atkStage = user.statStages?.atk ?? 0;
    let effectiveAttack = baseAttack * getStageMultiplier(atkStage);

    // Apply skill power multiplier (power is percentage, e.g., 150 = 1.5x)
    effectiveAttack *= (effect.power / 100);

    // Get defender defense
    const baseDefense = effect.damageType === 'physical'
        ? target.defense
        : (target as BattlePlayer).magicDefense ?? target.defense;

    // Apply DEF stage multiplier (unless ignoresStages)
    const defStage = target.statStages?.def ?? 0;
    const effectiveDefStage = effect.ignoresStages ? 0 : defStage;
    const effectiveDefense = baseDefense * getStageMultiplier(effectiveDefStage);

    // Calculate base damage using capped percentage reduction
    const reduction = Math.min(0.75, effectiveDefense / (100 + effectiveDefense));
    let damage = effectiveAttack * (1 - reduction);

    // Check for crit
    const baseCrit = user.critChance ?? 5;
    const totalCrit = baseCrit + (effect.critBonus ?? 0);
    const isCrit = Math.random() * 100 < totalCrit;

    if (isCrit) {
        // Crits ignore DEF stages - recalculate
        const critDefense = baseDefense * getStageMultiplier(0);
        const critReduction = Math.min(0.75, critDefense / (100 + critDefense));
        damage = effectiveAttack * (1 - critReduction);
        damage *= CRIT_MULTIPLIER;
        result.isCrit = true;
        result.logEntries.push('Critical hit!');
    }

    // Get type effectiveness from skill's elemental type
    const effectiveness = getTypeEffectiveness(skillType, targetType);

    if (effectiveness > 1) {
        result.typeEffectiveness = 'super_effective';
        result.logEntries.push("It's super effective!");
    } else if (effectiveness < 1) {
        result.typeEffectiveness = 'not_very_effective';
        result.logEntries.push("It's not very effective...");
    } else {
        result.typeEffectiveness = 'neutral';
    }

    damage *= effectiveness;

    // Apply damage variance (±10%)
    const variance = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIANCE;
    damage = Math.floor(damage * variance);

    // Minimum damage
    damage = Math.max(MIN_DAMAGE, damage);

    result.damage = damage;
    result.logEntries.push(`Dealt ${damage} damage!`);

    // Handle lifesteal if present
    if (effect.lifesteal && effect.lifesteal > 0 && damage > 0) {
        const healAmount = Math.floor(damage * effect.lifesteal);
        result.lifesteal = healAmount;
        result.logEntries.push(`Drained ${healAmount} HP!`);
    }
}

/**
 * Process heal effect
 */
function processHealEffect(
    effect: SkillHealEffect,
    context: SkillExecutionContext,
    result: SkillResult
): void {
    const { user, target } = context;

    // Determine heal target
    const healTarget = effect.target === 'self' ? user : target;

    // Calculate healing (power is percentage of max HP)
    const healing = Math.floor(healTarget.maxHP * (effect.power / 100));

    result.healing = healing;
    result.logEntries.push(`Restored ${healing} HP!`);
}

/**
 * Process stat stage effect
 */
function processStageEffect(
    effect: SkillStageEffect,
    context: SkillExecutionContext,
    result: SkillResult
): void {
    const { user, target } = context;

    // Determine target
    const stageTarget = effect.target === 'self' ? user : target;
    const targetName = effect.target === 'self' ? 'Your' : "Enemy's";

    // Get current stage
    const currentStage = stageTarget.statStages?.[effect.stat] ?? 0;

    // Calculate new stage (clamped)
    const newStage = Math.max(MIN_STAGE, Math.min(MAX_STAGE, currentStage + effect.stages));

    // Check if capped
    const capped = newStage === currentStage && effect.stages !== 0;

    // Record result
    if (!result.stageChanges) {
        result.stageChanges = [];
    }

    result.stageChanges.push({
        stat: effect.stat,
        delta: effect.stages,
        target: effect.target,
        capped,
    });

    // Generate log message
    const statName = effect.stat.toUpperCase();
    if (capped) {
        const direction = effect.stages > 0 ? 'higher' : 'lower';
        result.logEntries.push(`${targetName} ${statName} won't go ${direction}!`);
    } else {
        const direction = effect.stages > 0 ? 'rose' : 'fell';
        const sharply = Math.abs(effect.stages) >= 2 ? ' sharply' : '';
        result.logEntries.push(`${targetName} ${statName}${sharply} ${direction}!`);
    }
}

/**
 * Process status effect application
 */
function processStatusEffect(
    effect: SkillStatusEffect,
    context: SkillExecutionContext,
    result: SkillResult
): void {
    // Roll for chance
    if (Math.random() * 100 >= effect.chance) {
        // Status didn't apply
        return;
    }

    result.statusApplied = {
        type: effect.statusType,
        target: effect.target,
        severity: effect.severity,
    };

    const statusName = getStatusDisplayName(effect.statusType);
    const targetName = effect.target === 'self' ? 'You are' : 'Enemy is';
    result.logEntries.push(`${targetName} now ${statusName}!`);
}

/**
 * Process cure effect
 */
function processCureEffect(
    effect: SkillCureEffect,
    context: SkillExecutionContext,
    result: SkillResult
): void {
    const { user, target } = context;

    // Determine cure target
    const cureTarget = effect.target === 'self' ? user : target;

    // Get current status effects using helper
    const currentEffects = getStatusEffects(cureTarget);

    // Find effects to cure
    const toCure: StatusEffectType[] = [];

    for (const status of currentEffects) {
        // Cannot self-cure hard CC
        if (effect.target === 'self' && isHardCC(status.type)) {
            continue;
        }

        // Check if this status is curable by this skill
        if (effect.cures === 'all' || effect.cures.includes(status.type)) {
            toCure.push(status.type);
        }
    }

    if (toCure.length > 0) {
        result.statusCured = toCure;
        const curedNames = toCure.map(t => getStatusDisplayName(t)).join(', ');
        result.logEntries.push(`Cured: ${curedNames}!`);
    } else {
        result.logEntries.push('No status effects to cure.');
    }
}

/**
 * Process mana restoration effect (Meditate skill)
 */
function processManaEffect(
    effect: SkillManaEffect,
    context: SkillExecutionContext,
    result: SkillResult
): void {
    const { user } = context;

    // Calculate mana to restore (power is percentage of max mana)
    const manaRestored = Math.floor(getMaxMana(user) * (effect.power / 100));

    result.manaRestored = manaRestored;
    result.logEntries.push(`Restored ${manaRestored} Mana!`);
}

// =====================
// VALIDATION HELPERS
// =====================

/**
 * Check if a skill can be used in the current state
 * Re-exports from Skill model for convenience
 */
export { canUseSkill };

/**
 * Check if combatant is incapacitated by hard CC
 */
export function isIncapacitated(combatant: Combatant): boolean {
    const effects = getStatusEffects(combatant);

    return effects.some(e => isHardCC(e.type));
}

/**
 * Validate skill usage and return error if invalid
 */
export function validateSkillUse(
    skill: Skill,
    currentMana: number,
    usedThisBattle: string[],
    isIncapacitatedFlag: boolean
): { valid: boolean; reason?: string } {
    // Check hard CC
    if (isIncapacitatedFlag) {
        return { valid: false, reason: 'Cannot use skills while incapacitated!' };
    }

    // Use the model's validation
    const validation = canUseSkill(skill, currentMana, usedThisBattle);
    if (!validation.canUse) {
        return { valid: false, reason: validation.reason };
    }

    return { valid: true };
}

// =====================
// SKILL LOOKUP HELPERS
// =====================

// Re-export skill lookup from data module
import { getSkillById as lookupSkillById } from '../data/skills';

/**
 * Get skill by ID from definitions
 * @param skillId - The skill ID to look up
 * @returns The skill definition or undefined if not found
 */
export function getSkillById(skillId: string): Skill | undefined {
    return lookupSkillById(skillId);
}

/**
 * Clear the skill definitions cache (for testing)
 * Note: The actual cache is in src/data/skills.ts - this is a no-op for compatibility
 */
export function clearSkillCache(): void {
    // Cache is managed by src/data/skills.ts
}

// =====================
// SKILL UNLOCKING (Phase 7)
// =====================

import { CharacterClass } from '../models/Character';
import { getSkillsForClass } from '../data/skills';

/**
 * Result of checking for newly unlocked skills
 */
export interface SkillUnlockResult {
    /** Skills that were newly unlocked */
    newlyUnlocked: Skill[];
    /** Complete list of all unlocked skill IDs after this level-up */
    allUnlockedIds: string[];
}

/**
 * Check which skills unlock between two levels.
 * Handles multi-level jumps (e.g., 4→6 unlocks both level 5 and 6 skills).
 * 
 * @param characterClass - The character's class
 * @param oldLevel - Previous level (before XP gain)
 * @param newLevel - New level (after XP gain)
 * @param currentUnlockedIds - Currently unlocked skill IDs (to avoid duplicates)
 * @returns Skills that were newly unlocked and complete unlocked list
 */
export function checkAndUnlockSkills(
    characterClass: CharacterClass,
    oldLevel: number,
    newLevel: number,
    currentUnlockedIds: string[]
): SkillUnlockResult {
    // Get all skills available to this class (including universal)
    const allClassSkills = getSkillsForClass(characterClass);

    // Find skills that unlock at levels > oldLevel AND <= newLevel
    const newlyUnlocked = allClassSkills.filter(skill =>
        skill.learnLevel > oldLevel &&
        skill.learnLevel <= newLevel &&
        !currentUnlockedIds.includes(skill.id)
    );

    // Build complete unlocked list (deduped)
    const allUnlockedIds = [...new Set([
        ...currentUnlockedIds,
        ...newlyUnlocked.map(s => s.id)
    ])];

    return {
        newlyUnlocked,
        allUnlockedIds,
    };
}

/**
 * Get all skills that should be unlocked at a given level.
 * Used for initializing new characters or repairing skill data.
 * 
 * @param characterClass - The character's class
 * @param level - Current character level
 * @returns Array of skill IDs that should be unlocked
 */
export function getUnlockedSkillIdsForLevel(
    characterClass: CharacterClass,
    level: number
): string[] {
    const allClassSkills = getSkillsForClass(characterClass);
    return allClassSkills
        .filter(skill => skill.learnLevel <= level)
        .map(skill => skill.id);
}

