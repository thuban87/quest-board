# Power-Up Rebalance Implementation Guide

**Status:** In Progress (Sessions 1-3 Complete)  
**Created:** 2026-02-06  
**Estimated Sessions:** 2-3  
**Session Log:** [Power-Up Rebalance Session Log](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/development/planned-features/Power-Up%20Rebalance%20Session%20Log.md)  
**Goal:** Reduce daily power-up frequency from ~20+ to 1-6 based on player activity level

---

## Problem Statement

The current power-up system triggers too frequently, making power-ups feel routine rather than special. A medium-activity user is seeing 15-20 power-ups per day, which diminishes the reward value.

**Target Frequency:**
| Player Type | Quests/Day | Target Power-Ups |
|-------------|------------|------------------|
| Light | 2-3 | 1-2 |
| Medium | 5-7 | 3-4 |
| Heavy | 10+ | 5-6 |

---

## Key Design Decisions

1. **Quest completion = marking as complete** (not checking off last task). This allows players to "stash" completed quests and batch-complete them — a valid gamification strategy since they're still being productive.

2. **Quest categories are used** for category triggers (not individual task categories). The `quest.category` field is the source of truth.

3. **Easy "gimmes" are intentional** — Weekend Warrior, Fresh Start, Clutch give 1-2 power-ups/day minimum.

4. **Known Loophole: Reopen Spam** — A user can Complete → Reopen → Complete the same quest repeatedly to trigger Hat Trick/Blitz. We're leaving this as-is because:
   - Fixing it (counting unique quest IDs) would break legitimate workflows like weekly recurring quests that get reopened
   - It's a single-player productivity app, not a competitive game
   - Users who want to "cheat" are only cheating themselves
   - **Future consideration:** May close this loophole based on community feedback

---

## Changes Overview

### 1. Triggers to Remove (4)

| Trigger | Reason |
|---------|--------|
| `one_shot` | Column-dependent (custom columns break this) |
| `inbox_zero` | Column-dependent (custom columns break this) |
| `critical_success` | Too random/frequent (5% on every task) |
| `big_fish` | Too easy to hit (>50 XP is common) |

### 2. Pool Changes

**Remove `level_up_boost` from T2 pool** — it should only be granted via the Level Up trigger, not random rolls.

```typescript
// BEFORE
T2: ['flow_state', 'streak_shield', 'level_up_boost']

// AFTER
T2: ['flow_state', 'streak_shield']
```

### 3. Trigger Modifications

#### Task → Quest Changes (Harder Triggers)

| Trigger | Old Condition | New Condition | Old Tier | New Tier |
|---------|---------------|---------------|----------|----------|
| **Hat Trick** | 3 tasks in 1 hour | 3 quests in 1 hour | T1 | **T2** |
| **Blitz** | 10 tasks in a day | 10 quests in a day | T2 | **T3** |
| **Early Riser** | Task before 8 AM | Quest before 8 AM | T1 | T1 |
| **Night Owl** | Task after 10 PM | Quest after 10 PM | T1 | T1 |
| **Multitasker** | 3+ task categories | 3+ quest categories | T1 | T1 |

#### Category Triggers (Quest-Based)

| Trigger | Old Condition | New Condition | Grants |
|---------|---------------|---------------|--------|
| **Gym Rat** | 3 Health/Fitness tasks | 2 Health/Fitness quests | Adrenaline Rush |
| **Deep Work** | 3 Dev/Study tasks | 2 Dev/Study quests | Genius Mode |
| **Social Butterfly** | 3 Social tasks | 2 Social quests | Random T1 |
| **Admin Slayer** | 5 Chore/Admin tasks | 2 Chore/Admin quests | Flow State |

#### Task-Based Threshold Change

| Trigger | Old Condition | New Condition | Tier |
|---------|---------------|---------------|------|
| **Combo Breaker** | 5 tasks in same category | 10 tasks in same category | T1 |

---

## Architecture: Where Context Is Built

| File | Line Range | Detection Point | Notes |
|------|------------|-----------------|-------|
| [useXPAward.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/hooks/useXPAward.ts) | 161-170 | `task_completion` | Builds `categoryCountToday`, `categoriesCompletedToday` |
| [useXPAward.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/hooks/useXPAward.ts) | 268-272 | `xp_award` | Level up / tier up detection |
| [QuestActionsService.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/services/QuestActionsService.ts) | 219-260 | `quest_completion` | Builds quest-level counts, weekend, due date, category context |
| [QuestActionsService.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/services/QuestActionsService.ts) | 140-144 | `streak_update` | Streak milestone detection |

