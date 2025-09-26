import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, Upload, Loader2, X, Zap, Star, AlertTriangle,
  CheckCircle, Info, Sparkles, Shield, Utensils, Settings,
  Beaker, Atom, Droplet, Factory, ChevronDown, ChevronRight
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
  detailed_processing: {
    nova_score: number;
    classification: string;
    processing_methods: string[];
    why_processed: string;
    industrial_ingredients?: string[];
  };
  chemical_analysis: {
    food_dyes: Array<{
      name: string;
      chemical_name?: string;
      purpose: string;
      health_concerns: string[];
      banned_countries?: string[];
      safety_rating: string;
    }>;
    preservatives: Array<{
      name: string;
      chemical_formula?: string;
      purpose: string;
      health_concerns: string[];
      safety_rating: string;
    }>;
    flavor_enhancers: Array<{
      name: string;
      details: string;
      concern: string;
      transparency_issue?: boolean;
    }>;
    emulsifiers: Array<{
      name: string;
      purpose: string;
      health_concerns: string[];
      safety_rating: string;
    }>;
    artificial_ingredients: string[];
    total_additives_count: number;
  };
  sugar_analysis: {
    primary_sweetener: string;
    sweetener_type: string;
    chemical_structure?: string;
    health_impact: string;
    vs_natural_sugar?: string;
    metabolic_effects: string[];
    natural_alternatives: string[];
    glycemic_impact: string;
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
    chemical_load?: string;
    oxidative_stress_potential?: string;
    endocrine_disruption_risk?: string;
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
  const [expandedChemicalSection, setExpandedChemicalSection] = useState<string | null>(null);

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
    setExpandedChemicalSection(null);
  };

  const handleOpenFoodLogModal = () => {
    setShowFoodLogModal(true);
  };

  const handleFoodLogSuccess = async () => {
    // Upload photo if available and notify parent
    if (analysisResult && onProductFound && selectedImage) {
      try {
        const { FoodPhotoUploadService } = await import('../services/foodPhotoUploadService');
        
        console.log('Uploading product photo...');
        const uploadResult = await FoodPhotoUploadService.uploadFoodPhoto(
          selectedImage,
          'product',
          `product_${Date.now()}.jpg`
        );
        
        if (uploadResult.success) {
          console.log('Product photo uploaded successfully:', uploadResult);
        }
      } catch (error) {
        console.error('Failed to upload product photo:', error);
      }
      
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

                {/* Processing Deep Dive */}
                {analysisResult.detailed_processing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border-2 border-orange-500/40 rounded-xl p-6 shadow-xl"
                  >
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-lg text-orange-600">
                      <Factory className="h-5 w-5 animate-pulse" />
                      🏭 Processing Level Analysis
                    </h4>
                    
                    <div className="space-y-4">
                      {/* NOVA Score */}
                      <div className="flex items-center justify-between p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                        <div>
                          <span className="font-bold text-lg text-orange-600">NOVA Score: {analysisResult.detailed_processing.nova_score}/4</span>
                          <p className="text-sm text-orange-700">{analysisResult.detailed_processing.classification}</p>
                        </div>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                          analysisResult.detailed_processing.nova_score >= 4 ? 'bg-red-500/80 text-white' :
                          analysisResult.detailed_processing.nova_score >= 3 ? 'bg-orange-500/80 text-white' :
                          analysisResult.detailed_processing.nova_score >= 2 ? 'bg-yellow-500/80 text-white' :
                          'bg-green-500/80 text-white'
                        }`}>
                          {analysisResult.detailed_processing.nova_score}
                        </div>
                      </div>

                      {/* Processing Methods */}
                      <div>
                        <h5 className="font-semibold text-orange-600 mb-2">🔬 Processing Methods Used:</h5>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.detailed_processing.processing_methods.map((method, index) => (
                            <Badge key={index} className="bg-orange-500/20 text-orange-700 border-orange-500/50">
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Why Processed */}
                      <div className="p-3 bg-orange-500/5 rounded-lg border-l-4 border-orange-500">
                        <p className="text-sm text-foreground font-medium">
                          <span className="text-orange-600 font-bold">Why it's processed: </span>
                          {analysisResult.detailed_processing.why_processed}
                        </p>
                      </div>

                      {/* Industrial Ingredients */}
                      {analysisResult.detailed_processing.industrial_ingredients && (
                        <div>
                          <h5 className="font-semibold text-orange-600 mb-2">🧪 Industrial Ingredients:</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {analysisResult.detailed_processing.industrial_ingredients.map((ingredient, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-red-500/10 rounded-md border border-red-500/20">
                                <Atom className="h-4 w-4 text-red-500" />
                                <span className="text-sm text-foreground">{ingredient}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Sugar Analysis Deep Dive */}
                {analysisResult.sugar_analysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-pink-500/20 to-purple-500/10 border-2 border-pink-500/40 rounded-xl p-6 shadow-xl"
                  >
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-lg text-pink-600">
                      <Droplet className="h-5 w-5 animate-pulse" />
                      🍯 Sugar Impact Analysis
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Primary Sweetener */}
                      <div className="p-4 bg-pink-500/10 rounded-lg border border-pink-500/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-pink-600">Primary Sweetener:</span>
                          <Badge className={`${
                            analysisResult.sugar_analysis.sweetener_type.includes('artificial') || 
                            analysisResult.sugar_analysis.sweetener_type.includes('processed') 
                              ? 'bg-red-500/20 text-red-700 border-red-500/50'
                              : 'bg-green-500/20 text-green-700 border-green-500/50'
                          }`}>
                            {analysisResult.sugar_analysis.sweetener_type}
                          </Badge>
                        </div>
                        <p className="text-lg font-semibold text-pink-700">{analysisResult.sugar_analysis.primary_sweetener}</p>
                        {analysisResult.sugar_analysis.chemical_structure && (
                          <p className="text-xs text-muted-foreground mt-1">🧬 {analysisResult.sugar_analysis.chemical_structure}</p>
                        )}
                      </div>

                      {/* Health Impact */}
                      <div className="p-3 bg-red-500/5 rounded-lg border-l-4 border-red-500">
                        <p className="text-sm text-foreground">
                          <span className="text-red-600 font-bold">Health Impact: </span>
                          {analysisResult.sugar_analysis.health_impact}
                        </p>
                        {analysisResult.sugar_analysis.vs_natural_sugar && (
                          <p className="text-sm text-foreground mt-2">
                            <span className="text-red-600 font-bold">vs Natural Sugar: </span>
                            {analysisResult.sugar_analysis.vs_natural_sugar}
                          </p>
                        )}
                      </div>

                      {/* Metabolic Effects */}
                      <div>
                        <h5 className="font-semibold text-pink-600 mb-2">⚠️ Metabolic Effects:</h5>
                        <div className="grid grid-cols-1 gap-2">
                          {analysisResult.sugar_analysis.metabolic_effects.map((effect, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-red-500/10 rounded-md border border-red-500/20">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-foreground">{effect}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Glycemic Impact */}
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <span className="font-bold text-orange-600">Glycemic Impact: </span>
                        <span className="text-foreground">{analysisResult.sugar_analysis.glycemic_impact}</span>
                      </div>

                      {/* Natural Alternatives */}
                      <div>
                        <h5 className="font-semibold text-green-600 mb-2">💚 Natural Alternatives:</h5>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.sugar_analysis.natural_alternatives.map((alt, index) => (
                            <Badge key={index} className="bg-green-500/20 text-green-700 border-green-500/50">
                              {alt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Chemical Analysis Deep Dive */}
                {analysisResult.chemical_analysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-purple-500/20 to-blue-500/10 border-2 border-purple-500/40 rounded-xl p-6 shadow-xl"
                  >
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-lg text-purple-600">
                      <Beaker className="h-5 w-5 animate-pulse" />
                      🧪 Complete Chemical Breakdown ({analysisResult.chemical_analysis.total_additives_count} additives)
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Food Dyes */}
                      {analysisResult.chemical_analysis.food_dyes.length > 0 && (
                        <div className="border border-red-500/30 rounded-lg p-4 bg-red-500/5">
                          <button
                            onClick={() => setExpandedChemicalSection(expandedChemicalSection === 'dyes' ? null : 'dyes')}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <h5 className="font-semibold text-red-600 flex items-center gap-2">
                              🎨 Food Dyes ({analysisResult.chemical_analysis.food_dyes.length})
                            </h5>
                            {expandedChemicalSection === 'dyes' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          {expandedChemicalSection === 'dyes' && (
                            <div className="mt-3 space-y-3">
                              {analysisResult.chemical_analysis.food_dyes.map((dye, index) => (
                                <div key={index} className="p-3 bg-red-500/10 rounded-md border border-red-500/20">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-red-700">{dye.name}</span>
                                    <Badge className={`${
                                      dye.safety_rating === 'high_concern' ? 'bg-red-600/80 text-white' :
                                      dye.safety_rating === 'moderate_concern' ? 'bg-orange-500/80 text-white' :
                                      'bg-yellow-500/80 text-white'
                                    }`}>
                                      {dye.safety_rating.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  {dye.chemical_name && (
                                    <p className="text-xs text-muted-foreground mb-1">🧬 {dye.chemical_name}</p>
                                  )}
                                  <p className="text-sm text-foreground mb-2">
                                    <span className="font-medium">Purpose:</span> {dye.purpose}
                                  </p>
                                  <div className="space-y-1">
                                    <span className="font-medium text-red-600">Health Concerns:</span>
                                    {dye.health_concerns.map((concern, i) => (
                                      <div key={i} className="flex items-center gap-2 text-sm">
                                        <AlertTriangle className="h-3 w-3 text-red-500" />
                                        <span>{concern}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {dye.banned_countries && (
                                    <p className="text-xs text-red-600 mt-2">
                                      <span className="font-medium">Restrictions:</span> {dye.banned_countries.join(', ')}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Preservatives */}
                      {analysisResult.chemical_analysis.preservatives.length > 0 && (
                        <div className="border border-orange-500/30 rounded-lg p-4 bg-orange-500/5">
                          <button
                            onClick={() => setExpandedChemicalSection(expandedChemicalSection === 'preservatives' ? null : 'preservatives')}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <h5 className="font-semibold text-orange-600 flex items-center gap-2">
                              🛡️ Preservatives ({analysisResult.chemical_analysis.preservatives.length})
                            </h5>
                            {expandedChemicalSection === 'preservatives' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          {expandedChemicalSection === 'preservatives' && (
                            <div className="mt-3 space-y-3">
                              {analysisResult.chemical_analysis.preservatives.map((preservative, index) => (
                                <div key={index} className="p-3 bg-orange-500/10 rounded-md border border-orange-500/20">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-orange-700">{preservative.name}</span>
                                    <Badge className={`${
                                      preservative.safety_rating === 'high_concern' ? 'bg-red-600/80 text-white' :
                                      preservative.safety_rating === 'moderate_concern' ? 'bg-orange-500/80 text-white' :
                                      'bg-yellow-500/80 text-white'
                                    }`}>
                                      {preservative.safety_rating.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  {preservative.chemical_formula && (
                                    <p className="text-xs text-muted-foreground mb-1">⚗️ {preservative.chemical_formula}</p>
                                  )}
                                  <p className="text-sm text-foreground mb-2">
                                    <span className="font-medium">Purpose:</span> {preservative.purpose}
                                  </p>
                                  <div className="space-y-1">
                                    <span className="font-medium text-orange-600">Health Concerns:</span>
                                    {preservative.health_concerns.map((concern, i) => (
                                      <div key={i} className="flex items-center gap-2 text-sm">
                                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                                        <span>{concern}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Flavor Enhancers */}
                      {analysisResult.chemical_analysis.flavor_enhancers.length > 0 && (
                        <div className="border border-yellow-500/30 rounded-lg p-4 bg-yellow-500/5">
                          <button
                            onClick={() => setExpandedChemicalSection(expandedChemicalSection === 'flavors' ? null : 'flavors')}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <h5 className="font-semibold text-yellow-600 flex items-center gap-2">
                              👅 Flavor Enhancers ({analysisResult.chemical_analysis.flavor_enhancers.length})
                            </h5>
                            {expandedChemicalSection === 'flavors' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          {expandedChemicalSection === 'flavors' && (
                            <div className="mt-3 space-y-3">
                              {analysisResult.chemical_analysis.flavor_enhancers.map((flavor, index) => (
                                <div key={index} className="p-3 bg-yellow-500/10 rounded-md border border-yellow-500/20">
                                  <span className="font-bold text-yellow-700">{flavor.name}</span>
                                  {flavor.transparency_issue && (
                                    <Badge className="ml-2 bg-red-500/20 text-red-700 border-red-500/50 text-xs">
                                      ⚠️ Transparency Issue
                                    </Badge>
                                  )}
                                  <p className="text-sm text-foreground mt-1">{flavor.details}</p>
                                  <p className="text-sm text-yellow-600 mt-2">
                                    <span className="font-medium">Concern:</span> {flavor.concern}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Emulsifiers */}
                      {analysisResult.chemical_analysis.emulsifiers.length > 0 && (
                        <div className="border border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
                          <button
                            onClick={() => setExpandedChemicalSection(expandedChemicalSection === 'emulsifiers' ? null : 'emulsifiers')}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <h5 className="font-semibold text-blue-600 flex items-center gap-2">
                              🌊 Emulsifiers & Stabilizers ({analysisResult.chemical_analysis.emulsifiers.length})
                            </h5>
                            {expandedChemicalSection === 'emulsifiers' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          {expandedChemicalSection === 'emulsifiers' && (
                            <div className="mt-3 space-y-3">
                              {analysisResult.chemical_analysis.emulsifiers.map((emulsifier, index) => (
                                <div key={index} className="p-3 bg-blue-500/10 rounded-md border border-blue-500/20">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-blue-700">{emulsifier.name}</span>
                                    <Badge className={`${
                                      emulsifier.safety_rating === 'high_concern' ? 'bg-red-600/80 text-white' :
                                      emulsifier.safety_rating === 'moderate_concern' ? 'bg-orange-500/80 text-white' :
                                      'bg-yellow-500/80 text-white'
                                    }`}>
                                      {emulsifier.safety_rating.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-foreground mb-2">
                                    <span className="font-medium">Purpose:</span> {emulsifier.purpose}
                                  </p>
                                  <div className="space-y-1">
                                    <span className="font-medium text-blue-600">Health Concerns:</span>
                                    {emulsifier.health_concerns.map((concern, i) => (
                                      <div key={i} className="flex items-center gap-2 text-sm">
                                        <AlertTriangle className="h-3 w-3 text-blue-500" />
                                        <span>{concern}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Artificial Ingredients Summary */}
                      {analysisResult.chemical_analysis.artificial_ingredients.length > 0 && (
                        <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                          <h5 className="font-semibold text-purple-600 mb-2">🧬 All Artificial Ingredients:</h5>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.chemical_analysis.artificial_ingredients.map((ingredient, index) => (
                              <Badge key={index} className="bg-purple-500/20 text-purple-700 border-purple-500/50 text-xs">
                                {ingredient}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Safety Information */}
                {(analysisResult.safety.concerning_additives.length > 0 || 
                  analysisResult.safety.forever_chemicals || 
                  analysisResult.safety.chemical_load) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-br from-red-600/20 to-purple-600/20 border-2 border-red-500/50 rounded-xl p-6 shadow-xl"
                  >
                    <h4 className="font-bold text-red-600 mb-4 flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 animate-pulse" />
                      🚨 Advanced Safety Analysis
                    </h4>
                    
                    <div className="space-y-4">
                      {analysisResult.safety.chemical_load && (
                        <div className="p-3 bg-red-500/10 rounded-lg border-l-4 border-red-500">
                          <span className="font-bold text-red-600">Chemical Load: </span>
                          <span className="text-foreground">{analysisResult.safety.chemical_load}</span>
                        </div>
                      )}
                      
                      {analysisResult.safety.oxidative_stress_potential && (
                        <div className="p-3 bg-orange-500/10 rounded-lg border-l-4 border-orange-500">
                          <span className="font-bold text-orange-600">Oxidative Stress Potential: </span>
                          <span className="text-foreground">{analysisResult.safety.oxidative_stress_potential}</span>
                        </div>
                      )}
                      
                      {analysisResult.safety.endocrine_disruption_risk && (
                        <div className="p-3 bg-purple-500/10 rounded-lg border-l-4 border-purple-500">
                          <span className="font-bold text-purple-600">Endocrine Disruption Risk: </span>
                          <span className="text-foreground">{analysisResult.safety.endocrine_disruption_risk}</span>
                        </div>
                      )}
                      
                      {analysisResult.safety.forever_chemicals && (
                        <div className="p-3 bg-red-600/20 rounded-lg border border-red-600/50">
                          <div className="flex items-center gap-2 text-red-700 font-bold">
                            <AlertTriangle className="h-5 w-5" />
                            ⚠️ May contain forever chemicals (PFAS)
                          </div>
                        </div>
                      )}
                      
                      {analysisResult.safety.concerning_additives.length > 0 && (
                        <div>
                          <span className="font-bold text-red-600">Concerning additives: </span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {analysisResult.safety.concerning_additives.map((additive, index) => (
                              <Badge key={index} className="bg-red-500/20 text-red-700 border-red-500/50">
                                {additive}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-600">Processing level: </span>
                        <Badge className="bg-red-200 text-red-800 border-red-300 hover:bg-red-100">
                          {analysisResult.safety.processing_level}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                )}

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
          selectedImage={selectedImage}
        />
      )}
    </AnimatePresence>
  );
};