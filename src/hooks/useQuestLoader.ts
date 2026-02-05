/**
 * useQuestLoader Hook
 * 
 * Centralized quest loading and file watching.
 * Uses granular updates for efficiency - only reloads affected quests.
 * Used by both SidebarQuests and FullKanban.
 */

import { useEffect, useCallback, useRef } from 'react';
import { Vault, TFile } from 'obsidian';
import { useQuestStore } from '../store/questStore';
import { useTaskSectionsStore } from '../store/taskSectionsStore';
import { loadAllQuests, loadSingleQuest, watchQuestFolderGranular } from '../services/QuestService';
import { readTasksFromMultipleFiles, getTaskCompletion, TaskCompletion, TaskSection } from '../services/TaskFileService';
import { isManualQuest, Quest } from '../models/Quest';
import type { QuestBoardSettings } from '../settings';

interface UseQuestLoaderOptions {
    vault: Vault;
    storageFolder: string;
    /** Settings for status resolution */
    settings?: QuestBoardSettings;
    /** If true, skip reload when save is in progress (prevents race condition) */
    useSaveLock?: boolean;
}

interface UseQuestLoaderResult {
    /** Re-load quests manually */
    reloadQuests: () => Promise<void>;
    /** Set of quest IDs currently being saved - add before save, remove after */
    pendingSavesRef: React.MutableRefObject<Set<string>>;
    /** Check if any saves are pending (legacy compatibility) */
    hasPendingSaves: () => boolean;
}



/**
 * Hook to load quests and watch for file changes.
 * Uses granular updates - only reloads affected quests when files change.
 */
