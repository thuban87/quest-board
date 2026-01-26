/**
 * Bounty Service
 * 
 * Handles bounty generation, template selection, and monster matching.
 * Bounties trigger on quest completion with a configurable chance.
 * 
 * AI Generation:
 * - Generates 5 descriptions per folder via Gemini API
 * - Uses burn-on-use caching (each use removes one from cache)
 * - Triggers background regeneration when 1 template left
 * - Falls back to hardcoded templates if no API key
 */

import type { Quest } from '../models/Quest';
import type { Character } from '../models/Character';
import type { Monster } from '../models/Monster';
import type { Bounty, BountyTemplate, BountyRollResult } from '../models/Bounty';
import type { QuestBoardSettings } from '../settings';
import { monsterService } from './MonsterService';

// =====================
// BOUNTY LOOT BONUS
// =====================

/** Loot bonus for bounty fights (+200% = 3x multiplier) */
export const BOUNTY_LOOT_BONUS = 3.0;

/** Number of descriptions to generate per folder */
const DESCRIPTIONS_PER_FOLDER = 5;

// =====================
// MONSTER HINT MAPPING
// =====================

/**
 * Maps monster hints (categories) to specific monster template IDs.
 * When a bounty description references a category, we pick from these.
 */
const HINT_TO_MONSTERS: Record<string, string[]> = {
    // Categories
    goblins: ['goblin', 'hobgoblin', 'bugbear'],
    beasts: ['wolf', 'bear', 'giant_rat'],
    undead: ['skeleton', 'zombie', 'ghost'],
    trolls: ['cave_troll', 'river_troll'],
    night_elves: ['shadow_elf', 'dark_ranger'],
    dwarves: ['rogue_dwarf', 'berserker'],
    dragonkin: ['drake', 'wyvern'],
    aberrations: ['mimic', 'eye_beast'],

    // Specific monsters (for direct hints)
    goblin: ['goblin'],
    hobgoblin: ['hobgoblin'],
    bugbear: ['bugbear'],
    wolf: ['wolf'],
    bear: ['bear'],
    giant_rat: ['giant_rat'],
    skeleton: ['skeleton'],
    zombie: ['zombie'],
    ghost: ['ghost'],
    cave_troll: ['cave_troll'],
    river_troll: ['river_troll'],
    shadow_elf: ['shadow_elf'],
    dark_ranger: ['dark_ranger'],
    rogue_dwarf: ['rogue_dwarf'],
    berserker: ['berserker'],
    drake: ['drake'],
    wyvern: ['wyvern'],
    mimic: ['mimic'],
    eye_beast: ['eye_beast'],
};

// =====================
// KEYWORD-MATCHED BOUNTY TEMPLATES
// =====================

/**
 * Smart keyword-matched bounty templates.
 * Each folder keyword maps to themed descriptions with monster hints.
 * Used as fallback when no AI key or cache available.
 */
