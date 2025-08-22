// TapFit Puck.js Firmware - Working Version
// Fixes: Module dependencies, syntax errors, accelerometer issues, NFC detection

// ========== CONFIGURATION ==========
const CONFIG = {
  DEVICE_NAME: "TapFit_Puck",
  FIRMWARE_VERSION: "8.0",
  ACCEL_SAMPLE_RATE: 26, // Valid rate for Puck.js
  REP_THRESHOLD: 0.8,
  REP_COOLDOWN: 800,
  NFC_URL: "https://tapfit-ai-sync.lovable.app/pair?station=TAPFIT01",
  DEBUG: true
};

// ========== BLE SERVICE CONFIGURATION ==========
const NORDIC_UART_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NORDIC_UART_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const NORDIC_UART_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// ========== PACKET TYPES ==========
const PACKET_TYPES = {
  REP: 0x01,
  STATUS: 0x02,
  NFC_DETECTION: 0x03,
  HEARTBEAT: 0x04,
  ERROR: 0x05
};

// ========== DEVICE STATE ==========
let deviceState = {
  repCount: 0,
  sessionStartTime: 0,
  lastRepTime: 0,
  isConnected: false,
  isCalibrating: false,
  isSessionActive: false,
  baseline: { x: 0, y: 0, z: 0 },
  batteryLevel: 100,
  nfcDetected: false,
  lastMotion: 0,
  motionBuffer: []
};

// ========== BLE VARIABLES ==========
let bleService = null;
let txCharacteristic = null;
let rxCharacteristic = null;
let heartbeatTimer = null;
let monitoringTimer = null;

// ========== UTILITY FUNCTIONS ==========
function log(message) {
  if (CONFIG.DEBUG) {
    console.log("[TapFit] " + message);
  }
}

function calculateChecksum(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum & 0xFF;
}

// ========== LED FEEDBACK ==========
function ledSuccess() {
  digitalPulse(LED1, 1, 100);
  setTimeout(() => digitalPulse(LED1, 1, 100), 150);
}

function ledError() {
  digitalPulse(LED2, 1, 300);
}

function ledConnected() {
  digitalPulse(LED3, 1, 500);
}

function ledNFC() {
  digitalPulse(LED1, 1, 50);
  setTimeout(() => digitalPulse(LED2, 1, 50), 100);
  setTimeout(() => digitalPulse(LED3, 1, 50), 200);
}

function startupSequence() {
  digitalPulse(LED1, 1, 200);
  setTimeout(() => digitalPulse(LED2, 1, 200), 300);
  setTimeout(() => digitalPulse(LED3, 1, 200), 600);
}

// ========== NFC SETUP ==========
function setupNFC() {
  try {
    // Set NFC URL directly without module dependency
    NRF.nfcURL(CONFIG.NFC_URL);
    
    // Listen for NFC field detection
    NRF.on('NFCrx', function(data) {
      log("NFC field detected");
      deviceState.nfcDetected = true;
      ledNFC();
      sendNFCDetectionPacket();
      startAggressiveAdvertising();
    });
    
    log("NFC configured with URL: " + CONFIG.NFC_URL);
    return true;
  } catch (e) {
    log("NFC setup failed: " + e.message);
    return false;
  }
}

// ========== BLE SETUP ==========
function setupBLE() {
  try {
    // Set device name
    NRF.setAdvertising({}, {
      name: CONFIG.DEVICE_NAME,
      showName: true,
      discoverable: true,
      connectable: true
    });

    // Setup Nordic UART Service
    NRF.setServices({
      [NORDIC_UART_SERVICE]: {
        [NORDIC_UART_TX]: {
          value: [0],
          maxLen: 20,
          writable: true,
          onWrite: function(evt) {
            handleIncomingCommand(evt.data);
          }
        },
        [NORDIC_UART_RX]: {
          value: [0],
          maxLen: 20,
          readable: true,
          notify: true
        }
      }
    }, { uart: false });

    // Store service references
    bleService = NRF.getService(NORDIC_UART_SERVICE);
    txCharacteristic = bleService.getCharacteristic(NORDIC_UART_TX);
    rxCharacteristic = bleService.getCharacteristic(NORDIC_UART_RX);

    log("BLE Nordic UART service configured");
    return true;
  } catch (e) {
    log("BLE setup failed: " + e.message);
    ledError();
    return false;
  }
}

