# Title System Implementation Plan

> **Status:** 🔲 TODO
> **Estimated Sessions:** 7-9 (including test phases)
> **Created:** 2026-02-21
> **Last Updated:** 2026-02-22
> **Companion Log:** [[Title System Session Log]]

---

## Table of Contents

1. [Overview](#overview)
2. [Key Design Decisions](#key-design-decisions)
3. [Non-Goals](#non-goals)
4. [Architecture & Data Structures](#architecture--data-structures)
5. [Phase 1: Data Models & Schema Migration](#phase-1-data-models--schema-migration)
6. [Phase 1.5: Tests — Data Layer](#phase-15-tests--data-layer)
7. [Phase 2: Title Service & Achievement Integration](#phase-2-title-service--achievement-integration)
8. [Phase 2.5: Tests — Service Layer](#phase-25-tests--service-layer)
9. [Phase 3: Buff Engine (PowerUp Integration)](#phase-3-buff-engine-powerup-integration)
10. [Phase 3.5: Tests — Buff Engine](#phase-35-tests--buff-engine)
11. [Phase 4: UI — Character Identity & Title Selection Modal](#phase-4-ui--character-identity--title-selection-modal)
12. [Phase 4.5: Tests — UI](#phase-45-tests--ui)
13. [Phase 5: UI — Progress Dashboard Report Generator](#phase-5-ui--progress-dashboard-report-generator)
14. [Phase 5.5: Tests — Export](#phase-55-tests--export)
15. [Phase 6: CSS & Polish](#phase-6-css--polish)
16. [Plan Summary](#plan-summary)
17. [Verification Checklist](#verification-checklist)
18. [File Change Summary](#file-change-summary)
19. [Key References](#key-references)

---

## Overview

### Problem Statement

Players earn achievements but get no lasting cosmetic or mechanical reward beyond the XP bonus at unlock time. There's no visual identity progression — a level 30 character looks the same as a level 5 in terms of "prestige." The title system gives players something to show off and a small mechanical incentive to keep pushing.

### What This Adds

- **Unlockable titles** displayed on the character sheet next to the character name
- **Two categories:** Cosmetic-only titles (prestige/flavor) and buff titles (cosmetic + passive micro-buff)
- **Buff titles** inject as passive `ActivePowerUp` entries, piggybacking on the existing power-up system with zero new calculation wiring
- **Mixed unlock sources:** Most titles unlock via achievements (existing and new), some via level milestones, streaks, and combat stats — all funneled through the achievement pipeline
- **Lifetime stats tracking:** Running counters for all-time gold, battles, bosses, dungeons, quests — used by achievement checks and the analytics dashboard
- **Progress Dashboard report generator:** Export character summary + date-filtered activity stats as clipboard copy or vault note, with preset time ranges (1 week, 4 weeks, 3 months, all time, custom date picker)

### Goals

- Titles feel rewarding and provide a visible sense of progression
- Buff titles are small enough to be fun without being balance-breaking
- System is extensible — easy to add new titles later
- Zero new calculation paths — buff titles use existing `ActivePowerUp` infrastructure

---

## Key Design Decisions

### 1. Titles Piggyback on the PowerUp System

**Decision:** Buff titles inject as `ActivePowerUp` with `triggeredBy: 'title'` and `expiresAt: null` (passive).

**Why:** The power-up system already handles XP multipliers, stat boosts, crit chance, gold multipliers, and all-stats boosts. Every calculation path (XP, combat, stats) already reads active power-ups. By creating title buffs as `ActivePowerUp` entries, we get:
- Automatic buff icon display in the CharacterIdentity buff row
- Automatic pickup by `XPSystem.calculateXPWithBonus()`, `StatsService.getTotalStat()`, `CombatService.deriveCombatStats()`
- Zero new switch statements or injection points

**Tradeoff:** Title buffs show up in the buff row alongside temporary power-ups. This is actually desirable — it makes the title's effect visible.

### 2. All Titles Unlock Through the Achievement Pipeline

**Decision:** Every title is tied to an achievement. For titles that unlock via level milestones or combat stats, we create new achievements with those triggers.

**Why:** The `AchievementService` already handles level, streak, quest count, and category count trigger types. Rather than building a parallel unlock system, we add a `grantedTitleId?: string` field to the `Achievement` interface. When an achievement unlocks and has this field, the title unlocks too. The grant is handled **caller-side** — after any `check*Achievements()` call returns `newlyUnlocked`, the caller checks `grantedTitleId` and calls `TitleService.grantTitle()`. This keeps `AchievementService` stateless.

**Tradeoff:** This means you can't have a title without an associated achievement. Acceptable — achievements are cheap to create and provide additional XP rewards. The caller-side pattern requires wiring at 4+ call sites but preserves the functional architecture.

### 3. Schema v7 Migration (v6 → v7)

**Decision:** Add `equippedTitle: string | null`, `unlockedTitles: string[]`, and `lifetimeStats: LifetimeStats` to the Character interface. Increment schema to v7.

**Why:** Current schema is v6. The migration chain (v1→v2→v3→v4→v5→v6) is well-established. The v6→v7 migration provides safe defaults (`null`, `[]`, and backfilled counters from `activityHistory`). Lifetime stats enable O(1) achievement checks and feed the Progress Dashboard analytics.

> [!IMPORTANT]
> The existing `migrateCharacterV5toV6()` returns early for schemas ≥6 — it must be updated to chain to `migrateCharacterV6toV7()` instead.

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

**Date filtering:** Uses the existing `ProgressStatsService` date range infrastructure. The export includes whatever date range is currently selected on the dashboard (presets: today, this week, last 7 days, this month, last 30 days, all time, or custom date picker).

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
Quests: 24 | Bounties Won: 12 | Dungeons: 3
XP Earned: 4,200 | Gold Earned: 850
Best Day: Feb 15 (8 completions)
```

**File naming:** `{CharacterName} Export {YYYY-MM-DD}.md` — timestamps prevent collisions and enable historical record.

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
    emoji: string;                       // Icon for lists/export
    rarity: TitleRarity;
    /** If present, this title grants a passive buff when equipped */
    buff?: TitleBuff;
}

export interface TitleBuff {
    /** Human-readable buff description: "+5% Gold from all sources" */
    label: string;
    /** The PowerUpEffect to inject as a passive ActivePowerUp */
    effect: PowerUpEffect;
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
| `questrunner` | Questrunner | Common | — | Complete 10 quests | No (maps to `first-quest` → new `quests-10`) |
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
> **"Slayer of the Void"** does NOT use a `PowerUpEffect` — `BattleService.calculateDamage()` directly checks for the equipped title ID and applies the 5% boss damage bonus. This avoids expanding the `PowerUpEffect` union for a single title.

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
              │  • QuestService                    │
              │  • BattleService                   │
              │  • DungeonService                  │
              │  • GoldAwardHandler                │
              └────────────────────────────────────┘
```

---

## Phase 1: Data Models & Schema Migration

**Effort:** Medium
**Estimated Time:** 1.5-2 hours
**Goal:** Create the Title model, title registry data, update Achievement and Character interfaces, write v6→v7 migration with lifetimeStats backfill.
**Prerequisites:** None

### Tasks

1. **Create `src/models/Title.ts`**
   - `TitleRarity` type
   - `Title` interface with optional `buff: TitleBuff`
   - `TitleBuff` interface (label + PowerUpEffect)
   - Helper: `getTitleById(id: string): Title | undefined`
   - Helper: `isBuffTitle(title: Title): boolean`

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
   - Add `LifetimeStats` interface: `{ questsCompleted, battlesWon, bossesDefeated, dungeonsCompleted, goldEarned }`
   - Add `equippedTitle: string | null`, `unlockedTitles: string[]`, and `lifetimeStats: LifetimeStats` to the `Character` interface
   - Increment `CHARACTER_SCHEMA_VERSION` to 7
   - **Fix `migrateCharacterV5toV6()`:** Change the `>= 6` early return to `>= 7`, add chain call to `migrateCharacterV6toV7()`
   - Create `migrateCharacterV6toV7()` function:
     - Default `equippedTitle: null`
     - Default `unlockedTitles: ['the-novice']` (everyone starts with The Novice)
     - Backfill `lifetimeStats` from `activityHistory` (scan once during migration):
       - `questsCompleted` = count of `quest_complete` events
       - `battlesWon` = count of `bounty_victory` events
       - `bossesDefeated` = 0 (cannot determine from existing data without monster lookup)
       - `dungeonsCompleted` = count of `dungeon_complete` events
       - `goldEarned` = sum of `goldGained` across all events
   - **Update `createCharacter()`:** Add `equippedTitle: null`, `unlockedTitles: ['the-novice']`, `lifetimeStats: { questsCompleted: 0, battlesWon: 0, bossesDefeated: 0, dungeonsCompleted: 0, goldEarned: 0 }`

6. **Update `src/store/characterStore.ts`**
   - Add **simple setter** store actions (no business logic):
     - `setEquippedTitle(titleId: string | null)`: Sets `character.equippedTitle`
     - `addUnlockedTitle(titleId: string)`: Adds to `unlockedTitles[]` if not already present
     - `incrementLifetimeStat(stat: keyof LifetimeStats, amount: number)`: Increments a counter
   - **No PowerUp lifecycle logic here** — that lives in `TitleService` (Phase 2)

#### Tech Debt:
- `bossesDefeated` starts at 0 for migrated characters (can't retroactively determine from history). Future boss kills will be counted correctly.
- The 7 new "manual" trigger achievements need check calls wired in Phase 2 — they won't auto-trigger until then

---

## Phase 1.5: Tests — Data Layer

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
- Store actions do NOT manage PowerUp lifecycle (that's TitleService)

#### Tech Debt:
- None expected

---

## Phase 2: Title Service & Achievement Integration

**Effort:** Medium
**Estimated Time:** 1.5-2 hours
**Goal:** Create TitleService, wire title grants into AchievementService, add check calls for new manual achievements.
**Prerequisites:** Phase 1

### Tasks

1. **Create `src/services/TitleService.ts`**
   - `grantTitle(titleId: string): void` — Calls `characterStore.addUnlockedTitle()`, shows Obsidian `Notice`
   - `equipTitle(titleId: string | null): void` — Validates title ID against `TITLES` registry, calls `characterStore.setEquippedTitle()`, manages passive power-up lifecycle (adds/removes `ActivePowerUp` entries via `characterStore.setPowerUps()`)
   - `getUnlockedTitles(character: Character): Title[]` — Maps `unlockedTitles` IDs to Title objects
   - `getEquippedTitle(character: Character): Title | null` — Resolves `equippedTitle` ID to Title
   - `createTitlePowerUps(title: Title, character: Character): ActivePowerUp[]` — Returns empty array for cosmetic titles, 1-2 entries for buff titles. Handles "The Focused" (both primary stats) and "The Relentless" (dual buff) at build time.

2. **Wire caller-side title grants at achievement check call sites**
   - **Do NOT modify `AchievementService`** — it remains stateless
   - After each `check*Achievements()` call returns `newlyUnlocked`, the caller:
     1. Loops through `newlyUnlocked`
     2. Checks `if (achievement.grantedTitleId)`
     3. Calls `TitleService.grantTitle(achievement.grantedTitleId)`
   - Call sites to wire:
     - `QuestService` / quest completion handler (already calls `checkQuestCountAchievements`)
     - `BattleService` / battle victory handler (already calls `checkLevelAchievements`)
     - Dungeon completion handler
     - Streak update handler (already calls `checkStreakAchievements`)

3. **Wire lifetime stat increments + manual achievement checks**
   - `BattleService` — After battle victory: `incrementLifetimeStat('battlesWon', 1)`, check `battles-25`. If boss: `incrementLifetimeStat('bossesDefeated', 1)`, check `bosses-10`.
   - Dungeon completion handler — `incrementLifetimeStat('dungeonsCompleted', 1)`, check `dungeons-3`
   - Gold award handler — `incrementLifetimeStat('goldEarned', amount)`, check `gold-1000`
   - Quest completion handler — `incrementLifetimeStat('questsCompleted', 1)` (quests-10/50 use `quest_count` trigger which is already wired)

> [!IMPORTANT]
> The `manual` trigger achievements (dungeons, gold, battles, bosses) check against `lifetimeStats` counters for O(1) lookups. No `activityHistory` scanning required.

#### Tech Debt:
- None — `lifetimeStats` counters handle all tracking needs

---

## Phase 2.5: Tests — Service Layer

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
- Equipping a buff title calls `setPowerUps()` with title power-up(s) added
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

**Effort:** Small
**Estimated Time:** 0.5-1 hour
**Goal:** Ensure title buffs flow through existing PowerUp infrastructure correctly.
**Prerequisites:** Phase 2

### Tasks

> [!TIP]
> This phase is intentionally small because the entire point of using the PowerUp system is that existing calculation paths already read `activePowerUps`. The main work is ensuring title power-ups are correctly formed and don't conflict with existing power-ups.

1. **Verify PowerUp effect compatibility**
   - Confirm each title buff's `PowerUpEffect` type is handled in `StatsService.getTotalStat()`, `XPSystem.calculateXPWithBonus()`, and `CombatService.deriveCombatStats()`
   - The following effect types are already fully wired:
     - `xp_multiplier` → used by "The Scholar" (+3% XP) and "The Relentless" (+2% XP)
     - `gold_multiplier` → used by "Fortune's Favorite" (+5% gold)
     - `crit_chance` → used by "Eagle Eye" (+2% crit)
     - `all_stats_boost` → used by "The Tempered" (+1 all stats) and "The Relentless" (+1 all stats)
     - `stat_percent_boost` → used by "The Focused" (+3% to both primary stats)

2. **Handle "The Focused" dual primary stat resolution**
   - When equipping "The Focused," resolve the character's **both** primary class stats from `ClassInfo.primaryStats` tuple:
     - Warrior → STR + CON, Paladin → STR + WIS, Technomancer → INT + DEX, Scholar → INT + WIS, Rogue → DEX + CHA, Cleric → WIS + CON, Bard → CHA + DEX
   - `createTitlePowerUps()` builds **two** `stat_percent_boost` entries, one per primary stat

3. **Handle "Slayer of the Void" boss damage (direct check)**
   - **No new `PowerUpEffect` type needed** — avoids expanding the `PowerUpEffect` union
   - Add a direct check in `BattleService.calculateDamage()`: if attacker's `equippedTitle === 'slayer-of-the-void'` and defender `isBoss`, apply 1.05x damage multiplier
   - Simple 3-line `if` check in one location

4. **Handle "The Relentless" dual buff**
   - This title grants two effects (+1 all stats AND +2% XP)
   - `createTitlePowerUps()` returns **two** `ActivePowerUp` entries for this title
   - Each entry gets a unique ID: `title-buff-{titleId}-0`, `title-buff-{titleId}-1`

5. **Verify title power-ups are safe from expiration sweep**
   - Title power-ups use unique IDs: `title-buff-{titleId}` (or `title-buff-{titleId}-{index}` for multi-buff)
   - `expirePowerUps()` already handles this correctly — line 786 skips `expiresAt === null` entries
   - **No code change needed** — just a test to confirm existing behavior

#### Tech Debt:
- "Slayer of the Void" boss damage check is hardcoded to a specific title ID. If more boss-damage titles are added later, refactor to a `PowerUpEffect` type at that point.

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
- Character with `equippedTitle: 'slayer-of-the-void'` deals +5% damage to bosses (direct check in `calculateDamage()`)
- Boss damage bonus does NOT apply to non-boss enemies
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
   - `CharacterIdentity` title click → `new TitleSelectionModal(app, character, onSave).open()`
   - After selection, trigger character save

> [!NOTE]
> **CSS-only phase (Phase 6) handles all styling.** This phase focuses on structure and functionality. Use basic Obsidian classes and minimal inline structure.

#### Tech Debt:
- No search/filter in the modal for now — with 12 titles it's not needed. Add if registry grows past ~20.

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
   - `copyToClipboard(text: string): void` — Uses `navigator.clipboard.writeText()` with `try/catch` fallback to `document.execCommand('copy')` via temporary textarea. Shows Obsidian `Notice`.
   - `createExportNote(app: App, character: Character, content: string, exportFolder: string): Promise<void>` — Creates `{CharacterName} Export {YYYY-MM-DD}.md` in the configured export folder using `vault.create()` with `normalizePath()`. Checks for existing file and appends timestamp suffix if needed.

2. **Update `src/modals/ProgressDashboardModal.ts`**
   - Add export buttons to the header area:
     - 📋 "Copy Report" button → `generateProgressReport()` + `copyToClipboard()`
     - 💾 "Save to Vault" button → `generateProgressReport()` + `createExportNote()`
   - Both use the currently selected date range from the dashboard's existing date picker
   - Reuse existing `ProgressStatsService.getProgressStatsForRange()` for the filtered data

3. **Add `exportFolder` setting**
   - Add `exportFolder: string` field to settings (default: `settings.questFolder`)
   - Add folder autocomplete input in the collapsed path settings section at the top of `SettingsTab.ts`
   - Settings label: "Export folder" / description: "Folder where character exports are saved"

4. **Register command**
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
- Export file naming uses `{CharacterName} Export {YYYY-MM-DD}.md` format
- Clipboard fallback to `execCommand('copy')` when `navigator.clipboard` unavailable

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
   - `.qb-title-rare` — `color: var(--color-blue)` with subtle text-shadow
   - `.qb-title-epic` — `color: var(--color-purple)` with text-shadow
   - `.qb-title-legendary` — Gold gradient with `background-clip: text` and `-webkit-background-clip: text` (both standard and vendor)
   - `.qb-title-brackets` — Angle brackets in muted color
   - `.qb-title-empty` — Muted italic for "No Title"
   - Export button styles (small, unobtrusive clipboard icon)

2. **Update `src/styles/modals.css`**
   - `.qb-title-modal` — Modal container
   - `.qb-title-row` — Title list row with hover highlight
   - `.qb-title-row-selected` — Active selection indicator
   - `.qb-title-row-locked` — Greyed out, reduced opacity
   - `.qb-title-rarity-badge` — Small rarity label (COMMON, RARE, etc.)
   - `.qb-title-buff-label` — Buff description text below title name
   - Section headers for "Unlocked" and "Locked" groups

3. **Mobile considerations**
   - Title wraps below character name on narrow screens (not truncated)
   - Modal scrollable on mobile
   - Touch targets ≥44px for title rows
   - No hover-dependent interactions (click/tap only)

#### Tech Debt:
- Legendary gradient uses hardcoded gold colors (`#ffd700`, `#ffaa00`) since Obsidian doesn't have a gold CSS variable. Acceptable — gold is universally recognizable.

---

## Plan Summary

| Phase | Title | Effort | Depends On | Est. Time |
|-------|-------|--------|------------|-----------|
| 1 | Data Models & Schema Migration | Medium | — | 1.5-2h |
| 1.5 | Tests: Data Layer | Small | Phase 1 | 1-1.5h |
| 2 | Title Service & Achievement Integration | Medium | Phase 1 | 1.5-2h |
| 2.5 | Tests: Service Layer | Medium | Phase 2 | 1.5-2h |
| 3 | Buff Engine (PowerUp Integration) | Small | Phase 2 | 0.5-1h |
| 3.5 | Tests: Buff Engine | Medium | Phase 3 | 1-1.5h |
| 4 | UI: Character Identity & Title Modal | Medium | Phase 2 | 2-2.5h |
| 4.5 | Tests: UI | Small | Phase 4 | 1h |
| 5 | UI: Progress Dashboard Report Generator | Medium | Phase 2 | 2-2.5h |
| 5.5 | Tests: Export | Small | Phase 5 | 1h |
| 6 | CSS & Polish | Small | Phase 4 | 1-1.5h |

**Total Estimated Time:** ~15-20 hours across 7-9 sessions

**Execution Order:**
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
| Clipboard fallback | Pass | |

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
| 1 | `src/models/Title.ts` | [NEW] | Title interface, helpers |
| 1 | `src/data/titles.ts` | [NEW] | 12 title definitions |
| 1 | `src/models/Achievement.ts` | [MODIFY] | Add `grantedTitleId` |
| 1 | `src/data/achievements.ts` | [MODIFY] | 7 new achievements, title mappings |
| 1 | `src/models/Character.ts` | [MODIFY] | Schema v7, `equippedTitle`, `unlockedTitles`, `LifetimeStats`, migration chain fix |
| 1 | `src/store/characterStore.ts` | [MODIFY] | Simple setters: `setEquippedTitle`, `addUnlockedTitle`, `incrementLifetimeStat` |
| 1.5 | `test/models/title.test.ts` | [NEW] | Data integrity + migration + backfill tests |
| 1.5 | `test/store/characterStore.test.ts` | [MODIFY] | Migration + store action tests |
| 2 | `src/services/TitleService.ts` | [NEW] | Title business logic + PowerUp lifecycle |
| 2 | Various services | [MODIFY] | Caller-side title grant hooks + lifetime stat increments |
| 2.5 | `test/services/TitleService.test.ts` | [NEW] | Service layer tests |
| 3 | `src/services/BattleService.ts` | [MODIFY] | Direct `slayer-of-the-void` boss damage check |
| 3.5 | `test/services/TitleBuffIntegration.test.ts` | [NEW] | Buff calculation tests |
| 4 | `src/components/character/CharacterIdentity.tsx` | [MODIFY] | Title display + click handler + mobile wrap |
| 4 | `src/modals/TitleSelectionModal.ts` | [NEW] | Title picker modal |
| 4.5 | `test/modals/TitleSelectionModal.test.ts` | [NEW] | Modal logic tests |
| 5 | `src/services/CharacterExportService.ts` | [NEW] | Report generator + clipboard + vault note |
| 5 | `src/modals/ProgressDashboardModal.ts` | [MODIFY] | Export buttons |
| 5 | `src/settings.ts` | [MODIFY] | Add `exportFolder` setting |
| 5 | `src/SettingsTab.ts` | [MODIFY] | Export folder autocomplete input |
| 5 | `main.ts` | [MODIFY] | Register export command |
| 5.5 | `test/services/CharacterExportService.test.ts` | [NEW] | Export + report tests |
| 6 | `src/styles/character.css` | [MODIFY] | Title display styles + mobile wrap |
| 6 | `src/styles/modals.css` | [MODIFY] | Title modal styles |

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
| Battle damage calculation | `src/services/BattleService.ts` | `calculateDamage()` — Slayer of the Void check goes here |
| Accessory effect pattern | `src/services/AccessoryEffectService.ts` | Pure function pattern reference |
| CSS modules | `src/styles/character.css`, `src/styles/modals.css` | Edit these, not root `styles.css` |
| Obsidian plugin guidelines | `.agent/rules/obsidian-plugin-guidelines.md` | Security, API, CSS rules |

---

## Migration Strategy

**Automatic migration on load.** When the character store loads a v6 character:
1. `migrateCharacterV5toV6()` chains to `migrateCharacterV6toV7()` (fix: was returning early for v6+)
2. `migrateCharacterV6toV7()` detects `schemaVersion < 7`
3. Adds `equippedTitle: null`, `unlockedTitles: ['the-novice']`
4. Backfills `lifetimeStats` from `activityHistory` (one-time scan)
5. Sets `schemaVersion: 7`
6. Chains to the next migration (future-proofed)

**Rollback:** Delete the title and lifetimeStats fields and revert schema version. No data loss — titles don't modify existing fields.

---

## Security & Validation

- Title IDs validated against `TITLES` registry before equipping (prevents stale/invalid IDs)
- `TitleSelectionModal` uses Obsidian DOM API (`createEl`, `createDiv`) — no `innerHTML`
- Export uses `Vault.create()` for file creation — path validated with `normalizePath()`
- Export checks for existing file before `vault.create()` (throws on collision — handled with timestamp suffix)
- Clipboard uses `navigator.clipboard.writeText()` with `try/catch` fallback to `document.execCommand('copy')`
- No network requests, no external data, no user-generated title content

---

## Rollback Plan

1. Revert all changed files to pre-title state
2. The v7 migration is additive-only (new fields with defaults) — reverting to v6 code will simply ignore the extra fields on next load
3. No existing data is modified or deleted by this feature
4. Active title power-ups use `triggeredBy: 'title'` — easy to filter out if needed
5. `lifetimeStats` counters are additive and independent — safe to drop
