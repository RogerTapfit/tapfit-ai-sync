#!/bin/bash

# Simple TapFit v1.2.5 Xcode Launcher
set -e

echo "🚀 TapFit v1.2.5 Xcode Launcher"
echo "================================"

# Check if Xcode exists
if [ ! -d "/Applications/Xcode.app" ]; then
    echo "❌ Xcode not found. Please install Xcode from the App Store."
    exit 1
fi

# Update to version 1.2.5
echo "📱 Updating to version 1.2.5..."
if [ -f "scripts/update-version.js" ]; then
    node scripts/update-version.js 1.2.5 || {
        echo "⚠️  Version script failed, but continuing..."
    }
else
    echo "⚠️  Version script not found, but v1.2.5 should already be set"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Add iOS platform if not exists
if [ ! -d "ios" ]; then
    echo "📱 Adding iOS platform..."
    npx cap add ios
fi

# Sync with iOS
echo "🔄 Syncing with iOS..."
npx cap sync ios

# Open Xcode using Capacitor (most reliable method)
echo "📱 Opening Xcode..."
npx cap open ios

echo "✅ Done! Xcode should now be open with TapFit v1.2.5"
echo ""
echo "If Xcode didn't open, try manually:"
echo "1. Open Xcode"
echo "2. Open the project: ios/App/App.xcodeproj"
echo "3. Select your device and run the app"