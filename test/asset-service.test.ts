/**
 * AssetService Unit Tests
 * 
 * Tests for the remote asset delivery service.
 * Uses mocked Obsidian API (requestUrl, DataAdapter, Vault).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { App, Vault } from 'obsidian';

// Use vi.hoisted so the mock fn is available inside the hoisted vi.mock factory
const { mockRequestUrl } = vi.hoisted(() => ({
    mockRequestUrl: vi.fn(),
}));

vi.mock('obsidian', async (importOriginal) => {
    const actual = await importOriginal<typeof import('obsidian')>();
    return {
        ...actual,
        requestUrl: mockRequestUrl,
    };
});

import { AssetService, AssetManifest } from '../src/services/AssetService';

// ============== Helper: Create a mock App =========================

function createMockApp(overrides?: {
    adapterExists?: (path: string) => Promise<boolean>;
    adapterRead?: (path: string) => Promise<string>;
    adapterWrite?: (path: string, data: string) => Promise<void>;
    adapterWriteBinary?: (path: string, data: ArrayBuffer) => Promise<void>;
    adapterRemove?: (path: string) => Promise<void>;
    adapterGetResourcePath?: (path: string) => string;
    createFolder?: (path: string) => Promise<void>;
}) {
    const app = new App() as any;
    if (overrides?.adapterExists) app.vault.adapter.exists = overrides.adapterExists;
    if (overrides?.adapterRead) app.vault.adapter.read = overrides.adapterRead;
    if (overrides?.adapterWrite) app.vault.adapter.write = overrides.adapterWrite;
    if (overrides?.adapterWriteBinary) app.vault.adapter.writeBinary = overrides.adapterWriteBinary;
    if (overrides?.adapterRemove) app.vault.adapter.remove = overrides.adapterRemove;
    if (overrides?.adapterGetResourcePath) app.vault.adapter.getResourcePath = overrides.adapterGetResourcePath;
    if (overrides?.createFolder) app.vault.createFolder = overrides.createFolder;
    return app as App;
}

// Reset mock before each test
beforeEach(() => {
    mockRequestUrl.mockReset();
});

// ============== getStoragePath =====================================

describe('AssetService.getStoragePath', () => {
    const app = createMockApp();
    const service = new AssetService(app, 'QuestBoard/assets');

    it('should return vault-relative path for valid input', () => {
        expect(service.getStoragePath('sprites/warrior.gif'))
            .toBe('QuestBoard/assets/sprites/warrior.gif');
    });

    it('should normalize backslashes to forward slashes', () => {
        expect(service.getStoragePath('sprites\\player\\warrior.gif'))
            .toBe('QuestBoard/assets/sprites/player/warrior.gif');
    });

    it('should reject path traversal with ..', () => {
        expect(() => service.getStoragePath('../etc/passwd'))
            .toThrow('Invalid asset path');
    });

    it('should reject paths starting with /', () => {
        expect(() => service.getStoragePath('/absolute/path.png'))
            .toThrow('Invalid asset path');
    });

    it('should handle deeply nested paths', () => {
        expect(service.getStoragePath('sprites/player/warrior/tier1/warrior-tier-1.gif'))
            .toBe('QuestBoard/assets/sprites/player/warrior/tier1/warrior-tier-1.gif');
    });

    it('should use custom asset folder', () => {
        const customService = new AssetService(app, 'MyAssets');
        expect(customService.getStoragePath('sprite.png'))
            .toBe('MyAssets/sprite.png');
    });
});

// ============== getDisplayPath =====================================

describe('AssetService.getDisplayPath', () => {
    it('should return adapter resource path', () => {
        const app = createMockApp({
            adapterGetResourcePath: (path: string) => `app://local/${path}`,
        });
        const service = new AssetService(app, 'QuestBoard/assets');

        expect(service.getDisplayPath('sprites/warrior.gif'))
            .toBe('app://local/QuestBoard/assets/sprites/warrior.gif');
    });
});

// ============== isFirstRun ========================================

describe('AssetService.isFirstRun', () => {
    it('should return true when manifest does not exist', async () => {
        const app = createMockApp({
            adapterExists: async () => false,
        });
        const service = new AssetService(app);
        expect(await service.isFirstRun()).toBe(true);
    });

    it('should return false when manifest exists', async () => {
        const app = createMockApp({
            adapterExists: async () => true,
        });
        const service = new AssetService(app);
        expect(await service.isFirstRun()).toBe(false);
    });
});

// ============== checkForUpdates ===================================

describe('AssetService.checkForUpdates', () => {
    const remoteManifest: AssetManifest = {
        version: '1.0.0',
        lastUpdated: '2026-01-01T00:00:00Z',
        files: {
            'sprites/warrior.gif': { hash: 'abc123', size: 1000 },
            'sprites/goblin.gif': { hash: 'def456', size: 2000 },
        },
    };

    it('should return all files on first run (no local manifest)', async () => {
        mockRequestUrl.mockResolvedValue({
            status: 200,
            headers: {},
            text: JSON.stringify(remoteManifest),
        });

        const app = createMockApp({
            adapterExists: async () => false,
        });

        const service = new AssetService(app, 'QuestBoard/assets');
        const result = await service.checkForUpdates();

        expect(result.needsUpdate).toBe(true);
        expect(result.files).toEqual(['sprites/warrior.gif', 'sprites/goblin.gif']);
        expect(result.orphaned).toEqual([]);
        expect(result.remoteManifest).toEqual(remoteManifest);
    });

    it('should detect files needing update when hash differs', async () => {
        const localManifest: AssetManifest = {
            version: '1.0.0',
            lastUpdated: '2026-01-01T00:00:00Z',
            files: {
                'sprites/warrior.gif': { hash: 'abc123', size: 1000 },  // Same
                'sprites/goblin.gif': { hash: 'old_hash', size: 2000 }, // Different
            },
        };

        mockRequestUrl.mockResolvedValue({
            status: 200,
            headers: {},
            text: JSON.stringify(remoteManifest),
        });

        const existingFiles = new Set([
            'QuestBoard/assets/manifest.json',
            'QuestBoard/assets/sprites/warrior.gif',
            'QuestBoard/assets/sprites/goblin.gif',
        ]);

        const app = createMockApp({
            adapterExists: async (path: string) => existingFiles.has(path),
            adapterRead: async () => JSON.stringify(localManifest),
        });

        const service = new AssetService(app, 'QuestBoard/assets');
        const result = await service.checkForUpdates();

        expect(result.needsUpdate).toBe(true);
        expect(result.files).toEqual(['sprites/goblin.gif']);
    });

    it('should detect missing files even if hash matches', async () => {
        const localManifest: AssetManifest = {
            version: '1.0.0',
            lastUpdated: '2026-01-01T00:00:00Z',
            files: {
                'sprites/warrior.gif': { hash: 'abc123', size: 1000 },
                'sprites/goblin.gif': { hash: 'def456', size: 2000 },
            },
        };

        mockRequestUrl.mockResolvedValue({
            status: 200,
            headers: {},
            text: JSON.stringify(remoteManifest),
        });

        // warrior.gif is missing from disk even though hash matches
        const existingFiles = new Set([
            'QuestBoard/assets/manifest.json',
            'QuestBoard/assets/sprites/goblin.gif',
        ]);

        const app = createMockApp({
            adapterExists: async (path: string) => existingFiles.has(path),
            adapterRead: async () => JSON.stringify(localManifest),
        });

        const service = new AssetService(app, 'QuestBoard/assets');
        const result = await service.checkForUpdates();

        expect(result.files).toEqual(['sprites/warrior.gif']);
    });

    it('should identify orphaned files', async () => {
        const localManifest: AssetManifest = {
            version: '1.0.0',
            lastUpdated: '2026-01-01T00:00:00Z',
            files: {
                'sprites/warrior.gif': { hash: 'abc123', size: 1000 },
                'sprites/old-monster.gif': { hash: 'xyz789', size: 3000 }, // Not in remote
            },
        };

        mockRequestUrl.mockResolvedValue({
            status: 200,
            headers: {},
            text: JSON.stringify(remoteManifest),
        });

        const app = createMockApp({
            adapterExists: async () => true,
            adapterRead: async () => JSON.stringify(localManifest),
        });

        const service = new AssetService(app, 'QuestBoard/assets');
        const result = await service.checkForUpdates();

        expect(result.orphaned).toEqual(['sprites/old-monster.gif']);
    });
});

// ============== cleanupOrphanedFiles ==============================

describe('AssetService.cleanupOrphanedFiles', () => {
    it('should remove files that exist', async () => {
        const removedPaths: string[] = [];
        const app = createMockApp({
            adapterExists: async () => true,
            adapterRemove: async (path: string) => { removedPaths.push(path); },
        });
        const service = new AssetService(app, 'QuestBoard/assets');

        await service.cleanupOrphanedFiles(['sprites/old.gif', 'backgrounds/removed.png']);

        expect(removedPaths).toEqual([
            'QuestBoard/assets/sprites/old.gif',
            'QuestBoard/assets/backgrounds/removed.png',
        ]);
    });

    it('should skip files that do not exist', async () => {
        const removedPaths: string[] = [];
        const app = createMockApp({
            adapterExists: async () => false,
            adapterRemove: async (path: string) => { removedPaths.push(path); },
        });
        const service = new AssetService(app, 'QuestBoard/assets');

        await service.cleanupOrphanedFiles(['sprites/nonexistent.gif']);

        expect(removedPaths).toEqual([]);
    });
});

// ============== downloadAssets ====================================

describe('AssetService.downloadAssets', () => {
    it('should reject files with disallowed extensions', async () => {
        const app = createMockApp();
        const service = new AssetService(app);

        const manifest: AssetManifest = {
            version: '1.0.0',
            lastUpdated: '2026-01-01T00:00:00Z',
            files: { 'malware.exe': { hash: 'bad', size: 100 } },
        };

        await expect(service.downloadAssets(['malware.exe'], manifest))
            .rejects.toThrow('Unsupported file type');
    });

    it('should call progress callback for each file', async () => {
        const mockBuffer = new ArrayBuffer(100);

        mockRequestUrl.mockResolvedValue({
            status: 200,
            headers: { 'content-type': 'image/gif' },
            text: '',
            arrayBuffer: mockBuffer,
        });

        const writtenPaths: string[] = [];
        const app = createMockApp({
            adapterExists: async () => true,
            adapterWriteBinary: async (path: string) => { writtenPaths.push(path); },
            adapterWrite: async () => { },
        });

        const service = new AssetService(app, 'QuestBoard/assets');
        const progressCalls: Array<{ current: number; total: number; file: string }> = [];

        const manifest: AssetManifest = {
            version: '1.0.0',
            lastUpdated: '2026-01-01T00:00:00Z',
            files: {
                'sprites/a.gif': { hash: 'a1', size: 100 },
                'sprites/b.png': { hash: 'b2', size: 200 },
            },
        };

        await service.downloadAssets(
            ['sprites/a.gif', 'sprites/b.png'],
            manifest,
            (current, total, file) => {
                progressCalls.push({ current, total, file });
            }
        );

        expect(progressCalls.length).toBe(2);
        expect(progressCalls[0].total).toBe(2);
        expect(progressCalls[1].total).toBe(2);
        expect(progressCalls.map(p => p.current).sort()).toEqual([1, 2]);
    });

    it('should write manifest LAST after all files', async () => {
        const writeOrder: string[] = [];
        const mockBuffer = new ArrayBuffer(50);

        mockRequestUrl.mockResolvedValue({
            status: 200,
            headers: { 'content-type': 'image/png' },
            text: '',
            arrayBuffer: mockBuffer,
        });

        const app = createMockApp({
            adapterExists: async () => true,
            adapterWriteBinary: async (path: string) => { writeOrder.push(`binary:${path}`); },
            adapterWrite: async (path: string) => { writeOrder.push(`text:${path}`); },
        });

        const service = new AssetService(app, 'QuestBoard/assets');

        const manifest: AssetManifest = {
            version: '1.0.0',
            lastUpdated: '2026-01-01T00:00:00Z',
            files: {
                'sprites/a.png': { hash: 'a1', size: 50 },
            },
        };

        await service.downloadAssets(['sprites/a.png'], manifest);

        const lastWrite = writeOrder[writeOrder.length - 1];
        expect(lastWrite).toBe('text:QuestBoard/assets/manifest.json');
        expect(writeOrder[0]).toBe('binary:QuestBoard/assets/sprites/a.png');
    });

    it('should reject non-image Content-Type', async () => {
        mockRequestUrl.mockResolvedValue({
            status: 200,
            headers: { 'content-type': 'text/html' },
            text: '<html>Error</html>',
            arrayBuffer: new ArrayBuffer(100),
        });

        const app = createMockApp();
        const service = new AssetService(app);
        const manifest: AssetManifest = {
            version: '1.0.0',
            lastUpdated: '2026-01-01T00:00:00Z',
            files: { 'sprites/test.png': { hash: 'x', size: 100 } },
        };

        await expect(service.downloadAssets(['sprites/test.png'], manifest))
            .rejects.toThrow('Expected image, got text/html');
    });
});
