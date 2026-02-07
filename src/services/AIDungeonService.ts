/**
 * AI Dungeon Service
 * 
 * Generates dungeon markdown files using Gemini AI (gemini-2.5-pro).
 * Uses two-pass approach: generation + cleanup for better quality.
 * Tracks daily API usage quota with UTC midnight reset.
 * 
 * Refactored based on code review:
 * - Generates markdown directly (not TypeScript)
 * - Local validation before saving
 * - Lower temperature for consistency
 * - Progress callbacks for UX
 * - Structured cleanup responses
 */

import type { QuestBoardSettings } from '../settings';
import type { TileSet, DungeonDifficulty } from '../models/Dungeon';
import type { GearSlot } from '../models/Gear';
import { parseDungeonMarkdown } from './UserDungeonLoader';

// =====================
// TYPES
// =====================

export interface AIDungeonInput {
    name?: string;              // Optional - AI generates if not provided
    tileset: TileSet;
    difficulty: DungeonDifficulty;
    roomCount: number;
    architecture: 'linear' | 'linear-branches' | 'multi-path';
    monsterCategories: string[];  // e.g., ['goblins', 'beasts'] or ['auto'] for AI choice
    bossType?: string;          // Optional specific boss
    lootSlots: GearSlot[] | 'balanced';
}

export interface AIDungeonResult {
    success: boolean;
    markdown?: string;
    filename?: string;
    error?: string;
    validationErrors?: string[];  // Specific validation failures
}

export type ProgressCallback = (phase: 'generating' | 'validating' | 'saving', detail?: string) => void;

// =====================
// VALID MONSTER IDS
// =====================

export const VALID_MONSTER_IDS = new Set([
    'wolf', 'bear', 'giant-rat',           // beasts
    'skeleton', 'zombie', 'ghost',          // undead
    'goblin', 'hobgoblin', 'bugbear',      // goblins
    'cave-troll', 'river-troll',           // trolls
    'shadow-elf', 'dark-ranger',           // night_elves
    'rogue-dwarf', 'berserker',            // dwarves
    'drake', 'wyvern',                     // dragonkin
    'mimic', 'eye-beast',                  // aberrations
]);

const MONSTER_CATEGORIES: Record<string, string[]> = {
    beasts: ['wolf', 'bear', 'giant-rat'],
    undead: ['skeleton', 'zombie', 'ghost'],
    goblins: ['goblin', 'hobgoblin', 'bugbear'],
    trolls: ['cave-troll', 'river-troll'],
    night_elves: ['shadow-elf', 'dark-ranger'],
    dwarves: ['rogue-dwarf', 'berserker'],
    dragonkin: ['drake', 'wyvern'],
    aberrations: ['mimic', 'eye-beast'],
};

const BOSS_MONSTERS: Record<string, string> = {
    beasts: 'bear',
    undead: 'ghost',
    goblins: 'bugbear',
    trolls: 'cave-troll',
    night_elves: 'dark-ranger',
    dwarves: 'berserker',
    dragonkin: 'wyvern',
    aberrations: 'eye-beast',
};

// =====================
// SERVICE CLASS
// =====================

class AIDungeonServiceClass {
    private settings: QuestBoardSettings | null = null;
    private saveCallback: (() => Promise<void>) | null = null;

    /**
     * Initialize the service with settings
     */
    initialize(settings: QuestBoardSettings, saveCallback: () => Promise<void>): void {
        this.settings = settings;
        this.saveCallback = saveCallback;
    }

    /**
     * Update settings reference
     */
    updateSettings(settings: QuestBoardSettings): void {
        this.settings = settings;
    }

    /**
     * Get remaining dungeon generations for today
     */
    getRemainingGenerations(): number {
        if (!this.settings) return 0;

        const today = new Date().toISOString().split('T')[0];
        if (this.settings.aiDungeonLastResetDate !== today) {
            return this.settings.aiDungeonMaxDaily;
        }

        return Math.max(0, this.settings.aiDungeonMaxDaily - this.settings.aiDungeonDailyCount);
    }

    /**
     * Check if user can generate (has quota remaining)
     */
    canGenerate(): boolean {
        if (!this.settings?.geminiApiKey) return false;
        return this.getRemainingGenerations() > 0;
    }

    /**
     * Increment usage count (call after successful generation)
     */
    private async incrementUsage(): Promise<void> {
        if (!this.settings || !this.saveCallback) return;

        const today = new Date().toISOString().split('T')[0];

        if (this.settings.aiDungeonLastResetDate !== today) {
            this.settings.aiDungeonDailyCount = 0;
            this.settings.aiDungeonLastResetDate = today;
        }

        this.settings.aiDungeonDailyCount++;
        await this.saveCallback();
    }

