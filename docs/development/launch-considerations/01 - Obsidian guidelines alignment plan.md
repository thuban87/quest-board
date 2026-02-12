# Obsidian Guidelines Alignment Plan

**Plugin:** Quest Board v1.0.0  
**Date:** 2026-02-11  
**Status:** Pre-BRAT Release Audit  
**Estimated Sessions:** 13 phases (~13 sessions)

---

## Overview

This plan addresses all findings from the pre-BRAT release audit. Issues are organized into session-sized phases, ordered by priority (hard blockers → guideline compliance → polish). Each phase is designed to be completable in a single coding session.

> [!IMPORTANT]
> **Phases 1–5** address core code issues identified in the audit (file I/O, security, API compliance).
> **Phases 6–7** address additional guideline compliance (event cleanup, settings UI).
> **Phases 8–13** address CSS class prefix namespacing under Obsidian's requirement that all plugin CSS selectors use a unique namespace prefix (`qb-`).

---

## Phase 1: Missing Files, Manifest Fixes & Import Cleanup

**Priority:** 🔴 Release Blocker
**Scope:** Small — 3 new/modified files + import cleanup across 2 files
**Risk:** None

### Tasks

- [ ] **Create `LICENSE` file** in repo root
  - Use MIT license (already declared in README)
  - Required by Obsidian submission guidelines

- [ ] **Create `versions.json`** in repo root
  - Maps plugin version to minimum Obsidian app version
  - Required by BRAT for auto-update functionality
  - Format: `{ "1.0.0": "1.4.0" }`
  - Must stay in sync with `manifest.json` → `minAppVersion`

- [ ] **Fix `manifest.json` description**
  - Add trailing period to description (Obsidian guideline)
  - Remove the empty `fundingUrl` key entirely (guideline: omit if not accepting donations)
  ```diff
  -"description": "Gamified task tracker with RPG mechanics. Turn your to-do list into an epic quest!"
  +"description": "Gamified task tracker with RPG mechanics. Turn your to-do list into an epic quest."
  ```

- [ ] **Convert `require('obsidian')` runtime calls to top-level imports**
  - Reviewers flag `new (require('obsidian').Notice)(...)` patterns
  - 10 instances in `main.ts` — all `Notice` constructors
  - 1 instance in `src/modals/ScrollLibraryModal.ts` — `Menu` constructor
  - Fix: Add `Notice` / `Menu` to the existing top-level `import { ... } from 'obsidian'` statement, then replace all `require()` calls with direct usage

### Verification
- `npm run build` — clean build
- Validate `versions.json` is valid JSON
- Confirm LICENSE file exists and is standard MIT
- Grep for `require('obsidian')` — should return 0 results

---

## Phase 2: Production Values Reset

**Priority:** ⏸️ Deferred
**Scope:** Tiny — 3 one-line edits
**Risk:** Low (gameplay balance only)

> [!NOTE]
> **Deferred until closer to public release.** These elevated test values are intentionally kept during the active development/feature-addition phase to facilitate testing. Features are still being added and balanced, so locking down production values now would create unnecessary friction. These will be reset as part of the final pre-release checklist. The values and their locations are tracked in `CLAUDE.md` under "Testing Values to Verify."

### Tasks (when ready)

- [ ] **Daily Stamina Cap: 500 → 50**
  - File: `src/config/combatConfig.ts` line 361
  - `MAX_DAILY_STAMINA = 500` → `MAX_DAILY_STAMINA = 50`
  - Impact: Currently allows 250 fights/day instead of intended 25

- [ ] **Bounty Slider Max: 100% → 20%**
  - File: `src/settings.ts` line 532
  - `.setLimits(0, 100, 5)` → `.setLimits(0, 20, 5)`
  - Impact: Users can currently set bounty chance to 100% (guaranteed bounty every quest)

- [ ] **Set Piece Drop Rate: 40% → 33%**
  - File: `src/services/LootGenerationService.ts` line 416
  - `Math.random() < 0.40` → `Math.random() < 0.33`
  - Impact: Set piece gear drops slightly too often

