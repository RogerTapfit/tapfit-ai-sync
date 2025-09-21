import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, Upload, Loader2, Check, Edit3, Save, X, Award, CheckCircle2, XCircle, 
  Lightbulb, Target, MessageCircle, Package, Sparkles, QrCode 
} from 'lucide-react';
import { useNutrition, FoodItem } from '@/hooks/useNutrition';
import { toast } from 'sonner';
import { calculateHealthGrade, getGradeColor, getGradeBgColor } from '@/utils/healthGrading';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { PhotoManager } from './PhotoManager';
import { AnimatedCounter } from './AnimatedCounter';
import { FoodChatInterface, ChatMessage } from './FoodChatInterface';
import { BarcodeScanner } from './BarcodeScanner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export interface PhotoData {
  id: string;
  dataUrl: string;
  file: File;
  type: 'main_dish' | 'nutrition_label' | 'ingredients' | 'angle_view';
  analyzed: boolean;
}

interface EnhancedFoodPhotoAnalyzerProps {
  onDataChange?: () => void;
  onStateChange?: (state: 'initial' | 'photos_added' | 'analyzing' | 'results', data?: { photoCount?: number; hasResults?: boolean }) => void;
}

export const EnhancedFoodPhotoAnalyzer: React.FC<EnhancedFoodPhotoAnalyzerProps> = ({ onDataChange, onStateChange }) => {
  const { analyzeFoodImage, saveFoodEntry, loading } = useNutrition();
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [mealType, setMealType] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [editingItems, setEditingItems] = useState<FoodItem[]>([]);
  const [portionMultipliers, setPortionMultipliers] = useState<{ [key: number]: number }>({});
  const [notes, setNotes] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { value: 'lunch', label: 'Lunch', icon: '☀️' },
    { value: 'dinner', label: 'Dinner', icon: '🌙' },
    { value: 'snack', label: 'Snack', icon: '🍎' }
  ];

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
                const newPhoto: PhotoData = {
                  id: generateId(),
                  dataUrl: event.target?.result as string,
                  file: selectedFile,
                  type: 'main_dish',
                  analyzed: false
                };
        setPhotos(prev => [...prev, newPhoto]);
        onStateChange?.('photos_added', { photoCount: photos.length + 1 });
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
        const newFile = new File([blob], `${source}-photo.jpg`, { type: 'image/jpeg' });
        
        const newPhoto: PhotoData = {
          id: generateId(),
          dataUrl: image.dataUrl,
          file: newFile,
          type: 'main_dish',
          analyzed: false
        };
        
        setPhotos(prev => [...prev, newPhoto]);
        onStateChange?.('photos_added', { photoCount: photos.length + 1 });
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Failed to capture photo. Please try again.');
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const setPhotoType = (id: string, type: PhotoData['type']) => {
    setPhotos(prev => 
      prev.map(photo => 
        photo.id === id ? { ...photo, type } : photo
      )
    );
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

  const handleAnalyzeImages = async () => {
    if (photos.length === 0 || !mealType) {
      toast.error('Please add at least one photo and select meal type');
      return;
    }

    setAnalyzing(true);
    onStateChange?.('analyzing', { photoCount: photos.length });
    try {
      // Convert all photos to base64
      const photoData = await Promise.all(
        photos.map(async (photo) => ({
          base64: await convertToBase64(photo.file),
          type: photo.type
        }))
      );

      // Enhanced analysis with multiple images
      const result = await analyzeFoodImage(
        JSON.stringify(photoData), 
        mealType
      );
      
      setAnalysisResult(result);
      setEditingItems(result.food_items || []);
      onStateChange?.('results', { photoCount: photos.length, hasResults: true });
      
      // Initialize portion multipliers
      const initialMultipliers: { [key: number]: number } = {};
      (result.food_items || []).forEach((_: any, index: number) => {
        initialMultipliers[index] = 1;
      });
      setPortionMultipliers(initialMultipliers);
      
      // Mark photos as analyzed
      setPhotos(prev => 
        prev.map(photo => ({ ...photo, analyzed: true }))
      );

      // Start AI conversation if there are questions
      if (result.clarifying_questions?.length > 0) {
        const aiMessage: ChatMessage = {
          id: generateId(),
          type: 'ai',
          content: "I've analyzed your photos! I have a few questions to make the nutrition data more accurate:",
          timestamp: new Date(),
          suggestions: result.clarifying_questions
        };
        setChatMessages([aiMessage]);
        setChatOpen(true);
      }
      
    } catch (error) {
      console.error('Error analyzing images:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChatMessage = async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatLoading(true);

    try {
      // Process the message and update nutrition data using Supabase edge function
      const { data: result, error } = await supabase.functions.invoke('process-chat-message', {
        body: {
          message,
          currentAnalysis: analysisResult,
          foodItems: editingItems
        }
      });

      if (error) {
        throw error;
      }
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content: result.response,
        timestamp: new Date(),
        suggestions: result.followUpQuestions
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
      
      // Update food items if changes were made
      if (result.updatedFoodItems) {
        setEditingItems(result.updatedFoodItems);
      }
      
    } catch (error) {
      console.error('Error processing chat message:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content: "I'm having trouble processing that. Could you try rephrasing your question?",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const updateFoodItemQuantity = (index: number, multiplier: number) => {
    // Update the multiplier state
    setPortionMultipliers(prev => ({
      ...prev,
      [index]: multiplier
    }));

    // Get the original values (base multiplier = 1)
    const originalMultiplier = portionMultipliers[index] || 1;
    const currentItem = editingItems[index];
    
    // Calculate original values by dividing by current multiplier
    const originalCalories = Math.round(currentItem.calories / originalMultiplier);
    const originalProtein = Math.round((currentItem.protein / originalMultiplier) * 10) / 10;
    const originalCarbs = Math.round((currentItem.carbs / originalMultiplier) * 10) / 10;
    const originalFat = Math.round((currentItem.fat / originalMultiplier) * 10) / 10;
    
    // Apply new multiplier to original values
    const updated = [...editingItems];
    updated[index] = {
      ...currentItem,
      calories: Math.round(originalCalories * multiplier),
      protein: Math.round(originalProtein * multiplier * 10) / 10,
      carbs: Math.round(originalCarbs * multiplier * 10) / 10,
      fat: Math.round(originalFat * multiplier * 10) / 10,
    };
    
    setEditingItems(updated);
  };

  const updateFoodItem = (index: number, field: keyof FoodItem, value: any) => {
    const updated = [...editingItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditingItems(updated);
  };

  const removeFoodItem = (index: number) => {
    setEditingItems(items => items.filter((_, i) => i !== index));
  };

  const addFoodItem = () => {
    setEditingItems([...editingItems, {
      name: '',
      quantity: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      confidence: 1.0
    }]);
  };

  const handleSaveFoodEntry = async () => {
    if (!analysisResult || !mealType) {
      toast.error('Please analyze photos and select a meal type first');
      return;
    }

    if (editingItems.length === 0) {
      toast.error('No food items to save');
      return;
    }

    if (isSaving) return; // Prevent multiple submissions

    setIsSaving(true);

    try {
      const totalCalories = editingItems.reduce((sum, item) => sum + item.calories, 0);
      const totalProtein = editingItems.reduce((sum, item) => sum + item.protein, 0);
      const totalCarbs = editingItems.reduce((sum, item) => sum + item.carbs, 0);
      const totalFat = editingItems.reduce((sum, item) => sum + item.fat, 0);

      await saveFoodEntry({
        meal_type: mealType as any,
        food_items: editingItems,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        photo_url: photos[0]?.dataUrl,
        ai_analyzed: true,
        user_confirmed: true,
        notes: notes,
        logged_date: new Date().toISOString().split('T')[0]
      });

      // Reset form
      setPhotos([]);
      setMealType('');
      setAnalysisResult(null);
      setEditingItems([]);
      setPortionMultipliers({});
      setNotes('');
      setChatMessages([]);
      setChatOpen(false);
      
      onDataChange?.();
      toast.success('Food entry saved successfully!');
    } catch (error: any) {
      console.error('Error saving food entry:', error);
      
      // Provide specific error messages based on error type
      if (error?.message?.includes('Failed to fetch')) {
        toast.error('Network error - please check your connection and try again');
      } else if (error?.message?.includes('connection termination')) {
        toast.error('Connection lost - please try again in a moment');
      } else if (error?.message?.includes('503')) {
        toast.error('Service temporarily unavailable - please try again');
      } else {
        toast.error('Failed to save food entry - please try again');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBarcodeProduct = (foodItem: FoodItem) => {
    setEditingItems([foodItem]);
    setAnalysisResult({
      food_items: [foodItem],
      total_calories: foodItem.calories,
      total_protein: foodItem.protein,
      total_carbs: foodItem.carbs,
      total_fat: foodItem.fat,
      confidence: foodItem.confidence,
      clarifying_questions: []
    });
    onStateChange?.('results', { photoCount: 0, hasResults: true });
  };

  return (
    <div className="space-y-8">
      <Card className="glow-card border-gradient overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
          <CardTitle className="flex items-center justify-center gap-3 text-2xl relative z-10">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { repeat: Infinity, duration: 8, ease: "linear" },
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
              }}
            >
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>
            Enhanced AI Food Analyzer
            <motion.div
              animate={{ 
                y: [0, -5, 0],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeInOut"
              }}
            >
              <Award className="h-6 w-6 text-yellow-500" />
            </motion.div>
          </CardTitle>
          <p className="text-center text-muted-foreground relative z-10">
            Powered by advanced AI vision - Get detailed nutritional insights in seconds ⚡
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo Capture */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold flex items-center justify-center gap-2 mb-2">
                <Camera className="h-6 w-6 text-primary" />
                Capture Your Food
              </h3>
              <p className="text-muted-foreground">
                Take multiple photos for the most accurate nutritional analysis
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePhotoCapture('camera')}
                  className="w-full h-16 sm:h-20 flex flex-col items-center gap-2 glow-hover border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 touch-manipulation"
                >
                  <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <span className="font-semibold text-sm sm:text-base">Take Photo</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">Use camera</span>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePhotoCapture('gallery')}
                  className="w-full h-16 sm:h-20 flex flex-col items-center gap-2 glow-hover border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5 transition-all duration-300 touch-manipulation"
                >
                  <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                  <span className="font-semibold text-sm sm:text-base">Upload Photo</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">From gallery</span>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="sm:col-span-2 lg:col-span-1"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBarcodeScannerOpen(true)}
                  className="w-full h-16 sm:h-20 flex flex-col items-center gap-2 glow-hover border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300 touch-manipulation"
                >
                  <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                  <span className="font-semibold text-sm sm:text-base">Scan Barcode</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">Live scanner</span>
                </Button>
              </motion.div>
            </div>

            <PhotoManager
              photos={photos}
              onRemovePhoto={removePhoto}
              onSetPhotoType={setPhotoType}
            />
          </div>

          {/* Meal Type Selection */}
          <div className="space-y-3">
            <Label>Meal Type</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                {mealTypes.map((meal) => (
                  <SelectItem key={meal.value} value={meal.value}>
                    <span className="flex items-center gap-2">
                      <span>{meal.icon}</span>
                      {meal.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Analysis Tips Card */}
          {photos.length > 0 && mealType && (
            <Card className="bg-info/5 border-info/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-info/10">
                      <Target className="h-5 w-5 text-info" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-info flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Multi-Photo Analysis Tips
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      For best results, take photos of different aspects of your meal:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                      <div className="text-xs space-y-1">
                        <p className="font-medium text-foreground">Photo Types:</p>
                        <p className="text-muted-foreground">• Main dish from above</p>
                        <p className="text-muted-foreground">• Side view for portions</p>
                        <p className="text-muted-foreground">• Nutrition labels on packages</p>
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="font-medium text-foreground">Brand Recognition:</p>
                        <p className="text-muted-foreground">• Package fronts and backs</p>
                        <p className="text-muted-foreground">• Ingredient lists</p>
                        <p className="text-muted-foreground">• Barcode area</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analyze Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleAnalyzeImages}
              disabled={photos.length === 0 || !mealType || analyzing || loading}
              className="w-full glow-button bg-gradient-to-r from-primary to-primary/80 border-0 text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  <span className="animate-pulse">
                    Analyzing {photos.length} Photo{photos.length > 1 ? 's' : ''}...
                  </span>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <Sparkles className="h-5 w-5 mr-3" />
                  </motion.div>
                  <span className="flex items-center gap-2">
                    Analyze {photos.length || 0} Photo{photos.length !== 1 ? 's' : ''} with AI Magic
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      ✨
                    </motion.span>
                  </span>
                </>
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      {analysisResult && (
        <FoodChatInterface
          messages={chatMessages}
          onSendMessage={handleChatMessage}
          onSuggestionClick={handleChatMessage}
          isLoading={chatLoading}
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Health Grade Analysis */}
              {editingItems.length > 0 && (() => {
                const totalCalories = editingItems.reduce((sum, item) => sum + item.calories, 0);
                const totalProtein = editingItems.reduce((sum, item) => sum + item.protein, 0);
                const totalCarbs = editingItems.reduce((sum, item) => sum + item.carbs, 0);
                const totalFat = editingItems.reduce((sum, item) => sum + item.fat, 0);
                const gradeResult = calculateHealthGrade(editingItems, totalCalories, totalProtein, totalCarbs, totalFat);
                
                return (
                  <Card className="bg-muted/30 border-2">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Health Grade</span>
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 ${getGradeBgColor(gradeResult.grade)}`}>
                          <span className={`text-lg font-bold ${getGradeColor(gradeResult.grade)}`}>
                            {gradeResult.grade}
                          </span>
                        </div>
                      </div>
                      
                      {gradeResult.pros.length > 0 && (
                        <div>
                          <h5 className="font-medium text-stats-exercises mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            What's Good
                          </h5>
                          <ul className="space-y-1">
                            {gradeResult.pros.map((pro, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 text-stats-exercises mt-1 flex-shrink-0" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {gradeResult.cons.length > 0 && (
                        <div>
                          <h5 className="font-medium text-destructive mb-2 flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                            Areas for Improvement
                          </h5>
                          <ul className="space-y-1">
                            {gradeResult.cons.map((con, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <XCircle className="h-3 w-3 text-destructive mt-1 flex-shrink-0" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Food Items Editor with Animated Counters */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Detected Food Items</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addFoodItem}
                  >
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {editingItems.map((item, index) => (
                    <Card key={index} className="overflow-hidden border-muted/40 bg-gradient-to-br from-background to-muted/10 hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-4 bg-gradient-to-r from-muted/20 to-muted/10 border-b border-muted/30">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xl text-foreground">{item.name}</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFoodItem(index)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-6 space-y-6">
                        {/* Quantity Slider Section */}
                         <div className="bg-muted/20 rounded-xl p-5 border border-muted/30">
                           <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 block">Portion Control</Label>
                           <AnimatedCounter
                             value={portionMultipliers[index] || 1}
                             onChange={(multiplier) => updateFoodItemQuantity(index, multiplier)}
                             min={0.25}
                             max={5}
                             step={0.25}
                             label=""
                             unit="×"
                             presets={[
                               { label: "Quarter", value: 0.25 },
                               { label: "Half", value: 0.5 },
                               { label: "Normal", value: 1 },
                               { label: "Large", value: 1.5 },
                               { label: "XL", value: 2 }
                             ]}
                           />
                         </div>
                        
                         {/* Primary Nutrition Display */}
                         <div className="space-y-3">
                           <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Key Nutrition</Label>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="relative overflow-hidden rounded-2xl bg-card border-2 border-border p-5 group hover:scale-105 transition-transform duration-200 hover:shadow-lg">
                               <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full -translate-y-10 translate-x-10"></div>
                               <div className="relative">
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Calories</p>
                                 <p className="text-4xl font-black text-red-500 leading-none">{item.calories}</p>
                                 <p className="text-xs text-muted-foreground mt-1 font-medium">kcal</p>
                               </div>
                             </div>
                             <div className="relative overflow-hidden rounded-2xl bg-card border-2 border-border p-5 group hover:scale-105 transition-transform duration-200 hover:shadow-lg">
                               <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-10 translate-x-10"></div>
                               <div className="relative">
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Protein</p>
                                 <p className="text-4xl font-black text-emerald-500 leading-none">{item.protein}<span className="text-2xl font-bold text-emerald-400">g</span></p>
                                 <p className="text-xs text-muted-foreground mt-1 font-medium">grams</p>
                               </div>
                             </div>
                           </div>
                         </div>

                         {/* Secondary Nutrition */}
                         <div className="grid grid-cols-2 gap-4">
                           <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow hover:scale-105 duration-200">
                             <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Carbs</p>
                             <p className="text-2xl font-black text-orange-500">{item.carbs}<span className="text-lg font-semibold text-orange-400">g</span></p>
                           </div>
                           <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow hover:scale-105 duration-200">
                             <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Fat</p>
                             <p className="text-2xl font-black text-purple-500">{item.fat}<span className="text-lg font-semibold text-purple-400">g</span></p>
                           </div>
                         </div>
                        
                        {/* Advanced Editing Section */}
                        <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-5 border border-muted/40">
                          <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 block flex items-center gap-2">
                            <Edit3 className="h-4 w-4" />
                            Manual Adjustments
                          </Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Calories</Label>
                              <Input
                                type="number"
                                value={item.calories}
                                onChange={(e) => updateFoodItem(index, 'calories', parseInt(e.target.value) || 0)}
                                className="h-10 text-sm bg-background/70 border-muted/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Protein</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={item.protein}
                                onChange={(e) => updateFoodItem(index, 'protein', parseFloat(e.target.value) || 0)}
                                className="h-10 text-sm bg-background/70 border-muted/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Carbs</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={item.carbs}
                                onChange={(e) => updateFoodItem(index, 'carbs', parseFloat(e.target.value) || 0)}
                                className="h-10 text-sm bg-background/70 border-muted/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Fat</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={item.fat}
                                onChange={(e) => updateFoodItem(index, 'fat', parseFloat(e.target.value) || 0)}
                                className="h-10 text-sm bg-background/70 border-muted/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Summary Totals */}
              {editingItems.length > 0 && (
                <Card className="bg-muted/30 border-2 border-muted/40">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-4 text-lg">Meal Totals</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:scale-105 duration-200">
                        <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide mb-2">Calories</p>
                        <p className="text-3xl font-black text-red-500">
                          {editingItems.reduce((sum, item) => sum + item.calories, 0)}
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:scale-105 duration-200">
                        <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide mb-2">Protein</p>
                        <p className="text-3xl font-black text-emerald-500">
                          {editingItems.reduce((sum, item) => sum + item.protein, 0).toFixed(1)}<span className="text-xl font-bold text-emerald-400">g</span>
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:scale-105 duration-200">
                        <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide mb-2">Carbs</p>
                        <p className="text-3xl font-black text-orange-500">
                          {editingItems.reduce((sum, item) => sum + item.carbs, 0).toFixed(1)}<span className="text-xl font-bold text-orange-400">g</span>
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:scale-105 duration-200">
                        <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide mb-2">Fat</p>
                        <p className="text-3xl font-black text-purple-500">
                          {editingItems.reduce((sum, item) => sum + item.fat, 0).toFixed(1)}<span className="text-xl font-bold text-purple-400">g</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add specific details to improve accuracy (e.g., 'vegan cheese', 'grilled not fried', 'whole wheat bread', 'plant-based milk')..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Specific details about ingredients and preparation methods help the AI provide more accurate nutritional calculations.
                </p>
              </div>

              {/* Suggestions */}
              {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                <div className="space-y-2">
                  <Label>AI Suggestions</Label>
                  <Card className="bg-info/5 border-info/20">
                    <CardContent className="p-4">
                      <ul className="space-y-2">
                        {analysisResult.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Save Button */}
              <Button 
                onClick={handleSaveFoodEntry} 
                className="w-full" 
                size="lg"
                disabled={isSaving || !analysisResult || !mealType || editingItems.length === 0}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save to Food Log
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <BarcodeScanner
        isOpen={barcodeScannerOpen}
        onClose={() => setBarcodeScannerOpen(false)}
        onProductFound={handleBarcodeProduct}
      />
    </div>
  );
};