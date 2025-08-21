// TapFit Puck.js NFC Auto-Connect Firmware
// Optimized for iOS app integration with NFC-triggered auto-connection

// ============= CONFIGURATION =============
const CONFIG = {
  DEVICE_NAME: "TapFit-Puck",
  NFC_SERVICE_UUID: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  NFC_CHAR_UUID: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
  REP_SERVICE_UUID: "6e400001-b5a3-f393-e0a9-e50e24dcca9f",
  REP_CHAR_UUID: "6e400002-b5a3-f393-e0a9-e50e24dcca9f",
  SAMPLE_RATE: 12.5, // Hz
  MOTION_THRESHOLD: 0.8,
  REP_COOLDOWN: 800, // ms
  HEARTBEAT_INTERVAL: 2000, // ms
  BATTERY_CHECK_INTERVAL: 30000, // ms
  LOW_BATTERY_THRESHOLD: 20, // %
  NFC_DETECT_TIMEOUT: 5000, // ms aggressive advertising after NFC
};

// ============= PACKET TYPES =============
const PACKET_TYPE = {
  REP_COUNT: 0x01,
  STATUS: 0x02,
  HEARTBEAT: 0x03,
  BATTERY: 0x04,
  ERROR: 0x05,
  NFC_DETECTED: 0x06,
  NFC_ACK: 0x07
};

// ============= COMMAND TYPES =============
const COMMAND = {
  RESET: 0x01,
  START_SESSION: 0x02,
  END_SESSION: 0x03,
  REQUEST_STATUS: 0x04,
  CALIBRATE: 0x05,
  NFC_ACK: 0x06
};

// ============= DEVICE STATE =============
let state = {
  repCount: 0,
  connected: false,
  calibrated: false,
  sessionActive: false,
  batteryLevel: 100,
  lastHeartbeat: 0,
  accelBaseline: { x: 0, y: 0, z: 0 },
  lastRepTime: 0,
  nfcDetected: false,
  aggressiveAdvertising: false
};

// ============= INITIALIZATION =============
function init() {
  console.log("TapFit Puck NFC Auto-Connect initializing...");
  setupNFC();
  setupBLE();
  setupAccelerometer();
  setupButtons();
  setupPowerManagement();
  startupSequence();
  
  // Initial calibration
  setTimeout(() => {
    calibrateDevice();
  }, 2000);
}

// ============= NFC DETECTION =============
function setupNFC() {
  // Enable NFC detection on Puck.js
  try {
    require("puck").on('NFC', function(uid) {
      console.log("NFC detected:", uid);
      handleNFCDetection();
    });
    console.log("NFC detection enabled");
  } catch (e) {
    console.log("NFC not available on this device");
  }
}

function handleNFCDetection() {
  console.log("NFC tag detected - starting aggressive advertising");
  state.nfcDetected = true;
  state.aggressiveAdvertising = true;
  
  // Flash LED to indicate NFC detection
  nfcDetectedFeedback();
  
  // Send NFC detection packet if connected
  if (state.connected) {
    sendNFCDetectedPacket();
  }
  
  // Start aggressive advertising for faster connection
  startAggressiveAdvertising();
  
  // Stop aggressive advertising after timeout
  setTimeout(() => {
    state.aggressiveAdvertising = false;
    console.log("Aggressive advertising timeout");
    // Return to normal advertising
    updateAdvertising();
  }, CONFIG.NFC_DETECT_TIMEOUT);
}

function startAggressiveAdvertising() {
  // Increase advertising frequency and power for faster discovery
  NRF.setAdvertising({
    0x1809: [Math.round(Puck.getBatteryPercentage())],
    0x180F: [Math.round(Puck.getBatteryPercentage())]
  }, {
    name: CONFIG.DEVICE_NAME + "-NFC",
    interval: 20, // Very fast advertising (20ms intervals)
    connectable: true,
    discoverable: true
  });
  console.log("Started aggressive NFC advertising");
}

