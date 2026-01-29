/**
 * Achievement Service Tests
 * 
 * Tests for achievement unlocking, progress tracking, and initialization.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    AchievementService,
    calculateAchievementProgress,
    AchievementCheckResult,
} from '../src/services/AchievementService';
import { Achievement, isUnlocked, getProgressPercent } from '../src/models/Achievement';
import { getDefaultAchievements } from '../src/data/achievements';
import { Character } from '../src/models/Character';

// =====================
// TEST HELPERS
// =====================

function createMockCharacter(overrides: Partial<Character> = {}): Character {
    return {
        name: 'Test Hero',
        class: 'warrior',
        level: 1,
        totalXP: 0,
        currentHP: 100,
        maxHP: 100,
        currentMana: 50,
        maxMana: 50,
        stamina: 0,
        gold: 0,
        stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        statXP: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString().split('T')[0],
        createdDate: new Date().toISOString(),
        isTrainingMode: false,
        trainingLevel: 1,
        trainingXP: 0,
        activePowerUps: [],
        inventory: [],
        equippedGear: {},
        status: 'active',
        ...overrides,
    } as Character;
}

function createTestAchievement(overrides: Partial<Achievement> = {}): Achievement {
    return {
        id: 'test-achievement',
        name: 'Test Achievement',
        description: 'Test description',
        emoji: '🧪',
        category: 'milestone',
        trigger: { type: 'level', target: 10 },
        xpBonus: 50,
        ...overrides,
    };
}

// =====================
// isUnlocked TESTS
// =====================

describe('isUnlocked', () => {
    it('should return false for achievement without unlockedAt', () => {
        const achievement = createTestAchievement();
        expect(isUnlocked(achievement)).toBe(false);
    });

    it('should return true for achievement with unlockedAt', () => {
        const achievement = createTestAchievement({ unlockedAt: '2024-01-15T12:00:00Z' });
        expect(isUnlocked(achievement)).toBe(true);
    });

    it('should return false for empty string unlockedAt', () => {
        const achievement = createTestAchievement({ unlockedAt: '' });
        expect(isUnlocked(achievement)).toBe(false);
    });
});

// =====================
// getProgressPercent TESTS
// =====================

describe('getProgressPercent', () => {
    it('should return 100 for unlocked achievement', () => {
        const achievement = createTestAchievement({
            unlockedAt: '2024-01-15T12:00:00Z',
            progress: 5,
            trigger: { type: 'level', target: 10 },
        });
        expect(getProgressPercent(achievement)).toBe(100);
    });

    it('should calculate percentage correctly', () => {
        const achievement = createTestAchievement({
            progress: 5,
            trigger: { type: 'level', target: 10 },
        });
        expect(getProgressPercent(achievement)).toBe(50);
    });

    it('should return 0 for no progress', () => {
        const achievement = createTestAchievement({
            progress: 0,
            trigger: { type: 'level', target: 10 },
        });
        expect(getProgressPercent(achievement)).toBe(0);
    });

    it('should handle undefined progress', () => {
        const achievement = createTestAchievement({
            trigger: { type: 'level', target: 10 },
        });
        delete achievement.progress;
        expect(getProgressPercent(achievement)).toBe(0);
    });

    it('should cap at 100 when progress exceeds target', () => {
        const achievement = createTestAchievement({
            progress: 15,
            trigger: { type: 'level', target: 10 },
        });
        expect(getProgressPercent(achievement)).toBe(100);
    });
});

// =====================
// checkLevelAchievements TESTS
// =====================

describe('checkLevelAchievements', () => {
    let service: AchievementService;

    beforeEach(() => {
        service = new AchievementService(null as any);
    });

    it('should unlock level 10 achievement at exactly level 10', () => {
        const achievements = [
            createTestAchievement({ id: 'level-10', trigger: { type: 'level', target: 10 } }),
        ];

        const result = service.checkLevelAchievements(achievements, 10);

        expect(result.newlyUnlocked).toHaveLength(1);
        expect(result.newlyUnlocked[0].id).toBe('level-10');
        expect(isUnlocked(achievements[0])).toBe(true);
    });

    it('should unlock level achievement when exceeding target', () => {
        const achievements = [
            createTestAchievement({ id: 'level-10', trigger: { type: 'level', target: 10 } }),
        ];

        const result = service.checkLevelAchievements(achievements, 15);

        expect(result.newlyUnlocked).toHaveLength(1);
    });

    it('should NOT unlock level achievement before reaching target', () => {
        const achievements = [
            createTestAchievement({ id: 'level-10', trigger: { type: 'level', target: 10 } }),
        ];

        const result = service.checkLevelAchievements(achievements, 9);

        expect(result.newlyUnlocked).toHaveLength(0);
        expect(isUnlocked(achievements[0])).toBe(false);
    });

    it('should NOT re-unlock already unlocked achievement', () => {
        const achievements = [
            createTestAchievement({
                id: 'level-10',
                trigger: { type: 'level', target: 10 },
                unlockedAt: '2024-01-15T12:00:00Z',
            }),
        ];

        const result = service.checkLevelAchievements(achievements, 15);

        expect(result.newlyUnlocked).toHaveLength(0);
    });

    it('should unlock multiple level achievements at once', () => {
        const achievements = [
            createTestAchievement({ id: 'level-10', trigger: { type: 'level', target: 10 }, xpBonus: 50 }),
            createTestAchievement({ id: 'level-13', trigger: { type: 'level', target: 13 }, xpBonus: 75 }),
            createTestAchievement({ id: 'level-16', trigger: { type: 'level', target: 16 }, xpBonus: 100 }),
        ];

        const result = service.checkLevelAchievements(achievements, 16);

        expect(result.newlyUnlocked).toHaveLength(3);
        expect(result.totalXpBonus).toBe(225); // 50 + 75 + 100
    });

    it('should update progress on non-level achievements', () => {
        const achievements = [
            createTestAchievement({ id: 'level-10', trigger: { type: 'level', target: 10 } }),
        ];

        service.checkLevelAchievements(achievements, 5);

        expect(achievements[0].progress).toBe(5);
    });

    it('should ignore non-level type achievements', () => {
        const achievements = [
            createTestAchievement({ id: 'streak-7', trigger: { type: 'streak', target: 7 } }),
        ];

        const result = service.checkLevelAchievements(achievements, 10);

        expect(result.newlyUnlocked).toHaveLength(0);
    });
});

// =====================
// checkStreakAchievements TESTS
// =====================

describe('checkStreakAchievements', () => {
    let service: AchievementService;

    beforeEach(() => {
        service = new AchievementService(null as any);
    });

    it('should unlock streak achievement at target', () => {
        const achievements = [
            createTestAchievement({ id: 'streak-7', trigger: { type: 'streak', target: 7 } }),
        ];

        const result = service.checkStreakAchievements(achievements, 7);

        expect(result.newlyUnlocked).toHaveLength(1);
        expect(result.newlyUnlocked[0].id).toBe('streak-7');
    });

    it('should unlock streak achievement when exceeding target', () => {
        const achievements = [
            createTestAchievement({ id: 'streak-3', trigger: { type: 'streak', target: 3 } }),
        ];

        const result = service.checkStreakAchievements(achievements, 10);

        expect(result.newlyUnlocked).toHaveLength(1);
    });

    it('should NOT unlock streak achievement below target', () => {
        const achievements = [
            createTestAchievement({ id: 'streak-7', trigger: { type: 'streak', target: 7 } }),
        ];

        const result = service.checkStreakAchievements(achievements, 6);

        expect(result.newlyUnlocked).toHaveLength(0);
    });

    it('should NOT re-unlock already unlocked streak achievement', () => {
        const achievements = [
            createTestAchievement({
                id: 'streak-7',
                trigger: { type: 'streak', target: 7 },
                unlockedAt: '2024-01-15T12:00:00Z',
            }),
        ];

        const result = service.checkStreakAchievements(achievements, 14);

        expect(result.newlyUnlocked).toHaveLength(0);
    });

    it('should unlock multiple streak achievements at once', () => {
        const achievements = [
            createTestAchievement({ id: 'streak-3', trigger: { type: 'streak', target: 3 }, xpBonus: 25 }),
            createTestAchievement({ id: 'streak-7', trigger: { type: 'streak', target: 7 }, xpBonus: 50 }),
            createTestAchievement({ id: 'streak-14', trigger: { type: 'streak', target: 14 }, xpBonus: 100 }),
        ];

        const result = service.checkStreakAchievements(achievements, 14);

        expect(result.newlyUnlocked).toHaveLength(3);
        expect(result.totalXpBonus).toBe(175);
    });

    it('should update progress on streak achievements', () => {
        const achievements = [
            createTestAchievement({ id: 'streak-7', trigger: { type: 'streak', target: 7 } }),
        ];

        service.checkStreakAchievements(achievements, 5);

        expect(achievements[0].progress).toBe(5);
    });
});

// =====================
// checkCategoryCountAchievements TESTS
// =====================

describe('checkCategoryCountAchievements', () => {
    let service: AchievementService;

    beforeEach(() => {
        service = new AchievementService(null as any);
    });

    it('should unlock category achievement at target', () => {
        const achievements = [
            createTestAchievement({
                id: 'apps-5',
                trigger: { type: 'category_count', target: 5, category: 'applications' },
            }),
        ];

        const result = service.checkCategoryCountAchievements(achievements, 'applications', 5);

        expect(result.newlyUnlocked).toHaveLength(1);
    });

    it('should only unlock matching category', () => {
        const achievements = [
            createTestAchievement({
                id: 'apps-5',
                trigger: { type: 'category_count', target: 5, category: 'applications' },
            }),
            createTestAchievement({
                id: 'interviews-3',
                trigger: { type: 'category_count', target: 3, category: 'interviews' },
            }),
        ];

        const result = service.checkCategoryCountAchievements(achievements, 'applications', 10);

        expect(result.newlyUnlocked).toHaveLength(1);
        expect(result.newlyUnlocked[0].id).toBe('apps-5');
    });

    it('should NOT unlock wrong category', () => {
        const achievements = [
            createTestAchievement({
                id: 'apps-5',
                trigger: { type: 'category_count', target: 5, category: 'applications' },
            }),
        ];

        const result = service.checkCategoryCountAchievements(achievements, 'interviews', 10);

        expect(result.newlyUnlocked).toHaveLength(0);
    });

    it('should NOT re-unlock already unlocked category achievement', () => {
        const achievements = [
            createTestAchievement({
                id: 'apps-5',
                trigger: { type: 'category_count', target: 5, category: 'applications' },
                unlockedAt: '2024-01-15T12:00:00Z',
            }),
        ];

        const result = service.checkCategoryCountAchievements(achievements, 'applications', 10);

        expect(result.newlyUnlocked).toHaveLength(0);
    });
});

// =====================
// checkQuestCountAchievements TESTS
// =====================

describe('checkQuestCountAchievements', () => {
    let service: AchievementService;

    beforeEach(() => {
        service = new AchievementService(null as any);
    });

    it('should unlock first quest achievement', () => {
        const achievements = [
            createTestAchievement({
                id: 'first-quest',
                trigger: { type: 'quest_count', target: 1 },
            }),
        ];

        const result = service.checkQuestCountAchievements(achievements, 1);

        expect(result.newlyUnlocked).toHaveLength(1);
        expect(result.newlyUnlocked[0].id).toBe('first-quest');
    });

    it('should NOT re-unlock first quest achievement', () => {
        const achievements = [
            createTestAchievement({
                id: 'first-quest',
                trigger: { type: 'quest_count', target: 1 },
                unlockedAt: '2024-01-15T12:00:00Z',
            }),
        ];

        const result = service.checkQuestCountAchievements(achievements, 5);

        expect(result.newlyUnlocked).toHaveLength(0);
    });

    it('should update progress on quest count achievements', () => {
        const achievements = [
            createTestAchievement({
                id: 'quests-10',
                trigger: { type: 'quest_count', target: 10 },
            }),
        ];

        service.checkQuestCountAchievements(achievements, 7);

        expect(achievements[0].progress).toBe(7);
    });
});

// =====================
// initializeAchievements TESTS
// =====================

describe('initializeAchievements', () => {
    let service: AchievementService;

    beforeEach(() => {
        service = new AchievementService(null as any);
    });

    it('should return defaults when no saved achievements', () => {
        const result = service.initializeAchievements([]);
        const defaults = getDefaultAchievements();

        expect(result.length).toBe(defaults.length);
    });

    it('should preserve unlocked state from saved achievements', () => {
        const saved = [
            {
                id: 'level-10',
                name: 'Veteran Adventurer',
                description: 'Reach Level 10',
                emoji: '🎖️',
                category: 'milestone' as const,
                trigger: { type: 'level' as const, target: 10 },
                xpBonus: 50,
                unlockedAt: '2024-01-15T12:00:00Z',
                progress: 10,
            },
        ];

        const result = service.initializeAchievements(saved);
        const level10 = result.find(a => a.id === 'level-10');

        expect(level10?.unlockedAt).toBe('2024-01-15T12:00:00Z');
        expect(level10?.progress).toBe(10);
    });

    it('should preserve custom achievements not in defaults', () => {
        const custom: Achievement = {
            id: 'custom-test',
            name: 'Custom Test',
            description: 'A custom achievement',
            emoji: '🎯',
            category: 'custom',
            trigger: { type: 'manual', target: 1 },
            xpBonus: 100,
        };

        const result = service.initializeAchievements([custom]);
        const found = result.find(a => a.id === 'custom-test');

        expect(found).toBeDefined();
        expect(found?.name).toBe('Custom Test');
    });

    it('should merge saved progress into default achievements', () => {
        const saved = [
            {
                id: 'level-10',
                name: 'Veteran Adventurer',
                description: 'Reach Level 10',
                emoji: '🎖️',
                category: 'milestone' as const,
                trigger: { type: 'level' as const, target: 10 },
                xpBonus: 50,
                progress: 7,
            },
        ];

        const result = service.initializeAchievements(saved);
        const level10 = result.find(a => a.id === 'level-10');

        expect(level10?.progress).toBe(7);
    });
});

// =====================
// calculateAchievementProgress TESTS
// =====================

describe('calculateAchievementProgress', () => {
    it('should update level progress from character', () => {
        const achievements = [
            createTestAchievement({ id: 'level-10', trigger: { type: 'level', target: 10 } }),
        ];
        const character = createMockCharacter({ level: 7 });

        const result = calculateAchievementProgress(achievements, character);

        expect(result[0].progress).toBe(7);
    });

    it('should use trainingLevel when in training mode', () => {
        const achievements = [
            createTestAchievement({ id: 'level-10', trigger: { type: 'level', target: 10 } }),
        ];
        const character = createMockCharacter({
            level: 1,
            isTrainingMode: true,
            trainingLevel: 5,
        });

        const result = calculateAchievementProgress(achievements, character);

        expect(result[0].progress).toBe(5);
    });

    it('should update streak progress from character', () => {
        const achievements = [
            createTestAchievement({ id: 'streak-7', trigger: { type: 'streak', target: 7 } }),
        ];
        const character = createMockCharacter({ currentStreak: 4 });

        const result = calculateAchievementProgress(achievements, character);

        expect(result[0].progress).toBe(4);
    });

    it('should update quest count progress when provided', () => {
        const achievements = [
            createTestAchievement({ id: 'first-quest', trigger: { type: 'quest_count', target: 1 } }),
        ];
        const character = createMockCharacter();

        const result = calculateAchievementProgress(achievements, character, 3);

        expect(result[0].progress).toBe(3);
    });

    it('should NOT update progress for already unlocked achievements', () => {
        const achievements = [
            createTestAchievement({
                id: 'level-10',
                trigger: { type: 'level', target: 10 },
                unlockedAt: '2024-01-15T12:00:00Z',
                progress: 10,
            }),
        ];
        const character = createMockCharacter({ level: 15 });

        const result = calculateAchievementProgress(achievements, character);

        // Should remain unchanged
        expect(result[0].progress).toBe(10);
    });

    it('should return original achievements if character is null', () => {
        const achievements = [
            createTestAchievement({ id: 'level-10', trigger: { type: 'level', target: 10 } }),
        ];

        const result = calculateAchievementProgress(achievements, null);

        expect(result).toBe(achievements);
    });
});

// =====================
// getSortedAchievements TESTS
// =====================

describe('getSortedAchievements', () => {
    let service: AchievementService;

    beforeEach(() => {
        service = new AchievementService(null as any);
    });

    it('should sort unlocked achievements first', () => {
        const achievements = [
            createTestAchievement({ id: 'locked', category: 'milestone' }),
            createTestAchievement({ id: 'unlocked', category: 'milestone', unlockedAt: '2024-01-15T12:00:00Z' }),
        ];

        const sorted = service.getSortedAchievements(achievements);

        expect(sorted[0].id).toBe('unlocked');
        expect(sorted[1].id).toBe('locked');
    });

    it('should sort by category within lock status', () => {
        const achievements = [
            createTestAchievement({ id: 'streak', category: 'streak', trigger: { type: 'streak', target: 3 } }),
            createTestAchievement({ id: 'milestone', category: 'milestone', trigger: { type: 'level', target: 10 } }),
        ];

        const sorted = service.getSortedAchievements(achievements);

        expect(sorted[0].id).toBe('milestone');
        expect(sorted[1].id).toBe('streak');
    });

    it('should sort by target within same category', () => {
        const achievements = [
            createTestAchievement({ id: 'level-20', trigger: { type: 'level', target: 20 }, category: 'milestone' }),
            createTestAchievement({ id: 'level-10', trigger: { type: 'level', target: 10 }, category: 'milestone' }),
        ];

        const sorted = service.getSortedAchievements(achievements);

        expect(sorted[0].id).toBe('level-10');
        expect(sorted[1].id).toBe('level-20');
    });
});

// =====================
// getUnlockedCount TESTS
// =====================

describe('getUnlockedCount', () => {
    let service: AchievementService;

    beforeEach(() => {
        service = new AchievementService(null as any);
    });

    it('should count unlocked achievements', () => {
        const achievements = [
            createTestAchievement({ id: 'a1', unlockedAt: '2024-01-15T12:00:00Z' }),
            createTestAchievement({ id: 'a2' }),
            createTestAchievement({ id: 'a3', unlockedAt: '2024-01-16T12:00:00Z' }),
        ];

        expect(service.getUnlockedCount(achievements)).toBe(2);
    });

    it('should return 0 for no unlocked achievements', () => {
        const achievements = [
            createTestAchievement({ id: 'a1' }),
            createTestAchievement({ id: 'a2' }),
        ];

        expect(service.getUnlockedCount(achievements)).toBe(0);
    });

    it('should return correct count for all unlocked', () => {
        const achievements = [
            createTestAchievement({ id: 'a1', unlockedAt: '2024-01-15T12:00:00Z' }),
            createTestAchievement({ id: 'a2', unlockedAt: '2024-01-16T12:00:00Z' }),
        ];

        expect(service.getUnlockedCount(achievements)).toBe(2);
    });
});

// =====================
// unlockAchievement TESTS
// =====================

describe('unlockAchievement', () => {
    let service: AchievementService;

    beforeEach(() => {
        service = new AchievementService(null as any);
    });

    it('should unlock achievement by id', () => {
        const achievements = [
            createTestAchievement({ id: 'test-1' }),
            createTestAchievement({ id: 'test-2' }),
        ];

        const result = service.unlockAchievement(achievements, 'test-1');

        expect(result).not.toBeNull();
        expect(result?.id).toBe('test-1');
        expect(isUnlocked(achievements[0])).toBe(true);
    });

    it('should return null for already unlocked achievement', () => {
        const achievements = [
            createTestAchievement({ id: 'test-1', unlockedAt: '2024-01-15T12:00:00Z' }),
        ];

        const result = service.unlockAchievement(achievements, 'test-1');

        expect(result).toBeNull();
    });

    it('should return null for non-existent achievement', () => {
        const achievements = [
            createTestAchievement({ id: 'test-1' }),
        ];

        const result = service.unlockAchievement(achievements, 'non-existent');

        expect(result).toBeNull();
    });
});

// =====================
// DEFAULT ACHIEVEMENTS TESTS
// =====================

describe('getDefaultAchievements', () => {
    it('should return level achievements', () => {
        const defaults = getDefaultAchievements();
        const levelAchievements = defaults.filter(a => a.trigger.type === 'level');

        expect(levelAchievements.length).toBeGreaterThanOrEqual(10);
        expect(levelAchievements.some(a => a.id === 'level-10')).toBe(true);
        expect(levelAchievements.some(a => a.id === 'level-40')).toBe(true);
    });

    it('should return streak achievements', () => {
        const defaults = getDefaultAchievements();
        const streakAchievements = defaults.filter(a => a.trigger.type === 'streak');

        expect(streakAchievements.length).toBeGreaterThanOrEqual(6);
        expect(streakAchievements.some(a => a.id === 'streak-3')).toBe(true);
        expect(streakAchievements.some(a => a.id === 'streak-90')).toBe(true);
    });

    it('should return category count achievements', () => {
        const defaults = getDefaultAchievements();
        const categoryAchievements = defaults.filter(a => a.trigger.type === 'category_count');

        expect(categoryAchievements.length).toBeGreaterThanOrEqual(16); // 8 apps + 8 interviews
    });

    it('should return special achievements including first-quest', () => {
        const defaults = getDefaultAchievements();
        const firstQuest = defaults.find(a => a.id === 'first-quest');

        expect(firstQuest).toBeDefined();
        expect(firstQuest?.trigger.type).toBe('quest_count');
        expect(firstQuest?.trigger.target).toBe(1);
    });

    it('should return fresh copies (not shared references)', () => {
        const defaults1 = getDefaultAchievements();
        const defaults2 = getDefaultAchievements();

        defaults1[0].progress = 999;

        expect(defaults2[0].progress).toBeUndefined();
    });
});
