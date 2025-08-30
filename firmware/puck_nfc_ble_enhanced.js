// Enhanced Puck.js Firmware with NFC Auto-Connect and BLE
// Compatible with TapFit BLE Sensors page

var state = {
  repCount: 0,
  sessionActive: false,
  connected: false,
  calibrated: false,
  batteryLevel: 100,
  nfcDetected: false,
  autoConnectTriggered: false,
  baselineX: 0, baselineY: 0, baselineZ: 0
};

// BLE Configuration - Nordic UART Service for compatibility
var SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
var TX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
var RX_CHAR_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

// Packet types for BLE communication
var PACKET_TYPE = {
  REP_COUNT: 0x01,
  MOTION: 0x02,
  STATUS: 0x03,
  NFC_DETECTED: 0x04,
  AUTO_CONNECT: 0x05,
  HEARTBEAT: 0x06
};

// Commands from app
var COMMAND = {
  START_SESSION: 0x01,
  STOP_SESSION: 0x02,
  RESET_REPS: 0x03,
  CALIBRATE: 0x04,
  GET_STATUS: 0x05
};

// Configuration
var MOTION_THRESHOLD = 0.15;
var REP_COOLDOWN = 500; // ms between reps
var SESSION_TIMEOUT = 300000; // 5 minutes
var ADVERTISING_BOOST_DURATION = 10000; // 10 seconds after NFC

var lastRepTime = 0;
var lastMotionTime = 0;
var advertisingBoostEnd = 0;

function initializePuck() {
  console.log("Initializing Enhanced NFC-BLE Puck...");
  
  setupBLE();
  setupNFC();
  setupButtons();
  calibrateAccelerometer();
  setupMotionDetection();
  
  // Start advertising
  startAdvertising();
  
  // Battery monitoring
  setInterval(function() {
    state.batteryLevel = getBatteryLevel();
    if (state.batteryLevel < 20) {
      ledSequence([[LED1,200],[LED2,200],[LED3,200]], 100);
      if (state.connected) sendStatus();
    }
  }, 30000);
  
  console.log("Puck initialization complete");
}

function setupBLE() {
  // Define BLE services with Nordic UART compatibility
  var services = {};
  services[SERVICE_UUID] = {
    [TX_CHAR_UUID]: {
      value: [0x00],
      notify: true,
      readable: true
    },
    [RX_CHAR_UUID]: {
      value: [0x00],
      writable: true,
      onWrite: handleIncomingCommand
    }
  };
  
  NRF.setServices(services, { uart: false });
  
  // Connection handlers
  NRF.on('connect', handleConnect);
  NRF.on('disconnect', handleDisconnect);
  
  console.log("BLE services configured");
}

function setupNFC() {
  try {
    // Configure NFC for auto-connect URL
    NRF.nfcURL("tapfit://sensor/puck?autoConnect=true");
    
    // Listen for NFC field detection
    NRF.on('NFCon', function() {
      console.log("NFC field detected");
      handleNFCDetection();
    });
    
    console.log("NFC configured for auto-connect");
  } catch (e) {
    console.log("NFC setup failed:", e);
  }
}

function handleNFCDetection() {
  state.nfcDetected = true;
  state.autoConnectTriggered = true;
  
  // Enhanced advertising boost for 10 seconds
  advertisingBoostEnd = getTime() + (ADVERTISING_BOOST_DURATION / 1000);
  startAdvertising(true);
  
  // Visual feedback
  ledSequence([[LED1,100],[LED2,100],[LED3,100]], 50);
  
  // Send NFC detection packet if connected
  if (state.connected) {
    sendPacket(PACKET_TYPE.NFC_DETECTED, [1]);
    sendPacket(PACKET_TYPE.AUTO_CONNECT, [1]);
  }
  
  // Auto-start session if not active
  if (!state.sessionActive) {
    setTimeout(startSession, 1000);
  }
  
  console.log("NFC auto-connect triggered");
}

