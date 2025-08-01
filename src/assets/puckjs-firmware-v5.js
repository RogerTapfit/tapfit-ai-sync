/*
 * TapFit Enhanced Puck.js Firmware v5.0
 * Advanced BLE fitness tracking with machine learning and robust communication
 */

// Enhanced Configuration System
var CONFIG = {
  deviceName: "TapFit-v5",
  firmwareVersion: "5.0.0",
  machineId: "default",
  
  // BLE Settings
  ble: {
    serviceUUID: "6E400001-B5A3-F393-E0A9-E50E24DCCA9E", // Nordic UART
    txUUID: "6E400002-B5A3-F393-E0A9-E50E24DCCA9E",
    rxUUID: "6E400003-B5A3-F393-E0A9-E50E24DCCA9E",
    mtu: 20,
    advertisingInterval: 100
  },
  
  // Motion Detection
  motion: {
    sampleRate: 50, // Hz
    threshold: 0.3,
    cooldown: 500, // ms
    bufferSize: 10,
    learningMode: true
  },
  
  // Power Management
  power: {
    sleepTimeout: 300000, // 5 minutes
    batteryCheckInterval: 60000, // 1 minute
    lowBatteryThreshold: 20
  }
};

// Enhanced Machine Profiles with ML parameters
var MACHINE_PROFILES = {
  "bench_press": {
    threshold: 0.4,
    axis: "z",
    pattern: "bipolar",
    cooldown: 800,
    learningRate: 0.1,
    expectedRange: [0.5, 2.0]
  },
  "squat_rack": {
    threshold: 0.35,
    axis: "y", 
    pattern: "positive",
    cooldown: 1000,
    learningRate: 0.08,
    expectedRange: [0.8, 3.0]
  },
  "lat_pulldown": {
    threshold: 0.3,
    axis: "z",
    pattern: "negative",
    cooldown: 600,
    learningRate: 0.12,
    expectedRange: [0.4, 1.5]
  },
  "default": {
    threshold: 0.3,
    axis: "magnitude",
    pattern: "any",
    cooldown: 500,
    learningRate: 0.1,
    expectedRange: [0.3, 2.0]
  }
};

// Enhanced Device State
var state = {
  // Session Data
  repCount: 0,
  sessionStartTime: null,
  lastRepTime: 0,
  sessionId: null,
  
  // Connection Status
  isConnected: false,
  lastHeartbeat: 0,
  connectionAttempts: 0,
  
  // Motion Analysis
  baseline: { x: 0, y: 0, z: 0 },
  motionBuffer: [],
  currentProfile: MACHINE_PROFILES.default,
  isCalibrated: false,
  
  // Machine Learning
  repPattern: [],
  adaptiveThreshold: CONFIG.motion.threshold,
  learningData: [],
  
  // Device Health
  batteryLevel: 100,
  temperature: 20,
  uptime: 0,
  
  // Advanced Features
  nfcTriggered: false,
  debugMode: false,
  firmwareCorruption: false
};

// Binary Protocol Definitions
var PACKET_TYPES = {
  MOTION: 0x01,
  REP: 0x02, 
  STATUS: 0x03,
  HEARTBEAT: 0x04,
  ERROR: 0x05,
  CONFIG: 0x06
};

// Enhanced BLE System
function setupBLE() {
  try {
    // Configure Nordic UART Service
    NRF.setServices({
      [CONFIG.ble.serviceUUID]: {
        [CONFIG.ble.txUUID]: {
          value: [0],
          maxLen: CONFIG.ble.mtu,
          writable: true,
          onWrite: handleBLECommand,
          readable: true,
          notify: true
        },
        [CONFIG.ble.rxUUID]: {
          value: [0],
          maxLen: CONFIG.ble.mtu,
          readable: true,
          notify: true
        }
      }
    }, { uart: false });

    updateAdvertising();
    logDebug("BLE", "Nordic UART service configured");
    return true;
  } catch (e) {
    logError("BLE", "Setup failed: " + e.message);
    return false;
  }
}

