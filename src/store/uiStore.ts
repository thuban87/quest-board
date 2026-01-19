/**
 * UI Store
 * 
 * Zustand store for UI state that persists across reloads.
 * This is the ONLY store that should be persisted to plugin settings.
 */

import { create } from 'zustand';

type ActiveTab = 'board' | 'sheet' | 'sprint';

interface Filters {
    category?: string;
    priority?: string;
    searchText?: string;
}

interface UIState {
    /** Currently active tab */
    activeTab: ActiveTab;

    /** Active filters on the board */
    filters: Filters;

    /** Whether the sidebar is collapsed */
    sidebarCollapsed: boolean;

    /** Whether to show completed quests */
    showCompleted: boolean;

    /** Modal states */
    modals: {
        characterCreation: boolean;
        characterEdit: boolean;
        questDetails: string | null; // questId or null
        addQuest: boolean;
    };
}

interface UIActions {
    /** Set active tab */
    setActiveTab: (tab: ActiveTab) => void;

    /** Update filters */
    setFilters: (filters: Partial<Filters>) => void;

    /** Clear all filters */
    clearFilters: () => void;

    /** Toggle sidebar */
    toggleSidebar: () => void;

    /** Toggle completed quests visibility */
    toggleShowCompleted: () => void;

    /** Open character creation modal */
    openCharacterCreation: () => void;

    /** Open character edit modal */
    openCharacterEdit: () => void;

    /** Open quest details modal */
    openQuestDetails: (questId: string) => void;

    /** Open add quest modal */
    openAddQuest: () => void;

    /** Close all modals */
    closeModals: () => void;

    /** Set full UI state (from loaded data) */
    setUIState: (state: Partial<UIState>) => void;

    /** Get state for persistence (only what should be saved) */
    getPersistedState: () => Pick<UIState, 'activeTab' | 'filters' | 'showCompleted'>;
}

type UIStore = UIState & UIActions;

const DEFAULT_MODALS = {
    characterCreation: false,
    characterEdit: false,
    questDetails: null,
    addQuest: false,
};

/**
 * UI store hook
 */
export const useUIStore = create<UIStore>((set, get) => ({
    // Initial state
    activeTab: 'board',
    filters: {},
    sidebarCollapsed: false,
    showCompleted: false,
    modals: { ...DEFAULT_MODALS },

    // Actions
    setActiveTab: (activeTab) => set({ activeTab }),

    setFilters: (newFilters) =>
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
        })),

    clearFilters: () => set({ filters: {} }),

    toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

    toggleShowCompleted: () =>
        set((state) => ({ showCompleted: !state.showCompleted })),

    openCharacterCreation: () =>
        set({ modals: { ...DEFAULT_MODALS, characterCreation: true } }),

    openCharacterEdit: () =>
        set({ modals: { ...DEFAULT_MODALS, characterEdit: true } }),

    openQuestDetails: (questId) =>
        set({ modals: { ...DEFAULT_MODALS, questDetails: questId } }),

    openAddQuest: () =>
        set({ modals: { ...DEFAULT_MODALS, addQuest: true } }),

    closeModals: () => set({ modals: { ...DEFAULT_MODALS } }),

    setUIState: (newState) => set(newState),

    getPersistedState: () => {
        const { activeTab, filters, showCompleted } = get();
        return { activeTab, filters, showCompleted };
    },
}));

// ============================================
// Selectors
// ============================================

export const selectActiveTab = (state: UIStore) => state.activeTab;
export const selectFilters = (state: UIStore) => state.filters;
export const selectModals = (state: UIStore) => state.modals;
export const selectIsCharacterCreationOpen = (state: UIStore) =>
    state.modals.characterCreation;
export const selectIsCharacterEditOpen = (state: UIStore) =>
    state.modals.characterEdit;
export const selectOpenQuestId = (state: UIStore) =>
    state.modals.questDetails;
