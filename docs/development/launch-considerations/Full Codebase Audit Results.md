# Full Codebase Audit Results

> **Generated:** 2026-02-07 | **Scope:** Deep audit across services, stores, models, utils, security, error handling, test infrastructure, and main entry point. Covers findings from 5 parallel investigation agents.

---

## Table of Contents

1. [Critical Untested Services Audit](#1-critical-untested-services-audit)
2. [Large File Decomposition Audit](#2-large-file-decomposition-audit)
3. [Security & Error Handling Audit](#3-security--error-handling-audit)
4. [Test Infrastructure & Store Audit](#4-test-infrastructure--store-audit)
5. [Models & Data Integrity Audit](#5-models--data-integrity-audit)
6. [Consolidated Priority Rankings](#6-consolidated-priority-rankings)

---

## 1. Critical Untested Services Audit

### 1.1 QuestActionsService.ts (734 lines, 0% test coverage)

#### Public Functions

| Function | Lines | Complexity | Description |
|----------|-------|------------|-------------|
| `moveQuest()` | 86-474 | Very High (~25+) | 388 lines. Orchestrates status change, streak updates, power-up triggers, achievement checks, loot generation, inventory management, bounty rolls, stamina awards, activity logging, daily note logging, and file save. Single most complex function in the codebase. |
| `toggleTask()` | 480-505 | Low (3) | Toggles task checkbox and reloads sections. |
| `completeQuest()` | 521-585 | Medium (6) | Explicitly completes a quest, either delegating to `moveQuest` or manually triggering a subset of rewards. |
| `reopenQuest()` | 590-654 | Low (4) | Clears completedDate, moves quest to first non-completion column. |
| `archiveQuest()` | 661-732 | Medium (5) | Moves quest file to archive folder. |

#### Error Handling Issues

- **Silent failure on quest not found (line 95):** `moveQuest` returns `{ success: false, quest: quest as any }` when quest is undefined. The `as any` cast means callers receive `{ quest: undefined }` typed as `Quest`, which will crash if anything accesses a property on it.
- **Optimistic store update without rollback (line 111):** Zustand store is updated immediately via `upsertQuest`. Hundreds of lines of async operations follow. File save doesn't occur until line ~456. If the save fails, in-memory state permanently diverges from disk. On plugin reload, the on-disk state wins, causing the user's action to silently undo itself.
- **Loot generation errors swallowed (line 416):** Try/catch logs to console but does not report to caller or user. Quest is still marked completed even if loot generation throws.
- **Inconsistent reward path in `completeQuest`:** When no completion column exists, the function manually handles only stamina and activity logging, but skips streak updates, power-up triggers, loot generation, and bounty rolls. Quests completed this way get significantly fewer rewards.
- **Dynamic import with no error handler (line 264):** `import('./StatusBarService').then(...)` has no `.catch()`. Unhandled promise rejection on import failure.
- **Null vault cast (line 173):** `AchievementService` instantiated with `null as any` for vault. If `checkStreakAchievements` ever accesses vault, it crashes with an opaque null reference error.

#### Input Validation Gaps

- **No `newStatus` validation:** The `newStatus` parameter in `moveQuest` is a raw string never validated against configured columns. Invalid status makes quest vanish from board with no error.
- **Archive path not sanitized (line 687):** Constructed via string concatenation without path traversal prevention. A malicious settings value could write outside the vault.
- **Bounty chance has no upper bound (line 279):** No clamping applied. A value of 100 triggers bounties on every completion.

#### Race Conditions

- **State divergence window:** Between store update (line 111) and file save (line ~456), ~350 lines of async operations. Plugin crash during this window causes permanent state divergence.
- **Interleaving modal popups:** Multiple `setTimeout(500ms)` calls create windows where a second `moveQuest` can interleave with the first.

#### Edge Cases That Must Be Tested

1. Moving a quest to the status it already has
2. Moving a quest to a completion column when it already has a `completedDate`
3. Completing a quest with no character created
4. `moveQuest` called with a `questId` that exists in store but whose file was externally deleted
5. Archive when `quest.filePath` points to a deleted file
6. Reopening a quest that was archived (file is in archive folder, but `reopenQuest` saves to original path)
7. Two `moveQuest` calls for the same quest within 500ms
8. `completeQuest` with no completion column AND no `onSaveCharacter` callback

#### Hardcoded Values

| Value | Location | Concern |
|-------|----------|---------|
| `500ms` timeout for modals | Lines 343, 397, 411 | Should be a named constant |
| `2000ms + (index * 1000)` achievement stagger | Line 180 | Hardcoded timing |
| `bountyChance ?? 10` default | Line 279 | No max clamping |

#### Security Concerns

- **Archive path injection:** If archive folder setting contains `..`, the path could target outside the vault. `ensureFolderExists` normalizes, but `vault.rename` uses un-normalized path.
- **Quest name in Notice:** User-editable names rendered directly in Obsidian Notice constructor.

---

### 1.2 QuestService.ts (876 lines, 0% test coverage)

#### Public Functions

| Function | Complexity | Description |
|----------|-----------|-------------|
| `sanitizeQuestId()` | Low (3) | Strips dangerous path characters from quest IDs |
| `loadAllQuests()` | Medium (5) | Scans all subfolders for quest files |
| `loadSingleQuest()` | Low (3) | Loads one quest from a known file path |
| `ensureQuestFolders()` | Trivial (1) | Creates default folder structure |
| `saveManualQuest()` | Medium (5) | Saves markdown quest with surgical frontmatter update |
| `saveAIQuest()` | Low (3) | Saves JSON quest to file |
| `deleteQuestFile()` | Medium (4) | Deletes a quest file from disk |
| `updateQuestSortOrder()` | Medium (4) | Updates the sortOrder field in frontmatter |
| `watchQuestFolderGranular()` | Medium (6) | Registers per-file debounced watchers |

#### Error Handling Issues

- **Individual file load failures are silent:** When `loadMarkdownQuest` or `loadJsonQuest` returns null, the file is silently skipped. Users never know a quest failed to load.
- **`saveManualQuest` swallows error details:** Returns `false` on any error with no error information.
- **`updateFrontmatterFields` returns original content on parse failure:** Caller writes unmodified content back, potentially overwriting changes without updating status.

#### Input Validation Gaps

- **CRITICAL: `deleteQuestFile` does not call `sanitizeQuestId()`.** Unlike every other file operation, `deleteQuestFile` uses raw `questId` in path construction. A hand-edited quest with `questId: "../../.obsidian/plugins/quest-board/data"` could delete arbitrary vault files. This is a path traversal vulnerability.
- **`sanitizeQuestId` doesn't handle backslash traversal:** Regex only removes `..` but not `..\\`.
- **`questType` not sanitized for path separators:** `quests/${quest.questType.toLowerCase()}` constructed from user-editable frontmatter. A `questType` of `../../` targets arbitrary folders.
- **No date format validation:** `createdDate` and `completedDate` accept any string.
- **No quest name length limit.**

#### Race Conditions

- **Read-modify-write in `saveManualQuest`:** File read, modified in memory, written back. Concurrent modifications (sync, user edit) silently overwritten.
- **`loadAllQuests` is not atomic:** Files could change during multi-folder scan.
- **100ms file creation delay (line 821):** May be insufficient on network/synced drives (Google Drive production environment).
- **`updateQuestSortOrder` and `deleteQuestFile` only search hardcoded `QUEST_FOLDERS`:** Quests in custom subfolders silently fail.

#### Edge Cases That Must Be Tested

1. `sanitizeQuestId` with: empty string, all-special-character strings, strings that are only `..`, strings with backslashes
2. `parseQuestFrontmatter` with: no frontmatter, empty frontmatter, malformed YAML, duplicate keys
3. `updateFrontmatterFields` with Windows-style `\r\n` line endings
4. `deleteQuestFile` with a `questId` containing path separators
5. `saveManualQuest` when `quest.filePath` points to a deleted file
6. `loadMarkdownQuest` when file contains `---` inside a code block
7. Quest with `questType` containing `/` or `\` characters
8. `updateQuestSortOrder` for a quest in a custom subfolder
9. `updateFrontmatterFields` with a status value containing newline characters (frontmatter injection)

#### Hardcoded Values

| Value | Location | Concern |
|-------|----------|---------|
| `QUEST_FOLDERS` | Lines 20-26 | Custom folders scanned in `loadAllQuests` but NOT in `updateQuestSortOrder` or `deleteQuestFile` |
| `xpPerTask: 5` default | Line 269 | Hardcoded in loader |
| `completionBonus: 30` default | Line 270 | Hardcoded in loader |
| `visibleTasks: 4` default | Line 271 | Hardcoded in loader |
| `100ms` file creation delay | Line 821 | Insufficient for network drives |
| `300ms` default debounce | Line 807 | Not configurable |

#### Security Concerns

- **CRITICAL: `deleteQuestFile` path traversal** -- missing `sanitizeQuestId()` call
- **Frontmatter injection via status values:** `updateFrontmatterFields` writes values directly. Status with newlines can inject fields.
- **`questType` folder injection:** User-editable frontmatter value used in folder construction.
- **Prototype pollution protection inconsistent:** AI quests use `safeJsonParse`; markdown quests use custom parser safe by accident.

---

### 1.3 TaskFileService.ts (400 lines, 0% test coverage)

#### Public Functions

| Function | Complexity | Description |
|----------|-----------|-------------|
| `readTasksFromFile()` | Low (2) | Reads all checkbox tasks from a markdown file |
| `getTaskCompletion()` | Trivial (1) | Calculates completion percentage |
| `readTasksWithSections()` | Medium (5) | Reads tasks grouped by markdown headers |
| `getVisibleTasks()` | Trivial (1) | Returns visible subset of tasks |
| `readTasksFromMultipleFiles()` | Low (3) | Aggregates tasks from multiple files |
| `countNewlyCompleted()` | Low (2) | Counts new completions between snapshots |
| `watchTaskFile()` | Low (2) | Creates debounced file watcher |
| `toggleTaskInFile()` | Medium (4) | Toggles a single task checkbox |

#### Error Handling Issues

- **`readTasksWithSections` uses `cachedRead` (line 181) while `readTasksFromFile` uses `read` (line 115).** After `toggleTaskInFile` modifies a file, `readTasksWithSections` may return stale data.
- **`toggleTaskInFile` returns undifferentiated `false`:** All failure modes (file not found, line out of range, not a task line, I/O error) collapse into one `false`. Callers cannot display meaningful errors.

#### Input Validation Gaps

- **`lineNumber` not validated for NaN/float:** `NaN - 1 = NaN`, `lines[NaN]` is `undefined`, causing TypeError.
- **Any vault file can be toggled:** `validateLinkedPath()` prevents traversal but not targeting of arbitrary vault files. A corrupted quest's `linkedTaskFile` pointing at a config file could toggle it.

#### Race Conditions

- **CRITICAL: `toggleTaskInFile` read-modify-write race.** Reads entire file, modifies one line, writes entire file back. Two rapid checkbox clicks or sync operations can silently overwrite each other.
- **`countNewlyCompleted` relies on stable line numbers:** If lines are inserted/deleted between snapshots, line numbers shift, producing incorrect completion counts and wrong XP awards.

#### Edge Cases That Must Be Tested

1. `toggleTaskInFile` with `lineNumber = 0` (becomes `lineIndex = -1`)
2. `toggleTaskInFile` when task text itself contains `[ ]`
3. `readTasksWithSections` with only H1 headers (regex only matches H2-H3)
4. `readTasksWithSections` with headers but zero tasks between them
5. `readTasksFromMultipleFiles` with duplicate file paths
6. `getVisibleTasks` with `visibleCount = 0`
7. `countNewlyCompleted` when lines have been inserted/deleted between snapshots
8. `toggleTaskInFile` on a file with uppercase `[X]`
9. `readTasksWithSections` on a file with YAML frontmatter
10. `parseTaskLine` with mixed tabs and spaces

#### Hardcoded Values

| Value | Location | Concern |
|-------|----------|---------|
| `300ms` default debounce | Line 343 | Not configurable |
| Header regex `#{2,3}` | Line 160 | Only H2 and H3; H1 and H4+ ignored |
| `'General'` default section | Line 189 | Not localizable |

---

### 1.4 ColumnConfigService.ts (166 lines, 0% test coverage)

#### Key Findings

- **Settings accessed via `any` cast:** `(this.settings as any).customColumns` bypasses TypeScript. Silent `undefined` on structure change.
- **No defensive copy:** `getColumns()` returns direct references. External callers can mutate default constants.
- **`resolveStatus` silently converts invalid statuses:** Any unrecognized string maps to default column with no logging.
- **Individual column objects not validated:** Only checks `Array.isArray && length > 0`, not individual entries.
- **Stale cache:** Only cleared by explicit `invalidateCache()`. No automatic invalidation.
- **New instances on every call:** `QuestActionsService.moveQuest()` creates new `ColumnConfigService` per call. Caching is effectively unused in the hot path.

#### Edge Cases That Must Be Tested

1. `getColumns()` with empty `customColumns` array and `enableCustomColumns: true`
2. `isCompletionColumn()` when `triggersCompletion` is `undefined` vs `false`
3. `resolveStatus()` with legacy values when custom columns don't include matching ID
4. Multiple columns with `triggersCompletion: true`
5. `getDefaultColumn()` when `getColumns()` returns empty array

---

### 1.5 XPSystem.ts (370 lines, 0% test coverage)

#### Key Findings

- All functions are pure and synchronous. No race conditions.
- **`getXPForNextLevel` has an undocumented `1200` fallback** for levels above 40.
- **`calculateXPWithBonus` doesn't clamp negative `baseXP`:** Could produce negative XP from bugs elsewhere.
- Class bonus caps are well-designed (Cleric capped at 25% via `Math.min(streakDays, 5)`).

#### Edge Cases That Must Be Tested

1. `calculateLevel` with XP exactly at a threshold boundary
2. `calculateLevel` with XP = 0 (should return level 1)
3. `calculateLevel` with XP above max threshold (should return 40)
4. `getXPProgress` at max level (should return 1, not NaN/Infinity)
5. `calculateXPWithBonus` with `baseXP = 0`
6. `getCombinedClassBonus` with same class as primary and secondary
7. `checkLevelUp` when `newXP < oldXP` (XP loss from class change)
8. `getLevelUpMessage` at level 40
9. `getXPProgressForCharacter` in training mode at max training level (10)
10. `canAffordClassChange` at level 1 with 0 XP

#### Hardcoded Values

| Value | Location | Concern |
|-------|----------|---------|
| `1200` fallback XP | Line 142 | Arbitrary, undocumented |
| `0.5` secondary class bonus ratio | Line 218 | Not configurable |
| `level * 100` class change cost | Line 330 | Not configurable |

---

## 2. Large File Decomposition Audit

### 2.1 BattleService.ts (1,442 lines -- verified exact match)

#### Function Complexity

- **`executeMonsterSkill()`** (lines 689-860, ~172 lines): 7+ responsibilities in one body
- **`executePlayerSkill()`** (lines 1191-1366, ~176 lines): Mirrors monster skill in complexity
- **`handleVictory()`** (lines 941-1013, ~73 lines): Conflates ending combat, awarding rewards, persisting data, and triggering UI
- **`handleDefeat()`** (lines 1018-1079, ~62 lines): Contains two nearly identical code paths differing by one field

#### Duplicated Code Patterns

1. **Date string formatting duplicated 3 times:** `handleVictory()` (line 988), `handleDefeat()` (line 1059), and `dungeonStore.ts` (line 193)
2. **`handleDefeat()` double code path:** Two branches (lines 1029-1047) differ only in whether `maxHP` is included; 5 other fields are copy-pasted
3. **Status effect tick + log pattern duplicated 3 times:** `executePlayerTurn()` (lines 348-378), `executeMonsterTurn()` (lines 615-648), `checkBattleOutcomeWithStatusTick()` (lines 1389-1414)
4. **Monster and player skill effect application use different implementations for the same logic**

#### Circular Dependency Risks

- Pre-existing `BattleService <-> SkillService` cycle handled via runtime `require()` at line 108
- Proposed `MonsterTurnService` depends on `BattleOutcomeService` for handleVictory/handleDefeat
- **Recommendation:** Extract `BattleOutcomeService` simultaneously with or before `MonsterTurnService`

#### Coupling Concerns

- `useBattleStore.getState()` called **31 times**, `useCharacterStore.getState()` called **12 times**
- 3 module-level mutable variables: `saveCallback`, `levelUpCallback`, `selectedSkillId`
- If `BattleOutcomeService` is extracted, `saveCallback` and `levelUpCallback` must both move with it

#### State Management / Memory Leak Concerns

- **Module-level state never reset on plugin unload.** Stale callbacks could reference destroyed objects.
- **4 unguarded `setTimeout` calls** (lines 454, 850, 904, 1363) cannot be cleared on unload
- **Store access inside `setTimeout` callbacks** creates race conditions during animation delays

---

### 2.2 DungeonView.tsx (1,380 lines -- verified exact match)

#### Function Complexity

- **Main `DungeonView` component** (lines 613-1379, ~766 lines): 25 store subscriptions, 8 `useCallback` hooks, 2 `useEffect` hooks
- **`handleInteract()`** (lines 809-928, ~120 lines): Contains ~50 lines of inline loot generation business logic
- **`handleDirectionalMove()`** (lines 728-794, ~67 lines): Contains duplicated monster spawn logic
- **`animateAlongPath()`** (lines 933-992, ~60 lines): Third copy of monster spawn logic

#### Duplicated Code Patterns

1. **Monster spawn logic copy-pasted 3 times:** `handleDirectionalMove()` (lines 770-789), `handleInteract()` (lines 890-919), `animateAlongPath()` (lines 964-984). Each ~20 lines. A single `spawnMonsterAtPosition()` eliminates ~40 lines.
2. **Loot processing duplicated:** `handleInteract()` chest opening (lines 852-874) and `handleShowLoot()` battle victory (lines 1201-1233) follow the same `for (const reward of loot)` pattern.

#### Circular Dependency Risks

- None. Sub-component extraction is zero-risk.
- Hook extraction requires imports from BattleService and stores, but no cycles.

#### Coupling Concerns

- 25 individual Zustand selectors from 3 stores
- Direct store mutation in callbacks: `useCharacterStore.getState()` called 4 times in `handleInteract()`
- `app` prop threading would need React context or parameter passing if hooks are extracted

#### State / Memory Concerns

- **Dual movement lock** (`isAnimating` useState + `lastMoveTimeRef`). Door transition `setTimeout` (line 1019) doesn't set `isAnimating`, allowing double room change.
- **Combat overlay uses IIFE inside JSX** (lines 1319-1342): Creates closure on every render, bypasses React reactivity.
- **`animateAlongPath()` continues after unmount:** No AbortController/cancellation. Async function keeps calling store mutations after component destroyed.
- **Untracked `setTimeout` at line 1019:** `changeRoom()` fires on global store if view unmounts in 200ms.

---

### 2.3 ScrivenersQuillModal.ts (1,204 lines -- verified exact match)

#### Function Complexity

- **`onOpen()`** (lines 130-488, 358 lines): Builds entire form UI in one method
- **`saveTemplate()`** (lines 1038-1145, 108 lines): Frontmatter building + file write
- **`createQuestFile()`** (lines 925-1033, 109 lines): Nearly identical to `saveTemplate()`
- **`buildFolderWatchUI()`** (lines 579-700, 121 lines): Already extracted but still long

#### Duplicated Code Patterns

1. **Frontmatter construction duplicated:** `saveTemplate()` and `createQuestFile()` are near-identical. Three differences: (1) category default `''` vs `'general'` -- **possibly a bug**, (2) date: placeholder vs resolved, (3) folder watch lines.
2. **Frontmatter stripping duplicated 3 times:** `createQuestFile()` (lines 974-978), `saveTemplate()` (lines 1113-1117), `extractSectionsFromBody()` (lines 849-854).
3. **`(this as any)._questNameOverride` (2 instances):** Undeclared field accessed via `any` cast. Invisible to refactoring tools.

#### Circular Dependency Risks

- None. Only imported via dynamic `import()` calls.

#### Coupling / State Concerns

- 19 class-level mutable fields with no single form state object
- Strong coupling to `this.plugin` (10 `settings` references)
- DOM rebuild pattern in `buildFolderWatchUI()` causes focus loss on dropdown change
- Fire-and-forget dynamic imports with `.catch(() => {})` -- autocomplete silently fails
- Dynamic imports may attach event listeners to detached DOM if modal closes before import resolves

---

### 2.4 settings.ts (1,126 lines -- verified exact match)

#### Function Complexity

- **`display()`** (lines 224-1124, 900 lines): Entirely linear UI construction. Long but not complex.
- **Section 2 (File Paths)** (166 lines): Most complex due to async asset delivery logic in `handleSave`.
- **Section 8 (Advanced Config)** (184 lines): Dev tools with inline closure state.

#### Duplicated Code Patterns

1. **Folder autocomplete pattern duplicated 3 times** (lines 387, 710, 820) plus 1 in ScrivenersQuillModal
2. **Comma-separated string conversion duplicated 3 times** (lines 556, 569, 939)

#### Circular Dependency Risks

- Zero risk. All 12 internal importers use `import type` (erased at compile time). `settingsTypes.ts` extraction breaks zero runtime imports.

#### Coupling Concerns

- **`QuestBoardSettings` interface is the central coupling point of the entire codebase.** 13+ files depend on it. Extracting to `settingsTypes.ts` is the highest architectural value single change.
- `lootGenerationService` import (line 13) creates side-effect coupling.
- `DEV_FEATURES_ENABLED` gates two sections. Balance Testing inside "Advanced Config" complicates clean extraction.

#### State / Memory Concerns

- Training Mode toggle directly mutates `this.plugin.settings.character` then updates store via dynamic import. Inconsistency window if import fails.
- Fire-and-forget dynamic imports (5 instances) -- same detached-DOM risk as ScrivenersQuillModal.

---

## 3. Security & Error Handling Audit

### 3.1 DOMPurify / Input Sanitization

A well-designed sanitizer exists at `src/utils/sanitizer.ts` with `sanitizeHtml()`, `sanitizeText()`, `sanitizeQuestTitle()`, `sanitizeQuestDescription()`, `sanitizeCharacterName()`, `sanitizeTags()`.

**Only one call site exists:** `CharacterCreationModal.tsx` uses `sanitizeCharacterName()`.

**Unsanitized AI content (Gemini API responses):**
- `AIQuestService.ts:127` -- Raw Gemini markdown returned without sanitization
- `AIQuestPreviewModal.ts:114-116` -- AI markdown written directly to vault
- `AIDungeonService.ts:531` -- AI response parsed with raw `JSON.parse()`
- `SetBonusService.ts:338` -- AI set bonus parsed with raw `JSON.parse()`
- `BountyService.ts:456` -- AI bounty descriptions parsed with raw `JSON.parse()`
- `CreateQuestModal.ts` -- Manual quest names/descriptions not sanitized

### 3.2 innerHTML Usage

| File | Lines | Risk |
|------|-------|------|
| `gearFormatters.ts` | 331, 342, 348, 352 | **Medium** -- Gear/set names from AI and user folders flow into `innerHTML` |
| `BlacksmithModal.ts` | 62, 72, 270 | Low -- Static HTML |
| `InventoryModal.ts` | 359-361 | Low -- Numeric stats |
| `InventoryManagementModal.ts` | 90, 288 | Low -- Headers/totals |
| `ColumnManagerModal.ts` | 63 | Low -- Static warning |

No `dangerouslySetInnerHTML`, `eval()`, or `new Function()` found.

### 3.3 API Key Handling

Gemini API key stored in settings via `loadData()`/`saveData()`. Rendered as password field. Passed as URL query parameter (Google's standard pattern but visible in proxy logs). Appears in 5 locations across AI services.

### 3.4 JSON Parsing Consistency

**`safeJsonParse` used in:**
- `QuestService.ts:305` -- JSON quest files
- `AssetService.ts:291, 299` -- Remote manifest

**Raw `JSON.parse()` used in (no prototype pollution protection):**
- `AIDungeonService.ts:531` -- External AI response
- `BountyService.ts:456` -- External AI response
- `SetBonusService.ts:338, 456` -- External AI responses
- `ColumnManagerModal.ts:37, 346` -- Internal deep-clone (low risk)
- `GearSlotMappingModal.ts:20` -- Internal deep-clone (low risk)

### 3.5 Path Validation

`pathValidator.ts` is well-structured but has a single-pass normalization weakness: `....//` becomes `../` after one pass. Obsidian vault API provides secondary safety net.

**`validateLinkedPath` only used in `TaskFileService.ts`.** Other file-handling services (`QuestService`, `DailyNoteService`, `FolderWatchService`, `UserDungeonLoader`) do not use path validation.

### 3.6 Silently Swallowed Errors

**Empty catch blocks:**
| File | Line | Context |
|------|------|---------|
| `SetBonusService.ts` | 251 | `.catch(() => { })` on AI generation |
| `ScrivenersQuillModal.ts` | 344, 605, 698 | `.catch(() => { })` on dynamic imports |

**Console-only errors (user never informed):**
| File | Lines | Impact |
|------|-------|--------|
| `QuestService.ts` | 290-292, 321-323 | Quest load failures silent |
| `QuestActionsService.ts` | 415, 468, 572, 647, 692, 708 | Move/archive/delete failures silent |
| `RecurringQuestService.ts` | 382 | Recurring generation failures silent |
| `DailyNoteService.ts` | 113, 215 | Daily note write failures silent |
| `useQuestLoader.ts` | 123 | Quest loading failures silent |

**Async without try-catch:**
- `main.ts:529` -- `this.saveSettings()` called without `await`
- `main.ts:204` -- `processRecurrence()` called without `await` in `setInterval`

### 3.7 Settings Migration

- **All interface fields have defaults.** No undefined risk for new installs.
- **Shallow merge only** (`Object.assign`). New nested object fields won't reach upgrading users.
- **Character schema migration chain (v1-v5) is correctly implemented.**

### 3.8 First-Run Experience

- No character: Well-guarded throughout (null checks on all paths)
- No quests: Handled (empty arrays, empty state messages)
- No settings: Handled (`Object.assign` with defaults)
- Asset first-run: Three-case logic properly implemented
- Minor: `main.ts` uses `require('obsidian').Notice` instead of static import in several callbacks

### 3.9 Production Values -- ALL THREE STILL AT TEST VALUES

| Setting | File | Line | Current | Should Be |
|---------|------|------|---------|-----------|
| Daily Stamina Cap | `combatConfig.ts` | 361 | **500** | **50** |
| Bounty Slider Max | `settings.ts` | 532 | **0-100** | **0-20** |
| Set Piece Drop Rate | `LootGenerationService.ts` | ~408 | **0.40** | **0.33** |

Additional inconsistencies: Comment in `CombatService.ts` says "50 stamina/day" but cap is 500. `bountyChance` type annotation says "0-20%" but slider allows 0-100.

---

## 4. Test Infrastructure & Store Audit

### 4.1 Vitest Configuration

- `node` environment, `test/**/*.test.ts` glob (already handles subdirectories)
- `obsidian` module aliased to mock
- `globals: true` -- test globals available without import
- **Zero config changes needed for proposed test reorganization.**

### 4.2 Setup File (`test/setup.ts`)

- Polyfills `crypto.randomUUID` and `crypto.getRandomValues`
- Creates minimal `document.createElement` stub
- **No global state reset mechanism.** No `afterEach` to reset stores, clear timers, or restore dates. This is the single largest risk for future test additions.

### 4.3 Obsidian Mock Gaps

**What's mocked:** App, Plugin, Modal, Notice, Vault, TFile, TFolder, Setting, PluginSettingTab, ItemView, WorkspaceLeaf, MarkdownView, Menu, MenuItem, requestUrl, DataAdapter, debounce, normalizePath.

**Missing (blocks planned tests):**
- `App.workspace` -- Not mocked. Blocks QuestActionsService, RecurringQuestService, FolderWatchService tests.
- `App.metadataCache` -- Not mocked. Blocks DailyNoteService, TemplateService tests.
- `Vault.on()` / `Vault.off()` -- Event listeners not mocked. Blocks FolderWatchService tests.
- `Vault.getFiles()` / `Vault.getMarkdownFiles()` -- Not mocked. Blocks RecurringQuestService tests.
- `Vault.delete()` -- Not mocked. Blocks archive tests.
- `Plugin.registerInterval`, `Plugin.addRibbonIcon` -- Not mocked.
- `setIcon` global -- Not exported from mock.
- `document` mock too minimal for modal/DOM tests.

### 4.4 Test Patterns

- Factory helper functions (`createMockCharacter`, `createDefaultContext`) used consistently
- Services instantiated with `null as any` for app -- hides null reference bugs
- Combat tests use statistical assertions with wide tolerance (30-70/100) -- non-deterministic, could flake
- `power-up-triggers.test.ts` uses `declare module` for TDD
- No test files interact with Zustand stores directly (which is why state bleed hasn't been a problem yet)

### 4.5 Test Reorganization Risks

- **Import paths will break** when files move to subdirectories (`'../src/...'` becomes `'../../src/...'`). Mechanical, caught by TypeScript.
- Config already compatible. No changes needed.
- `example.test.ts` safe to delete. Markdown artifacts safe to move.

### 4.6 Zustand Store Audit

#### questStore.ts (157 lines) -- CLEAN
- Simple `Map<string, Quest>` cache. No business logic. No persistence.
- Selectors create new arrays via `Array.from()` on every call (potential re-render concern).

#### characterStore.ts (1,120 lines) -- TOO LARGE, DOING TOO MUCH
- 35+ field state shape
- Contains significant business logic that belongs in services:
  - `createCharacter` (~100 lines): Stat calculations, HP/mana formulas, starter gear. Duplicates `Character.ts` factory.
  - `equipGear`/`unequipGear`: Class restriction validation
  - `addXP`: Training mode branching, level calculation
  - `awardStamina`: Daily cap checking with date comparisons
  - `logActivity`: History trimming (cap at 1000)
  - `changeClass`: XP deduction with no rollback
- **`useRevivePotion` race condition:** Double `set()` (one from `removeInventoryItem`, one from the main action) creates inconsistent intermediate state.
- No persistence middleware. Save is scattered across 15+ command handlers in `main.ts`.
- `addGear` returns `false` on full inventory but callers don't check. `equipGear` returns `false` with no user feedback.

#### battleStore.ts (475 lines) -- WELL STRUCTURED
- Clean state machine with explicit `CombatState` transitions
- Uses `persist` middleware with custom `dualStorage` and `partialize`
- `endBattle` does not reset `player` field (stale data until `resetBattle`)
- `startBattle` has no concurrency guard (silently overwrites active battle)
- `recoverFromCrash` has 1-hour timeout

#### dungeonStore.ts (421 lines) -- CROSS-STORE COUPLING
- Directly imports and calls `useCharacterStore.getState()` in 3 places
- Makes isolated testing impossible
- `visitedRooms` is `Set<string>` (not JSON-serializable). Manual conversion in persist/load.
- No persistence middleware (unlike battleStore). Crash mid-dungeon loses the run.

#### filterStore.ts (195 lines) -- CLEAN
- Good factory pattern creating two independent instances. No issues.

#### taskSectionsStore.ts (76 lines) -- CLEAN
- Simple data store. `setSections` and `updateQuestSections` are redundant aliases.

#### uiStore.ts (149 lines) -- CLEAN
- Legacy `Filters` interface overlaps with `filterStore.ts` `FilterState`. Could cause confusion.

### 4.7 Character Schema Version

**CLAUDE.md says schema v4. Code has `CHARACTER_SCHEMA_VERSION = 5`.** Migration chain v1->v2->v3->v4->v5 is correctly implemented. Entry point always enters through `migrateCharacterV1toV2` regardless of actual version, relying on chain to skip completed steps. Correct but inefficient.

### 4.8 Race Conditions in Stores

1. **`useRevivePotion`**: Double `set()` creates inconsistent intermediate state
2. **Save callback scatter in main.ts**: Concurrent commands could overwrite each other
3. **`dungeonStore.exitDungeon`**: Two separate `useCharacterStore` actions = two intermediate renders
4. **`battleStore.startBattle`**: No guard against double-invocation while in combat

---

## 5. Models & Data Integrity Audit

### 5.1 Quest Data Model

- `createManualQuest()` provides sensible defaults but **zero input validation** on `questId`, `questName`, `category`, `linkedTaskFile`
- `questType` typed as `string` (intentional for folder-named types)
- `status` typed as `QuestStatus | string` (supports custom columns but no compile-time safety)
- Quest schema still at v1 with no migration infrastructure
- Character schema at v5 with complete migration chain

### 5.2 Validator Findings

**`validateQuest()` does NOT validate:**
- `linkedTaskFile` (required field on ManualQuest)
- `difficulty`, `sortOrder`, `recurrence`
- Date format of `createdDate`/`completedDate`
- AI-generated quest fields (`description`, `goal`, `estimatedDuration`, etc.)

**`validateCharacter()` findings:**
- **DESTRUCTIVE BUG:** `equippedGear` check at line 210 tests `!Array.isArray()` and defaults to `[]`, but in schema v2+, `equippedGear` is a `Record<GearSlot, GearItem | null>`. If activated, wipes all equipped gear.
- Does not validate combat fields, `baseStats`, `statBonuses`, `equippedSkills`, `unlockedSkills`, `achievements`, `streaks`
- **Never called in production code.** Character data bypasses validation entirely.

**`validateGearItem()`:** Well-implemented but also never called in production. Dead code.

### 5.3 safeJson.ts Consistency

Used in QuestService and AssetService. Raw `JSON.parse` used in AIDungeonService, SetBonusService, BountyService (AI responses), ColumnManagerModal, GearSlotMappingModal (internal cloning).

### 5.4 pathValidator.ts Consistency

Only used in TaskFileService. Other file-handling services don't use it.

### 5.5 Combat Config

- `DEV_FEATURES_ENABLED = false` -- correctly set for production
- **HP formula mismatch:** `createCharacter()` uses `50 + CON*5 + Level*10`. `CombatService.ts` uses combatConfig: `200 + CON*2 + Level*10`. New character sees ~110 HP, jumps to ~230 HP in first combat.
- Monster tier multipliers are conservative (boss: 1.06x HP, 1.04x ATK)
- Paladin gets aggressive early-game level modifiers (1.4x damage at L3-7)
- Fun easter egg: levels 30-32 get 0.91 multiplier ("Welcome to your 30s")

### 5.6 Data Files

**monsters.ts (39 templates):** All required fields present. 8 categories all represented. Rune Berserker has highest `attackGrowth` (1.5).

**skills.ts (57 skills):** All 7 classes x 8 skills + 1 universal. Consistent learn levels (5, 8, 13, 18, 23, 28, 33, 38). All level 38 skills have `usesPerBattle: 1`. Balance notes: Technomancer Meteor (4x ATK + 75% burn) and Rogue Assassinate (4x ATK + 50% crit = potential 8x on crit) are notably strong. Bard's cure is weakest (only cures confusion).

**achievements.ts (34 total):** All fields present. **16 of 34 achievements (47%) are tied to "applications" and "interviews" categories.** This contradicts the "Generic, Not Specific" design principle. Non-job-search users would find nearly half the achievements permanently locked. No achievements for total quest completions (beyond First Quest), total tasks, total XP, total monsters, gear collected, or dungeons completed.

---

## 6. Consolidated Priority Rankings

### CRITICAL -- Must Fix Before Launch

| # | Issue | Location |
|---|-------|----------|
| 1 | `MAX_DAILY_STAMINA = 500` (should be 50) | `combatConfig.ts:361` |
| 2 | Bounty slider max 100% (should be 20%) | `settings.ts:532` |
| 3 | Set piece drop rate 0.40 (should be 0.33) | `LootGenerationService.ts:~408` |
| 4 | `deleteQuestFile` path traversal -- missing `sanitizeQuestId()` | `QuestService.ts` |
| 5 | AI content not sanitized (DOMPurify exists but unused) | 5 AI service files |
| 6 | AI JSON responses use raw `JSON.parse()` not `safeJsonParse()` | 3 AI service files |
| 7 | HP formula mismatch (110 HP at creation, 230 HP in combat) | `Character.ts` vs `combatConfig.ts` |
| 8 | `validateCharacter()` equippedGear bug (would wipe gear if activated) | `validator.ts:210` |

### HIGH -- Should Fix Before Launch

| # | Issue | Location |
|---|-------|----------|
| 9 | `moveQuest` returns `quest as any` when quest is null | `QuestActionsService.ts:95` |
| 10 | `toggleTaskInFile` read-modify-write race condition | `TaskFileService.ts` |
| 11 | `completeQuest` without completion column skips most rewards | `QuestActionsService.ts` |
| 12 | `readTasksWithSections` uses `cachedRead` (stale data after toggle) | `TaskFileService.ts` |
| 13 | `updateFrontmatterFields` newline injection | `QuestService.ts` |
| 14 | `updateQuestSortOrder`/`deleteQuestFile` only search hardcoded folders | `QuestService.ts` |
| 15 | Module-level state not cleaned up on plugin unload | `BattleService.ts` |
| 16 | `main.ts` is 954 lines (10x target) | `main.ts` |
| 17 | `characterStore.ts` is 1,120 lines with business logic | `characterStore.ts` |
| 18 | `useRevivePotion` double-set race condition | `characterStore.ts` |
| 19 | No Zustand store reset in test setup | `test/setup.ts` |
| 20 | CLAUDE.md says schema v4; code is v5 | Documentation |
| 21 | `innerHTML` with potentially unsafe gear/set names | `gearFormatters.ts` |

### MEDIUM -- Should Address

| # | Issue | Location |
|---|-------|----------|
| 22 | No rollback on optimistic store updates | `QuestActionsService.ts` |
| 23 | `questType` not sanitized for path separators | `QuestService.ts` |
| 24 | `ColumnConfigService` returns mutable references | `ColumnConfigService.ts` |
| 25 | `bountyChance` no upper bound clamping | `QuestActionsService.ts` |
| 26 | `countNewlyCompleted` relies on stable line numbers | `TaskFileService.ts` |
| 27 | DungeonView `animateAlongPath()` continues after unmount | `DungeonView.tsx` |
| 28 | `battleStore.startBattle` no concurrency guard | `battleStore.ts` |
| 29 | `pathValidator.ts` single-pass normalization | `pathValidator.ts` |
| 30 | Empty `.catch(() => {})` blocks | `SetBonusService.ts`, `ScrivenersQuillModal.ts` |
| 31 | Service errors only logged to console (user never informed) | Multiple services |
| 32 | `setTimeout` callbacks not canceled in `onunload()` | `main.ts` |
| 33 | Obsidian mock lacks `App.workspace` (blocks planned tests) | `test/mocks/obsidian.ts` |

### LOW -- Nice to Have

| # | Issue | Location |
|---|-------|----------|
| 34 | Default achievements are job-search specific (47%) | `achievements.ts` |
| 35 | `validateCharacter()` never called in production | `validator.ts` |
| 36 | `validateGearItem()` never called in production | `validator.ts` |
| 37 | Quest validator doesn't check `linkedTaskFile` | `validator.ts` |
| 38 | No input validation on `createManualQuest()` parameters | `Quest.ts` |
| 39 | Duplicate filter state (`uiStore.filters` vs `filterStore`) | Stores |
| 40 | `require('obsidian').Notice` instead of static imports | `main.ts` |
| 41 | `dungeonStore` tight coupling to `characterStore` | `dungeonStore.ts` |
| 42 | Seed `Math.random` for deterministic combat tests | Test infrastructure |
| 43 | Use `checkCallback` for conditional commands | `main.ts` |
| 44 | `(this as any)._questNameOverride` undeclared field | `ScrivenersQuillModal.ts` |
| 45 | Category default inconsistency `''` vs `'general'` | `ScrivenersQuillModal.ts` |
| 46 | Fire-and-forget dynamic imports (detached DOM risk) | Multiple files |
| 47 | `saveSettings()` without await | `main.ts:529` |
| 48 | 49 `as any` casts across 16 files | Various |
| 49 | `taskSectionsStore` redundant alias methods | `taskSectionsStore.ts` |
