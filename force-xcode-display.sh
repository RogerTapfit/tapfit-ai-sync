#!/bin/bash

echo "🔧 Force Opening Xcode with Proper Display"
echo "=========================================="

# Step 1: Kill all Xcode processes
echo "🛑 Killing all Xcode processes..."
sudo pkill -9 -f Xcode
sudo pkill -9 -f xcodebuild
sleep 2

# Step 2: Clear Xcode caches and window state
echo "🗑️ Clearing Xcode caches..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Caches/com.apple.dt.Xcode*
rm -rf ~/Library/Saved\ Application\ State/com.apple.dt.Xcode*
sleep 1

# Step 3: Ensure iOS project is properly synced
echo "📱 Syncing iOS project..."
npm run build
npx cap sync ios

# Step 4: Force open Xcode with explicit window management
echo "🚀 Opening Xcode with forced display..."
/Applications/Xcode.app/Contents/MacOS/Xcode ios/App/App.xcworkspace &

# Wait for Xcode to start
sleep 5

# Force Xcode to front with AppleScript
osascript -e '
tell application "System Events"
    set frontmost of every process whose name is "Xcode" to true
end tell
tell application "Xcode"
    activate
    delay 2
    tell application "System Events"
        keystroke "1" using {command down}
    end tell
end tell
'

echo "✅ Xcode should now be visible!"
echo "If still not visible, try Command+Tab to find Xcode"