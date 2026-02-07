/**
 * useCharacterSprite Hook
 *
 * Resolves the character sprite resource path based on character class and level/tier.
 * Uses bundled plugin assets instead of vault-based sprite folders.
 */

import { useMemo } from 'react';
import { DataAdapter } from 'obsidian';
import { Character, getLevelTier } from '../models/Character';
import { getPlayerGifPath, getPlayerSpritePath, SpriteDirection } from '../services/SpriteService';

export interface UseCharacterSpriteOptions {
    character: Character | null;
    assetFolder: string | undefined;
    adapter: DataAdapter;
    /** Whether to return animated GIF (true) or static PNG (false). Default: true */
    animated?: boolean;
    /** Direction for static sprites. Default: 'south' */
    direction?: SpriteDirection;
}

/**
 * Hook that returns the resolved sprite resource path for a character.
 * 
 * @param options - Character, manifest directory, adapter, and display options
 * @returns The resource path for the sprite, or undefined if not available
 */
export function useCharacterSprite({
    character,
    assetFolder,
    adapter,
    animated = true,
    direction = 'south',
}: UseCharacterSpriteOptions): string | undefined {
    return useMemo(() => {
        if (!character) return undefined;
        if (!assetFolder) return undefined;

        // Get tier based on training mode or level
        const tier = character.isTrainingMode ? 1 : getLevelTier(character.level);
        const className = character.class;

        try {
            if (animated) {
                return getPlayerGifPath(assetFolder, adapter, className, tier);
            } else {
                return getPlayerSpritePath(assetFolder, adapter, className, tier, direction);
            }
        } catch {
            // Return undefined if path resolution fails
            return undefined;
        }
    }, [character, assetFolder, adapter, animated, direction, character?.level, character?.isTrainingMode, character?.class]);
}