// ============= BLE SETUP =============
function setupBLE() {
  // NRF setup for both services
  NRF.setServices({
    [CONFIG.NFC_SERVICE_UUID]: {
      [CONFIG.NFC_CHAR_UUID]: {
        value: [0],
        maxLen: 20,
        writable: true,
        onWrite: handleIncomingCommand,
        readable: true,
        notify: true
      }
    },
    [CONFIG.REP_SERVICE_UUID]: {
      [CONFIG.REP_CHAR_UUID]: {
        value: [0],
        maxLen: 20,
        writable: true,
        onWrite: handleIncomingCommand,
        readable: true,
        notify: true
      }
    }
  });

  // Connection events
  NRF.on('connect', handleConnect);
  NRF.on('disconnect', handleDisconnect);
  
  updateAdvertising();
  console.log("BLE services configured");
}

function updateAdvertising() {
  const advertisingName = state.aggressiveAdvertising ? 
    CONFIG.DEVICE_NAME + "-NFC" : CONFIG.DEVICE_NAME;
    
  const interval = state.aggressiveAdvertising ? 20 : 375;
  
  NRF.setAdvertising({
    0x1809: [Math.round(Puck.getBatteryPercentage())],
    0x180F: [Math.round(Puck.getBatteryPercentage())]
  }, {
    name: advertisingName,
    interval: interval,
    connectable: true,
    discoverable: true
  });
}

function handleConnect() {
  console.log("Device connected");
  state.connected = true;
  connectionFeedback();
  
  // Send status update
  setTimeout(() => {
    sendStatusPacket();
    if (state.nfcDetected) {
      sendNFCDetectedPacket();
    }
  }, 100);
  
  startHeartbeat();
}

function handleDisconnect() {
  console.log("Device disconnected");
  state.connected = false;
  state.sessionActive = false;
  disconnectionFeedback();
  stopHeartbeat();
}

function handleIncomingCommand(evt) {
  if (!evt.data || evt.data.length === 0) return;
  
  const command = evt.data[0];
  console.log("Received command:", command);
  
  switch (command) {
    case COMMAND.RESET:
      resetRepCount();
      break;
    case COMMAND.START_SESSION:
      startSession();
      break;
    case COMMAND.END_SESSION:
      endSession();
      break;
    case COMMAND.REQUEST_STATUS:
      sendStatusPacket();
      break;
    case COMMAND.CALIBRATE:
      calibrateDevice();
      break;
    case COMMAND.NFC_ACK:
      handleNFCAck();
      break;
  }
}

function handleNFCAck() {
  console.log("NFC detection acknowledged by app");
  state.nfcDetected = false;
  sendNFCAckPacket();
}

// ============= MOTION DETECTION =============
function setupAccelerometer() {
  Puck.accelOn(CONFIG.SAMPLE_RATE);
  console.log("Accelerometer enabled");
}

function calibrateDevice() {
  console.log("Starting calibration...");
  calibrationFeedback();
  
  let samples = [];
  let sampleCount = 0;
  const targetSamples = 25;
  
  const calibrationInterval = setInterval(() => {
    const accel = Puck.accel();
    samples.push(accel);
    sampleCount++;
    
    if (sampleCount >= targetSamples) {
      clearInterval(calibrationInterval);
      
      // Calculate baseline
      state.accelBaseline = {
        x: samples.reduce((sum, s) => sum + s.x, 0) / samples.length,
        y: samples.reduce((sum, s) => sum + s.y, 0) / samples.length,
        z: samples.reduce((sum, s) => sum + s.z, 0) / samples.length
      };
      
      state.calibrated = true;
      console.log("Calibration complete:", state.accelBaseline);
      calibrationCompleteFeedback();
      sendStatusPacket();
    }
  }, 80);
}

function startSession() {
  if (!state.calibrated) {
    console.log("Cannot start session - not calibrated");
    return;
  }
  
  console.log("Starting session");
  state.sessionActive = true;
  sessionStartFeedback();
  startMotionMonitoring();
  sendStatusPacket();
}

