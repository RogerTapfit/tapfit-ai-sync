import { Capacitor } from '@capacitor/core';

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

// NFC types for development
interface TagEvent {
  nfcTag: {
    ndefMessage: Array<{
      type: string;
      payload: Uint8Array;
    }>;
  };
}

interface NFCPlugin {
  isSupported(): Promise<{ isSupported: boolean }>;
  addListener(eventName: string, callback: (event: TagEvent) => void): Promise<void>;
  removeAllListeners(): Promise<void>;
  write(options: { ndefMessage: any[] }): Promise<void>;
}

// Mock NFC for development - will be replaced with real plugin in production
const MockNFC: NFCPlugin = {
  isSupported: async () => ({ isSupported: Capacitor.isNativePlatform() }),
  addListener: async () => {
    console.log('Mock NFC listener added');
  },
  removeAllListeners: async () => {
    console.log('Mock NFC listeners removed');
  },
  write: async () => {
    console.log('Mock NFC tag written');
  }
};

export class NFCService {
  private static instance: NFCService;
  private nfc: NFCPlugin = MockNFC;

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
      const isSupported = await this.nfc.isSupported();
      return isSupported.isSupported;
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
      await this.nfc.addListener('nfcTagScanned', (event: TagEvent) => {
        const tag = event.nfcTag;
        const ndefMessage = tag.ndefMessage;
        
        if (ndefMessage && ndefMessage.length > 0) {
          const record = ndefMessage[0];
          if (record.type === 'U') { // URL record
            const url = new TextDecoder().decode(record.payload.slice(1)); // Skip URL prefix byte
            const urlObj = new URL(url);
            const machineId = urlObj.pathname.split('/').pop();
            
            if (this.isValidMachineId(machineId!)) {
              callback({
                appId: 'app.lovable.4e37f3a98b5244369842e2cc950a194e',
                machineId: machineId as MachineId,
                action: 'start_exercise'
              });
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
      await this.nfc.removeAllListeners();
      console.log('NFC listening stopped');
    } catch (error) {
      console.error('Failed to stop NFC listening:', error);
    }
  }

  public async writeNFCTag(machineId: MachineId): Promise<void> {
    if (!await this.isNFCAvailable()) {
      throw new Error('NFC not available on this device');
    }

    const deepLinkUrl = `tapfit://machine/${machineId}`;

    try {
      const ndefRecord = {
        type: 'U', // URL record type
        payload: new TextEncoder().encode(`\x01${deepLinkUrl}`) // 0x01 prefix for http://
      };

      await this.nfc.write({
        ndefMessage: [ndefRecord]
      });
      
      console.log('NFC tag written successfully:', deepLinkUrl);
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