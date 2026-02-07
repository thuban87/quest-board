/**
 * BattleView - Full-page ItemView for Combat
 * 
 * Opens in its own tab, separate from the Kanban board.
 * Uses React for rendering the battle UI.
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { BATTLE_VIEW_TYPE } from './constants';
import { BattleView as BattleComponent } from '../components/BattleView';
import { showLootModal } from '../modals/LootModal';
import { openRecoveryOptionsModal } from '../modals/RecoveryOptionsModal';
import { useCharacterStore } from '../store/characterStore';
import { useBattleStore } from '../store/battleStore';
import { getLevelTier } from '../models/Character';
import { getPlayerBattleSprite, getMonsterBattleSprite } from '../services/SpriteService';
import type QuestBoardPlugin from '../../main';

export class BattleItemView extends ItemView {
    private root: Root | null = null;
    private plugin: QuestBoardPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: QuestBoardPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return BATTLE_VIEW_TYPE;
    }

    getDisplayText(): string {
        return '⚔️ Battle';
    }

    getIcon(): string {
        return 'crossed-swords';
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('qb-battle-container');

        const assetFolder = this.plugin.settings.assetFolder;
        const adapter = this.app.vault.adapter;

        // Get character for class/tier-based sprite
        const character = useCharacterStore.getState().character;
        let playerSpritePath: string | undefined;

        if (assetFolder && character) {
            const tier = character.isTrainingMode ? 1 : getLevelTier(character.level);
            playerSpritePath = getPlayerBattleSprite(assetFolder, adapter, character.class, tier);
        }

        // Get monster sprite path from current battle state
        const monster = useBattleStore.getState().monster;
        let monsterSpritePath: string | undefined;

        if (assetFolder && monster?.templateId) {
            monsterSpritePath = getMonsterBattleSprite(assetFolder, adapter, monster.templateId);
        }

        // Compute background image path
        const backgroundPath = assetFolder
            ? adapter.getResourcePath(`${assetFolder}/backgrounds/battle-bg.jpg`)
            : undefined;

        // Create React root and render
        this.root = createRoot(container as HTMLElement);
        this.root.render(
            <BattleComponent
                onBattleEnd={() => {
                    // Close the battle view when battle ends
                    this.leaf.detach();
                }}
                onShowLoot={(loot) => {
                    if (loot && loot.length > 0) {
                        // Add loot to inventory BEFORE showing modal
                        for (const reward of loot) {
                            if (reward.type === 'gold') {
                                useCharacterStore.getState().updateGold(reward.amount);
                            } else if (reward.type === 'gear') {
                                useCharacterStore.getState().addGear(reward.item);
                            } else if (reward.type === 'consumable') {
                                useCharacterStore.getState().addInventoryItem(reward.itemId, reward.quantity);
                            }
                        }
                        // Persist changes to settings
                        this.plugin.settings.character = useCharacterStore.getState().character;
                        this.plugin.settings.inventory = useCharacterStore.getState().inventory;
                        this.plugin.saveSettings();

                        showLootModal(this.app, {
                            title: 'Victory Rewards!',
                            subtitle: 'Your spoils from battle',
                            loot: loot,
                        });
                    }
                }}

                onOpenRecoveryModal={() => {
                    openRecoveryOptionsModal(this.app, {
                        onRecoveryComplete: () => {
                            // On recovery complete, close the battle view
                            this.leaf.detach();
                        },
                        onSave: async () => {
                            // Persist character state after recovery
                            const { useCharacterStore } = await import('../store/characterStore');
                            this.plugin.settings.character = useCharacterStore.getState().character;
                            this.plugin.settings.inventory = useCharacterStore.getState().inventory;
                            await this.plugin.saveSettings();
                        }
                    });
                }}
                playerSpritePath={playerSpritePath}
                monsterSpritePath={monsterSpritePath}
                backgroundPath={backgroundPath}
            />
        );
    }

    async onClose(): Promise<void> {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }
}
