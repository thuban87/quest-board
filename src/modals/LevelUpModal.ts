/**
 * Level Up Modal
 * 
 * Celebratory modal shown when player levels up.
 * Shows class-themed message, celebration, and newly unlocked skills.
 */

import { Modal, App } from 'obsidian';
import { CharacterClass, CLASS_INFO } from '../models/Character';
import { getLevelUpMessage, canGraduate, MAX_TRAINING_LEVEL } from '../services/XPSystem';
import { Skill } from '../models/Skill';

/**
 * Options for LevelUpModal constructor
 */
export interface LevelUpModalOptions {
    app: App;
    characterClass: CharacterClass;
    newLevel: number;
    tierChanged: boolean;
    isTraining: boolean;
    onGraduate?: () => void;
    /** Skills that were unlocked at this level (Phase 7) */
    unlockedSkills?: Skill[];
}

export class LevelUpModal extends Modal {
    private characterClass: CharacterClass;
    private newLevel: number;
    private tierChanged: boolean;
    private isTraining: boolean;
    private onGraduate?: () => void;
    private unlockedSkills: Skill[];

    constructor(options: LevelUpModalOptions);
    constructor(
        app: App,
        characterClass: CharacterClass,
        newLevel: number,
        tierChanged: boolean,
        isTraining: boolean,
        onGraduate?: () => void,
        unlockedSkills?: Skill[]
    );
    constructor(
        appOrOptions: App | LevelUpModalOptions,
        characterClass?: CharacterClass,
        newLevel?: number,
        tierChanged?: boolean,
        isTraining?: boolean,
        onGraduate?: () => void,
        unlockedSkills?: Skill[]
    ) {
        // Handle both constructor signatures
        if ('app' in appOrOptions && 'characterClass' in appOrOptions) {
            // Options object
            super(appOrOptions.app);
            this.characterClass = appOrOptions.characterClass;
            this.newLevel = appOrOptions.newLevel;
            this.tierChanged = appOrOptions.tierChanged;
            this.isTraining = appOrOptions.isTraining;
            this.onGraduate = appOrOptions.onGraduate;
            this.unlockedSkills = appOrOptions.unlockedSkills ?? [];
        } else {
            // Legacy positional arguments
            super(appOrOptions as App);
            this.characterClass = characterClass!;
            this.newLevel = newLevel!;
            this.tierChanged = tierChanged!;
            this.isTraining = isTraining!;
            this.onGraduate = onGraduate;
            this.unlockedSkills = unlockedSkills ?? [];
        }
    }

    onOpen() {
        const { contentEl } = this;
        const classInfo = CLASS_INFO[this.characterClass];

        contentEl.empty();
        contentEl.addClass('qb-levelup-modal');

        // Spawn confetti celebration!
        this.spawnConfetti();

        // Check if ready to graduate
        const readyToGraduate = this.isTraining && canGraduate(this.newLevel);

        if (readyToGraduate) {
            // Graduation celebration
            contentEl.createEl('div', { cls: 'qb-levelup-emoji', text: '🎓' });
            contentEl.createEl('h2', {
                cls: 'qb-levelup-title',
                text: 'Training Complete!'
            });
            contentEl.createEl('p', {
                cls: 'qb-levelup-message',
                text: `Congratulations! You've completed all ${MAX_TRAINING_LEVEL} training levels.`
            });
            contentEl.createEl('p', {
                cls: 'qb-levelup-subtitle',
                text: 'You are now ready to begin your real journey as a Level 1 adventurer!'
            });

            const buttonContainer = contentEl.createEl('div', { cls: 'qb-levelup-buttons' });
            const graduateBtn = buttonContainer.createEl('button', {
                cls: 'mod-cta',
                text: '🎉 Graduate to Level 1!'
            });
            graduateBtn.addEventListener('click', () => {
                if (this.onGraduate) {
                    this.onGraduate();
                }
                this.close();
            });
        } else {
            // Regular level up
            const displayLevel = this.isTraining
                ? this.getTrainingRoman(this.newLevel)
                : this.newLevel.toString();

            contentEl.createEl('div', { cls: 'qb-levelup-emoji', text: classInfo.emoji });
            contentEl.createEl('h2', {
                cls: 'qb-levelup-title',
                text: this.isTraining ? `Training Level ${displayLevel}!` : `Level ${displayLevel}!`
            });

            const message = getLevelUpMessage(this.characterClass, this.newLevel, this.tierChanged);
            contentEl.createEl('p', { cls: 'qb-levelup-message', text: message });

            if (this.isTraining) {
                const remaining = MAX_TRAINING_LEVEL - this.newLevel;
                if (remaining > 0) {
                    contentEl.createEl('p', {
                        cls: 'qb-levelup-subtitle',
                        text: `${remaining} more training level${remaining > 1 ? 's' : ''} until graduation!`
                    });
                }
            } else if (this.tierChanged) {
                contentEl.createEl('p', {
                    cls: 'qb-levelup-subtitle',
                    text: 'You\'ve reached a new tier of power!'
                });
            }

            // Phase 7: Show unlocked skills
            if (this.unlockedSkills.length > 0) {
                this.renderUnlockedSkills(contentEl);
            }

            const closeBtn = contentEl.createEl('button', {
                cls: 'mod-cta',
                text: 'Continue'
            });
            closeBtn.addEventListener('click', () => this.close());
        }
    }

    /**
     * Render the unlocked skills section (Phase 7)
     */
    private renderUnlockedSkills(container: HTMLElement): void {
        const skillsSection = container.createEl('div', { cls: 'qb-levelup-skills' });

        skillsSection.createEl('h3', {
            cls: 'qb-levelup-skills-title',
            text: this.unlockedSkills.length === 1 ? '⚔️ New Skill Unlocked!' : '⚔️ New Skills Unlocked!'
        });

        const skillsGrid = skillsSection.createEl('div', { cls: 'qb-levelup-skills-grid' });

        for (const skill of this.unlockedSkills) {
            const skillCard = skillsGrid.createEl('div', { cls: 'qb-levelup-skill-card' });

            // Icon and name
            const header = skillCard.createEl('div', { cls: 'qb-levelup-skill-header' });
            header.createEl('span', { cls: 'qb-levelup-skill-icon', text: skill.icon });
            header.createEl('span', { cls: 'qb-levelup-skill-name', text: skill.name });

            // Mana cost badge
            if (skill.manaCost > 0) {
                header.createEl('span', { cls: 'qb-levelup-skill-mana', text: `${skill.manaCost} MP` });
            }

            // Description
            skillCard.createEl('p', { cls: 'qb-levelup-skill-desc', text: skill.description });

            // Once per battle indicator
            if (skill.usesPerBattle !== undefined) {
                skillCard.createEl('span', { cls: 'qb-levelup-skill-once', text: '⭐ Ultimate' });
            }
        }
    }

    private spawnConfetti() {
        const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8b00ff', '#ff69b4', '#ffd700'];
        const container = document.createElement('div');
        container.className = 'qb-confetti-container';
        document.body.appendChild(container);

        // Spawn 50 confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'qb-confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
            container.appendChild(confetti);
        }

        // Remove container after animation
        setTimeout(() => {
            container.remove();
        }, 4000);
    }

    private getTrainingRoman(level: number): string {
        const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        return numerals[Math.min(level - 1, 9)] || 'I';
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
