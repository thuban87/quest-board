# Large File Decomposition Analysis

Analysis of the two largest source files to identify decomposition opportunities.

---

## File 1: `BattleService.ts` — 1,442 lines

### Current Structure

The file is organized into clearly labeled sections with `// =====` comment dividers:

| Section                          | Lines | Line Range | Description                                                                       |
| -------------------------------- | ----: | ---------- | --------------------------------------------------------------------------------- |
| Imports + callbacks              |   ~95 | L1–95      | Save/level-up callbacks set by `main.ts`                                          |
| `triggerLevelUpIfNeeded`         |   ~40 | L96–136    | Level-up detection after XP gain                                                  |
| Type conversions                 |   ~27 | L142–169   | `monsterToBattleMonster()`                                                        |
| Battle initialization            |  ~107 | L175–281   | `startRandomBattle`, `startBattleWithTemplate`, `startBattleWithMonster`          |
| `hydrateBattlePlayer`            |   ~25 | L283–308   | Creates volatile battle state from character                                      |
| `copyVolatileStatusToPersistent` |   ~17 | L310–327   | Persists status effects after battle                                              |
| **Player turn execution**        |  ~265 | L333–598   | `executePlayerTurn`, attack, defend, retreat, damage calc                         |
| **Monster turn execution**       |  ~309 | L604–913   | `executeMonsterTurn`, `executeMonsterSkill` (175 lines!), basic attack fallback   |
| **Outcome handling**             |  ~183 | L919–1101  | `checkBattleOutcome`, `handleVictory` (75 lines), `handleDefeat` (64 lines), loot |
| Utilities                        |   ~35 | L1107–1140 | `canStartRandomFight`, `consumeStaminaForFight`, `getBattleStateSummary`          |
| **Player skill execution**       |  ~280 | L1141–1420 | `executePlayerSkill` (180 lines!), `checkBattleOutcomeWithStatusTick`             |

### Key Observations

1. **Two massive functions dominate:** `executeMonsterSkill` (175 lines) and `executePlayerSkill` (180 lines) each handle damage calc, status effects, stage changes, lifesteal, multi-hit, and logging — all inline.
2. **The module-level callback pattern** (`setSaveCallback`, `setLevelUpCallback`) is a code smell but functional — refactoring would touch `main.ts` wiring.
3. **Battle init** is clean and self-contained (3 entry points with clear delegating).
4. **Player turn dispatch** (`executePlayerTurn`) is a clean switch — the individual action functions are the issue.
5. **Duplicated logic:** Monster skill effects and player skill effects both implement status effect application, stage changes, and damage logging with nearly identical patterns.

### Decomposition Proposal

#### Extract 1: `MonsterTurnService.ts` (~310 lines → new file)

Move from `BattleService.ts`:
- `executeMonsterTurn()` (L604–683)
- `executeMonsterSkill()` (L685–860)
- `executeMonsterBasicAttack()` (L862–913)

These are self-contained — they read from `battleStore`, call `calculateDamage`, update store, and call back into `handleVictory`/`handleDefeat`. The coupling is tiny:
- Imports: `handleVictory`, `handleDefeat` from BattleService (can export them)
- Imports: `calculateDamage` from CombatService (already external)
- Imports: status effect helpers from StatusEffectService (already external)

**BattleService.ts impact:** -310 lines, down to ~1,130

#### Extract 2: `PlayerSkillService.ts` (~280 lines → new file)

Move from `BattleService.ts`:
- `setSelectedSkill()`, `getSelectedSkill()`, `clearSelectedSkill()` (trivial state)
- `executePlayerSkill()` (L1187–1366)
- `checkBattleOutcomeWithStatusTick()` (L1368–1420)

This section is already physically separated at the bottom of the file with its own imports. It's essentially its own module already — just not in its own file.

**BattleService.ts impact:** -280 lines, down to ~850

#### Extract 3: `BattleOutcomeService.ts` (~185 lines → new file)

Move from `BattleService.ts`:
- `checkBattleOutcome()` (L919–936)
- `handleVictory()` (L938–1013) 
- `handleDefeat()` (L1015–1079)
- `generateVictoryLoot()` (L1081–1101)

These are the "what happens when the fight ends" functions. They touch `characterStore` heavily (XP, gold, activity logging) but don't need any other BattleService internals.

**BattleService.ts impact:** -185 lines, down to ~665

#### Summary: BattleService.ts After Decomposition