function updateAdvertising() {
  var advData = {
    0x01: 0x06, // Flags
    0x03: [CONFIG.ble.serviceUUID.slice(0,4)], // Partial service UUID
    0x09: CONFIG.deviceName,
    0xFF: [
      0x59, 0x00, // Company ID (example)
      PACKET_TYPES.STATUS,
      state.repCount & 0xFF,
      (state.repCount >> 8) & 0xFF,
      state.batteryLevel,
      state.isConnected ? 1 : 0
    ]
  };
  
  NRF.setAdvertising(advData, {
    name: CONFIG.deviceName,
    interval: CONFIG.ble.advertisingInterval,
    connectable: true
  });
}

function handleBLECommand(evt) {
  try {
    var data = evt.data;
    var command = String.fromCharCode.apply(null, data);
    
    logDebug("BLE", "Received: " + command);
    
    if (command.startsWith("{")) {
      // JSON Command Protocol
      var cmd = JSON.parse(command);
      processJSONCommand(cmd);
    } else {
      // Binary Command Protocol
      processBinaryCommand(data);
    }
  } catch (e) {
    logError("BLE", "Command processing failed: " + e.message);
    sendError("INVALID_COMMAND");
  }
}

function processJSONCommand(cmd) {
  switch (cmd.type) {
    case "reset":
      resetSession();
      sendJSON({ type: "ack", command: "reset", success: true });
      break;
      
    case "calibrate":
      calibrateBaseline();
      sendJSON({ type: "ack", command: "calibrate", success: true });
      break;
      
    case "status":
      sendFullStatus();
      break;
      
    case "configure":
      updateConfiguration(cmd.config);
      sendJSON({ type: "ack", command: "configure", success: true });
      break;
      
    case "setMachine":
      setMachineProfile(cmd.machineId);
      sendJSON({ type: "ack", command: "setMachine", machineId: cmd.machineId });
      break;
      
    case "debug":
      state.debugMode = cmd.enabled || false;
      sendJSON({ type: "ack", command: "debug", enabled: state.debugMode });
      break;
      
    default:
      sendError("UNKNOWN_COMMAND");
  }
}

function sendBinaryData(type, payload) {
  var packet = new Uint8Array(CONFIG.ble.mtu);
  packet[0] = type;
  packet[1] = payload.length;
  
  for (var i = 0; i < payload.length && i < CONFIG.ble.mtu - 2; i++) {
    packet[i + 2] = payload[i];
  }
  
  transmitChunked(packet);
}

function sendJSON(data) {
  var jsonStr = JSON.stringify(data);
  var chunks = chunkString(jsonStr, CONFIG.ble.mtu);
  
  chunks.forEach(function(chunk, index) {
    setTimeout(function() {
      NRF.updateServices({
        [CONFIG.ble.serviceUUID]: {
          [CONFIG.ble.rxUUID]: {
            value: chunk,
            notify: true
          }
        }
      });
    }, index * 50);
  });
}

function transmitChunked(data) {
  var chunks = [];
  for (var i = 0; i < data.length; i += CONFIG.ble.mtu) {
    chunks.push(data.slice(i, i + CONFIG.ble.mtu));
  }
  
  chunks.forEach(function(chunk, index) {
    setTimeout(function() {
      NRF.updateServices({
        [CONFIG.ble.serviceUUID]: {
          [CONFIG.ble.rxUUID]: {
            value: Array.from(chunk),
            notify: true
          }
        }
      });
    }, index * 20);
  });
}

// Advanced Motion Detection with Machine Learning
function setupAccelerometer() {
  try {
    Puck.accelOn(CONFIG.motion.sampleRate);
    logDebug("Accel", "Started at " + CONFIG.motion.sampleRate + "Hz");
    return true;
  } catch (e) {
    logError("Accel", "Setup failed: " + e.message);
    return false;
  }
}

