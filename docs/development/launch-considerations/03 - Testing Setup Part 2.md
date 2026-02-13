# Testing Setup Part 2 — Full Coverage Expansion

## Goal

Expand test coverage beyond services to cover **all remaining source directories** and reach **80%+ coverage** across the codebase. Part 1 (`02 - Test Reorganization & Coverage Plan.md`) covers services (Sessions 0–K) and integration tests (Sessions H1–H3). This document covers everything else: models, stores, config, utils, data, hooks, modals, and views.

### Test Types

- **Unit Tests** — Test a single function/method in isolation. Dependencies mocked.
- **Integration Tests** — Verify multiple modules working together (e.g., store actions that invoke model validation, filter chains processing quest data through hooks, modal methods that orchestrate store + service calls). Dependencies wired together, not mocked.

---

## Current Coverage Baseline (Non-Service Directories)

| Directory | Files | Statements | Branches | Functions | Dedicated Tests |
|---|---|---|---|---|---|
| `models/` | 13 | 29.1% | 10.7% | 15.4% | 0 |
| `store/` | 8 | 7.3% | 0% | 4% | 0 |
| `config/` | 1 | 48% | 12.8% | 0% | 0 |
| `utils/` | 14 | ~75% | varies | varies | 1 (pathfinding) |
| `data/` | 15 | 57.5% | varies | varies | 3 (registry, skills, activity) |
| `hooks/` | 10 | 0% | 0% | 0% | 0 |
| `modals/` | 39 | 13.6% | 22.2% | 6.7% | 1 (AssetDownload, incidental) |
| `views/` | 7 | 0% | 0% | 0% | 0 |

---

## Proposed Test Directory Structure

New test files integrated into the Part 1 reorganized structure:

```
test/
├── setup.ts
├── mocks/obsidian.ts
├── models/
│   ├── character.test.ts              ← Session 12A
│   ├── character-migration.test.ts    ← Session 12B
│   ├── gear.test.ts                   ← Session 12C
│   └── other-models.test.ts           ← Session 12C
├── config/
│   └── combat-config.test.ts          ← Session 13
├── stores/
│   ├── quest-store.test.ts            ← Session 14A
│   ├── filter-store.test.ts           ← Session 14A
│   ├── character-store.test.ts        ← Session 14B
│   ├── battle-store.test.ts           ← Session 14C
│   └── other-stores.test.ts           ← Session 14C
├── utils/
│   ├── validators.test.ts             ← Session 15A
│   ├── sanitizer.test.ts              ← Session 15B
│   └── formatters.test.ts             ← Session 15B
├── data/
│   └── data-integrity.test.ts         ← Session 16
├── hooks/
│   └── hooks.test.ts                  ← Session 17
├── modals/
│   ├── create-quest.test.ts           ← Session 18A
│   ├── column-manager.test.ts         ← Session 18A
│   ├── inventory.test.ts              ← Session 18B
│   ├── blacksmith.test.ts             ← Session 18B
│   └── medium-modals.test.ts          ← Session 18B
├── integration/
│   ├── store-model.test.ts            ← Session 14C (integration)
│   ├── filter-quest-pipeline.test.ts  ← Session 14A (integration)
│   ├── hook-store.test.ts             ← Session 17 (integration)
│   └── modal-store-flow.test.ts       ← Session 18B (integration)
└── views/                             ← Session 19 (deferred)
    └── (TBD)
```

---

## Session Target

Each session caps at **~100 tests**. Brad will decide at runtime whether to batch sessions together or keep them separate.

---

## Session-by-Session Roadmap

All sessions are **PRE-LAUNCH**. Each session is ~45-90 minutes.

---

### Session 12A — Character Model Core (~66 tests)

**Purpose:** Test all pure functions and constants in `Character.ts` (958 lines, 12 exported functions). This is the largest model file and the foundation for character creation, stats, and progression.

**File:** `test/models/character.test.ts`

**Infrastructure needed:** None — all functions are pure, no mocks required.

| Describe Block | Tests | Coverage |
|---|---|---|
| `getStartingStatsForClass` | 9 | 7 classes: each gets +2 to both primary stats, base 10 for all others. Edge: verify order of primaryStats doesn't matter |
| `createCharacter` — per-class | 7 | One test per class: verify all character fields initialized correctly |
| `createCharacter` — field validation | 8 | Default stats match `getStartingStatsForClass`, HP matches `calculateMaxHP` formula, Mana matches `calculateMaxMana`, appearance merges with `DEFAULT_APPEARANCE`, partial appearance overrides only specified fields, `outfitPrimary` uses class `primaryColor`, `isTrainingMode` starts true, `equippedGear` has all 9 slots null |
| `getLevelTier` | 10 | Boundary levels: 1→T1, 8→T1, 9→T2, 16→T2, 17→T3, 24→T3, 25→T4, 32→T4, 33→T5, 40→T5 |
| `getTrainingLevelDisplay` | 12 | Levels 1-10 → I through X, level 0 → fallback 'I', level 11+ → clamped to 'X' |
| `calculateMaxHP` | 5 | Formula `50+(con*5)+(level*10)`: default stats level 1, high con, high level, missing baseStats defaults to 10, missing level defaults to 1 |
| `calculateMaxMana` | 5 | Formula `20+(int*3)+(level*5)`: same pattern as HP |
| `CLASS_INFO` integrity | 7 | 7 classes: `id` matches key, `primaryStats` are valid StatTypes, `bonusPercent === 15`, `inherentType` is valid ElementalType, `categoryStatMap` values are valid StatTypes |
| `DEFAULT_STATS` / `DEFAULT_APPEARANCE` | 3 | Constants have expected shapes, all stat values are 10, appearance has valid enum members |

Edge cases:
- `createCharacter` with empty string name — should still create (validation is modal-level)
- `getStartingStatsForClass` — verify both primary stats get the bonus even when they're the same type (they never are currently, but guards against future class changes)
- `calculateMaxHP` with very high constitution (40) — verify no overflow or NaN

**Session 12A Total: ~66 tests**

**Running coverage total: Models 29.1% → ~55%**

---

### Session 12B — Character Migration Chain (~34 tests)

**Purpose:** Test the schema migration chain (v1→v2→v3→v4→v5) that runs on plugin load for characters created in older versions. Includes integration test verifying the full chain.

**File:** `test/models/character-migration.test.ts`

**Infrastructure needed:** Mock for `require('../data/skills')` — used by `migrateCharacterV4toV5`. Can use `vi.mock` to provide stub `getUnlockedSkills`.

| Describe Block | Tests | Coverage |
|---|---|---|
| `migrateEquippedGear` | 7 | Old array format (v1) → empty slots map, already-new-format → passthrough copies valid slots, null input → empty map, undefined → empty map, partial slots (only weapon set) → rest null, object with non-slot keys → ignored, empty object → empty map |
| `migrateCharacterV1toV2` | 5 | v1 data → v2 (gear migrated, gold/inventory/HP/Mana/stamina defaulted), already-v2 → chains to v3, HP/Mana calculated from existing stats, missing stats default to 10, new fields use `??` with null-safe defaults |
| `migrateCharacterV2toV3` | 4 | v2→v3 (status + recoveryTimerEnd added), already-v3 → chains to v4, already-v4+ → passthrough, existing status/recoveryTimerEnd preserved |
| `migrateCharacterV3toV4` | 4 | v3→v4 (activityHistory added), already-v4 → chains to v5, already-v5+ → passthrough, existing activityHistory preserved |
| `migrateCharacterV4toV5` | 5 | v4→v5 (skills added), already-v5+ → passthrough, `getUnlockedSkills` called with correct class/level, loadout populated, `persistentStatusEffects` initialized empty |
| `getDefaultSkillLoadout` (via v4→v5) | 6 | Heal priority first, buff second, ultimate third, damage fills remaining, empty skills list → empty loadout, fewer skills than 5 slots → partial loadout |

