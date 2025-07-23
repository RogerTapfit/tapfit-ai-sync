import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Droplets, 
  Activity, 
  Gauge, 
  Zap, 
  AlertTriangle,
  X,
  Apple
} from 'lucide-react';
import { useHealthKit } from '@/hooks/useHealthKit';
import { HealthAlert } from '@/services/healthKitService';

interface HealthMetricsPanelProps {
  isWorkoutActive?: boolean;
  className?: string;
}

export const HealthMetricsPanel = ({ isWorkoutActive = false, className = "" }: HealthMetricsPanelProps) => {
  const {
    healthMetrics,
    isMonitoring,
    hasPermissions,
    isAvailable,
    alerts,
    startMonitoring,
    stopMonitoring,
    clearAlert,
    clearAllAlerts,
    getHealthStatusColor
  } = useHealthKit();

  const handleToggleMonitoring = async () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      await startMonitoring();
    }
  };

  if (!isAvailable) {
    return (
      <Card className={`${className} bg-muted/50`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Apple Watch Health</CardTitle>
          </div>
          <CardDescription>
            HealthKit is only available on iOS devices with Apple Watch
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Health Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Health Alerts</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllAlerts}
              className="h-6 px-2 text-xs"
            >
              Clear All
            </Button>
          </div>
          {alerts.map((alert, index) => (
            <Alert 
              key={index} 
              className={`${alert.type === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}
            >
              <AlertTriangle className={`h-4 w-4 ${alert.type === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
              <div className="flex-1">
                <AlertDescription className="text-sm">
                  <strong>{alert.metric}:</strong> {alert.message}
                  <span className="block text-xs mt-1">
                    Current: {alert.value} (Threshold: {alert.threshold})
                  </span>
                </AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => clearAlert(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Health Panel */}
      <Card className="bg-gradient-to-br from-background to-muted/20 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Apple Watch Health</CardTitle>
              {isMonitoring && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse" />
                  Live
                </Badge>
              )}
            </div>
            <Button
              variant={isMonitoring ? "secondary" : "default"}
              size="sm"
              onClick={handleToggleMonitoring}
              disabled={!hasPermissions && !isMonitoring}
            >
              {isMonitoring ? 'Stop' : 'Start'} Monitoring
            </Button>
          </div>
          <CardDescription>
            {!hasPermissions 
              ? "Tap 'Start Monitoring' to connect your Apple Watch"
              : isMonitoring 
                ? "Real-time health data from your Apple Watch"
                : "Health monitoring is paused"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Primary Health Metrics */}
          <div className="grid grid-cols-2 gap-4">
            {/* Blood Oxygen */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Blood Oxygen</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${getHealthStatusColor('bloodOxygen', healthMetrics.bloodOxygen)}`}>
                  {healthMetrics.bloodOxygen || '--'}
                </span>
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              {healthMetrics.bloodOxygen && (
                <Progress 
                  value={healthMetrics.bloodOxygen} 
                  className="h-2"
                  max={100}
                />
              )}
            </div>

            {/* Heart Rate */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Heart Rate</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${getHealthStatusColor('heartRate', healthMetrics.heartRate)}`}>
                  {healthMetrics.heartRate || '--'}
                </span>
                <span className="text-sm text-muted-foreground">bpm</span>
              </div>
              {healthMetrics.heartRate && (
                <Progress 
                  value={(healthMetrics.heartRate / 200) * 100} 
                  className="h-2"
                />
              )}
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Blood Pressure</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-bold ${getHealthStatusColor('bloodPressureSystolic', healthMetrics.bloodPressureSystolic)}`}>
                {healthMetrics.bloodPressureSystolic || '--'}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className={`text-xl font-bold ${getHealthStatusColor('bloodPressureSystolic', healthMetrics.bloodPressureDiastolic)}`}>
                {healthMetrics.bloodPressureDiastolic || '--'}
              </span>
              <span className="text-sm text-muted-foreground ml-1">mmHg</span>
            </div>
          </div>

          {/* Secondary Metrics */}
          {isWorkoutActive && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
              {/* VO2 Max */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-medium">VO₂ Max</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-green-500">
                    {healthMetrics.vo2Max || '--'}
                  </span>
                  <span className="text-xs text-muted-foreground">ml/kg/min</span>
                </div>
              </div>

              {/* Active Energy */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-medium">Active Energy</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-orange-500">
                    {healthMetrics.activeEnergyBurned || '--'}
                  </span>
                  <span className="text-xs text-muted-foreground">cal</span>
                </div>
              </div>
            </div>
          )}

          {/* Data Update Indicator */}
          {isMonitoring && (
            <div className="flex items-center justify-center pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                Updates every 5 seconds
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};