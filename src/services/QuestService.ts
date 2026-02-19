/**
 * Quest Service
 * 
 * Loads and saves quests from vault folder.
 * Handles both manual (markdown) and AI-generated (JSON) quests.
 */

import { App, Vault, TFile, TFolder, debounce } from 'obsidian';
import { Quest, ManualQuest, AIGeneratedQuest, isAIGeneratedQuest, QUEST_SCHEMA_VERSION } from '../models/Quest';
import { QuestType, QuestStatus, QuestPriority, QuestDifficulty } from '../models/QuestStatus';
import { validateQuest, validateQuestWithNotice } from '../utils/validator';
import { safeJsonParse, safeJsonStringify } from '../utils/safeJson';
import { ensureFolderExists } from '../utils/pathValidator';
import { ColumnConfigService } from './ColumnConfigService';
import type { QuestBoardSettings } from '../settings';

/**
 * Quest folder structure
 */
const QUEST_FOLDERS = {
    main: 'quests/main',
    training: 'quests/training',
    side: 'quests/side',
    aiGenerated: 'quests/ai-generated',
    recurring: 'quests/recurring',
};

/**
 * Sanitize a quest ID for safe use in file paths.
 * Strips or replaces dangerous characters to prevent path traversal.
 */
export function sanitizeQuestId(questId: string): string {
    // Remove any path traversal attempts
    let safe = questId.replace(/\.\./g, '');
    // Remove leading/trailing slashes and backslashes
    safe = safe.replace(/^[/\\]+|[/\\]+$/g, '');
    // Replace any remaining slashes/backslashes with dashes
    safe = safe.replace(/[/\\]/g, '-');
    // Only allow alphanumeric, dashes, underscores, and spaces
    safe = safe.replace(/[^a-zA-Z0-9\-_ ]/g, '');
    // Trim and ensure not empty
    safe = safe.trim();
    if (!safe) {
        safe = 'quest-' + Date.now();
    }
    return safe;
}

/**
 * Load result
 */
export interface QuestLoadResult {
    quests: Quest[];
    errors: string[];
    loadedAt: number;
}

/**
 * Single quest load result for granular updates
 */
export interface SingleQuestResult {
    quest: Quest | null;
    questId: string | null;
    filePath: string;
    error?: string;
}

/**
 * Parse quest frontmatter from markdown file
 * Expects YAML frontmatter between --- markers
 */
function parseQuestFrontmatter(content: string, filePath: string): Partial<ManualQuest> | null {
    // Handle both Unix (\n) and Windows (\r\n) line endings
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];
    const quest: Partial<ManualQuest> = {};

    // Parse YAML-like frontmatter (handles key: value and YAML arrays)
    const lines = frontmatter.split(/\r?\n/);
    let currentArrayKey: string | null = null;
    let currentArray: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this is an array item (starts with "  - " or "- ")
        const arrayItemMatch = line.match(/^\s*-\s+(.+)$/);
        if (arrayItemMatch && currentArrayKey) {
            let itemValue = arrayItemMatch[1].trim();
            // Remove quotes if present
            if ((itemValue.startsWith('"') && itemValue.endsWith('"')) ||
                (itemValue.startsWith("'") && itemValue.endsWith("'"))) {
                itemValue = itemValue.slice(1, -1);
            }
            currentArray.push(itemValue);
            continue;
        }

        // If we were building an array and hit a non-array line, save it
        if (currentArrayKey && currentArray.length > 0) {
            if (currentArrayKey === 'tags') {
                quest.tags = currentArray;
            } else if (currentArrayKey === 'linkedTaskFiles') {
                quest.linkedTaskFiles = currentArray;
            }
            currentArrayKey = null;
            currentArray = [];
        }

        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // Check if this is the start of an array (empty value after colon)
        if (value === '' && (key === 'tags' || key === 'linkedTaskFiles')) {
            currentArrayKey = key;
            currentArray = [];
            continue;
        }

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        switch (key) {
            case 'questId':
                quest.questId = value;
                break;
            case 'questName':
                quest.questName = value;
                break;
            case 'questType':
                // Accept any questType value (supports dynamic folder names)
                if (value) {
                    quest.questType = value as QuestType;
                }
                break;
            case 'category':
                quest.category = value;
                break;
            case 'status':
                // Accept any status string (supports custom columns)
                quest.status = value;
                break;
            case 'priority':
                quest.priority = value as QuestPriority;
                break;
            case 'linkedTaskFile':
                quest.linkedTaskFile = value;
                break;
            case 'xpPerTask':
                quest.xpPerTask = parseInt(value) || 5;
                break;
            case 'completionBonus':
                quest.completionBonus = parseInt(value) || 30;
                break;
            case 'visibleTasks':
                quest.visibleTasks = parseInt(value) || 4;
                break;
            case 'tags':
                // Parse comma-separated tags (inline format)
                if (value) {
                    quest.tags = value.split(',').map(t => t.trim()).filter(t => t);
                }
                break;
            case 'createdDate':
                quest.createdDate = value;
                break;
            case 'completedDate':
                quest.completedDate = value || null;
                break;
            case 'schemaVersion':
                quest.schemaVersion = parseInt(value) || QUEST_SCHEMA_VERSION;
                break;
            case 'recurrence':
                if (['daily', 'weekdays', 'weekends', 'weekly', 'monthly'].includes(value)) {
                    quest.recurrence = value as ManualQuest['recurrence'];
                }
                break;
            case 'recurringTemplateId':
                quest.recurringTemplateId = value;
                break;
            case 'instanceDate':
                quest.instanceDate = value;
                break;
            case 'sortOrder':
                quest.sortOrder = parseInt(value);
                break;
        }
    }

    // Handle array at end of frontmatter
    if (currentArrayKey && currentArray.length > 0) {
        if (currentArrayKey === 'tags') {
            quest.tags = currentArray;
        } else if (currentArrayKey === 'linkedTaskFiles') {
            quest.linkedTaskFiles = currentArray;
        }
    }

    return quest;
}