| File | Lines | Content |
|------|------:|---------|
| `BattleService.ts` | ~665 | Init, player turns (attack/defend/retreat), damage calc, utilities, callbacks |
| `MonsterTurnService.ts` | ~310 | Monster AI, skill execution, basic attack |
| `PlayerSkillService.ts` | ~280 | Player skill selection and execution |
| `BattleOutcomeService.ts` | ~185 | Victory/defeat handling, loot, XP/gold awards |

> [!TIP]
> The exported `battleService` object at the bottom of `BattleService.ts` would re-export functions from the new files, so **no consumers need to change their imports** — it's a purely internal refactor.

---

## File 2: `DungeonView.tsx` — 1,380 lines

### Current Structure

| Section | Lines | Line Range | Description |
|---------|------:|------------|-------------|
| Imports | ~25 | L1–25 | React, stores, services |
| Helper functions | ~40 | L44–83 | `getTierFromLevel`, `getPlayerSpritePath`, `getTileSpritePath` |
| `Tile` sub-component | ~128 | L104–232 | Individual dungeon tile with sprite/emoji rendering |
| `PlayerSprite` sub-component | ~30 | L248–278 | Player sprite with directional image |
| `DungeonHeader` sub-component | ~100 | L306–407 | HP/mana bars, title, action buttons |
| `RoomGrid` sub-component | ~92 | L428–520 | CSS Grid with tiles + player |
| `DpadControls` sub-component | ~56 | L535–591 | Mobile d-pad |
| **Main `DungeonView` component** | **766** | L613–1379 | State, movement, interaction, keyboard, rendering |

### Key Observations

1. **The sub-components are already well-extracted** — `Tile`, `PlayerSprite`, `DungeonHeader`, `RoomGrid`, `DpadControls` are all clean, self-contained components.
2. **The main component (766 lines) is the problem.** It mixes state management, movement logic, interaction logic, keyboard handling, combat integration, and JSX rendering.
3. **Monster spawn logic is duplicated 3 times** — in `handleDirectionalMove` (L762–792), `handleInteract` (L879–921), and `animateAlongPath` (L957–986). All three do the same thing: look up monster def, pick random template, create monster, start battle.
4. **The chest interaction** (L826–876) is ~50 lines of loot generation and notification inline in `handleInteract`.

### Decomposition Proposal

#### Extract 1: Sub-components to `DungeonSubComponents.tsx` (~410 lines → new file)

Move from `DungeonView.tsx`:
- `TileProps` interface + `Tile` component (L93–232)
- `PlayerSpriteProps` interface + `PlayerSprite` component (L237–278)
- `DungeonHeaderProps` interface + `DungeonHeader` component (L284–407)
- `RoomGridProps` interface + `RoomGrid` component (L412–520)
- `DpadControlsProps` interface + `DpadControls` component (L530–591)

These are pure presentational components with no business logic. They take props and render JSX.

**DungeonView.tsx impact:** -410 lines, down to ~970

#### Extract 2: `useDungeonInteraction.ts` hook (~200 lines → new file)

Create a custom hook that encapsulates:
- `handleInteract()` — chest opening logic, monster spawn via interact, portal handling
- `spawnMonsterAtPosition()` — the duplicated monster spawn logic (deduplicated into one function)

This eliminates the 3x duplication and moves the "what happens when you touch things" logic out of the component.

**DungeonView.tsx impact:** -200 lines, down to ~770

#### Extract 3: `useDungeonMovement.ts` hook (~200 lines → new file)

Create a custom hook that encapsulates:
- `handleDirectionalMove()` — WASD/d-pad single-step movement
- `handleRoomTransition()` — Zelda-style screen slide animation
- `animateAlongPath()` — A* pathfinding movement
- `handleTileClick()` — click-to-move with pathfinding
- Movement state: `isAnimating`, `transition`, `lastMoveTimeRef`

**DungeonView.tsx impact:** -200 lines, down to ~570

#### Extract 4: Helper functions to `dungeonHelpers.ts` (~40 lines → new file)

Move from `DungeonView.tsx`:
- `getTierFromLevel()` (L44–54)
- `getPlayerSpritePath()` (L56–69)
- `getTileSpritePath()` (L71–83)

These are pure utility functions that don't depend on React at all.

**DungeonView.tsx impact:** -40 lines, down to ~530

#### Summary: DungeonView After Decomposition

| File | Lines | Content |
|------|------:|---------|
| `DungeonView.tsx` | ~530 | Main component: state, effects, store subscriptions, JSX layout, combat overlay |
| `DungeonSubComponents.tsx` | ~410 | Tile, PlayerSprite, DungeonHeader, RoomGrid, DpadControls |
| `useDungeonMovement.ts` | ~200 | Movement, pathfinding, room transitions |
| `useDungeonInteraction.ts` | ~200 | Chest/monster/portal interactions |
| `dungeonHelpers.ts` | ~40 | Sprite path helpers |

