
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAvatar } from '@/lib/avatarState';
import { toast } from '@/hooks/use-toast';

type DBAvatar = {
  id: string;
  name: string;
  image_url: string;
  mini_image_url: string;
};

export const AvatarGallery: React.FC = () => {
  const { avatar: selected, selectAvatar, loading: avatarLoading } = useAvatar();
  const [avatars, setAvatars] = useState<DBAvatar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('avatars')
        .select('id, name, image_url, mini_image_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!mounted) return;
      if (error) {
        console.error('Error loading avatars:', error);
        setAvatars([]);
      } else {
        setAvatars(data || []);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleSelect = async (a: DBAvatar) => {
    await selectAvatar(a);
    toast({
      title: 'Avatar updated',
      description: `You selected ${a.name}.`,
    });
  };

  const isSelected = (id: string) => selected?.id === id;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || avatarLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading avatars...
            </div>
          ) : avatars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No avatars available yet. Please contact an admin to seed avatars.
              </p>
            </div>
          ) : (
            <div
              className="
                grid gap-4 
                grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
              "
            >
              {avatars.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleSelect(a)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(a);
                    }
                  }}
                  className={`
                    group relative overflow-hidden rounded-lg border 
                    focus:outline-none focus:ring-2 focus:ring-primary
                    ${isSelected(a.id) ? 'border-primary' : 'border-border'}
                  `}
                  aria-pressed={isSelected(a.id)}
                  aria-label={`Choose avatar ${a.name}`}
                >
                  <img
                    src={a.image_url}
                    alt={a.name}
                    loading="lazy"
                    className={`w-full aspect-square object-cover ${a.name === 'Nova Hawk' ? 'object-left' : 'object-center'}`}
                  />
                  {/* Mini preview bottom-right */}
                  <img
                    src={a.mini_image_url}
                    alt={`${a.name} mini`}
                    loading="lazy"
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full border border-border bg-background object-cover"
                  />
                  {/* Name bar */}
                  <div
                    className="
                      absolute left-0 right-0 bottom-0 
                      bg-background/80 backdrop-blur-sm 
                      text-foreground text-xs px-2 py-1
                    "
                  >
                    {a.name}
                  </div>
                  {/* Selected ring */}
                  {isSelected(a.id) && (
                    <div className="absolute inset-0 ring-2 ring-primary pointer-events-none" />
                  )}
                  {isSelected(a.id) && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
