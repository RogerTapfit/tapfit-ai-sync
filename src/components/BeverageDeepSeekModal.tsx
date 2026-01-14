import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Beaker, ChevronDown, ChevronRight, Sparkles, AlertTriangle, 
  Shield, Check, X, Droplet, Leaf, Flame, Pill, FlaskConical, 
  Loader2, Eye, Heart, Brain, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeepSeekData {
  product_name: string;
  sweetener_analysis: {
    primary_sweetener: string;
    sweetener_category: string;
    glycemic_index: number;
    all_sweeteners: Array<{
      name: string;
      category: string;
      gi: number;
      health_concerns?: string[];
    }>;
    metabolic_impact: string;
  };
  chemical_dyes: Array<{
    name: string;
    e_code?: string;
    chemical_formula?: string;
    color: string;
    safety_rating: 'safe' | 'caution' | 'avoid';
    health_concerns: string[];
    regulatory_status?: string;
    natural_alternative?: string;
  }>;
  vitamins_minerals: Array<{
    name: string;
    amount: string;
    daily_value_percent?: number;
    bioavailability?: string;
    purpose?: string;
  }>;
  preservatives: Array<{
    name: string;
    e_code?: string;
    purpose: string;
    safety_rating: 'safe' | 'caution' | 'avoid';
    health_concerns: string[];
    alternatives?: string[];
  }>;
  additives: Array<{
    name: string;
    category: string;
    purpose: string;
    concern_level: 'low' | 'medium' | 'high';
    notes?: string;
  }>;
  nova_classification: {
    level: 1 | 2 | 3 | 4;
    description: string;
    explanation: string;
  };
  ingredients_raw: string;
  ai_insights: string[];
  overall_safety_score: number;
}

interface BeverageDeepSeekModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcode?: string;
  productName?: string;
  productData?: any;
  productImage?: string;
}

