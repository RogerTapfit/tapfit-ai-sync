#!/bin/bash

set -e  # Exit on any error

echo "🚀 Advanced Xcode Project Launcher for Latest Version"
echo "====================================================="

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if Xcode is installed and get version
check_xcode() {
    print_status "Checking Xcode installation..."
    
    if ! command -v xcodebuild &> /dev/null; then
        print_error "Xcode is not installed or not in PATH"
        exit 1
    fi
    
    XCODE_VERSION=$(xcodebuild -version | head -n 1 | cut -d ' ' -f 2)
    print_success "Found Xcode $XCODE_VERSION"
    
    # Check if Xcode version is 15.0 or later
    if [[ "$(printf '%s\n' "15.0" "$XCODE_VERSION" | sort -V | head -n1)" != "15.0" ]]; then
        print_warning "Xcode version $XCODE_VERSION detected. For best compatibility, use Xcode 15.0+"
    fi
}

# Update dependencies to latest versions
update_dependencies() {
    print_status "Updating Capacitor dependencies to latest versions..."
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Update Capacitor packages
    npm update @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
    print_success "Dependencies updated"
}

# Kill all Xcode processes safely
kill_xcode_processes() {
    print_status "Terminating existing Xcode processes..."
    
    # Kill Xcode processes gracefully first
    pkill -f "Xcode" 2>/dev/null || true
    pkill -f "xcodebuild" 2>/dev/null || true
    pkill -f "xcrun" 2>/dev/null || true
    sleep 2
    
    # Force kill if still running
    pkill -9 -f "Xcode" 2>/dev/null || true
    pkill -9 -f "xcodebuild" 2>/dev/null || true
    pkill -9 -f "xcrun" 2>/dev/null || true
    sleep 1
    
    print_success "Xcode processes terminated"
}

