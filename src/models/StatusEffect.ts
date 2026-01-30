/**
 * Status Effect Model
 * 
 * Defines status effects that can be applied to combatants.
 * Persistent effects survive between battles, cleared by Long Rest or death recovery.
 */

/**
 * Types of status effects
 * - DoT: Damage over time (burn, poison, bleed, curse)
 * - Hard CC: Prevents actions (paralyze, sleep, freeze, stun)
 * - Soft CC: Modifies behavior (confusion)
 */
export type StatusEffectType =
    // DoT effects
    | 'burn'      // 6% max HP/turn, reduces physical damage dealt
    | 'poison'    // 8% max HP/turn, can stack
    | 'bleed'     // 5% max HP/turn
    | 'curse'     // 10% max HP/turn, blocks healing
    // Hard CC
    | 'paralyze'  // 25% chance to skip turn
    | 'sleep'     // Skip turns until damaged
    | 'freeze'    // Skip turn, break on damage
    | 'stun'      // Skip next turn (1 turn only)
    // Soft CC
    | 'confusion'; // 33% chance to hit self

/**
 * Severity level affects DoT damage percentages
 */
export type StatusSeverity = 'minor' | 'moderate' | 'severe';

/**
 * Status effect instance on a combatant
 */
export interface StatusEffect {
    /** Unique instance ID (for tracking multiple effects) */
    id: string;

    /** Type of effect */
    type: StatusEffectType;

    /** Turns remaining (-1 = until cured) */
    duration: number;

    /** Severity for DoT effects */
    severity?: StatusSeverity;

    /** Stacks (for poison) */
    stacks?: number;

    /** Who applied this effect */
    source: 'player' | 'monster';

    /** Skill that applied this (for display) */
    sourceSkillId?: string;
}

/**
 * Check if a status effect is a DoT type
 */
export function isDoTEffect(type: StatusEffectType): boolean {
    return ['burn', 'poison', 'bleed', 'curse'].includes(type);
}

/**
 * Check if a status effect is Hard CC (prevents actions)
 */
export function isHardCC(type: StatusEffectType): boolean {
    return ['paralyze', 'sleep', 'freeze', 'stun'].includes(type);
}

/**
 * Get display name for a status effect type
 */
export function getStatusDisplayName(type: StatusEffectType): string {
    const names: Record<StatusEffectType, string> = {
        burn: 'Burning',
        poison: 'Poisoned',
        bleed: 'Bleeding',
        curse: 'Cursed',
        paralyze: 'Paralyzed',
        sleep: 'Asleep',
        freeze: 'Frozen',
        stun: 'Stunned',
        confusion: 'Confused',
    };
    return names[type];
}

/**
 * Get icon for a status effect type
 */
export function getStatusIcon(type: StatusEffectType): string {
    const icons: Record<StatusEffectType, string> = {
        burn: '🔥',
        poison: '☠️',
        bleed: '🩸',
        curse: '💀',
        paralyze: '⚡',
        sleep: '💤',
        freeze: '❄️',
        stun: '💫',
        confusion: '😵',
    };
    return icons[type];
}
