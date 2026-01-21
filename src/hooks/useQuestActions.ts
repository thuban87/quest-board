/**
 * useQuestActions Hook
 * 
 * Thin wrapper around QuestActionsService for use in components.
 * Binds current context (vault, settings) to service functions.
 */

import { useCallback, MutableRefObject } from 'react';
import { Vault } from 'obsidian';
import { QuestStatus } from '../models/QuestStatus';
import { moveQuest, toggleTask, MoveQuestResult, ToggleTaskResult } from '../services/QuestActionsService';
import { useCharacterStore } from '../store/characterStore';

interface UseQuestActionsOptions {
    vault: Vault;
    storageFolder: string;
    streakMode?: 'quest' | 'task';
    /** Save lock ref from useQuestLoader - prevents file watcher race condition */
    saveLockRef?: MutableRefObject<boolean>;
    /** Callback to save character to plugin settings after streak update */
    onSaveCharacter?: () => Promise<void>;
}

interface UseQuestActionsResult {
    /** Move a quest to a new status (handles streak, save, notifications) */
    moveQuest: (questId: string, newStatus: QuestStatus) => Promise<MoveQuestResult>;
    /** Toggle a task checkbox in a quest's linked file */
    toggleTask: (questId: string, lineNumber: number) => Promise<ToggleTaskResult>;
}

/**
 * Hook providing quest action callbacks bound to current context.
 */
export function useQuestActions({
    vault,
    storageFolder,
    streakMode = 'quest',
    saveLockRef,
    onSaveCharacter,
}: UseQuestActionsOptions): UseQuestActionsResult {

    const handleMoveQuest = useCallback(
        async (questId: string, newStatus: QuestStatus) => {
            // Set save lock to prevent file watcher from reverting during save
            if (saveLockRef) {
                saveLockRef.current = true;
            }

            try {
                const result = await moveQuest(vault, questId, newStatus, {
                    storageFolder,
                    streakMode,
                });

                // Save character if streak was updated
                if (result.streakResult && onSaveCharacter) {
                    console.log('[useQuestActions] Saving character after streak update');
                    await onSaveCharacter();
                }

                return result;
            } finally {
                // Clear lock after a delay to let file watcher debounce pass
                if (saveLockRef) {
                    setTimeout(() => {
                        saveLockRef.current = false;
                    }, 1500);
                }
            }
        },
        [vault, storageFolder, streakMode, saveLockRef, onSaveCharacter]
    );

    const handleToggleTask = useCallback(
        (questId: string, lineNumber: number) => {
            return toggleTask(vault, questId, lineNumber);
        },
        [vault]
    );

    return {
        moveQuest: handleMoveQuest,
        toggleTask: handleToggleTask,
    };
}
