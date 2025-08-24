// TapFit Puck NFC Auto-Connect Firmware - Enhanced v2.0
// Espruino-compatible firmware with automatic NFC detection and BLE connection

// Configuration
const SERVICE_UUID = "0000FFE0-0000-1000-8000-00805F9B34FB";
const CHAR_UUID = "0000FFE1-0000-1000-8000-00805F9B34FB";
const DEVICE_NAME = "TapFit-Puck-NFC";
const MOTION_THRESHOLD = 0.15;
const REP_COOLDOWN = 800;
const SESSION_TIMEOUT = 300000; // 5 minutes
const CONNECTION_TIMEOUT = 30000; // 30 seconds

// State management
var state = {
  repCount: 0,
  sessionActive: false,
  connected: false,
  nfcDetected: false,
  calibrated: false,
  accelBaseline: { x: 0, y: 0, z: 0 },
  lastMotionTime: 0,
  connectionTimer: null,
  advertTimer: null
};

// Packet types for communication
const PACKET_TYPE = {
  REP_COUNT: 0x01,
  STATUS: 0x02,
  HEARTBEAT: 0x03,
  BATTERY: 0x04,
  NFC_DETECTED: 0x06,
  AUTO_CONNECT: 0x07,
  NFC_ACK: 0x08,
  ERROR: 0xFF
};

// Commands from app
const COMMAND = {
  RESET: 0x00,
  START_SESSION: 0x01,
  END_SESSION: 0x02,
  REQUEST_STATUS: 0x03,
  CALIBRATE: 0x04,
  NFC_ACK: 0x06
};

// Initialize the Puck
function initializePuck() {
  console.log("TapFit Puck NFC Auto-Connect Enhanced Firmware v2.0 loaded");
  console.log("Initializing TapFit Puck with enhanced NFC and BLE...");
  
  setupBLE();
  setupNFC();
  setupButtons();
  calibrateAccelerometer();
  setupMotionDetection();
  
  // Start advertising immediately
  startAdvertising();
  
  console.log("TapFit Puck initialization complete - Ready for NFC and BLE");
  ledSequence([[LED1, LED2, LED3], [LED1, LED2, LED3]], 200);
}

// Enhanced BLE setup with better advertising
function setupBLE() {
  // Clear any existing services
  NRF.setServices(undefined, { uart: false });
  
  // Configure the service and characteristic
  NRF.setServices({
    [SERVICE_UUID]: {
      [CHAR_UUID]: {
        value: [0x00],
        maxLen: 20,
        writable: true,
        readable: true,
        notify: true,
        description: "TapFit Data Channel"
      }
    }
  }, { uart: false, hid: false });

  // Enhanced connection event handlers
  NRF.on('connect', handleConnect);
  NRF.on('disconnect', handleDisconnect);
  
  // Handle incoming commands
  NRF.on('characteristicWritten', function(evt) {
    if (evt.characteristic.uuid === CHAR_UUID) {
      handleIncomingCommand(evt);
    }
  });
  
  console.log("Enhanced BLE service configured");
}

// Enhanced NFC setup with proper event handling
function setupNFC() {
  try {
    // Enable NFC with field detection
    NRF.nfcURL("https://tapfit.app/nfc-connect");
    
    // Set up field detection for proximity sensing
    NRF.on('NFCon', function() {
      console.log("NFC field detected - device in proximity");
      handleNFCDetection();
    });
    
    NRF.on('NFCoff', function() {
      console.log("NFC field lost");
      // Reset NFC detection state after delay
      setTimeout(function() {
        state.nfcDetected = false;
      }, 2000);
    });
    
    console.log("Enhanced NFC detection configured with field sensing");
  } catch (e) {
    console.log("NFC setup error:", e);
  }
}

// Handle NFC detection with enhanced signaling
function handleNFCDetection() {
  console.log("NFC tap detected - initiating auto-connect sequence");
  
  state.nfcDetected = true;
  
  // Visual feedback - rapid blue LED sequence
  ledSequence([[LED2], [], [LED2], []], 100);
  
  // Send NFC detection packet
  sendPacket(PACKET_TYPE.NFC_DETECTED, [0x01]);
  
  // Send auto-connect signal
  setTimeout(function() {
    sendPacket(PACKET_TYPE.AUTO_CONNECT, [0x01]);
  }, 100);
  
  // Restart advertising with enhanced parameters for better discoverability
  restartAdvertising();
  
  // Start auto-session if not already active
  if (!state.sessionActive) {
    setTimeout(function() {
      startSession();
    }, 1000);
  }
}

