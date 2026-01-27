---
trigger: always_on
---

# Quest Board - Development Guidelines

Instructions for AI assistants working on this project.

---

## Project Context

**Developer:** Brad Wales (ADHD, visual learner, prefers vibe coding)
**Purpose:** Gamified task tracker with RPG mechanics for ADHD brain
**Tech Stack:** TypeScript, React, Obsidian API, esbuild
**Release:** Personal use (potential public release later)

**Environments:**
- **Dev:** `C:\Users\bwales\projects\obsidian-plugins\quest-board`
- **Production:** `G:\My Drive\IT\Obsidian Vault\My Notebooks\.obsidian\plugins\quest-board`

---

## Git Workflow (CRITICAL)

**Brad handles ALL git commands.** AI assistants should:
- ✅ Read: `git status`, `git log`, `git diff`
- ❌ **NEVER run:** `git add`, `git commit`, `git push`, `git pull`, `git merge`, `git rebase`
- ✅ Provide commit messages at session wrap-up for Brad to copy/paste

---

## Development Session Workflow

1. **Review & Discuss** - Clarify requirements, check Feature Roadmap
2. **Do the Work** - Write code in dev environment only
3. **Test** - `npm run build`, fix errors, rebuild until passing
4. **Deploy** - `npm run deploy:test` (copies to test/dev folder)
5. **Wait for Confirmation** - Brad tests in dev Obsidian
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
├── main.ts                 # THIN entry point (~100 lines max)
├── manifest.json
├── styles.css              # GENERATED - do not edit directly!
├── postcss.config.cjs      # PostCSS configuration
├── src/
│   ├── styles/             # CSS MODULES (edit these!)
│   │   ├── index.css           # Entry point - imports all modules
│   │   ├── variables.css       # CSS custom properties
│   │   ├── base.css            # Container, header, empty states
│   │   ├── kanban.css          # Kanban board columns/cards
│   │   ├── character.css       # Character sheet, gear slots
│   │   ├── modals.css          # Modal base styles, forms
│   │   ├── sidebar.css         # Sidebar view, tabs, sections
│   │   ├── fullpage.css        # Full-page kanban view
│   │   ├── power-ups.css       # Power-ups, achievements, recurring
│   │   ├── inventory.css       # Inventory, gear, blacksmith
│   │   ├── combat.css          # Combat UI, battle view, store
│   │   ├── dungeons.css        # Dungeon view, tiles, D-pad
│   │   ├── animations.css      # Keyframes and animations
│   │   └── mobile.css          # Mobile-specific styles
│   ├── components/         # React UI components
│   │   ├── FullKanban.tsx      # Full-page Kanban board
│   │   ├── SidebarQuests.tsx   # Sidebar view
│   │   ├── QuestCard.tsx       # Individual quest card
│   │   ├── CharacterSheet.tsx  # Character stats display
│   │   ├── DungeonView.tsx     # Dungeon exploration view
│   │   ├── BattleView.tsx      # Combat battle view
│   │   ├── DnDWrappers.tsx     # Drag-and-drop components
│   │   └── AchievementsSidebar.tsx
│   ├── models/             # Data structures
│   │   ├── Quest.ts
│   │   ├── Character.ts
│   │   ├── Gear.ts
│   │   ├── Monster.ts
│   │   ├── Dungeon.ts
│   │   ├── Achievement.ts
│   │   ├── PowerUp.ts
│   │   └── QuestStatus.ts
│   ├── services/           # Business logic
│   │   ├── QuestService.ts         # Quest loading/saving
│   │   ├── QuestActionsService.ts  # Move/complete quests
│   │   ├── XPSystem.ts             # XP/level calculations
│   │   ├── CombatService.ts        # Combat stats derivation
│   │   ├── BattleService.ts        # Battle turn execution
│   │   ├── MonsterService.ts       # Monster creation/scaling
│   │   ├── LootGenerationService.ts # Gear/consumable drops
│   │   ├── PowerUpService.ts       # Buffs and power-ups
│   │   ├── StreakService.ts        # Daily streak tracking
│   │   ├── AchievementService.ts   # Achievement unlocks
│   │   ├── RecurringQuestService.ts
│   │   ├── SpriteService.ts        # Sprite path resolution
│   │   └── StatusBarService.ts
│   ├── hooks/              # React hooks (shared logic)
│   │   ├── useQuestLoader.ts      # Quest loading + file watching
│   │   ├── useQuestActions.ts     # Move/toggle quest actions
│   │   ├── useXPAward.ts          # XP award on task completion
│   │   ├── useSaveCharacter.ts    # Character persistence
│   │   ├── useDndQuests.ts        # Drag-and-drop logic
│   │   └── useCollapsedItems.ts   # Collapse state management
│   ├── modals/             # Obsidian modals
│   │   ├── CreateQuestModal.ts
│   │   ├── QuestBoardCommandMenu.ts    # Consolidated command menu
│   │   ├── StoreModal.ts
│   │   ├── InventoryModal.ts
│   │   ├── BlacksmithModal.ts
│   │   ├── BountyModal.ts
│   │   ├── AchievementHubModal.ts
│   │   ├── RecurringQuestsDashboardModal.ts
│   │   └── LevelUpModal.ts
│   ├── store/              # Zustand state stores
│   │   ├── questStore.ts
│   │   ├── characterStore.ts
│   │   ├── battleStore.ts
│   │   ├── dungeonStore.ts
│   │   └── taskSectionsStore.ts
│   ├── config/             # Configuration
│   │   ├── questStatusConfig.ts
│   │   └── combatConfig.ts
│   ├── data/               # Static data
│   │   ├── monsters.ts
│   │   ├── dungeonTemplates.ts
│   │   └── TileRegistry.ts
│   ├── utils/              # Pure functions
│   │   ├── validator.ts
│   │   ├── safeJson.ts
│   │   ├── pathValidator.ts
│   │   ├── pathfinding.ts
│   │   └── timeFormatters.ts
│   └── settings.ts         # Settings interface + UI
└── docs/
    ├── Phase 3 Implementation Session Log.md
    └── Feature Roadmap.md
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

