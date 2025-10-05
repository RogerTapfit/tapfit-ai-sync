# iOS Development Workflow Setup

## Overview
This workflow provides a bulletproof iOS development setup with version sync, preflight validation, and one-shot terminal commands.

## Commands Available

### `pnpm ios:open-latest`
**Main command** - Opens Xcode with the latest web bundle and validated configuration:
- Syncs Info.plist version with package.json
- Auto-increments build number
- Builds fresh web bundle
- Copies web bundle to iOS
- Validates all configurations
- Opens Xcode workspace

### `pnpm ios:embed`
Just builds web and copies to iOS shell without opening Xcode.

### `pnpm ios:preflight-local`
Runs all validation checks without building or opening Xcode.

## Xcode Build Phase Setup

To add preflight validation to Xcode builds:

1. Open your project in Xcode
2. Select the **App** target
3. Go to **Build Phases** tab
4. Click **+** → **New Run Script Phase**
5. Name it **"TapFit Preflight"**
6. Paste this script:

```bash
#!/bin/sh
set -euo pipefail
REPO_ROOT="$SRCROOT/../.."
bash "$REPO_ROOT/scripts/ios_preflight_local.sh"
```

7. **Important**: Drag this build phase **above** the "Compile Sources" phase
8. Check "Run script only when installing" if you only want validation on release builds

## What Gets Validated

### Version Consistency
- `package.json` version matches `Info.plist` CFBundleShortVersionString
- Source of truth: `package.json` version field

### Configuration Validation
- Associated domains include `applinks:tapfit.info`
- Required Info.plist keys present:
  - `NSBluetoothAlwaysUsageDescription`
  - `NFCReaderUsageDescription`
  - `UIBackgroundModes` includes `bluetooth-central`

### Web Bundle Validation
- Fresh web bundle exists in `dist/`
- Web bundle properly embedded in `ios/App/App/public/`
- Hash validation ensures embedded bundle matches built bundle

### Capacitor Configuration
- No `server.url` in capacitor.config.ts (prevents remote loading)

## Troubleshooting

### Version Mismatch
Update the version in package.json, then run `pnpm ios:open-latest`.

### Missing Permissions
Check `ios/App/App/Info.plist` for required keys.

### Stale Web Bundle
Run `pnpm build && npx cap copy ios` or use `pnpm ios:embed`.

### Universal Links Not Working
- Verify `ios/App/App/App.entitlements` contains associated domains
- Check `public/.well-known/apple-app-site-association` is properly served
- Ensure your web server returns `Content-Type: application/json` for AASA files

## File Structure
```
scripts/
├── ios_open_latest.sh          # Main workflow script
├── ios_preflight_local.sh      # Validation script
└── README-iOS-Workflow.md      # This file
```

## Success Criteria
- `pnpm ios:open-latest` reliably opens Xcode with correct version and embedded web
- Universal Links work: `https://tapfit.info/nfc` opens app, not Safari
- App shows correct version (1.2.6) in VersionDisplay component
- Any configuration issues fail fast with clear error messages