/**
 * Paid Rest Modal
 * 
 * Shows confirmation modal when player wants to bypass Long Rest cooldown by paying gold.
 */

import { App, Modal, Notice } from 'obsidian';
import { useCharacterStore } from '../store/characterStore';
import { getPaidLongRestCost } from '../config/combatConfig';

/** Recovery timer duration in minutes */
const RECOVERY_TIMER_MINUTES = 30;

export interface PaidRestModalOptions {
    onSuccess?: () => void;
    onSave?: () => Promise<void>;
}

export class PaidRestModal extends Modal {
    private options: PaidRestModalOptions;

    constructor(app: App, options: PaidRestModalOptions = {}) {
        super(app);
        this.options = options;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-paid-rest-modal');

        const store = useCharacterStore.getState();
        const character = store.character;

        if (!character) {
            contentEl.createEl('p', { text: 'No character loaded.' });
            return;
        }

        const cost = getPaidLongRestCost(character.level);
        const gold = character.gold;
        const canAfford = gold >= cost;

        // Check timer remaining
        let timerMinutes = 0;
        if (character.recoveryTimerEnd) {
            const remaining = new Date(character.recoveryTimerEnd).getTime() - Date.now();
            if (remaining > 0) {
                timerMinutes = Math.ceil(remaining / 60000);
            }
        }

        // Header
        const header = contentEl.createDiv('qb-paid-rest-header');
        header.createEl('div', { cls: 'qb-paid-rest-icon', text: '🏨' });
        header.createEl('h2', { text: 'Paid Long Rest' });
        header.createEl('p', {
            text: timerMinutes > 0
                ? `You're already resting (${timerMinutes}m remaining). Pay to restore now?`
                : 'Pay to fully restore HP and Mana immediately.',
            cls: 'qb-paid-rest-subtitle'
        });

        // Cost display
        const costDisplay = contentEl.createDiv('qb-paid-rest-cost');
        costDisplay.createEl('span', { text: `Cost: ` });
        costDisplay.createEl('span', {
            text: `💰 ${cost.toLocaleString()}g`,
            cls: canAfford ? 'qb-cost-affordable' : 'qb-cost-expensive'
        });
        costDisplay.createEl('span', { text: ` (You have ${gold.toLocaleString()}g)` });

        // Buttons
        const buttonContainer = contentEl.createDiv('qb-paid-rest-buttons');

        const confirmBtn = buttonContainer.createEl('button', {
            text: canAfford ? 'Pay & Rest' : 'Not Enough Gold',
            cls: `qb-paid-rest-confirm-btn ${canAfford ? '' : 'disabled'}`,
        });
        confirmBtn.disabled = !canAfford;
        if (canAfford) {
            confirmBtn.onclick = () => this.handlePaidRest(cost);
        }

        const cancelBtn = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'qb-paid-rest-cancel-btn',
        });
        cancelBtn.onclick = () => this.close();
    }

    private async handlePaidRest(cost: number) {
        const store = useCharacterStore.getState();
        const character = store.character;

        if (!character || character.gold < cost) {
            new Notice('❌ Not enough gold!', 2000);
            return;
        }

        // Deduct gold
        store.updateGold(-cost);

        // Full restore HP/Mana (also clears persistentStatusEffects)
        store.fullRestore();

        // Clear unconscious status if applicable
        store.setStatus('active');

        // Set new 30-min recovery timer
        const endTime = new Date(Date.now() + RECOVERY_TIMER_MINUTES * 60 * 1000).toISOString();
        store.setRecoveryTimer(endTime);

        // Save
        if (this.options.onSave) {
            await this.options.onSave();
        }

        new Notice(`🏨 Paid Rest complete! Full HP/Mana restored. (-${cost}g)`, 3000);
        this.options.onSuccess?.();
        this.close();
    }

    onClose() {
        this.contentEl.empty();
    }
}

/**
 * Helper to open the paid rest modal
 */
export function openPaidRestModal(app: App, options: PaidRestModalOptions = {}): void {
    new PaidRestModal(app, options).open();
}
