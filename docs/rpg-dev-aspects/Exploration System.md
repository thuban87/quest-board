# Exploration System - Brainstorming Document

> **Status:** 🟡 Brainstorming  
> **Priority:** Phase 3C (After Fight System)  
> **Dependencies:** Gear & Loot System, Fight System

---

## Overview

The Exploration System allows players to navigate tile-based dungeons, encounter monsters, solve simple puzzles, and discover treasure. Designed as a "bridge feature" that ties Gear and Combat together.

### Design Philosophy
- **Old-school Gameboy Zelda feel** - Simple, 2D, tile-based
- **Scoped down intentionally** - Not open world, not the main focus
- **Means to an end** - Pushes quest completion, dungeons are rewards
- **CSS Grid + DOM** - No heavy frameworks (no PixiJS, no Phaser)
- **AI-optional** - Manual templates work, AI enhances

---

## Technical Approach

### Rendering: CSS Grid + DOM

```css
.dungeon-grid {
  display: grid;
  grid-template-columns: repeat(var(--room-width), 32px);
  grid-template-rows: repeat(var(--room-height), 32px);
  gap: 0;
  image-rendering: pixelated;
}

.tile {
  width: 32px;
  height: 32px;
  background-size: contain;
}

.tile-floor { background-image: url('floor.png'); }
.tile-wall { background-image: url('wall.png'); }
.tile-door { background-image: url('door.png'); }
```

### Why This Approach?
| Option | Complexity | Performance | Fits Aesthetic |
|--------|------------|-------------|----------------|
| CSS Grid + DOM | ✅ Low | ✅ Good for tile-based | ✅ Perfect |
| HTML5 Canvas | Medium | Better for animation | ⚠️ Overkill |
| PixiJS | High | Best for complex | ❌ Too much |
| Phaser.js | High | Game framework | ❌ Way overkill |

> [!NOTE]
> For Gameboy Zelda style with snapping movement, CSS Grid is ideal.
> No smooth scrolling needed, no physics, just tile-to-tile movement.

---

## Dungeon Structure

### Room Concept

Dungeons are made of interconnected **rooms**. Each room is a small grid:

```
Standard Room Size: 9x7 tiles (small, focused)
Max Room Size: 15x11 tiles (boss rooms, special areas)
Tile Size: 32x32 pixels
```

### Room Layout Example

```
████████████
█..........█
█....C.....█
█..........█
█.....P....█
█..........█
████D███████

Legend:
█ = Wall
. = Floor
D = Door (exit)
P = Player spawn
C = Chest
M = Monster (not shown, spawns dynamically)
```

### Room Types

| Type | Description | Contents |
|------|-------------|----------|
| 🚪 **Entry** | Starting room | Tutorial hint, safe |
| ⚔️ **Combat** | Monster encounter room | 1-3 enemies |
| 📦 **Treasure** | Loot room | 1-2 chests, maybe trapped |
| 🧩 **Puzzle** | Simple puzzle | Lever, switch, or riddle |
| 👹 **Boss** | Large room, boss fight | 1 boss, guaranteed loot |
| 🏁 **Exit** | Dungeon complete | Portal back to hub |

---

## Dungeon Templates

### Manual Templates (Default)

Pre-designed dungeons shipped with the plugin:

```typescript
interface DungeonTemplate {
  id: string;
  name: string;
  description: string;
  
  // Difficulty scaling
  minLevel: number;
  maxLevel: number;
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Structure
  rooms: RoomTemplate[];
  connections: RoomConnection[];
  
  // Theming
  tileSet: 'dungeon' | 'forest' | 'cave' | 'castle';
  
  // Spawns (positions defined, monsters chosen based on level)
  monsterSpawnPoints: SpawnPoint[];
  chestSpawnPoints: SpawnPoint[];
}
```

### Example Dungeon: "Goblin Cave"

```
    [Entry] ─── [Combat] ─── [Treasure]
                    │
               [Combat]
                    │
                [Boss]
```

