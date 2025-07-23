import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Calculator, Activity } from 'lucide-react';
import { useNutrition, NutritionGoal } from '@/hooks/useNutrition';

const NutritionGoalsSetup = () => {
  const { nutritionGoals, saveNutritionGoals, loading } = useNutrition();
  const [formData, setFormData] = useState({
    goal_type: nutritionGoals?.goal_type || 'maintenance' as 'fat_loss' | 'muscle_gain' | 'maintenance',
    daily_calories: nutritionGoals?.daily_calories || 2000,
    protein_grams: nutritionGoals?.protein_grams || 150,
    carbs_grams: nutritionGoals?.carbs_grams || 200,
    fat_grams: nutritionGoals?.fat_grams || 70,
    is_active: true
  });

  const goalOptions = [
    { 
      value: 'fat_loss', 
      label: 'Fat Loss', 
      icon: '🔥',
      description: 'Lose weight while preserving muscle mass'
    },
    { 
      value: 'muscle_gain', 
      label: 'Muscle Gain', 
      icon: '💪',
      description: 'Build muscle with controlled weight gain'
    },
    { 
      value: 'maintenance', 
      label: 'Maintenance', 
      icon: '⚖️',
      description: 'Maintain current weight and body composition'
    }
  ];

  const calculateSuggestedMacros = (goalType: string, calories: number) => {
    let proteinRatio, carbRatio, fatRatio;
    
    switch (goalType) {
      case 'fat_loss':
        proteinRatio = 0.35; // 35% protein for muscle preservation
        carbRatio = 0.30;    // 30% carbs
        fatRatio = 0.35;     // 35% fat
        break;
      case 'muscle_gain':
        proteinRatio = 0.30; // 30% protein for muscle building
        carbRatio = 0.45;    // 45% carbs for energy
        fatRatio = 0.25;     // 25% fat
        break;
      default: // maintenance
        proteinRatio = 0.25; // 25% protein
        carbRatio = 0.45;    // 45% carbs
        fatRatio = 0.30;     // 30% fat
    }

    return {
      protein: Math.round((calories * proteinRatio) / 4), // 4 cal per gram
      carbs: Math.round((calories * carbRatio) / 4),     // 4 cal per gram
      fat: Math.round((calories * fatRatio) / 9)         // 9 cal per gram
    };
  };

  const handleGoalTypeChange = (goalType: string) => {
    const newFormData = { ...formData, goal_type: goalType as any };
    
    // Auto-calculate macros based on goal type and current calories
    const suggested = calculateSuggestedMacros(goalType, formData.daily_calories);
    newFormData.protein_grams = suggested.protein;
    newFormData.carbs_grams = suggested.carbs;
    newFormData.fat_grams = suggested.fat;
    
    setFormData(newFormData);
  };

  const handleCaloriesChange = (calories: number) => {
    const newFormData = { ...formData, daily_calories: calories };
    
    // Auto-calculate macros based on new calories
    const suggested = calculateSuggestedMacros(formData.goal_type, calories);
    newFormData.protein_grams = suggested.protein;
    newFormData.carbs_grams = suggested.carbs;
    newFormData.fat_grams = suggested.fat;
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveNutritionGoals(formData);
  };

  const totalMacroCalories = (formData.protein_grams * 4) + (formData.carbs_grams * 4) + (formData.fat_grams * 9);
  const macroCalorieDifference = Math.abs(totalMacroCalories - formData.daily_calories);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Nutrition Goals Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Goal Type Selection */}
            <div className="space-y-3">
              <Label>Primary Goal</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {goalOptions.map((goal) => (
                  <Button
                    key={goal.value}
                    type="button"
                    variant={formData.goal_type === goal.value ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => handleGoalTypeChange(goal.value)}
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <span className="font-medium">{goal.label}</span>
                    <span className="text-xs text-center opacity-70">{goal.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Daily Calories */}
            <div className="space-y-3">
              <Label htmlFor="calories" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Daily Calorie Target
              </Label>
              <Input
                id="calories"
                type="number"
                value={formData.daily_calories}
                onChange={(e) => handleCaloriesChange(parseInt(e.target.value) || 0)}
                min="1000"
                max="5000"
                step="50"
              />
            </div>

            {/* Macronutrients */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <Label>Macronutrient Targets (grams)</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={formData.protein_grams}
                    onChange={(e) => setFormData({
                      ...formData, 
                      protein_grams: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    max="500"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.protein_grams * 4} calories ({((formData.protein_grams * 4) / formData.daily_calories * 100).toFixed(0)}%)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbohydrates</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={formData.carbs_grams}
                    onChange={(e) => setFormData({
                      ...formData, 
                      carbs_grams: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    max="800"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.carbs_grams * 4} calories ({((formData.carbs_grams * 4) / formData.daily_calories * 100).toFixed(0)}%)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fat">Fat</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={formData.fat_grams}
                    onChange={(e) => setFormData({
                      ...formData, 
                      fat_grams: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    max="300"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.fat_grams * 9} calories ({((formData.fat_grams * 9) / formData.daily_calories * 100).toFixed(0)}%)
                  </p>
                </div>
              </div>

              {/* Macro validation */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Total from macros:</strong> {totalMacroCalories} calories
                </p>
                {macroCalorieDifference > 50 && (
                  <p className="text-sm text-orange-600 mt-1">
                    ⚠️ Macro calories differ from target by {macroCalorieDifference} calories
                  </p>
                )}
                {macroCalorieDifference <= 50 && (
                  <p className="text-sm text-green-600 mt-1">
                    ✅ Macros align well with calorie target
                  </p>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Saving...' : 'Save Nutrition Goals'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NutritionGoalsSetup;