// TapFit Puck NFC Auto-Connect Test Firmware v1.0
// Enhanced with NFC detection and auto-connection signaling

var config = {
  SERVICE_UUID: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  TX_CHAR_UUID: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
  DEVICE_NAME: "TapFit-Test",
  MOTION_THRESHOLD: 0.12,
  COOLDOWN_MS: 500,
  TIMEOUT_MS: 25000
};

var state = {
  repCount: 0,
  sessionActive: false,
  connected: false,
  nfcDetected: false,
  baselineX: 0, baselineY: 0, baselineZ: 0,
  lastTrigger: 0,
  sessionStart: 0
};

var bleService, bleChar, motionInterval;

// Packet types for communication
var PACKET_TYPES = {
  REP_COUNT: 0,
  HANDSHAKE: 1,
  STATUS: 2,
  NFC_DETECTED: 3,
  AUTO_CONNECT: 4,
  BATTERY: 5
};

function initializePuck() {
  console.log("Initializing TapFit Puck with NFC Auto-Connect");
  
  setupBLE();
  setupNFC();
  setupButtons();
  calibrateAccelerometer();
  setupMotionDetection();
  
  // Signal ready with LED sequence
  ledSequence([LED1, LED2, LED3], 200);
}

function setupBLE() {
  // Configure BLE service
  bleService = {};
  bleService[config.SERVICE_UUID] = {};
  
  bleChar = {
    value: new Uint8Array([0]),
    notify: true,
    readable: true,
    writable: true,
    onWrite: handleIncomingCommand
  };
  
  bleService[config.SERVICE_UUID][config.TX_CHAR_UUID] = bleChar;
  
  NRF.setServices(bleService);
  NRF.setAdvertising({}, {
    name: config.DEVICE_NAME,
    connectable: true,
    interval: 375
  });
  
  // Connection events
  NRF.on('connect', handleConnect);
  NRF.on('disconnect', handleDisconnect);
}

function setupNFC() {
  // Enable NFC and set up auto-connect trigger
  NRF.nfcOn(function() {
    console.log("NFC tap detected!");
    state.nfcDetected = true;
    
    // Visual feedback for NFC tap
    LED3.set();
    setTimeout(() => LED3.reset(), 300);
    
    // Send NFC detection packet to trigger app connection
    sendPacket(PACKET_TYPES.NFC_DETECTED, [1]);
    
    // Send auto-connect signal after short delay
    setTimeout(() => {
      sendPacket(PACKET_TYPES.AUTO_CONNECT, [1]);
      console.log("Auto-connect signal sent");
    }, 500);
    
    // Start session if not already active
    if (!state.sessionActive) {
      setTimeout(() => startSession(), 1000);
    }
  });
}

function handleConnect() {
  console.log("BLE Connected");
  state.connected = true;
  
  // Green LED pulse for connection
  LED2.set();
  setTimeout(() => LED2.reset(), 500);
  
  // Send handshake with current rep count
  sendPacket(PACKET_TYPES.HANDSHAKE, [state.repCount, state.sessionActive ? 1 : 0]);
  
  // If NFC was detected, acknowledge the auto-connect
  if (state.nfcDetected) {
    setTimeout(() => {
      sendPacket(PACKET_TYPES.AUTO_CONNECT, [2]); // 2 = connected via NFC
    }, 200);
  }
}

function handleDisconnect() {
  console.log("BLE Disconnected");
  state.connected = false;
  state.nfcDetected = false;
  
  // Red LED pulse for disconnection
  LED1.set();
  setTimeout(() => LED1.reset(), 300);
  
  // Stop session if active
  if (state.sessionActive) {
    stopSession();
  }
}

function handleIncomingCommand(evt) {
  var data = new Uint8Array(evt.data);
  var command = data[0];
  
  console.log("Received command:", command);
  
  switch(command) {
    case 0x01: // START_SESSION
      startSession();
      break;
    case 0x02: // STOP_SESSION
      stopSession();
      break;
    case 0x03: // RESET_REPS
      resetReps();
      break;
    case 0x04: // CALIBRATE
      calibrateAccelerometer();
      break;
    case 0x05: // GET_STATUS
      sendStatus();
      break;
    case 0x06: // NFC_ACK
      console.log("NFC acknowledgment received");
      state.nfcDetected = false;
      break;
  }
}

