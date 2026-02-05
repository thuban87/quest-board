# Custom Kanban Columns - Comprehensive Test Checklist

**Date:** 2026-02-05  
**Tester:** Brad  
**Environment:** Test Vault (`C:\Quest-Board-Test-Vault`)

> **Instructions:** Reload Obsidian after deployment, then work through each section. Mark items as ✅ pass, ❌ fail, or ⚠️ partial.

---

## Pre-Test Setup

- [x] Reload Obsidian test vault ✅ 2026-02-05
- [x] Open Quest Board sidebar view ✅ 2026-02-05
- [x] Open Quest Board full-page Kanban (via command or ribbon) ✅ 2026-02-05
- [x] Verify no console errors on load (if debug logging enabled) ✅ 2026-02-05

---

## 1. Column Manager UI (Settings)

### Access
- [x] Open Settings → Quest Board → Kanban Columns section visible ✅ 2026-02-05
- [ ] "Enable Custom Kanban Columns" toggle is ON by default
- [x] Click "Open Column Manager" button opens modal ✅ 2026-02-05

### View Columns
- [x] Modal shows all 4 default columns: Available, Active, In Progress, Completed ✅ 2026-02-05
- [x] Each column shows emoji, title, and ID ✅ 2026-02-05
- [x] "Completed" column shows "✔ triggers completion" badge ✅ 2026-02-05

### Add Column
- [x] Click "+ Add Column" button at bottom ✅ 2026-02-05
- [x] New row appears with empty form fields ✅ 2026-02-05
- [x] Enter new column: ID=`testing`, Title=`Testing`, Emoji=`🧪` ✅ 2026-02-05
- [x] Click Save (✓) button ✅ 2026-02-05
- [x] Column appears in list ✅ 2026-02-05
- [x] Notice shows "Column added" ✅ 2026-02-05

### Edit Column
- [x] Click Edit (✏️) on an existing column ✅ 2026-02-05
- [x] Form fields become editable ✅ 2026-02-05
- [x] Change title from "Active" to "Working On" ✅ 2026-02-05
- [x] Click Save (✓) button ✅ 2026-02-05
- [x] Title updates in list ✅ 2026-02-05
- [x] Notice shows "Column updated" ✅ 2026-02-05

### Reorder Columns (Drag & Drop)
- [x] Drag "Testing" column to position 2 (after Available) ✅ 2026-02-05
- [x] Drop target indicator shows during drag ✅ 2026-02-05
- [x] Column order updates after drop ✅ 2026-02-05
- [x] Order persists after closing and reopening modal ✅ 2026-02-05

### Delete Column
- [x] Click Delete (🗑️) on "Testing" column ✅ 2026-02-05
- [x] Confirmation dialog appears with warning about quest migration ✅ 2026-02-05
- [x] Click OK to confirm ✅ 2026-02-05
- [x] Column removed from list ✅ 2026-02-05
- [x] Notice shows deletion (and migration count if applicable) ✅ 2026-02-05

### Reset to Defaults
- [x] Click "Reset to Defaults" button ✅ 2026-02-05
- [x] Confirmation dialog appears ✅ 2026-02-05
- [x] Click OK ✅ 2026-02-05
- [x] All 4 default columns restored ✅ 2026-02-05
- [ ] Custom columns removed

### Validation Errors
- [x] Try to add column with empty ID → error shown ✅ 2026-02-05
- [x] Try to add column with invalid ID (spaces, special chars) → error shown ✅ 2026-02-05
- [x] Try to add duplicate ID → error shown ✅ 2026-02-05
- [ ] Try to delete last remaining column → error shown

### Save & Close
- [x] Click "Save & Close" button ✅ 2026-02-05
- [x] Modal closes ✅ 2026-02-05
- [x] Settings persist after closing settings tab ✅ 2026-02-05

---

## 2. Kanban Views with Custom Columns

### Full-Page Kanban
- [x] Open full-page Kanban view ✅ 2026-02-05
- [x] All custom columns display as column headers ✅ 2026-02-05
- [x] Column titles match what was set in Column Manager ✅ 2026-02-05
- [x] Column emojis display correctly ✅ 2026-02-05
- [x] Quests appear in their correct columns ✅ 2026-02-05

### Sidebar View
- [x] Open sidebar view ✅ 2026-02-05
- [x] All non-completion columns display as sections ✅ 2026-02-05
- [x] Completion column(s) NOT shown in sidebar (by design) ✅ 2026-02-05
- [x] Quests appear in correct sections ✅ 2026-02-05

### Add Custom Column Mid-Session
- [x] Add a new column "Review" (ID: `review`, Emoji: 📝) via settings ✅ 2026-02-05
- [x] Return to Kanban views ✅ 2026-02-05
- [x] New "Review" column appears in full-page Kanban ✅ 2026-02-05
	- [ ] Required app reload
