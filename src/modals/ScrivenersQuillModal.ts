/**
 * Scrivener's Quill Modal (Template Editor)
 * 
 * Full-featured template editor with all frontmatter fields,
 * body content editing, placeholder management, and RPG theming.
 * Serves as both the template builder and the "Use Template" editor.
 */

import { App, Modal, Notice, Setting, TFile, TFolder, TextAreaComponent } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { ParsedTemplate } from '../services/TemplateService';
import { TemplatePreviewModal, TemplatePreviewData, PreviewSection } from './TemplatePreviewModal';
import { getTemplateStatsService } from '../services/TemplateStatsService';
import { ArchiveMode, QuestNamingMode, WatchedFolderConfig } from '../services/FolderWatchService';
import { ColumnConfigService } from '../services/ColumnConfigService';
import { detectDailyNotesConfig } from '../utils/dailyNotesDetector';
import { QuestPriority } from '../models/QuestStatus';

/**
 * Local placeholder info for the template editor
 */
interface EditorPlaceholder {
    name: string;
    isAuto: boolean;
}

/**
 * The Scrivener's Quill - Template editor modal
 */
export class ScrivenersQuillModal extends Modal {
    private plugin: QuestBoardPlugin;
    private existingTemplate: ParsedTemplate | undefined;
    private isEditing: boolean;

    // Form state - core fields
    private templateName: string = '';
    private tagline: string = '';
    private templateType: string = 'standard';  // standard, recurring, daily-quest, watched-folder
    private questType: string = 'side';          // main, side, training
    private category: string = '';
    private priority: string = 'medium';
    private status: string = 'available';
    private xpPerTask: number = 10;
    private completionBonus: number = 50;
    private visibleTasks: number = 5;
    private tags: string = '';
    private linkedTaskFile: string = '';
    private bodyContent: string = '';
    private placeholders: EditorPlaceholder[] = [];

    // Recurrence state
    private recurrencePattern: string = 'daily';
    private customDays: string[] = [];
    private weeklyDay: string = 'monday';

    // Folder watcher state (for daily-quest and watched-folder types)
    private watchFolder: string = '';
    private namingMode: QuestNamingMode = 'filename';
    private customNamingPattern: string = '{{filename}} Quest';
    private archiveMode: ArchiveMode = 'none';
    private archiveDurationHours: number = 24;
    private archiveTime: string = '01:00';
    private archivePath: string = '';

    // Dynamic quest type options (from folder scanning)
    private availableTypes: string[] = [];

    constructor(app: App, plugin: QuestBoardPlugin, existingTemplate?: ParsedTemplate) {
        super(app);
        this.plugin = plugin;
        this.existingTemplate = existingTemplate;
        this.isEditing = !!existingTemplate;

        // Pre-populate if editing
        if (existingTemplate) {
            this.templateName = existingTemplate.name.replace(/-template$/i, '').trim();
            this.tagline = existingTemplate.tagline || '';

            // Derive templateType and questType from the stored questType field
            const rawType = existingTemplate.questType || 'side';
            const specialTemplateTypes = ['recurring', 'daily-quest', 'watched-folder'];
            if (specialTemplateTypes.includes(rawType)) {
                this.templateType = rawType;
                this.questType = 'side';  // Default quest type for special templates
            } else {
                this.templateType = 'standard';
                this.questType = rawType; // main, side, training
            }

            this.category = existingTemplate.category || '';
            this.priority = existingTemplate.priority || 'medium';
            this.status = existingTemplate.status || 'available';
            this.xpPerTask = existingTemplate.xpPerTask ?? 10;
            this.completionBonus = existingTemplate.completionBonus ?? 50;
            this.visibleTasks = existingTemplate.visibleTasks ?? 5;
            this.tags = existingTemplate.tags?.join(', ') || '';
            this.linkedTaskFile = existingTemplate.linkedTaskFile || '';

            // Map existing placeholders to our local format
            this.placeholders = existingTemplate.placeholders.map(p => ({
                name: p.name,
                isAuto: p.isAutoDate || p.isOutputPath || p.isSlug
            }));

            // Load folder watcher fields for daily-quest and watched-folder types
            if (existingTemplate.watchFolder !== undefined) {
                this.watchFolder = existingTemplate.watchFolder;
            }
            if (existingTemplate.namingMode !== undefined) {
                this.namingMode = existingTemplate.namingMode;
            }
            if (existingTemplate.namingPattern !== undefined) {
                this.customNamingPattern = existingTemplate.namingPattern;
            }
            if (existingTemplate.archiveMode !== undefined) {
                this.archiveMode = existingTemplate.archiveMode;
            }
            if (existingTemplate.archiveDurationHours !== undefined) {
                this.archiveDurationHours = existingTemplate.archiveDurationHours;
            }
            if (existingTemplate.archiveTime !== undefined) {
                this.archiveTime = existingTemplate.archiveTime;
            }
            if (existingTemplate.archivePath !== undefined) {
                this.archivePath = existingTemplate.archivePath;
            }
        }
    }