export function useQuestLoader({
    vault,
    storageFolder,
    settings,
    useSaveLock = false,
}: UseQuestLoaderOptions): UseQuestLoaderResult {
    const setQuests = useQuestStore((state) => state.setQuests);
    const upsertQuest = useQuestStore((state) => state.upsertQuest);
    const removeQuest = useQuestStore((state) => state.removeQuest);
    const setLoading = useQuestStore((state) => state.setLoading);
    const setError = useQuestStore((state) => state.setError);
    const setAllSections = useTaskSectionsStore((state) => state.setAllSections);
    const updateQuestSections = useTaskSectionsStore((state) => state.updateQuestSections);
    const removeQuestSections = useTaskSectionsStore((state) => state.removeQuestSections);

    // Set of quest IDs currently being saved - prevents file watcher race condition
    const pendingSavesRef = useRef<Set<string>>(new Set());

    // Track linked file paths -> quest IDs for efficient updates
    const linkedFileToQuestRef = useRef<Map<string, string>>(new Map());

    // Helper to check if any saves are pending
    const hasPendingSaves = useCallback(() => {
        return pendingSavesRef.current.size > 0;
    }, []);

    // Load task sections for a single quest
    const loadSectionsForQuest = useCallback(async (quest: Quest) => {
        if (isManualQuest(quest) && quest.linkedTaskFile) {
            const taskResult = await readTasksFromMultipleFiles(vault, quest.linkedTaskFile, quest.linkedTaskFiles);
            if (taskResult.success) {
                const completion = getTaskCompletion(taskResult.allTasks);
                updateQuestSections(quest.questId, taskResult.sections, completion);
                return { sections: taskResult.sections, completion };
            }
        }
        return null;
    }, [vault, updateQuestSections]);

    // Build linked file mapping from quests
    const updateLinkedFileMap = useCallback((quests: Quest[]) => {
        linkedFileToQuestRef.current.clear();
        for (const quest of quests) {
            if (isManualQuest(quest)) {
                if (quest.linkedTaskFile) {
                    linkedFileToQuestRef.current.set(quest.linkedTaskFile, quest.questId);
                }
                if (quest.linkedTaskFiles) {
                    quest.linkedTaskFiles.forEach(f =>
                        linkedFileToQuestRef.current.set(f, quest.questId)
                    );
                }
            }
        }
    }, []);

    // Full reload - used for initial load only
    const loadQuestsAndSections = useCallback(async () => {

        setLoading(true);
        try {
            const result = await loadAllQuests(vault, storageFolder, settings);

            setQuests(result.quests);

            // Build linked file map
            updateLinkedFileMap(result.quests);

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
    }, [vault, storageFolder, settings, setQuests, setLoading, setError, setAllSections, updateLinkedFileMap]);

    // Set up file watchers
    useEffect(() => {
        // Initial load
        loadQuestsAndSections();

        // Granular watcher for quest files
        const unsubscribeQuests = watchQuestFolderGranular(vault, storageFolder, {
            onQuestModified: async (filePath, quest) => {
                // Skip if save is pending for this quest
                if (quest && pendingSavesRef.current.has(quest.questId)) {

                    return;
                }

                if (quest) {
                    upsertQuest(quest);

                    // Update linked file map for this quest
                    if (isManualQuest(quest)) {
                        if (quest.linkedTaskFile) {
                            linkedFileToQuestRef.current.set(quest.linkedTaskFile, quest.questId);
                        }
                        if (quest.linkedTaskFiles) {
                            quest.linkedTaskFiles.forEach(f =>
                                linkedFileToQuestRef.current.set(f, quest.questId)
                            );
                        }
                    }

                    // Reload task sections for this quest
                    await loadSectionsForQuest(quest);
                } else {

                }
            },

            onQuestCreated: async (filePath, quest) => {

                upsertQuest(quest);

                // Add to linked file map
                if (isManualQuest(quest)) {
                    if (quest.linkedTaskFile) {
                        linkedFileToQuestRef.current.set(quest.linkedTaskFile, quest.questId);
                    }
                    if (quest.linkedTaskFiles) {
                        quest.linkedTaskFiles.forEach(f =>
                            linkedFileToQuestRef.current.set(f, quest.questId)
                        );
                    }
                }

                await loadSectionsForQuest(quest);
            },

            onQuestDeleted: (filePath) => {
                // Extract quest ID from file path (basename without extension)
                const basename = filePath.split('/').pop()?.replace(/\.(md|json)$/, '') || '';

                removeQuest(basename);
                removeQuestSections(basename);

                // Clean up linked file map entries for this quest
                linkedFileToQuestRef.current.forEach((questId, linkedPath) => {
                    if (questId === basename) {
                        linkedFileToQuestRef.current.delete(linkedPath);
                    }
                });
            },

            onQuestRenamed: async (newPath, oldPath, quest) => {
                const oldBasename = oldPath.split('/').pop()?.replace(/\.(md|json)$/, '') || '';


                // Remove old
                removeQuest(oldBasename);
                removeQuestSections(oldBasename);

                // Add new if valid
                if (quest) {
                    upsertQuest(quest);
                    await loadSectionsForQuest(quest);
                }
            },
        }, 300, settings);  // Pass settings for status resolution

        // Watch linked task files (outside quest folder)
        const onLinkedFileModify = vault.on('modify', async (file) => {
            if (!(file instanceof TFile)) return;

            const questId = linkedFileToQuestRef.current.get(file.path);
            if (!questId) return;

            // Skip if save is pending
            if (useSaveLock && pendingSavesRef.current.size > 0) {

                return;
            }



            // Get the quest from store
            const quest = useQuestStore.getState().quests.get(questId);
            if (quest) {
                await loadSectionsForQuest(quest);
            }
        });

        return () => {
            unsubscribeQuests();
            vault.offref(onLinkedFileModify);
        };
    }, [vault, storageFolder, useSaveLock, upsertQuest, removeQuest,
        loadSectionsForQuest, removeQuestSections]);
    // Note: loadQuestsAndSections intentionally excluded - only used for initial load

    return {
        reloadQuests: loadQuestsAndSections,
        pendingSavesRef,
        hasPendingSaves,
    };
}
