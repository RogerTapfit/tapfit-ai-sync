import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useMealPlans } from '@/hooks/useMealPlans';
import { RecipeDatabaseItem } from '@/hooks/useRecipeDatabase';
import { SavedRecipe } from '@/hooks/useSavedRecipes';

interface AddToPlanModalProps {
  recipe: RecipeDatabaseItem | SavedRecipe | null;
  isOpen: boolean;
  onClose: () => void;
}

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { id: 'lunch', label: 'Lunch', emoji: '☀️' },
  { id: 'dinner', label: 'Dinner', emoji: '🌙' },
  { id: 'snack', label: 'Snack', emoji: '🍎' },
];

export function AddToPlanModal({ recipe, isOpen, onClose }: AddToPlanModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMealType, setSelectedMealType] = useState('dinner');
  const { addMealPlan } = useMealPlans();

  if (!recipe) return null;

  const handleAddToPlan = async () => {
    const nutrition = recipe.nutrition_per_serving;
    
    // Check if recipe has an id that's a saved recipe
    const recipeId = 'user_id' in recipe ? recipe.id : undefined;
    
    await addMealPlan({
      planned_date: format(selectedDate, 'yyyy-MM-dd'),
      meal_type: selectedMealType,
      recipe_id: recipeId,
      custom_meal_name: !recipeId ? recipe.name : undefined,
      planned_calories: nutrition.calories,
      planned_protein: nutrition.protein,
      planned_carbs: nutrition.carbs,
      planned_fat: nutrition.fat,
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Meal Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipe preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-2xl">🍽️</span>
              </div>
            )}
            <div>
              <p className="font-medium">{recipe.name}</p>
              <p className="text-sm text-muted-foreground">
                {recipe.nutrition_per_serving.calories} cal • {recipe.nutrition_per_serving.protein}g protein
              </p>
            </div>
          </div>

          {/* Meal type selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Meal Type</label>
            <Select value={selectedMealType} onValueChange={setSelectedMealType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <span className="flex items-center gap-2">
                      <span>{type.emoji}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-lg border"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleAddToPlan}>
              Add to Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
