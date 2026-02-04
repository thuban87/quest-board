/**
 * Folder Watch Service
 * 
 * Watches designated folders for new file creation and automatically
 * generates quests from templates when files are added.
 * 
 * Supports two quest types:
 * - daily-quest: Auto-linked to Daily Notes folder
 * - watched-folder: Generic folder watcher for any folder
 */

import { Vault, TFile, Notice, normalizePath } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { QUEST_SCHEMA_VERSION } from '../models/Quest';
import { QuestPriority } from '../models/QuestStatus';

/**
 * Archive mode options for watched folder quests
 */
export type ArchiveMode =
    | 'none'           // No auto-archive (manual only)
    | 'on-new-file'    // Archive when new file created in watched folder
    | 'after-duration' // Archive after X hours
    | 'at-time'        // Archive at specific time daily
    | 'at-datetime';   // Archive at specific date/time

/**
 * Naming mode for quest generation
 */
export type QuestNamingMode = 'filename' | 'custom';

/**
 * Configuration for a watched folder
 */
export interface WatchedFolderConfig {
    /** Unique identifier for this config */
    id: string;

    /** Path to the source template file */
    templatePath: string;

    /** Folder to watch for new files */
    watchFolder: string;

    /** Quest type: 'daily-quest' or 'watched-folder' */
    questType: 'daily-quest' | 'watched-folder';

    /** How to name generated quests */
    namingMode: QuestNamingMode;

    /** Custom naming pattern (if namingMode is 'custom') */
    customNamingPattern?: string;  // e.g., "Daily Quest - {{date}}"

    /** Quest category */
    category: string;

    /** Quest priority */
    priority: QuestPriority;

    /** XP per task */
    xpPerTask: number;

    /** Completion bonus XP */
    completionBonus: number;

    /** Archive mode */
    archiveMode: ArchiveMode;

    /** Hours for 'after-duration' mode */
    archiveDurationHours?: number;

    /** Time for 'at-time' mode (HH:MM format) */
    archiveTime?: string;

    /** ISO datetime for 'at-datetime' mode */
    archiveDatetime?: string;

    /** Custom archive path (null/empty = use default from settings) */
    archivePath?: string;

    /** Whether this watcher is enabled */
    enabled: boolean;

    /** Track the current active quest path for 'on-new-file' archiving */
    currentQuestPath?: string;
}

/**
 * Service for watching folders and generating quests from templates
 */
export class FolderWatchService {
    private vault: Vault;
    private plugin: QuestBoardPlugin;
    private unsubscribers: Map<string, () => void> = new Map();
    private archiveTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

    constructor(vault: Vault, plugin: QuestBoardPlugin) {
        this.vault = vault;
        this.plugin = plugin;
    }

    /**
     * Initialize the service - validate and set up all watchers from settings
     */
    async initialize(): Promise<void> {
        // First, clean up orphaned configs (templates that were deleted)
        await this.validateConfigs();

        const configs = this.plugin.settings.watchedFolderConfigs || [];

        for (const config of configs) {
            if (config.enabled) {
                await this.startWatching(config);
            }
        }

        console.log(`[FolderWatchService] Initialized with ${configs.filter(c => c.enabled).length} active watchers`);
    }

