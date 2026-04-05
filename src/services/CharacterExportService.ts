/**
 * Character Export Service
 * 
 * Generates character summary and progress reports for clipboard copy
 * or vault note export. Used by the Progress Dashboard modal.
 */

import { App, Modal, Notice, normalizePath } from 'obsidian';
import { Character, CLASS_INFO } from '../models/Character';
import { getTitleById, isBuffTitle } from '../models/Title';
import { GEAR_SLOT_NAMES, GearSlot, TIER_INFO } from '../models/Gear';
import { ProgressStats, DateRange } from './ProgressStatsService';

// ============================================
// Character Summary
// ============================================

/**
 * Generate a markdown summary of the character's current state.
 * Includes name, title, level, class, stats, active buffs, and equipped gear.
 */
export function generateCharacterSummary(character: Character): string {
    const lines: string[] = [];

    // Header: Name + Title
    const title = character.equippedTitle
        ? getTitleById(character.equippedTitle)
        : null;
    const titleDisplay = title ? `${title.emoji} ${title.name}` : 'No title equipped';

    lines.push(`# ${character.name}`);
    lines.push(`**Title:** ${titleDisplay}`);
    lines.push('');

    // Class + Level
    const classInfo = CLASS_INFO[character.class];
    let classLine = `**Class:** ${classInfo.emoji} ${classInfo.name}`;
    if (character.secondaryClass) {
        const secondaryInfo = CLASS_INFO[character.secondaryClass];
        classLine += ` / ${secondaryInfo.emoji} ${secondaryInfo.name}`;
    }
    lines.push(classLine);
    lines.push(`**Level:** ${character.level}`);
    lines.push('');

    // Stats
    lines.push('## Stats');
    lines.push('');
    const stats = character.baseStats;
    const bonuses = character.statBonuses;
    lines.push(`| Stat | Base | Bonus | Total |`);
    lines.push(`|------|------|-------|-------|`);
    const statNames: Array<{ key: keyof typeof stats; label: string }> = [
        { key: 'strength', label: 'STR' },
        { key: 'intelligence', label: 'INT' },
        { key: 'wisdom', label: 'WIS' },
        { key: 'constitution', label: 'CON' },
        { key: 'dexterity', label: 'DEX' },
        { key: 'charisma', label: 'CHA' },
    ];
    for (const { key, label } of statNames) {
        const base = stats[key] || 0;
        const bonus = bonuses?.[key] || 0;
        lines.push(`| ${label} | ${base} | +${bonus} | ${base + bonus} |`);
    }
    lines.push('');

    // Active Buff Titles
    const titlePowerUps = (character.activePowerUps || []).filter(
        p => p.triggeredBy === 'title'
    );
    if (titlePowerUps.length > 0) {
        lines.push('## Active Title Buffs');
        lines.push('');
        for (const powerUp of titlePowerUps) {
            lines.push(`- ${powerUp.icon} **${powerUp.name}** — ${powerUp.description}`);
        }
        lines.push('');
    }

    // Equipped Gear
    lines.push('## Equipped Gear');
    lines.push('');
    const gear = character.equippedGear;
    if (gear) {
        const slots: GearSlot[] = ['head', 'chest', 'legs', 'boots', 'weapon', 'shield', 'accessory1', 'accessory2', 'accessory3'];
        let hasGear = false;
        for (const slot of slots) {
            const item = gear[slot];
            if (item) {
                hasGear = true;
                const tierInfo = TIER_INFO[item.tier];
                lines.push(`- **${GEAR_SLOT_NAMES[slot]}:** ${item.name} (${tierInfo.name})`);
            }
        }
        if (!hasGear) {
            lines.push('*No gear equipped*');
        }
    } else {
        lines.push('*No gear equipped*');
    }
    lines.push('');

    return lines.join('\n');
}

// ============================================
// Progress Report
// ============================================

/**
 * Generate a full progress report combining character summary
 * with date-filtered activity stats.
 */
