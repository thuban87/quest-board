/**
 * Bounty Revive Modal
 * 
 * Pre-modal shown when bounty triggers but player is unconscious.
 * Allows player to revive (use/buy potion) before accepting the bounty.
 */

import { App, Modal, Notice } from 'obsidian';
import type { Bounty } from '../models/Bounty';
import { useCharacterStore } from '../store/characterStore';
import { showBountyModal } from './BountyModal';

/** Revive potion price in gold */
const REVIVE_POTION_PRICE = 200;

// =====================
// MODAL OPTIONS
// =====================

export interface BountyReviveModalOptions {
    /** Callback after successful revival - proceeds to bounty */
    onRevived?: () => void;
    /** Callback when player declines */
    onDecline?: () => void;
    /** Save callback for persistence */
    onSave?: () => Promise<void>;
    /** Callback to open battle view after battle starts */
    onBattleStart?: () => void;
}

// =====================
// BOUNTY REVIVE MODAL
// =====================

export class BountyReviveModal extends Modal {
    private bounty: Bounty;
    private options: BountyReviveModalOptions;

    constructor(app: App, bounty: Bounty, options: BountyReviveModalOptions = {}) {
        super(app);
        this.bounty = bounty;
        this.options = options;
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-bounty-revive-modal');
        modalEl.addClass('qb-modal-bounty-revive');

        this.render();
    }

    private render() {
        const { contentEl } = this;
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

        // Header
        const header = contentEl.createDiv('qb-bounty-revive-header');
        header.createEl('div', { cls: 'qb-bounty-revive-icon', text: '⚠️' });
        header.createEl('h2', { text: "You're Unconscious!" });
        header.createEl('p', {
            text: 'A bounty has appeared, but you need to recover first.',
            cls: 'qb-bounty-revive-subtitle'
        });

        // Bounty preview (what they're missing)
        const preview = contentEl.createDiv('qb-bounty-revive-preview');
        preview.createEl('div', { text: '🎯 Bounty Waiting:', cls: 'qb-bounty-revive-preview-label' });
        preview.createEl('div', { text: this.bounty.description, cls: 'qb-bounty-revive-preview-desc' });

        const monsterLine = preview.createDiv('qb-bounty-revive-monster-line');
        monsterLine.createSpan({ text: this.bounty.monster.emoji });
        monsterLine.createSpan({ text: ` ${this.bounty.monster.name} (Lv.${this.bounty.monster.level})` });

        // Options container
        const optionsContainer = contentEl.createDiv('qb-bounty-revive-options');

        // Option 1: Use Revive Potion
        this.renderOptionButton(optionsContainer, {
            emoji: '💫',
            label: 'Use Revive Potion',
            description: hasRevivePotion
                ? `Use 1 potion to revive and accept bounty (${revivePotionCount} owned)`
                : 'No revive potions in inventory',
            enabled: hasRevivePotion,
            onClick: () => this.handleUsePotion(),
        });

        // Option 2: Buy & Use Revive Potion
        this.renderOptionButton(optionsContainer, {
            emoji: '🛒',
            label: 'Buy & Use Revive Potion',
            description: canBuyPotion
                ? `Spend ${REVIVE_POTION_PRICE}g to revive and accept bounty`
                : `Not enough gold (need ${REVIVE_POTION_PRICE}g, have ${gold}g)`,
            enabled: canBuyPotion,
            onClick: () => this.handleBuyAndUsePotion(),
        });

        // Footer
        const footer = contentEl.createDiv('qb-bounty-revive-footer');

        // Gold display
        const goldDisplay = footer.createDiv('qb-bounty-revive-gold');
        goldDisplay.createSpan({ text: `💰 ${gold.toLocaleString()} gold` });

        // Decline button
        const declineBtn = footer.createEl('button', {
            text: '❌ Decline Bounty',
            cls: 'qb-bounty-revive-decline-btn',
        });
        declineBtn.onclick = () => this.handleDecline();
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
            cls: `qb-bounty-revive-option-btn ${config.enabled ? '' : 'disabled'}`,
        });

        btn.createDiv({ cls: 'qb-bounty-revive-option-icon', text: config.emoji });

        const content = btn.createDiv('qb-bounty-revive-option-content');
        content.createEl('span', { text: config.label, cls: 'qb-bounty-revive-option-label' });
        content.createEl('span', { text: config.description, cls: 'qb-bounty-revive-option-desc' });

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
            new Notice('💫 Revived! Proceeding to bounty...', 2000);
            if (this.options.onSave) this.options.onSave();
            this.options.onRevived?.();
            this.close();

            // Open the bounty modal
            setTimeout(() => {
                showBountyModal(this.app, this.bounty, {
                    onSave: this.options.onSave,
                    onBattleStart: this.options.onBattleStart,
                });
            }, 300);
        } else {
            new Notice('❌ No revive potions available.', 2000);
            this.render(); // Re-render to update state
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
            this.options.onRevived?.();
            this.close();

            // Open the bounty modal
            setTimeout(() => {
                showBountyModal(this.app, this.bounty, {
                    onSave: this.options.onSave,
                    onBattleStart: this.options.onBattleStart,
                });
            }, 300);
        } else {
            new Notice('❌ Something went wrong.', 2000);
            this.render();
        }
    }

    private handleDecline() {
        new Notice('💨 Bounty declined. The creature escapes...', 2000);
        this.options.onDecline?.();
        this.close();
    }

    onClose() {
        this.contentEl.empty();
    }
}

// =====================
// HELPER FUNCTION
// =====================

/**
 * Open the bounty revive modal for an unconscious player.
 */
export function showBountyReviveModal(
    app: App,
    bounty: Bounty,
    options: BountyReviveModalOptions = {}
): void {
    new BountyReviveModal(app, bounty, options).open();
}