> [!IMPORTANT]
> The main `DungeonView` component would still be ~530 lines, which is above the 300-line guideline but reasonable for a component that orchestrates an entire game view with combat overlay, exit summary, keyboard bindings, and multiple sub-component composition.

---

## Priority Recommendation

| Priority | Refactor | Effort | Risk | Payoff |
|----------|----------|--------|------|--------|
| 🥇 1st | DungeonView sub-components → own file | Low | Very Low | Removes 410 lines, zero logic changes |
| 🥈 2nd | DungeonView monster spawn dedup | Low | Low | Fixes 3x code duplication |
| 🥉 3rd | BattleService → MonsterTurnService | Medium | Low | Clean 310-line extraction |
| 4th | BattleService → PlayerSkillService | Medium | Low | Already physically separated |
| 5th | BattleService → BattleOutcomeService | Medium | Medium | Touches XP/gold/save wiring |
| 6th | DungeonView hooks extraction | Medium | Medium | React hook dependencies need care |

---

## File 3: `ScrivenersQuillModal.ts` — 1,204 lines

### Current Structure

| Section | Lines | Line Range | Description |
|---------|------:|------------|-------------|
| Imports + interface | ~25 | L1–25 | Obsidian Modal, services |
| Class fields | ~42 | L30–67 | Form state (19 fields), recurrence state, folder watch state |
| `constructor` | ~60 | L68–128 | Pre-populate form fields from existing template |
| **`onOpen()`** | **358** | L130–488 | Builds entire form UI: 6 sections + footer buttons |
| Content helpers | ~49 | L490–539 | `getQuestNameFromContent`, `setQuestNameInContent`, `getDefaultBody` |
| Recurrence helpers | ~33 | L541–574 | `getRecurrenceString`, `updateRecurrenceUI` |
| **`buildFolderWatchUI()`** | **121** | L576–700 | Folder watcher section with conditional fields |
| Placeholder helpers | ~60 | L709–769 | `detectPlaceholders`, `isAutoPlaceholder`, `updatePlaceholderChips` |
| Utility helpers | ~60 | L771–836 | `titleCase`, `loadAvailableTypes`, `getTypeEmoji`, `getEffectiveQuestType` |
| Section extraction | ~48 | L838–886 | `extractSectionsFromBody` |
| Preview | ~32 | L888–920 | `showPreview` |
| **`createQuestFile()`** | **111** | L922–1033 | Build frontmatter + body → write quest file |
| **`saveTemplate()`** | **110** | L1035–1145 | Build frontmatter + body → write template file |
| `toSlug` | ~8 | L1147–1155 | String slug helper |
| `registerFolderWatcher` | ~40 | L1157–1197 | Register with FolderWatchService |
| `onClose` | ~3 | L1199–1203 | Cleanup |

### Key Observations

1. **`onOpen()` is 358 lines of pure UI construction** — it builds 6 form sections (Identity, Configuration, XP & Rewards, Metadata, Placeholders, Body Content) plus a footer. Each section is ~40-60 lines of `new Setting(...)` calls.
2. **`saveTemplate()` and `createQuestFile()` have duplicated frontmatter-building logic** — both build frontmatter strings from the same form fields, strip existing frontmatter from body, and write files. The patterns are nearly identical.
3. **`buildFolderWatchUI()` is already extracted** as its own method but at 121 lines it's still large. It's conditionally shown for `daily-quest` and `watched-folder` template types.
4. **No external consumers** — this modal is only instantiated from `ScrollLibraryModal` and `settings.ts`. Refactoring is fully internal.

### Decomposition Proposal

#### Extract 1: Section builders to `scrivenersQuillSections.ts` (~350 lines → new file)

Break `onOpen()` into individual section-builder functions:
- `buildIdentitySection(container, modal)` (~30 lines)
- `buildConfigSection(container, modal)` (~100 lines — Template Type, Quest Type, Category, Priority, Status)
- `buildRewardsSection(container, modal)` (~30 lines)
- `buildMetadataSection(container, modal)` (~25 lines)
- `buildRecurrenceSection(container, modal)` (~60 lines — recurrence options + day selectors)
- `buildPlaceholdersSection(container, modal)` (~15 lines)
- `buildBodySection(container, modal)` (~25 lines)
- `buildFooter(container, modal)` (~25 lines)

