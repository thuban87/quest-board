/**
 * Recurring Quests Dashboard Modal
 * 
 * Shows an overview of all recurring quest templates:
 * - Template name
 * - Schedule (human-readable)
 * - Next run date
 * - Today's status (generated/pending/not scheduled)
 */

import { App, Modal } from 'obsidian';
import { RecurringQuestService, TemplateStatus } from '../services/RecurringQuestService';

export class RecurringQuestsDashboardModal extends Modal {
    private service: RecurringQuestService;
    private onRefresh: () => void;

    constructor(app: App, service: RecurringQuestService, onRefresh: () => void) {
        super(app);
        this.service = service;
        this.onRefresh = onRefresh;
    }

    async onOpen(): Promise<void> {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-recurring-dashboard');

        // Header
        const header = contentEl.createEl('div', { cls: 'qb-dashboard-header' });
        header.createEl('h2', { text: '🔄 Recurring Quests Dashboard' });
        header.createEl('p', {
            text: `Templates folder: ${this.service.getTemplatesFolder()}`,
            cls: 'qb-dashboard-folder'
        });

        // Loading indicator
        const loadingEl = contentEl.createEl('div', {
            text: 'Loading templates...',
            cls: 'qb-dashboard-loading'
        });

        // Load template statuses
        const statuses = await this.service.getTemplateStatuses();
        loadingEl.remove();

        if (statuses.length === 0) {
            const emptyEl = contentEl.createEl('div', { cls: 'qb-dashboard-empty' });
            emptyEl.createEl('p', { text: 'No recurring templates found.' });
            emptyEl.createEl('p', {
                text: `Add .md files with recurrence: in frontmatter to:`,
                cls: 'qb-dashboard-hint'
            });
            emptyEl.createEl('code', { text: this.service.getTemplatesFolder() });

            // Syntax help
            this.renderSyntaxHelp(contentEl);
        } else {
            // Templates table
            this.renderTemplatesTable(contentEl, statuses);

            // Syntax help (collapsible)
            const helpToggle = contentEl.createEl('details', { cls: 'qb-dashboard-help' });
            helpToggle.createEl('summary', { text: '📖 Recurrence Syntax Help' });
            this.renderSyntaxHelp(helpToggle);
        }

        // Footer actions
        const footer = contentEl.createEl('div', { cls: 'qb-dashboard-footer' });

        const refreshBtn = footer.createEl('button', {
            text: '🔄 Process Now',
            cls: 'qb-dashboard-btn qb-btn-primary'
        });
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'Processing...';
            await this.service.processRecurrence();
            this.onRefresh();
            this.close();
        });

        const closeBtn = footer.createEl('button', {
            text: 'Close',
            cls: 'qb-dashboard-btn'
        });
        closeBtn.addEventListener('click', () => this.close());
    }

    private renderTemplatesTable(container: HTMLElement, statuses: TemplateStatus[]): void {
        const table = container.createEl('table', { cls: 'qb-dashboard-table' });

        // Header row
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        headerRow.createEl('th', { text: 'Template' });
        headerRow.createEl('th', { text: 'Schedule' });
        headerRow.createEl('th', { text: 'Next Run' });
        headerRow.createEl('th', { text: 'Today' });

        // Body rows
        const tbody = table.createEl('tbody');
        for (const status of statuses) {
            const row = tbody.createEl('tr');

            // Template name
            const nameCell = row.createEl('td', { cls: 'qb-template-name' });
            nameCell.createEl('span', { text: status.template.questName.replace(/\s*-\s*\{\{date\}\}/g, '') });
            nameCell.createEl('span', {
                text: status.template.category,
                cls: 'qb-template-category'
            });

            // Schedule
            row.createEl('td', { text: status.schedule, cls: 'qb-template-schedule' });

            // Next run
            const nextRunText = status.nextRun || 'Unknown';
            const isToday = status.nextRun === this.service.getTodayDate();
            const nextRunCell = row.createEl('td', {
                text: isToday ? 'Today' : nextRunText,
                cls: `qb-template-next ${isToday ? 'qb-today' : ''}`
            });

            // Today's status
            const statusCell = row.createEl('td', { cls: 'qb-template-status' });
            const statusBadge = statusCell.createEl('span', { cls: 'qb-status-badge' });

            switch (status.todayStatus) {
                case 'generated':
                    statusBadge.textContent = '✅ Generated';
                    statusBadge.addClass('qb-status-generated');
                    break;
                case 'pending':
                    statusBadge.textContent = '⏳ Pending';
                    statusBadge.addClass('qb-status-pending');
                    break;
                case 'not-scheduled':
                    statusBadge.textContent = '⏸ Not today';
                    statusBadge.addClass('qb-status-not-scheduled');
                    break;
            }
        }
    }

    private renderSyntaxHelp(container: HTMLElement): void {
        const helpDiv = container.createEl('div', { cls: 'qb-syntax-help' });

        helpDiv.createEl('h4', { text: 'Supported recurrence values:' });

        const table = helpDiv.createEl('table', { cls: 'qb-syntax-table' });
        const examples = [
            ['daily', 'Every day'],
            ['weekdays', 'Monday through Friday'],
            ['weekends', 'Saturday and Sunday'],
            ['weekly', 'Every Monday (default)'],
            ['weekly:sunday', 'Every Sunday'],
            ['monthly', '1st of each month'],
            ['monday, wednesday, friday', 'Specific days'],
            ['tue, thu', 'Short day names work too'],
        ];

        for (const [value, desc] of examples) {
            const row = table.createEl('tr');
            row.createEl('td').createEl('code', { text: value });
            row.createEl('td', { text: desc });
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
