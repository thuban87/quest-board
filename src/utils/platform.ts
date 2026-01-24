/**
 * Platform Utilities
 * 
 * Helpers for detecting platform and device capabilities.
 * Wraps Obsidian's Platform API for consistent access.
 */

import { Platform } from 'obsidian';

/**
 * Check if running on a mobile device (phone/tablet).
 * Use this for responsive UI decisions.
 */
export function isMobile(): boolean {
    return Platform.isMobile;
}

/**
 * Check if running on desktop.
 */
export function isDesktop(): boolean {
    return Platform.isDesktop;
}

/**
 * Check if running on macOS.
 */
export function isMacOS(): boolean {
    return Platform.isMacOS;
}

/**
 * Check if running on Windows.
 */
export function isWindows(): boolean {
    return Platform.isWin;
}

/**
 * Check if running on iOS (iPhone/iPad).
 */
export function isIOS(): boolean {
    return Platform.isIosApp;
}

/**
 * Check if running on Android.
 */
export function isAndroid(): boolean {
    return Platform.isAndroidApp;
}

/**
 * Get recommended tap target size for current platform.
 * Mobile devices need larger targets (44px min as per Apple HIG).
 */
export function getTapTargetSize(): number {
    return isMobile() ? 44 : 32;
}

/**
 * Check if touch is the primary input method.
 * More reliable than just isMobile() for touch detection.
 */
export function isTouchPrimary(): boolean {
    if (typeof window === 'undefined') return false;
    return isMobile() || window.matchMedia('(pointer: coarse)').matches;
}