const BOUNTY_TEMPLATES: Record<string, BountyTemplate[]> = {
    // Kitchen / Cooking themed
    kitchen: [
        { description: "Goblins are raiding the pantry! Can you stop them?", monsterHint: "goblins" },
        { description: "Giant rats have infested the kitchen stores...", monsterHint: "giant_rat" },
        { description: "Something's been stealing food from the larder. It has claws.", monsterHint: "beasts" },
    ],
    cooking: [
        { description: "A mischievous goblin has made off with the spice rack!", monsterHint: "goblin" },
        { description: "Dire rats are attracted to the smell of fresh bread.", monsterHint: "giant_rat" },
    ],
    food: [
        { description: "The royal cooks are having problems with monsters stealing food. Can you help?", monsterHint: "goblins" },
        { description: "Something lurks in the pantry, and it's not the midnight snack you ordered...", monsterHint: "beasts" },
    ],

    // Work / Professional themed
    work: [
        { description: "A chaos demon is disrupting your focus! Time to defend your productivity.", monsterHint: "aberrations" },
        { description: "Deadline stress has manifested as a shadow creature...", monsterHint: "night_elves" },
        { description: "Paperwork gremlins are breeding in the filing cabinet!", monsterHint: "goblins" },
    ],
    project: [
        { description: "The project timeline has angered ancient spirits. They demand tribute!", monsterHint: "undead" },
        { description: "Scope creep has taken physical form—and it has teeth.", monsterHint: "aberrations" },
    ],
    meeting: [
        { description: "The meeting has been hijacked by corporate goblins!", monsterHint: "goblins" },
        { description: "Boredom demons haunt this conference room...", monsterHint: "aberrations" },
    ],

    // Fitness / Health themed
    fitness: [
        { description: "A bear has claimed your workout space! Challenge it!", monsterHint: "bear" },
        { description: "Your gains have awakened a cave troll from its slumber.", monsterHint: "cave_troll" },
        { description: "The gym guardian challenges your dedication. Will you accept?", monsterHint: "trolls" },
    ],
    gym: [
        { description: "A wolf pack has taken over the weight room!", monsterHint: "wolf" },
        { description: "The iron doesn't lie—and neither does this angry troll.", monsterHint: "trolls" },
    ],
    health: [
        { description: "Healing herbs attracted a territorial bear. Defend your stash!", monsterHint: "bear" },
        { description: "Wellness has drawn the attention of jealous spirits.", monsterHint: "ghost" },
    ],
    exercise: [
        { description: "Your morning run has been interrupted by territorial wolves!", monsterHint: "wolf" },
        { description: "Cardio has summoned a stamina-draining specter.", monsterHint: "ghost" },
    ],

    // Study / Learning themed
    study: [
        { description: "Dusty tomes have awakened skeletal guardians!", monsterHint: "skeleton" },
        { description: "An eye beast lurks between the bookshelves...", monsterHint: "eye_beast" },
        { description: "Knowledge seekers disturbed an ancient ghost.", monsterHint: "ghost" },
    ],
    learn: [
        { description: "The pursuit of knowledge has attracted arcane aberrations!", monsterHint: "aberrations" },
        { description: "A spectral librarian doesn't appreciate late returns.", monsterHint: "ghost" },
    ],
    reading: [
        { description: "A mimic was disguised as your reading material!", monsterHint: "mimic" },
        { description: "Literary discussions attracted debate-hungry goblins.", monsterHint: "goblins" },
    ],
    school: [
        { description: "Your studies have attracted the attention of ancient scholars—now undead!", monsterHint: "undead" },
        { description: "A ghostly professor demands a pop quiz... in combat!", monsterHint: "ghost" },
        { description: "The homework pile has become sentient and angry.", monsterHint: "aberrations" },
    ],
    paper: [
        { description: "A mimic disguised as your research notes attacks!", monsterHint: "mimic" },
        { description: "Writer's block has manifested as a shadowy creature.", monsterHint: "night_elves" },
    ],

    // Home / Chores themed
    home: [
        { description: "House goblins have made a mess of your living room!", monsterHint: "goblins" },
        { description: "Dust bunnies have evolved into something... larger.", monsterHint: "giant_rat" },
        { description: "The basement has been claimed by cave-dwelling trolls!", monsterHint: "cave_troll" },
    ],
    cleaning: [
        { description: "The dirt you're cleaning has taken sentient form!", monsterHint: "aberrations" },
        { description: "Grime golems emerge from behind the couch.", monsterHint: "trolls" },
    ],
    chores: [
        { description: "Procrastination demons are blocking your path!", monsterHint: "aberrations" },
        { description: "Lazy skeletons refuse to do their share of the work.", monsterHint: "skeleton" },
    ],

    // Creative / Art themed
    creative: [
        { description: "A shadow elf critic has harsh words for your work!", monsterHint: "shadow_elf" },
        { description: "Your muse has been stolen by mischievous goblins.", monsterHint: "goblins" },
    ],
    art: [
        { description: "Your masterpiece attracted art-hungry mimics!", monsterHint: "mimic" },
        { description: "Jealous spirits haunt your studio.", monsterHint: "ghost" },
    ],
    music: [
        { description: "Your melody disturbed a slumbering cave troll!", monsterHint: "cave_troll" },
        { description: "Off-key goblins demand a performance.", monsterHint: "goblins" },
    ],

    // Renovation / DIY themed
    reno: [
        { description: "Renovation noise disturbed a nest of goblins in the walls!", monsterHint: "goblins" },
        { description: "You uncovered something ancient behind that drywall...", monsterHint: "undead" },
    ],
    renovation: [
        { description: "The permits have angered bureaucratic demons!", monsterHint: "aberrations" },
        { description: "Demolition awakened a territorial troll.", monsterHint: "trolls" },
    ],
    diy: [
        { description: "Your DIY project attracted curious (hungry) giant rats.", monsterHint: "giant_rat" },
        { description: "The instruction manual was actually a mimic!", monsterHint: "mimic" },
    ],

    // Finance / Money themed
    finance: [
        { description: "Gold-hoarding goblins have noticed your wealth!", monsterHint: "goblins" },
        { description: "A treasure-guarding drake has taken interest.", monsterHint: "drake" },
    ],
    money: [
        { description: "Your savings attracted a coin-obsessed mimic!", monsterHint: "mimic" },
        { description: "Tax season has summoned bureaucratic aberrations.", monsterHint: "aberrations" },
    ],

    // Social / Relationships themed
    social: [
        { description: "Social anxiety has manifested as a shadow creature!", monsterHint: "shadow_elf" },
        { description: "Party crashers—literal goblins—have arrived.", monsterHint: "goblins" },
    ],

    // Gaming / Fun themed
    gaming: [
        { description: "The final boss has escaped into reality!", monsterHint: "dragonkin" },
        { description: "Rage-quit energy summoned a berserker dwarf.", monsterHint: "berserker" },
    ],

    // Standard quest types (from folder names Main, Side, Training, Recurring)
    main: [
        { description: "Your main quest has attracted a powerful enemy!", monsterHint: "dragonkin" },
        { description: "A fearsome guardian blocks your path to destiny.", monsterHint: "trolls" },
        { description: "The forces of darkness take notice of the hero's progress.", monsterHint: "undead" },
        { description: "An ancient evil stirs, drawn by your growing power.", monsterHint: "aberrations" },
    ],
    side: [
        { description: "Your side quest has disturbed some local creatures.", monsterHint: "beasts" },
        { description: "Goblins have set up an ambush along your path!", monsterHint: "goblins" },
        { description: "A wandering monster blocks your detour.", monsterHint: "trolls" },
    ],
    training: [
        { description: "Your training has attracted a sparring partner!", monsterHint: "beasts" },
        { description: "Practice makes perfect—so does combat experience!", monsterHint: "goblins" },
        { description: "The training grounds are under siege!", monsterHint: "undead" },
    ],
    recurring: [
        { description: "Your daily routine was interrupted by monsters!", monsterHint: "goblins" },
        { description: "The same old routine... with a new challenger!", monsterHint: "beasts" },
        { description: "Creatures are drawn to your consistent presence.", monsterHint: "undead" },
    ],

    // Default templates for unknown folder types
    default: [
        { description: "A dangerous creature has been spotted nearby!", monsterHint: "beasts" },
        { description: "Your achievements have drawn the attention of a powerful foe!", monsterHint: "trolls" },
        { description: "A goblin warband blocks your path to victory!", monsterHint: "goblins" },
        { description: "Skeletal warriors rise to challenge your progress.", monsterHint: "undead" },
        { description: "Something lurks in the shadows, watching your success...", monsterHint: "night_elves" },
        { description: "A wandering drake has caught your scent!", monsterHint: "drake" },
        { description: "The ancient trolls demand tribute for your accomplishments.", monsterHint: "trolls" },
        { description: "Chaos demons are drawn to productive mortals!", monsterHint: "aberrations" },
    ],
};

