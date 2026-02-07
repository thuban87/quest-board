/**
 * Scroll Library Modal (Template Gallery)
 * 
 * "The Scroll Library" - A gallery view for managing quest templates
 * with smart suggestions, usage stats, filters, and RPG theming.
 */

import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { TemplateService, ParsedTemplate } from '../services/TemplateService';
import { getTemplateStatsService, TemplateStats } from '../services/TemplateStatsService';

/** Sort options for the template grid */
type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

/** Template type derived from questType */
type TemplateType = 'standard' | 'recurring' | 'daily-note' | 'watched-folder';

/**
 * The Scroll Library - Template gallery modal
 */
export class ScrollLibraryModal extends Modal {
    private plugin: QuestBoardPlugin;
    private templateService: TemplateService;
    private templates: TFile[] = [];
    private parsedTemplates: Map<string, ParsedTemplate> = new Map();

    // Filter/sort state
    private searchTerm = '';
    private filterQuestType = '';     // '' = all
    private filterTemplateType = '';  // '' = all
    private filterCategory = '';      // '' = all
    private sortOption: SortOption = 'name-asc';

    // Container references for re-rendering
    private contentContainer: HTMLElement | null = null;

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

        // Action bar (button + search)
        const actionBar = contentEl.createDiv({ cls: 'qb-scroll-library-actions' });

        const createBtn = actionBar.createEl('button', {
            text: '🪶 Draft New Scroll',
            cls: 'qb-btn qb-btn-primary'
        });
        createBtn.addEventListener('click', () => {
            this.close();
            this.openScrivenersQuill();
        });

