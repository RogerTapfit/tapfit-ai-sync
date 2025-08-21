// TapFit Puck.js Firmware - NFC Auto-Connect (Fixed Version)
// Optimized for iOS app integration with NFC detection and auto-connection

// Configuration
const CONFIG = {
  DEVICE_NAME: "TapFit",
  BLE_SERVICE_UUID: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  BLE_CHARACTERISTIC_UUID: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
  NFC_SERVICE_UUID: "12340000-1234-1234-1234-123456789abc",
  NFC_CHARACTERISTIC_UUID: "12340001-1234-1234-1234-123456789abc",
  SAMPLE_RATE: 50, // Hz
  MOTION_THRESHOLD: 0.8,
  REP_COOLDOWN: 800, // ms
  CALIBRATION_SAMPLES: 20,
  HEARTBEAT_INTERVAL: 5000, // ms
  BATTERY_CHECK_INTERVAL: 60000, // ms
  NFC_AGGRESSIVE_TIMEOUT: 30000, // ms
  CONNECTION_TIMEOUT: 10000 // ms
};

// Packet types for data transmission
const PACKET_TYPE = {
  REP_COUNT: 0x01,
  STATUS: 0x02,
  HEARTBEAT: 0x03,
  BATTERY: 0x04,
  ERROR: 0x05,
  NFC_DETECTION: 0x06
};

// Commands from iOS app
const COMMAND = {
  RESET: 0x10,
  START_SESSION: 0x11,
  END_SESSION: 0x12,
  CALIBRATE: 0x13,
  REQUEST_STATUS: 0x14,
  NFC_ACK: 0x15
};

// Device state
var deviceState = {
  repCount: 0,
  isConnected: false,
  isCalibrated: false,
  accelBaseline: { x: 0, y: 0, z: 0 },
  sessionActive: false,
  batteryLevel: 100,
  lastRepTime: 0,
  nfcSupported: false,
  nfcDetected: false,
  aggressiveAdvertising: false
};

// Initialize the device
function init() {
  console.log("TapFit Puck initializing...");
  
  // Check NFC support first
  checkNFCSupport();
  
  // Setup core functions
  setupBLE();
  setupAccelerometer();
  setupButtons();
  setupPowerManagement();
  
  // Initial calibration
  setTimeout(() => {
    calibrateDevice();
  }, 1000);
  
  console.log("TapFit Puck ready!");
}

// Check if NFC is supported on this device
function checkNFCSupport() {
  try {
    // Try to access NFC functionality
    var nfc = require("NFC");
    if (nfc) {
      deviceState.nfcSupported = true;
      console.log("NFC supported - setting up NFC detection");
      setupNFC();
    }
  } catch (e) {
    deviceState.nfcSupported = false;
    console.log("NFC not supported on this device - continuing without NFC");
  }
}

// Setup NFC detection (only if supported)
function setupNFC() {
  if (!deviceState.nfcSupported) return;
  
  try {
    var nfc = require("NFC");
    nfc.on("field", function(isFieldPresent) {
      if (isFieldPresent && !deviceState.nfcDetected) {
        console.log("NFC field detected!");
        handleNFCDetection();
      }
    });
  } catch (e) {
    console.log("NFC setup failed:", e.message);
    deviceState.nfcSupported = false;
  }
}

// Handle NFC detection
function handleNFCDetection() {
  if (!deviceState.nfcSupported) return;
  
  deviceState.nfcDetected = true;
  
  // Visual feedback
  nfcDetectedFeedback();
  
  // Start aggressive advertising
  startAggressiveAdvertising();
  
  // Send NFC detection packet if connected
  if (deviceState.isConnected) {
    sendNFCDetectionPacket();
  }
  
  // Set timeout to return to normal advertising
  setTimeout(() => {
    deviceState.nfcDetected = false;
    deviceState.aggressiveAdvertising = false;
    updateAdvertising();
    console.log("NFC aggressive advertising timeout");
  }, CONFIG.NFC_AGGRESSIVE_TIMEOUT);
}

// Start aggressive advertising for faster connection
function startAggressiveAdvertising() {
  if (deviceState.aggressiveAdvertising) return;
  
  deviceState.aggressiveAdvertising = true;
  updateAdvertising();
  console.log("Started aggressive advertising");
}

