/**
 * Dungeon View Component
 * 
 * Full-page dungeon exploration interface with CSS Grid room rendering,
 * player sprite, and click-to-move interaction.
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Platform, DataAdapter, Notice } from 'obsidian';
import { useDungeonStore } from '../store/dungeonStore';
import { useCharacterStore } from '../store/characterStore';
import { getDungeonTemplate } from '../data/dungeonTemplates';
import { getTileDefinition, LAYOUT_CHARS, getChestSpritePath } from '../data/TileRegistry';
import { findPath, getFacingDirection, getStepPosition, canWalkTo } from '../utils/pathfinding';
import { lootGenerationService } from '../services/LootGenerationService';
import type { Direction, RoomTemplate, TileSet } from '../models/Dungeon';

// =====================
// TYPES
// =====================

interface DungeonViewProps {
    manifestDir: string;
    adapter: DataAdapter;
    onClose: () => void;
}

// =====================
// HELPER FUNCTIONS
// =====================

/**
 * Get the tier folder name from character level.
 * L1-5 = tier1, L6-10 = tier2, L11-15 = tier3, L16-20 = tier4, L21+ = tier5
 */
function getTierFromLevel(level: number): number {
    if (level <= 5) return 1;
    if (level <= 10) return 2;
    if (level <= 15) return 3;
    if (level <= 20) return 4;
    return 5;
}

/**
 * Build the player sprite path based on character state.
 * Folder paths use hyphens, file names use underscores.
 */
function getPlayerSpritePath(
    adapter: DataAdapter,
    manifestDir: string,
    characterClass: string,
    level: number,
    facing: Direction
): string {
    const className = characterClass.toLowerCase();
    const tier = getTierFromLevel(level);
    const relativePath = `${manifestDir}/assets/sprites/player/${className}/tier${tier}/${className}_tier_${tier}_${facing}.png`;
    return adapter.getResourcePath(relativePath);
}

/**
 * Get tile sprite path using adapter
 */
function getTileSpritePath(
    adapter: DataAdapter,
    manifestDir: string,
    tileSet: TileSet,
    spriteName: string | null
): string | null {
    if (!spriteName) return null;
    const relativePath = `${manifestDir}/assets/environment/${spriteName}`;
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
    manifestDir: string;
    adapter: DataAdapter;
    roomState?: { chestsOpened: string[]; monstersKilled: string[] };
}

function Tile({ char, x, y, tileSet, manifestDir, adapter, roomState }: TileProps) {
    const tileDef = getTileDefinition(char, tileSet);
    const spritePath = getTileSpritePath(adapter, manifestDir, tileSet, tileDef.sprite);

    // Get floor tile for overlay rendering
    const floorDef = getTileDefinition('.', tileSet);
    const floorPath = getTileSpritePath(adapter, manifestDir, tileSet, floorDef.sprite);

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
            ? adapter.getResourcePath(`${manifestDir}/assets/environment/${openSpriteName}`)
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
    manifestDir: string;
    adapter: DataAdapter;
    characterClass: string;
    level: number;
    tileSize: number;
    spriteOffset: number;
}

function PlayerSprite({ position, facing, manifestDir, adapter, characterClass, level, tileSize, spriteOffset }: PlayerSpriteProps) {
    const [x, y] = position;
    const spritePath = getPlayerSpritePath(adapter, manifestDir, characterClass, level, facing);

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
 * Unified header with dungeon info, status, and exit button.
 * Consolidates top and bottom bars to prevent scrolling.
 */
interface DungeonHeaderProps {
    dungeonName: string;
    roomName: string;
    isPreviewMode: boolean;
    visitedRooms: number;
    totalRooms: number;
    pendingGold: number;
    pendingXP: number;
    onExit: () => void;
}

function DungeonHeader({
    dungeonName,
    roomName,
    isPreviewMode,
    visitedRooms,
    totalRooms,
    pendingGold,
    pendingXP,
    onExit
}: DungeonHeaderProps) {
    return (
        <div className="qb-dungeon-header">
            <div className="qb-dungeon-title">
                <span className="qb-dungeon-name">{dungeonName}</span>
                {isPreviewMode && <span className="qb-preview-badge">PREVIEW</span>}
                <span className="qb-dungeon-room-name">{roomName}</span>
            </div>
            <div className="qb-dungeon-status-inline">
                <span className="qb-status-rooms">🗺️ {visitedRooms}/{totalRooms}</span>
                <span className="qb-status-gold">🪙 {pendingGold}</span>
                <span className="qb-status-xp">⭐ {pendingXP}</span>
            </div>
            <button className="qb-dungeon-exit" onClick={onExit}>
                ✕ Exit
            </button>
        </div>
    );
}

/**
 * Room grid with all tiles and player.
 */
interface RoomGridProps {
    room: RoomTemplate;
    tileSet: TileSet;
    manifestDir: string;
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
    tileSet,
    manifestDir,
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
                result.push(
                    <Tile
                        key={`${x}-${y}`}
                        char={char}
                        x={x}
                        y={y}
                        tileSet={tileSet}
                        manifestDir={manifestDir}
                        adapter={adapter}
                        roomState={roomState}
                    />
                );
            }
        }

        return result;
    }, [room.layout, tileSet, manifestDir, adapter, roomState]);

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
                manifestDir={manifestDir}
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

