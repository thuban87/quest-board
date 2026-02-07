/**
 * Tile Registry
 * 
 * Maps layout characters to tile definitions for each tileset.
 * Uses organized folder structure:
 *   - {tileset}/floor/  - walkable ground tiles
 *   - {tileset}/wall/   - blocking wall tiles
 *   - _shared/floor/    - universal floor tiles
 *   - _shared/wall/     - universal wall tiles
 *   - _shared/hazard/   - non-walkable terrain (water, lava)
 *   - _shared/obstacle/ - blocking overlays (boulders)
 *   - _shared/decorative/ - walkable overlays
 *   - _interactive/     - chests, doors, portals
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
 * '~' = water/hazard (non-walkable)
 * 'B' = boulder/obstacle (renders with floor underneath)
 */
export const LAYOUT_CHARS = {
    WALL: '#',
    FLOOR: '.',
    SPAWN: 'P',
    DOOR: 'D',
    CHEST: 'C',
    MONSTER: 'M',
    PORTAL: 'O',
    HAZARD: '~',
    OBSTACLE: 'B',
} as const;

// ============================================
// Tile Categories (folder-based properties)
// ============================================

/**
 * Properties inferred from folder categories.
 * Used for auto-discovery and defaults.
 */
export const CATEGORY_RULES: Record<string, Partial<TileDefinition>> = {
    floor: { walkable: true, autoInteract: false, type: 'floor' },
    wall: { walkable: false, autoInteract: false, type: 'wall' },
    hazard: { walkable: false, autoInteract: false, type: 'floor' },
    decorative: { walkable: true, autoInteract: false, type: 'floor' },
    obstacle: { walkable: false, autoInteract: false, type: 'floor' },
};

// ============================================
// Tile Definitions per Tileset
// ============================================

/**
 * Complete tile registry mapping layout characters to definitions.
 * Each tileset has its own visual theme.
 * Sprite paths now use organized folder structure.
 */
