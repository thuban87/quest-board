/**
 * FullKanban Component
 * 
 * Full-page Kanban board with 4 columns and RPG-themed styling.
 * Columns can be collapsed horizontally.
 * Quest cards can be collapsed individually.
 */

import React, { useEffect, useCallback, useState } from 'react';
import { App as ObsidianApp } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { QuestStatus } from '../models/QuestStatus';
import { Quest, isAIGeneratedQuest, isManualQuest } from '../models/Quest';
import { useQuestStore } from '../store/questStore';
import { useCharacterStore } from '../store/characterStore';
import { loadAllQuests, watchQuestFolder, saveManualQuest, saveAIQuest } from '../services/QuestService';
import { readTasksWithSections, getTaskCompletion, TaskCompletion, TaskSection, toggleTaskInFile } from '../services/TaskFileService';
import { getXPProgress } from '../services/XPSystem';
import { QuestCard } from './QuestCard';
import { CLASS_INFO } from '../models/Character';
import { useXPAward } from '../hooks/useXPAward';
import { useTaskSectionsStore } from '../store/taskSectionsStore';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface FullKanbanProps {
    plugin: QuestBoardPlugin;
    app: ObsidianApp;
}

/**
 * Column configuration with RPG theming
 */
const COLUMNS: { status: QuestStatus; title: string; emoji: string; themeClass: string }[] = [
    { status: QuestStatus.AVAILABLE, title: 'Available', emoji: '📋', themeClass: 'qb-col-available' },
    { status: QuestStatus.ACTIVE, title: 'Active', emoji: '⚡', themeClass: 'qb-col-active' },
    { status: QuestStatus.IN_PROGRESS, title: 'In Progress', emoji: '🔨', themeClass: 'qb-col-progress' },
    { status: QuestStatus.COMPLETED, title: 'Completed', emoji: '✅', themeClass: 'qb-col-completed' },
];

/**
 * Droppable column wrapper
 */
const DroppableColumn: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div ref={setNodeRef} style={{ opacity: isOver ? 0.8 : 1 }}>
            {children}
        </div>
    );
};

/**
 * Draggable card wrapper
 */
const DraggableCard: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
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

