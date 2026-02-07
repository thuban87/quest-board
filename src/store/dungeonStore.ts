/**
 * Dungeon State Store
 * 
 * Zustand store for dungeon exploration state.
 * Uses light persistence to avoid sync conflicts across devices.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Direction,
    ExplorationState,
    RoomState,
    PersistedDungeonState
} from '../models/Dungeon';
import type { LootReward } from '../models/Gear';
import { getDungeonTemplate } from '../data/dungeons';
import { findSpawnPosition } from '../data/TileRegistry';
import { useCharacterStore } from './characterStore';

// ============================================
// Store Interface
// ============================================

interface DungeonState {
    // Active dungeon
    isInDungeon: boolean;
    isPreviewMode: boolean;           // Dev preview = no resource cost
    dungeonInstanceId: string | null;
    dungeonTemplateId: string | null;
    scaledLevel: number;              // Player level at run start

    // Current position
    currentRoomId: string;
    playerPosition: [number, number];
    playerFacing: Direction;

    // Room progress
    visitedRooms: Set<string>;
    roomStates: Record<string, RoomState>;

    // Combat tracking
    activeCombatMonsterId: string | null;  // Which monster we're fighting
    activeCombatRoomId: string | null;     // Which room the combat is in

    // Session rewards tracking (for exit summary display)
    pendingLoot: LootReward[];
    sessionGold: number;
    sessionXP: number;

    // Boss tracking (for end-of-dungeon boss fight)
    bossDefeated: boolean;

    // State machine
    explorationState: ExplorationState;

    // Actions
    enterDungeon: (templateId: string, playerLevel: number, isPreview?: boolean) => boolean;
    exitDungeon: () => void;
    movePlayer: (x: number, y: number, facing: Direction) => void;
    setPlayerFacing: (facing: Direction) => void;
    changeRoom: (roomId: string, entryDirection: Direction) => void;
    setExplorationState: (state: ExplorationState) => void;
    markChestOpened: (roomId: string, chestId: string) => void;
    markMonsterKilled: (roomId: string, monsterId: string) => void;
    addPendingLoot: (loot: LootReward[]) => void;
    addSessionGold: (gold: number) => void;
    addSessionXP: (xp: number) => void;
    startCombat: (roomId: string, monsterId: string) => void;
    endCombat: () => void;
    markBossDefeated: () => void;  // Called after boss is killed
    restartDungeonMonsters: () => void;  // Respawn all monsters, reset to room 1

    // Persistence
    loadPersistedState: (state: PersistedDungeonState | null) => void;
    getPersistedState: () => PersistedDungeonState | null;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get entry position for room based on entry direction.
 * Places player 1 tile inward from the door.
 */
function getEntryPosition(
    layout: string[],
    width: number,
    height: number,
    entryDirection: Direction
): [number, number] {
    switch (entryDirection) {
        case 'north':
            return [Math.floor(width / 2), 1];
        case 'south':
            return [Math.floor(width / 2), height - 2];
        case 'east':
            return [width - 2, Math.floor(height / 2)];
        case 'west':
            return [1, Math.floor(height / 2)];
    }
}

/**
 * Create empty room state.
 */
function createEmptyRoomState(): RoomState {
    return {
        chestsOpened: [],
        monstersKilled: [],
        trapsTriggered: [],
        puzzlesSolved: [],
    };
}

// ============================================
// Store
// ============================================

