/**
 * AssetDownloadModal Unit Tests
 * 
 * Tests for the priority queue logic and exported helpers.
 * The modal class itself requires Obsidian's DOM — only the
 * pure `prioritizeFiles()` function can be unit-tested here.
 */

import { describe, it, expect } from 'vitest';
import { prioritizeFiles } from '../src/modals/AssetDownloadModal';

// ============== prioritizeFiles ===================================

describe('prioritizeFiles', () => {
    const sampleFiles = [
        'backgrounds/battle-bg.jpg',
        'sprites/monsters/goblin/goblin.gif',
        'environment/cave/floor.png',
        'sprites/player/warrior/tier1/warrior-tier-1.gif',
        'sprites/player/paladin/tier1/paladin-tier-1.gif',
        'sprites/player/warrior/tier2/warrior-tier-2.gif',
        'sprites/monsters/skeleton/skeleton.gif',
        'environment/forest/tree.png',
        'sprites/player/rogue/tier1/rogue-tier-1.gif',
    ];

    it('should put current class sprites first', () => {
        const result = prioritizeFiles('warrior', sampleFiles);

        // First items should be warrior sprites
        const warriorSprites = result.filter(f => f.includes('sprites/player/warrior/'));
        expect(result.indexOf(warriorSprites[0])).toBe(0);
        expect(result.indexOf(warriorSprites[1])).toBe(1);
    });

    it('should put other sprites second (after class sprites)', () => {
        const result = prioritizeFiles('warrior', sampleFiles);

        // Find the last warrior sprite index and first non-warrior sprite index
        const lastWarriorIdx = Math.max(
            ...result.map((f, i) => f.includes('sprites/player/warrior/') ? i : -1)
        );
        const firstOtherSpriteIdx = result.findIndex(
            f => f.startsWith('sprites/') && !f.includes('sprites/player/warrior/')
        );

        expect(firstOtherSpriteIdx).toBeGreaterThan(lastWarriorIdx);
    });

    it('should put non-sprite files last', () => {
        const result = prioritizeFiles('warrior', sampleFiles);

        const lastSpriteIdx = Math.max(
            ...result.map((f, i) => f.startsWith('sprites/') ? i : -1)
        );
        const firstNonSpriteIdx = result.findIndex(
            f => !f.startsWith('sprites/')
        );

        expect(firstNonSpriteIdx).toBeGreaterThan(lastSpriteIdx);
    });

    it('should not reorder when characterClass is undefined', () => {
        const result = prioritizeFiles(undefined, sampleFiles);
        expect(result).toEqual(sampleFiles);
    });

    it('should not reorder when characterClass is empty string', () => {
        const result = prioritizeFiles('', sampleFiles);
        expect(result).toEqual(sampleFiles);
    });

    it('should return empty array for empty input', () => {
        const result = prioritizeFiles('warrior', []);
        expect(result).toEqual([]);
    });

    it('should handle case insensitivity for class matching', () => {
        const files = [
            'sprites/player/Warrior/tier1/warrior-tier-1.gif',
            'sprites/monsters/goblin/goblin.gif',
        ];

        const result = prioritizeFiles('Warrior', files);

        // Warrior sprite should come first despite mixed case
        expect(result[0]).toBe('sprites/player/Warrior/tier1/warrior-tier-1.gif');
        expect(result[1]).toBe('sprites/monsters/goblin/goblin.gif');
    });

    it('should preserve order within each priority tier', () => {
        const files = [
            'backgrounds/bg-a.jpg',
            'backgrounds/bg-b.jpg',
            'sprites/monsters/a.gif',
            'sprites/monsters/b.gif',
        ];

        const result = prioritizeFiles('warrior', files);

        // Sprites should come first (no class sprites to prioritize)
        expect(result[0]).toBe('sprites/monsters/a.gif');
        expect(result[1]).toBe('sprites/monsters/b.gif');
        // Then backgrounds in original order
        expect(result[2]).toBe('backgrounds/bg-a.jpg');
        expect(result[3]).toBe('backgrounds/bg-b.jpg');
    });

    it('should return a copy, not mutate the original', () => {
        const original = ['sprites/player/warrior/tier1/w.gif', 'backgrounds/bg.jpg'];
        const originalCopy = [...original];

        prioritizeFiles('warrior', original);

        expect(original).toEqual(originalCopy);
    });
});
