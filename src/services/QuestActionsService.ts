/**
 * Quest Actions Service
 * 
 * Centralized business logic for quest state changes.
 * Handles side effects like streak updates, notifications, and loot drops.
 * Used by both SidebarQuests and FullKanban through useQuestActions hook.
 */

import { Vault, Notice, App, TFile } from 'obsidian';
import { Quest, isAIGeneratedQuest, isManualQuest } from '../models/Quest';
import { ColumnConfigService } from './ColumnConfigService';
import type { QuestBoardSettings } from '../settings';
import { Character } from '../models/Character';
import { LootDrop } from '../models/Gear';
import { useQuestStore } from '../store/questStore';
import { useCharacterStore } from '../store/characterStore';
import { useTaskSectionsStore } from '../store/taskSectionsStore';
import { saveManualQuest, saveAIQuest } from './QuestService';
import { toggleTaskInFile, readTasksWithSections, getTaskCompletion } from './TaskFileService';
import { updateStreak, getStreakDisplay, StreakUpdateResult } from './StreakService';
import { lootGenerationService } from './LootGenerationService';
import { AchievementService } from './AchievementService';
import { showAchievementUnlock } from '../modals/AchievementUnlockModal';
import { showLootModal } from '../modals/LootModal';
import { showInventoryManagementModal } from '../modals/InventoryManagementModal';
import { GearItem } from '../models/Gear';
import {
    evaluateTriggers,
    grantPowerUp,
    expirePowerUps,
    EFFECT_DEFINITIONS,
    rollFromPool,
    TriggerContext,
} from './PowerUpService';
import { checkBountyTrigger } from './BountyService';
import { showBountyModal } from '../modals/BountyModal';
import { showBountyReviveModal } from '../modals/BountyReviveModal';
import { dailyNoteService } from './DailyNoteService';
import { ensureFolderExists } from '../utils/pathValidator';
import { STAMINA_PER_QUEST } from '../config/combatConfig';

/**
 * Result of moving a quest
 */
export interface MoveQuestResult {
    success: boolean;
    quest: Quest;
    streakResult?: StreakUpdateResult;
    loot?: LootDrop;
}

/**
 * Result of toggling a task
 */
export interface ToggleTaskResult {
    success: boolean;
}

/**
 * Options for moving a quest
 */
export interface MoveQuestOptions {
    storageFolder: string;
    /** Plugin settings (required for column configuration) */
    settings: QuestBoardSettings;
    streakMode?: 'quest' | 'task';
    /** App reference for showing modals (optional) */
    app?: App;
    /** Whether to generate and show loot on quest completion */
    enableLoot?: boolean;
    /** Bounty chance percentage (0-20, defaults to 10) */
    bountyChance?: number;
    /** Callback to open battle view when bounty fight starts */
    onBattleStart?: () => void;
    /** Asset folder path for sprite resolution */
    assetFolder?: string;
    /** XP awarded for the quest (for daily note logging) */
    xpAwarded?: number;
}

/**
 * Move a quest to a new status.
 * Handles all side effects: store update, file save, streak update, loot, etc.
 * Does NOT trigger completion rewards unless moving to a completion column.
 */