##### Integration: Full Migration Chain (~3 tests)

| Test | What It Validates |
|---|---|
| v1 data through all migrations to v5 | All fields present, schemaVersion=5, no data loss |
| v3 data through v3→v4→v5 only | Skips v1→v2, v2→v3 |
| Already-v5 data passes through unchanged | No mutations, same object returned |

Error paths (2 tests):
- `migrateCharacterV4toV5` when `getUnlockedSkills` returns empty array — loadout should be empty, no crash
- `migrateEquippedGear` with corrupt data (nested null objects in slot positions) — should not throw

**Session 12B Total: ~34 tests**

**Running coverage total: Models ~55% → ~70%**

---

### Session 12C — Gear, Skill, Quest, and Other Models (~131 tests)

**Purpose:** Cover all remaining model files with testable logic. Gear.ts is the largest piece (9 functions, 553 lines). This session is above the 100-test ceiling — consider splitting Gear.ts into its own session if implementation pace warrants it.

> [!NOTE]
> This session is ~131 tests (above the 100-test ceiling). Brad will decide at implementation time whether to split Gear.ts into its own session.

**Files:** `test/models/gear.test.ts` + `test/models/other-models.test.ts`

**Infrastructure needed:** None — all functions are pure.

#### gear.test.ts — Gear.ts (553 lines, 9 functions)

| Describe Block | Tests | Coverage |
|---|---|---|
| `canEquipArmor` — class restrictions | 14 | Scholar: cloth ✓, leather ✗, mail ✗, plate ✗. Warrior: all 4 ✓. Cleric: mail ✓, plate ✗. Rogue: leather ✓, mail ✗. Sample 14 representative class×type combos covering all 7 classes |
| `canEquipWeapon` — class restrictions | 14 | Warrior: sword ✓, staff ✗. Scholar: staff ✓, sword ✗. Rogue: bow ✓, mace ✗. Sample 14 representative combos covering all 7 classes × key weapon types |
| `canEquipGear` — routing logic | 8 | Accessory slot → always true regardless of class/type, weapon slot with weaponType → delegates to `canEquipWeapon`, weapon slot without weaponType (legacy) → true, shield slot → weapon proficiency check, armor slot with armorType → delegates to `canEquipArmor`, armor slot without armorType (legacy) → true, head/chest/legs/boots → armor check |
| `getNextTier` | 7 | common→adept, adept→journeyman, journeyman→master, master→epic, epic→legendary, legendary→null, invalid string→null |
| `createEmptyEquippedGear` | 2 | Returns object with 9 slots, all null |
| `calculateBaseStatValue` | 5 | Level 1 + common (lowest), level 40 + legendary (highest), mid-range level 20 + journeyman, verify `Math.floor` rounding, formula `(level*3)+(mult*level)` matches |
| `calculateSellValue` | 7 | Each tier × level 20: common=45, adept=55, journeyman=80, master=140, epic=290, legendary=540. Formula `tierBase + (level*2)` |
| `normalizeSetId` | 5 | Path with spaces → underscores, special chars stripped, vault prefix `quests/` removed, already-clean path unchanged, mixed case → lowercase |
| `generateGearId` | 2 | Returns UUID format string (8-4-4-4-12), two calls return different values |
| `CLASS_ARMOR_PROFICIENCY` integrity | 3 | 7 classes have non-empty arrays, all values are valid ArmorType, higher-tier classes include all lower tiers |
| `CLASS_WEAPON_PROFICIENCY` integrity | 2 | 7 classes have non-empty arrays, all values are valid WeaponType |
| `TIER_INFO` integrity | 3 | 6 tiers exist, `statMultiplier` increases monotonically (0.5→1.0→1.5→2.0→2.5→3.0), `levelRange[0] <= levelRange[1]` |

**Gear subtotal: ~72 tests**

Edge cases:
- `canEquipGear` with accessory slot named `accessory3` (not just `accessory1/2`) — verify `startsWith('accessory')` catches all
- `normalizeSetId` with empty string — should return empty string, not throw
- `calculateBaseStatValue` with level 0 — should return 0

#### other-models.test.ts — Remaining model files

| Describe Block | File | Tests | Coverage |
|---|---|---|---|
| `getAvailableSkills` | Skill.ts | 5 | Filter by level ≤ character level, class-restricted skill matches, universal skill (empty requiredClass), no matching skills → empty array, all skills at max level |
| `canUseSkill` | Skill.ts | 5 | Enough mana → `{canUse: true}`, insufficient mana → `{canUse: false, reason: ...}`, `usesPerBattle` defined + already used → blocked, `usesPerBattle` defined + not used → allowed, no `usesPerBattle` → no restriction |
| `isManualQuest` / `isAIGeneratedQuest` | Quest.ts | 4 | Manual quest → true/false, AI quest → false/true, neither type → both false, crafted ambiguous data |
| `createManualQuest` | Quest.ts | 4 | Defaults present, partial overrides applied, `createdDate` set, unique `id` generated |
| `getHpPotionForLevel` / `getMpPotionForLevel` | Consumable.ts | 10 | Levels 1, 10, 20, 30, 40 for each function — correct potion tier returned |
| `DROP_RATES` / `CONSUMABLES` integrity | Consumable.ts | 4 | Drop rates sum ≤ 1.0, all CONSUMABLES have required fields (id, name, type, effect), no duplicate IDs |
| `isDoTEffect` | StatusEffect.ts | 4 | burn=true, poison=true, paralyze=false, confusion=false |
| `isHardCC` | StatusEffect.ts | 4 | paralyze=true, sleep=true, freeze=true, stun=true, burn=false |
| `getStatusDisplayName` / `getStatusIcon` | StatusEffect.ts | 4 | Each effect type returns non-empty display name and icon |
| `validateColumnId` | CustomColumn.ts | 5 | Valid ID passes, empty ID fails, special chars fail, spaces fail, reserved words |
| `validateColumn` | CustomColumn.ts | 5 | Valid column passes, missing title fails, empty title fails, missing ID fails, `DEFAULT_COLUMNS` pass validation |
| `isUnlocked` / `getProgressPercent` | Achievement.ts | 6 | Unlocked=true, locked=false, 0% progress, 50% progress, 100% progress, counter exceeding target |

**Other models subtotal: ~59 tests (this is a continuation of the Gear file session)**

Error paths:
- `canUseSkill` with negative mana cost skill — should still work (free skill)
- `getHpPotionForLevel` with level 0 — should return lowest tier
- `validateColumn` with extremely long title — should still pass (length validation is separate)

**Session 12C Total: ~131 tests**

**Running coverage total: Models ~70% → ~85%+**

---

### Session 13 — Combat Config (~86 tests)

**Purpose:** Test all 4 exported functions and validate critical balance constants in `combatConfig.ts` (498 lines). These functions drive combat damage, monster scaling, and gear tier expectations.

**File:** `test/config/combat-config.test.ts`

**Infrastructure needed:** None — all functions are pure math with no dependencies.

