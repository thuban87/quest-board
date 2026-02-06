# Quest Board - Development Guidelines

Instructions for AI assistants working on this project.

**Version:** 1.0.0  
**Last Updated:** 2026-02-05

---

## Project Context

**Developer:** Brad Wales (ADHD, visual learner, prefers vibe coding)  
**Purpose:** Gamified task tracker with RPG mechanics for ADHD brain  
**Tech Stack:** TypeScript, React, Obsidian API, esbuild  
**Release:** Personal use (potential public release later)

**Environments:**
- **Dev:** `C:\Users\bwales\projects\obsidian-plugins\quest-board`
- **Test:** `C:\Quest-Board-Test-Vault\.obsidian\plugins\quest-board`
- **Production:** `G:\My Drive\IT\Obsidian Vault\My Notebooks\.obsidian\plugins\quest-board`

---

## Git Workflow (CRITICAL)

**Brad handles ALL git commands.** AI assistants should:
- ✅ Read: `git status`, `git log`, `git diff`
- ❌ **NEVER run:** `git add`, `git commit`, `git push`, `git pull`, `git merge`, `git rebase`
- ✅ Provide commit messages at session wrap-up for Brad to copy/paste

---

## Development Session Workflow

1. **Review & Discuss** - Clarify requirements, check Feature Roadmap v2
2. **Do the Work** - Write code in dev environment only
3. **Test** - `npm run build`, fix errors, rebuild until passing
4. **Deploy** - `npm run deploy:test` (copies to test vault)
5. **Wait for Confirmation** - Brad tests in test Obsidian vault
6. **Wrap Up** - Update Session Log, Feature Roadmap, provide commit message

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
- **No Monolithic Files:** Split if exceeding ~200-300 lines
- **JSDoc Everything:** Public methods get documentation

### File Structure

