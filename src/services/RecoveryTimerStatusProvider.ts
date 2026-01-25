/**
 * Recovery Timer Status Provider
 * 
 * Shows countdown for recovery timer in the status bar.
 * Displays "⏰ Xm" format when recovery timer is active.
 */

import { StatusBarProvider } from './StatusBarService';
import { useCharacterStore } from '../store/characterStore';
import { getRecoveryTimeRemaining } from './RecoveryTimerService';

/**
 * Provider for recovery timer countdown in the status bar
 */
export class RecoveryTimerStatusProvider implements StatusBarProvider {
    readonly id = 'recovery-timer';
    readonly priority = 5; // Display after buffs

    getContent(): string | null {
        const character = useCharacterStore.getState().character;

        if (!character?.recoveryTimerEnd) {
            return null;
        }

        const minutesRemaining = getRecoveryTimeRemaining();

        if (minutesRemaining === null || minutesRemaining < 0) {
            return null;
        }

        // Show status icon based on character status
        const isUnconscious = character.status === 'unconscious';
        const icon = isUnconscious ? '💀' : '🛏️';
        const label = isUnconscious ? 'Recovery' : 'Resting';

        if (minutesRemaining === 0) {
            return `${icon} Soon...`;
        }

        return `${icon} ${label}: ${minutesRemaining}m`;
    }

    onClick(): void {
        // Nothing to do on click for now
        // Could open a modal showing details in the future
    }
}
