// TapFit Puck.js Optimized Firmware v7.0
// Streamlined for iOS app integration and reliable rep counting
// Upload this firmware to your Puck.js device

// Configuration
const CONFIG = {
  device: {
    name: 'TapFit Puck',
    version: '7.0'
  },
  ble: {
    serviceUUID: '0000FFE0-0000-1000-8000-00805F9B34FB',
    charUUID: '0000FFE1-0000-1000-8000-00805F9B34FB',
    heartbeatInterval: 5000 // 5 seconds
  },
  motion: {
    sampleRate: 25, // Hz - optimized for battery and accuracy
    threshold: 1.8, // Adaptive threshold
    cooldown: 600, // ms between reps
    calibrationSamples: 30
  },
  power: {
    batteryCheckInterval: 300000, // 5 minutes
    lowBatteryThreshold: 0.25
  }
};

// Packet types for communication
const PACKET_TYPE = {
  REP_COUNT: 0x01,
  STATUS: 0x02,
  HEARTBEAT: 0x03,
  BATTERY: 0x04,
  ERROR: 0xFF
};

// Device state
let state = {
  repCount: 0,
  isConnected: false,
  isCalibrated: false,
  baseline: { x: 0, y: 0, z: 0 },
  lastRepTime: 0,
  lastHeartbeat: 0,
  sessionActive: false,
  batteryLevel: 1.0
};

// Initialize device
function init() {
  console.log(`TapFit Puck Optimized v${CONFIG.device.version}`);
  
  setupBLE();
  setupAccelerometer();
  setupButtons();
  setupPowerManagement();
  
  // Startup sequence
  startupSequence();
  
  // Begin calibration after startup
  setTimeout(calibrateDevice, 2000);
}

// Setup BLE UART service
function setupBLE() {
  NRF.setServices({
    [CONFIG.ble.serviceUUID]: {
      [CONFIG.ble.charUUID]: {
        readable: true,
        writable: true,
        notify: true,
        maxLen: 20,
        value: new Uint8Array([0x00, 0x00]),
        onWrite: function(evt) {
          handleIncomingCommand(new Uint8Array(evt.data));
        }
      }
    }
  }, { uart: false });

  // Advertising configuration
  NRF.setAdvertising({}, {
    name: CONFIG.device.name,
    showName: true,
    connectable: true,
    interval: 375
  });

  // Connection events
  NRF.on('connect', handleConnect);
  NRF.on('disconnect', handleDisconnect);
}

// Handle incoming commands from app
function handleIncomingCommand(data) {
  if (data.length === 0) return;
  
  switch(data[0]) {
    case 0x00: // Reset command
      resetRepCount();
      break;
    case 0x01: // Start session
      startSession();
      break;
    case 0x02: // End session
      endSession();
      break;
    case 0x03: // Request status
      sendStatusPacket();
      break;
    case 0x04: // Calibrate
      calibrateDevice();
      break;
  }
}

// Connection handlers
function handleConnect() {
  state.isConnected = true;
  console.log('iOS app connected');
  flashConnection();
  sendStatusPacket();
  startHeartbeat();
}

function handleDisconnect() {
  state.isConnected = false;
  state.sessionActive = false;
  console.log('iOS app disconnected');
  flashDisconnection();
  stopHeartbeat();
}

// Setup accelerometer
function setupAccelerometer() {
  Puck.accelOn(CONFIG.motion.sampleRate);
  console.log(`Accelerometer initialized at ${CONFIG.motion.sampleRate}Hz`);
}

// Calibrate device baseline
function calibrateDevice() {
  console.log('Starting calibration...');
  flashCalibration();
  
  let samples = [];
  let sampleCount = 0;
  
  function collectSample() {
    const accel = Puck.accel();
    samples.push(accel);
    sampleCount++;
    
    if (sampleCount >= CONFIG.motion.calibrationSamples) {
      // Calculate baseline average
      state.baseline.x = samples.reduce((sum, s) => sum + s.x, 0) / CONFIG.motion.calibrationSamples;
      state.baseline.y = samples.reduce((sum, s) => sum + s.y, 0) / CONFIG.motion.calibrationSamples;
      state.baseline.z = samples.reduce((sum, s) => sum + s.z, 0) / CONFIG.motion.calibrationSamples;
      
      state.isCalibrated = true;
      console.log('Calibration complete:', state.baseline);
      flashSuccess();
      
      // Start monitoring if we have an active session
      if (state.sessionActive) {
        startMotionMonitoring();
      }
    } else {
      setTimeout(collectSample, 100);
    }
  }
  
  setTimeout(collectSample, 500);
}

// Start workout session
function startSession() {
  if (!state.isCalibrated) {
    calibrateDevice();
  }
  
  state.sessionActive = true;
  state.repCount = 0;
  console.log('Session started');
  flashSessionStart();
  
  if (state.isCalibrated) {
    startMotionMonitoring();
  }
  
  sendStatusPacket();
}

// End workout session
function endSession() {
  state.sessionActive = false;
  console.log('Session ended - Total reps:', state.repCount);
  flashSessionEnd();
  sendStatusPacket();
}

// Start motion monitoring
function startMotionMonitoring() {
  if (!state.isCalibrated || !state.sessionActive) return;
  
  console.log('Motion monitoring active');
  
  setInterval(() => {
    if (!state.sessionActive) return;
    
    const accel = Puck.accel();
    const motion = calculateMotionMagnitude(accel);
    checkForRep(motion);
  }, 1000 / CONFIG.motion.sampleRate);
}

