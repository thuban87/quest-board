/**
 * Skill Definitions Tests
 * 
 * Unit tests for src/data/skills.ts helper functions and data integrity.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    getSkillDefinitions,
    getSkillById,
    getSkillsForClass,
    getUnlockedSkills,
} from '../src/data/skills';
import { CharacterClass } from '../src/models/Character';

describe('Skill Definitions', () => {
    // Data Integrity Tests
    describe('data integrity', () => {
        it('returns non-empty array of skills', () => {
            const skills = getSkillDefinitions();
            expect(skills.length).toBeGreaterThan(0);
        });

        it('contains exactly 57 skills (1 universal + 56 class skills)', () => {
            const skills = getSkillDefinitions();
            expect(skills.length).toBe(57);
        });

        it('all skills have unique IDs', () => {
            const skills = getSkillDefinitions();
            const ids = skills.map(s => s.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(skills.length);
        });

        it('all skills have required fields', () => {
            const skills = getSkillDefinitions();
            for (const skill of skills) {
                expect(skill.id).toBeDefined();
                expect(skill.name).toBeDefined();
                expect(skill.description).toBeDefined();
                expect(skill.icon).toBeDefined();
                expect(skill.elementalType).toBeDefined();
                expect(skill.category).toBeDefined();
                expect(typeof skill.manaCost).toBe('number');
                expect(skill.effects).toBeDefined();
                expect(Array.isArray(skill.effects)).toBe(true);
                expect(skill.requiredClass).toBeDefined();
                expect(Array.isArray(skill.requiredClass)).toBe(true);
                expect(typeof skill.learnLevel).toBe('number');
            }
        });

        it('each class has exactly 8 skills', () => {
            const classes: CharacterClass[] = ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'];
            const skills = getSkillDefinitions();

            for (const cls of classes) {
                const classSkills = skills.filter(s =>
                    s.requiredClass.length > 0 && s.requiredClass.includes(cls)
                );
                expect(classSkills.length).toBe(8);
            }
        });

        it('universal skills have empty requiredClass array', () => {
            const skills = getSkillDefinitions();
            const universalSkills = skills.filter(s => s.requiredClass.length === 0);
            expect(universalSkills.length).toBeGreaterThan(0);

            // Verify Meditate is universal
            const meditate = universalSkills.find(s => s.id === 'universal_meditate');
            expect(meditate).toBeDefined();
            expect(meditate!.learnLevel).toBe(1);
        });

        it('skill learn levels follow the expected pattern (5, 8, 13, 18, 23, 28, 33, 38)', () => {
            const expectedLevels = [5, 8, 13, 18, 23, 28, 33, 38];
            const skills = getSkillDefinitions();

            // For each class, verify the 8 skills match expected levels
            const classes: CharacterClass[] = ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'];

            for (const cls of classes) {
                const classSkills = skills
                    .filter(s => s.requiredClass.includes(cls))
                    .sort((a, b) => a.learnLevel - b.learnLevel);

                const levels = classSkills.map(s => s.learnLevel);
                expect(levels).toEqual(expectedLevels);
            }
        });

        it('once-per-battle skills have usesPerBattle = 1', () => {
            const skills = getSkillDefinitions();
            const ultimates = skills.filter(s => s.usesPerBattle === 1);

            // Should be 7 ultimates (one per class, level 38)
            expect(ultimates.length).toBe(7);

            // All should be level 38
            for (const ultimate of ultimates) {
                expect(ultimate.learnLevel).toBe(38);
            }
        });
    });

    // getSkillById Tests
    describe('getSkillById', () => {
        it('returns skill when ID exists', () => {
            const skill = getSkillById('warrior_slash');
            expect(skill).toBeDefined();
            expect(skill!.name).toBe('Slash');
            expect(skill!.requiredClass).toContain('warrior');
        });

        it('returns undefined for non-existent ID', () => {
            const skill = getSkillById('nonexistent_skill');
            expect(skill).toBeUndefined();
        });

        it('returns Meditate for universal_meditate ID', () => {
            const skill = getSkillById('universal_meditate');
            expect(skill).toBeDefined();
            expect(skill!.name).toBe('Meditate');
            expect(skill!.manaCost).toBe(0);
        });
    });

    // getSkillsForClass Tests
    describe('getSkillsForClass', () => {
        it('returns class skills plus universal skills for Warrior', () => {
            const skills = getSkillsForClass('warrior');

            // Should have 8 class skills + 1 universal = 9 total
            expect(skills.length).toBe(9);

            // Should include Meditate
            const hasMeditate = skills.some(s => s.id === 'universal_meditate');
            expect(hasMeditate).toBe(true);

            // Should include Warrior skills
            const hasSlash = skills.some(s => s.id === 'warrior_slash');
            expect(hasSlash).toBe(true);
        });

        it('returns class skills plus universal skills for Paladin', () => {
            const skills = getSkillsForClass('paladin');
            expect(skills.length).toBe(9);

            const hasHolyStrike = skills.some(s => s.id === 'paladin_holy_strike');
            expect(hasHolyStrike).toBe(true);
        });

        it('does not return other class skills', () => {
            const warriorSkills = getSkillsForClass('warrior');

            // Should not have Paladin skills
            const hasPaladinSkill = warriorSkills.some(s => s.id.startsWith('paladin_'));
            expect(hasPaladinSkill).toBe(false);
        });
    });

    // getUnlockedSkills Tests
    describe('getUnlockedSkills', () => {
        it('returns only Meditate at level 1', () => {
            const skills = getUnlockedSkills('warrior', 1);
            expect(skills.length).toBe(1);
            expect(skills[0].id).toBe('universal_meditate');
        });

        it('returns Meditate + first class skill at level 5', () => {
            const skills = getUnlockedSkills('warrior', 5);
            expect(skills.length).toBe(2);

            const hasSlash = skills.some(s => s.id === 'warrior_slash');
            expect(hasSlash).toBe(true);
        });

        it('returns all skills at level 40', () => {
            const skills = getUnlockedSkills('warrior', 40);
            expect(skills.length).toBe(9);  // 8 class + 1 universal
        });

        it('returns correct number of skills at level 20', () => {
            // Level 20 should unlock: 5, 8, 13, 18 = 4 class skills + 1 universal = 5
            const skills = getUnlockedSkills('warrior', 20);
            expect(skills.length).toBe(5);
        });

        it('does not include skills above current level', () => {
            const skills = getUnlockedSkills('warrior', 10);

            // Should have level 5 and 8 skills (+ Meditate) = 3
            expect(skills.length).toBe(3);

            // Should not have Fortify (level 13)
            const hasFortify = skills.some(s => s.id === 'warrior_fortify');
            expect(hasFortify).toBe(false);
        });
    });

    // Lazy Loading Tests
    describe('lazy loading', () => {
        it('returns same frozen reference on multiple calls', () => {
            const first = getSkillDefinitions();
            const second = getSkillDefinitions();

            // Should be exact same reference (cached)
            expect(first).toBe(second);
        });

        it('returned array is frozen (immutable)', () => {
            const skills = getSkillDefinitions();

            // Object.isFrozen checks if array is frozen
            expect(Object.isFrozen(skills)).toBe(true);
        });
    });

    // Specific Skill Validation
    describe('specific skill validation', () => {
        it('Meditate has mana restoration effect', () => {
            const meditate = getSkillById('universal_meditate');
            expect(meditate).toBeDefined();

            const manaEffect = meditate!.effects.find(e => e.type === 'mana');
            expect(manaEffect).toBeDefined();
            expect((manaEffect as { power: number }).power).toBe(33);
        });

        it('Warrior Bloodthirst is once-per-battle', () => {
            const bloodthirst = getSkillById('warrior_bloodthirst');
            expect(bloodthirst).toBeDefined();
            expect(bloodthirst!.usesPerBattle).toBe(1);
        });

        it('Rogue Shadow Strike ignores stages', () => {
            const shadowStrike = getSkillById('rogue_shadow_strike');
            expect(shadowStrike).toBeDefined();

            const damageEffect = shadowStrike!.effects.find(e => e.type === 'damage');
            expect(damageEffect).toBeDefined();
            expect((damageEffect as { ignoresStages?: boolean }).ignoresStages).toBe(true);
        });

        it('Paladin Divine Cleanse cures all statuses', () => {
            const divineClean = getSkillById('paladin_divine_cleanse');
            expect(divineClean).toBeDefined();

            const cureEffect = divineClean!.effects.find(e => e.type === 'cure');
            expect(cureEffect).toBeDefined();
            expect((cureEffect as { cures: string | string[] }).cures).toBe('all');
        });

        it('Bard Lullaby applies sleep status', () => {
            const lullaby = getSkillById('bard_lullaby');
            expect(lullaby).toBeDefined();

            const statusEffect = lullaby!.effects.find(e => e.type === 'status');
            expect(statusEffect).toBeDefined();
            expect((statusEffect as { statusType: string }).statusType).toBe('sleep');
        });
    });
});
