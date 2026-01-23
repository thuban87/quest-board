/**
 * Welcome Modal
 * 
 * Initial welcome screen shown on first launch.
 * Introduces Quest Board and leads to CharacterCreationModal.
 */

import { Modal, App } from 'obsidian';
import { CharacterCreationModal } from './CharacterCreationModal';
import type QuestBoardPlugin from '../../main';

export class WelcomeModal extends Modal {
    private plugin: QuestBoardPlugin;
    private onComplete: () => void;

    constructor(app: App, plugin: QuestBoardPlugin, onComplete: () => void) {
        super(app);
        this.plugin = plugin;
        this.onComplete = onComplete;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-welcome-modal');

        // Hero section
        const hero = contentEl.createDiv({ cls: 'qb-welcome-hero' });
        hero.createEl('div', { cls: 'qb-welcome-icon', text: '⚔️' });
        hero.createEl('h1', { cls: 'qb-welcome-title', text: 'Quest Board' });
        hero.createEl('p', { cls: 'qb-welcome-subtitle', text: 'Turn your tasks into an adventure' });

        // Description
        const desc = contentEl.createDiv({ cls: 'qb-welcome-desc' });
        desc.createEl('p', {
            text: 'Quest Board transforms your Obsidian tasks into an RPG experience. Create quests, earn XP, level up your character, and unlock achievements!'
        });

        // Feature highlights
        const features = contentEl.createDiv({ cls: 'qb-welcome-features' });
        const featureList = [
            { emoji: '🎮', text: 'Choose your class and build your character' },
            { emoji: '📋', text: 'Link quests to your existing task files' },
            { emoji: '⭐', text: 'Complete tasks to earn XP and level up' },
            { emoji: '🏆', text: 'Unlock achievements as you progress' },
        ];

        featureList.forEach(({ emoji, text }) => {
            const item = features.createDiv({ cls: 'qb-welcome-feature' });
            item.createSpan({ cls: 'qb-welcome-feature-emoji', text: emoji });
            item.createSpan({ cls: 'qb-welcome-feature-text', text });
        });

        // Action button
        const actions = contentEl.createDiv({ cls: 'qb-welcome-actions' });
        const startBtn = actions.createEl('button', {
            cls: 'mod-cta qb-welcome-start-btn',
            text: '🗡️ Begin Your Adventure'
        });

        startBtn.addEventListener('click', () => {
            this.close();
            new CharacterCreationModal(this.app, this.plugin, this.onComplete).open();
        });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
