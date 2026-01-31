/**
 * Skill Loadout Modal
 * 
 * Allows players to view and manage their equipped skills.
 * Shows 5 configurable skill slots (Meditate is always equipped separately).
 * 
 * Features:
 * - View all unlocked and locked class skills
 * - Equip/unequip skills by clicking
 * - Auto-Fill with highest-level skills
 * - Clear All to reset loadout
 */

import { Modal, App, Notice } from 'obsidian';
import { useCharacterStore } from '../store/characterStore';
import { getSkillsForClass, getSkillById } from '../data/skills';
import { Skill } from '../models/Skill';
import { CharacterClass } from '../models/Character';
import { MAX_EQUIPPED_SKILLS, MEDITATE_SKILL_ID } from '../config/combatConfig';
import { formatSkillTooltipFull } from '../utils/skillFormatters';

interface SkillLoadoutModalOptions {
    /** Callback when skills are saved */
    onSave?: () => Promise<void>;
}

export class SkillLoadoutModal extends Modal {
    private options: SkillLoadoutModalOptions;
    private contentContainer: HTMLElement | null = null;

    /** Pending equipped skills (local state before save) */
    private pendingEquipped: string[] = [];

    constructor(app: App, options: SkillLoadoutModalOptions = {}) {
        super(app);
        this.options = options;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-skill-loadout-modal');

        // Make the modal wider
        this.modalEl.addClass('qb-modal-wide');

        // Initialize pending state from character
        const character = useCharacterStore.getState().character;
        if (character?.skills?.equipped) {
            // Filter out Meditate - we manage it separately
            this.pendingEquipped = character.skills.equipped
                .filter(id => id !== MEDITATE_SKILL_ID);
        } else {
            this.pendingEquipped = [];
        }

        // Limit to max slots
        this.pendingEquipped = this.pendingEquipped.slice(0, MAX_EQUIPPED_SKILLS);

        // Header
        const header = contentEl.createDiv('qb-skill-loadout-header');
        header.createEl('h2', { text: '⚔️ Skill Loadout' });

        const levelDisplay = header.createEl('div', { cls: 'qb-skill-loadout-level' });
        levelDisplay.textContent = character
            ? `Level ${character.level} ${character.class.charAt(0).toUpperCase() + character.class.slice(1)}`
            : 'No Character';

        // Content container
        this.contentContainer = contentEl.createEl('div', { cls: 'qb-skill-loadout-content' });
        this.renderContent();

        // Footer with buttons
        const footer = contentEl.createEl('div', { cls: 'qb-skill-loadout-footer' });

        const cancelBtn = footer.createEl('button', {
            cls: 'qb-skill-loadout-btn qb-btn-cancel',
            text: '✕ Cancel'
        });
        cancelBtn.addEventListener('click', () => this.close());

        const saveBtn = footer.createEl('button', {
            cls: 'qb-skill-loadout-btn qb-btn-save',
            text: '💾 Save Loadout'
        });
        saveBtn.addEventListener('click', () => this.saveLoadout());
    }

    private renderContent() {
        if (!this.contentContainer) return;
        this.contentContainer.empty();

        const character = useCharacterStore.getState().character;
        if (!character) {
            this.contentContainer.createEl('p', { text: 'No character found.' });
            return;
        }

        // === EQUIPPED SKILLS SECTION ===
        this.renderEquippedSection(character.class, character.level);

        // === ACTION BUTTONS ===
        this.renderActionButtons(character.class, character.level);

        // === AVAILABLE SKILLS SECTION ===
        this.renderAvailableSkillsSection(character.class, character.level);

        // === UNIVERSAL SKILLS SECTION ===
        this.renderUniversalSection();
    }

