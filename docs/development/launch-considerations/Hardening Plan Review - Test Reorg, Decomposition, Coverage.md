# Hardening Plan Review: Test Reorg, Decomposition & Coverage Expansion

> **Generated:** 2026-02-07 | **Scope:** Review of the three hardening phases as documented in the planning files. Identifies what's correct, what's missing, what should change, and blockers.

---

## Documents Reviewed

1. **Test Reorganization & Coverage Plan** -- Test directory restructure + new test roadmap
2. **Large File Decomposition Analysis** -- BattleService, DungeonView, ScrivenersQuillModal, settings.ts
3. **Test Coverage Matrix** -- Current coverage snapshot and priority rankings
4. **Codebase Stats** -- File size distribution and architecture metrics
5. **System Dependency Matrix** -- Service-to-service, hook-to-service, component-to-service maps

---

## Part 1: Test Directory Reorganization Review

### Verdict: APPROVED -- Clean plan, one mechanical concern

#### What's Correct

- The proposed directory structure matches the Test Coverage Matrix feature areas. Good alignment.
- The vitest config glob `test/**/*.test.ts` already handles subdirectories. **Confirmed: zero config changes needed.**
- Deleting `example.test.ts` is correct (scaffold test, no value).
- Moving the 3 markdown artifacts to `docs/archive/balance/` is correct (not tests).
- Creating empty `quest-management/` and `templates/` directories as placeholders for future tests is fine.

#### What's Missing

**Import path updates are not mentioned.** Every moved test file uses relative imports like `'../src/services/...'`. Moving into subdirectories changes these to `'../../src/services/...'`. This is mechanical and caught by TypeScript at compile time, but it's ~16 files that each need their import paths updated. Budget 15-30 minutes of fixup. The plan should call this out explicitly so it's not a surprise mid-session.

