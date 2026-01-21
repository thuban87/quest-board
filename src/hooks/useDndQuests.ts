/**
 * useDndQuests Hook
 * 
 * Provides DnD sensors and drag end handler for quest boards.
 * Consolidates duplicated logic from SidebarQuests and FullKanban.
 */

import { useCallback } from 'react';
import { DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { QuestStatus } from '../models/QuestStatus';

interface UseDndQuestsOptions {
    onMoveQuest: (questId: string, newStatus: QuestStatus) => void;
}

interface UseDndQuestsResult {
    sensors: ReturnType<typeof useSensors>;
    handleDragEnd: (event: DragEndEvent) => void;
}

/**
 * Hook providing DnD sensors and drag end handler for quest boards.
 */
export function useDndQuests({ onMoveQuest }: UseDndQuestsOptions): UseDndQuestsResult {
    // DnD sensors - require slight movement before dragging starts
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Handle drag end - move quest to new status
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const questId = active.id as string;
        const newStatus = over.id as QuestStatus;

        // Check if valid status
        if (!Object.values(QuestStatus).includes(newStatus)) return;

        onMoveQuest(questId, newStatus);
    }, [onMoveQuest]);

    return {
        sensors,
        handleDragEnd,
    };
}
