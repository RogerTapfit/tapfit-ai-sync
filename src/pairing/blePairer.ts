import { BleClient, numbersToDataView } from '@capacitor-community/bluetooth-le';

const SERVICE_UUID  = '5A35B2F0-7E39-4C92-B5A0-05A7F2C1D1A1';
const HANDSHAKE_UUID= '5A35B2F1-7E39-4C92-B5A0-05A7F2C1D1A1';
const MFG_ID        = 0xFFFF; // test ID; replace when we have a real one

export async function startBLEPair(station: string) {
  try {
    await BleClient.initialize();
  } catch {}

  const stationBytes = new TextEncoder().encode(station);
  let targetDeviceId: string | null = null;

  await BleClient.requestLEScan(
    { allowDuplicates: false }, 
    (res) => {
      const md = (res as any).manufacturerData?.[MFG_ID];
      if (!md) return;
      const payload = md instanceof Uint8Array ? md : new Uint8Array(md);
      if (payload.length !== stationBytes.length) return;
      for (let i = 0; i < payload.length; i++) {
        if (payload[i] !== stationBytes[i]) return;
      }
      targetDeviceId = res.device.deviceId;
      BleClient.stopLEScan();
    }
  );

  // scan window
  await new Promise(r => setTimeout(r, 6000));
  await BleClient.stopLEScan();

  if (!targetDeviceId) return;

  await BleClient.connect(targetDeviceId);
  await BleClient.write(targetDeviceId, SERVICE_UUID, HANDSHAKE_UUID, numbersToDataView([...stationBytes]));
  // Optionally: read back a status byte if you expose it as readable.
}