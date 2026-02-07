/**
 * Template Preview Modal
 * 
 * Shows an HTML replica of how a quest card would look on the kanban board,
 * built from the current template editor state. Uses the same CSS classes
 * as the real QuestCard component for visual consistency.
 */

import { App, Modal } from 'obsidian';
import { QuestPriority } from '../models/QuestStatus';

/**
 * A section with a header and its tasks
 */
export interface PreviewSection {
    headerText: string;
    tasks: string[];
}

/**
 * Data needed to render the preview card
 */
export interface TemplatePreviewData {
    questName: string;
    category: string;
    priority: string;
    xpPerTask: number;
    completionBonus: number;
    visibleTasks: number;
    sections: PreviewSection[];  // Tasks grouped by section headers
    totalTasks: number;          // Total task count across all sections
    tagline?: string;
    questType: string;
    status: string;
}

/**
 * Priority icon mapping
 */
const PRIORITY_ICONS: Record<string, string> = {
    [QuestPriority.LOW]: '📎',
    [QuestPriority.MEDIUM]: '📌',
    [QuestPriority.HIGH]: '🔥',
    [QuestPriority.CRITICAL]: '🚨',
};

/**
 * Template Preview Modal - renders an HTML replica quest card
 */
export class TemplatePreviewModal extends Modal {
    private data: TemplatePreviewData;

    constructor(app: App, data: TemplatePreviewData) {
        super(app);
        this.data = data;
    }

    onOpen(): void {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        modalEl.addClass('qb-template-preview-modal');

        // Header
        contentEl.createEl('h2', { text: '👁️ Quest Card Preview' });
        contentEl.createEl('p', {
            text: 'This is how the quest will appear on your kanban board',
            cls: 'setting-item-description'
        });

        // Preview container (adds a subtle kanban column look)
        const previewContainer = contentEl.createDiv({ cls: 'qb-preview-column-wrapper' });

        // Build the quest card replica using the same CSS classes
        this.renderQuestCard(previewContainer);

        // Footer info
        const info = contentEl.createDiv({ cls: 'qb-preview-info' });
        info.createEl('p', {
            text: `📁 Type: ${this.data.questType} | 📊 Status: ${this.data.status}`,
            cls: 'setting-item-description'
        });

        if (this.data.tagline) {
            info.createEl('p', {
                text: `💬 "${this.data.tagline}"`,
                cls: 'setting-item-description'
            });
        }

        // Close button
        const footer = contentEl.createDiv({ cls: 'qb-preview-footer' });
        const closeBtn = footer.createEl('button', {
            text: 'Close',
            cls: 'qb-btn qb-btn-secondary'
        });
        closeBtn.addEventListener('click', () => this.close());
    }

    /**
     * Render an HTML replica of the QuestCard component
     */
    private renderQuestCard(container: HTMLElement): void {
        const card = container.createDiv({ cls: 'qb-quest-card' });
        const totalTasks = this.data.totalTasks;

        // Card Header: title + priority icon
        const header = card.createDiv({ cls: 'qb-card-header' });
        const questName = this.data.questName || 'Untitled Quest';
        header.createEl('span', { text: questName, cls: 'qb-card-title' });
        header.createEl('span', {
            text: PRIORITY_ICONS[this.data.priority] || '📌',
            cls: 'qb-card-priority'
        });

        // Category
        if (this.data.category) {
            card.createDiv({
                text: this.data.category,
                cls: 'qb-card-category'
            });
        }

        // Sections with tasks (mirrors QuestCard.renderSections)
        if (this.data.sections.length > 0) {
            const sectionsContainer = card.createDiv({ cls: 'qb-card-sections' });

            for (const section of this.data.sections) {
                // Skip sections with no tasks (matches real QuestCard behavior)
                if (section.tasks.length === 0) continue;

                const sectionEl = sectionsContainer.createDiv({ cls: 'qb-section' });

                // Section header (like the real quest card)
                if (section.headerText) {
                    const sectionHeader = sectionEl.createDiv({ cls: 'qb-section-header' });
                    sectionHeader.createEl('span', { text: '▼', cls: 'qb-section-toggle' });
                    sectionHeader.createEl('span', { text: '📋', cls: 'qb-section-icon' });
                    sectionHeader.createEl('span', {
                        text: section.headerText,
                        cls: 'qb-section-title'
                    });
                    sectionHeader.createEl('span', {
                        text: `(0/${section.tasks.length})`,
                        cls: 'qb-section-badge'
                    });
                }

                // Tasks under this section
                if (section.tasks.length > 0) {
                    const tasksContainer = sectionEl.createDiv({ cls: 'qb-section-tasks' });
                    const visibleTasks = section.tasks.slice(0, this.data.visibleTasks);
                    const hiddenCount = section.tasks.length - visibleTasks.length;

                    for (const taskText of visibleTasks) {
                        const taskItem = tasksContainer.createDiv({ cls: 'qb-task-item' });
                        taskItem.createEl('span', { text: '☐', cls: 'qb-task-checkbox' });
                        taskItem.createEl('span', { text: taskText, cls: 'qb-task-text' });
                    }

                    if (hiddenCount > 0) {
                        tasksContainer.createDiv({
                            text: `+${hiddenCount} more task${hiddenCount > 1 ? 's' : ''}`,
                            cls: 'qb-tasks-hidden'
                        });
                    }
                }
            }
        }

        // Progress bar (0% since it's a preview)
        if (totalTasks > 0) {
            const progress = card.createDiv({ cls: 'qb-card-progress' });
            const bar = progress.createDiv({ cls: 'qb-progress-bar' });
            const fill = bar.createDiv({ cls: 'qb-progress-fill' });
            fill.style.width = '0%';
            progress.createEl('span', {
                text: `0/${totalTasks} tasks`,
                cls: 'qb-progress-text'
            });
        }

        // XP reward line
        const totalXP = (this.data.xpPerTask * totalTasks) + this.data.completionBonus;
        card.createDiv({
            text: `⭐ ${totalXP} XP`,
            cls: 'qb-card-xp'
        });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
