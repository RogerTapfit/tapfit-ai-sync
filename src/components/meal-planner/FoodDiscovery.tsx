import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { CuisineFilter } from './CuisineFilter';
import { RecipeCard } from './RecipeCard';
import { RecipeDetailModal } from './RecipeDetailModal';
import { AddToPlanModal } from './AddToPlanModal';
import { useRecipeDatabase, RecipeDatabaseItem, CATEGORIES } from '@/hooks/useRecipeDatabase';
import { useSavedRecipes } from '@/hooks/useSavedRecipes';
import { Button } from '@/components/ui/button';

export function FoodDiscovery() {
  const {
    recipes,
    loading,
    selectedCuisine,
    setSelectedCuisine,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = useRecipeDatabase();

  const { savedRecipes, saveRecipe } = useSavedRecipes();
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDatabaseItem | null>(null);
  const [showAddToPlan, setShowAddToPlan] = useState(false);
  const [recipeToAdd, setRecipeToAdd] = useState<RecipeDatabaseItem | null>(null);

  const isRecipeSaved = (recipeId: string) => {
    return savedRecipes.some(r => r.name === recipes.find(rec => rec.id === recipeId)?.name);
  };

  const handleSaveRecipe = async (recipe: RecipeDatabaseItem) => {
    await saveRecipe({
      name: recipe.name,
      description: null,
      cuisine: recipe.cuisine,
      image_url: recipe.image_url,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      nutrition_per_serving: recipe.nutrition_per_serving,
      servings: 1,
      prep_time_min: null,
      cook_time_min: null,
      difficulty: 'medium',
      tags: recipe.tags,
      is_public: false,
      source: 'database',
    });
  };

  const handleAddToPlan = (recipe: RecipeDatabaseItem) => {
    setRecipeToAdd(recipe);
    setShowAddToPlan(true);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search meals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card/50 border-border/50"
        />
      </div>

      {/* Cuisine filters */}
      <CuisineFilter
        selectedCuisine={selectedCuisine}
        onCuisineChange={setSelectedCuisine}
      />

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="whitespace-nowrap"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Recipe grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <span className="text-4xl mb-4 block">🍽️</span>
          <p>No recipes found. Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isSaved={isRecipeSaved(recipe.id)}
              onSave={() => handleSaveRecipe(recipe)}
              onAddToPlan={() => handleAddToPlan(recipe)}
              onViewDetails={() => setSelectedRecipe(recipe)}
            />
          ))}
        </div>
      )}

      {/* Recipe detail modal */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onSave={() => selectedRecipe && handleSaveRecipe(selectedRecipe)}
        onAddToPlan={() => {
          if (selectedRecipe) {
            handleAddToPlan(selectedRecipe);
            setSelectedRecipe(null);
          }
        }}
        isSaved={selectedRecipe ? isRecipeSaved(selectedRecipe.id) : false}
      />

      {/* Add to plan modal */}
      <AddToPlanModal
        recipe={recipeToAdd}
        isOpen={showAddToPlan}
        onClose={() => {
          setShowAddToPlan(false);
          setRecipeToAdd(null);
        }}
      />
    </div>
  );
}
