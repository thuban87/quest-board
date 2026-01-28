# Settings Overview

Quest Board's settings are accessible via `Settings → Quest Board`. This page provides a high-level overview of all configuration options, organized by category.

---

## Settings Categories

| Category | Purpose |
|----------|---------|
| [AI Integration](#ai-integration) | Gemini API key for AI-powered features |
| [Storage](#storage) | Folder paths for quests and assets |
| [Quest Folder Settings](#quest-folder-settings) | Excluded folders and archive location |
| [Dungeon Configuration](#dungeon-configuration) | Custom dungeon folder and templates |
| [Template Configuration](#template-configuration) | Quest template folder and default tags |
| [Game Settings](#game-settings) | Weekly goals, training mode, streak, bounty |
| [Quest → Gear Slot Mapping](#quest--gear-slot-mapping) | Loot table customization |
| [Set Bonus Configuration](#set-bonus-configuration) | Folder exclusions for gear sets |
| [Custom Stat Mappings](#custom-stat-mappings) | Category-to-stat relationships |
| [Debug](#debug) | Data reset and AI testing tools |

---

## Quick Reference

### Essential Settings

Most users only need to configure these:

| Setting | Default | Description |
|---------|---------|-------------|
| Quest Storage Folder | `Life/Quest Board` | Where quest files live |
| Weekly Quest Goal | 8 | Target quests per week |
| Streak Mode | Quest | What maintains your streak |
| Training Mode | Enabled | Separate XP pool for new players |

### Optional Features

| Setting | When to Configure |
|---------|-------------------|
| Gemini API Key | To enable AI-generated bounty descriptions and set bonuses |
| Custom Stat Mappings | When using categories not tied to a class |
| Quest Slot Mapping | To control which gear drops from quest types |

---

## AI Integration

Configure Gemini API for AI-powered features.

| Setting | Description |
|---------|-------------|
| **Gemini API Key** | Required for AI bounty descriptions and set bonus generation. Get one at [makersuite.google.com](https://makersuite.google.com). |

> [!NOTE]
> AI integration is **optional**. The plugin works fully without it—AI features simply won't generate content automatically.

See [[API Settings]] for detailed configuration.

---

## Storage

Configure where Quest Board stores its data.

| Setting | Default | Description |
|---------|---------|-------------|
| **Quest Storage Folder** | `Life/Quest Board` | Root folder for quests and assets |
| **Sprite Folder** | `Life/Quest Board/assets/sprites/paladin` | Path to character sprites (must contain `south.png`) |

> [!TIP]
> The plugin creates the folder structure automatically on first launch. You can move it later, but update this setting to match.

---

## Quest Folder Settings

Control which folders appear on the Kanban board.

| Setting | Default | Description |
|---------|---------|-------------|
| **Excluded Folders** | (none) | Comma-separated folder names to hide from Kanban (quests still indexed for XP) |
| **Archive Folder** | `quests/archive` | Where completed quests are moved (relative to storage folder) |

**Example exclusions:** `archive, completed, templates`

---

## Dungeon Configuration

Settings for dungeon exploration.

| Setting | Default | Description |
|---------|---------|-------------|
| **User Dungeon Folder** | `Life/Quest Board/dungeons` | Folder for custom dungeon markdown files |
| **Create Template** | (button) | Creates a format guide in your dungeon folder |

See [[Custom Dungeons]] for how to create your own dungeons.

---

## Template Configuration

Settings for quest templates and defaults.

| Setting | Default | Description |
|---------|---------|-------------|
| **Template Folder** | `Quest Board/templates` | Folder containing quest templates |
| **Default Quest Tags** | (none) | Tags added automatically to new quests |
| **Enable Daily Note Logging** | Enabled | Log quest completions to daily notes |

See [[Recurring Quests]] for template format details.

---

## Game Settings

Core gameplay configuration.

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| **Weekly Quest Goal** | 1–20 | 8 | Target quests per week for sprint tracking |
| **Training Mode** | On/Off | On | Separate XP pool with Roman numeral levels (I–X) |
| **Streak Mode** | Quest/Task | Quest | What counts for daily streak |
| **Bounty Chance** | 0–100% | 10% | Chance for combat encounter on quest completion |

> [!IMPORTANT]
> **Training Mode graduation:** Disabling Training Mode graduates your character to Level 1 with a fresh XP pool. Your training progress is not lost—it prepared you for the real adventure!

See [[General Settings]] for detailed explanations.

---

## Quest → Gear Slot Mapping

Control which gear slots can drop from each quest type.

| Quest Type | Default Slots |
|------------|---------------|
| Main | Chest, Weapon, Head |
| Side | Legs, Boots, Shield |
| Training | Head, Shield |
| Guild | Chest, Legs |
| Recurring | Boots, Accessory1 |
| Daily | (no gear drops) |

**Customization:**
- Edit existing mappings inline
- Add custom quest type folders (e.g., `fitness`, `work`)
- Leave slots empty to disable gear drops for that type

See [[Gear Settings]] for complete loot configuration.

---

## Set Bonus Configuration

Control which folder-based sets are eligible for set bonuses.

| Setting | Default | Description |
|---------|---------|-------------|
| **Excluded Folders** | `main, side, training, recurring, daily` | Folders that don't form gear sets |

Gear from excluded folders has **no set membership**. This prevents generic quest types from creating set bonuses.

> [!TIP]
> Create a `fitness/` quest folder, and gear dropped from fitness quests will belong to the "Fitness" set with AI-generated bonuses!

---

## Custom Stat Mappings

Map your categories to character stats for XP bonuses.

### Default Class Mappings

Each class has built-in category mappings (15% XP bonus):

| Class | Categories → Stats |
|-------|-------------------|
| Warrior | admin → Strength |
| Scholar | study → Intelligence |
| Cleric | wellness → Wisdom |
| Technomancer | development → Dexterity |
| Bard | social → Charisma |

### Adding Custom Mappings

1. Select from known categories (auto-populated from your quests)
2. Or type a new category name
3. Choose which stat it maps to
4. Completing quests with that category feeds stat growth

---

## Debug

Tools for troubleshooting and testing.

| Action | Effect |
|--------|--------|
| **Reset Stats Only** | Clears stat bonuses, category XP, and streak (keeps level and achievements) |
| **Reset All Data** | ⚠️ Deletes character, achievements, and inventory |
| **Test Set Bonus Generation** | Tests Gemini API with a sample set name |
| **Show Cache Status** | View cached set bonuses |
| **Clear Set Bonus Cache** | Clear AI-generated content (keeps first entry) |

> [!CAUTION]
> **Reset All Data** is irreversible. Only use if you want a fresh start.

---

## Detailed Documentation

For in-depth coverage of each settings section:

- [[General Settings]] – Weekly goals, training mode, streak, bounty
- [[Gear Settings]] – Slot mapping, set bonuses, loot tables
- [[API Settings]] – Gemini API configuration and testing

---

## See Also

- [[Getting Started]] – Initial setup
- [[Quest System]] – How quests work
- [[Gear & Equipment]] – Loot and equipment system

---

**Need help?** Check the Debug section to test your configuration, or reset stats if something seems off.
