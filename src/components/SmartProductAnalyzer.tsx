import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, Upload, Loader2, X, Zap, Star, AlertTriangle,
  CheckCircle, Info, Sparkles, Shield, Utensils, Settings,
  Beaker, Atom, Droplet, Factory, ChevronDown, ChevronRight, Pill, Clock, Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/hooks/useNutrition';
import { AddToFoodLogModal } from './AddToFoodLogModal';
import { processImageFile } from '../utils/heicConverter';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useChatbotContext } from '@/contexts/ChatbotContext';

interface SupplementAnalysis {
  dosage_form?: string;
  serving_size?: string;
  servings_per_container?: number;
  quality_rating?: {
    grade: string;
    score: number;
    reasoning: string;
  };
  certifications?: Array<{
    name: string;
    verified: boolean;
    description?: string;
  }>;
  active_ingredients?: Array<{
    name: string;
    form?: string;
    amount?: string;
    unit?: string;
    daily_value?: string;
    bioavailability?: string;
    bioavailability_notes?: string;
    source?: string;
    benefits?: string[];
  }>;
  inactive_ingredients?: Array<{
    name: string;
    category?: string;
    concern?: string;
    notes?: string;
  }>;
  allergen_warnings?: string[];
  safety_info?: {
    max_safe_dose?: string;
    overdose_risk?: string;
    overdose_symptoms?: string[];
    fat_soluble?: boolean;
    accumulation_risk?: string;
    pregnancy_category?: string;
    age_restrictions?: string;
  };
  drug_interactions?: Array<{
    medication: string;
    severity?: string;
    effect?: string;
  }>;
  recommendations?: {
    best_time_to_take?: string;
    take_with_food?: boolean;
    food_pairings?: string;
    avoid_with?: string;
    storage_tips?: string;
  };
  overall_assessment?: {
    pros?: string[];
    cons?: string[];
    verdict?: string;
    alternative_suggestions?: string[];
  };
}

