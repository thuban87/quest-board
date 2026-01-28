# Dungeon Exploration

Dungeons are optional exploration zones where you can fight monsters, loot chests, and earn bonus gold and XP. Think of them as side content—a break from quests when you want some combat action!

---

## Quick Start

1. Open the **Command Menu** (use the Quest Board ribbon icon or command palette)
2. Select **Enter Dungeon**
3. Choose a dungeon from the selection modal
4. Use **WASD**, **click-to-move**, or the **D-pad** (mobile) to explore
5. Reach the **exit portal** (🌀) to complete the dungeon and collect your rewards

---

## Controls

| Input | Action |
|-------|--------|
| **W / ↑** | Move north |
| **A / ←** | Move west |
| **S / ↓** | Move south |
| **D / →** | Move east |
| **E** | Interact with adjacent tiles (chests) |
| **M** | Open dungeon map |
| **Click** | Click-to-move (A* pathfinding) |
| **D-pad** | Mobile controls (touch) |

> [!TIP]
> Click-to-move uses pathfinding—click any visible floor tile and your character will navigate automatically!

---

## Interface Overview

The dungeon view includes:

- **Header Bar**: Dungeon name, room progress, session gold/XP
- **Room Grid**: The current room layout with sprites
- **Player**: Your character sprite (shows facing direction)
- **Quick Actions**: Avatar, Inventory, Map, Exit buttons
- **HP/Mana Bars**: Current health and mana

---

## Tile Types

| Symbol | Name | Walkable | Description |
|--------|------|----------|-------------|
| `#` | Wall | ❌ | Blocking obstacle |
| `.` | Floor | ✅ | Walkable ground |
| `P` | Spawn | ✅ | Player start position |
| `M` | Monster | ✅ | Monster spawn point |
| `C` | Chest | ❌ | Treasure container |
| `O` | Portal | ✅ | Dungeon exit |
| `~` | Water | ❌ | Hazard (non-walkable) |
| `B` | Boulder | ❌ | Obstacle |

---

## Room Types

| Type | Description |
|------|-------------|
| **Entry** | Safe starting room, no monsters |
| **Combat** | Contains monster spawns |
| **Treasure** | Contains chests (may have monsters) |
| **Boss** | Final room with a boss monster and exit portal |

---

## Monsters

When you walk onto a monster tile (`M`), combat begins. Dungeons feature monsters from 8 categories:

| Category | Examples | Traits |
|----------|----------|--------|
| 🐺 **Beasts** | Wolf, Bear, Giant Rat | Physical, low magic defense |
| 💀 **Undead** | Skeleton, Zombie, Ghost | Dark affinity, mixed defenses |
| 👺 **Goblins** | Goblin, Hobgoblin, Bugbear | Balanced stats |
| 🧌 **Trolls** | Cave Troll, River Troll | High HP tanks |
| 🧝 **Night Elves** | Shadow Elf, Dark Ranger | Magic-focused, high speed |
| ⛏️ **Dwarves** | Rogue Dwarf, Berserker | High defense |
| 🐉 **Dragonkin** | Drake, Wyvern | High all-around stats |
| 👁️ **Aberrations** | Mimic, Eye Beast | Unusual stat distributions |

### Elite Monsters

At **level 5+**, you have a **30% chance** to encounter elite versions of monsters with:
- Enhanced stats
- Special name prefixes (e.g., "Mighty Wolf", "Ancient Skeleton")

### Boss Monsters

Boss rooms contain powerful monsters marked with `isBoss: true`. Defeating them is required to access the exit portal.

---

## Chests

Walk adjacent to a chest and press **E** (or click it) to open. Chest tiers determine loot quality:

| Tier | Icon | Typical Contents |
|------|------|------------------|
| Common | ⬜ | Basic gear |
| Adept | 🟢 | Uncommon gear |
| Journeyman | 🔵 | Rare gear |
| Master | 🟣 | Epic gear |
| Epic | 🟠 | High-tier gear |
| Legendary | 🟡 | Legendary gear |

> [!NOTE]
> Opened chests stay opened—you can't re-loot them if you leave and return to the room.

---

## Loot Bias

Each dungeon has a **loot bias** that affects gear slot drops:

| Dungeon | Loot Focus |
|---------|------------|
| Goblin Cave | Weapons, Helms |
| Forest Ruins | Chest armor, Legs |
| Castle Crypt | Weapons, Shields |
| Bandit Stronghold | Chest armor, Weapons |

Check the dungeon selection modal to see what each dungeon favors!

---

## Built-in Dungeons

| Dungeon | Difficulty | Rooms | Tileset | Theme |
|---------|------------|-------|---------|-------|
| **Test Cave** | Easy | 3 | Cave | Development testing |
| **Goblin Cave** | Easy | 5 | Cave | Goblin-infested cavern |
| **Forest Ruins** | Medium | 8 | Forest | Outdoor ruins with undead |
| **Castle Crypt** | Medium | 10 | Dungeon | Undead tomb |
| **Bandit Stronghold** | Hard | 20 | Castle | Fortified bandit camp |

---

## Tilesets

Dungeons use one of four visual themes:

| Tileset | Theme | Floor | Wall |
|---------|-------|-------|------|
| **cave** | Dark caverns | Gravel | Cliff rocks |
| **forest** | Outdoor ruins | Grass | Tree walls |
| **dungeon** | Classic dungeon | Stone | Brick walls |
| **castle** | Castle interior | Metal | Red brick |

---

## State Persistence

Your dungeon progress is saved:

- **Visited rooms** are tracked
- **Opened chests** stay opened
- **Killed monsters** don't respawn
- **Gold and XP** accumulate during the run

If you exit early, you can resume later or start fresh.

---

## Dungeon Map

Press **M** (or click the map button) to view the dungeon map:

- ✅ Visited rooms are shown
- ❓ Unvisited rooms are hidden
- 📍 Current room is highlighted

---

## Custom Dungeons

You can create your own dungeons using markdown files! See [[Custom Dungeons]] for the full format guide.

Quick summary:
1. Create a `.md` file in your custom dungeons folder
2. Add YAML frontmatter (name, tileset, difficulty)
3. Define rooms with ASCII art layouts
4. Configure doors, chests, and monsters

---

## Tips for Success

1. **Check your HP** before entering combat-heavy rooms
2. **Open all chests** before exiting—they contain valuable loot
3. **Use the map** to track your exploration progress
4. **Match dungeons to your level**—harder dungeons have better loot but tougher monsters
5. **Bring consumables**—potions can save a failed run

---

## Death & Recovery

If you fall in combat:
- The **Recovery Modal** opens with options
- You can use a **Revive Potion** for instant recovery
- Or take a **Short/Long Rest** (time-based recovery)

See [[Combat Guide]] for more on combat mechanics and recovery.

---

## Related Topics

- [[Combat Guide]] – Turn-based battle mechanics
- [[Gear & Equipment]] – Loot tiers and equipment
- [[Custom Dungeons]] – Create your own dungeons
- [[Character Classes]] – Class combat roles
