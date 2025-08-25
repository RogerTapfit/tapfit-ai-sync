#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.."; pwd)"
IOS_APP="$REPO_ROOT/ios/App/App"
PLIST="$IOS_APP/Info.plist"
ENT="$IOS_APP/App.entitlements"
PUBLIC_DIR="$IOS_APP/public"
CAPCFG=$(ls "$REPO_ROOT"/capacitor.config.* 2>/dev/null || true)

fail(){ echo "❌ PRECHECK FAIL: $*" >&2; exit 1; }
note(){ echo "▶︎ $*"; }

note "TapFit iOS Preflight…"

# Essentials exist
[ -f "$PLIST" ] || fail "Missing Info.plist"
[ -f "$ENT" ]   || fail "Missing App.entitlements"

# Version sync
PKG_VER=$(node -p "require('$REPO_ROOT/package.json').version" 2>/dev/null || echo "")
[ -n "$PKG_VER" ] || fail "Cannot read package.json:version"
PLIST_VER=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$PLIST" 2>/dev/null || echo "")
[ "$PLIST_VER" = "$PKG_VER" ] || fail "Plist CFBundleShortVersionString='$PLIST_VER' != package.json version '$PKG_VER'"

# Associated Domains
DOMAINS=$(/usr/libexec/PlistBuddy -c "Print :com.apple.developer.associated-domains" "$ENT" 2>/dev/null || echo "")
echo "$DOMAINS" | grep -q "applinks:tapfit-ai-sync.lovable.app" || fail "Missing applinks:tapfit-ai-sync.lovable.app in entitlements"

# Required plist keys
for KEY in NSBluetoothAlwaysUsageDescription NFCReaderUsageDescription; do
  /usr/libexec/PlistBuddy -c "Print :$KEY" "$PLIST" >/dev/null 2>&1 || fail "Missing $KEY"
done
BG=$(/usr/libexec/PlistBuddy -c "Print :UIBackgroundModes" "$PLIST" 2>/dev/null || echo "")
echo "$BG" | grep -q 'bluetooth-central' || fail "UIBackgroundModes missing bluetooth-central"

# Web embedded and in sync
[ -f "$REPO_ROOT/dist/index.html" ] || fail "No dist/index.html (run pnpm build)"
[ -f "$PUBLIC_DIR/index.html" ] || fail "No embedded index.html (run npx cap copy ios)"
D=$(shasum "$REPO_ROOT/dist/index.html" | awk '{print $1}')
E=$(shasum "$PUBLIC_DIR/index.html" | awk '{print $1}')
[ "$D" = "$E" ] || fail "Embedded web is stale (dist hash != embedded hash)"

# No server.url in capacitor config
if [ -n "$CAPCFG" ] && grep -RniE 'server[^a-zA-Z]*:[^{]*url' $CAPCFG >/dev/null 2>&1; then
  fail "capacitor.config.* contains server.url (would load remote bundle)"
fi

echo "✅ PRECHECK PASS: version=$PKG_VER, domains/plist/embedded OK"