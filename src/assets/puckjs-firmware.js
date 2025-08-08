// Enhanced TapFit Puck.js Firmware v4.0
// Clean, Espruino-compatible version with robust JSON-based BLE integration
// Upload this code to your Puck.js devices using the Espruino Web IDE

// ============== CONFIGURATION ==============
var CONFIG = {
  machineId: "chest-press",
  motionThreshold: 0.8,
  repCooldown: 500,
  sampleRate: 12.5,
  deviceName: "TapFit-Puck",
  firmwareVersion: "4.0"
};

// Machine profiles for optimized detection
var MACHINE_PROFILES = {
  "chest-press": { threshold: 0.8, axis: "y", pattern: "push-pull", cooldown: 600 },
  "lat-pulldown": { threshold: 1.0, axis: "y", pattern: "pull-return", cooldown: 700 },
  "leg-press": { threshold: 1.2, axis: "z", pattern: "press-release", cooldown: 800 },
  "shoulder-press": { threshold: 0.9, axis: "y", pattern: "press-lower", cooldown: 500 },
  "treadmill": { threshold: 0.6, axis: "all", pattern: "step-cycle", cooldown: 300 },
  "bike": { threshold: 0.5, axis: "y", pattern: "pedal-cycle", cooldown: 400 }
};

// ============== STATE MANAGEMENT ==============
var state = {
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
  console.log("TapFit v" + CONFIG.firmwareVersion + " starting for " + CONFIG.machineId);
  
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
  
  console.log("TapFit ready for connection!");
}

// ============== BLE SYSTEM ==============
function setupBLE() {
  // Configure Nordic UART service
  var serviceConfig = {};
  serviceConfig["6E400001-B5A3-F393-E0A9-E50E24DCCA9E"] = {
    "6E400002-B5A3-F393-E0A9-E50E24DCCA9E": {
      value: [0],
      maxLen: 20,
      writable: true,
      onWrite: handleBLECommand
    },
    "6E400003-B5A3-F393-E0A9-E50E24DCCA9E": {
      value: [0],
      maxLen: 20,
      readable: true,
      notify: true
    }
  };
  
  NRF.setServices(serviceConfig, { 
    advertise: ["6E400001-B5A3-F393-E0A9-E50E24DCCA9E"] 
  });
  
  updateAdvertising();
}

function updateAdvertising() {
  var advertising = {};
  advertising[0x1809] = [state.repCount & 0xFF];
  advertising[0x180F] = [state.batteryLevel];
  
  NRF.setAdvertising(advertising, {
    name: CONFIG.deviceName + "-" + CONFIG.machineId,
    interval: state.nfcTriggered ? 100 : 500,
    connectable: true,
    discoverable: true
  });
}

function handleBLECommand(evt) {
  try {
    var cmdStr = "";
    for (var i = 0; i < evt.data.length; i++) {
      cmdStr += String.fromCharCode(evt.data[i]);
    }
    
    var cmd = JSON.parse(cmdStr);
    console.log("BLE command: " + cmd.type);
    
    if (cmd.type === "reset") {
      resetSession();
    } else if (cmd.type === "calibrate") {
      calibrateBaseline();
    } else if (cmd.type === "status") {
      sendStatus();
    } else if (cmd.type === "configure" && cmd.machineId) {
      CONFIG.machineId = cmd.machineId;
      console.log("Machine configured: " + CONFIG.machineId);
      sendStatus();
    }
  } catch(e) {
    console.log("Command error: " + e);
  }
}

function transmitData(data) {
  var json = JSON.stringify(data);
  
  // Send via UART
  try {
    Bluetooth.println(json);
  } catch(e) {
    console.log("UART failed: " + e);
  }
  
  // Update service characteristic
  try {
    var bytes = [];
    for (var i = 0; i < json.length && i < 20; i++) {
      bytes.push(json.charCodeAt(i));
    }
    
    var serviceUpdate = {};
    serviceUpdate["6E400001-B5A3-F393-E0A9-E50E24DCCA9E"] = {};
    serviceUpdate["6E400001-B5A3-F393-E0A9-E50E24DCCA9E"]["6E400003-B5A3-F393-E0A9-E50E24DCCA9E"] = {
      value: bytes,
      notify: true
    };
    
    NRF.updateServices(serviceUpdate);
  } catch(e) {
    console.log("Service update failed: " + e);
  }
}

// ============== NFC SYSTEM ==============
function setupNFC() {
  try {
    NRF.nfcURL("https://tapfit-ai-sync.lovable.app/#/workout/1?autoConnect=puck");
    console.log("NFC configured for: " + CONFIG.machineId);
  } catch(e) {
    console.log("NFC setup failed: " + e);
  }
}

// ============== MOTION DETECTION ==============
function setupAccelerometer() {
  Puck.accelOn(CONFIG.sampleRate);
  console.log("Accelerometer started at " + CONFIG.sampleRate + " Hz");
}

function calibrateBaseline() {
  state.isCalibrating = true;
  console.log("Calibrating...");
  
  var samples = [];
  var count = 0;
  var targetSamples = 30;
  
  var calibrateInterval = setInterval(function() {
    var accel = Puck.accel();
    samples.push(accel);
    count++;
    
    // Visual feedback
    LED2.write(count % 5 === 0);
    
    if (count >= targetSamples) {
      clearInterval(calibrateInterval);
      
      // Calculate baseline
      var sumX = 0, sumY = 0, sumZ = 0;
      for (var i = 0; i < samples.length; i++) {
        sumX += samples[i].x;
        sumY += samples[i].y;
        sumZ += samples[i].z;
      }
      
      state.baseline.x = sumX / targetSamples;
      state.baseline.y = sumY / targetSamples;
      state.baseline.z = sumZ / targetSamples;
      
      state.isCalibrating = false;
      LED2.write(0);
      
      // Success feedback
      flashSuccess();
      console.log("Calibration complete");
    }
  }, 50);
}

