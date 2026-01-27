/**
 * Elite Encounter Modal
 * 
 * Shows before elite overworld fights start, giving player choice to fight or flee.
 * Only appears for elite monsters in random overworld encounters.
 */

import { App, Modal, Notice } from 'obsidian';
import type { Monster } from '../models/Monster';
import { useCharacterStore } from '../store/characterStore';
import { battleService } from '../services/BattleService';
import { getMonsterGifPath } from '../services/SpriteService';

// =====================
// MODAL OPTIONS
// =====================

export interface EliteEncounterModalOptions {
    /** Callback when player accepts the fight */
    onFight?: () => void;
    /** Callback when player flees */
    onFlee?: () => void;
    /** Save callback for persistence */
    onSave?: () => Promise<void>;
    /** Callback to open battle view after battle starts */
    onBattleStart?: () => void;
    /** Plugin manifest directory for sprite resolution */
    manifestDir?: string;
}

// =====================
// ELITE ENCOUNTER MODAL
// =====================

export class EliteEncounterModal extends Modal {
    private monster: Monster;
    private options: EliteEncounterModalOptions;

    constructor(app: App, monster: Monster, options: EliteEncounterModalOptions = {}) {
        super(app);
        this.monster = monster;
        this.options = options;
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-elite-encounter-modal');
        modalEl.addClass('qb-modal-elite-encounter');

        this.render();
    }

    private render() {
        const { contentEl } = this;
        const store = useCharacterStore.getState();
        const character = store.character;

        if (!character) {
            contentEl.createEl('p', { text: 'No character loaded.' });
            return;
        }

        // Header with warning
        const header = contentEl.createDiv('qb-elite-header');
        header.createEl('div', { cls: 'qb-elite-warning-icon', text: '⚠️' });
        header.createEl('h2', { text: 'ELITE MONSTER!' });

        // Warning message
        const warningBox = contentEl.createDiv('qb-elite-warning-box');
        warningBox.createEl('p', {
            text: 'A powerful elite creature blocks your path. You may flee without penalty, or stand and fight for greater rewards.',
            cls: 'qb-elite-warning-text'
        });

        // Monster preview with elite styling
        const monsterPreview = contentEl.createDiv('qb-elite-monster-preview');
        monsterPreview.addClass('elite'); // For CSS glow animation

        const monsterIcon = monsterPreview.createDiv('qb-elite-monster-icon');

        // Try to show monster sprite, fallback to emoji
        if (this.options.manifestDir && this.monster.templateId) {
            const spritePath = getMonsterGifPath(
                this.options.manifestDir,
                this.app.vault.adapter,
                this.monster.templateId
            );
            const img = monsterIcon.createEl('img', {
                attr: {
                    src: spritePath,
                    alt: this.monster.name,
                },
                cls: 'qb-monster-sprite-img',
            });
            // Fallback to emoji on error
            img.onerror = () => {
                img.remove();
                monsterIcon.textContent = this.monster.emoji;
            };
        } else {
            monsterIcon.textContent = this.monster.emoji;
        }

        const monsterInfo = monsterPreview.createDiv('qb-elite-monster-info');

        // Name with elite badge
        const nameEl = monsterInfo.createEl('div', { cls: 'qb-elite-monster-name' });
        nameEl.textContent = this.monster.name;
        nameEl.createEl('span', { text: 'ELITE', cls: 'qb-elite-badge' });

        monsterInfo.createEl('div', {
            text: `Level ${this.monster.level}`,
            cls: 'qb-elite-monster-level'
        });

        // Monster stats preview
        const statsBox = contentEl.createDiv('qb-elite-stats');
        statsBox.createEl('div', {
            text: `HP: ${this.monster.maxHP}`,
            cls: 'qb-elite-stat'
        });
        statsBox.createEl('div', {
            text: `ATK: ${this.monster.attack}`,
            cls: 'qb-elite-stat'
        });

        // Rewards hint
        const rewardsHint = contentEl.createDiv('qb-elite-rewards-hint');
        rewardsHint.createEl('p', {
            text: '🎁 Elite monsters drop better loot and more gold!',
            cls: 'qb-elite-rewards-text'
        });

        // Buttons
        const buttonContainer = contentEl.createDiv('qb-elite-buttons');

        const fightBtn = buttonContainer.createEl('button', {
            text: '⚔️ Fight',
            cls: 'qb-elite-fight-btn',
        });
        fightBtn.onclick = () => this.handleFight();

        const fleeBtn = buttonContainer.createEl('button', {
            text: '🏃 Flee',
            cls: 'qb-bounty-flee-btn',
        });
        fleeBtn.onclick = () => this.handleFlee();
    }

    private handleFight() {
        const store = useCharacterStore.getState();
        const character = store.character;

        if (!character) {
            new Notice('❌ No character found!', 2000);
            this.close();
            return;
        }

        // Start the battle with this elite monster
        const started = battleService.startBattleWithMonster(this.monster);

        if (started) {
            new Notice('⚔️ Engaging elite monster!', 2000);
            this.options.onFight?.();
            if (this.options.onSave) this.options.onSave();
            this.options.onBattleStart?.();
        } else {
            new Notice('❌ Failed to start battle.', 2000);
        }

        this.close();
    }

    private handleFlee() {
        new Notice('🏃 You fled from the elite monster. No shame in survival!', 2000);
        this.options.onFlee?.();
        this.close();
    }

    onClose() {
        this.contentEl.empty();
    }
}

// =====================
// HELPER FUNCTION
// =====================

/**
 * Show the elite encounter modal for an elite overworld spawn.
 */
export function showEliteEncounterModal(
    app: App,
    monster: Monster,
    options: EliteEncounterModalOptions = {}
): void {
    new EliteEncounterModal(app, monster, options).open();
}
