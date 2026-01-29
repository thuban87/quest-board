/**
 * Progress Stats Service
 * 
 * Calculates progress statistics from activity history for date ranges.
 * Used by ProgressDashboardModal to display analytics.
 */

import { ActivityEvent, ActivityEventType } from '../models/Character';

// ============================================
// Types
// ============================================

export interface ProgressStats {
    /** Number of quests completed in period */
    questsCompleted: number;
    /** Number of bounties won in period */
    bountiesWon: number;
    /** Number of bounties lost in period */
    bountiesLost: number;
    /** Number of dungeons completed in period */
    dungeonsCompleted: number;
    /** Total XP earned in period */
    totalXP: number;
    /** Total gold earned in period */
    totalGold: number;
    /** Category breakdown: category -> count */
    categoryBreakdown: Record<string, number>;
    /** Daily activity: YYYY-MM-DD -> count */
    dailyActivity: Record<string, number>;
    /** Best day in period (date with most completions) */
    bestDay: { date: string; count: number } | null;
    /** Event type breakdown: type -> count */
    typeBreakdown: Record<ActivityEventType, number>;
}

export type DatePreset =
    | 'today'
    | 'this_week'
    | 'last_7_days'
    | 'this_month'
    | 'last_30_days'
    | 'all_time';

export interface DateRange {
    start: string;  // YYYY-MM-DD
    end: string;    // YYYY-MM-DD
    label: string;
}

// ============================================
// Date Utilities
// ============================================

/**
 * Get today's date as YYYY-MM-DD
 */
function getToday(): string {
    const now = new Date();
    return formatDate(now);
}

/**
 * Format a Date object as YYYY-MM-DD
 */
function formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Get the Monday of the current week
 */
function getWeekStart(): Date {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

/**
 * Get the first day of the current month
 */
function getMonthStart(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
}

/**
 * Subtract days from today
 */
function daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
}

// ============================================
// Public API
// ============================================

/**
 * Get a date range for a preset
 */
export function getDatePreset(preset: DatePreset): DateRange {
    const today = getToday();

    switch (preset) {
        case 'today':
            return { start: today, end: today, label: 'Today' };

        case 'this_week':
            return {
                start: formatDate(getWeekStart()),
                end: today,
                label: 'This Week'
            };

        case 'last_7_days':
            return {
                start: formatDate(daysAgo(6)),
                end: today,
                label: 'Last 7 Days'
            };

        case 'this_month':
            return {
                start: formatDate(getMonthStart()),
                end: today,
                label: 'This Month'
            };

        case 'last_30_days':
            return {
                start: formatDate(daysAgo(29)),
                end: today,
                label: 'Last 30 Days'
            };

        case 'all_time':
        default:
            return {
                start: '2000-01-01',
                end: today,
                label: 'All Time'
            };
    }
}

/**
 * Filter activity history to a date range
 */
export function getActivityInRange(
    history: ActivityEvent[],
    startDate: string,
    endDate: string
): ActivityEvent[] {
    // Defensive: handle undefined/null history (pre-v4 characters)
    if (!history || !Array.isArray(history)) {
        return [];
    }
    return history.filter(event => {
        return event.date >= startDate && event.date <= endDate;
    });
}

/**
 * Calculate progress stats from activity events
 */
export function calculateProgressStats(events: ActivityEvent[]): ProgressStats {
    const stats: ProgressStats = {
        questsCompleted: 0,
        bountiesWon: 0,
        bountiesLost: 0,
        dungeonsCompleted: 0,
        totalXP: 0,
        totalGold: 0,
        categoryBreakdown: {},
        dailyActivity: {},
        bestDay: null,
        typeBreakdown: {
            quest_complete: 0,
            bounty_victory: 0,
            bounty_defeat: 0,
            dungeon_complete: 0,
        },
    };

    for (const event of events) {
        // Count by type
        stats.typeBreakdown[event.type]++;

        switch (event.type) {
            case 'quest_complete':
                stats.questsCompleted++;
                if (event.category) {
                    stats.categoryBreakdown[event.category] =
                        (stats.categoryBreakdown[event.category] || 0) + 1;
                }
                break;

            case 'bounty_victory':
                stats.bountiesWon++;
                break;

            case 'bounty_defeat':
                stats.bountiesLost++;
                break;

            case 'dungeon_complete':
                stats.dungeonsCompleted++;
                break;
        }

        // Total XP and gold
        stats.totalXP += event.xpGained || 0;
        stats.totalGold += event.goldGained || 0;

        // Daily activity
        stats.dailyActivity[event.date] = (stats.dailyActivity[event.date] || 0) + 1;
    }

    // Find best day
    let maxCount = 0;
    for (const [date, count] of Object.entries(stats.dailyActivity)) {
        if (count > maxCount) {
            maxCount = count;
            stats.bestDay = { date, count };
        }
    }

    return stats;
}

/**
 * Get stats for a date range (convenience method)
 */
export function getProgressStatsForRange(
    history: ActivityEvent[],
    startDate: string,
    endDate: string
): ProgressStats {
    const filtered = getActivityInRange(history, startDate, endDate);
    return calculateProgressStats(filtered);
}

/**
 * Format a date for display (e.g., "Mon, Jan 27")
 */
export function formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Get all available presets for the UI
 */
export function getAllPresets(): { value: DatePreset; label: string }[] {
    return [
        { value: 'today', label: 'Today' },
        { value: 'this_week', label: 'This Week' },
        { value: 'last_7_days', label: 'Last 7 Days' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_30_days', label: 'Last 30 Days' },
        { value: 'all_time', label: 'All Time' },
    ];
}
