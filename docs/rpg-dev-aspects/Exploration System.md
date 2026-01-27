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
- **Click-to-Move MANDATORY** - Mouse-first UX for Obsidian users

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

/* Player uses CSS transform for smooth movement */
.player-sprite {
  position: absolute;
  transition: transform 0.15s ease-out;
}
```

### Why This Approach?
| Option | Complexity | Performance | Fits Aesthetic |
|--------|------------|-------------|----------------|
| CSS Grid + DOM | ✅ Low | ✅ Good for tile-based | ✅ Perfect |
| HTML5 Canvas | Medium | Better for animation | ⚠️ Overkill |
| PixiJS | High | Best for complex | ❌ Too much |
| Phaser.js | High | Game framework | ❌ Way overkill |

> [!IMPORTANT]
> **Performance Optimizations:**
> - **Event Delegation:** Put ONE `onClick` on `.dungeon-grid` container, not 165 individual tiles
> - **CSS Transform:** Use `transform: translate(x, y)` for smooth player movement, then snap logic position
> - **Room Transitions:** Fade-to-black (150ms out → load → 150ms in), not instant swap

---

## Asset Folder Structure

Tiles are organized in `assets/environment/` with auto-discovery based on folder structure:

```
assets/environment/
├── _shared/                    ← Universal tiles (all tilesets)
│   ├── floor/                  ← Walkable ground (grass, stone, paths)
│   ├── wall/                   ← Blocking walls
│   ├── hazard/                 ← Non-walkable terrain (water, lava, pits)
│   ├── decorative/             ← Walkable overlays (paintings, banners)
│   └── obstacle/               ← Blocking overlays (boulders, barrels)
├── _interactive/               ← Chests, doors, portals
├── cave/
│   ├── floor/                  ← Cave-specific floors
│   ├── wall/                   ← Cave-specific walls
│   ├── decorative/             ← Cave-specific decor
│   └── obstacle/               ← Cave-specific obstacles
├── forest/                     ← Same structure
├── dungeon/                    ← Same structure
└── castle/                     ← Same structure
```

### Tile Categories

| Category | Walkable | Purpose |
|----------|----------|---------|
| `floor/` | ✅ Yes | Ground tiles (grass, stone, gravel) |
| `wall/` | ❌ No | Blocking vertical obstacles |
| `hazard/` | ❌ No | Ground-level terrain you can't cross (water, lava) |
| `decorative/` | ✅ Yes | Visual overlays on walkable tiles |
| `obstacle/` | ❌ No | Blocking overlays on floor tiles |
| `_interactive/` | Varies | Chests, doors, portals with special behavior |

### Overlay Rendering

Tiles marked with `isOverlay: true` (chests, portals, obstacles) render **on top** of the floor tile:
- Floor tile renders as background
- Overlay sprite renders as absolute-positioned inner div
- CSS `background-size: contain` keeps smaller sprites centered

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

### DungeonTemplate Interface

```typescript
interface DungeonTemplate {
  id: string;
  name: string;
  description: string;
  
  // Difficulty (scales to player level each run)
  baseDifficulty: 'easy' | 'medium' | 'hard';
  
  // Loot bias (displayed on selection screen for target farming)
  lootBias: {
    primarySlots: GearSlot[];    // e.g., ['weapon', 'shield']
    description: string;         // "High chance of weapon drops"
  };
  
  // Structure
  rooms: RoomTemplate[];
  
  // Theming
  tileSet: 'dungeon' | 'forest' | 'cave' | 'castle';
}

interface RoomTemplate {
  id: string;
  type: RoomType;
  width: number;
  height: number;
  layout: string[];              // Array of strings, one per row
  
  // Doors embedded in room (not separate connections array!)
  doors: {
    [position: string]: {        // e.g., "8,3" (x,y)
      targetRoom: string;
      targetEntry: 'north' | 'south' | 'east' | 'west';
    };
  };
  
  // Spawns
  monsters?: { position: [number, number]; pool: string[]; isBoss?: boolean }[];
  chests?: { position: [number, number]; tier: ChestTier }[];
}
```

> [!IMPORTANT]
> **Door Coupling Fix:** Doors are defined IN the room template, not in a separate `connections` array.
> This prevents sync errors where visual door doesn't match logical connection.

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
  baseDifficulty: 'easy',
  tileSet: 'cave',
  
  lootBias: {
    primarySlots: ['weapon', 'head'],
    description: 'Good for weapon and helm drops',
  },
  
  rooms: [
    {
      id: 'entry',
      type: 'entry',
      width: 9,
      height: 7,
      layout: [
        '#########',
        '#.......#',
        '#.......#',
        '#...P...#',
        '#.......#',
        '#.......#',
        '####D####',
      ],
      doors: {
        '4,6': { targetRoom: 'combat1', targetEntry: 'north' },
      },
    },
    // ... more rooms
  ],
};
```

