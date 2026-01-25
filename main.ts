/**
 * Quest Board - Main Plugin Entry Point
 * 
 * This file should remain THIN (~50-100 lines max).
 * All business logic lives in services, components, and stores.
 */

import { Plugin, WorkspaceLeaf } from 'obsidian';
import { QuestBoardSettings, DEFAULT_SETTINGS, QuestBoardSettingTab } from './src/settings';
import {
    QUEST_BOARD_VIEW_TYPE,
    QUEST_SIDEBAR_VIEW_TYPE,
    QuestBoardView,
    QuestSidebarView
} from './src/views';
import { CreateQuestModal } from './src/modals/CreateQuestModal';
import { ApplicationGauntletModal, InterviewArenaModal } from './src/modals/JobHuntModal';
import { openSmartTemplateModal } from './src/modals/SmartTemplateModal';
import { CreateAchievementModal } from './src/modals/CreateAchievementModal';
import { AchievementHubModal } from './src/modals/AchievementHubModal';
import { useCharacterStore } from './src/store/characterStore';
import { RecurringQuestService } from './src/services/RecurringQuestService';
import { RecurringQuestsDashboardModal } from './src/modals/RecurringQuestsDashboardModal';
import { checkStreakOnLoad } from './src/services/StreakService';
import { statusBarService } from './src/services/StatusBarService';
import { BuffStatusProvider } from './src/services/BuffStatusProvider';
import { QuestBoardCommandMenu } from './src/modals/QuestBoardCommandMenu';
import { WelcomeModal } from './src/modals/WelcomeModal';
import { showInventoryModal } from './src/modals/InventoryModal';
import { openStoreModal } from './src/modals/StoreModal';
import { lootGenerationService } from './src/services/LootGenerationService';
import { setBonusService } from './src/services/SetBonusService';
import { monsterService } from './src/services/MonsterService';
import { battleService } from './src/services/BattleService';
import { GearSlot } from './src/models/Gear';

export default class QuestBoardPlugin extends Plugin {
    settings!: QuestBoardSettings;
    recurringQuestService!: RecurringQuestService;
    monsterService = monsterService; // Expose for testing/debugging
    battleService = battleService; // Expose for testing/debugging
    private lastRecurrenceCheckHour: number = -1;

