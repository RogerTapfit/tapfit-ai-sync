#!/usr/bin/env bash
set -euo pipefail

# TapFit 1.2.7 Setup Script
REPO_ROOT="$(cd "$(dirname "$0")"; pwd)"

echo "🚀 Setting up TapFit 1.2.7 iOS Platform"
echo "======================================="
echo ""

# Step 1: Remove incomplete iOS directory
echo "▶︎ Step 1: Removing incomplete iOS directory..."
rm -rf ios

# Step 2: Clean rebuild web bundle
echo "▶︎ Step 2: Building fresh web bundle..."
npm run build

# Step 3: Add iOS platform fresh
echo "▶︎ Step 3: Adding iOS platform..."
npx cap add ios

# Step 4: Sync web content
echo "▶︎ Step 4: Syncing web content to iOS..."
npx cap sync ios

# Step 5: Navigate to iOS directory and rename files
echo "▶︎ Step 5: Renaming Xcode files to TapFit-1.2.7..."
cd ios/App

# Rename workspace
if [ -f "App.xcworkspace" ]; then
  mv App.xcworkspace TapFit-1.2.7.xcworkspace
  echo "✅ Renamed App.xcworkspace → TapFit-1.2.7.xcworkspace"
else
  echo "❌ App.xcworkspace not found"
fi

# Rename project
if [ -f "App.xcodeproj" ]; then
  mv App.xcodeproj TapFit-1.2.7.xcodeproj
  echo "✅ Renamed App.xcodeproj → TapFit-1.2.7.xcodeproj"
else
  echo "❌ App.xcodeproj not found"
fi

# Step 6: Open the renamed workspace
echo "▶︎ Step 6: Opening TapFit-1.2.7.xcworkspace..."
if [ -f "TapFit-1.2.7.xcworkspace" ]; then
  open TapFit-1.2.7.xcworkspace
  echo "✅ SUCCESS! TapFit-1.2.7 workspace opened in Xcode"
else
  echo "❌ TapFit-1.2.7.xcworkspace not found"
  exit 1
fi

echo ""
echo "🎯 Complete! Your Xcode workspace is now named TapFit-1.2.7"
echo "   Version 1.2.7 should be displayed in Xcode"
echo ""
echo "🏗️  Next: Build and run in Xcode (⌘+R)"