// Enhanced advertising management
function startAdvertising() {
  var advData = {
    name: DEVICE_NAME,
    services: [SERVICE_UUID],
    txPower: 4,
    showName: true,
    discoverable: true,
    connectable: true
  };
  
  NRF.setAdvertising(advData, {
    name: DEVICE_NAME,
    interval: 100, // Fast advertising for quick discovery
    maxInterval: 200
  });
  
  console.log("Enhanced BLE advertising started:", DEVICE_NAME);
}

function restartAdvertising() {
  console.log("Restarting BLE advertising for NFC auto-connect...");
  
  // Stop current advertising
  NRF.setAdvertising({}, { interval: 0 });
  
  // Clear any existing timer
  if (state.advertTimer) {
    clearTimeout(state.advertTimer);
  }
  
  // Restart with enhanced parameters after brief pause
  state.advertTimer = setTimeout(function() {
    startAdvertising();
    
    // Boost advertising for 30 seconds
    setTimeout(function() {
      var normalAdvData = {
        name: DEVICE_NAME,
        services: [SERVICE_UUID],
        txPower: 0,
        interval: 500 // Normal advertising interval
      };
      NRF.setAdvertising(normalAdvData);
      console.log("Advertising returned to normal interval");
    }, 30000);
  }, 200);
}

// Enhanced connection handling
function handleConnect() {
  console.log("BLE Connected - TapFit device paired");
  
  state.connected = true;
  
  // Clear connection timeout
  if (state.connectionTimer) {
    clearTimeout(state.connectionTimer);
    state.connectionTimer = null;
  }
  
  // Visual feedback
  ledSequence([[LED2], [LED2]], 300);
  
  // Send handshake
  sendPacket(PACKET_TYPE.STATUS, [
    (state.calibrated ? 0x01 : 0x00) | (state.sessionActive ? 0x02 : 0x00),
    state.repCount,
    Math.round(getBatteryLevel() * 100)
  ]);
  
  // Send NFC acknowledgment if this was an NFC-triggered connection
  if (state.nfcDetected) {
    setTimeout(function() {
      sendPacket(PACKET_TYPE.NFC_ACK, [0x01]);
      console.log("NFC auto-connect handshake completed");
    }, 500);
  }
}

function handleDisconnect() {
  console.log("BLE Disconnected");
  
  state.connected = false;
  
  // Visual feedback
  ledSequence([[LED1], []], 200);
  
  // Stop session if active
  if (state.sessionActive) {
    stopSession();
  }
  
  // Restart advertising for reconnection
  setTimeout(function() {
    startAdvertising();
  }, 1000);
}

// Enhanced command handling
function handleIncomingCommand(evt) {
  if (!evt.data || evt.data.length === 0) return;
  
  var command = evt.data[0];
  console.log("Received command:", command);
  
  switch (command) {
    case COMMAND.START_SESSION:
      startSession();
      break;
    case COMMAND.END_SESSION:
      stopSession();
      break;
    case COMMAND.RESET:
      resetReps();
      break;
    case COMMAND.CALIBRATE:
      calibrateAccelerometer();
      break;
    case COMMAND.REQUEST_STATUS:
      sendStatus();
      break;
    case COMMAND.NFC_ACK:
      console.log("Received NFC acknowledgment from app");
      state.nfcDetected = false;
      break;
  }
}

// Enhanced accelerometer calibration
function calibrateAccelerometer() {
  console.log("Calibrating accelerometer...");
  
  // Visual feedback during calibration
  ledSequence([[LED1, LED2, LED3]], 100);
  
  var samples = [];
  var sampleCount = 0;
  var targetSamples = 20;
  
  function takeSample() {
    var accel = Puck.accel();
    samples.push(accel);
    sampleCount++;
    
    // Progress indication
    if (sampleCount % 5 === 0) {
      digitalPulse(LED2, 1, 50);
    }
    
    if (sampleCount < targetSamples) {
      setTimeout(takeSample, 50);
    } else {
      // Calculate baseline
      var sum = { x: 0, y: 0, z: 0 };
      samples.forEach(function(sample) {
        sum.x += sample.x;
        sum.y += sample.y;
        sum.z += sample.z;
      });
      
      state.accelBaseline = {
        x: sum.x / targetSamples,
        y: sum.y / targetSamples,
        z: sum.z / targetSamples
      };
      
      state.calibrated = true;
      console.log("Calibration complete:", state.accelBaseline);
      
      // Success indication
      ledSequence([[LED2], [LED2], [LED2]], 200);
      
      // Send status update
      sendStatus();
    }
  }
  
  takeSample();
}

// Enhanced motion detection and rep counting
function setupMotionDetection() {
  Puck.accelOn(26);
  Puck.on('accel', processMotion);
  console.log("Enhanced motion detection active");
}

