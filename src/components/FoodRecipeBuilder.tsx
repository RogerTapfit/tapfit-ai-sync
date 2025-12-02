import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Camera, Upload, Loader2, ChefHat, Clock, Users, 
  Sparkles, Star, Heart, Leaf, Flame, Plus, ArrowRight, Minus, Info, AlertTriangle,
  MessageCircle, Send, ChevronDown, ChevronUp, Utensils
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
  calculatedNutrition?: RecipeNutrition;
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
  const [mode, setMode] = useState<'photo' | 'chat'>('photo');
  const [photos, setPhotos] = useState<IngredientPhoto[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);

  const ANALYSIS_STAGES = [
    { progress: 25, text: 'Scanning ingredients...', duration: 2000 },
    { progress: 50, text: 'Identifying items...', duration: 2500 },
    { progress: 75, text: 'Finding recipes...', duration: 2500 },
    { progress: 90, text: 'Preparing suggestions...', duration: 2000 },
    { progress: 100, text: 'Complete!', duration: 500 }
  ];

  React.useEffect(() => {
    if (analyzing) {
      setAnalysisProgress(0);
      setAnalysisStage(ANALYSIS_STAGES[0].text);
      
      let stageIndex = 0;
      const interval = setInterval(() => {
        if (stageIndex < ANALYSIS_STAGES.length - 1) {
          stageIndex++;
          setAnalysisProgress(ANALYSIS_STAGES[stageIndex].progress);
          setAnalysisStage(ANALYSIS_STAGES[stageIndex].text);
        } else {
          clearInterval(interval);
        }
      }, 2400);
      
      return () => clearInterval(interval);
    }
  }, [analyzing]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeRecommendation | null>(null);
  const [adjustedServings, setAdjustedServings] = useState<number>(1);
  const [calculatedNutrition, setCalculatedNutrition] = useState<RecipeNutrition | null>(null);
  const [showNutritionDetails, setShowNutritionDetails] = useState(false);
  
  // Chat mode states
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Recipe-specific chat states
  const [recipeChatMessages, setRecipeChatMessages] = useState<Array<{ 
    role: 'user' | 'assistant', 
    content: string,
    suggestedModification?: any
  }>>([]);
  const [recipeChatInput, setRecipeChatInput] = useState('');
  const [isRecipeChatLoading, setIsRecipeChatLoading] = useState(false);
  const [showRecipeChat, setShowRecipeChat] = useState(false);
  const [modifiedRecipe, setModifiedRecipe] = useState<RecipeRecommendation | null>(null);
  const [modificationHistory, setModificationHistory] = useState<Array<{
    type: string;
    targetIngredient: string;
    newIngredient?: string;
    newAmount?: string;
  }>>([]);
  
  // User profile for running calculation
  const [userProfile, setUserProfile] = useState<{ weight_kg: number; gender: string } | null>(null);

  const generateId = () => crypto.randomUUID();

  // Fetch user profile data for running calculation
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('weight_kg, gender')
          .eq('id', user.id)
          .maybeSingle();
        if (data) setUserProfile(data);
      }
    };
    fetchUserProfile();
  }, []);

  const handlePhotoCapture = async (source: 'camera' | 'gallery') => {
    try {
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
      const photoData = await Promise.all(
        photos.map(async (photo) => ({
          base64: await convertToBase64(photo.file),
          filename: photo.file.name
        }))
      );

      const { data: result, error } = await supabase.functions.invoke('generateRecipes', {
        body: { photos: photoData }
      });

      if (error) throw new Error(error.message || 'Failed to generate recipes');
      if (!result) throw new Error('No recipe data received from AI analysis');

      setDetectedIngredients(result.ingredients || []);
      
      const processedRecipes = (result.recipes || []).map((recipe: RecipeRecommendation) => {
        try {
          const ingredientList = recipe.ingredients.map(ing => `${ing.amount} ${ing.name}`);
          const calculatedNutrition = calculateRecipeNutrition(
            recipe.name,
            1,
            ingredientList,
            recipe.instructions.join('\n')
          );
          
          return {
            ...recipe,
            servings: 1,
            nutrition: {
              calories: Math.round(calculatedNutrition.totals_per_serving.calories_kcal),
              protein: Math.round(calculatedNutrition.totals_per_serving.protein_g * 10) / 10,
              carbs: Math.round(calculatedNutrition.totals_per_serving.carbs_g * 10) / 10,
              fat: Math.round(calculatedNutrition.totals_per_serving.fat_g * 10) / 10,
              fiber: Math.round(calculatedNutrition.totals_per_serving.fiber_g * 10) / 10
            },
            calculatedNutrition
          };
        } catch (error) {
          return {
            ...recipe,
            servings: 1,
            nutrition: { calories: 450, protein: 25, carbs: 40, fat: 18, fiber: 6 }
          };
        }
      });
      
      setRecommendations(processedRecipes);
      onStateChange?.('ingredient_analysis', { recipeCount: processedRecipes.length });
      toast.success(`Found ${result.ingredients?.length || 0} ingredients and ${processedRecipes.length} recipes!`);
      
    } catch (error) {
      console.error('Error analyzing ingredients:', error);
      toast.error('Failed to analyze ingredients. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = { role: 'user' as const, content: chatInput.trim() };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const { data: result, error } = await supabase.functions.invoke('generateRecipesFromChat', {
        body: { 
          messages: newMessages,
          context: { dietaryRestrictions: null, preferredCuisine: null }
        }
      });

      if (error) throw error;

      const aiMessage = { role: 'assistant' as const, content: result.reply };
      setChatMessages([...newMessages, aiMessage]);

      if (result.recipes && result.recipes.length > 0) {
        const processedRecipes = result.recipes.map((recipe: RecipeRecommendation) => {
          try {
            const ingredientList = recipe.ingredients.map(ing => `${ing.amount} ${ing.name}`);
            const calculatedNutrition = calculateRecipeNutrition(
              recipe.name, 1, ingredientList, recipe.instructions.join('\n')
            );
            
            return {
              ...recipe,
              servings: 1,
              nutrition: {
                calories: Math.round(calculatedNutrition.totals_per_serving.calories_kcal),
                protein: Math.round(calculatedNutrition.totals_per_serving.protein_g * 10) / 10,
                carbs: Math.round(calculatedNutrition.totals_per_serving.carbs_g * 10) / 10,
                fat: Math.round(calculatedNutrition.totals_per_serving.fat_g * 10) / 10,
                fiber: Math.round(calculatedNutrition.totals_per_serving.fiber_g * 10) / 10
              },
              calculatedNutrition
            };
          } catch {
            return { ...recipe, servings: 1 };
          }
        });
        
        setRecommendations(prev => [...prev, ...processedRecipes]);
        toast.success(`Generated ${processedRecipes.length} recipe${processedRecipes.length > 1 ? 's' : ''}!`);
      }
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRecipeChatSend = async (message?: string) => {
    if (!selectedRecipe) return;
    
    const messageToSend = message || recipeChatInput.trim();
    if (!messageToSend) return;

    const userMessage = { role: 'user' as const, content: messageToSend };
    const updatedMessages = [...recipeChatMessages, userMessage];
    setRecipeChatMessages(updatedMessages);
    setRecipeChatInput('');
    setIsRecipeChatLoading(true);

    try {
      const currentRecipe = modifiedRecipe || selectedRecipe;
      const { data, error } = await supabase.functions.invoke('generateRecipesFromChat', {
        body: {
          messages: updatedMessages,
          context: {
            mode: 'recipeContext',
            recipe: {
              name: currentRecipe.name,
              ingredients: currentRecipe.ingredients,
              instructions: currentRecipe.instructions,
              tags: currentRecipe.tags,
              servings: adjustedServings,
              description: currentRecipe.description
            }
          }
        }
      });

      if (error) throw error;

      const assistantMessage = {
        role: 'assistant' as const,
        content: data.reply || 'I apologize, I encountered an issue. Please try again.',
        suggestedModification: data.suggestedModification
      };

      setRecipeChatMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error('Recipe chat error:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsRecipeChatLoading(false);
    }
  };

  const applyModification = (modification: any) => {
    if (!selectedRecipe) return;

    const currentRecipe = modifiedRecipe || selectedRecipe;
    let updatedIngredients = [...currentRecipe.ingredients];

    switch (modification.type) {
      case 'substitute':
        updatedIngredients = updatedIngredients.map(ing => 
          ing.name.toLowerCase().includes(modification.targetIngredient?.toLowerCase())
            ? { ...ing, name: modification.newIngredient, amount: modification.newAmount || ing.amount, isModified: true }
            : ing
        );
        break;
      case 'remove':
        updatedIngredients = updatedIngredients.filter(ing => 
          !ing.name.toLowerCase().includes(modification.targetIngredient?.toLowerCase())
        );
        break;
      case 'add':
        updatedIngredients.push({
          name: modification.newIngredient || modification.targetIngredient,
          amount: modification.newAmount || '1',
          available: true,
          isModified: true,
          isNew: true
        } as any);
        break;
      case 'adjust_amount':
        updatedIngredients = updatedIngredients.map(ing =>
          ing.name.toLowerCase().includes(modification.targetIngredient?.toLowerCase())
            ? { ...ing, amount: modification.newAmount || ing.amount, isModified: true }
            : ing
        );
        break;
    }

    const updatedRecipe = {
      ...currentRecipe,
      ingredients: updatedIngredients
    };

    setModifiedRecipe(updatedRecipe);
    setModificationHistory(prev => [...prev, modification]);
    
    toast.success(`Recipe updated: ${modification.type} applied`);
  };

  const resetToOriginal = () => {
    setModifiedRecipe(null);
    setModificationHistory([]);
    toast.success("Recipe reset to original version");
  };

  const calculateRunningMiles = (calories: number, weightKg: number, gender: string): { 
    miles: number; 
    weightLbs: number;
    caloriesPerMile: number;
  } => {
    const weightLbs = weightKg * 2.20462; // kg to lbs
    
    // Gender-adjusted calorie burn factor per mile per pound
    // Male: ~0.63 cal/lb/mile, Female: ~0.60 cal/lb/mile
    const calorieBurnFactor = gender === 'male' ? 0.63 : 0.60;
    
    const caloriesPerMile = weightLbs * calorieBurnFactor;
    const miles = calories / caloriesPerMile;
    
    return {
      miles: parseFloat(miles.toFixed(1)),
      weightLbs: Math.round(weightLbs),
      caloriesPerMile: Math.round(caloriesPerMile)
    };
  };

  const handleRecipeQuickAction = (action: string) => {
    const questions = {
      'substitution': "What ingredient substitutions can I make?",
      'vegan': "How can I make this recipe vegan?",
      'faster': "How can I make this recipe faster?",
      'scaling': "Tips for scaling this recipe?"
    };
    handleRecipeChatSend(questions[action as keyof typeof questions]);
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
    return 'F';
  };

  const parseAmount = (amountStr: string): { value: number; unit: string; original: string } => {
    const fractionMap: { [key: string]: number} = {
      '1/4': 0.25, '1/3': 0.33, '1/2': 0.5, '2/3': 0.67, '3/4': 0.75,
      '¼': 0.25, '⅓': 0.33, '½': 0.5, '⅔': 0.67, '¾': 0.75
    };

    const nonScalable = ['to taste', 'pinch', 'dash', 'handful', 'splash'];
    if (nonScalable.some(term => amountStr.toLowerCase().includes(term))) {
      return { value: 0, unit: amountStr, original: amountStr };
    }

    const match = amountStr.match(/^(\d+(?:\.\d+)?|\d*\s*[¼½¾⅓⅔]|\d+\/\d+)\s*(.*)$/);
    if (!match) return { value: 0, unit: amountStr, original: amountStr };

    let valueStr = match[1].trim();
    const unit = match[2].trim();

    if (fractionMap[valueStr]) return { value: fractionMap[valueStr], unit, original: amountStr };

    const mixedMatch = valueStr.match(/^(\d+)\s+(\d+\/\d+)$/);
    if (mixedMatch) {
      const whole = parseFloat(mixedMatch[1]);
      const [num, den] = mixedMatch[2].split('/').map(Number);
      return { value: whole + (num / den), unit, original: amountStr };
    }

    if (valueStr.includes('/')) {
      const [num, den] = valueStr.split('/').map(Number);
      return { value: num / den, unit, original: amountStr };
    }

    return { value: parseFloat(valueStr) || 0, unit, original: amountStr };
  };

  const scaleAmount = (amountStr: string, multiplier: number): string => {
    const parsed = parseAmount(amountStr);
    if (parsed.value === 0) return parsed.original;
    const scaledValue = parsed.value * multiplier;
    
    if (scaledValue < 0.125) return `pinch ${parsed.unit}`.trim();
    if (scaledValue === 0.25) return `¼ ${parsed.unit}`.trim();
    if (scaledValue === 0.33) return `⅓ ${parsed.unit}`.trim();
    if (scaledValue === 0.5) return `½ ${parsed.unit}`.trim();
    if (scaledValue === 0.67) return `⅔ ${parsed.unit}`.trim();
    if (scaledValue === 0.75) return `¾ ${parsed.unit}`.trim();
    
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
          <div className="flex justify-center gap-2 mb-4">
            <Button variant={mode === 'photo' ? 'default' : 'outline'} onClick={() => setMode('photo')}>
              <Camera className="h-4 w-4 mr-2" />
              Photo Mode
            </Button>
            <Button variant={mode === 'chat' ? 'default' : 'outline'} onClick={() => setMode('chat')}>
              <ChefHat className="h-4 w-4 mr-2" />
              Chat Mode
            </Button>
          </div>
          
          <CardTitle className="flex items-center justify-center gap-3 text-2xl">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <ChefHat className="h-8 w-8 text-primary" />
            </motion.div>
            Smart Recipe Builder
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </motion.div>
          </CardTitle>
          <p className="text-muted-foreground">
            {mode === 'photo' 
              ? 'Snap photos of your ingredients and discover healthy recipes'
              : 'Chat with our AI chef to discover perfect recipes for your needs'
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {mode === 'photo' ? (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Capture Your Ingredients
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => handlePhotoCapture('camera')} className="flex items-center gap-2 h-12">
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
                <Button variant="outline" onClick={() => handlePhotoCapture('gallery')} className="flex items-center gap-2 h-12">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
              </div>

              <AnimatePresence>
                {photos.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {photos.map((photo) => (
                      <motion.div key={photo.id} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="relative group">
                        <img src={photo.dataUrl} alt="Ingredient" className="w-full h-full aspect-square object-cover rounded-lg border" />
                        <Button variant="outline" size="sm" onClick={() => removePhoto(photo.id)} 
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 bg-destructive">
                          <Plus className="h-3 w-3 rotate-45" />
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button onClick={analyzeIngredientsAndGetRecipes} disabled={photos.length === 0 || analyzing} 
                      className="w-full glow-button" size="lg">
                {!analyzing ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Find Recipe Magic ✨
                  </>
                ) : null}
              </Button>

              {analyzing && (
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardContent className="py-5">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div>
                          <h3 className="font-semibold text-lg">Analyzing Ingredients</h3>
                          <p className="text-sm text-muted-foreground">{analysisStage}</p>
                        </div>
                      </div>
                      <Progress value={analysisProgress} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-primary font-medium">{analysisStage}</span>
                        <span className="text-muted-foreground">{analysisProgress}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-4 bg-muted/20">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <ChefHat className="h-12 w-12 mx-auto mb-3 text-primary opacity-50" />
                    <p className="text-muted-foreground mb-4">Hi! I'm your personal chef assistant. Tell me what you'd like to cook!</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["Quick dinner ideas", "Healthy breakfast recipes", "Vegetarian options", "High protein meals"].map((q) => (
                        <Button key={q} size="sm" variant="outline" onClick={() => setChatInput(q)} className="text-xs">{q}</Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))
                )}
                {isChatLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Chef is thinking...</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder="Describe what you'd like to cook..."
                  disabled={isChatLoading}
                  className="flex-1 px-4 py-2 rounded-lg border bg-background"
                />
                <Button onClick={handleChatSend} disabled={!chatInput.trim() || isChatLoading} size="lg" className="glow-button">
                  {isChatLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          )}
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
                          setAdjustedServings(1);
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
                          e.stopPropagation();
                          setSelectedRecipe(recipe);
                          setAdjustedServings(1);
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

                <div>
                  {modificationHistory.length > 0 && (
                    <div className="mb-4 bg-accent/50 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">
                          {modificationHistory.length} modification{modificationHistory.length !== 1 ? 's' : ''} applied
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetToOriginal}
                        className="h-8 text-xs"
                      >
                        Reset to Original
                      </Button>
                    </div>
                  )}
                  
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-500" />
                    Ingredients
                  </h3>
                  <div className="space-y-2">
                    {(modifiedRecipe || selectedRecipe).ingredients.map((ingredient: any, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          ingredient.isModified 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${ingredient.available ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="font-medium">{ingredient.name}</span>
                          {ingredient.isModified && (
                            <Badge variant="secondary" className="text-xs h-5">
                              {ingredient.isNew ? 'Added' : 'Modified'}
                            </Badge>
                          )}
                        </div>
                         <span className="text-sm text-muted-foreground font-medium">
                           {scaleAmount(ingredient.amount, servingMultiplier)}
                         </span>
                      </div>
                    ))}
                  </div>
                </div>

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
                      
                      <AnimatePresence>
                        {showNutritionDetails && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-4"
                          >
                            <div className="p-3 bg-muted/20 rounded-lg">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                <span>Confidence: {Math.round(calculatedNutrition.confidence * 100)}%</span>
                                <span>Powered by USDA FoodData Central</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Values are estimates based on USDA data. See breakdown below for assumptions.
                              </p>
                            </div>
                            
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

                {/* Running Equivalent Section - Always show with defaults if needed */}
                {(() => {
                  const totalCalories = calculatedNutrition 
                    ? calculatedNutrition.totals_per_serving.calories_kcal * servingMultiplier
                    : (modifiedRecipe || selectedRecipe).nutrition.calories * servingMultiplier;
                  
                  // Use profile data if available, otherwise use defaults
                  const effectiveWeight = userProfile?.weight_kg || 70; // 70kg = 154lbs default
                  const effectiveGender = userProfile?.gender || 'other';
                  const usingDefaults = !userProfile?.weight_kg;
                  
                  const runningData = calculateRunningMiles(totalCalories, effectiveWeight, effectiveGender);
                  
                  return (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <span className="text-2xl">🏃</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">Running Equivalent</h4>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {runningData.miles} miles
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            To burn off these {Math.round(totalCalories)} calories
                          </p>
                          <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-muted-foreground">
                              📊 {usingDefaults ? 'Estimated for' : 'Based on your profile:'} {runningData.weightLbs} lbs, {effectiveGender}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              (~{runningData.caloriesPerMile} cal/mile at moderate pace)
                            </p>
                          </div>
                          {usingDefaults && (
                            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded">
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                ⚠️ Using default weight (154 lbs). Complete your profile for personalized calculations.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Recipe-specific chat assistant */}
                <div className="mt-6 border-t pt-6">
                  <button
                    onClick={() => setShowRecipeChat(!showRecipeChat)}
                    className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors mb-4 w-full"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Ask About This Recipe
                    {showRecipeChat ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                  </button>

                  <Collapsible open={showRecipeChat}>
                    <CollapsibleContent>
                      <div className="space-y-4">
                        {/* Quick action buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRecipeQuickAction('substitution')}
                            disabled={isRecipeChatLoading}
                          >
                            🔄 Substitutions
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRecipeQuickAction('vegan')}
                            disabled={isRecipeChatLoading}
                          >
                            🌱 Make Vegan
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRecipeQuickAction('faster')}
                            disabled={isRecipeChatLoading}
                          >
                            ⚡ Make Faster
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRecipeQuickAction('scaling')}
                            disabled={isRecipeChatLoading}
                          >
                            🍽️ Scaling Tips
                          </Button>
                        </div>

                        {/* Chat messages */}
                        <ScrollArea className="h-[300px] rounded-md border p-4">
                          <div className="space-y-4">
                            {recipeChatMessages.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-8">
                                Ask me anything about this recipe! I can help with substitutions, techniques, modifications, and more.
                              </p>
                             ) : (
                              recipeChatMessages.map((msg, idx) => (
                                <div
                                  key={idx}
                                  className="flex flex-col gap-2"
                                >
                                  <div
                                    className={`flex gap-3 ${
                                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                                  >
                                    <div
                                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                                        msg.role === 'user'
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted text-foreground'
                                      }`}
                                    >
                                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                  </div>
                                  {msg.suggestedModification && msg.role === 'assistant' && (
                                    <div className="flex justify-start">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs gap-1"
                                        onClick={() => applyModification(msg.suggestedModification)}
                                      >
                                        <Sparkles className="w-3 h-3" />
                                        Apply this change to recipe
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                            {isRecipeChatLoading && (
                              <div className="flex gap-3 justify-start">
                                <div className="rounded-lg px-4 py-2 bg-muted">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                              </div>
                            )}
                          </div>
                        </ScrollArea>

                        {/* Chat input */}
                        <div className="flex gap-2">
                          <Input
                            value={recipeChatInput}
                            onChange={(e) => setRecipeChatInput(e.target.value)}
                            placeholder="Ask a question about this recipe..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleRecipeChatSend();
                              }
                            }}
                            disabled={isRecipeChatLoading}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => handleRecipeChatSend()}
                            disabled={isRecipeChatLoading || !recipeChatInput.trim()}
                            size="icon"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};
