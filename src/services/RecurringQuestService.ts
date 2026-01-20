/**
 * Recurring Quest Service
 * 
 * Handles auto-generation of recurring quests from templates and archiving
 * of completed recurring quest instances.
 * 
 * Supports flexible recurrence rules:
 * - Simple keywords: daily, weekdays, weekends, monthly
 * - Specific days: monday, wednesday, friday
 * - Weekly with day: weekly:sunday
 */

import { Vault, TFile, TFolder, normalizePath } from 'obsidian';
import { QuestPriority } from '../models/QuestStatus';
import { QUEST_SCHEMA_VERSION } from '../models/Quest';

/** Day name to number mapping */
const DAY_MAP: Record<string, number> = {
    'sunday': 0, 'sun': 0,
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6,
};

/** Day number to name mapping */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Parsed recurring template info - exported for dashboard */
export interface RecurringTemplate {
    file: TFile;
    questName: string;
    recurrenceRaw: string;
    category: string;
    priority: QuestPriority;
    xpPerTask: number;
    completionBonus: number;
    content: string;
}

/** Template status for dashboard */
export interface TemplateStatus {
    template: RecurringTemplate;
    schedule: string;           // Human-readable schedule
    nextRun: string | null;     // Next run date or null if unknown
    todayStatus: 'generated' | 'pending' | 'not-scheduled';
    scheduledDays: number[];    // Day numbers (0-6) when this runs
}

/** Folder paths */
const RECURRING_TEMPLATES_FOLDER = 'System/Templates/Quest Board/Recurring Quests';
const RECURRING_QUESTS_FOLDER = 'Life/Quest Board/quests/recurring';
const ARCHIVE_FOLDER = 'Life/Quest Board/quests/archive';

/**
 * Service for managing recurring quests
 */
export class RecurringQuestService {
    private vault: Vault;

    constructor(vault: Vault) {
        this.vault = vault;
    }

    /**
     * Main entry point - process all recurring quests
     * Called on plugin load and at 1am daily
     */
    async processRecurrence(): Promise<void> {
        console.log('[RecurringQuestService] Processing recurring quests...');

        // Ensure folders exist
        await this.ensureFolders();

        // Archive yesterday's completed quests
        await this.archiveCompletedQuests();

        // Generate today's quests from templates
        await this.generateTodaysQuests();

        console.log('[RecurringQuestService] Recurring quest processing complete.');
    }

    /**
     * Ensure required folders exist
     */
    private async ensureFolders(): Promise<void> {
        const folders = [
            RECURRING_TEMPLATES_FOLDER,
            RECURRING_QUESTS_FOLDER,
            ARCHIVE_FOLDER,
        ];

        for (const folderPath of folders) {
            const folder = this.vault.getAbstractFileByPath(normalizePath(folderPath));
            if (!folder) {
                await this.vault.createFolder(normalizePath(folderPath));
                console.log(`[RecurringQuestService] Created folder: ${folderPath}`);
            }
        }
    }

