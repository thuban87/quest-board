/**
 * useSaveCharacter Hook
 * 
 * Provides a memoized callback to save character, inventory, and achievements
 * to plugin settings. Consolidates duplicated logic from components.
 */

import { useCallback } from 'react';
import { useCharacterStore } from '../store/characterStore';
import type QuestBoardPlugin from '../../main';

/**
 * Hook that provides a save callback for persisting character data to plugin settings.
 * Used by multiple components to avoid duplicating the save logic.
 */
export function useSaveCharacter(plugin: QuestBoardPlugin) {
    return useCallback(async () => {
        const currentCharacter = useCharacterStore.getState().character;
        const currentInventory = useCharacterStore.getState().inventory;
        const currentAchievements = useCharacterStore.getState().achievements;
        plugin.settings.character = currentCharacter;
        plugin.settings.inventory = currentInventory;
        plugin.settings.achievements = currentAchievements;
        await plugin.saveSettings();
    }, [plugin]);
}
