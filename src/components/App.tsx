/**
 * Quest Board - Main React App Component
 * 
 * Root component that handles routing between Board, Sheet, and Sprint views.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { App as ObsidianApp, Notice } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { useCharacterStore } from '../store/characterStore';
import { useUIStore, selectIsCharacterCreationOpen } from '../store/uiStore';
import { CharacterCreationModal } from './CharacterCreationModal';
import { KanbanBoard } from './KanbanBoard';
import { CharacterSheet } from './CharacterSheet';
import { CLASS_INFO } from '../models/Character';
import { getXPProgress, getLevelUpMessage } from '../services/XPSystem';
import { useXPAward } from '../hooks/useXPAward';

interface AppProps {
    plugin: QuestBoardPlugin;
    app: ObsidianApp;
}

type ViewMode = 'board' | 'sheet';

/**
 * Main App component
 */
export const App: React.FC<AppProps> = ({ plugin, app }) => {
    const { character, setCharacter, setInventoryAndAchievements } = useCharacterStore();
    const isCharacterCreationOpen = useUIStore(selectIsCharacterCreationOpen);
    const openCharacterCreation = useUIStore((state) => state.openCharacterCreation);
    const closeModals = useUIStore((state) => state.closeModals);

    // View state
    const [currentView, setCurrentView] = useState<ViewMode>('board');

    // Track level for level-up detection
    const [prevLevel, setPrevLevel] = useState<number | null>(null);

    // Save character to plugin settings
    const handleSaveCharacter = useCallback(async () => {
        const currentCharacter = useCharacterStore.getState().character;
        const currentInventory = useCharacterStore.getState().inventory;
        const currentAchievements = useCharacterStore.getState().achievements;

        plugin.settings.character = currentCharacter;
        plugin.settings.inventory = currentInventory;
        plugin.settings.achievements = currentAchievements;
        await plugin.saveSettings();
    }, [plugin]);

    // XP Award hook - watches task files and awards XP
    useXPAward({
        vault: app.vault,
        onSaveCharacter: handleSaveCharacter,
    });

    // Load character from plugin settings on mount
    useEffect(() => {
        if (plugin.settings.character) {
            setCharacter(plugin.settings.character);
            setPrevLevel(plugin.settings.character.level);
        }
        if (plugin.settings.inventory || plugin.settings.achievements) {
            setInventoryAndAchievements(
                plugin.settings.inventory || [],
                plugin.settings.achievements || []
            );
        }
    }, [plugin.settings, setCharacter, setInventoryAndAchievements]);

    // Level-up detection (for manual XP additions, hook handles task completions)
    useEffect(() => {
        if (character && prevLevel !== null && character.level > prevLevel) {
            const message = getLevelUpMessage(character.class, character.level, false);
            new Notice(message, 5000);
        }
        if (character) {
            setPrevLevel(character.level);
        }
    }, [character?.level]);

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

    const classInfo = CLASS_INFO[character.class];
    const xpProgress = character.isTrainingMode
        ? (character.trainingXP % 100) / 100
        : getXPProgress(character.totalXP);

    // Character exists, show the Quest Board or Character Sheet
    return (
        <div className="quest-board-main">
            {/* Header with XP Bar */}
            <header className="qb-main-header">
                <div className="qb-header-left">
                    <button
                        className={`qb-tab-btn ${currentView === 'board' ? 'active' : ''}`}
                        onClick={() => setCurrentView('board')}
                    >
                        ⚔️ Board
                    </button>
                    <button
                        className={`qb-tab-btn ${currentView === 'sheet' ? 'active' : ''}`}
                        onClick={() => setCurrentView('sheet')}
                    >
                        {classInfo.emoji} Character
                    </button>
                </div>

                <div className="qb-header-right">
                    <div className="qb-header-xp">
                        <span className="qb-header-level">
                            Lvl {character.isTrainingMode
                                ? `T-${character.trainingLevel}`
                                : character.level}
                        </span>
                        <div className="qb-header-xp-bar">
                            <div
                                className="qb-header-xp-fill"
                                style={{
                                    width: `${xpProgress * 100}%`,
                                    backgroundColor: classInfo.primaryColor
                                }}
                            />
                        </div>
                        <span className="qb-header-xp-text">{character.totalXP} XP</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            {currentView === 'board' ? (
                <KanbanBoard
                    vault={app.vault}
                    storageFolder={plugin.settings.storageFolder}
                />
            ) : (
                <CharacterSheet onBack={() => setCurrentView('board')} />
            )}

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