| Describe Block | Tests | Coverage |
|---|---|---|
| `getLevelModifier` — per class | 35 | 7 classes × levels 1, 10, 20, 30, 40. Each returns `{damage: number, hp: number}` with both values ≥ 0. Verify class-specific scaling differences (Warrior should have higher damage mod than Scholar at same level) |
| `getLevelModifier` — edge cases | 5 | Level 0, level 41, negative level (should not crash), fractional level (should floor), verify modifiers increase monotonically per class |
| `getStageMultiplier` | 15 | Stages -6 through +6 (13 values), stage 0 === 1.0, negative stages < 1.0, positive stages > 1.0, stage -7 (clamped to -6), stage +7 (clamped to +6) |
| `getExpectedTierForLevel` | 9 | Levels 1, 5, 10, 15, 20, 25, 30, 35, 40 → correct GearTier string returned |
| `getMonsterPowerMultiplier` | 10 | Same level ranges, verify monotonically increasing, level 1 is lowest, level 40 is highest, mid-range values plausible |
| Constants integrity — stamina | 4 | `MAX_STAMINA` is a positive integer, `MAX_DAILY_STAMINA` ≤ `MAX_STAMINA`, `STAMINA_PER_TASK` > 0, `STAMINA_PER_TASK` ≤ `MAX_DAILY_STAMINA` |
| Constants integrity — combat | 4 | `CRIT_MULTIPLIER` > 1.0, `DODGE_CAP` between 0 and 100, `BASE_HIT_CHANCE` between 0 and 100, `FLEE_CHANCE` between 0 and 100 |
| Constants integrity — attack styles | 4 | `ATTACK_STYLES` has entries for all 7 classes, each has `name` and `multiplier`, multipliers > 0 |

Edge cases:
- `getLevelModifier` with same level for Warrior vs Scholar — Warrior damage modifier should be higher
- `getStageMultiplier` verifies stage 0 is exactly 1.0 (not approximately)
- `TYPE_CHART` symmetry: if Fire is strong vs Ice, verify the reverse relationship exists

**Session 13 Total: ~86 tests**

**Running coverage total: Config 48% → ~90%+**

---

### Session 14A — Quest Store & Filter Store (~50 tests)

**Purpose:** Test the two simplest Zustand stores. Quest store is 157 lines with basic CRUD. Filter store is 195 lines with toggle logic. Includes integration tests verifying filter→quest pipeline.

**Files:** `test/stores/quest-store.test.ts` + `test/stores/filter-store.test.ts` + `test/integration/filter-quest-pipeline.test.ts`

**Infrastructure needed:** Store reset in `beforeEach` — both stores need `reset()` or `clear()` methods. `questStore` already has `clear()` (line 107). `filterStore` needs a `reset()` method added (or use `useStore.setState(initialState)`).

> [!NOTE]
> Zustand stores tested directly via `useStore.getState()` / `useStore.setState()` — no React required. Follows the same pattern as Part 1's Session D2 (battleStore).

#### quest-store.test.ts — questStore.ts (157 lines)

| Describe Block | Tests | Coverage |
|---|---|---|
| `setQuests` | 3 | Set empty array, set populated array, replaces previous quests entirely |
| `upsertQuest` | 3 | Add new quest (not in store), update existing quest (same ID overwrites), verify other quests remain untouched |
| `removeQuest` | 3 | Remove existing, remove non-existent ID (no-op, no crash), verify remaining quests unaffected |
| `updateQuestStatus` | 3 | Valid quest → status changes, invalid quest ID → no-op, verify other fields preserved |
| `clear` | 1 | Clears all quests to empty array |
| `selectAllQuests` | 2 | Empty store → empty array, populated store → all quests |
| `selectQuestsByStatus` | 3 | Matching status returns subset, non-matching → empty, multiple statuses mixed → correct subset |
| `selectQuestById` | 2 | Found → quest object, not found → undefined |
| `selectQuestsByCategory` | 3 | Matching category, case-sensitive (no match on different case), empty category → empty |

**Subtotal: ~23 tests**

#### filter-store.test.ts — filterStore.ts (195 lines)

| Describe Block | Tests | Coverage |
|---|---|---|
| `toggleCategory` | 3 | Toggle on (adds to set), toggle off (removes from set), multiple categories active simultaneously |
| `togglePriority` | 2 | Toggle on, toggle off |
| `toggleTag` | 3 | Toggle on, toggle off, multiple tags active |
| `toggleType` | 2 | Toggle on, toggle off |
| `setSearchQuery` | 2 | Set non-empty query, clear query (empty string) |
| `setSortOption` | 2 | Set sort field, direction toggle asc/desc |
| `clearFilters` | 2 | Clears all category/priority/tag/type filters, resets search query |
| `hasActiveFilters` | 3 | No filters active → false, one category filter → true, search query set → true |
| Kanban vs. Sidebar independence | 2 | Set filter on kanban store → sidebar unaffected, set filter on sidebar → kanban unaffected |

**Subtotal: ~21 tests**

#### Integration: Filter → Quest Pipeline (~6 tests)

**File:** `test/integration/filter-quest-pipeline.test.ts`

| Test | What It Validates |
|---|---|
| Category filter reduces quest list | Set 5 quests (3 categories), toggle 1 category, `selectQuestsByCategory` returns only matching |
| Priority filter reduces quest list | Set quests with mixed priorities, toggle high priority, verify correct subset |
| Multi-filter combination | Category + priority applied together, only quests matching BOTH pass |
| Search query filters by title | Set quests, search term matches 2/5 titles, verify correct 2 returned |
| `clearFilters` restores full list | Apply filters → clear → all quests visible again |
| Empty store + active filters | No quests loaded, filters active → empty result (no crash) |

Error paths:
- Filter store with invalid category string — should toggle without crash
- `selectQuestsByStatus` with status that matches no configured columns — returns empty (not crash)

**Session 14A Total: ~50 tests**

**Running coverage total: Stores 7.3% → ~25%**

---

### Session 14B — Character Store (~90 tests)

**Purpose:** Test the largest store (`characterStore.ts`, 1131 lines, 40+ actions). This store manages the entire character lifecycle: creation, XP/leveling, gear, stamina, combat stats, streaks, power-ups, skills, and persistence.

**File:** `test/stores/character-store.test.ts`

**Infrastructure needed:**
- Store `reset()` method — `characterStore` has no `clear()` or `reset()`. Add one, or use `useCharacterStore.setState({ character: null })` in `beforeEach`.
- Mock `crypto.randomUUID` — already shimmed in `test/setup.ts`.
- Mock for `getStarterGearForClass` — imported from `data/starterGear.ts`, returns gear items per class.

