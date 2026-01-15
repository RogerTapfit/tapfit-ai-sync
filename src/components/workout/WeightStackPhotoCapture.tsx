import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Check, Edit2, Loader2, X, Coins, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWeightStack } from '@/hooks/useWeightStack';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WeightStackPhotoCaptureProps {
  machineName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (weightStack: number[], coinsAwarded: number) => void;
}

export const WeightStackPhotoCapture: React.FC<WeightStackPhotoCaptureProps> = ({
  machineName,
  open,
  onOpenChange,
  onComplete
}) => {
  const [step, setStep] = useState<'capture' | 'analyzing' | 'confirm' | 'saving'>('capture');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [extractedWeights, setExtractedWeights] = useState<number[]>([]);
  const [editableWeights, setEditableWeights] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const { contributeWeightStack, extractWeightStackFromPhoto } = useWeightStack(machineName);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoBlob(file);
    setPhotoPreview(URL.createObjectURL(file));
    await processImage(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Could not access camera');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        stopCamera();
        setPhotoBlob(blob);
        setPhotoPreview(canvas.toDataURL('image/jpeg'));
        await processImage(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const processImage = async (blob: Blob) => {
    try {
      setStep('analyzing');
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const base64 = await base64Promise;

      // Extract weights using AI
      const weights = await extractWeightStackFromPhoto(base64);
      
      setExtractedWeights(weights);
      setEditableWeights(weights.join(', '));
      setStep('confirm');
    } catch (err) {
      console.error('Error processing image:', err);
      toast.error('Could not extract weights. Try again or enter manually.');
      setStep('confirm');
      setExtractedWeights([]);
      setEditableWeights('');
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!photoBlob) {
      toast.error('No photo captured');
      return;
    }

    // Parse the editable weights
    let finalWeights: number[];
    try {
      finalWeights = editableWeights
        .split(',')
        .map(w => parseInt(w.trim(), 10))
        .filter(w => !isNaN(w) && w > 0)
        .sort((a, b) => a - b);

      if (finalWeights.length < 3) {
        toast.error('Please enter at least 3 weight values');
        return;
      }
    } catch (err) {
      toast.error('Invalid weight format');
      return;
    }

    try {
      setStep('saving');
      const { coinsAwarded } = await contributeWeightStack(finalWeights, photoBlob);
      
      toast.success(
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span>+{coinsAwarded} Tap Coins earned!</span>
        </div>,
        { description: `Weight stack saved for ${machineName}` }
      );

      onComplete?.(finalWeights, coinsAwarded);
      handleClose();
    } catch (err) {
      console.error('Error saving weight stack:', err);
      toast.error('Failed to save weight stack');
      setStep('confirm');
    }
  };

  const handleClose = useCallback(() => {
    stopCamera();
    setStep('capture');
    setPhotoBlob(null);
    setPhotoPreview(null);
    setExtractedWeights([]);
    setEditableWeights('');
    setIsEditing(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const addWeight = () => {
    const weights = editableWeights.split(',').map(w => parseInt(w.trim(), 10)).filter(w => !isNaN(w));
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
    const newWeight = maxWeight + 10;
    setEditableWeights(prev => prev ? `${prev}, ${newWeight}` : `${newWeight}`);
  };

  const renderStep = () => {
    switch (step) {
      case 'capture':
        return (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Take a photo of the weight stack labels on this machine.
                Make sure all weight numbers are clearly visible.
              </p>
            </div>

            {showCamera ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <div className="absolute inset-0 border-4 border-dashed border-primary/50 rounded-lg pointer-events-none" />
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" onClick={stopCamera} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={capturePhoto} className="flex-1 bg-primary">
                    <Camera className="h-4 w-4 mr-2" />
                    Capture
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Button onClick={startCamera} className="w-full" size="lg">
                  <Camera className="h-5 w-5 mr-2" />
                  Open Camera
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  Upload Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-500/30">
              <Coins className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                Earn <strong>25 Tap Coins</strong> for contributing this data!
              </span>
            </div>
          </div>
        );

      case 'analyzing':
        return (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Analyzing Weight Stack...</p>
            <p className="text-sm text-muted-foreground mt-2">
              AI is reading the weight labels from your photo
            </p>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-4">
            {photoPreview && (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Weight stack"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setStep('capture');
                    setPhotoPreview(null);
                    setPhotoBlob(null);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Retake
                </Button>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {extractedWeights.length > 0 ? (
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Detected {extractedWeights.length} weights
                    </span>
                  ) : (
                    'Enter weight values'
                  )}
                </Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  {isEditing ? 'Done' : 'Edit'}
                </Button>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editableWeights}
                    onChange={(e) => setEditableWeights(e.target.value)}
                    placeholder="15, 30, 45, 65, 85, 105..."
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter weights separated by commas, from lightest to heaviest
                  </p>
                  <Button size="sm" variant="outline" onClick={addWeight}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Weight
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {editableWeights.split(',').map((weight, i) => {
                    const w = parseInt(weight.trim(), 10);
                    if (isNaN(w)) return null;
                    return (
                      <Badge key={i} variant="secondary" className="px-2 py-1 font-mono">
                        {w} lbs
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Weight Range:</p>
              <p className="text-muted-foreground">
                {(() => {
                  const weights = editableWeights
                    .split(',')
                    .map(w => parseInt(w.trim(), 10))
                    .filter(w => !isNaN(w))
                    .sort((a, b) => a - b);
                  if (weights.length === 0) return 'No weights entered';
                  return `${weights[0]} lbs → ${weights[weights.length - 1]} lbs (${weights.length} settings)`;
                })()}
              </p>
            </div>
          </div>
        );

      case 'saving':
        return (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Saving Weight Stack...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contributing to the TapFit community
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Photo Weight Stack
          </DialogTitle>
          <DialogDescription>
            Help improve weight recommendations for <strong>{machineName}</strong>
          </DialogDescription>
        </DialogHeader>

        {renderStep()}

        {step === 'confirm' && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClose} className="sm:flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="sm:flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
            >
              <Coins className="h-4 w-4 mr-2" />
              Confirm & Earn 25 Coins
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
