import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FoodDiscovery } from './FoodDiscovery';
import { RecipeLibrary } from './RecipeLibrary';
import { MealCalendarScheduler } from './MealCalendarScheduler';
import { SelectRecipeModal } from './SelectRecipeModal';
import { useMealPlans } from '@/hooks/useMealPlans';
import { RecipeDatabaseItem } from '@/hooks/useRecipeDatabase';
import { SavedRecipe } from '@/hooks/useSavedRecipes';
import { Search, BookOpen, Calendar, ChefHat } from 'lucide-react';
import { format } from 'date-fns';

export const MealPlannerEmbed = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [showSelectRecipe, setShowSelectRecipe] = useState(false);
  const [pendingMeal, setPendingMeal] = useState<{ date: string; mealType: string } | null>(null);
  
  const { addMealPlan } = useMealPlans(new Date());

  const handleAddMeal = (date: string, mealType: string) => {
    setPendingMeal({ date, mealType });
    setShowSelectRecipe(true);
  };

  const handleSelectRecipe = async (recipe: RecipeDatabaseItem | SavedRecipe) => {
    if (!pendingMeal) return;

    const nutrition = recipe.nutrition_per_serving;
    const isUserRecipe = 'user_id' in recipe;

    await addMealPlan({
      planned_date: pendingMeal.date,
      meal_type: pendingMeal.mealType,
      recipe_id: isUserRecipe ? recipe.id : undefined,
      custom_meal_name: !isUserRecipe ? recipe.name : undefined,
      planned_calories: nutrition.calories,
      planned_protein: nutrition.protein,
      planned_carbs: nutrition.carbs,
      planned_fat: nutrition.fat,
    });

    setShowSelectRecipe(false);
    setPendingMeal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
          <ChefHat className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Meal Planner</h2>
          <p className="text-sm text-muted-foreground">Discover recipes, save favorites & plan your meals</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-border/50">
          <TabsTrigger value="discover" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Search className="h-4 w-4" />
            <span>Discover</span>
          </TabsTrigger>
          <TabsTrigger value="recipes" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BookOpen className="h-4 w-4" />
            <span>My Recipes</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calendar className="h-4 w-4" />
            <span>Plan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-6">
          <FoodDiscovery />
        </TabsContent>

        <TabsContent value="recipes" className="mt-6">
          <RecipeLibrary />
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          <MealCalendarScheduler onAddMeal={handleAddMeal} />
        </TabsContent>
      </Tabs>

      {/* Select recipe modal */}
      <SelectRecipeModal
        isOpen={showSelectRecipe}
        onClose={() => {
          setShowSelectRecipe(false);
          setPendingMeal(null);
        }}
        onSelect={handleSelectRecipe}
        selectedDate={pendingMeal?.date || format(new Date(), 'yyyy-MM-dd')}
        selectedMealType={pendingMeal?.mealType || 'dinner'}
      />
    </div>
  );
};
