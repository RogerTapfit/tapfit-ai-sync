/**
 * TapFit Puck Firmware - Universal Link NFC Integration
 * Optimized for seamless NFC tap → Universal Link → BLE auto-connect flow
 * Uses Nordic UART Service for compatibility with app BLE stack
 */

// Configuration
const DEVICE_NAME = "TapFit-Puck";
const BLE_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e"; // Nordic UART Service
const TX_CHARACTERISTIC = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; // TX (Puck → App)
const RX_CHARACTERISTIC = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // RX (App → Puck)

// NFC Configuration
const NFC_URL = "https://tapfit-ai-sync.lovable.app/pair?station=TAPFIT01";
const NFC_DETECTION_TIMEOUT = 30000; // 30 seconds of aggressive advertising after NFC

// Motion and Rep Counting
const SAMPLE_RATE = 50; // Hz
const REP_THRESHOLD = 1.2; // G-force threshold
const REP_COOLDOWN = 1000; // 1 second between reps
const CALIBRATION_SAMPLES = 50;

// Packet Types (must match app expectations)
const PACKET_TYPE = {
  REP_COUNT: 0x01,
  STATUS: 0x02,
  HEARTBEAT: 0x03,
  NFC_DETECTION: 0x04,
  ERROR: 0x05,
  BATTERY: 0x06
};

// Commands from app
const COMMAND = {
  RESET: 0x01,
  START_SESSION: 0x02,
  END_SESSION: 0x03,
  CALIBRATE: 0x04,
  REQUEST_STATUS: 0x05,
  NFC_ACK: 0x06
};

// Device State
let deviceState = {
  repCount: 0,
  isConnected: false,
  isCalibrated: false,
  sessionActive: false,
  batteryLevel: 100,
  nfcDetected: false,
  aggressiveAdvertising: false,
  lastMotionTime: 0,
  calibrationBaseline: { x: 0, y: 0, z: 0 }
};

// Global variables
let bleService = null;
let txCharacteristic = null;
let rxCharacteristic = null;
let heartbeatInterval = null;
let motionInterval = null;
let aggressiveAdvTimeout = null;
let nfcSupported = false;

/**
 * Initialize the TapFit Puck
 */
function init() {
  console.log("Initializing TapFit Puck with Universal Link support...");
  
  try {
    // Check for NFC support
    checkNFCSupport();
    
    // Setup core systems
    setupBLE();
    setupAccelerometer();
    setupButtons();
    setupPowerManagement();
    
    // Initial calibration
    setTimeout(() => {
      calibrateDevice();
    }, 2000);
    
    // Startup sequence
    startupSequence();
    
    console.log("TapFit Puck initialized successfully");
  } catch (error) {
    console.error("Initialization failed:", error);
    ledError();
  }
}

/**
 * Check if NFC is supported on this device
 */
function checkNFCSupport() {
  try {
    nfcSupported = (typeof NRF !== 'undefined') && NRF.nfcURL;
    console.log("NFC support:", nfcSupported ? "Available" : "Not available");
    
    if (nfcSupported) {
      setupNFC();
    } else {
      console.log("Running without NFC - BLE only mode");
    }
  } catch (error) {
    console.error("NFC check failed:", error);
    nfcSupported = false;
  }
}

/**
 * Setup NFC for Universal Link triggering
 */
function setupNFC() {
  if (!nfcSupported) return;
  
  try {
    // Set the NFC URL that will trigger the Universal Link
    NRF.nfcURL(NFC_URL);
    console.log("NFC URL configured:", NFC_URL);
    
    // Listen for NFC field detection
    NRF.on('NFCon', handleNFCDetection);
    NRF.on('NFCoff', () => {
      console.log("NFC field removed");
      deviceState.nfcDetected = false;
    });
    
  } catch (error) {
    console.error("NFC setup failed:", error);
    nfcSupported = false;
  }
}

/**
 * Handle NFC detection - triggers aggressive advertising
 */
function handleNFCDetection() {
  console.log("NFC field detected - triggering Universal Link flow");
  
  deviceState.nfcDetected = true;
  
  // Visual feedback
  ledNFCDetection();
  
  // Start aggressive advertising for better discoverability
  startAggressiveAdvertising();
  
  // Send NFC detection packet if connected
  if (deviceState.isConnected) {
    sendNFCDetectionPacket();
  }
  
  // Set timeout to return to normal advertising
  if (aggressiveAdvTimeout) {
    clearTimeout(aggressiveAdvTimeout);
  }
  
  aggressiveAdvTimeout = setTimeout(() => {
    deviceState.aggressiveAdvertising = false;
    deviceState.nfcDetected = false;
    updateAdvertising();
    console.log("Returning to normal advertising");
  }, NFC_DETECTION_TIMEOUT);
}

