/**
 * Quest Card Component
 * 
 * Displays a single quest in the Kanban board.
 * Shows title, category, tasks grouped by sections, progress, and XP reward.
 * Sections are collapsible "Mini Objectives" with completion badges.
 */

import React, { memo, useState, useMemo } from 'react';
import { App as ObsidianApp, Menu } from 'obsidian';
import { Quest, isManualQuest } from '../models/Quest';
import { QuestPriority } from '../models/QuestStatus';
import { CustomColumn } from '../models/CustomColumn';
import { CLASS_INFO } from '../models/Character';
import { useCharacterStore } from '../store/characterStore';
import { TaskSection, Task } from '../services/TaskFileService';

interface QuestCardProps {
    quest: Quest;
    /** Move quest to a new column (by column ID) */
    onMove: (questId: string, newStatus: string) => void;
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
    /** Obsidian App instance for opening files */
    app?: ObsidianApp;
    /** Storage folder path for locating quest files */
    storageFolder?: string;
    /** Callback to save quest as template */
    onSaveAsTemplate?: (quest: Quest) => void;
    /** Available columns from ColumnConfigService */
    columns?: CustomColumn[];
    /** Complete quest (awards rewards) */
    onComplete?: (questId: string) => void;
    /** Reopen a completed quest */
    onReopen?: (questId: string) => void;
    /** Archive a quest */
    onArchive?: (questId: string) => void;
}

/**
 * Priority badge colors
 */
