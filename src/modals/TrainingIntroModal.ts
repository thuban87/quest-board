/**
 * Training Intro Modal
 * 
 * Explains training mode and early game mechanics.
 * Shown after character creation.
 */

import { Modal, App } from 'obsidian';
import { useCharacterStore } from '../store/characterStore';
import type QuestBoardPlugin from '../../main';

export class TrainingIntroModal extends Modal {
    private plugin: QuestBoardPlugin;
    private onComplete: () => void;
    private skipTraining: boolean = false;

    constructor(app: App, plugin: QuestBoardPlugin, onComplete: () => void) {
        super(app);
        this.plugin = plugin;
        this.onComplete = onComplete;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-training-intro-modal');

        const character = useCharacterStore.getState().character;
        const characterName = character?.name || 'Adventurer';

        // Header
        const header = contentEl.createDiv({ cls: 'qb-ti-header' });
        header.createEl('div', { cls: 'qb-ti-icon', text: '🎓' });
        header.createEl('h2', { text: `Welcome, ${characterName}!` });

        // Training explanation
        const explanation = contentEl.createDiv({ cls: 'qb-ti-explanation' });
        explanation.createEl('p', {
            text: 'You are about to begin Training Mode - a tutorial phase to learn the basics of Quest Board.'
        });

        // Training mode details
        const details = contentEl.createDiv({ cls: 'qb-ti-details' });
        details.createEl('h4', { text: '📜 Training Mode' });

        const trainList = details.createEl('ul');
        const trainItems = [
            'Progress through Training Levels I through X',
            'Each level requires 75 XP (10 levels total = 750 XP)',
            'After Level X, you\'ll graduate to Level 1 as a full adventurer!',
        ];
        trainItems.forEach(item => {
            trainList.createEl('li', { text: item });
        });

        // Quick tips
        const tips = contentEl.createDiv({ cls: 'qb-ti-tips' });
        tips.createEl('h4', { text: '💡 Getting Started' });

        const tipList = tips.createEl('ul');
        const tipItems = [
            'Use the Quest Board sidebar to view your quests',
            'Create quests linked to your existing task files',
            'Complete tasks to earn XP - your class gives bonus XP for matching categories!',
            'Track your progress on the character sheet',
        ];
        tipItems.forEach(item => {
            tipList.createEl('li', { text: item });
        });

        // Skip training option
        const skipSection = contentEl.createDiv({ cls: 'qb-ti-skip-section' });
        const skipLabel = skipSection.createEl('label', { cls: 'qb-ti-skip-label' });
        const skipCheckbox = skipLabel.createEl('input', { type: 'checkbox' });
        skipCheckbox.addEventListener('change', (e) => {
            this.skipTraining = (e.target as HTMLInputElement).checked;
        });
        skipLabel.createSpan({ text: ' Skip Training Mode (returning player or prefer to jump right in)' });

        // Action button
        const actions = contentEl.createDiv({ cls: 'qb-ti-actions' });
        const startBtn = actions.createEl('button', {
            cls: 'mod-cta qb-ti-start-btn',
            text: '🎮 Begin Training!'
        });

        startBtn.addEventListener('click', async () => {
            if (this.skipTraining) {
                // Graduate immediately
                const store = useCharacterStore.getState();
                store.setTrainingMode(false);
                store.graduate();

                // Update plugin settings
                const character = useCharacterStore.getState().character;
                if (character) {
                    this.plugin.settings.character = character;
                    await this.plugin.saveSettings();
                }
            }

            this.close();
            this.onComplete();
        });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
