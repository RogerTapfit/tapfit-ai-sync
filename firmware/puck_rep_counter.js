// TapFit Puck.js Rep Counter Firmware
// Compatible with usePuckWorkout hook and PuckTest page
// Upload this to your Puck.js using the Espruino Web IDE

const SERVICE_UUID = '0000FFE0-0000-1000-8000-00805F9B34FB';
const CHAR_UUID = '0000FFE1-0000-1000-8000-00805F9B34FB';
const DEVICE_NAME = 'TapFit Puck';

let repCount = 0;
let lastMotion = 0;
let baseline = { x: 0, y: 0, z: 0 };
let isCalibrated = false;
let lastRepTime = 0;
const REP_COOLDOWN = 800; // 800ms between reps
const MOTION_THRESHOLD = 2.0; // Adjust for sensitivity

// Initialize the device
function init() {
  console.log('TapFit Rep Counter v1.0');
  setupBLE();
  setupAccelerometer();
  calibrateBaseline();
  startupSequence();
}

// Setup BLE UART service
function setupBLE() {
  NRF.setServices({
    [SERVICE_UUID]: {
      [CHAR_UUID]: {
        readable: true,
        writable: true,
        notify: true,
        maxLen: 20,
        value: new Uint8Array([0x00, 0x00]),
        onWrite: function(evt) {
          const data = new Uint8Array(evt.data);
          if (data.length > 0 && data[0] === 0x00) {
            // Reset command from app
            resetRepCount();
            console.log('Reset command received');
          }
        }
      }
    }
  }, { uart: false });

  NRF.setAdvertising({}, {
    name: DEVICE_NAME,
    showName: true,
    connectable: true,
    interval: 375
  });
}

// Setup accelerometer
function setupAccelerometer() {
  Puck.accelOn(12.5); // 12.5Hz sample rate
}

// Calibrate baseline (device at rest)
function calibrateBaseline() {
  console.log('Calibrating baseline...');
  digitalPulse(LED3, 1, [100, 100, 100]); // Blue pulse during calibration
  
  let samples = [];
  let sampleCount = 0;
  const targetSamples = 20;
  
  function takeSample() {
    const accel = Puck.accel();
    samples.push(accel);
    sampleCount++;
    
    if (sampleCount >= targetSamples) {
      // Calculate average
      baseline.x = samples.reduce((sum, s) => sum + s.x, 0) / targetSamples;
      baseline.y = samples.reduce((sum, s) => sum + s.y, 0) / targetSamples;
      baseline.z = samples.reduce((sum, s) => sum + s.z, 0) / targetSamples;
      
      isCalibrated = true;
      console.log('Baseline calibrated:', baseline);
      digitalPulse(LED2, 1, [200, 100, 200]); // Green success
      
      // Start monitoring
      setTimeout(startMonitoring, 1000);
    } else {
      setTimeout(takeSample, 100);
    }
  }
  
  setTimeout(takeSample, 500);
}

// Start motion monitoring
function startMonitoring() {
  if (!isCalibrated) return;
  
  setInterval(() => {
    const accel = Puck.accel();
    const motion = calculateMotion(accel);
    checkForRep(motion);
  }, 80); // ~12Hz monitoring rate
  
  console.log('Motion monitoring started');
}

// Calculate motion magnitude from baseline
function calculateMotion(accel) {
  const dx = accel.x - baseline.x;
  const dy = accel.y - baseline.y;
  const dz = accel.z - baseline.z;
  
  // Focus on Z-axis (up/down motion) but include overall magnitude
  const motion = Math.sqrt(dx*dx + dy*dy + dz*dz*2); // Weight Z-axis more
  return motion;
}

// Check if motion indicates a rep
function checkForRep(motion) {
  const now = getTime() * 1000; // Convert to milliseconds
  
  // Prevent rapid fire reps
  if (now - lastRepTime < REP_COOLDOWN) return;
  
  // Simple threshold-based detection
  if (motion > MOTION_THRESHOLD && motion > lastMotion * 1.5) {
    registerRep();
    lastRepTime = now;
  }
  
  lastMotion = motion;
}

// Register a new rep
function registerRep() {
  repCount++;
  console.log('Rep detected! Count:', repCount);
  
  // Visual feedback
  digitalPulse(LED2, 1, [50, 50, 50]); // Quick green flash
  
  // Send to app via BLE
  transmitRepCount();
}

// Send rep count to connected app
function transmitRepCount() {
  const data = new Uint8Array([0x01, repCount & 0xFF]); // Packet type 0x01 + rep count
  
  try {
    NRF.updateServices({
      [SERVICE_UUID]: {
        [CHAR_UUID]: {
          value: data,
          notify: true
        }
      }
    });
  } catch (e) {
    console.log('BLE transmit error:', e);
  }
}

// Reset rep count
function resetRepCount() {
  repCount = 0;
  console.log('Rep count reset');
  digitalPulse(LED1, 1, [100, 100, 100]); // Red pulse for reset
  transmitRepCount(); // Send reset count to app
}

// Startup LED sequence
function startupSequence() {
  digitalPulse(LED1, 1, [200]);
  setTimeout(() => digitalPulse(LED2, 1, [200]), 250);
  setTimeout(() => digitalPulse(LED3, 1, [200]), 500);
}

// Button handler for manual reset
setWatch(() => {
  resetRepCount();
}, BTN, { edge: 'falling', debounce: 50, repeat: true });

// Connection events
NRF.on('connect', function() {
  console.log('Device connected');
  digitalPulse(LED3, 1, [300, 100, 300]); // Blue pulse
  transmitRepCount(); // Send current count
});

NRF.on('disconnect', function() {
  console.log('Device disconnected');
  digitalPulse(LED1, 1, [300]); // Red pulse
});

// Battery monitoring
function checkBattery() {
  const voltage = analogRead(D29);
  if (voltage < 0.3) { // Low battery threshold
    digitalPulse(LED1, 1, [100, 100, 100, 100, 100]); // Multiple red flashes
  }
}

// Start battery monitoring every 5 minutes
setInterval(checkBattery, 300000);

// Error handling
process.on('uncaughtException', function(e) {
  console.log('Error:', e);
  digitalPulse(LED1, 1, [50, 50, 50, 50, 50]); // Error indication
});

// Initialize after a short delay
setTimeout(init, 1000);

// Save to flash
save();