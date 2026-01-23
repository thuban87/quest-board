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

## 2026-01-19 - Step 18.5: Section Parsing & Task Display Enhancement

**Focus:** Enhanced task display with section parsing, collapsible mini-objectives, and view synchronization

**Branch:** `feat/adjusting-card-layouts`

**Completed:**
- ✅ Added `TaskSection` interface and `readTasksWithSections()` to TaskFileService
- ✅ Parses both `##` and `###` headers as section dividers
- ✅ Collapsible "Mini Objective" sections on quest cards
- ✅ Completion badges per section `(5/12)` with green `(5/5 ✓)` for complete
- ✅ Hide completed tasks (only show incomplete in each section)
- ✅ Nested task indentation based on `indentLevel`
- ✅ `visibleTasksPerSection` - Shows first 4 tasks with "+N more" indicator
- ✅ Created `taskSectionsStore.ts` for shared state between views
- ✅ Sidebar and Full-Page board now sync when tasks are toggled
- ✅ Fixed sidebar scrolling with `calc(100% - 48px)`

**Files Changed:**
- `TaskFileService.ts` - New `TaskSection` type, `readTasksWithSections()`
- `QuestCard.tsx` - Complete rewrite for section display
- `FullKanban.tsx` - Use sections, shared store
- `SidebarQuests.tsx` - Use sections, shared store, content wrapper
- `taskSectionsStore.ts` - New shared Zustand store
- `styles.css` - ~100 lines for section and scroll styling

**Testing Notes:**
- Section parsing works with both `##` and `###` headers
- Collapsing sections works correctly
- Task limits per section display "+N more" indicator
- View sync confirmed working between sidebar and full board
- Sidebar scroll works after multiple CSS attempts

**Next Steps:**
- Merge `feat/adjusting-card-layouts` branch
- Implement Quest Creation Modal (Step 19)

**Hours Worked:** ~2 hours
**Phase:** 2

---

## 2026-01-19 - Step 19: Quest Creation Modal

**Focus:** Modal for creating quest files with form fields

**Branch:** `feat/phase-2/step-19-quest-creation-modal`

