/**
 * Quest Board - Main View
 * 
 * The primary React-based view for the Quest Board plugin.
 * Renders the Kanban board, character sheet, and sprint view.
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import type QuestBoardPlugin from '../../main';
import { App } from '../components/App';

export const QUEST_BOARD_VIEW_TYPE = 'quest-board-view';

export class QuestBoardView extends ItemView {
    plugin: QuestBoardPlugin;
    private root: Root | null = null;

    constructor(leaf: WorkspaceLeaf, plugin: QuestBoardPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return QUEST_BOARD_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'Quest Board';
    }

    getIcon(): string {
        return 'sword';
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('quest-board-container');

        // Mount React app
        this.root = createRoot(container);
        this.root.render(
            React.createElement(App, {
                plugin: this.plugin,
                app: this.app,
            })
        );
    }

    async onClose(): Promise<void> {
        // Cleanup React
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }
}
