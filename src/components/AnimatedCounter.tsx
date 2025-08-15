import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  presets?: { label: string; value: number }[];
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  onChange,
  min = 0,
  max = 5,
  step = 0.25,
  label,
  unit = '',
  presets = []
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value !== displayValue) {
      setDirection(value > displayValue ? 'up' : 'down');
      setDisplayValue(value);
    }
  }, [value, displayValue]);

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  const handlePresetClick = (presetValue: number) => {
    onChange(presetValue);
  };

  const getDisplayValue = () => {
    if (displayValue % 1 === 0) {
      return displayValue.toString();
    }
    return displayValue.toFixed(1);
  };

  return (
    <div className="space-y-4">
      {label && (
        <Label className="text-sm font-medium text-center block">{label}</Label>
      )}
      
      {/* Main Counter with Slider */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDecrement}
            disabled={value <= min}
            className="h-10 w-10 rounded-full border-2 hover:bg-muted/50 transition-colors"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 px-2">
            <div className="text-center mb-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayValue}
                  initial={{ 
                    y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0,
                    opacity: 0 
                  }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ 
                    y: direction === 'up' ? -20 : direction === 'down' ? 20 : 0,
                    opacity: 0 
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl font-black text-primary"
                >
                  {getDisplayValue()}
                  {unit && <span className="text-lg font-semibold text-muted-foreground ml-1">{unit}</span>}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Slider */}
            <Slider
              value={[value]}
              onValueChange={handleSliderChange}
              min={min}
              max={max}
              step={step}
              className="w-full"
            />
            
            {/* Range Labels */}
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{min}{unit}</span>
              <span>{max}{unit}</span>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleIncrement}
            disabled={value >= max}
            className="h-10 w-10 rounded-full border-2 hover:bg-muted/50 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Preset Buttons */}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {presets.map((preset, index) => (
            <Button
              key={index}
              size="sm"
              variant={value === preset.value ? "default" : "outline"}
              onClick={() => handlePresetClick(preset.value)}
              className="h-8 px-3 text-xs font-medium transition-all duration-200 hover:scale-105"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};