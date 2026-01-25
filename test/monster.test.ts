/**
 * Monster System Tests
 * 
 * Tests for monster creation, level scaling, prefixes, and templates.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    createMonster,
    createRandomMonster,
    rollPrefix,
    selectMonsterLevel,
    getRandomMonsterTemplate,
} from '../src/services/MonsterService';
import { MONSTER_TEMPLATES, getMonsterTemplate } from '../src/data/monsters';
import { Monster, MonsterPrefix, PREFIX_CONFIG } from '../src/models/Monster';

describe('Monster Templates', () => {
    it('should have 19 monster templates', () => {
        expect(MONSTER_TEMPLATES.length).toBe(19);
    });

    it('all templates should have required fields', () => {
        for (const template of MONSTER_TEMPLATES) {
            expect(template.id).toBeTruthy();
            expect(template.name).toBeTruthy();
            expect(template.category).toBeTruthy();
            expect(template.emoji).toBeTruthy();
            expect(template.baseHP).toBeGreaterThan(0);
            expect(template.baseAttack).toBeGreaterThan(0);
            expect(template.baseDefense).toBeGreaterThan(0);
            expect(template.baseMagicDefense).toBeGreaterThan(0);
            expect(template.baseXP).toBeGreaterThan(0);
        }
    });

    it('should cover all 8 categories', () => {
        const categories = new Set(MONSTER_TEMPLATES.map(t => t.category));
        expect(categories.size).toBe(8);
        expect(categories.has('beasts')).toBe(true);
        expect(categories.has('undead')).toBe(true);
        expect(categories.has('goblins')).toBe(true);
        expect(categories.has('trolls')).toBe(true);
        expect(categories.has('night_elves')).toBe(true);
        expect(categories.has('dwarves')).toBe(true);
        expect(categories.has('dragonkin')).toBe(true);
        expect(categories.has('aberrations')).toBe(true);
    });

    it('getMonsterTemplate should find by ID', () => {
        const goblin = getMonsterTemplate('goblin');
        expect(goblin).toBeDefined();
        expect(goblin?.name).toBe('Goblin');

        const missing = getMonsterTemplate('invalid_id');
        expect(missing).toBeUndefined();
    });
});

describe('Monster Creation', () => {
    it('should create a level 1 goblin', () => {
        const monster = createMonster('goblin', 1, 'overworld');

        expect(monster).not.toBeNull();
        expect(monster!.templateId).toBe('goblin');
        expect(monster!.level).toBe(1);
        expect(monster!.tier).toBe('overworld');
        expect(monster!.maxHP).toBeGreaterThan(50);
        expect(monster!.currentHP).toBe(monster!.maxHP);
    });

    it('should scale stats with level', () => {
        const lvl1 = createMonster('wolf', 1, 'overworld', { forcePrefix: 'none' });
        const lvl10 = createMonster('wolf', 10, 'overworld', { forcePrefix: 'none' });
        const lvl40 = createMonster('wolf', 40, 'overworld', { forcePrefix: 'none' });

        expect(lvl10!.maxHP).toBeGreaterThan(lvl1!.maxHP);
        expect(lvl40!.maxHP).toBeGreaterThan(lvl10!.maxHP);
        expect(lvl10!.attack).toBeGreaterThan(lvl1!.attack);
        expect(lvl40!.attack).toBeGreaterThan(lvl10!.attack);
    });

    it('should apply tier multipliers', () => {
        const overworld = createMonster('skeleton', 20, 'overworld', { forcePrefix: 'none' });
        const dungeon = createMonster('skeleton', 20, 'dungeon', { forcePrefix: 'none' });
        const boss = createMonster('skeleton', 20, 'boss', { forcePrefix: 'none' });
        const raid = createMonster('skeleton', 20, 'raid_boss', { forcePrefix: 'none' });

        // Boss and raid should have more HP
        expect(boss!.maxHP).toBeGreaterThan(overworld!.maxHP);
        expect(raid!.maxHP).toBeGreaterThan(boss!.maxHP);
    });

    it('should return null for unknown template', () => {
        const monster = createMonster('nonexistent', 10, 'overworld');
        expect(monster).toBeNull();
    });

    it('should generate unique IDs', () => {
        const m1 = createMonster('goblin', 1, 'overworld');
        const m2 = createMonster('goblin', 1, 'overworld');
        expect(m1!.id).not.toBe(m2!.id);
    });
});

describe('Prefix System', () => {
    it('should apply fierce prefix (+10% attack)', () => {
        const normal = createMonster('bear', 20, 'overworld', { forcePrefix: 'none' });
        const fierce = createMonster('bear', 20, 'overworld', { forcePrefix: 'fierce' });

        expect(fierce!.name).toContain('Fierce');
        expect(fierce!.attack).toBeGreaterThan(normal!.attack);
        expect(fierce!.prefix).toBe('fierce');
    });

    it('should apply sturdy prefix (+10% HP)', () => {
        const normal = createMonster('bear', 20, 'overworld', { forcePrefix: 'none' });
        const sturdy = createMonster('bear', 20, 'overworld', { forcePrefix: 'sturdy' });

        expect(sturdy!.name).toContain('Sturdy');
        expect(sturdy!.maxHP).toBeGreaterThan(normal!.maxHP);
        expect(sturdy!.prefix).toBe('sturdy');
    });

    it('should apply ancient prefix (+20% all + 1.5x XP)', () => {
        // Use multiple samples to mitigate variance
        let normalHPSum = 0, ancientHPSum = 0;
        let normalAtkSum = 0, ancientAtkSum = 0;
        let normalXPSum = 0, ancientXPSum = 0;
        const samples = 20;

        for (let i = 0; i < samples; i++) {
            const normal = createMonster('cave_troll', 20, 'overworld', { forcePrefix: 'none' });
            const ancient = createMonster('cave_troll', 20, 'overworld', { forcePrefix: 'ancient' });
            normalHPSum += normal!.maxHP;
            ancientHPSum += ancient!.maxHP;
            normalAtkSum += normal!.attack;
            ancientAtkSum += ancient!.attack;
            normalXPSum += normal!.xpReward;
            ancientXPSum += ancient!.xpReward;
        }

        // Ancient averages should be higher (averages cancel out variance)
        expect(ancientHPSum / samples).toBeGreaterThan(normalHPSum / samples);
        expect(ancientAtkSum / samples).toBeGreaterThan(normalAtkSum / samples);
        expect(ancientXPSum / samples).toBeGreaterThan(normalXPSum / samples);

        // Single instance check for name and prefix
        const ancient = createMonster('cave_troll', 20, 'overworld', { forcePrefix: 'ancient' });
        expect(ancient!.name).toContain('Ancient');
        expect(ancient!.prefix).toBe('ancient');
    });

    it('rollPrefix should return valid prefixes', () => {
        const prefixes = new Set<MonsterPrefix>();

        // Roll 500 times to get distribution
        for (let i = 0; i < 500; i++) {
            prefixes.add(rollPrefix());
        }

        // Should eventually get all prefixes (statistically almost certain)
        expect(prefixes.has('none')).toBe(true);
        expect(prefixes.has('fierce')).toBe(true);
        expect(prefixes.has('sturdy')).toBe(true);
        // Ancient is rare (5%) so might not appear in 500 rolls sometimes
    });
});

describe('Monster Level Selection', () => {
    it('should select levels close to player level', () => {
        const playerLevel = 20;
        const levels: number[] = [];

        for (let i = 0; i < 100; i++) {
            levels.push(selectMonsterLevel(playerLevel));
        }

        // Check that most levels are within ±3
        const inRange = levels.filter(l => Math.abs(l - playerLevel) <= 3);
        expect(inRange.length).toBeGreaterThanOrEqual(90);

        // Check that some are exactly player level (50% chance each roll)
        const sameLevel = levels.filter(l => l === playerLevel);
        expect(sameLevel.length).toBeGreaterThan(20);
    });

    it('should respect min/max bounds', () => {
        // At level 1, can't go below 1
        for (let i = 0; i < 50; i++) {
            const level = selectMonsterLevel(1);
            expect(level).toBeGreaterThanOrEqual(1);
        }

        // At level 42, can't go above 43
        for (let i = 0; i < 50; i++) {
            const level = selectMonsterLevel(42);
            expect(level).toBeLessThanOrEqual(43);
        }
    });
});

describe('Random Monster Creation', () => {
    it('should create random monsters at player level', () => {
        for (let i = 0; i < 10; i++) {
            const monster = createRandomMonster(15, 'overworld');
            expect(monster).not.toBeNull();
            expect(Math.abs(monster!.level - 15)).toBeLessThanOrEqual(3);
        }
    });

    it('getRandomMonsterTemplate should return valid templates', () => {
        for (let i = 0; i < 20; i++) {
            const template = getRandomMonsterTemplate();
            expect(MONSTER_TEMPLATES).toContain(template);
        }
    });
});

describe('Monster Rewards', () => {
    it('should calculate gold based on level', () => {
        const lvl1 = createMonster('goblin', 1, 'overworld', { forcePrefix: 'none' });
        const lvl20 = createMonster('goblin', 20, 'overworld', { forcePrefix: 'none' });

        expect(lvl20!.goldReward).toBeGreaterThan(lvl1!.goldReward);
    });

    it('should calculate XP based on level and prefix', () => {
        const normal = createMonster('wolf', 10, 'overworld', { forcePrefix: 'none' });
        const ancient = createMonster('wolf', 10, 'overworld', { forcePrefix: 'ancient' });

        // Ancient should give 1.5x XP
        expect(ancient!.xpReward).toBeGreaterThan(normal!.xpReward * 1.4);
    });
});
