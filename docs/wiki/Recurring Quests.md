# Recurring Quests

Recurring quests automatically generate from templates on a schedule—daily habits, weekly reviews, or monthly planning sessions. Set them up once, and Quest Board handles the rest.

---

## How Recurring Quests Work

1. You create a **template** with a recurrence rule
2. The plugin generates **instances** from that template on scheduled days
3. Completed instances **archive automatically** the next day
4. A new instance appears on the next scheduled day

```
Template (stays forever)
    ↓
Generated Instance (Mon Jan 27)  →  Archived after completion
Generated Instance (Wed Jan 29)  →  Archived after completion
Generated Instance (Fri Jan 31)  →  Working on this now...
```

> [!TIP]
> Recurring quests are perfect for ADHD brains—building habits without the mental load of recreating tasks!

---

## Folder Structure

Recurring quests use two folders:

| Folder | Purpose |
|--------|---------|
| `System/Templates/Quest Board/Recurring Quests/` | Your templates live here |
| `Life/Quest Board/quests/recurring/` | Generated instances appear here |
| `Life/Quest Board/quests/archive/YYYY-MM/` | Completed instances move here |

> [!NOTE]
> These folders are created automatically when you first use the plugin.

---

## Creating a Template

### Using the Dashboard

1. Open Command Palette (`Ctrl/Cmd + P`)
2. Run **Quest Board: Recurring Quests Dashboard**
3. View existing templates and their status
4. Click the folder path to open templates folder

### Manual Creation

Create a `.md` file in the templates folder:

```markdown
---
questName: "Daily Wellness - {{date}}"
recurrence: daily
category: wellness
priority: medium
xpPerTask: 5
completionBonus: 15
---

## Morning Routine
- [ ] Take vitamins
- [ ] 5-minute stretch
- [ ] Drink water

## Evening Routine
- [ ] Review the day
- [ ] Set tomorrow's priorities
```

---

## Template Fields

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `questName` | Display name (supports placeholders) | `"Weekly Review - {{date}}"` |
| `recurrence` | When to generate instances | `daily`, `weekdays`, `monday, friday` |

### Optional Fields

| Field | Default | Description |
|-------|---------|-------------|
| `category` | `general` | Category for filtering |
| `priority` | `medium` | `low`, `medium`, `high`, `critical` |
| `xpPerTask` | `5` | XP earned per task |
| `completionBonus` | `15` | Bonus XP when all tasks are done |

---

## Recurrence Rules

Quest Board supports flexible scheduling:

### Simple Keywords

| Value | Meaning |
|-------|---------|
| `daily` | Every day |
| `weekdays` | Monday through Friday |
| `weekends` | Saturday and Sunday |
| `weekly` | Every Monday (default) |
| `monthly` | 1st of each month |

### Specific Days

| Value | Meaning |
|-------|---------|
| `weekly:sunday` | Every Sunday |
| `weekly:thursday` | Every Thursday |
| `monday, wednesday, friday` | MWF schedule |
| `tue, thu` | Tuesdays and Thursdays |
| `sat` | Every Saturday |

> [!TIP]
> Use three-letter abbreviations (`mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`) or full names—both work!

---

## Placeholders

Use placeholders in your `questName` to include the date:

| Placeholder | Output Example |
|-------------|----------------|
| `{{date}}` | `2026-01-27` |
| `{{date_slug}}` | `20260127` |

### Example

Template:
```yaml
questName: "Weekly Review - {{date}}"
recurrence: weekly:friday
```

Generated instance on Friday, Jan 31:
- Quest name: `Weekly Review - 2026-01-31`
- File: `Weekly Review - 2026-01-31.md`

---

## The Dashboard

Access via **Quest Board: Recurring Quests Dashboard**:

| Column | Description |
|--------|-------------|
| **Template** | Name and category |
| **Schedule** | Human-readable schedule (e.g., "Weekdays (Mon-Fri)") |
| **Next Run** | When the next instance generates |
| **Today** | Current status |

### Status Indicators

| Status | Meaning |
|--------|---------|
| ✅ Generated | Today's instance was already created |
| ⏳ Pending | Scheduled for today, waiting to generate |
| ⏸ Not today | Not scheduled for today |

### Process Now Button

Click **🔄 Process Now** to:
- Archive yesterday's completed recurring quests
- Generate any missing instances for today

> [!NOTE]
> Processing happens automatically on plugin load and at 1:00 AM daily.

---

## Generated Instance Format

When an instance is generated, it includes extra frontmatter for tracking:

