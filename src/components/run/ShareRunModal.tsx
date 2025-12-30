import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Share2, ImagePlus, Download, X, Camera, RotateCcw, Video, Square, Save } from 'lucide-react';
import { RunSession } from '@/types/run';
import RunShareCard from './RunShareCard';
import { 
  captureRunCard, 
  compositeOnPhoto, 
  compositeSelfieWithStats,
  shareImage, 
  downloadImage,
  saveToPhotoAlbum,
  shareVideo,
  saveVideoToPhotoAlbum
} from '@/utils/shareRunCard';
import { Camera as CapCamera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

interface ShareRunModalProps {
  run: RunSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewMode = 'card' | 'selfie-preview' | 'composite-preview' | 'video-recording' | 'video-preview';

const ShareRunModal = ({ run, open, onOpenChange }: ShareRunModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  const [shareUnit, setShareUnit] = useState<'km' | 'mi'>(run.unit || 'km');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideoStream();
    };
  }, []);

  const stopVideoStream = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleShareAsImage = async () => {
    if (!cardRef.current) return;
    
    setIsProcessing(true);
    try {
      const dataUrl = await captureRunCard(cardRef.current);
      
      const shared = await shareImage(dataUrl, `TapFit Run - ${run.total_distance_m}m`);
      if (!shared) {
        await downloadImage(dataUrl, `tapfit-run-${run.id}.png`);
        toast({
          title: "Image saved!",
          description: "Your run card has been downloaded.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Share failed",
        description: error instanceof Error ? error.message : "Could not share the image. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTakeSelfie = async () => {
    setIsProcessing(true);
    try {
      let photoUri: string;
      
      if (Capacitor.isNativePlatform()) {
        const photo = await CapCamera.getPhoto({
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          direction: CameraDirection.Front,
          quality: 90,
        });
        photoUri = photo.dataUrl || '';
      } else {
        photoUri = await new Promise<string>((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'user';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            } else {
              reject(new Error('No file selected'));
            }
          };
          input.click();
        });
      }

      if (photoUri) {
        const composite = await compositeSelfieWithStats(photoUri, run, shareUnit);
        setCompositeImage(composite);
        setViewMode('selfie-preview');
      }
    } catch (error) {
      console.error('Error taking selfie:', error);
      if ((error as Error).message !== 'No file selected') {
        toast({
          title: "Could not take photo",
          description: "Please try again or use the gallery option.",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordVideo = async () => {
    setIsProcessing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setViewMode('video-recording');
      setRecordingTime(0);
      setIsProcessing(false);
      
      // Wait for video to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      startRecording();
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to record video.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const startRecording = () => {
    if (!canvasRef.current || !videoRef.current || !streamRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    // Start drawing loop
    const drawFrame = () => {
      if (!video.paused && !video.ended && ctx) {
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Draw stats overlay
        drawStatsOverlay(ctx, canvas.width, canvas.height, run, shareUnit);
      }
      animationRef.current = requestAnimationFrame(drawFrame);
    };
    drawFrame();

    // Get audio track from original stream
    const audioTrack = streamRef.current.getAudioTracks()[0];
    
    // Create canvas stream and add audio
    const canvasStream = canvas.captureStream(30);
    if (audioTrack) {
      canvasStream.addTrack(audioTrack);
    }

    // Start recording
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideo(url);
      setViewMode('video-preview');
      stopVideoStream();
    };

    mediaRecorder.start(100);
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);

    // Recording timer
    const timerInterval = setInterval(() => {
      setRecordingTime(t => {
        if (t >= 30) {
          clearInterval(timerInterval);
          handleStopRecording();
          return t;
        }
        return t + 1;
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const drawStatsOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    run: RunSession,
    displayUnit: 'km' | 'mi'
  ) => {
    // Draw gradient overlay at top
    const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.2);
    topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, width, height * 0.2);

    // Scale factor
    const scale = Math.min(width, height) / 720;

    // Format stats
    const distanceValue = displayUnit === 'mi' 
      ? (run.total_distance_m / 1609.34).toFixed(2)
      : (run.total_distance_m / 1000).toFixed(2);
    
    const minutes = Math.floor(run.moving_time_s / 60);
    const seconds = Math.round(run.moving_time_s % 60);
    const timeValue = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const distanceInUnit = displayUnit === 'mi' 
      ? run.total_distance_m / 1609.34 
      : run.total_distance_m / 1000;
    const paceSeconds = distanceInUnit > 0 ? run.moving_time_s / distanceInUnit : 0;
    const paceMin = Math.floor(paceSeconds / 60);
    const paceSec = Math.round(paceSeconds % 60);
    const paceValue = `${paceMin}:${paceSec.toString().padStart(2, '0')}`;

    // Column setup
    const padding = width * 0.04;
    const usableWidth = width - (padding * 2);
    const colWidth = usableWidth / 3;
    const colCenters = [
      padding + colWidth * 0.5,
      padding + colWidth * 1.5,
      padding + colWidth * 2.5
    ];

    const maxValueFontSize = Math.min(28 * scale, colWidth * 0.4);
    const unitFontSize = maxValueFontSize * 0.4;
    const labelFontSize = maxValueFontSize * 0.35;

    const startY = height * 0.035;
    const valueY = startY + maxValueFontSize;
    const unitY = valueY + unitFontSize + 4 * scale;
    const labelY = unitY + labelFontSize + 2 * scale;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 6 * scale;
    ctx.textAlign = 'center';

    const stats = [
      { value: distanceValue, unit: displayUnit.toUpperCase(), label: 'DISTANCE' },
      { value: timeValue, unit: 'MIN', label: 'TIME' },
      { value: paceValue, unit: `/${displayUnit.toUpperCase()}`, label: 'PACE' }
    ];

    stats.forEach((stat, i) => {
      const x = colCenters[i];
      
      ctx.fillStyle = 'white';
      ctx.font = `bold ${maxValueFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(stat.value, x, valueY);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = `600 ${unitFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(stat.unit, x, unitY);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = `500 ${labelFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(stat.label, x, labelY);
    });

    // TapFit branding bottom left
    ctx.shadowBlur = 4 * scale;
    const logoX = 15 * scale;
    const logoY = height - 20 * scale;
    ctx.fillStyle = 'white';
    ctx.font = `bold ${14 * scale}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('TapFit', logoX, logoY);

    // Recording indicator
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(width - 30 * scale, 30 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = `${12 * scale}px system-ui`;
    ctx.textAlign = 'right';
    ctx.fillText('REC', width - 45 * scale, 35 * scale);
  };

  const handleAddToPhoto = async () => {
    if (!cardRef.current) return;
    
    setIsProcessing(true);
    try {
      const cardDataUrl = await captureRunCard(cardRef.current);
      
      let photoUri: string;
      
      if (Capacitor.isNativePlatform()) {
        const photo = await CapCamera.getPhoto({
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
          quality: 90,
        });
        photoUri = photo.dataUrl || photo.webPath || '';
      } else {
        photoUri = await new Promise<string>((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            } else {
              reject(new Error('No file selected'));
            }
          };
          input.click();
        });
      }

      if (photoUri) {
        const composite = await compositeOnPhoto(photoUri, cardDataUrl);
        setCompositeImage(composite);
        setViewMode('composite-preview');
      }
    } catch (error) {
      console.error('Error adding to photo:', error);
      if ((error as Error).message !== 'No file selected') {
        toast({
          title: "Could not add to photo",
          description: error instanceof Error ? error.message : "Try selecting a different photo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareComposite = async () => {
    if (!compositeImage) return;
    
    setIsProcessing(true);
    try {
      const shared = await shareImage(compositeImage, `TapFit Run`);
      if (!shared) {
        await downloadImage(compositeImage, `tapfit-run-${run.id}.png`);
        toast({
          title: "Image saved!",
          description: "Your photo has been downloaded.",
        });
      }
    } catch (error) {
      console.error('Error sharing composite:', error);
      toast({
        title: "Share failed",
        description: "Could not share the image.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToPhotos = async () => {
    if (!compositeImage) return;
    
    setIsProcessing(true);
    try {
      await saveToPhotoAlbum(compositeImage, `tapfit-run-${run.id}.png`);
      toast({
        title: "Saved to Photos!",
        description: "Your run photo is in your camera roll.",
      });
    } catch (error) {
      console.error('Save to photos error:', error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not save to photos.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareVideo = async () => {
    if (!recordedVideo) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(recordedVideo);
      const blob = await response.blob();
      await shareVideo(blob, 'TapFit Run Video');
      toast({
        title: "Video shared!",
        description: "Your video has been shared.",
      });
    } catch (error) {
      console.error('Error sharing video:', error);
      toast({
        title: "Share failed",
        description: "Could not share the video.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveVideoToPhotos = async () => {
    if (!recordedVideo) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(recordedVideo);
      const blob = await response.blob();
      await saveVideoToPhotoAlbum(blob, `tapfit-run-${run.id}.webm`);
      toast({
        title: "Saved to Photos!",
        description: "Your video is in your camera roll.",
      });
    } catch (error) {
      console.error('Save video error:', error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not save video.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadComposite = async () => {
    if (!compositeImage) return;
    
    setIsProcessing(true);
    try {
      await downloadImage(compositeImage, `tapfit-run-${run.id}.png`);
      toast({
        title: "Downloaded!",
        description: "Image saved to your device.",
      });
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    stopVideoStream();
    setViewMode('card');
    setCompositeImage(null);
    setRecordedVideo(null);
    setIsRecording(false);
    setRecordingTime(0);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetState();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto z-[100] bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Run
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Area - Solid background to block map */}
          <div className="flex justify-center min-h-[350px] bg-zinc-900 rounded-xl overflow-hidden relative">
            {isProcessing ? (
              <div className="flex items-center justify-center w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : viewMode === 'video-recording' ? (
              <div className="relative w-full h-full">
                {/* Hidden video element for camera feed */}
                <video 
                  ref={videoRef} 
                  className="absolute inset-0 w-full h-full object-cover opacity-0" 
                  playsInline 
                  muted 
                />
                {/* Canvas with overlay - this is what user sees */}
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full object-cover"
                />
                {/* Recording controls overlay */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
                  <div className="bg-black/50 px-3 py-1 rounded-full text-white text-sm">
                    {recordingTime}s / 30s
                  </div>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="rounded-full"
                    onClick={handleStopRecording}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </div>
              </div>
            ) : viewMode === 'video-preview' && recordedVideo ? (
              <div className="relative w-full">
                <video 
                  src={recordedVideo} 
                  className="w-full max-h-[450px] object-contain rounded-xl" 
                  controls 
                  playsInline
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={resetState}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (viewMode === 'selfie-preview' || viewMode === 'composite-preview') && compositeImage ? (
              <div className="relative w-full">
                <img 
                  src={compositeImage} 
                  alt="Preview" 
                  className="w-full max-h-[450px] object-contain rounded-xl"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={resetState}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="transform scale-[0.85] origin-center">
                <RunShareCard ref={cardRef} run={run} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {viewMode === 'video-preview' && recordedVideo ? (
              <>
                <Button
                  className="w-full"
                  onClick={handleShareVideo}
                  disabled={isProcessing}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Video
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveVideoToPhotos}
                  disabled={isProcessing}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save to Photos
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={resetState}
                  disabled={isProcessing}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </>
            ) : (viewMode === 'selfie-preview' || viewMode === 'composite-preview') && compositeImage ? (
              <>
                <Button
                  className="w-full"
                  onClick={handleShareComposite}
                  disabled={isProcessing}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Share Photo'}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveToPhotos}
                  disabled={isProcessing}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save to Photos
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadComposite}
                  disabled={isProcessing}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={resetState}
                  disabled={isProcessing}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </>
            ) : viewMode === 'video-recording' ? null : (
              <>
                {/* Unit Toggle */}
                <div className="flex items-center justify-center gap-3 py-2 px-4 bg-muted/50 rounded-lg">
                  <span className={`text-sm font-medium transition-colors ${shareUnit === 'km' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    km
                  </span>
                  <Switch 
                    checked={shareUnit === 'mi'} 
                    onCheckedChange={(checked) => setShareUnit(checked ? 'mi' : 'km')} 
                  />
                  <span className={`text-sm font-medium transition-colors ${shareUnit === 'mi' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    mi
                  </span>
                </div>

                {/* Primary: Take Selfie */}
                <Button
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  onClick={handleTakeSelfie}
                  disabled={isProcessing}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Take a Selfie'}
                </Button>

                {/* Record Video */}
                <Button
                  variant="outline"
                  className="w-full border-primary/50 hover:bg-primary/10"
                  onClick={handleRecordVideo}
                  disabled={isProcessing}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Record Video
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShareAsImage}
                  disabled={isProcessing}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Share Card Only'}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAddToPhoto}
                  disabled={isProcessing}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Add to Photo'}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={async () => {
                    if (!cardRef.current) return;
                    setIsProcessing(true);
                    try {
                      const dataUrl = await captureRunCard(cardRef.current);
                      await downloadImage(dataUrl, `tapfit-run-${run.id}.png`);
                      toast({
                        title: "Downloaded!",
                        description: "Run card saved to your device.",
                      });
                    } catch (error) {
                      console.error('Download error:', error);
                      toast({
                        title: "Download failed",
                        description: error instanceof Error ? error.message : "Could not download.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Card
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareRunModal;
