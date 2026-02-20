/**
 * Store Modal
 *
 * Shop for consumables using gold.
 * Organized into 5 sections with level-gating and smart potion tier display.
 */

import { App, Modal, Notice } from 'obsidian';
import { useCharacterStore } from '../store/characterStore';
import {
    CONSUMABLES,
    ConsumableRarity,
    HP_POTION_IDS,
    MP_POTION_IDS,
    STAT_ELIXIR_IDS,
    CLEANSING_IDS,
    ENCHANTMENT_IDS,
    TACTICAL_IDS,
    getHpPotionForLevel,
    getMpPotionForLevel,
} from '../models/Consumable';

// =====================
// STORE ITEM DEFINITIONS
// =====================

interface StoreItem {
    consumableId: string;
    price: number;
}

/**
 * Items available for purchase in the store.
 * Display info (name, description, emoji, rarity) is pulled from CONSUMABLES.
 */
const STORE_ITEMS: StoreItem[] = [
    // HP Potions (6 tiers)
    { consumableId: 'hp-potion-minor', price: 40 },
    { consumableId: 'hp-potion-lesser', price: 100 },
    { consumableId: 'hp-potion-major', price: 200 },
    { consumableId: 'hp-potion-greater', price: 350 },
    { consumableId: 'hp-potion-superior', price: 550 },
    { consumableId: 'hp-potion-supreme', price: 850 },
    // Mana Potions (6 tiers)
    { consumableId: 'mp-potion-minor', price: 30 },
    { consumableId: 'mp-potion-lesser', price: 80 },
    { consumableId: 'mp-potion-major', price: 160 },
    { consumableId: 'mp-potion-greater', price: 280 },
    { consumableId: 'mp-potion-superior', price: 440 },
    { consumableId: 'mp-potion-supreme', price: 680 },
    // Stat Elixirs (L10+)
    { consumableId: 'elixir-bull', price: 400 },
    { consumableId: 'elixir-fox', price: 400 },
    { consumableId: 'elixir-bear', price: 400 },
    { consumableId: 'elixir-owl', price: 400 },
    { consumableId: 'elixir-sage', price: 400 },
    { consumableId: 'elixir-serpent', price: 400 },
    // Cleansing Items
    { consumableId: 'purifying-salve', price: 150 },
    { consumableId: 'sacred-water', price: 350 },
    // Enchantment Oils (L8+)
    { consumableId: 'oil-immolation', price: 300 },
    { consumableId: 'venom-coating', price: 300 },
    { consumableId: 'frostbite-tincture', price: 350 },
    // Tactical Consumables
    { consumableId: 'firebomb', price: 200 },
    { consumableId: 'smoke-bomb', price: 150 },
    { consumableId: 'ironbark-ward', price: 300 },
    // Rare Items
    { consumableId: 'phoenix-tear', price: 2000 },
    { consumableId: 'scroll-of-pardon', price: 500 },
    { consumableId: 'revive-potion', price: 200 },
    { consumableId: 'elixir-of-experience', price: 800 },
];

/** Rarity colors for styling */
const RARITY_COLORS: Record<ConsumableRarity, string> = {
    [ConsumableRarity.COMMON]: '#9e9e9e',
    [ConsumableRarity.ADEPT]: '#4caf50',
    [ConsumableRarity.MASTER]: '#9c27b0',
    [ConsumableRarity.EPIC]: '#ff9800',
};

// =====================
// STORE MODAL
// =====================

interface StoreModalOptions {
    onSave?: () => Promise<void>;
}

export class StoreModal extends Modal {
    private options: StoreModalOptions;

