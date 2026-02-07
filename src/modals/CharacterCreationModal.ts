/**
 * Character Creation Modal
 * 
 * Allows user to select their class and name their character.
 * Shows class info, bonuses, perks, and GIF previews.
 */

import { Modal, App } from 'obsidian';
import { CharacterClass, CLASS_INFO, ClassInfo } from '../models/Character';
import { useCharacterStore } from '../store/characterStore';
import { TrainingIntroModal } from './TrainingIntroModal';
import type QuestBoardPlugin from '../../main';
import { getClassPreviewSprite } from '../services/SpriteService';

export class CharacterCreationModal extends Modal {
    private plugin: QuestBoardPlugin;
    private onComplete: () => void;
    private selectedClass: CharacterClass = 'paladin';
    private characterName: string = '';
    private nameInput: HTMLInputElement | null = null;

    constructor(app: App, plugin: QuestBoardPlugin, onComplete: () => void) {
        super(app);
        this.plugin = plugin;
        this.onComplete = onComplete;
    }

    /**
     * Get the resource path to a class preview GIF.
     * Uses SpriteService for consistent path resolution (tier 4 showcase).
     */
    private getClassGifPath(classId: CharacterClass): string | undefined {
        const assetFolder = this.plugin.manifest.dir;
        if (!assetFolder) return undefined;
        try {
            return getClassPreviewSprite(assetFolder, this.app.vault.adapter, classId);
        } catch {
            return undefined;
        }
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-character-creation-modal');

        // Header
        contentEl.createEl('h2', { cls: 'qb-cc-title', text: '⚔️ Create Your Character' });

        // Name input section
        const nameSection = contentEl.createDiv({ cls: 'qb-cc-name-section' });
        nameSection.createEl('label', { text: 'Character Name', cls: 'qb-cc-label' });
        this.nameInput = nameSection.createEl('input', {
            type: 'text',
            placeholder: 'Enter your name...',
            cls: 'qb-cc-name-input'
        });
        this.nameInput.addEventListener('input', (e) => {
            this.characterName = (e.target as HTMLInputElement).value;
            this.updateCreateButton();
        });

        // Class selection header
        contentEl.createEl('h3', { cls: 'qb-cc-section-title', text: 'Choose Your Class' });

        // Class grid
        const classGrid = contentEl.createDiv({ cls: 'qb-cc-class-grid' });
        const classes = Object.entries(CLASS_INFO) as [CharacterClass, ClassInfo][];

        classes.forEach(([classId, info]) => {
            const card = classGrid.createDiv({
                cls: `qb-cc-class-card ${classId === this.selectedClass ? 'selected' : ''}`
            });
            card.dataset.classId = classId;

            // GIF Preview
            const gifContainer = card.createDiv({ cls: 'qb-cc-class-gif' });
            const gifPath = this.getClassGifPath(classId);
            if (gifPath) {
                const gif = gifContainer.createEl('img', {
                    cls: 'qb-cc-gif-img',
                    attr: {
                        src: gifPath,
                        alt: info.name
                    }
                });
                // Fallback to emoji if GIF fails to load
                gif.addEventListener('error', () => {
                    gifContainer.empty();
                    gifContainer.createSpan({ cls: 'qb-cc-gif-fallback', text: info.emoji });
                });
            } else {
                // No GIF file found, show emoji
                gifContainer.createSpan({ cls: 'qb-cc-gif-fallback', text: info.emoji });
            }

            // Class header with name
            const header = card.createDiv({ cls: 'qb-cc-class-header' });
            header.createSpan({ cls: 'qb-cc-class-name', text: info.name });

            // Description
            card.createDiv({ cls: 'qb-cc-class-desc', text: info.description });

            // Bonus categories
            const bonusDiv = card.createDiv({ cls: 'qb-cc-class-bonus' });
            bonusDiv.createSpan({ text: `+${info.bonusPercent}% XP: ` });
            bonusDiv.createSpan({ cls: 'qb-cc-bonus-categories', text: info.bonusCategories.join(', ') });

            // Click handler
            card.addEventListener('click', () => {
                this.selectedClass = classId;
                this.updateSelectedClass(classGrid);
            });
        });

        // Selected class details panel
        const detailsPanel = contentEl.createDiv({ cls: 'qb-cc-details-panel' });
        this.renderClassDetails(detailsPanel);

        // Action buttons
        const actions = contentEl.createDiv({ cls: 'qb-cc-actions' });

        const backBtn = actions.createEl('button', {
            cls: 'qb-cc-back-btn',
            text: '← Back'
        });
        backBtn.addEventListener('click', () => {
            this.close();
            // Re-open welcome modal
            const { WelcomeModal } = require('./WelcomeModal');
            new WelcomeModal(this.app, this.plugin, this.onComplete).open();
        });

        const createBtn = actions.createEl('button', {
            cls: 'mod-cta qb-cc-create-btn',
            text: '✨ Create Character'
        });
        createBtn.disabled = true;
        createBtn.addEventListener('click', () => this.createCharacter());

        // Store reference for enabling/disabling
        (contentEl as any)._createBtn = createBtn;
    }

