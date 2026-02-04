# Remote Asset Delivery Implementation Guide

**Status:** Not Started  
**Estimated Sessions:** 2-3  
**Last Updated:** 2025-02-02

---

## Overview

This guide documents the migration from bundled plugin assets to a remote-hosted + vault-cached asset delivery system. This solves the Obsidian Sync limitation where plugin folders only sync core files (`main.js`, `manifest.json`, `styles.css`, `data.json`).

### Problem
- Assets in `.obsidian/plugins/quest-board/assets/` don't sync across devices
- Users on multiple devices have a non-functional plugin without manual file copying
- New asset updates (monsters, tilesets, sprites) require full plugin reinstall

### Solution
- Host assets on jsDelivr CDN (free, no bandwidth limits for open source)
- Download assets to a vault folder on first run
- Plugin checks for updates and downloads new assets automatically

---

## Architecture

### Before (Current)
```
.obsidian/plugins/quest-board/
├── main.js
├── manifest.json
├── styles.css
├── data.json
└── assets/           ← NOT SYNCED!
    ├── sprites/
    ├── environment/
    └── backgrounds/
```

### After (New)
```
GitHub Repository                      User's Vault
├── assets/                           ├── QuestBoard/
│   ├── manifest.json  ──────────────►│   └── assets/           ← SYNCS!
│   ├── sprites/       (jsDelivr CDN) │       ├── manifest.json
│   ├── environment/                  │       ├── sprites/
│   └── backgrounds/                  │       ├── environment/
                                      │       └── backgrounds/
```

### How Updates Work

1. **Your Side:** Push new assets to GitHub → jsDelivr serves them automatically
2. **User Side:** Plugin checks `manifest.json` version on startup → downloads only new/changed files

---

## Critical Constraints

> [!CAUTION]
> **CSS url() Limitation:** You CANNOT reference vault assets in `styles.css` using `url('...')`. The CSS file loads from `.obsidian/plugins/` while images are in the vault - relative paths won't work. All image references MUST use inline styles or `src` attributes with `getResourcePath()`.

> [!IMPORTANT]
> **Path Distinction:** The plugin needs TWO types of paths:
> - **Storage Path:** `QuestBoard/assets/sprite.png` - for `vault.adapter.write()`, `exists()`
> - **Display Path:** `app://local/...` - for `<img src>`, inline CSS backgrounds
>
> Mixing these up will break either file I/O or image rendering!

---

## Hosting Setup (One-Time)

### jsDelivr Configuration

Assets will be served from:
```
https://cdn.jsdelivr.net/gh/thuban87/quest-board@main/assets/
```

No configuration needed - jsDelivr automatically mirrors your GitHub repo.

### Asset Manifest Format

Create `assets/manifest.json` in the repo:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-02-02T00:00:00Z",
  "files": {
    "sprites/player/warrior/tier1/warrior-tier-1.gif": {
      "hash": "abc123",
      "size": 45670
    },
    "sprites/monsters/goblin/goblin.gif": {
      "hash": "def456", 
      "size": 23456
    }
  }
}
```

> [!TIP]
> Create a build script to auto-generate this manifest from the assets folder.

---

## Implementation Phases

### Phase 1: Asset Service Foundation
**Files:** New `src/services/AssetService.ts`

#### Tasks
- [ ] Create `AssetService` class with methods:
  - `checkForUpdates()` - Compare local vs remote manifest + verify file existence
  - `downloadAssets(files: string[], onProgress)` - Fetch with concurrency queue
  - `cleanupOrphanedFiles()` - Remove files not in remote manifest
  - `getStoragePath(relativePath: string)` - Vault-relative path for file I/O
  - `getDisplayPath(relativePath: string)` - Resource path for `<img src>`
  - `isFirstRun()` - Check if manifest.json exists locally
- [ ] Implement concurrency queue (max 5 parallel downloads) to avoid rate limits
- [ ] Add retry logic with exponential backoff (3 attempts per file)
- [ ] Use `requestUrl` from Obsidian API (not `fetch`) for mobile compatibility
- [ ] Write manifest.json LAST after all files verified (atomic install)
- [ ] Verify file existence during update check (don't trust manifest alone)
- [ ] Add settings for asset folder path (default: `QuestBoard/assets`)
- [ ] Create asset manifest generation script for build process

#### [NEW] [AssetService.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/services/AssetService.ts)

```typescript
/**
 * AssetService
 * 
 * Handles remote asset fetching, caching, and versioning.
 * Assets are stored in a vault folder that syncs across devices.
 * 
 * Key concepts:
 * - Storage Path: Vault-relative path for file I/O (e.g., "QuestBoard/assets/sprite.png")
 * - Display Path: Resource path for <img src> (e.g., "app://local/...")
 * 
 * Robustness features:
 * - Uses requestUrl (not fetch) for mobile compatibility
 * - Verifies file existence, not just manifest (handles accidental deletions)
 * - Retry with exponential backoff for transient network failures
 * - Cleans up orphaned files when assets are renamed/removed
 */