    constructor(app: App, options: StoreModalOptions = {}) {
        super(app);
        this.options = options;
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
        const level = character?.level ?? 1;

        // Header
        const header = contentEl.createDiv('qb-store-header');
        header.createEl('h2', { text: 'Adventurer\'s Store' });

        const goldDisplay = header.createDiv('qb-store-gold');
        goldDisplay.createSpan({ text: '💰 ' });
        goldDisplay.createSpan({ text: `${gold.toLocaleString()}`, cls: 'qb-gold-amount' });
        goldDisplay.createSpan({ text: ' gold' });

        // Items grid
        const grid = contentEl.createDiv('qb-store-grid');

        // 1. Health Potions (smart tier display: current ±1)
        const visibleHpIds = this.getVisiblePotionIds(HP_POTION_IDS, level, getHpPotionForLevel);
        const hpItems = STORE_ITEMS.filter(i => visibleHpIds.includes(i.consumableId));
        this.renderSection(grid, 'Health Potions', hpItems, gold, inventory, level);

        // 2. Mana Potions (smart tier display: current ±1)
        const visibleMpIds = this.getVisiblePotionIds(MP_POTION_IDS, level, getMpPotionForLevel);
        const mpItems = STORE_ITEMS.filter(i => visibleMpIds.includes(i.consumableId));
        this.renderSection(grid, 'Mana Potions', mpItems, gold, inventory, level);

        // 3. Stat Elixirs
        const elixirItems = STORE_ITEMS.filter(i => STAT_ELIXIR_IDS.includes(i.consumableId));
        this.renderSection(grid, 'Stat Elixirs', elixirItems, gold, inventory, level);

        // 4. Battle Supplies (cleansing + enchantment + tactical)
        const battleIds = [...CLEANSING_IDS, ...ENCHANTMENT_IDS, ...TACTICAL_IDS];
        const battleItems = STORE_ITEMS.filter(i => battleIds.includes(i.consumableId));
        this.renderSection(grid, 'Battle Supplies', battleItems, gold, inventory, level);

        // 5. Rare Items
        const rareIds = ['phoenix-tear', 'scroll-of-pardon', 'revive-potion', 'elixir-of-experience'];
        const rareItems = STORE_ITEMS.filter(i => rareIds.includes(i.consumableId));
        this.renderSection(grid, 'Rare Items', rareItems, gold, inventory, level);

        // Footer
        const footer = contentEl.createDiv('qb-store-footer');
        footer.createEl('p', { text: 'Complete quests to earn gold!' });
    }

    /**
     * Get visible potion tier IDs for smart tier display.
     * Shows: one tier below (if exists), current tier, one tier above (if exists).
     */
    private getVisiblePotionIds(
        potionIds: string[],
        level: number,
        getPotionFn: (level: number) => string,
    ): string[] {
        const currentId = getPotionFn(level);
        const currentIndex = potionIds.indexOf(currentId);
        const result: string[] = [];

        if (currentIndex > 0) result.push(potionIds[currentIndex - 1]);
        result.push(potionIds[currentIndex]);
        if (currentIndex < potionIds.length - 1) result.push(potionIds[currentIndex + 1]);

        return result;
    }

    private renderSection(
        container: HTMLElement,
        title: string,
        items: StoreItem[],
        gold: number,
        inventory: { itemId: string; quantity: number }[],
        characterLevel: number,
    ) {
        if (items.length === 0) return;

        const section = container.createDiv('qb-store-section');
        section.createEl('h3', { text: title });

        const itemsRow = section.createDiv('qb-store-items-row');

        for (const item of items) {
            const def = CONSUMABLES[item.consumableId];
            if (!def) continue;

            const owned = inventory.find(i => i.itemId === item.consumableId)?.quantity ?? 0;
            const isLocked = def.minLevel !== undefined && characterLevel < def.minLevel;
            const canAfford = !isLocked && gold >= item.price;

            const card = itemsRow.createDiv('qb-store-item');
            card.style.borderColor = RARITY_COLORS[def.rarity];
            if (isLocked) {
                card.addClass('qb-store-item-locked');
            }

            // Emoji
            card.createDiv({ cls: 'qb-store-item-icon', text: def.emoji });

            // Name + description
            const info = card.createDiv('qb-store-item-info');
            info.createEl('span', { text: def.name, cls: 'qb-store-item-name' });
            info.createEl('span', { text: def.description, cls: 'qb-store-item-desc' });

            // Price + owned (or level requirement)
            const priceRow = card.createDiv('qb-store-item-price-row');
            if (isLocked) {
                priceRow.createEl('span', {
                    text: `Requires level ${def.minLevel}`,
                    cls: 'qb-store-item-locked-text',
                });
            } else {
                priceRow.createEl('span', { text: `💰 ${item.price}`, cls: 'qb-store-item-price' });
                if (owned > 0) {
                    priceRow.createEl('span', { text: `Owned: ${owned}`, cls: 'qb-store-item-owned' });
                }
            }

            // Buy button
            if (isLocked) {
                const lockedBtn = card.createEl('button', {
                    text: 'Locked',
                    cls: 'qb-store-buy-btn qb-store-buy-disabled',
                });
                lockedBtn.disabled = true;
            } else {
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
    }

    private async buyItem(item: StoreItem) {
        const store = useCharacterStore.getState();
        const gold = store.character?.gold ?? 0;
        const def = CONSUMABLES[item.consumableId];

        if (gold < item.price) {
            new Notice('❌ Not enough gold!', 2000);
            return;
        }

        // Deduct gold
        store.updateGold(-item.price);

        // Add to inventory
        store.addInventoryItem(item.consumableId, 1);

        // Success feedback
        const displayName = def ? `${def.emoji} ${def.name}` : item.consumableId;
        new Notice(`✅ Purchased ${displayName}!`, 2000);

        // Persist purchase to storage
        if (this.options.onSave) {
            await this.options.onSave();
        }

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
export function openStoreModal(app: App, options: StoreModalOptions = {}): void {
    new StoreModal(app, options).open();
}
