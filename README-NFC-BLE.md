# TapFit NFC + Universal Links + BLE Integration

## Overview
This system enables instant app opening and BLE pairing via NFC tap. The flow is:
1. User taps NFC tag
2. iOS opens TapFit app via Universal Links (not Safari)  
3. App automatically scans and connects to matching Puck.js device
4. Handshake confirms correct station pairing

## NFC Tag Format
Write this URL to NFC tags (single NDEF URI record):
```
https://tapfit-ai-sync.lovable.app/pair?station=LEGEXT01
```

Replace `LEGEXT01` with the actual station ID that matches the Puck.js firmware.

## Station ID Examples
- `LEGEXT01` - Leg Extension Machine 1
- `ROW02` - Rowing Machine 2  
- `BENCH03` - Bench Press 3
- `SQUAT01` - Squat Rack 1

## Puck.js Setup
1. Flash `firmware/puck_handshake.js` to Puck.js device
2. Update `STATION_ID_STR` in firmware to match NFC tag
3. Ensure Puck is powered and advertising

## Testing Steps

### 1. Universal Link Test
Open in iOS Safari: `https://tapfit-ai-sync.lovable.app/pair?station=LEGEXT01`
- **Expected**: App opens directly (not Safari)

### 2. NFC Tag Test  
1. Write URL to NFC tag using NFC Tools or similar
2. Tap iPhone to tag
- **Expected**: App opens instantly to foreground

### 3. BLE Pairing Test
1. Ensure Puck is advertising with matching station ID
2. Trigger Universal Link (via NFC or URL)
- **Expected**: App finds Puck via manufacturer data, connects, sends handshake
- **Expected**: Puck flashes green LED on successful match

### 4. Station Mismatch Test
1. Change station ID in URL to non-matching value
2. Trigger pairing
- **Expected**: App doesn't find/connect to mismatched Puck

## Technical Details

### AASA File
Located at `public/.well-known/apple-app-site-association`
- Must serve with `Content-Type: application/json`
- No redirects allowed
- Scoped to `/pair/*` paths only

### iOS Configuration
Required in Xcode:
- Associated Domains: `applinks:tapfit-ai-sync.lovable.app`
- Bluetooth usage strings in Info.plist
- NFC capability (already configured)

### BLE Specification
- Service UUID: `5A35B2F0-7E39-4C92-B5A0-05A7F2C1D1A1`
- Handshake Characteristic: `5A35B2F1-7E39-4C92-B5A0-05A7F2C1D1A1`
- Manufacturer Data ID: `0xFFFF` (test only)
- Station ID: UTF-8 encoded string in manufacturer data

## Deployment Checklist
- [ ] AASA file deployed and accessible
- [ ] iOS build with Associated Domains configured  
- [ ] Puck.js firmware flashed with correct station ID
- [ ] NFC tags written with correct URLs
- [ ] Test all scenarios above