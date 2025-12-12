import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, ImagePlus, Download, X, Check } from 'lucide-react';
import { RunSession } from '@/types/run';
import RunShareCard from './RunShareCard';
import { captureRunCard, compositeOnPhoto, shareImage, downloadImage } from '@/utils/shareRunCard';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

interface ShareRunModalProps {
  run: RunSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareRunModal = ({ run, open, onOpenChange }: ShareRunModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleShareAsImage = async () => {
    if (!cardRef.current) return;
    
    setIsProcessing(true);
    try {
      const dataUrl = await captureRunCard(cardRef.current);
      setPreviewImage(dataUrl);
      
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
        description: "Could not share the image. Try again.",
        variant: "destructive",
      });
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
      
      // Pick a photo
      let photoUri: string;
      
      if (Capacitor.isNativePlatform()) {
        const photo = await Camera.getPhoto({
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos,
          quality: 90,
        });
        photoUri = photo.webPath || photo.path || '';
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
      }
    } catch (error) {
      console.error('Error adding to photo:', error);
      if ((error as Error).message !== 'No file selected') {
        toast({
          title: "Could not add to photo",
          description: "Try selecting a different photo.",
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
          description: "Your photo with run overlay has been downloaded.",
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

  const resetState = () => {
    setPreviewImage(null);
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
          {/* Preview Card */}
          <div className="flex justify-center">
            {compositeImage ? (
              <div className="relative">
                <img 
                  src={compositeImage} 
                  alt="Composite preview" 
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
            {compositeImage ? (
              <Button
                className="w-full"
                onClick={handleShareComposite}
                disabled={isProcessing}
              >
                <Check className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Share Photo'}
              </Button>
            ) : (
              <>
                <Button
                  className="w-full"
                  onClick={handleShareAsImage}
                  disabled={isProcessing}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Share as Image'}
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
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Image
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
