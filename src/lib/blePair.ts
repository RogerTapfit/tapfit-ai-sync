import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { BleClient, type BleDevice, type ScanResult } from '@capacitor-community/bluetooth-le';
import { PuckClient } from '@/ble/puckClient';

// Nordic UART Service - matches PuckClient expectations
const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const TX_CHARACTERISTIC = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const RX_CHARACTERISTIC = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

let _scanActive = false;
let _connectedPuck: PuckClient | null = null;

// Check if BLE is supported on this platform
function isBleSupported(): boolean {
  // Always supported on native platforms
  if (Capacitor.isNativePlatform()) {
    return true;
  }
  
  // On web, check if Web Bluetooth API is available and functional
  if (typeof navigator !== 'undefined' && navigator.bluetooth) {
    // requestLEScan is not available in most browsers
    return typeof (navigator.bluetooth as any).requestLEScan === 'function';
  }
  
  return false;
}

export interface BlePairResult {
  success: boolean;
  deviceId?: string;
  puckClient?: PuckClient;
  error?: string;
}

export interface BlePairCallbacks {
  onStatusUpdate?: (status: string) => void;
  onRepCountUpdate?: (repCount: number) => void;
  onPuckStateUpdate?: (state: any) => void;
  onConnectionSuccess?: (puckClient: PuckClient) => void;
  onConnectionFailed?: (error: string) => void;
}

async function ensurePermissions(): Promise<void> {
  try {
    await BleClient.initialize({ androidNeverForLocation: true });
  } catch (error) {
    console.warn('BLE already initialized:', error);
  }

  try {
    const enabled = await BleClient.isEnabled();
    if (!enabled) {
      await BleClient.enable();
    }
  } catch (error) {
    console.warn('BLE permission/enable issue:', error);
    throw new Error('Bluetooth permission required');
  }
}

async function connectNearest(
  timeoutMs = 15000, 
  callbacks?: BlePairCallbacks
): Promise<BlePairResult> {
  // Check if BLE is supported on this platform
  if (!isBleSupported()) {
    console.log('BLE not supported on this platform, skipping scan');
    return { success: false, error: 'BLE not supported on this browser' };
  }

  if (_scanActive) {
    return { success: false, error: 'Scan already active' };
  }

  _scanActive = true;
  callbacks?.onStatusUpdate?.('Scanning for TapFit Puck...');

  let bestDevice: { deviceId: string; rssi: number; name?: string } | null = null;
  let scanComplete = false;

  try {
    await ensurePermissions();

    // Start scanning for devices with the Nordic UART service
    await BleClient.requestLEScan(
      { 
        services: [SERVICE_UUID],
        allowDuplicates: false 
      }, 
      (result: ScanResult) => {
        if (!result?.device?.deviceId || scanComplete) return;
        
        const rssi = typeof result.rssi === 'number' ? result.rssi : -200;
        const deviceName = result.device.name || result.localName || 'Unknown';
        
        console.log(`Found device: ${deviceName} (${result.device.deviceId}) RSSI: ${rssi}`);
        
        // Select the device with strongest signal (closest)
        if (!bestDevice || rssi > bestDevice.rssi) {
          bestDevice = { 
            deviceId: result.device.deviceId, 
            rssi, 
            name: deviceName 
          };
          callbacks?.onStatusUpdate?.(`Found ${deviceName} (${rssi} dBm)`);
        }
      }
    );

    // Wait for scan timeout
    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        scanComplete = true;
        try {
          await BleClient.stopLEScan();
        } catch (error) {
          console.warn('Error stopping scan:', error);
        }
        resolve();
      }, timeoutMs);
    });

    if (!bestDevice) {
      _scanActive = false;
      callbacks?.onStatusUpdate?.('No TapFit Puck found');
      return { success: false, error: 'No TapFit Puck found nearby' };
    }

    // Attempt connection to best device
    callbacks?.onStatusUpdate?.(`Connecting to ${bestDevice.name}...`);
    
    try {
      await BleClient.connect(bestDevice.deviceId, (deviceId) => {
        console.log('Device disconnected:', deviceId);
        callbacks?.onStatusUpdate?.('Puck disconnected');
        _connectedPuck = null;
      });

      // Create PuckClient instance for this connection
      const puckClient = new PuckClient(
        (status) => {
          console.log('Puck status:', status);
          callbacks?.onStatusUpdate?.(status);
        },
        (repCount) => {
          console.log('Rep count:', repCount);
          callbacks?.onRepCountUpdate?.(repCount);
        },
        (puckState) => {
          console.log('Puck state:', puckState);
          callbacks?.onPuckStateUpdate?.(puckState);
        }
      );

      // Set the device ID for the PuckClient (assuming it has this capability)
      (puckClient as any).deviceId = bestDevice.deviceId;
      
      _connectedPuck = puckClient;
      callbacks?.onStatusUpdate?.(`Connected to ${bestDevice.name}`);
      callbacks?.onConnectionSuccess?.(puckClient);

      _scanActive = false;
      return { 
        success: true, 
        deviceId: bestDevice.deviceId, 
        puckClient 
      };

    } catch (connectError) {
      console.error('Connection failed:', connectError);
      
      // Retry once with a shorter timeout
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await BleClient.connect(bestDevice.deviceId);
        
        const puckClient = new PuckClient(
          (status) => callbacks?.onStatusUpdate?.(status),
          (repCount) => callbacks?.onRepCountUpdate?.(repCount),
          (puckState) => callbacks?.onPuckStateUpdate?.(puckState)
        );

        (puckClient as any).deviceId = bestDevice.deviceId;
        _connectedPuck = puckClient;
        callbacks?.onConnectionSuccess?.(puckClient);

        _scanActive = false;
        return { 
          success: true, 
          deviceId: bestDevice.deviceId, 
          puckClient 
        };
        
      } catch (retryError) {
        _scanActive = false;
        const errorMsg = `Connection failed: ${connectError}`;
        callbacks?.onStatusUpdate?.(errorMsg);
        callbacks?.onConnectionFailed?.(errorMsg);
        return { success: false, error: errorMsg };
      }
    }

  } catch (error) {
    _scanActive = false;
    const errorMsg = `BLE error: ${error}`;
    console.error('BLE pairing error:', error);
    callbacks?.onStatusUpdate?.(errorMsg);
    callbacks?.onConnectionFailed?.(errorMsg);
    return { success: false, error: errorMsg };
  }
}