    private updateSelectedClass(classGrid: HTMLElement): void {
        // Update visual selection
        classGrid.querySelectorAll('.qb-cc-class-card').forEach((card) => {
            card.removeClass('selected');
            if ((card as HTMLElement).dataset.classId === this.selectedClass) {
                card.addClass('selected');
            }
        });

        // Update details panel
        const detailsPanel = this.contentEl.querySelector('.qb-cc-details-panel');
        if (detailsPanel) {
            this.renderClassDetails(detailsPanel as HTMLElement);
        }
    }

    private renderClassDetails(container: HTMLElement): void {
        container.empty();
        const info = CLASS_INFO[this.selectedClass];

        // Large GIF preview
        const gifContainer = container.createDiv({ cls: 'qb-cc-detail-gif' });
        const gifPath = this.getClassGifPath(this.selectedClass);
        if (gifPath) {
            const gif = gifContainer.createEl('img', {
                cls: 'qb-cc-detail-gif-img',
                attr: {
                    src: gifPath,
                    alt: info.name
                }
            });
            // Fallback to large emoji if GIF fails
            gif.addEventListener('error', () => {
                gifContainer.empty();
                gifContainer.createSpan({ cls: 'qb-cc-detail-gif-fallback', text: info.emoji });
            });
        } else {
            gifContainer.createSpan({ cls: 'qb-cc-detail-gif-fallback', text: info.emoji });
        }

        // Class name and description
        const infoSection = container.createDiv({ cls: 'qb-cc-detail-info' });
        infoSection.createEl('h4', { text: info.name });
        infoSection.createEl('p', { cls: 'qb-cc-detail-desc', text: info.description });

        // Perk details
        const perkSection = infoSection.createDiv({ cls: 'qb-cc-detail-perk' });
        perkSection.createEl('strong', { text: `🌟 ${info.perkName}` });
        perkSection.createEl('p', { text: info.perkDescription });

        // Bonus categories
        const bonusSection = infoSection.createDiv({ cls: 'qb-cc-detail-bonus' });
        bonusSection.createEl('strong', { text: `+${info.bonusPercent}% XP Bonus` });
        bonusSection.createEl('p', { text: `Categories: ${info.bonusCategories.join(', ')}` });

        // Primary stats
        const statSection = infoSection.createDiv({ cls: 'qb-cc-detail-stats' });
        statSection.createEl('strong', { text: 'Primary Stats' });
        const statNames: Record<string, string> = {
            strength: 'Strength',
            intelligence: 'Intelligence',
            wisdom: 'Wisdom',
            constitution: 'Constitution',
            dexterity: 'Dexterity',
            charisma: 'Charisma'
        };
        const statText = info.primaryStats.map(s => statNames[s]).join(' & ');
        statSection.createEl('p', { text: statText });
    }

    private updateCreateButton(): void {
        const btn = (this.contentEl as any)._createBtn as HTMLButtonElement;
        if (btn) {
            btn.disabled = this.characterName.trim().length === 0;
        }
    }

    private async createCharacter(): Promise<void> {
        if (this.characterName.trim().length === 0) {
            return;
        }

        // Create character via store
        const character = useCharacterStore.getState().createCharacter(
            this.characterName.trim(),
            this.selectedClass,
            {} // Default appearance
        );

        // Save to plugin settings
        this.plugin.settings.character = character;
        await this.plugin.saveSettings();

        // Close this modal and open training intro
        this.close();
        new TrainingIntroModal(this.app, this.plugin, this.onComplete).open();
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}

