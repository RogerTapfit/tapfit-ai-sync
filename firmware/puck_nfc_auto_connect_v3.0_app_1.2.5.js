// TapFit Puck Enhanced NFC Auto-Connect Firmware v3.0
// Optimized for TapFit App v1.2.5
// Features: Instant NFC response, perfect BLE handshake, accurate rep counting

const DEVICE_NAME = "TapFit Puck";
const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const TX_CHAR_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const RX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// Device state management
const state = {
  repCount: 0,
  sessionActive: false,
  isConnected: false,
  isCalibrated: false,
  batteryLevel: 1.0,
  lastMotion: 0,
  calibrationData: { x: 0, y: 0, z: 0 },
  motionThreshold: 0.8,
  lastRepTime: 0,
  sessionTimeout: 300000, // 5 minutes
  sessionStartTime: 0
};

// Packet types for communication
const PACKET_TYPE = {
  REP_COUNT: 0x01,
  STATUS: 0x02,
  HEARTBEAT: 0x03,
  BATTERY: 0x04,
  ERROR: 0xFF
};

// Commands from app
const COMMAND = {
  HANDSHAKE: 0x01,
  START_SESSION: 0x02,
  STOP_SESSION: 0x03,
  CALIBRATE: 0x04,
  RESET: 0x05,
  STATUS_REQUEST: 0x06
};

let bleService, txCharacteristic, rxCharacteristic;
let motionInterval, heartbeatInterval;
let nfcFieldDetected = false;

// Main initialization
function initializePuck() {
  console.log("TapFit Puck v3.0 initializing...");
  
  setupBLE();
  setupNFC();
  setupButtons();
  setupAccelerometer();
  setupMotionDetection();
  
  // Start advertising immediately
  startAdvertising();
  
  // Battery monitoring
  setInterval(() => {
    state.batteryLevel = getBatteryLevel();
    if (state.isConnected) {
      sendHeartbeat();
    }
  }, 30000);
  
  // Visual startup indication
  ledSequence([LED1, LED2, LED3], 200);
  console.log("TapFit Puck ready for NFC and BLE");
}

// BLE Service Setup
function setupBLE() {
  console.log("Setting up BLE service...");
  
  NRF.setServices({
    [SERVICE_UUID]: {
      [TX_CHAR_UUID]: {
        value: [0],
        maxLen: 20,
        writable: false,
        readable: true,
        notify: true
      },
      [RX_CHAR_UUID]: {
        value: [0],
        maxLen: 20,
        writable: true,
        onWrite: handleIncomingCommand
      }
    }
  }, { advertise: [SERVICE_UUID] });

  // Store characteristic references
  bleService = NRF.getService(SERVICE_UUID);
  txCharacteristic = bleService.getCharacteristic(TX_CHAR_UUID);
  rxCharacteristic = bleService.getCharacteristic(RX_CHAR_UUID);

  // Connection event handlers
  NRF.on('connect', handleConnect);
  NRF.on('disconnect', handleDisconnect);
}

// NFC Setup for auto-connect trigger
function setupNFC() {
  console.log("Setting up NFC...");
  
  try {
    // Enable NFC with auto-connect data
    NRF.nfcURL("https://tapfit.health/nfc");
    
    // NFC field detection for instant response
    NRF.on('NFCon', () => {
      console.log("NFC field detected!");
      nfcFieldDetected = true;
      handleNFCDetection();
    });
    
    NRF.on('NFCoff', () => {
      console.log("NFC field removed");
      nfcFieldDetected = false;
    });
    
  } catch (e) {
    console.log("NFC setup failed:", e);
  }
}

// Handle NFC tap detection
function handleNFCDetection() {
  console.log("NFC triggered auto-connect sequence");
  
  // Visual feedback
  LED1.write(1);
  setTimeout(() => LED1.write(0), 500);
  
  // Boost advertising for quick discovery
  restartAdvertising(true);
  
  // Auto-start session after 2 seconds if connected
  setTimeout(() => {
    if (state.isConnected && !state.sessionActive) {
      startSession();
    }
  }, 2000);
}

