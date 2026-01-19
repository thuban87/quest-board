/**
 * Quest Status Enum
 * 
 * Represents the possible states of a quest in the Kanban board.
 */

export enum QuestStatus {
    /** Quest is available but not yet started */
    AVAILABLE = 'available',

    /** Quest has been started but not actively being worked on */
    IN_PROGRESS = 'in-progress',

    /** Quest is currently being actively worked on */
    ACTIVE = 'active',

    /** Quest has been completed */
    COMPLETED = 'completed',
}

/**
 * Quest priority levels
 */
export enum QuestPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

/**
 * Quest type classification
 */
export enum QuestType {
    MAIN = 'main',
    TRAINING = 'training',
    SIDE = 'side',
    AI_GENERATED = 'ai-generated',
}

/**
 * Quest difficulty levels (for AI-generated quests)
 */
export enum QuestDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
    EPIC = 'epic',
}
