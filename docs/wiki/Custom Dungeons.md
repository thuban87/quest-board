# Custom Dungeons

Create your own dungeon adventures using simple markdown files! Quest Board's dungeon system supports custom layouts with monsters, chests, doors, and more.

---

## Overview

Custom dungeons are markdown files with:
- **Frontmatter** – Dungeon metadata (name, difficulty, tileset)
- **Room Sections** – ASCII art layouts with interactive elements

```
Your markdown file → Plugin parser → Playable dungeon!
```

> [!TIP]
> Check the built-in dungeons (Goblin Cave, Forest Ruins, Castle Crypt) for inspiration. Your custom dungeons will appear alongside them in the selection menu!

---

## Getting Started

### 1. Locate the Dungeons Folder

Custom dungeons live in: `System/Templates/Quest Board/Dungeons/`

### 2. Create a File

Create a new `.md` file (e.g., `my_dungeon.md`):

```markdown
---
name: My First Dungeon
description: A simple dungeon to learn the format
difficulty: easy
tileset: cave
lootSlots: [weapon, head]
lootDescription: Good for weapons and helms
---

## entry
type: entry
layout: |
  ###########
  #.........#
  #....P....#
  #.........#
  #####.#####
doors:
  5,4: combat_room/north

---

## combat_room
type: combat
layout: |
  #####.#####
  #....M....#
  #.........#
  #....O....#
  ###########
doors:
  5,0: entry/south
monsters:
  - position: [5, 1]
    pool: [goblin]
    isBoss: false
```

### 3. Test Your Dungeon

1. Reload the plugin (or restart Obsidian)
2. Run **Quest Board: Enter Dungeon**
3. Your dungeon appears in the list with `[User]` prefix

---

## File Format

### Frontmatter (Required)

```yaml
---
name: My Custom Dungeon
description: A short description
difficulty: medium
tileset: cave
lootSlots: [weapon, chest]
lootDescription: Good for weapons and armor
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✅ | Display name in selection menu |
| `description` | ❌ | Flavor text (shown in selection) |
| `difficulty` | ❌ | `easy`, `medium`, `hard` (default: `medium`) |
| `tileset` | ❌ | Visual theme (default: `cave`) |
| `lootSlots` | ❌ | Gear slots that can drop (default: `[weapon]`) |
| `lootDescription` | ❌ | Loot hint text (default: `Mixed loot`) |

### Room Sections

Separate rooms with `---` and start each with `## room_id`:

```markdown
---

## my_room_id
type: combat
layout: |
  ###########
  #.........#
  ###########
doors:
  5,1: other_room/north
```

---

## Layout Characters

Draw your room using these characters:

| Char | Name | Walkable | Description |
|------|------|----------|-------------|
| `#` | Wall | No | Blocking obstacle |
| `.` | Floor | Yes | Walkable ground |
| `P` | Spawn | Yes | Player start (one per dungeon, in entry room) |
| `M` | Monster | Yes | Monster spawn point |
| `C` | Chest | No | Treasure chest (blocking) |
| `O` | Portal | Yes | Dungeon exit (place in final room) |
| `~` | Water | No | Hazard tile (blocking) |
| `B` | Boulder | No | Obstacle (renders on floor) |

### Example Layout

```
###########
#.........#
#..B...B..#
#....P....#
#.........#
#..~...~..#
#####.#####
```

This creates a room with:
- Walls around the edges
- Two boulders near the top
- Player spawn in the center
- Water hazards near the bottom
- A door opening at the bottom center

> [!WARNING]
> **Never place blocking tiles (`#`, `~`, `B`, `C`) directly in doorways!** The player won't be able to enter/exit.

---

## Room Properties

### type

| Type | Purpose |
|------|---------|
| `entry` | Starting room (safe, no spawned combat) |
| `combat` | Contains monsters |
| `treasure` | Contains chests (optional monsters) |
| `boss` | Final room with boss monster |

### layout

Multiline ASCII art defining the room. Use the `|` YAML syntax:

```yaml
layout: |
  ###########
  #.........#
  #....P....#
  ###########
```

### doors

Connect rooms with doors. Format: `x,y: target_room/entry_direction`

```yaml
doors:
  5,6: combat_hall/north
  0,3: west_treasure/east
  10,3: east_wing/west
```

- `x,y` – Position in layout (0-indexed from top-left)
- `target_room` – Room ID to connect to
- `entry_direction` – Which direction the player enters from (`north`, `south`, `east`, `west`)

> [!NOTE]
> Doors must be on floor tiles (`.`) or in wall openings. The layout character at the door position should NOT be a wall.

### chests

Define treasure chests with position and tier:

```yaml
chests:
  - position: [3, 2]
    tier: adept
  - position: [7, 2]
    tier: master
```

### monsters

Define monster spawn points:

```yaml
monsters:
  - position: [5, 2]
    pool: [goblin, skeleton]
    isBoss: false
  - position: [5, 5]
    pool: [bugbear]
    isBoss: true
```

- `position` – `[x, y]` coordinates
- `pool` – Array of monster IDs to randomly choose from
- `isBoss` – Set `true` for boss monsters (stronger, required to clear room)

---

## Tilesets

| Tileset | Theme | Best For |
|---------|-------|----------|
| `cave` | Dark caverns, rock floors | Goblin caves, mines |
| `forest` | Outdoor ruins, grass floors | Nature ruins, outdoor |
| `dungeon` | Classic stone dungeon | Crypts, castles |
| `castle` | Castle interior, wood floors | Strongholds, keeps |

