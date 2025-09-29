import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, X, CheckCircle, Upload, Settings, Target, Activity } from 'lucide-react';
import { useMachineScan } from '@/hooks/useMachineScan';
import { RecognitionResult } from '@/types/machine';
import { WorkoutPrescriptionService, UserProfile, SessionRequest } from '@/services/workoutPrescriptionService';
import { toast } from 'sonner';

interface EnhancedMachineScannerProps {
  onMachineSelected: (machineId: string, confidence: number, imageUrl?: string, workoutPlan?: any) => void;
  onClose: () => void;
  autoNavigate?: boolean;
  userProfile?: UserProfile;
  sessionRequest?: SessionRequest;
}

export const EnhancedMachineScanner: React.FC<EnhancedMachineScannerProps> = ({
  onMachineSelected,
  onClose,
  autoNavigate = true,
  userProfile,
  sessionRequest: initialSessionRequest
}) => {
  const [sessionRequest, setSessionRequest] = useState<SessionRequest | undefined>(initialSessionRequest);
  const [showSettings, setShowSettings] = useState(false);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);

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
    
    videoRef,
    canvasRef
  } = useMachineScan({ autoStop: autoNavigate });

  useEffect(() => {
    if (autoNavigate && isHighConfidence && bestMatch) {
      handleMachineSelect(bestMatch);
    }
  }, [isHighConfidence, bestMatch, autoNavigate]);

  const handleStart = () => {
    reset();
    startCamera();
  };

  const handleStop = () => {
    stopCamera();
  };

  const handleMachineSelect = async (result: RecognitionResult) => {
    stopCamera();
    
    // Generate workout plan if we have user profile and session request
    let workoutPlan = null;
    if (userProfile && sessionRequest) {
      setIsGeneratingWorkout(true);
      try {
        const enhancedSessionRequest = {
          ...sessionRequest,
          machine_id: result.machineId,
          machine_type: result.machineId.includes('CARDIO') || 
                       result.machineId.includes('TREADMILL') || 
                       result.machineId.includes('BIKE') ||
                       result.machineId.includes('ELLIPTICAL') ? 'cardio' as const : 'strength' as const
        };
        
        workoutPlan = await WorkoutPrescriptionService.generateWorkoutSession(
          userProfile, 
          enhancedSessionRequest
        );
        
        if (workoutPlan) {
          toast.success('Workout plan generated!');
        }
      } catch (error) {
        console.error('Failed to generate workout plan:', error);
        toast.error('Failed to generate workout plan');
      } finally {
        setIsGeneratingWorkout(false);
      }
    }
    
    onMachineSelected(result.machineId, result.confidence, result.imageUrl, workoutPlan);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleUploadClick = (useCamera = false) => {
    reset();
    stopCamera();

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    if (useCamera) {
      input.capture = 'environment';
    }
    
    input.style.position = 'fixed';
    input.style.top = '-1000px';
    input.style.left = '-1000px';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    
    document.body.appendChild(input);
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        processUploadedImage(file);
      }
      document.body.removeChild(input);
    };
    
    input.click();
  };

  const handleCameraClick = () => handleUploadClick(true);
  const handleGalleryClick = () => handleUploadClick(false);

  const SessionGoalSelector = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Session Goals</h3>
      <div className="grid grid-cols-2 gap-2">
        {['endurance', 'calories', 'intervals', 'recovery', 'strength', 'hypertrophy', 'power'].map((goal) => (
          <Button
            key={goal}
            variant={sessionRequest?.session_goal === goal ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSessionRequest(prev => ({ ...prev!, session_goal: goal as any }))}
            className="text-xs"
          >
            {goal.charAt(0).toUpperCase() + goal.slice(1)}
          </Button>
        ))}
      </div>
      
      {sessionRequest?.session_goal && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Duration (minutes)</label>
          <input
            type="number"
            min="5"
            max="120"
            value={sessionRequest.target_duration || 30}
            onChange={(e) => setSessionRequest(prev => ({ 
              ...prev!, 
              target_duration: parseInt(e.target.value) || 30 
            }))}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold text-foreground">Enhanced Machine Scanner</h1>
        <div className="flex items-center gap-2">
          {userProfile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && userProfile && (
        <div className="p-4 border-b bg-secondary/20">
          <SessionGoalSelector />
        </div>
      )}

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
              
              {userProfile && sessionRequest && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Goal: {sessionRequest.session_goal}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {sessionRequest.target_duration || 30} min session
                    </span>
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Scan Machine</h3>
                <p className="text-muted-foreground mb-4">
                  {userProfile ? 
                    'Get personalized workout prescription based on your goals' : 
                    'Identify gym machines automatically'
                  }
                </p>
                <Button onClick={handleStart} variant="outline" className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Live Scanning
                </Button>
              </div>

              {/* Processing state */}
              {(isProcessing || isGeneratingWorkout) && (
                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-primary">
                    {isGeneratingWorkout ? 'Generating workout plan...' : 'Analyzing machine...'}
                  </p>
                </div>
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
                          {userProfile && sessionRequest ? 'Generating workout plan...' : 'Navigating automatically...'}
                        </p>
                      )}
                    </div>
                    {!autoNavigate && (
                      <Button
                        onClick={() => handleMachineSelect(bestMatch)}
                        size="sm"
                        disabled={isGeneratingWorkout}
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

              {/* Alternative results */}
              {alternatives.length > 0 && !isHighConfidence && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-3">
                    {bestMatch?.machineId === 'UNKNOWN' ? 'Browse All Machines:' : 'Or Select Machine:'}
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {alternatives.slice(0, 8).map((result) => (
                      <Button
                        key={result.machineId}
                        onClick={() => handleMachineSelect(result)}
                        variant="outline"
                        className="w-full justify-start h-auto p-3"
                        disabled={isGeneratingWorkout}
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
                              {result.confidence > 0 ? 
                                `${Math.round(result.confidence * 100)}% match` : 
                                'Browse option'
                              }
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

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
              {(isProcessing || isGeneratingWorkout) && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    {isGeneratingWorkout ? 'Generating Plan...' : 'Analyzing...'}
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
                    {userProfile && sessionRequest && (
                      <div className="text-white/80 text-xs mb-2">
                        Goal: {sessionRequest.session_goal} • {sessionRequest.target_duration || 30} min
                      </div>
                    )}
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
                          disabled={isGeneratingWorkout}
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

              {/* Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button onClick={handleStop} variant="outline" size="sm">
                  Stop Scanning
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};