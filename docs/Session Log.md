# Quest Board - Session Log

Development log for tracking progress, decisions, and blockers.

---

## 2026-01-15 - Project Inception

**Focus:** Planning and project setup

**Completed:**
- ✅ Conceptualized Quest Board as RPG-style task tracker
- ✅ Defined 3-phase development plan
- ✅ Created project folder structure
- ✅ Wrote comprehensive Project Summary
- ✅ Created Idea List for future features
- ✅ Built Feature Priority List with 40 tasks
- ✅ Set development timeline (1/22 - 1/29)

**Key Decisions:**
- Make plugin GENERIC, not job-hunt specific
  - Supports job hunting, chores, work projects, fitness, etc.
  - User-defined categories instead of hardcoded
- Use React for UI (Brad comfortable with it)
- File-based JSON storage (human-readable, easy to backup)
- Target 7-day development sprint with all 3 phases
- Build Phase 1, USE it for a week, then build Phases 2-3
  - Prevents building features that don't get used
  - Real-world testing informs polish

**Timeline Confirmed:**
- **1/15-1/19:** Finish Mise plugin (cooking/kitchen management)
- **1/20-1/22:** Multi-PC sync for Chronos
- **1/22:** Acquire Ultra AI subscription (unlimited Claude)
- **1/22-1/29:** Build Quest Board (all 3 phases)
- **1/29-2/15:** Refactor all plugins for OOP architecture
- **After 2/15:** Portfolio-ready, start beta testing

**Why This Project Matters:**
- Brad needs motivation system for job hunting (Feb-April)
- Leverages ADHD strengths (visual progress, gamification, dopamine hits)
- Portfolio piece demonstrating React, TypeScript, UX thinking
- Interview story: "I built the tool I needed to find this job"
- Potential Community Plugin (marketable to ADHD devs/students)

**Next Steps:**
- Wait for development window (1/22)
- When starting: Copy plugin scaffold from existing project
- Phase 1 focus: Quick capture + Board + XP system
- Test early and often

**Notes:**
- Brad emphasized SPEED of data entry is critical
  - Quick capture must be <30 seconds
  - Consider QuickAdd integration for voice-to-quest
- No sound effects in MVP (park for future)
- Generic design allows broader user base
- This could be a "killer app" for plugin store

**Open Questions:**
- Best confetti library for victory screens?
- Should milestones be global or per-category?
- How to handle quest archiving (completed quests pile up)?
- Discord webhook vs email for accountability?

---

## 2026-01-18 - Security & Performance Review

**Focus:** Pre-development architecture review

**Completed:**
- ✅ Comprehensive review of all documentation (CLAUDE.md, Project Summary, Feature Priority List, Quest Data Specification, Character Creation & Visual Design)
- ✅ Identified and documented security concerns
- ✅ Identified and documented performance concerns
- ✅ Updated CLAUDE.md with all agreed fixes
- ✅ Updated Quest Data Specification with schema versioning and loadData/saveData approach

**Security Decisions Made:**
- Store API keys in Obsidian Settings (not .env file) - standard for AI plugins
- Use DOMPurify.sanitize with ALLOWED_TAGS: [] for quest titles
- Add SafeJSON parser with prototype pollution protection (__proto__, constructor, prototype)
- Add path validation for linkedTaskFile to prevent reads outside vault
- Implement schema validation before rendering (QuestValidator class)

**Performance Decisions Made:**
- Debounce file watcher (300ms) to prevent redundant reloads during rapid typing
- Use version-based sprite cache key (spriteVersion: number) instead of string concatenation
- Plan for pagination at 50+ quests, virtualization with react-window if needed
- Future: Add cache manifest for faster cold starts (Phase 2+)

**Architecture Decisions Made:**
- Use loadData()/saveData() for plugin state (character, XP, achievements, inventory, UI prefs)
- Use visible vault files for quest content (user-editable, source of truth)
- Remove hidden .quest-data/ folder from plan
- Add ErrorBoundary component to gracefully handle corrupted quest files
- Add schemaVersion: 1 to all quest formats for future migrations
- Remove envLoader.ts from architecture (not needed with Settings approach)

