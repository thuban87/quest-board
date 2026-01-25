/**
 * Blacksmith Modal
 * 
 * Smelting UI for combining 3 items of the same tier into
 * 1 item of the next tier up (or Legendary refinement).
 * 
 * Uses click-to-select for item selection.
 */

import { Modal, App, Notice } from 'obsidian';
import {
    GearItem,
    GearSlot,
    GearTier,
    TIER_INFO,
    GEAR_SLOT_NAMES,
    GEAR_TIERS,
    LootReward,
} from '../models/Gear';
import { useCharacterStore } from '../store/characterStore';
import {
    smeltingService,
    SmeltValidation,
    SMELT_ITEM_COUNT,
    LEGENDARY_REFINEMENT_COST,
} from '../services/SmeltingService';
import { showLootModal } from './LootModal';

// ============================================
// Types
// ============================================

interface BlacksmithModalOptions {
    onSmelt?: (outputItem: GearItem) => void;
    onClose?: () => void;
}

// ============================================
// Blacksmith Modal
// ============================================

export class BlacksmithModal extends Modal {
    private options: BlacksmithModalOptions;
    private selectedItems: GearItem[] = [];
    private contentContainer: HTMLElement | null = null;
    private tierFilter: GearTier | 'all' = 'all';

    constructor(app: App, options: BlacksmithModalOptions = {}) {
        super(app);
        this.options = options;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-blacksmith-modal');

        // Add class to modal container for width styling
        this.modalEl.addClass('qb-modal-wide');

        // Header
        contentEl.createEl('div', { cls: 'qb-modal-header' }).innerHTML = `
            <span class="qb-modal-icon">🔨</span>
            <div class="qb-modal-title-group">
                <h2>The Blacksmith</h2>
                <p class="qb-modal-subtitle">"Three into one, stronger than before..."</p>
            </div>
        `;

        // Instructions
        const instructionsEl = contentEl.createEl('div', { cls: 'qb-blacksmith-instructions' });
        instructionsEl.innerHTML = `
            <p>Select <strong>3 items of the same tier</strong> to smelt into 1 higher-tier item.</p>
            <ul>
                <li>✅ <strong>Same-slot bonus:</strong> 3 items of same slot → guaranteed that slot</li>
                <li>🎲 Mixed slots → random slot from inputs</li>
                <li>📊 Output level = average of input levels (rounded up)</li>
            </ul>
        `;

        // Main container (two panes)
        const mainContainer = contentEl.createEl('div', { cls: 'qb-blacksmith-container' });

        // Left pane: Inventory grid with filters
        const leftPane = mainContainer.createEl('div', { cls: 'qb-blacksmith-inventory-pane' });

        // Filter bar
        const filterBar = leftPane.createEl('div', { cls: 'qb-blacksmith-filter-bar' });
        filterBar.createEl('span', { text: 'Filter by tier: ' });

        const tierSelect = filterBar.createEl('select', { cls: 'qb-tier-filter' });
        tierSelect.createEl('option', { value: 'all', text: 'All Tiers' });
        for (const tier of GEAR_TIERS) {
            if (tier === 'legendary') continue; // Can only refine, not smelt legendaries
            const tierInfo = TIER_INFO[tier];
            tierSelect.createEl('option', { value: tier, text: `${tierInfo.emoji} ${tierInfo.name}` });
        }
        tierSelect.createEl('option', { value: 'legendary', text: `${TIER_INFO.legendary.emoji} Legendary (Refinement)` });

        tierSelect.addEventListener('change', () => {
            this.tierFilter = tierSelect.value as GearTier | 'all';
            this.renderInventoryGrid();
        });

        // Inventory grid container
        this.contentContainer = leftPane.createEl('div', { cls: 'qb-blacksmith-inventory-grid' });

        // Right pane: Selected items + preview
        const rightPane = mainContainer.createEl('div', { cls: 'qb-blacksmith-smelt-pane' });
        rightPane.createEl('h3', { text: 'Smelting Slots' });

        // 3 slot display
        const slotsContainer = rightPane.createEl('div', { cls: 'qb-smelt-slots' });
        for (let i = 0; i < SMELT_ITEM_COUNT; i++) {
            const slot = slotsContainer.createEl('div', { cls: 'qb-smelt-slot empty', attr: { 'data-slot': String(i) } });
            slot.createEl('span', { cls: 'qb-smelt-slot-number', text: String(i + 1) });
            slot.createEl('span', { cls: 'qb-smelt-slot-icon', text: '?' });
            slot.createEl('span', { cls: 'qb-smelt-slot-name', text: 'Empty' });
        }

        // Preview section
        const previewSection = rightPane.createEl('div', { cls: 'qb-smelt-preview' });
        previewSection.createEl('h4', { text: 'Result Preview' });
        const previewContent = previewSection.createEl('div', { cls: 'qb-smelt-preview-content' });
        previewContent.createEl('p', { cls: 'qb-preview-empty', text: 'Select 3 items to see preview' });

        // Validation message
        rightPane.createEl('div', { cls: 'qb-smelt-validation' });

        // Buttons
        const buttonContainer = rightPane.createEl('div', { cls: 'qb-blacksmith-buttons' });

        const clearBtn = buttonContainer.createEl('button', {
            cls: 'qb-btn-secondary',
            text: '🗑️ Clear Selection',
        });
        clearBtn.addEventListener('click', () => {
            this.selectedItems = [];
            this.updateUI();
        });

        const smeltBtn = buttonContainer.createEl('button', {
            cls: 'mod-cta qb-smelt-btn',
            text: '🔨 Smelt!',
        });
        smeltBtn.disabled = true;
        smeltBtn.addEventListener('click', () => this.performSmelt());

        // Render initial content
        this.renderInventoryGrid();
    }

