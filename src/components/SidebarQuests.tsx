/**
 * SidebarQuests Component
 * 
 * Focused sidebar with stacked quest cards (no Completed).
 * Collapsible sections for each status.
 * Tab navigation between Quests and Character Sheet.
 */

import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { App as ObsidianApp } from 'obsidian';
import type QuestBoardPlugin from '../../main';
import { QuestStatus } from '../models/QuestStatus';
import { Quest, isManualQuest } from '../models/Quest';
import { SIDEBAR_STATUSES } from '../config/questStatusConfig';
import { useQuestStore, selectAllQuests } from '../store/questStore';
import { useCharacterStore } from '../store/characterStore';
import { useSidebarFilterStore } from '../store/filterStore';
import { getXPProgressForCharacter } from '../services/XPSystem';
import { updateQuestSortOrder } from '../services/QuestService';
import { AchievementService } from '../services/AchievementService';
import { QuestCard } from './QuestCard';
import { FilterBar } from './FilterBar';
import { CharacterSheet } from './CharacterSheet';
import { AchievementsSidebar } from './AchievementsSidebar';
import { CLASS_INFO, getTrainingLevelDisplay } from '../models/Character';
import { useXPAward } from '../hooks/useXPAward';
import { useTaskSectionsStore } from '../store/taskSectionsStore';
import { useQuestLoader } from '../hooks/useQuestLoader';
import { useQuestActions } from '../hooks/useQuestActions';
import { useSaveCharacter } from '../hooks/useSaveCharacter';
import { useDndQuests } from '../hooks/useDndQuests';
import { useCollapsedItems } from '../hooks/useCollapsedItems';
import { useFilteredQuests, collectAllCategories, collectAllTags, collectAllTypes } from '../hooks/useFilteredQuests';
import { useCharacterSprite } from '../hooks/useCharacterSprite';
import { Droppable, SortableCard } from './DnDWrappers';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { showInventoryModal } from '../modals/InventoryModal';
import { showBlacksmithModal } from '../modals/BlacksmithModal';

interface SidebarQuestsProps {
    plugin: QuestBoardPlugin;
    app: ObsidianApp;
}

type SidebarView = 'quests' | 'character' | 'achievements';

export const SidebarQuests: React.FC<SidebarQuestsProps> = ({ plugin, app }) => {
    const loading = useQuestStore((state) => state.loading);
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

    // Collapsed state for individual quests (uses consolidated hook)
    const { isCollapsed: isQuestCollapsed, toggle: toggleQuestCollapse } = useCollapsedItems();

    // Task sections and progress from shared store
    const sectionsMap = useTaskSectionsStore((state) => state.sectionsMap);
    const taskProgressMap = useTaskSectionsStore((state) => state.progressMap);

    // All quests for filtering
    const allQuests = useQuestStore(selectAllQuests);

    // Filter store for this view
    const filterStore = useSidebarFilterStore();

    // Save character callback (uses consolidated hook)
    const handleSaveCharacter = useSaveCharacter(plugin);

    // Character sprite resource path (uses consolidated hook)
    const spriteResourcePath = useCharacterSprite({
        character,
        manifestDir: plugin.manifest.dir,
        adapter: app.vault.adapter,
        animated: true,  // Animated GIF for character sheet
    });

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
        manifestDir: plugin.manifest.dir,  // For monster sprite resolution in BountyModal
    });

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
    // NOTE: Streak check happens in main.ts at plugin load
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

    // Toggle section collapse
    const toggleSection = (status: QuestStatus) => {
        setCollapsed(prev => ({ ...prev, [status]: !prev[status] }));
    };

    // Collect available categories, tags, and types for filter dropdowns
    const availableCategories = useMemo(() => collectAllCategories(allQuests), [allQuests]);
    const availableTags = useMemo(() => collectAllTags(allQuests), [allQuests]);
    const availableTypes = useMemo(() => collectAllTypes(allQuests), [allQuests]);

    // Pre-filter all quests (excludes folders)
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
    const getQuestsForSection = useCallback((status: QuestStatus): Quest[] => {
        return filteredQuests.filter(q => q.status === status);
    }, [filteredQuests]);

    // Get quest status for DnD
    const getQuestStatus = useCallback((questId: string): QuestStatus | undefined => {
        const quest = allQuests.find(q => q.questId === questId);
        return quest?.status;
    }, [allQuests]);

    // Handle reorder within section
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
        getQuestsForStatus: getQuestsForSection,
    });

    if (!character) {
        return (
            <div className="qb-sidebar-empty">
                <h3>⚔️ Welcome!</h3>
                <p>Open the Quest Board sidebar to create your character.</p>
            </div>
        );
    }

    const classInfo = CLASS_INFO[character.class];

    // Calculate XP progress (uses consolidated utility)
    const xpProgress = getXPProgressForCharacter(character);

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
                    <>
                        {/* Filter Bar (compact mode for sidebar) */}
                        <FilterBar
                            filterStore={filterStore}
                            availableCategories={availableCategories}
                            availableTags={availableTags}
                            availableTypes={availableTypes}
                            compact
                        />
                        {/* Quest Sections */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <div className="qb-sb-content">
                                {SIDEBAR_STATUSES.map(({ status, title, emoji }) => {
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
                                                <Droppable id={status}>
                                                    <SortableContext
                                                        items={quests.map(q => q.questId)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="qb-sb-section-content">
                                                            {quests.length === 0 ? (
                                                                <div className="qb-sb-empty">No quests</div>
                                                            ) : (
                                                                quests.map((quest) => (
                                                                    <SortableCard key={quest.questId} id={quest.questId}>
                                                                        <QuestCard
                                                                            quest={quest}
                                                                            onMove={handleMoveQuest}
                                                                            onToggleTask={handleToggleTask}
                                                                            taskProgress={taskProgressMap[quest.questId]}
                                                                            sections={sectionsMap[quest.questId]}
                                                                            visibleTaskCount={isManualQuest(quest) ? quest.visibleTasks : 4}
                                                                            isCollapsed={isQuestCollapsed(quest.questId)}
                                                                            onToggleCollapse={() => toggleQuestCollapse(quest.questId)}
                                                                            app={app}
                                                                            storageFolder={plugin.settings.storageFolder}
                                                                        />
                                                                    </SortableCard>
                                                                ))
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
                    </>
                ) : currentView === 'character' ? (
                    /* Full Character Sheet */
                    <CharacterSheet
                        onBack={() => setCurrentView('quests')}
                        onViewAchievements={() => setCurrentView('achievements')}
                        onOpenInventory={() => showInventoryModal(app, {
                            onSave: handleSaveCharacter
                        })}
                        onOpenBlacksmith={() => showBlacksmithModal(app, {
                            onSmelt: handleSaveCharacter
                        })}
                        spriteFolder={plugin.settings.spriteFolder}
                        spriteResourcePath={spriteResourcePath}
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


