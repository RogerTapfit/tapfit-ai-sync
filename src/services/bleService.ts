import { BleClient, BleDevice, ScanResult } from '@capacitor-community/bluetooth-le';

export interface SensorData {
  type: 'rep' | 'motion' | 'heartRate';
  value: number;
  timestamp: Date;
  deviceId: string;
}

export interface BLEConnectionStatus {
  isConnected: boolean;
  isScanning: boolean;
  deviceName?: string;
  deviceId?: string;
  batteryLevel?: number;
  signalStrength?: number;
}

export type SensorDataCallback = (data: SensorData) => void;
export type ConnectionStatusCallback = (status: BLEConnectionStatus) => void;

class BLEService {
  private connectedDevice: BleDevice | null = null;
  private isInitialized = false;
  private dataCallbacks: SensorDataCallback[] = [];
  private statusCallbacks: ConnectionStatusCallback[] = [];
  private scanTimeout: NodeJS.Timeout | null = null;
  
  // Puck.js specific UUIDs
  private readonly PUCK_SERVICE_UUID = 'FFE0'; // Nordic UART Service
  private readonly PUCK_CHARACTERISTIC_UUID = 'FFE1'; // Nordic UART TX
  private readonly PUCK_DEVICE_NAME = 'Puck.js';
  