function calibrateBaseline() {
  logDebug("Calibration", "Starting baseline calibration");
  flashCalibrating();
  
  var samples = [];
  var sampleCount = 50;
  
  var calibrationInterval = setInterval(function() {
    var accel = Puck.accel();
    samples.push({
      x: accel.x,
      y: accel.y, 
      z: accel.z
    });
    
    if (samples.length >= sampleCount) {
      clearInterval(calibrationInterval);
      
      // Calculate baseline
      state.baseline = {
        x: samples.reduce(function(sum, s) { return sum + s.x; }, 0) / sampleCount,
        y: samples.reduce(function(sum, s) { return sum + s.y; }, 0) / sampleCount,
        z: samples.reduce(function(sum, s) { return sum + s.z; }, 0) / sampleCount
      };
      
      state.isCalibrated = true;
      state.adaptiveThreshold = state.currentProfile.threshold;
      
      logDebug("Calibration", "Complete: " + JSON.stringify(state.baseline));
      flashSuccess();
      
      sendJSON({
        type: "calibration_complete",
        baseline: state.baseline,
        threshold: state.adaptiveThreshold
      });
    }
  }, 20);
}

function startAdvancedMonitoring() {
  if (!state.isCalibrated) {
    calibrateBaseline();
    return;
  }
  
  setInterval(function() {
    var accel = Puck.accel();
    var motion = calculateAdvancedMotion(accel);
    
    updateMotionBuffer(motion);
    
    if (checkForAdvancedRep(motion)) {
      registerEnhancedRep(motion);
    }
    
    // Send real-time motion data
    if (state.isConnected && state.debugMode) {
      sendBinaryData(PACKET_TYPES.MOTION, [
        Math.round(motion.magnitude * 100),
        Math.round(motion.x * 100),
        Math.round(motion.y * 100),
        Math.round(motion.z * 100)
      ]);
    }
  }, 1000 / CONFIG.motion.sampleRate);
}

function calculateAdvancedMotion(accel) {
  var deltaX = accel.x - state.baseline.x;
  var deltaY = accel.y - state.baseline.y;
  var deltaZ = accel.z - state.baseline.z;
  
  var magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
  
  return {
    x: deltaX,
    y: deltaY,
    z: deltaZ,
    magnitude: magnitude,
    primary: getPrimaryAxisValue(deltaX, deltaY, deltaZ),
    timestamp: Date.now()
  };
}

function getPrimaryAxisValue(x, y, z) {
  switch (state.currentProfile.axis) {
    case "x": return Math.abs(x);
    case "y": return Math.abs(y);
    case "z": return Math.abs(z);
    default: return Math.sqrt(x*x + y*y + z*z);
  }
}

function updateMotionBuffer(motion) {
  state.motionBuffer.push(motion);
  if (state.motionBuffer.length > CONFIG.motion.bufferSize) {
    state.motionBuffer.shift();
  }
}

function checkForAdvancedRep(motion) {
  var now = Date.now();
  if (now - state.lastRepTime < state.currentProfile.cooldown) {
    return false;
  }
  
  // Adaptive threshold check
  if (motion.primary < state.adaptiveThreshold) {
    return false;
  }
  
  // Pattern analysis
  if (!analyzeRepPattern()) {
    return false;
  }
  
  // Machine learning validation
  if (CONFIG.motion.learningMode && !validateWithML(motion)) {
    return false;
  }
  
  return true;
}

function analyzeRepPattern() {
  if (state.motionBuffer.length < 5) return false;
  
  var recent = state.motionBuffer.slice(-5);
  var pattern = state.currentProfile.pattern;
  
  switch (pattern) {
    case "bipolar":
      return detectBipolarPattern(recent);
    case "positive":
      return detectPositivePattern(recent);
    case "negative":
      return detectNegativePattern(recent);
    default:
      return true;
  }
}

function detectBipolarPattern(buffer) {
  var hasPositivePeak = false;
  var hasNegativeReturn = false;
  
  for (var i = 0; i < buffer.length; i++) {
    if (buffer[i].primary > state.adaptiveThreshold) {
      hasPositivePeak = true;
    }
    if (hasPositivePeak && buffer[i].primary < state.adaptiveThreshold * 0.3) {
      hasNegativeReturn = true;
    }
  }
  
  return hasPositivePeak && hasNegativeReturn;
}

