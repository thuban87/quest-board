/**
 * Daily Note Service
 * 
 * Handles logging quest completions to daily notes.
 * Respects user's existing daily note system.
 */

import { Vault, TFile, TFolder } from 'obsidian';
import type { QuestBoardSettings } from '../settings';
import type { Quest } from '../models/Quest';

// moment is provided globally by Obsidian
declare const moment: typeof import('moment');

/**
 * Daily activity log entry
 */
interface DailyLogEntry {
    questName: string;
    category: string;
    xpAwarded: number;
    timestamp: Date;
}

/**
 * Service for logging quest activity to daily notes
 */
export class DailyNoteService {
    private vault: Vault;
    private settings: QuestBoardSettings;

    // Track entries for summary line (reset on new day)
    private todayEntries: DailyLogEntry[] = [];
    private lastLogDate: string | null = null;

    constructor(vault: Vault, settings: QuestBoardSettings) {
        this.vault = vault;
        this.settings = settings;
    }

    /**
     * Update settings reference (called when settings change)
     */
    updateSettings(settings: QuestBoardSettings): void {
        this.settings = settings;
    }

    /**
     * Log a quest completion to today's daily note
     */
    async logQuestCompletion(quest: Quest, xpAwarded: number): Promise<void> {
        // Skip if logging is disabled
        if (!this.settings.enableDailyNoteLogging) {
            return;
        }

        // Get today's date formatted
        const today = this.formatDate(new Date());

        // Reset entries if it's a new day
        if (this.lastLogDate !== today) {
            this.todayEntries = [];
            this.lastLogDate = today;
        }

        // Find or create the daily note
        const dailyNote = await this.getDailyNote();
        if (!dailyNote) {
            // User has createIfMissing disabled and note doesn't exist
            return;
        }

        // Add this entry to tracking
        const entry: DailyLogEntry = {
            questName: quest.questName,
            category: quest.category || 'Uncategorized',
            xpAwarded,
            timestamp: new Date(),
        };
        this.todayEntries.push(entry);

        // Format and append the log
        await this.appendToNote(dailyNote, entry);
    }

    /**
     * Get today's daily note, optionally creating it
     */
    private async getDailyNote(): Promise<TFile | null> {
        const today = this.formatDate(new Date());
        const folder = this.settings.dailyNoteFolder || 'Daily';
        const notePath = `${folder}/${today}.md`;

        // Check if note exists
        const existingFile = this.vault.getAbstractFileByPath(notePath);
        if (existingFile instanceof TFile) {
            return existingFile;
        }

        // Create if enabled
        if (this.settings.createDailyNoteIfMissing) {
            try {
                // Ensure folder exists
                const folderExists = this.vault.getAbstractFileByPath(folder);
                if (!folderExists) {
                    await this.vault.createFolder(folder);
                }

                // Create note with heading
                const initialContent = `# ${today}\n\n`;
                const newFile = await this.vault.create(notePath, initialContent);
                return newFile;
            } catch (error) {
                console.error('[DailyNoteService] Failed to create daily note:', error);
                return null;
            }
        }

        // Note doesn't exist and we shouldn't create it
        return null;
    }

    /**
     * Format a date using the configured format
     */
    private formatDate(date: Date): string {
        const format = this.settings.dailyNoteFormat || 'YYYY-MM-DD';
        return moment(date).format(format);
    }

