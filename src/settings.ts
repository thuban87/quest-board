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
import { lootGenerationService } from './services/LootGenerationService';
import { GearSlot } from './models/Gear';

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

    // Streak mode: 'quest' requires completing a quest, 'task' requires completing a task
    streakMode: 'quest' | 'task';

    // Folder exclusion - folders to exclude from Kanban view (but still indexed)
    excludedFolders: string[];

    // Template configuration
    templateFolder: string;         // Folder containing quest templates
    archiveFolder: string;          // Folder for archived/completed quests
    defaultQuestTags: string[];     // Tags to add by default when creating quests
    enableDailyNoteLogging: boolean; // Log quest completions to daily notes

    // Loot configuration - custom quest type to gear slot mapping
    questSlotMapping: Record<string, string[]>;

    // Set bonus configuration
    excludedSetFolders: string[];  // Folders that don't form sets (e.g., 'main', 'side', etc.)
    setBonusCache: Record<string, any[]>; // Cached AI-generated set bonuses

    // Bounty system configuration
    bountyChance: number;  // Chance (0-20%) for bounty to trigger on quest completion
    bountyDescriptionCache: Record<string, { description: string; monsterHint: string }[]>;  // AI-generated bounty descriptions (burn-on-use)

    // Dungeon system configuration
    userDungeonFolder: string;  // Folder for user-created dungeon markdown files
}

/**
 * Get the quest folder path from settings
 */
