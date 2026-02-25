/**
 * Title Registry
 * 
 * All available character titles. Titles are unlocked via achievements
 * (see grantedTitleId in achievements.ts) except The Novice which is
 * auto-granted at character creation.
 */

import { Title } from '../models/Title';

/**
 * Starting title ID — auto-granted to all characters
 */
export const STARTING_TITLE_ID = 'the-novice';

/**
 * All title definitions keyed by ID
 */
export const TITLES: Record<string, Title> = {
    // ============================================
    // Cosmetic Titles (no buff)
    // ============================================

    'the-novice': {
        id: 'the-novice',
        name: 'The Novice',
        description: 'Every legend begins somewhere.',
        unlockCondition: 'Free starting title',
        emoji: '🌱',
        rarity: 'common',
    },

    'questrunner': {
        id: 'questrunner',
        name: 'Questrunner',
        description: '10 quests down, a thousand to go.',
        unlockCondition: 'Complete 10 quests',
        emoji: '🏃',
        rarity: 'common',
    },

    'streak-keeper': {
        id: 'streak-keeper',
        name: 'Streak Keeper',
        description: 'Consistency is the mark of a true adventurer.',
        unlockCondition: 'Maintain a 7-day streak',
        emoji: '🔥',
        rarity: 'rare',
    },

    'dungeon-delver': {
        id: 'dungeon-delver',
        name: 'Dungeon Delver',
        description: 'The darkness holds no fear for you.',
        unlockCondition: 'Complete 3 dungeons',
        emoji: '🗺️',
        rarity: 'rare',
    },

    'the-dedicated': {
        id: 'the-dedicated',
        name: 'The Dedicated',
        description: 'Your commitment sets you apart.',
        unlockCondition: 'Reach Level 10',
        emoji: '⭐',
        rarity: 'rare',
    },

    // ============================================
    // Buff Titles (cosmetic + passive micro-buff)
    // ============================================

    'the-scholar': {
        id: 'the-scholar',
        name: 'The Scholar',
        description: 'Knowledge is the greatest weapon.',
        unlockCondition: 'Complete 50 quests',
        emoji: '📚',
        rarity: 'rare',
        buff: {
            label: '+3% XP from all sources',
            effect: { type: 'xp_multiplier', value: 1.03 },
        },
    },

    'fortune-favored': {
        id: 'fortune-favored',
        name: "Fortune's Favorite",
        description: 'Gold seems to find its way to you.',
        unlockCondition: 'Earn 1000 total gold',
        emoji: '💰',
        rarity: 'epic',
        buff: {
            label: '+5% Gold from all sources',
            effect: { type: 'gold_multiplier', value: 1.05 },
        },
    },

    'eagle-eye': {
        id: 'eagle-eye',
        name: 'Eagle Eye',
        description: 'Your strikes find the weak points.',
        unlockCondition: 'Win 25 battles',
        emoji: '🦅',
        rarity: 'epic',
        buff: {
            label: '+2% Crit Chance',
            effect: { type: 'crit_chance', value: 2 },
        },
    },

    'the-tempered': {
        id: 'the-tempered',
        name: 'The Tempered',
        description: 'Forged through trials, stronger in every way.',
        unlockCondition: 'Reach Level 20',
        emoji: '🔨',
        rarity: 'epic',
        buff: {
            label: '+1 All Stats',
            effect: { type: 'all_stats_boost', value: 1 },
        },
    },

    'the-focused': {
        id: 'the-focused',
        name: 'The Focused',
        description: 'Mastery of your class hones your primary abilities.',
        unlockCondition: 'Reach Level 25',
        emoji: '🎯',
        rarity: 'epic',
        buff: {
            label: '+3% to both primary stats',
            // Resolved at equip time by TitleService.createTitlePowerUps()
            // based on character's class primaryStats tuple.
            // Placeholder — TitleService builds the real PowerUpEffect[] array.
            effect: { type: 'stat_percent_boost', stat: 'strength', value: 0.03 },
        },
    },

    'slayer-of-the-void': {
        id: 'slayer-of-the-void',
        name: 'Slayer of the Void',
        description: 'Bosses tremble at your approach.',
        unlockCondition: 'Defeat 10 bosses',
        emoji: '💀',
        rarity: 'legendary',
        // NOTE: No buff field — boss damage is a direct check in BattleService
        // (Phase 3), not a PowerUpEffect. This avoids expanding the union type.
    },

    'the-relentless': {
        id: 'the-relentless',
        name: 'The Relentless',
        description: 'An unstoppable force of dedication and power.',
        unlockCondition: 'Maintain a 30-day streak',
        emoji: '⚡',
        rarity: 'legendary',
        buff: {
            label: '+1 All Stats, +2% XP',
            effect: [
                { type: 'all_stats_boost', value: 1 },
                { type: 'xp_multiplier', value: 1.02 },
            ],
        },
    },
};
