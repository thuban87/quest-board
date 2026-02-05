/**
 * AI Test Lab Modal
 * 
 * DEV-only modal for testing Gemini AI integration and managing caches.
 * Provides set bonus generation testing and cache management tools.
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import type QuestBoardPlugin from '../../main';

export class AITestLabModal extends Modal {
    private plugin: QuestBoardPlugin;

    constructor(app: App, plugin: QuestBoardPlugin) {
        super(app);
        this.plugin = plugin;
    }

    async onOpen(): Promise<void> {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-ai-test-lab-modal');

        // Header
        contentEl.createEl('h2', { text: '🧪 AI Test Lab' });
        contentEl.createEl('p', {
            text: 'Test Gemini AI integration and manage caches.',
            cls: 'modal-description'
        });

        // API Key Check
        if (!this.plugin.settings.geminiApiKey) {
            contentEl.createEl('p', {
                text: '⚠ No Gemini API key configured. Set it in Essential Settings first.',
                cls: 'qb-warning-text'
            });
        }

        // Set Bonus Generation Test Section
        const testSection = contentEl.createDiv({ cls: 'qb-test-section' });
        testSection.createEl('h3', { text: 'Set Bonus Generation' });
        testSection.createEl('p', {
            text: 'Test AI generation of set bonuses for gear. Results also logged to console.',
            cls: 'setting-item-description'
        });

        let testSetName = '';
        let generateBtn: HTMLButtonElement;

        new Setting(testSection)
            .setName('Test Set Name')
            .setDesc('Enter a set name to generate bonuses for')
            .addText(text => text
                .setPlaceholder('e.g., Fitness, Work, Study')
                .onChange(value => { testSetName = value.trim(); }))
            .addButton(button => {
                generateBtn = button.buttonEl;
                button
                    .setButtonText('Generate')
                    .onClick(async () => {
                        if (!testSetName) {
                            new Notice('❌ Please enter a set name');
                            return;
                        }

                        if (!this.plugin.settings.geminiApiKey) {
                            new Notice('❌ No API key configured');
                            return;
                        }

                        generateBtn.textContent = 'Generating...';
                        generateBtn.disabled = true;

                        try {
                            const { setBonusService } = await import('../services/SetBonusService');
                            const result = await setBonusService.testGeneration(testSetName);

                            if (result.success && result.bonuses) {
                                console.log(`[AI Test Lab] SUCCESS for "${testSetName}":`, result.bonuses);
                                const bonusStr = result.bonuses.map(b =>
                                    `(${b.pieces}) ${setBonusService.formatBonusEffect(b.effect)}`
                                ).join('\n');
                                new Notice(`✅ Generated bonuses for "${testSetName}":\n\n${bonusStr}`, 8000);
                            } else {
                                console.error(`[AI Test Lab] FAILED for "${testSetName}":`, result.error);
                                new Notice(`❌ Generation failed:\n${result.error}`, 5000);
                            }
                        } catch (error) {
                            console.error('[AI Test Lab] Error:', error);
                            new Notice(`❌ Error: ${error}`);
                        }

                        generateBtn.textContent = 'Generate';
                        generateBtn.disabled = false;
                    });
            });

        // Cache Management Section
        const cacheSection = contentEl.createDiv({ cls: 'qb-test-section' });
        cacheSection.createEl('h3', { text: 'Cache Management' });

        new Setting(cacheSection)
            .setName('View Cache Status')
            .setDesc('See current set bonus cache contents')
            .addButton(button => button
                .setButtonText('Show Status')
                .onClick(async () => {
                    try {
                        const { setBonusService } = await import('../services/SetBonusService');
                        const status = setBonusService.getCacheStatus();
                        console.log('[Cache Status]', status);

                        const message = `📦 Cache Status:\n` +
                            `Cached: ${status.cached}\n` +
                            `Pending: ${status.pending}\n` +
                            `Sets: ${status.setIds.join(', ') || 'none'}`;

                        new Notice(message, 5000);
                    } catch (error) {
                        new Notice(`❌ Error: ${error}`);
                    }
                }));

        new Setting(cacheSection)
            .setName('Clear Cache')
            .setDesc('Clear cached set bonuses (keeps first entry for comparison)')
            .addButton(button => button
                .setButtonText('Clear Cache')
                .setWarning()
                .onClick(async () => {
                    try {
                        const { setBonusService } = await import('../services/SetBonusService');
                        setBonusService.clearCacheExceptFirst();
                        new Notice('🗑️ Cache cleared (kept first entry)');
                    } catch (error) {
                        new Notice(`❌ Error: ${error}`);
                    }
                }));

        // Footer
        const footer = contentEl.createDiv({ cls: 'modal-button-container' });
        const closeBtn = footer.createEl('button', { text: 'Close' });
        closeBtn.addEventListener('click', () => this.close());
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
