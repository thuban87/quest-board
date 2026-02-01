/**
 * AI Dungeon Wizard Modal
 * 
 * Multi-step wizard for generating AI dungeons:
 * Step 1: Quota display + Tileset selection
 * Step 2: Size and difficulty
 * Step 3: Monster preferences
 * Step 4: Loot focus + Generate
 */

import { App, Modal, Notice, Setting } from 'obsidian';
import type { QuestBoardSettings } from '../settings';
import type { TileSet, DungeonDifficulty } from '../models/Dungeon';
import type { GearSlot } from '../models/Gear';
import { aiDungeonService, type AIDungeonInput } from '../services/AIDungeonService';

type WizardStep = 1 | 2 | 3 | 4;

interface WizardState {
    name: string;
    tileset: TileSet;
    roomCount: number;
    difficulty: DungeonDifficulty;
    architecture: 'linear' | 'linear-branches' | 'multi-path';
    monsterCategories: string[];
    bossType: string;
    lootSlots: GearSlot[] | 'balanced';
}

export class AIDungeonWizardModal extends Modal {
    private settings: QuestBoardSettings;
    private saveCallback: () => Promise<void>;
    private currentStep: WizardStep = 1;
    private state: WizardState = {
        name: '',
        tileset: 'cave',
        roomCount: 12,
        difficulty: 'medium',
        architecture: 'linear',
        monsterCategories: ['auto'],
        bossType: '',
        lootSlots: 'balanced',
    };
    private isGenerating = false;
    private generationPhase = '';  // Current phase for progress display
    private lastError = '';        // Store error for retry

    constructor(
        app: App,
        settings: QuestBoardSettings,
        saveCallback: () => Promise<void>
    ) {
        super(app);
        this.settings = settings;
        this.saveCallback = saveCallback;

        // Initialize service
        aiDungeonService.initialize(settings, saveCallback);
    }

    onOpen(): void {
        this.renderStep();
    }

    onClose(): void {
        this.contentEl.empty();
    }

    private renderStep(): void {
        this.contentEl.empty();
        this.contentEl.addClass('qb-ai-dungeon-wizard');

        switch (this.currentStep) {
            case 1:
                this.renderStep1();
                break;
            case 2:
                this.renderStep2();
                break;
            case 3:
                this.renderStep3();
                break;
            case 4:
                this.renderStep4();
                break;
        }
    }

    /**
     * Step 1: Quota + Theme Selection
     */
    private renderStep1(): void {
        const { contentEl } = this;

        // Header
        contentEl.createEl('h2', { text: '🎲 Generate AI Dungeon' });
        contentEl.createEl('p', {
            text: 'Step 1 of 4: Theme Selection',
            cls: 'qb-wizard-step-indicator'
        });

        // Quota display
        const remaining = aiDungeonService.getRemainingGenerations();
        const max = this.settings.aiDungeonMaxDaily;
        const quotaDiv = contentEl.createDiv({ cls: 'qb-wizard-quota' });

        if (remaining > 0) {
            quotaDiv.createEl('p', {
                text: `✨ You have ${remaining} of ${max} dungeon generations remaining today`,
                cls: 'qb-quota-ok'
            });
        } else {
            quotaDiv.createEl('p', {
                text: `⏳ Daily limit reached (${max} dungeons). Resets at midnight UTC.`,
                cls: 'qb-quota-exhausted'
            });
        }

        // Check for API key
        if (!this.settings.geminiApiKey) {
            contentEl.createEl('p', {
                text: '⚠️ No API key configured. Add your Gemini API key in Quest Board settings.',
                cls: 'qb-wizard-warning'
            });
            this.renderCloseButton();
            return;
        }

        // Tileset selection
        new Setting(contentEl)
            .setName('Dungeon Theme')
            .setDesc('Choose the visual style and atmosphere')
            .addDropdown(dropdown => dropdown
                .addOption('cave', '🕳️ Cave - Dark caverns, gravel floors')
                .addOption('forest', '🌲 Forest - Outdoor ruins, grass floors')
                .addOption('dungeon', '🏰 Dungeon - Classic stone dungeon')
                .addOption('castle', '🏯 Castle - Castle interior, metal floors')
                .setValue(this.state.tileset)
                .onChange(value => {
                    this.state.tileset = value as TileSet;
                }));

        // Optional name
        new Setting(contentEl)
            .setName('Dungeon Name (Optional)')
            .setDesc('Leave blank for AI to generate a thematic name')
            .addText(text => text
                .setPlaceholder('e.g., "The Goblin Warrens"')
                .setValue(this.state.name)
                .onChange(value => {
                    this.state.name = value;
                }));

        // Navigation
        this.renderNavigation(false, remaining > 0);
    }