// ========== ADVERTISING CONTROL ==========
function startAggressiveAdvertising() {
  NRF.setAdvertising({}, {
    name: CONFIG.DEVICE_NAME,
    showName: true,
    discoverable: true,
    connectable: true,
    interval: 20 // Fast advertising for 30 seconds
  });
  
  log("Aggressive advertising started");
  
  setTimeout(() => {
    NRF.setAdvertising({}, {
      name: CONFIG.DEVICE_NAME,
      showName: true,
      discoverable: true,
      connectable: true,
      interval: 375 // Normal advertising
    });
    log("Normal advertising resumed");
  }, 30000);
}

// ========== PACKET TRANSMISSION ==========
function transmitPacket(packetType, data) {
  if (!deviceState.isConnected || !rxCharacteristic) {
    return false;
  }

  try {
    let packet = [packetType];
    if (data && data.length > 0) {
      packet = packet.concat(data);
    }
    
    // Add checksum
    let checksum = calculateChecksum(packet);
    packet.push(checksum);
    
    // Ensure packet fits in BLE MTU
    if (packet.length > 20) {
      packet = packet.slice(0, 19);
      packet.push(calculateChecksum(packet));
    }
    
    NRF.updateServices({
      [NORDIC_UART_SERVICE]: {
        [NORDIC_UART_RX]: {
          value: packet,
          notify: true
        }
      }
    });
    
    return true;
  } catch (e) {
    log("Transmission failed: " + e.message);
    return false;
  }
}

// ========== PACKET SENDERS ==========
function sendRepPacket() {
  let timestamp = Math.floor((getTime() - deviceState.sessionStartTime) * 1000);
  let data = [
    deviceState.repCount & 0xFF,
    (deviceState.repCount >> 8) & 0xFF,
    timestamp & 0xFF,
    (timestamp >> 8) & 0xFF,
    (timestamp >> 16) & 0xFF,
    (timestamp >> 24) & 0xFF
  ];
  transmitPacket(PACKET_TYPES.REP, data);
}

function sendStatusPacket() {
  let data = [
    deviceState.repCount & 0xFF,
    (deviceState.repCount >> 8) & 0xFF,
    deviceState.batteryLevel,
    deviceState.isSessionActive ? 1 : 0,
    deviceState.isCalibrating ? 1 : 0
  ];
  transmitPacket(PACKET_TYPES.STATUS, data);
}

function sendNFCDetectionPacket() {
  let timestamp = Math.floor(getTime() * 1000);
  let data = [
    timestamp & 0xFF,
    (timestamp >> 8) & 0xFF,
    (timestamp >> 16) & 0xFF,
    (timestamp >> 24) & 0xFF
  ];
  transmitPacket(PACKET_TYPES.NFC_DETECTION, data);
}

function sendHeartbeat() {
  let timestamp = Math.floor(getTime() * 1000);
  let data = [
    timestamp & 0xFF,
    (timestamp >> 8) & 0xFF,
    (timestamp >> 16) & 0xFF,
    (timestamp >> 24) & 0xFF,
    deviceState.batteryLevel
  ];
  transmitPacket(PACKET_TYPES.HEARTBEAT, data);
}

// ========== COMMAND HANDLING ==========
function handleIncomingCommand(data) {
  if (!data || data.length === 0) return;
  
  let command = String.fromCharCode.apply(null, data).trim();
  log("Received command: " + command);
  
  if (command === "RESET") {
    resetSession();
    sendStatusPacket();
  } else if (command === "STATUS") {
    sendStatusPacket();
  } else if (command === "START") {
    startSession();
  } else if (command === "STOP") {
    endSession();
  } else if (command === "CALIBRATE") {
    calibrateDevice();
  }
}

