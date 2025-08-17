import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4e37f3a98b5244369842e2cc950a194e',
  appName: 'tapfit-ai-sync',
  webDir: 'dist',
  version: '1.3.0',
  bundledWebRuntime: false,
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
    },
    BluetoothLe: {
      displayStrings: {
        scanning: "Looking for Bluetooth devices...",
        cancel: "Cancel",
        availableDevices: "Available devices",
        noDeviceFound: "No Bluetooth devices found"
      }
    }
  },
  ios: {
    preferredContentMode: "mobile",
    orientation: "portrait",
    minVersion: "16.0",
    buildScheme: "App",
    cordovaSwiftVersion: "5.0",
    allowMixedContent: true,
    entitlements: {
      "com.apple.developer.associated-domains": ["applinks:tapfit-ai-sync.lovable.app"],
      "com.apple.developer.healthkit": true,
      "com.apple.developer.healthkit.access": [],
      "com.apple.developer.nfc.readersession.formats": ["NDEF", "TAG"]
    },
    infoPlist: {
      // Health & Fitness
      NSHealthShareUsageDescription: "TapFit requires access to your health data to track workout metrics, heart rate, and fitness progress during training sessions.",
      NSHealthUpdateUsageDescription: "TapFit writes workout data and health metrics to HealthKit to maintain your comprehensive fitness record.",
      NSHealthClinicalHealthRecordsShareUsageDescription: "TapFit may access clinical health records to provide personalized fitness recommendations.",
      
      // Camera & Photos
      NSCameraUsageDescription: "TapFit uses the camera to analyze food for nutrition tracking and body scanning for fitness assessments.",
      NSPhotoLibraryUsageDescription: "TapFit accesses your photo library to select food images for nutrition analysis and save fitness progress photos.",
      NSPhotoLibraryAddUsageDescription: "TapFit saves workout photos and progress images to your photo library.",
      
      // Bluetooth & Connectivity
      NSBluetoothAlwaysUsageDescription: "TapFit uses Bluetooth to connect to fitness sensors, heart rate monitors, and workout equipment for real-time data tracking.",
      NSBluetoothPeripheralUsageDescription: "TapFit connects to Bluetooth fitness devices to enhance your workout experience with real-time metrics.",
      
      // NFC
      NFCReaderUsageDescription: "TapFit uses NFC to detect and connect to compatible workout stations and fitness equipment.",
      
      // Location (for outdoor workouts)
      NSLocationWhenInUseUsageDescription: "TapFit uses location services to track outdoor workouts and provide location-based fitness recommendations.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "TapFit uses location services to track outdoor workouts and provide location-based fitness recommendations.",
      
      // Motion & Activity
      NSMotionUsageDescription: "TapFit accesses motion and fitness activity data to track your workouts and daily activity levels.",
      NSFallDetectionUsageDescription: "TapFit monitors for falls during intense workouts to ensure your safety.",
      
      // Microphone (for voice commands)
      NSMicrophoneUsageDescription: "TapFit uses the microphone for voice commands during hands-free workouts and audio-guided training sessions.",
      
      // Contacts (for social features)
      NSContactsUsageDescription: "TapFit accesses your contacts to help you connect with workout partners and share fitness achievements.",
      
      // Notifications
      NSUserNotificationsUsageDescription: "TapFit sends notifications for workout reminders, achievement alerts, and health insights.",
      
      // Background modes and capabilities
      UIBackgroundModes: [
        "bluetooth-central",
        "bluetooth-peripheral", 
        "background-processing",
        "background-fetch",
        "location"
      ],
      
      // App Transport Security
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
        NSAllowsLocalNetworking: true,
        NSExceptionDomains: {
          "lovableproject.com": {
            NSExceptionAllowsInsecureHTTPLoads: true,
            NSExceptionMinimumTLSVersion: "TLSv1.0",
            NSIncludesSubdomains: true
          }
        }
      },
      
      // Scene configuration for modern iOS
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
      
      // Supported interface orientations
      UISupportedInterfaceOrientations: [
        "UIInterfaceOrientationPortrait"
      ],
      UISupportedInterfaceOrientationsIPhone: [
        "UIInterfaceOrientationPortrait"
      ],
      
      // Launch screen
      UILaunchStoryboardName: "LaunchScreen",
      
      // Status bar
      UIStatusBarStyle: "UIStatusBarStyleDarkContent",
      UIViewControllerBasedStatusBarAppearance: true,
      
      // Required device capabilities
      UIRequiredDeviceCapabilities: [
        "armv7",
        "bluetooth-le",
        "healthkit"
      ],
      
      // Privacy tracking
      NSUserTrackingUsageDescription: "TapFit uses tracking to provide personalized fitness recommendations and improve your workout experience.",
      
      // App category
      LSApplicationCategoryType: "public.app-category.healthcare-fitness"
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