### Verification (when ready)
- `npm run build` — clean build
- `npm run test` — all 168+ tests pass
- `npm run deploy:test` — manual spot-check in test vault
- Verify stamina caps out at correct value after task completions

---

## Phase 3: `confirm()` → ConfirmModal Conversion

**Priority:** 🔴 Release Blocker (Obsidian guideline: no native browser dialogs)  
**Scope:** Medium — 5 files, 9 call sites  
**Risk:** Low (pattern already established in codebase)

### Context

The project already has a custom `ConfirmModal` class from earlier compliance work. These 9 remaining `confirm()` calls need to be converted to use it. Since `ConfirmModal` is async and `confirm()` is synchronous, each call site needs to be converted to `async/await`.

### Tasks

| # | File | Line | Context | 
|---|------|------|---------|
| 1 | `src/settings.ts` | 990 | Reset stats confirmation |
| 2 | `src/settings.ts` | 1029 | Master reset ("Are you ABSOLUTELY sure?") |
| 3 | `src/modals/ColumnManagerModal.ts` | 345 | Reset columns to defaults |
| 4 | `src/modals/ColumnManagerModal.ts` | 428 | Delete column |
| 5 | `src/modals/ScrivenersQuillModal.ts` | 1000 | Overwrite template (save) |
| 6 | `src/modals/ScrivenersQuillModal.ts` | 1054 | Overwrite template (save as) |
| 7 | `src/modals/WatchedFolderManagerModal.ts` | 163 | Delete watcher |
| 8 | `src/modals/ScrollLibraryModal.ts` | 566 | Delete template |
| 9 | `src/modals/AchievementHubModal.ts` | 267 | Delete achievement |