    private renderInventoryGrid() {
        if (!this.contentContainer) return;
        this.contentContainer.empty();

        const character = useCharacterStore.getState().character;
        if (!character) {
            this.contentContainer.createEl('p', { text: 'No character found.' });
            return;
        }

        // Get available items (not pending smelt, not equipped)
        let items = character.gearInventory.filter(item => item.status !== 'pending_smelt');

        // Apply tier filter
        if (this.tierFilter !== 'all') {
            items = items.filter(item => item.tier === this.tierFilter);
        }

        // Sort by tier then level
        items.sort((a, b) => {
            const tierDiff = GEAR_TIERS.indexOf(a.tier) - GEAR_TIERS.indexOf(b.tier);
            if (tierDiff !== 0) return tierDiff;
            return b.level - a.level;
        });

        if (items.length === 0) {
            this.contentContainer.createEl('p', {
                cls: 'qb-inventory-empty',
                text: this.tierFilter === 'all'
                    ? 'No items in inventory'
                    : `No ${TIER_INFO[this.tierFilter as GearTier].name} items`
            });
            return;
        }

        // Create grid
        const grid = this.contentContainer.createEl('div', { cls: 'qb-gear-grid-compact' });

        for (const item of items) {
            const tierInfo = TIER_INFO[item.tier];
            const isSelected = this.selectedItems.some(s => s.id === item.id);

            // Check if this item can be added (have room for more items)
            const canSelect = this.selectedItems.length < SMELT_ITEM_COUNT;

            const itemEl = grid.createEl('div', {
                cls: `qb-gear-item-compact qb-tier-${item.tier} ${isSelected ? 'selected' : ''} ${!canSelect && !isSelected ? 'disabled' : ''}`,
            });

            itemEl.addEventListener('click', () => {
                if (isSelected) {
                    // Deselect
                    this.selectedItems = this.selectedItems.filter(s => s.id !== item.id);
                } else if (canSelect) {
                    // Select
                    this.selectedItems.push(item);
                }
                this.updateUI();
            });

            // Icon
            const iconEl = itemEl.createEl('div', { cls: 'qb-gear-icon', text: item.iconEmoji });
            iconEl.style.borderColor = tierInfo.color;

            // Info
            const infoEl = itemEl.createEl('div', { cls: 'qb-gear-info' });
            const nameEl = infoEl.createEl('div', { cls: 'qb-gear-name', text: item.name });
            nameEl.style.color = tierInfo.color;
            infoEl.createEl('div', {
                cls: 'qb-gear-meta',
                text: `${tierInfo.emoji} Lv${item.level} • ${GEAR_SLOT_NAMES[item.slot]}`
            });

            // Selection indicator
            if (isSelected) {
                itemEl.createEl('div', { cls: 'qb-selection-check', text: '✓' });
            }
        }
    }