/**
 * Load a single markdown quest file
 */
async function loadMarkdownQuest(
    vault: Vault,
    file: TFile,
    settings?: QuestBoardSettings
): Promise<Quest | null> {
    try {
        const content = await vault.cachedRead(file);
        const parsed = parseQuestFrontmatter(content, file.path);

        if (!parsed) {
            console.warn(`[QuestService] No frontmatter in: ${file.path}`);
            return null;
        }

        // Infer questType from folder path if not in frontmatter
        // Path format: basefolder/quests/{Type}/questfile.md
        let inferredType = parsed.questType;
        if (!inferredType) {
            const pathParts = file.path.split('/');
            // Find 'quests' in path and get the next folder name
            const questsIndex = pathParts.findIndex(p => p.toLowerCase() === 'quests');
            if (questsIndex >= 0 && questsIndex + 1 < pathParts.length - 1) {
                // The folder after 'quests' is the type (capitalize first letter)
                const folderName = pathParts[questsIndex + 1];
                inferredType = folderName.charAt(0).toUpperCase() + folderName.slice(1).toLowerCase();
            } else {
                inferredType = 'Main'; // Default fallback
            }
        }

        // Resolve status to valid column (handles invalid/legacy statuses)
        const rawStatus = parsed.status || 'available';
        let resolvedStatus = rawStatus;
        if (settings) {
            const columnService = new ColumnConfigService(settings);
            resolvedStatus = columnService.resolveStatus(rawStatus);
        } else {
            resolvedStatus = parsed.status || QuestStatus.AVAILABLE;
        }

        const quest: Partial<ManualQuest> = {
            // Spread parsed first, then override with explicit values
            ...parsed,
            schemaVersion: QUEST_SCHEMA_VERSION,
            questId: parsed.questId || file.basename,
            questName: parsed.questName || file.basename,
            questType: inferredType,
            category: parsed.category || 'general',
            status: resolvedStatus,  // MUST come after ...parsed to override raw status
            priority: parsed.priority || QuestPriority.MEDIUM,
            tags: parsed.tags || [],
            createdDate: parsed.createdDate || new Date().toISOString(),
            completedDate: parsed.completedDate || null,
            timeline: [],
            notes: '',
            linkedTaskFile: parsed.linkedTaskFile || file.path, // Default to self
            xpPerTask: parsed.xpPerTask || 5,
            completionBonus: parsed.completionBonus || 30,
            visibleTasks: parsed.visibleTasks || 4,
            milestones: [],
            sortOrder: parsed.sortOrder,  // Preserve sortOrder if present
        };

        // Validate
        const result = validateQuest(quest);
        if (!result.valid) {
            console.warn(`[QuestService] Invalid quest in ${file.path}:`, result.errors);
            return null;
        }

        // Add file paths for set detection and save operations
        if (result.data) {
            result.data.path = file.path;
            result.data.filePath = file.path;
        }

        return result.data;
    } catch (error) {
        console.error(`[QuestService] Failed to load ${file.path}:`, error);
        return null;
    }
}

