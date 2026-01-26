/**
 * Dungeon View Component
 * 
 * Full-page dungeon exploration interface with CSS Grid room rendering,
 * player sprite, and click-to-move interaction.
 */

import React, { useCallback, useMemo } from 'react';
import { Platform, DataAdapter } from 'obsidian';
import { useDungeonStore } from '../store/dungeonStore';
import { useCharacterStore } from '../store/characterStore';
import { getDungeonTemplate } from '../data/dungeonTemplates';
import { getTileDefinition, LAYOUT_CHARS } from '../data/TileRegistry';
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

    // Check if interactive tile has been used
    const isChestOpened = char === LAYOUT_CHARS.CHEST &&
        roomState?.chestsOpened.includes(`chest_${x}_${y}`);
    const isMonsterKilled = char === LAYOUT_CHARS.MONSTER &&
        roomState?.monstersKilled.includes(`monster_${x}_${y}`);

    // For opened chests/killed monsters, render as floor
    if (isChestOpened || isMonsterKilled) {
        const floorDef = getTileDefinition('.', tileSet);
        const floorPath = getTileSpritePath(adapter, manifestDir, tileSet, floorDef.sprite);
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

export const DungeonView: React.FC<DungeonViewProps> = ({ manifestDir, adapter, onClose }) => {
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

    const character = useCharacterStore(state => state.character);

    const isMobile = Platform.isMobile;

    // Scalable tile/sprite sizes - 2x for desktop, 1x for mobile/smaller screens
    // CSS handles the responsive switch via media query, but we need matching JS values
    // For simplicity, use 2x by default (128px tiles), 1x for mobile (64px tiles)
    const tileSize = isMobile ? 64 : 128;
    const spriteOffset = isMobile ? 8 : 16;

    // Get template and current room
    const template = dungeonTemplateId
        ? getDungeonTemplate(dungeonTemplateId)
        : null;
    const room = template?.rooms.find(r => r.id === currentRoomId);
    const roomState = roomStates[currentRoomId];

    // Handle tile click - teleport in preview, check for doors
    const changeRoom = useDungeonStore(state => state.changeRoom);

    const handleTileClick = useCallback((x: number, y: number) => {
        console.log(`[DungeonView] Tile clicked: [${x}, ${y}]`);

        if (!room || !template) return;

        // Check if clicking on a door
        const doorKey = `${x},${y}`;
        const doorInfo = room.doors[doorKey];

        if (doorInfo) {
            console.log(`[DungeonView] Door clicked! Going to ${doorInfo.targetRoom}`);
            changeRoom(doorInfo.targetRoom, doorInfo.targetEntry);
            return;
        }

        // In preview mode, allow direct teleport for testing
        if (isPreviewMode) {
            const tileDef = getTileDefinition(room.layout[y]?.[x] ?? '.', template.tileSet);
            if (tileDef?.walkable) {
                // Determine facing based on movement direction
                const [currentX, currentY] = playerPosition;
                let facing: Direction = playerFacing;

                if (x > currentX) facing = 'east';
                else if (x < currentX) facing = 'west';
                else if (y > currentY) facing = 'south';
                else if (y < currentY) facing = 'north';

                movePlayer(x, y, facing);
            } else {
                console.log(`[DungeonView] Tile not walkable`);
            }
        }
    }, [isPreviewMode, room, template, playerPosition, playerFacing, movePlayer, changeRoom]);

    // Handle exit
    const handleExit = useCallback(() => {
        exitDungeon();
        onClose();
    }, [exitDungeon, onClose]);

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
        <div className={`qb-dungeon-view ${isMobile ? 'mobile' : ''}`}>
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

            <div className="qb-dungeon-content">
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
        </div>
    );
};
