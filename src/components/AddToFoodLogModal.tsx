import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Utensils, Coffee, Sun, Sunset, Moon, Plus, Minus, Mic } from 'lucide-react';
import { useNutrition } from '@/hooks/useNutrition';
import { toast } from 'sonner';
import type { FoodItem, FoodEntry } from '@/hooks/useNutrition';
import VoiceInterface from './VoiceInterface';

interface ProductAnalysis {
  product: {
    name: string;
    brand?: string;
    size?: string;
    confidence: number;
  };
  nutrition: {
    serving_size: string;
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
  };
}

interface AddToFoodLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  productAnalysis: ProductAnalysis;
  onSuccess?: () => void;
}

const getMealTypeFromTime = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 19) return 'dinner';
  return 'snack';
};

const mealTypeIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Sunset,
  snack: Moon,
};

export const AddToFoodLogModal: React.FC<AddToFoodLogModalProps> = ({
  isOpen,
  onClose,
  productAnalysis,
  onSuccess,
}) => {
  const [portionSize, setPortionSize] = useState(1.0);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(getMealTypeFromTime());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const { saveFoodEntry } = useNutrition();

  console.log('AddToFoodLogModal render - isVoiceChatOpen:', isVoiceChatOpen); // Debug log

  // Check if product is alcohol
  const isAlcohol = () => {
    const productName = productAnalysis.product.name.toLowerCase();
    const brandName = productAnalysis.product.brand?.toLowerCase() || '';
    const alcoholKeywords = ['beer', 'wine', 'vodka', 'whiskey', 'rum', 'gin', 'tequila', 'alcohol', 'liquor', 'spirits', 'champagne', 'prosecco', 'cider', 'sake', 'bourbon', 'scotch', 'brandy', 'cognac', 'absinthe', 'mezcal'];
    
    return alcoholKeywords.some(keyword => 
      productName.includes(keyword) || brandName.includes(keyword)
    );
  };

  // Calculate adjusted nutrition values
  const adjustedNutrition = {
    calories: Math.round(productAnalysis.nutrition.per_serving.calories * portionSize),
    protein: Math.round(productAnalysis.nutrition.per_serving.protein_g * portionSize * 10) / 10,
    carbs: Math.round(productAnalysis.nutrition.per_serving.carbs_g * portionSize * 10) / 10,
    fat: Math.round(productAnalysis.nutrition.per_serving.fat_g * portionSize * 10) / 10,
  };

  const incrementPortion = () => {
    setPortionSize(prev => Math.min(10, prev + 0.5));
  };

  const decrementPortion = () => {
    setPortionSize(prev => Math.max(0.5, prev - 0.5));
  };

  const handleSaveToFoodLog = async () => {
    try {
      setIsLoading(true);

      const foodItem: FoodItem = {
        name: `${productAnalysis.product.brand ? productAnalysis.product.brand + ' ' : ''}${productAnalysis.product.name}`,
        quantity: `${portionSize} serving${portionSize !== 1 ? 's' : ''}`,
        calories: adjustedNutrition.calories,
        protein: adjustedNutrition.protein,
        carbs: adjustedNutrition.carbs,
        fat: adjustedNutrition.fat,
        confidence: 0.95, // High confidence for scanned products
      };

      const foodEntry: Omit<FoodEntry, 'id' | 'created_at'> = {
        meal_type: isAlcohol() ? 'snack' : mealType, // Default alcohol to snack category
        food_items: [foodItem],
        total_calories: adjustedNutrition.calories,
        total_protein: adjustedNutrition.protein,
        total_carbs: adjustedNutrition.carbs,
        total_fat: adjustedNutrition.fat,
        ai_analyzed: true,
        user_confirmed: true,
        logged_date: new Date().toISOString().split('T')[0],
        health_grade: productAnalysis.health_grade.letter,
        notes: notes || undefined,
        grade_score: getGradeScore(productAnalysis.health_grade.letter),
      };

      await saveFoodEntry(foodEntry);
      
      toast.success('Added to food log successfully!', {
        description: `${foodItem.name} has been logged for ${mealType}`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving to food log:', error);
      toast.error('Failed to save to food log');
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeScore = (grade: string): number => {
    switch (grade.toUpperCase()) {
      case 'A': return 90;
      case 'B': return 80;
      case 'C': return 70;
      case 'D': return 60;
      case 'F': return 50;
      default: return 70;
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPortionSize(1.0);
      setMealType(getMealTypeFromTime());
      setNotes('');
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Utensils className="h-5 w-5 text-stats-exercises" />
              Add to Food Log
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('Voice Chat button clicked'); // Debug log
                setIsVoiceChatOpen(true);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Mic className="h-4 w-4 mr-2" />
              Voice Chat
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Info */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-stats-exercises/10 to-stats-calories/10 p-4 rounded-lg border border-stats-exercises/20"
          >
            <h3 className="font-semibold text-foreground">
              {productAnalysis.product.brand && (
                <span className="text-muted-foreground">{productAnalysis.product.brand} </span>
              )}
              {productAnalysis.product.name}
            </h3>
            {productAnalysis.product.size && (
              <p className="text-sm text-muted-foreground">{productAnalysis.product.size}</p>
            )}
          </motion.div>

          {/* Portion Size */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <Label className="text-base font-semibold">Portion Size</Label>
            
            {/* Fine Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={decrementPortion}
                disabled={portionSize <= 0.5}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <div className="text-center min-w-[120px]">
                <span className="text-lg font-bold text-stats-exercises">{
                  portionSize === 1.5 ? "1½" :
                  portionSize === 2.5 ? "2½" : 
                  portionSize === 3.5 ? "3½" :
                  portionSize === 4.5 ? "4½" :
                  portionSize === 5.5 ? "5½" : portionSize.toString()
                }x</span>
                <span className="text-muted-foreground ml-1">serving{portionSize !== 1 ? 's' : ''}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={incrementPortion}
                disabled={portionSize >= 10}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Adjusted Nutrition */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-muted/30 p-4 rounded-lg"
          >
            <h4 className="font-semibold mb-3">Adjusted Nutrition</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span>Calories:</span>
                <span className="font-semibold text-stats-calories">{adjustedNutrition.calories}</span>
              </div>
              <div className="flex justify-between">
                <span>Protein:</span>
                <span className="font-semibold text-stats-exercises">{adjustedNutrition.protein}g</span>
              </div>
              <div className="flex justify-between">
                <span>Carbs:</span>
                <span className="font-semibold text-stats-reps">{adjustedNutrition.carbs}g</span>
              </div>
              <div className="flex justify-between">
                <span>Fat:</span>
                <span className="font-semibold text-stats-duration">{adjustedNutrition.fat}g</span>
              </div>
            </div>
          </motion.div>

          {/* Meal Type - Only show for non-alcohol items */}
          {!isAlcohol() && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <Label className="text-base font-semibold">Meal Type</Label>
              <RadioGroup value={mealType} onValueChange={(value) => setMealType(value as any)}>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(mealTypeIcons).map(([type, Icon]) => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem value={type} id={type} />
                      <Label 
                        htmlFor={type} 
                        className="flex items-center gap-2 cursor-pointer capitalize font-medium"
                      >
                        <Icon className="h-4 w-4" />
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </motion.div>
          )}

          {/* Notes */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <Label htmlFor="notes" className="text-base font-semibold">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 pt-2"
          >
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveToFoodLog}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Add to Food Log'}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Voice Chat Interface - Outside dialog to avoid z-index conflicts */}
    <VoiceInterface 
      isOpen={isVoiceChatOpen}
      onToggle={() => setIsVoiceChatOpen(!isVoiceChatOpen)}
    />
    </>
  );
};