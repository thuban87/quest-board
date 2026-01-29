/**
 * Smart Template Modal
 * 
 * Unified system for creating quests from any template.
 * Automatically parses templates for placeholders and generates dynamic forms.
 */

import { App, Modal, Notice, Setting, FuzzySuggestModal, TFile } from 'obsidian';
import { TemplateService, ParsedTemplate, PlaceholderInfo } from '../services/TemplateService';
import { getTemplateStatsService } from '../services/TemplateStatsService';
import type QuestBoardPlugin from '../../main';

/**
 * Hardcoded paths (can be moved to settings later)
 */
const TEMPLATE_FOLDER = 'System/Templates';
const STORAGE_FOLDER = 'Life/Quest Board';

/**
 * Work type options for dropdown
 */
const WORK_TYPE_OPTIONS = ['', 'Remote', 'Hybrid', 'Onsite'];

/**
 * Template Picker - FuzzySuggestModal to select a template (legacy fallback)
 */
export class TemplatePickerModal extends FuzzySuggestModal<TFile> {
    private templates: TFile[];
    private onSelect: (template: TFile) => void;

    constructor(app: App, templates: TFile[], onSelect: (template: TFile) => void) {
        super(app);
        this.templates = templates;
        this.onSelect = onSelect;
        this.setPlaceholder('Search templates...');
    }

    getItems(): TFile[] {
        return this.templates;
    }

    getItemText(item: TFile): string {
        // Show relative path from templates folder for clarity
        const relativePath = item.path.replace(TEMPLATE_FOLDER + '/', '');
        return relativePath.replace('.md', '').replace(/-template$/, '');
    }

    onChooseItem(item: TFile): void {
        this.onSelect(item);
    }
}

/**
 * Dynamic Template Modal - generates form based on template placeholders
 */
export class DynamicTemplateModal extends Modal {
    private plugin: QuestBoardPlugin;
    private templateService: TemplateService;
    private parsedTemplate: ParsedTemplate;
    private userInput: Record<string, string> = {};

    constructor(app: App, plugin: QuestBoardPlugin, parsedTemplate: ParsedTemplate) {
        super(app);
        this.plugin = plugin;
        this.templateService = new TemplateService(app.vault);
        this.parsedTemplate = parsedTemplate;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-dynamic-template-modal');

        // Header
        const templateName = this.parsedTemplate.name.replace(/\{\{.*?\}\}/g, '...');
        contentEl.createEl('h2', { text: `📝 ${templateName}` });

        if (this.parsedTemplate.category) {
            contentEl.createEl('p', {
                text: `Category: ${this.parsedTemplate.category}`,
                cls: 'setting-item-description'
            });
        }

        // Get only user-input placeholders
        const inputFields = this.templateService.getUserInputPlaceholders(this.parsedTemplate.placeholders);

        // Generate form fields dynamically
        for (const field of inputFields) {
            this.createFieldInput(contentEl, field);
        }

        // Create button
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Create Quest')
                .setCta()
                .onClick(() => this.createQuest()));
    }

    private createFieldInput(container: HTMLElement, field: PlaceholderInfo): void {
        const label = this.formatLabel(field.name);
        const isRequired = this.isRequiredField(field.name);

        // Special handling for work_type (dropdown)
        if (field.name === 'work_type') {
            new Setting(container)
                .setName(label)
                .addDropdown(dropdown => {
                    WORK_TYPE_OPTIONS.forEach(opt => dropdown.addOption(opt, opt || 'Select...'));
                    dropdown.onChange(value => this.userInput[field.name] = value);
                });
            return;
        }

        // Standard text input
        const setting = new Setting(container)
            .setName(label);

        if (isRequired) {
            setting.setDesc('Required');
        }

        setting.addText(text => {
            text.setPlaceholder(this.getPlaceholderHint(field.name));
            text.onChange(value => this.userInput[field.name] = value);
        });
    }

    private formatLabel(fieldName: string): string {
        return fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    private isRequiredField(fieldName: string): boolean {
        // Fields that are likely required based on naming
        const requiredPatterns = ['company', 'position', 'client', 'project', 'course', 'event', 'provider', 'template', 'plugin', 'month'];
        return requiredPatterns.some(p => fieldName.includes(p));
    }

    private getPlaceholderHint(fieldName: string): string {
        const hints: Record<string, string> = {
            company: 'Acme Corp',
            position: 'Senior Developer',
            client: 'Client Name',
            project: 'Project Name',
            course: 'Course Name',
            event: 'Event Name',
            provider: 'Dr. Smith',
            template: 'Template Name',
            plugin: 'Plugin Name',
            month: 'January 2026',
            job_link: 'https://jobs.example.com/123',
            company_linkedin: 'https://linkedin.com/company/...',
            salary_range: '$120k - $150k',
        };
        return hints[fieldName] || '';
    }

    async createQuest(): Promise<void> {
        // Validate required fields
        const inputFields = this.templateService.getUserInputPlaceholders(this.parsedTemplate.placeholders);
        for (const field of inputFields) {
            if (this.isRequiredField(field.name) && !this.userInput[field.name]?.trim()) {
                new Notice(`${this.formatLabel(field.name)} is required`);
                return;
            }
        }

        // Generate output path
        const outputPath = this.templateService.generateOutputPath(
            this.parsedTemplate.questType,
            this.userInput,
            this.parsedTemplate.placeholders,
            this.parsedTemplate.name,
            STORAGE_FOLDER
        );

        // Build complete variables
        const variables = this.templateService.buildVariables(
            this.userInput,
            this.parsedTemplate.placeholders,
            outputPath
        );

        // Create the file
        const success = await this.templateService.createFromTemplate(
            this.parsedTemplate.path,
            outputPath,
            variables
        );

        if (success) {
            const fileName = outputPath.split('/').pop();
            new Notice(`Created: ${fileName}`);

            // Record template usage for smart suggestions
            const statsService = getTemplateStatsService();
            if (statsService) {
                await statsService.recordUsage(
                    this.parsedTemplate.path,
                    this.parsedTemplate.name,
                    this.parsedTemplate.category
                );
            }

            // Trigger refresh
            this.app.workspace.trigger('quest-board:refresh');
            this.close();
        } else {
            new Notice('Failed to create quest. Check console for details.');
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/**
 * Main entry point - opens The Scroll Library
 */
export async function openSmartTemplateModal(app: App, plugin: QuestBoardPlugin): Promise<void> {
    // Use the new ScrollLibraryModal as the primary entry point
    const { openScrollLibraryModal } = await import('./ScrollLibraryModal');
    openScrollLibraryModal(app, plugin);
}

