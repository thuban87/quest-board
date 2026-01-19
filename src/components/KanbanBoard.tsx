/**
 * Kanban Board Component
 * 
 * Main board view with 4 columns for quest management.
 * Loads quests from QuestService and wires to questStore.
 */

import React, { useEffect, useCallback } from 'react';
import { Vault } from 'obsidian';
import { QuestStatus } from '../models/QuestStatus';
import { Quest, isAIGeneratedQuest } from '../models/Quest';
import { useQuestStore, selectQuestsByStatus } from '../store/questStore';
import { useCharacterStore } from '../store/characterStore';
import { loadAllQuests, watchQuestFolder, saveManualQuest, saveAIQuest } from '../services/QuestService';
import { readTasksFromFile, getTaskCompletion, TaskCompletion } from '../services/TaskFileService';
import { QuestCard } from './QuestCard';

interface KanbanBoardProps {
    vault: Vault;
    storageFolder: string;
}

/**
 * Column configuration
 */
const COLUMNS: { status: QuestStatus; title: string; emoji: string }[] = [
    { status: QuestStatus.AVAILABLE, title: 'Available', emoji: '📋' },
    { status: QuestStatus.ACTIVE, title: 'Active', emoji: '⚡' },
    { status: QuestStatus.IN_PROGRESS, title: 'In Progress', emoji: '🔨' },
    { status: QuestStatus.COMPLETED, title: 'Completed', emoji: '✅' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
    vault,
    storageFolder,
}) => {
    const { setQuests, upsertQuest, loading, setLoading, setError } = useQuestStore();
    const character = useCharacterStore((state) => state.character);

    // Task progress cache
    const [taskProgressMap, setTaskProgressMap] = React.useState<Record<string, TaskCompletion>>({});

    // Load quests on mount
    useEffect(() => {
        const loadQuests = async () => {
            setLoading(true);
            try {
                const result = await loadAllQuests(vault, storageFolder);
                setQuests(result.quests);

                if (result.errors.length > 0) {
                    console.warn('[KanbanBoard] Some quests failed to load:', result.errors);
                }

                // Load task progress for each quest
                const progressMap: Record<string, TaskCompletion> = {};
                for (const quest of result.quests) {
                    if ('linkedTaskFile' in quest && quest.linkedTaskFile) {
                        const taskResult = await readTasksFromFile(vault, quest.linkedTaskFile);
                        if (taskResult.success) {
                            progressMap[quest.questId] = getTaskCompletion(taskResult.tasks);
                        }
                    }
                }
                setTaskProgressMap(progressMap);
            } catch (error) {
                setError(`Failed to load quests: ${error}`);
            }
        };

        loadQuests();

        // Set up folder watcher
        const unsubscribe = watchQuestFolder(vault, storageFolder, async (result) => {
            setQuests(result.quests);

            // Refresh task progress
            const progressMap: Record<string, TaskCompletion> = {};
            for (const quest of result.quests) {
                if ('linkedTaskFile' in quest && quest.linkedTaskFile) {
                    const taskResult = await readTasksFromFile(vault, quest.linkedTaskFile);
                    if (taskResult.success) {
                        progressMap[quest.questId] = getTaskCompletion(taskResult.tasks);
                    }
                }
            }
            setTaskProgressMap(progressMap);
        });

        return () => unsubscribe();
    }, [vault, storageFolder, setQuests, setLoading, setError]);

    // Handle quest move
    const handleMoveQuest = useCallback(async (questId: string, newStatus: QuestStatus) => {
        const questsMap = useQuestStore.getState().quests;
        const quest = questsMap.get(questId);

        if (!quest) return;

        // Update status
        const updatedQuest: Quest = {
            ...quest,
            status: newStatus,
            completedDate: newStatus === QuestStatus.COMPLETED
                ? new Date().toISOString()
                : quest.completedDate,
        };

        // Update store immediately for responsiveness
        upsertQuest(updatedQuest);

        // Save to file
        if (isAIGeneratedQuest(updatedQuest)) {
            await saveAIQuest(vault, storageFolder, updatedQuest);
        } else {
            await saveManualQuest(vault, storageFolder, updatedQuest);
        }
    }, [vault, storageFolder, upsertQuest]);

    // Get quests by status
    const getQuestsForColumn = (status: QuestStatus): Quest[] => {
        return useQuestStore.getState().quests
            ? Array.from(useQuestStore.getState().quests.values()).filter(q => q.status === status)
            : [];
    };

    if (loading) {
        return (
            <div className="qb-board-loading">
                <span>Loading quests...</span>
            </div>
        );
    }

    return (
        <div className="qb-kanban-board">
            {/* Header */}
            <div className="qb-board-header">
                <h2>
                    {character?.name}'s Quest Board
                </h2>
                <div className="qb-header-stats">
                    <span className="qb-level-badge">
                        Lvl {character?.isTrainingMode ? `T-${character.trainingLevel}` : character?.level}
                    </span>
                </div>
            </div>

            {/* Columns */}
            <div className="qb-columns">
                {COLUMNS.map(({ status, title, emoji }) => {
                    const quests = getQuestsForColumn(status);

                    return (
                        <div key={status} className="qb-column">
                            <div className="qb-column-header">
                                <span className="qb-column-emoji">{emoji}</span>
                                <span className="qb-column-title">{title}</span>
                                <span className="qb-column-count">{quests.length}</span>
                            </div>

                            <div className="qb-column-content">
                                {quests.length === 0 ? (
                                    <div className="qb-column-empty">
                                        No quests
                                    </div>
                                ) : (
                                    quests.map((quest) => (
                                        <QuestCard
                                            key={quest.questId}
                                            quest={quest}
                                            onMove={handleMoveQuest}
                                            taskProgress={taskProgressMap[quest.questId]}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
