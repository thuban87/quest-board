/**
 * Quest Board - Main React App Component
 * 
 * Root component that handles routing between Board, Sheet, and Sprint views.
 */

import React, { useCallback, useEffect } from 'react';
import { App as ObsidianApp } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { useCharacterStore } from '../store/characterStore';
import { useUIStore, selectIsCharacterCreationOpen } from '../store/uiStore';
import { CharacterCreationModal } from './CharacterCreationModal';
import { KanbanBoard } from './KanbanBoard';
import { CLASS_INFO } from '../models/Character';

interface AppProps {
    plugin: QuestBoardPlugin;
    app: ObsidianApp;
}

/**
 * Main App component
 */
export const App: React.FC<AppProps> = ({ plugin, app }) => {
    const { character, setCharacter, setInventoryAndAchievements } = useCharacterStore();
    const isCharacterCreationOpen = useUIStore(selectIsCharacterCreationOpen);
    const openCharacterCreation = useUIStore((state) => state.openCharacterCreation);
    const closeModals = useUIStore((state) => state.closeModals);

    // Load character from plugin settings on mount
    useEffect(() => {
        if (plugin.settings.character) {
            setCharacter(plugin.settings.character);
        }
        if (plugin.settings.inventory || plugin.settings.achievements) {
            setInventoryAndAchievements(
                plugin.settings.inventory || [],
                plugin.settings.achievements || []
            );
        }
    }, [plugin.settings, setCharacter, setInventoryAndAchievements]);

    // Save character to plugin settings when it changes
    const handleSaveCharacter = useCallback(async () => {
        const currentCharacter = useCharacterStore.getState().character;
        const currentInventory = useCharacterStore.getState().inventory;
        const currentAchievements = useCharacterStore.getState().achievements;

        plugin.settings.character = currentCharacter;
        plugin.settings.inventory = currentInventory;
        plugin.settings.achievements = currentAchievements;
        await plugin.saveSettings();
    }, [plugin]);

    // If no character exists, show welcome/create character prompt
    if (!character) {
        return (
            <div className="quest-board-main">
                <div className="quest-board-empty">
                    <h2>⚔️ Welcome, Adventurer!</h2>
                    <p>Create your character to begin your quest.</p>
                    <button
                        className="qb-btn-primary"
                        onClick={openCharacterCreation}
                    >
                        Create Character
                    </button>
                </div>

                {isCharacterCreationOpen && (
                    <CharacterCreationModal
                        onClose={closeModals}
                        onSave={handleSaveCharacter}
                    />
                )}
            </div>
        );
    }

    // Character exists, show the Quest Board
    return (
        <div className="quest-board-main">
            {/* Kanban Board */}
            <KanbanBoard
                vault={app.vault}
                storageFolder={plugin.settings.storageFolder}
            />

            {/* Modals */}
            {isCharacterCreationOpen && (
                <CharacterCreationModal
                    isEdit={true}
                    onClose={closeModals}
                    onSave={handleSaveCharacter}
                />
            )}
        </div>
    );
};
