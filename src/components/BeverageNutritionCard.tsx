import { useState, useEffect } from 'react';
import { BeverageType } from '@/lib/beverageHydration';
import { 
  calculateBeverageHealthGrade, 
  getGradeColor, 
  getGradeBgColor,
  getScoreColor,
  BeverageGradeResult 
} from '@/utils/beverageHealthGrading';
import { Check, X, Droplet, Flame, Wheat, Drumstick, CircleDot, Wine, Beaker, Sparkles, Coffee, Zap, ChevronDown, ChevronUp, Camera, AlertTriangle, Leaf, FileText } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { BeverageDeepSeekModal } from './BeverageDeepSeekModal';
import DrinkInsights from './DrinkInsights';

interface ServingData {
  servingSizeLabel: string;
  servingOz: number;
  maxServings: number;
  perServingNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    alcoholContent?: number;
    // Additional label fields
    fiber_g?: number;
    cholesterol_mg?: number;
    saturated_fat_g?: number;
    trans_fat_g?: number;
    // Micronutrients
    sodium_mg?: number;
    caffeine_mg?: number;
    calcium_mg?: number;
    potassium_mg?: number;
    iron_mg?: number;
    // Vitamins
    vitamin_a_mcg?: number;
    vitamin_c_mg?: number;
    vitamin_d_mcg?: number;
    vitamin_b6_mg?: number;
    vitamin_b12_mcg?: number;
    niacin_mg?: number;
    riboflavin_mg?: number;
    thiamin_mg?: number;
    biotin_mcg?: number;
    pantothenic_acid_mg?: number;
    // Minerals
    magnesium_mg?: number;
    zinc_mg?: number;
    chromium_mcg?: number;
  };
}

interface BeverageNutritionCardProps {
  beverageInfo: BeverageType;
  productName?: string;
  servingOz?: number;
  servingData?: ServingData;
  barcode?: string;
  productData?: any;
  productImage?: string;
  onScanNutritionLabel?: () => void;
  needsLabelScan?: boolean;
}

