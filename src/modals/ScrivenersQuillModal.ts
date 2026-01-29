/**
 * Scrivener's Quill Modal (Template Builder)
 * 
 * Rich template editor with live preview, placeholder management,
 * and RPG theming for the Quest Board plugin.
 */

import { App, Modal, Notice, Setting, TFile, TextAreaComponent } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { ParsedTemplate } from '../services/TemplateService';

/**
 * Local placeholder info for the template editor
 */
interface EditorPlaceholder {
    name: string;
    isAuto: boolean;
}

/**
 * The Scrivener's Quill - Template builder modal
 */
export class ScrivenersQuillModal extends Modal {
    private plugin: QuestBoardPlugin;
    private existingTemplate: ParsedTemplate | undefined;
    private isEditing: boolean;

    // Form state
    private templateName: string = '';
    private questType: string = 'side';
    private category: string = '';
    private bodyContent: string = '';
    private placeholders: EditorPlaceholder[] = [];

    // Recurrence state
    private recurrencePattern: string = 'daily';
    private customDays: string[] = [];
    private weeklyDay: string = 'monday';

    constructor(app: App, plugin: QuestBoardPlugin, existingTemplate?: ParsedTemplate) {
        super(app);
        this.plugin = plugin;
        this.existingTemplate = existingTemplate;
        this.isEditing = !!existingTemplate;

        // Pre-populate if editing
        if (existingTemplate) {
            this.templateName = existingTemplate.name.replace(/-template$/i, '').trim();
            this.questType = existingTemplate.questType || 'side';
            this.category = existingTemplate.category || '';
            // Map existing placeholders to our local format
            this.placeholders = existingTemplate.placeholders.map(p => ({
                name: p.name,
                isAuto: p.isAutoDate || p.isOutputPath || p.isSlug
            }));
        }
    }

