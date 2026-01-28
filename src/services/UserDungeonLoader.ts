/**
 * User Dungeon Loader
 * 
 * Loads custom dungeon templates from markdown files in the user's vault.
 * Parses YAML frontmatter for dungeon metadata and room sections for layouts.
 * 
 * File Format:
 * ```markdown
 * ---
 * name: My Custom Dungeon
 * description: A description of the dungeon
 * difficulty: easy|medium|hard
 * tileset: cave|forest|dungeon|castle
 * lootSlots: [weapon, head]
 * lootDescription: Good for weapons
 * ---
 * 
 * ## room_id
 * type: entry|combat|treasure|boss
 * layout: |
 *   ###########
 *   #....P....#
 *   ###########
 * doors:
 *   5,2: other_room/north
 * chests:
 *   - position: [3, 4]
 *     tier: adept
 * monsters:
 *   - position: [5, 2]
 *     pool: [goblin]
 *     isBoss: false
 * ```
 */

import type { App, TFile, TFolder, Vault } from 'obsidian';
import type { DungeonTemplate, RoomTemplate, DungeonDifficulty, TileSet, RoomType, Direction } from '../models/Dungeon';
import type { GearSlot, GearTier } from '../models/Gear';

// ============================================
// YAML Parsing (Simple implementation)
// ============================================

/**
 * Parse YAML-like content (simple key: value pairs)
 * Does not handle complex nested structures but covers our needs.
 */
