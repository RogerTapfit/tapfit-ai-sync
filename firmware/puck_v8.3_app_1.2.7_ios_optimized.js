// TapFit Puck.js Firmware - iOS Optimized with NFC Auto-Connect
// Version: 8.3
// App Version: 1.2.7 
// Build: 1735132800
// Compatible with: Nordic UART Service (iOS optimized)
// Features: NFC auto-connect, Binary protocol, Enhanced BLE stability

var tapfit = {
  // Configuration optimized for iOS
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
      interval: 7.5,    // Connection interval optimized for iOS
      timeout: 4000,   
      retries: 3,
      // Nordic UART Service UUIDs for iOS compatibility
      serviceUUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
      rxCharUUID: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // RX (device receives)
      txCharUUID: '6e400003-b5a3-f393-e0a9-e50e24dcca9e'  // TX (device sends)
    }
  },
  
  // Binary packet types matching iOS PuckClient
  PACKET_TYPE: {
    REP_COUNT: 0,       // Rep count update
    HANDSHAKE: 1,       // Initial handshake
    STATUS: 2,          // Status update
    HEARTBEAT: 0x03,    // Battery/heartbeat
    BATTERY: 0x04,      // Battery level
    ERROR: 0xFF,        // Error packet
    NFC_DETECTED: 0x06, // NFC field detected
    AUTO_CONNECT: 0x07, // Auto-connect signal
    NFC_ACK: 0x08       // NFC acknowledgment
  },
  
  // Commands from iOS app
  COMMAND: {
    RESET: 0x00,
    START_SESSION: 0x01,
    END_SESSION: 0x02,
    REQUEST_STATUS: 0x03,
    CALIBRATE: 0x04,
    NFC_ACK: 0x06
  },
  
  // Enhanced state management
  state: {
    isActive: false,
    isConnected: false,
    nfcTriggered: false,
    sessionId: null,
    repCount: 0,
    lastActivity: 0,
    calibrationData: null,
    batteryLevel: 100,
    isCalibrated: false,
    autoConnectTriggered: false,
    nfcDetected: false,
    errors: []
  },
  
  // Sensor data processing with enhanced filtering
  sensor: {
    lastAccel: {x: 0, y: 0, z: 0},
    smoothed: {x: 0, y: 0, z: 0},
    magnitude: 0,
    
    init: function() {
      Puck.accelOn(tapfit.config.sampleRate);
      Puck.on('accel', tapfit.sensor.process);
      console.log('Accelerometer initialized at ' + tapfit.config.sampleRate + 'Hz');
    },
    
    process: function(accel) {
      tapfit.sensor.lastAccel = accel;
      
      // Enhanced smoothing filter for better motion detection
      var alpha = 0.15;
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
  
  // Enhanced motion detection
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
      
      // Detect taps with improved debouncing
      if (magnitude > tapfit.config.threshold.tap && 
          (now - tapfit.motion.lastTap) > 250) { // 250ms debounce for reliability
        
        tapfit.motion.lastTap = now;
        tapfit.motion.registerRep();
        
        // Enhanced feedback
        digitalPulse(LED1, 1, 80);
      }
      
      // Session timeout check
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
      
      // Send binary rep data to iOS
      if (tapfit.state.isConnected) {
        tapfit.ble.sendBinaryPacket(tapfit.PACKET_TYPE.REP_COUNT, [tapfit.state.repCount]);
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
      
      // Send status update to iOS
      if (tapfit.state.isConnected) {
        tapfit.ble.sendBinaryPacket(tapfit.PACKET_TYPE.STATUS, [1]); // 1 = session active
      }
      
      // LED feedback
      digitalPulse(LED2, 1, [100, 100, 100]);
    },
    
    end: function() {
      if (!tapfit.state.isActive) return;
      
      console.log('Session ended: ' + tapfit.state.repCount + ' reps');
      
      tapfit.state.isActive = false;
      
      // Send final status to iOS
      if (tapfit.state.isConnected) {
        tapfit.ble.sendBinaryPacket(tapfit.PACKET_TYPE.STATUS, [0]); // 0 = session ended
      }
      
      // LED feedback
      digitalPulse(LED3, 1, [200, 100, 200]);
    }
  },
  
  // Enhanced BLE with Nordic UART and binary protocol
  ble: {
    init: function() {
      // Configure Nordic UART Service for iOS compatibility
      NRF.setServices({
        [tapfit.config.ble.serviceUUID]: {
          [tapfit.config.ble.rxCharUUID]: {
            value: [0],
            maxLen: 20,
            writable: true,
            onWrite: tapfit.ble.onWrite,
            readable: false,
            notify: false
          },
          [tapfit.config.ble.txCharUUID]: {
            value: [0],
            maxLen: 20,
            writable: false,
            readable: true,
            notify: true,
            onWrite: undefined
          }
        }
      }, {advertise: [tapfit.config.ble.serviceUUID]});
      
      // Enhanced advertising for iOS discovery
      NRF.setAdvertising({
        0x1809: [Math.round(E.getBattery())], // Battery service
        0x180F: [100] // Battery level
      }, {
        name: "TapFit-Puck",
        connectable: true,
        discoverable: true,
        interval: 300, // Faster advertising for quicker discovery
        showName: true
      });
      
      // Connection event handlers
      NRF.on('connect', tapfit.ble.onConnect);
      NRF.on('disconnect', tapfit.ble.onDisconnect);
      
      console.log('Nordic UART BLE initialized for iOS');
    },
    
    onConnect: function(addr) {
      tapfit.state.isConnected = true;
      console.log('iOS connected: ' + addr);
      
      // Connection feedback
      digitalPulse(LED1, 1, [50, 50, 50, 50]);
      
      // Send handshake with current rep count
      setTimeout(function() {
        tapfit.ble.sendBinaryPacket(tapfit.PACKET_TYPE.HANDSHAKE, [tapfit.state.repCount]);
      }, 100);
    },
    
    onDisconnect: function() {
      tapfit.state.isConnected = false;
      tapfit.state.nfcTriggered = false;
      console.log('iOS disconnected');
      digitalPulse(LED3, 1, 500);
    },
    
    onWrite: function(evt) {
      // Handle binary commands from iOS
      if (evt.data && evt.data.length >= 1) {
        var command = evt.data[0];
        tapfit.ble.handleBinaryCommand(command);
      }
    },
    
    handleBinaryCommand: function(command) {
      console.log('Received command: 0x' + command.toString(16));
      
      switch(command) {
        case tapfit.COMMAND.START_SESSION:
          tapfit.session.start();
          break;
        case tapfit.COMMAND.END_SESSION:
          tapfit.session.end();
          break;
        case tapfit.COMMAND.REQUEST_STATUS:
          tapfit.ble.sendStatus();
          break;
        case tapfit.COMMAND.CALIBRATE:
          tapfit.calibration.start();
          break;
        case tapfit.COMMAND.RESET:
          tapfit.system.reset();
          break;
        case tapfit.COMMAND.NFC_ACK:
          // iOS acknowledges NFC connection
          tapfit.state.nfcDetected = false;
          tapfit.ble.sendBinaryPacket(tapfit.PACKET_TYPE.NFC_ACK, [1]);
          break;
        default:
          console.log('Unknown command: 0x' + command.toString(16));
      }
    },
    
    // Send binary packet to iOS
    sendBinaryPacket: function(type, data) {
      if (!tapfit.state.isConnected) return false;
      
      try {
        var packet = [type];
        if (data && data.length > 0) {
          packet = packet.concat(data);
        }
        
        // Ensure we don't exceed BLE packet size
        if (packet.length > 20) {
          packet = packet.slice(0, 20);
        }
        
        NRF.updateServices({
          [tapfit.config.ble.serviceUUID]: {
            [tapfit.config.ble.txCharUUID]: {
              value: packet,
              notify: true
            }
          }
        });
        
        console.log('Sent packet type: ' + type + ', data: [' + packet.join(',') + ']');
        return true;
      } catch(e) {
        console.log('Binary send failed: ' + e);
        return false;
      }
    },
    
    sendStatus: function() {
      // Send current status as binary
      var statusData = [
        tapfit.state.isActive ? 1 : 0,
        tapfit.state.repCount,
        Math.round(E.getBattery()),
        tapfit.state.isCalibrated ? 1 : 0
      ];
      
      tapfit.ble.sendBinaryPacket(tapfit.PACKET_TYPE.STATUS, statusData);
    },
    
    sendHeartbeat: function() {
      var battery = Math.round(E.getBattery());
      tapfit.ble.sendBinaryPacket(tapfit.PACKET_TYPE.HEARTBEAT, [battery]);
    }
  },
  
  // Enhanced NFC with auto-connect
  nfc: {
    init: function() {
      if (Puck.NFCon) {
        Puck.NFCon(tapfit.nfc.onFieldOn);
        Puck.NFCoff(tapfit.nfc.onFieldOff);
        console.log('NFC detection enabled for auto-connect');
      }
    },
    
    onFieldOn: function() {
      console.log('NFC field detected - triggering auto-connect');
      tapfit.state.nfcDetected = true;
      tapfit.state.nfcTriggered = true;
      
      // NFC detection feedback
      digitalPulse(LED2, 1, [100, 50, 100]);
      
      // Boost advertising for faster iOS discovery
      NRF.setAdvertising({
        0x1809: [Math.round(E.getBattery())],
        0x180F: [100]
      }, {
        name: "TapFit-Puck",
        connectable: true,
        discoverable: true,
        interval: 100, // Very fast advertising after NFC
        showName: true
      });
      
      // Send NFC detection signal to iOS if connected
      if (tapfit.state.isConnected) {
        tapfit.ble.sendBinaryPacket(tapfit.PACKET_TYPE.NFC_DETECTED, [1]);
      } else {
        // Auto-start session preparation for when iOS connects
        tapfit.state.autoConnectTriggered = true;
      }
      
      // Auto-start session if not active
      if (!tapfit.state.isActive) {
        setTimeout(function() {
          tapfit.session.start();
        }, 500);
      }
      
      // Reset advertising interval after 10 seconds
      setTimeout(function() {
        NRF.setAdvertising({
          0x1809: [Math.round(E.getBattery())],
          0x180F: [100]
        }, {
          name: "TapFit-Puck", 
          connectable: true,
          discoverable: true,
          interval: 300, // Back to normal
          showName: true
        });
      }, 10000);
    },
    
    onFieldOff: function() {
      console.log('NFC field removed');
      // Don't reset nfcTriggered here to maintain connection state
    }
  },
  
  // Enhanced calibration
  calibration: {
    samples: [],
    isCalibrating: false,
    
    start: function() {
      tapfit.calibration.isCalibrating = true;
      tapfit.calibration.samples = [];
      console.log('Calibration started - 3 second baseline collection');
      
      // Calibration feedback
      var blinkCount = 0;
      var interval = setInterval(function() {
        digitalPulse(LED1, 1, 80);
        blinkCount++;
        if (blinkCount >= 15) { // 3 seconds at 200ms intervals
          clearInterval(interval);
          tapfit.calibration.complete();
        }
      }, 200);
    },
    
    complete: function() {
      if (tapfit.calibration.samples.length > 0) {
        var baseline = tapfit.calibration.calculateBaseline();
        tapfit.state.calibrationData = baseline;
        tapfit.state.isCalibrated = true;
        
        console.log('Calibration complete - baseline: ' + baseline.magnitude.toFixed(3));
        
        // Adaptive threshold adjustment
        tapfit.config.threshold.rest = baseline.magnitude + 0.1;
        tapfit.config.threshold.movement = baseline.magnitude + 0.6;
        tapfit.config.threshold.tap = baseline.magnitude + 1.2;
      }
      
      tapfit.calibration.isCalibrating = false;
      digitalPulse(LED2, 1, [150, 100, 150]);
      
      // Notify iOS of calibration completion
      if (tapfit.state.isConnected) {
        tapfit.ble.sendStatus();
      }
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
  
  // Enhanced system utilities
  system: {
    init: function() {
      console.log('TapFit Puck v8.3 iOS-optimized initializing...');
      
      // Initialize all subsystems
      tapfit.sensor.init();
      tapfit.ble.init();
      tapfit.nfc.init();
      
      // Periodic tasks optimized for iOS
      setInterval(tapfit.ble.sendHeartbeat, 15000); // Regular heartbeat
      setInterval(tapfit.system.updateBattery, 30000);
      setInterval(tapfit.system.cleanup, 60000);
      
      console.log('TapFit Puck v8.3 ready for iOS!');
      
      // Startup sequence
      digitalPulse(LED1, 1, [100, 100]);
      setTimeout(function() {
        digitalPulse(LED2, 1, [100, 100]);
      }, 200);
      setTimeout(function() {
        digitalPulse(LED3, 1, [100, 100]);
      }, 400);
    },
    
    updateBattery: function() {
      tapfit.state.batteryLevel = Math.round(E.getBattery());
      
      // Low battery warning
      if (tapfit.state.batteryLevel < 15) {
        console.log('Low battery: ' + tapfit.state.batteryLevel + '%');
        digitalPulse(LED3, 1, [1000, 200, 1000]);
        
        // Send battery warning to iOS
        if (tapfit.state.isConnected) {
          tapfit.ble.sendBinaryPacket(tapfit.PACKET_TYPE.BATTERY, [tapfit.state.batteryLevel]);
        }
      }
    },
    
    cleanup: function() {
      // Memory management
      if (tapfit.state.errors.length > 10) {
        tapfit.state.errors = tapfit.state.errors.slice(-5);
      }
      
      // Force garbage collection
      if (typeof gc !== 'undefined') {
        gc();
      }
    },
    
    reset: function() {
      console.log('System reset requested');
      
      // End active session gracefully
      if (tapfit.state.isActive) {
        tapfit.session.end();
      }
      
      // Reset state
      tapfit.state.repCount = 0;
      tapfit.state.errors = [];
      tapfit.state.calibrationData = null;
      tapfit.state.isCalibrated = false;
      tapfit.state.nfcTriggered = false;
      tapfit.state.autoConnectTriggered = false;
      
      // Restart system after cleanup
      setTimeout(function() {
        load();
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
      digitalPulse(LED3, 1, [300, 100, 300]);
      
      // Send error to iOS if connected
      if (tapfit.state.isConnected) {
        tapfit.ble.sendBinaryPacket(tapfit.PACKET_TYPE.ERROR, [1]);
      }
    }
  }
};

// Enhanced error handling
process.on('uncaughtException', function(e) {
  if (tapfit && tapfit.system && tapfit.system.handleError) {
    tapfit.system.handleError(e, 'uncaughtException');
  } else {
    console.log('Init Error: ' + e);
    digitalPulse(LED3, 1, [100, 100, 100, 100]);
  }
});

// Initialize TapFit system
try {
  tapfit.system.init();
  
  // Calibration data collection during calibration
  setInterval(function() {
    if (tapfit.calibration && tapfit.calibration.isCalibrating) {
      tapfit.calibration.samples.push({
        x: tapfit.sensor.lastAccel.x,
        y: tapfit.sensor.lastAccel.y,
        z: tapfit.sensor.lastAccel.z
      });
    }
  }, 100);
  
  // Expose for debugging
  if (typeof global !== 'undefined') {
    global.tapfit = tapfit;
  }
  
} catch (initError) {
  console.log('Initialization failed: ' + initError);
  digitalPulse(LED3, 1, [200, 200, 200, 200, 200]);
}

console.log('TapFit v8.3 iOS-optimized firmware loaded successfully');