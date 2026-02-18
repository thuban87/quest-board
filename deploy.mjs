/**
 * Deploy script - copies built files to Obsidian vaults
 * 
 * Usage:
 *   node deploy.mjs test        - Deploy to TEST vault (safe, for development)
 *   node deploy.mjs staging     - Deploy to STAGING vault (real files)
 *   node deploy.mjs production  - Deploy to PRODUCTION vault (requires confirmation)
 * 
 * Asset handling:
 *   test/staging: Assets copied to vault asset folder (for local testing)
 *   production:   Assets NOT copied (delivered via CDN)
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';

// Plugin directory paths (where main.js, manifest.json, styles.css go)
const VAULTS = {
    test: 'C:\\Quest-Board-Test-Vault\\.obsidian\\plugins\\quest-board',
    staging: 'C:\\Quest-Board-Staging-Vault\\Staging Vault\\.obsidian\\plugins\\quest-board',
    production: 'G:\\My Drive\\IT\\Obsidian Vault\\My Notebooks\\.obsidian\\plugins\\quest-board'
};

// Vault asset folder paths (where sprites, tiles, backgrounds go)
// These match the assetFolder setting in each vault's plugin config.
// Production uses CDN delivery — no local asset copying needed.
const ASSET_FOLDERS = {
    test: 'C:\\Quest-Board-Test-Vault\\Life\\Quest Board\\assets',
    staging: 'C:\\Quest-Board-Staging-Vault\\Staging Vault\\Life\\Quest Board\\assets',
    // production: not needed — assets delivered via jsDelivr CDN
};

// Core plugin files to copy (all targets)
const FILES_TO_COPY = [
    'main.js',
    'manifest.json',
    'styles.css'
];

// Get target from command line
const target = process.argv[2];

if (!target || !VAULTS[target]) {
    console.error('❌ Invalid deploy target!');
    console.error('');
    console.error('Usage:');
    console.error('  npm run deploy:test        - Deploy to TEST vault (safe)');
    console.error('  npm run deploy:staging     - Deploy to STAGING vault (real files)');
    console.error('  npm run deploy:production  - Deploy to PRODUCTION vault (dangerous!)');
    console.error('');
    process.exit(1);
}

const targetPath = VAULTS[target];
const assetTargetPath = ASSET_FOLDERS[target]; // undefined for production

/**
 * Recursively copy a directory
 */
function copyDirRecursive(src, dest) {
    if (!existsSync(src)) {
        return 0;
    }

    mkdirSync(dest, { recursive: true });
    let count = 0;

    const entries = readdirSync(src);
    for (const entry of entries) {
        // Skip archived sprites — old versions kept locally for review only
        if (entry === 'archive') continue;

        const srcPath = join(src, entry);
        const destPath = join(dest, entry);

        if (statSync(srcPath).isDirectory()) {
            count += copyDirRecursive(srcPath, destPath);
        } else {
            copyFileSync(srcPath, destPath);
            count++;
        }
    }

    return count;
}

/**
 * Prompt user for confirmation (production only)
 */
async function confirmProduction() {
    if (target !== 'production') {
        return true;
    }

    console.log('');
    console.log('⚠️  ========================================');
    console.log('⚠️  PRODUCTION DEPLOY');
    console.log('⚠️  ========================================');
    console.log('');
    console.log(`Target: ${targetPath}`);
    console.log('');
    console.log('This will overwrite your REAL Obsidian vault!');
    console.log('Assets: Delivered via CDN (not copied)');
    console.log('');

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question('Type "yes" to continue: ', (answer) => {
            rl.close();
            if (answer.toLowerCase() === 'yes') {
                resolve(true);
            } else {
                console.log('');
                console.log('❌ Deploy cancelled.');
                resolve(false);
            }
        });
    });
}

/**
 * Deploy files to target vault
 */
async function deploy() {
    // Confirm production deploys
    const confirmed = await confirmProduction();
    if (!confirmed) {
        process.exit(0);
    }

    // Ensure the destination directory exists
    if (!existsSync(targetPath)) {
        console.log(`Creating directory: ${targetPath}`);
        mkdirSync(targetPath, { recursive: true });
    }

    // Copy core plugin files
    const labels = {
        test: '🧪 TEST',
        staging: '📦 STAGING',
        production: '🚀 PRODUCTION'
    };
    const label = labels[target] || '🧪 TEST';
    console.log(`\nDeploying to ${label} vault...`);

    console.log('\n  Plugin files:');
    for (const file of FILES_TO_COPY) {
        const src = join(process.cwd(), file);
        const dest = join(targetPath, file);

        try {
            copyFileSync(src, dest);
            console.log(`    ✓ ${file}`);
        } catch (error) {
            console.error(`    ✗ Failed to copy ${file}:`, error.message);
            process.exit(1);
        }
    }

    // Copy assets to vault asset folder (test/staging only)
    if (assetTargetPath) {
        const assetSrc = join(process.cwd(), 'assets');

        try {
            const count = copyDirRecursive(assetSrc, assetTargetPath);
            if (count > 0) {
                console.log(`\n  Assets (→ vault folder):`);
                console.log(`    ✓ ${count} files → ${assetTargetPath}`);
            }
        } catch (error) {
            console.error(`\n  ✗ Failed to copy assets:`, error.message);
        }
    } else {
        console.log(`\n  Assets: Skipped (CDN delivery)`);
    }

    console.log('');
    console.log('✅ Deployment complete!');
    console.log(`   Target: ${label}`);
    console.log(`   Plugin: ${targetPath}`);
    if (assetTargetPath) {
        console.log(`   Assets: ${assetTargetPath}`);
    } else {
        console.log(`   Assets: CDN (cdn.jsdelivr.net)`);
    }
    console.log('   Reload Obsidian to see changes.');
}

deploy();

