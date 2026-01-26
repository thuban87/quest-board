/**
 * FullKanban Component
 * 
 * Full-page Kanban board with 4 columns and RPG-themed styling.
 * Columns can be collapsed horizontally.
 * Quest cards can be collapsed individually.
 */

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { App as ObsidianApp } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { QuestStatus } from '../models/QuestStatus';
import { Quest, isManualQuest } from '../models/Quest';
import { KANBAN_STATUSES } from '../config/questStatusConfig';
import { useQuestStore, selectAllQuests } from '../store/questStore';
import { useCharacterStore } from '../store/characterStore';
import { useKanbanFilterStore } from '../store/filterStore';
import { getXPProgressForCharacter, TRAINING_XP_THRESHOLDS } from '../services/XPSystem';
import { updateQuestSortOrder } from '../services/QuestService';
import { QuestCard } from './QuestCard';
import { FilterBar } from './FilterBar';
import { CLASS_INFO, getTrainingLevelDisplay } from '../models/Character';
import { useTaskSectionsStore } from '../store/taskSectionsStore';
import { useQuestLoader } from '../hooks/useQuestLoader';
import { useQuestActions } from '../hooks/useQuestActions';
import { useSaveCharacter } from '../hooks/useSaveCharacter';
import { useDndQuests } from '../hooks/useDndQuests';
import { useCollapsedItems } from '../hooks/useCollapsedItems';
import { useXPAward } from '../hooks/useXPAward';
import { useFilteredQuests, collectAllCategories, collectAllTags, collectAllTypes } from '../hooks/useFilteredQuests';
import { Droppable, SortableCard } from './DnDWrappers';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface FullKanbanProps {
    plugin: QuestBoardPlugin;
    app: ObsidianApp;
}

