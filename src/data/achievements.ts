/**
 * Default Achievement Definitions
 * 
 * Hardcoded achievements that come with the plugin.
 * Users can also create custom achievements via the Create modal.
 */

import { Achievement } from '../models/Achievement';

/**
 * Level milestone achievements
 */
const LEVEL_ACHIEVEMENTS: Achievement[] = [
    { id: 'level-10', name: 'Veteran Adventurer', description: 'Reach Level 10', emoji: '🎖️', category: 'milestone', trigger: { type: 'level', target: 10 }, xpBonus: 50, grantedTitleId: 'the-dedicated' },
    { id: 'level-13', name: 'Seasoned Hero', description: 'Reach Level 13', emoji: '⚔️', category: 'milestone', trigger: { type: 'level', target: 13 }, xpBonus: 75 },
    { id: 'level-16', name: 'Master of Quests', description: 'Reach Level 16', emoji: '🏅', category: 'milestone', trigger: { type: 'level', target: 16 }, xpBonus: 100 },
    { id: 'level-18', name: 'Legendary Champion', description: 'Reach Level 18', emoji: '🦁', category: 'milestone', trigger: { type: 'level', target: 18 }, xpBonus: 125 },
    { id: 'level-20', name: 'Veteran Fighter', description: 'Reach Level 20', emoji: '🔨', category: 'milestone', trigger: { type: 'level', target: 20 }, xpBonus: 150, grantedTitleId: 'the-tempered' },
    { id: 'level-21', name: 'Epic Warrior', description: 'Reach Level 21', emoji: '🐉', category: 'milestone', trigger: { type: 'level', target: 21 }, xpBonus: 150 },
    { id: 'level-25', name: 'Mythic Conqueror', description: 'Reach Level 25', emoji: '👑', category: 'milestone', trigger: { type: 'level', target: 25 }, xpBonus: 200, grantedTitleId: 'the-focused' },
    { id: 'level-30', name: 'Titan of Tasks', description: 'Reach Level 30', emoji: '⭐', category: 'milestone', trigger: { type: 'level', target: 30 }, xpBonus: 250 },
    { id: 'level-35', name: 'Ascended One', description: 'Reach Level 35', emoji: '🌟', category: 'milestone', trigger: { type: 'level', target: 35 }, xpBonus: 300 },
    { id: 'level-38', name: 'Near Immortal', description: 'Reach Level 38', emoji: '💫', category: 'milestone', trigger: { type: 'level', target: 38 }, xpBonus: 350 },
    { id: 'level-40', name: 'Quest Board Master', description: 'Reach Level 40', emoji: '🏆', category: 'milestone', trigger: { type: 'level', target: 40 }, xpBonus: 500 },
];

/**
 * Application count achievements
 */
const APPLICATION_ACHIEVEMENTS: Achievement[] = [
    { id: 'apps-1', name: 'First Application', description: 'Submit your first job application', emoji: '📝', category: 'quest_count', trigger: { type: 'category_count', target: 1, category: 'applications' }, xpBonus: 25 },
    { id: 'apps-5', name: 'Getting Started', description: 'Submit 5 job applications', emoji: '📋', category: 'quest_count', trigger: { type: 'category_count', target: 5, category: 'applications' }, xpBonus: 50 },
    { id: 'apps-10', name: 'Building Momentum', description: 'Submit 10 job applications', emoji: '📊', category: 'quest_count', trigger: { type: 'category_count', target: 10, category: 'applications' }, xpBonus: 75 },
    { id: 'apps-20', name: 'Persistent Seeker', description: 'Submit 20 job applications', emoji: '🎯', category: 'quest_count', trigger: { type: 'category_count', target: 20, category: 'applications' }, xpBonus: 100 },
    { id: 'apps-35', name: 'Dedicated Hunter', description: 'Submit 35 job applications', emoji: '🔥', category: 'quest_count', trigger: { type: 'category_count', target: 35, category: 'applications' }, xpBonus: 150 },
    { id: 'apps-50', name: 'Application Master', description: 'Submit 50 job applications', emoji: '💪', category: 'quest_count', trigger: { type: 'category_count', target: 50, category: 'applications' }, xpBonus: 200 },
    { id: 'apps-75', name: 'Unstoppable Force', description: 'Submit 75 job applications', emoji: '⚡', category: 'quest_count', trigger: { type: 'category_count', target: 75, category: 'applications' }, xpBonus: 300 },
    { id: 'apps-100', name: 'Century Club', description: 'Submit 100 job applications', emoji: '💯', category: 'quest_count', trigger: { type: 'category_count', target: 100, category: 'applications' }, xpBonus: 500 },
];

/**
 * Interview count achievements
 */
