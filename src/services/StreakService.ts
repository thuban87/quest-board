/**
 * Streak Service
 * 
 * Handles streak tracking for consecutive days with quest/task completions.
 */

import { Character } from '../models/Character';

/**
 * Result of updating a streak
 */
export interface StreakUpdateResult {
    character: Character;
    streakContinued: boolean;
    streakBroken: boolean;
    newRecord: boolean;
    shieldUsed: boolean;
}

/**
 * Get today's date as local date string (YYYY-MM-DD format, in local timezone)
 */
export function getTodayDateString(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Get the Monday of the current week (for weekly shield reset, in local timezone)
 */
export function getMondayOfWeek(): string {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(today);
    monday.setDate(diff);
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

/**
 * Extract date string (YYYY-MM-DD) from any date string or ISO timestamp
 * If input is already YYYY-MM-DD format, returns as-is.
 * If input is ISO timestamp, converts to local date.
 */
function getLocalDateFromString(dateString: string): string {
    if (!dateString.includes('T')) {
        return dateString; // Already date-only format
    }
    // Parse ISO string and convert to local date
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Check if a date is yesterday (in local timezone)
 */
function isYesterday(dateString: string): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const inputDate = getLocalDateFromString(dateString);
    return inputDate === yesterdayStr;
}

/**
 * Check if a date is today (in local timezone)
 */
function isToday(dateString: string): boolean {
    const inputDate = getLocalDateFromString(dateString);
    return inputDate === getTodayDateString();
}

/**
 * Check if a date is more than 1 day ago (in local timezone)
 */
function isMoreThanOneDayAgo(dateString: string): boolean {
    const inputDate = new Date(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return inputDate < yesterday;
}

/**
 * Update streak when activity (quest or task completion) happens
 * Call this when:
 * - streakMode='quest': A quest is moved to Completed
 * - streakMode='task': A task is checked off
 */
export function updateStreak(
    character: Character,
    isPaladin: boolean = false
): StreakUpdateResult {
    const today = getTodayDateString();
    const lastDate = character.lastQuestCompletionDate;

    let newStreak = character.currentStreak;
    let streakContinued = false;
    let streakBroken = false;
    let newRecord = false;
    let shieldUsed = false;

    // Check if we need to reset shield (new week)
    let shieldUsedThisWeek = character.shieldUsedThisWeek;
    const monday = getMondayOfWeek();

    // If we don't have a record of when shield was used, or it's a new week, reset it
    // For simplicity, we'll reset the shield flag when a new week starts
    // We track this implicitly - if lastQuestCompletionDate is before this Monday and shield was used,
    // we can reset it. But for now, let's keep it simple.

    if (!lastDate) {
        // First activity ever - start a new streak
        newStreak = 1;
        streakContinued = true;
    } else if (isToday(lastDate)) {
        // Already had activity today - streak unchanged
        streakContinued = true;
    } else if (isYesterday(lastDate)) {
        // Activity yesterday - continue streak
        newStreak = character.currentStreak + 1;
        streakContinued = true;
    } else if (isMoreThanOneDayAgo(lastDate)) {
        // Missed day(s)
        if (isPaladin && !shieldUsedThisWeek) {
            // Paladin shield protects one miss per week
            // Check if we only missed ONE day (2 days ago)
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

            if (lastDate >= twoDaysAgoStr) {
                // Only missed one day - shield protects
                newStreak = character.currentStreak + 1;
                shieldUsed = true;
                shieldUsedThisWeek = true;
                streakContinued = true;
            } else {
                // Missed more than one day - streak breaks
                newStreak = 1;
                streakBroken = true;
            }
        } else {
            // No shield available - streak breaks
            newStreak = 1;
            streakBroken = true;
        }
    }

    // Check for new record
    const newHighest = Math.max(newStreak, character.highestStreak);
    if (newHighest > character.highestStreak) {
        newRecord = true;
    }

    const updatedCharacter: Character = {
        ...character,
        currentStreak: newStreak,
        highestStreak: newHighest,
        lastQuestCompletionDate: today,
        shieldUsedThisWeek,
        lastModified: new Date().toISOString(),
    };

    return {
        character: updatedCharacter,
        streakContinued,
        streakBroken,
        newRecord,
        shieldUsed,
    };
}

/**
 * Check and update streak on app load (in case user missed days)
 * This handles:
 * 1. Resetting streak if too many days were missed
 * 2. Resetting shieldUsedThisWeek at start of new week
 * 
 * Returns updated character if changes were made, null if no changes needed.
 */
export interface CheckStreakResult {
    character: Character;
    changed: boolean;
    streakWasReset: boolean;
    shieldWasReset: boolean;
}

export function checkStreakOnLoad(character: Character, isPaladin: boolean = false): CheckStreakResult {
    const lastDate = character.lastQuestCompletionDate;
    let changed = false;
    let streakWasReset = false;
    let shieldWasReset = false;

    let updatedCharacter = { ...character };

    // Check if we need to reset shield (new week)
    const currentMonday = getMondayOfWeek();
    if (character.shieldUsedThisWeek && lastDate) {
        // If the last activity was before this week's Monday, reset the shield
        if (lastDate < currentMonday) {
            updatedCharacter.shieldUsedThisWeek = false;
            shieldWasReset = true;
            changed = true;
            console.log('[StreakService] Weekly shield reset - new week started');
        }
    }

    if (!lastDate) {
        return { character: updatedCharacter, changed, streakWasReset, shieldWasReset };
    }

    // If last activity was today or yesterday, streak is still valid
    if (isToday(lastDate) || isYesterday(lastDate)) {
        return { character: updatedCharacter, changed, streakWasReset, shieldWasReset };
    }

    // Last activity was more than 1 day ago - check if streak should break
    // For Paladin with unused shield, check if it's only been 2 days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    if (isPaladin && !updatedCharacter.shieldUsedThisWeek && lastDate >= twoDaysAgoStr) {
        // Paladin with shield, only missed one day - streak is still protected
        // Don't break it yet, shield will be used when they complete next quest
        return { character: updatedCharacter, changed, streakWasReset, shieldWasReset };
    }

    // Streak should be reset
    if (character.currentStreak > 0) {
        console.log('[StreakService] Streak reset on load - missed too many days');
        updatedCharacter.currentStreak = 0;
        streakWasReset = true;
        changed = true;
    }

    if (changed) {
        updatedCharacter.lastModified = new Date().toISOString();
    }

    return { character: updatedCharacter, changed, streakWasReset, shieldWasReset };
}

/**
 * Get streak display string
 */
export function getStreakDisplay(currentStreak: number): string {
    if (currentStreak === 0) {
        return 'No streak';
    }
    if (currentStreak === 1) {
        return '1 day 🔥';
    }
    return `${currentStreak} days 🔥`;
}

/**
 * Get motivational message based on streak
 */
export function getStreakMessage(currentStreak: number): string {
    if (currentStreak === 0) {
        return 'Complete a quest to start your streak!';
    }
    if (currentStreak < 3) {
        return 'Keep going! Build that momentum.';
    }
    if (currentStreak < 7) {
        return 'Great progress! Almost a week!';
    }
    if (currentStreak < 14) {
        return 'Impressive dedication!';
    }
    if (currentStreak < 30) {
        return 'You\'re on fire! 🔥';
    }
    return 'Legendary consistency! 🏆';
}
