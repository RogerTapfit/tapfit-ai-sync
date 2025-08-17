import { BleClient } from '@capacitor-community/bluetooth-le';

export interface BluetoothDiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
}

export class BluetoothDiagnostics {
  static async checkBluetoothAvailability(): Promise<BluetoothDiagnosticResult> {
    try {
      await BleClient.initialize();
      const isEnabled = await BleClient.isEnabled();
      
      return {
        success: true,
        message: `Bluetooth is ${isEnabled ? 'enabled' : 'disabled'}`,
        details: { enabled: isEnabled }
      };
    } catch (error) {
      return {
        success: false,
        message: `Bluetooth initialization failed: ${error}`,
        details: { error }
      };
    }
  }

  static async testPuckConnection(serviceUuid: string = '0000FFE0-0000-1000-8000-00805F9B34FB'): Promise<BluetoothDiagnosticResult> {
    try {
      await BleClient.initialize();
      
      const devices = await BleClient.getConnectedDevices([serviceUuid]);
      
      return {
        success: true,
        message: `Found ${devices.length} connected Puck devices`,
        details: { devices }
      };
    } catch (error) {
      return {
        success: false,
        message: `Puck connection test failed: ${error}`,
        details: { error }
      };
    }
  }

  static async runFullDiagnostic(): Promise<BluetoothDiagnosticResult[]> {
    const results: BluetoothDiagnosticResult[] = [];
    
    // Test Bluetooth availability
    results.push(await this.checkBluetoothAvailability());
    
    // Test Puck connection capability
    results.push(await this.testPuckConnection());
    
    return results;
  }
}