function startAdvertising(boost) {
  var interval = 375; // Default advertising interval
  
  if (boost || getTime() < advertisingBoostEnd) {
    interval = 20; // Aggressive advertising for discovery
  }
  
  NRF.setAdvertising({
    0x1812: [0x12,0x18] // HID Service for better discovery
  }, {
    name: "TapFit",
    showName: true,
    discoverable: true,
    connectable: true,
    interval: interval
  });
}

function restartAdvertising() {
  NRF.setAdvertising({}, {name: ""});
  setTimeout(startAdvertising, 100);
}

function handleConnect() {
  console.log("BLE Connected");
  state.connected = true;
  
  // Visual feedback
  LED2.set();
  setTimeout(() => LED2.reset(), 200);
  
  // Send handshake and current state
  sendPacket(PACKET_TYPE.STATUS, [
    state.sessionActive ? 1 : 0,
    state.repCount & 0xFF,
    state.batteryLevel
  ]);
  
  // Send NFC auto-connect acknowledgment if triggered
  if (state.autoConnectTriggered) {
    sendPacket(PACKET_TYPE.AUTO_CONNECT, [1]);
    state.autoConnectTriggered = false;
  }
  
  if (state.nfcDetected) {
    sendPacket(PACKET_TYPE.NFC_DETECTED, [1]);
    state.nfcDetected = false;
  }
}

function handleDisconnect() {
  console.log("BLE Disconnected");
  state.connected = false;
  
  // Visual feedback
  LED1.set();
  setTimeout(() => LED1.reset(), 200);
  
  // Stop session if active
  if (state.sessionActive) {
    stopSession();
  }
  
  // Restart advertising
  restartAdvertising();
}

function handleIncomingCommand(evt) {
  var data = evt.data;
  if (!data || data.length === 0) return;
  
  var command = data[0];
  console.log("Received command:", command);
  
  switch (command) {
    case COMMAND.START_SESSION:
      startSession();
      break;
    case COMMAND.STOP_SESSION:
      stopSession();
      break;
    case COMMAND.RESET_REPS:
      resetReps();
      break;
    case COMMAND.CALIBRATE:
      calibrateAccelerometer();
      break;
    case COMMAND.GET_STATUS:
      sendStatus();
      break;
  }
}

function calibrateAccelerometer() {
  console.log("Calibrating accelerometer...");
  
  var samples = 0;
  var sumX = 0, sumY = 0, sumZ = 0;
  
  // Visual feedback
  LED3.set();
  
  var calibrationInterval = setInterval(function() {
    var accel = Puck.accel();
    sumX += accel.x;
    sumY += accel.y;
    sumZ += accel.z;
    samples++;
    
    if (samples >= 20) {
      state.baselineX = sumX / samples;
      state.baselineY = sumY / samples;
      state.baselineZ = sumZ / samples;
      state.calibrated = true;
      
      clearInterval(calibrationInterval);
      LED3.reset();
      
      // Success feedback
      ledSequence([[LED2,100],[LED2,100]], 50);
      
      console.log("Calibration complete");
      if (state.connected) sendStatus();
    }
  }, 50);
}

function setupMotionDetection() {
  Puck.accelOn(26); // 26Hz sampling
  
  Puck.on('accel', processMotion);
  
  console.log("Motion detection active");
}

function processMotion(accelData) {
  if (!state.calibrated || !state.connected) return;
  
  var now = getTime();
  lastMotionTime = now;
  
  // Calculate motion magnitude
  var deltaX = accelData.x - state.baselineX;
  var deltaY = accelData.y - state.baselineY;
  var deltaZ = accelData.z - state.baselineZ;
  
  var magnitude = Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
  
  // Send motion data
  if (magnitude > 0.05) { // Minimal motion threshold
    sendPacket(PACKET_TYPE.MOTION, [Math.min(255, Math.round(magnitude * 100))]);
  }
  
  // Rep detection
  if (magnitude > MOTION_THRESHOLD && (now * 1000 - lastRepTime) > REP_COOLDOWN) {
    registerRep();
  }
  
  // Session timeout
  if (state.sessionActive && (now * 1000 - lastRepTime) > SESSION_TIMEOUT) {
    console.log("Session timeout");
    stopSession();
  }
}