---

## Difficulty Levels

| Level | Effect |
|-------|--------|
| `easy` | Lower monster stats |
| `medium` | Balanced challenge |
| `hard` | Higher monster stats, tougher fights |

---

## Chest Tiers

| Tier | Loot Quality |
|------|--------------|
| `novice` | ⬜ Common items |
| `adept` | 🟢 Uncommon items |
| `journeyman` | 🔵 Rare items |
| `master` | 🟣 Epic items |
| `legendary` | 🟠 Legendary items |

---

## Monster Pool

Use these IDs in your `pool` arrays:

### Beasts 🐺
| ID | Name |
|----|------|
| `wolf` | Wolf |
| `bear` | Bear |
| `giant-rat` | Giant Rat |

### Undead 💀
| ID | Name |
|----|------|
| `skeleton` | Skeleton |
| `zombie` | Zombie |
| `ghost` | Ghost |

### Goblins 👺
| ID | Name |
|----|------|
| `goblin` | Goblin |
| `hobgoblin` | Hobgoblin |
| `bugbear` | Bugbear |

### Trolls 🧌
| ID | Name |
|----|------|
| `cave-troll` | Cave Troll |
| `river-troll` | River Troll |

### Night Elves 🧝
| ID | Name |
|----|------|
| `shadow-elf` | Shadow Elf |
| `dark-ranger` | Dark Ranger |

### Dwarves ⛏️
| ID | Name |
|----|------|
| `rogue-dwarf` | Rogue Dwarf |
| `berserker` | Berserker |

### Dragonkin 🐉
| ID | Name |
|----|------|
| `drake` | Drake |
| `wyvern` | Wyvern |

### Aberrations 👁️
| ID | Name |
|----|------|
| `mimic` | Mimic (bonus loot!) |
| `eye-beast` | Eye Beast |

---

## Size Guidelines

For optimal display at 2x scale (default):

| Dimension | Recommended | Maximum |
|-----------|-------------|---------|
| Width | 11 tiles | 11 (no horizontal scroll) |
| Height | 7 tiles | 21+ (will scroll vertically) |

Standard room size: **11×7** tiles

---

## Complete Example

Here's a full 3-room dungeon:

```markdown
---
name: The Forgotten Mine
description: An abandoned mine filled with creatures
difficulty: easy
tileset: cave
lootSlots: [weapon, head]
lootDescription: Mining equipment drops
---

## entrance
type: entry
layout: |
  ###########
  #.........#
  #.........#
  #....P....#
  #.........#
  #.........#
  #####.#####
doors:
  5,6: main_cavern/north

---

## main_cavern
type: combat
layout: |
  #####.#####
  #.........#
  #..M...M..#
  #.........#
  #.........#
  #....C....#
  #####.#####
doors:
  5,0: entrance/south
  5,6: boss_chamber/north
monsters:
  - position: [3, 2]
    pool: [goblin, giant-rat]
  - position: [7, 2]
    pool: [goblin]
chests:
  - position: [5, 5]
    tier: adept

---

## boss_chamber
type: boss
layout: |
  #####.#####
  #.........#
  #....M....#
  #.........#
  #..C...C..#
  #....O....#
  ###########
doors:
  5,0: main_cavern/south
monsters:
  - position: [5, 2]
    pool: [bugbear]
    isBoss: true
chests:
  - position: [3, 4]
    tier: master
  - position: [7, 4]
    tier: journeyman
```

---

## Tips & Best Practices

### Room Design

1. **Standard size 11×7** – Fits perfectly without scrolling
2. **One spawn point** – Only one `P` in the entire dungeon (entry room)
3. **One exit portal** – Place `O` in the boss/final room only
4. **Clear pathways** – Keep doors accessible, no blocking tiles in doorways

### Door Connections

1. **Bidirectional doors** – If room A connects to room B, room B should connect back to A
2. **Match entry directions** – If entering from the south, the door should be at the top of the destination room
3. **Test walkability** – Make sure the player can reach doors in both rooms

### Monster Placement

1. **Space them out** – Don't cluster all monsters in one spot
2. **Use pools wisely** – Similar monsters in the same pool (e.g., `[goblin, hobgoblin]`)
3. **Boss at the end** – Save the `isBoss: true` for the final room

### Validation

Common errors the plugin will catch:
- Missing room header (`## room_id`)
- Missing layout
- Inconsistent row widths (will auto-pad with walls)
- Invalid door format

---

## Troubleshooting

### Dungeon Not Appearing

1. **Check folder**: File must be in `System/Templates/Quest Board/Dungeons/`
2. **Check extension**: Must be `.md`
3. **Check frontmatter**: Must have `name` field
4. **Reload plugin**: Command Palette → "Reload without saving"

### Can't Enter Room

1. **Check door positions**: Verify `x,y` coordinates are correct (0-indexed)
2. **Check entry directions**: Make sure they match the layout
3. **Check for blocking tiles**: No walls/water/chests in doorways

### Layout Errors

The plugin will warn about:
- Rows with inconsistent width (auto-pads with `#`)
- Missing layout in room
- Invalid room types

---

## See Also

- [[Dungeon Exploration]] – How to play through dungeons
- [[Combat Guide]] – Battle mechanics
- [[Gear & Equipment]] – Chest loot and gear tiers

---

**Happy dungeon crafting!** ⛏️🗺️
