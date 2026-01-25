/**
 * Quest Actions Service
 * 
 * Centralized business logic for quest state changes.
 * Handles side effects like streak updates, notifications, and loot drops.
 * Used by both SidebarQuests and FullKanban through useQuestActions hook.
 */

import { Vault, Notice, App } from 'obsidian';
import { Quest, isAIGeneratedQuest, isManualQuest } from '../models/Quest';
import { QuestStatus } from '../models/QuestStatus';
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
    streakMode?: 'quest' | 'task';
    /** App reference for showing modals (optional) */
    app?: App;
    /** Whether to generate and show loot on quest completion */
    enableLoot?: boolean;
}

/**
 * Move a quest to a new status.
 * Handles all side effects: store update, file save, streak update.
 */
export async function moveQuest(
    vault: Vault,
    questId: string,
    newStatus: QuestStatus,
    options: MoveQuestOptions
): Promise<MoveQuestResult> {
    const quest = useQuestStore.getState().quests.get(questId);
    if (!quest) {
        console.error('[QuestActionsService] Quest not found:', questId);
        return { success: false, quest: quest as any };
    }

    const updatedQuest: Quest = {
        ...quest,
        status: newStatus,
        completedDate: newStatus === QuestStatus.COMPLETED
            ? new Date().toISOString()
            : quest.completedDate,
    };

    // Update store (optimistic update)
    useQuestStore.getState().upsertQuest(updatedQuest);

    // Update streak if moving to COMPLETED
    let streakResult: StreakUpdateResult | undefined;
    if (newStatus === QuestStatus.COMPLETED && options.streakMode === 'quest') {
        const currentChar = useCharacterStore.getState().character;
        if (currentChar) {
            const isPaladin = currentChar.class === 'paladin';
            streakResult = updateStreak(currentChar, isPaladin);

            console.log('[QuestActionsService] Streak updated:', {
                newStreak: streakResult.character.currentStreak,
                streakContinued: streakResult.streakContinued,
                streakBroken: streakResult.streakBroken,
                newRecord: streakResult.newRecord,
            });

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
                const achievementService = new AchievementService(null as any, ''); // vault/folder not needed for checks
                const streakAchievementCheck = achievementService.checkStreakAchievements(achievements, newStreak);

                if (streakAchievementCheck.newlyUnlocked.length > 0) {
                    // Show unlock popups
                    streakAchievementCheck.newlyUnlocked.forEach((achievement, index) => {
                        setTimeout(() => {
                            showAchievementUnlock(null as any, achievement, '');
                        }, 2000 + (index * 1000));
                    });

                    // Save achievements to store
                    useCharacterStore.setState({ achievements: [...achievements] });
                }
            }
        }
    }

    // === QUEST COMPLETION TRIGGERS ===
    // Check for One-Shot, etc. when quest is completed
    if (newStatus === QuestStatus.COMPLETED) {
        const character = useCharacterStore.getState().character;
        if (character) {
            // Detect "One-Shot" = Available → Completed directly (not via In Progress)
            const wasOneShot = quest.status === QuestStatus.AVAILABLE;

            const questContext: TriggerContext = {
                questCompleted: true,
                questWasOneShot: wasOneShot,
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
    if (newStatus === QuestStatus.COMPLETED && options.enableLoot !== false) {
        const character = useCharacterStore.getState().character;
        if (character) {
            try {
                // Generate loot based on quest and character
                loot = lootGenerationService.generateQuestLoot(updatedQuest, character);

                console.log('[QuestActionsService] Generated loot:', {
                    questId: updatedQuest.questId,
                    lootItems: loot.length,
                    loot,
                });

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
                        console.log('[QuestActionsService] Inventory full, showing management modal');
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
                                },
                                onAbandon: () => {
                                    new Notice('🗑️ Abandoned all loot.', 2000);
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
                            });
                        }, 500);
                    }
                }
            } catch (error) {
                console.error('[QuestActionsService] Failed to generate loot:', error);
            }
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