function endSession() {
  console.log("Ending session");
  state.sessionActive = false;
  sessionEndFeedback();
  sendStatusPacket();
}

function startMotionMonitoring() {
  if (!state.sessionActive) return;
  
  const accel = Puck.accel();
  const magnitude = calculateMotionMagnitude(accel);
  
  if (checkForRep(magnitude)) {
    registerRep();
  }
  
  setTimeout(startMotionMonitoring, 80);
}

function calculateMotionMagnitude(accel) {
  const deltaX = accel.x - state.accelBaseline.x;
  const deltaY = accel.y - state.accelBaseline.y;
  const deltaZ = accel.z - state.accelBaseline.z;
  
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
}

function checkForRep(magnitude) {
  const now = getTime() * 1000;
  
  if (magnitude > CONFIG.MOTION_THRESHOLD && 
      (now - state.lastRepTime) > CONFIG.REP_COOLDOWN) {
    return true;
  }
  return false;
}

function registerRep() {
  state.repCount++;
  state.lastRepTime = getTime() * 1000;
  
  console.log("Rep detected! Count:", state.repCount);
  repFeedback();
  sendRepPacket();
}

function resetRepCount() {
  console.log("Resetting rep count");
  state.repCount = 0;
  resetFeedback();
  sendStatusPacket();
}

// ============= PACKET TRANSMISSION =============
function sendNFCDetectedPacket() {
  const packet = new Uint8Array([
    PACKET_TYPE.NFC_DETECTED,
    1, // NFC detected flag
    calculateChecksum([PACKET_TYPE.NFC_DETECTED, 1])
  ]);
  transmitPacket(packet);
}

function sendNFCAckPacket() {
  const packet = new Uint8Array([
    PACKET_TYPE.NFC_ACK,
    1, // Acknowledgment
    calculateChecksum([PACKET_TYPE.NFC_ACK, 1])
  ]);
  transmitPacket(packet);
}

function sendRepPacket() {
  const packet = new Uint8Array([
    PACKET_TYPE.REP_COUNT,
    (state.repCount >> 8) & 0xFF,
    state.repCount & 0xFF,
    calculateChecksum([PACKET_TYPE.REP_COUNT, (state.repCount >> 8) & 0xFF, state.repCount & 0xFF])
  ]);
  transmitPacket(packet);
}

function sendStatusPacket() {
  const statusFlags = 
    (state.calibrated ? 0x01 : 0x00) |
    (state.sessionActive ? 0x02 : 0x00) |
    (state.nfcDetected ? 0x04 : 0x00);
    
  const packet = new Uint8Array([
    PACKET_TYPE.STATUS,
    statusFlags,
    (state.repCount >> 8) & 0xFF,
    state.repCount & 0xFF,
    state.batteryLevel,
    calculateChecksum([PACKET_TYPE.STATUS, statusFlags, (state.repCount >> 8) & 0xFF, state.repCount & 0xFF, state.batteryLevel])
  ]);
  transmitPacket(packet);
}

function sendHeartbeat() {
  const timestamp = Math.floor(getTime());
  const packet = new Uint8Array([
    PACKET_TYPE.HEARTBEAT,
    (timestamp >> 24) & 0xFF,
    (timestamp >> 16) & 0xFF,
    (timestamp >> 8) & 0xFF,
    timestamp & 0xFF,
    calculateChecksum([PACKET_TYPE.HEARTBEAT, (timestamp >> 24) & 0xFF, (timestamp >> 16) & 0xFF, (timestamp >> 8) & 0xFF, timestamp & 0xFF])
  ]);
  transmitPacket(packet);
}

function transmitPacket(packet) {
  if (!state.connected) return;
  
  try {
    // Send on both characteristics for compatibility
    NRF.updateServices({
      [CONFIG.NFC_SERVICE_UUID]: {
        [CONFIG.NFC_CHAR_UUID]: {
          value: Array.from(packet),
          notify: true
        }
      }
    });
    
    NRF.updateServices({
      [CONFIG.REP_SERVICE_UUID]: {
        [CONFIG.REP_CHAR_UUID]: {
          value: Array.from(packet),
          notify: true
        }
      }
    });
  } catch (e) {
    console.log("Transmission error:", e);
  }
}

