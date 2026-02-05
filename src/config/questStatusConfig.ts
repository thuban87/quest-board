/**
 * Quest Status Config
 * 
 * Shared configuration for quest status columns/sections.
 * Used by both SidebarQuests and FullKanban.
 * 
 * Supports both legacy QuestStatus enum values and custom column IDs.
 */

import { QuestStatus } from '../models/QuestStatus';
import type { QuestBoardSettings } from '../settings';
import { DEFAULT_COLUMNS, CustomColumn } from '../models/CustomColumn';

/**
 * Configuration for a quest status column/section
 */
export interface StatusConfig {
    status: QuestStatus | string;
    title: string;
    emoji: string;
    themeClass: string;
}

/**
 * Legacy quest statuses with their display configuration.
 * Used when enableCustomColumns is false or for backward compatibility.
 */
export const QUEST_STATUS_CONFIG: StatusConfig[] = [
    { status: QuestStatus.AVAILABLE, title: 'Available', emoji: '📋', themeClass: 'qb-col-available' },
    { status: QuestStatus.ACTIVE, title: 'Active', emoji: '⚡', themeClass: 'qb-col-active' },
    { status: QuestStatus.IN_PROGRESS, title: 'In Progress', emoji: '🔨', themeClass: 'qb-col-progress' },
    { status: QuestStatus.COMPLETED, title: 'Completed', emoji: '✅', themeClass: 'qb-col-completed' },
];

/**
 * Statuses to show in sidebar (excludes Completed) - legacy mode
 */
export const SIDEBAR_STATUSES = QUEST_STATUS_CONFIG.filter(
    c => c.status !== QuestStatus.COMPLETED
);

/**
 * All statuses for full kanban view - legacy mode
 */
export const KANBAN_STATUSES = QUEST_STATUS_CONFIG;

/**
 * Generate StatusConfig array from custom columns (dynamic mode)
 * @param settings - Plugin settings containing customColumns
 */
export function getStatusConfigs(settings: QuestBoardSettings): StatusConfig[] {
    // Use custom columns if feature is enabled and columns exist
    const columns: CustomColumn[] = (settings as any).enableCustomColumns &&
        Array.isArray((settings as any).customColumns) &&
        (settings as any).customColumns.length > 0
        ? (settings as any).customColumns
        : DEFAULT_COLUMNS;

    return columns.map(col => ({
        status: col.id,
        title: col.title,
        emoji: col.emoji || '',
        themeClass: `qb-col-${col.id}`,
    }));
}

/**
 * Get config for a specific status
 * @param status - Status to look up (QuestStatus enum or custom column ID)
 * @param settings - Optional plugin settings for custom columns lookup
 */
export function getStatusConfig(
    status: QuestStatus | string,
    settings?: QuestBoardSettings
): StatusConfig | undefined {
    // If settings provided, use dynamic config
    if (settings) {
        const configs = getStatusConfigs(settings);
        return configs.find(c => c.status === status);
    }
    // Fallback to legacy static config
    return QUEST_STATUS_CONFIG.find(c => c.status === status);
}

/**
 * Get sidebar statuses (excludes completion columns)
 * @param settings - Plugin settings for custom columns
 */
export function getSidebarStatuses(settings: QuestBoardSettings): StatusConfig[] {
    const allConfigs = getStatusConfigs(settings);
    const columns: CustomColumn[] = (settings as any).enableCustomColumns &&
        Array.isArray((settings as any).customColumns)
        ? (settings as any).customColumns
        : DEFAULT_COLUMNS;

    // Filter out columns that trigger completion
    const completionColumnIds = new Set(
        columns.filter(c => c.triggersCompletion).map(c => c.id)
    );

    return allConfigs.filter(c => !completionColumnIds.has(c.status as string));
}

/**
 * Get all kanban statuses (dynamic mode)
 * @param settings - Plugin settings for custom columns
 */
export function getKanbanStatuses(settings: QuestBoardSettings): StatusConfig[] {
    return getStatusConfigs(settings);
}

