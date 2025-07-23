import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Loader2, Check, Edit3, Save, X } from 'lucide-react';
import { useNutrition, FoodItem } from '@/hooks/useNutrition';
import { toast } from 'sonner';

const FoodPhotoAnalyzer = () => {
  const { analyzeFoodImage, saveFoodEntry, loading } = useNutrition();
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mealType, setMealType] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [editingItems, setEditingItems] = useState<FoodItem[]>([]);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { value: 'lunch', label: 'Lunch', icon: '☀️' },
    { value: 'dinner', label: 'Dinner', icon: '🌙' },
    { value: 'snack', label: 'Snack', icon: '🍎' }
  ];

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setImageFile(file);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile || !mealType) {
      toast.error('Please select an image and meal type');
      return;
    }

    setAnalyzing(true);
    try {
      const base64Image = await convertToBase64(imageFile);
      const result = await analyzeFoodImage(base64Image, mealType);
      setAnalysisResult(result);
      setEditingItems(result.food_items || []);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setAnalyzing(false);
    }
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
        photo_url: image,
        ai_analyzed: true,
        user_confirmed: true,
        notes: notes,
        logged_date: new Date().toISOString().split('T')[0]
      });

      // Reset form
      setImage(null);
      setImageFile(null);
      setMealType('');
      setAnalysisResult(null);
      setEditingItems([]);
      setNotes('');
      
    } catch (error) {
      console.error('Error saving food entry:', error);
    }
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            AI Food Photo Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Capture */}
          <div className="space-y-4">
            <Label>Food Photo</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Photo
              </Button>
            </div>
            
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageCapture}
              className="hidden"
            />

            {image && (
              <div className="relative">
                <img 
                  src={image} 
                  alt="Food to analyze" 
                  className="w-full max-w-md mx-auto rounded-lg shadow-md"
                />
              </div>
            )}
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

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyzeImage}
            disabled={!image || !mealType || analyzing || loading}
            className="w-full"
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Food...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Analyze Food
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Food Items Editor */}
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
              
              <div className="space-y-3">
                {editingItems.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Food Name</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateFoodItem(index, 'name', e.target.value)}
                          placeholder="Food name"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          value={item.quantity}
                          onChange={(e) => updateFoodItem(index, 'quantity', e.target.value)}
                          placeholder="1 cup"
                        />
                      </div>
                      
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
                      
                      <div className="flex gap-1">
                        <div className="flex-1">
                          <Label className="text-xs">Carbs (g)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.carbs}
                            onChange={(e) => updateFoodItem(index, 'carbs', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Fat (g)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.fat}
                            onChange={(e) => updateFoodItem(index, 'fat', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFoodItem(index)}
                          className="mt-4 p-1 h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {item.confidence && item.confidence < 0.8 && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Low confidence: {(item.confidence * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Totals Summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {editingItems.reduce((sum, item) => sum + item.calories, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Calories</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {editingItems.reduce((sum, item) => sum + item.protein, 0).toFixed(1)}g
                    </p>
                    <p className="text-sm text-muted-foreground">Protein</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {editingItems.reduce((sum, item) => sum + item.carbs, 0).toFixed(1)}g
                    </p>
                    <p className="text-sm text-muted-foreground">Carbs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {editingItems.reduce((sum, item) => sum + item.fat, 0).toFixed(1)}g
                    </p>
                    <p className="text-sm text-muted-foreground">Fat</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this meal..."
                rows={3}
              />
            </div>

            {/* Suggestions */}
            {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
              <div className="space-y-2">
                <Label>AI Suggestions</Label>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.suggestions.map((suggestion: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSaveFoodEntry}
              disabled={loading || editingItems.length === 0}
              className="w-full"
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              Save to Food Log
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FoodPhotoAnalyzer;