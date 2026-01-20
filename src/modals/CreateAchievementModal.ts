/**
 * Create Achievement Modal
 * 
 * Allows users to create custom achievements.
 */

import { App, Modal, Notice, Setting } from 'obsidian';
import { Achievement, AchievementTriggerType } from '../models/Achievement';
import { useCharacterStore } from '../store/characterStore';

export class CreateAchievementModal extends Modal {
    private name: string = '';
    private description: string = '';
    private emoji: string = '🎯';
    private triggerType: AchievementTriggerType = 'manual';
    private triggerTarget: number = 1;
    private triggerCategory: string = '';
    private xpBonus: number = 50;
    private onSave: (achievement: Achievement) => void;

    constructor(app: App, onSave: (achievement: Achievement) => void) {
        super(app);
        this.onSave = onSave;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-create-achievement-modal');

        contentEl.createEl('h2', { text: '✨ Create Achievement' });

        // Name
        new Setting(contentEl)
            .setName('Name')
            .setDesc('Achievement display name')
            .addText(text => text
                .setPlaceholder('My Achievement')
                .onChange(value => this.name = value));

        // Description
        new Setting(contentEl)
            .setName('Description')
            .setDesc('How to unlock this achievement')
            .addText(text => text
                .setPlaceholder('Complete 5 special tasks')
                .onChange(value => this.description = value));

        // Emoji
        new Setting(contentEl)
            .setName('Emoji')
            .setDesc('Badge emoji (used if no image)')
            .addText(text => text
                .setValue(this.emoji)
                .onChange(value => this.emoji = value || '🎯'));

        // Trigger Type
        new Setting(contentEl)
            .setName('Trigger Type')
            .setDesc('How is this achievement unlocked?')
            .addDropdown(dropdown => dropdown
                .addOption('manual', 'Manual (unlock yourself)')
                .addOption('level', 'Reach Level')
                .addOption('quest_count', 'Complete N Quests')
                .addOption('category_count', 'Complete N in Category')
                .addOption('streak', 'Maintain Streak')
                .onChange(value => {
                    this.triggerType = value as AchievementTriggerType;
                    this.updateTriggerFields();
                }));

        // Trigger Target (number)
        this.targetSetting = new Setting(contentEl)
            .setName('Target')
            .setDesc('Number to reach')
            .addText(text => text
                .setValue('1')
                .onChange(value => this.triggerTarget = parseInt(value) || 1));

        // Trigger Category (for category_count)
        this.categorySetting = new Setting(contentEl)
            .setName('Category')
            .setDesc('Quest category to track')
            .addText(text => text
                .setPlaceholder('applications')
                .onChange(value => this.triggerCategory = value));

        // XP Bonus
        new Setting(contentEl)
            .setName('XP Bonus')
            .setDesc('XP awarded on unlock')
            .addText(text => text
                .setValue('50')
                .onChange(value => this.xpBonus = parseInt(value) || 50));

        // Create button
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Create Achievement')
                .setCta()
                .onClick(() => this.createAchievement()));

        this.updateTriggerFields();
    }

    private targetSetting: Setting | null = null;
    private categorySetting: Setting | null = null;

    private updateTriggerFields() {
        const showTarget = this.triggerType !== 'manual';
        const showCategory = this.triggerType === 'category_count';

        if (this.targetSetting) {
            this.targetSetting.settingEl.style.display = showTarget ? '' : 'none';
        }
        if (this.categorySetting) {
            this.categorySetting.settingEl.style.display = showCategory ? '' : 'none';
        }
    }

    private createAchievement() {
        if (!this.name.trim()) {
            new Notice('Name is required');
            return;
        }
        if (!this.description.trim()) {
            new Notice('Description is required');
            return;
        }

        // Generate unique ID
        const id = `custom-${Date.now()}`;

        const achievement: Achievement = {
            id,
            name: this.name.trim(),
            description: this.description.trim(),
            emoji: this.emoji,
            category: 'custom',
            trigger: {
                type: this.triggerType,
                target: this.triggerTarget,
                category: this.triggerCategory || undefined,
            },
            xpBonus: this.xpBonus,
        };

        this.onSave(achievement);
        new Notice(`Achievement "${this.name}" created!`);
        this.close();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
