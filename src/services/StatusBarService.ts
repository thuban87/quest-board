/**
 * Status Bar Service
 * 
 * Manages the plugin's status bar item with extensible provider system.
 * Providers register content (buffs, due dates, alerts) and service combines them.
 */

import { Plugin } from 'obsidian';

/**
 * Interface for status bar content providers
 */
export interface StatusBarProvider {
    /** Unique identifier for this provider */
    id: string;

    /** Lower numbers display first (e.g., 10 before 20) */
    priority: number;

    /** 
     * Get content to display. Return null to hide this section.
     * Can include emoji/icons for visual distinction.
     */
    getContent(): string | null;

    /**
     * Optional click handler for interactive providers
     */
    onClick?(element: HTMLElement): void;
}

/**
 * Central service for managing status bar content
 */
export class StatusBarService {
    private element: HTMLElement | null = null;
    private providers: Map<string, StatusBarProvider> = new Map();
    private updateIntervalId: number | null = null;
    private plugin: Plugin | null = null;
    private clickHandler: ((e: MouseEvent) => void) | null = null;

    /**
     * Initialize the status bar item
     * Must be called during plugin onload()
     */
    initialize(plugin: Plugin): void {
        this.plugin = plugin;
        this.element = plugin.addStatusBarItem();
        this.element.addClass('quest-board-status-bar');

        // Add click handler
        this.clickHandler = (e: MouseEvent) => {
            this.handleClick(e);
        };
        this.element.addEventListener('click', this.clickHandler);

        this.update();
    }

    /**
     * Handle click on status bar
     */
    private handleClick(e: MouseEvent): void {
        if (!this.element) return;

        // Notify providers that support onClick
        for (const provider of this.providers.values()) {
            if (provider.onClick) {
                provider.onClick(this.element);
                break; // Only one popup at a time
            }
        }
    }

    /**
     * Register a content provider
     */
    registerProvider(provider: StatusBarProvider): void {
        this.providers.set(provider.id, provider);
        this.update();
    }

    /**
     * Unregister a content provider
     */
    unregisterProvider(id: string): void {
        this.providers.delete(id);
        this.update();
    }

    /**
     * Refresh the status bar content from all providers
     */
    update(): void {
        if (!this.element) return;

        // Collect content from all providers, sorted by priority
        const sortedProviders = Array.from(this.providers.values())
            .sort((a, b) => a.priority - b.priority);

        const contents: string[] = [];
        for (const provider of sortedProviders) {
            const content = provider.getContent();
            if (content) {
                contents.push(content);
            }
        }

        // Join with separator or show empty
        if (contents.length > 0) {
            this.element.setText(contents.join(' │ '));
            this.element.addClass('clickable');
            this.element.show();
        } else {
            this.element.setText('');
            this.element.removeClass('clickable');
            this.element.hide();
        }
    }

    /**
     * Start auto-refresh interval for countdown timers
     * @param intervalMs - Milliseconds between updates (default: 60000 = 1 minute)
     */
    startAutoRefresh(intervalMs: number = 60000): void {
        this.stopAutoRefresh();
        this.updateIntervalId = window.setInterval(() => {
            this.update();
        }, intervalMs);

        // Register with plugin for cleanup
        if (this.plugin) {
            this.plugin.registerInterval(this.updateIntervalId);
        }
    }

    /**
     * Stop auto-refresh interval
     */
    stopAutoRefresh(): void {
        if (this.updateIntervalId !== null) {
            window.clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }
    }

    /**
     * Clean up resources
     * Should be called during plugin onunload()
     */
    destroy(): void {
        this.stopAutoRefresh();
        if (this.element) {
            if (this.clickHandler) {
                this.element.removeEventListener('click', this.clickHandler);
            }
            this.element.remove();
            this.element = null;
        }
        this.providers.clear();
        this.plugin = null;
    }
}

// Singleton instance for easy access across the plugin
export const statusBarService = new StatusBarService();
