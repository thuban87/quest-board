/**
 * useFilteredQuests Hook
 * 
 * Applies filters, search, and sorting to a list of quests.
 * Used by both FullKanban and SidebarQuests views.
 */

import { useMemo } from 'react';
import { Quest, isManualQuest } from '../models/Quest';
import { FilterState, SortOption } from '../store/filterStore';
import { TaskSection } from '../services/TaskFileService';

export interface TaskProgress {
    completed: number;
    total: number;
}

export interface UseFilteredQuestsOptions {
    /** Quests to filter */
    quests: Quest[];

    /** Current filter state */
    filterState: FilterState;

    /** Task progress map for task count sorting */
    taskProgressMap: Record<string, TaskProgress>;

    /** Sections map for searching task names */
    sectionsMap: Record<string, TaskSection[]>;
}

/**
 * Filter and sort quests based on filter state
 */
export function useFilteredQuests({
    quests,
    filterState,
    taskProgressMap,
    sectionsMap,
}: UseFilteredQuestsOptions): Quest[] {
    return useMemo(() => {
        let filtered = [...quests];

        // 1. Filter by search query
        if (filterState.searchQuery.trim()) {
            const query = filterState.searchQuery.toLowerCase().trim();
            filtered = filtered.filter(quest => {
                // Check quest name
                if (quest.questName.toLowerCase().includes(query)) return true;

                // Check category
                if (quest.category.toLowerCase().includes(query)) return true;

                // Check tags
                if (quest.tags.some(tag => tag.toLowerCase().includes(query))) return true;

                // Check task names in sections
                const sections = sectionsMap[quest.questId];
                if (sections) {
                    for (const section of sections) {
                        for (const task of section.tasks) {
                            if (task.text.toLowerCase().includes(query)) return true;
                        }
                    }
                }

                return false;
            });
        }

        // 2. Filter by selected categories
        if (filterState.selectedCategories.length > 0) {
            filtered = filtered.filter(quest =>
                filterState.selectedCategories.includes(quest.category)
            );
        }

        // 3. Filter by selected priorities
        if (filterState.selectedPriorities.length > 0) {
            filtered = filtered.filter(quest =>
                filterState.selectedPriorities.includes(quest.priority)
            );
        }

        // 4. Filter by selected tags
        if (filterState.selectedTags.length > 0) {
            filtered = filtered.filter(quest =>
                filterState.selectedTags.some(tag => quest.tags.includes(tag))
            );
        }

        // 5. Filter by selected quest types
        if (filterState.selectedTypes.length > 0) {
            filtered = filtered.filter(quest =>
                filterState.selectedTypes.includes(quest.questType)
            );
        }

        // 6. Filter by date range (created date)
        if (filterState.dateFrom) {
            const fromDate = new Date(filterState.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(quest => {
                const questDate = new Date(quest.createdDate);
                return questDate >= fromDate;
            });
        }

        if (filterState.dateTo) {
            const toDate = new Date(filterState.dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(quest => {
                const questDate = new Date(quest.createdDate);
                return questDate <= toDate;
            });
        }

        // 7. Sort
        filtered = sortQuests(filtered, filterState.sortBy, taskProgressMap);

        return filtered;
    }, [
        quests,
        filterState.searchQuery,
        filterState.selectedCategories,
        filterState.selectedPriorities,
        filterState.selectedTags,
        filterState.selectedTypes,
        filterState.dateFrom,
        filterState.dateTo,
        filterState.sortBy,
        taskProgressMap,
        sectionsMap,
    ]);
}

/**
 * Sort quests by the specified option
 */
function sortQuests(
    quests: Quest[],
    sortBy: SortOption,
    taskProgressMap: Record<string, TaskProgress>
): Quest[] {
    switch (sortBy) {
        case 'sortOrder':
            // Sort by user-defined order (lower sortOrder = higher in list)
            return [...quests].sort((a, b) => {
                const orderA = isManualQuest(a) ? (a.sortOrder ?? 999999) : 999999;
                const orderB = isManualQuest(b) ? (b.sortOrder ?? 999999) : 999999;
                return orderA - orderB;
            });

        case 'taskCount-desc':
            // Biggest first (most tasks)
            return [...quests].sort((a, b) => {
                const countA = taskProgressMap[a.questId]?.total ?? 0;
                const countB = taskProgressMap[b.questId]?.total ?? 0;
                return countB - countA;
            });

        case 'taskCount-asc':
            // Smallest first (fewest tasks)
            return [...quests].sort((a, b) => {
                const countA = taskProgressMap[a.questId]?.total ?? 0;
                const countB = taskProgressMap[b.questId]?.total ?? 0;
                return countA - countB;
            });

        case 'created-desc':
            // Newest first
            return [...quests].sort((a, b) => {
                const dateA = new Date(a.createdDate).getTime();
                const dateB = new Date(b.createdDate).getTime();
                return dateB - dateA;
            });

        case 'created-asc':
            // Oldest first
            return [...quests].sort((a, b) => {
                const dateA = new Date(a.createdDate).getTime();
                const dateB = new Date(b.createdDate).getTime();
                return dateA - dateB;
            });

        case 'default':
        default:
            // No sorting (original order)
            return quests;
    }
}

/**
 * Collect all unique tags from a list of quests
 */
export function collectAllTags(quests: Quest[]): string[] {
    const tagSet = new Set<string>();
    for (const quest of quests) {
        for (const tag of quest.tags) {
            tagSet.add(tag);
        }
    }
    return Array.from(tagSet).sort();
}

/**
 * Collect all unique categories from a list of quests
 */
export function collectAllCategories(quests: Quest[]): string[] {
    const categorySet = new Set<string>();
    for (const quest of quests) {
        categorySet.add(quest.category);
    }
    return Array.from(categorySet).sort();
}

/**
 * Collect all unique quest types from a list of quests (folder names).
 * Excludes 'Archive' folder.
 */
export function collectAllTypes(quests: Quest[]): string[] {
    const typeSet = new Set<string>();
    for (const quest of quests) {
        // Skip archive type
        if (quest.questType && quest.questType.toLowerCase() !== 'archive') {
            typeSet.add(quest.questType);
        }
    }
    return Array.from(typeSet).sort();
}
