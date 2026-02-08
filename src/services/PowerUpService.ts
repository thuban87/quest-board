/**
 * Power-Up Service
 * 
 * Core system for trigger evaluation and power-up/buff management.
 * Handles granting, expiring, and applying power-up effects.
 */

import {
    Character,
    CharacterClass,
    CLASS_INFO,
    ActivePowerUp,
    PowerUpEffect,
    PowerUpDuration,
    CollisionPolicy,
    PowerUpNotificationType,
    StatType,
} from '../models/Character';

// ============================================================================
// EFFECT DEFINITIONS
// ============================================================================

/**
 * Definition of a power-up effect that can be granted
 */
export interface EffectDefinition {
    id: string;
    name: string;
    icon: string;
    description: string;
    tier: 'T1' | 'T2' | 'T3' | 'utility' | 'passive';
    effect: PowerUpEffect;
    duration: PowerUpDuration;
    collisionPolicy: CollisionPolicy;
    notificationType: PowerUpNotificationType;
}

/**
 * All available power-up effects
 */
export const EFFECT_DEFINITIONS: Record<string, EffectDefinition> = {
    // === XP MULTIPLIERS ===
    first_blood_boost: {
        id: 'first_blood_boost',
        name: 'First Blood',
        icon: '🩸',
        description: '+5% XP for 1 hour',
        tier: 'T1',
        effect: { type: 'xp_multiplier', value: 1.05 },
        duration: { type: 'hours', value: 1 },
        collisionPolicy: 'refresh',
        notificationType: 'toast',
    },
    flow_state: {
        id: 'flow_state',
        name: 'Flow State',
        icon: '🌊',
        description: '2x XP for all tasks',
        tier: 'T2',
        effect: { type: 'xp_multiplier', value: 2.0 },
        duration: { type: 'hours', value: 4 },
        collisionPolicy: 'refresh',
        notificationType: 'modal',
    },
    momentum: {
        id: 'momentum',
        name: 'Momentum',
        icon: '🚀',
        description: '+10% XP per task today (stacks)',
        tier: 'T1',
        effect: { type: 'xp_multiplier', value: 1.10 },
        duration: { type: 'until_midnight' },
        collisionPolicy: 'stack',
        notificationType: 'toast',
    },
    catch_up: {
        id: 'catch_up',
        name: 'Catch-Up',
        icon: '🔥',
        description: '2x XP for next 3 tasks',
        tier: 'T1',
        effect: { type: 'xp_multiplier', value: 2.0 },
        duration: { type: 'uses', value: 3 },
        collisionPolicy: 'extend', // Add more uses
        notificationType: 'toast',
    },

    // === STAT BOOSTS ===
    level_up_boost: {
        id: 'level_up_boost',
        name: 'Level Up!',
        icon: '⬆️',
        description: '+3 to all stats for 24 hours',
        tier: 'T2',
        effect: { type: 'all_stats_boost', value: 3 },
        duration: { type: 'hours', value: 24 },
        collisionPolicy: 'refresh',
        notificationType: 'modal',
    },
    adrenaline_rush: {
        id: 'adrenaline_rush',
        name: 'Adrenaline Rush',
        icon: '💪',
        description: '+5 STR & DEX for 24 hours',
        tier: 'T1',
        effect: { type: 'stat_boost', stat: 'strength', value: 5 }, // Note: we'll handle DEX separately
        duration: { type: 'hours', value: 24 },
        collisionPolicy: 'refresh',
        notificationType: 'toast',
    },
    genius_mode: {
        id: 'genius_mode',
        name: 'Genius Mode',
        icon: '🧠',
        description: '+5 INT & WIS for 24 hours',
        tier: 'T1',
        effect: { type: 'stat_boost', stat: 'intelligence', value: 5 },
        duration: { type: 'hours', value: 24 },
        collisionPolicy: 'refresh',
        notificationType: 'toast',
    },
    limit_break: {
        id: 'limit_break',
        name: 'Limit Break',
        icon: '💥',
        description: 'All stats +3 above cap for 24 hours',
        tier: 'T3',
        effect: { type: 'all_stats_boost', value: 3 },
        duration: { type: 'hours', value: 24 },
        collisionPolicy: 'refresh',
        notificationType: 'modal',
    },

    // === PROGRESSION ===
    streak_shield: {
        id: 'streak_shield',
        name: 'Streak Shield',
        icon: '🛡️',
        description: 'Prevents next streak reset',
        tier: 'T2',
        effect: { type: 'streak_shield' },
        duration: { type: 'until_used' },
        collisionPolicy: 'ignore', // Only one shield at a time
        notificationType: 'modal',
    },

    // === UTILITY ===
    lucky_star: {
        id: 'lucky_star',
        name: 'Lucky Star',
        icon: '⭐',
        description: 'Critical chance 10% (up from 5%)',
        tier: 'T1',
        effect: { type: 'crit_chance', value: 10 },
        duration: { type: 'hours', value: 1 },
        collisionPolicy: 'refresh',
        notificationType: 'toast',
    },
};

