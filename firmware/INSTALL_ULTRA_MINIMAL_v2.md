# TapFit Puck Ultra Minimal v2.0 Installation

## Memory-Optimized Firmware for App v1.2.5+

This ultra-minimal firmware (87 lines) is designed for maximum compatibility with the TapFit app while using minimal memory.

### Key Improvements:
- ✅ **Correct BLE Protocol**: Matches exact packet format expected by app
- ✅ **Ultra-Low Memory**: 87 lines, shortened variables, no complex objects
- ✅ **Fast Calibration**: 1-second calibration that never gets stuck
- ✅ **No LED Lockups**: Simple, reliable LED feedback
- ✅ **Robust Error Handling**: Silent failures prevent crashes

### Packet Protocol:
- `[0, repCount]` - Rep count update
- `[1, repCount]` - Handshake on connection  
- `[2, 1]` - Session started
- `[2, 0]` - Session stopped

### Installation:

1. **Connect to Puck.js:**
   ```
   https://www.espruino.com/ide/
   ```

2. **Clear Memory Completely:**
   ```javascript
   reset(true);
   clearInterval();
   clearTimeout();
   ```

3. **Upload Firmware:**
   - Copy entire content of `puck_ultra_minimal_v2.0.js`
   - Paste in Espruino IDE
   - Click "Send to Espruino" 
   - Wait for ">" prompt

4. **Save to Flash:**
   ```javascript
   save();
   ```

### LED Indicators:
- **Green (LED2)**: Connected, rep detected, session started (brief flashes)
- **Red (LED1)**: Session stopped, low battery
- **Blue (LED3)**: Calibrating (1 second), errors (brief flash)

### Usage:
1. **Start**: NFC tap or button press → Double green flash
2. **Reps**: Each rep → Brief green flash  
3. **Stop**: Button press → Red flash
4. **Auto-stop**: After 25 seconds of inactivity

### Memory Usage:
- **87 lines** (vs 204 in previous version)
- **Minimal variables** (shortened names: `d.r` vs `state.repCount`)
- **No JSON** (uses byte arrays)
- **Simple intervals** (no nested timers)

### Troubleshooting:
- **Solid Blue**: Calibrating (wait 1 second)
- **Flashing Green**: Working correctly
- **No Response**: Try `reset(true)` and reinstall
- **Memory Error**: Firmware is under 2KB, should not occur