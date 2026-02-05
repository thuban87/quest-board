/**
 * Column Manager Modal
 * 
 * Modal for managing custom Kanban columns.
 * Features:
 * - Add new columns with validation
 * - Edit existing columns (ID, title, emoji, triggersCompletion)
 * - Drag-and-drop reordering
 * - Delete columns with confirmation
 * - Minimum 1 column enforced
 */

import { App, Modal, Notice, Setting } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import {
    CustomColumn,
    DEFAULT_COLUMNS,
    validateColumnId,
    validateColumn,
    COLUMN_VALIDATION
} from '../models/CustomColumn';
import { migrateQuestsFromDeletedColumn } from '../utils/columnMigration';

/**
 * Modal for managing Kanban column configuration
 */
export class ColumnManagerModal extends Modal {
    private plugin: QuestBoardPlugin;
    private columns: CustomColumn[];
    private draggedIndex: number | null = null;
    private editingIndex: number | null = null;

    constructor(app: App, plugin: QuestBoardPlugin) {
        super(app);
        this.plugin = plugin;
        // Deep clone columns to allow cancel
        this.columns = JSON.parse(JSON.stringify(
            plugin.settings.customColumns || DEFAULT_COLUMNS
        ));
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-column-manager');

        this.renderContent();
    }

    private renderContent(): void {
        const { contentEl } = this;
        contentEl.empty();

        // Header
        contentEl.createEl('h2', { text: '📋 Kanban Column Manager' });
        contentEl.createEl('p', {
            text: 'Drag to reorder, click to edit. Column IDs are stored in quest files.',
            cls: 'qb-column-manager-desc'
        });

        // Warning box
        const warningBox = contentEl.createEl('div', { cls: 'qb-column-manager-warning' });
        warningBox.innerHTML = `
            <strong>⚠️ Important:</strong> Column IDs are stored in quest frontmatter. 
            Renaming an ID will cause existing quests to migrate to the first column.
        `;

        // Column list
        const listContainer = contentEl.createEl('div', { cls: 'qb-column-list' });
        this.renderColumnList(listContainer);

        // Add new column section
        this.renderAddColumnForm(contentEl);

        // Footer buttons
        this.renderFooter(contentEl);
    }

    private renderColumnList(container: HTMLElement): void {
        container.empty();

        if (this.columns.length === 0) {
            container.createEl('p', {
                text: 'No columns defined. Add at least one column.',
                cls: 'qb-column-empty'
            });
            return;
        }

        this.columns.forEach((column, index) => {
            const isEditing = this.editingIndex === index;

            if (isEditing) {
                this.renderColumnEditRow(container, column, index);
            } else {
                this.renderColumnDisplayRow(container, column, index);
            }
        });
    }

    private renderColumnDisplayRow(container: HTMLElement, column: CustomColumn, index: number): void {
        const row = container.createEl('div', { cls: 'qb-column-row' });
        row.setAttribute('draggable', 'true');
        row.setAttribute('data-index', index.toString());

        // Drag handle
        const dragHandle = row.createEl('span', {
            cls: 'qb-column-drag-handle',
            text: '⣿'
        });
        dragHandle.setAttribute('title', 'Drag to reorder');

        // Column info
        const info = row.createEl('div', { cls: 'qb-column-info' });

        const titleSpan = info.createEl('span', { cls: 'qb-column-title' });
        titleSpan.textContent = `${column.emoji || ''} ${column.title}`.trim();

        const idSpan = info.createEl('span', { cls: 'qb-column-id' });
        idSpan.textContent = `ID: ${column.id}`;

        if (column.triggersCompletion) {
            const completionBadge = info.createEl('span', {
                cls: 'qb-column-badge qb-completion-badge',
                text: '✅ Completion'
            });
        }

        // Action buttons
        const actions = row.createEl('div', { cls: 'qb-column-actions' });

        const editBtn = actions.createEl('button', {
            text: 'Edit',
            cls: 'qb-column-btn'
        });
        editBtn.addEventListener('click', () => {
            this.editingIndex = index;
            this.renderContent();
        });

        // Only show delete if more than 1 column
        if (this.columns.length > 1) {
            const deleteBtn = actions.createEl('button', {
                text: '🗑️',
                cls: 'qb-column-btn qb-btn-danger'
            });
            deleteBtn.setAttribute('title', 'Delete column');
            deleteBtn.addEventListener('click', () => this.handleDeleteColumn(index));
        }

        // Drag events
        row.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
        row.addEventListener('dragover', (e) => this.handleDragOver(e, index));
        row.addEventListener('dragend', () => this.handleDragEnd());
        row.addEventListener('drop', (e) => this.handleDrop(e, index));
    }