export async function moveQuest(
    vault: Vault,
    questId: string,
    newStatus: string,
    options: MoveQuestOptions
): Promise<MoveQuestResult> {
    const quest = useQuestStore.getState().quests.get(questId);
    if (!quest) {
        console.error('[QuestActionsService] Quest not found:', questId);
        return { success: false, quest: quest as any };
    }

    // Use ColumnConfigService to check if this is a completion column
    const columnConfigService = new ColumnConfigService(options.settings);
    const isCompletion = columnConfigService.isCompletionColumn(newStatus);

    const updatedQuest: Quest = {
        ...quest,
        status: newStatus,
        completedDate: isCompletion && !quest.completedDate
            ? new Date().toISOString()
            : quest.completedDate,
    };

    // Update store (optimistic update)
    useQuestStore.getState().upsertQuest(updatedQuest);

    // Update streak if moving to a completion column
    let streakResult: StreakUpdateResult | undefined;
    if (isCompletion && options.streakMode === 'quest') {
        const currentChar = useCharacterStore.getState().character;
        if (currentChar) {
            const isPaladin = currentChar.class === 'paladin';
            streakResult = updateStreak(currentChar, isPaladin);

            useCharacterStore.getState().setCharacter(streakResult.character);

            // Notify user of streak updates
            if (streakResult.streakBroken) {
                new Notice('💔 Streak broken! Starting fresh.', 3000);
            } else if (streakResult.shieldUsed) {
                new Notice('🛡️ Paladin Shield protected your streak!', 3000);
            } else if (streakResult.newRecord) {
                new Notice(`🏆 New streak record: ${getStreakDisplay(streakResult.character.currentStreak)}`, 4000);
            } else if (streakResult.character.currentStreak > 1) {
                new Notice(`🔥 Streak: ${getStreakDisplay(streakResult.character.currentStreak)}`, 2000);
            }

            // === STREAK UPDATE TRIGGERS ===
            // Check for streak milestone power-ups (3-day, 7-day, etc.)
            const previousStreak = currentChar.currentStreak;
            const newStreak = streakResult.character.currentStreak;

            if (newStreak > previousStreak) {
                const streakContext: TriggerContext = {
                    currentStreak: newStreak,
                    previousStreak: previousStreak,
                    streakJustBroken: streakResult.streakBroken,
                };

                // Evaluate streak_update triggers
                const streakTriggers = evaluateTriggers('streak_update', streakContext);
                if (streakTriggers.length > 0) {
                    let streakPowerUps = expirePowerUps(useCharacterStore.getState().character?.activePowerUps ?? []);

                    for (const trigger of streakTriggers) {
                        const effectId = trigger.grantsEffect ?? (trigger.grantsTier ? rollFromPool(trigger.grantsTier) : null);
                        if (effectId) {
                            const result = grantPowerUp(streakPowerUps, effectId, trigger.id);
                            if (result.granted) {
                                streakPowerUps = result.powerUps;
                                const effectDef = EFFECT_DEFINITIONS[effectId];
                                // Show notification
                                if (effectDef?.notificationType === 'toast' || effectDef?.notificationType === 'modal') {
                                    new Notice(`${result.granted.icon} ${result.granted.name}: ${result.granted.description}`, 5000);
                                }
                            }
                        }
                    }

                    // Save power-ups
                    useCharacterStore.getState().setPowerUps(streakPowerUps);
                }

                // === STREAK ACHIEVEMENTS ===
                // Check for streak milestone achievements (7-day, 30-day, etc.)
                const achievements = useCharacterStore.getState().achievements;
                const achievementService = new AchievementService(null as any); // vault not needed for checks
                const streakAchievementCheck = achievementService.checkStreakAchievements(achievements, newStreak);

                if (streakAchievementCheck.newlyUnlocked.length > 0) {
                    // Show unlock popups
                    streakAchievementCheck.newlyUnlocked.forEach((achievement, index) => {
                        setTimeout(() => {
                            showAchievementUnlock(null as any, achievement);
                        }, 2000 + (index * 1000));
                    });

                    // Save achievements to store
                    useCharacterStore.setState({ achievements: [...achievements] });
                }
            }
        }
    }

    // === QUEST COMPLETION TRIGGERS ===
    // Check for One-Shot, etc. when quest is moved to completion column
    if (isCompletion) {
        const character = useCharacterStore.getState().character;
        if (character) {
            // Detect quest timing and context
            const now = new Date();
            const dayOfWeek = now.getDay();  // 0=Sun, 1=Mon, ... 6=Sat
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Check if this is first quest of day
            const today = now.toLocaleDateString('en-CA');
            const isFirstTaskOfDay = character.lastTaskDate !== today;

            // Check if quest was completed early (24h+ before expected)
            // For recurring quests with instanceDate, compare to that
            // Otherwise, this trigger won't fire (no due date)
            let questCompletedEarly = false;
            let questCompletedOnDueDate = false;

            if (isManualQuest(quest) && quest.instanceDate) {
                const dueDate = new Date(quest.instanceDate + 'T23:59:59');
                const msUntilDue = dueDate.getTime() - now.getTime();
                const hoursUntilDue = msUntilDue / (1000 * 60 * 60);
                questCompletedEarly = hoursUntilDue >= 24;  // 24h+ before due
                questCompletedOnDueDate = hoursUntilDue >= 0 && hoursUntilDue < 24;  // On due date
            }

            // Build quest-level context from activity history
            const questCategoryCountToday: Record<string, number> = {};
            const questCategoriesSet = new Set<string>();
            let questsCompletedToday = 0;
            let questsInLastHour = 0;
            const oneHourAgo = now.getTime() - (60 * 60 * 1000);

            for (const event of character.activityHistory || []) {
                if (event.date === today && event.type === 'quest_complete') {
                    questsCompletedToday++;
                    if (event.category) {
                        const cat = event.category.toLowerCase();
                        questCategoryCountToday[cat] = (questCategoryCountToday[cat] || 0) + 1;
                        questCategoriesSet.add(cat);
                    }
                    if (event.timestamp) {
                        const eventTime = new Date(event.timestamp).getTime();
                        if (eventTime >= oneHourAgo) {
                            questsInLastHour++;
                        }
                    }
                }
            }

            // Include current quest in counts (it's about to be logged)
            const currentQuestCategory = quest.category?.toLowerCase();
            if (currentQuestCategory) {
                questCategoryCountToday[currentQuestCategory] = (questCategoryCountToday[currentQuestCategory] || 0) + 1;
                questCategoriesSet.add(currentQuestCategory);
            }
            questsCompletedToday++;
            questsInLastHour++;

            const questContext: TriggerContext = {
                questCompleted: true,
                isWeekend,      // For Weekend Warrior
                dayOfWeek,      // For Fresh Start (Monday = 1)
                isFirstTaskOfDay,  // For Fresh Start
                questCompletedEarly,  // For Speedrunner
                questCompletedOnDueDate, // For Clutch
                currentHour: now.getHours(),  // For Early Riser / Night Owl
                questsCompletedToday,
                questsInLastHour,
                questCategoriesCompletedToday: Array.from(questCategoriesSet),
                questCategoryCountToday,
                questCategory: quest.category,
            };

            const questTriggers = evaluateTriggers('quest_completion', questContext);
            if (questTriggers.length > 0) {
                let questPowerUps = expirePowerUps(character.activePowerUps ?? []);

                for (const trigger of questTriggers) {
                    const effectId = trigger.grantsEffect ?? (trigger.grantsTier ? rollFromPool(trigger.grantsTier) : null);
                    if (effectId) {
                        const result = grantPowerUp(questPowerUps, effectId, trigger.id);
                        if (result.granted) {
                            questPowerUps = result.powerUps;
                            const effectDef = EFFECT_DEFINITIONS[effectId];
                            if (effectDef?.notificationType === 'toast' || effectDef?.notificationType === 'modal') {
                                new Notice(`${result.granted.icon} ${result.granted.name}: ${result.granted.description}`, 5000);
                            }
                        }
                    }
                }

                useCharacterStore.getState().setPowerUps(questPowerUps);
                // Update status bar immediately
                import('./StatusBarService').then(({ statusBarService }) => statusBarService.update());
            }
        }
    }

    // === LOOT GENERATION ===
    // Generate and award loot when quest is completed
    let loot: LootDrop | undefined;

    // === BOUNTY ROLL ===
    // Roll for bounty first, but don't show modal yet (wait for loot modal to close)
    let pendingBounty: ReturnType<typeof checkBountyTrigger>['bounty'] = undefined;
    if (isCompletion && options.app) {
        const character = useCharacterStore.getState().character;
        if (character) {
            const bountyChance = options.bountyChance ?? 10;
            const bountyResult = checkBountyTrigger(updatedQuest, character, bountyChance);
            if (bountyResult.triggered && bountyResult.bounty) {
                pendingBounty = bountyResult.bounty;
            }
        }
    }

    // Helper to show bounty modal (called after loot modal closes)
    const showPendingBounty = () => {
        if (!pendingBounty || !options.app) return;

        // Check if player is actually unconscious (status AND HP check to prevent false positives)
        const currentChar = useCharacterStore.getState().character;
        const isActuallyUnconscious = currentChar?.status === 'unconscious' && (currentChar?.currentHP ?? 0) <= 0;

        if (isActuallyUnconscious) {
            // Show revive pre-modal
            showBountyReviveModal(options.app, pendingBounty, {
                onSave: async () => {
                    // Will be called after revive + bounty modal chain
                },
                onBattleStart: options.onBattleStart,
            });
        } else {
            // Show bounty modal directly
            showBountyModal(options.app, pendingBounty, {
                onSave: async () => {
                    // Battle service handles saving
                },
                onBattleStart: options.onBattleStart,
                assetFolder: options.assetFolder,
            });
        }
    };

    if (isCompletion && options.enableLoot !== false) {
        const character = useCharacterStore.getState().character;
        if (character) {
            try {
                // Generate loot based on quest and character
                loot = lootGenerationService.generateQuestLoot(updatedQuest, character);

                // Separate gold from gear
                const goldRewards = loot.filter(r => r.type === 'gold');
                const gearRewards = loot.filter(r => r.type === 'gear') as { type: 'gear'; item: GearItem }[];
                const consumableRewards = loot.filter(r => r.type === 'consumable');

                const charStore = useCharacterStore.getState();

                // Gold is always added immediately
                for (const reward of goldRewards) {
                    if (reward.type === 'gold') {
                        charStore.updateGold(reward.amount);
                    }
                }

                // Check if we have room for gear
                const gearItems = gearRewards.map(r => r.item);
                const freeSlots = charStore.getFreeSlots();

                if (gearItems.length > 0 && gearItems.length > freeSlots) {
                    // Inventory full - show management modal
                    if (options.app) {
                        setTimeout(() => {
                            showInventoryManagementModal(options.app!, {
                                pendingLoot: gearItems,
                                title: 'Quest Complete - Inventory Full!',
                                onConfirm: (acceptedItems, itemsToSell) => {
                                    const store = useCharacterStore.getState();

                                    // Sell marked items first
                                    if (itemsToSell.length > 0) {
                                        const sellIds = itemsToSell.map(i => i.id);
                                        const result = store.bulkRemoveGear(sellIds);
                                        if (result.totalGold > 0) {
                                            new Notice(`💰 Sold ${result.removed.length} item(s) for ${result.totalGold}g`, 3000);
                                        }
                                    }

                                    // Add accepted items
                                    const rejected = store.bulkAddGear(acceptedItems);
                                    if (rejected.length > 0) {
                                        console.warn('[QuestActionsService] Some items could not be added:', rejected);
                                    }

                                    // Show what was obtained
                                    const keptCount = acceptedItems.length - rejected.length;
                                    if (keptCount > 0) {
                                        new Notice(`✨ Obtained ${keptCount} item(s)!`, 3000);
                                    }

                                    // Show pending bounty after inventory management
                                    showPendingBounty();
                                },
                                onAbandon: () => {
                                    new Notice('🗑️ Abandoned all loot.', 2000);
                                    // Show pending bounty even if loot was abandoned
                                    showPendingBounty();
                                },
                            });
                        }, 500);
                    }
                } else {
                    // Fits - add gear directly
                    for (const item of gearItems) {
                        charStore.addGear(item);
                    }

                    // Add consumables to inventory
                    for (const reward of consumableRewards) {
                        if (reward.type === 'consumable') {
                            charStore.addInventoryItem(reward.itemId, reward.quantity);
                        }
                    }

                    // Show loot modal if app is provided
                    if (options.app && loot.length > 0) {
                        setTimeout(() => {
                            showLootModal(options.app!, {
                                title: 'Quest Complete!',
                                subtitle: updatedQuest.questName,
                                loot: loot!,
                                onClose: () => {
                                    // Show bounty modal after loot modal closes
                                    showPendingBounty();
                                },
                            });
                        }, 500);
                    } else if (pendingBounty && options.app) {
                        // No loot to show, but we have a bounty - show it after short delay
                        setTimeout(() => {
                            showPendingBounty();
                        }, 500);
                    }
                }
            } catch (error) {
                console.error('[QuestActionsService] Failed to generate loot:', error);
            }
        }
    } else if (pendingBounty && options.app) {
        // Loot disabled but bounty triggered - show bounty after short delay
        setTimeout(() => {
            showPendingBounty();
        }, 500);
    }

    // === STAMINA AWARD ===
    // Award stamina on quest completion (Phase 3B)
    if (isCompletion) {
        useCharacterStore.getState().awardStamina(STAMINA_PER_QUEST);

        // === ACTIVITY LOGGING ===
        // Log quest completion for progress tracking (Phase 4)
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        useCharacterStore.getState().logActivity({
            type: 'quest_complete',
            date: dateString,
            xpGained: isManualQuest(updatedQuest) ? updatedQuest.completionBonus : 0,
            goldGained: 0, // Gold is tracked separately in loot
            questId: updatedQuest.questId,
            questName: updatedQuest.questName,
            category: updatedQuest.category,
            details: `Completed: ${updatedQuest.questName}`,
        });

        // === DAILY NOTE LOGGING ===
        // Log quest completion to daily note (if enabled)
        if (dailyNoteService) {
            const xpForLog = options.xpAwarded ?? (isManualQuest(updatedQuest) ? updatedQuest.completionBonus : 0);
            await dailyNoteService.logQuestCompletion(updatedQuest, xpForLog);
        }
    }

    // Save to file
    try {
        let saveResult: boolean;
        if (isAIGeneratedQuest(updatedQuest)) {
            saveResult = await saveAIQuest(vault, options.storageFolder, updatedQuest);
        } else {
            saveResult = await saveManualQuest(vault, options.storageFolder, updatedQuest);
        }

        if (!saveResult) {
            console.error('[QuestActionsService] Save returned false');
            return { success: false, quest: updatedQuest, streakResult, loot };
        }
    } catch (error) {
        console.error('[QuestActionsService] Failed to save quest:', error);
        return { success: false, quest: updatedQuest, streakResult, loot };
    }

    return { success: true, quest: updatedQuest, streakResult, loot };
}

