import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DBAvatar {
  id: string;
  name: string;
  image_url: string;
  mini_image_url: string;
  sort_order: number;
}

interface Slot {
  id?: string;
  name?: string;
  image_url?: string;
  mini_image_url?: string;
}

const MAX_SLOTS = 9;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function createThumbnail(dataUrl: string, size = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      // cover fit
      const ratio = Math.max(size / img.width, size / img.height);
      const newW = img.width * ratio;
      const newH = img.height * ratio;
      const dx = (size - newW) / 2;
      const dy = (size - newH) / 2;
      ctx.drawImage(img, dx, dy, newW, newH);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export const AvatarDropInGrid: React.FC = () => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<Slot[]>(Array.from({ length: MAX_SLOTS }, () => ({}) ))
  const [loading, setLoading] = useState(true);
  

  const fetchAvatars = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('avatars')
      .select('id, name, image_url, mini_image_url, sort_order')
      .order('sort_order', { ascending: true });
    if (error) {
      toast({ title: 'Failed to load avatars', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    const filled: Slot[] = Array.from({ length: MAX_SLOTS }, () => ({}) );
    (data ?? []).slice(0, MAX_SLOTS).forEach((a, i) => {
      filled[i] = { id: a.id, name: a.name, image_url: a.image_url, mini_image_url: a.mini_image_url };
    });
    setSlots(filled);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAvatars();
  }, [fetchAvatars]);

  const handleUploadAt = useCallback(async (file: File, index: number) => {
    try {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Unsupported file', description: 'Please drop an image file.', variant: 'destructive' });
        return;
      }
      const dataUrl = await fileToDataUrl(file);
      const thumb = await createThumbnail(dataUrl, 160);
      const name = slots[index].name || `Avatar ${index + 1}`;
      const { data, error } = await supabase.functions.invoke('adminUpsertAvatar', {
        body: {
          id: slots[index].id,
          name,
          sort_order: index,
          imageDataUrl: dataUrl,
          miniImageDataUrl: thumb,
        }
      });
      if (error) throw error;
      const avatar: DBAvatar = data.avatar;
      const next = [...slots];
      next[index] = {
        id: avatar.id,
        name: avatar.name,
        image_url: avatar.image_url,
        mini_image_url: avatar.mini_image_url,
      };
      setSlots(next);
      toast({ title: 'Avatar saved', description: `${name} updated.` });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message ?? String(e), variant: 'destructive' });
    }
  }, [slots, toast]);


  const onFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) handleUploadAt(file, index);
    e.currentTarget.value = '';
  }, [handleUploadAt]);


  return (
    <div className="space-y-4">
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle>Avatar Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-10">Loading avatars…</div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {slots.map((slot, i) => (
                <div
                  key={i}
                  className={cn(
                    'relative aspect-square rounded-md border border-dashed border-border overflow-hidden',
                    'bg-muted/30 flex items-center justify-center group'
                  )}
                >
                  {slot.image_url ? (
                    <>
                      <img
                        src={slot.image_url}
                        alt={slot.name || `TapFit avatar ${i + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-2 flex justify-end bg-background/70 backdrop-blur">
                        <label className="inline-flex items-center gap-1 text-xs cursor-pointer border border-border rounded px-2 py-1 bg-muted/60 hover:bg-muted transition">
                          <Upload className="h-3.5 w-3.5" /> Replace
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => onFilePick(e, i)} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 text-center cursor-pointer p-3 sm:p-4">
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      <div className="text-xs text-muted-foreground">
                        Click to upload image
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onFilePick(e, i)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={fetchAvatars}>
              <Upload className="mr-2 h-4 w-4" /> Refresh from server
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
