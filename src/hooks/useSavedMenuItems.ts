import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SavedMenuItem {
  id: string;
  user_id: string;
  restaurant_name?: string;
  item_name: string;
  calories?: number;
  price?: number;
  description?: string;
  dietary_tags?: string[];
  health_score?: number;
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useSavedMenuItems = () => {
  const [savedItems, setSavedItems] = useState<SavedMenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  // Fetch saved items
  const fetchSavedItems = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_menu_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the data to match our interface
      const typedData = (data || []).map(item => ({
        ...item,
        macros: item.macros as { protein?: number; carbs?: number; fat?: number; } | undefined
      }));
      
      setSavedItems(typedData as SavedMenuItem[]);
    } catch (error) {
      console.error('Error fetching saved menu items:', error);
      toast.error('Failed to load saved items');
    } finally {
      setLoading(false);
    }
  };

  // Check if item is already saved
  const isItemSaved = (itemName: string, restaurantName?: string): boolean => {
    return savedItems.some(
      item => 
        item.item_name.toLowerCase() === itemName.toLowerCase() &&
        (!restaurantName || item.restaurant_name?.toLowerCase() === restaurantName.toLowerCase())
    );
  };

  // Save a menu item
  const saveMenuItem = async (
    item: {
      name: string;
      calories?: number;
      price?: number;
      description?: string;
      dietaryTags?: string[];
      healthScore?: number;
      macros?: {
        protein?: number;
        carbs?: number;
        fat?: number;
      };
    },
    restaurantName?: string,
    notes?: string
  ) => {
    try {
      setSavingItemId(item.name);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to save menu items');
        return;
      }

      // Check if already saved
      if (isItemSaved(item.name, restaurantName)) {
        toast.info('This item is already in your favorites');
        return;
      }

      const { error } = await supabase
        .from('saved_menu_items')
        .insert({
          user_id: user.id,
          restaurant_name: restaurantName,
          item_name: item.name,
          calories: item.calories,
          price: item.price,
          description: item.description,
          dietary_tags: item.dietaryTags,
          health_score: item.healthScore,
          macros: item.macros ? JSON.parse(JSON.stringify(item.macros)) : null,
          notes: notes
        });

      if (error) throw error;

      toast.success('Added to favorites!');
      await fetchSavedItems(); // Refresh the list
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save item');
    } finally {
      setSavingItemId(null);
    }
  };

  // Delete a saved menu item
  const deleteSavedMenuItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Removed from favorites');
      setSavedItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting saved menu item:', error);
      toast.error('Failed to remove item');
    }
  };

  // Update notes for a saved item
  const updateNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('saved_menu_items')
        .update({ notes })
        .eq('id', id);

      if (error) throw error;

      toast.success('Notes updated');
      await fetchSavedItems();
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
    }
  };

  // Load saved items on mount
  useEffect(() => {
    fetchSavedItems();
  }, []);

  return {
    savedItems,
    loading,
    savingItemId,
    isItemSaved,
    saveMenuItem,
    deleteSavedMenuItem,
    updateNotes,
    refetch: fetchSavedItems
  };
};
