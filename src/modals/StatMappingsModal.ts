/**
 * Stat Mappings Modal
 * 
 * Map quest categories to character stats for XP distribution.
 * Supports both known categories and manual entry of new categories.
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import type QuestBoardPlugin from '../../main';

const STAT_OPTIONS = ['strength', 'intelligence', 'wisdom', 'constitution', 'dexterity', 'charisma'] as const;
type StatType = typeof STAT_OPTIONS[number];

export class StatMappingsModal extends Modal {
    private plugin: QuestBoardPlugin;
    private mappings: Record<string, string>;

    constructor(app: App, plugin: QuestBoardPlugin) {
        super(app);
        this.plugin = plugin;
        // Deep copy to allow cancel without saving
        this.mappings = { ...plugin.settings.categoryStatMappings };
    }

    async onOpen(): Promise<void> {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-stat-mappings-modal');

        // Header
        contentEl.createEl('h2', { text: 'Custom Stat Mappings' });
        contentEl.createEl('p', {
            text: 'Map quest categories to character stats for XP distribution.',
            cls: 'modal-description'
        });

        const categories = Object.keys(this.mappings);

        // Existing mappings table
        if (categories.length > 0) {
            const table = contentEl.createEl('table', { cls: 'qb-mappings-table' });
            const thead = table.createEl('thead');
            const headerRow = thead.createEl('tr');
            headerRow.createEl('th', { text: 'Category' });
            headerRow.createEl('th', { text: 'Stat' });
            headerRow.createEl('th', { text: 'Actions' });

            const tbody = table.createEl('tbody');

            for (const category of categories) {
                const row = tbody.createEl('tr');

                // Category name
                row.createEl('td', { text: category });

                // Stat dropdown
                const statCell = row.createEl('td');
                const select = statCell.createEl('select', { cls: 'dropdown' });

                for (const stat of STAT_OPTIONS) {
                    const option = select.createEl('option', {
                        text: stat.toUpperCase(),
                        value: stat
                    });
                    if (this.mappings[category] === stat) {
                        option.selected = true;
                    }
                }

                select.addEventListener('change', () => {
                    this.mappings[category] = select.value;
                });

                // Delete button
                const actionsCell = row.createEl('td');
                const deleteBtn = actionsCell.createEl('button', {
                    text: 'Delete',
                    cls: 'mod-warning'
                });
                deleteBtn.addEventListener('click', () => {
                    delete this.mappings[category];
                    this.onOpen(); // Refresh
                });
            }
        } else {
            contentEl.createEl('p', {
                text: 'No custom mappings yet. Add one below.',
                cls: 'qb-empty-state'
            });
        }

        // Add new mapping section
        const addSection = contentEl.createDiv({ cls: 'qb-add-mapping' });
        addSection.createEl('h4', { text: 'Add New Mapping' });

        // Get unmapped known categories
        const knownCategories = this.plugin.settings.knownCategories || [];
        const unmappedCategories = knownCategories.filter(c => !this.mappings[c]);

        let selectedCategory = '';
        let selectedStat: StatType = 'strength';

        // Add from existing categories (if any unmapped)
        if (unmappedCategories.length > 0) {
            new Setting(addSection)
                .setName('From Existing Category')
                .setDesc('Select from categories you\'ve used in quests')
                .addDropdown(dropdown => {
                    dropdown.addOption('', '-- Select --');
                    unmappedCategories.forEach(cat => dropdown.addOption(cat, cat));
                    dropdown.onChange(value => { selectedCategory = value; });
                })
                .addDropdown(dropdown => {
                    STAT_OPTIONS.forEach(s => dropdown.addOption(s, s.toUpperCase()));
                    dropdown.onChange(value => { selectedStat = value as StatType; });
                })
                .addButton(button => button
                    .setButtonText('Add')
                    .onClick(() => {
                        if (selectedCategory) {
                            this.mappings[selectedCategory] = selectedStat;
                            this.onOpen(); // Refresh
                        }
                    }));
        }

        // Add new category manually
        let manualCategory = '';
        let manualStat: StatType = 'strength';

        new Setting(addSection)
            .setName('New Category')
            .setDesc('Type a new category name')
            .addText(text => text
                .setPlaceholder('e.g., fitness, reading')
                .onChange(value => { manualCategory = value.toLowerCase().trim(); }))
            .addDropdown(dropdown => {
                STAT_OPTIONS.forEach(s => dropdown.addOption(s, s.toUpperCase()));
                dropdown.onChange(value => { manualStat = value as StatType; });
            })
            .addButton(button => button
                .setButtonText('Add')
                .onClick(() => {
                    if (manualCategory && !this.mappings[manualCategory]) {
                        this.mappings[manualCategory] = manualStat;

                        // Also add to known categories if not already there
                        if (!this.plugin.settings.knownCategories.includes(manualCategory)) {
                            this.plugin.settings.knownCategories.push(manualCategory);
                        }

                        this.onOpen(); // Refresh
                    } else if (this.mappings[manualCategory]) {
                        new Notice('Category already mapped');
                    }
                }));

        // Footer with Save/Cancel
        const footer = contentEl.createDiv({ cls: 'modal-button-container' });

        const cancelBtn = footer.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());

        const saveBtn = footer.createEl('button', { text: 'Save', cls: 'mod-cta' });
        saveBtn.addEventListener('click', async () => {
            this.plugin.settings.categoryStatMappings = this.mappings;
            await this.plugin.saveSettings();
            new Notice('✓ Stat mappings saved');
            this.close();
        });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
