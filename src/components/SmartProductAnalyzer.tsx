import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, Upload, Loader2, X, Zap, Star, AlertTriangle,
  CheckCircle, Info, Sparkles, Shield, Utensils, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/hooks/useNutrition';
import { AddToFoodLogModal } from './AddToFoodLogModal';
import { processImageFile } from '../utils/heicConverter';

interface ProductAnalysis {
  product: {
    name: string;
    brand?: string;
    size?: string;
    confidence: number;
  };
  nutrition: {
    serving_size: string;
    per_serving: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      fiber_g?: number;
      sugars_g?: number;
      sodium_mg?: number;
    };
  };
  health_grade: {
    letter: string;
    score: number;
    breakdown: {
      nutritional_quality: number;
      ingredient_quality: number;
      safety_score: number;
      processing_level: number;
    };
  };
  analysis: {
    pros: string[];
    cons: string[];
    concerns: string[];
    alternatives: string[];
  };
  safety: {
    forever_chemicals: boolean;
    concerning_additives: string[];
    allergens: string[];
    processing_level: string;
  };
  ingredients_analysis?: string;
}

interface SmartProductAnalyzerProps {
  onProductFound?: (foodItem: FoodItem) => void;
  onClose?: () => void;
  isOpen?: boolean;
  embedded?: boolean;
}

