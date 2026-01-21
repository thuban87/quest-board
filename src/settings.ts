/**
 * Quest Board - Settings
 * 
 * Plugin settings interface, defaults, and settings tab UI.
 * API keys and sensitive data stored here via loadData/saveData.
 */

import { App, PluginSettingTab, Setting, TFolder } from 'obsidian';
import type QuestBoardPlugin from '../main';
import type { Character } from './models/Character';
import type { InventoryItem } from './models/Consumable';
import { Achievement } from './models/Achievement';

// Re-export for convenience
export type { Achievement };

/**
 * UI state that persists across reloads
 */
export interface UIState {
    activeTab: 'board' | 'sheet' | 'sprint';
    filters: {
        category?: string;
        priority?: string;
        searchText?: string;
    };
}

/**
 * Full plugin settings interface
 */
export interface QuestBoardSettings {
    // API Keys (stored securely via loadData/saveData)
    geminiApiKey: string;

    // Storage configuration
    storageFolder: string;
    spriteFolder: string;  // Path to sprite folder (e.g., 'Quest Board/assets/sprites/paladin')
    badgeFolder: string;   // Path to achievement badge images

    // Game settings
    weeklyGoal: number;
    enableTrainingMode: boolean;

    // Character data (stored here instead of hidden folder)
    character: Character | null;

    // Achievements and inventory (stored here instead of hidden folder)
    achievements: Achievement[];
    inventory: InventoryItem[];

    // UI state (persisted)
    uiState: UIState;

    // Custom category-to-stat mappings (e.g., { 'gardening': 'constitution' })
    categoryStatMappings: Record<string, string>;

    // Known categories (auto-populated from completed quests for autocomplete)
    knownCategories: string[];
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: QuestBoardSettings = {
    geminiApiKey: '',
    storageFolder: 'Life/Quest Board',
    spriteFolder: 'Life/Quest Board/assets/sprites/paladin',
    badgeFolder: 'Life/Quest Board/assets/badges',
    weeklyGoal: 8,
    enableTrainingMode: true,
    character: null,
    achievements: [],
    inventory: [],
    uiState: {
        activeTab: 'board',
        filters: {},
    },
    categoryStatMappings: {},
    knownCategories: [],
};

/**
 * Settings tab UI
 */
export class QuestBoardSettingTab extends PluginSettingTab {
    plugin: QuestBoardPlugin;

    constructor(app: App, plugin: QuestBoardPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Quest Board Settings' });

        // API Key Section
        containerEl.createEl('h3', { text: 'AI Integration' });

        new Setting(containerEl)
            .setName('Gemini API Key')
            .setDesc('Required for AI quest generation. Get one at makersuite.google.com')
            .addText(text => {
                text
                    .setPlaceholder('Enter your API key')
                    .setValue(this.plugin.settings.geminiApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.geminiApiKey = value;
                        await this.plugin.saveSettings();
                    });
                // Hide the key for security
                text.inputEl.type = 'password';
                return text;
            });

        // Storage Section
        containerEl.createEl('h3', { text: 'Storage' });