    /**
     * Step 2: Size and Difficulty
     */
    private renderStep2(): void {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: '📐 Size & Difficulty' });
        contentEl.createEl('p', {
            text: 'Step 2 of 4: Configure dungeon scale',
            cls: 'qb-wizard-step-indicator'
        });

        // Room count slider
        const roomSetting = new Setting(contentEl)
            .setName('Number of Rooms')
            .setDesc(`${this.state.roomCount} rooms`);

        roomSetting.addSlider(slider => slider
            .setLimits(8, 25, 1)
            .setValue(this.state.roomCount)
            .setDynamicTooltip()
            .onChange(value => {
                this.state.roomCount = value;
                roomSetting.setDesc(`${value} rooms`);
            }));

        // Difficulty
        new Setting(contentEl)
            .setName('Difficulty')
            .setDesc('Affects monster strength and loot quality')
            .addDropdown(dropdown => dropdown
                .addOption('easy', '🟢 Easy - Gentle adventure')
                .addOption('medium', '🟡 Medium - Balanced challenge')
                .addOption('hard', '🔴 Hard - Serious danger')
                .setValue(this.state.difficulty)
                .onChange(value => {
                    this.state.difficulty = value as DungeonDifficulty;
                }));

        // Architecture selection
        new Setting(contentEl)
            .setName('Layout Style')
            .setDesc('How rooms connect')
            .addDropdown(dropdown => dropdown
                .addOption('linear', '📍 Linear - Single path to boss')
                .addOption('linear-branches', '🔀 Branching - Main path + side rooms')
                .addOption('multi-path', '🗺️ Multi-path - Multiple routes')
                .setValue(this.state.architecture)
                .onChange(value => {
                    this.state.architecture = value as 'linear' | 'linear-branches' | 'multi-path';
                }));

        // Navigation
        this.renderNavigation(true, true);
    }

    /**
     * Step 3: Monster Preferences
     */
    private renderStep3(): void {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: '👹 Monster Selection' });
        contentEl.createEl('p', {
            text: 'Step 3 of 4: Choose your foes',
            cls: 'qb-wizard-step-indicator'
        });

        // Auto vs manual selection
        const autoSetting = new Setting(contentEl)
            .setName('Monster Selection')
            .addDropdown(dropdown => dropdown
                .addOption('auto', '🎲 Auto (AI picks based on theme)')
                .addOption('manual', '✋ Manual (choose categories)')
                .setValue(this.state.monsterCategories.includes('auto') ? 'auto' : 'manual')
                .onChange(value => {
                    if (value === 'auto') {
                        this.state.monsterCategories = ['auto'];
                    } else {
                        this.state.monsterCategories = [];
                    }
                    this.renderStep(); // Re-render to show/hide checkboxes
                }));

        // Manual category selection (if not auto)
        if (!this.state.monsterCategories.includes('auto')) {
            const categories = [
                { id: 'beasts', label: '🐺 Beasts', desc: 'wolf, bear, giant-rat' },
                { id: 'undead', label: '💀 Undead', desc: 'skeleton, zombie, ghost' },
                { id: 'goblins', label: '👺 Goblins', desc: 'goblin, hobgoblin, bugbear' },
                { id: 'trolls', label: '🧌 Trolls', desc: 'cave-troll, river-troll' },
                { id: 'night_elves', label: '🌑 Night Elves', desc: 'shadow-elf, dark-ranger' },
                { id: 'dwarves', label: '⛏️ Dwarves', desc: 'rogue-dwarf, berserker' },
                { id: 'dragonkin', label: '🐉 Dragonkin', desc: 'drake, wyvern' },
                { id: 'aberrations', label: '👁️ Aberrations', desc: 'mimic, eye-beast' },
            ];

            const categoryDiv = contentEl.createDiv({ cls: 'qb-wizard-categories' });
            categoryDiv.createEl('p', { text: 'Select at least one category:', cls: 'setting-item-description' });

            for (const cat of categories) {
                new Setting(categoryDiv)
                    .setName(cat.label)
                    .setDesc(cat.desc)
                    .addToggle(toggle => toggle
                        .setValue(this.state.monsterCategories.includes(cat.id))
                        .onChange(value => {
                            if (value) {
                                this.state.monsterCategories.push(cat.id);
                            } else {
                                this.state.monsterCategories = this.state.monsterCategories.filter(c => c !== cat.id);
                            }
                        }));
            }
        }

        // Navigation
        this.renderNavigation(true, true);
    }

    /**
     * Step 4: Loot Focus + Generate
     */
    private renderStep4(): void {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: '💎 Loot & Confirm' });
        contentEl.createEl('p', {
            text: 'Step 4 of 4: Final settings',
            cls: 'qb-wizard-step-indicator'
        });

        // Loot focus
        new Setting(contentEl)
            .setName('Loot Focus')
            .setDesc('What gear types should the dungeon favor?')
            .addDropdown(dropdown => dropdown
                .addOption('balanced', '⚖️ Balanced (all slots)')
                .addOption('weapons', '⚔️ Weapons Focus')
                .addOption('armor', '🛡️ Armor Focus')
                .addOption('accessories', '💍 Accessories Focus')
                .setValue(this.getLootDropdownValue())
                .onChange(value => {
                    switch (value) {
                        case 'balanced':
                            this.state.lootSlots = 'balanced';
                            break;
                        case 'weapons':
                            this.state.lootSlots = ['weapon', 'shield'];
                            break;
                        case 'armor':
                            this.state.lootSlots = ['chest', 'head', 'legs', 'boots'];
                            break;
                        case 'accessories':
                            this.state.lootSlots = ['accessory1', 'accessory2', 'accessory3'];
                            break;
                    }
                }));

        // Summary
        const summaryDiv = contentEl.createDiv({ cls: 'qb-wizard-summary' });
        summaryDiv.createEl('h3', { text: '📋 Summary' });

        const summaryList = summaryDiv.createEl('ul');
        summaryList.createEl('li', { text: `Theme: ${this.getTilesetLabel(this.state.tileset)}` });
        summaryList.createEl('li', { text: `Name: ${this.state.name || '(AI will generate)'}` });
        summaryList.createEl('li', { text: `Rooms: ${this.state.roomCount}` });
        summaryList.createEl('li', { text: `Difficulty: ${this.state.difficulty}` });
        summaryList.createEl('li', { text: `Monsters: ${this.getMonsterSummary()}` });
        summaryList.createEl('li', { text: `Loot: ${this.getLootSummary()}` });

        // Show save location
        const folder = this.settings.userDungeonFolder || 'Quest Board/dungeons';
        summaryList.createEl('li', { text: `📁 Save to: ${folder}` });

        // Generate button
        const buttonDiv = contentEl.createDiv({ cls: 'qb-wizard-generate' });

        if (this.isGenerating) {
            const spinnerDiv = buttonDiv.createDiv({ cls: 'qb-wizard-spinner' });

            // Show current phase
            const phaseText = this.generationPhase || 'Starting...';
            spinnerDiv.createEl('span', { text: `🔮 ${phaseText}` });
            spinnerDiv.createEl('p', {
                text: 'This may take 1-3 minutes (2 AI passes)',
                cls: 'qb-wizard-spinner-hint'
            });
            spinnerDiv.createEl('p', {
                text: '💡 Feel free to close this window. The dungeon file will appear in your folder when ready.',
                cls: 'qb-wizard-spinner-hint'
            });
        } else if (this.lastError) {
            // Show error with retry button
            const errorDiv = buttonDiv.createDiv({ cls: 'qb-wizard-error' });
            errorDiv.createEl('p', { text: `❌ ${this.lastError}`, cls: 'qb-wizard-error-text' });

            const retryBtn = buttonDiv.createEl('button', {
                text: '🔄 Retry Generation',
                cls: 'mod-cta qb-wizard-generate-btn'
            });
            retryBtn.onclick = () => {
                this.lastError = '';
                this.handleGenerate();
            };
        } else {
            const generateBtn = buttonDiv.createEl('button', {
                text: '🎲 Generate Dungeon',
                cls: 'mod-cta qb-wizard-generate-btn'
            });
            generateBtn.onclick = () => this.handleGenerate();
        }

        // Back button only (no Next)
        const navDiv = contentEl.createDiv({ cls: 'qb-wizard-nav' });
        const backBtn = navDiv.createEl('button', { text: '← Back' });
        backBtn.onclick = () => {
            this.currentStep = 3;
            this.renderStep();
        };
    }

    /**
     * Handle dungeon generation
     */
    private async handleGenerate(): Promise<void> {
        this.isGenerating = true;
        this.renderStep();

        try {
            const input: AIDungeonInput = {
                name: this.state.name || undefined,
                tileset: this.state.tileset,
                difficulty: this.state.difficulty,
                roomCount: this.state.roomCount,
                architecture: this.state.architecture,
                monsterCategories: this.state.monsterCategories,
                bossType: this.state.bossType || undefined,
                lootSlots: this.state.lootSlots,
            };

            const result = await aiDungeonService.generateDungeon(input, (phase, detail) => {
                // Update progress display
                switch (phase) {
                    case 'generating':
                        this.generationPhase = 'Pass 1/2: Creating dungeon...';
                        break;
                    case 'validating':
                        this.generationPhase = 'Pass 2/2: Validating...';
                        break;
                    case 'saving':
                        this.generationPhase = 'Saving dungeon...';
                        break;
                }
                this.renderStep();  // Re-render to show updated phase
            });

            if (result.success && result.markdown && result.filename) {
                // Save to user dungeon folder
                const folder = this.settings.userDungeonFolder || 'Quest Board/dungeons';
                const path = `${folder}/${result.filename}`;

                // Ensure folder exists
                const folderExists = this.app.vault.getAbstractFileByPath(folder);
                if (!folderExists) {
                    await this.app.vault.createFolder(folder);
                }

                // Check if file exists and generate unique name
                let finalPath = path;
                let counter = 1;
                while (this.app.vault.getAbstractFileByPath(finalPath)) {
                    const baseName = result.filename.replace('.md', '');
                    finalPath = `${folder}/${baseName}_${counter}.md`;
                    counter++;
                }

                // Create the file
                await this.app.vault.create(finalPath, result.markdown);

                new Notice(`✅ Dungeon created: ${finalPath}`);
                this.close();

            } else {
                // Store error for retry button
                let errorMsg = result.error || 'Unknown error';
                if (result.validationErrors && result.validationErrors.length > 0) {
                    errorMsg += `\n(${result.validationErrors.slice(0, 2).join(', ')})`;
                }
                this.lastError = errorMsg;
                new Notice(`❌ Generation failed: ${result.error}`);
                this.isGenerating = false;
                this.generationPhase = '';
                this.renderStep();
            }

        } catch (error) {
            console.error('[AIDungeonWizard] Generation failed:', error);
            this.lastError = error instanceof Error ? error.message : 'Unknown error';
            new Notice(`❌ Error: ${this.lastError}`);
            this.isGenerating = false;
            this.generationPhase = '';
            this.renderStep();
        }
    }

    /**
     * Render navigation buttons
     */
    private renderNavigation(showBack: boolean, showNext: boolean): void {
        const navDiv = this.contentEl.createDiv({ cls: 'qb-wizard-nav' });

        if (showBack) {
            const backBtn = navDiv.createEl('button', { text: '← Back' });
            backBtn.onclick = () => {
                this.currentStep = (this.currentStep - 1) as WizardStep;
                this.renderStep();
            };
        }

        if (showNext) {
            const nextBtn = navDiv.createEl('button', {
                text: 'Next →',
                cls: 'mod-cta'
            });
            nextBtn.onclick = () => {
                // Validation for step 3 (monster selection)
                if (this.currentStep === 3 &&
                    !this.state.monsterCategories.includes('auto') &&
                    this.state.monsterCategories.length === 0) {
                    new Notice('Please select at least one monster category');
                    return;
                }
                this.currentStep = (this.currentStep + 1) as WizardStep;
                this.renderStep();
            };
        }
    }

    /**
     * Render close button (for error states)
     */
    private renderCloseButton(): void {
        const navDiv = this.contentEl.createDiv({ cls: 'qb-wizard-nav' });
        const closeBtn = navDiv.createEl('button', { text: 'Close' });
        closeBtn.onclick = () => this.close();
    }

    // Helper methods
    private getTilesetLabel(tileset: TileSet): string {
        const labels: Record<TileSet, string> = {
            cave: '🕳️ Cave',
            forest: '🌲 Forest',
            dungeon: '🏰 Dungeon',
            castle: '🏯 Castle',
        };
        return labels[tileset] || tileset;
    }

    private getMonsterSummary(): string {
        if (this.state.monsterCategories.includes('auto')) {
            return 'Auto (based on theme)';
        }
        return this.state.monsterCategories.join(', ') || 'None selected';
    }

    private getLootSummary(): string {
        if (this.state.lootSlots === 'balanced') return 'Balanced';
        return this.state.lootSlots.join(', ');
    }

    private getLootDropdownValue(): string {
        if (this.state.lootSlots === 'balanced') return 'balanced';
        const slots = this.state.lootSlots;
        if (slots.includes('weapon')) return 'weapons';
        if (slots.includes('chest')) return 'armor';
        if (slots.includes('accessory1')) return 'accessories';
        return 'balanced';
    }
}
