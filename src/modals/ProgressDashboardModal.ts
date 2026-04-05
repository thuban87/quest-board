/**
 * Progress Dashboard Modal
 * 
 * Phase 4: Full-page modal showing progress analytics over time.
 * Features date range picker, summary stats, category breakdown, and activity log.
 * Phase 5: Export buttons (copy report / save to vault) and custom date picker fix.
 */

import { App, Modal, Notice } from 'obsidian';
import { useCharacterStore } from '../store/characterStore';
import { ActivityEvent } from '../models/Character';
import {
    getProgressStatsForRange,
    getDatePreset,
    getAllPresets,
    formatDateForDisplay,
    DatePreset,
    ProgressStats,
} from '../services/ProgressStatsService';
import {
    generateProgressReport,
    copyToClipboard,
    createExportNote,
} from '../services/CharacterExportService';

// ============================================
// Modal Options
// ============================================

export interface ProgressDashboardModalOptions {
    app: App;
    onSave: () => Promise<void>;
    /** Folder where character exports are saved (empty = use questFolder) */
    exportFolder?: string;
    /** Quest folder as fallback for exports */
    questFolder?: string;
}

// ============================================
// Modal Class
// ============================================

export class ProgressDashboardModal extends Modal {
    private preset: DatePreset = 'this_week';
    private startDate: string = '';
    private endDate: string = '';
    private onSave: () => Promise<void>;
    private exportFolder: string;
    private questFolder: string;

    constructor(options: ProgressDashboardModalOptions) {
        super(options.app);
        this.onSave = options.onSave;
        this.exportFolder = options.exportFolder || '';
        this.questFolder = options.questFolder || 'Quest Board/quests';

        // Initialize dates from preset
        const range = getDatePreset(this.preset);
        this.startDate = range.start;
        this.endDate = range.end;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('qb-progress-dashboard-modal');

        this.render();
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }

    private render(): void {
        const { contentEl } = this;
        contentEl.empty();

        const character = useCharacterStore.getState().character;
        if (!character) {
            contentEl.createEl('p', { text: 'No character found.' });
            return;
        }

        // Get stats for current date range
        // Defensive: use empty array if activityHistory is undefined (pre-v4 characters)
        const history = character.activityHistory ?? [];
        const stats = getProgressStatsForRange(
            history,
            this.startDate,
            this.endDate
        );

        // === HEADER ===
        this.renderHeader(contentEl, stats);

        // === DATE PICKER ===
        this.renderDatePicker(contentEl);

        // === SUMMARY STATS ===
        this.renderSummaryStats(contentEl, stats);

        // === CATEGORY BREAKDOWN ===
        this.renderCategoryBreakdown(contentEl, stats);

        // === DAILY ACTIVITY ===
        this.renderDailyActivity(contentEl, stats);

        // === ACTIVITY LOG ===
        this.renderActivityLog(contentEl, history);
    }

    private renderHeader(container: HTMLElement, stats: ProgressStats): void {
        const header = container.createDiv({ cls: 'qb-progress-header' });
        header.createEl('h2', { text: '📊 Progress Dashboard' });

        const subtitle = header.createEl('p', { cls: 'qb-progress-subtitle' });
        subtitle.textContent = `${formatDateForDisplay(this.startDate)} — ${formatDateForDisplay(this.endDate)}`;

        // Export buttons
        const exportRow = header.createDiv({ cls: 'qb-progress-export-row' });

        const copyBtn = exportRow.createEl('button', {
            cls: 'qb-progress-export-btn',
            text: '📋 Copy report',
        });
        copyBtn.addEventListener('click', () => {
            const character = useCharacterStore.getState().character;
            if (!character) return;
            const dateRange = { start: this.startDate, end: this.endDate, label: this.getDateRangeLabel() };
            const report = generateProgressReport(character, stats, dateRange);
            copyToClipboard(this.app, report);
        });

        const saveBtn = exportRow.createEl('button', {
            cls: 'qb-progress-export-btn',
            text: '💾 Save to vault',
        });
        saveBtn.addEventListener('click', async () => {
            const character = useCharacterStore.getState().character;
            if (!character) return;
            const dateRange = { start: this.startDate, end: this.endDate, label: this.getDateRangeLabel() };
            const report = generateProgressReport(character, stats, dateRange);
            await createExportNote(this.app, character, report, this.exportFolder, this.questFolder);
        });
    }

