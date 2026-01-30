/**
 * Recovery Timer Service
 * 
 * Monitors the recovery timer and auto-revives the player when it expires.
 * Initialized from main.ts on plugin load.
 */

import { Notice } from 'obsidian';
import { useCharacterStore } from '../store/characterStore';

/** Check interval in milliseconds (60 seconds) */
const CHECK_INTERVAL_MS = 60 * 1000;

/** Interval ID for cleanup */
let checkIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Check if recovery timer has expired and revive if so.
 * Returns true if player was revived.
 */
export function checkAndProcessRecoveryTimer(): boolean {
    const store = useCharacterStore.getState();
    const character = store.character;

    if (!character) return false;

    const { recoveryTimerEnd, status } = character;

    // No timer set? Nothing to do
    if (!recoveryTimerEnd) return false;

    const now = new Date();
    const timerEnd = new Date(recoveryTimerEnd);

    // Timer hasn't expired yet
    if (now < timerEnd) return false;

    // Timer expired! Revive with 25% HP
    const revivedHP = Math.floor(character.maxHP * 0.25);

    store.setCharacter({
        ...character,
        currentHP: status === 'unconscious' ? revivedHP : character.currentHP,
        status: 'active',
        recoveryTimerEnd: null,
        persistentStatusEffects: [], // Phase 5: Clear all status effects on timer-based recovery
        lastModified: new Date().toISOString(),
    });

    // Show notification
    if (status === 'unconscious') {
        new Notice('⏰ Recovery complete! You have been revived with 25% HP.', 4000);
    } else {
        new Notice('🛏️ Rest complete! Time to get back to work.', 3000);
    }

    return true;
}

/**
 * Get remaining time on recovery timer in minutes.
 * Returns null if no timer active.
 */
export function getRecoveryTimeRemaining(): number | null {
    const character = useCharacterStore.getState().character;
    if (!character?.recoveryTimerEnd) return null;

    const now = new Date();
    const timerEnd = new Date(character.recoveryTimerEnd);
    const diffMs = timerEnd.getTime() - now.getTime();

    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (60 * 1000)); // Minutes, rounded up
}

/**
 * Format remaining time as human-readable string.
 */
export function formatRecoveryTimeRemaining(): string | null {
    const minutes = getRecoveryTimeRemaining();
    if (minutes === null) return null;
    if (minutes === 0) return 'Expiring soon...';
    if (minutes === 1) return '1 minute remaining';
    return `${minutes} minutes remaining`;
}

/**
 * Start the recovery timer check interval.
 * Called from main.ts on plugin load.
 */
export function startRecoveryTimerCheck(): void {
    // Clear any existing interval
    stopRecoveryTimerCheck();

    // Check immediately on start
    checkAndProcessRecoveryTimer();

    // Then check every 60 seconds
    checkIntervalId = setInterval(() => {
        checkAndProcessRecoveryTimer();
    }, CHECK_INTERVAL_MS);
}

/**
 * Stop the recovery timer check interval.
 * Called from main.ts on plugin unload.
 */
export function stopRecoveryTimerCheck(): void {
    if (checkIntervalId) {
        clearInterval(checkIntervalId);
        checkIntervalId = null;
    }
}

// Export service object
export const recoveryTimerService = {
    checkAndProcess: checkAndProcessRecoveryTimer,
    getTimeRemaining: getRecoveryTimeRemaining,
    formatTimeRemaining: formatRecoveryTimeRemaining,
    start: startRecoveryTimerCheck,
    stop: stopRecoveryTimerCheck,
};