function parseSimpleYaml(content: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = content.split('\n');
    let currentKey = '';
    let currentIndent = 0;
    let inMultiline = false;
    let multilineValue = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Handle multiline strings (|) FIRST - don't skip lines here
        if (inMultiline) {
            const indent = line.length - line.trimStart().length;
            // Continue multiline if this line is indented more than the key
            if (indent > currentIndent || (trimmed.startsWith('#') && indent > 0)) {
                // Preserve leading spaces relative to base indent
                const contentLine = line.substring(Math.min(currentIndent + 2, line.length));
                multilineValue += (multilineValue ? '\n' : '') + contentLine;
                continue;
            } else if (trimmed === '') {
                // Empty lines inside multiline are preserved
                multilineValue += '\n';
                continue;
            } else {
                // End multiline - line is not indented enough
                result[currentKey] = multilineValue;
                inMultiline = false;
            }
        }

        // Skip empty lines and comments (only when NOT in multiline)
        if (!trimmed || trimmed.startsWith('#')) continue;

        // Match key: value
        const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
        if (match) {
            const [, key, value] = match;
            currentKey = key;
            currentIndent = line.length - line.trimStart().length;

            if (value === '|') {
                // Start multiline
                inMultiline = true;
                multilineValue = '';
            } else if (value.startsWith('[') && value.endsWith(']')) {
                // Inline array
                const inner = value.slice(1, -1).trim();
                result[key] = inner ? inner.split(',').map(s => s.trim().replace(/['"]/g, '')) : [];
            } else if (value === '') {
                // Start of nested object or array - check next line
                result[key] = {};
            } else {
                // Simple value
                result[key] = value.replace(/^['"]|['"]$/g, '');
            }
        } else if (trimmed.startsWith('- ')) {
            // Array item
            if (!Array.isArray(result[currentKey])) {
                result[currentKey] = [];
            }
            // Parse the item (could be simple or object)
            const itemContent = trimmed.substring(2);
            const arrayItemIndent = line.length - line.trimStart().length;

            if (itemContent.includes(':')) {
                // Object in array - collect until next item
                const obj: Record<string, any> = {};
                const colonIdx = itemContent.indexOf(':');
                const firstKey = itemContent.substring(0, colonIdx).trim();
                const firstVal = itemContent.substring(colonIdx + 1).trim();
                obj[firstKey] = parseValue(firstVal);

                // Look ahead for more properties (must be more indented than the `- `)
                while (i + 1 < lines.length) {
                    const nextLine = lines[i + 1];
                    const nextTrimmed = nextLine.trim();
                    const nextIndent = nextLine.length - nextLine.trimStart().length;

                    // Stop if: empty line, new array item, or less/equal indentation
                    if (!nextTrimmed || nextTrimmed.startsWith('- ') || nextIndent <= arrayItemIndent) {
                        break;
                    }

                    // Parse property
                    const propMatch = nextTrimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
                    if (propMatch) {
                        obj[propMatch[1]] = parseValue(propMatch[2]);
                        i++;
                    } else {
                        break;
                    }
                }
                result[currentKey].push(obj);
            } else {
                result[currentKey].push(parseValue(itemContent));
            }
        } else if (trimmed.match(/^[a-zA-Z0-9,]+:\s*.+$/)) {
            // Nested key: value (like doors: 5,6: room/dir)
            const parts = trimmed.split(':').map(s => s.trim());
            if (parts.length >= 2) {
                if (typeof result[currentKey] !== 'object' || Array.isArray(result[currentKey])) {
                    result[currentKey] = {};
                }
                result[currentKey][parts[0]] = parts.slice(1).join(':').trim();
            }
        }
    }

    // Handle final multiline
    if (inMultiline && currentKey) {
        result[currentKey] = multilineValue;
    }

    return result;
}

function parseValue(value: string): any {
    if (!value) return '';
    value = value.trim();

    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
        return Number(value);
    }

    // Array
    if (value.startsWith('[') && value.endsWith(']')) {
        const inner = value.slice(1, -1).trim();
        return inner ? inner.split(',').map(s => parseValue(s.trim().replace(/['"]/g, ''))) : [];
    }

    // String (remove quotes)
    return value.replace(/^['"]|['"]$/g, '');
}

// ============================================
// Dungeon Loader
// ============================================

export interface DungeonLoadResult {
    template: DungeonTemplate | null;
    errors: string[];
    warnings: string[];
}

/**
 * Parse a single dungeon markdown file into a DungeonTemplate.
 */
export function parseDungeonMarkdown(content: string, filename: string): DungeonLoadResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Split into sections by ---
    const sections = content.split(/^---$/m).map(s => s.trim()).filter(s => s);

    if (sections.length < 2) {
        errors.push(`${filename}: Not enough sections. Need frontmatter + at least 1 room.`);
        return { template: null, errors, warnings };
    }

    // Parse frontmatter (first section)
    const frontmatter = parseSimpleYaml(sections[0]);

    // Validate required frontmatter fields
    if (!frontmatter.name) {
        errors.push(`${filename}: Missing 'name' in frontmatter`);
    }
    if (!frontmatter.tileset) {
        warnings.push(`${filename}: Missing 'tileset', defaulting to 'cave'`);
        frontmatter.tileset = 'cave';
    }
    if (!frontmatter.difficulty) {
        warnings.push(`${filename}: Missing 'difficulty', defaulting to 'medium'`);
        frontmatter.difficulty = 'medium';
    }

    // Generate ID from filename
    const id = filename.replace(/\.md$/i, '').toLowerCase().replace(/\s+/g, '_');

    // Parse rooms (remaining sections)
    const rooms: RoomTemplate[] = [];

    for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        const roomResult = parseRoomSection(section, filename, i);

        if (roomResult.room) {
            rooms.push(roomResult.room);
        }
        errors.push(...roomResult.errors);
        warnings.push(...roomResult.warnings);
    }

    if (rooms.length === 0) {
        errors.push(`${filename}: No valid rooms found`);
        return { template: null, errors, warnings };
    }

    // Build lootBias from flat fields (lootSlots + lootDescription)
    const lootBias = {
        primarySlots: (frontmatter.lootSlots || ['weapon']) as GearSlot[],
        description: frontmatter.lootDescription || 'Mixed loot',
    };

    const template: DungeonTemplate = {
        id: `user_${id}`,
        name: frontmatter.name || filename,
        description: frontmatter.description || '',
        baseDifficulty: frontmatter.difficulty as DungeonDifficulty,
        tileSet: frontmatter.tileset as TileSet,
        lootBias,
        rooms,
    };

    return { template, errors, warnings };
}

/**
 * Parse a room section from the markdown.
 */
function parseRoomSection(section: string, filename: string, index: number): {
    room: RoomTemplate | null;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract room ID from header
    const headerMatch = section.match(/^##\s+([a-zA-Z0-9_]+)/m);
    if (!headerMatch) {
        errors.push(`${filename} section ${index}: Missing room header (## room_id)`);
        return { room: null, errors, warnings };
    }
    const roomId = headerMatch[1];

    // Remove header and parse remaining as YAML
    const yamlContent = section.replace(/^##\s+[a-zA-Z0-9_]+\s*\n?/, '');
    const roomData = parseSimpleYaml(yamlContent);

    // Validate required fields
    if (!roomData.type) {
        warnings.push(`${filename} room ${roomId}: Missing 'type', defaulting to 'combat'`);
        roomData.type = 'combat';
    }

    if (!roomData.layout) {
        errors.push(`${filename} room ${roomId}: Missing 'layout'`);
        return { room: null, errors, warnings };
    }

    // Parse layout into array of strings
    const layout = roomData.layout.split('\n').filter((line: string) => line.trim());

    // Validate layout dimensions
    const height = layout.length;
    const width = layout[0]?.length || 0;

    for (let i = 0; i < layout.length; i++) {
        if (layout[i].length !== width) {
            warnings.push(`${filename} room ${roomId}: Row ${i} has inconsistent width (${layout[i].length} vs ${width}). Padding with walls.`);
            layout[i] = layout[i].padEnd(width, '#');
        }
    }

    // Parse doors
    const doors: Record<string, { targetRoom: string; targetEntry: Direction }> = {};
    if (roomData.doors) {
        for (const [pos, target] of Object.entries(roomData.doors)) {
            const targetStr = target as string;
            const [targetRoom, targetEntry] = targetStr.split('/');
            if (targetRoom && targetEntry) {
                doors[pos] = {
                    targetRoom,
                    targetEntry: targetEntry as Direction
                };
            } else {
                warnings.push(`${filename} room ${roomId}: Invalid door format at ${pos}. Expected 'room_id/direction'.`);
            }
        }
    }

    // Parse chests
    const chests: Array<{ position: [number, number]; tier: GearTier }> = [];
    if (Array.isArray(roomData.chests)) {
        for (const chest of roomData.chests) {
            if (chest.position && chest.tier) {
                const pos = Array.isArray(chest.position)
                    ? chest.position
                    : parseValue(chest.position);
                chests.push({
                    position: [Number(pos[0]), Number(pos[1])],
                    tier: chest.tier as GearTier,
                });
            }
        }
    }

    // Parse monsters
    const monsters: Array<{ position: [number, number]; pool: string[]; isBoss?: boolean }> = [];
    if (Array.isArray(roomData.monsters)) {
        for (const monster of roomData.monsters) {
            if (monster.position && monster.pool) {
                const pos = Array.isArray(monster.position)
                    ? monster.position
                    : parseValue(monster.position);
                const pool = Array.isArray(monster.pool)
                    ? monster.pool
                    : parseValue(monster.pool);
                monsters.push({
                    position: [Number(pos[0]), Number(pos[1])],
                    pool: pool as string[],
                    isBoss: monster.isBoss === true || monster.isBoss === 'true',
                });
            }
        }
    }

    const room: RoomTemplate = {
        id: roomId,
        type: roomData.type as RoomType,
        width,
        height,
        layout,
        doors,
        ...(chests.length > 0 ? { chests } : {}),
        ...(monsters.length > 0 ? { monsters } : {}),
    };

    return { room, errors, warnings };
}

/**
 * Load all dungeon templates from a folder in the vault.
 */
export async function loadUserDungeons(
    vault: Vault,
    folderPath: string
): Promise<{ templates: DungeonTemplate[]; errors: string[]; warnings: string[] }> {
    const templates: DungeonTemplate[] = [];
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Check if folder exists
    const folder = vault.getAbstractFileByPath(folderPath);
    if (!folder) {
        return { templates, errors: [], warnings: [] };
    }

    if (!(folder as any).children) {
        return { templates, errors: [], warnings: [] };
    }

    // Find all markdown files
    const mdFiles: TFile[] = [];
    const findMdFiles = (f: TFolder) => {
        for (const child of f.children) {
            if ((child as TFile).extension === 'md') {
                mdFiles.push(child as TFile);
            } else if ((child as any).children) {
                findMdFiles(child as TFolder);
            }
        }
    };
    findMdFiles(folder as TFolder);

    // Parse each file
    for (const file of mdFiles) {
        try {
            const content = await vault.read(file);
            const result = parseDungeonMarkdown(content, file.basename);

            if (result.template) {
                templates.push(result.template);
            }

            allErrors.push(...result.errors);
            allWarnings.push(...result.warnings);
        } catch (error) {
            allErrors.push(`Failed to read ${file.path}: ${error}`);
        }
    }

    // Log warnings and errors if present
    if (allWarnings.length > 0) {
        console.warn('[UserDungeonLoader] Warnings:', allWarnings);
    }
    if (allErrors.length > 0) {
        console.error('[UserDungeonLoader] Errors:', allErrors);
    }

    return { templates, errors: allErrors, warnings: allWarnings };
}

/**
 * Create the dungeon template documentation file in the user's vault.
 */
export async function createDungeonTemplateDoc(vault: Vault, folderPath: string): Promise<void> {
    const docPath = `${folderPath}/DUNGEON_FORMAT.md`;

    // Check if already exists
    if (vault.getAbstractFileByPath(docPath)) {
        return; // Don't overwrite existing
    }

    const docContent = `# Custom Dungeon Format Guide

Create your own dungeons by adding \`.md\` files to this folder!

---

## Quick Start Template

\`\`\`markdown
---
name: My Custom Dungeon
description: A short description of your dungeon
difficulty: medium
tileset: cave
lootSlots: [weapon, chest]
lootDescription: Good for weapons and armor
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
  5,4: combat_hall/north

---

## combat_hall
type: combat
layout: |
  #####.#####
  #....M....#
  #.........#
  #..C...C..#
  #....O....#
  ###########
doors:
  5,0: entry/south
chests:
  - position: [3, 3]
    tier: adept
  - position: [7, 3]
    tier: journeyman
monsters:
  - position: [5, 1]
    pool: [goblin, skeleton]
    isBoss: false
\`\`\`

---

## Layout Characters

| Char | Name | Walkable | Description |
|------|------|----------|-------------|
| \`#\` | Wall | No | Blocking obstacle |
| \`.\` | Floor | Yes | Walkable ground |
| \`P\` | Spawn | Yes | Player start position (one per dungeon) |
| \`M\` | Monster | Yes | Monster spawn point |
| \`C\` | Chest | No | Treasure chest |
| \`O\` | Portal | Yes | Dungeon exit (place in final room) |
| \`~\` | Water | No | Hazard/water tile |
| \`B\` | Boulder | No | Obstacle (renders on floor) |

> ⚠️ **Rule**: Never place blocking tiles (\`#\`, \`~\`, \`B\`, \`C\`) directly in front of doorways!

---

## Available Tilesets

| Tileset | Theme | Example Dungeons |
|---------|-------|------------------|
| \`cave\` | Dark caverns, rock floors | Goblin Cave, Abandoned Mine |
| \`forest\` | Outdoor ruins, grass floors | Forest Ruins |
| \`dungeon\` | Classic stone dungeon | Haunted Crypt |
| \`castle\` | Castle interior, wood floors | Dragon's Lair |

---

## Difficulty Levels

| Level | Description |
|-------|-------------|
| \`easy\` | Lower monster stats, more forgiving |
| \`medium\` | Balanced challenge |
| \`hard\` | Higher monster stats, tougher fights |

---

## Monster Pools

Use these IDs in your \`pool\` arrays:

### Beasts 🐺
- \`wolf\`, \`bear\`, \`giant-rat\`

### Undead 💀
- \`skeleton\`, \`zombie\`, \`ghost\`

### Goblins 👺
- \`goblin\`, \`hobgoblin\`, \`bugbear\`

### Trolls 🧌
- \`cave-troll\`, \`river-troll\`

### Night Elves 🧝
- \`shadow-elf\`, \`dark-ranger\`

### Dwarves ⛏️
- \`rogue-dwarf\`, \`berserker\`

### Dragonkin 🐉
- \`drake\`, \`wyvern\`

### Aberrations 👁️
- \`mimic\`, \`eye-beast\`

---

## Chest Tiers

| Tier | Loot Quality |
|------|--------------|
| \`novice\` | ⬜ Common items |
| \`adept\` | 🟢 Uncommon items |
| \`journeyman\` | 🔵 Rare items |
| \`master\` | 🟣 Epic items |
| \`legendary\` | 🟠 Legendary items |

---

## Room Types

| Type | Purpose |
|------|---------|
| \`entry\` | Starting room (safe, no combat) |
| \`combat\` | Contains monsters |
| \`treasure\` | Contains chests (optional monsters) |
| \`boss\` | Final room with boss monster |

---

## Door Format

Doors connect rooms. Format: \`x,y: target_room/entry_direction\`

- \`x,y\` = position in layout (0-indexed)
- \`target_room\` = ID of the room this door leads to
- \`entry_direction\` = which direction player enters from: \`north\`, \`south\`, \`east\`, or \`west\`

Example:
\`\`\`yaml
doors:
  5,0: main_hall/south   # Door at top leads to main_hall, entering from south
  0,3: west_room/east    # Door on left leads to west_room, entering from east
\`\`\`

---

## Tips

1. **Room sizes**: Standard is 11×7. Max is 11 wide (no horizontal scroll at 2x scale)
2. **One spawn**: Only one room should have \`P\` (player spawn) - usually the \`entry\` room
3. **Exit portal**: Place \`O\` in the final room (usually boss room)
4. **Test your dungeon**: Use the "Preview Dungeon" command to test before sharing
5. **Naming**: File names become dungeon IDs (e.g., \`my_dungeon.md\` → \`user_my_dungeon\`)

---

*Quest Board Plugin - Custom Dungeon System*
`;

    // Ensure folder exists
    if (!vault.getAbstractFileByPath(folderPath)) {
        await vault.createFolder(folderPath);
    }

    await vault.create(docPath, docContent);
}
