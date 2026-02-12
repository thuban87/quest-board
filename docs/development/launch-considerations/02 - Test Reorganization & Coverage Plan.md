# Test Reorganization & Coverage Expansion Plan

## Goal

Two objectives:
1. **Reorganize** the flat `test/` directory into feature-area subdirectories
2. **Expand** service-level test coverage to 80%+ pre-launch

---

## Honest Baseline Audit

The Test Coverage Matrix claims 12 services tested. An import-level audit of the current 13 test files found the real number is **8**:

| Test File | Imports From | Verdict |
|---|---|---|
| `achievements.test.ts` | `AchievementService` | ✅ **AchievementService** |
| `asset-service.test.ts` | `AssetService` | ✅ **AssetService** |
| `battle.test.ts` | `BattleService`, `MonsterService`, `CombatService` | ✅ **3 services** |
| `dungeon-registry.test.ts` | `src/data/dungeons` (UserDungeonLoader exports) | ✅ **UserDungeonLoader** |
| `power-up-effects.test.ts` | `PowerUpService` | ✅ **PowerUpService** |
| `power-up-triggers.test.ts` | `PowerUpService` | (same as above) |
| `progress-stats.test.ts` | `ProgressStatsService` | ✅ **ProgressStatsService** |
| `asset-download-modal.test.ts` | `AssetDownloadModal` | ❌ Modal, not a service |
| `skill-definitions.test.ts` | `src/data/skills` | ❌ Data constants, not SkillService |
| `pathfinding.test.ts` | `src/utils/pathfinding` | ❌ Utility, not DungeonMapService |
| `activity-logging.test.ts` | `Character` model | ❌ Model constants, not DailyNoteService |
| `monster.test.ts` | `MonsterService` | (already counted via battle.test.ts) |

**Baseline: 8 services tested** = AchievementService, AssetService, BattleService, CombatService, MonsterService, UserDungeonLoader, PowerUpService, ProgressStatsService

**Current test count: 390 tests across 13 files (all passing)**

> [!IMPORTANT]
> The Test Coverage Matrix should be updated to reflect this honest count: 8/36 (22%), not 12/36 (33%).

---

## Coverage Target

| Metric | Actual Baseline | Target |
|---|---|---|
| Services with tests | 8/36 (22%) | 29/36 (81%) |
| New services needed | — | **21** |
| Services skipped (accepted gap) | — | 7 (19%) |

**Skip bucket (7 services, 19%):**
- AIQuestService, AIDungeonService — AI wrappers
- StatusBarService, BuffStatusProvider, RecoveryTimerStatusProvider — display-only UI
- TestCharacterGenerator — dev tool
- BalanceTestingService — dev tool (balance simulators archived separately)

---

## Part 1: Test Directory Reorganization

### Current State

All 13 test files live in `test/` with no subdirectories.

### Proposed Structure

```
test/
├── setup.ts
├── mocks/obsidian.ts
├── combat/
│   ├── battle.test.ts
│   ├── monster.test.ts
│   └── skill-definitions.test.ts
├── dungeons/
│   ├── dungeon-registry.test.ts
│   └── pathfinding.test.ts
├── progression/
│   ├── achievements.test.ts
│   ├── power-up-effects.test.ts
│   └── power-up-triggers.test.ts
├── assets/
│   ├── asset-service.test.ts
│   └── asset-download-modal.test.ts
└── support/
    ├── activity-logging.test.ts
    └── progress-stats.test.ts
```

### Files Already Cleaned Up

| File | Status |
|---|---|
| `example.test.ts` | Deleted previously |
| `combat-simulator.test.ts` | Archived to `docs/archive/balance/` |
| `elite-balance.test.ts` | Archived to `docs/archive/balance/` |
| `skills-combat-simulator.test.ts` | Archived to `docs/archive/balance/` |
| `gear-migration.test.ts` | Deleted (one-time migration, no longer needed) |
| `balance-baseline-saved.md` | Moved to `docs/archive/balance/` |
| `combat-balance-v3-elite.md` | Moved to `docs/archive/balance/` |
| `elite-results-v3-final.md` | Moved to `docs/archive/balance/` |

