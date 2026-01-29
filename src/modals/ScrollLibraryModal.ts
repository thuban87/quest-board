/**
 * Scroll Library Modal (Template Gallery)
 * 
 * "The Scroll Library" - A gallery view for managing quest templates
 * with smart suggestions, usage stats, and RPG theming.
 */

import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { TemplateService, ParsedTemplate } from '../services/TemplateService';
import { getTemplateStatsService, TemplateStats } from '../services/TemplateStatsService';
import { DynamicTemplateModal } from './SmartTemplateModal';

/**
 * The Scroll Library - Template gallery modal
 */
export class ScrollLibraryModal extends Modal {
    private plugin: QuestBoardPlugin;
    private templateService: TemplateService;
    private templates: TFile[] = [];
    private parsedTemplates: Map<string, ParsedTemplate> = new Map();

    constructor(app: App, plugin: QuestBoardPlugin) {
        super(app);
        this.plugin = plugin;
        this.templateService = new TemplateService(app.vault);
    }

    async onOpen(): Promise<void> {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        modalEl.addClass('qb-scroll-library-modal');
        contentEl.addClass('qb-scroll-library-content-el');

        // Header
        contentEl.createEl('h2', { text: '📚 The Scroll Library' });
        contentEl.createEl('p', {
            text: 'Choose a scroll to create a new quest',
            cls: 'qb-scroll-library-subtitle'
        });

        // Action bar
        const actionBar = contentEl.createDiv({ cls: 'qb-scroll-library-actions' });

        // Create new template button
        const createBtn = actionBar.createEl('button', {
            text: '🪶 Draft New Scroll',
            cls: 'qb-btn qb-btn-primary'
        });
        createBtn.addEventListener('click', () => {
            this.close();
            this.openScrivenersQuill();
        });

        // Search input
        const searchContainer = actionBar.createDiv({ cls: 'qb-scroll-search' });
        const searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: '🔍 Search scrolls...',
            cls: 'qb-scroll-search-input'
        });
        searchInput.addEventListener('input', (e) => {
            this.filterTemplates((e.target as HTMLInputElement).value);
        });

        // Content container
        const contentContainer = contentEl.createDiv({ cls: 'qb-scroll-library-content' });

        // Show loading state
        contentContainer.createEl('p', { text: 'Loading scrolls...', cls: 'qb-loading' });

        // Load templates
        await this.loadTemplates();

        // Clear loading and render
        contentContainer.empty();
        this.renderContent(contentContainer);
    }

    /**
     * Load all templates from the template folder
     */
    private async loadTemplates(): Promise<void> {
        const templateFolder = this.plugin.settings.templateFolder || 'Quest Board/templates';
        this.templates = await this.templateService.getTemplatesInFolder(templateFolder);

        // Parse each template SEQUENTIALLY to avoid EBUSY file lock errors
        for (const file of this.templates) {
            try {
                const parsed = await this.templateService.parseTemplate(file.path);
                if (parsed) {
                    this.parsedTemplates.set(file.path, parsed);
                }
            } catch (error) {
                console.error(`[ScrollLibraryModal] Failed to parse ${file.path}:`, error);
            }
        }
    }

    /**
     * Render the main content
     */
    private renderContent(container: HTMLElement): void {
        const statsService = getTemplateStatsService();

        // Empty state
        if (this.templates.length === 0) {
            const emptyState = container.createDiv({ cls: 'qb-scroll-empty-state' });
            emptyState.createEl('div', { text: '📜', cls: 'qb-empty-icon' });
            emptyState.createEl('p', { text: 'Your scroll library awaits.' });
            emptyState.createEl('p', { text: 'Craft your first template to get started!' });

            const createBtn = emptyState.createEl('button', {
                text: '🪶 Draft New Scroll',
                cls: 'qb-btn qb-btn-primary'
            });
            createBtn.addEventListener('click', () => {
                this.close();
                this.openScrivenersQuill();
            });
            return;
        }

        // Smart suggestions section (if we have usage data)
        if (statsService) {
            const favorites = statsService.getTopTemplates(3);
            const similar = statsService.getSimilarTemplates(3);

            // Your Favorites section
            if (favorites.length > 0) {
                this.renderSection(container, '🌟 Your Favorites', favorites);
            }

            // Similar to Last Quest section
            if (similar.length > 0 && similar[0].templatePath !== favorites[0]?.templatePath) {
                const lastCategory = statsService.getLastQuestCategory();
                this.renderSection(
                    container,
                    `💫 Similar to Last Quest (${lastCategory})`,
                    similar
                );
            }
        }

        // All Scrolls section
        this.renderAllTemplates(container);
    }

    /**
     * Render a suggestion section
     */
    private renderSection(container: HTMLElement, title: string, stats: TemplateStats[]): void {
        const section = container.createDiv({ cls: 'qb-scroll-section' });
        section.createEl('h3', { text: title, cls: 'qb-scroll-section-title' });

        const grid = section.createDiv({ cls: 'qb-scroll-grid qb-scroll-grid-small' });

        for (const stat of stats) {
            const parsed = this.parsedTemplates.get(stat.templatePath);
            if (parsed) {
                this.renderTemplateCard(grid, parsed, stat);
            }
        }
    }

    /**
     * Render all templates in a grid
     */
    private renderAllTemplates(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'qb-scroll-section qb-scroll-section-all' });
        section.createEl('h3', { text: '📜 All Scrolls', cls: 'qb-scroll-section-title' });

        const grid = section.createDiv({ cls: 'qb-scroll-grid' });

        const statsService = getTemplateStatsService();
        const allStats = statsService?.getStats() ?? {};

        for (const template of this.templates) {
            const parsed = this.parsedTemplates.get(template.path);
            if (parsed) {
                const stats = allStats[template.path];
                this.renderTemplateCard(grid, parsed, stats);
            }
        }
    }

    /**
     * Render a single template card
     */
    private renderTemplateCard(
        container: HTMLElement,
        parsed: ParsedTemplate,
        stats?: TemplateStats
    ): void {
        const card = container.createDiv({ cls: 'qb-scroll-card' });

        // Click to use template
        card.addEventListener('click', () => {
            this.selectTemplate(parsed);
        });

        // Template icon based on quest type
        const icon = this.getTemplateIcon(parsed.questType);
        const iconEl = card.createDiv({ cls: 'qb-scroll-card-icon' });
        iconEl.textContent = icon;

        // Template name
        const name = parsed.name
            .replace(/\{\{.*?\}\}/g, '')  // Remove placeholders from display
            .replace(/-template$/i, '')
            .trim() || 'Untitled Template';
        card.createEl('div', { text: name, cls: 'qb-scroll-card-name' });

        // Quest type badge
        if (parsed.questType) {
            const typeBadge = card.createDiv({ cls: `qb-scroll-card-type qb-type-${parsed.questType}` });
            typeBadge.textContent = this.titleCase(parsed.questType);
        }

        // Category if available
        if (parsed.category) {
            card.createEl('div', {
                text: parsed.category,
                cls: 'qb-scroll-card-category'
            });
        }

        // Usage stats
        if (stats && stats.timesUsed > 0) {
            const statsEl = card.createDiv({ cls: 'qb-scroll-card-stats' });
            statsEl.textContent = `⚔️ ${stats.timesUsed}x invoked`;
        }

        // Context menu (right-click)
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, parsed);
        });
    }

    /**
     * Get icon for template based on quest type
     */
    private getTemplateIcon(questType: string): string {
        const icons: Record<string, string> = {
            main: '⚔️',
            side: '📋',
            training: '🎯',
            guild: '🏛️',
            recurring: '🔄',
            daily: '📅',
        };
        return icons[questType?.toLowerCase()] || '📜';
    }

    /**
     * Title case a string
     */
    private titleCase(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Select a template and open the dynamic form
     */
    private selectTemplate(parsed: ParsedTemplate): void {
        this.close();
        new DynamicTemplateModal(this.app, this.plugin, parsed).open();
    }

    /**
     * Show context menu for template actions
     */
    private showContextMenu(e: MouseEvent, parsed: ParsedTemplate): void {
        // Create a simple context menu using Obsidian's menu system
        const menu = new (require('obsidian')).Menu();

        menu.addItem((item: any) => {
            item.setTitle('📝 Revise the Contract')
                .setIcon('edit')
                .onClick(() => {
                    this.close();
                    this.openScrivenersQuill(parsed);
                });
        });

        menu.addItem((item: any) => {
            item.setTitle('📋 Copy the Scroll')
                .setIcon('copy')
                .onClick(() => {
                    this.duplicateTemplate(parsed);
                });
        });

        menu.addSeparator();

        menu.addItem((item: any) => {
            item.setTitle('🔥 Burn the Scroll')
                .setIcon('trash')
                .onClick(() => {
                    this.confirmDeleteTemplate(parsed);
                });
        });

        menu.showAtMouseEvent(e);
    }

    /**
     * Filter templates by search term
     */
    private filterTemplates(searchTerm: string): void {
        const term = searchTerm.toLowerCase();
        const allCards = this.contentEl.querySelectorAll('.qb-scroll-card');

        allCards.forEach((card) => {
            const name = card.querySelector('.qb-scroll-card-name')?.textContent?.toLowerCase() ?? '';
            const category = card.querySelector('.qb-scroll-card-category')?.textContent?.toLowerCase() ?? '';
            const type = card.querySelector('.qb-scroll-card-type')?.textContent?.toLowerCase() ?? '';

            const matches = name.includes(term) || category.includes(term) || type.includes(term);
            (card as HTMLElement).style.display = matches ? '' : 'none';
        });
    }

    /**
     * Open the Scrivener's Quill (template builder)
     */
    private async openScrivenersQuill(existingTemplate?: ParsedTemplate): Promise<void> {
        const { ScrivenersQuillModal } = await import('./ScrivenersQuillModal');
        new ScrivenersQuillModal(this.app, this.plugin, existingTemplate).open();
    }

    /**
     * Duplicate a template
     */
    private async duplicateTemplate(parsed: ParsedTemplate): Promise<void> {
        try {
            const originalFile = this.app.vault.getAbstractFileByPath(parsed.path);
            if (!(originalFile instanceof TFile)) {
                new Notice('❌ Template file not found');
                return;
            }

            const content = await this.app.vault.read(originalFile);
            const newName = `${originalFile.basename}-copy.md`;
            const newPath = parsed.path.replace(originalFile.name, newName);

            await this.app.vault.create(newPath, content);
            new Notice(`📋 Scroll copied: ${newName}`);

            // Refresh the modal
            this.onOpen();
        } catch (error) {
            console.error('[ScrollLibraryModal] Failed to duplicate:', error);
            new Notice('❌ Failed to copy scroll');
        }
    }

    /**
     * Confirm and delete a template
     */
    private async confirmDeleteTemplate(parsed: ParsedTemplate): Promise<void> {
        const confirm = window.confirm(
            `🔥 Burn the Scroll?\n\nThis will permanently delete "${parsed.name}".\n\nThis action cannot be undone.`
        );

        if (confirm) {
            try {
                const file = this.app.vault.getAbstractFileByPath(parsed.path);
                if (file instanceof TFile) {
                    await this.app.vault.delete(file);
                    new Notice('🔥 Scroll burned');
                    this.onOpen(); // Refresh
                }
            } catch (error) {
                console.error('[ScrollLibraryModal] Failed to delete:', error);
                new Notice('❌ Failed to burn scroll');
            }
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/**
 * Open the Scroll Library modal
 */
export function openScrollLibraryModal(app: App, plugin: QuestBoardPlugin): void {
    new ScrollLibraryModal(app, plugin).open();
}
