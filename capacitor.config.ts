import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4e37f3a98b5244369842e2cc950a194e',
  appName: 'TapFitApp',
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
    },
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
    }
  },
  ios: {
    scheme: "tapfit",
    preferredContentMode: "mobile",
    orientation: "portrait"
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