    /**
     * Validate configs - remove any that reference deleted templates
     */
    async validateConfigs(): Promise<void> {
        const configs = this.plugin.settings.watchedFolderConfigs || [];
        if (configs.length === 0) return;

        const validConfigs: WatchedFolderConfig[] = [];
        let removedCount = 0;

        for (const config of configs) {
            // Check if template file still exists
            const templateFile = this.vault.getAbstractFileByPath(config.templatePath);
            if (templateFile instanceof TFile) {
                validConfigs.push(config);
            } else {
                console.log(`[FolderWatchService] Removing orphaned config for deleted template: ${config.templatePath}`);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            this.plugin.settings.watchedFolderConfigs = validConfigs;
            await this.plugin.saveSettings();
            console.log(`[FolderWatchService] Cleaned up ${removedCount} orphaned watcher configs`);
        }
    }

    /**
     * Clear all watcher configs (for debugging/reset)
     */
    async clearAllConfigs(): Promise<void> {
        // Stop all watchers
        for (const [id] of this.unsubscribers) {
            this.stopWatching(id);
        }

        // Clear settings
        this.plugin.settings.watchedFolderConfigs = [];
        await this.plugin.saveSettings();

        console.log('[FolderWatchService] Cleared all watcher configs');
    }

    /**
     * Start watching a folder based on config
     */
    async startWatching(config: WatchedFolderConfig): Promise<void> {
        // Clean up existing watcher if present
        this.stopWatching(config.id);

        if (!config.enabled) return;

        const watchPath = normalizePath(config.watchFolder);
        const isRootFolder = watchPath === '' || watchPath === '/';

        // Track pending file creations (for debounce)
        const pendingFiles = new Map<string, ReturnType<typeof setTimeout>>();

        /**
         * Check if a file is directly in the watched folder (not subfolders)
         */
        const isDirectChild = (filePath: string): boolean => {
            if (isRootFolder) {
                // Root folder: file should have no slashes
                return !filePath.includes('/');
            }
            // Non-root: file should start with watchPath/ and have no additional slashes
            if (!filePath.startsWith(watchPath + '/')) return false;
            const relativePath = filePath.substring(watchPath.length + 1);
            return !relativePath.includes('/');
        };

        /**
         * Process file after debounce - generate quest if file is valid
         */
        const processFile = async (file: TFile) => {
            pendingFiles.delete(file.path);

            // Skip if file was renamed to something different or deleted
            const currentFile = this.vault.getAbstractFileByPath(file.path);
            if (!currentFile || !(currentFile instanceof TFile)) return;

            // Skip "Untitled" files - user hasn't finished naming
            if (currentFile.basename.toLowerCase().startsWith('untitled')) {
                console.log(`[FolderWatchService] Skipping "Untitled" file, waiting for rename: ${file.path}`);
                return;
            }

            console.log(`[FolderWatchService] Processing file after debounce: ${currentFile.path}`);

            // Archive previous quest if mode is 'on-new-file'
            if (config.archiveMode === 'on-new-file' && config.currentQuestPath) {
                await this.archiveQuest(config);
            }

            // Generate new quest
            await this.generateQuestFromTemplate(config, currentFile);
        };

        // Set up file creation listener with debounce
        const onCreateRef = this.vault.on('create', async (file) => {
            if (!(file instanceof TFile)) return;
            if (!isDirectChild(file.path)) return;
            if (file.extension !== 'md') return;

            console.log(`[FolderWatchService] New file detected: ${file.path}, starting debounce...`);

            // Clear existing timer for this file
            const existingTimer = pendingFiles.get(file.path);
            if (existingTimer) clearTimeout(existingTimer);

            // Set debounce timer (2 seconds to allow for renaming)
            const timer = setTimeout(() => processFile(file), 2000);
            pendingFiles.set(file.path, timer);
        });

        // Set up rename listener to catch "Untitled" -> real name
        const onRenameRef = this.vault.on('rename', async (file, oldPath) => {
            if (!(file instanceof TFile)) return;
            if (!isDirectChild(file.path)) return;
            if (file.extension !== 'md') return;

            // If this was a pending "Untitled" file, process with new name
            if (oldPath.toLowerCase().includes('untitled') && !file.basename.toLowerCase().startsWith('untitled')) {
                // Clear any pending timer for old path
                const oldTimer = pendingFiles.get(oldPath);
                if (oldTimer) {
                    clearTimeout(oldTimer);
                    pendingFiles.delete(oldPath);
                }

                console.log(`[FolderWatchService] File renamed from Untitled: ${oldPath} -> ${file.path}`);

                // Process immediately since user has finalized name
                await processFile(file);
            }
        });

        this.unsubscribers.set(config.id, () => {
            this.vault.offref(onCreateRef);
            this.vault.offref(onRenameRef);
            // Clear any pending timers
            for (const timer of pendingFiles.values()) {
                clearTimeout(timer);
            }
        });

        // Set up archive timer if needed
        this.scheduleArchive(config);

        console.log(`[FolderWatchService] Started watching: ${watchPath || '(root)'}`);
    }

    /**
     * Stop watching a folder
     */
    stopWatching(configId: string): void {
        const unsubscribe = this.unsubscribers.get(configId);
        if (unsubscribe) {
            unsubscribe();
            this.unsubscribers.delete(configId);
        }

        const timer = this.archiveTimers.get(configId);
        if (timer) {
            clearTimeout(timer);
            this.archiveTimers.delete(configId);
        }
    }

    /**
     * Generate a quest file from template when a new file is created
     */
    async generateQuestFromTemplate(config: WatchedFolderConfig, sourceFile: TFile): Promise<void> {
        try {
            // Generate quest name based on naming mode
            const questName = this.generateQuestName(config, sourceFile);
            const questId = this.toSlug(questName) + '-' + Date.now();

            // Build output path
            const questFolder = `${this.plugin.settings.storageFolder}/quests/main`;
            const fileName = `${this.sanitizeFileName(questName)}.md`;
            const outputPath = normalizePath(`${questFolder}/${fileName}`);

            // Ensure folder exists
            await this.ensureFolderExists(questFolder);

            // Check if quest already exists for this file
            const existingQuest = await this.findQuestForLinkedFile(sourceFile.path);
            if (existingQuest) {
                console.log(`[FolderWatchService] Quest already exists for ${sourceFile.path}, skipping`);
                return;
            }

            // Build frontmatter
            const now = new Date();
            const frontmatter = `---
schemaVersion: ${QUEST_SCHEMA_VERSION}
questId: "${questId}"
questName: "${questName}"
questType: main
category: ${config.category || 'daily'}
status: available
priority: ${config.priority || 'medium'}
tags:
  - auto-generated
  - ${config.questType}
createdDate: ${now.toISOString()}
completedDate: null
linkedTaskFile: "${sourceFile.path}"
xpPerTask: ${config.xpPerTask || 5}
completionBonus: ${config.completionBonus || 15}
visibleTasks: 4
---`;

            // Combine frontmatter with minimal body
            const content = `${frontmatter}

# ${questName}

> This quest was auto-generated from: [[${sourceFile.basename}]]

`;

            // Create the quest file
            await this.vault.create(outputPath, content);

            // Update config with current quest path
            config.currentQuestPath = outputPath;
            await this.saveConfigUpdate(config);

            new Notice(`📜 Created quest: ${questName}`);
            console.log(`[FolderWatchService] Created quest: ${outputPath}`);

        } catch (error) {
            console.error('[FolderWatchService] Failed to generate quest:', error);

            // Show notice with retry option
            const notice = new Notice(`❌ Failed to create quest. Click to retry.`, 10000);
            notice.noticeEl.addEventListener('click', () => {
                this.generateQuestFromTemplate(config, sourceFile);
            });
        }
    }

    /**
     * Generate quest name based on config and source file
     */
    private generateQuestName(config: WatchedFolderConfig, sourceFile: TFile): string {
        if (config.namingMode === 'filename') {
            return sourceFile.basename;
        }

        // Custom pattern - replace placeholders
        let name = config.customNamingPattern || 'Quest - {{filename}}';
        const now = new Date();

        name = name.replace(/\{\{filename\}\}/gi, sourceFile.basename);
        name = name.replace(/\{\{date\}\}/gi, this.formatDate(now));
        name = name.replace(/\{\{date_slug\}\}/gi, this.formatDate(now).replace(/-/g, ''));

        return name;
    }

    /**
     * Schedule archive based on config mode
     */
    private scheduleArchive(config: WatchedFolderConfig): void {
        // Clear existing timer
        const existingTimer = this.archiveTimers.get(config.id);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        if (config.archiveMode === 'none' || config.archiveMode === 'on-new-file') {
            return; // No timer needed
        }

        let delayMs: number | null = null;

        if (config.archiveMode === 'after-duration' && config.archiveDurationHours) {
            delayMs = config.archiveDurationHours * 60 * 60 * 1000;
        } else if (config.archiveMode === 'at-time' && config.archiveTime) {
            delayMs = this.getDelayUntilTime(config.archiveTime);
        } else if (config.archiveMode === 'at-datetime' && config.archiveDatetime) {
            const targetTime = new Date(config.archiveDatetime).getTime();
            delayMs = targetTime - Date.now();
            if (delayMs < 0) delayMs = null; // Already passed
        }

        if (delayMs && delayMs > 0) {
            const timer = setTimeout(async () => {
                await this.archiveQuest(config);

                // Reschedule for 'at-time' mode (daily)
                if (config.archiveMode === 'at-time') {
                    this.scheduleArchive(config);
                }
            }, delayMs);

            this.archiveTimers.set(config.id, timer);
        }
    }

    /**
     * Archive the current quest for a config
     */
    async archiveQuest(config: WatchedFolderConfig): Promise<void> {
        if (!config.currentQuestPath) return;

        const file = this.vault.getAbstractFileByPath(config.currentQuestPath);
        if (!(file instanceof TFile)) {
            config.currentQuestPath = undefined;
            await this.saveConfigUpdate(config);
            return;
        }

        try {
            // Determine archive path
            const archiveFolder = config.archivePath || this.plugin.settings.archiveFolder;
            const now = new Date();
            const monthFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const fullArchivePath = normalizePath(`${archiveFolder}/${monthFolder}`);

            await this.ensureFolderExists(fullArchivePath);

            const newPath = normalizePath(`${fullArchivePath}/${file.name}`);
            await this.vault.rename(file, newPath);

            config.currentQuestPath = undefined;
            await this.saveConfigUpdate(config);

            console.log(`[FolderWatchService] Archived quest to: ${newPath}`);
        } catch (error) {
            console.error('[FolderWatchService] Failed to archive quest:', error);
        }
    }

    /**
     * Find an existing quest that links to a given file
     */
    private async findQuestForLinkedFile(filePath: string): Promise<TFile | null> {
        const questFolder = `${this.plugin.settings.storageFolder}/quests`;
        const folder = this.vault.getAbstractFileByPath(questFolder);

        if (!folder) return null;

        const files = this.vault.getMarkdownFiles().filter(f => f.path.startsWith(questFolder));

        for (const file of files) {
            const content = await this.vault.cachedRead(file);
            if (content.includes(`linkedTaskFile: "${filePath}"`)) {
                return file;
            }
        }

        return null;
    }

    /**
     * Save config update back to settings
     */
    private async saveConfigUpdate(config: WatchedFolderConfig): Promise<void> {
        const configs = this.plugin.settings.watchedFolderConfigs || [];
        const index = configs.findIndex(c => c.id === config.id);

        if (index >= 0) {
            configs[index] = config;
            this.plugin.settings.watchedFolderConfigs = configs;
            await this.plugin.saveSettings();
        }
    }

    /**
     * Calculate delay until a specific time today (or tomorrow if already passed)
     */
    private getDelayUntilTime(timeStr: string): number {
        const [hours, minutes] = timeStr.split(':').map(n => parseInt(n, 10));
        const now = new Date();
        const target = new Date(now);
        target.setHours(hours, minutes, 0, 0);

        if (target <= now) {
            // Already passed today, schedule for tomorrow
            target.setDate(target.getDate() + 1);
        }

        return target.getTime() - now.getTime();
    }

    /**
     * Ensure a folder exists, creating it if necessary
     */
    private async ensureFolderExists(folderPath: string): Promise<void> {
        const normalized = normalizePath(folderPath);
        const folder = this.vault.getAbstractFileByPath(normalized);

        if (!folder) {
            await this.vault.createFolder(normalized);
        }
    }

    /**
     * Format date as YYYY-MM-DD
     */
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Convert string to slug
     */
    private toSlug(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Sanitize filename
     */
    private sanitizeFileName(name: string): string {
        return name.replace(/[<>:"/\\|?*]/g, '');
    }

    /**
     * Add a new watched folder configuration
     */
    async addConfig(config: WatchedFolderConfig): Promise<void> {
        const configs = this.plugin.settings.watchedFolderConfigs || [];
        configs.push(config);
        this.plugin.settings.watchedFolderConfigs = configs;
        await this.plugin.saveSettings();

        if (config.enabled) {
            await this.startWatching(config);
        }
    }

    /**
     * Update an existing configuration
     */
    async updateConfig(config: WatchedFolderConfig): Promise<void> {
        await this.saveConfigUpdate(config);

        // Restart watcher with new config
        this.stopWatching(config.id);
        if (config.enabled) {
            await this.startWatching(config);
        }
    }

    /**
     * Remove a configuration
     */
    async removeConfig(configId: string): Promise<void> {
        this.stopWatching(configId);

        const configs = this.plugin.settings.watchedFolderConfigs || [];
        const filtered = configs.filter(c => c.id !== configId);
        this.plugin.settings.watchedFolderConfigs = filtered;
        await this.plugin.saveSettings();
    }

    /**
     * Get all configurations
     */
    getConfigs(): WatchedFolderConfig[] {
        return this.plugin.settings.watchedFolderConfigs || [];
    }

    /**
     * Generate a unique ID for a new config
     */
    generateConfigId(): string {
        return `watch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Cleanup - stop all watchers
     */
    cleanup(): void {
        for (const [id] of this.unsubscribers) {
            this.stopWatching(id);
        }
        console.log('[FolderWatchService] Cleaned up all watchers');
    }
}
