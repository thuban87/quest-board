# Test Coverage Matrix

> **Last Updated:** 2026-02-07 | **Purpose:** At-a-glance view of which systems have automated tests and which are untested

---

## Coverage Overview

| Metric | Value |
|---|---|
| **Total Test Files** | 17 |
| **Total Services** | 37 |
| **Services With Tests** | 12 (32%) |
| **Services Without Tests** | 25 (68%) |
| **Components With Tests** | 0 |
| **Modals With Tests** | 1 (AssetDownloadModal) |

---

## Service Test Coverage

### ✅ Has Automated Tests

| Service / System | Test File | What's Covered |
|---|---|---|
| **AchievementService** | `achievements.test.ts` | Achievement tracking and unlocking |
| **AssetService** | `asset-service.test.ts` | Remote asset download, manifest parsing |
| **AssetDownloadModal** | `asset-download-modal.test.ts` | Modal UI, progress, cancel |
| **BattleService** | `battle.test.ts` | Turn resolution, damage, death |
| **CombatService** | `combat-simulator.test.ts` | Stat derivation, combat balance |
| **LootGenerationService** | `gear-migration.test.ts` | Gear tier migration |
| **MonsterService** | `monster.test.ts` | Monster creation, stat scaling |
| **DungeonMapService** | `pathfinding.test.ts` | Room layout, A* pathfinding |
| **UserDungeonLoader** | `dungeon-registry.test.ts` | Template validation, monster ID checks |
| **PowerUpService** | `power-up-effects.test.ts`<br>`power-up-triggers.test.ts` | Effect application, trigger conditions |
| **ProgressStatsService** | `progress-stats.test.ts` | Activity logging, XP history |
| **SkillService** | `skill-definitions.test.ts`<br>`skills-combat-simulator.test.ts` | Skill data, combat balance with skills |
| **BalanceTestingService** | `elite-balance.test.ts` | Elite encounter tuning |
| **DailyNoteService** | `activity-logging.test.ts` | Daily note quest logging |

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
| **BountyService** | 🟡 Medium | Bounty triggers and rewards |
| **StreakService** | 🟡 Medium | Streak tracking and Paladin shield |
| **RecurringQuestService** | 🟡 Medium | Recurring quest scheduling |
| **SmeltingService** | 🟡 Medium | Gear combining logic |
| **SetBonusService** | 🟡 Medium | Set bonus detection |
| **TemplateService** | 🟡 Medium | Template parsing and placeholders |
| **StatusEffectService** | 🟡 Medium | Buff/debuff application in combat |
| **CombatService** | 🟡 Medium | Stat derivation (partially tested via simulator) |
| **FolderWatchService** | 🟡 Medium | File watcher — hard to unit test |
| **SpriteService** | 🟢 Low | Path resolution — simple logic |
| **StatusBarService** | 🟢 Low | UI display only |
| **RecoveryTimerService** | 🟢 Low | Timer management |
| **BuffStatusProvider** | 🟢 Low | Status bar provider |
| **RecoveryTimerStatusProvider** | 🟢 Low | Status bar provider |
| **AIQuestService** | 🟢 Low | AI wrapper — hard to unit test |
| **AIDungeonService** | 🟢 Low | AI wrapper — hard to unit test |
| **TemplateStatsService** | 🟢 Low | Usage stats — cosmetic |
| **TestCharacterGenerator** | 🟢 Low | Dev tool only |

---

## Coverage by Feature Area

| Feature Area | Services | Tested | Coverage |
|---|---|---|---|
| **Quest Management** | QuestService, QuestActionsService, TaskFileService, ColumnConfigService, RecurringQuestService | 0/5 | ⬜⬜⬜⬜⬜ 0% |
| **Combat** | BattleService, CombatService, SkillService, StatusEffectService, MonsterService | 4/5 | 🟩🟩🟩🟩⬜ 80% |
| **Loot & Economy** | LootGenerationService, SetBonusService, SmeltingService | 1/3 | 🟩⬜⬜ 33% |
| **Progression** | XPSystem, StatsService, AchievementService, PowerUpService | 2/4 | 🟩🟩⬜⬜ 50% |
| **Dungeons** | DungeonMapService, UserDungeonLoader, AIDungeonService | 2/3 | 🟩🟩⬜ 67% |
| **Templates** | TemplateService, FolderWatchService, TemplateStatsService | 0/3 | ⬜⬜⬜ 0% |
| **Assets** | AssetService, SpriteService | 1/2 | 🟩⬜ 50% |
| **Support** | StreakService, BountyService, DailyNoteService, ProgressStatsService | 2/4 | 🟩🟩⬜⬜ 50% |
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

If you want to expand test coverage, here's where to get the most bang for your buck:

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
