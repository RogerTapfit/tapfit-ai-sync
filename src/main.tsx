import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { App as CapacitorApp } from '@capacitor/app';
import { startBLEPair } from './pairing/blePairer';

// Handle Universal Links for NFC → BLE pairing
CapacitorApp.addListener('appUrlOpen', ({ url }) => {
  try {
    const u = new URL(url);
    if (u.pathname === '/pair') {
      const station = u.searchParams.get('station') || '';
      if (station) {
        console.log('Starting BLE pair for station:', station);
        startBLEPair(station);
      }
    }
  } catch (e) {
    console.error('Error handling app URL open:', e);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
