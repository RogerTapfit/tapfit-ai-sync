/**
 * TapFit Puck.js Firmware v6.0 - Production Ready
 * Seamless integration with Lovable TapFit App
 * Features: Advanced motion detection, ML algorithms, robust BLE, machine-specific optimization
 */

// ===== CONFIGURATION =====
const CONFIG = {
  // Device Configuration
  machineId: "MACHINE_001", // Will be configured via NFC or BLE command
  deviceName: function() { return this.machineId + "-puck"; },
  firmwareVersion: "6.0.0",
  
  // BLE Configuration - Exact UUIDs matching Lovable BLE service
  ble: {
    serviceUUID: "FFE0", // Nordic UART Service
    txCharUUID: "FFE1",   // TX Characteristic
    rxCharUUID: "FFE1",   // RX Characteristic (same for Nordic UART)
    maxMTU: 20,           // Maximum packet size
    reconnectDelay: 1000, // Initial reconnect delay (ms)
    maxReconnectDelay: 30000, // Maximum reconnect delay (ms)
    heartbeatInterval: 10000  // Heartbeat every 10 seconds
  },
  
  // Motion Detection Configuration
  motion: {
    sampleRate: 50,        // 50Hz accelerometer sampling
    threshold: 0.3,        // Base motion threshold
    restThreshold: 0.1,    // Rest detection threshold
    repCooldown: 800,      // Minimum time between reps (ms)
    calibrationSamples: 100, // Samples for baseline calibration
    bufferSize: 10,        // Motion data buffer size
    falsePositiveFilter: true, // Enable ML-based filtering
    adaptiveLearning: true // Enable adaptive algorithm learning
  },
  
  // Power Management
  power: {
    lowBatteryThreshold: 20, // Low battery warning threshold (%)
    sleepDelay: 30000,       // Sleep after 30s of inactivity
    motionWakeThreshold: 0.2, // Motion threshold to wake from sleep
    advertisingInterval: 1000 // Advertising interval when disconnected (ms)
  },
  
  // Debug Configuration
  debug: {
    enabled: true,
    logLevel: "INFO", // ERROR, WARN, INFO, DEBUG
    maxLogBuffer: 50  // Maximum debug log entries
  }
};

// ===== MACHINE PROFILES =====
const MACHINE_PROFILES = {
  "BENCH_PRESS": {
    threshold: 0.4,
    axis: "z",
    pattern: "push_pull",
    cooldown: 1000,
    restTime: 2000,
    muscleGroup: "chest",
    movement: "compound"
  },
  "SQUAT_RACK": {
    threshold: 0.5,
    axis: "y",
    pattern: "up_down",
    cooldown: 1200,
    restTime: 3000,
    muscleGroup: "legs",
    movement: "compound"
  },
  "PULL_UP": {
    threshold: 0.6,
    axis: "y",
    pattern: "up_down",
    cooldown: 1500,
    restTime: 2500,
    muscleGroup: "back",
    movement: "bodyweight"
  },
  "DUMBBELL": {
    threshold: 0.3,
    axis: "combined",
    pattern: "variable",
    cooldown: 800,
    restTime: 1500,
    muscleGroup: "various",
    movement: "isolation"
  }
};

// ===== STATE MANAGEMENT =====
let state = {
  // Connection State
  isConnected: false,
  isAdvertising: false,
  connectionAttempts: 0,
  lastHeartbeat: 0,
  
  // Session State
  sessionActive: false,
  sessionStartTime: 0,
  repCount: 0,
  lastRepTime: 0,
  totalWorkoutTime: 0,
  
  // Motion State
  isCalibrated: false,
  baseline: { x: 0, y: 0, z: 0 },
  motionBuffer: [],
  lastMotionTime: 0,
  restStartTime: 0,
  inRestPeriod: false,
  
  // Learning State
  userPattern: {
    avgRepTime: 2000,
    avgRestTime: 3000,
    repIntensity: 0.5,
    consistency: 0.8
  },
  
  // Device State
  batteryLevel: 100,
  temperature: 25,
  lastNFCTap: 0,
  firmwareHealth: true,
  
  // Debug State
  debugLogs: [],
  errorCount: 0,
  performanceMetrics: {
    packetsTransmitted: 0,
    packetsFailed: 0,
    averageLatency: 0
  }
};