// ========== ACCELEROMETER SETUP ==========
function setupAccelerometer() {
  try {
    // Use valid sample rate for Puck.js
    Puck.accelOn(CONFIG.ACCEL_SAMPLE_RATE);
    log("Accelerometer started at " + CONFIG.ACCEL_SAMPLE_RATE + "Hz");
    return true;
  } catch (e) {
    log("Accelerometer setup failed: " + e.message);
    return false;
  }
}

// ========== CALIBRATION ==========
function calibrateDevice() {
  log("Starting calibration...");
  deviceState.isCalibrating = true;
  ledSuccess();
  
  let samples = [];
  let sampleCount = 0;
  let maxSamples = 50;
  
  let calibrationTimer = setInterval(() => {
    try {
      let accel = Puck.accel();
      if (accel && !isNaN(accel.x) && !isNaN(accel.y) && !isNaN(accel.z)) {
        samples.push(accel);
        sampleCount++;
        
        if (sampleCount >= maxSamples) {
          clearInterval(calibrationTimer);
          
          // Calculate averages
          let sumX = 0, sumY = 0, sumZ = 0;
          for (let i = 0; i < samples.length; i++) {
            sumX += samples[i].x;
            sumY += samples[i].y;
            sumZ += samples[i].z;
          }
          
          deviceState.baseline = {
            x: sumX / samples.length,
            y: sumY / samples.length,
            z: sumZ / samples.length
          };
          
          deviceState.isCalibrating = false;
          log("Calibration complete: " + JSON.stringify(deviceState.baseline));
          ledSuccess();
          sendStatusPacket();
        }
      }
    } catch (e) {
      log("Calibration error: " + e.message);
      clearInterval(calibrationTimer);
      deviceState.isCalibrating = false;
      ledError();
    }
  }, 100);
}

// ========== MOTION DETECTION ==========
function calculateMotionMagnitude(accel) {
  if (!accel || isNaN(accel.x) || isNaN(accel.y) || isNaN(accel.z)) {
    return 0;
  }
  
  let dx = accel.x - deviceState.baseline.x;
  let dy = accel.y - deviceState.baseline.y;
  let dz = accel.z - deviceState.baseline.z;
  
  // Weight vertical movement more heavily
  return Math.sqrt(dx*dx + dy*dy + dz*dz*2);
}

function checkForRep(motion) {
  let now = getTime() * 1000;
  
  // Check cooldown
  if (now - deviceState.lastRepTime < CONFIG.REP_COOLDOWN) {
    return false;
  }
  
  // Check threshold
  if (motion > CONFIG.REP_THRESHOLD) {
    // Add to motion buffer
    deviceState.motionBuffer.push({ motion: motion, time: now });
    
    // Keep buffer size manageable
    if (deviceState.motionBuffer.length > 10) {
      deviceState.motionBuffer.shift();
    }
    
    // Look for peak pattern (high motion followed by low motion)
    if (deviceState.motionBuffer.length >= 3) {
      let recent = deviceState.motionBuffer.slice(-3);
      let hasHighMotion = recent[0].motion > CONFIG.REP_THRESHOLD;
      let hasLowMotion = recent[2].motion < CONFIG.REP_THRESHOLD * 0.3;
      
      if (hasHighMotion && hasLowMotion) {
        return true;
      }
    }
  }
  
  return false;
}

function registerRep() {
  deviceState.repCount++;
  deviceState.lastRepTime = getTime() * 1000;
  
  log("Rep registered: " + deviceState.repCount);
  ledSuccess();
  sendRepPacket();
}

// ========== SESSION MANAGEMENT ==========
function startSession() {
  deviceState.isSessionActive = true;
  deviceState.sessionStartTime = getTime();
  deviceState.repCount = 0;
  deviceState.motionBuffer = [];
  
  startMotionMonitoring();
  startHeartbeat();
  
  log("Session started");
  ledSuccess();
  sendStatusPacket();
}

