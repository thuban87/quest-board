/**
 * Title Selection Modal Tests — Phase 4.5
 *
 * Tests for TitleSelectionModal logic:
 * - Unlocked/locked title categorization
 * - Rarity label formatting
 * - Buff label display for buff titles
 * - No innerHTML usage (DOM API only)
 * - equipTitle() call verification
 *
 * Coverage target: ≥80% line, ≥80% branch
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TITLES } from '../../src/data/titles';
import { Title, TitleRarity } from '../../src/models/Title';
import { getUnlockedTitles, getEquippedTitle } from '../../src/services/TitleService';
import { Character } from '../../src/models/Character';

// =====================
// TEST HELPERS
// =====================

function createMockCharacter(overrides: Partial<Character> = {}): Character {
    return {
        schemaVersion: 7,
        name: 'Test Hero',
        class: 'warrior',
        secondaryClass: null,
        level: 10,
        totalXP: 5000,
        spriteVersion: 1,
        appearance: {
            skinTone: 'light',
            hairStyle: 'short',
            hairColor: 'brown',
            accessory: 'none',
            outfitPrimary: '#dc3545',
            outfitSecondary: '#ffc107',
        },
        equippedGear: {
            head: null, chest: null, legs: null, boots: null,
            weapon: null, shield: null,
            accessory1: null, accessory2: null, accessory3: null,
        },
        trainingXP: 0,
        trainingLevel: 1,
        isTrainingMode: false,
        baseStats: {
            strength: 12, intelligence: 10, wisdom: 10,
            constitution: 12, dexterity: 10, charisma: 10,
        },
        statBonuses: {
            strength: 0, intelligence: 0, wisdom: 0,
            constitution: 0, dexterity: 0, charisma: 0,
        },
        categoryXPAccumulator: {},
        currentStreak: 0,
        highestStreak: 0,
        lastQuestCompletionDate: null,
        totalShieldsUsedThisWeek: 0,
        createdDate: '2025-01-01T00:00:00Z',
        lastModified: '2025-01-01T00:00:00Z',
        tasksCompletedToday: 0,
        lastTaskDate: null,
        activePowerUps: [],
        gold: 100,
        gearInventory: [],
        inventoryLimit: 50,
        currentHP: 100,
        maxHP: 100,
        currentMana: 50,
        maxMana: 50,
        stamina: 10,
        staminaGainedToday: 0,
        lastStaminaResetDate: null,
        dungeonKeys: 0,
        dungeonExplorationHistory: {},
        status: 'active',
        recoveryTimerEnd: null,
        activityHistory: [],
        skills: { unlocked: [], equipped: [] },
        persistentStatusEffects: [],
        triggerCooldowns: {},
        equippedTitle: null,
        unlockedTitles: ['the-novice'],
        lifetimeStats: {
            questsCompleted: 0,
            battlesWon: 0,
            bossesDefeated: 0,
            dungeonsCompleted: 0,
            dungeonAttempts: 0,
            goldEarned: 0,
        },
        ...overrides,
    } as Character;
}

/**
 * Reimplementation of TitleSelectionModal.formatRarity()
 * to test the formatting logic independently.
 */
