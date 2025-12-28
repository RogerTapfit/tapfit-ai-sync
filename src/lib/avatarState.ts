
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const avatarEvents = new EventTarget();
const GUEST_KEY = 'tapfit.avatar';
const TEMP_SELECTION_KEY = 'tapfit.temp_avatar_selection';
const AVATAR_CACHE_KEY = 'tapfit.avatar_cache';

type AvatarRow = {
  id: string;
  image_url: string;
  mini_image_url: string;
  name?: string;
  accent_hex?: string;
  gender?: string;
};

export function useAvatar() {
  // Initialize avatar from cache immediately to prevent flash
  const [avatar, setAvatar] = useState<Partial<AvatarRow> | null>(() => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(AVATAR_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      // Check for temporary selection first
      const tempSelection = typeof window !== 'undefined' ? localStorage.getItem(TEMP_SELECTION_KEY) : null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!isMounted) return;
        setIsGuest(true);
        const stored = typeof window !== 'undefined' ? localStorage.getItem(GUEST_KEY) : null;
        const currentAvatar = tempSelection ? JSON.parse(tempSelection) : (stored ? JSON.parse(stored) : null);
        setAvatar(currentAvatar);
        setLoading(false);
        return;
      }

      // If we have a temp selection, use it immediately for optimistic UI
      if (tempSelection && isMounted) {
        try {
          const tempAvatar = JSON.parse(tempSelection.split('|')[0]);
          setAvatar(tempAvatar);
        } catch (e) {
          console.error('Failed to parse temp avatar selection');
        }
      }

      // signed-in: join profiles -> avatars
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_id, avatars:avatar_id(id, image_url, mini_image_url, name, accent_hex, gender)')
        .eq('id', user.id)
        .single();

      if (!isMounted) return;

      // Only update if we don't have a recent temp selection
      const shouldUpdateFromDB = !tempSelection || Date.now() - parseInt(tempSelection.split('|')[1] || '0') > 5000;

      if (!error && data?.avatars && shouldUpdateFromDB) {
        const dbAvatar = {
          id: data.avatars.id,
          image_url: data.avatars.image_url,
          mini_image_url: data.avatars.mini_image_url,
          name: data.avatars.name,
          accent_hex: (data.avatars as any).accent_hex,
          gender: (data.avatars as any).gender
        };
        setAvatar(dbAvatar);
        
        // Cache for next refresh - prevents flash on page reload
        localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(dbAvatar));
        
        // Clear temp selection if it matches DB
        if (tempSelection) {
          try {
            const tempAvatar = JSON.parse(tempSelection.split('|')[0]);
            if (tempAvatar.id === dbAvatar.id) {
              localStorage.removeItem(TEMP_SELECTION_KEY);
            }
          } catch (e) {}
        }
      } else if (!tempSelection && !avatar) {
        setAvatar(null);
      }
      setLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for avatar changes from anywhere in the app
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as AvatarRow | null;
      if (detail) setAvatar(detail);
    };
    avatarEvents.addEventListener('avatar:changed', handler as EventListener);
    return () => {
      avatarEvents.removeEventListener('avatar:changed', handler as EventListener);
    };
  }, []);

  const selectAvatar = async (avatarRow: AvatarRow) => {
    // Optimistic update - immediately update UI
    setAvatar(avatarRow);
    avatarEvents.dispatchEvent(new CustomEvent('avatar:changed', { detail: avatarRow }));
    
    if (isGuest) {
      localStorage.setItem(GUEST_KEY, JSON.stringify(avatarRow));
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Store temp selection with timestamp
    const tempData = JSON.stringify(avatarRow) + '|' + Date.now();
    localStorage.setItem(TEMP_SELECTION_KEY, tempData);
    
    try {
      const { error } = await supabase.from('profiles').update({ avatar_id: avatarRow.id }).eq('id', user.id);
      
      if (!error) {
        // Success - clear temp selection after a short delay
        setTimeout(() => {
          localStorage.removeItem(TEMP_SELECTION_KEY);
        }, 1000);
      } else {
        // Error - could implement rollback here if needed
        console.error('Failed to update avatar:', error);
        localStorage.removeItem(TEMP_SELECTION_KEY);
      }
    } catch (error) {
      console.error('Avatar update error:', error);
      localStorage.removeItem(TEMP_SELECTION_KEY);
    }
  };

  return { loading, avatar, isGuest, selectAvatar };
}