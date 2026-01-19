/**
 * Task File Service
 * 
 * Reads and watches markdown files that contain quest tasks.
 * Parses checkbox tasks and tracks completion state.
 */

import { Vault, TFile, debounce } from 'obsidian';
import { validateLinkedPath } from '../utils/pathValidator';

/**
 * Represents a single task from a markdown file
 */
export interface Task {
    /** Original line number in the file */
    lineNumber: number;

    /** Task text (without checkbox) */
    text: string;

    /** Whether the task is completed */
    completed: boolean;

    /** Indentation level (0 = top level) */
    indentLevel: number;
}

/**
 * Result of reading tasks from a file
 */
export interface TaskFileResult {
    success: boolean;
    tasks: Task[];
    error?: string;
    filePath: string;
    lastModified: number;
}

/**
 * Task completion summary
 */
export interface TaskCompletion {
    completed: number;
    total: number;
    percentComplete: number;
}

/**
 * A section of tasks grouped under a markdown header (## or ###)
 */
export interface TaskSection {
    /** Section header text (from ## or ### heading) */
    headerText: string;
    /** Header level (2 for ##, 3 for ###) */
    level: number;
    /** Tasks in this section (all tasks, for XP tracking) */
    tasks: Task[];
    /** Incomplete tasks only (for display) */
    incompleteTasks: Task[];
    /** Completion stats for this section */
    completion: TaskCompletion;
}

/**
 * Regex to match markdown checkboxes
 * Matches: - [ ] task, - [x] task, * [ ] task, * [x] task
 * Also matches numbered lists: 1. [ ] task
 */
const TASK_REGEX = /^(\s*)(?:[-*]|\d+\.)\s+\[([ xX])\]\s+(.+)$/;

/**
 * Parse a single line into a Task object
 */
function parseTaskLine(line: string, lineNumber: number): Task | null {
    const match = line.match(TASK_REGEX);
    if (!match) return null;

    const [, indent, checkbox, text] = match;

    return {
        lineNumber,
        text: text.trim(),
        completed: checkbox.toLowerCase() === 'x',
        indentLevel: Math.floor(indent.length / 2), // Assume 2-space indentation
    };
}

/**
 * Read all tasks from a markdown file
 */
export async function readTasksFromFile(
    vault: Vault,
    filePath: string
): Promise<TaskFileResult> {
    // Validate path
    const file = validateLinkedPath(vault, filePath);
    if (!file) {
        return {
            success: false,
            tasks: [],
            error: `File not found or invalid path: ${filePath}`,
            filePath,
            lastModified: 0,
        };
    }

    try {
        const content = await vault.cachedRead(file);
        const lines = content.split('\n');
        const tasks: Task[] = [];

        lines.forEach((line, index) => {
            const task = parseTaskLine(line, index + 1); // 1-indexed
            if (task) {
                tasks.push(task);
            }
        });

        return {
            success: true,
            tasks,
            filePath,
            lastModified: file.stat.mtime,
        };
    } catch (error) {
        return {
            success: false,
            tasks: [],
            error: `Failed to read file: ${error}`,
            filePath,
            lastModified: 0,
        };
    }
}

/**
 * Get task completion statistics
 */
