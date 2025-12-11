import { useState, useEffect } from 'react';
import { WaterProduct, getPHDescription, getGradeColor, getGradeDescription } from '@/services/waterQualityDatabase';
import { Badge } from '@/components/ui/badge';
import { Droplet, MapPin, Check, AlertTriangle, Beaker, Sparkles } from 'lucide-react';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { playPHSound } from '@/lib/audioFeedback';

interface WaterQualityCardProps {
  water: WaterProduct;
}

export const WaterQualityCard = ({ water }: WaterQualityCardProps) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const phInfo = getPHDescription(water.ph_level);
  const gradeColorClass = getGradeColor(water.quality_grade);

  // Trigger animation after component mounts and play sound when complete
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 200);
    
    // Play sound after animation completes (2250ms animation + 200ms delay + 100ms buffer)
    const soundTimer = setTimeout(() => {
      playPHSound(water.ph_level);
    }, 2550);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(soundTimer);
    };
  }, [water.ph_level]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{water.name}</h3>
          <p className="text-sm text-muted-foreground">{water.brand}</p>
        </div>
        <Badge className={`text-lg font-bold px-3 py-1 ${gradeColorClass}`}>
          {water.quality_grade}
        </Badge>
      </div>

      {/* pH Level Gauge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">pH Level</span>
          <span className={`font-bold ${phInfo.color}`}>
            {phInfo.text}
          </span>
        </div>
        {/* Container with extra top padding for floating number */}
        <div className="relative pt-8">
          {/* Gradient bar */}
          <div className="relative h-6 rounded-full overflow-hidden bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-cyan-500 to-blue-600">
            {/* pH markers */}
            <div className="absolute inset-0 flex justify-between px-2 items-center text-[10px] text-white font-medium">
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
              <span>8</span>
              <span>9</span>
              <span>10</span>
            </div>
          </div>
          {/* Enhanced Animated Indicator - positioned above the bar */}
          <div 
            className="absolute top-0 bottom-0 flex flex-col items-center transform -translate-x-1/2 transition-all duration-[2250ms] ease-out"
            style={{ left: isAnimated ? `${((water.ph_level - 4) / 6) * 100}%` : '0%' }}
          >
            {/* pH Number floating above */}
            <div className="bg-white text-black font-bold text-sm px-2 py-0.5 rounded-full shadow-lg min-w-[28px] text-center mb-1">
              {water.ph_level}
            </div>
            {/* Droplet pointer */}
            <Droplet className="h-4 w-4 text-white fill-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
            {/* Vertical line with glow */}
            <div className="w-1.5 flex-1 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)] border border-black/20" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Acidic</span>
          <span>Neutral</span>
          <span>Alkaline</span>
        </div>
      </div>

      {/* Quality Score */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 ${gradeColorClass}`}>
          <AnimatedNumber finalValue={water.quality_score} duration={1500} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Quality Score</p>
          <p className="text-xs text-muted-foreground">{getGradeDescription(water.quality_grade)}</p>
        </div>
      </div>

      {/* Water Type & Source */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-muted/30 space-y-1">
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-cyan-500" />
            <span className="text-xs text-muted-foreground">Water Type</span>
          </div>
          <p className="text-sm font-medium text-foreground capitalize">{water.water_type}</p>
        </div>
        {water.source_location && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-500" />
              <span className="text-xs text-muted-foreground">Source</span>
            </div>
            <p className="text-sm font-medium text-foreground">{water.source_location}</p>
          </div>
        )}
      </div>

      {/* Minerals */}
      {water.minerals && Object.keys(water.minerals).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Beaker className="h-4 w-4 text-cyan-500" />
            <span className="text-sm font-medium text-foreground">Minerals (per Liter)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {water.minerals.calcium_mg !== undefined && (
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">{water.minerals.calcium_mg}</p>
                <p className="text-xs text-muted-foreground">Ca (mg)</p>
              </div>
            )}
            {water.minerals.magnesium_mg !== undefined && (
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">{water.minerals.magnesium_mg}</p>
                <p className="text-xs text-muted-foreground">Mg (mg)</p>
              </div>
            )}
            {water.minerals.sodium_mg !== undefined && (
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">{water.minerals.sodium_mg}</p>
                <p className="text-xs text-muted-foreground">Na (mg)</p>
              </div>
            )}
            {water.minerals.potassium_mg !== undefined && (
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">{water.minerals.potassium_mg}</p>
                <p className="text-xs text-muted-foreground">K (mg)</p>
              </div>
            )}
            {water.minerals.silica_mg !== undefined && (
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">{water.minerals.silica_mg}</p>
                <p className="text-xs text-muted-foreground">Silica (mg)</p>
              </div>
            )}
            {water.minerals.tds_ppm !== undefined && (
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">{water.minerals.tds_ppm}</p>
                <p className="text-xs text-muted-foreground">TDS (ppm)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      {water.features && water.features.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {water.features.map((feature, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              {feature}
            </Badge>
          ))}
        </div>
      )}

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 gap-3">
        {water.pros && water.pros.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-500 flex items-center gap-1">
              <Check className="h-4 w-4" /> Pros
            </p>
            <ul className="space-y-1">
              {water.pros.map((pro, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
        )}
        {water.cons && water.cons.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-500 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> Cons
            </p>
            <ul className="space-y-1">
              {water.cons.map((con, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