function detectPositivePattern(buffer) {
  var peakCount = 0;
  for (var i = 0; i < buffer.length; i++) {
    if (buffer[i].primary > state.adaptiveThreshold) {
      peakCount++;
    }
  }
  return peakCount >= 2;
}

function detectNegativePattern(buffer) {
  var lowCount = 0;
  for (var i = 0; i < buffer.length; i++) {
    if (buffer[i].primary < state.adaptiveThreshold * 0.5) {
      lowCount++;
    }
  }
  return lowCount >= 3;
}

function validateWithML(motion) {
  // Simple ML validation - check if motion fits learned patterns
  if (state.learningData.length < 10) {
    // Still learning, accept most reps
    state.learningData.push(motion);
    return true;
  }
  
  // Calculate similarity to learned patterns
  var avgMagnitude = state.learningData.reduce(function(sum, data) {
    return sum + data.magnitude;
  }, 0) / state.learningData.length;
  
  var similarity = 1 - Math.abs(motion.magnitude - avgMagnitude) / avgMagnitude;
  
  if (similarity > 0.6) {
    // Update learning data
    state.learningData.push(motion);
    if (state.learningData.length > 50) {
      state.learningData.shift();
    }
    
    // Adapt threshold
    state.adaptiveThreshold = avgMagnitude * 0.8;
    
    return true;
  }
  
  return false;
}

function registerEnhancedRep(motion) {
  state.repCount++;
  state.lastRepTime = Date.now();
  
  if (!state.sessionStartTime) {
    state.sessionStartTime = Date.now();
    state.sessionId = "session_" + Date.now();
  }
  
  // Enhanced logging
  logDebug("Rep", "Count: " + state.repCount + ", Motion: " + motion.magnitude.toFixed(3));
  
  // Visual and haptic feedback
  flashRepSuccess();
  
  // Send enhanced rep data
  sendBinaryData(PACKET_TYPES.REP, [
    state.repCount & 0xFF,
    (state.repCount >> 8) & 0xFF,
    Math.round(motion.magnitude * 100),
    Math.round(state.adaptiveThreshold * 100)
  ]);
  
  sendJSON({
    type: "rep_detected",
    count: state.repCount,
    motion: {
      magnitude: motion.magnitude,
      primary: motion.primary,
      threshold: state.adaptiveThreshold
    },
    sessionId: state.sessionId,
    timestamp: Date.now()
  });
  
  updateAdvertising();
}

// Enhanced Visual Feedback
function flashRepSuccess() {
  // Green flash for successful rep
  LED1.set();
  setTimeout(function() { LED1.reset(); }, 100);
  setTimeout(function() { LED1.set(); }, 200);
  setTimeout(function() { LED1.reset(); }, 300);
}

function flashCalibrating() {
  // Blue breathing pattern for calibration
  var intensity = 0;
  var direction = 1;
  
  var breathe = setInterval(function() {
    LED2.set();
    setTimeout(function() { LED2.reset(); }, intensity * 10);
    
    intensity += direction * 2;
    if (intensity >= 20 || intensity <= 0) {
      direction *= -1;
    }
  }, 100);
  
  setTimeout(function() {
    clearInterval(breathe);
    LED2.reset();
  }, 3000);
}

function flashSuccess() {
  // Green celebration pattern
  for (var i = 0; i < 5; i++) {
    setTimeout(function() {
      LED1.set();
      setTimeout(function() { LED1.reset(); }, 50);
    }, i * 100);
  }
}

function flashError() {
  // Red error pattern
  for (var i = 0; i < 3; i++) {
    setTimeout(function() {
      LED3.set();
      setTimeout(function() { LED3.reset(); }, 200);
    }, i * 400);
  }
}

