/**
 * useQuestActions Hook
 * 
 * Thin wrapper around QuestActionsService for use in components.
 * Binds current context (vault, settings) to service functions.
 */

import { useCallback, MutableRefObject } from 'react';
import { Vault, App } from 'obsidian';
import { QuestStatus } from '../models/QuestStatus';
import { moveQuest, toggleTask, MoveQuestResult, ToggleTaskResult } from '../services/QuestActionsService';
import { useCharacterStore } from '../store/characterStore';

interface UseQuestActionsOptions {
    vault: Vault;
    storageFolder: string;
    streakMode?: 'quest' | 'task';
    /** Pending saves Set from useQuestLoader - tracks quest IDs being saved */
    pendingSavesRef?: MutableRefObject<Set<string>>;
    /** Callback to save character to plugin settings after streak update */
    onSaveCharacter?: () => Promise<void>;
    /** App reference for showing modals like loot popups */
    app?: App;
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
    pendingSavesRef,
    onSaveCharacter,
    app,
}: UseQuestActionsOptions): UseQuestActionsResult {

    const handleMoveQuest = useCallback(
        async (questId: string, newStatus: QuestStatus) => {
            // Add to pending saves BEFORE the save operation
            if (pendingSavesRef) {
                pendingSavesRef.current.add(questId);
            }

            try {
                const result = await moveQuest(vault, questId, newStatus, {
                    storageFolder,
                    streakMode,
                    app,
                });

                // Save character if streak was updated
                if (result.streakResult && onSaveCharacter) {
                    await onSaveCharacter();
                }

                return result;
            } finally {
                // Remove from pending saves AFTER the save completes
                // Use a small delay to ensure file watcher debounce has passed
                if (pendingSavesRef) {
                    setTimeout(() => {
                        pendingSavesRef.current.delete(questId);
                    }, 500); // 500ms delay for debounce
                }
            }
        },
        [vault, storageFolder, streakMode, pendingSavesRef, onSaveCharacter, app]
    );

    const handleToggleTask = useCallback(
        async (questId: string, lineNumber: number) => {
            // NOTE: toggleTask saves LINKED files, not quest files.
            // We don't add to pendingSaves here because the file watcher
            // needs to reload to pick up the task completion changes.
            return await toggleTask(vault, questId, lineNumber);
        },
        [vault]
    );

    return {
        moveQuest: handleMoveQuest,
        toggleTask: handleToggleTask,
    };
}
