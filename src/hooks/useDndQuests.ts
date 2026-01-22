/**
 * useDndQuests Hook
 * 
 * Provides DnD sensors and drag end handler for quest boards.
 * Consolidates duplicated logic from SidebarQuests and FullKanban.
 * Supports both cross-column moves and intra-column reordering.
 */

import { useCallback } from 'react';
import { DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { QuestStatus } from '../models/QuestStatus';
import { Quest, isManualQuest } from '../models/Quest';

interface UseDndQuestsOptions {
    /** Called when quest is moved to a different column */
    onMoveQuest: (questId: string, newStatus: QuestStatus) => void;

    /** Called when quest is reordered within the same column */
    onReorderQuest?: (questId: string, newSortOrder: number, status: QuestStatus) => void;

    /** Current quest status map (questId -> status) for detecting same-column drops */
    getQuestStatus?: (questId: string) => QuestStatus | undefined;

    /** Current quests grouped by status for calculating new sort orders */
    getQuestsForStatus?: (status: QuestStatus) => Quest[];
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

        // Check if dropped on a status (column/section header)
        const isDroppedOnStatus = Object.values(QuestStatus).includes(overId as QuestStatus);

        if (isDroppedOnStatus) {
            const newStatus = overId as QuestStatus;
            const currentStatus = getQuestStatus?.(questId);

            // If same column and we have reorder support, this might be a reorder
            // But if dropped directly on the status, treat as a move
            if (currentStatus !== newStatus) {
                onMoveQuest(questId, newStatus);
            }
            // Same column drop on the column itself - no action needed
            return;
        }

        // Dropped on another quest card - this is a reorder
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
            const targetIndex = questsInColumn.findIndex(q => q.questId === targetQuestId);

            if (targetIndex === -1) return;

            // Calculate new sort order based on position
            // We use a gap of 1000 between items to allow insertions
            const GAP = 1000;
            let newSortOrder: number;

            if (targetIndex === 0) {
                // Dropped at the top (before first item)
                const firstQuest = questsInColumn[0];
                const firstOrder = isManualQuest(firstQuest) ? (firstQuest.sortOrder ?? GAP * targetIndex) : GAP * targetIndex;
                newSortOrder = firstOrder - GAP;
            } else if (targetIndex === questsInColumn.length - 1) {
                // Dropped at the bottom (after last item)
                const lastQuest = questsInColumn[questsInColumn.length - 1];
                const lastOrder = isManualQuest(lastQuest) ? (lastQuest.sortOrder ?? GAP * targetIndex) : GAP * targetIndex;
                newSortOrder = lastOrder + GAP;
            } else {
                // Dropped between two items
                const prevQuest = questsInColumn[targetIndex - 1];
                const nextQuest = questsInColumn[targetIndex];
                const prevOrder = isManualQuest(prevQuest) ? (prevQuest.sortOrder ?? GAP * (targetIndex - 1)) : GAP * (targetIndex - 1);
                const nextOrder = isManualQuest(nextQuest) ? (nextQuest.sortOrder ?? GAP * targetIndex) : GAP * targetIndex;
                newSortOrder = Math.floor((prevOrder + nextOrder) / 2);
            }

            onReorderQuest(questId, newSortOrder, sourceStatus);
        }
    }, [onMoveQuest, onReorderQuest, getQuestStatus, getQuestsForStatus]);

    return {
        sensors,
        handleDragEnd,
    };
}
