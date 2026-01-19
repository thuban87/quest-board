/**
 * Quest Service
 * 
 * Loads and saves quests from vault folder.
 * Handles both manual (markdown) and AI-generated (JSON) quests.
 */

import { Vault, TFile, TFolder, debounce } from 'obsidian';
import { Quest, ManualQuest, AIGeneratedQuest, isAIGeneratedQuest, QUEST_SCHEMA_VERSION } from '../models/Quest';
import { QuestType, QuestStatus, QuestPriority } from '../models/QuestStatus';
import { validateQuest, validateQuestWithNotice } from '../utils/validator';
import { safeJsonParse, safeJsonStringify } from '../utils/safeJson';
import { ensureFolderExists } from '../utils/pathValidator';

/**
 * Quest folder structure
 */
const QUEST_FOLDERS = {
    main: 'quests/main',
    training: 'quests/training',
    side: 'quests/side',
    aiGenerated: 'quests/ai-generated',
};

/**
 * Load result
 */
export interface QuestLoadResult {
    quests: Quest[];
    errors: string[];
    loadedAt: number;
}

/**
 * Parse quest frontmatter from markdown file
 * Expects YAML frontmatter between --- markers
 */
function parseQuestFrontmatter(content: string, filePath: string): Partial<ManualQuest> | null {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];
    const quest: Partial<ManualQuest> = {};

    // Parse YAML-like frontmatter (simple key: value pairs)
    const lines = frontmatter.split('\n');
    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

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
                // Only accept valid manual quest types
                if (value === 'main' || value === 'training' || value === 'side') {
                    quest.questType = value as QuestType.MAIN | QuestType.TRAINING | QuestType.SIDE;
                }
                break;
            case 'category':
                quest.category = value;
                break;
            case 'status':
                quest.status = value as QuestStatus;
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
                // Parse comma-separated tags
                quest.tags = value.split(',').map(t => t.trim()).filter(t => t);
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
        }
    }

    return quest;
}

/**
 * Load a single markdown quest file
 */
async function loadMarkdownQuest(
    vault: Vault,
    file: TFile
): Promise<Quest | null> {
    try {
        const content = await vault.cachedRead(file);
        const parsed = parseQuestFrontmatter(content, file.path);

        if (!parsed) {
            console.warn(`[QuestService] No frontmatter in: ${file.path}`);
            return null;
        }

        // Set defaults
        const quest: Partial<ManualQuest> = {
            schemaVersion: QUEST_SCHEMA_VERSION,
            questId: parsed.questId || file.basename,
            questName: parsed.questName || file.basename,
            questType: parsed.questType || QuestType.MAIN,
            category: parsed.category || 'general',
            status: parsed.status || QuestStatus.AVAILABLE,
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
            ...parsed,
        };

        // Validate
        const result = validateQuest(quest);
        if (!result.valid) {
            console.warn(`[QuestService] Invalid quest in ${file.path}:`, result.errors);
            return null;
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
    folderPath: string
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
            quest = await loadMarkdownQuest(vault, file);
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
 * Load all quests from the quest storage folder
 */
export async function loadAllQuests(
    vault: Vault,
    baseFolder: string
): Promise<QuestLoadResult> {
    const errors: string[] = [];
    const allQuests: Quest[] = [];

    // Load from each subfolder
    for (const [type, subFolder] of Object.entries(QUEST_FOLDERS)) {
        const fullPath = `${baseFolder}/${subFolder}`;
        try {
            const quests = await loadQuestsFromFolder(vault, fullPath);
            allQuests.push(...quests);
        } catch (error) {
            errors.push(`Failed to load from ${fullPath}: ${error}`);
        }
    }

    // Also load from the base folder directly (for simple setups)
    try {
        const baseQuests = await loadQuestsFromFolder(vault, baseFolder);
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

    if (quest.tags.length > 0) {
        lines.push(`tags: ${quest.tags.join(', ')}`);
    }

    lines.push(`createdDate: "${quest.createdDate}"`);

    if (quest.completedDate) {
        lines.push(`completedDate: "${quest.completedDate}"`);
    }

    lines.push('---');

    return lines.join('\n');
}

/**
 * Save a manual quest to file
 */
export async function saveManualQuest(
    vault: Vault,
    baseFolder: string,
    quest: ManualQuest
): Promise<boolean> {
    try {
        const subFolder = QUEST_FOLDERS[quest.questType as keyof typeof QUEST_FOLDERS] || QUEST_FOLDERS.main;
        const folderPath = `${baseFolder}/${subFolder}`;
        const filePath = `${folderPath}/${quest.questId}.md`;

        await ensureFolderExists(vault, folderPath);

        const frontmatter = generateQuestFrontmatter(quest);
        const content = `${frontmatter}\n\n# ${quest.questName}\n\n${quest.notes || ''}`;

        const existingFile = vault.getAbstractFileByPath(filePath);
        if (existingFile instanceof TFile) {
            await vault.modify(existingFile, content);
        } else {
            await vault.create(filePath, content);
        }

        return true;
    } catch (error) {
        console.error('[QuestService] Failed to save quest:', error);
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
        const folderPath = `${baseFolder}/${QUEST_FOLDERS.aiGenerated}`;
        const filePath = `${folderPath}/${quest.questId}.json`;

        await ensureFolderExists(vault, folderPath);

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
 * Create a debounced folder watcher
 * Returns unsubscribe function
 */
export function watchQuestFolder(
    vault: Vault,
    baseFolder: string,
    callback: (result: QuestLoadResult) => void,
    debounceMs: number = 300
): () => void {
    const debouncedReload = debounce(async () => {
        const result = await loadAllQuests(vault, baseFolder);
        callback(result);
    }, debounceMs, true);

    // Watch for file changes in quest folders
    const onCreate = vault.on('create', (file) => {
        if (file.path.startsWith(baseFolder) && file instanceof TFile) {
            debouncedReload();
        }
    });

    const onModify = vault.on('modify', (file) => {
        if (file.path.startsWith(baseFolder) && file instanceof TFile) {
            debouncedReload();
        }
    });

    const onDelete = vault.on('delete', (file) => {
        if (file.path.startsWith(baseFolder)) {
            debouncedReload();
        }
    });

    const onRename = vault.on('rename', (file, oldPath) => {
        if (file.path.startsWith(baseFolder) || oldPath.startsWith(baseFolder)) {
            debouncedReload();
        }
    });

    // Return unsubscribe function
    return () => {
        vault.offref(onCreate);
        vault.offref(onModify);
        vault.offref(onDelete);
        vault.offref(onRename);
    };
}