export const FullKanban: React.FC<FullKanbanProps> = ({ plugin, app }) => {
    const loading = useQuestStore((state) => state.loading);
    const character = useCharacterStore((state) => state.character);
    const setCharacter = useCharacterStore((state) => state.setCharacter);

    // Task sections and progress from shared store
    const sectionsMap = useTaskSectionsStore((state) => state.sectionsMap);
    const taskProgressMap = useTaskSectionsStore((state) => state.progressMap);

    // All quests for filtering
    const allQuests = useQuestStore(selectAllQuests);

    // Filter store for this view
    const filterStore = useKanbanFilterStore();

    // Save character callback (uses consolidated hook)
    const handleSaveCharacter = useSaveCharacter(plugin);

    // === SHARED HOOKS ===
    // Quest loading and file watching (replaces duplicated loadQuests/watchQuestFolder logic)
    const { pendingSavesRef } = useQuestLoader({
        vault: app.vault,
        storageFolder: plugin.settings.storageFolder,
        useSaveLock: true,
    });

    // Quest actions (replaces duplicated handleMoveQuest/handleToggleTask logic)
    const { moveQuest: handleMoveQuest, toggleTask: handleToggleTask } = useQuestActions({
        vault: app.vault,
        storageFolder: plugin.settings.storageFolder,
        streakMode: plugin.settings.streakMode,
        pendingSavesRef,  // Pass pending saves ref to prevent file watcher race condition
        onSaveCharacter: handleSaveCharacter,  // Save character after streak updates
        app,  // Pass app for loot modal display
        bountyChance: plugin.settings.bountyChance,  // Pass bounty chance for bounty triggers
        onBattleStart: () => plugin.activateBattleView(),  // Open battle view when bounty fight starts
    });

    // XP Award hook - watches task file changes and awards XP
    useXPAward({
        app,
        vault: app.vault,
        badgeFolder: plugin.settings.badgeFolder,
        customStatMappings: plugin.settings.categoryStatMappings,
        onCategoryUsed: async (category) => {
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

    // Collapsed columns state
    const [collapsedColumns, setCollapsedColumns] = useState<Record<QuestStatus, boolean>>({
        [QuestStatus.AVAILABLE]: false,
        [QuestStatus.ACTIVE]: false,
        [QuestStatus.IN_PROGRESS]: false,
        [QuestStatus.COMPLETED]: false,
    });

    // Collapsed cards state (uses consolidated hook)
    const {
        isCollapsed: isCardCollapsed,
        toggle: toggleCard,
        collapse: collapseCards,
        expand: expandCards
    } = useCollapsedItems();

    // Toggle column collapse
    const toggleColumn = (status: QuestStatus) => {
        setCollapsedColumns(prev => ({ ...prev, [status]: !prev[status] }));
    };

    // Toggle all cards in a column (collapse or expand all)
    const toggleAllCardsInColumn = (status: QuestStatus, collapse: boolean) => {
        const questIds = useQuestStore.getState().getQuestsByStatus(status)
            .map(q => q.questId);
        if (collapse) {
            collapseCards(questIds);
        } else {
            expandCards(questIds);
        }
    };

    // Check if all cards in a column are collapsed
    const areAllCardsCollapsed = (status: QuestStatus): boolean => {
        const questIds = useQuestStore.getState().getQuestsByStatus(status)
            .map(q => q.questId);
        return questIds.length > 0 && questIds.every(id => isCardCollapsed(id));
    };

    // Load character on mount
    useEffect(() => {
        if (plugin.settings.character) {
            setCharacter(plugin.settings.character);
        }
    }, [plugin.settings.character, setCharacter]);

    // Collect available categories, tags, and types for filter dropdowns
    const availableCategories = useMemo(() => collectAllCategories(allQuests), [allQuests]);
    const availableTags = useMemo(() => collectAllTags(allQuests), [allQuests]);
    const availableTypes = useMemo(() => collectAllTypes(allQuests), [allQuests]);

    // Pre-filter all quests (excludes folders, applies filters)
    const excludedFolders = plugin.settings.excludedFolders || [];

    const questsAfterExclusion = useMemo(() => {
        if (excludedFolders.length === 0) return allQuests;
        return allQuests.filter(quest => {
            if (isManualQuest(quest) && quest.linkedTaskFile) {
                for (const excluded of excludedFolders) {
                    if (quest.linkedTaskFile.includes(`/${excluded}/`) ||
                        quest.linkedTaskFile.includes(`\\${excluded}\\`) ||
                        quest.linkedTaskFile.startsWith(`${excluded}/`) ||
                        quest.linkedTaskFile.endsWith(`/${excluded}`)) {
                        return false;
                    }
                }
            }
            return true;
        });
    }, [allQuests, excludedFolders]);

    // Apply filter/search/sort to quests
    const filteredQuests = useFilteredQuests({
        quests: questsAfterExclusion,
        filterState: filterStore,
        taskProgressMap,
        sectionsMap,
    });

    // Get quests by status from filtered list
    const getQuestsForColumn = useCallback((status: QuestStatus): Quest[] => {
        return filteredQuests.filter(q => q.status === status);
    }, [filteredQuests]);

    // Get quest status for DnD
    const getQuestStatus = useCallback((questId: string): QuestStatus | undefined => {
        const quest = allQuests.find(q => q.questId === questId);
        return quest?.status;
    }, [allQuests]);

    // Handle reorder within column
    const handleReorderQuest = useCallback(async (questId: string, newSortOrder: number, status: QuestStatus) => {
        // Update in store immediately for responsiveness
        const quest = useQuestStore.getState().quests.get(questId);
        if (quest && isManualQuest(quest)) {
            useQuestStore.getState().upsertQuest({ ...quest, sortOrder: newSortOrder });
        }
        // Persist to file
        await updateQuestSortOrder(app.vault, plugin.settings.storageFolder, questId, newSortOrder);
    }, [app.vault, plugin.settings.storageFolder]);

    // DnD sensors and drag handler (uses consolidated hook)
    const { sensors, handleDragEnd } = useDndQuests({
        onMoveQuest: handleMoveQuest,
        onReorderQuest: handleReorderQuest,
        getQuestStatus,
        getQuestsForStatus: getQuestsForColumn,
    });

    if (!character) {
        return (
            <div className="qb-fullpage-empty">
                <h2>⚔️ No Character Found</h2>
                <p>Open the Quest Board sidebar to create your character first.</p>
            </div>
        );
    }

    const classInfo = CLASS_INFO[character.class];

    // Calculate XP progress (uses consolidated utility)
    const xpProgress = getXPProgressForCharacter(character);

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
                    <span className="qb-fp-level">
                        {character.isTrainingMode
                            ? `Training ${getTrainingLevelDisplay(character.trainingLevel)}`
                            : `Level ${character.level}`
                        }
                    </span>
                    <div className="qb-fp-xp-bar">
                        <div
                            className="qb-fp-xp-fill"
                            style={{
                                width: `${xpProgress * 100}%`,
                                backgroundColor: classInfo.primaryColor
                            }}
                        />
                    </div>
                    <span className="qb-fp-xp-text">
                        {(() => {
                            if (character.isTrainingMode) {
                                const currentThreshold = TRAINING_XP_THRESHOLDS[character.trainingLevel - 1] || 0;
                                const nextThreshold = TRAINING_XP_THRESHOLDS[character.trainingLevel] || TRAINING_XP_THRESHOLDS[9];
                                return `${character.trainingXP - currentThreshold} / ${nextThreshold - currentThreshold} XP`;
                            } else {
                                return `${character.totalXP} XP`;
                            }
                        })()}
                    </span>
                </div>
            </header>

            {/* Filter Bar */}
            <FilterBar
                filterStore={filterStore}
                availableCategories={availableCategories}
                availableTags={availableTags}
                availableTypes={availableTypes}
            />

            {/* Columns */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="qb-fullpage-columns">
                    {KANBAN_STATUSES.map(({ status, title, emoji, themeClass }) => {
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
                                            {quests.length > 0 && (
                                                <button
                                                    className="qb-fp-toggle-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleAllCardsInColumn(status, !areAllCardsCollapsed(status));
                                                    }}
                                                    title={areAllCardsCollapsed(status) ? 'Expand all cards' : 'Collapse all cards'}
                                                >
                                                    {areAllCardsCollapsed(status) ? '▼' : '▲'}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Column Content - hidden when collapsed */}
                                {!isCollapsed && (
                                    <Droppable id={status}>
                                        <SortableContext
                                            items={quests.map(q => q.questId)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="qb-fp-column-content">
                                                {quests.length === 0 ? (
                                                    <div className="qb-fp-column-empty">
                                                        No quests
                                                    </div>
                                                ) : (
                                                    quests.map((quest) => {
                                                        const isCardCollapsedState = isCardCollapsed(quest.questId);

                                                        return (
                                                            <SortableCard key={quest.questId} id={quest.questId}>
                                                                <div className="qb-fp-card-wrapper">
                                                                    {/* Card collapse toggle */}
                                                                    <div
                                                                        className="qb-fp-card-toggle"
                                                                        onClick={() => toggleCard(quest.questId)}
                                                                        title={isCardCollapsedState ? 'Expand' : 'Collapse'}
                                                                    >
                                                                        {isCardCollapsedState ? '▶' : '▼'}
                                                                    </div>

                                                                    {isCardCollapsedState ? (
                                                                        /* Collapsed card: just name and XP */
                                                                        <div
                                                                            className="qb-fp-card-collapsed"
                                                                            onClick={() => toggleCard(quest.questId)}
                                                                        >
                                                                            <span className="qb-fp-card-name">{quest.questName}</span>
                                                                            <span className="qb-fp-card-xp">
                                                                                ⭐ {isManualQuest(quest)
                                                                                    ? (quest.xpPerTask * (taskProgressMap[quest.questId]?.total || 0)) + quest.completionBonus
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
                                                                            visibleTaskCount={isManualQuest(quest) ? quest.visibleTasks : 4}
                                                                            app={app}
                                                                            storageFolder={plugin.settings.storageFolder}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </SortableCard>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </SortableContext>
                                    </Droppable>
                                )}
                            </div>
                        );
                    })}
                </div>
            </DndContext>
        </div>
    );
};
