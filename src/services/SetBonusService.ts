/**
 * Set Bonus Service
 * 
 * Handles set detection, bonus generation, and active bonus calculation.
 * Sets are based on quest folder structure.
 */

import { App } from 'obsidian';
import {
    GearItem,
    SetBonus,
    SetBonusEffect,
    ActiveSetBonus,
    GearSlot,
    normalizeSetId,
} from '../models/Gear';
import { StatType } from '../models/Character';
import type { QuestBoardSettings } from '../settings';

// ============================================
// Default Set Folders to Exclude
// ============================================

/** System/organizational folders that shouldn't form sets */
export const DEFAULT_EXCLUDED_SET_FOLDERS = ['main', 'side', 'training', 'recurring', 'daily'];

// ============================================
// Default Bonus Templates (fallback if AI fails)
// ============================================

const DEFAULT_BONUSES: SetBonus[] = [
    { pieces: 2, effect: { type: 'stat_bonus', stat: 'constitution', value: 5 } },
    { pieces: 4, effect: { type: 'xp_bonus', category: 'all', percent: 10 } },
    { pieces: 6, effect: { type: 'gold_bonus', category: 'all', percent: 15 } },
];

// ============================================
// Set Bonus Service
// ============================================

class SetBonusServiceClass {
    private app: App | null = null;
    private settings: QuestBoardSettings | null = null;

    // Cache for generated set bonuses (setId -> bonuses)
    private bonusCache: Map<string, SetBonus[]> = new Map();

    // Track pending API calls to prevent duplicate requests
    private pendingGenerations: Map<string, Promise<SetBonus[]>> = new Map();

    // Callback to save cache to plugin settings
    private saveCallback: (() => Promise<void>) | null = null;

    /**
     * Initialize the service with app and settings
     */
    initialize(app: App, settings: QuestBoardSettings) {
        this.app = app;
        this.settings = settings;
    }

    /**
     * Set save callback to persist cache after generation
     */
    setSaveCallback(callback: () => Promise<void>) {
        this.saveCallback = callback;
    }

    /**
     * Update settings reference
     */
    updateSettings(settings: QuestBoardSettings) {
        this.settings = settings;
    }

    /**
     * Load cached bonuses from plugin data (called on plugin load)
     */
    loadCache(savedCache: Record<string, SetBonus[]> | undefined) {
        this.bonusCache.clear();
        if (savedCache) {
            for (const [setId, bonuses] of Object.entries(savedCache)) {
                this.bonusCache.set(setId, bonuses);
            }
        }
    }

    /**
     * Save cache to plugin data format
     */
    getCacheForSave(): Record<string, SetBonus[]> {
        const result: Record<string, SetBonus[]> = {};
        for (const [setId, bonuses] of this.bonusCache.entries()) {
            result[setId] = bonuses;
        }
        return result;
    }

    /**
     * Sync cache with current folders - remove entries for deleted folders
     */
    syncWithFolders() {
        const existingFolders = this.getAllQuestFolders();
        const existingIds = new Set(existingFolders.map(f => f.id));

        let removed = 0;
        for (const cachedId of this.bonusCache.keys()) {
            if (!existingIds.has(cachedId)) {
                this.bonusCache.delete(cachedId);
                removed++;
            }
        }

        if (removed > 0) {
            // Stale cache entries were removed
        }
    }

    /**
     * Get set info from a quest path.
     * Returns null if quest is in root folder, excluded folder, or subfolder.
     */
    getSetFromQuestPath(questPath: string): { id: string; name: string } | null {
        if (!this.settings) return null;

        // Calculate quests folder path from storage folder
        const questsFolder = `${this.settings.storageFolder}/quests`;
        const excludedFolders = this.settings.excludedSetFolders ?? DEFAULT_EXCLUDED_SET_FOLDERS;

        // Normalize path separators
        const normalizedQuestPath = questPath.replace(/\\/g, '/');
        const normalizedQuestsFolder = questsFolder.replace(/\\/g, '/');

        // Remove quest folder prefix
        if (!normalizedQuestPath.startsWith(normalizedQuestsFolder + '/')) {
            return null;  // Not in quests folder
        }

        const relativePath = normalizedQuestPath.substring(normalizedQuestsFolder.length + 1);
        const parts = relativePath.split('/');

        // Must be exactly: [folderName, filename.md] - direct child only
        if (parts.length !== 2) return null;

        const folderName = parts[0];
        const normalizedName = normalizeSetId(folderName);

        // Exclude system/organizational folders
        if (excludedFolders.includes(normalizedName)) return null;

        return {
            id: normalizedName,
            name: folderName,
        };
    }