// Enhanced Utility Functions
function setMachineProfile(machineId) {
  CONFIG.machineId = machineId;
  
  if (MACHINE_PROFILES[machineId]) {
    state.currentProfile = MACHINE_PROFILES[machineId];
    logDebug("Profile", "Set to: " + machineId);
  } else {
    state.currentProfile = MACHINE_PROFILES.default;
    logDebug("Profile", "Unknown machine, using default");
  }
  
  // Reset learning when changing machines
  state.learningData = [];
  state.adaptiveThreshold = state.currentProfile.threshold;
  
  updateAdvertising();
}

function resetSession() {
  state.repCount = 0;
  state.sessionStartTime = null;
  state.sessionId = null;
  state.lastRepTime = 0;
  state.motionBuffer = [];
  
  logDebug("Session", "Reset complete");
  flashSuccess();
  updateAdvertising();
}

function sendFullStatus() {
  var status = {
    type: "full_status",
    firmware: CONFIG.firmwareVersion,
    device: CONFIG.deviceName,
    machineId: CONFIG.machineId,
    session: {
      repCount: state.repCount,
      sessionId: state.sessionId,
      startTime: state.sessionStartTime,
      lastRepTime: state.lastRepTime
    },
    health: {
      battery: state.batteryLevel,
      temperature: state.temperature,
      uptime: Date.now() - state.uptime,
      calibrated: state.isCalibrated
    },
    motion: {
      baseline: state.baseline,
      threshold: state.adaptiveThreshold,
      profile: state.currentProfile,
      bufferSize: state.motionBuffer.length
    },
    connection: {
      isConnected: state.isConnected,
      lastHeartbeat: state.lastHeartbeat,
      attempts: state.connectionAttempts
    }
  };
  
  sendJSON(status);
}

function sendError(errorCode) {
  sendJSON({
    type: "error", 
    code: errorCode,
    timestamp: Date.now()
  });
  
  sendBinaryData(PACKET_TYPES.ERROR, [errorCode.charCodeAt(0)]);
}

function sendHeartbeat() {
  if (state.isConnected) {
    state.lastHeartbeat = Date.now();
    sendBinaryData(PACKET_TYPES.HEARTBEAT, [
      state.batteryLevel,
      state.repCount & 0xFF,
      state.isCalibrated ? 1 : 0
    ]);
  }
}

// Enhanced NFC System
function setupNFC() {
  try {
    var nfcUrl = "https://tapfit.app/machine/" + CONFIG.machineId + 
                 "?fw=" + CONFIG.firmwareVersion + 
                 "&dev=" + CONFIG.deviceName;
    
    NRF.nfcURL(nfcUrl);
    logDebug("NFC", "URL set: " + nfcUrl);
    return true;
  } catch (e) {
    logError("NFC", "Setup failed: " + e.message);
    return false;
  }
}

// Enhanced Logging System
function logDebug(category, message) {
  if (state.debugMode) {
    console.log("[" + Date.now() + "] " + category + ": " + message);
    
    if (state.isConnected) {
      sendJSON({
        type: "debug_log",
        category: category,
        message: message,
        timestamp: Date.now()
      });
    }
  }
}

function logError(category, message) {
  console.log("[ERROR] " + category + ": " + message);
  
  if (state.isConnected) {
    sendJSON({
      type: "error_log",
      category: category,
      message: message,
      timestamp: Date.now()
    });
  }
  
  flashError();
}

