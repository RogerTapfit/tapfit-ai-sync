import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, Upload, Loader2, X, Zap, Star, AlertTriangle,
  CheckCircle, Info, Sparkles, Shield, Utensils
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/hooks/useNutrition';

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
      input.accept = 'image/*';
      if (source === 'camera') {
        input.setAttribute('capture', 'environment');
      }
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const base64 = await convertToBase64(file);
            const dataUrl = `data:${file.type};base64,${base64}`;
            setSelectedImage(dataUrl);
            await analyzeProduct(base64);
          } catch (error) {
            toast.error('Failed to process image');
          }
        }
      };
      
      input.click();
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A+':
      case 'A': return 'text-green-600 bg-green-100 border-green-200';
      case 'A-':
      case 'B+': return 'text-green-500 bg-green-50 border-green-200';
      case 'B':
      case 'B-': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'C+':
      case 'C': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'C-':
      case 'D+':
      case 'D': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
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
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="h-6 w-6 text-primary" />
                </motion.div>
                Smart Product Analyzer
              </CardTitle>
              {!embedded && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              AI-powered health analysis of any product using computer vision
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto p-6">
            {!analysisResult && !isAnalyzing && (
              <div className="text-center space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => handlePhotoCapture('camera')}
                      className="w-full h-24 flex flex-col gap-2 text-lg"
                      size="lg"
                    >
                      <Camera className="h-8 w-8" />
                      Take Photo
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => handlePhotoCapture('gallery')}
                      variant="outline"
                      className="w-full h-24 flex flex-col gap-2 text-lg"
                      size="lg"
                    >
                      <Upload className="h-8 w-8" />
                      Upload Photo
                    </Button>
                  </motion.div>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2 justify-center">
                    <Info className="h-4 w-4" />
                    <span>Capture any product for comprehensive health analysis</span>
                  </div>
                  <p className="text-xs">
                    Works with packaged foods, beverages, supplements, and fresh produce
                  </p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4 py-8"
              >
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Analyzing Product...</h3>
                  <p className="text-muted-foreground">
                    Our AI is examining nutrition, safety, and health impact
                  </p>
                </div>
                {selectedImage && (
                  <div className="flex justify-center">
                    <img
                      src={selectedImage}
                      alt="Analyzing product"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-primary/20"
                    />
                  </div>
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
                <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{analysisResult.product.name}</h3>
                      {analysisResult.product.brand && (
                        <p className="text-muted-foreground">{analysisResult.product.brand}</p>
                      )}
                      {analysisResult.product.size && (
                        <p className="text-sm text-muted-foreground">{analysisResult.product.size}</p>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold border-2 ${getGradeColor(analysisResult.health_grade.letter)}`}>
                        {analysisResult.health_grade.letter}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Health Score: {analysisResult.health_grade.score}/100
                      </p>
                    </div>
                  </div>

                  {selectedImage && (
                    <div className="flex justify-center">
                      <img
                        src={selectedImage}
                        alt={analysisResult.product.name}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                {/* Nutrition Facts */}
                <div className="bg-background rounded-xl border p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Nutrition per {analysisResult.nutrition.serving_size}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-bold text-lg">{analysisResult.nutrition.per_serving.calories}</div>
                      <div className="text-xs text-muted-foreground">Calories</div>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-bold text-lg">{analysisResult.nutrition.per_serving.protein_g}g</div>
                      <div className="text-xs text-muted-foreground">Protein</div>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-bold text-lg">{analysisResult.nutrition.per_serving.carbs_g}g</div>
                      <div className="text-xs text-muted-foreground">Carbs</div>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-bold text-lg">{analysisResult.nutrition.per_serving.fat_g}g</div>
                      <div className="text-xs text-muted-foreground">Fat</div>
                    </div>
                  </div>
                </div>

                {/* Health Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pros */}
                  {analysisResult.analysis.pros.length > 0 && (
                    <div className="bg-green-50/50 border border-green-200 rounded-xl p-4">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Health Benefits
                      </h4>
                      <ul className="text-sm space-y-1">
                        {analysisResult.analysis.pros.map((pro, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cons */}
                  {analysisResult.analysis.cons.length > 0 && (
                    <div className="bg-red-50/50 border border-red-200 rounded-xl p-4">
                      <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Health Concerns
                      </h4>
                      <ul className="text-sm space-y-1">
                        {analysisResult.analysis.cons.map((con, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Safety & Alternatives */}
                <div className="space-y-4">
                  {/* Safety Info */}
                  {(analysisResult.safety.concerning_additives.length > 0 || analysisResult.safety.forever_chemicals) && (
                    <div className="bg-yellow-50/50 border border-yellow-200 rounded-xl p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Safety Information
                      </h4>
                      <div className="text-sm space-y-2">
                        {analysisResult.safety.forever_chemicals && (
                          <div className="text-red-600 font-medium">⚠️ May contain forever chemicals (PFAS)</div>
                        )}
                        {analysisResult.safety.concerning_additives.length > 0 && (
                          <div>
                            <span className="font-medium">Concerning additives: </span>
                            {analysisResult.safety.concerning_additives.join(', ')}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Processing level: </span>
                          <Badge variant="outline">{analysisResult.safety.processing_level}</Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alternatives */}
                  {analysisResult.analysis.alternatives.length > 0 && (
                    <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Healthier Alternatives
                      </h4>
                      <ul className="text-sm space-y-1">
                        {analysisResult.analysis.alternatives.map((alt, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{alt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleAddToMeal} className="flex-1 gap-2">
                    <Zap className="h-4 w-4" />
                    Add to Meal
                  </Button>
                  <Button variant="outline" onClick={resetAnalyzer} className="gap-2">
                    <Camera className="h-4 w-4" />
                    Analyze Another
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};