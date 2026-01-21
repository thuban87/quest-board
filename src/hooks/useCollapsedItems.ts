/**
 * useCollapsedItems Hook
 *
 * Manages collapsed/expanded state for a set of items identified by string IDs.
 * Used for both quest cards and sections/columns.
 */

import { useState, useCallback } from 'react';

interface UseCollapsedItemsResult {
    /** Set of collapsed item IDs */
    collapsedItems: Set<string>;
    /** Check if an item is collapsed */
    isCollapsed: (id: string) => boolean;
    /** Toggle an item's collapsed state */
    toggle: (id: string) => void;
    /** Collapse specific items */
    collapse: (ids: string[]) => void;
    /** Expand specific items */
    expand: (ids: string[]) => void;
    /** Collapse all provided items */
    collapseAll: (ids: string[]) => void;
    /** Expand all provided items */
    expandAll: (ids: string[]) => void;
}

/**
 * Hook for managing a set of collapsed items.
 *
 * @param initialCollapsed - Optional initial set of collapsed IDs
 */
export function useCollapsedItems(
    initialCollapsed: Set<string> = new Set()
): UseCollapsedItemsResult {
    const [collapsedItems, setCollapsedItems] = useState<Set<string>>(initialCollapsed);

    const isCollapsed = useCallback(
        (id: string) => collapsedItems.has(id),
        [collapsedItems]
    );

    const toggle = useCallback((id: string) => {
        setCollapsedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const collapse = useCallback((ids: string[]) => {
        setCollapsedItems((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.add(id));
            return next;
        });
    }, []);

    const expand = useCallback((ids: string[]) => {
        setCollapsedItems((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.delete(id));
            return next;
        });
    }, []);

    const collapseAll = useCallback((ids: string[]) => {
        setCollapsedItems(new Set(ids));
    }, []);

    const expandAll = useCallback(() => {
        setCollapsedItems(new Set());
    }, []);

    return {
        collapsedItems,
        isCollapsed,
        toggle,
        collapse,
        expand,
        collapseAll,
        expandAll,
    };
}
