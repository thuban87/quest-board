/**
 * AssetService
 * 
 * Handles remote asset fetching, caching, and versioning.
 * Assets are stored in a vault folder that syncs across devices.
 * 
 * Key concepts:
 * - Storage Path: Vault-relative path for file I/O (e.g., "QuestBoard/assets/sprite.png")
 * - Display Path: Resource path for <img src> (e.g., "app://local/...")
 * 
 * Robustness features:
 * - Uses requestUrl (not fetch) for mobile compatibility
 * - Verifies file existence, not just manifest (handles accidental deletions)
 * - Retry with exponential backoff for transient network failures
 * - Cleans up orphaned files when assets are renamed/removed
 */

import { App, Vault, DataAdapter, requestUrl, RequestUrlParam } from 'obsidian';
import { safeJsonParse } from '../utils/safeJson';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/thuban87/quest-board@main/assets';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 500;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB safety limit

/** requestUrl supports timeout at runtime but the type definition omits it */
interface RequestUrlParamWithTimeout extends RequestUrlParam {
    timeout?: number;
}

export class AssetService {
    private vault: Vault;
    private adapter: DataAdapter;
    private assetFolder: string;
    private maxConcurrent = 5;

    constructor(app: App, assetFolder: string = 'QuestBoard/assets') {
        this.vault = app.vault;
        this.adapter = app.vault.adapter;
        this.assetFolder = assetFolder;
    }

    /**
     * Check if this is the first run (no manifest = no assets)
     */
    async isFirstRun(): Promise<boolean> {
        const manifestPath = this.getStoragePath('manifest.json');
        return !(await this.adapter.exists(manifestPath));
    }

    /**
     * Compare local vs remote manifest, return files that need downloading.
     * IMPORTANT: Also verifies file existence - don't trust manifest alone!
     * Returns the fetched remote manifest to avoid TOCTOU bugs.
     */
    async checkForUpdates(): Promise<{ needsUpdate: boolean, files: string[], orphaned: string[], remoteManifest: AssetManifest }> {
        const remote = await this.fetchRemoteManifest();
        const local = await this.getLocalManifest();

        if (!local) {
            // First run - need all files
            return { needsUpdate: true, files: Object.keys(remote.files), orphaned: [], remoteManifest: remote };
        }

        const filesToUpdate: string[] = [];
        const orphanedFiles: string[] = [];

        // Check for new/changed files AND verify they actually exist on disk
        for (const [path, meta] of Object.entries(remote.files)) {
            const storagePath = this.getStoragePath(path);
            const fileExists = await this.adapter.exists(storagePath);

            // Download if: file missing, not in local manifest, or hash changed
            if (!fileExists || !local.files[path] || local.files[path].hash !== meta.hash) {
                filesToUpdate.push(path);
            }
        }

        // Find orphaned files (in local manifest but not in remote)
        for (const path of Object.keys(local.files)) {
            if (!remote.files[path]) {
                orphanedFiles.push(path);
            }
        }

        return {
            needsUpdate: filesToUpdate.length > 0,
            files: filesToUpdate,
            orphaned: orphanedFiles,
            remoteManifest: remote
        };
    }

    /**
     * Delete ALL locally cached assets. Used when asset folder path changes.
     * Reads the local manifest to find files, then removes them all + the manifest itself.
     */
    async deleteAllAssets(): Promise<void> {
        const local = await this.getLocalManifest();
        if (!local) return;

        for (const path of Object.keys(local.files)) {
            const storagePath = this.getStoragePath(path);
            try {
                if (await this.adapter.exists(storagePath)) {
                    await this.adapter.remove(storagePath);
                }
            } catch (e) {
                console.warn(`[AssetService] Failed to delete ${storagePath}:`, e);
            }
        }

        // Remove the manifest itself
        const manifestPath = this.getStoragePath('manifest.json');
        try {
            if (await this.adapter.exists(manifestPath)) {
                await this.adapter.remove(manifestPath);
            }
        } catch (e) {
            console.warn('[AssetService] Failed to delete manifest:', e);
        }
    }

    /**
     * Remove files that are no longer in the remote manifest.
     * Prevents asset folder bloat when files are renamed/removed.
     */
    async cleanupOrphanedFiles(orphanedFiles: string[]): Promise<void> {
        for (const file of orphanedFiles) {
            const storagePath = this.getStoragePath(file);
            if (await this.adapter.exists(storagePath)) {
                await this.adapter.remove(storagePath);
            }
        }
    }

