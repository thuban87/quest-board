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
import {
    evaluateTriggers,
    grantPowerUp,
    expirePowerUps,
    EFFECT_DEFINITIONS,
    rollFromPool,
    TriggerContext,
} from '../services/PowerUpService';

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

// ============================================
// MODULE-LEVEL SINGLETONS
// These are shared across ALL hook instances to prevent duplicate file watchers
// when multiple components (Kanban + Sidebar) use the hook simultaneously.
// ============================================
const globalTaskSnapshots = new Map<string, TaskSnapshot>();
const globalFileWatchers = new Map<string, () => void>();
const globalProcessing = new Set<string>();
let subscriberCount = 0;

/**
 * Hook to watch task files and award XP on completion
 */
export function useXPAward({ app, vault, badgeFolder = 'Life/Quest Board/assets/badges', customStatMappings, onCategoryUsed, onSaveCharacter }: UseXPAwardOptions) {
    // Use refs that point to the global singletons (for React pattern compatibility)
    const taskSnapshotsRef = useRef(globalTaskSnapshots);
    const fileWatchersRef = useRef(globalFileWatchers);
    const processingRef = useRef(globalProcessing);

    const character = useCharacterStore((state) => state.character);
    const achievements = useCharacterStore((state) => state.achievements);
    const addXP = useCharacterStore((state) => state.addXP);
    const graduate = useCharacterStore((state) => state.graduate);
    const setPowerUps = useCharacterStore((state) => state.setPowerUps);
    const incrementTasksToday = useCharacterStore((state) => state.incrementTasksToday);
    const quests = useQuestStore((state) => state.quests);

    // Track subscriber count for proper cleanup
    useEffect(() => {
        subscriberCount++;
        console.log('[XP Debug] useXPAward subscriber mounted, count:', subscriberCount);

        return () => {
            subscriberCount--;
            console.log('[XP Debug] useXPAward subscriber unmounted, count:', subscriberCount);

            // Only cleanup watchers when the LAST subscriber unmounts
            if (subscriberCount === 0) {
                console.log('[XP Debug] Last subscriber unmounted, cleaning up all file watchers');
                for (const unsubscribe of globalFileWatchers.values()) {
                    unsubscribe();
                }
                globalFileWatchers.clear();
                globalTaskSnapshots.clear();
                globalProcessing.clear();
            }
        };
    }, []);

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

        // Get today's date in local timezone (YYYY-MM-DD format for reliable comparison)
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

        // Check if this is first task of day using persisted character data
        const isNewDay = character.lastTaskDate !== today;
        const currentTaskCount = isNewDay ? 0 : (character.tasksCompletedToday ?? 0);
        const isFirstTaskOfDay = currentTaskCount === 0;

        // Increment the persisted counter (will be saved with character)
        incrementTasksToday(newlyCompleted, today);

        // === TASK COMPLETION TRIGGERS ===
        // Expire old power-ups first
        let currentPowerUps = expirePowerUps(character.activePowerUps ?? []);

        // Build context for trigger evaluation
        const taskContext: TriggerContext = {
            isFirstTaskOfDay,
            tasksCompletedToday: currentTaskCount + newlyCompleted,
            taskCategory: quest.category,
            taskXP: quest.xpPerTask * newlyCompleted,
        };

        console.log('[PowerUp Debug] Task completion trigger context:', {
            isFirstTaskOfDay,
            tasksCompletedToday: currentTaskCount + newlyCompleted,
            taskCategory: quest.category,
            existingPowerUps: character.activePowerUps?.length ?? 0,
            lastTaskDate: character.lastTaskDate,
            today,
        });

        // Evaluate task_completion triggers
        const taskTriggers = evaluateTriggers('task_completion', taskContext);
        console.log('[PowerUp Debug] Triggers that fired:', taskTriggers.map(t => t.id));

        for (const trigger of taskTriggers) {
            const effectId = trigger.grantsEffect ?? (trigger.grantsTier ? rollFromPool(trigger.grantsTier) : null);
            console.log('[PowerUp Debug] Processing trigger:', trigger.id, 'effectId:', effectId);
            if (effectId) {
                const result = grantPowerUp(currentPowerUps, effectId, trigger.id);
                console.log('[PowerUp Debug] Grant result:', { granted: !!result.granted, powerUpsCount: result.powerUps.length });
                if (result.granted) {
                    currentPowerUps = result.powerUps;
                    const effectDef = EFFECT_DEFINITIONS[effectId];
                    // Show notification
                    if (effectDef?.notificationType === 'toast' || effectDef?.notificationType === 'modal') {
                        new Notice(`${result.granted.icon} ${result.granted.name}: ${result.granted.description}`, 4000);
                    }
                }
            }
        }

        // Save power-ups if any changed
        console.log('[PowerUp Debug] Saving power-ups:', currentPowerUps.length);
        if (currentPowerUps !== (character.activePowerUps ?? [])) {
            setPowerUps(currentPowerUps);
            // Trigger immediate status bar update
            import('../services/StatusBarService').then(({ statusBarService }) => {
                statusBarService.update();
            });
        }

        // Calculate XP with class bonus
        const baseXP = quest.xpPerTask * newlyCompleted;
        const totalXP = calculateXPWithBonus(baseXP, quest.category, character);

        // Track old level for level-up detection
        const oldXP = character.isTrainingMode ? character.trainingXP : character.totalXP;
        const oldLevel = character.isTrainingMode ? character.trainingLevel : character.level;

        console.log('[XP Debug] Task XP award:', {
            baseXP,
            totalXP,
            xpPerTask: quest.xpPerTask,
            newlyCompleted,
            oldXP,
            oldLevel,
            isTrainingMode: character.isTrainingMode,
        });

        // Award XP (this updates the store)
        addXP(totalXP);
        console.log('[XP Debug] Called addXP for tasks:', totalXP);

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
                    // IMPORTANT: Persist the updated baseStats to settings
                    onSaveCharacter();
                }
            }

            // === XP AWARD TRIGGERS (Level Up / Tier Up) ===
            const xpAwardContext: TriggerContext = {
                didLevelUp: true,
                didTierUp: levelResult.tierChanged,
                newLevel: levelResult.newLevel,
            };

            // Evaluate xp_award triggers
            const xpTriggers = evaluateTriggers('xp_award', xpAwardContext);
            let lvlPowerUps = expirePowerUps(useCharacterStore.getState().character?.activePowerUps ?? []);

            for (const trigger of xpTriggers) {
                const effectId = trigger.grantsEffect ?? (trigger.grantsTier ? rollFromPool(trigger.grantsTier) : null);
                if (effectId) {
                    const result = grantPowerUp(lvlPowerUps, effectId, trigger.id);
                    if (result.granted) {
                        lvlPowerUps = result.powerUps;
                        const effectDef = EFFECT_DEFINITIONS[effectId];
                        // Show notification (slightly delayed so it shows after level-up modal)
                        setTimeout(() => {
                            if (effectDef?.notificationType === 'toast' || effectDef?.notificationType === 'modal') {
                                new Notice(`${result.granted!.icon} ${result.granted!.name}: ${result.granted!.description}`, 5000);
                            }
                        }, 500);
                    }
                }
            }

            // Save power-ups if any triggered
            if (xpTriggers.length > 0) {
                setPowerUps(lvlPowerUps);
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

                // IMPORTANT: Save modified achievements back to store (preserves unlock state)
                if (levelCheck.newlyUnlocked.length > 0) {
                    useCharacterStore.setState({ achievements: [...achievements] });
                }
            }
        }

        // Check for quest completion
        const wasAlreadyComplete = oldSnapshot && oldSnapshot.completion.completed === oldSnapshot.completion.total && oldSnapshot.completion.total > 0;
        const isNowComplete = newCompletion.completed === newCompletion.total && newCompletion.total > 0;

        console.log('[XP Debug] Quest completion check:', {
            wasAlreadyComplete,
            isNowComplete,
            shouldAwardBonus: isNowComplete, // ORIGINAL LOGIC - no wasAlreadyComplete check
            completionBonus: quest.completionBonus,
        });

        if (isNowComplete) {
            // Award completion bonus (ORIGINAL LOGIC)
            const completionBonus = calculateXPWithBonus(quest.completionBonus, quest.category, character);
            console.log('[XP Debug] Awarding quest completion bonus:', completionBonus);
            addXP(completionBonus);
            new Notice(`🎉 Quest Complete! +${completionBonus} bonus XP!`, 4000);

            // Check for level-up from quest completion bonus
            // Get current state AFTER the addXP call
            const postBonusChar = useCharacterStore.getState().character;
            if (postBonusChar) {
                const postBonusXP = postBonusChar.isTrainingMode ? postBonusChar.trainingXP : postBonusChar.totalXP;
                // Use XP before completion bonus as the "old" value for comparison
                const preCompletionXP = postBonusXP - completionBonus;
                const bonusLevelResult = checkLevelUp(preCompletionXP, postBonusXP, postBonusChar.isTrainingMode);

                console.log('[XP Debug] Quest completion level-up check:', {
                    preCompletionXP,
                    postBonusXP,
                    didLevelUp: bonusLevelResult.didLevelUp,
                    oldLevel: bonusLevelResult.oldLevel,
                    newLevel: bonusLevelResult.newLevel,
                });

                if (bonusLevelResult.didLevelUp) {
                    // Apply level-up stat gains (non-training only)
                    if (!postBonusChar.isTrainingMode) {
                        const currentChar = useCharacterStore.getState().character;
                        if (currentChar) {
                            const updatedChar = applyLevelUpStats(currentChar);
                            useCharacterStore.getState().setCharacter(updatedChar);
                            onSaveCharacter();
                        }
                    }

                    // Show level-up modal
                    const modal = new LevelUpModal(
                        app,
                        postBonusChar.class,
                        bonusLevelResult.newLevel,
                        bonusLevelResult.tierChanged,
                        postBonusChar.isTrainingMode,
                        () => {
                            graduate();
                            onSaveCharacter();
                            new Notice('🎓 Congratulations! You are now Level 1!', 5000);
                        }
                    );
                    modal.open();
                }
            }

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

            // IMPORTANT: Save modified achievements back to store (preserves unlock state)
            // The checkXxxAchievements methods mutate the array in-place
            if (questCountCheck.newlyUnlocked.length > 0 || categoryCountCheck.newlyUnlocked.length > 0) {
                useCharacterStore.setState({ achievements: [...achievements] });
            }
        }

        // Persist character
        await onSaveCharacter();
    }, [character, achievements, addXP, graduate, setPowerUps, onSaveCharacter, app, vault, badgeFolder]);

    // processingRef now points to globalProcessing (defined at module level)

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
