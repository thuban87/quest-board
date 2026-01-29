/**
 * Activity Logging Tests
 * 
 * Tests for the activity history logging system including:
 * - Event structure validation
 * - History cap enforcement (MAX_ACTIVITY_HISTORY = 1000)
 * - Event type counting
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ActivityEvent, ActivityEventType, MAX_ACTIVITY_HISTORY } from '../src/models/Character';

// =====================
// ACTIVITY EVENT STRUCTURE
// =====================

describe('ActivityEvent Structure', () => {
    it('MAX_ACTIVITY_HISTORY should be 1000', () => {
        expect(MAX_ACTIVITY_HISTORY).toBe(1000);
    });

    it('should have correct activity event types', () => {
        const validTypes: ActivityEventType[] = [
            'quest_complete',
            'bounty_victory',
            'bounty_defeat',
            'dungeon_complete',
        ];

        // TypeScript ensures these are the only valid types
        validTypes.forEach(type => {
            const event: ActivityEvent = {
                type,
                date: '2024-01-15',
                timestamp: '2024-01-15T12:00:00Z',
                xpGained: 10,
                goldGained: 5,
            };
            expect(event.type).toBe(type);
        });
    });
});

// =====================
// HISTORY CAP SIMULATION
// =====================

describe('Activity History Cap', () => {
    it('should trim to MAX_ACTIVITY_HISTORY when exceeded', () => {
        // Simulate what logActivity does
        function simulateLogActivity(history: ActivityEvent[], newEvent: ActivityEvent): ActivityEvent[] {
            let newHistory = [...history, newEvent];
            if (newHistory.length > MAX_ACTIVITY_HISTORY) {
                newHistory = newHistory.slice(-MAX_ACTIVITY_HISTORY);
            }
            return newHistory;
        }

        // Create 1005 events
        const history: ActivityEvent[] = [];
        for (let i = 0; i < 1005; i++) {
            history.push({
                type: 'quest_complete',
                date: '2024-01-15',
                timestamp: `2024-01-15T${String(i % 24).padStart(2, '0')}:00:00Z`,
                xpGained: 10,
                goldGained: 5,
            });
        }

        // Add one more event (triggering trim)
        const newEvent: ActivityEvent = {
            type: 'bounty_victory',
            date: '2024-01-16',
            timestamp: '2024-01-16T12:00:00Z',
            xpGained: 20,
            goldGained: 10,
        };

        // Already at 1005, adding 1 more should trim to 1000
        const trimmed = simulateLogActivity(history, newEvent);

        expect(trimmed.length).toBe(MAX_ACTIVITY_HISTORY);
        // The last event should be the one we just added
        expect(trimmed[trimmed.length - 1]).toEqual(newEvent);
    });

    it('should keep most recent events when trimming', () => {
        function simulateLogActivity(history: ActivityEvent[], newEvent: ActivityEvent): ActivityEvent[] {
            let newHistory = [...history, newEvent];
            if (newHistory.length > MAX_ACTIVITY_HISTORY) {
                newHistory = newHistory.slice(-MAX_ACTIVITY_HISTORY);
            }
            return newHistory;
        }

        // Create exactly MAX_ACTIVITY_HISTORY events
        const history: ActivityEvent[] = [];
        for (let i = 0; i < MAX_ACTIVITY_HISTORY; i++) {
            history.push({
                type: 'quest_complete',
                date: '2024-01-15',
                timestamp: `2024-01-15T12:00:00Z`,
                xpGained: i, // Use index to track order
                goldGained: 0,
            });
        }

        // Add one more
        const newEvent: ActivityEvent = {
            type: 'dungeon_complete',
            date: '2024-01-16',
            timestamp: '2024-01-16T12:00:00Z',
            xpGained: 9999, // Unique to identify
            goldGained: 0,
        };

        const result = simulateLogActivity(history, newEvent);

        // Should still be at 1000
        expect(result.length).toBe(MAX_ACTIVITY_HISTORY);

        // First event should NOT be xpGained=0 (that was trimmed)
        expect(result[0].xpGained).toBe(1);

        // Last event should be our new one
        expect(result[result.length - 1].xpGained).toBe(9999);
    });

    it('should not trim when under limit', () => {
        function simulateLogActivity(history: ActivityEvent[], newEvent: ActivityEvent): ActivityEvent[] {
            let newHistory = [...history, newEvent];
            if (newHistory.length > MAX_ACTIVITY_HISTORY) {
                newHistory = newHistory.slice(-MAX_ACTIVITY_HISTORY);
            }
            return newHistory;
        }

        const history: ActivityEvent[] = [
            { type: 'quest_complete', date: '2024-01-15', timestamp: '2024-01-15T12:00:00Z', xpGained: 10, goldGained: 5 },
        ];

        const newEvent: ActivityEvent = {
            type: 'bounty_victory',
            date: '2024-01-16',
            timestamp: '2024-01-16T12:00:00Z',
            xpGained: 20,
            goldGained: 10,
        };

        const result = simulateLogActivity(history, newEvent);

        expect(result.length).toBe(2);
    });
});

// =====================
// DATE STRING FORMATTING
// =====================

describe('Activity Event Date Formatting', () => {
    it('should format date correctly as YYYY-MM-DD', () => {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Should be 10 characters: YYYY-MM-DD
        expect(dateString.length).toBe(10);
        expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should pad single-digit months', () => {
        const date = new Date(2024, 0, 15); // January = 0
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        expect(dateString).toBe('2024-01-15');
    });

    it('should pad single-digit days', () => {
        const date = new Date(2024, 11, 5); // December 5
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        expect(dateString).toBe('2024-12-05');
    });
});

// =====================
// EVENT VALIDATION
// =====================

describe('Activity Event Validation', () => {
    it('quest_complete event should have optional questId and questName', () => {
        const event: ActivityEvent = {
            type: 'quest_complete',
            date: '2024-01-15',
            timestamp: '2024-01-15T12:00:00Z',
            xpGained: 50,
            goldGained: 20,
            questId: 'quest-123',
            questName: 'Defeat the Dragon',
            category: 'combat',
        };

        expect(event.questId).toBe('quest-123');
        expect(event.questName).toBe('Defeat the Dragon');
        expect(event.category).toBe('combat');
    });

    it('bounty_victory event should have optional monsterId', () => {
        const event: ActivityEvent = {
            type: 'bounty_victory',
            date: '2024-01-15',
            timestamp: '2024-01-15T12:00:00Z',
            xpGained: 30,
            goldGained: 15,
            monsterId: 'goblin',
            details: 'Defeated Goblin Scout',
        };

        expect(event.monsterId).toBe('goblin');
        expect(event.details).toBe('Defeated Goblin Scout');
    });

    it('bounty_defeat event should have negative goldGained', () => {
        const event: ActivityEvent = {
            type: 'bounty_defeat',
            date: '2024-01-15',
            timestamp: '2024-01-15T12:00:00Z',
            xpGained: 0,
            goldGained: -25, // Gold lost
            monsterId: 'orc',
            details: 'Lost to Orc Warrior',
        };

        expect(event.xpGained).toBe(0);
        expect(event.goldGained).toBe(-25);
    });

    it('dungeon_complete event should have optional dungeonId', () => {
        const event: ActivityEvent = {
            type: 'dungeon_complete',
            date: '2024-01-15',
            timestamp: '2024-01-15T12:00:00Z',
            xpGained: 150,
            goldGained: 75,
            dungeonId: 'forest-ruins',
            details: 'Completed dungeon (8 rooms explored)',
        };

        expect(event.dungeonId).toBe('forest-ruins');
        expect(event.details).toContain('8 rooms');
    });
});

// =====================
// XP/GOLD CALCULATION
// =====================

describe('XP and Gold Tracking', () => {
    it('should sum positive and negative gold correctly', () => {
        const events: ActivityEvent[] = [
            { type: 'quest_complete', date: '2024-01-15', timestamp: '2024-01-15T12:00:00Z', xpGained: 50, goldGained: 100 },
            { type: 'bounty_victory', date: '2024-01-16', timestamp: '2024-01-16T12:00:00Z', xpGained: 30, goldGained: 50 },
            { type: 'bounty_defeat', date: '2024-01-17', timestamp: '2024-01-17T12:00:00Z', xpGained: 0, goldGained: -20 },
        ];

        const totalXP = events.reduce((sum, e) => sum + (e.xpGained || 0), 0);
        const totalGold = events.reduce((sum, e) => sum + (e.goldGained || 0), 0);

        expect(totalXP).toBe(80);  // 50 + 30 + 0
        expect(totalGold).toBe(130); // 100 + 50 - 20
    });

    it('defeat events should have 0 XP', () => {
        const defeatEvent: ActivityEvent = {
            type: 'bounty_defeat',
            date: '2024-01-15',
            timestamp: '2024-01-15T12:00:00Z',
            xpGained: 0,
            goldGained: -10,
        };

        expect(defeatEvent.xpGained).toBe(0);
    });
});
