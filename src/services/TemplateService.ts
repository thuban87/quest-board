/**
 * Template Service
 * 
 * Handles reading templates from the vault and replacing placeholders.
 * Used for job hunt quest creation commands.
 */

import { Vault, TFile } from 'obsidian';

/**
 * Variables that can be substituted in templates
 */
export interface TemplateVariables {
    company: string;
    position?: string;
    company_slug: string;
    position_slug?: string;
    job_link: string;
    company_linkedin: string;
    salary_range: string;
    work_type: string;
    date: string;
    output_path: string;
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
     * Replace all {{placeholders}} in content with variable values
     */
    replaceVariables(content: string, variables: TemplateVariables): string {
        let result = content;

        // Replace each known placeholder
        result = result.replace(/\{\{company\}\}/g, variables.company);
        result = result.replace(/\{\{position\}\}/g, variables.position || '');
        result = result.replace(/\{\{company_slug\}\}/g, variables.company_slug);
        result = result.replace(/\{\{position_slug\}\}/g, variables.position_slug || '');
        result = result.replace(/\{\{job_link\}\}/g, variables.job_link || '');
        result = result.replace(/\{\{company_linkedin\}\}/g, variables.company_linkedin || '');
        result = result.replace(/\{\{salary_range\}\}/g, variables.salary_range || '');
        result = result.replace(/\{\{work_type\}\}/g, variables.work_type || '');
        result = result.replace(/\{\{date\}\}/g, variables.date);
        result = result.replace(/\{\{output_path\}\}/g, variables.output_path);

        return result;
    }

    /**
     * Convert a string to a URL-safe slug
     * "Acme Corp" -> "acme-corp"
     */
    toSlug(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-')          // Spaces to hyphens
            .replace(/-+/g, '-');          // Collapse multiple hyphens
    }

    /**
     * Get current date in YYYY-MM-DD format
     */
    getCurrentDate(): string {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    /**
     * Create a quest file from a template
     */
    async createQuestFromTemplate(
        templatePath: string,
        outputPath: string,
        variables: Omit<TemplateVariables, 'date' | 'output_path' | 'company_slug' | 'position_slug'>
    ): Promise<boolean> {
        // Read template
        const templateContent = await this.readTemplate(templatePath);
        if (!templateContent) {
            return false;
        }

        // Build full variables object
        const fullVariables: TemplateVariables = {
            ...variables,
            company_slug: this.toSlug(variables.company),
            position_slug: variables.position ? this.toSlug(variables.position) : '',
            date: this.getCurrentDate(),
            output_path: outputPath,
        };

        // Replace placeholders
        const content = this.replaceVariables(templateContent, fullVariables);

        // Create the file
        try {
            // Ensure parent folder exists
            const folderPath = outputPath.substring(0, outputPath.lastIndexOf('/'));
            const folder = this.vault.getAbstractFileByPath(folderPath);
            if (!folder) {
                await this.vault.createFolder(folderPath);
            }

            await this.vault.create(outputPath, content);
            return true;
        } catch (error) {
            console.error(`Failed to create quest file: ${error}`);
            return false;
        }
    }
}