- [x] New "Review" section appears in sidebar ✅ 2026-02-05

---

## 3. Quest Movement Between Columns

### Using Move Buttons
- [x] Click on a quest card to expand it ✅ 2026-02-05
- [x] Move buttons appear for each column (except current) ✅ 2026-02-05
- [x] Click move button to move quest to another column ✅ 2026-02-05
- [x] Quest immediately moves to target column ✅ 2026-02-05
- [x] Quest file frontmatter updated (check in file explorer) ✅ 2026-02-05

### Using Drag & Drop
- [x] Drag a quest from one column to another ✅ 2026-02-05
- [x] Drop target column highlights ✅ 2026-02-05
- [x] Quest moves to new column on drop ✅ 2026-02-05
- [x] Quest file frontmatter updated ✅ 2026-02-05

### Move to Custom Column
- [x] Create a custom column if not already done ✅ 2026-02-05
- [x] Move a quest TO the custom column ✅ 2026-02-05
- [x] Quest appears in custom column ✅ 2026-02-05
- [x] Quest file shows custom column ID in `status:` field ✅ 2026-02-05

### Move FROM Custom Column
- [x] Move a quest FROM a custom column to a default column ✅ 2026-02-05
- [x] Quest appears in target column ✅ 2026-02-05
- [x] Quest file updated correctly ✅ 2026-02-05

---

## 4. Complete/Reopen/Archive Buttons

### Complete Quest
- [x] Find an incomplete quest (no green styling) ✅ 2026-02-05
- [x] Expand card → "✅ Complete" button visible ✅ 2026-02-05
- [x] Click Complete button ✅ 2026-02-05
- [x] Quest gets green completed styling ✅ 2026-02-05
- [x] Quest moves to completion column (if one exists) ✅ 2026-02-05
- [ ] `completedDate` field set in quest file
	- [ ] Did not update frontmatter here
- [ ] XP awarded (check character sheet or notification)
	- [ ] XP not rewarded on completion status change, that happens on task completion
- [x] Stamina awarded ✅ 2026-02-05
- [x] Streak updated (if applicable) ✅ 2026-02-05
- [x] Loot drop triggered (if applicable) ✅ 2026-02-05

### Reopen Quest
- [x] Find a completed quest (green styling) ✅ 2026-02-05
- [x] Expand card → "↩️ Reopen" button visible ✅ 2026-02-05
- [x] Click Reopen button ✅ 2026-02-05
- [x] Quest loses completed styling ✅ 2026-02-05
- [x] Quest moves to first non-completion column ✅ 2026-02-05
- [ ] `completedDate` field cleared in quest file

### Archive Quest
- [x] Find a completed quest ✅ 2026-02-05
- [x] Expand card → "📦 Archive" button visible ✅ 2026-02-05
- [x] Click Archive button ✅ 2026-02-05
- [x] Quest disappears from Kanban immediately ✅ 2026-02-05
- [x] Quest file moved to archive folder (check file explorer) ✅ 2026-02-05
- [ ] Quest file path includes YYYY-MM subfolder
	- [ ] Not sure what this one means really. It's supposed to go tot he default archive folder unless the user changes that in settings. They can move it to the appropriate calendar folder from there themselves

### Context Menu Actions
- [x] Right-click on incomplete quest → "Complete" option available ✅ 2026-02-05
- [x] Right-click on completed quest → "Reopen" and "Archive" options available ✅ 2026-02-05
- [x] Context menu actions work correctly ✅ 2026-02-05

---

## 5. Column Deletion Migration

### Setup
- [x] Create a custom column "Temporary" (ID: `temporary`) ✅ 2026-02-05
- [x] Move 2-3 quests into the "Temporary" column ✅ 2026-02-05
- [x] Note the quest names for verification ✅ 2026-02-05

### Delete Column
- [x] Open Column Manager ✅ 2026-02-05
- [x] Delete the "Temporary" column ✅ 2026-02-05
- [x] Confirm deletion ✅ 2026-02-05

### Verify Migration
- [x] Notice shows: "Column deleted. X quest(s) moved to [first column]" ✅ 2026-02-05
- [x] Quests now appear in first column (e.g., "Available") ✅ 2026-02-05
- [x] Quest file frontmatter updated (status changed from `temporary` to `available`) ✅ 2026-02-05
- [x] No quests lost ✅ 2026-02-05

---

## 6. Quest Creation with Custom Columns

### Create Quest Modal
- [x] Open Create Quest modal (Ctrl+Shift+Q or command) ✅ 2026-02-05
- [ ] Status dropdown shows all custom columns
	- [ ] There is no status dropdown currently. This will need to be fixed