export const useDungeonStore = create<DungeonState>()((set, get) => ({
    // Initial state
    isInDungeon: false,
    isPreviewMode: false,
    dungeonInstanceId: null,
    dungeonTemplateId: null,
    scaledLevel: 1,
    currentRoomId: '',
    playerPosition: [0, 0],
    playerFacing: 'south',
    visitedRooms: new Set(),
    roomStates: {},
    activeCombatMonsterId: null,
    activeCombatRoomId: null,
    pendingLoot: [],
    sessionGold: 0,
    sessionXP: 0,
    bossDefeated: false,
    explorationState: 'LOADING',

    // Actions
    enterDungeon: (templateId: string, playerLevel: number, isPreview = false) => {
        const template = getDungeonTemplate(templateId);
        if (!template || template.rooms.length === 0) {
            console.error(`[DungeonStore] Template not found: ${templateId}`);
            return false;
        }

        const firstRoom = template.rooms[0];
        const spawnPosition = findSpawnPosition(firstRoom.layout) ?? [4, 3];

        // Load prior exploration history for this dungeon template (for map fog of war)
        const priorExploration = useCharacterStore.getState().getDungeonExploration(templateId);
        const combinedRooms = [...new Set([firstRoom.id, ...priorExploration])];

        set({
            isInDungeon: true,
            isPreviewMode: isPreview,
            dungeonInstanceId: crypto.randomUUID(),
            dungeonTemplateId: templateId,
            scaledLevel: playerLevel,
            currentRoomId: firstRoom.id,
            playerPosition: spawnPosition,
            playerFacing: 'south',
            visitedRooms: new Set(combinedRooms),
            roomStates: { [firstRoom.id]: createEmptyRoomState() },
            pendingLoot: [],
            sessionGold: 0,
            sessionXP: 0,
            bossDefeated: false,
            explorationState: 'EXPLORING',
        });

        return true;
    },

    exitDungeon: () => {
        const state = get();

        // Save exploration history for map persistence
        if (state.dungeonTemplateId && state.visitedRooms.size > 0) {
            useCharacterStore.getState().updateDungeonExploration(
                state.dungeonTemplateId,
                [...state.visitedRooms]
            );
        }

        // === ACTIVITY LOGGING (Phase 4) ===
        // Log dungeon completion for progress tracking
        // Log on any dungeon exit where we visited rooms
        if (state.visitedRooms.size > 0) {
            const today = new Date();
            const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            useCharacterStore.getState().logActivity({
                type: 'dungeon_complete',
                date: dateString,
                xpGained: state.sessionXP,
                goldGained: state.sessionGold,
                dungeonId: state.dungeonTemplateId ?? undefined,
                details: `Completed dungeon (${state.visitedRooms.size} rooms explored)`,
            });
        }

        set({
            isInDungeon: false,
            isPreviewMode: false,
            dungeonInstanceId: null,
            dungeonTemplateId: null,
            scaledLevel: 1,
            currentRoomId: '',
            playerPosition: [0, 0],
            playerFacing: 'south',
            visitedRooms: new Set(),
            roomStates: {},
            pendingLoot: [],
            sessionGold: 0,
            sessionXP: 0,
            bossDefeated: false,
            explorationState: 'LOADING',
        });
    },

    movePlayer: (x: number, y: number, facing: Direction) => {
        set({
            playerPosition: [x, y],
            playerFacing: facing,
        });
    },

    setPlayerFacing: (facing: Direction) => {
        set({ playerFacing: facing });
    },

    changeRoom: (roomId: string, entryDirection: Direction) => {
        const state = get();
        const template = getDungeonTemplate(state.dungeonTemplateId ?? '');
        if (!template) return;

        const room = template.rooms.find(r => r.id === roomId);
        if (!room) {
            console.error(`[DungeonStore] Room not found: ${roomId}`);
            return;
        }

        // Calculate entry position based on which door we came through
        const entryPosition = getEntryPosition(room.layout, room.width, room.height, entryDirection);

        // Initialize room state if first visit
        const newRoomStates = { ...state.roomStates };
        if (!newRoomStates[roomId]) {
            newRoomStates[roomId] = createEmptyRoomState();
        }

        const newVisitedRooms = new Set(state.visitedRooms);
        newVisitedRooms.add(roomId);

        set({
            currentRoomId: roomId,
            playerPosition: entryPosition,
            playerFacing: entryDirection, // Face the direction we entered from
            visitedRooms: newVisitedRooms,
            roomStates: newRoomStates,
        });
    },

    setExplorationState: (state: ExplorationState) => {
        set({ explorationState: state });
    },

    markChestOpened: (roomId: string, chestId: string) => {
        const state = get();
        const roomState = state.roomStates[roomId] ?? createEmptyRoomState();

        if (roomState.chestsOpened.includes(chestId)) return;

        set({
            roomStates: {
                ...state.roomStates,
                [roomId]: {
                    ...roomState,
                    chestsOpened: [...roomState.chestsOpened, chestId],
                },
            },
        });
    },

    markMonsterKilled: (roomId: string, monsterId: string) => {
        const state = get();
        const roomState = state.roomStates[roomId] ?? createEmptyRoomState();

        if (roomState.monstersKilled.includes(monsterId)) return;

        set({
            roomStates: {
                ...state.roomStates,
                [roomId]: {
                    ...roomState,
                    monstersKilled: [...roomState.monstersKilled, monsterId],
                },
            },
        });
    },

    addPendingLoot: (loot: LootReward[]) => {
        const state = get();
        set({ pendingLoot: [...state.pendingLoot, ...loot] });
    },

    addSessionGold: (gold: number) => {
        const state = get();
        set({ sessionGold: state.sessionGold + gold });
    },

    addSessionXP: (xp: number) => {
        const state = get();
        set({ sessionXP: state.sessionXP + xp });
    },

    startCombat: (roomId: string, monsterId: string) => {
        set({
            activeCombatMonsterId: monsterId,
            activeCombatRoomId: roomId,
            explorationState: 'IN_COMBAT',
        });
    },

    endCombat: () => {
        set({
            activeCombatMonsterId: null,
            activeCombatRoomId: null,
            explorationState: 'EXPLORING',
        });
    },

    markBossDefeated: () => {
        set({ bossDefeated: true });
    },

    restartDungeonMonsters: () => {
        const state = get();
        const template = getDungeonTemplate(state.dungeonTemplateId ?? '');
        if (!template || template.rooms.length === 0) return;

        // Clear monstersKilled from all rooms but keep chestsOpened
        const newRoomStates: Record<string, RoomState> = {};
        for (const [roomId, roomState] of Object.entries(state.roomStates)) {
            newRoomStates[roomId] = {
                ...roomState,
                monstersKilled: [], // Clear killed monsters
            };
        }

        // Reset to first room
        const firstRoom = template.rooms[0];
        const spawnPosition = findSpawnPosition(firstRoom.layout) ?? [4, 3];

        set({
            currentRoomId: firstRoom.id,
            playerPosition: spawnPosition,
            playerFacing: 'south',
            roomStates: newRoomStates,
            activeCombatMonsterId: null,
            activeCombatRoomId: null,
            explorationState: 'EXPLORING',
        });
    },

    // Persistence
    loadPersistedState: (persisted: PersistedDungeonState | null) => {
        if (!persisted) return;

        const template = getDungeonTemplate(persisted.dungeonTemplateId);
        if (!template) {
            console.warn(`[DungeonStore] Cannot restore - template not found: ${persisted.dungeonTemplateId}`);
            return;
        }

        const room = template.rooms.find(r => r.id === persisted.currentRoomId);
        if (!room) {
            console.warn(`[DungeonStore] Cannot restore - room not found: ${persisted.currentRoomId}`);
            return;
        }

        // Reset player to room entry point
        const spawnPosition = findSpawnPosition(room.layout) ?? [4, 3];

        set({
            isInDungeon: true,
            isPreviewMode: false,
            dungeonInstanceId: persisted.dungeonInstanceId,
            dungeonTemplateId: persisted.dungeonTemplateId,
            currentRoomId: persisted.currentRoomId,
            playerPosition: spawnPosition,
            playerFacing: 'south',
            visitedRooms: new Set(persisted.visitedRooms),
            roomStates: persisted.roomStates,
            pendingLoot: persisted.pendingLoot,
            sessionGold: persisted.sessionGold,
            sessionXP: persisted.sessionXP,
            explorationState: 'EXPLORING',
        });
    },

    getPersistedState: (): PersistedDungeonState | null => {
        const state = get();
        if (!state.isInDungeon || state.isPreviewMode) return null;

        return {
            dungeonInstanceId: state.dungeonInstanceId!,
            dungeonTemplateId: state.dungeonTemplateId!,
            currentRoomId: state.currentRoomId,
            visitedRooms: Array.from(state.visitedRooms),
            roomStates: state.roomStates,
            pendingLoot: state.pendingLoot,
            sessionGold: state.sessionGold,
            sessionXP: state.sessionXP,
        };
    },
}));