    /**
     * Append a log entry to the daily note
     */
    private async appendToNote(file: TFile, entry: DailyLogEntry): Promise<void> {
        try {
            const content = await this.vault.read(file);
            const heading = this.settings.dailyNoteHeading || '## Quest Board Activity';

            // Check if heading already exists
            const headingIndex = content.indexOf(heading);

            // Format the log entry
            const logLine = this.formatLogEntry(entry);
            const summaryLine = this.formatSummaryLine();

            let newContent: string;

            if (headingIndex !== -1) {
                // Heading exists - insert entries immediately after heading line
                const headingLineEnd = content.indexOf('\n', headingIndex);
                const insertPoint = headingLineEnd !== -1 ? headingLineEnd + 1 : headingIndex + heading.length;

                // Get content after heading to find existing entries
                const afterHeading = content.slice(insertPoint);

                // Find where our Quest Board entries end (look for next heading or end of file)
                const nextHeadingMatch = afterHeading.match(/^##? [^\n]+$/m);
                const questBoardSectionEnd = nextHeadingMatch?.index ?? afterHeading.length;

                // Get existing Quest Board lines (our entries only)
                const sectionContent = afterHeading.slice(0, questBoardSectionEnd);
                const existingLines = sectionContent.split('\n').filter(line =>
                    line.startsWith('- ✅') || line.startsWith('- 🏆')
                );

                // Remove old summary if present
                const entriesOnly = existingLines.filter(line => !line.startsWith('- 🏆'));

                // Build new entries section
                const allEntries = [...entriesOnly, logLine, summaryLine];
                const newEntriesBlock = allEntries.join('\n') + '\n';

                // Check if there's content before our entries that we need to preserve
                const contentBeforeEntries = sectionContent.split('\n').filter(line =>
                    !line.startsWith('- ✅') && !line.startsWith('- 🏆') && line.trim() !== ''
                );

                // If there ARE existing entries, replace them
                if (existingLines.length > 0) {
                    // Find exactly where entries start in afterHeading
                    const firstEntryMatch = afterHeading.match(/^- [✅🏆]/m);
                    if (firstEntryMatch && firstEntryMatch.index !== undefined) {
                        const entriesStart = firstEntryMatch.index;

                        // Find where entries end
                        const linesAfterFirst = afterHeading.slice(entriesStart).split('\n');
                        let entriesLineCount = 0;
                        for (const line of linesAfterFirst) {
                            if (line.startsWith('- ✅') || line.startsWith('- 🏆') || line.trim() === '') {
                                entriesLineCount++;
                            } else {
                                break;
                            }
                        }

                        const beforeEntries = afterHeading.slice(0, entriesStart);
                        const afterEntries = linesAfterFirst.slice(entriesLineCount).join('\n');

                        newContent = content.slice(0, insertPoint) + beforeEntries + newEntriesBlock + afterEntries;
                    } else {
                        // Fallback - just append after heading
                        newContent = content.slice(0, insertPoint) + newEntriesBlock + afterHeading;
                    }
                } else {
                    // No existing entries - just insert right after heading
                    newContent = content.slice(0, insertPoint) + newEntriesBlock + afterHeading;
                }
            } else {
                // Heading doesn't exist - add it at the end
                const section = `\n${heading}\n${logLine}\n${summaryLine}\n`;
                newContent = content + section;
            }

            await this.vault.modify(file, newContent);
        } catch (error) {
            console.error('[DailyNoteService] Failed to append to daily note:', error);
        }
    }

    /**
     * Format a single log entry
     */
    private formatLogEntry(entry: DailyLogEntry): string {
        return `- ✅ **${entry.questName}** (${entry.category}) - +${entry.xpAwarded} XP`;
    }

    /**
     * Format the summary line with today's totals
     */
    private formatSummaryLine(): string {
        const totalQuests = this.todayEntries.length;
        const totalXP = this.todayEntries.reduce((sum, e) => sum + e.xpAwarded, 0);

        // We could add streak info here if we had access to character data
        // For now, just show quest and XP totals
        return `- 🏆 ${totalQuests} quest${totalQuests !== 1 ? 's' : ''} completed, ${totalXP} XP earned`;
    }
}

// Singleton instance (initialized by main.ts)
export let dailyNoteService: DailyNoteService | null = null;

/**
 * Initialize the daily note service
 */
export function initDailyNoteService(vault: Vault, settings: QuestBoardSettings): DailyNoteService {
    dailyNoteService = new DailyNoteService(vault, settings);
    return dailyNoteService;
}
