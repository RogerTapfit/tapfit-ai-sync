#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get new version from command line argument
const newVersion = process.argv[2];

if (!newVersion) {
  console.log('❌ Please provide a version number');
  console.log('Usage: npm run version 1.2.6');
  process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.log('❌ Invalid version format. Use semantic versioning (e.g., 1.2.6)');
  process.exit(1);
}

console.log(`🔄 Updating app version to ${newVersion}...`);

// Update version.ts
const versionPath = path.join(__dirname, '../src/lib/version.ts');
let versionContent = fs.readFileSync(versionPath, 'utf8');

versionContent = versionContent.replace(
  /export const APP_VERSION = "[^"]+"/,
  `export const APP_VERSION = "${newVersion}"`
);

fs.writeFileSync(versionPath, versionContent);

console.log(`✅ Updated src/lib/version.ts`);

// Update package.json version
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Updated package.json`);

// Automatically build new firmware
console.log(`🔧 Building firmware for v${newVersion}...`);
const { execSync } = require('child_process');

try {
  execSync('node scripts/build-firmware.js', { stdio: 'inherit' });
  console.log(`🚀 Version ${newVersion} ready! Run "npm run get:firmware" to see details.`);
} catch (error) {
  console.log('❌ Failed to build firmware:', error.message);
  process.exit(1);
}