// =====================
// BOUNTY SERVICE CLASS
// =====================

class BountyServiceClass {
    private settings: QuestBoardSettings | null = null;
    private saveCallback: (() => Promise<void>) | null = null;
    private pendingGenerations: Map<string, Promise<void>> = new Map();

    /**
     * Initialize the service with settings
     */
    initialize(settings: QuestBoardSettings) {
        this.settings = settings;
    }

    /**
     * Update settings reference
     */
    updateSettings(settings: QuestBoardSettings) {
        this.settings = settings;
    }

    /**
     * Set save callback to persist cache after generation/use
     */
    setSaveCallback(callback: () => Promise<void>) {
        this.saveCallback = callback;
    }

    /**
     * Roll to see if a bounty triggers on quest completion.
     */
    rollBountyChance(bountyChance: number = 10): boolean {
        if (bountyChance <= 0) return false;
        const roll = Math.random() * 100;
        return roll < bountyChance;
    }

    /**
     * Get a template for a folder, using AI cache with burn-on-use.
     * If cache has <= 1 item, triggers background regeneration.
     */
    getTemplateForFolder(folderName: string): BountyTemplate {
        const folderId = folderName.toLowerCase();
        const cache = this.settings?.bountyDescriptionCache ?? {};
        const cachedTemplates = cache[folderId];

        // Use cached template if available
        if (cachedTemplates && cachedTemplates.length > 0) {
            // Pop one template (burn on use)
            const template = cachedTemplates.shift()!;

            // Update cache
            if (this.settings) {
                this.settings.bountyDescriptionCache[folderId] = cachedTemplates;
            }

            // If only 1 or fewer left, trigger background regeneration
            if (cachedTemplates.length <= 1) {
                this.triggerBackgroundRegeneration(folderName);
            }

            // Save the updated cache
            this.saveCache();

            console.log(`[BountyService] Used cached template for "${folderName}" (${cachedTemplates.length} remaining)`);
            return template;
        }

        // No cache - check if we have API key for generation
        if (this.settings?.geminiApiKey) {
            // Trigger background generation for next time
            this.triggerBackgroundRegeneration(folderName);
        }

        // Return from keyword-matched templates (fallback for no AI)
        return this.getKeywordMatchedTemplate(folderName);
    }

