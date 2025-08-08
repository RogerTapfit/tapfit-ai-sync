import { BleClient, type BleDevice, type ScanResult } from '@capacitor-community/bluetooth-le';

export interface ConnectedDevice {
  deviceId: string;
  name?: string;
}

const DEFAULT_TIMEOUT = 30000;

export const blePuckUtil = {
  async ensureReady() {
    try {
      await BleClient.initialize({ androidNeverForLocation: true });
    } catch {}
    try {
      const enabled = await BleClient.isEnabled();
      if (!enabled) await BleClient.enable();
    } catch (e) {
      console.warn('BLE may not be enabled:', e);
    }
  },

  async connectFirst(opts: { service: string; timeoutMs?: number; onDisconnect?: (deviceId: string)=>void }): Promise<ConnectedDevice> {
    const { service, timeoutMs = DEFAULT_TIMEOUT, onDisconnect } = opts;
    await this.ensureReady();

    return new Promise(async (resolve, reject) => {
      let resolved = false;
      let timeoutId: any;

      try {
        await BleClient.requestLEScan({ services: [service] }, async (result: ScanResult) => {
          const { device } = result;
          if (resolved) return;
          if (!device?.deviceId) return;

          resolved = true;
          clearTimeout(timeoutId);
          try { await BleClient.stopLEScan(); } catch {}

          await BleClient.connect(device.deviceId, onDisconnect);
          resolve({ deviceId: device.deviceId, name: device.name });
        });

        timeoutId = setTimeout(async () => {
          if (resolved) return;
          try { await BleClient.stopLEScan(); } catch {}
          reject(new Error('BLE scan timeout'));
        }, timeoutMs);
      } catch (err) {
        reject(err);
      }
    });
  },

  async subscribe(deviceId: string, service: string, characteristic: string, cb: (data: ArrayBuffer) => void): Promise<() => Promise<void>> {
    await BleClient.startNotifications(deviceId, service, characteristic, (value) => {
      // Ensure we pass only the exact bytes from the DataView (handles offset/length correctly)
      const view = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      const copy = view.slice();
      cb(copy.buffer);
    });
    return async () => {
      try { await BleClient.stopNotifications(deviceId, service, characteristic); } catch {}
    };
  },

  async write(deviceId: string, service: string, characteristic: string, data: Uint8Array): Promise<void> {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    await BleClient.write(deviceId, service, characteristic, view);
  },

  async writeSafe(deviceId: string | null | undefined, service: string, characteristic: string, data: Uint8Array): Promise<boolean> {
    if (!deviceId) return false;
    try {
      await this.write(deviceId, service, characteristic, data);
      return true;
    } catch (e) {
      console.warn('BLE write failed', e);
      return false;
    }
  },

  async disconnect(deviceId?: string | null) {
    if (!deviceId) return;
    try { await BleClient.disconnect(deviceId); } catch {}
  }
};
