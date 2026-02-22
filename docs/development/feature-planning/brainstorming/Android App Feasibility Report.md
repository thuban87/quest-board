# Android App Feasibility Report
## Monorepo Portability Analysis for Quest Board

**Date:** 2026-02-21
**Purpose:** Evaluate restructuring Quest Board into a monorepo to share core logic between the Obsidian plugin and a future React Native Android companion app.

**Proposed Structure:**
```
quest-board/
├── packages/
│   ├── core/          # Shared models, services, utils (pure TypeScript)
│   ├── obsidian/      # Obsidian plugin (imports core, Obsidian API bindings)
│   └── mobile/        # React Native app (imports core, native file system)
```

---

## 1. Summary Table — Every File Classified

### Legend
| Category | Meaning |
|----------|---------|
| **1 — PORTABLE AS-IS** | Zero Obsidian imports, no DOM/browser-specific code. Moves to `packages/core/` unchanged. |
| **2 — PORTABLE WITH ABSTRACTION** | Useful business logic mixed with Obsidian calls. Core logic extractable behind interfaces. |
| **3 — PLATFORM-SPECIFIC** | Fundamentally tied to Obsidian or React DOM. Stays in `packages/obsidian/`, rebuilt for mobile. |

---

### src/models/ (13 files)

| File | Cat | Rationale |
|------|-----|-----------|
| Achievement.ts | 1 | Pure data structures, no imports |
| Bounty.ts | 1 | Interface definitions only |
| Character.ts | 1 | Character model with standard JS Date operations |
| Consumable.ts | 1 | Enums and static config data |
| CustomColumn.ts | 1 | Pure validation logic, zero dependencies |
| Dungeon.ts | 1 | Dungeon data structures |
| Gear.ts | 2 | Uses `crypto.randomUUID()` — needs UUID abstraction |
| Monster.ts | 1 | Pure data structures |
| Quest.ts | 1 | Quest model with standard JS Date |
| QuestStatus.ts | 1 | Pure enum definitions |
| Skill.ts | 1 | Skill/type system definitions |
| StatusEffect.ts | 1 | Pure data structures |
| index.ts | 1 | Barrel export |

**Score: 12/13 portable as-is (92%)**

---

### src/utils/ (14 files)

| File | Cat | Rationale |
|------|-----|-----------|
| safeJson.ts | 1 | Pure JSON security utility |
| sanitizer.ts | 1 | DOMPurify wrapper (cross-platform) |
| timeFormatters.ts | 1 | Pure time formatting |
| pathfinding.ts | 1 | Pure A* algorithm |
| skillFormatters.ts | 1 | Pure text formatting |
| platform.ts | 2 | Wraps Obsidian `Platform` API — needs `IPlatformProvider` |
| validator.ts | 2 | Validation logic pure, but uses `Notice` for error display (90/10) |
| pathValidator.ts | 2 | Path logic pure, uses `Vault`/`TFile` for resolution (70/30) |
| columnMigration.ts | 2 | Migration logic pure, uses `Vault`/`TFile` for file ops (70/30) |
| gearFormatters.ts | 2 | Tooltip data is pure; DOM tooltip rendering is platform-specific (50/50) |
| FolderSuggest.ts | 3 | Extends Obsidian `AbstractInputSuggest` |
| FileSuggest.ts | 3 | Extends Obsidian `AbstractInputSuggest` |
| dailyNotesDetector.ts | 3 | Accesses Obsidian internal plugin APIs |
| index.ts | 1 | Barrel export |

**Score: 6/14 portable as-is (43%), 5 abstractable, 3 platform-specific**

---

### src/services/ (39 files) — THE KEY DIRECTORY

#### Portable As-Is (No Obsidian imports, no DOM code)