```
quest-board/
├── main.ts                     # THIN entry point (~100 lines max)
├── manifest.json               # Version 1.0.0
├── styles.css                  # GENERATED - do not edit directly!
├── postcss.config.cjs          # PostCSS configuration
├── src/
│   ├── styles/                 # CSS MODULES (edit these!)
│   │   ├── index.css               # Entry point - imports all modules
│   │   ├── variables.css           # CSS custom properties
│   │   ├── base.css                # Container, header, empty states
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
│   ├── components/             # React UI components (11 files)
│   │   ├── FullKanban.tsx          # Full-page Kanban board
│   │   ├── SidebarQuests.tsx       # Sidebar view
│   │   ├── QuestCard.tsx           # Individual quest card
│   │   ├── CharacterSheet.tsx      # Character stats display
│   │   ├── DungeonView.tsx         # Dungeon exploration view
│   │   ├── BattleView.tsx          # Combat battle view
│   │   ├── FilterBar.tsx           # Quest filter/search bar
│   │   ├── DnDWrappers.tsx         # Drag-and-drop components
│   │   ├── AchievementsSidebar.tsx # Achievements display
│   │   ├── CharacterCreationModal.tsx # Character creation UI
│   │   └── Minimap.tsx             # Dungeon minimap
│   │
│   ├── models/                 # Data structures (13 files)
│   │   ├── Quest.ts                # Quest data model
│   │   ├── QuestStatus.ts          # Status enum (legacy compat)
│   │   ├── CustomColumn.ts         # Custom kanban columns
│   │   ├── Character.ts            # Character, classes, schema v4
│   │   ├── Gear.ts                 # Gear, armor, weapons, sets
│   │   ├── Monster.ts              # Monster templates, prefixes
│   │   ├── Dungeon.ts              # Dungeon structure, rooms
│   │   ├── Achievement.ts          # Achievement definitions
│   │   ├── Consumable.ts           # Consumable items
│   │   ├── Bounty.ts               # Bounty encounters
│   │   ├── Skill.ts                # Player and monster skills
│   │   └── StatusEffect.ts         # Combat status effects
│   │
│   ├── services/               # Business logic (36 files)
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
│   │   ├── BalanceTestingService.ts    # Combat balance testing
│   │   └── TestCharacterGenerator.ts   # Test character creation
│   │
│   ├── hooks/                  # React hooks (10 files)
│   │   ├── useQuestLoader.ts       # Quest loading + file watching
│   │   ├── useQuestActions.ts      # Move/toggle quest actions
│   │   ├── useXPAward.ts           # XP award on task completion
│   │   ├── useSaveCharacter.ts     # Character persistence
│   │   ├── useDndQuests.ts         # Drag-and-drop logic
│   │   └── useCollapsedItems.ts    # Collapse state management
│   │
│   ├── modals/                 # Obsidian modals (37 files)
│   │   ├── CreateQuestModal.ts         # Manual quest creation
│   │   ├── AIQuestGeneratorModal.ts    # AI quest generation
│   │   ├── AIQuestPreviewModal.ts      # AI quest preview/edit
│   │   ├── QuestBoardCommandMenu.ts    # Consolidated command menu
│   │   ├── ColumnManagerModal.ts       # Custom column management
│   │   ├── ScrollLibraryModal.ts       # Template gallery
│   │   ├── ScrivenersQuillModal.ts     # Template builder
│   │   ├── SmartTemplateModal.ts       # Quest from template
│   │   ├── CharacterCreationModal.ts   # Character setup
│   │   ├── LevelUpModal.ts             # Level-up celebration
│   │   ├── InventoryModal.ts           # Gear inventory
│   │   ├── InventoryManagementModal.ts # Full inventory handling
│   │   ├── BlacksmithModal.ts          # Gear smelting
│   │   ├── StoreModal.ts               # Consumable shop
│   │   ├── BountyModal.ts              # Bounty preview
│   │   ├── BountyReviveModal.ts        # Bounty recovery
│   │   ├── AchievementHubModal.ts      # Achievement hub
│   │   ├── AchievementUnlockModal.ts   # Achievement popup
│   │   ├── CreateAchievementModal.ts   # Custom achievements
│   │   ├── RecurringQuestsDashboardModal.ts # Recurring management
│   │   ├── ProgressDashboardModal.ts   # Activity history
│   │   ├── RecoveryOptionsModal.ts     # Death recovery
│   │   ├── PaidRestModal.ts            # Paid rest option
│   │   ├── DungeonSelectionModal.ts    # Dungeon picker
│   │   ├── DungeonMapModal.ts          # Dungeon map view
│   │   ├── DungeonDeathModal.ts        # Dungeon death handling
│   │   ├── AIDungeonWizardModal.ts     # AI dungeon generation
│   │   ├── EliteEncounterModal.ts      # Elite monster encounter
│   │   ├── LootModal.ts                # Loot display
│   │   ├── SkillLoadoutModal.ts        # Skill selection
│   │   ├── JobHuntModal.ts             # Job hunt interface
│   │   ├── TrainingIntroModal.ts       # Training mode intro
│   │   ├── WelcomeModal.ts             # First-time welcome
│   │   ├── WatchedFolderManagerModal.ts # Folder watcher settings
│   │   ├── GearSlotMappingModal.ts     # Quest→gear slot mapping
│   │   ├── StatMappingsModal.ts        # Category→stat mapping
│   │   └── AITestLabModal.ts           # AI testing (dev only)
│   │
│   ├── store/                  # Zustand state stores (8 files)
│   │   ├── questStore.ts           # Quest state
│   │   ├── characterStore.ts       # Character state (schema v4)
│   │   ├── battleStore.ts          # Combat state machine
│   │   ├── dungeonStore.ts         # Dungeon exploration state
│   │   ├── filterStore.ts          # Filter/search state
│   │   ├── taskSectionsStore.ts    # Task section parsing
│   │   └── uiStore.ts              # UI state management
│   │
│   ├── config/                 # Configuration
│   │   └── combatConfig.ts         # Combat balance constants (v25)
│   │
│   ├── data/                   # Static data (8 files)
│   │   ├── monsters.ts             # 19 base + 20 boss monsters
│   │   ├── monsterSkills.ts        # Monster signature skills
│   │   ├── dungeonTemplates.ts     # Built-in dungeons
│   │   ├── TileRegistry.ts         # Dungeon tile definitions
│   │   ├── achievements.ts         # Default achievements
│   │   ├── starterGear.ts          # Starting equipment
│   │   └── skills.ts               # Player skill definitions
│   │
│   ├── utils/                  # Pure functions (13 files)
│   │   ├── validator.ts            # Quest validation
│   │   ├── safeJson.ts             # Safe JSON parsing
│   │   ├── pathValidator.ts        # Path validation
│   │   ├── pathfinding.ts          # A* dungeon pathfinding
│   │   ├── timeFormatters.ts       # Time display helpers
│   │   ├── gearFormatters.ts       # Gear tooltip creation
│   │   ├── columnMigration.ts      # Column deletion migration
│   │   └── dailyNotesDetector.ts   # Daily Notes folder detection
│   │
│   ├── views/                  # Obsidian views (6 files)
│   └── settings.ts             # Settings interface + UI (10 sections)
│
├── docs/
│   ├── development/                # Active development docs
│   │   ├── Feature Roadmap v2.md       # Current priorities
│   │   ├── Phase 4 Implementation Session Log.md
│   │   └── planned-features/           # Future feature specs
│   └── archive/                    # Historical docs
│       ├── Foundation Session Log.md
│       ├── Phase 3 Implementation Session Log.md
│       ├── Kanban Implementation Session Log.md
│       └── Settings Redesign Session Log.md
│
└── test/                       # Vitest unit tests
    ├── achievements.test.ts        # 52 tests
    ├── power-up-effects.test.ts    # 62 tests
    ├── power-up-triggers.test.ts   # 54 tests
    ├── progress-stats.test.ts      # 27 tests
    ├── activity-logging.test.ts    # 14 tests
    └── ...                         # Monster, battle, balance tests
```

