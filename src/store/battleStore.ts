/**
 * Battle Store
 * 
 * Phase 3B: Combat state machine with dual persistence.
 * Persists to localStorage (fast recovery) and plugin data (sync).
 */

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { CombatStats } from '../services/CombatService';

// =====================
// COMBAT STATE MACHINE
// =====================

/**
 * Combat state machine states
 */
export type CombatState =
    | 'IDLE'              // No combat active
    | 'INITIALIZING'      // Setting up combat, loading monster
    | 'PLAYER_INPUT'      // Waiting for player action selection
    | 'PROCESSING_TURN'   // Calculating damage, applying effects
    | 'ANIMATING_PLAYER'  // Showing player attack animation
    | 'ENEMY_TURN'        // Monster choosing action
    | 'ANIMATING_ENEMY'   // Showing monster attack animation
    | 'CHECKING_OUTCOME'  // Checking for victory/defeat
    | 'VICTORY'           // Player won, showing rewards
    | 'DEFEAT'            // Player lost, showing penalty
    | 'RETREATED';        // Player fled combat

/**
 * Player action options
 */
export type PlayerAction = 'attack' | 'defend' | 'item' | 'retreat';

/**
 * Combat log entry for battle history
 */
export interface CombatLogEntry {
    turn: number;
    actor: 'player' | 'monster';
    action: string;
    damage?: number;
    result?: 'hit' | 'critical' | 'miss' | 'blocked' | 'heal';
    newHP?: number;
    timestamp: number;
}

/**
 * Monster data for combat (simplified - full Monster model in Step 6)
 */
export interface BattleMonster {
    id: string;
    name: string;
    tier: 'overworld' | 'elite' | 'dungeon' | 'boss' | 'raid_boss';
    level: number;
    maxHP: number;
    currentHP: number;
    attack: number;
    defense: number;
    magicDefense: number;
    critChance: number;
    dodgeChance: number;
    emoji: string;
    goldReward: number;
    xpReward: number;
}

// =====================
// BATTLE STATE
// =====================

interface BattleState {
    // Combat status
    isInCombat: boolean;
    state: CombatState;

    // Combatants - snapshots at battle start
    playerStats: CombatStats | null;
    playerCurrentHP: number;
    playerCurrentMana: number;
    monster: BattleMonster | null;

    // Turn tracking
    currentTurn: 'player' | 'monster';
    turnNumber: number;

    // Selected action for current turn
    selectedAction: PlayerAction | null;

    // Defending status (reduces damage taken this turn)
    isPlayerDefending: boolean;

    // Combat log
    log: CombatLogEntry[];

    // Rewards/modifiers
    lootBonus: number;         // 1.0 normal, 2.0 for quest bounty
    isBountyFight: boolean;    // Quest bounty fight (free, better loot)
    sourceQuestId: string | null; // Quest that triggered this fight

    // Persistence marker
    lastUpdated: number;
}

interface BattleActions {
    // Combat lifecycle
    startBattle: (
        playerStats: CombatStats,
        monster: BattleMonster,
        options?: { isBounty?: boolean; questId?: string }
    ) => void;
    endBattle: (outcome: 'victory' | 'defeat' | 'retreat') => void;

    // Turn management
    selectAction: (action: PlayerAction) => void;
    advanceState: (newState: CombatState) => void;
    setCurrentTurn: (turn: 'player' | 'monster') => void;
    incrementTurn: () => void;

    // Combat updates
    updatePlayerHP: (newHP: number) => void;
    updatePlayerMana: (newMana: number) => void;
    updateMonsterHP: (newHP: number) => void;
    setPlayerDefending: (isDefending: boolean) => void;

    // Combat log
    addLogEntry: (entry: Omit<CombatLogEntry, 'timestamp'>) => void;
    clearLog: () => void;

    // Recovery
    recoverFromCrash: () => boolean;
    resetBattle: () => void;
}

type BattleStore = BattleState & BattleActions;

// =====================
// INITIAL STATE
// =====================

const initialState: BattleState = {
    isInCombat: false,
    state: 'IDLE',
    playerStats: null,
    playerCurrentHP: 0,
    playerCurrentMana: 0,
    monster: null,
    currentTurn: 'player',
    turnNumber: 0,
    selectedAction: null,
    isPlayerDefending: false,
    log: [],
    lootBonus: 1.0,
    isBountyFight: false,
    sourceQuestId: null,
    lastUpdated: 0,
};

// =====================
// DUAL PERSISTENCE STORAGE
// =====================

// localStorage key for crash recovery
const LOCAL_STORAGE_KEY = 'quest-board-battle-state';

/**
 * Custom storage that writes to both localStorage and returns
 * data for Zustand's persist middleware.
 */
const dualStorage: StateStorage = {
    getItem: (name: string) => {
        try {
            const data = localStorage.getItem(name);
            return data;
        } catch {
            return null;
        }
    },
    setItem: (name: string, value: string) => {
        try {
            localStorage.setItem(name, value);
        } catch (e) {
            console.warn('[BattleStore] Failed to persist to localStorage:', e);
        }
    },
    removeItem: (name: string) => {
        try {
            localStorage.removeItem(name);
        } catch {
            // Ignore
        }
    },
};

// =====================
// BATTLE STORE
// =====================

