# iOS Workflow Setup Instructions

## ✅ What's Already Done
- ✅ Created `scripts/ios_open_latest.sh` - Enhanced workflow script
- ✅ Created `scripts/ios_preflight_local.sh` - Validation script  
- ✅ Created `scripts/sync_from_lovable.sh` - Core sync from GitHub
- ✅ Created `scripts/update_and_open_xcode.sh` - Master workflow script
- ✅ Created `scripts/emergency_reset_ios.sh` - Emergency reset
- ✅ Created documentation in `scripts/README-Lovable-Xcode-Sync.md`
- ✅ Version sync ready (src/lib/version.ts is 1.2.7)

## 🔧 Manual Steps Required

### 1. Make Scripts Executable
Run these commands in your terminal:
```bash
chmod +x scripts/*.sh
```

### 2. Update package.json
Since package.json is read-only in Lovable, you'll need to add these manually when you export to GitHub:

**Add to scripts section:**
```json
"scripts": {
  "dev": "vite",
  "build": "vite build", 
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview",
  "ios:sync-lovable": "bash scripts/update_and_open_xcode.sh",
  "ios:open-latest": "bash scripts/ios_open_latest.sh",
  "ios:embed": "pnpm build && npx cap copy ios",
  "ios:preflight-local": "bash scripts/ios_preflight_local.sh",
  "ios:emergency-reset": "bash scripts/emergency_reset_ios.sh"
}
```

**Update version:**
```json
"version": "1.2.7"
```

### 3. Add Xcode Build Phase
In Xcode:
1. Select **App** target → **Build Phases**
2. Click **+** → **New Run Script Phase** 
3. Name: **"TapFit Preflight"**
4. Script:
```bash
#!/bin/sh
set -euo pipefail
REPO_ROOT="$SRCROOT/../.."
bash "$REPO_ROOT/scripts/ios_preflight_local.sh"
```
5. **Drag above "Compile Sources"**

## 🚀 Main Usage (After Lovable Updates)

After updating in Lovable, run:
```bash
pnpm ios:sync-lovable
# OR directly:
bash scripts/update_and_open_xcode.sh
```

This will:
- ✅ Pull latest Lovable changes from GitHub
- ✅ Clear all Xcode caches and build artifacts
- ✅ Sync Info.plist version (1.2.7) with package.json
- ✅ Auto-increment build number  
- ✅ Build fresh web bundle with latest code
- ✅ Embed web in iOS shell with hash validation
- ✅ Open Xcode with guaranteed latest code

## 🛠️ Alternative Commands

```bash
pnpm ios:open-latest        # Enhanced original workflow
pnpm ios:emergency-reset    # Nuclear reset if needed
```

## 🎯 Result
Perfect iOS development workflow with fail-fast validation and Universal Links working correctly!