> [!WARNING]
> **ScrollLibraryModal.ts (site #8):** The current code uses `const confirm = window.confirm(...)` which shadows the `confirm` function name as a local variable. When converting, make sure the replacement variable name (e.g., `confirmed`) doesn't conflict with anything in the surrounding scope.

### Pattern
```typescript
// Before
if (confirm('Delete this item?')) {
    await deleteItem();
}

// After
const confirmed = await ConfirmModal.show(this.app, {
    title: 'Delete Item',
    message: 'Delete this item?',
    confirmText: 'Delete',
    danger: true,
});
if (confirmed) {
    await deleteItem();
}
```

### Verification
- `npm run build` — clean build
- `npm run test` — all tests pass
- `npm run deploy:test` → manually trigger each confirmation in the test vault:
  1. Settings → Reset Stats
  2. Settings → Master Reset
  3. Column Manager → Reset to Defaults
  4. Column Manager → Delete a column
  5. Scrivener's Quill → Save over existing template (×2 paths)
  6. Watched Folder Manager → Delete a watcher
  7. Scroll Library → Delete a template
  8. Achievement Hub → Delete a custom achievement

---

## Phase 4: `vault.modify()` → `vault.process()` Conversion + `fetch()` → `requestUrl()`

**Priority:** 🟡 Recommended (Obsidian best practices for atomic file ops and network requests)
**Scope:** Medium — 10 files, 12 call sites (7 file I/O + 5 network)
**Risk:** Medium (file I/O changes require careful testing)

### Context: `vault.process()`

`vault.process()` provides atomic read-modify-write semantics, preventing race conditions when multiple operations target the same file. `vault.modify()` requires reading the file first, then writing — creating a window for data loss if another operation writes between the read and write.

> [!IMPORTANT]
> **Only read-modify-write patterns need conversion.** Call sites that generate entirely new content and overwrite the file (full overwrites) should stay as `vault.modify()` — converting them to `vault.process()` would be an anti-pattern because the callback would receive the old content as a parameter and completely ignore it. See the "No Change Needed" table below.

### Part A1: `vault.modify()` → `processFrontMatter()` (frontmatter-specific sites)

Obsidian's `app.fileManager.processFrontMatter()` is the highest-level API for frontmatter modifications. It parses YAML into a JS object, lets you modify properties directly, and serializes back — preserving formatting and comments better than manual string manipulation. It is also atomic.

| # | File | Line | Pattern | Notes |
|---|------|------|---------|-------|
| 1 | `src/services/QuestService.ts` | 548 | Read → `updateFrontmatterFields()` → write | Status/completedDate update |
| 2 | `src/services/QuestService.ts` | 681 | Read → `updateFrontmatterFields()` → write | sortOrder update (subfolder) |
| 3 | `src/services/QuestService.ts` | 694 | Read → `updateFrontmatterFields()` → write | sortOrder update (base folder) |

> [!NOTE]
> These functions currently receive `vault` as a parameter, not `app.fileManager`. The function signatures will need to accept `fileManager` (or the full `app` object) to access `processFrontMatter()`. The existing `updateFrontmatterFields()` helper can be retired for these three sites since `processFrontMatter()` replaces its functionality.

#### Pattern
```typescript
// Before
const existingContent = await vault.read(file);
const updatedContent = updateFrontmatterFields(existingContent, {
    status: quest.status,
    completedDate: quest.completedDate,
});
await vault.modify(file, updatedContent);

// After
await app.fileManager.processFrontMatter(file, (fm) => {
    fm.status = quest.status;
    if (quest.completedDate) {
        fm.completedDate = quest.completedDate;
    } else {
        delete fm.completedDate;
    }
});
```

### Part A2: `vault.modify()` → `vault.process()` (general read-modify-write sites)

| # | File | Line | Pattern | Notes |
|---|------|------|---------|-------|
| 4 | `src/utils/columnMigration.ts` | 101 | Read → transform content → write | Column deletion migration |
| 5 | `src/services/TaskFileService.ts` | 393 | Read lines → toggle checkbox → write | Task checkbox sync |
| 6 | `src/services/DailyNoteService.ts` | 214 | Read → append content → write | Daily note appending |
| 7 | `src/services/BalanceTestingService.ts` | 339 | Read → transform → write | Dev-only, included for consistency |

#### Pattern
```typescript
// Before
const content = await vault.read(file);
const newContent = transform(content);
await vault.modify(file, newContent);

// After
await vault.process(file, (content) => {
    return transform(content);
});
```

### No Change Needed (full overwrite sites — stay as `vault.modify()`)

These generate entirely new content and write it. `vault.modify()` is the correct API here.

| File | Line | Reason |
|------|------|--------|
| `src/services/QuestService.ts` | 731 | Writes fresh `safeJsonStringify(quest)` — no existing content used |
| `src/modals/CreateQuestModal.ts` | 542 | Writes freshly generated quest frontmatter + body |
| `src/modals/AIQuestPreviewModal.ts` | 114 | Writes freshly generated AI markdown |
| `src/modals/ScrivenersQuillModal.ts` | 1004 | Writes freshly generated template content |
| `src/modals/ScrivenersQuillModal.ts` | 1128 | Writes freshly generated template content |

### Part B: `fetch()` → `requestUrl()` (5 network call sites)

Obsidian guidelines require using `requestUrl()` from the `obsidian` package instead of the native `fetch()` API. This ensures proper CORS handling and mobile compatibility. The plugin already uses `requestUrl()` in `AssetService.ts`, so the pattern is established.

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `src/services/AIQuestService.ts` | 92 | Gemini API call for AI quest generation |
| 2 | `src/services/AIDungeonService.ts` | 233 | Gemini API call for AI dungeon generation |
| 3 | `src/services/SetBonusService.ts` | 299 | Gemini API call for set bonus generation |
| 4 | `src/services/SetBonusService.ts` | 414 | Gemini API call for set bonus generation |
| 5 | `src/services/BountyService.ts` | 417 | Gemini API call for bounty name generation |

#### Pattern
```typescript
// Before
const response = await fetch(url, { method: 'POST', headers, body });
const data = await response.json();

// After
import { requestUrl } from 'obsidian';
const response = await requestUrl({ url, method: 'POST', headers, body });
const data = response.json;  // Note: requestUrl returns parsed JSON directly
```

### Verification
- `npm run build` — clean build
- `npm run test` — all tests pass
- `npm run deploy:test` → Test each operation path:
  1. Move a quest between columns (triggers frontmatter update)
  2. Reorder quests via drag-and-drop (triggers sortOrder update)
  3. Delete a column and verify quest migration
  4. Check/uncheck tasks within a quest
  5. Complete a quest with daily notes enabled
  6. Generate an AI quest (tests `requestUrl` conversion)
  7. Generate an AI dungeon (tests `requestUrl` conversion)
  8. Win combat loot with set bonus gear (tests `requestUrl` conversion)

---

## Phase 5: `innerHTML` → DOM API Conversion

**Priority:** 🟡 Recommended (security surface reduction)  
**Scope:** Medium-Large — 5+ files, 13+ call sites  
**Risk:** Medium (visual regression possible)

### Context

While the current `innerHTML` usage renders internal plugin data (not user-supplied content), Obsidian reviewers may flag it. Converting to Obsidian's `createEl()` / `createDiv()` / `setText()` DOM APIs eliminates the XSS surface entirely and aligns with Obsidian's preferred patterns.

### Tasks

| # | File | Uses | Content Type | Conversion Approach |
|---|------|------|-------------|---------------------|
| 1 | `src/utils/gearFormatters.ts` | 4 | Gear stats HTML panels | `DocumentFragment` (see note below) |
| 2 | `src/modals/ColumnManagerModal.ts` | 1 | Warning box HTML | Single `createEl()` with child elements |
| 3 | `src/modals/InventoryManagementModal.ts` | 2 | Header + totals HTML | `createEl()` with `setText()` |
| 4 | `src/modals/InventoryModal.ts` | 3 | Stat display strings | `createSpan()` children (see note below) |
| 5 | `src/modals/BlacksmithModal.ts` | 3 | Header + instructions + preview | `createEl()` with child elements |

> [!NOTE]
> **`gearFormatters.ts`** (site #1) is the most complex conversion and should use a `DocumentFragment` approach. These functions build multi-element HTML structures via template literals (stat panels, comparison views with 10-15+ child elements). A DocumentFragment is an invisible in-memory DOM container — you build all elements inside it, then append the entire batch to the real DOM in a single operation. This avoids triggering multiple browser layout recalculations that would occur when chaining `createEl()` directly on a visible parent.
>
> The current `buildGearStatsHtml()` function returns an HTML string. It should be refactored to `buildGearStats(parent: HTMLElement, item: GearItem)` that builds into a DocumentFragment and appends once:
> ```typescript
> function buildGearStats(parent: HTMLElement, item: GearItem): void {
>     const frag = document.createDocumentFragment();
>     const name = document.createElement('div');
>     name.className = 'qb-tt-name';
>     name.textContent = item.name;
>     frag.appendChild(name);
>     // ... build all stat rows into frag
>     parent.appendChild(frag); // Single DOM insertion
> }
> ```
> The simpler sites (#2-5) don't need DocumentFragment — chained `createEl()` is fine for 2-3 elements.

> [!NOTE]
> **`InventoryModal.ts`** (site #4) uses an incremental `innerHTML +=` pattern to build stat strings conditionally:
> ```typescript
> statsEl.innerHTML = `+${item.stats.primaryValue} ${item.stats.primaryStat}`;
> if (item.stats.attackPower) statsEl.innerHTML += ` • +${item.stats.attackPower} ATK`;
> if (item.stats.defense) statsEl.innerHTML += ` • +${item.stats.defense} DEF`;
> ```
> The DOM API equivalent is to create child `<span>` elements conditionally rather than concatenating HTML strings. Each stat becomes its own `createSpan()` call with a separator span between them.

### Verification
- `npm run build` — clean build
- `npm run test` — all tests pass
- `npm run deploy:test` → Visual regression check:
  1. Open inventory → inspect gear tooltips and comparison panels
  2. Open Blacksmith → verify smelting preview renders correctly
  3. Open Column Manager → verify warning box displays
  4. Open Inventory Management → verify header and totals display

---

## Phase 6: Event Registration Cleanup (`vault.on()` → `registerEvent()`)

**Priority:** 🟡 Recommended (Obsidian best practice for resource cleanup)
**Scope:** Medium — 5 files, ~9 event registrations
**Risk:** Low-Medium (refactoring event wiring, but behavior unchanged)

### Context

Obsidian's preferred pattern for event listeners is `this.registerEvent(vault.on(...))` on the Plugin instance, which guarantees automatic cleanup on plugin unload. The current codebase uses `vault.on()` in services and hooks, with manual cleanup via `vault.offref()`. While the manual cleanup works, it relies on React unmount or explicit `cleanup()` calls — if the plugin unloads without the React tree unmounting first, listeners could zombie.

Notably, `main.ts:onunload()` only explicitly cleans up 3 things: `recoveryTimerCheck`, `statusBarService`, and `folderWatchService`. The QuestService and TaskFileService event listeners rely on React hook cleanup, which is less robust.

### Current State

| File | Events | Current Cleanup | Risk |
|------|--------|----------------|------|
| `src/services/QuestService.ts` | create, modify, delete, rename (4) | Returns unsubscribe fn, called by React hook | Medium — depends on React unmount |
| `src/services/FolderWatchService.ts` | create, rename (2) | `cleanup()` called from `onunload()` | Low — already explicit |
| `src/services/TaskFileService.ts` | modify (1) | Returns unsubscribe fn, called by React hook | Medium — depends on React unmount |
| `src/hooks/useQuestLoader.ts` | modify (1) | `offref()` in useEffect cleanup | Low — React lifecycle |
| `src/hooks/useXPAward.ts` | modify (1) | `offref()` in cleanup function | Low — React lifecycle |

### Fix

Pass the Plugin instance into services so they can call `plugin.registerEvent()` instead of raw `vault.on()`. This ensures all event listeners are automatically cleaned up by Obsidian's plugin lifecycle, regardless of React mount state.

```typescript
// Before (in service)
const onCreate = vault.on('create', async (file) => { ... });
// Cleanup: manual vault.offref(onCreate)

// After (in service, with plugin reference)
plugin.registerEvent(vault.on('create', async (file) => { ... }));
// Cleanup: automatic on plugin unload
```

### Tasks

- [ ] Update `QuestService.watchQuestFolder()` to accept plugin instance and use `registerEvent()`
- [ ] Update `FolderWatchService` to use `registerEvent()` (already has plugin ref via constructor)
- [ ] Update `TaskFileService` watcher setup to accept plugin instance and use `registerEvent()`
- [ ] Update `useQuestLoader.ts` and `useXPAward.ts` to pass plugin through for registration
- [ ] Verify `main.ts:onunload()` still cleans up any remaining manual resources
- [ ] Remove manual `offref()` calls that are now redundant

### Verification
- `npm run build` — clean build
- `npm run test` — all tests pass
- `npm run deploy:test` → Functional checks:
  1. Open Quest Board, verify quests load and file watching works
  2. Create/modify/delete quests, verify updates propagate
  3. Check/uncheck linked task files, verify sync
  4. Add a watched folder, verify file creation triggers quest generation
  5. Disable plugin and re-enable, verify no zombie listeners in console

---

## Phase 7: Settings UI — `createEl('h*')` → `setHeading()` Conversion

**Priority:** 🟡 Recommended (Obsidian settings UI consistency)
**Scope:** Small — 1 file, 13 call sites
**Risk:** Low (visual-only changes)

### Context

Obsidian guidelines specify that settings panel section headers should use `new Setting(containerEl).setHeading().setName('Section Name')` instead of raw HTML heading elements (`createEl('h2')`, `createEl('h3')`, etc.). Using `setHeading()` ensures headers look native and follow the user's theme.

The settings tab currently uses **zero** `setHeading()` calls and **13** `createEl('h*')` calls.

### Tasks

| # | Line | Current | Replacement |
|---|------|---------|-------------|
| 1 | 228 | `createEl('h2', { text: 'Quest Board Settings' })` | `new Setting(containerEl).setHeading().setName('Quest Board Settings')` |
| 2 | 233 | `createEl('h3', { text: 'Essential Settings' })` | `new Setting(containerEl).setHeading().setName('Essential Settings')` |
| 3 | 334 | `createEl('h4', { text: '🎨 Asset Delivery' })` | `new Setting(filePathsContent).setHeading().setName('Asset Delivery')` |
| 4 | 458 | `createEl('h3', { text: 'Gameplay Settings' })` | `new Setting(containerEl).setHeading().setName('Gameplay Settings')` |
| 5 | 543 | `createEl('h3', { text: 'Quest Management' })` | `new Setting(containerEl).setHeading().setName('Quest Management')` |
| 6 | 613 | `createEl('h3', { text: 'Kanban Board' })` | `new Setting(containerEl).setHeading().setName('Kanban Board')` |
| 7 | 678 | `createEl('h3', { text: 'Daily Notes Integration' })` | `new Setting(containerEl).setHeading().setName('Daily Notes Integration')` |
| 8 | 751 | `createEl('h3', { text: 'AI Features' })` | `new Setting(containerEl).setHeading().setName('AI Features')` |
| 9 | 792 | `createEl('h4', { text: '🧪 Balance Testing' })` | `new Setting(advancedContent).setHeading().setName('Balance Testing')` |
| 10 | 837 | `createEl('h5', { text: '⚡ Quick Test Character' })` | `new Setting(advancedContent).setHeading().setName('Quick Test Character')` |
| 11 | 926 | `createEl('h4', { text: 'Set Bonus Configuration' })` | `new Setting(advancedContent).setHeading().setName('Set Bonus Configuration')` |
| 12 | 949 | `createEl('h4', { text: 'Character' })` | `new Setting(advancedContent).setHeading().setName('Character')` |
| 13 | 1065 | `createEl('h4', { text: '🧪 Gemini AI Testing...' })` | `new Setting(devContent).setHeading().setName('Gemini AI Testing (Inline - Legacy)')` |

> [!NOTE]
> Emojis in heading text (🎨, 🧪, ⚡) should be removed during conversion. Obsidian's `setHeading()` renders clean, theme-consistent headers — emoji prefixes are a workaround for plain HTML headings and look out of place with the native styling.

### Verification
- `npm run build` — clean build
- `npm run deploy:test` → Open Settings → Quest Board tab:
  1. Verify all section headers render with native Obsidian heading style
  2. Verify headers follow the user's theme (light/dark)
  3. Verify collapsible sections still work (if any headers are inside collapsible containers)

---

## Phase 8: CSS Prefix — `base.css` Core Layout

**Priority:** 🟡 Recommended (CSS namespace collision prevention)  
**Scope:** Small — 1 CSS file, 0-1 TS files  
**Risk:** Low

### Context

`base.css` is the only CSS module that predates the `qb-` prefix convention. It contains 33 unprefixed selectors. Notably, **most of these classes appear to be legacy/dead code** — a grep of the TypeScript codebase found zero references to the `quest-board-container`, `quest-board-header`, `quest-board-kanban`, `quest-board-empty`, `quest-column-*`, `gear-*`, `stat-*`, or `error-card` classes.

> [!WARNING]
> Before renaming, verify whether these classes are still used. If they're dead code, they should be **removed** rather than renamed. This phase should start with a dead code audit of `base.css`.

### Tasks

- [ ] Audit all 33 selectors in `base.css` for live references in TS/TSX
- [ ] Remove dead CSS selectors entirely
- [ ] Rename any surviving selectors from `quest-board-*` → `qb-*` pattern
- [ ] Update corresponding TS/TSX className references

### Selectors in scope (6 classes)
```
.quest-board-container    .quest-board-header
.quest-board-kanban       .quest-board-empty
.quest-board-empty h2     .quest-board-empty p
```

### Verification
- `npm run build` — clean build
- `npm run deploy:test` → Open Quest Board view, verify layout renders

---

## Phase 9: CSS Prefix — `base.css` Quest Columns

**Priority:** 🟡 Recommended  
**Scope:** Small — 1 CSS file, potential TS updates  
**Risk:** Low

### Tasks

- [ ] Audit column classes for live references
- [ ] Remove or rename: `quest-column` → `qb-quest-column` (or remove if dead)
- [ ] Update TS/TSX references if any survive

### Selectors in scope (4 classes)
```
.quest-column          .quest-column-header
.quest-column-count    .quest-column-cards
```

### Verification
- `npm run build` — clean build
- `npm run deploy:test` → Verify column rendering in all view modes

---

## Phase 10: CSS Prefix — `base.css` Quest Cards

**Priority:** 🟡 Recommended  
**Scope:** Small-Medium — 1 CSS file, 1-2 TS files  
**Risk:** Low-Medium

### Context

`quest-card` is confirmed to be referenced in `QuestCard.tsx` and `TemplatePreviewModal.ts`. These are **live classes** that need renaming.

### Tasks

- [ ] Rename `quest-card*` → `qb-quest-card*` in `base.css`
- [ ] Update `src/components/QuestCard.tsx` className references
- [ ] Update `src/modals/TemplatePreviewModal.ts` className references
- [ ] Search for any other references in components/modals

### Selectors in scope (6 classes)
```
.quest-card            .quest-card:hover
.quest-card-title      .quest-card-category
.quest-card-progress   .quest-card-xp
```

### Verification
- `npm run build` — clean build
- `npm run deploy:test` → Verify quest cards render correctly in:
  - Kanban board (full page + sidebar)
  - Template preview modal
  - Drag and drop still works

---

## Phase 11: CSS Prefix — `base.css` Character & Stats

**Priority:** 🟡 Recommended  
**Scope:** Small-Medium — 1 CSS file, 1 TS file  
**Risk:** Low-Medium

### Context

`character-sheet` is confirmed referenced in `CharacterSidebar.tsx`. The `stat-*` and `gear-*` classes need auditing.

### Tasks

- [ ] Audit character/stat/gear classes for live references
- [ ] Rename or remove: `character-*` → `qb-character-*`
- [ ] Rename or remove: `stat-*` → `qb-stat-*`
- [ ] Rename or remove: `gear-*` → `qb-gear-*`
- [ ] Update `src/components/CharacterSidebar.tsx` and any other referencing files

### Selectors in scope (10 classes)
```
.character-sheet      .character-visual
.character-sprite     .character-stats
.stat-row             .stat-label
.stat-value           .gear-slots
.gear-slot            .gear-slot.equipped
```

### Verification
- `npm run build` — clean build
- `npm run deploy:test` → Open character sheet, verify all stats and gear slots display correctly

---

## Phase 12: CSS Prefix — `base.css` Shared & Cleanup

**Priority:** 🟡 Recommended  
**Scope:** Small — 1 CSS file  
**Risk:** Low

### Tasks

- [ ] Rename or remove: `xp-bar` → `qb-xp-bar`, `xp-bar-fill` → `qb-xp-bar-fill`
- [ ] Remove `error-card` if dead (no TS references found)
- [ ] Final audit: confirm `base.css` has zero unprefixed selectors remaining
- [ ] Consider whether `base.css` should be merged into other modules or remain separate

### Selectors in scope (3 classes)
```
.xp-bar        .xp-bar-fill
.error-card
```

### Verification
- `npm run build` — clean build
- `npm run deploy:test` → Verify XP bars display in header and quest cards
- Run full grep: `Select-String -Path "src/styles/base.css" -Pattern "^\." | Where-Object { $_.Line -notmatch "^\.qb-" }` — should return 0 results

---

## Phase 13: CSS Prefix — `@keyframes` Renaming

**Priority:** 🟡 Recommended  
**Scope:** Small — 3 CSS files  
**Risk:** Low (CSS-only changes, no TS references)

### Context

12 `@keyframes` animations across 3 source CSS files lack the `qb-` prefix. These are referenced only within CSS `animation:` properties (no TypeScript references), so the change is contained entirely within CSS.

### Tasks

#### `src/styles/dungeons.css` (8 keyframes)
```diff
-@keyframes slide-out-north     → @keyframes qb-slide-out-north
-@keyframes slide-out-south     → @keyframes qb-slide-out-south
-@keyframes slide-out-east      → @keyframes qb-slide-out-east
-@keyframes slide-out-west      → @keyframes qb-slide-out-west
-@keyframes slide-in-from-north → @keyframes qb-slide-in-from-north
-@keyframes slide-in-from-south → @keyframes qb-slide-in-from-south
-@keyframes slide-in-from-west  → @keyframes qb-slide-in-from-west
-@keyframes slide-in-from-east  → @keyframes qb-slide-in-from-east
```
+ Update all `animation:` / `animation-name:` properties that reference these names

#### `src/styles/power-ups.css` (2 keyframes)
```diff
-@keyframes buff-pulse      → @keyframes qb-buff-pulse
-@keyframes stat-buff-pulse → @keyframes qb-stat-buff-pulse
```
+ Update corresponding `animation:` properties

#### `src/styles/inventory.css` (2 keyframes)
```diff
-@keyframes loot-bounce   → @keyframes qb-loot-bounce
-@keyframes loot-slide-in → @keyframes qb-loot-slide-in
```
+ Update corresponding `animation:` properties

### Verification
- `npm run build` — clean build (includes CSS bundling)
- `npm run deploy:test` → Visual checks:
  1. Enter/exit dungeon rooms → slide animations work
  2. Trigger a power-up → buff pulse animation plays
  3. Win loot from combat → loot bounce/slide animations play
- Run: `Select-String -Path "src/styles/*.css" -Pattern "@keyframes\s+(?!qb-)" | Where-Object { $_.Path -notlike "*all-styles*" }` — should return 0 results

---

## Cross-Cutting Notes

### Build & Deploy Workflow (Every Phase)
```
1. npm run build          # Compile + CSS bundle
2. Fix any errors
3. npm run deploy:test    # Copy to test vault
4. Manual verification in Obsidian test vault
```

### Session Wrap-Up (Every Phase)
1. Update this document (mark phase complete)
2. Update Session Log
3. Suggest git commit message
4. Note any bugs discovered

### Dependencies Between Phases
- **Phases 1–7** are independent of each other and can be done in any order
- **Phase 8** should be done first among CSS phases (dead code audit informs phases 9–12)
- **Phases 9–12** depend on Phase 8's dead code findings but are otherwise independent
- **Phase 13** (`@keyframes`) is fully independent

### What This Plan Does NOT Cover
- `settings.ts` size (1126 lines) — well-organized internally, not a guideline violation
- `main.ts` size (955 lines) — mostly command registrations, acceptable for plugin complexity
- `.then()` chains (3 remaining in services) — minor style issue, not blocking

### Known Issues for Future Phases

#### Debug Logging System (deferred — major feature)

The codebase currently has **128 `console.log/warn/error` calls across 40 files**. Obsidian guidelines recommend minimizing console logging, and reviewers commonly flag excessive logging. Rather than simply stripping these out (which would lose valuable debugging capability), this will be addressed with a proper gated debug logging system:

- **Planned approach:** Replace all raw `console.*` calls with a centralized debug logger
- **Category flags:** Separate enable/disable flags per log category (errors, warnings, info, debug, etc.)
- **Settings integration:** Add user-facing toggles in the settings panel so BRAT testers can enable specific log categories when reporting issues
- **Goal:** Enable proper debugging when users report issues, while keeping the console clean by default

This is a significant feature addition that warrants its own dedicated session and will be tracked separately.
