/**
 * Level Up Modal
 * 
 * Celebratory modal shown when player levels up.
 * Shows class-themed message and celebration.
 */

import { Modal, App } from 'obsidian';
import { CharacterClass, CLASS_INFO } from '../models/Character';
import { getLevelUpMessage, canGraduate, MAX_TRAINING_LEVEL } from '../services/XPSystem';

export class LevelUpModal extends Modal {
    private characterClass: CharacterClass;
    private newLevel: number;
    private tierChanged: boolean;
    private isTraining: boolean;
    private onGraduate?: () => void;

    constructor(
        app: App,
        characterClass: CharacterClass,
        newLevel: number,
        tierChanged: boolean,
        isTraining: boolean,
        onGraduate?: () => void
    ) {
        super(app);
        this.characterClass = characterClass;
        this.newLevel = newLevel;
        this.tierChanged = tierChanged;
        this.isTraining = isTraining;
        this.onGraduate = onGraduate;
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

            const closeBtn = contentEl.createEl('button', {
                cls: 'mod-cta',
                text: 'Continue'
            });
            closeBtn.addEventListener('click', () => this.close());
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
