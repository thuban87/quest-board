# Title System Implementation Plan

> **Status:** 🔲 TODO
> **Estimated Sessions:** 7-9 (including test phases)
> **Created:** 2026-02-21
> **Last Updated:** 2026-02-23
> **Companion Log:** [[Title System Session Log]]

---

## Table of Contents

1. [Overview](#overview)
2. [Key Design Decisions](#key-design-decisions)
3. [Non-Goals](#non-goals)
4. [Architecture & Data Structures](#architecture--data-structures)
5. [Phase 0: Migration Chain Fix (Pre-requisite)](#phase-0-migration-chain-fix-pre-requisite)
6. [Phase 0.5: Tests — Migration Chain Fix](#phase-05-tests--migration-chain-fix)
7. [Phase 1: Data Models & Schema Migration](#phase-1-data-models--schema-migration)
8. [Phase 1.5: Tests — Data Layer](#phase-15-tests--data-layer)
9. [Phase 2: Title Service & Achievement Integration](#phase-2-title-service--achievement-integration)
10. [Phase 2.5: Tests — Service Layer](#phase-25-tests--service-layer)
11. [Phase 3: Buff Engine (PowerUp Integration)](#phase-3-buff-engine-powerup-integration)
12. [Phase 3.5: Tests — Buff Engine](#phase-35-tests--buff-engine)
13. [Phase 4: UI — Character Identity & Title Selection Modal](#phase-4-ui--character-identity--title-selection-modal)
14. [Phase 4.5: Tests — UI](#phase-45-tests--ui)
15. [Phase 5: UI — Progress Dashboard Report Generator](#phase-5-ui--progress-dashboard-report-generator)
16. [Phase 5.5: Tests — Export](#phase-55-tests--export)
17. [Phase 6: CSS & Polish](#phase-6-css--polish)
18. [Plan Summary](#plan-summary)
19. [Verification Checklist](#verification-checklist)
20. [File Change Summary](#file-change-summary)
21. [Key References](#key-references)

---

## Overview

### Problem Statement

Players earn achievements but get no lasting cosmetic or mechanical reward beyond the XP bonus at unlock time. There's no visual identity progression — a level 30 character looks the same as a level 5 in terms of "prestige." The title system gives players something to show off and a small mechanical incentive to keep pushing.

### What This Adds

- **Unlockable titles** displayed on the character sheet next to the character name
- **Two categories:** Cosmetic-only titles (prestige/flavor) and buff titles (cosmetic + passive micro-buff)
- **Buff titles** inject as passive `ActivePowerUp` entries, piggybacking on the existing power-up system with minimal new wiring (Phase 0 fixes the migration chain, Phase 3 fixes `deriveCombatStats()` to read power-ups)
- **Mixed unlock sources:** Most titles unlock via achievements (existing and new), some via level milestones, streaks, and combat stats — all funneled through the achievement pipeline
- **Lifetime stats tracking:** Running counters for all-time gold, battles, bosses, dungeons, quests — used by achievement checks and the analytics dashboard
- **Progress Dashboard report generator:** Export character summary + date-filtered activity stats as clipboard copy or vault note, with preset time ranges (1 week, 4 weeks, 3 months, all time, custom date picker)

### Goals

- Titles feel rewarding and provide a visible sense of progression
- Buff titles are small enough to be fun without being balance-breaking
- System is extensible — easy to add new titles later
- Minimal new calculation paths — buff titles use existing `ActivePowerUp` infrastructure (Phase 3 fixes a pre-existing gap where `deriveCombatStats()` doesn't read power-ups)

---

## Key Design Decisions

### 1. Titles Piggyback on the PowerUp System

**Decision:** Buff titles inject as `ActivePowerUp` with `triggeredBy: 'title'` and `expiresAt: null` (passive).

**Why:** The power-up system already handles XP multipliers, stat boosts, gold multipliers, and all-stats boosts. Most calculation paths (XP, stats) already read active power-ups. By creating title buffs as `ActivePowerUp` entries, we get:
- Automatic buff icon display in the CharacterIdentity buff row
- Automatic pickup by `XPSystem.calculateXPWithBonus()`, `StatsService.getTotalStat()`
- Minimal new wiring needed (see Phase 3 for `crit_chance` integration into `deriveCombatStats()`)

**Tradeoff:** Title buffs show up in the buff row alongside temporary power-ups. This is actually desirable — it makes the title's effect visible.

### 2. All Titles Unlock Through the Achievement Pipeline

**Decision:** Every title is tied to an achievement. For titles that unlock via level milestones or combat stats, we create new achievements with those triggers.

**Why:** The `AchievementService` already handles level, streak, quest count, and category count trigger types. Rather than building a parallel unlock system, we add a `grantedTitleId?: string` field to the `Achievement` interface. When an achievement unlocks and has this field, the title unlocks too. The grant is handled **caller-side** — after any `check*Achievements()` call returns `newlyUnlocked`, the caller checks `grantedTitleId` and calls `TitleService.grantTitle()`. This keeps `AchievementService` stateless.

**Tradeoff:** This means you can't have a title without an associated achievement. Acceptable — achievements are cheap to create and provide additional XP rewards. The caller-side pattern requires wiring at 4+ call sites but preserves the functional architecture.

### 3. Schema v7 Migration (v6 → v7)

**Decision:** Add `equippedTitle: string | null`, `unlockedTitles: string[]`, and `lifetimeStats: LifetimeStats` to the Character interface. Increment schema to v7.

**Why:** Current schema is v6. The migration chain (v1→v2→v3→v4→v5→v6) is well-established. The v6→v7 migration provides safe defaults (`null`, `[]`, and backfilled counters from `activityHistory`). Lifetime stats enable O(1) achievement checks and feed the Progress Dashboard analytics.

> [!IMPORTANT]
> The migration chain has a systemic bug: multiple migration functions use `>= N` early return guards that return data as-is instead of chaining forward. A v6 character enters `migrateCharacterV1toV2()`, gets forwarded to `migrateCharacterV2toV3()`, which sees `6 >= 4` and returns unchanged — the chain never reaches `v5→v6` or `v6→v7`. **Phase 0 fixes the entire chain** before any title work begins.

### 4. Rarity Tiers Drive Visual Treatment Only

**Decision:** Title rarity (`common | rare | epic | legendary`) determines CSS styling (color, glow, gradient) but has no mechanical effect. Buff strength is independent of rarity (though higher-rarity titles tend to have stronger buffs by convention).

**Why:** Keeps the system simple. Rarity is a visual prestige signal, not a balance lever.

### 5. Title Display: Inline After Character Name

**Decision:** The equipped title renders inline after the character name in the `CharacterIdentity` component, styled with its rarity class. Clicking it opens the Title Selection Modal.

**Layout:**
```
[Sprite] Character Name — ⟨ The Relentless ⟩
         Level 15 Warrior
         + Scholar
[Buffs row: ... 🏷️ ...]
```

**Why:** Keeps the header compact. The title is visually distinct via rarity color/glow. The em-dash separator and angle brackets frame it as a title rather than a subtitle.

### 6. Export Lives on the Progress Dashboard

**Decision:** Two export triggers on the Progress Dashboard modal:
1. Clipboard copy button (copies character summary + filtered stats)
2. "Save to vault" button that creates a timestamped `.md` file in a configurable export folder (defaults to user's quest folder)

**Export folder:** Configurable via a new `exportFolder` setting with folder autocomplete, located in the collapsed path settings section at the top of the settings panel. Defaults to `settings.questFolder`.

**Date filtering:** Uses the `ProgressStatsService` date range infrastructure. The existing custom date picker (start/end date inputs) has a UX bug where it shares state with "All Time" — this is fixed as part of Phase 5 by adding a proper `'custom'` preset type. When a preset is active, the date inputs render as **disabled/readonly** with the preset's resolved dates shown for visual context. When "Custom range" is selected, the inputs re-enable for manual editing. The export includes whatever date range is currently active on the dashboard.

**Format:**
```markdown
# Character Name — ⟨ The Relentless ⟩
**Level 15 Warrior** | Streak: 7 days
**HP:** 120/120 | **Mana:** 45/45 | **Stamina:** 8/10

## Stats
STR: 18 | DEX: 14 | CON: 16 | INT: 12 | WIS: 10 | CHA: 8

## Active Buffs
- 🏷️ The Relentless — +1 All Stats (Title)
- ⚡ Flow State — 2x XP (2h remaining)

## Equipped Gear
- Weapon: Iron Sword (+5 ATK)
- Armor: Chain Mail (+8 DEF)
...

## Progress (Last 30 Days)
Quests: 24 | Bounties Won: 12 | Dungeons: 3/8 (37% completion)
XP Earned: 4,200 | Gold Earned: 850
Best Day: Feb 15 (8 completions)
```

**File naming:** `{CharacterName} Export {YYYY-MM-DD} {HHmm}.md` — timestamps prevent same-day collisions and enable historical record. The time component guarantees uniqueness across multiple exports. As an additional safety measure, `vault.create()` is wrapped with a collision fallback that appends `(1)`, `(2)`, etc. if a same-name file already exists.

---

## Non-Goals

- **No temporary or expiring titles.** Once unlocked, permanent.
- **No debuff titles.** All titles are neutral or positive.
- **No title crafting/combining.** Titles are fixed definitions.
- **No title trading.** Single-character system.
- **No title-specific quest requirements.** Titles don't gate content.
- **No animated title effects.** CSS transitions only (glow, gradient), no sprite animations.

> [!NOTE]
> **Deferred to future:** Title categories/filtering in the selection modal, title achievement progress bars, title "showcase" on a hypothetical public profile.

---

## Architecture & Data Structures

### Title Interface

```typescript
// src/models/Title.ts

export type TitleRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Title {
    id: string;                          // e.g., 'the-novice', 'fortune-favored'
    name: string;                        // Display text: "The Novice"
    description: string;                 // Flavor text + buff description
    unlockCondition: string;             // Shown in modal for locked titles: "Maintain a 7-day streak"
    emoji: string;                       // Icon for lists/export
    rarity: TitleRarity;
    /** If present, this title grants a passive buff when equipped */
    buff?: TitleBuff;
}

export interface TitleBuff {
    /** Human-readable buff description: "+5% Gold from all sources" */
    label: string;
    /** The PowerUpEffect(s) to inject as passive ActivePowerUp entries.
     *  Single effect for most titles, array for multi-buff titles like The Relentless. */
    effect: PowerUpEffect | PowerUpEffect[];
}
```

### Achievement Extension

```typescript
// Added to Achievement interface
export interface Achievement {
    // ... existing fields ...
    grantedTitleId?: string;    // If set, unlocking this achievement grants this title
}
```

### Character Schema v7

```typescript
// Added to Character interface
export interface LifetimeStats {
    questsCompleted: number;
    battlesWon: number;
    bossesDefeated: number;
    dungeonsCompleted: number;
    dungeonAttempts: number;
    goldEarned: number;
}

export interface Character {
    // ... existing fields ...
    equippedTitle: string | null;    // Title ID or null
    unlockedTitles: string[];        // Array of unlocked Title IDs
    lifetimeStats: LifetimeStats;    // Running counters (backfilled from activityHistory on migration)
}
```

### Title Registry (Initial Set)

| ID | Name | Rarity | Buff | Unlock Condition | New Achievement? |
|----|------|--------|------|------------------|------------------|
| `the-novice` | The Novice | Common | — | Free starting title | No (auto-granted) |
| `questrunner` | Questrunner | Common | — | Complete 10 quests | Yes: `quests-10` |
| `streak-keeper` | Streak Keeper | Rare | — | 7-day streak | No (maps to `streak-7`) |
| `dungeon-delver` | Dungeon Delver | Rare | — | Complete 3 dungeons | Yes: `dungeons-3` |
| `the-dedicated` | The Dedicated | Rare | — | Reach Level 10 | No (maps to `level-10`) |
| `the-scholar` | The Scholar | Rare | +3% XP (all sources) | Complete 50 quests | Yes: `quests-50` |
| `fortune-favored` | Fortune's Favorite | Epic | +5% Gold (all sources) | Earn 1000 total gold | Yes: `gold-1000` |
| `eagle-eye` | Eagle Eye | Epic | +2% Crit Chance | Win 25 battles | Yes: `battles-25` |
| `the-tempered` | The Tempered | Epic | +1 All Stats | Reach Level 20 | Yes: `level-20` |
| `the-focused` | The Focused | Epic | +3% to both primary stats | Reach Level 25 | No (maps to `level-25`) |
| `slayer-of-the-void` | Slayer of the Void | Legendary | +5% Boss Damage | Defeat 10 bosses | Yes: `bosses-10` |
| `the-relentless` | The Relentless | Legendary | +1 All Stats, +2% XP | 30-day streak | No (maps to `streak-30`) |

> [!NOTE]
> **"The Focused"** grants `stat_percent_boost` to **both** of the character's primary class stats (from `ClassInfo.primaryStats` tuple). For example, Warrior gets +3% STR and +3% CON. This is resolved at equip time when creating the `ActivePowerUp[]` array (two entries).
>
> **"Slayer of the Void"** does NOT use a `PowerUpEffect` — `BattleService.calculatePlayerDamage()` and `executePlayerSkill()` directly check for the equipped title ID and apply the 5% boss damage bonus via `monster.tier === 'boss' || monster.tier === 'raid_boss'` (the `BattleMonster` type has `tier` but not `isBoss`). This avoids expanding the `PowerUpEffect` union for a single title.

### New Achievements Needed

| ID | Name | Trigger Type | Target | Category |
|----|------|-------------|--------|----------|
| `quests-10` | Adventurer's Start | `quest_count` | 10 | `quest_count` |
| `quests-50` | Seasoned Adventurer | `quest_count` | 50 | `quest_count` |
| `level-20` | Veteran Adventurer | `level` | 20 | `level` |
| `dungeons-3` | Dungeon Explorer | `manual` | 1 | `special` |
| `gold-1000` | Fortune Seeker | `manual` | 1 | `special` |
| `battles-25` | Veteran Fighter | `manual` | 1 | `special` |
| `bosses-10` | Boss Hunter | `manual` | 1 | `special` |

> [!IMPORTANT]
> The `manual` trigger achievements (dungeons, gold, battles, bosses) use `lifetimeStats` counters for O(1) checks instead of scanning `activityHistory`. Each counter is incremented at the appropriate service call site (dungeon completion, gold award, battle victory) and the achievement threshold is checked against the counter.

### Component Diagram

```
┌──────────────────────────────────────────────────────┐
│                   CharacterIdentity                   │
│  ┌──────────┐  Name — ⟨ Title ⟩  (click → Modal)    │
│  │  Sprite  │  Level X Class                         │
│  └──────────┘  [Buff Icons including 🏷️ Title Buff]  │
└──────────────────────────────────────────────────────┘
         │ click                    ▲ reads
         ▼                         │
┌─────────────────────┐   ┌───────────────────┐
│ TitleSelectionModal │   │  characterStore   │
│ - List unlocked     │──▶│ setEquippedTitle  │   ← simple setters
│ - Show locked       │   │ addUnlockedTitle  │
│ - Equip/unequip     │   │ activePowerUps    │
└─────────────────────┘   └───────────────────┘
                                   ▲
                                   │ all business logic
                          ┌────────────────┐
                          │  TitleService  │
                          │ equipTitle()   │  ← manages PowerUp lifecycle
                          │ grantTitle()   │
                          └────────────────┘
                                   ▲
                                   │ caller-side hook
              ┌────────────────────────────────────┐
              │    Call sites (after achievement   │
              │    check returns newlyUnlocked):    │
              │  • useXPAward.ts (level, quest     │
              │    count, category achievements)   │
              │  • QuestActionsService (streak      │
              │    achievements)                   │
              │  • BattleService.handleVictory()    │
              │    (battles, bosses, gold)         │
              │  • DungeonView / exit handler       │
              │    (dungeons — caller-side)        │
              │  • StoreModal / combat loot callers │
              │    (gold — caller-side)            │
              └────────────────────────────────────┘

> [!IMPORTANT]
> **Stores are pure state managers.** Achievement checks and title grants happen **caller-side**, not inside store actions. `updateGold()` and `exitDungeon()` only update state (gold amount, lifetime stat counters). The callers (views, hooks, services) read the updated state and run achievement/title checks. This preserves the existing architecture where stores have zero imports from `AchievementService`, `Notice`, or `Vault`.
```

---

## Phase 0: Migration Chain Fix (Pre-requisite) — ✅ Complete

**Effort:** Small
**Estimated Time:** 30 minutes
**Goal:** Fix the systemic migration chain bug where `>= N` early-return guards prevent higher-version characters from reaching later migrations. This must be done before any schema v7 work.
**Prerequisites:** None

> [!CAUTION]
> **This is a known active bug.** Characters in the test vault are stuck at schema v5 despite v6 being the current version. The root cause: `migrateCharacterV2toV3()` line 800 sees `5 >= 4` and returns the data as-is, short-circuiting the chain before reaching `migrateCharacterV3toV4()`.

### Tasks

1. **Fix `migrateCharacterV2toV3()` in `Character.ts` (line ~800)**
   - **Before:** `if ((oldData.schemaVersion as number) >= 4) { return oldData as unknown as Character; }`
   - **After:** `if ((oldData.schemaVersion as number) >= 4) { return migrateCharacterV3toV4(oldData); }`
   - Characters at v4+ now flow forward instead of returning as-is

2. **Fix `migrateCharacterV3toV4()` in `Character.ts` (line ~833)**
   - **Before:** `if ((oldData.schemaVersion as number) >= 5) { return oldData as unknown as Character; }`
   - **After:** `if ((oldData.schemaVersion as number) >= 5) { return migrateCharacterV4toV5(oldData); }`
   - Characters at v5+ now flow forward instead of returning as-is

3. **Fix `migrateCharacterV5toV6()` in `Character.ts` (line ~968)**
   - **Before:** `if ((oldData.schemaVersion as number) >= 6) { return oldData as unknown as Character; }`
   - **After:** `if ((oldData.schemaVersion as number) >= 6) { return migrateCharacterV6toV7(oldData); }`

4. **Create stub `migrateCharacterV6toV7()` function**
   - Add a no-op stub that simply returns the data unchanged: `return oldData as unknown as Character;`
   - This satisfies the forward reference from Task 3 so the build compiles
   - Phase 1 replaces this stub with the real v6→v7 migration logic

5. **Verify the full chain flows correctly**
   - A v5 character should chain through v5→v6 and hit the stub v6→v7 (no-op, returns unchanged)
   - A v6 character should enter at `migrateCharacterV1toV2()`, chain through all guards, and reach the stub
   - Existing v5 test vault character should successfully migrate to v6 (current schema)

#### Tech Debt:
- None. This fixes the root cause permanently.

---

## Phase 0.5: Tests — Migration Chain Fix — ✅ Complete

**Effort:** Small
**Estimated Time:** 30-45 minutes
**Goal:** Verify the migration chain fix works correctly before adding the v6→v7 migration in Phase 1.
**Prerequisites:** Phase 0
**Coverage Target:** ≥80% line, ≥80% branch
**Test File:** `test/models/migrationChain.test.ts`
**Command:** `npx vitest run test/models/migrationChain.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

### Key Test Cases

**Chain Forward Guards:**
- v4 character enters `migrateCharacterV2toV3()` → chains forward to v3→v4 instead of returning as-is
- v5 character enters `migrateCharacterV3toV4()` → chains forward to v4→v5 instead of returning as-is
- v6 character enters `migrateCharacterV5toV6()` → chains forward to stub v6→v7 instead of returning as-is

**Full Chain Flow:**
- v1 character migrates through the full chain v1→v2→v3→v4→v5→v6→stub(v7)
- v5 character reaches v6 and exits via stub v6→v7
- v6 character reaches stub v6→v7 (confirms the bug is fixed)
- Each migration applies its expected field additions/modifications

**Regression Safety:**
- v2 character still gets v2→v3 migration applied (not skipped)
- v3 character still gets v3→v4 migration applied (not skipped)
- Stub v6→v7 returns data unchanged (no fields added yet)

#### Tech Debt:
- Phase 1.5 adds the real v6→v7 migration tests (lifetimeStats backfill, title fields, etc.)

---

## Phase 1: Data Models & Schema Migration — ✅ Complete

**Effort:** Medium
**Estimated Time:** 1.5-2 hours
**Goal:** Create the Title model, title registry data, update Achievement and Character interfaces, write v6→v7 migration with lifetimeStats backfill.
**Prerequisites:** Phase 0 (migration chain must be fixed first)

### Tasks

1. **Create `src/models/Title.ts`**
   - `TitleRarity` type
   - `Title` interface with optional `buff: TitleBuff` and required `unlockCondition: string`
   - `TitleBuff` interface (label + `PowerUpEffect | PowerUpEffect[]`)
   - Helper: `getTitleById(id: string): Title | undefined`
   - Helper: `isBuffTitle(title: Title): boolean`
   - **Import pattern:** Use direct imports (do not add to `models/index.ts` barrel — follows the same pattern as Achievement, Monster, Dungeon, etc.)

2. **Create `src/data/titles.ts`**
   - `TITLES: Record<string, Title>` with all 12 titles from the registry table
   - `STARTING_TITLE_ID = 'the-novice'`
   - Each buff title's `effect` field is a valid `PowerUpEffect` (e.g., `{ type: 'gold_multiplier', value: 1.05 }`)

3. **Update `src/models/Achievement.ts`**
   - Add `grantedTitleId?: string` to the `Achievement` interface

4. **Update `src/data/achievements.ts`**
   - Add 7 new achievements from the "New Achievements Needed" table (including `level-20`)
   - Add `grantedTitleId` to all 12 achievements that map to titles (both existing and new)

5. **Update `src/models/Character.ts`**
   - Add `LifetimeStats` interface: `{ questsCompleted, battlesWon, bossesDefeated, dungeonsCompleted, dungeonAttempts, goldEarned }`
   - Add `equippedTitle: string | null`, `unlockedTitles: string[]`, and `lifetimeStats: LifetimeStats` to the `Character` interface
   - Increment `CHARACTER_SCHEMA_VERSION` to 7
   - Create `migrateCharacterV6toV7()` function (Phase 0 already updated `migrateCharacterV5toV6()` to chain here):
     - Default `equippedTitle: null`
     - Default `unlockedTitles: ['the-novice']` (everyone starts with The Novice)
     - Backfill `lifetimeStats` from `activityHistory` (scan once during migration):
       - `questsCompleted` = count of `quest_complete` events
       - `battlesWon` = count of `bounty_victory` events
       - `bossesDefeated` = 0 (cannot determine from existing data without monster lookup)
       - `dungeonsCompleted` = 0 (cannot retroactively distinguish completed vs attempted)
       - `dungeonAttempts` = count of `dungeon_complete` events (these represent all dungeon runs where rooms were visited)
       - `goldEarned` = sum of `goldGained` across all events (**Note:** this is a lower bound — only `activityHistory` sources are counted. Gold from dungeon chest loot, item sales, and other sources not logged as `goldGained` events will be missing. Future gold is tracked correctly via `updateGold()`.)
   - **Update `createCharacter()`:** Add `equippedTitle: null`, `unlockedTitles: ['the-novice']`, `lifetimeStats: { questsCompleted: 0, battlesWon: 0, bossesDefeated: 0, dungeonsCompleted: 0, dungeonAttempts: 0, goldEarned: 0 }`
   - **Note:** Two `createCharacter()` functions exist — `Character.ts:545` (standalone export, appears unused but kept for safety) and `characterStore.ts:232` (the store action used by UI). Update BOTH with the new fields.

6. **Update `src/store/characterStore.ts`**
   - Add **simple setter** store actions (no business logic):
     - `setEquippedTitle(titleId: string | null)`: Sets `character.equippedTitle`
     - `addUnlockedTitle(titleId: string)`: Adds to `unlockedTitles[]` if not already present
     - `incrementLifetimeStat(stat: keyof LifetimeStats, amount: number)`: Increments a counter
   - Add **surgical power-up management** actions (instead of full-array replacement via `setPowerUps()`):
     - `removePowerUpsByTrigger(trigger: string)`: Filters out all `activePowerUps` entries where `triggeredBy === trigger`. This enables targeted cleanup without touching unrelated power-ups.
     - `addPowerUps(powerUps: ActivePowerUp[])`: Appends entries to the `activePowerUps` array. Each call triggers a minimal Zustand state diff.
   - **Why surgical actions instead of `setPowerUps()`:** The two-call pattern (`removePowerUpsByTrigger` → `addPowerUps`) does cause two sequential Zustand state updates and thus two React re-renders. This is acceptable because title equip/swap is infrequent. The benefit is future-proofing — when more systems add passive power-ups (accessories, class perks), they won't interfere with each other's cleanup logic.
   - **No PowerUp lifecycle logic here** — that lives in `TitleService` (Phase 2). The store just provides the mutation primitives.

#### Tech Debt:
- `bossesDefeated` starts at 0 for migrated characters (can't retroactively determine from history). Future boss kills will be counted correctly.
- The 7 new "manual" trigger achievements need check calls wired in Phase 2 — they won't auto-trigger until then

---

## Phase 1.5: Tests — Data Layer — ✅ Complete

**Effort:** Small
**Estimated Time:** 1-1.5 hours
**Goal:** Verify data integrity, migration safety, and store actions.
**Prerequisites:** Phase 1
**Coverage Target:** ≥80% line, ≥80% branch
**Test File:** `test/models/title.test.ts`, updates to `test/store/characterStore.test.ts`
**Command:** `npx vitest run test/models/title.test.ts test/store/characterStore.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

### Key Test Cases

**Title Data Integrity (`test/models/title.test.ts`):**
- Every title in `TITLES` has a valid `id` matching its key
- Every title has a non-empty `name`, `description`, `emoji`
- Every title's `rarity` is a valid `TitleRarity`
- Buff titles have valid `PowerUpEffect` types
- `getTitleById()` returns correct title or undefined
- `isBuffTitle()` correctly distinguishes buff vs cosmetic

**Achievement-Title Reference Integrity:**
- Every `grantedTitleId` in achievements points to a valid title in `TITLES`
- No duplicate `grantedTitleId` across achievements (1:1 mapping)

**Schema Migration (`test/store/characterStore.test.ts`):**
- v6 payload migrates to v7 with `equippedTitle: null`, `unlockedTitles: ['the-novice']`, `lifetimeStats` all zeros
- v7 payload passes through untouched
- v5 payload chains through v5→v6→7
- Backfill: v6 payload with 5 quest_complete + 3 bounty_victory + 2 dungeon_complete events backfills correctly
- Backfill: v6 payload with no activityHistory gets all-zero lifetimeStats

**Store Actions:**
- `addUnlockedTitle('eagle-eye')` adds to array
- `addUnlockedTitle('eagle-eye')` twice doesn't duplicate
- `setEquippedTitle('eagle-eye')` sets `equippedTitle`
- `setEquippedTitle(null)` clears it
- `incrementLifetimeStat('battlesWon', 1)` increments correctly
- `removePowerUpsByTrigger('title')` removes only title power-ups, leaving others intact
- `addPowerUps([...])` appends entries to the array without replacing existing ones
- Surgical actions produce correct state when called in sequence (remove → add)
- Store actions do NOT manage PowerUp lifecycle (that's TitleService)

**Invalid Title Validation:**
- Character with stale `equippedTitle` pointing to nonexistent title ID → `getEquippedTitle()` returns null
- Migration clears invalid `equippedTitle` IDs not found in `TITLES` registry

#### Tech Debt:
- None expected

---

## Phase 2: Title Service & Achievement Integration ✅ Complete

**Effort:** Medium
**Estimated Time:** 1.5-2 hours
**Goal:** Create TitleService, wire title grants into AchievementService, add check calls for new manual achievements.
**Prerequisites:** Phase 1

### Tasks

1. **Create `src/services/TitleService.ts`**
   - `grantTitle(titleId: string): Title | null` — Calls `characterStore.addUnlockedTitle()` and **returns the Title object** (or `null` if invalid). Does NOT show an Obsidian `Notice` — this lets the caller control timing (see E2 Note below).
   - `equipTitle(titleId: string | null): void` — Validates title ID against `TITLES` registry, calls `characterStore.setEquippedTitle()`, manages passive power-up lifecycle via surgical store actions: `removePowerUpsByTrigger('title')` to clean up old title power-ups, then `addPowerUps(newTitlePowerUps)` to inject the new title's buffs. When unequipping, only the remove step runs.
   - `getUnlockedTitles(character: Character): Title[]` — Maps `unlockedTitles` IDs to Title objects
   - `getEquippedTitle(character: Character): Title | null` — Resolves `equippedTitle` ID to Title
   - `createTitlePowerUps(title: Title, character: Character): ActivePowerUp[]` — Returns empty array for cosmetic titles, 1-2 entries for buff titles. Handles "The Focused" (both primary stats) and "The Relentless" (dual buff) at build time. **All returned entries MUST set `triggeredBy: 'title'` and `expiresAt: null`** — this is the cleanup contract used by `equipTitle()` to identify and remove title power-ups on swap/unequip.

> [!NOTE]
> **E2: Notice Timing.** `grantTitle()` intentionally returns data silently instead of showing its own `Notice`. This prevents timing desync: `useXPAward.ts` uses staggered `setTimeout` delays (1-4 seconds) for achievement Notices. If `grantTitle()` fired immediately, the title unlock would flash before the achievement that unlocked it. Instead, the caller queues both notices together inside the `setTimeout` chain:
> ```typescript
> setTimeout(() => {
>     showAchievementUnlock(app, achievement);
>     if (achievement.grantedTitleId) {
>         const title = grantTitle(achievement.grantedTitleId);
>         if (title) new Notice(`🏅 Title unlocked: ${title.name}!`, 4000);
>     }
> }, 2000 + (index * 1000));
> ```

> [!IMPORTANT]
> The `triggeredBy: 'title'` field is the sole mechanism for identifying title power-ups during cleanup. Never set `stacks: 0` on a title power-up — omit the field or set `stacks: 1`. Setting `stacks: 0` would zero out multiplicative effects due to `stacks ?? 1` fallback math in `PowerUpService` helpers.

2. **Wire caller-side title grants at achievement check call sites**
   - **Do NOT add state to `AchievementService`** — it remains a stateless service with pure check functions. Signature changes for `checkQuestCountAchievements()` are part of Phase 2 Task 4.
   - After each `check*Achievements()` call returns `newlyUnlocked`, the caller:
     1. Loops through `newlyUnlocked`
     2. Checks `if (achievement.grantedTitleId)`
     3. Calls `TitleService.grantTitle(achievement.grantedTitleId)`
   - Call sites to wire (verified via codebase search — actual locations differ from service names):
     - `src/hooks/useXPAward.ts` ~line 359 — `checkLevelAchievements()` after XP award
     - `src/services/QuestActionsService.ts` ~line 184 — `checkStreakAchievements()` after streak update (NOTE: this is in QuestActionsService, not useXPAward)
     - `src/hooks/useXPAward.ts` ~line 452 — `checkCategoryCountAchievements()` after quest completion
     - `src/hooks/useXPAward.ts` — `checkQuestCountAchievements()` after quest completion
     - **Note:** Level, category, and quest-count achievement checks live in `useXPAward.ts`. Streak achievement checks live in `QuestActionsService.ts`. The caller-side title grant loop goes at each of these call sites.

3. **Create new `AchievementService` check methods for combat/dungeon/gold achievements**

   > [!IMPORTANT]
   > `AchievementService` currently only has `checkLevelAchievements()`, `checkQuestCountAchievements()`, `checkCategoryCountAchievements()`, and `checkStreakAchievements()`. **No methods exist for boss kills, battle counts, dungeon completions, or gold milestones.** These must be created before the wiring in Task 4.

   - **Add to `src/services/AchievementService.ts`:**
     - `checkBattleCountAchievements(achievements, battlesWon)` — checks `battles-25` achievement
     - `checkBossKillAchievements(achievements, bossesDefeated)` — checks `bosses-10` achievement
     - `checkDungeonAchievements(achievements, dungeonsCompleted)` — checks `dungeons-3` achievement
     - `checkGoldAchievements(achievements, goldEarned)` — checks `gold-1000` achievement
   - **Pattern:** Follow the existing `checkLevelAchievements()` structure — filter achievements by trigger type (`manual`), compare count against trigger target, unlock if met.
   - **All methods remain stateless** — they accept counts, check thresholds, and return `AchievementCheckResult` (same as existing methods).

4. **Wire lifetime stat increments + manual achievement checks (caller-side)**

   > [!IMPORTANT]
   > **Stores are pure.** `updateGold()` and `exitDungeon()` only update state — they do NOT run achievement or title checks. Achievement/title checks happen at the call sites listed below.

   > [!WARNING]
   > **`handleVictory()` currently has ZERO achievement checks.** All combat-related achievement wiring below is entirely new — there is no existing pattern to extend in this function.

   - **`BattleService.handleVictory()`** — After battle victory:
     - `incrementLifetimeStat('battlesWon', 1)`, call `checkBattleCountAchievements()`, grant title if unlocked
     - If boss: `incrementLifetimeStat('bossesDefeated', 1)`, call `checkBossKillAchievements()`, grant title if unlocked
     - **Gold fix (#1):** `handleVictory()` currently bypasses `updateGold()` by directly mutating gold via `setCharacter({ gold: freshCharacter.gold + adjustedGold, ... })` alongside HP/Mana/maxHP/maxMana (line 1077). Refactor to: (a) call `updateGold(adjustedGold)` first, then (b) call `setCharacter()` with only the HP/Mana fields. This splits one `set()` into two, but battle end is infrequent so the double-render is acceptable.
     - After `updateGold()`, check `gold-1000` achievement caller-side using threshold guard.
   - **`BattleService.handleDefeat()`** — Consistency refactor:
     - Currently sets `gold: character.gold - goldLost` directly via `setCharacter()` at line 1184. Refactor to call `updateGold(-goldLost)` first, then `setCharacter()` with HP/status fields. Since delta is negative, `lifetimeStats.goldEarned` won't be affected (only tracks positive delta), but this keeps all gold mutations flowing through one path.
   - **`characterStore.bulkRemoveGear()`** — Blacksmith bypass fix:
     - Currently sets `gold: character.gold + adjustedGold` directly at line 727 (used by smelting/blacksmith operations). Refactor to call `updateGold(adjustedGold)` after the inventory update `set()`, similar to the `handleVictory()` pattern.
   - **`characterStore.updateGold()`** — Pure state update only:
     - Updates `character.gold` as before
     - Adds `incrementLifetimeStat('goldEarned', Math.max(0, delta))` when `delta > 0`
     - **No** achievement checks inside the store — returns void, callers handle checks
   - **Gold tracking approach: Caller-side (Option 2).** Rather than centralizing all gold mutations through `updateGold()`, each call site tracks gold independently. The 3 call sites that bypass `updateGold()` (`handleVictory`, `handleDefeat`, `bulkRemoveGear`) are refactored above to call `updateGold()` first, which handles `lifetimeStats.goldEarned` via the positive-delta guard. Achievement checks remain caller-side after the `updateGold()` call.
   - **Dungeon tracking:**
     - `exitDungeon()` increments lifetime stats inside the store (consistent with existing `logActivity()` cross-store call):
       - `dungeonAttempts` — Increment on every exit where `visitedRooms.size > 0`
       - `dungeonsCompleted` — Increment only when `bossDefeated === true`

     > [!CAUTION]
     > **`exitDungeon()` resets `bossDefeated` to `false` during its `set()` call (line 254).** The `bossDefeated` check and stat increment MUST happen BEFORE the reset. Since lifetime stat increments go inside `exitDungeon()` (before the `set()` call), this is handled correctly. However, the **caller-side achievement check** needs the `dungeonsCompleted` value from AFTER `exitDungeon()` runs — which is fine because `incrementLifetimeStat` updates the character store, not the dungeon store.

   - **Caller-side dungeon achievement checks — 3 exit paths in `DungeonView.tsx`:**
     All 3 paths call `exitDungeon()` which handles stat increments internally. The caller then reads `lifetimeStats.dungeonsCompleted` from `characterStore` and checks the `dungeons-3` achievement.
     | Exit path | Location | Description |
     |-----------|----------|-------------|
     | `handleExit()` | Line 1125 | Header "Exit" button (flee — dungeonAttempts only) |
     | `handleExitConfirm()` | Line 1277 | Portal → "Complete Dungeon" (may include dungeonsCompleted if boss defeated) |
     | `onLeave` (death modal) | Line 1226 | Defeat → "Leave Dungeon" (dungeonAttempts only) |

     After each path calls `exitDungeon()`, add:
     ```typescript
     // Caller-side, after exitDungeon():
     const char = useCharacterStore.getState().character;
     if (char) {
         const completed = char.lifetimeStats.dungeonsCompleted;
         // Check dungeons-3 achievement + grant title if newly unlocked
     }
     ```
     - The existing `dungeon_complete` activity event stays as-is (tracks all runs for the Progress Dashboard activity log).
     - **Dashboard metric:** "Completion Rate: dungeonsCompleted / dungeonAttempts" — available for the Progress Dashboard to display.
   - **Gold achievement threshold guard (#5):** To avoid checking `gold-1000` on every single gold update (dozens of calls for purchases, sales, loot), use a threshold guard:
     ```typescript
     // Caller-side, after updateGold():
     const stats = character.lifetimeStats;
     const oldGold = stats.goldEarned - delta; // approximate pre-update value
     if (oldGold < 1000 && stats.goldEarned >= 1000) {
         // Check gold-1000 achievement + grant title
     }
     ```
     This turns O(n) per gold update into O(1) — the check only fires when crossing the threshold.
   - Quest completion handler — `incrementLifetimeStat('questsCompleted', 1)`

5. **Migrate `quest_count` trigger achievements to use `lifetimeStats` (single source of truth)**
   - **Problem:** Quest completion count exists in two places: the `quest_count` trigger's runtime count (scanning `activityHistory`) AND `lifetimeStats.questsCompleted`. If they get out of sync, achievements behave inconsistently.
   - **Fix:** Modify `checkQuestCountAchievements()` in `AchievementService.ts` to read `lifetimeStats.questsCompleted` instead of scanning `activityHistory`. This makes `lifetimeStats` the single authoritative source for quest count checks.
   - Update the function signature to accept `lifetimeStats.questsCompleted` (a number) instead of the full activity history array.
   - **Explicit wiring target — `useXPAward.ts:449`:** This line has an existing `TODO: track total quest count` comment and passes a hardcoded `1` to `checkQuestCountAchievements()`. This causes quest-count achievements to re-trigger on every completion. Replace `1` with `lifetimeStats.questsCompleted` from the character store. Same fix at line ~455 for `checkCategoryCountAchievements()`.
   - **Impact:** The `quest_count` trigger type in the `Achievement` interface stays — it still describes *what* the achievement checks. The change is *how* it checks (O(1) counter lookup instead of O(n) array scan).

> [!IMPORTANT]
> The `manual` trigger achievements (dungeons, gold, battles, bosses) check against `lifetimeStats` counters for O(1) lookups. No `activityHistory` scanning required. With this migration, `quest_count` achievements also use the same O(1) pattern.

6. **Fix null vault instantiations in `QuestActionsService.ts`**
   - **Problem:** `QuestActionsService.ts` line 183 instantiates `new AchievementService(null as any)` with a comment "vault not needed for checks." This is functional today but fragile — title grants via `grantedTitleId` will be wired at these call sites, and future `AchievementService` methods may need vault access.
   - **Fix:** Pass the actual `vault` reference instead of `null as any`. The `moveQuest()` function already receives `vault: Vault` as its first parameter — thread it through to `new AchievementService(vault)` at line 183.
   - **Same pattern applies** to any other `new AchievementService(null as any)` instances found during implementation.

#### Tech Debt:
- None — `lifetimeStats` counters handle all tracking needs

---

## Phase 2.5: Tests — Service Layer ✅ Complete

**Effort:** Medium
**Estimated Time:** 1.5-2 hours
**Goal:** Test TitleService methods, achievement integration, and new achievement checks.
**Prerequisites:** Phase 2
**Coverage Target:** ≥80% line, ≥80% branch
**Test File:** `test/services/TitleService.test.ts`
**Command:** `npx vitest run test/services/TitleService.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

### Key Test Cases

**TitleService Core:**
- `grantTitle()` adds title to character's `unlockedTitles`
- `grantTitle()` with already-unlocked title is a no-op
- `equipTitle()` sets `equippedTitle` on character
- `equipTitle(null)` clears equipped title
- `getUnlockedTitles()` returns correct Title objects, ignores invalid IDs
- `getEquippedTitle()` returns null when no title equipped

**PowerUp Lifecycle:**
- `createTitlePowerUps()` returns empty array for cosmetic titles
- `createTitlePowerUps()` returns valid `ActivePowerUp[]` for buff titles
- Power-ups have `triggeredBy: 'title'`, `expiresAt: null`
- Equipping a buff title calls `removePowerUpsByTrigger('title')` then `addPowerUps()` with title power-up(s)
- Unequipping removes all power-ups with `triggeredBy: 'title'`
- Swapping titles removes old title power-ups and adds new ones
- "The Focused" (Warrior) creates two entries: STR +3% and CON +3%
- "The Relentless" creates two entries: all_stats_boost +1 and xp_multiplier +2%

**Caller-Side Achievement Integration:**
- After `checkQuestCountAchievements()` returns, caller checks `grantedTitleId` on unlocked achievements
- Title grant is called for each achievement with a `grantedTitleId`
- Unlocking achievement without `grantedTitleId` does not affect titles
- `AchievementService` itself is NOT modified (remains stateless)

**Lifetime Stats + Manual Achievements:**
- `incrementLifetimeStat('battlesWon', 1)` correctly increments counter
- `battles-25` achievement unlocks when `lifetimeStats.battlesWon >= 25`
- `gold-1000` achievement unlocks when `lifetimeStats.goldEarned >= 1000`

#### Tech Debt:
- None expected

---

## Phase 3: Buff Engine (PowerUp Integration)

**Effort:** Medium
**Estimated Time:** 1.5-2 hours
**Goal:** Fix pre-existing `deriveCombatStats()` bug + ensure title buffs flow through existing PowerUp infrastructure correctly.
**Prerequisites:** Phase 2

### Tasks

> [!TIP]
> Most effect types are already consumed by the relevant calculation paths. This phase handles the gap where `crit_chance` is NOT consumed by `deriveCombatStats()`, corrects the boss damage hook point, and verifies all other effect types.

1. **Fix `deriveCombatStats()` to integrate power-up stat boosts (pre-existing bug fix)**

> [!WARNING]
> This is a **critical pre-existing bug** affecting all stat-boosting power-ups and consumables, not just titles. `deriveCombatStats()` has zero references to `activePowerUps`. The following are currently broken in combat:
> - Level Up boost (`all_stats_boost: +3`) — shows on character sheet, zero combat impact
> - Iron Grip (`stat_percent_boost: +10% STR`), Cat's Grace (+10% DEX), Arcane Insight (+10% INT), Inner Peace (+10% WIS), Stone Skin (+10% CON) — all zero combat impact
> - Lucky Star (`crit_chance: +10`) — zero combat crit impact

   - **Add power-up stat integration to `computeStat()` at line 174** in `CombatService.ts`:
     ```typescript
     // Before:
     const computeStat = (stat: keyof CharacterStats): number => {
         const flat = (character.baseStats[stat] || 0) +
             (character.statBonuses?.[stat] || 0) +
             (gearStats.statBonuses[stat] || 0);
         const accMult = getStatMultiplier(gear, stat);
         return Math.floor(flat * (1 + accMult));
     };
      // After:
      const activePowerUps = expirePowerUps(character.activePowerUps || []);
      const computeStat = (stat: keyof CharacterStats): number => {
          const flat = (character.baseStats[stat] || 0) +
              (character.statBonuses?.[stat] || 0) +
              (gearStats.statBonuses[stat] || 0) +
              getStatBoostFromPowerUps(activePowerUps, stat);  // handles both stat_boost AND all_stats_boost
          const accMult = getStatMultiplier(gear, stat);
          const pctMult = getPercentStatBoostFromPowerUps(activePowerUps, stat);  // handles both stat_percent_boost AND all_stats_percent_boost
          return Math.floor(flat * (1 + accMult + pctMult));
      };
      ```

   > [!WARNING]
   > Do NOT add a separate `getAllStatsBoostFromPowerUps()` helper — `getStatBoostFromPowerUps()` already sums both `stat_boost` AND `all_stats_boost` internally (see `PowerUpService.ts:828-832`). Adding a separate call would **double-count** every `all_stats_boost` effect.

   - **Add `getCritFromPowerUps()` to crit calculation at line 218:**
     ```typescript
     const critChance = (totalStats.dexterity * CRIT_PER_DEX) + gearStats.critChance + getCombatBonus(gear, 'crit') + getCritFromPowerUps(activePowerUps);
     ```
   - **New helper in `PowerUpService.ts`:** `getCritFromPowerUps(powerUps: ActivePowerUp[]): number` — sums `crit_chance` effect values from active power-ups. Note: `crit_chance` already exists in the `PowerUpEffect` union type at `Character.ts:319` — no type changes needed.
   - **No other new helpers needed** — existing `getStatBoostFromPowerUps()` and `getPercentStatBoostFromPowerUps()` already handle all stat boost types.
   - **Imports to add to `CombatService.ts`:** `expirePowerUps`, `getStatBoostFromPowerUps`, `getPercentStatBoostFromPowerUps`, `getCritFromPowerUps` from `PowerUpService`

2. **Handle "The Focused" dual primary stat resolution**
   - When equipping "The Focused," resolve the character's **both** primary class stats from `ClassInfo.primaryStats` tuple:
     - Warrior → STR + CON, Paladin → STR + WIS, Technomancer → INT + DEX, Scholar → INT + WIS, Rogue → DEX + CHA, Cleric → WIS + CON, Bard → CHA + DEX
   - `createTitlePowerUps()` builds **two** `stat_percent_boost` entries, one per primary stat

3. **Handle "Slayer of the Void" boss damage (direct check)**
   - **No new `PowerUpEffect` type needed** — avoids expanding the `PowerUpEffect` union
   - **Hook point 1:** `BattleService.calculatePlayerDamage()` (private function, ~line 527). This function has access to `character` (via `useCharacterStore.getState()`) and `monster` (with `tier`). Add a direct check after final damage is computed: if `character.equippedTitle === 'slayer-of-the-void'` and `(monster.tier === 'boss' || monster.tier === 'raid_boss')`, apply `finalDamage = Math.floor(finalDamage * 1.05)`. Place after the crit damage bonus block (~line 618), before the return statement.
   - **Hook point 2:** `BattleService.executePlayerSkill()` (~line 1342). This function has its own damage pipeline via `executeSkill()` which returns `result.damage`. After the damage is computed and before `updateMonsterHP()`, apply the same boss damage check.
   - Both hook points use the `monster.tier` check (not `isBoss`, which is not available on `BattleMonster`)
   - Simple 3-line `if` check in two locations

4. **Handle "The Relentless" dual buff**
   - This title grants two effects (+1 all stats AND +2% XP)
   - `createTitlePowerUps()` returns **two** `ActivePowerUp` entries for this title
   - Each entry gets a unique ID: `title-buff-{titleId}-0`, `title-buff-{titleId}-1`

5. **Verify title power-ups are safe from expiration sweep**
   - Title power-ups use unique IDs: `title-buff-{titleId}` (or `title-buff-{titleId}-{index}` for multi-buff)
   - `expirePowerUps()` already handles this correctly — line 787 (`if (powerUp.expiresAt === null) return true;`) skips entries with null expiration
   - **No code change needed** — just a test to confirm existing behavior

6. **Logging compliance**
   - All new functions in `TitleService.ts` and modified code in `CombatService.ts` / `BattleService.ts` must use `console.warn` / `console.error` only — no `console.log()`. This applies to all new services in the entire plan (Obsidian plugin guideline requirement).
   - **Note:** 4 existing files contain `console.log` calls (`settings.ts`, `FolderWatchService.ts`, `ScrivenersQuillModal.ts`, `AITestLabModal.ts`). These are pre-existing tech debt and out of scope for this plan.

#### Tech Debt:
- "Slayer of the Void" boss damage check is hardcoded to a specific title ID in two locations (`calculatePlayerDamage` and `executePlayerSkill`). If more boss-damage titles are added later, refactor to a `PowerUpEffect` type at that point.

---

## Phase 3.5: Tests — Buff Engine

**Effort:** Medium
**Estimated Time:** 1-1.5 hours
**Goal:** Verify title buffs flow through all calculation paths correctly.
**Prerequisites:** Phase 3
**Coverage Target:** ≥80% line, ≥80% branch
**Test File:** `test/services/TitleBuffIntegration.test.ts`
**Command:** `npx vitest run test/services/TitleBuffIntegration.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

### Key Test Cases

**XP Integration:**
- Character with "The Scholar" equipped earns 3% more XP than without
- Character with "The Relentless" equipped earns 2% more XP
- Title XP buff stacks additively with class bonus and power-up multipliers

**Stat Integration:**
- Character with "The Tempered" has +1 to all 6 stats
- Character with "The Focused" (Warrior) has +3% STR AND +3% CON (both primary stats)
- Character with "The Focused" (Rogue) has +3% DEX AND +3% CHA
- Title stat buffs stack with gear and power-up stat boosts

**Combat Integration:**
- Character with "Eagle Eye" has +2% crit chance in `deriveCombatStats()`
- Character with `equippedTitle: 'slayer-of-the-void'` deals +5% damage to bosses in both basic attacks (via `calculatePlayerDamage()`) and skills (via `executePlayerSkill()`)
- Boss damage bonus does NOT apply to non-boss enemies
- Boss damage bonus uses `monster.tier === 'boss' || monster.tier === 'raid_boss'` check
- Boss damage bonus does NOT go through `PowerUpEffect` system

**Gold Integration:**
- Character with "Fortune's Favorite" gold multiplier is applied

**Compound Buff:**
- "The Relentless" correctly applies both +1 all stats AND +2% XP
- Both effects show as separate buff icons

**Expiration Safety:**
- `expirePowerUps()` does not remove title power-ups (they have `expiresAt: null`)
- Equipping new title correctly replaces old title power-ups

#### Tech Debt:
- None expected

---

## Phase 4: UI — Character Identity & Title Selection Modal

**Effort:** Medium
**Estimated Time:** 2-2.5 hours
**Goal:** Display equipped title on character sheet, create title selection modal.
**Prerequisites:** Phase 2
**Note:** This phase can be worked on in parallel with Phase 3 since it only depends on the store actions from Phase 2.

> [!NOTE]
> **Pre-Phase 3 buff limitations:** XP buffs (Scholar, Relentless), gold buffs (Fortune's Favorite), and all_stats buffs (Tempered, Relentless) work immediately because those calculation paths already read `activePowerUps`. Crit chance (Eagle Eye) and boss damage (Slayer of the Void) **will not affect combat** until Phase 3 fixes `deriveCombatStats()`. Equipping these titles pre-Phase 3 still shows the buff icon and title — the combat effect is just inactive.

### Tasks

1. **Update `src/components/character/CharacterIdentity.tsx`**
   - Add `equippedTitle` prop (resolved `Title | null`)
   - Render title inline after character name: `Name — ⟨ Title ⟩`
   - Apply rarity CSS class: `qb-title-common`, `qb-title-rare`, `qb-title-epic`, `qb-title-legendary`
   - If no title equipped, render `⟨ No Title ⟩` in muted style with tooltip "Click to select a title"
   - Wrap title in clickable container that opens `TitleSelectionModal`
   - **Mobile:** Title wraps below the character name on narrow screens (not truncated)

2. **Create `src/modals/TitleSelectionModal.ts`**
   - Extends Obsidian `Modal`
   - Layout:
     ```
     ======================================
     🏷️ Select title
     ======================================
     ○ None
     ──────────────────────────────────────
     UNLOCKED (3)
     ──────────────────────────────────────
     ● The Novice                  COMMON
       "Every legend begins somewhere."
     ──────────────────────────────────────
     ○ Questrunner                   RARE
       "10 quests down, a thousand to go."
     ──────────────────────────────────────
     ○ The Scholar                   RARE
       +3% XP from all sources
       "Knowledge is the greatest weapon."
     ======================================
     LOCKED (9)
     ======================================
     🔒 Streak Keeper                RARE
        Maintain a 7-day streak
     ──────────────────────────────────────
     🔒 Slayer of the Void      LEGENDARY
        Defeat 10 bosses
     ======================================
     ```
   - Radio-button style selection (click to equip, click active to unequip)
   - Locked titles shown greyed out with unlock condition
   - Buff titles show their buff label below the description
   - Close modal on selection
   - Uses DOM API (`createEl`, `createDiv`) — no `innerHTML`

3. **Wire modal opening**
   - Add `onTitleClick?: () => void` callback prop to `CharacterIdentity` (component should NOT know about Obsidian modals)
   - Parent component (`CharacterPage` / `CharacterSidebar`) handles the callback: `new TitleSelectionModal(app, character, onSave).open()`
   - Save is handled automatically via the existing Zustand→`saveData()` subscription in `main.ts` — no manual save call needed in the modal's onClose

> [!NOTE]
> **CSS-only phase (Phase 6) handles all styling.** This phase focuses on structure and functionality. Use basic Obsidian classes and minimal inline structure. **Do not introduce any new inline styles** — existing inline styles in `CharacterIdentity.tsx` (e.g., dynamic `primaryColor` border) are pre-existing tech debt that can coexist with the new title CSS classes.

> [!WARNING]
> **Title selection is disabled during combat.** The `onTitleClick` handler checks `useBattleStore.getState().state !== 'IDLE'` before opening the modal. If in combat, shows a `Notice("Cannot change titles during combat")` instead. This prevents mid-combat stat changes from title power-up swaps.

#### Tech Debt:
- No search/filter in the modal for now — with 12 titles it's not needed. Add if registry grows past ~20.
- **Callback pattern inconsistency:** `CharacterIdentity` uses `onTitleClick` callback (option b) because it's rendered by both `CharacterPage` (has `app`) and `CharacterSidebar` (no `app`). Other components like `SidebarQuests` and `FullKanban` open Obsidian modals directly with `app` (option a). A future refactoring pass should standardize all components on the callback pattern so React components never depend on Obsidian's `App` object.

---

## Phase 4.5: Tests — UI

**Effort:** Small
**Estimated Time:** 1 hour
**Goal:** Test TitleSelectionModal logic and CharacterIdentity title rendering.
**Prerequisites:** Phase 4
**Coverage Target:** ≥80% line, ≥80% branch
**Test File:** `test/modals/TitleSelectionModal.test.ts`
**Command:** `npx vitest run test/modals/TitleSelectionModal.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

### Key Test Cases

**Modal Logic:**
- Modal displays all unlocked titles with correct rarity labels
- Modal displays locked titles greyed out with unlock conditions
- Selecting a title calls `TitleService.equipTitle()` with correct ID
- Clicking active title unequips (calls `equipTitle(null)`)
- "None" option clears equipped title
- Buff titles show their buff label below description
- Modal uses DOM API only (no `innerHTML`)

#### Tech Debt:
- None expected

---

## Phase 5: UI — Progress Dashboard Report Generator

**Effort:** Medium
**Estimated Time:** 2-2.5 hours
**Goal:** Add character export/report generation to the Progress Dashboard with date-range filtering.
**Prerequisites:** Phase 2

### Tasks

1. **Create `src/services/CharacterExportService.ts`**
   - `generateCharacterSummary(character: Character): string` — Produces the character header markdown: name, title, level, class, stats, active buffs, equipped gear
   - `generateProgressReport(character: Character, stats: ProgressStats, dateRange: DateRange): string` — Combines character summary with filtered activity stats (quests, bounties, dungeons, XP, gold, best day)
   - `copyToClipboard(text: string): void` — Uses `navigator.clipboard.writeText()` with `try/catch`. On failure, falls back to showing the text in an Obsidian modal with a "Select All" hint so the user can manually copy. This handles mobile WebView environments where `navigator.clipboard` may require user-gesture context. No `document.execCommand('copy')` fallback — it's deprecated.
   - `createExportNote(app: App, character: Character, content: string, exportFolder: string): Promise<void>` — Validates that the export folder exists via `app.vault.getFolderByPath(normalizePath(exportFolder))` before writing. If the folder doesn't exist, falls back to `settings.questFolder` and shows a warning `Notice`. Creates `{CharacterName} Export {YYYY-MM-DD} {HHmm}.md` using `vault.create()` with `normalizePath()`. The time component prevents same-day collisions. Additionally, wraps `vault.create()` with a collision fallback:
     ```typescript
     let filePath = normalizePath(`${folder}/${baseName}.md`);
     if (app.vault.getAbstractFileByPath(filePath)) {
         let i = 1;
         while (app.vault.getAbstractFileByPath(normalizePath(`${folder}/${baseName} (${i}).md`))) i++;
         filePath = normalizePath(`${folder}/${baseName} (${i}).md`);
     }
     await app.vault.create(filePath, content);
     ```

2. **Update `src/modals/ProgressDashboardModal.ts`**
   - Add export buttons to the header area:
     - 📋 "Copy Report" button → `generateProgressReport()` + `copyToClipboard()`
     - 💾 "Save to Vault" button → `generateProgressReport()` + `createExportNote()`
   - Both use the currently selected date range from the dashboard's existing date picker
   - Reuse existing `ProgressStatsService.getProgressStatsForRange()` for the filtered data

3. **Fix custom date picker UX**
   - **Bug:** Custom date inputs currently cast to `'all_time'` (line 138), so clicking "All Time" button overwrites custom dates and they stop working.
   - **Fix:**
     - Add `'custom'` to the `DatePreset` union type in `ProgressStatsService.ts`. When `preset === 'custom'`, the code should **bypass** `getDatePreset()` entirely and call `getProgressStatsForRange()` directly with the custom start/end dates. Do NOT add a `case 'custom':` to the `switch` in `getDatePreset()` — it would need arbitrary start/end dates as arguments.
     - Add a **"Custom range"** button to the preset row via `getAllPresets()`. When clicked, shows the start/end date inputs below the preset row and enables them for editing.
     - **Date inputs rendered as disabled/readonly when a preset is active** — populated with the preset's resolved start/end dates for visual context. When "Custom range" is selected, re-enable for manual editing.
     - When custom date inputs change, set `this.preset = 'custom'` (not `'all_time'`)
     - "All Time" button works as a real preset — overrides custom dates with full range and disables the date inputs
   - ~30 minutes of work

4. **Add `exportFolder` setting**
   - Add `exportFolder: string` field to settings (default: `settings.questFolder`)
   - Add folder autocomplete input in the collapsed path settings section at the top of `src/settings.ts` (note: settings UI is in `settings.ts`, not `SettingsTab.ts` — that file does not exist)
   - Settings label: "Export folder" / description: "Folder where character exports are saved"

5. **Register command**
   - Add `quest-board:export-character` command in `main.ts`
   - Opens the Progress Dashboard modal (reuses existing infrastructure) with export buttons visible

> [!NOTE]
> Character page clipboard button is **deferred** to a future phase. All export functionality lives on the Progress Dashboard for now.

#### Tech Debt:
- Export format is v1 — may want to add more sections (achievements, activity breakdown) later

---

## Phase 5.5: Tests — Export

**Effort:** Small
**Estimated Time:** 1 hour
**Goal:** Verify export generates correct content.
**Prerequisites:** Phase 5
**Coverage Target:** ≥80% line, ≥80% branch
**Test File:** `test/services/CharacterExportService.test.ts`
**Command:** `npx vitest run test/services/CharacterExportService.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

### Key Test Cases

- Character summary includes character name and equipped title
- Character summary includes "No title equipped" when no title
- Character summary includes level, class, secondary class
- Character summary includes all 6 stats with correct values
- Character summary includes active buff titles with labels
- Character summary includes equipped gear names
- Character summary handles null/empty gear gracefully
- Progress report includes date range label
- Progress report includes quests completed, bounties won, dungeons completed
- Progress report includes total XP and gold for the period
- Export file naming uses `{CharacterName} Export {YYYY-MM-DD} {HHmm}.md` format with collision counter fallback
- Clipboard try/catch error handling when `navigator.clipboard.writeText()` fails (shows modal fallback with "Select All" hint on mobile, no deprecated `execCommand` fallback)

#### Tech Debt:
- None expected

---

## Phase 6: CSS & Polish

**Effort:** Small
**Estimated Time:** 1-1.5 hours
**Goal:** Style title display and selection modal.
**Prerequisites:** Phase 4
**Note:** CSS-only phase — exempt from test phase requirement.

### Tasks

1. **Update `src/styles/character.css`**
   - `.qb-title-inline` — Inline title after name, cursor pointer
   - `.qb-title-common` — `color: var(--text-muted)`
   - `.qb-title-rare` — `color: var(--color-blue)` with subtle `text-shadow: 0 0 8px rgba(var(--color-blue-rgb), 0.3)`
   - `.qb-title-epic` — `color: var(--color-purple)` with `text-shadow: 0 0 10px rgba(var(--color-purple-rgb), 0.4)`
   - `.qb-title-legendary` — Gold gradient with `background-clip: text` and `-webkit-background-clip: text` (both standard and vendor)
   - **Color source:** `--color-blue`, `--color-purple`, and their `-rgb` variants are [official Obsidian extended color variables](https://docs.obsidian.md/Reference/CSS+variables/Foundations/Colors) — all themes define them. No hardcoded colors or fallbacks needed.
   - `.qb-title-brackets` — Angle brackets in muted color
   - `.qb-title-empty` — Muted italic for "No Title"
   - Export button styles (small, unobtrusive clipboard icon)

2. **Update `src/styles/modals.css`**
   - `.qb-title-modal` — Modal container
   - `.qb-title-row` — Title list row with hover highlight
   - `.qb-title-row-selected` — Active selection indicator
   - `.qb-title-row-locked` — Greyed out, reduced opacity
   - `.qb-title-rarity-badge` — Small rarity label. Source text uses sentence case (`Common`, `Rare`, `Epic`, `Legendary`) — styled as uppercase via `text-transform: uppercase` on this class. This satisfies the Obsidian "sentence case in UI text" guideline while displaying as uppercase visually.
   - `.qb-title-buff-label` — Buff description text below title name
   - Section headers for "Unlocked" and "Locked" groups

3. **Mobile considerations**
   - Title wraps below character name on narrow screens (not truncated)
   - Modal scrollable on mobile
   - Touch targets ≥44px for title rows
   - No hover-dependent interactions (click/tap only)

#### Tech Debt:
- None — legendary gradient uses plugin-scoped CSS custom properties (`--qb-title-legendary-start: #ffd700`, `--qb-title-legendary-end: #ffaa00`) defaulting to gold. Theme authors can override these variables without the plugin using hardcoded colors directly.

---

## Plan Summary

| Phase | Title | Effort | Depends On | Est. Time |
|-------|-------|--------|------------|-----------|
| 0 | Migration Chain Fix (Pre-requisite) | Small | — | 30m |
| 0.5 | Tests: Migration Chain Fix | Small | Phase 0 | 30-45m |
| 1 | Data Models & Schema Migration | Medium | Phase 0 | 1.5-2h |
| 1.5 | Tests: Data Layer | Small | Phase 1 | 1-1.5h |
| 2 | Title Service & Achievement Integration | Medium | Phase 1 | 1.5-2h |
| 2.5 | Tests: Service Layer | Medium | Phase 2 | 1.5-2h |
| 3 | Buff Engine (PowerUp Integration + `deriveCombatStats` fix) | Medium | Phase 2 | 1.5-2h |
| 3.5 | Tests: Buff Engine | Medium | Phase 3 | 1-1.5h |
| 4 | UI: Character Identity & Title Modal | Medium | Phase 2 | 2-2.5h |
| 4.5 | Tests: UI | Small | Phase 4 | 1h |
| 5 | UI: Progress Dashboard Report Generator | Medium | Phase 2 | 2-2.5h |
| 5.5 | Tests: Export | Small | Phase 5 | 1h |
| 6 | CSS & Polish | Small | Phase 4 | 1-1.5h |

**Total Estimated Time:** ~16-21 hours across 7-9 sessions

**Execution Order:**
- Phase 0 → Phase 0.5 (migration fix + verification)
- Phases 1 → 1.5 → 2 → 2.5 (strictly sequential)
- After Phase 2: Phases 3, 4, and 5 can be done in **any order** (all depend only on Phase 2)
- Phase 3.5 after Phase 3
- Phase 4.5 after Phase 4
- Phase 5.5 after Phase 5
- Phase 6 after Phase 4

---

## Verification Checklist

### Automated Tests

| Test | Expected | Status |
|------|----------|--------|
| Title data integrity (all 12 titles valid) | Pass | |
| Achievement→title reference integrity | Pass | |
| Schema v6→v7 migration + lifetimeStats backfill | Pass, defaults applied | |
| Migration chain: v5 character flows through all migrations to v7 | Pass | |
| Migration chain: v6 character reaches v6→v7 migration | Pass | |
| Store: simple setter actions | Pass | |
| TitleService: grant, equip, unequip | Pass | |
| Caller-side achievement integration | Pass | |
| Lifetime stat increment + manual achievement check | Pass | |
| Buff: XP multiplier flows through | Pass, ±0.01 tolerance | |
| Buff: All stats boost applies | Pass, +1 each | |
| Buff: Crit chance applies | Pass, +2% | |
| Buff: Gold multiplier applies | Pass, +5% | |
| Buff: "The Focused" boosts both primary stats | Pass | |
| Boss damage (direct check, not PowerUpEffect) | Pass, +5% to bosses only | |
| Buff: Compound buff (The Relentless) | Pass, both effects | |
| `expirePowerUps()` skips title power-ups | Pass | |
| TitleSelectionModal logic + DOM API | Pass | |
| Export: summary + progress report content | Pass | |
| Clipboard error handling (try/catch, no execCommand) | Pass | |

### Manual Testing

| Test | Expected | Status |
|------|----------|--------|
| Build passes (`npm run build`) | No errors | |
| Deploy to test vault (`npm run deploy:test`) | Files copied | |
| Existing character loads without crash | v7 migration runs, lifetimeStats backfilled | |
| "The Novice" auto-unlocked | Shows in title list | |
| Click title area → modal opens | Modal displays | |
| Equip title → name updates | Title appears inline | |
| Equip buff title → buff icon appears | In buff row | |
| Unequip title → cleared | "No Title" shown | |
| Unlock achievement with title → title unlocks | Notice shown | |
| Progress Dashboard → export buttons work | Both copy + save | |
| Export note created in configured folder | Timestamped `.md` file | |
| Export folder setting with autocomplete | Works in settings panel | |
| Mobile: title wraps below name | No truncation | |
| Mobile: modal scrolls, tap targets ≥44px | Usable on mobile | |

---

## File Change Summary

| Phase | File | Action | Purpose |
|-------|------|--------|---------|
| 0 | `src/models/Character.ts` | [MODIFY] | Fix migration chain: `>= N` guards → chain-forward calls in v2→v3, v3→v4, v5→v6 + stub v6→v7 |
| 0.5 | `test/models/migrationChain.test.ts` | [NEW] | Migration chain forward guards + full flow + regression tests |
| 1 | `src/models/Title.ts` | [NEW] | Title interface, helpers |
| 1 | `src/data/titles.ts` | [NEW] | 12 title definitions |
| 1 | `src/models/Achievement.ts` | [MODIFY] | Add `grantedTitleId` |
| 1 | `src/data/achievements.ts` | [MODIFY] | 7 new achievements, title mappings |
| 1 | `src/models/Character.ts` | [MODIFY] | Schema v7, `equippedTitle`, `unlockedTitles`, `LifetimeStats`, replace stub v6→v7 with real migration, update standalone `createCharacter()` |
| 1 | `src/store/characterStore.ts` | [MODIFY] | Simple setters: `setEquippedTitle`, `addUnlockedTitle`, `incrementLifetimeStat` + update store `createCharacter()` action |
| 1.5 | `test/models/title.test.ts` | [NEW] | Data integrity + migration + backfill tests |
| 1.5 | `test/store/characterStore.test.ts` | [MODIFY] | Migration + store action tests |
| 2 | `src/services/TitleService.ts` | [NEW] | Title business logic + PowerUp lifecycle |
| 2 | `src/hooks/useXPAward.ts` | [MODIFY] | Caller-side title grant hooks (level, category, quest count achievements) |
| 2 | `src/services/QuestActionsService.ts` | [MODIFY] | Caller-side title grant hook (streak achievements) |
| 2 | `src/services/BattleService.ts` | [MODIFY] | Lifetime stat increments (battlesWon, bossesDefeated) + manual achievement checks + `handleVictory()` gold→`updateGold()` refactor + `handleDefeat()` gold consistency refactor |
| 2 | `src/store/characterStore.ts` | [MODIFY] | `updateGold()`: add `incrementLifetimeStat('goldEarned')` (pure state only) + `bulkRemoveGear()` gold→`updateGold()` refactor |
| 2 | `src/services/AchievementService.ts` | [MODIFY] | `checkQuestCountAchievements()` signature change to accept `lifetimeStats.questsCompleted` |
| 2 | `src/store/dungeonStore.ts` | [MODIFY] | `exitDungeon()`: increment `dungeonAttempts` (always) + `dungeonsCompleted` (boss defeated only) |
| 2.5 | `test/services/TitleService.test.ts` | [NEW] | Service layer tests |
| 3 | `src/services/CombatService.ts` | [MODIFY] | Add `getCritFromPowerUps()` integration into `deriveCombatStats()` |
| 3 | `src/services/PowerUpService.ts` | [MODIFY] | Add `getCritFromPowerUps()` helper |
| 3 | `src/services/BattleService.ts` | [MODIFY] | Direct `slayer-of-the-void` boss damage check in `calculatePlayerDamage()` and `executePlayerSkill()` |
| 3.5 | `test/services/TitleBuffIntegration.test.ts` | [NEW] | Buff calculation tests |
| 4 | `src/components/character/CharacterIdentity.tsx` | [MODIFY] | Title display + click handler + mobile wrap |
| 4 | `src/modals/TitleSelectionModal.ts` | [NEW] | Title picker modal |
| 4.5 | `test/modals/TitleSelectionModal.test.ts` | [NEW] | Modal logic tests |
| 5 | `src/services/CharacterExportService.ts` | [NEW] | Report generator + clipboard + vault note |
| 5 | `src/modals/ProgressDashboardModal.ts` | [MODIFY] | Export buttons + custom date picker fix (disabled/readonly inputs when preset active) |
| 5 | `src/services/ProgressStatsService.ts` | [MODIFY] | Add `'custom'` to `DatePreset` union type |
| 5 | `src/settings.ts` | [MODIFY] | Add `exportFolder` setting + folder autocomplete input |
| 5 | `main.ts` | [MODIFY] | Register export command |
| 5.5 | `test/services/CharacterExportService.test.ts` | [NEW] | Export + report tests |
| 6 | `src/styles/character.css` | [MODIFY] | Title display styles + mobile wrap + legenday CSS custom properties |
| 6 | `src/styles/modals.css` | [MODIFY] | Title modal styles + rarity badge text-transform |

---

## Key References

| Reference | Location | Notes |
|-----------|----------|-------|
| Character model + schema migrations | `src/models/Character.ts` | Schema v6, migration chain pattern |
| PowerUp effect types | `src/models/Character.ts:312` | `PowerUpEffect` union type (NOT modified for boss damage) |
| Achievement model + service | `src/models/Achievement.ts`, `src/services/AchievementService.ts` | Trigger types, stateless check methods |
| Achievement data | `src/data/achievements.ts` | Existing achievements |
| PowerUp service + expiration | `src/services/PowerUpService.ts` | `expirePowerUps()` already safe for null expiration |
| CharacterIdentity component | `src/components/character/CharacterIdentity.tsx` | Name/level/buff display |
| Progress Dashboard modal | `src/modals/ProgressDashboardModal.ts` | Report generator + export location |
| Progress Stats Service | `src/services/ProgressStatsService.ts` | Date ranges, stats calculation |
| XP calculation | `src/services/XPSystem.ts` | `calculateXPWithBonus()` |
| Stats calculation | `src/services/StatsService.ts` | `getTotalStat()` |
| Combat stats derivation | `src/services/CombatService.ts` | `deriveCombatStats()` |
| Battle damage calculation | `src/services/BattleService.ts` | `calculatePlayerDamage()` and `executePlayerSkill()` — Slayer of the Void boss damage check goes in both |
| Accessory effect pattern | `src/services/AccessoryEffectService.ts` | Pure function pattern reference |
| CSS modules | `src/styles/character.css`, `src/styles/modals.css` | Edit these, not root `styles.css` |
| Obsidian plugin guidelines | `.agent/rules/obsidian-plugin-guidelines.md` | Security, API, CSS rules |

---

## Migration Strategy

**Automatic migration on load.** When the character store loads a character with `schemaVersion < 7`:
1. Entry point `migrateCharacterV1toV2()` is called from `characterStore.ts:217`
2. **Phase 0 fix:** Each migration guard now chains forward instead of returning as-is — a v6 character flows through v1→v2→v3→v4→v5→v6→v7
3. `migrateCharacterV6toV7()` detects `schemaVersion < 7`
4. Adds `equippedTitle: null`, `unlockedTitles: ['the-novice']`
5. Backfills `lifetimeStats` from `activityHistory` (one-time scan)
6. Sets `schemaVersion: 7`
7. Chains to the next migration (future-proofed)

**Rollback:** Delete the title and lifetimeStats fields and revert schema version. No data loss — titles don't modify existing fields.

---

## Security & Validation

- Title IDs validated against `TITLES` registry before equipping (prevents stale/invalid IDs)
- `TitleSelectionModal` uses Obsidian DOM API (`createEl`, `createDiv`) — no `innerHTML`
- Export uses `Vault.create()` for file creation — path validated with `normalizePath()`. Export folder existence validated via `getFolderByPath()` before write, with fallback to quest folder.
- Export checks for existing file before `vault.create()` using `getAbstractFileByPath()` with a counter fallback `(1)`, `(2)`, etc. to guarantee no collision crash
- Clipboard uses `navigator.clipboard.writeText()` with `try/catch` error handling — falls back to an Obsidian modal with "Select All" hint on mobile WebView environments. No deprecated `document.execCommand('copy')` fallback.
- No network requests, no external data, no user-generated title content
- All new services use `console.warn`/`console.error` only — no `console.log()` (Obsidian plugin guideline). 4 existing files have `console.log` (pre-existing tech debt, out of scope).

---

## Rollback Plan

1. Revert all changed files to pre-title state
2. The v7 migration is additive-only (new fields with defaults) — reverting to v6 code will simply ignore the extra fields on next load
3. No existing data is modified or deleted by this feature
4. Active title power-ups use `triggeredBy: 'title'` — easy to filter out if needed
5. `lifetimeStats` counters are additive and independent — safe to drop
