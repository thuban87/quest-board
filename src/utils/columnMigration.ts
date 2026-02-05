/**
 * Column Migration Utility
 * 
 * Handles migration of quests when columns are deleted or renamed.
 * Updates both in-memory store and quest files on disk.
 */

import { Vault, TFile } from 'obsidian';
import { useQuestStore, selectAllQuests } from '../store/questStore';
import type { Quest } from '../models/Quest';

/**
 * Migrate quests from a deleted column to a target column
 * Updates both the in-memory store and quest files on disk
 * 
 * @param vault - Obsidian vault for file operations
 * @param deletedColumnId - ID of the column being deleted
 * @param targetColumnId - ID of the column to migrate quests to
 * @returns Number of quests migrated
 */
export async function migrateQuestsFromDeletedColumn(
    vault: Vault,
    deletedColumnId: string,
    targetColumnId: string
): Promise<number> {
    const store = useQuestStore.getState();
    const quests = selectAllQuests(store);

    // Find quests in the deleted column
    const affectedQuests = quests.filter((q: Quest) => q.status === deletedColumnId);

    if (affectedQuests.length === 0) {
        return 0;
    }

    // Update each quest in memory and on disk
    for (const quest of affectedQuests) {
        // Update in-memory store
        store.upsertQuest({
            ...quest,
            status: targetColumnId,
        });

        // Update file on disk if it exists
        if (quest.filePath) {
            await updateQuestStatusInFile(vault, quest.filePath, targetColumnId);
        }
    }

    return affectedQuests.length;
}

/**
 * Update the status field in a quest file's frontmatter
 * 
 * @param vault - Obsidian vault
 * @param filePath - Path to the quest file
 * @param newStatus - New status value to set
 */
async function updateQuestStatusInFile(
    vault: Vault,
    filePath: string,
    newStatus: string
): Promise<void> {
    try {
        const file = vault.getAbstractFileByPath(filePath);
        if (!(file instanceof TFile)) {
            console.warn(`[columnMigration] File not found: ${filePath}`);
            return;
        }

        const content = await vault.read(file);
        const lines = content.split(/\r?\n/);

        // Find and update the status line in frontmatter
        let inFrontmatter = false;
        let frontmatterEnd = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (i === 0 && line === '---') {
                inFrontmatter = true;
                continue;
            }

            if (inFrontmatter && line === '---') {
                frontmatterEnd = i;
                break;
            }

            if (inFrontmatter && line.startsWith('status:')) {
                // Update the status line
                lines[i] = `status: ${newStatus}`;
                break;
            }
        }

        // Write the updated content back
        const newContent = lines.join('\n');
        await vault.modify(file, newContent);
    } catch (error) {
        console.error(`[columnMigration] Error updating file ${filePath}:`, error);
    }
}

/**
 * Validate that all quests have valid column statuses
 * Returns quests that need migration (status not in current columns)
 * 
 * @param validColumnIds - Array of valid column IDs
 * @returns Array of quests with invalid statuses
 */
export function findQuestsWithInvalidStatus(validColumnIds: string[]): Quest[] {
    const store = useQuestStore.getState();
    const quests = selectAllQuests(store);

    return quests.filter((q: Quest) => !validColumnIds.includes(q.status as string));
}
