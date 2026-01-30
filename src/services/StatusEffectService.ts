/**
 * Status Effect Service
 * 
 * Handles applying, ticking, and curing status effects in combat.
 * Status effects persist between battles (stored in persistentStatusEffects).
 * Stat stages are ephemeral (reset each battle).
 */

import { StatusEffect, StatusEffectType, isDoTEffect, isHardCC, StatusSeverity } from '../models/StatusEffect';
import { ElementalType } from '../models/Skill';
import {
    STATUS_DOT_PERCENT,
    PARALYZE_SKIP_CHANCE,
    CONFUSION_SELF_HIT_CHANCE,
    BURN_DAMAGE_REDUCTION,
} from '../config/combatConfig';

// =====================
// TYPES
// =====================

/**
 * Result of ticking status effects at end of turn
 */
export interface StatusTickResult {
    /** Total DoT damage taken this tick */
    damageTaken: number;
    /** Status effects that expired this tick */
    effectsExpired: StatusEffectType[];
    /** Log messages for combat log */
    logEntries: string[];
}

/**
 * Result of checking if combatant should skip turn
 */
export interface SkipTurnCheck {
    /** Whether turn should be skipped */
    skip: boolean;
    /** Reason for skip (status effect name) */
    reason?: string;
    /** For confusion: chance to hit self instead */
    selfHitChance?: number;
}

/**
 * Combatant interface for status effect operations
 */
export interface StatusCombatant {
    name: string;
    maxHP: number;
    currentHP: number;
    volatileStatusEffects?: StatusEffect[];
    statusEffects?: StatusEffect[];
}

// =====================
// STATUS EFFECT SERVICE
// =====================

/**
 * Apply a status effect to a combatant.
 * 
 * Stacking rules:
 * - Different status types can stack (Burn + Poison = both active)
 * - Same status type replaces existing (refreshes duration)
 * - Poison stacks up to 5 times for increased damage
 * 
 * @param combatant Target to apply status to
 * @param statusType Type of status effect
 * @param duration Turns remaining (-1 = until cured)
 * @param source Who applied it (player or monster)
 * @param severity Optional severity for DoT effects
 * @param sourceSkillId Optional skill that applied this
 * @returns Log message describing what happened
 */
export function applyStatus(
    combatant: StatusCombatant,
    statusType: StatusEffectType,
    duration: number,
    source: 'player' | 'monster',
    severity?: StatusSeverity,
    sourceSkillId?: string
): string {
    // Get or create the status effects array
    const effects = combatant.volatileStatusEffects ?? combatant.statusEffects ?? [];

    // Check for existing status of same type
    const existingIndex = effects.findIndex(e => e.type === statusType);

    const newEffect: StatusEffect = {
        id: `${statusType}_${Date.now()}`,
        type: statusType,
        duration,
        severity,
        source,
        sourceSkillId,
        stacks: 1,
    };

    if (existingIndex >= 0) {
        const existing = effects[existingIndex];

        // Poison stacks (up to 5)
        if (statusType === 'poison' && (existing.stacks ?? 1) < 5) {
            existing.stacks = (existing.stacks ?? 1) + 1;
            existing.duration = duration; // Refresh duration
            return `${combatant.name}'s poison intensified! (${existing.stacks} stacks)`;
        }

        // Other statuses: replace (refresh duration)
        effects[existingIndex] = newEffect;
        return `${combatant.name}'s ${statusType} was refreshed!`;
    }

    // Add new status
    effects.push(newEffect);

    // Update combatant
    if (combatant.volatileStatusEffects !== undefined) {
        combatant.volatileStatusEffects = effects;
    } else {
        combatant.statusEffects = effects;
    }

    return `${combatant.name} is now ${getStatusVerb(statusType)}!`;
}

/**
 * Tick status effects at end of turn.
 * 
 * Processes:
 * - DoT damage (Burn, Poison, Bleed, Curse)
 * - Duration decrements
 * - Expiration of duration-based effects
 * 
 * Note: Stun always lasts exactly 1 turn and auto-clears here.
 * 
 * @param combatant Combatant to tick effects for
 * @param turnNumber Current battle turn (for logging)
 * @returns Result with damage taken and expired effects
 */