/**
 * Load a single JSON quest file (AI-generated)
 */
async function loadJsonQuest(
    vault: Vault,
    file: TFile
): Promise<Quest | null> {
    try {
        const content = await vault.cachedRead(file);
        const parsed = safeJsonParse<AIGeneratedQuest>(content);

        // Validate
        const result = validateQuest(parsed);
        if (!result.valid) {
            console.warn(`[QuestService] Invalid quest in ${file.path}:`, result.errors);
            return null;
        }

        // Add file paths for set detection and save operations
        if (result.data) {
            result.data.path = file.path;
            result.data.filePath = file.path;
        }

        return result.data;
    } catch (error) {
        console.error(`[QuestService] Failed to load ${file.path}:`, error);
        return null;
    }
}

/**
 * Load all quests from a folder
 */
async function loadQuestsFromFolder(
    vault: Vault,
    folderPath: string,
    settings?: QuestBoardSettings
): Promise<Quest[]> {
    const folder = vault.getAbstractFileByPath(folderPath);
    if (!folder || !(folder instanceof TFolder)) {
        return [];
    }

    const quests: Quest[] = [];

    for (const file of folder.children) {
        if (!(file instanceof TFile)) continue;

        let quest: Quest | null = null;

        if (file.extension === 'md') {
            quest = await loadMarkdownQuest(vault, file, settings);
        } else if (file.extension === 'json') {
            quest = await loadJsonQuest(vault, file);
        }

        if (quest) {
            quests.push(quest);
        }
    }

    return quests;
}

/**
 * Load all quests from the quest storage folder.
 * Dynamically scans ALL subfolders in the quests directory.
 */
export async function loadAllQuests(
    vault: Vault,
    baseFolder: string,
    settings?: QuestBoardSettings
): Promise<QuestLoadResult> {
    const errors: string[] = [];
    const allQuests: Quest[] = [];

    // Get the quests folder
    const questsPath = `${baseFolder}/quests`;
    const questsFolder = vault.getAbstractFileByPath(questsPath);

    if (questsFolder instanceof TFolder) {
        // Dynamically scan ALL subfolders in the quests directory
        for (const child of questsFolder.children) {
            if (child instanceof TFolder) {
                const folderName = child.name.toLowerCase();

                // Skip archive folder
                if (folderName === 'archive') {
                    continue;
                }

                try {
                    const quests = await loadQuestsFromFolder(vault, child.path, settings);
                    allQuests.push(...quests);
                } catch (error) {
                    errors.push(`Failed to load from ${child.path}: ${error}`);
                }
            }
        }
    } else {
        // Fallback: Try the hardcoded folders for backward compatibility
        for (const subFolder of Object.values(QUEST_FOLDERS)) {
            const fullPath = `${baseFolder}/${subFolder}`;
            try {
                const quests = await loadQuestsFromFolder(vault, fullPath, settings);
                allQuests.push(...quests);
            } catch (error) {
                errors.push(`Failed to load from ${fullPath}: ${error}`);
            }
        }
    }

    // Also load from the base folder directly (for simple setups)
    try {
        const baseQuests = await loadQuestsFromFolder(vault, baseFolder, settings);
        allQuests.push(...baseQuests);
    } catch (error) {
        // Base folder might not have quests directly, that's okay
    }

    return {
        quests: allQuests,
        errors,
        loadedAt: Date.now(),
    };
}

/**
 * Load a single quest from a file path.
 * Used for granular updates instead of reloading all quests.
 */
export async function loadSingleQuest(
    vault: Vault,
    filePath: string,
    settings?: QuestBoardSettings
): Promise<SingleQuestResult> {
    const file = vault.getAbstractFileByPath(filePath);

    if (!file || !(file instanceof TFile)) {
        return {
            quest: null,
            questId: null,
            filePath,
            error: 'File not found',
        };
    }

    let quest: Quest | null = null;

    if (file.extension === 'md') {
        quest = await loadMarkdownQuest(vault, file, settings);
    } else if (file.extension === 'json') {
        quest = await loadJsonQuest(vault, file);
    }

    return {
        quest,
        questId: quest?.questId || null,
        filePath,
    };
}

/**
 * Ensure quest folder structure exists
 */
