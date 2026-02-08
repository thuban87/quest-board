# Test Reorganization & Coverage Expansion Plan

## Goal

Two objectives:
1. **Reorganize** the flat `test/` directory into feature-area subdirectories
2. **Expand** service-level test coverage to 80%+ pre-launch

---

## Honest Baseline Audit

The Test Coverage Matrix claims 12 services tested. An import-level audit of all 17 test files found the real number is **8**:

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
| `combat-simulator.test.ts` | Only `vitest` | ❌ Self-contained simulator |
| `elite-balance.test.ts` | Only `vitest` | ❌ Self-contained simulator |
| `skills-combat-simulator.test.ts` | Only `vitest` | ❌ Self-contained simulator |
| `skill-definitions.test.ts` | `src/data/skills` | ❌ Data constants, not SkillService |
| `pathfinding.test.ts` | `src/utils/pathfinding` | ❌ Utility, not DungeonMapService |
| `gear-migration.test.ts` | `Character`, `Gear` models | ❌ Model tests, not LootGenerationService |
| `activity-logging.test.ts` | `Character` model | ❌ Model constants, not DailyNoteService |
| `monster.test.ts` | `MonsterService` | (already counted via battle.test.ts) |

**Baseline: 8 services tested** = AchievementService, AssetService, BattleService, CombatService, MonsterService, UserDungeonLoader, PowerUpService, ProgressStatsService

> [!IMPORTANT]
> The Test Coverage Matrix should be updated to reflect this honest count: 8/37 (22%), not 12/37 (32%).

---

## Coverage Target

| Metric | Actual Baseline | Target |
|---|---|---|
| Services with tests | 8/37 (22%) | 30/37 (81%) |
| New services needed | — | **22** |
| Services skipped (accepted gap) | — | 7 (19%) |

**Skip bucket (7 services, 19%):**
- AIQuestService, AIDungeonService — AI wrappers
- StatusBarService, BuffStatusProvider, RecoveryTimerStatusProvider — display-only UI
- TestCharacterGenerator — dev tool
- BalanceTestingService — dev tool (tests are self-contained simulators)

---

## Part 1: Test Directory Reorganization

### Current State

All 21 files live in `test/` with no subdirectories.

### Proposed Structure

```
test/
├── setup.ts
├── mocks/obsidian.ts
├── combat/
│   ├── battle.test.ts
│   ├── combat-simulator.test.ts
│   ├── elite-balance.test.ts
│   ├── monster.test.ts
│   ├── skill-definitions.test.ts
│   └── skills-combat-simulator.test.ts
├── dungeons/
│   ├── dungeon-registry.test.ts
│   └── pathfinding.test.ts
├── progression/
│   ├── achievements.test.ts
│   ├── power-up-effects.test.ts
│   └── power-up-triggers.test.ts
├── loot-economy/
│   └── gear-migration.test.ts
├── assets/
│   ├── asset-service.test.ts
│   └── asset-download-modal.test.ts
└── support/
    ├── activity-logging.test.ts
    └── progress-stats.test.ts
```

### Files to Clean Up

| File | Action |
|---|---|
| `example.test.ts` | **Delete** |
| `balance-baseline-saved.md` | **Move** to `docs/archive/balance/` |
| `combat-balance-v3-elite.md` | **Move** to `docs/archive/balance/` |
| `elite-results-v3-final.md` | **Move** to `docs/archive/balance/` |

### Import Path Updates

Moving files into subdirectories changes `../src` → `../../src` for all 16 moved test files. Must verify after move.

### Config Impact

Vitest uses `include: ['test/**/*.test.ts']` — `**` glob handles subdirectories. **No config changes needed.**

---

## Part 2: Test Coverage Expansion

### Session-by-Session Roadmap

All sessions are **PRE-LAUNCH**. Each session is ~45-90 minutes.

---

#### Session 0 — Test Infrastructure

**Purpose:** Foundation for all subsequent sessions.

| Task | What |
|---|---|
| Store resets | `afterEach` reset for `questStore`, `characterStore`, `battleStore` |
| Obsidian mock | Add `App.workspace.trigger`, `Vault.delete`, `Vault.on/off` |
| Math seeding | Helper to seed `Math.random` for deterministic tests |
| Timer docs | Document `vi.useFakeTimers()` pattern |

**New services added: 0** | **Running total: 8/37**

---

#### Session A — Pure Math (+3 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/progression/xp-system.test.ts` | XPSystem | ~20 | Low |
| `test/progression/stats-service.test.ts` | StatsService | ~15 | Low |
| `test/quest-management/column-config.test.ts` | ColumnConfigService | ~18 | Low |

Edge cases from review:
- `calculateLevel(0)` — verify L1
- `getColumns()` mutable reference test — verify callers can't corrupt cache
- `getClassBonus` — matching/non-matching for all 7 classes

**Running total: 11/37 (30%)**

---

#### Session B — Date Logic & Task Parsing (+2 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/support/streak-service.test.ts` | StreakService | ~20 | Moderate |
| `test/quest-management/task-file-service.test.ts` | TaskFileService | ~15 | Moderate |

Edge cases from review:
- Uppercase `[X]` checkbox handling
- YAML frontmatter `---` inside code blocks
- `lineNumber = 0` for `toggleTaskInFile`
- `readTasksWithSections` vs `readTasksFromFile` cache comparison

**Running total: 13/37 (35%)**

---

#### Session C — Status Effects & Smelting (+2 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/combat/status-effects.test.ts` | StatusEffectService | ~25 | Moderate |
| `test/loot-economy/smelting-service.test.ts` | SmeltingService | ~15 | Low |

