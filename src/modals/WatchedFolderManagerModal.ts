/**
 * Watched Folder Manager Modal
 * 
 * Manage automatic quest generation from watched folders and daily notes.
 * Provides table view of all watchedFolderConfigs with status validation,
 * enable/disable toggles, and edit/delete actions.
 */

import { App, Modal, Setting, TFile, TFolder, Notice } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import type { WatchedFolderConfig } from '../services/FolderWatchService';

export class WatchedFolderManagerModal extends Modal {
    private plugin: QuestBoardPlugin;

    constructor(app: App, plugin: QuestBoardPlugin) {
        super(app);
        this.plugin = plugin;
    }

    async onOpen(): Promise<void> {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-watched-folder-manager');

        // Header
        contentEl.createEl('h2', { text: 'Watched Folders' });
        contentEl.createEl('p', {
            text: 'Manage automatic quest generation from watched folders and daily notes.',
            cls: 'modal-description'
        });

        const configs = this.plugin.settings.watchedFolderConfigs || [];

        if (configs.length === 0) {
            const emptyState = contentEl.createDiv({ cls: 'qb-empty-state' });
            emptyState.createEl('p', {
                text: 'No watched folders configured.'
            });
            emptyState.createEl('p', {
                text: 'Create a Daily Quest or Watched Folder template using the Template Builder to get started.',
                cls: 'setting-item-description'
            });
        } else {
            await this.renderTable(contentEl, configs);
        }

        // Footer
        const footer = contentEl.createDiv({ cls: 'modal-button-container' });
        const closeBtn = footer.createEl('button', { text: 'Close' });
        closeBtn.addEventListener('click', () => this.close());
    }

    private async renderTable(containerEl: HTMLElement, configs: WatchedFolderConfig[]): Promise<void> {
        const table = containerEl.createEl('table', { cls: 'qb-watcher-table' });

        // Header row
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        headerRow.createEl('th', { text: 'Template' });
        headerRow.createEl('th', { text: 'Watch Folder' });
        headerRow.createEl('th', { text: 'Type' });
        headerRow.createEl('th', { text: 'Status' });
        headerRow.createEl('th', { text: 'Enabled' });
        headerRow.createEl('th', { text: 'Actions' });

        // Body rows
        const tbody = table.createEl('tbody');

        for (const config of configs) {
            const row = tbody.createEl('tr');

            // Template name (extract from path)
            const templateName = config.templatePath.split('/').pop()?.replace('-template.md', '').replace('.md', '') || 'Unknown';
            row.createEl('td', { text: templateName });

            // Watch folder
            row.createEl('td', { text: config.watchFolder || '(root)' });

            // Quest type
            const typeText = config.questType === 'daily-quest' ? 'Daily Note' : 'Watched Folder';
            row.createEl('td', { text: typeText });

            // Status validation
            const statusCell = row.createEl('td');
            const templateFile = this.app.vault.getAbstractFileByPath(config.templatePath);
            const templateExists = templateFile instanceof TFile;
            const watchFolder = this.app.vault.getAbstractFileByPath(config.watchFolder);
            const folderExists = config.watchFolder === '' || config.watchFolder === '/' || watchFolder instanceof TFolder;

            if (!templateExists && !folderExists) {
                statusCell.createSpan({ text: '⚠ Template & Folder Missing', cls: 'qb-status-error' });
            } else if (!templateExists) {
                statusCell.createSpan({ text: '⚠ Template Missing', cls: 'qb-status-error' });
            } else if (!folderExists) {
                statusCell.createSpan({ text: '⚠ Folder Missing', cls: 'qb-status-warning' });
            } else if (!config.enabled) {
                statusCell.createSpan({ text: 'Disabled', cls: 'qb-status-disabled' });
            } else {
                statusCell.createSpan({ text: '✓ Active', cls: 'qb-status-ok' });
            }

            // Enabled toggle
            const toggleCell = row.createEl('td');
            const toggleContainer = toggleCell.createDiv({ cls: 'qb-toggle-container' });
            new Setting(toggleContainer)
                .addToggle(toggle => toggle
                    .setValue(config.enabled)
                    .onChange(async (value) => {
                        config.enabled = value;
                        await this.plugin.saveSettings();

                        // Restart or stop watcher
                        if (value) {
                            await this.plugin.folderWatchService?.startWatching(config);
                        } else {
                            this.plugin.folderWatchService?.stopWatching(config.id);
                        }

                        // Refresh display
                        this.onOpen();
                    }));

            // Actions
            const actionsCell = row.createEl('td');
            const actionsDiv = actionsCell.createDiv({ cls: 'qb-watcher-actions' });

            // Edit button (opens template in Scriveners Quill)
            const editBtn = actionsDiv.createEl('button', {
                text: 'Edit',
                cls: 'mod-cta'
            });
            editBtn.addEventListener('click', async () => {
                const templateFile = this.app.vault.getAbstractFileByPath(config.templatePath);
                if (templateFile instanceof TFile) {
                    try {
                        const { TemplateService } = await import('../services/TemplateService');
                        const templateService = new TemplateService(this.app.vault);
                        const parsed = await templateService.parseTemplate(config.templatePath);

                        if (parsed) {
                            const { ScrivenersQuillModal } = await import('./ScrivenersQuillModal');
                            new ScrivenersQuillModal(this.app, this.plugin, parsed).open();
                            this.close();
                        } else {
                            new Notice('❌ Failed to parse template');
                        }
                    } catch (error) {
                        new Notice('❌ Failed to load template');
                        console.error('[WatchedFolderManagerModal] Edit error:', error);
                    }
                } else {
                    new Notice('❌ Template file not found');
                }
            });

            // Delete button
            const deleteBtn = actionsDiv.createEl('button', {
                text: 'Delete',
                cls: 'mod-warning'
            });
            deleteBtn.addEventListener('click', async () => {
                if (confirm(`Delete watcher for "${templateName}"?\n\nThis will NOT delete the template file.`)) {
                    // Remove from array
                    this.plugin.settings.watchedFolderConfigs =
                        this.plugin.settings.watchedFolderConfigs.filter(c => c.id !== config.id);
                    await this.plugin.saveSettings();

                    // Stop watching
                    this.plugin.folderWatchService?.stopWatching(config.id);

                    new Notice('✓ Watcher removed');

                    // Refresh display
                    this.onOpen();
                }
            });
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