**Files Updated:**
- `CLAUDE.md` - Security section, Performance section, File Structure, State Management, Data Validation
- `docs/Quest Data Specification.md` - Added schemaVersion, updated storage approach, updated templates

**Hours Worked:** ~1.5 hours
**Phase:** Pre-Phase 1 (Planning)

---

## 2026-01-19 - Phase 1 Steps 2-3 Implementation

**Focus:** Core data layer and character creation

**Completed:**
- ✅ Plugin scaffold with TypeScript, React, Zustand, esbuild
- ✅ Deploy script for automated copy to production vault
- ✅ Data models: Quest (schemaVersion), Character (spriteVersion, CLASS_INFO), QuestStatus, Consumable
- ✅ Zustand stores: questStore, characterStore, uiStore with selectors
- ✅ Security utilities: safeJson.ts, sanitizer.ts (DOMPurify), validator.ts, pathValidator.ts
- ✅ Character Creation Modal with class selection (7 classes), appearance customization
- ✅ CSS styling with theme-aware variables, modal styles
- ✅ Integration with plugin settings for persistence

**Testing Notes:**
- Character creation modal opens correctly on first launch
- Class selection works with hover states and perk display
- Character saves to Obsidian settings and persists
- Fixed button contrast issue (dark text on light class colors)

**Hours Worked:** ~2 hours
**Phase:** 1 (Steps 2-3)

---

## 2026-01-19 - Phase 1 Complete (Steps 4-16)

**Focus:** Core services, Kanban UI, and Character Sheet

### Files Created

**Services (`src/services/`):**
- `XPSystem.ts` - XP calculation engine
  - `XP_THRESHOLDS[]` - 30 level thresholds based on age milestones
  - `TRAINING_XP_THRESHOLDS[]` - 4 training levels at 100 XP each
  - `calculateLevel(totalXP)` / `calculateTrainingLevel(trainingXP)`
  - `getXPProgress(totalXP)` - returns 0-1 for progress bar
  - `categoryMatchesClass()` - checks if quest category grants class bonus
  - `getClassBonus()` / `getCombinedClassBonus()` - primary + 50% secondary bonus
  - `calculateXPWithBonus()` - applies class bonus + class-specific perks:
    - Warrior: +5% XP on completion streaks
    - Technomancer: +25% XP on multi-day projects
    - Rogue: +20% XP when completing faster than estimate
    - Cleric: +5% per day on wellness streaks (caps at 35%)
  - `checkLevelUp()` - returns old/new level, tier change detection
  - `getLevelUpMessage()` - class-themed celebration messages

- `TaskFileService.ts` - Markdown task parsing
  - `Task` interface with lineNumber, text, completed, indentLevel
  - `TASK_REGEX` - matches `- [ ]`, `- [x]`, `* [ ]`, numbered lists
  - `readTasksFromFile(vault, path)` - returns TaskFileResult
  - `getTaskCompletion(tasks)` - completed/total/percentComplete
  - `getVisibleTasks(tasks, count)` - progressive reveal
  - `countNewlyCompleted(old, new)` - detects XP-worthy completions
  - `watchTaskFile(vault, path, callback, debounceMs)` - debounced file watcher
  - `toggleTaskInFile()` - modifies checkbox in file

- `QuestService.ts` - Quest file management
  - `QUEST_FOLDERS` - subfolders for main/training/side/ai-generated
  - `parseQuestFrontmatter()` - YAML parser for quest markdown
  - `loadMarkdownQuest()` / `loadJsonQuest()` - load single quest
  - `loadQuestsFromFolder()` / `loadAllQuests()` - batch loading
  - `ensureQuestFolders()` - creates folder structure
  - `generateQuestFrontmatter()` - serializes quest to YAML
  - `saveManualQuest()` / `saveAIQuest()` / `deleteQuestFile()`
  - `watchQuestFolder()` - debounced folder watcher with create/modify/delete/rename events