export async function ensureQuestFolders(
    vault: Vault,
    baseFolder: string
): Promise<void> {
    await ensureFolderExists(vault, baseFolder);

    for (const subFolder of Object.values(QUEST_FOLDERS)) {
        await ensureFolderExists(vault, `${baseFolder}/${subFolder}`);
    }
}

/**
 * Generate frontmatter for a manual quest
 */
function generateQuestFrontmatter(quest: ManualQuest): string {
    const lines = [
        '---',
        `schemaVersion: ${quest.schemaVersion}`,
        `questId: "${quest.questId}"`,
        `questName: "${quest.questName}"`,
        `questType: ${quest.questType}`,
        `category: "${quest.category}"`,
        `status: ${quest.status}`,
        `priority: ${quest.priority}`,
        `linkedTaskFile: "${quest.linkedTaskFile}"`,
        `xpPerTask: ${quest.xpPerTask}`,
        `completionBonus: ${quest.completionBonus}`,
        `visibleTasks: ${quest.visibleTasks}`,
    ];

    // Add sortOrder if set (for custom ordering within columns)
    if (quest.sortOrder !== undefined) {
        lines.push(`sortOrder: ${quest.sortOrder}`);
    }

    // NOTE: Tags are NOT written to frontmatter - user has another plugin for tag management

    lines.push(`createdDate: "${quest.createdDate}"`);

    if (quest.completedDate) {
        lines.push(`completedDate: "${quest.completedDate}"`);
    }

    lines.push('---');

    return lines.join('\n');
}

/**
 * Save a manual quest to file
 * 
 * For EXISTING files: Does SURGICAL updates to frontmatter only.
 * Parses the existing frontmatter, updates only changed fields in-place,
 * and leaves the rest of the file completely untouched.
 * 
 * For NEW files: Creates with standard structure.
 */
export async function saveManualQuest(
    app: App,
    vault: Vault,
    baseFolder: string,
    quest: ManualQuest
): Promise<boolean> {
    try {
        const safeQuestId = sanitizeQuestId(quest.questId);

        // Use existing filePath if available (preserves archive location)
        // Otherwise compute default path based on quest type
        const defaultSubFolder = `quests/${quest.questType.toLowerCase()}`;
        const defaultFolderPath = `${baseFolder}/${defaultSubFolder}`;
        const defaultFilePath = `${defaultFolderPath}/${safeQuestId}.md`;
        const filePath = quest.filePath ?? defaultFilePath;

        // Ensure the target folder exists
        const targetFolder = filePath.substring(0, filePath.lastIndexOf('/'));
        await ensureFolderExists(vault, targetFolder);

        const existingFile = vault.getAbstractFileByPath(filePath);

        if (existingFile instanceof TFile) {
            // SURGICAL UPDATE: Only modify specific frontmatter fields
            await app.fileManager.processFrontMatter(existingFile, (fm) => {
                fm.status = quest.status;
                if (quest.completedDate) {
                    fm.completedDate = quest.completedDate;
                } else {
                    delete fm.completedDate;
                }
            });
        } else {
            // New file - create with full structure
            const frontmatter = generateQuestFrontmatter(quest);
            const content = `${frontmatter}\n\n# ${quest.questName}\n\n${quest.notes || ''}`;
            await vault.create(filePath, content);
        }

        return true;
    } catch (error) {
        console.error('[QuestService] Failed to save quest:', error);
        return false;
    }
}



/**
 * Update just the sortOrder field for a quest.
 * Used for intra-column drag reordering.
 */
export async function updateQuestSortOrder(
    app: App,
    vault: Vault,
    baseFolder: string,
    questId: string,
    sortOrder: number
): Promise<boolean> {
    try {
        const safeQuestId = sanitizeQuestId(questId);

        // Search in all subfolders to find the quest file
        for (const subFolder of Object.values(QUEST_FOLDERS)) {
            const filePath = `${baseFolder}/${subFolder}/${safeQuestId}.md`;
            const file = vault.getAbstractFileByPath(filePath);

            if (file instanceof TFile) {
                await app.fileManager.processFrontMatter(file, (fm) => {
                    fm.sortOrder = sortOrder;
                });
                return true;
            }
        }

        // Also check base folder
        const basePath = `${baseFolder}/${safeQuestId}.md`;
        const baseFile = vault.getAbstractFileByPath(basePath);
        if (baseFile instanceof TFile) {
            await app.fileManager.processFrontMatter(baseFile, (fm) => {
                fm.sortOrder = sortOrder;
            });
            return true;
        }

        console.warn(`[QuestService] Quest file not found for sortOrder update: ${questId}`);
        return false;
    } catch (error) {
        console.error('[QuestService] Failed to update sortOrder:', error);
        return false;
    }
}

