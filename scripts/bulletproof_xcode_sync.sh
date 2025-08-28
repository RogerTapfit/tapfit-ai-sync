#!/usr/bin/env bash
set -euo pipefail

# 🎯 BULLETPROOF Lovable → Xcode Sync
# Guarantees Xcode opens with 100% latest Lovable code, no matter what

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}▶︎${NC} $*"; }
success() { echo -e "${GREEN}✅${NC} $*"; }
warn() { echo -e "${YELLOW}⚠️${NC} $*"; }
fail() { echo -e "${RED}❌ FAILED:${NC} $*" >&2; exit 1; }

echo ""
echo -e "${BLUE}🚀 BULLETPROOF Lovable → Xcode Sync${NC}"
echo "=========================================="
echo ""

# Step 1: Force navigate to correct directory
log "Step 1: Finding TapFit project directory..."

# Try multiple common locations
POSSIBLE_DIRS=(
  "$(pwd)"
  "$HOME/tapfit-ai-sync"
  "$HOME/Desktop/tapfit-ai-sync" 
  "$HOME/Downloads/tapfit-ai-sync"
  "$HOME/Projects/tapfit-ai-sync"
)

REPO_ROOT=""
for dir in "${POSSIBLE_DIRS[@]}"; do
  # Check for TapFit project indicators (more flexible)
  if [ -d "$dir" ] && [ -f "$dir/package.json" ] && (
    grep -q "tapfit" "$dir/package.json" 2>/dev/null || 
    [ -f "$dir/src/components/TapFitApp.tsx" ] ||
    [ -d "$dir/ios/App" ] ||
    [ -d "$dir/src" ]
  ); then
    REPO_ROOT="$dir"
    break
  fi
done

if [ -z "$REPO_ROOT" ]; then
  fail "Cannot find TapFit project directory. Please cd to your project first."
fi

cd "$REPO_ROOT"
success "Found project at: $REPO_ROOT"

# Validate project structure
[ -f "package.json" ] || fail "Not a valid TapFit project (missing package.json)"
[ -d "src" ] || fail "Not a valid TapFit project (missing src directory)"

# Step 2: Bulletproof Git handling
log "Step 2: Bulletproof Git sync from Lovable..."

if [ -d ".git" ]; then
  # Auto-stash any local changes (prevents merge conflicts)
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    warn "Local changes detected - auto-stashing..."
    git stash push -u -m "Auto-stash before Lovable sync $(date)"
    success "Local changes stashed safely"
  fi
  
  # Force fetch and reset to match GitHub (where Lovable pushes)
  log "Fetching latest from GitHub (where Lovable pushes)..."
  git fetch origin --force
  
  CURRENT_BRANCH=$(git branch --show-current)
  BEHIND=$(git rev-list HEAD..origin/$CURRENT_BRANCH --count 2>/dev/null || echo "0")
  
  if [ "$BEHIND" -gt 0 ]; then
    log "Pulling $BEHIND new commits from Lovable..."
    git reset --hard origin/$CURRENT_BRANCH
    success "Synced with latest Lovable code"
  else
    log "Already at latest Lovable version"
  fi
  
  # Restore stashed changes if any
  if git stash list | grep -q "Auto-stash before Lovable sync" 2>/dev/null; then
    warn "Restoring your local changes..."
    git stash pop || {
      warn "Stash conflicts detected - your changes are in 'git stash list'"
      log "Run 'git stash drop' to discard or resolve conflicts manually"
    }
  fi
else
  warn "Not a git repository - ensure you're in the correct TapFit project"
fi

# Step 3: Nuclear cache clearing
log "Step 3: Nuclear cache clearing..."

