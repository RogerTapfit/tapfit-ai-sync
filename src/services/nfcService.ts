import { Capacitor } from '@capacitor/core';

// NFC Plugin - will be available when @capacitor-community/nfc is installed
let NFC: any;

if (Capacitor.isNativePlatform()) {
  try {
    // Import the plugin dynamically when on native platform
    NFC = (window as any).Capacitor?.Plugins?.NFC;
  } catch (error) {
    console.warn('NFC plugin not available');
  }
}

// Fallback for web/development
if (!NFC) {
  NFC = {
    isSupported: () => Promise.resolve({ isSupported: false }),
    addListener: () => Promise.resolve(),
    removeAllListeners: () => Promise.resolve(),
    write: () => Promise.resolve()
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

  public async startNFCListening(callback: (data: NFCData) => void): Promise<void> {
    if (!await this.isNFCAvailable()) {
      throw new Error('NFC not available on this device');
    }

    try {
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
              
              // Extract machine ID from universal URL
              if (url.includes('/machine/')) {
                const machineId = url.split('/machine/')[1]?.split('?')[0];
                
                if (this.isValidMachineId(machineId)) {
                  callback({
                    appId: 'app.lovable.4e37f3a98b5244369842e2cc950a194e',
                    machineId: machineId as MachineId,
                    action: 'start_exercise'
                  });
                }
              }
            } catch (error) {
              console.error('Error parsing NFC URL:', error);
            }
          }
        }
      });
      
      console.log('NFC listening started');
    } catch (error) {
      console.error('Failed to start NFC listening:', error);
      throw error;
    }
  }

  public async stopNFCListening(): Promise<void> {
    try {
      await NFC.removeAllListeners();
      console.log('NFC listening stopped');
    } catch (error) {
      console.error('Failed to stop NFC listening:', error);
    }
  }

  public async writeNFCTag(machineId: MachineId): Promise<void> {
    if (!await this.isNFCAvailable()) {
      throw new Error('NFC not available on this device');
    }

    const universalUrl = `https://4e37f3a9-8b52-4436-9842-e2cc950a194e.lovableproject.com/machine/${machineId}?forceHideBadge=true`;

    try {
      await NFC.write([{
        type: 'url',
        payload: universalUrl
      }]);
      
      console.log('NFC tag written successfully:', universalUrl);
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

  // Method to simulate NFC tap for testing
  public simulateNFCTap(machineId: MachineId, callback: (data: NFCData) => void) {
    if (this.isValidMachineId(machineId)) {
      callback({
        appId: 'app.lovable.4e37f3a98b5244369842e2cc950a194e',
        machineId,
        action: 'start_exercise'
      });
    }
  }
}

export const nfcService = NFCService.getInstance();