---

## Session Breakdown

### Session 1: Core Changes (Phases 1-2) ✅ COMPLETE

**Scope:** Remove triggers, fix pools, update trigger definitions

**Files Changed:**
- [PowerUpService.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/services/PowerUpService.ts) — Removed 4 triggers, fixed T2 pool, updated 10 trigger definitions, added quest-level fields to `TriggerContext`, cleaned up removed fields
- [QuestActionsService.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/services/QuestActionsService.ts) — Removed `questWasOneShot` and `inProgressCount` from quest completion context
- [useXPAward.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/hooks/useXPAward.ts) — Removed `taskXP` from trigger context
- [power-up-triggers.test.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/test/power-up-triggers.test.ts) — Minimal fixes: removed deleted fields from `createDefaultContext`, updated `declare module` augmentation

**What Was Done:**
1. ✅ Removed 4 triggers from `TRIGGER_DEFINITIONS`: `one_shot`, `inbox_zero`, `critical_success`, `big_fish`
2. ✅ Removed `level_up_boost` from `TIER_POOLS.T2`
3. ✅ Updated `TriggerContext` interface — added new quest-level fields, removed `questWasOneShot`, `inProgressCount`, `taskXP`
4. ✅ Updated trigger conditions and descriptions for: Hat Trick, Blitz, Early Riser, Night Owl, Multitasker, Combo Breaker
5. ✅ Updated category triggers (Gym Rat, Deep Work, Social Butterfly, Admin Slayer) to quest-based with threshold 2

**Deferred to Session 2:**
- Cleanup of `tasksInLastHour` calculation from `useXPAward.ts` — still used by legacy task-level tests; remove after tests are updated

**Verification:**
- ✅ `npm run build` passes
- 23 test failures — all expected (removed triggers fail, old TDD tests use pre-rebalance thresholds/detection points)

---

### Session 2: Context Building & Testing (Phases 3-5) ✅ COMPLETE

**Scope:** Wire quest-level context, update tests, clean up legacy code

**Files Changed:**
- [QuestActionsService.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/services/QuestActionsService.ts) — Activity history scanning + 5 quest-level context fields
- [PowerUpService.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/services/PowerUpService.ts) — Removed `tasksInLastHour` from `TriggerContext`
- [useXPAward.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/hooks/useXPAward.ts) — Removed `tasksInLastHour` calculation and context field
- [power-up-triggers.test.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/test/power-up-triggers.test.ts) — Full test update

**What Was Done:**
1. ✅ Wired `questsCompletedToday`, `questsInLastHour`, `questCategoriesCompletedToday`, `questCategoryCountToday`, `questCategory` in `QuestActionsService.moveQuest()`
2. ✅ Removed tests for deleted triggers (`one_shot`, `big_fish`, `inbox_zero`, `critical_success`)
3. ✅ Updated all pre-rebalance tests to match new definitions
4. ✅ Fixed `taskCategory` → `questCategory` in rebalanced category tests
5. ✅ Removed `as any` casts, cleaned up `declare module` augmentation
6. ✅ Removed `tasksInLastHour` from `useXPAward.ts` and `TriggerContext` interface

**Verification:**
- ✅ `npm run build` passes
- ✅ `npm test` passes — 68 tests, 0 failures (was 52/23 after Session 1)
- ✅ Deployed to test vault

---

### Session 3: Trigger Cooldown & Notification Fix ✅ COMPLETE

**Scope:** Fix trigger notification spam bug, suppress collision-handled notifications

**Files Changed:**
- [Character.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/models/Character.ts) — Added `triggerCooldowns?: Record<string, string>` (optional, no schema bump)
- [PowerUpService.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/services/PowerUpService.ts) — Added `isNew` flag to `grantPowerUp()` return, added `hasFiredToday()` and `recordTriggerFired()` helpers
- [characterStore.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/store/characterStore.ts) — Added `setTriggerCooldowns` action
- [QuestActionsService.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/services/QuestActionsService.ts) — 2 trigger sites: cooldown check + notification suppression
- [useXPAward.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/hooks/useXPAward.ts) — 2 trigger sites: cooldown check + notification suppression
- [power-up-triggers.test.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/test/power-up-triggers.test.ts) — 12 new tests for cooldown helpers and `isNew` flag

