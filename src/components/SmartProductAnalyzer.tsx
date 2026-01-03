import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Camera, Upload, Loader2, X, Zap, Star, AlertTriangle,
  CheckCircle, Info, Sparkles, Shield, Utensils, Settings,
  Beaker, Atom, Droplet, Factory, ChevronDown, ChevronRight, Pill, Clock, Leaf,
  SprayCan, Bath, ScanLine, Barcode, Eye, Wind, Baby, Skull, Globe, Recycle, Heart
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
import { PriceLookupService, PriceLookupResult } from '@/services/priceLookupService';
import { ProductPriceCard } from './ProductPriceCard';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

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

interface PetFoodAnalysis {
  animal_type?: string;
  life_stage?: string;
  food_type?: string;
  quality_grade?: {
    letter: string;
    score: number;
    aafco_compliant?: boolean;
    reasoning: string;
  };
  protein_analysis?: {
    primary_protein_source?: string;
    protein_quality?: string;
    is_named_protein?: boolean;
    animal_digest_present?: boolean;
    protein_percentage?: number;
  };
  ingredient_sourcing?: {
    country_of_origin?: string;
    manufacturing_location?: string;
    sourcing_transparency?: string;
    made_in_usa?: boolean;
  };
  synthetic_ingredients?: Array<{
    name: string;
    category?: string;
    concern_level?: string;
    effects?: string[];
    banned_in?: string[];
  }>;
  concerning_ingredients?: {
    artificial_colors?: string[];
    artificial_preservatives?: string[];
    fillers?: string[];
    meat_by_products?: boolean;
    rendered_fat?: boolean;
    corn_syrup?: boolean;
    propylene_glycol?: boolean;
    carrageenan?: boolean;
  };
  toxic_ingredients_check?: {
    xylitol?: boolean;
    onion_garlic?: boolean;
    grapes_raisins?: boolean;
    chocolate?: boolean;
    macadamia?: boolean;
    avocado?: boolean;
    detected_toxic?: string[];
  };
  recalls?: {
    has_recent_recalls?: boolean;
    recall_history?: string[];
    brand_recall_frequency?: string;
  };
  healthier_alternatives?: Array<{
    product_name: string;
    brand?: string;
    why_better: string;
    price_comparison?: string;
    key_improvements?: string[];
  }>;
  guaranteed_analysis?: {
    crude_protein_min?: number;
    crude_fat_min?: number;
    crude_fiber_max?: number;
    moisture_max?: number;
  };
  overall_assessment?: {
    pros?: string[];
    cons?: string[];
    verdict?: string;
    recommendation?: string;
    suitable_for?: string[];
  };
}

interface ProductAnalysis {
  product_type?: 'food' | 'beverage' | 'supplement' | 'medication' | 'vitamin' | 'household' | 'personal_care' | 'pet_food';
  barcode?: string | null;
  barcode_type?: string | null;
  nutrition_label_visible?: boolean;
  side_detected?: string;
  needs_nutrition_scan?: boolean;
  product: {
    name: string;
    brand?: string;
    size?: string;
    net_weight?: string;
    net_weight_grams?: number;
    confidence: number;
  };
  nutrition: {
    serving_size: string;
    serving_size_grams?: number;
    servings_per_container?: number;
    data_source?: 'label_extracted' | 'estimated' | 'partial_label' | 'database_verified' | 'database_scaled' | 'ai_extracted' | 'multi_verified' | 'upc_verified' | 'user_verified' | 'incomplete';
    database_name?: string | null;
    confidence_score?: number;
    original_database_serving?: string;
    quality_label?: 'verified' | 'likely_accurate' | 'estimated' | 'incomplete';
    matching_sources?: string[];
    consensus_reached?: boolean;
    all_sources?: Array<{
      name: string;
      calories: number;
      serving_grams: number | null;
      confidence: number;
      is_exact_match?: boolean;
    }>;
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
  sourcing_analysis?: SourcingAnalysis;
  household_analysis?: HouseholdAnalysis;
  pet_food_analysis?: PetFoodAnalysis;
}

interface HouseholdAnalysis {
  safety_grade: string;
  safety_score: number;
  product_category: string;
  chemical_concerns?: {
    forever_chemicals?: { detected: string[]; risk_level: string; health_effects?: string[]; bioaccumulation_warning?: boolean };
    microplastics?: { detected: string[]; risk_level: string; environmental_impact?: string };
    endocrine_disruptors?: { detected: string[]; risk_level: string; health_effects?: string[] };
    carcinogens?: { detected: string[]; risk_level: string };
    sensitizers_irritants?: { detected: string[]; risk_level: string };
    environmental_toxins?: { detected: string[]; risk_level: string; environmental_impact?: string };
  };
  safety_warnings?: {
    label_warnings: string[];
    skin_contact: string;
    eye_contact: string;
    inhalation: string;
    ingestion: string;
    first_aid?: string;
    keep_away_children?: boolean;
    pregnancy_warning?: boolean;
  };
  environmental_rating?: {
    grade: string;
    score: number;
    biodegradable: boolean;
    aquatic_toxicity: string;
    ozone_depleting?: boolean;
    packaging_recyclable?: boolean;
    cruelty_free?: boolean;
    vegan?: boolean;
    concerns: string[];
  };
  certifications?: {
    detected: string[];
    missing_important: string[];
  };
  ingredients_of_concern?: Array<{
    name: string;
    category: string;
    concern_level: string;
    health_effects: string[];
    alternatives?: string[];
  }>;
  better_alternatives?: Array<{
    product_name: string;
    brand?: string;
    why_better: string;
    chemical_comparison?: string;
    where_to_find?: string;
  }>;
  overall_assessment?: {
    pros: string[];
    cons: string[];
    verdict: string;
    recommendation: string;
    who_should_avoid?: string[];
  };
}

interface SourcingAnalysis {
  organic_status?: {
    is_organic: boolean;
    certification?: string;
    pesticide_concern: 'none' | 'low' | 'moderate' | 'high';
    pesticide_details?: string;
  };
  country_of_origin?: {
    country: string;
    region?: string;
    text_found?: string;
    locally_sourced: boolean;
  };
  farming_method?: {
    method: string;
    is_factory_farmed: boolean;
    details?: string;
    health_impact: 'none' | 'positive' | 'negative';
    health_education?: string;
  };
  fish_analysis?: {
    is_fish_product: boolean;
    fish_type?: string;
    sourcing: 'wild_caught' | 'farm_raised' | 'unknown';
    mercury_level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
    mercury_ppb?: number;
    omega3_ratio: 'high' | 'moderate' | 'low';
    sustainability_rating?: string;
    health_insights?: {
      pros: string[];
      cons: string[];
      recommendation: string;
    };
  };
  certifications?: Array<{
    name: string;
    verified: boolean;
    what_it_means: string;
  }>;
  sourcing_grade?: string;
  sourcing_score?: number;
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
  
  // Scan mode state
  const [scanMode, setScanMode] = useState<'barcode' | 'photo'>('barcode');
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const barcodeVideoRef = useRef<HTMLVideoElement>(null);
  
  // Barcode scanner hook
  const { 
    isScanning, 
    loading: barcodeLoading, 
    startScanning, 
    stopScanning, 
    attachToVideoElement,
    lastBarcode,
    resetScanner: resetBarcodeScanner
  } = useBarcodeScanner();
  
  // Package size selector state - auto-populated from detected servings
  const [packageSize, setPackageSize] = useState<'single' | 'regular' | 'large' | 'custom'>('single');
  const [customServings, setCustomServings] = useState<number>(1);
  
  // Manual nutrition edit state
  const [isEditingNutrition, setIsEditingNutrition] = useState(false);
  const [editedNutrition, setEditedNutrition] = useState({
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sugars_g: 0,
    sodium_mg: 0,
    serving_size: ''
  });
  
  // Manual UPC entry state
  const [showManualUPC, setShowManualUPC] = useState(false);
  const [manualUPCInput, setManualUPCInput] = useState('');
  const [isLookingUpUPC, setIsLookingUpUPC] = useState(false);
  
  // Data sources visibility
  const [showDataSources, setShowDataSources] = useState(false);
  
  // Price lookup state
  const [pricing, setPricing] = useState<PriceLookupResult | null>(null);
  
  // Handle barcode detection from scanner
  useEffect(() => {
    if (lastBarcode && !isAnalyzing) {
      handleBarcodeDetected(lastBarcode);
    }
  }, [lastBarcode]);
  
  const handleBarcodeDetected = async (barcodeRaw: string) => {
    const barcode = barcodeRaw.replace(/[^0-9]/g, '');
    if (barcode.length < 8 || barcode.length > 14) {
      toast.error('Invalid barcode detected. Please try again.');
      return;
    }

    console.log('📊 Barcode detected:', barcode);
    setIsAnalyzing(true);
    stopScanning();

    try {
      const { data, error } = await supabase.functions.invoke('analyzeProduct', {
        body: { barcode },
      });

      if (error) {
        const status = (error as any)?.context?.status ?? (error as any)?.status;
        if (status === 404) {
          toast.error('Barcode not found — try Photo mode.');
          setScanMode('photo');
          return;
        }

        console.error('Barcode lookup error:', error);
        toast.error('Barcode lookup failed. Please try again.');
        return;
      }

      if (!data || (data as any)?.error) {
        toast.error((data as any)?.message || (data as any)?.error || 'Product not found');
        setScanMode('photo');
        return;
      }

      // Defensive: prevent blank screens if a partial response comes back
      if (!(data as any)?.product?.name) {
        console.error('Invalid analyzeProduct response (missing product.name):', data);
        toast.error('Could not read product details — try Photo mode.');
        setScanMode('photo');
        return;
      }

      setAnalysisResult(data);

      // Check safety for the product
      await checkProductSafety((data as any).product?.name, (data as any).product?.brand);

      // Look up pricing if available
      try {
        const priceData = await PriceLookupService.lookupPrice(barcode, (data as any).product?.name);
        setPricing(priceData);
      } catch (priceError) {
        console.log('Price lookup unavailable');
      }

      toast.success(`Product found: ${(data as any).product?.name || 'Unknown'}`);
    } catch (error) {
      console.error('Barcode lookup exception:', error);
      toast.error('Barcode lookup failed. Please try again.');
      setScanMode('photo');
    } finally {
      setIsAnalyzing(false);
      // Allow scanning the same barcode again
      resetBarcodeScanner();
    }
  };
  