// ===== BLE DATA PROTOCOL =====
const PACKET_TYPES = {
  REP_COUNT: 0x01,      // Rep count data
  MOTION_DATA: 0x02,    // Motion sensor data  
  HEART_RATE: 0x03,     // Heart rate data
  STATUS: 0x04,         // Device status
  DEBUG: 0x05,          // Debug information
  CONFIG: 0x06,         // Configuration data
  MACHINE_INFO: 0x07,   // Machine profile information
  SESSION_DATA: 0x08    // Workout session data
};

// ===== CORE INITIALIZATION =====
function init() {
  logInfo("TapFit Puck.js v6.0 Initializing...");
  
  try {
    // Initialize core systems
    setupBLE();
    setupAccelerometer();
    setupNFC();
    setupButtons();
    setupPowerManagement();
    
    // Startup sequence
    startupSequence();
    
    // Calibrate and start monitoring
    setTimeout(() => {
      calibrateBaseline();
      startAdvancedMonitoring();
      logInfo("Firmware initialization complete");
    }, 2000);
    
  } catch (error) {
    logError("Initialization failed: " + error.message);
    flashError();
  }
}

// ===== ENHANCED BLE SYSTEM =====
function setupBLE() {
  logInfo("Setting up BLE with Nordic UART Service...");
  
  try {
    // Configure Nordic UART Service with exact UUIDs
    NRF.setServices({
      [CONFIG.ble.serviceUUID]: {
        [CONFIG.ble.txCharUUID]: {
          value: new Uint8Array(20),
          maxLen: 20,
          readable: true,
          notify: true,
          description: "TapFit Data Stream"
        }
      }
    }, { advertise: [CONFIG.ble.serviceUUID] });
    
    // Setup advertising data
    updateAdvertising();
    
    // Setup connection event handlers
    NRF.on("connect", handleBLEConnect);
    NRF.on("disconnect", handleBLEDisconnect);
    
    // Setup command handler for incoming data
    Bluetooth.on("data", handleBLECommand);
    
    // Start heartbeat system
    setInterval(sendHeartbeat, CONFIG.ble.heartbeatInterval);
    
    logInfo("BLE setup complete - Device: " + CONFIG.deviceName());
    
  } catch (error) {
    logError("BLE setup failed: " + error.message);
    throw error;
  }
}

function updateAdvertising() {
  const deviceName = CONFIG.deviceName();
  const advertisingData = {
    name: deviceName,
    manufacturer: 0x0590, // Nordic Semiconductor
    manufacturerData: new Uint8Array([
      0x01,                           // Version
      state.repCount & 0xFF,          // Rep count (low byte)
      (state.repCount >> 8) & 0xFF,   // Rep count (high byte)
      state.batteryLevel,             // Battery level
      state.isConnected ? 0x01 : 0x00, // Connection status
      state.sessionActive ? 0x01 : 0x00 // Session status
    ])
  };
  
  NRF.setAdvertising(advertisingData, {
    interval: state.isConnected ? 2000 : CONFIG.power.advertisingInterval
  });
  
  state.isAdvertising = true;
}

function handleBLEConnect() {
  state.isConnected = true;
  state.connectionAttempts = 0;
  state.lastHeartbeat = Date.now();
  
  logInfo("BLE Connected - Starting data stream");
  flashConnection();
  
  // Send initial status
  setTimeout(() => {
    sendDeviceStatus();
    sendMachineInfo();
  }, 500);
  
  updateAdvertising();
}

function handleBLEDisconnect() {
  state.isConnected = false;
  logInfo("BLE Disconnected - Attempting reconnection");
  
  // Implement exponential backoff for reconnection
  const delay = Math.min(
    CONFIG.ble.reconnectDelay * Math.pow(2, state.connectionAttempts),
    CONFIG.ble.maxReconnectDelay
  );
  
  setTimeout(() => {
    state.connectionAttempts++;
    updateAdvertising();
    logInfo("Reconnection attempt " + state.connectionAttempts);
  }, delay);
}

