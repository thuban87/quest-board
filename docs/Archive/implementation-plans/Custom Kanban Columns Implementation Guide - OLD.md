# Custom Kanban Columns - Implementation Guide - OLD

**Status:** Ready for implementation  
**Estimated Effort:** ~7-8 hours  
**Created:** 2026-02-01  
**Last Updated:** 2026-02-01 (incorporated code review feedback)

---

## Overview

Allow users to define their own Kanban column names, emojis, and order. Completion is decoupled from columns - triggered by a Complete button, not column position.

---

## Key Design Decisions

### Columns Are Purely Organizational
- Users define column ID, title, optional emoji
- Drag-and-drop works between any columns
- No hardcoded "terminal" column concept

### Completion Is Button-Triggered
- **Complete button** → awards XP, loot, streaks, power-ups, sets `completedDate`
- If a column with `id: 'completed'` exists → quest auto-moves there
- If no "completed" column exists → quest stays in current column
- Moving between columns = just organizational, no rewards

### Button States

**Before completion:**
- Move buttons for each column (except current)
- Complete ✅ button

**After completion:**
- Reopen 🔄 button (clears `completedDate`)
- Archive 📦 button (moves file to archive folder)
- No column move buttons (drag-and-drop still works)

### Completed Quest Tracking
- Completed = quest has `completedDate` set
- Count all quests with `completedDate` regardless of folder location

---

## Data Structures

### CustomColumn
```typescript
interface CustomColumn {
  id: string;      // Internal key (stored in quest frontmatter)
  title: string;   // Display name
  emoji?: string;  // Optional, defaults to empty string
}
```

### Quest Model Update
```typescript
interface Quest {
  // ... existing fields
  status: string;           // Changed from QuestStatus enum
  filePath?: string;        // NEW: Actual file location (for archive support)
}
```

### Default Columns
```typescript
const DEFAULT_COLUMNS: CustomColumn[] = [
  { id: 'available', title: 'Available', emoji: '📋' },
  { id: 'active', title: 'Active', emoji: '⚡' },
  { id: 'in-progress', title: 'In Progress', emoji: '🔨' },
  { id: 'completed', title: 'Completed', emoji: '✅' },
];
```

### New Settings
```typescript
interface QuestBoardSettings {
  // ... existing settings
  customColumns: CustomColumn[];
  archiveFolder: string;  // e.g., "Life/Quest Board/quests/archive"
}
```

---

## Migration Strategy

**Auto-migrate on load (no file changes):**
1. When loading quest, check if `status` matches any column ID
2. If not, check legacy enum values
3. Map legacy values to corresponding column IDs
4. Quest files keep original `status` value - no file modification

```typescript
const LEGACY_STATUS_MAP: Record<string, string> = {
  'available': 'available',
  'active': 'active', 
  'in-progress': 'in-progress',
  'completed': 'completed',
};
```

---

## Critical Technical Fixes

### Fix 1: Archive Duplicate File Bug
**Location:** `src/services/QuestService.ts` → `saveManualQuest`

**Problem:** Current logic constructs file path from `quest.questType`, ignoring actual file location. Archiving a quest then toggling a task creates a duplicate file.

**Solution:** 
- Add `filePath` property to Quest interface
- Set `filePath` when loading quests
- `saveManualQuest` must check if `quest.filePath` exists and use it
- Only construct new path if creating a new quest

```typescript
// In saveManualQuest
const targetPath = quest.filePath 
  ?? `${baseFolder}/quests/${quest.questType.toLowerCase()}/${safeQuestId}.md`;
```

### Fix 2: Hardcoded UI State
**Location:** `src/components/FullKanban.tsx` & `SidebarQuests.tsx`

**Problem:** Collapsed column state is typed to `Record<QuestStatus, boolean>` with hardcoded enum keys.

**Solution:** Initialize state dynamically from settings:
```typescript
const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>(() => 
  Object.fromEntries(columns.map(c => [c.id, false]))
);
```

### Fix 3: TypeScript Scope
**Problem:** Changing `Quest.status` from enum to string causes cascading type errors.

**Solution:** Update types early in Phase 2 before building dependent features. Change component props (e.g., QuestCard) to accept `status: string` first.

---

## Implementation Phases (Revised Order)

