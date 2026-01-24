/**
 * Quest and Character Validator
 * 
 * Validates data structures loaded from user-editable files.
 * Includes schema version checking for future migrations.
 */

import { Notice } from 'obsidian';
import { Quest, QUEST_SCHEMA_VERSION } from '../models/Quest';
import { QuestStatus, QuestPriority } from '../models/QuestStatus';
import { Character, CHARACTER_SCHEMA_VERSION, CharacterClass } from '../models/Character';
import { GearItem, GearSlot, GearTier, ALL_GEAR_SLOTS, GEAR_TIERS } from '../models/Gear';

/**
 * Validation result
 */
export interface ValidationResult<T> {
    valid: boolean;
    data: T | null;
    errors: string[];
}

/**
 * Valid quest status values
 */
const VALID_STATUSES = Object.values(QuestStatus);

/**
 * Valid priority values
 */
const VALID_PRIORITIES = Object.values(QuestPriority);

/**
 * Valid character classes
 */
const VALID_CLASSES: CharacterClass[] = [
    'warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'
];

/**
 * Validate and migrate quest data
 */
export function validateQuest(data: unknown): ValidationResult<Quest> {
    const errors: string[] = [];

    // Type guard
    if (typeof data !== 'object' || data === null) {
        return { valid: false, data: null, errors: ['Invalid data: not an object'] };
    }

    const quest = data as Record<string, unknown>;

    // Schema version check and migration
    if (!quest.schemaVersion) {
        quest.schemaVersion = 1; // Assume v1 for legacy files
    }

    // Future migration logic would go here:
    // if (quest.schemaVersion < 2) {
    //   quest = migrateV1ToV2(quest);
    // }

    // Required fields
    if (!quest.questId || typeof quest.questId !== 'string') {
        errors.push('Missing or invalid questId');
    }

    if (!quest.questName || typeof quest.questName !== 'string') {
        errors.push('Missing or invalid questName');
    }

    if (!quest.questType || typeof quest.questType !== 'string') {
        errors.push('Missing or invalid questType');
    }

    if (!quest.category || typeof quest.category !== 'string') {
        errors.push('Missing or invalid category');
    }

    // Type coercion for common mistakes
    if (typeof quest.xpPerTask === 'string') {
        quest.xpPerTask = parseInt(quest.xpPerTask as string) || 0;
    }
    if (typeof quest.completionBonus === 'string') {
        quest.completionBonus = parseInt(quest.completionBonus as string) || 0;
    }
    if (typeof quest.visibleTasks === 'string') {
        quest.visibleTasks = parseInt(quest.visibleTasks as string) || 4;
    }

    // Enum validation with defaults
    if (!quest.status || !VALID_STATUSES.includes(quest.status as QuestStatus)) {
        quest.status = QuestStatus.AVAILABLE;
    }
    if (!quest.priority || !VALID_PRIORITIES.includes(quest.priority as QuestPriority)) {
        quest.priority = QuestPriority.MEDIUM;
    }

    // Ensure arrays exist
    if (!Array.isArray(quest.tags)) {
        quest.tags = [];
    }
    if (!Array.isArray(quest.timeline)) {
        quest.timeline = [];
    }
    if (!Array.isArray(quest.milestones)) {
        quest.milestones = [];
    }

    // Ensure dates
    if (!quest.createdDate) {
        quest.createdDate = new Date().toISOString();
    }

    if (errors.length > 0) {
        return { valid: false, data: null, errors };
    }

    return { valid: true, data: quest as unknown as Quest, errors: [] };
}

/**
 * Validate quest and show notice on failure
 */
export function validateQuestWithNotice(
    data: unknown,
    fileName: string
): Quest | null {
    const result = validateQuest(data);

    if (!result.valid) {
        console.error(`[Validator] Quest "${fileName}" validation failed:`, result.errors);
        new Notice(`Quest file "${fileName}" is invalid. Check console for details.`);
        return null;
    }

    return result.data;
}

/**
 * Validate character data
 */