export function getTaskCompletion(tasks: Task[]): TaskCompletion {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;

    return {
        completed,
        total,
        percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
}

/**
 * Regex to match markdown headers (## or ###)
 */
const HEADER_REGEX = /^(#{2,3})\s+(.+)$/;

/**
 * Read tasks from a file, grouped by section headers
 * Parses ## and ### as section dividers
 */
export async function readTasksWithSections(
    vault: Vault,
    filePath: string
): Promise<{ success: boolean; sections: TaskSection[]; allTasks: Task[]; error?: string }> {
    const file = validateLinkedPath(vault, filePath);
    if (!file) {
        return {
            success: false,
            sections: [],
            allTasks: [],
            error: `File not found or invalid path: ${filePath}`,
        };
    }

    try {
        const content = await vault.cachedRead(file);
        const lines = content.split('\n');

        const sections: TaskSection[] = [];
        const allTasks: Task[] = [];

        // Start with a "General" section for tasks before any header
        let currentSection: TaskSection = {
            headerText: 'General',
            level: 0,
            tasks: [],
            incompleteTasks: [],
            completion: { completed: 0, total: 0, percentComplete: 0 },
        };

        lines.forEach((line, index) => {
            const lineNumber = index + 1;

            // Check for header
            const headerMatch = line.match(HEADER_REGEX);
            if (headerMatch) {
                // Save previous section if it has tasks
                if (currentSection.tasks.length > 0) {
                    currentSection.completion = getTaskCompletion(currentSection.tasks);
                    currentSection.incompleteTasks = currentSection.tasks.filter(t => !t.completed);
                    sections.push(currentSection);
                }

                // Start new section
                const level = headerMatch[1].length; // 2 for ##, 3 for ###
                currentSection = {
                    headerText: headerMatch[2].trim(),
                    level,
                    tasks: [],
                    incompleteTasks: [],
                    completion: { completed: 0, total: 0, percentComplete: 0 },
                };
                return;
            }

            // Check for task
            const task = parseTaskLine(line, lineNumber);
            if (task) {
                currentSection.tasks.push(task);
                allTasks.push(task);
            }
        });

        // Don't forget the last section
        if (currentSection.tasks.length > 0) {
            currentSection.completion = getTaskCompletion(currentSection.tasks);
            currentSection.incompleteTasks = currentSection.tasks.filter(t => !t.completed);
            sections.push(currentSection);
        }

        return {
            success: true,
            sections,
            allTasks,
        };
    } catch (error) {
        return {
            success: false,
            sections: [],
            allTasks: [],
            error: `Failed to read file: ${error}`,
        };
    }
}

/**
 * Get only the visible tasks (next N incomplete + all completed)
 */
export function getVisibleTasks(tasks: Task[], visibleCount: number): Task[] {
    const completed = tasks.filter(t => t.completed);
    const incomplete = tasks.filter(t => !t.completed);

    // Show completed + next N incomplete
    return [...completed, ...incomplete.slice(0, visibleCount)];
}

/**
 * Count newly completed tasks between two task snapshots
 */
export function countNewlyCompleted(
    oldTasks: Task[],
    newTasks: Task[]
): number {
    let newlyCompleted = 0;

    for (const newTask of newTasks) {
        if (newTask.completed) {
            // Find matching old task by line number
            const oldTask = oldTasks.find(t => t.lineNumber === newTask.lineNumber);
            if (oldTask && !oldTask.completed) {
                newlyCompleted++;
            }
        }
    }

    return newlyCompleted;
}

/**
 * Create a debounced file watcher for a task file
 * Returns an unsubscribe function
 */
export function watchTaskFile(
    vault: Vault,
    filePath: string,
    callback: (result: TaskFileResult) => void,
    debounceMs: number = 300
): () => void {
    // Create debounced callback
    const debouncedCallback = debounce(async (file: TFile) => {
        const result = await readTasksFromFile(vault, filePath);
        callback(result);
    }, debounceMs, true);

    // Register event handlers
    const onModify = vault.on('modify', (file) => {
        if (file.path === filePath) {
            debouncedCallback(file as TFile);
        }
    });

    // Return unsubscribe function
    return () => {
        vault.offref(onModify);
    };
}

/**
 * Toggle a task's completion status in a file
 */
export async function toggleTaskInFile(
    vault: Vault,
    filePath: string,
    lineNumber: number
): Promise<boolean> {
    const file = validateLinkedPath(vault, filePath);
    if (!file) return false;

    try {
        const content = await vault.read(file);
        const lines = content.split('\n');
        const lineIndex = lineNumber - 1; // Convert to 0-indexed

        if (lineIndex < 0 || lineIndex >= lines.length) return false;

        const line = lines[lineIndex];

        // Toggle checkbox
        if (line.includes('[ ]')) {
            lines[lineIndex] = line.replace('[ ]', '[x]');
        } else if (line.includes('[x]') || line.includes('[X]')) {
            lines[lineIndex] = line.replace(/\[[xX]\]/, '[ ]');
        } else {
            return false; // Not a task line
        }

        await vault.modify(file, lines.join('\n'));
        return true;
    } catch (error) {
        console.error('[TaskFileService] Failed to toggle task:', error);
        return false;
    }
}
