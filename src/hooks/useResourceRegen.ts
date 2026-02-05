/**
 * useResourceRegen Hook
 * 
 * Watches for task completions and restores HP/Mana/Stamina.
 * 7% of max HP and Mana restored per task completion.
 * 1 stamina point per task completion.
 * Should be mounted in a top-level component (e.g., QuestBoardView).
 */

import { useEffect, useRef } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { Notice } from 'obsidian';
import { TASK_REGEN_PERCENT } from '../config/combatConfig';

interface UseResourceRegenOptions {
    onSave?: () => void;
}

// Module-level tracker to prevent double-firing when hook is mounted in multiple views
// (both FullKanban and SidebarQuests can be open simultaneously)
let globalLastRegenTaskCount = -1;

/**
 * Hook that watches for task completions and restores HP/Mana/Stamina.
 * Should be mounted in a top-level component (e.g., QuestBoardView).
 * @param options.onSave - Callback to save character after resource restoration
 */
export function useResourceRegen(options: UseResourceRegenOptions = {}): void {
    const { onSave } = options;
    const tasksCompletedToday = useCharacterStore(s => s.character?.tasksCompletedToday ?? 0);
    const restoreResources = useCharacterStore(s => s.restoreResources);
    const awardStamina = useCharacterStore(s => s.awardStamina);
    const character = useCharacterStore(s => s.character);

    // Track if we've initialized the global counter for this session
    const initializedRef = useRef(false);

    useEffect(() => {
        // Skip if no character
        if (!character) return;

        const currentCount = tasksCompletedToday;

        // Initialize global counter on first run (don't restore on mount)
        if (!initializedRef.current) {
            initializedRef.current = true;
            // Only initialize global if it hasn't been set by another instance
            if (globalLastRegenTaskCount < 0) {
                globalLastRegenTaskCount = currentCount;
            }
            return;
        }

        // Skip if we already processed this count (prevents double-fire from multiple views)
        if (currentCount <= globalLastRegenTaskCount) return;

        // Update global tracker
        globalLastRegenTaskCount = currentCount;

        // New task(s) completed! Restore resources and award stamina
        const { restoredHP, restoredMana } = restoreResources(TASK_REGEN_PERCENT);
        awardStamina(); // Uses STAMINA_PER_TASK (1) as default

        if (restoredHP > 0 || restoredMana > 0) {
            new Notice(`⚡ Task power! +${restoredHP} HP, +${restoredMana} Mana, +1 Stamina`, 3000);
            // Persist the change to disk
            onSave?.();
        }
    }, [tasksCompletedToday, character, restoreResources, awardStamina, onSave]);
}