export function validateCharacter(data: unknown): ValidationResult<Character> {
    const errors: string[] = [];

    if (typeof data !== 'object' || data === null) {
        return { valid: false, data: null, errors: ['Invalid data: not an object'] };
    }

    const character = data as Record<string, unknown>;

    // Schema version
    if (!character.schemaVersion) {
        character.schemaVersion = CHARACTER_SCHEMA_VERSION;
    }

    // Required string fields
    if (!character.name || typeof character.name !== 'string') {
        errors.push('Missing or invalid name');
    }

    // Class validation
    if (!character.class || !VALID_CLASSES.includes(character.class as CharacterClass)) {
        errors.push(`Invalid class: ${character.class}`);
    }

    // Secondary class (can be null)
    if (character.secondaryClass !== null &&
        !VALID_CLASSES.includes(character.secondaryClass as CharacterClass)) {
        character.secondaryClass = null;
    }

    // Numeric fields with defaults
    if (typeof character.level !== 'number' || character.level < 1) {
        character.level = 1;
    }
    if (typeof character.totalXP !== 'number' || character.totalXP < 0) {
        character.totalXP = 0;
    }
    if (typeof character.spriteVersion !== 'number') {
        character.spriteVersion = 1;
    }

    // Training mode fields
    if (typeof character.trainingXP !== 'number') {
        character.trainingXP = 0;
    }
    if (typeof character.trainingLevel !== 'number') {
        character.trainingLevel = 1;
    }
    if (typeof character.isTrainingMode !== 'boolean') {
        character.isTrainingMode = true;
    }

    // Appearance (use defaults if missing)
    if (typeof character.appearance !== 'object' || character.appearance === null) {
        character.appearance = {
            skinTone: 'light',
            hairStyle: 'short',
            hairColor: 'brown',
            accessory: 'none',
            outfitPrimary: '#6f42c1',
            outfitSecondary: '#ffc107',
        };
    }

    // Equipped gear
    if (!Array.isArray(character.equippedGear)) {
        character.equippedGear = [];
    }

    if (errors.length > 0) {
        return { valid: false, data: null, errors };
    }

    return { valid: true, data: character as unknown as Character, errors: [] };
}

/**
 * Valid gear sources
 */
const VALID_GEAR_SOURCES = ['quest', 'combat', 'exploration', 'shop', 'starter', 'smelt'];

/**
 * Validate gear item data
 */
export function validateGearItem(data: unknown): ValidationResult<GearItem> {
    const errors: string[] = [];

    if (typeof data !== 'object' || data === null) {
        return { valid: false, data: null, errors: ['Invalid data: not an object'] };
    }

    const item = data as Record<string, unknown>;

    // Required string fields
    if (!item.id || typeof item.id !== 'string') {
        errors.push('Missing or invalid id');
    }
    if (!item.name || typeof item.name !== 'string') {
        errors.push('Missing or invalid name');
    }
    if (typeof item.description !== 'string') {
        item.description = '';
    }

    // Slot validation
    if (!item.slot || !ALL_GEAR_SLOTS.includes(item.slot as GearSlot)) {
        errors.push(`Invalid slot: ${item.slot}`);
    }

    // Tier validation
    if (!item.tier || !GEAR_TIERS.includes(item.tier as GearTier)) {
        errors.push(`Invalid tier: ${item.tier}`);
    }

    // Level validation
    if (typeof item.level !== 'number' || item.level < 1 || item.level > 40) {
        errors.push(`Invalid level: ${item.level}`);
    }

    // Stats validation (basic check)
    if (typeof item.stats !== 'object' || item.stats === null) {
        errors.push('Missing or invalid stats');
    }

    // Sell value
    if (typeof item.sellValue !== 'number' || item.sellValue < 0) {
        item.sellValue = 0;
    }

    // Icon emoji fallback
    if (typeof item.iconEmoji !== 'string') {
        item.iconEmoji = '❓';
    }

    // Source validation
    if (!item.source || !VALID_GEAR_SOURCES.includes(item.source as string)) {
        item.source = 'quest';
    }

    // Acquired date
    if (typeof item.acquiredAt !== 'string') {
        item.acquiredAt = new Date().toISOString();
    }

    if (errors.length > 0) {
        return { valid: false, data: null, errors };
    }

    return { valid: true, data: item as unknown as GearItem, errors: [] };
}
