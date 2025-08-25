# iOS Workflow Setup Instructions

## ✅ What's Already Done
- ✅ Created `scripts/ios_open_latest.sh` - Main workflow script
- ✅ Created `scripts/ios_preflight_local.sh` - Validation script  
- ✅ Created documentation in `scripts/README-iOS-Workflow.md`
- ✅ Version sync ready (src/lib/version.ts is 1.2.6)

## 🔧 Manual Steps Required

### 1. Make Scripts Executable
Run these commands in your terminal:
```bash
chmod +x scripts/ios_open_latest.sh
chmod +x scripts/ios_preflight_local.sh  
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
  "ios:open-latest": "bash scripts/ios_open_latest.sh",
  "ios:embed": "pnpm build && npx cap copy ios",
  "ios:preflight-local": "bash scripts/ios_preflight_local.sh"
}
```

**Update version:**
```json
"version": "1.2.6"
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

## 🚀 Usage

After setup, run:
```bash
pnpm ios:open-latest
```

This will:
- ✅ Sync Info.plist version (1.2.6) with package.json
- ✅ Auto-increment build number  
- ✅ Build fresh web bundle
- ✅ Embed web in iOS shell
- ✅ Validate all configurations
- ✅ Open Xcode with everything ready

## 🎯 Result
Perfect iOS development workflow with fail-fast validation and Universal Links working correctly!