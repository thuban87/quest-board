/**
 * Achievement Hub Modal
 * 
 * Main management interface for achievements.
 * Shows all achievements, allows viewing details, editing, and creating new ones.
 */

import { App, Modal, Notice, Setting } from 'obsidian';
import { Achievement, isUnlocked, getProgressPercent } from '../models/Achievement';
import { useCharacterStore } from '../store/characterStore';
import { AchievementService, calculateAchievementProgress } from '../services/AchievementService';
import { CreateAchievementModal } from './CreateAchievementModal';

interface AchievementHubModalOptions {
    app: App;
    onSave: () => Promise<void>;
}

export class AchievementHubModal extends Modal {
    private onSave: () => Promise<void>;

    constructor(options: AchievementHubModalOptions) {
        super(options.app);
        this.onSave = options.onSave;
    }

    onOpen() {
        this.render();
    }

    private render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-achievement-hub-modal');

        const achievements = useCharacterStore.getState().achievements;
        const character = useCharacterStore.getState().character;
        const achievementService = new AchievementService(this.app.vault);

        // Calculate progress using shared utility (single source of truth)
        const achievementsWithProgress = calculateAchievementProgress(achievements, character);

        const sorted = achievementService.getSortedAchievements(achievementsWithProgress);
        const unlockedCount = achievementService.getUnlockedCount(achievements);

        // Header
        contentEl.createEl('h2', { text: `🏆 Achievement Hub (${unlockedCount}/${achievements.length})` });

        // Create button
        new Setting(contentEl)
            .setName('Create Custom Achievement')
            .addButton(btn => btn
                .setButtonText('+ Create')
                .setCta()
                .onClick(() => {
                    new CreateAchievementModal(this.app, async (achievement) => {
                        const current = useCharacterStore.getState().achievements;
                        useCharacterStore.setState({ achievements: [...current, achievement] });
                        await this.onSave();
                        this.render(); // Refresh
                    }).open();
                }));

        // Unlock categories header
        const unlockedHeader = contentEl.createDiv({ cls: 'qb-hub-section' });
        unlockedHeader.createEl('h3', { text: '✅ Unlocked' });

        const unlockedContainer = contentEl.createDiv({ cls: 'qb-hub-achievements' });
        const unlocked = sorted.filter(a => isUnlocked(a));
        if (unlocked.length === 0) {
            unlockedContainer.createEl('p', { text: 'No achievements unlocked yet.', cls: 'qb-hub-empty' });
        } else {
            unlocked.forEach(a => this.renderAchievementRow(unlockedContainer, a));
        }

        // Locked header
        const lockedHeader = contentEl.createDiv({ cls: 'qb-hub-section' });
        lockedHeader.createEl('h3', { text: '🔒 Locked' });