export const FullKanban: React.FC<FullKanbanProps> = ({ plugin, app }) => {
    const { setQuests, upsertQuest, loading, setLoading, setError } = useQuestStore();
    const character = useCharacterStore((state) => state.character);
    const setCharacter = useCharacterStore((state) => state.setCharacter);

    // Task sections and progress from shared store
    const sectionsMap = useTaskSectionsStore((state) => state.sectionsMap);
    const taskProgressMap = useTaskSectionsStore((state) => state.progressMap);
    const setSections = useTaskSectionsStore((state) => state.setSections);
    const setAllSections = useTaskSectionsStore((state) => state.setAllSections);

    // Collapsed columns state
    const [collapsedColumns, setCollapsedColumns] = useState<Record<QuestStatus, boolean>>({
        [QuestStatus.AVAILABLE]: false,
        [QuestStatus.ACTIVE]: false,
        [QuestStatus.IN_PROGRESS]: false,
        [QuestStatus.COMPLETED]: false,
    });

    // Collapsed cards state (by quest ID)
    const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());

    // Toggle column collapse
    const toggleColumn = (status: QuestStatus) => {
        setCollapsedColumns(prev => ({ ...prev, [status]: !prev[status] }));
    };

    // Toggle card collapse
    const toggleCard = (questId: string) => {
        setCollapsedCards(prev => {
            const next = new Set(prev);
            if (next.has(questId)) {
                next.delete(questId);
            } else {
                next.add(questId);
            }
            return next;
        });
    };

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
        vault: app.vault,
        onSaveCharacter: handleSaveCharacter,
    });

    // Load character on mount
    useEffect(() => {
        if (plugin.settings.character) {
            setCharacter(plugin.settings.character);
        }
    }, [plugin.settings.character, setCharacter]);

    // Load quests and tasks on mount
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
                        const taskResult = await readTasksWithSections(app.vault, quest.linkedTaskFile);
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
            setQuests(result.quests);

            const progressMap: Record<string, TaskCompletion> = {};
            const allSectionsMap: Record<string, TaskSection[]> = {};

            for (const quest of result.quests) {
                if (isManualQuest(quest) && quest.linkedTaskFile) {
                    const taskResult = await readTasksWithSections(app.vault, quest.linkedTaskFile);
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

        const taskResult = await readTasksWithSections(app.vault, quest.linkedTaskFile);
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

        upsertQuest(updatedQuest);

        if (isAIGeneratedQuest(updatedQuest)) {
            await saveAIQuest(app.vault, plugin.settings.storageFolder, updatedQuest);
        } else {
            await saveManualQuest(app.vault, plugin.settings.storageFolder, updatedQuest);
        }
    }, [app.vault, plugin.settings.storageFolder, upsertQuest]);

    // Get quests by status
    const getQuestsForColumn = (status: QuestStatus): Quest[] => {
        const quests = useQuestStore.getState().quests;
        return quests ? Array.from(quests.values()).filter(q => q.status === status) : [];
    };

    // DnD sensors - require slight movement before dragging starts
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Handle drag end - move quest to new column
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const questId = active.id as string;
        const newStatus = over.id as QuestStatus;

        // Check if valid status
        if (!Object.values(QuestStatus).includes(newStatus)) return;

        handleMoveQuest(questId, newStatus);
    }, [handleMoveQuest]);

    if (!character) {
        return (
            <div className="qb-fullpage-empty">
                <h2>⚔️ No Character Found</h2>
                <p>Open the Quest Board sidebar to create your character first.</p>
            </div>
        );
    }

    const classInfo = CLASS_INFO[character.class];
    const xpProgress = character.isTrainingMode
        ? (character.trainingXP % 100) / 100
        : getXPProgress(character.totalXP);

    if (loading) {
        return (
            <div className="qb-fullpage-loading">
                <span>Loading quests...</span>
            </div>
        );
    }

    return (
        <div className="qb-fullpage-board">
            {/* Header */}
            <header className="qb-fullpage-header">
                <div className="qb-fp-header-left">
                    <h1>⚔️ {character.name}'s Quest Board</h1>
                </div>
                <div className="qb-fp-header-right">
                    <span className="qb-fp-class">{classInfo.emoji} {classInfo.name}</span>
                    <span className="qb-fp-level">Level {character.level}</span>
                    <div className="qb-fp-xp-bar">
                        <div
                            className="qb-fp-xp-fill"
                            style={{
                                width: `${xpProgress * 100}%`,
                                backgroundColor: classInfo.primaryColor
                            }}
                        />
                    </div>
                    <span className="qb-fp-xp-text">{character.totalXP} XP</span>
                </div>
            </header>

            {/* Columns */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="qb-fullpage-columns">
                    {COLUMNS.map(({ status, title, emoji, themeClass }) => {
                        const quests = getQuestsForColumn(status);
                        const isCollapsed = collapsedColumns[status];

                        return (
                            <div
                                key={status}
                                className={`qb-fp-column ${themeClass} ${isCollapsed ? 'collapsed' : ''}`}
                            >
                                {/* Column Header - clickable to toggle */}
                                <div
                                    className="qb-fp-column-header"
                                    onClick={() => toggleColumn(status)}
                                    title={isCollapsed ? 'Click to expand' : 'Click to collapse'}
                                >
                                    {isCollapsed ? (
                                        /* Collapsed: Vertical title */
                                        <div className="qb-fp-col-collapsed">
                                            <span className="qb-fp-column-emoji">{emoji}</span>
                                            <span className="qb-fp-col-vertical-title">{title}</span>
                                            <span className="qb-fp-column-count">{quests.length}</span>
                                        </div>
                                    ) : (
                                        /* Expanded: Normal header */
                                        <>
                                            <span className="qb-fp-column-emoji">{emoji}</span>
                                            <span className="qb-fp-column-title">{title}</span>
                                            <span className="qb-fp-column-count">{quests.length}</span>
                                        </>
                                    )}
                                </div>

                                {/* Column Content - hidden when collapsed */}
                                {!isCollapsed && (
                                    <DroppableColumn id={status}>
                                        <div className="qb-fp-column-content">
                                            {quests.length === 0 ? (
                                                <div className="qb-fp-column-empty">
                                                    No quests
                                                </div>
                                            ) : (
                                                quests.map((quest) => {
                                                    const isCardCollapsed = collapsedCards.has(quest.questId);

                                                    return (
                                                        <DraggableCard key={quest.questId} id={quest.questId}>
                                                            <div className="qb-fp-card-wrapper">
                                                                {/* Card collapse toggle */}
                                                                <div
                                                                    className="qb-fp-card-toggle"
                                                                    onClick={() => toggleCard(quest.questId)}
                                                                    title={isCardCollapsed ? 'Expand' : 'Collapse'}
                                                                >
                                                                    {isCardCollapsed ? '▶' : '▼'}
                                                                </div>

                                                                {isCardCollapsed ? (
                                                                    /* Collapsed card: just name and XP */
                                                                    <div
                                                                        className="qb-fp-card-collapsed"
                                                                        onClick={() => toggleCard(quest.questId)}
                                                                    >
                                                                        <span className="qb-fp-card-name">{quest.questName}</span>
                                                                        <span className="qb-fp-card-xp">
                                                                            ⭐ {isManualQuest(quest)
                                                                                ? quest.xpPerTask + quest.completionBonus
                                                                                : quest.xpTotal} XP
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    /* Expanded card: full QuestCard */
                                                                    <QuestCard
                                                                        quest={quest}
                                                                        onMove={handleMoveQuest}
                                                                        onToggleTask={handleToggleTask}
                                                                        taskProgress={taskProgressMap[quest.questId]}
                                                                        sections={sectionsMap[quest.questId]}
                                                                    />
                                                                )}
                                                            </div>
                                                        </DraggableCard>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </DroppableColumn>
                                )}
                            </div>
                        );
                    })}
                </div>
            </DndContext>
        </div>
    );
};
