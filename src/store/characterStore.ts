/**
 * Character Store
 * 
 * Zustand store for character state management.
 * Synced with plugin settings via loadData/saveData.
 */

import { create } from 'zustand';
import { Character, CharacterClass, CLASS_INFO, CharacterAppearance } from '../models';
import { InventoryItem } from '../models/Consumable';

interface Achievement {
    id: string;
    name: string;
    description: string;
    dateUnlocked: string;
}

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

    /** Add item to inventory */
    addInventoryItem: (itemId: string, quantity?: number) => void;

    /** Remove item from inventory */
    removeInventoryItem: (itemId: string, quantity?: number) => void;

    /** Unlock achievement */
    unlockAchievement: (achievement: Omit<Achievement, 'dateUnlocked'>) => void;

    /** Set loading state */
    setLoading: (loading: boolean) => void;

    /** Set inventory and achievements from loaded data */
    setInventoryAndAchievements: (inventory: InventoryItem[], achievements: Achievement[]) => void;
}

type CharacterStore = CharacterState & CharacterActions;

/**
 * XP thresholds for each level (1-30)
 * Based on age milestones
 */
const XP_THRESHOLDS: number[] = [
    0,      // Level 1 (start)
    200,    // Level 2
    400,    // Level 3  
    750,    // Level 4
    1100,   // Level 5
    1650,   // Level 6
    2200,   // Level 7
    2800,   // Level 8
    3500,   // Level 9
    4300,   // Level 10
    5200,   // Level 11
    6100,   // Level 12
    6700,   // Level 13
    7400,   // Level 14
    8200,   // Level 15
    9100,   // Level 16
    10100,  // Level 17
    11100,  // Level 18
    12200,  // Level 19
    13400,  // Level 20
    14300,  // Level 21
    15400,  // Level 22
    16600,  // Level 23
    17900,  // Level 24
    19100,  // Level 25
    20500,  // Level 26
    22000,  // Level 27
    23600,  // Level 28
    25300,  // Level 29
    27000,  // Level 30
];

/**
 * Calculate level from total XP
 */
function calculateLevel(totalXP: number): number {
    for (let level = XP_THRESHOLDS.length - 1; level >= 0; level--) {
        if (totalXP >= XP_THRESHOLDS[level]) {
            return level + 1;
        }
    }
    return 1;
}

/**
 * Get XP needed for next level
 */
function getXPForNextLevel(level: number): number {
    if (level >= 30) return XP_THRESHOLDS[29]; // Max level
    return XP_THRESHOLDS[level] || 200;
}

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
    setCharacter: (character) => set({ character, loading: false }),

    createCharacter: (name, characterClass, appearance) => {
        const classInfo = CLASS_INFO[characterClass];
        const now = new Date().toISOString();

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
            createdDate: now,
            lastModified: now,
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
            const newTrainingLevel = Math.min(
                4, // Max training level IV
                Math.floor(newTrainingXP / 100) + 1
            );

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
        if (achievements.some((a) => a.id === achievement.id)) return;

        set({
            achievements: [
                ...achievements,
                { ...achievement, dateUnlocked: new Date().toISOString() },
            ],
        });
    },

    setLoading: (loading) => set({ loading }),

    setInventoryAndAchievements: (inventory, achievements) =>
        set({ inventory, achievements }),
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