- `index.ts` - barrel export for all services

**Components (`src/components/`):**
- `QuestCard.tsx` (141 lines)
  - Props: quest, onMove callback, taskProgress
  - `PRIORITY_COLORS` - maps priority to color
  - `STATUS_TRANSITIONS` - defines valid moves per status
  - `MOVE_LABELS` - button labels with emojis
  - Class bonus indicator (colored left border + badge)
  - Progress bar with percentage fill
  - XP display with "+bonus" indicator
  - Action buttons for valid status transitions
  - Wrapped in React.memo for performance

- `KanbanBoard.tsx` (185 lines)
  - Props: vault, storageFolder
  - `COLUMNS[]` - 4-column config (Available/Active/InProgress/Completed)
  - Loads quests from QuestService on mount
  - Maintains `taskProgressMap` for all quests
  - Sets up folder watcher with cleanup on unmount
  - `handleMoveQuest()` - updates store immediately, then saves to file
  - Renders loading state, header with character name + level badge, 4 columns

- `CharacterSheet.tsx` (138 lines)
  - Props: onBack callback
  - Back button navigation
  - Character header with class-colored sprite placeholder (emoji)
  - XP section with progress bar, current/next threshold, total XP
  - Class perk display with bonus categories
  - Stats grid: quests completed, active quests, achievements, total XP
  - Training mode notice when active

**App.tsx Updates:**
- Added `ViewMode` type ('board' | 'sheet')
- Added `currentView` state for tab switching
- Added `prevLevel` state for level-up detection
- Level-up effect: shows Obsidian Notice with class-themed message
- New header with:
  - Tab buttons (⚔️ Board, [class emoji] Character)
  - XP bar (100px wide, class-colored fill)
  - Level display (supports T-X format for training)
- Conditional rendering of KanbanBoard or CharacterSheet

**CSS Additions (~490 lines total across session):**
- `.qb-main-header` - flex header with tabs and XP bar
- `.qb-tab-btn` / `.qb-tab-btn.active` - tab styling
- `.qb-header-xp` / `.qb-header-xp-bar` / `.qb-header-xp-fill` - XP bar
- `.qb-character-sheet` - sheet container
- `.qb-sheet-header` / `.qb-sheet-sprite` / `.qb-sheet-emoji` - character display
- `.qb-sheet-xp-section` / `.qb-sheet-xp-bar` - larger XP bar
- `.qb-sheet-perk` / `.qb-perk-bonus` - perk display
- `.qb-stats-grid` / `.qb-stat-item` / `.qb-stat-value` - stats grid
- `.qb-training-notice` - yellow-tinted training mode banner
- `.qb-kanban-board` / `.qb-columns` / `.qb-column` - board layout
- `.qb-quest-card` / `.qb-card-header` / `.qb-card-actions` - card styling
- `.qb-progress-bar` / `.qb-progress-fill` - task progress
- `.qb-class-bonus-badge` - small badge for class bonus

**Example Files (`examples/`):**
- `sample-quest.md` - Example quest with complete frontmatter
- `sample-task-file.md` - Example task file with checkboxes

### Design Decisions

1. **Frontmatter parsing:** Simple line-by-line YAML parsing (no full YAML library) - handles quoted strings, comma-separated tags
2. **Quest type validation:** Only accepts 'main'|'training'|'side' for manual quests to satisfy TypeScript union
3. **Task progress caching:** Stored in component state, refreshed on folder watcher callback
4. **Level-up detection:** Uses prevLevel state to detect changes, fires once per level
5. **View switching:** Simple state toggle, no router needed for MVP

### Testing Performed

- Created character → saved to settings ✅
- Reload Obsidian → character persists ✅
- Created quest file with frontmatter → appeared on board ✅
- Moved quest Available → Active → In Progress → Completed ✅
- Quest file updated with new status ✅
- Task file linked → progress bar shows X/Y ✅
- Tab switching Board ↔ Character works ✅
- Character Sheet shows correct stats ✅
- XP bar in header displays correctly ✅