        const lockedContainer = contentEl.createDiv({ cls: 'qb-hub-achievements' });
        const locked = sorted.filter(a => !isUnlocked(a));
        if (locked.length === 0) {
            lockedContainer.createEl('p', { text: 'All achievements unlocked!', cls: 'qb-hub-empty' });
        } else {
            locked.forEach(a => this.renderAchievementRow(lockedContainer, a));
        }
    }



    private renderAchievementRow(container: HTMLElement, achievement: Achievement) {
        const row = container.createDiv({ cls: `qb-hub-row ${isUnlocked(achievement) ? 'unlocked' : 'locked'}` });

        // Emoji/badge
        row.createSpan({ text: achievement.emoji, cls: 'qb-hub-emoji' });

        // Info
        const info = row.createDiv({ cls: 'qb-hub-info' });
        info.createEl('strong', { text: achievement.name });
        info.createEl('p', { text: achievement.description, cls: 'qb-hub-desc' });

        // Trigger info
        const triggerInfo = this.getTriggerDescription(achievement);
        info.createEl('small', { text: triggerInfo, cls: 'qb-hub-trigger' });

        // Progress (if locked)
        if (!isUnlocked(achievement) && achievement.trigger.type !== 'manual') {
            const progress = getProgressPercent(achievement);
            const progressText = `Progress: ${achievement.progress || 0}/${achievement.trigger.target} (${progress}%)`;
            info.createEl('small', { text: progressText, cls: 'qb-hub-progress' });
        }

        // XP Bonus
        row.createSpan({ text: `+${achievement.xpBonus} XP`, cls: 'qb-hub-xp' });

        // Actions for custom achievements
        if (achievement.category === 'custom') {
            const actions = row.createDiv({ cls: 'qb-hub-actions' });

            // Edit button
            const editBtn = actions.createEl('button', { text: '✏️', cls: 'qb-hub-btn' });
            editBtn.title = 'Edit';
            editBtn.addEventListener('click', () => this.editAchievement(achievement));

            // Delete button
            const deleteBtn = actions.createEl('button', { text: '🗑️', cls: 'qb-hub-btn qb-hub-btn-danger' });
            deleteBtn.title = 'Delete';
            deleteBtn.addEventListener('click', () => this.deleteAchievement(achievement));

            // Manual unlock button (if locked and manual type)
            if (!isUnlocked(achievement)) {
                const unlockBtn = actions.createEl('button', { text: '🔓', cls: 'qb-hub-btn' });
                unlockBtn.title = 'Manually Unlock';
                unlockBtn.addEventListener('click', () => this.manualUnlock(achievement));
            }
        }
    }

    private getTriggerDescription(achievement: Achievement): string {
        const trigger = achievement.trigger;
        switch (trigger.type) {
            case 'level':
                return `Trigger: Reach level ${trigger.target}`;
            case 'quest_count':
                return `Trigger: Complete ${trigger.target} quests`;
            case 'category_count':
                return `Trigger: Complete ${trigger.target} ${trigger.category} quests`;
            case 'streak':
                return `Trigger: ${trigger.target}-day streak`;
            case 'manual':
                return 'Trigger: Manual unlock';
            default:
                return 'Unknown trigger';
        }
    }

    private async editAchievement(achievement: Achievement) {
        // Full edit modal with all fields
        const modal = new Modal(this.app);
        modal.titleEl.setText(`Edit: ${achievement.name}`);
        modal.contentEl.addClass('qb-edit-achievement-modal');

        let newName = achievement.name;
        let newDesc = achievement.description;
        let newEmoji = achievement.emoji;
        let newXP = achievement.xpBonus;
        let newTriggerType = achievement.trigger.type;
        let newTriggerTarget = achievement.trigger.target;
        let newTriggerCategory = achievement.trigger.category || '';

        new Setting(modal.contentEl)
            .setName('Name')
            .addText(text => text
                .setValue(newName)
                .onChange(v => newName = v));

        new Setting(modal.contentEl)
            .setName('Description')
            .addText(text => text
                .setValue(newDesc)
                .onChange(v => newDesc = v));

        new Setting(modal.contentEl)
            .setName('Emoji')
            .addText(text => text
                .setValue(newEmoji)
                .onChange(v => newEmoji = v));

        new Setting(modal.contentEl)
            .setName('XP Bonus')
            .addText(text => text
                .setValue(String(newXP))
                .onChange(v => newXP = parseInt(v) || 0));

        // Trigger Type dropdown
        const triggerSetting = new Setting(modal.contentEl)
            .setName('Trigger Type')
            .addDropdown(dropdown => dropdown
                .addOption('manual', 'Manual (unlock yourself)')
                .addOption('level', 'Reach Level')
                .addOption('quest_count', 'Complete N Quests')
                .addOption('category_count', 'Complete N in Category')
                .addOption('streak', 'Maintain Streak')
                .setValue(newTriggerType)
                .onChange(v => {
                    newTriggerType = v as any;
                    updateTriggerVisibility();
                }));

        // Trigger Target
        const targetSetting = new Setting(modal.contentEl)
            .setName('Target')
            .setDesc('Number to reach')
            .addText(text => text
                .setValue(String(newTriggerTarget))
                .onChange(v => newTriggerTarget = parseInt(v) || 1));

        // Trigger Category (for category_count)
        const categorySetting = new Setting(modal.contentEl)
            .setName('Category')
            .setDesc('Quest category to track (e.g., applications, general)')
            .addText(text => text
                .setValue(newTriggerCategory)
                .onChange(v => newTriggerCategory = v));

        const updateTriggerVisibility = () => {
            const showTarget = newTriggerType !== 'manual';
            const showCategory = newTriggerType === 'category_count';
            targetSetting.settingEl.style.display = showTarget ? '' : 'none';
            categorySetting.settingEl.style.display = showCategory ? '' : 'none';
        };
        updateTriggerVisibility();

        new Setting(modal.contentEl)
            .addButton(btn => btn
                .setButtonText('Save')
                .setCta()
                .onClick(async () => {
                    const achievements = useCharacterStore.getState().achievements;
                    const updated = achievements.map(a =>
                        a.id === achievement.id
                            ? {
                                ...a,
                                name: newName,
                                description: newDesc,
                                emoji: newEmoji,
                                xpBonus: newXP,
                                trigger: {
                                    type: newTriggerType,
                                    target: newTriggerTarget,
                                    category: newTriggerCategory || undefined,
                                }
                            }
                            : a
                    );
                    useCharacterStore.setState({ achievements: updated });
                    await this.onSave();
                    modal.close();
                    this.render();
                    new Notice('Achievement updated!');
                }));

        modal.open();
    }

    private async deleteAchievement(achievement: Achievement) {
        if (!confirm(`Delete "${achievement.name}"?`)) return;

        const achievements = useCharacterStore.getState().achievements;
        const updated = achievements.filter(a => a.id !== achievement.id);
        useCharacterStore.setState({ achievements: updated });
        await this.onSave();
        this.render();
        new Notice('Achievement deleted.');
    }

    private async manualUnlock(achievement: Achievement) {
        const achievements = useCharacterStore.getState().achievements;
        const character = useCharacterStore.getState().character;
        if (!character) return;

        // Capture old XP for level-up check
        const oldXP = character.isTrainingMode ? character.trainingXP : character.totalXP;
        const isTrainingMode = character.isTrainingMode;

        const updated = achievements.map(a =>
            a.id === achievement.id
                ? { ...a, unlockedAt: new Date().toISOString() }
                : a
        );
        useCharacterStore.setState({ achievements: updated });

        // Award XP
        const addXP = useCharacterStore.getState().addXP;
        addXP(achievement.xpBonus);

        // Check for level-up
        const newChar = useCharacterStore.getState().character;
        if (newChar) {
            const newXP = newChar.isTrainingMode ? newChar.trainingXP : newChar.totalXP;
            const { checkLevelUp } = await import('../services/XPSystem');
            const result = checkLevelUp(oldXP, newXP, isTrainingMode);

            if (result.didLevelUp) {
                // Phase 7: Check for skill unlocks (non-training only)
                let unlockedSkills: import('../models/Skill').Skill[] = [];
                if (!isTrainingMode) {
                    const { checkAndUnlockSkills } = await import('../services/SkillService');
                    const skillResult = checkAndUnlockSkills(
                        newChar.class,
                        result.oldLevel,
                        result.newLevel,
                        newChar.skills?.unlocked ?? []
                    );
                    if (skillResult.newlyUnlocked.length > 0) {
                        useCharacterStore.getState().unlockSkills(
                            skillResult.newlyUnlocked.map(s => s.id)
                        );
                        unlockedSkills = skillResult.newlyUnlocked;
                    }
                }

                // Show level-up modal
                const { LevelUpModal } = await import('./LevelUpModal');
                const modal = new LevelUpModal(
                    this.app,
                    newChar.class,
                    result.newLevel,
                    result.tierChanged,
                    isTrainingMode,
                    () => {
                        useCharacterStore.getState().graduate();
                        this.onSave();
                    },
                    unlockedSkills
                );
                modal.open();
            }
        }

        await this.onSave();
        this.render();
        new Notice(`🏆 "${achievement.name}" unlocked! +${achievement.xpBonus} XP`);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
