#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import version info (we'll read from the file since this is Node.js)
const versionPath = path.join(__dirname, '../src/lib/version.ts');
const versionContent = fs.readFileSync(versionPath, 'utf8');

// Extract version info using regex
const appVersionMatch = versionContent.match(/export const APP_VERSION = \"([^\"]+)\"/);
const APP_VERSION = appVersionMatch ? appVersionMatch[1] : '1.0.0';

// Generate build info
const BUILD_DATE = new Date().toISOString().split('T')[0];
const BUILD_NUMBER = Math.floor(Date.now() / 1000);

// Calculate firmware version (increment minor version for each build)
const baseFirmwareVersion = '8.2';
const [major, minor] = baseFirmwareVersion.split('.').map(Number);
const newMinor = minor + (BUILD_NUMBER % 100); // Add some variation
const FIRMWARE_VERSION = `${major}.${newMinor}`;

console.log(`🔧 Building firmware v${FIRMWARE_VERSION} for app v${APP_VERSION}...`);

// Read the base firmware template
const firmwareTemplate = path.join(__dirname, '../firmware/puck_espruino_compatible.js');
const firmwareContent = fs.readFileSync(firmwareTemplate, 'utf8');

// Update firmware content with new version info
const updatedFirmwareContent = firmwareContent
  .replace(/\/\/ Version: [\d.]+/, `// Version: ${FIRMWARE_VERSION}`)
  .replace(/\/\/ App Version: [\d.]+/, `// App Version: ${APP_VERSION}`)
  .replace(/\/\/ Build: \d+/, `// Build: ${BUILD_NUMBER}`)
  .replace(/\/\/ Date: [\d-]+/, `// Date: ${BUILD_DATE}`);

// Create version-specific firmware filename
const firmwareFilename = `puck_v${FIRMWARE_VERSION}_app_${APP_VERSION}.js`;
const firmwarePath = path.join(__dirname, '../firmware', firmwareFilename);

// Write the new firmware file
fs.writeFileSync(firmwarePath, updatedFirmwareContent);

// Update or create firmware manifest
const manifestPath = path.join(__dirname, '../firmware/manifest.json');
let manifest = { versions: [] };

if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

// Add new version to manifest
const newVersion = {
  firmwareVersion: FIRMWARE_VERSION,
  appVersion: APP_VERSION,
  buildNumber: BUILD_NUMBER,
  buildDate: BUILD_DATE,
  filename: firmwareFilename,
  isLatest: true,
  features: [
    "26Hz accelerometer sampling",
    "Enhanced NFC detection", 
    "Improved BLE stability",
    "Battery monitoring",
    "Auto-calibration",
    "Error recovery"
  ],
  compatibility: "stable"
};

// Mark all other versions as not latest
manifest.versions.forEach(v => v.isLatest = false);

// Add new version
manifest.versions.unshift(newVersion);

// Keep only last 10 versions
if (manifest.versions.length > 10) {
  manifest.versions = manifest.versions.slice(0, 10);
}

// Write updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// Update the firmware registry
const registryPath = path.join(__dirname, '../src/lib/firmwareRegistry.ts');
const registryContent = fs.readFileSync(registryPath, 'utf8');

// Update the latest firmware entry in the registry
const updatedRegistry = registryContent
  .replace(/version: \"[\d.]+\",/, `version: \"${FIRMWARE_VERSION}\",`)
  .replace(/appVersion: \"[\d.]+\",/, `appVersion: \"${APP_VERSION}\",`)
  .replace(/buildNumber: BUILD_NUMBER,/, `buildNumber: ${BUILD_NUMBER},`)
  .replace(/filename: \"[^\"]+\",/, `filename: \"${firmwareFilename}\",`)
  .replace(/title: \"TapFit Puck v[\d.]+ - Latest\",/, `title: \"TapFit Puck v${FIRMWARE_VERSION} - Latest\",`);

fs.writeFileSync(registryPath, updatedRegistry);

console.log(`✅ Firmware v${FIRMWARE_VERSION} built successfully!`);
console.log(`📁 File: firmware/${firmwareFilename}`);
console.log(`📝 Manifest updated with ${manifest.versions.length} versions`);
console.log(`🔄 Registry updated for app v${APP_VERSION}`);
