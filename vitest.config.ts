import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    // Resolve aliases to handle Obsidian module
    resolve: {
        alias: {
            // Mock the obsidian module entirely
            'obsidian': path.resolve(__dirname, 'test/mocks/obsidian.ts'),
        },
    },
    test: {
        // Test environment
        environment: 'node',

        // Setup files to run before tests
        setupFiles: ['./test/setup.ts'],

        // Include test files
        include: ['test/**/*.test.ts'],

        // Exclude node_modules
        exclude: ['node_modules/**'],

        // Coverage settings
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            exclude: [
                'node_modules/',
                'test/',
                '*.config.*',
                'esbuild.config.mjs',
                'deploy.mjs',
            ],
        },

        // Globals for describe, it, expect
        globals: true,
    },
});