    private renderColumnEditRow(container: HTMLElement, column: CustomColumn, index: number): void {
        const row = container.createEl('div', { cls: 'qb-column-row qb-column-editing' });

        // Form fields
        const form = row.createEl('div', { cls: 'qb-column-edit-form' });

        // ID field
        const idGroup = form.createEl('div', { cls: 'qb-form-group' });
        idGroup.createEl('label', { text: 'ID (stored in quest files)' });
        const idInput = idGroup.createEl('input', { type: 'text' });
        idInput.value = column.id;
        idInput.placeholder = 'e.g., in-progress';
        idInput.addClass('qb-input');

        // Title field
        const titleGroup = form.createEl('div', { cls: 'qb-form-group' });
        titleGroup.createEl('label', { text: 'Display Title' });
        const titleInput = titleGroup.createEl('input', { type: 'text' });
        titleInput.value = column.title;
        titleInput.placeholder = 'e.g., In Progress';
        titleInput.addClass('qb-input');

        // Emoji field
        const emojiGroup = form.createEl('div', { cls: 'qb-form-group qb-form-group-small' });
        emojiGroup.createEl('label', { text: 'Emoji' });
        const emojiInput = emojiGroup.createEl('input', { type: 'text' });
        emojiInput.value = column.emoji || '';
        emojiInput.placeholder = '🔨';
        emojiInput.addClass('qb-input');
        emojiInput.maxLength = 2;

        // Triggers completion checkbox
        const completionGroup = form.createEl('div', { cls: 'qb-form-group qb-form-group-checkbox' });
        const checkboxWrapper = completionGroup.createEl('label', { cls: 'qb-checkbox-wrapper' });
        const checkbox = checkboxWrapper.createEl('input', { type: 'checkbox' });
        checkbox.checked = column.triggersCompletion || false;
        checkboxWrapper.createEl('span', { text: 'Triggers Completion (awards rewards when quest moved here)' });

        // Error display
        const errorEl = form.createEl('div', { cls: 'qb-form-error' });
        errorEl.style.display = 'none';

        // Action buttons
        const actions = row.createEl('div', { cls: 'qb-column-edit-actions' });

        const saveBtn = actions.createEl('button', {
            text: 'Save',
            cls: 'qb-column-btn qb-btn-primary'
        });
        saveBtn.addEventListener('click', () => {
            const newColumn: CustomColumn = {
                id: idInput.value.toLowerCase().trim(),
                title: titleInput.value.trim(),
                emoji: emojiInput.value.trim() || undefined,
                triggersCompletion: checkbox.checked,
            };

            // Validate
            const validation = validateColumn(newColumn);
            if (!validation.isValid) {
                errorEl.textContent = validation.error || 'Invalid column';
                errorEl.style.display = 'block';
                return;
            }

            // Check ID uniqueness (excluding current index)
            const isDuplicate = this.columns.some((c, i) =>
                i !== index && c.id === newColumn.id
            );
            if (isDuplicate) {
                errorEl.textContent = 'Column ID already exists';
                errorEl.style.display = 'block';
                return;
            }

            // Save
            this.columns[index] = newColumn;
            this.editingIndex = null;
            this.renderContent();
        });

        const cancelBtn = actions.createEl('button', {
            text: 'Cancel',
            cls: 'qb-column-btn'
        });
        cancelBtn.addEventListener('click', () => {
            this.editingIndex = null;
            this.renderContent();
        });
    }

    private renderAddColumnForm(container: HTMLElement): void {
        container.createEl('h3', { text: 'Add New Column' });

        const form = container.createEl('div', { cls: 'qb-add-column-form' });

        // ID field
        const idGroup = form.createEl('div', { cls: 'qb-form-group' });
        idGroup.createEl('label', { text: 'Column ID' });
        const idInput = idGroup.createEl('input', { type: 'text' });
        idInput.placeholder = 'e.g., review (lowercase, no spaces)';
        idInput.addClass('qb-input');

        // Title field
        const titleGroup = form.createEl('div', { cls: 'qb-form-group' });
        titleGroup.createEl('label', { text: 'Display Title' });
        const titleInput = titleGroup.createEl('input', { type: 'text' });
        titleInput.placeholder = 'e.g., Under Review';
        titleInput.addClass('qb-input');

        // Emoji field
        const emojiGroup = form.createEl('div', { cls: 'qb-form-group qb-form-group-small' });
        emojiGroup.createEl('label', { text: 'Emoji (optional)' });
        const emojiInput = emojiGroup.createEl('input', { type: 'text' });
        emojiInput.placeholder = '🔍';
        emojiInput.addClass('qb-input');
        emojiInput.maxLength = 2;

        // Triggers completion checkbox
        const completionGroup = form.createEl('div', { cls: 'qb-form-group qb-form-group-checkbox' });
        const checkboxWrapper = completionGroup.createEl('label', { cls: 'qb-checkbox-wrapper' });
        const checkbox = checkboxWrapper.createEl('input', { type: 'checkbox' });
        checkboxWrapper.createEl('span', { text: 'Triggers Completion' });

        // Error display
        const errorEl = form.createEl('div', { cls: 'qb-form-error' });
        errorEl.style.display = 'none';

        // Add button
        const addBtn = form.createEl('button', {
            text: '➕ Add Column',
            cls: 'qb-column-btn qb-btn-primary'
        });
        addBtn.addEventListener('click', () => {
            const newColumn: CustomColumn = {
                id: idInput.value.toLowerCase().trim(),
                title: titleInput.value.trim(),
                emoji: emojiInput.value.trim() || undefined,
                triggersCompletion: checkbox.checked,
            };

            // Validate
            const validation = validateColumn(newColumn);
            if (!validation.isValid) {
                errorEl.textContent = validation.error || 'Invalid column';
                errorEl.style.display = 'block';
                return;
            }

            // Check uniqueness
            const isDuplicate = this.columns.some(c => c.id === newColumn.id);
            if (isDuplicate) {
                errorEl.textContent = 'Column ID already exists';
                errorEl.style.display = 'block';
                return;
            }

            // Check max columns
            if (this.columns.length >= COLUMN_VALIDATION.MAX_COLUMNS) {
                errorEl.textContent = `Maximum ${COLUMN_VALIDATION.MAX_COLUMNS} columns allowed`;
                errorEl.style.display = 'block';
                return;
            }

            // Add column
            this.columns.push(newColumn);

            // Clear form
            idInput.value = '';
            titleInput.value = '';
            emojiInput.value = '';
            checkbox.checked = false;
            errorEl.style.display = 'none';

            this.renderContent();
            new Notice(`Column "${newColumn.title}" added`);
        });
    }

