/**
 * Inventory Modal
 * 
 * Two-tab inventory view showing Gear and Consumables.
 * Allows equipping gear and selling items for gold.
 */

import { Modal, App, Notice } from 'obsidian';
import {
    GearItem,
    GearSlot,
    TIER_INFO,
    GEAR_SLOT_NAMES,
    calculateSellValue,
    ARMOR_TYPE_NAMES,
    WEAPON_TYPE_NAMES,
    canEquipGear,
} from '../models/Gear';
import { useCharacterStore } from '../store/characterStore';
import { formatGearTooltip, isSetItem } from '../utils/gearFormatters';

interface InventoryModalOptions {
    /** Callback when character data changes */
    onSave?: () => Promise<void>;
}

type InventoryTab = 'gear' | 'consumables';

export class InventoryModal extends Modal {
    private options: InventoryModalOptions;
    private currentTab: InventoryTab = 'gear';
    private contentContainer: HTMLElement | null = null;

    constructor(app: App, options: InventoryModalOptions = {}) {
        super(app);
        this.options = options;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-inventory-modal');

        // Header
        contentEl.createEl('h2', { cls: 'qb-inventory-title', text: '🎒 Inventory' });

        // Tab buttons
        const tabContainer = contentEl.createEl('div', { cls: 'qb-inventory-tabs' });

        const gearTab = tabContainer.createEl('button', {
            cls: `qb-inventory-tab ${this.currentTab === 'gear' ? 'active' : ''}`,
            text: '⚔️ Gear'
        });
        gearTab.addEventListener('click', () => this.switchTab('gear'));

        const consumablesTab = tabContainer.createEl('button', {
            cls: `qb-inventory-tab ${this.currentTab === 'consumables' ? 'active' : ''}`,
            text: '🧪 Consumables'
        });
        consumablesTab.addEventListener('click', () => this.switchTab('consumables'));

        // Gold display
        const character = useCharacterStore.getState().character;
        const goldDisplay = contentEl.createEl('div', { cls: 'qb-inventory-gold' });
        goldDisplay.createEl('span', { cls: 'qb-gold-icon', text: '🪙' });
        goldDisplay.createEl('span', { cls: 'qb-gold-amount', text: `${character?.gold || 0} Gold` });

        // Content container
        this.contentContainer = contentEl.createEl('div', { cls: 'qb-inventory-content' });
        this.renderContent();

        // Subscription to character changes for reactive updates
        const unsubscribe = useCharacterStore.subscribe(() => {
            this.renderContent();
            // Update gold display
            const char = useCharacterStore.getState().character;
            const goldAmountEl = goldDisplay.querySelector('.qb-gold-amount');
            if (goldAmountEl) {
                goldAmountEl.textContent = `${char?.gold || 0} Gold`;
            }
        });

        // Store unsubscribe for cleanup
        (this as any)._unsubscribe = unsubscribe;
    }

    private switchTab(tab: InventoryTab) {
        this.currentTab = tab;
        // Update tab button classes
        const tabs = this.contentEl.querySelectorAll('.qb-inventory-tab');
        tabs.forEach(t => t.removeClass('active'));
        tabs[tab === 'gear' ? 0 : 1].addClass('active');
        this.renderContent();
    }

    private renderContent() {
        if (!this.contentContainer) return;
        this.contentContainer.empty();

        if (this.currentTab === 'gear') {
            this.renderGearTab();
        } else {
            this.renderConsumablesTab();
        }
    }

    private renderGearTab() {
        if (!this.contentContainer) return;
        const character = useCharacterStore.getState().character;
        const gearInventory = character?.gearInventory || [];

        if (gearInventory.length === 0) {
            const emptyEl = this.contentContainer.createEl('div', { cls: 'qb-inventory-empty' });
            emptyEl.createEl('div', { cls: 'qb-inventory-empty-icon', text: '📦' });
            emptyEl.createEl('div', { cls: 'qb-inventory-empty-text', text: 'No gear in inventory' });
            emptyEl.createEl('div', { cls: 'qb-inventory-empty-hint', text: 'Complete quests to earn gear drops!' });
            return;
        }

        // Inventory count
        const limit = character?.inventoryLimit || 50;
        const countEl = this.contentContainer.createEl('div', { cls: 'qb-inventory-count' });
        countEl.textContent = `${gearInventory.length} / ${limit} slots used`;

        // Gear grid
        const gearGrid = this.contentContainer.createEl('div', { cls: 'qb-inventory-grid' });

        for (const item of gearInventory) {
            this.renderGearItem(gearGrid, item);
        }
    }

