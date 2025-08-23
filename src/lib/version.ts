// App version configuration and utilities
export const APP_VERSION = "1.2.5";
export const BUILD_DATE = new Date().toISOString().split('T')[0];
export const BUILD_NUMBER = Math.floor(Date.now() / 1000);

export interface VersionInfo {
  version: string;
  buildDate: string;
  buildNumber: number;
  platform: 'web' | 'ios' | 'android';
}

export const getVersionInfo = (): VersionInfo => {
  // Detect platform
  const isCapacitor = !!(window as any).Capacitor;
  const isIOS = isCapacitor && (window as any).Capacitor.getPlatform() === 'ios';
  const isAndroid = isCapacitor && (window as any).Capacitor.getPlatform() === 'android';
  
  let platform: 'web' | 'ios' | 'android' = 'web';
  if (isIOS) platform = 'ios';
  else if (isAndroid) platform = 'android';

  return {
    version: APP_VERSION,
    buildDate: BUILD_DATE,
    buildNumber: BUILD_NUMBER,
    platform
  };
};

export const getVersionString = (): string => {
  const info = getVersionInfo();
  return `v${info.version} (${info.platform.toUpperCase()}) - Build ${info.buildNumber}`;
};

export const getShortVersionString = (): string => {
  const info = getVersionInfo();
  return `v${info.version}`;
};