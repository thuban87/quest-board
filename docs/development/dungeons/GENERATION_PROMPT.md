# AI Dungeon Generation Prompt

Copy this prompt and fill in the **[USER INPUT]** sections with your requirements.

---

## PROMPT START

You are generating a dungeon for the Quest Board Obsidian plugin. Output TypeScript code that can be saved as a new file in `src/data/dungeons/`.

---

### TILESET & THEME

**Available Tilesets:**
| Tileset | Theme | Suggested Monsters |
|---------|-------|-------------------|
| `cave` | Dark caverns, gravel floors | goblins, trolls, beasts |
| `forest` | Outdoor ruins, grass floors | beasts, undead |
| `dungeon` | Classic stone dungeon | undead, aberrations |
| `castle` | Castle interior, metal floors | dwarves, night_elves, dragonkin |

**[USER INPUT] Tileset:** `[CHOOSE: cave/forest/dungeon/castle]`

**[USER INPUT] Dungeon Name:** `[NAME OR "AI generate"]`

**[USER INPUT] Description:** `[DESCRIPTION OR "AI generate based on theme"]`

**[USER INPUT] Difficulty:** `[CHOOSE: easy/medium/hard]`

---

### DUNGEON ARCHITECTURE

**Architecture Types:**
| Type | Description |
|------|-------------|
| `linear` | Straight path, no branches |
| `linear-branches` | Main path with optional dead-end side rooms |
| `multi-path` | 2-3 routes to the boss, converging at end |
| `hub-spoke` | Central room with many branches radiating out |
| `maze` | Complex interconnected rooms (advanced) |

**[USER INPUT] Architecture:** `[CHOOSE FROM ABOVE]`

**[USER INPUT] Room Count:** `[NUMBER, e.g., 10, 15, 20]`

**[USER INPUT] Dead-End Branches:** `[NUMBER, e.g., 2, 4]` (for linear-branches type)

---

### MONSTERS

> ⚠️ **CRITICAL: You may ONLY use the exact monster IDs listed below. DO NOT invent new monster names or IDs. If a monster doesn't exist in this list, it will cause errors.**

**Complete Monster ID List (USE THESE EXACT IDs):**

| ID | Category | Good For Boss? |
|----|----------|----------------|
| `wolf` | beasts | No |
| `bear` | beasts | Yes - mini-boss |
| `giant-rat` | beasts | No |
| `skeleton` | undead | No |
| `zombie` | undead | No |
| `ghost` | undead | Yes - mini-boss |
| `goblin` | goblins | No |
| `hobgoblin` | goblins | Yes - mini-boss |
| `bugbear` | goblins | Yes - boss |
| `cave-troll` | trolls | Yes - boss |
| `river-troll` | trolls | Yes - boss |
| `shadow-elf` | night_elves | Yes - mini-boss |
| `dark-ranger` | night_elves | Yes - boss |
| `rogue-dwarf` | dwarves | No |
| `berserker` | dwarves | Yes - boss |
| `drake` | dragonkin | Yes - boss |
| `wyvern` | dragonkin | Yes - boss |
| `mimic` | aberrations | Yes - mini-boss |
| `eye-beast` | aberrations | Yes - boss |

**[USER INPUT] Total Monsters:** `[NUMBER, e.g., 25, 30]`

**[USER INPUT] Monster Categories:** `[LIST, e.g., "goblins, beasts" OR "AI suggest based on tileset"]`

**[USER INPUT] Boss Monster(s):** `[MONSTER ID FROM TABLE ABOVE, e.g., "bugbear" OR "cave-troll"]`

**Monster Density Rules:**
- Entry room: 0 monsters (safe spawn)
- Standard 11×7 room: 1-6 monsters
- Tall rooms (11×14+): up to 12 monsters
- Boss rooms can have the boss + additional monsters

---

### CHESTS & LOOT

**Chest Tiers:**
| Tier | Quality | When to Use |
|------|---------|-------------|
| `novice` | Common | Early rooms (first 30%) |
| `adept` | Uncommon | Early-mid rooms |
| `journeyman` | Rare | Mid-dungeon |
| `master` | Epic | Near boss, boss room |
| `legendary` | Legendary | Boss room ONLY (never in dead ends) |

**[USER INPUT] Loot Focus Slots:** `[LIST, e.g., "weapon, chest" OR "AI suggest"]`

**Chest Placement Rules:**
- 0-2 chests per standard room
- 2-4 chests in boss room or treasure room after boss
- Dead-end branches get +1 tier bonus (but max `master`, never `legendary`)
- Progress tiers based on room distance from entry

---

### ROOM STRUCTURE RULES

**Standard Room Size:** 11 tiles wide × 7 tiles tall

