import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecipeDatabaseItem {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  image_url: string | null;
  nutrition_per_serving: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: string[];
  instructions: string[];
  tags: string[];
  popularity_score: number;
}

export const CUISINES = [
  { id: 'all', label: 'All', emoji: '🍽️' },
  { id: 'Mexican', label: 'Mexican', emoji: '🌮' },
  { id: 'Asian', label: 'Asian', emoji: '🍜' },
  { id: 'Italian', label: 'Italian', emoji: '🍝' },
  { id: 'Vegan', label: 'Vegan', emoji: '🥗' },
  { id: 'American', label: 'American', emoji: '🍔' },
  { id: 'Mediterranean', label: 'Mediterranean', emoji: '🥙' },
  { id: 'Indian', label: 'Indian', emoji: '🍛' },
];

export const CATEGORIES = [
  { id: 'all', label: 'All Meals' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snacks' },
];

export function useRecipeDatabase() {
  const [recipes, setRecipes] = useState<RecipeDatabaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRecipes();
  }, [selectedCuisine, selectedCategory, searchQuery]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('recipe_database')
        .select('*')
        .eq('is_active', true)
        .order('popularity_score', { ascending: false });

      if (selectedCuisine !== 'all') {
        query = query.eq('cuisine', selectedCuisine);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformedRecipes: RecipeDatabaseItem[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        cuisine: item.cuisine,
        category: item.category,
        image_url: item.image_url,
        nutrition_per_serving: item.nutrition_per_serving as RecipeDatabaseItem['nutrition_per_serving'],
        ingredients: item.ingredients as string[],
        instructions: item.instructions as string[],
        tags: item.tags || [],
        popularity_score: item.popularity_score || 0,
      }));

      setRecipes(transformedRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    recipes,
    loading,
    selectedCuisine,
    setSelectedCuisine,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    refreshRecipes: loadRecipes,
  };
}