    async onload(): Promise<void> {
        console.log('Loading Quest Board plugin');

        // Load settings
        await this.loadSettings();

        // Apply custom quest→slot mapping to loot service
        if (this.settings.questSlotMapping) {
            const typedMapping: Record<string, GearSlot[]> = {};
            for (const [key, slots] of Object.entries(this.settings.questSlotMapping)) {
                typedMapping[key] = slots as GearSlot[];
            }
            lootGenerationService.setCustomSlotMapping(typedMapping);
        }

        // Initialize set bonus service with settings
        setBonusService.initialize(this.app, this.settings);

        // Load cached set bonuses from settings (sync happens after vault is ready)
        setBonusService.loadCache(this.settings.setBonusCache);

        // Set up save callback to persist cache when bonuses are generated
        setBonusService.setSaveCallback(async () => {
            this.settings.setBonusCache = setBonusService.getCacheForSave();
            await this.saveSettings();
        });

        // Sync cache with current folders after vault is ready (remove deleted folder entries)
        setTimeout(() => {
            setBonusService.syncWithFolders();
        }, 2500); // Slightly after recurring quest processing

        // Check and update streak on load (reset if missed days, reset shield weekly)
        if (this.settings.character) {
            const isPaladin = this.settings.character.class === 'paladin';
            const streakResult = checkStreakOnLoad(this.settings.character, isPaladin);

            if (streakResult.changed) {
                console.log('[QuestBoard] Streak check on load:', {
                    streakWasReset: streakResult.streakWasReset,
                    shieldWasReset: streakResult.shieldWasReset,
                    currentStreak: streakResult.character.currentStreak,
                });
                this.settings.character = streakResult.character;
                await this.saveSettings();
            }
        }

        // Initialize recurring quest service
        this.recurringQuestService = new RecurringQuestService(this.app.vault);

        // Process recurring quests on startup (small delay to let vault load)
        setTimeout(async () => {
            await this.recurringQuestService.processRecurrence();
        }, 2000);

        // Register interval to check at 1am daily
        this.registerInterval(
            window.setInterval(() => {
                const now = new Date();
                const currentHour = now.getHours();
                // Check if it's 1am and we haven't processed this hour yet
                if (currentHour === 1 && this.lastRecurrenceCheckHour !== 1) {
                    this.lastRecurrenceCheckHour = 1;
                    this.recurringQuestService.processRecurrence();
                } else if (currentHour !== 1) {
                    // Reset so we can trigger again tomorrow at 1am
                    this.lastRecurrenceCheckHour = currentHour;
                }
            }, 60 * 1000) // Check every minute
        );

        // Register the full-page view
        this.registerView(
            QUEST_BOARD_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new QuestBoardView(leaf, this)
        );

        // Register the sidebar view
        this.registerView(
            QUEST_SIDEBAR_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new QuestSidebarView(leaf, this)
        );

        // Add ribbon icon to open focused sidebar
        this.addRibbonIcon('swords', 'Open Quest Board', () => {
            this.activateSidebarView();
        });

        // Add command for consolidated command menu
        this.addCommand({
            id: 'open-command-menu',
            name: 'Open Quest Board Menu',
            callback: () => {
                new QuestBoardCommandMenu(this).open();
            },
        });

        // Add command to open focused sidebar
        this.addCommand({
            id: 'open-quest-board-sidebar',
            name: 'Open Quest Board (Sidebar)',
            callback: () => {
                this.activateSidebarView();
            },
        });

        // Add command to open full-page Kanban
        this.addCommand({
            id: 'open-quest-board-full',
            name: 'Open Quest Board (Full Page)',
            callback: () => {
                this.activateFullPageView();
            },
        });

        // Add command for character creation/edit
        this.addCommand({
            id: 'create-edit-character',
            name: 'Create/Edit Character',
            callback: () => {
                this.showWelcomeModal();
            },
        });

        // Add command to create a new quest
        this.addCommand({
            id: 'create-quest',
            name: 'Create New Quest',
            callback: () => {
                new CreateQuestModal(this.app, this, () => {
                    // Refresh views after quest creation
                    this.app.workspace.trigger('quest-board:refresh');
                }).open();
            },
        });

        // Add command for Application Gauntlet (legacy - kept for quick access)
        this.addCommand({
            id: 'create-application-gauntlet',
            name: 'New Application Gauntlet',
            callback: () => {
                new ApplicationGauntletModal(this.app).open();
            },
        });

        // Add command for Interview Arena (legacy - kept for quick access)
        this.addCommand({
            id: 'create-interview-arena',
            name: 'New Interview Arena',
            callback: () => {
                new InterviewArenaModal(this.app).open();
            },
        });

        // Add unified smart template command
        this.addCommand({
            id: 'create-quest-from-template',
            name: 'Create Quest from Template',
            callback: () => {
                openSmartTemplateModal(this.app, this);
            },
        });

        // Add achievement hub command
        this.addCommand({
            id: 'view-achievements',
            name: 'View Achievements Hub',
            callback: () => {
                new AchievementHubModal({
                    app: this.app,
                    badgeFolder: this.settings.badgeFolder,
                    onSave: async () => {
                        this.settings.achievements = useCharacterStore.getState().achievements;
                        await this.saveSettings();
                    }
                }).open();
            },
        });

        // Add open inventory command
        this.addCommand({
            id: 'open-inventory',
            name: 'Open Inventory',
            callback: () => {
                showInventoryModal(this.app, {
                    onSave: async () => {
                        this.settings.character = useCharacterStore.getState().character;
                        await this.saveSettings();
                    }
                });
            },
        });

        // Add open store command (Phase 3B)
        this.addCommand({
            id: 'open-store',
            name: 'Open Store',
            callback: () => {
                openStoreModal(this.app);
            },
        });

        // Add Long Rest command (Phase 3B)
        this.addCommand({
            id: 'long-rest',
            name: 'Long Rest (Restore HP & Mana)',
            callback: () => {
                const character = useCharacterStore.getState().character;
                if (!character) {
                    new (require('obsidian').Notice)('❌ No character found!', 2000);
                    return;
                }
                useCharacterStore.getState().fullRestore();
                new (require('obsidian').Notice)('🏨 Long Rest complete! HP and Mana fully restored.', 3000);
            },
        });

        // Add create achievement command
        this.addCommand({
            id: 'create-achievement',
            name: 'Create Custom Achievement',
            callback: () => {
                new CreateAchievementModal(this.app, (achievement) => {
                    const { achievements } = useCharacterStore.getState();
                    const updated = [...achievements, achievement];
                    useCharacterStore.setState({ achievements: updated });
                    this.settings.achievements = updated;
                    this.saveSettings();
                }).open();
            },
        });

        // Add command to manually trigger recurring quest processing
        this.addCommand({
            id: 'process-recurring-quests',
            name: 'Process Recurring Quests Now',
            callback: async () => {
                await this.recurringQuestService.processRecurrence();
                this.app.workspace.trigger('quest-board:refresh');
            },
        });

        // Add command to open recurring quests dashboard
        this.addCommand({
            id: 'recurring-quests-dashboard',
            name: 'Recurring Quests Dashboard',
            callback: () => {
                new RecurringQuestsDashboardModal(
                    this.app,
                    this.recurringQuestService,
                    () => this.app.workspace.trigger('quest-board:refresh')
                ).open();
            },
        });

        // Add migration command to add difficulty field to existing quests
        this.addCommand({
            id: 'migrate-add-difficulty',
            name: 'Migrate: Add Difficulty to Existing Quests',
            callback: async () => {
                await this.migrateQuestsDifficulty();
            },
        });

        // Add settings tab
        this.addSettingTab(new QuestBoardSettingTab(this.app, this));

        // Initialize status bar with buff provider
        statusBarService.initialize(this);
        statusBarService.registerProvider(new BuffStatusProvider());
        statusBarService.startAutoRefresh(60000); // Update every minute

        console.log('Quest Board plugin loaded successfully');
    }

