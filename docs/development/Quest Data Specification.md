# Quest Board - Quest Data Specification

**Purpose:** Complete reference for quest file formats and manual editing

---

## Table of Contents

1. [File Structure](#file-structure)
2. [Manual Quest Format (Markdown)](#manual-quest-format-markdown)
3. [AI-Generated Quest Format (JSON)](#ai-generated-quest-format-json)
4. [Task File Linking](#task-file-linking)
5. [Training Mode Quests](#training-mode-quests)
6. [Manual Editing Guide](#manual-editing-guide)
7. [Common Errors & Fixes](#common-errors--fixes)

---

## File Structure

All quest files live in: `Life/Quest Board/`

```
Life/Quest Board/
├── quests/
│   ├── main/              # Main questline quests
│   ├── training/          # Training mode (Roman numerals)
│   └── ai-generated/      # AI-created quests
└── templates/             # Reusable quest templates
```

**Plugin State Storage:**
- Character data (XP, level, achievements, inventory) is stored via Obsidian's `loadData()`/`saveData()` API
- This data lives in `.obsidian/plugins/quest-board/data.json`
- This approach is safer than hidden folders (won't be lost during vault moves)

**File Formats:**
- **Manual Quests:** Markdown with frontmatter (easy to read/edit)
- **AI-Generated Quests:** JSON files (structured, parseable)
- **Both:** Manually editable via File Explorer

---

## Manual Quest Format (Markdown)

**File:** `quests/main/bureaucratic-labyrinth.md`

```markdown
---
schemaVersion: 1
questId: bureaucratic-labyrinth
questName: "The Bureaucratic Labyrinth"
questType: main
category: admin
linkedTaskFile: System/Task Management/To-Dos/Admin.md
xpPerTask: 5
completionBonus: 30
priority: high
visibleTasks: 4
status: in-progress
createdDate: 2026-01-22
tags:
  - adulting
  - paperwork
  - responsibility
---

# The Bureaucratic Labyrinth

**Description:**
Navigate the treacherous halls of adult responsibility. Bills, forms, emails, and endless paperwork await. Only the most organized adventurers survive.

**Goal:**
Complete all administrative tasks to maintain order in the realm of adulthood.

**Milestones:**
- [ ] First Blood: Complete 5 admin tasks (50 XP)
- [ ] Paper Trail: Complete 15 admin tasks (100 XP)
- [ ] Master Administrator: Complete 30 admin tasks (150 XP + Achievement)

**Boss Fights:**
- TBD (Plugin may auto-detect major tasks)

**Rewards:**
- **On completion:** "Organized Adult" achievement
- **Hidden:** Time Management perk unlocked at 20 tasks

**Notes:**
This is a recurring quest - admin tasks never truly end. Each completion cycle earns the full bonus.
```

### Frontmatter Field Reference

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `schemaVersion` | ✅ | number | Schema version for future migrations (always 1 for now) |
| `questId` | ✅ | string | Unique identifier (kebab-case) |
| `questName` | ✅ | string | Display name (can include emoji/formatting) |
| `questType` | ✅ | enum | `main`, `training`, `side`, `ai-generated` |
| `category` | ✅ | string | Category for filtering (admin, shopping, school, etc.) |
| `linkedTaskFile` | ✅ | string | Path to markdown file with tasks (validated within vault) |
| `xpPerTask` | ✅ | number | XP awarded per task completion |
| `completionBonus` | ✅ | number | Bonus XP on quest completion |
| `priority` | ❌ | enum | `low`, `medium`, `high` |
| `visibleTasks` | ❌ | number | How many future tasks to show (default: 4) |
| `status` | ❌ | enum | `available`, `in-progress`, `active`, `completed` |
| `createdDate` | ❌ | date | ISO 8601 format |
| `completedDate` | ❌ | date | ISO 8601 format (null until completed) |
| `tags` | ❌ | array | Freeform tags for filtering |

---

## AI-Generated Quest Format (JSON)

**File:** `quests/ai-generated/student-loan-saga-20260122.json`

```json
{
  "schemaVersion": 1,
  "questId": "student-loan-saga-20260122",
  "questName": "The Student Loan Saga",
  "questType": "ai-generated",
  "category": "finance",
  "createdDate": "2026-01-22T10:30:00Z",
  "status": "available",
  "description": "Navigate the labyrinth of student loan paperwork, refunds, and financial aid offices. Your quest: secure the funds and emerge victorious.",
  "goal": "Successfully obtain and manage student loan refund process",
  "difficulty": "medium",
  "estimatedDuration": "2 weeks",
  "xpTotal": 450,
  "visibleTasks": 3,
  "milestones": [
    {
      "id": 1,
      "title": "The Form Quest",
      "description": "Complete and submit the financial aid form",
      "xp": 50,
      "revealed": true,
      "tasks": [
        "Find old form for reference",
        "Fill out new form",
        "Submit form by Tuesday"
      ]
    },
    {
      "id": 2,
      "title": "The Waiting Game",
      "description": "Follow up with financial aid office",
      "xp": 75,
      "revealed": false,
      "tasks": [
        "Call financial aid office for timeline",
        "Document refund date",
        "Plan bill payments around refund"
      ]
    },
    {
      "id": 3,
      "title": "Boss Fight: The Refund",
      "description": "Receive and allocate the refund properly",
      "xp": 150,
      "isBossFight": true,
      "revealed": false,
      "tasks": [
        "Confirm refund received",
        "Pay outstanding bills",
        "Set aside emergency fund"
      ]
    }
  ],
  "hiddenRewards": [
    {
      "trigger": "complete milestone 2",
      "reward": "Financial Planning Perk",
      "description": "+10% XP on all finance quests",
      "revealed": false
    },
    {
      "trigger": "defeat boss fight",
      "reward": "Fiscal Responsibility Badge",
      "description": "Achievement unlocked",
      "revealed": false
    }
  ],
  "gearRewards": [
    {
      "name": "Budget Planner Template",
      "description": "Unlock budget planning tools",
      "triggerMilestone": 3
    }
  ],
  "notes": "AI-generated quest. Editable via File Explorer if needed."
}
```

### JSON Field Reference

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `schemaVersion` | ✅ | number | Schema version for future migrations (always 1 for now) |
| `questId` | ✅ | string | Unique ID (kebab-case + timestamp) |
| `questName` | ✅ | string | Display name |
| `questType` | ✅ | string | Always "ai-generated" |
| `category` | ✅ | string | Category for filtering |
| `description` | ✅ | string | Quest flavor text |
| `goal` | ✅ | string | What constitutes completion |
| `difficulty` | ✅ | enum | `easy`, `medium`, `hard`, `epic` |
| `estimatedDuration` | ✅ | string | Human-readable time estimate |
| `xpTotal` | ✅ | number | Total XP available (sum of milestones) |
| `visibleTasks` | ✅ | number | How many tasks ahead shown |
| `milestones` | ✅ | array | Quest stages (see below) |
| `hiddenRewards` | ❌ | array | Surprise unlocks |
| `gearRewards` | ❌ | array | Equipment unlocks |
| `notes` | ❌ | string | Internal notes |

**Milestone Object:**
```json
{
  "id": 1,
  "title": "Milestone Name",
  "description": "What this stage involves",
  "xp": 50,
  "revealed": true,          // User can see this milestone
  "isBossFight": false,
  "tasks": ["Task 1", "Task 2"]
}
```

---

## Task File Linking

Quest files point to task files. Task files confirm the link.

### Quest File (Frontmatter)
```yaml
---
linkedTaskFile: System/Task Management/To-Dos/Admin.md
xpPerTask: 5
---
```

### Task File (Frontmatter)
```yaml
---
quest: bureaucratic-labyrinth
questXP: 5
---

## Tasks

- [ ] Pay car insurance
- [ ] Submit financial aid form
- [ ] Call mortgage company
- [x] File taxes (5 XP earned!)
```

**How it works:**
1. Plugin reads quest file, finds `linkedTaskFile`
2. Plugin reads task file, scans for `- [ ]` and `- [x]` tasks
3. Each time a task is checked off, plugin awards `xpPerTask`
4. When all tasks complete, plugin awards `completionBonus`
5. Quest status changes to "completed"

**Bidirectional confirmation:**
- Quest knows where to find tasks (`linkedTaskFile`)
- Task file knows which quest it belongs to (`quest`)
- If either is missing, plugin warns but doesn't break

---

## Training Mode Quests

**Purpose:** Test mechanics without affecting real progression.

**Location:** `quests/training/`

**Example:** `training-i.md`

```markdown
---
questId: training-i
questName: "Training Quest I: The Basics"
questType: training
category: tutorial
linkedTaskFile: Life/Quest Board/training-tasks.md
xpPerTask: 3
completionBonus: 15
trainingLevel: I
status: available
---

# Training Quest I: The Basics

**Description:**
Welcome, adventurer! This is your first quest. Complete these simple tasks to learn how the system works.

**Goal:**
Complete 5 basic tasks to graduate from Training Level I.

**Tasks (in linked file):**
- Make dinner
- Take Obi to dog park
- Do laundry
- Tutorial task: Test the XP system
- Tutorial task: Check off this task

**Rewards:**
- 15 XP completion bonus
- Advance to Training Level II
```

**Training Task File:** `Life/Quest Board/training-tasks.md`

```markdown
---
quest: training-i
questXP: 3
---

## Training Quest I Tasks

- [ ] Make dinner tonight
- [ ] Take Obi to dog park
- [ ] Do laundry
- [ ] Tutorial: Test the XP system (check this off!)
- [ ] Tutorial: Watch XP increase

---

## Training Quest II Tasks

- [ ] ...
```

**Training XP Pool:**
- Separate from main game XP
- Shows as "Training Level I" (Roman numerals)
- After Training IV complete, user "graduates" to Level 1 (real game)
- Training XP does NOT carry over

---

## Manual Editing Guide

### Safe to Edit

**Manual Quest Files (Markdown):**
✅ Quest name, description, notes
✅ Milestone text
✅ Boss fight descriptions
✅ Tags, priority
✅ XP values (xpPerTask, completionBonus)
✅ Visible tasks count

**AI Quest Files (JSON):**
✅ Quest name (`questName`)
✅ Description, goal
✅ Milestone titles and descriptions
✅ XP values
✅ Difficulty rating
✅ Notes field

**Task Files:**
✅ Task text
✅ Check/uncheck tasks
✅ Add new tasks
✅ Quest XP value in frontmatter

### DO NOT Edit (Will Break Plugin)

❌ **questId** - Plugin uses this to link data
❌ **questType** - Determines which parser to use
❌ **File names** - Plugin indexes by filename
❌ **Milestone IDs** - Used for progress tracking
❌ **JSON structure** - Must remain valid JSON

### Editing Workflow

#### Via Obsidian (Recommended for Markdown)

1. Open quest file in Obsidian
2. Edit text, XP values, descriptions as needed
3. Save (Ctrl+S)
4. Plugin auto-reloads quest data

#### Via File Explorer (For JSON or Advanced Edits)

1. Navigate to `G:\My Drive\IT\Obsidian Vault\My Notebooks\Life\Quest Board\`
2. Right-click quest file → Open with Notepad++ / VS Code
3. Make edits carefully (preserve JSON structure!)
4. Save file
5. Reload Obsidian or use Command Palette: "Quest Board: Reload Quests"

#### Backup First!

Before major edits:
1. Copy quest file
2. Paste with `_backup` suffix
3. Edit original
4. If broken, restore from backup

---

## Common Errors & Fixes

### Error: "Quest file invalid JSON"

**Problem:** Syntax error in JSON file

**Fix:**
1. Open file in VS Code or Notepad++
2. Look for:
   - Missing comma between fields
   - Extra comma at end of array/object
   - Unclosed quotes or brackets
3. Use JSON validator: jsonlint.com
4. Fix error, save, reload

**Example Bad JSON:**
```json
{
  "questName": "Test Quest"
  "category": "admin"  // Missing comma!
}
```

**Example Good JSON:**
```json
{
  "questName": "Test Quest",
  "category": "admin"
}
```

### Error: "Linked task file not found"

**Problem:** `linkedTaskFile` path is wrong or file was moved

**Fix:**
1. Check path in quest frontmatter
2. Verify file exists at that path
3. Update `linkedTaskFile` to correct path
4. Reload plugin

### Error: "Milestone not revealed"

**Problem:** User can't see next milestone (this is intentional!)

**Fix:**
1. Complete current milestone
2. Next milestone auto-reveals
3. To manually reveal: Edit JSON, set `"revealed": true`

### Error: "XP not updating"

**Problem:** Task completion not triggering XP gain

**Possible causes:**
1. Task file doesn't have `quest` field in frontmatter
2. `questXP` value is 0 or missing
3. Plugin needs reload

**Fix:**
1. Check task file frontmatter has `quest: [quest-id]`
2. Check task file frontmatter has `questXP: [number]`
3. Reload plugin: Command Palette → "Quest Board: Reload Quests"

### Error: "Training XP counting toward main game"

**Problem:** Training quest marked as `questType: main`

**Fix:**
1. Edit quest file
2. Change `questType: main` to `questType: training`
3. Reload plugin

---

## Best Practices

### Quest File Organization

✅ **DO:**
- Use descriptive quest IDs (`bureaucratic-labyrinth`, not `quest1`)
- Keep quest names fun and engaging
- Include notes field for context
- Set realistic XP values (test and adjust)

❌ **DON'T:**
- Use special characters in questId (breaks file paths)
- Set absurdly high XP (breaks leveling curve)
- Delete quest files while in use (corrupts progress data)
- Edit while plugin is actively processing (race condition)

### XP Balancing

**Rule of thumb:**
- Simple task (5 min): 5-10 XP
- Medium task (30 min): 15-30 XP
- Complex task (2 hours): 50-75 XP
- Boss fight (major milestone): 100-200 XP

**Completion bonuses:**
- Short quest (3-5 tasks): 20-30 XP
- Medium quest (10-15 tasks): 50-75 XP
- Long quest (20+ tasks): 100-150 XP

### Milestone Design

**Good milestone:**
- Clear, achievable goal
- Reveals at appropriate time
- Meaningful reward
- Not too many (3-5 per quest ideal)

**Bad milestone:**
- Vague goal ("Do stuff")
- Too granular (1 milestone per task)
- Reveals everything upfront (ruins surprise)

---

## Quest Templates

### Manual Quest Template

**File:** `templates/manual-quest-template.md`

```markdown
---
schemaVersion: 1
questId: [unique-id]
questName: "[Display Name]"
questType: main
category: [category]
linkedTaskFile: [path/to/tasks.md]
xpPerTask: [number]
completionBonus: [number]
priority: medium
visibleTasks: 4
status: available
createdDate: [YYYY-MM-DD]
tags:
  - [tag1]
  - [tag2]
---

# [Quest Name]

**Description:**
[Flavor text describing the quest]

**Goal:**
[What constitutes completion]

**Milestones:**
- [ ] [Milestone 1]: [Description] ([XP] XP)
- [ ] [Milestone 2]: [Description] ([XP] XP)

**Boss Fights:**
- TBD or [Specific challenge]

**Rewards:**
- [Reward 1]
- [Reward 2]

**Notes:**
[Any additional context]
```

### AI Quest Schema Template

**File:** `templates/ai-quest-schema.json`

```json
{
  "schemaVersion": 1,
  "questId": "",
  "questName": "",
  "questType": "ai-generated",
  "category": "",
  "description": "",
  "goal": "",
  "difficulty": "medium",
  "estimatedDuration": "",
  "xpTotal": 0,
  "visibleTasks": 3,
  "milestones": [
    {
      "id": 1,
      "title": "",
      "description": "",
      "xp": 0,
      "revealed": true,
      "isBossFight": false,
      "tasks": []
    }
  ],
  "hiddenRewards": [],
  "gearRewards": [],
  "notes": ""
}
```

---

## Advanced: Modifying Plugin Data

**⚠️ WARNING:** Editing plugin data directly can corrupt your progress. Only do this if you know what you're doing.

### Plugin State (loadData/saveData)

**Location:** `.obsidian/plugins/quest-board/data.json`

This file contains character data, achievements, inventory, and UI preferences. It's managed by Obsidian's `loadData()`/`saveData()` API.

```json
{
  "settings": {
    "geminiApiKey": "...",
    "storageFolder": "Life/Quest Board",
    "weeklyGoal": 8
  },
  "character": {
    "name": "Brad",
    "class": "paladin",
    "level": 5,
    "totalXP": 1250,
    "spriteVersion": 3
  },
  "achievements": [
    {
      "id": "first-quest",
      "name": "First Quest Complete",
      "dateUnlocked": "2026-01-22T10:00:00Z"
    }
  ],
  "inventory": [],
  "uiState": {
    "activeTab": "board",
    "filters": {}
  }
}
```

**Safe to edit (carefully):**
- `character.name` (change display name)
- `uiState` (reset UI preferences)
- `achievements` (add/remove for testing)

**DO NOT edit:**
- `character.totalXP` or `character.level` (can desync state)
- `settings.geminiApiKey` (use Settings tab instead)

---

**Last Updated:** 2026-01-18

**Links:** [[Project Summary]] | [[Feature Priority List]] | [[CLAUDE.md]]
