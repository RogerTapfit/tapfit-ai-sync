// Enhanced TapFit Puck.js Firmware v2.0
// Advanced BLE integration with machine-specific calibration
// Upload this code to your Puck.js devices using the Espruino Web IDE

// Machine Configuration - Customize per machine deployment
const MACHINE_CONFIG = {
  // Machine identifier - change for each machine installation
  machineId: 'chest-press', // Options: 'chest-press', 'lat-pulldown', 'leg-press', 'shoulder-press', 'treadmill', 'bike'
  
  // Detection sensitivity and timing
  motionThreshold: 0.8,        // Base threshold for motion detection
  repCooldown: 800,           // Minimum time between reps (ms)
  adaptiveLearning: true,     // Enable machine learning for rep detection
  
  // Machine-specific calibration profiles
  calibration: {
    'chest-press': { 
      threshold: 0.8, axis: 'y', direction: 'both', 
      minDuration: 400, maxDuration: 3000, pattern: 'push-pull' 
    },
    'lat-pulldown': { 
      threshold: 1.0, axis: 'y', direction: 'down', 
      minDuration: 500, maxDuration: 4000, pattern: 'pull-return' 
    },
    'leg-press': { 
      threshold: 1.2, axis: 'z', direction: 'forward', 
      minDuration: 600, maxDuration: 5000, pattern: 'press-release' 
    },
    'shoulder-press': { 
      threshold: 0.9, axis: 'y', direction: 'up', 
      minDuration: 400, maxDuration: 3500, pattern: 'press-lower' 
    },
    'treadmill': { 
      threshold: 0.6, axis: 'all', direction: 'rhythmic', 
      minDuration: 200, maxDuration: 1000, pattern: 'step-cycle' 
    },
    'bike': { 
      threshold: 0.5, axis: 'y', direction: 'circular', 
      minDuration: 300, maxDuration: 2000, pattern: 'pedal-cycle' 
    }
  },

  // BLE Configuration
  ble: {
    deviceName: `TapFit-${this.machineId}`,
    serviceUUID: '6E400001-B5A3-F393-E0A9-E50E24DCCA9E', // Nordic UART Service
    txCharUUID: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E',  // TX Characteristic
    rxCharUUID: '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',  // RX Characteristic
    advertisingInterval: 500
  }
};

// Enhanced Global State Management
let repCount = 0;
let lastRepTime = 0;
let sessionStartTime = 0;
let isCalibrating = false;
let isConnected = false;
let baselineAccel = { x: 0, y: 0, z: 0 };
let motionHistory = [];
let repPatterns = []; // For adaptive learning
let connectionAttempts = 0;
let nfcTriggered = false;
let lastHeartbeat = 0;

// Enhanced buffer sizes and timing
const MOTION_BUFFER_SIZE = 20;
const PATTERN_BUFFER_SIZE = 50;
const MAX_CONNECTION_ATTEMPTS = 5;

// Device identification
const deviceName = `TapFit-${MACHINE_CONFIG.machineId}`;
const firmwareVersion = '2.0.1';

// Initialize NFC for machine identification
try {
  NRF.nfcURL(`https://tapfit-ai-sync.lovable.app/machine/${MACHINE_CONFIG.machineId}`);
  console.log("NFC URL configured for machine:", MACHINE_CONFIG.machineId);
} catch(e) {
  console.log("NFC setup failed:", e);
}

// Enhanced BLE Services Setup
function setupBLEServices() {
  NRF.setServices({
    [MACHINE_CONFIG.ble.serviceUUID]: {
      [MACHINE_CONFIG.ble.txCharUUID]: {
        value: [0],
        maxLen: 20,
        writable: true,
        onWrite: function(evt) {
          handleIncomingCommand(evt.data);
        }
      },
      [MACHINE_CONFIG.ble.rxCharUUID]: {
        value: [0],
        maxLen: 20,
        readable: true,
        notify: true
      }
    },
    // Custom TapFit service for enhanced data
    0x2A19: { // Battery Service
      0x2A19: {
        value: [E.getBattery()],
        readable: true,
        notify: true
      }
    }
  }, { advertise: [MACHINE_CONFIG.ble.serviceUUID, 0x2A19] });
}