    /**
     * Generate a dungeon using Gemini AI
     * Uses two API calls: generation + cleanup/validation
     */
    async generateDungeon(
        input: AIDungeonInput,
        onProgress?: ProgressCallback
    ): Promise<AIDungeonResult> {
        const apiKey = this.settings?.geminiApiKey;

        if (!apiKey) {
            return {
                success: false,
                error: 'No API key configured. Add your Gemini API key in settings.'
            };
        }

        if (!this.canGenerate()) {
            return {
                success: false,
                error: `Daily limit reached (${this.settings?.aiDungeonMaxDaily} dungeons/day). Resets at midnight UTC.`
            };
        }

        try {
            // PASS 1: Generate dungeon markdown
            onProgress?.('generating', 'Creating dungeon structure...');
            const generationPrompt = this.buildGenerationPrompt(input);
            const rawMarkdown = await this.callGemini(generationPrompt);

            if (!rawMarkdown) {
                return { success: false, error: 'No response from Gemini. Please try again.' };
            }

            // PASS 2: Cleanup and validate with structured response
            onProgress?.('validating', 'Validating and cleaning up...');
            const cleanupPrompt = this.buildCleanupPrompt(rawMarkdown);
            const cleanupResponse = await this.callGemini(cleanupPrompt);

            if (!cleanupResponse) {
                return { success: false, error: 'Cleanup pass failed. Please try again.' };
            }

            // Parse structured cleanup response
            const cleanupResult = this.parseCleanupResponse(cleanupResponse);
            const finalMarkdown = cleanupResult.correctedMarkdown || rawMarkdown;

            // LOCAL VALIDATION using existing parser
            onProgress?.('validating', 'Running final validation...');
            const validationResult = this.validateDungeonMarkdown(finalMarkdown);

            if (!validationResult.valid) {
                return {
                    success: false,
                    error: 'Generated dungeon failed validation. Please try again.',
                    validationErrors: validationResult.errors
                };
            }

            // Generate filename
            const filename = this.generateFilename(input.name || this.extractName(finalMarkdown));

            // Increment usage after successful generation
            await this.incrementUsage();

            return {
                success: true,
                markdown: finalMarkdown,
                filename,
            };

        } catch (error) {
            console.error('[AIDungeonService] Generation failed:', error);
            return {
                success: false,
                error: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Call Gemini API with error handling
     */
    private async callGemini(prompt: string): Promise<string | null> {
        const apiKey = this.settings?.geminiApiKey;
        if (!apiKey) return null;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.4,  // Lower for more consistent formatting
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorMessage = this.parseGeminiError(response.status);
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                console.warn('[AIDungeonService] Empty response from Gemini');
                return null;
            }

            return text;
        } catch (error) {
            if (error instanceof Error) {
                throw error;  // Re-throw parsed errors
            }
            console.error('[AIDungeonService] Gemini API error:', error);
            throw new Error('Failed to connect to Gemini API');
        }
    }

    /**
     * Parse Gemini API error codes into user-friendly messages
     */
    private parseGeminiError(status: number): string {
        switch (status) {
            case 429:
                return 'API rate limit reached. Try again later.';
            case 400:
                return 'Invalid request. Please check your input.';
            case 401:
            case 403:
                return 'Invalid or unauthorized API key. Update your key in settings.';
            case 404:
                return 'Gemini model not found. The API may have been updated.';
            case 500:
            case 502:
            case 503:
            case 504:
                return 'Gemini service temporarily unavailable. Try again later.';
            default:
                return `Gemini API error (${status}).`;
        }
    }

    /**
     * Build the generation prompt - outputs MARKDOWN directly
     */
    private buildGenerationPrompt(input: AIDungeonInput): string {
        // Determine monster pools
        let monsterPool: string[];
        let bossMonster: string;

        if (input.monsterCategories.includes('auto') || input.monsterCategories.length === 0) {
            const tilesetMonsters: Record<TileSet, string[]> = {
                cave: ['goblins', 'trolls', 'beasts'],
                forest: ['beasts', 'undead'],
                dungeon: ['undead', 'aberrations'],
                castle: ['dwarves', 'night_elves', 'dragonkin'],
            };
            const categories = tilesetMonsters[input.tileset] || ['goblins', 'beasts'];
            monsterPool = categories.flatMap(c => MONSTER_CATEGORIES[c] || []);
            bossMonster = input.bossType || BOSS_MONSTERS[categories[0]] || 'bugbear';
        } else {
            monsterPool = input.monsterCategories.flatMap(c => MONSTER_CATEGORIES[c] || []);
            bossMonster = input.bossType || BOSS_MONSTERS[input.monsterCategories[0]] || 'bugbear';
        }

        // Use architecture from input
        const architecture = input.architecture;

        // Loot slots
        const lootSlots = input.lootSlots === 'balanced'
            ? ['weapon', 'chest', 'head', 'legs']
            : input.lootSlots;

        return `You are generating a dungeon for the Quest Board Obsidian plugin. 
Output the dungeon as a MARKDOWN file in the exact format shown below.

## TILESET & THEME
Tileset: ${input.tileset}
${input.name ? `Dungeon Name: ${input.name}` : 'Dungeon Name: Generate a thematic name based on the tileset'}
Difficulty: ${input.difficulty}

## DUNGEON ARCHITECTURE
Architecture: ${architecture}
Room Count: ${input.roomCount}
${architecture === 'linear' ? `
LINEAR: Rooms connect in a single path from entry to boss.
Example: entry → room_2 → room_3 → ... → boss_room
` : architecture === 'linear-branches' ? `
LINEAR-BRANCHES: Main path with 2-4 dead-end side rooms.
Example: entry → room_2 → room_3 (→ treasure_alcove) → room_4 → ... → boss_room
Branch rooms have only one door back to the main path. Good for treasure rooms or optional encounters.
` : `
MULTI-PATH: Multiple routes through the dungeon, converging at boss room.
Example: entry → splits into path_a and path_b → both paths meet at room before boss → boss_room
Create meaningful choices by having different monster types on each path.
`}

## MONSTERS
CRITICAL: You may ONLY use these exact monster IDs: ${monsterPool.join(', ')}
DO NOT invent new monster names. If a monster ID is not in this list, do not use it.

Boss Monster: ${bossMonster}
Total Monsters: ${Math.floor(input.roomCount * 2.5)}

## ROOM STRUCTURE RULES
Standard Room Size: 11 tiles wide × 7 tiles tall (columns 0-10, rows 0-6)
ALL rows must be EXACTLY 11 characters wide. Count them!

Characters:
| Char | Meaning |
|------|---------|
| # | Wall (blocking) |
| . | Floor (walkable) |
| P | Player spawn (ONE per dungeon, in entry room only) |
| M | Monster spawn point |
| C | Chest |
| O | Portal/Exit (ONE per dungeon, in boss room only) |

## DOOR PLACEMENT - CRITICAL!
Doors are OPENINGS IN WALLS, not floor tiles. They appear on row 0 or row 6 (top/bottom walls) or column 0 or column 10 (side walls).

CORRECT door examples:
- North door: row 0, replace # with . → position x,0
- South door: row 6, replace # with . → position x,6  
- West door:  column 0, replace # with . → position 0,y
- East door:  column 10, replace # with . → position 10,y

WRONG: Putting a D or door on an interior floor tile like row 5 column 5.
RIGHT: Putting the door opening on the actual wall row/column.

DOOR ADJACENCY RULE: Only floor tiles (.) or monsters (M) may be adjacent to door openings.
DO NOT place chests (C), portals (O), or player spawn (P) directly next to doors.

## CHEST TIERS
Tiers: novice, adept, journeyman, master, legendary
- 0-2 chests per standard room
- 2-4 chests in boss room
- legendary chests ONLY in boss room

## LOOT FOCUS
Slots: ${lootSlots.join(', ')}

## OUTPUT FORMAT - EXACT STRUCTURE REQUIRED

You must output a complete markdown file in this exact format:

---
name: [Dungeon Name]
description: [1-2 sentence description]
difficulty: ${input.difficulty}
tileset: ${input.tileset}
lootSlots: [${lootSlots.join(', ')}]
lootDescription: Good for ${lootSlots.slice(0, 2).join(' and ')}
---

## entry_room
type: entry
layout: |
  ###.#######
  #.........#
  #....P....#
  #.........#
  #.........#
  #.........#
  ###.#######
doors:
  3,0: room_2/south
  3,6: room_3/north

---

## room_2
type: combat
layout: |
  ###.#######
  #.........#
  #.........#
  #..M...M..#
  #.........#
  #.........#
  ###########
doors:
  3,0: entry_room/south
monsters:
  - position: [3, 3]
    pool: [${monsterPool[0]}]
  - position: [7, 3]
    pool: [${monsterPool[1] || monsterPool[0]}]

---

## boss_room
type: boss
layout: |
  ###.#######
  #.........#
  #C.......C#
  #....M....#
  #.........#
  #....O....#
  ###########
doors:
  3,0: previous_room/south
chests:
  - position: [1, 2]
    tier: master
  - position: [9, 2]
    tier: legendary
monsters:
  - position: [5, 3]
    pool: [${bossMonster}]
    isBoss: true

## CRITICAL RULES
1. Every layout row must be EXACTLY 11 characters. Count each row!
2. Doors are openings in the WALLS - replace # with . on row 0, 6, or column 0, 10
3. Door coordinates match exactly where the wall opening is
4. Doors are bidirectional: if room A has door to room B, room B must have door back to room A
5. Room IDs must match between door references
6. Every M in layout needs a matching entry in monsters array
7. Every C in layout needs a matching entry in chests array
8. Position format is [x, y] where x is column (0-10), y is row (0-6)
9. Entry room: P for player spawn, no monsters
10. Boss room: O for exit portal, at least one monster with isBoss: true

Generate the complete dungeon markdown now. Start your output with the YAML frontmatter (---).`;
    }

    /**
     * Build cleanup prompt that returns structured JSON response
     */
    private buildCleanupPrompt(rawMarkdown: string): string {
        return `You are reviewing a dungeon markdown file for the Quest Board plugin.
Check for errors and return a JSON response.

## INPUT MARKDOWN:
\`\`\`markdown
${rawMarkdown}
\`\`\`

## VALIDATION CHECKLIST
1. Every layout row is EXACTLY 11 characters wide
2. Door positions are on walkable tiles (D or . in layout, not #)
3. Doors are bidirectional (room A → B means B → A exists)
4. Every M in layout has matching monster entry
5. Every C in layout has matching chest entry
6. Positions use [x,y] format (x=column 0-10, y=row 0-6)
7. Entry room has exactly one P, no monsters
8. Boss room has exactly one O and at least one isBoss: true monster
9. All monster pool IDs are from this list: wolf, bear, giant-rat, skeleton, zombie, ghost, goblin, hobgoblin, bugbear, cave-troll, river-troll, shadow-elf, dark-ranger, rogue-dwarf, berserker, drake, wyvern, mimic, eye-beast
10. Room IDs in door references match actual room section headers

## OUTPUT FORMAT
Return ONLY a JSON object in this exact format:
{
  "valid": true/false,
  "issues": ["issue 1", "issue 2"],
  "correctedMarkdown": "---\\nname: ...\\n---\\n## entry...etc"
}

If valid is true and no corrections needed, set correctedMarkdown to null.
If you fix issues, include the complete corrected markdown in correctedMarkdown.

Return ONLY the JSON, no other text.`;
    }

    /**
     * Parse the structured cleanup response
     */
    private parseCleanupResponse(response: string): { valid: boolean; issues: string[]; correctedMarkdown: string | null } {
        try {
            // Try to extract JSON from response (may have markdown code blocks)
            let jsonStr = response.trim();

            // Remove markdown code blocks if present
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
            }

            const parsed = JSON.parse(jsonStr);

            return {
                valid: Boolean(parsed.valid),
                issues: Array.isArray(parsed.issues) ? parsed.issues : [],
                correctedMarkdown: typeof parsed.correctedMarkdown === 'string' ? parsed.correctedMarkdown : null
            };
        } catch (error) {
            console.warn('[AIDungeonService] Failed to parse cleanup response as JSON, using raw markdown');
            // If JSON parsing fails, assume the response is the corrected markdown
            return {
                valid: true,
                issues: [],
                correctedMarkdown: response
            };
        }
    }

