/**
 * Create Quest From File Modal
 * 
 * Small chooser modal with two options:
 * - "Create now" - Instant quest creation with defaults
 * - "Edit before creating" - Opens full CreateQuestModal with pre-filled values
 */

import { App, Modal, Notice, TFile } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { QuestPriority, QuestDifficulty } from '../models/QuestStatus';
import { ManualQuest, QUEST_SCHEMA_VERSION } from '../models/Quest';
import { saveNewQuestFile } from '../services/QuestService';
import { ColumnConfigService } from '../services/ColumnConfigService';
import { CreateQuestModal } from './CreateQuestModal';

/**
 * Quick chooser modal for creating a quest from an existing vault file.
 * Presents two options: instant creation with defaults, or full editor with pre-fill.
 */
export class CreateQuestFromFileModal extends Modal {
    private plugin: QuestBoardPlugin;
    private file: TFile;
    private onSave: () => void;

    constructor(app: App, plugin: QuestBoardPlugin, file: TFile, onSave?: () => void) {
        super(app);
        this.plugin = plugin;
        this.file = file;
        this.onSave = onSave || (() => { });
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('qb-create-from-file-modal');
        contentEl.empty();

        // Title
        contentEl.createEl('h2', { text: '⚔️ Create quest from file' });

        // Show which file
        const fileInfo = contentEl.createEl('p', { cls: 'qb-file-info' });
        fileInfo.createEl('strong', { text: 'File: ' });
        fileInfo.createEl('span', { text: this.file.basename });

        // Button container
        const buttonContainer = contentEl.createDiv({ cls: 'qb-modal-buttons qb-from-file-buttons' });

        // Create Now button
        const createNowBtn = buttonContainer.createEl('button', {
            text: '⚡ Create now',
            cls: 'mod-cta',
        });
        createNowBtn.addEventListener('click', () => this.handleCreateNow());

        // Edit Before Creating button
        const editBtn = buttonContainer.createEl('button', {
            text: '✏️ Edit before creating',
        });
        editBtn.addEventListener('click', () => this.handleEditBeforeCreating());
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    /**
     * Quick-create: build a quest with defaults and save immediately.
     */
    private async handleCreateNow() {
        const questName = this.file.basename;
        const questId = questName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        const columnConfigService = new ColumnConfigService(this.plugin.settings);

        const quest: ManualQuest = {
            schemaVersion: QUEST_SCHEMA_VERSION,
            questId,
            questName,
            questType: 'main',
            category: 'general',
            status: columnConfigService.getDefaultColumn(),
            priority: QuestPriority.MEDIUM,
            difficulty: QuestDifficulty.MEDIUM,
            tags: [],
            createdDate: new Date().toISOString(),
            completedDate: null,
            timeline: [{ date: new Date().toISOString(), event: 'Quest created' }],
            notes: '',
            linkedTaskFile: this.file.path,
            xpPerTask: 5,
            completionBonus: 30,
            visibleTasks: 4,
            milestones: [],
        };

        const success = await saveNewQuestFile(
            this.app,
            this.plugin.settings.storageFolder,
            quest
        );

        if (success) {
            new Notice(`✅ Quest "${questName}" created!`);
            this.onSave();
            this.close();
        } else {
            new Notice('❌ Failed to create quest. Check console for details.');
        }
    }

    /**
     * Open the full CreateQuestModal with quest name and linked file pre-filled.
     */
    private handleEditBeforeCreating() {
        this.close();
        new CreateQuestModal(
            this.app,
            this.plugin,
            this.onSave,
            {
                questName: this.file.basename,
                linkedTaskFile: this.file.path,
            }
        ).open();
    }
}
