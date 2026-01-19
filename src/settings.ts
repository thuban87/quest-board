/**
 * Quest Board - Settings
 * 
 * Plugin settings interface, defaults, and settings tab UI.
 * API keys and sensitive data stored here via loadData/saveData.
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import type QuestBoardPlugin from '../main';
import type { Character } from './models/Character';
import type { InventoryItem } from './models/Consumable';

/**
 * Achievement data structure
 */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    dateUnlocked: string;
}

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
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: QuestBoardSettings = {
    geminiApiKey: '',
    storageFolder: 'Life/Quest Board',
    weeklyGoal: 8,
    enableTrainingMode: true,
    character: null,
    achievements: [],
    inventory: [],
    uiState: {
        activeTab: 'board',
        filters: {},
    },
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

        // Debug Section (only in development)
        containerEl.createEl('h3', { text: 'Debug' });

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
