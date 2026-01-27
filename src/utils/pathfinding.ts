/**
 * Pathfinding Utility
 * 
 * A* pathfinding algorithm for dungeon exploration.
 * Uses Manhattan distance heuristic for 4-directional movement.
 */

import type { TileSet, Direction, RoomTemplate } from '../models/Dungeon';
import { isWalkable } from '../data/TileRegistry';

// ============================================
// Types
// ============================================

/** A node in the A* search graph */
interface PathNode {
    x: number;
    y: number;
    g: number;  // Cost from start
    h: number;  // Heuristic (estimated cost to goal)
    f: number;  // Total cost (g + h)
    parent: PathNode | null;
}

/** Direction offsets for 4-way movement */
const DIRECTIONS: Array<{ dx: number; dy: number; facing: Direction }> = [
    { dx: 0, dy: -1, facing: 'north' },
    { dx: 0, dy: 1, facing: 'south' },
    { dx: 1, dy: 0, facing: 'east' },
    { dx: -1, dy: 0, facing: 'west' },
];

// ============================================
// A* Implementation
// ============================================

/** Maximum iterations before timing out (prevents freeze on complex rooms) */
const MAX_ITERATIONS = 500;

/**
 * Find a path from start to goal using A* algorithm.
 * 
 * @param start - Starting position [x, y]
 * @param goal - Target position [x, y]
 * @param room - Room template with layout
 * @param tileSet - Tileset for walkability checks
 * @returns Array of positions from start to goal (excluding start), or null if unreachable
 */
export function findPath(
    start: [number, number],
    goal: [number, number],
    room: RoomTemplate,
    tileSet: TileSet
): Array<[number, number]> | null {
    const [startX, startY] = start;
    const [goalX, goalY] = goal;

    // Validate goal is within bounds
    if (goalY < 0 || goalY >= room.layout.length ||
        goalX < 0 || goalX >= room.layout[goalY].length) {
        return null;
    }

    // Check if goal is walkable
    const goalChar = room.layout[goalY][goalX];
    if (!isWalkable(goalChar, tileSet)) {
        return null;
    }

    // Already at goal
    if (startX === goalX && startY === goalY) {
        return [];
    }

    // A* algorithm
    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();

    const startNode: PathNode = {
        x: startX,
        y: startY,
        g: 0,
        h: manhattanDistance(startX, startY, goalX, goalY),
        f: manhattanDistance(startX, startY, goalX, goalY),
        parent: null,
    };
    openSet.push(startNode);

    let iterations = 0;

    while (openSet.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++;

        // Get node with lowest f score
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift()!;

        // Check if we reached the goal
        if (current.x === goalX && current.y === goalY) {
            return reconstructPath(current);
        }

        // Mark as visited
        closedSet.add(`${current.x},${current.y}`);

        // Explore neighbors
        for (const dir of DIRECTIONS) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            const key = `${nx},${ny}`;

            // Skip if already visited
            if (closedSet.has(key)) continue;

            // Skip if out of bounds
            if (ny < 0 || ny >= room.layout.length ||
                nx < 0 || nx >= room.layout[ny].length) {
                continue;
            }

            // Skip if not walkable
            const char = room.layout[ny][nx];
            if (!isWalkable(char, tileSet)) continue;

            const g = current.g + 1;
            const h = manhattanDistance(nx, ny, goalX, goalY);
            const f = g + h;

            // Check if already in open set with lower cost
            const existingIdx = openSet.findIndex(n => n.x === nx && n.y === ny);
            if (existingIdx !== -1) {
                if (openSet[existingIdx].g <= g) continue;
                // Found better path, update
                openSet[existingIdx].g = g;
                openSet[existingIdx].f = f;
                openSet[existingIdx].parent = current;
            } else {
                openSet.push({
                    x: nx,
                    y: ny,
                    g,
                    h,
                    f,
                    parent: current,
                });
            }
        }
    }

    // No path found or timed out
    // As fallback, try to return one step toward the goal
    if (iterations >= MAX_ITERATIONS) {
        console.warn('[Pathfinding] Timeout reached, returning single step');
        return getOneStepToward(start, goal, room, tileSet);
    }

    return null;
}

/**
 * Manhattan distance heuristic for A*.
 */
function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Reconstruct the path from goal node back to start.
 * Returns array of positions EXCLUDING start.
 */
function reconstructPath(goalNode: PathNode): Array<[number, number]> {
    const path: Array<[number, number]> = [];
    let current: PathNode | null = goalNode;

    while (current !== null && current.parent !== null) {
        path.unshift([current.x, current.y]);
        current = current.parent;
    }

    return path;
}

/**
 * Get a single walkable step toward the goal (fallback for timeout).
 */
function getOneStepToward(
    start: [number, number],
    goal: [number, number],
    room: RoomTemplate,
    tileSet: TileSet
): Array<[number, number]> | null {
    const [sx, sy] = start;
    const [gx, gy] = goal;

    // Try each direction, prioritize toward goal
    const candidates = DIRECTIONS
        .map(dir => ({
            x: sx + dir.dx,
            y: sy + dir.dy,
            dist: manhattanDistance(sx + dir.dx, sy + dir.dy, gx, gy),
        }))
        .filter(({ x, y }) => {
            if (y < 0 || y >= room.layout.length) return false;
            if (x < 0 || x >= room.layout[y].length) return false;
            return isWalkable(room.layout[y][x], tileSet);
        })
        .sort((a, b) => a.dist - b.dist);

    if (candidates.length > 0) {
        return [[candidates[0].x, candidates[0].y]];
    }

    return null;
}

// ============================================
// Movement Helpers
// ============================================

/**
 * Get the facing direction for a movement.
 */
export function getFacingDirection(
    from: [number, number],
    to: [number, number]
): Direction {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];

    if (dx > 0) return 'east';
    if (dx < 0) return 'west';
    if (dy > 0) return 'south';
    return 'north';
}

/**
 * Get the position one step in a direction.
 */
export function getStepPosition(
    from: [number, number],
    direction: Direction
): [number, number] {
    const [x, y] = from;
    switch (direction) {
        case 'north': return [x, y - 1];
        case 'south': return [x, y + 1];
        case 'east': return [x + 1, y];
        case 'west': return [x - 1, y];
    }
}

/**
 * Check if a position can be walked to.
 */
export function canWalkTo(
    position: [number, number],
    room: RoomTemplate,
    tileSet: TileSet
): boolean {
    const [x, y] = position;

    // Bounds check
    if (y < 0 || y >= room.layout.length) return false;
    if (x < 0 || x >= room.layout[y].length) return false;

    // Walkability check
    const char = room.layout[y][x];
    return isWalkable(char, tileSet);
}
