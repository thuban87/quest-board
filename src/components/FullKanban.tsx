/**
 * FullKanban Component
 * 
 * Full-page Kanban board with dynamic columns and RPG-themed styling.
 * Columns can be collapsed horizontally.
 * Quest cards can be collapsed individually.
 */

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { App as ObsidianApp, Platform } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { Quest, isManualQuest } from '../models/Quest';
import { ColumnConfigService } from '../services/ColumnConfigService';
import { useQuestStore, selectAllQuests } from '../store/questStore';
import { useCharacterStore } from '../store/characterStore';
import { useKanbanFilterStore } from '../store/filterStore';
import { getXPProgressForCharacter, TRAINING_XP_THRESHOLDS } from '../services/XPSystem';
import { updateQuestSortOrder } from '../services/QuestService';
import {
    completeQuest,
    reopenQuest,
    archiveQuest,
} from '../services/QuestActionsService';
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
import { useResourceRegen } from '../hooks/useResourceRegen';
import { useFilteredQuests, collectAllCategories, collectAllTags, collectAllTypes } from '../hooks/useFilteredQuests';
import { Droppable, SortableCard } from './DnDWrappers';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ScrivenersQuillModal } from '../modals/ScrivenersQuillModal';
import { Quest as QuestModel } from '../models/Quest';

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

    // Column configuration service (memoized)
    const columnConfigService = useMemo(
        () => new ColumnConfigService(plugin.settings),
        [plugin.settings.customColumns]
    );

    const columns = useMemo(
        () => columnConfigService.getColumns(),
        [columnConfigService]
    );

    // === SHARED HOOKS ===
    // Quest loading and file watching (replaces duplicated loadQuests/watchQuestFolder logic)
    const { pendingSavesRef } = useQuestLoader({
        vault: app.vault,
        storageFolder: plugin.settings.storageFolder,
        settings: plugin.settings,
        useSaveLock: true,
    });

    // Quest actions (replaces duplicated handleMoveQuest/handleToggleTask logic)
    const { moveQuest: handleMoveQuest, toggleTask: handleToggleTask } = useQuestActions({
        vault: app.vault,
        storageFolder: plugin.settings.storageFolder,
        settings: plugin.settings,
        streakMode: plugin.settings.streakMode,
        pendingSavesRef,  // Pass pending saves ref to prevent file watcher race condition
        onSaveCharacter: handleSaveCharacter,  // Save character after streak updates
        app,  // Pass app for loot modal display
        bountyChance: plugin.settings.bountyChance,  // Pass bounty chance for bounty triggers
        onBattleStart: () => plugin.activateBattleView(),  // Open battle view when bounty fight starts
        assetFolder: plugin.manifest.dir,  // For monster sprite resolution in BountyModal
    });

    // XP Award hook - watches task file changes and awards XP
    useXPAward({
        app,
        vault: app.vault,

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

    // Resource regen hook - restores HP/Mana on task completion (7% per task)
    useResourceRegen({ onSave: handleSaveCharacter });

    // Collapsed columns state - dynamic based on columns
    const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(columns.map(c => [c.id, false]))
    );

    // Mobile column visibility state
    const isMobile = Platform.isMobile;
    const mobileMode = plugin.settings.mobileKanbanMode || 'swipe';

    // For swipe mode: track current column index
    const [mobileColumnIndex, setMobileColumnIndex] = useState<number>(() => {
        const defaultCol = plugin.settings.mobileDefaultColumn || 'active';
        const idx = columns.findIndex(c => c.id === defaultCol);
        return idx >= 0 ? idx : Math.min(1, columns.length - 1);
    });

    // For checkbox mode: track which columns are visible
    const [mobileVisibleColumns, setMobileVisibleColumns] = useState<string[]>(() => {
        const defaultCol = plugin.settings.mobileDefaultColumn || 'active';
        const found = columns.find(c => c.id === defaultCol);
        return [found?.id || columns[0]?.id || 'available'];
    });

    // Collapsed cards state (uses consolidated hook)
    const {
        isCollapsed: isCardCollapsed,
        toggle: toggleCard,
        collapse: collapseCards,
        expand: expandCards
    } = useCollapsedItems();

    // Toggle column collapse
    const toggleColumn = (columnId: string) => {
        setCollapsedColumns(prev => ({ ...prev, [columnId]: !prev[columnId] }));
    };

    // Toggle all cards in a column (collapse or expand all)
    const toggleAllCardsInColumn = (columnId: string, collapse: boolean) => {
        const questIds = useQuestStore.getState().getQuestsByStatus(columnId)
            .map(q => q.questId);
        if (collapse) {
            collapseCards(questIds);
        } else {
            expandCards(questIds);
        }
    };

    // Check if all cards in a column are collapsed
    const areAllCardsCollapsed = (columnId: string): boolean => {
        const questIds = useQuestStore.getState().getQuestsByStatus(columnId)
            .map(q => q.questId);
        return questIds.length > 0 && questIds.every(id => isCardCollapsed(id));
    };

    // Mobile navigation - swipe mode
    const goToPrevColumn = useCallback(() => {
        setMobileColumnIndex(prev => Math.max(0, prev - 1));
    }, []);

    const goToNextColumn = useCallback(() => {
        setMobileColumnIndex(prev => Math.min(columns.length - 1, prev + 1));
    }, [columns.length]);

    // Mobile toggle column visibility - checkbox mode
    const toggleMobileColumn = useCallback((columnId: string) => {
        setMobileVisibleColumns(prev => {
            if (prev.includes(columnId)) {
                // Don't allow removing the last visible column
                if (prev.length <= 1) return prev;
                return prev.filter(s => s !== columnId);
            }
            return [...prev, columnId];
        });
    }, []);

    // Check if a column should be visible on mobile
    const isColumnVisibleOnMobile = useCallback((columnId: string, index: number): boolean => {
        if (!isMobile) return true;
        if (mobileMode === 'swipe') {
            return index === mobileColumnIndex;
        }
        return mobileVisibleColumns.includes(columnId);
    }, [isMobile, mobileMode, mobileColumnIndex, mobileVisibleColumns]);

    // Load character on mount and save if migration occurred
    useEffect(() => {
        if (plugin.settings.character) {
            const oldVersion = plugin.settings.character.schemaVersion;
            setCharacter(plugin.settings.character);
            // If migration happened (store has newer version), save immediately
            const newCharacter = useCharacterStore.getState().character;
            if (newCharacter && newCharacter.schemaVersion !== oldVersion) {
                handleSaveCharacter();
            }
        }
    }, [plugin.settings.character, setCharacter, handleSaveCharacter]);

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

    // Get quests by column ID from filtered list
    const getQuestsForColumn = useCallback((columnId: string): Quest[] => {
        return filteredQuests.filter(q => q.status === columnId);
    }, [filteredQuests]);

    // Get quest status for DnD
    const getQuestStatus = useCallback((questId: string): string | undefined => {
        const quest = allQuests.find(q => q.questId === questId);
        return quest?.status;
    }, [allQuests]);

    // Handle reorder within column
    const handleReorderQuest = useCallback(async (questId: string, newSortOrder: number, columnId: string) => {
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
        columnIds: columns.map(c => c.id),
    });

    // Handle save quest as template
    const handleSaveAsTemplate = useCallback((quest: QuestModel) => {
        // Create a parsed template from the quest
        const mockTemplate = {
            name: quest.questName,
            path: '',
            questType: (quest as any).questType || 'side',
            category: quest.category,
            placeholders: [],
        };
        new ScrivenersQuillModal(app, plugin, mockTemplate as any).open();
    }, [app, plugin]);

    // Complete quest handler
    const handleCompleteQuest = useCallback(async (questId: string) => {
        await completeQuest(app.vault, questId, {
            storageFolder: plugin.settings.storageFolder,
            settings: plugin.settings,
            streakMode: plugin.settings.streakMode,
            app,
            bountyChance: plugin.settings.bountyChance,
            onBattleStart: () => plugin.activateBattleView(),
            assetFolder: plugin.manifest.dir,
            onSaveCharacter: handleSaveCharacter,
        });
    }, [app, plugin.settings, handleSaveCharacter]);

    // Reopen quest handler
    const handleReopenQuest = useCallback(async (questId: string) => {
        await reopenQuest(app.vault, questId, plugin.settings.storageFolder, plugin.settings);
    }, [app.vault, plugin.settings]);

    // Archive quest handler
    const handleArchiveQuest = useCallback(async (questId: string) => {
        await archiveQuest(app.vault, questId, plugin.settings.archiveFolder);
    }, [app.vault, plugin.settings.archiveFolder]);

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
        <div className={`qb-fullpage-board ${isMobile ? 'qb-mobile-view' : ''}`}>
            {/* Header - hidden on mobile */}
            {!isMobile && (
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
            )}

            {/* Filter Bar */}
            <FilterBar
                filterStore={filterStore}
                availableCategories={availableCategories}
                availableTags={availableTags}
                availableTypes={availableTypes}
                isMobile={isMobile}
            />

            {/* Mobile Column Selector */}
            {isMobile && (
                <div className="qb-mobile-column-selector">
                    {mobileMode === 'swipe' ? (
                        // Swipe mode: show nav arrows and current column name
                        <div className="qb-mobile-swipe-nav">
                            <button
                                className="qb-mobile-nav-btn"
                                onClick={goToPrevColumn}
                                disabled={mobileColumnIndex === 0}
                            >
                                ◀
                            </button>
                            <span className="qb-mobile-column-label">
                                {columns[mobileColumnIndex]?.emoji} {columns[mobileColumnIndex]?.title}
                                <span className="qb-mobile-count">
                                    ({getQuestsForColumn(columns[mobileColumnIndex]?.id || '').length})
                                </span>
                            </span>
                            <button
                                className="qb-mobile-nav-btn"
                                onClick={goToNextColumn}
                                disabled={mobileColumnIndex === columns.length - 1}
                            >
                                ▶
                            </button>
                        </div>
                    ) : (
                        // Checkbox mode: show toggleable chips
                        <div className="qb-mobile-column-chips">
                            {columns.map(({ id, title, emoji }) => (
                                <button
                                    key={id}
                                    className={`qb-mobile-column-chip ${mobileVisibleColumns.includes(id) ? 'active' : ''}`}
                                    onClick={() => toggleMobileColumn(id)}
                                >
                                    {emoji} {title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Columns */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className={`qb-fullpage-columns ${isMobile ? 'qb-mobile-columns' : ''}`}>
                    {columns.map((col, index) => {
                        const quests = getQuestsForColumn(col.id);
                        const isCollapsed = collapsedColumns[col.id];

                        // On mobile, only render visible columns
                        if (!isColumnVisibleOnMobile(col.id, index)) {
                            return null;
                        }

                        // Determine theme class based on column position or triggersCompletion
                        const themeClass = col.triggersCompletion ? 'theme-completed' : `theme-col-${index % 4}`;

                        return (
                            <div
                                key={col.id}
                                className={`qb-fp-column ${themeClass} ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'qb-mobile-column' : ''}`}
                            >
                                {/* Column Header - clickable to toggle */}
                                <div
                                    className="qb-fp-column-header"
                                    onClick={() => toggleColumn(col.id)}
                                    title={isCollapsed ? 'Click to expand' : 'Click to collapse'}
                                >
                                    {isCollapsed ? (
                                        /* Collapsed: Vertical title */
                                        <div className="qb-fp-col-collapsed">
                                            <span className="qb-fp-column-emoji">{col.emoji}</span>
                                            <span className="qb-fp-col-vertical-title">{col.title}</span>
                                            <span className="qb-fp-column-count">{quests.length}</span>
                                        </div>
                                    ) : (
                                        /* Expanded: Normal header */
                                        <>
                                            <span className="qb-fp-column-emoji">{col.emoji}</span>
                                            <span className="qb-fp-column-title">{col.title}</span>
                                            <span className="qb-fp-column-count">{quests.length}</span>
                                            {quests.length > 0 && (
                                                <button
                                                    className="qb-fp-toggle-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleAllCardsInColumn(col.id, !areAllCardsCollapsed(col.id));
                                                    }}
                                                    title={areAllCardsCollapsed(col.id) ? 'Expand all cards' : 'Collapse all cards'}
                                                >
                                                    {areAllCardsCollapsed(col.id) ? '▼' : '▲'}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Column Content - hidden when collapsed */}
                                {!isCollapsed && (
                                    <Droppable id={col.id}>
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
                                                                            onSaveAsTemplate={handleSaveAsTemplate}
                                                                            columns={columns}
                                                                            onComplete={handleCompleteQuest}
                                                                            onReopen={handleReopenQuest}
                                                                            onArchive={handleArchiveQuest}
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