/**
 * Toggle a task in a quest's linked file.
 * Updates task sections store after toggle.
 */
export async function toggleTask(
    vault: Vault,
    questId: string,
    lineNumber: number
): Promise<ToggleTaskResult> {
    const quest = useQuestStore.getState().quests.get(questId);
    if (!quest || !isManualQuest(quest) || !quest.linkedTaskFile) {
        return { success: false };
    }

    const success = await toggleTaskInFile(vault, quest.linkedTaskFile, lineNumber);

    if (success) {
        // Reload task sections for this quest
        const taskResult = await readTasksWithSections(vault, quest.linkedTaskFile);
        if (taskResult.success) {
            useTaskSectionsStore.getState().setSections(
                questId,
                taskResult.sections,
                getTaskCompletion(taskResult.allTasks)
            );
        }
    }

    return { success };
}

/**
 * Options for completing a quest explicitly
 */
export interface CompleteQuestOptions extends MoveQuestOptions {
    /** Callback to save character data after completion */
    onSaveCharacter?: () => Promise<void>;
}

/**
 * Complete a quest explicitly via Complete button.
 * Awards all completion rewards (loot, streak, power-ups, bounty, stamina, activity logging).
 * If a completion column is configured, moves the quest there.
 * If no completion column exists, quest stays in current column with completedDate set.
 */