    /**
     * Get a template by keyword matching (fallback for non-AI users)
     */
    private getKeywordMatchedTemplate(folderName: string): BountyTemplate {
        const nameLower = folderName.toLowerCase();

        // Check each template category for keyword matches
        for (const [keyword, templates] of Object.entries(BOUNTY_TEMPLATES)) {
            if (keyword === 'default') continue; // Skip default, use as fallback

            if (nameLower.includes(keyword)) {
                // Found a match - pick random template from this category
                return templates[Math.floor(Math.random() * templates.length)];
            }
        }

        // No keyword match - use default templates
        const defaults = BOUNTY_TEMPLATES.default;
        return defaults[Math.floor(Math.random() * defaults.length)];
    }

    /**
     * Trigger background regeneration (non-blocking)
     */
    private triggerBackgroundRegeneration(folderName: string) {
        const folderId = folderName.toLowerCase();

        // Don't regenerate if already pending
        if (this.pendingGenerations.has(folderId)) {
            return;
        }

        // Don't regenerate without API key
        if (!this.settings?.geminiApiKey) {
            return;
        }

        console.log(`[BountyService] Triggering background generation for "${folderName}"`);

        const promise = this.generateDescriptions(folderName)
            .catch(err => console.warn(`[BountyService] Background generation failed for "${folderName}":`, err))
            .finally(() => this.pendingGenerations.delete(folderId));

        this.pendingGenerations.set(folderId, promise);
    }

    /**
     * Generate AI descriptions for a folder and cache them
     */
    private async generateDescriptions(folderName: string): Promise<void> {
        const apiKey = this.settings?.geminiApiKey;
        if (!apiKey) return;

        const folderId = folderName.toLowerCase();

        console.log(`[BountyService] Generating ${DESCRIPTIONS_PER_FOLDER} descriptions for "${folderName}"...`);

        try {
            const prompt = `Generate ${DESCRIPTIONS_PER_FOLDER} unique RPG bounty hunt descriptions for the theme "${folderName}".

These are quest completion notifications in a gamified task tracker. The player completed a quest in the "${folderName}" category and a monster has appeared as a bonus fight.

For each description:
1. Write a short, exciting description (1-2 sentences) themed to "${folderName}"
2. Suggest a monster type that fits the theme

Return JSON only, no markdown. Format:
[
  { "description": "A goblin stole your lunch!", "monsterHint": "goblins" },
  { "description": "Rats have infested the pantry!", "monsterHint": "beasts" }
]

Monster hints must be one of: goblins, beasts, undead, trolls, night_elves, dwarves, dragonkin, aberrations

Be creative and fun! Match monsters to the theme:
- Physical/fitness themes → beasts (wolf, bear), trolls
- Study/work themes → undead (skeleton, ghost), aberrations
- Home/chores themes → goblins, beasts
- Creative themes → night_elves, aberrations`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.9,
                        },
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error('No text in Gemini response');
            }

