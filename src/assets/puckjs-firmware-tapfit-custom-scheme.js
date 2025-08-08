// ===== TapFit Puck.js Firmware (BLE 0xFFE0/0xFFE1 + NFC + reps) =====
let REP_COOLDOWN = 1000;    // ms (mutable via BLE cmd 0x11)
const CALIBRATION_MS = 1500;
let lastRep = 0;
let repCount = 0;
let G_THRESHOLD = 1.35;     // ~35% above idle
let SCALE = 8192;           // LSB per 1g (auto-set after calibration)

// --- LEDs ---
function flash(led, times, interval) {
  let n = 0, id = setInterval(() => {
    led.write(n % 2 === 0); n++;
    if (n >= times * 2) { clearInterval(id); led.reset(); }
  }, interval);
}

// --- Boot cue ---
flash(LED3, 2, 150); // blue x2

// --- NFC: opens TapFit & cue ---
NRF.nfcURL("tapfit://machine/<id>?autoConnect=puck");
NRF.on('NFCon', () => flash(LED3, 3, 150));
NRF.on('NFCoff', () => { LED1.set(); setTimeout(() => LED1.reset(), 120); });

// --- BLE name + UART-like notify characteristic on 0xFFE0/0xFFE1 ---
NRF.setDeviceName("TapFit Puck");
NRF.setServices({
  0xFFE0: {
    0xFFE1: {
      value: new Uint8Array([0x00, 0x00]).buffer, // 2 bytes
      notify: true,
      readable: true,
      writable: true,
      onWrite: function (evt) {
        if (!evt || !evt.data) return;
        const d = new Uint8Array(evt.data);
        // Commands:
        // 0x00 = reset reps
        // 0x10 = set threshold (next byte * 0.01)
        // 0x11 = set cooldown (next 2 bytes ms, big-endian)
        if (d[0] === 0x00) {
          repCount = 0;
        } else if (d[0] === 0x10 && d.length >= 2) {
          G_THRESHOLD = d[1] / 100;
        } else if (d[0] === 0x11 && d.length >= 3) {
          REP_COOLDOWN = (d[1] << 8) | d[2];
        }
      }
    }
  }
}, { advertise: ['FFE0'] });

NRF.on('connect', () => {
  flash(LED3, 3, 150); // blue x3
  // Sync current repCount on connect
  const payload = new Uint8Array([0x01, repCount & 0xFF]);
  NRF.updateServices({ 0xFFE0: { 0xFFE1: { value: payload.buffer } } });
});
NRF.on('disconnect', () => { /* keep running */ });

// --- Calibrate accelerometer scale (compute 1g in LSB) ---
Puck.accelOn();
let samples = 0, sumMag = 0;
const calTimer = setInterval(() => {
  const a = Puck.accel(); if (!a || !a.acc) return;
  const ax = a.acc.x, ay = a.acc.y, az = a.acc.z;
  sumMag += Math.sqrt(ax * ax + ay * ay + az * az);
  samples++;
}, 50);

setTimeout(() => {
  clearInterval(calTimer);
  if (samples > 0) {
    SCALE = (sumMag / samples);
    console.log("Calibrated SCALE =", SCALE.toFixed(0), "LSB/1g");
  } else {
    console.log("Calibration failed; using default SCALE", SCALE);
  }

  // --- Detection loop ---
  setInterval(() => {
    const a = Puck.accel(); if (!a || !a.acc) return;
    const ax = a.acc.x, ay = a.acc.y, az = a.acc.z;
    const mag = Math.sqrt(ax * ax + ay * ay + az * az); // LSB
    const g = mag / SCALE;

    if (g > G_THRESHOLD && (Date.now() - lastRep) > REP_COOLDOWN) {
      lastRep = Date.now();
      repCount = (repCount + 1) & 0xFF; // 0..255
      flash(LED2, 1, 120); // green x1

      // Notify app: [0x01, repCount]
      const payload = new Uint8Array([0x01, repCount]);
      NRF.updateServices({ 0xFFE0: { 0xFFE1: { value: payload.buffer } } });

      console.log("Rep #", repCount, "@", g.toFixed(2), "g");
    }
  }, 100);
}, CALIBRATION_MS);
