#!/usr/bin/env bash
set -euo pipefail

# Master script: Lovable Update → Xcode with Latest Code
REPO_ROOT="$(cd "$(dirname "$0")/.."; pwd)"
SYNC_SCRIPT="$REPO_ROOT/scripts/sync_from_lovable.sh"
IOS_APP="$REPO_ROOT/ios/App/App"

log() { echo "🚀 $*"; }
fail() { echo "❌ FAILED: $*" >&2; exit 1; }
success() { echo "✅ $*"; }

echo ""
echo "🎯 TapFit: Lovable → Xcode Workflow"
echo "======================================"
echo ""

# Check prerequisites
[ -f "$SYNC_SCRIPT" ] || fail "Missing sync_from_lovable.sh script"
[ -d "$IOS_APP" ] || fail "iOS project not found. Run 'npx cap add ios' first"

# Make sync script executable
chmod +x "$SYNC_SCRIPT"

log "Step 1: Syncing latest Lovable code from GitHub..."
echo ""

# Run the sync script
if ! bash "$SYNC_SCRIPT"; then
  fail "Sync from Lovable failed. Check the error above."
fi

echo ""
log "Step 2: Opening Xcode with fresh code..."

# Open Xcode (check for TapFit-1.2.7 first, then fallback to App)
IOS_DIR="$REPO_ROOT/ios/App"
if [ -f "$IOS_DIR/TapFit-1.2.7.xcworkspace" ]; then
  open "$IOS_DIR/TapFit-1.2.7.xcworkspace"
  success "Xcode opened with TapFit-1.2.7 workspace"
elif [ -f "$IOS_APP.xcworkspace" ]; then
  open "$IOS_APP.xcworkspace"
  success "Xcode opened with workspace"
elif command -v npx >/dev/null 2>&1; then
  npx cap open ios
  success "Xcode opened via Capacitor"
else
  fail "Cannot open Xcode. Install Capacitor CLI: npm install -g @capacitor/cli"
fi

echo ""
success "COMPLETE! Xcode now has your latest Lovable code."
echo ""
echo "📋 What happened:"
echo "  • Pulled latest changes from GitHub (where Lovable pushes)"
echo "  • Cleared all Xcode caches and build artifacts"
echo "  • Built fresh web bundle with your latest code"
echo "  • Embedded web bundle in iOS project"
echo "  • Validated everything matches"
echo "  • Opened Xcode ready for build/run"
echo ""
echo "🏗️  Next: Build and run in Xcode (⌘+R)"
echo ""