/**
 * Start aggressive advertising after NFC detection
 */
function startAggressiveAdvertising() {
  deviceState.aggressiveAdvertising = true;
  updateAdvertising();
  console.log("Started aggressive advertising");
}

/**
 * Setup BLE services for Nordic UART compatibility
 */
function setupBLE() {
  try {
    // Configure device name and advertising
    NRF.setAdvertising({}, {
      name: DEVICE_NAME,
      connectable: true,
      discoverable: true
    });
    
    // Create Nordic UART Service
    bleService = {
      [BLE_SERVICE_UUID]: {
        [TX_CHARACTERISTIC]: {
          value: new Uint8Array(20),
          maxLen: 20,
          notify: true,
          readable: true
        },
        [RX_CHARACTERISTIC]: {
          value: new Uint8Array(20),
          maxLen: 20,
          writable: true,
          onWrite: handleIncomingCommand
        }
      }
    };
    
    NRF.setServices(bleService, { uart: false });
    
    txCharacteristic = bleService[BLE_SERVICE_UUID][TX_CHARACTERISTIC];
    rxCharacteristic = bleService[BLE_SERVICE_UUID][RX_CHARACTERISTIC];
    
    // Connection event handlers
    NRF.on('connect', handleConnect);
    NRF.on('disconnect', handleDisconnect);
    
    // Start advertising
    updateAdvertising();
    
    console.log("BLE Nordic UART service configured");
  } catch (error) {
    console.error("BLE setup failed:", error);
    throw error;
  }
}

/**
 * Update advertising parameters based on state
 */
function updateAdvertising() {
  const interval = deviceState.aggressiveAdvertising ? 20 : 375; // Fast advertising after NFC
  
  NRF.setAdvertising({}, {
    name: DEVICE_NAME,
    interval: interval,
    connectable: true,
    discoverable: true
  });
  
  NRF.restart();
}

/**
 * Handle BLE connection
 */
function handleConnect() {
  console.log("Device connected");
  deviceState.isConnected = true;
  
  // Start heartbeat
  startHeartbeat();
  
  // Send initial status
  setTimeout(() => {
    sendStatusPacket();
  }, 1000);
  
  // Visual feedback
  ledConnected();
}

/**
 * Handle BLE disconnection
 */
function handleDisconnect() {
  console.log("Device disconnected");
  deviceState.isConnected = false;
  
  // Stop heartbeat
  stopHeartbeat();
  
  // Return to normal advertising
  deviceState.aggressiveAdvertising = false;
  updateAdvertising();
  
  // Visual feedback
  ledDisconnected();
}

/**
 * Handle incoming commands from the app
 */
function handleIncomingCommand(evt) {
  try {
    const data = new Uint8Array(evt.data);
    if (data.length === 0) return;
    
    const command = data[0];
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
        
      case COMMAND.CALIBRATE:
        calibrateDevice();
        break;
        
      case COMMAND.REQUEST_STATUS:
        sendStatusPacket();
        break;
        
      case COMMAND.NFC_ACK:
        handleNFCAck();
        break;
        
      default:
        console.warn("Unknown command:", command);
    }
  } catch (error) {
    console.error("Command handling error:", error);
  }
}

/**
 * Handle NFC acknowledgment from app
 */
function handleNFCAck() {
  console.log("Received NFC acknowledgment from app");
  deviceState.nfcDetected = false;
  
  if (aggressiveAdvTimeout) {
    clearTimeout(aggressiveAdvTimeout);
    aggressiveAdvTimeout = null;
  }
  
  deviceState.aggressiveAdvertising = false;
  updateAdvertising();
  
  // Visual confirmation
  ledSuccess();
}

/**
 * Send rep count packet to app
 */
function sendRepPacket() {
  if (!deviceState.isConnected) return;
  
  const packet = new Uint8Array(8);
  packet[0] = PACKET_TYPE.REP_COUNT;
  packet[1] = deviceState.repCount & 0xFF;
  packet[2] = (deviceState.repCount >> 8) & 0xFF;
  packet[3] = deviceState.sessionActive ? 1 : 0;
  packet[4] = Date.now() & 0xFF;
  packet[5] = (Date.now() >> 8) & 0xFF;
  packet[6] = (Date.now() >> 16) & 0xFF;
  packet[7] = calculateChecksum(packet.slice(0, 7));
  
  transmitPacket(packet);
}

/**
 * Send status packet to app
 */