// Calculate motion magnitude from baseline
function calculateMotionMagnitude(accel) {
  const dx = accel.x - state.baseline.x;
  const dy = accel.y - state.baseline.y;
  const dz = accel.z - state.baseline.z;
  
  // Weighted magnitude (emphasize vertical motion)
  return Math.sqrt(dx*dx + dy*dy + dz*dz*2);
}

// Check for rep detection
function checkForRep(motion) {
  const now = getTime() * 1000;
  
  // Cooldown check
  if (now - state.lastRepTime < CONFIG.motion.cooldown) return;
  
  // Adaptive threshold based on recent motion
  const adaptiveThreshold = CONFIG.motion.threshold;
  
  // Simple but effective rep detection
  if (motion > adaptiveThreshold) {
    registerRep();
    state.lastRepTime = now;
  }
}

// Register a new rep
function registerRep() {
  state.repCount++;
  console.log(`Rep ${state.repCount} detected`);
  
  flashRep();
  sendRepPacket();
}

// Reset rep count
function resetRepCount() {
  state.repCount = 0;
  console.log('Rep count reset');
  flashReset();
  sendRepPacket();
}

// Send rep count packet to iOS app
function sendRepPacket() {
  const packet = new Uint8Array([
    PACKET_TYPE.REP_COUNT,
    state.repCount & 0xFF,
    (state.repCount >> 8) & 0xFF,
    calculateChecksum([PACKET_TYPE.REP_COUNT, state.repCount])
  ]);
  
  transmitPacket(packet);
}

// Send status packet
function sendStatusPacket() {
  const status = (state.isCalibrated ? 0x01 : 0x00) |
                 (state.sessionActive ? 0x02 : 0x00) |
                 (state.isConnected ? 0x04 : 0x00);
  
  const packet = new Uint8Array([
    PACKET_TYPE.STATUS,
    status,
    state.repCount & 0xFF,
    calculateChecksum([PACKET_TYPE.STATUS, status, state.repCount])
  ]);
  
  transmitPacket(packet);
}

// Send heartbeat
function sendHeartbeat() {
  const packet = new Uint8Array([
    PACKET_TYPE.HEARTBEAT,
    Math.floor(state.batteryLevel * 100),
    0x00,
    calculateChecksum([PACKET_TYPE.HEARTBEAT, Math.floor(state.batteryLevel * 100)])
  ]);
  
  transmitPacket(packet);
}

// Transmit packet via BLE
function transmitPacket(packet) {
  if (!state.isConnected) return;
  
  try {
    NRF.updateServices({
      [CONFIG.ble.serviceUUID]: {
        [CONFIG.ble.charUUID]: {
          value: packet,
          notify: true
        }
      }
    });
  } catch (e) {
    console.log('Transmission error:', e);
  }
}

// Calculate simple checksum
function calculateChecksum(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum & 0xFF;
}

// Heartbeat management
let heartbeatInterval;

function startHeartbeat() {
  heartbeatInterval = setInterval(() => {
    sendHeartbeat();
    state.lastHeartbeat = getTime() * 1000;
  }, CONFIG.ble.heartbeatInterval);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Button setup
function setupButtons() {
  // Button press: toggle session or reset if long press
  setWatch((e) => {
    const pressTime = e.time;
    let released = false;
    
    // Watch for button release
    setWatch(() => {
      if (released) return;
      released = true;
      
      const duration = getTime() - pressTime;
      
      if (duration > 2) {
        // Long press: reset
        resetRepCount();
      } else {
        // Short press: toggle session
        if (state.sessionActive) {
          endSession();
        } else {
          startSession();
        }
      }
    }, BTN, { edge: 'rising', repeat: false });
    
  }, BTN, { edge: 'falling', repeat: true });
}

// Power management
function setupPowerManagement() {
  setInterval(() => {
    state.batteryLevel = analogRead(D29);
    
    if (state.batteryLevel < CONFIG.power.lowBatteryThreshold) {
      flashLowBattery();
    }
  }, CONFIG.power.batteryCheckInterval);
}

// LED feedback functions
function flashRep() {
  digitalPulse(LED2, 1, [50]); // Quick green flash
}

function flashConnection() {
  digitalPulse(LED3, 1, [200, 100, 200]); // Blue pulse
}

function flashDisconnection() {
  digitalPulse(LED1, 1, [200]); // Red pulse
}

function flashCalibration() {
  digitalPulse(LED3, 1, [100, 100, 100]); // Blue blinks
}

function flashSuccess() {
  digitalPulse(LED2, 1, [200, 100, 200, 100, 200]); // Green success pattern
}

function flashReset() {
  digitalPulse(LED1, 1, [100, 100, 100]); // Red blinks
}

function flashSessionStart() {
  digitalPulse([LED1, LED2, LED3], 1, [150]); // All LEDs
}

function flashSessionEnd() {
  digitalPulse([LED1, LED2, LED3], 1, [50, 50, 50]); // All LEDs triple blink
}

function flashLowBattery() {
  digitalPulse(LED1, 1, [50, 50, 50, 50, 50]); // Red rapid blinks
}

// Startup sequence
function startupSequence() {
  digitalPulse(LED1, 1, [200]);
  setTimeout(() => digitalPulse(LED2, 1, [200]), 300);
  setTimeout(() => digitalPulse(LED3, 1, [200]), 600);
}

// Error handling
process.on('uncaughtException', function(e) {
  console.log('Error:', e);
  digitalPulse(LED1, 1, [50, 50, 50]); // Error indication
  
  // Send error packet if connected
  if (state.isConnected) {
    const errorPacket = new Uint8Array([PACKET_TYPE.ERROR, 0x01, 0x00, 0x00]);
    transmitPacket(errorPacket);
  }
});

// Initialize device
setTimeout(init, 1000);

// Save to flash
save();