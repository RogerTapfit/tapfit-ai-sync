#!/bin/bash
# Reset iOS build completely to fix scheme issues

echo "🧹 Clearing all iOS build artifacts..."

# Remove iOS platform if it exists
npx cap remove ios 2>/dev/null || true

# Remove all build directories
rm -rf dist
rm -rf ios
rm -rf android

# Clear npm cache
npm cache clean --force

echo "✅ Cleanup complete. Now rebuilding..."

# Rebuild everything
npm run build
npx cap add ios
npx cap sync ios

echo "🚀 Ready! Now run: npx cap run ios"