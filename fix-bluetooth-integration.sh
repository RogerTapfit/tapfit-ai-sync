#!/bin/bash
# Comprehensive iOS Project Setup with Bluetooth LE and Watch App Integration

echo "🚀 COMPREHENSIVE IOS PROJECT SETUP"
echo "=================================="
echo "Setting up iOS project with Bluetooth LE and Apple Watch integration..."
echo ""

# Step 1: Clean and prepare environment
echo "🧹 Step 1: Cleaning previous builds..."
rm -rf ios/App/build ios/App/DerivedData 2>/dev/null || true
echo "✅ Build environment cleaned"

# Step 2: Build web assets first
echo "📦 Step 2: Building web assets..."
npm run build
echo "✅ Web assets built"

# Step 3: Generate/update iOS project
echo "📱 Step 3: Generating iOS project..."
npx cap add ios 2>/dev/null || echo "iOS platform already exists"
npx cap sync ios
echo "✅ iOS project generated and synced"

# Step 4: Verify Bluetooth LE plugin
echo "🔍 Step 4: Verifying Bluetooth LE plugin..."
if npm list @capacitor-community/bluetooth-le > /dev/null 2>&1; then
    echo "✅ Bluetooth LE plugin verified"
else
    echo "❌ Bluetooth LE plugin missing - installing..."
    npm install @capacitor-community/bluetooth-le@latest
    npx cap sync ios
fi

# Step 5: Create Watch App directory structure
echo "⌚ Step 5: Preparing Watch App files..."
mkdir -p ios/App/TapFitWatch/TapFitWatch\ Watch\ App
mkdir -p ios/App/TapFitWatch/TapFitWatch\ Watch\ App\ Extension

# Copy Watch App files to iOS project
if [ -d "watch/TapFitWatch" ]; then
    echo "📋 Copying Watch App files..."
    cp -r watch/TapFitWatch/* ios/App/TapFitWatch/ 2>/dev/null || true
    echo "✅ Watch App files prepared"
else
    echo "⚠️  Watch App source files not found - will create in Xcode"
fi

echo ""
echo "🎉 SETUP COMPLETE!"
echo "================="
echo ""
echo "📋 NEXT STEPS:"
echo "1. Open Xcode project:"
echo "   npx cap open ios"
echo ""
echo "2. In Xcode, add Watch App target:"
echo "   • File → New → Target → watchOS → Watch App"
echo "   • Name: TapFitWatch"
echo "   • Bundle ID: app.lovable.4e37f3a98b5244369842e2cc950a194e.watchapp"
echo ""
echo "3. Copy Swift files to appropriate targets:"
echo "   • WatchHealthController.swift → Watch App Extension"
echo "   • ContentView.swift → Watch App"
echo "   • TapfitWatchApp.swift → Watch App"
echo ""
echo "4. Configure capabilities:"
echo "   • Main app: Bluetooth LE background modes"
echo "   • Watch app: HealthKit entitlement"
echo ""
echo "5. Build and deploy:"
echo "   • Clean: Product → Clean Build Folder"
echo "   • Build main app first, then Watch app"
echo "   • Deploy to physical device with paired Apple Watch"
echo ""
echo "🔧 TROUBLESHOOTING:"
echo "• Ensure iOS deployment target is 15.0+"
echo "• Verify code signing for both targets"
echo "• Check that Apple Watch is paired and trusted"
echo ""
echo "================="