interface ProductAnalysis {
  product_type?: 'food' | 'beverage' | 'supplement' | 'medication' | 'vitamin';
  product: {
    name: string;
    brand?: string;
    size?: string;
    confidence: number;
  };
  nutrition: {
    serving_size: string;
    data_source?: 'label_extracted' | 'estimated' | 'partial_label' | 'database_verified' | 'database_scaled' | 'ai_extracted';
    database_name?: string | null;
    confidence_score?: number;
    original_database_serving?: string;
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
      fdc_number?: string;
      chemical_name?: string;
      chemical_formula?: string;
      color_display?: string;
      purpose: string;
      health_concerns: string[];
      regulatory_status?: {
        us_approved: boolean;
        eu_status: string;
        banned_countries?: string[];
        warning_required: boolean;
      };
      safety_rating: string;
      daily_acceptable_intake?: string;
      alternative_colorings?: string[];
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
    sweetener_breakdown?: {
      hfcs_type?: string;
      sweetener_category: string;
      manufacturing_process?: string;
      chemical_composition?: string;
    };
    metabolic_analysis?: {
      glycemic_index: number;
      fructose_percentage?: number;
      glucose_percentage?: number;
      blood_sugar_spike_score: number;
      insulin_response_score?: number;
      liver_metabolism_burden?: string;
    };
    health_impacts?: {
      immediate_effects: string[];
      chronic_effects: string[];
      addiction_potential?: string;
      vs_table_sugar?: string;
    };
    regulatory_concerns?: {
      mercury_contamination_risk?: string;
      gmo_source?: string;
      countries_restricting?: string[];
    };
    healthier_alternatives: Array<{
      name: string;
      glycemic_index?: number;
      benefits?: string;
    }>;
    sweetener_type?: string;
    chemical_structure?: string;
    health_impact?: string;
    vs_natural_sugar?: string;
    metabolic_effects?: string[];
    natural_alternatives?: string[];
    glycemic_impact?: string;
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
  supplement_analysis?: SupplementAnalysis;
}

interface SafetyData {
  hasActiveRecalls: boolean;
  recalls: Array<{
    recall_number: string;
    reason_for_recall: string;
    product_description: string;
    distribution_pattern: string;
    recall_initiation_date: string;
    status: string;
    classification: string;
    recalling_firm: string;
    voluntary_mandated: string;
  }>;
  safetyAlerts: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: string;
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
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysis | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFoodLogModal, setShowFoodLogModal] = useState(false);
  const [expandedChemicalSection, setExpandedChemicalSection] = useState<string | null>(null);
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null);
  const [isCheckingSafety, setIsCheckingSafety] = useState(false);
  const [userWeight, setUserWeight] = useState<number | null>(null);
  const [userGender, setUserGender] = useState<string | null>(null);
  
  // Package size selector state
  const [packageSize, setPackageSize] = useState<'single' | 'regular' | 'large' | 'custom'>('single');
  const [customServings, setCustomServings] = useState<number>(1);
  
  const { setPageContext } = useChatbotContext();
  
  // Register scanned product with AI coach context
  useEffect(() => {
    if (analysisResult) {
      const productType = analysisResult.product_type || 'food';
      const supp = analysisResult.supplement_analysis;
      
      let visibleContent = `SCANNED PRODUCT: ${analysisResult.product.name}
Brand: ${analysisResult.product.brand || 'Unknown'}
Type: ${productType}
Health Score: ${analysisResult.health_grade?.letter} (${analysisResult.health_grade?.score}/100)

NUTRITION (per ${analysisResult.nutrition?.serving_size}):
- Calories: ${analysisResult.nutrition?.per_serving?.calories}
- Protein: ${analysisResult.nutrition?.per_serving?.protein_g}g
- Carbs: ${analysisResult.nutrition?.per_serving?.carbs_g}g
- Fat: ${analysisResult.nutrition?.per_serving?.fat_g}g`;

      // Add supplement-specific info if applicable
      if (supp) {
        visibleContent += `

SUPPLEMENT ANALYSIS:
Quality Rating: ${supp.quality_rating?.grade || 'N/A'} (${supp.quality_rating?.score || 'N/A'}/100)
Reasoning: ${supp.quality_rating?.reasoning || 'Not available'}

Active Ingredients:
${supp.active_ingredients?.map(i => `- ${i.name}: ${i.amount || ''}${i.unit || ''}, Bioavailability: ${i.bioavailability || 'Unknown'}`).join('\n') || 'Not listed'}

Drug Interactions:
${supp.drug_interactions?.map(d => `- ${d.medication}: ${d.severity || 'Unknown'} severity - ${d.effect || 'See details'}`).join('\n') || 'None detected'}

Safety Info:
- Max Safe Dose: ${supp.safety_info?.max_safe_dose || 'Not specified'}
- Overdose Risk: ${supp.safety_info?.overdose_risk || 'Unknown'}
- Take with food: ${supp.recommendations?.take_with_food ? 'Yes' : 'No'}
- Best time: ${supp.recommendations?.best_time_to_take || 'Any time'}`;
      }

      // Add food-specific concerns if applicable
      if (analysisResult.analysis?.concerns?.length) {
        visibleContent += `

HEALTH CONCERNS:
${analysisResult.analysis.concerns.map(c => `- ${c}`).join('\n')}`;
      }

      if (analysisResult.chemical_analysis?.food_dyes?.length) {
        visibleContent += `

FOOD DYES DETECTED:
${analysisResult.chemical_analysis.food_dyes.map(d => `- ${d.name}: ${d.health_concerns?.join(', ') || 'None noted'}`).join('\n')}`;
      }

      setPageContext({
        pageName: 'Universal Product Analyzer',
        pageDescription: `User just scanned a ${productType}: ${analysisResult.product.name}`,
        visibleContent
      });
    }
  }, [analysisResult, setPageContext]);

  const ANALYSIS_STAGES = [
    { progress: 10, text: 'Uploading image...', duration: 1500 },
    { progress: 30, text: 'Reading product labels...', duration: 2000 },
    { progress: 50, text: 'Analyzing nutrition facts...', duration: 2500 },
    { progress: 70, text: 'Checking ingredients safety...', duration: 2000 },
    { progress: 90, text: 'Calculating health grade...', duration: 1500 },
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
      }, 2200);
      
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  // Fetch user profile for running calculation
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('weight_kg, gender')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserWeight(profile.weight_kg);
          setUserGender(profile.gender);
        }
      }
    };
    
    fetchUserProfile();
  }, []);

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
      
      // Check product safety after successful analysis
      await checkProductSafety(data.product.name, data.product.brand);
      
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
      // Web fallback - create and append input to DOM for browser compatibility
      console.log('Opening file picker for:', source);
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*'; // Accept all image formats including HEIC
      input.style.display = 'none'; // Hide the input
      
      if (source === 'camera') {
        input.setAttribute('capture', 'environment');
      }
      
      // Append to document body for browser compatibility
      document.body.appendChild(input);
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        console.log('File selected:', file?.name, file?.type, file?.size);
        
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
        
        // Clean up - remove from DOM
        document.body.removeChild(input);
      };
      
      // Also remove input if user cancels the file picker
      input.addEventListener('cancel', () => {
        console.log('File picker cancelled');
        document.body.removeChild(input);
      });
      
      // Trigger click after slight delay to ensure DOM attachment
      setTimeout(() => input.click(), 0);
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

  const checkProductSafety = async (productName: string, brandName?: string) => {
    setIsCheckingSafety(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('checkProductSafety', {
        body: { productName, brandName }
      });

      if (error) {
        console.error('Safety check error:', error);
        return;
      }

      if (data && !data.error) {
        setSafetyData(data);
        
        // Show safety alerts if any
        if (data.safetyAlerts && data.safetyAlerts.length > 0) {
          data.safetyAlerts.forEach((alert: string) => {
            if (alert.includes('CLASS I')) {
              toast.error(alert, { duration: 10000 });
            } else if (alert.includes('RECALL')) {
              toast.error(alert, { duration: 8000 });
            } else if (alert.includes('🔴') || alert.includes('⚠️')) {
              toast.error(alert, { duration: 6000 });
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking product safety:', error);
    } finally {
      setIsCheckingSafety(false);
    }
  };

  const resetAnalyzer = () => {
    setAnalysisResult(null);
    setSelectedImage(null);
    setIsAnalyzing(false);
    setExpandedChemicalSection(null);
    setSafetyData(null);
    setIsCheckingSafety(false);
    
    // Clear product context from chatbot
    setPageContext({
      pageName: 'Food Scanner',
      pageDescription: 'Universal Product Analyzer - ready to scan',
      visibleContent: undefined
    });
  };

  const handleOpenFoodLogModal = () => {
    setShowFoodLogModal(true);
  };

  const calculateRunningMiles = (calories: number) => {
    // Use user's weight or default to 70kg
    const weightKg = userWeight || 70;
    const weightLbs = weightKg * 2.20462;
    
    // Calories burned per mile varies by weight and gender
    // Base formula: ~0.63 * weight(lbs) per mile for average pace
    const effectiveGender = userGender || 'other';
    const genderMultiplier = effectiveGender === 'male' ? 0.63 : effectiveGender === 'female' ? 0.60 : 0.615;
    const caloriesPerMile = weightLbs * genderMultiplier;
    
    const miles = (calories / caloriesPerMile).toFixed(1);
    return { 
      miles, 
      weightLbs: Math.round(weightLbs),
      caloriesPerMile: Math.round(caloriesPerMile)
    };
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
                  {analysisResult?.product_type === 'supplement' || analysisResult?.product_type === 'medication' || analysisResult?.product_type === 'vitamin' ? (
                    <Pill className="h-7 w-7 text-primary drop-shadow-lg" />
                  ) : analysisResult?.product_type === 'beverage' ? (
                    <Droplet className="h-7 w-7 text-primary drop-shadow-lg" />
                  ) : (
                    <Sparkles className="h-7 w-7 text-primary drop-shadow-lg" />
                  )}
                </motion.div>
                Universal Product Analyzer
              </CardTitle>
              {!embedded && (
                <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-primary/20 hover:text-primary">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              ✨ AI-powered analysis for food, beverages, vitamins & medications
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
                    <span className="font-medium text-foreground">Scan ANY product for comprehensive analysis</span>
                  </div>
                  <p className="text-xs bg-background/50 p-2 rounded-lg">
                    🍎 Food & beverages • 💊 Vitamins & supplements • 💉 Medications
                  </p>
                </div>
              </div>
            )}

            {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 py-8 bg-gradient-to-br from-primary/5 via-stats-duration/5 to-stats-calories/5 rounded-2xl border border-primary/20"
                >
                  <div className="space-y-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Loader2 className="h-10 w-10 animate-spin text-primary animate-pulse-glow" />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-primary/20 blur-md"
                        />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-stats-calories bg-clip-text text-transparent">
                          Analyzing Product
                        </h3>
                        <p className="text-sm text-muted-foreground">{analysisStage}</p>
                      </div>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-primary font-medium">{analysisStage}</span>
                      <span className="text-muted-foreground">{analysisProgress}%</span>
                    </div>
                  </div>
                  {selectedImage && (
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="flex justify-center px-6"
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
                {/* Safety Alerts & Recalls */}
                {(safetyData?.safetyAlerts.length > 0 || safetyData?.hasActiveRecalls) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 space-y-4 border-2 shadow-xl ${
                      safetyData.riskLevel === 'critical' 
                        ? 'bg-red-500/10 border-red-500/50 shadow-red-500/30' 
                        : safetyData.riskLevel === 'high'
                        ? 'bg-orange-500/10 border-orange-500/50 shadow-orange-500/30'
                        : safetyData.riskLevel === 'medium'
                        ? 'bg-yellow-500/10 border-yellow-500/50 shadow-yellow-500/30'
                        : 'bg-blue-500/10 border-blue-500/50 shadow-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className={`h-6 w-6 ${
                        safetyData.riskLevel === 'critical' 
                          ? 'text-red-500' 
                          : safetyData.riskLevel === 'high'
                          ? 'text-orange-500'
                          : safetyData.riskLevel === 'medium'
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                      }`} />
                      <h4 className="text-lg font-bold">
                        {safetyData.riskLevel === 'critical' && '🚨 CRITICAL SAFETY ALERT'}
                        {safetyData.riskLevel === 'high' && '⚠️ HIGH RISK WARNINGS'}
                        {safetyData.riskLevel === 'medium' && '⚠️ SAFETY CONCERNS'}
                        {safetyData.riskLevel === 'low' && 'ℹ️ SAFETY INFORMATION'}
                      </h4>
                    </div>

                    {/* Active Recalls */}
                    {safetyData.hasActiveRecalls && (
                      <div className="space-y-3">
                        <h5 className="font-semibold text-red-600 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Active Product Recalls
                        </h5>
                        {safetyData.recalls.map((recall, index) => (
                          <div key={index} className="bg-background/50 rounded-lg p-4 border border-red-200/50">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <span className="font-medium text-red-700">
                                  Recall #{recall.recall_number}
                                </span>
                                <Badge variant="destructive" className="text-xs">
                                  {recall.classification}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{recall.reason_for_recall}</p>
                              <p className="text-xs text-muted-foreground">
                                Company: {recall.recalling_firm} | Date: {recall.recall_initiation_date}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Distribution: {recall.distribution_pattern}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chemical Safety Alerts */}
                    {safetyData.safetyAlerts.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-semibold flex items-center gap-2">
                          <Beaker className="h-5 w-5" />
                          Chemical Safety Alerts
                        </h5>
                        <div className="space-y-2">
                          {safetyData.safetyAlerts.map((alert, index) => (
                            <div key={index} className="bg-background/50 rounded-lg p-3 border border-current/20">
                              <p className="text-sm font-medium">{alert}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(safetyData.lastUpdated).toLocaleString()}
                    </p>
                  </motion.div>
                )}

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
                      <div className="mt-2 text-xs text-muted-foreground italic max-w-[180px]">
                        {(() => {
                          const grade = analysisResult.health_grade.letter.toUpperCase();
                          const nova = analysisResult.detailed_processing.nova_score;
                          const productType = analysisResult.product_type || 'food';
                          if (grade === 'D' || grade === 'F') {
                            if (nova >= 4) {
                              if (productType === 'beverage') return "⚠️ Ultra-processed beverage";
                              if (productType === 'supplement' || productType === 'medication') return "⚠️ Highly processed supplement";
                              return "⚠️ Ultra-processed food";
                            }
                            if (analysisResult.chemical_analysis.artificial_ingredients.length > 0) return "⚠️ Contains artificial ingredients";
                            return "⚠️ Highly processed food";
                          }
                          if (grade.startsWith('C')) return "Moderately processed";
                          if (grade.startsWith('B')) return "Lightly processed";
                          return "Whole food";
                        })()}
                      </div>
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
                    className="font-bold mb-4 flex items-center justify-between text-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-stats-exercises animate-pulse" />
                      <span className="bg-gradient-to-r from-stats-exercises to-stats-calories bg-clip-text text-transparent">
                        🥄 Nutrition per {analysisResult.nutrition.serving_size}
                      </span>
                    </div>
                    {/* Confidence Badge */}
                    {(() => {
                      const dataSource = analysisResult.nutrition.data_source;
                      const databaseName = analysisResult.nutrition.database_name;
                      if (dataSource === 'database_verified') {
                        return (
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ✓ {databaseName || 'Database'}
                          </Badge>
                        );
                      } else if (dataSource === 'label_extracted') {
                        return (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified from label
                          </Badge>
                        );
                      } else if (dataSource === 'ai_extracted') {
                        return (
                          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-xs">
                            <Info className="h-3 w-3 mr-1" />
                            AI extracted
                          </Badge>
                        );
                      } else if (dataSource === 'database_scaled') {
                        return (
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ✓ {databaseName} (scaled)
                          </Badge>
                        );
                      } else if (dataSource === 'partial_label') {
                        return (
                          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-xs">
                            <Info className="h-3 w-3 mr-1" />
                            Partial data
                          </Badge>
                        );
                      } else if (dataSource === 'estimated') {
                        return (
                          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Estimated values
                          </Badge>
                        );
                      }
                      return null;
                    })()}
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

                  {/* Package Size Selector */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 pt-4 border-t border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">📦 Package Size</span>
                      <div className="flex gap-1">
                        {(['single', 'regular', 'large', 'custom'] as const).map((size) => (
                          <Button
                            key={size}
                            variant={packageSize === size ? 'default' : 'outline'}
                            size="sm"
                            className={`text-xs px-2 py-1 h-7 ${packageSize === size ? 'bg-primary text-primary-foreground' : ''}`}
                            onClick={() => {
                              setPackageSize(size);
                              if (size !== 'custom') setCustomServings(size === 'single' ? 1 : size === 'regular' ? 2 : 4);
                            }}
                          >
                            {size === 'single' ? '1x' : size === 'regular' ? '2x' : size === 'large' ? '4x' : 'Custom'}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {packageSize === 'custom' && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-muted-foreground">Servings:</span>
                        <input
                          type="number"
                          min="0.5"
                          max="20"
                          step="0.5"
                          value={customServings}
                          onChange={(e) => setCustomServings(parseFloat(e.target.value) || 1)}
                          className="w-16 h-7 text-center text-sm border border-border rounded-md bg-background"
                        />
                      </div>
                    )}

                    {/* Show total if more than 1 serving */}
                    {(() => {
                      const multiplier = packageSize === 'single' ? 1 : packageSize === 'regular' ? 2 : packageSize === 'large' ? 4 : customServings;
                      if (multiplier > 1) {
                        const total = {
                          calories: Math.round(analysisResult.nutrition.per_serving.calories * multiplier),
                          protein: Math.round(analysisResult.nutrition.per_serving.protein_g * multiplier * 10) / 10,
                          carbs: Math.round(analysisResult.nutrition.per_serving.carbs_g * multiplier * 10) / 10,
                          fat: Math.round(analysisResult.nutrition.per_serving.fat_g * multiplier * 10) / 10,
                        };
                        return (
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <div className="text-xs font-medium text-muted-foreground mb-2">
                              📊 Total for {multiplier}x servings:
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div>
                                <div className="font-bold text-stats-calories">{total.calories}</div>
                                <div className="text-[10px] text-muted-foreground">cal</div>
                              </div>
                              <div>
                                <div className="font-bold text-stats-heart">{total.protein}g</div>
                                <div className="text-[10px] text-muted-foreground">protein</div>
                              </div>
                              <div>
                                <div className="font-bold text-stats-duration">{total.carbs}g</div>
                                <div className="text-[10px] text-muted-foreground">carbs</div>
                              </div>
                              <div>
                                <div className="font-bold text-stats-exercises">{total.fat}g</div>
                                <div className="text-[10px] text-muted-foreground">fat</div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </motion.div>

                  {/* Running Equivalent Section */}
                  {(() => {
                    const totalCalories = analysisResult.nutrition.per_serving.calories;
                    const runningData = calculateRunningMiles(totalCalories);
                    const usingDefaults = !userWeight;
                    const effectiveGender = userGender || 'other';
                    
                    return (
                      <div className="mt-6 pt-6 border-t border-border">
                        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <span className="text-2xl">🏃</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-1">Running Equivalent</h4>
                              <div className="text-2xl font-bold text-primary">
                                {runningData.miles} miles
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                To burn off these {Math.round(totalCalories)} calories
                              </p>
                              <div className="mt-2 pt-2 border-t border-primary/20 dark:border-primary/30">
                                <p className="text-xs text-muted-foreground">
                                  📊 {usingDefaults ? 'Estimated for' : 'Based on your profile:'} {runningData.weightLbs} lbs, {effectiveGender}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  🔥 ~{runningData.caloriesPerMile} cal/mile at moderate pace
                                </p>
                              </div>
                              {usingDefaults && (
                                <div className="mt-2 p-2 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded">
                                  <p className="text-xs text-amber-600 dark:text-amber-400">
                                    ⚠️ Using default weight (154 lbs). Complete your profile for personalized calculations.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Supplement Analysis Section - Only shows for supplements/vitamins/medications */}
                {analysisResult.supplement_analysis && (analysisResult.product_type === 'supplement' || analysisResult.product_type === 'medication' || analysisResult.product_type === 'vitamin') && (
                  <>
                    {/* Quality Rating */}
                    {analysisResult.supplement_analysis.quality_rating && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-background rounded-2xl p-6 border-2 border-purple-500/30 shadow-xl"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-lg flex items-center gap-2 text-purple-600">
                            <Star className="h-5 w-5 animate-pulse" />
                            💊 Supplement Quality Rating
                          </h4>
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl text-2xl font-bold border-4 shadow-lg ${getGradeColor(analysisResult.supplement_analysis.quality_rating.grade)}`}
                          >
                            {analysisResult.supplement_analysis.quality_rating.grade}
                          </motion.div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">Score:</span>
                            <Progress value={analysisResult.supplement_analysis.quality_rating.score} className="flex-1" />
                            <span className="font-bold text-purple-600">{analysisResult.supplement_analysis.quality_rating.score}/100</span>
                          </div>
                          <p className="text-sm bg-purple-500/10 p-3 rounded-lg border-l-4 border-purple-500">
                            {analysisResult.supplement_analysis.quality_rating.reasoning}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Certifications */}
                    {analysisResult.supplement_analysis.certifications && analysisResult.supplement_analysis.certifications.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border-2 border-green-500/30"
                      >
                        <h4 className="font-bold mb-4 text-lg flex items-center gap-2 text-green-600">
                          <Shield className="h-5 w-5" />
                          🛡️ Quality Certifications
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {analysisResult.supplement_analysis.certifications.map((cert, index) => (
                            <div key={index} className={`p-3 rounded-lg border ${cert.verified ? 'bg-green-500/20 border-green-500/50' : 'bg-muted/20 border-muted'}`}>
                              <div className="flex items-center gap-2">
                                {cert.verified ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <X className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={`text-sm font-medium ${cert.verified ? 'text-green-700' : 'text-muted-foreground'}`}>
                                  {cert.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Active Ingredients */}
                    {analysisResult.supplement_analysis.active_ingredients && analysisResult.supplement_analysis.active_ingredients.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border-2 border-blue-500/30"
                      >
                        <h4 className="font-bold mb-4 text-lg flex items-center gap-2 text-blue-600">
                          <Beaker className="h-5 w-5" />
                          📊 Active Ingredients
                        </h4>
                        <div className="space-y-4">
                          {analysisResult.supplement_analysis.active_ingredients.map((ingredient, index) => (
                            <div key={index} className="bg-background/50 rounded-xl p-4 border border-blue-500/20">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="font-bold text-foreground">{ingredient.name}</h5>
                                  {ingredient.form && <p className="text-sm text-blue-600">{ingredient.form}</p>}
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-lg text-blue-600">{ingredient.amount} {ingredient.unit}</span>
                                  {ingredient.daily_value && (
                                    <p className="text-xs text-muted-foreground">{ingredient.daily_value} DV</p>
                                  )}
                                </div>
                              </div>
                              {ingredient.bioavailability && (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground">Bioavailability:</span>
                                  <Badge className={`text-xs ${
                                    ingredient.bioavailability === 'very_high' ? 'bg-green-500 text-white' :
                                    ingredient.bioavailability === 'high' ? 'bg-green-400 text-white' :
                                    ingredient.bioavailability === 'medium' ? 'bg-yellow-500 text-white' :
                                    'bg-red-400 text-white'
                                  }`}>
                                    {ingredient.bioavailability.replace('_', ' ')}
                                  </Badge>
                                </div>
                              )}
                              {ingredient.bioavailability_notes && (
                                <p className="text-xs text-muted-foreground mt-2 italic">{ingredient.bioavailability_notes}</p>
                              )}
                              {ingredient.benefits && ingredient.benefits.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {ingredient.benefits.map((benefit, i) => (
                                    <Badge key={i} variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30">
                                      {benefit}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Inactive Ingredients */}
                    {analysisResult.supplement_analysis.inactive_ingredients && analysisResult.supplement_analysis.inactive_ingredients.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-2xl p-6 border-2 border-gray-500/30 cursor-pointer hover:bg-gray-500/15 transition-all"
                          >
                            <h4 className="font-bold text-lg flex items-center gap-2 text-gray-600">
                              <Atom className="h-5 w-5" />
                              🧪 Inactive Ingredients ({analysisResult.supplement_analysis.inactive_ingredients.length})
                              <ChevronDown className="h-4 w-4 ml-auto" />
                            </h4>
                          </motion.div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 space-y-2 p-4 bg-muted/20 rounded-xl">
                            {analysisResult.supplement_analysis.inactive_ingredients.map((ingredient, index) => (
                              <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                                ingredient.concern === 'high' ? 'bg-red-500/10 border-red-500/30' :
                                ingredient.concern === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                'bg-background/50 border-border'
                              }`}>
                                <div>
                                  <span className="font-medium">{ingredient.name}</span>
                                  {ingredient.category && (
                                    <span className="text-xs text-muted-foreground ml-2">({ingredient.category})</span>
                                  )}
                                </div>
                                {ingredient.concern && ingredient.concern !== 'none' && (
                                  <Badge className={`text-xs ${
                                    ingredient.concern === 'high' ? 'bg-red-500 text-white' :
                                    ingredient.concern === 'medium' ? 'bg-yellow-500 text-white' :
                                    'bg-green-500 text-white'
                                  }`}>
                                    {ingredient.concern} concern
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Drug Interactions */}
                    {analysisResult.supplement_analysis.drug_interactions && analysisResult.supplement_analysis.drug_interactions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-2xl p-6 border-2 border-amber-500/40"
                      >
                        <h4 className="font-bold mb-4 text-lg flex items-center gap-2 text-amber-600">
                          <AlertTriangle className="h-5 w-5" />
                          ⚠️ Drug Interactions
                        </h4>
                        <div className="space-y-3">
                          {analysisResult.supplement_analysis.drug_interactions.map((interaction, index) => (
                            <div key={index} className={`p-4 rounded-lg border ${
                              interaction.severity === 'severe' ? 'bg-red-500/20 border-red-500/50' :
                              interaction.severity === 'moderate' ? 'bg-orange-500/20 border-orange-500/50' :
                              'bg-yellow-500/20 border-yellow-500/50'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold">{interaction.medication}</span>
                                <Badge className={`${
                                  interaction.severity === 'severe' ? 'bg-red-500 text-white' :
                                  interaction.severity === 'moderate' ? 'bg-orange-500 text-white' :
                                  'bg-yellow-500 text-white'
                                }`}>
                                  {interaction.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-foreground">{interaction.effect}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Safety Information */}
                    {analysisResult.supplement_analysis.safety_info && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl p-6 border-2 border-red-500/30"
                      >
                        <h4 className="font-bold mb-4 text-lg flex items-center gap-2 text-red-600">
                          <Shield className="h-5 w-5" />
                          📋 Safety Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {analysisResult.supplement_analysis.safety_info.max_safe_dose && (
                            <div className="p-3 bg-background/50 rounded-lg border border-red-500/20">
                              <span className="text-xs text-muted-foreground">Max Safe Dose</span>
                              <p className="font-bold text-foreground">{analysisResult.supplement_analysis.safety_info.max_safe_dose}</p>
                            </div>
                          )}
                          {analysisResult.supplement_analysis.safety_info.overdose_risk && (
                            <div className="p-3 bg-background/50 rounded-lg border border-red-500/20">
                              <span className="text-xs text-muted-foreground">Overdose Risk</span>
                              <Badge className={`ml-2 ${
                                analysisResult.supplement_analysis.safety_info.overdose_risk === 'high' ? 'bg-red-500 text-white' :
                                analysisResult.supplement_analysis.safety_info.overdose_risk === 'medium' ? 'bg-orange-500 text-white' :
                                'bg-green-500 text-white'
                              }`}>
                                {analysisResult.supplement_analysis.safety_info.overdose_risk}
                              </Badge>
                            </div>
                          )}
                          {analysisResult.supplement_analysis.safety_info.pregnancy_category && (
                            <div className="p-3 bg-background/50 rounded-lg border border-red-500/20">
                              <span className="text-xs text-muted-foreground">Pregnancy</span>
                              <p className="font-bold text-foreground">{analysisResult.supplement_analysis.safety_info.pregnancy_category}</p>
                            </div>
                          )}
                          {analysisResult.supplement_analysis.safety_info.fat_soluble && (
                            <div className="p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                              <span className="text-xs text-yellow-700">⚠️ Fat-Soluble Vitamin</span>
                              <p className="text-sm text-yellow-800">Can accumulate in body - monitor intake</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Recommendations */}
                    {analysisResult.supplement_analysis.recommendations && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-2xl p-6 border-2 border-teal-500/30"
                      >
                        <h4 className="font-bold mb-4 text-lg flex items-center gap-2 text-teal-600">
                          <Clock className="h-5 w-5" />
                          💡 How to Take
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {analysisResult.supplement_analysis.recommendations.best_time_to_take && (
                            <div className="p-3 bg-background/50 rounded-lg border border-teal-500/20">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Best Time
                              </span>
                              <p className="font-medium text-foreground">{analysisResult.supplement_analysis.recommendations.best_time_to_take}</p>
                            </div>
                          )}
                          {analysisResult.supplement_analysis.recommendations.take_with_food !== undefined && (
                            <div className="p-3 bg-background/50 rounded-lg border border-teal-500/20">
                              <span className="text-xs text-muted-foreground">With Food?</span>
                              <p className="font-medium text-foreground">
                                {analysisResult.supplement_analysis.recommendations.take_with_food ? '✅ Yes, take with food' : '💊 Can take on empty stomach'}
                              </p>
                            </div>
                          )}
                          {analysisResult.supplement_analysis.recommendations.food_pairings && (
                            <div className="p-3 bg-background/50 rounded-lg border border-teal-500/20 col-span-full">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Leaf className="h-3 w-3" /> Best Paired With
                              </span>
                              <p className="font-medium text-foreground">{analysisResult.supplement_analysis.recommendations.food_pairings}</p>
                            </div>
                          )}
                          {analysisResult.supplement_analysis.recommendations.avoid_with && (
                            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 col-span-full">
                              <span className="text-xs text-red-600">⚠️ Avoid With</span>
                              <p className="font-medium text-foreground">{analysisResult.supplement_analysis.recommendations.avoid_with}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Overall Assessment */}
                    {analysisResult.supplement_analysis.overall_assessment && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {analysisResult.supplement_analysis.overall_assessment.pros && analysisResult.supplement_analysis.overall_assessment.pros.length > 0 && (
                          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-xl p-5 border-2 border-green-500/40">
                            <h4 className="font-bold text-green-600 mb-3 flex items-center gap-2">
                              <CheckCircle className="h-5 w-5" />
                              ✅ Pros
                            </h4>
                            <ul className="space-y-2">
                              {analysisResult.supplement_analysis.overall_assessment.pros.map((pro, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm bg-green-500/10 p-2 rounded-lg">
                                  <span className="text-green-600 mt-0.5">✓</span>
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {analysisResult.supplement_analysis.overall_assessment.cons && analysisResult.supplement_analysis.overall_assessment.cons.length > 0 && (
                          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/10 rounded-xl p-5 border-2 border-red-500/40">
                            <h4 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5" />
                              ⚠️ Cons
                            </h4>
                            <ul className="space-y-2">
                              {analysisResult.supplement_analysis.overall_assessment.cons.map((con, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm bg-red-500/10 p-2 rounded-lg">
                                  <span className="text-red-600 mt-0.5">⚠</span>
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Verdict */}
                    {analysisResult.supplement_analysis.overall_assessment?.verdict && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 border-2 border-primary/30"
                      >
                        <h4 className="font-bold mb-2 text-lg flex items-center gap-2 text-primary">
                          <Star className="h-5 w-5" />
                          🎯 Verdict
                        </h4>
                        <p className="text-foreground font-medium">{analysisResult.supplement_analysis.overall_assessment.verdict}</p>
                      </motion.div>
                    )}
                  </>
                )}

                {/* Processing Deep Dive - Only show for food/beverage */}
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
                    
                       {/* Enhanced Sugar Analysis */}
                       <div className="space-y-4">
                         {/* Primary Sweetener with Enhanced Details */}
                         <div className="p-4 bg-pink-500/10 rounded-lg border border-pink-500/30">
                           <div className="flex items-center justify-between mb-3">
                             <span className="font-bold text-pink-600">Primary Sweetener:</span>
                             <Badge className={`${
                               (analysisResult.sugar_analysis.sweetener_breakdown?.sweetener_category?.includes('artificial') || 
                                analysisResult.sugar_analysis.sweetener_breakdown?.sweetener_category?.includes('processed') ||
                                analysisResult.sugar_analysis.sweetener_type?.includes('artificial') || 
                                analysisResult.sugar_analysis.sweetener_type?.includes('processed'))
                                 ? 'bg-red-500/20 text-red-700 border-red-500/50'
                                 : 'bg-green-500/20 text-green-700 border-green-500/50'
                             }`}>
                               {analysisResult.sugar_analysis.sweetener_breakdown?.sweetener_category || analysisResult.sugar_analysis.sweetener_type}
                             </Badge>
                           </div>
                           <p className="text-lg font-semibold text-pink-700">{analysisResult.sugar_analysis.primary_sweetener}</p>
                           
                           {/* Enhanced Chemical Details */}
                           {analysisResult.sugar_analysis.sweetener_breakdown && (
                             <div className="mt-3 space-y-2 bg-pink-500/5 p-3 rounded border border-pink-500/20">
                               {analysisResult.sugar_analysis.sweetener_breakdown.hfcs_type && (
                                 <p className="text-sm"><span className="font-medium">Type:</span> {analysisResult.sugar_analysis.sweetener_breakdown.hfcs_type}</p>
                               )}
                               {analysisResult.sugar_analysis.sweetener_breakdown.manufacturing_process && (
                                 <p className="text-xs text-muted-foreground">🏭 {analysisResult.sugar_analysis.sweetener_breakdown.manufacturing_process}</p>
                               )}
                               {analysisResult.sugar_analysis.sweetener_breakdown.chemical_composition && (
                                 <p className="text-xs text-muted-foreground font-mono">⚗️ {analysisResult.sugar_analysis.sweetener_breakdown.chemical_composition}</p>
                               )}
                             </div>
                           )}
                           
                           {/* Fallback for legacy structure */}
                           {analysisResult.sugar_analysis.chemical_structure && !analysisResult.sugar_analysis.sweetener_breakdown && (
                             <p className="text-xs text-muted-foreground mt-1">🧬 {analysisResult.sugar_analysis.chemical_structure}</p>
                           )}
                         </div>
                
                         {/* Enhanced Metabolic Analysis */}
                         {analysisResult.sugar_analysis.metabolic_analysis && (
                           <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                             <h5 className="font-semibold text-orange-600 mb-3">📊 Metabolic Impact Analysis</h5>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                               <div className="text-center p-2 bg-red-500/10 rounded border border-red-500/20">
                                 <div className="font-bold text-lg text-red-600">{analysisResult.sugar_analysis.metabolic_analysis.glycemic_index}</div>
                                 <div className="text-xs">Glycemic Index</div>
                               </div>
                               <div className="text-center p-2 bg-orange-500/10 rounded border border-orange-500/20">
                                 <div className="font-bold text-lg text-orange-600">{analysisResult.sugar_analysis.metabolic_analysis.blood_sugar_spike_score}</div>
                                 <div className="text-xs">Blood Sugar Spike</div>
                               </div>
                               {analysisResult.sugar_analysis.metabolic_analysis.insulin_response_score && (
                                 <div className="text-center p-2 bg-purple-500/10 rounded border border-purple-500/20">
                                   <div className="font-bold text-lg text-purple-600">{analysisResult.sugar_analysis.metabolic_analysis.insulin_response_score}</div>
                                   <div className="text-xs">Insulin Response</div>
                                 </div>
                               )}
                               {analysisResult.sugar_analysis.metabolic_analysis.fructose_percentage && (
                                 <div className="col-span-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                                   <div className="text-sm">
                                     <span className="font-medium">Fructose:</span> {analysisResult.sugar_analysis.metabolic_analysis.fructose_percentage}% | 
                                     <span className="font-medium ml-2">Glucose:</span> {analysisResult.sugar_analysis.metabolic_analysis.glucose_percentage}%
                                   </div>
                                 </div>
                               )}
                             </div>
                             {analysisResult.sugar_analysis.metabolic_analysis.liver_metabolism_burden && (
                               <div className="mt-3 p-2 bg-red-500/5 rounded border-l-4 border-red-500">
                                 <p className="text-sm text-red-600">
                                   <span className="font-medium">Liver Impact:</span> {analysisResult.sugar_analysis.metabolic_analysis.liver_metabolism_burden}
                                 </p>
                               </div>
                             )}
                           </div>
                         )}
                
                         {/* Enhanced Health Impacts */}
                         {analysisResult.sugar_analysis.health_impacts ? (
                           <div className="space-y-3">
                             {/* Immediate Effects */}
                             <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                               <h6 className="font-semibold text-yellow-600 mb-2">⚡ Immediate Effects (0-2 hours):</h6>
                               <div className="space-y-1">
                                 {analysisResult.sugar_analysis.health_impacts.immediate_effects.map((effect, i) => (
                                   <div key={i} className="flex items-center gap-2 text-sm">
                                     <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                     <span>{effect}</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                
                             {/* Chronic Effects */}
                             <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                               <h6 className="font-semibold text-red-600 mb-2">⚠️ Long-term Health Risks:</h6>
                               <div className="space-y-1">
                                 {analysisResult.sugar_analysis.health_impacts.chronic_effects.map((effect, i) => (
                                   <div key={i} className="flex items-center gap-2 text-sm">
                                     <AlertTriangle className="h-3 w-3 text-red-500" />
                                     <span>{effect}</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                
                             {/* Addiction Potential & Comparison */}
                             {(analysisResult.sugar_analysis.health_impacts.addiction_potential || analysisResult.sugar_analysis.health_impacts.vs_table_sugar) && (
                               <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                 {analysisResult.sugar_analysis.health_impacts.addiction_potential && (
                                   <p className="text-sm mb-2">
                                     <span className="font-bold text-purple-600">Addiction Risk:</span> {analysisResult.sugar_analysis.health_impacts.addiction_potential}
                                   </p>
                                 )}
                                 {analysisResult.sugar_analysis.health_impacts.vs_table_sugar && (
                                   <p className="text-sm">
                                     <span className="font-bold text-purple-600">vs Table Sugar:</span> {analysisResult.sugar_analysis.health_impacts.vs_table_sugar}
                                   </p>
                                 )}
                               </div>
                             )}
                           </div>
                         ) : (
                           /* Fallback for legacy structure */
                           <div className="space-y-3">
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
                             {analysisResult.sugar_analysis.metabolic_effects && (
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
                             )}
                
                             {/* Glycemic Impact */}
                             {analysisResult.sugar_analysis.glycemic_impact && (
                               <div className="p-3 bg-orange-500/10 rounded-lg">
                                 <span className="font-bold text-orange-600">Glycemic Impact: </span>
                                 <span className="text-foreground">{analysisResult.sugar_analysis.glycemic_impact}</span>
                               </div>
                             )}
                           </div>
                         )}
                
                         {/* Regulatory Concerns */}
                         {analysisResult.sugar_analysis.regulatory_concerns && (
                           <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                             <h6 className="font-semibold text-orange-600 mb-2">🚨 Regulatory & Safety Concerns:</h6>
                             <div className="space-y-2 text-sm">
                               {analysisResult.sugar_analysis.regulatory_concerns.mercury_contamination_risk && (
                                 <p><span className="font-medium">Mercury Risk:</span> {analysisResult.sugar_analysis.regulatory_concerns.mercury_contamination_risk}</p>
                               )}
                               {analysisResult.sugar_analysis.regulatory_concerns.gmo_source && (
                                 <p><span className="font-medium">GMO Source:</span> {analysisResult.sugar_analysis.regulatory_concerns.gmo_source}</p>
                               )}
                               {analysisResult.sugar_analysis.regulatory_concerns.countries_restricting && (
                                 <p><span className="font-medium">Global Restrictions:</span> {analysisResult.sugar_analysis.regulatory_concerns.countries_restricting.join(', ')}</p>
                               )}
                             </div>
                           </div>
                         )}
                
                         {/* Enhanced Alternatives */}
                         <div>
                           <h5 className="font-semibold text-stats-duration mb-3">💡 Healthier Sugar Alternatives:</h5>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             {analysisResult.sugar_analysis.healthier_alternatives?.map((alt, index) => {
                               const colors = [
                                 'bg-stats-exercises/10 border-stats-exercises/30 text-stats-exercises',
                                 'bg-stats-calories/10 border-stats-calories/30 text-stats-calories', 
                                 'bg-stats-duration/10 border-stats-duration/30 text-stats-duration',
                                 'bg-stats-heart/10 border-stats-heart/30 text-stats-heart'
                               ];
                               const colorClass = colors[index % colors.length];
                               return (
                                 <div key={index} className={`p-3 rounded-lg border ${colorClass}`}>
                                   <div className="flex justify-between items-start mb-1">
                                     <span className="font-medium">{alt.name}</span>
                                     {alt.glycemic_index !== undefined && (
                                       <Badge className={`text-xs ${
                                         alt.glycemic_index <= 35 ? 'bg-stats-exercises/20 text-stats-exercises border-stats-exercises/50' :
                                         alt.glycemic_index <= 55 ? 'bg-stats-duration/20 text-stats-duration border-stats-duration/50' :
                                         'bg-stats-heart/20 text-stats-heart border-stats-heart/50'
                                       }`}>
                                         GI: {alt.glycemic_index}
                                       </Badge>
                                     )}
                                   </div>
                                   {alt.benefits && (
                                     <p className="text-xs opacity-80">{alt.benefits}</p>
                                   )}
                                 </div>
                               );
                             }) || (
                               /* Fallback for legacy structure */
                               analysisResult.sugar_analysis.natural_alternatives?.map((alt, index) => {
                                 const colors = [
                                   'bg-stats-exercises/20 text-stats-exercises border-stats-exercises/50',
                                   'bg-stats-calories/20 text-stats-calories border-stats-calories/50', 
                                   'bg-stats-duration/20 text-stats-duration border-stats-duration/50',
                                   'bg-stats-heart/20 text-stats-heart border-stats-heart/50'
                                 ];
                                 const colorClass = colors[index % colors.length];
                                 return (
                                   <Badge key={index} className={colorClass}>
                                     {alt}
                                   </Badge>
                                 );
                               })
                             )}
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
                                 <div key={index} className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                                   <div className="flex items-center justify-between mb-3">
                                     <div className="flex items-center gap-3">
                                       <div 
                                         className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                                         style={{ backgroundColor: dye.color_display || '#FF0000' }}
                                       />
                                       <div>
                                         <span className="font-bold text-red-700">{dye.name}</span>
                                         {dye.fdc_number && (
                                           <p className="text-xs text-muted-foreground">{dye.fdc_number}</p>
                                         )}
                                       </div>
                                     </div>
                                     <Badge className={`${
                                       dye.safety_rating === 'critical_concern' ? 'bg-red-600/90 text-white animate-pulse' :
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
                                   {dye.chemical_formula && (
                                     <p className="text-xs text-muted-foreground mb-2 font-mono">⚗️ {dye.chemical_formula}</p>
                                   )}
                                   
                                   <p className="text-sm text-foreground mb-3">
                                     <span className="font-medium">Purpose:</span> {dye.purpose}
                                   </p>
                                   
                                   <div className="space-y-2 mb-3">
                                     <span className="font-medium text-red-600">Health Concerns:</span>
                                     {dye.health_concerns.map((concern, i) => (
                                       <div key={i} className="flex items-start gap-2 text-sm bg-red-500/5 p-2 rounded">
                                         <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                                         <span>{concern}</span>
                                       </div>
                                     ))}
                                   </div>
                                   
                                   {dye.regulatory_status && (
                                     <div className="bg-orange-500/10 p-3 rounded border border-orange-500/30">
                                       <div className="grid grid-cols-2 gap-2 text-xs">
                                         <div>
                                           <span className="font-medium">US Status:</span> {dye.regulatory_status.us_approved ? '✅ Approved' : '❌ Banned'}
                                         </div>
                                         <div>
                                           <span className="font-medium">EU Status:</span> {dye.regulatory_status.eu_status}
                                         </div>
                                       </div>
                                       {dye.regulatory_status.banned_countries && dye.regulatory_status.banned_countries.length > 0 && (
                                         <p className="text-xs text-red-600 mt-2">
                                           <span className="font-medium">Restrictions:</span> {dye.regulatory_status.banned_countries.join(', ')}
                                         </p>
                                       )}
                                       {dye.regulatory_status.warning_required && (
                                         <p className="text-xs text-orange-600 mt-1">⚠️ Warning labels required</p>
                                       )}
                                     </div>
                                   )}
                                   
                                   {dye.daily_acceptable_intake && (
                                     <p className="text-xs text-muted-foreground mt-2">
                                       <span className="font-medium">Daily Limit:</span> {dye.daily_acceptable_intake}
                                     </p>
                                   )}
                                   
                                    {dye.alternative_colorings && dye.alternative_colorings.length > 0 && (
                                      <div className="mt-3">
                                        <span className="text-xs font-medium text-stats-duration">Natural Color Alternatives:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {dye.alternative_colorings.map((alt, i) => {
                                            const altColors = [
                                              'bg-stats-exercises/20 text-stats-exercises border-stats-exercises/50',
                                              'bg-stats-calories/20 text-stats-calories border-stats-calories/50',
                                              'bg-stats-duration/20 text-stats-duration border-stats-duration/50',
                                              'bg-stats-heart/20 text-stats-heart border-stats-heart/50'
                                            ];
                                            const altColorClass = altColors[i % altColors.length];
                                            return (
                                              <Badge key={i} className={`text-xs ${altColorClass}`}>
                                                {alt}
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                      </div>
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
                {(safetyData?.safetyAlerts.length > 0 || safetyData?.hasActiveRecalls) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 space-y-4 border-2 shadow-xl ${
                      safetyData.riskLevel === 'critical' 
                        ? 'bg-red-500/10 border-red-500/50 shadow-red-500/30' 
                        : safetyData.riskLevel === 'high'
                        ? 'bg-orange-500/10 border-orange-500/50 shadow-orange-500/30'
                        : safetyData.riskLevel === 'medium'
                        ? 'bg-yellow-500/10 border-yellow-500/50 shadow-yellow-500/30'
                        : 'bg-blue-500/10 border-blue-500/50 shadow-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className={`h-6 w-6 ${
                        safetyData.riskLevel === 'critical' 
                          ? 'text-red-500' 
                          : safetyData.riskLevel === 'high'
                          ? 'text-orange-500'
                          : safetyData.riskLevel === 'medium'
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                      }`} />
                      <h4 className="text-lg font-bold">
                        {safetyData.riskLevel === 'critical' && '🚨 CRITICAL SAFETY ALERT'}
                        {safetyData.riskLevel === 'high' && '⚠️ HIGH RISK WARNINGS'}
                        {safetyData.riskLevel === 'medium' && '⚠️ SAFETY CONCERNS'}
                        {safetyData.riskLevel === 'low' && 'ℹ️ SAFETY INFORMATION'}
                      </h4>
                    </div>

                    {/* Active Recalls */}
                    {safetyData.hasActiveRecalls && (
                      <div className="space-y-3">
                        <h5 className="font-semibold text-red-600 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Active Product Recalls
                        </h5>
                        {safetyData.recalls.map((recall, index) => (
                          <div key={index} className="bg-background/50 rounded-lg p-4 border border-red-200/50">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <span className="font-medium text-red-700">
                                  Recall #{recall.recall_number}
                                </span>
                                <Badge variant="destructive" className="text-xs">
                                  {recall.classification}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{recall.reason_for_recall}</p>
                              <p className="text-xs text-muted-foreground">
                                Company: {recall.recalling_firm} | Date: {recall.recall_initiation_date}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Distribution: {recall.distribution_pattern}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chemical Safety Alerts */}
                    {safetyData.safetyAlerts.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-semibold flex items-center gap-2">
                          <Beaker className="h-5 w-5" />
                          Chemical Safety Alerts
                        </h5>
                        <div className="space-y-2">
                          {safetyData.safetyAlerts.map((alert, index) => (
                            <div key={index} className="bg-background/50 rounded-lg p-3 border border-current/20">
                              <p className="text-sm font-medium">{alert}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(safetyData.lastUpdated).toLocaleString()}
                    </p>
                  </motion.div>
                )}

                {/* Alternatives */}
                {analysisResult.analysis.alternatives.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 col-span-full"
                    >
                      <h4 className="font-bold text-primary mb-4 flex items-center gap-2 text-lg">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Star className="h-5 w-5 animate-pulse text-primary" />
                        </motion.div>
                        💡 Healthier Product Alternatives
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {analysisResult.analysis.alternatives.map((alt, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + index * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-200"
                          >
                            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm font-medium text-foreground">{alt}</span>
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
                  
                  {isCheckingSafety && (
                    <div className="flex items-center justify-center gap-2 text-stats-duration bg-stats-duration/10 rounded-lg p-3 border border-stats-duration/30">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Checking FDA recalls...</span>
                    </div>
                  )}
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