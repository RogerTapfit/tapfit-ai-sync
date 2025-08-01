// Enhanced TapFit Puck.js Firmware v3.0
// Modular, efficient BLE integration with robust motion detection
// Upload this code to your Puck.js devices using the Espruino Web IDE

// ============== CONFIGURATION ==============
const CONFIG = {
  machineId: 'chest-press', // Change for each machine: chest-press, lat-pulldown, leg-press, etc.
  motionThreshold: 0.8,
  repCooldown: 500,
  sampleRate: 12.5, // Hz
  deviceName: 'TapFit-Puck',
  firmwareVersion: '3.0'
};

// Machine profiles for optimized detection
const MACHINE_PROFILES = {
  'chest-press': { threshold: 0.8, axis: 'y', pattern: 'push-pull', cooldown: 600 },
  'lat-pulldown': { threshold: 1.0, axis: 'y', pattern: 'pull-return', cooldown: 700 },
  'leg-press': { threshold: 1.2, axis: 'z', pattern: 'press-release', cooldown: 800 },
  'shoulder-press': { threshold: 0.9, axis: 'y', pattern: 'press-lower', cooldown: 500 },
  'treadmill': { threshold: 0.6, axis: 'all', pattern: 'step-cycle', cooldown: 300 },
  'bike': { threshold: 0.5, axis: 'y', pattern: 'pedal-cycle', cooldown: 400 }
};

// ============== STATE MANAGEMENT ==============
let state = {
  repCount: 0,
  sessionStartTime: 0,
  lastRepTime: 0,
  isConnected: false,
  isCalibrating: false,
  baseline: { x: 0, y: 0, z: 0 },
  motionBuffer: [],
  nfcTriggered: false,
  batteryLevel: 100
};

// ============== INITIALIZATION ==============
function init() {
  console.log(`TapFit v${CONFIG.firmwareVersion} starting for ${CONFIG.machineId}`);
  
  state.sessionStartTime = Date.now();
  state.batteryLevel = E.getBattery();
  
  // Visual startup feedback
  startupSequence();
  
  // Setup core systems
  setupBLE();
  setupNFC();
  setupAccelerometer();
  setupButtons();
  
  // Calibrate and start
  calibrateBaseline();
  startMonitoring();
  
  console.log("✅ TapFit ready for connection!");
}

// ============== BLE SYSTEM ==============
function setupBLE() {
  // Configure Nordic UART service
  NRF.setServices({
    '6E400001-B5A3-F393-E0A9-E50E24DCCA9E': {
      '6E400002-B5A3-F393-E0A9-E50E24DCCA9E': {
        value: [0],
        maxLen: 20,
        writable: true,
        onWrite: handleBLECommand
      },
      '6E400003-B5A3-F393-E0A9-E50E24DCCA9E': {
        value: [0],
        maxLen: 20,
        readable: true,
        notify: true
      }
    }
  }, { advertise: ['6E400001-B5A3-F393-E0A9-E50E24DCCA9E'] });
  
  updateAdvertising();
}

function updateAdvertising() {
  NRF.setAdvertising({
    0x1809: [state.repCount & 0xFF], // Rep count
    0x180F: [state.batteryLevel], // Battery level
  }, {
    name: `${CONFIG.deviceName}-${CONFIG.machineId}`,
    interval: state.nfcTriggered ? 100 : 500,
    connectable: true,
    discoverable: true
  });
}

function handleBLECommand(evt) {
  try {
    const cmd = JSON.parse(String.fromCharCode.apply(null, evt.data));
    console.log("BLE command:", cmd.type);
    
    switch(cmd.type) {
      case 'reset':
        resetSession();
        break;
      case 'calibrate':
        calibrateBaseline();
        break;
      case 'status':
        sendStatus();
        break;
    }
  } catch(e) {
    console.log("Command error:", e);
  }
}

