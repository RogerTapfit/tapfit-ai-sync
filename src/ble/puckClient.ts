import { BleClient } from '@capacitor-community/bluetooth-le';

const SERVICE = '0000FFE0-0000-1000-8000-00805F9B34FB';
const CHAR = '0000FFE1-0000-1000-8000-00805F9B34FB';

export type PuckStatus = 'handshaking' | 'connected' | 'disconnected' | 'error' | 'calibrating' | 'session_active';

// Packet types matching firmware
const PACKET_TYPE = {
  REP_COUNT: 0x01,
  STATUS: 0x02,
  HEARTBEAT: 0x03,
  BATTERY: 0x04,
  ERROR: 0xFF
};

// Commands to send to Puck
const COMMAND = {
  RESET: 0x00,
  START_SESSION: 0x01,
  END_SESSION: 0x02,
  REQUEST_STATUS: 0x03,
  CALIBRATE: 0x04
};

export interface PuckState {
  repCount: number;
  isCalibrated: boolean;
  sessionActive: boolean;
  batteryLevel: number;
  lastHeartbeat: number;
}

export class PuckClient {
  private deviceId?: string;
  private lastRep = 0;
  private state: PuckState = {
    repCount: 0,
    isCalibrated: false,
    sessionActive: false,
    batteryLevel: 1.0,
    lastHeartbeat: 0
  };

  constructor(
    private onStatus?: (s: PuckStatus) => void,
    private onRep?: (rep: number) => void,
    private onStateUpdate?: (state: PuckState) => void
  ) {}

  async handshake(autoStart = false) {
    this.onStatus?.('handshaking');
    
    try {
      await BleClient.initialize();
      const dev = await BleClient.requestDevice({
        services: [SERVICE],
        optionalServices: [SERVICE],
      });
      this.deviceId = dev.deviceId;

      await BleClient.connect(this.deviceId, () => {
        this.onStatus?.('disconnected');
        this.deviceId = undefined;
      });

      // Start listening for notifications with enhanced packet handling
      await BleClient.startNotifications(this.deviceId!, SERVICE, CHAR, (v) => {
        this.handleIncomingPacket(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
      });

      this.onStatus?.('connected');
      
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

  private handleIncomingPacket(packet: Uint8Array) {
    if (packet.length < 2) return;
    
    const packetType = packet[0];
    
    switch (packetType) {
      case PACKET_TYPE.REP_COUNT:
        if (packet.length >= 3) {
          const repCount = packet[1] | (packet[2] << 8);
          if (repCount !== this.lastRep) {
            this.lastRep = repCount;
            this.state.repCount = repCount;
            this.onRep?.(repCount);
            this.onStateUpdate?.(this.state);
          }
        }
        break;
        
      case PACKET_TYPE.STATUS:
        if (packet.length >= 4) {
          const statusFlags = packet[1];
          this.state.isCalibrated = (statusFlags & 0x01) !== 0;
          this.state.sessionActive = (statusFlags & 0x02) !== 0;
          this.state.repCount = packet[2];
          
          // Update status based on state
          if (this.state.sessionActive) {
            this.onStatus?.('session_active');
          } else if (this.state.isCalibrated) {
            this.onStatus?.('connected');
          } else {
            this.onStatus?.('calibrating');
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

  private async sendCommand(command: number) {
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
