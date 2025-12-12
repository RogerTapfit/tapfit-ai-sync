#!/bin/bash
# iOS Post-Sync Script
# Copies entitlements and configures iOS project after cap sync

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
IOS_APP_DIR="$REPO_ROOT/ios/App/App"

echo "🔧 TapFit iOS Post-Sync Configuration"
echo "======================================"

# Check if ios folder exists
if [ ! -d "$REPO_ROOT/ios" ]; then
    echo "❌ iOS folder not found. Run 'npx cap add ios' first."
    exit 1
fi

# Copy App.entitlements
echo "📋 Copying App.entitlements..."
if [ -f "$REPO_ROOT/ios-config/App.entitlements" ]; then
    cp "$REPO_ROOT/ios-config/App.entitlements" "$IOS_APP_DIR/App.entitlements"
    echo "✅ App.entitlements copied successfully"
else
    echo "❌ ios-config/App.entitlements not found!"
    exit 1
fi

# Update Info.plist with correct bundle identifier
echo "📝 Updating Info.plist..."
PLIST_PATH="$IOS_APP_DIR/Info.plist"

if [ -f "$PLIST_PATH" ]; then
    # Add NSCameraUsageDescription if not present
    if ! /usr/libexec/PlistBuddy -c "Print :NSCameraUsageDescription" "$PLIST_PATH" 2>/dev/null; then
        /usr/libexec/PlistBuddy -c "Add :NSCameraUsageDescription string 'TapFit uses the camera to scan gym machines, track exercises with AI pose detection, and analyze food photos.'" "$PLIST_PATH"
        echo "  ✅ Added NSCameraUsageDescription"
    fi
    
    # Add NSMicrophoneUsageDescription if not present
    if ! /usr/libexec/PlistBuddy -c "Print :NSMicrophoneUsageDescription" "$PLIST_PATH" 2>/dev/null; then
        /usr/libexec/PlistBuddy -c "Add :NSMicrophoneUsageDescription string 'TapFit uses the microphone for voice commands with your AI fitness coach.'" "$PLIST_PATH"
        echo "  ✅ Added NSMicrophoneUsageDescription"
    fi
    
    # Add NSLocationWhenInUseUsageDescription if not present
    if ! /usr/libexec/PlistBuddy -c "Print :NSLocationWhenInUseUsageDescription" "$PLIST_PATH" 2>/dev/null; then
        /usr/libexec/PlistBuddy -c "Add :NSLocationWhenInUseUsageDescription string 'TapFit uses your location to track your runs with GPS and find nearby gyms.'" "$PLIST_PATH"
        echo "  ✅ Added NSLocationWhenInUseUsageDescription"
    fi
    
    # Add NSLocationAlwaysAndWhenInUseUsageDescription if not present
    if ! /usr/libexec/PlistBuddy -c "Print :NSLocationAlwaysAndWhenInUseUsageDescription" "$PLIST_PATH" 2>/dev/null; then
        /usr/libexec/PlistBuddy -c "Add :NSLocationAlwaysAndWhenInUseUsageDescription string 'TapFit needs continuous access to your location to accurately track your runs with GPS, even when the app is in the background.'" "$PLIST_PATH"
        echo "  ✅ Added NSLocationAlwaysAndWhenInUseUsageDescription"
    fi
    
    # Add NSBluetoothAlwaysUsageDescription if not present
    if ! /usr/libexec/PlistBuddy -c "Print :NSBluetoothAlwaysUsageDescription" "$PLIST_PATH" 2>/dev/null; then
        /usr/libexec/PlistBuddy -c "Add :NSBluetoothAlwaysUsageDescription string 'TapFit uses Bluetooth to connect to your gym machine sensor and heart rate monitors.'" "$PLIST_PATH"
        echo "  ✅ Added NSBluetoothAlwaysUsageDescription"
    fi
    
    # Add NFCReaderUsageDescription if not present
    if ! /usr/libexec/PlistBuddy -c "Print :NFCReaderUsageDescription" "$PLIST_PATH" 2>/dev/null; then
        /usr/libexec/PlistBuddy -c "Add :NFCReaderUsageDescription string 'TapFit uses NFC to detect and connect to compatible workout stations.'" "$PLIST_PATH"
        echo "  ✅ Added NFCReaderUsageDescription"
    fi
    
    # Add NSHealthShareUsageDescription if not present
    if ! /usr/libexec/PlistBuddy -c "Print :NSHealthShareUsageDescription" "$PLIST_PATH" 2>/dev/null; then
        /usr/libexec/PlistBuddy -c "Add :NSHealthShareUsageDescription string 'TapFit reads your health data to provide personalized fitness insights and track your workouts.'" "$PLIST_PATH"
        echo "  ✅ Added NSHealthShareUsageDescription"
    fi
    
    # Add NSHealthUpdateUsageDescription if not present
    if ! /usr/libexec/PlistBuddy -c "Print :NSHealthUpdateUsageDescription" "$PLIST_PATH" 2>/dev/null; then
        /usr/libexec/PlistBuddy -c "Add :NSHealthUpdateUsageDescription string 'TapFit saves your workout data to Apple Health to keep all your fitness data in sync.'" "$PLIST_PATH"
        echo "  ✅ Added NSHealthUpdateUsageDescription"
    fi
    
    # Add or update UIBackgroundModes
    if ! /usr/libexec/PlistBuddy -c "Print :UIBackgroundModes" "$PLIST_PATH" 2>/dev/null; then
        /usr/libexec/PlistBuddy -c "Add :UIBackgroundModes array" "$PLIST_PATH"
    fi
    
    # Ensure all required background modes are present
    MODES=("bluetooth-central" "location" "fetch" "processing" "remote-notification")
    for MODE in "${MODES[@]}"; do
        if ! /usr/libexec/PlistBuddy -c "Print :UIBackgroundModes" "$PLIST_PATH" 2>/dev/null | grep -q "$MODE"; then
            /usr/libexec/PlistBuddy -c "Add :UIBackgroundModes: string '$MODE'" "$PLIST_PATH" 2>/dev/null || true
        fi
    done
    echo "  ✅ Configured UIBackgroundModes (bluetooth-central, location, fetch, processing, remote-notification)"
    
    # Add NSLocationAlwaysUsageDescription if not present (required for background GPS)
    if ! /usr/libexec/PlistBuddy -c "Print :NSLocationAlwaysUsageDescription" "$PLIST_PATH" 2>/dev/null; then
        /usr/libexec/PlistBuddy -c "Add :NSLocationAlwaysUsageDescription string 'TapFit needs continuous access to your location to accurately track your runs with GPS, even when the app is in the background.'" "$PLIST_PATH"
        echo "  ✅ Added NSLocationAlwaysUsageDescription"
    fi
    
    echo "✅ Info.plist updated successfully"
else
    echo "⚠️  Info.plist not found at expected path"
fi

echo ""
echo "🎉 iOS Post-Sync Complete!"
echo ""
echo "📋 Next Steps in Xcode:"
echo "   1. Open ios/App/App.xcworkspace"
echo "   2. Select 'App' target → Signing & Capabilities"
echo "   3. Set Bundle Identifier to: com.rogertapfit.tapfit"
echo "   4. Select your Team"
echo "   5. Add entitlements file:"
echo "      - Build Settings → Code Signing Entitlements"
echo "      - Set to: App/App.entitlements"
echo "   6. Press ⌘+R to build and run"
echo ""
