/**
 * DnD Wrappers
 * 
 * Shared droppable and draggable wrapper components for both
 * SidebarQuests and FullKanban views.
 * 
 * Uses @dnd-kit/sortable for smooth reordering animations.
 */

import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Droppable wrapper for quest sections/columns
 * Provides drop target styling when hovering
 */
export const Droppable: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div ref={setNodeRef} style={{ opacity: isOver ? 0.8 : 1 }}>
            {children}
        </div>
    );
};

/**
 * Draggable wrapper for quest cards (basic - no sorting)
 * Provides drag transform styling when dragging
 */
export const DraggableCard: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 }
        : undefined;
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
};

/**
 * Sortable wrapper for quest cards (with reorder support)
 * Uses @dnd-kit/sortable for smooth animations
 */
export const SortableCard: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
};