  private status: BLEConnectionStatus = {
    isConnected: false,
    isScanning: false
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await BleClient.initialize({
        androidNeverForLocation: true
      });
      
      console.log('BLE Client initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize BLE client:', error);
      throw new Error('BLE initialization failed');
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const hasPermissions = await BleClient.isEnabled();
      if (!hasPermissions) {
        await BleClient.enable();
      }
      console.log('BLE permissions granted');
      return true;
    } catch (error) {
      console.error('BLE permissions denied:', error);
      return false;
    }
  }

  async startScanning(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.status.isScanning) {
      console.log('Already scanning for devices');
      return;
    }

    try {
      this.updateStatus({ isScanning: true });
      console.log('Starting BLE scan for Puck.js devices...');

      await BleClient.requestLEScan(
        {
          services: [], // Empty to scan all devices
          allowDuplicates: false
        },
        (result: ScanResult) => {
          this.handleScanResult(result);
        }
      );

      // Auto-stop scanning after 30 seconds
      this.scanTimeout = setTimeout(() => {
        this.stopScanning();
      }, 30000);

    } catch (error) {
      console.error('Failed to start BLE scan:', error);
      this.updateStatus({ isScanning: false });
    }
  }

  async stopScanning(): Promise<void> {
    if (!this.status.isScanning) return;

    try {
      await BleClient.stopLEScan();
      this.updateStatus({ isScanning: false });
      
      if (this.scanTimeout) {
        clearTimeout(this.scanTimeout);
        this.scanTimeout = null;
      }
      
      console.log('BLE scanning stopped');
    } catch (error) {
      console.error('Failed to stop BLE scan:', error);
    }
  }

  private async handleScanResult(result: ScanResult): Promise<void> {
    const { device } = result;
    
    console.log('Found BLE device:', {
      name: device.name,
      deviceId: device.deviceId,
      rssi: result.rssi
    });

    // Check if this is a Puck.js device
    if (device.name?.includes(this.PUCK_DEVICE_NAME)) {
      console.log('Found Puck.js device, attempting to connect...');
      await this.connectToDevice(device);
    }
  }

  async connectToDevice(device: BleDevice): Promise<void> {
    try {
      await this.stopScanning();
      
      console.log(`Connecting to device: ${device.name} (${device.deviceId})`);
      
      await BleClient.connect(device.deviceId, (deviceId) => {
        console.log(`Device ${deviceId} disconnected`);
        this.handleDisconnection();
      });

      this.connectedDevice = device;
      this.updateStatus({
        isConnected: true,
        deviceName: device.name || 'Unknown Device',
        deviceId: device.deviceId
      });

      console.log('Successfully connected to device');
      
      // Start listening for data
      await this.startListeningForData();
      
    } catch (error) {
      console.error('Failed to connect to device:', error);
      this.updateStatus({ isConnected: false });
    }
  }

  private async startListeningForData(): Promise<void> {
    if (!this.connectedDevice) return;

    try {
      // Method 1: Listen for manufacturer data from advertisements
      // This is passive listening - data comes from device advertisements
      console.log('Setting up data listeners for Puck.js...');

      // Method 2: Subscribe to UART characteristic for notifications
      try {
        await BleClient.startNotifications(
          this.connectedDevice.deviceId,
          this.PUCK_SERVICE_UUID,
          this.PUCK_CHARACTERISTIC_UUID,
          (value) => {
            this.handleIncomingData(value);
          }
        );
        console.log('Successfully subscribed to UART notifications');
      } catch (error) {
        console.log('UART notifications not available, using manufacturer data');
      }

      // Method 3: Periodic reading (fallback)
      this.startPeriodicDataReading();

    } catch (error) {
      console.error('Failed to start listening for data:', error);
    }
  }

  private handleIncomingData(value: DataView): void {
    try {
      // Parse the incoming data based on Puck.js protocol
      const buffer = new Uint8Array(value.buffer);
      console.log('Received BLE data:', Array.from(buffer));

      // Example parsing logic - adjust based on your Puck.js firmware
      if (buffer.length >= 1) {
        const dataType = buffer[0];
        
        switch (dataType) {
          case 0x01: // Rep count
            if (buffer.length >= 2) {
              const repCount = buffer[1];
              this.emitSensorData({
                type: 'rep',
                value: repCount,
                timestamp: new Date(),
                deviceId: this.connectedDevice?.deviceId || 'unknown'
              });
            }
            break;
            
          case 0x02: // Motion detection
            if (buffer.length >= 2) {
              const motionIntensity = buffer[1];
              this.emitSensorData({
                type: 'motion',
                value: motionIntensity,
                timestamp: new Date(),
                deviceId: this.connectedDevice?.deviceId || 'unknown'
              });
            }
            break;
            
          case 0x03: // Heart rate
            if (buffer.length >= 2) {
              const heartRate = buffer[1];
              this.emitSensorData({
                type: 'heartRate',
                value: heartRate,
                timestamp: new Date(),
                deviceId: this.connectedDevice?.deviceId || 'unknown'
              });
            }
            break;
            
          default:
            // Simple rep counter (legacy mode)
            const repCount = buffer[0];
            this.emitSensorData({
              type: 'rep',
              value: repCount,
              timestamp: new Date(),
              deviceId: this.connectedDevice?.deviceId || 'unknown'
            });
        }
      }
    } catch (error) {
      console.error('Failed to parse incoming BLE data:', error);
    }
  }

  private startPeriodicDataReading(): void {
    // Read data every 2 seconds as fallback
    setInterval(async () => {
      if (!this.connectedDevice || !this.status.isConnected) return;

      try {
        // Try to read from the UART characteristic
        const value = await BleClient.read(
          this.connectedDevice.deviceId,
          this.PUCK_SERVICE_UUID,
          this.PUCK_CHARACTERISTIC_UUID
        );
        
        if (value.byteLength > 0) {
          this.handleIncomingData(value);
        }
      } catch (error) {
        // Silent fail - device might not support reading
        console.debug('Periodic read failed:', error);
      }
    }, 2000);
  }

  async disconnect(): Promise<void> {
    if (!this.connectedDevice) return;

    try {
      await BleClient.disconnect(this.connectedDevice.deviceId);
      this.handleDisconnection();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      this.handleDisconnection();
    }
  }

  private handleDisconnection(): void {
    this.connectedDevice = null;
    this.updateStatus({
      isConnected: false,
      deviceName: undefined,
      deviceId: undefined
    });
    console.log('Device disconnected');
  }

  // Event subscription methods
  onSensorData(callback: SensorDataCallback): () => void {
    this.dataCallbacks.push(callback);
    return () => {
      const index = this.dataCallbacks.indexOf(callback);
      if (index > -1) {
        this.dataCallbacks.splice(index, 1);
      }
    };
  }

  onStatusChange(callback: ConnectionStatusCallback): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  private emitSensorData(data: SensorData): void {
    this.dataCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in sensor data callback:', error);
      }
    });
  }

  private updateStatus(updates: Partial<BLEConnectionStatus>): void {
    this.status = { ...this.status, ...updates };
    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.status);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  getStatus(): BLEConnectionStatus {
    return { ...this.status };
  }

  getConnectedDevice(): BleDevice | null {
    return this.connectedDevice;
  }

  // Future-proofing: Support for other sensor types
  async connectToSensor(sensorType: 'puckjs' | 'heartRate' | 'motion', deviceId?: string): Promise<void> {
    switch (sensorType) {
      case 'puckjs':
        await this.startScanning();
        break;
      // Add other sensor types here
      default:
        throw new Error(`Unsupported sensor type: ${sensorType}`);
    }
  }
}

// Singleton instance
export const bleService = new BLEService();