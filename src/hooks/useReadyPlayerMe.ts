import { useState, useEffect } from 'react';
import { readyPlayerMeService, ReadyPlayerMeAvatar } from '@/services/readyPlayerMeService';
import { firebaseService } from '@/services/firebaseService';
import { useTapCoins } from './useTapCoins';
import { supabase } from '@/integrations/supabase/client';

export const useReadyPlayerMe = () => {
  const [avatar, setAvatar] = useState<ReadyPlayerMeAvatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { purchaseItem, hasPurchased, balance } = useTapCoins();

  useEffect(() => {
    initializeAvatar();
  }, []);

  const initializeAvatar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has existing ReadyPlayerMe avatar
      const profile = await supabase
        .from('profiles')
        .select('avatar_data')
        .eq('id', user.id)
        .single();

      if (profile.data?.avatar_data?.readyPlayerMeId) {
        const existingAvatar = await readyPlayerMeService.getAvatar(
          profile.data.avatar_data.readyPlayerMeId
        );
        setAvatar(existingAvatar);
      } else {
        // Create default fitness avatar
        await createDefaultAvatar();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize avatar');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultAvatar = async () => {
    const defaultCustomizations = {
      bodyType: 'athletic',
      colorScheme: 'tapfit_red',
      accessories: ['fitness_tracker'],
      expressions: ['motivated', 'focused']
    };

    const newAvatar = await readyPlayerMeService.createFitnessAvatar(defaultCustomizations);
    if (newAvatar) {
      setAvatar(newAvatar);
      await saveAvatarToProfile(newAvatar);
    }
  };

  const saveAvatarToProfile = async (avatarData: ReadyPlayerMeAvatar) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        avatar_data: {
          readyPlayerMeId: avatarData.id,
          ...avatarData
        }
      })
      .eq('id', user.id);
  };

  const updateCustomization = async (customizations: Partial<ReadyPlayerMeAvatar['customizations']>) => {
    if (!avatar) return false;

    const updatedAvatar = await readyPlayerMeService.updateAvatarCustomizations(
      avatar.id,
      customizations
    );

    if (updatedAvatar) {
      setAvatar(updatedAvatar);
      await saveAvatarToProfile(updatedAvatar);
      return true;
    }
    return false;
  };

  const purchaseCustomization = async (customizationId: string) => {
    const cost = readyPlayerMeService.getCustomizationCost(customizationId);
    
    if (balance < cost) {
      return { success: false, error: 'Insufficient TapCoins' };
    }

    const success = await purchaseItem(customizationId);
    if (success) {
      return { success: true };
    }
    return { success: false, error: 'Purchase failed' };
  };

  return {
    avatar,
    loading,
    error,
    updateCustomization,
    purchaseCustomization,
    canUseCustomization: (id: string) => 
      !readyPlayerMeService.isCustomizationPremium(id) || hasPurchased(id),
    getCustomizationCost: readyPlayerMeService.getCustomizationCost,
    refreshAvatar: initializeAvatar
  };
};