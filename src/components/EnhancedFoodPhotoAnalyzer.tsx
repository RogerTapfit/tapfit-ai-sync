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
  Lightbulb, Target, MessageCircle, Package, Sparkles 
} from 'lucide-react';
import { useNutrition, FoodItem } from '@/hooks/useNutrition';
import { toast } from 'sonner';
import { calculateHealthGrade, getGradeColor, getGradeBgColor } from '@/utils/healthGrading';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { PhotoManager } from './PhotoManager';
import { AnimatedCounter } from './AnimatedCounter';
import { FoodChatInterface, ChatMessage } from './FoodChatInterface';
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
}

export const EnhancedFoodPhotoAnalyzer: React.FC<EnhancedFoodPhotoAnalyzerProps> = ({ onDataChange }) => {
  const { analyzeFoodImage, saveFoodEntry, loading } = useNutrition();
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [mealType, setMealType] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [editingItems, setEditingItems] = useState<FoodItem[]>([]);
  const [notes, setNotes] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

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
        const newFile = new File([blob], `${source}-photo.jpg`, { type: 'image/jpeg' });
        
        const newPhoto: PhotoData = {
          id: generateId(),
          dataUrl: image.dataUrl,
          file: newFile,
          type: 'main_dish',
          analyzed: false
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
    const updated = [...editingItems];
    const baseItem = updated[index];
    
    // Update all nutritional values proportionally
    updated[index] = {
      ...baseItem,
      calories: Math.round(baseItem.calories * multiplier),
      protein: Math.round(baseItem.protein * multiplier * 10) / 10,
      carbs: Math.round(baseItem.carbs * multiplier * 10) / 10,
      fat: Math.round(baseItem.fat * multiplier * 10) / 10,
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
    if (!analysisResult || !mealType) return;

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
      setNotes('');
      setChatMessages([]);
      setChatOpen(false);
      
      onDataChange?.();
      toast.success('Food entry saved successfully!');
    } catch (error) {
      console.error('Error saving food entry:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enhanced AI Food Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo Capture */}
          <div className="space-y-4">
            <Label>Food Photos</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePhotoCapture('camera')}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePhotoCapture('gallery')}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePhotoCapture('gallery')}
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Nutrition Label
              </Button>
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
          <Button
            onClick={handleAnalyzeImages}
            disabled={photos.length === 0 || !mealType || analyzing || loading}
            className="w-full"
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing {photos.length} Photo{photos.length > 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze {photos.length || 0} Photo{photos.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
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
                
                <div className="space-y-4">
                  {editingItems.map((item, index) => (
                    <Card key={index} className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{item.name}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFoodItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Quantity Counter */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <AnimatedCounter
                            value={1}
                            onChange={(multiplier) => updateFoodItemQuantity(index, multiplier)}
                            min={0.5}
                            max={10}
                            step={0.5}
                            label="Quantity"
                            unit="×"
                            presets={[
                              { label: "Half", value: 0.5 },
                              { label: "Normal", value: 1 },
                              { label: "Large", value: 1.5 },
                              { label: "Extra Large", value: 2 }
                            ]}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Calories</p>
                            <p className="text-lg font-bold">{item.calories}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Protein</p>
                            <p className="text-lg font-bold">{item.protein}g</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Manual Edit Fields */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <Label className="text-xs">Calories</Label>
                          <Input
                            type="number"
                            value={item.calories}
                            onChange={(e) => updateFoodItem(index, 'calories', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Protein (g)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.protein}
                            onChange={(e) => updateFoodItem(index, 'protein', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Carbs (g)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.carbs}
                            onChange={(e) => updateFoodItem(index, 'carbs', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fat (g)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.fat}
                            onChange={(e) => updateFoodItem(index, 'fat', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Summary Totals */}
              {editingItems.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Meal Totals</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Calories</p>
                        <p className="text-2xl font-bold text-primary">
                          {editingItems.reduce((sum, item) => sum + item.calories, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Protein</p>
                        <p className="text-2xl font-bold text-primary">
                          {editingItems.reduce((sum, item) => sum + item.protein, 0).toFixed(1)}g
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Carbs</p>
                        <p className="text-2xl font-bold text-primary">
                          {editingItems.reduce((sum, item) => sum + item.carbs, 0).toFixed(1)}g
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fat</p>
                        <p className="text-2xl font-bold text-primary">
                          {editingItems.reduce((sum, item) => sum + item.fat, 0).toFixed(1)}g
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
              <Button onClick={handleSaveFoodEntry} className="w-full" size="lg">
                <Save className="h-4 w-4 mr-2" />
                Save to Food Log
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};