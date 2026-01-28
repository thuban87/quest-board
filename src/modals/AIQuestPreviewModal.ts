/**
 * AI Quest Preview Modal
 * 
 * Shows generated quest markdown for user to edit before saving.
 */

import { App, Modal, Setting, Notice, TFile } from 'obsidian';
import type QuestBoardPlugin from '../../main';

export class AIQuestPreviewModal extends Modal {
    private plugin: QuestBoardPlugin;
    private markdown: string;
    private questType: string;
    private onSave: () => void;

    // Textarea element for editing
    private textareaEl: HTMLTextAreaElement | null = null;

    constructor(
        app: App,
        plugin: QuestBoardPlugin,
        markdown: string,
        questType: string,
        onSave?: () => void
    ) {
        super(app);
        this.plugin = plugin;
        this.markdown = markdown;
        this.questType = questType;
        this.onSave = onSave || (() => { });
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('qb-ai-preview-modal');
        contentEl.empty();

        // Title
        contentEl.createEl('h2', { text: '✨ Quest Preview' });
        contentEl.createEl('p', {
            text: 'Review and edit the generated quest before saving.',
            cls: 'qb-modal-subtitle'
        });

        // Markdown preview/edit textarea
        const textareaContainer = contentEl.createDiv({ cls: 'qb-preview-textarea-container' });

        this.textareaEl = textareaContainer.createEl('textarea', {
            cls: 'qb-preview-textarea'
        });
        this.textareaEl.value = this.markdown;
        this.textareaEl.rows = 25;

        // Tip
        contentEl.createEl('p', {
            text: '💡 Tip: You can edit any part of the quest above. The frontmatter (between ---) controls metadata.',
            cls: 'qb-modal-tip'
        });

        // Action buttons
        const buttonContainer = contentEl.createDiv({ cls: 'qb-modal-buttons' });

        const cancelBtn = buttonContainer.createEl('button', { text: '❌ Cancel' });
        cancelBtn.addEventListener('click', () => this.close());

        const saveBtn = buttonContainer.createEl('button', {
            text: '💾 Save Quest',
            cls: 'mod-cta'
        });
        saveBtn.addEventListener('click', () => this.handleSave());
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private async handleSave() {
        if (!this.textareaEl) return;

        const markdown = this.textareaEl.value.trim();

        if (!markdown.includes('---')) {
            new Notice('❌ Invalid quest format. Must include frontmatter (---)');
            return;
        }

        try {
            // Extract questId from markdown
            const idMatch = markdown.match(/questId:\s*"([^"]+)"/);
            const questId = idMatch ? idMatch[1] : `quest-${Date.now()}`;

            const folderPath = `${this.plugin.settings.storageFolder}/quests/${this.questType}`;
            const filePath = `${folderPath}/${questId}.md`;

            // Ensure folder exists
            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (!folder) {
                await this.app.vault.createFolder(folderPath);
            }

            // Update linkedTaskFile to point to self if empty
            let finalMarkdown = markdown;
            if (markdown.includes('linkedTaskFile: ""')) {
                finalMarkdown = markdown.replace(
                    /linkedTaskFile:\s*""/,
                    `linkedTaskFile: "${filePath}"`
                );
            }

            // Check if file exists
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, finalMarkdown);
            } else {
                await this.app.vault.create(filePath, finalMarkdown);
            }

            new Notice(`✅ Quest saved: ${questId}`);
            this.onSave();
            this.close();

        } catch (error) {
            console.error('[AIQuestPreviewModal] Failed to save:', error);
            new Notice('❌ Failed to save quest. Check console for details.');
        }
    }
}
