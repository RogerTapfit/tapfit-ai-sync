import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SavedRecipe {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cuisine: string;
  image_url: string | null;
  ingredients: string[];
  instructions: string[];
  nutrition_per_serving: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  servings: number;
  prep_time_min: number | null;
  cook_time_min: number | null;
  difficulty: string;
  tags: string[];
  is_public: boolean;
  source: string;
  created_at: string;
}

export function useSavedRecipes() {
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedRecipes: SavedRecipe[] = (data || []).map((item) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        description: item.description,
        cuisine: item.cuisine,
        image_url: item.image_url,
        ingredients: item.ingredients as string[],
        instructions: item.instructions as string[],
        nutrition_per_serving: item.nutrition_per_serving as SavedRecipe['nutrition_per_serving'],
        servings: item.servings,
        prep_time_min: item.prep_time_min,
        cook_time_min: item.cook_time_min,
        difficulty: item.difficulty || 'medium',
        tags: item.tags || [],
        is_public: item.is_public || false,
        source: item.source || 'user_created',
        created_at: item.created_at,
      }));

      setSavedRecipes(transformedRecipes);
    } catch (error) {
      console.error('Error loading saved recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = async (recipe: Omit<SavedRecipe, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to save recipes');
        return null;
      }

      const { data, error } = await supabase
        .from('saved_recipes')
        .insert({
          user_id: user.id,
          name: recipe.name,
          description: recipe.description,
          cuisine: recipe.cuisine,
          image_url: recipe.image_url,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          nutrition_per_serving: recipe.nutrition_per_serving,
          servings: recipe.servings,
          prep_time_min: recipe.prep_time_min,
          cook_time_min: recipe.cook_time_min,
          difficulty: recipe.difficulty,
          tags: recipe.tags,
          is_public: recipe.is_public,
          source: recipe.source,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Recipe saved to library!');
      await loadSavedRecipes();
      return data;
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Failed to save recipe');
      return null;
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;

      toast.success('Recipe deleted');
      await loadSavedRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Failed to delete recipe');
    }
  };

  const updateRecipe = async (recipeId: string, updates: Partial<SavedRecipe>) => {
    try {
      const { error } = await supabase
        .from('saved_recipes')
        .update(updates)
        .eq('id', recipeId);

      if (error) throw error;

      toast.success('Recipe updated');
      await loadSavedRecipes();
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast.error('Failed to update recipe');
    }
  };

  return {
    savedRecipes,
    loading,
    saveRecipe,
    deleteRecipe,
    updateRecipe,
    refreshRecipes: loadSavedRecipes,
  };
}