export function tickStatusEffects(
    combatant: StatusCombatant,
    turnNumber: number
): StatusTickResult {
    const effects = combatant.volatileStatusEffects ?? combatant.statusEffects ?? [];
    const result: StatusTickResult = {
        damageTaken: 0,
        effectsExpired: [],
        logEntries: [],
    };

    const effectsToRemove: number[] = [];

    for (let i = 0; i < effects.length; i++) {
        const effect = effects[i];

        // Process DoT damage
        if (isDoTEffect(effect.type)) {
            const damage = calculateDoTDamage(combatant.maxHP, effect.type, effect.severity, effect.stacks);
            result.damageTaken += damage;
            result.logEntries.push(`${combatant.name} took ${damage} ${effect.type} damage!`);
        }

        // Decrement duration (skip -1 = until cured)
        if (effect.duration > 0) {
            effect.duration--;

            if (effect.duration <= 0) {
                effectsToRemove.push(i);
                result.effectsExpired.push(effect.type);
                result.logEntries.push(`${combatant.name}'s ${effect.type} wore off!`);
            }
        }

        // Stun always clears after 1 turn
        if (effect.type === 'stun') {
            effectsToRemove.push(i);
            result.effectsExpired.push('stun');
            result.logEntries.push(`${combatant.name} is no longer stunned!`);
        }
    }

    // Remove expired effects (filter approach)
    const remaining = effects.filter((_, i) => !effectsToRemove.includes(i));

    if (combatant.volatileStatusEffects !== undefined) {
        combatant.volatileStatusEffects = remaining;
    } else {
        combatant.statusEffects = remaining;
    }

    return result;
}

/**
 * Cure status effects from a combatant.
 * 
 * Hard CC (Sleep, Paralyze, Freeze, Stun) cannot be self-cured.
 * Use 'all' to cure all curable statuses.
 * 
 * @param combatant Combatant to cure
 * @param statusTypes Array of types to cure, or 'all'
 * @param isSelfCure Whether this is self-applied (restricts hard CC curing)
 * @returns Log messages for cured effects
 */
export function cureStatus(
    combatant: StatusCombatant,
    statusTypes: StatusEffectType[] | 'all',
    isSelfCure: boolean = false
): string[] {
    const effects = combatant.volatileStatusEffects ?? combatant.statusEffects ?? [];
    const cured: string[] = [];

    const remaining = effects.filter(effect => {
        // Check if this status should be cured
        const shouldCure = statusTypes === 'all' || statusTypes.includes(effect.type);

        if (!shouldCure) return true; // Keep

        // Hard CC cannot be self-cured
        if (isSelfCure && isHardCC(effect.type)) {
            return true; // Keep (can't self-cure)
        }

        // Cure it
        cured.push(`Cured ${effect.type}!`);
        return false; // Remove
    });

    // Update combatant
    if (combatant.volatileStatusEffects !== undefined) {
        combatant.volatileStatusEffects = remaining;
    } else {
        combatant.statusEffects = remaining;
    }

    if (cured.length === 0) {
        return ['No status effects to cure'];
    }

    return cured;
}

/**
 * Check if combatant should skip their turn due to hard CC.
 * 
 * Hard CC types:
 * - Sleep: Always skip (until hit by direct damage)
 * - Freeze: Always skip (until expires or hit by Fire)
 * - Stun: Always skip (1 turn only)
 * - Paralyze: 25% chance to skip each turn
 * 
 * Confusion doesn't skip turn but has 33% self-hit chance.
 * 
 * @param combatant Combatant to check
 * @returns Skip check result
 */
export function shouldSkipTurn(combatant: StatusCombatant): SkipTurnCheck {
    const effects = combatant.volatileStatusEffects ?? combatant.statusEffects ?? [];

    // Check each hard CC type
    for (const effect of effects) {
        switch (effect.type) {
            case 'sleep':
                return { skip: true, reason: 'asleep' };

            case 'freeze':
                return { skip: true, reason: 'frozen' };

            case 'stun':
                return { skip: true, reason: 'stunned' };

            case 'paralyze':
                // 25% chance to be paralyzed
                if (Math.random() < PARALYZE_SKIP_CHANCE) {
                    return { skip: true, reason: 'paralyzed' };
                }
                break;

            case 'confusion':
                // Doesn't skip, but has self-hit chance
                return { skip: false, selfHitChance: CONFUSION_SELF_HIT_CHANCE };
        }
    }

    return { skip: false };
}