function sendStatusPacket() {
  if (!deviceState.isConnected) return;
  
  const packet = new Uint8Array(8);
  packet[0] = PACKET_TYPE.STATUS;
  packet[1] = deviceState.isCalibrated ? 1 : 0;
  packet[2] = deviceState.sessionActive ? 1 : 0;
  packet[3] = deviceState.batteryLevel;
  packet[4] = deviceState.repCount & 0xFF;
  packet[5] = (deviceState.repCount >> 8) & 0xFF;
  packet[6] = deviceState.nfcDetected ? 1 : 0;
  packet[7] = calculateChecksum(packet.slice(0, 7));
  
  transmitPacket(packet);
}

/**
 * Send NFC detection packet to app
 */
function sendNFCDetectionPacket() {
  if (!deviceState.isConnected) return;
  
  const packet = new Uint8Array(8);
  packet[0] = PACKET_TYPE.NFC_DETECTION;
  packet[1] = 1; // NFC detected
  packet[2] = Date.now() & 0xFF;
  packet[3] = (Date.now() >> 8) & 0xFF;
  packet[4] = (Date.now() >> 16) & 0xFF;
  packet[5] = 0; // Reserved
  packet[6] = 0; // Reserved
  packet[7] = calculateChecksum(packet.slice(0, 7));
  
  transmitPacket(packet);
}

/**
 * Send heartbeat packet
 */
function sendHeartbeat() {
  if (!deviceState.isConnected) return;
  
  const packet = new Uint8Array(4);
  packet[0] = PACKET_TYPE.HEARTBEAT;
  packet[1] = Date.now() & 0xFF;
  packet[2] = (Date.now() >> 8) & 0xFF;
  packet[3] = calculateChecksum(packet.slice(0, 3));
  
  transmitPacket(packet);
}

/**
 * Transmit packet via BLE
 */
function transmitPacket(packet) {
  try {
    if (txCharacteristic && deviceState.isConnected) {
      txCharacteristic.updateValue(packet);
      NRF.updateServices(bleService);
    }
  } catch (error) {
    console.error("Packet transmission failed:", error);
  }
}

/**
 * Calculate simple checksum
 */
function calculateChecksum(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum & 0xFF;
}

/**
 * Setup accelerometer for motion detection
 */
function setupAccelerometer() {
  try {
    if (typeof Puck !== 'undefined' && Puck.accelOn) {
      Puck.accelOn(SAMPLE_RATE);
      console.log("Accelerometer configured at", SAMPLE_RATE, "Hz");
    } else {
      console.warn("Puck accelerometer not available");
    }
  } catch (error) {
    console.error("Accelerometer setup failed:", error);
  }
}

/**
 * Calibrate the device by averaging accelerometer readings
 */
function calibrateDevice() {
  if (typeof Puck === 'undefined' || !Puck.accel) {
    console.warn("Cannot calibrate - accelerometer not available");
    return;
  }
  
  console.log("Starting calibration...");
  ledCalibrating();
  
  let samples = [];
  
  const calibrationInterval = setInterval(() => {
    const reading = Puck.accel();
    samples.push(reading);
    
    if (samples.length >= CALIBRATION_SAMPLES) {
      clearInterval(calibrationInterval);
      
      // Calculate baseline (average of all samples)
      let sumX = 0, sumY = 0, sumZ = 0;
      samples.forEach(sample => {
        sumX += sample.x;
        sumY += sample.y;
        sumZ += sample.z;
      });
      
      deviceState.calibrationBaseline = {
        x: sumX / samples.length,
        y: sumY / samples.length,
        z: sumZ / samples.length
      };
      
      deviceState.isCalibrated = true;
      console.log("Calibration complete:", deviceState.calibrationBaseline);
      
      ledSuccess();
      sendStatusPacket();
    }
  }, 1000 / SAMPLE_RATE);
}

/**
 * Start workout session
 */
function startSession() {
  if (!deviceState.isCalibrated) {
    console.log("Cannot start session - device not calibrated");
    return;
  }
  
  console.log("Starting workout session");
  deviceState.sessionActive = true;
  deviceState.repCount = 0;
  
  startMotionMonitoring();
  sendStatusPacket();
  ledSessionStart();
}

/**
 * End workout session
 */
function endSession() {
  console.log("Ending workout session");
  deviceState.sessionActive = false;
  
  stopMotionMonitoring();
  sendStatusPacket();
  ledSessionEnd();
}

/**
 * Start monitoring motion for rep counting
 */
function startMotionMonitoring() {
  if (motionInterval) {
    clearInterval(motionInterval);
  }
  
  motionInterval = setInterval(() => {
    if (deviceState.sessionActive && deviceState.isCalibrated) {
      checkForRep();
    }
  }, 1000 / SAMPLE_RATE);
}

/**
 * Stop motion monitoring
 */
function stopMotionMonitoring() {
  if (motionInterval) {
    clearInterval(motionInterval);
    motionInterval = null;
  }
}

/**
 * Check for rep based on motion magnitude
 */
