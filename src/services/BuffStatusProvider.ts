/**
 * Buff Status Provider
 * 
 * Status bar provider for displaying active power-ups/buffs.
 * Shows condensed view in status bar, with click to show full tray.
 */

import { StatusBarProvider } from './StatusBarService';
import { useCharacterStore } from '../store/characterStore';
import { formatTimeRemaining } from '../utils/timeFormatters';
import { ActivePowerUp } from '../models/Character';

/**
 * Filter out expired buffs and passive (no expiration) buffs for display
 */
function getActiveTimedBuffs(powerUps: ActivePowerUp[]): ActivePowerUp[] {
    const now = Date.now();
    return powerUps.filter(buff => {
        // Skip passive buffs (class perks) - they have no expiration
        if (buff.expiresAt === null) return false;

        // Skip expired buffs
        const expiresTime = new Date(buff.expiresAt).getTime();
        return expiresTime > now;
    });
}

/**
 * Create the popup tray element
 */
function createBuffTray(buffs: ActivePowerUp[]): HTMLElement {
    const tray = document.createElement('div');
    tray.className = 'qb-buff-tray';

    // Header
    const header = document.createElement('div');
    header.className = 'qb-buff-tray-header';
    header.textContent = 'Active Buffs';
    tray.appendChild(header);

    // Buff list
    const list = document.createElement('div');
    list.className = 'qb-buff-tray-list';

    for (const buff of buffs) {
        const item = document.createElement('div');
        item.className = 'qb-buff-tray-item';

        const icon = document.createElement('span');
        icon.className = 'qb-buff-tray-icon';
        icon.textContent = buff.icon;

        const info = document.createElement('div');
        info.className = 'qb-buff-tray-info';

        const name = document.createElement('span');
        name.className = 'qb-buff-tray-name';
        name.textContent = buff.name;

        const desc = document.createElement('span');
        desc.className = 'qb-buff-tray-desc';
        desc.textContent = buff.description;

        const time = document.createElement('span');
        time.className = 'qb-buff-tray-time';
        time.textContent = formatTimeRemaining(buff.expiresAt);

        info.appendChild(name);
        info.appendChild(desc);

        item.appendChild(icon);
        item.appendChild(info);
        item.appendChild(time);
        list.appendChild(item);
    }

    tray.appendChild(list);
    return tray;
}

/**
 * Provider for active power-ups in the status bar
 */
export class BuffStatusProvider implements StatusBarProvider {
    readonly id = 'buffs';
    readonly priority = 10; // Display first

    private activeTray: HTMLElement | null = null;

    getContent(): string | null {
        const character = useCharacterStore.getState().character;

        if (!character?.activePowerUps?.length) {
            return null;
        }

        const activeBuffs = getActiveTimedBuffs(character.activePowerUps);

        if (activeBuffs.length === 0) {
            return null;
        }

        // Show just icon + count for compact display
        const first = activeBuffs[0];
        if (activeBuffs.length === 1) {
            const timeLeft = formatTimeRemaining(first.expiresAt);
            return `${first.icon} ${timeLeft}`;
        }

        return `${first.icon} ${activeBuffs.length}`;
    }

    /**
     * Handle click on status bar to show/hide buff tray
     */
    onClick(statusBarElement: HTMLElement): void {
        const character = useCharacterStore.getState().character;
        if (!character?.activePowerUps?.length) return;

        const activeBuffs = getActiveTimedBuffs(character.activePowerUps);
        if (activeBuffs.length === 0) return;

        // Toggle tray
        if (this.activeTray) {
            this.closeTray();
            return;
        }

        // Create and position tray
        this.activeTray = createBuffTray(activeBuffs);
        document.body.appendChild(this.activeTray);

        // Position above status bar
        const rect = statusBarElement.getBoundingClientRect();
        this.activeTray.style.position = 'fixed';
        this.activeTray.style.bottom = `${window.innerHeight - rect.top + 8}px`;
        this.activeTray.style.right = `${window.innerWidth - rect.right}px`;

        // Close on click outside
        const closeHandler = (e: MouseEvent) => {
            if (this.activeTray && !this.activeTray.contains(e.target as Node) && !statusBarElement.contains(e.target as Node)) {
                this.closeTray();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
    }

    closeTray(): void {
        if (this.activeTray) {
            this.activeTray.remove();
            this.activeTray = null;
        }
    }
}
