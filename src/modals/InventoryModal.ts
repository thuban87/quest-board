/**
 * Inventory Modal
 * 
 * Two-tab inventory view showing Gear and Consumables.
 * Allows equipping gear, selling items, and using consumables.
 * 
 * Features:
 * - Sorting by tier/level/slot/name (clickable headers)
 * - Filtering by slot and tier (multi-select buttons)
 */

import { Modal, App, Notice } from 'obsidian';
import {
    GearItem,
    GearSlot,
    GearTier,
    TIER_INFO,
    GEAR_SLOT_NAMES,
    GEAR_TIERS,
    PRIMARY_GEAR_SLOTS,
    calculateSellValue,
    ARMOR_TYPE_NAMES,
    WEAPON_TYPE_NAMES,
    canEquipGear,
} from '../models/Gear';
import { CONSUMABLES, ConsumableDefinition, InventoryItem } from '../models/Consumable';
import { useCharacterStore } from '../store/characterStore';
import { formatGearTooltip, isSetItem } from '../utils/gearFormatters';

interface InventoryModalOptions {
    /** Callback when character data changes */
    onSave?: () => Promise<void>;
}

type InventoryTab = 'gear' | 'consumables';
type SortField = 'tier' | 'level' | 'slot' | 'name';
type SortDirection = 'asc' | 'desc';

export class InventoryModal extends Modal {
    private options: InventoryModalOptions;
    private currentTab: InventoryTab = 'gear';
    private contentContainer: HTMLElement | null = null;

    // Sorting state
    private sortBy: SortField = 'tier';
    private sortDir: SortDirection = 'desc'; // Highest tier first by default

    // Filtering state
    private slotFilters: Set<GearSlot> = new Set();
    private tierFilters: Set<GearTier> = new Set();

    constructor(app: App, options: InventoryModalOptions = {}) {
        super(app);
        this.options = options;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-inventory-modal');

        // Make the modal wider
        this.modalEl.addClass('qb-modal-wide');

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

    // ========== GEAR TAB ==========

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

        // Sort/Filter controls
        this.renderSortFilterControls();

        // Apply filters and sorting
        let filteredGear = this.applyFilters(gearInventory);
        filteredGear = this.applySorting(filteredGear);

        // Show filtered count if different
        if (filteredGear.length !== gearInventory.length) {
            const filterCountEl = this.contentContainer.createEl('div', { cls: 'qb-inventory-filter-count' });
            filterCountEl.textContent = `Showing ${filteredGear.length} of ${gearInventory.length} items`;
        }

        // Gear grid
        const gearGrid = this.contentContainer.createEl('div', { cls: 'qb-inventory-grid' });

        for (const item of filteredGear) {
            this.renderGearItem(gearGrid, item);
        }
    }

