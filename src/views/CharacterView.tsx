/**
 * CharacterView - Full-page ItemView for the Character Page
 *
 * Opens in its own tab. Uses React for rendering the character page UI.
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { CHARACTER_VIEW_TYPE } from './constants';
import { CharacterPage } from '../components/CharacterPage';
import type QuestBoardPlugin from '../../main';

export class CharacterView extends ItemView {
    private root: Root | null = null;
    private plugin: QuestBoardPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: QuestBoardPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return CHARACTER_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'Character';
    }

    getIcon(): string {
        return 'user';
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('qb-fullpage-container');

        this.root = createRoot(container as HTMLElement);
        this.root.render(
            <CharacterPage
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