export async function completeQuest(
    vault: Vault,
    questId: string,
    options: CompleteQuestOptions
): Promise<MoveQuestResult> {
    const columnConfigService = new ColumnConfigService(options.settings);
    const completionColumn = columnConfigService.getFirstCompletionColumn();

    if (completionColumn) {
        // Move to completion column (triggers all rewards via moveQuest)
        return await moveQuest(vault, questId, completionColumn.id, options);
    } else {
        // No completion column configured - manually trigger completion rewards
        const quest = useQuestStore.getState().quests.get(questId);
        if (!quest) {
            return { success: false, quest: quest as any };
        }

        // Set completedDate manually since we're not moving to a completion column
        const updatedQuest: Quest = {
            ...quest,
            completedDate: new Date().toISOString(),
        };

        // Update store
        useQuestStore.getState().upsertQuest(updatedQuest);

        // Award stamina
        useCharacterStore.getState().awardStamina(STAMINA_PER_QUEST);

        // Log activity
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        useCharacterStore.getState().logActivity({
            type: 'quest_complete',
            date: dateString,
            xpGained: isManualQuest(updatedQuest) ? updatedQuest.completionBonus : 0,
            goldGained: 0,
            questId: updatedQuest.questId,
            questName: updatedQuest.questName,
            category: updatedQuest.category,
            details: `Completed: ${updatedQuest.questName}`,
        });

        // Save to file
        try {
            if (isAIGeneratedQuest(updatedQuest)) {
                await saveAIQuest(vault, options.storageFolder, updatedQuest);
            } else {
                await saveManualQuest(vault, options.storageFolder, updatedQuest);
            }
        } catch (error) {
            console.error('[QuestActionsService] Failed to save quest:', error);
            return { success: false, quest: updatedQuest };
        }

        // Call save callback if provided
        if (options.onSaveCharacter) {
            await options.onSaveCharacter();
        }

        new Notice(`✅ Quest completed: ${updatedQuest.questName}`, 3000);
        return { success: true, quest: updatedQuest };
    }
}

