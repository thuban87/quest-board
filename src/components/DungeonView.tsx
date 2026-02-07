/**
 * Dungeon View Component
 * 
 * Full-page dungeon exploration interface with CSS Grid room rendering,
 * player sprite, and click-to-move interaction.
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Platform, DataAdapter, Notice, App } from 'obsidian';
import { useDungeonStore } from '../store/dungeonStore';
import { useCharacterStore } from '../store/characterStore';
import { useBattleStore } from '../store/battleStore';
import { getDungeonTemplate } from '../data/dungeons';
import { getTileDefinition, LAYOUT_CHARS, getChestSpritePath } from '../data/TileRegistry';
import { findPath, getFacingDirection, getStepPosition, canWalkTo } from '../utils/pathfinding';
import { lootGenerationService } from '../services/LootGenerationService';
import { monsterService } from '../services/MonsterService';
import { startBattleWithMonster } from '../services/BattleService';
import { getMonsterGifPath, getPlayerSpritePath as getSpritePlayerPath, getPlayerBattleSprite } from '../services/SpriteService';
import { BattleView } from './BattleView';
import { DungeonDeathModal, calculateRescueCost } from '../modals/DungeonDeathModal';
import { InventoryModal } from '../modals/InventoryModal';
import { DungeonMapModal } from '../modals/DungeonMapModal';
import { useUIStore } from '../store/uiStore';
import type { Direction, RoomTemplate, TileSet, DungeonTemplate } from '../models/Dungeon';
import type { LootDrop } from '../models/Gear';

// =====================
// TYPES
// =====================

interface DungeonViewProps {
    assetFolder: string;
    adapter: DataAdapter;
    app: App;
    onClose: () => void;
    onSave?: () => void;
}

// =====================
// HELPER FUNCTIONS
// =====================

/**
 * Get the tier folder name from character level.
 * Spread across 40 levels: L1-8=T1, L9-16=T2, L17-24=T3, L25-32=T4, L33-40=T5
 */
function getTierFromLevel(level: number): number {
    if (level <= 8) return 1;
    if (level <= 16) return 2;
    if (level <= 24) return 3;
    if (level <= 32) return 4;
    return 5;
}

/**
 * Build the player sprite path based on character state.
 * Folder paths use hyphens, file names use underscores.
 */
function getPlayerSpritePath(
    adapter: DataAdapter,
    assetFolder: string,
    characterClass: string,
    level: number,
    facing: Direction
): string {
    const tier = getTierFromLevel(level);
    return getSpritePlayerPath(assetFolder, adapter, characterClass, tier, facing as any);
}

/**
 * Get tile sprite path using adapter
 */
function getTileSpritePath(
    adapter: DataAdapter,
    assetFolder: string,
    tileSet: TileSet,
    spriteName: string | null
): string | null {
    if (!spriteName) return null;
    const relativePath = `${assetFolder}/environment/${spriteName}`;
    return adapter.getResourcePath(relativePath);
}

// =====================
// SUB-COMPONENTS
// =====================

/**
 * Single tile in the dungeon grid.
 * Uses sprite image with emoji fallback.
 */
interface TileProps {
    char: string;
    x: number;
    y: number;
    tileSet: TileSet;
    assetFolder: string;
    adapter: DataAdapter;
    roomState?: { chestsOpened: string[]; monstersKilled: string[] };
    monsterSpritePath?: string | null;  // Sprite path for monster tiles
}