    onunload(): void {
        statusBarService.destroy();
        console.log('Unloading Quest Board plugin');
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    /**
     * Activates the focused sidebar view in right split
     */
    async activateSidebarView(): Promise<void> {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(QUEST_SIDEBAR_VIEW_TYPE);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: QUEST_SIDEBAR_VIEW_TYPE, active: true });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    /**
     * Activates the full-page Kanban view in a new tab
     */
    async activateFullPageView(): Promise<void> {
        const { workspace } = this.app;

        // Check if already open in the main area (not sidebar)
        const leaves = workspace.getLeavesOfType(QUEST_BOARD_VIEW_TYPE);
        for (const existingLeaf of leaves) {
            // Check if this leaf is in the main area (not right/left sidebar)
            const root = existingLeaf.getRoot();
            if (root === workspace.rootSplit) {
                workspace.revealLeaf(existingLeaf);
                return;
            }
        }

        // Open in a new tab in the main area
        const leaf = workspace.getLeaf('tab');
        if (leaf) {
            await leaf.setViewState({ type: QUEST_BOARD_VIEW_TYPE, active: true });
            workspace.revealLeaf(leaf);
        }
    }

    /**
     * Shows the welcome modal for new users or character creation
     */
    showWelcomeModal(): void {
        new WelcomeModal(this.app, this, async () => {
            // Refresh views after character creation
            this.app.workspace.trigger('quest-board:refresh');
            // Re-activate sidebar to show the new character
            await this.activateSidebarView();
        }).open();
    }

    /**
     * Migrate existing quests to add difficulty field
     * Adds difficulty: medium to quests that don't have it
     */
    async migrateQuestsDifficulty(): Promise<void> {
        const { vault } = this.app;
        const storageFolder = this.settings.storageFolder || 'Life/Quest Board';
        const questsPath = `${storageFolder}/quests`;

        // Check if quests folder exists
        const questsFolder = vault.getAbstractFileByPath(questsPath);
        if (!questsFolder || !(questsFolder as any).children) {
            new (await import('obsidian')).Notice('❌ No quests folder found');
            return;
        }

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Recursively find all .md files in quests folder
        const findQuestFiles = (folder: any): any[] => {
            const files: any[] = [];
            for (const child of folder.children || []) {
                if (child.extension === 'md') {
                    files.push(child);
                } else if (child.children) {
                    files.push(...findQuestFiles(child));
                }
            }
            return files;
        };

        const questFiles = findQuestFiles(questsFolder);

        for (const file of questFiles) {
            try {
                const content = await vault.read(file);

                // Check if file has frontmatter
                if (!content.startsWith('---')) {
                    skippedCount++;
                    continue;
                }

                // Check if difficulty already exists in frontmatter
                const frontmatterEnd = content.indexOf('---', 3);
                if (frontmatterEnd === -1) {
                    skippedCount++;
                    continue;
                }

                const frontmatter = content.substring(0, frontmatterEnd + 3);

                // Skip if already has difficulty
                if (/^difficulty:/m.test(frontmatter)) {
                    skippedCount++;
                    continue;
                }

                // Add difficulty after priority line, or at end of frontmatter
                let newContent: string;
                const priorityMatch = frontmatter.match(/^(priority:.*)$/m);

                if (priorityMatch) {
                    // Insert after priority line
                    newContent = content.replace(
                        priorityMatch[0],
                        `${priorityMatch[0]}\ndifficulty: medium`
                    );
                } else {
                    // Insert before closing ---
                    newContent = content.replace(
                        /\n---/,
                        '\ndifficulty: medium\n---'
                    );
                }

                await vault.modify(file, newContent);
                migratedCount++;
            } catch (error) {
                console.error(`[Migration] Error processing ${file.path}:`, error);
                errorCount++;
            }
        }

        // Show result notice
        const Notice = (await import('obsidian')).Notice;
        new Notice(
            `✅ Migration complete!\n` +
            `${migratedCount} quests updated\n` +
            `${skippedCount} already have difficulty\n` +
            `${errorCount} errors`,
            5000
        );

        // Refresh views
        this.app.workspace.trigger('quest-board:refresh');
    }
}

