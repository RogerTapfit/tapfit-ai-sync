/**
 * TapFit Puck.js Firmware - Clean Espruino Compatible
 * Optimized for iOS NFC and BLE integration
 */

// Configuration
var CONFIG = {
  NFC_URL: "https://tapfit.info/#/workout/1?autoConnect=puck",
  DEVICE_NAME: "TapFit-Puck",
  BLE_SERVICE_UUID: "FFE0",
  BLE_CHAR_UUID: "FFE1",
  REP_THRESHOLD: 1.5,  // G-force threshold for rep detection
  DEBOUNCE_TIME: 500,  // ms between reps
  ACCEL_POLL_RATE: 50  // ms between accelerometer readings
};

// State variables
var state = {
  isActive: false,
  lastRepTime: 0,
  repCount: 0,
  bleConnected: false,
  baseline: { x: 0, y: 0, z: 0 }
};

// Initialize everything
function init() {
  try {
    console.log("TapFit Puck.js starting...");
    setupNFC();
    setupBLE();
    setupAccelerometer();
    setupButtons();
    
    // Flash startup sequence
    flashBlue(1);
    console.log("TapFit Puck.js ready!");
  } catch (e) {
    console.log("Init error:", e);
    flashRed(3); // Error indication
  }
}

// NFC Setup
function setupNFC() {
  try {
    // Configure NFC tag with deep link URL
    var nfcData = require("ndef").uriRecord(CONFIG.NFC_URL);
    NRF.nfcURL(CONFIG.NFC_URL);
    
    // Listen for NFC events
    NRF.on('NFCon', function() {
      console.log("NFC tapped!");
      handleNFCTap();
    });
    
    console.log("NFC configured with URL:", CONFIG.NFC_URL);
  } catch (e) {
    console.log("NFC setup failed:", e);
  }
}

// Handle NFC tap event
function handleNFCTap() {
  console.log("NFC tap detected - starting workout session");
  
  // Flash blue LED 3 times for confirmation
  flashBlue(3);
  
  // Start BLE advertising immediately
  startBLEAdvertising();
  
  // Activate motion monitoring
  startMotionMonitoring();
  
  state.isActive = true;
  state.repCount = 0;
  
  console.log("Workout session activated");
}

// BLE Setup
function setupBLE() {
  try {
    // Configure Nordic UART Service
    NRF.setServices({
      [CONFIG.BLE_SERVICE_UUID]: {
        [CONFIG.BLE_CHAR_UUID]: {
          value: [0],
          readable: true,
          writable: true,
          notify: true,
          onWrite: function(evt) {
            try {
              if (!evt || !evt.data) return;
              var d = new Uint8Array(evt.data);
              if (d[0] === 0x00) {
                state.repCount = 0;
                // Immediately notify reset ack: [0x01, 0x00]
                NRF.updateServices({
                  [CONFIG.BLE_SERVICE_UUID]: {
                    [CONFIG.BLE_CHAR_UUID]: {
                      value: [0x01, 0x00],
                      notify: true
                    }
                  }
                });
              }
            } catch (e) {
              console.log("onWrite error:", e);
            }
          }
        }
      }
    });
    
    // Handle BLE connections
    NRF.on('connect', function() {
      state.bleConnected = true;
      console.log("BLE connected");
      flashGreen(1);
    });
    
    NRF.on('disconnect', function() {
      state.bleConnected = false;
      console.log("BLE disconnected");
    });
    
    console.log("BLE service configured");
  } catch (e) {
    console.log("BLE setup failed:", e);
  }
}

// Start BLE advertising
function startBLEAdvertising() {
  try {
    NRF.setAdvertising({
      0x1812: [1], // HID service
      0x180F: [1]  // Battery service
    }, {
      name: CONFIG.DEVICE_NAME,
      connectable: true,
      discoverable: true
    });
    
    console.log("BLE advertising started");
  } catch (e) {
    console.log("BLE advertising failed:", e);
  }
}

// Accelerometer Setup
function setupAccelerometer() {
  try {
    // Initialize accelerometer
    Puck.accelOn(12.5); // 12.5Hz sampling rate
    
    // Calibrate baseline when stationary
    calibrateBaseline();
    
    console.log("Accelerometer initialized");
  } catch (e) {
    console.log("Accelerometer setup failed:", e);
  }
}

// Calibrate accelerometer baseline
function calibrateBaseline() {
  var samples = [];
  var sampleCount = 10;
  
  function takeSample() {
    var accel = Puck.accel();
    if (accel) {
      samples.push(accel);
      
      if (samples.length >= sampleCount) {
        // Calculate average baseline
        state.baseline = {
          x: samples.reduce(function(sum, s) { return sum + s.x; }, 0) / sampleCount,
          y: samples.reduce(function(sum, s) { return sum + s.y; }, 0) / sampleCount,
          z: samples.reduce(function(sum, s) { return sum + s.z; }, 0) / sampleCount
        };
        
        console.log("Baseline calibrated:", state.baseline);
      } else {
        setTimeout(takeSample, 100);
      }
    }
  }
  
  takeSample();
}

