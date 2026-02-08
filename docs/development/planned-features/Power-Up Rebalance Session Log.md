# Power-Up Rebalance Session Log

Development log for the power-up trigger rebalance.

> **Feature:** Power-Up Rebalance  
> **Started:** 2026-02-08  
> **Related Docs:** [[Power-Up Rebalance Implementation Guide]] for full plan, [[Feature Roadmap v2]] for priority tracking

---

## Session Format

Each session entry should include:
- **Date & Focus:** What was worked on
- **Completed:** Checklist of completed items
- **Files Changed:** Key files modified/created
- **Testing Notes:** What was tested and results
- **Blockers/Issues:** Any problems encountered
- **Next Steps:** What to continue with

---

## 2026-02-08 - Session 1: Core Trigger Changes

**Focus:** Remove 4 triggers, fix T2 pool, update trigger definitions and TriggerContext interface

### Completed:

#### Trigger Removals (4)
- ✅ Removed `one_shot` — column-dependent, breaks with custom columns
- ✅ Removed `inbox_zero` — column-dependent, breaks with custom columns
- ✅ Removed `critical_success` — too random/frequent (5% on every task)
- ✅ Removed `big_fish` — too easy to hit (>50 XP is common)

#### Pool Fix
- ✅ Removed `level_up_boost` from `TIER_POOLS.T2` — should only come from Level Up trigger

#### Trigger Definition Updates (10 triggers)
- ✅ **Hat Trick:** `task_completion` → `quest_completion`, `tasksInLastHour` → `questsInLastHour`, T1 → T2
- ✅ **Blitz:** `task_completion` → `quest_completion`, `tasksCompletedToday` → `questsCompletedToday`, T2 → T3
- ✅ **Early Riser:** `task_completion` → `quest_completion`
- ✅ **Night Owl:** `task_completion` → `quest_completion`
- ✅ **Multitasker:** `task_completion` → `quest_completion`, `categoriesCompletedToday` → `questCategoriesCompletedToday`
- ✅ **Combo Breaker:** Threshold 5 → 10
- ✅ **Gym Rat:** `task_completion` → `quest_completion`, `taskCategory` → `questCategory`, threshold 3 → 2
- ✅ **Deep Work:** Same changes as Gym Rat
- ✅ **Social Butterfly:** Same changes as Gym Rat
- ✅ **Admin Slayer:** Same changes as Gym Rat, threshold 5 → 2

#### TriggerContext Interface Changes
- ✅ **Added** `questsCompletedToday`, `questsInLastHour`, `questCategoriesCompletedToday`, `questCategoryCountToday`, `questCategory`
- ✅ **Removed** `questWasOneShot`, `inProgressCount`, `taskXP`

#### Context Cleanup (Other Files)
- ✅ Removed `questWasOneShot` and `inProgressCount` from `QuestActionsService.ts` quest completion context
- ✅ Removed `taskXP` from `useXPAward.ts` trigger context

#### Test File (Minimal Fixes Only)
- ✅ Removed `taskXP` and `questWasOneShot` from `createDefaultContext` helper
- ✅ Updated `declare module` augmentation to keep deleted fields available for existing TDD tests
- ⚠️ No test logic, thresholds, detection points, or structure was changed

### Files Changed:

**Services:**
- `src/services/PowerUpService.ts` — Removed 4 triggers, fixed T2 pool, updated 10 trigger definitions, updated TriggerContext interface
- `src/services/QuestActionsService.ts` — Removed `questWasOneShot` and `inProgressCount` from quest completion context
- `src/hooks/useXPAward.ts` — Removed `taskXP` from trigger context

**Tests:**
- `test/power-up-triggers.test.ts` — Minimal fixes for deleted TriggerContext fields only

### Testing Notes:
- ✅ Build passes (`npm run build`)
- 23 test failures — all expected:
  - Removed trigger tests (`one_shot`, `big_fish`, `inbox_zero`, `critical_success`) correctly fail
  - Old TDD tests use pre-rebalance thresholds/detection points — will be updated in Session 2
  - Rebalanced TDD tests reference `taskCategory` via `as any` — will be wired to `questCategory` in Session 2

### Blockers/Issues:
- None

### Deferred:
- `tasksInLastHour` calculation in `useXPAward.ts` — still referenced by legacy task-level tests; clean up after test updates in Session 2

---

## Next Session Prompt

```
Power-Up Rebalance Session 1 complete. Trigger definitions are updated, now need to wire the context builders.

What was done in Session 1:
- ✅ Removed 4 triggers (one_shot, inbox_zero, critical_success, big_fish)
- ✅ Removed level_up_boost from T2 pool
- ✅ Updated 10 trigger definitions (new detection points, thresholds, quest-based fields)
- ✅ Updated TriggerContext interface (added 5 quest-level fields, removed 3 deprecated fields)
- ✅ Cleaned up QuestActionsService.ts and useXPAward.ts references to removed fields
- ✅ Build passes, 23 expected test failures

Session 2 scope (from implementation guide):
1. Wire quest completion context in QuestActionsService.moveQuest() with new fields:
   - questsCompletedToday, questsInLastHour, questCategoriesCompletedToday, questCategoryCountToday, questCategory
2. Update power-up-triggers.test.ts to match new trigger definitions
3. Clean up tasksInLastHour from useXPAward.ts after tests are updated
4. Deploy to test vault and manually verify

Key files to reference:
- docs/development/planned-features/Power-Up Rebalance Implementation Guide.md - Full plan
- docs/development/planned-features/Power-Up Rebalance Session Log.md - This log
- src/services/PowerUpService.ts - Updated trigger definitions
- src/services/QuestActionsService.ts - Where quest_completion context is built (~line 233)
- test/power-up-triggers.test.ts - Tests needing update
```

---

## Git Commit Message

```
refactor(power-ups): Session 1 - rebalance trigger definitions

Trigger Removals (4):
- one_shot, inbox_zero (column-dependent, breaks custom columns)
- critical_success (5% RNG too frequent)
- big_fish (>50 XP threshold too easy)

Pool Fix:
- Removed level_up_boost from T2 pool (only via Level Up trigger)

Trigger Updates (10):
- Hat Trick: 3 tasks/hr → 3 quests/hr, T1 → T2
- Blitz: 10 tasks/day → 10 quests/day, T2 → T3
- Early Riser, Night Owl: task → quest completion
- Multitasker: task categories → quest categories
- Combo Breaker: 5 → 10 same-category tasks
- Gym Rat, Deep Work, Social Butterfly, Admin Slayer: task → quest, threshold → 2

TriggerContext:
- Added: questsCompletedToday, questsInLastHour, questCategoriesCompletedToday, questCategoryCountToday, questCategory
- Removed: questWasOneShot, inProgressCount, taskXP

Files: PowerUpService.ts, QuestActionsService.ts, useXPAward.ts, power-up-triggers.test.ts
```