    private renderEquippedSection(characterClass: CharacterClass, level: number) {
        if (!this.contentContainer) return;

        const section = this.contentContainer.createEl('div', { cls: 'qb-equipped-section' });

        const header = section.createEl('div', { cls: 'qb-section-header' });
        header.createEl('h3', { text: `Equipped Skills (${this.pendingEquipped.length}/${MAX_EQUIPPED_SKILLS})` });

        const slotsGrid = section.createEl('div', { cls: 'qb-equipped-slots' });

        // Render each slot (0-4)
        for (let i = 0; i < MAX_EQUIPPED_SKILLS; i++) {
            const skillId = this.pendingEquipped[i];
            const skill = skillId ? getSkillById(skillId) : null;

            const slotEl = slotsGrid.createEl('div', {
                cls: `qb-skill-slot ${skill ? 'filled' : 'empty'}`
            });

            if (skill) {
                // Show skill info
                slotEl.createEl('span', { cls: 'qb-slot-icon', text: skill.icon });
                slotEl.createEl('span', { cls: 'qb-slot-name', text: skill.name });
                slotEl.createEl('span', { cls: 'qb-slot-cost', text: `${skill.manaCost} MP` });

                // Remove button
                const removeBtn = slotEl.createEl('button', {
                    cls: 'qb-slot-remove',
                    text: '−'
                });
                removeBtn.setAttribute('title', 'Remove skill');
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.unequipSkill(skillId);
                });

                // Tooltip
                slotEl.setAttribute('title', this.getSkillTooltip(skill));
            } else {
                // Empty slot
                slotEl.createEl('span', { cls: 'qb-slot-icon', text: '🔲' });
                slotEl.createEl('span', { cls: 'qb-slot-name', text: 'Empty Slot' });
            }
        }
    }

    private renderActionButtons(characterClass: CharacterClass, level: number) {
        if (!this.contentContainer) return;

        const actionsRow = this.contentContainer.createEl('div', { cls: 'qb-loadout-actions' });

        // Auto-Fill button
        const autoFillBtn = actionsRow.createEl('button', {
            cls: 'qb-loadout-action-btn',
            text: '⚡ Auto-Fill'
        });
        autoFillBtn.setAttribute('title', 'Fill empty slots with highest-level skills');
        autoFillBtn.addEventListener('click', () => this.autoFill(characterClass, level));

        // Clear All button
        const clearBtn = actionsRow.createEl('button', {
            cls: 'qb-loadout-action-btn qb-btn-danger',
            text: '🗑️ Clear All'
        });
        clearBtn.setAttribute('title', 'Remove all equipped skills');
        clearBtn.addEventListener('click', () => this.clearAll());
    }

    private renderAvailableSkillsSection(characterClass: CharacterClass, level: number) {
        if (!this.contentContainer) return;

        const section = this.contentContainer.createEl('div', { cls: 'qb-available-section' });
        section.createEl('h3', { text: `${characterClass.charAt(0).toUpperCase() + characterClass.slice(1)} Skills` });

        const skillsGrid = section.createEl('div', { cls: 'qb-skills-grid' });

        // Get all skills for this class (excluding Meditate)
        const classSkills = getSkillsForClass(characterClass)
            .filter(s => s.id !== MEDITATE_SKILL_ID)
            .sort((a, b) => a.learnLevel - b.learnLevel);

        for (const skill of classSkills) {
            const isUnlocked = level >= skill.learnLevel;
            const isEquipped = this.pendingEquipped.includes(skill.id);
            const canEquip = isUnlocked && !isEquipped && this.pendingEquipped.length < MAX_EQUIPPED_SKILLS;

            const skillCard = skillsGrid.createEl('div', {
                cls: `qb-skill-card ${isEquipped ? 'equipped' : ''} ${isUnlocked ? 'available' : 'locked'}`
            });

            // Click to equip/unequip
            if (isUnlocked) {
                skillCard.addEventListener('click', () => {
                    if (isEquipped) {
                        this.unequipSkill(skill.id);
                    } else if (canEquip) {
                        this.equipSkill(skill.id);
                    } else if (this.pendingEquipped.length >= MAX_EQUIPPED_SKILLS) {
                        new Notice('⚠️ Loadout full! Unequip a skill first.', 2000);
                    }
                });
            }

            // Icon
            skillCard.createEl('div', { cls: 'qb-skill-card-icon', text: skill.icon });

            // Info container
            const infoEl = skillCard.createEl('div', { cls: 'qb-skill-card-info' });

            // Name row
            const nameRow = infoEl.createEl('div', { cls: 'qb-skill-card-name-row' });
            nameRow.createEl('span', { cls: 'qb-skill-card-name', text: skill.name });
            if (isEquipped) {
                nameRow.createEl('span', { cls: 'qb-skill-equipped-badge', text: '✓' });
            }

            // Level & Cost
            const detailsRow = infoEl.createEl('div', { cls: 'qb-skill-card-details' });
            detailsRow.createEl('span', {
                cls: 'qb-skill-card-level',
                text: `Lv ${skill.learnLevel}`
            });

            if (isUnlocked) {
                detailsRow.createEl('span', {
                    cls: 'qb-skill-card-cost',
                    text: `${skill.manaCost} MP`
                });
            } else {
                detailsRow.createEl('span', {
                    cls: 'qb-skill-card-locked',
                    text: `🔒 Unlocks Lv ${skill.learnLevel}`
                });
            }

            // Tooltip with full details
            skillCard.setAttribute('title', this.getSkillTooltip(skill));
        }
    }

    private renderUniversalSection() {
        if (!this.contentContainer) return;

        const section = this.contentContainer.createEl('div', { cls: 'qb-universal-section' });
        section.createEl('h3', { text: '🌟 Universal Skills' });

        const note = section.createEl('div', { cls: 'qb-universal-note' });
        note.textContent = 'Meditate is always available on the main battle menu.';

        const meditateSkill = getSkillById(MEDITATE_SKILL_ID);
        if (meditateSkill) {
            const skillCard = section.createEl('div', { cls: 'qb-skill-card universal always-equipped' });
            skillCard.createEl('div', { cls: 'qb-skill-card-icon', text: meditateSkill.icon });

            const infoEl = skillCard.createEl('div', { cls: 'qb-skill-card-info' });
            const nameRow = infoEl.createEl('div', { cls: 'qb-skill-card-name-row' });
            nameRow.createEl('span', { cls: 'qb-skill-card-name', text: meditateSkill.name });
            nameRow.createEl('span', { cls: 'qb-skill-always-badge', text: 'Always' });

            const detailsRow = infoEl.createEl('div', { cls: 'qb-skill-card-details' });
            detailsRow.createEl('span', { cls: 'qb-skill-card-desc', text: meditateSkill.description });

            skillCard.setAttribute('title', this.getSkillTooltip(meditateSkill));
        }
    }

    private getSkillTooltip(skill: Skill): string {
        return formatSkillTooltipFull(skill);
    }

    private equipSkill(skillId: string) {
        if (this.pendingEquipped.length >= MAX_EQUIPPED_SKILLS) {
            new Notice('⚠️ Loadout full! Unequip a skill first.', 2000);
            return;
        }
        if (this.pendingEquipped.includes(skillId)) {
            return; // Already equipped
        }
        this.pendingEquipped.push(skillId);
        this.renderContent();
    }

    private unequipSkill(skillId: string) {
        this.pendingEquipped = this.pendingEquipped.filter(id => id !== skillId);
        this.renderContent();
    }

    private autoFill(characterClass: CharacterClass, level: number) {
        // Get all unlocked class skills sorted by unlock level (highest first)
        const classSkills = getSkillsForClass(characterClass)
            .filter(s => s.id !== MEDITATE_SKILL_ID)
            .filter(s => level >= s.learnLevel)
            .sort((a, b) => b.learnLevel - a.learnLevel); // Highest level first

        // Fill empty slots
        for (const skill of classSkills) {
            if (this.pendingEquipped.length >= MAX_EQUIPPED_SKILLS) break;
            if (!this.pendingEquipped.includes(skill.id)) {
                this.pendingEquipped.push(skill.id);
            }
        }

        this.renderContent();
        new Notice(`⚡ Auto-filled ${this.pendingEquipped.length} skills`, 2000);
    }

    private clearAll() {
        this.pendingEquipped = [];
        this.renderContent();
        new Notice('🗑️ Cleared all skills', 2000);
    }

    private async saveLoadout() {
        const store = useCharacterStore.getState();

        // Always include Meditate + the user's chosen skills
        const equippedWithMeditate = [MEDITATE_SKILL_ID, ...this.pendingEquipped];

        store.updateSkillLoadout(equippedWithMeditate);

        new Notice(`💾 Saved skill loadout (${this.pendingEquipped.length} skills)`, 2000);

        if (this.options.onSave) {
            await this.options.onSave();
        }

        this.close();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/**
 * Show the skill loadout modal (convenience function)
 */
export function showSkillLoadoutModal(app: App, options: SkillLoadoutModalOptions = {}): void {
    new SkillLoadoutModal(app, options).open();
}