// Enhanced advertising with machine identification
function updateAdvertising() {
  NRF.setAdvertising({
    0x1809: [repCount], // Health Thermometer with rep count
    0x180F: [E.getBattery()], // Battery service
    0x2A6E: Array.from(MACHINE_CONFIG.machineId.split('').map(c => c.charCodeAt(0))).slice(0,8) // Custom machine ID
  }, {
    name: deviceName,
    interval: MACHINE_CONFIG.ble.advertisingInterval,
    connectable: true,
    discoverable: true
  });
}

// Enhanced initialization with full ecosystem integration
function init() {
  console.log(`Enhanced TapFit Puck.js v${firmwareVersion} initializing for ${MACHINE_CONFIG.machineId}`);
  sessionStartTime = Date.now();
  lastHeartbeat = Date.now();
  
  // Startup LED sequence - firmware identification
  startupLEDSequence();
  
  // Initialize BLE services first
  setupBLEServices();
  
  // Start accelerometer with enhanced settings
  Puck.accelOn(12.5); // 12.5Hz sampling rate
  console.log("✅ Accelerometer initialized");
  
  // Enhanced calibration with machine learning
  calibrateBaseline();
  
  // Set up all monitoring systems
  setupMotionDetection();
  setupButtonHandlers();
  setupNFCHandlers();
  setupConnectionMonitoring();
  
  // Initial advertising
  updateAdvertising();
  
  console.log(`🚀 TapFit ${MACHINE_CONFIG.machineId} ready for connection!`);
}

// Enhanced startup LED sequence for firmware identification
function startupLEDSequence() {
  // V2.0 identification sequence: R-G-B-R-G-B
  const sequence = [
    { led: LED1, duration: 150 }, // Red
    { led: LED2, duration: 150 }, // Green  
    { led: LED3, duration: 150 }, // Blue
    { led: LED1, duration: 150 }, // Red
    { led: LED2, duration: 150 }, // Green
    { led: LED3, duration: 150 }  // Blue
  ];
  
  sequence.forEach((step, i) => {
    setTimeout(() => {
      step.led.write(1);
      setTimeout(() => step.led.write(0), step.duration);
    }, i * 200);
  });
}

// Handle incoming BLE commands
function handleIncomingCommand(data) {
  try {
    const command = JSON.parse(String.fromCharCode.apply(null, data));
    console.log("Received command:", command);
    
    switch(command.type) {
      case 'calibrate':
        calibrateBaseline();
        break;
      case 'reset':
        repCount = 0;
        sendRepData();
        break;
      case 'status':
        sendStatusData();
        break;
      case 'configure':
        if (command.config) {
          updateConfiguration(command.config);
        }
        break;
      default:
        console.log("Unknown command:", command.type);
    }
  } catch (e) {
    console.log("Command parse error:", e);
  }
}

// Send comprehensive status data
function sendStatusData() {
  const statusData = {
    type: 'status',
    machineId: MACHINE_CONFIG.machineId,
    firmwareVersion: firmwareVersion,
    repCount: repCount,
    battery: E.getBattery(),
    sessionTime: Date.now() - sessionStartTime,
    isCalibrated: !isCalibrating,
    motionThreshold: MACHINE_CONFIG.motionThreshold,
    lastActivity: lastRepTime,
    connectionTime: isConnected ? Date.now() - lastHeartbeat : 0,
    timestamp: Date.now()
  };
  
  transmitData(statusData);
}

// Enhanced data transmission with multiple protocols
function transmitData(data) {
  const jsonString = JSON.stringify(data);
  
  // Primary: UART transmission
  try {
    Bluetooth.println(jsonString);
  } catch (e) {
    console.log("UART transmission failed:", e);
  }
  
  // Secondary: Service notification
  try {
    const buffer = new Uint8Array(jsonString.split('').map(c => c.charCodeAt(0)).slice(0, 20));
    NRF.updateServices({
      [MACHINE_CONFIG.ble.serviceUUID]: {
        [MACHINE_CONFIG.ble.rxCharUUID]: {
          value: buffer,
          notify: true
        }
      }
    });
  } catch (e) {
    console.log("Service notification failed:", e);
  }
}