    async onOpen(): Promise<void> {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        modalEl.addClass('qb-scrivenersquill-modal');
        contentEl.addClass('qb-scrivenersquill-content-el');

        // Load available quest types from folder structure
        await this.loadAvailableTypes();

        // Header
        const title = this.isEditing ? '📝 Revise the Contract' : '🪶 Draft New Scroll';
        contentEl.createEl('h2', { text: title });

        // Full-width form container (no preview pane)
        const formContainer = contentEl.createDiv({ cls: 'qb-scrivenersquill-form' });

        // === Section 1: Identity ===
        const identitySection = formContainer.createDiv({ cls: 'qb-scrivenersquill-section' });
        identitySection.createEl('h4', { text: '✒️ Scroll Identity' });

        new Setting(identitySection)
            .setName('Template Name')
            .setDesc('Name for this quest template')
            .addText(text => text
                .setPlaceholder('My Quest Template')
                .setValue(this.templateName)
                .onChange(value => {
                    this.templateName = value;
                }));

        new Setting(identitySection)
            .setName('Tagline')
            .setDesc('Short description of what this template is for')
            .addText(text => text
                .setPlaceholder('Weekly workout routine & physical training')
                .setValue(this.tagline)
                .onChange(value => {
                    this.tagline = value;
                }));

        new Setting(identitySection)
            .setName('Quest Name')
            .setDesc('Name pattern for quests created from this template (use {{placeholders}})')
            .addText(text => text
                .setPlaceholder('🔧 Forge Enhancement: {{plugin}}')
                .setValue(this.getQuestNameFromContent())
                .onChange(value => {
                    this.setQuestNameInContent(value);
                }));

        // === Section 2: Quest Configuration ===
        const configSection = formContainer.createDiv({ cls: 'qb-scrivenersquill-section' });
        configSection.createEl('h4', { text: '⚔️ Quest Configuration' });

        // Container for recurrence options (will be shown/hidden)
        const recurrenceContainer = formContainer.createDiv({ cls: 'qb-scrivenersquill-section qb-recurrence-section' });
        recurrenceContainer.style.display = this.templateType === 'recurring' ? '' : 'none';

        // Container for folder watcher options (daily-quest and watched-folder)
        const folderWatchContainer = formContainer.createDiv({ cls: 'qb-scrivenersquill-section qb-folder-watch-section' });
        folderWatchContainer.style.display = ['daily-quest', 'watched-folder'].includes(this.templateType) ? '' : 'none';

        // Template Type — controls template behavior
        new Setting(configSection)
            .setName('Template Type')
            .setDesc('How this template behaves (standard, recurring, folder watcher, etc.)')
            .addDropdown(dropdown => dropdown
                .addOption('standard', '📜 Standard Template')
                .addOption('recurring', '🔄 Recurring Quest')
                .addOption('daily-quest', '📓 Daily Note Quest')
                .addOption('watched-folder', '📂 Watched Folder')
                .setValue(this.templateType)
                .onChange(value => {
                    this.templateType = value;
                    recurrenceContainer.style.display = value === 'recurring' ? '' : 'none';
                    folderWatchContainer.style.display = ['daily-quest', 'watched-folder'].includes(value) ? '' : 'none';
                    if (value === 'daily-quest' && !this.watchFolder) {
                        const config = detectDailyNotesConfig(this.app);
                        this.watchFolder = config.folder;
                        this.updateFolderWatchUI(folderWatchContainer);
                    }
                }));

        // Quest Type — dynamically populated from quest subfolders
        new Setting(configSection)
            .setName('Quest Type')
            .setDesc('The type of quest this template creates (based on quest folders)')
            .addDropdown(dropdown => {
                for (const folderName of this.availableTypes) {
                    const emoji = this.getTypeEmoji(folderName);
                    dropdown.addOption(folderName.toLowerCase(), `${emoji} ${this.titleCase(folderName)}`);
                }
                dropdown.setValue(this.questType)
                    .onChange(value => {
                        this.questType = value;
                    });
            });

        new Setting(configSection)
            .setName('Category')
            .setDesc('Default category for quests created from this template')
            .addText(text => {
                text.setPlaceholder('work, health, projects...')
                    .setValue(this.category)
                    .onChange(value => {
                        this.category = value;
                    });

                // Add category suggestions from known categories
                const knownCategories = this.plugin.settings.knownCategories || [];
                if (knownCategories.length > 0) {
                    text.inputEl.setAttribute('list', 'qb-category-suggestions');
                    const datalist = document.createElement('datalist');
                    datalist.id = 'qb-category-suggestions';
                    knownCategories.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat;
                        datalist.appendChild(option);
                    });
                    configSection.appendChild(datalist);
                }
            });

        new Setting(configSection)
            .setName('Priority')
            .setDesc('Default priority for quests created from this template')
            .addDropdown(dropdown => dropdown
                .addOption('low', '🟢 Low')
                .addOption('medium', '🟡 Medium')
                .addOption('high', '🔴 High')
                .setValue(this.priority)
                .onChange(value => {
                    this.priority = value;
                }));

        // Status — populated from dynamic custom kanban columns
        const columnService = new ColumnConfigService(this.plugin.settings);
        const columns = columnService.getColumns();

        new Setting(configSection)
            .setName('Status')
            .setDesc('Initial status (column) for quests created from this template')
            .addDropdown(dropdown => {
                for (const col of columns) {
                    const label = col.emoji ? `${col.emoji} ${col.title}` : col.title;
                    dropdown.addOption(col.id, label);
                }
                dropdown.setValue(this.status)
                    .onChange(value => {
                        this.status = value;
                    });
            });

        // === Section 3: XP & Rewards ===
        const rewardsSection = formContainer.createDiv({ cls: 'qb-scrivenersquill-section' });
        rewardsSection.createEl('h4', { text: '✨ XP & Rewards' });

        new Setting(rewardsSection)
            .setName('XP Per Task')
            .setDesc('XP awarded for each task/checkbox completed')
            .addText(text => text
                .setPlaceholder('10')
                .setValue(this.xpPerTask.toString())
                .onChange(value => {
                    this.xpPerTask = parseInt(value, 10) || 10;
                }));

        new Setting(rewardsSection)
            .setName('Completion Bonus')
            .setDesc('Bonus XP awarded when the entire quest is completed')
            .addText(text => text
                .setPlaceholder('50')
                .setValue(this.completionBonus.toString())
                .onChange(value => {
                    this.completionBonus = parseInt(value, 10) || 50;
                }));

        new Setting(rewardsSection)
            .setName('Visible Tasks')
            .setDesc('Number of tasks shown on the quest card')
            .addText(text => text
                .setPlaceholder('5')
                .setValue(this.visibleTasks.toString())
                .onChange(value => {
                    this.visibleTasks = parseInt(value, 10) || 5;
                }));

        // === Section 4: Metadata ===
        const metaSection = formContainer.createDiv({ cls: 'qb-scrivenersquill-section' });
        metaSection.createEl('h4', { text: '🏷️ Metadata' });

        new Setting(metaSection)
            .setName('Tags')
            .setDesc('Comma-separated tags for organization')
            .addText(text => text
                .setPlaceholder('fitness, health, weekly')
                .setValue(this.tags)
                .onChange(value => {
                    this.tags = value;
                }));

        new Setting(metaSection)
            .setName('Linked Task File')
            .setDesc('Path to a linked task file in your vault')
            .addText(text => {
                text.setPlaceholder('Projects/my-project.md')
                    .setValue(this.linkedTaskFile)
                    .onChange(value => {
                        this.linkedTaskFile = value;
                    });

                // Add file autocomplete
                import('../utils/FileSuggest').then(({ FileSuggest }) => {
                    new FileSuggest(this.app, text.inputEl);
                }).catch(() => { });
            });

        // Recurrence options (inside recurrenceContainer)
        recurrenceContainer.createEl('h4', { text: '🔄 Recurrence Schedule' });

        new Setting(recurrenceContainer)
            .setName('Pattern')
            .setDesc('How often this quest recurs')
            .addDropdown(dropdown => dropdown
                .addOption('daily', 'Daily')
                .addOption('weekdays', 'Weekdays (Mon-Fri)')
                .addOption('weekly', 'Weekly (specific day)')
                .addOption('monthly', 'Monthly')
                .addOption('custom', 'Custom days')
                .setValue(this.recurrencePattern)
                .onChange(value => {
                    this.recurrencePattern = value;
                    this.updateRecurrenceUI(recurrenceContainer);
                }));

        // Weekly day selector
        const weeklyDayContainer = recurrenceContainer.createDiv({ cls: 'qb-weekly-day-container' });
        weeklyDayContainer.style.display = this.recurrencePattern === 'weekly' ? '' : 'none';

        new Setting(weeklyDayContainer)
            .setName('Day')
            .setDesc('Which day of the week')
            .addDropdown(dropdown => dropdown
                .addOption('monday', 'Monday')
                .addOption('tuesday', 'Tuesday')
                .addOption('wednesday', 'Wednesday')
                .addOption('thursday', 'Thursday')
                .addOption('friday', 'Friday')
                .addOption('saturday', 'Saturday')
                .addOption('sunday', 'Sunday')
                .setValue(this.weeklyDay)
                .onChange(value => {
                    this.weeklyDay = value;
                }));

        // Custom days selector
        const customDaysContainer = recurrenceContainer.createDiv({ cls: 'qb-custom-days-container' });
        customDaysContainer.style.display = this.recurrencePattern === 'custom' ? '' : 'none';

        const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const daysGrid = customDaysContainer.createDiv({ cls: 'qb-days-grid' });
        daysGrid.style.display = 'flex';
        daysGrid.style.flexWrap = 'wrap';
        daysGrid.style.gap = '0.5em';

        for (const day of daysOfWeek) {
            const dayBtn = daysGrid.createEl('button', {
                text: day.charAt(0).toUpperCase() + day.slice(1, 3),
                cls: `qb-day-btn ${this.customDays.includes(day) ? 'qb-day-active' : ''}`
            });
            dayBtn.style.padding = '0.3em 0.6em';
            dayBtn.style.borderRadius = '4px';
            dayBtn.style.border = '1px solid var(--background-modifier-border)';
            dayBtn.style.background = this.customDays.includes(day) ? 'var(--interactive-accent)' : 'var(--background-secondary)';
            dayBtn.style.color = this.customDays.includes(day) ? 'var(--text-on-accent)' : 'var(--text-normal)';
            dayBtn.style.cursor = 'pointer';

            dayBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.customDays.includes(day)) {
                    this.customDays = this.customDays.filter(d => d !== day);
                    dayBtn.style.background = 'var(--background-secondary)';
                    dayBtn.style.color = 'var(--text-normal)';
                    dayBtn.classList.remove('qb-day-active');
                } else {
                    this.customDays.push(day);
                    dayBtn.style.background = 'var(--interactive-accent)';
                    dayBtn.style.color = 'var(--text-on-accent)';
                    dayBtn.classList.add('qb-day-active');
                }
            });
        }

        // === Folder Watcher Section (for daily-quest and watched-folder) ===
        this.buildFolderWatchUI(folderWatchContainer);

        // === Placeholders Section ===
        const placeholdersSection = formContainer.createDiv({ cls: 'qb-scrivenersquill-section' });
        placeholdersSection.createEl('h4', { text: '🏷️ Placeholders' });
        placeholdersSection.createEl('p', {
            text: 'Use {{placeholder_name}} syntax in the body. Common placeholders are auto-filled.',
            cls: 'setting-item-description'
        });

        const placeholdersList = placeholdersSection.createDiv({ cls: 'qb-placeholder-list' });
        this.updatePlaceholderChips(placeholdersList);

        // === Body Content Editor ===
        const bodySection = formContainer.createDiv({ cls: 'qb-scrivenersquill-section' });
        bodySection.createEl('h4', { text: '📜 Scroll Content' });
        bodySection.createEl('p', {
            text: 'Write the quest body in markdown. Use {{Quest Name}}, {{date}}, etc.',
            cls: 'setting-item-description'
        });

        const bodyTextarea = bodySection.createEl('textarea', {
            cls: 'qb-template-body-editor'
        }) as HTMLTextAreaElement;
        bodyTextarea.value = this.existingTemplate?.content || this.getDefaultBody();
        this.bodyContent = bodyTextarea.value;

        bodyTextarea.addEventListener('input', () => {
            this.bodyContent = bodyTextarea.value;
            this.detectPlaceholders();
            this.updatePlaceholderChips(placeholdersList);
        });

        // Initial placeholder detection
        this.bodyContent = bodyTextarea.value;
        this.detectPlaceholders();
        this.updatePlaceholderChips(placeholdersList);

        // === Footer Actions (4 buttons) ===
        const footer = contentEl.createDiv({ cls: 'qb-scrivenersquill-footer' });

        const cancelBtn = footer.createEl('button', {
            text: 'Cancel',
            cls: 'qb-btn qb-btn-secondary'
        });
        cancelBtn.addEventListener('click', () => this.close());

        const previewBtn = footer.createEl('button', {
            text: '👁️ Preview',
            cls: 'qb-btn qb-btn-secondary'
        });
        previewBtn.addEventListener('click', () => this.showPreview());

        const createFileBtn = footer.createEl('button', {
            text: '📄 Create File',
            cls: 'qb-btn qb-btn-secondary'
        });
        createFileBtn.addEventListener('click', () => this.createQuestFile());

        const saveBtn = footer.createEl('button', {
            text: this.isEditing ? '💾 Update Scroll' : '✨ Inscribe Scroll',
            cls: 'qb-btn qb-btn-primary'
        });
        saveBtn.addEventListener('click', () => this.saveTemplate());
    }

    /**
     * Extract questName from body content frontmatter
     */
    private getQuestNameFromContent(): string {
        if (this.existingTemplate?.content) {
            const match = this.existingTemplate.content.match(/questName:\s*["']?([^"'\n]+)["']?/);
            if (match) return match[1].trim();
        }
        return '';
    }

    /**
     * Update questName in body content frontmatter (updates internal state)
     */
    private setQuestNameInContent(name: string): void {
        // The questName will be written to frontmatter on save
        // Store it so saveTemplate() can use it
        (this as any)._questNameOverride = name;
    }

    /**
     * Get default body content for new templates
     */
    private getDefaultBody(): string {
        const effectiveType = this.getEffectiveQuestType();
        const recurrenceLine = this.templateType === 'recurring'
            ? `\nrecurrence: ${this.getRecurrenceString()}`
            : '';

        return `---
questType: ${effectiveType}
status: available
priority: medium
category: ${this.category || '{{category}}'}
xpValue: 50
created: {{date}}${recurrenceLine}
---

# {{Quest Name}}

## Description
Write your quest description here.

## Objectives
- [ ] First task
- [ ] Second task

## Notes
`;
    }

    /**
     * Get recurrence string for frontmatter
     */
    private getRecurrenceString(): string {
        switch (this.recurrencePattern) {
            case 'daily':
                return 'daily';
            case 'weekdays':
                return 'weekdays';
            case 'weekly':
                return `weekly:${this.weeklyDay}`;
            case 'monthly':
                return 'monthly';
            case 'custom':
                return this.customDays.length > 0 ? this.customDays.join(', ') : 'daily';
            default:
                return 'daily';
        }
    }

    /**
     * Update recurrence UI visibility
     */
    private updateRecurrenceUI(container: HTMLElement): void {
        const weeklyContainer = container.querySelector('.qb-weekly-day-container') as HTMLElement;
        const customContainer = container.querySelector('.qb-custom-days-container') as HTMLElement;

        if (weeklyContainer) {
            weeklyContainer.style.display = this.recurrencePattern === 'weekly' ? '' : 'none';
        }
        if (customContainer) {
            customContainer.style.display = this.recurrencePattern === 'custom' ? '' : 'none';
        }
    }

    /**
     * Build the folder watcher UI section
     */
    private buildFolderWatchUI(container: HTMLElement): void {
        container.empty();

        const isDailyQuest = this.templateType === 'daily-quest';
        const headerText = isDailyQuest ? '📓 Daily Note Quest Settings' : '📂 Watched Folder Settings';
        container.createEl('h4', { text: headerText });

        const desc = isDailyQuest
            ? 'Automatically creates a quest linked to your daily note when it\'s created.'
            : 'Creates a quest when a new file is added to the watched folder.';
        container.createEl('p', { text: desc, cls: 'setting-item-description' });

        // Folder path
        new Setting(container)
            .setName(isDailyQuest ? 'Daily Notes Folder' : 'Watch Folder')
            .setDesc(isDailyQuest ? 'Folder where your daily notes are stored' : 'Folder to watch for new files')
            .addText(text => {
                text.setPlaceholder(isDailyQuest ? 'Daily' : 'Projects/Sprint-01')
                    .setValue(this.watchFolder)
                    .onChange(value => {
                        this.watchFolder = value;
                    });

                // Add folder autocomplete
                import('../utils/FolderSuggest').then(({ FolderSuggest }) => {
                    new FolderSuggest(this.app, text.inputEl);
                }).catch(() => { });
            });

        // Auto-detect indicator for daily notes
        if (isDailyQuest) {
            const config = detectDailyNotesConfig(this.app);
            const statusText = config.detected
                ? `✅ Auto-detected: ${config.folder || '(vault root)'}`
                : '⚠️ Daily Notes plugin not detected - please enter folder manually';
            container.createEl('p', { text: statusText, cls: 'setting-item-description qb-folder-status' });
        }

        // Quest naming
        new Setting(container)
            .setName('Quest Naming')
            .setDesc('How to name the generated quest')
            .addDropdown(dropdown => dropdown
                .addOption('filename', 'Use source filename')
                .addOption('custom', 'Custom pattern')
                .setValue(this.namingMode)
                .onChange(value => {
                    this.namingMode = value as QuestNamingMode;
                    this.updateFolderWatchUI(container);
                }));

        // Custom naming pattern (only if custom mode)
        if (this.namingMode === 'custom') {
            new Setting(container)
                .setName('Naming Pattern')
                .setDesc('Use {{filename}}, {{date}}, {{date_slug}} placeholders')
                .addText(text => text
                    .setPlaceholder('Daily Quest - {{date}}')
                    .setValue(this.customNamingPattern)
                    .onChange(value => {
                        this.customNamingPattern = value;
                    }));
        }

        // Archive options
        new Setting(container)
            .setName('Auto-Archive')
            .setDesc('When to automatically archive the quest')
            .addDropdown(dropdown => dropdown
                .addOption('none', 'None (manual only)')
                .addOption('on-new-file', 'When new file created')
                .addOption('after-duration', 'After time period')
                .addOption('at-time', 'At specific time daily')
                .setValue(this.archiveMode)
                .onChange(value => {
                    this.archiveMode = value as ArchiveMode;
                    this.updateFolderWatchUI(container);
                }));

        // Duration hours (only for after-duration mode)
        if (this.archiveMode === 'after-duration') {
            new Setting(container)
                .setName('Archive After')
                .setDesc('Hours until auto-archive')
                .addText(text => text
                    .setPlaceholder('24')
                    .setValue(this.archiveDurationHours.toString())
                    .onChange(value => {
                        this.archiveDurationHours = parseInt(value, 10) || 24;
                    }));
        }

        // Archive time (only for at-time mode)
        if (this.archiveMode === 'at-time') {
            new Setting(container)
                .setName('Archive Time')
                .setDesc('Time to archive (24-hour format)')
                .addText(text => text
                    .setPlaceholder('01:00')
                    .setValue(this.archiveTime)
                    .onChange(value => {
                        this.archiveTime = value;
                    }));
        }

        // Custom archive path (optional)
        new Setting(container)
            .setName('Custom Archive Path')
            .setDesc('Leave blank to use default archive folder from settings')
            .addText(text => {
                text.setPlaceholder('(use default)')
                    .setValue(this.archivePath)
                    .onChange(value => {
                        this.archivePath = value;
                    });

                // Add folder autocomplete
                import('../utils/FolderSuggest').then(({ FolderSuggest }) => {
                    new FolderSuggest(this.app, text.inputEl);
                }).catch(() => { });
            });
    }

    /**
     * Update folder watcher UI (rebuild)
     */
    private updateFolderWatchUI(container: HTMLElement): void {
        this.buildFolderWatchUI(container);
    }

    /**
     * Detect placeholders in the body content
     */
    private detectPlaceholders(): void {
        const placeholderRegex = /\{\{([^}]+)\}\}/g;
        const detected: EditorPlaceholder[] = [];
        const seen = new Set<string>();

        let match;
        while ((match = placeholderRegex.exec(this.bodyContent)) !== null) {
            const name = match[1].trim();
            if (!seen.has(name)) {
                seen.add(name);
                detected.push({
                    name,
                    isAuto: this.isAutoPlaceholder(name)
                });
            }
        }

        this.placeholders = detected;
    }

    /**
     * Check if a placeholder is auto-filled
     */
    private isAutoPlaceholder(name: string): boolean {
        const autoPlaceholders = [
            'date', 'created', 'slug', 'title', 'output_path',
            'quest_type', 'questType'
        ];
        return autoPlaceholders.includes(name.toLowerCase());
    }

    /**
     * Update placeholder chips display
     */
    private updatePlaceholderChips(container: HTMLElement): void {
        container.empty();

        if (this.placeholders.length === 0) {
            container.createEl('span', {
                text: 'No placeholders detected',
                cls: 'qb-placeholder-chip'
            });
            return;
        }

        for (const placeholder of this.placeholders) {
            const chip = container.createEl('span', {
                text: `{{${placeholder.name}}}`,
                cls: `qb-placeholder-chip ${placeholder.isAuto ? '' : 'qb-placeholder-chip-required'}`
            });

            if (placeholder.isAuto) {
                chip.title = 'Auto-filled';
            } else {
                chip.title = 'User input required';
            }
        }
    }

    /**
     * Title case helper
     */
    private titleCase(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Scan the quests folder for subfolders to use as quest type options
     */
    private async loadAvailableTypes(): Promise<void> {
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
     * Get the effective questType value for frontmatter.
     * For standard templates, use the quest type (main/side/training).
     * For special templates (recurring, daily-quest, watched-folder), use the template type.
     */
    private getEffectiveQuestType(): string {
        if (this.templateType === 'standard') {
            return this.questType; // main, side, training
        }
        return this.templateType; // recurring, daily-quest, watched-folder
    }

    /**
     * Extract sections (## headers) and tasks from body content.
     * Groups tasks under their parent section header, matching how
     * QuestCard.tsx renders sections on the kanban board.
     */
    private extractSectionsFromBody(): { sections: PreviewSection[]; totalTasks: number } {
        const sections: PreviewSection[] = [];
        let currentSection: PreviewSection = { headerText: '', tasks: [] };
        let totalTasks = 0;

        // Strip frontmatter before parsing
        let body = this.bodyContent;
        if (body.startsWith('---')) {
            const endIndex = body.indexOf('---', 3);
            if (endIndex !== -1) {
                body = body.substring(endIndex + 3);
            }
        }

        const lines = body.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();

            // Check for ## section headers
            const headerMatch = trimmed.match(/^##\s+(.+)$/);
            if (headerMatch) {
                // Push previous section if it has content
                if (currentSection.headerText || currentSection.tasks.length > 0) {
                    sections.push(currentSection);
                }
                currentSection = { headerText: headerMatch[1].trim(), tasks: [] };
                continue;
            }

            // Check for task lines
            const taskMatch = trimmed.match(/^- \[ \]\s+(.+)$/);
            if (taskMatch) {
                currentSection.tasks.push(taskMatch[1].trim());
                totalTasks++;
            }
        }

        // Push the last section
        if (currentSection.headerText || currentSection.tasks.length > 0) {
            sections.push(currentSection);
        }

        return { sections, totalTasks };
    }

    /**
     * Show a preview of how the quest card will look on the kanban board
     */
    private showPreview(): void {
        // Get quest name from override or body content
        const questName = (this as any)._questNameOverride
            || this.getQuestNameFromContent()
            || this.templateName
            || 'Untitled Quest';

        // Resolve placeholders in the quest name for display
        const resolvedName = questName
            .replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0])
            .replace(/\{\{Quest Name\}\}/gi, this.templateName);

        const { sections, totalTasks } = this.extractSectionsFromBody();

        const previewData: TemplatePreviewData = {
            questName: resolvedName,
            category: this.category || 'general',
            priority: this.priority,
            xpPerTask: this.xpPerTask,
            completionBonus: this.completionBonus,
            visibleTasks: this.visibleTasks,
            sections,
            totalTasks,
            tagline: this.tagline,
            questType: this.questType,
            status: this.status,
        };

        new TemplatePreviewModal(this.app, previewData).open();
    }

    /**
     * Create a quest file directly from the current template editor state
     */
    private async createQuestFile(): Promise<void> {
        // Validate
        if (!this.templateName.trim()) {
            new Notice('❌ Please enter a template name first');
            return;
        }

        if (!this.bodyContent.trim()) {
            new Notice('❌ Template body content is empty');
            return;
        }

        try {
            const storageFolder = this.plugin.settings.storageFolder;
            const effectiveType = this.getEffectiveQuestType();

            // Build frontmatter from form state
            const questNameOverride = (this as any)._questNameOverride;
            const questName = questNameOverride || this.templateName;

            // Resolve auto-placeholders
            const today = new Date().toISOString().split('T')[0];
            const questSlug = questName
                .toLowerCase()
                .replace(/\{\{.*?\}\}/g, '')  // strip remaining placeholders
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                || 'untitled-quest';

            // Generate output path based on quest type
            const outputPath = `${storageFolder}/quests/${effectiveType.toLowerCase()}/${questSlug}.md`;

            // Build the complete content (frontmatter + body)
            const questNameLine = `questName: "${questName}"\n`;
            const taglineLine = this.tagline ? `tagline: "${this.tagline}"\n` : '';
            const recurrenceLine = this.templateType === 'recurring'
                ? `recurrence: ${this.getRecurrenceString()}\n`
                : '';
            const tagsLines = this.tags.trim()
                ? `tags:\n${this.tags.split(',').map(t => `  - ${t.trim()}`).filter(t => t !== '  - ').join('\n')}\n`
                : '';
            const linkedTaskLine = this.linkedTaskFile
                ? `linkedTaskFile: "${this.linkedTaskFile}"\n`
                : `linkedTaskFile: "${outputPath}"\n`;

            const newFrontmatter = `---\n${questNameLine}questType: ${effectiveType}\nstatus: ${this.status}\npriority: ${this.priority}\ncategory: ${this.category || 'general'}\n${taglineLine}xpPerTask: ${this.xpPerTask}\ncompletionBonus: ${this.completionBonus}\nvisibleTasks: ${this.visibleTasks}\n${tagsLines}${linkedTaskLine}created: ${today}\n${recurrenceLine}---`;

            // Strip existing frontmatter from body, resolve placeholders
            let body = this.bodyContent;
            if (body.startsWith('---')) {
                const endIndex = body.indexOf('---', 3);
                if (endIndex !== -1) {
                    body = body.substring(endIndex + 3).replace(/^\r?\n/, '');
                }
            }

            // Replace common auto-placeholders in body
            body = body
                .replace(/\{\{date\}\}/g, today)
                .replace(/\{\{Quest Name\}\}/gi, questName)
                .replace(/\{\{quest_type\}\}/gi, effectiveType)
                .replace(/\{\{questType\}\}/g, effectiveType);

            const content = `${newFrontmatter}\n\n${body}`;

            // Ensure parent folder exists
            const folderPath = outputPath.substring(0, outputPath.lastIndexOf('/'));
            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (!folder) {
                await this.app.vault.createFolder(folderPath);
            }

            // Check if file already exists
            const existingFile = this.app.vault.getAbstractFileByPath(outputPath);
            if (existingFile) {
                const overwrite = window.confirm(
                    `A quest file "${questSlug}.md" already exists. Overwrite it?`
                );
                if (!overwrite) return;
                await this.app.vault.modify(existingFile as TFile, content);
            } else {
                await this.app.vault.create(outputPath, content);
            }

            // Record template usage stats
            const statsService = getTemplateStatsService();
            if (statsService && this.existingTemplate) {
                await statsService.recordUsage(
                    this.existingTemplate.path,
                    this.existingTemplate.name,
                    this.category || 'general'
                );
            }

            const fileName = outputPath.split('/').pop();
            new Notice(`✅ Quest created: ${fileName}`);

            // Trigger board refresh
            this.app.workspace.trigger('quest-board:refresh');

            // Open the created file
            await this.app.workspace.openLinkText(outputPath, '', false);

            this.close();
        } catch (error) {
            console.error('[ScrivenersQuillModal] Failed to create quest file:', error);
            new Notice('❌ Failed to create quest file');
        }
    }

    /**
     * Save the template
     */
    private async saveTemplate(): Promise<void> {
        // Validate
        if (!this.templateName.trim()) {
            new Notice('❌ Please enter a template name');
            return;
        }

        try {
            const templateFolder = this.plugin.settings.templateFolder || 'Quest Board/templates';
            const fileName = `${this.toSlug(this.templateName)}-template.md`;
            const filePath = `${templateFolder}/${fileName}`;

            // Check if file exists and we're not editing
            if (!this.isEditing) {
                const existing = this.app.vault.getAbstractFileByPath(filePath);
                if (existing) {
                    const overwrite = window.confirm(
                        `A template named "${fileName}" already exists. Overwrite it?`
                    );
                    if (!overwrite) return;
                }
            }

            // Ensure folder exists
            const folderPath = templateFolder.split('/');
            let currentPath = '';
            for (const folder of folderPath) {
                currentPath += (currentPath ? '/' : '') + folder;
                const folderFile = this.app.vault.getAbstractFileByPath(currentPath);
                if (!folderFile) {
                    await this.app.vault.createFolder(currentPath);
                }
            }

            // Build frontmatter from current form state
            const questNameOverride = (this as any)._questNameOverride;
            const questNameLine = questNameOverride
                ? `questName: "${questNameOverride}"\n`
                : '';

            const taglineLine = this.tagline
                ? `tagline: "${this.tagline}"\n`
                : '';

            // Compute effective questType for frontmatter
            const effectiveType = this.getEffectiveQuestType();

            const recurrenceLine = this.templateType === 'recurring'
                ? `recurrence: ${this.getRecurrenceString()}\n`
                : '';

            // Folder watcher lines for daily-quest and watched-folder types
            const isFolderWatcher = ['daily-quest', 'watched-folder'].includes(this.templateType);
            const folderWatchLines = isFolderWatcher
                ? `watchFolder: "${this.watchFolder}"\n` +
                `namingMode: ${this.namingMode}\n` +
                (this.namingMode === 'custom' ? `namingPattern: "${this.customNamingPattern}"\n` : '') +
                `archiveMode: ${this.archiveMode}\n` +
                (this.archiveMode === 'after-duration' ? `archiveDurationHours: ${this.archiveDurationHours}\n` : '') +
                (this.archiveMode === 'at-time' ? `archiveTime: "${this.archiveTime}"\n` : '') +
                (this.archivePath ? `archivePath: "${this.archivePath}"\n` : '')
                : '';

            const tagsLines = this.tags.trim()
                ? `tags:\n${this.tags.split(',').map(t => `  - ${t.trim()}`).filter(t => t !== '  - ').join('\n')}\n`
                : '';

            const linkedTaskLine = this.linkedTaskFile
                ? `linkedTaskFile: "${this.linkedTaskFile}"\n`
                : '';

            const newFrontmatter = `---\n${questNameLine}questType: ${effectiveType}\nstatus: ${this.status}\npriority: ${this.priority}\ncategory: ${this.category || ''}\n${taglineLine}xpPerTask: ${this.xpPerTask}\ncompletionBonus: ${this.completionBonus}\nvisibleTasks: ${this.visibleTasks}\n${tagsLines}${linkedTaskLine}created: {{date}}\n${recurrenceLine}${folderWatchLines}---`;

            // Strip existing frontmatter from body content, then prepend fresh one
            let bodyWithoutFrontmatter = this.bodyContent;
            if (bodyWithoutFrontmatter.startsWith('---')) {
                const endIndex = bodyWithoutFrontmatter.indexOf('---', 3);
                if (endIndex !== -1) {
                    bodyWithoutFrontmatter = bodyWithoutFrontmatter.substring(endIndex + 3).replace(/^\r?\n/, '');
                }
            }

            const content = `${newFrontmatter}\n\n${bodyWithoutFrontmatter}`;

            // Create or update file
            const existingFile = this.isEditing && this.existingTemplate
                ? this.app.vault.getAbstractFileByPath(this.existingTemplate.path)
                : this.app.vault.getAbstractFileByPath(filePath);

            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, content);
                new Notice('📜 Scroll updated successfully!');
            } else {
                await this.app.vault.create(filePath, content);
                new Notice('✨ New scroll inscribed!');
            }

            // Register folder watcher for daily-quest and watched-folder types
            if (['daily-quest', 'watched-folder'].includes(this.templateType)) {
                await this.registerFolderWatcher(filePath);
            }

            this.close();
        } catch (error) {
            console.error('[ScrivenersQuillModal] Failed to save template:', error);
            new Notice('❌ Failed to save scroll');
        }
    }

    /**
     * Convert text to slug
     */
    private toSlug(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Register a folder watcher configuration with the FolderWatchService
     */
    private async registerFolderWatcher(templatePath: string): Promise<void> {
        const service = this.plugin.folderWatchService;
        if (!service) {
            console.error('[ScrivenersQuillModal] FolderWatchService not available');
            return;
        }

        // Check if a config already exists for this template
        const existingConfigs = service.getConfigs();
        const existingConfig = existingConfigs.find(c => c.templatePath === templatePath);

        const config: WatchedFolderConfig = {
            id: existingConfig?.id || service.generateConfigId(),
            templatePath,
            watchFolder: this.watchFolder,
            questType: this.templateType as 'daily-quest' | 'watched-folder',
            namingMode: this.namingMode,
            customNamingPattern: this.namingMode === 'custom' ? this.customNamingPattern : undefined,
            category: this.category || 'daily',
            priority: QuestPriority.MEDIUM,
            xpPerTask: this.xpPerTask,
            completionBonus: this.completionBonus,
            archiveMode: this.archiveMode,
            archiveDurationHours: this.archiveMode === 'after-duration' ? this.archiveDurationHours : undefined,
            archiveTime: this.archiveMode === 'at-time' ? this.archiveTime : undefined,
            archivePath: this.archivePath || undefined,
            enabled: true,
            currentQuestPath: existingConfig?.currentQuestPath,
        };

        if (existingConfig) {
            await service.updateConfig(config);
            console.log('[ScrivenersQuillModal] Updated folder watcher config');
        } else {
            await service.addConfig(config);
            console.log('[ScrivenersQuillModal] Registered new folder watcher config');
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
