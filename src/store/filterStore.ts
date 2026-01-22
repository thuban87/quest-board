/**
 * Filter Store
 * 
 * Zustand stores for filter state management.
 * Separate stores for Kanban and Sidebar views to allow independent filtering.
 */

import { create } from 'zustand';
import { QuestPriority, QuestType } from '../models/QuestStatus';

/**
 * Sort options for quest ordering
 */
export type SortOption = 'default' | 'sortOrder' | 'taskCount-asc' | 'taskCount-desc' | 'created-asc' | 'created-desc';

/**
 * Filter state interface
 */
export interface FilterState {
    /** Text search query (matches name, category, tags, task names) */
    searchQuery: string;

    /** Selected categories to filter by (empty = show all) */
    selectedCategories: string[];

    /** Selected priorities to filter by (empty = show all) */
    selectedPriorities: QuestPriority[];

    /** Selected tags to filter by (empty = show all) */
    selectedTags: string[];

    /** Selected quest types to filter by (empty = show all) */
    selectedTypes: QuestType[];

    /** Date range - from date (ISO string, null = no lower bound) */
    dateFrom: string | null;

    /** Date range - to date (ISO string, null = no upper bound) */
    dateTo: string | null;

    /** Current sort option */
    sortBy: SortOption;
}

/**
 * Filter actions interface
 */
export interface FilterActions {
    /** Set search query */
    setSearchQuery: (query: string) => void;

    /** Set selected categories */
    setSelectedCategories: (categories: string[]) => void;

    /** Toggle a single category */
    toggleCategory: (category: string) => void;

    /** Set selected priorities */
    setSelectedPriorities: (priorities: QuestPriority[]) => void;

    /** Toggle a single priority */
    togglePriority: (priority: QuestPriority) => void;

    /** Set selected tags */
    setSelectedTags: (tags: string[]) => void;

    /** Toggle a single tag */
    toggleTag: (tag: string) => void;

    /** Set selected types */
    setSelectedTypes: (types: QuestType[]) => void;

    /** Toggle a single type */
    toggleType: (type: QuestType) => void;

    /** Set date from */
    setDateFrom: (date: string | null) => void;

    /** Set date to */
    setDateTo: (date: string | null) => void;

    /** Set sort option */
    setSortBy: (sortBy: SortOption) => void;

    /** Clear all filters */
    clearFilters: () => void;

    /** Check if any filters are active */
    hasActiveFilters: () => boolean;
}

export type FilterStore = FilterState & FilterActions;

/**
 * Default filter state
 */
const defaultFilterState: FilterState = {
    searchQuery: '',
    selectedCategories: [],
    selectedPriorities: [],
    selectedTags: [],
    selectedTypes: [],
    dateFrom: null,
    dateTo: null,
    sortBy: 'sortOrder',  // Default to user-defined sort order
};

/**
 * Create filter actions for a store
 */
const createFilterActions = (set: (state: Partial<FilterState>) => void, get: () => FilterState): FilterActions => ({
    setSearchQuery: (query) => set({ searchQuery: query }),

    setSelectedCategories: (categories) => set({ selectedCategories: categories }),

    toggleCategory: (category) => {
        const current = get().selectedCategories;
        if (current.includes(category)) {
            set({ selectedCategories: current.filter(c => c !== category) });
        } else {
            set({ selectedCategories: [...current, category] });
        }
    },

    setSelectedPriorities: (priorities) => set({ selectedPriorities: priorities }),

    togglePriority: (priority) => {
        const current = get().selectedPriorities;
        if (current.includes(priority)) {
            set({ selectedPriorities: current.filter(p => p !== priority) });
        } else {
            set({ selectedPriorities: [...current, priority] });
        }
    },

    setSelectedTags: (tags) => set({ selectedTags: tags }),

    toggleTag: (tag) => {
        const current = get().selectedTags;
        if (current.includes(tag)) {
            set({ selectedTags: current.filter(t => t !== tag) });
        } else {
            set({ selectedTags: [...current, tag] });
        }
    },

    setSelectedTypes: (types) => set({ selectedTypes: types }),

    toggleType: (type) => {
        const current = get().selectedTypes;
        if (current.includes(type)) {
            set({ selectedTypes: current.filter(t => t !== type) });
        } else {
            set({ selectedTypes: [...current, type] });
        }
    },

    setDateFrom: (date) => set({ dateFrom: date }),

    setDateTo: (date) => set({ dateTo: date }),

    setSortBy: (sortBy) => set({ sortBy }),

    clearFilters: () => set({ ...defaultFilterState }),

    hasActiveFilters: () => {
        const state = get();
        return (
            state.searchQuery !== '' ||
            state.selectedCategories.length > 0 ||
            state.selectedPriorities.length > 0 ||
            state.selectedTags.length > 0 ||
            state.selectedTypes.length > 0 ||
            state.dateFrom !== null ||
            state.dateTo !== null
        );
    },
});

/**
 * Kanban view filter store
 */
export const useKanbanFilterStore = create<FilterStore>((set, get) => ({
    ...defaultFilterState,
    ...createFilterActions(set, get),
}));

/**
 * Sidebar view filter store
 */
export const useSidebarFilterStore = create<FilterStore>((set, get) => ({
    ...defaultFilterState,
    ...createFilterActions(set, get),
}));