// Enhanced advertising with boost mode
function startAdvertising(boost = false) {
  const advData = {
    0x02: [0x01, 0x06], // General discoverable mode
    0x03: E.toUint8Array(E.reverseByte(SERVICE_UUID)), // Service UUID
    0x09: DEVICE_NAME, // Complete local name
    0x0A: [0x04] // TX power level
  };
  
  const scanData = {
    0x09: DEVICE_NAME,
    0x16: [0x12, 0x18, state.batteryLevel * 100] // Battery service data
  };
  
  const options = {
    name: DEVICE_NAME,
    interval: boost ? 20 : 100, // Faster when boosted
    connectable: true,
    discoverable: true,
    showName: true
  };
  
  NRF.setAdvertising(advData, options);
  NRF.setScanResponse(scanData);
  
  console.log("Advertising started" + (boost ? " (boosted)" : ""));
}

function restartAdvertising(boost = false) {
  NRF.setAdvertising({}, { connectable: false });
  setTimeout(() => startAdvertising(boost), 100);
}

// Connection handlers
function handleConnect() {
  console.log("BLE device connected");
  state.isConnected = true;
  
  // Visual feedback
  LED2.write(1);
  setTimeout(() => LED2.write(0), 1000);
  
  // Send initial status
  setTimeout(sendStatus, 500);
}

function handleDisconnect() {
  console.log("BLE device disconnected");
  state.isConnected = false;
  
  // Stop session if active
  if (state.sessionActive) {
    stopSession();
  }
  
  // Restart advertising
  setTimeout(() => startAdvertising(), 1000);
}

// Command handling from app
function handleIncomingCommand(evt) {
  const data = new Uint8Array(evt.data);
  const command = data[0];
  
  console.log("Received command:", command);
  
  switch (command) {
    case COMMAND.HANDSHAKE:
      console.log("Handshake received");
      sendStatus();
      break;
      
    case COMMAND.START_SESSION:
      startSession();
      break;
      
    case COMMAND.STOP_SESSION:
      stopSession();
      break;
      
    case COMMAND.CALIBRATE:
      calibrateAccelerometer();
      break;
      
    case COMMAND.RESET:
      resetReps();
      break;
      
    case COMMAND.STATUS_REQUEST:
      sendStatus();
      break;
      
    default:
      console.log("Unknown command:", command);
  }
}

// Accelerometer calibration
function calibrateAccelerometer() {
  console.log("Starting calibration...");
  state.isCalibrated = false;
  
  // Visual feedback
  ledSequence([LED1, LED2, LED3], 100, 3);
  
  // Take 10 samples over 2 seconds
  let samples = [];
  let sampleCount = 0;
  
  const sampleInterval = setInterval(() => {
    const acc = Puck.accel();
    samples.push(acc);
    sampleCount++;
    
    if (sampleCount >= 10) {
      clearInterval(sampleInterval);
      
      // Calculate baseline
      state.calibrationData.x = samples.reduce((sum, s) => sum + s.x, 0) / samples.length;
      state.calibrationData.y = samples.reduce((sum, s) => sum + s.y, 0) / samples.length;
      state.calibrationData.z = samples.reduce((sum, s) => sum + s.z, 0) / samples.length;
      
      state.isCalibrated = true;
      console.log("Calibration complete:", state.calibrationData);
      
      // Success feedback
      LED2.write(1);
      setTimeout(() => LED2.write(0), 1000);
      
      sendStatus();
    }
  }, 200);
}

// Motion detection and rep counting
function setupMotionDetection() {
  motionInterval = setInterval(() => {
    if (state.sessionActive && state.isCalibrated) {
      processMotion();
    }
  }, 50); // 20Hz sampling
}

