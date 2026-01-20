/**
 * Job Hunt Modals
 * 
 * Modals for creating job hunt quests.
 * Collects job details from user and creates quest files.
 */

import { App, Modal, Notice, Setting } from 'obsidian';
import { TemplateService } from '../services/TemplateService';

/**
 * Job details collected from user
 */
export interface JobDetails {
    company: string;
    position?: string;
    job_link: string;
    company_linkedin: string;
    salary_range: string;
    work_type: string;
}

/**
 * Hardcoded paths (can be moved to settings later)
 */
const TEMPLATE_PATHS = {
    application: 'System/Templates/Job Hunt/application-gauntlet.md',
    interview: 'System/Templates/Job Hunt/interview-arena.md',
};

const OUTPUT_PATHS = {
    side: 'Life/Quest Board/quests/side',
    main: 'Life/Quest Board/quests/main',
};

/**
 * Modal for creating a new Application Gauntlet quest
 */
export class ApplicationGauntletModal extends Modal {
    private templateService: TemplateService;
    private details: JobDetails = {
        company: '',
        position: '',
        job_link: '',
        company_linkedin: '',
        salary_range: '',
        work_type: '',
    };

    constructor(app: App) {
        super(app);
        this.templateService = new TemplateService(app.vault);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: '📝 New Application Gauntlet' });
        contentEl.createEl('p', {
            text: 'Create a new job application quest.',
            cls: 'setting-item-description'
        });

        // Company Name (required)
        new Setting(contentEl)
            .setName('Company Name')
            .setDesc('Required')
            .addText(text => text
                .setPlaceholder('Acme Corp')
                .onChange(value => this.details.company = value));

        // Position Title (required)
        new Setting(contentEl)
            .setName('Position Title')
            .setDesc('Required')
            .addText(text => text
                .setPlaceholder('Senior Developer')
                .onChange(value => this.details.position = value));

        // Job Link (optional)
        new Setting(contentEl)
            .setName('Job Posting Link')
            .addText(text => text
                .setPlaceholder('https://jobs.example.com/123')
                .onChange(value => this.details.job_link = value));

        // Company LinkedIn (optional)
        new Setting(contentEl)
            .setName('Company LinkedIn')
            .addText(text => text
                .setPlaceholder('https://linkedin.com/company/acme')
                .onChange(value => this.details.company_linkedin = value));

        // Salary Range (optional)
        new Setting(contentEl)
            .setName('Salary Range')
            .addText(text => text
                .setPlaceholder('$120k - $150k')
                .onChange(value => this.details.salary_range = value));

        // Work Type (optional)
        new Setting(contentEl)
            .setName('Work Type')
            .addDropdown(dropdown => dropdown
                .addOption('', 'Select...')
                .addOption('Remote', 'Remote')
                .addOption('Hybrid', 'Hybrid')
                .addOption('Onsite', 'Onsite')
                .onChange(value => this.details.work_type = value));

        // Create button
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Create Quest')
                .setCta()
                .onClick(() => this.createQuest()));
    }

    async createQuest() {
        // Validate required fields
        if (!this.details.company.trim()) {
            new Notice('Company name is required');
            return;
        }
        if (!this.details.position?.trim()) {
            new Notice('Position title is required');
            return;
        }

        // Build output path
        const fileName = `Application - ${this.details.company} - ${this.details.position}.md`;
        const outputPath = `${OUTPUT_PATHS.side}/${fileName}`;

        // Create quest
        const success = await this.templateService.createQuestFromTemplate(
            TEMPLATE_PATHS.application,
            outputPath,
            this.details
        );

        if (success) {
            new Notice(`Created: ${fileName}`);
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
 * Modal for creating a new Interview Arena quest
 */
export class InterviewArenaModal extends Modal {
    private templateService: TemplateService;
    private details: JobDetails = {
        company: '',
        job_link: '',
        company_linkedin: '',
        salary_range: '',
        work_type: '',
    };

    constructor(app: App) {
        super(app);
        this.templateService = new TemplateService(app.vault);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: '🎯 New Interview Arena' });
        contentEl.createEl('p', {
            text: 'Create a new interview prep quest.',
            cls: 'setting-item-description'
        });

        // Company Name (required)
        new Setting(contentEl)
            .setName('Company Name')
            .setDesc('Required')
            .addText(text => text
                .setPlaceholder('Acme Corp')
                .onChange(value => this.details.company = value));

        // Job Link (optional)
        new Setting(contentEl)
            .setName('Job Posting Link')
            .addText(text => text
                .setPlaceholder('https://jobs.example.com/123')
                .onChange(value => this.details.job_link = value));

        // Company LinkedIn (optional)
        new Setting(contentEl)
            .setName('Company LinkedIn')
            .addText(text => text
                .setPlaceholder('https://linkedin.com/company/acme')
                .onChange(value => this.details.company_linkedin = value));

        // Salary Range (optional)
        new Setting(contentEl)
            .setName('Salary Range')
            .addText(text => text
                .setPlaceholder('$120k - $150k')
                .onChange(value => this.details.salary_range = value));

        // Work Type (optional)
        new Setting(contentEl)
            .setName('Work Type')
            .addDropdown(dropdown => dropdown
                .addOption('', 'Select...')
                .addOption('Remote', 'Remote')
                .addOption('Hybrid', 'Hybrid')
                .addOption('Onsite', 'Onsite')
                .onChange(value => this.details.work_type = value));

        // Create button
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Create Quest')
                .setCta()
                .onClick(() => this.createQuest()));
    }

    async createQuest() {
        // Validate required fields
        if (!this.details.company.trim()) {
            new Notice('Company name is required');
            return;
        }

        // Build output path
        const fileName = `Interview - ${this.details.company}.md`;
        const outputPath = `${OUTPUT_PATHS.main}/${fileName}`;

        // Create quest
        const success = await this.templateService.createQuestFromTemplate(
            TEMPLATE_PATHS.interview,
            outputPath,
            this.details
        );

        if (success) {
            new Notice(`Created: ${fileName}`);
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
