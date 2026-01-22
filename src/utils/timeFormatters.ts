/**
 * Time formatting utilities for status bar and UI displays
 */

/**
 * Format time remaining until expiration as a human-readable string
 * @param expiresAt - ISO timestamp string or null (for passive/permanent buffs)
 * @returns Formatted string like "52m", "1h 30m", "expired", or "∞"
 */
export function formatTimeRemaining(expiresAt: string | null): string {
    if (!expiresAt) return '∞';

    const now = Date.now();
    const expires = new Date(expiresAt).getTime();
    const diffMs = expires - now;

    if (diffMs <= 0) return 'expired';

    const totalMinutes = Math.floor(diffMs / 60000);

    if (totalMinutes < 1) return '<1m';
    if (totalMinutes < 60) return `${totalMinutes}m`;

    const hours = Math.floor(totalMinutes / 60);
    const remainingMins = totalMinutes % 60;

    if (remainingMins === 0) return `${hours}h`;
    return `${hours}h ${remainingMins}m`;
}

/**
 * Format a date as relative time (e.g., "2 days ago", "in 3 hours")
 * Useful for due dates and last activity
 */
export function formatRelativeTime(date: string | Date): string {
    const target = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
        // Past
        if (diffDays <= -1) return `${Math.abs(diffDays)}d ago`;
        if (diffHours <= -1) return `${Math.abs(diffHours)}h ago`;
        return `${Math.abs(diffMins)}m ago`;
    } else {
        // Future
        if (diffDays >= 1) return `in ${diffDays}d`;
        if (diffHours >= 1) return `in ${diffHours}h`;
        return `in ${diffMins}m`;
    }
}
