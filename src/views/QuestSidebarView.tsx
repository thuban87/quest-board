/**
 * QuestSidebarView - Focused sidebar ItemView for Quest Board
 * 
 * Shows stacked quest cards without completed quests.
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { QUEST_SIDEBAR_VIEW_TYPE } from './constants';
import { SidebarQuests } from '../components/SidebarQuests';
import type QuestBoardPlugin from '../../main';

export class QuestSidebarView extends ItemView {
    private root: Root | null = null;
    private plugin: QuestBoardPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: QuestBoardPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return QUEST_SIDEBAR_VIEW_TYPE;
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
        container.addClass('qb-sidebar-container');

        this.root = createRoot(container as HTMLElement);
        this.root.render(
            <SidebarQuests
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