### Git Branches

- `feat/phase-1/steps-4-5` - XPSystem + TaskFileService
- `feat/phase-1/steps-7-8` - QuestService + examples
- `feat/phase-1/steps-9-11` - KanbanBoard + QuestCard
- `feat/phase-1/steps-12-16` - CharacterSheet + App updates

**Hours Worked:** ~2 hours
**Phase:** 1 (Complete!)

---

## 2026-01-19 - Step 17: XP Wiring & Task Display

**Focus:** Wire task completion to XP awards and add task display to quest cards

### Files Created

**Hooks (`src/hooks/`):**
- `useXPAward.ts` (181 lines) - Task file watching and XP award hook
  - `UseXPAwardOptions` interface - vault reference, save callback
  - `TaskSnapshot` - tracks questId, filePath, tasks, completion count
  - `awardXPForTasks()` - calculates XP with class bonus, detects level-up
  - `checkTaskFile()` - reads task file, compares to snapshot, awards XP for new completions
  - File watchers with debounced callbacks (500ms)
  - Quest completion bonus detection (all tasks done → bonus XP)
  - Persists character after XP changes via callback
- `index.ts` - barrel export

### Files Modified

**`QuestCard.tsx`:**
- Added `tasks?: Task[]` prop for task list
- Added `onToggleTask: (questId, lineNumber) => void` handler
- Added `visibleTaskCount` prop (default 4)
- New `visibleTasks` calculation - shows completed + next N incomplete
- Renders clickable task list with ☐/☑ checkboxes
- Strikethrough styling for completed tasks
- "+N more tasks" indicator for hidden tasks

**`KanbanBoard.tsx`:**
- Added `tasksMap` state to cache tasks per quest
- Added `handleToggleTask()` - calls `toggleTaskInFile()`, reloads tasks
- Passes `tasks` and `onToggleTask` to QuestCard
- Added `setLoading(false)` after initial load

**`App.tsx`:**
- Integrated `useXPAward` hook with vault and save callback
- Moved `handleSaveCharacter` before hook call (dependency order)

**`styles.css` (+63 lines):**
- `.qb-card-tasks` - container styling
- `.qb-task-item` - clickable row with hover states
- `.qb-task-item.completed` - green tint, strikethrough text
- `.qb-task-checkbox` - checkbox styling
- `.qb-tasks-hidden` - "+N more" indicator

### Testing Performed

- Click task checkbox → toggles in file ✅
- XP notification appears → "+X XP for 1 task" ✅
- Class bonus applies when category matches ✅
- Quest completion bonus fires when all tasks done ✅
- XP persists after Obsidian reload ✅
- Progress bar updates correctly ✅

### Git Branch

- `feat/phase-1/step-17`

**Hours Worked:** ~1 hour
**Phase:** 1 (Step 17)

---

## 2026-01-19 - Step 18: UI Redesign - Full-Page Kanban & Focused Sidebar

**Focus:** Redesign Quest Board UI with full-page Kanban view and focused sidebar

### Files Created

**Views (`src/views/`):**
- `constants.ts` (7 lines) - View type constants
- `QuestBoardView.tsx` (56 lines) - Full-page ItemView, renders FullKanban
- `QuestSidebarView.tsx` (55 lines) - Sidebar ItemView, renders SidebarQuests
- `index.ts` (8 lines) - Barrel export

**Components (`src/components/`):**
- `FullKanban.tsx` (339 lines) - Full-page board with:
  - 4 columns (Available, Active, In Progress, Completed)
  - RPG-themed colored borders
  - Collapsible columns (thin bar with vertical title)
  - Collapsible quest cards (shows name + XP when collapsed)
  - Expanded columns grow to fill space when others collapse
- `SidebarQuests.tsx` (299 lines) - Focused sidebar with:
  - Tab navigation: Quests | Character
  - Collapsible sections (no Completed)
  - Full CharacterSheet on Character tab
  - Simplified level display (no "T-" prefix)

