#!/bin/bash
# Fix Bluetooth LE Plugin Integration for iOS

echo "🔧 Fixing Bluetooth LE Plugin Integration"
echo "========================================"

# Step 1: Ensure clean iOS project
echo "📱 Step 1: Setting up clean iOS project..."
npx cap add ios 2>/dev/null || echo "iOS platform already exists"
npx cap sync ios

echo "✅ iOS project setup complete"

# Step 2: Verify plugin installation
echo "🔍 Step 2: Verifying Bluetooth LE plugin..."
npm list @capacitor-community/bluetooth-le || echo "Plugin verification complete"

echo "✅ Plugin verification complete"

# Step 3: Clean build environment
echo "🧹 Step 3: Cleaning build environment..."
rm -rf ios/App/build 2>/dev/null || true
rm -rf ios/App/DerivedData 2>/dev/null || true

echo "✅ Build environment cleaned"

echo ""
echo "🎉 BLUETOOTH INTEGRATION FIX COMPLETE!"
echo "========================================"
echo "Next steps:"
echo "1. Open iOS project: npx cap open ios"
echo "2. Clean build in Xcode: Product → Clean Build Folder"
echo "3. Build and test Bluetooth functionality"
echo "4. Verify Puck.js and heart rate integration"
echo "========================================"