| Describe Block | Tests | Coverage |
|---|---|---|
| `createCharacter` — per-class | 7 | All 7 classes: character created with correct class, name, starting stats |
| `createCharacter` — formulas | 3 | HP matches `calculateMaxHP(baseStats, 1)`, Mana matches `calculateMaxMana(baseStats, 1)`, starter gear assigned from `getStarterGearForClass` |
| `addXP` — training mode | 5 | XP accumulates in `trainingXP`, training level increases at threshold, cap at training level 10, no character → no-op, XP doesn't affect main level |
| `addXP` — normal mode | 6 | XP accumulates in `totalXP`, level-up at threshold, correct new level calculated, `lastModified` updates, new maxHP/maxMana recalculated on level-up, XP past level-up threshold preserved (not reset) |
| `updateGold` | 4 | Add positive gold, subtract gold, gold floors at 0 (never negative), large gold values |
| `addGear` | 4 | Add to empty inventory, add to populated inventory, inventory limit reached → rejected/capped, verify gear item in `gearInventory` |
| `equipGear` | 6 | Equip to empty slot succeeds, swap equipped↔inventory (old item goes to inventory, new equips), wrong slot type returns false, class restriction fails (via `canEquipGear`) returns false, item not in inventory returns false, no character returns false |
| `unequipGear` | 3 | Unequip to inventory succeeds, slot already empty → no-op, inventory full → rejected |
| `awardStamina` | 6 | Normal grant (adds to stamina), daily cap reached → truncated grant, new day resets `staminaGainedToday` counter, max stamina cap enforced, partial grant near cap, no character → no-op |
| `consumeStamina` | 3 | Normal consume, insufficient stamina → returns false, exact boundary (stamina = cost) → succeeds |
| `fullRestore` | 3 | Restores `currentHP` to `maxHP`, `currentMana` to `maxMana`, `status` to 'active', clears `recoveryTimerEnd` |
| `addInventoryItem` / `removeInventoryItem` | 6 | Add new consumable, stack existing (quantity increments), remove single stack (quantity decrements), remove all stacks (item removed), remove non-existent → no-op, add when at limit |
| `bulkRemoveGear` / `bulkAddGear` | 6 | Remove multiple items, gold calculated correctly (sum of sell values), empty list → no-op, items not found → skipped, bulk add multiple, bulk add respects inventory limit |
| `markGearPendingSmelt` / `clearPendingSmeltStatus` | 4 | Mark 3 items as pending, clear marks restores all, mark non-existent ID → no-op, clear with no pending → no-op |
| `updateTrainingProgress` | 3 | Toggle training mode on, toggle off, training XP/level preserved across toggles |
| `updateAppearance` | 3 | Partial update (one field), full update, `spriteVersion` increments on appearance change |
| `updateStats` | 3 | Set stat bonuses, category XP accumulator updated, `lastModified` changes |
| `updateStreak` | 5 | Increment streak, reset streak to 0, highest streak tracks max, Paladin shield protects from reset, shield consumed after use |
| `updateHP` / `updateMana` | 4 | Clamp to max (can't exceed maxHP), clamp to 0 (never negative), normal update, heal + damage in sequence |
| `addActivityHistory` | 3 | Add event to empty history, cap at `MAX_ACTIVITY_HISTORY`, oldest entry trimmed when over cap |
| `updateSkills` | 3 | Equip skill to loadout, unequip from loadout, max loadout size enforced |
| `addPowerUp` / `removePowerUp` / `clearExpiredPowerUps` | 4 | Add power-up to array, remove by ID, clear based on expiry timestamp, active (non-expired) preserved |
| `getPersistedState` / `loadPersistedState` | 3 | Round-trip: persist → load → identical state, null character → persists and loads cleanly, verify `lastModified` survives round-trip |

Edge cases:
- `addXP` with 0 XP — no level change, no callbacks
- `equipGear` with `accessory1` slot when `accessory1` occupied and `accessory2` empty — verify correct slot used
- `awardStamina` across midnight boundary (different `lastStaminaResetDate`) — daily counter resets
- `updateStreak` with Paladin shield already used this week — streak resets normally

Error paths (3 tests):
- `equipGear` with corrupt `gearInventory` (contains null entries) — should not crash
- `loadPersistedState` with malformed JSON — should fall back to default state
- `createCharacter` when character already exists — should overwrite or reject (document which)

**Session 14B Total: ~90 tests**

**Running coverage total: Stores ~25% → ~60%**

---

### Session 14C — Battle, Dungeon, UI, TaskSection Stores + Integration (~80 tests)

**Purpose:** Test remaining 4 stores plus integration tests verifying store↔model cross-dependencies.

**Files:** `test/stores/battle-store.test.ts` + `test/stores/other-stores.test.ts` + `test/integration/store-model.test.ts`

**Infrastructure needed:**
- `battleStore` already has `resetBattle()`.
- `dungeonStore`, `uiStore`, `taskSectionsStore` need `reset()` methods.
- Battle store tests need mock TileRegistry data for dungeon store tests.

#### battle-store.test.ts — battleStore.ts (475 lines)

| Describe Block | Tests | Coverage |
|---|---|---|
| `startBattle` | 3 | Initializes player HP from character, monster HP from template, sets state to `'fighting'`, battle log starts with encounter entry |
| `endBattle` | 3 | Victory: state → `'victory'`, sets `battleResult`. Defeat: state → `'defeat'`. Clears combat-specific data |
| `selectAction` | 3 | Select 'attack' → action stored, select skill → skill ID stored, select 'flee' → flee action stored |
| `advanceState` | 4 | Turn progression alternates player/monster, monster HP ≤ 0 triggers victory, player HP ≤ 0 triggers defeat, turn counter increments |
| `updatePlayerHP` / `updateMonsterHP` | 6 | Normal damage reduces HP, overkill clamped to 0 (not negative), healing clamped to maxHP, heal from 0, damage from max, verify both player and monster variants |
| `addLogEntry` | 3 | Add entry to empty log, entries accumulate in order, formatted text preserved |
| `recoverFromCrash` | 2 | Mid-battle recovery restores last stable state, idle state → no-op |
| `applyStatusEffect` / `tickStatusEffects` | 5 | Apply burn DoT, tick reduces duration and deals damage, duration 0 → effect removed, multiple effects tick independently, buff effect applies stat modifier |

**Subtotal: ~29 tests**

Edge cases:
- `startBattle` when already in `'fighting'` state — should reset or reject
- `advanceState` when battle is in `'victory'` or `'defeat'` — should no-op
- `tickStatusEffects` with empty effects array — no crash

#### other-stores.test.ts — dungeonStore + uiStore + taskSectionsStore

##### dungeonStore.ts (421 lines)

| Describe Block | Tests | Coverage |
|---|---|---|
| `enterDungeon` | 3 | Sets current dungeon, player position at spawn, room index at 0 |
| `exitDungeon` | 2 | Clears dungeon state, returns to idle |
| `movePlayer` | 4 | Valid move updates position, wall tile blocks movement, out of bounds blocked, diagonal move (if supported) |
| `changeRoom` | 3 | Room index updates, player respawns at spawn of new room, room history preserved |
| `markChestOpened` / `markMonsterKilled` | 4 | Mark new chest/monster as interacted, already-marked → no-op (no duplicate), chest ID + room tracked, monster ID + room tracked |
| `recordVisitedTile` | 2 | New tile recorded in visited set, already-visited → no-op |
| `loadPersistedState` / `getPersistedState` | 3 | Round-trip with dungeon in progress, null state (not in dungeon), mid-dungeon with visited tiles |

**Subtotal: ~21 tests**

##### uiStore.ts (149 lines)

| Describe Block | Tests | Coverage |
|---|---|---|
| `setActiveTab` | 3 | Switch to kanban tab, switch to sidebar tab, same tab → no-op |
| `toggleSidebar` / `toggleShowCompleted` | 4 | Toggle sidebar on/off, toggle show completed on/off |
| Modal open/close helpers | 4 | Open modal sets flag, close modal clears flag, multiple modals can be tracked, close non-open modal → no-op |
| `getPersistedState` / `loadPersistedState` | 2 | Round-trip preserves tab/sidebar/completed prefs |

**Subtotal: ~13 tests**

##### taskSectionsStore.ts (76 lines)

| Describe Block | Tests | Coverage |
|---|---|---|
| `setSections` | 3 | Set sections for one quest, overwrite existing quest sections, new quest doesn't affect others |
| `removeQuestSections` | 2 | Remove existing quest → sections gone, remove non-existent quest → no-op |
| `setAllSections` | 2 | Bulk set replaces all sections data, empty object clears all |
| `clear` | 1 | Clears all quest sections |

**Subtotal: ~8 tests**

#### Integration: Store ↔ Model Cross-Dependencies (~9 tests)

**File:** `test/integration/store-model.test.ts`

These tests verify that store actions correctly invoke model-level validation functions — not mocked.

| Test | Services Wired | What It Validates |
|---|---|---|
| `equipGear` validates class restrictions via `canEquipGear` | characterStore + Gear model | Set Warrior character, try equipping staff (Scholar weapon) → fails, try sword → succeeds |
| `equipGear` validates armor class via `canEquipArmor` | characterStore + Gear model | Set Scholar character, try equipping plate armor → fails, cloth → succeeds |
| `equipGear` allows accessories for any class | characterStore + Gear model | Any class can equip accessory items regardless of type |
| `addXP` level-up recalculates HP/Mana via `calculateMaxHP`/`calculateMaxMana` | characterStore + Character model | XP triggers level up, verify new maxHP = `50 + (con*5) + (newLevel*10)`, maxMana follows formula |
| Level-up mid-training (addXP in training mode) | characterStore + Character model | Training XP level-up doesn't affect main character level or HP/Mana |
| `createCharacter` assigns correct starter gear via `getStarterGearForClass` | characterStore + starterGear data | Each class gets class-appropriate gear (Warrior gets sword+plate, Scholar gets staff+cloth) |
| `battleStore.startBattle` reads character HP from `characterStore` | battleStore + characterStore | Player battle HP matches `characterStore.character.currentHP` |
| `dungeonStore.enterDungeon` → `movePlayer` → `exitDungeon` lifecycle | dungeonStore | Full dungeon lifecycle: enter, move 3 tiles, exit → clean state |
| `bulkRemoveGear` calculates gold via `calculateSellValue` | characterStore + Gear model | Remove 3 items of different tiers → gold awarded matches sum of individual `calculateSellValue` |

Error paths (1 test):
- `equipGear` with gear item that has `slot: 'weapon'` but `weaponType: undefined` (legacy) — should succeed per `canEquipGear` legacy handling

**Session 14C Total: ~80 tests**

**Running coverage total: Stores ~60% → ~85%+**

---

### Session 15A — Validators & Safe JSON (~42 tests)

**Purpose:** Test security-critical validation and JSON parsing utilities. These guard against XSS, prototype pollution, and malformed data.

**File:** `test/utils/validators.test.ts`

**Infrastructure needed:** None — all functions are pure.

| Describe Block | File | Tests | Coverage |
|---|---|---|---|
| `validateQuest` — valid | validator.ts | 2 | Minimal valid quest passes, fully populated quest passes |
| `validateQuest` — invalid | validator.ts | 10 | Missing title, missing status, missing priority, invalid status string, invalid priority value, wrong schema version, null input, undefined input, empty object, extra fields tolerated |
| `validateCharacter` — valid | validator.ts | 1 | Fully populated character passes |
| `validateCharacter` — invalid | validator.ts | 7 | Missing name, missing class, invalid class enum, wrong schema version, null input, missing stats, missing level |
| `validateGearItem` — valid | validator.ts | 1 | Fully populated gear passes |
| `validateGearItem` — invalid | validator.ts | 7 | Invalid tier, invalid slot, invalid source, missing name, missing stats, null input, empty object |
| `safeJsonParse` | safeJson.ts | 8 | Valid JSON, strips `__proto__` key, strips `constructor` key, strips `prototype` key, nested dangerous keys at depth 2, deeply nested (depth 5) dangerous keys, array containing dangerous objects, mixed safe + dangerous keys |
| `safeJsonParseOrDefault` | safeJson.ts | 4 | Valid JSON returns parsed, invalid JSON returns default value, empty string returns default, whitespace-only returns default |
| `safeJsonStringify` | safeJson.ts | 2 | Normal object serializes, circular reference handled gracefully (no throw) |

Edge cases:
- `validateQuest` with status matching a deleted column ID — should pass validator (column validation is separate)
- `safeJsonParse` with deeply nested `__proto__` at depth 10 — verify recursive stripping
- `safeJsonParse` with `__proto__` as a value (not key) — should NOT strip

Error paths:
- `safeJsonParse` with actual JavaScript injection payload — verify clean output
- `validateGearItem` with negative stat values — should pass (validation allows negative for debuffs)

**Session 15A Total: ~42 tests**

**Running coverage total: Utils ~75% → ~80%**

---

### Session 15B — Sanitizer, Formatters, Column Migration (~70 tests)

**Purpose:** Test HTML sanitization (XSS prevention), all gear/skill/time formatters, and column migration utilities.

**Files:** `test/utils/sanitizer.test.ts` + `test/utils/formatters.test.ts`

**Infrastructure needed:** `DOMPurify` mock or actual — depends on if sanitizer uses it directly or wraps it.

#### sanitizer.test.ts

| Describe Block | Tests | Coverage |
|---|---|---|
| `sanitizeHtml` — strips dangerous | 4 | `<script>alert('xss')</script>` stripped, `<img onerror="...">` handler removed, `javascript:` protocol stripped, `<iframe>` stripped |
| `sanitizeHtml` — preserves safe | 4 | `<b>bold</b>` preserved, `<em>italic</em>` preserved, `<ul><li>item</li></ul>` preserved, `<br>` preserved |
| `sanitizeText` | 3 | Strips all HTML tags, preserves plain text, empty string → empty |
| `validateLength` | 4 | Under limit → passes, at limit → passes, over limit → truncated + warning, zero-length → passes |
| `sanitizeQuestTitle` | 3 | Valid title passes, empty title → fallback, over-length → truncated |
| `sanitizeCharacterName` | 3 | Valid name passes, empty name → fallback, special chars preserved (apostrophes, accents) |
| `sanitizeTags` | 3 | Valid tags pass, empty tags → empty array, duplicate tags deduplicated |

**Subtotal: ~24 tests**

#### formatters.test.ts

| Describe Block | File | Tests | Coverage |
|---|---|---|---|
| `formatGearTooltip` | gearFormatters.ts | 8 | Each tier has correct color class, set item shows set indicator, legendary shows special styling, all stat types displayed, weapon shows damage, armor shows defense, empty stats → minimal tooltip, accessory formatting |
| `formatGearStatsSummary` | gearFormatters.ts | 5 | Primary stat displayed, secondary stats listed, combat bonuses (crit/dodge) shown, empty combonuses → omitted, single stat item |
| `isSetItem` / `getStatDiffClass` / `formatStatDiff` | gearFormatters.ts | 8 | Has setId → true, no setId → false, positive diff → green class, negative → red, zero → neutral, positive displays +N, negative displays -N, zero hidden |
| `buildGearStatsHtml` / `buildComparisonSummaryHtml` | gearFormatters.ts | 6 | Full item → complete HTML, empty stats → minimal HTML, comparison with upgrade → green highlights, comparison with downgrade → red, comparison same stats → neutral, missing equipped item (empty slot comparison) |
| `skillFormatters` (all exports) | skillFormatters.ts | 8 | Damage skill formatting, heal skill formatting, buff formatting, debuff formatting, mana cost display, cooldown display, skill type icon, multi-hit skill display |
| `timeFormatters` (all exports) | timeFormatters.ts | 6 | Format seconds as "Xm Ys", format date as relative ("2 days ago"), format timestamp ISO → readable, zero seconds edge, negative time edge, very large time |
| `columnMigration` — `findQuestsWithInvalidStatus` | columnMigration.ts | 5 | All quests valid → empty result, some invalid → lists them, empty quest list → empty, empty column list → all invalid, quest with deleted column status → flagged |

**Subtotal: ~46 tests**

Edge cases:
- `sanitizeHtml` with nested dangerous tags (`<div><script>...</script></div>`) — script stripped, div preserved
- `formatGearTooltip` with legendary set item — both legendary and set styling applied
- `findQuestsWithInvalidStatus` with quest whose status matches no column but is the default status — behavior documented

**Session 15B Total: ~70 tests**

**Running coverage total: Utils ~80% → ~90%+**

---

### Session 16 — Data Integrity (~53 tests)

**Purpose:** Validate all static data files for structural correctness. These guard against typos, missing fields, and broken references in game balance data that would cause runtime crashes.

**File:** `test/data/data-integrity.test.ts`

**Infrastructure needed:** None — all tests are property-based validation of imported constants.

| Describe Block | File | Tests | Coverage |
|---|---|---|---|
| Monster templates | monsters.ts | 8 | All templates have `id`, `name`, `category`, `tier`, `baseHP > 0`, `baseATK > 0`. Unique IDs (no duplicates). Valid categories match enum. Valid tiers match `GearTier` |
| Monster skills | monsterSkills.ts | 6 | All skills have `id`, `name`, `type` ∈ valid types, `manaCost ≥ 0`, effects array non-empty, unique IDs |
| Player skills | skills.ts | 12 | All have required fields, `getUnlockedSkills` per class returns non-empty at level 1, all 7 classes have class-specific skills, universal skills (empty `requiredClass`) exist, `learnLevel` > 0 for all, level 40 unlocks all skills, no duplicate skill IDs, mana costs reasonable (0-100), each skill type (damage/heal/buff/debuff/special) has at least one representative |
| Achievements | achievements.ts | 6 | All have unique IDs, valid trigger types, valid categories, no duplicate triggers for same event, default achievements array non-empty, progress thresholds > 0 |
| Starter gear | starterGear.ts | 8 | Exists for all 7 classes, valid slots (weapon + armor pieces), valid tiers (common), stats well-formed (non-negative values), class-appropriate weapon types (Warrior gets sword, not staff), class-appropriate armor types, IDs unique across all classes |
| Unique items | uniqueItems.ts | 5 | All have `isUnique: true`, valid stats, unique IDs, valid slots, lore text non-empty |
| Tile registry | TileRegistry.ts | 8 | `getTileDefinition` returns definition for wall/floor/spawn/chest/monster chars in all 4 tilesets (cave, forest, dungeon, castle), unknown char → undefined, `findSpawnPosition` finds spawn in valid layout, `findSpawnPosition` returns null for layout with no spawn tile |

Edge cases:
- Monster with tier `'legendary'` has correspondingly high baseHP/baseATK
- Skills with `usesPerBattle: 1` — verify they exist and are correctly flagged
- Starter gear for all classes equips without class restriction errors (cross-reference with `canEquipGear`)

**Session 16 Total: ~53 tests**

**Running coverage total: Data 57.5% → ~85%+**

---

### Session 17 — Hooks: Pure Functions + Integration (~28 tests)

**Purpose:** Test exported pure functions from hooks. These functions extract tags/categories/types from quest arrays and sort them. Includes integration tests verifying hook functions work correctly with store data.

**File:** `test/hooks/hooks.test.ts` + `test/integration/hook-store.test.ts`

**Infrastructure needed:** Quest store needs test data pre-loaded via `useQuestStore.setState()`.

> [!NOTE]
> React hooks themselves (`useFilteredQuests`, `useQuestLoader`, etc.) require a React test harness. This session tests only the **exported pure helper functions** from those hook files. React-level hook testing is deferred to Session 19.

#### Unit tests — pure functions

| Describe Block | File | Tests | Coverage |
|---|---|---|---|
| `collectAllTags` | useFilteredQuests.ts | 5 | Empty quests → empty array, quests with tags → all unique tags, deduplication (same tag on multiple quests), sorted alphabetically, quests with no tags field → empty |
| `collectAllCategories` | useFilteredQuests.ts | 5 | Same pattern: empty, populated, deduplicated, sorted, undefined category → skipped |
| `collectAllTypes` | useFilteredQuests.ts | 5 | Same pattern: empty, populated, deduplicated, sorted, undefined type → skipped |
| `sortQuests` (if exported) | useFilteredQuests.ts | 8 | Sort by priority ascending (trivial first), priority descending (epic first), sort by title alphabetical, sort by due date (nearest first), sort by created date (newest first), stable sort (same priority preserves order), undefined priority → sorts to end, empty array → empty |

**Subtotal: ~23 tests**

#### Integration: Hook Functions + Store Data (~5 tests)

**File:** `test/integration/hook-store.test.ts`

| Test | What It Validates |
|---|---|
| `collectAllTags` reads from quest store | Load 5 quests with various tags into store, call `collectAllTags(useQuestStore.getState().quests)`, verify accurate aggregation |
| `collectAllCategories` with mixed categories | 3 quests with categories, 2 without → returns only the 3 valid categories |
| `sortQuests` by priority + stable ordering | 4 quests: 2 high, 2 low. Sort descending. Verify high comes first, and within same priority the original order is preserved |
| Filter + sort pipeline | Apply category filter → sort by priority → verify output is both filtered AND sorted |
| Empty store edge case | No quests loaded, all collect functions → empty arrays, sort → empty array |

**Session 17 Total: ~28 tests**

**Running coverage total: Hooks 0% → ~60%+ (remaining % is React-specific hook logic deferred to Session 19)**

---

### Session 18A — Modals: CreateQuest & ColumnManager (~47 tests)

**Purpose:** Test business logic extracted from the two most complex configuration modals. These modals have form validation, data transformation, and save logic that's testable without DOM rendering.

**Files:** `test/modals/create-quest.test.ts` + `test/modals/column-manager.test.ts`

**Infrastructure needed:**
- Mock Obsidian `Modal` base class — constructor, `contentEl`, `close()`, `open()`. Already in `test/mocks/obsidian.ts`.
- Mock `App` with `vault` methods — for `saveQuestWithBody`.
- Mock `Notice` — imported from Obsidian, used for validation errors.
- Mock `useQuestStore` — for `loadExistingCategories`.

> [!NOTE]
> Modals extend Obsidian's `Modal` class. We test extractable business logic by: (1) mocking the `Modal` base class, (2) instantiating the modal, and (3) calling logic methods directly without DOM rendering. This avoids needing a full DOM environment.

#### create-quest.test.ts — CreateQuestModal.ts (554 lines)

| Describe Block | Tests | Coverage |
|---|---|---|
| Constructor | 3 | Default form data has 14 fields initialized, `formData.title` is empty string, `formData.priority` has correct default |
| `loadExistingCategories` | 3 | Loads unique categories from quest store, empty store → empty list, categories sorted alphabetically |
| `loadAvailableTypes` | 4 | Scans quest folder structure for types, empty folder → empty list, nested folders detected, duplicate types deduplicated |
| `getTypeEmoji` | 4 | 'main' → ⚔️, 'daily' → 📅, 'side' → 📜, unknown type → default 📋 (or equivalent) |
| `titleCase` | 4 | 'hello world' → 'Hello World', 'HELLO' → 'Hello', single word, empty string → empty |
| `handleCreate` — validation | 3 | Empty title → shows Notice, valid form → calls save, missing required fields → shows specific error |
| `handleCreate` — save logic | 3 | Creates quest object with correct fields from form data, `createdDate` set to current time, quest upserted to store |
| `saveQuestWithBody` | 5 | Successful file creation, file already exists → appends number, frontmatter formatted with `---` delimiters, body content preserved below frontmatter, special characters in title escaped in filename |

**Subtotal: ~29 tests**

Edge cases:
- `titleCase` with mixed whitespace (tabs, double spaces) — should handle gracefully
- `handleCreate` with title containing path separators (`/`, `\`) — should sanitize for filename
- `loadAvailableTypes` with deeply nested folder structure — should only go 1 level deep

Error paths (2 tests):
- `saveQuestWithBody` when `vault.create` throws — error surfaced via Notice
- `loadExistingCategories` when quest store contains quests with undefined category — skip without crash

#### column-manager.test.ts — ColumnManagerModal.ts (476 lines)

| Describe Block | Tests | Coverage |
|---|---|---|
| Constructor | 2 | Loads existing columns from plugin settings, columns deep-copied (not reference) |
| Drag-and-drop reorder | 4 | `handleDrop` reorder position 0→2 (first to third), 2→0 (third to first), same position → no-op, reorder preserves all column data |
| `handleDeleteColumn` | 4 | Delete non-completion column → removed + quests migrated to first column, delete last column → blocked with Notice, delete completion column → warning about losing completion status, migration count reported |
| `handleSave` — validation | 4 | Valid columns → saved to settings, empty column list → blocked, duplicate column IDs → rejected, column with empty title → rejected |
| Add column form | 4 | Valid new column → added to list, duplicate ID → rejected with Notice, empty title → rejected, auto-generated ID from title (slugified) |

**Subtotal: ~18 tests**

Edge cases:
- Reorder when only 1 column exists — should no-op
- Delete all columns down to 1 — last one becomes undeletable
- Add column with title containing emoji — ID generation handles unicode

**Session 18A Total: ~47 tests**

**Running coverage total: Modals 13.6% → ~25%**

---

### Session 18B — Modals: Inventory, Blacksmith, & Medium-Logic + Integration (~89 tests)

**Purpose:** Test the gear management modals (inventory filtering/sorting, smelting logic) and group-test 8 medium-complexity modals. Includes integration tests verifying modal→store→model flows.

**Files:** `test/modals/inventory.test.ts` + `test/modals/blacksmith.test.ts` + `test/modals/medium-modals.test.ts` + `test/integration/modal-store-flow.test.ts`

**Infrastructure needed:**
- Same modal mocks as Session 18A.
- Mock `useCharacterStore` — for inventory data, gear operations.
- Mock `SmeltingService` — for blacksmith `performSmelt`.
- Mock `showLootModal` — called after successful smelt.

#### inventory.test.ts — InventoryModal.ts (580 lines)

| Describe Block | Tests | Coverage |
|---|---|---|
| `applyFilters` | 6 | No filters → all items pass, slot filter → only matching slots, tier filter → only matching tiers, both filters → AND logic, no matches → empty array, filter with empty inventory → empty |
| `applySorting` | 8 | Sort by tier ascending, tier descending, level ascending, level descending, name ascending (alphabetical), name descending, slot grouping, default sort (tier desc) |
| `handleSortClick` | 3 | Click same field → toggle direction (desc→asc), click different field → switch to that field + reset to desc, initial state is tier desc |
| `toggleSlotFilter` / `toggleTierFilter` | 5 | Toggle slot on (adds), toggle off (removes), multiple active, toggle tier on, toggle tier off |
| `clearFilters` | 2 | Resets all slot + tier filters, sort reset to default |
| `equipItem` | 3 | Calls `characterStore.equipGear`, handles failure (re-renders), success closes or refreshes |
| `sellItem` | 3 | Calls `characterStore.bulkRemoveGear([item])`, gold value displayed correctly, item removed from view |
| `useConsumable` | 4 | HP potion → `currentHP` increases (capped at max), MP potion → `currentMana` increases, insufficient quantity → rejected, consumable removed from inventory after use |

**Subtotal: ~34 tests**

Edge cases:
- `applySorting` with items that have identical tier and name — stable sort
- `applyFilters` with slot filter `'accessory1'` — verify accessories are matched
- `useConsumable` when character is at full HP — potion still consumed (or wasted — document behavior)

#### blacksmith.test.ts — BlacksmithModal.ts (399 lines)

| Describe Block | Tests | Coverage |
|---|---|---|
| `performSmelt` — happy path | 3 | 3 same-tier items → next tier output, gold cost deducted from character, output item added to inventory |
| `performSmelt` — validation | 3 | Fewer than 3 items → blocked with Notice, legendary tier items → blocked (no next tier), mixed tiers → blocked |
| Item selection | 5 | Select item adds to selection, deselect removes, select wrong tier (doesn't match first selected) → blocked, select 4th item → blocked (max 3), selected items highlighted in UI state |
| Tier filter | 3 | Filter by specific tier → only that tier shown, 'all' filter → all tiers shown, filter with 0 matching items → empty message |

**Subtotal: ~14 tests**

Edge cases:
- Select 3 items then deselect 1 → should allow reselection
- Smelt when character has 0 gold and cost > 0 → blocked

#### medium-modals.test.ts — Grouped medium-logic modals

| Modal | Describe Block | Tests | Coverage |
|---|---|---|---|
| `CharacterCreationModal` (249 lines) | Class selection + create | 5 | Valid name + class → `createCharacter` called, empty name → blocked with Notice, class selection updates preview, all 7 classes selectable, transitions to training mode |
| `SkillLoadoutModal` | Equip/unequip | 5 | Equip skill → added to loadout, unequip → removed, max 5 skills enforced, class-restricted skill → only shown for matching class, duplicate skill → blocked |
| `LevelUpModal` | Display + allocation | 4 | Correct tier displayed for level, stat point allocation UI, allocated point persisted, all stats allocatable |
| `StoreModal` | Purchase | 4 | Purchase item → gold deducted + item added, insufficient gold → blocked, inventory full → blocked, item price displayed correctly |
| `PaidRestModal` | Cost + restoration | 4 | Rest cost calculated from level, HP restoration amount displayed, Mana restoration displayed, insufficient gold → blocked |
| `RecoveryOptionsModal` | Timer + cost | 4 | Recovery timer calculates from death penalty, gold cost option displayed, free recovery timer shown, active timer countdown |
| `DungeonSelectionModal` | Availability | 4 | Key requirement checked (have keys → enabled), no keys → disabled, dungeon availability filtered by level, completed dungeons marked |
| `BountyModal` | Selection + reward | 4 | Monster selection from available list, reward calculation displayed, level-appropriate monsters shown, empty monster list → message |

**Subtotal: ~34 tests**

#### Integration: Modal → Store → Model Flows (~7 tests)

**File:** `test/integration/modal-store-flow.test.ts`

| Test | Services Wired | What It Validates |
|---|---|---|
| `InventoryModal.equipItem` → `characterStore.equipGear` → `canEquipGear` | Modal + Store + Model | Full equip pipeline: modal calls store, store validates via model, gear moves from inventory to equipped slot |
| `InventoryModal.equipItem` with class restriction | Modal + Store + Model | Scholar tries equipping plate → `canEquipGear` returns false → store rejects → modal shows error |
| `BlacksmithModal.performSmelt` → `SmeltingService` → `characterStore` | Modal + Service + Store | Smelt 3 common items → 1 adept item created, gold deducted, 3 items removed from inventory, 1 item added |
| `CreateQuestModal.handleCreate` → `questStore.upsertQuest` | Modal + Store | Form data → quest object → upserted in store with correct fields |
| `CharacterCreationModal.create` → `characterStore.createCharacter` → `Character.createCharacter` | Modal + Store + Model | Name + class from modal → store action → model factory → character in store |
| `ColumnManagerModal.handleSave` → settings update → `ColumnConfigService.invalidateCache` | Modal + Settings + Service | Save columns → settings updated → cache cleared → new columns returned on next query |
| `ColumnManagerModal.handleDelete` → quest migration | Modal + Store | Delete column → quests in that column migrated to first column in quest store |

**Session 18B Total: ~89 tests**

**Running coverage total: Modals ~25% → ~50%+**

---

### Session 18C — Low-Logic Modals (Audit Only)

**Purpose:** Document the 27+ modals that are primarily DOM rendering with minimal testable business logic. No new tests written — coverage for these comes from their underlying services being tested in Part 1.

The following modals have been audited and determined to have **< 5 lines of testable logic** (no branches, no validation, no data transformation):

`AchievementUnlockModal`, `AchievementHubModal`, `AIQuestPreviewModal`, `AIQuestGeneratorModal`, `AIDungeonWizardModal`, `AITestLabModal`, `AssetConfigModal`, `AssetDownloadModal`, `BountyReviveModal`, `CreateAchievementModal`, `DungeonDeathModal`, `DungeonMapModal`, `EliteEncounterModal`, `GearSlotMappingModal`, `InventoryManagementModal`, `JobHuntModal`, `LootModal`, `ProgressDashboardModal`, `RecurringQuestsDashboardModal`, `ScrivenersQuillModal`, `ScrollLibraryModal`, `SmartTemplateModal`, `StatMappingsModal`, `TemplatePreviewModal`, `TrainingIntroModal`, `WatchedFolderManagerModal`, `WelcomeModal`

> [!NOTE]
> If post-Session-18B coverage shows specific modals below 80% and they contain extractable logic, revisit in a follow-up pass. The decision to skip these is based on the audit finding that their logic lives in services (already tested in Part 1), not in the modals themselves.

**Session 18C: 0 new tests (audit documentation only)**

---

### Session 19 — Views: React Component Testing (Deferred Scope)

**Purpose:** Test React view components using `@testing-library/react`. Scope will be determined after Sessions 12-18 complete and coverage is re-audited.

> [!IMPORTANT]
> This session is **deferred**. Requires adding `@testing-library/react` + switching Vitest environment to `jsdom`. Full scope and test count will be determined after all prior sessions complete and we re-run coverage to identify remaining gaps.

#### Prerequisite Setup

- Install `@testing-library/react` and `@testing-library/jest-dom` as dev dependencies
- Add `jsdom` environment via per-file comment `// @vitest-environment jsdom`
- Create React test helpers for wrapping components with store providers

#### Candidate Components

| View | Lines | Testable Logic | Estimated Tests |
|---|---|---|---|
| `QuestBoardView.tsx` | TBD | Kanban columns render per `ColumnConfigService`, drag handlers call store actions | 5-8 |
| `QuestSidebarView.tsx` | TBD | Filtered quest list rendering, collapse/expand state | 4-6 |
| `CharacterView.tsx` | TBD | Character sheet displays stats/gear/level correctly | 4-6 |
| `BattleView.tsx` | TBD | Turn-based UI reflects `battleStore` state, action buttons enabled/disabled | 5-8 |
| `DungeonView.tsx` | TBD | Tile rendering matches `dungeonStore`, movement buttons trigger `movePlayer` | 4-6 |
| `FilterBar.tsx` | TBD | Filter toggles fire `filterStore` actions, active filters highlighted | 3-5 |
| `QuestCard.tsx` | TBD | Card renders title/priority/category/tags, task progress bar | 3-5 |

#### Test Approach (to be refined)

1. **Smoke tests** — Each component renders without crashing given mock store state
2. **Data display** — Given specific store state, key data points render in the DOM
3. **Interaction** — User clicks/inputs trigger expected store actions (via `fireEvent` or `userEvent`)

**Session 19 Total: ~30-50 tests (TBD after coverage re-audit)**

---

## Projected Test Summary

| Session | Focus | Type | Tests | Running New Total |
|---|---|---|---|---|
| **12A** | Character model core | Unit | ~66 | 66 |
| **12B** | Character migration chain | Unit + Integration | ~34 | 100 |
| **12C** | Gear + other models | Unit | ~131 | 231 |
| **13** | Combat config | Unit | ~86 | 317 |
| **14A** | Quest + filter stores | Unit + Integration | ~50 | 367 |
| **14B** | Character store | Unit | ~90 | 457 |
| **14C** | Battle/dungeon/UI/task stores | Unit + Integration | ~80 | 537 |
| **15A** | Validators + safe JSON | Unit | ~42 | 579 |
| **15B** | Sanitizer + formatters | Unit | ~70 | 649 |
| **16** | Data integrity | Unit | ~53 | 702 |
| **17** | Hooks pure functions | Unit + Integration | ~28 | 730 |
| **18A** | Modals: CreateQuest + Column | Unit | ~47 | 777 |
| **18B** | Modals: Inventory + Blacksmith + medium | Unit + Integration | ~89 | 866 |
| **18C** | Low-logic modals audit | — | 0 | 866 |
| **19** | Views (React, deferred) | TBD | ~30-50 | ~896-916 |
| | | **Concrete Total (12-18)** | **~866** | |

Combined with Part 1's existing 390 tests + Part 1 expansion (~222 unit + ~70 integration = ~292 new), the projected total is:

| Source | Tests |
|---|---|
| Existing (Part 1 baseline) | 390 |
| Part 1 expansion (Sessions 0-K + H1-H3) | ~292 |
| **Part 2 expansion (Sessions 12-18)** | **~866** |
| Part 2 deferred (Session 19) | ~30-50 |
| **Projected grand total** | **~1,548-1,598** |

---

## Verification Plan

### After Each Session

```powershell
npx vitest run                    # All tests pass
npx vitest run --coverage         # Check coverage report
npm run build                     # No TypeScript errors
```

### Coverage Checkpoints

| After Session | Expected Coverage |
|---|---|
| 12C complete | Models: 85%+ |
| 13 complete | Config: 90%+ |
| 14C complete | Stores: 85%+ |
| 15B complete | Utils: 90%+ |
| 16 complete | Data: 85%+ |
| 17 complete | Hooks: 60%+ |
| 18B complete | Modals: 50%+ |
| 19 complete (deferred) | Views: TBD |

**Target: 80%+ statement coverage across all non-deferred directories after Session 18B.**
