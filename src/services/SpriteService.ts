/**
 * SpriteService
 * 
 * Centralized utility for resolving sprite paths from bundled plugin assets.
 * Handles player sprites (class/tier based) and monster sprites.
 * 
 * Path conventions:
 * - Player: assets/sprites/player/{class}/tier{n}/{class}_tier_{n}.gif (animated)
 * - Player: assets/sprites/player/{class}/tier{n}/{class}_tier_{n}_{direction}.png (static)
 * - Monster (common): assets/sprites/monsters/common/{monster-id}/{monster-id}.gif
 * - Monster (boss):   assets/sprites/monsters/bosses/{monster-id}/{monster-id}.gif
 * - Same pattern for directional PNGs with _{direction}.png suffix
 */

import { DataAdapter } from 'obsidian';

// Valid directions for sprites
export type SpriteDirection =
    | 'north' | 'north-east' | 'east' | 'south-east'
    | 'south' | 'south-west' | 'west' | 'north-west';

// Default directions for different contexts
export const PLAYER_BATTLE_DIRECTION: SpriteDirection = 'north-east';
export const PLAYER_DEFAULT_DIRECTION: SpriteDirection = 'south';
export const MONSTER_BATTLE_DIRECTION: SpriteDirection = 'south-west';

// Supported file extensions in priority order
const EXTENSIONS = ['gif', 'png', 'jpg', 'jpeg'] as const;

/**
 * Get the base sprite directory path
 */
function getBasePath(assetFolder: string): string {
    return `${assetFolder}/sprites`;
}

// =====================
// PLAYER SPRITE FUNCTIONS
// =====================

/**
 * Get the path to an animated player sprite (GIF)
 * Used for: Character sheet, tier transition modals
 */
export function getPlayerGifPath(
    assetFolder: string,
    adapter: DataAdapter,
    className: string,
    tier: number
): string {
    const basePath = getBasePath(assetFolder);
    const classLower = className.toLowerCase();
    const filePath = `${basePath}/player/${classLower}/tier${tier}/${classLower}-tier-${tier}.gif`;
    return adapter.getResourcePath(filePath);
}

/**
 * Get the path to a static player sprite (PNG)
 * Used for: Battle view (north-east), other directional displays
 */
export function getPlayerSpritePath(
    assetFolder: string,
    adapter: DataAdapter,
    className: string,
    tier: number,
    direction: SpriteDirection = PLAYER_DEFAULT_DIRECTION
): string {
    const basePath = getBasePath(assetFolder);
    const classLower = className.toLowerCase();
    const filePath = `${basePath}/player/${classLower}/tier${tier}/${classLower}-tier-${tier}_${direction}.png`;
    return adapter.getResourcePath(filePath);
}

/**
 * Get the player battle sprite (north-east facing)
 */
export function getPlayerBattleSprite(
    assetFolder: string,
    adapter: DataAdapter,
    className: string,
    tier: number
): string {
    return getPlayerSpritePath(assetFolder, adapter, className, tier, PLAYER_BATTLE_DIRECTION);
}

// =====================
// MONSTER SPRITE FUNCTIONS
// =====================

/**
 * Determine the monster subfolder based on ID convention.
 * Boss monsters (id starts with 'boss-') go in 'bosses/', others in 'common/'.
 */
function getMonsterSubfolder(monsterId: string): string {
    return monsterId.startsWith('boss-') ? 'bosses' : 'common';
}

/**
 * Get the path to an animated monster sprite (GIF)
 * Used for: Bounty modal, monster lexicon
 * 
 * Note: Monster IDs use kebab-case (e.g., 'cave-troll') which matches
 * both folder names and filenames directly.
 */
export function getMonsterGifPath(
    assetFolder: string,
    adapter: DataAdapter,
    monsterId: string
): string {
    const basePath = getBasePath(assetFolder);
    const subfolder = getMonsterSubfolder(monsterId);
    const filePath = `${basePath}/monsters/${subfolder}/${monsterId}/${monsterId}.gif`;
    return adapter.getResourcePath(filePath);
}

/**
 * Get the path to a static monster sprite (PNG)
 * Used for: Battle view (south-west), other directional displays
 * 
 * Note: Monster IDs use kebab-case (e.g., 'cave-troll') which matches
 * both folder names and filenames directly.
 */
export function getMonsterSpritePath(
    assetFolder: string,
    adapter: DataAdapter,
    monsterId: string,
    direction: SpriteDirection = MONSTER_BATTLE_DIRECTION
): string {
    const basePath = getBasePath(assetFolder);
    const subfolder = getMonsterSubfolder(monsterId);
    const filePath = `${basePath}/monsters/${subfolder}/${monsterId}/${monsterId}_${direction}.png`;
    return adapter.getResourcePath(filePath);
}

/**
 * Get the monster battle sprite (south-west facing)
 */
export function getMonsterBattleSprite(
    assetFolder: string,
    adapter: DataAdapter,
    monsterId: string
): string {
    return getMonsterSpritePath(assetFolder, adapter, monsterId, MONSTER_BATTLE_DIRECTION);
}

/**
 * Get monster sprite for special cases (like mimic with only south.png)
 * Falls back through available directions
 */
export function getMonsterFallbackSprite(
    assetFolder: string,
    adapter: DataAdapter,
    monsterId: string
): string {
    const basePath = getBasePath(assetFolder);
    const subfolder = getMonsterSubfolder(monsterId);

    // Try south-west first (battle), then south (fallback for mimic-like monsters)
    const primaryPath = `${basePath}/monsters/${subfolder}/${monsterId}/${monsterId}_south-west.png`;

    // Note: We can't actually check file existence synchronously in Obsidian
    // So we return primary and let the img element's onError handle fallback
    return adapter.getResourcePath(primaryPath);
}

// =====================
// CHARACTER CLASS PREVIEW (for character creation)
// =====================

/**
 * Get the preview sprite for character creation screen
 * Uses tier 4 as the showcase tier
 */
export function getClassPreviewSprite(
    assetFolder: string,
    adapter: DataAdapter,
    className: string
): string {
    return getPlayerGifPath(assetFolder, adapter, className, 4);
}