  const handleManualBarcodeLookup = () => {
    const cleanBarcode = manualBarcodeInput.replace(/[^0-9]/g, '');
    if (cleanBarcode.length >= 8 && cleanBarcode.length <= 14) {
      handleBarcodeDetected(cleanBarcode);
      setManualBarcodeInput('');
    } else {
      toast.error('Please enter a valid barcode (8-14 digits)');
    }
  };
  
  // Start barcode scanning - starts the camera stream
  const startBarcodeScanning = async () => {
    console.log('📊 Starting barcode scan...');
    await startScanning(barcodeVideoRef.current ?? undefined);
  };
  
  // When isScanning becomes true and video element mounts, attach the stream
  useEffect(() => {
    if (isScanning && barcodeVideoRef.current) {
      console.log('📊 Video element mounted, attaching stream...');
      attachToVideoElement(barcodeVideoRef.current);
    }
  }, [isScanning, attachToVideoElement]);
  
  // Auto-set package size based on detected servings per container
  useEffect(() => {
    if (analysisResult?.nutrition?.servings_per_container) {
      const servings = analysisResult.nutrition.servings_per_container;
      if (servings <= 1.2) {
        setPackageSize('single');
        setCustomServings(1);
      } else if (servings <= 2.5) {
        setPackageSize('regular');
        setCustomServings(Math.round(servings * 10) / 10);
      } else if (servings <= 5) {
        setPackageSize('large');
        setCustomServings(Math.round(servings * 10) / 10);
      } else {
        setPackageSize('custom');
        setCustomServings(Math.round(servings * 10) / 10);
      }
    }
  }, [analysisResult?.nutrition?.servings_per_container]);
  
  const { setAnalysisContext } = useChatbotContext();
  
  // Register scanned product with AI coach context (uses analysisContext to avoid being overwritten)
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

