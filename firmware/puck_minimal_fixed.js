// TapFit Puck Minimal Firmware - Fixed Data Size Issues
// Ultra-lightweight version to avoid ERR 0xc (DATA_SIZE)

var DEVICE_NAME = "TapFit";  // Shorter name
var SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
var TX_CHAR_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
var RX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// Minimal state
var state = {
  repCount: 0,
  sessionActive: false,
  isConnected: false,
  isCalibrated: false,
  batteryLevel: 1.0
};

// Packet types
var PACKET_TYPE = {
  REP_COUNT: 0x01,
  STATUS: 0x02,
  HEARTBEAT: 0x03
};

// Commands
var COMMAND = {
  HANDSHAKE: 0x01,
  START_SESSION: 0x02,
  STOP_SESSION: 0x03,
  CALIBRATE: 0x04,
  RESET: 0x05
};

function initializePuck() {
  console.log("TapFit Puck Minimal v3.1 initializing...");
  
  setupBLE();
  setupNFC();
  setupAccelerometer();
  
  startAdvertising();
  
  console.log("TapFit Puck ready");
}

function setupBLE() {
  console.log("Setting up BLE service...");
  
  try {
    // Minimal BLE service setup
    var services = {};
    services[SERVICE_UUID] = {};
    
    services[SERVICE_UUID][TX_CHAR_UUID] = {
      value: [0],
      maxLen: 20,
      notify: true
    };
    
    services[SERVICE_UUID][RX_CHAR_UUID] = {
      value: [0],
      maxLen: 20,
      writable: true,
      onWrite: handleIncomingCommand
    };
    
    NRF.setServices(services, { advertise: [SERVICE_UUID] });
    
    NRF.on('connect', handleConnect);
    NRF.on('disconnect', handleDisconnect);
    
    console.log("BLE service setup complete");
  } catch (e) {
    console.log("BLE setup error:", e);
  }
}

function setupNFC() {
  console.log("Setting up NFC...");
  
  try {
    // Shorter URL to avoid data size issues
    NRF.nfcURL("https://tapfit.info/nfc");
    
    NRF.on('NFCon', function() {
      console.log("NFC detected!");
      LED1.write(1);
      setTimeout(function() { LED1.write(0); }, 200);
    });
    
    console.log("NFC setup complete");
  } catch (e) {
    console.log("NFC setup error:", e);
  }
}

function startAdvertising() {
  try {
    // Minimal advertising data to avoid size issues
    var advData = {};
    advData[0x09] = DEVICE_NAME; // Device name only
    
    NRF.setAdvertising(advData, {
      name: DEVICE_NAME,
      interval: 100,
      connectable: true
    });
    
    console.log("Advertising started");
  } catch (e) {
    console.log("Advertising error:", e);
  }
}

function handleConnect() {
  console.log("BLE connected");
  state.isConnected = true;
  LED2.write(1);
  setTimeout(function() { LED2.write(0); }, 500);
  sendStatus();
}

function handleDisconnect() {
  console.log("BLE disconnected");
  state.isConnected = false;
  if (state.sessionActive) {
    stopSession();
  }
  setTimeout(startAdvertising, 1000);
}

function handleIncomingCommand(evt) {
  var data = new Uint8Array(evt.data);
  var command = data[0];
  
  console.log("Command:", command);
  
  switch (command) {
    case COMMAND.HANDSHAKE:
      sendStatus();
      break;
    case COMMAND.START_SESSION:
      startSession();
      break;
    case COMMAND.STOP_SESSION:
      stopSession();
      break;
    case COMMAND.CALIBRATE:
      calibrate();
      break;
    case COMMAND.RESET:
      resetReps();
      break;
  }
}

function calibrate() {
  console.log("Calibrating...");
  state.isCalibrated = true;
  LED2.write(1);
  setTimeout(function() { LED2.write(0); }, 200);
  sendStatus();
}

function startSession() {
  console.log("Session started");
  state.sessionActive = true;
  state.repCount = 0;
  LED3.write(1);
  setTimeout(function() { LED3.write(0); }, 500);
  sendStatus();
}

function stopSession() {
  console.log("Session stopped");
  state.sessionActive = false;
  LED3.write(1);
  setTimeout(function() { LED3.write(0); }, 500);
  sendStatus();
}

function resetReps() {
  console.log("Reps reset");
  state.repCount = 0;
  sendRepCount();
}

function setupAccelerometer() {
  Puck.accelOn(12.5);
  
  // Simple motion detection
  setWatch(function() {
    if (state.sessionActive && state.isCalibrated) {
      state.repCount++;
      console.log("Rep:", state.repCount);
      LED3.write(1);
      setTimeout(function() { LED3.write(0); }, 100);
      sendRepCount();
    }
  }, BTN, { edge: "rising", debounce: 1000, repeat: true });
}

// Simplified communication
function sendData(type, data) {
  if (!state.isConnected) return;
  
  try {
    var packet = [type];
    if (data) packet = packet.concat(data);
    
    NRF.updateServices({
      "6e400001-b5a3-f393-e0a9-e50e24dcca9e": {
        "6e400002-b5a3-f393-e0a9-e50e24dcca9e": {
          value: new Uint8Array(packet),
          notify: true
        }
      }
    });
  } catch (e) {
    console.log("Send error:", e);
  }
}

function sendRepCount() {
  sendData(PACKET_TYPE.REP_COUNT, [state.repCount]);
}

function sendStatus() {
  sendData(PACKET_TYPE.STATUS, [
    state.sessionActive ? 1 : 0,
    state.isCalibrated ? 1 : 0,
    100, // Battery %
    state.repCount
  ]);
}

// Error handling
process.on('uncaughtException', function(e) {
  console.log("Error:", e);
});

// Start
initializePuck();