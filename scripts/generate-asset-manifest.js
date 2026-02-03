/**
 * generate-asset-manifest.js
 * 
 * Generates assets/manifest.json with file hashes for the remote asset system.
 * Run with: node scripts/generate-asset-manifest.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const MANIFEST_PATH = path.join(ASSETS_DIR, 'manifest.json');

// File extensions to include
const VALID_EXTENSIONS = ['.png', '.gif', '.jpg', '.jpeg', '.webp'];

function getFileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

function walkDir(dir, baseDir = dir) {
    const files = {};

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            Object.assign(files, walkDir(fullPath, baseDir));
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (VALID_EXTENSIONS.includes(ext)) {
                // Get path relative to assets folder, use forward slashes
                const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
                const stats = fs.statSync(fullPath);

                files[relativePath] = {
                    hash: getFileHash(fullPath),
                    size: stats.size
                };
            }
        }
    }

    return files;
}

function generateManifest() {
    console.log('Scanning assets directory...');

    const files = walkDir(ASSETS_DIR);
    const fileCount = Object.keys(files).length;

    const manifest = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        fileCount: fileCount,
        files: files
    };

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

    console.log(`✅ Generated manifest with ${fileCount} files`);
    console.log(`   Output: ${MANIFEST_PATH}`);

    // Show some stats
    const totalSize = Object.values(files).reduce((sum, f) => sum + f.size, 0);
    console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

generateManifest();
