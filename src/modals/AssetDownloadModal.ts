/**
 * Asset Download Modal
 * 
 * Shows download progress when fetching remote assets.
 * Used for first-run setup and asset update flows.
 * 
 * Features:
 * - Visual progress bar with file count
 * - Priority queue: current character class sprites download first
 * - Cancel support with partial-state safety
 * - Orphan cleanup after successful download
 */

import { App, Modal, Notice } from 'obsidian';
import { AssetService, AssetManifest } from '../services/AssetService';

// =====================
// PRIORITY QUEUE
// =====================

/**
 * Reorder files so the current character's class sprites download first,
 * then remaining sprites, then everything else (tiles, backgrounds).
 * 
 * @param characterClass - e.g. 'warrior', 'paladin'. If undefined, no reordering.
 * @param files - flat list of relative asset paths from the manifest
 * @returns reordered copy of the file list
 */
export function prioritizeFiles(characterClass: string | undefined, files: string[]): string[] {
    if (!characterClass || files.length === 0) return [...files];

    const classLower = characterClass.toLowerCase();

    const classSprites: string[] = [];
    const otherSprites: string[] = [];
    const rest: string[] = [];

    for (const file of files) {
        const lower = file.toLowerCase();
        if (lower.startsWith(`sprites/player/${classLower}/`)) {
            classSprites.push(file);
        } else if (lower.startsWith('sprites/')) {
            otherSprites.push(file);
        } else {
            rest.push(file);
        }
    }

    return [...classSprites, ...otherSprites, ...rest];
}

// =====================
// MODAL OPTIONS
// =====================

export interface AssetDownloadModalOptions {
    /** The asset service instance (from plugin) */
    assetService: AssetService;
    /** Files that need downloading (from checkForUpdates) */
    filesToDownload: string[];
    /** The remote manifest (from checkForUpdates — same ref avoids TOCTOU) */
    manifest: AssetManifest;
    /** Files to clean up after successful download */
    orphanedFiles?: string[];
    /** Controls header text ("Setting up" vs "Updating") */
    isFirstRun?: boolean;
    /** Current character class for priority queue (e.g. 'warrior') */
    characterClass?: string;
    /** Called after successful download + cleanup */
    onComplete?: () => void;
}

// =====================
// ASSET DOWNLOAD MODAL
// =====================

export class AssetDownloadModal extends Modal {
    private options: AssetDownloadModalOptions;
    private cancelled = false;
    private downloading = false;

    /** DOM references for progress updates */
    private progressBar: HTMLProgressElement | null = null;
    private statusText: HTMLElement | null = null;
    private statsText: HTMLElement | null = null;
    private cancelBtn: HTMLButtonElement | null = null;

    constructor(app: App, options: AssetDownloadModalOptions) {
        super(app);
        this.options = options;
    }

    onOpen(): void {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-asset-download-modal');
        modalEl.addClass('qb-modal-asset-download');

        this.render();
        this.startDownload();
    }

    private render(): void {
        const { contentEl } = this;
        const { isFirstRun, filesToDownload } = this.options;

        // Header
        const header = contentEl.createDiv('qb-download-header');
        header.createEl('div', { cls: 'qb-download-icon', text: '📦' });
        header.createEl('h2', {
            text: isFirstRun
                ? 'Setting Up Quest Board Assets'
                : 'Updating Quest Board Assets',
        });
        header.createEl('p', {
            cls: 'qb-download-subtitle',
            text: isFirstRun
                ? 'Downloading sprites, tiles, and backgrounds for the first time...'
                : `${filesToDownload.length} file${filesToDownload.length !== 1 ? 's' : ''} to update...`,
        });

        // Progress bar
        const progressContainer = contentEl.createDiv('qb-download-progress');
        this.progressBar = progressContainer.createEl('progress', {
            attr: { max: String(filesToDownload.length), value: '0' },
        });

        // Stats line (e.g. "5 / 200 files • 2%")
        this.statsText = progressContainer.createEl('div', {
            cls: 'qb-download-stats',
            text: `0 / ${filesToDownload.length} files`,
        });

        // Current file status
        this.statusText = contentEl.createEl('div', {
            cls: 'qb-download-status',
            text: 'Preparing download...',
        });

        // Cancel button
        const footer = contentEl.createDiv('qb-download-footer');
        this.cancelBtn = footer.createEl('button', {
            text: 'Cancel',
            cls: 'qb-download-cancel-btn',
        });
        this.cancelBtn.onclick = () => this.handleCancel();
    }

