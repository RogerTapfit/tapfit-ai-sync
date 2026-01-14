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
}

export const BeverageDeepSeekModal = ({ 
  open, 
  onOpenChange, 
  barcode, 
  productName,
  productData
}: BeverageDeepSeekModalProps) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DeepSeekData | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('sweeteners');

  useEffect(() => {
    if (open && (barcode || productName)) {
      fetchDeepAnalysis();
    }
  }, [open, barcode, productName]);

  const fetchDeepAnalysis = async () => {
    setLoading(true);
    try {
      // Call the analyzeProduct edge function with barcode for deep chemical analysis
      const { data: analysisData, error } = await supabase.functions.invoke('analyzeProduct', {
        body: {
          barcode: barcode,
          productName: productName,
          deepSeek: true // Flag to request full chemical breakdown
        }
      });

      if (error) throw error;

      // Transform the response into our expected format
      const transformed = transformAnalysisData(analysisData, productName || 'Beverage');
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
    const chemicalAnalysis = response?.chemical_analysis || {};
    const sugarAnalysis = response?.sugar_analysis || {};
    
    return {
      product_name: response?.product_name || name,
      sweetener_analysis: {
        primary_sweetener: sugarAnalysis.primary_sweetener || 'Unknown',
        sweetener_category: sugarAnalysis.sweetener_category || 'unknown',
        glycemic_index: sugarAnalysis.glycemic_index || 0,
        all_sweeteners: sugarAnalysis.all_sweeteners || [],
        metabolic_impact: sugarAnalysis.metabolic_impact || 'Unknown metabolic impact'
      },
      chemical_dyes: (chemicalAnalysis.food_dyes || []).map((dye: any) => ({
        name: dye.name || dye.chemical_name || 'Unknown Dye',
        e_code: dye.e_code,
        chemical_formula: dye.formula,
        color: dye.color || '#FF0000',
        safety_rating: dye.safety_rating || 'caution',
        health_concerns: dye.health_concerns || [],
        regulatory_status: dye.regulatory_status,
        natural_alternative: dye.natural_alternative
      })),
      vitamins_minerals: (chemicalAnalysis.vitamins || response?.vitamins || []).map((v: any) => ({
        name: v.name,
        amount: v.amount || 'N/A',
        daily_value_percent: v.daily_value_percent,
        bioavailability: v.bioavailability,
        purpose: v.purpose
      })),
      preservatives: (chemicalAnalysis.preservatives || []).map((p: any) => ({
        name: p.name || 'Unknown',
        e_code: p.e_code,
        purpose: p.purpose || 'Preservation',
        safety_rating: p.safety_rating || 'caution',
        health_concerns: p.health_concerns || [],
        alternatives: p.alternatives
      })),
      additives: (chemicalAnalysis.flavor_enhancers || []).map((a: any) => ({
        name: a.name || 'Unknown',
        category: a.category || 'Flavor',
        purpose: a.details || a.purpose || 'Flavor enhancement',
        concern_level: a.concern ? 'medium' : 'low',
        notes: a.concern
      })),
      nova_classification: {
        level: chemicalAnalysis.nova_classification || response?.nova_classification || 4,
        description: getNovaDescription(chemicalAnalysis.nova_classification || 4),
        explanation: getNovaExplanation(chemicalAnalysis.nova_classification || 4)
      },
      ingredients_raw: response?.ingredients_text || response?.ingredients || 'Ingredients not available',
      ai_insights: response?.ai_insights || chemicalAnalysis.ai_insights || [],
      overall_safety_score: chemicalAnalysis.overall_safety_score || 50
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
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="flex items-center justify-between w-full p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-semibold">{title}</span>
          {count !== undefined && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-background/50">{count}</span>
          )}
        </div>
        {expandedSection === id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      <AnimatePresence>
        {expandedSection === id && (
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