const INTERVIEW_ACHIEVEMENTS: Achievement[] = [
    { id: 'interviews-1', name: 'First Interview', description: 'Complete your first interview', emoji: '🎤', category: 'quest_count', trigger: { type: 'category_count', target: 1, category: 'interviews' }, xpBonus: 50 },
    { id: 'interviews-3', name: 'Interview Rookie', description: 'Complete 3 interviews', emoji: '🗣️', category: 'quest_count', trigger: { type: 'category_count', target: 3, category: 'interviews' }, xpBonus: 75 },
    { id: 'interviews-5', name: 'Confident Speaker', description: 'Complete 5 interviews', emoji: '💼', category: 'quest_count', trigger: { type: 'category_count', target: 5, category: 'interviews' }, xpBonus: 100 },
    { id: 'interviews-10', name: 'Interview Pro', description: 'Complete 10 interviews', emoji: '🎯', category: 'quest_count', trigger: { type: 'category_count', target: 10, category: 'interviews' }, xpBonus: 150 },
    { id: 'interviews-15', name: 'Seasoned Candidate', description: 'Complete 15 interviews', emoji: '⭐', category: 'quest_count', trigger: { type: 'category_count', target: 15, category: 'interviews' }, xpBonus: 200 },
    { id: 'interviews-20', name: 'Interview Veteran', description: 'Complete 20 interviews', emoji: '🏅', category: 'quest_count', trigger: { type: 'category_count', target: 20, category: 'interviews' }, xpBonus: 250 },
    { id: 'interviews-25', name: 'Interview Master', description: 'Complete 25 interviews', emoji: '👔', category: 'quest_count', trigger: { type: 'category_count', target: 25, category: 'interviews' }, xpBonus: 350 },
    { id: 'interviews-30', name: 'Interview Legend', description: 'Complete 30 interviews', emoji: '🏆', category: 'quest_count', trigger: { type: 'category_count', target: 30, category: 'interviews' }, xpBonus: 500 },
];

/**
 * Streak achievements
 */
const STREAK_ACHIEVEMENTS: Achievement[] = [
    { id: 'streak-3', name: 'Getting Consistent', description: 'Maintain a 3-day quest streak', emoji: '🔥', category: 'streak', trigger: { type: 'streak', target: 3 }, xpBonus: 25 },
    { id: 'streak-7', name: 'Week Warrior', description: 'Maintain a 7-day quest streak', emoji: '📅', category: 'streak', trigger: { type: 'streak', target: 7 }, xpBonus: 50, grantedTitleId: 'streak-keeper' },
    { id: 'streak-14', name: 'Fortnight Fighter', description: 'Maintain a 14-day quest streak', emoji: '💪', category: 'streak', trigger: { type: 'streak', target: 14 }, xpBonus: 100 },
    { id: 'streak-30', name: 'Monthly Master', description: 'Maintain a 30-day quest streak', emoji: '🌟', category: 'streak', trigger: { type: 'streak', target: 30 }, xpBonus: 200, grantedTitleId: 'the-relentless' },
    { id: 'streak-60', name: 'Unstoppable', description: 'Maintain a 60-day quest streak', emoji: '⚡', category: 'streak', trigger: { type: 'streak', target: 60 }, xpBonus: 400 },
    { id: 'streak-90', name: 'Legendary Discipline', description: 'Maintain a 90-day quest streak', emoji: '🏆', category: 'streak', trigger: { type: 'streak', target: 90 }, xpBonus: 750 },
];

/**
 * Quest count achievements (total quests completed)
 */
const QUEST_COUNT_ACHIEVEMENTS: Achievement[] = [
    { id: 'quests-10', name: "Adventurer's Start", description: 'Complete 10 quests', emoji: '🗡️', category: 'quest_count', trigger: { type: 'quest_count', target: 10 }, xpBonus: 50, grantedTitleId: 'questrunner' },
    { id: 'quests-50', name: 'Seasoned Adventurer', description: 'Complete 50 quests', emoji: '📚', category: 'quest_count', trigger: { type: 'quest_count', target: 50 }, xpBonus: 150, grantedTitleId: 'the-scholar' },
];

/**
 * Combat and lifetime stat achievements (manual trigger, checked against lifetimeStats)
 */
const COMBAT_ACHIEVEMENTS: Achievement[] = [
    { id: 'dungeons-3', name: 'Dungeon Explorer', description: 'Complete 3 dungeons', emoji: '🗺️', category: 'special', trigger: { type: 'manual', target: 1 }, xpBonus: 100, grantedTitleId: 'dungeon-delver' },
    { id: 'gold-1000', name: 'Fortune Seeker', description: 'Earn 1000 total gold', emoji: '💰', category: 'special', trigger: { type: 'manual', target: 1 }, xpBonus: 100, grantedTitleId: 'fortune-favored' },
    { id: 'battles-25', name: 'Veteran Fighter', description: 'Win 25 battles', emoji: '⚔️', category: 'special', trigger: { type: 'manual', target: 1 }, xpBonus: 100, grantedTitleId: 'eagle-eye' },
    { id: 'bosses-10', name: 'Boss Hunter', description: 'Defeat 10 bosses', emoji: '💀', category: 'special', trigger: { type: 'manual', target: 1 }, xpBonus: 200, grantedTitleId: 'slayer-of-the-void' },
];

/**
 * Special achievements (manually triggered or unique conditions)
 */
const SPECIAL_ACHIEVEMENTS: Achievement[] = [
    { id: 'training-graduate', name: 'Training Graduate', description: 'Complete training mode', emoji: '🎓', category: 'special', trigger: { type: 'manual', target: 1 }, xpBonus: 100 },
    { id: 'first-quest', name: 'First Quest', description: 'Complete your first quest', emoji: '🌱', category: 'special', trigger: { type: 'quest_count', target: 1 }, xpBonus: 25 },
];

/**
 * All default achievements
 */
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
    ...LEVEL_ACHIEVEMENTS,
    ...APPLICATION_ACHIEVEMENTS,
    ...INTERVIEW_ACHIEVEMENTS,
    ...STREAK_ACHIEVEMENTS,
    ...QUEST_COUNT_ACHIEVEMENTS,
    ...COMBAT_ACHIEVEMENTS,
    ...SPECIAL_ACHIEVEMENTS,
];

/**
 * Get a fresh copy of default achievements (for initialization)
 */
export function getDefaultAchievements(): Achievement[] {
    return DEFAULT_ACHIEVEMENTS.map(a => ({ ...a }));
}