function Tile({ char, x, y, tileSet, assetFolder, adapter, roomState, monsterSpritePath }: TileProps) {
    const tileDef = getTileDefinition(char, tileSet);
    const spritePath = getTileSpritePath(adapter, assetFolder, tileSet, tileDef.sprite);

    // Get floor tile for overlay rendering
    const floorDef = getTileDefinition('.', tileSet);
    const floorPath = getTileSpritePath(adapter, assetFolder, tileSet, floorDef.sprite);

    // Check if interactive tile has been used
    const isChestOpened = char === LAYOUT_CHARS.CHEST &&
        roomState?.chestsOpened.includes(`chest_${x}_${y}`);
    const isMonsterKilled = char === LAYOUT_CHARS.MONSTER &&
        roomState?.monstersKilled.includes(`monster_${x}_${y}`);

    // For opened chests, show open sprite
    if (isChestOpened) {
        // Get the open sprite path directly from tile definition
        const tileDef = getTileDefinition('C', tileSet);
        const openSpriteName = tileDef.openSprite || tileDef.sprite;
        const chestSpritePath = openSpriteName
            ? adapter.getResourcePath(`${assetFolder}/environment/${openSpriteName}`)
            : null;
        return (
            <div
                className="qb-tile qb-tile-chest qb-tile-overlay-container"
                data-x={x}
                data-y={y}
                style={floorPath ? { backgroundImage: `url("${floorPath}")` } : undefined}
            >
                {chestSpritePath ? (
                    <div
                        className="qb-tile-overlay qb-chest-opened"
                        style={{ backgroundImage: `url("${chestSpritePath}")` }}
                    />
                ) : (
                    <span className="qb-tile-emoji">📭</span>
                )}
            </div>
        );
    }

    // For killed monsters, render as floor only
    if (isMonsterKilled) {
        return (
            <div
                className="qb-tile qb-tile-floor"
                data-x={x}
                data-y={y}
                style={floorPath ? { backgroundImage: `url("${floorPath}")` } : undefined}
            >
                {!floorPath && <span className="qb-tile-emoji">{floorDef.emoji}</span>}
            </div>
        );
    }

    // For LIVE monsters, render as floor with monster sprite overlay
    if (char === LAYOUT_CHARS.MONSTER) {
        return (
            <div
                className="qb-tile qb-tile-monster qb-tile-overlay-container"
                data-x={x}
                data-y={y}
                data-walkable={tileDef.walkable}
                style={floorPath ? { backgroundImage: `url("${floorPath}")` } : undefined}
            >
                {monsterSpritePath ? (
                    <img
                        src={monsterSpritePath}
                        alt="Monster"
                        className="qb-monster-sprite"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            // Hide broken image and show emoji fallback (only once)
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent && !parent.querySelector('.qb-monster-emoji')) {
                                const emoji = document.createElement('span');
                                emoji.className = 'qb-tile-emoji qb-monster-emoji';
                                emoji.innerText = '👹';
                                parent.appendChild(emoji);
                            }
                        }}
                    />
                ) : (
                    <span className="qb-tile-emoji qb-monster-emoji">👹</span>
                )}
            </div>
        );
    }

    // Interactive tile styling
    const interactiveClass = tileDef.type === 'chest' ? 'qb-tile-interactive' :
        tileDef.type === 'portal' ? 'qb-tile-portal' : '';

    // For overlay tiles (chests, portals, obstacles), render floor underneath
    if (tileDef.isOverlay) {
        return (
            <div
                className={`qb-tile qb-tile-${tileDef.type} ${interactiveClass} qb-tile-overlay-container`}
                data-x={x}
                data-y={y}
                data-walkable={tileDef.walkable}
                style={floorPath ? { backgroundImage: `url("${floorPath}")` } : undefined}
            >
                {/* Overlay sprite on top of floor */}
                {spritePath ? (
                    <div
                        className="qb-tile-overlay"
                        style={{ backgroundImage: `url("${spritePath}")` }}
                    />
                ) : (
                    <span className="qb-tile-emoji">{tileDef.emoji}</span>
                )}
            </div>
        );
    }

    // Regular tile (floor, wall, etc.)
    return (
        <div
            className={`qb-tile qb-tile-${tileDef.type} ${interactiveClass}`}
            data-x={x}
            data-y={y}
            data-walkable={tileDef.walkable}
            style={spritePath ? { backgroundImage: `url("${spritePath}")` } : undefined}
        >
            {!spritePath && <span className="qb-tile-emoji">{tileDef.emoji}</span>}
        </div>
    );
}

/**
 * Player sprite with direction-based image.
 */
interface PlayerSpriteProps {
    position: [number, number];
    facing: Direction;
    assetFolder: string;
    adapter: DataAdapter;
    characterClass: string;
    level: number;
    tileSize: number;
    spriteOffset: number;
}

function PlayerSprite({ position, facing, assetFolder, adapter, characterClass, level, tileSize, spriteOffset }: PlayerSpriteProps) {
    const [x, y] = position;
    const spritePath = getPlayerSpritePath(adapter, assetFolder, characterClass, level, facing);

    // Use left/top positioning (sprite centered on tile)
    const leftPx = x * tileSize + spriteOffset;
    const topPx = y * tileSize + spriteOffset;

    const style: React.CSSProperties = {
        left: `${leftPx}px`,
        top: `${topPx}px`,
        transition: 'left 0.15s ease-out, top 0.15s ease-out',
    };

    return (
        <div className="qb-player-sprite" style={style}>
            <img
                src={spritePath}
                alt="Player"
                className="qb-player-image"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    // Hide broken image, show emoji fallback
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                }}
            />
            <span className="qb-player-emoji" style={{ display: 'none' }}>🧙</span>
        </div>
    );
}

/**
 * Unified header with dungeon info, status, HP/mana bars, and quick actions.
 * Consolidates top and bottom bars to prevent scrolling.
 */
interface DungeonHeaderProps {
    dungeonName: string;
    roomName: string;
    isPreviewMode: boolean;
    visitedRooms: number;
    totalRooms: number;
    sessionGold: number;
    sessionXP: number;
    onExit: () => void;
    onAvatarClick: () => void;
    onInventoryClick: () => void;
    onMapClick: () => void;
    currentHP: number;
    maxHP: number;
    currentMana: number;
    maxMana: number;
    characterClass: string;
    level: number;
    assetFolder: string;
    adapter: DataAdapter;
}

