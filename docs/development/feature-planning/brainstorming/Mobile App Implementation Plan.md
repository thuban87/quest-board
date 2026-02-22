# Mobile App Implementation Plan
## Monorepo Migration + React Native Companion App

> **Status:** 🔲 DRAFT — Pending Brad's review
> **Estimated Sessions:** 20–25 sessions (50–63 hours)
> **Created:** 2026-02-21
> **Last Updated:** 2026-02-21
> **Companion Log:** [[Mobile App Session Log]]
> **Related:** [[Android App Feasibility Report]]

---

## Table of Contents

- [Overview / Problem Statement](#overview--problem-statement)
- [Goals and Non-Goals](#goals-and-non-goals)
- [Key Design Decisions](#key-design-decisions)
- [Architecture](#architecture)
- [Implementation Phases](#implementation-phases)
  - [Part A: Monorepo Migration (Phases 0–5)](#part-a-monorepo-migration-phases-0-5)
  - [Part B: React Native App (Phases 6–12)](#part-b-react-native-app-phases-6-12)
- [Plan Summary](#plan-summary)
- [Data Sync Strategy](#data-sync-strategy)
- [Security & Validation](#security--validation)
- [Performance Considerations](#performance-considerations)
- [Rollback Plan](#rollback-plan)
- [Design Decision Log](#design-decision-log)
- [Verification Plan / Checklist](#verification-plan--checklist)
- [File Change Summary](#file-change-summary)
- [Key References](#key-references)

---

## Overview / Problem Statement

### What problem this solves

Quest Board currently lives as a single Obsidian plugin. All business logic — the combat engine, XP system, loot generation, gear mechanics, achievement tracking — is locked inside a codebase that only runs in Obsidian's Electron environment. Building a mobile companion app means rewriting all of this from scratch, which is both error-prone and unsustainable.

### Background

An [audit of the codebase](Android%20App%20Feasibility%20Report.md) found that **~95% of the game engine and business logic has zero Obsidian dependencies**. The architecture already separates concerns cleanly — models don't do I/O, services don't render UI. This means a monorepo extraction is feasible with minimal refactoring.

### What we're building

1. **`@quest-board/core`** — A shared TypeScript package containing all models, game logic, services, stores, and static data. Zero platform dependencies.
2. **`@quest-board/obsidian`** — The existing Obsidian plugin, refactored to import from `@quest-board/core` instead of local files.
3. **`@quest-board/mobile`** — A React Native app for iOS and Android that imports `@quest-board/core` and provides native UI + cloud vault file access.

---

## Goals and Non-Goals

### Goals

- Extract shared business logic into `@quest-board/core` without breaking the existing Obsidian plugin
- Build a React Native companion app with core RPG features (quests, character, combat, gear, achievements)
- Support data sync via shared vault files (cloud storage — provider-agnostic)
- Single React Native codebase targeting both iOS and Android
- Maintain the ability to develop and ship the Obsidian plugin independently during and after migration

### Non-Goals

- **Dungeon exploration on mobile** — Deferred. The tile-based dungeon UI is complex and desktop-oriented. Can be added later if desired.
- **AI quest/dungeon generation on mobile** — Deferred. Requires API key management on mobile. Can be added later.
- **Template system ("Scrivener's Desk") on mobile** — Desktop feature, not needed on mobile.
- **Real-time sync** — We're using file-based sync through cloud storage, not a live sync server. Changes propagate when files sync.
- **Obsidian community plugin submission** — Not part of this plan. The plugin already works; the monorepo change is internal.
- **Public release of the mobile app** — This is for personal use. No App Store/Play Store submission planned.

> [!NOTE]
> **Future considerations (intentionally excluded):**
> - Push notifications for recurring quests
> - Mobile widgets showing character stats
> - Offline-first conflict resolution (files may conflict if edited on two devices simultaneously — we'll handle this simply by treating the most recently modified file as canonical)

---

## Key Design Decisions

### 1. npm Workspaces for Monorepo

**Decision:** Use npm workspaces (built into npm) rather than pnpm, yarn, or Turborepo.

**Why:** Brad already uses npm. Zero new tooling to learn. The monorepo has only 3 packages — no need for the build orchestration that Turborepo provides. npm workspaces handle dependency hoisting and cross-package imports natively.

**Tradeoff:** Slower installs than pnpm, no build caching like Turborepo. Acceptable at this scale.

### 2. React Native with Expo

**Decision:** Use Expo (managed workflow) for the React Native app, not bare React Native CLI.

**Why:**
- Expo handles iOS and Android build tooling, eliminating the need to install Android Studio and Xcode for basic development
- Expo Go app enables live testing on a physical device without compiling native code
- EAS Build can produce standalone APKs/IPAs when ready
- File system access is available via `expo-file-system`
- Expo SDK includes everything we need (file system, storage, notifications)

**Tradeoff:** Some native modules require "dev client" builds instead of Expo Go. We don't anticipate needing any for our feature set.

### 3. Shared Vault Files for Data Sync

**Decision:** The mobile app reads and writes the same markdown quest files and `data.json` that the Obsidian plugin uses, synced via cloud storage.

**Why:** This is the simplest approach that keeps a single source of truth. No backend to build or maintain. The vault files are already human-readable markdown with YAML frontmatter — easily parsed on any platform.

**Tradeoff:** Sync depends on the cloud provider's sync speed. Conflicts are possible if both platforms edit the same file simultaneously. We accept this risk for personal use.

### 4. Provider-Agnostic Cloud Storage

**Decision:** Abstract file system access behind an `IFileSystem` interface so the mobile app can support Google Drive, iCloud, or local storage interchangeably.

**Why:** Brad hasn't committed to a single cloud provider. Google Drive is the current production location, but iCloud is natural for iOS. The abstraction costs very little and keeps options open.

### 5. Core Package Is Pure TypeScript — No React

**Decision:** `@quest-board/core` contains zero React code. Zustand stores are included (Zustand works without React), but React hooks stay in the platform packages.

**Why:** The core package must work in any JavaScript environment — Obsidian's Electron, React Native's Hermes engine, Node.js for testing. React is a rendering concern that belongs in the platform layer.

### 6. Dependency Injection for Platform Services

**Decision:** Services that need platform capabilities (file I/O, HTTP, notifications) receive them via constructor injection, not global imports.

**Why:** This is the standard pattern for cross-platform code. The core defines interfaces; each platform provides implementations. It's testable (inject mocks) and explicit (dependencies are visible in the constructor).

### 7. Parallel Development Strategy

**Decision:** During migration, files exist in both `src/` (original) and `packages/core/src/` (extracted). The Obsidian plugin continues building from `src/` until the cutover phase. No dual-maintenance — the originals in `src/` are the source of truth until the switch.

**Why:** Brad wants to continue shipping plugin bug fixes during the migration period. This approach means the plugin build pipeline is untouched until we're confident the core package works correctly. The "cutover" is a single coordinated session where `src/` imports switch to `@quest-board/core`.

---

## Architecture

### Package Structure

```
quest-board/
├── package.json                    # Root workspace config
├── packages/
│   ├── core/                       # @quest-board/core
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── models/             # All 13 model files
│   │       ├── data/               # All 13 static data files
│   │       ├── config/             # combatConfig.ts
│   │       ├── services/           # 37 service files (pure + abstracted)
│   │       ├── store/              # 8 Zustand store files
│   │       ├── utils/              # 11 portable util files
│   │       └── interfaces/         # Platform abstraction interfaces
│   │           ├── IFileSystem.ts
│   │           ├── IHttpClient.ts
│   │           ├── INotification.ts
│   │           ├── IDataStore.ts
│   │           ├── IAssetResolver.ts
│   │           ├── IPlatformProvider.ts
│   │           ├── IFileWatcher.ts
│   │           └── IStorageProvider.ts
│   │
│   ├── obsidian/                   # @quest-board/obsidian
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── esbuild.config.mjs
│   │   ├── main.ts
│   │   └── src/
│   │       ├── adapters/           # Obsidian implementations of core interfaces
│   │       │   ├── ObsidianFileSystem.ts
│   │       │   ├── ObsidianHttpClient.ts
│   │       │   ├── ObsidianNotification.ts
│   │       │   ├── ObsidianDataStore.ts
│   │       │   ├── ObsidianAssetResolver.ts
│   │       │   └── ObsidianFileWatcher.ts
│   │       ├── components/         # React components (11 files, unchanged)
│   │       ├── hooks/              # React hooks (10 files)
│   │       ├── modals/             # Obsidian modals (41 files, unchanged)
│   │       ├── views/              # Obsidian views (6 files, unchanged)
│   │       ├── styles/             # CSS modules (unchanged)
│   │       ├── utils/              # Obsidian-specific utils (3 files)
│   │       │   ├── FolderSuggest.ts
│   │       │   ├── FileSuggest.ts
│   │       │   └── dailyNotesDetector.ts
│   │       └── settings.ts
│   │
│   └── mobile/                     # @quest-board/mobile
│       ├── package.json
│       ├── tsconfig.json
│       ├── app.json                # Expo config
│       ├── App.tsx                 # Entry point
│       └── src/
│           ├── adapters/           # React Native implementations of core interfaces
│           │   ├── MobileFileSystem.ts
│           │   ├── MobileHttpClient.ts
│           │   ├── MobileNotification.ts
│           │   ├── MobileDataStore.ts
│           │   └── MobileAssetResolver.ts
│           ├── screens/            # React Native screens
│           │   ├── QuestListScreen.tsx
│           │   ├── QuestDetailScreen.tsx
│           │   ├── CharacterScreen.tsx
│           │   ├── CombatScreen.tsx
│           │   ├── InventoryScreen.tsx
│           │   └── AchievementsScreen.tsx
│           ├── components/         # Shared mobile components
│           ├── navigation/         # React Navigation setup
│           └── theme/              # Mobile-specific theming
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   @quest-board/core                      │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐           │
│  │  Models   │  │  Services  │  │   Stores   │           │
│  │  (data)   │←─│  (logic)   │──│ (Zustand)  │           │
│  └──────────┘  └─────┬──────┘  └────────────┘           │
│                      │                                    │
│              ┌───────┴───────┐                            │
│              │  Interfaces   │                            │
│              │ (IFileSystem, │                            │
│              │  IHttpClient) │                            │
│              └───────┬───────┘                            │
└──────────────────────┼───────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │                         │
          ▼                         ▼
┌─────────────────┐     ┌─────────────────┐
│ @quest-board/    │     │ @quest-board/    │
│ obsidian         │     │ mobile           │
│                  │     │                  │
│ ObsidianFS ─────►│     │◄──── MobileFS   │
│ Components       │     │     Screens      │
│ Modals           │     │     Navigation   │
│ Views            │     │     Theme        │
└─────────────────┘     └─────────────────┘
          │                         │
          ▼                         ▼
    ┌───────────┐           ┌───────────┐
    │ Obsidian  │           │  iOS /    │
    │  Vault    │◄─ cloud ─►│ Android   │
    │  Files    │   sync    │  Device   │
    └───────────┘           └───────────┘
```

### Abstraction Interfaces

```typescript
// packages/core/src/interfaces/IFileSystem.ts
export interface IFileSystem {
  /** Read file contents as string */
  read(path: string): Promise<string>;
  /** Write string contents to file (create or overwrite) */
  write(path: string, content: string): Promise<void>;
  /** Create a new file (error if exists) */
  create(path: string, content: string): Promise<void>;
  /** Delete a file */
  delete(path: string): Promise<void>;
  /** Check if file exists */
  exists(path: string): Promise<boolean>;
  /** List files in a folder */
  list(folderPath: string): Promise<string[]>;
  /** Create folder (recursive) */
  createFolder(path: string): Promise<void>;
  /** Rename/move a file */
  rename(oldPath: string, newPath: string): Promise<void>;
  /** Normalize a path for the platform */
  normalizePath(path: string): string;
}

// packages/core/src/interfaces/IFileWatcher.ts
export interface IFileWatcher {
  onFileCreate(callback: (path: string) => void): () => void;
  onFileModify(callback: (path: string) => void): () => void;
  onFileRename(callback: (oldPath: string, newPath: string) => void): () => void;
  onFileDelete(callback: (path: string) => void): () => void;
}

// packages/core/src/interfaces/IHttpClient.ts
export interface IHttpClient {
  request(options: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string;
  }): Promise<{ status: number; json: unknown; text: string }>;
}

// packages/core/src/interfaces/INotification.ts
export interface INotification {
  show(message: string, durationMs?: number): void;
  showError(message: string): void;
}

// packages/core/src/interfaces/IDataStore.ts
export interface IDataStore {
  load<T>(key: string): Promise<T | null>;
  save<T>(key: string, data: T): Promise<void>;
}

// packages/core/src/interfaces/IAssetResolver.ts
export interface IAssetResolver {
  getSpritePath(relativePath: string): string;
  getResourcePath(relativePath: string): string;
}

// packages/core/src/interfaces/IPlatformProvider.ts
export interface IPlatformProvider {
  isMobile: boolean;
  isDesktop: boolean;
  platform: 'android' | 'ios' | 'desktop';
}

// packages/core/src/interfaces/IStorageProvider.ts
export interface IStorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
```

---

## Implementation Phases

### Part A: Monorepo Migration (Phases 0–5)

> [!IMPORTANT]
> Part A extracts the core logic and restructures the Obsidian plugin. This is the prerequisite for building the mobile app. All phases in Part A should be completed before starting Part B.

---

#### Phase 0: Monorepo Scaffolding
**Estimated Time:** 1.5–2 hours
**Prerequisite:** None
**Goal:** Set up the npm workspace structure, package configs, and build tooling without touching any existing source code.

**Tasks:**
- [ ] Create root `package.json` workspace config pointing to `packages/*`
- [ ] Create `packages/core/package.json` with name `@quest-board/core`
- [ ] Create `packages/core/tsconfig.json` (target ES2018, strict, no JSX)
- [ ] Create `packages/core/src/` directory structure (models, services, store, data, config, utils, interfaces)
- [ ] Create `packages/core/src/index.ts` barrel export
- [ ] Create `packages/obsidian/package.json` with dependency on `@quest-board/core`
- [ ] Verify `npm install` resolves workspace dependencies
- [ ] Verify existing `npm run build` still works unchanged (the obsidian package doesn't use core yet)

**Testing:** Manual — verify `npm install` and `npm run build` succeed.

> [!NOTE]
> The existing `src/`, `main.ts`, `esbuild.config.mjs`, etc. remain at the repo root during this phase. They'll move to `packages/obsidian/` during the cutover phase (Phase 4).

#### Tech Debt:
- Root-level source files still exist alongside `packages/` directory. This is intentional and resolved in Phase 4.

---

#### Phase 0.5: Tests — Monorepo Scaffolding
**Estimated Time:** 0.5 hours
**Prerequisite:** Phase 0

> [!NOTE]
> This phase is lightweight. The scaffolding phase creates no business logic — just directory structure and config files. Verification is limited to build/install sanity checks.

**Tasks:**
- [ ] Run `npm install` from root — verify no errors, verify workspace symlinks created
- [ ] Run `npm run build` — verify Obsidian plugin still builds identically
- [ ] Run `npm run test:run` — verify all existing tests still pass
- [ ] Create a trivial test in `packages/core/` to verify the test runner works there too

---

#### Phase 1: Zero-Risk File Migration
**Estimated Time:** 2–2.5 hours
**Prerequisite:** Phase 0
**Goal:** Copy all files with zero Obsidian dependencies into `packages/core/`. Fix internal import paths. These files move with no logic changes.

**Files to copy (48 files):**

**Models (12 files):**
- `Achievement.ts`, `Bounty.ts`, `Character.ts`, `Consumable.ts`, `CustomColumn.ts`, `Dungeon.ts`, `Monster.ts`, `Quest.ts`, `QuestStatus.ts`, `Skill.ts`, `StatusEffect.ts`, `index.ts`

**Data (13 files):**
- `monsters.ts`, `monsterSkills.ts`, `skills.ts`, `starterGear.ts`, `achievements.ts`, `uniqueItems.ts`, `TileRegistry.ts`, `accessories.ts`, `dungeons/index.ts`, `dungeons/*.ts` (5 dungeon templates)

**Config (1 file):**
- `combatConfig.ts`

**Pure Utils (5 files):**
- `safeJson.ts`, `sanitizer.ts`, `timeFormatters.ts`, `pathfinding.ts`, `skillFormatters.ts`

**Pure Stores (6 files):**
- `questStore.ts`, `characterStore.ts`, `filterStore.ts`, `taskSectionsStore.ts`, `uiStore.ts`, `index.ts`

**Tasks:**
- [ ] Copy all 48 files into their respective `packages/core/src/` directories
- [ ] Fix internal import paths (e.g., `../models/Character` → `../models/Character` — paths should be the same within core)
- [ ] Verify `packages/core/` compiles with `tsc --noEmit`
- [ ] Create barrel exports in `packages/core/src/index.ts`

> [!IMPORTANT]
> **Do not modify the originals in `src/`.** The Obsidian plugin continues building from its existing files. The copies in `packages/core/` are the future source of truth but are not yet consumed by anything.

#### Tech Debt:
- Duplicated files between `src/` and `packages/core/src/`. Resolved in Phase 4 cutover.
- `Gear.ts` excluded from this phase — it uses `crypto.randomUUID()` and needs a minor abstraction (Phase 2).

---

#### Phase 1.5: Tests — Zero-Risk Files
**Estimated Time:** 1.5–2 hours
**Prerequisite:** Phase 1
**Coverage Target:** ≥80% line, ≥80% branch for core package files
**Test File Location:** `packages/core/test/`

**Tasks:**
- [ ] Set up Vitest config for `packages/core/` (similar to root `vitest.config.ts`)
- [ ] Copy applicable existing tests from `test/` into `packages/core/test/` and update imports
- [ ] Verify all copied tests pass against the core package files
- [ ] Add basic smoke tests for barrel exports (verify all expected exports exist)

**Key Test Cases:**
- All model constructors/defaults work
- All data files export expected structures
- combatConfig functions return correct values
- Pure utils (safeJson, sanitizer, timeFormatters, pathfinding) work identically
- Store initial states are correct

**Command:** `cd packages/core && npx vitest run`

---

#### Phase 2: Abstraction Interfaces + Pure Services
**Estimated Time:** 2.5–3 hours
**Prerequisite:** Phase 1
**Goal:** Create the 8 abstraction interfaces in core. Migrate `Gear.ts` (with UUID abstraction). Copy all 20 pure services (no Obsidian imports) into core. Copy 2 stores that need minor abstraction (`battleStore`, `dungeonStore`).

**Tasks:**

**Interfaces (8 files — NEW):**
- [ ] Create `packages/core/src/interfaces/IFileSystem.ts`
- [ ] Create `packages/core/src/interfaces/IHttpClient.ts`
- [ ] Create `packages/core/src/interfaces/INotification.ts`
- [ ] Create `packages/core/src/interfaces/IDataStore.ts`
- [ ] Create `packages/core/src/interfaces/IAssetResolver.ts`
- [ ] Create `packages/core/src/interfaces/IPlatformProvider.ts`
- [ ] Create `packages/core/src/interfaces/IFileWatcher.ts`
- [ ] Create `packages/core/src/interfaces/IStorageProvider.ts`
- [ ] Create `packages/core/src/interfaces/index.ts` barrel export

**Gear.ts fix:**
- [ ] Copy `Gear.ts` to `packages/core/src/models/`
- [ ] Replace `crypto.randomUUID()` with an injected `generateId()` function or import from a tiny cross-platform UUID utility

**Pure Services (20 files — COPY):**
- [ ] Copy: `AccessoryEffectService.ts`, `BattleService.ts`, `ColumnConfigService.ts`, `CombatService.ts`, `ConsumableUsageService.ts`, `DungeonMapService.ts`, `LootGenerationService.ts`, `MonsterService.ts`, `PowerUpService.ts`, `ProgressStatsService.ts`, `SkillService.ts`, `SmeltingService.ts`, `StatsService.ts`, `StatusEffectService.ts`, `StreakService.ts`, `TemplateStatsService.ts`, `TestCharacterGenerator.ts`, `XPSystem.ts`, `RecoveryTimerStatusProvider.ts`, `index.ts`
- [ ] Fix import paths within core

**Stores with minor abstraction (2 files):**
- [ ] Copy `battleStore.ts` — replace `localStorage` with `IStorageProvider` parameter
- [ ] Copy `dungeonStore.ts` — replace `crypto.randomUUID()` with injected ID generator

**Tasks:**
- [ ] Verify `packages/core/` compiles with `tsc --noEmit`

#### Tech Debt:
- Pure services are copies, not yet consumed by Obsidian plugin. Resolved in Phase 4.

---

#### Phase 2.5: Tests — Interfaces + Pure Services
**Estimated Time:** 2–2.5 hours
**Prerequisite:** Phase 2
**Coverage Target:** ≥80% line, ≥80% branch
**Test File Location:** `packages/core/test/`

**Tasks:**
- [ ] Copy applicable existing tests (combat, battle, monster, loot, smelting, power-up, streak, achievement tests) into core test directory
- [ ] Create mock implementations of all 8 interfaces for testing
- [ ] Write tests verifying `battleStore` works with mock `IStorageProvider`
- [ ] Write tests verifying `dungeonStore` works with mock UUID generator
- [ ] Verify `Gear.ts` ID generation works with abstracted UUID

**Key Test Cases:**
- All 20 pure services produce identical results to their `src/` originals
- Interface mocks can be injected and services function correctly
- Store crash recovery works with mock storage provider

**Command:** `cd packages/core && npx vitest run`

---

#### Phase 3: Abstractable Services Migration
**Estimated Time:** 3–4 hours (largest phase)
**Prerequisite:** Phase 2
**Goal:** Refactor the 17 services that import from `obsidian` to instead accept abstraction interfaces via constructor/parameter injection. Copy the refactored versions into core.

> [!IMPORTANT]
> This is the most complex phase. Each service needs its Obsidian imports replaced with interface parameters. The logic stays identical — only the I/O layer changes.

**Files to refactor and copy (17 files):**

| Service | Obsidian Deps | Replace With |
|---------|---------------|--------------|
| QuestService.ts | `App, Vault, TFile, TFolder, debounce` | `IFileSystem, IFileWatcher` |
| QuestActionsService.ts | `Vault, Notice, App, TFile` | `IFileSystem, INotification` |
| RecurringQuestService.ts | `Vault, TFile, TFolder, normalizePath` | `IFileSystem` |
| TaskFileService.ts | `Vault, TFile, debounce` | `IFileSystem, IFileWatcher` |
| TemplateService.ts | `Vault, TFile, TFolder` | `IFileSystem` |
| AchievementService.ts | `Vault` | `IDataStore` |
| DailyNoteService.ts | `Vault, TFile, TFolder` | `IFileSystem` |
| FolderWatchService.ts | `Vault, TFile, Notice, normalizePath` | `IFileSystem, IFileWatcher, INotification` |
| UserDungeonLoader.ts | `App, TFile, TFolder, Vault` | `IFileSystem` |
| AIDungeonService.ts | `requestUrl` | `IHttpClient` |
| AIQuestService.ts | `requestUrl` | `IHttpClient` |
| BountyService.ts | `requestUrl` | `IHttpClient` |
| SetBonusService.ts | `App, requestUrl` | `IHttpClient, IDataStore` |
| SpriteService.ts | `DataAdapter` | `IAssetResolver` |
| AssetService.ts | `App, Vault, DataAdapter, requestUrl` | `IFileSystem, IHttpClient` |
| BalanceTestingService.ts | `App, TFile, TFolder` | `IFileSystem` |
| RecoveryTimerService.ts | `Notice` | `INotification` |

**Tasks:**
- [ ] For each service: refactor constructor/factory to accept interface parameters instead of Obsidian types
- [ ] Remove all `import ... from 'obsidian'` lines from core versions
- [ ] Replace `Vault.read(file)` → `fileSystem.read(path)` patterns
- [ ] Replace `new Notice()` → `notification.show()` patterns
- [ ] Replace `requestUrl()` → `httpClient.request()` patterns
- [ ] Verify `packages/core/` compiles with zero `obsidian` imports: `grep -r "from 'obsidian'" packages/core/src/` returns nothing
- [ ] Verify `tsc --noEmit` passes

**Approach for each service:**
1. Read the original file to understand all Obsidian API usage points
2. Create the core version with interface parameters in the constructor
3. Keep all business logic identical — only change the I/O calls
4. Ensure the core version has no Obsidian imports

#### Tech Debt:
- Some services use Obsidian's `debounce` utility. Need a platform-agnostic debounce (trivial to implement or import from lodash).
- Services using `moment` (provided globally by Obsidian) need a standard date library alternative for core. Consider `date-fns` or vanilla `Intl.DateTimeFormat`.

---

#### Phase 3.5: Tests — Abstractable Services
**Estimated Time:** 2.5–3 hours
**Prerequisite:** Phase 3
**Coverage Target:** ≥80% line, ≥80% branch
**Test File Location:** `packages/core/test/`

**Tasks:**
- [ ] Create comprehensive mock implementations of `IFileSystem`, `IHttpClient`, `INotification`
- [ ] Write tests for each of the 17 refactored services using mock interfaces
- [ ] Test that quest CRUD operations work through `IFileSystem` mock
- [ ] Test that AI services work through `IHttpClient` mock
- [ ] Test that notification-dependent services work through `INotification` mock
- [ ] Copy and adapt existing tests for services that had test coverage

**Key Test Cases:**
- QuestService: CRUD operations via mock file system
- RecurringQuestService: schedule generation with mock file creation
- AI services: prompt construction and response parsing with mock HTTP
- BountyService: template generation with and without API
- TaskFileService: task parsing and checkbox toggling via mock files

**Command:** `cd packages/core && npx vitest run`

---

#### Phase 4: Build Cutover
**Estimated Time:** 2.5–3 hours
**Prerequisite:** Phase 3 (all core tests passing)
**Goal:** Switch the Obsidian plugin to import from `@quest-board/core` instead of local files. Move Obsidian-specific files into `packages/obsidian/`. Create Obsidian adapter implementations.

> [!CAUTION]
> This is the point of no return. After this phase, the Obsidian plugin depends on the core package. Make sure all Phase 3.5 tests pass first. Create a git branch before starting.

**Tasks:**

**Create Obsidian adapters (6 files — NEW):**
- [ ] `packages/obsidian/src/adapters/ObsidianFileSystem.ts` — wraps `Vault` API
- [ ] `packages/obsidian/src/adapters/ObsidianHttpClient.ts` — wraps `requestUrl`
- [ ] `packages/obsidian/src/adapters/ObsidianNotification.ts` — wraps `Notice`
- [ ] `packages/obsidian/src/adapters/ObsidianDataStore.ts` — wraps `loadData`/`saveData`
- [ ] `packages/obsidian/src/adapters/ObsidianAssetResolver.ts` — wraps `DataAdapter`
- [ ] `packages/obsidian/src/adapters/ObsidianFileWatcher.ts` — wraps vault events

**Move Obsidian-specific files:**
- [ ] Move `main.ts` → `packages/obsidian/main.ts`
- [ ] Move `src/components/` → `packages/obsidian/src/components/`
- [ ] Move `src/hooks/` → `packages/obsidian/src/hooks/`
- [ ] Move `src/modals/` → `packages/obsidian/src/modals/`
- [ ] Move `src/views/` → `packages/obsidian/src/views/`
- [ ] Move `src/styles/` → `packages/obsidian/src/styles/`
- [ ] Move `src/settings.ts` → `packages/obsidian/src/settings.ts`
- [ ] Move Obsidian-specific utils (`FolderSuggest.ts`, `FileSuggest.ts`, `dailyNotesDetector.ts`) → `packages/obsidian/src/utils/`
- [ ] Move `esbuild.config.mjs` → `packages/obsidian/`
- [ ] Move `postcss.config.cjs` → `packages/obsidian/`

**Update imports everywhere:**
- [ ] Update all files in `packages/obsidian/` to import models, services, stores, utils from `@quest-board/core`
- [ ] Update `main.ts` to instantiate Obsidian adapters and inject them into core services
- [ ] Update `esbuild.config.mjs` entry point and output paths
- [ ] Update build scripts in root `package.json`

**Delete originals:**
- [ ] Remove `src/models/`, `src/services/`, `src/store/`, `src/data/`, `src/config/`, `src/utils/` (portable files) from root `src/`
- [ ] Remove remaining root `src/` directory (should be empty)

**Verify:**
- [ ] `npm run build` produces working `main.js` and `styles.css`
- [ ] Deploy to test vault and manually verify the plugin works

#### Tech Debt:
- Import paths across 60+ Obsidian files need updating. Consider using a search-and-replace script.

---

#### Phase 4.5: Tests — Build Cutover
**Estimated Time:** 1.5–2 hours
**Prerequisite:** Phase 4
**Coverage Target:** Existing tests continue to pass
**Test File Location:** `packages/obsidian/test/` and `packages/core/test/`

**Tasks:**
- [ ] Move remaining Obsidian-specific tests to `packages/obsidian/test/`
- [ ] Update test imports to use `@quest-board/core`
- [ ] Write adapter unit tests (mock Obsidian API, verify adapters call correct methods)
- [ ] Run full test suite from root: `npm run test:run`
- [ ] Deploy to test vault — full manual smoke test

**Key Test Cases:**
- All existing tests pass with new import paths
- ObsidianFileSystem adapter correctly wraps Vault.read/write/create/delete
- ObsidianHttpClient adapter correctly wraps requestUrl
- ObsidianNotification adapter correctly wraps Notice
- Plugin loads, quests display, combat works, gear equips

**Command:** `npm run test:run` (from root, runs all workspace tests)

---

#### Phase 5: Portable Utils Migration
**Estimated Time:** 1.5–2 hours
**Prerequisite:** Phase 4
**Goal:** Extract the remaining portable utility logic from mixed utils files. Move the pure validation logic, path logic, column migration logic, and gear formatter data logic into core, leaving only the Obsidian-specific UI/DOM code in the obsidian package.

**Files to split:**
- [ ] `validator.ts` — extract validation rules to core, leave `Notice` calls in obsidian wrapper
- [ ] `pathValidator.ts` — extract path logic to core, leave `Vault`/`TFile` usage in obsidian adapter
- [ ] `columnMigration.ts` — extract migration logic to core, leave vault file ops in obsidian adapter
- [ ] `gearFormatters.ts` — extract tooltip data formatting to core, leave DOM tooltip rendering in obsidian
- [ ] `platform.ts` — replace with `IPlatformProvider` from core interfaces

#### Tech Debt:
- `gearFormatters.ts` is the messiest split — it mixes data formatting with DOM tooltip positioning. The core version should return formatted data objects; the obsidian version renders them into DOM.

---

#### Phase 5.5: Tests — Portable Utils
**Estimated Time:** 1 hour
**Prerequisite:** Phase 5
**Coverage Target:** ≥80% line, ≥80% branch for extracted utils
**Test File Location:** `packages/core/test/`

**Tasks:**
- [ ] Test extracted validation rules
- [ ] Test path validation logic
- [ ] Test column migration logic
- [ ] Test gear formatter data output
- [ ] Verify obsidian wrappers still work with core utils

**Command:** `npm run test:run`

---

### Part B: React Native App (Phases 6–12)

> [!IMPORTANT]
> Part B builds the actual mobile app. It requires all of Part A to be complete (the core package must be stable and tested).

---

#### Phase 6: React Native Environment Setup
**Estimated Time:** 2–2.5 hours
**Prerequisite:** Phase 5 (all of Part A complete)
**Goal:** Set up the React Native development environment with Expo, create the app scaffold, and verify the core package integrates.

**Tasks:**
- [ ] Install Expo CLI globally: `npm install -g expo-cli`
- [ ] Create Expo app: `npx create-expo-app packages/mobile --template blank-typescript`
- [ ] Update `packages/mobile/package.json` to add `@quest-board/core` workspace dependency
- [ ] Install React Navigation: `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/stack`
- [ ] Install `expo-file-system` for local file access
- [ ] Install `react-native-safe-area-context`, `react-native-screens`, `react-native-gesture-handler`
- [ ] Install Zustand (should be hoisted from workspace)
- [ ] Create basic navigation skeleton (tab navigator with placeholder screens)
- [ ] Verify core package imports work: `import { Quest, XPSystem } from '@quest-board/core'`
- [ ] Run on Expo Go (physical device or emulator): `npx expo start`

**Testing:** Manual — app launches, navigation works, core imports resolve.

> [!NOTE]
> No dedicated test phase for environment setup. This is a scaffolding phase — verification is "does it launch?"

---

#### Phase 6.5: Visual Prototype — "Quest Board on a Phone"
**Estimated Time:** 2–2.5 hours
**Prerequisite:** Phase 6
**Goal:** Build a visual prototype using hardcoded fake data — no core package integration, no file I/O, no cloud storage. Just a screen that looks and feels like Quest Board running on your phone. Something to hold in your hand and scroll through.

> [!NOTE]
> No dedicated test phase for this prototype. It's throwaway UI that gets replaced by real screens in Phases 8–10. The goal is dopamine, not production code.

**Screens to build (with fake data):**

**Quest List (main screen):**
- [ ] Column headers matching your kanban layout (Available → Active → In Progress → Completed)
- [ ] 8–10 hardcoded quest cards with realistic names from your vault
- [ ] Priority color coding (red/orange/yellow/green borders)
- [ ] Task progress bars on each card (e.g., "3/5 tasks")
- [ ] Tappable cards that navigate to a detail view

**Quest Detail (tap a card):**
- [ ] Quest title, priority badge, category tag
- [ ] Task checklist with tappable checkboxes (toggle locally, no persistence)
- [ ] XP reward display
- [ ] Due date and creation date
- [ ] A satisfying checkbox animation when you tap a task

**Character Header (visible on quest list):**
- [ ] Character name, class, and level
- [ ] XP progress bar (animated fill)
- [ ] Class-colored theme (warrior red, technomancer blue, etc.)
- [ ] Small character sprite placeholder

**Visual polish:**
- [ ] RPG-themed color palette matching the Obsidian plugin
- [ ] Class-based accent colors
- [ ] Tier-colored gear slot indicators on character header
- [ ] Dark mode (matching Obsidian's dark theme)

**What this proves:**
- React Native can render the Quest Board aesthetic
- Navigation between screens works on a real device
- The RPG visual identity translates to mobile
- You have something tangible to show for Part A's infrastructure work

#### Tech Debt:
- All data is hardcoded. Gets replaced by real store/service integration in Phase 8.
- Component structure is quick and dirty. Gets refactored into proper components in later phases.
- No accessibility considerations yet.

---

#### Phase 7: Mobile Adapters
**Estimated Time:** 2.5–3 hours
**Prerequisite:** Phase 6
**Goal:** Implement the core abstraction interfaces for the React Native environment. This is the mobile equivalent of the Obsidian adapters from Phase 4.

**Tasks:**

**MobileFileSystem (most critical):**
- [ ] Implement `IFileSystem` using `expo-file-system` for local vault access
- [ ] Support reading/writing quest markdown files from a configured vault directory
- [ ] Handle YAML frontmatter parsing (same format as Obsidian)
- [ ] Implement path normalization for mobile file systems

**MobileHttpClient:**
- [ ] Implement `IHttpClient` using React Native's built-in `fetch` API
- [ ] Handle Gemini API calls (same endpoints as Obsidian plugin)

**MobileNotification:**
- [ ] Implement `INotification` using React Native `Alert` or a toast library (`react-native-toast-message`)

**MobileDataStore:**
- [ ] Implement `IDataStore` using `expo-file-system` or `AsyncStorage`
- [ ] Store character data, settings, achievements in app-local storage
- [ ] Support reading `data.json` from the vault (for syncing character/settings from desktop)

**MobileAssetResolver:**
- [ ] Implement `IAssetResolver` for sprite/asset paths in the mobile context
- [ ] Bundle critical sprites with the app or load from vault

**Cloud storage integration:**
- [ ] Research and implement vault folder selection (let user point to their synced vault folder)
- [ ] For Google Drive: use SAF (Storage Access Framework) on Android via `expo-document-picker` or `react-native-saf-x`
- [ ] For iCloud: use `expo-file-system` with iCloud container paths on iOS
- [ ] Create a `VaultConfigScreen` where the user selects their vault location

#### Tech Debt:
- Cloud storage access is the biggest unknown. May need native modules or a "dev client" build instead of Expo Go. Flag this as a potential blocker during implementation.
- File watching on mobile is limited — may need to poll for changes instead of getting real-time events.

---

#### Phase 7.5: Tests — Mobile Adapters
**Estimated Time:** 1.5–2 hours
**Prerequisite:** Phase 7
**Coverage Target:** ≥80% line, ≥80% branch
**Test File Location:** `packages/mobile/test/`

**Tasks:**
- [ ] Set up Jest for React Native testing (Expo default)
- [ ] Write unit tests for `MobileFileSystem` with mocked `expo-file-system`
- [ ] Write unit tests for `MobileHttpClient` with mocked `fetch`
- [ ] Write unit tests for `MobileDataStore` with mocked storage
- [ ] Test vault folder configuration and path resolution

**Key Test Cases:**
- Reading a quest markdown file produces correct Quest object
- Writing a quest produces valid markdown with frontmatter
- HTTP requests are correctly formatted for Gemini API
- Data store persists and retrieves character data correctly

**Command:** `cd packages/mobile && npx jest`

---

#### Phase 8: Quest Management UI
**Estimated Time:** 3–4 hours
**Prerequisite:** Phase 7
**Goal:** Build the quest list and detail screens — the core mobile experience. Users should be able to view quests, mark tasks complete, and see quest status.

**Screens to build:**
- [ ] `QuestListScreen.tsx` — List of all quests, grouped by status/column, pull-to-refresh
- [ ] `QuestDetailScreen.tsx` — Full quest view with task checkboxes, metadata, priority
- [ ] `QuestCreateScreen.tsx` — Simple quest creation form (title, priority, category, due date)

**Components to build:**
- [ ] `QuestCard.tsx` — Compact quest card for list view (priority color, task progress bar)
- [ ] `TaskCheckbox.tsx` — Tappable task item with completion animation
- [ ] `StatusBadge.tsx` — Quest status indicator

**Integration:**
- [ ] Connect to `questStore` from `@quest-board/core`
- [ ] Use `QuestService` (with `MobileFileSystem`) for quest CRUD
- [ ] Use `QuestActionsService` for move/complete/archive actions
- [ ] Implement pull-to-refresh (re-read quest files from vault)

**Design notes:**
- Use React Native's `FlatList` for performant quest lists
- Touch targets minimum 44x44px per Obsidian mobile guidelines
- Follow the RPG visual theme (class colors, XP bars)

#### Tech Debt:
- No drag-and-drop reordering on mobile initially. Can add later with `react-native-draggable-flatlist`.
- Quest filtering/search deferred to later polish phase.

---

#### Phase 8.5: Tests — Quest Management UI
**Estimated Time:** 1.5–2 hours
**Prerequisite:** Phase 8
**Coverage Target:** ≥80% line, ≥80% branch
**Test File Location:** `packages/mobile/test/`

**Tasks:**
- [ ] Write component tests using React Native Testing Library
- [ ] Test quest list rendering with mock quest data
- [ ] Test task checkbox toggle triggers correct store actions
- [ ] Test quest creation form validation
- [ ] Test pull-to-refresh triggers file reload

**Command:** `cd packages/mobile && npx jest`

---

#### Phase 9: Character & Combat UI
**Estimated Time:** 3–4 hours
**Prerequisite:** Phase 8
**Goal:** Build the character sheet and combat screens. Users can view their character stats, engage in combat, and see XP/level progress.

**Screens to build:**
- [ ] `CharacterScreen.tsx` — Character stats, level, XP bar, class info, equipped gear
- [ ] `CombatScreen.tsx` — Turn-based battle UI (attack, skills, items, flee)
- [ ] `LevelUpScreen.tsx` — Level-up celebration screen

**Components to build:**
- [ ] `XPBar.tsx` — Animated XP progress bar
- [ ] `StatBlock.tsx` — Character stat display (STR, DEF, etc.)
- [ ] `HealthBar.tsx` — HP/MP/Stamina bars for combat
- [ ] `SkillButton.tsx` — Skill selection during combat
- [ ] `MonsterDisplay.tsx` — Monster sprite and stats during battle

**Integration:**
- [ ] Connect to `characterStore` from `@quest-board/core`
- [ ] Use `BattleService`, `CombatService`, `SkillService`, `MonsterService` from core
- [ ] Use `XPSystem` for level/XP calculations
- [ ] Use `StatsService` for stat derivation

#### Tech Debt:
- Skill loadout management (selecting which 4 skills to equip) deferred to polish phase.
- Auto-attack toggle deferred.

---

#### Phase 9.5: Tests — Character & Combat UI
**Estimated Time:** 1.5–2 hours
**Prerequisite:** Phase 9
**Coverage Target:** ≥80% line, ≥80% branch
**Test File Location:** `packages/mobile/test/`

**Tasks:**
- [ ] Test character stat display with mock character data
- [ ] Test XP bar calculations and animations
- [ ] Test combat flow: attack → damage → monster turn → result
- [ ] Test skill usage and mana deduction
- [ ] Test level-up detection and celebration trigger

**Command:** `cd packages/mobile && npx jest`

---

#### Phase 10: Gear & Achievements UI
**Estimated Time:** 2.5–3 hours
**Prerequisite:** Phase 9
**Goal:** Build inventory management and achievement tracking screens.

**Screens to build:**
- [ ] `InventoryScreen.tsx` — Equipped gear display, inventory list, equip/unequip
- [ ] `AchievementsScreen.tsx` — Achievement list with progress tracking

**Components to build:**
- [ ] `GearSlot.tsx` — Tappable gear slot showing equipped item
- [ ] `GearCard.tsx` — Item card with stats, tier color coding
- [ ] `AchievementCard.tsx` — Achievement with progress bar and unlock status

**Integration:**
- [ ] Use `LootGenerationService`, `SmeltingService` from core
- [ ] Use `AchievementService` from core
- [ ] Connect to `characterStore` for gear state

#### Tech Debt:
- Smelting UI deferred to later. Users can smelt on desktop.
- Gear comparison tooltips simplified for mobile (no hover, use tap-to-compare).

---

#### Phase 10.5: Tests — Gear & Achievements UI
**Estimated Time:** 1–1.5 hours
**Prerequisite:** Phase 10
**Coverage Target:** ≥80% line, ≥80% branch
**Test File Location:** `packages/mobile/test/`

**Tasks:**
- [ ] Test gear equip/unequip flow
- [ ] Test inventory display with various gear tiers
- [ ] Test achievement progress calculation and display
- [ ] Test achievement unlock detection

**Command:** `cd packages/mobile && npx jest`

---

#### Phase 11: Polish & Integration Testing
**Estimated Time:** 2–3 hours
**Prerequisite:** Phase 10
**Goal:** End-to-end testing, visual polish, and final integration verification between Obsidian and mobile.

**Tasks:**
- [ ] Full sync test: create quest on desktop → verify appears on mobile
- [ ] Full sync test: complete task on mobile → verify reflected on desktop
- [ ] Full sync test: gain XP on mobile → verify character state syncs
- [ ] Visual polish: consistent theming, proper spacing, class-based colors
- [ ] Error handling: graceful behavior when vault is unavailable
- [ ] Error handling: graceful behavior when files are corrupted
- [ ] Performance: quest list with 50+ quests scrolls smoothly
- [ ] Build standalone APK for Android: `npx eas build --platform android --profile preview`
- [ ] Build standalone IPA for iOS (if Mac available): `npx eas build --platform ios --profile preview`

#### Tech Debt:
- Conflict resolution (simultaneous edits on desktop and mobile) is handled simplistically — last write wins. May need improvement if this causes data loss in practice.
- Quest filtering and search not yet implemented on mobile.
- Recurring quest generation not tested on mobile.

---

#### Phase 12: Home Screen Widgets
**Estimated Time:** 3.5–4.5 hours
**Prerequisite:** Phase 11
**Goal:** Build home screen widgets for both Android and iOS that display a quest's task list with interactive checkboxes. Tap a checkbox to mark a task complete directly from the home screen. Tap the quest title to open the Quest Board app to that quest's detail screen.

**Android Widget:**
- [ ] Install `react-native-android-widget` with Expo config plugin
- [ ] Build a medium-sized widget layout showing:
  - Quest title (tappable → opens app to quest detail via deep link)
  - Task checklist with checkboxes (tappable → toggles task completion)
  - Task progress bar (e.g., "3/5")
  - XP reward display
  - Class-colored accent border
- [ ] Implement click handlers using the library's `WIDGET_CLICK` action system
- [ ] Wire checkbox taps to update the quest markdown file via `MobileFileSystem`
- [ ] Implement widget refresh (update widget data when tasks change)
- [ ] Support widget configuration: let user pick which quest to display when adding the widget

**iOS Widget:**
- [ ] Use Expo's `expo-widgets` library (or SwiftUI widget target if Expo's alpha API is too unstable)
- [ ] Build small and medium widget sizes:
  - **Small:** Single quest name + progress bar + task count
  - **Medium:** Quest title + task checklist with toggles (same as Android)
- [ ] Implement app group data sharing (widget reads quest data from shared container)
- [ ] Implement `addUserInteractionListener` for checkbox interactions
- [ ] Support deep linking: tap quest title → open app to that quest

**Shared widget logic:**
- [ ] Create `WidgetDataProvider` service that reads quest files and formats data for widgets
- [ ] Create `WidgetUpdateService` that refreshes widget data after task changes in the app
- [ ] Handle edge cases: quest deleted, vault unavailable, no quests match

**Deep linking setup:**
- [ ] Configure React Navigation deep linking for `quest-board://quest/{questId}`
- [ ] Widget taps open the app directly to `QuestDetailScreen` for the displayed quest

> [!IMPORTANT]
> Widgets require a **dev client build** (not Expo Go). You'll need Android Studio and/or Xcode installed to test widgets. This is a step up from Expo Go development.

> [!WARNING]
> The Expo iOS widget library (`expo-widgets`) is currently in **alpha** and may have breaking changes. If it's too unstable at implementation time, fall back to a native SwiftUI widget target with manual bridging. The Android library (`react-native-android-widget`) is more mature.

#### Tech Debt:
- Widget data is read-only from the file system (reads quest files, writes checkbox changes). No real-time sync — widget refreshes on a schedule or when the app triggers an update.
- iOS widget implementation depends on Expo alpha API stability. May need to revisit.
- Widget configuration (picking which quest to show) is basic — a simple list picker. Could be enhanced with smart defaults (e.g., "show my most urgent quest") later.

---

#### Phase 12.5: Tests — Home Screen Widgets
**Estimated Time:** 1.5–2 hours
**Prerequisite:** Phase 12
**Coverage Target:** ≥80% line, ≥80% branch for widget services
**Test File Location:** `packages/mobile/test/`

**Tasks:**
- [ ] Test `WidgetDataProvider` returns correct quest/task data from mock file system
- [ ] Test `WidgetUpdateService` triggers widget refresh after task changes
- [ ] Test checkbox tap handler correctly updates quest markdown file
- [ ] Test deep link URL generation for quest IDs
- [ ] Test edge cases: missing quest file, empty task list, vault unavailable
- [ ] Manual testing on physical devices (widgets can't be tested in simulators reliably)

**Key Test Cases:**
- Widget displays correct task count and completion status
- Tapping a checkbox writes the updated markdown back to the file system
- Tapping quest title generates correct deep link URL
- Widget gracefully handles deleted/missing quest files

**Command:** `cd packages/mobile && npx jest`

---

## Plan Summary

| Phase | Title | Effort | Depends On | Est. Time |
|-------|-------|--------|------------|-----------|
| **Part A: Monorepo Migration** | | | | |
| 0 | Monorepo scaffolding | Small | — | 1.5–2h |
| 0.5 | Tests: scaffolding | Small | Phase 0 | 0.5h |
| 1 | Zero-risk file migration | Medium | Phase 0 | 2–2.5h |
| 1.5 | Tests: zero-risk files | Medium | Phase 1 | 1.5–2h |
| 2 | Interfaces + pure services | Medium | Phase 1 | 2.5–3h |
| 2.5 | Tests: interfaces + services | Medium | Phase 2 | 2–2.5h |
| 3 | Abstractable services | Large | Phase 2 | 3–4h |
| 3.5 | Tests: abstractable services | Large | Phase 3 | 2.5–3h |
| 4 | Build cutover | Large | Phase 3 | 2.5–3h |
| 4.5 | Tests: build cutover | Medium | Phase 4 | 1.5–2h |
| 5 | Portable utils migration | Small | Phase 4 | 1.5–2h |
| 5.5 | Tests: portable utils | Small | Phase 5 | 1h |
| | **Part A Subtotal** | | | **~22–28h** |
| **Part B: React Native App** | | | | |
| 6 | RN environment setup | Medium | Phase 5 | 2–2.5h |
| 6.5 | Visual prototype | Medium | Phase 6 | 2–2.5h |
| 7 | Mobile adapters | Large | Phase 6 | 2.5–3h |
| 7.5 | Tests: mobile adapters | Medium | Phase 7 | 1.5–2h |
| 8 | Quest management UI | Large | Phase 7 | 3–4h |
| 8.5 | Tests: quest UI | Medium | Phase 8 | 1.5–2h |
| 9 | Character & combat UI | Large | Phase 8 | 3–4h |
| 9.5 | Tests: combat UI | Medium | Phase 9 | 1.5–2h |
| 10 | Gear & achievements UI | Medium | Phase 9 | 2.5–3h |
| 10.5 | Tests: gear & achievements | Small | Phase 10 | 1–1.5h |
| 11 | Polish & integration | Medium | Phase 10 | 2–3h |
| 12 | Home screen widgets | Large | Phase 11 | 3.5–4.5h |
| 12.5 | Tests: widgets | Medium | Phase 12 | 1.5–2h |
| | **Part B Subtotal** | | | **~28–35h** |
| | | | | |
| | **TOTAL** | | | **~50–63h** |

**Execution order:** Strictly sequential (each phase depends on the prior one).

**Estimated sessions:** 20–25 sessions at ~2.5 hours each.

---

## Data Sync Strategy

### How It Works

Both the Obsidian plugin and the mobile app operate on the same vault files:

```
Vault Root/
├── Quest Board/
│   └── quests/
│       ├── quest-1.md          ← Both platforms read/write these
│       ├── quest-2.md
│       └── ...
├── data.json                   ← Plugin settings, character, achievements
└── ...                         ← Other vault files (untouched by mobile)
```

### Quest Files (Markdown + YAML Frontmatter)

Quest files are the source of truth. Both platforms:
1. Parse YAML frontmatter for quest metadata (status, priority, XP, etc.)
2. Parse markdown body for task lists
3. Write changes back as YAML frontmatter + markdown

This format is already platform-agnostic. No conversion needed.

### Character Data (data.json)

The Obsidian plugin stores character state, settings, achievements, and inventory in `data.json` via Obsidian's `loadData()`/`saveData()`. The mobile app needs to:
1. Read `data.json` from the vault for initial character sync
2. Write character changes back to `data.json`
3. Handle the case where both platforms have written different character states

### Sync Approach

- **Cloud provider handles file sync.** We don't build sync logic — we trust Google Drive, iCloud, or whatever provider to sync files between devices.
- **Conflict resolution: last write wins.** Simple but effective for single-user personal use.
- **Refresh on app focus.** When the mobile app comes to the foreground, re-read quest files and `data.json` to pick up desktop changes.
- **No real-time sync.** Changes propagate when the cloud provider syncs (typically seconds to minutes).

### Provider-Specific Notes

| Provider | Android Access | iOS Access | Notes |
|----------|---------------|------------|-------|
| Google Drive | SAF (Storage Access Framework) or Google Drive API | Google Drive app folder sync | Production vault is already on Google Drive |
| iCloud | Not available on Android | `expo-file-system` iCloud container | iOS-only |
| Obsidian Sync | Not accessible outside Obsidian | Not accessible outside Obsidian | **Not viable** for mobile app |
| Local folder | Direct file access | Direct file access | Manual sync (USB/airdrop) |

> [!WARNING]
> **Obsidian Sync is NOT an option** for the mobile app. Obsidian Sync is proprietary and only accessible within the Obsidian app. The mobile app must use file-based cloud storage.

---

## Security & Validation

- **API keys** — If the mobile app supports AI features (Gemini), the API key is stored in the app's secure storage (`expo-secure-store`), NOT in vault files. Same security model as the Obsidian plugin (keys in settings, not in vault).
- **Input sanitization** — The core package includes `sanitizer.ts` (DOMPurify). React Native doesn't render HTML, so XSS is less of a concern, but sanitization still applies to any rendered text from quest files.
- **Path validation** — The core `IFileSystem` interface includes `normalizePath()`. Mobile adapters must validate that all file operations stay within the configured vault directory (no path traversal).
- **Safe JSON** — `safeJson.ts` from core prevents prototype pollution when parsing quest files or `data.json`.

---

## Performance Considerations

- **Lazy loading services** — Don't instantiate all 37 services at app launch. Create services on-demand when their screen is accessed.
- **Quest file caching** — Read quest files once into the Zustand store. Re-read only on pull-to-refresh or app focus events.
- **FlatList for quest lists** — React Native's `FlatList` virtualizes long lists. Don't use `ScrollView` for quest lists.
- **Sprite bundling** — Bundle the most common sprites (class sprites, tier 1–3) with the app. Load higher-tier sprites from vault on demand.
- **Store selectors** — Use Zustand selectors to prevent unnecessary re-renders. Each component should subscribe only to the state it needs.

---

## Rollback Plan

### Part A (Monorepo Migration)

**Before Phase 4 (cutover):** Zero risk. The original `src/` files are untouched. To rollback, simply delete the `packages/` directory and the workspace config from root `package.json`.

**After Phase 4 (cutover):** This is a significant change. To rollback:
1. Revert the git commit(s) from Phase 4
2. Run `npm install` to restore original dependency structure
3. Verify `npm run build` works

> [!TIP]
> Create a git branch (e.g., `feat/monorepo-migration`) before Phase 4. If the cutover goes badly, `git checkout main` restores everything instantly.

### Part B (React Native App)

The mobile app is entirely self-contained in `packages/mobile/`. To remove it:
1. Delete `packages/mobile/`
2. Remove the workspace entry from root `package.json`

No impact on the Obsidian plugin.

---

## Design Decision Log

### Decisions Made

| Decision | Chosen | Alternative Considered | Why |
|----------|--------|----------------------|-----|
| Monorepo tool | npm workspaces | pnpm, yarn, Turborepo | Already using npm; simplest option; 3 packages doesn't need orchestration |
| React Native framework | Expo | Bare RN CLI | Simpler setup; Expo Go for testing; EAS for builds; file system API available |
| Mobile UI framework | React Native core | NativeBase, Tamagui, React Native Paper | Fewer dependencies; full control over RPG theming; core components sufficient |
| Data sync | Shared vault files | Custom backend, Firebase, Supabase | No server to maintain; single source of truth; already works with cloud storage |
| State management | Zustand (shared from core) | Redux, MobX, React Context | Already using Zustand; works outside React; shared store definitions |
| Navigation | React Navigation | Expo Router | More mature; better TypeScript support; stack + tab patterns well-documented |

### Known Limitations Accepted

| Limitation | Why Accepted |
|------------|-------------|
| Last-write-wins conflict resolution | Single user, personal use. Unlikely to edit same quest simultaneously on both devices. |
| No real-time sync | Cloud providers sync within seconds-minutes. Acceptable for task tracking. |
| No dungeon exploration on mobile | Complex tile-based UI. Can add later. Core dungeon logic is shared if needed. |
| No AI features on mobile initially | Requires API key management. Can add later since core AI services are shared. |
| Limited file watching on mobile | Mobile apps can't watch files in background efficiently. Poll on app focus instead. |

---

## Verification Plan / Checklist

### Automated Tests

| Test Suite | Location | Expected | Status |
|------------|----------|----------|--------|
| Core models compile | `packages/core/` | `tsc --noEmit` passes | |
| Core models unit tests | `packages/core/test/models/` | All pass | |
| Core services unit tests | `packages/core/test/services/` | All pass, ≥80% coverage | |
| Core stores unit tests | `packages/core/test/stores/` | All pass | |
| Core utils unit tests | `packages/core/test/utils/` | All pass | |
| Obsidian adapter tests | `packages/obsidian/test/` | All pass | |
| Obsidian existing tests | `packages/obsidian/test/` | All existing tests still pass | |
| Mobile adapter tests | `packages/mobile/test/` | All pass | |
| Mobile component tests | `packages/mobile/test/` | All pass | |

### Manual Tests — Obsidian Plugin (Post-Cutover)

| Test | Expected | Status |
|------|----------|--------|
| Plugin loads without errors | No console errors | |
| Quest board displays all quests | Same as before migration | |
| Create new quest | Quest file created, appears on board | |
| Complete quest tasks | Checkboxes toggle, XP awarded | |
| Drag-and-drop quest between columns | Quest moves, status updates | |
| Open character sheet | Stats display correctly | |
| Enter combat | Battle service works, damage calculated | |
| Use skills in combat | Skills execute, mana deducted | |
| Open inventory | Gear displays, equip/unequip works | |
| Smelting | Gear smelted correctly | |
| Achievements | Track and unlock correctly | |
| Recurring quests generate | On schedule, correct content | |
| Deploy to test vault | `npm run deploy:test` works | |

### Manual Tests — Mobile App

| Test | Expected | Status |
|------|----------|--------|
| App launches on Android | No crash, navigation works | |
| App launches on iOS | No crash, navigation works | |
| Select vault folder | File picker opens, folder saved | |
| Quest list loads from vault | All quests appear | |
| Mark task complete on mobile | File updated, XP awarded | |
| Quest created on desktop appears on mobile | After sync/refresh | |
| Task completed on mobile reflected on desktop | After sync | |
| Character stats display | Correct stats from data.json | |
| Combat works on mobile | Full battle flow | |
| Gear equip/unequip | Inventory updates, stats change | |
| Achievements display | Progress and unlocks shown | |
| **Widgets** | | |
| Android widget displays quest tasks | Correct task list and progress | |
| Android widget checkbox tap | Task marked complete, widget refreshes | |
| Android widget quest title tap | Opens app to quest detail screen | |
| iOS widget displays quest tasks | Correct task list and progress | |
| iOS widget checkbox tap | Task marked complete, widget refreshes | |
| iOS widget quest title tap | Opens app to quest detail screen | |

---

## File Change Summary

### Phase 0: Monorepo Scaffolding

| File | Action | Purpose |
|------|--------|---------|
| `package.json` (root) | [MODIFY] | Add `workspaces` config |
| `packages/core/package.json` | [NEW] | Core package config |
| `packages/core/tsconfig.json` | [NEW] | Core TypeScript config |
| `packages/core/src/index.ts` | [NEW] | Barrel export |

### Phase 1: Zero-Risk Migration

| File | Action | Purpose |
|------|--------|---------|
| `packages/core/src/models/*.ts` (12 files) | [NEW] | Copy models to core |
| `packages/core/src/data/*.ts` (13 files) | [NEW] | Copy static data to core |
| `packages/core/src/config/combatConfig.ts` | [NEW] | Copy config to core |
| `packages/core/src/utils/*.ts` (5 files) | [NEW] | Copy pure utils to core |
| `packages/core/src/store/*.ts` (6 files) | [NEW] | Copy pure stores to core |

### Phase 2: Interfaces + Pure Services

| File | Action | Purpose |
|------|--------|---------|
| `packages/core/src/interfaces/*.ts` (9 files) | [NEW] | Abstraction interfaces |
| `packages/core/src/models/Gear.ts` | [NEW] | Copy with UUID abstraction |
| `packages/core/src/services/*.ts` (20 files) | [NEW] | Copy pure services |
| `packages/core/src/store/battleStore.ts` | [NEW] | Copy with storage abstraction |
| `packages/core/src/store/dungeonStore.ts` | [NEW] | Copy with UUID abstraction |

### Phase 3: Abstractable Services

| File | Action | Purpose |
|------|--------|---------|
| `packages/core/src/services/*.ts` (17 files) | [NEW] | Refactored services with DI |

### Phase 4: Build Cutover

| File | Action | Purpose |
|------|--------|---------|
| `packages/obsidian/src/adapters/*.ts` (6 files) | [NEW] | Obsidian interface implementations |
| `packages/obsidian/main.ts` | [MOVE] | From root `main.ts` |
| `packages/obsidian/src/components/*.tsx` (11 files) | [MOVE] | From `src/components/` |
| `packages/obsidian/src/hooks/*.ts` (10 files) | [MOVE] | From `src/hooks/` |
| `packages/obsidian/src/modals/*.ts` (41 files) | [MOVE] | From `src/modals/` |
| `packages/obsidian/src/views/*.ts` (6 files) | [MOVE] | From `src/views/` |
| `packages/obsidian/src/styles/*.css` (15 files) | [MOVE] | From `src/styles/` |
| `packages/obsidian/src/settings.ts` | [MOVE] | From `src/settings.ts` |
| `packages/obsidian/src/utils/*.ts` (3 files) | [MOVE] | Obsidian-specific utils |
| `packages/obsidian/esbuild.config.mjs` | [MOVE] | From root |
| `packages/obsidian/postcss.config.cjs` | [MOVE] | From root |
| `src/` (entire directory) | [DELETE] | Replaced by packages |

### Phase 6: RN Setup + Phase 6.5: Visual Prototype

| File | Action | Purpose |
|------|--------|---------|
| `packages/mobile/` (entire directory) | [NEW] | Expo React Native app scaffold |
| `packages/mobile/src/screens/QuestListScreen.tsx` | [NEW] | Prototype quest list with fake data |
| `packages/mobile/src/screens/QuestDetailScreen.tsx` | [NEW] | Prototype quest detail with fake data |
| `packages/mobile/src/components/QuestCard.tsx` | [NEW] | Prototype quest card component |
| `packages/mobile/src/components/CharacterHeader.tsx` | [NEW] | Prototype character stats header |
| `packages/mobile/src/navigation/` | [NEW] | React Navigation config |
| `packages/mobile/src/theme/` | [NEW] | RPG color theme |

### Phases 7–11: Mobile App

| File | Action | Purpose |
|------|--------|---------|
| `packages/mobile/src/adapters/*.ts` (5 files) | [NEW] | Mobile interface implementations |
| `packages/mobile/src/screens/*.tsx` (6+ files) | [NEW] | App screens (replace prototype) |
| `packages/mobile/src/components/*.tsx` (10+ files) | [NEW] | Mobile components |

### Phase 12: Home Screen Widgets

| File | Action | Purpose |
|------|--------|---------|
| `packages/mobile/src/widgets/WidgetDataProvider.ts` | [NEW] | Quest data formatting for widgets |
| `packages/mobile/src/widgets/WidgetUpdateService.ts` | [NEW] | Widget refresh after task changes |
| `packages/mobile/src/widgets/QuestWidget.tsx` | [NEW] | Android widget layout (react-native-android-widget) |
| `packages/mobile/ios/QuestWidget/` | [NEW] | iOS widget target (SwiftUI or expo-widgets) |
| `packages/mobile/app.json` | [MODIFY] | Add widget config plugin entries |

---

## Key References

| Resource | Location | Purpose |
|----------|----------|---------|
| Feasibility audit | `docs/development/feature-planning/brainstorming/Android App Feasibility Report.md` | File-by-file portability classification |
| Feature Roadmap | `docs/development/Feature Roadmap v2.md` | Current priorities and feature status |
| Phase 4 Session Log | `docs/development/Phase 4 Implementation Session Log.md` | Recent development context |
| Obsidian Plugin Guidelines | `.agent/rules/obsidian-plugin-guidelines.md` | Plugin compliance requirements |
| Brainstorming Workflow | `.agent/workflows/brainstorming.md` | Planning standards |
| Obsidian API Docs | https://docs.obsidian.md/Plugins | Obsidian plugin API reference |
| Expo Docs | https://docs.expo.dev/ | React Native / Expo reference |
| Zustand Docs | https://docs.pmnd.rs/zustand | State management reference |
| React Navigation Docs | https://reactnavigation.org/ | Mobile navigation reference |

---

## Session Handoff / Next Session Prompt

**This plan is complete and ready for review.** When Brad is ready to begin implementation (after completing 4 queued features):

> **Next session prompt:**
> "Let's start the monorepo migration. We're beginning Phase 0 from the Mobile App Implementation Plan. Read the plan at `docs/development/feature-planning/brainstorming/Mobile App Implementation Plan.md` and the companion session log at `docs/development/Mobile App Session Log.md`. Set up the npm workspace structure in `packages/` without touching any existing source code."
