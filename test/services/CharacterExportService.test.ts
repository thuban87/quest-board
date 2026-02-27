/**
 * Character Export Service Tests
 * 
 * Phase 5.5: Tests for character summary generation, progress report
 * generation, clipboard handling, and vault export naming.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    generateCharacterSummary,
    generateProgressReport,
    copyToClipboard,
    createExportNote,
} from '../../src/services/CharacterExportService';
import { createCharacter, Character, ActivePowerUp } from '../../src/models/Character';
import { ProgressStats, DateRange } from '../../src/services/ProgressStatsService';
import { GearItem } from '../../src/models/Gear';
import { App, Notice } from 'obsidian';

// =====================
// TEST DATA FACTORIES
// =====================

function createTestCharacter(overrides: Partial<Character> = {}): Character {
    const base = createCharacter('TestHero', 'warrior');
    return {
        ...base,
        level: 15,
        equippedTitle: null,
        unlockedTitles: ['the-novice'],
        activePowerUps: [],
        ...overrides,
    };
}

function createTestStats(overrides: Partial<ProgressStats> = {}): ProgressStats {
    return {
        questsCompleted: 5,
        bountiesWon: 3,
        bountiesLost: 1,
        dungeonsCompleted: 2,
        totalXP: 1250,
        totalGold: 480,
        categoryBreakdown: { work: 3, fitness: 2 },
        typeBreakdown: {
            quest_complete: 5,
            bounty_victory: 3,
            bounty_defeat: 1,
            dungeon_complete: 2,
        },
        dailyActivity: { '2024-01-15': 3, '2024-01-16': 2 },
        bestDay: { date: '2024-01-15', count: 3 },
        ...overrides,
    };
}

function createTestDateRange(): DateRange {
    return { start: '2024-01-01', end: '2024-01-31', label: 'Last 30 Days' };
}

function createTestGearItem(overrides: Partial<GearItem> = {}): GearItem {
    return {
        id: 'test-gear-1',
        name: 'Iron Sword',
        description: 'A basic sword',
        slot: 'weapon',
        tier: 'adept',
        level: 10,
        stats: {
            primaryStat: 'strength',
            primaryValue: 15,
            attackPower: 20,
        },
        sellValue: 35,
        iconEmoji: '⚔️',
        source: 'quest',
        acquiredAt: '2024-01-15T12:00:00Z',
        ...overrides,
    };
}

function createTitlePowerUp(): ActivePowerUp {
    return {
        id: 'title-buff-the-scholar',
        name: 'The Scholar',
        icon: '📚',
        description: '+3% XP from all sources',
        triggeredBy: 'title',
        startedAt: '2024-01-01T00:00:00Z',
        expiresAt: null,
        effect: { type: 'xp_multiplier', value: 1.03 },
    };
}

// =====================
// generateCharacterSummary TESTS
// =====================

describe('generateCharacterSummary', () => {
    it('should include character name and equipped title', () => {
        const character = createTestCharacter({ equippedTitle: 'the-novice' });
        const summary = generateCharacterSummary(character);

        expect(summary).toContain('# TestHero');
        expect(summary).toContain('🌱 The Novice');
    });

    it('should show "No title equipped" when no title', () => {
        const character = createTestCharacter({ equippedTitle: null });
        const summary = generateCharacterSummary(character);

        expect(summary).toContain('No title equipped');
    });

    it('should include level, class, and secondary class', () => {
        const character = createTestCharacter({
            level: 25,
            secondaryClass: 'scholar',
        });
        const summary = generateCharacterSummary(character);

        expect(summary).toContain('**Level:** 25');
        expect(summary).toContain('⚔️ Warrior');
        expect(summary).toContain('📚 Scholar');
    });

    it('should include all 6 stats with correct values', () => {
        const character = createTestCharacter({
            baseStats: { strength: 12, intelligence: 10, wisdom: 10, constitution: 12, dexterity: 10, charisma: 10 },
            statBonuses: { strength: 4, intelligence: 0, wisdom: 2, constitution: 1, dexterity: 0, charisma: 0 },
        });
        const summary = generateCharacterSummary(character);

        expect(summary).toContain('| STR | 12 | +4 | 16 |');
        expect(summary).toContain('| INT | 10 | +0 | 10 |');
        expect(summary).toContain('| WIS | 10 | +2 | 12 |');
        expect(summary).toContain('| CON | 12 | +1 | 13 |');
        expect(summary).toContain('| DEX | 10 | +0 | 10 |');
        expect(summary).toContain('| CHA | 10 | +0 | 10 |');
    });

    it('should include active buff titles with labels', () => {
        const character = createTestCharacter({
            equippedTitle: 'the-scholar',
            activePowerUps: [createTitlePowerUp()],
        });
        const summary = generateCharacterSummary(character);

        expect(summary).toContain('## Active Title Buffs');
        expect(summary).toContain('📚 **The Scholar**');
        expect(summary).toContain('+3% XP from all sources');
    });

    it('should include equipped gear names', () => {
        const character = createTestCharacter({
            equippedGear: {
                head: null,
                chest: createTestGearItem({ name: 'Steel Plate', slot: 'chest', tier: 'master' }),
                legs: null,
                boots: null,
                weapon: createTestGearItem({ name: 'Iron Sword', slot: 'weapon', tier: 'adept' }),
                shield: null,
                accessory1: null,
                accessory2: null,
                accessory3: null,
            },
        });
        const summary = generateCharacterSummary(character);

        expect(summary).toContain('**Chest:** Steel Plate (Master)');
        expect(summary).toContain('**Weapon:** Iron Sword (Adept)');
    });

    it('should handle null/empty gear gracefully', () => {
        const character = createTestCharacter({
            equippedGear: {
                head: null, chest: null, legs: null, boots: null,
                weapon: null, shield: null,
                accessory1: null, accessory2: null, accessory3: null,
            },
        });
        const summary = generateCharacterSummary(character);

        expect(summary).toContain('*No gear equipped*');
    });
});

// =====================
// generateProgressReport TESTS
// =====================

describe('generateProgressReport', () => {
    it('should include date range label', () => {
        const character = createTestCharacter();
        const stats = createTestStats();
        const dateRange = createTestDateRange();

        const report = generateProgressReport(character, stats, dateRange);

        expect(report).toContain('## Progress Report: Last 30 Days');
        expect(report).toContain('2024-01-01');
        expect(report).toContain('2024-01-31');
    });

    it('should include quests completed, bounties won, dungeons completed', () => {
        const character = createTestCharacter();
        const stats = createTestStats({
            questsCompleted: 12,
            bountiesWon: 7,
            dungeonsCompleted: 3,
        });
        const dateRange = createTestDateRange();

        const report = generateProgressReport(character, stats, dateRange);

        expect(report).toContain('| Quests Completed | 12 |');
        expect(report).toContain('| Bounties Won | 7 |');
        expect(report).toContain('| Dungeons Completed | 3 |');
    });

    it('should include total XP and gold for the period', () => {
        const character = createTestCharacter();
        const stats = createTestStats({
            totalXP: 5000,
            totalGold: 1234,
        });
        const dateRange = createTestDateRange();

        const report = generateProgressReport(character, stats, dateRange);

        // toLocaleString() formats numbers with commas
        expect(report).toContain('Total XP Earned');
        expect(report).toContain('5,000');
        expect(report).toContain('Total Gold Earned');
        expect(report).toContain('1,234');
    });

    it('should include character summary in the report', () => {
        const character = createTestCharacter({ equippedTitle: 'the-novice' });
        const stats = createTestStats();
        const dateRange = createTestDateRange();

        const report = generateProgressReport(character, stats, dateRange);

        // Summary should be included at the top
        expect(report).toContain('# TestHero');
        expect(report).toContain('🌱 The Novice');
    });
});

// =====================
// copyToClipboard TESTS
// =====================

describe('copyToClipboard', () => {
    it('should show fallback modal when clipboard fails (no execCommand)', async () => {
        const app = new App();

        // Mock clipboard to throw
        const originalClipboard = navigator.clipboard;
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: vi.fn().mockRejectedValue(new Error('Not allowed')),
            },
            writable: true,
            configurable: true,
        });

        // Should not throw — falls back to modal
        await expect(copyToClipboard(app, 'test content')).resolves.not.toThrow();

        // Restore
        Object.defineProperty(navigator, 'clipboard', {
            value: originalClipboard,
            writable: true,
            configurable: true,
        });
    });
});

// =====================
// createExportNote TESTS
// =====================

describe('createExportNote', () => {
    let app: App;

    beforeEach(() => {
        app = new App();
    });

    it('should use collision counter for duplicate filenames', async () => {
        const character = createTestCharacter();
        const content = '# Export';

        // First call: file does not exist -> getAbstractFileByPath returns null
        let callCount = 0;
        app.vault.getAbstractFileByPath = vi.fn().mockImplementation((_path: string) => {
            callCount++;
            // First call (initial path check) -> file exists
            // Second call (collision check with (1)) -> file exists
            // Third call (collision check with (2)) -> file doesn't exist
            if (callCount <= 2) return { path: 'existing.md' };
            return null;
        });
        app.vault.getFolderByPath = vi.fn().mockReturnValue({ path: 'exports' });
        app.vault.create = vi.fn().mockResolvedValue({});

        await createExportNote(app, character, content, 'exports', 'Quest Board/quests');

        // Should have called create with the (2) suffix
        expect(app.vault.create).toHaveBeenCalledTimes(1);
        const createdPath = (app.vault.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(createdPath).toContain('(2)');
    });

    it('should fall back to quest folder when export folder is empty', async () => {
        const character = createTestCharacter();
        const content = '# Export';

        // Mock getFolderByPath to return a folder for questFolder
        app.vault.getFolderByPath = vi.fn().mockImplementation((path: string) => {
            if (path === 'Quest Board/quests') return { path: 'Quest Board/quests' };
            return null;
        });
        app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(null);
        app.vault.create = vi.fn().mockResolvedValue({});

        await createExportNote(app, character, content, '', 'Quest Board/quests');

        expect(app.vault.create).toHaveBeenCalledTimes(1);
        const createdPath = (app.vault.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(createdPath).toContain('Quest Board/quests');
    });

    it('should generate filename with {CharacterName} Export {YYYY-MM-DD} {HHmm} format', async () => {
        const character = createTestCharacter({ name: 'Thorin' });
        const content = '# Export';

        app.vault.getFolderByPath = vi.fn().mockReturnValue({ path: 'exports' });
        app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(null);
        app.vault.create = vi.fn().mockResolvedValue({});

        await createExportNote(app, character, content, 'exports', 'Quest Board/quests');

        expect(app.vault.create).toHaveBeenCalledTimes(1);
        const createdPath = (app.vault.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;

        // Should contain character name and "Export"
        expect(createdPath).toContain('Thorin Export');
        // Should end with .md
        expect(createdPath).toMatch(/\.md$/);
        // Should match the date format YYYY-MM-DD
        expect(createdPath).toMatch(/\d{4}-\d{2}-\d{2}/);
        // Should match the time format HHmm
        expect(createdPath).toMatch(/\d{4}\.md/);
    });
});

// =====================
// getAllPresets with 'custom' TESTS
// =====================

describe('getAllPresets with custom', () => {
    it('should return 7 presets including custom', async () => {
        // Dynamic import to get the updated function
        const { getAllPresets } = await import('../../src/services/ProgressStatsService');
        const presets = getAllPresets();

        expect(presets).toHaveLength(7);
        const values = presets.map(p => p.value);
        expect(values).toContain('custom');
        expect(values).toContain('today');
        expect(values).toContain('all_time');
    });
});
