#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Auto-incrementing version...');

// Read current version from version.ts
const versionPath = path.join(__dirname, '../src/lib/version.ts');
const versionContent = fs.readFileSync(versionPath, 'utf8');

// Extract current version using regex
const appVersionMatch = versionContent.match(/export const APP_VERSION = \"([^\"]+)\"/);
if (!appVersionMatch) {
  console.log('❌ Could not find current version in version.ts');
  process.exit(1);
}

const currentVersion = appVersionMatch[1];
console.log(`📍 Current version: ${currentVersion}`);

// Parse version parts
const versionParts = currentVersion.split('.');
if (versionParts.length !== 3) {
  console.log('❌ Invalid version format. Expected semantic versioning (e.g., 1.2.6)');
  process.exit(1);
}

// Increment patch version
const major = parseInt(versionParts[0]);
const minor = parseInt(versionParts[1]);
const patch = parseInt(versionParts[2]) + 1;

const newVersion = `${major}.${minor}.${patch}`;
console.log(`🚀 New version: ${newVersion}`);

// Update version.ts
const updatedVersionContent = versionContent.replace(
  /export const APP_VERSION = "[^"]+"/,
  `export const APP_VERSION = "${newVersion}"`
);

fs.writeFileSync(versionPath, updatedVersionContent);
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
  console.log(`🎉 Version bumped to ${newVersion}! Run "npm run get:firmware" to see details.`);
} catch (error) {
  console.log('❌ Failed to build firmware:', error.message);
  process.exit(1);
}