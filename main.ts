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
    BATTLE_VIEW_TYPE,
    DUNGEON_VIEW_TYPE,
    CHARACTER_VIEW_TYPE,
    QuestBoardView,
    QuestSidebarView,
    BattleItemView,
    DungeonItemView,
    CharacterView
} from './src/views';
import { useDungeonStore } from './src/store/dungeonStore';
import { getAllDungeonTemplates, registerUserDungeons, clearUserDungeons, getRandomDungeon } from './src/data/dungeonTemplates';
import { loadUserDungeons, createDungeonTemplateDoc } from './src/services/UserDungeonLoader';
import type { DungeonTemplate } from './src/models/Dungeon';
import { CreateQuestModal } from './src/modals/CreateQuestModal';
import { AIQuestGeneratorModal } from './src/modals/AIQuestGeneratorModal';
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
import { RecoveryTimerStatusProvider } from './src/services/RecoveryTimerStatusProvider';
import { QuestBoardCommandMenu } from './src/modals/QuestBoardCommandMenu';
import { WelcomeModal } from './src/modals/WelcomeModal';
import { showInventoryModal } from './src/modals/InventoryModal';
import { showSkillLoadoutModal } from './src/modals/SkillLoadoutModal';
import { openStoreModal } from './src/modals/StoreModal';
import { lootGenerationService } from './src/services/LootGenerationService';
import { setBonusService } from './src/services/SetBonusService';
import { bountyService } from './src/services/BountyService';
import { monsterService, createRandomMonster } from './src/services/MonsterService';
import { battleService, setSaveCallback as setBattleSaveCallback, setLevelUpCallback } from './src/services/BattleService';
import { startRecoveryTimerCheck, stopRecoveryTimerCheck } from './src/services/RecoveryTimerService';
import { showEliteEncounterModal } from './src/modals/EliteEncounterModal';
import { showDungeonSelectionModal } from './src/modals/DungeonSelectionModal';
import { AIDungeonWizardModal } from './src/modals/AIDungeonWizardModal';
import { ELITE_LEVEL_UNLOCK, ELITE_OVERWORLD_CHANCE, ELITE_NAME_PREFIXES, DEV_FEATURES_ENABLED } from './src/config/combatConfig';
import { GearSlot } from './src/models/Gear';
import { LevelUpModal } from './src/modals/LevelUpModal';
import { CharacterClass } from './src/models/Character';
import { showProgressDashboardModal } from './src/modals/ProgressDashboardModal';
import { initDailyNoteService, dailyNoteService } from './src/services/DailyNoteService';
import { initTemplateStatsService } from './src/services/TemplateStatsService';
import { setBalanceTestingContext } from './src/services/BalanceTestingService';
import { FolderWatchService } from './src/services/FolderWatchService';



export default class QuestBoardPlugin extends Plugin {
    settings!: QuestBoardSettings;
    recurringQuestService!: RecurringQuestService;
    folderWatchService!: FolderWatchService;
    monsterService = monsterService; // Expose for testing/debugging
    battleService = battleService; // Expose for testing/debugging
    private lastRecurrenceCheckHour: number = -1;

