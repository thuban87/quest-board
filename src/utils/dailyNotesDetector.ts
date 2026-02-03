/**
 * Daily Notes Detector
 * 
 * Utility to detect Obsidian's Daily Notes plugin folder configuration.
 * Used by the Daily Quest feature to auto-detect where daily notes are stored.
 */

import { App } from 'obsidian';

/**
 * Daily Notes plugin settings (internal Obsidian structure)
 */
interface DailyNotesOptions {
    folder?: string;
    format?: string;
    template?: string;
}

/**
 * Result of daily notes detection
 */
export interface DailyNotesConfig {
    folder: string;
    format: string;
    detected: boolean;  // true if auto-detected, false if using fallback
}

/**
 * Attempt to detect the Daily Notes folder from Obsidian's core plugin settings.
 * Falls back to common defaults if detection fails.
 * 
 * @param app - Obsidian App instance
 * @returns DailyNotesConfig with folder path and whether it was auto-detected
 */
export function detectDailyNotesConfig(app: App): DailyNotesConfig {
    try {
        // Access internal plugins (undocumented API, but stable)
        const internalPlugins = (app as any).internalPlugins;

        if (internalPlugins?.plugins?.['daily-notes']) {
            const dailyNotesPlugin = internalPlugins.plugins['daily-notes'];

            if (dailyNotesPlugin?.enabled) {
                const options: DailyNotesOptions = dailyNotesPlugin.instance?.options || {};

                return {
                    folder: options.folder || '',  // Empty string means vault root
                    format: options.format || 'YYYY-MM-DD',
                    detected: true,
                };
            }
        }

        // Try Periodic Notes community plugin as fallback
        const periodicNotes = (app as any).plugins?.plugins?.['periodic-notes'];
        if (periodicNotes?.settings?.daily?.folder) {
            return {
                folder: periodicNotes.settings.daily.folder,
                format: periodicNotes.settings.daily.format || 'YYYY-MM-DD',
                detected: true,
            };
        }
    } catch (error) {
        console.warn('[dailyNotesDetector] Failed to detect daily notes config:', error);
    }

    // Fallback - daily notes not configured or plugin disabled
    return {
        folder: '',
        format: 'YYYY-MM-DD',
        detected: false,
    };
}

/**
 * Check if the Daily Notes core plugin is enabled
 */
export function isDailyNotesPluginEnabled(app: App): boolean {
    try {
        const internalPlugins = (app as any).internalPlugins;
        return internalPlugins?.plugins?.['daily-notes']?.enabled === true;
    } catch {
        return false;
    }
}
