/**
 * Store Modal
 * 
 * Phase 3B: Shop for consumables using gold.
 * Simple modal UI with potion tiers and buy buttons.
 */

import { App, Modal, Notice } from 'obsidian';
import { useCharacterStore } from '../store/characterStore';
import { CONSUMABLES, ConsumableDefinition, ConsumableRarity } from '../models/Consumable';

// =====================
// STORE ITEM DEFINITIONS
// =====================

interface StoreItem {
    consumableId: string;
    price: number;
    displayName: string;
    description: string;
    emoji: string;
    rarity: ConsumableRarity;
}

/**
 * Items available for purchase in the store.
 * Prices based on Fight System design doc.
 */
const STORE_ITEMS: StoreItem[] = [
    // HP Potions
    {
        consumableId: 'hp-potion-minor',
        price: 50,
        displayName: 'Minor Health Potion',
        description: 'Restores 50 HP. For early adventurers.',
        emoji: '🧪',
        rarity: ConsumableRarity.COMMON,
    },
    {
        consumableId: 'hp-potion-lesser',
        price: 150,
        displayName: 'Lesser Health Potion',
        description: 'Restores 120 HP. For seasoned heroes.',
        emoji: '🧪',
        rarity: ConsumableRarity.ADEPT,
    },
    {
        consumableId: 'hp-potion-greater',
        price: 350,
        displayName: 'Greater Health Potion',
        description: 'Restores 250 HP. For veterans.',
        emoji: '❤️‍🔥',
        rarity: ConsumableRarity.MASTER,
    },
    {
        consumableId: 'hp-potion-superior',
        price: 700,
        displayName: 'Superior Health Potion',
        description: 'Restores 500 HP. Legendary brew.',
        emoji: '💖',
        rarity: ConsumableRarity.EPIC,
    },
    // Mana Potions
    {
        consumableId: 'mp-potion-minor',
        price: 40,
        displayName: 'Minor Mana Potion',
        description: 'Restores 30 MP. For budding casters.',
        emoji: '🔮',
        rarity: ConsumableRarity.COMMON,
    },
    {
        consumableId: 'mp-potion-lesser',
        price: 120,
        displayName: 'Lesser Mana Potion',
        description: 'Restores 75 MP. For adept wizards.',
        emoji: '🔮',
        rarity: ConsumableRarity.ADEPT,
    },
    {
        consumableId: 'mp-potion-greater',
        price: 280,
        displayName: 'Greater Mana Potion',
        description: 'Restores 150 MP. For archmages.',
        emoji: '💎',
        rarity: ConsumableRarity.MASTER,
    },
    {
        consumableId: 'mp-potion-superior',
        price: 550,
        displayName: 'Superior Mana Potion',
        description: 'Restores 300 MP. Arcane elixir.',
        emoji: '✨',
        rarity: ConsumableRarity.EPIC,
    },
    // Special Items
    {
        consumableId: 'scroll-of-pardon',
        price: 500,
        displayName: 'Scroll of Pardon',
        description: 'Restore a broken daily streak.',
        emoji: '📜',
        rarity: ConsumableRarity.MASTER,
    },
];

// Rarity colors for styling
const RARITY_COLORS: Record<ConsumableRarity, string> = {
    [ConsumableRarity.COMMON]: '#9e9e9e',
    [ConsumableRarity.ADEPT]: '#4caf50',
    [ConsumableRarity.MASTER]: '#9c27b0',
    [ConsumableRarity.EPIC]: '#ff9800',
};

// =====================
// STORE MODAL
// =====================

export class StoreModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-store-modal');

        this.renderStore();
    }

    private renderStore() {
        const { contentEl } = this;
        contentEl.empty();

        const character = useCharacterStore.getState().character;
        const inventory = useCharacterStore.getState().inventory;
        const gold = character?.gold ?? 0;

        // Header
        const header = contentEl.createDiv('qb-store-header');
        header.createEl('h2', { text: '🏪 Adventurer\'s Store' });

        const goldDisplay = header.createDiv('qb-store-gold');
        goldDisplay.createSpan({ text: '💰 ' });
        goldDisplay.createSpan({ text: `${gold.toLocaleString()}`, cls: 'qb-gold-amount' });
        goldDisplay.createSpan({ text: ' gold' });

        // Items grid
        const grid = contentEl.createDiv('qb-store-grid');

        // HP Potions Section
        this.renderSection(grid, '❤️ Health Potions', STORE_ITEMS.filter(i => i.consumableId.startsWith('hp-')), gold, inventory);

        // Mana Potions Section  
        this.renderSection(grid, '💙 Mana Potions', STORE_ITEMS.filter(i => i.consumableId.startsWith('mp-')), gold, inventory);

        // Special Items Section
        this.renderSection(grid, '✨ Special Items', STORE_ITEMS.filter(i => !i.consumableId.startsWith('hp-') && !i.consumableId.startsWith('mp-')), gold, inventory);

        // Footer
        const footer = contentEl.createDiv('qb-store-footer');
        footer.createEl('p', { text: 'Complete quests to earn gold!' });
    }

    private renderSection(
        container: HTMLElement,
        title: string,
        items: StoreItem[],
        gold: number,
        inventory: { itemId: string; quantity: number }[]
    ) {
        const section = container.createDiv('qb-store-section');
        section.createEl('h3', { text: title });

        const itemsRow = section.createDiv('qb-store-items-row');

        for (const item of items) {
            const owned = inventory.find(i => i.itemId === item.consumableId)?.quantity ?? 0;
            const canAfford = gold >= item.price;

            const card = itemsRow.createDiv('qb-store-item');
            card.style.borderColor = RARITY_COLORS[item.rarity];

            // Emoji
            card.createDiv({ cls: 'qb-store-item-icon', text: item.emoji });

            // Name + description
            const info = card.createDiv('qb-store-item-info');
            info.createEl('span', { text: item.displayName, cls: 'qb-store-item-name' });
            info.createEl('span', { text: item.description, cls: 'qb-store-item-desc' });

            // Price + owned
            const priceRow = card.createDiv('qb-store-item-price-row');
            priceRow.createEl('span', { text: `💰 ${item.price}`, cls: 'qb-store-item-price' });
            if (owned > 0) {
                priceRow.createEl('span', { text: `Owned: ${owned}`, cls: 'qb-store-item-owned' });
            }

            // Buy button
            const buyBtn = card.createEl('button', {
                text: canAfford ? 'Buy' : 'Not enough gold',
                cls: `qb-store-buy-btn ${canAfford ? '' : 'qb-store-buy-disabled'}`,
            });
            buyBtn.disabled = !canAfford;

            if (canAfford) {
                buyBtn.onclick = () => this.buyItem(item);
            }
        }
    }

    private buyItem(item: StoreItem) {
        const store = useCharacterStore.getState();
        const gold = store.character?.gold ?? 0;

        if (gold < item.price) {
            new Notice('❌ Not enough gold!', 2000);
            return;
        }

        // Deduct gold
        store.updateGold(-item.price);

        // Add to inventory
        store.addInventoryItem(item.consumableId, 1);

        // Success feedback
        new Notice(`✅ Purchased ${item.emoji} ${item.displayName}!`, 2000);

        // Re-render to update display
        this.renderStore();
    }

    onClose() {
        this.contentEl.empty();
    }
}

/**
 * Helper to open the store modal
 */
export function openStoreModal(app: App): void {
    new StoreModal(app).open();
}
