/**
 * useXPAward Hook
 * 
 * Watches task files for changes and awards XP when tasks are completed.
 * Handles class bonuses, quest completion bonuses, and persistence.
 */

import { useEffect, useRef, useCallback } from 'react';
import { App, Vault, Notice, debounce } from 'obsidian';
import { Quest, isManualQuest } from '../models/Quest';
import { useCharacterStore } from '../store/characterStore';
import { useQuestStore } from '../store/questStore';
import { readTasksFromFile, getTaskCompletion, Task, TaskCompletion } from '../services/TaskFileService';
import { calculateXPWithBonus, checkLevelUp, getLevelUpMessage } from '../services/XPSystem';
import { LevelUpModal } from '../modals/LevelUpModal';

interface UseXPAwardOptions {
    app: App;
    vault: Vault;
    onSaveCharacter: () => Promise<void>;
}

interface TaskSnapshot {
    questId: string;
    filePath: string;
    tasks: Task[];
    completion: TaskCompletion;
}

/**
 * Hook to watch task files and award XP on completion
 */
export function useXPAward({ app, vault, onSaveCharacter }: UseXPAwardOptions) {
    // Store previous task snapshots
    const taskSnapshotsRef = useRef<Map<string, TaskSnapshot>>(new Map());
    const fileWatchersRef = useRef<Map<string, () => void>>(new Map());

    const character = useCharacterStore((state) => state.character);
    const addXP = useCharacterStore((state) => state.addXP);
    const graduate = useCharacterStore((state) => state.graduate);
    const quests = useQuestStore((state) => state.quests);

    // Award XP for completed tasks
    const awardXPForTasks = useCallback(async (
        quest: Quest,
        oldSnapshot: TaskSnapshot | undefined,
        newTasks: Task[]
    ) => {
        if (!character) return;
        if (!isManualQuest(quest)) return;

        const newCompletion = getTaskCompletion(newTasks);
        const oldCompleted = oldSnapshot?.completion.completed || 0;
        const newlyCompleted = newCompletion.completed - oldCompleted;

        if (newlyCompleted <= 0) return;

        // Calculate XP with class bonus
        const baseXP = quest.xpPerTask * newlyCompleted;
        const totalXP = calculateXPWithBonus(baseXP, quest.category, character);

        // Track old level for level-up detection
        const oldXP = character.isTrainingMode ? character.trainingXP : character.totalXP;

        // Award XP
        addXP(totalXP);

        // Show notification
        const bonusApplied = totalXP > baseXP;
        new Notice(
            `⭐ +${totalXP} XP${bonusApplied ? ' (class bonus!)' : ''} for ${newlyCompleted} task${newlyCompleted > 1 ? 's' : ''}`,
            3000
        );

        // Check for level up
        const newXP = oldXP + totalXP;
        const levelResult = checkLevelUp(oldXP, newXP, character.isTrainingMode);
        if (levelResult.didLevelUp) {
            // Show level-up modal
            const modal = new LevelUpModal(
                app,
                character.class,
                levelResult.newLevel,
                levelResult.tierChanged,
                character.isTrainingMode,
                () => {
                    // Graduation callback
                    graduate();
                    onSaveCharacter();
                    new Notice('🎓 Congratulations! You are now Level 1!', 5000);
                }
            );
            modal.open();
        }

        // Check for quest completion
        if (newCompletion.completed === newCompletion.total && newCompletion.total > 0) {
            // Award completion bonus
            const completionBonus = calculateXPWithBonus(quest.completionBonus, quest.category, character);
            addXP(completionBonus);
            new Notice(`🎉 Quest Complete! +${completionBonus} bonus XP!`, 4000);
        }

        // Persist character
        await onSaveCharacter();
    }, [character, addXP, graduate, onSaveCharacter, app]);

    // Track which quests are currently being processed
    const processingRef = useRef<Set<string>>(new Set());

    // Check a single task file for changes
    const checkTaskFile = useCallback(async (quest: Quest) => {
        if (!isManualQuest(quest) || !quest.linkedTaskFile) return;

        // Prevent concurrent processing of the same quest
        if (processingRef.current.has(quest.questId)) {
            console.log('[XP Debug] Already processing quest:', quest.questId);
            return;
        }
        processingRef.current.add(quest.questId);

        try {
            const result = await readTasksFromFile(vault, quest.linkedTaskFile);
            if (!result.success) return;

            const oldSnapshot = taskSnapshotsRef.current.get(quest.questId);

            // Award XP if tasks changed
            await awardXPForTasks(quest, oldSnapshot, result.tasks);

            // Update snapshot
            taskSnapshotsRef.current.set(quest.questId, {
                questId: quest.questId,
                filePath: quest.linkedTaskFile,
                tasks: result.tasks,
                completion: getTaskCompletion(result.tasks),
            });
        } finally {
            processingRef.current.delete(quest.questId);
        }
    }, [vault, awardXPForTasks]);

    // Set up file watchers for all quest task files
    useEffect(() => {
        if (!quests) return;

        // Track which files we need to watch
        const watchedFiles = new Set<string>();

        for (const quest of quests.values()) {
            if (!isManualQuest(quest) || !quest.linkedTaskFile) continue;

            const filePath = quest.linkedTaskFile;
            watchedFiles.add(filePath);

            // Skip if already watching
            if (fileWatchersRef.current.has(filePath)) continue;

            // Initialize snapshot ONLY if we don't have one yet
            if (!taskSnapshotsRef.current.has(quest.questId)) {
                readTasksFromFile(vault, filePath).then((result) => {
                    if (result.success && !taskSnapshotsRef.current.has(quest.questId)) {
                        taskSnapshotsRef.current.set(quest.questId, {
                            questId: quest.questId,
                            filePath,
                            tasks: result.tasks,
                            completion: getTaskCompletion(result.tasks),
                        });
                    }
                });
            }

            // Set up file watcher - debounce without immediate fire
            const debouncedCheck = debounce(() => {
                const currentQuest = useQuestStore.getState().quests.get(quest.questId);
                if (currentQuest) {
                    checkTaskFile(currentQuest);
                }
            }, 300, false);  // false = don't fire immediately

            const onModify = vault.on('modify', (file) => {
                if (file.path === filePath) {
                    debouncedCheck();
                }
            });

            fileWatchersRef.current.set(filePath, () => {
                vault.offref(onModify);
            });
        }

        // Clean up watchers for files we no longer need
        for (const [filePath, unsubscribe] of fileWatchersRef.current) {
            if (!watchedFiles.has(filePath)) {
                unsubscribe();
                fileWatchersRef.current.delete(filePath);
            }
        }

        // Cleanup on unmount
        return () => {
            for (const unsubscribe of fileWatchersRef.current.values()) {
                unsubscribe();
            }
            fileWatchersRef.current.clear();
        };
    }, [quests, vault, checkTaskFile]);

    return {
        // Expose for manual refresh if needed
        checkTaskFile,
    };
}
