
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Image as ImageIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAvatar } from '@/lib/avatarState';
import { toast } from '@/hooks/use-toast';

type DBAvatar = {
  id: string;
  name: string;
  image_url: string;
  mini_image_url: string;
  accent_hex?: string;
};

export const AvatarGallery: React.FC = () => {
  const { avatar: selected, selectAvatar, loading: avatarLoading } = useAvatar();
  const [avatars, setAvatars] = useState<DBAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [accents, setAccents] = useState<Record<string, string>>({});
  const [selectedForConfirmation, setSelectedForConfirmation] = useState<DBAvatar | null>(null);

  const deriveAccentFromImage = (img: HTMLImageElement): string => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '#ff4d4d';
      const w = 32, h = 32;
      canvas.width = w; canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i+1]; b += data[i+2]; count++;
      }
      r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
      return '#ff4d4d';
    }
  };
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('avatars')
        .select('id, name, image_url, mini_image_url, accent_hex')
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

  const handleAvatarClick = (a: DBAvatar) => {
    if (isSelected(a.id)) {
      return; // Don't show confirmation for already selected avatar
    }
    setSelectedForConfirmation(a);
  };

  const handleConfirmSelection = async () => {
    if (!selectedForConfirmation) return;
    
    await selectAvatar(selectedForConfirmation);
    toast({
      title: 'Avatar updated',
      description: `You selected ${selectedForConfirmation.name}.`,
    });
    setSelectedForConfirmation(null);
  };

  const handleCancelSelection = () => {
    setSelectedForConfirmation(null);
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
              {avatars.map((a) => {
                const accent = a.accent_hex || accents[a.id] || '#ff4d4d';
                return (
                  <div
                    key={a.id}
                    onClick={() => handleAvatarClick(a)}
                    className={`group relative overflow-hidden rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${isSelected(a.id) ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/50'} bg-card shadow-sm hover:shadow-lg transition-all duration-200 h-72`}
                    aria-pressed={isSelected(a.id)}
                    aria-label={`Choose avatar ${a.name}`}
                  >
                    {/* Glow layer */}
                    <div
                      className="absolute -inset-[10%] pointer-events-none opacity-65 group-hover:opacity-90 transition-opacity duration-200"
                      style={{
                        background: `radial-gradient(60% 60% at 50% 60%, ${accent} 0%, transparent 60%)`,
                        filter: 'blur(28px) saturate(1.2)'
                      }}
                    />
                    {/* Main image */}
                    <img
                      src={a.image_url}
                      alt={a.name}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.svg'; }}
                      onLoad={(e) => {
                        if (!a.accent_hex) {
                          try {
                            const c = deriveAccentFromImage(e.currentTarget);
                            setAccents((s) => ({ ...s, [a.id]: c }));
                          } catch {}
                        }
                      }}
                      className={`w-full h-48 object-contain transition-transform duration-200 ease-out will-change-transform group-hover:scale-[1.05] ${a.name === 'Nova Hawk' ? 'object-left' : 'object-center'}`}
                    />
                    {/* Mini preview bottom-right */}
                    <img
                      src={a.mini_image_url}
                      alt={`${a.name} mini`}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.svg'; }}
                      className="absolute top-40 right-2 w-10 h-10 rounded-full border border-border bg-background object-contain"
                    />
                    {/* Name bar */}
                    <div
                      className="absolute left-0 right-0 top-52 bg-background/80 backdrop-blur-sm text-foreground text-xs px-2 py-1"
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

                    {/* Action button */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <Button
                        className="w-full cursor-pointer"
                        variant={isSelected(a.id) ? 'secondary' : 'default'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAvatarClick(a);
                        }}
                        aria-pressed={isSelected(a.id)}
                        disabled={isSelected(a.id)}
                      >
                        {isSelected(a.id) ? 'Selected' : 'Choose This Avatar'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <AlertDialog open={!!selectedForConfirmation} onOpenChange={() => setSelectedForConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Avatar</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want {selectedForConfirmation?.name} to be your new avatar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSelection}>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSelection}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
