/**
 * Quest Card Component
 * 
 * Displays a single quest in the Kanban board.
 * Shows title, category, tasks, progress, and XP reward.
 */

import React, { memo } from 'react';
import { Quest, isManualQuest } from '../models/Quest';
import { QuestStatus, QuestPriority } from '../models/QuestStatus';
import { CLASS_INFO } from '../models/Character';
import { useCharacterStore } from '../store/characterStore';
import { Task } from '../services/TaskFileService';

interface QuestCardProps {
    quest: Quest;
    onMove: (questId: string, newStatus: QuestStatus) => void;
    onToggleTask: (questId: string, lineNumber: number) => void;
    taskProgress?: { completed: number; total: number };
    tasks?: Task[];
    visibleTaskCount?: number;
}

/**
 * Priority badge colors
 */
const PRIORITY_COLORS: Record<QuestPriority, string> = {
    [QuestPriority.LOW]: 'var(--text-muted)',
    [QuestPriority.MEDIUM]: 'var(--interactive-accent)',
    [QuestPriority.HIGH]: '#dc3545',
};

/**
 * Status transition map - what statuses can move to what
 */
const STATUS_TRANSITIONS: Record<QuestStatus, QuestStatus[]> = {
    [QuestStatus.AVAILABLE]: [QuestStatus.ACTIVE],
    [QuestStatus.ACTIVE]: [QuestStatus.IN_PROGRESS, QuestStatus.AVAILABLE],
    [QuestStatus.IN_PROGRESS]: [QuestStatus.COMPLETED, QuestStatus.ACTIVE],
    [QuestStatus.COMPLETED]: [QuestStatus.IN_PROGRESS], // Can reopen
};

/**
 * Button labels for moves
 */
const MOVE_LABELS: Record<QuestStatus, string> = {
    [QuestStatus.AVAILABLE]: '📋 Available',
    [QuestStatus.ACTIVE]: '⚡ Start',
    [QuestStatus.IN_PROGRESS]: '🔨 Working',
    [QuestStatus.COMPLETED]: '✅ Complete',
};

const QuestCardComponent: React.FC<QuestCardProps> = ({
    quest,
    onMove,
    onToggleTask,
    taskProgress,
    tasks,
    visibleTaskCount = 4,
}) => {
    const character = useCharacterStore((state) => state.character);

    // Calculate XP with class bonus indicator
    const baseXP = isManualQuest(quest)
        ? (quest.xpPerTask * (taskProgress?.total || 0)) + quest.completionBonus
        : quest.xpTotal;

    const hasClassBonus = character && CLASS_INFO[character.class].bonusCategories.some(
        cat => quest.category.toLowerCase().includes(cat.toLowerCase())
    );

    // Get available moves for this quest
    const availableMoves = STATUS_TRANSITIONS[quest.status] || [];

    // Get visible tasks (completed + next N incomplete)
    const visibleTasks = React.useMemo(() => {
        if (!tasks) return [];
        const completed = tasks.filter(t => t.completed);
        const incomplete = tasks.filter(t => !t.completed);
        return [...completed, ...incomplete.slice(0, visibleTaskCount)];
    }, [tasks, visibleTaskCount]);

    const hiddenTaskCount = tasks ? tasks.length - visibleTasks.length : 0;

    return (
        <div
            className="qb-quest-card"
            style={{
                borderLeftColor: hasClassBonus ? CLASS_INFO[character!.class].primaryColor : undefined,
                borderLeftWidth: hasClassBonus ? '3px' : undefined,
            }}
        >
            {/* Header */}
            <div className="qb-card-header">
                <span className="qb-card-title">{quest.questName}</span>
                <span
                    className="qb-card-priority"
                    style={{ color: PRIORITY_COLORS[quest.priority] }}
                >
                    {quest.priority === QuestPriority.HIGH ? '🔥' :
                        quest.priority === QuestPriority.LOW ? '📎' : '📌'}
                </span>
            </div>

            {/* Category */}
            <div className="qb-card-category">
                {quest.category}
                {hasClassBonus && (
                    <span className="qb-class-bonus-badge" title="Class bonus applies!">
                        +{CLASS_INFO[character!.class].bonusPercent}%
                    </span>
                )}
            </div>

            {/* Task List */}
            {visibleTasks.length > 0 && (
                <div className="qb-card-tasks">
                    {visibleTasks.map((task) => (
                        <div
                            key={task.lineNumber}
                            className={`qb-task-item ${task.completed ? 'completed' : ''}`}
                            onClick={() => onToggleTask(quest.questId, task.lineNumber)}
                        >
                            <span className="qb-task-checkbox">
                                {task.completed ? '☑' : '☐'}
                            </span>
                            <span className="qb-task-text">{task.text}</span>
                        </div>
                    ))}
                    {hiddenTaskCount > 0 && (
                        <div className="qb-tasks-hidden">
                            +{hiddenTaskCount} more task{hiddenTaskCount > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}

            {/* Progress */}
            {taskProgress && taskProgress.total > 0 && (
                <div className="qb-card-progress">
                    <div className="qb-progress-bar">
                        <div
                            className="qb-progress-fill"
                            style={{
                                width: `${(taskProgress.completed / taskProgress.total) * 100}%`,
                                backgroundColor: hasClassBonus
                                    ? CLASS_INFO[character!.class].primaryColor
                                    : 'var(--interactive-accent)'
                            }}
                        />
                    </div>
                    <span className="qb-progress-text">
                        {taskProgress.completed}/{taskProgress.total} tasks
                    </span>
                </div>
            )}

            {/* XP Reward */}
            <div className="qb-card-xp">
                ⭐ {baseXP} XP
                {hasClassBonus && <span className="qb-bonus-indicator">+bonus</span>}
            </div>

            {/* Action Buttons */}
            <div className="qb-card-actions">
                {availableMoves.map((targetStatus) => (
                    <button
                        key={targetStatus}
                        className={`qb-card-btn ${targetStatus === QuestStatus.COMPLETED ? 'qb-btn-complete' : ''}`}
                        onClick={() => onMove(quest.questId, targetStatus)}
                    >
                        {MOVE_LABELS[targetStatus]}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Memoize for performance
export const QuestCard = memo(QuestCardComponent);

