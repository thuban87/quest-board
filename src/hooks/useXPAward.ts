/**
 * useXPAward Hook
 * 
 * Watches task files for changes and awards XP when tasks are completed.
 * Handles class bonuses, quest completion bonuses, stat gains, and persistence.
 */

import { useEffect, useRef, useCallback } from 'react';
import { App, Vault, Notice, debounce } from 'obsidian';
import { Quest, isManualQuest } from '../models/Quest';
import { Character } from '../models/Character';
import { useCharacterStore } from '../store/characterStore';
import { useQuestStore } from '../store/questStore';
import { readTasksFromFile, getTaskCompletion, Task, TaskCompletion } from '../services/TaskFileService';
import { calculateXPWithBonus, checkLevelUp, getLevelUpMessage } from '../services/XPSystem';
import { processXPForStats, applyLevelUpStats, STAT_NAMES } from '../services/StatsService';
import { AchievementService } from '../services/AchievementService';
import { showAchievementUnlock } from '../modals/AchievementUnlockModal';
import { LevelUpModal } from '../modals/LevelUpModal';

interface UseXPAwardOptions {
    app: App;
    vault: Vault;
    badgeFolder?: string;
    customStatMappings?: Record<string, string>;
    onCategoryUsed?: (category: string) => void;
    onSaveCharacter: () => Promise<void>;
}

interface TaskSnapshot {
    questId: string;
    filePath: string;
    tasks: Task[];
    completion: TaskCompletion;
}

/**
 * Hook to watch task files and award XP on completion
 */
