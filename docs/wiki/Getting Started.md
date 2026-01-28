# Getting Started with Quest Board

Welcome, adventurer! This guide will walk you through installing Quest Board and creating your first character.

---

## Prerequisites

- **Obsidian** version 1.11.4 or higher
- **BRAT** (Beta Reviewers Auto-update Tester) plugin installed
  - Install from Community Plugins: `Settings → Community Plugins → Browse → BRAT`

---

## Installation via BRAT

Quest Board is currently available exclusively through BRAT for beta testing.

1. Open Obsidian Settings (`Ctrl/Cmd + ,`)
2. Navigate to **BRAT** in the sidebar
3. Click **Add Beta Plugin**
4. Enter the repository URL:
   ```
   https://github.com/thuban87/quest-board.git
   ```
5. Click **Add Plugin**
6. Once installed, go to **Settings → Community Plugins** and enable **Quest Board**

> [!TIP]
> BRAT will automatically notify you when updates are available. Check the BRAT settings to enable auto-updates.

---

## First Launch

When Quest Board loads for the first time, it creates your folder structure automatically:

```
Life/Quest Board/
├── quests/
│   ├── main/        # Main storyline quests
│   ├── side/        # Optional side quests
│   ├── recurring/   # Auto-generated from templates
│   └── daily/       # Daily task quests
└── assets/          # Sprites and badges
```

> [!NOTE]
> The base folder `Life/Quest Board/` is customizable in settings if you prefer a different location.

---

## Creating Your Character

1. Open the Command Palette (`Ctrl/Cmd + P`)
2. Search for **Quest Board: Open Quest Board**
3. You'll be prompted to create your first character
4. Choose your:
   - **Name** – Your adventurer's identity
   - **Class** – Affects stat bonuses and perks (see [[Character Classes]])

Your character starts in **Training Mode** (levels I-X) with a separate XP pool. This lets you learn the mechanics risk-free before "graduating" to Level 1.

---

## Opening the Quest Board

Access the Quest Board in three ways:

| Method | Description |
|--------|-------------|
| Command Palette | `Ctrl/Cmd + P` → "Quest Board: Open" |
| Sidebar | Click the Quest Board icon in the right sidebar |
| Ribbon | Click the ⚔️ icon in the left ribbon |

---

## Quick Overview of the Interface

The Quest Board has three main views:

1. **Kanban Board** – Your quest tracker with columns: Available, In Progress, Active, Completed
2. **Character Sheet** – View stats, gear, and achievements
3. **Sprint View** – (Coming soon) Weekly progress dashboard

---

## Settings Configuration

Open settings via `Settings → Quest Board`. Key options:

| Setting | Description | Default |
|---------|-------------|---------|
| Quest Storage Folder | Where quest files are stored | `Life/Quest Board` |
| Weekly Quest Goal | Target quests per week | 8 |
| Training Mode | Separate XP pool for learning | Enabled |
| Streak Mode | What maintains your streak (quest or task) | Quest |

> [!IMPORTANT]
> **AI integration is optional** and not required for core gameplay. The Gemini API key setting enables future AI-powered features but can be left blank.

---

## Next Steps

Now that you're set up:

- **[[Quest System]]** – Learn how to create and manage quests
- **[[Character Classes]]** – Understand class bonuses and perks
- **[[Combat Guide]]** – Discover the battle system

---

**Happy adventuring!** 🗡️
