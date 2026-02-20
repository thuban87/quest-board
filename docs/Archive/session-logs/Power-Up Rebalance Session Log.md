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

## 2026-02-08 - Session 2: Context Wiring & Testing

**Focus:** Wire 5 quest-level context fields, update all tests, clean up legacy code

### Completed:

#### Quest Context Wiring (QuestActionsService.ts)
- ✅ Scan `character.activityHistory` for today's quest completions
- ✅ Wire `questsCompletedToday`, `questsInLastHour`, `questCategoriesCompletedToday`, `questCategoryCountToday`, `questCategory`
- ✅ Include current quest in counts (it hasn't been logged yet at trigger evaluation time)

#### Test Updates (power-up-triggers.test.ts)
- ✅ Removed tests for 4 deleted triggers (`one_shot`, `big_fish`, `inbox_zero`, `critical_success`)
- ✅ Updated pre-rebalance tests to match new definitions (quest_completion, quest-level fields, new thresholds)
- ✅ Removed all `as any` casts from rebalanced tests
- ✅ Fixed `taskCategory` → `questCategory` in rebalanced category tests
- ✅ Cleaned up `declare module` augmentation (only `questCompletedOnDueDate` remains)

#### Cleanup
- ✅ Removed `tasksInLastHour` calculation from `useXPAward.ts`
- ✅ Removed `tasksInLastHour` from `TriggerContext` interface in `PowerUpService.ts`

### Files Changed:
- `src/services/QuestActionsService.ts` — Activity history scanning + 5 quest-level context fields
- `src/services/PowerUpService.ts` — Removed `tasksInLastHour` from `TriggerContext`
- `src/hooks/useXPAward.ts` — Removed `tasksInLastHour` calculation and context field
- `test/power-up-triggers.test.ts` — Full test update (68 tests, 0 failures)

### Testing Notes:
- ✅ All **68 tests pass** (was 52 pass / 23 fail after Session 1)
- ✅ Build passes
- ✅ Deployed to test vault

### Bugs Found During Manual Testing:

#### BUG: Triggers fire on every quest completion (no cooldown)
**Root cause:** Trigger conditions like `early_riser` (hour < 8) and `weekend_warrior` (isWeekend) are true for **every** quest completed during that window. There's no "once per day" or "once per trigger" deduplication. So completing 5 quests before 8 AM on a Saturday produces 3-4 power-up notifications per quest.

`grantPowerUp()` handles the duplicate via collision policy (`refresh`, `stack`, `extend`, `ignore`), but for `refresh` and `stack` it still returns `granted` — which shows a toast notification. The power-up already exists on the character sheet, so nothing visible changes, but the user sees misleading notifications.

**Fix options (Session 3):**
1. Add a daily cooldown map: `{ triggerId: lastFiredDate }` — skip trigger if already fired today
2. Suppress notifications for collision-handled grants (only show for truly new power-ups)
3. Both

#### Observation: Power-up pool composition needs adjustment
Brad wants to gate certain power-ups to only be triggered by specific triggers (not from random pool rolls). Will need:
- Move specific effects out of T1/T2/T3 pools → deterministic-only
- Add replacement T1 and T2 effects to maintain pool diversity
- Details to be specified by Brad in Session 3

---

## 2026-02-08 - Session 3: Trigger Cooldown & Notification Fix

**Focus:** Fix daily trigger cooldown bug and suppress redundant notifications

### Completed:

#### Daily Trigger Cooldown System
- ✅ Added `triggerCooldowns?: Record<string, string>` to `Character` interface (optional, no schema bump)
- ✅ Added `hasFiredToday()` and `recordTriggerFired()` helpers in `PowerUpService.ts`
- ✅ All 4 trigger evaluation sites now check cooldown before granting

#### Notification Suppression
- ✅ Added `isNew: boolean` to `grantPowerUp()` return type
- ✅ `isNew: true` only for brand-new grants; `false` for refresh/stack/extend/ignore collision
- ✅ All 4 trigger sites only show notifications when `result.isNew === true`

#### Character Store
- ✅ Added `setTriggerCooldowns` action to `characterStore.ts`
- ✅ Cooldowns persisted to `data.json` via `loadData()/saveData()`

### Files Changed:
- `src/models/Character.ts` — Added `triggerCooldowns` field
- `src/services/PowerUpService.ts` — `isNew` flag, `hasFiredToday()`, `recordTriggerFired()`
- `src/store/characterStore.ts` — `setTriggerCooldowns` action
- `src/services/QuestActionsService.ts` — 2 trigger sites updated (streak_update, quest_completion)
- `src/hooks/useXPAward.ts` — 2 trigger sites updated (task_completion, xp_award)
- `test/power-up-triggers.test.ts` — 12 new tests (cooldown helpers + isNew flag)

### Testing Notes:
- ✅ **80 tests pass** (68 existing + 12 new)
- ✅ Build passes
- ✅ Deployed to test vault
- ✅ Manual testing confirmed: triggers only fire once per day

### Blockers/Issues:
- None

---

## 2026-02-08 - Session 4: Pool Gating, New Effects & Limit Break

**Focus:** Gate trigger-only effects from random pools, add 7 replacement effects, convert Limit Break to % scaling

### Completed:

#### Pool Gating
- ✅ Gated 5 effects from random pools (trigger-only): `first_blood_boost`, `catch_up`, `adrenaline_rush`, `genius_mode`, `flow_state`

#### New T1 Effects (5 stat percentage boosts)
- ✅ `iron_grip` (+10% STR), `cats_grace` (+10% DEX), `arcane_insight` (+10% INT), `inner_peace` (+10% WIS), `stone_skin` (+10% CON)
- ✅ New `stat_percent_boost` effect type in `Character.ts`

#### New T2 Effects
- ✅ `surge` (+20% XP for 5 tasks, uses-based duration)
- ✅ `fortunes_favor` (+5% gold per stack, max 3, duration-based)
- ✅ New `gold_multiplier` effect type and `stack_refresh` collision policy

#### Limit Break Scaling Fix
- ✅ Converted from flat `+3 all stats` → `+5% all stats`
- ✅ New `all_stats_percent_boost` effect type
- ✅ Scales properly with higher levels (L35 with 300 STR → +15 STR)

#### Integration
- ✅ `getPercentStatBoostFromPowerUps()` wired into `StatsService.getTotalStat()` (applied after flat bonuses)
- ✅ `getGoldMultiplierFromPowerUps()` wired into `LootGenerationService` (quest, combat, chest gold)

#### Test Fixes
- ✅ Fixed pre-existing `streak_shield` test bug (expected stacking but uses `ignore` policy)
- ✅ 21 new tests: `stack_refresh` collision (3), `getPercentStatBoostFromPowerUps` (5), `getGoldMultiplierFromPowerUps` (5), TIER_POOLS composition (7), `limit_break` type assertion (1)

### Files Changed:
- `src/models/Character.ts` — Added `stat_percent_boost`, `all_stats_percent_boost`, `gold_multiplier` effect types; `stack_refresh` collision policy
- `src/services/PowerUpService.ts` — 7 new effects, pool gating, Limit Break → 5%, `stack_refresh` handler, utility functions
- `src/services/StatsService.ts` — `getTotalStat()` applies percentage boosts after flat bonuses
- `src/services/LootGenerationService.ts` — Gold multiplier applied to quest, combat, and chest gold
- `test/power-up-effects.test.ts` — Fixed `streak_shield` test bug, 21 new tests

### Pool Composition After Session 4:

| Tier | Pool |
|------|------|
| T1 | `momentum`, `lucky_star`, `iron_grip`, `cats_grace`, `arcane_insight`, `inner_peace`, `stone_skin` |
| T2 | `streak_shield`, `surge`, `fortunes_favor` |
| T3 | `limit_break` |

### Testing Notes:
- ✅ **163 tests pass** (83 effects + 80 triggers)
- ✅ Build passes
- ✅ Deployed to test vault

### Blockers/Issues:
- None

---

## Next Session Prompt

```
Power-Up Rebalance Sessions 1-4 complete. Full rebalance done.

Summary of all sessions:
- Session 1: Removed 4 triggers, updated 10 trigger definitions (task → quest)
- Session 2: Wired quest-level context, updated all tests (68 pass)
- Session 3: Daily trigger cooldowns, notification suppression (80 pass)
- Session 4: Pool gating, 7 new effects, Limit Break % scaling (163 pass)

Remaining documentation:
- Update Power-Ups & Buffs wiki with new trigger conditions and effects

Key files:
- src/services/PowerUpService.ts — All effect/trigger/pool definitions
- src/services/StatsService.ts — Percentage stat boost integration
- src/services/LootGenerationService.ts — Gold multiplier integration
```

---

## Git Commit Messages

### Session 1
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

### Session 2
```
feat(power-ups): Session 2 - wire quest context & update tests

Context Wiring:
- Scan activityHistory in QuestActionsService.moveQuest() for quest-level counts
- Wire 5 fields: questsCompletedToday, questsInLastHour,
  questCategoriesCompletedToday, questCategoryCountToday, questCategory

Test Updates:
- Remove tests for deleted triggers (one_shot, big_fish, inbox_zero, critical_success)
- Update all pre-rebalance tests to match new definitions
- Fix taskCategory → questCategory in rebalanced category tests
- Remove as any casts, clean up declare module augmentation
- Result: 68 tests, 0 failures (was 52/23)

Cleanup:
- Remove tasksInLastHour from useXPAward.ts and TriggerContext interface

Files: QuestActionsService.ts, PowerUpService.ts, useXPAward.ts, power-up-triggers.test.ts
```

### Session 3
```
fix(power-ups): Session 3 - daily trigger cooldown & notification fix

Bug Fix:
- Triggers like early_riser, weekend_warrior fired on every quest completion
  during their time window, showing redundant notifications

Daily Trigger Cooldowns:
- Add triggerCooldowns field to Character (optional, no schema bump)
- Add hasFiredToday() / recordTriggerFired() helpers
- All 4 trigger evaluation sites check cooldown before granting

Notification Suppression:
- Add isNew flag to grantPowerUp() return type
- isNew: true only for brand-new grants, false for collision-handled
- Notifications only shown when isNew === true

Tests: 80 pass (68 existing + 12 new for cooldown helpers and isNew flag)

Files: Character.ts, PowerUpService.ts, characterStore.ts,
       QuestActionsService.ts, useXPAward.ts, power-up-triggers.test.ts
```

### Session 4
```
feat(power-ups): Session 4 - pool gating, new effects, Limit Break scaling

Pool Gating:
- Gated 5 effects from random pools (trigger-only): first_blood_boost,
  catch_up, adrenaline_rush, genius_mode, flow_state

New T1 Effects (5 stat percent boosts):
- Iron Grip (+10% STR), Cat's Grace (+10% DEX), Arcane Insight (+10% INT),
  Inner Peace (+10% WIS), Stone Skin (+10% CON)

New T2 Effects:
- Surge: +20% XP for 5 tasks (uses-based)
- Fortune's Favor: +5% gold/stack, max 3 stacks, stack_refresh collision

New Systems:
- stat_percent_boost / all_stats_percent_boost effect types
- gold_multiplier effect type with stack-aware calculation
- stack_refresh collision policy (increment stacks + refresh timer)
- Percentage stat boosts applied after flat bonuses in StatsService
- Gold multiplier wired into quest, combat, and chest loot

Limit Break Fix:
- Converted from flat +3 all stats → +5% all stats (scales with level)

Tests: 163 pass (83 effects + 80 triggers), fixed pre-existing streak_shield test bug

Files: Character.ts, PowerUpService.ts, StatsService.ts, LootGenerationService.ts,
       power-up-effects.test.ts
```
