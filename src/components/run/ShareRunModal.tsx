import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, ImagePlus, Download, X, Camera, RotateCcw } from 'lucide-react';
import { RunSession } from '@/types/run';
import RunShareCard from './RunShareCard';
import { 
  captureRunCard, 
  compositeOnPhoto, 
  compositeSelfieWithStats,
  shareImage, 
  downloadImage 
} from '@/utils/shareRunCard';
import { Camera as CapCamera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

interface ShareRunModalProps {
  run: RunSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewMode = 'card' | 'selfie-preview' | 'composite-preview';

const ShareRunModal = ({ run, open, onOpenChange }: ShareRunModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleShareAsImage = async () => {
    if (!cardRef.current) return;
    
    setIsProcessing(true);
    try {
      const dataUrl = await captureRunCard(cardRef.current);
      
      const shared = await shareImage(dataUrl, `TapFit Run - ${run.total_distance_m}m`);
      if (!shared) {
        // Fallback to download
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
        // Web fallback - use file input with camera capture hint
        photoUri = await new Promise<string>((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'user'; // Hint for front camera
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
        // Create Strava-style overlay
        const composite = await compositeSelfieWithStats(photoUri, run);
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

  const handleAddToPhoto = async () => {
    if (!cardRef.current) return;
    
    setIsProcessing(true);
    try {
      // Capture the card first
      const cardDataUrl = await captureRunCard(cardRef.current);
      
      // Pick a photo from gallery
      let photoUri: string;
      
      if (Capacitor.isNativePlatform()) {
        const photo = await CapCamera.getPhoto({
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
          quality: 90,
        });
        photoUri = photo.dataUrl || photo.webPath || '';
      } else {
        // Web fallback - use file input
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
    setViewMode('card');
    setCompositeImage(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetState();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Run
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Area */}
          <div className="flex justify-center">
            {viewMode !== 'card' && compositeImage ? (
              <div className="relative">
                <img 
                  src={compositeImage} 
                  alt="Preview" 
                  className="max-w-full max-h-[400px] rounded-xl"
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
            {viewMode !== 'card' && compositeImage ? (
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
            ) : (
              <>
                {/* Primary: Take Selfie - Strava-style overlay */}
                <Button
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  onClick={handleTakeSelfie}
                  disabled={isProcessing}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Take a Selfie'}
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
