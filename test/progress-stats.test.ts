/**
 * Progress Stats Service Tests
 * 
 * Tests for activity history filtering, stats calculation, and date utilities.
 */

import { describe, it, expect } from 'vitest';
import {
    getActivityInRange,
    calculateProgressStats,
    getProgressStatsForRange,
    getDatePreset,
    formatDateForDisplay,
    getAllPresets,
    ProgressStats,
} from '../src/services/ProgressStatsService';
import { ActivityEvent } from '../src/models/Character';

// =====================
// TEST DATA FACTORIES
// =====================

function createQuestEvent(date: string, xp: number = 50, gold: number = 20, category?: string): ActivityEvent {
    return {
        type: 'quest_complete',
        date,
        timestamp: `${date}T12:00:00.000Z`,
        xpGained: xp,
        goldGained: gold,
        questId: `quest-${Date.now()}`,
        questName: 'Test Quest',
        category,
    };
}

function createBountyVictoryEvent(date: string, xp: number = 30, gold: number = 15): ActivityEvent {
    return {
        type: 'bounty_victory',
        date,
        timestamp: `${date}T12:00:00.000Z`,
        xpGained: xp,
        goldGained: gold,
        monsterId: 'goblin',
        details: 'Defeated Goblin',
    };
}

function createBountyDefeatEvent(date: string, goldLost: number = 10): ActivityEvent {
    return {
        type: 'bounty_defeat',
        date,
        timestamp: `${date}T12:00:00.000Z`,
        xpGained: 0,
        goldGained: -goldLost,
        monsterId: 'orc',
        details: 'Lost to Orc',
    };
}

function createDungeonEvent(date: string, xp: number = 100, gold: number = 50): ActivityEvent {
    return {
        type: 'dungeon_complete',
        date,
        timestamp: `${date}T12:00:00.000Z`,
        xpGained: xp,
        goldGained: gold,
        dungeonId: 'forest-ruins',
        details: 'Completed dungeon (5 rooms explored)',
    };
}

// =====================
// getActivityInRange TESTS
// =====================

describe('getActivityInRange', () => {
    it('should return events within date range', () => {
        const history: ActivityEvent[] = [
            createQuestEvent('2024-01-15'),
            createQuestEvent('2024-01-20'),
            createQuestEvent('2024-01-25'),
        ];

        const result = getActivityInRange(history, '2024-01-18', '2024-01-22');

        expect(result).toHaveLength(1);
        expect(result[0].date).toBe('2024-01-20');
    });

    it('should include events on boundary dates', () => {
        const history: ActivityEvent[] = [
            createQuestEvent('2024-01-15'),
            createQuestEvent('2024-01-20'),
            createQuestEvent('2024-01-25'),
        ];

        const result = getActivityInRange(history, '2024-01-15', '2024-01-25');

        expect(result).toHaveLength(3);
    });

    it('should return empty array for events outside range', () => {
        const history: ActivityEvent[] = [
            createQuestEvent('2024-01-15'),
        ];

        const result = getActivityInRange(history, '2024-02-01', '2024-02-28');

        expect(result).toHaveLength(0);
    });

    it('should handle empty history array', () => {
        const result = getActivityInRange([], '2024-01-01', '2024-12-31');
        expect(result).toEqual([]);
    });

    it('should handle undefined history gracefully', () => {
        const result = getActivityInRange(undefined as any, '2024-01-01', '2024-12-31');
        expect(result).toEqual([]);
    });

    it('should handle null history gracefully', () => {
        const result = getActivityInRange(null as any, '2024-01-01', '2024-12-31');
        expect(result).toEqual([]);
    });
});

// =====================
// calculateProgressStats TESTS
// =====================

