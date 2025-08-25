#!/usr/bin/env bash
set -euo pipefail

# Enhanced sync script that pulls latest Lovable changes from GitHub
REPO_ROOT="$(cd "$(dirname "$0")/.."; pwd)"
IOS_APP="$REPO_ROOT/ios/App/App"
PLIST="$IOS_APP/Info.plist"
PUBLIC_DIR="$IOS_APP/public"

log() { echo "▶︎ $*"; }
fail() { echo "❌ $*" >&2; exit 1; }
success() { echo "✅ $*"; }

log "TapFit Lovable → Xcode Sync Starting..."

# 1) Check for uncommitted changes
if [ -d ".git" ]; then
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    fail "You have uncommitted changes. Please commit or stash them first."
  fi
  log "Git status clean"
fi

# 2) Pull latest from GitHub (where Lovable pushes)
if [ -d ".git" ]; then
  log "Pulling latest changes from GitHub..."
  git fetch origin
  BEHIND=$(git rev-list HEAD..origin/$(git branch --show-current) --count 2>/dev/null || echo "0")
  if [ "$BEHIND" -gt 0 ]; then
    log "Pulling $BEHIND new commits from Lovable..."
    git pull origin $(git branch --show-current)
    success "Pulled latest Lovable changes"
  else
    log "Already up to date with Lovable"
  fi
fi

# 3) Install/update dependencies if needed
if [ -f "package.json" ]; then
  log "Checking dependencies..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install
  else
    npm install
  fi
fi

# 4) Clear all caches aggressively
log "Clearing Xcode and build caches..."

# Clear Xcode DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>/dev/null || true

# Clear iOS Simulator data
xcrun simctl shutdown all 2>/dev/null || true
xcrun simctl erase all 2>/dev/null || true

# Clear Capacitor cache
rm -rf ~/.capacitor 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Clear local build artifacts
rm -rf dist 2>/dev/null || true
rm -rf "$PUBLIC_DIR"/* 2>/dev/null || true

success "Caches cleared"

# 5) Get and sync version
APP_VERSION=$(node -p "require('$REPO_ROOT/package.json').version" 2>/dev/null || echo "1.0.0")
log "Syncing version: $APP_VERSION"

# Update Info.plist version + increment build
if [ -f "$PLIST" ]; then
  /usr/libexec/PlistBuddy -c "Add :CFBundleShortVersionString string $APP_VERSION" "$PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $APP_VERSION" "$PLIST"
  
  BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$PLIST" 2>/dev/null || echo "0")
  [[ "$BUILD" =~ ^[0-9]+$ ]] || BUILD=0
  NEW_BUILD=$((BUILD+1))
  /usr/libexec/PlistBuddy -c "Add :CFBundleVersion string $NEW_BUILD" "$PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD" "$PLIST"
  
  success "Version synced: $APP_VERSION ($NEW_BUILD)"
fi

# 6) Build fresh web bundle
log "Building fresh web bundle with latest Lovable code..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm build
else
  npm run build
fi

# 7) Copy fresh web to iOS
log "Embedding fresh web bundle in iOS..."
npx cap copy ios

# 8) Validate everything matches
if [ -f "$REPO_ROOT/dist/index.html" ] && [ -f "$PUBLIC_DIR/index.html" ]; then
  DIST_HASH=$(shasum "$REPO_ROOT/dist/index.html" | awk '{print $1}')
  EMB_HASH=$(shasum "$PUBLIC_DIR/index.html" | awk '{print $1}')
  
  if [ "$DIST_HASH" != "$EMB_HASH" ]; then
    fail "Hash mismatch! dist=$DIST_HASH embedded=$EMB_HASH"
  fi
  
  success "Web bundle embedded and validated (hash: ${DIST_HASH:0:8})"
fi

# 9) Final safety check - no remote server URL
CAPCFG=$(ls "$REPO_ROOT"/capacitor.config.* 2>/dev/null || true)
if [ -n "$CAPCFG" ] && grep -RniE 'server[^a-zA-Z]*:[^{]*url' $CAPCFG >/dev/null 2>&1; then
  fail "capacitor.config contains server.url - this would load remote web instead of embedded"
fi

success "Sync complete! Ready for Xcode with latest Lovable code."
success "Web hash: ${DIST_HASH:0:8} | Version: $APP_VERSION ($NEW_BUILD)"