import { App, Vault, DataAdapter, requestUrl } from 'obsidian';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/thuban87/quest-board@main/assets';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 500;

export class AssetService {
    private vault: Vault;
    private adapter: DataAdapter;
    private assetFolder: string;
    private maxConcurrent = 5;
    
    constructor(app: App, assetFolder: string = 'QuestBoard/assets') {
        this.vault = app.vault;
        this.adapter = app.vault.adapter;
        this.assetFolder = assetFolder;
    }
    
    /**
     * Check if this is the first run (no manifest = no assets)
     */
    async isFirstRun(): Promise<boolean> {
        const manifestPath = this.getStoragePath('manifest.json');
        return !(await this.adapter.exists(manifestPath));
    }
    
    /**
     * Compare local vs remote manifest, return files that need downloading.
     * IMPORTANT: Also verifies file existence - don't trust manifest alone!
     */
    async checkForUpdates(): Promise<{needsUpdate: boolean, files: string[], orphaned: string[]}> {
        const remote = await this.fetchRemoteManifest();
        const local = await this.getLocalManifest();
        
        if (!local) {
            // First run - need all files
            return { needsUpdate: true, files: Object.keys(remote.files), orphaned: [] };
        }
        
        const filesToUpdate: string[] = [];
        const orphanedFiles: string[] = [];
        
        // Check for new/changed files AND verify they actually exist on disk
        for (const [path, meta] of Object.entries(remote.files)) {
            const storagePath = this.getStoragePath(path);
            const fileExists = await this.adapter.exists(storagePath);
            
            // Download if: file missing, not in local manifest, or hash changed
            if (!fileExists || !local.files[path] || local.files[path].hash !== meta.hash) {
                filesToUpdate.push(path);
            }
        }
        
        // Find orphaned files (in local manifest but not in remote)
        for (const path of Object.keys(local.files)) {
            if (!remote.files[path]) {
                orphanedFiles.push(path);
            }
        }
        
        return { 
            needsUpdate: filesToUpdate.length > 0, 
            files: filesToUpdate,
            orphaned: orphanedFiles
        };
    }
    
    /**
     * Remove files that are no longer in the remote manifest.
     * Prevents asset folder bloat when files are renamed/removed.
     */
    async cleanupOrphanedFiles(orphanedFiles: string[]): Promise<void> {
        for (const file of orphanedFiles) {
            const storagePath = this.getStoragePath(file);
            if (await this.adapter.exists(storagePath)) {
                await this.adapter.remove(storagePath);
            }
        }
    }
    
    /**
     * Download files with concurrency limit to avoid rate limits.
     * Writes manifest LAST to ensure atomic installation.
     */
    async downloadAssets(
        files: string[], 
        onProgress?: (current: number, total: number, file: string) => void
    ): Promise<void> {
        const queue = [...files];
        const inFlight: Promise<void>[] = [];
        let completed = 0;
        const errors: string[] = [];
        
        while (queue.length > 0 || inFlight.length > 0) {
            // Fill up to max concurrent
            while (inFlight.length < this.maxConcurrent && queue.length > 0) {
                const file = queue.shift()!;
                const promise = this.downloadFileWithRetry(file)
                    .then(() => {
                        completed++;
                        onProgress?.(completed, files.length, file);
                    })
                    .catch((e) => {
                        errors.push(`${file}: ${e.message}`);
                    })
                    .finally(() => {
                        inFlight.splice(inFlight.indexOf(promise), 1);
                    });
                inFlight.push(promise);
            }
            
            // Wait for at least one to complete
            if (inFlight.length > 0) {
                await Promise.race(inFlight);
            }
        }
        
        // If any files failed after retries, throw
        if (errors.length > 0) {
            throw new Error(`Failed to download ${errors.length} files:\n${errors.join('\n')}`);
        }
        
        // CRITICAL: Write manifest LAST after all files verified
        const remoteManifest = await this.fetchRemoteManifest();
        await this.adapter.write(
            this.getStoragePath('manifest.json'),
            JSON.stringify(remoteManifest, null, 2)
        );
    }
    