### Import Path Updates

Moving files into subdirectories changes `../src` → `../../src` for all moved test files. Must verify after move.

### Config Impact

Vitest uses `include: ['test/**/*.test.ts']` — `**` glob handles subdirectories. **No config changes needed.**

---

## Part 2: Test Coverage Expansion

### Session-by-Session Roadmap

All sessions are **PRE-LAUNCH**. Each session is ~45-90 minutes.

---

#### Session 0 — Test Infrastructure

**Purpose:** Foundation for all subsequent sessions.

##### Store Resets

All 7 Zustand stores need reset methods for test isolation. Current state:

| Store | Has Reset? | Action Needed |
|---|---|---|
| `questStore` | ✅ Has `clear()` (line 107) | Wire into `afterEach` |
| `characterStore` | ❌ No `clear()`/`reset()` | Add `reset()` method |
| `battleStore` | ✅ Has `resetBattle()` | Wire into `afterEach` |
| `dungeonStore` | ❌ Unknown | Add `reset()` method |
| `filterStore` | ❌ Unknown | Add `reset()` method |
| `uiStore` | ❌ Unknown | Add `reset()` method |
| `taskSectionsStore` | ❌ Unknown | Add `reset()` method |

All store resets called in global `afterEach` in `test/setup.ts`.

##### Obsidian Mock Expansion

Audit of actual service usage vs. current mock coverage:

| Mock Method | Used By | Currently Mocked? |
|---|---|---|
| `Vault.offref()` | QuestService, TaskFileService, FolderWatchService, useXPAward, useQuestLoader | ❌ **Missing** |
| `Vault.rename()` | QuestActionsService, RecurringQuestService, FolderWatchService | ❌ **Missing** |
| `Vault.cachedRead()` | QuestService (×2), TaskFileService, FolderWatchService | ❌ **Missing** |
| `Vault.getMarkdownFiles()` | QuestService, FolderWatchService | ❌ **Missing** |
| `TFolder.children` | FolderWatchService | ❌ **Missing** |
| `Workspace.getActiveViewOfType` | Various | ❌ **Missing** |
| `App.workspace.trigger` | ScrivenersQuillModal | ❌ **Missing** |
| `Vault.delete` | QuestService | ❌ **Missing** |
| `Vault.on/off` | QuestService, FolderWatchService, TaskFileService | ❌ **Missing** |

> [!CAUTION]
> `Vault.offref()` is used in 4 services + 2 hooks for event cleanup. Without this mock, any test touching file watchers will throw.

##### Additional Infrastructure

| Task | What |
|---|---|
| `moment` shim | Mock global `moment` — required by DailyNoteService and RecurringQuestService |
| Math seeding | Helper to seed `Math.random` for deterministic tests |
| Timer docs | Document `vi.useFakeTimers()` pattern |

**New services added: 0** | **Running total: 8/36**

---

#### Session A — Pure Math (+3 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/progression/xp-system.test.ts` | XPSystem | ~20 | Low |
| `test/progression/stats-service.test.ts` | StatsService | ~15 | Low |
| `test/quest-management/column-config.test.ts` | ColumnConfigService | ~25 | Low |

Edge cases:
- `calculateLevel(0)` — verify L1
- `getColumns()` mutable reference test — verify callers can't corrupt cache
- `getClassBonus` — matching/non-matching for all 7 classes

ColumnConfigService additional coverage (14 methods total):
- `resolveStatus` — legacy migration, unknown status fallback to first column
- `isColumnIdUnique` — with/without `excludeIndex`
- `getColumnDisplay` — emoji + title, missing column fallback
- `invalidateCache` — verify cache is rebuilt after invalidation
- `getValidationConstants` — static method returns expected shape
- `getFirstCompletionColumn` — no completion column configured

**Running total: 11/36 (31%)**

---

