# Test Coverage Matrix

> **Last Updated:** 2026-02-08 | **Purpose:** At-a-glance view of which systems have automated tests and which are untested

> [!IMPORTANT]
> An import-level audit on 2026-02-08 corrected the baseline from 12 → 8 services. Several test files were miscategorized as testing services when they actually test models, data constants, utilities, or are self-contained simulators.

---

## Coverage Overview

| Metric | Value |
|---|---|
| **Total Test Files** | 17 |
| **Total Services** | 37 |
| **Services With Tests** | 8 (22%) |
| **Services Without Tests** | 29 (78%) |
| **Components With Tests** | 0 |
| **Modals With Tests** | 1 (AssetDownloadModal) |

---

## Service Test Coverage

### ✅ Genuinely Tested Services (imports & exercises real service code)

| Service | Test File | What's Covered |
|---|---|---|
| **AchievementService** | `achievements.test.ts` | Achievement tracking and unlocking |
| **AssetService** | `asset-service.test.ts` | Remote asset download, manifest parsing |
| **BattleService** | `battle.test.ts` | Turn resolution, damage calc, monster conversion |
| **CombatService** | `battle.test.ts` | `calculateDamage`, `CombatStats` (partial — only 2 functions imported) |
| **MonsterService** | `battle.test.ts`, `monster.test.ts` | Monster creation, stat scaling |
| **UserDungeonLoader** | `dungeon-registry.test.ts` | Template validation, monster ID checks |
| **PowerUpService** | `power-up-effects.test.ts`, `power-up-triggers.test.ts` | Effect application, trigger conditions |
| **ProgressStatsService** | `progress-stats.test.ts` | Activity logging, XP history |

### ⚠️ Test Files That Don't Test Services (previously miscategorized)

| Test File | Actually Tests | Why Not a Service Test |
|---|---|---|
| `combat-simulator.test.ts` | Self-contained combat balance sim | Imports only `vitest` — re-implements all logic locally |
| `elite-balance.test.ts` | Self-contained elite balance sim | Imports only `vitest` — re-implements all logic locally |
| `skills-combat-simulator.test.ts` | Self-contained skills balance sim | Imports only `vitest` — re-implements all logic locally |
| `skill-definitions.test.ts` | `src/data/skills` constants | Tests data definitions, not SkillService |
| `pathfinding.test.ts` | `src/utils/pathfinding` | Tests utility functions, not DungeonMapService |
| `gear-migration.test.ts` | `Character`, `Gear` models | Tests model structure, not LootGenerationService |
| `activity-logging.test.ts` | `ActivityEvent` from `Character` model | Tests model type/constants, not DailyNoteService |
| `asset-download-modal.test.ts` | `AssetDownloadModal` | Modal test, not a service |

### ❌ No Automated Tests

Sorted by **risk level** (how impactful a bug would be):

