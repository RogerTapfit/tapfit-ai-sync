#!/bin/bash
# Complete reset to fix all iOS and dependency issues

echo "🚨 COMPLETE RESET - This will fix all iOS and dependency issues"
echo "=================================================="

# Step 1: Complete clean slate
echo "🧹 Step 1: Complete clean slate..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf ios
rm -rf android
rm -rf dist
rm -rf ~/.capacitor 2>/dev/null || true

# Clear npm cache
npm cache clean --force

# Remove Capacitor platforms
npx cap remove ios 2>/dev/null || true
npx cap remove android 2>/dev/null || true

echo "✅ Clean slate complete"

# Step 2: Fix dependency conflicts
echo "🔧 Step 2: Installing dependencies with conflict resolution..."
npm install --force

echo "✅ Dependencies installed"

# Step 3: Build the project
echo "🏗️ Step 3: Building project..."
npm run build

echo "✅ Build complete"

# Step 4: Fresh iOS setup
echo "📱 Step 4: Setting up iOS platform..."
npx cap add ios
npx cap sync ios

echo "✅ iOS platform setup complete"

echo ""
echo "🎉 RESET COMPLETE! Next steps:"
echo "=================================================="
echo "Option 1 (Recommended): Use Xcode directly"
echo "  npx cap open ios"
echo "  Then build and run from Xcode"
echo ""
echo "Option 2: Try Capacitor CLI (may still have issues)"
echo "  npx cap run ios"
echo ""
echo "Option 3: Continue development in browser"
echo "  npm run dev"
echo "=================================================="