// ============================================================================
// TRIGGER DEFINITIONS
// ============================================================================

/**
 * Context passed to trigger condition functions
 */
export interface TriggerContext {
    // Task completion context
    tasksCompletedToday?: number;
    tasksInLastHour?: number;  // For Hat Trick (legacy, used by useXPAward)
    taskCategory?: string;
    isFirstTaskOfDay?: boolean;

    // Quest completion context
    questCompleted?: boolean;
    questCompletedEarly?: boolean;  // Before due date
    questCompletedOnDueDate?: boolean;  // For Clutch
    daysSinceQuestCreation?: number;
    questsCompletedToday?: number;  // For Blitz (quest-level)
    questsInLastHour?: number;  // For Hat Trick (quest-level)
    questCategoriesCompletedToday?: string[];  // For Multitasker (quest-level)
    questCategoryCountToday?: Record<string, number>;  // For category triggers (quest-level)
    questCategory?: string;  // The completing quest's category

    // Streak context
    currentStreak?: number;
    previousStreak?: number;
    streakJustBroken?: boolean;

    // Level/XP context
    didLevelUp?: boolean;
    didTierUp?: boolean;
    newLevel?: number;

    // Time context
    currentHour?: number;  // 0-23
    isWeekend?: boolean;
    dayOfWeek?: number;  // 0=Sunday

    // Category tracking for session (task-level)
    categoriesCompletedToday?: string[];
    categoryCountToday?: Record<string, number>;

    // Days inactive
    daysInactive?: number;
}

/**
 * Detection points where triggers can fire
 */
export type DetectionPoint = 'task_completion' | 'quest_completion' | 'streak_update' | 'xp_award';

/**
 * Definition of a trigger that can grant power-ups
 */
export interface TriggerDefinition {
    id: string;
    name: string;
    description: string;
    detectionPoint: DetectionPoint;
    type: 'deterministic' | 'pool';
    /** For deterministic triggers: which effect to grant */
    grantsEffect?: string;
    /** For pool triggers: which tier to roll from */
    grantsTier?: 'T1' | 'T2' | 'T3';
    /** Condition function */
    condition: (context: TriggerContext) => boolean;
}

/**
 * Initial set of triggers (subset for Phase 1)
 */
