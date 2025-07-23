import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTapCoins } from './useTapCoins';

export interface AvatarData {
  body_type: string;
  skin_tone: string;
  hair_style: string;
  hair_color: string;
  eye_color: string;
  outfit: string;
  accessory: string | null;
  shoes: string;
  animation: string;
  background: string;
}

export const useAvatar = () => {
  const [avatarData, setAvatarData] = useState<AvatarData | null>(null);
  const [loading, setLoading] = useState(true);
  const { purchaseItem, hasPurchased } = useTapCoins();

  useEffect(() => {
    fetchAvatarData();
  }, []);

  const fetchAvatarData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('avatar_data')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const defaultAvatar = {
        body_type: "default",
        skin_tone: "light",
        hair_style: "short",
        hair_color: "brown",
        eye_color: "brown",
        outfit: "basic_tee",
        accessory: null,
        shoes: "sneakers",
        animation: "idle",
        background: "gym"
      };
      
      if (profile?.avatar_data && 
          typeof profile.avatar_data === 'object' && 
          !Array.isArray(profile.avatar_data) &&
          profile.avatar_data !== null) {
        setAvatarData(profile.avatar_data as unknown as AvatarData);
      } else {
        setAvatarData(defaultAvatar);
      }
    } catch (error) {
      console.error('Error fetching avatar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvatar = async (newAvatarData: Partial<AvatarData>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !avatarData) return false;

      const updatedData = { ...avatarData, ...newAvatarData };

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_data: updatedData })
        .eq('id', user.id);

      if (error) throw error;

      setAvatarData(updatedData);
      return true;
    } catch (error) {
      console.error('Error updating avatar:', error);
      return false;
    }
  };

  const purchaseAvatarItem = async (itemId: string, itemType: string, itemValue: string) => {
    const success = await purchaseItem(itemId);
    if (success) {
      // Update avatar with the new item
      const updateKey = itemType.replace('avatar_', '') as keyof AvatarData;
      await updateAvatar({ [updateKey]: itemValue });
    }
    return success;
  };

  const canUseItem = (itemName: string, category: string) => {
    // Free items are always available
    if (itemName === 'Basic Tee' || itemName === 'Basic Sneakers' || 
        itemName === 'Idle' || itemName === 'Gym Floor') {
      return true;
    }
    // Check if purchased
    return hasPurchased(itemName);
  };

  return {
    avatarData,
    loading,
    updateAvatar,
    purchaseAvatarItem,
    canUseItem,
    fetchAvatarData
  };
};