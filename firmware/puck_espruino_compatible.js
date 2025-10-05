// TapFit Puck Enhanced NFC Auto-Connect Firmware v3.0 - Espruino Compatible
// Optimized for TapFit App v1.2.5
// Features: Instant NFC response, perfect BLE handshake, accurate rep counting

var DEVICE_NAME = "TapFit Puck";
var SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
var TX_CHAR_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
var RX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// Device state management
var state = {
  repCount: 0,
  sessionActive: false,
  isConnected: false,
  isCalibrated: false,
  batteryLevel: 1.0,
  lastMotion: 0,
  calibrationData: { x: 0, y: 0, z: 0 },
  motionThreshold: 0.8,
  lastRepTime: 0,
  sessionTimeout: 300000, // 5 minutes
  sessionStartTime: 0
};

// Packet types for communication
var PACKET_TYPE = {
  REP_COUNT: 0x01,
  STATUS: 0x02,
  HEARTBEAT: 0x03,
  BATTERY: 0x04,
  ERROR: 0xFF
};

// Commands from app
var COMMAND = {
  HANDSHAKE: 0x01,
  START_SESSION: 0x02,
  STOP_SESSION: 0x03,
  CALIBRATE: 0x04,
  RESET: 0x05,
  STATUS_REQUEST: 0x06
};

var bleService, txCharacteristic, rxCharacteristic;
var motionInterval, heartbeatInterval;
var nfcFieldDetected = false;

// Main initialization
function initializePuck() {
  console.log("TapFit Puck v3.0 initializing...");
  
  setupBLE();
  setupNFC();
  setupButtons();
  setupAccelerometer();
  setupMotionDetection();
  
  // Start advertising immediately
  startAdvertising(false);
  
  // Battery monitoring
  setInterval(function() {
    state.batteryLevel = getBatteryLevel();
    if (state.isConnected) {
      sendHeartbeat();
    }
  }, 30000);
  
  // Visual startup indication
  ledSequence([LED1, LED2, LED3], 200, 1);
  console.log("TapFit Puck ready for NFC and BLE");
}

// BLE Service Setup
function setupBLE() {
  console.log("Setting up BLE service...");
  
  try {
    // Create service object using string keys (Espruino compatible)
    var services = {};
    services[SERVICE_UUID] = {};
    
    // TX Characteristic
    services[SERVICE_UUID][TX_CHAR_UUID] = {
      value: [0],
      maxLen: 20,
      writable: false,
      readable: true,
      notify: true
    };
    
    // RX Characteristic
    services[SERVICE_UUID][RX_CHAR_UUID] = {
      value: [0],
      maxLen: 20,
      writable: true,
      onWrite: handleIncomingCommand
    };
    
    NRF.setServices(services, { advertise: [SERVICE_UUID] });
    
    // Connection event handlers
    NRF.on('connect', handleConnect);
    NRF.on('disconnect', handleDisconnect);
    
    console.log("BLE service setup complete");
  } catch (e) {
    console.log("BLE setup error:", e);
    // Attempt recovery
    setTimeout(function() {
      console.log("Attempting recovery...");
      initializePuck();
    }, 2000);
  }
}

// NFC Setup for auto-connect trigger
function setupNFC() {
  console.log("Setting up NFC...");
  
  try {
    // Enable NFC with auto-connect data
    NRF.nfcURL("https://tapfit.info/nfc");
    
    // NFC field detection for instant response
    NRF.on('NFCon', function() {
      console.log("NFC detected!");
      nfcFieldDetected = true;
      handleNFCDetection();
    });
    
    NRF.on('NFCoff', function() {
      console.log("NFC removed");
      nfcFieldDetected = false;
    });
    
    console.log("NFC setup complete");
  } catch (e) {
    console.log("NFC setup error:", e);
  }
}

function handleNFCDetection() {
  console.log("NFC auto-connect triggered");
  
  // Visual feedback
  LED1.write(1);
  setTimeout(function() { LED1.write(0); }, 500);
  
  // Boost advertising for faster discovery
  startAdvertising(true);
  
  // Auto-boost timeout
  setTimeout(function() {
    if (!state.isConnected) {
      startAdvertising(false); // Return to normal advertising
    }
  }, 10000);
}

