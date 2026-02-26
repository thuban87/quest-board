/**
 * Title Selection Modal
 * 
 * Allows the player to browse, equip, and unequip character titles.
 * Layout: "None" option, unlocked titles with radio-style selection,
 * locked titles greyed out with unlock conditions.
 * 
 * Uses Obsidian DOM API (createEl, createDiv) — no innerHTML.
 * Equip/unequip calls TitleService; save is handled via Zustand→saveData() subscription.
 */

import { App, Modal, Notice } from 'obsidian';
import { Character } from '../models/Character';
import { Title, TitleRarity } from '../models/Title';
import { TITLES } from '../data/titles';
import { getUnlockedTitles, getEquippedTitle, equipTitle } from '../services/TitleService';
import { useCharacterStore } from '../store/characterStore';

export class TitleSelectionModal extends Modal {
    private character: Character;
    private onSave: () => Promise<void>;

    constructor(app: App, character: Character, onSave: () => Promise<void>) {
        super(app);
        this.character = character;
        this.onSave = onSave;
    }

    onOpen() {
        this.render();
    }

    private render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-title-modal');

        // Re-read character for latest state
        const character = useCharacterStore.getState().character ?? this.character;
        const unlockedTitles = getUnlockedTitles(character);
        const equippedTitle = getEquippedTitle(character);
        const unlockedIds = new Set(character.unlockedTitles);

        // All titles from registry
        const allTitles = Object.values(TITLES);
        const lockedTitles = allTitles.filter(t => !unlockedIds.has(t.id));

        // Header
        contentEl.createEl('h2', { text: '🏷️ Select title' });

        // "None" option
        const noneRow = contentEl.createDiv({ cls: 'qb-title-row' });
        if (!equippedTitle) {
            noneRow.addClass('qb-title-row-selected');
        }
        const noneRadio = noneRow.createSpan({ text: equippedTitle ? '○' : '●', cls: 'qb-title-radio' });
        noneRow.createSpan({ text: 'None', cls: 'qb-title-name' });
        noneRow.addEventListener('click', () => {
            if (equippedTitle) {
                equipTitle(null);
                void this.onSave();
                this.close();
            }
        });

        // Separator
        contentEl.createEl('hr');

        // Unlocked section
        const unlockedHeader = contentEl.createDiv({ cls: 'qb-title-section-header' });
        unlockedHeader.createSpan({ text: `UNLOCKED (${unlockedTitles.length})` });

        contentEl.createEl('hr');

        for (const title of unlockedTitles) {
            const isEquipped = equippedTitle?.id === title.id;
            const row = contentEl.createDiv({
                cls: `qb-title-row ${isEquipped ? 'qb-title-row-selected' : ''}`,
            });

            // Radio indicator
            row.createSpan({ text: isEquipped ? '●' : '○', cls: 'qb-title-radio' });

            // Title info container
            const info = row.createDiv({ cls: 'qb-title-info' });
            info.createSpan({ text: title.name, cls: 'qb-title-name' });

            // Buff label (if buff title)
            if (title.buff) {
                info.createDiv({ text: title.buff.label, cls: 'qb-title-buff-label' });
            }

            // Description
            info.createDiv({ text: `"${title.description}"`, cls: 'qb-title-description' });

            // Rarity badge
            row.createSpan({
                text: this.formatRarity(title.rarity),
                cls: `qb-title-rarity-badge qb-title-${title.rarity}`,
            });

            // Click handler
            row.addEventListener('click', () => {
                if (isEquipped) {
                    // Click active title to unequip
                    equipTitle(null);
                } else {
                    equipTitle(title.id);
                }
                void this.onSave();
                this.close();
            });

            contentEl.createEl('hr');
        }

        // Locked section
        if (lockedTitles.length > 0) {
            const lockedHeader = contentEl.createDiv({ cls: 'qb-title-section-header' });
            lockedHeader.createSpan({ text: `LOCKED (${lockedTitles.length})` });

            contentEl.createEl('hr');

            for (const title of lockedTitles) {
                const row = contentEl.createDiv({ cls: 'qb-title-row qb-title-row-locked' });

                row.createSpan({ text: '🔒', cls: 'qb-title-radio' });

                const info = row.createDiv({ cls: 'qb-title-info' });
                info.createSpan({ text: title.name, cls: 'qb-title-name' });
                info.createDiv({ text: title.unlockCondition, cls: 'qb-title-unlock-condition' });

                row.createSpan({
                    text: this.formatRarity(title.rarity),
                    cls: `qb-title-rarity-badge qb-title-${title.rarity}`,
                });

                contentEl.createEl('hr');
            }
        }
    }

    /**
     * Format rarity for display — sentence case in source, 
     * CSS text-transform: uppercase handles visual display.
     */
    private formatRarity(rarity: TitleRarity): string {
        return rarity.charAt(0).toUpperCase() + rarity.slice(1);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
