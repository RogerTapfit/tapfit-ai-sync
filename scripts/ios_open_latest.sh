#!/usr/bin/env bash
set -euo pipefail

# Repo roots (adjust only if your layout differs)
REPO_ROOT="$(cd "$(dirname "$0")/.."; pwd)"
IOS_APP="$REPO_ROOT/ios/App/App"
PLIST="$IOS_APP/Info.plist"
PUBLIC_DIR="$IOS_APP/public"
CAPCFG=$(ls "$REPO_ROOT"/capacitor.config.* 2>/dev/null || true)

# 1) Read version from package.json
APP_VERSION=$(node -p "require('$REPO_ROOT/package.json').version" 2>/dev/null || true)
[ -n "${APP_VERSION:-}" ] || { echo "❌ Could not read package.json:version"; exit 1; }
echo "▶︎ Using package version: $APP_VERSION"

# 2) Sync Info.plist version + bump build number
/usr/libexec/PlistBuddy -c "Add :CFBundleShortVersionString string $APP_VERSION" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $APP_VERSION" "$PLIST"
BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$PLIST" 2>/dev/null || echo "0")
[[ "$BUILD" =~ ^[0-9]+$ ]] || BUILD=0
NEW_BUILD=$((BUILD+1))
/usr/libexec/PlistBuddy -c "Add :CFBundleVersion string $NEW_BUILD" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD" "$PLIST"
echo "▶︎ Plist set CFBundleShortVersionString=$APP_VERSION, CFBundleVersion=$NEW_BUILD"

# 3) Build fresh web + copy into iOS
echo "▶︎ Building web…"
pnpm build
echo "▶︎ Copying to iOS shell…"
rm -rf "$PUBLIC_DIR"/*
npx cap copy ios

# 4) Safety: forbid remote bundles in capacitor.config.*
if [ -n "$CAPCFG" ] && grep -RniE 'server[^a-zA-Z]*:[^{]*url' $CAPCFG >/dev/null 2>&1; then
  echo "❌ capacitor.config.* contains server.url (would load remote web). Remove/comment it for iOS."
  exit 1
fi

# 5) Hash check (dist vs embedded)
DIST_HASH=$(shasum "$REPO_ROOT/dist/index.html" | awk '{print $1}')
EMB_HASH=$(shasum "$PUBLIC_DIR/index.html" | awk '{print $1}')
if [ "$DIST_HASH" != "$EMB_HASH" ]; then
  echo "❌ Embedded web is stale. Run again."
  echo "   dist=$DIST_HASH  embedded=$EMB_HASH"
  exit 1
fi
echo "✅ Web embedded OK (hash match)"

# 6) Open Xcode
echo "▶︎ Opening Xcode…"
npx cap open ios || open "$IOS_APP.xcworkspace"
echo "✅ Done. Build in Xcode shows version $APP_VERSION ($NEW_BUILD)"