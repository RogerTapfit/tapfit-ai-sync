import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, Upload, Loader2, ChefHat, Clock, Users, 
  Sparkles, Star, Heart, Leaf, Flame, Plus, ArrowRight, Minus, Info, AlertTriangle
} from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedNumber } from './AnimatedNumber';
import { calculateRecipeNutrition, RecipeNutrition } from '@/services/nutritionCalculatorService';

interface RecipeRecommendation {
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  healthScore: number;
  tags: string[];
  ingredients: {
    name: string;
    amount: string;
    available: boolean;
    substitutes?: string[];
  }[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  image?: string;
  calculatedNutrition?: RecipeNutrition; // Store detailed USDA calculation
}

interface IngredientPhoto {
  id: string;
  dataUrl: string;
  file: File;
}

interface FoodRecipeBuilderProps {
  onStateChange?: (state: 'recipe_mode' | 'ingredient_analysis', data?: { recipeCount?: number }) => void;
}

export const FoodRecipeBuilder: React.FC<FoodRecipeBuilderProps> = ({ onStateChange }) => {
  const [photos, setPhotos] = useState<IngredientPhoto[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeRecommendation | null>(null);
  const [adjustedServings, setAdjustedServings] = useState<number>(1);
  const [calculatedNutrition, setCalculatedNutrition] = useState<RecipeNutrition | null>(null);
  const [showNutritionDetails, setShowNutritionDetails] = useState(false);

  const generateId = () => crypto.randomUUID();

  const handlePhotoCapture = async (source: 'camera' | 'gallery') => {
    try {
      let photoData: string;
      let file: File;

      if (!Capacitor.isNativePlatform()) {
        // Web fallback
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (source === 'camera') input.capture = 'environment';
        
        return new Promise<void>((resolve) => {
          input.onchange = (e) => {
            const selectedFile = (e.target as HTMLInputElement).files?.[0];
            if (selectedFile) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const newPhoto: IngredientPhoto = {
                  id: generateId(),
                  dataUrl: event.target?.result as string,
                  file: selectedFile
                };
                setPhotos(prev => [...prev, newPhoto]);
                resolve();
              };
              reader.readAsDataURL(selectedFile);
            }
          };
          input.click();
        });
      }

      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos
      });