    /**
     * Get vault-relative path for file I/O operations
     */
    getStoragePath(relativePath: string): string {
        return `${this.assetFolder}/${relativePath}`;
    }
    
    /**
     * Get resource path for <img src> and inline CSS
     */
    getDisplayPath(relativePath: string): string {
        const storagePath = this.getStoragePath(relativePath);
        return this.adapter.getResourcePath(storagePath);
    }
    
    /**
     * Download a single file with retry and exponential backoff.
     * Uses requestUrl instead of fetch for mobile compatibility.
     */
    private async downloadFileWithRetry(relativePath: string): Promise<void> {
        const url = `${CDN_BASE}/${relativePath}`;
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                // Use Obsidian's requestUrl - bypasses CORS, works on mobile
                const response = await requestUrl({ url });
                
                if (response.status !== 200) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                // VALIDATION: Ensure we actually got bytes (prevents silent corruption)
                if (!response.arrayBuffer || response.arrayBuffer.byteLength === 0) {
                    throw new Error('Received empty or invalid binary data');
                }
                
                const storagePath = this.getStoragePath(relativePath);
                
                // Ensure parent directory exists
                const dir = storagePath.substring(0, storagePath.lastIndexOf('/'));
                if (!(await this.adapter.exists(dir))) {
                    await this.vault.createFolder(dir);
                }
                
                await this.adapter.writeBinary(storagePath, response.arrayBuffer);
                return; // Success!
                
            } catch (e) {
                lastError = e as Error;
                
                // Exponential backoff before retry
                if (attempt < MAX_RETRIES - 1) {
                    const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
                    await this.sleep(delay);
                }
            }
        }
        
        throw new Error(`Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
    }
    
    private async fetchRemoteManifest(): Promise<AssetManifest> {
        const response = await requestUrl({ url: `${CDN_BASE}/manifest.json` });
        return response.json;
    }
    
    private async getLocalManifest(): Promise<AssetManifest | null> {
        const path = this.getStoragePath('manifest.json');
        if (!(await this.adapter.exists(path))) return null;
        const content = await this.adapter.read(path);
        return JSON.parse(content);
    }
    
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

interface AssetManifest {
    version: string;
    lastUpdated: string;
    files: Record<string, { hash: string; size: number }>;
}
```

---

### Phase 2: Asset Context (Eliminate Prop Drilling)
**Files:** New `src/context/AssetContext.tsx`

> [!TIP]
> Using React Context eliminates the need to thread `manifestDir` through 10+ components.

#### Tasks
- [ ] Create `AssetContext` and `AssetProvider`
- [ ] Create `useAssets()` hook for easy access
- [ ] Wrap the app in `AssetProvider`

#### [NEW] [AssetContext.tsx](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/context/AssetContext.tsx)

```typescript
import { createContext, useContext, ReactNode } from 'react';
import { DataAdapter } from 'obsidian';

interface AssetContextValue {
    assetFolder: string;
    adapter: DataAdapter;
    getStoragePath: (relativePath: string) => string;
    getDisplayPath: (relativePath: string) => string;
}

const AssetContext = createContext<AssetContextValue | null>(null);

export function AssetProvider({ 
    children, 
    assetFolder, 
    adapter 
}: { 
    children: ReactNode; 
    assetFolder: string; 
    adapter: DataAdapter;
}) {
    const value: AssetContextValue = {
        assetFolder,
        adapter,
        getStoragePath: (path) => `${assetFolder}/${path}`,
        getDisplayPath: (path) => adapter.getResourcePath(`${assetFolder}/${path}`),
    };
    
    return (
        <AssetContext.Provider value={value}>
            {children}
        </AssetContext.Provider>
    );
}

export function useAssets(): AssetContextValue {
    const ctx = useContext(AssetContext);
    if (!ctx) throw new Error('useAssets must be used within AssetProvider');
    return ctx;
}
```

---

### Phase 3: Download Modal & First-Run Experience
**Files:** New `src/modals/AssetDownloadModal.ts`

#### Tasks
- [ ] Create download progress modal with:
  - Progress bar showing files downloaded
  - Current file name being downloaded
  - Cancel button (with warning about incomplete state)
- [ ] Show modal automatically on first plugin load if assets missing
- [ ] Add "Check for Asset Updates" command to command menu
- [ ] Handle path change in settings (offer Move vs Re-download)

#### [NEW] [AssetDownloadModal.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/modals/AssetDownloadModal.ts)

```typescript
export class AssetDownloadModal extends Modal {
    private assetService: AssetService;
    private filesToDownload: string[];
    private cancelled = false;
    
    async startDownload(): Promise<boolean> {
        const progressBar = this.contentEl.createEl('progress');
        const statusText = this.contentEl.createEl('p');
        
        try {
            await this.assetService.downloadAssets(
                this.filesToDownload,
                (current, total, file) => {
                    if (this.cancelled) throw new Error('Cancelled');
                    progressBar.value = current;
                    progressBar.max = total;
                    statusText.setText(`Downloading: ${file} (${current}/${total})`);
                }
            );
            this.close();
            return true;
        } catch (e) {
            if (this.cancelled) {
                new Notice('Download cancelled. Some assets may be missing.');
            } else {
                new Notice(`Download failed: ${e.message}`);
            }
            return false;
        }
    }
}
```

---

### Phase 4: SpriteService & Component Migration
**Files:** Modify existing files - FULL LIST

> [!IMPORTANT]
> ALL files using `manifestDir` must be updated. Complete list below.

#### Tasks
- [ ] Update `SpriteService.ts` to use `AssetContext` or accept `assetFolder`
- [ ] Create `useAssets()` hook usage in components
- [ ] Remove `manifestDir` prop drilling from all components

#### Files Requiring manifestDir Removal

| File | Current Usage | New Approach |
|------|---------------|--------------|
| `SpriteService.ts` | `manifestDir` param | Accept `assetFolder` directly |
| `TileRegistry.ts` | `manifestDir` param | Accept `assetFolder` directly |
| `DungeonView.tsx` | Prop threading | `useAssets()` hook |
| `DungeonItemView.tsx` | `manifest.dir` | `useAssets()` hook |
| `BattleItemView.tsx` | `manifest.dir` | `useAssets()` hook |
| `CharacterCreationModal.ts` | Hardcoded path | Use `AssetService` |
| `BountyModal.ts` | `manifestDir` option | Use `AssetService` |
| `EliteEncounterModal.ts` | `manifestDir` option | Use `AssetService` |
| `useQuestActions.ts` | `manifestDir` param | Get from settings/context |
| `useCharacterSprite.ts` | `manifestDir` param | `useAssets()` hook |

#### [MODIFY] [SpriteService.ts](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/src/services/SpriteService.ts)

```diff
-function getBasePath(manifestDir: string): string {
-    return `${manifestDir}/assets/sprites`;
+function getBasePath(assetFolder: string): string {
+    return `${assetFolder}/sprites`;
 }

 export function getPlayerGifPath(
-    manifestDir: string,
+    assetFolder: string,
     adapter: DataAdapter,
     className: string,
     tier: number
 ): string {
-    const basePath = getBasePath(manifestDir);
+    const basePath = getBasePath(assetFolder);
     const classLower = className.toLowerCase();
-    const filePath = `${basePath}/player/${classLower}/tier${tier}/${classLower}-tier-${tier}.gif`;
+    const filePath = `${basePath}/player/${classLower}/tier${tier}/${classLower}-tier-${tier}.gif`;
     return adapter.getResourcePath(filePath);
 }
```

---

### Phase 5: Main Plugin Integration
**Files:** Modify `main.ts`, `src/settings.ts`

#### Tasks
- [ ] Initialize `AssetService` on plugin load
- [ ] Check for first run and show download modal if needed
- [ ] Add periodic update check (configurable: daily/weekly/manual)
- [ ] Add "Check for Asset Updates" command
- [ ] Handle asset folder path change in settings

#### Settings Changes

```typescript
// New settings fields
assetFolder: string;           // Default: 'QuestBoard/assets'
assetUpdateFrequency: 'daily' | 'weekly' | 'manual';
lastAssetCheck: number;        // Timestamp

// Path change handling
if (oldPath !== newPath) {
    // Show modal: "Move existing assets or re-download?"
    if (userChooseMove) {
        await moveAssets(oldPath, newPath);
    } else {
        await assetService.downloadAssets(allFiles);
    }
}
```

---

### Phase 6: Existing User Migration

#### Tasks
- [ ] Detect assets in old location (`manifest.dir/assets/`)
- [ ] Copy to new vault location
- [ ] Show "Migration complete" notice
- [ ] Clean up: Add button to delete old assets (optional, user-controlled)

---

## Files Summary

### New Files
| File | Purpose | Lines Est. |
|------|---------|------------|
| `src/services/AssetService.ts` | Remote fetching, caching, versioning | ~150 |
| `src/context/AssetContext.tsx` | React context for asset paths | ~40 |
| `src/modals/AssetDownloadModal.ts` | First-run download UI | ~100 |
| `scripts/generate-asset-manifest.js` | Build script for manifest.json | ~50 |

### Modified Files
| File | Changes |
|------|---------|
| `src/services/SpriteService.ts` | Use `assetFolder` instead of `manifestDir` |
| `src/data/TileRegistry.ts` | Use `assetFolder` for tile sprites |
| `src/components/DungeonView.tsx` | Use `useAssets()` hook |
| `src/views/DungeonItemView.tsx` | Use `useAssets()` hook |
| `src/views/BattleItemView.tsx` | Use `useAssets()` hook |
| `src/modals/CharacterCreationModal.ts` | Use `AssetService` |
| `src/modals/BountyModal.ts` | Use `AssetService` |
| `src/modals/EliteEncounterModal.ts` | Use `AssetService` |
| `src/hooks/useQuestActions.ts` | Remove `manifestDir` param |
| `src/hooks/useCharacterSprite.ts` | Use `useAssets()` hook |
| `src/settings.ts` | Add asset folder settings |
| `main.ts` | Initialize AssetService, first-run check |

---

## Testing Checklist

### First-Run Experience
- [ ] Fresh install shows download modal
- [ ] Progress bar updates correctly
- [ ] Cancel button works (shows warning)
- [ ] Plugin loads correctly after download
- [ ] Incomplete download (quit mid-way) triggers repair on next load

### Asset Loading
- [ ] Player sprites load in character sheet
- [ ] Monster sprites load in battle view
- [ ] Dungeon tiles render correctly
- [ ] Background images display
- [ ] Class preview GIFs work in character creation

### Update Flow
- [ ] "Check for Updates" command works
- [ ] Only new/changed files are downloaded (delta updates)
- [ ] Version displayed in settings
- [ ] Orphaned files are cleaned up after rename/removal

### Integrity & Resilience
- [ ] Deleted asset file triggers re-download (not just manifest check)
- [ ] Network hiccup during download retries successfully
- [ ] All 3 retry attempts work with exponential backoff
- [ ] Mobile (iOS/Android) downloads work via requestUrl

### Multi-Device Sync
- [ ] Assets sync via Obsidian Sync
- [ ] Second device doesn't re-download
- [ ] Both devices see same assets

### Settings
- [ ] Default path works for new users
- [ ] Path change prompts Move vs Re-download
- [ ] Move operation works correctly

---

## CDN Details

### jsDelivr Benefits
- **Free forever** for open source
- **No bandwidth limits** for OSS projects
- **Global CDN** - fast downloads worldwide
- **Automatic GitHub mirroring** - no config needed
- **50MB per file** limit (plenty for sprites)

### URL Format
```
https://cdn.jsdelivr.net/gh/{user}/{repo}@{branch}/{path}

Example:
https://cdn.jsdelivr.net/gh/thuban87/quest-board@main/assets/sprites/monsters/goblin/goblin.gif
```

---

## Session Log

### Session 1 (Not Started)
- [ ] Phase 1: AssetService foundation
- [ ] Phase 2: AssetContext

### Session 2 (Not Started)
- [ ] Phase 3: Download modal
- [ ] Phase 4: SpriteService & component migration (partial)

### Session 3 (Not Started)
- [ ] Phase 4: Complete component migration
- [ ] Phase 5: Main plugin integration
- [ ] Phase 6: Existing user migration
- [ ] Testing & polish
