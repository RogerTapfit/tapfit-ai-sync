import { MapPin, Signal } from "lucide-react";
import { Card } from "@/components/ui/card";

interface GPSSignalIndicatorProps {
  accuracy: number;
  compact?: boolean;
}

const getSignalInfo = (accuracy: number) => {
  if (accuracy === 0) {
    return { bars: 0, quality: 'Acquiring...', color: 'text-muted-foreground', bgColor: 'bg-muted', pulseColor: 'bg-muted-foreground' };
  }
  if (accuracy <= 10) {
    return { bars: 4, quality: 'Excellent', color: 'text-green-500', bgColor: 'bg-green-500', pulseColor: 'bg-green-500' };
  }
  if (accuracy <= 25) {
    return { bars: 3, quality: 'Good', color: 'text-blue-500', bgColor: 'bg-blue-500', pulseColor: 'bg-blue-500' };
  }
  if (accuracy <= 50) {
    return { bars: 2, quality: 'Fair', color: 'text-amber-500', bgColor: 'bg-amber-500', pulseColor: 'bg-amber-500' };
  }
  return { bars: 1, quality: 'Poor', color: 'text-red-500', bgColor: 'bg-red-500', pulseColor: 'bg-red-500' };
};

export const GPSSignalIndicator = ({ accuracy, compact = false }: GPSSignalIndicatorProps) => {
  const { bars, quality, color, bgColor, pulseColor } = getSignalInfo(accuracy);
  const isAcquiring = accuracy === 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-0.5 h-3">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`w-1 rounded-sm transition-all duration-300 ${
                bar <= bars ? bgColor : 'bg-muted'
              } ${isAcquiring ? 'animate-pulse' : ''}`}
              style={{ height: `${bar * 25}%` }}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${color}`}>
          {accuracy > 0 ? `±${Math.round(accuracy)}m` : '--'}
        </span>
      </div>
    );
  }

  return (
    <Card className={`px-3 py-2 bg-card/90 backdrop-blur shadow-lg border-${bars >= 3 ? 'green' : bars >= 2 ? 'amber' : 'red'}-500/20`}>
      <div className="flex items-center gap-3">
        {/* Signal Bars */}
        <div className="flex items-end gap-0.5 h-4">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`w-1.5 rounded-sm transition-all duration-300 ${
                bar <= bars ? bgColor : 'bg-muted'
              } ${isAcquiring ? 'animate-pulse' : ''}`}
              style={{ height: `${bar * 25}%` }}
            />
          ))}
        </div>

        {/* Accuracy & Quality */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <MapPin className={`h-3 w-3 ${color}`} />
            <span className={`text-xs font-bold ${color}`}>
              {accuracy > 0 ? `±${Math.round(accuracy)}m` : '--'}
            </span>
          </div>
          <span className={`text-[10px] ${color} opacity-80`}>
            {quality}
          </span>
        </div>

        {/* Pulsing dot for live indicator */}
        <div className={`w-2 h-2 rounded-full ${pulseColor} ${isAcquiring ? 'animate-pulse' : 'animate-ping opacity-75'}`} />
      </div>
    </Card>
  );
};