function DungeonHeader({
    dungeonName,
    roomName,
    isPreviewMode,
    visitedRooms,
    totalRooms,
    sessionGold,
    sessionXP,
    onExit,
    onAvatarClick,
    onInventoryClick,
    onMapClick,
    currentHP,
    maxHP,
    currentMana,
    maxMana,
    characterClass,
    level,
    assetFolder,
    adapter,
}: DungeonHeaderProps) {
    // Avatar sprite path
    const avatarPath = getPlayerSpritePath(adapter, assetFolder, characterClass, level, 'south');
    const hpPercent = maxHP > 0 ? Math.min(100, (currentHP / maxHP) * 100) : 0;
    const manaPercent = maxMana > 0 ? Math.min(100, (currentMana / maxMana) * 100) : 0;

    return (
        <div className="qb-dungeon-header">
            {/* Left: Avatar + Bars */}
            <div className="qb-dungeon-header-left">
                <button
                    className="qb-dungeon-avatar-btn"
                    onClick={onAvatarClick}
                    title="Open Character Sheet"
                >
                    <img
                        src={avatarPath}
                        alt={characterClass}
                        className="qb-dungeon-avatar-img"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <span className="qb-dungeon-avatar-fallback">🧙</span>
                </button>
                <div className="qb-dungeon-bars">
                    <div className="qb-bar qb-hp-bar">
                        <div
                            className="qb-bar-fill qb-hp-fill"
                            style={{ width: `${hpPercent}%` }}
                        />
                        <span className="qb-bar-text">❤️ {currentHP}/{maxHP}</span>
                    </div>
                    <div className="qb-bar qb-mana-bar">
                        <div
                            className="qb-bar-fill qb-mana-fill"
                            style={{ width: `${manaPercent}%` }}
                        />
                        <span className="qb-bar-text">💧 {currentMana}/{maxMana}</span>
                    </div>
                </div>
            </div>

            {/* Center: Title + Status */}
            <div className="qb-dungeon-header-center">
                <div className="qb-dungeon-title">
                    <span className="qb-dungeon-name">{dungeonName}</span>
                    {isPreviewMode && <span className="qb-preview-badge">PREVIEW</span>}
                </div>
                <div className="qb-dungeon-subtitle">
                    <span className="qb-dungeon-room-name">{roomName}</span>
                </div>
                <div className="qb-dungeon-status-inline">
                    <span className="qb-status-rooms">🗺️ {visitedRooms}/{totalRooms}</span>
                    <span className="qb-status-gold">🪙 {sessionGold}</span>
                    <span className="qb-status-xp">⭐ {sessionXP}</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="qb-dungeon-header-right">
                <button
                    className="qb-map-button"
                    onClick={onMapClick}
                    title="Open Map (M)"
                >
                    🗺️ Map
                </button>
                <button
                    className="qb-dungeon-inventory-btn"
                    onClick={onInventoryClick}
                    title="Open Inventory"
                >
                    🎒
                </button>
                <button className="qb-dungeon-exit" onClick={onExit}>
                    ✕
                </button>
            </div>
        </div>
    );
}

/**
 * Room grid with all tiles and player.
 */
interface RoomGridProps {
    room: RoomTemplate;
    roomId: string;  // Added to fix tile key uniqueness across rooms
    tileSet: TileSet;
    assetFolder: string;
    adapter: DataAdapter;
    playerPosition: [number, number];
    playerFacing: Direction;
    characterClass: string;
    characterLevel: number;
    roomState?: { chestsOpened: string[]; monstersKilled: string[] };
    onTileClick: (x: number, y: number) => void;
    tileSize: number;
    spriteOffset: number;
}

function RoomGrid({
    room,
    roomId,
    tileSet,
    assetFolder,
    adapter,
    playerPosition,
    playerFacing,
    characterClass,
    characterLevel,
    roomState,
    onTileClick,
    tileSize,
    spriteOffset,
}: RoomGridProps) {
    // Single click handler via event delegation
    const handleGridClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const tile = target.closest('.qb-tile') as HTMLElement | null;

        if (tile) {
            const x = parseInt(tile.dataset.x ?? '0', 10);
            const y = parseInt(tile.dataset.y ?? '0', 10);
            onTileClick(x, y);
        }
    }, [onTileClick]);

    // Memoize tiles to prevent re-renders
    const tiles = useMemo(() => {
        const result: JSX.Element[] = [];

        for (let y = 0; y < room.layout.length; y++) {
            const row = room.layout[y];
            for (let x = 0; x < row.length; x++) {
                const char = row[x];

                // Look up monster sprite if this is a monster tile
                let monsterSpritePath: string | null = null;
                if (char === LAYOUT_CHARS.MONSTER && room.monsters) {
                    const monsterDef = room.monsters.find(m =>
                        m.position[0] === x && m.position[1] === y
                    );
                    if (monsterDef && monsterDef.pool.length > 0) {
                        // Use the first template ID and use SpriteService for proper path
                        const templateId = monsterDef.pool[0];
                        monsterSpritePath = getMonsterGifPath(assetFolder, adapter, templateId);
                    }
                }

                result.push(
                    <Tile
                        key={`${roomId}-${x}-${y}`}
                        char={char}
                        x={x}
                        y={y}
                        tileSet={tileSet}
                        assetFolder={assetFolder}
                        adapter={adapter}
                        roomState={roomState}
                        monsterSpritePath={monsterSpritePath}
                    />
                );
            }
        }

        return result;
    }, [roomId, room.layout, room.monsters, tileSet, assetFolder, adapter, roomState]);

    const gridStyle: React.CSSProperties = {
        '--room-width': room.width,
        '--room-height': room.height,
    } as React.CSSProperties;

    return (
        <div
            className="qb-dungeon-grid"
            style={gridStyle}
            onClick={handleGridClick}
        >
            {tiles}
            <PlayerSprite
                position={playerPosition}
                facing={playerFacing}
                assetFolder={assetFolder}
                adapter={adapter}
                characterClass={characterClass}
                level={characterLevel}
                tileSize={tileSize}
                spriteOffset={spriteOffset}
            />
        </div>
    );
}

// =====================
// MAIN COMPONENT
// =====================

// =====================
// D-PAD COMPONENT (Mobile)
// =====================

interface DpadControlsProps {
    onMove: (direction: Direction) => void;
    onInteract: () => void;
}

