/**
 * Template Stats Service
 * 
 * Tracks template usage for smart suggestions.
 * Data persisted via plugin.saveData().
 */

import type QuestBoardPlugin from '../../main';

/**
 * Statistics for a single template
 */
export interface TemplateStats {
    templatePath: string;
    templateName: string;
    timesUsed: number;
    lastUsed: string;  // ISO date
    categories: string[];  // Categories of quests created from this template
}

/**
 * All template statistics
 */
export interface TemplateStatsData {
    templates: Record<string, TemplateStats>;
    lastQuestCategory?: string;  // For "Similar to Last Quest" suggestions
    lastQuestType?: string;
}

/**
 * Service for tracking template usage
 */
export class TemplateStatsService {
    private plugin: QuestBoardPlugin;
    private data: TemplateStatsData = { templates: {} };

    constructor(plugin: QuestBoardPlugin) {
        this.plugin = plugin;
        this.loadStats();
    }

    /**
     * Load stats from plugin data
     */
    private loadStats(): void {
        const saved = (this.plugin.settings as any).templateStats;
        if (saved) {
            this.data = saved;
        }
    }

    /**
     * Save stats to plugin data
     */
    private async saveStats(): Promise<void> {
        (this.plugin.settings as any).templateStats = this.data;
        await this.plugin.saveSettings();
    }

    /**
     * Record a template usage
     */
    async recordUsage(templatePath: string, templateName: string, category?: string): Promise<void> {
        const existing = this.data.templates[templatePath];

        if (existing) {
            existing.timesUsed++;
            existing.lastUsed = new Date().toISOString();
            if (category && !existing.categories.includes(category)) {
                existing.categories.push(category);
            }
        } else {
            this.data.templates[templatePath] = {
                templatePath,
                templateName,
                timesUsed: 1,
                lastUsed: new Date().toISOString(),
                categories: category ? [category] : [],
            };
        }

        // Track last quest category for "Similar to Last Quest" suggestions
        if (category) {
            this.data.lastQuestCategory = category;
        }

        await this.saveStats();
    }

    /**
     * Get all template stats
     */
    getStats(): Record<string, TemplateStats> {
        return this.data.templates;
    }

    /**
     * Get top used templates (for "Your Favorites")
     */
    getTopTemplates(limit: number = 5): TemplateStats[] {
        return Object.values(this.data.templates)
            .sort((a, b) => b.timesUsed - a.timesUsed)
            .slice(0, limit);
    }

    /**
     * Get templates similar to last created quest (by category)
     */
    getSimilarTemplates(limit: number = 3): TemplateStats[] {
        const lastCategory = this.data.lastQuestCategory;
        if (!lastCategory) return [];

        return Object.values(this.data.templates)
            .filter(t => t.categories.includes(lastCategory))
            .sort((a, b) => b.timesUsed - a.timesUsed)
            .slice(0, limit);
    }

    /**
     * Get recently used templates
     */
    getRecentTemplates(limit: number = 5): TemplateStats[] {
        return Object.values(this.data.templates)
            .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
            .slice(0, limit);
    }

    /**
     * Get the last quest category (for UI hints)
     */
    getLastQuestCategory(): string | undefined {
        return this.data.lastQuestCategory;
    }

    /**
     * Clear all stats (for testing/reset)
     */
    async clearStats(): Promise<void> {
        this.data = { templates: {} };
        await this.saveStats();
    }
}

// Singleton instance
let templateStatsService: TemplateStatsService | null = null;

/**
 * Initialize the template stats service
 */
export function initTemplateStatsService(plugin: QuestBoardPlugin): TemplateStatsService {
    templateStatsService = new TemplateStatsService(plugin);
    return templateStatsService;
}

/**
 * Get the template stats service instance
 */
export function getTemplateStatsService(): TemplateStatsService | null {
    return templateStatsService;
}
