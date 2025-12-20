import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import auroraImage from '@/assets/avatars/aurora-avatar.png';
import emberImage from '@/assets/avatars/ember-avatar.png';
import novaImage from '@/assets/avatars/nova-avatar.png';

interface NewAvatar {
  name: string;
  accentHex: string;
  gender: 'female' | 'male' | 'neutral';
  imageSrc: string;
}

const NEW_AVATARS: NewAvatar[] = [
  {
    name: 'Aurora',
    accentHex: '#88ccff',
    gender: 'female',
    imageSrc: auroraImage,
  },
  {
    name: 'Ember',
    accentHex: '#ff6622',
    gender: 'female',
    imageSrc: emberImage,
  },
  {
    name: 'Nova',
    accentHex: '#cc44ff',
    gender: 'female',
    imageSrc: novaImage,
  },
];

export function SeedNewAvatars() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const seedAvatars = async () => {
    setIsSeeding(true);
    setResults([]);
    const newResults: string[] = [];

    try {
      // Get current max sort order
      const { data: maxData } = await supabase
        .from('avatars')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      let sortOrder = (maxData?.sort_order || 9) + 1;

      for (const avatar of NEW_AVATARS) {
        try {
          // Check if avatar already exists
          const { data: existing } = await supabase
            .from('avatars')
            .select('id')
            .eq('name', avatar.name)
            .single();

          if (existing) {
            newResults.push(`⏭️ ${avatar.name} already exists, skipping`);
            continue;
          }

          // Fetch the image and convert to blob
          const response = await fetch(avatar.imageSrc);
          const blob = await response.blob();
          
          const timestamp = Date.now();
          const filename = `${avatar.name.toLowerCase()}-${timestamp}.png`;
          const miniFilename = `${avatar.name.toLowerCase()}-mini-${timestamp}.png`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('character-images')
            .upload(filename, blob, {
              contentType: 'image/png',
              upsert: true,
            });

          if (uploadError) {
            newResults.push(`❌ Failed to upload ${avatar.name}: ${uploadError.message}`);
            continue;
          }

          // Also upload mini version (same image for now)
          await supabase.storage
            .from('character-images')
            .upload(miniFilename, blob, {
              contentType: 'image/png',
              upsert: true,
            });

          // Get public URLs
          const { data: publicUrl } = supabase.storage
            .from('character-images')
            .getPublicUrl(filename);

          const { data: miniPublicUrl } = supabase.storage
            .from('character-images')
            .getPublicUrl(miniFilename);

          // Insert into database
          const { error: insertError } = await supabase
            .from('avatars')
            .insert({
              name: avatar.name,
              image_url: publicUrl.publicUrl,
              mini_image_url: miniPublicUrl.publicUrl,
              accent_hex: avatar.accentHex,
              gender: avatar.gender,
              is_active: true,
              sort_order: sortOrder++,
            });

          if (insertError) {
            newResults.push(`❌ Failed to insert ${avatar.name}: ${insertError.message}`);
          } else {
            newResults.push(`✅ Successfully created ${avatar.name}`);
          }
        } catch (err) {
          newResults.push(`❌ Error with ${avatar.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      setResults(newResults);
      
      const successCount = newResults.filter(r => r.startsWith('✅')).length;
      toast({
        title: 'Seeding Complete',
        description: `Created ${successCount} new avatars`,
      });
    } catch (error) {
      console.error('Seeding error:', error);
      toast({
        title: 'Seeding Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Seed New Avatars</h2>
      <p className="text-muted-foreground">
        This will create Aurora, Ember, and Nova avatars with their images uploaded to Supabase storage.
      </p>
      
      <div className="flex gap-4">
        {NEW_AVATARS.map((avatar) => (
          <div key={avatar.name} className="text-center">
            <img 
              src={avatar.imageSrc} 
              alt={avatar.name} 
              className="w-24 h-24 rounded-lg object-cover mx-auto"
            />
            <p className="mt-2 font-medium">{avatar.name}</p>
            <p className="text-xs text-muted-foreground">{avatar.gender}</p>
            <div 
              className="w-4 h-4 rounded-full mx-auto mt-1" 
              style={{ backgroundColor: avatar.accentHex }}
            />
          </div>
        ))}
      </div>

      <Button onClick={seedAvatars} disabled={isSeeding}>
        {isSeeding ? 'Seeding...' : 'Seed Avatars to Database'}
      </Button>

      {results.length > 0 && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Results:</h3>
          {results.map((result, i) => (
            <p key={i} className="text-sm">{result}</p>
          ))}
        </div>
      )}
    </div>
  );
}
