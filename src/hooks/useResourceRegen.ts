/**
 * useResourceRegen Hook
 * 
 * Watches for task completions and restores HP/Mana.
 * 7% of max HP and Mana restored per task completion.
 * Should be mounted in a top-level component (e.g., QuestBoardView).
 */

import { useEffect, useRef } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { Notice } from 'obsidian';
import { TASK_REGEN_PERCENT } from '../config/combatConfig';

/**
 * Hook that watches for task completions and restores HP/Mana.
 * Should be mounted in a top-level component (e.g., QuestBoardView).
 */
export function useResourceRegen(): void {
    const tasksCompletedToday = useCharacterStore(s => s.character?.tasksCompletedToday ?? 0);
    const restoreResources = useCharacterStore(s => s.restoreResources);
    const character = useCharacterStore(s => s.character);

    // Track previous task count to detect new completions
    const prevTaskCountRef = useRef(tasksCompletedToday);

    useEffect(() => {
        // Skip on initial mount and if no character
        if (!character) return;

        const prevCount = prevTaskCountRef.current;
        const currentCount = tasksCompletedToday;

        // Update ref for next comparison
        prevTaskCountRef.current = currentCount;

        // Skip if count didn't increase (could be reset on new day or initial load)
        if (currentCount <= prevCount) return;

        // New task(s) completed! Restore resources
        const { restoredHP, restoredMana } = restoreResources(TASK_REGEN_PERCENT);

        if (restoredHP > 0 || restoredMana > 0) {
            new Notice(`⚡ Task power! +${restoredHP} HP, +${restoredMana} Mana`, 3000);
        }
    }, [tasksCompletedToday, character, restoreResources]);
}
