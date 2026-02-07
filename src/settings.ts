/**
 * Quest Board - Settings
 * 
 * Plugin settings interface, defaults, and settings tab UI.
 * API keys and sensitive data stored here via loadData/saveData.
 */

import { App, PluginSettingTab, Setting, TFolder, TextComponent, Notice } from 'obsidian';
import type QuestBoardPlugin from '../main';
import type { Character } from './models/Character';
import type { InventoryItem } from './models/Consumable';
import { Achievement } from './models/Achievement';
import { lootGenerationService } from './services/LootGenerationService';
import { GearSlot } from './models/Gear';
import { DEV_FEATURES_ENABLED } from './config/combatConfig';
import type { WatchedFolderConfig } from './services/FolderWatchService';
import type { CustomColumn } from './models/CustomColumn';
import { DEFAULT_COLUMNS } from './models/CustomColumn';

// Re-export for convenience
export type { Achievement, CustomColumn };

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
    dailyNoteFolder: string;        // Folder where daily notes are stored
    dailyNoteFormat: string;        // Date format for daily note filenames (e.g., YYYY-MM-DD)
    dailyNoteHeading: string;       // Heading to append quest logs under
    createDailyNoteIfMissing: boolean; // Create daily note if it doesn't exist

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

    // Mobile Kanban settings
    mobileKanbanMode: 'swipe' | 'checkbox';  // 'swipe' = single column with nav, 'checkbox' = multi-select columns
    mobileDefaultColumn: 'available' | 'active' | 'in_progress' | 'completed';  // Default visible column on mobile

    // AI Quest generation settings
    aiQuestSkipPreview: boolean;  // Skip the preview modal when generating quests

    // Balance Testing Configuration
    enableBalanceTesting: boolean;        // Toggle for balance test logging
    balanceTestingFolder: string;         // Folder for balance test notes
    balanceTestingNoteName: string;       // Current note name (without .md)

    // AI Dungeon Generation Quota Tracking
    aiDungeonDailyCount: number;          // Number of dungeons generated today
    aiDungeonLastResetDate: string;       // ISO date (UTC) of last quota reset
    aiDungeonMaxDaily: number;            // Max dungeons per day (default 10)

    // Folder Watch Configurations (Daily Quest & Watched Folder)
    watchedFolderConfigs: WatchedFolderConfig[];

    // Custom Kanban Columns
    enableCustomColumns: boolean;       // Feature flag for custom columns
    customColumns: CustomColumn[];      // User-defined column configuration

    // Asset Delivery
    assetFolder: string;                                      // Vault-relative path for downloaded assets
    assetUpdateFrequency: 'daily' | 'weekly' | 'manual';      // How often to check for asset updates
    lastAssetCheck: number;                                    // Timestamp of last update check
    assetConfigured: boolean;                                  // True after user has completed initial asset setup
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
    storageFolder: 'Quest Board',

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
    archiveFolder: 'Quest Board/quests/archive',
    defaultQuestTags: [],
    enableDailyNoteLogging: true,
    dailyNoteFolder: 'Daily',
    dailyNoteFormat: 'YYYY-MM-DD',
    dailyNoteHeading: '## Quest Board Activity',
    createDailyNoteIfMissing: false,
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
    userDungeonFolder: 'Quest Board/dungeons',  // Default dungeon folder
    mobileKanbanMode: 'swipe',  // Default to swipe single-column mode
    mobileDefaultColumn: 'active',  // Default to Active column on mobile
    aiQuestSkipPreview: false,  // Default to showing preview
    enableBalanceTesting: false,
    balanceTestingFolder: 'Quest Board/Balance Testing',
    balanceTestingNoteName: '',

    // AI Dungeon Generation
    aiDungeonDailyCount: 0,
    aiDungeonLastResetDate: '',  // Empty = needs reset on first use
    aiDungeonMaxDaily: 10,

    // Folder Watch Configurations
    watchedFolderConfigs: [],

    // Custom Kanban Columns (feature enabled by default)
    enableCustomColumns: true,
    customColumns: [...DEFAULT_COLUMNS],

    // Asset Delivery
    assetFolder: 'QuestBoard/assets',
    assetUpdateFrequency: 'weekly',
    lastAssetCheck: 0,
    assetConfigured: false,
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

        // ═══════════════════════════════════════════════════════════════════
        // SECTION 1: ESSENTIAL SETTINGS
        // ═══════════════════════════════════════════════════════════════════
        containerEl.createEl('h3', { text: 'Essential Settings' });
        containerEl.createEl('p', {
            text: 'Core settings required for the plugin to function.',
            cls: 'qb-section-description'
        });

        // Helper to validate folder exists
        const validateFolder = (path: string): boolean => {
            if (!path) return false;
            const folder = this.app.vault.getAbstractFileByPath(path);
            return folder instanceof TFolder;
        };

        new Setting(containerEl)
            .setName('Quest Storage Folder')
            .setDesc('Root folder where quest files are stored')
            .addText(text => text
                .setPlaceholder('Quest Board')
                .setValue(this.plugin.settings.storageFolder)
                .onChange(async (value) => {
                    this.plugin.settings.storageFolder = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to update validation
                }));

        // Folder validation warning
        if (this.plugin.settings.storageFolder && !validateFolder(this.plugin.settings.storageFolder)) {
            containerEl.createEl('p', {
                text: `⚠ Storage folder "${this.plugin.settings.storageFolder}" not found - create it or update the path`,
                cls: 'qb-warning'
            });
        }

        new Setting(containerEl)
            .setName('Gemini API Key')
            .setDesc(this.plugin.settings.geminiApiKey
                ? '✓ API Key configured - AI features enabled'
                : '⚠ No API key set - AI features disabled. Get one at makersuite.google.com')
            .addText(text => {
                text
                    .setPlaceholder('Enter your API key')
                    .setValue(this.plugin.settings.geminiApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.geminiApiKey = value;
                        await this.plugin.saveSettings();
                        this.display(); // Refresh to update status message
                    });
                // Hide the key for security
                text.inputEl.type = 'password';
                return text;
            });

        // ═══════════════════════════════════════════════════════════════════
        // SECTION 2: FILE PATHS (Collapsible)
        // ═══════════════════════════════════════════════════════════════════
        const filePathsDetails = containerEl.createEl('details', { cls: 'qb-settings-collapsible' });
        filePathsDetails.createEl('summary', {
            text: 'File Paths',
            cls: 'qb-settings-section-header'
        });
        const filePathsContent = filePathsDetails.createDiv({ cls: 'qb-settings-collapsible-content' });
        filePathsContent.createEl('p', {
            text: 'Configure where different types of files are stored.',
            cls: 'qb-section-description'
        });


        new Setting(filePathsContent)
            .setName('Template Folder')
            .setDesc('Folder containing quest templates')
            .addText(text => text
                .setPlaceholder('Quest Board/templates')
                .setValue(this.plugin.settings.templateFolder)
                .onChange(async (value) => {
                    this.plugin.settings.templateFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(filePathsContent)
            .setName('Archive Folder')
            .setDesc('Folder for archived/completed quests')
            .addText(text => text
                .setPlaceholder('Quest Board/quests/archive')
                .setValue(this.plugin.settings.archiveFolder)
                .onChange(async (value) => {
                    this.plugin.settings.archiveFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(filePathsContent)
            .setName('User Dungeon Folder')
            .setDesc('Folder for custom dungeon markdown files')
            .addText(text => text
                .setPlaceholder('Quest Board/dungeons')
                .setValue(this.plugin.settings.userDungeonFolder || 'Quest Board/dungeons')
                .onChange(async (value) => {
                    this.plugin.settings.userDungeonFolder = value;
                    await this.plugin.saveSettings();
                }));

        // --- Asset Delivery ---
        filePathsContent.createEl('h4', { text: '🎨 Asset Delivery' });

        const assetFolderSetting = new Setting(filePathsContent)
            .setName('Asset Folder')
            .setDesc('Vault folder where downloaded sprites, tiles, and backgrounds are stored');

        assetFolderSetting.addText(text => {
            text.setPlaceholder('QuestBoard/assets')
                .setValue(this.plugin.settings.assetFolder || 'QuestBoard/assets');

            // Save handler — only fires on blur or explicit save, NOT per-keystroke
            const handleSave = async () => {
                const oldPath = this.plugin.settings.assetFolder;
                const newPath = text.getValue().trim() || 'QuestBoard/assets';
                if (oldPath === newPath) return;

                this.plugin.settings.assetFolder = newPath;
                await this.plugin.saveSettings();

                // Reinitialize AssetService with new path and trigger re-download
                if (this.plugin.assetService) {
                    try {
                        // Delete old assets from previous location
                        await this.plugin.assetService.deleteAllAssets();
                        // Re-create service with new path
                        const { AssetService } = await import('./services/AssetService');
                        this.plugin.assetService = new AssetService(this.app, newPath);
                        // Trigger fresh download
                        const { files, remoteManifest } = await this.plugin.assetService.checkForUpdates();
                        if (files.length > 0) {
                            const { AssetDownloadModal } = await import('./modals/AssetDownloadModal');
                            const character = this.plugin.settings.character;
                            new AssetDownloadModal(this.app, {
                                assetService: this.plugin.assetService,
                                filesToDownload: files,
                                manifest: remoteManifest,
                                characterClass: character?.class,
                                onComplete: () => {
                                    new Notice('✅ Assets re-downloaded to new location');
                                },
                            }).open();
                        }
                    } catch (e) {
                        console.error('[QuestBoard] Asset path change failed:', e);
                        new Notice(`❌ Failed to move assets: ${(e as Error).message}`);
                    }
                }
            };

            // Commit on blur (when user clicks away from the field)
            text.inputEl.addEventListener('blur', handleSave);

            // Add folder autocomplete
            import('./utils/FolderSuggest').then(({ FolderSuggest }) => {
                new FolderSuggest(this.app, text.inputEl);
            });
        });

        new Setting(filePathsContent)
            .setName('Asset Update Frequency')
            .setDesc('How often to check for new or updated sprites and tiles')
            .addDropdown(dropdown => dropdown
                .addOption('daily', 'Daily')
                .addOption('weekly', 'Weekly')
                .addOption('manual', 'Manual only')
                .setValue(this.plugin.settings.assetUpdateFrequency || 'weekly')
                .onChange(async (value) => {
                    this.plugin.settings.assetUpdateFrequency = value as 'daily' | 'weekly' | 'manual';
                    await this.plugin.saveSettings();
                }));

        new Setting(filePathsContent)
            .setName('Check for Asset Updates')
            .setDesc('Manually check for new or updated sprites and tiles')
            .addButton(button => button
                .setButtonText('Check Now')
                .onClick(async () => {
                    if (!this.plugin.assetService) {
                        new Notice('❌ Asset service not initialized');
                        return;
                    }
                    button.setButtonText('Checking...');
                    button.setDisabled(true);
                    try {
                        const { needsUpdate, files, orphaned, remoteManifest } = await this.plugin.assetService.checkForUpdates();
                        this.plugin.settings.lastAssetCheck = Date.now();
                        await this.plugin.saveSettings();
                        if (needsUpdate) {
                            const { AssetDownloadModal } = await import('./modals/AssetDownloadModal');
                            const character = this.plugin.settings.character;
                            new AssetDownloadModal(this.app, {
                                assetService: this.plugin.assetService,
                                filesToDownload: files,
                                manifest: remoteManifest,
                                orphanedFiles: orphaned,
                                characterClass: character?.class,
                                onComplete: () => {
                                    new Notice(`✅ ${files.length} asset(s) updated`);
                                    this.display(); // Refresh to update version display
                                },
                            }).open();
                        } else {
                            new Notice('✅ All assets are up to date');
                        }
                    } catch (e) {
                        new Notice(`❌ Update check failed: ${(e as Error).message}`);
                    } finally {
                        button.setButtonText('Check Now');
                        button.setDisabled(false);
                    }
                }));

        // Show last check time
        if (this.plugin.settings.lastAssetCheck > 0) {
            const lastCheck = new Date(this.plugin.settings.lastAssetCheck);
            filePathsContent.createEl('p', {
                text: `Last checked: ${lastCheck.toLocaleDateString()} ${lastCheck.toLocaleTimeString()}`,
                cls: 'setting-item-description'
            });
        }

        // ═══════════════════════════════════════════════════════════════════
        // SECTION 3: GAMEPLAY SETTINGS
        // ═══════════════════════════════════════════════════════════════════
        containerEl.createEl('h3', { text: 'Gameplay Settings' });
        containerEl.createEl('p', {
            text: 'Core game mechanics and progression settings.',
            cls: 'qb-section-description'
        });

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

        // ═══════════════════════════════════════════════════════════════════
        // SECTION 4: QUEST MANAGEMENT
        // ═══════════════════════════════════════════════════════════════════
        containerEl.createEl('h3', { text: 'Quest Management' });
        containerEl.createEl('p', {
            text: 'Configure quest creation, templates, and folder settings.',
            cls: 'qb-section-description'
        });

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
            .setName('Template Builder')
            .setDesc('Create and edit quest templates (including watched folder templates)')
            .addButton(button => button
                .setButtonText('Open Template Builder')
                .onClick(async () => {
                    const { ScrivenersQuillModal } = await import('./modals/ScrivenersQuillModal');
                    new ScrivenersQuillModal(this.app, this.plugin).open();
                }));

        new Setting(containerEl)
            .setName('Create Dungeon Template')
            .setDesc('Create the format guide document in your dungeon folder')
            .addButton(button => button
                .setButtonText('Create Template')
                .onClick(async () => {
                    const { createDungeonTemplateDoc } = await import('./services/UserDungeonLoader');
                    const folder = this.plugin.settings.userDungeonFolder || 'Quest Board/dungeons';
                    await createDungeonTemplateDoc(this.app.vault, folder);
                    const Notice = (await import('obsidian')).Notice;
                    new Notice(`📜 Template created at ${folder}/DUNGEON_FORMAT.md`);
                }));

        new Setting(containerEl)
            .setName('Watched Folders')
            .setDesc('Manage automatic quest generation from watched folders')
            .addButton(button => button
                .setButtonText('Manage Watched Folders')
                .onClick(async () => {
                    const { WatchedFolderManagerModal } = await import('./modals/WatchedFolderManagerModal');
                    new WatchedFolderManagerModal(this.app, this.plugin).open();
                }));

        // ═══════════════════════════════════════════════════════════════════
        // SECTION 5: KANBAN BOARD
        // ═══════════════════════════════════════════════════════════════════
        containerEl.createEl('h3', { text: 'Kanban Board' });
        containerEl.createEl('p', {
            text: 'Customize Kanban columns and mobile display options.',
            cls: 'qb-section-description'
        });

        new Setting(containerEl)
            .setName('Enable Custom Columns')
            .setDesc('Customize Kanban column names, order, and completion behavior')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableCustomColumns ?? false)
                .onChange(async (value) => {
                    this.plugin.settings.enableCustomColumns = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide column manager button
                }));

        if (this.plugin.settings.enableCustomColumns) {
            new Setting(containerEl)
                .setName('Manage Columns')
                .setDesc('Add, edit, reorder, or remove Kanban columns')
                .addButton(button => button
                    .setButtonText('Open Column Manager')
                    .onClick(async () => {
                        const { ColumnManagerModal } = await import('./modals/ColumnManagerModal');
                        new ColumnManagerModal(this.app, this.plugin).open();
                    }));

            // Show current column count
            const columnCount = (this.plugin.settings.customColumns || DEFAULT_COLUMNS).length;
            containerEl.createEl('p', {
                text: `Current columns: ${columnCount}`,
                cls: 'setting-item-description'
            });
        }

        new Setting(containerEl)
            .setName('Mobile Kanban Mode')
            .setDesc('How columns are displayed on mobile devices')
            .addDropdown(dropdown => dropdown
                .addOption('swipe', 'Single Column (one column at a time, arrows to navigate)')
                .addOption('checkbox', 'Checkbox Multi-Select (toggle column visibility with chips)')
                .setValue(this.plugin.settings.mobileKanbanMode || 'swipe')
                .onChange(async (value) => {
                    this.plugin.settings.mobileKanbanMode = value as 'swipe' | 'checkbox';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Default Mobile Column')
            .setDesc('Which column to show by default when opening the Kanban on mobile')
            .addDropdown(dropdown => dropdown
                .addOption('available', '📋 Available')
                .addOption('active', '⚔️ Active')
                .addOption('in_progress', '🔨 In Progress')
                .addOption('completed', '✅ Completed')
                .setValue(this.plugin.settings.mobileDefaultColumn || 'active')
                .onChange(async (value) => {
                    this.plugin.settings.mobileDefaultColumn = value as 'available' | 'active' | 'in_progress' | 'completed';
                    await this.plugin.saveSettings();
                }));

        // ═══════════════════════════════════════════════════════════════════
        // SECTION 6: DAILY NOTES INTEGRATION
        // ═══════════════════════════════════════════════════════════════════
        containerEl.createEl('h3', { text: 'Daily Notes Integration' });
        containerEl.createEl('p', {
            text: 'Log quest activity to your daily notes.',
            cls: 'qb-section-description'
        });

        new Setting(containerEl)
            .setName('Enable Daily Note Logging')
            .setDesc('Log quest completions to your daily notes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableDailyNoteLogging)
                .onChange(async (value) => {
                    this.plugin.settings.enableDailyNoteLogging = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide dependent settings
                }));

        // Only show these settings if daily note logging is enabled
        if (this.plugin.settings.enableDailyNoteLogging) {
            const folderSetting = new Setting(containerEl)
                .setName('Daily Note Folder')
                .setDesc('Folder where your daily notes are stored');

            folderSetting.addText(text => {
                text.setPlaceholder('Daily')
                    .setValue(this.plugin.settings.dailyNoteFolder || 'Daily')
                    .onChange(async (value) => {
                        this.plugin.settings.dailyNoteFolder = value;
                        await this.plugin.saveSettings();
                    });

                // Add folder autocomplete
                import('./utils/FolderSuggest').then(({ FolderSuggest }) => {
                    new FolderSuggest(this.app, text.inputEl);
                });
            });

            new Setting(containerEl)
                .setName('Daily Note Format')
                .setDesc('Date format for daily note filenames (YYYY-MM-DD, YYYY-MM-DD ddd, etc.)')
                .addText(text => text
                    .setPlaceholder('YYYY-MM-DD')
                    .setValue(this.plugin.settings.dailyNoteFormat || 'YYYY-MM-DD')
                    .onChange(async (value) => {
                        this.plugin.settings.dailyNoteFormat = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Log Heading')
                .setDesc('Heading to append quest completion logs under')
                .addText(text => text
                    .setPlaceholder('## Quest Board Activity')
                    .setValue(this.plugin.settings.dailyNoteHeading || '## Quest Board Activity')
                    .onChange(async (value) => {
                        this.plugin.settings.dailyNoteHeading = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Create Daily Note If Missing')
                .setDesc('Create a new daily note if one doesn\'t exist. Disable if you use another daily notes plugin.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.createDailyNoteIfMissing ?? false)
                    .onChange(async (value) => {
                        this.plugin.settings.createDailyNoteIfMissing = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // ═══════════════════════════════════════════════════════════════════
        // SECTION 7: AI FEATURES
        // ═══════════════════════════════════════════════════════════════════
        containerEl.createEl('h3', { text: 'AI Features' });
        containerEl.createEl('p', {
            text: 'Configure AI-powered quest generation and dungeon creation.',
            cls: 'qb-section-description'
        });

        // Show API key status
        const hasApiKey = !!this.plugin.settings.geminiApiKey;
        if (!hasApiKey) {
            containerEl.createEl('p', {
                text: '⚠ Configure your Gemini API key in Essential Settings to enable AI features.',
                cls: 'qb-warning-text'
            });
        }

        new Setting(containerEl)
            .setName('Skip AI Quest Preview')
            .setDesc('When enabled, AI-generated quests save directly without a preview/edit step')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.aiQuestSkipPreview ?? false)
                .onChange(async (value) => {
                    this.plugin.settings.aiQuestSkipPreview = value;
                    await this.plugin.saveSettings();
                }));

        // ═══════════════════════════════════════════════════════════════════
        // SECTION 8: ADVANCED CONFIGURATION (Collapsible)
        // ═══════════════════════════════════════════════════════════════════
        const advancedDetails = containerEl.createEl('details', { cls: 'qb-settings-collapsible' });
        advancedDetails.createEl('summary', {
            text: 'Advanced Configuration',
            cls: 'qb-settings-section-header'
        });
        const advancedContent = advancedDetails.createDiv({ cls: 'qb-settings-collapsible-content' });
        advancedContent.createEl('p', {
            text: 'Gear drops, stat mappings, and balance testing options for power users.',
            cls: 'qb-section-description'
        });

        // Balance Testing Section (DEV ONLY - hidden in production builds)
        if (DEV_FEATURES_ENABLED) {
            advancedContent.createEl('h4', { text: '🧪 Balance Testing' });

            new Setting(advancedContent)
                .setName('Enable Balance Test Logging')
                .setDesc('Log battle data to a note for balance testing and analysis')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableBalanceTesting ?? false)
                    .onChange(async (value) => {
                        this.plugin.settings.enableBalanceTesting = value;
                        await this.plugin.saveSettings();
                        this.display(); // Refresh to show/hide dependent settings
                    }));

            // Only show these settings if balance testing is enabled
            if (this.plugin.settings.enableBalanceTesting) {
                const folderSetting = new Setting(advancedContent)
                    .setName('Balance Testing Folder')
                    .setDesc('Folder where balance test notes are stored');

                folderSetting.addText(text => {
                    text.setPlaceholder('Quest Board/Balance Testing')
                        .setValue(this.plugin.settings.balanceTestingFolder || 'Quest Board/Balance Testing')
                        .onChange(async (value) => {
                            this.plugin.settings.balanceTestingFolder = value;
                            await this.plugin.saveSettings();
                        });

                    // Add folder autocomplete
                    import('./utils/FolderSuggest').then(({ FolderSuggest }) => {
                        new FolderSuggest(this.app, text.inputEl);
                    });
                });

                new Setting(advancedContent)
                    .setName('Current Test Note')
                    .setDesc('Note name for logging (without .md extension). E.g., "Paladin Testing"')
                    .addText(text => text
                        .setPlaceholder('Paladin Testing')
                        .setValue(this.plugin.settings.balanceTestingNoteName || '')
                        .onChange(async (value) => {
                            this.plugin.settings.balanceTestingNoteName = value;
                            await this.plugin.saveSettings();
                        }));

                // Test Character Generator
                advancedContent.createEl('h5', { text: '⚡ Quick Test Character' });
                advancedContent.createEl('p', {
                    text: 'Generate a test character with appropriate stats, gear, and skills for the selected level.',
                    cls: 'setting-item-description'
                });

                // Store selections for the generate button
                let selectedClass: import('./models/Character').CharacterClass = 'warrior';
                let selectedLevel: number = 20;

                new Setting(advancedContent)
                    .setName('Test Class')
                    .setDesc('Character class to generate')
                    .addDropdown(dropdown => {
                        const classes: import('./models/Character').CharacterClass[] = [
                            'warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'
                        ];
                        classes.forEach(c => dropdown.addOption(c, c.charAt(0).toUpperCase() + c.slice(1)));
                        dropdown.setValue('warrior');
                        dropdown.onChange((value) => {
                            selectedClass = value as import('./models/Character').CharacterClass;
                        });
                    });

                new Setting(advancedContent)
                    .setName('Test Level')
                    .setDesc('Character level (1-40)')
                    .addDropdown(dropdown => {
                        // Add common test levels
                        const levels = [1, 5, 10, 15, 20, 25, 30, 35, 40];
                        levels.forEach(l => dropdown.addOption(l.toString(), `Level ${l}`));
                        dropdown.setValue('20');
                        dropdown.onChange((value) => {
                            selectedLevel = parseInt(value, 10);
                        });
                    });

                new Setting(advancedContent)
                    .setName('Generate Test Character')
                    .setDesc('⚠️ This will REPLACE your current character with a test character!')
                    .addButton(button => button
                        .setButtonText('🧪 Generate & Apply')
                        .setWarning()
                        .onClick(async () => {
                            // Dynamically import generator to avoid circular deps
                            const { generateTestCharacter } = await import('./services/TestCharacterGenerator');
                            const { useCharacterStore } = await import('./store/characterStore');

                            const currentCharacter = useCharacterStore.getState().character;
                            const testCharacter = generateTestCharacter(selectedClass, selectedLevel, currentCharacter || undefined);

                            // Apply to store
                            useCharacterStore.getState().setCharacter(testCharacter);

                            // Save to plugin data
                            this.plugin.settings.character = testCharacter;
                            await this.plugin.saveSettings();

                            new (await import('obsidian')).Notice(
                                `✅ Generated Level ${selectedLevel} ${selectedClass.charAt(0).toUpperCase() + selectedClass.slice(1)} test character!`
                            );
                        }));
            }
        }

        // Modal buttons for advanced configuration
        const gearMappingCount = Object.keys(this.plugin.settings.questSlotMapping || {}).length;
        new Setting(advancedContent)
            .setName('Gear Slot Mapping')
            .setDesc(`Configure which gear slots can drop from each quest type (${gearMappingCount} type${gearMappingCount !== 1 ? 's' : ''} configured)`)
            .addButton(button => button
                .setButtonText('Open Gear Slot Mapping')
                .onClick(async () => {
                    const { GearSlotMappingModal } = await import('./modals/GearSlotMappingModal');
                    new GearSlotMappingModal(this.app, this.plugin).open();
                }));

        const statMappingCount = Object.keys(this.plugin.settings.categoryStatMappings || {}).length;
        new Setting(advancedContent)
            .setName('Stat Mappings')
            .setDesc(`Map quest categories to character stats for XP distribution (${statMappingCount} mapping${statMappingCount !== 1 ? 's' : ''} configured)`)
            .addButton(button => button
                .setButtonText('Open Stat Mappings')
                .onClick(async () => {
                    const { StatMappingsModal } = await import('./modals/StatMappingsModal');
                    new StatMappingsModal(this.app, this.plugin).open();
                }));

        // Excluded Set Folders Section
        advancedContent.createEl('h4', { text: 'Set Bonus Configuration' });
        advancedContent.createEl('p', {
            text: 'Quest folders that should NOT form gear sets. Gear from these folders will have no set membership.',
            cls: 'setting-item-description'
        });

        new Setting(advancedContent)
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
            advancedContent.createEl('h4', { text: 'Character' });

            new Setting(advancedContent)
                .setName('Character Name')
                .setDesc(this.plugin.settings.character.name)
                .addButton(button => button
                    .setButtonText('Edit Character')
                    .onClick(() => {
                        // TODO: Open character edit modal
                    }));

            new Setting(advancedContent)
                .setName('Class')
                .setDesc(`${this.plugin.settings.character.class} (Level ${this.plugin.settings.character.level})`);
        }

        // ═══════════════════════════════════════════════════════════════════
        // SECTION 9: DANGER ZONE (Always visible, collapsed by default)
        // ═══════════════════════════════════════════════════════════════════
        const dangerDetails = containerEl.createEl('details', { cls: 'qb-settings-collapsible qb-danger-zone' });
        dangerDetails.createEl('summary', {
            text: '⚠️ Danger Zone',
            cls: 'qb-settings-section-header qb-danger-header'
        });
        const dangerContent = dangerDetails.createDiv({ cls: 'qb-settings-collapsible-content' });
        dangerContent.createEl('p', {
            text: 'These actions cannot be undone. Use with caution.',
            cls: 'qb-section-description qb-warning-text'
        });

        // Reset Stats Only - surgical fix for corrupted stat data
        new Setting(dangerContent)
            .setName('Reset Stats Only')
            .setDesc('Reset statBonuses, category XP accumulators, and streak to zero (keeps XP, level, achievements)')
            .addButton(button => button
                .setButtonText('Reset Stats')
                .onClick(async () => {
                    if (!this.plugin.settings.character) {
                        new Notice('❌ No character to reset');
                        return;
                    }
                    if (confirm('Reset all stats and streaks? Your XP, level, and achievements will be preserved.')) {
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
                        new Notice('✓ Stats and streak reset');
                        this.display(); // Refresh settings
                    }
                }));

        // Reset All Data - DESTRUCTIVE - requires text confirmation
        let resetConfirmText: TextComponent;
        new Setting(dangerContent)
            .setName('Reset All Data')
            .setDesc('⚠️ DANGER: Deletes all character progress, achievements, and inventory. Type RESET to confirm.')
            .addText(text => {
                resetConfirmText = text;
                text.setPlaceholder('Type RESET');
            })
            .addButton(button => button
                .setButtonText('Reset All Data')
                .setWarning()
                .onClick(async () => {
                    if (resetConfirmText.getValue() !== 'RESET') {
                        new Notice('❌ Type RESET in the box to confirm');
                        return;
                    }
                    // Extra confirm dialog as second layer of protection
                    if (confirm('Are you ABSOLUTELY sure? This will delete all character progress, achievements, and inventory. This cannot be undone.')) {
                        this.plugin.settings.character = null;
                        this.plugin.settings.achievements = [];
                        this.plugin.settings.inventory = [];
                        await this.plugin.saveSettings();
                        resetConfirmText.setValue(''); // Clear input
                        this.display(); // Refresh the settings tab
                        new Notice('✅ All data reset');
                    }
                }));

        // ═══════════════════════════════════════════════════════════════════
        // SECTION 10: DEVELOPER TOOLS (DEV mode only)
        // ═══════════════════════════════════════════════════════════════════
        if (DEV_FEATURES_ENABLED) {
            const devDetails = containerEl.createEl('details', { cls: 'qb-settings-collapsible' });
            devDetails.createEl('summary', {
                text: '🛠️ Developer Tools',
                cls: 'qb-settings-section-header'
            });
            const devContent = devDetails.createDiv({ cls: 'qb-settings-collapsible-content' });
            devContent.createEl('p', {
                text: 'Debug utilities and testing features (only visible in DEV mode).',
                cls: 'qb-section-description'
            });
            // AI Test Lab Modal Button
            new Setting(devContent)
                .setName('AI Test Lab')
                .setDesc('Test Gemini AI features and manage caches')
                .addButton(button => button
                    .setButtonText('Open AI Test Lab')
                    .onClick(async () => {
                        const { AITestLabModal } = await import('./modals/AITestLabModal');
                        new AITestLabModal(this.app, this.plugin).open();
                    }));

            devContent.createEl('h4', { text: '🧪 Gemini AI Testing (Inline - Legacy)' });

            new Setting(devContent)
                .setName('Test Set Bonus Generation')
                .setDesc('Enter a set name and test Gemini generation. Results shown in console.')
                .addText(text => text
                    .setPlaceholder('e.g., Fitness, Work, Study')
                    .setValue('')
                    .onChange(() => { }))
                .addButton(button => button
                    .setButtonText('Generate')
                    .onClick(async () => {
                        const textInput = devContent.querySelector('.setting-item:last-of-type input') as HTMLInputElement;
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

            new Setting(devContent)
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

            new Setting(devContent)
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
}