    /**
     * Download files with concurrency limit to avoid rate limits.
     * Writes the provided manifest after downloads complete to ensure detection works on reload.
     * IMPORTANT: Pass the same manifest from checkForUpdates() to avoid TOCTOU bugs.
     * 
     * Note: Manifest is written even if some files fail, so subsequent loads don't
     * re-trigger the first-run flow. Failed files will be retried on next update check.
     */
    async downloadAssets(
        files: string[],
        manifest: AssetManifest,
        onProgress?: (current: number, total: number, file: string) => void
    ): Promise<void> {
        const queue = [...files];
        const inFlight: Promise<void>[] = [];
        let completed = 0;
        const errors: string[] = [];

        while (queue.length > 0 || inFlight.length > 0) {
            // Fill up to max concurrent
            while (inFlight.length < this.maxConcurrent && queue.length > 0) {
                const file = queue.shift()!;
                const promise = this.downloadFileWithRetry(file)
                    .then(() => {
                        completed++;
                        onProgress?.(completed, files.length, file);
                    })
                    .catch((e) => {
                        errors.push(`${file}: ${e.message}`);
                    })
                    .finally(() => {
                        inFlight.splice(inFlight.indexOf(promise), 1);
                    });
                inFlight.push(promise);
            }

            // Wait for at least one to complete
            if (inFlight.length > 0) {
                await Promise.race(inFlight);
            }
        }

        // ALWAYS write the manifest so subsequent loads detect assets exist.
        // Failed files will be retried on the next update check.
        await this.adapter.write(
            this.getStoragePath('manifest.json'),
            JSON.stringify(manifest, null, 2)
        );

        // Report failures AFTER writing manifest
        if (errors.length > 0) {
            throw new Error(`Failed to download ${errors.length} file(s):\n${errors.join('\n')}`);
        }
    }

    /**
     * Get vault-relative path for file I/O operations.
     * Uses reject-on-suspicious approach for path traversal protection.
     */
    getStoragePath(relativePath: string): string {
        // Normalize backslashes to forward slashes
        const normalized = relativePath.replace(/\\/g, '/');

        // Reject anything suspicious rather than trying to sanitize
        if (normalized.includes('..') || normalized.startsWith('/')) {
            throw new Error(`Invalid asset path: ${relativePath}`);
        }

        return `${this.assetFolder}/${normalized}`;
    }

    /**
     * Get resource path for <img src> and inline CSS
     */
    getDisplayPath(relativePath: string): string {
        const storagePath = this.getStoragePath(relativePath);
        return this.adapter.getResourcePath(storagePath);
    }

    /**
     * Download a single file with retry and exponential backoff.
     * Uses requestUrl instead of fetch for mobile compatibility.
     */
    // Allowed file extensions for download
    private static readonly ALLOWED_EXTENSIONS = ['.png', '.gif', '.jpg', '.jpeg', '.webp'];

    private async downloadFileWithRetry(relativePath: string): Promise<void> {
        // Validate file extension
        const ext = relativePath.substring(relativePath.lastIndexOf('.')).toLowerCase();
        if (!AssetService.ALLOWED_EXTENSIONS.includes(ext)) {
            throw new Error(`Unsupported file type: ${ext}`);
        }

        const url = `${CDN_BASE}/${relativePath}?t=${Date.now()}`;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                // Use Obsidian's requestUrl - bypasses CORS, works on mobile
                // 15 second timeout prevents indefinite hangs
                const response = await requestUrl({ url, timeout: 15000 } as RequestUrlParamWithTimeout);

                if (response.status !== 200) {
                    throw new Error(`HTTP ${response.status}`);
                }

                // Validate Content-Type (reject error pages served as HTML)
                const contentType = response.headers?.['content-type'] ?? '';
                if (contentType && !contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
                    throw new Error(`Expected image, got ${contentType}`);
                }

                // VALIDATION: Ensure we actually got bytes (prevents silent corruption)
                if (!response.arrayBuffer || response.arrayBuffer.byteLength === 0) {
                    throw new Error('Received empty or invalid binary data');
                }

                // VALIDATION: Reject oversized files (prevents corrupted CDN responses)
                if (response.arrayBuffer.byteLength > MAX_FILE_SIZE) {
                    throw new Error(`File too large: ${(response.arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB (max 2MB)`);
                }

                const storagePath = this.getStoragePath(relativePath);

                // Ensure parent directory exists
                const dir = storagePath.substring(0, storagePath.lastIndexOf('/'));
                if (!(await this.adapter.exists(dir))) {
                    await this.vault.createFolder(dir);
                }

                await this.adapter.writeBinary(storagePath, response.arrayBuffer);
                return; // Success!

            } catch (e) {
                lastError = e as Error;

                // Exponential backoff before retry
                if (attempt < MAX_RETRIES - 1) {
                    const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
                    await this.sleep(delay);
                }
            }
        }

        throw new Error(`Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
    }

    private async fetchRemoteManifest(): Promise<AssetManifest> {
        const response = await requestUrl({ url: `${CDN_BASE}/manifest.json?t=${Date.now()}`, timeout: 15000 } as RequestUrlParamWithTimeout);
        // Sanity guard: reject unexpectedly large responses (corrupted CDN, error pages)
        if (response.text.length > 1_000_000) {
            throw new Error('Manifest too large — possible CDN error');
        }
        // Use response.text directly with safeJsonParse
        return safeJsonParse<AssetManifest>(response.text);
    }

    private async getLocalManifest(): Promise<AssetManifest | null> {
        const path = this.getStoragePath('manifest.json');
        if (!(await this.adapter.exists(path))) return null;
        const content = await this.adapter.read(path);
        // Use safeJsonParse to prevent prototype pollution
        return safeJsonParse<AssetManifest>(content);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export interface AssetManifest {
    version: string;
    lastUpdated: string;
    files: Record<string, { hash: string; size: number }>;
}
