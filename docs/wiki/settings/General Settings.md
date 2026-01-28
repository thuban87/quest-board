# General Settings

This page covers the core gameplay settings that affect your daily Quest Board experience.

---

## Weekly Quest Goal

| Setting | Range | Default |
|---------|-------|---------|
| Weekly Quest Goal | 1–20 | 8 |

The target number of quests to complete each week. This powers the sprint progress tracking and influences achievement triggers.

**Recommendations:**
| Playstyle | Suggested Goal |
|-----------|----------------|
| Light user (weekends only) | 2–4 |
| Regular user | 6–10 |
| Power user | 12–20 |

> [!TIP]
> Start modest and increase over time. Consistently hitting your goal is more motivating than constantly falling short!

---

## Training Mode

| Setting | Options | Default |
|---------|---------|---------|
| Training Mode | On/Off | On |

Training Mode provides a **separate XP pool** with Roman numeral levels (I–X). This lets you learn the mechanics without affecting your "real" character progression.

### How It Works

1. **New characters start in Training Mode** (levels I through X)
2. Training XP is **75 XP per level** (lower than real mode)
3. At level X, you're ready to graduate
4. **Disabling Training Mode** graduates you to Level 1

### Graduation

When you turn off Training Mode:
- Your level resets to **1**
- Your XP resets to **0**
- All achievements, inventory, and gear are **kept**
- You now use the standard XP curve (age-based thresholds up to level 40)

> [!IMPORTANT]
> Graduation is a **one-way transition**. You can re-enable Training Mode afterward, but you'll restart at Training Level I.

### When to Graduate

Graduate when:
- ✅ You understand quest creation and task linking
- ✅ You've experimented with gear and combat
- ✅ You're ready for the full progression curve
- ✅ You've reached level X and want to continue

---

## Streak Mode

| Setting | Options | Default |
|---------|---------|---------|
| Streak Mode | Quest / Task | Quest |

Determines what activity maintains your daily streak.

### Quest Mode (Default)
- Complete **at least 1 full quest** per day
- More demanding, but encourages finishing what you start
- Best for users who complete bigger projects

### Task Mode
- Complete **any single task** from any quest
- Lower barrier, easier to maintain
- Best for users who work on many quests simultaneously

> [!TIP]
> **ADHD tip:** Start with Task Mode to build the habit, then switch to Quest Mode once you're comfortable.

### Streak Protection

**Paladin class perk:** Once per week, the Paladin Shield protects your streak if you miss a day. This resets every Monday.

---

## Bounty Chance

| Setting | Range | Default |
|---------|-------|---------|
| Bounty Chance | 0–100% | 10% |

The probability of a **bounty fight** triggering when you complete a quest.

### How Bounties Work

1. Complete a quest (any difficulty above trivial)
2. Roll against your bounty chance
3. If triggered, a **themed monster** appears based on your quest folder
4. Defeat the monster for **bonus XP and loot**
5. If you lose, you enter recovery mode

### Recommended Values

| Playstyle | Bounty Chance |
|-----------|---------------|
| Minimal combat | 0% (disabled) |
| Occasional battles | 5–10% |
| Combat focused | 15–25% |
| Testing | 50–100% |

> [!NOTE]
> Bounties only trigger for quests with difficulty **easy or higher**. Trivial quests never spawn bounties.

### Monster Matching

The plugin picks monsters based on quest folder keywords:

| Quest Folder | Example Monsters |
|--------------|------------------|
| Work | Cave Troll, Goblin Bruiser |
| Fitness | Dire Wolf, Forest Elemental |
| Study | Shadow Wisp, Dark Scholar |

If no keywords match, a random monster appears.

---

## Excluded Folders

| Setting | Format | Default |
|---------|--------|---------|
| Excluded Folders | Comma-separated | (none) |

Folders to **hide from the Kanban board** while still indexing their quests for XP calculations.

**Use cases:**
- Hide archived quests
- Hide completed folders
- Hide template folders

**Example:** `archive, completed, templates, inbox`

> [!NOTE]
> Excluded quests still count toward achievements and stat growth. They're just visually hidden from the board.

---

## Archive Folder

| Setting | Format | Default |
|---------|--------|---------|
| Archive Folder | Path | `quests/archive` |

Where completed quests are moved when archived. Path is **relative to your storage folder**.

---

## Default Quest Tags

| Setting | Format | Default |
|---------|--------|---------|
| Default Quest Tags | Comma-separated | (none) |

Tags to automatically add when creating new quests via the modal.

**Example:** `quest, active, 2026`

---

## Enable Daily Note Logging

| Setting | Options | Default |
|---------|---------|---------|
| Daily Note Logging | On/Off | On |

When enabled, quest completions are logged to your daily notes (if you use the Daily Notes core plugin or similar).

---

## See Also

- [[Settings Overview]] – All settings at a glance
- [[Gear Settings]] – Loot configuration
- [[Combat Guide]] – Battle mechanics
- [[Character Classes]] – Class perks and bonuses

---

**Pro tip:** Start with defaults and adjust as you learn your play style!
