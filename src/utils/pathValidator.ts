/**
 * Path Validator
 * 
 * Validates that linkedTaskFile paths resolve within the vault.
 * Prevents path traversal attacks.
 */

import { Vault, TFile, TAbstractFile } from 'obsidian';

/**
 * Validate that a path resolves to a file within the vault.
 * Returns the TFile if valid, null otherwise.
 */
export function validateLinkedPath(vault: Vault, path: string): TFile | null {
    if (!path || typeof path !== 'string') {
        console.warn('[PathValidator] Invalid path: empty or not a string');
        return null;
    }

    // Normalize path: remove ../, ./, and leading slashes
    const normalizedPath = normalizePath(path);

    // Check if the path differs after normalization (potential traversal attempt)
    if (normalizedPath !== path && path.includes('..')) {
        console.warn(`[PathValidator] Potential path traversal attempt blocked: ${path}`);
        return null;
    }

    // Try to get the file from the vault
    let file = vault.getAbstractFileByPath(normalizedPath);

    // Fallback: if not found and path has no extension, try appending .md
    // Obsidian's "Copy vault path" no longer includes the .md extension
    if (!file && !normalizedPath.match(/\.[a-zA-Z0-9]+$/)) {
        file = vault.getAbstractFileByPath(normalizedPath + '.md');
    }

    if (!file) {
        // File not found - this is expected for deleted/renamed files, no need to warn
        return null;
    }

    if (!(file instanceof TFile)) {
        console.warn(`[PathValidator] Path is not a file: ${path}`);
        return null;
    }

    return file;
}

/**
 * Resolve a linked path to its actual vault path string.
 * Handles paths without .md extension (Obsidian's "Copy vault path" omits it).
 * Returns the resolved path or null if not found.
 */
export function resolveLinkedPath(vault: Vault, path: string): string | null {
    const file = validateLinkedPath(vault, path);
    return file ? file.path : null;
}

/**
 * Normalize a path by removing traversal elements
 */
function normalizePath(path: string): string {
    return path
        .replace(/\.\.\//g, '')  // Remove ../
        .replace(/\.\//g, '')    // Remove ./
        .replace(/^\/+/, '')     // Remove leading slashes
        .replace(/\/+/g, '/');   // Normalize multiple slashes
}

/**
 * Check if a folder exists in the vault
 */
export function validateFolderPath(vault: Vault, path: string): boolean {
    if (!path || typeof path !== 'string') {
        return false;
    }

    const normalizedPath = normalizePath(path);
    const folder = vault.getAbstractFileByPath(normalizedPath);

    return folder !== null && !(folder instanceof TFile);
}

/**
 * Ensure a folder exists, creating it if necessary
 */
export async function ensureFolderExists(vault: Vault, path: string): Promise<boolean> {
    if (!path || typeof path !== 'string') {
        return false;
    }

    const normalizedPath = normalizePath(path);

    // Check if already exists
    const existing = vault.getAbstractFileByPath(normalizedPath);
    if (existing) {
        return !(existing instanceof TFile);
    }

    // Create the folder
    try {
        await vault.createFolder(normalizedPath);
        return true;
    } catch (error) {
        console.error(`[PathValidator] Failed to create folder: ${path}`, error);
        return false;
    }
}