function transmitData(data) {
  const json = JSON.stringify(data);
  
  // Send via UART
  try {
    Bluetooth.println(json);
  } catch(e) {
    console.log("UART failed:", e);
  }
  
  // Update service characteristic
  try {
    const bytes = json.split('').map(c => c.charCodeAt(0)).slice(0, 20);
    NRF.updateServices({
      '6E400001-B5A3-F393-E0A9-E50E24DCCA9E': {
        '6E400003-B5A3-F393-E0A9-E50E24DCCA9E': {
          value: bytes,
          notify: true
        }
      }
    });
  } catch(e) {
    console.log("Service update failed:", e);
  }
}

// ============== NFC SYSTEM ==============
function setupNFC() {
  try {
    NRF.nfcURL(`https://tapfit-ai-sync.lovable.app/machine/${CONFIG.machineId}`);
    console.log("NFC configured for:", CONFIG.machineId);
  } catch(e) {
    console.log("NFC setup failed:", e);
  }
}

// ============== MOTION DETECTION ==============
function setupAccelerometer() {
  Puck.accelOn(CONFIG.sampleRate);
  console.log("Accelerometer started at", CONFIG.sampleRate, "Hz");
}

function calibrateBaseline() {
  state.isCalibrating = true;
  console.log("Calibrating...");
  
  let samples = [];
  let count = 0;
  const targetSamples = 30;
  
  const calibrateInterval = setInterval(() => {
    const accel = Puck.accel();
    samples.push(accel);
    count++;
    
    // Visual feedback
    LED2.write(count % 5 === 0);
    
    if (count >= targetSamples) {
      clearInterval(calibrateInterval);
      
      // Calculate baseline
      state.baseline.x = samples.reduce((sum, s) => sum + s.x, 0) / targetSamples;
      state.baseline.y = samples.reduce((sum, s) => sum + s.y, 0) / targetSamples;
      state.baseline.z = samples.reduce((sum, s) => sum + s.z, 0) / targetSamples;
      
      state.isCalibrating = false;
      LED2.write(0);
      
      // Success feedback
      flashSuccess();
      console.log("Calibration complete:", state.baseline);
    }
  }, 50);
}

function startMonitoring() {
  setInterval(() => {
    if (state.isCalibrating) return;
    
    const accel = Puck.accel();
    const motion = calculateMotion(accel);
    
    // Add to buffer
    state.motionBuffer.push(motion);
    if (state.motionBuffer.length > 10) {
      state.motionBuffer.shift();
    }
    
    // Check for rep
    checkForRep(motion);
    
    // Send motion data
    if (state.isConnected) {
      transmitData({
        type: 'motion',
        value: motion,
        timestamp: Date.now()
      });
    }
    
  }, 80); // 12.5Hz
}

function calculateMotion(accel) {
  const profile = MACHINE_PROFILES[CONFIG.machineId];
  
  // Calculate delta from baseline
  const dx = Math.abs(accel.x - state.baseline.x);
  const dy = Math.abs(accel.y - state.baseline.y);
  const dz = Math.abs(accel.z - state.baseline.z);
  
  // Focus on primary axis for this machine
  switch(profile.axis) {
    case 'x': return dx;
    case 'y': return dy;
    case 'z': return dz;
    default: return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }
}

function checkForRep(motion) {
  const profile = MACHINE_PROFILES[CONFIG.machineId];
  const now = Date.now();
  
  // Check cooldown
  if (now - state.lastRepTime < profile.cooldown) return;
  
  // Check threshold
  if (motion > profile.threshold) {
    // Simple pattern check: look for motion peak followed by return to low
    if (state.motionBuffer.length >= 5) {
      const recent = state.motionBuffer.slice(-5);
      const peak = Math.max(...recent.slice(0, 3));
      const valley = Math.min(...recent.slice(-2));
      
      if (peak > profile.threshold && valley < profile.threshold * 0.3) {
        registerRep();
      }
    }
  }
}

