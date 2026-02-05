/**
 * useDndQuests Hook
 * 
 * Provides DnD sensors and drag end handler for quest boards.
 * Consolidates duplicated logic from SidebarQuests and FullKanban.
 * Supports both cross-column moves and intra-column reordering.
 */

import { useCallback } from 'react';
import { DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Quest, isManualQuest } from '../models/Quest';

interface UseDndQuestsOptions {
    /** Called when quest is moved to a different column */
    onMoveQuest: (questId: string, newStatus: string) => void;

    /** Called when quest is reordered within the same column */
    onReorderQuest?: (questId: string, newSortOrder: number, status: string) => void;

    /** Current quest status map (questId -> status) for detecting same-column drops */
    getQuestStatus?: (questId: string) => string | undefined;

    /** Current quests grouped by status for calculating new sort orders */
    getQuestsForStatus?: (status: string) => Quest[];

    /** Valid column IDs for detecting column drops */
    columnIds?: string[];
}

interface UseDndQuestsResult {
    sensors: ReturnType<typeof useSensors>;
    handleDragEnd: (event: DragEndEvent) => void;
}

/**
 * Hook providing DnD sensors and drag end handler for quest boards.
 * Supports cross-column moves and intra-column reordering.
 */
export function useDndQuests({
    onMoveQuest,
    onReorderQuest,
    getQuestStatus,
    getQuestsForStatus,
    columnIds = [],
}: UseDndQuestsOptions): UseDndQuestsResult {
    // DnD sensors - require slight movement before dragging starts
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Handle drag end - move quest to new status or reorder within column
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const questId = active.id as string;
        const overId = over.id as string;

        // Don't do anything if dropped on itself
        if (questId === overId) return;

        // Check if dropped on a status (column/section header)
        const isDroppedOnStatus = columnIds.includes(overId);

        if (isDroppedOnStatus) {
            const newStatus = overId;
            const currentStatus = getQuestStatus?.(questId);

            // If different column, move the quest
            if (currentStatus !== newStatus) {
                onMoveQuest(questId, newStatus);
            }
            return;
        }

        // Dropped on another quest card - check if it's a reorder or cross-column move
        const targetQuestId = overId;

        if (onReorderQuest && getQuestStatus && getQuestsForStatus) {
            const sourceStatus = getQuestStatus(questId);
            const targetStatus = getQuestStatus(targetQuestId);

            if (!sourceStatus || !targetStatus) return;

            // If dropped on a quest in a different column, move to that column
            if (sourceStatus !== targetStatus) {
                onMoveQuest(questId, targetStatus);
                return;
            }

            // Same column - reorder
            const questsInColumn = getQuestsForStatus(sourceStatus);
            const activeIndex = questsInColumn.findIndex(q => q.questId === questId);
            const overIndex = questsInColumn.findIndex(q => q.questId === targetQuestId);

            if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;

            // Calculate new sort order based on target position
            // Use gaps of 1000 between items for easy insertions
            const GAP = 1000;
            let newSortOrder: number;

            // Get the reordered array to determine neighbors
            const reorderedQuests = arrayMove(questsInColumn, activeIndex, overIndex);
            const newIndex = reorderedQuests.findIndex(q => q.questId === questId);

            if (newIndex === 0) {
                // Now at the top - use order before the next item
                const nextQuest = reorderedQuests[1];
                const nextOrder = isManualQuest(nextQuest) ? (nextQuest.sortOrder ?? GAP) : GAP;
                newSortOrder = nextOrder - GAP;
            } else if (newIndex === reorderedQuests.length - 1) {
                // Now at the bottom - use order after the previous item
                const prevQuest = reorderedQuests[newIndex - 1];
                const prevOrder = isManualQuest(prevQuest) ? (prevQuest.sortOrder ?? GAP * newIndex) : GAP * newIndex;
                newSortOrder = prevOrder + GAP;
            } else {
                // Between two items - use midpoint
                const prevQuest = reorderedQuests[newIndex - 1];
                const nextQuest = reorderedQuests[newIndex + 1];
                const prevOrder = isManualQuest(prevQuest) ? (prevQuest.sortOrder ?? GAP * (newIndex - 1)) : GAP * (newIndex - 1);
                const nextOrder = isManualQuest(nextQuest) ? (nextQuest.sortOrder ?? GAP * (newIndex + 1)) : GAP * (newIndex + 1);
                newSortOrder = Math.floor((prevOrder + nextOrder) / 2);
            }

            onReorderQuest(questId, newSortOrder, sourceStatus);
        }
    }, [onMoveQuest, onReorderQuest, getQuestStatus, getQuestsForStatus, columnIds]);

    return {
        sensors,
        handleDragEnd,
    };
}
