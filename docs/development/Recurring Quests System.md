# Recurring Quests System

Technical reference for the Quest Board recurring quests feature.

---

## Overview

Recurring quests are auto-generated daily/weekly/monthly from templates. The system runs:
- **On plugin startup** (2-second delay)
- **Daily at 1am** (if Obsidian is running)

---

## Folder Structure

| Folder | Purpose |
|--------|---------|
| `System/Templates/Quest Board/Recurring Quests/` | Template files |
| `Life/Quest Board/quests/recurring/` | Generated quest instances |
| `Life/Quest Board/quests/archive/YYYY-MM/` | Archived completed quests |

---

## Template Format

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
- [ ] Task 1
- [ ] Task 2
```

### Required Fields
- `questName` - Include `{{date}}` for the date to be inserted
- `recurrence` - See syntax below

### Optional Fields
- `category` (default: "general")
- `priority` (default: "medium")
- `xpPerTask` (default: 5)
- `completionBonus` (default: 15)

---

## Recurrence Syntax

| Value | Meaning |
|-------|---------|
| `daily` | Every day |
| `weekdays` | Monday-Friday |
| `weekends` | Saturday-Sunday |
| `weekly` | Every Monday (default) |
| `weekly:sunday` | Every Sunday |
| `weekly:thursday` | Every Thursday |
| `monthly` | 1st of each month |
| `monday, wednesday, friday` | Specific days |
| `tue, thu` | Short names work |

---

## Archiving Rules

**Condition for archiving:**
1. Quest's `instanceDate` = yesterday
2. Quest's `status` = completed

**If not completed:** Quest stays in `/recurring/` folder indefinitely.

**Archive location:** `quests/archive/YYYY-MM/` (organized by month)

---

## Placeholders

Used in templates, replaced when quest is generated:

| Placeholder | Example Output |
|-------------|----------------|
| `{{date}}` | 2026-01-20 |
| `{{date_slug}}` | 20260120 |
| `{{output_path}}` | Full path to generated file |

---

## Key Files to Modify

### Change folder locations
File: `src/services/RecurringQuestService.ts` (lines 48-50)
```typescript
const RECURRING_TEMPLATES_FOLDER = 'System/Templates/Quest Board/Recurring Quests';
const RECURRING_QUESTS_FOLDER = 'Life/Quest Board/quests/recurring';
const ARCHIVE_FOLDER = 'Life/Quest Board/quests/archive';
```

### Change 1am trigger time
File: `main.ts` (line 49)
```typescript
if (currentHour === 1 && this.lastRecurrenceCheckHour !== 1) {
```
Change `1` to desired hour (0-23).

### Change archive timing
File: `src/services/RecurringQuestService.ts`, `archiveCompletedQuests()` method
Currently archives yesterday's quests. To archive older:
```typescript
// Change this:
const yesterday = this.getYesterdayDate();
// To archive quests older than 2 days:
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const archiveDate = twoDaysAgo.toISOString().split('T')[0];
```

### Add new recurrence keyword
File: `src/services/RecurringQuestService.ts`, `parseRecurrenceDays()` method
Add new case in the switch:
```typescript
if (normalized === 'biweekly') {
    // Custom logic for bi-weekly
}
```

---

## Commands

| Command | What it does |
|---------|--------------|
| Recurring Quests Dashboard | View templates and their status |
| Process Recurring Quests Now | Manually trigger generation + archiving |

---

## Troubleshooting

**Quest not generating:**
- Check `recurrence` value in template frontmatter
- Verify today matches the schedule (use Dashboard to confirm)
- Check console for errors (`Ctrl+Shift+I`)

**Quest not archiving:**
- Must have `status: completed` in frontmatter
- Must be from yesterday (not today or older than 1 day)

**Dashboard shows "Templates folder not found":**
- Create folder: `System/Templates/Quest Board/Recurring Quests`
