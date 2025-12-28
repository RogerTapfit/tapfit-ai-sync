import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, X, CheckCircle, Upload, Loader2 } from 'lucide-react';
import { useMachineScan } from '@/hooks/useMachineScan';
import { RecognitionResult } from '@/types/machine';
import { MachineTrainingService } from '@/services/machineTrainingService';

interface MachineScannerProps {
  onMachineSelected: (machineId: string, confidence: number, imageUrl?: string) => void;
  onClose: () => void;
  autoNavigate?: boolean;
}

export const MachineScanner: React.FC<MachineScannerProps> = ({
  onMachineSelected,
  onClose,
  autoNavigate = true
}) => {
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');

  const {
    isScanning,
    isProcessing,
    error,
    errorSource,
    bestMatch,
    alternatives,
    isHighConfidence,
    
    startCamera,
    stopCamera,
    reset,
    processUploadedImage,
    getCanvasBlob,
    
    videoRef,
    canvasRef
  } = useMachineScan({ autoStop: autoNavigate });

  // Track the capture method for training data
  const captureMethodRef = useRef<'camera' | 'upload' | 'live_scan'>('live_scan');

  const ANALYSIS_STAGES = [
    { progress: 10, text: 'Starting camera analysis...', duration: 1500 },
    { progress: 30, text: 'Detecting gym equipment...', duration: 2000 },
    { progress: 60, text: 'Matching to machine database...', duration: 2500 },
    { progress: 85, text: 'Confirming identification...', duration: 2000 },
    { progress: 100, text: 'Complete!', duration: 500 }
  ];

  useEffect(() => {
    if (isProcessing) {
      setAnalysisProgress(0);
      setAnalysisStage(ANALYSIS_STAGES[0].text);
      
      let stageIndex = 0;
      const interval = setInterval(() => {
        if (stageIndex < ANALYSIS_STAGES.length - 1) {
          stageIndex++;
          setAnalysisProgress(ANALYSIS_STAGES[stageIndex].progress);
          setAnalysisStage(ANALYSIS_STAGES[stageIndex].text);
        } else {
          clearInterval(interval);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  // Save training data and auto-navigate on high confidence
  useEffect(() => {
    if (autoNavigate && isHighConfidence && bestMatch) {
      // Auto-navigate after a short delay for UX feedback
      const timeout = setTimeout(async () => {
        // Save training data in background (AI was correct - user didn't need to correct)
        try {
          const photoBlob = await getCanvasBlob();
          if (photoBlob) {
            MachineTrainingService.saveTrainingData({
              photoBlob,
              aiResult: bestMatch,
              userSelectedMachineId: bestMatch.machineId, // Same = AI was correct
              captureMethod: captureMethodRef.current,
              alternatives
            }).catch(err => console.error('Training save failed:', err));
          }
        } catch (err) {
          console.error('Failed to get canvas blob for training:', err);
        }
        
        onMachineSelected(bestMatch.machineId, bestMatch.confidence, bestMatch.imageUrl);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [isHighConfidence, bestMatch, autoNavigate, onMachineSelected, getCanvasBlob, alternatives]);

  const handleStart = () => {
    captureMethodRef.current = 'live_scan';
    reset();
    startCamera();
  };

  const handleStop = () => {
    stopCamera();
  };

  const handleMachineSelect = async (result: RecognitionResult) => {
    stopCamera();
    
    // Save training data in background (user manually selected - may be a correction)
    try {
      const photoBlob = await getCanvasBlob();
      if (photoBlob && bestMatch) {
        MachineTrainingService.saveTrainingData({
          photoBlob,
          aiResult: bestMatch,
          userSelectedMachineId: result.machineId, // What user actually selected
          captureMethod: captureMethodRef.current,
          alternatives
        }).catch(err => console.error('Training save failed:', err));
      }
    } catch (err) {
      console.error('Failed to get canvas blob for training:', err);
    }
    
    onMachineSelected(result.machineId, result.confidence, result.imageUrl);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleUploadClick = (useCamera = false) => {
    // Track capture method for training data
    captureMethodRef.current = useCamera ? 'camera' : 'upload';
    
    // Clear previous state and ensure camera is stopped before upload
    reset();
    stopCamera();

    // Mobile Safari requires special handling for file inputs
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    // For mobile camera access, use capture attribute
    if (useCamera) {
      input.capture = 'environment';
    }
    
    // Style the input to be invisible but accessible
    input.style.position = 'fixed';
    input.style.top = '-1000px';
    input.style.left = '-1000px';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    
    // Add to DOM temporarily for mobile compatibility
    document.body.appendChild(input);
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        processUploadedImage(file);
      }
      // Clean up
      document.body.removeChild(input);
    };
    
    // Trigger click - this must happen synchronously from user gesture
    input.click();
  };

  const handleCameraClick = () => handleUploadClick(true);
  const handleGalleryClick = () => handleUploadClick(false);

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
              <div className="mb-4 space-y-4">
                <Button onClick={handleCameraClick} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button onClick={handleGalleryClick} variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Point at Machine</h3>
                <p className="text-muted-foreground mb-4">
                  Take a photo or start scanning to identify gym machines automatically.
                </p>
                <Button onClick={handleStart} variant="outline" className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Live Scanning
                </Button>
              </div>

              {/* Processing state for uploaded images */}
              {isProcessing && (
                <Card className="mt-4 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardContent className="py-5">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div>
                          <h3 className="font-semibold text-lg">Analyzing Machine</h3>
                          <p className="text-sm text-muted-foreground">{analysisStage}</p>
                        </div>
                      </div>
                      <Progress value={analysisProgress} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-primary font-medium">{analysisStage}</span>
                        <span className="text-muted-foreground">{analysisProgress}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results for uploaded images */}
              {bestMatch && bestMatch.machineId !== 'UNKNOWN' && isHighConfidence && (
                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src={bestMatch.imageUrl} 
                      alt={bestMatch.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{bestMatch.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(bestMatch.confidence * 100)}% confidence
                      </p>
                      {bestMatch.reasoning && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{bestMatch.reasoning}"
                        </p>
                      )}
                      {autoNavigate && (
                        <p className="text-xs text-primary mt-1">
                          Navigating automatically...
                        </p>
                      )}
                    </div>
                    {!autoNavigate && (
                      <Button
                        onClick={() => handleMachineSelect(bestMatch)}
                        size="sm"
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Not recognized message */}
              {bestMatch && bestMatch.machineId === 'UNKNOWN' && (
                <div className="mt-4 p-4 bg-secondary/20 border border-secondary/40 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-secondary/30 rounded-lg flex items-center justify-center">
                      <Camera className="h-8 w-8 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">Machine Not Recognized</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {bestMatch.reasoning}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Try taking another photo or select manually from the list below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Alternative results for uploaded images */}
              {alternatives.length > 0 && !isHighConfidence && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-3">
                    {bestMatch?.machineId === 'UNKNOWN' ? 'Browse All Machines:' : 'Or Select Machine:'}
                  </h4>
                  <div className="space-y-2">
                    {bestMatch?.machineId === 'UNKNOWN' ? (
                      // Show all machines when not recognized
                      <>
                        {alternatives.slice(0, 8).map(machine => (
                          <Button
                            key={machine.machineId}
                            onClick={() => handleMachineSelect(machine)}
                            variant="outline"
                            className="w-full justify-start h-auto p-3"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <img 
                                src={machine.imageUrl} 
                                alt={machine.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1 text-left">
                                <div className="font-medium text-sm">{machine.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {machine.reasoning || 'Browse machine'}
                                </div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </>
                    ) : (
                      // Show alternative matches
                      alternatives.filter(a => a.machineId !== 'UNKNOWN').map((result) => (
                        <Button
                          key={result.machineId}
                          onClick={() => handleMachineSelect(result)}
                          variant="outline"
                          className="w-full justify-start h-auto p-3"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <img 
                              src={result.imageUrl} 
                              alt={result.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1 text-left">
                              <div className="font-medium text-sm">{result.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round(result.confidence * 100)}% match
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Hidden canvas for image processing */}
              <canvas ref={canvasRef} className="hidden" />
            </Card>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="p-6 text-center max-w-sm mx-4">
              <div className="text-destructive mb-4">
                <X className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium mb-2">{errorSource === 'camera' ? 'Camera Error' : 'Upload Error'}</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              {errorSource === 'camera' ? (
                <Button onClick={handleStart} variant="outline" className="w-full">
                  Try Again
                </Button>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={handleGalleryClick} className="w-full">
                    Upload Again
                  </Button>
                  <Button onClick={handleStart} variant="outline" className="w-full">
                    Start Live Scanning
                  </Button>
                </div>
              )}
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
              autoPlay
              controls={false}
              webkit-playsinline="true"
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
              {bestMatch && bestMatch.machineId !== 'UNKNOWN' && (
                <div className="absolute bottom-20 left-4 right-4">
                  <Card className="p-4 bg-black/80 border-primary">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{bestMatch.name}</h4>
                      {isHighConfidence && (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      )}
                    </div>
                    {bestMatch.reasoning && (
                      <p className="text-white/80 text-xs mb-2 italic">
                        "{bestMatch.reasoning}"
                      </p>
                    )}
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

              {/* Not recognized overlay */}
              {bestMatch && bestMatch.machineId === 'UNKNOWN' && (
                <div className="absolute bottom-20 left-4 right-4">
                  <Card className="p-4 bg-black/80 border-secondary">
                    <div className="flex items-center gap-3 mb-2">
                      <Camera className="h-5 w-5 text-white" />
                      <h4 className="text-white font-medium">Machine Not Recognized</h4>
                    </div>
                    <p className="text-white/80 text-xs mb-3">
                      {bestMatch.reasoning}
                    </p>
                    <p className="text-white/60 text-xs">
                      Try repositioning the camera or select manually from the options below.
                    </p>
                  </Card>
                </div>
              )}

              {/* Low Confidence Alternatives or Browse Options */}
              {!isHighConfidence && alternatives.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-white text-sm mb-2">
                    {bestMatch?.machineId === 'UNKNOWN' ? 'Browse machines:' : 'Not sure? Pick the right machine:'}
                  </div>
                  <div className="space-y-2">
                    {bestMatch?.machineId === 'UNKNOWN' ? (
                      // Show popular machines when not recognized
                      alternatives.slice(0, 4).map(result => (
                        <Button
                          key={result.machineId}
                          variant="outline"
                          size="sm"
                          onClick={() => handleMachineSelect(result)}
                          className="w-full justify-start bg-black/50 border-white/20 text-white hover:bg-white/10"
                        >
                          <span>{result.name}</span>
                        </Button>
                      ))
                    ) : (
                      // Show confidence-based alternatives
                      alternatives.filter(a => a.machineId !== 'UNKNOWN').slice(0, 3).map((result) => (
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
                      ))
                    )}
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