// Setup BLE services and characteristics
function setupBLE() {
  // Primary service for rep counting
  NRF.setServices({
    [CONFIG.BLE_SERVICE_UUID]: {
      [CONFIG.BLE_CHARACTERISTIC_UUID]: {
        value: [0],
        maxLen: 20,
        writable: true,
        readable: true,
        notify: true,
        onWrite: function(evt) {
          handleIncomingCommand(new Uint8Array(evt.data));
        }
      }
    },
    // Secondary service for NFC detection (only if NFC supported)
    ...(deviceState.nfcSupported ? {
      [CONFIG.NFC_SERVICE_UUID]: {
        [CONFIG.NFC_CHARACTERISTIC_UUID]: {
          value: [0],
          maxLen: 20,
          readable: true,
          notify: true
        }
      }
    } : {})
  }, { advertise: [CONFIG.BLE_SERVICE_UUID] });

  // Connection event handlers
  NRF.on('connect', handleConnect);
  NRF.on('disconnect', handleDisconnect);
  
  // Initial advertising setup
  updateAdvertising();
}

// Handle device connection
function handleConnect() {
  console.log("Device connected");
  deviceState.isConnected = true;
  
  // Connection feedback
  connectionFeedback();
  
  // Start heartbeat
  startHeartbeat();
  
  // Send initial status
  setTimeout(() => {
    sendStatusPacket();
  }, 500);
}

// Handle device disconnection
function handleDisconnect() {
  console.log("Device disconnected");
  deviceState.isConnected = false;
  deviceState.sessionActive = false;
  
  // Stop heartbeat
  stopHeartbeat();
  
  // Disconnection feedback
  disconnectionFeedback();
  
  // Reset NFC state
  deviceState.nfcDetected = false;
  deviceState.aggressiveAdvertising = false;
  updateAdvertising();
}

// Update advertising parameters based on NFC state
function updateAdvertising() {
  var interval = deviceState.aggressiveAdvertising ? 20 : 375; // Fast or normal
  
  NRF.setAdvertising({
    interval: interval
  }, {
    name: CONFIG.DEVICE_NAME,
    connectable: true
  });
  
  console.log("Advertising updated - interval:", interval + "ms");
}

// Handle incoming commands from iOS app
function handleIncomingCommand(data) {
  if (data.length === 0) return;
  
  var command = data[0];
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
      console.log("Unknown command:", command);
  }
}

// Handle NFC acknowledgment from app
function handleNFCAck() {
  console.log("NFC detection acknowledged by app");
  // Reset NFC detection state
  deviceState.nfcDetected = false;
  deviceState.aggressiveAdvertising = false;
  updateAdvertising();
}

// Setup accelerometer
function setupAccelerometer() {
  try {
    // Configure accelerometer
    var puck = require("Puck");
    puck.accelOn(CONFIG.SAMPLE_RATE);
    console.log("Accelerometer configured at", CONFIG.SAMPLE_RATE, "Hz");
  } catch (e) {
    console.log("Accelerometer setup failed:", e.message);
  }
}

// Calibrate device accelerometer baseline
function calibrateDevice() {
  console.log("Starting calibration...");
  calibrationFeedback();
  
  var samples = [];
  var sampleCount = 0;
  
  var calibrationInterval = setInterval(() => {
    try {
      var puck = require("Puck");
      var accel = puck.accel();
      samples.push(accel);
      sampleCount++;
      
      if (sampleCount >= CONFIG.CALIBRATION_SAMPLES) {
        clearInterval(calibrationInterval);
        
        // Calculate baseline averages
        deviceState.accelBaseline = {
          x: samples.reduce((sum, s) => sum + s.x, 0) / samples.length,
          y: samples.reduce((sum, s) => sum + s.y, 0) / samples.length,
          z: samples.reduce((sum, s) => sum + s.z, 0) / samples.length
        };
        
        deviceState.isCalibrated = true;
        console.log("Calibration complete:", deviceState.accelBaseline);
        
        calibrationCompleteFeedback();
        
        // Send status update
        if (deviceState.isConnected) {
          sendStatusPacket();
        }
      }
    } catch (e) {
      console.log("Calibration error:", e.message);
      clearInterval(calibrationInterval);
    }
  }, 1000 / CONFIG.SAMPLE_RATE);
}

// Start workout session
function startSession() {
  if (!deviceState.isCalibrated) {
    console.log("Cannot start session - device not calibrated");
    return;
  }
  
  console.log("Starting workout session");
  deviceState.sessionActive = true;
  
  sessionStartFeedback();
  startMotionMonitoring();
  
  // Send status update
  sendStatusPacket();
}

