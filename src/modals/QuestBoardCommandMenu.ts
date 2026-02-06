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
                name: 'Create Quest',
                icon: '✨',
                commands: [
                    { label: 'New Quest', icon: '⚔️', commandId: 'quest-board:create-quest', description: 'Start a new adventure' },
                    { label: 'AI Quest', icon: '🤖', commandId: 'quest-board:ai-generate-quest', description: 'Generate with AI' },
                    { label: 'From Template', icon: '📜', commandId: 'quest-board:create-quest-from-template', description: 'Use a template' },
                ]
            },
            {
                name: 'Job Hunt',
                icon: '💼',
                commands: [
                    { label: 'Application', icon: '📄', commandId: 'quest-board:create-application-gauntlet', description: 'Track applications' },
                    { label: 'Interview', icon: '🎤', commandId: 'quest-board:create-interview-arena', description: 'Interview prep' },
                ]
            },
            {
                name: 'Character',
                icon: '🧙',
                commands: [
                    { label: 'Character Page', icon: '🛡️', commandId: 'quest-board:open-character-page', description: 'Full character view' },
                    { label: 'Edit Character', icon: '👤', commandId: 'quest-board:create-edit-character', description: 'Modify your hero' },
                    { label: 'Inventory', icon: '🎒', commandId: 'quest-board:open-inventory', description: 'Manage gear' },
                    { label: 'Skills', icon: '⚔️', commandId: 'quest-board:manage-skills', description: 'Equip skills' },
                    { label: 'Achievements', icon: '🏆', commandId: 'quest-board:view-achievements', description: 'Trophy case' },
                ]
            },
            {
                name: 'Combat',
                icon: '⚔️',
                commands: [
                    { label: 'Fight', icon: '👹', commandId: 'quest-board:start-fight', description: 'Random encounter' },
                    { label: 'Store', icon: '🏪', commandId: 'quest-board:open-store', description: 'Buy potions' },
                    { label: 'Long Rest', icon: '🏨', commandId: 'quest-board:long-rest', description: 'Restore HP & Mana' },
                    { label: 'Dungeon', icon: '🗺️', commandId: 'quest-board:preview-dungeon', description: 'Explore dungeon' },
                    { label: 'AI Dungeon', icon: '🎲', commandId: 'quest-board:generate-ai-dungeon', description: 'Generate with AI' },
                ]
            },
            {
                name: 'Dashboards',
                icon: '📊',
                commands: [
                    { label: 'Progress', icon: '📈', commandId: 'quest-board:open-progress-dashboard', description: 'View stats' },
                    { label: 'Recurring', icon: '🔄', commandId: 'quest-board:recurring-quests-dashboard', description: 'Manage recurring' },
                ]
            },
            {
                name: 'Utilities',
                icon: '🔧',
                commands: [
                    { label: 'Settings', icon: '⚙️', commandId: '__settings__', description: 'Configure plugin' },
                    { label: 'Process Recurring', icon: '⏰', commandId: 'quest-board:process-recurring-quests', description: 'Generate instances' },
                ]
            },
        ];

        const grid = contentEl.createDiv('qb-menu-grid');

        for (const category of categories) {
            const section = grid.createDiv('qb-menu-section');
            section.createEl('h3', { text: `${category.icon} ${category.name}` });

            const buttonsGrid = section.createDiv('qb-menu-buttons');
            // Always use 2-column grid
            buttonsGrid.addClass('qb-buttons-2col');

            for (let i = 0; i < category.commands.length; i++) {
                const cmd = category.commands[i];
                const btn = buttonsGrid.createDiv('qb-menu-btn');

                // If odd number of commands and this is the last one, make it full width
                const isLastAndOdd = (category.commands.length % 2 === 1) && (i === category.commands.length - 1);
                if (isLastAndOdd) {
                    btn.addClass('qb-menu-btn-full');
                }

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
