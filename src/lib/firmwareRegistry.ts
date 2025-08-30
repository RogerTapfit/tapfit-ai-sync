import { APP_VERSION, BUILD_NUMBER } from './version';

export interface FirmwareInfo {
  version: string;
  appVersion: string;
  buildNumber: number;
  filename: string;
  title: string;
  description: string;
  compatibility: 'stable' | 'beta' | 'experimental';
  features: string[];
  isRecommended?: boolean;
}

// Firmware registry that maps app versions to firmware versions
export const FIRMWARE_REGISTRY: FirmwareInfo[] = [
  {
    version: "9.1",
    appVersion: "1.2.7",
    buildNumber: 1735132800,
    filename: "puck_v8.2_app_1.2.7.js",
    title: "TapFit Puck v9.1 - Ultra Minimal",
    description: "Ultra-minimal firmware optimized for memory and app compatibility (87 lines)",
    compatibility: "stable",
    features: [
      "Memory optimized (87 lines)",
      "Fast 1-second calibration",
      "Correct BLE protocol",
      "No LED lockups",
      "Robust error handling",
      "26Hz accelerometer sampling"
    ],
    isRecommended: true
  },
  {
    version: "8.2",
    appVersion: "1.2.5",
    buildNumber: BUILD_NUMBER - 1,
    filename: "puck_espruino_compatible.js", 
    title: "TapFit Puck v8.2 - Legacy",
    description: "Previous firmware (may have memory issues on some devices)",
    compatibility: "stable",
    features: [
      "26Hz accelerometer sampling",
      "Enhanced NFC detection",
      "Improved BLE stability", 
      "Battery monitoring",
      "Auto-calibration",
      "Error recovery"
    ]
  },
  {
    version: "8.1",
    appVersion: "1.2.4",
    buildNumber: Math.floor(Date.now() / 1000) - 86400, // Previous build
    filename: "puck_espruino_compatible.js",
    title: "TapFit Puck v8.1",
    description: "Stable firmware with robust motion detection",
    compatibility: "stable",
    features: [
      "Motion detection",
      "NFC support",
      "BLE communication",
      "Battery status"
    ]
  },
  {
    version: "8.0",
    appVersion: "1.2.3",
    buildNumber: Math.floor(Date.now() / 1000) - 172800, // Two builds ago
    filename: "puck_tapfit_working.js",
    title: "TapFit Puck v8.0",
    description: "Working version with core functionality",
    compatibility: "stable",
    features: [
      "Basic rep counting",
      "BLE connectivity",
      "Session management"
    ]
  },
  {
    version: "7.0",
    appVersion: "1.2.2",
    buildNumber: Math.floor(Date.now() / 1000) - 259200, // Three builds ago
    filename: "puck_tapfit_optimized.js",
    title: "TapFit Puck v7.0",
    description: "Optimized performance version",
    compatibility: "stable",
    features: [
      "Performance optimizations",
      "Reduced power consumption",
      "Stable BLE"
    ]
  }
];

export class FirmwareManager {
  static getCurrentFirmware(): FirmwareInfo {
    // Return firmware that matches current app version
    const current = FIRMWARE_REGISTRY.find(fw => fw.appVersion === APP_VERSION);
    return current || FIRMWARE_REGISTRY[0];
  }

  static getRecommendedFirmware(): FirmwareInfo {
    return FIRMWARE_REGISTRY.find(fw => fw.isRecommended) || FIRMWARE_REGISTRY[0];
  }

  static getAllFirmware(): FirmwareInfo[] {
    return FIRMWARE_REGISTRY.sort((a, b) => b.buildNumber - a.buildNumber);
  }

  static getFirmwareByVersion(version: string): FirmwareInfo | undefined {
    return FIRMWARE_REGISTRY.find(fw => fw.version === version);
  }

  static isLatestFirmware(version: string): boolean {
    const current = this.getCurrentFirmware();
    return version === current.version;
  }

  static async getFirmwareContent(filename: string): Promise<string> {
    // Try to load from manifest first for version-specific files
    try {
      const manifestResponse = await fetch('/firmware/manifest.json');
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        const version = manifest.versions.find((v: any) => v.filename === filename);
        if (version) {
          const firmwareResponse = await fetch(`/firmware/${filename}`);
          if (firmwareResponse.ok) {
            return await firmwareResponse.text();
          }
        }
      }
    } catch (error) {
      console.log('Loading from manifest failed, trying static imports...');
    }

    // Fallback to static imports for legacy files
    const firmwareMap: Record<string, () => Promise<{ default: string }>> = {
      'puck_espruino_compatible.js': () => import('../../firmware/puck_espruino_compatible.js?raw'),
      'puck_tapfit_working.js': () => import('../../firmware/puck_tapfit_working.js?raw'),
      'puck_tapfit_optimized.js': () => import('../../firmware/puck_tapfit_optimized.js?raw'),
    };

    const loader = firmwareMap[filename];
    if (!loader) {
      return Promise.reject(new Error(`Firmware file ${filename} not found`));
    }

    return loader().then(module => module.default);
  }

  static generateFirmwareForCurrentApp(): FirmwareInfo {
    // Auto-increment firmware version based on app version
    const baseVersion = parseFloat(FIRMWARE_REGISTRY[0].version);
    const newVersion = (baseVersion + 0.1).toFixed(1);
    
    return {
      version: newVersion,
      appVersion: APP_VERSION,
      buildNumber: BUILD_NUMBER,
      filename: "puck_espruino_compatible.js",
      title: `TapFit Puck v${newVersion} - Auto-generated`,
      description: `Auto-generated firmware for app v${APP_VERSION}`,
      compatibility: "stable",
      features: [
        "Latest app compatibility",
        "Enhanced performance",
        "Auto-generated for current build"
      ],
      isRecommended: true
    };
  }
}