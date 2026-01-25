/**
 * Recovery Options Modal
 * 
 * Shows recovery options when player is unconscious after defeat.
 * Options: Use Revive Potion, Buy Revive Potion, Take a Break, Long Rest, Exit
 */

import { App, Modal, Notice } from 'obsidian';
import { useCharacterStore } from '../store/characterStore';

/** Revive potion price in gold */
const REVIVE_POTION_PRICE = 200;

/** Recovery timer duration in minutes */
const RECOVERY_TIMER_MINUTES = 30;

// =====================
// MODAL CLASS
// =====================

export interface RecoveryModalOptions {
    onRecoveryComplete?: () => void;
    onSave?: () => Promise<void>;
}

export class RecoveryOptionsModal extends Modal {
    private options: RecoveryModalOptions;

    constructor(app: App, options: RecoveryModalOptions = {}) {
        super(app);
        this.options = options;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-recovery-modal');

        this.renderOptions();
    }

    private renderOptions() {
        const { contentEl } = this;
        contentEl.empty();

        const store = useCharacterStore.getState();
        const character = store.character;
        const inventory = store.inventory;

        if (!character) {
            contentEl.createEl('p', { text: 'No character loaded.' });
            return;
        }

        const gold = character.gold;
        const hasRevivePotion = inventory.some(i => i.itemId === 'revive-potion' && i.quantity > 0);
        const canBuyPotion = gold >= REVIVE_POTION_PRICE;
        const revivePotionCount = inventory.find(i => i.itemId === 'revive-potion')?.quantity ?? 0;

        // Check if timer is already active
        let timerActive = false;
        let timerMinutes = 0;
        if (character.recoveryTimerEnd) {
            const remaining = new Date(character.recoveryTimerEnd).getTime() - Date.now();
            if (remaining > 0) {
                timerActive = true;
                timerMinutes = Math.ceil(remaining / 60000);
            }
        }

        // Header
        const header = contentEl.createDiv('qb-recovery-header');
        header.createEl('div', { cls: 'qb-recovery-icon', text: '💀' });
        header.createEl('h2', { text: 'Recovery Options' });
        header.createEl('p', {
            text: 'You have been defeated! Choose a way to recover:',
            cls: 'qb-recovery-subtitle'
        });

        // Options container
        const optionsContainer = contentEl.createDiv('qb-recovery-options');

        // Option 1: Use Revive Potion
        this.renderOptionButton(optionsContainer, {
            emoji: '💫',
            label: 'Use Revive Potion',
            description: hasRevivePotion
                ? `Consume 1 potion to revive with 25% HP (${revivePotionCount} owned)`
                : 'No revive potions in inventory',
            enabled: hasRevivePotion,
            onClick: () => this.handleUsePotion(),
        });

        // Option 2: Buy Revive Potion
        this.renderOptionButton(optionsContainer, {
            emoji: '🛒',
            label: 'Buy & Use Revive Potion',
            description: canBuyPotion
                ? `Spend ${REVIVE_POTION_PRICE}g to buy and use immediately`
                : `Not enough gold (need ${REVIVE_POTION_PRICE}g, have ${gold}g)`,
            enabled: canBuyPotion,
            onClick: () => this.handleBuyAndUsePotion(),
        });

        // Option 3: Take a Break (30 min timer)
        this.renderOptionButton(optionsContainer, {
            emoji: '⏰',
            label: 'Take a Break',
            description: timerActive
                ? `Already resting (${timerMinutes}m remaining)`
                : `Start a ${RECOVERY_TIMER_MINUTES}-minute recovery timer. You'll be revived when it expires.`,
            enabled: !timerActive,
            onClick: () => this.handleTakeBreak(),
        });

        // Option 4: Long Rest (full restore + timer)
        this.renderOptionButton(optionsContainer, {
            emoji: '🛏️',
            label: 'Long Rest',
            description: timerActive
                ? `Already resting (${timerMinutes}m remaining)`
                : `Full HP/Mana restore with ${RECOVERY_TIMER_MINUTES}-minute rest timer.`,
            enabled: !timerActive,
            onClick: () => this.handleLongRest(),
        });

        // Footer
        const footer = contentEl.createDiv('qb-recovery-footer');

        // Gold display
        const goldDisplay = footer.createDiv('qb-recovery-gold');
        goldDisplay.createSpan({ text: `💰 ${gold.toLocaleString()} gold` });

        // Exit button
        const exitBtn = footer.createEl('button', {
            text: 'Exit (Stay Unconscious)',
            cls: 'qb-recovery-exit-btn',
        });
        exitBtn.onclick = () => this.close();
    }

