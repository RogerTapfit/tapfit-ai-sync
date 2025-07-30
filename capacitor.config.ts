import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rogertapfit.tapfit',
  appName: 'TapFit',
  webDir: 'dist',
  server: {
    url: 'https://4e37f3a9-8b52-4436-9842-e2cc950a194e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: "Scanning for Puck.js devices...",
        cancel: "Cancel",
        availableDevices: "Available devices",
        noDeviceFound: "No device found"
      }
    },
    Haptics: {
      impact: true,
      notification: true,
      selection: true
    },
    NFC: {
      enabled: true,
      scanOnAppStart: true,
      scanInstructions: "Hold your device near an NFC tag to access gym equipment"
    }
  },
  android: {
    scheme: 'tapfit',
    intentFilters: [
      {
        action: 'android.intent.action.VIEW',
        category: 'android.intent.category.DEFAULT',
        data: [
          {
            scheme: 'tapfit'
          }
        ]
      }
    ]
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'tapfit',
    customUrlScheme: 'tapfit',
    associatedDomains: ['applinks:tapfit'],
    infoPlist: {
      NFCReaderUsageDescription: 'This app uses NFC to identify gym equipment for seamless workout tracking.'
    }
  }
};

export default config;