/**
 * Inventory Management Modal
 * 
 * Shown when inventory is full on loot drop (quest completion, dungeon exit).
 * Dual-pane UI allows user to:
 * - Mark pending loot as Keep/Trash
 * - Mark existing inventory items for bulk sell
 * - See running count of slots needed
 */

import { Modal, App, Notice } from 'obsidian';
import {
    GearItem,
    GearTier,
    TIER_INFO,
    GEAR_SLOT_NAMES,
    GEAR_TIERS,
    calculateSellValue,
} from '../models/Gear';
import { useCharacterStore } from '../store/characterStore';

// ============================================
// Types
// ============================================

export interface InventoryManagementModalOptions {
    /** New items pending acceptance */
    pendingLoot: GearItem[];
    /** Callback when user confirms their selections */
    onConfirm: (acceptedItems: GearItem[], itemsToSell: GearItem[]) => void;
    /** Callback when user abandons all pending loot */
    onAbandon: () => void;
    /** Optional title override */
    title?: string;
}

interface ItemSelection {
    /** Items from pending loot marked to keep */
    keepItems: Set<string>;
    /** Items from current inventory marked to sell */
    sellItems: Set<string>;
}

// ============================================
// Inventory Management Modal
// ============================================

export class InventoryManagementModal extends Modal {
    private options: InventoryManagementModalOptions;
    private selection: ItemSelection;

    constructor(app: App, options: InventoryManagementModalOptions) {
        super(app);
        this.options = options;

        // Initialize selection explicitly in constructor
        this.selection = {
            keepItems: new Set<string>(),
            sellItems: new Set<string>(),
        };

        // Default: try to keep all pending items
        for (const item of options.pendingLoot) {
            this.selection.keepItems.add(item.id);
        }
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-inventory-management-modal');

        // Add class to modal container for width styling
        this.modalEl.addClass('qb-modal-wide');

        console.log('[InventoryManagementModal] Opening with:', {
            pendingLoot: this.options.pendingLoot.length,
            pendingItems: this.options.pendingLoot.map(i => i.name),
        });

        const character = useCharacterStore.getState().character;
        if (!character) {
            contentEl.createEl('p', { text: 'No character found.' });
            return;
        }

        const freeSlots = character.inventoryLimit - character.gearInventory.length;
        const pendingCount = this.options.pendingLoot.length;
        const overLimit = pendingCount - freeSlots;

        // Header (centered)
        const headerEl = contentEl.createEl('div', { cls: 'qb-modal-header' });
        headerEl.style.justifyContent = 'center';
        headerEl.style.textAlign = 'center';
        headerEl.innerHTML = `
            <span class="qb-modal-icon">⚠️</span>
            <div class="qb-modal-title-group">
                <h2>${this.options.title || 'Inventory Full!'}</h2>
                <p class="qb-modal-subtitle">
                    You have <strong>${pendingCount}</strong> new item${pendingCount !== 1 ? 's' : ''} 
                    but only <strong>${Math.max(0, freeSlots)}</strong> free slot${freeSlots !== 1 ? 's' : ''}.
                </p>
            </div>
        `;

        // Status bar (updates dynamically)
        const statusBar = contentEl.createEl('div', { cls: 'qb-inventory-status-bar' });

        // Main container (two panes)
        const mainContainer = contentEl.createEl('div', { cls: 'qb-inventory-management-container' });

        // Left pane: Pending Loot
        const leftPane = mainContainer.createEl('div', { cls: 'qb-inventory-pane qb-pending-pane' });
        leftPane.createEl('h3', { text: `📦 Pending Loot (${pendingCount})` });
        const pendingGrid = leftPane.createEl('div', { cls: 'qb-inventory-grid' });

        console.log('[InventoryManagementModal] Rendering pending items...');
        for (const item of this.options.pendingLoot) {
            console.log('[InventoryManagementModal] Rendering item:', item.name);
            this.renderPendingItem(pendingGrid, item);
        }

        // Right pane: Current Inventory
        const rightPane = mainContainer.createEl('div', { cls: 'qb-inventory-pane qb-current-pane' });
        rightPane.createEl('h3', { text: `🎒 Current Inventory (${character.gearInventory.length}/${character.inventoryLimit})` });

        const currentGrid = rightPane.createEl('div', { cls: 'qb-inventory-grid' });

        // Sort inventory by tier (lowest first for easy selling)
        const sortedInventory = [...character.gearInventory].sort((a, b) => {
            return GEAR_TIERS.indexOf(a.tier) - GEAR_TIERS.indexOf(b.tier);
        });

        for (const item of sortedInventory) {
            this.renderCurrentItem(currentGrid, item);
        }

        // Buttons
        const buttonContainer = contentEl.createEl('div', { cls: 'qb-inventory-buttons' });

        const abandonBtn = buttonContainer.createEl('button', {
            cls: 'qb-btn-danger',
            text: '🗑️ Abandon All Loot',
        });
        abandonBtn.addEventListener('click', () => {
            this.options.onAbandon();
            this.close();
        });

        const confirmBtn = buttonContainer.createEl('button', {
            cls: 'mod-cta qb-confirm-btn',
            text: '✓ Confirm',
        });
        confirmBtn.addEventListener('click', () => this.confirmSelection());

        // Initial status update
        this.updateStatus();
    }

