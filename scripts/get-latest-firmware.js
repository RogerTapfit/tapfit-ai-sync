#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read firmware manifest
const manifestPath = path.join(__dirname, '../firmware/manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.log('❌ No firmware manifest found. Run "npm run build:firmware" first.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const latestFirmware = manifest.versions.find(v => v.isLatest);

if (!latestFirmware) {
  console.log('❌ No latest firmware found in manifest.');
  process.exit(1);
}

const firmwarePath = path.join(__dirname, '../firmware', latestFirmware.filename);

if (!fs.existsSync(firmwarePath)) {
  console.log(`❌ Firmware file not found: ${latestFirmware.filename}`);
  process.exit(1);
}

// Display firmware info
console.log('\n🚀 TapFit Latest Firmware Info');
console.log('================================');
console.log(`📱 App Version: ${latestFirmware.appVersion}`);
console.log(`🔌 Firmware Version: ${latestFirmware.firmwareVersion}`);
console.log(`📅 Build Date: ${latestFirmware.buildDate}`);
console.log(`🏗️  Build Number: ${latestFirmware.buildNumber}`);
console.log(`📁 Filename: ${latestFirmware.filename}`);
console.log(`✨ Status: ${latestFirmware.compatibility.toUpperCase()}`);

console.log('\n🔧 Features:');
latestFirmware.features.forEach(feature => {
  console.log(`   • ${feature}`);
});

console.log('\n📋 Installation Instructions:');
console.log('==============================');
console.log('1. Open Espruino Web IDE (https://www.espruino.com/ide/)');
console.log('2. Connect your Puck.js device');
console.log('3. Copy the firmware code below');
console.log('4. Paste it into the IDE and click "Send to Espruino"');

console.log('\n💾 Terminal Commands:');
console.log('====================');
console.log(`# Copy firmware to clipboard (macOS):`);
console.log(`cat firmware/${latestFirmware.filename} | pbcopy`);
console.log(`# View firmware code:`);
console.log(`cat firmware/${latestFirmware.filename}`);
console.log(`# Open Espruino IDE:`);
console.log(`open https://www.espruino.com/ide/`);

console.log('\n🔄 Quick Deploy Commands:');
console.log('=========================');
console.log(`# Build and sync iOS:`);
console.log(`npm run xcode:latest`);
console.log(`# Just view the firmware:`);
console.log(`npm run show:firmware`);

// If --show flag is passed, display the firmware code
if (process.argv.includes('--show')) {
  console.log('\n📝 Firmware Code:');
  console.log('==================');
  const firmwareCode = fs.readFileSync(firmwarePath, 'utf8');
  console.log(firmwareCode);
}

// If --copy flag is passed (and on macOS), copy to clipboard
if (process.argv.includes('--copy') && process.platform === 'darwin') {
  const { execSync } = require('child_process');
  try {
    execSync(`cat "${firmwarePath}" | pbcopy`);
    console.log('\n📋 Firmware code copied to clipboard!');
  } catch (error) {
    console.log('\n❌ Failed to copy to clipboard:', error.message);
  }
}

console.log('\n✅ Ready to deploy! Use the commands above to install the firmware.');