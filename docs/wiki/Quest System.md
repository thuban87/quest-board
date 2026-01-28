# Quest System

The Quest System is the heart of Quest Board. Quests represent your real-world tasks and projects, transformed into RPG-style objectives that reward XP and loot.

---

## How Quests Work

Each quest is a markdown file with YAML frontmatter. The plugin scans your quest folders, parses these files, and displays them on the Kanban board.

**The flow:**
1. Create a quest file (or use the modal)
2. Link it to a task file containing your actual to-dos
3. Check off tasks in the task file → earn XP
4. Complete all tasks → quest completes → bonus XP + potential loot

---

## Quest Folder Structure

Quests are organized in subfolders under your storage folder:

```
Life/Quest Board/quests/
├── main/           # Major projects, storyline quests
├── side/           # Optional or lower-priority quests
├── recurring/      # Auto-generated daily/weekly quests
├── daily/          # One-off daily quests
└── [custom]/       # Create any folder you want!
```

> [!TIP]
> Quest type is determined by the **folder name**. Create a `fitness/` or `work/` folder and quests inside will have that type automatically.

---

## Creating a Quest

### Using the Modal (Recommended)

1. Open Command Palette (`Ctrl/Cmd + P`)
2. Run **Quest Board: Create Quest**
3. Fill in the fields:
   - **Quest Name** – Display name (can include emoji)
   - **Type** – Folder to save in (main, side, etc.)
   - **Category** – For filtering (admin, shopping, fitness, etc.)
   - **Linked Task File** – Path to markdown file with tasks
   - **XP Per Task** – XP earned for each completed task
   - **Completion Bonus** – Bonus XP when quest finishes
   - **Difficulty** – Affects loot quality (trivial → epic)
4. Click **Create**

### Manual Creation

Create a markdown file in any quest folder with this structure:

```markdown
---
schemaVersion: 1
questId: my-quest-id
questName: "My Quest Name"
questType: main
category: admin
linkedTaskFile: Path/To/My/Tasks.md
xpPerTask: 5
completionBonus: 30
priority: medium
difficulty: medium
status: available
createdDate: 2026-01-27
---

# My Quest Name

Optional description and notes here. This content is for your reference
and doesn't affect gameplay.
```

---

## Quest Frontmatter Fields

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | number | Always `1` (for future migrations) |
| `questId` | string | Unique ID in kebab-case (e.g., `my-quest`) |
| `questName` | string | Display name |
| `questType` | string | Folder type (main, side, training, etc.) |
| `category` | string | Category for filtering |
| `linkedTaskFile` | string | Path to task file |
| `xpPerTask` | number | XP per completed task |
| `completionBonus` | number | Bonus XP on quest completion |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `priority` | enum | `medium` | `low`, `medium`, `high`, `critical` |
| `difficulty` | enum | `medium` | `trivial`, `easy`, `medium`, `hard`, `epic` |
| `status` | enum | `available` | `available`, `in-progress`, `active`, `completed` |
| `visibleTasks` | number | `4` | How many tasks shown at once |
| `sortOrder` | number | — | Custom sort within column |
| `tags` | array | `[]` | Tags for filtering |
| `createdDate` | date | — | ISO 8601 format |

> [!NOTE]
> **Difficulty affects loot quality.** Higher difficulty quests have better chances of dropping rare gear. Trivial quests drop no gear.

---

## The Linked Task File

The `linkedTaskFile` is where your actual tasks live. This is **bidirectional linking**:

- Quest file points to the task file
- Task file confirms the link with frontmatter

### Task File Format

```markdown
---
quest: my-quest-id
questXP: 5
---

## Tasks

- [ ] First task
- [ ] Second task
- [x] Completed task (already earned XP!)
- [ ] Fourth task
```

**Key points:**
- `quest` must match the quest's `questId`
- `questXP` should match `xpPerTask` (validation)
- Tasks are standard markdown checkboxes: `- [ ]` and `- [x]`
- Check off tasks in Obsidian → plugin awards XP automatically

> [!IMPORTANT]
> Both frontmatter fields are **required** for XP tracking. If either is missing, the plugin warns but doesn't break.

### Task Sections

Use headers to organize tasks into sections:

```markdown
---
quest: home-renovation
questXP: 10
---

## Phase 1: Planning
- [ ] Get contractor quotes
- [ ] Create budget spreadsheet

## Phase 2: Demolition
- [ ] Clear the room
- [ ] Remove old flooring

## Phase 3: Construction
- [ ] Install new flooring
- [ ] Paint walls
```

Sections appear as collapsible groups on quest cards. The `visibleTasks` setting controls how many future tasks are visible at once.

---

## Quest Status Workflow

Quests move through four statuses, displayed as Kanban columns:

```
Available → In Progress → Active → Completed
```

