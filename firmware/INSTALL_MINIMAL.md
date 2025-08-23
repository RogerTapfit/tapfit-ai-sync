# TapFit Puck Minimal Firmware Installation

## Memory-Optimized Firmware (v1.0)

This minimal firmware is designed to fit within Puck.js memory constraints while providing core functionality.

### Features Included:
- ✅ Motion detection and rep counting
- ✅ Bluetooth Low Energy communication
- ✅ NFC tap-to-start
- ✅ Button controls (tap to start/stop, long press to reset)
- ✅ LED feedback
- ✅ Basic calibration
- ✅ Battery monitoring

### Features Removed to Save Memory:
- ❌ Advanced calibration system
- ❌ Complex error handling
- ❌ Verbose logging
- ❌ Extended BLE features
- ❌ Complex state management

### Installation Steps:

1. **Connect to Puck.js:**
   - Go to https://www.espruino.com/ide/
   - Click the connection icon (top left)
   - Select "Web Bluetooth" 
   - Choose your Puck.js device

2. **Clear Memory:**
   ```javascript
   reset(true);
   ```

3. **Upload Firmware:**
   - Copy the entire content of `puck_minimal_v1.0.js`
   - Paste into the Espruino IDE
   - Click the "Send to Espruino" button (middle icon)

4. **Save to Flash:**
   ```javascript
   save();
   ```

### Packet Types:
- Type 0: Rep count data `[0, repCount]`
- Type 1: Handshake `[1, currentRepCount]`  
- Type 2: Session status `[2, 0/1]` (0=stopped, 1=started)

### LED Indicators:
- **Green (LED2)**: Connected, rep detected, session started
- **Red (LED1)**: Disconnected, session stopped, low battery
- **Blue (LED3)**: Calibrating, errors

### Usage:
1. NFC tap or button press to start session
2. Perform reps - each rep triggers green LED flash
3. Button press to stop session
4. Long button press (2s) to reset rep count

### Troubleshooting:
- If "OUT OF MEMORY" error persists, try `reset(true)` and upload again
- Device auto-calibrates on startup (blue LED pulses)
- Battery check every 60 seconds (red LED if low)