---

## AI-Generated Dungeons

> [!TIP]
> **Two-Pass Generation** to avoid LLM layout issues:
> 1. Pass 1 (Logic): "Generate room flow: Room 1 connects to Room 2, has 2 goblins."
> 2. Pass 2 (Layout): "Draw the 9x7 grid for Room 1."
> Or: Auto-pad uneven rows with walls to prevent render crashes.

### Random Dungeon Option

In addition to hand-crafted dungeons, show a "Random Dungeon" option:
- Uses AI or RNG to generate a dungeon matching player level
- Lower predictability, higher variety
- Shows below the preset dungeon options

---

## State Management

### Zustand Dungeon Store

> [!CAUTION]
> **Use Zustand, NOT a Class!** React needs reactive state to re-render.

```typescript
interface DungeonState {
  // Active dungeon
  isInDungeon: boolean;
  dungeonInstanceId: string | null;    // Unique per run (crypto.randomUUID())
  dungeonTemplateId: string | null;
  scaledLevel: number;                 // Player level at run start
  
  // Current position
  currentRoomId: string;
  playerPosition: [number, number];
  playerFacing: Direction;
  
  // Visited rooms (for minimap)
  visitedRooms: Set<string>;
  
  // Room state (persisted per room to prevent exploits)
  roomStates: Record<string, RoomState>;
  
  // Collected loot (granted on exit)
  pendingLoot: LootReward[];
  pendingGold: number;
  pendingXP: number;
  
  // Exploration state machine
  explorationState: ExplorationState;
}

interface RoomState {
  chestsOpened: string[];       // IDs of opened chests
  monstersKilled: string[];     // IDs of dead monsters
  trapsTriggered: string[];     // IDs of triggered traps
  puzzlesSolved: string[];      // IDs of solved puzzles
}

type ExplorationState =
  | 'LOADING'           // Loading room data
  | 'EXPLORING'         // Normal movement
  | 'IN_COMBAT'         // Fight System active (dungeon paused)
  | 'LOOT_MODAL'        // Showing chest loot
  | 'DEATH_MODAL'       // Player died, showing options
  | 'EXIT_MODAL'        // Confirming early exit
  | 'COMPLETE';         // Dungeon finished
```

### Light Persistence (Multi-PC Safe)

> [!IMPORTANT]
> **Only save minimal state to prevent sync conflicts!**
> If user has dungeon open on PC 1 and opens on PC 2, we don't want massive file change spam.

```typescript
// What we SAVE to data.json:
interface PersistedDungeonState {
  dungeonInstanceId: string;
  dungeonTemplateId: string;
  currentRoomId: string;
  visitedRooms: string[];
  roomStates: Record<string, RoomState>;
  pendingLoot: LootReward[];
  pendingGold: number;
  pendingXP: number;
}

// What we DO NOT save:
// - playerPosition (reset to room entry on load)
// - explorationState (reset to EXPLORING)
// - exact monster HP mid-fight

// On Load:
// 1. Load persisted state if exists
// 2. Reset player to currentRoom's entry point
// 3. Resume exploration
```

---

## Tile System

### Tile Types

| Tile | Visual | Walk? | Interaction |
|------|--------|-------|-------------|
| ⬜ Floor | Stone/dirt texture | ✅ | - |
| ⬛ Wall | Brick/rock texture | ❌ | - |
| 🚪 Door | Wooden door | ✅ | **Auto-transition** (walk into it) |
| 📦 Chest | Chest sprite | ❌ | Click/E to open (shows loot modal) |
| ⚠️ Trap | Hidden/visible | ✅ | Damage on walk (single trigger) |
| 🔘 Switch | Lever/button | ❌ | Click/E to toggle |
| 🌀 Portal | Swirling effect | ✅ | Auto-trigger dungeon exit |
| 💀 Monster | Enemy sprite | ❌ | Click/E to start combat |

> [!NOTE]
> **Doors auto-transition.** Walk into a door = change rooms. No "press E" required.
> **Chests/Levers require interaction.** Click or press E.

### Tile Definition