**Tall Rooms:** 11×14 or 11×21 (use sparingly, exception not norm)

**Room Types:**
| Type | Purpose | Monsters | Chests |
|------|---------|----------|--------|
| `entry` | Starting room, safe | None | None |
| `combat` | Fighting rooms | Yes | Optional |
| `treasure` | Loot rooms | Optional | Yes |
| `boss` | Final boss fight | Boss + others | 2-4 |

**Portal Placement:**
- Place `O` (portal) in the final boss room
- OR in a treasure room immediately after the boss (with extra loot)

---

### LAYOUT CHARACTER DEFINITIONS

| Char | Name | Walkable | Notes |
|------|------|----------|-------|
| `#` | Wall | No | Blocking |
| `.` | Floor | Yes | Walkable ground |
| `P` | Spawn | Yes | Player start (ONE per dungeon, in entry room) |
| `M` | Monster | Yes | Monster spawn point |
| `C` | Chest | No | Treasure chest |
| `O` | Portal | Yes | Dungeon exit |
| `~` | Water | No | Hazard tile |
| `B` | Boulder | No | Obstacle |

---

### CRITICAL CONSTRAINTS (MUST FOLLOW)

1. **ALL rows must be EXACTLY 11 characters wide.** Count every row. No exceptions.

2. **Doors must be on walkable tiles.** A door position like `5,6` means column 5, row 6 must be `.` or blank in the layout, NOT `#`.

3. **Doorway clearance:** NEVER place `B`, `~`, or `C` on or adjacent to door positions. Leave at least one `.` on each side of every door.

4. **Bidirectional doors:** If Room A has a door to Room B, Room B MUST have a door back to Room A.

5. **Monster metadata must match layout:** Every `M` in the layout needs a corresponding entry in the `monsters` array with matching position.

6. **Chest metadata must match layout:** Every `C` in the layout needs a corresponding entry in the `chests` array with matching position.

7. **Positions are [x, y] where x=column (0-10), y=row (0-6 for standard rooms).**

---

### OUTPUT FORMAT

Generate a TypeScript constant following this exact structure:

```typescript
export const DUNGEON_NAME: DungeonTemplate = {
    id: 'dungeon_id',
    name: 'Dungeon Display Name',
    description: 'A description of the dungeon.',
    baseDifficulty: 'medium',
    tileSet: 'cave',
    lootBias: {
        primarySlots: ['weapon', 'chest'],
        description: 'Good for weapons and armor',
    },
    rooms: [
        {
            id: 'entry',
            type: 'entry',
            width: 11,
            height: 7,
            layout: [
                '###########',
                '#.........#',
                '#.........#',
                '#....P....#',
                '#.........#',
                '#.........#',
                '#####.#####',
            ],
            doors: {
                '5,6': { targetRoom: 'next_room', targetEntry: 'north' },
            },
        },
        // ... more rooms
    ],
};
```

---

### EXAMPLE ROOM WITH MONSTERS AND CHESTS

```typescript
{
    id: 'guard_room',
    type: 'combat',
    width: 11,
    height: 7,
    layout: [
        '#####.#####',  // Row 0 - door at position 5,0
        '#.........#',  // Row 1
        '#..M...M..#',  // Row 2 - monsters at 3,2 and 7,2
        '#.........#',  // Row 3
        '#..C...C..#',  // Row 4 - chests at 3,4 and 7,4
        '#.........#',  // Row 5
        '#####.#####',  // Row 6 - door at position 5,6
    ],
    doors: {
        '5,0': { targetRoom: 'previous_room', targetEntry: 'south' },
        '5,6': { targetRoom: 'next_room', targetEntry: 'north' },
    },
    chests: [
        { position: [3, 4], tier: 'journeyman' },
        { position: [7, 4], tier: 'journeyman' },
    ],
    monsters: [
        { position: [3, 2], pool: ['hobgoblin'] },
        { position: [7, 2], pool: ['hobgoblin'] },
    ],
},
```

---

Now generate the dungeon based on the user inputs provided above.

## PROMPT END

---

## NOTES FOR BRAD

1. Fill in all `[USER INPUT]` sections before running
2. Review output carefully - AI often makes row width errors
3. Run the cleanup prompt on the output to catch common issues
4. Save AI output to `docs/development/dungeons/quarantine/` for review before adding to codebase
5. **IMPORTANT:** To add a new built-in dungeon:
   1. Save the file as `src/data/dungeons/yourDungeonName.ts`
   2. Add `import { YOUR_DUNGEON } from './yourDungeonName';` in `src/data/dungeons/index.ts`
   3. Add `your_dungeon: YOUR_DUNGEON,` to the `BUILTIN_TEMPLATES` record in `index.ts`
   4. Add the re-export to the `export { ... }` line in `index.ts`
