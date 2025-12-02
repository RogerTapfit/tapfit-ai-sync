import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, Loader2, Sparkles } from 'lucide-react';
import { FoodItem } from '@/hooks/useNutrition';
import { toast } from 'sonner';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface AIPhotoScannerProps {
  onAiFoodItemsFound?: (items: FoodItem[]) => void;
}

export const AIPhotoScanner: React.FC<AIPhotoScannerProps> = ({ onAiFoodItemsFound }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');

  const ANALYSIS_STAGES = [
    { progress: 20, text: 'Processing image...', duration: 1500 },
    { progress: 50, text: 'Detecting food items...', duration: 2500 },
    { progress: 80, text: 'Estimating nutrition...', duration: 2000 },
    { progress: 100, text: 'Complete!', duration: 500 }
  ];

  React.useEffect(() => {
    if (isAnalyzing) {
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
  }, [isAnalyzing]);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Return the full data URL for proper handling
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const analyzePhoto = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const base64 = await convertToBase64(file);
      
      const { data, error } = await supabase.functions.invoke('analyzeFood', {
        body: { 
          imageBase64: base64,
          mealType: 'snack' // default meal type for quick scan
        }
      });

      if (error) throw error;

      if (data?.food_items?.length > 0) {
        onAiFoodItemsFound?.(data.food_items);
        toast.success(`Found ${data.food_items.length} food item${data.food_items.length > 1 ? 's' : ''}!`);
      } else {
        toast.error('No food items detected. Please try taking a clearer photo with better lighting.');
      }
    } catch (error) {
      console.error('Error analyzing photo:', error);
      toast.error('Failed to analyze photo. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoCapture = async (source: 'camera' | 'gallery') => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Web fallback - Mobile Safari requires user gesture
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = false;
        
        // For mobile camera access, use capture attribute
        if (source === 'camera') {
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
            await analyzePhoto(file);
          }
          // Clean up
          document.body.removeChild(input);
        };
        
        // Trigger click - this must happen synchronously from user gesture
        input.click();
        return;
      }

      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos
      });

      if (image.dataUrl) {
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `${source}-photo.jpg`, { type: 'image/jpeg' });
        await analyzePhoto(file);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Failed to capture photo. Please try again.');
    }
  };

  return (
    <Card className="glow-card border-gradient">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Photo Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => handlePhotoCapture('camera')}
              disabled={isAnalyzing}
              className="w-full h-20 flex flex-col items-center gap-2 glow-hover border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            >
              <Camera className="h-6 w-6 text-primary" />
              <span className="font-semibold">Take Photo</span>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => handlePhotoCapture('gallery')}
              disabled={isAnalyzing}
              className="w-full h-20 flex flex-col items-center gap-2 glow-hover border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5"
            >
              <Upload className="h-6 w-6 text-green-500" />
              <span className="font-semibold">Upload Photo</span>
            </Button>
          </motion.div>
        </div>

        {isAnalyzing && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="py-5">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div>
                    <h3 className="font-semibold text-lg">Analyzing Photo</h3>
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
      </CardContent>
    </Card>
  );
};