Each takes its parent container and a reference to the modal (or just the form state). This turns `onOpen()` into a ~40-line method that creates the form container and calls each builder.

**ScrivenersQuillModal.ts impact:** -350 lines, down to ~855

#### Extract 2: Frontmatter builder to `templateFrontmatter.ts` (~80 lines → new file)

Deduplicate the shared logic between `saveTemplate()` and `createQuestFile()`:
- `buildFrontmatter(formState, options)` — generates the YAML frontmatter string
- `stripExistingFrontmatter(body)` — removes frontmatter from body content
- `resolveAutoPlaceholders(body, questName, questType)` — replaces `{{date}}`, `{{Quest Name}}`, etc.

Both methods would become ~40 lines each: validate → call builders → write file.

**ScrivenersQuillModal.ts impact:** -80 lines, down to ~775

#### Extract 3: Folder watch UI to existing `buildFolderWatchUI` (already a method, could move to separate file)

Move `buildFolderWatchUI()` + `registerFolderWatcher()` + `updateFolderWatchUI()` into `scrivenersQuillFolderWatch.ts` (~165 lines). This is optional — the method is already well-isolated.

**ScrivenersQuillModal.ts impact:** -165 lines, down to ~610

#### Summary: ScrivenersQuillModal After Decomposition

| File | Lines | Content |
|------|------:|---------|
| `ScrivenersQuillModal.ts` | ~610 | Class, constructor, onOpen (orchestrator), content/preview/slug helpers, save/create logic |
| `scrivenersQuillSections.ts` | ~350 | Individual section builder functions for the form UI |
| `templateFrontmatter.ts` | ~80 | Shared frontmatter building and placeholder resolution |
| `scrivenersQuillFolderWatch.ts` | ~165 | Folder watch UI + registration (optional extraction) |

> [!NOTE]
> Extracts 1 and 2 give the best bang for buck. Extract 3 is optional since `buildFolderWatchUI` is already factored as a method — moving it to a file only helps if the class itself needs to shrink further.

---

## File 4: `settings.ts` — 1,126 lines

### Current Structure

| Section | Lines | Line Range | Description |
|---------|------:|------------|-------------|
| Imports | ~18 | L1–18 | Obsidian, models, services |
| `UIState` interface | ~7 | L26–33 | Persisted UI state |
| `QuestBoardSettings` interface | ~87 | L38–125 | 30+ settings fields |
| `getQuestFolderPath()` | ~5 | L127–132 | Utility function |
| `DEFAULT_SETTINGS` | ~62 | L136–198 | Default values for all settings |
| **`QuestBoardSettingTab.display()`** | **900** | L224–1124 | The entire settings UI |

#### Breakdown of `display()` (900 lines, 10 sections)

| Section | Lines | Line Range | Description |
|---------|------:|------------|-------------|
| Section 1: Essential Settings | ~38 | L230–264 | Storage folder + API key |
| Section 2: File Paths (collapsible) | ~156 | L285–454 | Template, archive, dungeon, asset folders |
| Section 3: Gameplay Settings | ~68 | L455–538 | Weekly goal, training, streak, bounty |
| Section 4: Quest Management | ~62 | L540–608 | Tags, excluded folders, template/dungeon/watcher buttons |
| Section 5: Kanban Board | ~60 | L610–673 | Custom columns toggle, mobile mode |
| Section 6: Daily Notes Integration | ~68 | L675–746 | Daily note logging + path settings |
| Section 7: AI Features | ~28 | L748–774 | Skip preview toggle |
| Section 8: Advanced Config (collapsible) | ~122 | L776–963 | Balance testing, gear mapping, stat mapping, set bonus, character |
| Section 9: Danger Zone (collapsible) | ~71 | L965–1038 | Reset stats, reset all data |
| Section 10: Dev Tools (DEV only) | ~85 | L1040–1123 | AI test lab, Gemini testing, cache |

### Key Observations

1. **`display()` is 900 lines but almost entirely linear UI construction** — it builds settings sections from top to bottom with no complex logic. Each section is independent and self-contained.
2. **The sections are clearly labeled** with `// ═════` dividers, making extraction boundaries obvious.
3. **Section 2 (File Paths) is the longest at 156 lines** due to the asset delivery settings with their save handler and download modal logic (~40 lines of async logic inline).
4. **Section 8 (Advanced Config) is 122 lines** and includes the balance testing character generator UI.
5. **The data definitions (`QuestBoardSettings` + `DEFAULT_SETTINGS`) are already self-contained** at 149 lines and could live in their own file. These are imported by dozens of other files.
6. **Unlike the other files, `settings.ts` is doing exactly what it should** — it's a settings tab that builds a settings UI. The long `display()` method is an inherent pattern in Obsidian plugins. Splitting aggressively may hurt readability.

