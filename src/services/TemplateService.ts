/**
 * Template Service
 * 
 * Handles reading templates from the vault, parsing placeholders dynamically,
 * and creating quest files with variable substitution.
 */

import { Vault, TFile, TFolder } from 'obsidian';
import type { ArchiveMode, QuestNamingMode } from './FolderWatchService';

/**
 * Placeholder info extracted from template
 */
export interface PlaceholderInfo {
    name: string;
    isSlug: boolean;      // ends with _slug
    parentField?: string; // for slugs, the field it's derived from
    isAutoDate: boolean;  // date or date_slug
    isOutputPath: boolean; // special: output_path
}

/**
 * Parsed template info
 */
export interface ParsedTemplate {
    path: string;
    name: string;           // from questName or filename
    content: string;
    placeholders: PlaceholderInfo[];
    questType: 'main' | 'side' | string;
    category?: string;
    // Folder watcher fields (for daily-quest and watched-folder types)
    watchFolder?: string;
    namingMode?: QuestNamingMode;
    namingPattern?: string;
    archiveMode?: ArchiveMode;
    archiveDurationHours?: number;
    archiveTime?: string;
    archivePath?: string;
}

/**
 * Service for reading and processing templates
 */
export class TemplateService {
    private vault: Vault;

    constructor(vault: Vault) {
        this.vault = vault;
    }

    /**
     * Scan a folder for template files
     */
    async getTemplatesInFolder(folderPath: string): Promise<TFile[]> {
        const folder = this.vault.getAbstractFileByPath(folderPath);
        if (!folder || !(folder instanceof TFolder)) {
            console.error(`Template folder not found: ${folderPath}`);
            return [];
        }

        const templates: TFile[] = [];

        const scanFolder = (f: TFolder) => {
            for (const child of f.children) {
                if (child instanceof TFile && child.extension === 'md') {
                    templates.push(child);
                } else if (child instanceof TFolder) {
                    scanFolder(child);
                }
            }
        };

        scanFolder(folder);
        return templates;
    }

    /**
     * Read a template file from the vault
     */
    async readTemplate(templatePath: string): Promise<string | null> {
        const file = this.vault.getAbstractFileByPath(templatePath);
        if (!file || !(file instanceof TFile)) {
            console.error(`Template not found: ${templatePath}`);
            return null;
        }

        try {
            return await this.vault.read(file);
        } catch (error) {
            console.error(`Failed to read template: ${error}`);
            return null;
        }
    }

    /**
     * Extract all unique {{placeholders}} from template content
     */
    extractPlaceholders(content: string): PlaceholderInfo[] {
        const regex = /\{\{(\w+)\}\}/g;
        const found = new Set<string>();
        let match;

        while ((match = regex.exec(content)) !== null) {
            found.add(match[1]);
        }

        return Array.from(found).map(name => {
            const isSlug = name.endsWith('_slug');
            const isAutoDate = name === 'date' || name === 'date_slug';
            const isOutputPath = name === 'output_path';

            // Determine parent field for slugs
            let parentField: string | undefined;
            if (isSlug && !isAutoDate) {
                parentField = name.replace('_slug', '');
            }

            return {
                name,
                isSlug,
                parentField,
                isAutoDate,
                isOutputPath,
            };
        });
    }

    /**
     * Extract questType and other frontmatter values
     */
    extractFrontmatter(content: string): {
        questType: string;
        questName?: string;
        category?: string;
        // Folder watcher fields
        watchFolder?: string;
        namingMode?: QuestNamingMode;
        namingPattern?: string;
        archiveMode?: ArchiveMode;
        archiveDurationHours?: number;
        archiveTime?: string;
        archivePath?: string;
    } {
        const result: ReturnType<typeof this.extractFrontmatter> = {
            questType: 'side',
            questName: undefined,
            category: undefined,
            watchFolder: undefined,
            namingMode: undefined,
            namingPattern: undefined,
            archiveMode: undefined,
            archiveDurationHours: undefined,
            archiveTime: undefined,
            archivePath: undefined,
        };

        // Check for frontmatter
        if (!content.startsWith('---')) {
            return result;
        }

        const endIndex = content.indexOf('---', 3);
        if (endIndex === -1) {
            return result;
        }

        const frontmatter = content.substring(3, endIndex);

        // Extract questType
        const typeMatch = frontmatter.match(/questType:\s*(\w+)/);
        if (typeMatch) {
            result.questType = typeMatch[1];
        }

        // Extract questName (for display)
        const nameMatch = frontmatter.match(/questName:\s*["']?([^"'\n]+)["']?/);
        if (nameMatch) {
            result.questName = nameMatch[1].trim();
        }

        // Extract category
        const catMatch = frontmatter.match(/category:\s*(\w+)/);
        if (catMatch) {
            result.category = catMatch[1];
        }

        // Extract folder watcher fields
        const watchFolderMatch = frontmatter.match(/watchFolder:\s*["']?([^"'\n]+)["']?/);
        if (watchFolderMatch) {
            result.watchFolder = watchFolderMatch[1].trim();
        }

        const namingModeMatch = frontmatter.match(/namingMode:\s*(\w+)/);
        if (namingModeMatch) {
            result.namingMode = namingModeMatch[1] as QuestNamingMode;
        }

        const namingPatternMatch = frontmatter.match(/namingPattern:\s*["']?([^"'\n]+)["']?/);
        if (namingPatternMatch) {
            result.namingPattern = namingPatternMatch[1].trim();
        }

        const archiveModeMatch = frontmatter.match(/archiveMode:\s*(\S+)/);
        if (archiveModeMatch) {
            result.archiveMode = archiveModeMatch[1] as ArchiveMode;
        }

        const archiveDurationMatch = frontmatter.match(/archiveDurationHours:\s*(\d+)/);
        if (archiveDurationMatch) {
            result.archiveDurationHours = parseInt(archiveDurationMatch[1], 10);
        }

        const archiveTimeMatch = frontmatter.match(/archiveTime:\s*["']?([^"'\n]+)["']?/);
        if (archiveTimeMatch) {
            result.archiveTime = archiveTimeMatch[1].trim();
        }

        const archivePathMatch = frontmatter.match(/archivePath:\s*["']?([^"'\n]+)["']?/);
        if (archivePathMatch) {
            result.archivePath = archivePathMatch[1].trim();
        }

        return result;
    }

