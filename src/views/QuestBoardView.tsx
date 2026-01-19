/**
 * QuestBoardView - Full-page ItemView for the Quest Board Kanban
 * 
 * Uses React for rendering the full-page board UI.
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { QUEST_BOARD_VIEW_TYPE } from './constants';
import { FullKanban } from '../components/FullKanban';
import type QuestBoardPlugin from '../../main';

export class QuestBoardView extends ItemView {
    private root: Root | null = null;
    private plugin: QuestBoardPlugin;

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
        return 'swords';
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('qb-fullpage-container');

        // Create React root and render
        this.root = createRoot(container as HTMLElement);
        this.root.render(
            <FullKanban
                plugin={this.plugin}
                app={this.app}
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