// End workout session
function endSession() {
  console.log("Ending workout session");
  deviceState.sessionActive = false;
  
  sessionEndFeedback();
  
  // Send status update
  sendStatusPacket();
}

// Start monitoring motion for rep detection
function startMotionMonitoring() {
  if (deviceState.motionInterval) {
    clearInterval(deviceState.motionInterval);
  }
  
  deviceState.motionInterval = setInterval(() => {
    if (!deviceState.sessionActive) {
      clearInterval(deviceState.motionInterval);
      return;
    }
    
    try {
      var puck = require("Puck");
      var accel = puck.accel();
      
      // Calculate motion magnitude relative to baseline
      var motionMagnitude = calculateMotionMagnitude(accel);
      
      // Check for rep
      if (motionMagnitude > CONFIG.MOTION_THRESHOLD) {
        checkForRep();
      }
    } catch (e) {
      console.log("Motion monitoring error:", e.message);
    }
  }, 1000 / CONFIG.SAMPLE_RATE);
}

// Calculate motion magnitude with weighted components
function calculateMotionMagnitude(accel) {
  var dx = accel.x - deviceState.accelBaseline.x;
  var dy = accel.y - deviceState.accelBaseline.y;
  var dz = accel.z - deviceState.accelBaseline.z;
  
  // Weighted magnitude calculation (emphasize vertical movement)
  return Math.sqrt(dx * dx + dy * dy * 2 + dz * dz);
}

// Check if motion qualifies as a rep
function checkForRep() {
  var now = Date.now();
  
  // Enforce cooldown period
  if (now - deviceState.lastRepTime < CONFIG.REP_COOLDOWN) {
    return;
  }
  
  registerRep();
}

// Register a new rep
function registerRep() {
  deviceState.repCount++;
  deviceState.lastRepTime = Date.now();
  
  console.log("Rep registered:", deviceState.repCount);
  
  // Visual feedback
  repDetectedFeedback();
  
  // Send rep update to app
  if (deviceState.isConnected) {
    sendRepPacket();
  }
}

// Reset rep count
function resetRepCount() {
  deviceState.repCount = 0;
  deviceState.lastRepTime = 0;
  console.log("Rep count reset");
  
  // Send update to app
  if (deviceState.isConnected) {
    sendRepPacket();
  }
}

// Send rep count packet
function sendRepPacket() {
  var packet = new Uint8Array([
    PACKET_TYPE.REP_COUNT,
    deviceState.repCount & 0xFF,
    (deviceState.repCount >> 8) & 0xFF,
    calculateChecksum([PACKET_TYPE.REP_COUNT, deviceState.repCount & 0xFF, (deviceState.repCount >> 8) & 0xFF])
  ]);
  
  transmitPacket(packet);
}

// Send status packet
function sendStatusPacket() {
  var statusByte = 0;
  if (deviceState.isCalibrated) statusByte |= 0x01;
  if (deviceState.sessionActive) statusByte |= 0x02;
  if (deviceState.nfcSupported) statusByte |= 0x04;
  if (deviceState.nfcDetected) statusByte |= 0x08;
  
  var packet = new Uint8Array([
    PACKET_TYPE.STATUS,
    statusByte,
    deviceState.batteryLevel,
    calculateChecksum([PACKET_TYPE.STATUS, statusByte, deviceState.batteryLevel])
  ]);
  
  transmitPacket(packet);
}

// Send NFC detection packet
function sendNFCDetectionPacket() {
  var packet = new Uint8Array([
    PACKET_TYPE.NFC_DETECTION,
    0x01, // NFC detected
    0x00, // Reserved
    calculateChecksum([PACKET_TYPE.NFC_DETECTION, 0x01, 0x00])
  ]);
  
  transmitPacket(packet);
}

// Send heartbeat packet
function sendHeartbeat() {
  var packet = new Uint8Array([
    PACKET_TYPE.HEARTBEAT,
    Date.now() & 0xFF,
    (Date.now() >> 8) & 0xFF,
    calculateChecksum([PACKET_TYPE.HEARTBEAT, Date.now() & 0xFF, (Date.now() >> 8) & 0xFF])
  ]);
  
  transmitPacket(packet);
}

// Transmit packet over BLE
function transmitPacket(packet) {
  if (!deviceState.isConnected) return;
  
  try {
    NRF.updateServices({
      [CONFIG.BLE_SERVICE_UUID]: {
        [CONFIG.BLE_CHARACTERISTIC_UUID]: {
          value: Array.from(packet),
          notify: true
        }
      }
    });
  } catch (e) {
    console.log("Transmission error:", e.message);
  }
}