export function setupUniversalLinkPairing(callbacks?: BlePairCallbacks): void {
  // Skip BLE setup on platforms that don't support it
  if (!isBleSupported()) {
    console.log('BLE not supported on this platform, skipping Universal Link pairing setup');
    return;
  }

  console.log('Setting up Universal Link pairing...');
  
  App.addListener('appUrlOpen', async ({ url }) => {
    console.log('App opened with URL:', url);
    
    try {
      if (!url) return;
      
      const parsedUrl = new URL(url);
      console.log('Parsed URL:', parsedUrl.pathname, parsedUrl.search);
      
      // Handle pairing URLs: https://tapfit.info/pair?station=LEGEXT01
      if (parsedUrl.pathname.startsWith('/pair')) {
        const station = parsedUrl.searchParams.get('station');
        console.log('Starting NFC-triggered BLE connection for station:', station);
        
        callbacks?.onStatusUpdate?.('NFC detected - Starting connection...');
        
        // Start connection process
        const result = await connectNearest(15000, callbacks);
        
        if (result.success && result.puckClient) {
          console.log('Universal Link connection successful');
          // Optionally start a workout session automatically
          try {
            await result.puckClient.startSession();
            callbacks?.onStatusUpdate?.('Workout session started');
          } catch (error) {
            console.warn('Failed to start session:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error handling Universal Link:', error);
      callbacks?.onStatusUpdate?.('Connection failed');
    }
  });

  // Also scan when app becomes active (helps with delayed Universal Link association)
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive && !_connectedPuck && !_scanActive) {
      console.log('App became active - attempting background scan');
      connectNearest(8000, callbacks).catch(console.error);
    }
  });
}

export function getCurrentPuck(): PuckClient | null {
  return _connectedPuck;
}

export function disconnectPuck(): void {
  if (_connectedPuck) {
    _connectedPuck.disconnect();
    _connectedPuck = null;
  }
}

export { connectNearest };