export const DungeonView: React.FC<DungeonViewProps> = ({ manifestDir, adapter, onClose }) => {
    // Container ref for keyboard focus
    const containerRef = useRef<HTMLDivElement>(null);

    // Last movement timestamp for WASD cooldown
    const lastMoveTimeRef = useRef<number>(0);

    // Animation state - prevents input during movement
    const [isAnimating, setIsAnimating] = useState(false);

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
    const pendingGold = useDungeonStore(state => state.pendingGold);
    const pendingXP = useDungeonStore(state => state.pendingXP);
    const movePlayer = useDungeonStore(state => state.movePlayer);
    const exitDungeon = useDungeonStore(state => state.exitDungeon);
    const changeRoom = useDungeonStore(state => state.changeRoom);

    const character = useCharacterStore(state => state.character);

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
            console.log(`[DungeonView] Walking through door to ${doorInfo.targetRoom}`);
            movePlayer(nx, ny, direction);
            // Trigger animated room transition
            handleRoomTransition(doorInfo.targetRoom, doorInfo.targetEntry, direction);
            return;
        }

        // Normal movement
        movePlayer(nx, ny, direction);
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

        console.log(`[DungeonView] Interact at [${tx}, ${ty}]`);

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
            console.log('[DungeonView] Chest opened:', { chestId, loot });
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

            console.log('[DungeonView] Monster interaction - not yet implemented');
            new Notice('Monster encounter coming soon!');
            return;
        }

        console.log('[DungeonView] Nothing to interact with here');
    }, [isAnimating, transition.active, room, template]);

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
                console.log(`[DungeonView] Path reached door, transitioning to ${doorInfo.targetRoom}`);
                // Use animated transition, don't setIsAnimating(false) here as handleRoomTransition will
                await handleRoomTransition(doorInfo.targetRoom, doorInfo.targetEntry, facing);
                return; // handleRoomTransition sets isAnimating to false
            }

            prevPos = [x, y];
        }

        setIsAnimating(false);
    }, [room, handleRoomTransition]);

    /**
     * Handle tile click with A* pathfinding.
     */
    const handleTileClick = useCallback((x: number, y: number) => {
        console.log(`[DungeonView] Tile clicked: [${x}, ${y}]`);

        if (isAnimating || !room || !template) return;

        // Check if clicking on a door - pathfind TO the door first
        const doorKey = `${x},${y}`;
        const doorInfo = room.doors[doorKey];

        if (doorInfo) {
            console.log(`[DungeonView] Door clicked! Pathfinding to door at [${x},${y}]`);

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
            console.log(`[DungeonView] No path to [${x}, ${y}]`);
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
                case 'Escape':
                    e.preventDefault();
                    // Could show exit confirmation here
                    break;
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [isAnimating, handleDirectionalMove, handleInteract]);

    // =====================
    // EXIT HANDLER
    // =====================

    const handleExit = useCallback(() => {
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
                pendingGold={pendingGold}
                pendingXP={pendingXP}
                onExit={handleExit}
            />

            <div className={`qb-dungeon-content ${transition.active ? `qb-transition-${transition.phase}-${transition.direction}` : ''}`}>
                <RoomGrid
                    room={room}
                    tileSet={template.tileSet}
                    manifestDir={manifestDir}
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
            </div>

            {/* Mobile D-Pad Controls */}
            {isMobile && (
                <DpadControls
                    onMove={handleDirectionalMove}
                    onInteract={handleInteract}
                />
            )}
        </div>
    );
};