export const TILE_REGISTRY: Record<TileSet, Record<string, TileDefinition>> = {
    cave: {
        '#': {
            type: 'wall',
            walkable: false,
            autoInteract: false,
            sprite: 'cave/wall/cliff.png',
            emoji: '⬛',
        },
        '.': {
            type: 'floor',
            walkable: true,
            autoInteract: false,
            sprite: 'cave/floor/cave-gravel.png',
            emoji: '⬜',
        },
        'P': {
            type: 'spawn',
            walkable: true,
            autoInteract: false,
            sprite: 'cave/floor/cave-gravel.png',
            emoji: '⬜',
        },
        'D': {
            type: 'door',
            walkable: true,
            autoInteract: true,
            sprite: 'cave/floor/cave-gravel.png', // Cave "doors" are just openings
            emoji: '🚪',
        },
        'C': {
            type: 'chest',
            walkable: false,
            autoInteract: false,
            sprite: '_interactive/chest-large-closed.png',
            openSprite: '_interactive/chest-large-open.png',
            emoji: '📦',
            isOverlay: true,
        },
        'M': {
            type: 'monster',
            walkable: true, // Walkable until monster spawns
            autoInteract: false,
            sprite: 'cave/floor/cave-gravel.png',
            emoji: '⬜',
        },
        'O': {
            type: 'portal',
            walkable: true,
            autoInteract: true,
            sprite: null,
            emoji: '🌀',
            isOverlay: true,
        },
        '~': {
            type: 'floor',
            walkable: false,
            autoInteract: false,
            sprite: '_shared/hazard/cavewater.png',
            emoji: '🌊',
        },
        'B': {
            type: 'floor',
            walkable: false,
            autoInteract: false,
            sprite: '_shared/obstacle/rock-large-01.png',
            emoji: '🪨',
            isOverlay: true,
        },
    },

    // Forest tileset - uses outdoor tiles
    forest: {
        '#': {
            type: 'wall',
            walkable: false,
            autoInteract: false,
            sprite: 'forest/wall/wall-brown-01.png',
            emoji: '🌲',
        },
        '.': {
            type: 'floor',
            walkable: true,
            autoInteract: false,
            sprite: '_shared/floor/grass.png',
            emoji: '🟩',
        },
        'P': {
            type: 'spawn',
            walkable: true,
            autoInteract: false,
            sprite: '_shared/floor/grass.png',
            emoji: '🟩',
        },
        'D': {
            type: 'door',
            walkable: true,
            autoInteract: true,
            sprite: 'forest/floor/highland.png',
            emoji: '🚪',
        },
        'C': {
            type: 'chest',
            walkable: false,
            autoInteract: false,
            sprite: '_interactive/chest-large-closed.png',
            openSprite: '_interactive/chest-large-open.png',
            emoji: '📦',
            isOverlay: true,
        },
        'M': {
            type: 'monster',
            walkable: true,
            autoInteract: false,
            sprite: '_shared/floor/grass.png',
            emoji: '🟩',
        },
        'O': {
            type: 'portal',
            walkable: true,
            autoInteract: true,
            sprite: null,
            emoji: '🌀',
            isOverlay: true,
        },
        '~': {
            type: 'floor',
            walkable: false,
            autoInteract: false,
            sprite: '_shared/hazard/water.png',
            emoji: '🌊',
        },
        'B': {
            type: 'floor',
            walkable: false,
            autoInteract: false,
            sprite: '_shared/obstacle/rock-large-01.png',
            emoji: '🪨',
            isOverlay: true,
        },
    },

    // Classic dungeon tileset - stone floors and walls
    dungeon: {
        '#': {
            type: 'wall',
            walkable: false,
            autoInteract: false,
            sprite: '_shared/wall/wall-brick-gray-01.png',
            emoji: '⬛',
        },
        '.': {
            type: 'floor',
            walkable: true,
            autoInteract: false,
            sprite: 'cave/floor/granite-floor.png',
            emoji: '⬜',
        },
        'P': {
            type: 'spawn',
            walkable: true,
            autoInteract: false,
            sprite: 'cave/floor/granite-floor.png',
            emoji: '⬜',
        },
        'D': {
            type: 'door',
            walkable: true,
            autoInteract: true,
            sprite: 'cave/floor/granite-floor.png',
            emoji: '🚪',
        },
        'C': {
            type: 'chest',
            walkable: false,
            autoInteract: false,
            sprite: '_interactive/chest-large-closed.png',
            openSprite: '_interactive/chest-large-open.png',
            emoji: '📦',
            isOverlay: true,
        },
        'M': {
            type: 'monster',
            walkable: true,
            autoInteract: false,
            sprite: 'cave/floor/granite-floor.png',
            emoji: '⬜',
        },
        'O': {
            type: 'portal',
            walkable: true,
            autoInteract: true,
            sprite: null,
            emoji: '🌀',
            isOverlay: true,
        },
        '~': {
            type: 'floor',
            walkable: false,
            autoInteract: false,
            sprite: '_shared/hazard/water.png',
            emoji: '🌊',
        },
        'B': {
            type: 'floor',
            walkable: false,
            autoInteract: false,
            sprite: '_shared/obstacle/rock-large-01.png',
            emoji: '🪨',
            isOverlay: true,
        },
    },

    // Castle tileset - wood floors, stone walls
    castle: {
        '#': {
            type: 'wall',
            walkable: false,
            autoInteract: false,
            sprite: 'castle/wall/wall-brick-red-01.png',
            emoji: '🧱',
        },
        '.': {
            type: 'floor',
            walkable: true,
            autoInteract: false,
            sprite: 'castle/floor/wall-metal-01.png',
            emoji: '🟫',
        },
        'P': {
            type: 'spawn',
            walkable: true,
            autoInteract: false,
            sprite: 'castle/floor/wall-metal-01.png',
            emoji: '🟫',
        },
        'D': {
            type: 'door',
            walkable: true,
            autoInteract: true,
            sprite: 'castle/floor/wall-metal-01.png',
            emoji: '🚪',
        },
        'C': {
            type: 'chest',
            walkable: false,
            autoInteract: false,
            sprite: '_interactive/chest-ornate-closed.png',
            openSprite: '_interactive/chest-ornate-open.png',
            emoji: '📦',
            isOverlay: true,
        },
        'M': {
            type: 'monster',
            walkable: true,
            autoInteract: false,
            sprite: 'castle/floor/wall-metal-01.png',
            emoji: '🟫',
        },
        'O': {
            type: 'portal',
            walkable: true,
            autoInteract: true,
            sprite: null,
            emoji: '🌀',
            isOverlay: true,
        },
        '~': {
            type: 'floor',
            walkable: false,
            autoInteract: false,
            sprite: '_shared/hazard/water.png',
            emoji: '🌊',
        },
        'B': {
            type: 'floor',
            walkable: false,
            autoInteract: false,
            sprite: '_shared/obstacle/rock-large-01.png',
            emoji: '🪨',
            isOverlay: true,
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
    assetFolder: string
): string | null {
    const def = getTileDefinition(char, tileSet);
    if (!def.sprite) return null;
    return `${assetFolder}/assets/environment/${def.sprite}`;
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

/**
 * Get chest sprite path based on open/closed state.
 * Returns the appropriate sprite path for chest rendering.
 */
export function getChestSpritePath(
    tileSet: TileSet,
    assetFolder: string,
    isOpen: boolean
): string | null {
    const def = getTileDefinition('C', tileSet);
    const spritePath = isOpen && def.openSprite ? def.openSprite : def.sprite;
    if (!spritePath) return null;
    return `${assetFolder}/assets/environment/${spritePath}`;
}