export const BeverageDeepSeekModal = ({ 
  open, 
  onOpenChange, 
  barcode, 
  productName,
  productData,
  productImage
}: BeverageDeepSeekModalProps) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DeepSeekData | null>(null);
  // All sections expanded by default
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['sweeteners', 'dyes', 'vitamins', 'preservatives', 'additives', 'ingredients'])
  );

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    if (open && (barcode || productName)) {
      fetchDeepAnalysis();
    }
  }, [open, barcode, productName]);

  // Parse ingredients text to detect sweeteners
  const detectSweeteners = (ingredients: string): Array<{name: string; category: string; gi: number; health_concerns?: string[]}> => {
    const ingredientsLower = ingredients.toLowerCase();
    const detected: Array<{name: string; category: string; gi: number; health_concerns?: string[]}> = [];
    
    const sweetenerPatterns = [
      { pattern: /sucralose/i, name: 'Sucralose', category: 'artificial', gi: 0, concerns: ['May affect gut microbiome'] },
      { pattern: /aspartame/i, name: 'Aspartame', category: 'artificial', gi: 0, concerns: ['Contains phenylalanine'] },
      { pattern: /acesulfame(-|\s)?k|ace-k/i, name: 'Acesulfame-K', category: 'artificial', gi: 0, concerns: [] },
      { pattern: /stevia|reb(-)?a|steviol/i, name: 'Stevia', category: 'natural_zero', gi: 0, concerns: [] },
      { pattern: /erythritol/i, name: 'Erythritol', category: 'sugar_alcohol', gi: 0, concerns: [] },
      { pattern: /xylitol/i, name: 'Xylitol', category: 'sugar_alcohol', gi: 7, concerns: ['May cause digestive issues'] },
      { pattern: /monk\s?fruit|luo\s?han\s?guo/i, name: 'Monk Fruit', category: 'natural_zero', gi: 0, concerns: [] },
      { pattern: /high\s?fructose\s?corn\s?syrup|hfcs/i, name: 'High Fructose Corn Syrup', category: 'processed', gi: 87, concerns: ['Linked to metabolic issues'] },
      { pattern: /cane\s?sugar|sugar(?!.*alcohol)/i, name: 'Cane Sugar', category: 'refined', gi: 65, concerns: ['High glycemic impact'] },
      { pattern: /honey/i, name: 'Honey', category: 'natural', gi: 58, concerns: [] },
      { pattern: /agave/i, name: 'Agave', category: 'natural', gi: 15, concerns: ['High fructose content'] },
    ];
    
    sweetenerPatterns.forEach(s => {
      if (s.pattern.test(ingredientsLower)) {
        detected.push({ name: s.name, category: s.category, gi: s.gi, health_concerns: s.concerns });
      }
    });
    
    return detected;
  };

  // Parse ingredients to detect preservatives
  const detectPreservatives = (ingredients: string): Array<{name: string; e_code?: string; purpose: string; safety_rating: 'safe' | 'caution' | 'avoid'; health_concerns: string[]}> => {
    const ingredientsLower = ingredients.toLowerCase();
    const detected: Array<{name: string; e_code?: string; purpose: string; safety_rating: 'safe' | 'caution' | 'avoid'; health_concerns: string[]}> = [];
    
    const preservativePatterns = [
      { pattern: /potassium\s?sorbate/i, name: 'Potassium Sorbate', e_code: 'E202', purpose: 'Inhibits mold and yeast', safety: 'safe' as const, concerns: [] },
      { pattern: /sodium\s?benzoate/i, name: 'Sodium Benzoate', e_code: 'E211', purpose: 'Inhibits bacteria', safety: 'caution' as const, concerns: ['May form benzene with vitamin C'] },
      { pattern: /citric\s?acid/i, name: 'Citric Acid', e_code: 'E330', purpose: 'Acidity regulator', safety: 'safe' as const, concerns: [] },
      { pattern: /ascorbic\s?acid/i, name: 'Ascorbic Acid', e_code: 'E300', purpose: 'Antioxidant', safety: 'safe' as const, concerns: [] },
      { pattern: /calcium\s?disodium\s?edta/i, name: 'Calcium Disodium EDTA', e_code: 'E385', purpose: 'Chelating agent', safety: 'safe' as const, concerns: [] },
      { pattern: /bha|butylated\s?hydroxyanisole/i, name: 'BHA', e_code: 'E320', purpose: 'Antioxidant', safety: 'caution' as const, concerns: ['Possible carcinogen'] },
      { pattern: /bht|butylated\s?hydroxytoluene/i, name: 'BHT', e_code: 'E321', purpose: 'Antioxidant', safety: 'caution' as const, concerns: ['May affect hormones'] },
    ];
    
    preservativePatterns.forEach(p => {
      if (p.pattern.test(ingredientsLower)) {
        detected.push({ name: p.name, e_code: p.e_code, purpose: p.purpose, safety_rating: p.safety, health_concerns: p.concerns });
      }
    });
    
    return detected;
  };

  // Parse ingredients to detect dyes
  const detectDyes = (ingredients: string): Array<{name: string; e_code?: string; color: string; safety_rating: 'safe' | 'caution' | 'avoid'; health_concerns: string[]}> => {
    const ingredientsLower = ingredients.toLowerCase();
    const detected: Array<{name: string; e_code?: string; color: string; safety_rating: 'safe' | 'caution' | 'avoid'; health_concerns: string[]}> = [];
    
    const dyePatterns = [
      { pattern: /red\s?(no\.?\s?)?40|allura\s?red/i, name: 'Red 40', e_code: 'E129', color: '#FF0000', safety: 'caution' as const, concerns: ['Linked to hyperactivity in children'] },
      { pattern: /yellow\s?(no\.?\s?)?(5|6)|tartrazine|sunset\s?yellow/i, name: 'Yellow 5/6', e_code: 'E102/E110', color: '#FFD700', safety: 'caution' as const, concerns: ['May cause allergic reactions'] },
      { pattern: /blue\s?(no\.?\s?)?1|brilliant\s?blue/i, name: 'Blue 1', e_code: 'E133', color: '#0000FF', safety: 'caution' as const, concerns: ['Limited safety data'] },
      { pattern: /caramel\s?color/i, name: 'Caramel Color', e_code: 'E150', color: '#8B4513', safety: 'caution' as const, concerns: ['4-MEI concerns in some types'] },
    ];
    
    dyePatterns.forEach(d => {
      if (d.pattern.test(ingredientsLower)) {
        detected.push({ name: d.name, e_code: d.e_code, color: d.color, safety_rating: d.safety, health_concerns: d.concerns });
      }
    });
    
    return detected;
  };

  // Parse ingredients to detect additives
  const detectAdditives = (ingredients: string): Array<{name: string; category: string; purpose: string; concern_level: 'low' | 'medium' | 'high'}> => {
    const ingredientsLower = ingredients.toLowerCase();
    const detected: Array<{name: string; category: string; purpose: string; concern_level: 'low' | 'medium' | 'high'}> = [];
    
    const additivePatterns = [
      { pattern: /taurine/i, name: 'Taurine', category: 'amino_acid', purpose: 'Energy & cardiovascular support', concern: 'low' as const },
      { pattern: /l-?carnitine|carnitine/i, name: 'L-Carnitine', category: 'amino_acid', purpose: 'Fat metabolism & energy', concern: 'low' as const },
      { pattern: /caffeine/i, name: 'Caffeine', category: 'stimulant', purpose: 'Mental alertness & energy', concern: 'low' as const },
      { pattern: /ginseng/i, name: 'Ginseng Extract', category: 'herbal', purpose: 'Adaptogen & energy', concern: 'low' as const },
      { pattern: /guarana/i, name: 'Guarana Seed Extract', category: 'herbal', purpose: 'Natural caffeine source', concern: 'low' as const },
      { pattern: /inositol/i, name: 'Inositol', category: 'vitamin-like', purpose: 'Cell signaling & mood', concern: 'low' as const },
      { pattern: /glucuronolactone/i, name: 'Glucuronolactone', category: 'compound', purpose: 'Energy & detoxification', concern: 'low' as const },
      { pattern: /green\s?tea\s?extract/i, name: 'Green Tea Extract', category: 'herbal', purpose: 'Antioxidant & metabolism', concern: 'low' as const },
      { pattern: /ginger\s?extract/i, name: 'Ginger Extract', category: 'herbal', purpose: 'Anti-inflammatory', concern: 'low' as const },
      { pattern: /beta-?alanine/i, name: 'Beta-Alanine', category: 'amino_acid', purpose: 'Endurance support', concern: 'low' as const },
      { pattern: /citrulline/i, name: 'Citrulline', category: 'amino_acid', purpose: 'Blood flow & performance', concern: 'low' as const },
    ];
    
    additivePatterns.forEach(a => {
      if (a.pattern.test(ingredientsLower)) {
        detected.push({ name: a.name, category: a.category, purpose: a.purpose, concern_level: a.concern });
      }
    });
    
    return detected;
  };

  const fetchDeepAnalysis = async () => {
    setLoading(true);
    try {
      console.log('🔬 Deep Seek: Starting comprehensive analysis');
      
      // Extract brand from product data
      const brand = productData?.brand || '';
      
      // Call nutrition-web-lookup for comprehensive data including chemical analysis
      const { data: webData, error: webError } = await supabase.functions.invoke('nutrition-web-lookup', {
        body: {
          productName: productName,
          brand: brand,
          barcode: barcode
        }
      });
      
      if (webError) {
        console.error('Web lookup error:', webError);
        throw webError;
      }
      
      console.log('🔬 Deep Seek: Web lookup response:', webData);
      
      // Transform the response - prioritize web lookup data
      const transformed = transformAnalysisData(webData, productName || 'Beverage');
      setData(transformed);
    } catch (error) {
      console.error('Deep seek analysis failed:', error);
      // Use fallback data based on productData if available
      const fallbackData = generateFallbackData(productName || 'Beverage', productData);
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const transformAnalysisData = (response: any, name: string): DeepSeekData => {
    // Handle nutrition-web-lookup format (from Perplexity) 
    const nutritionData = response?.nutrition || response;
    const chemicalAnalysis = nutritionData?.chemical_analysis || {};
    const ingredientsText = nutritionData?.ingredients || response?.ingredients || '';
    
    // Parse ingredients for chemical breakdown
    const parsedSweeteners = detectSweeteners(ingredientsText);
    const parsedPreservatives = detectPreservatives(ingredientsText);
    const parsedDyes = detectDyes(ingredientsText);
    const parsedAdditives = detectAdditives(ingredientsText);
    
    // Merge API-provided data with parsed data
    const apiSweeteners = chemicalAnalysis?.sweeteners || [];
    const apiPreservatives = chemicalAnalysis?.preservatives || [];
    const apiDyes = chemicalAnalysis?.dyes || [];
    const apiAdditives = chemicalAnalysis?.additives || [];
    
    // Combine vitamins from API
    const vitaminsFromApi = nutritionData?.vitamins || [];
    const mineralsFromApi = nutritionData?.minerals || [];
    const combinedVitamins = [...vitaminsFromApi, ...mineralsFromApi].map((v: any) => ({
      name: v.name,
      amount: `${v.amount}${v.unit}`,
      daily_value_percent: v.dv_percent,
      bioavailability: v.bioavailability,
      purpose: v.purpose
    }));
    
    // Merge sweeteners - prefer API data, supplement with parsed
    const allSweeteners = apiSweeteners.length > 0 
      ? apiSweeteners.map((s: any) => ({
          name: s.name,
          category: s.category || 'unknown',
          gi: s.gi || 0,
          health_concerns: s.health_concerns || []
        }))
      : parsedSweeteners;
    
    const primarySweetener = allSweeteners.length > 0 ? allSweeteners[0] : null;
    
    // Determine sweetener category for display
    const sweetenerCategory = primarySweetener?.category || 'unknown';
    
    // Merge preservatives
    const allPreservatives = apiPreservatives.length > 0 
      ? apiPreservatives.map((p: any) => ({
          name: p.name,
          e_code: p.e_code,
          purpose: p.purpose || 'Preservation',
          safety_rating: p.safety_rating || 'safe',
          health_concerns: p.health_concerns || []
        }))
      : parsedPreservatives;
    
    // Merge dyes
    const allDyes = apiDyes.length > 0 
      ? apiDyes.map((d: any) => ({
          name: d.name,
          e_code: d.e_code,
          color: d.color || '#FF0000',
          safety_rating: d.safety_rating || 'caution',
          health_concerns: d.health_concerns || []
        }))
      : parsedDyes;
    
    // Merge additives
    const allAdditives = apiAdditives.length > 0 
      ? apiAdditives.map((a: any) => ({
          name: a.name,
          category: a.category || 'additive',
          purpose: a.purpose || 'Enhancement',
          concern_level: a.concern_level || 'low'
        }))
      : parsedAdditives;
    
    // Get NOVA classification
    const novaLevel = chemicalAnalysis?.nova_level || 4;
    
    // Calculate safety score
    let safetyScore = 70;
    if (allDyes.length > 0) safetyScore -= 10;
    if (allSweeteners.some(s => s.category === 'artificial')) safetyScore -= 5;
    if (allPreservatives.some(p => p.safety_rating === 'caution')) safetyScore -= 5;
    if (combinedVitamins.length > 5) safetyScore += 10;
    safetyScore = Math.max(20, Math.min(95, safetyScore));
    
    // Generate AI insights
    const insights: string[] = [];
    if (combinedVitamins.length > 0) {
      insights.push(`Contains ${combinedVitamins.length} vitamins/minerals for nutritional support`);
    }
    if (allSweeteners.some(s => s.category === 'artificial')) {
      insights.push('Contains artificial sweeteners - zero calories but may affect taste preferences');
    }
    if (allAdditives.some(a => a.name.toLowerCase().includes('caffeine'))) {
      insights.push('Contains caffeine - provides energy but limit intake to 400mg/day');
    }
    if (allDyes.length === 0) {
      insights.push('No artificial dyes detected - cleaner ingredient profile');
    }
    if (allAdditives.some(a => a.name.toLowerCase().includes('taurine'))) {
      insights.push('Contains taurine - supports cardiovascular and nervous system function');
    }
    
    return {
      product_name: name,
      sweetener_analysis: {
        primary_sweetener: primarySweetener?.name || 'None detected',
        sweetener_category: sweetenerCategory,
        glycemic_index: primarySweetener?.gi || 0,
        all_sweeteners: allSweeteners,
        metabolic_impact: allSweeteners.length === 0 
          ? 'No sweeteners detected' 
          : allSweeteners.some(s => s.category === 'artificial')
            ? 'Zero caloric impact from artificial sweeteners'
            : 'Natural/refined sugar provides quick energy with glycemic response'
      },
      chemical_dyes: allDyes,
      vitamins_minerals: combinedVitamins,
      preservatives: allPreservatives,
      additives: allAdditives,
      nova_classification: {
        level: novaLevel as 1 | 2 | 3 | 4,
        description: getNovaDescription(novaLevel),
        explanation: getNovaExplanation(novaLevel)
      },
      ingredients_raw: ingredientsText || 'Ingredients not available - scan product label for details',
      ai_insights: insights.length > 0 ? insights : ['Scan the nutrition label for complete analysis'],
      overall_safety_score: safetyScore
    };
  };

  const generateFallbackData = (name: string, productData?: any): DeepSeekData => {
    return {
      product_name: name,
      sweetener_analysis: {
        primary_sweetener: 'Analysis pending',
        sweetener_category: 'unknown',
        glycemic_index: 0,
        all_sweeteners: [],
        metabolic_impact: 'Unable to determine - scan product label for detailed analysis'
      },
      chemical_dyes: [],
      vitamins_minerals: [],
      preservatives: [],
      additives: [],
      nova_classification: {
        level: 4,
        description: 'Ultra-processed',
        explanation: 'Most commercial beverages are ultra-processed'
      },
      ingredients_raw: 'Scan the product label for ingredient information',
      ai_insights: ['Scan the nutrition label for complete chemical analysis'],
      overall_safety_score: 50
    };
  };

  const getNovaDescription = (level: number): string => {
    const descriptions: Record<number, string> = {
      1: 'Unprocessed',
      2: 'Processed Ingredients',
      3: 'Processed Food',
      4: 'Ultra-processed'
    };
    return descriptions[level] || 'Unknown';
  };

  const getNovaExplanation = (level: number): string => {
    const explanations: Record<number, string> = {
      1: 'Natural, unprocessed or minimally processed',
      2: 'Culinary ingredients obtained from Group 1 foods',
      3: 'Foods made by adding salt, oil, sugar, or other Group 2 substances',
      4: 'Industrial formulations with little to no whole food'
    };
    return explanations[level] || 'Processing level unknown';
  };

  const getSafetyBadge = (rating: string) => {
    switch (rating) {
      case 'safe':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Safe</span>;
      case 'caution':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">Caution</span>;
      case 'avoid':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Avoid</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">Unknown</span>;
    }
  };

  const getConcernBadge = (level: string) => {
    switch (level) {
      case 'low':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Low Concern</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">Medium</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">High Concern</span>;
      default:
        return null;
    }
  };

  const getNovaColor = (level: number) => {
    switch (level) {
      case 1: return 'text-green-400 bg-green-500/20';
      case 2: return 'text-lime-400 bg-lime-500/20';
      case 3: return 'text-yellow-400 bg-yellow-500/20';
      case 4: return 'text-red-400 bg-red-500/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getSweetenerCategoryInfo = (category: string) => {
    const info: Record<string, { color: string; icon: any; label: string }> = {
      natural: { color: 'text-green-400', icon: Leaf, label: 'Natural' },
      natural_zero: { color: 'text-emerald-400', icon: Leaf, label: 'Natural Zero-Cal' },
      refined: { color: 'text-yellow-400', icon: Flame, label: 'Refined' },
      processed: { color: 'text-orange-400', icon: FlaskConical, label: 'Processed' },
      artificial: { color: 'text-red-400', icon: Beaker, label: 'Artificial' },
      sugar_alcohol: { color: 'text-purple-400', icon: Pill, label: 'Sugar Alcohol' },
      unknown: { color: 'text-muted-foreground', icon: AlertTriangle, label: 'Unknown' }
    };
    return info[category] || info.unknown;
  };

  const CollapsibleSection = ({ 
    id, 
    title, 
    icon: Icon, 
    count, 
    color, 
    children 
  }: { 
    id: string; 
    title: string; 
    icon: any; 
    count?: number; 
    color: string;
    children: React.ReactNode;
  }) => (
    <div className={`border rounded-lg overflow-hidden ${color}`}>
      <button
        onClick={() => toggleSection(id)}
        className="flex items-center justify-between w-full p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-semibold">{title}</span>
          {count !== undefined && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-background/50">{count}</span>
          )}
        </div>
        {expandedSections.has(id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      <AnimatePresence>
        {expandedSections.has(id) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh] overflow-hidden">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-purple-500" />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Deep Seek Analysis
            </span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(95vh - 80px)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
              <p className="text-muted-foreground">Analyzing chemical composition...</p>
            </div>
          ) : data ? (
            <>
              {/* Product Header */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
                <h3 className="text-lg font-bold text-foreground">{data.product_name}</h3>
                {barcode && (
                  <p className="text-xs text-muted-foreground font-mono mt-1">UPC: {barcode}</p>
                )}
                
                {/* Safety Score */}
                <div className="mt-3 flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                    data.overall_safety_score >= 70 ? 'bg-green-500/20 text-green-400' :
                    data.overall_safety_score >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {data.overall_safety_score}/100
                  </div>
                  <span className="text-sm text-muted-foreground">Safety Score</span>
                </div>
              </div>

              {/* NOVA Classification */}
              <div className={`p-4 rounded-lg border ${getNovaColor(data.nova_classification.level)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">NOVA {data.nova_classification.level}</span>
                    <span className="text-sm">{data.nova_classification.description}</span>
                  </div>
                </div>
                <p className="text-sm mt-2 opacity-80">{data.nova_classification.explanation}</p>
              </div>

              {/* Sweetener Analysis */}
              <CollapsibleSection
                id="sweeteners"
                title="Sweetener Analysis"
                icon={Droplet}
                count={data.sweetener_analysis.all_sweeteners.length}
                color="border-amber-500/30 bg-amber-500/5"
              >
                <div className="space-y-3">
                  {/* Primary Sweetener */}
                  <div className="p-3 rounded-lg bg-background/50 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{data.sweetener_analysis.primary_sweetener}</span>
                      {(() => {
                        const info = getSweetenerCategoryInfo(data.sweetener_analysis.sweetener_category);
                        return (
                          <span className={`flex items-center gap-1 text-xs ${info.color}`}>
                            <info.icon className="h-3 w-3" />
                            {info.label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>GI: {data.sweetener_analysis.glycemic_index}</span>
                    </div>
                  </div>

                  {/* Metabolic Impact */}
                  <div className="p-3 rounded-lg bg-background/30 border border-border">
                    <p className="text-sm">{data.sweetener_analysis.metabolic_impact}</p>
                  </div>

                  {/* All Sweeteners */}
                  {data.sweetener_analysis.all_sweeteners.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">All Sweeteners Detected:</p>
                      {data.sweetener_analysis.all_sweeteners.map((sw, idx) => (
                        <div key={idx} className="p-2 rounded bg-background/30 text-sm flex justify-between">
                          <span>{sw.name}</span>
                          <span className="text-muted-foreground">GI: {sw.gi}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              {/* Chemical Dyes */}
              <CollapsibleSection
                id="dyes"
                title="Chemical Dyes"
                icon={Eye}
                count={data.chemical_dyes.length}
                color="border-red-500/30 bg-red-500/5"
              >
                {data.chemical_dyes.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">No artificial dyes detected</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.chemical_dyes.map((dye, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-white/30" 
                              style={{ backgroundColor: dye.color }}
                            />
                            <span className="font-medium">{dye.name}</span>
                            {dye.e_code && (
                              <span className="text-xs text-muted-foreground font-mono">{dye.e_code}</span>
                            )}
                          </div>
                          {getSafetyBadge(dye.safety_rating)}
                        </div>
                        {dye.chemical_formula && (
                          <p className="text-xs font-mono text-muted-foreground">{dye.chemical_formula}</p>
                        )}
                        {dye.health_concerns.length > 0 && (
                          <ul className="text-xs text-red-400 space-y-1">
                            {dye.health_concerns.map((concern, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {concern}
                              </li>
                            ))}
                          </ul>
                        )}
                        {dye.natural_alternative && (
                          <p className="text-xs text-green-400">
                            <Leaf className="h-3 w-3 inline mr-1" />
                            Natural alternative: {dye.natural_alternative}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>

              {/* Vitamins & Minerals */}
              <CollapsibleSection
                id="vitamins"
                title="Vitamins & Minerals"
                icon={Zap}
                count={data.vitamins_minerals.length}
                color="border-green-500/30 bg-green-500/5"
              >
                {data.vitamins_minerals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No added vitamins or minerals</p>
                ) : (
                  <div className="space-y-2">
                    {data.vitamins_minerals.map((v, idx) => (
                      <div key={idx} className="p-2 rounded bg-background/50 flex items-center justify-between">
                        <div>
                          <span className="font-medium">{v.name}</span>
                          <span className="text-muted-foreground ml-2">{v.amount}</span>
                        </div>
                        {v.daily_value_percent && (
                          <span className="text-sm text-green-400">{v.daily_value_percent}% DV</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>

              {/* Preservatives */}
              <CollapsibleSection
                id="preservatives"
                title="Preservatives"
                icon={Shield}
                count={data.preservatives.length}
                color="border-orange-500/30 bg-orange-500/5"
              >
                {data.preservatives.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">No preservatives detected</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.preservatives.map((p, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{p.name}</span>
                          {getSafetyBadge(p.safety_rating)}
                        </div>
                        <p className="text-xs text-muted-foreground">{p.purpose}</p>
                        {p.health_concerns.length > 0 && (
                          <ul className="text-xs text-yellow-400 space-y-1">
                            {p.health_concerns.map((concern, i) => (
                              <li key={i}>• {concern}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>

              {/* Additives & Flavor Enhancers */}
              <CollapsibleSection
                id="additives"
                title="Additives & Enhancers"
                icon={FlaskConical}
                count={data.additives.length}
                color="border-purple-500/30 bg-purple-500/5"
              >
                {data.additives.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No additional additives detected</p>
                ) : (
                  <div className="space-y-2">
                    {data.additives.map((a, idx) => (
                      <div key={idx} className="p-2 rounded bg-background/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{a.name}</span>
                          {getConcernBadge(a.concern_level)}
                        </div>
                        <p className="text-xs text-muted-foreground">{a.purpose}</p>
                        {a.notes && (
                          <p className="text-xs text-yellow-400">{a.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>

              {/* Raw Ingredients */}
              <CollapsibleSection
                id="ingredients"
                title="Full Ingredients List"
                icon={Leaf}
                color="border-emerald-500/30 bg-emerald-500/5"
              >
                <div className="p-3 rounded bg-background/50 border border-border">
                  <p className="text-sm text-foreground/80 leading-relaxed">{data.ingredients_raw}</p>
                </div>
              </CollapsibleSection>

              {/* AI Insights */}
              {data.ai_insights.length > 0 && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-400" />
                    <h4 className="font-semibold text-blue-400">AI Insights</h4>
                  </div>
                  <ul className="space-y-2">
                    {data.ai_insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Close Button */}
              <Button onClick={() => onOpenChange(false)} className="w-full">
                Close Analysis
              </Button>
            </>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Unable to load analysis</p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