export const TRIGGER_DEFINITIONS: TriggerDefinition[] = [
    // === SPEED & MOMENTUM ===
    {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Complete first task of the day',
        detectionPoint: 'task_completion',
        type: 'deterministic',
        grantsEffect: 'first_blood_boost',
        condition: (ctx) => ctx.isFirstTaskOfDay === true,
    },

    // === CONSISTENCY & TIMING ===
    {
        id: 'streak_keeper_3',
        name: 'Streak Keeper (3)',
        description: 'Reach a 3-day streak',
        detectionPoint: 'streak_update',
        type: 'deterministic',
        grantsEffect: 'streak_shield',
        condition: (ctx) => ctx.currentStreak === 3 && (ctx.previousStreak ?? 0) < 3,
    },
    {
        id: 'streak_keeper_7',
        name: 'Streak Keeper (7)',
        description: 'Reach a 7-day streak',
        detectionPoint: 'streak_update',
        type: 'pool',
        grantsTier: 'T1',
        condition: (ctx) => ctx.currentStreak === 7 && (ctx.previousStreak ?? 0) < 7,
    },

    // === DIFFICULTY & MILESTONES ===
    {
        id: 'level_up',
        name: 'Level Up',
        description: 'Gain a new character level',
        detectionPoint: 'xp_award',
        type: 'deterministic',
        grantsEffect: 'level_up_boost',
        condition: (ctx) => ctx.didLevelUp === true,
    },
    {
        id: 'tier_up',
        name: 'Tier Up',
        description: 'Reach a new visual tier',
        detectionPoint: 'xp_award',
        type: 'deterministic',
        grantsEffect: 'limit_break',
        condition: (ctx) => ctx.didTierUp === true,
    },

    // === RECOVERY ===
    {
        id: 'phoenix',
        name: 'Phoenix',
        description: 'Complete a task after 3+ days inactive',
        detectionPoint: 'task_completion',
        type: 'deterministic',
        grantsEffect: 'catch_up',
        condition: (ctx) => (ctx.daysInactive ?? 0) >= 3 && ctx.isFirstTaskOfDay === true,
    },

    // === SPEED & MOMENTUM ===
    {
        id: 'hat_trick',
        name: 'Hat Trick',
        description: '3 quests completed within 1 hour',
        detectionPoint: 'quest_completion',
        type: 'pool',
        grantsTier: 'T2',
        condition: (ctx) => (ctx.questsInLastHour ?? 0) >= 3,
    },
    {
        id: 'blitz',
        name: 'Blitz',
        description: '10 quests completed in a day',
        detectionPoint: 'quest_completion',
        type: 'pool',
        grantsTier: 'T3',
        condition: (ctx) => (ctx.questsCompletedToday ?? 0) >= 10,
    },
    {
        id: 'combo_breaker',
        name: 'Combo Breaker',
        description: '10+ tasks in the same category today',
        detectionPoint: 'task_completion',
        type: 'pool',
        grantsTier: 'T1',
        condition: (ctx) => {
            const cat = ctx.taskCategory?.toLowerCase();
            if (!cat || !ctx.categoryCountToday) return false;
            return (ctx.categoryCountToday[cat] ?? 0) >= 10;
        },
    },

    // === TIMING ===
    {
        id: 'early_riser',
        name: 'Early Riser',
        description: 'Complete a quest before 8 AM',
        detectionPoint: 'quest_completion',
        type: 'pool',
        grantsTier: 'T1',
        condition: (ctx) => (ctx.currentHour ?? 12) < 8,
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete a quest after 10 PM',
        detectionPoint: 'quest_completion',
        type: 'pool',
        grantsTier: 'T1',
        condition: (ctx) => (ctx.currentHour ?? 12) >= 22,
    },
    {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Complete a quest on Saturday or Sunday',
        detectionPoint: 'quest_completion',
        type: 'pool',
        grantsTier: 'T1',
        condition: (ctx) => ctx.isWeekend === true,
    },
    {
        id: 'fresh_start',
        name: 'Fresh Start',
        description: 'Complete first quest on Monday',
        detectionPoint: 'quest_completion',
        type: 'pool',
        grantsTier: 'T1',
        condition: (ctx) => ctx.dayOfWeek === 1 && ctx.isFirstTaskOfDay === true,
    },
    {
        id: 'streak_keeper_14',
        name: 'Streak Keeper (14)',
        description: 'Reach a 14-day streak',
        detectionPoint: 'streak_update',
        type: 'pool',
        grantsTier: 'T2',
        condition: (ctx) => ctx.currentStreak === 14 && (ctx.previousStreak ?? 0) < 14,
    },
    {
        id: 'streak_keeper_30',
        name: 'Streak Keeper (30)',
        description: 'Reach a 30-day streak',
        detectionPoint: 'streak_update',
        type: 'deterministic',
        grantsEffect: 'limit_break',
        condition: (ctx) => ctx.currentStreak === 30 && (ctx.previousStreak ?? 0) < 30,
    },

    // === CATEGORY MASTERY ===
    {
        id: 'gym_rat',
        name: 'Gym Rat',
        description: '2 Health/Fitness quests in a day',
        detectionPoint: 'quest_completion',
        type: 'deterministic',
        grantsEffect: 'adrenaline_rush',
        condition: (ctx) => {
            const cat = ctx.questCategory?.toLowerCase();
            if (!ctx.questCategoryCountToday) return false;
            const healthCount = ctx.questCategoryCountToday['health'] ?? 0;
            const fitnessCount = ctx.questCategoryCountToday['fitness'] ?? 0;
            return (cat === 'health' || cat === 'fitness') && (healthCount + fitnessCount) >= 2;
        },
    },
    {
        id: 'deep_work',
        name: 'Deep Work',
        description: '2 Dev/Study quests in a day',
        detectionPoint: 'quest_completion',
        type: 'deterministic',
        grantsEffect: 'genius_mode',
        condition: (ctx) => {
            const cat = ctx.questCategory?.toLowerCase();
            if (!ctx.questCategoryCountToday) return false;
            const devCount = ctx.questCategoryCountToday['dev'] ?? 0;
            const studyCount = ctx.questCategoryCountToday['study'] ?? 0;
            return (cat === 'dev' || cat === 'study') && (devCount + studyCount) >= 2;
        },
    },
    {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: '2 Social quests in a day',
        detectionPoint: 'quest_completion',
        type: 'pool',
        grantsTier: 'T1',
        condition: (ctx) => {
            const cat = ctx.questCategory?.toLowerCase();
            if (!ctx.questCategoryCountToday) return false;
            return cat === 'social' && (ctx.questCategoryCountToday['social'] ?? 0) >= 2;
        },
    },
    {
        id: 'admin_slayer',
        name: 'Admin Slayer',
        description: '2 Chore/Admin quests in a day',
        detectionPoint: 'quest_completion',
        type: 'deterministic',
        grantsEffect: 'flow_state',
        condition: (ctx) => {
            const cat = ctx.questCategory?.toLowerCase();
            if (!ctx.questCategoryCountToday) return false;
            const adminCount = ctx.questCategoryCountToday['admin'] ?? 0;
            const choresCount = ctx.questCategoryCountToday['chores'] ?? 0;
            return (cat === 'admin' || cat === 'chores') && (adminCount + choresCount) >= 2;
        },
    },
    {
        id: 'multitasker',
        name: 'Multitasker',
        description: '3+ different quest categories in a day',
        detectionPoint: 'quest_completion',
        type: 'pool',
        grantsTier: 'T1',
        condition: (ctx) => (ctx.questCategoriesCompletedToday?.length ?? 0) >= 3,
    },


    {
        id: 'clutch',
        name: 'Clutch',
        description: 'Complete quest exactly on due date',
        detectionPoint: 'quest_completion',
        type: 'pool',
        grantsTier: 'T1',
        condition: (ctx) => ctx.questCompletedOnDueDate === true,
    },
    {
        id: 'speedrunner',
        name: 'Speedrunner',
        description: 'Complete quest 24h+ before due date',
        detectionPoint: 'quest_completion',
        type: 'deterministic',
        grantsEffect: 'flow_state',
        condition: (ctx) => ctx.questCompletedEarly === true,
    },

];

