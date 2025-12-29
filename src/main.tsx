import { createRoot } from 'react-dom/client'
import './i18n';
import App from './App.tsx'
import './index.css'
import { setupUniversalLinkPairing } from './lib/blePair';
import { App as CapApp } from '@capacitor/app';
import { nfcPuckIntegration } from './services/nfcPuckIntegration';

// Setup Universal Link pairing system for NFC tap-to-connect
setupUniversalLinkPairing({
  onStatusUpdate: (status) => {
    console.log('BLE Status:', status);
  },
  onRepCountUpdate: (repCount) => {
    console.log('Rep Count:', repCount);
  },
  onConnectionSuccess: (puckClient) => {
    console.log('Puck connected successfully:', puckClient);
  },
  onConnectionFailed: (error) => {
    console.error('Puck connection failed:', error);
  }
});

// Enhanced NFC Deep Link Handler for Machine-Specific Auto-Connect
CapApp.addListener('appUrlOpen', ({ url }) => {
  if (!url) return;
  
  console.log('App opened with URL:', url);
  
  try {
    const urlObj = new URL(url);
    let machineId = null;
    
    // Handle different URL formats:
    // https://tapfit.health/nfc-connect?machine=squat_rack_1
    // https://tapfit.health/machine/squat_rack_1
    // https://tapfit.health/nfc
    
    if (urlObj.pathname.startsWith('/nfc-connect') || urlObj.pathname.startsWith('/nfc')) {
      machineId = urlObj.searchParams.get('machine');
    } else if (urlObj.pathname.startsWith('/machine/')) {
      machineId = urlObj.pathname.split('/machine/')[1];
    }
    
    console.log('Extracted machine ID:', machineId);
    
    // Trigger NFC-based Puck auto-connect
    if (machineId) {
      console.log('Starting NFC-triggered Puck connection for machine:', machineId);
      nfcPuckIntegration.simulateNFCTap(machineId as any);
      
      // Optional: Navigate to machine workout page
      // window.location.href = `/machine/${machineId}`;
    } else {
      // Fallback for general NFC taps without machine ID
      console.log('Starting general Puck connection');
      nfcPuckIntegration.simulateNFCTap('generic_machine' as any);
    }
    
  } catch (error) {
    console.error('Error processing deep link:', error);
    // Fallback to general connection attempt
    nfcPuckIntegration.simulateNFCTap('generic_machine' as any);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
