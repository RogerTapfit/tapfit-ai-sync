import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Watch, X } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";

interface HeartRateScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  isScanning: boolean;
  scanResult: { heartRate: number; timestamp: Date } | null;
  onScan: () => void;
  avgHeartRate?: number;
}

export const HeartRateScanModal = ({
  isOpen,
  onClose,
  isScanning,
  scanResult,
  onScan,
  avgHeartRate = 0
}: HeartRateScanModalProps) => {
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (scanResult && !isScanning) {
      setShowResult(true);
    } else {
      setShowResult(false);
    }
  }, [scanResult, isScanning]);

  const handleScan = () => {
    setShowResult(false);
    onScan();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background to-muted border-primary/20">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Heart className="h-6 w-6 text-stats-heart" />
            Heart Rate Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-6">
          {/* Apple Watch Connection Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Watch className="h-4 w-4" />
            <span>Apple Watch Connected</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>

          {/* Heart Rate Display */}
          <div className="relative">
            {isScanning ? (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Heart 
                    className={`h-24 w-24 text-stats-heart transition-all duration-300 ${
                      isScanning ? 'animate-pulse scale-110' : ''
                    }`} 
                  />
                  <div className="absolute inset-0 h-24 w-24 border-4 border-stats-heart/30 rounded-full animate-ping" />
                </div>
                <p className="text-sm text-muted-foreground mt-4 animate-pulse">
                  Scanning from Apple Watch...
                </p>
              </div>
            ) : showResult && scanResult ? (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Heart className="h-24 w-24 text-stats-heart animate-heartbeat-glow" />
                </div>
                <div className="mt-4 text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    <AnimatedNumber finalValue={scanResult.heartRate} duration={1000} />
                    <span className="text-lg ml-1">BPM</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Scanned at {scanResult.timestamp.toLocaleTimeString()}
                  </p>
                  {avgHeartRate > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">vs avg today: </span>
                      <span className={
                        scanResult.heartRate > avgHeartRate 
                          ? "text-yellow-500" 
                          : "text-green-500"
                      }>
                        {scanResult.heartRate > avgHeartRate ? '+' : ''}
                        {scanResult.heartRate - avgHeartRate} BPM
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Heart className="h-24 w-24 text-stats-heart/50" />
                <p className="text-sm text-muted-foreground mt-4">
                  Tap scan to get your current heart rate
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="flex-1 bg-stats-heart hover:bg-stats-heart/90 text-white"
            >
              <Heart className="h-4 w-4 mr-2" />
              {isScanning ? 'Scanning...' : showResult ? 'Scan Again' : 'Start Scan'}
            </Button>
          </div>

          {/* Progress Indicator */}
          {isScanning && (
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-stats-heart h-2 rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};