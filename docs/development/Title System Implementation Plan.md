# Title System Implementation Plan

> **Status:** 🔲 TODO
> **Estimated Sessions:** 6-8 (including test phases)
> **Created:** 2026-02-21
> **Last Updated:** 2026-02-21
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
12. [Phase 5: UI — Character Export](#phase-5-ui--character-export)
13. [Phase 5.5: Tests — Export](#phase-55-tests--export)
14. [Phase 6: CSS & Polish](#phase-6-css--polish)
15. [Plan Summary](#plan-summary)
16. [Verification Checklist](#verification-checklist)
17. [File Change Summary](#file-change-summary)
18. [Key References](#key-references)

---

## Overview

### Problem Statement

Players earn achievements but get no lasting cosmetic or mechanical reward beyond the XP bonus at unlock time. There's no visual identity progression — a level 30 character looks the same as a level 5 in terms of "prestige." The title system gives players something to show off and a small mechanical incentive to keep pushing.

### What This Adds

- **Unlockable titles** displayed on the character sheet next to the character name
- **Two categories:** Cosmetic-only titles (prestige/flavor) and buff titles (cosmetic + passive micro-buff)
- **Buff titles** inject as passive `ActivePowerUp` entries, piggybacking on the existing power-up system with zero new calculation wiring
- **Mixed unlock sources:** Most titles unlock via achievements (existing and new), some via level milestones, streaks, and combat stats — all funneled through the achievement pipeline
- **Character export:** Copy-to-clipboard button on character sheet + markdown note generation command, both including the equipped title. Export also available on the Progress Dashboard modal.

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

**Why:** The `AchievementService` already handles level, streak, quest count, and category count trigger types. Rather than building a parallel unlock system, we add a `grantedTitleId?: string` field to the `Achievement` interface. When an achievement unlocks and has this field, the title unlocks too.

**Tradeoff:** This means you can't have a title without an associated achievement. Acceptable — achievements are cheap to create and provide additional XP rewards.

### 3. Schema v7 Migration (v6 → v7)

**Decision:** Add `equippedTitle: string | null` and `unlockedTitles: string[]` to the Character interface. Increment schema to v7.

**Why:** Current schema is v6. The migration chain (v1→v2→v3→v4→v5→v6) is well-established. The v6→v7 migration provides safe defaults (`null` and `[]`).

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

### 6. Export Generates a Clean Markdown Summary

**Decision:** Two export triggers:
1. Clipboard copy button (character sheet header + progress dashboard header)
2. Command palette command that creates a `.md` file in the vault

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
```

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
export interface Character {
    // ... existing fields ...
    equippedTitle: string | null;    // Title ID or null
    unlockedTitles: string[];        // Array of unlocked Title IDs
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
| `the-tempered` | The Tempered | Epic | +1 All Stats | Reach Level 20 | No (maps to existing `level-21` — closest) |
| `the-focused` | The Focused | Epic | +3% to primary stat | Reach Level 25 | No (maps to `level-25`) |
| `slayer-of-the-void` | Slayer of the Void | Legendary | +5% Boss Damage | Defeat 10 bosses | Yes: `bosses-10` |
| `the-relentless` | The Relentless | Legendary | +1 All Stats, +2% XP | 30-day streak | No (maps to `streak-30`) |

> [!NOTE]
> "The Focused" grants a `stat_percent_boost` keyed to the character's primary class stat (e.g., STR for Warrior, INT for Technomancer). This is resolved at equip time when creating the `ActivePowerUp`.

### New Achievements Needed

| ID | Name | Trigger Type | Target | Category |
|----|------|-------------|--------|----------|
| `quests-10` | Adventurer's Start | `quest_count` | 10 | `quest_count` |
| `quests-50` | Seasoned Adventurer | `quest_count` | 50 | `quest_count` |
| `dungeons-3` | Dungeon Explorer | `manual` | 1 | `special` |
| `gold-1000` | Fortune Seeker | `manual` | 1 | `special` |
| `battles-25` | Veteran Fighter | `manual` | 1 | `special` |
| `bosses-10` | Boss Hunter | `manual` | 1 | `special` |

> [!IMPORTANT]
> The `manual` trigger achievements (dungeons, gold, battles, bosses) need their check calls wired into the appropriate service methods. `dungeons-3` checked after dungeon completion, `gold-1000` checked after gold awards, `battles-25` and `bosses-10` checked after battle victory. These are new check sites in the respective services.

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
│ - List unlocked     │──▶│ equippedTitle     │
│ - Show locked       │   │ unlockedTitles    │
│ - Equip/unequip     │   │ activePowerUps    │
└─────────────────────┘   └───────────────────┘
                                   ▲
                                   │ on equip/unequip
                          ┌────────────────┐
                          │  TitleService  │
                          │ equipTitle()   │
                          │ unequipTitle() │
                          │ grantTitle()   │
                          └────────────────┘
                                   ▲
                                   │ on achievement unlock
                          ┌────────────────────┐
                          │ AchievementService │
                          │ (grantedTitleId)   │
                          └────────────────────┘
```

---

## Phase 1: Data Models & Schema Migration

**Effort:** Small
**Estimated Time:** 1-1.5 hours
**Goal:** Create the Title model, title registry data, update Achievement and Character interfaces, write v6→v7 migration.
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
   - Add 6 new achievements from the "New Achievements Needed" table
   - Add `grantedTitleId` to all 12 achievements that map to titles (both existing and new)

5. **Update `src/models/Character.ts`**
   - Add `equippedTitle: string | null` and `unlockedTitles: string[]` to the `Character` interface
   - Increment `CHARACTER_SCHEMA_VERSION` to 7
   - Create `migrateCharacterV6toV7()` function:
     - Default `equippedTitle: null`
     - Default `unlockedTitles: ['the-novice']` (everyone starts with The Novice)
   - Chain from `migrateCharacterV5toV6()`

6. **Update `src/store/characterStore.ts`**
   - Add store actions: `equipTitle(titleId: string | null)`, `unlockTitle(titleId: string)`
   - `equipTitle` sets `character.equippedTitle` and manages the title's passive `ActivePowerUp` (add on equip, remove on unequip)
   - `unlockTitle` adds to `unlockedTitles[]` if not already present, prevents duplicates

#### Tech Debt:
- The 6 new "manual" trigger achievements need check calls wired in Phase 2 — they won't auto-trigger until then

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
- v6 payload migrates to v7 with `equippedTitle: null`, `unlockedTitles: ['the-novice']`
- v7 payload passes through untouched
- v5 payload chains through v5→v6→v7

**Store Actions:**
- `unlockTitle('eagle-eye')` adds to array
- `unlockTitle('eagle-eye')` twice doesn't duplicate
- `equipTitle('eagle-eye')` sets `equippedTitle`
- `equipTitle(null)` clears it
- `equipTitle` with a buff title adds passive `ActivePowerUp`
- `equipTitle(null)` removes the title `ActivePowerUp`

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
   - `grantTitle(titleId: string): void` — Calls `characterStore.unlockTitle()`, shows Obsidian `Notice`
   - `equipTitle(titleId: string | null): void` — Calls `characterStore.equipTitle()`, manages passive power-up lifecycle
   - `getUnlockedTitles(character: Character): Title[]` — Maps `unlockedTitles` IDs to Title objects
   - `getEquippedTitle(character: Character): Title | null` — Resolves `equippedTitle` ID to Title
   - `createTitlePowerUp(title: Title): ActivePowerUp | null` — Builds the passive power-up for a buff title
   - `checkCombatTitleAchievements(character: Character, achievements: Achievement[]): AchievementCheckResult` — Checks boss kills, battle wins against character's `activityHistory`
   - `checkResourceTitleAchievements(character: Character, achievements: Achievement[]): AchievementCheckResult` — Checks gold earned, dungeons completed

2. **Update `src/services/AchievementService.ts`**
   - In each `check*Achievements()` method: after unlocking an achievement, check `if (achievement.grantedTitleId)` and call `TitleService.grantTitle(achievement.grantedTitleId)`
   - Add to `unlockAchievement()` (manual unlock path) as well

3. **Wire new achievement checks**
   - `BattleService` — After battle victory: check `battles-25` and `bosses-10` achievements
   - Dungeon completion handler — Check `dungeons-3` achievement
   - Gold award handler — Check `gold-1000` achievement
   - Quest completion handler — Ensure `quests-10` and `quests-50` are checked (these use `quest_count` trigger which is already checked, just need the achievements to exist)

> [!IMPORTANT]
> The combat/resource achievements use `manual` trigger type because the existing trigger types don't cover "total battles won" or "total gold earned." The `TitleService.checkCombatTitleAchievements()` method manually counts from `activityHistory` and unlocks when thresholds are met.

#### Tech Debt:
- `activityHistory` may not track boss kills distinctly — verify and add `isBoss` flag to `ActivityEvent` if needed
- Gold tracking: need to verify `activityHistory` stores cumulative gold or if we need to sum it

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
- `createTitlePowerUp()` returns null for cosmetic titles
- `createTitlePowerUp()` returns valid `ActivePowerUp` for buff titles
- Power-up has `triggeredBy: 'title'`, `expiresAt: null`
- Equipping a buff title adds exactly one power-up with `triggeredBy: 'title'`
- Unequipping removes the title power-up
- Swapping titles removes old power-up and adds new one

**Achievement Integration:**
- Unlocking achievement with `grantedTitleId` also unlocks the title
- Unlocking achievement without `grantedTitleId` does not affect titles
- Manual achievement checks correctly count from activity history

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
     - `stat_percent_boost` → used by "The Focused" (+3% primary stat)

2. **Handle "The Focused" class-stat resolution**
   - When equipping "The Focused," resolve the character's primary class stat:
     - Warrior → STR, Paladin → CON, Technomancer → INT, Scholar → WIS, Rogue → DEX, Cleric → WIS, Bard → CHA
   - Build the `stat_percent_boost` effect with the resolved stat at equip time

3. **Handle "Slayer of the Void" boss damage**
   - This needs a new `PowerUpEffect` type: `{ type: 'boss_damage_multiplier', value: number }`
   - Add to `PowerUpEffect` union in `Character.ts`
   - Add handling in `BattleService.calculateDamage()` — check for this effect type on attacker's power-ups when defender is a boss

4. **Handle "The Relentless" dual buff**
   - This title grants two effects (+1 all stats AND +2% XP)
   - `createTitlePowerUp()` should return **two** `ActivePowerUp` entries for this title, or we add support for compound effects
   - Simplest: return an array from `createTitlePowerUp()` and the store action adds all of them

5. **Ensure title power-ups don't collide with existing power-ups**
   - Title power-ups use unique IDs: `title-buff-{titleId}`
   - `PowerUpService.cleanupExpiredPowerUps()` should skip `triggeredBy: 'title'` entries (they never expire)

#### Tech Debt:
- `boss_damage_multiplier` is a new effect type — only one title uses it currently. If no more are planned, consider simplifying to a flat damage bonus in the title service instead.

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
- Character with "The Focused" (Warrior) has +3% STR only
- Title stat buffs stack with gear and power-up stat boosts

**Combat Integration:**
- Character with "Eagle Eye" has +2% crit chance in `deriveCombatStats()`
- Character with "Slayer of the Void" deals +5% damage to bosses
- Boss damage buff does NOT apply to non-boss enemies

**Gold Integration:**
- Character with "Fortune's Favorite" gold multiplier is applied

**Compound Buff:**
- "The Relentless" correctly applies both +1 all stats AND +2% XP
- Both effects show as separate buff icons

**Cleanup Safety:**
- `cleanupExpiredPowerUps()` does not remove title power-ups
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

## Phase 5: UI — Character Export

**Effort:** Medium
**Estimated Time:** 1.5-2 hours
**Goal:** Add character export functionality to character sheet and progress dashboard.
**Prerequisites:** Phase 2

### Tasks

1. **Create `src/services/CharacterExportService.ts`**
   - `generateCharacterSummary(character: Character): string` — Produces the markdown summary text including equipped title, level, class, stats, active buffs, equipped gear
   - `copyToClipboard(text: string): void` — Copies text and shows Obsidian `Notice`
   - `createExportNote(app: App, character: Character): Promise<void>` — Creates a `.md` file in `Quest Board/exports/` with the summary

2. **Update `src/components/character/CharacterIdentity.tsx`**
   - Add a small clipboard icon button in the header area
   - On click: call `CharacterExportService.generateCharacterSummary()` → `copyToClipboard()`

3. **Update `src/modals/ProgressDashboardModal.ts`**
   - Add export buttons to the header (copy + save note)
   - "Copy Summary" button → clipboard
   - "Save to Vault" button → creates export note

4. **Register command**
   - Add `quest-board:export-character` command in `main.ts`
   - Opens a small confirmation then generates the note

#### Tech Debt:
- Export format is v1 — may want to add more sections (achievements, activity history) later

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

- Summary includes character name and equipped title
- Summary includes "No title equipped" when no title
- Summary includes level, class, secondary class
- Summary includes all 6 stats with correct values
- Summary includes active buff titles with labels
- Summary includes equipped gear names
- Summary handles null/empty gear gracefully

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
   - `.qb-title-legendary` — Gold gradient with `-webkit-background-clip: text`
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
   - Title text truncation on narrow screens
   - Modal scrollable on mobile
   - Touch targets ≥44px for title rows
   - No hover-dependent interactions (click/tap only)

#### Tech Debt:
- Legendary gradient uses hardcoded gold colors (`#ffd700`, `#ffaa00`) since Obsidian doesn't have a gold CSS variable. Acceptable — gold is universally recognizable.

---

## Plan Summary

| Phase | Title | Effort | Depends On | Est. Time |
|-------|-------|--------|------------|-----------|
| 1 | Data Models & Schema Migration | Small | — | 1-1.5h |
| 1.5 | Tests: Data Layer | Small | Phase 1 | 1-1.5h |
| 2 | Title Service & Achievement Integration | Medium | Phase 1 | 1.5-2h |
| 2.5 | Tests: Service Layer | Medium | Phase 2 | 1.5-2h |
| 3 | Buff Engine (PowerUp Integration) | Small | Phase 2 | 0.5-1h |
| 3.5 | Tests: Buff Engine | Medium | Phase 3 | 1-1.5h |
| 4 | UI: Character Identity & Title Modal | Medium | Phase 2 | 2-2.5h |
| 5 | UI: Character Export | Medium | Phase 2 | 1.5-2h |
| 5.5 | Tests: Export | Small | Phase 5 | 1h |
| 6 | CSS & Polish | Small | Phase 4 | 1-1.5h |

**Total Estimated Time:** ~13-17 hours across 6-8 sessions

**Execution Order:**
- Phases 1 → 1.5 → 2 → 2.5 (strictly sequential)
- After Phase 2: Phases 3, 4, and 5 can be done in **any order** (all depend only on Phase 2)
- Phase 3.5 after Phase 3
- Phase 5.5 after Phase 5
- Phase 6 after Phase 4

---

## Verification Checklist

### Automated Tests

| Test | Expected | Status |
|------|----------|--------|
| Title data integrity (all 12 titles valid) | Pass | |
| Achievement→title reference integrity | Pass | |
| Schema v6→v7 migration | Pass, defaults applied | |
| Store: unlock/equip/unequip actions | Pass | |
| TitleService: grant, equip, unequip | Pass | |
| Achievement integration: unlock → title grant | Pass | |
| Buff: XP multiplier flows through | Pass, ±0.01 tolerance | |
| Buff: All stats boost applies | Pass, +1 each | |
| Buff: Crit chance applies | Pass, +2% | |
| Buff: Gold multiplier applies | Pass, +5% | |
| Buff: Boss damage applies to bosses only | Pass | |
| Buff: Compound buff (The Relentless) | Pass, both effects | |
| Export: summary content correct | Pass | |

### Manual Testing

| Test | Expected | Status |
|------|----------|--------|
| Build passes (`npm run build`) | No errors | |
| Deploy to test vault (`npm run deploy:test`) | Files copied | |
| Existing character loads without crash | v7 migration runs | |
| "The Novice" auto-unlocked | Shows in title list | |
| Click title area → modal opens | Modal displays | |
| Equip title → name updates | Title appears inline | |
| Equip buff title → buff icon appears | In buff row | |
| Unequip title → cleared | "No Title" shown | |
| Unlock achievement with title → title unlocks | Notice shown | |
| Copy button → clipboard has summary | Paste to verify | |
| Export command → note created in vault | Check file content | |
| Progress Dashboard → export buttons work | Both copy + save | |
| Mobile: title display + modal work | Tap targets, scroll | |

---

## File Change Summary

| Phase | File | Action | Purpose |
|-------|------|--------|---------|
| 1 | `src/models/Title.ts` | [NEW] | Title interface, helpers |
| 1 | `src/data/titles.ts` | [NEW] | 12 title definitions |
| 1 | `src/models/Achievement.ts` | [MODIFY] | Add `grantedTitleId` |
| 1 | `src/data/achievements.ts` | [MODIFY] | 6 new achievements, title mappings |
| 1 | `src/models/Character.ts` | [MODIFY] | Schema v7, `equippedTitle`, `unlockedTitles` |
| 1 | `src/store/characterStore.ts` | [MODIFY] | `equipTitle`, `unlockTitle` actions |
| 1.5 | `test/models/title.test.ts` | [NEW] | Data integrity + migration tests |
| 1.5 | `test/store/characterStore.test.ts` | [MODIFY] | Migration + store action tests |
| 2 | `src/services/TitleService.ts` | [NEW] | Title business logic |
| 2 | `src/services/AchievementService.ts` | [MODIFY] | Title grant on achievement unlock |
| 2 | `src/services/BattleService.ts` | [MODIFY] | Check combat title achievements |
| 2.5 | `test/services/TitleService.test.ts` | [NEW] | Service layer tests |
| 3 | `src/models/Character.ts` | [MODIFY] | Add `boss_damage_multiplier` to `PowerUpEffect` |
| 3 | `src/services/BattleService.ts` | [MODIFY] | Handle `boss_damage_multiplier` effect |
| 3 | `src/services/PowerUpService.ts` | [MODIFY] | Skip title power-ups in cleanup |
| 3.5 | `test/services/TitleBuffIntegration.test.ts` | [NEW] | Buff calculation tests |
| 4 | `src/components/character/CharacterIdentity.tsx` | [MODIFY] | Title display + click handler |
| 4 | `src/modals/TitleSelectionModal.ts` | [NEW] | Title picker modal |
| 5 | `src/services/CharacterExportService.ts` | [NEW] | Export summary + clipboard + note |
| 5 | `src/modals/ProgressDashboardModal.ts` | [MODIFY] | Export buttons |
| 5 | `main.ts` | [MODIFY] | Register export command |
| 5.5 | `test/services/CharacterExportService.test.ts` | [NEW] | Export tests |
| 6 | `src/styles/character.css` | [MODIFY] | Title display styles |
| 6 | `src/styles/modals.css` | [MODIFY] | Title modal styles |

---

## Key References

| Reference | Location | Notes |
|-----------|----------|-------|
| Character model + schema migrations | `src/models/Character.ts` | Schema v6, migration chain pattern |
| PowerUp effect types | `src/models/Character.ts:312` | `PowerUpEffect` union type |
| Achievement model + service | `src/models/Achievement.ts`, `src/services/AchievementService.ts` | Trigger types, unlock flow |
| Achievement data | `src/data/achievements.ts` | Existing achievements |
| PowerUp service + cleanup | `src/services/PowerUpService.ts` | `cleanupExpiredPowerUps()` |
| CharacterIdentity component | `src/components/character/CharacterIdentity.tsx` | Name/level/buff display |
| Progress Dashboard modal | `src/modals/ProgressDashboardModal.ts` | Export button location |
| XP calculation | `src/services/XPSystem.ts` | `calculateXPWithBonus()` |
| Stats calculation | `src/services/StatsService.ts` | `getTotalStat()` |
| Combat stats derivation | `src/services/CombatService.ts` | `deriveCombatStats()` |
| Battle damage calculation | `src/services/BattleService.ts` | `calculateDamage()` |
| Accessory effect pattern | `src/services/AccessoryEffectService.ts` | Pure function pattern reference |
| CSS modules | `src/styles/character.css`, `src/styles/modals.css` | Edit these, not root `styles.css` |
| Obsidian plugin guidelines | `.agent/rules/obsidian-plugin-guidelines.md` | Security, API, CSS rules |

---

## Migration Strategy

**Automatic migration on load.** When the character store loads a v6 character:
1. `migrateCharacterV6toV7()` detects `schemaVersion < 7`
2. Adds `equippedTitle: null` and `unlockedTitles: ['the-novice']`
3. Sets `schemaVersion: 7`
4. Chains to the next migration (future-proofed)

**Rollback:** Delete the title fields and revert schema version. No data loss — titles don't modify existing fields.

---

## Security & Validation

- Title IDs validated against `TITLES` registry before equipping (prevents stale/invalid IDs)
- `TitleSelectionModal` uses Obsidian DOM API (`createEl`, `createDiv`) — no `innerHTML`
- Export uses `Vault.create()` for file creation — path validated with `normalizePath()`
- No network requests, no external data, no user-generated title content

---

## Rollback Plan

1. Revert all changed files to pre-title state
2. The v7 migration is additive-only (new fields with defaults) — reverting to v6 code will simply ignore the extra fields on next load
3. No existing data is modified or deleted by this feature
4. Active title power-ups use `triggeredBy: 'title'` — easy to filter out if needed