// ============================================================================
// TIER POOLS
// ============================================================================

/** Effects available in each tier pool for random grants */
export const TIER_POOLS: Record<string, string[]> = {
    T1: ['first_blood_boost', 'momentum', 'catch_up', 'lucky_star', 'adrenaline_rush', 'genius_mode'],
    T2: ['flow_state', 'streak_shield'],
    T3: ['limit_break'],
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get the class perk as a passive ActivePowerUp for display purposes
 */
export function getClassPerkAsPowerUp(character: Character): ActivePowerUp {
    const classInfo = CLASS_INFO[character.class];

    return {
        id: `class_perk_${character.class}`,
        name: classInfo.perkName,
        icon: classInfo.emoji,
        description: classInfo.perkDescription,
        triggeredBy: 'class',
        startedAt: character.createdDate,
        expiresAt: null, // Passive, never expires
        effect: { type: 'class_perk', description: classInfo.perkDescription },
    };
}

/**
 * Evaluate all triggers for a detection point and return which ones fired
 */
export function evaluateTriggers(
    detectionPoint: DetectionPoint,
    context: TriggerContext
): TriggerDefinition[] {
    return TRIGGER_DEFINITIONS.filter(trigger =>
        trigger.detectionPoint === detectionPoint && trigger.condition(context)
    );
}

/**
 * Roll a random effect from a tier pool
 */
export function rollFromPool(tier: 'T1' | 'T2' | 'T3'): string {
    const pool = TIER_POOLS[tier];
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
}

/**
 * Calculate expiration timestamp for a duration
 */
export function calculateExpiration(duration: PowerUpDuration): string | null {
    const now = new Date();

    switch (duration.type) {
        case 'hours':
            return new Date(now.getTime() + duration.value * 60 * 60 * 1000).toISOString();
        case 'until_midnight': {
            const midnight = new Date(now);
            midnight.setHours(23, 59, 59, 999);
            return midnight.toISOString();
        }
        case 'uses':
        case 'until_used':
        case 'passive':
            return null; // These don't expire by time
    }
}

/**
 * Grant a power-up to a character, handling collision policy
 * Returns the updated activePowerUps array
 */
export function grantPowerUp(
    currentPowerUps: ActivePowerUp[],
    effectId: string,
    triggerId: string
): { powerUps: ActivePowerUp[]; granted: ActivePowerUp | null } {
    const effectDef = EFFECT_DEFINITIONS[effectId];
    if (!effectDef) {
        console.warn(`[PowerUpService] Unknown effect: ${effectId}`);
        return { powerUps: currentPowerUps, granted: null };
    }

    const existingIndex = currentPowerUps.findIndex(p => p.id === effectId);
    const existing = existingIndex >= 0 ? currentPowerUps[existingIndex] : null;

    const now = new Date().toISOString();
    const expiresAt = calculateExpiration(effectDef.duration);

    // Handle collision policy
    if (existing) {
        switch (effectDef.collisionPolicy) {
            case 'ignore':
                return { powerUps: currentPowerUps, granted: null };

            case 'refresh': {
                // Reset timer
                const refreshed: ActivePowerUp = {
                    ...existing,
                    startedAt: now,
                    expiresAt,
                };
                const updated = [...currentPowerUps];
                updated[existingIndex] = refreshed;
                return { powerUps: updated, granted: refreshed };
            }

            case 'stack': {
                // Increment stacks
                const stacked: ActivePowerUp = {
                    ...existing,
                    stacks: (existing.stacks ?? 1) + 1,
                };
                const updated = [...currentPowerUps];
                updated[existingIndex] = stacked;
                return { powerUps: updated, granted: stacked };
            }

            case 'extend': {
                // Add uses if applicable
                if (effectDef.duration.type === 'uses') {
                    const extended: ActivePowerUp = {
                        ...existing,
                        usesRemaining: (existing.usesRemaining ?? 0) + effectDef.duration.value,
                    };
                    const updated = [...currentPowerUps];
                    updated[existingIndex] = extended;
                    return { powerUps: updated, granted: extended };
                }
                // For time-based, just refresh
                const refreshed: ActivePowerUp = {
                    ...existing,
                    startedAt: now,
                    expiresAt,
                };
                const updated = [...currentPowerUps];
                updated[existingIndex] = refreshed;
                return { powerUps: updated, granted: refreshed };
            }
        }
    }

    // Create new power-up
    const newPowerUp: ActivePowerUp = {
        id: effectId,
        name: effectDef.name,
        icon: effectDef.icon,
        description: effectDef.description,
        triggeredBy: triggerId,
        startedAt: now,
        expiresAt,
        effect: effectDef.effect,
        stacks: effectDef.collisionPolicy === 'stack' ? 1 : undefined,
        usesRemaining: effectDef.duration.type === 'uses' ? effectDef.duration.value : undefined,
    };

    return {
        powerUps: [...currentPowerUps, newPowerUp],
        granted: newPowerUp,
    };
}

/**
 * Remove expired power-ups based on current time
 * Returns the cleaned array
 */
export function expirePowerUps(powerUps: ActivePowerUp[]): ActivePowerUp[] {
    const now = new Date().getTime();

    return powerUps.filter(powerUp => {
        // Passive/null expiration = never expires
        if (powerUp.expiresAt === null) return true;

        // Check time-based expiration
        return new Date(powerUp.expiresAt).getTime() > now;
    });
}

/**
 * Calculate total XP multiplier from active power-ups
 * Does NOT include class bonus (handled separately in XPSystem)
 */
export function getXPMultiplierFromPowerUps(
    powerUps: ActivePowerUp[],
    category?: string
): number {
    let multiplier = 1.0;

    for (const powerUp of powerUps) {
        if (powerUp.effect.type === 'xp_multiplier') {
            // Apply stacks if applicable
            const stacks = powerUp.stacks ?? 1;
            multiplier += (powerUp.effect.value - 1) * stacks;
        } else if (powerUp.effect.type === 'xp_category_multiplier' && category) {
            if (powerUp.effect.category.toLowerCase() === category.toLowerCase()) {
                multiplier += powerUp.effect.value - 1;
            }
        }
    }

    return multiplier;
}

/**
 * Calculate total stat boost from active power-ups for a specific stat
 */
export function getStatBoostFromPowerUps(
    powerUps: ActivePowerUp[],
    stat: StatType
): number {
    let boost = 0;

    for (const powerUp of powerUps) {
        if (powerUp.effect.type === 'all_stats_boost') {
            boost += powerUp.effect.value;
        } else if (powerUp.effect.type === 'stat_boost' && powerUp.effect.stat === stat) {
            boost += powerUp.effect.value;
        }
    }

    return boost;
}

/**
 * Check if character has an active streak shield
 */
export function hasStreakShield(powerUps: ActivePowerUp[]): boolean {
    return powerUps.some(p => p.effect.type === 'streak_shield');
}

/**
 * Consume one streak shield (remove or decrement)
 * Returns updated array
 */
export function consumeStreakShield(powerUps: ActivePowerUp[]): ActivePowerUp[] {
    const shieldIndex = powerUps.findIndex(p => p.effect.type === 'streak_shield');
    if (shieldIndex < 0) return powerUps;

    const shield = powerUps[shieldIndex];

    // If stacked, decrement
    if (shield.stacks && shield.stacks > 1) {
        const updated = [...powerUps];
        updated[shieldIndex] = { ...shield, stacks: shield.stacks - 1 };
        return updated;
    }

    // Otherwise remove
    return powerUps.filter((_, i) => i !== shieldIndex);
}

/**
 * Decrement uses for use-limited power-ups and remove if depleted
 * Call this AFTER applying the bonus
 */
export function decrementUseBased(powerUps: ActivePowerUp[]): ActivePowerUp[] {
    return powerUps
        .map(powerUp => {
            if (powerUp.usesRemaining !== undefined && powerUp.usesRemaining > 0) {
                return { ...powerUp, usesRemaining: powerUp.usesRemaining - 1 };
            }
            return powerUp;
        })
        .filter(powerUp => {
            // Remove if uses depleted
            if (powerUp.usesRemaining !== undefined && powerUp.usesRemaining <= 0) {
                return false;
            }
            return true;
        });
}

/**
 * Get formatted time remaining for a power-up
 */
export function getTimeRemaining(powerUp: ActivePowerUp): string | null {
    if (!powerUp.expiresAt) {
        if (powerUp.usesRemaining !== undefined) {
            return `${powerUp.usesRemaining} use${powerUp.usesRemaining !== 1 ? 's' : ''} left`;
        }
        return 'Passive';
    }

    const now = new Date().getTime();
    const expires = new Date(powerUp.expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        const remainingMins = minutes % 60;
        return `${hours}h ${remainingMins}m`;
    }

    return `${minutes}m`;
}

/**
 * Check if a power-up is expiring soon (< 1 hour)
 */
export function isExpiringSoon(powerUp: ActivePowerUp): boolean {
    if (!powerUp.expiresAt) return false;

    const now = new Date().getTime();
    const expires = new Date(powerUp.expiresAt).getTime();
    const diff = expires - now;

    return diff > 0 && diff < 60 * 60 * 1000; // Less than 1 hour
}