export function generateProgressReport(
    character: Character,
    stats: ProgressStats,
    dateRange: DateRange
): string {
    const lines: string[] = [];

    // Character summary first
    lines.push(generateCharacterSummary(character));

    // Date range header
    lines.push('---');
    lines.push('');
    lines.push(`## Progress Report: ${dateRange.label}`);
    lines.push(`*${dateRange.start} — ${dateRange.end}*`);
    lines.push('');

    // Activity summary
    lines.push('### Activity Summary');
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Quests Completed | ${stats.questsCompleted} |`);
    lines.push(`| Bounties Won | ${stats.bountiesWon} |`);
    lines.push(`| Bounties Lost | ${stats.bountiesLost} |`);
    lines.push(`| Dungeons Completed | ${stats.dungeonsCompleted} |`);
    lines.push(`| Total XP Earned | ${formatExportNumber(stats.totalXP)} |`);
    lines.push(`| Total Gold Earned | ${formatExportNumber(stats.totalGold)} |`);
    lines.push('');

    // Best day
    if (stats.bestDay) {
        lines.push(`**Best Day:** ${stats.bestDay.date} (${stats.bestDay.count} activities)`);
        lines.push('');
    }

    // Category breakdown
    const categories = Object.entries(stats.categoryBreakdown);
    if (categories.length > 0) {
        lines.push('### Category Breakdown');
        lines.push('');
        for (const [category, count] of categories.sort((a, b) => b[1] - a[1])) {
            lines.push(`- **${category || 'Uncategorized'}:** ${count}`);
        }
        lines.push('');
    }

    // Footer
    lines.push('---');
    lines.push(`*Generated by Quest Board on ${new Date().toLocaleDateString()}*`);

    return lines.join('\n');
}

// ============================================
// Clipboard
// ============================================

/**
 * Copy text to clipboard. Falls back to showing text in a modal
 * with a "Select All" hint on platforms where navigator.clipboard
 * is not available (e.g. mobile WebView without user-gesture context).
 * 
 * No document.execCommand('copy') fallback — it's deprecated.
 */
export async function copyToClipboard(app: App, text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
        new Notice('📋 Report copied to clipboard!', 3000);
    } catch {
        // Fallback: show in a modal for manual copy
        const modal = new ClipboardFallbackModal(app, text);
        modal.open();
    }
}

/**
 * Fallback modal for clipboard copy failure.
 * Shows the text content with a "Select All" hint.
 */
class ClipboardFallbackModal extends Modal {
    private text: string;

    constructor(app: App, text: string) {
        super(app);
        this.text = text;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h3', { text: 'Copy report' });
        contentEl.createEl('p', {
            text: 'Clipboard access is not available. Select all text below and copy manually.',
            cls: 'qb-clipboard-fallback-hint',
        });

        const textarea = contentEl.createEl('textarea', {
            cls: 'qb-clipboard-fallback-textarea',
        });
        textarea.value = this.text;
        textarea.readOnly = true;
        textarea.rows = 20;
        textarea.style.width = '100%';
        textarea.style.fontFamily = 'monospace';
        textarea.style.fontSize = '12px';

        // Auto-select all text on focus
        textarea.addEventListener('focus', () => {
            textarea.select();
        });

        // Select all initially
        setTimeout(() => textarea.select(), 100);
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// ============================================
// Export to Vault
// ============================================

/**
 * Create an export note in the vault.
 * Validates the export folder exists, falls back to questFolder.
 * Uses collision-safe naming: {CharacterName} Export {YYYY-MM-DD} {HHmm}.md
 */
export async function createExportNote(
    app: App,
    character: Character,
    content: string,
    exportFolder: string,
    questFolder: string
): Promise<void> {
    // Validate folder exists
    let folder = exportFolder;
    if (folder) {
        const folderObj = app.vault.getFolderByPath(normalizePath(folder));
        if (!folderObj) {
            new Notice(`⚠ Export folder "${folder}" not found. Using quest folder instead.`, 4000);
            folder = questFolder;
        }
    } else {
        folder = questFolder;
    }

    // Ensure fallback folder exists too
    const fallbackFolder = app.vault.getFolderByPath(normalizePath(folder));
    if (!fallbackFolder) {
        // Create the folder if it doesn't exist
        try {
            await app.vault.createFolder(normalizePath(folder));
        } catch {
            new Notice(`❌ Could not create folder "${folder}".`, 4000);
            return;
        }
    }

    // Generate filename with timestamp
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const baseName = `${character.name} Export ${dateStr} ${timeStr}`;

    // Collision-safe file creation
    let filePath = normalizePath(`${folder}/${baseName}.md`);
    if (app.vault.getAbstractFileByPath(filePath)) {
        let i = 1;
        while (app.vault.getAbstractFileByPath(normalizePath(`${folder}/${baseName} (${i}).md`))) i++;
        filePath = normalizePath(`${folder}/${baseName} (${i}).md`);
    }

    try {
        await app.vault.create(filePath, content);
        new Notice(`💾 Export saved: ${filePath}`, 4000);
    } catch (e) {
        console.error('[QuestBoard] Export note creation failed:', e);
        new Notice(`❌ Failed to create export note: ${(e as Error).message}`, 4000);
    }
}

// ============================================
// Helpers
// ============================================

/**
 * Format a number for export display
 */
function formatExportNumber(num: number): string {
    return num.toLocaleString();
}
