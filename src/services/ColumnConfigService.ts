/**
 * Column Configuration Service
 * 
 * Central service for managing custom Kanban column configuration.
 * Provides column lookup, validation, and completion detection utilities.
 * 
 * This service is the single source of truth for column configuration,
 * replacing hardcoded QuestStatus enum references throughout the codebase.
 */

import type { QuestBoardSettings } from '../settings';
import {
    CustomColumn,
    DEFAULT_COLUMNS,
    LEGACY_STATUS_MAP,
    validateColumnId,
    validateColumn,
    COLUMN_VALIDATION,
} from '../models/CustomColumn';

/**
 * Service for accessing and managing column configuration
 */
export class ColumnConfigService {
    private settings: QuestBoardSettings;
    private cachedColumns: CustomColumn[] | null = null;

    constructor(settings: QuestBoardSettings) {
        this.settings = settings;
    }

    /**
     * Get all configured columns
     * Returns custom columns from settings or default columns if not configured
     */
    getColumns(): CustomColumn[] {
        if (!this.cachedColumns) {
            // Check if custom columns feature is enabled and columns exist
            const customColumns = (this.settings as any).customColumns;
            if ((this.settings as any).enableCustomColumns && Array.isArray(customColumns) && customColumns.length > 0) {
                this.cachedColumns = customColumns;
            } else {
                this.cachedColumns = DEFAULT_COLUMNS;
            }
        }
        return this.cachedColumns;
    }

    /**
     * Get a column by its ID
     * @param id - Column ID to look up
     */
    getColumnById(id: string): CustomColumn | undefined {
        return this.getColumns().find(col => col.id === id);
    }

    /**
     * Check if a column ID represents a completion column
     * @param columnId - Column ID to check
     */
    isCompletionColumn(columnId: string): boolean {
        const column = this.getColumnById(columnId);
        return column?.triggersCompletion ?? false;
    }

    /**
     * Get the first column that triggers completion (for Complete button auto-move)
     */
    getFirstCompletionColumn(): CustomColumn | undefined {
        return this.getColumns().find(col => col.triggersCompletion);
    }

    /**
     * Get the default column ID for new quests (first column)
     */
    getDefaultColumn(): string {
        return this.getColumns()[0]?.id || 'available';
    }

    /**
     * Get column IDs as array (for dropdown options, etc.)
     */
    getColumnIds(): string[] {
        return this.getColumns().map(col => col.id);
    }

    /**
     * Resolve a status string to a valid column ID
     * Handles legacy status values and missing columns
     * @param status - The status value to resolve
     */
    resolveStatus(status: string): string {
        // First, check if it's a valid current column
        if (this.getColumnById(status)) {
            return status;
        }

        // Check legacy mapping
        const legacyId = LEGACY_STATUS_MAP[status];
        if (legacyId && this.getColumnById(legacyId)) {
            return legacyId;
        }

        // Fallback to first column
        return this.getDefaultColumn();
    }

    /**
     * Validate a column ID format
     */
    validateColumnId(id: string): boolean {
        return validateColumnId(id);
    }

    /**
     * Check if a column ID is unique among current columns
     * @param id - Column ID to check
     * @param excludeIndex - Optional index to exclude (for editing existing column)
     */
    isColumnIdUnique(id: string, excludeIndex?: number): boolean {
        const columns = this.getColumns();
        return !columns.some((col, idx) => col.id === id && idx !== excludeIndex);
    }

    /**
     * Validate a complete column definition
     */
    validateColumn(column: Partial<CustomColumn>): { isValid: boolean; error?: string } {
        return validateColumn(column);
    }

    /**
     * Get column display string (emoji + title)
     * @param columnId - Column ID
     */
    getColumnDisplay(columnId: string): string {
        const column = this.getColumnById(columnId);
        if (!column) {
            return columnId;
        }
        return column.emoji ? `${column.emoji} ${column.title}` : column.title;
    }

    /**
     * Invalidate cached columns (call after settings change)
     */
    invalidateCache(): void {
        this.cachedColumns = null;
    }

    /**
     * Get validation constants
     */
    static getValidationConstants() {
        return COLUMN_VALIDATION;
    }
}

/**
 * Create a new ColumnConfigService instance
 * Convenience factory for components that need temporary access
 */
export function createColumnConfigService(settings: QuestBoardSettings): ColumnConfigService {
    return new ColumnConfigService(settings);
}
