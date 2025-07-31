// Puck.js Firmware for TapFit Gym Machine Integration
// Upload this code to your Puck.js devices using the Espruino Web IDE

// Machine Configuration - Customize per machine
const MACHINE_CONFIG = {
  // Change this for each machine: 'chest-press', 'lat-pulldown', 'leg-press', 'shoulder-press'
  machineId: 'chest-press',
  
  // Motion detection sensitivity (0.1 = very sensitive, 2.0 = less sensitive)
  motionThreshold: 0.8,
  
  // Minimum time between reps in milliseconds
  repCooldown: 1000,
  
  // Calibration settings per machine type
  calibration: {
    'chest-press': { threshold: 0.8, axis: 'y', direction: 'both' },
    'lat-pulldown': { threshold: 1.0, axis: 'y', direction: 'down' },
    'leg-press': { threshold: 1.2, axis: 'z', direction: 'forward' },
    'shoulder-press': { threshold: 0.9, axis: 'y', direction: 'up' }
  }
};

// Global variables
let repCount = 0;
let lastRepTime = 0;
let isCalibrating = false;
let baselineAccel = { x: 0, y: 0, z: 0 };
let sessionStartTime = 0;
let motionHistory = [];
const MOTION_BUFFER_SIZE = 10;

// Device naming for machine-specific identification
const deviceName = `${MACHINE_CONFIG.machineId}-puck`;

// Set device name for BLE advertising
NRF.setAdvertising({
  0x1809: [repCount], // Health Thermometer service with rep count
  0x180F: [E.getBattery()], // Battery service
}, {
  name: deviceName,
  interval: 600, // Advertise every 600ms
  connectable: true
});

// Initialize the device
function init() {
  console.log(`TapFit Puck.js initialized for ${MACHINE_CONFIG.machineId}`);
  
  // LED feedback - quick double blink on startup
  LED1.write(1);
  setTimeout(() => LED1.write(0), 100);
  setTimeout(() => LED1.write(1), 200);
  setTimeout(() => LED1.write(0), 300);
  
  // Start accelerometer
  Puck.accelOn(12.5); // 12.5Hz sampling rate
  
  // Calibrate baseline
  calibrateBaseline();
  
  // Set up motion detection
  setupMotionDetection();
  
  // Set up button handlers
  setupButtonHandlers();
  
  sessionStartTime = Date.now();
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

// Detect repetition based on motion patterns
function detectRep(motionMagnitude, accel) {
  const config = MACHINE_CONFIG.calibration[MACHINE_CONFIG.machineId];
  const now = Date.now();
  
  // Check if enough time has passed since last rep
  if (now - lastRepTime < MACHINE_CONFIG.repCooldown) {
    return;
  }
  
  // Check if motion exceeds threshold
  if (motionMagnitude > config.threshold) {
    
    // Look for motion pattern completion (peak and return to baseline)
    if (motionHistory.length >= 5) {
      const recent = motionHistory.slice(-5);
      const hasPeak = recent.some(val => val > config.threshold);
      const hasReturn = recent.slice(-2).every(val => val < config.threshold * 0.3);
      
      if (hasPeak && hasReturn) {
        registerRep();
      }
    }
  }
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

// Handle BLE connection events
NRF.on('connect', function(addr) {
  console.log("Connected to", addr);
  LED3.write(1); // Blue LED on when connected
  
  // Send initial status
  const statusData = {
    type: 'status',
    machineId: MACHINE_CONFIG.machineId,
    repCount: repCount,
    battery: E.getBattery(),
    sessionTime: Date.now() - sessionStartTime,
    timestamp: Date.now()
  };
  
  setTimeout(() => {
    try {
      Bluetooth.println(JSON.stringify(statusData));
    } catch (e) {
      console.log("Status send failed:", e);
    }
  }, 1000);
});

NRF.on('disconnect', function() {
  console.log("Disconnected");
  LED3.write(0); // Blue LED off when disconnected
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