export const BeverageNutritionCard = ({ beverageInfo, productName, servingOz, servingData, barcode, productData, productImage, onScanNutritionLabel, needsLabelScan }: BeverageNutritionCardProps) => {
  const [gradeResult, setGradeResult] = useState<BeverageGradeResult | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [selectedServings, setSelectedServings] = useState(1);
  const [showDeepSeek, setShowDeepSeek] = useState(false);
  const [showVitamins, setShowVitamins] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

  const maxServings = servingData?.maxServings || 1;
  const hasMultipleServings = maxServings > 1;

  useEffect(() => {
    const result = calculateBeverageHealthGrade(beverageInfo, productName);
    setGradeResult(result);
    
    // Trigger animation after a short delay
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, [beverageInfo, productName]);

  if (!gradeResult) return null;

  const scoreColor = getScoreColor(gradeResult.score);
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (gradeResult.score / 100) * circumference;

  // Calculate nutrition based on selected servings
  const baseNutrition = servingData?.perServingNutrition || {
    calories: beverageInfo.calories,
    protein: beverageInfo.protein,
    carbs: beverageInfo.carbs,
    fat: beverageInfo.fat,
    sugar: beverageInfo.sugar || 0,
    alcoholContent: beverageInfo.alcoholContent
  };
  
  const displayNutrition = {
    calories: Math.round(baseNutrition.calories * selectedServings),
    protein: Math.round(baseNutrition.protein * selectedServings * 10) / 10,
    carbs: Math.round(baseNutrition.carbs * selectedServings),
    fat: Math.round(baseNutrition.fat * selectedServings * 10) / 10,
    sugar: Math.round(baseNutrition.sugar * selectedServings),
    alcoholContent: baseNutrition.alcoholContent || 0,
    // Additional label fields
    fiber_g: baseNutrition.fiber_g ? Math.round(baseNutrition.fiber_g * selectedServings * 10) / 10 : undefined,
    cholesterol_mg: baseNutrition.cholesterol_mg ? Math.round(baseNutrition.cholesterol_mg * selectedServings) : undefined,
    saturated_fat_g: baseNutrition.saturated_fat_g ? Math.round(baseNutrition.saturated_fat_g * selectedServings * 10) / 10 : undefined,
    trans_fat_g: baseNutrition.trans_fat_g ? Math.round(baseNutrition.trans_fat_g * selectedServings * 10) / 10 : undefined,
    // Micronutrients scaled by servings
    sodium_mg: baseNutrition.sodium_mg ? Math.round(baseNutrition.sodium_mg * selectedServings) : undefined,
    caffeine_mg: baseNutrition.caffeine_mg ? Math.round(baseNutrition.caffeine_mg * selectedServings) : undefined,
    calcium_mg: baseNutrition.calcium_mg ? Math.round(baseNutrition.calcium_mg * selectedServings) : undefined,
    potassium_mg: baseNutrition.potassium_mg ? Math.round(baseNutrition.potassium_mg * selectedServings) : undefined,
    iron_mg: baseNutrition.iron_mg ? Math.round(baseNutrition.iron_mg * selectedServings * 10) / 10 : undefined,
    // Vitamins
    vitamin_a_mcg: baseNutrition.vitamin_a_mcg ? Math.round(baseNutrition.vitamin_a_mcg * selectedServings) : undefined,
    vitamin_c_mg: baseNutrition.vitamin_c_mg ? Math.round(baseNutrition.vitamin_c_mg * selectedServings) : undefined,
    vitamin_d_mcg: baseNutrition.vitamin_d_mcg ? Math.round(baseNutrition.vitamin_d_mcg * selectedServings * 10) / 10 : undefined,
    vitamin_b6_mg: baseNutrition.vitamin_b6_mg ? Math.round(baseNutrition.vitamin_b6_mg * selectedServings * 10) / 10 : undefined,
    vitamin_b12_mcg: baseNutrition.vitamin_b12_mcg ? Math.round(baseNutrition.vitamin_b12_mcg * selectedServings * 10) / 10 : undefined,
    niacin_mg: baseNutrition.niacin_mg ? Math.round(baseNutrition.niacin_mg * selectedServings) : undefined,
    riboflavin_mg: baseNutrition.riboflavin_mg ? Math.round(baseNutrition.riboflavin_mg * selectedServings * 10) / 10 : undefined,
    thiamin_mg: baseNutrition.thiamin_mg ? Math.round(baseNutrition.thiamin_mg * selectedServings * 10) / 10 : undefined,
    biotin_mcg: baseNutrition.biotin_mcg ? Math.round(baseNutrition.biotin_mcg * selectedServings) : undefined,
    pantothenic_acid_mg: baseNutrition.pantothenic_acid_mg ? Math.round(baseNutrition.pantothenic_acid_mg * selectedServings) : undefined,
    // Minerals
    magnesium_mg: baseNutrition.magnesium_mg ? Math.round(baseNutrition.magnesium_mg * selectedServings) : undefined,
    zinc_mg: baseNutrition.zinc_mg ? Math.round(baseNutrition.zinc_mg * selectedServings * 10) / 10 : undefined,
    chromium_mcg: baseNutrition.chromium_mcg ? Math.round(baseNutrition.chromium_mcg * selectedServings) : undefined,
  };
  
  const displayServingOz = Math.round((servingData?.servingOz || servingOz || beverageInfo.servingOz) * selectedServings * 10) / 10;

  // Daily Value percentages for vitamins and minerals
  const getDailyValuePercent = (value: number | undefined, dv: number): number | null => {
    if (value === undefined || value === 0) return null;
    return Math.round((value / dv) * 100);
  };

  // Build vitamins and minerals array for display
  const vitaminsAndMinerals = [
    { name: 'Calcium', value: displayNutrition.calcium_mg, unit: 'mg', dv: 1300, dvPercent: getDailyValuePercent(displayNutrition.calcium_mg, 1300) },
    { name: 'Vitamin C', value: displayNutrition.vitamin_c_mg, unit: 'mg', dv: 90, dvPercent: getDailyValuePercent(displayNutrition.vitamin_c_mg, 90) },
    { name: 'Vitamin A', value: displayNutrition.vitamin_a_mcg, unit: 'mcg', dv: 900, dvPercent: getDailyValuePercent(displayNutrition.vitamin_a_mcg, 900) },
    { name: 'Vitamin D', value: displayNutrition.vitamin_d_mcg, unit: 'mcg', dv: 20, dvPercent: getDailyValuePercent(displayNutrition.vitamin_d_mcg, 20) },
    { name: 'Thiamin (B1)', value: displayNutrition.thiamin_mg, unit: 'mg', dv: 1.2, dvPercent: getDailyValuePercent(displayNutrition.thiamin_mg, 1.2) },
    { name: 'Riboflavin (B2)', value: displayNutrition.riboflavin_mg, unit: 'mg', dv: 1.3, dvPercent: getDailyValuePercent(displayNutrition.riboflavin_mg, 1.3) },
    { name: 'Niacin (B3)', value: displayNutrition.niacin_mg, unit: 'mg', dv: 16, dvPercent: getDailyValuePercent(displayNutrition.niacin_mg, 16) },
    { name: 'Vitamin B6', value: displayNutrition.vitamin_b6_mg, unit: 'mg', dv: 1.7, dvPercent: getDailyValuePercent(displayNutrition.vitamin_b6_mg, 1.7) },
    { name: 'Vitamin B12', value: displayNutrition.vitamin_b12_mcg, unit: 'mcg', dv: 2.4, dvPercent: getDailyValuePercent(displayNutrition.vitamin_b12_mcg, 2.4) },
    { name: 'Biotin', value: displayNutrition.biotin_mcg, unit: 'mcg', dv: 30, dvPercent: getDailyValuePercent(displayNutrition.biotin_mcg, 30) },
    { name: 'Pantothenic Acid', value: displayNutrition.pantothenic_acid_mg, unit: 'mg', dv: 5, dvPercent: getDailyValuePercent(displayNutrition.pantothenic_acid_mg, 5) },
    { name: 'Potassium', value: displayNutrition.potassium_mg, unit: 'mg', dv: 4700, dvPercent: getDailyValuePercent(displayNutrition.potassium_mg, 4700) },
    { name: 'Iron', value: displayNutrition.iron_mg, unit: 'mg', dv: 18, dvPercent: getDailyValuePercent(displayNutrition.iron_mg, 18) },
    { name: 'Magnesium', value: displayNutrition.magnesium_mg, unit: 'mg', dv: 420, dvPercent: getDailyValuePercent(displayNutrition.magnesium_mg, 420) },
    { name: 'Zinc', value: displayNutrition.zinc_mg, unit: 'mg', dv: 11, dvPercent: getDailyValuePercent(displayNutrition.zinc_mg, 11) },
    { name: 'Chromium', value: displayNutrition.chromium_mcg, unit: 'mcg', dv: 35, dvPercent: getDailyValuePercent(displayNutrition.chromium_mcg, 35) },
  ].filter(item => item.value !== undefined && item.value > 0);

  const hasVitaminsOrMinerals = vitaminsAndMinerals.length > 0;
  const hasCaffeine = displayNutrition.caffeine_mg !== undefined && displayNutrition.caffeine_mg > 0;
  const hasSodium = displayNutrition.sodium_mg !== undefined && displayNutrition.sodium_mg > 0;
  const hasFiber = displayNutrition.fiber_g !== undefined && displayNutrition.fiber_g > 0;
  const hasCholesterol = displayNutrition.cholesterol_mg !== undefined && displayNutrition.cholesterol_mg > 0;
  const hasSaturatedFat = displayNutrition.saturated_fat_g !== undefined && displayNutrition.saturated_fat_g > 0;
  const hasTransFat = displayNutrition.trans_fat_g !== undefined && displayNutrition.trans_fat_g > 0;
  const hasIngredients = productData?.ingredients && productData.ingredients.length > 0;
  const dataSource = productData?.data_source || 'Unknown';

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {/* Header with Grade Circle */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 w-full overflow-hidden">
        {/* Animated Score Circle */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-muted/30"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={scoreColor}
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={isAnimated ? strokeDashoffset : circumference}
              className="transition-all duration-[1500ms] ease-out"
            />
          </svg>
          {/* Score and Grade in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">
              <AnimatedNumber finalValue={gradeResult.score} duration={1500} decimals={0} />
            </span>
            <span className={`text-lg font-bold ${getGradeColor(gradeResult.grade)}`}>
              {gradeResult.grade}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${beverageInfo.color} bg-opacity-20`}>
              <beverageInfo.icon className={`h-5 w-5 ${beverageInfo.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-foreground leading-tight">
                {productName || beverageInfo.name}
              </h3>
              <p className="text-sm text-muted-foreground capitalize">
                {beverageInfo.category} • {servingData?.servingSizeLabel || `${servingOz || beverageInfo.servingOz}oz`}
              </p>
            </div>
          </div>
          
          {/* Hydration Impact Badge */}
          <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            gradeResult.hydrationImpact === 'positive' ? 'bg-cyan-500/20 text-cyan-400' :
            gradeResult.hydrationImpact === 'negative' ? 'bg-red-500/20 text-red-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            <Droplet className="h-3 w-3" />
            {Math.round(beverageInfo.hydrationFactor * 100)}% hydration
          </div>
        </div>
      </div>

      {/* Serving Slider */}
      {hasMultipleServings && (
        <div className="p-4 rounded-lg bg-muted/30 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Servings</span>
            <span className="text-lg font-bold text-foreground">
              {selectedServings} of {maxServings}
            </span>
          </div>
          <Slider
            value={[selectedServings]}
            onValueChange={(value) => setSelectedServings(value[0])}
            min={1}
            max={maxServings}
            step={1}
            className="enhanced-slider"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 serving ({servingData?.servingSizeLabel})</span>
            <span>Whole container ({displayServingOz}oz)</span>
          </div>
        </div>
      )}

      {/* Nutrition Facts */}
      <div className="rounded-lg border border-border bg-card p-3 w-full overflow-hidden">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Nutrition Facts
          </h4>
          {hasMultipleServings && (
            <span className="text-xs text-muted-foreground">
              {selectedServings === 1 ? 'Per serving' : `${selectedServings} servings`}
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          {/* Alcohol Content - Prominent for alcoholic beverages */}
          {displayNutrition.alcoholContent > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-border bg-purple-500/10 -mx-4 px-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Wine className="h-4 w-4 text-purple-500" />
                <span className="font-semibold text-foreground">Alcohol (ABV)</span>
              </div>
              <span className="text-xl font-bold text-purple-400">{displayNutrition.alcoholContent}%</span>
            </div>
          )}

          {/* Calories - Prominent */}
          <div className="flex justify-between items-center py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-foreground">Calories</span>
            </div>
            <span className="text-xl font-bold text-foreground">{displayNutrition.calories}</span>
          </div>

          {/* Macros */}
          <div className="flex justify-between items-center py-1.5">
            <div className="flex items-center gap-2">
              <Drumstick className="h-4 w-4 text-red-400" />
              <span className="text-foreground">Protein</span>
            </div>
            <span className="font-medium text-foreground">{displayNutrition.protein}g</span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <div className="flex items-center gap-2">
              <Wheat className="h-4 w-4 text-amber-500" />
              <span className="text-foreground">Carbohydrates</span>
            </div>
            <span className="font-medium text-foreground">{displayNutrition.carbs}g</span>
          </div>

          {/* Sugar - indented under carbs */}
          <div className="flex justify-between items-center py-1.5 pl-6">
            <span className="text-muted-foreground">└ Sugar</span>
            <span className={`font-medium ${displayNutrition.sugar > 20 ? 'text-red-400' : displayNutrition.sugar > 10 ? 'text-yellow-400' : 'text-foreground'}`}>
              {displayNutrition.sugar}g {displayNutrition.sugar > 20 && '⚠️'}
            </span>
          </div>

          {/* Fiber - indented under carbs */}
          {hasFiber && (
            <div className="flex justify-between items-center py-1.5 pl-6">
              <span className="text-muted-foreground flex items-center gap-1">
                └ <Leaf className="h-3 w-3 text-green-500" /> Fiber
              </span>
              <span className="font-medium text-foreground">{displayNutrition.fiber_g}g</span>
            </div>
          )}

          <div className="flex justify-between items-center py-1.5">
            <div className="flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-yellow-500" />
              <span className="text-foreground">Fat</span>
            </div>
            <span className="font-medium text-foreground">{displayNutrition.fat}g</span>
          </div>

          {/* Saturated Fat - indented under fat */}
          {hasSaturatedFat && (
            <div className="flex justify-between items-center py-1.5 pl-6">
              <span className="text-muted-foreground">└ Saturated Fat</span>
              <span className="font-medium text-foreground">{displayNutrition.saturated_fat_g}g</span>
            </div>
          )}

          {/* Trans Fat - indented under fat */}
          {hasTransFat && (
            <div className="flex justify-between items-center py-1.5 pl-6">
              <span className="text-muted-foreground">└ Trans Fat</span>
              <span className={`font-medium ${displayNutrition.trans_fat_g! > 0 ? 'text-red-400' : 'text-foreground'}`}>
                {displayNutrition.trans_fat_g}g {displayNutrition.trans_fat_g! > 0 && '⚠️'}
              </span>
            </div>
          )}

          {/* Cholesterol - if present */}
          {hasCholesterol && (
            <div className="flex justify-between items-center py-1.5 border-t border-border">
              <span className="text-foreground">Cholesterol</span>
              <span className="font-medium text-foreground">{displayNutrition.cholesterol_mg}mg</span>
            </div>
          )}

          {/* Caffeine - if present */}
          {hasCaffeine && (
            <div className="flex justify-between items-center py-2 border-t border-border bg-amber-500/10 -mx-3 px-3">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-foreground">Caffeine</span>
              </div>
              <span className="text-lg font-bold text-amber-500">{displayNutrition.caffeine_mg}mg</span>
            </div>
          )}

          {/* Sodium - if present */}
          {hasSodium && (
            <div className="flex justify-between items-center py-1.5 border-t border-border">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-foreground">Sodium</span>
              </div>
              <span className="font-medium text-foreground">{displayNutrition.sodium_mg}mg</span>
            </div>
          )}

          {/* Vitamins & Minerals - collapsible */}
          {hasVitaminsOrMinerals && (
            <div className="border-t border-border pt-2 mt-2">
              <button
                onClick={() => setShowVitamins(!showVitamins)}
                className="w-full flex justify-between items-center py-1.5 text-left hover:bg-muted/50 rounded -mx-1 px-1 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">Vitamins & Minerals</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-xs">{vitaminsAndMinerals.length} nutrients</span>
                  {showVitamins ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>
              
              {showVitamins && (
                <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-primary/30">
                  {vitaminsAndMinerals.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm py-0.5">
                      <span className="text-muted-foreground">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{item.value}{item.unit}</span>
                        {item.dvPercent !== null && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            item.dvPercent >= 100 ? 'bg-green-500/20 text-green-400' :
                            item.dvPercent >= 50 ? 'bg-cyan-500/20 text-cyan-400' :
                            item.dvPercent >= 20 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {item.dvPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ingredients - collapsible */}
          {hasIngredients && (
            <div className="border-t border-border pt-2 mt-2">
              <button
                onClick={() => setShowIngredients(!showIngredients)}
                className="w-full flex justify-between items-center py-1.5 text-left hover:bg-muted/50 rounded -mx-1 px-1 transition-colors"
              >
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Ingredients
                </span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  {showIngredients ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>
              
              {showIngredients && (
                <div className="mt-2 p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {productData.ingredients}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Data Source Badge */}
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Data Source</span>
              <span className={`px-2 py-0.5 rounded-full ${
                dataSource.includes('AI Web Search') ? 'bg-green-500/20 text-green-400' :
                dataSource.includes('OpenFoodFacts') ? 'bg-blue-500/20 text-blue-400' :
                dataSource.includes('Label Scan') ? 'bg-purple-500/20 text-purple-400' :
                'bg-muted text-muted-foreground'
              }`}>
                {dataSource.includes('AI Web Search') ? '✓ AI Verified' :
                 dataSource.includes('OpenFoodFacts') ? '✓ Database' :
                 dataSource.includes('Label Scan') ? '✓ Label Scan' :
                 dataSource}
              </span>
            </div>
          </div>

          {/* Scan Nutrition Label prompt when data is incomplete */}
          {needsLabelScan && onScanNutritionLabel && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="text-amber-400">Missing vitamin/caffeine data?</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Scan the nutrition label for complete, accurate values
              </p>
              <Button 
                size="sm" 
                variant="outline"
                className="mt-2 w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                onClick={onScanNutritionLabel}
              >
                <Camera className="h-4 w-4 mr-2" />
                Scan Nutrition Label
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Drink Insights - Vitamins, Standouts, Pitfalls */}
      <DrinkInsights
        vitaminBenefits={gradeResult.vitaminBenefits}
        standouts={gradeResult.standouts}
        pitfalls={gradeResult.pitfalls}
        insightSummary={gradeResult.insightSummary}
      />

      {/* Hydration Info */}
      <div className={`p-3 rounded-lg ${
        gradeResult.hydrationImpact === 'positive' ? 'bg-cyan-500/10 border border-cyan-500/20' :
        gradeResult.hydrationImpact === 'negative' ? 'bg-red-500/10 border border-red-500/20' :
        'bg-yellow-500/10 border border-yellow-500/20'
      }`}>
        <div className="flex items-center gap-2">
          <Droplet className={`h-4 w-4 ${
            gradeResult.hydrationImpact === 'positive' ? 'text-cyan-400' :
            gradeResult.hydrationImpact === 'negative' ? 'text-red-400' :
            'text-yellow-400'
          }`} />
          <span className="font-medium text-foreground">{gradeResult.hydrationDescription}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {gradeResult.hydrationImpact === 'positive' 
            ? 'This beverage contributes well to your daily hydration goals.'
            : gradeResult.hydrationImpact === 'negative'
            ? 'This beverage may increase dehydration. Consider drinking water alongside.'
            : 'This beverage provides some hydration but isn\'t as effective as water.'
          }
        </p>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* Pros */}
        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 overflow-hidden">
          <h5 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1">
            <Check className="h-4 w-4" /> Pros
          </h5>
          <ul className="space-y-1">
            {gradeResult.pros.slice(0, 4).map((pro, idx) => (
              <li key={idx} className="text-xs text-foreground/80 flex items-start gap-1">
                <span className="text-green-400 mt-0.5">•</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 overflow-hidden">
          <h5 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1">
            <X className="h-4 w-4" /> Cons
          </h5>
          <ul className="space-y-1">
            {gradeResult.cons.slice(0, 4).map((con, idx) => (
              <li key={idx} className="text-xs text-foreground/80 flex items-start gap-1">
                <span className="text-red-400 mt-0.5">•</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Deep Seek Button */}
      <Button
        onClick={() => setShowDeepSeek(true)}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
      >
        <Beaker className="h-4 w-4 mr-2" />
        Deep Seek
        <Sparkles className="h-4 w-4 ml-2" />
      </Button>

      {/* Deep Seek Modal */}
      <BeverageDeepSeekModal
        open={showDeepSeek}
        onOpenChange={setShowDeepSeek}
        barcode={barcode}
        productName={productName || beverageInfo.name}
        productData={productData}
        productImage={productImage}
      />
    </div>
  );
};
