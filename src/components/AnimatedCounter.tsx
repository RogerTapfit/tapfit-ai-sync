import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  max = 100,
  step = 1,
  label,
  unit,
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

  const handlePresetClick = (presetValue: number) => {
    onChange(presetValue);
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="text-sm font-medium text-center">{label}</div>
      )}
      
      <div className="flex items-center justify-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDecrement}
          disabled={value <= min}
          className="h-8 w-8 p-0 rounded-full"
        >
          <Minus className="h-3 w-3" />
        </Button>
        
        <div className="relative w-16 h-12 flex items-center justify-center">
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
              className="absolute text-2xl font-bold text-center"
            >
              {displayValue}
              {unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleIncrement}
          disabled={value >= max}
          className="h-8 w-8 p-0 rounded-full"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {presets.map((preset, index) => (
            <Button
              key={index}
              size="sm"
              variant={value === preset.value ? "default" : "outline"}
              onClick={() => handlePresetClick(preset.value)}
              className="h-7 px-2 text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};