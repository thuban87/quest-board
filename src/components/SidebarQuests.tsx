/**
 * SidebarQuests Component
 * 
 * Focused sidebar with stacked quest cards (no Completed).
 * Collapsible sections for each status.
 * Tab navigation between Quests and Character Sheet.
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { App as ObsidianApp } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { QuestStatus } from '../models/QuestStatus';
import { Quest, isAIGeneratedQuest, isManualQuest } from '../models/Quest';
import { useQuestStore } from '../store/questStore';
import { useCharacterStore } from '../store/characterStore';
import { loadAllQuests, watchQuestFolder, saveManualQuest, saveAIQuest } from '../services/QuestService';
import { readTasksWithSections, readTasksFromMultipleFiles, getTaskCompletion, TaskCompletion, TaskSection, toggleTaskInFile } from '../services/TaskFileService';
import { getXPProgress, TRAINING_XP_THRESHOLDS } from '../services/XPSystem';
import { AchievementService } from '../services/AchievementService';
import { QuestCard } from './QuestCard';
import { CharacterSheet } from './CharacterSheet';
import { AchievementsSidebar } from './AchievementsSidebar';
import { CLASS_INFO, getTrainingLevelDisplay } from '../models/Character';
import { useXPAward } from '../hooks/useXPAward';
import { useTaskSectionsStore } from '../store/taskSectionsStore';
import {
    DndContext,
    DragEndEvent,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface SidebarQuestsProps {
    plugin: QuestBoardPlugin;
    app: ObsidianApp;
}

type SidebarView = 'quests' | 'character' | 'achievements';

/**
 * Sections to show (no Completed)
 */
const SECTIONS: { status: QuestStatus; title: string; emoji: string }[] = [
    { status: QuestStatus.AVAILABLE, title: 'Available', emoji: '📋' },
    { status: QuestStatus.ACTIVE, title: 'Active', emoji: '⚡' },
    { status: QuestStatus.IN_PROGRESS, title: 'In Progress', emoji: '🔨' },
];

/**
 * Droppable section wrapper for sidebar
 */
const DroppableSection: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div ref={setNodeRef} style={{ opacity: isOver ? 0.8 : 1 }}>
            {children}
        </div>
    );
};

/**
 * Draggable card wrapper for sidebar
 */
const DraggableSidebarCard: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 }
        : undefined;
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
};

