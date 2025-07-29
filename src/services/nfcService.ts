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
      // When NFC plugin is available, check availability
      // For now, return true on native platforms
      return Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios';
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
      // When NFC plugin is available, implement listening
      console.log('NFC listening started');
      // Placeholder for actual NFC implementation
    } catch (error) {
      console.error('Failed to start NFC listening:', error);
      throw error;
    }
  }

  public async stopNFCListening(): Promise<void> {
    try {
      // When NFC plugin is available, implement stop listening
      console.log('NFC listening stopped');
    } catch (error) {
      console.error('Failed to stop NFC listening:', error);
    }
  }

  public async writeNFCTag(machineId: MachineId): Promise<void> {
    if (!await this.isNFCAvailable()) {
      throw new Error('NFC not available on this device');
    }

    const nfcData: NFCData = {
      appId: 'app.lovable.4e37f3a98b5244369842e2cc950a194e',
      machineId,
      action: 'start_exercise'
    };

    try {
      // When NFC plugin is available, implement tag writing
      console.log('Writing NFC tag:', nfcData);
      // Placeholder for actual NFC implementation
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
}

export const nfcService = NFCService.getInstance();