```typescript
const goblinCaveDungeon: DungeonTemplate = {
  id: 'goblin_cave',
  name: 'Goblin Cave',
  description: 'A dank cave infested with goblins.',
  minLevel: 1,
  maxLevel: 10,
  difficulty: 'easy',
  tileSet: 'cave',
  
  rooms: [
    { id: 'entry', type: 'entry', width: 9, height: 7, layout: '...' },
    { id: 'combat1', type: 'combat', width: 9, height: 7, layout: '...' },
    { id: 'combat2', type: 'combat', width: 9, height: 7, layout: '...' },
    { id: 'treasure', type: 'treasure', width: 9, height: 7, layout: '...' },
    { id: 'boss', type: 'boss', width: 15, height: 11, layout: '...' },
  ],
  
  connections: [
    { from: 'entry', to: 'combat1', direction: 'east' },
    { from: 'combat1', to: 'treasure', direction: 'east' },
    { from: 'combat1', to: 'combat2', direction: 'south' },
    { from: 'combat2', to: 'boss', direction: 'south' },
  ],
  
  monsterSpawnPoints: [
    { roomId: 'combat1', count: 2, pool: ['goblin'] },
    { roomId: 'combat2', count: 3, pool: ['goblin', 'hobgoblin'] },
    { roomId: 'boss', count: 1, pool: ['goblin_chief'], isBoss: true },
  ],
  
  chestSpawnPoints: [
    { roomId: 'treasure', count: 2, tier: 'standard' },
    { roomId: 'boss', count: 1, tier: 'epic' },
  ],
};
```

---

## AI-Generated Dungeons (Stretch Goal)

Instead of complex procedural generation, let AI do it:

### Prompt Structure

```typescript
const dungeonGenerationPrompt = `
Generate a small dungeon for an RPG game.

Player: Level ${playerLevel} ${playerClass}
Difficulty: ${selectedDifficulty}
Theme: ${selectedTheme}

Generate a dungeon with:
- 4-6 rooms
- 1 entry room, 1 boss room
- At least one treasure room
- 1-2 combat rooms
- Optional: 1 puzzle room

For each room, provide:
- Room type
- Brief description (1-2 sentences)
- Monster types and count (if combat room)
- Chest tier (if treasure room)
- Puzzle hint (if puzzle room)
- Connections to other rooms (north/south/east/west)

Response in JSON format matching the DungeonTemplate schema.
`;
```

> [!TIP]
> **User's AI Determines Quality:** Users bring their own model (Gemini, Claude, local).
> Better model = more creative/coherent dungeons.
> Basic RNG fallback for users without AI configured.

---

## Tile System

### Tile Types

| Tile | Visual | Walk? | Interact? |
|------|--------|-------|-----------|
| 🟫 Floor | Stone/dirt texture | ✅ | - |
| ⬛ Wall | Brick/rock texture | ❌ | - |
| 🚪 Door | Wooden door | ✅ | Auto-transition |
| 📦 Chest | Chest sprite | ❌ | Open for loot |
| ⚠️ Trap | Hidden/visible | ✅ | Damage/effect |
| 🔘 Switch | Lever/button | ❌ | Toggle puzzle |
| 🌀 Portal | Swirling effect | ✅ | Exit dungeon |
| 💀 Monster | Enemy sprite | ❌ | Starts combat |

### Tile Definition

```typescript
interface Tile {
  type: TileType;
  walkable: boolean;
  interactable: boolean;
  spriteId: string;
  
  // Optional interaction data
  onInteract?: TileInteraction;
}

type TileInteraction = 
  | { type: 'chest', lootTier: GearTier, opened: boolean }
  | { type: 'door', targetRoom: string, targetPosition: [number, number] }
  | { type: 'trap', damage: number, triggered: boolean }
  | { type: 'switch', linkedTo: string[], active: boolean }
  | { type: 'portal', action: 'exit' }
  | { type: 'monster', monsterId: string };
```

---

## Movement System

### Grid-Based Snapping (Zelda Style)

No smooth movement - player snaps tile-to-tile:

```typescript
class ExplorationController {
  private playerPosition: [number, number];
  private currentRoom: Room;
  
  move(direction: 'north' | 'south' | 'east' | 'west') {
    const [x, y] = this.playerPosition;
    let newX = x, newY = y;
    
    switch (direction) {
      case 'north': newY--; break;
      case 'south': newY++; break;
      case 'east': newX++; break;
      case 'west': newX--; break;
    }
    
    const targetTile = this.currentRoom.getTile(newX, newY);
    
    if (!targetTile.walkable) {
      // Blocked - play bump sound or nothing
      return;
    }
    
    // Move player
    this.playerPosition = [newX, newY];
    this.updatePlayerSprite(direction);
    
    // Check for interactions
    if (targetTile.interactable) {
      this.handleInteraction(targetTile);
    }
  }
  
  private handleInteraction(tile: Tile) {
    switch (tile.onInteract?.type) {
      case 'door':
        this.transitionRoom(tile.onInteract.targetRoom);
        break;
      case 'chest':
        this.openChest(tile);
        break;
      case 'monster':
        this.startCombat(tile.onInteract.monsterId);
        break;
      case 'trap':
        this.triggerTrap(tile);
        break;
      case 'portal':
        this.exitDungeon();
        break;
    }
  }
}
```

### Controls

| Input | Action |
|-------|--------|
| W / ↑ | Move north |
| S / ↓ | Move south |
| A / ← | Move west |
| D / → | Move east |
| E / Enter | Interact with adjacent tile |
| Esc | Open menu / Exit to hub |

> [!NOTE]
> Click-to-move could also work - click a tile, player pathfinds there.
> Would need basic A* pathfinding, more work but accessible.

---

## Player Sprite Direction

Using the 8-direction sprites you have:

```typescript
type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

function getPlayerSprite(facing: Direction): string {
  return `player_${playerClass}_${facing}.png`;
}
```

For basic 4-directional movement:
- Moving up → Face N
- Moving down → Face S
- Moving left → Face W
- Moving right → Face E

Diagonal sprites (NE, SE, SW, NW) could be used when player is moving diagonally (if we support that).

---

## Exploration UI Layout

```
┌────────────────────────────────────────────────┐
│ 🗺️ Goblin Cave - Room 2/5     ❤️ 85/100 HP    │
├────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐   │
│ │  █ █ █ █ █ █ █ █ █                       │   │
│ │  █ . . . . . . . █                       │   │
│ │  █ . . 📦 . . . █                       │   │
│ │  D . . . . . 💀 █                       │   │
│ │  █ . . 🧍 . . . █                       │   │
│ │  █ . . . . . . . █                       │   │
│ │  █ █ █ █ 🚪 █ █ █                       │   │
│ └──────────────────────────────────────────┘   │
├────────────────────────────────────────────────┤
│  [⬆️]                                          │
│ [⬅️][⬇️][➡️]    [📋 Inventory]  [🚪 Exit]       │
└────────────────────────────────────────────────┘
```

### UI Components

- **Header Bar:** Dungeon name, room progress, HP
- **Game View:** CSS Grid rendering the room
- **Control Buttons:** Mobile-friendly D-pad (optional if keyboard)
- **Action Bar:** Inventory access, exit option

---

## Fog of War (Optional)

Rooms start darkened until visited:

```typescript
interface DungeonState {
  visitedRooms: Set<string>;
  currentRoom: string;
  
  // Room-level fog (visited vs unvisited)
  isRoomRevealed(roomId: string): boolean {
    return this.visitedRooms.has(roomId);
  }
}
```

### Visual Effect

- Unvisited rooms on minimap: Dark/silhouette
- Visited rooms: Fully visible
- Current room: Highlighted

---

## Puzzle Examples

### Simple Puzzles (Phase 1)

Keep puzzles very simple:

| Puzzle | Description | Solution |
|--------|-------------|----------|
| **Lever Switch** | Flip lever to open door | Walk to lever, press interact |
| **Pressure Plate** | Stand on plate to open | Walk onto plate |
| **Locked Door** | Need key from chest | Find key in previous room |
| **Color Match** | Hit switches in order | Read hint, press in sequence |

### Example: Lever Puzzle

```typescript
const leverPuzzle: PuzzleDefinition = {
  type: 'lever',
  description: 'A rusty lever protrudes from the wall.',
  hint: 'Perhaps pulling it will open the way forward.',
  state: 'inactive',
  
  linkedTiles: [
    { position: [5, 6], type: 'door', action: 'open' }
  ],
  
  onActivate() {
    this.state = 'active';
    this.linkedTiles.forEach(tile => {
      tile.action(); // Opens the door
    });
  }
};
```