// NFC event handlers for machine coordination
function setupNFCHandlers() {
  NRF.on('NFCTag', function() {
    nfcTriggered = true;
    console.log("📱 NFC triggered - TapFit app coordination active");
    
    // NFC tap feedback - specific pattern
    LED1.write(1); LED2.write(1); LED3.write(1);
    setTimeout(() => {
      LED1.write(0); LED2.write(0); LED3.write(0);
    }, 300);
    
    // Enhanced advertising after NFC tap
    NRF.setAdvertising({
      0x1809: [repCount],
      0x180F: [E.getBattery()],
      0x2A6E: Array.from(MACHINE_CONFIG.machineId.split('').map(c => c.charCodeAt(0))).slice(0,8),
      0x1802: [0x01] // Immediate Alert to prioritize this device
    }, {
      name: deviceName,
      interval: 100, // Faster advertising after NFC
      connectable: true,
      discoverable: true
    });
    
    // Reset to normal advertising after 30 seconds
    setTimeout(() => {
      if (!isConnected) {
        updateAdvertising();
      }
    }, 30000);
  });
}

// Connection monitoring and recovery
function setupConnectionMonitoring() {
  setInterval(() => {
    if (!isConnected && nfcTriggered) {
      connectionAttempts++;
      if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
        // Pulse LED to indicate waiting for connection
        LED3.write(1);
        setTimeout(() => LED3.write(0), 100);
      }
    }
    
    // Update battery in advertising every minute
    if (Date.now() - lastHeartbeat > 60000) {
      updateAdvertising();
      lastHeartbeat = Date.now();
    }
  }, 5000);
}

// Calibrate baseline accelerometer values
function calibrateBaseline() {
  isCalibrating = true;
  console.log("Calibrating baseline...");
  
  let samples = [];
  let sampleCount = 0;
  const MAX_SAMPLES = 50;
  
  const calibrationInterval = setInterval(() => {
    const accel = Puck.accel();
    samples.push(accel);
    sampleCount++;
    
    // LED pulse during calibration
    LED2.write(sampleCount % 10 === 0);
    
    if (sampleCount >= MAX_SAMPLES) {
      clearInterval(calibrationInterval);
      
      // Calculate average baseline
      baselineAccel.x = samples.reduce((sum, s) => sum + s.x, 0) / MAX_SAMPLES;
      baselineAccel.y = samples.reduce((sum, s) => sum + s.y, 0) / MAX_SAMPLES;
      baselineAccel.z = samples.reduce((sum, s) => sum + s.z, 0) / MAX_SAMPLES;
      
      console.log("Baseline calibrated:", baselineAccel);
      isCalibrating = false;
      LED2.write(0);
      
      // Success feedback - triple blink
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          LED3.write(1);
          setTimeout(() => LED3.write(0), 100);
        }, i * 200);
      }
    }
  }, 20); // Sample every 20ms during calibration
}

// Set up motion detection based on accelerometer
function setupMotionDetection() {
  setInterval(() => {
    if (isCalibrating) return;
    
    const accel = Puck.accel();
    const config = MACHINE_CONFIG.calibration[MACHINE_CONFIG.machineId];
    
    // Calculate motion magnitude relative to baseline
    const deltaX = Math.abs(accel.x - baselineAccel.x);
    const deltaY = Math.abs(accel.y - baselineAccel.y);
    const deltaZ = Math.abs(accel.z - baselineAccel.z);
    
    let motionMagnitude = 0;
    
    // Focus on the primary axis for this machine
    switch (config.axis) {
      case 'x':
        motionMagnitude = deltaX;
        break;
      case 'y':
        motionMagnitude = deltaY;
        break;
      case 'z':
        motionMagnitude = deltaZ;
        break;
      default:
        motionMagnitude = Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
    }
    
    // Add to motion history
    motionHistory.push(motionMagnitude);
    if (motionHistory.length > MOTION_BUFFER_SIZE) {
      motionHistory.shift();
    }
    
    // Detect rep based on motion pattern
    detectRep(motionMagnitude, accel);
    
    // Send real-time motion data
    sendMotionData(motionMagnitude);
    
  }, 80); // Check motion every 80ms (12.5Hz)
}

