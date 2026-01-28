# Quest Board

> [!CAUTION]
> **⚠️ BETA - AVAILABLE VIA BRAT ONLY**
>
> This plugin is under active development. Features may change without notice. Back up your data regularly.
>
> This repository is public for portfolio/learning purposes. Contributions and feedback are welcome!

---

**An RPG-style gamified task/quest tracker for Obsidian.**

Transform any workflow (job hunting, chores, projects, fitness) into epic quests. Gain XP, level up, battle monsters, explore dungeons, and unlock achievements. Built for ADHD brains that need dopamine hits.

![Quest Board Banner](docs/assets/banner.png) <!-- TODO: Add banner image -->

## ✨ Features

### Quest Management
- **Kanban Board** – Drag-and-drop quests through Available → In Progress → Active → Completed
- **Quest Templates** – Create domain-specific templates for repeatable workflows
- **Linked Task Files** – Quests read tasks from any markdown file
- **Recurring Quests** – Daily, weekly, and monthly auto-generated quests
- **Filter & Search** – Find quests by category, priority, tags, or text

### Character System
- **7 Classes** – Warrior, Paladin, Technomancer, Scholar, Rogue, Cleric, Bard
- **Class Bonuses** – +15% XP for matching quest categories
- **Training Mode** – Learn the mechanics with a separate XP pool (Levels I-X)
- **Level Progression** – Age-based XP thresholds (Levels 1-40)

### Combat & Dungeons
- **Turn-Based Combat** – Battle 19 monster types across 8 categories
- **Dungeon Exploration** – Room-based dungeons with WASD/click movement
- **Stamina System** – Earn stamina from tasks to fuel random encounters
- **Bounty Hunts** – Triggered encounters with themed rewards

### Gear & Loot
- **9 Equipment Slots** – Head, chest, legs, boots, weapon, shield, 3 accessories
- **6 Gear Tiers** – Common → Legendary progression
- **Set Bonuses** – AI-generated thematic bonuses per quest folder
- **Smelting** – Combine gear to upgrade tiers at the Blacksmith

### Progression & Rewards
- **32 Achievements** – Level, streak, category, and quest milestones
- **Power-Up System** – Buffs triggered by gameplay events
- **Streak Tracking** – Daily completion streaks with Paladin shield protection
- **Gold Economy** – Buy potions and consumables at the Store

---

## 📚 Documentation

Full documentation is available in the [wiki/](docs/wiki/) folder:

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/wiki/Getting%20Started.md) | Installation, first character, quick overview |
| [Quest System](docs/wiki/Quest%20System.md) | Creating quests, frontmatter, linked files |
| [Character Classes](docs/wiki/Character%20Classes.md) | All 7 classes, bonuses, and perks |
| [Combat Guide](docs/wiki/Combat%20Guide.md) | Battle mechanics, monsters, stamina |
| [Dungeon Exploration](docs/wiki/Dungeon%20Exploration.md) | Controls, tiles, room persistence |
| [Gear & Equipment](docs/wiki/Gear%20%26%20Equipment.md) | Slots, tiers, set bonuses, smelting |
| [Power-Ups & Buffs](docs/wiki/Power-Ups%20%26%20Buffs.md) | Triggers, effects, duration |
| [Achievements](docs/wiki/Achievements.md) | Default list, custom creation |
| [Recurring Quests](docs/wiki/Recurring%20Quests.md) | Templates, recurrence rules |
| [Custom Dungeons](docs/wiki/Custom%20Dungeons.md) | Create your own dungeons |

### Settings Documentation

| Guide | Description |
|-------|-------------|
| [Settings Overview](docs/wiki/settings/Settings%20Overview.md) | All settings at a glance |
| [General Settings](docs/wiki/settings/General%20Settings.md) | Folders, goals, modes |
| [Gear Settings](docs/wiki/settings/Gear%20Settings.md) | Loot, smelting, set bonuses |
| [API Settings](docs/wiki/settings/API%20Settings.md) | Gemini AI integration |

---

## 🚀 Installation

Quest Board is available via **BRAT** (Beta Reviewers Auto-update Tester):

1. Install BRAT from Obsidian Community Plugins
2. Open BRAT settings → **Add Beta Plugin**
3. Enter: `https://github.com/thuban87/quest-board`
4. Enable **Quest Board** in Community Plugins
5. Create your character on first launch!

See [Getting Started](docs/wiki/Getting%20Started.md) for detailed instructions.

---

## 🎮 Quick Commands

| Command | Description |
|---------|-------------|
| `Quest Board: Open Quest Board` | Open full-page Kanban |
| `Quest Board: Open Sidebar` | Open focused sidebar |
| `Quest Board: Create Quest` | Create new quest |
| `Quest Board: Open Command Menu` | Access all commands |
| `Quest Board: Open Inventory` | Manage gear |
| `Quest Board: Open Store` | Buy consumables |
| `Quest Board: Enter Dungeon` | Start dungeon exploration |
| `Quest Board: Start Random Fight` | Trigger a battle |

---

## 📁 Quest Storage

```
Life/Quest Board/
├── quests/
│   ├── main/        # Main storyline quests
│   ├── side/        # Side quests
│   ├── recurring/   # Auto-generated daily/weekly
│   └── ...          # Your custom folders (become quest categories)
├── dungeons/        # User-defined dungeon files
└── assets/          # Sprites, badges, icons
```

Character data, achievements, and settings are stored in plugin data (`data.json`).

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build for development
npm run dev

# Build production (includes CSS bundling)
npm run build

# Deploy to test vault
npm run deploy:test
```

### Tech Stack

- TypeScript (strict mode)
- React (functional components)
- Zustand (state management)
- @dnd-kit (drag-and-drop)
- PostCSS (CSS modules)
- esbuild (bundling)

### Project Structure

```
src/
├── components/   # React UI components
├── services/     # Business logic
├── models/       # Data types
├── stores/       # Zustand stores
├── modals/       # Obsidian modals
├── hooks/        # React hooks
├── data/         # Static data (monsters, dungeons)
├── styles/       # CSS modules
└── utils/        # Pure utility functions
```

See [docs/development/](docs/development/) for developer documentation.

---

## 📋 Roadmap

See [Feature Roadmap v2](docs/development/Feature%20Roadmap%20v2.md) for the current development plan.

**Phase 4 Focus:**
- AI Quest Generation
- Daily Note Integration
- Power-Up completion
- Skills & Abilities
- Dungeon Bosses

---

## 📄 License

MIT

---

**Built with ❤️ for productivity-seeking adventurers**

*Last Updated: 2026-01-27*
