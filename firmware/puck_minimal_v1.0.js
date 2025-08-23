// TapFit Puck Minimal Firmware v1.0
// Optimized for memory constraints

var t = {
  cfg: {
    sr: 26,
    th: 0.15,
    cd: 600,
    to: 30000,
    bt: 3.5
  },
  st: {
    rc: 0,
    act: false,
    con: false,
    bl: {x: 0, y: 0, z: 0},
    lm: 0,
    lt: 0,
    sb: 0
  }
};

var svc, chr;

function init() {
  NRF.setConnectionInterval(20);
  setupBLE();
  setupAccel();
  setupBtn();
  setupNFC();
  Puck.accelOn(t.cfg.sr);
  cal();
  digitalPulse(LED2, 1, [100, 100, 100]);
}

function setupBLE() {
  svc = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
  chr = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
  
  NRF.setServices({
    [svc]: {
      [chr]: {
        value: [0],
        notify: true,
        readable: true
      }
    }
  });
  
  NRF.setAdvertising({}, {
    name: "TapFit",
    connectable: true,
    discoverable: true
  });
  
  NRF.on('connect', function() {
    t.st.con = true;
    digitalPulse(LED2, 1, 200);
    sendPkt(1, [t.st.rc]);
  });
  
  NRF.on('disconnect', function() {
    t.st.con = false;
    digitalPulse(LED1, 1, 200);
  });
}

function setupAccel() {
  Puck.on('accel', function(a) {
    if (!t.st.act) return;
    
    var m = Math.sqrt(
      (a.x - t.st.bl.x) * (a.x - t.st.bl.x) * 0.4 +
      (a.y - t.st.bl.y) * (a.y - t.st.bl.y) * 0.3 +
      (a.z - t.st.bl.z) * (a.z - t.st.bl.z) * 0.3
    );
    
    var now = getTime();
    if (m > t.cfg.th && (now - t.st.lt) > t.cfg.cd) {
      t.st.rc++;
      t.st.lt = now;
      digitalPulse(LED2, 1, 50);
      if (t.st.con) sendPkt(0, [t.st.rc]);
    }
    
    t.st.lm = m;
    
    if (now - t.st.sb > t.cfg.to) {
      t.st.act = false;
      digitalPulse(LED1, 1, [100, 100]);
    }
  });
}

function setupBtn() {
  setWatch(function() {
    if (t.st.act) {
      stop();
    } else {
      start();
    }
  }, BTN, {edge: "rising", debounce: 50, repeat: true});
  
  setWatch(function() {
    reset();
  }, BTN, {edge: "rising", debounce: 50, repeat: true, timeout: 2000});
}

function setupNFC() {
  NRF.nfcOn(function() {
    if (!t.st.act) {
      start();
      digitalPulse(LED2, 1, [50, 50, 50]);
    }
  });
}

function cal() {
  var s = [];
  var i = 0;
  
  digitalPulse(LED3, 1, [100, 100], 20);
  
  var iv = setInterval(function() {
    var a = Puck.accel();
    s.push(a);
    i++;
    
    if (i >= 50) {
      clearInterval(iv);
      
      var sx = 0, sy = 0, sz = 0;
      for (var j = 0; j < s.length; j++) {
        sx += s[j].x;
        sy += s[j].y;
        sz += s[j].z;
      }
      
      t.st.bl.x = sx / s.length;
      t.st.bl.y = sy / s.length;
      t.st.bl.z = sz / s.length;
      
      digitalPulse(LED2, 1, [200, 200]);
    }
  }, 20);
}

function start() {
  t.st.act = true;
  t.st.sb = getTime();
  t.st.rc = 0;
  digitalPulse(LED2, 1, [100, 200, 100]);
  if (t.st.con) sendPkt(2, [1]);
}

function stop() {
  t.st.act = false;
  digitalPulse(LED1, 1, [200, 100, 200]);
  if (t.st.con) sendPkt(2, [0]);
}

function reset() {
  t.st.rc = 0;
  digitalPulse(LED1, 1, [50, 50, 50]);
  if (t.st.con) sendPkt(0, [0]);
}

function sendPkt(type, data) {
  if (!t.st.con) return;
  
  var pkt = [type];
  for (var i = 0; i < data.length; i++) {
    pkt.push(data[i]);
  }
  
  try {
    NRF.updateServices({
      [svc]: {
        [chr]: {
          value: pkt,
          notify: true
        }
      }
    });
  } catch(e) {
    digitalPulse(LED3, 1, 50);
  }
}

function bat() {
  var v = analogRead(D30);
  if (v < t.cfg.bt) {
    digitalPulse(LED1, 1, [1000, 500], 3);
  }
  return v;
}

setInterval(bat, 60000);

process.on('uncaughtException', function(e) {
  digitalPulse(LED3, 1, [50, 50, 50, 50]);
});

setTimeout(init, 500);