    private renderFooter(container: HTMLElement): void {
        const footer = container.createEl('div', { cls: 'qb-column-manager-footer' });

        const resetBtn = footer.createEl('button', {
            text: 'Reset to Defaults',
            cls: 'qb-column-btn'
        });
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset all columns to defaults? This cannot be undone.')) {
                this.columns = JSON.parse(JSON.stringify(DEFAULT_COLUMNS));
                this.editingIndex = null;
                this.renderContent();
                new Notice('Columns reset to defaults');
            }
        });

        const cancelBtn = footer.createEl('button', {
            text: 'Cancel',
            cls: 'qb-column-btn'
        });
        cancelBtn.addEventListener('click', () => this.close());

        const saveBtn = footer.createEl('button', {
            text: 'Save Changes',
            cls: 'qb-column-btn qb-btn-primary'
        });
        saveBtn.addEventListener('click', () => this.handleSave());
    }

    // Drag-and-drop handlers
    private handleDragStart(e: DragEvent, index: number): void {
        this.draggedIndex = index;
        if (e.target instanceof HTMLElement) {
            e.target.classList.add('qb-dragging');
        }
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index.toString());
        }
    }

    private handleDragOver(e: DragEvent, index: number): void {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }

        // Add drop indicator
        const rows = this.contentEl.querySelectorAll('.qb-column-row');
        rows.forEach(row => row.classList.remove('qb-drop-target'));

        if (this.draggedIndex !== null && this.draggedIndex !== index) {
            const targetRow = this.contentEl.querySelector(`[data-index="${index}"]`);
            if (targetRow) {
                targetRow.classList.add('qb-drop-target');
            }
        }
    }

    private handleDrop(e: DragEvent, targetIndex: number): void {
        e.preventDefault();

        if (this.draggedIndex === null || this.draggedIndex === targetIndex) {
            return;
        }

        // Reorder columns
        const [movedColumn] = this.columns.splice(this.draggedIndex, 1);
        this.columns.splice(targetIndex, 0, movedColumn);

        this.draggedIndex = null;
        this.renderContent();
    }

    private handleDragEnd(): void {
        this.draggedIndex = null;
        const rows = this.contentEl.querySelectorAll('.qb-column-row');
        rows.forEach(row => {
            row.classList.remove('qb-dragging');
            row.classList.remove('qb-drop-target');
        });
    }

    private async handleDeleteColumn(index: number): Promise<void> {
        const column = this.columns[index];

        if (this.columns.length <= COLUMN_VALIDATION.MIN_COLUMNS) {
            new Notice('Cannot delete the last column');
            return;
        }

        if (confirm(`Delete column "${column.title}"? Quests in this column will migrate to the first column.`)) {
            // Get the target column (first column that's not being deleted)
            const targetColumn = this.columns.find((_, i) => i !== index);
            if (!targetColumn) {
                new Notice('Error: No target column for migration');
                return;
            }

            // Migrate quests before removing the column
            const migratedCount = await migrateQuestsFromDeletedColumn(
                this.app.vault,
                column.id,
                targetColumn.id
            );

            // Remove the column from our local array
            this.columns.splice(index, 1);
            this.editingIndex = null;
            this.renderContent();

            if (migratedCount > 0) {
                new Notice(`Column "${column.title}" deleted. ${migratedCount} quest(s) moved to "${targetColumn.title}".`);
            } else {
                new Notice(`Column "${column.title}" deleted`);
            }
        }
    }

    private async handleSave(): Promise<void> {
        // Validate we have at least one column
        if (this.columns.length < COLUMN_VALIDATION.MIN_COLUMNS) {
            new Notice('You must have at least one column');
            return;
        }

        // Save to settings
        this.plugin.settings.customColumns = this.columns;
        await this.plugin.saveSettings();

        new Notice('Column configuration saved');
        this.close();
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
