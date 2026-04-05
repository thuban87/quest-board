# Quest Board - Development Guidelines

Instructions for AI assistants working on this project.

**Version:** 2.0.0  
**Last Updated:** 2026-04-05

---

## Project Context

**Developer:** Brad Wales (ADHD, visual learner, prefers vibe coding)  
**Purpose:** Gamified task tracker with RPG mechanics for ADHD brain  
**Tech Stack:** TypeScript, React, Obsidian API, esbuild, Zustand, Vitest  
**Release:** Personal use (potential public release later)

**Environments:**
- **Dev:** `C:\Users\bwales\projects\obsidian-plugins\quest-board`
- **Test:** `C:\Quest-Board-Test-Vault\.obsidian\plugins\quest-board`
- **Staging:** `C:\Quest-Board-Staging-Vault\Staging Vault\.obsidian\plugins\quest-board`
- **Production:** `G:\My Drive\IT\Obsidian Vault\My Notebooks\.obsidian\plugins\quest-board`

**"The Brad Protocol":** Micro-steps, explain why, celebrate wins. Brad has ADHD — keep explanations visual and incremental.

---

## Git Workflow (CRITICAL)

**Brad handles ALL git commands.** AI assistants should:
- ✅ Read: `git status`, `git log`, `git diff`
- ❌ **NEVER run:** `git add`, `git commit`, `git push`, `git pull`, `git merge`, `git rebase`
- ✅ Provide commit messages at session wrap-up for Brad to copy/paste

**Commit message format** (no quotation marks anywhere):
```
feat/fix/refactor/test/docs(scope): short summary

- Bullet point details
- Another change
```

---

## Development Session Workflow

1. **Review & Discuss** - Clarify requirements, check Feature Roadmap v2
2. **Do the Work** - Write code in dev environment only
3. **Test** - `npm run build`, fix errors, rebuild until passing
4. **Deploy** - `npm run deploy:test` (copies to test vault)
5. **Wait for Confirmation** - Brad tests in test Obsidian vault — **HARD STOP, do not proceed**
6. **Wrap Up** - Update Session Log, Feature Roadmap, provide commit message

### Workflow Gates (HARD STOPS)
- After build passes → immediately run `npm run deploy:test`
- After deploying → **STOP** and notify Brad to test. Do NOT proceed until Brad confirms.
- Never deploy to production without explicit Brad request

---

## Build System

### NPM Scripts
```bash
npm run build           # Full pipeline: CSS → manifest → type-check → esbuild prod
npm run dev             # esbuild watch mode (development)
npm run css:build       # Build CSS once
npm run css:watch       # Watch CSS for changes
npm run test            # Vitest interactive mode
npm run test:run        # Vitest headless
npm run deploy:test     # Build + copy to test vault
npm run deploy:staging  # Build + copy to staging vault
npm run deploy:production # Build + copy to production vault
```

