import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Utensils, Coffee, Sun, Sunset, Moon, Plus, Minus, Mic } from 'lucide-react';
import { useNutrition } from '@/hooks/useNutrition';
import { toast } from 'sonner';
import type { FoodItem, FoodEntry, AlcoholEntry } from '@/hooks/useNutrition';
import VoiceInterface from './VoiceInterface';
import FitnessChatbot from './FitnessChatbot';
import { useAvatar } from '@/lib/avatarState';
import { FoodPhotoUploadService } from '@/services/foodPhotoUploadService';

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
  selectedImage?: string;
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
  selectedImage,
}) => {
  const [portionSize, setPortionSize] = useState(1.0);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(getMealTypeFromTime());
  const [alcoholType, setAlcoholType] = useState<string>('beer');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const { saveFoodEntry, saveAlcoholEntry } = useNutrition();
  const { avatar } = useAvatar();

  // Get avatar name, fallback to "FitBot"
  const avatarName = avatar?.name || "FitBot";

  console.log('AddToFoodLogModal render - isVoiceChatOpen:', isVoiceChatOpen); // Debug log

  // Enhanced alcohol detection
  const isAlcohol = () => {
    const productName = productAnalysis.product.name.toLowerCase();
    const brandName = productAnalysis.product.brand?.toLowerCase() || '';
    
    console.log('🍺 Alcohol Detection Debug:', {
      productName,
      brandName,
      fullProduct: productAnalysis.product
    });
    
    const alcoholKeywords = [
      'beer', 'wine', 'vodka', 'whiskey', 'rum', 'gin', 'tequila', 'alcohol', 'liquor', 'spirits', 
      'champagne', 'prosecco', 'cider', 'sake', 'bourbon', 'scotch', 'brandy', 'cognac', 'absinthe', 
      'mezcal', 'cocktail', 'martini', 'margarita', 'mojito', 'sangria', 'ale', 'lager', 'stout', 
      'porter', 'ipa', 'pilsner', 'merlot', 'cabernet', 'chardonnay', 'sauvignon', 'riesling', 
      'pinot', 'shiraz', 'malbec', 'alcohol'
    ];
    
    const alcoholBrands = [
      'budweiser', 'corona', 'heineken', 'stella artois', 'miller', 'coors', 'guinness', 'carlsberg', 
      'bacardi', 'smirnoff', 'captain morgan', 'jose cuervo', 'johnnie walker', 'jack daniels', 
      'grey goose', 'absolut', 'tanqueray', 'bombay', 'don julio', 'patron', 'hennessy', 'remy martin',
      'moet', 'dom perignon', 'veuve clicquot', 'kendall jackson', 'robert mondavi', 'barefoot', 'yellowtail'
    ];
    
    const isAlcoholic = alcoholKeywords.some(keyword => 
      productName.includes(keyword) || brandName.includes(keyword)
    ) || alcoholBrands.some(brand => 
      productName.includes(brand) || brandName.includes(brand)
    );
    
    console.log('🍺 Is Alcohol?', isAlcoholic);
    return isAlcoholic;
  };

  // Classify alcohol type
  const getAlcoholType = () => {
    const productName = productAnalysis.product.name.toLowerCase();
    const brandName = productAnalysis.product.brand?.toLowerCase() || '';
    const combinedName = `${brandName} ${productName}`.toLowerCase();
    
    if (combinedName.includes('beer') || combinedName.includes('ale') || combinedName.includes('lager') || 
        combinedName.includes('stout') || combinedName.includes('porter') || combinedName.includes('ipa') || 
        combinedName.includes('pilsner') || ['budweiser', 'corona', 'heineken', 'stella artois', 'miller', 'coors', 'guinness', 'carlsberg'].some(b => combinedName.includes(b))) {
      return 'beer';
    }
    
    if (combinedName.includes('wine') || combinedName.includes('merlot') || combinedName.includes('cabernet') || 
        combinedName.includes('chardonnay') || combinedName.includes('sauvignon') || combinedName.includes('riesling') || 
        combinedName.includes('pinot') || combinedName.includes('shiraz') || combinedName.includes('malbec') ||
        combinedName.includes('champagne') || combinedName.includes('prosecco') || combinedName.includes('sangria')) {
      return 'wine';
    }
    
    if (combinedName.includes('vodka') || combinedName.includes('whiskey') || combinedName.includes('rum') || 
        combinedName.includes('gin') || combinedName.includes('tequila') || combinedName.includes('bourbon') || 
        combinedName.includes('scotch') || combinedName.includes('brandy') || combinedName.includes('cognac') || 
        combinedName.includes('absinthe') || combinedName.includes('mezcal') || combinedName.includes('spirits')) {
      return 'spirits';
    }
    
    if (combinedName.includes('cider')) return 'cider';
    if (combinedName.includes('sake')) return 'sake';
    if (combinedName.includes('cocktail') || combinedName.includes('martini') || combinedName.includes('margarita') || combinedName.includes('mojito')) return 'cocktail';
    
    return 'other';
  };

  // Estimate alcohol content based on type
  const getEstimatedAlcoholContent = (type: string) => {
    switch (type) {
      case 'beer': return 5.0;
      case 'wine': return 12.0;
      case 'spirits': return 40.0;
      case 'cider': return 4.5;
      case 'sake': return 15.0;
      case 'cocktail': return 15.0;
      default: return 5.0;
    }
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

      // Check if this is alcohol and handle differently
      if (isAlcohol()) {
        const detectedAlcoholType = getAlcoholType();
        const estimatedABV = getEstimatedAlcoholContent(detectedAlcoholType);
        
        console.log('🍺 ALCOHOL DETECTED! Saving to alcohol_entries table');
        console.log('🍺 Product:', productAnalysis.product.name);
        console.log('🍺 Brand:', productAnalysis.product.brand);
        console.log('🍺 Detected Type:', detectedAlcoholType);
        
        const alcoholEntry: Omit<AlcoholEntry, 'id' | 'created_at'> = {
          drink_type: alcoholType || detectedAlcoholType,
          alcohol_content: estimatedABV,
          quantity: portionSize,
          logged_date: new Date().toISOString().split('T')[0],
          logged_time: new Date().toTimeString().split(' ')[0],
          notes: notes || undefined
        };

        console.log('🍺 Alcohol entry to save:', alcoholEntry);
        await saveAlcoholEntry(alcoholEntry);
        
        toast.success('Alcohol entry saved successfully!', {
          description: `${productAnalysis.product.name} logged as ${alcoholType || detectedAlcoholType}`,
        });
      } else {
        // Regular food item
        const foodItem: FoodItem = {
          name: `${productAnalysis.product.brand ? productAnalysis.product.brand + ' ' : ''}${productAnalysis.product.name}`,
          quantity: `${portionSize} serving${portionSize !== 1 ? 's' : ''}`,
          calories: adjustedNutrition.calories,
          protein: adjustedNutrition.protein,
          carbs: adjustedNutrition.carbs,
          fat: adjustedNutrition.fat,
          confidence: 0.95,
        };

        let photoData = {};
        
        // Upload photo FIRST if selectedImage exists
        if (selectedImage) {
          console.log('Starting photo upload for selectedImage:', selectedImage.substring(0, 50) + '...');
          setUploadStatus('uploading');
          
          try {
            const uploadResult = await FoodPhotoUploadService.uploadFoodPhoto(selectedImage, mealType);
            
            console.log('Photo upload result:', uploadResult);
            
            if (uploadResult.success && uploadResult.photoUrl) {
              photoData = {
                photo_url: uploadResult.photoUrl,
                photo_storage_path: uploadResult.storagePath,
                thumbnail_url: uploadResult.thumbnailUrl,
              };
              
              console.log('Photo data prepared:', photoData);
              toast.success('Photo uploaded successfully!');
            } else {
              console.error('Photo upload failed:', uploadResult);
              toast.error('Failed to upload photo - continuing without photo');
            }
          } catch (photoError) {
            console.error('Photo upload error:', photoError);
            toast.error('Photo upload failed - continuing without photo');
          }
        }

        setUploadStatus('saving');
        console.log('Creating food entry with photo data:', photoData);

        const foodEntry: Omit<FoodEntry, 'id' | 'created_at'> = {
          meal_type: mealType,
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
          ...photoData,
        };

        console.log('Saving food entry:', foodEntry);
        
        const savedEntry = await saveFoodEntry(foodEntry);
        
        console.log('Food entry saved successfully:', savedEntry);
        
        toast.success('Added to food log successfully!', {
          description: `${foodItem.name} has been logged for ${mealType}`,
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving to food log:', error);
      toast.error('Failed to save to food log');
    } finally {
      setIsLoading(false);
      setUploadStatus('idle');
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
      setAlcoholType(getAlcoholType() || 'beer');
      setNotes('');
      setUploadStatus('idle');
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
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

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
          {/* Selected Photo Preview */}
          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <img
                src={selectedImage}
                alt="Selected food photo for analysis"
                loading="lazy"
                className="w-40 h-40 object-cover rounded-xl border-4 border-stats-exercises/40 shadow-md"
              />
            </motion.div>
          )}

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
            <div className="flex flex-col gap-1 mt-2">
              {productAnalysis.product.size && (
                <p className="text-sm text-muted-foreground">{productAnalysis.product.size}</p>
              )}
              {productAnalysis.nutrition.serving_size && (
                <p className="text-sm text-stats-exercises font-medium">
                  Per serving: {productAnalysis.nutrition.serving_size}
                </p>
              )}
            </div>
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

          {/* Alcohol Type - Only show for alcohol items */}
          {isAlcohol() && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <Label className="text-base font-semibold">Alcohol Type</Label>
              <RadioGroup value={alcoholType} onValueChange={setAlcoholType}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beer" id="beer" />
                    <Label htmlFor="beer" className="cursor-pointer font-medium">🍺 Beer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wine" id="wine" />
                    <Label htmlFor="wine" className="cursor-pointer font-medium">🍷 Wine</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="spirits" id="spirits" />
                    <Label htmlFor="spirits" className="cursor-pointer font-medium">🥃 Spirits</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cocktail" id="cocktail" />
                    <Label htmlFor="cocktail" className="cursor-pointer font-medium">🍸 Cocktail</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cider" id="cider" />
                    <Label htmlFor="cider" className="cursor-pointer font-medium">🍻 Cider</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="cursor-pointer font-medium">🥤 Other</Label>
                  </div>
                </div>
              </RadioGroup>
              <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                <span className="font-medium">Est. ABV:</span> {getEstimatedAlcoholContent(alcoholType)}% | 
                <span className="font-medium ml-2">Quantity:</span> {portionSize} serving{portionSize !== 1 ? 's' : ''}
              </div>
            </motion.div>
          )}

          {/* AI Assistant Chatbot */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-3 p-4 rounded-lg border-2 border-red-500/50 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {avatar?.mini_image_url && (
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-red-500/30">
                    <img
                      src={avatar.mini_image_url}
                      alt={`${avatarName} avatar`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Label className="text-base font-semibold">{avatarName}</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                className="text-xs px-3 py-1 h-7 border-2 border-blue-500/60 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:border-blue-400/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all duration-200"
              >
                {isChatbotOpen ? `Hide ${avatarName}` : `Ask ${avatarName}`}
              </Button>
            </div>
            {isChatbotOpen && (
              <div className="border border-border rounded-lg overflow-hidden">
                <FitnessChatbot
                  isOpen={true}
                  onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
                />
              </div>
            )}
          </motion.div>

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
              {uploadStatus === 'uploading' ? 'Uploading Photo...' : 
               uploadStatus === 'saving' ? 'Saving...' : 
               isAlcohol() ? 'Add to Alcohol Log' : 'Add to Food Log'}
            </Button>
          </motion.div>
          </div>
        </ScrollArea>
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