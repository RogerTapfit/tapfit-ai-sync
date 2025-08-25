import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4e37f3a98b5244369842e2cc950a194e',
  appName: 'TapFit',
  webDir: 'dist',
  // server: {
  //   url: "https://tapfit-ai-sync.lovable.app?forceHideBadge=true",
  //   cleartext: true
  // },
  ios: {
    preferredContentMode: "mobile",
    orientation: "portrait",
    minVersion: "16.0",
    entitlements: {
      "com.apple.developer.associated-domains": ["applinks:tapfit-ai-sync.lovable.app"],
      "com.apple.developer.healthkit": true,
      "com.apple.developer.nfc.readersession.formats": ["NDEF", "TAG"],
      "com.apple.developer.nfc.readersession.iso7816.select-identifiers": ["*"]
    },
    backgroundModes: [
      "bluetooth-central"
    ],
    infoPlist: {
      NSBluetoothAlwaysUsageDescription: "TapFit uses Bluetooth to connect to your gym machine sensor.",
      NFCReaderUsageDescription: "TapFit uses NFC to detect and connect to compatible workout stations.",
      UIBackgroundModes: ["bluetooth-central"],
      LSApplicationQueriesSchemes: ["tapfit"]
    }
  }
};

export default config;