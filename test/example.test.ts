/**
 * Example Test
 * 
 * Verifies the test setup is working correctly.
 */

import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
    it('should run a basic test', () => {
        expect(1 + 1).toBe(2);
    });

    it('should have access to mocked Obsidian API', async () => {
        const { Platform } = await import('obsidian');
        expect(Platform.isMobile).toBe(false);
        expect(Platform.isDesktop).toBe(true);
    });

    it('should have crypto available', () => {
        expect(crypto.randomUUID()).toBeDefined();
    });
});
