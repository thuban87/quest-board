/**
 * Tile Registry
 * 
 * Maps layout characters to tile definitions for each tileset.
 * Provides paths to 64x64 environment sprites with emoji fallbacks.
 */

import type { TileDefinition, TileSet, TileType } from '../models/Dungeon';

// ============================================
// Layout Character Mapping
// ============================================

/**
 * Standard layout characters used across all tilesets.
 * 
 * '#' = wall
 * '.' = floor
 * 'P' = player spawn (renders as floor)
 * 'D' = door/exit point
 * 'C' = chest
 * 'M' = monster spawn (renders as floor)
 * 'O' = portal/dungeon exit
 */
export const LAYOUT_CHARS = {
    WALL: '#',
    FLOOR: '.',
    SPAWN: 'P',
    DOOR: 'D',
    CHEST: 'C',
    MONSTER: 'M',
    PORTAL: 'O',
} as const;

// ============================================
// Tile Definitions per Tileset
// ============================================

/**
 * Complete tile registry mapping layout characters to definitions.
 * Each tileset has its own visual theme.
 */
export const TILE_REGISTRY: Record<TileSet, Record<string, TileDefinition>> = {
    cave: {
        '#': {
            type: 'wall',
            walkable: false,
            autoInteract: false,
            sprite: 'basalt.png', // Was 'cave wall.png' - had black bars
            emoji: '⬛',
        },
        '.': {
            type: 'floor',
            walkable: true,
            autoInteract: false,
            sprite: 'cave gravel.png',
            emoji: '⬜',
        },
        'P': {
            type: 'spawn',
            walkable: true,
            autoInteract: false,
            sprite: 'cave gravel.png', // Same as floor
            emoji: '⬜',
        },
        'D': {
            type: 'door',
            walkable: true,
            autoInteract: true,
            sprite: 'cave gravel.png', // Cave "doors" are just openings
            emoji: '🚪',
        },
        'C': {
            type: 'chest',
            walkable: false,
            autoInteract: false,
            sprite: null, // Use emoji for now
            emoji: '📦',
        },
        'M': {
            type: 'monster',
            walkable: true, // Walkable until monster spawns
            autoInteract: false,
            sprite: 'cave gravel.png',
            emoji: '⬜',
        },
        'O': {
            type: 'portal',
            walkable: true,
            autoInteract: true,
            sprite: null,
            emoji: '🌀',
        },
    },

    // Forest tileset - uses outdoor tiles
    forest: {
        '#': {
            type: 'wall',
            walkable: false,
            autoInteract: false,
            sprite: 'cliff.png',
            emoji: '🌲',
        },
        '.': {
            type: 'floor',
            walkable: true,
            autoInteract: false,
            sprite: 'grass.png',
            emoji: '🟩',
        },
        'P': {
            type: 'spawn',
            walkable: true,
            autoInteract: false,
            sprite: 'grass.png',
            emoji: '🟩',
        },
        'D': {
            type: 'door',
            walkable: true,
            autoInteract: true,
            sprite: 'path.png', // Forest paths as exits
            emoji: '🚪',
        },
        'C': {
            type: 'chest',
            walkable: false,
            autoInteract: false,
            sprite: null,
            emoji: '📦',
        },
        'M': {
            type: 'monster',
            walkable: true,
            autoInteract: false,
            sprite: 'grass.png',
            emoji: '🟩',
        },
        'O': {
            type: 'portal',
            walkable: true,
            autoInteract: true,
            sprite: null,
            emoji: '🌀',
        },
    },

    // Classic dungeon tileset - stone floors and walls
    dungeon: {
        '#': {
            type: 'wall',
            walkable: false,
            autoInteract: false,
            sprite: 'granite cliff.png',
            emoji: '⬛',
        },
        '.': {
            type: 'floor',
            walkable: true,
            autoInteract: false,
            sprite: 'stone tile.png',
            emoji: '⬜',
        },
        'P': {
            type: 'spawn',
            walkable: true,
            autoInteract: false,
            sprite: 'stone tile.png',
            emoji: '⬜',
        },
        'D': {
            type: 'door',
            walkable: true,
            autoInteract: true,
            sprite: 'stone tile.png',
            emoji: '🚪',
        },
        'C': {
            type: 'chest',
            walkable: false,
            autoInteract: false,
            sprite: null,
            emoji: '📦',
        },
        'M': {
            type: 'monster',
            walkable: true,
            autoInteract: false,
            sprite: 'stone tile.png',
            emoji: '⬜',
        },
        'O': {
            type: 'portal',
            walkable: true,
            autoInteract: true,
            sprite: null,
            emoji: '🌀',
        },
    },

    // Castle tileset - wood floors, stone walls
    castle: {
        '#': {
            type: 'wall',
            walkable: false,
            autoInteract: false,
            sprite: 'wood wall.png',
            emoji: '🧱',
        },
        '.': {
            type: 'floor',
            walkable: true,
            autoInteract: false,
            sprite: 'wood tile.png',
            emoji: '🟫',
        },
        'P': {
            type: 'spawn',
            walkable: true,
            autoInteract: false,
            sprite: 'wood tile.png',
            emoji: '🟫',
        },
        'D': {
            type: 'door',
            walkable: true,
            autoInteract: true,
            sprite: 'wood tile.png',
            emoji: '🚪',
        },
        'C': {
            type: 'chest',
            walkable: false,
            autoInteract: false,
            sprite: null,
            emoji: '📦',
        },
        'M': {
            type: 'monster',
            walkable: true,
            autoInteract: false,
            sprite: 'wood tile.png',
            emoji: '🟫',
        },
        'O': {
            type: 'portal',
            walkable: true,
            autoInteract: true,
            sprite: null,
            emoji: '🌀',
        },
    },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get a tile definition for a layout character and tileset.
 * Falls back to floor if character is unknown.
 */
export function getTileDefinition(char: string, tileSet: TileSet): TileDefinition {
    const registry = TILE_REGISTRY[tileSet];
    return registry[char] ?? registry['.'];
}

/**
 * Check if a tile character is walkable in a tileset.
 */
export function isWalkable(char: string, tileSet: TileSet): boolean {
    return getTileDefinition(char, tileSet).walkable;
}

/**
 * Get full sprite path for a tile.
 * Returns null if sprite not defined (will use emoji).
 */
export function getTileSpritePath(
    char: string,
    tileSet: TileSet,
    manifestDir: string
): string | null {
    const def = getTileDefinition(char, tileSet);
    if (!def.sprite) return null;
    return `${manifestDir}/assets/environment/${def.sprite}`;
}

/**
 * Find spawn position ('P') in a room layout.
 * Returns [x, y] or null if not found.
 */
export function findSpawnPosition(layout: string[]): [number, number] | null {
    for (let y = 0; y < layout.length; y++) {
        const x = layout[y].indexOf('P');
        if (x !== -1) {
            return [x, y];
        }
    }
    return null;
}

/**
 * Find all positions of a character in a layout.
 */
export function findAllPositions(layout: string[], char: string): Array<[number, number]> {
    const positions: Array<[number, number]> = [];
    for (let y = 0; y < layout.length; y++) {
        for (let x = 0; x < layout[y].length; x++) {
            if (layout[y][x] === char) {
                positions.push([x, y]);
            }
        }
    }
    return positions;
}