    /**
     * Start the download process with priority-ordered files.
     * On success: cleans up orphans, writes manifest (via AssetService), calls onComplete.
     * On cancel: leaves already-downloaded files intact (they're valid), does NOT write manifest.
     */
    private async startDownload(): Promise<void> {
        const { assetService, filesToDownload, manifest, orphanedFiles, onComplete } = this.options;

        // Reorder files: current class sprites first
        const prioritized = prioritizeFiles(this.options.characterClass, filesToDownload);

        this.downloading = true;

        try {
            await assetService.downloadAssets(
                prioritized,
                manifest,
                (current, total, file) => {
                    // Check cancel flag — throwing here aborts the download loop
                    if (this.cancelled) {
                        throw new Error('Download cancelled by user');
                    }
                    this.updateProgress(current, total, file);
                }
            );

            // Clean up orphaned files after successful download
            if (orphanedFiles && orphanedFiles.length > 0) {
                this.updateStatus('Cleaning up old files...');
                await assetService.cleanupOrphanedFiles(orphanedFiles);
            }

            this.downloading = false;
            this.showComplete();
            onComplete?.();

        } catch (e) {
            this.downloading = false;
            const error = e as Error;

            if (this.cancelled) {
                // User cancelled — already-downloaded files are intact and valid.
                // Manifest was NOT written (AssetService writes it last).
                // Next startup will re-check and resume where we left off.
                new Notice('📦 Download cancelled. Assets will be downloaded on next startup.', 5000);
                this.close();
            } else {
                // Actual failure
                this.showError(error.message);
            }
        }
    }

    /**
     * Update the progress bar and status text during download.
     */
    private updateProgress(current: number, total: number, file: string): void {
        if (this.progressBar) {
            this.progressBar.value = current;
        }
        if (this.statsText) {
            const pct = Math.round((current / total) * 100);
            this.statsText.textContent = `${current} / ${total} files • ${pct}%`;
        }
        // Show just the filename, not the full path
        const shortName = file.substring(file.lastIndexOf('/') + 1);
        this.updateStatus(`Downloading: ${shortName}`);
    }

    private updateStatus(text: string): void {
        if (this.statusText) {
            this.statusText.textContent = text;
        }
    }

    /**
     * Show the success state after all files are downloaded.
     */
    private showComplete(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-asset-download-modal');

        const complete = contentEl.createDiv('qb-download-complete');
        complete.createEl('div', { cls: 'qb-download-complete-icon', text: '✅' });
        complete.createEl('h2', { text: 'Assets Ready!' });
        complete.createEl('p', {
            text: `${this.options.filesToDownload.length} files downloaded successfully.`,
        });

        const closeBtn = complete.createEl('button', {
            text: 'Close',
            cls: 'qb-btn-primary',
        });
        closeBtn.onclick = () => this.close();
    }

    /**
     * Show an error state with retry option.
     */
    private showError(message: string): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-asset-download-modal');

        const error = contentEl.createDiv('qb-download-error');
        error.createEl('div', { cls: 'qb-download-error-icon', text: '❌' });
        error.createEl('h2', { text: 'Download Failed' });
        error.createEl('p', {
            cls: 'qb-download-error-message',
            text: message,
        });
        error.createEl('p', {
            cls: 'qb-download-error-hint',
            text: 'You can retry by running "Check for Asset Updates" from the command palette.',
        });

        const closeBtn = error.createEl('button', {
            text: 'Close',
            cls: 'qb-btn-secondary',
        });
        closeBtn.onclick = () => this.close();
    }

    /**
     * Handle cancel button click.
     * Sets flag that will be checked on next progress callback.
     */
    private handleCancel(): void {
        if (!this.downloading) {
            this.close();
            return;
        }

        // Confirm cancel if download is in progress
        this.cancelled = true;
        this.updateStatus('Cancelling...');
        if (this.cancelBtn) {
            this.cancelBtn.disabled = true;
            this.cancelBtn.textContent = 'Cancelling...';
        }
    }

    onClose(): void {
        // If user closes modal via Escape while downloading, treat as cancel
        if (this.downloading && !this.cancelled) {
            this.cancelled = true;
        }
        this.contentEl.empty();
    }
}
