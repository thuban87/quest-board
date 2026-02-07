# Remote Asset Delivery Implementation Guide

**Status:** Not Started  
**Estimated Sessions:** 2-3  
**Last Updated:** 2026-02-07  
**Peer Review Status:** ✅ Reviewed (second codebase review applied)

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

## Pre-Implementation Cleanup

These tasks should be completed **before** starting Phase 1. They remove dead code and normalize naming conventions that would otherwise complicate the migration.

### Badge System Removal

The badge image system was planned but never implemented. All achievements use emoji only (`emoji: '🎖️'`). The `badgePath` field in the model and `badgeFolder` in settings/services are dead code.

- [ ] Remove `badgePath?: string` field from `Achievement.ts` model (line 43)
- [ ] Remove `badgeFolder: string` from `QuestBoardSettings` interface (`settings.ts` line 45)
- [ ] Remove `badgeFolder` default from `DEFAULT_SETTINGS` (`settings.ts` line 135)
- [ ] Remove `private badgeFolder: string` field, constructor param, and `getBadgePath`/`badgeExists`/`getBadgeResourcePath` methods from `AchievementService.ts`
- [ ] Remove `badgeFolder` param from `AchievementUnlockModal.ts` constructor and `showAchievementUnlock()` function
- [ ] Remove `badgeFolder` option from `AchievementHubModal.ts`
- [ ] Remove `badgeFolder` prop from `AchievementsSidebar.tsx`
- [ ] Remove `badgeFolder` option + hardcoded default `'Life/Quest Board/assets/badges'` from `useXPAward.ts` (line 59)
- [ ] Remove `badgeFolder` pass-throughs in `SidebarQuests.tsx` (lines 138, 173, 443)
- [ ] Remove `badgeFolder` pass-through in `FullKanban.tsx` (line 103)
- [ ] Remove `badgeFolder` pass-throughs in `CharacterPage.tsx` (lines 73, 154)

### spriteFolder Setting Removal

The `spriteFolder` setting was a planned feature that was deprecated. The actual sprite pipeline uses `manifestDir` exclusively via `SpriteService`. This setting is vestigial and should be removed to avoid confusion during migration.

- [ ] Remove `spriteFolder: string` from `QuestBoardSettings` interface (`settings.ts` line 44)
- [ ] Remove `spriteFolder` default from `DEFAULT_SETTINGS` (`settings.ts` line 134)
- [ ] Remove "Sprite Folder" setting UI from settings tab (`settings.ts` lines 289-298)
- [ ] Remove `spriteFolder` prop pass-through in `SidebarQuests.tsx` (line 436)
- [ ] Remove `spriteFolder` prop from `CharacterSidebar.tsx` interface and component (lines 37, 48)

### CharacterCreationModal Fix

`CharacterCreationModal.ts` uses a hardcoded vault path (`Life/Quest Board/assets/class-previews/{classId}.gif`) that bypasses `SpriteService` entirely. The `class-previews` folder does not exist and won't be created. `SpriteService.getClassPreviewSprite()` already correctly resolves to tier 4 GIFs from the standard player sprite folders.

- [ ] Refactor `CharacterCreationModal.getClassGifPath()` to use `SpriteService.getClassPreviewSprite(manifestDir, adapter, className)` instead of the hardcoded vault path
- [ ] Pass `manifestDir` (from `this.plugin.manifest.dir`) and `adapter` (from `this.app.vault.adapter`) into the method
- [ ] Remove the `TFile` import if no longer needed after this change

### Environment Tile Filename Normalization

Several dungeon tile sprite paths in `TileRegistry.ts` use filenames with spaces (e.g., `cave gravel.png`, `granite floor.png`). These should be normalized to **kebab-case** for consistency with character sprites and to avoid potential CDN/URL encoding issues.

- [ ] Rename all environment tile image files from spaces to kebab-case (e.g., `cave gravel.png` → `cave-gravel.png`)
- [ ] Update all corresponding sprite path strings in `TileRegistry.ts` (~40 entries across 4 tilesets)
- [ ] Verify no other files reference these filenames

### DungeonView Inline Helper Consolidation

`DungeonView.tsx` has local `getPlayerSpritePath()` and `getTileSpritePath()` helpers that duplicate `SpriteService` logic. The local player sprite helper also uses a legacy underscore naming convention (`warrior_tier_1_south.png`) while `SpriteService` and the actual sprite files use hyphens (`warrior-tier-1_south.png`). This works today only because both file variants exist in deployed plugin folders, but **will break** with the remote asset migration since the manifest will only contain hyphen-named files.

