import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupUniversalLinkPairing } from './lib/blePair';

// Setup Universal Link pairing system for NFC tap-to-connect
setupUniversalLinkPairing({
  onStatusUpdate: (status) => {
    console.log('BLE Status:', status);
    // Could dispatch to global state management if needed
  },
  onRepCountUpdate: (repCount) => {
    console.log('Rep Count:', repCount);
    // Could dispatch to global state management if needed
  },
  onConnectionSuccess: (puckClient) => {
    console.log('Puck connected successfully:', puckClient);
  },
  onConnectionFailed: (error) => {
    console.error('Puck connection failed:', error);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