// Enhanced advertising with boost mode
function startAdvertising(boost) {
  if (boost === undefined) boost = false;
  
  var advData = {};
  advData[0x02] = [0x01, 0x06]; // General discoverable mode
  advData[0x03] = [0x01, 0x40, 0x6e]; // Service UUID (shortened)
  advData[0x09] = DEVICE_NAME; // Complete local name
  advData[0x0A] = [0x04]; // TX power level
  
  var scanData = {};
  scanData[0x09] = DEVICE_NAME;
  scanData[0x16] = [0x12, 0x18, Math.floor(state.batteryLevel * 100)]; // Battery service data
  
  var options = {
    name: DEVICE_NAME,
    interval: boost ? 20 : 100, // Faster when boosted
    connectable: true,
    discoverable: true,
    showName: true
  };
  
  NRF.setAdvertising(advData, options);
  NRF.setScanResponse(scanData);
  
  console.log("Advertising started" + (boost ? " (boosted)" : ""));
}

function restartAdvertising(boost) {
  if (boost === undefined) boost = false;
  
  NRF.setAdvertising({}, { connectable: false });
  setTimeout(function() { startAdvertising(boost); }, 100);
}

// Connection handlers
function handleConnect() {
  console.log("BLE device connected");
  state.isConnected = true;
  
  // Visual feedback
  LED2.write(1);
  setTimeout(function() { LED2.write(0); }, 1000);
  
  // Send initial status
  setTimeout(sendStatus, 500);
}

function handleDisconnect() {
  console.log("BLE device disconnected");
  state.isConnected = false;
  
  // Stop session if active
  if (state.sessionActive) {
    stopSession();
  }
  
  // Restart advertising
  setTimeout(function() { startAdvertising(false); }, 1000);
}

// Command handling from app
function handleIncomingCommand(evt) {
  var data = new Uint8Array(evt.data);
  var command = data[0];
  
  console.log("Received command:", command);
  
  switch (command) {
    case COMMAND.HANDSHAKE:
      console.log("Handshake received");
      sendStatus();
      break;
      
    case COMMAND.START_SESSION:
      startSession();
      break;
      
    case COMMAND.STOP_SESSION:
      stopSession();
      break;
      
    case COMMAND.CALIBRATE:
      calibrateAccelerometer();
      break;
      
    case COMMAND.RESET:
      resetReps();
      break;
      
    case COMMAND.STATUS_REQUEST:
      sendStatus();
      break;
      
    default:
      console.log("Unknown command:", command);
  }
}

// Accelerometer calibration
function calibrateAccelerometer() {
  console.log("Starting calibration...");
  state.isCalibrated = false;
  
  var samples = [];
  var sampleCount = 10;
  
  function takeSample() {
    var acc = Puck.accel();
    samples.push(acc);
    
    if (samples.length < sampleCount) {
      setTimeout(takeSample, 100);
    } else {
      // Calculate averages
      var sumX = 0, sumY = 0, sumZ = 0;
      for (var i = 0; i < samples.length; i++) {
        sumX += samples[i].x;
        sumY += samples[i].y;
        sumZ += samples[i].z;
      }
      
      state.calibrationData = {
        x: sumX / samples.length,
        y: sumY / samples.length,
        z: sumZ / samples.length
      };
      
      state.isCalibrated = true;
      console.log("Calibration complete:", state.calibrationData);
      
      // Visual feedback
      ledSequence([LED2], 100, 3);
      
      sendStatus();
    }
  }
  
  takeSample();
}

function setupMotionDetection() {
  // High-frequency motion detection for accurate rep counting
  motionInterval = setInterval(processMotion, 50); // 20Hz
}

function processMotion() {
  if (!state.isCalibrated || !state.sessionActive) return;
  
  var acc = Puck.accel();
  var now = getTime();
  
  // Calculate deviation from calibrated baseline
  var deltaX = Math.abs(acc.x - state.calibrationData.x);
  var deltaY = Math.abs(acc.y - state.calibrationData.y);
  var deltaZ = Math.abs(acc.z - state.calibrationData.z);
  var magnitude = Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
  
  // Rep detection with debouncing
  if (magnitude > state.motionThreshold && (now - state.lastRepTime) > 1000) { // 1 second debounce
    state.repCount++;
    state.lastRepTime = now;
    state.lastMotion = now;
    
    console.log("Rep detected! Count:", state.repCount, "Magnitude:", magnitude.toFixed(2));
    
    // Visual feedback
    LED3.write(1);
    setTimeout(function() { LED3.write(0); }, 200);
    
    // Send rep count to app
    sendRepCount();
  }
  
  // Session timeout check
  if (now - state.lastMotion > state.sessionTimeout && state.sessionActive) {
    console.log("Session timeout - stopping");
    stopSession();
  }
}

