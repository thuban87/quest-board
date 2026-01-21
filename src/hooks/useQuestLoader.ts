/**
 * useQuestLoader Hook
 * 
 * Centralized quest loading and file watching.
 * Used by both SidebarQuests and FullKanban.
 */

import { useEffect, useCallback, useRef } from 'react';
import { Vault } from 'obsidian';
import { useQuestStore } from '../store/questStore';
import { useTaskSectionsStore } from '../store/taskSectionsStore';
import { loadAllQuests, watchQuestFolder } from '../services/QuestService';
import { readTasksFromMultipleFiles, getTaskCompletion, TaskCompletion, TaskSection } from '../services/TaskFileService';
import { isManualQuest } from '../models/Quest';

interface UseQuestLoaderOptions {
    vault: Vault;
    storageFolder: string;
    /** If true, skip reload when save is in progress (prevents race condition) */
    useSaveLock?: boolean;
}

interface UseQuestLoaderResult {
    /** Re-load quests manually */
    reloadQuests: () => Promise<void>;
    /** Ref to set when saving (to prevent reload race condition) */
    saveLockRef: React.MutableRefObject<boolean>;
}

/**
 * Hook to load quests and watch for file changes.
 * Manages quest store and task sections store automatically.
 */
export function useQuestLoader({
    vault,
    storageFolder,
    useSaveLock = false,
}: UseQuestLoaderOptions): UseQuestLoaderResult {
    const setQuests = useQuestStore((state) => state.setQuests);
    const setLoading = useQuestStore((state) => state.setLoading);
    const setError = useQuestStore((state) => state.setError);
    const setAllSections = useTaskSectionsStore((state) => state.setAllSections);

    // Save lock to prevent file watcher from reloading during save
    const saveLockRef = useRef(false);

    // Load quests and their task sections
    const loadQuestsAndSections = useCallback(async () => {
        setLoading(true);
        try {
            const result = await loadAllQuests(vault, storageFolder);
            setQuests(result.quests);

            const progressMap: Record<string, TaskCompletion> = {};
            const allSectionsMap: Record<string, TaskSection[]> = {};

            for (const quest of result.quests) {
                if (isManualQuest(quest) && quest.linkedTaskFile) {
                    const taskResult = await readTasksFromMultipleFiles(vault, quest.linkedTaskFile, quest.linkedTaskFiles);
                    if (taskResult.success) {
                        progressMap[quest.questId] = getTaskCompletion(taskResult.allTasks);
                        allSectionsMap[quest.questId] = taskResult.sections;
                    }
                }
            }
            setAllSections(allSectionsMap, progressMap);
        } catch (error) {
            setError(`Failed to load quests: ${error}`);
        }
        setLoading(false);
    }, [vault, storageFolder, setQuests, setLoading, setError, setAllSections]);

    // Set up file watcher
    useEffect(() => {
        // Initial load
        loadQuestsAndSections();

        // Watch for file changes
        const unsubscribe = watchQuestFolder(vault, storageFolder, async (result) => {
            // Skip reload if we're in the middle of saving (prevents race condition)
            if (useSaveLock && saveLockRef.current) {
                console.log('[Quest Watch] Skipping reload - save in progress');
                return;
            }

            setQuests(result.quests);

            const progressMap: Record<string, TaskCompletion> = {};
            const allSectionsMap: Record<string, TaskSection[]> = {};

            for (const quest of result.quests) {
                if (isManualQuest(quest) && quest.linkedTaskFile) {
                    const taskResult = await readTasksFromMultipleFiles(vault, quest.linkedTaskFile, quest.linkedTaskFiles);
                    if (taskResult.success) {
                        progressMap[quest.questId] = getTaskCompletion(taskResult.allTasks);
                        allSectionsMap[quest.questId] = taskResult.sections;
                    }
                }
            }
            setAllSections(allSectionsMap, progressMap);
        });

        return () => unsubscribe();
    }, [vault, storageFolder, useSaveLock, loadQuestsAndSections, setQuests, setAllSections]);

    return {
        reloadQuests: loadQuestsAndSections,
        saveLockRef,
    };
}