#### Session B — Date Logic & Task Parsing (+2 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/support/streak-service.test.ts` | StreakService | ~20 | Moderate |
| `test/quest-management/task-file-service.test.ts` | TaskFileService | ~23 | Moderate |

Edge cases:
- Uppercase `[X]` checkbox handling
- YAML frontmatter `---` inside code blocks
- `lineNumber = 0` for `toggleTaskInFile`
- `readTasksWithSections` vs `readTasksFromFile` cache comparison

TaskFileService additional coverage:
- `readTasksFromMultipleFiles` — aggregation across multiple linked files, empty list, mixed success/failure
- `countNewlyCompleted` — diff between snapshots, all-complete, no change, partial
- `getVisibleTasks` — pagination with N incomplete + all completed

Error paths (2-3 tests):
- `readTasksFromFile` when vault.read throws
- `toggleTaskInFile` when linked file not found
- `watchTaskFile` when file is deleted while watching

**Running total: 13/36 (36%)**

---

#### Session C — Status Effects & Smelting (+2 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/combat/status-effects.test.ts` | StatusEffectService | ~25 | Moderate |
| `test/loot-economy/smelting-service.test.ts` | SmeltingService | ~15 | Low |

**Running total: 15/36 (42%)**

---

#### Session D — Quest Management Core (+2 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/quest-management/quest-actions.test.ts` | QuestActionsService | ~30 | High |
| `test/quest-management/recurring-quest.test.ts` | RecurringQuestService | ~12 | Moderate |

QuestActionsService outline — **5 public methods, all need coverage:**

| Describe Block | Tests | Coverage |
|---|---|---|
| `moveQuest` | 8 | Invalid questId, already-in-target, non-completion move, completion move triggers rewards, streak update, power-up evaluation, stamina award, daily note log |
| `completeQuest` | 6 | Explicit completion, moves to completion column, no completion column configured, awards all rewards, loot + bounty chain |
| `toggleTask` | 5 | Valid toggle, linkedTaskFile not found, XP award on task complete, streak mode "task" |
| `reopenQuest` | 5 | Clears completedDate, moves to first column, logs reopen event, quest not found, already-open quest |
| `archiveQuest` | 6 | Valid archive, nested subfolder paths, quest not found, no filePath set, archive folder creation, store removal |

Error paths (3 tests):
- `moveQuest` with vault.read throwing during save
- `archiveQuest` when vault.rename fails
- `completeQuest` with concurrent completion race

**Running total: 17/36 (47%)**

---

#### Session D2 — Store Testing (+0 services, state machine coverage)

| File | Store | Tests | Effort |
|---|---|---|---|
| `test/stores/battle-store.test.ts` | battleStore | ~15 | Moderate |

battleStore state machine coverage:

| Describe Block | Tests | Coverage |
|---|---|---|
| State transitions | 6 | idle→fighting, fighting→victory, fighting→defeat, defeat→idle (resetBattle), victory→loot, invalid transitions no-op |
| Combat actions | 4 | takeTurn updates HP, skill usage tracks cooldowns, flee attempt, turn order |
| Derived state | 3 | `isBattleActive`, `isPlayerTurn`, `battleResult` selectors |
| Edge cases | 2 | Double-start battle, resetBattle during active combat |

> [!NOTE]
> Store tests validate state machine correctness. Service tests validate business logic. Both are needed — a correct service feeding a broken state machine still produces bugs.

**Running total: 17/36 (47%)**

---

#### Session E — Support & Economy Round 2 (+3 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/support/bounty-service.test.ts` | BountyService | ~19 | Moderate |
| `test/assets/sprite-service.test.ts` | SpriteService | ~8 | Low |
| `test/support/recovery-timer.test.ts` | RecoveryTimerService | ~10 | Low |

BountyService edge cases:
- `bountyChance = 0` — verifies disabled path
- `bountyChance = 100` — documents behavior (no upper-bound clamping in runtime)
- `generateBountyId` — uniqueness test (generate 100, assert all distinct) + format test
- Verified API names match actual code: `checkBountyTrigger`, `rollBountyChance`, `generateBounty`, `selectMonsterFromHint`, `getFolderFromQuest` ✅