---

## Dungeon Rewards

### Entry Requirements

How do players access dungeons?

| Option | Description |
|--------|-------------|
| **Quest Completion** | Complete X quests → unlock dungeon run |
| **Daily Limit** | 3 dungeon runs per day |
| **Currency Cost** | Spend gold to enter |
| **Free Access** | Always available (maybe too easy?) |

> [!IMPORTANT]
> **Recommendation:** Tie to quest completion.
> Complete a Main quest = 1 dungeon key. 
> Incentivizes the core loop (do real tasks → get to play).

### Exit Rewards

```typescript
interface DungeonReward {
  xp: number;              // Based on dungeon level + bosses killed
  gold: number;            // Total collected + bonuses
  loot: GearItem[];        // All gear collected
  achievements?: string[]; // Special unlocks
}
```

---

## Dungeon Flow

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  [Quest Completion]                              │
│         │                                        │
│         ▼                                        │
│  [Earn Dungeon Key]                              │
│         │                                        │
│         ▼                                        │
│  [Select Dungeon] ◀── Available dungeons         │
│         │              based on level            │
│         ▼                                        │
│  [Enter Dungeon]                                 │
│         │                                        │
│         ▼                                        │
│  ┌─────────────────┐                             │
│  │  EXPLORATION    │ ◀── Move room to room       │
│  │  LOOP           │     Open chests             │
│  │                 │     Fight monsters          │
│  └────────┬────────┘     Solve puzzles           │
│           │                                      │
│           ▼                                      │
│  [Reach Boss Room]                               │
│           │                                      │
│           ▼                                      │
│  [Defeat Boss] ───▶ [Fight System]               │
│           │                                      │
│           ▼                                      │
│  [Exit Portal] ───▶ Reward Summary               │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Open Questions

1. **Dungeon Persistence?**
   - Save mid-dungeon if user closes Obsidian?
   - Or reset if not completed in one session?

2. **Death in Dungeon?**
   - Respawn at entry with partial loot?
   - Lose all and restart?
   - "Rescue" mechanic (pay gold to recover)?

3. **Dungeon Scaling?**
   - Fixed dungeons always same difficulty?
   - Or scale to player level each time?

4. **How Many Dungeons at Launch?**
   - Minimum viable: 3-5 hand-crafted
   - With AI: Infinite procedural

5. **Random vs Selected?**
   - Player chooses specific dungeon?
   - Or random from available pool?

6. **Minimap?**
   - Show all visited rooms?
   - Just current room indicator?

---

## Implementation Order

1. **Tile system** - Define tile types, walkability
2. **Room rendering** - CSS Grid + tile sprites
3. **Player movement** - Keyboard controls, collision
4. **Room transitions** - Door handling, load new room
5. **Dungeon template format** - JSON/TS definition structure
6. **Create 1 test dungeon** - "Goblin Cave" handcrafted
7. **Chest interaction** - Loot drops (hooks into Gear system)
8. **Monster encounters** - Start combat (hooks into Fight system)
9. **Boss room** - Enhanced monster fight
10. **Exit + rewards** - Summary screen, XP/loot grant
11. **Dungeon selection UI** - Choose which dungeon to run
12. **Additional dungeons** - Create 2-4 more templates
13. **AI generation** (stretch) - Procedural dungeon creation

---

## Tile Asset Requirements

### Minimum Sprites Needed

| Category | Examples | Approximate Count |
|----------|----------|-------------------|
| **Floors** | Stone, dirt, grass, wood | 4-6 |
| **Walls** | Brick, cave, castle | 4-6 |
| **Doors** | Open, closed, locked | 3 |
| **Objects** | Chest, lever, switch, portal | 5-8 |
| **Traps** | Spikes, pit (hidden/visible) | 4 |
| **Decorative** | Torch, bones, crate, barrel | 6-10 |

**Total: ~30-40 tile sprites**

> These can be simple 32x32 pixel art tiles from pixellab.ai or free tile packs.

---

## Related Documents

- [[Gear and Loot System]] - Chests drop gear
- [[Fight System]] - Monster encounters trigger combat

---

*Last Updated: 2026-01-22*