**Running total: 15/37 (41%)**

---

#### Session D — Quest Management Core (+2 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/quest-management/quest-actions.test.ts` | QuestActionsService | ~20 | High |
| `test/quest-management/recurring-quest.test.ts` | RecurringQuestService | ~12 | Moderate |

Edge cases from review:
- `moveQuest` invalid questId, already-in-target-column
- `completeQuest` when no completion column exists
- `archiveQuest` with nested subfolder paths
- `toggleTask` with `linkedTaskFile` pointing to non-existent file

**Running total: 17/37 (46%)**

---

#### Session E — Support & Economy Round 2 (+3 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/support/bounty-service.test.ts` | BountyService | ~17 | Moderate |
| `test/assets/sprite-service.test.ts` | SpriteService | ~8 | Low |
| `test/support/recovery-timer.test.ts` | RecoveryTimerService | ~10 | Low |

BountyService edge cases from review:
- `bountyChance = 0` — verifies disabled path
- `bountyChance = 100` — documents behavior (no upper-bound clamping in runtime)
- Verified API names match actual code: `checkBountyTrigger`, `rollBountyChance`, `generateBounty`, `selectMonsterFromHint`, `getFolderFromQuest` ✅

Bounty trigger context tests are folded into `bounty-service.test.ts`.

**Running total: 20/37 (54%)**

---

#### Session F — Templates & Quest Core (+3 services)

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/templates/template-service.test.ts` | TemplateService | ~15 | Moderate |
| `test/templates/template-stats.test.ts` | TemplateStatsService | ~8 | Low |
| `test/quest-management/quest-service.test.ts` | QuestService | ~19 | High |

TemplateService notes:
- Needs Vault mock from Session 0
- `buildQuestFromTemplate` — cover daily-quest and watched-folder template types

QuestService outline — **corrected to match actual API:**

| Describe Block | Tests | Coverage |
|---|---|---|
| `sanitizeQuestId` | 4 | Empty string, `..` sequences, path separators, backslash |
| `parseQuestFrontmatter` | 4 | Valid, empty `---\n---`, malformed YAML, missing required fields |
| `loadAllQuests` | 3 | Multiple folders, malformed file skipped, empty folder |
| `saveManualQuest` | 3 | Writes frontmatter, preserves body, handles missing file |
| `deleteQuestFile` | 3 | Valid delete, file not found, quest in custom subfolder |
| `updateQuestSortOrder` | 2 | Valid update, quest in custom subfolder (documents known gap) |

> [!WARNING]
> `deleteQuestFile` does not call `sanitizeQuestId` — a test documenting this gap is a bug discovery.

**Running total: 23/37 (62%)**

---

#### Session G — Final Push to 80% (+7 services)

This is the largest session. It can be split into G1/G2 if needed.

| File | Service | Tests | Effort |
|---|---|---|---|
| `test/loot-economy/set-bonus.test.ts` | SetBonusService | ~12 | Moderate |
| `test/combat/combat-service.test.ts` | CombatService (gap fill) | ~10 | Moderate |
| `test/support/daily-note-service.test.ts` | DailyNoteService | ~12 | Moderate |
| `test/templates/folder-watch-service.test.ts` | FolderWatchService | ~8 | Moderate |
| `test/combat/skill-service.test.ts` | SkillService | ~12 | Low |
| `test/dungeons/dungeon-map-service.test.ts` | DungeonMapService | ~10 | Moderate |
| `test/loot-economy/loot-generation.test.ts` | LootGenerationService | ~12 | Moderate |

Notes:
- **CombatService** — already partially tested via `battle.test.ts`, but only 2 functions imported. Direct unit tests for `deriveCombatStats`, `calculateDamage`, `getStatStageMultiplier` needed.
- **DailyNoteService** — was falsely counted as tested. Real tests needed for `logQuestCompletion`, `getTodayDailyNote`, date formatting.
- **FolderWatchService** — registration/cleanup logic only (start/stop watching, callback registration). Uses `Vault.on()`/`Vault.off()` mocks from Session 0.
- **SkillService** — `skill-definitions.test.ts` tests data constants, not the service. Real tests for `getSkillById`, `getSkillsForClass`, `getLoadout`, `equipSkill`.
- **DungeonMapService** — `pathfinding.test.ts` tests utility functions, not the service. Real tests for `generateMap`, `placeMonsters`, `placeTreasure`.
- **LootGenerationService** — `gear-migration.test.ts` tests model structure, not the service. Real tests for `generateLoot`, `rollTier`, `rollSlot`, `generateSetPiece`.

**Running total: 30/37 (81%)** ✅

---

### Projected Coverage Summary

| Session | New Services | Running Total | Coverage |
|---|---|---|---|
| Baseline (honest) | — | 8/37 | 22% |
| Session 0 (infrastructure) | 0 | 8/37 | 22% |
| Session A (pure math) | +3 | 11/37 | 30% |
| Session B (date & parsing) | +2 | 13/37 | 35% |
| Session C (combat & smelting) | +2 | 15/37 | 41% |
| Session D (quest management) | +2 | 17/37 | 46% |
| Session E (support & economy) | +3 | 20/37 | 54% |
| Session F (templates & quest core) | +3 | 23/37 | 62% |
| Session G (final push) | +7 | **30/37** | **81%** |

---

## Verification Plan

### After Reorganization (Part 1)

```powershell
npm run build
npx vitest run
```

All 17 existing test files should pass.

### After Each Test Session

```powershell
npx vitest run test/<subdirectory>/<new-file>.test.ts
npx vitest run
```