- [ ] Default selection is first column
- [ ] Create quest with default status
- [x] Quest appears in correct column ✅ 2026-02-05
	- [ ] Tested a basic quest creation, confirmed it went to the first column
- [ ] Quest file has correct status

### Create Quest in Custom Column
- [ ] Open Create Quest modal
- [ ] Select a custom column from dropdown
- [ ] Create quest
- [ ] Quest appears in selected custom column
- [ ] Quest file has custom column ID as status

### AI Quest Generator (if enabled)
- [x] Open AI Quest Generator modal ✅ 2026-02-05
- [x] Status dropdown shows all custom columns with emoji + title ✅ 2026-02-05
- [x] Generate quest with custom column selected ✅ 2026-02-05
- [x] Quest appears in correct column ✅ 2026-02-05

---

## 7. Recurring Quests

### Generate New Instance
- [x] Ensure a recurring quest template exists ✅ 2026-02-05
- [x] Trigger recurring quest processing (or wait for scheduled run) ✅ 2026-02-05
- [x] New instance created with correct default column status ✅ 2026-02-05
- [x] Quest file shows first column ID (not hardcoded "available") ✅ 2026-02-05
	- [ ] Didn't change the first column so wasn't quite able to test this but the frontmatter did change to available as expected

### Archive Completed Recurring
- [x] Complete a recurring quest instance ✅ 2026-02-05
- [ ] Verify quest has `completedDate` set
	- [ ] This is still not working for any quests I complete
- [ ] Trigger archive process (or wait for scheduled run)
- [ ] Completed recurring quests archived correctly
- [ ] Archive check uses `completedDate`, not status string

---

## 8. Legacy Quest File Loading

### Load Old Quest Files
- [x] Ensure some quest files have old `status: available` format ✅ 2026-02-05
- [x] Reload plugin ✅ 2026-02-05
- [x] Legacy quests load correctly ✅ 2026-02-05
- [x] Quests appear in correct columns (ID mapping works) ✅ 2026-02-05

### Mixed Status Formats
- [x] Quest with `status: active` loads correctly ✅ 2026-02-05
- [x] Quest with `status: completed` loads correctly ✅ 2026-02-05
- [x] Quest with custom column ID loads correctly ✅ 2026-02-05

---

## 9. Mobile Views (if testing on mobile)

### Swipe Mode
- [x] Swipe mode shows all custom columns ✅ 2026-02-05
- [x] Swipe between columns works ✅ 2026-02-05
- [x] Quest cards display correctly ✅ 2026-02-05

### Checkbox Mode
- [x] Checkbox mode groups by custom columns ✅ 2026-02-05
- [ ] Completing via checkbox works

### Mobile fixes needed:
- [ ] See screenshot attached to message, formatting/styling of modals on mobile requires some work. This is a problem across all modals on mobile (they're all a little too big and extend off the right of the screen), but the column manager has a specific problem which is the column section of the modal isn't responsive as is. So as you can see, I can see the top two columns but I can't scroll down within that top section to see the remaining columns. This section should always be expanded as much as it needs to be to show all of its content, I don't want it to be a preview like screen



---

## 10. Edge Cases & Error Handling

### Invalid Status in Quest File
- [x] Manually edit a quest file with invalid status (e.g., `status: nonexistent`) ✅ 2026-02-05
- [x] Reload plugin ✅ 2026-02-05
- [ ] Quest loads without error
	- [ ] Quest disappeared from board entirely
- [ ] Quest appears in default/first column (fallback behavior)
	- [ ] Disappeared entirely

### Empty Column Config
- [ ] (Cannot test easily - minimum 1 column enforced)

### Rapid Operations
- [x] Quickly move multiple quests between columns ✅ 2026-02-05
- [x] No errors, all moves complete correctly ✅ 2026-02-05

---

## 11. Build & Deploy Verification

- [x] `npm run build` succeeds with 0 errors ✅ 2026-02-05
- [x] `npm run deploy:test` succeeds ✅ 2026-02-05
- [x] Plugin loads without console errors ✅ 2026-02-05
- [ ] All features work after fresh plugin load

---

## Test Results Summary

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Column Manager UI | | | |
| Kanban Views | | | |
| Quest Movement | | | |
| Complete/Reopen/Archive | | | |
| Column Deletion Migration | | | |
| Quest Creation | | | |
| Recurring Quests | | | |
| Legacy Loading | | | |
| Mobile Views | | | |
| Edge Cases | | | |
| Build & Deploy | | | |

**Overall Status:** [ ] Ready for Production / [ ] Needs Fixes

---

## Bugs Found

| # | Description | Severity | Status |
|---|-------------|----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## Notes

_Add any observations, performance notes, or suggestions here._