- [ ] Remove the local `getPlayerSpritePath()` helper (line 60-71) and import `SpriteService.getPlayerSpritePath()` instead
- [ ] Remove the local `getTileSpritePath()` helper (line 76-85) — use `TileRegistry` functions already imported
- [ ] Fix the inline combat sprite path at lines ~1329-1331 to use `SpriteService.getPlayerSpritePath()` instead of manual string construction
- [ ] Delete the legacy underscore-named sprite files from deployed plugin folders (test + production) — they are duplicates of the hyphen-named files

### Deprecated File Cleanup

- [ ] Delete `CharacterSheet.tsx` (deprecated, replaced by `CharacterPage.tsx` + `CharacterSidebar.tsx`)

---

## Implementation Phases

### Phase 1: Asset Service Foundation
**Files:** New `src/services/AssetService.ts`

#### Tasks
- [ ] Create `AssetService` class with methods:
  - `checkForUpdates()` - Compare local vs remote manifest + verify file existence
  - `downloadAssets(files: string[], onProgress)` - Fetch with priority queue (class sprites first)
  - `cleanupOrphanedFiles()` - Remove files not in remote manifest
  - `getStoragePath(relativePath: string)` - Vault-relative path for file I/O (with path traversal protection)
  - `getDisplayPath(relativePath: string)` - Resource path for `<img src>`
  - `isFirstRun()` - Check if manifest.json exists locally
