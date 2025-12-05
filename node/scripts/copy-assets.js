#!/usr/bin/env node

/**
 * Copy assets from project root to node/ folder for npm publishing
 * This script is run before `npm publish` via prepublishOnly
 */

import * as fs from "fs";
import * as path from "path";
import {fileURLToPath} from "url";

const NODE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_ASSETS = path.join(NODE_DIR, "../../assets");
const DEST_ASSETS = path.join(NODE_DIR, "../assets");

// Folders to exclude (dev-only)
const EXCLUDE_FOLDERS = ["example", "output"];

// Files to exclude
const EXCLUDE_FILES = [".gitkeep", ".DS_Store", "Thumbs.db"];

console.log("📦 Copying assets for npm publish...\n");
console.log(`   Source: ${SOURCE_ASSETS}`);
console.log(`   Dest:   ${DEST_ASSETS}\n`);

// Check source exists
if (!fs.existsSync(SOURCE_ASSETS)) {
    console.error("❌ Source assets directory not found!");
    console.error(`   Expected at: ${SOURCE_ASSETS}`);
    process.exit(1);
}

// Remove existing destination
if (fs.existsSync(DEST_ASSETS)) {
    console.log("🗑️  Removing existing assets...");
    fs.rmSync(DEST_ASSETS, { recursive: true, force: true });
}

// Copy with filtering
function copyDir(src, dest, indent = "") {
    fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        // Skip excluded folders
        if (entry.isDirectory() && EXCLUDE_FOLDERS.includes(entry.name)) {
            console.log(`${indent}⏭️  Skipping: ${entry.name}/`);
            continue;
        }

        // Skip excluded files
        if (entry.isFile() && EXCLUDE_FILES.includes(entry.name)) {
            continue;
        }

        if (entry.isDirectory()) {
            console.log(`${indent}📁 ${entry.name}/`);
            copyDir(srcPath, destPath, indent + "   ");
        } else {
            fs.copyFileSync(srcPath, destPath);
            const size = fs.statSync(destPath).size;
            const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
            console.log(`${indent}📄 ${entry.name} (${sizeStr})`);
        }
    }
}

console.log("📋 Copying files:\n");
copyDir(SOURCE_ASSETS, DEST_ASSETS);

// Calculate total size
function getDirSize(dir) {
    let size = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            size += getDirSize(fullPath);
        } else {
            size += fs.statSync(fullPath).size;
        }
    }
    return size;
}

const totalSize = getDirSize(DEST_ASSETS);
const sizeStr = totalSize > 1024 * 1024
    ? `${(totalSize / 1024 / 1024).toFixed(2)}MB`
    : `${(totalSize / 1024).toFixed(2)}KB`;

console.log(`\n✅ Assets copied successfully!`);
console.log(`📊 Total size: ${sizeStr}\n`);
console.log("💡 Remember: node/assets/ is git-ignored (auto-generated)");