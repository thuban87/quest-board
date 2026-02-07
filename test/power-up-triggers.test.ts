/**
 * Power-Up Triggers Tests
 * 
 * Tests for trigger condition evaluation using TDD approach.
 * Tests for new triggers will FAIL until implementations are added.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    evaluateTriggers,
    TRIGGER_DEFINITIONS,
    TriggerContext,
    TriggerDefinition,
} from '../src/services/PowerUpService';

// =====================
// TEST HELPERS
// =====================

function createDefaultContext(overrides: Partial<TriggerContext> = {}): TriggerContext {
    return {
        tasksCompletedToday: 0,
        taskCategory: undefined,
        taskXP: 0,
        isFirstTaskOfDay: false,
        questCompleted: false,
        questWasOneShot: false,
        questCompletedEarly: false,
        daysSinceQuestCreation: 0,
        currentStreak: 0,
        previousStreak: 0,
        streakJustBroken: false,
        didLevelUp: false,
        didTierUp: false,
        newLevel: 1,
        currentHour: 12,
        isWeekend: false,
        dayOfWeek: 3, // Wednesday
        categoriesCompletedToday: [],
        categoryCountToday: {},
        daysInactive: 0,
        ...overrides,
    };
}

function getTriggerById(id: string): TriggerDefinition | undefined {
    return TRIGGER_DEFINITIONS.find(t => t.id === id);
}

// =====================
// EXISTING TRIGGERS - Should all pass
// =====================

describe('Existing Triggers', () => {
    describe('first_blood', () => {
        it('should fire on first task of day', () => {
            const context = createDefaultContext({ isFirstTaskOfDay: true });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'first_blood')).toBe(true);
        });

        it('should NOT fire after first task', () => {
            const context = createDefaultContext({
                isFirstTaskOfDay: false,
                tasksCompletedToday: 2,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'first_blood')).toBe(false);
        });
    });

    describe('one_shot', () => {
        it('should fire when quest completed directly from Available', () => {
            const context = createDefaultContext({ questWasOneShot: true });
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'one_shot')).toBe(true);
        });

        it('should NOT fire for normal quest completion', () => {
            const context = createDefaultContext({ questWasOneShot: false });
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'one_shot')).toBe(false);
        });
    });

    describe('streak_keeper_3', () => {
        it('should fire when reaching 3-day streak', () => {
            const context = createDefaultContext({
                currentStreak: 3,
                previousStreak: 2,
            });
            const triggers = evaluateTriggers('streak_update', context);

            expect(triggers.some(t => t.id === 'streak_keeper_3')).toBe(true);
        });

        it('should NOT fire if already past 3-day streak', () => {
            const context = createDefaultContext({
                currentStreak: 4,
                previousStreak: 3,
            });
            const triggers = evaluateTriggers('streak_update', context);

            expect(triggers.some(t => t.id === 'streak_keeper_3')).toBe(false);
        });
    });

    describe('streak_keeper_7', () => {
        it('should fire when reaching 7-day streak', () => {
            const context = createDefaultContext({
                currentStreak: 7,
                previousStreak: 6,
            });
            const triggers = evaluateTriggers('streak_update', context);

            expect(triggers.some(t => t.id === 'streak_keeper_7')).toBe(true);
        });

        it('should NOT fire if already past 7-day streak', () => {
            const context = createDefaultContext({
                currentStreak: 8,
                previousStreak: 7,
            });
            const triggers = evaluateTriggers('streak_update', context);

            expect(triggers.some(t => t.id === 'streak_keeper_7')).toBe(false);
        });
    });

    describe('level_up', () => {
        it('should fire on level up', () => {
            const context = createDefaultContext({
                didLevelUp: true,
                newLevel: 5,
            });
            const triggers = evaluateTriggers('xp_award', context);

            expect(triggers.some(t => t.id === 'level_up')).toBe(true);
        });

        it('should NOT fire without level up', () => {
            const context = createDefaultContext({ didLevelUp: false });
            const triggers = evaluateTriggers('xp_award', context);

            expect(triggers.some(t => t.id === 'level_up')).toBe(false);
        });
    });

    describe('tier_up', () => {
        it('should fire on tier up', () => {
            const context = createDefaultContext({
                didTierUp: true,
                newLevel: 9,
            });
            const triggers = evaluateTriggers('xp_award', context);

            expect(triggers.some(t => t.id === 'tier_up')).toBe(true);
        });

        it('should NOT fire without tier up', () => {
            const context = createDefaultContext({ didTierUp: false });
            const triggers = evaluateTriggers('xp_award', context);

            expect(triggers.some(t => t.id === 'tier_up')).toBe(false);
        });
    });

    describe('phoenix', () => {
        it('should fire on first task after 3+ days inactive', () => {
            const context = createDefaultContext({
                daysInactive: 3,
                isFirstTaskOfDay: true,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'phoenix')).toBe(true);
        });

        it('should fire when more than 3 days inactive', () => {
            const context = createDefaultContext({
                daysInactive: 7,
                isFirstTaskOfDay: true,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'phoenix')).toBe(true);
        });

        it('should NOT fire if not first task of day', () => {
            const context = createDefaultContext({
                daysInactive: 5,
                isFirstTaskOfDay: false,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'phoenix')).toBe(false);
        });

        it('should NOT fire if only 2 days inactive', () => {
            const context = createDefaultContext({
                daysInactive: 2,
                isFirstTaskOfDay: true,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'phoenix')).toBe(false);
        });
    });
});

// =====================
// NEW TRIGGERS - TDD: these will FAIL until implemented
// =====================

describe('New Triggers - Speed & Momentum', () => {
    describe('hat_trick', () => {
        it('should fire when 3 tasks completed in 1 hour', () => {
            const context = createDefaultContext({
                tasksInLastHour: 3,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'hat_trick')).toBe(true);
        });

        it('should NOT fire with only 2 tasks in last hour', () => {
            const context = createDefaultContext({
                tasksInLastHour: 2,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'hat_trick')).toBe(false);
        });
    });

    describe('blitz', () => {
        it('should fire when 10 tasks completed in a day', () => {
            const context = createDefaultContext({
                tasksCompletedToday: 10,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'blitz')).toBe(true);
        });

        it('should NOT fire with 9 tasks', () => {
            const context = createDefaultContext({
                tasksCompletedToday: 9,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'blitz')).toBe(false);
        });
    });

    describe('combo_breaker', () => {
        it('should fire when 5+ tasks in same category today', () => {
            const context = createDefaultContext({
                taskCategory: 'work',
                categoryCountToday: { work: 5 },
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'combo_breaker')).toBe(true);
        });

        it('should NOT fire with 4 tasks in category', () => {
            const context = createDefaultContext({
                taskCategory: 'work',
                categoryCountToday: { work: 4 },
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'combo_breaker')).toBe(false);
        });
    });
});

describe('New Triggers - Timing', () => {
    describe('early_riser', () => {
        it('should fire for task before 8 AM', () => {
            const context = createDefaultContext({
                currentHour: 7,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'early_riser')).toBe(true);
        });

        it('should fire at exactly 6 AM', () => {
            const context = createDefaultContext({
                currentHour: 6,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'early_riser')).toBe(true);
        });

        it('should NOT fire at 8 AM or later', () => {
            const context = createDefaultContext({
                currentHour: 8,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'early_riser')).toBe(false);
        });
    });

    describe('night_owl', () => {
        it('should fire for task after 10 PM', () => {
            const context = createDefaultContext({
                currentHour: 22,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'night_owl')).toBe(true);
        });

        it('should fire at 11 PM', () => {
            const context = createDefaultContext({
                currentHour: 23,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'night_owl')).toBe(true);
        });

        it('should NOT fire at 9 PM', () => {
            const context = createDefaultContext({
                currentHour: 21,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'night_owl')).toBe(false);
        });
    });

    describe('weekend_warrior', () => {
        it('should fire for quest on Saturday', () => {
            const context = createDefaultContext({
                isWeekend: true,
                dayOfWeek: 6,
            });
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'weekend_warrior')).toBe(true);
        });

        it('should fire for quest on Sunday', () => {
            const context = createDefaultContext({
                isWeekend: true,
                dayOfWeek: 0,
            });
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'weekend_warrior')).toBe(true);
        });

        it('should NOT fire on weekday', () => {
            const context = createDefaultContext({
                isWeekend: false,
                dayOfWeek: 3,
            });
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'weekend_warrior')).toBe(false);
        });
    });

    describe('fresh_start', () => {
        it('should fire for first quest on Monday', () => {
            const context = createDefaultContext({
                dayOfWeek: 1,
                isFirstTaskOfDay: true,
            });
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'fresh_start')).toBe(true);
        });

        it('should NOT fire on other days', () => {
            const context = createDefaultContext({
                dayOfWeek: 2, // Tuesday
                isFirstTaskOfDay: true,
            });
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'fresh_start')).toBe(false);
        });
    });

    describe('streak_keeper_14', () => {
        it('should fire when reaching 14-day streak', () => {
            const context = createDefaultContext({
                currentStreak: 14,
                previousStreak: 13,
            });
            const triggers = evaluateTriggers('streak_update', context);

            expect(triggers.some(t => t.id === 'streak_keeper_14')).toBe(true);
        });
    });

    describe('streak_keeper_30', () => {
        it('should fire when reaching 30-day streak', () => {
            const context = createDefaultContext({
                currentStreak: 30,
                previousStreak: 29,
            });
            const triggers = evaluateTriggers('streak_update', context);

            expect(triggers.some(t => t.id === 'streak_keeper_30')).toBe(true);
        });
    });
});

describe('New Triggers - Category Mastery', () => {
    describe('gym_rat', () => {
        it('should fire when 3 Health/Fitness tasks today', () => {
            const context = createDefaultContext({
                taskCategory: 'fitness',
                categoryCountToday: { fitness: 3 },
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'gym_rat')).toBe(true);
        });

        it('should also fire for "health" category', () => {
            const context = createDefaultContext({
                taskCategory: 'health',
                categoryCountToday: { health: 3 },
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'gym_rat')).toBe(true);
        });
    });

    describe('deep_work', () => {
        it('should fire when 3 Dev/Study tasks today', () => {
            const context = createDefaultContext({
                taskCategory: 'dev',
                categoryCountToday: { dev: 3 },
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'deep_work')).toBe(true);
        });

        it('should also fire for "study" category', () => {
            const context = createDefaultContext({
                taskCategory: 'study',
                categoryCountToday: { study: 3 },
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'deep_work')).toBe(true);
        });
    });

    describe('social_butterfly', () => {
        it('should fire when 3 Social tasks today', () => {
            const context = createDefaultContext({
                taskCategory: 'social',
                categoryCountToday: { social: 3 },
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'social_butterfly')).toBe(true);
        });
    });

    describe('admin_slayer', () => {
        it('should fire when 5 Chore/Admin tasks today', () => {
            const context = createDefaultContext({
                taskCategory: 'admin',
                categoryCountToday: { admin: 5 },
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'admin_slayer')).toBe(true);
        });

        it('should also fire for "chores" category', () => {
            const context = createDefaultContext({
                taskCategory: 'chores',
                categoryCountToday: { chores: 5 },
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'admin_slayer')).toBe(true);
        });
    });

    describe('multitasker', () => {
        it('should fire when 3+ different categories done today', () => {
            const context = createDefaultContext({
                categoriesCompletedToday: ['work', 'fitness', 'social'],
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'multitasker')).toBe(true);
        });

        it('should NOT fire with only 2 categories', () => {
            const context = createDefaultContext({
                categoriesCompletedToday: ['work', 'fitness'],
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'multitasker')).toBe(false);
        });
    });
});

describe('New Triggers - Difficulty', () => {
    describe('big_fish', () => {
        it('should fire for task worth >50 XP', () => {
            const context = createDefaultContext({
                taskXP: 51,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'big_fish')).toBe(true);
        });

        it('should NOT fire for 50 XP task', () => {
            const context = createDefaultContext({
                taskXP: 50,
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'big_fish')).toBe(false);
        });
    });

    describe('clutch', () => {
        it('should fire when quest completed on due date', () => {
            const context = createDefaultContext({
                questCompletedOnDueDate: true,
            });
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'clutch')).toBe(true);
        });

        it('should NOT fire when completed before due date', () => {
            const context = createDefaultContext({
                questCompletedOnDueDate: false,
            });
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'clutch')).toBe(false);
        });
    });

    describe('speedrunner', () => {
        it('should fire when quest completed 24h+ before due', () => {
            const context = createDefaultContext({
                questCompletedEarly: true,
                daysSinceQuestCreation: 1,
            });
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'speedrunner')).toBe(true);
        });
    });

    describe('inbox_zero', () => {
        it('should fire when In Progress column is cleared', () => {
            const context = createDefaultContext({
                inProgressCount: 0,
                questCompleted: true,
            });
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'inbox_zero')).toBe(true);
        });

        it('should NOT fire when In Progress still has quests', () => {
            const context = createDefaultContext({
                inProgressCount: 2,
            });
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'inbox_zero')).toBe(false);
        });
    });
});

describe('New Triggers - RNG', () => {
    describe('critical_success', () => {
        it('should exist as a trigger', () => {
            const trigger = getTriggerById('critical_success');
            // This may not be implemented yet
            expect(trigger?.id).toBe('critical_success');
        });

        // Can't easily test 5% chance - would need to mock Math.random
    });
});

// =====================
// TRIGGER DEFINITIONS VALIDATION
// =====================

describe('TRIGGER_DEFINITIONS structure', () => {
    it('should have all implemented triggers with required fields', () => {
        for (const trigger of TRIGGER_DEFINITIONS) {
            expect(trigger.id).toBeDefined();
            expect(trigger.name).toBeDefined();
            expect(trigger.description).toBeDefined();
            expect(trigger.detectionPoint).toBeDefined();
            expect(trigger.type).toMatch(/^(deterministic|pool)$/);
            expect(trigger.condition).toBeInstanceOf(Function);

            if (trigger.type === 'deterministic') {
                expect(trigger.grantsEffect).toBeDefined();
            } else {
                expect(trigger.grantsTier).toBeDefined();
            }
        }
    });

    it('should have unique trigger IDs', () => {
        const ids = TRIGGER_DEFINITIONS.map(t => t.id);
        const uniqueIds = new Set(ids);
        expect(ids.length).toBe(uniqueIds.size);
    });
});

// =====================
// POWER-UP REBALANCE TESTS
// Tests for v1.1 rebalance changes. Will FAIL until implementation complete.
// =====================

describe('Power-Up Rebalance - Quest-Based Triggers', () => {
    // These tests use new context fields that will be added during implementation:
    // - questsInLastHour: number
    // - questsCompletedToday: number
    // - questCategoriesCompletedToday: string[]
    // - questCategoryCountToday: Record<string, number>

    describe('hat_trick (rebalanced)', () => {
        it('should fire when 3 QUESTS completed in 1 hour', () => {
            const context = createDefaultContext({
                questsInLastHour: 3,
            } as any);
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'hat_trick')).toBe(true);
        });

        it('should NOT fire with only 2 quests in last hour', () => {
            const context = createDefaultContext({
                questsInLastHour: 2,
            } as any);
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'hat_trick')).toBe(false);
        });

        it('should grant T2 pool reward (not T1)', () => {
            const trigger = getTriggerById('hat_trick');
            expect(trigger?.grantsTier).toBe('T2');
        });
    });

    describe('blitz (rebalanced)', () => {
        it('should fire when 10 QUESTS completed in a day', () => {
            const context = createDefaultContext({
                questsCompletedToday: 10,
            } as any);
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'blitz')).toBe(true);
        });

        it('should NOT fire with 9 quests', () => {
            const context = createDefaultContext({
                questsCompletedToday: 9,
            } as any);
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'blitz')).toBe(false);
        });

        it('should grant T3 pool reward (not T2)', () => {
            const trigger = getTriggerById('blitz');
            expect(trigger?.grantsTier).toBe('T3');
        });
    });

    describe('combo_breaker (rebalanced)', () => {
        it('should fire when 10+ tasks in same category (not 5)', () => {
            const context = createDefaultContext({
                taskCategory: 'work',
                categoryCountToday: { work: 10 },
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'combo_breaker')).toBe(true);
        });

        it('should NOT fire with 9 tasks in category', () => {
            const context = createDefaultContext({
                taskCategory: 'work',
                categoryCountToday: { work: 9 },
            });
            const triggers = evaluateTriggers('task_completion', context);

            expect(triggers.some(t => t.id === 'combo_breaker')).toBe(false);
        });
    });

    describe('early_riser (rebalanced)', () => {
        it('should fire on QUEST completion (not task) before 8 AM', () => {
            const context = createDefaultContext({
                currentHour: 7,
            });
            // Should now be quest_completion detection point
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'early_riser')).toBe(true);
        });
    });

    describe('night_owl (rebalanced)', () => {
        it('should fire on QUEST completion (not task) after 10 PM', () => {
            const context = createDefaultContext({
                currentHour: 22,
            });
            // Should now be quest_completion detection point
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'night_owl')).toBe(true);
        });
    });

    describe('multitasker (rebalanced)', () => {
        it('should fire when 3+ different QUEST categories done today', () => {
            const context = createDefaultContext({
                questCategoriesCompletedToday: ['work', 'fitness', 'social'],
            } as any);
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'multitasker')).toBe(true);
        });

        it('should NOT fire with only 2 quest categories', () => {
            const context = createDefaultContext({
                questCategoriesCompletedToday: ['work', 'fitness'],
            } as any);
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'multitasker')).toBe(false);
        });
    });
});

describe('Power-Up Rebalance - Category Triggers (Quest-Based)', () => {
    describe('gym_rat (rebalanced)', () => {
        it('should fire when 2 Health/Fitness QUESTS today (not 3 tasks)', () => {
            const context = createDefaultContext({
                taskCategory: 'fitness',
                questCategoryCountToday: { fitness: 2 },
            } as any);
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'gym_rat')).toBe(true);
        });

        it('should NOT fire with 1 quest', () => {
            const context = createDefaultContext({
                taskCategory: 'fitness',
                questCategoryCountToday: { fitness: 1 },
            } as any);
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'gym_rat')).toBe(false);
        });
    });

    describe('deep_work (rebalanced)', () => {
        it('should fire when 2 Dev/Study QUESTS today', () => {
            const context = createDefaultContext({
                taskCategory: 'dev',
                questCategoryCountToday: { dev: 2 },
            } as any);
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'deep_work')).toBe(true);
        });
    });

    describe('social_butterfly (rebalanced)', () => {
        it('should fire when 2 Social QUESTS today (not 3 tasks)', () => {
            const context = createDefaultContext({
                taskCategory: 'social',
                questCategoryCountToday: { social: 2 },
            } as any);
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'social_butterfly')).toBe(true);
        });
    });

    describe('admin_slayer (rebalanced)', () => {
        it('should fire when 2 Chore/Admin QUESTS today (not 5 tasks)', () => {
            const context = createDefaultContext({
                taskCategory: 'admin',
                questCategoryCountToday: { admin: 2 },
            } as any);
            const triggers = evaluateTriggers('quest_completion', context);

            expect(triggers.some(t => t.id === 'admin_slayer')).toBe(true);
        });
    });
});

describe('Power-Up Rebalance - Removed Triggers', () => {
    it('one_shot trigger should NOT exist', () => {
        const trigger = getTriggerById('one_shot');
        expect(trigger).toBeUndefined();
    });

    it('inbox_zero trigger should NOT exist', () => {
        const trigger = getTriggerById('inbox_zero');
        expect(trigger).toBeUndefined();
    });

    it('critical_success trigger should NOT exist', () => {
        const trigger = getTriggerById('critical_success');
        expect(trigger).toBeUndefined();
    });

    it('big_fish trigger should NOT exist', () => {
        const trigger = getTriggerById('big_fish');
        expect(trigger).toBeUndefined();
    });
});

// =====================
// EXTEND TriggerContext for new fields
// =====================

// Fields for new/rebalanced triggers:
// EXISTING (keep):
// - tasksInLastHour: number (DEPRECATED after rebalance - remove from useXPAward)
// - inProgressCount: number (DEPRECATED after rebalance - removed trigger)
// - questCompletedOnDueDate: boolean
// NEW (add for rebalance):
// - questsInLastHour: number
// - questsCompletedToday: number
// - questCategoriesCompletedToday: string[]
// - questCategoryCountToday: Record<string, number>

// For now, we extend the type inline in tests
declare module '../src/services/PowerUpService' {
    interface TriggerContext {
        tasksInLastHour?: number;
        inProgressCount?: number;
        questCompletedOnDueDate?: boolean;
        // NEW for rebalance:
        questsInLastHour?: number;
        questsCompletedToday?: number;
        questCategoriesCompletedToday?: string[];
        questCategoryCountToday?: Record<string, number>;
    }
}