// Enhanced rep detection with adaptive learning
function detectRep(motionMagnitude, accel) {
  const config = MACHINE_CONFIG.calibration[MACHINE_CONFIG.machineId];
  const now = Date.now();
  
  // Check cooldown period
  if (now - lastRepTime < MACHINE_CONFIG.repCooldown) {
    return;
  }
  
  // Enhanced pattern detection based on machine type
  if (motionMagnitude > config.threshold) {
    const patternDetected = analyzeMotionPattern(config);
    
    if (patternDetected) {
      // Store pattern for adaptive learning
      if (MACHINE_CONFIG.adaptiveLearning) {
        storeRepPattern(motionMagnitude, now - lastRepTime);
      }
      registerRep();
    }
  }
}

// Analyze motion patterns based on machine type
function analyzeMotionPattern(config) {
  if (motionHistory.length < 8) return false;
  
  const recent = motionHistory.slice(-8);
  const peak = Math.max(...recent);
  const valley = Math.min(...recent);
  const range = peak - valley;
  
  // Machine-specific pattern analysis
  switch (config.pattern) {
    case 'push-pull':
      return analyzePushPullPattern(recent, config.threshold);
    case 'pull-return':
      return analyzePullReturnPattern(recent, config.threshold);
    case 'press-release':
      return analyzePressReleasePattern(recent, config.threshold);
    case 'press-lower':
      return analyzePressLowerPattern(recent, config.threshold);
    case 'step-cycle':
      return analyzeStepCyclePattern(recent, config.threshold);
    case 'pedal-cycle':
      return analyzePedalCyclePattern(recent, config.threshold);
    default:
      return analyzeGenericPattern(recent, config.threshold);
  }
}

// Pattern analysis functions for different machine types
function analyzePushPullPattern(data, threshold) {
  const hasUpward = data.slice(0, 4).some(val => val > threshold);
  const hasDownward = data.slice(4, 8).some(val => val < threshold * 0.3);
  return hasUpward && hasDownward;
}

function analyzePullReturnPattern(data, threshold) {
  const hasPull = data.slice(0, 3).some(val => val > threshold);
  const hasReturn = data.slice(-3).every(val => val < threshold * 0.4);
  return hasPull && hasReturn;
}

function analyzePressReleasePattern(data, threshold) {
  const hasPress = data.slice(2, 6).some(val => val > threshold);
  const hasRelease = data.slice(-2).every(val => val < threshold * 0.2);
  return hasPress && hasRelease;
}

function analyzePressLowerPattern(data, threshold) {
  const peak = Math.max(...data.slice(0, 5));
  const valley = Math.min(...data.slice(-3));
  return peak > threshold && valley < threshold * 0.3;
}

function analyzeStepCyclePattern(data, threshold) {
  const peaks = data.filter(val => val > threshold * 0.8).length;
  return peaks >= 2 && peaks <= 4; // Multiple steps in cycle
}

function analyzePedalCyclePattern(data, threshold) {
  const oscillations = countOscillations(data, threshold * 0.6);
  return oscillations >= 1 && oscillations <= 3; // Smooth pedaling motion
}

function analyzeGenericPattern(data, threshold) {
  const peak = Math.max(...data);
  const valley = Math.min(...data.slice(-3));
  return peak > threshold && valley < threshold * 0.3;
}

// Helper function to count oscillations
function countOscillations(data, threshold) {
  let oscillations = 0;
  let wasAbove = false;
  
  for (let i = 0; i < data.length; i++) {
    const isAbove = data[i] > threshold;
    if (isAbove && !wasAbove) oscillations++;
    wasAbove = isAbove;
  }
  return oscillations;
}