// Utility Functions
function chunkString(str, size) {
  var chunks = [];
  for (var i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

function updateConfiguration(config) {
  if (config.motion) {
    Object.assign(CONFIG.motion, config.motion);
  }
  if (config.ble) {
    Object.assign(CONFIG.ble, config.ble);
  }
  if (config.power) {
    Object.assign(CONFIG.power, config.power);
  }
  
  logDebug("Config", "Updated configuration");
}

function updateBattery() {
  try {
    state.batteryLevel = Math.round(Puck.getBatteryPercentage());
    
    if (state.batteryLevel < CONFIG.power.lowBatteryThreshold) {
      logDebug("Battery", "Low battery: " + state.batteryLevel + "%");
      
      // Flash red LED for low battery
      LED3.set();
      setTimeout(function() { LED3.reset(); }, 1000);
      
      if (state.isConnected) {
        sendJSON({
          type: "low_battery_warning",
          level: state.batteryLevel,
          timestamp: Date.now()
        });
      }
    }
    
    updateAdvertising();
  } catch (e) {
    logError("Battery", "Update failed: " + e.message);
  }
}

// Enhanced Button System  
function setupButtons() {
  setWatch(function() {
    logDebug("Button", "Reset button pressed");
    resetSession();
  }, BTN, { edge: "rising", debounce: 50, repeat: true });
  
  // Long press for calibration
  var pressTime = 0;
  setWatch(function() {
    pressTime = Date.now();
  }, BTN, { edge: "rising", debounce: 50 });
  
  setWatch(function() {
    var duration = Date.now() - pressTime;
    if (duration > 3000) {
      logDebug("Button", "Long press - calibrating");
      calibrateBaseline();
    }
  }, BTN, { edge: "falling", debounce: 50 });
}

// Enhanced Connection Events
NRF.on("connect", function() {
  state.isConnected = true;
  state.connectionAttempts++;
  
  logDebug("BLE", "Device connected (attempt #" + state.connectionAttempts + ")");
  
  // Send initial status
  setTimeout(function() {
    sendFullStatus();
  }, 1000);
  
  // Start heartbeat
  setInterval(sendHeartbeat, 30000);
  
  updateAdvertising();
  flashSuccess();
});

NRF.on("disconnect", function() {
  state.isConnected = false;
  logDebug("BLE", "Device disconnected");
  updateAdvertising();
});

NRF.on("NFCTag", function() {
  state.nfcTriggered = true;
  logDebug("NFC", "Tag triggered");
  
  // Boost advertising for 30 seconds
  NRF.setAdvertising({}, { interval: 50 });
  setTimeout(function() {
    updateAdvertising();
  }, 30000);
  
  // Visual feedback
  LED1.set();
  LED2.set();
  setTimeout(function() {
    LED1.reset();
    LED2.reset();
  }, 500);
});

// Enhanced Startup Sequence
function startupSequence() {
  logDebug("Startup", "TapFit v" + CONFIG.firmwareVersion + " initializing");
  
  // LED startup pattern
  LED1.set();
  setTimeout(function() {
    LED1.reset();
    LED2.set();
    setTimeout(function() {
      LED2.reset();
      LED3.set();
      setTimeout(function() {
        LED3.reset();
      }, 200);
    }, 200);
  }, 200);
}

// Enhanced Initialization
function init() {
  try {
    state.uptime = Date.now();
    
    startupSequence();
    
    // Initialize systems
    if (!setupBLE()) {
      logError("Init", "BLE setup failed");
      return false;
    }
    
    if (!setupNFC()) {
      logError("Init", "NFC setup failed");
    }
    
    if (!setupAccelerometer()) {
      logError("Init", "Accelerometer setup failed");
      return false;
    }
    
    setupButtons();
    
    // Initial calibration
    setTimeout(calibrateBaseline, 2000);
    
    // Start monitoring after calibration
    setTimeout(startAdvancedMonitoring, 5000);
    
    // Background tasks
    setInterval(updateBattery, CONFIG.power.batteryCheckInterval);
    setInterval(function() {
      logDebug("Heartbeat", "Uptime: " + (Date.now() - state.uptime) + "ms, Reps: " + state.repCount);
    }, 300000); // Every 5 minutes
    
    logDebug("Init", "System initialization complete");
    flashSuccess();
    
    return true;
  } catch (e) {
    logError("Init", "Initialization failed: " + e.message);
    state.firmwareCorruption = true;
    flashError();
    return false;
  }
}

// Global Error Handler
process.on("uncaughtException", function(err) {
  logError("System", "Uncaught exception: " + err.message);
  
  // Attempt recovery
  setTimeout(function() {
    logDebug("Recovery", "Attempting system recovery");
    init();
  }, 5000);
});

// Auto-start the enhanced firmware
setTimeout(init, 1000);

// Export configuration for external access
this.TapFitConfig = CONFIG;
this.TapFitState = state;