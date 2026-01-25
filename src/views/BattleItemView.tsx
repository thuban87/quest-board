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

        // Compute player sprite path from plugin's bundled assets
        const manifestDir = this.plugin.manifest.dir;
        const playerSpritePath = manifestDir
            ? this.app.vault.adapter.getResourcePath(`${manifestDir}/assets/sprites/player/north-east.png`)
            : undefined;

        // Compute background image path
        const backgroundPath = manifestDir
            ? this.app.vault.adapter.getResourcePath(`${manifestDir}/assets/backgrounds/battle-bg.jpg`)
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
                        showLootModal(this.app, {
                            title: 'Victory Rewards!',
                            subtitle: 'Your spoils from battle',
                            loot: loot,
                        });
                    }
                }}
                playerSpritePath={playerSpritePath}
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