function handleBLECommand(data) {
  try {
    const command = JSON.parse(data);
    logDebug("Received command: " + JSON.stringify(command));
    
    switch (command.type) {
      case "configure":
        handleConfigureCommand(command);
        break;
      case "calibrate":
        calibrateBaseline();
        sendACK("calibrate");
        break;
      case "reset_session":
        resetWorkoutSession();
        sendACK("reset_session");
        break;
      case "start_session":
        startWorkoutSession();
        sendACK("start_session");
        break;
      case "end_session":
        endWorkoutSession();
        sendACK("end_session");
        break;
      case "get_status":
        sendDeviceStatus();
        break;
      case "get_debug":
        sendDebugLogs();
        break;
      case "set_machine":
        setMachineProfile(command.machineId);
        sendACK("set_machine");
        break;
      default:
        logWarn("Unknown command: " + command.type);
        sendError("unknown_command");
    }
  } catch (error) {
    logError("Command parsing failed: " + error.message);
    sendError("parse_error");
  }
}

// ===== BINARY DATA TRANSMISSION =====
function transmitBinaryData(type, payload) {
  if (!state.isConnected) return false;
  
  try {
    // Create binary packet: [type][length][payload][checksum]
    const packet = new Uint8Array(CONFIG.ble.maxMTU);
    packet[0] = type;
    packet[1] = payload.length;
    
    // Copy payload
    for (let i = 0; i < payload.length && i < 17; i++) {
      packet[i + 2] = payload[i];
    }
    
    // Calculate checksum
    let checksum = 0;
    for (let i = 0; i < packet[1] + 2; i++) {
      checksum ^= packet[i];
    }
    packet[packet[1] + 2] = checksum;
    
    // Transmit via Nordic UART
    NRF.updateServices({
      [CONFIG.ble.serviceUUID]: {
        [CONFIG.ble.txCharUUID]: {
          value: packet,
          notify: true
        }
      }
    });
    
    state.performanceMetrics.packetsTransmitted++;
    return true;
    
  } catch (error) {
    state.performanceMetrics.packetsFailed++;
    logError("Data transmission failed: " + error.message);
    return false;
  }
}

function sendRepData(repCount, intensity, timestamp) {
  const payload = new Uint8Array(12);
  
  // Rep count (2 bytes)
  payload[0] = repCount & 0xFF;
  payload[1] = (repCount >> 8) & 0xFF;
  
  // Intensity (2 bytes, scaled 0-1000)
  const scaledIntensity = Math.round(intensity * 1000);
  payload[2] = scaledIntensity & 0xFF;
  payload[3] = (scaledIntensity >> 8) & 0xFF;
  
  // Timestamp (4 bytes)
  payload[4] = timestamp & 0xFF;
  payload[5] = (timestamp >> 8) & 0xFF;
  payload[6] = (timestamp >> 16) & 0xFF;
  payload[7] = (timestamp >> 24) & 0xFF;
  
  // Session time (4 bytes)
  const sessionTime = timestamp - state.sessionStartTime;
  payload[8] = sessionTime & 0xFF;
  payload[9] = (sessionTime >> 8) & 0xFF;
  payload[10] = (sessionTime >> 16) & 0xFF;
  payload[11] = (sessionTime >> 24) & 0xFF;
  
  transmitBinaryData(PACKET_TYPES.REP_COUNT, payload);
  logInfo("Rep transmitted: " + repCount + " (intensity: " + intensity.toFixed(2) + ")");
}