/**
 * Save an AI-generated quest to file
 */
export async function saveAIQuest(
    vault: Vault,
    baseFolder: string,
    quest: AIGeneratedQuest
): Promise<boolean> {
    try {
        const safeQuestId = sanitizeQuestId(quest.questId);

        // Use existing filePath if available (preserves archive location)
        // Otherwise compute default path for AI-generated quests
        const defaultFolderPath = `${baseFolder}/${QUEST_FOLDERS.aiGenerated}`;
        const defaultFilePath = `${defaultFolderPath}/${safeQuestId}.json`;
        const filePath = quest.filePath ?? defaultFilePath;

        // Ensure the target folder exists
        const targetFolder = filePath.substring(0, filePath.lastIndexOf('/'));
        await ensureFolderExists(vault, targetFolder);

        const content = safeJsonStringify(quest);

        const existingFile = vault.getAbstractFileByPath(filePath);
        if (existingFile instanceof TFile) {
            await vault.modify(existingFile, content);
        } else {
            await vault.create(filePath, content);
        }

        return true;
    } catch (error) {
        console.error('[QuestService] Failed to save AI quest:', error);
        return false;
    }
}

/**
 * Delete a quest file
 */
export async function deleteQuestFile(
    vault: Vault,
    baseFolder: string,
    questId: string,
    isAIGenerated: boolean
): Promise<boolean> {
    try {
        const extension = isAIGenerated ? 'json' : 'md';

        // Search in all subfolders
        for (const subFolder of Object.values(QUEST_FOLDERS)) {
            const filePath = `${baseFolder}/${subFolder}/${questId}.${extension}`;
            const file = vault.getAbstractFileByPath(filePath);

            if (file instanceof TFile) {
                await vault.delete(file);
                return true;
            }
        }

        // Also check base folder
        const basePath = `${baseFolder}/${questId}.${extension}`;
        const baseFile = vault.getAbstractFileByPath(basePath);
        if (baseFile instanceof TFile) {
            await vault.delete(baseFile);
            return true;
        }

        console.warn(`[QuestService] Quest file not found: ${questId}`);
        return false;
    } catch (error) {
        console.error('[QuestService] Failed to delete quest:', error);
        return false;
    }
}

/**
 * Optional body sections when creating a new quest file.
 * Used by both CreateQuestModal and CreateQuestFromFileModal.
 */
export interface QuestBodySections {
    description?: string;
    objectives?: string;
    rewards?: string;
    dueDate?: string;
    estimatedTime?: string;
    difficulty?: QuestDifficulty;
}

/**
 * Create a new quest markdown file with frontmatter and body sections.
 * Shared utility for all quest creation flows (manual modal, quick-create, etc.).
 */
export async function saveNewQuestFile(
    app: App,
    storageFolder: string,
    quest: ManualQuest,
    bodySections?: QuestBodySections
): Promise<boolean> {
    try {
        // Use questType directly as folder name (lowercase)
        const subFolder = `quests/${quest.questType.toLowerCase()}`;
        const folderPath = `${storageFolder}/${subFolder}`;
        const filePath = `${folderPath}/${quest.questId}.md`;

        // Ensure folder exists
        const folder = app.vault.getAbstractFileByPath(folderPath);
        if (!folder) {
            await app.vault.createFolder(folderPath);
        }

        // Build frontmatter
        const frontmatterLines = [
            '---',
            `schemaVersion: ${quest.schemaVersion}`,
            `questId: "${quest.questId}"`,
            `questName: "${quest.questName}"`,
            `questType: ${quest.questType}`,
            `category: "${quest.category}"`,
            `status: ${quest.status}`,
            `priority: ${quest.priority}`,
            `linkedTaskFile: "${quest.linkedTaskFile}"`,
            `xpPerTask: ${quest.xpPerTask}`,
            `completionBonus: ${quest.completionBonus}`,
            `visibleTasks: ${quest.visibleTasks}`,
            `createdDate: "${quest.createdDate}"`,
        ];

        // Add optional fields from body sections
        if (bodySections?.dueDate) {
            frontmatterLines.push(`dueDate: "${bodySections.dueDate}"`);
        }
        if (bodySections?.estimatedTime) {
            frontmatterLines.push(`estimatedTime: "${bodySections.estimatedTime}"`);
        }
        if (bodySections?.difficulty && bodySections.difficulty !== QuestDifficulty.MEDIUM) {
            frontmatterLines.push(`difficulty: ${bodySections.difficulty}`);
        }

        frontmatterLines.push('---');

        // Build body
        const bodyLines = [
            '',
            `# ${quest.questName}`,
            '',
        ];

        if (bodySections?.description) {
            bodyLines.push('## Description', '', bodySections.description, '');
        }

        if (bodySections?.objectives) {
            bodyLines.push('## Objectives', '', bodySections.objectives, '');
        }

        if (bodySections?.rewards) {
            bodyLines.push('## Rewards', '', bodySections.rewards, '');
        }

        // If self-linking, add Tasks section
        if (quest.linkedTaskFile === filePath) {
            bodyLines.push('## Tasks', '', '- [ ] First task', '- [ ] Second task', '');
        }

        const content = frontmatterLines.join('\n') + bodyLines.join('\n');

        // Create or overwrite file
        const existingFile = app.vault.getAbstractFileByPath(filePath);
        if (existingFile instanceof TFile) {
            await app.vault.modify(existingFile, content);
        } else {
            await app.vault.create(filePath, content);
        }

        return true;
    } catch (error) {
        console.error('[QuestService] Failed to save new quest file:', error);
        return false;
    }
}