function DpadControls({ onMove, onInteract }: DpadControlsProps) {
    // Use onTouchStart for immediate response (no 300ms delay)
    const handleDirection = (dir: Direction) => (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        onMove(dir);
    };

    const handleInteract = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        onInteract();
    };

    return (
        <div className="qb-dpad-container">
            <button
                className="qb-dpad-btn qb-dpad-up"
                onTouchStart={handleDirection('north')}
                onClick={handleDirection('north')}
                aria-label="Move up"
            >
                ▲
            </button>
            <button
                className="qb-dpad-btn qb-dpad-left"
                onTouchStart={handleDirection('west')}
                onClick={handleDirection('west')}
                aria-label="Move left"
            >
                ◀
            </button>
            <button
                className="qb-dpad-btn qb-dpad-interact"
                onTouchStart={handleInteract}
                onClick={handleInteract}
                aria-label="Interact"
            >
                ✋
            </button>
            <button
                className="qb-dpad-btn qb-dpad-right"
                onTouchStart={handleDirection('east')}
                onClick={handleDirection('east')}
                aria-label="Move right"
            >
                ▶
            </button>
            <button
                className="qb-dpad-btn qb-dpad-down"
                onTouchStart={handleDirection('south')}
                onClick={handleDirection('south')}
                aria-label="Move down"
            >
                ▼
            </button>
        </div>
    );
}

// =====================
// MAIN COMPONENT
// =====================

/** Delay between steps during animated pathfinding (ms) */
const STEP_DELAY_MS = 200;

/** Cooldown between WASD movements (ms) */
const MOVE_COOLDOWN_MS = 180;

/** Room transition animation duration (ms) */
const TRANSITION_DURATION_MS = 200;

/** Room transition state */
interface TransitionState {
    active: boolean;
    direction: Direction;
    phase: 'exiting' | 'entering' | 'none';
}

