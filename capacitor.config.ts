import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tapfit.app',
  appName: 'TapFitApp',
  webDir: 'dist',
  server: {
    url: "https://4e37f3a9-8b52-4436-9842-e2cc950a194e.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    Camera: {
      ios: {
        NSCameraUsageDescription: "This app uses the camera to analyze food for nutrition tracking.",
        NSPhotoLibraryUsageDescription: "This app needs access to photo library to select food images for analysis."
      },
      android: {
        permissions: [
          "android.permission.CAMERA",
          "android.permission.READ_EXTERNAL_STORAGE",
          "android.permission.WRITE_EXTERNAL_STORAGE"
        ]
      }
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK'
    }
  },
  ios: {
    scheme: "tapfit",
    preferredContentMode: "mobile",
    orientation: "portrait",
    entitlements: {
      "com.apple.developer.associated-domains": ["applinks:tapfit-ai-sync.lovable.app"]
    },
    infoPlist: {
      NSHealthShareUsageDescription: "This app uses HealthKit to display your heart rate, blood oxygen, and activity data during workouts.",
      NSHealthUpdateUsageDescription: "This app may write workout data to HealthKit.",
      NSBluetoothAlwaysUsageDescription: "TapFit uses Bluetooth to connect to workout sensors.",
      NSBluetoothPeripheralUsageDescription: "TapFit uses Bluetooth to connect to workout sensors.",
      NFCReaderUsageDescription: "TapFit uses NFC to detect workout stations.",
      UIApplicationSceneManifest: {
        UIApplicationSupportsMultipleScenes: false,
        UISceneConfigurations: {
          UIWindowSceneSessionRoleApplication: [
            {
              UISceneConfigurationName: "Default Configuration",
              UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate",
              UISceneClassName: "UIWindowScene",
            },
          ],
        },
      },
    }
  },
  android: {
    orientation: "portrait"
  },
  deepLinks: [
    {
      protocol: "tapfit",
      hostname: "*"
    }
  ]
};

export default config;