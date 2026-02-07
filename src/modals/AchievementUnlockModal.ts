/**
 * Achievement Unlock Modal
 * 
 * Celebratory popup that appears when an achievement is unlocked.
 * Displays emoji, name, description, XP bonus with confetti animation.
 */

import { App, Modal } from 'obsidian';
import { Achievement } from '../models/Achievement';

export class AchievementUnlockModal extends Modal {
    private achievement: Achievement;

    constructor(app: App, achievement: Achievement) {
        super(app);
        this.achievement = achievement;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-achievement-unlock-modal');

        // Container
        const container = contentEl.createDiv({ cls: 'qb-unlock-container' });

        // Header
        container.createEl('h2', {
            text: '🏆 Achievement Unlocked!',
            cls: 'qb-unlock-header'
        });

        // Emoji display
        const badgeContainer = container.createDiv({ cls: 'qb-unlock-badge-container' });
        badgeContainer.createSpan({
            text: this.achievement.emoji,
            cls: 'qb-unlock-badge-emoji',
        });

        // Achievement name
        container.createEl('h3', {
            text: this.achievement.name,
            cls: 'qb-unlock-name',
        });

        // Description
        container.createEl('p', {
            text: this.achievement.description,
            cls: 'qb-unlock-desc',
        });

        // XP Bonus
        container.createEl('div', {
            text: `+${this.achievement.xpBonus} XP`,
            cls: 'qb-unlock-xp',
        });

        // Continue button
        const btnContainer = container.createDiv({ cls: 'qb-unlock-btn-container' });
        const btn = btnContainer.createEl('button', {
            text: 'Continue',
            cls: 'qb-unlock-btn',
        });
        btn.addEventListener('click', () => this.close());

        // Trigger confetti
        this.spawnConfetti();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private spawnConfetti() {
        const container = document.createElement('div');
        container.className = 'qb-confetti-container';
        document.body.appendChild(container);

        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96f', '#ff9f43'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'qb-confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
            container.appendChild(confetti);
        }

        // Clean up after animation
        setTimeout(() => container.remove(), 4000);
    }
}

/**
 * Show achievement unlock popup
 */
export function showAchievementUnlock(app: App, achievement: Achievement): void {
    new AchievementUnlockModal(app, achievement).open();
}