function startSession() {
  console.log("Starting workout session");
  state.sessionActive = true;
  state.sessionStartTime = getTime();
  state.lastMotion = getTime();
  
  // Reset rep count for new session
  state.repCount = 0;
  
  // Visual feedback - all LEDs on briefly
  LED1.write(1);
  LED2.write(1);
  LED3.write(1);
  setTimeout(function() {
    LED1.write(0);
    LED2.write(0);
    LED3.write(0);
  }, 1000);
  
  sendStatus();
}

function stopSession() {
  console.log("Stopping workout session");
  state.sessionActive = false;
  
  // Visual feedback - all LEDs on briefly
  LED1.write(1);
  LED2.write(1);
  LED3.write(1);
  setTimeout(function() {
    LED1.write(0);
    LED2.write(0);
    LED3.write(0);
  }, 1000);
  
  sendStatus();
}

function resetReps() {
  console.log("Resetting rep count");
  state.repCount = 0;
  sendRepCount();
}

// Button setup for manual control
function setupButtons() {
  setWatch(function() {
    if (state.sessionActive) {
      stopSession();
    } else if (state.isCalibrated) {
      startSession();
    }
  }, BTN, { edge: "rising", debounce: 50, repeat: true });
}

function setupAccelerometer() {
  // Enable accelerometer with optimal settings
  Puck.accelOn(12.5); // 12.5Hz for baseline, motion detection uses polling
}

// Communication functions
function sendPacket(type, data) {
  if (data === undefined) data = [];
  if (!state.isConnected) return false;
  
  var packet = [type].concat(data);
  var buffer = new Uint8Array(packet);
  
  try {
    // Use direct characteristic update instead of recreating services
    var updateData = {};
    updateData[SERVICE_UUID] = {};
    updateData[SERVICE_UUID][TX_CHAR_UUID] = { value: buffer, notify: true };
    NRF.updateServices(updateData);
    return true;
  } catch (e) {
    console.log("Send failed:", e);
    return false;
  }
}

function sendRepCount() {
  var repBytes = [
    (state.repCount >> 8) & 0xFF,
    state.repCount & 0xFF
  ];
  sendPacket(PACKET_TYPE.REP_COUNT, repBytes);
}

function sendStatus() {
  var statusData = [
    state.sessionActive ? 1 : 0,
    state.isCalibrated ? 1 : 0,
    Math.floor(state.batteryLevel * 100),
    (state.repCount >> 8) & 0xFF,
    state.repCount & 0xFF
  ];
  sendPacket(PACKET_TYPE.STATUS, statusData);
}

function sendHeartbeat() {
  var batteryPercent = Math.floor(state.batteryLevel * 100);
  sendPacket(PACKET_TYPE.HEARTBEAT, [batteryPercent]);
}

// Utility functions
function getBatteryLevel() {
  var voltage = NRF.getBattery();
  // Convert voltage to percentage (3.0V = 0%, 4.2V = 100%)
  var percentage = Math.max(0, Math.min(1, (voltage - 3.0) / 1.2));
  return percentage;
}

function ledSequence(leds, duration, repeats) {
  if (repeats === undefined) repeats = 1;
  
  var count = 0;
  function sequence() {
    for (var i = 0; i < leds.length; i++) {
      (function(led, delay) {
        setTimeout(function() {
          led.write(1);
          setTimeout(function() { led.write(0); }, duration / 2);
        }, delay);
      })(leds[i], i * duration / 3);
    }
    
    count++;
    if (count < repeats) {
      setTimeout(sequence, duration);
    }
  }
  sequence();
}

// Error handling
process.on('uncaughtException', function(e) {
  console.log("Error:", e);
  
  // Attempt recovery
  setTimeout(function() {
    console.log("Attempting recovery...");
    initializePuck();
  }, 2000);
});

// Start the puck
initializePuck();