
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getDisplayName } from '@/lib/userDisplay';
import { useAvatar } from '@/lib/avatarState';
import { supabase } from '@/integrations/supabase/client';

export const WelcomeBanner: React.FC = () => {
  const { avatar, isGuest } = useAvatar();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('first_name, full_name')
          .eq('id', user.id)
          .single();
        if (!mounted) return;
        setProfile(data);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const name = getDisplayName(user, profile);

  let text: string;
  if (isGuest || !user) {
    text = 'Welcome, Guest — We hope we can turn you into an active user soon.';
  } else if (name) {
    text = `Welcome back, ${name}`;
  } else {
    text = 'Welcome back!';
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-6 flex items-center justify-between">
        <div className="text-base sm:text-lg font-medium">{text}</div>
        <div className="flex items-center gap-2">
          {avatar?.mini_image_url ? (
            <img
              src={avatar.mini_image_url}
              alt="Mini avatar"
              loading="lazy"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-dashed border-border" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
