/**
 * Quest Status Config
 * 
 * Shared configuration for quest status columns/sections.
 * Used by both SidebarQuests and FullKanban.
 */

import { QuestStatus } from '../models/QuestStatus';

/**
 * Configuration for a quest status column/section
 */
export interface StatusConfig {
    status: QuestStatus;
    title: string;
    emoji: string;
    themeClass: string;
}

/**
 * All quest statuses with their display configuration
 */
export const QUEST_STATUS_CONFIG: StatusConfig[] = [
    { status: QuestStatus.AVAILABLE, title: 'Available', emoji: '📋', themeClass: 'qb-col-available' },
    { status: QuestStatus.ACTIVE, title: 'Active', emoji: '⚡', themeClass: 'qb-col-active' },
    { status: QuestStatus.IN_PROGRESS, title: 'In Progress', emoji: '🔨', themeClass: 'qb-col-progress' },
    { status: QuestStatus.COMPLETED, title: 'Completed', emoji: '✅', themeClass: 'qb-col-completed' },
];

/**
 * Statuses to show in sidebar (excludes Completed)
 */
export const SIDEBAR_STATUSES = QUEST_STATUS_CONFIG.filter(
    c => c.status !== QuestStatus.COMPLETED
);

/**
 * All statuses for full kanban view
 */
export const KANBAN_STATUSES = QUEST_STATUS_CONFIG;

/**
 * Get config for a specific status
 */
export function getStatusConfig(status: QuestStatus): StatusConfig | undefined {
    return QUEST_STATUS_CONFIG.find(c => c.status === status);
}