    /**
     * Validate dungeon markdown using the existing parser
     */
    private validateDungeonMarkdown(markdown: string): { valid: boolean; errors: string[] } {
        // Use the existing parseDungeonMarkdown from UserDungeonLoader
        const result = parseDungeonMarkdown(markdown, 'ai_generated.md');

        if (!result.template) {
            return { valid: false, errors: result.errors };
        }

        // Additional validation: check monster IDs
        const invalidMonsters: string[] = [];
        for (const room of result.template.rooms) {
            for (const monster of room.monsters || []) {
                for (const monsterId of monster.pool) {
                    if (!VALID_MONSTER_IDS.has(monsterId)) {
                        invalidMonsters.push(monsterId);
                    }
                }
            }
        }

        if (invalidMonsters.length > 0) {
            return {
                valid: false,
                errors: [...result.errors, `Invalid monster IDs: ${invalidMonsters.join(', ')}`]
            };
        }

        // Check for P and O
        let hasP = false;
        let hasO = false;
        for (const room of result.template.rooms) {
            for (const row of room.layout) {
                if (row.includes('P')) hasP = true;
                if (row.includes('O')) hasO = true;
            }
        }

        const errors = [...result.errors];
        if (!hasP) errors.push('Missing player spawn (P)');
        if (!hasO) errors.push('Missing portal/exit (O)');

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Extract dungeon name from markdown
     */
    private extractName(markdown: string): string {
        const match = markdown.match(/^name:\s*(.+)$/m);
        return match?.[1]?.trim() || 'ai_dungeon';
    }

    /**
     * Generate a filename from the dungeon name
     */
    private generateFilename(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 50) + '.md';
    }
}

// =====================
// SINGLETON EXPORT
// =====================

export const aiDungeonService = new AIDungeonServiceClass();