export const DungeonView: React.FC<DungeonViewProps> = ({ assetFolder, adapter, app, onClose, onSave }) => {
    // Container ref for keyboard focus
    const containerRef = useRef<HTMLDivElement>(null);

    // Last movement timestamp for WASD cooldown
    const lastMoveTimeRef = useRef<number>(0);

    // Animation state - prevents input during movement
    const [isAnimating, setIsAnimating] = useState(false);

    // Exit summary state - show completion screen
    const [showExitSummary, setShowExitSummary] = useState(false);

    // Room transition state for Zelda-style slide effect
    const [transition, setTransition] = useState<TransitionState>({
        active: false,
        direction: 'south',
        phase: 'none',
    });

    // Use individual selectors for proper reactivity
    const isInDungeon = useDungeonStore(state => state.isInDungeon);
    const isPreviewMode = useDungeonStore(state => state.isPreviewMode);
    const dungeonTemplateId = useDungeonStore(state => state.dungeonTemplateId);
    const currentRoomId = useDungeonStore(state => state.currentRoomId);
    const playerPosition = useDungeonStore(state => state.playerPosition);
    const playerFacing = useDungeonStore(state => state.playerFacing);
    const visitedRooms = useDungeonStore(state => state.visitedRooms);
    const roomStates = useDungeonStore(state => state.roomStates);
    const sessionGold = useDungeonStore(state => state.sessionGold);
    const sessionXP = useDungeonStore(state => state.sessionXP);
    const explorationState = useDungeonStore(state => state.explorationState);
    const activeCombatMonsterId = useDungeonStore(state => state.activeCombatMonsterId);
    const movePlayer = useDungeonStore(state => state.movePlayer);
    const exitDungeon = useDungeonStore(state => state.exitDungeon);
    const changeRoom = useDungeonStore(state => state.changeRoom);
    const startCombat = useDungeonStore(state => state.startCombat);
    const endCombat = useDungeonStore(state => state.endCombat);
    const markMonsterKilled = useDungeonStore(state => state.markMonsterKilled);
    const restartDungeonMonsters = useDungeonStore(state => state.restartDungeonMonsters);

    const character = useCharacterStore(state => state.character);
    const combatState = useBattleStore(state => state.state);
    const resetBattle = useBattleStore(state => state.resetBattle);

    const isMobile = Platform.isMobile;

    // Scalable tile/sprite sizes - desktop: 128px, mobile: 40px (smaller to fit more tiles)
    const tileSize = isMobile ? 40 : 128;
    const spriteOffset = isMobile ? 4 : 16;

    // Get template and current room
    const template = dungeonTemplateId
        ? getDungeonTemplate(dungeonTemplateId)
        : null;
    const room = template?.rooms.find(r => r.id === currentRoomId);
    const roomState = roomStates[currentRoomId];

    /**
     * Open the full dungeon map modal.
     */
    const openMapModal = useCallback(() => {
        if (!template) return;

        new DungeonMapModal({
            app,
            template,
            currentRoomId,
            visitedRooms,
            playerPosition,
        }).open();
    }, [app, template, currentRoomId, visitedRooms, playerPosition, dungeonTemplateId]);

    // Auto-focus container on mount for keyboard controls
    useEffect(() => {
        containerRef.current?.focus();
    }, []);

    // =====================
    // MOVEMENT HANDLERS
    // =====================

    /**
     * Handle room transition with Zelda-style screen slide animation.
     * Blocks input, animates exit, changes room, animates entry.
     */
    const handleRoomTransition = useCallback(async (
        targetRoom: string,
        targetEntry: Direction,
        exitDirection: Direction
    ) => {
        // Block input during transition
        setIsAnimating(true);

        // Start exit animation
        setTransition({ active: true, direction: exitDirection, phase: 'exiting' });
        await new Promise(resolve => setTimeout(resolve, TRANSITION_DURATION_MS));

        // Change room
        changeRoom(targetRoom, targetEntry);

        // Start enter animation
        setTransition({ active: true, direction: targetEntry, phase: 'entering' });
        await new Promise(resolve => setTimeout(resolve, TRANSITION_DURATION_MS));

        // Complete transition
        setTransition({ active: false, direction: 'south', phase: 'none' });
        setIsAnimating(false);
    }, [changeRoom]);

    /**
     * Move player one step in a direction.
     * Checks walkability and door transitions.
     * Has cooldown to prevent too-fast movement.
     */
    const handleDirectionalMove = useCallback((direction: Direction) => {
        if (isAnimating || transition.active || !room || !template) return;

        // Cooldown check for WASD spam prevention
        const now = Date.now();
        if (now - lastMoveTimeRef.current < MOVE_COOLDOWN_MS) return;
        lastMoveTimeRef.current = now;

        const currentPos = useDungeonStore.getState().playerPosition;
        const newPos = getStepPosition(currentPos, direction);
        const [nx, ny] = newPos;

        // Check walkability FIRST
        if (!canWalkTo(newPos, room, template.tileSet)) {
            // Just turn to face that direction
            useDungeonStore.getState().setPlayerFacing(direction);
            return;
        }

        // Check for door at new position
        const doorKey = `${nx},${ny}`;
        const doorInfo = room.doors[doorKey];
        if (doorInfo) {
            movePlayer(nx, ny, direction);
            // Trigger animated room transition
            handleRoomTransition(doorInfo.targetRoom, doorInfo.targetEntry, direction);
            return;
        }

        // Normal movement
        movePlayer(nx, ny, direction);

        // Step-on activation: Check if new position is a live monster
        const char = room.layout[ny]?.[nx];
        if (char === LAYOUT_CHARS.MONSTER) {
            const currentRoomId = useDungeonStore.getState().currentRoomId;
            const monsterId = `monster_${nx}_${ny}`;
            const roomState = useDungeonStore.getState().roomStates[currentRoomId];

            // Check if not already killed
            if (!roomState?.monstersKilled.includes(monsterId)) {
                // Find the monster definition in the room's monsters array
                const monsterDef = room.monsters?.find(m =>
                    m.position[0] === nx && m.position[1] === ny
                );

                if (monsterDef) {
                    // Pick a random template from the pool
                    const templateId = monsterDef.pool[Math.floor(Math.random() * monsterDef.pool.length)];
                    const dungeonState = useDungeonStore.getState();
                    const monsterLevel = dungeonState.scaledLevel;
                    const tier = monsterDef.isBoss ? 'boss' : 'dungeon';

                    // Create the monster instance
                    const monster = monsterService.createMonster(templateId, monsterLevel, tier);
                    if (monster) {
                        // Start battle
                        const battleStarted = startBattleWithMonster(monster);
                        if (battleStarted) {
                            // Set dungeon state to combat
                            useDungeonStore.getState().startCombat(currentRoomId, monsterId);
                        }
                    }
                }
            }
        }
    }, [isAnimating, transition.active, room, template, movePlayer, handleRoomTransition]);

    /**
     * Determine chest tier based on tile type.
     * Currently all chests are 'C', but we can add 'B' for iron, 'G' for golden later.
     */
    const getChestTier = (char: string): 'wooden' | 'iron' | 'golden' => {
        // For now, default to golden since dungeon chests should be valuable
        // Room templates can use different chars for different tiers later
        return 'golden';
    };

    /**
     * Handle interact key - opens chests and triggers monster encounters.
     */
    const handleInteract = useCallback(() => {
        if (isAnimating || transition.active || !room || !template) return;

        const currentRoomId = useDungeonStore.getState().currentRoomId;
        const [px, py] = useDungeonStore.getState().playerPosition;
        const facing = useDungeonStore.getState().playerFacing;
        const targetPos = getStepPosition([px, py], facing);
        const [tx, ty] = targetPos;

        // Bounds check
        if (ty < 0 || ty >= room.layout.length || tx < 0 || tx >= room.layout[ty].length) {
            return;
        }

        const char = room.layout[ty][tx];

        // Handle CHEST interaction
        if (char === LAYOUT_CHARS.CHEST) {
            const chestId = `chest_${tx}_${ty}`;
            const roomState = useDungeonStore.getState().roomStates[currentRoomId];

            // Check if already opened
            if (roomState?.chestsOpened.includes(chestId)) {
                new Notice('This chest is already empty.');
                return;
            }

            // Get character for loot generation
            const char = useCharacterStore.getState().character;
            if (!char) {
                new Notice('No character found!');
                return;
            }

            // Generate loot
            const chestTier = getChestTier(LAYOUT_CHARS.CHEST);
            const loot = lootGenerationService.generateChestLoot(chestTier, char.level, char);

            // Award loot directly
            let goldGained = 0;
            let gearItems: string[] = [];
            let consumables: string[] = [];

            for (const reward of loot) {
                if (reward.type === 'gold') {
                    goldGained += reward.amount;
                    useCharacterStore.getState().updateGold(reward.amount);
                } else if (reward.type === 'gear' && reward.item) {
                    gearItems.push(`${reward.item.tier.toUpperCase()} ${reward.item.slot}`);
                    useCharacterStore.getState().addGear(reward.item);
                } else if (reward.type === 'consumable' && reward.itemId) {
                    consumables.push(`${reward.quantity || 1}x ${reward.itemId}`);
                    useCharacterStore.getState().addInventoryItem(reward.itemId, reward.quantity || 1);
                }
            }

            // Mark chest as opened
            useDungeonStore.getState().markChestOpened(currentRoomId, chestId);

            // Show loot notification
            const lootParts: string[] = [];
            if (goldGained > 0) lootParts.push(`🪙 ${goldGained} gold`);
            if (gearItems.length > 0) lootParts.push(`⚔️ ${gearItems.join(', ')}`);
            if (consumables.length > 0) lootParts.push(`🧪 ${consumables.join(', ')}`);

            new Notice(`📜 Chest opened!\n${lootParts.join('\n')}`, 4000);
            return;
        }

        // Handle MONSTER interaction
        if (char === LAYOUT_CHARS.MONSTER) {
            const monsterId = `monster_${tx}_${ty}`;
            const roomState = useDungeonStore.getState().roomStates[currentRoomId];

            // Check if already killed
            if (roomState?.monstersKilled.includes(monsterId)) {
                new Notice('Nothing here...');
                return;
            }

            // Find the monster definition in the room's monsters array
            const monsterDef = room.monsters?.find(m =>
                m.position[0] === tx && m.position[1] === ty
            );

            if (!monsterDef) {
                console.warn('[DungeonView] Monster at position not found in monsters array:', tx, ty);
                new Notice('Monster encounter coming soon!');
                return;
            }

            // Pick a random template from the pool
            const templateId = monsterDef.pool[Math.floor(Math.random() * monsterDef.pool.length)];
            const dungeonState = useDungeonStore.getState();
            const monsterLevel = dungeonState.scaledLevel;
            const tier = monsterDef.isBoss ? 'boss' : 'dungeon';

            // Create the monster instance
            const monster = monsterService.createMonster(templateId, monsterLevel, tier);
            if (!monster) {
                console.error('[DungeonView] Failed to create monster:', templateId);
                new Notice('Failed to spawn monster!');
                return;
            }

            // Start battle
            const battleStarted = startBattleWithMonster(monster);
            if (battleStarted) {
                // Set dungeon state to combat
                useDungeonStore.getState().startCombat(currentRoomId, monsterId);
            }
            return;
        }

        // Handle PORTAL interaction - exit dungeon
        if (char === LAYOUT_CHARS.PORTAL) {
            setShowExitSummary(true);
            return;
        }
    }, [isAnimating, transition.active, room, template, currentRoomId]);

    /**
     * Animate movement along a path (step by step).
     */
    const animateAlongPath = useCallback(async (path: Array<[number, number]>) => {
        if (path.length === 0) return;

        setIsAnimating(true);
        const { playerPosition: startPos, movePlayer: move } = useDungeonStore.getState();
        let prevPos = startPos;

        for (const [x, y] of path) {
            const facing = getFacingDirection(prevPos, [x, y]);
            move(x, y, facing);

            // Wait for CSS transition to complete
            await new Promise(resolve => setTimeout(resolve, STEP_DELAY_MS));

            // Check for door at this position
            const doorKey = `${x},${y}`;
            if (room?.doors[doorKey]) {
                const doorInfo = room.doors[doorKey];
                // Use animated transition, don't setIsAnimating(false) here as handleRoomTransition will
                await handleRoomTransition(doorInfo.targetRoom, doorInfo.targetEntry, facing);
                return; // handleRoomTransition sets isAnimating to false
            }

            // Step-on monster activation for click-to-move
            const char = room?.layout[y]?.[x];
            if (char === LAYOUT_CHARS.MONSTER) {
                const currentRoomId = useDungeonStore.getState().currentRoomId;
                const monsterId = `monster_${x}_${y}`;
                const roomState = useDungeonStore.getState().roomStates[currentRoomId];

                // Check if not already killed
                if (!roomState?.monstersKilled.includes(monsterId)) {
                    const monsterDef = room?.monsters?.find(m =>
                        m.position[0] === x && m.position[1] === y
                    );

                    if (monsterDef) {
                        const templateId = monsterDef.pool[Math.floor(Math.random() * monsterDef.pool.length)];
                        const dungeonState = useDungeonStore.getState();
                        const monsterLevel = dungeonState.scaledLevel;
                        const tier = monsterDef.isBoss ? 'boss' : 'dungeon';

                        const monster = monsterService.createMonster(templateId, monsterLevel, tier);
                        if (monster) {
                            const battleStarted = startBattleWithMonster(monster);
                            if (battleStarted) {
                                useDungeonStore.getState().startCombat(currentRoomId, monsterId);
                                setIsAnimating(false);
                                return; // Stop path, enter combat
                            }
                        }
                    }
                }
            }

            prevPos = [x, y];
        }

        setIsAnimating(false);
    }, [room, handleRoomTransition]);

    /**
     * Handle tile click with A* pathfinding.
     */
    const handleTileClick = useCallback((x: number, y: number) => {
        if (isAnimating || !room || !template) return;

        // Check if clicking on a door - pathfind TO the door first
        const doorKey = `${x},${y}`;
        const doorInfo = room.doors[doorKey];

        if (doorInfo) {
            // Get current player position
            const currentPos = useDungeonStore.getState().playerPosition;

            // Create path that ends AT the door (we'll handle transition in animateAlongPath)
            // First find path to an adjacent walkable tile, then add the door as final step
            const path = findPath(currentPos, [x, y], room, template.tileSet);

            // If no direct path, try to get close
            if (path === null || path.length === 0) {
                // Maybe we're already adjacent, just transition
                const dist = Math.abs(currentPos[0] - x) + Math.abs(currentPos[1] - y);
                if (dist <= 1) {
                    const facing = getFacingDirection(currentPos, [x, y]);
                    movePlayer(x, y, facing);
                    setTimeout(() => {
                        changeRoom(doorInfo.targetRoom, doorInfo.targetEntry);
                    }, 200);
                    return;
                }
                new Notice("Can't reach that door!");
                return;
            }

            // Animate to door, then transition
            animateAlongPath(path);
            return;
        }

        // Get current player position
        const currentPos = useDungeonStore.getState().playerPosition;

        // Find path using A*
        const path = findPath(currentPos, [x, y], room, template.tileSet);

        if (path === null) {
            new Notice("Can't reach that tile!");
            return;
        }

        if (path.length === 0) {
            // Already at destination
            return;
        }

        // Animate along the path
        animateAlongPath(path);
    }, [isAnimating, room, template, changeRoom, animateAlongPath]);

    // =====================
    // KEYBOARD CONTROLS
    // =====================

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if animating or if input is focused
            if (isAnimating) return;
            if (document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key) {
                case 'w':
                case 'W':
                case 'ArrowUp':
                    e.preventDefault();
                    handleDirectionalMove('north');
                    break;
                case 's':
                case 'S':
                case 'ArrowDown':
                    e.preventDefault();
                    handleDirectionalMove('south');
                    break;
                case 'a':
                case 'A':
                case 'ArrowLeft':
                    e.preventDefault();
                    handleDirectionalMove('west');
                    break;
                case 'd':
                case 'D':
                case 'ArrowRight':
                    e.preventDefault();
                    handleDirectionalMove('east');
                    break;
                case 'e':
                case 'E':
                case 'Enter':
                    e.preventDefault();
                    handleInteract();
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    openMapModal();
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Could show exit confirmation here
                    break;
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [isAnimating, handleDirectionalMove, handleInteract, openMapModal]);

    // =====================
    // EXIT HANDLER
    // =====================

    const handleExit = useCallback(() => {
        exitDungeon();
        // Persist exploration history to disk
        if (onSave) {
            onSave();
        }
        onClose();
    }, [exitDungeon, onClose, onSave]);

    // =====================
    // COMBAT HANDLERS
    // =====================

    /**
     * Handle battle end (victory or retreat - defeat handled via onDefeat)
     */
    const handleBattleEnd = useCallback(() => {
        const battleState = useBattleStore.getState().state;
        const dungeonState = useDungeonStore.getState();
        const { activeCombatMonsterId, activeCombatRoomId } = dungeonState;

        if (battleState === 'VICTORY' && activeCombatMonsterId && activeCombatRoomId) {
            // Mark monster as killed
            markMonsterKilled(activeCombatRoomId, activeCombatMonsterId);
        }

        // End combat state (resume exploring)
        // Note: BattleView calls resetBattle() after onBattleEnd, so we don't call it here
        endCombat();

        // Restore focus to container for WASD movement
        setTimeout(() => {
            containerRef.current?.focus();
        }, 100);
    }, [endCombat, markMonsterKilled]);

    /**
     * Handle defeat - shows DungeonDeathModal with options
     * Called by BattleView via onDefeat prop
     */
    const handleDefeat = useCallback(() => {
        new DungeonDeathModal(app, {
            onRestart: () => {
                resetBattle();
                restartDungeonMonsters();
                endCombat();
                // Restore HP to 50% using updateHP with delta
                const char = useCharacterStore.getState().character;
                if (char) {
                    const targetHP = Math.ceil(char.maxHP / 2);
                    const delta = targetHP - char.currentHP;
                    useCharacterStore.getState().updateHP(delta);
                }
            },
            onRescue: () => {
                // Deduct rescue cost
                const char = useCharacterStore.getState().character;
                if (char) {
                    const cost = calculateRescueCost(char.level);
                    useCharacterStore.getState().updateGold(-cost);
                    // Restore HP to 50% using updateHP with delta
                    const targetHP = Math.ceil(char.maxHP / 2);
                    const delta = targetHP - char.currentHP;
                    useCharacterStore.getState().updateHP(delta);
                }
                resetBattle();
                endCombat();
            },
            onLeave: () => {
                resetBattle();
                endCombat();
                exitDungeon();
                onClose();
            },
        }).open();
    }, [app, endCombat, exitDungeon, onClose, resetBattle, restartDungeonMonsters]);

    /**
     * Handle showing loot from battle victory
     * LootDrop is an array of LootReward objects
     */
    const handleShowLoot = useCallback((loot: LootDrop) => {
        // LootDrop is LootReward[] - iterate and process each reward
        const parts: string[] = [];
        let totalGold = 0;

        for (const reward of loot) {
            if (reward.type === 'gold') {
                useCharacterStore.getState().updateGold(reward.amount);
                totalGold += reward.amount;
                parts.push(`🪙 +${reward.amount} Gold`);
            } else if (reward.type === 'gear') {
                useCharacterStore.getState().addGear(reward.item);
                parts.push(`⚔️ ${reward.item.tier.toUpperCase()} ${reward.item.slot}`);
            } else if (reward.type === 'consumable') {
                useCharacterStore.getState().addInventoryItem(reward.itemId, reward.quantity);
                parts.push(`🧪 ${reward.quantity}x ${reward.itemId}`);
            }
        }

        // Track gold in dungeon session totals for summary screen
        if (totalGold > 0) {
            useDungeonStore.getState().addSessionGold(totalGold);
        }

        // Track XP from the defeated monster
        const monster = useBattleStore.getState().monster;
        if (monster?.xpReward) {
            useDungeonStore.getState().addSessionXP(monster.xpReward);
        }

        if (parts.length > 0) {
            new Notice(`🏆 Victory!\n${parts.join('\n')}`, 4000);
        }
    }, []);

    /**
     * Handle exit summary confirmation
     */
    const handleExitConfirm = useCallback(() => {
        setShowExitSummary(false);
        exitDungeon();
        onClose();
    }, [exitDungeon, onClose]);

    // =====================
    // RENDER
    // =====================

    // Guard: no template or room
    if (!template || !room || !character) {
        return (
            <div className={`qb-dungeon-view ${isMobile ? 'mobile' : ''}`}>
                <div className="qb-dungeon-error">
                    <h2>⚠️ Error</h2>
                    <p>Dungeon not found or not properly initialized.</p>
                    <button className="qb-btn-primary" onClick={onClose}>
                        Return
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`qb-dungeon-view ${isMobile ? 'mobile' : ''}`}
            tabIndex={0}
        >
            <DungeonHeader
                dungeonName={template.name}
                roomName={room.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                isPreviewMode={isPreviewMode}
                visitedRooms={visitedRooms.size}
                totalRooms={template.rooms.length}
                sessionGold={sessionGold}
                sessionXP={sessionXP}
                onExit={handleExit}
                onAvatarClick={() => {
                    // Character sheet not accessible during dungeon - show stats summary
                    const hp = character.currentHP ?? character.maxHP ?? 100;
                    const maxHp = character.maxHP ?? 100;
                    const lvl = character.level;
                    new Notice(`⚔️ Level ${lvl} ${character.class}\n❤️ HP: ${hp}/${maxHp}`);
                }}
                onInventoryClick={() => {
                    // Open the proper inventory modal (same as character sheet)
                    new InventoryModal(app).open();
                }}
                onMapClick={openMapModal}
                currentHP={character.currentHP ?? character.maxHP ?? 100}
                maxHP={character.maxHP ?? 100}
                currentMana={character.currentMana ?? character.maxMana ?? 50}
                maxMana={character.maxMana ?? 50}
                characterClass={character.class}
                level={character.level}
                assetFolder={assetFolder}
                adapter={adapter}
            />

            <div className={`qb-dungeon-content ${transition.active ? `qb-transition-${transition.phase}-${transition.direction}` : ''}`}>
                <RoomGrid
                    room={room}
                    roomId={currentRoomId}
                    tileSet={template.tileSet}
                    assetFolder={assetFolder}
                    adapter={adapter}
                    playerPosition={playerPosition}
                    playerFacing={playerFacing}
                    characterClass={character.class}
                    characterLevel={character.level}
                    roomState={roomState}
                    onTileClick={handleTileClick}
                    tileSize={tileSize}
                    spriteOffset={spriteOffset}
                />

                {/* Combat Overlay */}
                {explorationState === 'IN_COMBAT' && (() => {
                    // Get current monster from battle store for sprite path
                    const currentMonster = useBattleStore.getState().monster;
                    const monsterSpritePath = currentMonster?.templateId
                        ? getMonsterGifPath(assetFolder, adapter, currentMonster.templateId)
                        : undefined;

                    // Get player sprite path for battle (use south-facing for battle stance)
                    const playerSpritePath = getPlayerBattleSprite(
                        assetFolder, adapter, character.class, getTierFromLevel(character.level)
                    );

                    return (
                        <div className="qb-dungeon-combat-overlay">
                            <BattleView
                                onBattleEnd={handleBattleEnd}
                                onShowLoot={handleShowLoot}
                                onDefeat={handleDefeat}
                                monsterSpritePath={monsterSpritePath}
                                playerSpritePath={playerSpritePath}
                            />
                        </div>
                    );
                })()}

                {/* Exit Summary Screen */}
                {showExitSummary && (
                    <div className="qb-dungeon-exit-summary">
                        <div className="qb-exit-icon">🏆</div>
                        <h2>Dungeon Complete!</h2>
                        <div className="qb-exit-stats">
                            <div className="qb-exit-stat">
                                <span className="qb-exit-stat-label">Rooms Explored</span>
                                <span className="qb-exit-stat-value">{visitedRooms.size}/{template.rooms.length}</span>
                            </div>
                            <div className="qb-exit-stat">
                                <span className="qb-exit-stat-label">Gold Earned</span>
                                <span className="qb-exit-stat-value gold">{sessionGold}</span>
                            </div>
                            <div className="qb-exit-stat">
                                <span className="qb-exit-stat-label">XP Earned</span>
                                <span className="qb-exit-stat-value xp">{sessionXP}</span>
                            </div>
                        </div>
                        <button className="qb-exit-btn" onClick={handleExitConfirm}>
                            Complete Dungeon
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile D-Pad Controls - only show when not in combat */}
            {isMobile && explorationState !== 'IN_COMBAT' && !showExitSummary && (
                <DpadControls
                    onMove={handleDirectionalMove}
                    onInteract={handleInteract}
                />
            )}
        </div>
    );
};