function registerRep() {
  state.repCount++;
  lastRepTime = getTime() * 1000;
  
  // Visual feedback
  LED1.set();
  setTimeout(() => LED1.reset(), 100);
  
  // Send rep count
  sendPacket(PACKET_TYPE.REP_COUNT, [state.repCount & 0xFF]);
  
  console.log("Rep registered:", state.repCount);
}

function startSession() {
  state.sessionActive = true;
  state.repCount = 0;
  lastRepTime = getTime() * 1000;
  
  // Visual feedback
  ledSequence([[LED2,200],[LED1,200],[LED2,200]], 100);
  
  if (state.connected) sendStatus();
  
  console.log("Session started");
}

function stopSession() {
  state.sessionActive = false;
  
  // Visual feedback
  ledSequence([[LED1,200],[LED2,200],[LED1,200]], 100);
  
  if (state.connected) sendStatus();
  
  console.log("Session stopped");
}

function resetReps() {
  state.repCount = 0;
  
  // Visual feedback
  ledSequence([[LED3,100],[LED3,100],[LED3,100]], 50);
  
  if (state.connected) {
    sendPacket(PACKET_TYPE.REP_COUNT, [0]);
  }
  
  console.log("Reps reset");
}

function setupButtons() {
  // Button press to toggle session
  setWatch(function() {
    if (state.sessionActive) {
      stopSession();
    } else {
      startSession();
    }
  }, BTN, {edge:"rising", debounce:250, repeat:true});
}

function sendPacket(type, data) {
  if (!state.connected) return;
  
  try {
    var packet = [type].concat(data || []);
    
    var updateData = {};
    updateData[SERVICE_UUID] = {};
    updateData[SERVICE_UUID][TX_CHAR_UUID] = {
      value: packet,
      notify: true
    };
    
    NRF.updateServices(updateData);
  } catch (e) {
    console.log("Send packet error:", e);
  }
}

function sendRepCount() {
  sendPacket(PACKET_TYPE.REP_COUNT, [state.repCount & 0xFF]);
}

function sendStatus() {
  var battery = getBatteryLevel();
  sendPacket(PACKET_TYPE.STATUS, [
    state.sessionActive ? 1 : 0,
    state.repCount & 0xFF,
    battery,
    state.calibrated ? 1 : 0,
    state.nfcDetected ? 1 : 0
  ]);
}

function sendHeartbeat() {
  if (state.connected) {
    sendPacket(PACKET_TYPE.HEARTBEAT, [getTime() & 0xFF]);
  }
}

function getBatteryLevel() {
  var voltage = NRF.getBattery();
  // Convert 3.3V max to percentage (rough estimate)
  var percentage = Math.round(((voltage - 2.0) / 1.3) * 100);
  return Math.max(0, Math.min(100, percentage));
}

function ledSequence(leds, delayMs) {
  var index = 0;
  
  function nextLed() {
    if (index < leds.length) {
      var led = leds[index][0];
      var duration = leds[index][1];
      
      led.set();
      setTimeout(function() {
        led.reset();
        index++;
        setTimeout(nextLed, delayMs);
      }, duration);
    }
  }
  
  nextLed();
}

// Heartbeat every 30 seconds when connected
setInterval(function() {
  if (state.connected) {
    sendHeartbeat();
  }
  
  // Update advertising if in boost mode
  if (getTime() < advertisingBoostEnd) {
    startAdvertising(true);
  }
}, 30000);

// Error handling
process.on('uncaughtException', function(e) {
  console.log("Error:", e);
  // Visual error indication
  ledSequence([[LED1,500],[LED2,500],[LED3,500]], 100);
  
  // Attempt recovery
  setTimeout(function() {
    try {
      restartAdvertising();
    } catch (err) {
      console.log("Recovery failed:", err);
    }
  }, 2000);
});

// Initialize after 1 second
setTimeout(initializePuck, 1000);