/**
 * Quest Board - Main Plugin Entry Point
 * 
 * This file should remain THIN (~50-100 lines max).
 * All business logic lives in services, components, and stores.
 */

import { Plugin, WorkspaceLeaf } from 'obsidian';
import { QuestBoardSettings, DEFAULT_SETTINGS, QuestBoardSettingTab } from './src/settings';
import {
    QUEST_BOARD_VIEW_TYPE,
    QUEST_SIDEBAR_VIEW_TYPE,
    QuestBoardView,
    QuestSidebarView
} from './src/views';
import { CreateQuestModal } from './src/modals/CreateQuestModal';

export default class QuestBoardPlugin extends Plugin {
    settings!: QuestBoardSettings;

    async onload(): Promise<void> {
        console.log('Loading Quest Board plugin');

        // Load settings
        await this.loadSettings();

        // Register the full-page view
        this.registerView(
            QUEST_BOARD_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new QuestBoardView(leaf, this)
        );

        // Register the sidebar view
        this.registerView(
            QUEST_SIDEBAR_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new QuestSidebarView(leaf, this)
        );

        // Add ribbon icon to open focused sidebar
        this.addRibbonIcon('swords', 'Open Quest Board', () => {
            this.activateSidebarView();
        });

        // Add command to open focused sidebar
        this.addCommand({
            id: 'open-quest-board-sidebar',
            name: 'Open Quest Board (Sidebar)',
            callback: () => {
                this.activateSidebarView();
            },
        });

        // Add command to open full-page Kanban
        this.addCommand({
            id: 'open-quest-board-full',
            name: 'Open Quest Board (Full Page)',
            callback: () => {
                this.activateFullPageView();
            },
        });

        // Add command for character creation/edit
        this.addCommand({
            id: 'create-edit-character',
            name: 'Create/Edit Character',
            callback: () => {
                // TODO: Open character creation modal
                console.log('Character creation modal - coming soon');
            },
        });

        // Add command to create a new quest
        this.addCommand({
            id: 'create-quest',
            name: 'Create New Quest',
            callback: () => {
                new CreateQuestModal(this.app, this, () => {
                    // Refresh views after quest creation
                    this.app.workspace.trigger('quest-board:refresh');
                }).open();
            },
        });

        // Add settings tab
        this.addSettingTab(new QuestBoardSettingTab(this.app, this));

        console.log('Quest Board plugin loaded successfully');
    }

    onunload(): void {
        console.log('Unloading Quest Board plugin');
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    /**
     * Activates the focused sidebar view in right split
     */
    async activateSidebarView(): Promise<void> {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(QUEST_SIDEBAR_VIEW_TYPE);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: QUEST_SIDEBAR_VIEW_TYPE, active: true });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    /**
     * Activates the full-page Kanban view in a new tab
     */
    async activateFullPageView(): Promise<void> {
        const { workspace } = this.app;

        // Check if already open in the main area (not sidebar)
        const leaves = workspace.getLeavesOfType(QUEST_BOARD_VIEW_TYPE);
        for (const existingLeaf of leaves) {
            // Check if this leaf is in the main area (not right/left sidebar)
            const root = existingLeaf.getRoot();
            if (root === workspace.rootSplit) {
                workspace.revealLeaf(existingLeaf);
                return;
            }
        }

        // Open in a new tab in the main area
        const leaf = workspace.getLeaf('tab');
        if (leaf) {
            await leaf.setViewState({ type: QUEST_BOARD_VIEW_TYPE, active: true });
            workspace.revealLeaf(leaf);
        }
    }
}