| File | Cat | Rationale |
|------|-----|-----------|
| AccessoryEffectService.ts | 1 | Pure gear effect accessors |
| BattleService.ts | 1 | Pure turn-based combat logic |
| ColumnConfigService.ts | 1 | Pure column config validation |
| CombatService.ts | 1 | Pure stat/damage calculations |
| ConsumableUsageService.ts | 1 | Pure consumable effect logic |
| DungeonMapService.ts | 1 | Pure BFS/grid calculations |
| LootGenerationService.ts | 1 | Pure procedural loot generation |
| MonsterService.ts | 1 | Pure monster scaling/stats |
| PowerUpService.ts | 1 | Pure trigger/effect evaluation |
| ProgressStatsService.ts | 1 | Pure activity data aggregation |
| SkillService.ts | 1 | Pure skill execution/type effectiveness |
| SmeltingService.ts | 1 | Pure gear smelting mechanics |
| StatsService.ts | 1 | Pure stat derivation |
| StatusEffectService.ts | 1 | Pure status effect logic |
| StreakService.ts | 1 | Pure streak tracking |
| TemplateStatsService.ts | 1 | Pure template usage stats |
| TestCharacterGenerator.ts | 1 | Pure test utility |
| XPSystem.ts | 1 | Pure XP/level math |
| RecoveryTimerStatusProvider.ts | 1 | Pure timer state (no Obsidian imports) |
| index.ts | 1 | Barrel export |

#### Portable With Abstraction (Obsidian imports, but core logic extractable)

| File | Cat | Obsidian Deps | Portable Ratio | Interface Needed |
|------|-----|---------------|----------------|------------------|
| AchievementService.ts | 2 | `Vault` | 80/20 | `IDataStore` |
| AIDungeonService.ts | 2 | `requestUrl` | 70/30 | `IHttpClient` |
| AIQuestService.ts | 2 | `requestUrl` | 70/30 | `IHttpClient` |
| AssetService.ts | 2 | `App, Vault, DataAdapter, requestUrl` | 50/50 | `IFileSystem, IHttpClient` |
| BalanceTestingService.ts | 2 | `App, TFile, TFolder` | 60/40 | `IFileSystem` |
| BountyService.ts | 2 | `requestUrl` | 80/20 | `IHttpClient` |
| DailyNoteService.ts | 2 | `Vault, TFile, TFolder` | 50/50 | `IFileSystem` |
| FolderWatchService.ts | 2 | `Vault, TFile, Notice, normalizePath` | 40/60 | `IFileSystem, IFileWatcher, INotification` |
| QuestActionsService.ts | 2 | `Vault, Notice, App, TFile` | 80/20 | `IFileSystem, INotification` |
| QuestService.ts | 2 | `App, Vault, TFile, TFolder, debounce` | 75/25 | `IFileSystem, IFileWatcher` |
| RecoveryTimerService.ts | 2 | `Notice` | 90/10 | `INotification` |
| RecurringQuestService.ts | 2 | `Vault, TFile, TFolder, normalizePath` | 75/25 | `IFileSystem` |
| SetBonusService.ts | 2 | `App, requestUrl` | 70/30 | `IHttpClient, IDataStore` |
| SpriteService.ts | 2 | `DataAdapter` | 80/20 | `IAssetResolver` |
| TaskFileService.ts | 2 | `Vault, TFile, debounce` | 85/15 | `IFileSystem, IFileWatcher` |
| TemplateService.ts | 2 | `Vault, TFile, TFolder` | 75/25 | `IFileSystem` |
| UserDungeonLoader.ts | 2 | `App, TFile, TFolder, Vault` | 80/20 | `IFileSystem` |

#### Platform-Specific (DOM-heavy, must rebuild for mobile)

| File | Cat | Rationale |
|------|-----|-----------|
| BuffStatusProvider.ts | 3 | DOM element creation, CSS class manipulation |
| StatusBarService.ts | 3 | Obsidian `Plugin` lifecycle, DOM event listeners |

**Score: 20/39 portable as-is (51%), 17 abstractable (44%), 2 platform-specific (5%)**

---

### src/store/ (8 files)

| File | Cat | Rationale |
|------|-----|-----------|
| questStore.ts | 1 | Pure Zustand state |
| characterStore.ts | 1 | Pure Zustand state |
| filterStore.ts | 1 | Pure data filtering |
| taskSectionsStore.ts | 1 | Pure task sections |
| uiStore.ts | 1 | Pure UI state |
| index.ts | 1 | Barrel export |
| battleStore.ts | 2 | Uses `localStorage` for crash recovery |
| dungeonStore.ts | 2 | Uses `crypto.randomUUID()` |

**Score: 6/8 portable as-is (75%), 2 abstractable (25%)**

---

### src/hooks/ (10 files)