    /**
     * Get all quest folders that could have set bonuses.
     * Returns { id, name } for each non-excluded folder.
     */
    getAllQuestFolders(): { id: string; name: string }[] {
        if (!this.app || !this.settings) return [];

        const questsFolder = `${this.settings.storageFolder}/quests`;
        const excludedFolders = this.settings.excludedSetFolders ?? DEFAULT_EXCLUDED_SET_FOLDERS;
        const folders: { id: string; name: string }[] = [];

        const questsDir = this.app.vault.getAbstractFileByPath(questsFolder);
        if (!questsDir || !('children' in questsDir)) return [];

        for (const child of (questsDir as any).children) {
            if ('children' in child) {  // It's a folder
                const folderName = child.name;
                const normalizedName = normalizeSetId(folderName);

                if (!excludedFolders.includes(normalizedName)) {
                    folders.push({ id: normalizedName, name: folderName });
                }
            }
        }

        return folders;
    }

    /**
     * Get all quest folders that are NOT already cached.
     */
    getUncachedFolders(): { id: string; name: string }[] {
        return this.getAllQuestFolders().filter(f => !this.bonusCache.has(f.id));
    }

    /**
     * Generate bonuses for a single set.
     * If there are OTHER uncached folders, generates for ALL of them in one API call.
     * Uses cache if available.
     */
    async generateBonuses(setId: string, setName: string): Promise<SetBonus[]> {
        // Check cache first
        if (this.bonusCache.has(setId)) {
            return this.bonusCache.get(setId)!;
        }

        // Check if there's already a batch generation in progress for this set
        if (this.pendingGenerations.has(setId)) {
            return this.pendingGenerations.get(setId)!;
        }

        // Get ALL uncached folders (including this one)
        const uncachedFolders = this.getUncachedFolders();

        // Make sure our folder is in the list (might be new quest folder not yet detected)
        if (!uncachedFolders.find(f => f.id === setId)) {
            uncachedFolders.push({ id: setId, name: setName });
        }

        // Create a batch generation promise
        const batchPromise = this.generateBatchBonuses(uncachedFolders);

        // Track this promise for all uncached folders
        for (const folder of uncachedFolders) {
            if (!this.pendingGenerations.has(folder.id)) {
                this.pendingGenerations.set(folder.id,
                    batchPromise.then(() => this.bonusCache.get(folder.id) ?? this.generateDefaultBonuses(folder.name))
                );
            }
        }

        // Wait for batch to complete
        await batchPromise;

        // Clear ALL pending entries from this batch
        for (const folder of uncachedFolders) {
            this.pendingGenerations.delete(folder.id);
        }

        return this.bonusCache.get(setId) ?? this.generateDefaultBonuses(setName);
    }

    /**
     * Get cached bonuses synchronously (for tooltips).
     * Returns default bonuses if not cached, triggers batch generation in background.
     */
    getCachedBonuses(setId: string, setName: string): SetBonus[] {
        // Return from cache if available
        if (this.bonusCache.has(setId)) {
            return this.bonusCache.get(setId)!;
        }

        // If not already pending, trigger batch generation in background
        if (!this.pendingGenerations.has(setId)) {
            this.generateBonuses(setId, setName).catch(() => { });
        }

        // Return defaults immediately (sync)
        return this.generateDefaultBonuses(setName);
    }

