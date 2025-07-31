import { Capacitor } from '@capacitor/core';

// NFC Plugin - Enhanced for real NFC integration
let NFC: any;

if (Capacitor.isNativePlatform()) {
  try {
    // Try to access the NFC plugin from Capacitor
    NFC = (window as any).Capacitor?.Plugins?.NFC;
    
    // If not available, try alternative access methods
    if (!NFC) {
      // Check for @capacitor-community/nfc plugin
      NFC = (window as any).CapacitorCommunityNFC;
    }
  } catch (error) {
    console.warn('NFC plugin not available:', error);
  }
}

// Enhanced fallback with more realistic simulation for development
if (!NFC) {
  NFC = {
    isSupported: () => Promise.resolve({ isSupported: Capacitor.isNativePlatform() }),
    addListener: (event: string, callback: Function) => {
      console.log(`NFC Mock: Added listener for ${event}`);
      return Promise.resolve();
    },
    removeAllListeners: () => {
      console.log('NFC Mock: Removed all listeners');
      return Promise.resolve();
    },
    write: (data: any) => {
      console.log('NFC Mock: Writing data', data);
      return Promise.resolve();
    },
    startSession: () => Promise.resolve(),
    stopSession: () => Promise.resolve()
  };
}

// Machine ID to exercise mapping
export const MACHINE_IDS = {
  'chest-press': {
    machine: 'Chest Press Machine',
    exerciseType: 'strength',
    muscleGroup: 'Chest',
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 90
  },
  'lat-pulldown': {
    machine: 'Lat Pulldown Machine',
    exerciseType: 'strength', 
    muscleGroup: 'Back',
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 90
  },
  'leg-press': {
    machine: 'Leg Press Machine',
    exerciseType: 'strength',
    muscleGroup: 'Legs',
    defaultSets: 3,
    defaultReps: 15,
    restSeconds: 120
  },
  'shoulder-press': {
    machine: 'Shoulder Press Machine',
    exerciseType: 'strength',
    muscleGroup: 'Shoulders',
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 90
  }
} as const;

export type MachineId = keyof typeof MACHINE_IDS;

export interface NFCData {
  appId: string;
  machineId: MachineId;
  action: 'start_exercise';
  triggerBLEConnection?: boolean;
}

interface NFCTagData {
  ndefMessage: Array<{
    type: string;
    payload: Uint8Array;
  }>;
}

export class NFCService {
  private static instance: NFCService;

  public static getInstance(): NFCService {
    if (!NFCService.instance) {
      NFCService.instance = new NFCService();
    }
    return NFCService.instance;
  }

  public async isNFCAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const status = await NFC.isSupported();
      return status.isSupported;
    } catch (error) {
      console.warn('NFC not available:', error);
      return false;
    }
  }

  public async startNFCListening(callback: (data: NFCData & { triggerBLEConnection?: boolean }) => void): Promise<void> {
    if (!await this.isNFCAvailable()) {
      throw new Error('NFC not available on this device');
    }

    try {
      // Start NFC session for continuous listening
      if (NFC.startSession) {
        await NFC.startSession();
      }

      await NFC.addListener('nfcTagScanned', (result: any) => {
        console.log('NFC tag scanned:', result);
        
        if (result.ndefMessage && result.ndefMessage.length > 0) {
          const record = result.ndefMessage[0];
          
          // Handle URL records
          if (record.type === 'U' && record.payload) {
            try {
              // Convert payload to string
              const payloadString = new TextDecoder().decode(new Uint8Array(record.payload));
              // Remove URL prefix byte if present
              const url = payloadString.startsWith('\u0001') ? payloadString.slice(1) : payloadString;
              
              console.log('NFC URL detected:', url);
              
              // Extract machine ID from both custom scheme and HTTP URLs
              let machineId: string | undefined;
              
              if (url.includes('tapfit://machine/')) {
                machineId = url.split('tapfit://machine/')[1]?.split('?')[0];
              } else if (url.includes('/machine/')) {
                machineId = url.split('/machine/')[1]?.split('?')[0];
              }
              
              if (machineId && this.isValidMachineId(machineId)) {
                // Enhanced callback with BLE trigger flag
                callback({
                  appId: 'app.lovable.4e37f3a98b5244369842e2cc950a194e',
                  machineId: machineId as MachineId,
                  action: 'start_exercise',
                  triggerBLEConnection: true
                });
              }
            } catch (error) {
              console.error('Error parsing NFC URL:', error);
            }
          }
        }
      });

      // Also listen for tag discovery events
      await NFC.addListener('nfcTagDiscovered', (result: any) => {
        console.log('NFC tag discovered:', result);
        // Handle tag discovery for proximity detection
      });
      
      console.log('Enhanced NFC listening started with BLE integration');
    } catch (error) {
      console.error('Failed to start NFC listening:', error);
      throw error;
    }
  }

  public async stopNFCListening(): Promise<void> {
    try {
      await NFC.removeAllListeners();
      
      // Stop NFC session if available
      if (NFC.stopSession) {
        await NFC.stopSession();
      }
      
      console.log('Enhanced NFC listening stopped');
    } catch (error) {
      console.error('Failed to stop NFC listening:', error);
    }
  }

  public async writeNFCTag(machineId: MachineId): Promise<void> {
    if (!await this.isNFCAvailable()) {
      throw new Error('NFC not available on this device');
    }

    // Use custom URL scheme for native app, HTTP URL for web fallback
    const nativeUrl = `tapfit://machine/${machineId}`;
    const webUrl = `https://4e37f3a9-8b52-4436-9842-e2cc950a194e.lovableproject.com/machine/${machineId}?forceHideBadge=true`;
    
    // For native platforms, use the custom scheme
    const targetUrl = Capacitor.isNativePlatform() ? nativeUrl : webUrl;

    try {
      await NFC.write([{
        type: 'url',
        payload: targetUrl
      }]);
      
      console.log('NFC tag written successfully:', targetUrl);
    } catch (error) {
      console.error('Failed to write NFC tag:', error);
      throw error;
    }
  }

  public getMachineDetails(machineId: MachineId) {
    return MACHINE_IDS[machineId];
  }

  public isValidMachineId(id: string): id is MachineId {
    return id in MACHINE_IDS;
  }

  // Method to simulate NFC tap for testing with BLE integration
  public simulateNFCTap(machineId: MachineId, callback: (data: NFCData) => void) {
    if (this.isValidMachineId(machineId)) {
      callback({
        appId: 'app.lovable.4e37f3a98b5244369842e2cc950a194e',
        machineId,
        action: 'start_exercise',
        triggerBLEConnection: true
      });
    }
  }

  // Get the expected Puck.js device name for a machine
  public getPuckDeviceName(machineId: MachineId): string {
    return `${machineId}-puck`;
  }

  // Get machine-specific BLE configuration
  public getMachineBLEConfig(machineId: MachineId) {
    const machineDetails = this.getMachineDetails(machineId);
    return {
      deviceName: this.getPuckDeviceName(machineId),
      expectedMovement: machineDetails.exerciseType === 'strength' ? 'repetitive' : 'continuous',
      calibrationSettings: {
        sensitivity: machineDetails.muscleGroup === 'Legs' ? 'high' : 'medium',
        restDetection: machineDetails.restSeconds
      }
    };
  }
}

export const nfcService = NFCService.getInstance();