// Calculate simple checksum
function calculateChecksum(data) {
  return data.reduce((sum, byte) => (sum + byte) & 0xFF, 0);
}

// Heartbeat management
var heartbeatInterval;

function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  heartbeatInterval = setInterval(() => {
    if (deviceState.isConnected) {
      sendHeartbeat();
    }
  }, CONFIG.HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Button handling
function setupButtons() {
  var buttonPressTime = 0;
  var longPressThreshold = 2000; // 2 seconds
  
  setWatch(function() {
    buttonPressTime = Date.now();
  }, BTN, { edge: "rising", repeat: true });
  
  setWatch(function() {
    var pressDuration = Date.now() - buttonPressTime;
    
    if (pressDuration > longPressThreshold) {
      // Long press - reset rep count
      resetRepCount();
      longPressFeedback();
    } else {
      // Short press - toggle session
      if (deviceState.sessionActive) {
        endSession();
      } else if (deviceState.isCalibrated) {
        startSession();
      }
    }
  }, BTN, { edge: "falling", repeat: true });
}

// Power management
function setupPowerManagement() {
  setInterval(() => {
    try {
      var puck = require("Puck");
      deviceState.batteryLevel = Math.round(puck.getBatteryPercentage());
      
      if (deviceState.batteryLevel < 20) {
        lowBatteryFeedback();
      }
      
      // Send battery update if connected
      if (deviceState.isConnected) {
        var packet = new Uint8Array([
          PACKET_TYPE.BATTERY,
          deviceState.batteryLevel,
          0x00,
          calculateChecksum([PACKET_TYPE.BATTERY, deviceState.batteryLevel, 0x00])
        ]);
        transmitPacket(packet);
      }
    } catch (e) {
      console.log("Battery check error:", e.message);
    }
  }, CONFIG.BATTERY_CHECK_INTERVAL);
}

// LED Feedback Functions
function repDetectedFeedback() {
  LED2.set();
  setTimeout(() => LED2.reset(), 100);
}

function connectionFeedback() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      LED1.set();
      setTimeout(() => LED1.reset(), 100);
    }, i * 200);
  }
}

function disconnectionFeedback() {
  for (let i = 0; i < 2; i++) {
    setTimeout(() => {
      LED3.set();
      setTimeout(() => LED3.reset(), 200);
    }, i * 400);
  }
}

function calibrationFeedback() {
  var blinkCount = 0;
  var calibrationBlink = setInterval(() => {
    LED1.toggle();
    blinkCount++;
    if (blinkCount > 10) {
      clearInterval(calibrationBlink);
      LED1.reset();
    }
  }, 100);
}

function calibrationCompleteFeedback() {
  LED1.set();
  LED2.set();
  LED3.set();
  setTimeout(() => {
    LED1.reset();
    LED2.reset();
    LED3.reset();
  }, 500);
}

function sessionStartFeedback() {
  LED2.set();
  setTimeout(() => LED2.reset(), 300);
}

function sessionEndFeedback() {
  LED3.set();
  setTimeout(() => LED3.reset(), 300);
}

function nfcDetectedFeedback() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      LED1.set();
      LED2.set();
      setTimeout(() => {
        LED1.reset();
        LED2.reset();
      }, 50);
    }, i * 100);
  }
}

function lowBatteryFeedback() {
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      LED3.toggle();
    }, i * 100);
  }
  setTimeout(() => LED3.reset(), 1100);
}

function longPressFeedback() {
  LED1.set();
  LED3.set();
  setTimeout(() => {
    LED1.reset();
    LED3.reset();
  }, 200);
}

// Startup sequence
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

// Error handling
process.on('uncaughtException', function(e) {
  console.log("ERROR:", e.message);
  
  // Error LED feedback
  for (let i = 0; i < 20; i++) {
    setTimeout(() => LED3.toggle(), i * 50);
  }
  
  // Try to send error packet if connected
  if (deviceState.isConnected) {
    try {
      var packet = new Uint8Array([
        PACKET_TYPE.ERROR,
        0xFF, // Error code
        0x00,
        calculateChecksum([PACKET_TYPE.ERROR, 0xFF, 0x00])
      ]);
      transmitPacket(packet);
    } catch (err) {
      console.log("Failed to send error packet");
    }
  }
});

// Initialize after short delay
setTimeout(init, 500);

// Save to flash
save();