function processMotion(accelData) {
  if (!state.calibrated || !state.sessionActive) return;
  
  var now = Date.now();
  
  // Calculate motion magnitude relative to baseline
  var deltaX = Math.abs(accelData.x - state.accelBaseline.x);
  var deltaY = Math.abs(accelData.y - state.accelBaseline.y);
  var deltaZ = Math.abs(accelData.z - state.accelBaseline.z);
  var magnitude = Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
  
  // Rep detection with cooldown
  if (magnitude > MOTION_THRESHOLD && (now - state.lastMotionTime) > REP_COOLDOWN) {
    state.lastMotionTime = now;
    registerRep();
  }
  
  // Session timeout check
  if (state.sessionActive && (now - state.lastMotionTime) > SESSION_TIMEOUT) {
    console.log("Session timeout - stopping session");
    stopSession();
  }
}

function registerRep() {
  state.repCount++;
  console.log("Rep registered:", state.repCount);
  
  // Visual feedback
  digitalPulse(LED2, 1, 100);
  
  // Send rep count update
  sendPacket(PACKET_TYPE.REP_COUNT, [state.repCount & 0xFF, (state.repCount >> 8) & 0xFF]);
}

// Enhanced session management
function startSession() {
  console.log("Starting workout session");
  
  state.sessionActive = true;
  state.repCount = 0;
  state.lastMotionTime = Date.now();
  
  // Visual feedback
  ledSequence([[LED1, LED2], [LED2, LED3], [LED1, LED3]], 150);
  
  sendStatus();
}

function stopSession() {
  console.log("Stopping workout session");
  
  state.sessionActive = false;
  
  // Visual feedback
  ledSequence([[LED1], [LED2], [LED3]], 200);
  
  sendStatus();
}

function resetReps() {
  console.log("Resetting rep count");
  
  state.repCount = 0;
  state.lastMotionTime = Date.now();
  
  // Visual feedback
  digitalPulse(LED3, 1, 300);
  
  sendPacket(PACKET_TYPE.REP_COUNT, [0x00, 0x00]);
}

// Enhanced status reporting
function sendStatus() {
  var batteryLevel = getBatteryLevel();
  var statusFlags = (state.calibrated ? 0x01 : 0x00) | (state.sessionActive ? 0x02 : 0x00) | (state.nfcDetected ? 0x04 : 0x00);
  
  sendPacket(PACKET_TYPE.STATUS, [
    statusFlags,
    state.repCount,
    Math.round(batteryLevel * 100)
  ]);
  
  console.log("Status sent - Calibrated:", state.calibrated, "Active:", state.sessionActive, "Reps:", state.repCount, "Battery:", Math.round(batteryLevel * 100) + "%");
}

// Enhanced button setup
function setupButtons() {
  setWatch(function() {
    console.log("Button pressed - toggling session");
    
    if (state.sessionActive) {
      stopSession();
    } else {
      startSession();
    }
  }, BTN, { edge: "rising", debounce: 50, repeat: true });
  
  console.log("Enhanced button controls configured");
}

// Enhanced packet sending with better error handling
function sendPacket(type, data) {
  if (!state.connected) {
    console.log("Not connected - packet queued:", type);
    return false;
  }
  
  try {
    var packet = [type];
    if (data) {
      packet = packet.concat(data);
    }
    
    NRF.updateServices({
      [SERVICE_UUID]: {
        [CHAR_UUID]: {
          value: packet,
          notify: true
        }
      }
    });
    
    return true;
  } catch (e) {
    console.log("Packet send error:", e);
    return false;
  }
}

// Enhanced LED sequence utility
function ledSequence(leds, delayMs) {
  leds.forEach(function(ledSet, index) {
    setTimeout(function() {
      LED1.reset();
      LED2.reset();
      LED3.reset();
      
      ledSet.forEach(function(led) {
        led.set();
      });
      
      setTimeout(function() {
        ledSet.forEach(function(led) {
          led.reset();
        });
      }, delayMs / 2);
    }, index * delayMs);
  });
}

// Enhanced battery monitoring
function getBatteryLevel() {
  return (analogRead(D30) * 3.3 * 1.5) / 3.3; // Normalized battery level
}

// Periodic battery and heartbeat monitoring
setInterval(function() {
  var batteryLevel = getBatteryLevel();
  
  if (batteryLevel < 0.15) {
    console.log("Low battery warning:", Math.round(batteryLevel * 100) + "%");
    ledSequence([[LED1], [LED1], [LED1]], 100);
  }
  
  if (state.connected) {
    sendPacket(PACKET_TYPE.HEARTBEAT, [Math.round(batteryLevel * 100)]);
  }
}, 30000);

// Enhanced error handling
process.on('uncaughtException', function(e) {
  console.log("Error:", e);
  ledSequence([[LED1, LED3], [LED1, LED3]], 100);
});

// Initialize after delay
setTimeout(initializePuck, 1000);

console.log("TapFit Puck NFC Auto-Connect Enhanced Firmware v2.0 ready for upload");