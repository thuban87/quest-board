/**
 * Dungeon Map Service
 * 
 * Calculates room grid positions from door connections using BFS.
 * Used by minimap and full map components to display dungeon layout.
 */

import type { DungeonTemplate, RoomTemplate, Direction } from '../models/Dungeon';

// ============================================
// Types
// ============================================

/** Map data for a single room */
export interface RoomMapData {
    roomId: string;
    mapX: number;
    mapY: number;
    roomType: string;
    connections: RoomConnection[];
}

/** Connection from one room to another */
export interface RoomConnection {
    direction: Direction;
    targetRoomId: string;
}

/** Full dungeon map layout */
export interface DungeonMapLayout {
    rooms: Map<string, RoomMapData>;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

// ============================================
// Direction Helpers
// ============================================

/** Get grid offset for a direction */
function getDirectionOffset(direction: Direction): [number, number] {
    switch (direction) {
        case 'north': return [0, -1];
        case 'south': return [0, 1];
        case 'east': return [1, 0];
        case 'west': return [-1, 0];
    }
}

/** Get opposite direction */
function getOppositeDirection(direction: Direction): Direction {
    switch (direction) {
        case 'north': return 'south';
        case 'south': return 'north';
        case 'east': return 'west';
        case 'west': return 'east';
    }
}

// ============================================
// Room Position Calculator
// ============================================

// Cache for calculated layouts
const layoutCache = new Map<string, DungeonMapLayout>();

/**
 * Calculate room grid positions from door connections using BFS.
 * Entry room is placed at (0, 0), other rooms positioned based on door directions.
 * 
 * @param template The dungeon template to calculate positions for
 * @returns Map layout with room positions and bounds
 */
export function calculateRoomPositions(template: DungeonTemplate): DungeonMapLayout {
    // Check cache first
    const cached = layoutCache.get(template.id);
    if (cached) {
        return cached;
    }

    const rooms = new Map<string, RoomMapData>();
    const roomById = new Map<string, RoomTemplate>();

    // Build room lookup
    for (const room of template.rooms) {
        roomById.set(room.id, room);
    }

    if (template.rooms.length === 0) {
        return { rooms, minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    // BFS from entry room
    const entryRoom = template.rooms[0];
    const queue: Array<{ roomId: string; x: number; y: number }> = [
        { roomId: entryRoom.id, x: 0, y: 0 }
    ];
    const visited = new Set<string>();

    // Track bounds
    let minX = 0, maxX = 0, minY = 0, maxY = 0;

    while (queue.length > 0) {
        const { roomId, x, y } = queue.shift()!;

        if (visited.has(roomId)) continue;
        visited.add(roomId);

        const room = roomById.get(roomId);
        if (!room) continue;

        // Build connections list from doors
        const connections: RoomConnection[] = [];
        for (const [, doorData] of Object.entries(room.doors)) {
            connections.push({
                direction: getExitDirection(room, doorData.targetRoom),
                targetRoomId: doorData.targetRoom,
            });
        }

        // Store room data
        rooms.set(roomId, {
            roomId,
            mapX: x,
            mapY: y,
            roomType: room.type,
            connections,
        });

        // Update bounds
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);

        // Queue connected rooms
        for (const [pos, doorData] of Object.entries(room.doors)) {
            if (!visited.has(doorData.targetRoom)) {
                // Calculate direction based on door position in layout
                const direction = getDoorDirection(room, pos);
                const [dx, dy] = getDirectionOffset(direction);

                queue.push({
                    roomId: doorData.targetRoom,
                    x: x + dx,
                    y: y + dy,
                });
            }
        }
    }

    const layout: DungeonMapLayout = { rooms, minX, maxX, minY, maxY };

    // Cache the result
    layoutCache.set(template.id, layout);

    return layout;
}

/**
 * Determine which direction a door leads based on its position in the room layout.
 * Position format is "x,y" (e.g., "5,0" for top center).
 */
function getDoorDirection(room: RoomTemplate, doorPos: string): Direction {
    const [xStr, yStr] = doorPos.split(',');
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);

    const midX = Math.floor(room.width / 2);
    const midY = Math.floor(room.height / 2);

    // Check edges first
    if (y === 0) return 'north';
    if (y === room.height - 1) return 'south';
    if (x === 0) return 'west';
    if (x === room.width - 1) return 'east';

    // If not on edge, use relative position
    const dx = x - midX;
    const dy = y - midY;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 'east' : 'west';
    } else {
        return dy > 0 ? 'south' : 'north';
    }
}

/**
 * Get the exit direction from a room to a target room.
 * Scans doors to find the one leading to the target.
 */
function getExitDirection(room: RoomTemplate, targetRoomId: string): Direction {
    for (const [pos, doorData] of Object.entries(room.doors)) {
        if (doorData.targetRoom === targetRoomId) {
            return getDoorDirection(room, pos);
        }
    }
    // Fallback
    return 'south';
}

/**
 * Get rooms adjacent to a given room in the map layout.
 * Used by minimap for 3x3 view.
 */
export function getAdjacentRooms(
    layout: DungeonMapLayout,
    currentRoomId: string
): Map<Direction, RoomMapData | null> {
    const result = new Map<Direction, RoomMapData | null>();
    const currentRoom = layout.rooms.get(currentRoomId);

    if (!currentRoom) {
        return result;
    }

    const directions: Direction[] = ['north', 'south', 'east', 'west'];

    for (const dir of directions) {
        const [dx, dy] = getDirectionOffset(dir);
        const targetX = currentRoom.mapX + dx;
        const targetY = currentRoom.mapY + dy;

        // Find room at target position
        let found: RoomMapData | null = null;
        for (const room of layout.rooms.values()) {
            if (room.mapX === targetX && room.mapY === targetY) {
                found = room;
                break;
            }
        }

        result.set(dir, found);
    }

    return result;
}

/**
 * Clear the layout cache. Call when dungeons are reloaded.
 */
export function clearLayoutCache(): void {
    layoutCache.clear();
}
