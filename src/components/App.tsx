/**
 * Quest Board - Main React App Component
 * 
 * Root component that handles routing between Board, Sheet, and Sprint views.
 */

import React from 'react';
import { App as ObsidianApp } from 'obsidian';
import type QuestBoardPlugin from '../../main';

interface AppProps {
    plugin: QuestBoardPlugin;
    app: ObsidianApp;
}

/**
 * Main App component
 */
export const App: React.FC<AppProps> = ({ plugin, app }) => {
    const character = plugin.settings.character;

    // If no character exists, show welcome/create character prompt
    if (!character) {
        return (
            <div className="quest-board-empty">
                <h2>⚔️ Welcome, Adventurer!</h2>
                <p>Create your character to begin your quest.</p>
                <button
                    className="mod-cta"
                    onClick={() => {
                        // TODO: Open character creation modal
                        console.log('Open character creation modal');
                    }}
                >
                    Create Character
                </button>
            </div>
        );
    }

    // Character exists, show the Quest Board
    return (
        <div className="quest-board-main">
            {/* Header */}
            <header className="quest-board-header">
                <h1>⚔️ Quest Board</h1>
                <div className="character-info">
                    <span className="character-name">{character.name}</span>
                    <span className="character-level">
                        Level {character.level} {character.class.charAt(0).toUpperCase() + character.class.slice(1)}
                    </span>
                </div>
            </header>

            {/* Kanban Board (placeholder for now) */}
            <div className="quest-board-kanban">
                <div className="quest-column">
                    <div className="quest-column-header">
                        <span>Available</span>
                        <span className="quest-column-count">0</span>
                    </div>
                    <div className="quest-column-cards">
                        {/* Quest cards will go here */}
                        <div className="quest-board-empty" style={{ minHeight: '100px' }}>
                            <p>No quests available</p>
                        </div>
                    </div>
                </div>

                <div className="quest-column">
                    <div className="quest-column-header">
                        <span>In Progress</span>
                        <span className="quest-column-count">0</span>
                    </div>
                    <div className="quest-column-cards">
                        <div className="quest-board-empty" style={{ minHeight: '100px' }}>
                            <p>No quests in progress</p>
                        </div>
                    </div>
                </div>

                <div className="quest-column">
                    <div className="quest-column-header">
                        <span>Active</span>
                        <span className="quest-column-count">0</span>
                    </div>
                    <div className="quest-column-cards">
                        <div className="quest-board-empty" style={{ minHeight: '100px' }}>
                            <p>No active quests</p>
                        </div>
                    </div>
                </div>

                <div className="quest-column">
                    <div className="quest-column-header">
                        <span>Completed</span>
                        <span className="quest-column-count">0</span>
                    </div>
                    <div className="quest-column-cards">
                        <div className="quest-board-empty" style={{ minHeight: '100px' }}>
                            <p>No completed quests</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