```typescript
interface TileDefinition {
  type: TileType;
  walkable: boolean;
  autoInteract: boolean;       // true for doors/portals/traps
  spriteId: string;
  iconEmoji: string;           // Fallback if sprite fails (⬜⬛🚪📦)
}

interface TileInstance extends TileDefinition {
  id: string;                  // Unique for state tracking
  position: [number, number];
  interaction?: TileInteraction;
}

type TileInteraction = 
  | { type: 'chest'; lootTier: GearTier; opened: boolean }
  | { type: 'door'; targetRoom: string; targetEntry: Direction }
  | { type: 'trap'; damage: number; triggered: boolean; reusable?: boolean }
  | { type: 'switch'; linkedTo: string[]; active: boolean }
  | { type: 'portal'; action: 'exit' }
  | { type: 'monster'; monsterId: string; killed: boolean };
```

---

## Movement System

### Click-to-Move with A* Pathfinding

> [!IMPORTANT]
> **Click-to-Move is MANDATORY.** WASD is friction for mouse-first Obsidian users.

```typescript
// A* with timeout protection AND path validation
function findPath(
  start: [number, number],
  goal: [number, number],
  room: Room
): [number, number][] | null {
  // VALIDATION: Check if goal is even reachable
  if (!isWalkable(goal, room)) {
    return null; // Goal is a wall - can't reach it!
  }
  
  const MAX_ITERATIONS = 500;
  let iterations = 0;
  
  // ... A* implementation ...
  
  if (iterations >= MAX_ITERATIONS) {
    // Timeout: try to return one step toward goal
    const fallback = getAdjacentWalkableTile(start, room, goal);
    return fallback ? [fallback] : null;
  }
  
  return path;
}

// Handler validates result before moving
function handleTileClick(x: number, y: number): void {
  const path = findPath(playerPos, [x, y], currentRoom);
  
  if (!path) {
    showNotification("Can't reach that tile!");
    return; // Don't move - prevent frustration
  }
  
  moveAlongPath(path);
}
```

### Controls

| Input | Action |
|-------|--------|
| **Click tile** | Pathfind and move to tile |
| W / ↑ | Move north (one tile) |
| S / ↓ | Move south (one tile) |
| A / ← | Move west (one tile) |
| D / → | Move east (one tile) |
| E / Enter | Interact with adjacent tile |
| Esc | Open menu / Confirm exit |

### Mobile Touch Support

```typescript
// D-pad buttons use onTouchStart (immediate), not onClick (300ms delay)
<button 
  onTouchStart={() => movePlayer('north')}
  onClick={() => movePlayer('north')}  // Fallback for non-touch
>
  ⬆️
</button>
```

---

## Dungeon Keys & Entry

### Anti-Grind Protection

> [!CAUTION]
> **Cap dungeon keys at 3-5.** Prevents hoarding and forces Work → Play → Work loop.

```typescript
interface DungeonKeyConfig {
  maxKeys: number;            // 10 (hard cap)
  decayToMax: number;         // 5 (soft cap - keys decay if above)
  keysPerMainQuest: number;   // 1
  keysPerSideQuest: number;   // 0 (or 0.5 with rounding)
}

// Key consumption: ON EXIT, not on start!
// If user crashes or leaves early, key is refunded.
function startDungeon(templateId: string): void {
  // Don't consume key yet - just reserve it
  reserveDungeonKey();
  
  // ... dungeon runs ...
}

function exitDungeon(completed: boolean): void {
  if (completed) {
    consumeReservedKey();
    grantRewards();
  } else {
    refundReservedKey();
    grantPartialRewards(); // Only loot collected so far
  }
}
```

### Single Dungeon at a Time

> [!IMPORTANT]
> **Simplified state management:** One active dungeon per character.
> If user tries to start another, warn them about losing progress.

```typescript
interface PluginSettings {
  // Single dungeon state (NOT Record<> of multiple)
  activeDungeonState?: PersistedDungeonState;
}

function attemptStartDungeon(templateId: string): void {
  const existing = plugin.settings.activeDungeonState;
  
  if (existing) {
    // Show warning modal
    showWarningModal({
      title: 'Active Dungeon Detected',
      message: `You have an in-progress dungeon (${existing.dungeonTemplateId}). 
                Starting a new dungeon will lose your progress.`,
      options: [
        { label: 'Resume Existing', action: () => resumeDungeon(existing) },
        { label: 'Abandon & Start New', action: () => overwriteDungeon(templateId) },
        { label: 'Cancel', action: () => {} },
      ],
    });
  } else {
    // No existing dungeon, proceed
    initializeDungeon(templateId);
  }
}
```

---

## Dungeon Selection

### Target Farming