    /**
     * Get a human-readable label for the current date range.
     */
    private getDateRangeLabel(): string {
        if (this.preset !== 'custom') {
            const range = getDatePreset(this.preset);
            return range.label;
        }
        return `${formatDateForDisplay(this.startDate)} — ${formatDateForDisplay(this.endDate)}`;
    }

    private renderDatePicker(container: HTMLElement): void {
        const pickerContainer = container.createDiv({ cls: 'qb-progress-date-picker' });

        // Preset buttons
        const presetsRow = pickerContainer.createDiv({ cls: 'qb-progress-presets' });
        const presets = getAllPresets();

        for (const preset of presets) {
            const btn = presetsRow.createEl('button', {
                cls: `qb-progress-preset-btn ${this.preset === preset.value ? 'active' : ''}`,
                text: preset.label,
            });
            btn.addEventListener('click', () => {
                if (preset.value === 'custom') {
                    // Enable custom range mode — keep current dates, just switch preset
                    this.preset = 'custom';
                    this.render();
                } else {
                    this.preset = preset.value;
                    const range = getDatePreset(preset.value);
                    this.startDate = range.start;
                    this.endDate = range.end;
                    this.render();
                }
            });
        }

        // Custom date inputs
        const customRow = pickerContainer.createDiv({ cls: 'qb-progress-custom-dates' });
        const isCustom = this.preset === 'custom';

        const startLabel = customRow.createEl('label');
        startLabel.textContent = 'From: ';
        const startInput = startLabel.createEl('input', { type: 'date' });
        startInput.value = this.startDate;
        startInput.disabled = !isCustom;
        if (!isCustom) startInput.readOnly = true;
        startInput.addEventListener('change', () => {
            this.startDate = startInput.value;
            this.preset = 'custom';
            this.render();
        });

        const endLabel = customRow.createEl('label');
        endLabel.textContent = ' To: ';
        const endInput = endLabel.createEl('input', { type: 'date' });
        endInput.value = this.endDate;
        endInput.disabled = !isCustom;
        if (!isCustom) endInput.readOnly = true;
        endInput.addEventListener('change', () => {
            this.endDate = endInput.value;
            this.preset = 'custom';
            this.render();
        });
    }

    private renderSummaryStats(container: HTMLElement, stats: ProgressStats): void {
        const statsContainer = container.createDiv({ cls: 'qb-progress-stats-grid' });

        const statCards = [
            { icon: '🏆', label: 'Quests', value: stats.questsCompleted },
            { icon: '⚔️', label: 'Fights Won', value: stats.bountiesWon },
            { icon: '🏰', label: 'Dungeons', value: stats.dungeonsCompleted },
            { icon: '✨', label: 'XP Earned', value: this.formatNumber(stats.totalXP) },
            { icon: '💰', label: 'Gold Earned', value: this.formatNumber(stats.totalGold) },
        ];

        for (const card of statCards) {
            const cardEl = statsContainer.createDiv({ cls: 'qb-progress-stat-card' });
            cardEl.createEl('span', { cls: 'qb-progress-stat-icon', text: card.icon });
            cardEl.createEl('span', { cls: 'qb-progress-stat-value', text: String(card.value) });
            cardEl.createEl('span', { cls: 'qb-progress-stat-label', text: card.label });
        }
    }

    private renderCategoryBreakdown(container: HTMLElement, stats: ProgressStats): void {
        const section = container.createDiv({ cls: 'qb-progress-section' });
        section.createEl('h3', { text: '📁 Category Breakdown' });

        const categories = Object.entries(stats.categoryBreakdown);
        if (categories.length === 0) {
            section.createEl('p', { cls: 'qb-progress-empty', text: 'No category data for this period.' });
            return;
        }

        // Find max for scaling bars
        const maxCount = Math.max(...categories.map(([, count]) => count), 1);

        const barsContainer = section.createDiv({ cls: 'qb-progress-category-bars' });
        for (const [category, count] of categories.sort((a, b) => b[1] - a[1])) {
            const row = barsContainer.createDiv({ cls: 'qb-progress-category-row' });

            const labelSpan = row.createEl('span', { cls: 'qb-progress-category-label' });
            labelSpan.textContent = category || 'Uncategorized';

            const barContainer = row.createDiv({ cls: 'qb-progress-bar-container' });
            const bar = barContainer.createDiv({ cls: 'qb-progress-bar' });
            bar.style.width = `${(count / maxCount) * 100}%`;

            const countSpan = row.createEl('span', { cls: 'qb-progress-category-count' });
            countSpan.textContent = String(count);
        }
    }

