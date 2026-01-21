# Quest Board

> [!CAUTION]
> **⚠️ DEVELOPMENT IN PROGRESS - NOT READY FOR PUBLIC USE**
>
> This plugin is under active development and is not yet stable. APIs, data formats, and features may change without notice. **Use at your own risk.** If you choose to use this plugin, back up your data regularly and be prepared for breaking changes.
>
> This repository is public for portfolio/learning purposes. Contributions and feedback are welcome, but please understand the plugin is not production-ready.

---

**An RPG-style gamified task/quest tracker for Obsidian.**

Transform any workflow (job hunting, chores, projects, fitness) into epic quests. Gain XP, level up, unlock achievements, and track progress through an intuitive kanban board. Built for ADHD brains that need dopamine hits.

## Features

### ✅ Implemented (Current)

**Core Mechanics**
- Character creation with 7 classes (Warrior, Paladin, Technomancer, Scholar, Rogue, Cleric, Bard)
- Training Mode (Roman numeral levels I-X) and Real Game Mode (levels 1-40)
- Age-based XP system with class bonuses (+15% to matching quest categories)
- Task file linking (quests read tasks from markdown files)
- Quest creation modal with smart templates

**Views**
- Full-page Kanban board (4 columns: Available → In Progress → Active → Completed)
- Focused Sidebar view with collapsible sections
- Character Sheet with stats, XP bar, and achievements display
- Achievements Sidebar (accessible from character sheet)

**Quest System**
- Drag-and-drop quest management
- Quick action buttons for quest status changes
- Multi-file task linking (sections as "Mini Objectives")
- Domain-specific quest templates (12 categories)
- Quest-level collapse toggle

**Gamification**
- 32 default achievements (levels, applications, interviews, streaks)
- Achievement unlock popup with confetti animation
- Achievement Hub Modal (view/edit/delete achievements)
- Custom achievement creation
- Level-up celebration modal
- XP per task + completion bonus

### 🚧 In Development

- Weekly Streak Tracker
- Power-Ups Display (class perks)
- Quest Visibility Controls (progressive task reveal)
- Gear Slot UI
- Filter/Search

### 📋 Planned (Phase 3)

- Pixel art sprite system (Paladin class + gear overlays)
- AI Quest Generation (Gemini API)  
- Enrage System (overdue quest penalties)
- Loot/Consumable System
- Integration with Chronos and Switchboard plugins

## Installation

1. Clone or download this repository into your vault's `.obsidian/plugins/` folder
2. Enable "Quest Board" in Obsidian Settings → Community Plugins
3. Create your character on first launch
4. Start adding quests!

## Usage

### Commands

| Command | Description |
|---------|-------------|
| `Quest Board: Open Quest Hub` | Open full-page kanban board |
| `Quest Board: Open Sidebar` | Open focused sidebar view |
| `Quest Board: Create Quest` | Create a new quest |
| `Quest Board: Create Quest from Template` | Use smart templates |
| `Quest Board: View Achievements Hub` | View/edit all achievements |
| `Quest Board: Create Custom Achievement` | Add custom achievement |

### Quest Storage

```
Life/Quest Board/
├── quests/
│   ├── main/              # Main questline quests
│   ├── training/          # Training mode quests
│   └── ai-generated/      # AI-created quests
└── templates/             # Quest templates
```

Character data (XP, level, achievements) is stored in `.obsidian/plugins/quest-board/data.json`.

## Development

```bash
# Install dependencies
npm install

# Build for development
npm run dev

# Build for production
npm run build

# Deploy to vault
npm run deploy
```

## Tech Stack

- TypeScript (strict mode)
- React (functional components)
- Zustand (state management)
- DnD Kit (drag-and-drop)
- DOMPurify (input sanitization)
- esbuild (bundling)

## License

MIT

---

**Last Updated:** 2026-01-20