# Clear Xcode caches and derived data
clear_xcode_caches() {
    print_status "Clearing Xcode caches and derived data..."
    
    # Clear derived data
    if [ -d ~/Library/Developer/Xcode/DerivedData ]; then
        rm -rf ~/Library/Developer/Xcode/DerivedData/*
        print_success "Cleared derived data"
    fi
    
    # Clear Xcode caches
    rm -rf ~/Library/Caches/com.apple.dt.Xcode* 2>/dev/null || true
    rm -rf ~/Library/Saved\ Application\ State/com.apple.dt.Xcode* 2>/dev/null || true
    
    # Clear module cache
    rm -rf ~/Library/Developer/Xcode/DerivedData/ModuleCache.noindex/* 2>/dev/null || true
    
    print_success "Caches cleared"
}

# Build and sync the project
build_and_sync() {
    print_status "Building and syncing iOS project..."
    
    # Build the web app
    if ! npm run build; then
        print_error "Failed to build the web app"
        exit 1
    fi
    
    # Ensure iOS platform exists
    if [ ! -d "ios" ]; then
        print_status "Adding iOS platform..."
        npx cap add ios
    fi
    
    # Sync with iOS
    if ! npx cap sync ios; then
        print_error "Failed to sync with iOS platform"
        exit 1
    fi
    
    # Update iOS platform
    npx cap update ios
    
    print_success "Project built and synced"
}

# Validate iOS project structure
validate_project() {
    print_status "Validating iOS project structure..."
    
    if [ ! -d "ios/App" ]; then
        print_error "iOS App directory not found. Please run 'npx cap add ios' first."
        exit 1
    fi
    
    # Find the workspace or project file
    if [ -f "ios/App/App.xcworkspace" ]; then
        PROJECT_FILE="ios/App/App.xcworkspace"
        PROJECT_TYPE="workspace"
    elif [ -f "ios/App/App.xcodeproj" ]; then
        PROJECT_FILE="ios/App/App.xcodeproj"
        PROJECT_TYPE="project"
    else
        print_error "No Xcode project or workspace found in ios/App/"
        exit 1
    fi
    
    print_success "Found Xcode $PROJECT_TYPE: $PROJECT_FILE"
}

# Force open Xcode with multiple fallback methods
open_xcode() {
    print_status "Force opening Xcode with multiple methods..."
    
    # Check if Xcode exists
    if [ ! -d "/Applications/Xcode.app" ]; then
        print_error "Xcode not found in /Applications/Xcode.app"
        exit 1
    fi
    
    print_status "Found Xcode, attempting to open $PROJECT_FILE"
    
    # Method 1: Direct executable launch
    print_status "Method 1: Direct Xcode executable..."
    /Applications/Xcode.app/Contents/MacOS/Xcode "$PROJECT_FILE" &
    sleep 3
    
    # Method 2: Using open command
    print_status "Method 2: Using macOS open command..."
    open -a Xcode "$PROJECT_FILE"
    sleep 3
    
    # Method 3: Using xed command
    print_status "Method 3: Using xed command..."
    xed "$PROJECT_FILE" 2>/dev/null || true
    sleep 3
    
    # Method 4: Force activate Xcode
    print_status "Method 4: Force activating Xcode..."
    osascript -e 'tell application "Xcode" to activate' 2>/dev/null || true
    sleep 2
    
    # Method 5: System Events force
    print_status "Method 5: Using System Events to force Xcode visible..."
    osascript << 'EOF'
tell application "System Events"
    try
        set xcodeProcess to first process whose name is "Xcode"
        set frontmost of xcodeProcess to true
        set visible of xcodeProcess to true
    end try
end tell
EOF
    
    sleep 2
    
    # Final verification and window management
    print_status "Verifying Xcode is running and visible..."
    osascript << 'EOF'
tell application "Xcode"
    try
        activate
        delay 2
        
        -- Make sure a window is visible
        if (count of windows) is 0 then
            tell application "System Events"
                tell process "Xcode"
                    keystroke "o" using {command down, shift down}
                end tell
            end tell
        end if
        
        -- Bring all windows to front
        set index of every window to 1
        
    end try
end tell
EOF
    
    # Check if Xcode is actually running
    if pgrep -x "Xcode" > /dev/null; then
        print_success "✅ Xcode is now running!"
        print_status "If you can't see Xcode, try Command+Tab or check your Mission Control"
    else
        print_error "❌ Failed to launch Xcode. Try running manually:"
        echo "open -a Xcode '$PROJECT_FILE'"
    fi
}

# Setup development optimizations
setup_dev_optimizations() {
    print_status "Setting up development optimizations..."
    
    # Create .xcode.env file for Xcode environment variables
    cat > ios/.xcode.env << EOF
# Xcode Environment Configuration
export NODE_BINARY=\$(command -v node)
export NODE_OPTIONS="--max-old-space-size=8192"
export CAPACITOR_BUILD_OPTIMIZE=true
EOF
    
    print_success "Development optimizations configured"
}

# Update to latest version v1.2.5
update_to_latest_version() {
    print_status "Updating to TapFit v1.2.5..."
    
    if [ -f "scripts/update-version.js" ]; then
        node scripts/update-version.js 1.2.5
        print_success "Updated to v1.2.5"
    else
        print_warning "Version update script not found, continuing with current version"
    fi
}

# Main execution
main() {
    echo
    print_status "Starting TapFit v1.2.5 Xcode Force Launch..."
    echo
    
    # Run all steps
    check_xcode
    update_to_latest_version
    update_dependencies
    kill_xcode_processes
    clear_xcode_caches
    build_and_sync
    validate_project
    setup_dev_optimizations
    open_xcode
    
    echo
    print_success "🎉 Xcode project is ready for development!"
    echo
    print_status "Next steps:"
    echo "  1. Wait for Xcode to finish indexing"
    echo "  2. Select your development team in project settings"
    echo "  3. Choose a simulator or connected device"
    echo "  4. Build and run your app (Cmd+R)"
    echo
    print_warning "If Xcode is not visible, try Command+Tab or check Activity Monitor"
    echo
}

# Run main function
main "$@"