    private renderDailyActivity(container: HTMLElement, stats: ProgressStats): void {
        const section = container.createDiv({ cls: 'qb-progress-section' });
        section.createEl('h3', { text: '📅 Daily Activity' });

        const dailyData = Object.entries(stats.dailyActivity).sort((a, b) => a[0].localeCompare(b[0]));
        if (dailyData.length === 0) {
            section.createEl('p', { cls: 'qb-progress-empty', text: 'No activity for this period.' });
            return;
        }

        const maxActivity = Math.max(...dailyData.map(([, count]) => count), 1);

        const chartContainer = section.createDiv({ cls: 'qb-progress-daily-chart' });

        for (const [date, count] of dailyData) {
            const dayColumn = chartContainer.createDiv({ cls: 'qb-progress-day-column' });

            const bar = dayColumn.createDiv({ cls: 'qb-progress-day-bar' });
            bar.style.height = `${(count / maxActivity) * 100}%`;
            bar.setAttribute('title', `${formatDateForDisplay(date)}: ${count} activities`);

            // Show date label for every few days or if small dataset
            if (dailyData.length <= 7 || dailyData.indexOf([date, count]) % 3 === 0) {
                const label = dayColumn.createDiv({ cls: 'qb-progress-day-label' });
                label.textContent = date.slice(-2); // Just day number
            }
        }

        // Best day callout
        if (stats.bestDay) {
            const bestDayEl = section.createDiv({ cls: 'qb-progress-best-day' });
            bestDayEl.textContent = `🏆 Best Day: ${formatDateForDisplay(stats.bestDay.date)} (${stats.bestDay.count} activities)`;
        }
    }

    private renderActivityLog(container: HTMLElement, history: ActivityEvent[]): void {
        const section = container.createDiv({ cls: 'qb-progress-section' });
        section.createEl('h3', { text: '📜 Activity Log' });

        // Filter to current date range
        const filtered = history.filter(e => e.date >= this.startDate && e.date <= this.endDate);

        if (filtered.length === 0) {
            section.createEl('p', { cls: 'qb-progress-empty', text: 'No activities for this period.' });
            return;
        }

        // Sort by timestamp descending (most recent first)
        const sorted = [...filtered].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

        const logContainer = section.createDiv({ cls: 'qb-progress-log-list' });

        // Show up to 50 entries
        const toShow = sorted.slice(0, 50);
        for (const event of toShow) {
            const entry = logContainer.createDiv({ cls: 'qb-progress-log-entry' });

            const icon = this.getEventIcon(event.type);
            entry.createEl('span', { cls: 'qb-progress-log-icon', text: icon });

            const details = entry.createDiv({ cls: 'qb-progress-log-details' });
            details.createEl('span', { cls: 'qb-progress-log-title', text: event.details || event.type });

            const meta = details.createDiv({ cls: 'qb-progress-log-meta' });
            meta.textContent = formatDateForDisplay(event.date);
            if (event.xpGained) {
                meta.textContent += ` • +${event.xpGained} XP`;
            }
            if (event.goldGained && event.goldGained > 0) {
                meta.textContent += ` • +${event.goldGained}g`;
            }
        }

        if (sorted.length > 50) {
            logContainer.createEl('p', { cls: 'qb-progress-log-more', text: `...and ${sorted.length - 50} more` });
        }
    }

    private getEventIcon(type: string): string {
        switch (type) {
            case 'quest_complete': return '🏆';
            case 'bounty_victory': return '⚔️';
            case 'bounty_defeat': return '💀';
            case 'dungeon_complete': return '🏰';
            default: return '📝';
        }
    }

    private formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return String(num);
    }
}

// ============================================
// Helper to show modal
// ============================================

export function showProgressDashboardModal(
    app: App,
    onSave: () => Promise<void>,
    exportFolder?: string,
    questFolder?: string
): void {
    new ProgressDashboardModal({ app, onSave, exportFolder, questFolder }).open();
}