| Service | Risk | Reason |
|---|---|---|
| **QuestActionsService** | 🔴 Critical | Orchestrates 9 services — highest fan-out in codebase |
| **QuestService** | 🔴 Critical | Quest CRUD, file I/O — data integrity |
| **TaskFileService** | 🔴 Critical | Markdown task parsing — data integrity |
| **ColumnConfigService** | 🟠 High | Custom columns — wrong config = broken board |
| **XPSystem** | 🟠 High | Level progression — wrong XP = broken game feel |
| **StatsService** | 🟠 High | Stat calculations — affects combat balance |
| **DailyNoteService** | 🟡 Medium | Completion logging — previously miscounted as tested |
| **BountyService** | 🟡 Medium | Bounty triggers and rewards |
| **StreakService** | 🟡 Medium | Streak tracking and Paladin shield |
| **RecurringQuestService** | 🟡 Medium | Recurring quest scheduling |
| **SmeltingService** | 🟡 Medium | Gear combining logic |
| **SetBonusService** | 🟡 Medium | Set bonus detection |
| **TemplateService** | 🟡 Medium | Template parsing and placeholders |
| **StatusEffectService** | 🟡 Medium | Buff/debuff application in combat |
| **SkillService** | 🟡 Medium | Skill loadout management — data tests exist but not service |
| **DungeonMapService** | 🟡 Medium | Map generation — utility tests exist but not service |
| **LootGenerationService** | 🟡 Medium | Loot drops — model tests exist but not service |
| **FolderWatchService** | 🟡 Medium | File watcher — hard to unit test |
| **SpriteService** | 🟢 Low | Path resolution — simple logic |
| **RecoveryTimerService** | 🟢 Low | Timer management |
| **StatusBarService** | 🟢 Low | UI display only |
| **BuffStatusProvider** | 🟢 Low | Status bar provider |
| **RecoveryTimerStatusProvider** | 🟢 Low | Status bar provider |
| **AIQuestService** | 🟢 Low | AI wrapper — hard to unit test |
| **AIDungeonService** | 🟢 Low | AI wrapper — hard to unit test |
| **TemplateStatsService** | 🟢 Low | Usage stats — cosmetic |
| **BalanceTestingService** | 🟢 Low | Dev tool — tests are self-contained simulators |
| **TestCharacterGenerator** | 🟢 Low | Dev tool only |

---

## Coverage by Feature Area

| Feature Area | Services | Tested | Coverage |
|---|---|---|---|
| **Quest Management** | QuestService, QuestActionsService, TaskFileService, ColumnConfigService, RecurringQuestService | 0/5 | ⬜⬜⬜⬜⬜ 0% |
| **Combat** | BattleService, CombatService, SkillService, StatusEffectService, MonsterService | 3/5 | 🟩🟩🟩⬜⬜ 60% |
| **Loot & Economy** | LootGenerationService, SetBonusService, SmeltingService | 0/3 | ⬜⬜⬜ 0% |
| **Progression** | XPSystem, StatsService, AchievementService, PowerUpService | 2/4 | 🟩🟩⬜⬜ 50% |
| **Dungeons** | DungeonMapService, UserDungeonLoader, AIDungeonService | 1/3 | 🟩⬜⬜ 33% |
| **Templates** | TemplateService, FolderWatchService, TemplateStatsService | 0/3 | ⬜⬜⬜ 0% |
| **Assets** | AssetService, SpriteService | 1/2 | 🟩⬜ 50% |
| **Support** | StreakService, BountyService, DailyNoteService, ProgressStatsService | 1/4 | 🟩⬜⬜⬜ 25% |
| **UI Providers** | StatusBarService, BuffStatusProvider, RecoveryTimerStatusProvider, RecoveryTimerService | 0/4 | ⬜⬜⬜⬜ 0% |

---

## Component & Modal Test Coverage

| Layer | Total | Tested | Notes |
|---|---|---|---|
| **Components** | 24 | 0 | React components — would need render testing |
| **Modals** | 40 | 1 | Only AssetDownloadModal has tests |
| **Hooks** | 9 | 0 | Hook logic untested |
| **Stores** | 7 | 0 | Zustand stores untested |

---

## Recommended Test Priorities

### Tier 1 — High Impact, Moderate Effort
| Target | Why |
|---|---|
| **QuestActionsService** | Highest fan-out; orchestrates completions, loot, streaks, achievements |
| **TaskFileService** | Parses markdown tasks — data integrity critical |
| **ColumnConfigService** | Small surface area, high impact on board functionality |

### Tier 2 — Good Coverage Gaps
| Target | Why |
|---|---|
| **XPSystem** | Core progression — easy to test (pure math) |
| **StatsService** | Stat calculations — easy to test (pure math) |
| **StreakService** | Date logic is notoriously bug-prone |

### Tier 3 — Nice to Have
| Target | Why |
|---|---|
| **SmeltingService** | Isolated logic, straightforward to test |
| **SetBonusService** | Matching logic, straightforward to test |
| **RecurringQuestService** | Scheduling logic, date-sensitive |