| Status | Meaning |
|--------|---------|
| **Available** | Quest exists but hasn't been started |
| **In Progress** | Picked up but not currently working on |
| **Active** | Currently the focus of your work |
| **Completed** | All tasks done, rewards claimed |

### Moving Quests

- **Drag and drop** between columns
- **Right-click** for context menu
- **Auto-complete**: When all tasks in the linked file are checked, status changes to Completed automatically

---

## XP and Rewards

### XP Calculation

For each task completed:
```
Base XP = xpPerTask
Class Bonus = +15% if category matches your class
Total = Base XP × (1 + Class Bonus)
```

On quest completion:
```
Completion Bonus = completionBonus value
```

### Loot Drops

When you complete a quest (difficulty > trivial):
- Roll for gear based on quest type and difficulty
- Higher difficulty = higher tier gear chance
- Quest type determines which gear slots can drop (configurable in settings)

---

## Quest Types and Loot

Each quest type has default gear slot mappings:

| Quest Type | Default Slots |
|------------|---------------|
| Main | Chest, Weapon, Head |
| Side | Legs, Boots, Shield |
| Training | Head, Shield |
| Recurring | Boots, Accessory |
| Daily | (no gear) |

> [!TIP]
> Customize these mappings in **Settings → Quest → Gear Slot Mapping**. Add your own quest type folders with their own loot tables.

---

## Recurring Quests

Recurring quests auto-generate from templates on a schedule.

### Template Location

Templates live in: `System/Templates/Quest Board/Recurring Quests/`

### Template Format

```yaml
---
questName: "Daily Wellness - {{date}}"
recurrence: monday, wednesday, friday
category: wellness
priority: medium
xpPerTask: 5
completionBonus: 15
---

## Tasks
- [ ] Morning stretch
- [ ] Take vitamins
- [ ] 10-minute walk
```

### Recurrence Options

| Value | Meaning |
|-------|---------|
| `daily` | Every day |
| `weekdays` | Monday–Friday |
| `weekends` | Saturday–Sunday |
| `weekly` | Every Monday |
| `weekly:thursday` | Every Thursday |
| `monthly` | 1st of each month |
| `monday, wednesday, friday` | Specific days |

### Placeholders

| Placeholder | Output |
|-------------|--------|
| `{{date}}` | `2026-01-27` |
| `{{date_slug}}` | `20260127` |

Generated quests appear in `quests/recurring/` and archive automatically after completion.

---

## Filtering and Search

Use the filter bar above the Kanban board:

| Filter | Description |
|--------|-------------|
| **Category** | Show only quests in a category |
| **Priority** | Filter by priority level |
| **Tags** | Filter by tags |
| **Type** | Filter by quest type folder |
| **Search** | Full-text search on quest names |

---

## Best Practices

### Quest Naming
✅ Use descriptive, fun names: `The Bureaucratic Labyrinth`, `Operation Clean Kitchen`
❌ Avoid generic names: `Quest 1`, `Tasks`

### XP Balancing

| Task Type | Suggested XP |
|-----------|--------------|
| Quick task (5 min) | 5–10 |
| Medium task (30 min) | 15–30 |
| Complex task (2+ hours) | 50–75 |
| Major milestone | 100–200 |

### Completion Bonuses

| Quest Length | Suggested Bonus |
|--------------|-----------------|
| Short (3–5 tasks) | 20–30 |
| Medium (10–15 tasks) | 50–75 |
| Long (20+ tasks) | 100–150 |

### Difficulty Guidelines

| Difficulty | When to Use |
|------------|-------------|
| Trivial | Tutorial, learning the system |
| Easy | Routine daily tasks |
| Medium | Standard projects |
| Hard | Challenging, multi-week efforts |
| Epic | Major life goals, huge undertakings |

---

## Troubleshooting

### XP Not Updating
1. Check task file has `quest: [quest-id]` in frontmatter
2. Check task file has `questXP: [number]` in frontmatter
3. Reload plugin: Command Palette → "Reload without saving"

### Quest Not Appearing
1. Verify file is in a quest subfolder (e.g., `quests/main/`)
2. Check frontmatter syntax (YAML between `---` markers)
3. Ensure `questId` is unique

### Linked Task File Not Found
1. Verify path in `linkedTaskFile` is correct
2. Paths are relative to vault root
3. Check for typos in folder/file names

---

## Advanced: Multiple Task Files

Link multiple files to one quest using `linkedTaskFiles`:

```yaml
---
questId: big-project
linkedTaskFile: Projects/BigProject/Phase1.md
linkedTaskFiles:
  - Projects/BigProject/Phase2.md
  - Projects/BigProject/Phase3.md
---
```

All tasks across all files count toward the quest.

---

## See Also

- [[Getting Started]] – Installation guide
- [[Character Classes]] – Class bonuses and perks
- [[Recurring Quests]] – Deep dive into templates
- [[Combat Guide]] – Bounties and battles

---

**Now go forth and conquer your quests!** ⚔️
