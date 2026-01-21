/**
 * Task Sections Store
 * 
 * Shared Zustand store for task sections and progress.
 * Used by both FullKanban and SidebarQuests for view synchronization.
 */

import { create } from 'zustand';
import { TaskSection, TaskCompletion } from '../services/TaskFileService';

interface TaskSectionsState {
    /** Sections keyed by questId */
    sectionsMap: Record<string, TaskSection[]>;

    /** Task progress keyed by questId */
    progressMap: Record<string, TaskCompletion>;
}

interface TaskSectionsActions {
    /** Set sections and progress for a single quest */
    setSections: (questId: string, sections: TaskSection[], progress: TaskCompletion) => void;

    /** Alias for setSections - used by granular loader */
    updateQuestSections: (questId: string, sections: TaskSection[], progress: TaskCompletion) => void;

    /** Remove sections and progress for a quest */
    removeQuestSections: (questId: string) => void;

    /** Set multiple quests' sections at once */
    setAllSections: (
        sectionsMap: Record<string, TaskSection[]>,
        progressMap: Record<string, TaskCompletion>
    ) => void;

    /** Clear all sections */
    clear: () => void;
}

type TaskSectionsStore = TaskSectionsState & TaskSectionsActions;

export const useTaskSectionsStore = create<TaskSectionsStore>((set, get) => ({
    sectionsMap: {},
    progressMap: {},

    setSections: (questId, sections, progress) => {
        set({
            sectionsMap: { ...get().sectionsMap, [questId]: sections },
            progressMap: { ...get().progressMap, [questId]: progress },
        });
    },

    // Alias for setSections
    updateQuestSections: (questId, sections, progress) => {
        set({
            sectionsMap: { ...get().sectionsMap, [questId]: sections },
            progressMap: { ...get().progressMap, [questId]: progress },
        });
    },

    removeQuestSections: (questId) => {
        const { sectionsMap, progressMap } = get();
        const newSectionsMap = { ...sectionsMap };
        const newProgressMap = { ...progressMap };
        delete newSectionsMap[questId];
        delete newProgressMap[questId];
        set({ sectionsMap: newSectionsMap, progressMap: newProgressMap });
    },

    setAllSections: (sectionsMap, progressMap) => {
        set({ sectionsMap, progressMap });
    },

    clear: () => set({ sectionsMap: {}, progressMap: {} }),
}));