### Build Pipeline
- **TypeScript:** Strict mode, ES6 target, React JSX, path alias `@/*` → `src/*`
- **esbuild:** Entry `main.ts` → `main.js` (CommonJS). Externals: obsidian, electron, @codemirror/*, @lezer/*. Minified in prod, source maps in dev.
- **PostCSS:** `postcss-import` bundles `src/styles/index.css` → root `styles.css`

### Running Tests Reliably
Vitest output can be truncated in terminals. For full output:
```bash
npx vitest run 2>&1 | tee test-output.txt
tail -20 test-output.txt
```
- `test-output.txt` is gitignored
- Use file viewer for full output when debugging failures
- Clean up: `rm test-output.txt`

---

## Core Principles

### Speed Over Perfection
- Quest capture MUST be <30 seconds
- Smart defaults (today's date, medium priority, etc.)

### Dopamine-Driven Design
- Small wins frequently (XP gains, animations)
- Celebrate milestones (confetti, level-ups)
- Visual character progression

### Generic, Not Specific
- User-defined categories (no hardcoded types)
- Flexible for any quest type (work, fitness, chores, etc.)

### Visual First
- Progress MUST be visible at a glance
- Progress bars, XP bars, sprite animations
- Class-based color theming

---

## Architecture (OOP - Non-Negotiable!)

**Principles:**
- **Separation of Concerns:** Models, Services, Components, Hooks, Utils
- **Single Responsibility:** Each class/function does ONE thing
- **No Monolithic Files:** Split if exceeding ~300 lines (see Large File Guidelines below)
- **JSDoc Everything:** Public methods get documentation

### File Structure

```
quest-board/
├── main.ts                     # Entry point (registers commands, initializes services)
├── manifest.json               # Plugin manifest
├── styles.css                  # GENERATED - do not edit directly!
├── postcss.config.cjs          # PostCSS configuration
├── esbuild.config.mjs          # Build configuration
├── vitest.config.ts            # Test configuration
├── src/
│   ├── styles/                 # CSS MODULES (edit these!) — 16 files
│   │   ├── index.css               # Entry point - imports all modules
│   │   ├── variables.css           # CSS custom properties
│   │   ├── all-styles.css          # Combined reference
│   │   ├── kanban.css              # Kanban board columns/cards
│   │   ├── character.css           # Character sheet, gear slots
│   │   ├── modals.css              # Modal base styles, forms
│   │   ├── sidebar.css             # Sidebar view, tabs, sections
│   │   ├── fullpage.css            # Full-page kanban view
│   │   ├── power-ups.css           # Power-ups, achievements, recurring
│   │   ├── inventory.css           # Inventory, gear, blacksmith, tooltips
│   │   ├── combat.css              # Combat UI, battle view, store
│   │   ├── dungeons.css            # Dungeon view, tiles, D-pad
│   │   ├── animations.css          # Keyframes and animations
│   │   ├── mobile.css              # Mobile-specific styles
│   │   ├── progress.css            # Progress dashboard
│   │   └── scrivener.css           # Template system modals
│   │
│   ├── components/             # React UI components — 11 + 12 character sub-components
│   │   ├── FullKanban.tsx          # Full-page Kanban board
│   │   ├── SidebarQuests.tsx       # Sidebar view
│   │   ├── QuestCard.tsx           # Individual quest card
│   │   ├── CharacterPage.tsx       # Full-page character sheet
│   │   ├── CharacterSidebar.tsx    # Sidebar character display
│   │   ├── DungeonView.tsx         # Dungeon exploration view
│   │   ├── BattleView.tsx          # Combat battle view
│   │   ├── FilterBar.tsx           # Quest filter/search bar
│   │   ├── DnDWrappers.tsx         # Drag-and-drop components
│   │   ├── AchievementsSidebar.tsx # Achievements display
│   │   ├── CharacterCreationModal.tsx # Character creation UI
│   │   └── character/              # Character sub-components
│   │       ├── ActionMenu.tsx, AttributeGrid.tsx, CharacterIdentity.tsx
│   │       ├── CharacterStats.tsx, ClassPerkCard.tsx, CombatStatsGrid.tsx
│   │       ├── ConsumablesBelt.tsx, EquipmentGrid.tsx, EquipmentPaperdoll.tsx
│   │       ├── ResourceBars.tsx, SetBonuses.tsx, StreakDisplay.tsx
│   │
│   ├── models/                 # Data structures — 14 files
│   │   ├── Quest.ts, QuestStatus.ts, CustomColumn.ts
│   │   ├── Character.ts           # Character, classes, schema v7
│   │   ├── Gear.ts, Monster.ts, Dungeon.ts
│   │   ├── Achievement.ts, Consumable.ts, Bounty.ts
│   │   ├── Skill.ts, StatusEffect.ts, Title.ts
│   │   └── index.ts
│   │
│   ├── services/               # Business logic — 41 files
│   │   ├── QuestService.ts             # Quest loading/saving
│   │   ├── QuestActionsService.ts      # Move/complete/archive quests
│   │   ├── TaskFileService.ts          # Linked task file sync
│   │   ├── ColumnConfigService.ts      # Dynamic kanban columns
│   │   ├── RecurringQuestService.ts    # Recurring quest generation
│   │   ├── TemplateService.ts          # Quest template parsing
│   │   ├── TemplateStatsService.ts     # Template usage tracking
│   │   ├── FolderWatchService.ts       # Watched folder quest generation
│   │   ├── DailyNoteService.ts         # Daily note integration
│   │   ├── XPSystem.ts                 # XP/level calculations (5-tier)
│   │   ├── StatsService.ts             # Stat calculations with gear
│   │   ├── CombatService.ts            # Combat stats derivation
│   │   ├── BattleService.ts            # Battle turn execution
│   │   ├── MonsterService.ts           # Monster creation/scaling
│   │   ├── SkillService.ts             # Skill system management
│   │   ├── StatusEffectService.ts      # Combat status effects
│   │   ├── LootGenerationService.ts    # Gear/consumable drops
│   │   ├── SetBonusService.ts          # AI-powered set bonuses
│   │   ├── SmeltingService.ts          # Gear smelting system
│   │   ├── BountyService.ts            # Combat bounty system
│   │   ├── PowerUpService.ts           # Buffs and power-ups (18 triggers)
│   │   ├── BuffStatusProvider.ts       # Active buff display
│   │   ├── StreakService.ts            # Daily streak tracking
│   │   ├── AchievementService.ts       # Achievement unlocks
│   │   ├── ProgressStatsService.ts     # Activity history/stats
│   │   ├── SpriteService.ts            # Sprite path resolution
│   │   ├── StatusBarService.ts         # Status bar management
│   │   ├── RecoveryTimerService.ts     # Death penalty timer
│   │   ├── RecoveryTimerStatusProvider.ts # Timer status display
│   │   ├── DungeonMapService.ts        # Dungeon map generation
│   │   ├── UserDungeonLoader.ts        # Custom dungeon loading
│   │   ├── AIDungeonService.ts         # AI dungeon generation
│   │   ├── AIQuestService.ts           # AI quest generation
│   │   ├── AssetService.ts             # Remote asset delivery
│   │   ├── AccessoryEffectService.ts   # Accessory stat effects
│   │   ├── ConsumableUsageService.ts   # Consumable item usage
│   │   ├── CharacterExportService.ts   # Progress export/reports
│   │   ├── TitleService.ts             # Title system
│   │   ├── BalanceTestingService.ts    # Combat balance testing
│   │   ├── TestCharacterGenerator.ts   # Test character creation
│   │   └── index.ts
│   │
│   ├── hooks/                  # React hooks — 11 files
│   │   ├── useQuestLoader.ts       # Quest loading + file watching
│   │   ├── useQuestActions.ts      # Move/toggle quest actions
│   │   ├── useXPAward.ts           # XP award on task completion
│   │   ├── useSaveCharacter.ts     # Character persistence
│   │   ├── useDndQuests.ts         # Drag-and-drop logic
│   │   ├── useCollapsedItems.ts    # Collapse state management
│   │   ├── useFilteredQuests.ts    # Filter/search logic
│   │   ├── useResourceRegen.ts     # Mana/stamina regeneration
│   │   ├── useCharacterSprite.ts   # Sprite cache invalidation
│   │   ├── useDungeonBonuses.ts    # Dungeon AI bonus cache
│   │   └── index.ts
│   │
│   ├── modals/                 # Obsidian modals — 43 files
│   │   ├── CreateQuestModal.ts, AIQuestGeneratorModal.ts, AIQuestPreviewModal.ts
│   │   ├── QuestBoardCommandMenu.ts, ColumnManagerModal.ts
│   │   ├── ScrollLibraryModal.ts, ScrivenersQuillModal.ts, SmartTemplateModal.ts
│   │   ├── CharacterCreationModal.ts, LevelUpModal.ts
│   │   ├── InventoryModal.ts, InventoryManagementModal.ts
│   │   ├── BlacksmithModal.ts, StoreModal.ts
│   │   ├── BountyModal.ts, BountyReviveModal.ts
│   │   ├── AchievementHubModal.ts, AchievementUnlockModal.ts, CreateAchievementModal.ts
│   │   ├── RecurringQuestsDashboardModal.ts, ProgressDashboardModal.ts
│   │   ├── RecoveryOptionsModal.ts, PaidRestModal.ts
│   │   ├── DungeonSelectionModal.ts, DungeonMapModal.ts, DungeonDeathModal.ts
│   │   ├── AIDungeonWizardModal.ts, EliteEncounterModal.ts
│   │   ├── LootModal.ts, SkillLoadoutModal.ts
│   │   ├── JobHuntModal.ts, TrainingIntroModal.ts, WelcomeModal.ts
│   │   ├── WatchedFolderManagerModal.ts, GearSlotMappingModal.ts, StatMappingsModal.ts
│   │   ├── AssetConfigModal.ts, AssetDownloadModal.ts
│   │   ├── ConfirmModal.ts            # Replacement for browser confirm()
│   │   ├── CreateQuestFromFileModal.ts, TemplatePreviewModal.ts
│   │   ├── TitleSelectionModal.ts      # Title equip/preview
│   │   └── AITestLabModal.ts           # AI testing (dev only)
│   │
│   ├── store/                  # Zustand state stores — 8 files
│   │   ├── questStore.ts           # Quest state (Map-based)
│   │   ├── characterStore.ts       # Character state (schema v7)
│   │   ├── battleStore.ts          # Combat state machine
│   │   ├── dungeonStore.ts         # Dungeon exploration state
│   │   ├── filterStore.ts          # Filter/search state
│   │   ├── taskSectionsStore.ts    # Task section parsing
│   │   ├── uiStore.ts              # UI state management
│   │   └── index.ts
│   │
│   ├── config/                 # Configuration
│   │   └── combatConfig.ts         # Combat balance constants (DEV_FEATURES_ENABLED flag)
│   │
│   ├── data/                   # Static data registries — 9 files
│   │   ├── monsters.ts             # 19 base + 20 boss monsters
│   │   ├── monsterSkills.ts        # Monster signature skills
│   │   ├── TileRegistry.ts         # Dungeon tile definitions
│   │   ├── achievements.ts         # Default achievements
│   │   ├── starterGear.ts          # Starting equipment
│   │   ├── skills.ts               # Player skill definitions
│   │   ├── titles.ts               # Title definitions + buffs
│   │   ├── accessories.ts          # Accessory gear items
│   │   └── uniqueItems.ts          # Unique/boss drops
│   │
│   ├── utils/                  # Pure functions — 14 files
│   │   ├── validator.ts            # Quest validation
│   │   ├── safeJson.ts             # Safe JSON parsing (prototype pollution protection)
│   │   ├── sanitizer.ts            # DOMPurify HTML/text sanitization
│   │   ├── pathValidator.ts        # Path validation
│   │   ├── pathfinding.ts          # A* dungeon pathfinding
│   │   ├── timeFormatters.ts       # Time display helpers
│   │   ├── gearFormatters.ts       # Gear tooltip creation
│   │   ├── skillFormatters.ts      # Skill display formatting
│   │   ├── columnMigration.ts      # Column deletion migration
│   │   ├── dailyNotesDetector.ts   # Daily Notes folder detection
│   │   ├── platform.ts             # Platform detection helpers
│   │   ├── FileSuggest.ts          # File path autocomplete
│   │   ├── FolderSuggest.ts        # Folder path autocomplete
│   │   └── index.ts
│   │
│   ├── views/                  # Obsidian ItemView wrappers — 7 files
│   │   ├── QuestBoardView.tsx      # Full-page Kanban (quest-board)
│   │   ├── QuestSidebarView.tsx    # Right pane sidebar (quest-sidebar)
│   │   ├── BattleItemView.tsx      # Battle tab (battle-view)
│   │   ├── DungeonItemView.tsx     # Dungeon tab (dungeon-view)
│   │   ├── CharacterView.tsx       # Character tab (character-page)
│   │   ├── constants.ts            # View type constants
│   │   └── index.ts
│   │
│   └── settings.ts             # Settings interface + UI (~130 fields, 10 sections)
│
├── docs/
│   ├── development/                # Active development docs
│   │   ├── Feature Roadmap v2.md       # Current priorities
│   │   ├── Phase 4 Implementation Session Log.md  # Catch-all session log
│   │   ├── Title System Implementation Plan.md
│   │   ├── Title System Session Log.md
│   │   └── planned-features/           # Future feature specs
│   └── archive/                    # Historical docs
│       └── session-logs/               # Past feature session logs
│
└── test/                       # Vitest unit tests — 18 files
    ├── mocks/obsidian.ts           # Comprehensive Obsidian API mock
    ├── achievements.test.ts
    ├── power-up-effects.test.ts
    ├── power-up-triggers.test.ts
    ├── progress-stats.test.ts
    ├── activity-logging.test.ts
    ├── battle.test.ts
    ├── monster.test.ts
    ├── boss-loot-table.test.ts
    ├── pathfinding.test.ts
    ├── skill-definitions.test.ts
    ├── accessories-data.test.ts
    ├── accessory-drops.test.ts
    ├── accessory-effect-service.test.ts
    ├── accessory-integration.test.ts
    ├── asset-service.test.ts
    ├── asset-download-modal.test.ts
    ├── dungeon-registry.test.ts
    └── example.test.ts
```

### Layer Responsibilities

| Layer | Should | Should NOT |
|-------|--------|------------|
| **main.ts** | Register commands, initialize services, handle lifecycle | Contain business logic |
| **Components** | Render UI, handle user interactions, call hooks/services | Read/write files, manage global state directly |
| **Hooks** | Encapsulate reusable React logic, compose services | Be too specific to one component |
| **Services** | Business logic, file I/O, state coordination | Render UI, manipulate DOM |
| **Stores** | Zustand state for React rendering (NOT source of truth) | Replace plugin.settings for persistence |
| **Utils** | Pure functions, data transformations | Manage state, make assumptions about context |
| **Models** | Interfaces, constants, types, schema versions | Contain logic |
| **Data** | Static registries (monsters, skills, titles, etc.) | Contain mutable state |

### Large File Guidelines

Target max: ~300 lines. Known large files that are candidates for decomposition:
- **BattleService.ts** (~1,442 lines) — could split into MonsterTurnService, PlayerSkillService, BattleOutcomeService
- **DungeonView.tsx** (~1,380 lines) — sub-components can be extracted
- **ScrivenersQuillModal.ts** (~1,204 lines) — section builders can be extracted
- **settings.ts** (~1,126 lines) — acceptable (linear UI construction is inherent to settings panels)

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Services | PascalCase + `Service` suffix | `QuestService.ts` |
| Components | PascalCase, `.tsx` | `CharacterSheet.tsx` |
| Modals | PascalCase + `Modal` suffix | `CreateQuestModal.ts` |
| Hooks | camelCase + `use` prefix | `useQuestLoader.ts` |
| Stores | camelCase + `Store` suffix | `characterStore.ts` |
| Models/Types | PascalCase | `Character.ts` |
| CSS files | kebab-case, by feature | `kanban.css` |
| Data registries | camelCase or PascalCase | `monsters.ts`, `TileRegistry.ts` |
| IDs (quest, title, etc.) | kebab-case strings | `'the-novice'`, `'fortune-favored'` |
| Timestamps | ISO 8601 strings | `createdDate`, `completedDate` |
| Logging | `console.log('[ServiceName] message')` | `console.log('[TitleService] granted')` |

---

## State Management & Data Flow

### Data Storage Strategy

| Data Type | Storage | Why |
|-----------|---------|-----|
| **Character, achievements, inventory, titles, settings** | `loadData()`/`saveData()` | Safe from user deletion, syncs with plugin |
| **Quest files** | `Quest Board/quests/` (markdown with YAML frontmatter) | User-editable, human-readable |

**Quest files are source of truth.** Zustand store is a cache for React rendering.

### State Sync Pattern
```
User action → Update Zustand store (in-memory) → Save to plugin.settings → saveData()
```
- Character/inventory loaded from `plugin.settings` on startup
- Changed in Zustand store for React reactivity
- Persisted back via `useSaveCharacter` hook → `plugin.settings` → `saveData()`

### Service Callback Pattern
Services accept `setSaveCallback()` for cross-concern persistence:
```typescript
battleService.setSaveCallback(async () => await plugin.saveSettings());
battleService.setLevelUpCallback(async (char) => { /* level-up flow */ });
```

### Store Initialization Pattern (Prevents Race Conditions)
```typescript
const initRef = useRef(false);
useEffect(() => {
  if (!initRef.current) {
    initRef.current = true;
    const character = plugin.settings.character;
    if (character) characterStore.loadFromSettings(character);
  }
}, []);
```
Used in: SidebarQuests.tsx, FullKanban.tsx, CharacterPage.tsx

### Delayed Initialization
main.ts uses `setTimeout` for vault readiness:
- **2000ms:** Recurring quests, folder watchers
- **2500ms:** User dungeons, set bonus folder sync
- **Reason:** Obsidian vault not fully indexed on plugin load

---

## Key Systems Reference

### Custom Kanban Columns

User-defined kanban columns via `ColumnConfigService`:
- **Default columns:** Available → Active → In Progress → Completed
- **Custom columns:** Users can add/edit/delete/reorder
- **Completion detection:** Columns with `triggersCompletion: true` mark quests complete
- **Migration:** Deleting a column migrates quests to first column
- **Status resolution:** Invalid statuses fall back to first column via `ColumnConfigService.resolveStatus()`

**Key files:** `ColumnConfigService.ts`, `ColumnManagerModal.ts`, `columnMigration.ts`

### XP & Level System

5-tier progression (Levels 1-40):
- Tier 1 (L1-8): Acolyte, +60 XP/level
- Tier 2 (L9-16): Squire, +100 XP/level
- Tier 3 (L17-24): Knight, +160 XP/level
- Tier 4 (L25-32): Champion, +220 XP/level
- Tier 5 (L33-40): Divine Avatar, +320 XP/level
- Training mode: 10 levels (Roman numerals I-X), 100 XP/level (separate pool)
- Design goal: ~9-12 months to reach L40 at daily play

### Skills System

Pokemon Gen 1 style skills using mana:
- **Skill types:** Damage, heal, buff, debuff, special
- **Skill loadout:** 4 equipped skills per character
- **Monster skills:** 20 signature boss skills with multi-hit/heal mechanics

### Title System

Cosmetic prestige titles with optional passive buffs:
- **Titles:** Defined in `src/data/titles.ts`, keyed by ID
- **Buff titles:** Inject as passive `ActivePowerUp` entries when equipped
- **Integration:** Achievements can grant titles; `TitleService` auto-equips on first unlock
- **Equip flow:** Remove old title power-ups → set equipped → add new title power-ups

**Key files:** `Title.ts`, `TitleService.ts`, `titles.ts`, `TitleSelectionModal.ts`

### Power-Up System

- **18 triggers:** quest_complete, bounty_victory, early_riser, etc.
- **Collision policies:** `refresh`, `stack`, `extend`, `ignore`, `stack_refresh`
- **Daily cooldowns:** `triggerCooldowns` map prevents same trigger firing twice/day
- **Flow:** Trigger → cooldown check → grant with collision handling → apply stats → display in status bar

### Achievement Pipeline

1. **Trigger:** Level-up, quest count, streak, gold earned, etc.
2. **Check:** `AchievementService.check*()` scans character/activityHistory
3. **Grant:** Unlock achievement, optionally grant title
4. **Persist:** `Character.unlockedTitles` + `equippedTitle` saved to plugin data

### Character Classes

7 classes with 15% XP bonus for matching category + unique perk:

| Class | Focus | Perk |
|-------|-------|------|
| Warrior | Admin/completion | Rage: +5% XP on multi-completions |
| Paladin | Health + Social | Shield: Streak protection (weekly) |
| Technomancer | Dev/creative | Overclock: Reduced cooldowns |
| Scholar | Academic/study | Focus: Bonus XP for long sessions |
| Rogue | Efficiency | Quick Strike: Bonus for fast completions |
| Cleric | Wellness | Restoration: Enhanced rest bonuses |
| Bard | Social | Inspiration: Team bonuses |

### Combat System

- 7 class combat configs with distinct attack styles (physical, magic, hybrid)
- Per-class level modifiers for fine-tuning
- Casual-friendly design (50%+ win rate floor)
- 9 gear slots (head, chest, legs, boots, weapon, shield, 3 accessories)
- Stamina system with daily caps

---

## Character Schema & Migrations

### Schema Version History
- **Current:** v7 (added `equippedTitle`, `unlockedTitles`, `lifetimeStats`, `triggerCooldowns`)
- **Migration chain:** v1 → v2 → v3 → v4 → v5 → v6 → v7 (linear, in `Character.ts`)
- **Backfill pattern:** v7 migration scans `activityHistory` to populate `lifetimeStats`

### Migration Pattern
```typescript
function migrateV6toV7(character: Character): Character {
  if (character.schemaVersion >= 7) return character;
  // Do migration...
  character.schemaVersion = 7;
  return character;
}
```

> **Known quirk:** Early-return guards must use `>=` to the TARGET version to allow chaining. A bug where guards used `>= sourceVersion` was fixed in Title System Phase 0.

### Activity History Cap
`MAX_ACTIVITY_HISTORY = 1000` entries (defined in `Character.ts`)

---

## CSS Modularization (IMPORTANT!)

> **The root `styles.css` is GENERATED. Do not edit it directly!**

CSS is modular. All styles live in `src/styles/` and are bundled at build time via PostCSS.

### CSS Build Commands
```bash
npm run css:build    # Build CSS once
npm run css:watch    # Watch for changes
npm run build        # Full build (includes CSS)
```

### Which Module to Edit?

| Task | Module |
|------|--------|
| CSS custom properties | `variables.css` |
| Kanban board layout | `kanban.css` |
| Modal styles | `modals.css` |
| Combat/battle | `combat.css` |
| Dungeon/exploration | `dungeons.css` |
| Character sheet | `character.css` |
| Inventory/tooltips | `inventory.css` |
| Template system | `scrivener.css` |
| Progress dashboard | `progress.css` |
| Power-ups/buffs | `power-ups.css` |
| Sidebar view | `sidebar.css` |
| Full-page view | `fullpage.css` |
| Mobile fixes | `mobile.css` |
| New animations | `animations.css` |

### CSS Namespacing (Obsidian Compliance)
All CSS selectors and `@keyframes` MUST use the `qb-` prefix to avoid conflicts with other plugins.

---

## Security

### Input Sanitization (`src/utils/sanitizer.ts`)
- **DOMPurify** with two modes:
  - `sanitizeHtml()`: Allows safe formatting tags (b, i, em, strong, p, br, ul, ol, li)
  - `sanitizeText()`: Strips ALL HTML (for titles, names, categories)
- **Max lengths** (DoS prevention): questTitle: 200, questDescription: 5000, characterName: 50, tag: 50

### Prototype Pollution Protection (`src/utils/safeJson.ts`)
- Filters `__proto__`, `constructor`, `prototype` keys via JSON.parse reviver
- Always use `safeJsonParse()` for untrusted JSON input

### Path Validation
- `sanitizeQuestId()` prevents path traversal: strips `..`, slashes, allows only alphanumeric/dash/underscore
- Fallback: `'quest-' + Date.now()` if sanitized is empty

### Asset Security (`src/services/AssetService.ts`)
- Path traversal protection (reject `..`, leading `/`)
- Content-Type validation (image/* or octet-stream only)
- File extension allowlist (.png, .gif, .jpg, .jpeg, .webp)
- Size guards: manifest < 1MB, files < 2MB

### API Key Handling
- Gemini API key stored in Obsidian plugin settings (encrypted by Obsidian sync)
- No hardcoded keys or defaults
- Never commit keys to vault files

---

## Obsidian Plugin Guidelines (Community Compliance)

These rules are BLOCKERS for public release:

### Security [BLOCKER]
- ❌ No `innerHTML` — use `createEl()`/`appendText()` DOM API
- ❌ No `eval()` or `Function()` constructor
- ❌ No embedded API keys or obfuscated code
- ❌ No browser `confirm()` — use `ConfirmModal` class (`src/modals/ConfirmModal.ts`)

### Network & External Requests
- ❌ No `fetch()` — use Obsidian's `requestUrl()` for all HTTP
- All network activity must be disclosed in README

### Obsidian API Rules
- ✅ Use `vault.process()` / `processFrontMatter()` for atomic file edits (NOT `vault.modify()`)
- ✅ All `vault.on()` calls must use `plugin.registerEvent()` for auto-cleanup on unload
- ✅ Settings headers via `Setting.setHeading()` (NOT `createEl('h*')`)
- ✅ No runtime `require('obsidian')` — all imports must be top-level
- ✅ Clean up all resources on `onunload()` — unmount React roots, clear intervals, deregister events

### Commands
- Don't include plugin ID in command IDs
- No default hotkeys

### Code Quality
- No `console.log` in production (only for debugging during dev)
- Handle all promises (no fire-and-forget)
- Minimize use of `any` type

### UI & Styling
- No inline styles — use CSS classes
- Use Obsidian CSS variables where possible
- All custom classes prefixed with `qb-`
- Use sentence case for UI text

### Mobile Compatibility
- No Node.js or Electron APIs in mobile code paths
- No regex lookbehind (unsupported on iOS)
- Touch targets minimum 44x44px

### React-Specific
- Use production React bundle
- Use `createRoot()` not `ReactDOM.render()`
- No CSS-in-JS libraries
- Unmount React roots in `onClose()`

### Release Requirements
- Attach compiled assets to GitHub releases (main.js, manifest.json, styles.css)
- Exact version tags (no `v` prefix in manifest)
- Maintain `versions.json` for BRAT compatibility
- LICENSE file (MIT)

---

## Performance Patterns

### Rendering
- Zustand selectors prevent unnecessary re-renders
- `useMemo`/`useCallback` in components to prevent child re-renders
- Modals destroy on close (not hidden)
- DnD uses @dnd-kit with optimized tree

### Loading
- Character/settings loaded in `onload()` via `loadData()`
- Quests lazy-loaded on first Kanban view open (not all at startup)
- Dungeon rooms loaded on-demand
- Sprites lazily loaded via `SpriteService` (CDN with local cache fallback)
- Remote assets cached to vault folder (not re-downloaded per load)

### Global Singletons (useXPAward pattern)
```typescript
const globalTaskSnapshots = new Map<string, TaskSnapshot>();
const globalFileWatchers = new Map<string, () => void>();
```
Prevents duplicate file watchers when multiple components use the same hook.

---

## Known Tech Debt

### Major (Blocks Scaling)
1. **File watcher reloads everything** — `useQuestLoader.ts` reloads ALL quests on ANY file change (O(N)). Fix: use targeted `updateQuest`/`removeQuest` for specific file changes.
2. **Timer-based race condition** — `saveLockRef` with `setTimeout(1500ms)` to prevent watcher re-triggering after save. If file op takes >1.5s, lock expires early. Fix: use explicit `Set<questId>` for pending saves, remove only after completion.
3. **Quest management untested** — QuestActionsService, QuestService, TaskFileService have 0 unit tests (highest-risk code in codebase).

### Minor
1. **Duplicate quest on file creation** — appears briefly until app reload (pre-existing)
2. **Horizontal scroll on Kanban** — when all columns expanded (CSS)
3. **Production test values** — must revert before production deploy (see Testing Values table)
4. **Module-level callbacks** — BattleService's `setSaveCallback`/`setLevelUpCallback` pattern works but couples concerns

### Known Flaky Test
- `monster.test.ts` — random tier multiplier sampling occasionally fails due to statistical variance

---

## Testing

### Infrastructure
- **Vitest** with jsdom environment
- **Obsidian mock:** `test/mocks/obsidian.ts` (App, Vault, FileManager, RequestUrlParam, etc.)
- **React testing:** @testing-library/react + jsdom for component integration tests
- **Coverage:** v8 provider

### Testing Patterns
- Features tested AFTER implementation (not TDD)
- Pure function tests (math, formatting)
- Service tests with mocked stores/vault/API
- Statistical tests for randomness (50-100 iterations)
- Regression suite run after each phase

### Test Coverage Status
- **18 test files**, ~994 total tests
- **Well-tested:** Achievement, Battle, Combat, Loot, Power-Ups, Dungeon, Accessories, Assets
- **Not tested:** Quest management (0%), Templates (0%), UI components (0%)

### Testing Values to Verify Before Production

| Setting | Test Value | Production | Location |
|---------|-----------|------------|----------|
| Daily Stamina Cap | 500 | 50 | `CombatService.ts` |
| Bounty Slider Max | 100% | 20% | `settings.ts` |
| Set Piece Drop Rate | 40% | 33% | `LootGenerationService.ts` |

---

## Brainstorming & Planning Standards

When creating implementation plans for new features:

### Implementation Plan Structure (Required Sections)
1. **Title & Metadata** — status, effort, dates, link to session log
2. **Table of Contents** with anchor links
3. **Overview / Problem Statement** — problem, background, goals, non-goals
4. **Key Design Decisions** — reasoning, tradeoffs
5. **Implementation Phases** — 1-2 hours each, session-sized
   - Phase number, title, estimated time
   - Goal, prerequisites, task list with specific files, testing section
6. **Plan Summary** — table with effort levels, execution order, total sessions
7. **Testing Phases (The 50/50 Rule)** — every build phase paired with testing phase
   - Phase numbering: Phase 2 (build) → Phase 2.5 (test)
   - Coverage target: ≥80% line AND ≥80% branch
8. **Verification Plan / Checklist**
9. **File Change Summary** — table: phase, file, action (NEW/MODIFY/DELETE), purpose

### Recommended Sections
- Architecture / Data Structures
- Migration Strategy
- Security & Validation
- Performance Considerations
- Rollback Plan
- Design Decision Log
- Session Handoff / Next Session Prompt

### Planning Rules
- Phase sizing: 1-2 hours each
- Dependency mapping explicit
- Tech debt tracked (#### Tech Debt: section)
- Research codebase before designing
- Non-goals stated explicitly
- Companion session log created with first plan
- Review Obsidian plugin guidelines before presenting plan

---

## Session Wrap-Up Procedure

Run **after testing has been completed and confirmed by Brad:**

1. **Review changes** — `git status`, `git diff --stat` (read-only only!)
2. **Update Session Log** — date, what done, files changed, test results, issues discovered
3. **Update Feature Roadmap** — reflect completed work, status changes, new items
4. **Update Implementation Plan** — mark phases as completed
5. **Provide commit message** — descriptive, NO quotation marks
6. **Note bugs/issues** — list anything needing future attention

### Session Log Format
- Date & Focus
- Completed items checklist
- Files Changed (key files with NEW/MODIFIED/DELETED notation)
- Testing Notes (build status, test pass/fail, manual verification)
- Blockers/Issues
- Next Steps

---

## Documentation Conventions

- GitHub-style markdown, proper heading hierarchy
- Use callout blocks: `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`, `> [!NOTE]`, `> [!TIP]`
- Code blocks with language tags
- Tables for structured comparisons
- Relative paths in prose, absolute in code examples

---

## Current Feature Status

### Completed (Phase 1-4+)

**Quest System:** Kanban board, custom columns, quest creation, AI generation (Gemini), templates ("Scrivener's Desk"), folder watcher, daily notes, recurring quests, drag-and-drop

**Character System:** 7 classes, XP (5-tier L1-40), training mode, character sheet, progress dashboard, title system

**Combat System:** Turn-based battles, skills (Pokemon Gen 1), 19 base + 20 boss monsters, status effects, stamina, death penalty/recovery

**Gear & Loot:** 9 slots, 6 tiers, class restrictions, set bonuses (AI-generated), smelting, accessories with special effects, WoW-style tooltips

**Dungeons:** Full exploration UI, 4 tilesets, boss encounters, custom dungeons, AI dungeon generation

**Power-Ups & Achievements:** 18 triggers, 32+ achievements, streak tracking, title rewards

**Title System:** Cosmetic + buff titles, achievement-linked unlocks, passive power-up injection

**Settings & UI:** 10-section settings panel, mobile optimization, auto-attack, remote asset delivery

**Progress & Export:** Activity history, progress dashboard, report generator

### Phase 5: Future

- Party system (2-4 characters)
- Quest dependencies (skill trees)
- Dual-class unlock at L25
- Class change modal
- Tier sprite choices

---

## Historical Bugs & Lessons Learned

These are documented to prevent regressions:

1. **Spread operator order matters** — `...parsed` at END of object overwrites resolved values with raw. Put spread at BEGINNING.
2. **File watcher needs settings** — `loadSingleQuest` must receive `settings` parameter for custom column resolution.
3. **completedDate clearing** — pass `null` directly to `updateFrontmatterFields`; REMOVE the line when null (not set to "null").
4. **Double path prefix** — `SpriteService.getBasePath()` must not prepend `/assets/` when `assetFolder` already IS the assets dir.
5. **FolderSuggest autocomplete** — DOM value set directly doesn't fire `onChange`. Added `getCurrentPath()` to read DOM input at save time.
6. **Electron HTTP cache** — add `?t=${Date.now()}` query param to bypass cache for CDN assets.
7. **Power-up daily cooldown** — triggers like `early_riser` must check `hasFiredToday()` to prevent firing on every qualifying quest.
8. **Schema migration chaining** — early-return guard must use `>= targetVersion` to allow forward chaining.
9. **isCompleted check** — use `!!quest.completedDate` not `column.triggersCompletion` to determine quest completion state for UI buttons.

---

## Common Pitfalls

### Don't:
- ❌ Put business logic in main.ts
- ❌ Use synchronous file I/O
- ❌ Hardcode categories or column statuses
- ❌ Run git commands
- ❌ Skip testing before deployment
- ❌ Edit `styles.css` directly
- ❌ Use `innerHTML`, `fetch()`, `confirm()`, or `vault.modify()`
- ❌ Use regex lookbehind (breaks iOS/mobile)
- ❌ Forget to unmount React roots on view close
- ❌ Use `any` type without justification

### Do:
- ✅ Keep files under 300 lines
- ✅ Use TypeScript strict mode
- ✅ JSDoc public methods
- ✅ Test in dev before deploying
- ✅ Follow session workflow with HARD STOPS
- ✅ Use ColumnConfigService for status checks
- ✅ Prefix all CSS with `qb-`
- ✅ Use `requestUrl()` for HTTP, `vault.process()` for file edits
- ✅ Use `registerEvent()` for all event listeners
- ✅ Use `safeJsonParse()` for untrusted JSON
- ✅ Use `sanitizeHtml()`/`sanitizeText()` for user/AI input

---

## Key Documentation

- `docs/development/Feature Roadmap v2.md` — Current phase/priority tracking
- `docs/development/Phase 4 Implementation Session Log.md` — Catch-all session log
- `docs/development/Title System Implementation Plan.md` — Title system plan
- `docs/development/Title System Session Log.md` — Title system log
- `docs/archive/session-logs/` — Historical feature session logs