```yaml
---
schemaVersion: 1
questId: "daily-wellness-2026-01-27"
questName: "Daily Wellness - 2026-01-27"
questType: main
category: wellness
status: available
priority: medium
tags:
  - recurring
createdDate: 2026-01-27T07:00:00.000Z
linkedTaskFile: "Life/Quest Board/quests/recurring/Daily Wellness - 2026-01-27.md"
xpPerTask: 5
completionBonus: 15
visibleTasks: 4
recurrence: daily
recurringTemplateId: daily-wellness
instanceDate: 2026-01-27
---
```

Key tracking fields:
- `recurringTemplateId` – Links back to the template
- `instanceDate` – Which day this instance was generated for
- `tags: [recurring]` – Identifies it as a recurring quest

---

## Archiving

Completed recurring quests are automatically archived:

1. When the next day begins, the plugin checks yesterday's recurring quests
2. Any with `status: completed` are moved to `archive/YYYY-MM/`
3. This keeps your `quests/recurring/` folder clean

### Archive Structure

```
Life/Quest Board/quests/archive/
├── 2026-01/
│   ├── Daily Wellness - 2026-01-25.md
│   ├── Daily Wellness - 2026-01-26.md
│   └── Weekly Review - 2026-01-24.md
└── 2026-02/
    └── ...
```

---

## Example Templates

### Daily Habits

```markdown
---
questName: "Morning Routine - {{date}}"
recurrence: daily
category: wellness
priority: high
xpPerTask: 5
completionBonus: 20
---

## Wake Up
- [ ] No snooze button
- [ ] Make the bed
- [ ] Drink a glass of water

## Get Ready
- [ ] Shower
- [ ] Get dressed
- [ ] Breakfast
```

### Work Week Standup

```markdown
---
questName: "Standup Prep - {{date}}"
recurrence: weekdays
category: work
priority: medium
xpPerTask: 3
completionBonus: 10
---

## Standup Notes
- [ ] What I did yesterday
- [ ] What I'm doing today
- [ ] Any blockers?
```

### Weekly Review

```markdown
---
questName: "Weekly Review - {{date}}"
recurrence: weekly:sunday
category: admin
priority: high
xpPerTask: 10
completionBonus: 50
---

## Reflect
- [ ] Review completed quests
- [ ] Update project notes
- [ ] Clear inbox to zero

## Plan
- [ ] Set 3 priorities for next week
- [ ] Schedule focused work blocks
- [ ] Review upcoming deadlines
```

### Monthly Planning

```markdown
---
questName: "Monthly Planning - {{date}}"
recurrence: monthly
category: admin
priority: critical
xpPerTask: 15
completionBonus: 75
---

## Review Last Month
- [ ] Check goal progress
- [ ] Review spending/budget
- [ ] Celebrate wins!

## Plan This Month
- [ ] Set 3 major goals
- [ ] Schedule important dates
- [ ] Update roadmaps
```

### Custom Days (Gym Schedule)

```markdown
---
questName: "Gym Day - {{date}}"
recurrence: monday, wednesday, friday
category: fitness
priority: medium
xpPerTask: 8
completionBonus: 25
---

## Workout
- [ ] Warm up (5 min)
- [ ] Main workout (30 min)
- [ ] Cool down & stretch
- [ ] Log weights/reps
```

---

## Best Practices

### Keep Templates Focused
✅ One template per habit or routine
❌ Giant templates with 50 tasks

### Use Meaningful Names
✅ `Daily Wellness - {{date}}`
✅ `Weekly Review - {{date}}`
❌ `Tasks`
❌ `Stuff to do`

### Balance XP Values
- Quick daily tasks: 3–5 XP each
- Weekly substantial tasks: 10–15 XP each
- Monthly big tasks: 15–25 XP each

### Review Periodically
- If you're skipping a recurring quest often, consider:
  - Breaking it into smaller pieces
  - Changing the schedule
  - Removing it entirely (no guilt!)

---

## Troubleshooting

### Template Not Generating

1. **Check the folder**: Template must be in `System/Templates/Quest Board/Recurring Quests/`
2. **Check frontmatter**: Must have `questName` and `recurrence` fields
3. **Check recurrence rule**: Use the dashboard to verify the schedule is valid

### Duplicate Instances

This shouldn't happen—the plugin checks for existing instances before generating. If it does:
1. Delete the duplicate manually
2. Report the bug with details about your template

### Yesterday's Quest Not Archived

Archives only move quests with `status: completed`. If it wasn't completed:
- It stays in `quests/recurring/` until you complete it
- Complete it manually, then run **Process Now** to archive

---

## See Also

- [[Quest System]] – Full quest documentation
- [[Getting Started]] – Installation and first steps
- [[Character Classes]] – Category bonuses for wellness, work, fitness, etc.

---

**Build habits, earn XP, level up your life!** 🔄
