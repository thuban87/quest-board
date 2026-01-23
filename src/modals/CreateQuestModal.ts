/**
 * Create Quest Modal
 * 
 * Modal for creating new quest files with frontmatter and body sections.
 */

import { App, Modal, Setting, TFile, TFolder, Notice, TextComponent, DropdownComponent, TextAreaComponent, FuzzySuggestModal, FuzzyMatch } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { QuestPriority, QuestDifficulty } from '../models/QuestStatus';
import { ManualQuest, QUEST_SCHEMA_VERSION } from '../models/Quest';
import { saveManualQuest, loadAllQuests } from '../services/QuestService';

/**
 * File Suggest Modal for selecting a file from the vault
 */
class FileSuggestModal extends FuzzySuggestModal<TFile> {
    private onSelect: (file: TFile) => void;

    constructor(app: App, onSelect: (file: TFile) => void) {
        super(app);
        this.onSelect = onSelect;
        this.setPlaceholder('Search for a file...');
    }

    getItems(): TFile[] {
        return this.app.vault.getMarkdownFiles();
    }

    getItemText(item: TFile): string {
        return item.path;
    }

    onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
        this.onSelect(item);
    }
}

interface QuestFormData {
    questName: string;
    questType: string;  // Dynamic folder name (Main, Side, Training, Recurring, etc.)
    category: string;
    priority: QuestPriority;
    linkedTaskFile: string;
    xpPerTask: number;
    completionBonus: number;
    dueDate: string;
    estimatedTime: string;
    difficulty: QuestDifficulty;
    description: string;
    objectives: string;
    rewards: string;
}

export class CreateQuestModal extends Modal {
    private plugin: QuestBoardPlugin;
    private formData: QuestFormData;
    private existingCategories: Set<string> = new Set();
    private availableTypes: string[] = [];  // Dynamic from folders
    private onSave: () => void;