    private renderGearItem(container: HTMLElement, item: GearItem) {
        const character = useCharacterStore.getState().character;
        const tierInfo = TIER_INFO[item.tier];

        const itemEl = container.createEl('div', {
            cls: `qb-inventory-item qb-tier-${item.tier}`
        });
        itemEl.style.borderColor = tierInfo.color;

        // Icon
        const iconEl = itemEl.createEl('div', { cls: 'qb-inventory-item-icon' });
        iconEl.textContent = item.iconEmoji;
        iconEl.style.borderColor = tierInfo.color;

        // Info
        const infoEl = itemEl.createEl('div', { cls: 'qb-inventory-item-info' });
        const nameEl = infoEl.createEl('div', { cls: 'qb-inventory-item-name', text: item.name });
        nameEl.style.color = tierInfo.color;

        // Build details with type info
        let typeLabel = '';
        if (item.armorType) {
            typeLabel = ` • ${ARMOR_TYPE_NAMES[item.armorType]}`;
        } else if (item.weaponType) {
            typeLabel = ` • ${WEAPON_TYPE_NAMES[item.weaponType]}`;
        }

        infoEl.createEl('div', {
            cls: 'qb-inventory-item-details',
            text: `${tierInfo.emoji} ${tierInfo.name} • Lvl ${item.level} • ${GEAR_SLOT_NAMES[item.slot]}${typeLabel}`
        });

        const statsEl = infoEl.createEl('div', { cls: 'qb-inventory-item-stats' });
        statsEl.innerHTML = `+${item.stats.primaryValue} ${item.stats.primaryStat}`;
        if (item.stats.attackPower) statsEl.innerHTML += ` • +${item.stats.attackPower} ATK`;
        if (item.stats.defense) statsEl.innerHTML += ` • +${item.stats.defense} DEF`;

        // Show set membership if present
        if (isSetItem(item)) {
            infoEl.createEl('div', {
                cls: 'qb-inventory-item-set',
                text: `⚔️ ${item.setName} Set`
            });
        }

        // Use shared tooltip (includes comparison if equipped item exists)
        const currentlyEquipped = character?.equippedGear?.[item.slot];
        const tooltip = formatGearTooltip(item, currentlyEquipped);
        itemEl.setAttribute('title', tooltip);

        // Check if class can equip this item
        const canEquip = character ? canEquipGear(character.class, item) : true;

        // Actions
        const actionsEl = itemEl.createEl('div', { cls: 'qb-inventory-item-actions' });

        // Equip button (disabled if can't equip)
        const equipBtn = actionsEl.createEl('button', {
            cls: `qb-inventory-btn qb-btn-equip ${!canEquip ? 'qb-btn-disabled' : ''}`,
            text: currentlyEquipped ? '🔄 Swap' : '⬆️ Equip'
        });
        if (!canEquip) {
            equipBtn.setAttribute('title', `Your class cannot equip this item type`);
            equipBtn.disabled = true;
        } else {
            equipBtn.addEventListener('click', () => this.equipItem(item));
        }

        // Sell button
        const sellValue = calculateSellValue(item.level, item.tier);
        const sellBtn = actionsEl.createEl('button', {
            cls: 'qb-inventory-btn qb-btn-sell',
            text: `🪙 Sell (${sellValue}g)`
        });
        sellBtn.addEventListener('click', () => this.sellItem(item, sellValue));
    }

    private async equipItem(item: GearItem) {
        const charStore = useCharacterStore.getState();

        // Get currently equipped item first for notification
        const currentItem = charStore.character?.equippedGear?.[item.slot];

        // Call equipGear with slot and item ID
        const success = charStore.equipGear(item.slot, item.id);

        if (success) {
            new Notice(`✅ Equipped ${item.name}!`, 2000);
            if (currentItem) {
                new Notice(`📦 ${currentItem.name} moved to inventory`, 2000);
            }
            if (this.options.onSave) {
                await this.options.onSave();
            }
        } else {
            new Notice(`❌ Failed to equip - inventory may be full`, 3000);
        }
    }

    private async sellItem(item: GearItem, goldValue: number) {
        const charStore = useCharacterStore.getState();
        charStore.removeGear(item.id);
        charStore.updateGold(goldValue);

        new Notice(`🪙 Sold ${item.name} for ${goldValue} gold!`, 2000);

        if (this.options.onSave) {
            await this.options.onSave();
        }
    }

    private renderConsumablesTab() {
        if (!this.contentContainer) return;

        // TODO: Implement consumables inventory
        const emptyEl = this.contentContainer.createEl('div', { cls: 'qb-inventory-empty' });
        emptyEl.createEl('div', { cls: 'qb-inventory-empty-icon', text: '🧪' });
        emptyEl.createEl('div', { cls: 'qb-inventory-empty-text', text: 'Consumables coming soon!' });
        emptyEl.createEl('div', { cls: 'qb-inventory-empty-hint', text: 'Potions and keys will be available in a future update.' });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        // Clean up subscription
        if ((this as any)._unsubscribe) {
            (this as any)._unsubscribe();
        }
    }
}

/**
 * Show the inventory modal (convenience function)
 */
export function showInventoryModal(app: App, options: InventoryModalOptions = {}): void {
    new InventoryModal(app, options).open();
}
