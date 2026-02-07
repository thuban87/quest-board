/**
 * AssetConfigModal
 * 
 * Shown on first install to let the user choose their asset folder
 * path before downloading begins. Provides folder autocomplete and
 * a recommended default.
 */

import { Modal, App, Setting, Notice } from 'obsidian';
import type QuestBoardPlugin from '../../main';

export class AssetConfigModal extends Modal {
    private plugin: QuestBoardPlugin;
    private folderPath: string;
    private textInput: HTMLInputElement | null = null;

    constructor(app: App, plugin: QuestBoardPlugin) {
        super(app);
        this.plugin = plugin;
        this.folderPath = plugin.settings.assetFolder || 'QuestBoard/assets';
    }

    /**
     * Read the current folder path from the text input.
     * We read the DOM value directly because FolderSuggest autocomplete
     * sets the input value via DOM (bypassing Obsidian's onChange callback).
     */
    private getCurrentPath(): string {
        if (this.textInput) {
            return this.textInput.value.trim() || 'QuestBoard/assets';
        }
        return this.folderPath;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-asset-config-modal');

        // Header
        contentEl.createEl('h2', { text: '🎨 Welcome to Quest Board!' });
        contentEl.createEl('p', {
            text: 'Quest Board uses pixel art sprites, environment tiles, and backgrounds to bring your quests to life. ' +
                'Choose where you\'d like these assets stored in your vault.',
            cls: 'qb-asset-config-desc',
        });

        // Recommendation note
        const noteEl = contentEl.createDiv({ cls: 'qb-asset-config-note' });
        noteEl.createEl('strong', { text: '💡 Recommendation: ' });
        noteEl.createSpan({ text: 'A dedicated folder like "QuestBoard/assets" keeps things organized and out of your notes.' });

        // Folder path setting
        const pathSetting = new Setting(contentEl)
            .setName('Asset Folder')
            .setDesc('Vault folder for downloaded sprites, tiles, and backgrounds');

        pathSetting.addText(text => {
            text.setPlaceholder('QuestBoard/assets')
                .setValue(this.folderPath);

            // Store reference to read value at save time
            this.textInput = text.inputEl;

            text.onChange((value) => {
                this.folderPath = value.trim() || 'QuestBoard/assets';
            });

            // Add folder autocomplete
            import('../utils/FolderSuggest').then(({ FolderSuggest }) => {
                new FolderSuggest(this.app, text.inputEl);
            });
        });

        // Action buttons
        const actions = contentEl.createDiv({ cls: 'qb-asset-config-actions' });

        const downloadBtn = actions.createEl('button', {
            cls: 'mod-cta',
            text: '📥 Download Assets',
        });
        downloadBtn.addEventListener('click', async () => {
            await this.handleDownload(downloadBtn);
        });

        const skipBtn = actions.createEl('button', {
            text: 'Skip for now',
            cls: 'qb-asset-config-skip',
        });
        skipBtn.addEventListener('click', () => {
            // Mark configured but don't download — user can do it later via settings
            this.plugin.settings.assetFolder = this.getCurrentPath();
            this.plugin.settings.assetConfigured = true;
            this.plugin.saveSettings();
            this.close();
            new Notice('💡 You can download assets anytime from Settings → File Paths → Asset Delivery', 8000);
        });
    }

    private async handleDownload(button: HTMLElement): Promise<void> {
        button.setText('Downloading...');
        button.setAttribute('disabled', 'true');

        try {
            // Read the current input value directly (handles FolderSuggest autocomplete)
            const chosenPath = this.getCurrentPath();

            // Save the chosen path
            this.plugin.settings.assetFolder = chosenPath;
            this.plugin.settings.assetConfigured = true;
            await this.plugin.saveSettings();

            // Reinitialize AssetService with chosen path
            const { AssetService } = await import('../services/AssetService');
            this.plugin.assetService = new AssetService(this.app, chosenPath);

            // Check for assets
            const { needsUpdate, files, orphaned, remoteManifest } = await this.plugin.assetService.checkForUpdates();

            if (needsUpdate && files.length > 0) {
                // Close this modal and open the download progress modal
                this.close();
                const { AssetDownloadModal } = await import('./AssetDownloadModal');
                const character = this.plugin.settings.character;
                new AssetDownloadModal(this.app, {
                    assetService: this.plugin.assetService,
                    filesToDownload: files,
                    manifest: remoteManifest,
                    orphanedFiles: orphaned,
                    isFirstRun: true,
                    characterClass: character?.class,
                    onComplete: () => {
                        this.plugin.settings.lastAssetCheck = Date.now();
                        this.plugin.saveSettings();
                        new Notice('✅ Quest Board assets downloaded successfully!');
                    },
                }).open();
            } else {
                this.plugin.settings.lastAssetCheck = Date.now();
                await this.plugin.saveSettings();
                this.close();
                new Notice('✅ All assets are already up to date!');
            }
        } catch (e) {
            button.setText('📥 Download Assets');
            button.removeAttribute('disabled');
            new Notice(`❌ Download failed: ${(e as Error).message}`, 5000);
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
