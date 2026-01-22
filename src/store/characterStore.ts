/**
 * Character Store
 * 
 * Zustand store for character state management.
 * Synced with plugin settings via loadData/saveData.
 */

import { create } from 'zustand';
import { Character, CharacterClass, CLASS_INFO, CharacterAppearance, ActivePowerUp } from '../models';
import { InventoryItem } from '../models/Consumable';
import { Achievement } from '../models/Achievement';
import { calculateTrainingLevel, calculateLevel, XP_THRESHOLDS } from '../services/XPSystem';

interface CharacterState {
    /** Current character (null if not created) */
    character: Character | null;

    /** Inventory items */
    inventory: InventoryItem[];

    /** Unlocked achievements */
    achievements: Achievement[];

    /** Whether character data is loading */
    loading: boolean;
}

interface CharacterActions {
    /** Set character from loaded data */
    setCharacter: (character: Character | null) => void;

    /** Create a new character */
    createCharacter: (name: string, characterClass: CharacterClass, appearance: Partial<CharacterAppearance>) => Character;

    /** Update character name */
    updateName: (name: string) => void;

    /** Add XP and check for level up */
    addXP: (amount: number) => void;

    /** Update appearance and increment spriteVersion */
    updateAppearance: (appearance: Partial<CharacterAppearance>) => void;

    /** Change character class (costs XP) */
    changeClass: (newClass: CharacterClass) => boolean;

    /** Unlock secondary class at level 25 */
    unlockSecondaryClass: (secondaryClass: CharacterClass) => boolean;

    /** Toggle training mode */
    setTrainingMode: (isTraining: boolean) => void;

    /** Graduate from training mode to Level 1 */
    graduate: () => void;

    /** Add item to inventory */
    addInventoryItem: (itemId: string, quantity?: number) => void;

    /** Remove item from inventory */
    removeInventoryItem: (itemId: string, quantity?: number) => void;

    /** Unlock achievement */
    unlockAchievement: (achievement: Partial<Achievement> & { id: string }) => void;

    /** Set loading state */
    setLoading: (loading: boolean) => void;

    /** Set inventory and achievements from loaded data */
    setInventoryAndAchievements: (inventory: InventoryItem[], achievements: Achievement[]) => void;

    /** Update active power-ups array */
    setPowerUps: (powerUps: ActivePowerUp[]) => void;

    /** Increment tasks completed today (for First Blood trigger, persisted) */
    incrementTasksToday: (count: number, dateString: string) => void;
}

type CharacterStore = CharacterState & CharacterActions;

// NOTE: XP_THRESHOLDS and calculateLevel are imported from XPSystem.ts

/**
 * Character store hook
 */