function checkForRep() {
  if (typeof Puck === 'undefined' || !Puck.accel) return;
  
  const now = Date.now();
  if (now - deviceState.lastMotionTime < REP_COOLDOWN) return;
  
  const reading = Puck.accel();
  const magnitude = calculateMotionMagnitude(reading);
  
  if (magnitude > REP_THRESHOLD) {
    registerRep();
    deviceState.lastMotionTime = now;
  }
}

/**
 * Calculate motion magnitude with weighted vertical component
 */
function calculateMotionMagnitude(reading) {
  const deltaX = reading.x - deviceState.calibrationBaseline.x;
  const deltaY = reading.y - deviceState.calibrationBaseline.y;
  const deltaZ = reading.z - deviceState.calibrationBaseline.z;
  
  // Weight vertical movement more heavily
  const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + (deltaZ * 1.5) * (deltaZ * 1.5));
  
  return magnitude;
}

/**
 * Register a rep
 */
function registerRep() {
  deviceState.repCount++;
  console.log("Rep detected! Count:", deviceState.repCount);
  
  ledRepDetected();
  sendRepPacket();
}

/**
 * Reset rep count
 */
function resetRepCount() {
  console.log("Resetting rep count");
  deviceState.repCount = 0;
  sendRepPacket();
  ledReset();
}

/**
 * Start heartbeat interval
 */
function startHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  heartbeatInterval = setInterval(() => {
    sendHeartbeat();
  }, 10000); // Every 10 seconds
}

/**
 * Stop heartbeat interval
 */
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * Setup button handlers
 */
function setupButtons() {
  try {
    // Button press handlers
    setWatch(() => {
      console.log("Button pressed - toggling session");
      if (deviceState.sessionActive) {
        endSession();
      } else {
        startSession();
      }
    }, BTN, { repeat: true, debounce: 50 });
    
    // Long press to reset
    setWatch(() => {
      console.log("Long press - resetting rep count");
      resetRepCount();
    }, BTN, { repeat: true, debounce: 50, edge: "falling" });
    
  } catch (error) {
    console.error("Button setup failed:", error);
  }
}

/**
 * Setup power management and battery monitoring
 */
function setupPowerManagement() {
  // Check battery every 60 seconds
  setInterval(() => {
    try {
      const voltage = NRF.getBattery();
      deviceState.batteryLevel = Math.round((voltage - 2.0) / (3.3 - 2.0) * 100);
      
      if (deviceState.batteryLevel < 0) deviceState.batteryLevel = 0;
      if (deviceState.batteryLevel > 100) deviceState.batteryLevel = 100;
      
      if (deviceState.batteryLevel < 20) {
        ledLowBattery();
      }
      
    } catch (error) {
      console.error("Battery check failed:", error);
    }
  }, 60000);
}

// LED Feedback Functions
function ledSuccess() {
  digitalPulse(LED1, 1, [100, 100, 100]);
}

function ledError() {
  digitalPulse(LED2, 1, [200, 200, 200, 200, 200]);
}

function ledRepDetected() {
  digitalPulse(LED1, 1, 50);
}

function ledConnected() {
  digitalPulse(LED1, 1, [50, 50, 50, 50, 50]);
}

function ledDisconnected() {
  digitalPulse(LED2, 1, [100, 100, 100]);
}

function ledCalibrating() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      digitalPulse(LED1, 1, 100);
    }, i * 200);
  }
}

function ledSessionStart() {
  digitalPulse(LED1, 1, [200, 100, 200]);
}

function ledSessionEnd() {
  digitalPulse(LED2, 1, [200, 100, 200]);
}

function ledReset() {
  digitalPulse(LED2, 1, [100, 50, 100, 50, 100]);
}

function ledNFCDetection() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      digitalPulse(LED1, 1, 50);
    }, i * 100);
  }
}

function ledLowBattery() {
  digitalPulse(LED2, 1, [1000]);
}

/**
 * Startup LED sequence
 */
function startupSequence() {
  setTimeout(() => ledSuccess(), 500);
  setTimeout(() => ledSuccess(), 1000);
}

/**
 * Error handling
 */
process.on('uncaughtException', (e) => {
  console.error("Uncaught exception:", e);
  ledError();
  
  // Try to send error packet if connected
  if (deviceState.isConnected) {
    try {
      const packet = new Uint8Array(4);
      packet[0] = PACKET_TYPE.ERROR;
      packet[1] = 0xFF; // General error
      packet[2] = 0;
      packet[3] = calculateChecksum(packet.slice(0, 3));
      transmitPacket(packet);
    } catch (sendError) {
      console.error("Failed to send error packet:", sendError);
    }
  }
});

// Start the system
setTimeout(init, 500);

// Save to flash
save();