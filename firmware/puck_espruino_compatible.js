// TapFit Puck.js Firmware - Espruino Compatible Version
// Fixed: Computed property syntax, object notation compatibility

// ========== CONFIGURATION ==========
var CONFIG = {
  DEVICE_NAME: "TapFit_Puck",
  FIRMWARE_VERSION: "8.1",
  ACCEL_SAMPLE_RATE: 26,
  REP_THRESHOLD: 0.8,
  REP_COOLDOWN: 800,
  NFC_URL: "https://tapfit-ai-sync.lovable.app/pair?station=TAPFIT01",
  DEBUG: true
};

// ========== BLE SERVICE UUIDs ==========
var NORDIC_UART_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
var NORDIC_UART_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
var NORDIC_UART_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// ========== PACKET TYPES ==========
var PACKET_TYPES = {
  REP: 0x01,
  STATUS: 0x02,
  NFC_DETECTION: 0x03,
  HEARTBEAT: 0x04,
  ERROR: 0x05
};

// ========== DEVICE STATE ==========
var deviceState = {
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

// ========== GLOBAL VARIABLES ==========
var heartbeatTimer = null;
var monitoringTimer = null;

// ========== UTILITY FUNCTIONS ==========
function log(message) {
  if (CONFIG.DEBUG) {
    console.log("[TapFit] " + message);
  }
}

function calculateChecksum(data) {
  var sum = 0;
  for (var i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum & 0xFF;
}

// ========== LED FEEDBACK ==========
function ledSuccess() {
  digitalPulse(LED1, 1, 100);
  setTimeout(function() {
    digitalPulse(LED1, 1, 100);
  }, 150);
}

function ledError() {
  digitalPulse(LED2, 1, 300);
}

function ledConnected() {
  digitalPulse(LED3, 1, 500);
}

function ledNFC() {
  digitalPulse(LED1, 1, 50);
  setTimeout(function() {
    digitalPulse(LED2, 1, 50);
  }, 100);
  setTimeout(function() {
    digitalPulse(LED3, 1, 50);
  }, 200);
}

function startupSequence() {
  digitalPulse(LED1, 1, 200);
  setTimeout(function() {
    digitalPulse(LED2, 1, 200);
  }, 300);
  setTimeout(function() {
    digitalPulse(LED3, 1, 200);
  }, 600);
}

// ========== NFC SETUP ==========
function setupNFC() {
  try {
    NRF.nfcURL(CONFIG.NFC_URL);
    
    NRF.on('NFCrx', function(data) {
      log("NFC field detected");
      deviceState.nfcDetected = true;
      ledNFC();
      sendNFCDetectionPacket();
      startAggressiveAdvertising();
    });
    
    log("NFC configured");
    return true;
  } catch (e) {
    log("NFC setup failed: " + e.message);
    return false;
  }
}

// ========== BLE SETUP ==========
function setupBLE() {
  try {
    // Set device name and advertising
    NRF.setAdvertising({}, {
      name: CONFIG.DEVICE_NAME,
      showName: true,
      discoverable: true,
      connectable: true
    });

    // Create service object using standard notation
    var serviceObj = {};
    serviceObj[NORDIC_UART_SERVICE] = {};
    
    // TX Characteristic (write from app to puck)
    var txCharObj = {
      value: [0],
      maxLen: 20,
      writable: true,
      onWrite: function(evt) {
        handleIncomingCommand(evt.data);
      }
    };
    
    // RX Characteristic (notify from puck to app)
    var rxCharObj = {
      value: [0],
      maxLen: 20,
      readable: true,
      notify: true
    };
    
    serviceObj[NORDIC_UART_SERVICE][NORDIC_UART_TX] = txCharObj;
    serviceObj[NORDIC_UART_SERVICE][NORDIC_UART_RX] = rxCharObj;
    
    NRF.setServices(serviceObj, { uart: false });
    
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
    interval: 20
  });
  
  log("Aggressive advertising started");
  
  setTimeout(function() {
    NRF.setAdvertising({}, {
      name: CONFIG.DEVICE_NAME,
      showName: true,
      discoverable: true,
      connectable: true,
      interval: 375
    });
    log("Normal advertising resumed");
  }, 30000);
}

// ========== PACKET TRANSMISSION ==========
function transmitPacket(packetType, data) {
  if (!deviceState.isConnected) {
    return false;
  }

  try {
    var packet = [packetType];
    if (data && data.length > 0) {
      packet = packet.concat(data);
    }
    
    var checksum = calculateChecksum(packet);
    packet.push(checksum);
    
    if (packet.length > 20) {
      packet = packet.slice(0, 19);
      packet.push(calculateChecksum(packet));
    }
    
    // Update service using standard notation
    var updateObj = {};
    updateObj[NORDIC_UART_SERVICE] = {};
    updateObj[NORDIC_UART_SERVICE][NORDIC_UART_RX] = {
      value: packet,
      notify: true
    };
    
    NRF.updateServices(updateObj);
    return true;
  } catch (e) {
    log("Transmission failed: " + e.message);
    return false;
  }
}

// ========== PACKET SENDERS ==========
function sendRepPacket() {
  var timestamp = Math.floor((getTime() - deviceState.sessionStartTime) * 1000);
  var data = [
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
  var data = [
    deviceState.repCount & 0xFF,
    (deviceState.repCount >> 8) & 0xFF,
    deviceState.batteryLevel,
    deviceState.isSessionActive ? 1 : 0,
    deviceState.isCalibrating ? 1 : 0
  ];
  transmitPacket(PACKET_TYPES.STATUS, data);
}

function sendNFCDetectionPacket() {
  var timestamp = Math.floor(getTime() * 1000);
  var data = [
    timestamp & 0xFF,
    (timestamp >> 8) & 0xFF,
    (timestamp >> 16) & 0xFF,
    (timestamp >> 24) & 0xFF
  ];
  transmitPacket(PACKET_TYPES.NFC_DETECTION, data);
}

function sendHeartbeat() {
  var timestamp = Math.floor(getTime() * 1000);
  var data = [
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
  
  var command = String.fromCharCode.apply(null, data).trim();
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
  
  var samples = [];
  var sampleCount = 0;
  var maxSamples = 50;
  
  var calibrationTimer = setInterval(function() {
    try {
      var accel = Puck.accel();
      if (accel && !isNaN(accel.x) && !isNaN(accel.y) && !isNaN(accel.z)) {
        samples.push(accel);
        sampleCount++;
        
        if (sampleCount >= maxSamples) {
          clearInterval(calibrationTimer);
          
          var sumX = 0, sumY = 0, sumZ = 0;
          for (var i = 0; i < samples.length; i++) {
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
          log("Calibration complete");
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
  
  var dx = accel.x - deviceState.baseline.x;
  var dy = accel.y - deviceState.baseline.y;
  var dz = accel.z - deviceState.baseline.z;
  
  return Math.sqrt(dx*dx + dy*dy + dz*dz*2);
}

function checkForRep(motion) {
  var now = getTime() * 1000;
  
  if (now - deviceState.lastRepTime < CONFIG.REP_COOLDOWN) {
    return false;
  }
  
  if (motion > CONFIG.REP_THRESHOLD) {
    deviceState.motionBuffer.push({ motion: motion, time: now });
    
    if (deviceState.motionBuffer.length > 10) {
      deviceState.motionBuffer.shift();
    }
    
    if (deviceState.motionBuffer.length >= 3) {
      var recent = deviceState.motionBuffer.slice(-3);
      var hasHighMotion = recent[0].motion > CONFIG.REP_THRESHOLD;
      var hasLowMotion = recent[2].motion < CONFIG.REP_THRESHOLD * 0.3;
      
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
  
  monitoringTimer = setInterval(function() {
    try {
      var accel = Puck.accel();
      var motion = calculateMotionMagnitude(accel);
      deviceState.lastMotion = motion;
      
      if (checkForRep(motion)) {
        registerRep();
      }
    } catch (e) {
      log("Motion monitoring error: " + e.message);
    }
  }, 50);
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
  
  heartbeatTimer = setInterval(function() {
    if (deviceState.isConnected) {
      sendHeartbeat();
    }
  }, 5000);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// ========== BUTTON SETUP ==========
function setupButtons() {
  setWatch(function() {
    if (deviceState.isSessionActive) {
      endSession();
    } else {
      startSession();
    }
  }, BTN, { edge: "rising", debounce: 50, repeat: true });
  
  log("Button configured");
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
  
  if (deviceState.isSessionActive) {
    endSession();
  }
});

// ========== ERROR HANDLING ==========
process.on('uncaughtException', function(e) {
  log("ERROR: " + e.message);
  ledError();
  
  try {
    var errorData = [e.message.length];
    for (var i = 0; i < Math.min(e.message.length, 15); i++) {
      errorData.push(e.message.charCodeAt(i));
    }
    transmitPacket(PACKET_TYPES.ERROR, errorData);
  } catch (err) {
    // Ignore errors during error handling
  }
});

// ========== INITIALIZATION ==========
function init() {
  log("Initializing TapFit Puck v" + CONFIG.FIRMWARE_VERSION);
  
  startupSequence();
  
  var bleOk = setupBLE();
  var nfcOk = setupNFC();
  var accelOk = setupAccelerometer();
  
  if (!bleOk) {
    log("Critical: BLE setup failed");
    ledError();
    return;
  }
  
  setupButtons();
  
  setTimeout(function() {
    calibrateDevice();
  }, 2000);
  
  setInterval(updateBattery, 60000);
  
  log("TapFit Puck ready!");
  log("NFC: " + (nfcOk ? "OK" : "FAILED"));
  log("Accelerometer: " + (accelOk ? "OK" : "FAILED"));
  
  ledSuccess();
}

// ========== START FIRMWARE ==========
setTimeout(init, 1000);