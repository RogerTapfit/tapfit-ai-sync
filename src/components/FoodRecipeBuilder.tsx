import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, Upload, Loader2, ChefHat, Clock, Users, 
  Sparkles, Star, Heart, Leaf, Flame, Plus, ArrowRight 
} from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedNumber } from './AnimatedNumber';

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

      // Use FoodRecipeBuilder instead since ingredient-recipe-analyzer is causing issues
      console.log('Recipe analysis requested but function unavailable');
      toast.error('Recipe feature temporarily unavailable');
      
      // Temporary fallback data
      const fallbackResult = {
        ingredients: ['Ingredient analysis unavailable'],
        recipes: []
      };

      setDetectedIngredients(fallbackResult.ingredients || []);
      setRecommendations(fallbackResult.recipes || []);
      onStateChange?.('ingredient_analysis', { recipeCount: fallbackResult.recipes?.length || 0 });
      
      toast.success('Photos processed - recipe feature coming soon!');
      
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
                        onClick={() => setSelectedRecipe(recipe)}>
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
                            {recipe.healthScore}%
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
                            <span className="text-sm font-semibold">{recipe.nutrition.calories}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Calories</span>
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

                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedRecipe.name}</CardTitle>
                    <p className="text-muted-foreground mt-1">{selectedRecipe.description}</p>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedRecipe(null)}>
                    <Plus className="h-4 w-4 rotate-45" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recipe details would go here */}
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Recipe details coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};