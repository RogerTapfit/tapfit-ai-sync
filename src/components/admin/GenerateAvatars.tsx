import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Check } from 'lucide-react';

interface AvatarConfig {
  name: string;
  animalType: string;
  accentColor: string;
  theme: string;
  gender: 'female' | 'male';
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

  const generateAll = async () => {
    for (const config of NEW_AVATARS) {
      if (!completed.includes(config.name)) {
        await generateAvatar(config);
      }
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate New Feminine Avatars
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Generate 4 new feminine robot animal hybrid avatars using AI. Each will be added to the database automatically.
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
  );
}
