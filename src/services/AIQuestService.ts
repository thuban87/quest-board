/**
 * AI Quest Service
 * 
 * Generates quest markdown files using Gemini AI.
 * Creates epic, ADHD-friendly quests with category-specific themes.
 */

import type { QuestBoardSettings } from '../settings';
import { QuestStatus, QuestPriority, QuestDifficulty } from '../models/QuestStatus';
import { QUEST_SCHEMA_VERSION } from '../models/Quest';

// =====================
// TYPES
// =====================

export interface AIQuestInput {
    questName: string;
    description: string;
    tasks: string;
    objectives: string;
    questType: string;
    category: string;
    status: QuestStatus;
    priority: QuestPriority;
}

export interface AIQuestResult {
    success: boolean;
    markdown?: string;
    error?: string;
}

// =====================
// CATEGORY THEMES
// =====================

const CATEGORY_THEMES: Record<string, string> = {
    fitness: 'Epic training montage. Warrior discipline. The Iron Temple calls!',
    health: 'Wellness quest. Restoration rituals. Body and mind harmony.',
    admin: 'Conquering bureaucracy. Slaying paperwork dragons. Victory over chaos!',
    work: 'Professional achievement. Climbing the ranks. Corporate quests await!',
    study: 'Quest for knowledge. Unlocking secrets. Scholar\'s path to mastery.',
    learning: 'Gaining wisdom. Leveling up skills. The pursuit of understanding.',
    home: 'Defending your stronghold. Purification rituals. Domestic dominion!',
    chores: 'Maintaining the fortress. Order from chaos. Home guardian duties.',
    creative: 'Channeling muse energy. Crafting masterpieces. Artistic awakening!',
    art: 'Creating beauty. Visual conjuration. The artist\'s sacred craft.',
    social: 'Building alliances. Social quests. Strengthening bonds.',
    finance: 'Gold management. Treasure tracking. Wealth accumulation quest.',
    cooking: 'Culinary crafting. Potion brewing. The kitchen alchemist rises!',
    shopping: 'Resource gathering. Merchant negotiations. The hunt for supplies.',
    project: 'Epic undertaking. Multi-stage conquest. Project domination!',
};

// =====================
// SERVICE CLASS
// =====================

class AIQuestServiceClass {
    private settings: QuestBoardSettings | null = null;

    /**
     * Initialize the service with settings
     */
    initialize(settings: QuestBoardSettings): void {
        this.settings = settings;
    }

    /**
     * Update settings reference
     */
    updateSettings(settings: QuestBoardSettings): void {
        this.settings = settings;
    }

