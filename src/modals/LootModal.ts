/**
 * Loot Modal
 * 
 * Celebratory modal shown when player earns loot from quest completion,
 * combat victory, or opening a chest.
 */

import { Modal, App } from 'obsidian';
import { LootDrop, LootReward, GearItem, TIER_INFO, GEAR_SLOT_NAMES, ARMOR_TYPE_NAMES, WEAPON_TYPE_NAMES } from '../models/Gear';
import { useCharacterStore } from '../store/characterStore';
import { formatGearTooltip, formatGearStatsSummary, isSetItem } from '../utils/gearFormatters';

export interface LootModalOptions {
    /** Title for the modal (e.g., "Quest Complete!", "Victory!", "Chest Opened!") */
    title: string;
    /** Optional subtitle */
    subtitle?: string;
    /** The loot to display */
    loot: LootDrop;
    /** Callback after closing (for cleanup) */
    onClose?: () => void;
}

export class LootModal extends Modal {
    private options: LootModalOptions;

    constructor(app: App, options: LootModalOptions) {
        super(app);
        this.options = options;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-loot-modal');

        // Title
        contentEl.createEl('div', { cls: 'qb-loot-emoji', text: '🎁' });
        contentEl.createEl('h2', {
            cls: 'qb-loot-title',
            text: this.options.title
        });

        if (this.options.subtitle) {
            contentEl.createEl('p', {
                cls: 'qb-loot-subtitle',
                text: this.options.subtitle
            });
        }

        // Loot container
        const lootContainer = contentEl.createEl('div', { cls: 'qb-loot-container' });

        // Separate loot by type for better display
        const goldRewards = this.options.loot.filter(r => r.type === 'gold') as { type: 'gold'; amount: number }[];
        const gearRewards = this.options.loot.filter(r => r.type === 'gear') as { type: 'gear'; item: GearItem }[];
        const consumableRewards = this.options.loot.filter(r => r.type === 'consumable') as { type: 'consumable'; itemId: string; quantity: number }[];

        // Display gold
        if (goldRewards.length > 0) {
            const totalGold = goldRewards.reduce((sum, r) => sum + r.amount, 0);
            const goldEl = lootContainer.createEl('div', { cls: 'qb-loot-item qb-loot-gold' });
            goldEl.createEl('span', { cls: 'qb-loot-icon', text: '🪙' });
            goldEl.createEl('span', { cls: 'qb-loot-name', text: `${totalGold} Gold` });
        }

        // Display gear
        // Get character for comparison
        const character = useCharacterStore.getState().character;

        for (const reward of gearRewards) {
            const item = reward.item;
            const tierInfo = TIER_INFO[item.tier];

            // Get currently equipped item for comparison
            const equippedItem = character?.equippedGear?.[item.slot] ?? null;

            // Use shared tooltip utility with comparison
            const tooltip = formatGearTooltip(item, equippedItem);

            const gearEl = lootContainer.createEl('div', {
                cls: `qb-loot-item qb-loot-gear qb-tier-${item.tier}`,
                title: tooltip
            });

            gearEl.createEl('span', { cls: 'qb-loot-icon', text: item.iconEmoji });

            const infoEl = gearEl.createEl('div', { cls: 'qb-loot-info' });
            const nameEl = infoEl.createEl('span', {
                cls: 'qb-loot-name',
                text: item.name
            });
            nameEl.style.color = tierInfo.color;

            // Build details line with type info
            let typeLabel = '';
            if (item.armorType) {
                typeLabel = ` • ${ARMOR_TYPE_NAMES[item.armorType]}`;
            } else if (item.weaponType) {
                typeLabel = ` • ${WEAPON_TYPE_NAMES[item.weaponType]}`;
            }

            infoEl.createEl('span', {
                cls: 'qb-loot-details',
                text: `${tierInfo.emoji} ${tierInfo.name} • Lvl ${item.level} • ${GEAR_SLOT_NAMES[item.slot]}${typeLabel}`
            });

            // Stat preview
            const statsEl = infoEl.createEl('span', { cls: 'qb-loot-stats' });
            statsEl.createEl('span', {
                text: `+${item.stats.primaryValue} ${item.stats.primaryStat.charAt(0).toUpperCase() + item.stats.primaryStat.slice(1)}`
            });
            if (item.stats.attackPower) {
                statsEl.createEl('span', { text: ` • +${item.stats.attackPower} ATK` });
            }
            if (item.stats.defense) {
                statsEl.createEl('span', { text: ` • +${item.stats.defense} DEF` });
            }

            // Show set membership if present
            if (item.setName) {
                infoEl.createEl('span', {
                    cls: 'qb-loot-set',
                    text: `⚔️ ${item.setName} Set`
                });
            }
        }

        // Display consumables
        for (const reward of consumableRewards) {
            const consumableEl = lootContainer.createEl('div', { cls: 'qb-loot-item qb-loot-consumable' });
            const icon = this.getConsumableIcon(reward.itemId);
            consumableEl.createEl('span', { cls: 'qb-loot-icon', text: icon });
            consumableEl.createEl('span', {
                cls: 'qb-loot-name',
                text: `${this.getConsumableName(reward.itemId)} x${reward.quantity}`
            });
        }

        // Empty state
        if (this.options.loot.length === 0) {
            lootContainer.createEl('p', {
                cls: 'qb-loot-empty',
                text: 'No loot this time!'
            });
        }

        // Collect button
        const buttonContainer = contentEl.createEl('div', { cls: 'qb-loot-buttons' });
        const collectBtn = buttonContainer.createEl('button', {
            cls: 'mod-cta',
            text: '✨ Collect Loot'
        });
        collectBtn.addEventListener('click', () => {
            this.collectLoot();
            this.close();
        });
    }

    /**
     * Acknowledge loot collection.
     * NOTE: Loot is already added to inventory by the caller (QuestActionsService)
     * before this modal is shown. This method just logs the acknowledgment.
     */
    private collectLoot() {
        console.log('[LootModal] Loot acknowledged - items already in inventory');
    }

    private getConsumableIcon(itemId: string): string {
        const icons: Record<string, string> = {
            health_potion: '❤️',
            mana_potion: '💙',
            stamina_potion: '💚',
            dungeon_key: '🗝️',
        };
        return icons[itemId] || '📦';
    }

    private getConsumableName(itemId: string): string {
        const names: Record<string, string> = {
            health_potion: 'Health Potion',
            mana_potion: 'Mana Potion',
            stamina_potion: 'Stamina Potion',
            dungeon_key: 'Dungeon Key',
        };
        return names[itemId] || itemId;
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
 * Show the loot modal (convenience function)
 */
export function showLootModal(app: App, options: LootModalOptions): void {
    new LootModal(app, options).open();
}
