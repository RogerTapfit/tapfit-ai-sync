// TapFit Puck v8.3 Memory Optimized - iOS Compatible
// Ultra-minimal memory usage (<2KB RAM) while maintaining full functionality

// Config (shortened names)
var s="6e400001-b5a3-f393-e0a9-e50e24dcca9e"; // service
var tx="6e400002-b5a3-f393-e0a9-e50e24dcca9e"; // tx char  
var rx="6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // rx char
var th=0.12,cd=500,to=25000,sr=26; // threshold, cooldown, timeout, sample rate

// State (single letters)
var r=0,a=0,c=0,on=0,cal=0; // reps, active, connected, session on, calibrated
var bx=0,by=0,bz=0,lt=0,sb=0; // baseline x,y,z, last trigger, session begin
var bat=1.0,lm=0,sm=0; // battery, last motion, smoothed motion
var cx=0,cy=0,cz=0,cs=0; // calibration sums and samples

// Packet types (numbers only)
var P_REP=1,P_HAND=2,P_STAT=3,P_HEART=4,P_ERR=5;

// Commands  
var C_HAND=1,C_START=2,C_STOP=3,C_CAL=4,C_RESET=5;

function ini(){
  // BLE setup
  var svc={};svc[s]={};
  svc[s][tx]={value:[0],maxLen:20,notify:1,readable:1};
  svc[s][rx]={value:[0],maxLen:20,writable:1,onWrite:cmd};
  NRF.setServices(svc,{advertise:[s]});
  NRF.setAdvertising({},{name:"TapFit",connectable:1,discoverable:1});
  
  // Events
  NRF.on('connect',function(){
    c=1;LED2.set();setTimeout(function(){LED2.reset();},200);
    snd(P_HAND,[r,bat*100|0]);
  });
  
  NRF.on('disconnect',function(){
    c=0;if(on)stp();
  });
  
  // Accelerometer
  Puck.accelOn(sr);
  Puck.on('accel',mot);
  
  // Button
  setWatch(function(){
    if(on)stp();else str();
  },BTN,{edge:"rising",debounce:50,repeat:1});
  
  // NFC
  try{
    NRF.nfcURL("https://tapfit-ai-sync.lovable.app/nfc");
    NRF.on('NFCon',function(){
      if(!on)str();
      LED1.set();setTimeout(function(){LED1.reset();},100);
    });
  }catch(e){}
  
  // Start calibration
  calStart();
  
  // Battery check every 30s
  setInterval(function(){
    bat=analogRead(D30);
    if(bat<3.4){LED1.set();setTimeout(function(){LED1.reset();},1000);}
    if(c)snd(P_HEART,[bat*100|0]);
  },30000);
}

function cmd(evt){
  var d=new Uint8Array(evt.data);
  var cmd=d[0];
  
  switch(cmd){
    case C_HAND:snd(P_STAT,[on,r,bat*100|0,cal]);break;
    case C_START:str();break;
    case C_STOP:stp();break;
    case C_CAL:calStart();break;
    case C_RESET:r=0;if(c)snd(P_REP,[r]);break;
  }
}

function mot(acc){
  // Simple smoothing
  sm=sm*0.8+(Math.sqrt((acc.x-bx)*(acc.x-bx)*0.4+(acc.y-by)*(acc.y-by)*0.3+(acc.z-bz)*(acc.z-bz)*0.3))*0.2;
  
  if(!on||!cal)return;
  
  var now=getTime();
  if(sm>th&&(now-lt)>cd){
    r++;lt=now;
    LED2.set();setTimeout(function(){LED2.reset();},50);
    if(c)snd(P_REP,[r]);
  }
  
  lm=sm;
  
  // Auto stop
  if(now-sb>to)stp();
}

function str(){
  on=1;sb=getTime();r=0;
  LED2.set();
  setTimeout(function(){
    LED2.reset();
    setTimeout(function(){
      LED2.set();
      setTimeout(function(){LED2.reset();},100);
    },100);
  },100);
  if(c)snd(P_STAT,[1,r,bat*100|0,cal]);
}

function stp(){
  on=0;
  LED1.set();setTimeout(function(){LED1.reset();},200);
  if(c)snd(P_STAT,[0,r,bat*100|0,cal]);
}

function calStart(){
  LED3.set();
  cx=cy=cz=cs=0;
  
  var iv=setInterval(function(){
    var acc=Puck.accel();
    cx+=acc.x;cy+=acc.y;cz+=acc.z;cs++;
    
    if(cs>=20){
      clearInterval(iv);
      bx=cx/cs;by=cy/cs;bz=cz/cs;
      cal=1;
      LED3.reset();
      LED2.set();setTimeout(function(){LED2.reset();},200);
      if(c)snd(P_STAT,[on,r,bat*100|0,1]);
    }
  },50);
}

function snd(type,data){
  if(!c)return;
  
  var pkt=[type];
  for(var i=0;i<data.length;i++)pkt.push(data[i]);
  
  try{
    var upd={};upd[s]={};upd[s][tx]={value:new Uint8Array(pkt),notify:1};
    NRF.updateServices(upd);
  }catch(e){
    LED3.set();setTimeout(function(){LED3.reset();},50);
  }
}

// Error handler
process.on('uncaughtException',function(e){
  LED3.set();setTimeout(function(){LED3.reset();},200);
  if(c)snd(P_ERR,[1]);
});

// Start after 1s
setTimeout(ini,1000);