export function getQuestFolderPath(settings: QuestBoardSettings): string {
    return `${settings.storageFolder}/quests`;
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
    streakMode: 'quest',
    excludedFolders: [],
    templateFolder: 'Quest Board/templates',
    archiveFolder: 'quests/archive',
    defaultQuestTags: [],
    enableDailyNoteLogging: true,
    questSlotMapping: {
        main: ['chest', 'weapon', 'head'],
        side: ['legs', 'boots', 'shield'],
        training: ['head', 'shield'],
        guild: ['chest', 'legs'],
        recurring: ['boots', 'accessory1'],
        daily: [],
    },
    excludedSetFolders: ['main', 'side', 'training', 'recurring', 'daily'],
    setBonusCache: {},
    bountyChance: 10,  // 10% chance by default
    bountyDescriptionCache: {},  // AI-generated bounty descriptions
    userDungeonFolder: 'Life/Quest Board/dungeons',  // Default dungeon folder
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

    /**
     * Apply quest slot mapping to loot generation service
     */
    private applyQuestSlotMapping(): void {
        if (this.plugin.settings.questSlotMapping) {
            const typedMapping: Record<string, GearSlot[]> = {};
            for (const [key, slots] of Object.entries(this.plugin.settings.questSlotMapping)) {
                typedMapping[key] = slots as GearSlot[];
            }
            lootGenerationService.setCustomSlotMapping(typedMapping);
        }
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

        // Quest Folder Settings Section
        containerEl.createEl('h3', { text: 'Quest Folder Settings' });

        // Helper to get all folders for autocomplete
        const getAllFolders = (): string[] => {
            const folders: string[] = [];
            const recurse = (folder: TFolder) => {
                folders.push(folder.path);
                folder.children.forEach(child => {
                    if (child instanceof TFolder) {
                        recurse(child);
                    }
                });
            };
            this.app.vault.getAllLoadedFiles().forEach(file => {
                if (file instanceof TFolder && file.path !== '/') {
                    recurse(file);
                }
            });
            return [...new Set(folders)].sort();
        };

        new Setting(containerEl)
            .setName('Excluded Folders')
            .setDesc('Folders to hide from Kanban view (quests still indexed for XP). Comma-separated.')
            .addText(text => text
                .setPlaceholder('archive, completed')
                .setValue(this.plugin.settings.excludedFolders.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.excludedFolders = value
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Archive Folder')
            .setDesc('Folder for archived/completed quests (relative to storage folder)')
            .addText(text => text
                .setPlaceholder('quests/archive')
                .setValue(this.plugin.settings.archiveFolder)
                .onChange(async (value) => {
                    this.plugin.settings.archiveFolder = value;
                    await this.plugin.saveSettings();
                }));

        // Dungeon Configuration Section
        containerEl.createEl('h3', { text: 'Dungeon Configuration' });

        new Setting(containerEl)
            .setName('User Dungeon Folder')
            .setDesc('Folder for custom dungeon markdown files. A format guide will be created here on first use.')
            .addText(text => text
                .setPlaceholder('Life/Quest Board/dungeons')
                .setValue(this.plugin.settings.userDungeonFolder || 'Life/Quest Board/dungeons')
                .onChange(async (value) => {
                    this.plugin.settings.userDungeonFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Create Dungeon Template')
            .setDesc('Create the format guide document in your dungeon folder')
            .addButton(button => button
                .setButtonText('Create Template')
                .onClick(async () => {
                    const { createDungeonTemplateDoc } = await import('./services/UserDungeonLoader');
                    const folder = this.plugin.settings.userDungeonFolder || 'Life/Quest Board/dungeons';
                    await createDungeonTemplateDoc(this.app.vault, folder);
                    const Notice = (await import('obsidian')).Notice;
                    new Notice(`📜 Template created at ${folder}/DUNGEON_FORMAT.md`);
                }));

        // Template Configuration Section
        containerEl.createEl('h3', { text: 'Template Configuration' });

        new Setting(containerEl)
            .setName('Template Folder')
            .setDesc('Folder containing quest templates')
            .addText(text => text
                .setPlaceholder('Quest Board/templates')
                .setValue(this.plugin.settings.templateFolder)
                .onChange(async (value) => {
                    this.plugin.settings.templateFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Default Quest Tags')
            .setDesc('Tags to add by default when creating quests. Comma-separated.')
            .addText(text => text
                .setPlaceholder('quest, active')
                .setValue(this.plugin.settings.defaultQuestTags.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.defaultQuestTags = value
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable Daily Note Logging')
            .setDesc('Log quest completions to your daily notes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableDailyNoteLogging)
                .onChange(async (value) => {
                    this.plugin.settings.enableDailyNoteLogging = value;
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
            .setDesc('Enable training mode with separate XP pool (Roman numeral levels I-IV). Disabling graduates your character to Level 1.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableTrainingMode)
                .onChange(async (value) => {
                    this.plugin.settings.enableTrainingMode = value;

                    // Sync with character state
                    if (this.plugin.settings.character) {
                        if (!value && this.plugin.settings.character.isTrainingMode) {
                            // Graduate: exit training mode and reset to level 1
                            this.plugin.settings.character = {
                                ...this.plugin.settings.character,
                                isTrainingMode: false,
                                level: 1,
                                totalXP: 0,
                                lastModified: new Date().toISOString(),
                            };
                            // Also update the store
                            const { setCharacter } = await import('./store/characterStore').then(m => m.useCharacterStore.getState());
                            setCharacter(this.plugin.settings.character);
                        } else if (value && !this.plugin.settings.character.isTrainingMode) {
                            // Re-enable training mode (not typical but support it)
                            this.plugin.settings.character = {
                                ...this.plugin.settings.character,
                                isTrainingMode: true,
                                trainingLevel: 1,
                                trainingXP: 0,
                                lastModified: new Date().toISOString(),
                            };
                            const { setCharacter } = await import('./store/characterStore').then(m => m.useCharacterStore.getState());
                            setCharacter(this.plugin.settings.character);
                        }
                    }

                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show updated state
                }));

        new Setting(containerEl)
            .setName('Streak Mode')
            .setDesc('What counts for maintaining your daily streak')
            .addDropdown(dropdown => dropdown
                .addOption('quest', 'Quest completion (complete 1 full quest per day)')
                .addOption('task', 'Task completion (complete any task per day)')
                .setValue(this.plugin.settings.streakMode || 'quest')
                .onChange(async (value) => {
                    this.plugin.settings.streakMode = value as 'quest' | 'task';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Bounty Chance')
            .setDesc('Chance (%) for a bounty fight to trigger when completing a quest. Set to 0 to disable.')
            .addSlider(slider => slider
                .setLimits(0, 100, 5)
                .setValue(this.plugin.settings.bountyChance ?? 10)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.bountyChance = value;
                    await this.plugin.saveSettings();
                }));

        // Quest → Gear Slot Mapping Section
        containerEl.createEl('h3', { text: 'Quest → Gear Slot Mapping' });
        containerEl.createEl('p', {
            text: 'Configure which gear slots can drop from each quest type. Separate slots with commas.',
            cls: 'setting-item-description'
        });

        const gearSlotOptions = ['head', 'chest', 'legs', 'boots', 'weapon', 'shield', 'accessory1', 'accessory2', 'accessory3'];
        const questSlotMapping = this.plugin.settings.questSlotMapping || {};

        // Show existing quest type mappings
        const questTypes = Object.keys(questSlotMapping);
        questTypes.forEach(questType => {
            const slots = questSlotMapping[questType] || [];
            new Setting(containerEl)
                .setName(`${questType.charAt(0).toUpperCase() + questType.slice(1)} Quests`)
                .setDesc(`Slots: ${slots.length > 0 ? slots.join(', ') : '(no gear drops)'}`)
                .addText(text => text
                    .setPlaceholder('e.g., chest, weapon, head')
                    .setValue(slots.join(', '))
                    .onChange(async (value) => {
                        const newSlots = value
                            .split(',')
                            .map(s => s.trim().toLowerCase())
                            .filter(s => gearSlotOptions.includes(s));
                        this.plugin.settings.questSlotMapping[questType] = newSlots;
                        await this.plugin.saveSettings();
                        // Update loot service with new mapping
                        this.applyQuestSlotMapping();
                    }));
        });

        // Add new quest type mapping
        let newQuestType = '';
        let newSlots = '';
        new Setting(containerEl)
            .setName('Add Custom Quest Type')
            .setDesc('Add a mapping for a custom quest type folder')
            .addText(text => text
                .setPlaceholder('Quest type (e.g., fitness)')
                .onChange(value => { newQuestType = value.toLowerCase().trim(); }))
            .addText(text => text
                .setPlaceholder('Slots (e.g., chest, legs)')
                .onChange(value => { newSlots = value; }))
            .addButton(button => button
                .setButtonText('Add')
                .onClick(async () => {
                    if (newQuestType) {
                        const parsedSlots = newSlots
                            .split(',')
                            .map(s => s.trim().toLowerCase())
                            .filter(s => gearSlotOptions.includes(s));
                        this.plugin.settings.questSlotMapping[newQuestType] = parsedSlots;
                        await this.plugin.saveSettings();
                        this.applyQuestSlotMapping();
                        this.display(); // Refresh
                    }
                }));

        // Excluded Set Folders Section
        containerEl.createEl('h3', { text: 'Set Bonus Configuration' });
        containerEl.createEl('p', {
            text: 'Quest folders that should NOT form gear sets. Gear from these folders will have no set membership.',
            cls: 'setting-item-description'
        });

        new Setting(containerEl)
            .setName('Excluded Folders')
            .setDesc('Comma-separated list of folder names (e.g., main, side, training)')
            .addText(text => text
                .setPlaceholder('main, side, training, recurring, daily')
                .setValue((this.plugin.settings.excludedSetFolders || []).join(', '))
                .onChange(async (value) => {
                    const folders = value
                        .split(',')
                        .map(s => s.trim().toLowerCase())
                        .filter(s => s.length > 0);
                    this.plugin.settings.excludedSetFolders = folders;
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
            .setDesc('Reset statBonuses, category XP accumulators, and streak to zero (keeps XP, level, achievements)')
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
                        // Reset streak fields
                        this.plugin.settings.character.currentStreak = 0;
                        this.plugin.settings.character.highestStreak = 0;
                        this.plugin.settings.character.lastQuestCompletionDate = null;
                        this.plugin.settings.character.shieldUsedThisWeek = false;
                        await this.plugin.saveSettings();
                        alert('Stats and streak reset! Reload Obsidian to see changes.');
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

        // === Gemini Test Section ===
        containerEl.createEl('h3', { text: '🧪 Gemini AI Testing' });

        new Setting(containerEl)
            .setName('Test Set Bonus Generation')
            .setDesc('Enter a set name and test Gemini generation. Results shown in console.')
            .addText(text => text
                .setPlaceholder('e.g., Fitness, Work, Study')
                .setValue('')
                .onChange(() => { }))
            .addButton(button => button
                .setButtonText('Generate')
                .onClick(async () => {
                    const textInput = containerEl.querySelector('.setting-item:last-of-type input') as HTMLInputElement;
                    const setName = textInput?.value?.trim() || 'Test Set';

                    button.setButtonText('Generating...');
                    button.setDisabled(true);

                    const { setBonusService } = await import('./services/SetBonusService');
                    const result = await setBonusService.testGeneration(setName);

                    if (result.success && result.bonuses) {
                        console.log(`[Gemini Test] SUCCESS for "${setName}":`, result.bonuses);
                        const bonusStr = result.bonuses.map(b =>
                            `(${b.pieces}) ${setBonusService.formatBonusEffect(b.effect)}`
                        ).join('\n');
                        alert(`✅ Generated bonuses for "${setName}":\n\n${bonusStr}`);
                    } else {
                        console.error(`[Gemini Test] FAILED for "${setName}":`, result.error);
                        alert(`❌ Generation failed:\n${result.error}`);
                    }

                    button.setButtonText('Generate');
                    button.setDisabled(false);
                }));

        new Setting(containerEl)
            .setName('Cache Status')
            .setDesc('View current set bonus cache status')
            .addButton(button => button
                .setButtonText('Show Status')
                .onClick(async () => {
                    const { setBonusService } = await import('./services/SetBonusService');
                    const status = setBonusService.getCacheStatus();
                    console.log('[Cache Status]', status);
                    alert(`📦 Cache Status:\nCached: ${status.cached}\nPending: ${status.pending}\nSets: ${status.setIds.join(', ') || 'none'}`);
                }));

        new Setting(containerEl)
            .setName('Clear Set Bonus Cache')
            .setDesc('Clear cached set bonuses (keeps first entry for comparison)')
            .addButton(button => button
                .setButtonText('Clear Cache')
                .onClick(async () => {
                    const { setBonusService } = await import('./services/SetBonusService');
                    setBonusService.clearCacheExceptFirst();
                    alert('🗑️ Cache cleared (kept first entry)');
                }));
    }
}