/**
 * Reopen a completed quest - clears completedDate, moves to first column, and logs event.
 */
export async function reopenQuest(
    vault: Vault,
    questId: string,
    storageFolder: string,
    settings?: QuestBoardSettings
): Promise<{ success: boolean; quest?: Quest }> {
    const quest = useQuestStore.getState().quests.get(questId);
    if (!quest) {
        console.error('[QuestActionsService] Quest not found for reopen:', questId);
        return { success: false };
    }

    if (!quest.completedDate) {
        console.warn('[QuestActionsService] Quest is not completed, cannot reopen:', questId);
        return { success: false };
    }

    // Determine the target status - first non-completion column
    let newStatus = 'available';
    if (settings) {
        const columnConfigService = new ColumnConfigService(settings);
        // Find first non-completion column
        const columns = columnConfigService.getColumns();
        const nonCompletionColumn = columns.find(c => !c.triggersCompletion);
        newStatus = nonCompletionColumn?.id || columns[0]?.id || 'available';
    }

    // Clear completedDate and move to non-completion column
    const updatedQuest: Quest = {
        ...quest,
        completedDate: null,
        status: newStatus,
    };

    // Update store
    useQuestStore.getState().upsertQuest(updatedQuest);

    // Log reopen event for analytics
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    useCharacterStore.getState().logActivity({
        type: 'quest_reopened' as any, // Cast to allow custom type
        date: dateString,
        xpGained: 0,
        goldGained: 0,
        questId: updatedQuest.questId,
        questName: updatedQuest.questName,
        details: `Reopened: ${updatedQuest.questName}`,
    });

    // Save to file
    try {
        if (isAIGeneratedQuest(updatedQuest)) {
            await saveAIQuest(vault, storageFolder, updatedQuest);
        } else {
            await saveManualQuest(vault, storageFolder, updatedQuest);
        }
    } catch (error) {
        console.error('[QuestActionsService] Failed to save reopened quest:', error);
        return { success: false };
    }

    new Notice(`🔄 Quest reopened: ${updatedQuest.questName}`, 3000);
    return { success: true, quest: updatedQuest };
}


