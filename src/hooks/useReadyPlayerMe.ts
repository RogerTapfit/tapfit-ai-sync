import { useState, useEffect } from 'react';
import { readyPlayerMeService, ReadyPlayerMeAvatar } from '@/services/readyPlayerMeService';
import { firebaseService } from '@/services/firebaseService';
import { useTapCoins } from './useTapCoins';
import { supabase } from '@/integrations/supabase/client';
import type { AvatarData } from '@/types/avatar';

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

      const avatarData = profile.data?.avatar_data as AvatarData;
      if (avatarData?.readyPlayerMeId) {
        const existingAvatar = await readyPlayerMeService.getAvatar(
          avatarData.readyPlayerMeId
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

    const avatarDataToSave: AvatarData = {
      readyPlayerMeId: avatarData.id,
      modelUrl: avatarData.modelUrl,
      imageUrl: avatarData.imageUrl,
      customizations: avatarData.customizations,
      metadata: {
        createdAt: avatarData.metadata.createdAt.toISOString(),
        lastModified: avatarData.metadata.lastModified.toISOString(),
        fitnessLevel: avatarData.metadata.fitnessLevel,
        achievements: avatarData.metadata.achievements
      }
    };

    await supabase
      .from('profiles')
      .update({
        avatar_data: avatarDataToSave as any
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