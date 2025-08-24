# Manual Xcode Setup for TapFit v1.2.5

If the automated script doesn't work, follow these simple manual steps:

## Quick Commands (Copy & Paste)

```bash
# 1. Update version to 1.2.5
node scripts/update-version.js 1.2.5

# 2. Install dependencies
npm install

# 3. Build project
npm run build

# 4. Add iOS platform (if needed)
npx cap add ios

# 5. Sync with iOS
npx cap sync ios

# 6. Open Xcode
npx cap open ios
```

## Alternative Xcode Opening Methods

If `npx cap open ios` doesn't work, try these:

```bash
# Method 1: Direct open command
open ios/App/App.xcworkspace

# Method 2: If no workspace, try project
open ios/App/App.xcodeproj

# Method 3: Open Xcode first, then open project
open -a Xcode
# Then: File -> Open -> Navigate to ios/App/App.xcworkspace
```

## Troubleshooting

1. **No iOS folder?** Run: `npx cap add ios`
2. **Build fails?** Check for TypeScript errors in the console
3. **Xcode won't open project?** Make sure Xcode is installed and updated
4. **App won't run?** Select your development team in Xcode project settings

## Final Steps in Xcode

1. Wait for indexing to complete
2. Select your development team (if prompted)
3. Choose your device/simulator
4. Press ⌘+R to build and run