export const SmartProductAnalyzer: React.FC<SmartProductAnalyzerProps> = ({
  onProductFound,
  onClose,
  isOpen = false,
  embedded = false
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysis | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFoodLogModal, setShowFoodLogModal] = useState(false);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const analyzeProduct = async (imageBase64: string) => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyzeProduct', {
        body: { imageBase64 }
      });

      if (error) {
        console.error('Analysis error:', error);
        toast.error('Failed to analyze product. Please try again.');
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setAnalysisResult(data);
      toast.success('Product analyzed successfully!');
      
    } catch (error) {
      console.error('Error analyzing product:', error);
      toast.error('Failed to analyze product. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoCapture = async (source: 'camera' | 'gallery') => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await CapCamera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        });

        if (image.base64String) {
          setSelectedImage(`data:image/jpeg;base64,${image.base64String}`);
          await analyzeProduct(image.base64String);
        }
      } catch (error) {
        console.error('Camera error:', error);
        toast.error('Failed to capture image');
      }
    } else {
      // Web fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*'; // Accept all image formats including HEIC
      if (source === 'camera') {
        input.setAttribute('capture', 'environment');
      }
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            // Convert HEIC files if needed
            const processedFile = await processImageFile(file);
            
            const base64 = await convertToBase64(processedFile);
            const dataUrl = `data:${processedFile.type};base64,${base64}`;
            setSelectedImage(dataUrl);
            await analyzeProduct(base64);
          } catch (error) {
            console.error('Failed to process image:', error);
            toast.error('Failed to process image. Please try again.');
          }
        }
      };
      
      input.click();
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A+':
      case 'A': return 'text-stats-exercises bg-stats-exercises/20 border-stats-exercises shadow-lg shadow-stats-exercises/30';
      case 'A-':
      case 'B+': return 'text-stats-exercises bg-stats-exercises/15 border-stats-exercises/80 shadow-md shadow-stats-exercises/20';
      case 'B':
      case 'B-': return 'text-stats-calories bg-stats-calories/20 border-stats-calories shadow-md shadow-stats-calories/30';
      case 'C+':
      case 'C': return 'text-stats-duration bg-stats-duration/20 border-stats-duration shadow-md shadow-stats-duration/30';
      case 'C-':
      case 'D+':
      case 'D': return 'text-stats-heart bg-stats-heart/20 border-stats-heart shadow-lg shadow-stats-heart/40';
      default: return 'text-muted-foreground bg-muted/20 border-muted shadow-md';
    }
  };

  const convertToFoodItem = (analysis: ProductAnalysis): FoodItem => {
    const nutrition = analysis.nutrition.per_serving;
    return {
      name: `${analysis.product.brand ? analysis.product.brand + ' ' : ''}${analysis.product.name}`,
      quantity: analysis.nutrition.serving_size,
      calories: nutrition.calories,
      protein: nutrition.protein_g,
      carbs: nutrition.carbs_g,
      fat: nutrition.fat_g,
      confidence: analysis.product.confidence
    };
  };

  const handleAddToMeal = () => {
    if (analysisResult && onProductFound) {
      const foodItem = convertToFoodItem(analysisResult);
      onProductFound(foodItem);
      toast.success('Product added to meal!');
      resetAnalyzer();
      onClose?.();
    }
  };

  const resetAnalyzer = () => {
    setAnalysisResult(null);
    setSelectedImage(null);
    setIsAnalyzing(false);
  };

  const handleOpenFoodLogModal = () => {
    setShowFoodLogModal(true);
  };

  const handleFoodLogSuccess = () => {
    // Optional: Call onProductFound if parent component needs to be notified
    if (analysisResult && onProductFound) {
      const foodItem = convertToFoodItem(analysisResult);
      onProductFound(foodItem);
    }
    resetAnalyzer();
  };

  // For embedded mode, always show the component
  if (!embedded && !isOpen) return null;

  const containerClasses = embedded 
    ? "w-full" 
    : "fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4";

  const cardClasses = embedded 
    ? "w-full" 
    : "w-full max-w-4xl max-h-[90vh] overflow-hidden";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: embedded ? 1 : 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: embedded ? 1 : 0.9 }}
        className={containerClasses}
      >
        <Card className={cardClasses}>
          <CardHeader className="bg-gradient-to-br from-primary/20 via-stats-calories/10 to-stats-heart/10 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl bg-gradient-to-r from-primary to-stats-calories bg-clip-text text-transparent">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                  className="animate-food-glow"
                >
                  <Sparkles className="h-7 w-7 text-primary drop-shadow-lg" />
                </motion.div>
                Smart Product Analyzer
              </CardTitle>
              {!embedded && (
                <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-primary/20 hover:text-primary">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              ✨ AI-powered health analysis using advanced computer vision
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto p-6">
            {!analysisResult && !isAnalyzing && (
              <div className="text-center space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handlePhotoCapture('camera')}
                      className="w-full h-24 flex flex-col gap-2 text-lg glow-button bg-gradient-to-r from-primary to-stats-heart hover:from-primary-glow hover:to-stats-heart shadow-lg"
                      size="lg"
                    >
                      <Camera className="h-8 w-8 drop-shadow-sm" />
                      Take Photo
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handlePhotoCapture('gallery')}
                      variant="outline"
                      className="w-full h-24 flex flex-col gap-2 text-lg border-2 border-stats-duration/50 hover:border-stats-duration hover:bg-stats-duration/10 hover:text-stats-duration transition-all duration-300"
                      size="lg"
                    >
                      <Upload className="h-8 w-8" />
                      Upload Photo
                    </Button>
                  </motion.div>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-3 bg-gradient-to-r from-stats-exercises/10 to-stats-calories/10 p-4 rounded-xl border border-stats-exercises/20">
                  <div className="flex items-center gap-2 justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <Info className="h-5 w-5 text-stats-exercises" />
                    </motion.div>
                    <span className="font-medium text-foreground">Capture any product for comprehensive health analysis</span>
                  </div>
                  <p className="text-xs bg-background/50 p-2 rounded-lg">
                    🍎 Works with packaged foods, beverages, supplements, and fresh produce. Use JPG, PNG, or WEBP formats.
                  </p>
                </div>
              </div>
            )}

            {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-8 bg-gradient-to-br from-primary/5 via-stats-duration/5 to-stats-calories/5 rounded-2xl border border-primary/20"
                >
                  <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary animate-pulse-glow" />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 h-16 w-16 mx-auto rounded-full bg-primary/20 blur-md"
                    />
                  </div>
                  <div>
                    <motion.h3 
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="font-bold text-xl bg-gradient-to-r from-primary to-stats-calories bg-clip-text text-transparent"
                    >
                      🔍 Analyzing Product...
                    </motion.h3>
                    <p className="text-muted-foreground mt-2">
                      Our AI is examining nutrition facts, ingredients, and health impact
                    </p>
                  </div>
                  {selectedImage && (
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="flex justify-center"
                    >
                      <img
                        src={selectedImage}
                        alt="Analyzing product"
                        className="w-40 h-40 object-cover rounded-xl border-4 border-primary/30 shadow-2xl animate-pulse-glow"
                      />
                    </motion.div>
                  )}
                </motion.div>
            )}

            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Product Info & Grade */}
                <div className="bg-gradient-to-br from-primary/10 via-stats-calories/10 to-background/50 rounded-2xl p-6 space-y-4 border border-primary/20 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <motion.h3 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
                      >
                        {analysisResult.product.name}
                      </motion.h3>
                      {analysisResult.product.brand && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-stats-duration font-medium"
                        >
                          📦 {analysisResult.product.brand}
                        </motion.p>
                      )}
                      {analysisResult.product.size && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-sm text-muted-foreground bg-background/50 px-2 py-1 rounded-md inline-block mt-1"
                        >
                          📏 {analysisResult.product.size}
                        </motion.p>
                      )}
                    </div>
                    
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      className="text-center"
                    >
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl text-3xl font-bold border-4 shadow-2xl animate-pulse-glow ${getGradeColor(analysisResult.health_grade.letter)}`}>
                        {analysisResult.health_grade.letter}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 font-medium">
                        Health Score: <span className="text-primary font-bold">{analysisResult.health_grade.score}/100</span>
                      </p>
                    </motion.div>
                  </div>

                  {selectedImage && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex justify-center"
                    >
                      <img
                        src={selectedImage}
                        alt={analysisResult.product.name}
                        className="w-32 h-32 object-cover rounded-xl border-4 border-stats-exercises/50 shadow-lg"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Nutrition Facts */}
                <div className="bg-gradient-to-r from-background via-stats-exercises/5 to-background rounded-2xl border-2 border-stats-exercises/30 p-6 shadow-xl">
                  <motion.h4 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-bold mb-4 flex items-center gap-2 text-lg"
                  >
                    <Utensils className="h-5 w-5 text-stats-exercises animate-pulse" />
                    <span className="bg-gradient-to-r from-stats-exercises to-stats-calories bg-clip-text text-transparent">
                      🥄 Nutrition per {analysisResult.nutrition.serving_size}
                    </span>
                  </motion.h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-center p-4 bg-gradient-to-br from-stats-calories/20 to-stats-calories/5 rounded-xl border border-stats-calories/30 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="font-bold text-2xl text-stats-calories mb-1">{analysisResult.nutrition.per_serving.calories}</div>
                      <div className="text-xs font-medium text-stats-calories/80">🔥 Calories</div>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center p-4 bg-gradient-to-br from-stats-heart/20 to-stats-heart/5 rounded-xl border border-stats-heart/30 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="font-bold text-2xl text-stats-heart mb-1">{analysisResult.nutrition.per_serving.protein_g}g</div>
                      <div className="text-xs font-medium text-stats-heart/80">💪 Protein</div>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-center p-4 bg-gradient-to-br from-stats-duration/20 to-stats-duration/5 rounded-xl border border-stats-duration/30 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="font-bold text-2xl text-stats-duration mb-1">{analysisResult.nutrition.per_serving.carbs_g}g</div>
                      <div className="text-xs font-medium text-stats-duration/80">🌾 Carbs</div>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-center p-4 bg-gradient-to-br from-stats-exercises/20 to-stats-exercises/5 rounded-xl border border-stats-exercises/30 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="font-bold text-2xl text-stats-exercises mb-1">{analysisResult.nutrition.per_serving.fat_g}g</div>
                      <div className="text-xs font-medium text-stats-exercises/80">🥑 Fat</div>
                    </motion.div>
                  </div>
                </div>

                {/* Health Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pros */}
                  {analysisResult.analysis.pros.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-gradient-to-br from-stats-exercises/20 to-stats-exercises/5 border-2 border-stats-exercises/40 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <h4 className="font-bold text-stats-exercises mb-3 flex items-center gap-2 text-lg">
                        <CheckCircle className="h-5 w-5 animate-pulse" />
                        ✅ Health Benefits
                      </h4>
                      <ul className="text-sm space-y-2">
                        {analysisResult.analysis.pros.map((pro, index) => (
                          <motion.li 
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="flex items-start gap-3 bg-stats-exercises/10 p-2 rounded-lg"
                          >
                            <span className="text-stats-exercises mt-0.5 font-bold">✓</span>
                            <span className="text-foreground font-medium">{pro}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Cons */}
                  {analysisResult.analysis.cons.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-gradient-to-br from-stats-heart/20 to-stats-heart/5 border-2 border-stats-heart/40 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <h4 className="font-bold text-stats-heart mb-3 flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                        ⚠️ Health Concerns
                      </h4>
                      <ul className="text-sm space-y-2">
                        {analysisResult.analysis.cons.map((con, index) => (
                          <motion.li 
                            key={index}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="flex items-start gap-3 bg-stats-heart/10 p-2 rounded-lg"
                          >
                            <span className="text-stats-heart mt-0.5 font-bold">⚠</span>
                            <span className="text-foreground font-medium">{con}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>

                {/* Safety & Alternatives */}
                <div className="space-y-4">
                  {/* Safety Info */}
                  {(analysisResult.safety.concerning_additives.length > 0 || analysisResult.safety.forever_chemicals) && (
                     <div className="bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-500/50 rounded-xl p-4 shadow-lg shadow-purple-500/20">
                       <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Safety Information
                      </h4>
                       <div className="text-sm space-y-2 text-white">
                         {analysisResult.safety.forever_chemicals && (
                           <div className="text-yellow-300 font-medium">⚠️ May contain forever chemicals (PFAS)</div>
                         )}
                         {analysisResult.safety.concerning_additives.length > 0 && (
                           <div>
                             <span className="font-medium">Concerning additives: </span>
                             {analysisResult.safety.concerning_additives.join(', ')}
                           </div>
                         )}
                         <div>
                           <span className="font-medium">Processing level: </span>
                           <Badge className="bg-purple-200 text-purple-800 border-purple-300 hover:bg-purple-100">{analysisResult.safety.processing_level}</Badge>
                         </div>
                       </div>
                    </div>
                  )}

                  {/* Alternatives */}
                  {analysisResult.analysis.alternatives.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-gradient-to-br from-stats-duration/20 to-stats-duration/5 border-2 border-stats-duration/40 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 col-span-full"
                    >
                      <h4 className="font-bold text-stats-duration mb-3 flex items-center gap-2 text-lg">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Star className="h-5 w-5 animate-pulse" />
                        </motion.div>
                        💡 Healthier Alternatives
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysisResult.analysis.alternatives.map((alt, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + index * 0.1 }}
                            className="flex items-center gap-3 bg-stats-duration/10 p-3 rounded-lg border border-stats-duration/20 hover:bg-stats-duration/15 transition-all duration-200"
                          >
                            <div className="w-2 h-2 rounded-full bg-stats-duration animate-pulse"></div>
                            <span className="text-foreground font-medium">{alt}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Action Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4 pt-6"
                >
                  <Button
                    onClick={handleOpenFoodLogModal}
                    className="flex-1 h-14 text-lg glow-button bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-xl"
                    size="lg"
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    📝 Add to Food Log
                  </Button>
                  
                  <Button
                    onClick={resetAnalyzer}
                    variant="outline"
                    className="flex-1 h-14 text-lg border-2 border-stats-duration/50 hover:border-stats-duration hover:bg-stats-duration/10 hover:text-stats-duration transition-all duration-300"
                    size="lg"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    🔍 Analyze Another
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add to Food Log Modal */}
      {analysisResult && (
        <AddToFoodLogModal
          isOpen={showFoodLogModal}
          onClose={() => setShowFoodLogModal(false)}
          productAnalysis={analysisResult}
          onSuccess={handleFoodLogSuccess}
        />
      )}
    </AnimatePresence>
  );
};