export const useBattleStore = create<BattleStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            startBattle: (playerStats, monster, options = {}) => {
                set({
                    isInCombat: true,
                    state: 'PLAYER_INPUT',
                    playerStats,
                    playerCurrentHP: playerStats.currentHP,
                    playerCurrentMana: playerStats.currentMana,
                    monster,
                    currentTurn: 'player',
                    turnNumber: 1,
                    selectedAction: null,
                    isPlayerDefending: false,
                    log: [],
                    lootBonus: options.isBounty ? 2.0 : 1.0,
                    isBountyFight: options.isBounty ?? false,
                    sourceQuestId: options.questId ?? null,
                    lastUpdated: Date.now(),
                });

                console.log('[BattleStore] Battle started:', {
                    player: playerStats.maxHP,
                    monster: monster.name,
                    monsterHP: monster.maxHP,
                    isBounty: options.isBounty,
                });
            },

            endBattle: (outcome) => {
                const { monster, log, lootBonus, sourceQuestId } = get();

                console.log('[BattleStore] Battle ended:', {
                    outcome,
                    monster: monster?.name,
                    turns: log.length,
                    lootBonus,
                });

                // Don't fully reset - leave some data for reward processing
                set({
                    isInCombat: false,
                    state: outcome === 'victory' ? 'VICTORY'
                        : outcome === 'defeat' ? 'DEFEAT'
                            : 'RETREATED',
                    selectedAction: null,
                    lastUpdated: Date.now(),
                });
            },

            selectAction: (action) => {
                set({
                    selectedAction: action,
                    lastUpdated: Date.now(),
                });
            },

            advanceState: (newState) => {
                set({
                    state: newState,
                    lastUpdated: Date.now(),
                });
            },

            setCurrentTurn: (turn) => {
                set({
                    currentTurn: turn,
                    lastUpdated: Date.now(),
                });
            },

            incrementTurn: () => {
                set((state) => ({
                    turnNumber: state.turnNumber + 1,
                    isPlayerDefending: false, // Reset defend at new turn
                    lastUpdated: Date.now(),
                }));
            },

            updatePlayerHP: (newHP) => {
                set({
                    playerCurrentHP: Math.max(0, newHP),
                    lastUpdated: Date.now(),
                });
            },

            updatePlayerMana: (newMana) => {
                set({
                    playerCurrentMana: Math.max(0, newMana),
                    lastUpdated: Date.now(),
                });
            },

            updateMonsterHP: (newHP) => {
                const { monster } = get();
                if (!monster) return;

                set({
                    monster: {
                        ...monster,
                        currentHP: Math.max(0, newHP),
                    },
                    lastUpdated: Date.now(),
                });
            },

            setPlayerDefending: (isDefending) => {
                set({
                    isPlayerDefending: isDefending,
                    lastUpdated: Date.now(),
                });
            },

            addLogEntry: (entry) => {
                set((state) => ({
                    log: [...state.log, { ...entry, timestamp: Date.now() }],
                    lastUpdated: Date.now(),
                }));
            },

            clearLog: () => {
                set({ log: [], lastUpdated: Date.now() });
            },

            recoverFromCrash: () => {
                const state = get();

                // If we were in combat, check if it's recoverable
                if (state.isInCombat && state.playerStats && state.monster) {
                    // Check if last update was recent (within 1 hour)
                    const timeSinceUpdate = Date.now() - state.lastUpdated;
                    const isRecent = timeSinceUpdate < 60 * 60 * 1000; // 1 hour

                    if (isRecent && state.playerCurrentHP > 0 && state.monster.currentHP > 0) {
                        console.log('[BattleStore] Recovered combat state:', {
                            turn: state.turnNumber,
                            playerHP: state.playerCurrentHP,
                            monsterHP: state.monster.currentHP,
                        });

                        // Resume at player input
                        set({ state: 'PLAYER_INPUT' });
                        return true;
                    }
                }

                // Can't recover - reset
                get().resetBattle();
                return false;
            },

            resetBattle: () => {
                set({
                    ...initialState,
                    lastUpdated: Date.now(),
                });
            },
        }),
        {
            name: LOCAL_STORAGE_KEY,
            storage: createJSONStorage(() => dualStorage),
            partialize: (state) => ({
                // Only persist essential combat data for recovery
                isInCombat: state.isInCombat,
                state: state.state,
                playerStats: state.playerStats,
                playerCurrentHP: state.playerCurrentHP,
                playerCurrentMana: state.playerCurrentMana,
                monster: state.monster,
                currentTurn: state.currentTurn,
                turnNumber: state.turnNumber,
                isPlayerDefending: state.isPlayerDefending,
                log: state.log.slice(-20), // Only keep last 20 log entries
                lootBonus: state.lootBonus,
                isBountyFight: state.isBountyFight,
                sourceQuestId: state.sourceQuestId,
                lastUpdated: state.lastUpdated,
            }),
        }
    )
);

// =====================
// SELECTORS
// =====================

export const selectIsInCombat = (state: BattleStore) => state.isInCombat;
export const selectCombatState = (state: BattleStore) => state.state;
export const selectPlayerHP = (state: BattleStore) => state.playerCurrentHP;
export const selectMonsterHP = (state: BattleStore) => state.monster?.currentHP ?? 0;
export const selectTurnNumber = (state: BattleStore) => state.turnNumber;
export const selectCombatLog = (state: BattleStore) => state.log;
export const selectIsBountyFight = (state: BattleStore) => state.isBountyFight;

/**
 * Check if player is alive
 */
export const selectPlayerAlive = (state: BattleStore) => state.playerCurrentHP > 0;

/**
 * Check if monster is alive
 */
export const selectMonsterAlive = (state: BattleStore) =>
    (state.monster?.currentHP ?? 0) > 0;

/**
 * Get HP percentages for UI bars
 */
export const selectHPPercentages = (state: BattleStore) => {
    const playerMaxHP = state.playerStats?.maxHP ?? 1;
    const monsterMaxHP = state.monster?.maxHP ?? 1;

    return {
        player: Math.max(0, (state.playerCurrentHP / playerMaxHP) * 100),
        monster: Math.max(0, ((state.monster?.currentHP ?? 0) / monsterMaxHP) * 100),
    };
};
