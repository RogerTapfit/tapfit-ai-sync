// Ultra Simple Puck - Memory Optimized
var s="6e400001-b5a3-f393-e0a9-e50e24dcca9e";
var c="6e400003-b5a3-f393-e0a9-e50e24dcca9e";
var r=0,cn=0,bx=0,by=0,bz=0,lt=0;

// Setup BLE
var sv={};sv[s]={};sv[s][c]={value:[0],notify:1};
NRF.setServices(sv);
NRF.setAdvertising({},{name:"TapFit"});

// Events
NRF.on('connect',function(){
cn=1;LED2.set();setTimeout(()=>LED2.reset(),200);
try{var u={};u[s]={};u[s][c]={value:[1,r],notify:1};NRF.updateServices(u);}catch(e){}
});

NRF.on('disconnect',function(){cn=0;});

// Calibrate
var cal=0,sx=0,sy=0,sz=0;
var iv=setInterval(function(){
var a=Puck.accel();sx+=a.x;sy+=a.y;sz+=a.z;cal++;
if(cal>=10){bx=sx/cal;by=sy/cal;bz=sz/cal;clearInterval(iv);LED2.set();setTimeout(()=>LED2.reset(),100);}
},100);

// Motion
Puck.accelOn(26);
Puck.on('accel',function(a){
if(!cn)return;
var dx=a.x-bx,dy=a.y-by,dz=a.z-bz;
var m=Math.sqrt(dx*dx+dy*dy+dz*dz);
var now=getTime();
if(m>0.2&&(now-lt)>0.5){
r++;lt=now;LED1.set();setTimeout(()=>LED1.reset(),50);
try{var u={};u[s]={};u[s][c]={value:[0,r],notify:1};NRF.updateServices(u);}catch(e){}
}
});

// Button test
setWatch(function(){
if(cn){r++;LED1.set();setTimeout(()=>LED1.reset(),100);
try{var u={};u[s]={};u[s][c]={value:[0,r],notify:1};NRF.updateServices(u);}catch(e){}}
},BTN,{edge:"rising",debounce:50,repeat:1});