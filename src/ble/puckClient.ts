import { BleClient } from '@capacitor-community/bluetooth-le';

const SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const CHAR = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

export type PuckStatus = 'handshaking' | 'connected' | 'disconnected' | 'error' | 'calibrating' | 'session_active' | 'nfc_detected' | 'auto_connect_signal' | 'nfc_connected';

export const PACKET_TYPE = {
  REP_COUNT: 0,      // matches firmware type 0 = reps
  HANDSHAKE: 1,      // matches firmware type 1 = handshake  
  STATUS: 2,         // matches firmware type 2 = status
  HEARTBEAT: 0x03,
  BATTERY: 0x04,
  ERROR: 0xFF,
  NFC_DETECTED: 0x06,
  AUTO_CONNECT: 0x07,
  NFC_ACK: 0x08
} as const;

// Commands to send to Puck
const COMMAND = {
  RESET: 0x00,
  START_SESSION: 0x01,
  END_SESSION: 0x02,
  REQUEST_STATUS: 0x03,
  CALIBRATE: 0x04,
  NFC_ACK: 0x06
};

export interface PuckState {
  repCount: number;
  isCalibrated: boolean;
  sessionActive: boolean;
  batteryLevel: number;
  lastHeartbeat: number;
  nfcDetected: boolean;
  autoConnectTriggered: boolean;
}

export class PuckClient {
  private deviceId?: string;
  private lastRep = 0;
  private state: PuckState = {
    repCount: 0,
    isCalibrated: false,
    sessionActive: false,
    batteryLevel: 1.0,
    lastHeartbeat: 0,
    nfcDetected: false,
    autoConnectTriggered: false
  };

  constructor(
    private onStatus?: (s: PuckStatus) => void,
    public onRep?: (rep: number) => void,
    public onStateUpdate?: (state: PuckState) => void
  ) {}

