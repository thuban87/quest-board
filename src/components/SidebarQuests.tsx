/**
 * SidebarQuests Component
 * 
 * Focused sidebar with stacked quest cards (no Completed).
 * Collapsible sections for each status.
 * Tab navigation between Quests and Character Sheet.
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
import { CharacterSheet } from './CharacterSheet';
import { CLASS_INFO } from '../models/Character';
import { useXPAward } from '../hooks/useXPAward';
import { useTaskSectionsStore } from '../store/taskSectionsStore';

interface SidebarQuestsProps {
    plugin: QuestBoardPlugin;
    app: ObsidianApp;
}

type SidebarView = 'quests' | 'character';

/**
 * Sections to show (no Completed)
 */
const SECTIONS: { status: QuestStatus; title: string; emoji: string }[] = [
    { status: QuestStatus.AVAILABLE, title: 'Available', emoji: '📋' },
    { status: QuestStatus.ACTIVE, title: 'Active', emoji: '⚡' },
    { status: QuestStatus.IN_PROGRESS, title: 'In Progress', emoji: '🔨' },
];

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
        vault: app.vault,
        onSaveCharacter: handleSaveCharacter,
    });

    // Load character on mount
    useEffect(() => {
        if (plugin.settings.character) {
            setCharacter(plugin.settings.character);
        }
        if (plugin.settings.inventory || plugin.settings.achievements) {
            setInventoryAndAchievements(
                plugin.settings.inventory || [],
                plugin.settings.achievements || []
            );
        }
    }, [plugin.settings, setCharacter, setInventoryAndAchievements]);

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

    // Toggle section collapse
    const toggleSection = (status: QuestStatus) => {
        setCollapsed(prev => ({ ...prev, [status]: !prev[status] }));
    };

    // Get quests by status
    const getQuestsForSection = (status: QuestStatus): Quest[] => {
        const quests = useQuestStore.getState().quests;
        return quests ? Array.from(quests.values()).filter(q => q.status === status) : [];
    };

    if (!character) {
        return (
            <div className="qb-sidebar-empty">
                <h3>⚔️ Welcome!</h3>
                <p>Open the Quest Board sidebar to create your character.</p>
            </div>
        );
    }

    const classInfo = CLASS_INFO[character.class];
    const xpProgress = character.isTrainingMode
        ? (character.trainingXP % 100) / 100
        : getXPProgress(character.totalXP);

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
                    <span className="qb-sb-level">Lvl {character.level}</span>
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
                                        <div className="qb-sb-section-content">
                                            {quests.length === 0 ? (
                                                <div className="qb-sb-empty">No quests</div>
                                            ) : (
                                                quests.map((quest) => (
                                                    <QuestCard
                                                        key={quest.questId}
                                                        quest={quest}
                                                        onMove={handleMoveQuest}
                                                        onToggleTask={handleToggleTask}
                                                        taskProgress={taskProgressMap[quest.questId]}
                                                        sections={sectionsMap[quest.questId]}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Full Character Sheet */
                    <CharacterSheet onBack={() => setCurrentView('quests')} />
                )}
            </div>
        </div>
    );
};