describe('calculateProgressStats', () => {
    it('should count quest completions correctly', () => {
        const events: ActivityEvent[] = [
            createQuestEvent('2024-01-15'),
            createQuestEvent('2024-01-16'),
            createQuestEvent('2024-01-17'),
        ];

        const stats = calculateProgressStats(events);

        expect(stats.questsCompleted).toBe(3);
        expect(stats.typeBreakdown.quest_complete).toBe(3);
    });

    it('should count bounty victories correctly', () => {
        const events: ActivityEvent[] = [
            createBountyVictoryEvent('2024-01-15'),
            createBountyVictoryEvent('2024-01-16'),
        ];

        const stats = calculateProgressStats(events);

        expect(stats.bountiesWon).toBe(2);
        expect(stats.typeBreakdown.bounty_victory).toBe(2);
    });

    it('should count bounty defeats correctly', () => {
        const events: ActivityEvent[] = [
            createBountyDefeatEvent('2024-01-15'),
            createBountyDefeatEvent('2024-01-16'),
        ];

        const stats = calculateProgressStats(events);

        expect(stats.bountiesLost).toBe(2);
        expect(stats.typeBreakdown.bounty_defeat).toBe(2);
    });

    it('should count dungeon completions correctly', () => {
        const events: ActivityEvent[] = [
            createDungeonEvent('2024-01-15'),
        ];

        const stats = calculateProgressStats(events);

        expect(stats.dungeonsCompleted).toBe(1);
        expect(stats.typeBreakdown.dungeon_complete).toBe(1);
    });

    it('should sum XP correctly', () => {
        const events: ActivityEvent[] = [
            createQuestEvent('2024-01-15', 50),
            createBountyVictoryEvent('2024-01-16', 30),
            createDungeonEvent('2024-01-17', 100),
        ];

        const stats = calculateProgressStats(events);

        expect(stats.totalXP).toBe(180); // 50 + 30 + 100
    });

    it('should sum gold correctly (including losses)', () => {
        const events: ActivityEvent[] = [
            createQuestEvent('2024-01-15', 50, 20),
            createBountyVictoryEvent('2024-01-16', 30, 15),
            createBountyDefeatEvent('2024-01-17', 10), // -10 gold
        ];

        const stats = calculateProgressStats(events);

        expect(stats.totalGold).toBe(25); // 20 + 15 - 10
    });

    it('should calculate category breakdown', () => {
        const events: ActivityEvent[] = [
            createQuestEvent('2024-01-15', 50, 20, 'work'),
            createQuestEvent('2024-01-16', 50, 20, 'work'),
            createQuestEvent('2024-01-17', 50, 20, 'fitness'),
        ];

        const stats = calculateProgressStats(events);

        expect(stats.categoryBreakdown['work']).toBe(2);
        expect(stats.categoryBreakdown['fitness']).toBe(1);
    });

    it('should calculate daily activity counts', () => {
        const events: ActivityEvent[] = [
            createQuestEvent('2024-01-15'),
            createQuestEvent('2024-01-15'),
            createBountyVictoryEvent('2024-01-15'),
            createQuestEvent('2024-01-16'),
        ];

        const stats = calculateProgressStats(events);

        expect(stats.dailyActivity['2024-01-15']).toBe(3);
        expect(stats.dailyActivity['2024-01-16']).toBe(1);
    });

    it('should find best day correctly', () => {
        const events: ActivityEvent[] = [
            createQuestEvent('2024-01-15'),
            createQuestEvent('2024-01-16'),
            createQuestEvent('2024-01-16'),
            createQuestEvent('2024-01-16'),
            createQuestEvent('2024-01-17'),
        ];

        const stats = calculateProgressStats(events);

        expect(stats.bestDay).not.toBeNull();
        expect(stats.bestDay?.date).toBe('2024-01-16');
        expect(stats.bestDay?.count).toBe(3);
    });

    it('should return null best day for empty events', () => {
        const stats = calculateProgressStats([]);
        expect(stats.bestDay).toBeNull();
    });

    it('should handle mixed event types', () => {
        const events: ActivityEvent[] = [
            createQuestEvent('2024-01-15'),
            createBountyVictoryEvent('2024-01-16'),
            createBountyDefeatEvent('2024-01-17'),
            createDungeonEvent('2024-01-18'),
        ];

        const stats = calculateProgressStats(events);

        expect(stats.questsCompleted).toBe(1);
        expect(stats.bountiesWon).toBe(1);
        expect(stats.bountiesLost).toBe(1);
        expect(stats.dungeonsCompleted).toBe(1);
    });

    it('should handle events with missing XP/gold', () => {
        const events: ActivityEvent[] = [
            { type: 'quest_complete', date: '2024-01-15', timestamp: '2024-01-15T12:00:00Z' } as any,
        ];

        const stats = calculateProgressStats(events);

        expect(stats.totalXP).toBe(0);
        expect(stats.totalGold).toBe(0);
    });
});

// =====================
// getProgressStatsForRange TESTS
// =====================

describe('getProgressStatsForRange', () => {
    it('should combine filtering and stats calculation', () => {
        const history: ActivityEvent[] = [
            createQuestEvent('2024-01-10'),
            createQuestEvent('2024-01-15'), // in range
            createQuestEvent('2024-01-20'), // in range
            createQuestEvent('2024-01-30'),
        ];

        const stats = getProgressStatsForRange(history, '2024-01-14', '2024-01-25');

        expect(stats.questsCompleted).toBe(2);
    });
});

// =====================
// getDatePreset TESTS
// =====================

describe('getDatePreset', () => {
    it('should return valid date range for today', () => {
        const range = getDatePreset('today');
        expect(range.start).toBe(range.end);
        expect(range.label).toBe('Today');
    });

    it('should return valid date range for this_week', () => {
        const range = getDatePreset('this_week');
        expect(range.start <= range.end).toBe(true);
        expect(range.label).toBe('This Week');
    });

    it('should return 7 day span for last_7_days', () => {
        const range = getDatePreset('last_7_days');
        const start = new Date(range.start);
        const end = new Date(range.end);
        const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        expect(diffDays).toBe(6); // 7 days = 6 day difference
        expect(range.label).toBe('Last 7 Days');
    });

    it('should return 30 day span for last_30_days', () => {
        const range = getDatePreset('last_30_days');
        const start = new Date(range.start);
        const end = new Date(range.end);
        const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        expect(diffDays).toBe(29); // 30 days = 29 day difference
        expect(range.label).toBe('Last 30 Days');
    });

    it('should return all_time starting from 2000', () => {
        const range = getDatePreset('all_time');
        expect(range.start).toBe('2000-01-01');
        expect(range.label).toBe('All Time');
    });
});

// =====================
// formatDateForDisplay TESTS
// =====================

describe('formatDateForDisplay', () => {
    it('should format date as readable string', () => {
        const formatted = formatDateForDisplay('2024-01-15');
        // Format: "Mon, Jan 15"
        expect(formatted).toContain('Jan');
        expect(formatted).toContain('15');
    });
});

// =====================
// getAllPresets TESTS
// =====================

describe('getAllPresets', () => {
    it('should return all 6 presets', () => {
        const presets = getAllPresets();
        expect(presets).toHaveLength(6);
    });

    it('should include expected preset values', () => {
        const presets = getAllPresets();
        const values = presets.map(p => p.value);

        expect(values).toContain('today');
        expect(values).toContain('this_week');
        expect(values).toContain('last_7_days');
        expect(values).toContain('this_month');
        expect(values).toContain('last_30_days');
        expect(values).toContain('all_time');
    });
});
