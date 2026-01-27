/**
 * Pathfinding Tests
 * 
 * Unit tests for A* pathfinding algorithm.
 */

import { describe, it, expect } from 'vitest';
import { findPath, getFacingDirection, getStepPosition, canWalkTo } from '../src/utils/pathfinding';
import type { RoomTemplate } from '../src/models/Dungeon';

// ============================================
// Test Room Layouts
// ============================================

const simpleRoom: RoomTemplate = {
    id: 'test_simple',
    type: 'entry',
    width: 5,
    height: 5,
    layout: [
        '#####',
        '#...#',
        '#.P.#',
        '#...#',
        '#####',
    ],
    doors: {},
};

const obstacleRoom: RoomTemplate = {
    id: 'test_obstacle',
    type: 'entry',
    width: 7,
    height: 5,
    layout: [
        '#######',
        '#.#...#',
        '#.#.#.#',
        '#...#.#',
        '#######',
    ],
    doors: {},
};

const mazeLikeRoom: RoomTemplate = {
    id: 'test_maze',
    type: 'entry',
    width: 9,
    height: 7,
    layout: [
        '#########',
        '#.#.....#',
        '#.###.#.#',
        '#.....#.#',
        '#.###.#.#',
        '#.....#.#',
        '#########',
    ],
    doors: {},
};

// ============================================
// findPath Tests
// ============================================

describe('findPath', () => {
    it('returns empty array when already at goal', () => {
        const result = findPath([2, 2], [2, 2], simpleRoom, 'cave');
        expect(result).toEqual([]);
    });

    it('finds straight path to adjacent tile', () => {
        const result = findPath([2, 2], [3, 2], simpleRoom, 'cave');
        expect(result).toEqual([[3, 2]]);
    });

    it('finds straight path across room', () => {
        const result = findPath([1, 1], [3, 3], simpleRoom, 'cave');
        expect(result).not.toBeNull();
        expect(result!.length).toBeGreaterThan(0);
        // Last position should be the goal
        expect(result![result!.length - 1]).toEqual([3, 3]);
    });

    it('returns null for wall target', () => {
        const result = findPath([2, 2], [0, 0], simpleRoom, 'cave');
        expect(result).toBeNull();
    });

    it('returns null for out-of-bounds target', () => {
        const result = findPath([2, 2], [10, 10], simpleRoom, 'cave');
        expect(result).toBeNull();
    });

    it('navigates around obstacles', () => {
        // Start at [1,1], try to reach [5,3] which requires going around walls
        const result = findPath([1, 1], [5, 3], obstacleRoom, 'cave');
        expect(result).not.toBeNull();
        expect(result!.length).toBeGreaterThan(4); // Must take longer path
        expect(result![result!.length - 1]).toEqual([5, 3]);
    });

    it('returns null for unreachable areas', () => {
        // Create room with isolated area
        const isolatedRoom: RoomTemplate = {
            id: 'isolated',
            type: 'entry',
            width: 5,
            height: 5,
            layout: [
                '#####',
                '#.#.#',
                '#####',
                '#.#.#',
                '#####',
            ],
            doors: {},
        };
        const result = findPath([1, 1], [3, 1], isolatedRoom, 'cave');
        expect(result).toBeNull();
    });

    it('finds path through maze', () => {
        const result = findPath([1, 1], [7, 5], mazeLikeRoom, 'cave');
        expect(result).not.toBeNull();
        expect(result![result!.length - 1]).toEqual([7, 5]);
    });
});

// ============================================
// Helper Function Tests
// ============================================

describe('getFacingDirection', () => {
    it('returns north for upward movement', () => {
        expect(getFacingDirection([2, 2], [2, 1])).toBe('north');
    });

    it('returns south for downward movement', () => {
        expect(getFacingDirection([2, 2], [2, 3])).toBe('south');
    });

    it('returns east for rightward movement', () => {
        expect(getFacingDirection([2, 2], [3, 2])).toBe('east');
    });

    it('returns west for leftward movement', () => {
        expect(getFacingDirection([2, 2], [1, 2])).toBe('west');
    });
});

describe('getStepPosition', () => {
    it('returns correct position for north', () => {
        expect(getStepPosition([2, 2], 'north')).toEqual([2, 1]);
    });

    it('returns correct position for south', () => {
        expect(getStepPosition([2, 2], 'south')).toEqual([2, 3]);
    });

    it('returns correct position for east', () => {
        expect(getStepPosition([2, 2], 'east')).toEqual([3, 2]);
    });

    it('returns correct position for west', () => {
        expect(getStepPosition([2, 2], 'west')).toEqual([1, 2]);
    });
});

describe('canWalkTo', () => {
    it('returns true for floor tile', () => {
        expect(canWalkTo([1, 1], simpleRoom, 'cave')).toBe(true);
    });

    it('returns false for wall tile', () => {
        expect(canWalkTo([0, 0], simpleRoom, 'cave')).toBe(false);
    });

    it('returns false for out-of-bounds', () => {
        expect(canWalkTo([-1, 0], simpleRoom, 'cave')).toBe(false);
        expect(canWalkTo([0, -1], simpleRoom, 'cave')).toBe(false);
        expect(canWalkTo([10, 10], simpleRoom, 'cave')).toBe(false);
    });

    it('returns true for spawn tile', () => {
        expect(canWalkTo([2, 2], simpleRoom, 'cave')).toBe(true);
    });
});