  async handshake(autoStart = false) {
    this.onStatus?.('handshaking');
    
    try {
      await BleClient.initialize();
      
      // Use automatic scanning instead of requestDevice
      const connected = await this.scanAndConnect();
      if (!connected) {
        throw new Error('Failed to find and connect to Puck device');
      }

      // Start listening for notifications with enhanced packet handling
      await BleClient.startNotifications(this.deviceId!, SERVICE, CHAR, (v) => {
        this.handleIncomingPacket(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
      });

      this.onStatus?.('connected');
      
      // Send NFC acknowledgment if this was triggered by NFC
      await this.sendCommand(COMMAND.NFC_ACK);
      
      // Request initial status
      await this.requestStatus();
      
      if (autoStart) {
        await this.startSession();
      }
      
    } catch (error) {
      console.error('Handshake failed:', error);
      this.onStatus?.('error');
      throw error;
    }
  }

  private async scanAndConnect(timeoutMs = 15000): Promise<boolean> {
    return new Promise(async (resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('Scan timeout reached, no TapFit device found');
          resolve(false);
        }
      }, timeoutMs);

      try {
        console.log('Starting BLE scan for TapFit devices...');
        await BleClient.requestLEScan({ 
          services: [SERVICE], 
          allowDuplicates: false 
        }, async (result) => {
          if (resolved) return;
          
          const { device } = result;
          if (!device?.deviceId) return;
          
          console.log('Found BLE device:', device.name, device.deviceId);
          
          // Filter for TapFit Puck devices with more specific matching
          if (device.name === 'TapFit' || device.name?.includes('TapFit-Puck')) {
            resolved = true;
            clearTimeout(timeout);
            
            try {
              await BleClient.stopLEScan();
              this.deviceId = device.deviceId;
              
              console.log('Attempting to connect to device:', device.name);
              await BleClient.connect(this.deviceId, () => {
                console.log('Puck disconnected');
                this.onStatus?.('disconnected');
                this.deviceId = undefined;
              });
              
              console.log('Successfully connected to Puck:', device.name, device.deviceId);
              resolve(true);
            } catch (error) {
              console.error('Connection failed:', error);
              resolve(false);
            }
          }
        });
      } catch (error) {
        console.error('BLE scan failed:', error);
        clearTimeout(timeout);
        resolved = true;
        resolve(false);
      }
    });
  }

  // Static method for auto-connect from NFC
  static async autoConnect(
    onStatus?: (s: PuckStatus) => void,
    onRep?: (rep: number) => void,
    onStateUpdate?: (state: PuckState) => void
  ): Promise<PuckClient | null> {
    try {
      const client = new PuckClient(onStatus, onRep, onStateUpdate);
      await client.handshake(true);
      return client;
    } catch (error) {
      console.error('Auto-connect failed:', error);
      return null;
    }
  }

  private handleIncomingPacket(packet: Uint8Array) {
    if (packet.length < 1) return;
    
    const packetType = packet[0];
    console.log('Received packet type:', packetType, 'data:', Array.from(packet));
    
    switch (packetType) {
      case PACKET_TYPE.REP_COUNT: // type 0 from firmware
        if (packet.length >= 2) {
          const repCount = packet[1];
          if (repCount !== this.lastRep) {
            console.log('Rep count updated to:', repCount);
            this.lastRep = repCount;
            this.state.repCount = repCount;
            this.onRep?.(repCount);
            this.onStateUpdate?.(this.state);
          }
        }
        break;
        
      case PACKET_TYPE.HANDSHAKE: // type 1 from firmware
        if (packet.length >= 2) {
          const currentReps = packet[1];
          console.log('Handshake received with rep count:', currentReps);
          this.state.repCount = currentReps;
          this.state.isCalibrated = true;
          this.onStatus?.('connected');
          this.onStateUpdate?.(this.state);
        }
        break;
        
      case PACKET_TYPE.STATUS: // type 2 from firmware
        if (packet.length >= 2) {
          const statusCode = packet[1];
          console.log('Status update received:', statusCode);
          
          if (statusCode === 1) {
            // Session started
            this.state.sessionActive = true;
            this.onStatus?.('session_active');
          } else if (statusCode === 0) {
            // Session ended
            this.state.sessionActive = false;
            this.onStatus?.('connected');
          }
          
          this.onStateUpdate?.(this.state);
        }
        break;
        
      case PACKET_TYPE.HEARTBEAT:
        if (packet.length >= 2) {
          this.state.batteryLevel = packet[1] / 100;
          this.state.lastHeartbeat = Date.now();
          this.onStateUpdate?.(this.state);
        }
        break;
        
      case PACKET_TYPE.ERROR:
        console.error('Puck device error received');
        this.onStatus?.('error');
        break;
        
      case PACKET_TYPE.NFC_DETECTED:
        console.log('NFC detection received from Puck');
        this.state.nfcDetected = true;
        this.onStateUpdate?.(this.state);
        break;
        
      case PACKET_TYPE.AUTO_CONNECT:
        console.log('Auto-connect signal received from Puck');
        this.state.autoConnectTriggered = true;
        this.onStateUpdate?.(this.state);
        break;
        
      case PACKET_TYPE.NFC_ACK:
        console.log('NFC acknowledgment received from Puck');
        this.state.nfcDetected = false;
        this.onStateUpdate?.(this.state);
        break;
    }
  }

  async reset() {
    if (!this.deviceId) return;
    this.lastRep = 0;
    this.state.repCount = 0;
    await this.sendCommand(COMMAND.RESET);
  }

  async startSession() {
    if (!this.deviceId) return;
    await this.sendCommand(COMMAND.START_SESSION);
  }

  async endSession() {
    if (!this.deviceId) return;
    await this.sendCommand(COMMAND.END_SESSION);
  }

  async requestStatus() {
    if (!this.deviceId) return;
    await this.sendCommand(COMMAND.REQUEST_STATUS);
  }

  async calibrate() {
    if (!this.deviceId) return;
    this.onStatus?.('calibrating');
    await this.sendCommand(COMMAND.CALIBRATE);
  }

  public async sendCommand(command: number) {
    if (!this.deviceId) return;
    
    const bytes = new Uint8Array([command]);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    
    try {
      await BleClient.write(this.deviceId, SERVICE, CHAR, view);
    } catch (error) {
      console.error('Command send failed:', error);
      this.onStatus?.('error');
    }
  }

  getState(): PuckState {
    return { ...this.state };
  }

  async disconnect() {
    if (!this.deviceId) return;
    
    try {
      // End session before disconnecting
      await this.endSession();
      await BleClient.stopNotifications(this.deviceId, SERVICE, CHAR);
      await BleClient.disconnect(this.deviceId);
    } catch (error) {
      console.warn('Disconnect cleanup failed:', error);
    } finally {
      this.deviceId = undefined;
      this.onStatus?.('disconnected');
    }
  }
}