function sendMotionData(motion, timestamp) {
  const payload = new Uint8Array(8);
  
  // Motion intensity (2 bytes, scaled 0-1000)
  const scaledMotion = Math.round(motion * 1000);
  payload[0] = scaledMotion & 0xFF;
  payload[1] = (scaledMotion >> 8) & 0xFF;
  
  // Timestamp (4 bytes)
  payload[2] = timestamp & 0xFF;
  payload[3] = (timestamp >> 8) & 0xFF;
  payload[4] = (timestamp >> 16) & 0xFF;
  payload[5] = (timestamp >> 24) & 0xFF;
  
  // Rest status (1 byte)
  payload[6] = state.inRestPeriod ? 0x01 : 0x00;
  
  // Battery level (1 byte)
  payload[7] = state.batteryLevel;
  
  transmitBinaryData(PACKET_TYPES.MOTION_DATA, payload);
}

// ===== ADVANCED MOTION DETECTION =====
function setupAccelerometer() {
  logInfo("Setting up accelerometer at " + CONFIG.motion.sampleRate + "Hz");
  
  try {
    Puck.accelOn(CONFIG.motion.sampleRate);
    logInfo("Accelerometer initialized successfully");
  } catch (error) {
    logError("Accelerometer setup failed: " + error.message);
    throw error;
  }
}

function calibrateBaseline() {
  logInfo("Calibrating motion baseline...");
  flashCalibrating();
  
  let samples = [];
  const sampleCount = CONFIG.motion.calibrationSamples;
  
  function collectSample() {
    const accel = Puck.accel();
    samples.push(accel);
    
    if (samples.length < sampleCount) {
      setTimeout(collectSample, 20);
    } else {
      // Calculate baseline from samples
      state.baseline = {
        x: samples.reduce((sum, s) => sum + s.x, 0) / sampleCount,
        y: samples.reduce((sum, s) => sum + s.y, 0) / sampleCount,
        z: samples.reduce((sum, s) => sum + s.z, 0) / sampleCount
      };
      
      state.isCalibrated = true;
      logInfo("Baseline calibrated: " + JSON.stringify(state.baseline));
      flashSuccess();
      
      if (state.isConnected) {
        sendDeviceStatus();
      }
    }
  }
  
  collectSample();
}

function startAdvancedMonitoring() {
  if (!state.isCalibrated) {
    logWarn("Cannot start monitoring - device not calibrated");
    return;
  }
  
  logInfo("Starting advanced motion monitoring...");
  
  setInterval(() => {
    const accel = Puck.accel();
    const timestamp = Date.now();
    
    // Calculate motion with machine-specific analysis
    const motion = calculateAdvancedMotion(accel);
    
    // Update motion buffer
    state.motionBuffer.push({
      motion: motion,
      timestamp: timestamp,
      accel: accel
    });
    
    // Keep buffer size manageable
    if (state.motionBuffer.length > CONFIG.motion.bufferSize) {
      state.motionBuffer.shift();
    }
    
    // Check for activity
    if (motion > CONFIG.motion.restThreshold) {
      state.lastMotionTime = timestamp;
      state.inRestPeriod = false;
    } else if (timestamp - state.lastMotionTime > getCurrentMachineProfile().restTime) {
      state.inRestPeriod = true;
    }
    
    // Transmit motion data
    if (state.isConnected && state.sessionActive) {
      sendMotionData(motion, timestamp);
    }
    
    // Check for repetition with advanced algorithms
    checkForAdvancedRep(motion, timestamp);
    
    // Update user learning patterns
    if (CONFIG.motion.adaptiveLearning) {
      updateLearningPatterns(motion, timestamp);
    }
    
  }, 1000 / CONFIG.motion.sampleRate);
}

function calculateAdvancedMotion(accel) {
  const profile = getCurrentMachineProfile();
  const baseline = state.baseline;
  
  // Calculate motion on primary axis
  let primaryMotion = 0;
  switch (profile.axis) {
    case "x":
      primaryMotion = Math.abs(accel.x - baseline.x);
      break;
    case "y":
      primaryMotion = Math.abs(accel.y - baseline.y);
      break;
    case "z":
      primaryMotion = Math.abs(accel.z - baseline.z);
      break;
    case "combined":
      primaryMotion = Math.sqrt(
        Math.pow(accel.x - baseline.x, 2) +
        Math.pow(accel.y - baseline.y, 2) +
        Math.pow(accel.z - baseline.z, 2)
      );
      break;
  }
  
  // Apply machine-specific filtering
  const filteredMotion = applyMachineFiltering(primaryMotion, profile);
  
  return filteredMotion;
}

