/**
 * Deploy script - copies built files to production Obsidian vault
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Production vault path
const PRODUCTION_PATH = 'G:\\My Drive\\IT\\Obsidian Vault\\My Notebooks\\.obsidian\\plugins\\quest-board';

// Files to copy
const FILES_TO_COPY = [
    'main.js',
    'manifest.json',
    'styles.css'
];

// Ensure the destination directory exists
if (!existsSync(PRODUCTION_PATH)) {
    console.log(`Creating directory: ${PRODUCTION_PATH}`);
    mkdirSync(PRODUCTION_PATH, { recursive: true });
}

// Copy files
console.log('Deploying to production vault...');
for (const file of FILES_TO_COPY) {
    const src = join(process.cwd(), file);
    const dest = join(PRODUCTION_PATH, file);

    try {
        copyFileSync(src, dest);
        console.log(`  ✓ ${file}`);
    } catch (error) {
        console.error(`  ✗ Failed to copy ${file}:`, error.message);
        process.exit(1);
    }
}

console.log('\n✅ Deployment complete!');
console.log(`   Files copied to: ${PRODUCTION_PATH}`);
console.log('   Reload Obsidian to see changes.');