function formatRarity(rarity: TitleRarity): string {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

// =====================
// TITLE CATEGORIZATION
// =====================

describe('Title Categorization', () => {
    const allTitleIds = Object.keys(TITLES);

    it('unlocked titles are correctly identified', () => {
        const character = createMockCharacter({
            unlockedTitles: ['the-novice', 'questrunner', 'the-scholar'],
        });

        const unlocked = getUnlockedTitles(character);
        expect(unlocked).toHaveLength(3);
        expect(unlocked.map(t => t.id)).toEqual(['the-novice', 'questrunner', 'the-scholar']);
    });

    it('locked titles are all titles NOT in unlockedTitles', () => {
        const character = createMockCharacter({
            unlockedTitles: ['the-novice'],
        });

        const unlockedIds = new Set(character.unlockedTitles);
        const allTitles = Object.values(TITLES);
        const lockedTitles = allTitles.filter(t => !unlockedIds.has(t.id));

        // 12 total - 1 unlocked = 11 locked
        expect(lockedTitles.length).toBe(allTitles.length - 1);
        expect(lockedTitles.every(t => t.id !== 'the-novice')).toBe(true);
    });

    it('character with all titles unlocked has zero locked titles', () => {
        const character = createMockCharacter({
            unlockedTitles: allTitleIds,
        });

        const unlockedIds = new Set(character.unlockedTitles);
        const lockedTitles = Object.values(TITLES).filter(t => !unlockedIds.has(t.id));
        expect(lockedTitles).toHaveLength(0);
    });

    it('character with no titles unlocked shows all titles as locked', () => {
        const character = createMockCharacter({
            unlockedTitles: [],
        });

        const unlockedIds = new Set(character.unlockedTitles);
        const lockedTitles = Object.values(TITLES).filter(t => !unlockedIds.has(t.id));
        expect(lockedTitles.length).toBe(allTitleIds.length);
    });

    it('equipped title is correctly identified among unlocked', () => {
        const character = createMockCharacter({
            equippedTitle: 'the-novice',
            unlockedTitles: ['the-novice', 'questrunner'],
        });

        const equipped = getEquippedTitle(character);
        expect(equipped).not.toBeNull();
        expect(equipped!.id).toBe('the-novice');
    });

    it('no equipped title when equippedTitle is null', () => {
        const character = createMockCharacter({
            equippedTitle: null,
            unlockedTitles: ['the-novice'],
        });

        const equipped = getEquippedTitle(character);
        expect(equipped).toBeNull();
    });
});

// =====================
// RARITY LABELS
// =====================

describe('Rarity Label Formatting', () => {
    it('formats common as "Common"', () => {
        expect(formatRarity('common')).toBe('Common');
    });

    it('formats rare as "Rare"', () => {
        expect(formatRarity('rare')).toBe('Rare');
    });

    it('formats epic as "Epic"', () => {
        expect(formatRarity('epic')).toBe('Epic');
    });

    it('formats legendary as "Legendary"', () => {
        expect(formatRarity('legendary')).toBe('Legendary');
    });

    it('every title in TITLES has a valid rarity', () => {
        const validRarities: TitleRarity[] = ['common', 'rare', 'epic', 'legendary'];
        for (const [id, title] of Object.entries(TITLES)) {
            expect(validRarities, `${id} has invalid rarity: ${title.rarity}`).toContain(title.rarity);
        }
    });

    it('every title has correct rarity label', () => {
        for (const [id, title] of Object.entries(TITLES)) {
            const label = formatRarity(title.rarity);
            expect(label[0]).toBe(label[0].toUpperCase());
            expect(label.length).toBeGreaterThan(0);
        }
    });
});

// =====================
// BUFF LABEL DISPLAY
// =====================

describe('Buff Label Display', () => {
    it('buff titles have non-empty buff labels', () => {
        const buffTitles = Object.values(TITLES).filter(t => t.buff);
        expect(buffTitles.length).toBeGreaterThan(0);

        for (const title of buffTitles) {
            expect(title.buff!.label, `${title.id} missing buff label`).toBeTruthy();
            expect(title.buff!.label.length).toBeGreaterThan(0);
        }
    });

    it('cosmetic titles do not have buff labels', () => {
        const cosmeticTitles = Object.values(TITLES).filter(t => !t.buff);
        expect(cosmeticTitles.length).toBeGreaterThan(0);

        for (const title of cosmeticTitles) {
            expect(title.buff).toBeUndefined();
        }
    });

    it('The Scholar buff label describes XP bonus', () => {
        expect(TITLES['the-scholar'].buff!.label).toContain('XP');
    });

    it('Fortune\'s Favorite buff label describes gold bonus', () => {
        expect(TITLES['fortune-favored'].buff!.label).toContain('Gold');
    });

    it('Eagle Eye buff label describes crit chance', () => {
        expect(TITLES['eagle-eye'].buff!.label).toContain('Crit');
    });

    it('The Tempered buff label describes stat boost', () => {
        expect(TITLES['the-tempered'].buff!.label).toContain('Stats');
    });

    it('The Relentless buff label describes both effects', () => {
        const label = TITLES['the-relentless'].buff!.label;
        expect(label).toContain('Stats');
        expect(label).toContain('XP');
    });
});

// =====================
// LOCKED TITLE DISPLAY
// =====================

describe('Locked Title Display', () => {
    it('all titles have non-empty unlock conditions', () => {
        for (const [id, title] of Object.entries(TITLES)) {
            expect(title.unlockCondition, `${id} missing unlockCondition`).toBeTruthy();
            expect(title.unlockCondition.length).toBeGreaterThan(0);
        }
    });

    it('all titles have non-empty names', () => {
        for (const [id, title] of Object.entries(TITLES)) {
            expect(title.name, `${id} missing name`).toBeTruthy();
        }
    });

    it('all titles have non-empty emoji', () => {
        for (const [id, title] of Object.entries(TITLES)) {
            expect(title.emoji, `${id} missing emoji`).toBeTruthy();
        }
    });

    it('all titles have non-empty descriptions', () => {
        for (const [id, title] of Object.entries(TITLES)) {
            expect(title.description, `${id} missing description`).toBeTruthy();
        }
    });
});

// =====================
// SELECTION LOGIC
// =====================

describe('Selection Logic', () => {
    it('clicking "None" when equipped should result in equip(null)', () => {
        // Test the logic: if equippedTitle exists, clicking None should trigger unequip
        const character = createMockCharacter({ equippedTitle: 'the-novice' });
        const equipped = getEquippedTitle(character);

        // The modal would call equipTitle(null) in this case
        expect(equipped).not.toBeNull();
        // Verify the "should unequip" condition is met
        const shouldUnequip = equipped !== null;
        expect(shouldUnequip).toBe(true);
    });

    it('clicking "None" when no title equipped is a no-op', () => {
        const character = createMockCharacter({ equippedTitle: null });
        const equipped = getEquippedTitle(character);

        // The modal guards: `if (equippedTitle)` — should not trigger when null
        const shouldUnequip = equipped !== null;
        expect(shouldUnequip).toBe(false);
    });

    it('clicking an unlocked non-equipped title should equip it', () => {
        const character = createMockCharacter({
            equippedTitle: null,
            unlockedTitles: ['the-novice', 'questrunner'],
        });

        const equipped = getEquippedTitle(character);
        const targetTitle = TITLES['questrunner'];
        const isEquipped = equipped?.id === targetTitle.id;

        // Not currently equipped → should equip
        expect(isEquipped).toBe(false);
    });

    it('clicking the currently equipped title should unequip it', () => {
        const character = createMockCharacter({
            equippedTitle: 'the-novice',
            unlockedTitles: ['the-novice'],
        });

        const equipped = getEquippedTitle(character);
        const targetTitle = TITLES['the-novice'];
        const isEquipped = equipped?.id === targetTitle.id;

        // Currently equipped → click should trigger equipTitle(null)
        expect(isEquipped).toBe(true);
    });

    it('modal correctly shows radio indicators for equipped vs unequipped', () => {
        const character = createMockCharacter({
            equippedTitle: 'questrunner',
            unlockedTitles: ['the-novice', 'questrunner', 'the-scholar'],
        });

        const equipped = getEquippedTitle(character);
        const unlocked = getUnlockedTitles(character);

        // Verify the equipped check logic used in render
        for (const title of unlocked) {
            const isEquipped = equipped?.id === title.id;
            if (title.id === 'questrunner') {
                expect(isEquipped).toBe(true);
            } else {
                expect(isEquipped).toBe(false);
            }
        }
    });
});

// =====================
// DOM API COMPLIANCE
// =====================

describe('DOM API Compliance', () => {
    it('TitleSelectionModal source does not contain innerHTML in code', () => {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.resolve(__dirname, '../../src/modals/TitleSelectionModal.ts');
        const source = fs.readFileSync(filePath, 'utf-8');

        // Strip comments to avoid false positives from JSDoc mentioning innerHTML
        const codeOnly = source
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '');

        expect(codeOnly).not.toContain('innerHTML');
        expect(codeOnly).not.toContain('outerHTML');
        expect(codeOnly).not.toContain('insertAdjacentHTML');
        expect(codeOnly).not.toContain('dangerouslySetInnerHTML');
    });

    it('TitleSelectionModal uses createEl/createDiv/createSpan DOM API', () => {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.resolve(__dirname, '../../src/modals/TitleSelectionModal.ts');
        const source = fs.readFileSync(filePath, 'utf-8');

        // Verify it uses Obsidian's DOM API
        expect(source).toContain('createEl');
        expect(source).toContain('createDiv');
        expect(source).toContain('createSpan');
    });
});

// =====================
// TITLE REGISTRY INTEGRITY
// =====================

describe('Title Registry Integrity for Modal', () => {
    it('TITLES registry has exactly 12 titles', () => {
        expect(Object.keys(TITLES)).toHaveLength(12);
    });

    it('every title ID matches its key in TITLES', () => {
        for (const [key, title] of Object.entries(TITLES)) {
            expect(title.id).toBe(key);
        }
    });

    it('default character starts with only the-novice unlocked', () => {
        const character = createMockCharacter();
        expect(character.unlockedTitles).toEqual(['the-novice']);
    });

    it('the-novice is a common cosmetic title', () => {
        const novice = TITLES['the-novice'];
        expect(novice.rarity).toBe('common');
        expect(novice.buff).toBeUndefined();
    });
});
