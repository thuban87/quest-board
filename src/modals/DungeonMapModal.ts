/**
 * Dungeon Map Modal
 * 
 * Full-screen map showing all rooms, connections, and player position.
 * Only shows rooms that have been visited - true fog of war.
 */

import { Modal, App } from 'obsidian';
import type { DungeonTemplate, Direction } from '../models/Dungeon';
import { calculateRoomPositions, type RoomMapData, type DungeonMapLayout } from '../services/DungeonMapService';

// ============================================
// Types
// ============================================

interface DungeonMapModalOptions {
    app: App;
    template: DungeonTemplate;
    currentRoomId: string;
    visitedRooms: Set<string>;
    playerPosition: [number, number];
}

// ============================================
// Modal
// ============================================

export class DungeonMapModal extends Modal {
    private template: DungeonTemplate;
    private currentRoomId: string;
    private visitedRooms: Set<string>;
    private playerPosition: [number, number];
    private keydownHandler: (e: KeyboardEvent) => void;
    private ignoreNextMKey: boolean = true; // Ignore the M key that opened the modal

    constructor(options: DungeonMapModalOptions) {
        super(options.app);
        this.template = options.template;
        this.currentRoomId = options.currentRoomId;
        this.visitedRooms = options.visitedRooms;
        this.playerPosition = options.playerPosition;

        // Bind handler for M key to close (with protection against same-press close)
        this.keydownHandler = (e: KeyboardEvent) => {
            if (e.key === 'm' || e.key === 'M') {
                if (this.ignoreNextMKey) {
                    // Skip the M keypress that opened the modal
                    this.ignoreNextMKey = false;
                    return;
                }
                e.preventDefault();
                this.close();
            }
        };
    }

    onOpen() {
        const { contentEl, modalEl } = this;

        modalEl.addClass('qb-dungeon-map-modal');
        contentEl.empty();

        // Reset ignore flag and add keyboard listener for M to close
        this.ignoreNextMKey = true;
        document.addEventListener('keydown', this.keydownHandler);

        // Calculate room layout
        const layout = calculateRoomPositions(this.template);

        // Header
        const header = contentEl.createDiv({ cls: 'qb-map-header' });
        header.createEl('h2', { text: `${this.template.name} - Map` });
        header.createEl('p', {
            text: `Rooms Explored: ${this.visitedRooms.size} / ${this.template.rooms.length}`,
            cls: 'qb-map-progress'
        });

        // Map container  
        const mapContainer = contentEl.createDiv({ cls: 'qb-full-map-container' });

        // Calculate grid dimensions for CSS based on VISITED rooms only
        // We need to find bounds of only visited rooms for proper layout
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const room of layout.rooms.values()) {
            if (this.visitedRooms.has(room.roomId)) {
                minX = Math.min(minX, room.mapX);
                maxX = Math.max(maxX, room.mapX);
                minY = Math.min(minY, room.mapY);
                maxY = Math.max(maxY, room.mapY);
            }
        }

        // Handle case where no rooms visited yet (use full layout)
        if (minX === Infinity) {
            minX = layout.minX;
            maxX = layout.maxX;
            minY = layout.minY;
            maxY = layout.maxY;
        }

        const gridWidth = maxX - minX + 1;
        const gridHeight = maxY - minY + 1;

        const mapGrid = mapContainer.createDiv({ cls: 'qb-full-map-grid' });
        mapGrid.style.setProperty('--map-cols', String(gridWidth));
        mapGrid.style.setProperty('--map-rows', String(gridHeight));

        // Render connections first (so rooms appear on top) - only for visited rooms
        this.renderConnections(mapGrid, layout, minX, minY);

        // Render ONLY visited rooms
        for (const room of layout.rooms.values()) {
            if (this.visitedRooms.has(room.roomId)) {
                this.renderRoom(mapGrid, room, minX, minY);
            }
        }

        // Info text if dungeon not fully explored
        if (this.visitedRooms.size < this.template.rooms.length) {
            const infoText = mapContainer.createDiv({ cls: 'qb-map-info' });
            infoText.setText('Explore more rooms to reveal the full map!');
        }