- [ ] Implement concurrency queue (max 5 parallel downloads) to avoid rate limits
- [ ] Add retry logic with exponential backoff (3 attempts per file)
- [ ] Use `requestUrl` from Obsidian API (not `fetch`) for mobile compatibility
- [ ] Write manifest.json LAST after all files verified (atomic install)
- [ ] Verify file existence during update check (don't trust manifest alone)
- [ ] Add settings for asset folder path (default: `QuestBoard/assets`)
- [ ] Asset manifest generation script already exists (`scripts/generate-asset-manifest.js`)

#### Security Hardening (Phase 1)
- [ ] **Path traversal protection:** Use `pathValidator.ts` to sanitize relative paths in `getStoragePath()`
- [ ] **Content-Type validation:** Reject non-image responses (catches CDN error pages)
- [ ] **Safe JSON parsing:** Use `safeJson.ts` for manifest parsing (prevents prototype pollution)
- [ ] **Request timeout:** Add 15-second timeout to `requestUrl` calls
- [ ] **File type allowlist:** Only download `.png`, `.gif`, `.jpg`, `.jpeg`, `.webp` files

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
import { safeJsonParse } from '../utils/safeJson';

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
     * Returns the fetched remote manifest to avoid TOCTOU bugs.
     */
    async checkForUpdates(): Promise<{needsUpdate: boolean, files: string[], orphaned: string[], remoteManifest: AssetManifest}> {
        const remote = await this.fetchRemoteManifest();
        const local = await this.getLocalManifest();
        
        if (!local) {
            // First run - need all files
            return { needsUpdate: true, files: Object.keys(remote.files), orphaned: [], remoteManifest: remote };
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
            orphaned: orphanedFiles,
            remoteManifest: remote
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
     * Writes the provided manifest LAST to ensure atomic installation.
     * IMPORTANT: Pass the same manifest from checkForUpdates() to avoid TOCTOU bugs.
     */
    async downloadAssets(
        files: string[],
        manifest: AssetManifest,
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
        
        // CRITICAL: Write the SAME manifest we checked against (avoids TOCTOU)
        await this.adapter.write(
            this.getStoragePath('manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
    }
    
    /**
     * Get vault-relative path for file I/O operations.
     * Uses reject-on-suspicious approach for path traversal protection.
     */
    getStoragePath(relativePath: string): string {
        // Normalize backslashes to forward slashes
        const normalized = relativePath.replace(/\\/g, '/');
        
        // Reject anything suspicious rather than trying to sanitize
        if (normalized.includes('..') || normalized.startsWith('/')) {
            throw new Error(`Invalid asset path: ${relativePath}`);
        }
        
        return `${this.assetFolder}/${normalized}`;
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
    // Allowed file extensions for download
    private static readonly ALLOWED_EXTENSIONS = ['.png', '.gif', '.jpg', '.jpeg', '.webp'];
    
    private async downloadFileWithRetry(relativePath: string): Promise<void> {
        // Validate file extension
        const ext = relativePath.substring(relativePath.lastIndexOf('.')).toLowerCase();
        if (!AssetService.ALLOWED_EXTENSIONS.includes(ext)) {
            throw new Error(`Unsupported file type: ${ext}`);
        }
        
        const url = `${CDN_BASE}/${relativePath}`;
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                // Use Obsidian's requestUrl - bypasses CORS, works on mobile
                // 15 second timeout prevents indefinite hangs
                const response = await requestUrl({ url, timeout: 15000 });
                
                if (response.status !== 200) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                // Validate Content-Type (reject error pages served as HTML)
                const contentType = response.headers?.['content-type'] ?? '';
                if (contentType && !contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
                    throw new Error(`Expected image, got ${contentType}`);
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
        const response = await requestUrl({ url: `${CDN_BASE}/manifest.json`, timeout: 15000 });
        // Sanity guard: reject unexpectedly large responses (corrupted CDN, error pages)
        if (response.text.length > 1_000_000) {
            throw new Error('Manifest too large — possible CDN error');
        }
        // Use response.text directly with safeJsonParse
        return safeJsonParse<AssetManifest>(response.text);
    }
    
    private async getLocalManifest(): Promise<AssetManifest | null> {
        const path = this.getStoragePath('manifest.json');
        if (!(await this.adapter.exists(path))) return null;
        const content = await this.adapter.read(path);
        // Use safeJsonParse to prevent prototype pollution
        return safeJsonParse<AssetManifest>(content);
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

### ~~Phase 2: Asset Context~~ (REMOVED)

> [!IMPORTANT]
> **Phase 2 has been eliminated.** React Context cannot reach Obsidian modals (`BountyModal`, `EliteEncounterModal`) or cross between the 4 independent React roots (`FullKanban`, `SidebarQuests`, `BattleItemView`, `DungeonItemView`).
>
> **Instead:** Store `AssetService` on the plugin instance (`this.assetService`) and pass it where needed:
> - React components: Access via `plugin.assetService` prop
> - Modals: Pass as constructor option (same pattern as `manifestDir` today)
> - Hooks: Accept `assetService` parameter

---

### Phase 2: Download Modal & First-Run Experience
**Files:** New `src/modals/AssetDownloadModal.ts`

#### Tasks
- [ ] Create download progress modal with:
  - Progress bar showing files downloaded
  - Current file name being downloaded
  - Cancel button (with warning about incomplete state)
- [ ] **Priority queue:** Download current character class sprites first, then background tiles
- [ ] **Lazy loading:** Consider loading dungeon tiles only when entering dungeons
- [ ] **Cancel cleanup:** Delete any partially-written files on cancel
- [ ] **Emoji fallback:** Show emoji for truly missing/failed assets (not for slow loading)
- [ ] Show modal automatically on first plugin load if assets missing
- [ ] Add "Check for Asset Updates" command to command menu
- [ ] On path change: auto-delete old assets and re-download (no Move vs Re-download modal)

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
            // Note: manifest comes from checkForUpdates() call in caller
            await this.assetService.downloadAssets(
                this.filesToDownload,
                this.manifest, // Pass the manifest from checkForUpdates()
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

### Phase 3: SpriteService & Component Migration
**Files:** Modify existing files - FULL LIST

> [!IMPORTANT]
> ALL files using `manifestDir` must be updated. This includes inline path building that duplicates SpriteService logic.

#### Tasks
- [ ] Update `SpriteService.ts` to accept `assetFolder` instead of `manifestDir`
- [ ] Access service via `plugin.assetService` (no Context needed)
- [ ] **Consolidate DungeonView inline helpers:** Remove local `getPlayerSpritePath`/`getTileSpritePath` and use SpriteService
- [ ] Remove `manifestDir` prop from all components

> [!NOTE]
> **TileRegistry path inconsistency:** `SpriteService` functions return fully-resolved display paths (via `adapter.getResourcePath()`), while `TileRegistry.getTileSpritePath()` returns raw relative paths that consumers must wrap themselves. Decide during implementation: either make `TileRegistry` consistent with `SpriteService` (return adapted paths) or keep the current pattern but document it clearly.

#### Files Requiring manifestDir Removal

| File | Current Usage | New Approach |
|------|---------------|--------------|
| `SpriteService.ts` | `manifestDir` param | Accept `assetFolder` directly |
| `TileRegistry.ts` | `manifestDir` param | Accept `assetFolder` directly |
| `DungeonView.tsx` | Prop threading + **inline helpers** | Use SpriteService; get `assetFolder` from plugin |
| `DungeonItemView.tsx` | `manifest.dir` | Get `assetFolder` from plugin |
| `BattleItemView.tsx` | `manifest.dir` + **hardcoded bg** | Get `assetFolder` from plugin; fix `battle-bg.jpg` path |
| `CharacterCreationModal.ts` | ~~Vault path (`Life/Quest Board/...`)~~ Fixed in pre-impl | Uses `SpriteService.getClassPreviewSprite()` after cleanup |
| `BountyModal.ts` | `manifestDir` option | Accept `assetService` option |
| `EliteEncounterModal.ts` | `manifestDir` option | Accept `assetService` option |
| `useQuestActions.ts` | `manifestDir` param | Get from plugin/settings |
| `useCharacterSprite.ts` | `manifestDir` param | Accept `assetFolder` param |
| `CharacterPage.tsx` | `plugin.manifest.dir` → `useCharacterSprite` | Get `assetFolder` from plugin |
| `CharacterSidebar.tsx` | `manifestDir` via `useCharacterSprite` | Get `assetFolder` from plugin |
| `SidebarQuests.tsx` | `plugin.manifest.dir` → hooks + modals | Get `assetFolder` from plugin |
| `FullKanban.tsx` | `plugin.manifest.dir` → BountyModal, LevelUpModal | Get `assetFolder` from plugin |
| `LevelUpModal.ts` | `manifestDir` option for sprite display | Accept `assetService` option |

#### DungeonView.tsx Inline Paths to Consolidate

| Line | Current Code | Consolidate Into |
|------|--------------|------------------|
| ~69 | Local `getPlayerSpritePath()` helper | `SpriteService.getPlayerSpritePath()` |
| ~83 | Local `getTileSpritePath()` helper | `TileRegistry.getSpritePath()` |
| ~126 | Inline chest sprite path | New `SpriteService.getChestSpritePath()` |
| ~1325 | Monster sprite for battle | `SpriteService.getMonsterSpritePath()` |
| ~1330 | Player sprite for battle | `SpriteService.getPlayerSpritePath()` |

---

### Phase 4: Main Plugin Integration
**Files:** Modify `main.ts`, `src/settings.ts`

#### Tasks
- [ ] Initialize `AssetService` on plugin load and store as `this.assetService`
- [ ] **Non-blocking startup:** Run update checks in background, don't await on plugin load
- [ ] Check for first run and show download modal if needed (first run only blocks)
- [ ] Add periodic update check (configurable: daily/weekly/manual, **default: weekly**)

> [!TIP]
> **Startup optimization (post-implementation polish):** `checkForUpdates()` does an `adapter.exists()` call for every file in the manifest (~200+ files). Consider caching the manifest version/hash comparison first and only doing per-file existence checks if the version differs. This avoids ~200 filesystem checks on every startup when nothing has changed.
- [ ] Add "Check for Asset Updates" command
- [ ] On path change: auto-delete old folder and trigger fresh download (simplified)
- [ ] **Max file size check:** Reject files over 2MB to prevent corrupted CDN responses
- [ ] For critical updates: use jsDelivr purge API (optional)

#### Settings Changes

```typescript
// New settings fields (minimal)
assetFolder: string;           // Default: 'QuestBoard/assets'
assetUpdateFrequency: 'daily' | 'weekly' | 'manual'; // Default: 'weekly'
lastAssetCheck: number;        // Timestamp

// Simplified path change handling
if (oldPath !== newPath) {
    // Just delete old and re-download - ~7MB takes seconds
    await deleteFolder(oldPath);
    const { files, remoteManifest } = await assetService.checkForUpdates();
    await assetService.downloadAssets(files, remoteManifest);
}
```

---

### Phase 5: Existing User Migration (Simplified)

> [!TIP]
> Since old assets used plugin-relative paths with different hash formats, copying is unreliable. Just download fresh.

#### Tasks
- [ ] Detect assets in old location (`manifest.dir/assets/`)
- [ ] Delete old assets automatically (they won't work anyway)
- [ ] Trigger fresh download to new vault location
- [ ] Show "Migration complete" notice

---

## Files Summary

### New Files
| File | Purpose | Lines Est. |
|------|---------|------------|
| `src/services/AssetService.ts` | Remote fetching, caching, versioning | ~200 |
| `src/modals/AssetDownloadModal.ts` | First-run download UI | ~100 |

> **Note:** `scripts/generate-asset-manifest.js` already exists.

### Pre-Implementation Cleanup (before Phase 1)
| File | Changes |
|------|---------|
| `src/models/Achievement.ts` | Remove `badgePath` field |
| `src/settings.ts` | Remove `badgeFolder` and `spriteFolder` settings + UI |
| `src/services/AchievementService.ts` | Remove `badgeFolder` field, constructor param, and badge methods |
| `src/modals/AchievementUnlockModal.ts` | Remove `badgeFolder` param |
| `src/modals/AchievementHubModal.ts` | Remove `badgeFolder` option |
| `src/modals/CharacterCreationModal.ts` | Replace hardcoded vault path with `SpriteService.getClassPreviewSprite()` |
| `src/hooks/useXPAward.ts` | Remove `badgeFolder` option + hardcoded `'Life/Quest Board/assets/badges'` default |
| `src/data/TileRegistry.ts` | Normalize tile filenames from spaces to kebab-case |
| `src/components/DungeonView.tsx` | Consolidate inline sprite helpers to use `SpriteService` |
| `src/components/SidebarQuests.tsx` | Remove `spriteFolder` + `badgeFolder` prop threading |
| `src/components/FullKanban.tsx` | Remove `badgeFolder` pass-through |
| `src/components/CharacterPage.tsx` | Remove `badgeFolder` pass-throughs |
| `src/components/CharacterSidebar.tsx` | Remove `spriteFolder` prop |
| `src/components/AchievementsSidebar.tsx` | Remove `badgeFolder` prop |
| `src/components/CharacterSheet.tsx` | **DELETE** (deprecated) |

### Modified Files (Phases 1-5)
| File | Changes |
|------|---------|
| `src/services/SpriteService.ts` | Use `assetFolder` instead of `manifestDir` |
| `src/data/TileRegistry.ts` | Use `assetFolder` for tile sprites (filenames already normalized in pre-impl) |
| `src/components/DungeonView.tsx` | Remove inline helpers, use SpriteService, get `assetFolder` from plugin |
| `src/views/DungeonItemView.tsx` | Get `assetFolder` from plugin |
| `src/views/BattleItemView.tsx` | Get `assetFolder` from plugin, fix hardcoded `battle-bg.jpg` |
| `src/modals/CharacterCreationModal.ts` | Migrate from `SpriteService` to `AssetService` (already using SpriteService after pre-impl) |
| `src/modals/BountyModal.ts` | Accept `assetService` option |
| `src/modals/EliteEncounterModal.ts` | Accept `assetService` option |
| `src/modals/LevelUpModal.ts` | Accept `assetService` option |
| `src/hooks/useQuestActions.ts` | Remove `manifestDir` param |
| `src/hooks/useCharacterSprite.ts` | Accept `assetFolder` param |
| `src/components/CharacterPage.tsx` | Remove `manifestDir` prop, get `assetFolder` from plugin |
| `src/components/CharacterSidebar.tsx` | Remove `manifestDir` via `useCharacterSprite`, get `assetFolder` from plugin |
| `src/components/SidebarQuests.tsx` | Remove `manifestDir` prop threading to hooks and modals |
| `src/components/FullKanban.tsx` | Remove `manifestDir` pass-through to BountyModal + LevelUpModal |
| `src/settings.ts` | Add asset folder settings |
| `main.ts` | Initialize AssetService as `this.assetService`, first-run check |

---

## Testing Checklist

### First-Run Experience
- [ ] Fresh install shows download modal
- [ ] Progress bar updates correctly
- [ ] Cancel button works (shows warning)
- [ ] Plugin loads correctly after download
- [ ] Incomplete download (quit mid-way) triggers repair on next load

### Asset Loading
- [ ] Player sprites load in character page and sidebar
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
- [ ] Path change auto-deletes and re-downloads (no prompt)
- [ ] Update check runs in background (doesn't block startup)

### Security
- [ ] Path traversal attempts (../) are blocked
- [ ] Non-image Content-Types are rejected
- [ ] Manifest parsing uses safeJsonParse
- [ ] Only allowed file extensions download (.png, .gif, .jpg, .jpeg, .webp)

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

### Pre-Implementation (Not Started)
- [ ] Badge system removal (dead code cleanup)
- [ ] spriteFolder setting removal
- [ ] CharacterCreationModal fix (use SpriteService.getClassPreviewSprite)
- [ ] DungeonView inline helper consolidation (use SpriteService, fix underscore filename mismatch)
- [ ] Clean up legacy underscore-named sprite files from deployed plugin folders
- [ ] Environment tile filename normalization (spaces → kebab-case)
- [ ] Delete deprecated CharacterSheet.tsx

### Session 1 (Not Started)
- [ ] Phase 1: AssetService foundation
- [ ] Phase 2: Download modal & first-run experience

### Session 2 (Not Started)
- [ ] Phase 3: SpriteService & component migration (partial)
- [ ] Phase 4: Main plugin integration

### Session 3 (Not Started)
- [ ] Phase 3: Complete component migration
- [ ] Phase 5: Existing user migration
- [ ] Testing & polish
