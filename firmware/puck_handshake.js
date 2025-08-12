const DEVICE_NAME = "TapFit Puck";
const SERVICE_UUID        = "5a35b2f0-7e39-4c92-b5a0-05a7f2c1d1a1";
const HANDSHAKE_CHAR_UUID = "5a35b2f1-7e39-4c92-b5a0-05a7f2c1d1a1";
const MFG_ID = 0xFFFF;
const STATION_ID_STR = "LEGEXT01"; // must match NFC tag
const STATION_ID = E.toUint8Array(STATION_ID_STR);

function startAdvertising(){
  NRF.setAdvertising([{ [MFG_ID]: STATION_ID }], {
    name: DEVICE_NAME, showName: true, connectable: true, interval: 375, advertise: [SERVICE_UUID]
  });
}

function setupGatt(){
  NRF.setServices({
    [SERVICE_UUID]: {
      [HANDSHAKE_CHAR_UUID]: {
        readable:true, writable:true, maxLen:20, value:new Uint8Array([0x00]),
        onWrite:function(evt){
          let incoming = E.toUint8Array(evt.data);
          let ok = incoming.length===STATION_ID.length && incoming.every((b,i)=>b===STATION_ID[i]);
          this.write(new Uint8Array([ ok ? 1 : 2 ]));
          digitalPulse(ok?LED2:LED1,1,[150,80,150]); // green on OK, red on mismatch
        }
      }
    }
  }, { uart:false });
}

NRF.on('connect', ()=> digitalPulse(LED3,1,[120,80,120])); // blue pulse

E.on('init', ()=>{ setupGatt(); startAdvertising(); digitalPulse(LED2,1,[120,80,120]); });
save();