Players can choose specific dungeons to target particular gear drops:

```typescript
interface DungeonOption {
  templateId: string;
  name: string;
  description: string;
  lootBias: string;           // "High chance of weapon drops"
  difficulty: string;         // "Easy (scaled to Lv. 15)"
  estimatedTime: string;      // "~5 minutes"
}
```

### Selection UI

```
┌─────────────────────────────────────────────────┐
│ 🗺️ Select Dungeon           Keys: 3/5 🔑       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ⚔️ Goblin Cave                                │
│     Easy • 5 rooms • Weapons & Helms            │
│     [Enter]                                     │
│                                                 │
│  🔥 Fire Temple                                 │
│     Medium • 8 rooms • Chest & Leg Armor        │
│     [Enter]                                     │
│                                                 │
│  🏰 Iron Keep                                   │
│     Hard • 12 rooms • Epic Weapons              │
│     [Enter]                                     │
│                                                 │
├─────────────────────────────────────────────────┤
│  🎲 Random Dungeon                             │
│     Surprise layout based on your level         │
│     [Generate & Enter]                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Death & Rescue

### Death Modal

> [!TIP]
> **"The Dungeon Spirits offer you a second chance... for a price."**
> Death is a gold sink that gives gold real value.

```typescript
interface DeathOptions {
  restart: {
    label: 'Restart Dungeon';
    cost: 'Lose all progress and loot';
  };
  rescue: {
    label: 'Pay for Rescue';
    cost: number;              // e.g., 100g
    effect: 'Continue from current room with 50% HP';
  };
  leave: {
    label: 'Abandon Dungeon';
    cost: 'Keep loot collected so far, lose progress';
  };
}
```

---

## Minimap & Full Map

### Corner Minimap (3x3)

Shows current room and immediate neighbors:

```
┌─────┐
│ ? ▢ ?│   ▢ = current room
│ ▢ ■ ▢│   ■ = visited room
│ ? ? ?│   ? = unvisited/unknown
└─────┘
```

### Full Map Modal

Click minimap to open full-screen map of all visited rooms:

```typescript
// Performance: Render rooms as colored rectangles, not full tile grids
function FullMapModal({ visitedRooms, currentRoom }: Props) {
  return (
    <div className="full-map-overlay">
      {visitedRooms.map(room => (
        <div 
          key={room.id}
          className={cn(
            'map-room',
            room.id === currentRoom && 'current',
            room.type === 'boss' && 'boss-room'
          )}
          style={{
            gridColumn: room.mapX,
            gridRow: room.mapY,
          }}
        />
      ))}
    </div>
  );
}
```

### Fog of War

Unvisited rooms use CSS `filter: brightness(0)` or `opacity: 0`:

```css
.map-room.unvisited {
  filter: brightness(0);
}
```

---

## Combat Integration

### Exploration ↔ Combat State Machine

```
EXPLORING → (touch monster) → IN_COMBAT → (victory) → EXPLORING
                                        → (defeat) → DEATH_MODAL
```

### Fight System Handoff

```typescript
function startCombatFromDungeon(monsterId: string): void {
  // 1. Freeze exploration
  useDungeonStore.setState({ explorationState: 'IN_COMBAT' });
  
  // 2. Get monster data from dungeon's monster spawn
  const monster = getDungeonMonster(monsterId);
  
  // 3. Start combat with dungeon's loot bonus
  useBattleStore.getState().startBattle(monster, {
    lootBonus: 1.5,            // Dungeon monsters drop better loot
    onVictory: () => handleMonsterVictory(monsterId),
    onDefeat: () => handleDungeonDeath(),
  });
}