    /**
     * Generate a quest markdown file using Gemini AI
     */
    async generateQuest(input: AIQuestInput, availableCategories: string[]): Promise<AIQuestResult> {
        const apiKey = this.settings?.geminiApiKey;

        if (!apiKey) {
            return {
                success: false,
                error: 'No API key configured. Add your Gemini API key in settings.'
            };
        }

        try {
            const prompt = this.buildPrompt(input, availableCategories);

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,  // Lower = more consistent formatting, less creative variation
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorMessage = this.parseGeminiError(response.status);
                return { success: false, error: errorMessage };
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                return { success: false, error: 'No response from Gemini. Please try again.' };
            }

            // Extract markdown from response (strip any code blocks if present)
            const markdown = this.extractMarkdown(text);

            // Validate frontmatter structure
            const validationError = this.validateQuestMarkdown(markdown);
            if (validationError) {
                return { success: false, error: validationError };
            }

            return { success: true, markdown };

        } catch (error) {
            console.error('[AIQuestService] Generation failed:', error);
            return {
                success: false,
                error: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Parse Gemini API error codes into user-friendly messages
     */
    private parseGeminiError(status: number): string {
        switch (status) {
            case 429:
                return 'API rate limit reached. Try again later or upgrade your Gemini plan at Google AI Studio.';
            case 400:
                return 'Invalid request. Please check your input and try again.';
            case 401:
            case 403:
                return 'Invalid or unauthorized API key. Update your key in Quest Board settings.';
            case 404:
                return 'Gemini model not found. The API may have been updated.';
            case 500:
            case 502:
            case 503:
            case 504:
                return 'Gemini service temporarily unavailable. Please try again in a few minutes.';
            default:
                return `Gemini API error (${status}). Please try again later.`;
        }
    }

    /**
     * Extract markdown from Gemini response (handles code blocks)
     */
    private extractMarkdown(text: string): string {
        let markdown = text.trim();

        // Remove markdown code block wrappers if present
        if (markdown.startsWith('```')) {
            markdown = markdown
                .replace(/^```(?:markdown|yaml|md)?\s*\n?/i, '')
                .replace(/\n?```\s*$/i, '')
                .trim();
        }

        // FIX: Repair missing opening frontmatter delimiter
        // If markdown has frontmatter content but is missing opening ---
        if (!markdown.startsWith('---') && markdown.includes('\n---')) {
            // Check if it looks like frontmatter (starts with schemaVersion, questId, etc.)
            if (/^(schemaVersion|questId|questName):/m.test(markdown)) {
                markdown = '---\n' + markdown;
            }
        }

        return markdown;
    }

    /**
     * Validate quest markdown structure
     * Returns error message if invalid, null if valid
     */
    private validateQuestMarkdown(markdown: string): string | null {
        // Check for opening ---
        if (!markdown.startsWith('---')) {
            return 'Invalid format: Quest must start with frontmatter delimiter (---).';
        }

        // Check for closing ---
        const lines = markdown.split('\n');
        const closingDelimiterIndex = lines.findIndex((line, idx) => idx > 0 && line.trim() === '---');
        if (closingDelimiterIndex === -1) {
            return 'Invalid format: Missing closing frontmatter delimiter (---).';
        }

        // Check for required frontmatter fields
        const frontmatter = lines.slice(1, closingDelimiterIndex).join('\n');
        const requiredFields = ['schemaVersion', 'questId', 'questName', 'questType', 'category'];

        for (const field of requiredFields) {
            if (!frontmatter.includes(`${field}:`)) {
                return `Invalid format: Missing required field "${field}" in frontmatter.`;
            }
        }

        return null;
    }

    /**
     * Build the epic, ADHD-friendly prompt
     */
    private buildPrompt(input: AIQuestInput, availableCategories: string[]): string {
        const categoryTheme = this.getCategoryTheme(input.category);
        const questId = this.generateQuestId(input.questName);
        const createdDate = new Date().toISOString();

        return `You are a quest designer for **Quest Board**, a gamified task tracker designed for ADHD users. Transform mundane tasks into EPIC QUESTS that provide dopamine and motivation.

## CORE PRINCIPLES
1. **Gamification First**: Every quest should feel heroic and rewarding
2. **ADHD-Friendly**: Clear structure, small wins, visible progress
3. **Epic Flavor**: Use RPG language to make tasks feel like adventures
4. **Smart Organization**: Group related tasks into logical phases/sections

## USER INPUT
Quest Name: ${input.questName} || 'None provided - generate appropriate quest name based on description/tasks'
Description/Context: ${input.description || 'None provided'}
Tasks (raw):
${input.tasks || 'None provided - generate appropriate tasks based on quest name'}
Objectives: ${input.objectives || 'None provided'}
Quest Type: ${input.questType}
Category: ${input.category || 'Choose from: ' + availableCategories.join(', ')}
Status: ${input.status}
Priority: ${input.priority}

## CATEGORY THEME
${categoryTheme}

## AVAILABLE CATEGORIES
${availableCategories.join(', ')}

## DIFFICULTY & XP SCALING (choose based on task count)
- **trivial** (1-2 tasks): 3-5 XP/task, 10-20 bonus
- **easy** (3-5 tasks): 5-8 XP/task, 20-40 bonus
- **medium** (6-10 tasks): 8-12 XP/task, 40-80 bonus
- **hard** (11-15 tasks): 12-16 XP/task, 80-120 bonus
- **epic** (16+ tasks): 15-20 XP/task, 120-200 bonus

## OUTPUT INSTRUCTIONS
Generate a complete markdown quest file. Start your response with the opening delimiter (---) and follow the exact structure below.

CRITICAL: Your response must begin with THREE DASHES (---) on the first line. Do not add any text before the opening ---.

## EXACT FORMAT TO FOLLOW

The file MUST start with this exact structure:

---
schemaVersion: ${QUEST_SCHEMA_VERSION}
questId: "${questId}"
questName: "${input.questName}"
questType: ${input.questType}
category: "${input.category || 'PICK_FROM_AVAILABLE'}"
status: ${input.status}
priority: ${input.priority}
tags: []
createdDate: "${createdDate}"
completedDate: null
linkedTaskFile: ""
xpPerTask: CALCULATE_BASED_ON_DIFFICULTY
completionBonus: CALCULATE_BASED_ON_DIFFICULTY
visibleTasks: 4
difficulty: DETERMINE_FROM_TASK_COUNT
---

# 🎯 ${input.questName}

**Quest Type:** ${input.questType} | **Priority:** ${input.priority}

---

## Description

[Write 2-3 sentences with epic quest flavor. Make mundane tasks sound heroic. End with a clear goal statement.]

**Goal:** [One clear sentence about what success looks like]

---

## [Phase 1 Title]
- [ ] Task 1
- [ ] Task 2

## [Phase 2 Title] (if applicable)
- [ ] Task 3
- [ ] Task 4

---

## Notes

(Track your progress, obstacles, and insights here)

---

## Rewards

- [Specific benefit 1 - what they gain from completion]
- [Specific benefit 2]
- XP for each completed task
- Completion bonus XP!

---

## EXAMPLES OF GOOD QUEST FLAVOR

**Bad**: "Clean the kitchen"
**Good**: "The sacred kitchen has fallen into disarray! Ancient food vessels lie unwashed. Reclaim your culinary domain!"

**Bad**: "Finish project report"
**Good**: "The deadline looms! Your report must be forged in the fires of focus and delivered to the Client Lords!"

**Bad**: "Go to gym"
**Good**: "The Iron Temple calls! Your training montage begins now. Gains await the dedicated!"

## FINAL REMINDER
Your output must be ONLY the markdown file content. Start with --- on the very first line. Do not include any explanatory text, commentary, or markdown code blocks. Just output the raw quest file content.

Generate the quest file now:`;
    }

    /**
     * Get category-specific theme for prompt
     */
    private getCategoryTheme(category: string): string {
        if (!category) {
            return 'Match the theme to the quest content. Be creative and epic!';
        }

        const lower = category.toLowerCase();

        // Check direct match
        if (CATEGORY_THEMES[lower]) {
            return CATEGORY_THEMES[lower];
        }

        // Check partial matches
        for (const [key, theme] of Object.entries(CATEGORY_THEMES)) {
            if (lower.includes(key) || key.includes(lower)) {
                return theme;
            }
        }

        return `Theme for "${category}": Be creative and make it feel epic and rewarding!`;
    }

    /**
     * Generate quest ID from name
     */
    private generateQuestId(questName: string): string {
        return questName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }
}

// =====================
// SINGLETON EXPORT
// =====================

export const aiQuestService = new AIQuestServiceClass();
