# Custom Kanban Columns - Implementation Guide (REVISED)

**Status:** Ready for implementation
**Estimated Effort:** 10-12 hours across 5-6 phases
**Created:** 2026-02-01
**Last Updated:** 2026-02-04 (comprehensive codebase review + security/performance analysis)

---

## Table of Contents

1. [Overview](#overview)
2. [Key Design Decisions](#key-design-decisions)
3. [Data Structures](#data-structures)
4. [Migration Strategy](#migration-strategy)
5. [Security & Validation](#security--validation)
6. [Performance Optimizations](#performance-optimizations)
7. [ColumnConfigService Architecture](#columnconfigservice-architecture)
8. [Implementation Phases](#implementation-phases)
   - [Phase 1: Foundation (Settings UI & Service)](#phase-1-foundation-settings-ui--service)
   - [Phase 2: Archive Bug Fix & Quest Model Prep](#phase-2-archive-bug-fix--quest-model-prep)
   - [Phase 3: Type Migration & Core Services](#phase-3-type-migration--core-services-the-big-change)
   - [Phase 4: Quest Actions Service](#phase-4-quest-actions-service-completion-logic)
   - [Phase 5: Quest Card & UI Components Part 1](#phase-5-quest-card--ui-components-part-1)
   - [Phase 6: Kanban Views, DnD, & Modals](#phase-6-kanban-views-dnd--modals)
   - [Phase 7: Cleanup, Migration, & Testing](#phase-7-cleanup-migration--testing)
9. [Complete Files List](#complete-files-list)
10. [Verification Checklist (Final)](#verification-checklist-final)
11. [Rollback Plan](#rollback-plan)
12. [Post-Implementation Considerations](#post-implementation-considerations)
13. [Notes](#notes)
14. [Questions for Brad (Post-Implementation)](#questions-for-brad-post-implementation)

---

## Overview

Allow users to define their own Kanban column names, emojis, order, and completion behavior. Completion is decoupled from column position - triggered by an explicit Complete button, not column location.

---

## Key Design Decisions

### Columns Are Organizational + Optional Completion Triggers
- Users define column ID, title, optional emoji
- Each column has optional `triggersCompletion: boolean` flag
- Drag-and-drop works between any columns
- Moving between columns = organizational only (no rewards)

### Completion Is Button-Triggered
- **Complete button** → awards loot, streaks, power-ups, bounty, stamina, activity logging, sets `completedDate`
- If a column with `triggersCompletion: true` exists → quest auto-moves there
- If no completion column exists → quest stays in current column
- Moving between columns = just organizational, no rewards

### XP Award System Remains Separate
**IMPORTANT:** XP awards are NOT part of this feature. The existing `useXPAward` hook continues to watch task files and award XP when tasks are completed. This feature only handles: loot, streaks, power-ups, bounty, stamina, activity logging.

**Architecture note:** The design allows for future integration of XP into the Complete button if needed, but it's explicitly out of scope for this implementation.

### Button States

**Before completion:**
- Move buttons for each column (except current)
- Complete ✅ button (bottom of card + context menu)

**After completion:**
- Reopen 🔄 button (clears `completedDate`, logs reopen event)
- Archive 📦 button (moves file to archive folder)
- No column move buttons (drag-and-drop still works)

### Completed Quest Visual Styling
- Green border/background on completed quest cards
- Helps distinguish completed quests from incomplete ones

### Completed Quest Tracking
- Completed = quest has `completedDate` set (regardless of column)
- Count all quests with `completedDate` regardless of folder location

---

## Data Structures

### CustomColumn
```typescript
interface CustomColumn {
    id: string;                    // Internal key (stored in quest frontmatter)
    title: string;                 // Display name
    emoji?: string;                // Optional, defaults to empty string, max 2 chars
    triggersCompletion?: boolean;  // If true, moving here awards rewards (default false)
}
```

### Quest Model Update
```typescript
interface Quest {
    // ... existing fields
    status: QuestStatus | string;  // Changed from QuestStatus enum to union type
    filePath?: string;             // NEW: Actual file location (for archive support)
}
```

### Default Columns
```typescript
const DEFAULT_COLUMNS: CustomColumn[] = [
    { id: 'available', title: 'Available', emoji: '📋', triggersCompletion: false },
    { id: 'active', title: 'Active', emoji: '⚡', triggersCompletion: false },
    { id: 'in-progress', title: 'In Progress', emoji: '🔨', triggersCompletion: false },
    { id: 'completed', title: 'Completed', emoji: '✅', triggersCompletion: true },
];
```

### New Settings
```typescript
interface QuestBoardSettings {
    // ... existing settings
    customColumns: CustomColumn[];      // User-defined columns
    enableCustomColumns: boolean;       // Feature flag for gradual rollout
    archiveFolder: string;              // EXISTING - already in codebase at settings.ts:73
}
```

---

## Migration Strategy

**Auto-migrate on load (no file changes):**
1. When loading quest, check if `status` matches any current column ID
2. If not, check legacy enum values and map to current columns
3. If no match found, default to first column
4. Quest files keep original `status` value - no file modification
5. If user deletes a column, quests in that column auto-migrate to first column

**Legacy mapping:**
```typescript
const LEGACY_STATUS_MAP: Record<string, string> = {
    'available': 'available',
    'active': 'active',
    'in-progress': 'in-progress',
    'completed': 'completed',
};
```

**Edge cases:**
- Quest has `status: 'custom-old-column'` but user deleted that column → migrate to first column
- Quest has `status: 'completed'` but user renamed completion column → show warning modal with option to reassign
- User has no columns (impossible - settings enforces minimum 1)

---

## Security & Validation

### Input Validation

**Column ID validation** (critical for frontmatter safety):
```typescript
function validateColumnId(id: string): boolean {
    // Lowercase alphanumeric, hyphens, underscores only, 1-32 chars
    return /^[a-z0-9_-]{1,32}$/.test(id);
}
```

**Why:** Prevents frontmatter injection attacks like:
```yaml
status: evil
maliciousField: true
```

**Column validation checks:**
- ✅ ID is required and non-empty
- ✅ ID matches pattern: `^[a-z0-9_-]{1,32}$`
- ✅ ID is unique (no duplicates)
- ✅ Display name is required (max 50 chars)
- ✅ Emoji is optional (max 2 chars)
- ✅ At least 1 column exists at all times

**Archive folder validation:**
- Use existing `validateFolderPath()` from `src/utils/pathValidator.ts`
- Already implemented in settings UI at line 301-309

---

## Performance Optimizations

### 1. Memoize Column Configuration
Components shouldn't read `plugin.settings.customColumns` on every render.

**Solution:** Use `useMemo` in components:
```typescript
const columns = useMemo(
    () => columnConfigService.getColumns(),
    [plugin.settings.customColumns]
);
```

Or create a React Context:
```typescript
const ColumnConfigContext = React.createContext<CustomColumn[]>(DEFAULT_COLUMNS);
```

### 2. ColumnConfigService Caching
```typescript
export class ColumnConfigService {
    private cachedColumns: CustomColumn[] | null = null;

    getColumns(): CustomColumn[] {
        if (!this.cachedColumns) {
            this.cachedColumns = this.settings.customColumns || DEFAULT_COLUMNS;
        }
        return this.cachedColumns;
    }

    invalidateCache(): void {
        this.cachedColumns = null;
    }
}
```

---

## ColumnConfigService Architecture

Central service for all column-related logic. Provides type-safe access, validation, and completion logic.

```typescript
// src/services/ColumnConfigService.ts

import { QuestBoardSettings } from '../settings';
import { CustomColumn } from '../models/CustomColumn';

export class ColumnConfigService {
    private settings: QuestBoardSettings;
    private cachedColumns: CustomColumn[] | null = null;

    constructor(settings: QuestBoardSettings) {
        this.settings = settings;
    }

    /**
     * Get all columns (from settings or defaults)
     */
    getColumns(): CustomColumn[] {
        if (!this.cachedColumns) {
            this.cachedColumns = this.settings.customColumns || DEFAULT_COLUMNS;
        }
        return this.cachedColumns;
    }

    /**
     * Get column by ID
     */
    getColumnById(id: string): CustomColumn | undefined {
        return this.getColumns().find(c => c.id === id);
    }

    /**
     * Check if a column triggers quest completion
     */
    isCompletionColumn(columnId: string): boolean {
        const column = this.getColumnById(columnId);
        return column?.triggersCompletion ?? false;
    }

    /**
     * Get first completion column (for Complete button auto-move)
     */
    getFirstCompletionColumn(): CustomColumn | undefined {
        return this.getColumns().find(c => c.triggersCompletion);
    }

    /**
     * Get default column for new quests
     */
    getDefaultColumn(): string {
        return this.getColumns()[0]?.id || 'available';
    }

    /**
     * Validate column ID format
     */
    validateColumnId(id: string): boolean {
        return /^[a-z0-9_-]{1,32}$/.test(id);
    }

    /**
     * Check if column ID is unique
     */
    isColumnIdUnique(id: string, excludeIndex?: number): boolean {
        const columns = this.getColumns();
        return !columns.some((col, idx) =>
            col.id === id && idx !== excludeIndex
        );
    }

    /**
     * Invalidate cache (call after settings change)
     */
    invalidateCache(): void {
        this.cachedColumns = null;
    }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Settings UI & Service)
**Estimated Time:** 2-2.5 hours
**Goal:** Add settings UI and ColumnConfigService without breaking existing functionality

#### Tasks:
1. Create `CustomColumn` interface in `src/models/CustomColumn.ts`
2. Update `QuestBoardSettings` in `src/settings.ts`:
   - Add `customColumns: CustomColumn[]`
   - Add `enableCustomColumns: boolean` (default `false`)
   - Confirm `archiveFolder` exists (it does, line 73)
3. Update `DEFAULT_SETTINGS` with default columns
4. Create `ColumnConfigService` in `src/services/ColumnConfigService.ts`
5. Build settings UI in `QuestBoardSettingTab.display()`:
   - Show existing columns with edit/reorder/delete
   - Add new column form
   - Implement validation (ID format, uniqueness, min 1 column)
   - Add confirmation modal for deletion
   - Add warning box about behavior
6. Test settings UI thoroughly:
   - Add column
   - Edit column ID/name/emoji
   - Toggle `triggersCompletion`
   - Reorder with up/down arrows
   - Delete column (with confirmation if quests exist)
   - Try to delete last column (should block)
   - Try invalid column IDs (should show error)

#### Key Files Modified:
- `src/models/CustomColumn.ts` (NEW)
- `src/services/ColumnConfigService.ts` (NEW)
- `src/settings.ts` (UPDATE)

#### Testing Checklist:
- [ ] Settings UI renders correctly
- [ ] Can add new column with valid ID
- [ ] Cannot add column with invalid ID (shows error)
- [ ] Cannot add duplicate column ID (shows error)
- [ ] Can reorder columns with up/down buttons
- [ ] Can delete column (shows confirmation if quests exist)
- [ ] Cannot delete last column
- [ ] Can edit column after creation
- [ ] `triggersCompletion` checkbox works

#### Notes:
- Feature flag `enableCustomColumns` is OFF - existing functionality unchanged
- No quest files modified
- No TypeScript errors expected in this phase

---

### Phase 2: Archive Bug Fix & Quest Model Prep
**Estimated Time:** 1.5-2 hours
**Goal:** Fix archive duplicate file bug and prepare Quest model for type migration

#### Tasks:
1. Add `filePath?: string` to Quest interface (`src/models/Quest.ts`)
2. Update `QuestService.loadQuests()` to set `filePath` when loading:
   ```typescript
   // In loadQuests() after parsing quest data
   quest.filePath = file.path;
   ```
3. Update `QuestService.saveManualQuest()` to respect existing `filePath`:
   ```typescript
   // At path determination (line ~507)
   const targetPath = quest.filePath
       ?? `${baseFolder}/${subFolder}/${safeQuestId}.md`;
   ```
4. Update `QuestService.saveAIQuest()` similarly
5. Test archive bug fix:
   - Create quest
   - Archive it (move file to archive folder)
   - Toggle a task in the archived quest
   - Verify no duplicate file is created
   - Verify quest stays in archive folder

#### Key Files Modified:
- `src/models/Quest.ts` (UPDATE)
- `src/services/QuestService.ts` (UPDATE)

#### Testing Checklist:
- [ ] Existing quests load correctly
- [ ] New quests save to correct folder
- [ ] Archived quests respect archive folder
- [ ] Toggling task in archived quest doesn't create duplicate
- [ ] Quest files have correct `filePath` property in memory

#### Notes:
- This phase is independent of custom columns feature
- Fixes a critical bug in existing functionality
- No TypeScript errors expected

---

### Phase 3: Type Migration & Core Services (The Big Change)
**Estimated Time:** 2-2.5 hours
**Goal:** Change Quest.status type and fix immediate TypeScript errors

⚠️ **WARNING:** This phase will generate 80-150 TypeScript errors. Don't panic - we'll fix them systematically.

#### Tasks:
1. Change `Quest.status` type in `src/models/Quest.ts`:
   ```typescript
   // FROM:
   status: QuestStatus;

   // TO:
   status: QuestStatus | string;
   ```

2. Update `src/store/questStore.ts`:
   - Change `updateQuestStatus()` signature: `(questId: string, status: QuestStatus | string)`
   - Remove hardcoded `status === QuestStatus.COMPLETED` check
   - Replace with: `columnConfigService.isCompletionColumn(status)`
   - Update `getQuestsByStatus()` to accept `string` status

3. Update `src/utils/validator.ts`:
   - Change `VALID_STATUSES` to accept any string (remove enum check)
   - Add fallback to first column if status not found:
   ```typescript
   // If status doesn't match any column ID
   if (!columnConfigService.getColumnById(quest.status)) {
       quest.status = columnConfigService.getDefaultColumn();
   }
   ```

4. Update `src/config/questStatusConfig.ts`:
   - Add dynamic config generator:
   ```typescript
   export function getStatusConfig(
       settings: QuestBoardSettings
   ): StatusConfig[] {
       const columns = settings.customColumns || DEFAULT_COLUMNS;
       return columns.map(col => ({
           status: col.id as any,
           title: col.title,
           emoji: col.emoji || '',
           themeClass: `qb-col-${col.id}`,
       }));
   }
   ```
   - Keep existing arrays for backward compatibility (when `enableCustomColumns: false`)

5. Run `npm run build` and review TypeScript errors
6. Fix type errors in models and stores first (highest priority)
7. Fix type errors in services (second priority)

#### Key Files Modified:
- `src/models/Quest.ts` (UPDATE)
- `src/store/questStore.ts` (UPDATE)
- `src/utils/validator.ts` (UPDATE)
- `src/config/questStatusConfig.ts` (UPDATE)

#### TypeScript Error Fixing Strategy:

**Priority 1: Models & Stores**
- Quest.ts
- questStore.ts
- characterStore.ts (if affected)

**Priority 2: Core Services**
- QuestService.ts (status parsing)
- QuestActionsService.ts (will have MANY errors - fix in Phase 4)
- validator.ts

**Priority 3: Components** (defer to Phase 5-6)
- QuestCard.tsx
- FullKanban.tsx
- SidebarQuests.tsx

#### Testing Checklist:
- [ ] No TypeScript errors in models/stores
- [ ] Quest loading still works
- [ ] Quest status updates still work
- [ ] validator.ts accepts custom status strings
- [ ] `npm run build` compiles (with warnings in components OK for now)

#### Notes:
- Expect 80-150 TypeScript errors initially
- Focus on models/stores/core services only
- Component errors will be fixed in Phases 5-6
- Feature flag still OFF - existing functionality should work

---

### Phase 4: Quest Actions Service (Completion Logic)
**Estimated Time:** 1.5-2 hours
**Goal:** Update QuestActionsService to use ColumnConfigService and add new completion methods

#### Tasks:
1. Inject `ColumnConfigService` into QuestActionsService
2. Replace ALL hardcoded `QuestStatus.COMPLETED` checks with `columnConfigService.isCompletionColumn()`:
   - Line 96-98: completedDate setting
   - Line 106: Streak update trigger
   - Line 182: Power-up triggers
   - Line 256: Loot generation trigger
   - Line 413: Stamina award trigger
   - Plus 6+ other locations

3. Update `moveQuest()` signature:
   ```typescript
   export async function moveQuest(
       vault: Vault,
       questId: string,
       newStatus: string,  // Changed from QuestStatus
       options: MoveQuestOptions = {}
   ): Promise<MoveQuestResult>
   ```

4. Add `completeQuest()` method:
   ```typescript
   /**
    * Complete a quest - awards rewards and moves to completion column
    */
   export async function completeQuest(
       vault: Vault,
       questId: string,
       options: MoveQuestOptions = {}
   ): Promise<MoveQuestResult> {
       const completionColumn = columnConfigService.getFirstCompletionColumn();

       if (completionColumn) {
           // Move to completion column (triggers all rewards)
           return await moveQuest(vault, questId, completionColumn.id, options);
       } else {
           // No completion column - set completedDate and trigger rewards manually
           const quest = useQuestStore.getState().getQuestById(questId);
           if (!quest) return { success: false };

           const updatedQuest = {
               ...quest,
               completedDate: new Date().toISOString(),
           };

           // Trigger all completion rewards here
           // (streak, loot, power-ups, bounty, stamina, activity logging)

           return { success: true, quest: updatedQuest };
       }
   }
   ```

5. Add `reopenQuest()` method:
   ```typescript
   /**
    * Reopen a completed quest - clears completedDate and logs event
    */
   export async function reopenQuest(
       vault: Vault,
       questId: string
   ): Promise<{ success: boolean; quest?: Quest }> {
       const quest = useQuestStore.getState().getQuestById(questId);
       if (!quest) return { success: false };

       const updatedQuest: Quest = {
           ...quest,
           completedDate: null,
       };

       // Update store
       useQuestStore.getState().upsertQuest(updatedQuest);

       // Log reopen event (analytics)
       const character = useCharacterStore.getState().character;
       if (character) {
           useCharacterStore.getState().logActivity({
               type: 'quest_reopened',
               questId: quest.questId,
               questName: quest.title,
               timestamp: new Date().toISOString(),
           });
       }

       // Save to file
       await QuestService.saveManualQuest(vault, updatedQuest, plugin.settings);

       return { success: true, quest: updatedQuest };
   }
   ```

6. Add `archiveQuest()` method:
   ```typescript
   /**
    * Archive a quest - moves file to archive folder
    */
   export async function archiveQuest(
       vault: Vault,
       questId: string,
       archiveFolder: string
   ): Promise<{ success: boolean; quest?: Quest }> {
       const quest = useQuestStore.getState().getQuestById(questId);
       if (!quest || !quest.filePath) return { success: false };

       // Construct archive path
       const fileName = quest.filePath.split('/').pop();
       const archivePath = `${archiveFolder}/${fileName}`;

       // Ensure archive folder exists
       await ensureFolderExists(vault, archiveFolder);

       // Move file
       const file = vault.getAbstractFileByPath(quest.filePath);
       if (file instanceof TFile) {
           await vault.rename(file, archivePath);

           // Update quest filePath
           const updatedQuest = {
               ...quest,
               filePath: archivePath,
           };

           useQuestStore.getState().upsertQuest(updatedQuest);

           new Notice(`Quest archived to ${archiveFolder}`, 3000);
           return { success: true, quest: updatedQuest };
       }

       return { success: false };
   }
   ```

7. Update all services that check `QuestStatus.COMPLETED`:
   - StreakService.ts (called by QuestActionsService, shouldn't need changes)
   - PowerUpService.ts (called by QuestActionsService, shouldn't need changes)
   - BountyService.ts (called by QuestActionsService, shouldn't need changes)

#### Key Files Modified:
- `src/services/QuestActionsService.ts` (MAJOR UPDATE)
- `src/services/StreakService.ts` (minor, if needed)
- `src/services/PowerUpService.ts` (minor, if needed)

#### Testing Checklist:
- [ ] Moving quest to completion column awards rewards
- [ ] Moving quest to non-completion column doesn't award rewards
- [ ] `completeQuest()` works with and without completion column
- [ ] `reopenQuest()` clears completedDate
- [ ] `reopenQuest()` logs activity event
- [ ] `archiveQuest()` moves file to archive folder
- [ ] No TypeScript errors in QuestActionsService

#### Notes:
- This is the most complex service update
- Triple-check all hardcoded QuestStatus.COMPLETED are replaced
- Test both completion column and no completion column scenarios

---

### Phase 5: Quest Card & UI Components Part 1
**Estimated Time:** 2-2.5 hours
**Goal:** Update QuestCard with dynamic buttons and questStatusConfig

#### Tasks:
1. Update `src/config/questStatusConfig.ts`:
   - Export dynamic `getStatusConfigs(settings)` function
   - Keep static arrays for backward compatibility
   - Add backward compat helper:
   ```typescript
   export function getStatusConfig(
       status: string,
       settings: QuestBoardSettings
   ): StatusConfig | undefined {
       const configs = getStatusConfigs(settings);
       return configs.find(c => c.status === status);
   }
   ```

2. Update `src/components/QuestCard.tsx`:
   - Remove hardcoded `STATUS_TRANSITIONS` object
   - Remove hardcoded `MOVE_LABELS` object
   - Add props:
     ```typescript
     interface QuestCardProps {
         // ... existing props
         columns: CustomColumn[];           // From ColumnConfigService
         onComplete: (questId: string) => void;
         onReopen: (questId: string) => void;
         onArchive: (questId: string) => void;
     }
     ```

3. Add dynamic move buttons:
   ```typescript
   // Show move button for each column EXCEPT current
   const availableColumns = columns.filter(col => col.id !== quest.status);

   {availableColumns.map(col => (
       <button
           key={col.id}
           onClick={() => onMove(quest.questId, col.id)}
       >
           {col.emoji} {col.title}
       </button>
   ))}
   ```

4. Add Complete button (bottom of card):
   ```typescript
   {!quest.completedDate && (
       <button
           className="qb-complete-button"
           onClick={() => onComplete(quest.questId)}
       >
           ✅ Complete
       </button>
   )}
   ```

5. Add Reopen + Archive buttons (when completed):
   ```typescript
   {quest.completedDate && (
       <div className="qb-completed-actions">
           <button onClick={() => onReopen(quest.questId)}>
               🔄 Reopen
           </button>
           <button onClick={() => onArchive(quest.questId)}>
               📦 Archive
           </button>
       </div>
   )}
   ```

6. Add context menu Complete/Archive options
7. Add completed quest styling:
   ```css
   /* In src/styles/kanban.css */
   .qb-quest-card.completed {
       border: 2px solid var(--color-green);
       background: linear-gradient(
           to right,
           var(--color-green-faint),
           transparent
       );
   }
   ```

8. Update card CSS classes to apply `.completed` when `quest.completedDate` exists

#### Key Files Modified:
- `src/config/questStatusConfig.ts` (UPDATE)
- `src/components/QuestCard.tsx` (MAJOR UPDATE)
- `src/styles/kanban.css` (UPDATE - add completed styling)

#### Testing Checklist:
- [ ] Move buttons show all columns except current
- [ ] Complete button visible when quest not completed
- [ ] Complete button calls `onComplete` handler
- [ ] Reopen button visible when quest completed
- [ ] Archive button visible when quest completed
- [ ] Completed quests have green border/background
- [ ] Context menu has Complete/Archive options
- [ ] No TypeScript errors in QuestCard

#### Notes:
- QuestCard is now fully dynamic
- Handlers (onComplete, onReopen, onArchive) will be wired up in Phase 6

---

### Phase 6: Kanban Views, DnD, & Modals
**Estimated Time:** 2-2.5 hours
**Goal:** Update FullKanban, SidebarQuests, useDndQuests, and modal components

#### Tasks:
1. Update `src/components/FullKanban.tsx`:
   - Import `ColumnConfigService`
   - Memoize columns:
     ```typescript
     const columnConfigService = useMemo(
         () => new ColumnConfigService(plugin.settings),
         [plugin.settings.customColumns]
     );

     const columns = useMemo(
         () => columnConfigService.getColumns(),
         [columnConfigService]
     );
     ```

   - Update collapsed state:
     ```typescript
     const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>(
         () => Object.fromEntries(columns.map(c => [c.id, false]))
     );
     ```

   - Update column rendering to iterate `columns` instead of `KANBAN_STATUSES`

   - Update mobile view logic (line 192-198):
     ```typescript
     const isColumnVisibleOnMobile = useCallback((columnId: string, index: number): boolean => {
         if (!isMobile) return true;
         if (mobileMode === 'swipe') {
             return index === mobileColumnIndex;
         }
         return mobileVisibleColumns.includes(columnId);
     }, [isMobile, mobileMode, mobileColumnIndex, mobileVisibleColumns]);
     ```

   - Add handlers for Complete/Reopen/Archive:
     ```typescript
     const handleCompleteQuest = useCallback(async (questId: string) => {
         await completeQuest(app.vault, questId, {
             vault: app.vault,
             storageFolder: plugin.settings.storageFolder,
             enableLoot: true,
             streakMode: 'quest',
             onSaveCharacter: handleSaveCharacter,
         });
     }, [app.vault, plugin.settings, handleSaveCharacter]);

     const handleReopenQuest = useCallback(async (questId: string) => {
         await reopenQuest(app.vault, questId);
     }, [app.vault]);

     const handleArchiveQuest = useCallback(async (questId: string) => {
         await archiveQuest(app.vault, questId, plugin.settings.archiveFolder);
     }, [app.vault, plugin.settings.archiveFolder]);
     ```

   - Pass handlers to QuestCard:
     ```typescript
     <QuestCard
         // ... existing props
         columns={columns}
         onComplete={handleCompleteQuest}
         onReopen={handleReopenQuest}
         onArchive={handleArchiveQuest}
     />
     ```

2. Update `src/components/SidebarQuests.tsx`:
   - Apply same changes as FullKanban
   - Update completed count to check `completedDate`:
     ```typescript
     const completedCount = allQuests.filter(q => q.completedDate).length;
     ```

3. Update `src/hooks/useDndQuests.ts`:
   - Replace `Object.values(QuestStatus)` with column IDs:
     ```typescript
     const columnIds = columnConfigService.getColumns().map(c => c.id);
     const isDroppedOnStatus = columnIds.includes(overId as string);
     ```

4. Update `src/modals/CreateQuestModal.ts`:
   - Default status to first column:
     ```typescript
     status: columnConfigService.getDefaultColumn()
     ```

5. Update `src/modals/AIQuestGeneratorModal.ts`:
   - Dynamic status dropdown:
     ```typescript
     const columns = new ColumnConfigService(plugin.settings).getColumns();

     columns.forEach(col => {
         statusDropdown.addOption(col.id, `${col.emoji} ${col.title}`);
     });
     ```

#### Key Files Modified:
- `src/components/FullKanban.tsx` (MAJOR UPDATE)
- `src/components/SidebarQuests.tsx` (MAJOR UPDATE)
- `src/hooks/useDndQuests.ts` (UPDATE)
- `src/modals/CreateQuestModal.ts` (UPDATE)
- `src/modals/AIQuestGeneratorModal.ts` (UPDATE)

#### Testing Checklist:
- [ ] FullKanban renders dynamic columns
- [ ] SidebarQuests renders dynamic columns
- [ ] Drag-and-drop works between custom columns
- [ ] Complete button awards rewards
- [ ] Reopen button clears completedDate
- [ ] Archive button moves file to archive
- [ ] Completed count accurate (based on completedDate)
- [ ] Mobile swipe mode works with custom columns
- [ ] Create Quest modal uses first column as default
- [ ] AI Quest Generator shows custom columns
- [ ] No TypeScript errors

#### Notes:
- This phase wires up all UI components
- All handlers now functional
- Feature still behind `enableCustomColumns` flag

---

### Phase 7: Cleanup, Migration, & Testing
**Estimated Time:** 1.5-2 hours
**Goal:** Add migration helpers, enable feature flag, comprehensive testing

#### Tasks:
1. Add migration helper for deleted columns:
   ```typescript
   // src/utils/columnMigration.ts
   export function migrateQuestsFromDeletedColumn(
       questStore: QuestStore,
       deletedColumnId: string,
       targetColumnId: string
   ): number {
       const affectedQuests = questStore
           .getQuests()
           .filter(q => q.status === deletedColumnId);

       affectedQuests.forEach(quest => {
           questStore.upsertQuest({
               ...quest,
               status: targetColumnId,
           });
       });

       return affectedQuests.length;
   }
   ```

2. Hook up migration in settings delete handler:
   ```typescript
   // In QuestBoardSettingTab when deleting column
   const migratedCount = migrateQuestsFromDeletedColumn(
       useQuestStore.getState(),
       deletedColumn.id,
       this.plugin.settings.customColumns[0].id
   );

   new Notice(`${migratedCount} quests moved to first column`, 3000);
   ```

3. Add recurring quest template validation:
   ```typescript
   // In RecurringQuestService when creating instance
   const templateStatus = template.status;
   const columnExists = columnConfigService.getColumnById(templateStatus);

   if (!columnExists) {
       newInstance.status = columnConfigService.getDefaultColumn();
   }
   ```

4. Set `enableCustomColumns: true` as default in `DEFAULT_SETTINGS`

5. Comprehensive testing phase:
   - Test all CRUD operations on columns
   - Test quest creation with custom columns
   - Test quest movement between custom columns
   - Test Complete button (loot, streaks, power-ups, bounty, stamina)
   - Test Reopen button
   - Test Archive button
   - Test drag-and-drop
   - Test mobile views (swipe and checkbox modes)
   - Test legacy quest files load correctly
   - Test deleting column (quests migrate)
   - Test training mode quests with custom columns
   - Test recurring quest instances with custom columns
   - Test AI-generated quests with custom columns
   - **Test archive bug fix:** Archive quest, toggle task, verify no duplicate

6. Fix any remaining bugs discovered during testing

7. Update documentation:
   - CLAUDE.md (if needed)
   - Add notes about custom columns to Feature Roadmap

#### Key Files Modified:
- `src/utils/columnMigration.ts` (NEW)
- `src/services/RecurringQuestService.ts` (UPDATE)
- `src/settings.ts` (UPDATE - enable flag)

#### Testing Checklist:
- [ ] All column CRUD operations work
- [ ] Quest creation uses custom columns
- [ ] Quest movement between columns works
- [ ] Complete button awards all rewards (except XP)
- [ ] XP still awarded by useXPAward hook (separate system)
- [ ] Reopen button works
- [ ] Archive button works
- [ ] Drag-and-drop works
- [ ] Mobile swipe mode works
- [ ] Mobile checkbox mode works
- [ ] Legacy quest files load
- [ ] Deleting column migrates quests
- [ ] Training mode works with custom columns
- [ ] Recurring quests work with custom columns
- [ ] AI quests work with custom columns
- [ ] Archive bug is fixed
- [ ] No TypeScript errors
- [ ] `npm run build` succeeds
- [ ] `npm run deploy:production` succeeds
- [ ] Plugin loads in Obsidian without errors

#### Notes:
- This is the final phase
- Feature is now fully enabled
- Comprehensive testing is critical

---

## Complete Files List

### Files to Create (NEW):
- `src/models/CustomColumn.ts`
- `src/services/ColumnConfigService.ts`
- `src/utils/columnMigration.ts`

### Files to Modify (UPDATE):

#### Phase 1:
- `src/settings.ts`

#### Phase 2:
- `src/models/Quest.ts`
- `src/services/QuestService.ts`

#### Phase 3:
- `src/store/questStore.ts`
- `src/utils/validator.ts`
- `src/config/questStatusConfig.ts`

#### Phase 4:
- `src/services/QuestActionsService.ts`

#### Phase 5:
- `src/components/QuestCard.tsx`
- `src/styles/kanban.css`

#### Phase 6:
- `src/components/FullKanban.tsx`
- `src/components/SidebarQuests.tsx`
- `src/hooks/useDndQuests.ts`
- `src/modals/CreateQuestModal.ts`
- `src/modals/AIQuestGeneratorModal.ts`

#### Phase 7:
- `src/services/RecurringQuestService.ts`

### Files That May Need Minor Updates:
- `src/services/StreakService.ts` (if used directly by components)
- `src/services/PowerUpService.ts` (if used directly by components)
- `src/services/BountyService.ts` (if used directly by components)

---

## Verification Checklist (Final)

- [ ] Settings UI: Add/remove/reorder columns works
- [ ] Settings UI: Column ID validation works
- [ ] Settings UI: Cannot delete last column
- [ ] Settings UI: Can edit columns after creation
- [ ] Existing quests: Legacy status values load correctly
- [ ] New quests: Use custom column IDs in frontmatter
- [ ] Move buttons: Show all columns except current (pre-completion)
- [ ] Complete button: Awards loot, streaks, power-ups, bounty, stamina (NOT XP)
- [ ] Complete button: Sets `completedDate`
- [ ] Complete button: Auto-moves to completion column (if exists)
- [ ] XP system: Still works via useXPAward hook (separate from Complete button)
- [ ] Reopen button: Clears `completedDate`
- [ ] Reopen button: Logs reopen event
- [ ] Archive button: Moves file to archive folder
- [ ] Post-completion: Only Reopen + Archive buttons visible (no move buttons)
- [ ] Drag-and-drop: Works for both incomplete and completed quests
- [ ] Completed count: Based on `completedDate`, not column
- [ ] Completed styling: Green border/background on completed quests
- [ ] **Archive bug fixed**: Toggling task on archived quest doesn't create duplicate
- [ ] **UI state**: Custom columns render correctly, collapse toggles work
- [ ] **Mobile**: Swipe mode shows one column at a time
- [ ] **Mobile**: Checkbox mode shows selected columns
- [ ] **Training mode**: Works with custom columns
- [ ] **Recurring quests**: Instances use valid column IDs
- [ ] **AI quests**: Use correct status values from dropdown
- [ ] **Column deletion**: Quests migrate to first column
- [ ] **TypeScript**: No compilation errors
- [ ] **Build**: `npm run build` succeeds
- [ ] **Deploy**: Plugin loads in Obsidian without errors

---

## Rollback Plan

If issues arise:

1. **Immediate rollback:**
   - Set `enableCustomColumns: false` in settings
   - Plugin reverts to legacy QuestStatus enum behavior

2. **Partial rollback:**
   - Keep ColumnConfigService and settings UI
   - Disable dynamic columns in components

3. **Full rollback:**
   - Revert to commit before Phase 1
   - Archive bug fix can stay (independent feature)

---

## Post-Implementation Considerations

### Future Architecture Flexibility

This implementation is designed to support future enhancements:

1. **XP Integration:**
   - Currently XP awarded by `useXPAward` hook (task file watcher)
   - To integrate XP into Complete button later:
     - Add XP calculation to `completeQuest()` method
     - Check if all tasks completed OR if quest is AI-generated
     - Award `quest.completionBonus` XP with class bonus
     - Trigger level-up checks
   - **Architecture supports this with minimal changes**

2. **Granular Archiving:**
   - Currently one global archive folder
   - To support per-column or per-quest-type archiving:
     - Add `archiveFolder?: string` to `CustomColumn`
     - Update `archiveQuest()` to check column-level folder first
     - Fallback to global `settings.archiveFolder`
   - **Architecture supports this with minimal changes**

3. **Column-Specific Behaviors:**
   - Add more flags like `triggersCompletion`:
     - `hideFromMobile?: boolean`
     - `requiresConfirmation?: boolean`
     - `autoArchiveAfterDays?: number`
   - **ColumnConfigService is extensible**

4. **Multi-Completion Columns:**
   - Already supported (user can mark multiple columns with `triggersCompletion: true`)
   - Each column independently awards rewards
   - No architectural changes needed

---

## Notes

- Emoji field defaults to empty string if not set
- Minimum 1 column enforced in settings UI
- Column IDs are editable after creation
- Archive folder setting already exists (confirmed at settings.ts:73)
- Legacy `QuestStatus` enum kept for union type during migration
- Feature flag `enableCustomColumns` allows gradual rollout
- XP award system remains separate (not part of Complete button)
- Completion triggers: loot, streaks, power-ups, bounty, stamina, activity logging
- Reopen behavior: clears date, logs event, doesn't reverse rewards
- Mobile view modes (swipe/checkbox) work with custom columns
- All quests in deleted columns auto-migrate to first column

---

## Questions for Brad (Post-Implementation)

After completing all phases, review:

1. ✅ Do you want to integrate XP into the Complete button, or keep separate?
2. ✅ Do you want granular archiving (per-column), or global is sufficient?
3. ✅ Do you want to remove the `QuestStatus` enum entirely, or keep for backward compat?
4. ✅ Do you want to add more column-specific behaviors (auto-archive, mobile visibility, etc.)?
5. ✅ Should we add column templates (presets like "Sprint Board", "GTD", "Eisenhower Matrix")?

---

**Last Updated:** 2026-02-04
**Ready for Phase 1 implementation**