        // Close button
        const footer = contentEl.createDiv({ cls: 'qb-map-footer' });
        const closeBtn = footer.createEl('button', { text: 'Close (M)', cls: 'qb-btn qb-btn-primary' });
        closeBtn.addEventListener('click', () => this.close());
    }

    private renderRoom(container: HTMLElement, room: RoomMapData, offsetX: number, offsetY: number): void {
        const isCurrent = room.roomId === this.currentRoomId;
        const isBoss = room.roomType === 'boss';

        // Calculate grid position (offset to 1-indexed, adjust for visited room bounds)
        const gridCol = room.mapX - offsetX + 1;
        const gridRow = room.mapY - offsetY + 1;

        const roomEl = container.createDiv({
            cls: `qb-map-room visited ${isCurrent ? 'current' : ''} ${isBoss ? 'boss' : ''}`
        });
        roomEl.style.gridColumn = String(gridCol);
        roomEl.style.gridRow = String(gridRow);

        // Room content
        const roomContent = roomEl.createDiv({ cls: 'qb-map-room-content' });

        if (isBoss) {
            roomContent.createSpan({ text: '💀', cls: 'qb-map-boss-icon' });
        }

        // Player marker on current room
        if (isCurrent) {
            const playerMarker = roomContent.createDiv({ cls: 'qb-map-player-marker' });
            playerMarker.createSpan({ text: '⬤' });
        }

        // Room name tooltip
        roomEl.setAttribute('title', this.getRoomDisplayName(room));
    }

    private renderConnections(container: HTMLElement, layout: DungeonMapLayout, offsetX: number, offsetY: number): void {
        // Create SVG overlay for connections
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.classList.add('qb-map-connections');

        // Use visited-only bounds for viewBox
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const room of layout.rooms.values()) {
            if (this.visitedRooms.has(room.roomId)) {
                minX = Math.min(minX, room.mapX);
                maxX = Math.max(maxX, room.mapX);
                minY = Math.min(minY, room.mapY);
                maxY = Math.max(maxY, room.mapY);
            }
        }

        if (minX === Infinity) return; // No visited rooms

        const gridWidth = maxX - minX + 1;
        const gridHeight = maxY - minY + 1;

        // Set viewBox to match grid
        svg.setAttribute('viewBox', `0 0 ${gridWidth * 100} ${gridHeight * 100}`);
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';

        // Track drawn connections to avoid duplicates
        const drawnConnections = new Set<string>();

        for (const room of layout.rooms.values()) {
            // Only draw connections FROM visited rooms
            if (!this.visitedRooms.has(room.roomId)) continue;

            const startX = (room.mapX - offsetX + 0.5) * 100;
            const startY = (room.mapY - offsetY + 0.5) * 100;

            for (const conn of room.connections) {
                const targetRoom = layout.rooms.get(conn.targetRoomId);
                if (!targetRoom) continue;

                // Only draw connections TO visited rooms
                if (!this.visitedRooms.has(conn.targetRoomId)) continue;

                // Create unique connection ID to avoid duplicates
                const connId = [room.roomId, conn.targetRoomId].sort().join('-');
                if (drawnConnections.has(connId)) continue;
                drawnConnections.add(connId);

                const endX = (targetRoom.mapX - offsetX + 0.5) * 100;
                const endY = (targetRoom.mapY - offsetY + 0.5) * 100;

                const line = document.createElementNS(svgNS, 'line');
                line.setAttribute('x1', String(startX));
                line.setAttribute('y1', String(startY));
                line.setAttribute('x2', String(endX));
                line.setAttribute('y2', String(endY));
                line.classList.add('qb-map-connection');

                svg.appendChild(line);
            }
        }

        container.appendChild(svg);
    }

    private getRoomDisplayName(room: RoomMapData): string {
        // Capitalize room ID and replace underscores with spaces
        const name = room.roomId
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        const typeLabel = room.roomType.charAt(0).toUpperCase() + room.roomType.slice(1);
        return `${name} (${typeLabel})`;
    }

    onClose() {
        // Remove keyboard listener
        document.removeEventListener('keydown', this.keydownHandler);
        this.contentEl.empty();
    }
}
