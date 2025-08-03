import { useState, useEffect } from 'react';
import { healthKitService, HealthMetrics, HealthAlert } from '@/services/healthKitService';
import { useToast } from './use-toast';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const useHealthKit = () => {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{ heartRate: number; timestamp: Date } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check availability on mount
    const status = healthKitService.getAvailabilityStatus();
    setIsAvailable(status.isAvailable);
    setHasPermissions(status.hasPermissions);
  }, []);

  // Request HealthKit permissions
  const requestPermissions = async () => {
    try {
      const granted = await healthKitService.requestPermissions();
      setHasPermissions(granted);
      
      if (granted) {
        toast({
          title: "HealthKit Connected! 🏥",
          description: "Apple Watch health data is now available during workouts.",
        });
      } else {
        toast({
          title: "HealthKit Permission Denied",
          description: "Health monitoring features will be limited.",
          variant: "destructive"
        });
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting HealthKit permissions:', error);
      toast({
        title: "HealthKit Error",
        description: "Failed to connect to HealthKit. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Start health monitoring
  const startMonitoring = async () => {
    if (!hasPermissions) {
      const granted = await requestPermissions();
      if (!granted) return false;
    }

    try {
      const started = await healthKitService.startMonitoring();
      setIsMonitoring(started);
      
      if (started) {
        toast({
          title: "Health Monitoring Started 📱",
          description: "Real-time health data from Apple Watch is now active.",
        });
      }
      
      return started;
    } catch (error) {
      console.error('Error starting health monitoring:', error);
      toast({
        title: "Monitoring Error",
        description: "Failed to start health monitoring.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Stop health monitoring
  const stopMonitoring = () => {
    healthKitService.stopMonitoring();
    setIsMonitoring(false);
    setAlerts([]); // Clear alerts when stopping
    
    toast({
      title: "Health Monitoring Stopped",
      description: "Real-time health monitoring has been disabled.",
    });
  };

  // Handle health alerts
  const handleHealthAlert = async (alert: HealthAlert) => {
    setAlerts(prev => {
      // Only keep the last 3 alerts
      const newAlerts = [alert, ...prev.slice(0, 2)];
      return newAlerts;
    });

    // Trigger haptic feedback for alerts
    try {
      if (alert.type === 'critical') {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
    } catch (error) {
      // Haptics might not be available
      console.log('Haptics not available');
    }

    // Show toast notification
    toast({
      title: `Health Alert: ${alert.metric}`,
      description: alert.message,
      variant: alert.type === 'critical' ? "destructive" : "default",
    });
  };

  // Set up listeners
  useEffect(() => {
    const unsubscribeMetrics = healthKitService.onHealthDataUpdate(setHealthMetrics);
    const unsubscribeAlerts = healthKitService.onHealthAlert(handleHealthAlert);

    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
    };
  }, []);

  // Clear a specific alert
  const clearAlert = (index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all alerts
  const clearAllAlerts = () => {
    setAlerts([]);
  };

  // Get health status color
  const getHealthStatusColor = (metric: keyof HealthMetrics, value?: number): string => {
    if (value === undefined) return 'text-muted-foreground';

    switch (metric) {
      case 'bloodOxygen':
        if (value < 90) return 'text-red-500';
        if (value < 95) return 'text-yellow-500';
        return 'text-green-500';
      
      case 'heartRate':
        if (value > 185) return 'text-red-500';
        if (value > 160) return 'text-yellow-500';
        return 'text-green-500';
      
      case 'bloodPressureSystolic':
        if (value > 180) return 'text-red-500';
        if (value > 140) return 'text-yellow-500';
        return 'text-green-500';
      
      default:
        return 'text-green-500';
    }
  };

  // Scan heart rate on demand
  const scanHeartRate = async () => {
    if (isScanning) return;

    setIsScanning(true);
    
    try {
      // Haptic feedback for scan start
      await Haptics.impact({ style: ImpactStyle.Light });
      
      const result = await healthKitService.scanHeartRateNow();
      
      if (result) {
        setLastScanResult(result);
        
        // Success haptic feedback
        await Haptics.impact({ style: ImpactStyle.Medium });
        
        toast({
          title: "Heart Rate Scanned ❤️",
          description: `Current heart rate: ${result.heartRate} BPM`,
        });
      } else {
        toast({
          title: "Scan Failed",
          description: "Unable to get heart rate reading. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error scanning heart rate:', error);
      toast({
        title: "Scan Error",
        description: "Failed to scan heart rate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Export health data
  const exportHealthData = async (startDate: Date, endDate: Date) => {
    try {
      const data = await healthKitService.exportHealthData(startDate, endDate);
      
      toast({
        title: "Health Data Exported",
        description: "Your health data has been prepared for export.",
      });
      
      return data;
    } catch (error) {
      console.error('Error exporting health data:', error);
      toast({
        title: "Export Error",
        description: "Failed to export health data.",
        variant: "destructive"
      });
      return [];
    }
  };

  return {
    // State
    healthMetrics,
    isMonitoring,
    hasPermissions,
    isAvailable,
    alerts,
    isScanning,
    lastScanResult,
    
    // Actions
    requestPermissions,
    startMonitoring,
    stopMonitoring,
    scanHeartRate,
    clearAlert,
    clearAllAlerts,
    exportHealthData,
    
    // Utilities
    getHealthStatusColor
  };
};
