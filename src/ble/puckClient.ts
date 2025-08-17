import { BleClient } from '@capacitor-community/bluetooth-le';

const SERVICE = '0000FFE0-0000-1000-8000-00805F9B34FB';
const CHAR = '0000FFE1-0000-1000-8000-00805F9B34FB';

export type PuckStatus = 'handshaking' | 'connected' | 'disconnected' | 'error';

export class PuckClient {
  private deviceId?: string;
  private lastRep = 0;

  constructor(
    private onStatus?: (s: PuckStatus) => void,
    private onRep?: (rep: number) => void
  ) {}

  async handshake(autoReset = true) {
    this.onStatus?.('handshaking');
    await BleClient.initialize();
    const dev = await BleClient.requestDevice({
      services: [SERVICE],
      optionalServices: [SERVICE],
    });
    this.deviceId = dev.deviceId;

    await BleClient.connect(this.deviceId, () => {
      this.onStatus?.('disconnected');
      this.deviceId = undefined;
    });

    if (autoReset) await this.reset();

    await BleClient.startNotifications(this.deviceId!, SERVICE, CHAR, (v) => {
      const u = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
      if (u.length >= 2 && u[0] === 0x01) {
        const rep = u[1] & 0xff;
        if (rep > this.lastRep) {
          this.lastRep = rep;
          this.onRep?.(rep);
        }
      }
    });

    this.onStatus?.('connected');
  }

  async reset() {
    if (!this.deviceId) return;
    this.lastRep = 0;
    const bytes = new Uint8Array([0x00]);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    await BleClient.write(this.deviceId, SERVICE, CHAR, view);
  }

  async disconnect() {
    if (!this.deviceId) return;
    try { await BleClient.stopNotifications(this.deviceId, SERVICE, CHAR); } catch {}
    await BleClient.disconnect(this.deviceId);
    this.deviceId = undefined;
  }
}