        new Setting(containerEl)
            .setName('Quest Storage Folder')
            .setDesc('Path to the folder where quest files are stored')
            .addText(text => text
                .setPlaceholder('Life/Quest Board')
                .setValue(this.plugin.settings.storageFolder)
                .onChange(async (value) => {
                    this.plugin.settings.storageFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Sprite Folder')
            .setDesc('Path to character sprite folder (must contain south.png)')
            .addText(text => text
                .setPlaceholder('Life/Quest Board/assets/sprites/paladin')
                .setValue(this.plugin.settings.spriteFolder)
                .onChange(async (value) => {
                    this.plugin.settings.spriteFolder = value;
                    await this.plugin.saveSettings();
                }));

        // Game Settings Section
        containerEl.createEl('h3', { text: 'Game Settings' });

        new Setting(containerEl)
            .setName('Weekly Quest Goal')
            .setDesc('Number of quests to complete each week')
            .addSlider(slider => slider
                .setLimits(1, 20, 1)
                .setValue(this.plugin.settings.weeklyGoal)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.weeklyGoal = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Training Mode')
            .setDesc('Enable training mode with separate XP pool (Roman numeral levels I-IV)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableTrainingMode)
                .onChange(async (value) => {
                    this.plugin.settings.enableTrainingMode = value;
                    await this.plugin.saveSettings();
                }));

        // Character Section (if character exists)
        if (this.plugin.settings.character) {
            containerEl.createEl('h3', { text: 'Character' });

            new Setting(containerEl)
                .setName('Character Name')
                .setDesc(this.plugin.settings.character.name)
                .addButton(button => button
                    .setButtonText('Edit Character')
                    .onClick(() => {
                        // TODO: Open character edit modal
                        console.log('Edit character modal - coming soon');
                    }));

            new Setting(containerEl)
                .setName('Class')
                .setDesc(`${this.plugin.settings.character.class} (Level ${this.plugin.settings.character.level})`);
        }

        // Stat Mapping Section
        containerEl.createEl('h3', { text: 'Custom Stat Mappings' });
        containerEl.createEl('p', {
            text: 'Map your custom quest categories to stats. Format: category → stat (e.g., "gardening" → "constitution")',
            cls: 'setting-item-description'
        });

        const statOptions = ['strength', 'intelligence', 'wisdom', 'constitution', 'dexterity', 'charisma'];
        const mappings = this.plugin.settings.categoryStatMappings || {};

        // Show existing mappings
        Object.entries(mappings).forEach(([category, stat]) => {
            new Setting(containerEl)
                .setName(category)
                .setDesc(`Currently mapped to: ${stat}`)
                .addDropdown(dropdown => dropdown
                    .addOptions(Object.fromEntries(statOptions.map(s => [s, s.toUpperCase()])))
                    .setValue(stat)
                    .onChange(async (value) => {
                        this.plugin.settings.categoryStatMappings[category] = value;
                        await this.plugin.saveSettings();
                    }))
                .addButton(button => button
                    .setButtonText('Remove')
                    .onClick(async () => {
                        delete this.plugin.settings.categoryStatMappings[category];
                        await this.plugin.saveSettings();
                        this.display(); // Refresh
                    }));
        });

        // Add new mapping - dropdown for known categories or text for new
        const knownCategories = this.plugin.settings.knownCategories || [];
        let newCategory = '';
        let newStat = 'strength';

        // If we have known categories, show dropdown + option to add new
        if (knownCategories.length > 0) {
            new Setting(containerEl)
                .setName('Map Existing Category')
                .setDesc('Select from categories you\'ve used in quests')
                .addDropdown(dropdown => {
                    dropdown.addOption('', '-- Select category --');
                    knownCategories
                        .filter(c => !mappings[c]) // Exclude already mapped
                        .forEach(cat => dropdown.addOption(cat, cat));
                    dropdown.onChange(value => { newCategory = value.toLowerCase().trim(); });
                })
                .addDropdown(dropdown => dropdown
                    .addOptions(Object.fromEntries(statOptions.map(s => [s, s.toUpperCase()])))
                    .setValue('strength')
                    .onChange(value => { newStat = value; }))
                .addButton(button => button
                    .setButtonText('Add')
                    .onClick(async () => {
                        if (newCategory) {
                            this.plugin.settings.categoryStatMappings[newCategory] = newStat;
                            await this.plugin.saveSettings();
                            this.display();
                        }
                    }));
        }

        // Always allow adding a completely new category by typing
        new Setting(containerEl)
            .setName('Add New Category')
            .setDesc('Type a new category name to map')
            .addText(text => text
                .setPlaceholder('e.g., gardening')
                .onChange(value => { newCategory = value.toLowerCase().trim(); }))
            .addDropdown(dropdown => dropdown
                .addOptions(Object.fromEntries(statOptions.map(s => [s, s.toUpperCase()])))
                .setValue('strength')
                .onChange(value => { newStat = value; }))
            .addButton(button => button
                .setButtonText('Add')
                .onClick(async () => {
                    if (newCategory) {
                        this.plugin.settings.categoryStatMappings[newCategory] = newStat;
                        // Also add to known categories if not already there
                        if (!this.plugin.settings.knownCategories.includes(newCategory)) {
                            this.plugin.settings.knownCategories.push(newCategory);
                        }
                        await this.plugin.saveSettings();
                        this.display();
                    }
                }));

        // Debug Section (only in development)
        containerEl.createEl('h3', { text: 'Debug' });

        // Reset Stats Only - surgical fix for corrupted stat data
        new Setting(containerEl)
            .setName('Reset Stats Only')
            .setDesc('Reset statBonuses and category XP accumulators to zero (keeps XP, level, achievements)')
            .addButton(button => button
                .setButtonText('Reset Stats')
                .onClick(async () => {
                    if (this.plugin.settings.character) {
                        this.plugin.settings.character.statBonuses = {
                            strength: 0,
                            intelligence: 0,
                            wisdom: 0,
                            constitution: 0,
                            dexterity: 0,
                            charisma: 0,
                        };
                        this.plugin.settings.character.categoryXPAccumulator = {};
                        await this.plugin.saveSettings();
                        alert('Stats reset! Reload Obsidian to see changes.');
                    }
                }));

        new Setting(containerEl)
            .setName('Reset All Data')
            .setDesc('⚠️ This will delete all character progress, achievements, and inventory')
            .addButton(button => button
                .setButtonText('Reset')
                .setWarning()
                .onClick(async () => {
                    if (confirm('Are you sure? This cannot be undone.')) {
                        this.plugin.settings.character = null;
                        this.plugin.settings.achievements = [];
                        this.plugin.settings.inventory = [];
                        await this.plugin.saveSettings();
                        this.display(); // Refresh the settings tab
                    }
                }));
    }
}
