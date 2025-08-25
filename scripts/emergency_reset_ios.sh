#!/usr/bin/env bash
set -euo pipefail

# Emergency reset for corrupted iOS project state
REPO_ROOT="$(cd "$(dirname "$0")/.."; pwd)"

echo "🚨 Emergency iOS Reset - Use only if normal workflow fails"
echo "======================================================"
echo ""

read -p "⚠️  This will destroy your iOS project and rebuild it. Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 1
fi

echo "🧹 Clearing everything..."

# Nuclear option - remove all build artifacts
rm -rf ios
rm -rf dist
rm -rf node_modules/.cache
rm -rf ~/.capacitor
rm -rf ~/Library/Developer/Xcode/DerivedData/*

echo "📦 Reinstalling dependencies..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm install
else
  npm install
fi

echo "🔧 Rebuilding iOS project..."
pnpm build
npx cap add ios
npx cap sync ios

echo ""
echo "✅ Emergency reset complete!"
echo "Now run: bash scripts/update_and_open_xcode.sh"