function registerRep() {
  state.repCount++;
  state.lastRepTime = Date.now();
  
  console.log("Rep registered:", state.repCount);
  
  // Visual feedback
  LED1.write(1);
  setTimeout(() => LED1.write(0), 150);
  
  // Send rep data
  transmitData({
    type: 'rep',
    count: state.repCount,
    timestamp: state.lastRepTime,
    sessionTime: state.lastRepTime - state.sessionStartTime
  });
  
  // Update advertising with new count
  updateAdvertising();
}

// ============== UI & FEEDBACK ==============
function setupButtons() {
  setWatch(() => {
    console.log("Button pressed - resetting session");
    resetSession();
  }, BTN, { edge: "rising", repeat: true, debounce: 50 });
}

function startupSequence() {
  // V3.0 signature: Blue-Green-Blue pattern
  const leds = [LED3, LED2, LED3];
  leds.forEach((led, i) => {
    setTimeout(() => {
      led.write(1);
      setTimeout(() => led.write(0), 100);
    }, i * 150);
  });
}

function flashSuccess() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      LED2.write(1);
      setTimeout(() => LED2.write(0), 100);
    }, i * 200);
  }
}

function flashError() {
  for (let i = 0; i < 2; i++) {
    setTimeout(() => {
      LED1.write(1);
      setTimeout(() => LED1.write(0), 200);
    }, i * 400);
  }
}

// ============== UTILITY FUNCTIONS ==============
function resetSession() {
  state.repCount = 0;
  state.sessionStartTime = Date.now();
  state.lastRepTime = 0;
  state.motionBuffer = [];
  
  console.log("Session reset");
  flashSuccess();
  
  transmitData({
    type: 'reset',
    timestamp: Date.now()
  });
  
  updateAdvertising();
}

function sendStatus() {
  transmitData({
    type: 'status',
    machineId: CONFIG.machineId,
    firmware: CONFIG.firmwareVersion,
    repCount: state.repCount,
    battery: E.getBattery(),
    sessionTime: Date.now() - state.sessionStartTime,
    connected: state.isConnected,
    calibrated: !state.isCalibrating,
    timestamp: Date.now()
  });
}

function updateBattery() {
  state.batteryLevel = E.getBattery();
  if (state.batteryLevel < 20) {
    // Low battery warning
    console.log("⚠️ Low battery:", state.batteryLevel + "%");
    flashError();
  }
}

// ============== CONNECTION EVENTS ==============
NRF.on('connect', function(addr) {
  state.isConnected = true;
  console.log("📱 Connected to:", addr);
  
  // Connection feedback
  LED3.write(1);
  setTimeout(() => LED3.write(0), 500);
  
  // Send initial status
  sendStatus();
});

NRF.on('disconnect', function() {
  state.isConnected = false;
  console.log("📱 Disconnected");
  
  // Reset advertising to normal
  state.nfcTriggered = false;
  updateAdvertising();
});

// NFC tap event
NRF.on('NFCTag', function() {
  state.nfcTriggered = true;
  console.log("📱 NFC tapped!");
  
  // NFC feedback - all LEDs flash
  LED1.write(1); LED2.write(1); LED3.write(1);
  setTimeout(() => {
    LED1.write(0); LED2.write(0); LED3.write(0);
  }, 300);
  
  // Boost advertising for quick connection
  updateAdvertising();
  
  // Reset to normal after 30 seconds
  setTimeout(() => {
    if (!state.isConnected) {
      state.nfcTriggered = false;
      updateAdvertising();
    }
  }, 30000);
});

// ============== BACKGROUND TASKS ==============
// Battery monitoring
setInterval(updateBattery, 60000); // Check every minute

// Heartbeat for debugging
setInterval(() => {
  console.log(`💓 Reps: ${state.repCount}, Battery: ${state.batteryLevel}%, Connected: ${state.isConnected}`);
}, 30000);

// Error handling
process.on('uncaughtException', function(e) {
  console.log("❌ Error:", e);
  flashError();
});

// ============== START FIRMWARE ==============
console.log("TapFit Puck.js Firmware v" + CONFIG.firmwareVersion);
setTimeout(init, 1000); // Give system time to boot