Lifecycle methods (`initialize`, `updateSettings`, `setSaveCallback`) — 2 simple tests:
- `initialize` sets settings reference
- `setSaveCallback` is invoked after cache mutation

Bounty trigger context tests are folded into `bounty-service.test.ts`.

**Running total: 20/36 (56%)**

---

#### Session F — Templates & Quest Core (+3 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/templates/template-service.test.ts` | TemplateService | ~15 | Moderate |
| `test/templates/template-stats.test.ts` | TemplateStatsService | ~8 | Low |
| `test/quest-management/quest-service.test.ts` | QuestService | ~35 | High |

TemplateService notes:
- Needs Vault mock from Session 0
- `buildQuestFromTemplate` — cover daily-quest and watched-folder template types

QuestService outline — **12 public functions:**

| Describe Block | Tests | Coverage |
|---|---|---|
| `sanitizeQuestId` | 4 | Empty string, `..` sequences, path separators, backslash |
| `parseQuestFrontmatter` | 4 | Valid, empty `---\n---`, malformed YAML, missing required fields |
| `loadAllQuests` | 3 | Multiple folders, malformed file skipped, empty folder |
| `loadSingleQuest` | 3 | Valid file, file not found, malformed file returns error |
| `saveManualQuest` | 3 | Writes frontmatter, preserves body, handles missing file |
| `saveAIQuest` | 3 | Valid AI quest write, JSON round-trip, folder auto-creation |
| `ensureQuestFolders` | 2 | Creates missing folders, no-ops if already exist |
| `updateFrontmatterFields` | 5 | Add field, update existing, remove field (null), YAML encoding edge cases, field ordering preserved |
| `generateQuestFrontmatter` | 3 | Round-trip with `parseQuestFrontmatter`, all fields present, optional fields omitted |
| `deleteQuestFile` | 4 | Valid delete, file not found, quest in custom subfolder, **sanitization gap test** |
| `updateQuestSortOrder` | 2 | Valid update, quest in custom subfolder |
| `watchQuestFolderGranular` | 3 | Create/modify/delete callbacks fire, rename handling, stopWatching cleanup |

> [!WARNING]
> `deleteQuestFile` does not call `sanitizeQuestId` — a unit test documenting this gap is added here (not just in integration H1). This is a real bug that should be caught at the unit level.

Error paths (3 tests):
- `loadMarkdownQuest` when vault.cachedRead throws
- `saveManualQuest` when vault.create fails
- `loadJsonQuest` with malformed JSON content

**Running total: 23/36 (64%)**

---

#### Session G1 — Combat & Loot Gap Fill (+2 new services, +1 gap fill)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/combat/skill-service.test.ts` | SkillService | ~12 | Low |
| `test/combat/combat-service.test.ts` | CombatService (gap fill — already in baseline) | ~10 | Moderate |
| `test/loot-economy/set-bonus.test.ts` | SetBonusService | ~12 | Moderate |

Notes:
- **CombatService** — already in baseline 8 via `battle.test.ts`, but only 2 functions imported. This session adds direct unit tests for `deriveCombatStats`, `calculateDamage`, `getStatStageMultiplier`. Does **not** count as a new service.
- **SkillService** — `skill-definitions.test.ts` tests data constants, not the service. Real tests for `getSkillById`, `getSkillsForClass`, `getLoadout`, `equipSkill`.

**Running total: 25/36 (69%)**

---

#### Session G2 — File I/O Services (+4 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/support/daily-note-service.test.ts` | DailyNoteService | ~12 | Moderate |
| `test/templates/folder-watch-service.test.ts` | FolderWatchService | ~15 | High |
| `test/dungeons/dungeon-map-service.test.ts` | DungeonMapService | ~10 | Moderate |
| `test/loot-economy/loot-generation.test.ts` | LootGenerationService | ~12 | Moderate |

