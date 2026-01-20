/**
 * Quest Card Component
 * 
 * Displays a single quest in the Kanban board.
 * Shows title, category, tasks grouped by sections, progress, and XP reward.
 * Sections are collapsible "Mini Objectives" with completion badges.
 */

import React, { memo, useState } from 'react';
import { Quest, isManualQuest } from '../models/Quest';
import { QuestStatus, QuestPriority } from '../models/QuestStatus';
import { CLASS_INFO } from '../models/Character';
import { useCharacterStore } from '../store/characterStore';
import { TaskSection, Task } from '../services/TaskFileService';

interface QuestCardProps {
    quest: Quest;
    onMove: (questId: string, newStatus: QuestStatus) => void;
    onToggleTask: (questId: string, lineNumber: number) => void;
    taskProgress?: { completed: number; total: number };
    /** Sections with grouped tasks (new) */
    sections?: TaskSection[];
    /** Flat tasks array (legacy fallback) */
    tasks?: Task[];
    visibleTaskCount?: number;
    /** Quest-level collapse state */
    isCollapsed?: boolean;
    /** Callback to toggle quest collapse */
    onToggleCollapse?: () => void;
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
    sections,
    tasks,
    visibleTaskCount = 4,
    isCollapsed = false,
    onToggleCollapse,
}) => {
    const character = useCharacterStore((state) => state.character);

    // Track which sections are collapsed
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

    // Calculate XP with class bonus indicator
    const baseXP = isManualQuest(quest)
        ? (quest.xpPerTask * (taskProgress?.total || 0)) + quest.completionBonus
        : quest.xpTotal;

    const hasClassBonus = character && CLASS_INFO[character.class].bonusCategories.some(
        cat => quest.category.toLowerCase().includes(cat.toLowerCase())
    );

    // Get available moves for this quest
    const availableMoves = STATUS_TRANSITIONS[quest.status] || [];

    // Toggle section collapse
    const toggleSection = (headerText: string) => {
        setCollapsedSections(prev => {
            const next = new Set(prev);
            if (next.has(headerText)) {
                next.delete(headerText);
            } else {
                next.add(headerText);
            }
            return next;
        });
    };

    // Render a single task with indentation
    const renderTask = (task: Task) => (
        <div
            key={task.lineNumber}
            className={`qb-task-item ${task.completed ? 'completed' : ''} ${task.indentLevel > 0 ? 'qb-task-indented' : ''}`}
            style={{ paddingLeft: task.indentLevel * 20 }}
            onClick={() => onToggleTask(quest.questId, task.lineNumber)}
        >
            <span className="qb-task-checkbox">
                {task.completed ? '☑' : '☐'}
            </span>
            <span className="qb-task-text">{task.text}</span>
        </div>
    );

    // Render sections if available
    const renderSections = () => {
        if (!sections || sections.length === 0) {
            // Fallback to flat tasks (legacy)
            if (tasks && tasks.length > 0) {
                const incompleteTasks = tasks.filter(t => !t.completed).slice(0, visibleTaskCount);
                const hiddenCount = tasks.filter(t => !t.completed).length - incompleteTasks.length;

                return (
                    <div className="qb-card-tasks">
                        {incompleteTasks.map(renderTask)}
                        {hiddenCount > 0 && (
                            <div className="qb-tasks-hidden">
                                +{hiddenCount} more task{hiddenCount > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                );
            }
            return null;
        }

        return (
            <div className="qb-card-sections">
                {sections.map((section) => {
                    const isCollapsed = collapsedSections.has(section.headerText);
                    const isComplete = section.completion.completed === section.completion.total;
                    const hasIncompleteTasks = section.incompleteTasks.length > 0;

                    // Skip sections with no tasks at all
                    if (section.tasks.length === 0) return null;

                    return (
                        <div key={section.headerText} className="qb-section">
                            {/* Section Header - Always show */}
                            <div
                                className={`qb-section-header ${isComplete ? 'complete' : ''}`}
                                onClick={() => toggleSection(section.headerText)}
                            >
                                <span className="qb-section-toggle">
                                    {hasIncompleteTasks ? (isCollapsed ? '▶' : '▼') : ''}
                                </span>
                                <span className="qb-section-icon">📋</span>
                                <span className="qb-section-title">{section.headerText}</span>
                                <span className={`qb-section-badge ${isComplete ? 'complete' : ''}`}>
                                    ({section.completion.completed}/{section.completion.total}
                                    {isComplete && ' ✓'})
                                </span>
                            </div>

                            {/* Section Tasks - Only show first N incomplete, hidden when collapsed */}
                            {!isCollapsed && hasIncompleteTasks && (() => {
                                const visibleTasks = section.incompleteTasks.slice(0, visibleTaskCount);
                                const hiddenCount = section.incompleteTasks.length - visibleTasks.length;

                                return (
                                    <div className="qb-section-tasks">
                                        {visibleTasks.map(renderTask)}
                                        {hiddenCount > 0 && (
                                            <div className="qb-tasks-hidden">
                                                +{hiddenCount} more task{hiddenCount > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    );
                })}
            </div>
        );
    };

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
                {onToggleCollapse && (
                    <button
                        className="qb-card-collapse-toggle"
                        onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
                        title={isCollapsed ? 'Expand quest' : 'Collapse quest'}
                    >
                        {isCollapsed ? '▶' : '▼'}
                    </button>
                )}
                <span className="qb-card-title">{quest.questName}</span>
                <span
                    className="qb-card-priority"
                    style={{ color: PRIORITY_COLORS[quest.priority] }}
                >
                    {quest.priority === QuestPriority.HIGH ? '🔥' :
                        quest.priority === QuestPriority.LOW ? '📎' : '📌'}
                </span>
            </div>

            {/* Collapsible Body */}
            {!isCollapsed && (
                <>
                    {/* Category */}
                    <div className="qb-card-category">
                        {quest.category}
                        {hasClassBonus && (
                            <span className="qb-class-bonus-badge" title="Class bonus applies!">
                                +{CLASS_INFO[character!.class].bonusPercent}%
                            </span>
                        )}
                    </div>

                    {/* Sections or Tasks */}
                    {renderSections()}

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
                </>
            )}
        </div>
    );
};

// Memoize for performance
export const QuestCard = memo(QuestCardComponent);