**Completed:**
- ✅ Created `CreateQuestModal.ts` with full form
- ✅ Quest Name (required text input)
- ✅ Quest Type dropdown (main/side/training) → saves to correct folder
- ✅ Category dropdown with existing categories + "Add New" option
- ✅ Priority dropdown (low/medium/high)
- ✅ Linked Task File with Browse button (Obsidian's native FuzzySuggestModal)
- ✅ XP fields: xpPerTask, completionBonus
- ✅ Optional fields: dueDate, estimatedTime, difficulty
- ✅ Body textareas: Description, Objectives, Rewards
- ✅ Generates quest file with frontmatter + body sections
- ✅ Self-linking adds placeholder Tasks section

**Files Created/Changed:**
- `src/modals/CreateQuestModal.ts` - New modal component
- `main.ts` - Added "Create New Quest" command
- `styles.css` - Modal styling (~80 lines)

**Testing Notes:**
- Modal opens from command palette
- File suggest uses native Obsidian fuzzy search
- Created quests appear on board immediately
- Task linking issue resolved by relinking path

**Next Steps:**
- Merge branch
- Continue with Step 20 (Drag-and-Drop)

**Hours Worked:** ~1 hour
**Phase:** 2

---

## 2026-01-19 - Steps 20-21: Drag-and-Drop & Character Sheet

**Focus:** Enable card dragging between columns, character sheet sprite display

**Branch:** `feat/phase-2/steps-20-21`

**Completed:**
- ✅ Installed `@dnd-kit/core` and `@dnd-kit/sortable`
- ✅ Added drag-and-drop to FullKanban (DndContext, DroppableColumn, DraggableCard)
- ✅ Added drag-and-drop to SidebarQuests (DroppableSection, DraggableSidebarCard)
- ✅ Dragging cards between columns updates quest status and saves
- ✅ Added gear slot placeholders to CharacterSheet (6 slots: head, chest, legs, boots, weapon, shield)
- ✅ Added `spriteFolder` setting for character sprite path
- ✅ Sprite loading via `vault.getResourcePath()` with emoji fallback
- ✅ Fixed character sheet scrolling overflow

**Files Changed:**
- `src/components/FullKanban.tsx` - DnD wrappers and handlers
- `src/components/SidebarQuests.tsx` - DnD wrappers and sprite resource path
- `src/components/CharacterSheet.tsx` - Gear slots, sprite display
- `src/settings.ts` - Added spriteFolder setting
- `styles.css` - Gear slot and sprite styling
- `package.json` - Added @dnd-kit dependencies

**Testing Notes:**
- Drag-and-drop works in both views
- Sprite displays correctly from vault folder
- Fallback to class emoji if sprite missing

**Bugs/Issues:**
- None outstanding

**Next Session Prompt:**
> Steps 20-21 complete. Next: Step 22 (XP Progress Bar animation) or Step 23 (Level-Up Celebration). Consider building the full-page CharacterSheetView when ready to expand character features.

**Hours Worked:** ~3 hours
**Phase:** 2

---

## 2026-01-20 - Steps 22, 23, 26: Training Mode & Level-Up System

**Focus:** XP Progress Bar, Level-Up Celebration, Training Mode fixes

**Completed:**

### Step 26: Training Mode ✅
- ✅ Expanded `TRAINING_XP_THRESHOLDS` from 4 levels (100 XP each) to 10 levels (75 XP each)
- ✅ Added `MAX_TRAINING_LEVEL = 10` constant
- ✅ Updated `calculateTrainingLevel()` to use new thresholds
- ✅ Updated `getTrainingLevelDisplay()` for Roman numerals I-X
- ✅ Added `canGraduate()` function for graduation check
- ✅ Fixed `characterStore.setCharacter()` to recalculate training level on load
- ✅ Updated training mode notices to say "Level X" instead of "Level IV"

### Step 23: Level-Up Celebration ✅
- ✅ Created `LevelUpModal.ts` with class-themed level-up messages
- ✅ Added graduation celebration when reaching Training Level X
- ✅ Integrated modal into `useXPAward` hook with level-up detection
- ✅ Added confetti animation that spawns 50 colorful pieces on level-up

### Step 22: XP Progress Bar ✅
- ✅ Added CSS transitions (0.5s ease-out) for all XP bar fills
- ✅ Added proper CSS for header XP bars (sidebar and fullpage)

### Major Bug Fixes (XP System)
- ✅ Fixed self-linked quests not awarding XP (`vault.cachedRead` → `vault.read`)
- ✅ Fixed double XP awarding (removed duplicate `useXPAward` from `FullKanban.tsx`)
- ✅ Fixed snapshot race conditions with processing lock
- ✅ Fixed collapsed vs expanded XP display discrepancy
- ✅ Fixed header level display showing "Level 1" instead of training level
- ✅ Fixed header XP display to show x/y format in training mode
- ✅ Fixed `visibleTasks` frontmatter setting not applying to QuestCard
- ✅ Added Kanban column scrolling CSS

**Files Modified:**
- `src/services/XPSystem.ts` - Training thresholds, MAX_TRAINING_LEVEL, canGraduate()
- `src/models/Character.ts` - getTrainingLevelDisplay() for I-X
- `src/modals/LevelUpModal.ts` - New file with celebration modal + confetti
- `src/hooks/useXPAward.ts` - Modal integration, bug fixes, removed debug logs
- `src/store/characterStore.ts` - Level recalculation on load, graduation logic
- `src/services/TaskFileService.ts` - Changed cachedRead to read()
- `src/components/SidebarQuests.tsx` - Training level display, visibleTaskCount prop
- `src/components/FullKanban.tsx` - Training level display, removed duplicate useXPAward, visibleTaskCount prop
- `src/components/CharacterSheet.tsx` - Training XP calculation fixes, level X notice
- `src/components/QuestCard.tsx` - visibleTaskCount prop wiring
- `styles.css` - XP bar CSS with transitions, column scrolling, confetti animation

**Technical Discoveries:**
- `vault.cachedRead()` returns stale content for self-linked quest files - use `vault.read()` instead
- Multiple components calling `useXPAward` creates duplicate file watchers
- Obsidian's debounce with `immediate=true` fires both immediately AND after delay

**Testing Notes:**
- XP bar animates smoothly on task completion
- Level-up modal appears with confetti on training level advancement
- Training level correctly displays as Roman numerals (I-X)
- Self-linked and external quests both award XP correctly
- Kanban columns scroll when content overflows
- visibleTasks frontmatter setting now respected

**Bugs/Issues:**
- None outstanding

**Recommended Commit Message:**
```
feat(phase-2): Complete Steps 22, 23, 26 - Training Mode & Level-Up System

Step 26: Training Mode
- Expand TRAINING_XP_THRESHOLDS to 10 levels (75 XP each)
- Add MAX_TRAINING_LEVEL constant and graduation logic
- Support Roman numerals I-X for training levels
- Fix level recalculation on character load

Step 23: Level-Up Celebration
- Create LevelUpModal with class-themed messages
- Add graduation celebration for Training Level X
- Add confetti animation (50 colorful pieces)

Step 22: XP Progress Bar
- Add 0.5s ease-out CSS transitions for XP bars
- Add proper header XP bar styling

Bug fixes:
- Fix self-linked quests not awarding XP (cachedRead→read)
- Fix double XP awarding (duplicate useXPAward hook)
- Fix collapsed vs expanded XP display discrepancy
- Fix header level/XP display for training mode
- Fix visibleTasks frontmatter not applying
- Add Kanban column scrolling CSS
```

**Next Session Prompt:**
> Steps 22, 23, 26 complete. Phase 2 training mode and level-up features are done. Consider Step 24 (Weekly Streak Tracker), Step 27 (Quest Visibility Controls), or Step 28 (Achievement System) next.

**Hours Worked:** ~2 hours
**Phase:** 2

---

## 2026-01-20 - Smart Template System & Multi-File Task Linking

**Focus:** Dynamic Quest Creation from Templates + Multi-File Task Aggregation

**Completed:**
- ✅ "Create Quest from Template" command with dynamic form generation
- ✅ TemplatePickerModal (FuzzySuggestModal) scans `System/Templates/`
- ✅ DynamicTemplateModal auto-generates form fields from `{{placeholders}}`
- ✅ `linkedTaskFiles` YAML array for multi-file task aggregation
- ✅ Fixed frontmatter parsing for Windows line endings and emojis
- ✅ 12 domain quest templates in `examples/domain quests/`

**Technical Changes:**
- `TemplateService.ts`: extractPlaceholders(), parseTemplate()
- `SmartTemplateModal.ts`: TemplatePickerModal, DynamicTemplateModal
- Quest model: `linkedTaskFiles?: string[]`
- QuestService: YAML array parsing

**Next Session:**
> Implement Achievement System (Hub modal, unlock popup, badge display). Level progression 1-40 with milestones.

**Hours Worked:** ~2 hours
**Phase:** 2

---

## 2026-01-20 - Achievement System & Quest-Level Collapse

**Focus:** Gamified achievement system with tracking, popups, and hub modal + quest card collapse toggle

**Completed:**
- ✅ Quest-level collapse toggle in sidebar cards (▼/▶ button)
- ✅ Achievement data model (`src/models/Achievement.ts`) with triggers
- ✅ 32 default achievements: Levels (10), Applications (8), Interviews (8), Streaks (6)
- ✅ AchievementService with check/unlock logic for level, quest_count, category_count, streak
- ✅ AchievementsSidebar component (view all, unlocked/locked sections, progress bars)
- ✅ AchievementUnlockModal with confetti animation and XP bonus
- ✅ CreateAchievementModal for user-created achievements
- ✅ AchievementHubModal with view/edit/delete for all achievements
- ✅ Level-up trigger in useXPAward hook
- ✅ Quest completion + category_count trigger integration
- ✅ Commands: "View Achievements Hub", "Create Custom Achievement"
- ✅ badgeFolder setting for custom badge images
- ✅ Fixed save lock race condition (quest revert bug)

**Blockers Resolved:**
- Quest drag/drop reverting immediately after save (race condition with file watcher)
- Category_count achievements not tracking (missing checkCategoryCountAchievements call)

**Decisions Made:**
- Achievements use emojis by default, optional PNG badges via naming convention
- category_count tracks quest completions by category, not individual tasks
- Save lock mechanism with 1.5s delay prevents file watcher race condition
- Sidebar has 3 views: quests | character | achievements

**Testing Notes:**
- Quest drag/drop and quick action buttons work after save lock fix
- Level-up triggers achievement unlock popup
- Custom achievements can be edited with full trigger options
- Achievements persist across reloads

**Next Steps:**
- Streak tracking (needs daily check system)
- Badge folder autocomplete in settings UI
- Consider achievement categories for filtering

**Hours Worked:** ~2 hours
**Phase:** 2

**Suggested Commit:** `feat(achievements): add full achievement system with hub, triggers, and unlock animations`

**Next Session Prompt:**
> Review Feature Roadmap Phase 2 incomplete items and pick next priority. Remaining Phase 2 work:
> - **Weekly Streak Tracker (P24)** - Consecutive days with quest completions, display prominently
> - **Power-Ups Display (P25)** - Show active class perk + bonuses (e.g., "Task Slayer: +5% XP")
> - **Quest Visibility Controls (P27)** - Show next 3-4 tasks, hide future with hints
> - **Gear Slot UI (P29)** - Empty gear slot outlines on character sheet
> - **Sprite Renderer Service (P30)** - Version-based caching for character sprites
> - **Filter/Search (P33)** - Filter quests by category, priority, or search text
> - **Theme Compatibility (P32)** - Dark/light mode, test popular themes
>
> Also consider: Streak tracking integration with daily notes, achievement streak trigger wiring

---

## 2026-01-20 - Recurring Quests Feature

**Focus:** Implement recurring quests system with auto-generation and dashboard

### Files Created

**Services (`src/services/`):**
- `RecurringQuestService.ts` (~400 lines)
  - Flexible recurrence parsing (daily/weekdays/weekends/weekly:sunday/monday,wednesday)
  - Template scanning from `System/Templates/Quest Board/Recurring Quests/`
  - Quest generation with placeholder replacement ({{date}}, {{date_slug}}, {{output_path}})
  - Archive completed quests to monthly folders
  - Schedule interpretation for human-readable descriptions
  - `getTemplateStatuses()` API for dashboard

**Modals (`src/modals/`):**
- `RecurringQuestsDashboardModal.ts` (~175 lines)
  - Table view of all recurring templates
  - Shows schedule, next run date, today's status
  - Syntax help section with all recurrence values
  - "Process Now" button

**Documentation (`docs/`):**
- `Recurring Quests System.md` - Technical reference for the feature

**Examples (`examples/recurring-templates/`):**
- `Daily Wellness.md` - Example daily template
- `Weekly Review.md` - Example weekly template

### Files Modified

- `main.ts` - Added RecurringQuestService initialization, 1am scheduled job, dashboard command
- `Quest.ts` - Added `recurrence`, `recurringTemplateId`, `instanceDate` fields to ManualQuest
- `QuestService.ts` - Added `recurring` folder, parse new frontmatter fields
- `services/index.ts` - Export RecurringQuestService
- `styles.css` - Added ~200 lines for dashboard styling
- `QuestCard.tsx` - Fixed task indentation (handles tabs, 2/4-space indent)
- `TaskFileService.ts` - Improved indent calculation

### Technical Decisions

1. **Recurrence in template frontmatter** - Simple, user-editable, no separate config file
2. **1am processing time** - After midnight ensures yesterday's quests are ready to archive
3. **Self-linked tasks** - Quest file contains its own tasks, no external file dependency
4. **Monthly archive folders** - Organized by YYYY-MM for easy cleanup

### Testing Performed

- ✅ Created template with `recurrence: daily`
- ✅ Template appears in dashboard with correct schedule
- ✅ "Process Now" generates quest file
- ✅ Duplicate detection prevents multiple quests per day
- ✅ Task indentation displays correctly (tested with 2-space, 4-space, tabs)

### Bugs Fixed

- **Task indentation not showing** - Changed from `marginLeft` to `paddingLeft`, increased multiplier
- **Tab indentation not counted** - Added explicit tab counting in `parseTaskLine()`

**Hours Worked:** ~2 hours
**Phase:** Future Enhancement (Recurring Quests)

**Recommended Commit Message:**
```
feat(recurring): add recurring quests auto-generation system

- RecurringQuestService with flexible recurrence parsing
  (daily, weekdays, weekends, weekly:day, specific days)
- RecurringQuestsDashboardModal for template overview
- 1am scheduled job for archive + generation
- Templates in System/Templates/Quest Board/Recurring Quests/
- Fix task indentation display (tabs, 2/4-space)
- Technical docs at docs/Recurring Quests System.md
```

**Next Session Prompt:**
> Continue with Phase 2 incomplete items or test recurring quests more thoroughly.
> Consider: Weekly Streak Tracker (P24), Power-Ups Display (P25), Filter/Search (P33)

---

## 2026-01-20 - XP Progression & Dynamic Sprite System

**Focus:** Revamp XP thresholds and implement tier-based sprite switching

### Files Modified

**XP Progression:**
- `src/services/XPSystem.ts` - New 40-level progression with tiered XP requirements:
  - Levels 1-10: 1,200 XP each
  - Levels 11-20: 1,500 XP each
  - Levels 21-30: 1,800 XP each
  - Levels 31-40: 2,000 XP each
  - Training mode: 100 XP per level (was 75)
  - Added `MAX_LEVEL = 40` constant
  - Updated tier celebration messages for 5 tiers

**Visual Tier System:**
- `src/models/Character.ts` - `getLevelTier()` now returns 1-5:
  - Tier 1: Levels 1-8 (Acolyte)
  - Tier 2: Levels 9-16 (Squire)
  - Tier 3: Levels 17-24 (Knight)
  - Tier 4: Levels 25-32 (Champion)
  - Tier 5: Levels 33-40 (Divine Avatar)

**Dynamic Sprite Switching:**
- `src/components/SidebarQuests.tsx` - Sprite path now uses tier subfolder:
  - Path: `{spriteFolder}/tier{N}/animated.gif`
  - Fallback: `{spriteFolder}/tier{N}/south.png`
  - Auto-switches when level crosses tier boundary

**Recurring Quests Fix:**
- `src/services/RecurringQuestService.ts` - Fixed date functions to use local time instead of UTC

### Folder Structure for Sprites

```
Life/Quest Board/assets/sprites/paladin/
├── tier1/animated.gif    # Levels 1-8
├── tier2/animated.gif    # Levels 9-16
├── tier3/animated.gif    # Levels 17-24
├── tier4/animated.gif    # Levels 25-32
└── tier5/animated.gif    # Levels 33-40
```

### Testing Performed

- ✅ XP thresholds calculate correctly
- ✅ getLevelTier returns correct tier for each level range
- ✅ Sprite path includes tier subfolder
- ✅ GIF displays animated in character sheet

**Hours Worked:** ~1.5 hours
**Phase:** Phase 2 (Sprite Renderer Service/P30) + XP Rebalance

---

## 2026-01-20 - Character Stats System Implementation

**Focus:** D&D-style stats system with class-specific bonuses and XP-based stat growth

**Completed:**
- ✅ Added 6 primary stats (STR, INT, WIS, CON, DEX, CHA) to Character model
- ✅ Created `StatsService.ts` with derived stats (HP, Mana, Attack, Defense, Speed, Crit)
- ✅ Implemented class-specific category→stat mapping for all 7 classes
- ✅ Added XP-based stat growth (100 XP per category = +1 stat)
- ✅ Implemented stat cap (Level × 2 per stat) to prevent inflation
- ✅ Added level-up stat gains (+2 primary, +1 others)
- ✅ Updated Character Sheet UI with Attributes and Combat Stats panels
- ✅ Added Settings UI for custom category→stat mappings
- ✅ Added `knownCategories` auto-populate for category autocomplete
- ✅ Fixed race condition bug in stat processing (was overwriting XP)
- ✅ Fixed statBonuses initialization bug (was defaulting to 10 instead of 0)
- ✅ Fixed duplicate XP_THRESHOLDS in characterStore (was using old Level 2 = 200 XP)
- ✅ Added "Reset Stats Only" debug button in Settings
- ✅ Silenced PathValidator warnings for deleted files

**Bugs Fixed:**
- XP bar not updating after completing tasks (race condition)
- All stats getting +10 bonus on first stat gain (wrong fallback)
- Character leveling up at old 200 XP threshold instead of 1200 XP

**Testing Notes:**
- Custom category mapping (fitness → INT) works correctly
- Stat tooltips show base + bonus with cap info
- Debug logging added for stat processing troubleshooting

**Next Session Prompt:**
"Continue with Quest Board - review stats system in practice, implement weekly streak tracker (P24), or start work on power-ups display (P25). Debug logging for stats can be removed once stable."

**Suggested Commit:**
```
feat(stats): implement D&D-style character stats system

- Add 6 primary stats (STR/INT/WIS/CON/DEX/CHA) to Character model
- Create StatsService with derived stats (HP, Mana, Attack, etc.)
- Implement class-specific category-to-stat mapping
- Add XP-based stat growth (100 XP = +1 stat) with level cap
- Add level-up stat gains (+2 primary, +1 others)
- Add Attributes and Combat Stats panels to Character Sheet
- Add custom category mapping UI in Settings with autocomplete
- Fix XP threshold duplication bug (characterStore vs XPSystem)
- Add Reset Stats debug button
```

**Hours Worked:** ~2 hours
**Phase:** Phase 2 (Stats System - New Feature)

---

## 2026-01-21 - Weekly Streak Tracker (P24) & Quest Logic Consolidation

**Focus:** Implement weekly streak tracking and consolidate duplicated quest logic

**Completed:**
- ✅ Created `StreakService.ts` with streak tracking logic
- ✅ Added streak fields to Character interface (`currentStreak`, `highestStreak`, `lastQuestCompletionDate`, `shieldUsedThisWeek`)
- ✅ Implemented Paladin shield protection (1 miss per week forgiven)
- ✅ Added streak display to Character Sheet
- ✅ Added streak mode setting (quest vs task completion tracking)
- ✅ Fixed timezone issues (using local time, not UTC)
- ✅ Created `useQuestLoader` hook to centralize quest loading/watching
- ✅ Created `useQuestActions` hook to centralize quest actions
- ✅ Created `QuestActionsService.ts` for centralized business logic
- ✅ Refactored SidebarQuests and FullKanban to use shared hooks
- ✅ Added save lock mechanism to prevent file watcher race condition
- ✅ Added `checkStreakOnLoad` to plugin initialization (main.ts)
- ✅ Updated Reset Stats button to also reset streak

**Bugs Fixed:**
- Quest status reverting after drag-drop (save lock timing)
- Streak not persisting after reload (character save callback)
- Timezone issues causing incorrect day comparisons

**Testing Notes:**
- Streak increments correctly on quest completion
- Streak persists across Obsidian reloads
- Reset Stats button clears streak properly
- Both Sidebar and Kanban views work correctly

**Known Issues (Not Critical):**
- Obsidian editor may show cached file content until reload (display only, file saves correctly)

**Next Steps:**
- P25: Power-Ups Display
- Remove debug logging when stable

**Hours Worked:** ~2 hours
**Phase:** Phase 2 (Streak Tracker)

---

## 2026-01-21 (Cont.) - SidebarQuests & FullKanban Consolidation Refactor

**Focus:** Major architectural refactor to eliminate ~150 lines of duplicated code between SidebarQuests.tsx and FullKanban.tsx

**Problem Addressed:**
Both `SidebarQuests` and `FullKanban` had evolved independently with significant code duplication. This created maintenance burden and was the root cause of several bugs (streak not saving, quest status reverting, etc.). A full line-by-line audit identified 10 areas of duplication.

**Completed (4 Chunks):**

### Chunk 1: Non-Interactive Utilities
- ✅ Added `getXPProgressForCharacter(character)` to `XPSystem.ts` - handles both training mode and regular mode XP bar calculation
- ✅ Created `useSaveCharacter.ts` hook - consolidates character/inventory/achievements save logic
- ✅ Added `getQuestsByStatus(status)` method to `questStore.ts` - imperative access for callbacks

**Where to find this logic now:**
- XP bar progress: `src/services/XPSystem.ts` → `getXPProgressForCharacter()`
- Character saving: `src/hooks/useSaveCharacter.ts`
- Quests by status: `src/store/questStore.ts` → `getQuestsByStatus()`

### Chunk 2: DnD Wrappers & Handlers
- ✅ Created `DnDWrappers.tsx` with shared `Droppable` and `DraggableCard` components
- ✅ Created `useDndQuests.ts` hook - shared sensors and `handleDragEnd` logic

**Where to find this logic now:**
- Drop targets / draggable cards: `src/components/DnDWrappers.tsx`
- DnD sensors + drag end handling: `src/hooks/useDndQuests.ts`

### Chunk 3: Toggle/Collapse Logic
- ✅ Created `useCollapsedItems.ts` hook - manages collapsed state with `toggle()`, `isCollapsed()`, `collapse()`, `expand()`, `collapseAll()`, `expandAll()`
- ✅ Wired into SidebarQuests for individual quest collapse
- ✅ Wired into FullKanban for card collapse + bulk operations

**Where to find this logic now:**
- Collapse state management: `src/hooks/useCollapsedItems.ts`
- **SidebarQuests**: Uses `isQuestCollapsed()` and `toggleQuestCollapse()`
- **FullKanban**: Uses `isCardCollapsed()`, `toggleCard()`, `collapseCards()`, `expandCards()`, plus `toggleAllCardsInColumn()` and `areAllCardsCollapsed()` helpers

### Chunk 4: Status Config Unification
- ✅ Created `questStatusConfig.ts` with unified `QUEST_STATUS_CONFIG` array
- ✅ Added `SIDEBAR_STATUSES` (3 statuses, no Completed) and `KANBAN_STATUSES` (4 statuses)
- ✅ Updated both components to import from shared config

**Where to find this logic now:**
- Quest status definitions: `src/config/questStatusConfig.ts`
- **SidebarQuests**: Imports `SIDEBAR_STATUSES`
- **FullKanban**: Imports `KANBAN_STATUSES`

**Summary of Removed Duplication:**
| Area | Lines Removed |
|------|---------------|
| XP progress calculation | ~20 lines (10 x 2) |
| handleSaveCharacter | ~18 lines (9 x 2) |
| getQuestsForSection/Column | ~8 lines (4 x 2) |
| DnD wrappers | ~48 lines (24 x 2) |
| DnD sensors + handleDragEnd | ~40 lines (20 x 2) |
| toggleCard/toggleQuestCollapse | ~22 lines |
| SECTIONS/COLUMNS config | ~16 lines |
| **Total** | **~150 lines** |

**New Files Created:**
- `src/hooks/useSaveCharacter.ts`
- `src/hooks/useDndQuests.ts`
- `src/hooks/useCollapsedItems.ts`
- `src/components/DnDWrappers.tsx`
- `src/config/questStatusConfig.ts`

**Testing Notes:**
- XP bars display correctly in both views ✅
- Drag-and-drop works between columns/sections ✅
- Cards expand/collapse individually ✅
- Kanban "collapse all" column button works ✅
- Quest status changes persist ✅
- Streak updates and saves correctly ✅

**Important for Future Sessions:**
When working on features related to:
- **XP display/calculation**: Check `XPSystem.ts`
- **Quest status columns**: Check `questStatusConfig.ts`
- **Drag-and-drop**: Check `DnDWrappers.tsx` and `useDndQuests.ts`
- **Collapse/expand behavior**: Check `useCollapsedItems.ts`
- **Saving character data**: Check `useSaveCharacter.ts`
- **Quest loading/watching**: Check `useQuestLoader.ts` (from previous session)
- **Quest actions (move/toggle)**: Check `useQuestActions.ts` and `QuestActionsService.ts` (from previous session)

**DO NOT** look for these features in the component files themselves - they now use shared hooks/utilities.

**Hours Worked:** ~1.5 hours
**Phase:** Architecture refactor (supports all phases)

---

## 2026-01-21 - Technical Debt: Race Condition Fix & Granular Reloading

**Focus:** Addressing technical debt from Gemini audit, specifically the file watcher race condition and "reload everything" performance issue

### Summary of Changes

This session fixed critical technical debt issues that were causing race conditions and inefficient quest reloading. The main issues addressed:

1. **Race Condition (#2)** - File watcher was reloading quests during save operations, causing stale data
2. **Linked File Sync Bug** - Task files outside the quest folder weren't triggering reloads
3. **"Reload Everything" Time Bomb (#1)** - Every file change reloaded ALL quests instead of just the affected one
4. **XP Award Missing in Kanban** - `useXPAward` hook was imported but never called in FullKanban

### Detailed Changes

#### 1. Race Condition Fix (Set-based Save Tracking)

**Problem:** The original `saveLockRef` was a boolean that blocked ALL reloads when ANY save was in progress. This was too coarse and could still race.

**Solution:** Changed to a `Set<string>` called `pendingSavesRef` that tracks individual quest IDs being saved.

**Files Changed:**
- `src/hooks/useQuestLoader.ts` - Changed `saveLockRef: boolean` → `pendingSavesRef: Set<string>`
- `src/hooks/useQuestActions.ts` - Updated to add/remove quest IDs during save lifecycle

**How it works:**
```typescript
// Before save
pendingSavesRef.current.add(questId);
// After save (with 500ms delay for debounce)
setTimeout(() => pendingSavesRef.current.delete(questId), 500);
```

#### 2. Linked File Sync Fix

**Problem:** The `watchQuestFolder` only monitored files within the quest storage folder. Linked task files (stored elsewhere like daily notes or project folders) weren't triggering reloads when modified.

**Solution:** Added a secondary file watcher that monitors all linked task files.

**Files Changed:**
- `src/hooks/useQuestLoader.ts` - Added `linkedFileToQuestRef` Map and vault.on('modify') listener

**How it works:**
```typescript
// Map of linked file path → quest ID
const linkedFileToQuestRef = useRef<Map<string, string>>(new Map());

// When linked file changes, reload only that quest's sections
const onLinkedFileModify = vault.on('modify', async (file) => {
    const questId = linkedFileToQuestRef.current.get(file.path);
    if (questId) {
        await loadSectionsForQuest(quest);
    }
});
```

**Bug Found During Testing:** Initially, `linkedFilePaths` was only populated inside the watcher callback, not on initial load. This meant linked files weren't tracked until a quest folder change occurred. Fixed by populating the map during initial load.

#### 3. Granular Quest Reloading

**Problem:** Every file change in the quest folder triggered a full reload of ALL quests (13+ currently). This would become a performance issue as quest count grows.

**Solution:** Created a new granular watcher that loads only the affected quest when a file changes.

**New Functions/Types in `src/services/QuestService.ts`:**
- `SingleQuestResult` interface - Return type for single quest loads
- `loadSingleQuest(vault, filePath)` - Loads a single quest from a file path
- `watchQuestFolderGranular(vault, baseFolder, callbacks)` - Per-file callbacks instead of full reload

**New Methods in `src/store/taskSectionsStore.ts`:**
- `updateQuestSections(questId, sections, progress)` - Update single quest's sections
- `removeQuestSections(questId)` - Remove single quest's sections

**Rewrote `src/hooks/useQuestLoader.ts`:**
- Uses `watchQuestFolderGranular` instead of `watchQuestFolder`
- Uses `upsertQuest` for individual quest updates
- Maintains `linkedFileToQuestRef` map for efficient linked file updates

**Callback Structure:**
```typescript
watchQuestFolderGranular(vault, storageFolder, {
    onQuestModified: (filePath, quest) => upsertQuest(quest),
    onQuestCreated: (filePath, quest) => upsertQuest(quest),
    onQuestDeleted: (filePath) => removeQuest(basename),
    onQuestRenamed: (newPath, oldPath, quest) => { ... },
});
```

#### 4. Extra Full Reload Fix

**Problem:** After implementing granular reload, there was still an unexpected full reload being triggered after each granular update.

**Root Cause:** `loadQuestsAndSections` was in the `useEffect` dependency array. When React detected a change in the callback identity, it re-ran the effect.

**Solution:** Removed `loadQuestsAndSections` from the dependency array with a comment explaining why:
```typescript
}, [vault, storageFolder, useSaveLock, upsertQuest, removeQuest, ...]);
// Note: loadQuestsAndSections intentionally excluded - only used for initial load
```

#### 5. XP Award Fix in FullKanban

**Problem:** XP wasn't being awarded when checking off tasks from the Kanban view.

**Root Cause:** `useXPAward` was imported (line 20) but never actually called in `FullKanban.tsx`. XP only worked when the Sidebar view was open.

**Solution:** Added the hook call to FullKanban matching the same pattern used in SidebarQuests:
```typescript
useXPAward({
    app,
    vault: app.vault,
    badgeFolder: plugin.settings.badgeFolder,
    customStatMappings: plugin.settings.categoryStatMappings,
    onCategoryUsed: async (category) => { ... },
    onSaveCharacter: handleSaveCharacter,
});
```

### Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/hooks/useQuestLoader.ts` | **Rewritten** | Granular updates, linked file tracking, Set-based save lock |
| `src/hooks/useQuestActions.ts` | Modified | Updated to use Set-based pending saves, removed from toggleTask |
| `src/services/QuestService.ts` | Modified | Added `loadSingleQuest`, `watchQuestFolderGranular`, `SingleQuestResult` |
| `src/store/taskSectionsStore.ts` | Modified | Added `updateQuestSections`, `removeQuestSections` methods |
| `src/components/FullKanban.tsx` | Modified | Added missing `useXPAward` hook call |

### Testing Results

| Test Case | Result |
|-----------|--------|
| Initial load shows quest count | ✅ Works |
| Kanban → linked file sync | ✅ Works |
| Linked file → Kanban sync | ✅ Works |
| Quest move between columns | ✅ Works (with save lock) |
| Rapid task toggling | ✅ No race condition |
| XP awarded from Kanban | ✅ Works (was broken before) |
| Granular updates (no full reload spam) | ✅ Works |

### Important for Future Sessions

**If working on file watching or quest updates:**
- `useQuestLoader.ts` now does ALL the watching (quest folder + linked files)
- `watchQuestFolderGranular` provides per-file callbacks, not full reload
- `pendingSavesRef` tracks in-flight saves - check before reloading
- `linkedFileToQuestRef` maps linked file paths to quest IDs

**If working on toggle/check task:**
- `toggleTask` in `useQuestActions.ts` does NOT add to pending saves
- This is intentional - it saves LINKED files, not quest files
- The file watcher needs to reload to pick up task changes

**If XP isn't working:**
- Check that `useXPAward` is actually CALLED in the component, not just imported
- Both `SidebarQuests` and `FullKanban` should call it

### Suggested Commit Message

```
fix: Race condition fix + granular quest reloading

- Replace boolean saveLockRef with Set<string> pendingSavesRef for per-quest save tracking
- Add secondary file watcher for linked task files (outside quest folder)
- Implement granular quest reloading (only reload affected quest, not all)
- Add loadSingleQuest and watchQuestFolderGranular to QuestService
- Add updateQuestSections/removeQuestSections to taskSectionsStore
- Fix XP award in FullKanban (hook was imported but never called)
- Fix extra full reload triggered by useEffect dependency

Technical debt items addressed:
- #1: "Reload Everything" Time Bomb
- #2: Race Condition Hack
```

**Hours Worked:** ~1.5 hours
**Phase:** Architecture refactor / Technical debt

---

## 2026-01-21 - Power-Ups System Foundation + Bug Fixes

**Focus:** Power-Ups System Foundation, XP Multiplier Wiring, First Blood Fix, Double XP Bug Fix

**Completed:**

### Power-Ups System Infrastructure
- ✅ Added power-up types to `Character.ts`: `PowerUpEffect`, `PowerUpDuration`, `CollisionPolicy`, `ActivePowerUp`
- ✅ Created `PowerUpService.ts` (622 lines) with 8 effect definitions and 7 trigger definitions
- ✅ Core functions: `evaluateTriggers`, `grantPowerUp`, `expirePowerUps`, `getXPMultiplierFromPowerUps`
- ✅ Added `setPowerUps()` action to `characterStore.ts`

### Trigger Integration
- ✅ `useXPAward.ts`: Added task_completion triggers (First Blood) and xp_award triggers (Level Up/Tier Up)
- ✅ `QuestActionsService.ts`: Added streak_update triggers (Streak Keeper 3/7)

### XP Multiplier Wiring (NEW)
- ✅ Wired `getXPMultiplierFromPowerUps()` into `calculateXPWithBonus()` in `XPSystem.ts`
- ✅ Power-ups like First Blood (+5% XP) now actually affect XP calculations
- ✅ Verified working: XP awards show boosted values when buffs are active

### First Blood Daily Counter Fix (NEW)
- ✅ **Root Cause:** `tasksCompletedTodayRef` was a React ref that reset on component mount
- ✅ **Fix:** Added `tasksCompletedToday` and `lastTaskDate` to Character model (persisted)
- ✅ Added `incrementTasksToday()` action to characterStore
- ✅ Updated `useXPAward.ts` to use persisted counter instead of refs
- ✅ Now First Blood correctly triggers only once per day, survives reloads

### Character Sheet UI
- ✅ Added buff display grid to CharacterSheet
- ✅ Class perk displays as passive buff (golden border)
- ✅ Active power-ups show with hover tooltips

### Quest File Fix (Surgical Frontmatter Updates)
- ✅ Rewrote `saveManualQuest()` to do surgical frontmatter-only updates via `updateFrontmatterFields()`
- ✅ Only `status` and `completedDate` fields are modified - file body remains untouched
- ✅ Verified working: moving quests between columns preserves tasks

### Double XP Award Bug Fix
- ✅ **Root Cause:** `useXPAward` was called in BOTH `SidebarQuests.tsx` AND `FullKanban.tsx`
- ✅ **Fix:** Removed `useXPAward` from `FullKanban.tsx`
- ✅ Verified: Single XP notification per task

### Documentation & Cleanup
- ✅ Updated `Power-Ups System.md` with implementation status, collisionPolicy, notificationType
- ✅ Removed unused `watchQuestFolder` function from `QuestService.ts`
- ✅ Created `Failed session log.md` to archive previous failed session

**Files Modified:**
- `src/models/Character.ts` - Power-up types, `tasksCompletedToday`, `lastTaskDate`
- `src/services/PowerUpService.ts` - Core power-up logic
- `src/services/XPSystem.ts` - XP multiplier integration
- `src/services/QuestService.ts` - Surgical frontmatter updates, removed dead code
- `src/services/QuestActionsService.ts` - Streak triggers
- `src/store/characterStore.ts` - `setPowerUps()`, `incrementTasksToday()` actions
- `src/hooks/useXPAward.ts` - Triggers, persisted daily counter
- `src/components/CharacterSheet.tsx` - Buff display UI
- `src/components/FullKanban.tsx` - Removed duplicate useXPAward
- `docs/Power-Ups System.md` - Updated implementation status
- `docs/Failed session log.md` - NEW (archived failed session)

**Known Remaining Issues:**
1. **Debug logging still present** - Can be removed once power-ups are stable
2. **Only 6 triggers implemented** - Proof of concept; more can be added later

**Testing Notes:**
- Quest column/section moves preserve tasks ✅
- Power-up triggers fire correctly (First Blood tested) ✅
- XP multipliers apply correctly (+5% verified) ✅
- First Blood only triggers once per day ✅
- Single XP notification per task ✅

**Bugs/Issues Fixed This Session:**
- Double XP/notification bug (duplicate useXPAward hooks)
- Quest file overwriting (surgical frontmatter updates)
- XP multipliers not applied (now wired in)
- First Blood triggering multiple times per day (now persisted)

**Recommended Commit Message:**
```
feat(power-ups): Complete power-ups core loop + fix First Blood trigger

Power-Ups System:
- Add PowerUpEffect, PowerUpDuration, CollisionPolicy types to Character
- Create PowerUpService with 8 effects, 7 triggers, collision handling
- Wire getXPMultiplierFromPowerUps into calculateXPWithBonus
- Add buff display to CharacterSheet with hover tooltips

First Blood Fix:
- Add tasksCompletedToday/lastTaskDate to Character (persisted)
- Add incrementTasksToday action to characterStore
- Daily counter now survives reloads

Bug Fixes:
- Fix double XP award (remove duplicate useXPAward from FullKanban)
- Fix quest file overwriting (surgical frontmatter-only updates)

Cleanup:
- Remove unused watchQuestFolder function
- Update Power-Ups System.md documentation
```

**Next Session Prompt:**
> Power-ups core loop is complete and tested. Remaining work:
> 1. Remove debug logging from `useXPAward.ts` once stable
> 2. Consider adding more triggers (Hat Trick, Blitz, category-based, etc.)
> 3. Status bar indicator for active buffs (per Power-Ups System.md)
> 4. Test edge cases: midnight rollover, multiple buffs stacking

**Hours Worked:** ~3 hours
**Phase:** Phase 2 (Power-Ups System)

---

## 2026-01-22 - Power-Ups Part 2: Status Bar & Trigger Fixes

**Focus:** Status bar with buff tray, stat boost effects, trigger fixes, achievement persistence

**Completed:**

### Status Bar with Buff Tray
- ✅ Created extensible `StatusBarService.ts` with provider architecture
- ✅ Created `BuffStatusProvider.ts` for power-up display
- ✅ Created `timeFormatters.ts` utility for relative time
- ✅ Implemented click-to-expand popup tray showing all buffs
- ✅ Status bar shows icon + count, click opens full buff list

### Stat Boost Effects
- ✅ Wired `getStatBoostFromPowerUps()` into `getTotalStat()` in StatsService
- ✅ Level Up (+3 all stats) and Limit Break now actually boost displayed stats
- ✅ Added visual indicator (⬆ with green glow) for buffed stats in CharacterSheet

### Trigger Fixes
- ✅ Fixed One-Shot trigger (`quest_completion` was never evaluated)
- ✅ Added `quest_completion` evaluation in `QuestActionsService.moveQuest()`
- ✅ One-Shot now correctly triggers when Available → Completed

### Achievement Persistence Fix
- ✅ **Root Cause:** `checkQuestCountAchievements` mutated array but changes weren't saved
- ✅ **Fix:** Added `useCharacterStore.setState({ achievements: [...achievements] })`
- ✅ First Quest and all other achievements now properly persist unlock state

**Files Modified:**
- `main.ts` - Status bar initialization
- `src/services/StatusBarService.ts` - NEW (extensible provider architecture)
- `src/services/BuffStatusProvider.ts` - NEW (buff display with tray)
- `src/utils/timeFormatters.ts` - NEW (time utilities)
- `src/services/StatsService.ts` - Power-up stat boost integration
- `src/services/QuestActionsService.ts` - One-Shot trigger evaluation
- `src/hooks/useXPAward.ts` - Achievement persistence fix
- `src/components/CharacterSheet.tsx` - Stat buff visual indicator
- `styles.css` - Status bar, buff tray, stat buff styling

**Testing Notes:**
- Status bar shows buffs correctly ✅
- Click tray popup works ✅
- One-Shot trigger fires when completing from Available ✅
- Stat boosts display with green glow ✅
- First Quest achievement no longer triggers repeatedly ✅

**Recommended Commit Message:**
```
feat(power-ups): Add status bar buff tray + fix triggers and achievements

Status Bar:
- Create extensible StatusBarService with provider architecture
- Add BuffStatusProvider with click-to-expand popup tray
- Status bar shows icon + count, click opens full buff list

Stat Boosts:
- Wire getStatBoostFromPowerUps into getTotalStat
- Level Up/Limit Break buffs now boost displayed stats
- Add visual indicator (green glow) for buffed stats

Bug Fixes:
- Fix One-Shot trigger (add quest_completion evaluation)
- Fix First Quest achievement firing repeatedly (persist unlock state)
```

**Next Session Prompt:**
> Power-ups Part 2 complete. User wants achievement audit:
> 1. Audit all achievement check paths for similar persistence issues
> 2. Add achievement progress tracking/display
> 3. Consider wiring Streak Shield effect

**Hours Worked:** ~1.5 hours
**Phase:** Phase 2 (Power-Ups System)

---

## 2026-01-22 - Achievement Audit & Views Consolidation

**Focus:** Fix achievement persistence bugs, consolidate duplicate code, add progress tracking

**Completed:**

### Achievement System Audit
- ✅ Fixed level achievement persistence (wasn't saving to store after unlock)
- ✅ Wired up streak achievements (`checkStreakAchievements` was never called)
- ✅ Added streak achievement check in `QuestActionsService.ts`

### Achievement Progress Tracking
- ✅ Added real-time progress for level/streak achievements
- ✅ Progress now shows current values (e.g., "1/5" for level 5 achievement at level 1)

### Views Consolidation
- ✅ Created `calculateAchievementProgress()` in `AchievementService.ts`
- ✅ Both `AchievementsSidebar.tsx` and `AchievementHubModal.ts` use shared function
- ✅ Removed duplicate `updateAchievementProgress()` method from modal
- ✅ Single source of truth for progress calculation

**Files Modified:**
- `src/services/AchievementService.ts` - Added shared `calculateAchievementProgress()` function
- `src/services/QuestActionsService.ts` - Added streak achievement checks
- `src/components/AchievementsSidebar.tsx` - Use shared progress function
- `src/modals/AchievementHubModal.ts` - Use shared progress function, removed duplicate
- `src/hooks/useXPAward.ts` - Fixed level achievement persistence

**Testing Notes:**
- Sidebar achievements show correct progress ✅
- Hub modal shows same values ✅
- Level/streak achievements update in real-time ✅

**Recommended Commit Message:**
```
feat(achievements): Audit fixes + consolidate progress calculation

Audit Fixes:
- Fix level achievement persistence (save to store after unlock)
- Wire up streak achievements (checkStreakAchievements was never called)
- Add streak achievement check in QuestActionsService

Views Consolidation:
- Create calculateAchievementProgress() in AchievementService
- Both AchievementsSidebar and AchievementHubModal use shared function
- Remove duplicate updateAchievementProgress() from modal
- Single source of truth for progress calculation
```

**Next Session Prompt:**
> Achievement system audited and consolidated. Remaining work:
> 1. Wire Streak Shield effect (buff granted but doesn't protect streaks)
> 2. Consider adding more triggers (Hat Trick, Blitz, etc.)

**Hours Worked:** ~1 hour
**Phase:** Phase 2 (Power-Ups System)

---

## 2026-01-22 - Command Menu & Settings Updates

**Focus:** Consolidate commands into menu modal, add folder exclusion and template settings

**Completed:**
- ✅ Created `QuestBoardCommandMenu.ts` modal with 5 categorized sections:
  - Views (Sidebar, Full Page)
  - Create (New Quest, From Template, Application, Interview)
  - Character (Edit Character, Achievements, New Achievement)
  - Quests (Recurring Dashboard, Process Recurring)
  - Utilities (Settings)
- ✅ Added new settings fields: `excludedFolders`, `templateFolder`, `archiveFolder`, `defaultQuestTags`, `enableDailyNoteLogging`
- ✅ Added settings UI sections: "Quest Folder Settings" and "Template Configuration"
- ✅ Implemented folder exclusion filter in FullKanban and SidebarQuests (hides from Kanban but keeps in index)
- ✅ Registered new command: "Open Quest Board Menu"
- ✅ Added CSS for command menu (category grid, button hover effects, centered 3rd button)

**Key Files:**
- `src/modals/QuestBoardCommandMenu.ts` (NEW)
- `src/settings.ts` (modified - new fields + UI sections)
- `src/components/FullKanban.tsx` (modified - excluded folder filter)
- `src/components/SidebarQuests.tsx` (modified - excluded folder filter)
- `main.ts` (modified - registered command)
- `styles.css` (modified - command menu styles)

**Testing Notes:**
- Command menu opens via "Quest Board: Open Quest Board Menu"
- All buttons execute correct commands
- Settings opens to Quest Board tab
- Excluded folders correctly hide quests from Kanban

**Hours Worked:** ~1 hour
**Phase:** Phase 2 (UI Enhancements)

---

## 2026-01-22 - Filter/Search & Dynamic Quest Type Refactor (Phase 2 Complete!)

**Focus:** Implement filter/search for Kanban + Sidebar, then refactor quest types to be dynamic (folder-based)

### Features Implemented

**Filter/Search System:**
- ✅ Created `filterStore.ts` - Zustand stores for filter state (separate for Kanban/Sidebar)
- ✅ Created `FilterBar.tsx` - Compact filter bar with Category, Priority, Tags, Type, Date, Sort
- ✅ Created `useFilteredQuests.ts` - Hook for filtering and sorting quest lists
- ✅ Integrated FilterBar into both `FullKanban.tsx` and `SidebarQuests.tsx`
- ✅ Dynamic filter options populated from actual quest data (categories, tags, types)
- ✅ Search bar with real-time text filtering (name, category, tags, task names)
- ✅ Sort options: Default, Sort Order, Task Count (asc/desc), Created Date (asc/desc)

**Quest Card Enhancements:**
- ✅ Added `sortOrder` field to `ManualQuest` model for intra-column drag reordering
- ✅ Added dual file link icons: 📄 (quest file) + 🔗 (linked task file, only if different)
- ✅ Intra-column drag-and-drop reordering with `SortableContext` + gap-based sorting

**XP Bug Fix:**
- ✅ Fixed XP not awarding from Kanban view (added `useXPAward` hook to `FullKanban.tsx`)

### Dynamic Quest Type Refactor

**Problem:** Quest types were hardcoded to an enum (`MAIN | SIDE | TRAINING`). Setting `questType: recurring` caused quests to disappear from Kanban because the validator rejected anything not in the enum.

**Solution:** Made quest types fully dynamic based on folder names.

**Files Changed (5 files, ~40 lines):**

| File | Change |
|------|--------|
| `validator.ts` | Accept any non-empty string as questType (was rejecting 'recurring') |
| `Quest.ts` | Changed `questType` from enum to `string` in BaseQuest and ManualQuest |
| `QuestService.ts` | Infer questType from folder path + use `quests/${questType}` for save path |
| `TemplateService.ts` | Use questType directly as folder path |
| `CreateQuestModal.ts` | Scans `quests/` folder for subfolders, populates dropdown dynamically |

**How It Works Now:**
- Quests in `quests/main/` → `questType: main`
- Quests in `quests/recurring/` → `questType: recurring`
- Add new folder → Automatically appears in dropdown and filter

**Known Limitations:**
- `JobHuntModal.ts` still has hardcoded paths (`Life/Quest Board/quests/side` and `quests/main`) - those templates are designed to go to those specific folders anyway, so this is low priority

### Testing Performed
- ✅ Filter bar displays and functions correctly
- ✅ Search filters quests in real-time
- ✅ Sort by all options works
- ✅ Type filter now shows "Recurring" and other custom folders
- ✅ Create Quest modal shows all quest type folders in dropdown
- ✅ Recurring quests display on Kanban
- ✅ Quest file links work (📄 opens quest, 🔗 opens linked file)
- ✅ Intra-column drag reordering works (~90% of the time)
- ✅ XP awards from Kanban view

### Files Created/Modified

**New Files:**
- `src/store/filterStore.ts` - Filter state stores
- `src/components/FilterBar.tsx` - Filter bar UI
- `src/hooks/useFilteredQuests.ts` - Filtering hook with helper functions

**Modified Files:**
- `src/models/Quest.ts` - Added `sortOrder`, changed `questType` to string
- `src/services/QuestService.ts` - Dynamic paths, sortOrder support, questType inference
- `src/services/TemplateService.ts` - Dynamic folder paths
- `src/components/FullKanban.tsx` - Filter integration, DnD reorder, useXPAward
- `src/components/SidebarQuests.tsx` - Filter integration, DnD reorder
- `src/components/QuestCard.tsx` - Dual file links, sortOrder
- `src/components/DnDWrappers.tsx` - Added SortableCard component
- `src/hooks/useDndQuests.ts` - Intra-column reorder with gap-based sorting
- `src/utils/validator.ts` - Removed QuestType enum check
- `src/modals/CreateQuestModal.ts` - Dynamic folder scanning for type dropdown
- `styles.css` - FilterBar styles (~50 lines)

**Hours Worked:** ~3 hours
**Phase:** Phase 2 (Complete! 🎉)

**Recommended Commit Message:**
```
feat(phase-2): Complete Filter/Search & Dynamic Quest Type Refactor

Filter/Search System:
- Add filterStore.ts for filter state management
- Add FilterBar.tsx with Category, Priority, Tags, Type, Date, Sort
- Add useFilteredQuests.ts hook with collectAllCategories/Tags/Types
- Integrate FilterBar into FullKanban and SidebarQuests
- Add sortOrder field for intra-column drag reordering

Quest Card Enhancements:
- Dual file link icons: 📄 (quest file) + 🔗 (linked task file)
- Intra-column drag reorder with SortableContext
- Fix XP not awarding from Kanban view

Dynamic Quest Type Refactor:
- Change questType from enum to string (supports any folder name)
- Infer questType from folder path (quests/recurring/ → 'recurring')
- CreateQuestModal scans folders dynamically for dropdown
- Validator accepts any non-empty string as questType

This completes Phase 2 of the Quest Board plugin!
```

**Next Session Prompt:**
> Phase 2 is complete! 🎉 The Quest Board now has full filter/search functionality and dynamic quest types based on folder names. Consider:
> - Phase 3 Polish: Theme compatibility testing, performance optimization
> - Wire Streak Shield effect (buff granted but doesn't protect streaks yet)
> - More power-up triggers (Hat Trick, Blitz, etc.)
> - Sprite Renderer Service for character visuals

---

## 2026-01-23 - Exponential Stat Progression Fix

**Focus:** Fix level-up stat persistence bug and implement exponential stat growth

**Completed:**
- ✅ Fixed bug: `applyLevelUpStats()` wasn't persisting to settings (added `onSaveCharacter()` call)
- ✅ Changed stat growth from linear to **exponential** to align with gear system scaling
- ✅ New formula:
  - Primary stats: `+floor(2 + level × 0.5)` → Level 2: +3, Level 40: +22
  - Secondary stats: `+floor(1 + level × 0.25)` → Level 2: +1, Level 40: +11

**Stat Progression Table (Paladin):**

| Level | STR (Primary) | WIS (Primary) | Others | Per-Level Gain (Primary/Secondary) |
|-------|--------------|--------------|--------|-----------------------------------|
| 1 | 10 | 10 | 10 | - |
| 2 | 13 | 13 | 11 | +3 / +1 |
| 10 | 44 | 44 | 26 | +7 / +3 |
| 20 | 116 | 116 | 63 | +12 / +6 |
| 40 | 350 | 350 | 179 | +22 / +11 |

**Key Files:**
- `src/services/StatsService.ts` - New exponential formula in `applyLevelUpStats()`
- `src/hooks/useXPAward.ts` - Added `onSaveCharacter()` after stat gains

**Hours Worked:** ~30 min
**Phase:** Phase 2 (RPG Mechanics)

---

## 2026-01-23 - Fix Double XP Award Bug

**Focus:** Fix XP being awarded twice when both Kanban and Sidebar views are open

**Root Cause:**
Both `FullKanban.tsx` and `SidebarQuests.tsx` independently called `useXPAward`, creating duplicate file watchers. When a task file changed, both watchers fired and awarded XP.

**Solution:**
Implemented singleton pattern for file watchers in `useXPAward.ts`:
- Moved `taskSnapshotsRef`, `fileWatchersRef`, and `processingRef` to module scope
- Added `subscriberCount` to track active hook instances
- Only clean up watchers when the last subscriber unmounts

**Key Changes:**
- `src/hooks/useXPAward.ts`:
  - Added `globalTaskSnapshots`, `globalFileWatchers`, `globalProcessing` at module level
  - Added subscriber count tracking with cleanup on last unmount
  - Refs now point to global singletons instead of local Maps/Sets

**Testing:**
- Verified single XP award with both views open ✅
- Build passes ✅
- Deployed and tested in production ✅

**Hours Worked:** ~30 min
**Phase:** Bug Fix

**Suggested Commit:**
```
fix(xp): prevent double XP award when multiple views open

- Use singleton pattern for file watchers in useXPAward
- Module-level globals shared across all hook instances
- Subscriber count ensures cleanup only on last unmount
```

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

**Last Updated:** 2026-01-22 (Phase 2 Complete - Filter/Search + Dynamic Quest Types)

