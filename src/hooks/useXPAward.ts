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
import { checkAndUnlockSkills } from '../services/SkillService';
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
export function useXPAward({ app, vault, customStatMappings, onCategoryUsed, onSaveCharacter }: UseXPAwardOptions) {
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
    const unlockSkills = useCharacterStore((state) => state.unlockSkills);
    const quests = useQuestStore((state) => state.quests);

    // Track subscriber count for proper cleanup
    useEffect(() => {
        subscriberCount++;

        return () => {
            subscriberCount--;

            // Only cleanup watchers when the LAST subscriber unmounts
            if (subscriberCount === 0) {
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
        const now = new Date();

        // Calculate days inactive (difference between last task date and today)
        let daysInactive = 0;
        if (character.lastTaskDate) {
            const lastDate = new Date(character.lastTaskDate + 'T00:00:00');
            const todayDate = new Date(today + 'T00:00:00');
            daysInactive = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Build category count for today from activity history
        const categoryCountToday: Record<string, number> = {};
        const categoriesSet = new Set<string>();
        let tasksInLastHour = 0;
        const oneHourAgo = now.getTime() - (60 * 60 * 1000);

        // Scan activity history for today's stats
        for (const event of character.activityHistory || []) {
            if (event.date === today && event.type === 'quest_complete') {
                // Count categories
                if (event.category) {
                    const cat = event.category.toLowerCase();
                    categoryCountToday[cat] = (categoryCountToday[cat] || 0) + 1;
                    categoriesSet.add(cat);
                }

                // Count tasks in last hour
                if (event.timestamp) {
                    const eventTime = new Date(event.timestamp).getTime();
                    if (eventTime >= oneHourAgo) {
                        tasksInLastHour++;
                    }
                }
            }
        }

        // Add current task to counts (it's about to be completed)
        const currentCategory = quest.category?.toLowerCase();
        if (currentCategory) {
            categoryCountToday[currentCategory] = (categoryCountToday[currentCategory] || 0) + newlyCompleted;
            categoriesSet.add(currentCategory);
        }
        tasksInLastHour += newlyCompleted;  // Current task counts toward hat trick

        const taskContext: TriggerContext = {
            isFirstTaskOfDay,
            tasksCompletedToday: currentTaskCount + newlyCompleted,
            taskCategory: quest.category,
            currentHour: now.getHours(),  // For Early Riser (<8) and Night Owl (>=22)
            categoryCountToday,           // For Combo Breaker
            categoriesCompletedToday: Array.from(categoriesSet), // For task-level tracking
            tasksInLastHour,              // Legacy: kept until Session 2 wires quest-level context
            daysInactive,                 // For Phoenix
        };

        // Evaluate task_completion triggers
        const taskTriggers = evaluateTriggers('task_completion', taskContext);

        for (const trigger of taskTriggers) {
            const effectId = trigger.grantsEffect ?? (trigger.grantsTier ? rollFromPool(trigger.grantsTier) : null);
            if (effectId) {
                const result = grantPowerUp(currentPowerUps, effectId, trigger.id);
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

        // Award XP (this updates the store)
        addXP(totalXP);

        // Process stat gains from XP (only if not in training mode)
        // IMPORTANT: Get the updated character AFTER addXP to avoid overwriting XP changes
        if (!character.isTrainingMode) {
            const updatedCharacter = useCharacterStore.getState().character;

            if (updatedCharacter) {
                const statResult = processXPForStats(updatedCharacter, quest.category, totalXP, customStatMappings);

                if (statResult.statGained) {
                    // Update character with new stat bonuses (preserves XP from addXP)
                    useCharacterStore.getState().setCharacter(statResult.character);
                    new Notice(
                        `💪 +1 ${STAT_NAMES[statResult.statGained]}! (now ${statResult.newStatValue})`,
                        3000
                    );
                } else if (statResult.character !== updatedCharacter) {
                    // Accumulator updated, save it
                    useCharacterStore.getState().setCharacter(statResult.character);
                }
            }
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

            // Phase 7: Check for skill unlocks (non-training only)
            let unlockedSkills: import('../models/Skill').Skill[] = [];
            if (!character.isTrainingMode) {
                const currentChar = useCharacterStore.getState().character;
                if (currentChar) {
                    const skillResult = checkAndUnlockSkills(
                        currentChar.class,
                        levelResult.oldLevel,
                        levelResult.newLevel,
                        currentChar.skills?.unlocked ?? []
                    );
                    if (skillResult.newlyUnlocked.length > 0) {
                        unlockSkills(skillResult.newlyUnlocked.map(s => s.id));
                        onSaveCharacter();
                        unlockedSkills = skillResult.newlyUnlocked;
                    }
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
                },
                unlockedSkills  // Pass unlocked skills to modal
            );
            modal.open();

            // Check for level achievements (after level-up)
            if (!character.isTrainingMode) {
                const achievementService = new AchievementService(vault);
                const levelCheck = achievementService.checkLevelAchievements(achievements, levelResult.newLevel);

                // Show unlock popups for each new achievement (with delay)
                levelCheck.newlyUnlocked.forEach((achievement, index) => {
                    setTimeout(() => {
                        showAchievementUnlock(app, achievement);
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

        if (isNowComplete) {
            // Award completion bonus (ORIGINAL LOGIC)
            const completionBonus = calculateXPWithBonus(quest.completionBonus, quest.category, character);
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

                    // Phase 7: Check for skill unlocks (non-training only)
                    let bonusUnlockedSkills: import('../models/Skill').Skill[] = [];
                    if (!postBonusChar.isTrainingMode) {
                        const currentChar = useCharacterStore.getState().character;
                        if (currentChar) {
                            const skillResult = checkAndUnlockSkills(
                                currentChar.class,
                                bonusLevelResult.oldLevel,
                                bonusLevelResult.newLevel,
                                currentChar.skills?.unlocked ?? []
                            );
                            if (skillResult.newlyUnlocked.length > 0) {
                                unlockSkills(skillResult.newlyUnlocked.map(s => s.id));
                                onSaveCharacter();
                                bonusUnlockedSkills = skillResult.newlyUnlocked;
                            }
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
                        },
                        bonusUnlockedSkills  // Pass unlocked skills to modal
                    );
                    modal.open();
                }
            }

            // Check for quest count achievements
            const achievementService = new AchievementService(vault);
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
                    showAchievementUnlock(app, achievement);
                    if (achievement.xpBonus > 0) {
                        addXP(achievement.xpBonus);
                    }
                }, 2000 + (index * 1000));
            });

            // Show unlock popups for category achievements
            categoryCountCheck.newlyUnlocked.forEach((achievement, index) => {
                setTimeout(() => {
                    showAchievementUnlock(app, achievement);
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
    }, [character, achievements, addXP, graduate, setPowerUps, onSaveCharacter, app, vault]);

    // processingRef now points to globalProcessing (defined at module level)

    // Check a single task file for changes
    const checkTaskFile = useCallback(async (quest: Quest) => {
        if (!isManualQuest(quest) || !quest.linkedTaskFile) return;

        // Prevent concurrent processing of the same quest
        if (processingRef.current.has(quest.questId)) {
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