function endSession() {
  deviceState.isSessionActive = false;
  
  stopMotionMonitoring();
  stopHeartbeat();
  
  log("Session ended - Total reps: " + deviceState.repCount);
  ledConnected();
  sendStatusPacket();
}

function resetSession() {
  deviceState.repCount = 0;
  deviceState.sessionStartTime = getTime();
  deviceState.motionBuffer = [];
  deviceState.lastRepTime = 0;
  
  log("Session reset");
  sendStatusPacket();
}

// ========== MONITORING ==========
function startMotionMonitoring() {
  if (monitoringTimer) {
    clearInterval(monitoringTimer);
  }
  
  monitoringTimer = setInterval(() => {
    try {
      let accel = Puck.accel();
      let motion = calculateMotionMagnitude(accel);
      deviceState.lastMotion = motion;
      
      if (checkForRep(motion)) {
        registerRep();
      }
    } catch (e) {
      log("Motion monitoring error: " + e.message);
    }
  }, 50); // 20Hz monitoring
}

function stopMotionMonitoring() {
  if (monitoringTimer) {
    clearInterval(monitoringTimer);
    monitoringTimer = null;
  }
}

function startHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  
  heartbeatTimer = setInterval(() => {
    if (deviceState.isConnected) {
      sendHeartbeat();
    }
  }, 5000); // Every 5 seconds
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// ========== BUTTON SETUP ==========
function setupButtons() {
  setWatch(() => {
    if (deviceState.isSessionActive) {
      endSession();
    } else {
      startSession();
    }
  }, BTN, { edge: "rising", debounce: 50, repeat: true });
  
  log("Button configured for session toggle");
}

// ========== POWER MANAGEMENT ==========
function updateBattery() {
  deviceState.batteryLevel = Math.round(Puck.getBatteryPercentage());
  
  if (deviceState.batteryLevel < 15) {
    log("Low battery: " + deviceState.batteryLevel + "%");
    ledError();
  }
}

// ========== CONNECTION EVENTS ==========
NRF.on('connect', function(addr) {
  deviceState.isConnected = true;
  log("BLE connected: " + addr);
  ledConnected();
  sendStatusPacket();
});

NRF.on('disconnect', function(reason) {
  deviceState.isConnected = false;
  log("BLE disconnected: " + reason);
  
  // Stop active sessions on disconnect
  if (deviceState.isSessionActive) {
    endSession();
  }
});

// ========== ERROR HANDLING ==========
process.on('uncaughtException', function(e) {
  log("ERROR: " + e.message);
  ledError();
  
  try {
    let errorData = [e.message.length];
    for (let i = 0; i < Math.min(e.message.length, 15); i++) {
      errorData.push(e.message.charCodeAt(i));
    }
    transmitPacket(PACKET_TYPES.ERROR, errorData);
  } catch (err) {
    // Ignore transmission errors during error handling
  }
});

// ========== INITIALIZATION ==========
function init() {
  log("Initializing TapFit Puck v" + CONFIG.FIRMWARE_VERSION);
  
  startupSequence();
  
  // Setup hardware
  let bleOk = setupBLE();
  let nfcOk = setupNFC();
  let accelOk = setupAccelerometer();
  
  if (!bleOk) {
    log("Critical: BLE setup failed");
    ledError();
    return;
  }
  
  // Setup controls
  setupButtons();
  
  // Initial calibration
  setTimeout(() => {
    calibrateDevice();
  }, 2000);
  
  // Start background tasks
  setInterval(updateBattery, 60000); // Every minute
  
  log("TapFit Puck ready!");
  log("NFC: " + (nfcOk ? "OK" : "FAILED"));
  log("Accelerometer: " + (accelOk ? "OK" : "FAILED"));
  
  ledSuccess();
}

// ========== START FIRMWARE ==========
setTimeout(init, 1000);
