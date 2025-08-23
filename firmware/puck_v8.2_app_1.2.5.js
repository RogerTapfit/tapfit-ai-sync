// TapFit Puck.js Firmware - Espruino Compatible
// Version: 8.2
// App Version: 1.2.5
// Build: 1735002000
// Date: 2024-12-24
// Compatible with: Puck.js v2.1+, Espruino v2.13+
// Features: 26Hz sampling, NFC detection, Enhanced BLE, Battery monitoring

var tapfit = {
  // Configuration
  config: {
    sampleRate: 26, // Hz - optimized for motion detection
    threshold: {
      movement: 0.8,    // Minimum acceleration for movement detection
      tap: 1.5,         // Minimum acceleration for tap detection
      rest: 0.3         // Maximum acceleration considered "at rest"
    },
    session: {
      timeout: 30000,   // 30 seconds of inactivity ends session
      minReps: 3        // Minimum reps to count as valid session
    },
    ble: {
      interval: 7.5,    // Connection interval (ms)
      timeout: 4000,    // Connection timeout (ms)
      retries: 3        // Connection retry attempts
    }
  },
  
  // State management
  state: {
    isActive: false,
    isConnected: false,
    sessionId: null,
    repCount: 0,
    lastActivity: 0,
    calibrationData: null,
    batteryLevel: 100,
    errors: []
  },
  
  // Sensor data processing
  sensor: {
    lastAccel: {x: 0, y: 0, z: 0},
    smoothed: {x: 0, y: 0, z: 0},
    magnitude: 0,
    
    // Initialize accelerometer
    init: function() {
      Puck.accelOn(tapfit.config.sampleRate);
      Puck.on('accel', tapfit.sensor.process);
      console.log('Accelerometer initialized at ' + tapfit.config.sampleRate + 'Hz');
    },
    
    // Process accelerometer data
    process: function(accel) {
      tapfit.sensor.lastAccel = accel;
      
      // Apply smoothing filter (0.1 alpha for noise reduction)
      var alpha = 0.1;
      tapfit.sensor.smoothed.x = alpha * accel.x + (1 - alpha) * tapfit.sensor.smoothed.x;
      tapfit.sensor.smoothed.y = alpha * accel.y + (1 - alpha) * tapfit.sensor.smoothed.y;
      tapfit.sensor.smoothed.z = alpha * accel.z + (1 - alpha) * tapfit.sensor.smoothed.z;
      
      // Calculate magnitude
      var dx = tapfit.sensor.smoothed.x;
      var dy = tapfit.sensor.smoothed.y;
      var dz = tapfit.sensor.smoothed.z;
      tapfit.sensor.magnitude = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      // Detect movement and taps
      tapfit.motion.detect();
    }
  },
  
  // Motion detection and rep counting
  motion: {
    lastTap: 0,
    tapBuffer: [],
    
    detect: function() {
      var now = getTime() * 1000;
      var magnitude = tapfit.sensor.magnitude;
      
      // Update last activity time
      if (magnitude > tapfit.config.threshold.rest) {
        tapfit.state.lastActivity = now;
      }
      
      // Detect taps (peaks above threshold)
      if (magnitude > tapfit.config.threshold.tap && 
          (now - tapfit.motion.lastTap) > 200) { // 200ms debounce
        
        tapfit.motion.lastTap = now;
        tapfit.motion.registerRep();
        
        // Vibrate for feedback
        digitalPulse(LED1, 1, 50);
      }
      
      // Check for session timeout
      if (tapfit.state.isActive && 
          (now - tapfit.state.lastActivity) > tapfit.config.session.timeout) {
        tapfit.session.end();
      }
    },
    
    registerRep: function() {
      if (!tapfit.state.isActive) {
        tapfit.session.start();
      }
      
      tapfit.state.repCount++;
      console.log('Rep #' + tapfit.state.repCount);
      
      // Send rep data over BLE if connected
      if (tapfit.state.isConnected) {
        tapfit.ble.sendRepData();
      }
    }
  },
  
  // Session management
  session: {
    start: function() {
      tapfit.state.isActive = true;
      tapfit.state.sessionId = Date.now();
      tapfit.state.repCount = 0;
      tapfit.state.lastActivity = getTime() * 1000;
      
      console.log('Session started: ' + tapfit.state.sessionId);
      
      // Flash LED to indicate session start
      digitalPulse(LED2, 1, [100, 100, 100]);
    },
    
    end: function() {
      if (!tapfit.state.isActive) return;
      
      var sessionData = {
        sessionId: tapfit.state.sessionId,
        repCount: tapfit.state.repCount,
        duration: (getTime() * 1000) - tapfit.state.lastActivity + tapfit.config.session.timeout,
        timestamp: Date.now()
      };
      
      console.log('Session ended: ' + tapfit.state.repCount + ' reps');
      
      // Send session summary
      if (tapfit.state.isConnected && tapfit.state.repCount >= tapfit.config.session.minReps) {
        tapfit.ble.sendSessionData(sessionData);
      }
      
      tapfit.state.isActive = false;
      tapfit.state.sessionId = null;
      
      // Flash LED to indicate session end
      digitalPulse(LED3, 1, [200, 100, 200]);
    }
  },
  
  // Bluetooth Low Energy communication
  ble: {
    serviceUUID: '0000FFE0-0000-1000-8000-00805F9B34FB',
    charUUID: '0000FFE1-0000-1000-8000-00805F9B34FB',
    
    init: function() {
      NRF.setServices({
        [tapfit.ble.serviceUUID]: {
          [tapfit.ble.charUUID]: {
            value: [0],
            maxLen: 20,
            writable: true,
            onWrite: tapfit.ble.onWrite,
            readable: true,
            notify: true
          }
        }
      }, {advertise: [tapfit.ble.serviceUUID]});
      
      // Set advertising data
      NRF.setAdvertising({
        0x1809: [Math.round(E.getBattery())], // Battery service
        0x180F: [100] // Battery level
      }, {
        name: "TapFit-Puck",
        connectable: true,
        discoverable: true,
        interval: 375 // 375ms advertising interval
      });
      
      // Connection events
      NRF.on('connect', tapfit.ble.onConnect);
      NRF.on('disconnect', tapfit.ble.onDisconnect);
      
      console.log('BLE initialized - TapFit-Puck');
    },
    
    onConnect: function(addr) {
      tapfit.state.isConnected = true;
      console.log('Connected: ' + addr);
      digitalPulse(LED1, 1, [50, 50, 50, 50]);
      
      // Send handshake
      tapfit.ble.sendHandshake();
    },
    
    onDisconnect: function() {
      tapfit.state.isConnected = false;
      console.log('Disconnected');
      digitalPulse(LED3, 1, 500);
    },
    
    onWrite: function(evt) {
      var data = String.fromCharCode.apply(null, evt.data);
      console.log('Received: ' + data);
      
      try {
        var cmd = JSON.parse(data);
        tapfit.ble.handleCommand(cmd);
      } catch(e) {
        console.log('Invalid JSON command');
      }
    },
    
    handleCommand: function(cmd) {
      switch(cmd.type) {
        case 'START_SESSION':
          tapfit.session.start();
          break;
        case 'END_SESSION':
          tapfit.session.end();
          break;
        case 'GET_STATUS':
          tapfit.ble.sendStatus();
          break;
        case 'CALIBRATE':
          tapfit.calibration.start();
          break;
        case 'RESET':
          tapfit.system.reset();
          break;
        default:
          console.log('Unknown command: ' + cmd.type);
      }
    },
    
    send: function(data) {
      if (!tapfit.state.isConnected) return false;
      
      try {
        var json = JSON.stringify(data);
        NRF.updateServices({
          [tapfit.ble.serviceUUID]: {
            [tapfit.ble.charUUID]: {
              value: json,
              notify: true
            }
          }
        });
        return true;
      } catch(e) {
        console.log('Send failed: ' + e);
        return false;
      }
    },
    
    sendHandshake: function() {
      tapfit.ble.send({
        type: 'HANDSHAKE',
        firmware: '8.2',
        appVersion: '1.2.5',
        deviceId: NRF.getAddress(),
        battery: Math.round(E.getBattery()),
        timestamp: Date.now()
      });
    },
    
    sendRepData: function() {
      tapfit.ble.send({
        type: 'REP_COUNT',
        sessionId: tapfit.state.sessionId,
        repCount: tapfit.state.repCount,
        magnitude: tapfit.sensor.magnitude.toFixed(2),
        timestamp: Date.now()
      });
    },
    
    sendSessionData: function(sessionData) {
      tapfit.ble.send({
        type: 'SESSION_COMPLETE',
        ...sessionData
      });
    },
    
    sendStatus: function() {
      tapfit.ble.send({
        type: 'STATUS',
        state: tapfit.state,
        battery: Math.round(E.getBattery()),
        firmware: '8.2',
        uptime: getTime(),
        timestamp: Date.now()
      });
    }
  },
  
  // NFC detection
  nfc: {
    init: function() {
      // Enable NFC field detection
      if (Puck.NFCon) {
        Puck.NFCon(tapfit.nfc.onFieldOn);
        Puck.NFCoff(tapfit.nfc.onFieldOff);
        console.log('NFC detection enabled');
      }
    },
    
    onFieldOn: function() {
      console.log('NFC field detected');
      digitalPulse(LED2, 1, 100);
      
      // Auto-start session if not active
      if (!tapfit.state.isActive) {
        setTimeout(tapfit.session.start, 500);
      }
    },
    
    onFieldOff: function() {
      console.log('NFC field removed');
    }
  },
  
  // Calibration system
  calibration: {
    samples: [],
    isCalibrating: false,
    
    start: function() {
      tapfit.calibration.isCalibrating = true;
      tapfit.calibration.samples = [];
      console.log('Calibration started - stay still for 3 seconds');
      
      // Flash LED during calibration
      var interval = setInterval(function() {
        digitalPulse(LED1, 1, 50);
      }, 200);
      
      setTimeout(function() {
        clearInterval(interval);
        tapfit.calibration.complete();
      }, 3000);
    },
    
    complete: function() {
      if (tapfit.calibration.samples.length > 0) {
        // Calculate baseline from samples
        var baseline = tapfit.calibration.calculateBaseline();
        tapfit.state.calibrationData = baseline;
        console.log('Calibration complete - baseline: ' + baseline.magnitude.toFixed(3));
        
        // Adjust thresholds based on calibration
        tapfit.config.threshold.rest = baseline.magnitude + 0.1;
        tapfit.config.threshold.movement = baseline.magnitude + 0.5;
        tapfit.config.threshold.tap = baseline.magnitude + 1.0;
      }
      
      tapfit.calibration.isCalibrating = false;
      digitalPulse(LED2, 1, [100, 100, 100]);
    },
    
    calculateBaseline: function() {
      var sum = {x: 0, y: 0, z: 0};
      var count = tapfit.calibration.samples.length;
      
      tapfit.calibration.samples.forEach(function(sample) {
        sum.x += sample.x;
        sum.y += sample.y;
        sum.z += sample.z;
      });
      
      var avg = {
        x: sum.x / count,
        y: sum.y / count,
        z: sum.z / count
      };
      
      avg.magnitude = Math.sqrt(avg.x*avg.x + avg.y*avg.y + avg.z*avg.z);
      return avg;
    }
  },
  
  // System utilities
  system: {
    init: function() {
      console.log('TapFit Puck v8.2 initializing...');
      
      // Initialize all subsystems
      tapfit.sensor.init();
      tapfit.ble.init();
      tapfit.nfc.init();
      
      // Set up periodic tasks
      setInterval(tapfit.system.updateBattery, 30000); // Every 30 seconds
      setInterval(tapfit.system.cleanup, 60000); // Every minute
      
      console.log('TapFit Puck v8.2 ready!');
      
      // Ready indication
      digitalPulse(LED1, 1, [100, 100, 100, 100, 100]);
    },
    
    updateBattery: function() {
      tapfit.state.batteryLevel = Math.round(E.getBattery());
      
      // Low battery warning
      if (tapfit.state.batteryLevel < 20) {
        console.log('Low battery: ' + tapfit.state.batteryLevel + '%');
        digitalPulse(LED3, 1, [1000, 200, 1000]);
      }
    },
    
    cleanup: function() {
      // Clean up old error logs
      if (tapfit.state.errors.length > 10) {
        tapfit.state.errors = tapfit.state.errors.slice(-5);
      }
      
      // Force garbage collection if available
      if (typeof gc !== 'undefined') {
        gc();
      }
    },
    
    reset: function() {
      console.log('System reset requested');
      
      // End active session
      if (tapfit.state.isActive) {
        tapfit.session.end();
      }
      
      // Reset state
      tapfit.state.repCount = 0;
      tapfit.state.errors = [];
      tapfit.state.calibrationData = null;
      
      // Restart system
      setTimeout(function() {
        load(); // Restart the script
      }, 1000);
    },
    
    handleError: function(error, context) {
      console.log('Error in ' + context + ': ' + error);
      
      tapfit.state.errors.push({
        error: error.toString(),
        context: context,
        timestamp: Date.now()
      });
      
      // Error indication
      digitalPulse(LED3, 1, [200, 200, 200, 200]);
    }
  }
};

// Global error handler
process.on('uncaughtException', function(e) {
  tapfit.system.handleError(e, 'uncaughtException');
});

// Add calibration sample collection during calibration
setInterval(function() {
  if (tapfit.calibration.isCalibrating) {
    tapfit.calibration.samples.push({
      x: tapfit.sensor.lastAccel.x,
      y: tapfit.sensor.lastAccel.y,
      z: tapfit.sensor.lastAccel.z
    });
  }
}, 100); // Sample every 100ms during calibration

// Initialize TapFit system
tapfit.system.init();

// Expose tapfit object for debugging
global.tapfit = tapfit;