| File | Cat | Rationale |
|------|-----|-----------|
| useCollapsedItems.ts | 1 | Pure React state hook |
| useDndQuests.ts | 1 | Uses @dnd-kit (framework-agnostic) |
| useFilteredQuests.ts | 1 | Pure filtering/sorting |
| index.ts | 1 | Barrel export |
| useCharacterSprite.ts | 2 | Obsidian `DataAdapter` for sprite paths |
| useQuestActions.ts | 3 | Heavy `Vault`/`App` usage |
| useQuestLoader.ts | 3 | Vault file watching, `TFile` |
| useResourceRegen.ts | 3 | Obsidian `Notice` |
| useSaveCharacter.ts | 3 | `plugin.saveSettings()` |
| useXPAward.ts | 3 | Full Obsidian integration (vault, modals, notices) |

**Score: 4/10 portable as-is (40%), 1 abstractable (10%), 5 platform-specific (50%)**

---

### src/config/ (1 file)

| File | Cat | Rationale |
|------|-----|-----------|
| combatConfig.ts | 1 | Pure constants and utility functions |

**Score: 1/1 portable as-is (100%)**

---

### src/data/ (13 files including dungeon subdirectory)

| File | Cat | Rationale |
|------|-----|-----------|
| monsters.ts | 1 | Static monster templates |
| monsterSkills.ts | 1 | Static skill definitions |
| skills.ts | 1 | Player skill definitions |
| starterGear.ts | 1 | Static gear data |
| achievements.ts | 1 | Default achievement definitions |
| uniqueItems.ts | 1 | Unique gear templates |
| TileRegistry.ts | 1 | Dungeon tile definitions |
| accessories.ts | 1 | Accessory templates |
| dungeons/index.ts | 1 | Dungeon registry |
| dungeons/*.ts (5 files) | 1 | Individual dungeon templates |

**Score: 13/13 portable as-is (100%)**

---

### src/components/ (11 files)

| File | Cat | Rationale |
|------|-----|-----------|
| CharacterCreationModal.tsx | 3 | React component (rebuildable in React Native) |
| DnDWrappers.tsx | 3 | React + @dnd-kit (web drag-and-drop) |
| FilterBar.tsx | 3 | React DOM component |
| QuestCard.tsx | 3 | React + Obsidian `App`/`Menu` |
| AchievementsSidebar.tsx | 3 | React + Obsidian `App` |
| CharacterPage.tsx | 3 | React + Obsidian `App` |
| CharacterSidebar.tsx | 3 | React component |
| DungeonView.tsx | 3 | React + Obsidian `Platform`/`DataAdapter`/`Notice` |
| FullKanban.tsx | 3 | React + Obsidian `App`/`Platform` |
| SidebarQuests.tsx | 3 | React + Obsidian `App` |
| BattleView.tsx | 3 | React + Obsidian `Platform` |

**Score: 0/11 portable as-is (0%) — all platform-specific**

Note: While these are React components (not directly portable to React Native), the **component structure, state management patterns, and Zustand store integration** are directly reusable as architecture blueprints for the React Native rebuild. React Native components would follow identical patterns with different primitives (`<View>` vs `<div>`, etc.).

---

### src/modals/ (41 files)

All 41 modal files extend Obsidian's `Modal` class and use `Setting`, `Notice`, `TFile`, etc.

**Score: 0/41 portable as-is (0%) — all platform-specific**

These represent the UI layer and would be rebuilt as React Native screens/modals.

---

### src/settings.ts (1 file)

| File | Cat | Rationale |
|------|-----|-----------|
| settings.ts | 2 | Interface definitions are portable; `PluginSettingTab` UI is platform-specific (split: 40% interface / 60% UI) |

---

## 2. Abstraction Interfaces Needed

These interfaces would live in `packages/core/` and be implemented by each platform:

### IFileSystem (Most Critical)
```typescript
interface IFileSystem {
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  create(path: string, content: string): Promise<void>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  list(folderPath: string): Promise<string[]>;
  createFolder(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  getResourcePath(path: string): string;
}
```
**Used by:** QuestService, QuestActionsService, RecurringQuestService, TaskFileService, TemplateService, DailyNoteService, FolderWatchService, UserDungeonLoader, AssetService, BalanceTestingService

### IFileWatcher
```typescript
interface IFileWatcher {
  onFileCreate(callback: (path: string) => void): () => void;
  onFileModify(callback: (path: string) => void): () => void;
  onFileRename(callback: (oldPath: string, newPath: string) => void): () => void;
  onFileDelete(callback: (path: string) => void): () => void;
}
```
**Used by:** QuestService, TaskFileService, FolderWatchService

### IHttpClient
```typescript
interface IHttpClient {
  request(url: string, options: {
    method: string;
    headers?: Record<string, string>;
    body?: string;
  }): Promise<{ json: any; status: number }>;
}
```
**Used by:** AIDungeonService, AIQuestService, BountyService, SetBonusService, AssetService

### INotification
```typescript
interface INotification {
  show(message: string, durationMs?: number): void;
  showError(message: string): void;
}
```
**Used by:** QuestActionsService, FolderWatchService, RecoveryTimerService, validator.ts

### IDataStore
```typescript
interface IDataStore {
  loadSettings(): Promise<QuestBoardSettings>;
  saveSettings(settings: QuestBoardSettings): Promise<void>;
  loadCharacter(): Promise<Character | null>;
  saveCharacter(character: Character): Promise<void>;
}
```
**Used by:** AchievementService, SetBonusService, TemplateStatsService

### IAssetResolver
```typescript
interface IAssetResolver {
  getSpritePath(className: string, tier: number): string;
  getResourcePath(relativePath: string): string;
}
```
**Used by:** SpriteService, useCharacterSprite

### IPlatformProvider
```typescript
interface IPlatformProvider {
  isMobile: boolean;
  isDesktop: boolean;
  platform: 'android' | 'ios' | 'desktop';
}
```
**Used by:** platform.ts, components using Platform

### IStorageProvider (minor)
```typescript
interface IStorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
```
**Used by:** battleStore.ts (localStorage crash recovery)

---

## 3. Verdict

### By the Numbers

| Directory | Total Files | Portable (Cat 1) | Abstractable (Cat 2) | Platform-Specific (Cat 3) |
|-----------|-------------|-------------------|-----------------------|---------------------------|
| models/ | 13 | 12 (92%) | 1 (8%) | 0 (0%) |
| utils/ | 14 | 6 (43%) | 5 (36%) | 3 (21%) |
| services/ | 39 | 20 (51%) | 17 (44%) | 2 (5%) |
| store/ | 8 | 6 (75%) | 2 (25%) | 0 (0%) |
| hooks/ | 10 | 4 (40%) | 1 (10%) | 5 (50%) |
| config/ | 1 | 1 (100%) | 0 | 0 |
| data/ | 13 | 13 (100%) | 0 | 0 |
| components/ | 11 | 0 (0%) | 0 | 11 (100%) |
| modals/ | 41 | 0 (0%) | 0 | 41 (100%) |
| settings.ts | 1 | 0 (0%) | 1 (100%) | 0 |
| **TOTAL** | **151** | **62 (41%)** | **27 (18%)** | **62 (41%)** |

### What's Actually Shareable

- **62 files (41%)** move to `packages/core/` with zero changes
- **27 files (18%)** move to `packages/core/` after extracting Obsidian deps behind interfaces
- **62 files (41%)** stay in `packages/obsidian/` and get rebuilt for mobile

But file count is misleading — the platform-specific files are almost entirely **UI** (41 modals + 11 components = 52 of the 62 platform files). The **business logic and game engine** are overwhelmingly portable:

### The Business Logic Story (What Actually Matters)

| Layer | Portable | Total | % |
|-------|----------|-------|---|
| Models (data structures) | 13/13 | 13 | **100%** |
| Data (static definitions) | 13/13 | 13 | **100%** |
| Config (constants) | 1/1 | 1 | **100%** |
| Stores (state management) | 8/8 | 8 | **100%** (2 need minor abstraction) |
| Services (business logic) | 37/39 | 39 | **95%** (17 need abstraction layer) |
| Utils (helpers) | 11/14 | 14 | **79%** |

**~95% of your game engine and business logic is shareable.** The combat system, XP calculations, loot generation, monster scaling, skill mechanics, achievements, power-ups, streaks, dungeon mapping, and all game data move to core with minimal effort.

### Is It Worth It?

**Yes, with caveats.**

**Strong reasons FOR:**
1. The game engine is the hardest, most complex code — sharing it prevents bugs from diverging implementations
2. The 8 abstraction interfaces are clean and well-scoped — this isn't a massive refactoring nightmare
3. Models, data, config, and stores move with literally zero changes (35+ files)
4. React Native can consume Zustand stores directly (same API)
5. You'd be building the mobile app's core logic for "free"

**Caveats to consider:**
1. The monorepo setup itself has overhead (workspace config, build tooling, shared tsconfig)
2. The 17 services needing abstraction will require careful interface design upfront
3. The mobile app still needs its own complete UI layer (~52 files worth of screens)
4. Testing the abstraction layer across both platforms adds complexity
5. If the mobile app never materializes, you've added complexity for nothing

**Bottom line:** The codebase is **architecturally well-suited** for this split. Your adherence to separation of concerns (services don't render UI, models don't do I/O) has already done 80% of the work. The remaining 20% is creating ~8 interfaces and injecting them into 17 service files.

---

## 4. Recommended Migration Order

### Phase 0: Monorepo Setup (prerequisite)
- Set up npm/yarn/pnpm workspaces
- Configure shared tsconfig
- Set up build pipeline for `packages/core`

### Phase 1: Zero-Risk Moves (move files with zero changes)
**Priority: Highest | Risk: None | Effort: Low**

Move these directories wholesale — they have zero Obsidian dependencies:

1. **`src/models/` → `packages/core/models/`** (12 files, minus Gear.ts UUID)
2. **`src/data/` → `packages/core/data/`** (13 files)
3. **`src/config/` → `packages/core/config/`** (1 file)

Then update import paths in the Obsidian package. This alone gives you the entire data layer shared.

### Phase 2: Pure Services (move services with zero Obsidian imports)
**Priority: High | Risk: Low | Effort: Low**

4. **Pure services → `packages/core/services/`** (20 files):
   - XPSystem, CombatService, StatsService, SkillService, StatusEffectService
   - BattleService, MonsterService, LootGenerationService, SmeltingService
   - PowerUpService, StreakService, AchievementService (logic only)
   - ColumnConfigService, DungeonMapService, ProgressStatsService
   - ConsumableUsageService, AccessoryEffectService, TemplateStatsService
   - TestCharacterGenerator, RecoveryTimerStatusProvider

### Phase 3: Stores (move Zustand stores)
**Priority: High | Risk: Low | Effort: Low**

5. **`src/store/` → `packages/core/store/`** (6 files as-is + 2 with minor abstraction)
   - Replace `localStorage` in battleStore with `IStorageProvider`
   - Replace `crypto.randomUUID()` in dungeonStore with injected UUID fn

### Phase 4: Define Abstraction Interfaces
**Priority: High | Risk: Medium | Effort: Medium**

6. Create `packages/core/interfaces/` with:
   - `IFileSystem` (most critical — used by ~10 services)
   - `IHttpClient` (used by 5 services)
   - `INotification` (used by ~4 services)
   - `IDataStore`, `IAssetResolver`, `IPlatformProvider`, `IFileWatcher`, `IStorageProvider`

7. Create `packages/obsidian/adapters/` with Obsidian implementations:
   - `ObsidianFileSystem implements IFileSystem`
   - `ObsidianHttpClient implements IHttpClient`
   - `ObsidianNotification implements INotification`
   - etc.

### Phase 5: Extract Abstractable Services
**Priority: Medium | Risk: Medium | Effort: Medium-High**

8. Refactor the 17 abstractable services to accept interfaces via constructor injection:
   - Start with `QuestService` and `TaskFileService` (most important for mobile)
   - Then `RecurringQuestService`, `TemplateService`
   - Then AI services (`AIDungeonService`, `AIQuestService`, `BountyService`, `SetBonusService`)
   - Then remaining file-dependent services

### Phase 6: Pure Utils
**Priority: Low | Risk: None | Effort: Low**

9. Move portable utils: `safeJson`, `sanitizer`, `timeFormatters`, `pathfinding`, `skillFormatters`
10. Extract pure logic from `validator.ts`, `pathValidator.ts`, `gearFormatters.ts`

---

## Appendix: File Count Summary

```
TOTAL FILES ANALYZED:  151

PORTABLE AS-IS:         62 files (41%)  →  packages/core/
PORTABLE W/ ABSTRACTION: 27 files (18%)  →  packages/core/ (after interface extraction)
PLATFORM-SPECIFIC:       62 files (41%)  →  packages/obsidian/ (rebuild for mobile)

BUSINESS LOGIC PORTABLE: ~89 files (59% of codebase, ~95% of non-UI code)
INTERFACES NEEDED:       8 interfaces
```