/**
 * Event types for granular watcher
 */
export type QuestFileEvent =
    | { type: 'modify'; filePath: string }
    | { type: 'create'; filePath: string }
    | { type: 'delete'; filePath: string; questId?: string }
    | { type: 'rename'; filePath: string; oldPath: string };

/**
 * Granular folder watcher - provides per-file callbacks instead of full reload.
 * Efficient for large quest counts - only reloads the affected quest file.
 */
export function watchQuestFolderGranular(
    vault: Vault,
    baseFolder: string,
    callbacks: {
        onQuestModified: (filePath: string, quest: Quest | null) => void;
        onQuestCreated: (filePath: string, quest: Quest) => void;
        onQuestDeleted: (filePath: string) => void;
        onQuestRenamed: (newPath: string, oldPath: string, quest: Quest | null) => void;
        /** Called if granular handling fails and full reload is needed */
        onFullReloadNeeded?: () => void;
    },
    debounceMs: number = 300,
    settings?: QuestBoardSettings
): () => void {
    // Track pending events for debouncing per-file
    const pendingModifies = new Map<string, ReturnType<typeof setTimeout>>();

    const handleModify = async (filePath: string) => {
        const result = await loadSingleQuest(vault, filePath, settings);
        callbacks.onQuestModified(filePath, result.quest);
    };

    const onCreate = vault.on('create', async (file) => {
        if (file.path.startsWith(baseFolder) && file instanceof TFile) {
            // Small delay to ensure file is fully written
            setTimeout(async () => {
                const result = await loadSingleQuest(vault, file.path, settings);
                if (result.quest) {
                    callbacks.onQuestCreated(file.path, result.quest);
                }
            }, 100);
        }
    });

    const onModify = vault.on('modify', (file) => {
        if (file.path.startsWith(baseFolder) && file instanceof TFile) {
            // Debounce per-file to handle rapid edits
            const existing = pendingModifies.get(file.path);
            if (existing) {
                clearTimeout(existing);
            }

            pendingModifies.set(
                file.path,
                setTimeout(() => {
                    pendingModifies.delete(file.path);
                    handleModify(file.path);
                }, debounceMs)
            );
        }
    });

    const onDelete = vault.on('delete', (file) => {
        if (file.path.startsWith(baseFolder)) {
            callbacks.onQuestDeleted(file.path);
        }
    });

    const onRename = vault.on('rename', async (file, oldPath) => {
        if (file.path.startsWith(baseFolder) || oldPath.startsWith(baseFolder)) {
            if (file instanceof TFile) {
                const result = await loadSingleQuest(vault, file.path, settings);
                callbacks.onQuestRenamed(file.path, oldPath, result.quest);
            } else {
                callbacks.onQuestRenamed(file.path, oldPath, null);
            }
        }
    });

    // Return unsubscribe function
    return () => {
        vault.offref(onCreate);
        vault.offref(onModify);
        vault.offref(onDelete);
        vault.offref(onRename);
        // Clear pending timeouts
        pendingModifies.forEach(timeout => clearTimeout(timeout));
        pendingModifies.clear();
    };
}