      // Use setAnalysisContext so FoodScanner page can't overwrite this
      setAnalysisContext({
        type: 'product',
        timestamp: Date.now(),
        visibleContent
      });
    } else {
      // Clear analysis when product is cleared
      setAnalysisContext(null);
    }
  }, [analysisResult, setAnalysisContext]);

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
        body: { imageBase64 },
      });

      if (error) {
        const status = (error as any)?.context?.status ?? (error as any)?.status;
        if (status === 429) {
          toast.error('Too many requests — please wait a moment and try again.');
        } else if (status === 402) {
          toast.error('AI credits required — please add credits and try again.');
        } else {
          toast.error('Failed to analyze product. Please try again.');
        }
        console.error('Analysis error:', error);
        return;
      }

      if (!data || (data as any)?.error) {
        toast.error((data as any)?.error || 'Failed to analyze product. Please try again.');
        return;
      }

      // Defensive: prevent blank screens if response is partial
      if (!(data as any)?.product?.name) {
        console.error('Invalid analyzeProduct response (missing product.name):', data);
        toast.error('Could not read product details — please try a clearer photo.');
        return;
      }

      setAnalysisResult(data);

      // Check product safety after successful analysis
      await checkProductSafety((data as any).product?.name, (data as any).product?.brand);

      // Look up pricing information
      try {
        const priceData = await PriceLookupService.lookupPrice((data as any).barcode || '', (data as any).product?.name);
        setPricing(priceData);
      } catch (priceError) {
        console.log('Price lookup unavailable:', priceError);
      }

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
    setShowManualUPC(false);
    setManualUPCInput('');
    setShowDataSources(false);
    setPricing(null);
    setManualBarcodeInput('');
    stopScanning();
    resetBarcodeScanner();
    
    // Clear product context from chatbot
    setAnalysisContext(null);
  };
  
  // Manual UPC lookup handler
  const handleManualUPCLookup = async () => {
    const cleanUPC = manualUPCInput.replace(/[^0-9]/g, '');
    if (cleanUPC.length < 8 || cleanUPC.length > 14) {
      toast.error('Please enter a valid UPC (8-14 digits)');
      return;
    }
    
    setIsLookingUpUPC(true);
    try {
      // Re-analyze with manual barcode
      if (selectedImage && analysisResult) {
        // Update the analysis result with the manual barcode and trigger re-lookup
        toast.info('Looking up UPC: ' + cleanUPC);
        
        // Call the analyze function with the image again, but this time we'll need to 
        // manually trigger a re-lookup. For now, just update the barcode field.
        setAnalysisResult({
          ...analysisResult,
          barcode: cleanUPC,
          barcode_type: cleanUPC.length === 12 ? 'UPC-A' : cleanUPC.length === 13 ? 'EAN-13' : 'unknown'
        });
        
        toast.success('UPC added. Re-scan for database lookup.');
        setShowManualUPC(false);
      }
    } catch (error) {
      console.error('Manual UPC lookup error:', error);
      toast.error('Failed to lookup UPC');
    } finally {
      setIsLookingUpUPC(false);
    }
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
                  ) : analysisResult?.product_type === 'household' ? (
                    <SprayCan className="h-7 w-7 text-primary drop-shadow-lg" />
                  ) : analysisResult?.product_type === 'personal_care' ? (
                    <Bath className="h-7 w-7 text-primary drop-shadow-lg" />
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
            {/* Initial Scan Mode Selection */}
            {!analysisResult && !isAnalyzing && !isScanning && (
              <div className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={scanMode === 'barcode' ? 'default' : 'outline'}
                    onClick={() => setScanMode('barcode')}
                    className="flex-1 gap-2"
                  >
                    <Barcode className="h-4 w-4" />
                    Barcode
                  </Button>
                  <Button
                    variant={scanMode === 'photo' ? 'default' : 'outline'}
                    onClick={() => setScanMode('photo')}
                    className="flex-1 gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Photo
                  </Button>
                </div>
                
                {/* Barcode Mode */}
                {scanMode === 'barcode' && (
                  <div className="space-y-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={startBarcodeScanning}
                        className="w-full h-24 flex flex-col gap-2 text-lg bg-gradient-to-r from-primary to-stats-heart hover:from-primary-glow hover:to-stats-heart shadow-lg"
                        size="lg"
                      >
                        <ScanLine className="h-8 w-8" />
                        Scan Barcode
                      </Button>
                    </motion.div>
                    
                    {/* Manual Entry */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Or enter barcode manually..."
                        value={manualBarcodeInput}
                        onChange={(e) => setManualBarcodeInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualBarcodeLookup()}
                        className="flex-1"
                      />
                      <Button onClick={handleManualBarcodeLookup} variant="outline">
                        Lookup
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Photo Mode */}
                {scanMode === 'photo' && (
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
                )}
                
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
                  <p className="text-xs bg-background/50 p-2 rounded-lg">
                    🧴 Skincare & cosmetics • 🧹 Cleaning supplies • 🧻 Household items
                  </p>
                  <p className="text-xs bg-background/50 p-2 rounded-lg">
                    🐕 Dog food • 🐈 Cat food • 🐾 Pet treats & supplies
                  </p>
                </div>
              </div>
            )}
            
            {/* Barcode Scanner Camera View */}
            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
                  <video 
                    ref={barcodeVideoRef} 
                    className="w-full h-full object-cover"
                    autoPlay 
                    playsInline 
                    muted 
                  />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-24 border-2 border-primary rounded-lg relative">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                      <motion.div
                        className="absolute left-2 right-2 h-0.5 bg-primary"
                        animate={{ top: ['10%', '90%', '10%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  </div>
                  {barcodeLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
                
                <p className="text-center text-muted-foreground text-sm">
                  Point camera at product barcode
                </p>
                
                <Button 
                  onClick={() => stopScanning()} 
                  variant="outline" 
                  className="w-full"
                >
                  Cancel
                </Button>
              </motion.div>
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
                          const grade = (analysisResult.health_grade?.letter || 'C').toUpperCase();
                          const productType = analysisResult.product_type || 'food';

                          // Non-edible items don't have NOVA/ingredient processing.
                          if (productType === 'household' || productType === 'personal_care') {
                            return "Safety-focused analysis";
                          }

                          const nova = analysisResult.detailed_processing?.nova_score ?? 0;
                          const artificialCount = analysisResult.chemical_analysis?.artificial_ingredients?.length ?? 0;

                          if (grade === 'D' || grade === 'F') {
                            if (nova >= 4) {
                              if (productType === 'beverage') return "⚠️ Ultra-processed beverage";
                              if (productType === 'supplement' || productType === 'medication') return "⚠️ Highly processed supplement";
                              return "⚠️ Ultra-processed food";
                            }
                            if (artificialCount > 0) return "⚠️ Contains artificial ingredients";
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

                {/* Price Comparison */}
                {pricing && (
                  <ProductPriceCard 
                    pricing={pricing} 
                    productName={analysisResult.product.name} 
                  />
                )}

                {/* Edible Products Section - Scan Nutrition Label Prompt & Nutrition Facts */}
                {analysisResult.product_type !== 'household' && analysisResult.product_type !== 'personal_care' && analysisResult.nutrition && (
                   <>
                {/* Scan Nutrition Label Prompt - shown when label not visible */}
                {analysisResult.needs_nutrition_scan && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-500/50 rounded-2xl p-5 shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
                        <Camera className="h-6 w-6 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-amber-600 mb-1 flex items-center gap-2">
                          📋 Nutrition Label Not Visible
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          You scanned the {analysisResult.side_detected || 'front'} of the package. 
                          To get exact nutrition facts, please scan the <strong>back</strong> where the Nutrition Facts label is located.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handlePhotoCapture('camera')}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                            size="sm"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Scan Nutrition Label
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-500/50 hover:bg-amber-500/10"
                            onClick={() => {
                              setEditedNutrition({
                                calories: analysisResult.nutrition.per_serving.calories || 0,
                                protein_g: analysisResult.nutrition.per_serving.protein_g || 0,
                                carbs_g: analysisResult.nutrition.per_serving.carbs_g || 0,
                                fat_g: analysisResult.nutrition.per_serving.fat_g || 0,
                                fiber_g: analysisResult.nutrition.per_serving.fiber_g || 0,
                                sugars_g: analysisResult.nutrition.per_serving.sugars_g || 0,
                                sodium_mg: analysisResult.nutrition.per_serving.sodium_mg || 0,
                                serving_size: analysisResult.nutrition.serving_size || ''
                              });
                              setIsEditingNutrition(true);
                            }}
                          >
                            ✏️ Enter Manually
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Nutrition Facts */}
                <div className={`bg-gradient-to-r from-background via-stats-exercises/5 to-background rounded-2xl border-2 p-6 shadow-xl ${
                  analysisResult.nutrition.quality_label === 'estimated' || analysisResult.needs_nutrition_scan
                    ? 'border-amber-500/50'
                    : 'border-stats-exercises/30'
                }`}>
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
                    {/* Quality Badge with Multi-Source Verification */}
                    <div className="flex items-center gap-2">
                      {/* Make Edit button more prominent when data quality is low */}
                      <Button
                        variant={analysisResult.nutrition.quality_label === 'estimated' || analysisResult.needs_nutrition_scan ? 'default' : 'ghost'}
                        size="sm"
                        className={`h-6 px-2 text-xs ${
                          analysisResult.nutrition.quality_label === 'estimated' || analysisResult.needs_nutrition_scan
                            ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                            : ''
                        }`}
                        onClick={() => {
                          setEditedNutrition({
                            calories: analysisResult.nutrition.per_serving.calories,
                            protein_g: analysisResult.nutrition.per_serving.protein_g,
                            carbs_g: analysisResult.nutrition.per_serving.carbs_g,
                            fat_g: analysisResult.nutrition.per_serving.fat_g,
                            fiber_g: analysisResult.nutrition.per_serving.fiber_g || 0,
                            sugars_g: analysisResult.nutrition.per_serving.sugars_g || 0,
                            sodium_mg: analysisResult.nutrition.per_serving.sodium_mg || 0,
                            serving_size: analysisResult.nutrition.serving_size
                          });
                          setIsEditingNutrition(true);
                        }}
                      >
                        {analysisResult.nutrition.quality_label === 'estimated' || analysisResult.needs_nutrition_scan 
                          ? '⚠️ Verify Values' 
                          : '✏️ Edit'}
                      </Button>
                    {(() => {
                      const dataSource = analysisResult.nutrition.data_source;
                      const databaseName = analysisResult.nutrition.database_name;
                      const qualityLabel = analysisResult.nutrition.quality_label;
                      const matchingSources = analysisResult.nutrition.matching_sources || [];
                      const consensusReached = analysisResult.nutrition.consensus_reached;
                      
                      // UPC verified (exact barcode match)
                      if (dataSource === 'upc_verified') {
                        return (
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ⭐⭐⭐ UPC Verified
                          </Badge>
                        );
                      }
                      
                      // User manually verified
                      if (dataSource === 'user_verified') {
                        return (
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ✓ User Verified
                          </Badge>
                        );
                      }
                      
                      // Multi-verified (2+ sources agree)
                      if (dataSource === 'multi_verified' || consensusReached) {
                        return (
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ⭐⭐⭐ Verified ({matchingSources.length > 0 ? matchingSources.join(' + ') : 'Multi-source'})
                          </Badge>
                        );
                      }
                      
                      // Quality label based verification
                      if (qualityLabel === 'verified') {
                        return (
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ⭐⭐⭐ Verified
                          </Badge>
                        );
                      }
                      
                      if (qualityLabel === 'likely_accurate') {
                        return (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ⭐⭐ {databaseName || 'Likely Accurate'}
                          </Badge>
                        );
                      }
                      
                      if (dataSource === 'database_verified') {
                        return (
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ⭐⭐ {databaseName || 'Database'}
                          </Badge>
                        );
                      }
                      
                      if (dataSource === 'database_scaled') {
                        return (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ⭐⭐ {databaseName} (scaled)
                          </Badge>
                        );
                      }
                      
                      if (dataSource === 'label_extracted') {
                        return (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ⭐⭐ Label verified
                          </Badge>
                        );
                      }
                      
                      if (dataSource === 'ai_extracted') {
                        return (
                          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-xs">
                            <Info className="h-3 w-3 mr-1" />
                            ⭐ AI extracted
                          </Badge>
                        );
                      }
                      
                      if (dataSource === 'partial_label') {
                        return (
                          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                            <Info className="h-3 w-3 mr-1" />
                            Partial data
                          </Badge>
                        );
                      }
                      
                      if (dataSource === 'estimated' || qualityLabel === 'estimated') {
                        return (
                          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            ⭐ Estimated
                          </Badge>
                        );
                      }
                      
                      return null;
                    })()}
                    </div>
                  </motion.h4>
                  
                  {/* Manual Nutrition Edit Form */}
                  {isEditingNutrition && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl"
                    >
                      <div className="text-sm font-medium mb-3 flex items-center gap-2">
                        ✏️ Edit Nutrition Values
                        <span className="text-xs text-muted-foreground">(per serving)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <label className="text-xs text-muted-foreground">Serving Size</label>
                          <input
                            type="text"
                            value={editedNutrition.serving_size}
                            onChange={(e) => setEditedNutrition(prev => ({ ...prev, serving_size: e.target.value }))}
                            className="w-full h-8 px-2 text-sm border border-border rounded-md bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Calories</label>
                          <input
                            type="number"
                            value={editedNutrition.calories}
                            onChange={(e) => setEditedNutrition(prev => ({ ...prev, calories: Number(e.target.value) }))}
                            className="w-full h-8 px-2 text-sm border border-border rounded-md bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Protein (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editedNutrition.protein_g}
                            onChange={(e) => setEditedNutrition(prev => ({ ...prev, protein_g: Number(e.target.value) }))}
                            className="w-full h-8 px-2 text-sm border border-border rounded-md bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Carbs (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editedNutrition.carbs_g}
                            onChange={(e) => setEditedNutrition(prev => ({ ...prev, carbs_g: Number(e.target.value) }))}
                            className="w-full h-8 px-2 text-sm border border-border rounded-md bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Fat (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editedNutrition.fat_g}
                            onChange={(e) => setEditedNutrition(prev => ({ ...prev, fat_g: Number(e.target.value) }))}
                            className="w-full h-8 px-2 text-sm border border-border rounded-md bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Sugars (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editedNutrition.sugars_g}
                            onChange={(e) => setEditedNutrition(prev => ({ ...prev, sugars_g: Number(e.target.value) }))}
                            className="w-full h-8 px-2 text-sm border border-border rounded-md bg-background"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (analysisResult) {
                              setAnalysisResult({
                                ...analysisResult,
                                nutrition: {
                                  ...analysisResult.nutrition,
                                  serving_size: editedNutrition.serving_size,
                                  data_source: 'user_verified',
                                  quality_label: 'verified',
                                  per_serving: {
                                    calories: editedNutrition.calories,
                                    protein_g: editedNutrition.protein_g,
                                    carbs_g: editedNutrition.carbs_g,
                                    fat_g: editedNutrition.fat_g,
                                    fiber_g: editedNutrition.fiber_g,
                                    sugars_g: editedNutrition.sugars_g,
                                    sodium_mg: editedNutrition.sodium_mg,
                                  }
                                }
                              });
                              toast.success('Nutrition values updated!');
                              setIsEditingNutrition(false);
                            }
                          }}
                        >
                          ✓ Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingNutrition(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Manual UPC Entry - shown when barcode not detected */}
                  {!analysisResult.barcode && !showManualUPC && (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Barcode not detected</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 border-amber-500/50 hover:bg-amber-500/10"
                          onClick={() => setShowManualUPC(true)}
                        >
                          Enter UPC Manually
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {showManualUPC && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl"
                    >
                      <div className="text-sm font-medium mb-3">📱 Enter UPC/Barcode Manually</div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter 8-14 digit UPC..."
                          value={manualUPCInput}
                          onChange={(e) => setManualUPCInput(e.target.value.replace(/[^0-9]/g, ''))}
                          className="flex-1 h-9 px-3 text-sm border border-border rounded-md bg-background"
                          maxLength={14}
                        />
                        <Button
                          size="sm"
                          onClick={handleManualUPCLookup}
                          disabled={isLookingUpUPC || manualUPCInput.length < 8}
                        >
                          {isLookingUpUPC ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lookup'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowManualUPC(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Look for the barcode on the product package. The UPC is the numbers below the bars.
                      </p>
                    </motion.div>
                  )}
                  
                  {/* Data Sources Transparency */}
                  {analysisResult.nutrition?.all_sources && analysisResult.nutrition.all_sources.length > 0 && (
                    <Collapsible open={showDataSources} onOpenChange={setShowDataSources}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mb-3 text-xs h-7 text-muted-foreground hover:text-foreground"
                        >
                          {showDataSources ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                          View all data sources ({analysisResult.nutrition.all_sources.length})
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border text-xs space-y-2">
                          <div className="font-medium text-foreground mb-2">📊 Nutrition Data Sources</div>
                          {analysisResult.nutrition.all_sources.map((source, idx) => (
                            <div 
                              key={idx}
                              className={`flex items-center justify-between p-2 rounded ${
                                source.name === analysisResult.nutrition.database_name 
                                  ? 'bg-stats-exercises/10 border border-stats-exercises/30'
                                  : 'bg-background/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {source.is_exact_match ? (
                                  <CheckCircle className="h-3 w-3 text-stats-exercises" />
                                ) : source.confidence >= 0.9 ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className={source.name === analysisResult.nutrition.database_name ? 'font-medium' : ''}>
                                  {source.name}
                                </span>
                                {source.is_exact_match && (
                                  <Badge className="h-4 text-[10px] bg-stats-exercises/20 text-stats-exercises border-0">
                                    Exact Match
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <span>{source.calories} cal</span>
                                <span>per {source.serving_grams}g</span>
                                {source.name === analysisResult.nutrition.database_name && (
                                  <span className="text-stats-exercises">✓ Used</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {analysisResult.nutrition.consensus_reached && (
                            <div className="mt-2 pt-2 border-t border-border text-muted-foreground">
                              ✅ Multiple sources agree on nutrition values
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                  
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

                  {/* Package Info & Size Selector */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 pt-4 border-t border-border"
                  >
                    {/* Detected Package Net Weight */}
                    {(analysisResult.product?.net_weight || analysisResult.nutrition?.servings_per_container) && (
                      <div className="flex items-center gap-3 mb-3 p-2 bg-primary/5 rounded-lg border border-primary/20">
                        <span className="text-lg">📦</span>
                        <div className="flex-1">
                          {analysisResult.product?.net_weight && (
                            <div className="text-sm font-medium text-foreground">
                              Package: {analysisResult.product.net_weight}
                              {analysisResult.product.net_weight_grams && (
                                <span className="text-muted-foreground ml-1">
                                  ({analysisResult.product.net_weight_grams}g)
                                </span>
                              )}
                            </div>
                          )}
                          {analysisResult.nutrition?.servings_per_container && (
                            <div className="text-xs text-muted-foreground">
                              ~{analysisResult.nutrition.servings_per_container} servings per container
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">🔢 Servings to log</span>
                      <div className="flex gap-1">
                        {(['single', 'regular', 'large', 'custom'] as const).map((size) => (
                          <Button
                            key={size}
                            variant={packageSize === size ? 'default' : 'outline'}
                            size="sm"
                            className={`text-xs px-2 py-1 h-7 ${packageSize === size ? 'bg-primary text-primary-foreground' : ''}`}
                            onClick={() => {
                              setPackageSize(size);
                              if (size !== 'custom') {
                                const detectedServings = analysisResult?.nutrition?.servings_per_container;
                                if (size === 'single') setCustomServings(1);
                                else if (size === 'regular') setCustomServings(detectedServings && detectedServings > 1 ? Math.min(detectedServings, 2) : 2);
                                else if (size === 'large') setCustomServings(detectedServings || 4);
                              }
                            }}
                          >
                            {size === 'single' ? '1x' : size === 'regular' ? '2x' : size === 'large' ? 'All' : 'Custom'}
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

                    {/* Show whole package nutrition */}
                    {(() => {
                      const detectedServings = analysisResult.nutrition?.servings_per_container;
                      const multiplier = packageSize === 'single' ? 1 : 
                                        packageSize === 'regular' ? (detectedServings && detectedServings > 1 ? Math.min(detectedServings, 2) : 2) : 
                                        packageSize === 'large' ? (detectedServings || 4) : 
                                        customServings;
                      
                      if (multiplier > 1) {
                        const total = {
                          calories: Math.round(analysisResult.nutrition.per_serving.calories * multiplier),
                          protein: Math.round(analysisResult.nutrition.per_serving.protein_g * multiplier * 10) / 10,
                          carbs: Math.round(analysisResult.nutrition.per_serving.carbs_g * multiplier * 10) / 10,
                          fat: Math.round(analysisResult.nutrition.per_serving.fat_g * multiplier * 10) / 10,
                        };
                        const totalGrams = analysisResult.nutrition.serving_size_grams 
                          ? Math.round(analysisResult.nutrition.serving_size_grams * multiplier)
                          : null;
                        
                        return (
                          <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                            <div className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                              📊 {packageSize === 'large' && detectedServings ? 'Whole Package' : `Total for ${multiplier.toFixed(1)} servings`}
                              {totalGrams && <span className="text-muted-foreground">({totalGrams}g)</span>}
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div>
                                <div className="font-bold text-lg text-stats-calories">{total.calories}</div>
                                <div className="text-[10px] text-muted-foreground">calories</div>
                              </div>
                              <div>
                                <div className="font-bold text-lg text-stats-heart">{total.protein}g</div>
                                <div className="text-[10px] text-muted-foreground">protein</div>
                              </div>
                              <div>
                                <div className="font-bold text-lg text-stats-duration">{total.carbs}g</div>
                                <div className="text-[10px] text-muted-foreground">carbs</div>
                              </div>
                              <div>
                                <div className="font-bold text-lg text-stats-exercises">{total.fat}g</div>
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
                  </>
                )}

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

                {/* Sourcing Intelligence Section - For all food/beverage */}
                {analysisResult.product_type !== 'household' && analysisResult.product_type !== 'personal_care' && analysisResult.sourcing_analysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/40 rounded-xl p-6 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg flex items-center gap-2 text-emerald-600">
                        🌍 Food Sourcing Intelligence
                      </h4>
                      {analysisResult.sourcing_analysis.sourcing_grade && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-xl font-bold border-2 shadow-lg ${
                            analysisResult.sourcing_analysis.sourcing_grade?.startsWith('A') ? 'bg-green-500/20 border-green-500 text-green-700' :
                            analysisResult.sourcing_analysis.sourcing_grade?.startsWith('B') ? 'bg-blue-500/20 border-blue-500 text-blue-700' :
                            analysisResult.sourcing_analysis.sourcing_grade?.startsWith('C') ? 'bg-yellow-500/20 border-yellow-500 text-yellow-700' :
                            'bg-red-500/20 border-red-500 text-red-700'
                          }`}
                        >
                          {analysisResult.sourcing_analysis.sourcing_grade}
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Country of Origin */}
                      {analysisResult.sourcing_analysis.country_of_origin && (
                        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                          <span className="text-2xl">📍</span>
                          <div className="flex-1">
                            <div className="font-medium text-foreground">
                              Origin: {analysisResult.sourcing_analysis.country_of_origin.country}
                              {analysisResult.sourcing_analysis.country_of_origin.region && (
                                <span className="text-muted-foreground"> ({analysisResult.sourcing_analysis.country_of_origin.region})</span>
                              )}
                            </div>
                            {analysisResult.sourcing_analysis.country_of_origin.text_found && (
                              <div className="text-sm text-muted-foreground italic">
                                "{analysisResult.sourcing_analysis.country_of_origin.text_found}"
                              </div>
                            )}
                            {analysisResult.sourcing_analysis.country_of_origin.locally_sourced && (
                              <Badge className="mt-1 bg-green-500/20 text-green-700 border-green-500/50">
                                🏠 Locally Sourced
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Organic Status */}
                      {analysisResult.sourcing_analysis.organic_status && (
                        <div className={`p-4 rounded-lg border-2 ${
                          analysisResult.sourcing_analysis.organic_status.is_organic 
                            ? 'bg-green-500/15 border-green-500/40' 
                            : analysisResult.sourcing_analysis.organic_status.pesticide_concern === 'high'
                              ? 'bg-red-500/15 border-red-500/40'
                              : 'bg-amber-500/15 border-amber-500/40'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">
                              {analysisResult.sourcing_analysis.organic_status.is_organic ? '🌱' : '🧪'}
                            </span>
                            <span className="font-bold text-foreground">
                              {analysisResult.sourcing_analysis.organic_status.is_organic 
                                ? 'Certified Organic' 
                                : 'Conventional (Non-Organic)'}
                            </span>
                            {analysisResult.sourcing_analysis.organic_status.certification && 
                             analysisResult.sourcing_analysis.organic_status.certification !== 'None' && (
                              <Badge className="bg-green-500/20 text-green-700 border-green-500/50">
                                {analysisResult.sourcing_analysis.organic_status.certification}
                              </Badge>
                            )}
                          </div>
                          {!analysisResult.sourcing_analysis.organic_status.is_organic && 
                           analysisResult.sourcing_analysis.organic_status.pesticide_details && (
                            <p className={`text-sm ${
                              analysisResult.sourcing_analysis.organic_status.pesticide_concern === 'high' 
                                ? 'text-red-700' 
                                : 'text-amber-700'
                            }`}>
                              ⚠️ {analysisResult.sourcing_analysis.organic_status.pesticide_details}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Farming Method */}
                      {analysisResult.sourcing_analysis.farming_method && (
                        <div className={`p-4 rounded-lg border-2 ${
                          analysisResult.sourcing_analysis.farming_method.health_impact === 'positive'
                            ? 'bg-green-500/15 border-green-500/40'
                            : analysisResult.sourcing_analysis.farming_method.is_factory_farmed
                              ? 'bg-red-500/15 border-red-500/40'
                              : 'bg-background border-border'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">
                              {analysisResult.sourcing_analysis.farming_method.is_factory_farmed ? '🏭' : '🌾'}
                            </span>
                            <span className="font-bold text-foreground capitalize">
                              {analysisResult.sourcing_analysis.farming_method.method?.replace(/_/g, ' ')}
                            </span>
                            {analysisResult.sourcing_analysis.farming_method.is_factory_farmed && (
                              <Badge className="bg-red-500/20 text-red-700 border-red-500/50">
                                Factory Farmed
                              </Badge>
                            )}
                          </div>
                          {analysisResult.sourcing_analysis.farming_method.details && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {analysisResult.sourcing_analysis.farming_method.details}
                            </p>
                          )}
                          {analysisResult.sourcing_analysis.farming_method.health_education && (
                            <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                              <p className="text-xs text-blue-700">
                                💡 {analysisResult.sourcing_analysis.farming_method.health_education}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fish Analysis - Prominent Section */}
                      {analysisResult.sourcing_analysis.fish_analysis?.is_fish_product && (
                        <div className={`p-4 rounded-xl border-2 ${
                          analysisResult.sourcing_analysis.fish_analysis.sourcing === 'farm_raised' 
                            ? 'bg-red-500/20 border-red-500/50' 
                            : analysisResult.sourcing_analysis.fish_analysis.sourcing === 'wild_caught'
                              ? 'bg-green-500/20 border-green-500/50' 
                              : 'bg-gray-500/20 border-gray-500/50'
                        }`}>
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">🐟</span>
                            <div>
                              <div className="font-bold text-lg capitalize">
                                {analysisResult.sourcing_analysis.fish_analysis.fish_type || 'Fish/Seafood'}
                              </div>
                              <Badge className={`text-sm ${
                                analysisResult.sourcing_analysis.fish_analysis.sourcing === 'wild_caught' 
                                  ? 'bg-green-600 text-white' 
                                  : analysisResult.sourcing_analysis.fish_analysis.sourcing === 'farm_raised'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-600 text-white'
                              }`}>
                                {analysisResult.sourcing_analysis.fish_analysis.sourcing === 'wild_caught' 
                                  ? '🌊 Wild Caught' 
                                  : analysisResult.sourcing_analysis.fish_analysis.sourcing === 'farm_raised'
                                    ? '🏭 Farm Raised'
                                    : '❓ Unknown Source'}
                              </Badge>
                            </div>
                          </div>

                          {/* Mercury Warning */}
                          <div className={`p-3 rounded-lg mb-3 ${
                            analysisResult.sourcing_analysis.fish_analysis.mercury_level === 'high' || 
                            analysisResult.sourcing_analysis.fish_analysis.mercury_level === 'very_high'
                              ? 'bg-red-500/30 border border-red-500/50'
                              : analysisResult.sourcing_analysis.fish_analysis.mercury_level === 'moderate'
                                ? 'bg-amber-500/30 border border-amber-500/50'
                                : 'bg-green-500/20 border border-green-500/40'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Mercury Level:</span>
                              <span className={`font-bold uppercase ${
                                analysisResult.sourcing_analysis.fish_analysis.mercury_level === 'high' || 
                                analysisResult.sourcing_analysis.fish_analysis.mercury_level === 'very_high'
                                  ? 'text-red-700'
                                  : analysisResult.sourcing_analysis.fish_analysis.mercury_level === 'moderate'
                                    ? 'text-amber-700'
                                    : 'text-green-700'
                              }`}>
                                {analysisResult.sourcing_analysis.fish_analysis.mercury_level?.replace('_', ' ')}
                                {analysisResult.sourcing_analysis.fish_analysis.mercury_ppb && (
                                  <span className="text-sm font-normal ml-1">
                                    ({analysisResult.sourcing_analysis.fish_analysis.mercury_ppb} ppb)
                                  </span>
                                )}
                              </span>
                            </div>
                            {(analysisResult.sourcing_analysis.fish_analysis.mercury_level === 'high' || 
                              analysisResult.sourcing_analysis.fish_analysis.mercury_level === 'very_high') && (
                              <p className="text-xs text-red-700 mt-2">
                                ⚠️ FDA recommends limiting consumption. Pregnant women and children should avoid.
                              </p>
                            )}
                          </div>

                          {/* Omega-3 & Sustainability */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="p-2 bg-background/50 rounded-lg border border-border">
                              <span className="text-xs text-muted-foreground">Omega-3 Content</span>
                              <p className="font-medium capitalize">
                                {analysisResult.sourcing_analysis.fish_analysis.omega3_ratio}
                              </p>
                            </div>
                            {analysisResult.sourcing_analysis.fish_analysis.sustainability_rating && (
                              <div className="p-2 bg-background/50 rounded-lg border border-border">
                                <span className="text-xs text-muted-foreground">Sustainability</span>
                                <p className="font-medium text-sm">
                                  {analysisResult.sourcing_analysis.fish_analysis.sustainability_rating}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Health Insights */}
                          {analysisResult.sourcing_analysis.fish_analysis.health_insights && (
                            <div className="space-y-2">
                              {analysisResult.sourcing_analysis.fish_analysis.health_insights.pros?.length > 0 && (
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                  <span className="text-xs font-bold text-green-700">✅ Pros:</span>
                                  <p className="text-sm text-green-700">
                                    {analysisResult.sourcing_analysis.fish_analysis.health_insights.pros.join(', ')}
                                  </p>
                                </div>
                              )}
                              {analysisResult.sourcing_analysis.fish_analysis.health_insights.cons?.length > 0 && (
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                  <span className="text-xs font-bold text-red-700">⚠️ Cons:</span>
                                  <p className="text-sm text-red-700">
                                    {analysisResult.sourcing_analysis.fish_analysis.health_insights.cons.join(', ')}
                                  </p>
                                </div>
                              )}
                              {analysisResult.sourcing_analysis.fish_analysis.health_insights.recommendation && (
                                <div className="p-3 bg-blue-500/15 rounded-lg border border-blue-500/30">
                                  <span className="text-xs font-bold text-blue-700">💡 Recommendation:</span>
                                  <p className="text-sm text-blue-700 mt-1">
                                    {analysisResult.sourcing_analysis.fish_analysis.health_insights.recommendation}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Certifications */}
                      {analysisResult.sourcing_analysis.certifications && 
                       analysisResult.sourcing_analysis.certifications.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-emerald-600 mb-2">✓ Certifications</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {analysisResult.sourcing_analysis.certifications.map((cert, index) => (
                              <div 
                                key={index} 
                                className={`p-2 rounded-lg border ${
                                  cert.verified 
                                    ? 'bg-emerald-500/15 border-emerald-500/40' 
                                    : 'bg-gray-500/10 border-gray-500/30'
                                }`}
                              >
                                <div className="font-medium text-sm flex items-center gap-1">
                                  {cert.verified && <CheckCircle className="h-3 w-3 text-emerald-600" />}
                                  {cert.name}
                                </div>
                                {cert.what_it_means && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {cert.what_it_means}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Household/Personal Care Product Analysis */}
                {analysisResult.household_analysis && (analysisResult.product_type === 'household' || analysisResult.product_type === 'personal_care') && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4"
                  >
                    {/* Safety Grade Header */}
                    <div className={`rounded-xl p-6 border-2 shadow-xl ${
                      analysisResult.household_analysis.safety_score >= 80 ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/50' :
                      analysisResult.household_analysis.safety_score >= 60 ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border-yellow-500/50' :
                      analysisResult.household_analysis.safety_score >= 40 ? 'bg-gradient-to-br from-orange-500/20 to-red-500/10 border-orange-500/50' :
                      'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold flex items-center gap-2">
                            {analysisResult.product_type === 'personal_care' ? '🧴' : '🧹'} Safety Analysis
                          </h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {analysisResult.household_analysis.product_category?.replace('_', ' ')} Product
                          </p>
                        </div>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-4 ${
                          analysisResult.household_analysis.safety_score >= 80 ? 'bg-green-500/80 border-green-400 text-white' :
                          analysisResult.household_analysis.safety_score >= 60 ? 'bg-yellow-500/80 border-yellow-400 text-white' :
                          analysisResult.household_analysis.safety_score >= 40 ? 'bg-orange-500/80 border-orange-400 text-white' :
                          'bg-red-500/80 border-red-400 text-white'
                        }`}>
                          {analysisResult.household_analysis.safety_grade}
                        </div>
                      </div>
                      <div className="mt-4">
                        <Progress value={analysisResult.household_analysis.safety_score} className="h-3" />
                        <p className="text-xs text-muted-foreground mt-1">Safety Score: {analysisResult.household_analysis.safety_score}/100</p>
                      </div>
                    </div>

                    {/* Safety Warnings */}
                    {analysisResult.household_analysis.safety_warnings && (
                      <div className="bg-gradient-to-br from-red-500/15 to-orange-500/10 border-2 border-red-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          ⚠️ Safety Warnings
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          {analysisResult.household_analysis.safety_warnings.skin_contact !== 'safe' && (
                            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                              <span className="text-2xl">🖐️</span>
                              <p className="font-medium text-sm text-red-700 mt-1">Skin Contact</p>
                              <p className="text-xs text-red-600 capitalize">{analysisResult.household_analysis.safety_warnings.skin_contact}</p>
                            </div>
                          )}
                          {analysisResult.household_analysis.safety_warnings.eye_contact !== 'safe' && (
                            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                              <span className="text-2xl">👁️</span>
                              <p className="font-medium text-sm text-red-700 mt-1">Eye Contact</p>
                              <p className="text-xs text-red-600 capitalize">{analysisResult.household_analysis.safety_warnings.eye_contact?.replace('_', ' ')}</p>
                            </div>
                          )}
                          {analysisResult.household_analysis.safety_warnings.inhalation !== 'safe' && (
                            <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                              <span className="text-2xl">🫁</span>
                              <p className="font-medium text-sm text-orange-700 mt-1">Inhalation</p>
                              <p className="text-xs text-orange-600 capitalize">{analysisResult.household_analysis.safety_warnings.inhalation?.replace('_', ' ')}</p>
                            </div>
                          )}
                          {analysisResult.household_analysis.safety_warnings.ingestion !== 'safe' && (
                            <div className="p-3 bg-red-600/10 rounded-lg border border-red-600/30">
                              <span className="text-2xl">☠️</span>
                              <p className="font-medium text-sm text-red-700 mt-1">If Swallowed</p>
                              <p className="text-xs text-red-600 capitalize">{analysisResult.household_analysis.safety_warnings.ingestion}</p>
                            </div>
                          )}
                          {analysisResult.household_analysis.safety_warnings.keep_away_children && (
                            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                              <span className="text-2xl">👶</span>
                              <p className="font-medium text-sm text-purple-700 mt-1">Keep Away</p>
                              <p className="text-xs text-purple-600">From Children</p>
                            </div>
                          )}
                          {analysisResult.household_analysis.safety_warnings.pregnancy_warning && (
                            <div className="p-3 bg-pink-500/10 rounded-lg border border-pink-500/30">
                              <span className="text-2xl">🤰</span>
                              <p className="font-medium text-sm text-pink-700 mt-1">Pregnancy</p>
                              <p className="text-xs text-pink-600">Consult Doctor</p>
                            </div>
                          )}
                        </div>
                        {analysisResult.household_analysis.safety_warnings.label_warnings?.length > 0 && (
                          <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                            <p className="font-medium text-sm text-yellow-700 mb-2">📋 Label Warnings:</p>
                            <ul className="text-sm text-yellow-700 space-y-1">
                              {analysisResult.household_analysis.safety_warnings.label_warnings.map((warning, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span>•</span> {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {analysisResult.household_analysis.safety_warnings.first_aid && (
                          <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                            <p className="font-medium text-sm text-blue-700">🩹 First Aid:</p>
                            <p className="text-sm text-blue-600">{analysisResult.household_analysis.safety_warnings.first_aid}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chemical Concerns */}
                    {analysisResult.household_analysis.chemical_concerns && (
                      <div className="bg-gradient-to-br from-purple-500/15 to-pink-500/10 border-2 border-purple-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-purple-600 mb-4 flex items-center gap-2">
                          <Beaker className="h-5 w-5" />
                          🧪 Chemical Analysis
                        </h5>
                        <div className="space-y-3">
                          {analysisResult.household_analysis.chemical_concerns.forever_chemicals?.detected?.length > 0 && (
                            <div className="p-4 bg-red-600/20 rounded-lg border-2 border-red-600/50">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">☠️</span>
                                <span className="font-bold text-red-700">FOREVER CHEMICALS (PFAS)</span>
                                <Badge className="bg-red-600 text-white">CRITICAL</Badge>
                              </div>
                              <p className="text-sm text-red-700">
                                Detected: {analysisResult.household_analysis.chemical_concerns.forever_chemicals.detected.join(', ')}
                              </p>
                              {analysisResult.household_analysis.chemical_concerns.forever_chemicals.health_effects && (
                                <p className="text-xs text-red-600 mt-1">
                                  Health effects: {analysisResult.household_analysis.chemical_concerns.forever_chemicals.health_effects.join(', ')}
                                </p>
                              )}
                              {analysisResult.household_analysis.chemical_concerns.forever_chemicals.bioaccumulation_warning && (
                                <p className="text-xs text-red-700 font-medium mt-2">
                                  ⚠️ Bioaccumulates in body - cannot be eliminated once absorbed
                                </p>
                              )}
                            </div>
                          )}
                          
                          {analysisResult.household_analysis.chemical_concerns.endocrine_disruptors?.detected?.length > 0 && (
                            <div className="p-4 bg-orange-500/15 rounded-lg border border-orange-500/40">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">⚠️</span>
                                <span className="font-bold text-orange-700">Endocrine Disruptors</span>
                                <Badge className={`${
                                  analysisResult.household_analysis.chemical_concerns.endocrine_disruptors.risk_level === 'critical' ? 'bg-red-600' :
                                  analysisResult.household_analysis.chemical_concerns.endocrine_disruptors.risk_level === 'high' ? 'bg-orange-600' : 'bg-yellow-600'
                                } text-white`}>
                                  {analysisResult.household_analysis.chemical_concerns.endocrine_disruptors.risk_level}
                                </Badge>
                              </div>
                              <p className="text-sm text-orange-700">
                                Detected: {analysisResult.household_analysis.chemical_concerns.endocrine_disruptors.detected.join(', ')}
                              </p>
                              {analysisResult.household_analysis.chemical_concerns.endocrine_disruptors.health_effects && (
                                <p className="text-xs text-orange-600 mt-1">
                                  Effects: {analysisResult.household_analysis.chemical_concerns.endocrine_disruptors.health_effects.join(', ')}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {analysisResult.household_analysis.chemical_concerns.carcinogens?.detected?.length > 0 && (
                            <div className="p-4 bg-red-500/15 rounded-lg border border-red-500/40">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🚨</span>
                                <span className="font-bold text-red-700">Potential Carcinogens</span>
                                <Badge className="bg-red-600 text-white">HIGH CONCERN</Badge>
                              </div>
                              <p className="text-sm text-red-700">
                                Detected: {analysisResult.household_analysis.chemical_concerns.carcinogens.detected.join(', ')}
                              </p>
                            </div>
                          )}
                          
                          {analysisResult.household_analysis.chemical_concerns.sensitizers_irritants?.detected?.length > 0 && (
                            <div className="p-4 bg-yellow-500/15 rounded-lg border border-yellow-500/40">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🖐️</span>
                                <span className="font-bold text-yellow-700">Skin Irritants/Sensitizers</span>
                              </div>
                              <p className="text-sm text-yellow-700">
                                {analysisResult.household_analysis.chemical_concerns.sensitizers_irritants.detected.join(', ')}
                              </p>
                            </div>
                          )}
                          
                          {analysisResult.household_analysis.chemical_concerns.microplastics?.detected?.length > 0 && (
                            <div className="p-4 bg-blue-500/15 rounded-lg border border-blue-500/40">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🌊</span>
                                <span className="font-bold text-blue-700">Microplastics</span>
                              </div>
                              <p className="text-sm text-blue-700">
                                {analysisResult.household_analysis.chemical_concerns.microplastics.detected.join(', ')}
                              </p>
                              {analysisResult.household_analysis.chemical_concerns.microplastics.environmental_impact && (
                                <p className="text-xs text-blue-600 mt-1">
                                  🌍 {analysisResult.household_analysis.chemical_concerns.microplastics.environmental_impact}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {analysisResult.household_analysis.chemical_concerns.environmental_toxins?.detected?.length > 0 && (
                            <div className="p-4 bg-teal-500/15 rounded-lg border border-teal-500/40">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🐟</span>
                                <span className="font-bold text-teal-700">Environmental Hazards</span>
                              </div>
                              <p className="text-sm text-teal-700">
                                {analysisResult.household_analysis.chemical_concerns.environmental_toxins.detected.join(', ')}
                              </p>
                              {analysisResult.household_analysis.chemical_concerns.environmental_toxins.environmental_impact && (
                                <p className="text-xs text-teal-600 mt-1">
                                  Impact: {analysisResult.household_analysis.chemical_concerns.environmental_toxins.environmental_impact}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Environmental Rating */}
                    {analysisResult.household_analysis.environmental_rating && (
                      <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border-2 border-emerald-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-emerald-600 mb-4 flex items-center gap-2">
                          <Leaf className="h-5 w-5" />
                          🌍 Environmental Impact
                        </h5>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Eco Score</p>
                            <Progress value={analysisResult.household_analysis.environmental_rating.score} className="w-32 h-2 mt-1" />
                          </div>
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                            analysisResult.household_analysis.environmental_rating.score >= 80 ? 'bg-green-500 text-white' :
                            analysisResult.household_analysis.environmental_rating.score >= 60 ? 'bg-yellow-500 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            {analysisResult.household_analysis.environmental_rating.grade}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className={`p-2 rounded-lg ${analysisResult.household_analysis.environmental_rating.biodegradable ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <span className="text-lg">{analysisResult.household_analysis.environmental_rating.biodegradable ? '✅' : '❌'}</span>
                            <p className="text-xs mt-1">Biodegradable</p>
                          </div>
                          <div className={`p-2 rounded-lg ${analysisResult.household_analysis.environmental_rating.cruelty_free ? 'bg-green-500/20' : 'bg-gray-500/10'}`}>
                            <span className="text-lg">{analysisResult.household_analysis.environmental_rating.cruelty_free ? '🐰' : '❓'}</span>
                            <p className="text-xs mt-1">Cruelty Free</p>
                          </div>
                          <div className={`p-2 rounded-lg ${analysisResult.household_analysis.environmental_rating.packaging_recyclable ? 'bg-green-500/20' : 'bg-gray-500/10'}`}>
                            <span className="text-lg">{analysisResult.household_analysis.environmental_rating.packaging_recyclable ? '♻️' : '🗑️'}</span>
                            <p className="text-xs mt-1">Recyclable</p>
                          </div>
                        </div>
                        {analysisResult.household_analysis.environmental_rating.concerns?.length > 0 && (
                          <div className="mt-3 p-2 bg-orange-500/10 rounded-lg">
                            <p className="text-xs text-orange-700">
                              ⚠️ {analysisResult.household_analysis.environmental_rating.concerns.join(' • ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Certifications */}
                    {analysisResult.household_analysis.certifications && (
                      <div className="bg-gradient-to-br from-blue-500/15 to-indigo-500/10 border-2 border-blue-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-blue-600 mb-3 flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          ✓ Certifications
                        </h5>
                        {analysisResult.household_analysis.certifications.detected?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {analysisResult.household_analysis.certifications.detected.map((cert, i) => (
                              <Badge key={i} className="bg-green-500/20 text-green-700 border-green-500/50">
                                ✅ {cert}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {analysisResult.household_analysis.certifications.missing_important?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Missing certifications:</p>
                            <div className="flex flex-wrap gap-1">
                              {analysisResult.household_analysis.certifications.missing_important.map((cert, i) => (
                                <Badge key={i} variant="outline" className="text-xs opacity-60">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Better Alternatives */}
                    {analysisResult.household_analysis.better_alternatives && analysisResult.household_analysis.better_alternatives.length > 0 && (
                      <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/10 border-2 border-green-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-green-600 mb-3 flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          💡 Safer Alternatives
                        </h5>
                        <div className="space-y-3">
                          {analysisResult.household_analysis.better_alternatives.map((alt, i) => (
                            <div key={i} className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                              <p className="font-bold text-green-700">{alt.product_name}</p>
                              {alt.brand && <p className="text-sm text-green-600">by {alt.brand}</p>}
                              <p className="text-sm text-foreground mt-2">{alt.why_better}</p>
                              {alt.chemical_comparison && (
                                <p className="text-xs text-green-600 mt-1">✅ {alt.chemical_comparison}</p>
                              )}
                              {alt.where_to_find && (
                                <p className="text-xs text-muted-foreground mt-1">📍 {alt.where_to_find}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Overall Assessment */}
                    {analysisResult.household_analysis.overall_assessment && (
                      <div className="bg-gradient-to-br from-slate-500/15 to-gray-500/10 border-2 border-slate-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-slate-600 mb-3">📋 Overall Assessment</h5>
                        <p className="text-sm font-medium mb-3">{analysisResult.household_analysis.overall_assessment.verdict}</p>
                        
                        {analysisResult.household_analysis.overall_assessment.pros?.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-bold text-green-600">Pros:</span>
                            <ul className="text-sm text-green-700 ml-4">
                              {analysisResult.household_analysis.overall_assessment.pros.map((pro, i) => (
                                <li key={i}>✓ {pro}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysisResult.household_analysis.overall_assessment.cons?.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-bold text-red-600">Cons:</span>
                            <ul className="text-sm text-red-700 ml-4">
                              {analysisResult.household_analysis.overall_assessment.cons.map((con, i) => (
                                <li key={i}>✗ {con}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysisResult.household_analysis.overall_assessment.recommendation && (
                          <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                            <p className="text-sm text-blue-700">
                              💡 <strong>Recommendation:</strong> {analysisResult.household_analysis.overall_assessment.recommendation}
                            </p>
                          </div>
                        )}
                        
                        {analysisResult.household_analysis.overall_assessment.who_should_avoid?.length > 0 && (
                          <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                            <p className="text-sm text-red-700">
                              ⚠️ <strong>Who should avoid:</strong> {analysisResult.household_analysis.overall_assessment.who_should_avoid.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Pet Food Analysis Section */}
                {analysisResult.product_type === 'pet_food' && analysisResult.pet_food_analysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-5"
                  >
                    {/* Pet Food Quality Grade Card */}
                    <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-500/40 rounded-xl p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-lg flex items-center gap-2 text-amber-600">
                          🐾 Pet Food Quality Grade
                        </h4>
                        {analysisResult.pet_food_analysis.quality_grade && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl font-bold border-3 shadow-lg ${
                              analysisResult.pet_food_analysis.quality_grade.letter?.startsWith('A') ? 'bg-green-500/20 border-green-500 text-green-700' :
                              analysisResult.pet_food_analysis.quality_grade.letter?.startsWith('B') ? 'bg-blue-500/20 border-blue-500 text-blue-700' :
                              analysisResult.pet_food_analysis.quality_grade.letter?.startsWith('C') ? 'bg-yellow-500/20 border-yellow-500 text-yellow-700' :
                              analysisResult.pet_food_analysis.quality_grade.letter?.startsWith('D') ? 'bg-orange-500/20 border-orange-500 text-orange-700' :
                              'bg-red-500/20 border-red-500 text-red-700'
                            }`}
                          >
                            {analysisResult.pet_food_analysis.quality_grade.letter}
                          </motion.div>
                        )}
                      </div>
                      
                      {analysisResult.pet_food_analysis.quality_grade && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Progress value={analysisResult.pet_food_analysis.quality_grade.score} className="flex-1 h-3" />
                            <span className="text-sm font-bold text-amber-700">{analysisResult.pet_food_analysis.quality_grade.score}/100</span>
                          </div>
                          {analysisResult.pet_food_analysis.quality_grade.aafco_compliant !== undefined && (
                            <Badge className={`${analysisResult.pet_food_analysis.quality_grade.aafco_compliant ? 'bg-green-500/20 text-green-700 border-green-500/50' : 'bg-red-500/20 text-red-700 border-red-500/50'}`}>
                              {analysisResult.pet_food_analysis.quality_grade.aafco_compliant ? '✅ AAFCO Compliant' : '❌ Not AAFCO Compliant'}
                            </Badge>
                          )}
                          {analysisResult.pet_food_analysis.quality_grade.reasoning && (
                            <p className="text-sm text-muted-foreground">{analysisResult.pet_food_analysis.quality_grade.reasoning}</p>
                          )}
                        </div>
                      )}
                      
                      {/* Pet Info */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {analysisResult.pet_food_analysis.animal_type && (
                          <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/50 capitalize">
                            {analysisResult.pet_food_analysis.animal_type === 'dog' ? '🐕' : analysisResult.pet_food_analysis.animal_type === 'cat' ? '🐈' : '🐾'} {analysisResult.pet_food_analysis.animal_type}
                          </Badge>
                        )}
                        {analysisResult.pet_food_analysis.life_stage && (
                          <Badge variant="outline" className="capitalize">{analysisResult.pet_food_analysis.life_stage.replace('_', ' ')}</Badge>
                        )}
                        {analysisResult.pet_food_analysis.food_type && (
                          <Badge variant="outline" className="capitalize">{analysisResult.pet_food_analysis.food_type.replace('_', ' ')}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Protein Analysis Card */}
                    {analysisResult.pet_food_analysis.protein_analysis && (
                      <div className="bg-gradient-to-br from-red-500/15 to-orange-500/10 border-2 border-red-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                          🥩 Protein Analysis
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          {analysisResult.pet_food_analysis.protein_analysis.primary_protein_source && (
                            <div className="p-3 bg-red-500/10 rounded-lg">
                              <span className="text-xs text-muted-foreground">Primary Protein</span>
                              <p className="font-medium capitalize">{analysisResult.pet_food_analysis.protein_analysis.primary_protein_source.replace('_', ' ')}</p>
                            </div>
                          )}
                          {analysisResult.pet_food_analysis.protein_analysis.protein_quality && (
                            <div className={`p-3 rounded-lg ${
                              analysisResult.pet_food_analysis.protein_analysis.protein_quality === 'whole_meat' ? 'bg-green-500/10' :
                              analysisResult.pet_food_analysis.protein_analysis.protein_quality === 'meat_meal' ? 'bg-yellow-500/10' :
                              'bg-red-500/10'
                            }`}>
                              <span className="text-xs text-muted-foreground">Quality</span>
                              <p className="font-medium capitalize">{analysisResult.pet_food_analysis.protein_analysis.protein_quality.replace('_', ' ')}</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {analysisResult.pet_food_analysis.protein_analysis.is_named_protein && (
                            <Badge className="bg-green-500/20 text-green-700 border-green-500/50">✅ Named Protein</Badge>
                          )}
                          {analysisResult.pet_food_analysis.protein_analysis.animal_digest_present && (
                            <Badge className="bg-orange-500/20 text-orange-700 border-orange-500/50">⚠️ Contains Animal Digest</Badge>
                          )}
                          {analysisResult.pet_food_analysis.protein_analysis.protein_percentage !== undefined && (
                            <Badge variant="outline">Protein: {analysisResult.pet_food_analysis.protein_analysis.protein_percentage}%</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Toxic Ingredients Alert */}
                    {analysisResult.pet_food_analysis.toxic_ingredients_check?.detected_toxic?.length > 0 && (
                      <div className="bg-gradient-to-br from-red-600/30 to-red-500/20 border-2 border-red-600 rounded-xl p-5">
                        <h5 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                          <Skull className="h-5 w-5" />
                          ☠️ TOXIC INGREDIENTS DETECTED
                        </h5>
                        <div className="space-y-2">
                          {analysisResult.pet_food_analysis.toxic_ingredients_check.detected_toxic.map((toxic, i) => (
                            <div key={i} className="p-3 bg-red-600/20 rounded-lg border border-red-600/50">
                              <span className="font-bold text-red-700">{toxic}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-red-700 mt-3 font-medium">
                          ⚠️ DO NOT FEED TO YOUR PET - These ingredients can cause serious harm or death!
                        </p>
                      </div>
                    )}

                    {/* Concerning Ingredients Grid */}
                    {analysisResult.pet_food_analysis.concerning_ingredients && (
                      <div className="bg-gradient-to-br from-yellow-500/15 to-orange-500/10 border-2 border-yellow-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-yellow-700 mb-3 flex items-center gap-2">
                          ⚠️ Concerning Ingredients
                        </h5>
                        <div className="space-y-3">
                          {analysisResult.pet_food_analysis.concerning_ingredients.artificial_colors?.length > 0 && (
                            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                              <span className="text-xs font-bold text-yellow-700">🎨 Artificial Colors:</span>
                              <p className="text-sm">{analysisResult.pet_food_analysis.concerning_ingredients.artificial_colors.join(', ')}</p>
                            </div>
                          )}
                          {analysisResult.pet_food_analysis.concerning_ingredients.artificial_preservatives?.length > 0 && (
                            <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                              <span className="text-xs font-bold text-orange-700">🧪 Artificial Preservatives:</span>
                              <p className="text-sm">{analysisResult.pet_food_analysis.concerning_ingredients.artificial_preservatives.join(', ')}</p>
                            </div>
                          )}
                          {analysisResult.pet_food_analysis.concerning_ingredients.fillers?.length > 0 && (
                            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                              <span className="text-xs font-bold text-amber-700">🌾 Fillers:</span>
                              <p className="text-sm">{analysisResult.pet_food_analysis.concerning_ingredients.fillers.join(', ')}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {analysisResult.pet_food_analysis.concerning_ingredients.meat_by_products && (
                              <Badge className="bg-orange-500/20 text-orange-700 border-orange-500/50">Contains By-Products</Badge>
                            )}
                            {analysisResult.pet_food_analysis.concerning_ingredients.corn_syrup && (
                              <Badge className="bg-red-500/20 text-red-700 border-red-500/50">Contains Corn Syrup</Badge>
                            )}
                            {analysisResult.pet_food_analysis.concerning_ingredients.propylene_glycol && (
                              <Badge className="bg-red-500/20 text-red-700 border-red-500/50">⚠️ Propylene Glycol</Badge>
                            )}
                            {analysisResult.pet_food_analysis.concerning_ingredients.carrageenan && (
                              <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/50">Carrageenan</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Synthetic Ingredients */}
                    {analysisResult.pet_food_analysis.synthetic_ingredients && analysisResult.pet_food_analysis.synthetic_ingredients.length > 0 && (
                      <div className="bg-gradient-to-br from-purple-500/15 to-pink-500/10 border-2 border-purple-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-purple-700 mb-3 flex items-center gap-2">
                          <Beaker className="h-5 w-5" />
                          🧪 Synthetic Ingredients
                        </h5>
                        <div className="space-y-2">
                          {analysisResult.pet_food_analysis.synthetic_ingredients.map((synthetic, i) => (
                            <div key={i} className={`p-3 rounded-lg border ${
                              synthetic.concern_level === 'critical' ? 'bg-red-500/20 border-red-500/50' :
                              synthetic.concern_level === 'high' ? 'bg-orange-500/20 border-orange-500/50' :
                              synthetic.concern_level === 'moderate' ? 'bg-yellow-500/20 border-yellow-500/50' :
                              'bg-purple-500/10 border-purple-500/30'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{synthetic.name}</span>
                                {synthetic.concern_level && (
                                  <Badge className={`text-xs ${
                                    synthetic.concern_level === 'critical' ? 'bg-red-600 text-white' :
                                    synthetic.concern_level === 'high' ? 'bg-orange-500 text-white' :
                                    synthetic.concern_level === 'moderate' ? 'bg-yellow-500 text-black' :
                                    'bg-gray-500 text-white'
                                  }`}>
                                    {synthetic.concern_level}
                                  </Badge>
                                )}
                              </div>
                              {synthetic.effects?.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">{synthetic.effects.join(', ')}</p>
                              )}
                              {synthetic.banned_in?.length > 0 && (
                                <p className="text-xs text-red-600 mt-1">⚠️ Banned in: {synthetic.banned_in.join(', ')}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ingredient Sourcing */}
                    {analysisResult.pet_food_analysis.ingredient_sourcing && (
                      <div className="bg-gradient-to-br from-blue-500/15 to-cyan-500/10 border-2 border-blue-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-blue-600 mb-3 flex items-center gap-2">
                          <Globe className="h-5 w-5" />
                          🌍 Ingredient Sourcing
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          {analysisResult.pet_food_analysis.ingredient_sourcing.country_of_origin && (
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                              <span className="text-xs text-muted-foreground">Origin</span>
                              <p className="font-medium">{analysisResult.pet_food_analysis.ingredient_sourcing.country_of_origin}</p>
                            </div>
                          )}
                          {analysisResult.pet_food_analysis.ingredient_sourcing.manufacturing_location && (
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                              <span className="text-xs text-muted-foreground">Made In</span>
                              <p className="font-medium">{analysisResult.pet_food_analysis.ingredient_sourcing.manufacturing_location}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {analysisResult.pet_food_analysis.ingredient_sourcing.made_in_usa && (
                            <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/50">🇺🇸 Made in USA</Badge>
                          )}
                          {analysisResult.pet_food_analysis.ingredient_sourcing.sourcing_transparency && (
                            <Badge variant="outline" className={`capitalize ${
                              analysisResult.pet_food_analysis.ingredient_sourcing.sourcing_transparency === 'high' ? 'border-green-500 text-green-700' :
                              analysisResult.pet_food_analysis.ingredient_sourcing.sourcing_transparency === 'medium' ? 'border-yellow-500 text-yellow-700' :
                              'border-red-500 text-red-700'
                            }`}>
                              Transparency: {analysisResult.pet_food_analysis.ingredient_sourcing.sourcing_transparency}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recalls */}
                    {analysisResult.pet_food_analysis.recalls?.has_recent_recalls && (
                      <div className="bg-gradient-to-br from-red-500/20 to-orange-500/15 border-2 border-red-500/50 rounded-xl p-5">
                        <h5 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                          🚨 Recall Alert
                        </h5>
                        {analysisResult.pet_food_analysis.recalls.recall_history?.length > 0 && (
                          <ul className="space-y-2">
                            {analysisResult.pet_food_analysis.recalls.recall_history.map((recall, i) => (
                              <li key={i} className="p-2 bg-red-500/10 rounded border border-red-500/30 text-sm">
                                {recall}
                              </li>
                            ))}
                          </ul>
                        )}
                        {analysisResult.pet_food_analysis.recalls.brand_recall_frequency && (
                          <Badge className={`mt-3 ${
                            analysisResult.pet_food_analysis.recalls.brand_recall_frequency === 'frequent' ? 'bg-red-600 text-white' :
                            analysisResult.pet_food_analysis.recalls.brand_recall_frequency === 'occasional' ? 'bg-orange-500 text-white' :
                            'bg-yellow-500 text-black'
                          }`}>
                            Brand Recall History: {analysisResult.pet_food_analysis.recalls.brand_recall_frequency}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Guaranteed Analysis */}
                    {analysisResult.pet_food_analysis.guaranteed_analysis && (
                      <div className="bg-gradient-to-br from-slate-500/15 to-gray-500/10 border-2 border-slate-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-slate-600 mb-3">📊 Guaranteed Analysis</h5>
                        <div className="grid grid-cols-2 gap-3">
                          {analysisResult.pet_food_analysis.guaranteed_analysis.crude_protein_min !== undefined && (
                            <div className="p-3 bg-background rounded-lg border border-border">
                              <span className="text-xs text-muted-foreground">Crude Protein (min)</span>
                              <p className="font-bold text-lg">{analysisResult.pet_food_analysis.guaranteed_analysis.crude_protein_min}%</p>
                            </div>
                          )}
                          {analysisResult.pet_food_analysis.guaranteed_analysis.crude_fat_min !== undefined && (
                            <div className="p-3 bg-background rounded-lg border border-border">
                              <span className="text-xs text-muted-foreground">Crude Fat (min)</span>
                              <p className="font-bold text-lg">{analysisResult.pet_food_analysis.guaranteed_analysis.crude_fat_min}%</p>
                            </div>
                          )}
                          {analysisResult.pet_food_analysis.guaranteed_analysis.crude_fiber_max !== undefined && (
                            <div className="p-3 bg-background rounded-lg border border-border">
                              <span className="text-xs text-muted-foreground">Crude Fiber (max)</span>
                              <p className="font-bold text-lg">{analysisResult.pet_food_analysis.guaranteed_analysis.crude_fiber_max}%</p>
                            </div>
                          )}
                          {analysisResult.pet_food_analysis.guaranteed_analysis.moisture_max !== undefined && (
                            <div className="p-3 bg-background rounded-lg border border-border">
                              <span className="text-xs text-muted-foreground">Moisture (max)</span>
                              <p className="font-bold text-lg">{analysisResult.pet_food_analysis.guaranteed_analysis.moisture_max}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Healthier Alternatives */}
                    {analysisResult.pet_food_analysis.healthier_alternatives && analysisResult.pet_food_analysis.healthier_alternatives.length > 0 && (
                      <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/10 border-2 border-green-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-green-600 mb-3 flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          💡 Healthier Alternatives
                        </h5>
                        <div className="space-y-3">
                          {analysisResult.pet_food_analysis.healthier_alternatives.map((alt, i) => (
                            <div key={i} className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                              <p className="font-bold text-green-700">{alt.product_name}</p>
                              {alt.brand && <p className="text-sm text-green-600">by {alt.brand}</p>}
                              <p className="text-sm text-foreground mt-2">{alt.why_better}</p>
                              {alt.key_improvements?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {alt.key_improvements.map((improvement, j) => (
                                    <Badge key={j} className="bg-green-500/20 text-green-700 border-green-500/50 text-xs">
                                      ✓ {improvement}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {alt.price_comparison && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  💵 Price: {alt.price_comparison}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Overall Assessment */}
                    {analysisResult.pet_food_analysis.overall_assessment && (
                      <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 border-2 border-amber-500/40 rounded-xl p-5">
                        <h5 className="font-bold text-amber-700 mb-3">📋 Overall Assessment</h5>
                        
                        {analysisResult.pet_food_analysis.overall_assessment.verdict && (
                          <p className="text-sm font-medium mb-3">{analysisResult.pet_food_analysis.overall_assessment.verdict}</p>
                        )}
                        
                        {analysisResult.pet_food_analysis.overall_assessment.pros?.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-bold text-green-600">Pros:</span>
                            <ul className="text-sm text-green-700 ml-4">
                              {analysisResult.pet_food_analysis.overall_assessment.pros.map((pro, i) => (
                                <li key={i}>✓ {pro}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysisResult.pet_food_analysis.overall_assessment.cons?.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-bold text-red-600">Cons:</span>
                            <ul className="text-sm text-red-700 ml-4">
                              {analysisResult.pet_food_analysis.overall_assessment.cons.map((con, i) => (
                                <li key={i}>✗ {con}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysisResult.pet_food_analysis.overall_assessment.recommendation && (
                          <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                            <p className="text-sm text-blue-700">
                              💡 <strong>Recommendation:</strong> {analysisResult.pet_food_analysis.overall_assessment.recommendation}
                            </p>
                          </div>
                        )}
                        
                        {analysisResult.pet_food_analysis.overall_assessment.suitable_for?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground">Best for:</span>
                            {analysisResult.pet_food_analysis.overall_assessment.suitable_for.map((suit, i) => (
                              <Badge key={i} variant="outline" className="text-xs capitalize">{suit}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Processing Deep Dive - Only show for food/beverage (not pet food or household) */}
                {analysisResult.product_type !== 'household' && analysisResult.product_type !== 'personal_care' && analysisResult.product_type !== 'pet_food' && analysisResult.detailed_processing && (
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

                {/* Sugar Analysis Deep Dive - Only for food/beverage (not pet food) */}
                {analysisResult.product_type !== 'household' && analysisResult.product_type !== 'personal_care' && analysisResult.product_type !== 'pet_food' && analysisResult.sugar_analysis && (
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

                {/* Chemical Analysis Deep Dive - Only for food/beverage (not pet food) */}
                {analysisResult.product_type !== 'household' && analysisResult.product_type !== 'personal_care' && analysisResult.product_type !== 'pet_food' && analysisResult.chemical_analysis && (
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
                                      {(emulsifier.safety_rating || 'unknown').replace('_', ' ')}
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

                {/* Enhanced Safety Information - Only for food/beverage (not pet food) */}
                {analysisResult.product_type !== 'household' && analysisResult.product_type !== 'personal_care' && analysisResult.product_type !== 'pet_food' &&
                 (analysisResult.safety.concerning_additives.length > 0 || 
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
                {/* Pricing - Show for ALL product types */}
                {pricing && (
                  <ProductPriceCard 
                    pricing={pricing}
                    productName={analysisResult.product?.name || ''}
                  />
                )}

                {/* Action Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4 pt-6"
                >
                  {/* Only show Add to Food Log for edible products (not pet food, household, personal care) */}
                  {analysisResult.product_type !== 'household' && analysisResult.product_type !== 'personal_care' && analysisResult.product_type !== 'pet_food' && (
                    <Button
                      onClick={handleOpenFoodLogModal}
                      className="flex-1 h-14 text-lg glow-button bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-xl"
                      size="lg"
                    >
                      <Settings className="mr-2 h-5 w-5" />
                      📝 Add to Food Log
                    </Button>
                  )}
                  
                  <Button
                    onClick={resetAnalyzer}
                    variant="outline"
                    className="flex-1 h-14 text-lg border-2 border-stats-duration/50 hover:border-stats-duration hover:bg-stats-duration/10 hover:text-stats-duration transition-all duration-300"
                    size="lg"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    🔍 Scan Another Product
                  </Button>
                  
                  {isCheckingSafety && (
                    <div className="flex items-center justify-center gap-2 text-stats-duration bg-stats-duration/10 rounded-lg p-3 border border-stats-duration/30">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Checking safety data...</span>
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