/**
 * Archive a quest - moves the quest file to the archive folder.
 * Quest must have a filePath set (set by QuestService on load).
 */
export async function archiveQuest(
    vault: Vault,
    questId: string,
    archiveFolder: string
): Promise<{ success: boolean; quest?: Quest }> {
    const quest = useQuestStore.getState().quests.get(questId);
    if (!quest) {
        console.error('[QuestActionsService] Quest not found for archive:', questId);
        return { success: false };
    }

    if (!quest.filePath) {
        console.error('[QuestActionsService] Quest has no filePath, cannot archive:', questId);
        new Notice('❌ Cannot archive quest: file path unknown', 3000);
        return { success: false };
    }

    // Validate archive folder
    if (!archiveFolder || archiveFolder.trim() === '') {
        console.error('[QuestActionsService] Archive folder not configured');
        new Notice('❌ Archive folder not configured in settings', 3000);
        return { success: false };
    }

    // Construct archive path (preserve filename)
    const fileName = quest.filePath.split('/').pop() || `${quest.questId}.md`;
    const archivePath = `${archiveFolder}/${fileName}`;

    // Ensure archive folder exists
    try {
        await ensureFolderExists(vault, archiveFolder);
    } catch (error) {
        console.error('[QuestActionsService] Failed to create archive folder:', error);
        new Notice('❌ Failed to create archive folder', 3000);
        return { success: false };
    }

    // Move the file
    const file = vault.getAbstractFileByPath(quest.filePath);
    if (!(file instanceof TFile)) {
        console.error('[QuestActionsService] Quest file not found:', quest.filePath);
        new Notice('❌ Quest file not found', 3000);
        return { success: false };
    }

    try {
        await vault.rename(file, archivePath);
    } catch (error) {
        console.error('[QuestActionsService] Failed to move quest to archive:', error);
        new Notice('❌ Failed to archive quest', 3000);
        return { success: false };
    }

    // Remove quest from store (no longer in Kanban)
    useQuestStore.getState().removeQuest(questId);

    // Log archive event
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    useCharacterStore.getState().logActivity({
        type: 'quest_archived' as any,
        date: dateString,
        xpGained: 0,
        goldGained: 0,
        questId: quest.questId,
        questName: quest.questName,
        details: `Archived to: ${archiveFolder}`,
    });

    new Notice(`📦 Quest archived: ${quest.questName}`, 3000);
    return { success: true, quest };
}