function calculateChecksum(data) {
  return data.reduce((sum, byte) => (sum + byte) & 0xFF, 0);
}

// ============= HEARTBEAT =============
let heartbeatInterval;

function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    sendHeartbeat();
  }, CONFIG.HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// ============= BUTTON HANDLING =============
function setupButtons() {
  let buttonPressStart = 0;
  
  setWatch(function(e) {
    if (e.state) {
      buttonPressStart = getTime();
    } else {
      const pressDuration = (getTime() - buttonPressStart) * 1000;
      
      if (pressDuration > 2000) {
        // Long press - reset rep count
        resetRepCount();
      } else {
        // Short press - toggle session
        if (state.sessionActive) {
          endSession();
        } else {
          startSession();
        }
      }
    }
  }, BTN, { edge: "both", debounce: 50 });
  
  console.log("Button handler configured");
}

// ============= POWER MANAGEMENT =============
function setupPowerManagement() {
  setInterval(() => {
    state.batteryLevel = Math.round(Puck.getBatteryPercentage());
    
    if (state.batteryLevel <= CONFIG.LOW_BATTERY_THRESHOLD) {
      lowBatteryFeedback();
    }
    
    updateAdvertising(); // Update battery in advertising
  }, CONFIG.BATTERY_CHECK_INTERVAL);
}

// ============= LED FEEDBACK =============
function repFeedback() {
  LED1.set();
  setTimeout(() => LED1.reset(), 100);
}

function connectionFeedback() {
  LED2.set();
  setTimeout(() => LED2.reset(), 500);
}

function disconnectionFeedback() {
  LED3.set();
  setTimeout(() => LED3.reset(), 300);
}

function calibrationFeedback() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      LED2.set();
      setTimeout(() => LED2.reset(), 200);
    }, i * 300);
  }
}

function calibrationCompleteFeedback() {
  LED1.set();
  LED2.set();
  setTimeout(() => {
    LED1.reset();
    LED2.reset();
  }, 1000);
}

function sessionStartFeedback() {
  LED1.set();
  setTimeout(() => LED1.reset(), 200);
  setTimeout(() => LED1.set(), 300);
  setTimeout(() => LED1.reset(), 500);
}

function sessionEndFeedback() {
  LED3.set();
  setTimeout(() => LED3.reset(), 200);
  setTimeout(() => LED3.set(), 300);
  setTimeout(() => LED3.reset(), 500);
}

function resetFeedback() {
  LED3.set();
  setTimeout(() => LED3.reset(), 100);
  setTimeout(() => LED3.set(), 200);
  setTimeout(() => LED3.reset(), 300);
}

function nfcDetectedFeedback() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      LED1.set();
      LED2.set();
      LED3.set();
      setTimeout(() => {
        LED1.reset();
        LED2.reset();
        LED3.reset();
      }, 100);
    }, i * 150);
  }
}

function lowBatteryFeedback() {
  LED3.set();
  setTimeout(() => LED3.reset(), 2000);
}

function startupSequence() {
  LED1.set();
  setTimeout(() => {
    LED1.reset();
    LED2.set();
    setTimeout(() => {
      LED2.reset();
      LED3.set();
      setTimeout(() => LED3.reset(), 200);
    }, 200);
  }, 200);
}

// ============= ERROR HANDLING =============
process.on('uncaughtException', function(e) {
  console.log("Error:", e);
  LED3.set();
  setTimeout(() => LED3.reset(), 100);
  
  try {
    const errorPacket = new Uint8Array([
      PACKET_TYPE.ERROR,
      0x01, // Generic error
      calculateChecksum([PACKET_TYPE.ERROR, 0x01])
    ]);
    transmitPacket(errorPacket);
  } catch (transmitError) {
    console.log("Could not transmit error packet");
  }
});

// ============= STARTUP =============
setTimeout(init, 1000);
save();