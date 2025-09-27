import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, X, CheckCircle } from 'lucide-react';
import { useMachineScan } from '@/hooks/useMachineScan';
import { RecognitionResult } from '@/types/machine';

interface MachineScannerProps {
  onMachineSelected: (machineId: string, confidence: number) => void;
  onClose: () => void;
  autoNavigate?: boolean;
}

export const MachineScanner: React.FC<MachineScannerProps> = ({
  onMachineSelected,
  onClose,
  autoNavigate = true
}) => {
  const {
    isScanning,
    isProcessing,
    error,
    bestMatch,
    alternatives,
    isHighConfidence,
    startCamera,
    stopCamera,
    reset,
    videoRef,
    canvasRef
  } = useMachineScan({ autoStop: autoNavigate });

  useEffect(() => {
    if (autoNavigate && isHighConfidence && bestMatch) {
      // Auto-navigate after a short delay for UX feedback
      const timeout = setTimeout(() => {
        onMachineSelected(bestMatch.machineId, bestMatch.confidence);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [isHighConfidence, bestMatch, autoNavigate, onMachineSelected]);

  const handleStart = () => {
    reset();
    startCamera();
  };

  const handleStop = () => {
    stopCamera();
  };

  const handleMachineSelect = (result: RecognitionResult) => {
    stopCamera();
    onMachineSelected(result.machineId, result.confidence);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold text-foreground">Scan Machine</h1>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black">
        {!isScanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="p-6 text-center max-w-sm mx-4">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Point at Machine</h3>
              <p className="text-muted-foreground mb-4">
                Aim your camera at the front of the gym machine to identify it automatically.
              </p>
              <Button onClick={handleStart} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            </Card>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="p-6 text-center max-w-sm mx-4">
              <div className="text-destructive mb-4">
                <X className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium mb-2">Camera Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleStart} variant="outline" className="w-full">
                Try Again
              </Button>
            </Card>
          </div>
        )}

        {isScanning && (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />

            {/* Scanning Overlay */}
            <div className="absolute inset-0">
              {/* Guide Frame */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-64 h-48 border-2 border-primary rounded-lg border-dashed">
                  <div className="absolute -top-8 left-0 text-primary text-sm font-medium">
                    Point at machine
                  </div>
                </div>
              </div>

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    Analyzing...
                  </Badge>
                </div>
              )}

              {/* Results */}
              {bestMatch && (
                <div className="absolute bottom-20 left-4 right-4">
                  <Card className="p-4 bg-black/80 border-primary">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{bestMatch.name}</h4>
                      {isHighConfidence && (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={isHighConfidence ? "default" : "secondary"}
                        className={isHighConfidence ? "bg-green-600" : ""}
                      >
                        {Math.round(bestMatch.confidence * 100)}% confident
                      </Badge>
                      {!autoNavigate && (
                        <Button 
                          size="sm" 
                          onClick={() => handleMachineSelect(bestMatch)}
                          className="ml-2"
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* Low Confidence Alternatives */}
              {!isHighConfidence && alternatives.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-white text-sm mb-2">
                    Not sure? Pick the right machine:
                  </div>
                  <div className="space-y-2">
                    {alternatives.slice(0, 3).map((result) => (
                      <Button
                        key={result.machineId}
                        variant="outline"
                        size="sm"
                        onClick={() => handleMachineSelect(result)}
                        className="w-full justify-between bg-black/50 border-white/20 text-white hover:bg-white/10"
                      >
                        <span>{result.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {Math.round(result.confidence * 100)}%
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      {isScanning && (
        <div className="p-4 border-t bg-background">
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={handleStop}>
              Stop Scanning
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};