### Files Modified

**`main.ts`:**
- Registers both views with `registerView()`
- Ribbon icon opens focused sidebar
- Command: "Open Quest Board (Sidebar)" → right panel
- Command: "Open Quest Board (Full Page)" → main tab

**`styles.css` (+400 lines):**
- `.qb-fullpage-*` - Full-page board, header, columns
- `.qb-fp-column.collapsed` - Thin bar with vertical title
- `.qb-fp-card-wrapper` - Card with collapse toggle
- `.qb-fp-card-collapsed` - Minimized card (name + XP)
- `.qb-sb-tabs` - Tab navigation
- `.qb-sb-section` - Collapsible quest sections

### Files Removed

- `App.tsx` - Old sidebar container
- `KanbanBoard.tsx` - Old 4-column sidebar board
- `QuestBoardView.ts` - Old view file (replaced with .tsx)

### Testing Performed

- Ribbon icon opens focused sidebar ✅
- Full-page opens via command palette ✅
- Collapsible columns work (click header) ✅
- Columns grow when others collapse ✅
- Collapsible quest cards work (click ▼) ✅
- Tab navigation switches between Quests/Character ✅
- Task toggle works in both views ✅
- XP awards work in both views ✅

### Git Branch

- `feat/phase-1/step-18`

**Hours Worked:** ~1.5 hours
**Phase:** 2 (Step 18)

---

## Next Session Prompt

**Phase 2 Continues**

Step 18 is complete. The Quest Board now has:
- **Full-page Kanban** - Opens as a main tab with 4 columns
- **Focused Sidebar** - Opens in right panel with collapsible sections

### What's Working

**Full-Page Kanban (`Ctrl+P` → "Open Quest Board (Full Page)"):**
- 4 columns with RPG-themed colored borders
- Collapsible columns (click header → thin bar with vertical title)
- Collapsible quest cards (click ▼ → shows just name + XP)
- Expanded columns grow to fill space when others collapse
- Task checkboxes and XP awards work

**Focused Sidebar (ribbon icon or `Ctrl+P` → "Open Quest Board (Sidebar)"):**
- Tab navigation: Quests | Character
- Collapsible sections: Available, Active, In Progress (no Completed)
- Full CharacterSheet component on Character tab
- Simplified level display (no "T-" prefix)

### Key Files

**Views (`src/views/`):**
- `QuestBoardView.tsx` - Full-page ItemView
- `QuestSidebarView.tsx` - Sidebar ItemView
- `constants.ts` - View type constants
- `index.ts` - Barrel export

**Components (`src/components/`):**
- `FullKanban.tsx` - Full-page board with collapsible columns/cards
- `SidebarQuests.tsx` - Focused sidebar with tabs and collapsible sections
- `QuestCard.tsx` - Quest card (shared by both views)
- `CharacterSheet.tsx` - Full character display

**Removed:**
- `App.tsx` - Old sidebar container
- `KanbanBoard.tsx` - Old 4-column sidebar board
- `QuestBoardView.ts` - Old view (replaced with .tsx version)

### Phase 2 Priority Order

1. **Drag-and-Drop** - For moving quests between columns
2. **XP Animations & Level-Up** - Confetti/modal celebration
3. **Training Mode** - Graduation at Level IV
4. **Sprite Renderer** - Layer compositing service

### Docs to Reference
- `docs/Feature Roadmap.md` - Full feature checklist
- `CLAUDE.md` - Architecture overview

### Deploy
`npm run deploy`

---

## Template for Future Sessions

**Date:** YYYY-MM-DD
**Focus:** [What you're working on]

**Completed:**
- [Task 1]
- [Task 2]

**Blockers:**
- [Any issues or decisions needed]

**Decisions Made:**
- [Key architectural or feature decisions]

**Testing Notes:**
- [What you tested, what broke, what worked]

**Next Steps:**
- [What to tackle next session]

**Hours Worked:** [Estimate]
**Phase:** [1, 2, or 3]

---

**Last Updated:** 2026-01-19