const PRIORITY_COLORS: Record<QuestPriority, string> = {
    [QuestPriority.LOW]: 'var(--text-muted)',
    [QuestPriority.MEDIUM]: 'var(--interactive-accent)',
    [QuestPriority.HIGH]: '#dc3545',
    [QuestPriority.CRITICAL]: '#ff4500',
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
    app,
    storageFolder,
    onSaveAsTemplate,
    columns,
    onComplete,
    onReopen,
    onArchive,
}) => {
    const character = useCharacterStore((state) => state.character);

    // Track which sections are collapsed
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

    // Check if quest is completed (based on completedDate, not column)
    // A quest is completed if it has a completedDate, regardless of which column it's in
    const isCompleted = useMemo(() => {
        return !!quest.completedDate;
    }, [quest.completedDate]);

    // Check if there's ANY completion column in the config
    const hasCompletionColumn = useMemo(() => {
        if (!columns || columns.length === 0) return false;
        return columns.some(c => c.triggersCompletion);
    }, [columns]);

    // Get available moves: all columns except current
    const availableMoves = useMemo(() => {
        if (!columns || columns.length === 0) return [];
        return columns.filter(col => col.id !== quest.status);
    }, [columns, quest.status]);

    // Handler to open the quest file itself
    const handleOpenQuestFile = () => {
        if (!app || !isManualQuest(quest)) return;
        const questFilePath = quest.filePath || quest.path;
        if (!questFilePath) return;
        app.workspace.openLinkText(questFilePath, '', false);
    };

    // Handler to open the linked task file (only if different from quest file)
    const handleOpenLinkedTaskFile = () => {
        if (!app || !isManualQuest(quest)) return;
        app.workspace.openLinkText(quest.linkedTaskFile, '', true);
    };

    // Determine if the linked task file is different from the quest file
    const getLinkedFileIsDifferent = (): boolean => {
        if (!isManualQuest(quest)) return false;
        const questFilePath = quest.filePath || quest.path || '';
        // Normalize paths for comparison
        const normalizedQuestPath = questFilePath.toLowerCase().replace(/\\/g, '/');
        const normalizedLinkedPath = quest.linkedTaskFile?.toLowerCase().replace(/\\/g, '/');
        return !!(normalizedLinkedPath && normalizedLinkedPath !== normalizedQuestPath);
    };

    // Calculate XP with class bonus indicator
    const baseXP = isManualQuest(quest)
        ? (quest.xpPerTask * (taskProgress?.total || 0)) + quest.completionBonus
        : quest.xpTotal;

    const hasClassBonus = character && CLASS_INFO[character.class].bonusCategories.some(
        cat => quest.category.toLowerCase().includes(cat.toLowerCase())
    );

    // Handle right-click context menu
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const menu = new Menu();

        // Complete option (if not completed)
        if (!isCompleted && onComplete) {
            menu.addItem((item) => {
                item
                    .setTitle('✅ Complete Quest')
                    .setIcon('check')
                    .onClick(() => onComplete(quest.questId));
            });
        }

        // Archive option (if completed)
        if (isCompleted && onArchive) {
            menu.addItem((item) => {
                item
                    .setTitle('📦 Archive Quest')
                    .setIcon('archive')
                    .onClick(() => onArchive(quest.questId));
            });
        }

        // Reopen option (if completed)
        if (isCompleted && onReopen) {
            menu.addItem((item) => {
                item
                    .setTitle('🔄 Reopen Quest')
                    .setIcon('undo')
                    .onClick(() => onReopen(quest.questId));
            });
        }

        // Save as Template option
        if (onSaveAsTemplate && isManualQuest(quest)) {
            menu.addItem((item) => {
                item
                    .setTitle('📜 Save as Template')
                    .setIcon('scroll')
                    .onClick(() => onSaveAsTemplate(quest));
            });
        }

        // Open Quest File
        if (app && isManualQuest(quest) && (quest.filePath || quest.path)) {
            menu.addItem((item) => {
                item
                    .setTitle('📄 Open Quest File')
                    .setIcon('file-text')
                    .onClick(() => handleOpenQuestFile());
            });
        }

        // Open Linked Task File
        if (app && isManualQuest(quest) && getLinkedFileIsDifferent()) {
            menu.addItem((item) => {
                item
                    .setTitle('🔗 Open Linked File')
                    .setIcon('link')
                    .onClick(() => handleOpenLinkedTaskFile());
            });
        }

        menu.showAtMouseEvent(e.nativeEvent);
    };

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
                    const isSectionCollapsed = collapsedSections.has(section.headerText);
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
                                    {hasIncompleteTasks ? (isSectionCollapsed ? '▶' : '▼') : ''}
                                </span>
                                <span className="qb-section-icon">📋</span>
                                <span className="qb-section-title">{section.headerText}</span>
                                <span className={`qb-section-badge ${isComplete ? 'complete' : ''}`}>
                                    ({section.completion.completed}/{section.completion.total}
                                    {isComplete && ' ✓'})
                                </span>
                            </div>

                            {/* Section Tasks - Only show first N incomplete, hidden when collapsed */}
                            {!isSectionCollapsed && hasIncompleteTasks && (() => {
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
            className={`qb-quest-card ${isCompleted ? 'completed' : ''}`}
            onContextMenu={handleContextMenu}
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
                    {quest.priority === QuestPriority.CRITICAL ? '🚨' :
                        quest.priority === QuestPriority.HIGH ? '🔥' :
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

                    {/* XP Reward with Open File Links */}
                    <div className="qb-card-xp">
                        <span>
                            ⭐ {baseXP} XP
                            {hasClassBonus && <span className="qb-bonus-indicator">+bonus</span>}
                        </span>
                        <div className="qb-card-file-links">
                            {/* Quest file link (always shown) */}
                            {app && isManualQuest(quest) && (quest.filePath || quest.path) && (
                                <button
                                    className="qb-card-file-link"
                                    onClick={(e) => { e.stopPropagation(); handleOpenQuestFile(); }}
                                    title="Open quest file"
                                >
                                    📄
                                </button>
                            )}
                            {/* Linked task file link (only if different from quest file) */}
                            {app && isManualQuest(quest) && getLinkedFileIsDifferent() && (
                                <button
                                    className="qb-card-file-link"
                                    onClick={(e) => { e.stopPropagation(); handleOpenLinkedTaskFile(); }}
                                    title="Open linked task file"
                                >
                                    🔗
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="qb-card-actions">
                        {/* Not completed: show move buttons and Complete button */}
                        {!isCompleted && (
                            <>
                                {/* Move buttons for each column except current */}
                                {availableMoves.map((col) => (
                                    <button
                                        key={col.id}
                                        className="qb-card-btn"
                                        onClick={() => onMove(quest.questId, col.id)}
                                    >
                                        {col.emoji} {col.title}
                                    </button>
                                ))}
                                {/* Complete button - only show if NO completion column exists */}
                                {onComplete && !hasCompletionColumn && (
                                    <button
                                        className="qb-card-btn qb-btn-complete"
                                        onClick={() => onComplete(quest.questId)}
                                    >
                                        ✅ Complete
                                    </button>
                                )}
                            </>
                        )}

                        {/* Completed: show Reopen and Archive buttons */}
                        {isCompleted && (
                            <div className="qb-completed-actions">
                                {onReopen && (
                                    <button
                                        className="qb-card-btn"
                                        onClick={() => onReopen(quest.questId)}
                                    >
                                        🔄 Reopen
                                    </button>
                                )}
                                {onArchive && (
                                    <button
                                        className="qb-card-btn"
                                        onClick={() => onArchive(quest.questId)}
                                    >
                                        📦 Archive
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// Memoize for performance
export const QuestCard = memo(QuestCardComponent);