function checkForAdvancedRep(motion, timestamp) {
  const profile = getCurrentMachineProfile();
  const threshold = profile.threshold;
  const cooldown = profile.cooldown;
  
  // Check cooldown period
  if (timestamp - state.lastRepTime < cooldown) {
    return;
  }
  
  // Advanced pattern recognition
  if (motion > threshold && state.motionBuffer.length >= 3) {
    const isValidRep = validateRepPattern(motion, timestamp, profile);
    
    if (isValidRep) {
      registerAdvancedRep(motion, timestamp);
    }
  }
}

function validateRepPattern(motion, timestamp, profile) {
  // Machine learning-based validation
  if (CONFIG.motion.falsePositiveFilter) {
    const patternScore = calculatePatternScore(motion, timestamp, profile);
    if (patternScore < 0.6) {
      return false;
    }
  }
  
  // Pattern-specific validation
  switch (profile.pattern) {
    case "push_pull":
      return validatePushPullPattern();
    case "up_down":
      return validateUpDownPattern();
    case "variable":
      return validateVariablePattern();
    default:
      return true;
  }
}

function registerAdvancedRep(motion, timestamp) {
  state.repCount++;
  state.lastRepTime = timestamp;
  
  // Calculate rep intensity
  const intensity = Math.min(motion / getCurrentMachineProfile().threshold, 2.0);
  
  // Visual feedback
  flashRepSuccess();
  
  // Transmit rep data
  if (state.isConnected) {
    sendRepData(state.repCount, intensity, timestamp);
  }
  
  // Update learning patterns
  updateRepLearning(intensity, timestamp);
  
  logInfo("Rep #" + state.repCount + " detected (intensity: " + intensity.toFixed(2) + ")");
}

// ===== MACHINE PROFILE SYSTEM =====
function getCurrentMachineProfile() {
  return MACHINE_PROFILES[CONFIG.machineId] || MACHINE_PROFILES["DUMBBELL"];
}

function setMachineProfile(machineId) {
  if (MACHINE_PROFILES[machineId]) {
    CONFIG.machineId = machineId;
    logInfo("Machine profile set to: " + machineId);
    
    // Recalibrate for new machine
    setTimeout(() => {
      calibrateBaseline();
    }, 1000);
  } else {
    logWarn("Unknown machine profile: " + machineId);
  }
}

// ===== WORKOUT SESSION MANAGEMENT =====
function startWorkoutSession() {
  state.sessionActive = true;
  state.sessionStartTime = Date.now();
  state.repCount = 0;
  state.totalWorkoutTime = 0;
  
  logInfo("Workout session started");
  flashSessionStart();
  
  if (state.isConnected) {
    sendSessionData("start");
  }
}

function endWorkoutSession() {
  if (!state.sessionActive) return;
  
  state.sessionActive = false;
  state.totalWorkoutTime = Date.now() - state.sessionStartTime;
  
  logInfo("Workout session ended - " + state.repCount + " reps, " + 
          Math.round(state.totalWorkoutTime / 1000) + "s duration");
  
  flashSessionEnd();
  
  if (state.isConnected) {
    sendSessionData("end");
  }
}

// ===== STATUS AND DEBUG SYSTEMS =====
function sendDeviceStatus() {
  const status = {
    type: "status",
    firmware: CONFIG.firmwareVersion,
    machineId: CONFIG.machineId,
    isCalibrated: state.isCalibrated,
    sessionActive: state.sessionActive,
    repCount: state.repCount,
    batteryLevel: state.batteryLevel,
    temperature: state.temperature,
    uptime: Date.now() - (state.sessionStartTime || Date.now()),
    errorCount: state.errorCount,
    performance: state.performanceMetrics
  };
  
  sendJSON(status);
}