### Phase 1: Settings & Config
1. Add `CustomColumn` interface
2. Add `customColumns` and `archiveFolder` to settings
3. Create settings UI for column management (add/remove/reorder/edit)
4. Update `questStatusConfig.ts` to read from settings
5. Export `getColumns(settings)` and `getColumnById(id, settings)` functions

### Phase 2: Quest Service Hardening
1. **Fix archive bug**: Add `filePath` property to Quest interface
2. **Update QuestService**: Set `filePath` when loading quests
3. **Update saveManualQuest**: Respect existing `filePath`, only construct new path for new quests
4. **Update types**: Change `Quest.status` from `QuestStatus` to `string`
5. **Update QuestActionsService**: Handle arbitrary status strings

### Phase 3: Quest Card & Models
1. Remove hardcoded `STATUS_TRANSITIONS` and `MOVE_LABELS` from QuestCard
2. Add `columns`, `onComplete`, `onArchive` props
3. Render move buttons dynamically (all columns except current)
4. Add Complete button (visible when not completed)
5. Add Reopen + Archive buttons (visible when completed)
6. Implement `completeQuest()`:
   - Awards XP, loot, streaks, power-ups
   - Sets `completedDate`
   - If column `id: 'completed'` exists, sets `status: 'completed'`
7. Implement `reopenQuest()` - clears `completedDate`
8. Implement `archiveQuest()` - moves file to archive folder

### Phase 4: UI State Refactor
1. **FullKanban**: Initialize `collapsedColumns` dynamically from settings
2. **SidebarQuests**: Same dynamic initialization
3. Fix all TypeScript errors regarding `QuestStatus` enum usage
4. Update completed count to check `completedDate`
5. Update AIQuestGeneratorModal dropdown to use dynamic columns

---

## Files to Modify

### Settings & Config
| File | Changes |
|------|---------|
| `settings.ts` | Add `customColumns` and `archiveFolder` settings, add UI |
| `questStatusConfig.ts` | Replace hardcoded config with `getColumns(settings)` |

### Models
| File | Changes |
|------|---------|
| `QuestStatus.ts` | Mark enum as legacy, keep for backward compatibility |
| `Quest.ts` | Change `status` to `string`, add `filePath?: string` |

### Services
| File | Changes |
|------|---------|  
| `QuestService.ts` | Set `filePath` on load, respect it in `saveManualQuest` |
| `QuestActionsService.ts` | Add `completeQuest`, `reopenQuest`, `archiveQuest`, remove completion from `moveQuestStatus` |
| `validator.ts` | Accept any string for status |

### UI Components
| File | Changes |
|------|---------|
| `QuestCard.tsx` | Dynamic buttons, Complete/Reopen/Archive logic |
| `FullKanban.tsx` | Dynamic column state, new handlers |
| `SidebarQuests.tsx` | Dynamic column state, new handlers, completed count |
| `AIQuestGeneratorModal.ts` | Dynamic status dropdown |

### AI (User Review)
| File | Changes |
|------|---------|
| `AIQuestService.ts` | **Brad will review** - may need prompt updates |

---

## Verification Checklist

- [ ] Settings UI: Add/remove/reorder columns works
- [ ] Existing quests: Legacy `status: available` maps correctly
- [ ] New quests: Use custom column IDs in frontmatter
- [ ] Move buttons: Show all columns except current (pre-completion)
- [ ] Complete button: Awards XP/loot, sets `completedDate`, auto-moves to "completed" column if exists
- [ ] Reopen button: Clears `completedDate`, restores move buttons
- [ ] Archive button: Moves file to archive folder
- [ ] Post-completion: Only Reopen + Archive buttons visible
- [ ] Drag-and-drop: Works for both incomplete and completed quests
- [ ] Completed count: Based on `completedDate`, not column
- [ ] **Archive bug fixed**: Toggling task on archived quest doesn't create duplicate
- [ ] **UI state**: Custom columns render correctly, collapse toggles work
- [ ] AI quests: Use correct status values

---

## Notes

- Emoji field defaults to empty string if not set
- Minimum 1 column required
- Column IDs are immutable once set (prevents data loss)
- Archive folder setting needs path validation
- Legacy `QuestStatus` enum kept for backward compatibility during migration
