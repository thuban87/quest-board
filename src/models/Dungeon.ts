/**
 * Dungeon System Data Models
 * 
 * Phase 3C: Types for dungeon exploration, rooms, and tiles.
 */

import type { GearTier, GearSlot, LootReward } from './Gear';

// ============================================
// Directions
// ============================================

/** Cardinal directions for movement and facing */
export type Direction = 'north' | 'south' | 'east' | 'west';

/** All directions including diagonals (for future use) */
export type Direction8 = Direction | 'north-east' | 'north-west' | 'south-east' | 'south-west';

/** Direction offsets for grid movement */
export const DIRECTION_OFFSETS: Record<Direction, [number, number]> = {
    north: [0, -1],
    south: [0, 1],
    east: [1, 0],
    west: [-1, 0],
};

// ============================================
// Tile System
// ============================================

/** Types of tiles that can appear in a dungeon room */
export type TileType =
    | 'floor'      // Walkable ground
    | 'wall'       // Blocking obstacle
    | 'door'       // Exit to another room (auto-interact)
    | 'chest'      // Loot container (manual interact)
    | 'portal'     // Dungeon exit (auto-interact)
    | 'spawn'      // Player start position (rendered as floor)
    | 'monster'    // Monster spawn point
    | 'trap'       // Hidden danger (future)
    | 'switch';    // Puzzle element (future)

/**
 * Definition of a tile type's properties.
 * Used by TileRegistry to map layout characters to behaviors.
 */
export interface TileDefinition {
    type: TileType;
    walkable: boolean;
    autoInteract: boolean;     // true = triggers on walk, false = requires E/click
    sprite: string | null;     // Path relative to assets/environment/
    emoji: string;             // Fallback display
    isOverlay?: boolean;       // If true, renders on top of floor tile
    openSprite?: string;       // Alternate sprite for opened state (chests)
}

/**
 * Runtime instance of a tile in a room.
 * Extends definition with position and state.
 */
export interface TileInstance extends TileDefinition {
    id: string;                // Unique ID for state tracking (e.g., "chest_4_2")
    position: [number, number]; // [x, y] in room grid
    state?: TileState;
}

/** State that can change for interactive tiles */
export type TileState =
    | { type: 'chest'; opened: boolean; lootTier: GearTier }
    | { type: 'door'; targetRoom: string; targetEntry: Direction }
    | { type: 'portal'; action: 'exit' }
    | { type: 'monster'; monsterId: string; killed: boolean }
    | { type: 'trap'; triggered: boolean; damage: number }
    | { type: 'switch'; active: boolean; linkedTo: string[] };

// ============================================
// Room Templates
// ============================================

/** Types of rooms in a dungeon */
export type RoomType = 'entry' | 'combat' | 'treasure' | 'puzzle' | 'boss' | 'exit';

/**
 * Template for a single room in a dungeon.
 * Uses hybrid format: string layout + metadata objects.
 * 
 * Layout characters:
 *   '#' = wall
 *   '.' = floor  
 *   'P' = player spawn
 *   'D' = door (or gap in wall)
 *   'C' = chest
 *   'M' = monster
 *   'O' = portal/exit
 */
export interface RoomTemplate {
    id: string;
    type: RoomType;
    width: number;
    height: number;

    /** ASCII art layout - each string is one row */
    layout: string[];

    /** Door connections: position "x,y" → target room */
    doors: Record<string, { targetRoom: string; targetEntry: Direction }>;

    /** Chest spawns with positions and tiers */
    chests?: Array<{ position: [number, number]; tier: GearTier }>;

    /** Monster spawns with positions and pools */
    monsters?: Array<{ position: [number, number]; pool: string[]; isBoss?: boolean }>;
}

// ============================================
// Dungeon Templates
// ============================================

/** Visual theme/tileset for the dungeon */
export type TileSet = 'cave' | 'forest' | 'dungeon' | 'castle';

/** Difficulty affects monster scaling */
export type DungeonDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Full dungeon template containing all rooms.
 * Hand-authored or AI-generated.
 */
export interface DungeonTemplate {
    id: string;
    name: string;
    description: string;
    baseDifficulty: DungeonDifficulty;
    tileSet: TileSet;

    /** Displayed on dungeon selection to help target farming */
    lootBias: {
        primarySlots: GearSlot[];
        description: string;
    };

    /** All rooms in this dungeon */
    rooms: RoomTemplate[];
}

// ============================================
// Runtime State
// ============================================

/** Exploration state machine */
export type ExplorationState =
    | 'LOADING'       // Loading room data
    | 'EXPLORING'     // Normal movement
    | 'IN_COMBAT'     // Fight System active (dungeon paused)
    | 'LOOT_MODAL'    // Showing chest loot
    | 'DEATH_MODAL'   // Player died, showing options
    | 'EXIT_MODAL'    // Confirming early exit
    | 'COMPLETE';     // Dungeon finished

/**
 * Tracks visited/interacted state per room.
 * Prevents exploits (leave room, return, chest full again).
 */
export interface RoomState {
    chestsOpened: string[];      // IDs of opened chests
    monstersKilled: string[];    // IDs of killed monsters
    trapsTriggered: string[];    // IDs of triggered traps
    puzzlesSolved: string[];     // IDs of solved puzzles
}

/**
 * Minimal state saved to plugin data.
 * Light persistence to avoid sync conflicts.
 */
export interface PersistedDungeonState {
    dungeonInstanceId: string;
    dungeonTemplateId: string;
    currentRoomId: string;
    visitedRooms: string[];
    roomStates: Record<string, RoomState>;
    pendingLoot: LootReward[];
    sessionGold: number;
    sessionXP: number;
}