// Start motion monitoring
function startMotionMonitoring() {
  if (state.motionInterval) {
    clearInterval(state.motionInterval);
  }
  
  state.motionInterval = setInterval(function() {
    if (state.isActive) {
      checkForRep();
    }
  }, CONFIG.ACCEL_POLL_RATE);
  
  console.log("Motion monitoring started");
}

// Check for rep based on G-force threshold
function checkForRep() {
  try {
    var accel = Puck.accel();
    if (!accel) return;
    
    // Calculate G-force magnitude relative to baseline
    var dx = accel.x - state.baseline.x;
    var dy = accel.y - state.baseline.y;
    var dz = accel.z - state.baseline.z;
    
    var gForce = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    // Check if threshold exceeded and debounce time passed
    var now = getTime() * 1000; // Convert to milliseconds
    
    if (gForce > CONFIG.REP_THRESHOLD && 
        (now - state.lastRepTime) > CONFIG.DEBOUNCE_TIME) {
      
      registerRep(gForce);
      state.lastRepTime = now;
    }
  } catch (e) {
    console.log("Motion check error:", e);
  }
}

// Register a detected rep
function registerRep(gForce) {
  state.repCount++;
  
  console.log("Rep detected! Count:", state.repCount, "G-force:", gForce.toFixed(2));
  
  // Flash green LED once
  flashGreen(1);
  
  // Send rep data over BLE if connected
  if (state.bleConnected) {
    sendRepData();
  }
}

// Send rep data over BLE
function sendRepData() {
  try {
    // Send binary packet: [0x01, repCount, timestamp_bytes...]
    var timestamp = Math.floor(getTime() * 1000);
    var data = new Uint8Array([
      0x01, // Rep data packet type
      state.repCount & 0xFF,
      (timestamp >> 24) & 0xFF,
      (timestamp >> 16) & 0xFF,
      (timestamp >> 8) & 0xFF,
      timestamp & 0xFF
    ]);
    
    NRF.updateServices({
      [CONFIG.BLE_SERVICE_UUID]: {
        [CONFIG.BLE_CHAR_UUID]: {
          value: Array.from(data),
          notify: true
        }
      }
    });
    
    console.log("Rep data sent via BLE");
  } catch (e) {
    console.log("BLE send error:", e);
  }
}

// Button controls
function setupButtons() {
  // Single press: Reset rep count
  setWatch(function() {
    if (state.isActive) {
      state.repCount = 0;
      console.log("Rep count reset");
      flashBlue(2);
    }
  }, BTN, { edge: "rising", debounce: 50, repeat: true });
  
  // Long press: Stop session
  setWatch(function() {
    stopSession();
  }, BTN, { edge: "rising", debounce: 50, repeat: true, long: true });
}

// Stop workout session
function stopSession() {
  state.isActive = false;
  
  if (state.motionInterval) {
    clearInterval(state.motionInterval);
    state.motionInterval = null;
  }
  
  console.log("Session stopped. Total reps:", state.repCount);
  flashRed(2);
}

// LED helper functions
function flashBlue(count) {
  var i = 0;
  function flash() {
    if (i < count) {
      LED1.set();
      setTimeout(function() {
        LED1.reset();
        setTimeout(function() {
          i++;
          flash();
        }, 100);
      }, 200);
    }
  }
  flash();
}

function flashGreen(count) {
  var i = 0;
  function flash() {
    if (i < count) {
      LED2.set();
      setTimeout(function() {
        LED2.reset();
        setTimeout(function() {
          i++;
          flash();
        }, 100);
      }, 200);
    }
  }
  flash();
}

function flashRed(count) {
  var i = 0;
  function flash() {
    if (i < count) {
      LED3.set();
      setTimeout(function() {
        LED3.reset();
        setTimeout(function() {
          i++;
          flash();
        }, 100);
      }, 200);
    }
  }
  flash();
}

// Error handling
process.on('uncaughtException', function(e) {
  console.log("Uncaught exception:", e);
  flashRed(5);
  
  // Try to recover
  setTimeout(function() {
    init();
  }, 2000);
});

// Power management
function setupPowerManagement() {
  // Auto-sleep after 30 minutes of inactivity
  var sleepTimer;
  
  function resetSleepTimer() {
    if (sleepTimer) clearTimeout(sleepTimer);
    
    sleepTimer = setTimeout(function() {
      if (!state.isActive) {
        console.log("Entering sleep mode");
        Puck.accelOff();
        NRF.sleep();
      }
    }, 30 * 60 * 1000); // 30 minutes
  }
  
  // Reset timer on any activity
  NRF.on('connect', resetSleepTimer);
  NRF.on('NFCon', resetSleepTimer);
  
  resetSleepTimer();
}

// Initialize everything
function main() {
  console.log("=== TapFit Puck.js Firmware ===");
  init();
  setupPowerManagement();
}

// Start the firmware
main();