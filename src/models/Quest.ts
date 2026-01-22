/**
 * Quest Data Model
 * 
 * Core quest data structure with schema versioning for future migrations.
 */

import { QuestStatus, QuestPriority, QuestType, QuestDifficulty } from './QuestStatus';

/** Current schema version - increment when making breaking changes */
export const QUEST_SCHEMA_VERSION = 1;

/**
 * Quest milestone structure
 */
export interface QuestMilestone {
    id: number;
    title: string;
    description: string;
    xp: number;
    revealed: boolean;
    completed: boolean;
    isBossFight: boolean;
    tasks: string[];
}

/**
 * Timeline event for quest history
 */
export interface QuestTimelineEvent {
    date: string;
    event: string;
}

/**
 * Hidden reward structure
 */
export interface HiddenReward {
    id: string;
    type: 'achievement' | 'gear' | 'consumable' | 'xp-bonus';
    revealed: boolean;
    data: Record<string, unknown>;
}

/**
 * Base Quest interface (shared between manual and AI-generated)
 */
export interface BaseQuest {
    /** Schema version for migrations */
    schemaVersion: number;

    /** Unique identifier (kebab-case) */
    questId: string;

    /** Display name */
    questName: string;

    /** Quest classification */
    questType: QuestType;

    /** Category for filtering (admin, shopping, school, etc.) */
    category: string;

    /** Current quest status */
    status: QuestStatus;

    /** Priority level */
    priority: QuestPriority;

    /** Tags for filtering */
    tags: string[];

    /** ISO 8601 date string */
    createdDate: string;

    /** ISO 8601 date string (null until completed) */
    completedDate: string | null;

    /** Quest timeline history */
    timeline: QuestTimelineEvent[];

    /** Internal notes */
    notes: string;
}

/**
 * Manual Quest (Markdown-based)
 * Loads from quests/main/ folder
 */
export interface ManualQuest extends BaseQuest {
    questType: QuestType.MAIN | QuestType.TRAINING | QuestType.SIDE;

    /** Custom sort order within status column (lower = higher in list) */
    sortOrder?: number;

    /** Path to the markdown file containing tasks (for single file) */
    linkedTaskFile: string;

    /** Paths to multiple task files (optional, aggregates with linkedTaskFile) */
    linkedTaskFiles?: string[];

    /** XP awarded per task completion */
    xpPerTask: number;

    /** Bonus XP on quest completion */
    completionBonus: number;

    /** How many future tasks to show (default: 4) */
    visibleTasks: number;

    /** Milestone definitions */
    milestones: QuestMilestone[];

    /** Recurrence rule for auto-generated quests */
    recurrence?: 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'monthly';

    /** Template ID this quest was generated from (for recurring quests) */
    recurringTemplateId?: string;

    /** Date this recurring instance is for (YYYY-MM-DD format) */
    instanceDate?: string;
}

/**
 * AI-Generated Quest (JSON-based)
 * Loads from quests/ai-generated/ folder
 */
export interface AIGeneratedQuest extends BaseQuest {
    questType: QuestType.AI_GENERATED;

    /** Quest flavor text */
    description: string;

    /** What constitutes completion */
    goal: string;

    /** Difficulty level */
    difficulty: QuestDifficulty;

    /** Human-readable time estimate */
    estimatedDuration: string;

    /** Total XP available (sum of milestones) */
    xpTotal: number;

    /** How many tasks ahead shown */
    visibleTasks: number;

    /** Quest stages */
    milestones: QuestMilestone[];

    /** Surprise unlocks */
    hiddenRewards: HiddenReward[];

    /** Equipment unlocks */
    gearRewards: string[];
}

/**
 * Union type for all quest types
 */
export type Quest = ManualQuest | AIGeneratedQuest;

/**
 * Type guard for ManualQuest
 */
export function isManualQuest(quest: Quest): quest is ManualQuest {
    return quest.questType !== QuestType.AI_GENERATED;
}

/**
 * Type guard for AIGeneratedQuest
 */
export function isAIGeneratedQuest(quest: Quest): quest is AIGeneratedQuest {
    return quest.questType === QuestType.AI_GENERATED;
}

/**
 * Create a new empty manual quest
 */
export function createManualQuest(
    questId: string,
    questName: string,
    category: string,
    linkedTaskFile: string
): ManualQuest {
    return {
        schemaVersion: QUEST_SCHEMA_VERSION,
        questId,
        questName,
        questType: QuestType.MAIN,
        category,
        status: QuestStatus.AVAILABLE,
        priority: QuestPriority.MEDIUM,
        tags: [],
        createdDate: new Date().toISOString(),
        completedDate: null,
        timeline: [{ date: new Date().toISOString(), event: 'Quest created' }],
        notes: '',
        linkedTaskFile,
        xpPerTask: 5,
        completionBonus: 30,
        visibleTasks: 4,
        milestones: [],
    };
}