/**
 * Wake a combatant from sleep when hit by direct damage.
 * 
 * Note: DoT damage does NOT wake from sleep.
 * 
 * @param combatant Combatant to potentially wake
 * @returns True if was asleep and woke up
 */
export function wakeFromSleep(combatant: StatusCombatant): boolean {
    const effects = combatant.volatileStatusEffects ?? combatant.statusEffects ?? [];
    const sleepIndex = effects.findIndex(e => e.type === 'sleep');

    if (sleepIndex >= 0) {
        effects.splice(sleepIndex, 1);

        if (combatant.volatileStatusEffects !== undefined) {
            combatant.volatileStatusEffects = effects;
        } else {
            combatant.statusEffects = effects;
        }

        return true;
    }

    return false;
}

/**
 * Break freeze when hit by Fire-type attack.
 * 
 * @param combatant Combatant to check
 * @param attackType Type of incoming attack
 * @returns True if freeze was broken
 */
export function breakFreeze(combatant: StatusCombatant, attackType: ElementalType): boolean {
    if (attackType !== 'Fire') return false;

    const effects = combatant.volatileStatusEffects ?? combatant.statusEffects ?? [];
    const freezeIndex = effects.findIndex(e => e.type === 'freeze');

    if (freezeIndex >= 0) {
        effects.splice(freezeIndex, 1);

        if (combatant.volatileStatusEffects !== undefined) {
            combatant.volatileStatusEffects = effects;
        } else {
            combatant.statusEffects = effects;
        }

        return true;
    }

    return false;
}

/**
 * Check if combatant has a specific status effect.
 */
export function hasStatus(combatant: StatusCombatant, statusType: StatusEffectType): boolean {
    const effects = combatant.volatileStatusEffects ?? combatant.statusEffects ?? [];
    return effects.some(e => e.type === statusType);
}

/**
 * Check if combatant is affected by Curse (blocks healing).
 */
export function isCursed(combatant: StatusCombatant): boolean {
    return hasStatus(combatant, 'curse');
}

/**
 * Check if combatant is Burned (reduces physical damage dealt).
 */
export function isBurned(combatant: StatusCombatant): boolean {
    return hasStatus(combatant, 'burn');
}

/**
 * Get the burn damage reduction multiplier.
 * @returns 0.75 if burned (25% reduction), 1.0 otherwise
 */
export function getBurnDamageMultiplier(combatant: StatusCombatant): number {
    return isBurned(combatant) ? (1 - BURN_DAMAGE_REDUCTION) : 1.0;
}

// =====================
// HELPER FUNCTIONS
// =====================

/**
 * Calculate DoT damage based on status type, severity, and stacks.
 */
function calculateDoTDamage(
    maxHP: number,
    statusType: StatusEffectType,
    severity?: StatusSeverity,
    stacks?: number
): number {
    const dotConfig = STATUS_DOT_PERCENT[statusType];
    if (!dotConfig) return 0;

    // Get percent based on severity (default to moderate)
    const effectiveSeverity = severity ?? 'moderate';
    const percent = dotConfig[effectiveSeverity];

    // Calculate base damage
    let damage = Math.floor(maxHP * percent);

    // Poison multiplies by stacks
    if (statusType === 'poison' && stacks && stacks > 1) {
        damage *= stacks;
    }

    // Minimum 1 damage
    return Math.max(1, damage);
}

/**
 * Get past-tense verb for status application messages.
 */
function getStatusVerb(statusType: StatusEffectType): string {
    const verbs: Record<StatusEffectType, string> = {
        burn: 'burning',
        poison: 'poisoned',
        bleed: 'bleeding',
        curse: 'cursed',
        paralyze: 'paralyzed',
        sleep: 'asleep',
        freeze: 'frozen',
        stun: 'stunned',
        confusion: 'confused',
    };
    return verbs[statusType] || statusType;
}

// =====================
// EXPORTS
// =====================

export const statusEffectService = {
    applyStatus,
    tickStatusEffects,
    cureStatus,
    shouldSkipTurn,
    wakeFromSleep,
    breakFreeze,
    hasStatus,
    isCursed,
    isBurned,
    getBurnDamageMultiplier,
};
