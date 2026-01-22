/**
 * QuestBoardCommandMenu - Consolidated command menu for Quest Board
 * 
 * Single modal that lists all Quest Board commands as large buttons
 * grouped by category in a responsive grid layout.
 */

import { Modal } from 'obsidian';
import type QuestBoardPlugin from '../../main';

interface CommandItem {
    label: string;
    icon: string;
    commandId: string;
    description?: string;
}

interface CommandCategory {
    name: string;
    icon: string;
    commands: CommandItem[];
}

export class QuestBoardCommandMenu extends Modal {
    private plugin: QuestBoardPlugin;

    constructor(plugin: QuestBoardPlugin) {
        super(plugin.app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-command-menu');

        // Header
        const header = contentEl.createDiv('qb-menu-header');
        header.createEl('h2', { text: '⚔️ Quest Board' });
        header.createEl('p', { text: 'Choose your action, adventurer', cls: 'qb-menu-subtitle' });

        const categories: CommandCategory[] = [
            {
                name: 'Views',
                icon: '👁️',
                commands: [
                    { label: 'Sidebar', icon: '📑', commandId: 'quest-board:open-quest-board-sidebar', description: 'Compact sidebar view' },
                    { label: 'Full Page', icon: '📖', commandId: 'quest-board:open-quest-board-full', description: 'Immersive Kanban board' },
                ]
            },
            {
                name: 'Create',
                icon: '✨',
                commands: [
                    { label: 'New Quest', icon: '⚔️', commandId: 'quest-board:create-quest', description: 'Start a new adventure' },
                    { label: 'From Template', icon: '📜', commandId: 'quest-board:create-quest-from-template', description: 'Use a quest template' },
                    { label: 'Application', icon: '📄', commandId: 'quest-board:create-application-gauntlet', description: 'Job application tracker' },
                    { label: 'Interview', icon: '🎤', commandId: 'quest-board:create-interview-arena', description: 'Interview prep workflow' },
                ]
            },
            {
                name: 'Character',
                icon: '🧙',
                commands: [
                    { label: 'Edit Character', icon: '👤', commandId: 'quest-board:create-edit-character', description: 'Modify your hero' },
                    { label: 'Achievements', icon: '🏆', commandId: 'quest-board:view-achievements', description: 'View trophy case' },
                    { label: 'New Achievement', icon: '🎖️', commandId: 'quest-board:create-achievement', description: 'Create custom badge' },
                ]
            },
            {
                name: 'Quests',
                icon: '🗓️',
                commands: [
                    { label: 'Recurring Dashboard', icon: '🔄', commandId: 'quest-board:recurring-quests-dashboard', description: 'Manage recurring quests' },
                    { label: 'Process Recurring', icon: '⏰', commandId: 'quest-board:process-recurring-quests', description: 'Generate due instances' },
                ]
            },
            {
                name: 'Utilities',
                icon: '🔧',
                commands: [
                    { label: 'Settings', icon: '⚙️', commandId: '__settings__', description: 'Configure Quest Board' },
                ]
            },
        ];

        const grid = contentEl.createDiv('qb-menu-grid');

        for (const category of categories) {
            const section = grid.createDiv('qb-menu-section');
            section.createEl('h3', { text: `${category.icon} ${category.name}` });

            const buttonsGrid = section.createDiv('qb-menu-buttons');

            // Set grid class based on command count
            if (category.commands.length === 4) {
                buttonsGrid.addClass('qb-buttons-2x2');
            } else if (category.commands.length === 3) {
                // 2 on top, 1 centered below
                buttonsGrid.addClass('qb-buttons-2x2');
            } else if (category.commands.length === 2) {
                buttonsGrid.addClass('qb-buttons-2');
            } else {
                buttonsGrid.addClass('qb-buttons-1');
            }

            for (const cmd of category.commands) {
                const btn = buttonsGrid.createDiv('qb-menu-btn');
                btn.createSpan({ cls: 'qb-menu-btn-icon', text: cmd.icon });

                const textContainer = btn.createDiv('qb-menu-btn-text');
                textContainer.createSpan({ cls: 'qb-menu-btn-label', text: cmd.label });
                if (cmd.description) {
                    textContainer.createSpan({ cls: 'qb-menu-btn-desc', text: cmd.description });
                }

                btn.onclick = () => {
                    this.close();
                    if (cmd.commandId === '__settings__') {
                        (this.app as any).setting.open();
                        (this.app as any).setting.openTabById('quest-board');
                    } else {
                        (this.app as any).commands.executeCommandById(cmd.commandId);
                    }
                };
            }
        }
    }

    onClose() {
        this.contentEl.empty();
    }
}
