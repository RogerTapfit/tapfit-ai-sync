import { PuckClient } from '@/ble/puckClient';

export interface NFCPuckIntegrationState {
  isConnecting: boolean;
  connectionAttempts: number;
  lastNFCDetection: Date | null;
  autoConnectEnabled: boolean;
}

export class NFCPuckIntegration {
  private puckClient: PuckClient | null = null;
  private state: NFCPuckIntegrationState = {
    isConnecting: false,
    connectionAttempts: 0,
    lastNFCDetection: null,
    autoConnectEnabled: true
  };
  
  private onStateChange?: (state: NFCPuckIntegrationState) => void;
  private onConnectionSuccess?: (puckClient: PuckClient) => void;
  private onConnectionFailed?: (error: string) => void;

  constructor(
    onStateChange?: (state: NFCPuckIntegrationState) => void,
    onConnectionSuccess?: (puckClient: PuckClient) => void,
    onConnectionFailed?: (error: string) => void
  ) {
    this.onStateChange = onStateChange;
    this.onConnectionSuccess = onConnectionSuccess;
    this.onConnectionFailed = onConnectionFailed;
  }

  public getState(): NFCPuckIntegrationState {
    return { ...this.state };
  }

  public setAutoConnect(enabled: boolean): void {
    this.state.autoConnectEnabled = enabled;
    this.notifyStateChange();
  }

  public async handleNFCDetection(): Promise<void> {
    console.log('NFC detection triggered - attempting Puck auto-connect');
    
    this.state.lastNFCDetection = new Date();
    
    if (!this.state.autoConnectEnabled) {
      console.log('Auto-connect disabled, skipping connection attempt');
      this.notifyStateChange();
      return;
    }

    if (this.state.isConnecting) {
      console.log('Already connecting, skipping duplicate attempt');
      return;
    }

    await this.attemptConnection();
  }

  private async attemptConnection(): Promise<void> {
    this.state.isConnecting = true;
    this.state.connectionAttempts++;
    this.notifyStateChange();

    try {
      console.log(`Puck connection attempt ${this.state.connectionAttempts}`);
      
      // Create new PuckClient instance
      this.puckClient = new PuckClient(
        (status) => console.log('Puck status:', status),
        (repCount) => console.log('Puck rep count:', repCount),
        (puckState) => {
          console.log('Puck state update:', puckState);
          // Handle NFC acknowledgment
          if (puckState.nfcDetected) {
            this.sendNFCAcknowledgment();
          }
        }
      );

      // Attempt handshake with timeout
      await Promise.race([
        this.puckClient.handshake(),
        this.createTimeout(10000, 'Connection timeout')
      ]);

      console.log('Puck connection successful');
      this.state.isConnecting = false;
      this.notifyStateChange();
      
      if (this.onConnectionSuccess) {
        this.onConnectionSuccess(this.puckClient);
      }

    } catch (error) {
      console.error('Puck connection failed:', error);
      this.state.isConnecting = false;
      this.notifyStateChange();
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      if (this.onConnectionFailed) {
        this.onConnectionFailed(errorMessage);
      }

      // Retry logic for certain errors
      if (this.state.connectionAttempts < 3 && this.shouldRetry(errorMessage)) {
        console.log('Retrying connection in 2 seconds...');
        setTimeout(() => this.attemptConnection(), 2000);
      }
    }
  }

  private async sendNFCAcknowledgment(): Promise<void> {
    if (this.puckClient) {
      try {
        await this.puckClient.sendCommand(0x06); // NFC_ACK command
        console.log('Sent NFC acknowledgment to Puck');
      } catch (error) {
        console.error('Failed to send NFC acknowledgment:', error);
      }
    }
  }

  private createTimeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  private shouldRetry(errorMessage: string): boolean {
    const retryableErrors = [
      'timeout',
      'device not found',
      'connection failed',
      'gatt server disconnected'
    ];
    
    return retryableErrors.some(error => 
      errorMessage.toLowerCase().includes(error)
    );
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  public disconnect(): void {
    if (this.puckClient) {
      this.puckClient.disconnect();
      this.puckClient = null;
    }
    
    this.state.isConnecting = false;
    this.notifyStateChange();
  }

  public reset(): void {
    this.disconnect();
    this.state.connectionAttempts = 0;
    this.state.lastNFCDetection = null;
    this.notifyStateChange();
  }
}

// Global instance for the app
export const nfcPuckIntegration = new NFCPuckIntegration();