    /**
     * Generate bonuses for MULTIPLE sets in ONE API call.
     * Caches each result individually.
     */
    private async generateBatchBonuses(folders: { id: string; name: string }[]): Promise<void> {
        if (folders.length === 0) return;

        const apiKey = this.settings?.geminiApiKey;

        // No API key - use defaults for all
        if (!apiKey) {
            for (const folder of folders) {
                this.bonusCache.set(folder.id, this.generateDefaultBonuses(folder.name));
            }
            return;
        }

        try {
            const folderList = folders.map(f => f.name).join('", "');
            const prompt = `Generate RPG set bonuses for ${folders.length} gear sets. Each set needs 3 bonuses (2pc, 4pc, 6pc).

Set names: "${folderList}"

Return JSON only, no markdown. Format as an object with set names as keys:
{
  "SetName1": [
    { "pieces": 2, "effect": { "type": "stat_bonus", "stat": "<strength|dexterity|constitution|intelligence|wisdom|charisma>", "value": 5-10 } },
    { "pieces": 4, "effect": { "type": "xp_bonus", "category": "all", "percent": 10-20 } },
    { "pieces": 6, "effect": { "type": "title", "title": "<Creative Title>" } }
  ],
  "SetName2": [...]
}

Effect types:
- stat_bonus: { type: "stat_bonus", stat: string, value: number }
- xp_bonus: { type: "xp_bonus", category: "all", percent: number }
- gold_bonus: { type: "gold_bonus", category: "all", percent: number }
- title: { type: "title", title: string }

Be creative! Match stats to themes (fitness→strength, study→wisdom, work→intelligence).`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.8,
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

            // Try to extract JSON object
            const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                jsonStr = objectMatch[0];
            }

            let parsed: Record<string, SetBonus[]>;
            try {
                parsed = JSON.parse(jsonStr);
            } catch (parseError) {
                console.error('[SetBonusService] Failed to parse batch Gemini JSON. Raw text:', text);
                throw new Error(`JSON parse failed: ${parseError}`);
            }

            // Cache each set individually
            for (const folder of folders) {
                // Try exact match first, then case-insensitive
                let bonuses = parsed[folder.name];
                if (!bonuses) {
                    // Try case-insensitive lookup
                    const key = Object.keys(parsed).find(k => k.toLowerCase() === folder.name.toLowerCase());
                    if (key) bonuses = parsed[key];
                }

                if (bonuses && Array.isArray(bonuses) && bonuses.length > 0) {
                    // Ensure exactly 3 bonuses
                    while (bonuses.length < 3) {
                        const defaults = this.generateDefaultBonuses(folder.name);
                        bonuses.push(defaults[bonuses.length]);
                    }
                    if (bonuses.length > 3) bonuses = bonuses.slice(0, 3);

                    this.bonusCache.set(folder.id, bonuses);
                } else {
                    // Fallback to defaults for this folder
                    this.bonusCache.set(folder.id, this.generateDefaultBonuses(folder.name));
                }
            }
        } catch (error) {
            console.warn('[SetBonusService] Batch generation failed, using defaults:', error);
            // Fall back to defaults for all folders
            for (const folder of folders) {
                if (!this.bonusCache.has(folder.id)) {
                    this.bonusCache.set(folder.id, this.generateDefaultBonuses(folder.name));
                }
            }
        }

