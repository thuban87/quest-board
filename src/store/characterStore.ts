/**
 * Character Store
 * 
 * Zustand store for character state management.
 * Synced with plugin settings via loadData/saveData.
 */

import { create } from 'zustand';
import {
    Character,
    CharacterClass,
    CLASS_INFO,
    CharacterAppearance,
    ActivePowerUp,
    ActivityEvent,
    MAX_ACTIVITY_HISTORY,
    migrateCharacterV1toV2,
    CHARACTER_SCHEMA_VERSION,
} from '../models';
import { GearItem, GearSlot, EquippedGearMap, canEquipGear } from '../models/Gear';
import { InventoryItem } from '../models/Consumable';
import { Achievement } from '../models/Achievement';
import { calculateTrainingLevel, calculateLevel, XP_THRESHOLDS } from '../services/XPSystem';
import { createStarterEquippedGear } from '../data/starterGear';
import {
    MAX_STAMINA,
    MAX_DAILY_STAMINA,
    STAMINA_PER_TASK,
} from '../config/combatConfig';

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

    // ========== Phase 3A: Gear Actions ==========

    /** Update gold (positive = gain, negative = spend) */
    updateGold: (delta: number) => void;

    /** Add gear item to inventory. Returns false if inventory full. */
    addGear: (item: GearItem) => boolean;

    /** Remove gear item from inventory by ID. Returns the removed item or null. */
    removeGear: (itemId: string) => GearItem | null;

    /** Equip gear to a slot. Current item in slot goes to inventory. */
    equipGear: (slot: GearSlot, itemId: string) => boolean;

    /** Unequip gear from slot. Item goes to inventory. Returns the unequipped item or null. */
    unequipGear: (slot: GearSlot) => GearItem | null;

    /** Bulk remove gear items by ID. Returns gold value of sold items. */
    bulkRemoveGear: (itemIds: string[]) => { removed: GearItem[]; totalGold: number };

    /** Bulk add gear items to inventory. Returns items that couldn't be added (inventory full). */
    bulkAddGear: (items: GearItem[]) => GearItem[];

    /** Mark items as pending smelt (prevents use during transaction). */
    markGearPendingSmelt: (itemIds: string[]) => void;

    /** Clear pending smelt status from items. */
    clearGearPendingSmelt: (itemIds: string[]) => void;

    /** Get number of free inventory slots. */
    getFreeSlots: () => number;

    // ========== Phase 3B: Combat Actions ==========

    /** Update current HP (positive = heal, negative = damage). Clamped to [0, maxHP]. */
    updateHP: (delta: number) => void;

    /** Update current Mana (positive = restore, negative = spend). Clamped to [0, maxMana]. */
    updateMana: (delta: number) => void;

    /** Award stamina on task completion. Respects daily cap. */
    awardStamina: (amount?: number) => void;

    /** Consume stamina for a random fight. Returns false if insufficient. */
    consumeStamina: () => boolean;

    /** Full restore HP and Mana (Long Rest). */
    fullRestore: () => void;

    /**
     * Restore HP and Mana by a percentage of max values.
     * Used for task completion regen (7% per task).
     * @param percent - Fraction of max to restore (0.07 = 7%)
     * @returns The actual amounts restored (capped at max)
     */
    restoreResources: (percent: number) => { restoredHP: number; restoredMana: number };

    /** Recalculate and update maxHP/maxMana based on current stats. */
    recalculateMaxHPMana: () => void;

    // ========== Phase 3C: Exploration Actions ==========

    /** Update explored rooms for a dungeon template (persisted for map fog of war) */
    updateDungeonExploration: (templateId: string, visitedRooms: string[]) => void;

    /** Get explored rooms for a dungeon template */
    getDungeonExploration: (templateId: string) => string[];

    // ========== Phase 3B Step 9: Death Penalty ==========

    /** Set character status (active, unconscious, etc.) */
    setStatus: (status: string) => void;

    /** Set recovery timer end timestamp (null = clear timer) */
    setRecoveryTimer: (endTime: string | null) => void;

    /** Check if character is unconscious */
    isUnconscious: () => boolean;

    /** Use revive potion: consume from inventory, set HP to 25% max, clear unconscious */
    useRevivePotion: () => boolean;

    // ========== Phase 4: Activity Tracking ==========

    /** Log an activity event (quest completion, bounty, dungeon, etc.) */
    logActivity: (event: Omit<ActivityEvent, 'timestamp'>) => void;

    // ========== Phase 6: Skills System ==========

    /** Update equipped skill loadout (includes Meditate + up to 5 class skills) */
    updateSkillLoadout: (equippedSkillIds: string[]) => void;

    /** Unlock new skills and auto-equip if < 5 equipped (Phase 7) */
    unlockSkills: (newSkillIds: string[]) => void;
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
            // Run schema migration if needed (Phase 3A)
            if (character.schemaVersion !== CHARACTER_SCHEMA_VERSION) {
                character = migrateCharacterV1toV2(character as unknown as Record<string, unknown>);
            }

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

        // Calculate starting HP and Mana
        const maxHP = 50 + (baseStats.constitution * 5) + (1 * 10);
        const maxMana = 20 + (baseStats.intelligence * 3) + (1 * 5);

        // Get starter gear (Phase 3A)
        const equippedGear = createStarterEquippedGear();

        const character: Character = {
            schemaVersion: CHARACTER_SCHEMA_VERSION,
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
            equippedGear,
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

            // Phase 3A: Gear System
            gold: 0,
            gearInventory: [],
            inventoryLimit: 50,

            // Phase 3B: Fight System
            currentHP: maxHP,
            maxHP,
            currentMana: maxMana,
            maxMana,
            stamina: 10,
            staminaGainedToday: 0,
            lastStaminaResetDate: null,

            // Phase 3C: Exploration
            dungeonKeys: 0,
            dungeonExplorationHistory: {},

            // Phase 3B Step 9: Death Penalty
            status: 'active',
            recoveryTimerEnd: null,

            // Phase 4: Activity Tracking
            activityHistory: [],

            // Phase 5: Skills System
            skills: {
                unlocked: [],
                equipped: [],
            },
            persistentStatusEffects: [],
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

    // ========== Phase 3A: Gear Actions ==========

    updateGold: (delta) => {
        const { character } = get();
        if (!character) return;

        const newGold = Math.max(0, character.gold + delta);
        set({
            character: {
                ...character,
                gold: newGold,
                lastModified: new Date().toISOString(),
            },
        });
    },

    addGear: (item) => {
        const { character } = get();
        if (!character) return false;

        // Check inventory limit
        if (character.gearInventory.length >= character.inventoryLimit) {
            return false;
        }

        set({
            character: {
                ...character,
                gearInventory: [...character.gearInventory, item],
                lastModified: new Date().toISOString(),
            },
        });
        return true;
    },

    removeGear: (itemId) => {
        const { character } = get();
        if (!character) return null;

        const item = character.gearInventory.find(i => i.id === itemId);
        if (!item) return null;

        set({
            character: {
                ...character,
                gearInventory: character.gearInventory.filter(i => i.id !== itemId),
                lastModified: new Date().toISOString(),
            },
        });
        return item;
    },

    equipGear: (slot, itemId) => {
        const { character } = get();
        if (!character) return false;

        // Find item in inventory
        const item = character.gearInventory.find(i => i.id === itemId);
        if (!item) return false;

        // Check slot matches
        if (item.slot !== slot) return false;

        // Check class can equip this item type
        if (!canEquipGear(character.class, item)) {
            return false;
        }

        // Get current equipped item in that slot
        const currentEquipped = character.equippedGear[slot];

        // Remove new item from inventory
        let newInventory = character.gearInventory.filter(i => i.id !== itemId);

        // If there was an item equipped, add it to inventory
        if (currentEquipped) {
            newInventory = [...newInventory, currentEquipped];
        }

        // Update equipped gear
        const newEquippedGear = {
            ...character.equippedGear,
            [slot]: item,
        };

        set({
            character: {
                ...character,
                equippedGear: newEquippedGear,
                gearInventory: newInventory,
                lastModified: new Date().toISOString(),
            },
        });
        return true;
    },

    unequipGear: (slot) => {
        const { character } = get();
        if (!character) return null;

        const item = character.equippedGear[slot];
        if (!item) return null;

        // Check inventory space
        if (character.gearInventory.length >= character.inventoryLimit) {
            return null; // Can't unequip - inventory full
        }

        // Update equipped gear
        const newEquippedGear = {
            ...character.equippedGear,
            [slot]: null,
        };

        set({
            character: {
                ...character,
                equippedGear: newEquippedGear,
                gearInventory: [...character.gearInventory, item],
                lastModified: new Date().toISOString(),
            },
        });
        return item;
    },

    // ========== Bulk Operations (Step 9-10) ==========

    bulkRemoveGear: (itemIds) => {
        const { character } = get();
        if (!character) return { removed: [], totalGold: 0 };

        const removed: GearItem[] = [];
        let totalGold = 0;

        const newInventory = character.gearInventory.filter(item => {
            if (itemIds.includes(item.id)) {
                removed.push(item);
                totalGold += item.sellValue;
                return false;
            }
            return true;
        });

        set({
            character: {
                ...character,
                gearInventory: newInventory,
                gold: character.gold + totalGold,
                lastModified: new Date().toISOString(),
            },
        });

        return { removed, totalGold };
    },

    bulkAddGear: (items) => {
        const { character } = get();
        if (!character) return items;

        const freeSlots = character.inventoryLimit - character.gearInventory.length;
        if (freeSlots <= 0) return items; // All rejected

        // Add as many as we can
        const toAdd = items.slice(0, freeSlots);
        const rejected = items.slice(freeSlots);

        set({
            character: {
                ...character,
                gearInventory: [...character.gearInventory, ...toAdd],
                lastModified: new Date().toISOString(),
            },
        });

        return rejected; // Return items that couldn't be added
    },

    markGearPendingSmelt: (itemIds) => {
        const { character } = get();
        if (!character) return;

        const newInventory = character.gearInventory.map(item => {
            if (itemIds.includes(item.id)) {
                return { ...item, status: 'pending_smelt' as const };
            }
            return item;
        });

        set({
            character: {
                ...character,
                gearInventory: newInventory,
                lastModified: new Date().toISOString(),
            },
        });
    },

    clearGearPendingSmelt: (itemIds) => {
        const { character } = get();
        if (!character) return;

        const newInventory = character.gearInventory.map(item => {
            if (itemIds.includes(item.id) && item.status === 'pending_smelt') {
                const { status, ...rest } = item;
                return rest as GearItem;
            }
            return item;
        });

        set({
            character: {
                ...character,
                gearInventory: newInventory,
                lastModified: new Date().toISOString(),
            },
        });
    },

    getFreeSlots: () => {
        const { character } = get();
        if (!character) return 0;
        return character.inventoryLimit - character.gearInventory.length;
    },

    // ========== Phase 3B: Combat Actions ==========

    updateHP: (delta) => {
        const { character } = get();
        if (!character) return;

        const newHP = Math.max(0, Math.min(character.currentHP + delta, character.maxHP));

        set({
            character: {
                ...character,
                currentHP: newHP,
                lastModified: new Date().toISOString(),
            },
        });
    },

    updateMana: (delta) => {
        const { character } = get();
        if (!character) return;

        const newMana = Math.max(0, Math.min(character.currentMana + delta, character.maxMana));
        set({
            character: {
                ...character,
                currentMana: newMana,
                lastModified: new Date().toISOString(),
            },
        });
    },

    awardStamina: (amount = STAMINA_PER_TASK) => {
        const { character } = get();
        if (!character) return;

        const today = new Date().toISOString().split('T')[0];

        // Reset if new day
        let todayGained = character.staminaGainedToday;
        if (character.lastStaminaResetDate !== today) {
            todayGained = 0;
        }

        // Check daily cap
        if (todayGained >= MAX_DAILY_STAMINA) return;

        // Grant up to daily cap, respecting max current stamina
        const granted = Math.min(amount, MAX_DAILY_STAMINA - todayGained);
        const newStamina = Math.min(character.stamina + granted, MAX_STAMINA);

        set({
            character: {
                ...character,
                stamina: newStamina,
                staminaGainedToday: todayGained + granted,
                lastStaminaResetDate: today,
                lastModified: new Date().toISOString(),
            },
        });
    },

    consumeStamina: () => {
        const { character } = get();
        if (!character || character.stamina < 1) return false;

        set({
            character: {
                ...character,
                stamina: character.stamina - 1,
                lastModified: new Date().toISOString(),
            },
        });
        return true;
    },

    fullRestore: () => {
        const { character } = get();
        if (!character) return;

        set({
            character: {
                ...character,
                currentHP: character.maxHP,
                currentMana: character.maxMana,
                persistentStatusEffects: [], // Phase 5: Clear all status effects on Long Rest
                lastModified: new Date().toISOString(),
            },
        });
    },

    restoreResources: (percent: number) => {
        const { character } = get();
        if (!character) return { restoredHP: 0, restoredMana: 0 };

        const hpToRestore = Math.floor(character.maxHP * percent);
        const manaToRestore = Math.floor(character.maxMana * percent);

        const newHP = Math.min(character.currentHP + hpToRestore, character.maxHP);
        const newMana = Math.min(character.currentMana + manaToRestore, character.maxMana);

        const restoredHP = newHP - character.currentHP;
        const restoredMana = newMana - character.currentMana;

        set({
            character: {
                ...character,
                currentHP: newHP,
                currentMana: newMana,
                lastModified: new Date().toISOString(),
            },
        });

        return { restoredHP, restoredMana };
    },


    recalculateMaxHPMana: () => {
        const { character } = get();
        if (!character) return;

        // Recalculate based on base stats + level
        const con = character.baseStats.constitution + (character.statBonuses?.constitution || 0);
        const int = character.baseStats.intelligence + (character.statBonuses?.intelligence || 0);
        const level = character.level;

        const newMaxHP = 50 + (con * 5) + (level * 10);
        const newMaxMana = 20 + (int * 3) + (level * 5);

        // Also clamp current values if they exceed new max
        const newCurrentHP = Math.min(character.currentHP, newMaxHP);
        const newCurrentMana = Math.min(character.currentMana, newMaxMana);

        set({
            character: {
                ...character,
                maxHP: newMaxHP,
                maxMana: newMaxMana,
                currentHP: newCurrentHP,
                currentMana: newCurrentMana,
                lastModified: new Date().toISOString(),
            },
        });
    },

    // ========== Phase 3B Step 9: Death Penalty ==========

    setStatus: (status) => {
        const { character } = get();
        if (!character) return;

        set({
            character: {
                ...character,
                status,
                lastModified: new Date().toISOString(),
            },
        });
    },

    setRecoveryTimer: (endTime) => {
        const { character } = get();
        if (!character) return;

        set({
            character: {
                ...character,
                recoveryTimerEnd: endTime,
                lastModified: new Date().toISOString(),
            },
        });
    },

    isUnconscious: () => {
        const { character } = get();
        return character?.status === 'unconscious';
    },

    useRevivePotion: () => {
        const state = get();
        const { character, inventory } = state;
        if (!character) return false;

        // Check if we have a revive potion
        const hasPotion = inventory.find(i => i.itemId === 'revive-potion' && i.quantity > 0);
        if (!hasPotion) return false;

        // Consume one potion
        state.removeInventoryItem('revive-potion', 1);

        // Calculate 25% of max HP
        const revivedHP = Math.floor(character.maxHP * 0.25);

        // Revive: set HP, clear status and timer
        set({
            character: {
                ...character,
                currentHP: revivedHP,
                status: 'active',
                recoveryTimerEnd: null,
                persistentStatusEffects: [], // Phase 5: Clear all status effects on revive
                lastModified: new Date().toISOString(),
            },
        });

        return true;
    },

    // ========== Phase 3C: Exploration Actions ==========

    updateDungeonExploration: (templateId, visitedRooms) => {
        const { character } = get();
        if (!character) return;

        // Merge new visited rooms with existing (don't lose progress)
        const existing = character.dungeonExplorationHistory?.[templateId] || [];
        const merged = [...new Set([...existing, ...visitedRooms])];

        set({
            character: {
                ...character,
                dungeonExplorationHistory: {
                    ...character.dungeonExplorationHistory,
                    [templateId]: merged,
                },
                lastModified: new Date().toISOString(),
            },
        });
    },

    getDungeonExploration: (templateId) => {
        const { character } = get();
        if (!character) return [];
        return character.dungeonExplorationHistory?.[templateId] || [];
    },

    // ========== Phase 4: Activity Tracking ==========

    logActivity: (event) => {
        const { character } = get();
        if (!character) return;

        // Create full event with timestamp
        const fullEvent: ActivityEvent = {
            ...event,
            timestamp: new Date().toISOString(),
        };

        // Append to history and trim if over limit
        // Defensive: initialize activityHistory if undefined (pre-v4 characters)
        const currentHistory = character.activityHistory ?? [];
        let newHistory = [...currentHistory, fullEvent];
        if (newHistory.length > MAX_ACTIVITY_HISTORY) {
            // Keep most recent events
            newHistory = newHistory.slice(-MAX_ACTIVITY_HISTORY);
        }

        set({
            character: {
                ...character,
                activityHistory: newHistory,
                lastModified: new Date().toISOString(),
            },
        });
    },

    // ========== Phase 6: Skills System ==========

    updateSkillLoadout: (equippedSkillIds: string[]) => {
        const { character } = get();
        if (!character) return;

        set({
            character: {
                ...character,
                skills: {
                    ...character.skills,
                    equipped: equippedSkillIds,
                },
                lastModified: new Date().toISOString(),
            },
        });
    },

    unlockSkills: (newSkillIds: string[]) => {
        const { character } = get();
        if (!character || newSkillIds.length === 0) return;

        // Dedupe with existing unlocked skills
        const existingUnlocked = character.skills?.unlocked ?? [];
        const allUnlocked = [...new Set([...existingUnlocked, ...newSkillIds])];

        // Auto-equip if < 5 equipped (max loadout is 5 skills)
        const existingEquipped = character.skills?.equipped ?? [];
        let newEquipped = [...existingEquipped];

        // Add new skills until we have 5 equipped
        for (const skillId of newSkillIds) {
            if (newEquipped.length >= 5) break;
            if (!newEquipped.includes(skillId)) {
                newEquipped.push(skillId);
            }
        }

        set({
            character: {
                ...character,
                skills: {
                    unlocked: allUnlocked,
                    equipped: newEquipped,
                },
                lastModified: new Date().toISOString(),
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

// ============================================
// Set Bonus Selector (computes on-demand)
// ============================================
import { setBonusService } from '../services/SetBonusService';
import { ActiveSetBonus } from '../models/Gear';

export const selectActiveSetBonuses = (state: CharacterStore): ActiveSetBonus[] => {
    const char = state.character;
    if (!char?.equippedGear) return [];
    return setBonusService.calculateActiveSetBonuses(char.equippedGear);
};

// ============================================
// Combat Stats Selector (computes on-demand)
// ============================================
import { deriveCombatStats, CombatStats } from '../services/CombatService';

export const selectDerivedCombatStats = (state: CharacterStore): CombatStats | null => {
    const char = state.character;
    if (!char) return null;
    return deriveCombatStats(char);
};