    private renderPendingItem(container: HTMLElement, item: GearItem) {
        const tierInfo = TIER_INFO[item.tier];
        const isKept = this.selection.keepItems.has(item.id);

        const itemEl = container.createEl('div', {
            cls: `qb-inventory-item qb-tier-${item.tier} ${isKept ? 'selected' : 'trashed'}`,
        });

        // Checkbox area (left)
        const checkArea = itemEl.createEl('div', {
            cls: `qb-item-check ${isKept ? 'checked' : ''}`
        });
        checkArea.createEl('span', { text: isKept ? '✓' : '✕' });

        // Item info
        const infoEl = itemEl.createEl('div', { cls: 'qb-item-info' });

        const headerRow = infoEl.createEl('div', { cls: 'qb-item-header' });
        headerRow.createEl('span', { cls: 'qb-item-icon', text: item.iconEmoji });
        const nameEl = headerRow.createEl('span', { cls: 'qb-item-name', text: item.name });
        nameEl.style.color = tierInfo.color;

        infoEl.createEl('div', {
            cls: 'qb-item-meta',
            text: `${tierInfo.emoji} Lv${item.level} • ${GEAR_SLOT_NAMES[item.slot]}`
        });

        // Action label
        const actionLabel = itemEl.createEl('div', {
            cls: `qb-item-action ${isKept ? 'keep' : 'trash'}`,
            text: isKept ? 'Keep' : 'Trash'
        });

        // Toggle on click
        itemEl.addEventListener('click', () => {
            if (isKept) {
                this.selection.keepItems.delete(item.id);
            } else {
                this.selection.keepItems.add(item.id);
            }
            this.refreshUI();
        });
    }

    private renderCurrentItem(container: HTMLElement, item: GearItem) {
        const tierInfo = TIER_INFO[item.tier];
        const isSelling = this.selection.sellItems.has(item.id);
        const sellValue = item.sellValue;

        const itemEl = container.createEl('div', {
            cls: `qb-inventory-item qb-tier-${item.tier} ${isSelling ? 'marked-sell' : ''}`,
        });

        // Checkbox area (left)
        const checkArea = itemEl.createEl('div', {
            cls: `qb-item-check ${isSelling ? 'checked' : ''}`
        });
        checkArea.createEl('span', { text: isSelling ? '🪙' : '' });

        // Item info
        const infoEl = itemEl.createEl('div', { cls: 'qb-item-info' });

        const headerRow = infoEl.createEl('div', { cls: 'qb-item-header' });
        headerRow.createEl('span', { cls: 'qb-item-icon', text: item.iconEmoji });
        const nameEl = headerRow.createEl('span', { cls: 'qb-item-name', text: item.name });
        nameEl.style.color = tierInfo.color;

        infoEl.createEl('div', {
            cls: 'qb-item-meta',
            text: `${tierInfo.emoji} Lv${item.level} • ${GEAR_SLOT_NAMES[item.slot]}`
        });

        // Sell value
        const sellLabel = itemEl.createEl('div', {
            cls: 'qb-item-sell-value',
            text: `🪙 ${sellValue}g`
        });

        // Toggle on click
        itemEl.addEventListener('click', () => {
            if (isSelling) {
                this.selection.sellItems.delete(item.id);
            } else {
                this.selection.sellItems.add(item.id);
            }
            this.refreshUI();
        });
    }