    private updateUI() {
        // Re-render inventory to update selection states
        this.renderInventoryGrid();

        // Update slot display
        const slotsContainer = this.contentEl.querySelector('.qb-smelt-slots');
        if (slotsContainer) {
            const slots = slotsContainer.querySelectorAll('.qb-smelt-slot');
            slots.forEach((slot, index) => {
                const item = this.selectedItems[index];
                if (item) {
                    const tierInfo = TIER_INFO[item.tier];
                    slot.removeClass('empty');
                    slot.addClass(`qb-tier-${item.tier}`);
                    slot.querySelector('.qb-smelt-slot-icon')!.textContent = item.iconEmoji;
                    slot.querySelector('.qb-smelt-slot-name')!.textContent = item.name;
                    (slot as HTMLElement).style.borderColor = tierInfo.color;
                } else {
                    slot.className = 'qb-smelt-slot empty';
                    slot.querySelector('.qb-smelt-slot-icon')!.textContent = '?';
                    slot.querySelector('.qb-smelt-slot-name')!.textContent = 'Empty';
                    (slot as HTMLElement).style.borderColor = '';
                }
            });
        }

        // Update preview
        const previewContent = this.contentEl.querySelector('.qb-smelt-preview-content');
        if (previewContent) {
            previewContent.empty();

            if (this.selectedItems.length === SMELT_ITEM_COUNT) {
                const preview = smeltingService.previewSmelt(this.selectedItems);
                if (preview) {
                    const tierInfo = TIER_INFO[preview.outputTier];

                    const previewEl = previewContent.createEl('div', { cls: `qb-preview-item qb-tier-${preview.outputTier}` });
                    previewEl.innerHTML = `
                        <span class="qb-preview-tier" style="color: ${tierInfo.color}">${tierInfo.emoji} ${tierInfo.name}</span>
                        <span class="qb-preview-level">Level ~${preview.outputLevel}</span>
                        <span class="qb-preview-slot">${preview.outputSlot === 'random' ? '🎲 Random Slot' : `${GEAR_SLOT_NAMES[preview.outputSlot]}`}</span>
                    `;

                    if (preview.hasSameSlotBonus) {
                        previewContent.createEl('p', {
                            cls: 'qb-preview-bonus',
                            text: '✅ Same-slot bonus active!'
                        });
                    }

                    if (preview.isLegendaryRefinement) {
                        previewContent.createEl('p', {
                            cls: 'qb-preview-cost',
                            text: `💰 Cost: ${preview.goldCost.toLocaleString()}g`
                        });
                    }
                }
            } else {
                previewContent.createEl('p', {
                    cls: 'qb-preview-empty',
                    text: `Select ${SMELT_ITEM_COUNT - this.selectedItems.length} more item${SMELT_ITEM_COUNT - this.selectedItems.length !== 1 ? 's' : ''}`
                });
            }
        }

        // Update validation message
        const validationEl = this.contentEl.querySelector('.qb-smelt-validation');
        if (validationEl) {
            validationEl.empty();

            if (this.selectedItems.length === SMELT_ITEM_COUNT) {
                const validation = smeltingService.canSmelt(this.selectedItems);
                if (!validation.valid) {
                    validationEl.createEl('p', {
                        cls: 'qb-validation-error',
                        text: `⚠️ ${validation.error}`
                    });
                }
            }
        }

        // Update smelt button
        const smeltBtn = this.contentEl.querySelector('.qb-smelt-btn') as HTMLButtonElement;
        if (smeltBtn) {
            const validation = smeltingService.canSmelt(this.selectedItems);
            smeltBtn.disabled = !validation.valid;

            if (validation.isLegendaryRefinement) {
                smeltBtn.textContent = `🔨 Refine for ${LEGENDARY_REFINEMENT_COST.toLocaleString()}g`;
            } else {
                smeltBtn.textContent = '🔨 Smelt!';
            }
        }
    }

    private async performSmelt() {
        if (this.selectedItems.length !== SMELT_ITEM_COUNT) return;

        const validation = smeltingService.canSmelt(this.selectedItems);
        if (!validation.valid) {
            new Notice(`Cannot smelt: ${validation.error}`);
            return;
        }

        // Disable button during operation
        const smeltBtn = this.contentEl.querySelector('.qb-smelt-btn') as HTMLButtonElement;
        if (smeltBtn) {
            smeltBtn.disabled = true;
            smeltBtn.textContent = '⚒️ Smelting...';
        }

        try {
            const result = await smeltingService.smelt(
                this.selectedItems as [GearItem, GearItem, GearItem]
            );

            if (result.success && result.outputItem) {
                // Call save callback FIRST to persist changes
                if (this.options.onSmelt) {
                    this.options.onSmelt(result.outputItem);
                }

                // Close this modal
                this.close();

                // Show the created item in a loot modal (allows compare to equipped)
                const loot: LootReward[] = [{ type: 'gear', item: result.outputItem }];
                showLootModal(this.app, {
                    title: '⚒️ Smelting Complete!',
                    subtitle: 'Your new item has been created',
                    loot,
                });
            } else {
                new Notice(`❌ Smelting failed: ${result.error}`, 4000);
                // Re-enable button on failure
                if (smeltBtn) {
                    smeltBtn.disabled = false;
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('[BlacksmithModal] Smelt error:', error);
            new Notice('❌ An error occurred during smelting', 4000);
            // Re-enable button on error
            if (smeltBtn) {
                smeltBtn.disabled = false;
                this.updateUI();
            }
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        if (this.options.onClose) {
            this.options.onClose();
        }
    }
}

/**
 * Show the blacksmith modal (convenience function)
 */
export function showBlacksmithModal(app: App, options: BlacksmithModalOptions = {}): void {
    new BlacksmithModal(app, options).open();
}