    /**
     * Get today's date in YYYY-MM-DD format
     */
    getTodayDate(): string {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Get yesterday's date in YYYY-MM-DD format
     */
    private getYesterdayDate(): string {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    /**
     * Parse a recurrence rule and return which days it applies to (0-6)
     * Returns empty array if invalid or monthly
     */
    parseRecurrenceDays(recurrence: string): number[] {
        const normalized = recurrence.toLowerCase().trim();

        // Handle simple keywords
        if (normalized === 'daily') {
            return [0, 1, 2, 3, 4, 5, 6];
        }
        if (normalized === 'weekdays') {
            return [1, 2, 3, 4, 5];
        }
        if (normalized === 'weekends') {
            return [0, 6];
        }
        if (normalized === 'weekly') {
            return [1]; // Default to Monday
        }
        if (normalized === 'monthly') {
            return []; // Special case - handled separately
        }

        // Handle weekly:dayname format (e.g., weekly:sunday)
        if (normalized.startsWith('weekly:')) {
            const dayPart = normalized.substring(7).trim();
            const dayNum = DAY_MAP[dayPart];
            if (dayNum !== undefined) {
                return [dayNum];
            }
        }

        // Handle comma-separated day names (e.g., monday, wednesday, friday)
        const parts = normalized.split(',').map(s => s.trim());
        const days: number[] = [];
        for (const part of parts) {
            const dayNum = DAY_MAP[part];
            if (dayNum !== undefined) {
                days.push(dayNum);
            }
        }

        return days.sort((a, b) => a - b);
    }

    /**
     * Check if a recurrence rule is a monthly rule
     */
    isMonthlyRule(recurrence: string): boolean {
        return recurrence.toLowerCase().trim() === 'monthly';
    }

    /**
     * Check if a recurrence rule should generate today
     */
    shouldGenerateToday(recurrence: string): boolean {
        const today = new Date();
        const dayOfWeek = today.getDay();

        // Handle monthly separately
        if (this.isMonthlyRule(recurrence)) {
            return today.getDate() === 1;
        }

        // Check if today's day is in the scheduled days
        const scheduledDays = this.parseRecurrenceDays(recurrence);
        return scheduledDays.includes(dayOfWeek);
    }

    /**
     * Get human-readable schedule description
     */
    getScheduleDescription(recurrence: string): string {
        const normalized = recurrence.toLowerCase().trim();

        if (normalized === 'daily') return 'Every day';
        if (normalized === 'weekdays') return 'Weekdays (Mon-Fri)';
        if (normalized === 'weekends') return 'Weekends (Sat-Sun)';
        if (normalized === 'monthly') return '1st of each month';
        if (normalized === 'weekly') return 'Every Monday';

        if (normalized.startsWith('weekly:')) {
            const dayPart = normalized.substring(7).trim();
            const dayNum = DAY_MAP[dayPart];
            if (dayNum !== undefined) {
                return `Every ${DAY_NAMES[dayNum]}`;
            }
        }

        // Parse day list
        const days = this.parseRecurrenceDays(recurrence);
        if (days.length === 0) return `Invalid: "${recurrence}"`;
        if (days.length === 7) return 'Every day';

        const dayNames = days.map(d => DAY_NAMES[d]);
        if (dayNames.length === 1) return `Every ${dayNames[0]}`;
        if (dayNames.length === 2) return `${dayNames[0]} and ${dayNames[1]}`;

        const last = dayNames.pop();
        return `${dayNames.join(', ')}, and ${last}`;
    }

    /**
     * Get the next run date for a recurrence rule
     */
    getNextRunDate(recurrence: string): string | null {
        const today = new Date();
        const todayDay = today.getDay();

        if (this.isMonthlyRule(recurrence)) {
            // Next 1st of month
            const next = new Date(today);
            next.setDate(1);
            if (today.getDate() !== 1) {
                next.setMonth(next.getMonth() + 1);
            }
            return next.toISOString().split('T')[0];
        }

        const scheduledDays = this.parseRecurrenceDays(recurrence);
        if (scheduledDays.length === 0) return null;

        // Find next scheduled day
        for (let offset = 0; offset < 7; offset++) {
            const checkDay = (todayDay + offset) % 7;
            if (scheduledDays.includes(checkDay)) {
                const next = new Date(today);
                next.setDate(today.getDate() + offset);
                return next.toISOString().split('T')[0];
            }
        }

        return null;
    }

    /**
     * Get all recurring templates from the templates folder
     */
    async getRecurringTemplates(): Promise<RecurringTemplate[]> {
        const templates: RecurringTemplate[] = [];
        const folder = this.vault.getAbstractFileByPath(normalizePath(RECURRING_TEMPLATES_FOLDER));

        if (!folder || !(folder instanceof TFolder)) {
            console.log('[RecurringQuestService] Templates folder not found.');
            return templates;
        }

        for (const file of folder.children) {
            if (file instanceof TFile && file.extension === 'md') {
                const template = await this.parseTemplate(file);
                if (template) {
                    templates.push(template);
                }
            }
        }

        return templates;
    }

    /**
     * Get status for all templates (for dashboard)
     */
    async getTemplateStatuses(): Promise<TemplateStatus[]> {
        const templates = await this.getRecurringTemplates();
        const statuses: TemplateStatus[] = [];
        const today = this.getTodayDate();

        for (const template of templates) {
            const scheduledDays = this.parseRecurrenceDays(template.recurrenceRaw);
            const schedule = this.getScheduleDescription(template.recurrenceRaw);
            const nextRun = this.getNextRunDate(template.recurrenceRaw);
            const shouldRunToday = this.shouldGenerateToday(template.recurrenceRaw);

            let todayStatus: TemplateStatus['todayStatus'] = 'not-scheduled';
            if (shouldRunToday) {
                const templateId = this.getTemplateId(template.file);
                const exists = await this.instanceExists(templateId, today);
                todayStatus = exists ? 'generated' : 'pending';
            }

            statuses.push({
                template,
                schedule,
                nextRun,
                todayStatus,
                scheduledDays,
            });
        }

        return statuses;
    }

    /**
     * Parse a template file into RecurringTemplate
     */
    private async parseTemplate(file: TFile): Promise<RecurringTemplate | null> {
        try {
            const content = await this.vault.read(file);
            const lines = content.split(/\r?\n/);

            // Check for frontmatter
            if (lines[0] !== '---') return null;

            const frontmatterEnd = lines.findIndex((l, i) => i > 0 && l === '---');
            if (frontmatterEnd === -1) return null;

            const frontmatterLines = lines.slice(1, frontmatterEnd);
            const frontmatter: Record<string, string> = {};

            for (const line of frontmatterLines) {
                const match = line.match(/^(\w+):\s*(.+)$/);
                if (match) {
                    frontmatter[match[1]] = match[2].replace(/^["']|["']$/g, '');
                }
            }

            // Validate required fields
            if (!frontmatter.recurrence || !frontmatter.questName) {
                console.log(`[RecurringQuestService] Template ${file.name} missing required fields.`);
                return null;
            }

            // Get body content (after frontmatter)
            const bodyContent = lines.slice(frontmatterEnd + 1).join('\n').trim();

            return {
                file,
                questName: frontmatter.questName,
                recurrenceRaw: frontmatter.recurrence,
                category: frontmatter.category || 'general',
                priority: (frontmatter.priority as QuestPriority) || QuestPriority.MEDIUM,
                xpPerTask: parseInt(frontmatter.xpPerTask || '5', 10),
                completionBonus: parseInt(frontmatter.completionBonus || '15', 10),
                content: bodyContent,
            };
        } catch (error) {
            console.error(`[RecurringQuestService] Error parsing template ${file.name}:`, error);
            return null;
        }
    }

    /**
     * Generate a unique template ID from file path
     */
    private getTemplateId(file: TFile): string {
        return file.basename.toLowerCase().replace(/\s+/g, '-');
    }

    /**
     * Check if an instance already exists for a template + date
     */
    async instanceExists(templateId: string, date: string): Promise<boolean> {
        const folder = this.vault.getAbstractFileByPath(normalizePath(RECURRING_QUESTS_FOLDER));
        if (!folder || !(folder instanceof TFolder)) return false;

        for (const file of folder.children) {
            if (file instanceof TFile && file.name.includes(date)) {
                // Read file to check templateId
                const content = await this.vault.read(file);
                if (content.includes(`recurringTemplateId: ${templateId}`)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Generate today's quests from all applicable templates
     */
    private async generateTodaysQuests(): Promise<void> {
        const templates = await this.getRecurringTemplates();
        const today = this.getTodayDate();

        for (const template of templates) {
            // Check if this template should generate today
            if (!this.shouldGenerateToday(template.recurrenceRaw)) {
                console.log(`[RecurringQuestService] Skipping ${template.questName} - not scheduled for today`);
                continue;
            }

            // Check if instance already exists
            const templateId = this.getTemplateId(template.file);
            if (await this.instanceExists(templateId, today)) {
                console.log(`[RecurringQuestService] Instance already exists for ${template.questName} on ${today}`);
                continue;
            }

            // Generate the quest
            await this.generateQuestInstance(template, today);
        }
    }

    /**
     * Generate a quest instance from a template
     */
    async generateQuestInstance(template: RecurringTemplate, date: string): Promise<string> {
        const templateId = this.getTemplateId(template.file);
        const dateSlug = date.replace(/-/g, '');

        // Replace {{date}} and {{date_slug}} placeholders in quest name
        const questName = template.questName
            .replace(/\{\{date\}\}/g, date)
            .replace(/\{\{date_slug\}\}/g, dateSlug);
        const questId = `${templateId}-${date}`;
        const fileName = `${questName.replace(/[<>:"/\\|?*]/g, '')}.md`; // Sanitize filename
        const filePath = normalizePath(`${RECURRING_QUESTS_FOLDER}/${fileName}`);

        // Replace placeholders in body content
        const bodyContent = template.content
            .replace(/\{\{date\}\}/g, date)
            .replace(/\{\{date_slug\}\}/g, dateSlug)
            .replace(/\{\{output_path\}\}/g, filePath);

        // Build frontmatter
        const frontmatter = `---
schemaVersion: ${QUEST_SCHEMA_VERSION}
questId: "${questId}"
questName: "${questName}"
questType: main
category: ${template.category}
status: available
priority: ${template.priority}
tags:
  - recurring
createdDate: ${new Date().toISOString()}
completedDate: null
linkedTaskFile: "${filePath}"
xpPerTask: ${template.xpPerTask}
completionBonus: ${template.completionBonus}
visibleTasks: 4
recurrence: ${template.recurrenceRaw}
recurringTemplateId: ${templateId}
instanceDate: ${date}
---`;

        // Combine frontmatter with template content
        const fullContent = `${frontmatter}\n\n${bodyContent}`;

        // Create the file
        await this.vault.create(filePath, fullContent);
        console.log(`[RecurringQuestService] Generated quest: ${fileName}`);

        return filePath;
    }

    /**
     * Archive completed recurring quests from yesterday
     */
    private async archiveCompletedQuests(): Promise<void> {
        const folder = this.vault.getAbstractFileByPath(normalizePath(RECURRING_QUESTS_FOLDER));
        if (!folder || !(folder instanceof TFolder)) return;

        const yesterday = this.getYesterdayDate();
        const yesterdayMonth = yesterday.substring(0, 7); // YYYY-MM

        for (const file of folder.children) {
            if (file instanceof TFile && file.extension === 'md') {
                // Check if this is yesterday's quest
                const content = await this.vault.read(file);
                if (!content.includes(`instanceDate: ${yesterday}`)) continue;

                // Check if completed
                if (!content.includes('status: completed')) continue;

                // Move to archive
                const archiveFolderPath = normalizePath(`${ARCHIVE_FOLDER}/${yesterdayMonth}`);

                // Ensure month folder exists
                const monthFolder = this.vault.getAbstractFileByPath(archiveFolderPath);
                if (!monthFolder) {
                    await this.vault.createFolder(archiveFolderPath);
                }

                const newPath = normalizePath(`${archiveFolderPath}/${file.name}`);
                await this.vault.rename(file, newPath);
                console.log(`[RecurringQuestService] Archived: ${file.name} -> ${newPath}`);
            }
        }
    }

    /**
     * Get the templates folder path (for UI)
     */
    getTemplatesFolder(): string {
        return RECURRING_TEMPLATES_FOLDER;
    }

    /**
     * Get the recurring quests folder path (for UI)
     */
    getRecurringQuestsFolder(): string {
        return RECURRING_QUESTS_FOLDER;
    }
}