export const SidebarQuests: React.FC<SidebarQuestsProps> = ({ plugin, app }) => {
    const { setQuests, upsertQuest, loading, setLoading, setError } = useQuestStore();
    const character = useCharacterStore((state) => state.character);
    const setCharacter = useCharacterStore((state) => state.setCharacter);
    const setInventoryAndAchievements = useCharacterStore((state) => state.setInventoryAndAchievements);

    // Current view (quests or character sheet)
    const [currentView, setCurrentView] = useState<SidebarView>('quests');

    // Collapsed state for sections
    const [collapsed, setCollapsed] = useState<Record<QuestStatus, boolean>>({
        [QuestStatus.AVAILABLE]: false,
        [QuestStatus.ACTIVE]: false,
        [QuestStatus.IN_PROGRESS]: false,
        [QuestStatus.COMPLETED]: true,
    });

    // Collapsed state for individual quests
    const [collapsedQuests, setCollapsedQuests] = useState<Set<string>>(new Set());

    // Lock to prevent file watcher from reloading during save operations
    const saveLockRef = useRef(false);

    // Toggle quest collapse
    const toggleQuestCollapse = useCallback((questId: string) => {
        setCollapsedQuests(prev => {
            const next = new Set(prev);
            if (next.has(questId)) {
                next.delete(questId);
            } else {
                next.add(questId);
            }
            return next;
        });
    }, []);

    // Task sections and progress from shared store
    const sectionsMap = useTaskSectionsStore((state) => state.sectionsMap);
    const taskProgressMap = useTaskSectionsStore((state) => state.progressMap);
    const setSections = useTaskSectionsStore((state) => state.setSections);
    const setAllSections = useTaskSectionsStore((state) => state.setAllSections);

    // Save character callback
    const handleSaveCharacter = useCallback(async () => {
        const currentCharacter = useCharacterStore.getState().character;
        const currentInventory = useCharacterStore.getState().inventory;
        const currentAchievements = useCharacterStore.getState().achievements;
        plugin.settings.character = currentCharacter;
        plugin.settings.inventory = currentInventory;
        plugin.settings.achievements = currentAchievements;
        await plugin.saveSettings();
    }, [plugin]);

    // XP Award hook  
    useXPAward({
        app,
        vault: app.vault,
        badgeFolder: plugin.settings.badgeFolder,
        customStatMappings: plugin.settings.categoryStatMappings,
        onCategoryUsed: async (category) => {
            // Auto-populate knownCategories for settings autocomplete
            if (!plugin.settings.knownCategories) {
                plugin.settings.knownCategories = [];
            }
            if (!plugin.settings.knownCategories.includes(category)) {
                plugin.settings.knownCategories.push(category);
                await plugin.saveSettings();
            }
        },
        onSaveCharacter: handleSaveCharacter,
    });

    // Load character on mount (run once)
    const initializedRef = useRef(false);
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        if (plugin.settings.character) {
            setCharacter(plugin.settings.character);
        }
        // Initialize achievements with defaults (merges saved state with default achievements)
        const achievementService = new AchievementService(app.vault, plugin.settings.badgeFolder);
        const savedAchievements = plugin.settings.achievements || [];
        const initializedAchievements = achievementService.initializeAchievements(savedAchievements);
        setInventoryAndAchievements(
            plugin.settings.inventory || [],
            initializedAchievements
        );
    }, []);

    // Load quests on mount
    useEffect(() => {
        const loadQuests = async () => {
            setLoading(true);
            try {
                const result = await loadAllQuests(app.vault, plugin.settings.storageFolder);
                setQuests(result.quests);

                const progressMap: Record<string, TaskCompletion> = {};
                const allSectionsMap: Record<string, TaskSection[]> = {};

                for (const quest of result.quests) {
                    if (isManualQuest(quest) && quest.linkedTaskFile) {
                        const taskResult = await readTasksFromMultipleFiles(app.vault, quest.linkedTaskFile, quest.linkedTaskFiles);
                        if (taskResult.success) {
                            progressMap[quest.questId] = getTaskCompletion(taskResult.allTasks);
                            allSectionsMap[quest.questId] = taskResult.sections;
                        }
                    }
                }
                setAllSections(allSectionsMap, progressMap);
            } catch (error) {
                setError(`Failed to load quests: ${error}`);
            }
            setLoading(false);
        };

        loadQuests();

        const unsubscribe = watchQuestFolder(app.vault, plugin.settings.storageFolder, async (result) => {
            // Skip reload if we're in the middle of saving (prevents race condition)
            if (saveLockRef.current) {
                console.log('[Quest Watch] Skipping reload - save in progress');
                return;
            }

            setQuests(result.quests);

            const progressMap: Record<string, TaskCompletion> = {};
            const allSectionsMap: Record<string, TaskSection[]> = {};

            for (const quest of result.quests) {
                if (isManualQuest(quest) && quest.linkedTaskFile) {
                    const taskResult = await readTasksFromMultipleFiles(app.vault, quest.linkedTaskFile, quest.linkedTaskFiles);
                    if (taskResult.success) {
                        progressMap[quest.questId] = getTaskCompletion(taskResult.allTasks);
                        allSectionsMap[quest.questId] = taskResult.sections;
                    }
                }
            }
            setAllSections(allSectionsMap, progressMap);
        });

        return () => unsubscribe();
    }, [app.vault, plugin.settings.storageFolder, setQuests, setLoading, setError]);

    // Handle task toggle
    const handleToggleTask = useCallback(async (questId: string, lineNumber: number) => {
        const quest = useQuestStore.getState().quests.get(questId);
        if (!quest || !isManualQuest(quest) || !quest.linkedTaskFile) return;

        const success = await toggleTaskInFile(app.vault, quest.linkedTaskFile, lineNumber);
        if (!success) return;

        const taskResult = await readTasksFromMultipleFiles(app.vault, quest.linkedTaskFile, quest.linkedTaskFiles);
        if (taskResult.success) {
            setSections(questId, taskResult.sections, getTaskCompletion(taskResult.allTasks));
        }
    }, [app.vault, setSections]);

    // Handle quest move
    const handleMoveQuest = useCallback(async (questId: string, newStatus: QuestStatus) => {
        const quest = useQuestStore.getState().quests.get(questId);
        if (!quest) return;

        const updatedQuest: Quest = {
            ...quest,
            status: newStatus,
            completedDate: newStatus === QuestStatus.COMPLETED
                ? new Date().toISOString()
                : quest.completedDate,
        };

        // Update store first (optimistic update)
        upsertQuest(updatedQuest);

        // Set lock to prevent file watcher from overwriting during save
        saveLockRef.current = true;

        try {
            if (isAIGeneratedQuest(updatedQuest)) {
                await saveAIQuest(app.vault, plugin.settings.storageFolder, updatedQuest);
            } else {
                await saveManualQuest(app.vault, plugin.settings.storageFolder, updatedQuest);
            }
        } finally {
            // Clear lock after a delay to let file watcher debounce pass
            setTimeout(() => {
                saveLockRef.current = false;
            }, 1500);
        }
    }, [app.vault, plugin.settings.storageFolder, upsertQuest]);

    // Toggle section collapse
    const toggleSection = (status: QuestStatus) => {
        setCollapsed(prev => ({ ...prev, [status]: !prev[status] }));
    };

    // Get quests by status
    const getQuestsForSection = (status: QuestStatus): Quest[] => {
        const quests = useQuestStore.getState().quests;
        return quests ? Array.from(quests.values()).filter(q => q.status === status) : [];
    };

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    // Handle drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        const questId = active.id as string;
        const newStatus = over.id as QuestStatus;
        if (!Object.values(QuestStatus).includes(newStatus)) return;
        handleMoveQuest(questId, newStatus);
    }, [handleMoveQuest]);

    if (!character) {
        return (
            <div className="qb-sidebar-empty">
                <h3>⚔️ Welcome!</h3>
                <p>Open the Quest Board sidebar to create your character.</p>
            </div>
        );
    }

    const classInfo = CLASS_INFO[character.class];

    // Calculate XP progress
    let xpProgress: number;
    if (character.isTrainingMode) {
        const currentThreshold = TRAINING_XP_THRESHOLDS[character.trainingLevel - 1] || 0;
        const nextThreshold = TRAINING_XP_THRESHOLDS[character.trainingLevel] || TRAINING_XP_THRESHOLDS[9];
        const xpInLevel = character.trainingXP - currentThreshold;
        const xpNeeded = nextThreshold - currentThreshold;
        xpProgress = xpNeeded > 0 ? Math.min(1, xpInLevel / xpNeeded) : 1;
    } else {
        xpProgress = getXPProgress(character.totalXP);
    }

    if (loading) {
        return <div className="qb-sidebar-loading">Loading...</div>;
    }

    return (
        <div className="qb-sidebar-quests">
            {/* Tab Navigation at Top */}
            <div className="qb-sb-tabs">
                <button
                    className={`qb-sb-tab ${currentView === 'quests' ? 'active' : ''}`}
                    onClick={() => setCurrentView('quests')}
                >
                    ⚔️ Quests
                </button>
                <button
                    className={`qb-sb-tab ${currentView === 'character' ? 'active' : ''}`}
                    onClick={() => setCurrentView('character')}
                >
                    {classInfo.emoji} Character
                </button>

                {/* XP Bar in header */}
                <div className="qb-sb-header-xp">
                    <span className="qb-sb-level">
                        {character.isTrainingMode
                            ? `Training ${getTrainingLevelDisplay(character.trainingLevel)}`
                            : `Lvl ${character.level}`
                        }
                    </span>
                    <div className="qb-sb-xp-bar">
                        <div
                            className="qb-sb-xp-fill"
                            style={{
                                width: `${xpProgress * 100}%`,
                                backgroundColor: classInfo.primaryColor
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Content based on current view */}
            <div className="qb-sb-content-wrapper">
                {currentView === 'quests' ? (
                    /* Quest Sections */
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <div className="qb-sb-content">
                            {SECTIONS.map(({ status, title, emoji }) => {
                                const quests = getQuestsForSection(status);
                                const isCollapsed = collapsed[status];

                                return (
                                    <div key={status} className="qb-sb-section">
                                        <div
                                            className="qb-sb-section-header"
                                            onClick={() => toggleSection(status)}
                                        >
                                            <span className="qb-sb-collapse-icon">
                                                {isCollapsed ? '▶' : '▼'}
                                            </span>
                                            <span className="qb-sb-section-emoji">{emoji}</span>
                                            <span className="qb-sb-section-title">{title}</span>
                                            <span className="qb-sb-section-count">({quests.length})</span>
                                        </div>

                                        {!isCollapsed && (
                                            <DroppableSection id={status}>
                                                <div className="qb-sb-section-content">
                                                    {quests.length === 0 ? (
                                                        <div className="qb-sb-empty">No quests</div>
                                                    ) : (
                                                        quests.map((quest) => (
                                                            <DraggableSidebarCard key={quest.questId} id={quest.questId}>
                                                                <QuestCard
                                                                    quest={quest}
                                                                    onMove={handleMoveQuest}
                                                                    onToggleTask={handleToggleTask}
                                                                    taskProgress={taskProgressMap[quest.questId]}
                                                                    sections={sectionsMap[quest.questId]}
                                                                    visibleTaskCount={isManualQuest(quest) ? quest.visibleTasks : 4}
                                                                    isCollapsed={collapsedQuests.has(quest.questId)}
                                                                    onToggleCollapse={() => toggleQuestCollapse(quest.questId)}
                                                                />
                                                            </DraggableSidebarCard>
                                                        ))
                                                    )}
                                                </div>
                                            </DroppableSection>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </DndContext>
                ) : currentView === 'character' ? (
                    /* Full Character Sheet */
                    <CharacterSheet
                        onBack={() => setCurrentView('quests')}
                        onViewAchievements={() => setCurrentView('achievements')}
                        spriteFolder={plugin.settings.spriteFolder}
                        spriteResourcePath={(() => {
                            // Get character's current tier based on level
                            const { getLevelTier } = require('../models/Character');
                            const tier = character.isTrainingMode ? 1 : getLevelTier(character.level);
                            // Use animated.gif from the tier folder
                            const spritePath = `${plugin.settings.spriteFolder}/tier${tier}/animated.gif`;
                            const file = app.vault.getAbstractFileByPath(spritePath);
                            if (file) {
                                return app.vault.getResourcePath(file as any);
                            }
                            // Fallback to south.png if no gif
                            const fallbackPath = `${plugin.settings.spriteFolder}/tier${tier}/south.png`;
                            const fallbackFile = app.vault.getAbstractFileByPath(fallbackPath);
                            if (fallbackFile) {
                                return app.vault.getResourcePath(fallbackFile as any);
                            }
                            return undefined;
                        })()}
                    />
                ) : (
                    /* Achievements View */
                    <AchievementsSidebar
                        app={app}
                        badgeFolder={plugin.settings.badgeFolder}
                        onBack={() => setCurrentView('character')}
                    />
                )}
            </div>
        </div>
    );
};