### Layer Responsibilities

| Layer | Should | Should NOT |
|-------|--------|------------|
| **main.ts** | Register commands, initialize services, handle lifecycle | Contain business logic |
| **Components** | Render UI, handle user interactions, call hooks/services | Read/write files, manage global state |
| **Hooks** | Encapsulate reusable React logic, compose services | Be too specific to one component |
| **Services** | Business logic, file I/O, state coordination | Render UI, manipulate DOM |
| **Utils** | Pure functions, data transformations | Manage state, make assumptions about context |

---

## Current Feature Status

### Completed ✅ (Phase 1-4)

**Quest System:**
- Kanban board (FullKanban + SidebarQuests)
- Custom kanban columns (ColumnConfigService)
- Quest creation modal with templates
- AI quest generation (Gemini)
- Template system ("Scrivener's Desk")
- Folder watcher auto-quest generation
- Daily notes integration
- Recurring quests with dashboard
- Drag-and-drop reordering

**Character System:**
- 7 classes with unique perks
- XP system (5-tier, L1-40)
- Training mode (Roman numerals I-X)
- Character sheet with stats
- Progress dashboard (activity history)

**Combat System:**
- Turn-based battles
- Skills system (Pokemon Gen 1 style)
- 19 base monsters + 20 bosses
- Status effects and buffs
- Stamina system
- Death penalty and recovery

**Gear & Loot:**
- 9 gear slots, 6 tiers
- Class restrictions (armor/weapon types)
- Set bonuses (AI-generated)
- Smelting system
- WoW-style comparison tooltips

**Dungeons:**
- Full exploration UI
- 4 tilesets (cave, forest, dungeon, castle)
- Boss encounters
- User-defined custom dungeons
- AI dungeon generation

**Power-Ups & Achievements:**
- 18 power-up triggers
- 32 default achievements
- Streak tracking

**Settings & UI:**
- 10-section settings panel
- Mobile optimization
- Auto-attack in battles

### Phase 5: Future 🔮

**Party System:**
- Player party (2-4 characters)
- Monster party support
- Party member acquisition

**Productivity Features:**
- Quest dependencies (skill trees)
- Analytics dashboard
- Export stats

**Polish:**
- Dual-class unlock at L25
- Class change modal
- Tier sprite choices
- Accessory special abilities

---

## CSS Modularization (IMPORTANT!)

> ⚠️ **The root `styles.css` is GENERATED. Do not edit it directly!**

CSS is modular. All styles live in `src/styles/` and are bundled at build time.

### CSS Build Commands

