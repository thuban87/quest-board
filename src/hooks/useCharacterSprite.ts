/**
 * useCharacterSprite Hook
 *
 * Resolves the character sprite resource path based on character level/tier.
 * Handles fallback from animated.gif to south.png.
 */

import { useMemo } from 'react';
import { Vault, TFile } from 'obsidian';
import { Character, getLevelTier } from '../models/Character';

interface UseCharacterSpriteOptions {
    character: Character | null;
    spriteFolder: string;
    vault: Vault;
}

/**
 * Hook that returns the resolved sprite resource path for a character.
 * 
 * @param options - Character, sprite folder path, and vault reference
 * @returns The vault resource path for the sprite, or undefined if not found
 */
export function useCharacterSprite({
    character,
    spriteFolder,
    vault,
}: UseCharacterSpriteOptions): string | undefined {
    return useMemo(() => {
        if (!character) return undefined;
        if (!spriteFolder) return undefined;

        // Get tier based on training mode or level
        const tier = character.isTrainingMode ? 1 : getLevelTier(character.level);

        // Try animated.gif first
        const animatedPath = `${spriteFolder}/tier${tier}/animated.gif`;
        const animatedFile = vault.getAbstractFileByPath(animatedPath);
        if (animatedFile && animatedFile instanceof TFile) {
            return vault.getResourcePath(animatedFile);
        }

        // Fallback to south.png
        const fallbackPath = `${spriteFolder}/tier${tier}/south.png`;
        const fallbackFile = vault.getAbstractFileByPath(fallbackPath);
        if (fallbackFile && fallbackFile instanceof TFile) {
            return vault.getResourcePath(fallbackFile);
        }

        return undefined;
    }, [character, spriteFolder, vault, character?.level, character?.isTrainingMode]);
}
