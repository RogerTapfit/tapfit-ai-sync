import { Capacitor } from '@capacitor/core';
import { PuckClient, type PuckStatus, type PuckState } from '../ble/puckClient';
import { NFCService, type NFCData, type MachineId } from './nfcService';
import { toast } from 'sonner';

export interface NFCPuckConnection {
  machineId: MachineId;
  puckClient: PuckClient | null;
  connectionStatus: PuckStatus;
  isConnecting: boolean;
}

export class NFCPuckIntegration {
  private static instance: NFCPuckIntegration;
  private nfcService: NFCService;
  private currentConnection: NFCPuckConnection | null = null;
  private connectionCallbacks: ((connection: NFCPuckConnection) => void)[] = [];
  private isListening = false;

  private constructor() {
    this.nfcService = NFCService.getInstance();
  }

  public static getInstance(): NFCPuckIntegration {
    if (!NFCPuckIntegration.instance) {
      NFCPuckIntegration.instance = new NFCPuckIntegration();
    }
    return NFCPuckIntegration.instance;
  }

  public async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('NFC-Puck integration: Running in web mode');
      return;
    }

    try {
      const nfcAvailable = await this.nfcService.isNFCAvailable();
      if (!nfcAvailable) {
        throw new Error('NFC not available on this device');
      }

      await this.startNFCListening();
      console.log('NFC-Puck integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NFC-Puck integration:', error);
      throw error;
    }
  }

  public async startNFCListening(): Promise<void> {
    if (this.isListening) return;

    try {
      await this.nfcService.startNFCListening((nfcData: NFCData & { triggerBLEConnection?: boolean }) => {
        console.log('NFC tag detected for machine:', nfcData.machineId);
        
        if (nfcData.triggerBLEConnection) {
          this.handleNFCTriggeredConnection(nfcData.machineId);
        }
      });
      
      this.isListening = true;
      console.log('NFC listening started for Puck auto-connect');
    } catch (error) {
      console.error('Failed to start NFC listening:', error);
      throw error;
    }
  }

  public async stopNFCListening(): Promise<void> {
    if (!this.isListening) return;

    try {
      await this.nfcService.stopNFCListening();
      this.isListening = false;
      console.log('NFC listening stopped');
    } catch (error) {
      console.error('Failed to stop NFC listening:', error);
    }
  }

  private async handleNFCTriggeredConnection(machineId: MachineId): Promise<void> {
    console.log('Handling NFC-triggered connection for machine:', machineId);
    
    // Update connection state
    this.currentConnection = {
      machineId,
      puckClient: null,
      connectionStatus: 'handshaking',
      isConnecting: true
    };

    this.notifyConnectionCallbacks();

    try {
      toast.info(`NFC detected for ${machineId}. Connecting to Puck...`);
      
      // Attempt automatic Puck connection
      const puckClient = await PuckClient.autoConnect(
        (status: PuckStatus) => this.handlePuckStatus(status),
        (rep: number) => this.handleRepCount(rep),
        (state: PuckState) => this.handlePuckStateUpdate(state)
      );

      if (puckClient) {
        this.currentConnection.puckClient = puckClient;
        this.currentConnection.connectionStatus = 'connected';
        this.currentConnection.isConnecting = false;
        
        toast.success(`Connected to Puck for ${machineId}!`);
        console.log('NFC-triggered Puck connection successful');
      } else {
        throw new Error('Failed to connect to Puck device');
      }
    } catch (error) {
      console.error('NFC-triggered connection failed:', error);
      
      this.currentConnection.connectionStatus = 'error';
      this.currentConnection.isConnecting = false;
      
      toast.error('Failed to connect to Puck device. Please try manual connection.');
    }

    this.notifyConnectionCallbacks();
  }

  private handlePuckStatus(status: PuckStatus): void {
    if (this.currentConnection) {
      this.currentConnection.connectionStatus = status;
      this.notifyConnectionCallbacks();
    }
  }

  private handleRepCount(rep: number): void {
    console.log('Rep count updated:', rep);
    // Additional rep handling can be added here
  }

  private handlePuckStateUpdate(state: PuckState): void {
    console.log('Puck state updated:', state);
    
    // Handle NFC-specific state changes
    if (state.nfcDetected) {
      console.log('Puck reported NFC detection');
    }
    
    if (state.autoConnectTriggered) {
      console.log('Puck reported auto-connect trigger');
    }
  }

  public async connectToPuck(
    machineId: MachineId,
    onStatus?: (status: PuckStatus) => void,
    onRep?: (rep: number) => void,
    onStateUpdate?: (state: PuckState) => void
  ): Promise<PuckClient | null> {
    console.log('Manual Puck connection for machine:', machineId);

    this.currentConnection = {
      machineId,
      puckClient: null,
      connectionStatus: 'handshaking',
      isConnecting: true
    };

    this.notifyConnectionCallbacks();

    try {
      const puckClient = await PuckClient.autoConnect(
        (status: PuckStatus) => {
          this.handlePuckStatus(status);
          onStatus?.(status);
        },
        (rep: number) => {
          this.handleRepCount(rep);
          onRep?.(rep);
        },
        (state: PuckState) => {
          this.handlePuckStateUpdate(state);
          onStateUpdate?.(state);
        }
      );

      if (puckClient) {
        this.currentConnection.puckClient = puckClient;
        this.currentConnection.connectionStatus = 'connected';
        this.currentConnection.isConnecting = false;
        
        toast.success(`Connected to Puck for ${machineId}!`);
        return puckClient;
      } else {
        throw new Error('Failed to connect');
      }
    } catch (error) {
      console.error('Manual Puck connection failed:', error);
      
      this.currentConnection.connectionStatus = 'error';
      this.currentConnection.isConnecting = false;
      
      toast.error('Failed to connect to Puck device');
      return null;
    } finally {
      this.notifyConnectionCallbacks();
    }
  }

  public async disconnectPuck(): Promise<void> {
    if (this.currentConnection?.puckClient) {
      try {
        await this.currentConnection.puckClient.disconnect();
        toast.info('Puck disconnected');
      } catch (error) {
        console.error('Error disconnecting Puck:', error);
      }
    }

    this.currentConnection = null;
    this.notifyConnectionCallbacks();
  }

  public getCurrentConnection(): NFCPuckConnection | null {
    return this.currentConnection;
  }

  public onConnectionChange(callback: (connection: NFCPuckConnection | null) => void): () => void {
    const wrappedCallback = (connection: NFCPuckConnection) => callback(connection);
    this.connectionCallbacks.push(wrappedCallback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionCallbacks.indexOf(wrappedCallback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  private notifyConnectionCallbacks(): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(this.currentConnection!);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  // Simulate NFC tap for testing
  public simulateNFCTap(machineId: MachineId): void {
    console.log('Simulating NFC tap for machine:', machineId);
    this.handleNFCTriggeredConnection(machineId);
  }

  // Write NFC tag for a machine
  public async writeNFCTag(machineId: MachineId): Promise<void> {
    try {
      await this.nfcService.writeNFCTag(machineId);
      toast.success(`NFC tag written for ${machineId}`);
    } catch (error) {
      console.error('Failed to write NFC tag:', error);
      toast.error('Failed to write NFC tag');
      throw error;
    }
  }
}

export const nfcPuckIntegration = NFCPuckIntegration.getInstance();