// Store rep patterns for adaptive learning
function storeRepPattern(magnitude, duration) {
  const pattern = {
    magnitude: magnitude,
    duration: duration,
    timestamp: Date.now(),
    machineId: MACHINE_CONFIG.machineId
  };
  
  repPatterns.push(pattern);
  if (repPatterns.length > PATTERN_BUFFER_SIZE) {
    repPatterns.shift();
  }
  
  // Adaptive threshold adjustment every 10 reps
  if (repCount % 10 === 0 && repPatterns.length >= 10) {
    adaptiveThresholdAdjustment();
  }
}

// Adaptive threshold adjustment based on learned patterns
function adaptiveThresholdAdjustment() {
  const recentPatterns = repPatterns.slice(-20);
  const avgMagnitude = recentPatterns.reduce((sum, p) => sum + p.magnitude, 0) / recentPatterns.length;
  const avgDuration = recentPatterns.reduce((sum, p) => sum + p.duration, 0) / recentPatterns.length;
  
  // Adjust threshold based on consistency
  const config = MACHINE_CONFIG.calibration[MACHINE_CONFIG.machineId];
  const variance = recentPatterns.reduce((sum, p) => sum + Math.pow(p.magnitude - avgMagnitude, 2), 0) / recentPatterns.length;
  
  if (variance < 0.1) { // Low variance = consistent reps
    config.threshold = Math.max(0.3, config.threshold * 0.95); // Slightly more sensitive
  } else if (variance > 0.5) { // High variance = inconsistent
    config.threshold = Math.min(2.0, config.threshold * 1.05); // Slightly less sensitive
  }
  
  console.log(`Adaptive learning: threshold adjusted to ${config.threshold.toFixed(2)}`);
}

// Dynamic configuration updates
function updateConfiguration(newConfig) {
  if (newConfig.motionThreshold) {
    MACHINE_CONFIG.motionThreshold = newConfig.motionThreshold;
  }
  if (newConfig.repCooldown) {
    MACHINE_CONFIG.repCooldown = newConfig.repCooldown;
  }
  if (newConfig.calibration && newConfig.calibration[MACHINE_CONFIG.machineId]) {
    Object.assign(MACHINE_CONFIG.calibration[MACHINE_CONFIG.machineId], newConfig.calibration[MACHINE_CONFIG.machineId]);
  }
  
  console.log("Configuration updated:", newConfig);
  sendStatusData();
}

// Register a new repetition
function registerRep() {
  repCount++;
  lastRepTime = Date.now();
  
  console.log(`Rep ${repCount} detected for ${MACHINE_CONFIG.machineId}`);
  
  // LED feedback - quick green flash
  LED2.write(1);
  setTimeout(() => LED2.write(0), 150);
  
  // Send rep data via BLE
  sendRepData();
  
  // Update advertising data
  NRF.setAdvertising({
    0x1809: [repCount],
    0x180F: [E.getBattery()],
  }, { name: deviceName });
}

// Send repetition data via BLE
function sendRepData() {
  const data = {
    type: 'rep',
    count: repCount,
    timestamp: Date.now(),
    machineId: MACHINE_CONFIG.machineId,
    sessionTime: Date.now() - sessionStartTime
  };
  
  // Send as JSON string via UART
  try {
    Bluetooth.println(JSON.stringify(data));
  } catch (e) {
    console.log("BLE send failed:", e);
  }
  
  // Also send as binary data for compatibility
  const buffer = new Uint8Array([0x01, repCount, (Date.now() & 0xFF)]);
  try {
    NRF.updateServices({
      0xFFE0: {
        0xFFE1: {
          value: buffer,
          notify: true
        }
      }
    });
  } catch (e) {
    console.log("Service update failed:", e);
  }
}

