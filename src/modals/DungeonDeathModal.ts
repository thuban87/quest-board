/**
 * Dungeon Death Modal
 * 
 * Shows options when player dies in dungeon:
 * - Restart: Respawn monsters, reset to room 1 (keep chests opened)
 * - Rescue: Pay gold to continue at current position with 50% HP
 * - Leave: Exit dungeon completely
 */

import { Modal, App } from 'obsidian';
import { useCharacterStore } from '../store/characterStore';

// =====================
// COST FORMULA
// =====================

/** 
 * Calculate rescue cost based on player level.
 * Formula: 100g base + 35g per level
 */
export function calculateRescueCost(level: number): number {
    return 100 + (35 * level);
}

// =====================
// MODAL
// =====================

export interface DungeonDeathModalOptions {
    onRestart: () => void;
    onRescue: () => void;
    onLeave: () => void;
}

export class DungeonDeathModal extends Modal {
    private options: DungeonDeathModalOptions;
    private rescueCost: number;
    private canAffordRescue: boolean;

    constructor(app: App, options: DungeonDeathModalOptions) {
        super(app);
        this.options = options;

        // Calculate rescue cost from current character
        const character = useCharacterStore.getState().character;
        this.rescueCost = character ? calculateRescueCost(character.level) : 100;
        this.canAffordRescue = character ? character.gold >= this.rescueCost : false;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.addClass('qb-dungeon-death-modal');

        // Header
        contentEl.createEl('div', { cls: 'qb-death-header' }, (header) => {
            header.createEl('span', { cls: 'qb-death-icon', text: '💀' });
            header.createEl('h2', { text: 'You Have Fallen!' });
            header.createEl('p', {
                cls: 'qb-death-subtitle',
                text: 'The dungeon spirits offer you choices...'
            });
        });

        // Options container
        const optionsEl = contentEl.createEl('div', { cls: 'qb-death-options' });

        // Option 1: Restart
        this.createOption(optionsEl, {
            icon: '🔄',
            title: 'Restart Dungeon',
            description: 'Return to the beginning. All monsters respawn, but opened chests remain empty.',
            buttonText: 'Restart',
            buttonClass: 'qb-btn-secondary',
            onClick: () => {
                this.close();
                this.options.onRestart();
            },
        });

        // Option 2: Rescue (may be disabled)
        this.createOption(optionsEl, {
            icon: '💰',
            title: 'Pay for Rescue',
            description: this.canAffordRescue
                ? `Pay ${this.rescueCost}g to continue from your current position with 50% HP.`
                : `You need ${this.rescueCost}g to be rescued. (Not enough gold!)`,
            buttonText: `Rescue (${this.rescueCost}g)`,
            buttonClass: 'qb-btn-primary',
            disabled: !this.canAffordRescue,
            onClick: () => {
                this.close();
                this.options.onRescue();
            },
        });

        // Option 3: Leave
        this.createOption(optionsEl, {
            icon: '🚪',
            title: 'Leave Dungeon',
            description: 'Abandon the dungeon. You keep any loot collected, but the dungeon resets.',
            buttonText: 'Leave',
            buttonClass: 'qb-btn-danger',
            onClick: () => {
                this.close();
                this.options.onLeave();
            },
        });
    }

    private createOption(
        container: HTMLElement,
        config: {
            icon: string;
            title: string;
            description: string;
            buttonText: string;
            buttonClass: string;
            disabled?: boolean;
            onClick: () => void;
        }
    ): void {
        const optionEl = container.createEl('div', {
            cls: `qb-death-option ${config.disabled ? 'disabled' : ''}`
        });

        optionEl.createEl('div', { cls: 'qb-option-icon', text: config.icon });

        const contentEl = optionEl.createEl('div', { cls: 'qb-option-content' });
        contentEl.createEl('h3', { text: config.title });
        contentEl.createEl('p', { text: config.description });

        const button = optionEl.createEl('button', {
            cls: `qb-death-btn ${config.buttonClass}`,
            text: config.buttonText,
        });

        if (config.disabled) {
            button.disabled = true;
        } else {
            button.addEventListener('click', config.onClick);
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