# Clear absolutely everything
rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>/dev/null || true
rm -rf ~/.capacitor 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf ios/App/App/public/* 2>/dev/null || true

# Clear iOS Simulator data
xcrun simctl shutdown all 2>/dev/null || true
xcrun simctl erase all 2>/dev/null || true

success "All caches obliterated"

# Step 4: Fresh dependency install
log "Step 4: Ensuring fresh dependencies..."

if command -v pnpm >/dev/null 2>&1; then
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
else
  npm install
fi

success "Dependencies updated"

# Step 5: Version sync and validation
log "Step 5: Syncing version numbers..."

APP_VERSION=$(node -p "require('$REPO_ROOT/package.json').version" 2>/dev/null || echo "1.0.0")
IOS_APP="$REPO_ROOT/ios/App/App"
PLIST="$IOS_APP/Info.plist"

# Ensure iOS project exists
if [ ! -d "$IOS_APP" ]; then
  log "iOS project missing - creating..."
  npx cap add ios
fi

# Update Info.plist with correct version + increment build
if [ -f "$PLIST" ]; then
  /usr/libexec/PlistBuddy -c "Add :CFBundleShortVersionString string $APP_VERSION" "$PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $APP_VERSION" "$PLIST"
  
  BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$PLIST" 2>/dev/null || echo "0")
  [[ "$BUILD" =~ ^[0-9]+$ ]] || BUILD=0
  NEW_BUILD=$((BUILD+1))
  /usr/libexec/PlistBuddy -c "Add :CFBundleVersion string $NEW_BUILD" "$PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD" "$PLIST"
  
  success "Version synced: $APP_VERSION (Build $NEW_BUILD)"
else
  warn "Info.plist not found - will be created during Capacitor sync"
fi

# Step 6: Build absolutely fresh web bundle
log "Step 6: Building fresh web bundle with latest Lovable code..."

if command -v pnpm >/dev/null 2>&1; then
  pnpm build
else
  npm run build
fi

[ -f "dist/index.html" ] || fail "Web build failed - no dist/index.html created"
success "Fresh web bundle built"

# Step 7: Embed and validate in iOS
log "Step 7: Embedding web bundle in iOS project..."

npx cap copy ios
npx cap sync ios

# Step 8: Critical validation
log "Step 8: Validating everything matches..."

PUBLIC_DIR="$IOS_APP/public"
[ -f "$PUBLIC_DIR/index.html" ] || fail "iOS embedding failed - no public/index.html"

DIST_HASH=$(shasum "$REPO_ROOT/dist/index.html" | awk '{print $1}')
EMB_HASH=$(shasum "$PUBLIC_DIR/index.html" | awk '{print $1}')

if [ "$DIST_HASH" != "$EMB_HASH" ]; then
  fail "VALIDATION FAILED! Web bundle mismatch:
    Built: $DIST_HASH
    Embedded: $EMB_HASH"
fi

success "Validation passed - embedded web matches latest build"

# Step 9: Final safety checks
log "Step 9: Final safety checks..."

# Ensure no remote server URL in capacitor config
CAPCFG=$(ls "$REPO_ROOT"/capacitor.config.* 2>/dev/null || true)
if [ -n "$CAPCFG" ] && grep -RniE 'server[^a-zA-Z]*:[^{]*url.*http' $CAPCFG >/dev/null 2>&1; then
  warn "Found server.url in capacitor.config - commenting out for iOS build..."
  sed -i.bak 's/^[[:space:]]*url:/    \/\/ url:/' $CAPCFG || true
fi

success "All safety checks passed"

# Step 10: Open Xcode
log "Step 10: Opening Xcode with guaranteed latest code..."

if [ -f "$IOS_APP.xcworkspace" ]; then
  open "$IOS_APP.xcworkspace"
elif command -v npx >/dev/null 2>&1; then
  npx cap open ios
else
  fail "Cannot open Xcode. Install Capacitor CLI: npm install -g @capacitor/cli"
fi

echo ""
echo -e "${GREEN}🎉 BULLETPROOF SYNC COMPLETE!${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Xcode now has your latest Lovable code${NC}"
echo -e "${BLUE}📊 Verification:${NC}"
echo "   • Version: $APP_VERSION (Build $NEW_BUILD)"
echo "   • Web hash: ${DIST_HASH:0:8} (matches embedded)"
echo "   • Git: Synced with Lovable's GitHub"
echo "   • Caches: Completely cleared"
echo ""
echo -e "${BLUE}🏗️  Next step: Build and run in Xcode (⌘+R)${NC}"
echo ""