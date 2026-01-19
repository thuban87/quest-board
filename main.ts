/**
 * Quest Board - Main Plugin Entry Point
 * 
 * This file should remain THIN (~50-100 lines max).
 * All business logic lives in services, components, and stores.
 */

import { Plugin, WorkspaceLeaf } from 'obsidian';
import { QuestBoardSettings, DEFAULT_SETTINGS, QuestBoardSettingTab } from './src/settings';
import { QUEST_BOARD_VIEW_TYPE, QuestBoardView } from './src/views/QuestBoardView';

export default class QuestBoardPlugin extends Plugin {
    settings!: QuestBoardSettings;

    async onload(): Promise<void> {
        console.log('Loading Quest Board plugin');

        // Load settings
        await this.loadSettings();

        // Register the main view
        this.registerView(
            QUEST_BOARD_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new QuestBoardView(leaf, this)
        );

        // Add ribbon icon to open Quest Board
        this.addRibbonIcon('sword', 'Open Quest Board', () => {
            this.activateView();
        });

        // Add command to open Quest Board
        this.addCommand({
            id: 'open-quest-board',
            name: 'Open Quest Board',
            callback: () => {
                this.activateView();
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
     * Activates the Quest Board view in a new leaf
     */
    async activateView(): Promise<void> {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(QUEST_BOARD_VIEW_TYPE);

        if (leaves.length > 0) {
            // View already exists, focus it
            leaf = leaves[0];
        } else {
            // Create new leaf in the right split
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: QUEST_BOARD_VIEW_TYPE, active: true });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }
}
