/**
 * DungeonItemView - Full-page ItemView for Dungeon Exploration
 * 
 * Opens in its own tab for immersive dungeon exploration.
 * Uses React for rendering the dungeon UI.
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { DUNGEON_VIEW_TYPE } from './constants';
import { DungeonView } from '../components/DungeonView';
import type QuestBoardPlugin from '../../main';

export class DungeonItemView extends ItemView {
    private root: Root | null = null;
    private plugin: QuestBoardPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: QuestBoardPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return DUNGEON_VIEW_TYPE;
    }

    getDisplayText(): string {
        return '🗺️ Dungeon';
    }

    getIcon(): string {
        return 'map';
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('qb-dungeon-container');

        const assetFolder = this.plugin.manifest.dir ?? '';
        const adapter = this.app.vault.adapter;

        // Create React root and render
        this.root = createRoot(container as HTMLElement);
        this.root.render(
            <DungeonView
                assetFolder={assetFolder}
                adapter={adapter}
                app={this.app}
                onClose={() => {
                    // Close the dungeon view
                    this.leaf.detach();
                }}
                onSave={async () => {
                    // Save character data (including exploration history)
                    const { useCharacterStore } = await import('../store/characterStore');
                    this.plugin.settings.character = useCharacterStore.getState().character;
                    this.plugin.settings.inventory = useCharacterStore.getState().inventory;
                    await this.plugin.saveSettings();
                }}
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