function startMonitoring() {
  setInterval(function() {
    if (state.isCalibrating) return;
    
    var accel = Puck.accel();
    var motion = calculateMotion(accel);
    
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
        type: "motion",
        value: motion,
        timestamp: Date.now()
      });
    }
    
  }, 80); // 12.5Hz
}

function calculateMotion(accel) {
  var profile = MACHINE_PROFILES[CONFIG.machineId];
  if (!profile) {
    profile = MACHINE_PROFILES["chest-press"]; // fallback
  }
  
  // Calculate delta from baseline
  var dx = Math.abs(accel.x - state.baseline.x);
  var dy = Math.abs(accel.y - state.baseline.y);
  var dz = Math.abs(accel.z - state.baseline.z);
  
  // Focus on primary axis for this machine
  if (profile.axis === "x") {
    return dx;
  } else if (profile.axis === "y") {
    return dy;
  } else if (profile.axis === "z") {
    return dz;
  } else {
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }
}

function checkForRep(motion) {
  var profile = MACHINE_PROFILES[CONFIG.machineId];
  if (!profile) {
    profile = MACHINE_PROFILES["chest-press"]; // fallback
  }
  
  var now = Date.now();
  
  // Check cooldown
  if (now - state.lastRepTime < profile.cooldown) return;
  
  // Check threshold
  if (motion > profile.threshold) {
    // Simple pattern check: look for motion peak followed by return to low
    if (state.motionBuffer.length >= 5) {
      var recent = state.motionBuffer.slice(-5);
      var peak = Math.max.apply(Math, recent.slice(0, 3));
      var valley = Math.min.apply(Math, recent.slice(-2));
      
      if (peak > profile.threshold && valley < profile.threshold * 0.3) {
        registerRep();
      }
    }
  }
}

function registerRep() {
  state.repCount++;
  state.lastRepTime = Date.now();
  
  console.log("Rep registered: " + state.repCount);
  
  // Visual feedback
  LED1.write(1);
  setTimeout(function() { LED1.write(0); }, 150);
  
  // Send rep data
  transmitData({
    type: "rep",
    count: state.repCount,
    timestamp: state.lastRepTime,
    sessionTime: state.lastRepTime - state.sessionStartTime
  });
  
  // Update advertising with new count
  updateAdvertising();
}

// ============== UI & FEEDBACK ==============
function setupButtons() {
  setWatch(function() {
    console.log("Button pressed - resetting session");
    resetSession();
  }, BTN, { edge: "rising", repeat: true, debounce: 50 });
}

function startupSequence() {
  // V4.0 signature: Blue-Green-Blue pattern
  var leds = [LED3, LED2, LED3];
  for (var i = 0; i < leds.length; i++) {
    (function(led, delay) {
      setTimeout(function() {
        led.write(1);
        setTimeout(function() { led.write(0); }, 100);
      }, delay);
    })(leds[i], i * 150);
  }
}

function flashSuccess() {
  for (var i = 0; i < 3; i++) {
    (function(delay) {
      setTimeout(function() {
        LED2.write(1);
        setTimeout(function() { LED2.write(0); }, 100);
      }, delay);
    })(i * 200);
  }
}

function flashError() {
  for (var i = 0; i < 2; i++) {
    (function(delay) {
      setTimeout(function() {
        LED1.write(1);
        setTimeout(function() { LED1.write(0); }, 200);
      }, delay);
    })(i * 400);
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
    type: "reset",
    timestamp: Date.now()
  });
  
  updateAdvertising();
}

function sendStatus() {
  transmitData({
    type: "status",
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
    console.log("Low battery: " + state.batteryLevel + "%");
    flashError();
  }
}

// ============== CONNECTION EVENTS ==============
NRF.on("connect", function(addr) {
  state.isConnected = true;
  console.log("Connected to: " + addr);
  
  // Connection feedback
  LED3.write(1);
  setTimeout(function() { LED3.write(0); }, 500);
  
  // Send initial status
  sendStatus();
});

NRF.on("disconnect", function() {
  state.isConnected = false;
  console.log("Disconnected");
  
  // Reset advertising to normal
  state.nfcTriggered = false;
  updateAdvertising();
});

// NFC tap event
NRF.on("NFCTag", function() {
  state.nfcTriggered = true;
  console.log("NFC tapped!");
  
  // NFC feedback - all LEDs flash
  LED1.write(1); LED2.write(1); LED3.write(1);
  setTimeout(function() {
    LED1.write(0); LED2.write(0); LED3.write(0);
  }, 300);
  
  // Boost advertising for quick connection
  updateAdvertising();
  
  // Reset to normal after 30 seconds
  setTimeout(function() {
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
setInterval(function() {
  console.log("Reps: " + state.repCount + ", Battery: " + state.batteryLevel + "%, Connected: " + state.isConnected);
}, 30000);

// Error handling
process.on("uncaughtException", function(e) {
  console.log("Error: " + e);
  flashError();
});

// ============== START FIRMWARE ==============
console.log("TapFit Puck.js Firmware v" + CONFIG.firmwareVersion);
setTimeout(init, 1000); // Give system time to boot