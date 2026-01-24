/**
 * Vitest Setup File
 * 
 * Runs before all tests.
 * The Obsidian API mock is handled via resolve alias in vitest.config.ts
 */

// Mock crypto for random generation if not available
if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = {
        randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
        getRandomValues: (arr: Uint8Array) => {
            for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        },
    } as Crypto;
}

// Create minimal DOM environment for tests
if (typeof document === 'undefined') {
    // Node environment - create basic document mock
    (globalThis as any).document = {
        createElement: (tag: string) => ({
            tagName: tag.toUpperCase(),
            style: {},
            classList: {
                add: () => { },
                remove: () => { },
                toggle: () => { },
            },
            appendChild: () => { },
            addEventListener: () => { },
        }),
    };
}

export { };