// Send motion intensity data
function sendMotionData(intensity) {
  // Send motion data every 10th reading to avoid flooding
  if (Math.random() < 0.1) {
    const data = {
      type: 'motion',
      intensity: Math.round(intensity * 100),
      timestamp: Date.now(),
      machineId: MACHINE_CONFIG.machineId
    };
    
    try {
      const buffer = new Uint8Array([0x02, Math.min(255, Math.round(intensity * 100))]);
      NRF.updateServices({
        0xFFE0: {
          0xFFE1: {
            value: buffer,
            notify: true
          }
        }
      });
    } catch (e) {
      // Silent fail for motion data
    }
  }
}

// Set up button handlers
function setupButtonHandlers() {
  // Single press - reset rep counter
  setWatch(() => {
    repCount = 0;
    console.log("Rep counter reset");
    
    // LED feedback - red flash
    LED1.write(1);
    setTimeout(() => LED1.write(0), 300);
    
    sendRepData();
  }, BTN, { edge: "rising", debounce: 50, repeat: true });
  
  // Long press (>2 seconds) - recalibrate
  let pressTime = 0;
  setWatch(() => {
    pressTime = Date.now();
  }, BTN, { edge: "rising", repeat: true });
  
  setWatch(() => {
    if (Date.now() - pressTime > 2000) {
      console.log("Recalibrating...");
      calibrateBaseline();
    }
  }, BTN, { edge: "falling", repeat: true });
}

// Enhanced BLE connection handling
NRF.on('connect', function(addr) {
  isConnected = true;
  connectionAttempts = 0;
  console.log(`✅ Connected to TapFit app: ${addr}`);
  
  // Connection success LED pattern - blue solid
  LED3.write(1);
  
  // Send comprehensive initial status
  setTimeout(() => {
    sendStatusData();
    
    // Send device capabilities
    const capabilitiesData = {
      type: 'capabilities',
      machineId: MACHINE_CONFIG.machineId,
      firmwareVersion: firmwareVersion,
      features: {
        adaptiveLearning: MACHINE_CONFIG.adaptiveLearning,
        nfcEnabled: true,
        batteryMonitoring: true,
        motionPatterns: Object.keys(MACHINE_CONFIG.calibration),
        maxRepCount: 9999
      },
      calibration: MACHINE_CONFIG.calibration[MACHINE_CONFIG.machineId],
      timestamp: Date.now()
    };
    
    transmitData(capabilitiesData);
  }, 500);
  
  // Send heartbeat every 30 seconds while connected
  const heartbeatInterval = setInterval(() => {
    if (isConnected) {
      const heartbeat = {
        type: 'heartbeat',
        machineId: MACHINE_CONFIG.machineId,
        repCount: repCount,
        battery: E.getBattery(),
        uptime: Date.now() - sessionStartTime,
        timestamp: Date.now()
      };
      transmitData(heartbeat);
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000);
});

NRF.on('disconnect', function() {
  isConnected = false;
  console.log("❌ Disconnected from TapFit app");
  
  // Disconnection LED feedback - blue off
  LED3.write(0);
  
  // Resume advertising for reconnection
  setTimeout(() => {
    if (!isConnected) {
      updateAdvertising();
      console.log("📡 Resuming advertising for reconnection...");
    }
  }, 2000);
});

// Battery monitoring
setInterval(() => {
  const battery = E.getBattery();
  if (battery < 20) {
    // Low battery warning - slow red pulse
    LED1.write(1);
    setTimeout(() => LED1.write(0), 100);
  }
}, 30000); // Check every 30 seconds

// Error handling
process.on('uncaughtException', function(e) {
  console.log("Error:", e);
  // Reset device on critical error
  setTimeout(() => {
    LED1.write(1);
    LED2.write(1);
    LED3.write(1);
    setTimeout(() => E.reboot(), 1000);
  }, 500);
});

// Start the system
console.log("Starting TapFit Puck.js Firmware...");
init();

// Keep device alive
setInterval(() => {
  // Heartbeat - very brief flash every 10 seconds when active
  if (Date.now() - lastRepTime < 60000) { // Only if recent activity
    LED3.write(1);
    setTimeout(() => LED3.write(0), 10);
  }
}, 10000);

console.log(`TapFit ${MACHINE_CONFIG.machineId} ready!`);
