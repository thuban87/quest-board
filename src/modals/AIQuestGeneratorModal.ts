/**
 * AI Quest Generator Modal
 * 
 * Input modal for AI-powered quest generation.
 * Collects user input and sends to AIQuestService.
 */

import { App, Modal, Setting, TFile, TFolder, Notice, ToggleComponent } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { QuestStatus, QuestPriority } from '../models/QuestStatus';
import { loadAllQuests } from '../services/QuestService';
import { aiQuestService, AIQuestInput } from '../services/AIQuestService';
import { AIQuestPreviewModal } from './AIQuestPreviewModal';

export class AIQuestGeneratorModal extends Modal {
    private plugin: QuestBoardPlugin;
    private onSave: () => void;

    // Form state
    private formData: AIQuestInput = {
        questName: '',
        description: '',
        tasks: '',
        objectives: '',
        questType: 'main',
        category: '',
        status: QuestStatus.AVAILABLE,
        priority: QuestPriority.MEDIUM,
    };

    private existingCategories: string[] = [];
    private availableTypes: string[] = [];
    private skipPreview: boolean = false;

    constructor(app: App, plugin: QuestBoardPlugin, onSave?: () => void) {
        super(app);
        this.plugin = plugin;
        this.onSave = onSave || (() => { });

        // Use setting for default skip-preview behavior
        this.skipPreview = plugin.settings.aiQuestSkipPreview ?? false;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.addClass('qb-ai-generator-modal');
        contentEl.empty();

        // Load existing data
        await this.loadExistingCategories();
        await this.loadAvailableTypes();

        // Initialize service
        aiQuestService.updateSettings(this.plugin.settings);

        // Title
        contentEl.createEl('h2', { text: '🤖 AI Quest Generator' });
        contentEl.createEl('p', {
            text: 'Transform your tasks into epic quests!',
            cls: 'qb-modal-subtitle'
        });

        // Quest Name (required)
        new Setting(contentEl)
            .setName('Quest Name')
            .setDesc('What is this quest about?')
            .addText(text => {
                text.setPlaceholder('e.g., Clean the Kitchen, Finish Project Report...')
                    .onChange(value => this.formData.questName = value);
                text.inputEl.addClass('qb-input-wide');
            });

        // Description
        new Setting(contentEl)
            .setName('Description / Context')
            .setDesc('Optional context to help AI understand the quest')
            .addTextArea(textarea => {
                textarea.setPlaceholder('Any details about what you want to accomplish...')
                    .onChange(value => this.formData.description = value);
                textarea.inputEl.rows = 2;
                textarea.inputEl.addClass('qb-textarea');
            });

        // Tasks
        new Setting(contentEl)
            .setName('Tasks')
            .setDesc('List your tasks (one per line or bullet points)')
            .addTextArea(textarea => {
                textarea.setPlaceholder('- Task 1\n- Task 2\n- Task 3\n\nOr leave empty for AI to suggest tasks!')
                    .onChange(value => this.formData.tasks = value);
                textarea.inputEl.rows = 5;
                textarea.inputEl.addClass('qb-textarea');
            });

        // Objectives
        new Setting(contentEl)
            .setName('Objectives')
            .setDesc('Optional: What do you want to achieve?')
            .addTextArea(textarea => {
                textarea.setPlaceholder('Your goals for this quest...')
                    .onChange(value => this.formData.objectives = value);
                textarea.inputEl.rows = 2;
                textarea.inputEl.addClass('qb-textarea');
            });

        // Quest Type dropdown
        new Setting(contentEl)
            .setName('Quest Type')
            .setDesc('Which folder to save the quest in')
            .addDropdown(dropdown => {
                for (const folderName of this.availableTypes) {
                    const emoji = this.getTypeEmoji(folderName);
                    dropdown.addOption(folderName.toLowerCase(), `${emoji} ${this.titleCase(folderName)}`);
                }
                dropdown
                    .setValue(this.formData.questType)
                    .onChange(value => this.formData.questType = value);
            });

        // Category with autocomplete
        const categorySetting = new Setting(contentEl)
            .setName('Category')
            .setDesc('Leave empty for AI to decide based on content');

        const categoryContainer = categorySetting.controlEl.createDiv({ cls: 'qb-category-container' });

        const categoryDropdown = document.createElement('select');
        categoryDropdown.addClass('dropdown');

        // Add "Let AI Decide" option first
        const aiOption = document.createElement('option');
        aiOption.value = '';
        aiOption.text = '🤖 Let AI Decide';
        categoryDropdown.appendChild(aiOption);

        // Add "Add New" option
        const addNewOption = document.createElement('option');
        addNewOption.value = '__add_new__';
        addNewOption.text = '➕ Add New...';
        categoryDropdown.appendChild(addNewOption);

        // Add existing categories
        for (const cat of this.existingCategories) {
            const option = document.createElement('option');
            option.value = cat;
            option.text = cat.charAt(0).toUpperCase() + cat.slice(1);
            categoryDropdown.appendChild(option);
        }

        categoryContainer.appendChild(categoryDropdown);

        // Hidden input for new category
        const newCategoryInput = document.createElement('input');
        newCategoryInput.type = 'text';
        newCategoryInput.placeholder = 'Enter new category...';
        newCategoryInput.addClass('qb-new-category-input');
        newCategoryInput.style.display = 'none';
        categoryContainer.appendChild(newCategoryInput);

        categoryDropdown.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value;
            if (value === '__add_new__') {
                newCategoryInput.style.display = 'block';
                newCategoryInput.focus();
                this.formData.category = '';
            } else {
                newCategoryInput.style.display = 'none';
                this.formData.category = value;
            }
        });

        newCategoryInput.addEventListener('input', (e) => {
            this.formData.category = (e.target as HTMLInputElement).value;
        });

        // Status dropdown
        new Setting(contentEl)
            .setName('Status')
            .addDropdown(dropdown => {
                dropdown
                    .addOption(QuestStatus.AVAILABLE, '📋 Available')
                    .addOption(QuestStatus.IN_PROGRESS, '🔄 In Progress')
                    .addOption(QuestStatus.ACTIVE, '⚡ Active')
                    .setValue(this.formData.status)
                    .onChange(value => this.formData.status = value as QuestStatus);
            });

        // Priority dropdown
        new Setting(contentEl)
            .setName('Priority')
            .addDropdown(dropdown => {
                dropdown
                    .addOption(QuestPriority.LOW, '🟢 Low')
                    .addOption(QuestPriority.MEDIUM, '🟡 Medium')
                    .addOption(QuestPriority.HIGH, '🔴 High')
                    .addOption(QuestPriority.CRITICAL, '🔥 Critical')
                    .setValue(this.formData.priority)
                    .onChange(value => this.formData.priority = value as QuestPriority);
            });

        // Skip Preview toggle
        new Setting(contentEl)
            .setName('Skip Preview')
            .setDesc('Save quest directly without preview/edit step')
            .addToggle(toggle => {
                toggle
                    .setValue(this.skipPreview)
                    .onChange(value => this.skipPreview = value);
            });

        // Action buttons
        const buttonContainer = contentEl.createDiv({ cls: 'qb-modal-buttons' });

        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());

        const generateBtn = buttonContainer.createEl('button', {
            text: '🎲 Generate Quest',
            cls: 'mod-cta'
        });
        generateBtn.addEventListener('click', () => this.handleGenerate());
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private async loadExistingCategories() {
        try {
            const result = await loadAllQuests(this.app.vault, this.plugin.settings.storageFolder);
            const categorySet = new Set<string>();
            result.quests.forEach(quest => {
                if (quest.category) {
                    categorySet.add(quest.category.toLowerCase());
                }
            });
            this.existingCategories = Array.from(categorySet).sort();
        } catch (e) {
            // Ignore errors
        }
    }

    private async loadAvailableTypes() {
        const questsPath = `${this.plugin.settings.storageFolder}/quests`;
        const folder = this.app.vault.getAbstractFileByPath(questsPath);

        if (folder instanceof TFolder) {
            for (const child of folder.children) {
                if (child instanceof TFolder) {
                    const folderName = child.name.toLowerCase();
                    if (folderName !== 'archive' && folderName !== 'ai-generated') {
                        this.availableTypes.push(child.name);
                    }
                }
            }
        }

        this.availableTypes.sort((a, b) => {
            if (a.toLowerCase() === 'main') return -1;
            if (b.toLowerCase() === 'main') return 1;
            return a.localeCompare(b);
        });

        if (this.availableTypes.length === 0) {
            this.availableTypes = ['main', 'side', 'training'];
        }

        this.formData.questType = this.availableTypes[0].toLowerCase();
    }

    private getTypeEmoji(typeName: string): string {
        const lower = typeName.toLowerCase();
        const emojiMap: Record<string, string> = {
            'main': '🏆',
            'side': '📜',
            'training': '🎓',
            'recurring': '🔁',
            'daily': '☀️',
            'weekly': '📅',
        };
        return emojiMap[lower] || '📁';
    }

    private titleCase(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    private async handleGenerate() {
        // Validate
        if (!this.formData.questName.trim()) {
            new Notice('❌ Quest name is required!');
            return;
        }

        // Show loading state
        new Notice('🤖 Generating quest...');

        const result = await aiQuestService.generateQuest(this.formData, this.existingCategories);

        if (!result.success || !result.markdown) {
            // Show error with fallback option
            new Notice(`❌ ${result.error || 'Generation failed'}`);

            // Could add "Continue Manually" button here in future
            return;
        }

        if (this.skipPreview) {
            // Save directly
            const saved = await this.saveQuestMarkdown(result.markdown);
            if (saved) {
                new Notice('✅ Quest created!');
                this.onSave();
                this.close();
            }
        } else {
            // Open preview modal
            this.close();
            new AIQuestPreviewModal(
                this.app,
                this.plugin,
                result.markdown,
                this.formData.questType,
                () => this.onSave()
            ).open();
        }
    }

    /**
     * Save markdown directly (skip preview mode)
     */
    private async saveQuestMarkdown(markdown: string): Promise<boolean> {
        try {
            // Extract questId from markdown frontmatter
            const idMatch = markdown.match(/questId:\s*"([^"]+)"/);
            const questId = idMatch ? idMatch[1] : `quest-${Date.now()}`;

            const folderPath = `${this.plugin.settings.storageFolder}/quests/${this.formData.questType}`;
            const filePath = `${folderPath}/${questId}.md`;

            // Ensure folder exists
            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (!folder) {
                await this.app.vault.createFolder(folderPath);
            }

            // Update linkedTaskFile in markdown to point to self
            const updatedMarkdown = markdown.replace(
                /linkedTaskFile:\s*"[^"]*"/,
                `linkedTaskFile: "${filePath}"`
            );

            // Create file
            await this.app.vault.create(filePath, updatedMarkdown);
            return true;

        } catch (error) {
            console.error('[AIQuestGeneratorModal] Failed to save:', error);
            new Notice('❌ Failed to save quest file');
            return false;
        }
    }
}