    async onload(): Promise<void> {
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

        // Initialize daily note service
        initDailyNoteService(this.app.vault, this.settings);

        // Initialize template stats service (for smart suggestions)
        initTemplateStatsService(this);

        // Initialize set bonus service with settings
        setBonusService.initialize(this.app, this.settings);

        // Load cached set bonuses from settings (sync happens after vault is ready)
        setBonusService.loadCache(this.settings.setBonusCache);

        // Set up save callback to persist cache when bonuses are generated
        setBonusService.setSaveCallback(async () => {
            this.settings.setBonusCache = setBonusService.getCacheForSave();
            await this.saveSettings();
        });

        // Initialize bounty service with settings (for AI description generation)
        bountyService.initialize(this.settings);
        bountyService.setSaveCallback(async () => {
            await this.saveSettings();
        });

        // Initialize balance testing context (Phase 8: Balance Testing Logger)
        // Only enabled when DEV_FEATURES_ENABLED = true
        if (DEV_FEATURES_ENABLED) {
            setBalanceTestingContext(this.app, () => this.settings);
        }

        // Set up save callback for battle outcomes (persists XP, gold, HP after combat)
        setBattleSaveCallback(async () => {
            const currentCharacter = useCharacterStore.getState().character;
            const currentInventory = useCharacterStore.getState().inventory;
            this.settings.character = currentCharacter;
            this.settings.inventory = currentInventory;
            await this.saveSettings();
        });

        // Set up level-up callback for battle XP gains (shows LevelUpModal)
        setLevelUpCallback((options) => {
            const modal = new LevelUpModal(
                this.app,
                options.characterClass as CharacterClass,
                options.newLevel,
                options.tierChanged,
                options.isTrainingMode,
                options.onGraduate ?? (() => { }),
                options.unlockedSkills ?? []  // Phase 7: Pass unlocked skills
            );
            modal.open();
        });

        // Sync cache with current folders after vault is ready (remove deleted folder entries)
        setTimeout(async () => {
            // Load user dungeons from configured folder
            const dungeonFolder = this.settings.userDungeonFolder || 'Life/Quest Board/dungeons';
            clearUserDungeons(); // Clear any previous user dungeons
            const { templates, errors, warnings } = await loadUserDungeons(this.app.vault, dungeonFolder);
            if (templates.length > 0) {
                registerUserDungeons(templates);
            }
            if (errors.length > 0) {
                console.warn('[QuestBoard] User dungeon load errors:', errors);
            }

            // Sync set bonus cache
            setBonusService.syncWithFolders();
        }, 2500); // Slightly after recurring quest processing

        // Check and update streak on load (reset if missed days, reset shield weekly)
        if (this.settings.character) {
            const isPaladin = this.settings.character.class === 'paladin';
            const streakResult = checkStreakOnLoad(this.settings.character, isPaladin);

            if (streakResult.changed) {
                this.settings.character = streakResult.character;
                await this.saveSettings();
            }
        }

        // Initialize recurring quest service
        this.recurringQuestService = new RecurringQuestService(this.app.vault, this);

        // Initialize folder watch service (Daily Quest & Watched Folder)
        this.folderWatchService = new FolderWatchService(this.app.vault, this);

        // Process recurring quests on startup (small delay to let vault load)
        setTimeout(async () => {
            await this.recurringQuestService.processRecurrence();
            // Initialize folder watchers after vault is ready
            await this.folderWatchService.initialize();
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

        // Register the battle view (opens in its own tab)
        this.registerView(
            BATTLE_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new BattleItemView(leaf, this)
        );

        // Register the dungeon view (opens in its own tab)
        this.registerView(
            DUNGEON_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new DungeonItemView(leaf, this)
        );

        // Register the character page view (opens in its own tab)
        this.registerView(
            CHARACTER_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new CharacterView(leaf, this)
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

        // Add command for AI quest generation
        this.addCommand({
            id: 'ai-generate-quest',
            name: 'Generate Quest with AI',
            callback: () => {
                new AIQuestGeneratorModal(this.app, this, () => {
                    this.app.workspace.trigger('quest-board:refresh');
                }).open();
            },
        });

        // Add command for AI dungeon generation wizard
        this.addCommand({
            id: 'generate-ai-dungeon',
            name: 'Generate AI Dungeon',
            callback: () => {
                new AIDungeonWizardModal(
                    this.app,
                    this.settings,
                    async () => {
                        await this.saveSettings();
                    }
                ).open();
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

        // Add manage skills command (Phase 6)
        this.addCommand({
            id: 'manage-skills',
            name: 'Manage Skills',
            callback: () => {
                showSkillLoadoutModal(this.app, {
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
                openStoreModal(this.app, {
                    onSave: async () => {
                        this.settings.character = useCharacterStore.getState().character;
                        this.settings.inventory = useCharacterStore.getState().inventory;
                        await this.saveSettings();
                    }
                });
            },
        });

        // Add Long Rest command (Phase 3B) - with paid bypass option (Phase 5)
        this.addCommand({
            id: 'long-rest',
            name: 'Long Rest (Restore HP & Mana)',
            callback: async () => {
                const store = useCharacterStore.getState();
                const character = store.character;
                if (!character) {
                    new (require('obsidian').Notice)('❌ No character found!', 2000);
                    return;
                }
                // Check if already resting (recovery timer active)
                if (character.recoveryTimerEnd) {
                    const remaining = new Date(character.recoveryTimerEnd).getTime() - Date.now();
                    if (remaining > 0) {
                        // Offer paid bypass instead of just blocking
                        const { openPaidRestModal } = await import('./src/modals/PaidRestModal');
                        openPaidRestModal(this.app, {
                            onSuccess: () => {
                                // Refresh views if needed
                            },
                            onSave: async () => {
                                this.settings.character = useCharacterStore.getState().character;
                                await this.saveSettings();
                            },
                        });
                        return;
                    }
                }
                // Full restore HP/Mana
                store.fullRestore();
                // Clear unconscious status
                store.setStatus('active');
                // Set 30-min recovery timer
                const endTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
                store.setRecoveryTimer(endTime);

                // Persist to settings so HP survives reload
                this.settings.character = useCharacterStore.getState().character;
                await this.saveSettings();

                new (require('obsidian').Notice)('🏨 Long Rest complete! HP and Mana fully restored. Resting for 30 minutes.', 3000);
            },
        });

        // Add Fight command (Phase 3B Step 8) - with elite modal for elite spawns
        this.addCommand({
            id: 'start-fight',
            name: 'Start Fight (Random Encounter)',
            callback: () => {
                const character = useCharacterStore.getState().character;
                if (!character) {
                    new (require('obsidian').Notice)('❌ No character found!', 2000);
                    return;
                }

                // Check stamina
                if ((character.stamina ?? 0) < 1) {
                    new (require('obsidian').Notice)('⚡ Not enough stamina! Complete quests to earn stamina.', 3000);
                    return;
                }

                // Roll for elite (15% at L5+)
                let tier: 'overworld' | 'elite' = 'overworld';
                if (character.level >= ELITE_LEVEL_UNLOCK && Math.random() < ELITE_OVERWORLD_CHANCE) {
                    tier = 'elite';
                }

                // Create monster first
                const monster = createRandomMonster(character.level, tier);
                if (!monster) {
                    new (require('obsidian').Notice)('❌ Failed to create monster', 2000);
                    return;
                }

                // Apply random name prefix for elite mobs
                if (tier === 'elite') {
                    const prefix = ELITE_NAME_PREFIXES[Math.floor(Math.random() * ELITE_NAME_PREFIXES.length)];
                    monster.name = `${prefix} ${monster.name.replace(/^Elite /, '')}`;
                }

                // If elite, show modal first; otherwise start battle directly
                if (tier === 'elite') {
                    showEliteEncounterModal(this.app, monster, {
                        manifestDir: this.manifest.dir,
                        onFight: () => {
                            // Consume stamina when fight is accepted
                            useCharacterStore.getState().consumeStamina();
                        },
                        onFlee: () => {
                            // No stamina consumed if flee
                        },
                        onSave: async () => {
                            this.settings.character = useCharacterStore.getState().character;
                            await this.saveSettings();
                        },
                        onBattleStart: () => {
                            this.activateBattleView();
                        },
                    });
                } else {
                    // Regular mob - start battle directly
                    const success = battleService.startBattleWithMonster(monster);
                    if (success) {
                        useCharacterStore.getState().consumeStamina();
                        this.activateBattleView();
                    } else {
                        new (require('obsidian').Notice)('❌ Failed to start battle', 2000);
                    }
                }
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

        // Add command to open progress dashboard (Phase 4)
        this.addCommand({
            id: 'open-progress-dashboard',
            name: 'View Progress Dashboard',
            callback: () => {
                showProgressDashboardModal(this.app, async () => {
                    this.settings.character = useCharacterStore.getState().character;
                    await this.saveSettings();
                });
            },
        });

        // Add command to open full-page character view
        this.addCommand({
            id: 'open-character-page',
            name: 'Open Character Page',
            callback: () => {
                this.activateCharacterView();
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

        // Add dungeon preview command (dev testing)
        this.addCommand({
            id: 'preview-dungeon',
            name: 'Preview Dungeon (Dev)',
            callback: () => {
                // Use settings.character directly (store may not be initialized yet)
                const character = this.settings.character;
                if (!character) {
                    new (require('obsidian').Notice)('❌ No character found! Create one first.', 2000);
                    return;
                }

                // Ensure the character store is initialized for DungeonView
                if (!useCharacterStore.getState().character) {
                    useCharacterStore.getState().setCharacter(character);
                }

                // Show dungeon selection modal
                showDungeonSelectionModal(
                    this.app,
                    (template) => {
                        const success = useDungeonStore.getState().enterDungeon(template.id, character.level, true);
                        if (success) {
                            this.activateDungeonView();
                        } else {
                            new (require('obsidian').Notice)('❌ Failed to load dungeon', 2000);
                        }
                    },
                    false // Include test cave for dev command
                );
            },
        });

        // Add settings tab
        this.addSettingTab(new QuestBoardSettingTab(this.app, this));

        // Initialize status bar with providers
        statusBarService.initialize(this);
        statusBarService.registerProvider(new BuffStatusProvider());
        statusBarService.registerProvider(new RecoveryTimerStatusProvider());
        statusBarService.startAutoRefresh(10000); // Update every 10 seconds for timer countdown

        // Start recovery timer check (Phase 3B Step 9: Death Penalty)
        startRecoveryTimerCheck();
    }

    onunload(): void {
        stopRecoveryTimerCheck();
        statusBarService.destroy();
        this.folderWatchService?.cleanup();
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
     * Activates the battle view in a new tab
     */
    async activateBattleView(): Promise<void> {
        const { workspace } = this.app;

        // Always open in a new tab (battles shouldn't reuse existing)
        const leaf = workspace.getLeaf('tab');
        if (leaf) {
            await leaf.setViewState({ type: BATTLE_VIEW_TYPE, active: true });
            workspace.revealLeaf(leaf);
        }
    }

    /**
     * Activates the dungeon view in a new tab
     */
    async activateDungeonView(): Promise<void> {
        const { workspace } = this.app;

        // Always open in a new tab
        const leaf = workspace.getLeaf('tab');
        if (leaf) {
            await leaf.setViewState({ type: DUNGEON_VIEW_TYPE, active: true });
            workspace.revealLeaf(leaf);
        }
    }

    /**
     * Activates the character page view in a new tab (or reveals existing)
     */
    async activateCharacterView(): Promise<void> {
        const { workspace } = this.app;

        // Reuse existing character page tab if open in main area
        const leaves = workspace.getLeavesOfType(CHARACTER_VIEW_TYPE);
        for (const existingLeaf of leaves) {
            const root = existingLeaf.getRoot();
            if (root === workspace.rootSplit) {
                workspace.revealLeaf(existingLeaf);
                return;
            }
        }

        // Open in a new tab in the main area
        const leaf = workspace.getLeaf('tab');
        if (leaf) {
            await leaf.setViewState({ type: CHARACTER_VIEW_TYPE, active: true });
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

