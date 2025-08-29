// TapFit Puck Simple Working v1.0
// Minimal firmware for basic connection and rep counting

var config = {
  serviceUUID: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  txUUID: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
  threshold: 0.15,
  cooldown: 600
};

var state = {
  reps: 0,
  connected: false,
  active: false,
  baseline: {x: 0, y: 0, z: 0},
  lastRep: 0
};

var bleService, bleChar;

function init() {
  console.log("TapFit Puck Simple v1.0 starting...");
  
  // Setup BLE Service
  bleService = {};
  bleService[config.serviceUUID] = {};
  bleChar = {
    value: [0],
    notify: true,
    readable: true
  };
  bleService[config.serviceUUID][config.txUUID] = bleChar;
  
  NRF.setServices(bleService);
  NRF.setAdvertising({}, {name: "TapFit", connectable: true});
  
  console.log("Advertising as 'TapFit'");
  
  // BLE Connection Events
  NRF.on('connect', function() {
    state.connected = true;
    LED2.set();
    setTimeout(() => LED2.reset(), 200);
    console.log("Connected! Sending handshake...");
    sendPacket(1, [state.reps]); // handshake with current reps
  });
  
  NRF.on('disconnect', function() {
    state.connected = false;
    state.active = false;
    console.log("Disconnected");
  });
  
  // Calibrate accelerometer baseline
  calibrate();
  
  // Setup button for manual rep testing
  setWatch(function() {
    if (state.connected) {
      state.reps++;
      console.log("Manual rep:", state.reps);
      LED1.set();
      setTimeout(() => LED1.reset(), 100);
      sendPacket(0, [state.reps]); // rep packet
    }
  }, BTN, {edge: "rising", debounce: 50, repeat: true});
  
  // Start motion monitoring
  Puck.accelOn(25);
  Puck.on('accel', handleMotion);
  
  console.log("Puck ready! Press button for manual rep or shake for motion rep");
}

function calibrate() {
  console.log("Calibrating...");
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
      state.baseline.x = sumX / samples;
      state.baseline.y = sumY / samples;
      state.baseline.z = sumZ / samples;
      
      clearInterval(calibInterval);
      LED3.reset();
      
      // Double blink to show ready
      LED2.set();
      setTimeout(function() {
        LED2.reset();
        setTimeout(function() {
          LED2.set();
          setTimeout(() => LED2.reset(), 100);
        }, 100);
      }, 100);
      
      console.log("Calibrated! Baseline:", state.baseline);
    }
  }, 50);
}

function handleMotion(accel) {
  if (!state.connected) return;
  
  var dx = accel.x - state.baseline.x;
  var dy = accel.y - state.baseline.y;
  var dz = accel.z - state.baseline.z;
  
  var motion = Math.sqrt(dx*dx + dy*dy + dz*dz);
  var now = getTime();
  
  if (motion > config.threshold && (now - state.lastRep) > config.cooldown) {
    state.reps++;
    state.lastRep = now;
    
    console.log("Motion rep detected:", state.reps, "motion:", motion.toFixed(3));
    
    // Visual feedback
    LED1.set();
    setTimeout(() => LED1.reset(), 100);
    
    // Send rep to app
    sendPacket(0, [state.reps]);
  }
}

function sendPacket(type, data) {
  if (!state.connected) return;
  
  var packet = [type];
  for (var i = 0; i < data.length; i++) {
    packet.push(data[i]);
  }
  
  console.log("Sending packet:", packet);
  
  try {
    var update = {};
    update[config.serviceUUID] = {};
    update[config.serviceUUID][config.txUUID] = {
      value: packet,
      notify: true
    };
    NRF.updateServices(update);
  } catch (error) {
    console.log("Send failed:", error);
  }
}

// Start after short delay
setTimeout(init, 500);