    private renderSortFilterControls() {
        if (!this.contentContainer) return;

        const controlsContainer = this.contentContainer.createEl('div', { cls: 'qb-inventory-controls' });

        // === SORTING SECTION ===
        const sortSection = controlsContainer.createEl('div', { cls: 'qb-inventory-sort-section' });
        sortSection.createEl('span', { cls: 'qb-inventory-controls-label', text: 'Sort:' });

        const sortFields: { field: SortField; label: string }[] = [
            { field: 'tier', label: 'Tier' },
            { field: 'level', label: 'Level' },
            { field: 'slot', label: 'Slot' },
            { field: 'name', label: 'Name' },
        ];

        for (const { field, label } of sortFields) {
            const isActive = this.sortBy === field;
            const arrow = isActive ? (this.sortDir === 'asc' ? ' ↑' : ' ↓') : '';

            const btn = sortSection.createEl('button', {
                cls: `qb-inventory-sort-btn ${isActive ? 'active' : ''}`,
                text: label + arrow
            });
            btn.addEventListener('click', () => this.handleSortClick(field));
        }

        // === FILTER SECTION ===
        const filterSection = controlsContainer.createEl('div', { cls: 'qb-inventory-filter-section' });

        // Slot filters
        const slotFilterRow = filterSection.createEl('div', { cls: 'qb-inventory-filter-row' });
        slotFilterRow.createEl('span', { cls: 'qb-inventory-controls-label', text: 'Slot:' });

        for (const slot of PRIMARY_GEAR_SLOTS) {
            const isActive = this.slotFilters.has(slot);
            const btn = slotFilterRow.createEl('button', {
                cls: `qb-inventory-filter-btn ${isActive ? 'active' : ''}`,
                text: GEAR_SLOT_NAMES[slot]
            });
            btn.addEventListener('click', () => this.toggleSlotFilter(slot));
        }

        // Tier filters
        const tierFilterRow = filterSection.createEl('div', { cls: 'qb-inventory-filter-row' });
        tierFilterRow.createEl('span', { cls: 'qb-inventory-controls-label', text: 'Tier:' });

        for (const tier of GEAR_TIERS) {
            const isActive = this.tierFilters.has(tier);
            const tierInfo = TIER_INFO[tier];
            const btn = tierFilterRow.createEl('button', {
                cls: `qb-inventory-filter-btn ${isActive ? 'active' : ''}`,
                text: `${tierInfo.emoji} ${tierInfo.name}`
            });
            btn.style.color = isActive ? tierInfo.color : '';
            btn.addEventListener('click', () => this.toggleTierFilter(tier));
        }

        // Clear filters button (only show if filters active)
        if (this.slotFilters.size > 0 || this.tierFilters.size > 0) {
            const clearBtn = filterSection.createEl('button', {
                cls: 'qb-inventory-clear-btn',
                text: '✕ Clear Filters'
            });
            clearBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    private handleSortClick(field: SortField) {
        if (this.sortBy === field) {
            // Toggle direction
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            // New field, default to descending for tier/level, ascending for name/slot
            this.sortBy = field;
            this.sortDir = (field === 'tier' || field === 'level') ? 'desc' : 'asc';
        }
        this.renderContent();
    }

    private toggleSlotFilter(slot: GearSlot) {
        if (this.slotFilters.has(slot)) {
            this.slotFilters.delete(slot);
        } else {
            this.slotFilters.add(slot);
        }
        this.renderContent();
    }

    private toggleTierFilter(tier: GearTier) {
        if (this.tierFilters.has(tier)) {
            this.tierFilters.delete(tier);
        } else {
            this.tierFilters.add(tier);
        }
        this.renderContent();
    }

    private clearFilters() {
        this.slotFilters.clear();
        this.tierFilters.clear();
        this.renderContent();
    }

    private applyFilters(gear: GearItem[]): GearItem[] {
        return gear.filter(item => {
            // Slot filter (empty = show all)
            if (this.slotFilters.size > 0 && !this.slotFilters.has(item.slot)) {
                return false;
            }
            // Tier filter (empty = show all)
            if (this.tierFilters.size > 0 && !this.tierFilters.has(item.tier)) {
                return false;
            }
            return true;
        });
    }

    private applySorting(gear: GearItem[]): GearItem[] {
        const tierOrder = GEAR_TIERS;
        const slotOrder = PRIMARY_GEAR_SLOTS;

        return [...gear].sort((a, b) => {
            let comparison = 0;

            switch (this.sortBy) {
                case 'tier':
                    comparison = tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
                    break;
                case 'level':
                    comparison = a.level - b.level;
                    break;
                case 'slot':
                    comparison = slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot);
                    break;
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
            }

            return this.sortDir === 'asc' ? comparison : -comparison;
        });
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

    // ========== CONSUMABLES TAB ==========

    private renderConsumablesTab() {
        if (!this.contentContainer) return;

        const inventory = useCharacterStore.getState().inventory;

        // Filter to only items that exist in CONSUMABLES registry
        const consumableItems = inventory.filter(item => CONSUMABLES[item.itemId]);

        if (consumableItems.length === 0) {
            const emptyEl = this.contentContainer.createEl('div', { cls: 'qb-inventory-empty' });
            emptyEl.createEl('div', { cls: 'qb-inventory-empty-icon', text: '🧪' });
            emptyEl.createEl('div', { cls: 'qb-inventory-empty-text', text: 'No consumables in inventory' });
            emptyEl.createEl('div', { cls: 'qb-inventory-empty-hint', text: 'Complete daily quests and explore dungeons to find potions!' });
            return;
        }

        // Consumables list
        const consumablesList = this.contentContainer.createEl('div', { cls: 'qb-consumables-list' });

        for (const item of consumableItems) {
            this.renderConsumableItem(consumablesList, item);
        }
    }

    private renderConsumableItem(container: HTMLElement, item: InventoryItem) {
        const definition = CONSUMABLES[item.itemId];
        if (!definition) return;

        const itemEl = container.createEl('div', { cls: 'qb-consumable-item' });

        // Icon
        const iconEl = itemEl.createEl('div', { cls: 'qb-consumable-icon' });
        iconEl.textContent = definition.emoji;

        // Info
        const infoEl = itemEl.createEl('div', { cls: 'qb-consumable-info' });

        const headerEl = infoEl.createEl('div', { cls: 'qb-consumable-header' });
        headerEl.createEl('span', { cls: 'qb-consumable-name', text: definition.name });
        headerEl.createEl('span', { cls: 'qb-consumable-quantity', text: `×${item.quantity}` });

        infoEl.createEl('div', { cls: 'qb-consumable-desc', text: definition.description });

        // Actions
        const actionsEl = itemEl.createEl('div', { cls: 'qb-consumable-actions' });

        // Check effect type
        const isHpRestore = definition.effect === 'hp_restore';
        const isManaRestore = definition.effect === 'mana_restore';
        const isRevive = definition.effect === 'revive';

        if (isHpRestore || isManaRestore || isRevive) {
            // Use button
            const useBtn = actionsEl.createEl('button', {
                cls: 'qb-consumable-btn qb-btn-use',
                text: '✨ Use'
            });
            useBtn.addEventListener('click', () => this.useConsumable(item.itemId, definition));
        } else {
            // Other consumables (Streak restore, XP boost) - Coming Soon
            actionsEl.createEl('span', {
                cls: 'qb-consumable-coming-soon',
                text: '🔜 Coming Soon'
            });
        }
    }

    private async useConsumable(itemId: string, definition: ConsumableDefinition) {
        const store = useCharacterStore.getState();
        const character = store.character;
        if (!character) return;

        // Check what effect this is
        if (definition.effect === 'hp_restore') {
            // Block usage when dead (HP = 0) - must use revive potion
            if (character.currentHP <= 0) {
                new Notice('💀 You must use a Revive Potion first!', 3000);
                return;
            }

            // Calculate restored HP
            const newHP = Math.min(character.maxHP, character.currentHP + definition.effectValue);
            const restored = newHP - character.currentHP;

            if (restored <= 0) {
                new Notice('❤️ HP is already full!', 2000);
                return;
            }

            store.updateHP(definition.effectValue);
            store.removeInventoryItem(itemId, 1);
            new Notice(`❤️ Restored ${restored} HP!`, 2000);
        } else if (definition.effect === 'mana_restore') {
            // Calculate restored Mana
            const newMana = Math.min(character.maxMana, character.currentMana + definition.effectValue);
            const restored = newMana - character.currentMana;

            if (restored <= 0) {
                new Notice('💧 Mana is already full!', 2000);
                return;
            }

            store.updateMana(definition.effectValue);
            store.removeInventoryItem(itemId, 1);
            new Notice(`💧 Restored ${restored} Mana!`, 2000);
        } else if (definition.effect === 'revive') {
            // Revive from unconscious
            if (character.status !== 'unconscious') {
                new Notice('💫 You are not unconscious!', 2000);
                return;
            }

            const success = store.useRevivePotion();
            if (success) {
                new Notice('💫 Revived! You have 25% HP.', 3000);
            } else {
                new Notice('❌ Failed to revive.', 2000);
            }
        }

        // Save changes
        if (this.options.onSave) {
            await this.options.onSave();
        }
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
