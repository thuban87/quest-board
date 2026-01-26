/**
 * Bounty Model
 * 
 * Data model for quest bounties - special combat encounters
 * that trigger on quest completion with enhanced rewards.
 */

import type { Monster } from './Monster';

/**
 * Bounty template with description and monster hint
 */
export interface BountyTemplate {
    description: string;
    monsterHint: string;  // Monster category or specific ID
}

/**
 * A bounty encounter triggered by quest completion
 */
export interface Bounty {
    id: string;
    questId: string;
    questTitle: string;
    folderName: string;
    description: string;
    monsterHint: string;
    monster: Monster;
    lootBonus: number;  // 3.0 = +200% luck
    createdAt: string;
}

/**
 * Result of a bounty roll
 */
export interface BountyRollResult {
    triggered: boolean;
    bounty?: Bounty;
}
