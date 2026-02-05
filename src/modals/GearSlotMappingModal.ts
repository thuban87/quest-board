/**
 * Gear Slot Mapping Modal
 * 
 * Configure which gear slots can drop from each quest type.
 * Uses visual checkbox grid instead of comma-separated text input.
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import type { GearSlot } from '../models/Gear';

export class GearSlotMappingModal extends Modal {
    private plugin: QuestBoardPlugin;
    private mapping: Record<string, string[]>;

    constructor(app: App, plugin: QuestBoardPlugin) {
        super(app);
        this.plugin = plugin;
        // Deep copy to allow cancel without saving
        this.mapping = JSON.parse(JSON.stringify(plugin.settings.questSlotMapping || {}));
    }

    async onOpen(): Promise<void> {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-gear-slot-mapping-modal');

        // Header
        contentEl.createEl('h2', { text: 'Quest Type → Gear Slot Mapping' });
        contentEl.createEl('p', {
            text: 'Configure which gear slots can drop from each quest type.',
            cls: 'modal-description'
        });

        const questTypes = Object.keys(this.mapping);
        const availableSlots: GearSlot[] = [
            'head', 'chest', 'legs', 'boots',
            'weapon', 'shield',
            'accessory1', 'accessory2', 'accessory3'
        ];

        // Existing mappings
        if (questTypes.length === 0) {
            contentEl.createEl('p', {
                text: 'No quest type mappings configured yet. Add one below.',
                cls: 'qb-empty-state'
            });
        } else {
            for (const questType of questTypes) {
                const section = contentEl.createDiv({ cls: 'qb-mapping-section' });

                const header = section.createDiv({ cls: 'qb-mapping-header' });
                header.createEl('h4', {
                    text: questType.charAt(0).toUpperCase() + questType.slice(1)
                });

                const deleteBtn = header.createEl('button', {
                    text: 'Delete',
                    cls: 'mod-warning qb-delete-btn'
                });
                deleteBtn.addEventListener('click', () => {
                    delete this.mapping[questType];
                    this.onOpen(); // Refresh
                });

                // Slot checkboxes grid
                const slotsGrid = section.createDiv({ cls: 'qb-slots-grid' });

                for (const slot of availableSlots) {
                    const slotDiv = slotsGrid.createDiv({ cls: 'qb-slot-checkbox' });

                    const checkbox = slotDiv.createEl('input', { type: 'checkbox' });
                    checkbox.id = `slot-${questType}-${slot}`;
                    checkbox.checked = (this.mapping[questType] || []).includes(slot);

                    checkbox.addEventListener('change', () => {
                        if (!this.mapping[questType]) {
                            this.mapping[questType] = [];
                        }

                        if (checkbox.checked) {
                            if (!this.mapping[questType].includes(slot)) {
                                this.mapping[questType].push(slot);
                            }
                        } else {
                            this.mapping[questType] = this.mapping[questType].filter(s => s !== slot);
                        }
                    });

                    const label = slotDiv.createEl('label', {
                        text: this.formatSlotName(slot),
                        attr: { for: `slot-${questType}-${slot}` }
                    });
                }
            }
        }

        // Add new quest type section
        const addSection = contentEl.createDiv({ cls: 'qb-add-mapping' });
        addSection.createEl('h4', { text: 'Add New Quest Type' });

        let newQuestType = '';

        new Setting(addSection)
            .setName('Quest Type')
            .setDesc('E.g., fitness, guild, personal')
            .addText(text => text
                .setPlaceholder('e.g., fitness')
                .onChange(value => { newQuestType = value.toLowerCase().trim(); }))
            .addButton(button => button
                .setButtonText('Add')
                .onClick(() => {
                    if (newQuestType && !this.mapping[newQuestType]) {
                        this.mapping[newQuestType] = [];
                        this.onOpen(); // Refresh
                    } else if (this.mapping[newQuestType]) {
                        new Notice('Quest type already exists');
                    }
                }));

        // Footer with Save/Cancel
        const footer = contentEl.createDiv({ cls: 'modal-button-container' });

        const cancelBtn = footer.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());

        const saveBtn = footer.createEl('button', { text: 'Save', cls: 'mod-cta' });
        saveBtn.addEventListener('click', async () => {
            this.plugin.settings.questSlotMapping = this.mapping;
            await this.plugin.saveSettings();

            // Apply to loot service
            try {
                const { lootGenerationService } = await import('../services/LootGenerationService');
                const typedMapping: Record<string, GearSlot[]> = {};
                for (const [key, slots] of Object.entries(this.mapping)) {
                    typedMapping[key] = slots as GearSlot[];
                }
                lootGenerationService.setCustomSlotMapping(typedMapping);
            } catch (error) {
                console.error('[GearSlotMappingModal] Failed to update loot service:', error);
            }

            new Notice('✓ Gear slot mappings saved');
            this.close();
        });
    }

    private formatSlotName(slot: string): string {
        // Convert 'accessory1' to 'Accessory 1', etc.
        return slot
            .replace(/(\d+)/, ' $1')
            .replace(/^./, c => c.toUpperCase());
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