    private renderOptionButton(
        container: HTMLElement,
        config: {
            emoji: string;
            label: string;
            description: string;
            enabled: boolean;
            onClick: () => void;
        }
    ) {
        const btn = container.createEl('button', {
            cls: `qb-recovery-option-btn ${config.enabled ? '' : 'disabled'}`,
        });

        btn.createDiv({ cls: 'qb-recovery-option-icon', text: config.emoji });

        const content = btn.createDiv('qb-recovery-option-content');
        content.createEl('span', { text: config.label, cls: 'qb-recovery-option-label' });
        content.createEl('span', { text: config.description, cls: 'qb-recovery-option-desc' });

        if (config.enabled) {
            btn.onclick = config.onClick;
        } else {
            btn.disabled = true;
        }
    }

    private handleUsePotion() {
        const store = useCharacterStore.getState();
        const success = store.useRevivePotion();

        if (success) {
            new Notice('💫 Revived! You have 25% HP.', 3000);
            if (this.options.onSave) this.options.onSave();
            this.options.onRecoveryComplete?.();
            this.close();
        } else {
            new Notice('❌ No revive potions available.', 2000);
            this.renderOptions(); // Re-render
        }
    }

    private handleBuyAndUsePotion() {
        const store = useCharacterStore.getState();
        const character = store.character;

        if (!character || character.gold < REVIVE_POTION_PRICE) {
            new Notice('❌ Not enough gold!', 2000);
            return;
        }

        // Deduct gold
        store.updateGold(-REVIVE_POTION_PRICE);

        // Add potion to inventory
        store.addInventoryItem('revive-potion', 1);

        // Use it immediately
        const success = store.useRevivePotion();

        if (success) {
            new Notice(`💫 Purchased and used Revive Potion! (-${REVIVE_POTION_PRICE}g)`, 3000);
            if (this.options.onSave) this.options.onSave();
            this.options.onRecoveryComplete?.();
            this.close();
        } else {
            // Shouldn't happen, but handle gracefully
            new Notice('❌ Something went wrong.', 2000);
            this.renderOptions();
        }
    }

    private handleTakeBreak() {
        const store = useCharacterStore.getState();
        const character = store.character;

        // Double-check timer isn't already active
        if (character?.recoveryTimerEnd) {
            const remaining = new Date(character.recoveryTimerEnd).getTime() - Date.now();
            if (remaining > 0) {
                const mins = Math.ceil(remaining / 60000);
                new Notice(`🛏️ Already resting! ${mins} minutes remaining.`, 3000);
                return;
            }
        }

        // Set recovery timer for 30 minutes from now
        const endTime = new Date(Date.now() + RECOVERY_TIMER_MINUTES * 60 * 1000).toISOString();
        store.setRecoveryTimer(endTime);

        new Notice(`⏰ Recovery timer started! You'll be revived in ${RECOVERY_TIMER_MINUTES} minutes.`, 4000);
        if (this.options.onSave) this.options.onSave();
        this.close();
    }

    private handleLongRest() {
        const store = useCharacterStore.getState();
        const character = store.character;

        // Double-check timer isn't already active
        if (character?.recoveryTimerEnd) {
            const remaining = new Date(character.recoveryTimerEnd).getTime() - Date.now();
            if (remaining > 0) {
                const mins = Math.ceil(remaining / 60000);
                new Notice(`🛏️ Already resting! ${mins} minutes remaining.`, 3000);
                return;
            }
        }

        // Full restore HP/Mana
        store.fullRestore();

        // Clear unconscious status
        store.setStatus('active');

        // Set recovery timer (30 mins)
        const endTime = new Date(Date.now() + RECOVERY_TIMER_MINUTES * 60 * 1000).toISOString();
        store.setRecoveryTimer(endTime);

        new Notice(`🛏️ Long Rest complete! Full HP/Mana restored. Resting for ${RECOVERY_TIMER_MINUTES} minutes.`, 4000);
        if (this.options.onSave) this.options.onSave();
        this.options.onRecoveryComplete?.();
        this.close();
    }

    onClose() {
        this.contentEl.empty();
    }
}

/**
 * Helper to open the recovery modal
 */
export function openRecoveryOptionsModal(app: App, options: RecoveryModalOptions = {}): void {
    new RecoveryOptionsModal(app, options).open();
}