function processMotion() {
  const acc = Puck.accel();
  const now = getTime() * 1000;
  
  // Calculate deviation from baseline
  const deltaX = Math.abs(acc.x - state.calibrationData.x);
  const deltaY = Math.abs(acc.y - state.calibrationData.y);
  const deltaZ = Math.abs(acc.z - state.calibrationData.z);
  
  const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
  
  // Rep detection with timing filter
  if (magnitude > state.motionThreshold && (now - state.lastRepTime) > 800) {
    state.repCount++;
    state.lastRepTime = now;
    state.lastMotion = now;
    
    console.log("Rep detected! Count:", state.repCount);
    
    // Visual feedback
    LED3.write(1);
    setTimeout(() => LED3.write(0), 100);
    
    // Send rep count immediately
    sendRepCount();
  }
  
  // Session timeout check
  if (state.sessionActive && (now - state.lastMotion) > state.sessionTimeout) {
    console.log("Session timeout - no motion detected");
    stopSession();
  }
}

// Session management
function startSession() {
  if (state.sessionActive) return;
  
  console.log("Starting workout session");
  state.sessionActive = true;
  state.sessionStartTime = getTime() * 1000;
  state.lastMotion = state.sessionStartTime;
  
  // Visual feedback
  ledSequence([LED1, LED2, LED3], 150, 2);
  
  sendStatus();
}

function stopSession() {
  if (!state.sessionActive) return;
  
  console.log("Stopping workout session");
  state.sessionActive = false;
  
  // Visual feedback
  LED1.write(1);
  LED2.write(1);
  LED3.write(1);
  setTimeout(() => {
    LED1.write(0);
    LED2.write(0);
    LED3.write(0);
  }, 1000);
  
  sendStatus();
}

function resetReps() {
  console.log("Resetting rep count");
  state.repCount = 0;
  sendRepCount();
}

// Button setup for manual control
function setupButtons() {
  setWatch(() => {
    if (state.sessionActive) {
      stopSession();
    } else if (state.isCalibrated) {
      startSession();
    }
  }, BTN, { edge: "rising", debounce: 50, repeat: true });
}

function setupAccelerometer() {
  // Enable accelerometer with optimal settings
  Puck.accelOn(12.5); // 12.5Hz for baseline, motion detection uses polling
}

// Communication functions
function sendPacket(type, data = []) {
  if (!state.isConnected || !txCharacteristic) return false;
  
  const packet = new Uint8Array([type, ...data]);
  
  try {
    txCharacteristic.writeValue(packet);
    return true;
  } catch (e) {
    console.log("Send failed:", e);
    return false;
  }
}

function sendRepCount() {
  const repBytes = [
    (state.repCount >> 8) & 0xFF,
    state.repCount & 0xFF
  ];
  sendPacket(PACKET_TYPE.REP_COUNT, repBytes);
}

function sendStatus() {
  const statusData = [
    state.sessionActive ? 1 : 0,
    state.isCalibrated ? 1 : 0,
    Math.floor(state.batteryLevel * 100),
    (state.repCount >> 8) & 0xFF,
    state.repCount & 0xFF
  ];
  sendPacket(PACKET_TYPE.STATUS, statusData);
}

function sendHeartbeat() {
  const batteryPercent = Math.floor(state.batteryLevel * 100);
  sendPacket(PACKET_TYPE.HEARTBEAT, [batteryPercent]);
}

// Utility functions
function getBatteryLevel() {
  const voltage = NRF.getBattery();
  // Convert voltage to percentage (3.0V = 0%, 4.2V = 100%)
  const percentage = Math.max(0, Math.min(1, (voltage - 3.0) / 1.2));
  return percentage;
}

function ledSequence(leds, duration, repeats = 1) {
  let count = 0;
  const sequence = () => {
    leds.forEach((led, i) => {
      setTimeout(() => {
        led.write(1);
        setTimeout(() => led.write(0), duration / 2);
      }, i * duration / 3);
    });
    
    count++;
    if (count < repeats) {
      setTimeout(sequence, duration);
    }
  };
  sequence();
}

// Error handling
process.on('uncaughtException', (e) => {
  console.log("Error:", e);
  if (state.isConnected) {
    sendPacket(PACKET_TYPE.ERROR, [0xFF]);
  }
  
  // Recovery attempt
  setTimeout(() => {
    console.log("Attempting recovery...");
    initializePuck();
  }, 5000);
});

// Initialize on startup
initializePuck();