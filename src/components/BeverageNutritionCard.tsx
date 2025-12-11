import { useState, useEffect } from 'react';
import { BeverageType } from '@/lib/beverageHydration';
import { 
  calculateBeverageHealthGrade, 
  getGradeColor, 
  getGradeBgColor,
  getScoreColor,
  BeverageGradeResult 
} from '@/utils/beverageHealthGrading';
import { Check, X, Droplet, Flame, Wheat, Drumstick, CircleDot } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';

interface BeverageNutritionCardProps {
  beverageInfo: BeverageType;
  productName?: string;
  servingOz?: number;
}

export const BeverageNutritionCard = ({ beverageInfo, productName, servingOz }: BeverageNutritionCardProps) => {
  const [gradeResult, setGradeResult] = useState<BeverageGradeResult | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);

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

  return (
    <div className="space-y-4">
      {/* Header with Grade Circle */}
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
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
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {productName || beverageInfo.name}
              </h3>
              <p className="text-sm text-muted-foreground capitalize">
                {beverageInfo.category} • {servingOz || beverageInfo.servingOz}oz serving
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

      {/* Nutrition Facts */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3 pb-2 border-b border-border">
          Nutrition Facts
        </h4>
        
        <div className="space-y-2">
          {/* Calories - Prominent */}
          <div className="flex justify-between items-center py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-foreground">Calories</span>
            </div>
            <span className="text-xl font-bold text-foreground">{beverageInfo.calories}</span>
          </div>

          {/* Macros */}
          <div className="flex justify-between items-center py-1.5">
            <div className="flex items-center gap-2">
              <Drumstick className="h-4 w-4 text-red-400" />
              <span className="text-foreground">Protein</span>
            </div>
            <span className="font-medium text-foreground">{beverageInfo.protein}g</span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <div className="flex items-center gap-2">
              <Wheat className="h-4 w-4 text-amber-500" />
              <span className="text-foreground">Carbohydrates</span>
            </div>
            <span className="font-medium text-foreground">{beverageInfo.carbs}g</span>
          </div>

          {/* Sugar - indented under carbs */}
          {beverageInfo.sugar !== undefined && (
            <div className="flex justify-between items-center py-1.5 pl-6">
              <span className="text-muted-foreground">└ Sugar</span>
              <span className={`font-medium ${beverageInfo.sugar > 20 ? 'text-red-400' : beverageInfo.sugar > 10 ? 'text-yellow-400' : 'text-foreground'}`}>
                {beverageInfo.sugar}g {beverageInfo.sugar > 20 && '⚠️'}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-1.5">
            <div className="flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-yellow-500" />
              <span className="text-foreground">Fat</span>
            </div>
            <span className="font-medium text-foreground">{beverageInfo.fat}g</span>
          </div>
        </div>
      </div>

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
      <div className="grid grid-cols-2 gap-3">
        {/* Pros */}
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
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
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
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
    </div>
  );
};