Notes:
- **DailyNoteService** — was falsely counted as tested. Requires `moment` shim from Session 0.
- **FolderWatchService** — 613 lines, 13+ public methods. See private method strategy below.
- **DungeonMapService** — `pathfinding.test.ts` tests utility functions, not the service.
- **LootGenerationService** — tests for `generateQuestLoot`, `rollTier`, `getSlotsForQuestType`, `generateGearItem`, `generateCombatLoot`.

##### Private Method Testing Strategy (FolderWatchService)

FolderWatchService has utility functions (`toSlug`, `sanitizeFileName`, `getDelayUntilTime`, `generateQuestName`) that are private but contain important logic.

**Decision: Export pure utilities for testing.**

- `toSlug`, `sanitizeFileName`, `getDelayUntilTime` — pure functions with no side effects. Export with `/** @visibleForTesting */` JSDoc.
- `generateQuestName` — coupled to config, test indirectly through `startWatching`/`processNewFile`.
- `validateConfigs` — test through public `startWatching` (pass invalid configs, verify they're cleaned up).
- `scheduleArchive` — test with `vi.useFakeTimers()` through public API.

Error paths (3 tests across file I/O services):
- FolderWatchService: watched folder deleted while watching
- DailyNoteService: daily note file locked/unreadable
- LootGenerationService: invalid quest type slot mapping

**Running total: 29/36 (81%)** ✅

---

### Projected Unit Test Coverage Summary

| Session | New Services | Running Total | Coverage |
|---|---|---|---|
| Baseline (honest) | — | 8/36 | 22% |
| Session 0 (infrastructure) | 0 | 8/36 | 22% |
| Session A (pure math) | +3 | 11/36 | 31% |
| Session B (date & parsing) | +2 | 13/36 | 36% |
| Session C (combat & smelting) | +2 | 15/36 | 42% |
| Session D (quest management) | +2 | 17/36 | 47% |
| Session D2 (store testing) | +0 | 17/36 | 47% |
| Session E (support & economy) | +3 | 20/36 | 56% |
| Session F (templates & quest core) | +3 | 23/36 | 64% |
| Session G1 (combat & loot gap fill) | +2 | 25/36 | 69% |
| Session G2 (file I/O services) | +4 | **29/36** | **81%** |

---

## Part 3: Integration Tests

Integration tests validate multi-service workflows end-to-end. Unlike unit tests (which mock dependencies), integration tests wire real services together and verify the complete chain.

All integration test files live in `test/integration/`.

### Integration Test Isolation Strategy

Services are module-level singletons (exported functions or singleton class instances), not injectable classes. The isolation strategy uses a **hybrid approach: TestVaultAdapter for happy-path file I/O, `vi.spyOn` for error injection.**

#### TestVaultAdapter

An in-memory vault that replaces the Obsidian mock's `Vault` object during integration tests:

```typescript
class TestVaultAdapter {
  private files = new Map<string, string>();
  private listeners = new Map<string, Set<Function>>();
  
  // Pre-seed files for test setup
  seed(path: string, content: string): void;
  
  // Vault API surface (wired into mock)
  // CRUD methods auto-emit the corresponding event
  async read(file: TFile): Promise<string>;
  async cachedRead(file: TFile): Promise<string>;
  async create(path: string, content: string): Promise<TFile>;   // emits 'create'
  async modify(file: TFile, content: string): Promise<void>;     // emits 'modify'
  async delete(file: TFile): Promise<void>;                      // emits 'delete'
  async rename(file: TFile, newPath: string): Promise<void>;     // emits 'rename'
  
  // Event system (required by QuestService, FolderWatchService, TaskFileService)
  on(event: 'create' | 'modify' | 'delete' | 'rename', callback: Function): EventRef;
  off(event: string, callback: Function): void;
  offref(ref: EventRef): void;
  
  // Test helper: manually trigger events without file changes
  emit(event: string, file: TFile, ...args: any[]): void;
  
  // File lookup (used by 15+ service calls)
  getAbstractFileByPath(path: string): TFile | TFolder | null;
  getMarkdownFiles(): TFile[];  // filters internal Map for .md files
  
  // Test assertions
  getContent(path: string): string | undefined;
  exists(path: string): boolean;
  getAllFiles(): string[];
  
  // Cleanup
  clear(): void;
}
```

`getAbstractFileByPath` returns proper `TFile`/`TFolder` mock objects for seeded paths (constructed from the internal `Map` keys). Without this, services hit null-checks on `vault.getAbstractFileByPath()` and bail early.

Created in `test/mocks/TestVaultAdapter.ts`. Wired into the Obsidian mock in `beforeEach`, cleared in `afterEach`.

#### Error Injection

For error paths (vault.read throws, file locked, etc.), use `vi.spyOn` on top of the adapter:

```typescript
// Happy path: TestVaultAdapter handles it
await questService.loadSingleQuest(vault, 'quests/main/test.md');

// Error path: spyOn overrides the adapter for one call
vi.spyOn(vault, 'read').mockRejectedValueOnce(new Error('File locked'));
await expect(questService.loadSingleQuest(vault, 'quests/main/test.md'))
  .rejects.toThrow('File locked');
```

#### State Reset Pattern

Every integration test file uses this `afterEach`:

```typescript
afterEach(() => {
  // 1. Reset all 7 stores
  useQuestStore.getState().clear();
  useCharacterStore.getState().reset();
  useBattleStore.getState().resetBattle();
  useDungeonStore.getState().reset();
  useFilterStore.getState().reset();
  useUIStore.getState().reset();
  useTaskSectionsStore.getState().reset();
  
  // 2. Clear test vault
  testVault.clear();
  
  // 3. Reset singleton service caches (minimum baseline)
  columnConfigService.invalidateCache();
  bountyService.initialize(defaultTestSettings);
  // NOTE: Each integration test session should audit and reset
  // any additional service caches as they are discovered
  // (e.g., TemplateStatsService, StreakService, RecoveryTimerService)
});
```

#### Service Wiring

- Services that accept `vault` as a parameter (QuestService, QuestActionsService) receive the TestVaultAdapter instance directly.
- Singleton class services (`bountyService`, `columnConfigService`) are re-initialized with fresh test settings in `beforeEach`.
- Store state is the source of truth for React — stores are always reset between tests.

### Prioritization

Tiers are ordered by **fragility × importance**:
- **Tier 1 (Critical Path):** Flows that touch 4+ services, where a break = data loss or broken core loop
- **Tier 2 (High Value):** Flows that touch 2-3 services, where a break = broken feature
- **Tier 3 (Important):** Flows with complex state or timing, where a break = subtle bugs

---

#### Session H1 — Critical Path Integration (~25 tests)

**Why first:** These are the highest-fragility flows. A regression here means broken core gameplay.

##### Quest Completion Flow (~12 tests)

**File:** `test/integration/quest-completion-flow.test.ts`
**Services:** `QuestActionsService` → `ColumnConfigService` → `QuestService` → `StreakService` → `PowerUpService` → `AchievementService` → `CombatService` → `DailyNoteService`

| Test | What It Validates |
|---|---|
| Complete quest via moveQuest to completion column | Status updated, completedDate set, file saved |
| XP + gold awarded on completion | Character stats incremented correctly |
| Streak updated on quest completion (quest mode) | Streak count increments, lastActivity set |
| Streak NOT updated on non-completion move | Moving to a non-completion column skips streak |
| Power-up triggers evaluated on completion | Trigger context built, effects granted if conditions met |
| Achievement check fires on completion | Milestone achievements unlocked when thresholds crossed |
| Stamina awarded on completion | Character stamina incremented by `STAMINA_PER_QUEST` |
| Daily note logged on completion | Entry appended to today's note file |
| Loot dropped on completion (seeded RNG) | Gear generated with correct tier/slot for quest type |
| Bounty triggered on completion (chance = 100%) | Monster selected from hint, battle context prepared |
| Full chain: complete → loot → bounty → battle readiness | All rewards processed in order; battle context prepared (monster selected, stats calculated, `battleStore` initialized). Does **not** simulate multi-turn combat — that's covered by Session D2 store tests. |
| completeQuest explicit button (no completion column) | Quest stays in place, completedDate set, rewards still fire |

##### Quest File Round-Trip (~8 tests)

**File:** `test/integration/quest-file-roundtrip.test.ts`
**Services:** `QuestService` (parse → save → re-parse)

| Test | What It Validates |
|---|---|
| Parse → save → re-parse preserves all fields | Every frontmatter field survives the round-trip |
| `updateFrontmatterFields` preserves body content | Markdown body below frontmatter is untouched |
| Surgical update only changes target field | Other frontmatter lines remain byte-identical |
| `sanitizeQuestId` → `deleteQuestFile` gap | Documents that delete doesn't sanitize (known bug) |
| JSON quest round-trip (AI-generated) | `loadJsonQuest` → `saveAIQuest` → reload |
| Concurrent saves: service-level guard | Two rapid `saveManualQuest` calls — validates service-level queue/guard if one exists, or documents the gap. Note: in-memory adapter is synchronous, so this tests the guard logic, not actual I/O interleaving. |
| `loadSingleQuest` matches `loadAllQuests` result | Same quest loaded both ways produces identical object |
| Malformed frontmatter recovery | File with broken YAML still loads remaining valid fields |

##### Task Toggle → Rewards Chain (~5 tests)

**File:** `test/integration/task-toggle-chain.test.ts`
**Services:** `QuestActionsService` → `TaskFileService` → `StreakService`

| Test | What It Validates |
|---|---|
| Toggle task checkbox → XP awarded | Task toggled in file, XP calculated from quest settings |
| Streak updated on task toggle (task mode) | Streak mode "task" triggers streak update |
| Extension-less linkedTaskFile resolves | Path without `.md` still finds the file |
| Toggle last task → quest auto-complete check | All tasks done triggers completion flow |
| Toggle task in multi-file quest | `readTasksFromMultipleFiles` aggregates correctly |

**Running integration total: ~25 tests**

---

#### Session H2 — High Value Integration (~25 tests)

##### Column Move & Migration (~8 tests)

**File:** `test/integration/column-migration.test.ts`
**Services:** `ColumnConfigService` → `QuestActionsService` → `QuestService`

| Test | What It Validates |
|---|---|
| Move quest between non-completion columns | Status updated, no rewards triggered |
| Move to completion column triggers full reward chain | Completion detection → rewards |
| Legacy status resolved on load | Old `QuestStatus` enum values map to new column IDs |
| Delete column → quests migrate to first column | All quests with deleted status moved |
| Custom columns with no completion column defined | `completeQuest` still works, stays in place |
| Reopen quest → moves to first column | `reopenQuest` clears completedDate, resolves target |
| Column config cache invalidation | Settings change → `invalidateCache` → new columns returned |
| Sort order preserved across column moves | `updateQuestSortOrder` maintains position within column |

##### Bounty Trigger Chain (~8 tests)

**File:** `test/integration/bounty-chain.test.ts`
**Services:** `BountyService` → `MonsterService` → `CombatService` → `LootGenerationService`

| Test | What It Validates |
|---|---|
| Bounty chance roll (seeded 100%) | `checkBountyTrigger` passes, bounty generated |
| Bounty chance roll (seeded 0%) | No bounty generated |
| Template selection from folder keyword | Correct template category matched to quest folder |
| AI cache used when available | Cached descriptions used instead of template fallback |
| Monster hint → monster selection | `selectMonsterFromHint` picks valid monster for category |
| Bounty monster → combat context | Selected monster has valid stats for battle |
| Bounty loot on victory | Combat victory generates loot from bounty tier |
| Bounty with unknown folder → default templates | Fallback to `default` template category |

##### Loot → Inventory → Smelting (~9 tests)

**File:** `test/integration/loot-economy.test.ts`
**Services:** `LootGenerationService` → `SetBonusService` → `SmeltingService`

| Test | What It Validates |
|---|---|
| Quest loot respects quest type slot mapping | `main` quest → chest/weapon/head slots |
| Custom slot mapping overrides defaults | `setCustomSlotMapping` changes available slots |
| Training mode always drops gear | 100% drop rate in training |
| Tier roll distribution (seeded) | Common/adept/journeyman probabilities correct |
| Class-appropriate armor/weapon types | Warrior gets plate, Scholar gets cloth |
| Set bonus detection on inventory change | Equipping 2+ pieces from same set activates bonus |
| Smelting 3 same-tier → tier upgrade | Three common items → one adept item |
| Smelting with mixed tiers rejected | Can't smelt items of different tiers |
| Combat loot uses monster tier, not quest tier | Boss drops use boss loot tables |

**Running integration total: ~50 tests**

---

#### Session H3 — Important Integration (~20 tests)

##### Folder Watcher Lifecycle (~7 tests)

**File:** `test/integration/folder-watcher-lifecycle.test.ts`
**Services:** `FolderWatchService` → `TemplateService` → `QuestService`

| Test | What It Validates |
|---|---|
| File created in watched folder → quest generated | End-to-end from file event to quest file written |
| Template placeholders resolved in generated quest | `{{filename}}`, `{{date}}` replaced |
| Daily-quest type links to daily note | Generated quest has correct `linkedTaskFile` |
| Duplicate file creation → no duplicate quest | Second create event for same file is ignored |
| Config validation removes deleted templates | Invalid `templatePath` config cleaned up on init |
| Archive scheduling with `vi.useFakeTimers()` | Timer fires at configured time, quest archived |
| Watcher cleanup on config removal | `stopWatching` called, `Vault.off()` unsubscribed |

##### Recurring Quest Lifecycle (~7 tests)

**File:** `test/integration/recurring-quest-lifecycle.test.ts`
**Services:** `RecurringQuestService` → `ColumnConfigService` → `QuestService`

| Test | What It Validates |
|---|---|
| Daily template generates quest on matching day | `shouldGenerateToday` → quest file created |
| Weekday-only template skips weekends | Saturday/Sunday → no quest generated |
| Custom day list ("mon,wed,fri") works | Only matching days trigger generation |
| Monthly rule fires on 1st of month | `isMonthlyRule` → generates on day 1 |
| Duplicate prevention (same template + date) | `instanceExists` check prevents re-generation |
| Completed recurring quests archived | `archiveCompletedQuests` moves to archive folder |
| Generated quest uses default column | `getDefaultColumn` from `ColumnConfigService` |

##### Streak + Power-Up Cross-Day (~6 tests)

**File:** `test/integration/streak-powerup-chain.test.ts`
**Services:** `StreakService` → `PowerUpService` → `AchievementService`

| Test | What It Validates |
|---|---|
| 3-day streak → milestone power-up granted | Streak reaches 3, trigger evaluates, effect applied |
| 7-day streak → achievement unlocked | Streak achievement threshold crossed |
| Missed day → streak reset (non-Paladin) | `checkStreakOnLoad` resets streak, shield unused |
| Missed day → Paladin shield protects | Shield consumed, streak preserved |
| Weekly shield reset on Monday | `shieldUsedThisWeek` clears at week boundary |
| Power-up expiry on streak break | Streak-granted power-ups expire when streak resets |

**Running integration total: ~70 tests**

---

### Projected Full Coverage Summary

| Session | Type | Tests Added | Running Total |
|---|---|---|---|
| Baseline | Unit | — | 390 existing |
| Sessions 0–G2 | Unit | ~222 new | ~612 |
| Session D2 | Unit (stores) | ~15 | ~627 |
| Session H1 | Integration (Critical) | ~25 | ~652 |
| Session H2 | Integration (High Value) | ~25 | ~677 |
| Session H3 | Integration (Important) | ~20 | **~697** |

---

## Verification Plan

### After Reorganization (Part 1)

```powershell
npm run build
npx vitest run
```

All 13 existing test files should pass.

### After Each Test Session

```powershell
npx vitest run test/<subdirectory>/<new-file>.test.ts
npx vitest run
```
