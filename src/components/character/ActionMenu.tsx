/**
 * ActionMenu - RPG-styled menu buttons for the full-page character view.
 *
 * 2x3 grid of action buttons that open existing modals.
 */

import React from 'react';

interface ActionMenuProps {
    onOpenInventory: () => void;
    onOpenBlacksmith: () => void;
    onOpenStore: () => void;
    onOpenSkillLoadout: () => void;
    onOpenAchievements: () => void;
    onOpenProgressDashboard: () => void;
}

const MENU_ITEMS: { emoji: string; label: string; key: keyof ActionMenuProps }[] = [
    { emoji: '🎒', label: 'Inventory', key: 'onOpenInventory' },
    { emoji: '🔨', label: 'Blacksmith', key: 'onOpenBlacksmith' },
    { emoji: '🏪', label: 'Store', key: 'onOpenStore' },
    { emoji: '⚔️', label: 'Skills', key: 'onOpenSkillLoadout' },
    { emoji: '🏆', label: 'Achievements', key: 'onOpenAchievements' },
    { emoji: '📊', label: 'Progress', key: 'onOpenProgressDashboard' },
];

export const ActionMenu: React.FC<ActionMenuProps> = (props) => {
    return (
        <div className="qb-action-menu">
            <h3>Actions</h3>
            <div className="qb-action-menu-grid">
                {MENU_ITEMS.map((item) => (
                    <button
                        key={item.key}
                        className="qb-action-menu-btn"
                        onClick={props[item.key]}
                    >
                        <span className="qb-action-menu-icon">{item.emoji}</span>
                        <span className="qb-action-menu-label">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