### Completed ✅
- Kanban board (FullKanban + SidebarQuests)
- Quest creation modal with templates
- XP system with level progression
- Character sheet with stats
- Streak tracking (daily/weekly)
- Achievement system (32 defaults + custom)
- Power-ups system (triggers, buffs, status bar)
- Recurring quests with dashboard
- Training mode (Roman numeral levels I-X)
- Command menu modal (consolidated commands)
- Folder exclusion settings

### In Progress ⚡
- More power-up triggers (Hat Trick, Blitz, etc.)
- Streak Shield effect wiring

### Future 🔮
- AI quest generation improvements
- Full pixel art sprites for all classes
- More dungeon templates

---

## CSS Modularization (IMPORTANT!)

> ⚠️ **The root `styles.css` is GENERATED. Do not edit it directly!**

CSS is now modular. All styles live in `src/styles/` and are bundled at build time.

### CSS Module Files

| Module | Content |
|--------|---------|
| `variables.css` | CSS custom properties (colors, spacing) |
| `base.css` | Container, header, empty states |
| `kanban.css` | Kanban board columns/cards |
| `character.css` | Character sheet, gear slots |
| `modals.css` | Modal base styles, forms |
| `sidebar.css` | Sidebar view, tabs, sections |
| `fullpage.css` | Full-page kanban view |
| `power-ups.css` | Power-ups, achievements, recurring |
| `inventory.css` | Inventory, gear, blacksmith |
| `combat.css` | Combat UI, battle view, store |
| `dungeons.css` | Dungeon view, tiles, D-pad |
| `animations.css` | Keyframes and animations |
| `mobile.css` | Mobile-specific styles |

### CSS Build Commands

```bash
npm run css:build    # Build CSS once
npm run css:watch    # Watch for changes
npm run build        # Full build (includes CSS)
```

### Which Module to Edit?

- **Adding modal styles?** → `modals.css`
- **Combat/battle styles?** → `combat.css`
- **Dungeon/exploration?** → `dungeons.css`
- **Character sheet?** → `character.css`
- **New animation?** → `animations.css`
- **Mobile fix?** → `mobile.css`

---

## Data Storage

| Data Type | Storage | Why |
|-----------|---------|-----|
| **Character, achievements, inventory, settings** | `loadData()`/`saveData()` | Safe from user deletion, syncs with plugin |
| **Quest files** | `Life/Quest Board/quests/` | User-editable, human-readable markdown |

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
- ❌ Hardcode categories
- ❌ Run git commands
- ❌ Skip testing before deployment

### Do:
- ✅ Keep files under 300 lines
- ✅ Use TypeScript strict mode
- ✅ Comment public methods
- ✅ Test in dev before deploying
- ✅ Follow session workflow

---

## Key Documentation

- **[[Session Log]]** - Development progress by date
- **[[Feature Roadmap]]** - Phase/priority tracking
- **[[Power-Ups System]]** - Trigger and buff documentation

---

**Last Updated:** 2026-01-27