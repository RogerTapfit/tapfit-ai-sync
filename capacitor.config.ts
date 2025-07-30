import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rogertapfit.tapfit',
  appName: 'TapFit',
  webDir: 'dist',
  server: {
    url: "https://4e37f3a9-8b52-4436-9842-e2cc950a194e.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    NFC: {
      ios: {
        NFCReaderUsageDescription: "This app uses NFC to identify gym machines and start workouts automatically."
      }
    }
  }
};

export default config;