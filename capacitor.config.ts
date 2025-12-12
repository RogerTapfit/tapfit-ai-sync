import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rogertapfit.tapfit',
  appName: 'TapFit',
  webDir: 'dist',
  // server: {
  //   url: "https://tapfit.info?forceHideBadge=true",
  //   cleartext: true
  // },
  ios: {
    preferredContentMode: "mobile",
    orientation: "portrait",
    minVersion: "16.0",
    entitlements: {
      "com.apple.developer.associated-domains": ["applinks:tapfit.info"],
      "com.apple.developer.healthkit": true,
      "com.apple.developer.nfc.readersession.formats": ["NDEF", "TAG"],
      "com.apple.developer.nfc.readersession.iso7816.select-identifiers": ["*"]
    },
    backgroundModes: [
      "bluetooth-central",
      "location"
    ],
    infoPlist: {
      NSBluetoothAlwaysUsageDescription: "TapFit uses Bluetooth to connect to your gym machine sensor.",
      NFCReaderUsageDescription: "TapFit uses NFC to detect and connect to compatible workout stations.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "TapFit needs continuous access to your location to accurately track your runs with GPS, even when the app is in the background.",
      NSLocationWhenInUseUsageDescription: "TapFit uses your location to track your runs with GPS and find nearby gyms.",
      UIBackgroundModes: ["bluetooth-central", "location"],
      LSApplicationQueriesSchemes: ["tapfit"]
    }
  }
};

export default config;