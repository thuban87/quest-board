/**
 * Bounty Modal
 * 
 * Shows bounty offer when triggered by quest completion.
 * Allows player to Accept (start battle) or Decline (lose bounty).
 */

import { App, Modal, Notice } from 'obsidian';
import type { Bounty } from '../models/Bounty';
import { useCharacterStore } from '../store/characterStore';
import { battleService } from '../services/BattleService';
import { BOUNTY_LOOT_BONUS } from '../services/BountyService';
import { getMonsterGifPath } from '../services/SpriteService';

// =====================
// MODAL OPTIONS
// =====================

export interface BountyModalOptions {
    /** Callback when player accepts the bounty */
    onAccept?: () => void;
    /** Callback when player declines the bounty */
    onDecline?: () => void;
    /** Save callback for persistence */
    onSave?: () => Promise<void>;
    /** Callback to open battle view after battle starts */
    onBattleStart?: () => void;
    /** Asset folder path for sprite resolution */
    assetFolder?: string;
}

// =====================
// BOUNTY MODAL
// =====================

export class BountyModal extends Modal {
    private bounty: Bounty;
    private options: BountyModalOptions;

    constructor(app: App, bounty: Bounty, options: BountyModalOptions = {}) {
        super(app);
        this.bounty = bounty;
        this.options = options;
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-bounty-modal');
        modalEl.addClass('qb-modal-bounty');

        this.render();
    }

    private render() {
        const { contentEl } = this;
        const store = useCharacterStore.getState();
        const character = store.character;

        if (!character) {
            contentEl.createEl('p', { text: 'No character loaded.' });
            return;
        }

        // Header with icon
        const header = contentEl.createDiv('qb-bounty-header');
        header.createEl('div', { cls: 'qb-bounty-icon', text: '🎯' });
        header.createEl('h2', { text: 'BOUNTY AVAILABLE!' });

        // Quest info
        const questInfo = contentEl.createDiv('qb-bounty-quest-info');
        questInfo.createEl('span', { text: `Quest completed: `, cls: 'qb-bounty-quest-label' });
        questInfo.createEl('strong', { text: this.bounty.questTitle });

        // Description box
        const descBox = contentEl.createDiv('qb-bounty-description');
        descBox.createEl('p', { text: this.bounty.description });

        // Monster preview
        const monsterPreview = contentEl.createDiv('qb-bounty-monster-preview');
        const monster = this.bounty.monster;

        // Add elite class if this is an elite encounter
        if (this.bounty.isElite) {
            monsterPreview.addClass('elite');
        }

        const monsterIcon = monsterPreview.createDiv('qb-bounty-monster-icon');

        // Try to show monster sprite, fallback to emoji
        if (this.options.assetFolder && monster.templateId) {
            const spritePath = getMonsterGifPath(
                this.options.assetFolder,
                this.app.vault.adapter,
                monster.templateId
            );
            const img = monsterIcon.createEl('img', {
                attr: {
                    src: spritePath,
                    alt: monster.name,
                },
                cls: 'qb-monster-sprite-img',
            });
            // Fallback to emoji on error
            img.onerror = () => {
                img.remove();
                monsterIcon.textContent = monster.emoji;
            };
        } else {
            monsterIcon.textContent = monster.emoji;
        }

        const monsterInfo = monsterPreview.createDiv('qb-bounty-monster-info');
        // monster.name already includes prefix from BountyService, use directly
        const monsterName = monster.name;

        // Create name element with elite badge if applicable
        const nameEl = monsterInfo.createEl('div', { cls: 'qb-bounty-monster-name' });
        nameEl.textContent = monsterName;
        if (this.bounty.isElite) {
            nameEl.createEl('span', { text: 'ELITE', cls: 'qb-elite-badge' });
        }

        monsterInfo.createEl('div', {
            text: `Level ${monster.level} • ${monster.tier.toUpperCase()}`,
            cls: 'qb-bounty-monster-level'
        });

        // Rewards preview
        const rewardsBox = contentEl.createDiv('qb-bounty-rewards');
        rewardsBox.createEl('h4', { text: '🎁 Bounty Rewards' });
        const rewardsList = rewardsBox.createEl('ul');
        rewardsList.createEl('li', { text: `✨ Enhanced Loot (+${Math.round((BOUNTY_LOOT_BONUS - 1) * 100)}% Luck)` });
        rewardsList.createEl('li', { text: '⚡ No stamina cost' });
        rewardsList.createEl('li', { text: '💚 Full HP/Mana restore on accept' });

        // Buttons
        const buttonContainer = contentEl.createDiv('qb-bounty-buttons');

        const acceptBtn = buttonContainer.createEl('button', {
            text: '⚔️ Accept Bounty',
            cls: 'qb-bounty-accept-btn',
        });
        acceptBtn.onclick = () => this.handleAccept();

        // Flee button for elite encounters
        if (this.bounty.isElite) {
            const fleeBtn = buttonContainer.createEl('button', {
                text: '🏃 Flee',
                cls: 'qb-bounty-flee-btn',
            });
            fleeBtn.onclick = () => this.handleFlee();
        }

        const declineBtn = buttonContainer.createEl('button', {
            text: 'Decline',
            cls: 'qb-bounty-decline-btn',
        });
        declineBtn.onclick = () => this.handleDecline();
    }

    private handleAccept() {
        const store = useCharacterStore.getState();
        const character = store.character;

        if (!character) {
            new Notice('❌ No character found!', 2000);
            this.close();
            return;
        }

        // Full HP/Mana restore
        store.fullRestore();

        // Start the bounty battle (BattleService derives combat stats internally)
        const started = battleService.startBattleWithMonster(
            this.bounty.monster,
            {
                isBounty: true,
                questId: this.bounty.questId,
            }
        );

        if (started) {
            new Notice('🎯 Bounty accepted! Battle begins!', 2000);
            this.options.onAccept?.();
            if (this.options.onSave) this.options.onSave();
            // Open the battle view
            this.options.onBattleStart?.();
        } else {
            new Notice('❌ Failed to start bounty battle.', 2000);
        }

        this.close();
    }

    private handleDecline() {
        new Notice('💨 Bounty declined. The creature escapes...', 2000);
        this.options.onDecline?.();
        this.close();
    }

    private handleFlee() {
        new Notice('🏃 You fled from the elite monster! No shame in survival...', 2000);
        this.options.onDecline?.();  // Same as decline - forfeits bounty
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
 * Open the bounty modal for a triggered bounty.
 */
export function showBountyModal(
    app: App,
    bounty: Bounty,
    options: BountyModalOptions = {}
): void {
    new BountyModal(app, bounty, options).open();
}
