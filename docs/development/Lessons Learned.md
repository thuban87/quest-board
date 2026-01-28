# Quest Board - Lessons Learned

A running log of architectural mistakes, anti-patterns, and lessons learned during development. This document serves as a guide for future plugin development and interview preparation.

---

## 1. File Watcher "Reload Everything" Anti-Pattern

**What went wrong:**  
The file watcher in `useQuestLoader.ts` triggers a full reload of ALL quests whenever ANY file changes in the quest folder. This is O(N) for N quests, causing unnecessary disk I/O and potential UI lag.

**Root cause:**  
Initial implementation focused on "get it working" rather than "get it right." Reloading everything was simpler than tracking which specific file changed.

**Impact:**  
- With 50 quests, one checkbox click could trigger 51 file reads
- Performance degrades linearly with vault size
- File watcher thrashing during rapid edits

**Correct approach:**  
- File watcher should identify which specific file changed
- Only reload/update that specific quest
- Maintain a reverse lookup (taskFilePath → questIds[]) for linked task files
- Use surgical store updates (`updateQuest`, `removeQuest`) instead of `setQuests(all)`

**Lesson:**  
*Always design I/O operations for granularity. Full reloads are fine for <10 items, but anything that could grow needs targeted updates.*

---

## 2. Timer-Based Race Condition Handling

**What went wrong:**  
Used a `saveLockRef` with `setTimeout(..., 1500)` to prevent file watcher from reloading a file immediately after we saved it. This is a brittle hack.

**Root cause:**  
Needed a quick fix to stop infinite loops (save → watcher fires → reload → potential re-save). Didn't invest time in a proper solution.

**Impact:**  
- If file operation takes >1500ms (large vaults, sync tools), the lock expires early
- Race conditions become hard to debug
- Behavior is unpredictable under load

**Correct approach:**  
- Use a Set of "pending save" quest IDs instead of a boolean
- Track by questId, not globally
- Watcher checks if questId is in pending set before reloading
- Remove from set only after save completes (not on a timer)

**Lesson:**  
*Never use timers to solve race conditions. Use explicit state tracking (sets, queues, flags) that reflect the actual operation lifecycle.*

---

## 3. Logic Duplication Across View Components

**What went wrong:**  
`SidebarQuests.tsx` and `FullKanban.tsx` evolved independently with ~150 lines of duplicated logic: XP calculation, save callbacks, DnD wrappers, collapse state, status configs.

**Root cause:**  
Copy-pasted code when creating the second view instead of refactoring shared logic into hooks/utilities first.

**Impact:**  
- Bugs fixed in one component but not the other
- Streak not saving (callback missing in one component)
- Quest status reverting (save lock not passed correctly)
- Maintenance burden multiplied

**Correct approach:**  
- Create shared hooks (`useSaveCharacter`, `useDndQuests`, `useCollapsedItems`) BEFORE duplicating
- Create shared configs (`questStatusConfig.ts`) for data that both views need
- View components should only contain layout/rendering logic

**Lesson:**  
*When creating a second view/component that shares logic with the first, refactor the shared logic into hooks FIRST, then build the new view.*

---

## 4. Business Logic Embedded in View Components

**What went wrong:**  
Sprite path resolution logic (checking for `animated.gif` vs `south.png`) was inline inside `SidebarQuests.tsx` render function.

**Root cause:**  
Quick implementation without thinking about reusability.

**Impact:**  
- Can't reuse sprite path logic in other views
- Render function cluttered with non-rendering code
- Testing sprite logic requires rendering the component

**Correct approach:**  
- Create `useCharacterSprite(character, spriteFolder, vault)` hook
- Hook handles all path resolution logic
- View components just call the hook and render the result

**Lesson:**  
*If logic isn't directly related to rendering JSX, extract it into a hook or utility function.*

---

## 5. Missing Input Sanitization on File Paths

**What went wrong:**  
`QuestService.saveManualQuest` constructs file paths using `questId` without sanitization. A malicious questId could theoretically cause path traversal.

**Root cause:**  
Assumed Obsidian's API would handle it. Trusted user input implicitly.

**Impact:**  
- Potential security vulnerability (though Obsidian's API mitigates most risks)
- Bad practice that could cause issues if code is reused elsewhere

**Correct approach:**  
- Always sanitize IDs before using them in file paths
- Strip or replace non-alphanumeric characters (except `-` and `_`)
- Validate path is within expected folder before file operations

**Lesson:**  
*Never use user input directly in file paths. Sanitize first, even if the underlying API seems to handle it.*

---

## General Principles Extracted

1. **I/O Granularity:** Design file operations to affect only what changed, not everything.
2. **State Over Timers:** Use explicit state tracking for race conditions, not timers.
3. **Extract Before Duplicate:** Refactor shared logic before copying between components.
4. **Hooks for Logic:** Keep view components focused on rendering; extract logic to hooks.
5. **Sanitize Everything:** Never trust user input in file paths, SQL, or DOM insertion.
6. **Fix Now, Not Later:** Technical debt compounds. If you know something is wrong, fix it before building on top of it.

---

**Last Updated:** 2026-01-21
