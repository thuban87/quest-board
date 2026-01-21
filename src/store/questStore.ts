/**
 * Quest Store
 * 
 * Zustand store for quest state management.
 * Quests are loaded from files - store is a cache, not the source of truth.
 */

import { create } from 'zustand';
import { Quest, QuestStatus } from '../models';

interface QuestState {
    /** All quests keyed by questId */
    quests: Map<string, Quest>;

    /** Whether quests are currently loading */
    loading: boolean;

    /** Last error message */
    error: string | null;

    /** Last load timestamp for cache invalidation */
    lastLoaded: number | null;
}

interface QuestActions {
    /** Set all quests from loaded files */
    setQuests: (quests: Quest[]) => void;

    /** Add or update a single quest */
    upsertQuest: (quest: Quest) => void;

    /** Remove a quest by ID */
    removeQuest: (questId: string) => void;

    /** Update quest status */
    updateQuestStatus: (questId: string, status: QuestStatus) => void;

    /** Set loading state */
    setLoading: (loading: boolean) => void;

    /** Set error state */
    setError: (error: string | null) => void;

    /** Clear all quests */
    clear: () => void;

    /** Get quests by status (imperative, for use in callbacks) */
    getQuestsByStatus: (status: QuestStatus) => Quest[];
}

type QuestStore = QuestState & QuestActions;

/**
 * Quest store hook
 */
export const useQuestStore = create<QuestStore>((set, get) => ({
    // Initial state
    quests: new Map(),
    loading: false,
    error: null,
    lastLoaded: null,

    // Actions
    setQuests: (quests) => {
        const questMap = new Map<string, Quest>();
        quests.forEach((quest) => {
            questMap.set(quest.questId, quest);
        });
        set({
            quests: questMap,
            loading: false,
            error: null,
            lastLoaded: Date.now(),
        });
    },

    upsertQuest: (quest) => {
        const quests = new Map(get().quests);
        quests.set(quest.questId, quest);
        set({ quests });
    },

    removeQuest: (questId) => {
        const quests = new Map(get().quests);
        quests.delete(questId);
        set({ quests });
    },

    updateQuestStatus: (questId, status) => {
        const quests = new Map(get().quests);
        const quest = quests.get(questId);
        if (quest) {
            quests.set(questId, {
                ...quest,
                status,
                completedDate: status === QuestStatus.COMPLETED
                    ? new Date().toISOString()
                    : quest.completedDate,
            });
            set({ quests });
        }
    },

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error, loading: false }),

    clear: () => set({
        quests: new Map(),
        loading: false,
        error: null,
        lastLoaded: null,
    }),

    getQuestsByStatus: (status) => {
        const quests = get().quests;
        return quests ? Array.from(quests.values()).filter(q => q.status === status) : [];
    },
}));

// ============================================
// Selectors for efficient re-renders
// ============================================

/**
 * Get all quests as an array
 */
export const selectAllQuests = (state: QuestStore): Quest[] =>
    Array.from(state.quests.values());

/**
 * Get quests filtered by status
 */
export const selectQuestsByStatus = (status: QuestStatus) =>
    (state: QuestStore): Quest[] =>
        Array.from(state.quests.values()).filter((q) => q.status === status);

/**
 * Get quest count by status
 */
export const selectQuestCountByStatus = (status: QuestStatus) =>
    (state: QuestStore): number =>
        Array.from(state.quests.values()).filter((q) => q.status === status).length;

/**
 * Get a single quest by ID
 */
export const selectQuestById = (questId: string) =>
    (state: QuestStore): Quest | undefined =>
        state.quests.get(questId);

/**
 * Get quests filtered by category
 */
export const selectQuestsByCategory = (category: string) =>
    (state: QuestStore): Quest[] =>
        Array.from(state.quests.values()).filter((q) => q.category === category);