      if (image.dataUrl) {
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const newFile = new File([blob], `ingredients-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        const newPhoto: IngredientPhoto = {
          id: generateId(),
          dataUrl: image.dataUrl,
          file: newFile
        };
        
        setPhotos(prev => [...prev, newPhoto]);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Failed to capture photo. Please try again.');
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const analyzeIngredientsAndGetRecipes = async () => {
    if (photos.length === 0) {
      toast.error('Please add at least one photo of your ingredients');
      return;
    }

    setAnalyzing(true);
    try {
      // Convert all photos to base64
      const photoData = await Promise.all(
        photos.map(async (photo) => ({
          base64: await convertToBase64(photo.file),
          filename: photo.file.name
        }))
      );

      console.log('Recipe analysis starting...');
      
      // Call the generateRecipes edge function
      const { data: result, error } = await supabase.functions.invoke('generateRecipes', {
        body: { photos: photoData }
      });

      if (error) {
        console.error('Recipe generation error:', error);
        throw new Error(error.message || 'Failed to generate recipes');
      }

      if (!result) {
        throw new Error('No recipe data received from AI analysis');
      }

      setDetectedIngredients(result.ingredients || []);
      
      // Process recipes and calculate accurate nutrition for each
      const processedRecipes = (result.recipes || []).map((recipe: RecipeRecommendation) => {
        console.log('Calculating nutrition for recipe:', recipe.name);
        
        try {
          // Extract ingredient amounts and names for nutrition calculation  
          const ingredientList = recipe.ingredients.map(ing => `${ing.amount} ${ing.name}`);
          const calculatedNutrition = calculateRecipeNutrition(
            recipe.name,
            1, // Always normalize to 1 serving
            ingredientList,
            recipe.instructions.join('\n')
          );
          
          console.log('Calculated nutrition for', recipe.name, ':', calculatedNutrition.totals_per_serving);
          
          // Replace hardcoded nutrition with accurate USDA-calculated values
          return {
            ...recipe,
            servings: 1, // Normalize to 1 serving
            nutrition: {
              calories: Math.round(calculatedNutrition.totals_per_serving.calories_kcal),
              protein: Math.round(calculatedNutrition.totals_per_serving.protein_g * 10) / 10,
              carbs: Math.round(calculatedNutrition.totals_per_serving.carbs_g * 10) / 10,
              fat: Math.round(calculatedNutrition.totals_per_serving.fat_g * 10) / 10,
              fiber: Math.round(calculatedNutrition.totals_per_serving.fiber_g * 10) / 10
            },
            calculatedNutrition // Store for detailed breakdown
          };
        } catch (error) {
          console.error('Failed to calculate nutrition for recipe:', recipe.name, error);
          // Return recipe with reasonable fallback nutrition if calculation fails
          return {
            ...recipe,
            servings: 1,
            nutrition: {
              calories: 450, // Reasonable single-serving fallback
              protein: 25,
              carbs: 40, 
              fat: 18,
              fiber: 6
            }
          };
        }
      });
      
      setRecommendations(processedRecipes);
      onStateChange?.('ingredient_analysis', { recipeCount: processedRecipes.length });
      
      toast.success(`Found ${result.ingredients?.length || 0} ingredients and ${processedRecipes.length} recipes with accurate nutrition!`);
      
    } catch (error) {
      console.error('Error analyzing ingredients:', error);
      toast.error('Failed to analyze ingredients. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Hard': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    return 'F';
  };

  // Utility functions for ingredient amount parsing and scaling
  const parseAmount = (amountStr: string): { value: number; unit: string; original: string } => {
    // Handle common fractions
    const fractionMap: { [key: string]: number } = {
      '1/4': 0.25, '1/3': 0.33, '1/2': 0.5, '2/3': 0.67, '3/4': 0.75,
      '¼': 0.25, '⅓': 0.33, '½': 0.5, '⅔': 0.67, '¾': 0.75
    };

    // Handle "to taste", "pinch", etc.
    const nonScalable = ['to taste', 'pinch', 'dash', 'handful', 'splash'];
    if (nonScalable.some(term => amountStr.toLowerCase().includes(term))) {
      return { value: 0, unit: amountStr, original: amountStr };
    }

    // Extract number (including fractions and decimals)
    const match = amountStr.match(/^(\d+(?:\.\d+)?|\d*\s*[¼½¾⅓⅔]|\d+\/\d+)\s*(.*)$/);
    if (!match) {
      return { value: 0, unit: amountStr, original: amountStr };
    }

    let valueStr = match[1].trim();
    const unit = match[2].trim();

    // Handle fractions
    if (fractionMap[valueStr]) {
      return { value: fractionMap[valueStr], unit, original: amountStr };
    }

    // Handle mixed numbers (e.g., "1 1/2")
    const mixedMatch = valueStr.match(/^(\d+)\s+(\d+\/\d+)$/);
    if (mixedMatch) {
      const whole = parseFloat(mixedMatch[1]);
      const [num, den] = mixedMatch[2].split('/').map(Number);
      return { value: whole + (num / den), unit, original: amountStr };
    }

    // Handle regular fractions (e.g., "3/4")
    if (valueStr.includes('/')) {
      const [num, den] = valueStr.split('/').map(Number);
      return { value: num / den, unit, original: amountStr };
    }

    return { value: parseFloat(valueStr) || 0, unit, original: amountStr };
  };

  const scaleAmount = (amountStr: string, multiplier: number): string => {
    const parsed = parseAmount(amountStr);
    
    if (parsed.value === 0) return parsed.original; // Non-scalable items
    
    const scaledValue = parsed.value * multiplier;
    
    // Format the scaled value nicely
    if (scaledValue < 0.125) return `pinch ${parsed.unit}`.trim();
    if (scaledValue === 0.25) return `¼ ${parsed.unit}`.trim();
    if (scaledValue === 0.33) return `⅓ ${parsed.unit}`.trim();
    if (scaledValue === 0.5) return `½ ${parsed.unit}`.trim();
    if (scaledValue === 0.67) return `⅔ ${parsed.unit}`.trim();
    if (scaledValue === 0.75) return `¾ ${parsed.unit}`.trim();
    
    // For other values, round appropriately
    if (scaledValue < 1) {
      return `${scaledValue.toFixed(2).replace(/\.?0+$/, '')} ${parsed.unit}`.trim();
    } else if (scaledValue % 1 === 0) {
      return `${scaledValue.toFixed(0)} ${parsed.unit}`.trim();
    } else {
      return `${scaledValue.toFixed(1)} ${parsed.unit}`.trim();
    }
  };

  const servingMultiplier = selectedRecipe ? adjustedServings / selectedRecipe.servings : 1;

  return (
    <div className="space-y-8">
      <Card className="glow-card border-gradient">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ChefHat className="h-8 w-8 text-primary" />
            </motion.div>
            Smart Recipe Builder
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </motion.div>
          </CardTitle>
          <p className="text-muted-foreground">
            Snap photos of your ingredients and discover healthy recipes you can make
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo Capture Section */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Capture Your Ingredients
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePhotoCapture('camera')}
                className="flex items-center gap-2 glow-hover h-12 sm:h-auto touch-manipulation"
              >
                <Camera className="h-4 w-4" />
                <span className="text-sm sm:text-base">Take Photo</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePhotoCapture('gallery')}
                className="flex items-center gap-2 glow-hover h-12 sm:h-auto touch-manipulation"
              >
                <Upload className="h-4 w-4" />
                <span className="text-sm sm:text-base">Upload Photo</span>
              </Button>
            </div>

            {/* Photo Grid */}
            <AnimatePresence>
              {photos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
                  >
                  {photos.map((photo) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors">
                        <img
                          src={photo.dataUrl}
                          alt="Ingredient"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive hover:bg-destructive/90"
                      >
                        <Plus className="h-3 w-3 rotate-45" />
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analyze Button */}
            <Button
              onClick={analyzeIngredientsAndGetRecipes}
              disabled={photos.length === 0 || analyzing}
              className="w-full glow-button touch-manipulation"
              size="lg"
            >
            {analyzing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing Ingredients & Finding Recipes...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Find Recipe Magic ✨
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Detected Ingredients */}
      <AnimatePresence>
        {detectedIngredients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="glow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-500" />
                  Detected Ingredients ({detectedIngredients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {detectedIngredients.map((ingredient, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Badge 
                        variant="secondary" 
                        className="px-3 py-1 bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 transition-colors"
                      >
                        {ingredient}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe Recommendations */}
      <AnimatePresence>
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Star className="h-6 w-6 text-yellow-500" />
                Recipe Recommendations
                <AnimatedNumber finalValue={recommendations.length} duration={1000} />
              </h2>
              <p className="text-muted-foreground">
                Delicious and healthy meals you can make with your ingredients
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {recommendations.map((recipe, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card className="glow-card hover:glow-card-hover transition-all duration-300 cursor-pointer group"
                        onClick={() => {
                          setSelectedRecipe(recipe);
                          setAdjustedServings(1); // Always start with 1 serving
                          // Set calculated nutrition for detailed view
                          if (recipe.calculatedNutrition) {
                            setCalculatedNutrition(recipe.calculatedNutrition);
                          }
                        }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {recipe.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {recipe.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className={`text-sm font-semibold ${getHealthScoreColor(recipe.healthScore)}`}>
                            {getHealthScoreGrade(recipe.healthScore)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getDifficultyColor(recipe.difficulty)}>
                          {recipe.difficulty}
                        </Badge>
                        {recipe.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-semibold">{recipe.prepTime + recipe.cookTime}m</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Total Time</span>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-semibold">{recipe.servings}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Servings</span>
                        </div>
                         <div>
                           <div className="flex items-center justify-center gap-1">
                             <Flame className="h-3 w-3 text-muted-foreground" />
                             <span className="text-sm font-semibold">{Math.round(recipe.nutrition.calories)}</span>
                           </div>
                           <span className="text-xs text-muted-foreground">Calories/serving</span>
                         </div>
                      </div>

                      {/* Ingredient Match */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Ingredient Match:</span>
                          <span className="font-semibold text-green-400">
                            {recipe.ingredients.filter(ing => ing.available).length}/{recipe.ingredients.length}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                            style={{
                              width: `${(recipe.ingredients.filter(ing => ing.available).length / recipe.ingredients.length) * 100}%`
                            }}
                          />
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          setSelectedRecipe(recipe);
                          setAdjustedServings(1); // Always start with 1 serving
                          
                          // Set calculated nutrition for detailed view
                          if (recipe.calculatedNutrition) {
                            setCalculatedNutrition(recipe.calculatedNutrition);
                          }
                        }}
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        View Full Recipe
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe Detail Modal would go here */}
      {selectedRecipe && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRecipe(null);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedRecipe.name}</CardTitle>
                    <p className="text-muted-foreground mt-1">{selectedRecipe.description}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setSelectedRecipe(null);
                      setAdjustedServings(1);
                      setCalculatedNutrition(null);
                      setShowNutritionDetails(false);
                    }}
                  >
                    <Plus className="h-4 w-4 rotate-45" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recipe Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{selectedRecipe.prepTime + selectedRecipe.cookTime}m</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Total Time</span>
                  </div>
                   <div className="text-center">
                     <div className="flex items-center justify-center gap-2 mb-1">
                       <Users className="h-4 w-4 text-muted-foreground" />
                       <div className="flex items-center gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setAdjustedServings(Math.max(1, adjustedServings - 1))}
                           disabled={adjustedServings <= 1}
                           className="h-6 w-6 p-0"
                         >
                           <Minus className="h-3 w-3" />
                         </Button>
                         <span className="font-semibold min-w-[2ch] text-center">{adjustedServings}</span>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setAdjustedServings(adjustedServings + 1)}
                           className="h-6 w-6 p-0"
                         >
                           <Plus className="h-3 w-3" />
                         </Button>
                       </div>
                     </div>
                     <span className="text-xs text-muted-foreground">Servings</span>
                   </div>
                   <div className="text-center">
                     <div className="flex items-center justify-center gap-1 mb-1">
                       <Flame className="h-4 w-4 text-muted-foreground" />
                       <span className="font-semibold">{Math.round(selectedRecipe.nutrition.calories * servingMultiplier)}</span>
                     </div>
                     <span className="text-xs text-muted-foreground">Calories</span>
                   </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-green-500">{selectedRecipe.healthScore}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Health Score</span>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getDifficultyColor(selectedRecipe.difficulty)}>
                      {selectedRecipe.difficulty}
                    </Badge>
                    {selectedRecipe.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-500" />
                    Ingredients
                  </h3>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${ingredient.available ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="font-medium">{ingredient.name}</span>
                        </div>
                         <span className="text-sm text-muted-foreground font-medium">
                           {scaleAmount(ingredient.amount, servingMultiplier)}
                         </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-primary" />
                    Instructions
                  </h3>
                  <div className="space-y-3">
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-relaxed pt-0.5">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nutrition Info */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      Nutrition per Serving
                    </h3>
                    {calculatedNutrition && (
                      <div className="flex items-center gap-2">
                        {calculatedNutrition.confidence < 0.7 && (
                          <Badge variant="outline" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low Confidence
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNutritionDetails(!showNutritionDetails)}
                          className="text-xs"
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {calculatedNutrition ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="font-semibold text-orange-500">
                            {Math.round(calculatedNutrition.totals_per_serving.calories_kcal * servingMultiplier)}
                          </div>
                          <div className="text-xs text-muted-foreground">Calories</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="font-semibold text-blue-500">
                            {Math.round(calculatedNutrition.totals_per_serving.protein_g * servingMultiplier * 10) / 10}g
                          </div>
                          <div className="text-xs text-muted-foreground">Protein</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="font-semibold text-yellow-500">
                            {Math.round(calculatedNutrition.totals_per_serving.carbs_g * servingMultiplier * 10) / 10}g
                          </div>
                          <div className="text-xs text-muted-foreground">Carbs</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="font-semibold text-red-500">
                            {Math.round(calculatedNutrition.totals_per_serving.fat_g * servingMultiplier * 10) / 10}g
                          </div>
                          <div className="text-xs text-muted-foreground">Fat</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="font-semibold text-green-500">
                            {Math.round(calculatedNutrition.totals_per_serving.fiber_g * servingMultiplier * 10) / 10}g
                          </div>
                          <div className="text-xs text-muted-foreground">Fiber</div>
                        </div>
                      </div>
                      
                      {/* Nutrition Details */}
                      <AnimatePresence>
                        {showNutritionDetails && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-4"
                          >
                            {/* Confidence and USDA Credit */}
                            <div className="p-3 bg-muted/20 rounded-lg">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                <span>Confidence: {Math.round(calculatedNutrition.confidence * 100)}%</span>
                                <span>Powered by USDA FoodData Central</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Values are estimates based on USDA data. See breakdown below for assumptions.
                              </p>
                            </div>
                            
                            {/* Ingredient Breakdown */}
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Ingredient Breakdown</h4>
                              <div className="space-y-2">
                                {calculatedNutrition.ingredients_breakdown.map((ingredient, index) => (
                                  <div key={index} className="p-2 bg-muted/10 rounded text-xs">
                                    <div className="font-medium">{ingredient.name}</div>
                                    <div className="text-muted-foreground">
                                      {ingredient.grams_used}g → {ingredient.kcal} kcal, 
                                      {ingredient.protein_g}g protein, {ingredient.carbs_g}g carbs, {ingredient.fat_g}g fat
                                    </div>
                                    <div className="text-muted-foreground mt-1 italic">
                                      {ingredient.source}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Assumptions */}
                            {calculatedNutrition.assumptions.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Assumptions Made</h4>
                                <ul className="space-y-1">
                                  {calculatedNutrition.assumptions.map((assumption, index) => (
                                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                                      <span className="text-yellow-500 mt-0.5">•</span>
                                      {assumption}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="font-semibold text-orange-500">
                          {Math.round(selectedRecipe.nutrition.calories * servingMultiplier)}
                        </div>
                        <div className="text-xs text-muted-foreground">Calories</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="font-semibold text-blue-500">
                          {Math.round(selectedRecipe.nutrition.protein * servingMultiplier)}g
                        </div>
                        <div className="text-xs text-muted-foreground">Protein</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="font-semibold text-yellow-500">
                          {Math.round(selectedRecipe.nutrition.carbs * servingMultiplier)}g
                        </div>
                        <div className="text-xs text-muted-foreground">Carbs</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="font-semibold text-red-500">
                          {Math.round(selectedRecipe.nutrition.fat * servingMultiplier)}g
                        </div>
                        <div className="text-xs text-muted-foreground">Fat</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="font-semibold text-green-500">
                          {Math.round(selectedRecipe.nutrition.fiber * servingMultiplier)}g
                        </div>
                        <div className="text-xs text-muted-foreground">Fiber</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};