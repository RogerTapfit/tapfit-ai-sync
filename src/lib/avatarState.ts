
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const avatarEvents = new EventTarget();
const GUEST_KEY = 'tapfit.avatar';

type AvatarRow = {
  id: string;
  image_url: string;
  mini_image_url: string;
  name?: string;
  accent_hex?: string;
};

export function useAvatar() {
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState<Partial<AvatarRow> | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!isMounted) return;
        setIsGuest(true);
        const stored = typeof window !== 'undefined' ? localStorage.getItem(GUEST_KEY) : null;
        setAvatar(stored ? JSON.parse(stored) : null);
        setLoading(false);
        return;
      }

      // signed-in: join profiles -> avatars
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_id, avatars:avatar_id(id, image_url, mini_image_url, name, accent_hex)')
        .eq('id', user.id)
        .single();

      if (!isMounted) return;

      if (!error && data?.avatars) {
        setAvatar({
          id: data.avatars.id,
          image_url: data.avatars.image_url,
          mini_image_url: data.avatars.mini_image_url,
          name: data.avatars.name,
          accent_hex: (data.avatars as any).accent_hex
        });
      } else {
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
    if (isGuest) {
      localStorage.setItem(GUEST_KEY, JSON.stringify(avatarRow));
      setAvatar(avatarRow);
      avatarEvents.dispatchEvent(new CustomEvent('avatar:changed', { detail: avatarRow }));
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ avatar_id: avatarRow.id }).eq('id', user.id);
    setAvatar(avatarRow);
    avatarEvents.dispatchEvent(new CustomEvent('avatar:changed', { detail: avatarRow }));
  };

  return { loading, avatar, isGuest, selectAvatar };
}