### Decomposition Proposal

#### Extract 1: Settings types + defaults to `settingsTypes.ts` (~170 lines → new file)

Move from `settings.ts`:
- `UIState` interface (L26–33)
- `QuestBoardSettings` interface (L38–125)
- `getQuestFolderPath` function (L127–132)
- `DEFAULT_SETTINGS` constant (L136–198)
- Re-exports for `Achievement`, `CustomColumn`

These are imported by 30+ files across the codebase. Separating them means changes to the settings UI don't force every consumer to re-parse the entire 1,100-line file.

**settings.ts impact:** -170 lines, down to ~955

#### Extract 2: Section builders to `settingsSections.ts` (~500 lines → new file)

Extract the 5 longest sections from `display()` as standalone builder functions:
- `buildFilePathsSection(containerEl, plugin)` — Section 2 (~156 lines)
- `buildAdvancedSection(containerEl, plugin)` — Section 8 (~122 lines)
- `buildDangerZoneSection(containerEl, plugin)` — Section 9 (~71 lines)
- `buildDailyNotesSection(containerEl, plugin)` — Section 6 (~68 lines)
- `buildGameplaySection(containerEl, plugin)` — Section 3 (~68 lines)

These are pure UI builders — they take the container element and plugin reference, create settings UI, and return nothing.

**settings.ts impact:** -500 lines, down to ~455

#### Extract 3: Dev Tools section to `settingsDevTools.ts` (~85 lines → new file)

Move Section 10 (Dev Tools) to its own file since it's guarded behind `DEV_FEATURES_ENABLED` and is only ever shown in development builds.

**settings.ts impact:** -85 lines, down to ~370

#### Summary: settings.ts After Decomposition

| File | Lines | Content |
|------|------:|---------|
| `settingsTypes.ts` | ~170 | Settings interface, defaults, type exports |
| `settings.ts` | ~370 | `QuestBoardSettingTab` class with `display()` calling section builders |
| `settingsSections.ts` | ~500 | Section builder functions for File Paths, Gameplay, Daily Notes, Advanced, Danger Zone |
| `settingsDevTools.ts` | ~85 | Dev-only tools section (balance testing, AI test lab, cache controls) |

> [!IMPORTANT]
> Extract 1 (types/defaults) provides the biggest **architectural** improvement — it decouples the settings data model from the settings UI, which benefits 30+ importing files. Extracts 2 and 3 are primarily about readability — the pattern is inherently linear so splitting too aggressively can make it harder to follow the settings flow.

---

## Full Priority Recommendation (All 4 Files)

| Priority | Refactor | Effort | Risk | Payoff |
|----------|----------|--------|------|--------|
| 🥇 1st | DungeonView sub-components → own file | Low | Very Low | -410 lines, zero logic changes |
| 🥈 2nd | DungeonView monster spawn dedup | Low | Low | Fixes 3x code duplication |
| 🥉 3rd | settings types/defaults → `settingsTypes.ts` | Low | Low | Decouples 30+ importers from UI code |
| 4th | BattleService → MonsterTurnService | Medium | Low | Clean -310 line extraction |
| 5th | BattleService → PlayerSkillService | Medium | Low | Already physically separated |
| 6th | ScrivenersQuill section builders | Medium | Low | -350 lines, pure UI extraction |
| 7th | ScrivenersQuill frontmatter dedup | Low | Low | Removes duplicated frontmatter logic |
| 8th | BattleService → BattleOutcomeService | Medium | Medium | Touches XP/gold/save wiring |
| 9th | Settings section builders | Medium | Low | Readability gain but linear code is already clear |
| 10th | DungeonView hooks extraction | Medium | Medium | React hook dependencies need care |

## Verification Plan

Since all are pure refactors (no behavior changes), verification is:

1. **Build check:** `npm run build` must compile clean after each extraction
2. **Existing tests:** Run `npx vitest run` to ensure all 17 test files pass
3. **Manual testing:** Deploy to test vault via `npm run deploy:test`, then:
   - Start a random battle, use attack/defend/skill/retreat
   - Enter a dungeon, walk around with WASD and click-to-move
   - Open chest, fight dungeon monster, reach boss
   - Verify mobile d-pad works
   - Open Scrivener's Quill, create a template, use it to create a quest
   - Open Settings, verify all 10 sections render correctly
   - Toggle Dev Tools features (if DEV_FEATURES_ENABLED)
