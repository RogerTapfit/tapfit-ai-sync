import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Check, Eraser, RefreshCw } from 'lucide-react';

interface AvatarConfig {
  name: string;
  animalType: string;
  accentColor: string;
  theme: string;
  gender: 'female' | 'male';
}

interface ExistingAvatar {
  id: string;
  name: string;
  image_url: string;
  mini_image_url: string;
  accent_hex: string | null;
}

const NEW_AVATARS: AvatarConfig[] = [
  {
    name: 'Luna',
    animalType: 'bunny rabbit',
    accentColor: '#ff88cc',
    theme: 'soft pink pilates stretching wellness',
    gender: 'female',
  },
  {
    name: 'Siren',
    animalType: 'dolphin mermaid hybrid',
    accentColor: '#00ddff',
    theme: 'aqua cyan swimming water aerobics oceanic',
    gender: 'female',
  },
  {
    name: 'Velvet',
    animalType: 'elegant swan peacock',
    accentColor: '#aa66ff',
    theme: 'royal violet ballet dance graceful',
    gender: 'female',
  },
  {
    name: 'Pixie',
    animalType: 'butterfly fairy',
    accentColor: '#ffaa55',
    theme: 'warm coral cardio energetic bubbly',
    gender: 'female',
  },
];

export default function GenerateAvatars() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [existingAvatars, setExistingAvatars] = useState<ExistingAvatar[]>([]);
  const [removingBackground, setRemovingBackground] = useState<string | null>(null);
  const [loadingAvatars, setLoadingAvatars] = useState(true);

  // Fetch existing avatars
  useEffect(() => {
    fetchExistingAvatars();
  }, []);

  const fetchExistingAvatars = async () => {
    setLoadingAvatars(true);
    try {
      const { data, error } = await supabase
        .from('avatars')
        .select('id, name, image_url, mini_image_url, accent_hex')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setExistingAvatars(data || []);
    } catch (error) {
      console.error('Failed to fetch avatars:', error);
    } finally {
      setLoadingAvatars(false);
    }
  };

  const generateAvatar = async (config: AvatarConfig) => {
    setGenerating(config.name);
    
    try {
      console.log(`🎨 Starting generation for ${config.name}...`);
      
      const { data, error } = await supabase.functions.invoke('generate-avatar', {
        body: {
          name: config.name,
          theme: config.theme,
          accentColor: config.accentColor,
          gender: config.gender,
          animalType: config.animalType,
        },
      });

      if (error) throw error;
      
      if (data?.success) {
        setCompleted(prev => [...prev, config.name]);
        toast({
          title: `${config.name} created!`,
          description: `New ${config.animalType} avatar added to the database.`,
        });
        fetchExistingAvatars(); // Refresh the list
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (error) {
      console.error(`Failed to generate ${config.name}:`, error);
      toast({
        title: `Failed to generate ${config.name}`,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setGenerating(null);
    }
  };

  const removeBackground = async (avatar: ExistingAvatar) => {
    setRemovingBackground(avatar.id);
    
    try {
      console.log(`🔄 Removing background for ${avatar.name}...`);
      
      const { data, error } = await supabase.functions.invoke('remove-avatar-background', {
        body: { avatarId: avatar.id },
      });

      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: `Background removed!`,
          description: `${avatar.name} now has a transparent background.`,
        });
        fetchExistingAvatars(); // Refresh the list
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (error) {
      console.error(`Failed to remove background for ${avatar.name}:`, error);
      toast({
        title: `Failed to remove background`,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setRemovingBackground(null);
    }
  };

  const generateAll = async () => {
    for (const config of NEW_AVATARS) {
      if (!completed.includes(config.name)) {
        await generateAvatar(config);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Generate New Avatars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate New Avatars (Transparent BG)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Generate new robot animal hybrid avatars with transparent backgrounds using AI.
          </p>
          
          <div className="grid gap-3">
            {NEW_AVATARS.map((config) => (
              <div
                key={config.name}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ borderColor: config.accentColor + '40' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: config.accentColor }}
                  />
                  <div>
                    <p className="font-medium">{config.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{config.animalType}</p>
                  </div>
                </div>
                
                {completed.includes(config.name) ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateAvatar(config)}
                    disabled={generating !== null}
                  >
                    {generating === config.name ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate'
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={generateAll}
            disabled={generating !== null || completed.length === NEW_AVATARS.length}
            className="w-full"
          >
            {completed.length === NEW_AVATARS.length ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                All Avatars Generated
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate All ({NEW_AVATARS.length - completed.length} remaining)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Avatars - Remove Background */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eraser className="h-5 w-5 text-primary" />
            Remove Background from Existing Avatars
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchExistingAvatars}
              disabled={loadingAvatars}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loadingAvatars ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Use AI to remove backgrounds from existing avatars, making them transparent PNGs.
          </p>
          
          {loadingAvatars ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : existingAvatars.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No avatars found</p>
          ) : (
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {existingAvatars.map((avatar) => (
                <div
                  key={avatar.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ borderColor: (avatar.accent_hex || '#888') + '40' }}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar.mini_image_url || avatar.image_url}
                      alt={avatar.name}
                      className="w-10 h-10 rounded-lg object-cover bg-background/50"
                    />
                    <div>
                      <p className="font-medium">{avatar.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {avatar.image_url.includes('-nobg-') ? '✅ Transparent' : 'Has background'}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeBackground(avatar)}
                    disabled={removingBackground !== null}
                  >
                    {removingBackground === avatar.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Eraser className="h-4 w-4 mr-1" />
                        Remove BG
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
