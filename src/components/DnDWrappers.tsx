/**
 * DnD Wrappers
 * 
 * Shared droppable and draggable wrapper components for both
 * SidebarQuests and FullKanban views.
 */

import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

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
 * Draggable wrapper for quest cards
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