**What Was Done:**
1. ✅ Added daily trigger cooldown map (`triggerCooldowns`) to Character — persisted via `loadData()/saveData()`
2. ✅ Added `isNew` boolean to `grantPowerUp()` return — `true` only for brand-new grants, `false` for refresh/stack/extend/ignore
3. ✅ All 4 trigger evaluation sites skip triggers that already fired today and only notify for `isNew` grants
4. ✅ 12 new tests covering `hasFiredToday()`, `recordTriggerFired()`, and all 4 collision policy `isNew` results

**Verification:**
- ✅ `npm run build` passes
- ✅ `npm test` passes — 80 tests, 0 failures
- ✅ Deployed to test vault, manual testing confirmed fix

---

### Session 4 (Future): Pool Composition Changes

**Scope:** Gate specific power-ups to triggers only, add replacement pool effects

#### Pool Composition Changes (Brad to specify)
Brad wants to:
- Gate certain power-ups to specific triggers only (remove from random pools)
- Add replacement T1/T2 effects to maintain pool diversity

**Files:** `TIER_POOLS` and `EFFECT_DEFINITIONS` in `PowerUpService.ts`

#### Documentation Polish
- Update [Power-Ups & Buffs wiki](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/wiki/Power-Ups%20%26%20Buffs.md) with new trigger conditions

---

## Final Trigger Summary (19 triggers)

### Task Completion Triggers (3)

| Trigger | Condition | Grants |
|---------|-----------|--------|
| First Blood | First task of day | First Blood |
| Phoenix | First task after 3+ days inactive | Catch-Up |
| Combo Breaker | 10 tasks in same category | Random T1 |

### Quest Completion Triggers (12)

| Trigger | Condition | Grants |
|---------|-----------|--------|
| Hat Trick | 3 quests in 1 hour | Random T2 |
| Blitz | 10 quests in a day | Random T3 |
| Early Riser | Quest before 8 AM | Random T1 |
| Night Owl | Quest after 10 PM | Random T1 |
| Multitasker | 3+ quest categories in a day | Random T1 |
| Gym Rat | 2 Health/Fitness quests | Adrenaline Rush |
| Deep Work | 2 Dev/Study quests | Genius Mode |
| Social Butterfly | 2 Social quests | Random T1 |
| Admin Slayer | 2 Chore/Admin quests | Flow State |
| Weekend Warrior | Quest on Sat/Sun | Random T1 |
| Fresh Start | First quest on Monday | Random T1 |
| Clutch | Quest on due date | Random T1 |
| Speedrunner | Quest 24h+ before due date | Flow State |

### Streak Triggers (4)

| Trigger | Condition | Grants |
|---------|-----------|--------|
| Streak Keeper (3) | 3-day streak | Streak Shield |
| Streak Keeper (7) | 7-day streak | Random T1 |
| Streak Keeper (14) | 14-day streak | Random T2 |
| Streak Keeper (30) | 30-day streak | Limit Break |

### XP/Level Triggers (2)

| Trigger | Condition | Grants |
|---------|-----------|--------|
| Level Up | Gain a level | Level Up! |
| Tier Up | Reach a new tier | Limit Break |

---

## Verification Plan

### Automated Tests

**Existing test file:** [power-up-triggers.test.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/test/power-up-triggers.test.ts)

```bash
npm test -- --grep "power-up"
```

### Build Verification
```bash
npm run build
```

### Manual Testing Checklist

After deploying to test vault (`npm run deploy:test`):

| Test | Steps | Expected |
|------|-------|----------|
| **Removed triggers** | Complete 50+ XP task, complete task randomly | `big_fish` and `critical_success` should NOT fire |
| **First Blood** | Complete first task of day | First Blood power-up appears |
| **Category trigger** | Complete 2 quests in same category (e.g., Health) | Gym Rat / Adrenaline Rush appears |
| **Hat Trick** | Mark 3 quests complete within 1 hour | Hat Trick (T2 pool) appears |
| **Blitz** | Mark 10 quests complete in one day | Blitz (T3 pool) appears |
| **Pool check** | Trigger multiple T2 rolls | Verify `level_up_boost` never appears from pool |

---

## Rollback Plan

If issues arise:
1. Revert changes to `PowerUpService.ts`
2. Revert changes to `QuestActionsService.ts`
3. Restore removed triggers and pool entries
4. Deploy: `npm run deploy:test`
