// TapFit Puck Ultra Minimal v2.0 - Memory Optimized for App v1.2.5+
// Packet Protocol: [type, data...] where type: 0=reps, 1=handshake, 2=status

var c = {
  s: "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // service
  t: "6e400003-b5a3-f393-e0a9-e50e24dcca9e", // tx char
  th: 0.12, // motion threshold 
  cd: 500,  // cooldown ms
  to: 25000 // timeout ms
};

var d = {
  r: 0,     // rep count
  on: false, // session active
  cn: false, // connected
  bx: 0, by: 0, bz: 0, // baseline
  lt: 0,    // last trigger
  sb: 0     // session begin
};

var iv, svc, chr;

function ini() {
  // Setup BLE
  svc = {};
  svc[c.s] = {};
  chr = {};
  chr.value = [0];
  chr.notify = true;
  chr.readable = true;
  svc[c.s][c.t] = chr;
  
  NRF.setServices(svc);
  NRF.setAdvertising({}, {name: "TapFit", connectable: true});
  console.log('Advertising as "TapFit"');
  
  // BLE Events
  NRF.on('connect', function() {
    d.cn = true;
    LED2.set();
    setTimeout(function() { LED2.reset(); }, 200);
    snd(1, [d.r]); // handshake with current rep count
    console.log('BLE connected, sent handshake with reps:', d.r);
  });
  
  NRF.on('disconnect', function() {
    d.cn = false;
    stp();
  });
  
  // Calibration - Simple 1 second
  LED3.set();
  var samples = 0;
  var sx = 0, sy = 0, sz = 0;
  
  iv = setInterval(function() {
    var a = Puck.accel();
    sx += a.x; sy += a.y; sz += a.z;
    samples++;
    
    if (samples >= 20) {
      clearInterval(iv);
      d.bx = sx / samples;
      d.by = sy / samples; 
      d.bz = sz / samples;
      LED3.reset();
      LED2.set();
      setTimeout(function() { LED2.reset(); }, 100);
    }
  }, 50);
  
  // Motion detection
  Puck.accelOn(26);
  Puck.on('accel', mot);
  
  // Button controls
  setWatch(btn, BTN, {edge: "rising", debounce: 50, repeat: true});
  
  // NFC start
  NRF.nfcOn(function() {
    if (!d.on) str();
  });
}

function mot(a) {
  if (!d.on) return;
  
  var dx = a.x - d.bx;
  var dy = a.y - d.by; 
  var dz = a.z - d.bz;
  var m = Math.sqrt(dx*dx*0.4 + dy*dy*0.3 + dz*dz*0.3);
  
  var now = getTime();
  if (m > c.th && (now - d.lt) > c.cd) {
    d.r++;
    d.lt = now;
    LED2.set();
    setTimeout(function() { LED2.reset(); }, 50);
    console.log('Rep detected:', d.r);
    if (d.cn) snd(0, [d.r]); // send rep count (type 0)
  }
  
  // Auto stop timeout
  if (now - d.sb > c.to) {
    stp();
  }
}

function btn() {
  if (d.on) {
    stp();
  } else {
    str();
  }
}

function str() {
  d.on = true;
  d.sb = getTime();
  d.r = 0;
  LED2.set();
  setTimeout(function() {
    LED2.reset();
    setTimeout(function() {
      LED2.set();
      setTimeout(function() { LED2.reset(); }, 100);
    }, 100);
  }, 100);
  console.log('Session started');
  if (d.cn) snd(2, [1]); // send status: session active (type 2, data 1)
}

function stp() {
  d.on = false;
  LED1.set();
  setTimeout(function() { LED1.reset(); }, 200);
  console.log('Session stopped');
  if (d.cn) snd(2, [0]); // send status: session inactive (type 2, data 0)
}

function snd(type, data) {
  if (!d.cn) return;
  
  var pkt = [type];
  for (var i = 0; i < data.length; i++) {
    pkt.push(data[i]);
  }
  
  try {
    var upd = {};
    upd[c.s] = {};
    upd[c.s][c.t] = {value: pkt, notify: true};
    NRF.updateServices(upd);
  } catch(e) {
    // Silent fail
  }
}

// Battery check every 30s
setInterval(function() {
  var v = analogRead(D30);
  if (v < 3.4) {
    LED1.set();
    setTimeout(function() { LED1.reset(); }, 1000);
  }
}, 30000);

// Error handler
process.on('uncaughtException', function() {
  LED3.set();
  setTimeout(function() { LED3.reset(); }, 200);
});

// Start after 1 second
setTimeout(ini, 1000);