export function useXPAward({ app, vault, badgeFolder = 'Life/Quest Board/assets/badges', customStatMappings, onCategoryUsed, onSaveCharacter }: UseXPAwardOptions) {
    // Store previous task snapshots
    const taskSnapshotsRef = useRef<Map<string, TaskSnapshot>>(new Map());
    const fileWatchersRef = useRef<Map<string, () => void>>(new Map());

    const character = useCharacterStore((state) => state.character);
    const achievements = useCharacterStore((state) => state.achievements);
    const addXP = useCharacterStore((state) => state.addXP);
    const graduate = useCharacterStore((state) => state.graduate);
    const quests = useQuestStore((state) => state.quests);

    // Award XP for completed tasks
    const awardXPForTasks = useCallback(async (
        quest: Quest,
        oldSnapshot: TaskSnapshot | undefined,
        newTasks: Task[]
    ) => {
        if (!character) return;
        if (!isManualQuest(quest)) return;

        const newCompletion = getTaskCompletion(newTasks);
        const oldCompleted = oldSnapshot?.completion.completed || 0;
        const newlyCompleted = newCompletion.completed - oldCompleted;

        if (newlyCompleted <= 0) return;

        // Calculate XP with class bonus
        const baseXP = quest.xpPerTask * newlyCompleted;
        const totalXP = calculateXPWithBonus(baseXP, quest.category, character);

        // Track old level for level-up detection
        const oldXP = character.isTrainingMode ? character.trainingXP : character.totalXP;
        const oldLevel = character.isTrainingMode ? character.trainingLevel : character.level;

        // Award XP (this updates the store)
        addXP(totalXP);

        // Process stat gains from XP (only if not in training mode)
        // IMPORTANT: Get the updated character AFTER addXP to avoid overwriting XP changes
        if (!character.isTrainingMode) {
            const updatedCharacter = useCharacterStore.getState().character;
            console.log('[Stats Debug] Processing stat gains:', {
                category: quest.category,
                xpGained: totalXP,
                isTrainingMode: character.isTrainingMode,
                hasUpdatedCharacter: !!updatedCharacter,
                customMappings: customStatMappings,
            });

            if (updatedCharacter) {
                const statResult = processXPForStats(updatedCharacter, quest.category, totalXP, customStatMappings);
                console.log('[Stats Debug] Stat result:', {
                    statGained: statResult.statGained,
                    newStatValue: statResult.newStatValue,
                    characterChanged: statResult.character !== updatedCharacter,
                    categoryAccum: statResult.character.categoryXPAccumulator,
                    statBonuses: statResult.character.statBonuses,
                });

                if (statResult.statGained) {
                    // Update character with new stat bonuses (preserves XP from addXP)
                    useCharacterStore.getState().setCharacter(statResult.character);
                    new Notice(
                        `💪 +1 ${STAT_NAMES[statResult.statGained]}! (now ${statResult.newStatValue})`,
                        3000
                    );
                } else if (statResult.character !== updatedCharacter) {
                    // Accumulator updated, save it
                    console.log('[Stats Debug] Saving updated accumulator');
                    useCharacterStore.getState().setCharacter(statResult.character);
                }
            }
        } else {
            console.log('[Stats Debug] Skipping stat processing - training mode');
        }

        // Track category for autocomplete in settings
        if (quest.category && onCategoryUsed) {
            onCategoryUsed(quest.category.toLowerCase().trim());
        }

        // Show notification
        const bonusApplied = totalXP > baseXP;
        new Notice(
            `⭐ +${totalXP} XP${bonusApplied ? ' (class bonus!)' : ''} for ${newlyCompleted} task${newlyCompleted > 1 ? 's' : ''}`,
            3000
        );

        // Check for level up
        const newXP = oldXP + totalXP;
        const levelResult = checkLevelUp(oldXP, newXP, character.isTrainingMode);
        if (levelResult.didLevelUp) {
            // Apply level-up stat gains (non-training only)
            if (!character.isTrainingMode) {
                const currentChar = useCharacterStore.getState().character;
                if (currentChar) {
                    const updatedChar = applyLevelUpStats(currentChar);
                    useCharacterStore.getState().setCharacter(updatedChar);
                }
            }

            // Show level-up modal
            const modal = new LevelUpModal(
                app,
                character.class,
                levelResult.newLevel,
                levelResult.tierChanged,
                character.isTrainingMode,
                () => {
                    // Graduation callback
                    graduate();
                    onSaveCharacter();
                    new Notice('🎓 Congratulations! You are now Level 1!', 5000);
                }
            );
            modal.open();

            // Check for level achievements (after level-up)
            if (!character.isTrainingMode) {
                const achievementService = new AchievementService(vault, badgeFolder);
                const levelCheck = achievementService.checkLevelAchievements(achievements, levelResult.newLevel);

                // Show unlock popups for each new achievement (with delay)
                levelCheck.newlyUnlocked.forEach((achievement, index) => {
                    setTimeout(() => {
                        showAchievementUnlock(app, achievement, badgeFolder);
                        // Award achievement bonus XP
                        if (achievement.xpBonus > 0) {
                            addXP(achievement.xpBonus);
                        }
                    }, 1500 + (index * 1000)); // Stagger popups
                });
            }
        }

        // Check for quest completion
        if (newCompletion.completed === newCompletion.total && newCompletion.total > 0) {
            // Award completion bonus
            const completionBonus = calculateXPWithBonus(quest.completionBonus, quest.category, character);
            addXP(completionBonus);
            new Notice(`🎉 Quest Complete! +${completionBonus} bonus XP!`, 4000);

            // Check for quest count achievements
            const achievementService = new AchievementService(vault, badgeFolder);
            const questCountCheck = achievementService.checkQuestCountAchievements(achievements, 1); // TODO: track total quest count

            // Check for category-specific achievements (category_count type)
            const categoryCountCheck = achievementService.checkCategoryCountAchievements(
                achievements,
                quest.category,
                1 // TODO: track category counts properly
            );

            // Show unlock popups for quest count achievements
            questCountCheck.newlyUnlocked.forEach((achievement, index) => {
                setTimeout(() => {
                    showAchievementUnlock(app, achievement, badgeFolder);
                    if (achievement.xpBonus > 0) {
                        addXP(achievement.xpBonus);
                    }
                }, 2000 + (index * 1000));
            });

            // Show unlock popups for category achievements
            categoryCountCheck.newlyUnlocked.forEach((achievement, index) => {
                setTimeout(() => {
                    showAchievementUnlock(app, achievement, badgeFolder);
                    if (achievement.xpBonus > 0) {
                        addXP(achievement.xpBonus);
                    }
                }, 3000 + questCountCheck.newlyUnlocked.length * 1000 + (index * 1000));
            });
        }

        // Persist character
        await onSaveCharacter();
    }, [character, achievements, addXP, graduate, onSaveCharacter, app, vault, badgeFolder]);

    // Track which quests are currently being processed
    const processingRef = useRef<Set<string>>(new Set());

    // Check a single task file for changes
    const checkTaskFile = useCallback(async (quest: Quest) => {
        if (!isManualQuest(quest) || !quest.linkedTaskFile) return;

        // Prevent concurrent processing of the same quest
        if (processingRef.current.has(quest.questId)) {
            console.log('[XP Debug] Already processing quest:', quest.questId);
            return;
        }
        processingRef.current.add(quest.questId);

        try {
            const result = await readTasksFromFile(vault, quest.linkedTaskFile);
            if (!result.success) return;

            const oldSnapshot = taskSnapshotsRef.current.get(quest.questId);

            // Award XP if tasks changed
            await awardXPForTasks(quest, oldSnapshot, result.tasks);

            // Update snapshot
            taskSnapshotsRef.current.set(quest.questId, {
                questId: quest.questId,
                filePath: quest.linkedTaskFile,
                tasks: result.tasks,
                completion: getTaskCompletion(result.tasks),
            });
        } finally {
            processingRef.current.delete(quest.questId);
        }
    }, [vault, awardXPForTasks]);

    // Set up file watchers for all quest task files
    useEffect(() => {
        if (!quests) return;

        // Track which files we need to watch
        const watchedFiles = new Set<string>();

        for (const quest of quests.values()) {
            if (!isManualQuest(quest) || !quest.linkedTaskFile) continue;

            const filePath = quest.linkedTaskFile;
            watchedFiles.add(filePath);

            // Skip if already watching
            if (fileWatchersRef.current.has(filePath)) continue;

            // Initialize snapshot ONLY if we don't have one yet
            if (!taskSnapshotsRef.current.has(quest.questId)) {
                readTasksFromFile(vault, filePath).then((result) => {
                    if (result.success && !taskSnapshotsRef.current.has(quest.questId)) {
                        taskSnapshotsRef.current.set(quest.questId, {
                            questId: quest.questId,
                            filePath,
                            tasks: result.tasks,
                            completion: getTaskCompletion(result.tasks),
                        });
                    }
                });
            }

            // Set up file watcher - debounce without immediate fire
            const debouncedCheck = debounce(() => {
                const currentQuest = useQuestStore.getState().quests.get(quest.questId);
                if (currentQuest) {
                    checkTaskFile(currentQuest);
                }
            }, 300, false);  // false = don't fire immediately

            const onModify = vault.on('modify', (file) => {
                if (file.path === filePath) {
                    debouncedCheck();
                }
            });

            fileWatchersRef.current.set(filePath, () => {
                vault.offref(onModify);
            });
        }

        // Clean up watchers for files we no longer need
        for (const [filePath, unsubscribe] of fileWatchersRef.current) {
            if (!watchedFiles.has(filePath)) {
                unsubscribe();
                fileWatchersRef.current.delete(filePath);
            }
        }

        // Cleanup on unmount
        return () => {
            for (const unsubscribe of fileWatchersRef.current.values()) {
                unsubscribe();
            }
            fileWatchersRef.current.clear();
        };
    }, [quests, vault, checkTaskFile]);

    return {
        // Expose for manual refresh if needed
        checkTaskFile,
    };
}
