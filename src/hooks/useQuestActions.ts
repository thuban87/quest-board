/**
 * useQuestActions Hook
 * 
 * Thin wrapper around QuestActionsService for use in components.
 * Binds current context (vault, settings) to service functions.
 */

import { useCallback, MutableRefObject } from 'react';
import { Vault, App } from 'obsidian';
import { moveQuest, toggleTask, MoveQuestResult, ToggleTaskResult } from '../services/QuestActionsService';
import { useCharacterStore } from '../store/characterStore';
import type { QuestBoardSettings } from '../settings';

interface UseQuestActionsOptions {
    vault: Vault;
    storageFolder: string;
    settings: QuestBoardSettings;
    streakMode?: 'quest' | 'task';
    /** Pending saves Set from useQuestLoader - tracks quest IDs being saved */
    pendingSavesRef?: MutableRefObject<Set<string>>;
    /** Callback to save character to plugin settings after streak update */
    onSaveCharacter?: () => Promise<void>;
    /** App reference for showing modals like loot popups */
    app?: App;
    /** Bounty chance percentage (0-100) for bounty fight triggers */
    bountyChance?: number;
    /** Callback to open battle view when bounty fight starts */
    onBattleStart?: () => void;
    /** Plugin manifest directory for sprite resolution in BountyModal */
    manifestDir?: string;
}

interface UseQuestActionsResult {
    /** Move a quest to a new status (handles streak, save, notifications) */
    moveQuest: (questId: string, newStatus: string) => Promise<MoveQuestResult>;
    /** Toggle a task checkbox in a quest's linked file */
    toggleTask: (questId: string, lineNumber: number) => Promise<ToggleTaskResult>;
}

/**
 * Hook providing quest action callbacks bound to current context.
 */
export function useQuestActions({
    vault,
    storageFolder,
    settings,
    streakMode = 'quest',
    pendingSavesRef,
    onSaveCharacter,
    app,
    bountyChance,
    onBattleStart,
    manifestDir,
}: UseQuestActionsOptions): UseQuestActionsResult {

    const handleMoveQuest = useCallback(
        async (questId: string, newStatus: string) => {
            // Add to pending saves BEFORE the save operation
            if (pendingSavesRef) {
                pendingSavesRef.current.add(questId);
            }

            try {
                const result = await moveQuest(vault, questId, newStatus, {
                    storageFolder,
                    settings,
                    streakMode,
                    app,
                    bountyChance,
                    onBattleStart,
                    manifestDir,
                });

                // Save character after quest completion (stamina, streak, etc.)
                // Always save on completion since stamina is awarded every time
                if (newStatus === 'completed' && onSaveCharacter) {
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
        [vault, storageFolder, settings, streakMode, pendingSavesRef, onSaveCharacter, app, bountyChance, onBattleStart, manifestDir]
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