        // Persist cache to settings
        if (this.saveCallback) {
            this.saveCallback().catch(err => console.warn('[SetBonusService] Failed to save cache:', err));
        }
    }

    /**
     * Generate thematic bonuses using Gemini AI (single set - used by test button).
     * Falls back to defaults if AI is not configured or fails.
     */
    private async generateThematicBonuses(setName: string): Promise<SetBonus[]> {
        const apiKey = this.settings?.geminiApiKey;

        // No API key - use default generation
        if (!apiKey) {
            return this.generateDefaultBonuses(setName);
        }

        try {
            const prompt = `Generate 3 RPG set bonuses for a gear set called "${setName}". The bonuses should be thematic to what the name suggests.

Return JSON only, no markdown, in this exact format:
[
  { "pieces": 2, "effect": { "type": "stat_bonus", "stat": "<strength|dexterity|constitution|intelligence|wisdom|charisma>", "value": <5-10> } },
  { "pieces": 4, "effect": { "type": "xp_bonus", "category": "all", "percent": <10-20> } },
  { "pieces": 6, "effect": { "type": "title", "title": "<Creative Title>" } }
]

Effect types available:
- stat_bonus: { type: "stat_bonus", stat: string, value: number }
- xp_bonus: { type: "xp_bonus", category: "all", percent: number }
- gold_bonus: { type: "gold_bonus", category: "all", percent: number }  
- title: { type: "title", title: string }

Be creative! The stat should match the theme (e.g., fitness→strength, study→wisdom, work→intelligence).`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.8,
                            maxOutputTokens: 1024,
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

            // Parse JSON from response (handle potential markdown wrapping)
            let jsonStr = text.trim();

            // Remove markdown code blocks if present
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
            }

            // Try to extract JSON array if there's extra text
            const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                jsonStr = arrayMatch[0];
            }

            let parsed: SetBonus[];
            try {
                parsed = JSON.parse(jsonStr) as SetBonus[];
            } catch (parseError) {
                console.error('[SetBonusService] Failed to parse Gemini JSON. Raw text:', text);
                throw new Error(`JSON parse failed: ${parseError}`);
            }

            // Validate structure
            if (!Array.isArray(parsed) || parsed.length < 1) {
                console.error('[SetBonusService] Invalid structure. Parsed:', parsed);
                throw new Error('Invalid bonus structure from Gemini');
            }

            // Ensure we have exactly 3 bonuses (pad with defaults if needed)
            while (parsed.length < 3) {
                const defaults = this.generateDefaultBonuses(setName);
                parsed.push(defaults[parsed.length]);
            }
            if (parsed.length > 3) {
                parsed = parsed.slice(0, 3);
            }

            return parsed;
        } catch (error) {
            console.warn('[SetBonusService] Gemini generation failed:', error);
            return this.generateDefaultBonuses(setName);
        }
    }

    /**
     * Generate default bonuses with some thematic variation based on set name.
     */
    private generateDefaultBonuses(setName: string): SetBonus[] {
        const nameLower = setName.toLowerCase();

        // Pick primary stat based on keywords
        let primaryStat: StatType = 'constitution';
        if (nameLower.includes('work') || nameLower.includes('job') || nameLower.includes('career')) {
            primaryStat = 'intelligence';
        } else if (nameLower.includes('fitness') || nameLower.includes('gym') || nameLower.includes('health')) {
            primaryStat = 'strength';
        } else if (nameLower.includes('creative') || nameLower.includes('art') || nameLower.includes('music')) {
            primaryStat = 'charisma';
        } else if (nameLower.includes('study') || nameLower.includes('learn') || nameLower.includes('course')) {
            primaryStat = 'wisdom';
        } else if (nameLower.includes('home') || nameLower.includes('house') || nameLower.includes('clean')) {
            primaryStat = 'dexterity';
        }

        // Generate title from set name
        const title = `${setName} Champion`;

        return [
            { pieces: 2, effect: { type: 'stat_bonus', stat: primaryStat, value: 5 } },
            { pieces: 4, effect: { type: 'xp_bonus', category: 'all', percent: 10 } },
            { pieces: 6, effect: { type: 'title', title } },
        ];
    }

    /**
     * Calculate active set bonuses from equipped gear.
     */
    calculateActiveSetBonuses(equippedGear: Record<GearSlot, GearItem | null>): ActiveSetBonus[] {
        // Count pieces per set
        const setCounts: Map<string, { name: string; count: number }> = new Map();

        for (const item of Object.values(equippedGear)) {
            if (item?.setId && item?.setName) {
                const existing = setCounts.get(item.setId);
                if (existing) {
                    existing.count++;
                } else {
                    setCounts.set(item.setId, { name: item.setName, count: 1 });
                }
            }
        }

        // Build active set bonus list
        const activeSetBonuses: ActiveSetBonus[] = [];

        for (const [setId, { name, count }] of setCounts) {
            // Get bonuses for this set (from cache or generate)
            const bonuses = this.bonusCache.get(setId) ?? DEFAULT_BONUSES;

            // Filter to active bonuses (piece threshold met)
            const activeBonuses = bonuses.filter(b => b.pieces <= count);

            activeSetBonuses.push({
                setId,
                setName: name,
                equippedCount: count,
                bonuses,
                activeBonuses,
            });
        }

        // Sort by equipped count descending
        activeSetBonuses.sort((a, b) => b.equippedCount - a.equippedCount);

        return activeSetBonuses;
    }

    /**
     * Format a set bonus effect for display
     */
    formatBonusEffect(effect: SetBonusEffect): string {
        switch (effect.type) {
            case 'stat_bonus':
                return `+${effect.value} ${effect.stat.charAt(0).toUpperCase() + effect.stat.slice(1)}`;
            case 'xp_bonus':
                return `+${effect.percent}% XP`;
            case 'gold_bonus':
                return `+${effect.percent}% Gold`;
            case 'title':
                return `Title: "${effect.title}"`;
            default:
                return 'Unknown bonus';
        }
    }

    /**
     * Clear the bonus cache (useful when settings change)
     */
    clearCache() {
        this.bonusCache.clear();
        this.pendingGenerations.clear();
    }

    /**
     * Clear cache except the first entry (for testing)
     */
    clearCacheExceptFirst() {
        const entries = Array.from(this.bonusCache.entries());
        this.bonusCache.clear();
        this.pendingGenerations.clear();
        if (entries.length > 0) {
            this.bonusCache.set(entries[0][0], entries[0][1]);
        }
    }

    /**
     * Test Gemini generation directly (for settings debugging)
     * Returns the generated bonuses for display
     */
    async testGeneration(setName: string): Promise<{ success: boolean; bonuses?: SetBonus[]; error?: string }> {
        const setId = `test-${setName.toLowerCase().replace(/\s+/g, '-')}`;

        // Clear any existing cache for this test
        this.bonusCache.delete(setId);
        this.pendingGenerations.delete(setId);

        try {
            const bonuses = await this.generateBonuses(setId, setName);
            return { success: true, bonuses };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    /**
     * Get current cache status for debugging
     */
    getCacheStatus(): { cached: number; pending: number; setIds: string[] } {
        return {
            cached: this.bonusCache.size,
            pending: this.pendingGenerations.size,
            setIds: Array.from(this.bonusCache.keys()),
        };
    }
}

// Singleton instance
export const setBonusService = new SetBonusServiceClass();