    /**
     * Parse a template file completely
     */
    async parseTemplate(templatePath: string): Promise<ParsedTemplate | null> {
        const content = await this.readTemplate(templatePath);
        if (!content) {
            return null;
        }

        const placeholders = this.extractPlaceholders(content);
        const frontmatter = this.extractFrontmatter(content);

        // Get friendly name from filename if not in frontmatter
        const fileName = templatePath.split('/').pop()?.replace('.md', '').replace(/-template$/, '') || 'Unknown';
        const displayName = frontmatter.questName || this.titleCase(fileName.replace(/-/g, ' '));

        return {
            path: templatePath,
            name: displayName,
            content,
            placeholders,
            questType: frontmatter.questType,
            category: frontmatter.category,
            // Folder watcher fields
            watchFolder: frontmatter.watchFolder,
            namingMode: frontmatter.namingMode,
            namingPattern: frontmatter.namingPattern,
            archiveMode: frontmatter.archiveMode,
            archiveDurationHours: frontmatter.archiveDurationHours,
            archiveTime: frontmatter.archiveTime,
            archivePath: frontmatter.archivePath,
        };
    }

    /**
     * Get user-input placeholders (excludes auto-generated ones)
     */
    getUserInputPlaceholders(placeholders: PlaceholderInfo[]): PlaceholderInfo[] {
        return placeholders.filter(p =>
            !p.isSlug &&           // Slugs are auto-generated
            !p.isAutoDate &&       // Dates are auto-filled
            !p.isOutputPath        // Output path is system-generated
        );
    }

    /**
     * Replace all {{placeholders}} in content with provided values
     */
    replaceAllPlaceholders(content: string, values: Record<string, string>): string {
        let result = content;

        for (const [key, value] of Object.entries(values)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            result = result.replace(regex, value);
        }

        return result;
    }

    /**
     * Convert a string to a URL-safe slug
     */
    toSlug(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    /**
     * Get current date in YYYY-MM-DD format
     */
    getCurrentDate(): string {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    /**
     * Title case a string
     */
    titleCase(str: string): string {
        return str.replace(/\b\w/g, c => c.toUpperCase());
    }

    /**
     * Build complete variable set from user input
     */
    buildVariables(
        userInput: Record<string, string>,
        placeholders: PlaceholderInfo[],
        outputPath: string
    ): Record<string, string> {
        const result: Record<string, string> = { ...userInput };

        // Auto-generate slugs
        for (const p of placeholders) {
            if (p.isSlug && p.parentField && userInput[p.parentField]) {
                result[p.name] = this.toSlug(userInput[p.parentField]);
            }
        }

        // Auto-fill dates
        const today = this.getCurrentDate();
        if (placeholders.some(p => p.name === 'date')) {
            result['date'] = today;
        }
        if (placeholders.some(p => p.name === 'date_slug')) {
            result['date_slug'] = this.toSlug(today);
        }

        // Set output path
        result['output_path'] = outputPath;

        return result;
    }

    /**
     * Generate output path based on questType and user input
     */
    generateOutputPath(
        questType: string,
        userInput: Record<string, string>,
        placeholders: PlaceholderInfo[],
        questName: string,
        storageFolder: string
    ): string {
        // Use questType directly as folder name (lowercase)
        const basePath = `${storageFolder}/quests/${questType.toLowerCase()}`;

        // Build filename from questName with placeholders replaced
        let fileName = questName;
        for (const [key, value] of Object.entries(userInput)) {
            fileName = fileName.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        }

        // Also handle slugs in filename
        for (const p of placeholders) {
            if (p.isSlug && p.parentField && userInput[p.parentField]) {
                fileName = fileName.replace(
                    new RegExp(`\\{\\{${p.name}\\}\\}`, 'g'),
                    this.toSlug(userInput[p.parentField])
                );
            }
        }

        // Clean up filename
        fileName = fileName.replace(/[<>:"/\\|?*]/g, '').trim();

        return `${basePath}/${fileName}.md`;
    }

    /**
     * Create a quest file from template with dynamic variables
     */
    async createFromTemplate(
        templatePath: string,
        outputPath: string,
        variables: Record<string, string>
    ): Promise<boolean> {
        const content = await this.readTemplate(templatePath);
        if (!content) {
            return false;
        }

        const finalContent = this.replaceAllPlaceholders(content, variables);

        try {
            // Ensure parent folder exists
            const folderPath = outputPath.substring(0, outputPath.lastIndexOf('/'));
            const folder = this.vault.getAbstractFileByPath(folderPath);
            if (!folder) {
                await this.vault.createFolder(folderPath);
            }

            await this.vault.create(outputPath, finalContent);
            return true;
        } catch (error) {
            console.error(`Failed to create quest file: ${error}`);
            return false;
        }
    }
}
