/**
 * Dungeon Selection Modal
 * 
 * Full modal for selecting a dungeon with cards showing name, difficulty,
 * room count, loot bias, and description. Includes random dungeon option.
 */

import { App, Modal, Notice } from 'obsidian';
import type { DungeonTemplate } from '../models/Dungeon';
import { getAllDungeonTemplates, getRandomDungeon } from '../data/dungeons';

// Gear slot display emojis
const SLOT_EMOJIS: Record<string, string> = {
    head: '🎭',
    chest: '👕',
    legs: '👖',
    boots: '👟',
    weapon: '⚔️',
    shield: '🛡️',
    accessory1: '💍',
    accessory2: '📿',
    accessory3: '🔮',
};

// Difficulty display
const DIFFICULTY_COLORS: Record<string, string> = {
    easy: '#4ade80',      // Green
    medium: '#facc15',    // Yellow
    hard: '#ef4444',      // Red
};

const DIFFICULTY_LABELS: Record<string, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
};

interface DungeonSelectionModalOptions {
    onSelect: (template: DungeonTemplate) => void;
    excludeTestCave?: boolean;
}

export class DungeonSelectionModal extends Modal {
    private options: DungeonSelectionModalOptions;
    private randomPreview: DungeonTemplate | null = null;

    constructor(app: App, options: DungeonSelectionModalOptions) {
        super(app);
        this.options = options;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-dungeon-selection-modal');

        // Add styles
        this.addStyles();

        // Header
        const header = contentEl.createEl('div', { cls: 'qb-ds-header' });
        header.createEl('h2', { text: '⚔️ Select Dungeon' });

        // Get templates
        let templates = getAllDungeonTemplates();
        if (this.options.excludeTestCave) {
            templates = templates.filter(t => t.id !== 'test_cave');
        }

        // Dungeon grid
        const grid = contentEl.createEl('div', { cls: 'qb-ds-grid' });

        for (const template of templates) {
            this.renderDungeonCard(grid, template, false);
        }

        // Random dungeon section
        const randomSection = contentEl.createEl('div', { cls: 'qb-ds-random-section' });
        randomSection.createEl('div', { cls: 'qb-ds-random-divider', text: '— OR —' });

        const randomCard = randomSection.createEl('div', { cls: 'qb-ds-random-card' });

        // Random button
        const randomBtn = randomCard.createEl('button', {
            cls: 'qb-ds-random-btn',
            text: '🎲 Random Dungeon'
        });
        randomBtn.addEventListener('click', () => this.rollRandomDungeon(randomCard));

        // Preview area (hidden initially)
        const previewArea = randomCard.createEl('div', { cls: 'qb-ds-random-preview', attr: { style: 'display: none;' } });

        // Cancel button
        const cancelBtn = contentEl.createEl('button', { cls: 'qb-ds-cancel-btn', text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());
    }

    private rollRandomDungeon(container: HTMLElement): void {
        // Get random dungeon
        this.randomPreview = getRandomDungeon();

        // Find or create preview area
        let previewArea = container.querySelector('.qb-ds-random-preview') as HTMLElement;
        if (!previewArea) return;

        previewArea.empty();
        previewArea.style.display = 'block';

        // Show the preview card
        previewArea.createEl('div', { cls: 'qb-ds-random-result-text', text: 'You rolled:' });
        this.renderDungeonCard(previewArea, this.randomPreview, true);

        // Action buttons
        const actions = previewArea.createEl('div', { cls: 'qb-ds-random-actions' });

        const acceptBtn = actions.createEl('button', { cls: 'qb-ds-accept-btn', text: '✓ Enter' });
        acceptBtn.addEventListener('click', () => {
            if (this.randomPreview) {
                this.close();
                this.options.onSelect(this.randomPreview);
            }
        });

        const rerollBtn = actions.createEl('button', { cls: 'qb-ds-reroll-btn', text: '🎲 Reroll' });
        rerollBtn.addEventListener('click', () => this.rollRandomDungeon(container));

        const declineBtn = actions.createEl('button', { cls: 'qb-ds-decline-btn', text: '✗ Cancel' });
        declineBtn.addEventListener('click', () => {
            previewArea.style.display = 'none';
            this.randomPreview = null;
        });
    }

    private renderDungeonCard(container: HTMLElement, template: DungeonTemplate, isPreview: boolean): void {
        const card = container.createEl('div', {
            cls: `qb-ds-card ${isPreview ? 'qb-ds-card-preview' : ''}`,
            attr: { 'data-difficulty': template.baseDifficulty }
        });

        // Header row: name + difficulty badge
        const headerRow = card.createEl('div', { cls: 'qb-ds-card-header' });
        headerRow.createEl('span', { cls: 'qb-ds-card-name', text: template.name });

        const badge = headerRow.createEl('span', {
            cls: 'qb-ds-card-badge',
            text: DIFFICULTY_LABELS[template.baseDifficulty] || template.baseDifficulty
        });
        badge.style.backgroundColor = DIFFICULTY_COLORS[template.baseDifficulty] || '#888';

        // Description
        card.createEl('div', { cls: 'qb-ds-card-desc', text: template.description || 'A mysterious dungeon...' });

        // Stats row
        const stats = card.createEl('div', { cls: 'qb-ds-card-stats' });
        stats.createEl('span', { text: `🚪 ${template.rooms.length} rooms` });
        stats.createEl('span', { text: `📦 ${template.tileSet}` });

        // Loot bias
        if (template.lootBias) {
            const lootRow = card.createEl('div', { cls: 'qb-ds-card-loot' });
            const slots = template.lootBias.primarySlots || [];
            const emojis = slots.map(s => SLOT_EMOJIS[s] || '❓').join(' ');
            lootRow.createEl('span', { text: `Loot: ${emojis}` });
            if (template.lootBias.description) {
                lootRow.createEl('span', { cls: 'qb-ds-loot-desc', text: ` (${template.lootBias.description})` });
            }
        }

        // Click to select (if not preview)
        if (!isPreview) {
            card.addEventListener('click', () => {
                this.close();
                this.options.onSelect(template);
            });
        }
    }

    private addStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .qb-dungeon-selection-modal {
                padding: 20px;
                max-width: 600px;
            }
            .qb-ds-header {
                text-align: center;
                margin-bottom: 16px;
            }
            .qb-ds-header h2 {
                margin: 0;
                font-size: 1.4em;
            }
            .qb-ds-grid {
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: 400px;
                overflow-y: auto;
                padding-right: 8px;
            }
            .qb-ds-card {
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 12px 16px;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .qb-ds-card:hover {
                background: var(--background-modifier-hover);
                transform: translateX(4px);
                border-color: var(--interactive-accent);
            }
            .qb-ds-card-preview {
                cursor: default;
                border: 2px solid var(--interactive-accent);
            }
            .qb-ds-card-preview:hover {
                transform: none;
            }
            .qb-ds-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
            }
            .qb-ds-card-name {
                font-weight: 600;
                font-size: 1.1em;
            }
            .qb-ds-card-badge {
                font-size: 0.75em;
                padding: 2px 8px;
                border-radius: 12px;
                color: #000;
                font-weight: 600;
            }
            .qb-ds-card-desc {
                color: var(--text-muted);
                font-size: 0.9em;
                margin-bottom: 8px;
            }
            .qb-ds-card-stats {
                display: flex;
                gap: 16px;
                font-size: 0.85em;
                color: var(--text-muted);
            }
            .qb-ds-card-loot {
                margin-top: 6px;
                font-size: 0.85em;
            }
            .qb-ds-loot-desc {
                color: var(--text-muted);
            }
            .qb-ds-random-section {
                margin-top: 16px;
            }
            .qb-ds-random-divider {
                text-align: center;
                color: var(--text-muted);
                font-size: 0.85em;
                margin-bottom: 12px;
            }
            .qb-ds-random-card {
                text-align: center;
            }
            .qb-ds-random-btn {
                padding: 12px 24px;
                font-size: 1.1em;
                cursor: pointer;
                border-radius: 8px;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
                border: none;
                font-weight: 600;
                transition: transform 0.15s;
            }
            .qb-ds-random-btn:hover {
                transform: scale(1.05);
            }
            .qb-ds-random-preview {
                margin-top: 16px;
            }
            .qb-ds-random-result-text {
                font-size: 0.9em;
                color: var(--text-muted);
                margin-bottom: 8px;
            }
            .qb-ds-random-actions {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-top: 12px;
            }
            .qb-ds-accept-btn {
                background: #22c55e;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            }
            .qb-ds-reroll-btn {
                background: #f59e0b;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            }
            .qb-ds-decline-btn {
                background: var(--background-modifier-border);
                color: var(--text-normal);
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
            }
            .qb-ds-cancel-btn {
                display: block;
                margin: 16px auto 0;
                padding: 8px 24px;
                background: var(--background-modifier-border);
                border: none;
                border-radius: 6px;
                cursor: pointer;
                color: var(--text-muted);
            }
        `;
        document.head.appendChild(style);
    }

    onClose(): void {
        this.contentEl.empty();
    }
}

/**
 * Open the dungeon selection modal.
 */
export function showDungeonSelectionModal(
    app: App,
    onSelect: (template: DungeonTemplate) => void,
    excludeTestCave = true
): void {
    new DungeonSelectionModal(app, { onSelect, excludeTestCave }).open();
}