export const useCharacterStore = create<CharacterStore>((set, get) => ({
    // Initial state
    character: null,
    inventory: [],
    achievements: [],
    loading: false,

    // Actions
    setCharacter: (character) => {
        if (character) {
            // Recalculate training level in case thresholds changed
            const newTrainingLevel = calculateTrainingLevel(character.trainingXP);
            if (character.trainingLevel !== newTrainingLevel) {
                character = {
                    ...character,
                    trainingLevel: newTrainingLevel,
                };
            }
        }
        set({ character, loading: false });
    },

    createCharacter: (name, characterClass, appearance) => {
        const classInfo = CLASS_INFO[characterClass];
        const now = new Date().toISOString();

        // Get starting stats for this class
        const baseStats = {
            strength: 10,
            intelligence: 10,
            wisdom: 10,
            constitution: 10,
            dexterity: 10,
            charisma: 10,
        };
        // Add +2 to primary stats
        for (const primaryStat of classInfo.primaryStats) {
            baseStats[primaryStat] += 2;
        }

        const character: Character = {
            schemaVersion: 1,
            name,
            class: characterClass,
            secondaryClass: null,
            level: 1,
            totalXP: 0,
            spriteVersion: 1,
            appearance: {
                skinTone: appearance.skinTone || 'light',
                hairStyle: appearance.hairStyle || 'short',
                hairColor: appearance.hairColor || 'brown',
                accessory: appearance.accessory || 'none',
                outfitPrimary: appearance.outfitPrimary || classInfo.primaryColor,
                outfitSecondary: appearance.outfitSecondary || '#ffc107',
            },
            equippedGear: [],
            trainingXP: 0,
            trainingLevel: 1,
            isTrainingMode: true,
            baseStats,
            statBonuses: {
                strength: 0,
                intelligence: 0,
                wisdom: 0,
                constitution: 0,
                dexterity: 0,
                charisma: 0,
            },
            categoryXPAccumulator: {},
            currentStreak: 0,
            highestStreak: 0,
            lastQuestCompletionDate: null,
            shieldUsedThisWeek: false,
            createdDate: now,
            lastModified: now,
            tasksCompletedToday: 0,
            lastTaskDate: null,
            activePowerUps: [],
        };

        set({ character });
        return character;
    },

    updateName: (name) => {
        const { character } = get();
        if (character) {
            set({
                character: {
                    ...character,
                    name,
                    lastModified: new Date().toISOString(),
                },
            });
        }
    },

    addXP: (amount) => {
        const { character } = get();
        if (!character) return;

        const isTraining = character.isTrainingMode;

        if (isTraining) {
            const newTrainingXP = character.trainingXP + amount;
            const newTrainingLevel = calculateTrainingLevel(newTrainingXP);

            set({
                character: {
                    ...character,
                    trainingXP: newTrainingXP,
                    trainingLevel: newTrainingLevel,
                    lastModified: new Date().toISOString(),
                },
            });
        } else {
            const newTotalXP = character.totalXP + amount;
            const newLevel = calculateLevel(newTotalXP);

            set({
                character: {
                    ...character,
                    totalXP: newTotalXP,
                    level: newLevel,
                    lastModified: new Date().toISOString(),
                },
            });
        }
    },

    updateAppearance: (appearance) => {
        const { character } = get();
        if (character) {
            set({
                character: {
                    ...character,
                    appearance: { ...character.appearance, ...appearance },
                    spriteVersion: character.spriteVersion + 1, // Invalidate sprite cache
                    lastModified: new Date().toISOString(),
                },
            });
        }
    },

    changeClass: (newClass) => {
        const { character } = get();
        if (!character) return false;

        const cost = character.level * 100;
        if (character.totalXP < cost) return false;

        set({
            character: {
                ...character,
                class: newClass,
                totalXP: character.totalXP - cost,
                level: calculateLevel(character.totalXP - cost),
                spriteVersion: character.spriteVersion + 1,
                lastModified: new Date().toISOString(),
            },
        });
        return true;
    },

    unlockSecondaryClass: (secondaryClass) => {
        const { character } = get();
        if (!character || character.level < 25) return false;
        if (secondaryClass === character.class) return false;

        set({
            character: {
                ...character,
                secondaryClass,
                spriteVersion: character.spriteVersion + 1,
                lastModified: new Date().toISOString(),
            },
        });
        return true;
    },

    setTrainingMode: (isTraining) => {
        const { character } = get();
        if (character) {
            set({
                character: {
                    ...character,
                    isTrainingMode: isTraining,
                    lastModified: new Date().toISOString(),
                },
            });
        }
    },

    graduate: () => {
        const { character } = get();
        if (!character || !character.isTrainingMode) return;

        set({
            character: {
                ...character,
                isTrainingMode: false,
                level: 1,
                totalXP: 0,
                // Keep training XP for records
                lastModified: new Date().toISOString(),
            },
        });
    },

    addInventoryItem: (itemId, quantity = 1) => {
        const { inventory } = get();
        const existing = inventory.find((i) => i.itemId === itemId);

        if (existing) {
            set({
                inventory: inventory.map((i) =>
                    i.itemId === itemId
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                ),
            });
        } else {
            set({
                inventory: [
                    ...inventory,
                    { itemId, quantity, acquiredDate: new Date().toISOString() },
                ],
            });
        }
    },

    removeInventoryItem: (itemId, quantity = 1) => {
        const { inventory } = get();
        const existing = inventory.find((i) => i.itemId === itemId);

        if (!existing) return;

        if (existing.quantity <= quantity) {
            set({ inventory: inventory.filter((i) => i.itemId !== itemId) });
        } else {
            set({
                inventory: inventory.map((i) =>
                    i.itemId === itemId
                        ? { ...i, quantity: i.quantity - quantity }
                        : i
                ),
            });
        }
    },

    unlockAchievement: (achievement) => {
        const { achievements } = get();
        // Check if already exists
        const existingIndex = achievements.findIndex(a => a.id === achievement.id);
        if (existingIndex >= 0) {
            // Update existing achievement with unlock
            const updated = [...achievements];
            updated[existingIndex] = {
                ...updated[existingIndex],
                unlockedAt: new Date().toISOString()
            };
            set({ achievements: updated });
        } else {
            // Add new achievement
            set({
                achievements: [
                    ...achievements,
                    { ...achievement, unlockedAt: new Date().toISOString() } as Achievement,
                ],
            });
        }
    },

    setLoading: (loading) => set({ loading }),

    setInventoryAndAchievements: (inventory, achievements) =>
        set({ inventory, achievements }),

    setPowerUps: (powerUps) => {
        const { character } = get();
        if (character) {
            set({ character: { ...character, activePowerUps: powerUps } });
        }
    },

    incrementTasksToday: (count, dateString) => {
        const { character } = get();
        if (!character) return;

        // Reset counter if new day
        const isNewDay = character.lastTaskDate !== dateString;
        const newCount = isNewDay ? count : (character.tasksCompletedToday ?? 0) + count;

        set({
            character: {
                ...character,
                tasksCompletedToday: newCount,
                lastTaskDate: dateString,
            },
        });
    },
}));

// ============================================
// Selectors
// ============================================

export const selectCharacter = (state: CharacterStore) => state.character;
export const selectInventory = (state: CharacterStore) => state.inventory;
export const selectAchievements = (state: CharacterStore) => state.achievements;
export const selectIsTrainingMode = (state: CharacterStore) =>
    state.character?.isTrainingMode ?? true;
export const selectCurrentLevel = (state: CharacterStore) =>
    state.character?.isTrainingMode
        ? state.character.trainingLevel
        : (state.character?.level ?? 1);
