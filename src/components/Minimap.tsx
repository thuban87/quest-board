/**
 * Minimap Component
 * 
 * Small 3x3 corner overlay showing current room and adjacent rooms.
 * Displays fog of war for unvisited rooms.
 */

import React, { useMemo } from 'react';
import { calculateRoomPositions, getAdjacentRooms } from '../services/DungeonMapService';
import type { DungeonTemplate, Direction } from '../models/Dungeon';

// ============================================
// Types
// ============================================

interface MinimapProps {
    template: DungeonTemplate;
    currentRoomId: string;
    visitedRooms: Set<string>;
}

// ============================================
// Component
// ============================================

export function Minimap({ template, currentRoomId, visitedRooms }: MinimapProps) {
    // Calculate room layout
    const layout = useMemo(() => calculateRoomPositions(template), [template]);

    // Get adjacent rooms for 3x3 view
    const adjacentRooms = useMemo(
        () => getAdjacentRooms(layout, currentRoomId),
        [layout, currentRoomId]
    );

    const currentRoom = layout.rooms.get(currentRoomId);

    if (!currentRoom) {
        return null;
    }

    // Build 3x3 grid centered on current room
    const grid: (string | null)[][] = [
        [null, null, null],
        [null, currentRoomId, null],
        [null, null, null],
    ];

    // Map directions to grid positions
    const dirToPos: Record<Direction, [number, number]> = {
        'north': [0, 1],
        'south': [2, 1],
        'west': [1, 0],
        'east': [1, 2],
    };

    // Diagonals - check for rooms at diagonal positions
    const diagonals: Array<{ row: number; col: number; dx: number; dy: number }> = [
        { row: 0, col: 0, dx: -1, dy: -1 }, // NW
        { row: 0, col: 2, dx: 1, dy: -1 },  // NE
        { row: 2, col: 0, dx: -1, dy: 1 },  // SW
        { row: 2, col: 2, dx: 1, dy: 1 },   // SE
    ];

    // Fill cardinal directions
    for (const [dir, room] of adjacentRooms.entries()) {
        if (room) {
            const [row, col] = dirToPos[dir];
            grid[row][col] = room.roomId;
        }
    }

    // Fill diagonals
    for (const { row, col, dx, dy } of diagonals) {
        const targetX = currentRoom.mapX + dx;
        const targetY = currentRoom.mapY + dy;

        for (const room of layout.rooms.values()) {
            if (room.mapX === targetX && room.mapY === targetY) {
                grid[row][col] = room.roomId;
                break;
            }
        }
    }

    return (
        <div className="qb-minimap">
            <div className="qb-minimap-grid">
                {grid.map((row, rowIdx) => (
                    <div key={rowIdx} className="qb-minimap-row">
                        {row.map((roomId, colIdx) => {
                            const isCurrent = roomId === currentRoomId;
                            const isVisited = roomId !== null && visitedRooms.has(roomId);
                            const roomData = roomId ? layout.rooms.get(roomId) : null;
                            const isBoss = roomData?.roomType === 'boss';

                            return (
                                <div
                                    key={colIdx}
                                    className={`qb-minimap-cell ${roomId === null ? 'empty' : ''
                                        } ${isCurrent ? 'current' : ''} ${isVisited ? 'visited' : 'unvisited'
                                        } ${isBoss ? 'boss' : ''}`}
                                >
                                    {roomId !== null && (
                                        <div className="qb-minimap-room">
                                            {isCurrent && (
                                                <div className="qb-minimap-player">●</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