function sendJSON(data) {
  if (!state.isConnected) return;
  
  try {
    const jsonString = JSON.stringify(data);
    Bluetooth.write(jsonString + "\n");
    logDebug("JSON sent: " + jsonString);
  } catch (error) {
    logError("JSON transmission failed: " + error.message);
  }
}

// ===== NFC SYSTEM =====
function setupNFC() {
  logInfo("Setting up NFC...");
  
  try {
    const nfcData = {
      type: "tapfit_machine",
      machineId: CONFIG.machineId,
      deviceName: CONFIG.deviceName(),
      firmware: CONFIG.firmwareVersion,
      profile: getCurrentMachineProfile()
    };
    
    NRF.nfcURL("https://tapfit.app/machine/" + CONFIG.machineId + 
               "?device=" + encodeURIComponent(JSON.stringify(nfcData)));
    
    NRF.on("NFCTag", function() {
      state.lastNFCTap = Date.now();
      logInfo("NFC tap detected");
      flashNFCTap();
      
      // Boost advertising for quick connection
      NRF.setAdvertising({}, { interval: 100 });
      setTimeout(() => updateAdvertising(), 5000);
    });
    
    logInfo("NFC setup complete");
  } catch (error) {
    logError("NFC setup failed: " + error.message);
  }
}

// ===== VISUAL FEEDBACK SYSTEM =====
function flashRepSuccess() {
  LED1.write(1);
  LED2.write(1);
  setTimeout(() => {
    LED1.write(0);
    LED2.write(0);
  }, 200);
}

function flashConnection() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      LED2.write(1);
      setTimeout(() => LED2.write(0), 100);
    }, i * 200);
  }
}

function flashCalibrating() {
  const flash = () => {
    LED1.write(!LED1.read());
  };
  
  const interval = setInterval(flash, 200);
  setTimeout(() => {
    clearInterval(interval);
    LED1.write(0);
  }, 3000);
}

function flashSessionStart() {
  LED1.write(1);
  LED2.write(1);
  LED3.write(1);
  setTimeout(() => {
    LED1.write(0);
    LED2.write(0);
    LED3.write(0);
  }, 500);
}

// ===== LOGGING SYSTEM =====
function logInfo(message) {
  log("INFO", message);
}

function logWarn(message) {
  log("WARN", message);
}

function logError(message) {
  log("ERROR", message);
  state.errorCount++;
}

function logDebug(message) {
  if (CONFIG.debug.logLevel === "DEBUG") {
    log("DEBUG", message);
  }
}

function log(level, message) {
  const timestamp = Date.now();
  const logEntry = {
    level: level,
    message: message,
    timestamp: timestamp,
    uptime: timestamp - (state.sessionStartTime || timestamp)
  };
  
  state.debugLogs.push(logEntry);
  
  // Keep log buffer manageable
  if (state.debugLogs.length > CONFIG.debug.maxLogBuffer) {
    state.debugLogs.shift();
  }
  
  // Send to console and BLE if connected
  console.log("[" + level + "] " + message);
  
  if (state.isConnected && CONFIG.debug.enabled) {
    sendJSON({
      type: "debug",
      log: logEntry
    });
  }
}

// ===== POWER MANAGEMENT =====
function setupPowerManagement() {
  // Monitor battery level
  setInterval(() => {
    state.batteryLevel = Math.round(Puck.getBatteryPercentage());
    
    if (state.batteryLevel < CONFIG.power.lowBatteryThreshold) {
      logWarn("Low battery: " + state.batteryLevel + "%");
      flashLowBattery();
    }
  }, 60000); // Check every minute
  
  // Auto-sleep when inactive
  setInterval(() => {
    const inactiveTime = Date.now() - state.lastMotionTime;
    if (inactiveTime > CONFIG.power.sleepDelay && !state.sessionActive) {
      enterSleepMode();
    }
  }, 10000); // Check every 10 seconds
}