**Verification step should include a build check.** The plan says to run `npx vitest run` after moving files. Add `npm run build` first -- the build will catch broken import paths that vitest might not (vitest resolves from the test file's location, but the build resolves from `tsconfig`).

#### Risks

None beyond the import path updates. This is a safe, mechanical refactor.

---

## Part 2: Large File Decomposition Review

### Verdict: APPROVED -- Accurate analysis with amendments needed

#### What's Correct

- **Line counts are exact** for all four files. Verified independently: BattleService (1,442), DungeonView (1,380), ScrivenersQuillModal (1,204), settings.ts (1,126).
- **Decomposition boundaries are well-chosen.** The identified extraction points align with natural seams in each file.
- **Risk assessments are fair.** Low-risk extractions (sub-components, settings types) are correctly ranked above medium-risk ones (hooks, outcome service).
- **The "no consumers need to change imports" strategy** (re-exporting from the original module) is the right approach for BattleService.
- **The "don't split settings display() too aggressively" judgment** is correct. Linear UI construction code is readable as-is; splitting it into 10 files would hurt navigation.

#### What's Missing From the Analysis

The following items were found during the deep audit but are not mentioned in the decomposition doc:

**BattleService.ts:**

1. **`handleDefeat()` has two near-identical code paths (lines 1029-1047).** The `if (store.playerStats)` branch and `else` branch differ by one field (`maxHP`). The other 5 fields are copy-pasted. Should be deduplicated during extraction to `BattleOutcomeService`.

2. **Date string formatting is manually constructed 3 times** -- in `handleVictory()` (line 988), `handleDefeat()` (line 1059), and also in `dungeonStore.ts` (line 193). A shared `formatDateString()` utility would eliminate this.

3. **Status effect tick + log pattern is duplicated 3 times** -- `executePlayerTurn()` (lines 348-378), `executeMonsterTurn()` (lines 615-648), `checkBattleOutcomeWithStatusTick()` (lines 1389-1414). All three follow the exact same pattern. Should be extracted to a shared `processStatusTick()` helper.

4. **Module-level state (`saveCallback`, `levelUpCallback`, `selectedSkillId`) is never reset on plugin unload.** If the plugin is disabled and re-enabled without restarting Obsidian, stale callbacks reference destroyed objects. Decomposition is a good time to fix this by adding a `resetBattleServiceState()` function.

5. **4 unguarded `setTimeout` calls (lines 454, 850, 904, 1363)** cannot be cleared on plugin unload. These should be tracked and cleared in the new service files.

6. **`saveCallback` and `levelUpCallback` must both move with `handleVictory()`/`handleDefeat()`.** The plan mentions re-exporting from BattleService, but doesn't explicitly call out that the module-level callback state needs to move to `BattleOutcomeService` since that's where the functions that use them will live.

7. **Pre-existing circular dependency** `BattleService <-> SkillService` is handled via runtime `require()` at line 108. If `triggerLevelUpIfNeeded()` moves to `BattleOutcomeService`, the cycle moves with it. The decomposition doesn't introduce new cycles, but doesn't fix this one either.

**DungeonView.tsx:**

8. **Loot processing is duplicated between `handleInteract()` (chest opening, lines 852-874) and `handleShowLoot()` (battle victory, lines 1201-1233).** Both follow the same `for (const reward of loot) { if type === gold ... if type === gear ... }` pattern. Not mentioned in the analysis.

9. **`animateAlongPath()` continues executing after component unmount.** No AbortController or cancellation token. The async function keeps calling store mutations after the component is destroyed. Should be addressed when extracting `useDungeonMovement` hook.

10. **Door transition `setTimeout` (line 1019) doesn't set `isAnimating`.** Rapid clicks during a 200ms door transition could trigger a double room change. Should be noted as a bug to fix during hook extraction.

11. **Combat overlay uses an IIFE inside JSX (lines 1319-1342)** that calls `useBattleStore.getState()` inside the render body, bypassing React reactivity.

**ScrivenersQuillModal.ts:**

12. **Category default inconsistency between `saveTemplate()` and `createQuestFile()`.** `saveTemplate()` defaults category to `''` while `createQuestFile()` defaults to `'general'`. This is likely a bug -- a template saved without a category gets `category: ` (empty), but a quest created directly gets `category: general`. Should be fixed during the frontmatter builder extraction.

13. **`(this as any)._questNameOverride` is an undeclared class field** accessed via `any` cast in two places (lines 507, 942). Invisible to TypeScript tooling and refactoring. Should be declared as a proper class field during section builder extraction.

14. **Fire-and-forget dynamic imports with `.catch(() => {})` in 3 places** (lines 342, 605, 698). If the imports fail, autocomplete silently doesn't appear. If the modal closes before the import resolves, event listeners attach to detached DOM.

15. **19 class-level mutable fields with no single form state object.** If section builders are extracted to standalone functions, they need either a reference to the modal instance or a shared state object. The plan should specify the approach (recommendation: pass `this` as the modal reference).

**settings.ts:**

16. **`DEV_FEATURES_ENABLED` gates a subsection inside "Advanced Config" (Section 8, line 791).** If section builders are extracted, the Balance Testing UI lives inside the Advanced section but is dev-only. This complicates a clean extraction of Section 8. The plan doesn't mention this.

17. **Training Mode toggle directly mutates `this.plugin.settings.character`** then uses a dynamic import to update the Zustand store (lines 488-509). Creates an inconsistency window if the import fails.

#### Amendments to Priority Ordering

The decomposition doc proposes this order:

| Original | Refactor |
|----------|----------|
| 1st | DungeonView sub-components |
| 2nd | DungeonView monster spawn dedup |
| 3rd | BattleService -> MonsterTurnService |
| 4th | BattleService -> PlayerSkillService |
| 5th | BattleService -> BattleOutcomeService |
| 6th | ScrivenersQuill section builders |
| 7th | ScrivenersQuill frontmatter dedup |
| 8th | settings types/defaults -> settingsTypes.ts |
| 9th | Settings section builders |
| 10th | DungeonView hooks extraction |

**Recommended reordering:**

| Priority | Refactor | Rationale |
|----------|----------|-----------|
| **1st** | **settings types/defaults -> `settingsTypes.ts`** | Decouples 13+ files from the settings UI module. Highest architectural value, lowest risk. Takes 15 minutes. Was ranked 8th. |
| **2nd** | DungeonView sub-components -> own file | Zero logic changes, pure file split. |
| **3rd** | DungeonView monster spawn dedup | Fixes 3x code duplication. Do while already in the file. |
| **4th** | **BattleService -> BattleOutcomeService** | Must happen before MonsterTurn/PlayerSkill because those depend on handleVictory/handleDefeat. Also moves saveCallback/levelUpCallback to their natural home. Was ranked 5th. |
| **5th** | BattleService -> MonsterTurnService | Clean extraction after outcome service exists. |
| **6th** | BattleService -> PlayerSkillService | Already physically separated at bottom of file. |
| **7th** | ScrivenersQuill frontmatter dedup + section builders | Fix the category default bug during extraction. |
| **8th** | DungeonView hooks extraction | Medium risk, React hook dependencies need care. Address animation unmount issue here. |
| **Skip** | Settings section builders | Linear code is already readable. Splitting hurts navigation more than it helps. |

**Key ordering change:** BattleOutcomeService must be extracted before MonsterTurnService, not after. The original plan has them reversed (MonsterTurn at #3, Outcome at #5). MonsterTurn calls `handleVictory()` and `handleDefeat()`, which would live in BattleOutcomeService. If MonsterTurn is extracted first, it still needs to import those from BattleService, meaning the first extraction doesn't reduce coupling.

#### Verification Plan Amendment

The decomposition doc's verification plan is correct but should add:

1. `npm run build` after each extraction (not just `npx vitest run`)
2. Check for TypeScript errors specifically (the build may pass with warnings that indicate broken types)
3. After BattleService extraction: verify the `require('./SkillService')` circular dependency still works

---

## Part 3: Test Coverage Expansion Review

### Verdict: APPROVED with amendments

#### What's Correct

- **Session-by-session structure is realistic.** 45-90 minutes per session is achievable.
- **Testability assessment is accurate.** The easy/moderate/hard/skip categorization matches what the code actually looks like.
- **Test outlines are thorough.** The describe blocks and test counts are well-thought-out.
- **"Skip for launch" list is reasonable.** AI services, file watchers, and UI providers are correct exclusions.
- **Projected coverage table is honest.** 32% -> 65% across all sessions is realistic.
- **The mocking strategy for QuestActionsService** (mock sub-services, verify orchestration) is the right approach for a 9-dependency orchestrator.

#### What Must Be Added: "Session 0" -- Test Infrastructure

The plan jumps straight into writing tests (Session A) without addressing infrastructure gaps that will block Sessions B and D. Add a Session 0:

**Session 0 -- Test Infrastructure (30-45 min, MUST do before anything else)**

| Task | Why |
|------|-----|
| Add `afterEach` store reset to `test/setup.ts` | Zustand stores are global singletons. Without reset, state bleeds between test files. Currently not a problem because no tests touch stores, but Sessions B and D will. |
| Expand Obsidian mock with `App.workspace` | `QuestActionsService` triggers `workspace.trigger('quest-board:refresh')`. Session D tests are blocked without this. |
| Expand Obsidian mock with `Vault.delete()` | Needed for archive quest tests. |
| Expand Obsidian mock with `Vault.on()`/`Vault.off()` | Needed for FolderWatchService tests (currently "skip for launch" but good to have ready). |
| Add seeded `Math.random` helper | Combat tests use statistical assertions (30-70/100). Seeding eliminates non-determinism. |
| Add `vi.useFakeTimers()` helper pattern | Document the pattern for date-sensitive tests (Session B streak tests need this). |

Without Session 0, Session B's `StreakService` tests (which need `vi.useFakeTimers()`) and Session D's `QuestActionsService` tests (which need store resets and workspace mock) will hit immediate blockers.

#### Session A Amendments -- Pure Math Services

The outlines are solid. Add these edge cases:

**`xp-system.test.ts` additions:**
- `calculateLevel` with XP = 0 (should return level 1)
- `getXPForNextLevel` at level 41+ (tests the undocumented `1200` fallback)
- `calculateXPWithBonus` with negative `baseXP` (verifies behavior under bug conditions)
- `getXPProgressForCharacter` in training mode at max training level (boundary)
- `getCombinedClassBonus` with same class as both primary and secondary

**`stats-service.test.ts`** -- No additional cases needed. Outline is thorough.

**`column-config.test.ts` additions:**
- `getColumns()` when `customColumns` is empty array AND `enableCustomColumns: true` (returns empty -- does `getDefaultColumn()` handle this?)
- `getColumns()` returns mutable reference -- test that mutating the return value doesn't corrupt internal state (currently it DOES corrupt; this test would document the bug)
- `isCompletionColumn()` when `triggersCompletion` is `undefined` vs explicitly `false`

#### Session B Amendments -- Date Logic & Task Parsing

**`streak-service.test.ts`:**
- Outline is thorough. The `vi.useFakeTimers()` note is critical. No additional cases needed.

**`task-file-service.test.ts` additions:**
- `toggleTaskInFile` with `lineNumber = 0` (becomes `lineIndex = -1`, boundary case)
- `toggleTaskInFile` where the task text itself contains `[ ]` (e.g., `- [x] Fix the [ ] checkbox rendering`)
- `toggleTaskInFile` with uppercase `[X]` instead of lowercase `[x]`
- `readTasksWithSections` on a file with YAML frontmatter (`---` delimiters at top of file)
- `readTasksWithSections` with only H1 headers (regex `#{2,3}` only matches H2-H3)
- `getVisibleTasks` with `visibleCount = 0`
- Document in a test comment: `readTasksWithSections` uses `cachedRead()` while `readTasksFromFile` uses `read()` -- this is a known inconsistency that can cause stale data after `toggleTaskInFile`

#### Session C -- Status Effects & Smelting

No amendments. The outlines are correct and this session is correctly prioritized as "nice-to-have."

#### Session D -- PRIORITY CHANGE

The plan puts Session D (QuestActionsService, RecurringQuestService) as "post-launch hardening." **Recommend bumping QuestActionsService to pre-launch.**

Rationale:
- It's the single highest fan-out service (9 dependencies)
- It contains the most complex function in the codebase (`moveQuest` at 388 lines)
- It has zero test coverage
- It orchestrates ALL completion side-effects (XP, loot, streaks, achievements, bounties)
- Even basic smoke tests verifying orchestration order would catch regressions during decomposition

If time is tight, still do the mocking-based orchestration tests (verify correct services called in correct order), and defer the edge case tests to post-launch.

**`quest-actions.test.ts` additional cases:**
- `moveQuest` with a `questId` not in the store (returns `quest as any` -- verify it doesn't crash)
- `moveQuest` to the same status it's already in
- `completeQuest` with no completion column (verify it still awards stamina/logging even without full reward path)
- `archiveQuest` when the file has already been deleted externally
- `toggleTask` with an invalid line number (0, negative, NaN)

**`recurring-quest.test.ts`** -- No additional cases needed. Outline is solid.

#### Coverage Target Reassessment

The plan targets 32% -> 65% across all sessions. With the amendments:

| Sessions | Services Covered | Projected |
|----------|-----------------|-----------|
| After Session 0 | Infrastructure only | 32% (no change) |
| After Session A | +XPSystem, +StatsService, +ColumnConfigService | 41% (15/37) |
| After Session B | +StreakService, +TaskFileService | 46% (17/37) |
| After Session C | +StatusEffectService, +SmeltingService | 51% (19/37) |
| After Session D | +QuestActionsService, +RecurringQuestService | 57% (21/37) |

To reach the stated ~80% target in the chat message, you'd need Sessions E+ covering:
- QuestService (heavy file I/O, needs comprehensive Vault mock)
- TemplateService, FolderWatchService (Obsidian event system)
- BountyService, SetBonusService (moderate effort)
- SpriteService (easy, low priority)

Realistic pre-launch target: **~57% with Sessions 0-D.** Getting to 80% would require significant Vault mock expansion and probably 3-4 more sessions post-launch.

#### What's NOT Covered (Agreed With Plan's Exclusions)

The plan correctly excludes these and the reasoning is sound:

| Exclusion | Reason | Agree? |
|-----------|--------|--------|
| QuestService | Heavy file I/O | Yes -- needs comprehensive Vault mock (Phase 2) |
| SetBonusService | AI integration | Yes -- can test `calculateActiveSetBonuses` later |
| TemplateService / FolderWatchService | File I/O + events | Yes -- needs Vault.on/off mock |
| AI services | External API | Yes -- best tested manually |
| UI Providers | Display only | Yes -- low risk |
| Components | React rendering | Yes -- would need jsdom environment |
| Hooks | React logic | Yes -- complex setup for marginal value |
| Stores | Zustand state | Partially disagree -- `characterStore.createCharacter` contains business logic worth testing |

---

## Part 4: Cross-Cutting Concerns

### Dependencies Between the Three Phases

The three phases (reorg, decomposition, coverage) have important ordering dependencies:

```
Session 0 (test infrastructure)
    |
    v
Test Reorg (mechanical, 30 min)
    |
    v
Session A (pure math tests -- can run in parallel with decomposition)
    |
    +---> Decomposition Phase 1-3 (settingsTypes, DungeonView sub-components, monster dedup)
    |
    v
Session B (date/task tests)
    |
    +---> Decomposition Phase 4-6 (BattleService split)
    |
    v
Session C (status effects, smelting)
    |
    v
Session D (QuestActions -- benefits from having decomposition done first since the service will be more testable)
```

**Key insight:** Sessions A-C can run in parallel with decomposition phases 1-6 because they test different code. Session D benefits from decomposition being done first because `QuestActionsService` interacts with battle/loot services that will have cleaner interfaces after extraction.

### Blockers Found During Audit

| Blocker | Blocks What | Fix |
|---------|------------|-----|
| No `afterEach` store reset in setup.ts | Any test that touches Zustand stores | Session 0 |
| Obsidian mock lacks `App.workspace` | QuestActionsService tests (Session D) | Session 0 |
| Obsidian mock lacks `Vault.delete()` | Archive quest tests (Session D) | Session 0 |
| `document` mock too minimal | Any modal/DOM test | Low priority -- no modal tests planned |
| `saveCallback`/`levelUpCallback` must move with handleVictory/handleDefeat | BattleOutcomeService extraction | Address during decomposition phase 4 |
| Category default inconsistency (`''` vs `'general'`) | ScrivenersQuill frontmatter extraction | Fix during decomposition phase 7 |

### Planning Doc Gaps Summary

Items found during audit that are not mentioned in any of the five planning documents:

| Gap | Document That Should Mention It |
|-----|--------------------------------|
| Test import paths need updating when files move to subdirectories | Test Reorg Plan |
| Session 0 (test infrastructure) needs to happen before Session A | Test Reorg Plan |
| BattleOutcomeService must be extracted before MonsterTurnService | Decomposition Analysis |
| `handleDefeat()` near-identical double code path | Decomposition Analysis |
| Date formatting triplication (BattleService + dungeonStore) | Decomposition Analysis |
| Status tick triplication within BattleService | Decomposition Analysis |
| Module-level state cleanup on unload | Decomposition Analysis |
| DungeonView loot processing duplication | Decomposition Analysis |
| DungeonView animation continuation after unmount | Decomposition Analysis |
| ScrivenersQuill category default inconsistency (`''` vs `'general'`) | Decomposition Analysis |
| ScrivenersQuill `_questNameOverride` undeclared field | Decomposition Analysis |
| `DEV_FEATURES_ENABLED` complicates Section 8 extraction | Decomposition Analysis |
| `characterStore.createCharacter` business logic worth testing | Test Coverage Matrix |
| `ColumnConfigService.getColumns()` returns mutable references | Test Coverage Matrix |
| `readTasksWithSections` vs `readTasksFromFile` cache inconsistency | Test Coverage Matrix |
| `toggleTaskInFile` with uppercase `[X]`, `lineNumber = 0`, text containing `[ ]` | Test Coverage Plan |
| `calculateLevel` with XP = 0, `getXPForNextLevel` at 41+ | Test Coverage Plan |
| Realistic coverage target is ~57% pre-launch, not 80% | Test Coverage Plan |

---

## Recommended Session Order

1. **Session 0** -- Test infrastructure (30-45 min)
2. **Test Reorg** -- Move files, fix imports, verify (30 min)
3. **Session A** -- XPSystem, StatsService, ColumnConfigService tests (60-90 min)
4. **Decomposition 1-3** -- settingsTypes, DungeonView sub-components + dedup (60-90 min)
5. **Session B** -- StreakService, TaskFileService tests (60-90 min)
6. **Decomposition 4-6** -- BattleService split into 3 files (90-120 min)
7. **Session C** -- StatusEffectService, SmeltingService tests (60-90 min, nice-to-have)
8. **Decomposition 7** -- ScrivenersQuill extraction (60-90 min)
9. **Session D** -- QuestActionsService, RecurringQuestService tests (90-120 min)
