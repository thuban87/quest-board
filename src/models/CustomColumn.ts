/**
 * Custom Kanban Column
 * 
 * Defines user-configurable Kanban board columns.
 * Column IDs are stored in quest frontmatter as the `status` field.
 */

/**
 * Custom column definition for the Kanban board
 */
export interface CustomColumn {
    /** Internal ID stored in quest frontmatter (lowercase alphanumeric + hyphens/underscores, 1-32 chars) */
    id: string;
    /** Display name shown in UI */
    title: string;
    /** Optional emoji shown before title (max 2 chars) */
    emoji?: string;
    /** If true, quests in this column count as "completed" for tracking purposes */
    triggersCompletion?: boolean;
}

/**
 * Default columns matching legacy QuestStatus enum values
 * These provide backward compatibility with existing quest files
 */
export const DEFAULT_COLUMNS: CustomColumn[] = [
    { id: 'available', title: 'Available', emoji: '📋', triggersCompletion: false },
    { id: 'active', title: 'Active', emoji: '⚡', triggersCompletion: false },
    { id: 'in-progress', title: 'In Progress', emoji: '🔨', triggersCompletion: false },
    { id: 'completed', title: 'Completed', emoji: '✅', triggersCompletion: true },
];

/**
 * Legacy status mapping for migration support
 * Maps old QuestStatus enum values to column IDs
 */
export const LEGACY_STATUS_MAP: Record<string, string> = {
    'available': 'available',
    'active': 'active',
    'in-progress': 'in-progress',
    'completed': 'completed',
};

/**
 * Validation constants for column configuration
 */
export const COLUMN_VALIDATION = {
    /** Regex pattern for valid column IDs */
    ID_PATTERN: /^[a-z0-9_-]{1,32}$/,
    /** Maximum length for display title */
    MAX_TITLE_LENGTH: 50,
    /** Maximum length for emoji (supports compound emoji) */
    MAX_EMOJI_LENGTH: 2,
    /** Minimum number of columns required */
    MIN_COLUMNS: 1,
    /** Maximum number of columns allowed */
    MAX_COLUMNS: 10,
} as const;

/**
 * Validate a column ID format
 * @param id - The column ID to validate
 * @returns true if valid, false otherwise
 */
export function validateColumnId(id: string): boolean {
    return COLUMN_VALIDATION.ID_PATTERN.test(id);
}

/**
 * Validate a complete column definition
 * @param column - The column to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateColumn(column: Partial<CustomColumn>): { isValid: boolean; error?: string } {
    if (!column.id || column.id.trim().length === 0) {
        return { isValid: false, error: 'Column ID is required' };
    }

    if (!validateColumnId(column.id)) {
        return { isValid: false, error: 'Column ID must be 1-32 lowercase letters, numbers, hyphens, or underscores' };
    }

    if (!column.title || column.title.trim().length === 0) {
        return { isValid: false, error: 'Column title is required' };
    }

    if (column.title.length > COLUMN_VALIDATION.MAX_TITLE_LENGTH) {
        return { isValid: false, error: `Column title cannot exceed ${COLUMN_VALIDATION.MAX_TITLE_LENGTH} characters` };
    }

    if (column.emoji && column.emoji.length > COLUMN_VALIDATION.MAX_EMOJI_LENGTH) {
        return { isValid: false, error: `Emoji cannot exceed ${COLUMN_VALIDATION.MAX_EMOJI_LENGTH} characters` };
    }

    return { isValid: true };
}
