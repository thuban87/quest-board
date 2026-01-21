/**
 * Quest Actions Service
 * 
 * Centralized business logic for quest state changes.
 * Handles side effects like streak updates, notifications.
 * Used by both SidebarQuests and FullKanban through useQuestActions hook.
 */

import { Vault, Notice } from 'obsidian';
import { Quest, isAIGeneratedQuest, isManualQuest } from '../models/Quest';
import { QuestStatus } from '../models/QuestStatus';
import { Character } from '../models/Character';
import { useQuestStore } from '../store/questStore';
import { useCharacterStore } from '../store/characterStore';
import { useTaskSectionsStore } from '../store/taskSectionsStore';
import { saveManualQuest, saveAIQuest } from './QuestService';
import { toggleTaskInFile, readTasksWithSections, getTaskCompletion } from './TaskFileService';
import { updateStreak, getStreakDisplay, StreakUpdateResult } from './StreakService';

/**
 * Result of moving a quest
 */
export interface MoveQuestResult {
    success: boolean;
    quest: Quest;
    streakResult?: StreakUpdateResult;
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
        }
    }

    // Save to file
    try {
        console.log('[QuestActionsService] Saving quest to file:', {
            questId: updatedQuest.questId,
            newStatus: updatedQuest.status,
            isAIGenerated: isAIGeneratedQuest(updatedQuest),
        });

        let saveResult: boolean;
        if (isAIGeneratedQuest(updatedQuest)) {
            saveResult = await saveAIQuest(vault, options.storageFolder, updatedQuest);
        } else {
            saveResult = await saveManualQuest(vault, options.storageFolder, updatedQuest);
        }

        console.log('[QuestActionsService] Save result:', saveResult);

        if (!saveResult) {
            console.error('[QuestActionsService] Save returned false');
            return { success: false, quest: updatedQuest, streakResult };
        }
    } catch (error) {
        console.error('[QuestActionsService] Failed to save quest:', error);
        return { success: false, quest: updatedQuest, streakResult };
    }

    return { success: true, quest: updatedQuest, streakResult };
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