    async onOpen(): Promise<void> {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        modalEl.addClass('qb-scrivenersquill-modal');
        contentEl.addClass('qb-scrivenersquill-content-el');

        // Header
        const title = this.isEditing ? '📝 Revise the Contract' : '🪶 Draft New Scroll';
        contentEl.createEl('h2', { text: title });

        // Main content container
        const mainContent = contentEl.createDiv({ cls: 'qb-scrivenersquill-content' });

        // Left side - Form
        const formSide = mainContent.createDiv({ cls: 'qb-scrivenersquill-form' });

        // Right side - Preview
        const previewSide = mainContent.createDiv({ cls: 'qb-scrivenersquill-preview' });
        previewSide.createEl('h4', { text: '📜 Scroll Preview' });
        const previewCard = previewSide.createDiv({ cls: 'qb-scrivenersquill-preview-card' });
        this.updatePreview(previewCard);

        // === Form Fields ===

        // Template Name
        const nameSection = formSide.createDiv({ cls: 'qb-scrivenersquill-section' });
        nameSection.createEl('h4', { text: '✒️ Scroll Name' });

        new Setting(nameSection)
            .setName('Template Name')
            .setDesc('Name for this quest template')
            .addText(text => text
                .setPlaceholder('My Quest Template')
                .setValue(this.templateName)
                .onChange(value => {
                    this.templateName = value;
                    this.updatePreview(previewCard);
                }));

        // Quest Type
        const typeSection = formSide.createDiv({ cls: 'qb-scrivenersquill-section' });
        typeSection.createEl('h4', { text: '⚔️ Quest Type' });

        // Container for recurrence options (will be shown/hidden)
        const recurrenceContainer = formSide.createDiv({ cls: 'qb-scrivenersquill-section qb-recurrence-section' });
        recurrenceContainer.style.display = this.questType === 'recurring' ? '' : 'none';

        new Setting(typeSection)
            .setName('Type')
            .setDesc('The type of quest this template creates')
            .addDropdown(dropdown => dropdown
                .addOption('main', '⚔️ Main Quest')
                .addOption('side', '📋 Side Quest')
                .addOption('training', '🎯 Training Quest')
                .addOption('recurring', '🔄 Recurring Quest')
                .addOption('daily', '📅 Daily Quest')
                .setValue(this.questType)
                .onChange(value => {
                    this.questType = value;
                    // Show/hide recurrence options
                    recurrenceContainer.style.display = value === 'recurring' ? '' : 'none';
                    this.updatePreview(previewCard);
                }));

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
                    this.updatePreview(previewCard);
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
                    this.updatePreview(previewCard);
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
                this.updatePreview(previewCard);
            });
        }

        // Category
        new Setting(typeSection)
            .setName('Category')
            .setDesc('Default category for quests created from this template')
            .addText(text => {
                text.setPlaceholder('work, health, projects...')
                    .setValue(this.category)
                    .onChange(value => {
                        this.category = value;
                        this.updatePreview(previewCard);
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
                    typeSection.appendChild(datalist);
                }
            });

        // Placeholders Section
        const placeholdersSection = formSide.createDiv({ cls: 'qb-scrivenersquill-section' });
        placeholdersSection.createEl('h4', { text: '🏷️ Placeholders' });
        placeholdersSection.createEl('p', {
            text: 'Use {{placeholder_name}} syntax in the body. Common placeholders are auto-filled.',
            cls: 'setting-item-description'
        });

        // Show detected placeholders
        const placeholdersList = placeholdersSection.createDiv({ cls: 'qb-placeholder-list' });
        this.updatePlaceholderChips(placeholdersList);

        // Body Content
        const bodySection = formSide.createDiv({ cls: 'qb-scrivenersquill-section' });
        bodySection.createEl('h4', { text: '📜 Scroll Content' });
        bodySection.createEl('p', {
            text: 'Write the template body. Use {{Quest Name}}, {{date}}, etc.',
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
            this.updatePreview(previewCard);
        });

        // Initial placeholder detection
        this.bodyContent = bodyTextarea.value;
        this.detectPlaceholders();
        this.updatePlaceholderChips(placeholdersList);

        // === Footer Actions ===
        const footer = contentEl.createDiv({ cls: 'qb-scrivenersquill-footer' });

        const cancelBtn = footer.createEl('button', {
            text: 'Cancel',
            cls: 'qb-btn qb-btn-secondary'
        });
        cancelBtn.addEventListener('click', () => this.close());

        const saveBtn = footer.createEl('button', {
            text: this.isEditing ? '💾 Update Scroll' : '✨ Inscribe Scroll',
            cls: 'qb-btn qb-btn-primary'
        });
        saveBtn.addEventListener('click', () => this.saveTemplate());
    }

    /**
     * Get default body content for new templates
     */
    private getDefaultBody(): string {
        const recurrenceLine = this.questType === 'recurring'
            ? `\nrecurrence: ${this.getRecurrenceString()}`
            : '';

        return `---
questType: ${this.questType}
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
     * Update the preview card
     */
    private updatePreview(previewCard: HTMLElement): void {
        previewCard.empty();

        // Quest type icon
        const icons: Record<string, string> = {
            main: '⚔️',
            side: '📋',
            training: '🎯',
            recurring: '🔄',
            daily: '📅',
        };
        const icon = icons[this.questType] || '📜';

        // Preview header
        const header = previewCard.createDiv({ cls: 'qb-preview-header' });
        header.createEl('span', { text: icon, cls: 'qb-preview-icon' });
        header.createEl('span', {
            text: this.templateName || 'Untitled Template',
            cls: 'qb-preview-title'
        });

        // Quest type badge
        const typeBadge = previewCard.createDiv({ cls: `qb-scroll-card-type qb-type-${this.questType}` });
        typeBadge.textContent = this.titleCase(this.questType);

        // Category
        if (this.category) {
            previewCard.createDiv({
                text: this.category,
                cls: 'qb-preview-category'
            });
        }

        // Placeholders summary
        const userPlaceholders = this.placeholders.filter(p => !p.isAuto);
        if (userPlaceholders.length > 0) {
            previewCard.createDiv({
                text: `${userPlaceholders.length} field(s) to fill`,
                cls: 'qb-preview-placeholders'
            });
        }
    }

    /**
     * Title case helper
     */
    private titleCase(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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

            // Build content with frontmatter if not already present
            let content = this.bodyContent;
            if (!content.startsWith('---')) {
                const recurrenceLine = this.questType === 'recurring'
                    ? `recurrence: ${this.getRecurrenceString()}\n`
                    : '';

                content = `---
questType: ${this.questType}
status: available
priority: medium
category: ${this.category || ''}
xpValue: 50
created: {{date}}
${recurrenceLine}---

${content}`;
            }

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

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