function calibrateAccelerometer() {
  console.log("Calibrating accelerometer...");
  
  // Blue LED during calibration
  LED3.set();
  
  var samples = 0;
  var sumX = 0, sumY = 0, sumZ = 0;
  
  var calibInterval = setInterval(function() {
    var accel = Puck.accel();
    sumX += accel.x;
    sumY += accel.y;
    sumZ += accel.z;
    samples++;
    
    if (samples >= 20) {
      clearInterval(calibInterval);
      
      state.baselineX = sumX / samples;
      state.baselineY = sumY / samples;
      state.baselineZ = sumZ / samples;
      
      LED3.reset();
      
      // Quick double blink to indicate calibration complete
      setTimeout(() => {
        LED2.set();
        setTimeout(() => {
          LED2.reset();
          setTimeout(() => {
            LED2.set();
            setTimeout(() => LED2.reset(), 100);
          }, 100);
        }, 100);
      }, 100);
      
      console.log("Calibration complete");
      sendPacket(PACKET_TYPES.STATUS, [3]); // 3 = calibrated
    }
  }, 50);
}

function setupMotionDetection() {
  Puck.accelOn(26); // 26Hz sampling rate
  Puck.on('accel', processMotion);
}

function processMotion(accelData) {
  if (!state.sessionActive) return;
  
  // Calculate motion magnitude with weighted axes
  var deltaX = accelData.x - state.baselineX;
  var deltaY = accelData.y - state.baselineY;
  var deltaZ = accelData.z - state.baselineZ;
  
  var magnitude = Math.sqrt(
    deltaX * deltaX * 0.4 + 
    deltaY * deltaY * 0.3 + 
    deltaZ * deltaZ * 0.3
  );
  
  var now = getTime();
  
  // Rep detection with cooldown
  if (magnitude > config.MOTION_THRESHOLD && (now - state.lastTrigger) > config.COOLDOWN_MS) {
    registerRep();
    state.lastTrigger = now;
  }
  
  // Auto-timeout for inactive sessions
  if (now - state.sessionStart > config.TIMEOUT_MS) {
    console.log("Session timeout");
    stopSession();
  }
}

function registerRep() {
  state.repCount++;
  console.log("Rep detected:", state.repCount);
  
  // Quick LED flash for rep
  LED2.set();
  setTimeout(() => LED2.reset(), 100);
  
  // Send rep count to app
  sendPacket(PACKET_TYPES.REP_COUNT, [state.repCount]);
}

function startSession() {
  if (state.sessionActive) return;
  
  console.log("Starting workout session");
  state.sessionActive = true;
  state.sessionStart = getTime();
  state.repCount = 0;
  
  // Double LED pulse for session start
  ledSequence([LED2, LED2], 150);
  
  sendPacket(PACKET_TYPES.STATUS, [1]); // 1 = session started
}

function stopSession() {
  if (!state.sessionActive) return;
  
  console.log("Stopping workout session");
  state.sessionActive = false;
  
  // Single long LED pulse for session end
  LED1.set();
  setTimeout(() => LED1.reset(), 500);
  
  sendPacket(PACKET_TYPES.STATUS, [0]); // 0 = session stopped
}

function resetReps() {
  state.repCount = 0;
  console.log("Rep count reset");
  
  // Quick triple blink
  ledSequence([LED1, LED1, LED1], 100);
  
  sendPacket(PACKET_TYPES.REP_COUNT, [0]);
}

function sendStatus() {
  var batteryLevel = Math.round(analogRead(D30) * 100);
  sendPacket(PACKET_TYPES.STATUS, [
    state.sessionActive ? 1 : 0,
    state.repCount,
    batteryLevel
  ]);
}

function setupButtons() {
  // Button press toggles session or resets reps
  setWatch(function() {
    if (state.sessionActive) {
      stopSession();
    } else {
      startSession();
    }
  }, BTN, {edge: "rising", debounce: 50, repeat: true});
}

function sendPacket(type, data) {
  if (!state.connected) return;
  
  var packet = [type];
  if (data && data.length > 0) {
    packet = packet.concat(data);
  }
  
  try {
    var updateData = {};
    updateData[config.SERVICE_UUID] = {};
    updateData[config.SERVICE_UUID][config.TX_CHAR_UUID] = {
      value: new Uint8Array(packet),
      notify: true
    };
    NRF.updateServices(updateData);
  } catch(e) {
    console.log("Send packet error:", e);
  }
}

function ledSequence(leds, delayMs) {
  leds.forEach((led, index) => {
    setTimeout(() => {
      led.set();
      setTimeout(() => led.reset(), delayMs / 2);
    }, index * delayMs);
  });
}

// Battery monitoring
setInterval(function() {
  var voltage = analogRead(D30);
  if (voltage < 3.4) {
    // Low battery warning
    LED1.set();
    setTimeout(() => LED1.reset(), 1000);
    
    if (state.connected) {
      sendPacket(PACKET_TYPES.BATTERY, [Math.round(voltage * 100)]);
    }
  }
}, 30000);

// Error handler
process.on('uncaughtException', function(err) {
  console.log("Error:", err);
  LED3.set();
  setTimeout(() => LED3.reset(), 200);
});

// Initialize after 1 second
setTimeout(initializePuck, 1000);

console.log("TapFit Puck NFC Auto-Connect Test Firmware loaded");