        const searchContainer = actionBar.createDiv({ cls: 'qb-scroll-search' });
        const searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: '🔍 Search scrolls...',
            cls: 'qb-scroll-search-input'
        });
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
            this.refreshContent();
        });

        // Content container
        this.contentContainer = contentEl.createDiv({ cls: 'qb-scroll-library-content' });
        this.contentContainer.createEl('p', { text: 'Loading scrolls...', cls: 'qb-loading' });

        // Load templates
        await this.loadTemplates();

        // Render filter bar (after templates loaded so dropdowns are populated)
        this.renderFilterBar(contentEl, this.contentContainer);

        // Clear loading and render
        this.contentContainer.empty();
        this.renderContent(this.contentContainer);
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
     * Render the filter bar with dropdowns and sort
     */
    private renderFilterBar(parentEl: HTMLElement, beforeEl: HTMLElement): void {
        const filterBar = parentEl.createDiv({ cls: 'qb-scroll-filter-bar' });
        // Insert before the content container
        parentEl.insertBefore(filterBar, beforeEl);

        // Collect unique values from parsed templates
        const questTypes = new Set<string>();
        const categories = new Set<string>();
        const templateTypes = new Set<string>();

        for (const parsed of this.parsedTemplates.values()) {
            if (parsed.questType) questTypes.add(parsed.questType);
            if (parsed.category) categories.add(parsed.category);
            templateTypes.add(this.deriveTemplateType(parsed.questType));
        }

        // Quest Type filter
        const qtSelect = this.createFilterDropdown(filterBar, '⚔️ Quest Type', questTypes, (val) => {
            this.filterQuestType = val;
            this.refreshContent();
        });

        // Template Type filter
        const ttLabels: Record<string, string> = {
            'standard': '📋 Standard',
            'recurring': '🔄 Recurring',
            'daily-note': '📅 Daily Note',
            'watched-folder': '📂 Watched Folder',
        };
        const ttSelect = this.createFilterDropdown(
            filterBar,
            '📜 Template Type',
            templateTypes,
            (val) => {
                this.filterTemplateType = val;
                this.refreshContent();
            },
            ttLabels
        );

        // Category filter
        const catSelect = this.createFilterDropdown(filterBar, '🏷️ Category', categories, (val) => {
            this.filterCategory = val;
            this.refreshContent();
        });

        // Sort dropdown
        const sortContainer = filterBar.createDiv({ cls: 'qb-scroll-filter-item' });
        const sortSelect = sortContainer.createEl('select', { cls: 'qb-scroll-filter-select' });
        const sortOptions: { value: SortOption; label: string }[] = [
            { value: 'name-asc', label: '📝 Name A→Z' },
            { value: 'name-desc', label: '📝 Name Z→A' },
            { value: 'date-desc', label: '📅 Newest first' },
            { value: 'date-asc', label: '📅 Oldest first' },
        ];
        for (const opt of sortOptions) {
            sortSelect.createEl('option', { value: opt.value, text: opt.label });
        }
        sortSelect.value = this.sortOption;
        sortSelect.addEventListener('change', () => {
            this.sortOption = sortSelect.value as SortOption;
            this.refreshContent();
        });
    }

    /**
     * Create a dropdown filter with "All" option
     */
    private createFilterDropdown(
        container: HTMLElement,
        label: string,
        values: Set<string>,
        onChange: (val: string) => void,
        labelOverrides?: Record<string, string>
    ): HTMLSelectElement {
        const wrapper = container.createDiv({ cls: 'qb-scroll-filter-item' });
        const select = wrapper.createEl('select', { cls: 'qb-scroll-filter-select' });

        // "All" option
        select.createEl('option', { value: '', text: label });

        // Sort values alphabetically
        const sorted = Array.from(values).sort();
        for (const val of sorted) {
            const displayText = labelOverrides?.[val] || this.titleCase(val);
            select.createEl('option', { value: val, text: displayText });
        }

        select.addEventListener('change', () => onChange(select.value));
        return select;
    }

    /**
     * Derive template type from questType field
     */
    private deriveTemplateType(questType: string): TemplateType {
        switch (questType) {
            case 'recurring': return 'recurring';
            case 'daily-quest': return 'daily-note';
            case 'watched-folder': return 'watched-folder';
            default: return 'standard';
        }
    }

    /**
     * Refresh just the content area (preserves filter bar)
     */
    private refreshContent(): void {
        if (!this.contentContainer) return;
        this.contentContainer.empty();
        this.renderContent(this.contentContainer);
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

        // Quick Picks row (combined Favorites + Similar)
        if (statsService && this.searchTerm === '' && !this.filterQuestType && !this.filterTemplateType && !this.filterCategory) {
            this.renderQuickPicks(container, statsService);
        }

        // All Scrolls section (filtered + sorted)
        this.renderAllTemplates(container);
    }

    /**
     * Render the combined Quick Picks row (Favorites + Similar)
     */
    private renderQuickPicks(container: HTMLElement, statsService: ReturnType<typeof getTemplateStatsService>): void {
        if (!statsService) return;

        const favorites = statsService.getTopTemplates(3);
        const similar = statsService.getSimilarTemplates(3);

        // Only show similar if top result differs from top favorite
        const showSimilar = similar.length > 0 && similar[0].templatePath !== favorites[0]?.templatePath;

        // Nothing to show?
        if (favorites.length === 0 && !showSimilar) return;

        const section = container.createDiv({ cls: 'qb-scroll-section' });
        section.createEl('h3', { text: '🌟 Quick Picks', cls: 'qb-scroll-section-title' });

        const row = section.createDiv({ cls: 'qb-quick-picks-row' });

        // Favorites group
        if (favorites.length > 0) {
            const favGroup = row.createDiv({ cls: 'qb-quick-picks-group' });
            favGroup.createEl('span', { text: 'Your Favorites', cls: 'qb-quick-picks-label' });
            const favGrid = favGroup.createDiv({ cls: 'qb-scroll-grid qb-scroll-grid-small' });

            for (const stat of favorites) {
                const parsed = this.parsedTemplates.get(stat.templatePath);
                if (parsed) {
                    this.renderTemplateCard(favGrid, parsed, stat);
                }
            }
        }

        // Divider + Similar group
        if (showSimilar && favorites.length > 0) {
            row.createDiv({ cls: 'qb-quick-picks-divider' });
        }

        if (showSimilar) {
            const lastCategory = statsService.getLastQuestCategory();
            const simGroup = row.createDiv({ cls: 'qb-quick-picks-group' });
            simGroup.createEl('span', {
                text: `Similar to Last (${lastCategory})`,
                cls: 'qb-quick-picks-label'
            });
            const simGrid = simGroup.createDiv({ cls: 'qb-scroll-grid qb-scroll-grid-small' });

            for (const stat of similar) {
                const parsed = this.parsedTemplates.get(stat.templatePath);
                if (parsed) {
                    this.renderTemplateCard(simGrid, parsed, stat);
                }
            }
        }
    }

    /**
     * Render all templates in a grid (with filter + sort applied)
     */
    private renderAllTemplates(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'qb-scroll-section qb-scroll-section-all' });
        section.createEl('h3', { text: '📜 All Scrolls', cls: 'qb-scroll-section-title' });

        const grid = section.createDiv({ cls: 'qb-scroll-grid' });

        const statsService = getTemplateStatsService();
        const allStats = statsService?.getStats() ?? {};

        // Build filtered + sorted list
        let entries = this.templates
            .map(t => ({
                file: t,
                parsed: this.parsedTemplates.get(t.path),
            }))
            .filter(e => e.parsed != null) as { file: TFile; parsed: ParsedTemplate }[];

        // Apply search filter
        if (this.searchTerm) {
            entries = entries.filter(e => {
                const name = e.parsed.name.toLowerCase();
                const category = (e.parsed.category || '').toLowerCase();
                const type = (e.parsed.questType || '').toLowerCase();
                const tagline = (e.parsed.tagline || '').toLowerCase();
                return name.includes(this.searchTerm)
                    || category.includes(this.searchTerm)
                    || type.includes(this.searchTerm)
                    || tagline.includes(this.searchTerm);
            });
        }

        // Apply dropdown filters
        if (this.filterQuestType) {
            entries = entries.filter(e => e.parsed.questType === this.filterQuestType);
        }
        if (this.filterTemplateType) {
            entries = entries.filter(e => this.deriveTemplateType(e.parsed.questType) === this.filterTemplateType);
        }
        if (this.filterCategory) {
            entries = entries.filter(e => e.parsed.category === this.filterCategory);
        }

        // Apply sort
        entries.sort((a, b) => {
            switch (this.sortOption) {
                case 'name-asc':
                    return a.parsed.name.localeCompare(b.parsed.name);
                case 'name-desc':
                    return b.parsed.name.localeCompare(a.parsed.name);
                case 'date-desc':
                    return (b.file.stat?.ctime ?? 0) - (a.file.stat?.ctime ?? 0);
                case 'date-asc':
                    return (a.file.stat?.ctime ?? 0) - (b.file.stat?.ctime ?? 0);
                default:
                    return 0;
            }
        });

        // Render results or empty state
        if (entries.length === 0) {
            grid.createEl('p', {
                text: 'No scrolls match your filters.',
                cls: 'qb-scroll-no-results'
            });
        } else {
            for (const entry of entries) {
                const stats = allStats[entry.file.path];
                this.renderTemplateCard(grid, entry.parsed, stats);
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

        // Tagline (if available)
        if (parsed.tagline) {
            card.createEl('div', {
                text: parsed.tagline,
                cls: 'qb-scroll-card-tagline'
            });
        }

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
            'daily-quest': '📅',
            'watched-folder': '📂',
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
        // Open the full editor — same as right-click → Edit
        this.openScrivenersQuill(parsed);
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