            // Parse JSON from response
            let jsonStr = text.trim();
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
            }

            // Try to extract JSON array
            const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                jsonStr = arrayMatch[0];
            }

            let parsed: BountyTemplate[];
            try {
                parsed = JSON.parse(jsonStr);
            } catch (parseError) {
                console.error('[BountyService] Failed to parse Gemini JSON. Raw text:', text);
                throw new Error(`JSON parse failed: ${parseError}`);
            }

            // Validate and clean up templates
            const validTemplates: BountyTemplate[] = [];
            for (const item of parsed) {
                if (item.description && item.monsterHint) {
                    // Normalize monster hint
                    const hint = item.monsterHint.toLowerCase();
                    if (HINT_TO_MONSTERS[hint]) {
                        validTemplates.push({
                            description: item.description,
                            monsterHint: hint,
                        });
                    }
                }
            }

            if (validTemplates.length === 0) {
                throw new Error('No valid templates in response');
            }

            // Pad with defaults if not enough
            while (validTemplates.length < DESCRIPTIONS_PER_FOLDER) {
                const defaults = BOUNTY_TEMPLATES.default;
                const defaultTemplate = defaults[Math.floor(Math.random() * defaults.length)];
                validTemplates.push({ ...defaultTemplate });
            }

            // Get existing cache and append new templates
            const existingCache = this.settings?.bountyDescriptionCache?.[folderId] ?? [];
            const newCache = [...existingCache, ...validTemplates];

            // Update settings cache
            if (this.settings) {
                this.settings.bountyDescriptionCache[folderId] = newCache;
            }

            console.log(`[BountyService] Generated ${validTemplates.length} templates for "${folderName}" (total: ${newCache.length})`);

            // Save cache
            await this.saveCache();

        } catch (error) {
            console.warn(`[BountyService] AI generation failed for "${folderName}":`, error);
            // Don't cache defaults - let it try again next time
        }
    }

    /**
     * Save cache to settings via callback
     */
    private async saveCache(): Promise<void> {
        if (this.saveCallback) {
            try {
                await this.saveCallback();
            } catch (err) {
                console.warn('[BountyService] Failed to save cache:', err);
            }
        }
    }

    /**
     * Select a monster template ID based on the monster hint.
     */
    selectMonsterFromHint(hint: string): string {
        const hintLower = hint.toLowerCase();
        const options = HINT_TO_MONSTERS[hintLower] ?? HINT_TO_MONSTERS['beasts'];
        return options[Math.floor(Math.random() * options.length)];
    }

    /**
     * Generate a unique bounty ID
     */
    generateBountyId(): string {
        return `bounty-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }

    /**
     * Extract folder name from quest for template matching.
     */
    getFolderFromQuest(quest: Quest): string {
        if (quest.questType) {
            return quest.questType;
        }
        return 'default';
    }

    /**
     * Generate a bounty for a completed quest.
     */
    generateBounty(quest: Quest, character: Character): Bounty | null {
        const folderName = this.getFolderFromQuest(quest);
        const template = this.getTemplateForFolder(folderName);
        const monsterId = this.selectMonsterFromHint(template.monsterHint);

        // Create monster at player level, overworld tier
        const monster = monsterService.createMonster(
            monsterId,
            character.level,
            'overworld'
        );

        if (!monster) {
            console.warn('[BountyService] Failed to create monster for bounty:', monsterId);
            return null;
        }

        return {
            id: this.generateBountyId(),
            questId: quest.questId,
            questTitle: quest.questName,
            folderName,
            description: template.description,
            monsterHint: template.monsterHint,
            monster,
            lootBonus: BOUNTY_LOOT_BONUS,
            createdAt: new Date().toISOString(),
        };
    }

    /**
     * Check if bounty triggers and generate one if so.
     */
    checkBountyTrigger(
        quest: Quest,
        character: Character,
        bountyChance: number = 10
    ): BountyRollResult {
        if (!this.rollBountyChance(bountyChance)) {
            return { triggered: false };
        }

        const bounty = this.generateBounty(quest, character);
        if (!bounty) {
            return { triggered: false };
        }

        console.log('[BountyService] Bounty triggered!', {
            quest: quest.questName,
            description: bounty.description,
            monster: bounty.monster.name,
            lootBonus: bounty.lootBonus,
        });

        return { triggered: true, bounty };
    }
}

// =====================
// SINGLETON INSTANCE
// =====================

export const bountyService = new BountyServiceClass();

// =====================
// CONVENIENCE EXPORTS
// =====================

/** Roll for bounty chance */
export function rollBountyChance(bountyChance: number = 10): boolean {
    return bountyService.rollBountyChance(bountyChance);
}

/** Generate a bounty for a quest */
export function generateBounty(quest: Quest, character: Character): Bounty | null {
    return bountyService.generateBounty(quest, character);
}

/** Check if bounty triggers and generate if so */
export function checkBountyTrigger(
    quest: Quest,
    character: Character,
    bountyChance: number = 10
): BountyRollResult {
    return bountyService.checkBountyTrigger(quest, character, bountyChance);
}