function handleMonsterVictory(monsterId: string): void {
  // 1. Mark monster killed in room state
  markMonsterKilled(monsterId);
  
  // 2. Add combat loot to pending rewards
  const loot = useBattleStore.getState().earnedLoot;
  addPendingLoot(loot);
  
  // 3. Resume exploration at exact position
  useDungeonStore.setState({ explorationState: 'EXPLORING' });
}
```

---

## Gear System Handoff

### Chest Loot Modal

```typescript
function openChest(chestId: string): void {
  // 1. Mark chest opened
  markChestOpened(chestId);
  
  // 2. Generate loot
  const loot = generateChestLoot(chest.tier, scaledLevel);
  
  // 3. Show modal
  useDungeonStore.setState({ explorationState: 'LOOT_MODAL' });
  showLootModal({
    items: loot,
    onConfirm: () => {
      addPendingLoot(loot);
      useDungeonStore.setState({ explorationState: 'EXPLORING' });
    },
  });
}
```

> [!NOTE]
> **Loot is "pending" until dungeon exit.** Player can see what they've collected but can't equip until they leave.

---

## Architectural Considerations

> [!CAUTION]
> **Critical issues to address during implementation.**

### Priority 1: Data Integrity

| Issue | Problem | Solution |
|-------|---------|----------|
| **Dungeon Instance ID** | Same dungeon run twice could conflict in state | Each RUN gets unique `dungeonInstanceId` via `crypto.randomUUID()` |
| **Room State Persistence** | Chests/monsters could be exploited (leave room, return, chest full again) | Store `chestsOpened[]`, `monstersKilled[]` per room |
| **Key Consumption** | Key consumed on start → crash = lost key | Consume key on EXIT, not start. Refund on crash/leave. |

### Priority 2: Performance

| Issue | Problem | Solution |
|-------|---------|----------|
| **Event Delegation** | 165 tiles × onClick listeners = memory bloat | ONE onClick on `.dungeon-grid`, calculate tile from coordinates |
| **A* Timeout** | Large room pathfinding could freeze | Max 500 iterations, then just step once toward goal |
| **Full Map Performance** | Rendering 10 rooms as full grids = slow | Render rooms as simple colored rectangles |

### Priority 3: Transitions

| Issue | Problem | Solution |
|-------|---------|----------|
| **Room Transition Jarring** | Instant room swap feels cheap | Fade-to-black: 150ms out → load → 150ms in |
| **Combat Transition** | What happens to dungeon during fight? | Dungeon FREEZES. State = `IN_COMBAT`. Resume exact position on victory. |
| **Keyboard Focus** | Click note link = lose dungeon controls | "Click to resume" overlay when focus lost |

### Priority 4: Validation

| Issue | Problem | Solution |
|-------|---------|----------|
| **Room Load Failure** | Corrupted layout string (wrong dimensions) | Validate row lengths on load. Auto-pad with walls. Show error toast. |
| **Tile Sprite Fallback** | Sprite fails to load | Each tile type has `iconEmoji` fallback: ⬜⬛🚪📦 |

---

## Open Questions

1. ~~**Dungeon Persistence?**~~ ✅ DECIDED
   - **Answer:** Light persistence only. Save `dungeonInstanceId`, `currentRoomId`, `visitedRooms`, `roomStates`. Reset player to room entry on load.

2. ~~**Death in Dungeon?**~~ ✅ DECIDED
   - **Answer:** 3 options: Restart (lose all), Pay gold rescue (continue), Leave (keep loot so far)

3. ~~**Dungeon Scaling?**~~ ✅ DECIDED
   - **Answer:** Scale to player level each time. Fixed difficulty dungeons can be added later.

4. ~~**How Many Dungeons at Launch?**~~ ✅ DECIDED
   - **Answer:** 2-3 hand-crafted "raid" style dungeons, larger than procedural. AI random option available.

5. ~~**Random vs Selected?**~~ ✅ DECIDED
   - **Answer:** Both! Choose specific dungeon for target farming, OR random for variety.

6. ~~**Minimap?**~~ ✅ DECIDED
   - **Answer:** 3x3 corner minimap + full map modal for visited rooms.

---

## Implementation Order

1. **Zustand dungeon store** - State management with persistence
2. **Tile system** - Define tile types, walkability, emoji fallbacks
3. **Room rendering** - CSS Grid with event delegation
4. **Click-to-move** - A* pathfinding with timeout
5. **Keyboard controls** - WASD + E as alternative
6. **Room transitions** - Fade animation, door auto-trigger
7. **Dungeon template format** - Embedded door definitions
8. **Room state tracking** - Chests opened, monsters killed
9. **Create 1 test dungeon** - "Goblin Cave" handcrafted
10. **Chest interaction** - Loot modal, pending rewards
11. **Monster encounters** - Combat handoff to Fight System
12. **Death handling** - Rescue modal with 3 options
13. **Exit + rewards** - Summary screen, key consumption
14. **Dungeon selection UI** - Target farming + random option
15. **Minimap** - 3x3 corner + full map modal
16. **Additional dungeons** - Create 1-2 more templates
17. **AI generation** (stretch) - Two-pass procedural creation
18. **Mobile touch** - D-pad with onTouchStart

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
> All tiles have emoji fallbacks for development/error recovery.

---

## Related Documents

- [[Gear and Loot System]] - Chests drop gear, inventory management
- [[Fight System]] - Monster encounters trigger combat

---

*Last Updated: 2026-01-23*