```bash
npm run css:build    # Build CSS once
npm run css:watch    # Watch for changes
npm run build        # Full build (includes CSS)
```

### Which Module to Edit?

| Task | Module |
|------|--------|
| Modal styles | `modals.css` |
| Combat/battle | `combat.css` |
| Dungeon/exploration | `dungeons.css` |
| Character sheet | `character.css` |
| Inventory/tooltips | `inventory.css` |
| Template system | `scrivener.css` |
| Progress dashboard | `progress.css` |
| Mobile fixes | `mobile.css` |
| New animations | `animations.css` |

---

## Custom Kanban Columns

The plugin supports user-defined kanban columns via `ColumnConfigService`:

- **Default columns:** Available → Active → In Progress → Completed
- **Custom columns:** Users can add/edit/delete/reorder columns
- **Completion detection:** Columns with `triggersCompletion: true` mark quests complete
- **Migration:** Deleting a column migrates quests to first column

**Key files:**
- `src/services/ColumnConfigService.ts` - Central column logic
- `src/modals/ColumnManagerModal.ts` - Settings UI
- `src/utils/columnMigration.ts` - Column deletion handling

---

## Skills System

Pokemon Gen 1 style skills using mana:

- **Skill types:** Damage, heal, buff, debuff, special
- **Skill loadout:** 4 equipped skills per character
- **Monster skills:** 20 signature boss skills with multi-hit/heal mechanics

**Key files:**
- `src/services/SkillService.ts` - Skill management
- `src/modals/SkillLoadoutModal.ts` - Skill selection UI
- `src/data/skills.ts` - Player skill definitions

---

## Data Storage

| Data Type | Storage | Why |
|-----------|---------|-----|
| **Character, achievements, inventory, settings** | `loadData()`/`saveData()` | Safe from user deletion, syncs with plugin |
| **Quest files** | `Quest Board/quests/` | User-editable, human-readable markdown |

**Quest files are source of truth.** Zustand store is a cache for React rendering.

---

## Security Essentials

1. **API Keys** - Store in Obsidian settings (not in vault files)
2. **Input Sanitization** - Use DOMPurify for any AI-generated content
3. **Safe JSON** - Use `safeJson.ts` to prevent prototype pollution
4. **Path Validation** - Validate `linkedTaskFile` paths resolve within vault

---

## Character Classes

7 classes with 15% XP bonus for matching category + unique perk:

| Class | Focus | Perk |
|-------|-------|------|
| Warrior | Admin/completion | Rage: +5% XP on multi-completions |
| Paladin | Health + Social | Shield: Streak protection |
| Technomancer | Dev/creative | Overclock: Reduced cooldowns |
| Scholar | Academic/study | Focus: Bonus XP for long sessions |
| Rogue | Efficiency | Quick Strike: Bonus for fast completions |
| Cleric | Wellness | Restoration: Enhanced rest bonuses |
| Bard | Social | Inspiration: Team bonuses |

---

## Common Pitfalls

### Don't:
- ❌ Put all code in main.ts
- ❌ Use synchronous file I/O
- ❌ Hardcode categories or column statuses
- ❌ Run git commands
- ❌ Skip testing before deployment
- ❌ Edit `styles.css` directly

### Do:
- ✅ Keep files under 300 lines
- ✅ Use TypeScript strict mode
- ✅ Comment public methods
- ✅ Test in dev before deploying
- ✅ Follow session workflow
- ✅ Use ColumnConfigService for status checks

---

## Key Documentation

- **[[Feature Roadmap v2]]** - Current phase/priority tracking
- **[[Phase 4 Implementation Session Log]]** - Active development
- **[[Kanban Implementation Session Log]]** - Custom columns implementation
- **[[Settings Redesign Session Log]]** - Settings panel redesign

---

## Testing Values to Verify

Before production deployment, verify these testing values are reverted:

| Setting | Test Value | Production | Location |
|---------|-----------|------------|----------|
| Daily Stamina Cap | 500 | 50 | `CombatService.ts` |
| Bounty Slider Max | 100% | 20% | `settings.ts` |
| Set Piece Drop Rate | 40% | 33% | `LootGenerationService.ts` |