    constructor(app: App, plugin: QuestBoardPlugin, onSave?: () => void) {
        super(app);
        this.plugin = plugin;
        this.onSave = onSave || (() => { });

        // Initialize form with defaults
        this.formData = {
            questName: '',
            questType: 'main',  // Default, will be updated from folders
            category: '',
            priority: QuestPriority.MEDIUM,
            linkedTaskFile: '',
            xpPerTask: 5,
            completionBonus: 30,
            dueDate: '',
            estimatedTime: '',
            difficulty: QuestDifficulty.MEDIUM,
            description: '',
            objectives: '',
            rewards: '',
        };
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.addClass('qb-create-modal');
        contentEl.empty();

        // Load existing categories for autocomplete
        await this.loadExistingCategories();

        // Load available quest type folders
        await this.loadAvailableTypes();

        // Title
        contentEl.createEl('h2', { text: '⚔️ Create New Quest' });

        // Quest Name (required)
        new Setting(contentEl)
            .setName('Quest Name')
            .setDesc('Display name for your quest')
            .addText(text => {
                text.setPlaceholder('Enter quest name...')
                    .onChange(value => this.formData.questName = value);
                text.inputEl.addClass('qb-input-wide');
            });

        // Quest Type (dynamic from folders)
        new Setting(contentEl)
            .setName('Quest Type')
            .setDesc('Select folder to save quest in')
            .addDropdown(dropdown => {
                // Add options from scanned folders
                for (const folderName of this.availableTypes) {
                    const emoji = this.getTypeEmoji(folderName);
                    dropdown.addOption(folderName.toLowerCase(), `${emoji} ${this.titleCase(folderName)}`);
                }
                dropdown
                    .setValue(this.formData.questType)
                    .onChange(value => {
                        this.formData.questType = value;
                    });
            });

        // Category dropdown with "Add New" option
        const categorySetting = new Setting(contentEl)
            .setName('Category');

        // Create a container for dropdown + text input
        const categoryContainer = categorySetting.controlEl.createDiv({ cls: 'qb-category-container' });

        // Category dropdown
        const categoryDropdown = document.createElement('select');
        categoryDropdown.addClass('dropdown');

        // Add "Add New" option first
        const addNewOption = document.createElement('option');
        addNewOption.value = '__add_new__';
        addNewOption.text = '➕ Add New...';
        categoryDropdown.appendChild(addNewOption);

        // Add existing categories
        const categoriesArray = Array.from(this.existingCategories).sort();
        categoriesArray.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.text = cat.charAt(0).toUpperCase() + cat.slice(1);
            categoryDropdown.appendChild(option);
        });

        // Set default if we have categories
        if (categoriesArray.length > 0) {
            categoryDropdown.value = categoriesArray[0];
            this.formData.category = categoriesArray[0];
        }

        categoryContainer.appendChild(categoryDropdown);

        // Hidden text input for new category
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

        // Priority
        new Setting(contentEl)
            .setName('Priority')
            .addDropdown(dropdown => {
                dropdown
                    .addOption(QuestPriority.LOW, '🟢 Low')
                    .addOption(QuestPriority.MEDIUM, '🟡 Medium')
                    .addOption(QuestPriority.HIGH, '🔴 High')
                    .setValue(this.formData.priority)
                    .onChange(value => this.formData.priority = value as QuestPriority);
            });

        // Linked Task File with file search button
        let linkedFileDisplay: HTMLInputElement;
        new Setting(contentEl)
            .setName('Linked Task File')
            .setDesc('File containing tasks (leave empty to link to self)')
            .addText(text => {
                linkedFileDisplay = text.inputEl;
                text.setPlaceholder('Click Browse or leave empty...')
                    .setValue(this.formData.linkedTaskFile)
                    .onChange(value => this.formData.linkedTaskFile = value);
                text.inputEl.addClass('qb-input-wide');
            })
            .addButton(btn => {
                btn.setButtonText('Browse')
                    .onClick(() => {
                        new FileSuggestModal(this.app, (file) => {
                            this.formData.linkedTaskFile = file.path;
                            linkedFileDisplay.value = file.path;
                        }).open();
                    });
            });

        // XP Settings
        const xpContainer = contentEl.createDiv({ cls: 'qb-xp-row' });

        new Setting(xpContainer)
            .setName('XP per Task')
            .addText(text => {
                text.setValue('5')
                    .onChange(value => this.formData.xpPerTask = parseInt(value) || 5);
                text.inputEl.type = 'number';
                text.inputEl.addClass('qb-input-narrow');
            });

        new Setting(xpContainer)
            .setName('Completion Bonus')
            .addText(text => {
                text.setValue('30')
                    .onChange(value => this.formData.completionBonus = parseInt(value) || 30);
                text.inputEl.type = 'number';
                text.inputEl.addClass('qb-input-narrow');
            });

        // Optional fields section
        contentEl.createEl('h3', { text: 'Optional Details' });

        // Due Date
        new Setting(contentEl)
            .setName('Due Date')
            .addText(text => {
                text.setPlaceholder('YYYY-MM-DD')
                    .onChange(value => this.formData.dueDate = value);
                text.inputEl.type = 'date';
            });

        // Estimated Time
        new Setting(contentEl)
            .setName('Estimated Time')
            .addText(text => {
                text.setPlaceholder('e.g., 2 hours, 1 week')
                    .onChange(value => this.formData.estimatedTime = value);
            });

        // Difficulty
        new Setting(contentEl)
            .setName('Difficulty')
            .addDropdown(dropdown => {
                dropdown
                    .addOption(QuestDifficulty.EASY, '⭐ Easy')
                    .addOption(QuestDifficulty.MEDIUM, '⭐⭐ Medium')
                    .addOption(QuestDifficulty.HARD, '⭐⭐⭐ Hard')
                    .addOption(QuestDifficulty.EPIC, '💀 Epic')
                    .setValue(this.formData.difficulty)
                    .onChange(value => this.formData.difficulty = value as QuestDifficulty);
            });

        // Body Sections
        contentEl.createEl('h3', { text: 'Quest Details' });

        // Description
        new Setting(contentEl)
            .setName('Description')
            .setDesc('Brief summary of what this quest is about')
            .addTextArea(textarea => {
                textarea.setPlaceholder('Describe your quest...')
                    .onChange(value => this.formData.description = value);
                textarea.inputEl.rows = 3;
                textarea.inputEl.addClass('qb-textarea');
            });

        // Objectives
        new Setting(contentEl)
            .setName('Objectives')
            .setDesc('What you want to accomplish')
            .addTextArea(textarea => {
                textarea.setPlaceholder('List your objectives...')
                    .onChange(value => this.formData.objectives = value);
                textarea.inputEl.rows = 3;
                textarea.inputEl.addClass('qb-textarea');
            });

        // Rewards
        new Setting(contentEl)
            .setName('Rewards')
            .setDesc('What you get for completing this quest')
            .addTextArea(textarea => {
                textarea.setPlaceholder('List rewards (optional)...')
                    .onChange(value => this.formData.rewards = value);
                textarea.inputEl.rows = 2;
                textarea.inputEl.addClass('qb-textarea');
            });

        // Action buttons
        const buttonContainer = contentEl.createDiv({ cls: 'qb-modal-buttons' });

        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());

        const createBtn = buttonContainer.createEl('button', {
            text: '⚔️ Create Quest',
            cls: 'mod-cta'
        });
        createBtn.addEventListener('click', () => this.handleCreate());
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private async loadExistingCategories() {
        try {
            const result = await loadAllQuests(this.app.vault, this.plugin.settings.storageFolder);
            result.quests.forEach(quest => {
                if (quest.category) {
                    this.existingCategories.add(quest.category.toLowerCase());
                }
            });
        } catch (e) {
            // Ignore errors loading categories
        }
    }

    /**
     * Scan the quests folder for subfolders to use as type options
     */
    private async loadAvailableTypes() {
        const questsPath = `${this.plugin.settings.storageFolder}/quests`;
        const folder = this.app.vault.getAbstractFileByPath(questsPath);

        if (folder instanceof TFolder) {
            for (const child of folder.children) {
                if (child instanceof TFolder) {
                    const folderName = child.name.toLowerCase();
                    // Exclude archive and ai-generated from the dropdown
                    if (folderName !== 'archive' && folderName !== 'ai-generated') {
                        this.availableTypes.push(child.name);
                    }
                }
            }
        }

        // Sort alphabetically, but put 'main' first if present
        this.availableTypes.sort((a, b) => {
            if (a.toLowerCase() === 'main') return -1;
            if (b.toLowerCase() === 'main') return 1;
            return a.localeCompare(b);
        });

        // If no folders found, add defaults
        if (this.availableTypes.length === 0) {
            this.availableTypes = ['main', 'side', 'training'];
        }

        // Set default formData.questType to first available
        this.formData.questType = this.availableTypes[0].toLowerCase();
    }

    /**
     * Get emoji for a quest type folder name
     */
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

    /**
     * Title case a string (capitalize first letter of each word)
     */
    private titleCase(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    private async handleCreate() {
        // Validate required fields
        if (!this.formData.questName.trim()) {
            new Notice('❌ Quest name is required!');
            return;
        }

        // Generate questId from name
        const questId = this.formData.questName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Use questType directly as folder name (lowercase)
        const subFolder = `quests/${this.formData.questType.toLowerCase()}`;

        const questFilePath = `${this.plugin.settings.storageFolder}/${subFolder}/${questId}.md`;
        const linkedTaskFile = this.formData.linkedTaskFile.trim() || questFilePath;

        // Build the quest object
        const quest: ManualQuest = {
            schemaVersion: QUEST_SCHEMA_VERSION,
            questId,
            questName: this.formData.questName.trim(),
            questType: this.formData.questType,
            category: this.formData.category.trim() || 'general',
            status: 'available' as any,
            priority: this.formData.priority,
            tags: [],
            createdDate: new Date().toISOString(),
            completedDate: null,
            timeline: [{ date: new Date().toISOString(), event: 'Quest created' }],
            notes: '',
            linkedTaskFile,
            xpPerTask: this.formData.xpPerTask,
            completionBonus: this.formData.completionBonus,
            visibleTasks: 4,
            milestones: [],
        };

        // Save with body sections
        const success = await this.saveQuestWithBody(quest);

        if (success) {
            new Notice(`✅ Quest "${quest.questName}" created!`);
            this.onSave();
            this.close();
        } else {
            new Notice('❌ Failed to create quest. Check console for details.');
        }
    }

    private async saveQuestWithBody(quest: ManualQuest): Promise<boolean> {
        try {
            // Use questType directly as folder name (lowercase)
            const subFolder = `quests/${quest.questType.toLowerCase()}`;

            const folderPath = `${this.plugin.settings.storageFolder}/${subFolder}`;
            const filePath = `${folderPath}/${quest.questId}.md`;

            // Ensure folder exists
            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (!folder) {
                await this.app.vault.createFolder(folderPath);
            }

            // Build frontmatter
            const frontmatterLines = [
                '---',
                `schemaVersion: ${quest.schemaVersion}`,
                `questId: "${quest.questId}"`,
                `questName: "${quest.questName}"`,
                `questType: ${quest.questType}`,
                `category: "${quest.category}"`,
                `status: ${quest.status}`,
                `priority: ${quest.priority}`,
                `linkedTaskFile: "${quest.linkedTaskFile}"`,
                `xpPerTask: ${quest.xpPerTask}`,
                `completionBonus: ${quest.completionBonus}`,
                `visibleTasks: ${quest.visibleTasks}`,
                `createdDate: "${quest.createdDate}"`,
            ];

            // Add optional fields
            if (this.formData.dueDate) {
                frontmatterLines.push(`dueDate: "${this.formData.dueDate}"`);
            }
            if (this.formData.estimatedTime) {
                frontmatterLines.push(`estimatedTime: "${this.formData.estimatedTime}"`);
            }
            if (this.formData.difficulty !== QuestDifficulty.MEDIUM) {
                frontmatterLines.push(`difficulty: ${this.formData.difficulty}`);
            }

            frontmatterLines.push('---');

            // Build body
            const bodyLines = [
                '',
                `# ${quest.questName}`,
                '',
            ];

            if (this.formData.description) {
                bodyLines.push('## Description', '', this.formData.description, '');
            }

            if (this.formData.objectives) {
                bodyLines.push('## Objectives', '', this.formData.objectives, '');
            }

            if (this.formData.rewards) {
                bodyLines.push('## Rewards', '', this.formData.rewards, '');
            }

            // If self-linking, add Tasks section
            if (quest.linkedTaskFile === filePath) {
                bodyLines.push('## Tasks', '', '- [ ] First task', '- [ ] Second task', '');
            }

            const content = frontmatterLines.join('\n') + bodyLines.join('\n');

            // Create or overwrite file
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, content);
            } else {
                await this.app.vault.create(filePath, content);
            }

            return true;
        } catch (error) {
            console.error('[CreateQuestModal] Failed to save quest:', error);
            return false;
        }
    }
}
