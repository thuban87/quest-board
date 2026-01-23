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
4. **Deploy** - `npm run deploy:production` (copies to production folder)
5. **Wait for Confirmation** - Brad tests in production Obsidian
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
├── styles.css
├── src/
│   ├── components/         # React UI components
│   │   ├── FullKanban.tsx      # Full-page Kanban board
│   │   ├── SidebarQuests.tsx   # Sidebar view
│   │   ├── QuestCard.tsx       # Individual quest card
│   │   ├── CharacterSheet.tsx  # Character stats display
│   │   ├── DnDWrappers.tsx     # Drag-and-drop components
│   │   └── AchievementsSidebar.tsx
│   ├── models/             # Data structures
│   │   ├── Quest.ts
│   │   ├── Character.ts
│   │   ├── Achievement.ts
│   │   ├── PowerUp.ts
│   │   └── QuestStatus.ts
│   ├── services/           # Business logic
│   │   ├── QuestService.ts         # Quest loading/saving
│   │   ├── QuestActionsService.ts  # Move/complete quests
│   │   ├── XPSystem.ts             # XP/level calculations
│   │   ├── PowerUpService.ts       # Buffs and power-ups
│   │   ├── StreakService.ts        # Daily streak tracking
│   │   ├── AchievementService.ts   # Achievement unlocks
│   │   ├── RecurringQuestService.ts
│   │   ├── StatusBarService.ts
│   │   └── BuffStatusProvider.ts
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
│   │   ├── AchievementHubModal.ts
│   │   ├── RecurringQuestsDashboardModal.ts
│   │   └── LevelUpModal.ts
│   ├── store/              # Zustand state stores
│   │   ├── questStore.ts
│   │   ├── characterStore.ts
│   │   └── taskSectionsStore.ts
│   ├── config/             # Configuration
│   │   └── questStatusConfig.ts
│   ├── utils/              # Pure functions
│   │   ├── validator.ts
│   │   ├── safeJson.ts
│   │   ├── pathValidator.ts
│   │   └── timeFormatters.ts
│   └── settings.ts         # Settings interface + UI
└── docs/
    ├── Session Log.md
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
- Filter/search on board
- AI quest generation (Gemini API)
- Full pixel art sprites

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

- **[[Foundation Session Log]]** - Development history (Phases 1-2)
- **[[Phase 3 Implementation Session Log]]** - Current development
- **[[Workspace Rules - Phase 3 Implementation]]** - Agent rules for Phase 3
- **[[Phase 3 Implementation Checklist]]** - Step-by-step implementation guide
- **[[Feature Roadmap]]** - Phase/priority tracking
- **[[Power-Ups System]]** - Trigger and buff documentation

---

## Phase 3 Notice

> ⚠️ **If working on Gear, Combat, or Exploration systems:**
> 
> Read `docs/Workspace Rules - Phase 3 Implementation.md` FIRST.
> 
> Key differences:
> - Deploy to **dev vault** (`npm run deploy:test`), not main vault
> - Run unit tests (`npm test`)
> - Follow atomic store action patterns
> - Mobile-first design

---

**Last Updated:** 2026-01-23
