import React, { useState } from 'react';
import { Camera, Zap, Dumbbell, Droplet, Timer, Activity, Apple, Leaf, MessageSquare, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { FoodChatInterface } from './FoodChatInterface';

interface ProductSummary {
  name: string;
  brand?: string;
  position: string;
  nutrition: {
    calories: number;
    protein: number;
    sugar: number;
    sodium?: number;
    artificial_ingredients?: number;
  };
  health_score: number;
  match_score: number;
  pros: string[];
  cons: string[];
  price_visible?: string;
}

interface RecommendedProduct extends ProductSummary {
  why_best: string;
  comparison_to_alternatives: string;
  warnings?: string[];
  better_alternatives_elsewhere?: string[];
}

interface AnalysisResult {
  detected_products: ProductSummary[];
  recommendation: RecommendedProduct;
  total_analyzed: number;
}

const INTENT_CATEGORIES = [
  { id: 'energy', label: 'Energy/Caffeine', icon: Zap, description: 'Need a boost?' },
  { id: 'protein', label: 'Protein Snack', icon: Dumbbell, description: 'Build muscle' },
  { id: 'hydration', label: 'Healthy Beverage', icon: Droplet, description: 'Stay hydrated' },
  { id: 'pre_workout', label: 'Pre-Workout', icon: Timer, description: 'Fuel up' },
  { id: 'post_workout', label: 'Post-Workout', icon: Activity, description: 'Recover well' },
  { id: 'low_sugar', label: 'Low-Sugar Snack', icon: Apple, description: 'Cut the sugar' },
  { id: 'whole_food', label: 'Whole Food Option', icon: Leaf, description: 'Keep it natural' },
];

export const CoachsChoiceAnalyzer = () => {
  const [shelfPhoto, setShelfPhoto] = useState<string | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [customIntent, setCustomIntent] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setShelfPhoto(reader.result as string);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleIntentSelect = (intentId: string) => {
    setSelectedIntent(intentId);
    setShowChat(false);
    setCustomIntent('');
  };

  const handleCustomIntent = () => {
    setShowChat(true);
    setSelectedIntent('custom');
  };

  const analyzeShelf = async () => {
    if (!shelfPhoto || (!selectedIntent && !customIntent)) {
      toast({
        title: 'Missing Information',
        description: 'Please capture a photo and select what you\'re looking for.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const intent = customIntent || INTENT_CATEGORIES.find(c => c.id === selectedIntent)?.description || selectedIntent;
      
      const { data, error } = await supabase.functions.invoke('analyzeShelfChoice', {
        body: {
          imageBase64: shelfPhoto,
          userIntent: intent,
        },
      });

      if (error) throw error;

      setAnalysisResult(data);
      toast({
        title: 'Analysis Complete!',
        description: `Analyzed ${data.total_analyzed} products. Check out our recommendation!`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Could not analyze the shelf.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setShelfPhoto(null);
    setSelectedIntent(null);
    setCustomIntent('');
    setAnalysisResult(null);
    setShowChat(false);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Smart Pick</h2>
        </div>
        <p className="text-muted-foreground">
          Let AI help you pick the healthiest option from any shelf
        </p>
      </div>

      {/* Step 1: Photo Capture */}
      {!shelfPhoto ? (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Take a Photo of the Shelf</h3>
              <p className="text-muted-foreground">
                Capture multiple products clearly in one photo
              </p>
            </div>
            <label htmlFor="shelf-photo" className="cursor-pointer">
              <Button size="lg" asChild>
                <span>
                  <Camera className="h-5 w-5 mr-2" />
                  Capture Shelf Photo
                </span>
              </Button>
              <input
                id="shelf-photo"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
              />
            </label>
          </div>
        </Card>
      ) : (
        <>
          {/* Photo Preview */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={shelfPhoto}
                  alt="Shelf to analyze"
                  className="w-full rounded-lg max-h-64 object-cover"
                />
              </div>
              <Button variant="outline" size="sm" onClick={resetAnalysis} className="w-full">
                Retake Photo
              </Button>
            </div>
          </Card>

          {/* Step 2: Intent Selection */}
          {!analysisResult && (
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">What Are You Looking For?</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {INTENT_CATEGORIES.map((category) => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleIntentSelect(category.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedIntent === category.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <category.icon className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium text-sm">{category.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {category.description}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCustomIntent}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Tell AI What You Need
                </Button>

                {showChat && (
                  <div className="space-y-3">
                    <textarea
                      value={customIntent}
                      onChange={(e) => setCustomIntent(e.target.value)}
                      placeholder="E.g., I need something with high protein but low calories for muscle recovery..."
                      className="w-full min-h-24 p-3 rounded-lg border bg-background"
                    />
                  </div>
                )}

                {selectedIntent && (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={analyzeShelf}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                        Analyzing Shelf...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Analyze & Get Recommendation
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Step 3: Analysis Results */}
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Winner Recommendation */}
              <Card className="p-6 border-2 border-primary bg-primary/5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-primary rounded-lg">
                    <Target className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-bold">
                        {analysisResult.recommendation.name}
                      </h3>
                      <Badge variant="default">Winner</Badge>
                    </div>
                    {analysisResult.recommendation.brand && (
                      <p className="text-muted-foreground">{analysisResult.recommendation.brand}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getHealthScoreColor(analysisResult.recommendation.health_score)}`}>
                      {analysisResult.recommendation.health_score}/10
                    </div>
                    <div className="text-xs text-muted-foreground">Health Score</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Why This is Your Best Choice:</h4>
                    <p className="text-sm">{analysisResult.recommendation.why_best}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-background rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Calories</div>
                      <div className="text-lg font-semibold">{analysisResult.recommendation.nutrition.calories}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Protein</div>
                      <div className="text-lg font-semibold">{analysisResult.recommendation.nutrition.protein}g</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Sugar</div>
                      <div className="text-lg font-semibold">{analysisResult.recommendation.nutrition.sugar}g</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Match Score</div>
                      <div className="text-lg font-semibold">{analysisResult.recommendation.match_score}/10</div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {analysisResult.recommendation.pros.map((pro, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800">
                        ✓ {pro}
                      </Badge>
                    ))}
                  </div>

                  {analysisResult.recommendation.cons.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {analysisResult.recommendation.cons.map((con, idx) => (
                        <Badge key={idx} variant="outline" className="border-yellow-500 text-yellow-700">
                          ! {con}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Why Not The Others */}
              <Card className="p-6">
                <h4 className="font-semibold mb-3">Why Not The Others?</h4>
                <p className="text-sm mb-4">{analysisResult.recommendation.comparison_to_alternatives}</p>

                <div className="space-y-3">
                  {analysisResult.detected_products
                    .filter(p => p.name !== analysisResult.recommendation.name)
                    .sort((a, b) => b.match_score - a.match_score)
                    .map((product, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.brand && (
                              <div className="text-xs text-muted-foreground">{product.brand}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getHealthScoreColor(product.health_score)}`}>
                              {product.health_score}/10
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Match: {product.match_score}/10
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Cal:</span> {product.nutrition.calories}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pro:</span> {product.nutrition.protein}g
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sugar:</span> {product.nutrition.sugar}g
                          </div>
                        </div>
                        {product.cons.length > 0 && (
                          <div className="mt-2 flex gap-1 flex-wrap">
                            {product.cons.slice(0, 2).map((con, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {con}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetAnalysis}
                >
                  Start Over
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    toast({
                      title: 'Tip',
                      description: 'You can manually log this item in the Food Analyzer tab!',
                    });
                  }}
                >
                  Manual Food Log
                </Button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};