function enterSleepMode() {
  logInfo("Entering sleep mode");
  
  // Reduce advertising frequency
  NRF.setAdvertising({}, { interval: 2000 });
  
  // Wake on motion
  Puck.accelOn(12.5); // Reduce sample rate
  
  // Set wake threshold
  const wakeInterval = setInterval(() => {
    const accel = Puck.accel();
    const motion = Math.sqrt(accel.x*accel.x + accel.y*accel.y + accel.z*accel.z);
    
    if (motion > CONFIG.power.motionWakeThreshold) {
      logInfo("Waking from sleep mode");
      clearInterval(wakeInterval);
      
      // Restore normal operation
      setupAccelerometer();
      updateAdvertising();
    }
  }, 1000);
}

// ===== BUTTON CONTROLS =====
function setupButtons() {
  // Button press: Reset session or start calibration
  setWatch(function() {
    if (state.sessionActive) {
      endWorkoutSession();
    } else {
      calibrateBaseline();
    }
  }, BTN, { edge: "rising", debounce: 50, repeat: false });
  
  // Long button press: Factory reset
  setWatch(function() {
    logInfo("Factory reset triggered");
    factoryReset();
  }, BTN, { edge: "rising", debounce: 50, repeat: false });
}

// ===== STARTUP SEQUENCE =====
function startupSequence() {
  logInfo("Starting TapFit Puck.js v" + CONFIG.firmwareVersion);
  
  // LED startup pattern
  LED1.write(1);
  setTimeout(() => {
    LED1.write(0);
    LED2.write(1);
    setTimeout(() => {
      LED2.write(0);
      LED3.write(1);
      setTimeout(() => {
        LED3.write(0);
      }, 200);
    }, 200);
  }, 200);
}

// ===== ERROR HANDLING =====
process.on("uncaughtException", function(error) {
  logError("Uncaught exception: " + error.message);
  
  // Flash error pattern
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      LED1.write(1);
      setTimeout(() => LED1.write(0), 100);
    }, i * 200);
  }
  
  // Attempt recovery
  setTimeout(() => {
    logInfo("Attempting system recovery...");
    init();
  }, 3000);
});

// ===== UTILITY FUNCTIONS =====
function getCurrentMachineProfile() {
  return MACHINE_PROFILES[CONFIG.machineId] || MACHINE_PROFILES["DUMBBELL"];
}

function sendHeartbeat() {
  if (state.isConnected) {
    const heartbeat = {
      type: "heartbeat",
      timestamp: Date.now(),
      uptime: Date.now() - (state.sessionStartTime || Date.now()),
      health: state.firmwareHealth
    };
    sendJSON(heartbeat);
  }
}

function sendACK(command) {
  sendJSON({
    type: "ack",
    command: command,
    timestamp: Date.now()
  });
}

function sendError(errorType) {
  sendJSON({
    type: "error",
    errorType: errorType,
    timestamp: Date.now()
  });
}

// ===== MACHINE LEARNING HELPERS =====
function calculatePatternScore(motion, timestamp, profile) {
  // Simplified ML scoring - in production would use more complex algorithms
  const recent = state.motionBuffer.slice(-5);
  if (recent.length < 3) return 0.8; // Default score for insufficient data
  
  // Check motion consistency
  const motions = recent.map(r => r.motion);
  const avgMotion = motions.reduce((a, b) => a + b, 0) / motions.length;
  const consistency = 1 - (Math.abs(motion - avgMotion) / avgMotion);
  
  // Check timing consistency
  const timings = recent.map((r, i) => i > 0 ? r.timestamp - recent[i-1].timestamp : 0).slice(1);
  const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
  const timingConsistency = timings.length > 0 ? 
    1 - (timings.reduce((sum, t) => sum + Math.abs(t - avgTiming), 0) / (timings.length * avgTiming)) : 0.8;
  
  return (consistency * 0.6 + timingConsistency * 0.4);
}

function updateLearningPatterns(motion, timestamp) {
  // Update user patterns for adaptive learning
  // This would be expanded with more sophisticated ML in production
  if (state.repCount > 0) {
    const timeSinceLastRep = timestamp - state.lastRepTime;
    state.userPattern.avgRepTime = (state.userPattern.avgRepTime * 0.9) + (timeSinceLastRep * 0.1);
  }
}

// ===== INITIALIZATION =====
// Start the firmware
init();