    private refreshUI() {
        // Re-render the entire modal to update states
        this.onOpen();
    }

    private updateStatus() {
        const statusBar = this.contentEl.querySelector('.qb-inventory-status-bar');
        if (!statusBar) return;

        statusBar.empty();

        const character = useCharacterStore.getState().character;
        if (!character) return;

        const keepCount = this.selection.keepItems.size;
        const sellCount = this.selection.sellItems.size;
        const trashCount = this.options.pendingLoot.length - keepCount;

        // Calculate total gold from selling
        const sellGold = character.gearInventory
            .filter(item => this.selection.sellItems.has(item.id))
            .reduce((sum, item) => sum + item.sellValue, 0);

        // Calculate slot math
        const currentUsed = character.gearInventory.length;
        const afterSell = currentUsed - sellCount;
        const afterAdd = afterSell + keepCount;
        const freeAfterSell = character.inventoryLimit - afterSell;
        const slotsNeeded = keepCount - freeAfterSell;
        const canConfirm = slotsNeeded <= 0;

        // Status text
        if (canConfirm) {
            statusBar.createEl('div', {
                cls: 'qb-status-ok',
                text: `✅ Ready! Keeping ${keepCount} item${keepCount !== 1 ? 's' : ''}, trashing ${trashCount}${sellCount > 0 ? `, selling ${sellCount} for ${sellGold}g` : ''}.`
            });
        } else {
            statusBar.createEl('div', {
                cls: 'qb-status-warning',
                text: `⚠️ Need to free ${slotsNeeded} more slot${slotsNeeded !== 1 ? 's' : ''}. Trash pending items or sell existing items.`
            });
        }

        // Running totals
        const totalsEl = statusBar.createEl('div', { cls: 'qb-status-totals' });
        totalsEl.innerHTML = `
            <span>📦 Keeping: <strong>${keepCount}</strong></span>
            <span>🗑️ Trashing: <strong>${trashCount}</strong></span>
            <span>💰 Selling: <strong>${sellCount}</strong> (${sellGold}g)</span>
            <span>📊 Result: <strong>${afterAdd}/${character.inventoryLimit}</strong></span>
        `;

        // Update confirm button state
        const confirmBtn = this.contentEl.querySelector('.qb-confirm-btn') as HTMLButtonElement;
        if (confirmBtn) {
            confirmBtn.disabled = !canConfirm;
            confirmBtn.textContent = sellCount > 0
                ? `✓ Confirm (+${sellGold}g)`
                : '✓ Confirm';
        }
    }

    private confirmSelection() {
        const character = useCharacterStore.getState().character;
        if (!character) return;

        // Gather items to accept
        const acceptedItems = this.options.pendingLoot.filter(
            item => this.selection.keepItems.has(item.id)
        );

        // Gather items to sell
        const itemsToSell = character.gearInventory.filter(
            item => this.selection.sellItems.has(item.id)
        );

        // Verify we have room
        const afterSellCount = character.gearInventory.length - itemsToSell.length;
        const freeSlots = character.inventoryLimit - afterSellCount;

        if (acceptedItems.length > freeSlots) {
            new Notice('❌ Not enough room! Trash more pending items or sell more existing items.');
            return;
        }

        // Call the callback
        this.options.onConfirm(acceptedItems, itemsToSell);
        this.close();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/**
 * Show the inventory management modal (convenience function)
 */
export function showInventoryManagementModal(
    app: App,
    options: InventoryManagementModalOptions
): void {
    new InventoryManagementModal(app, options).open();
}
