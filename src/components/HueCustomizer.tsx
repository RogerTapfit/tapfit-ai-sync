import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, RotateCcw } from 'lucide-react';

interface HueCustomizerProps {
  currentHue: number;
  onHueChange: (hue: number) => void;
  characterType: string;
  previewComponent?: React.ReactNode;
}

// Predefined color themes for each character
const CHARACTER_THEMES = {
  steel_warrior: [
    { name: 'Classic Steel', hue: 0, description: 'Original metallic look' },
    { name: 'Blue Steel', hue: 210, description: 'Cool blue tones' },
    { name: 'Golden Warrior', hue: 45, description: 'Noble gold finish' },
    { name: 'Emerald Knight', hue: 120, description: 'Forest green armor' }
  ],
  cyber_panda: [
    { name: 'Classic Panda', hue: 0, description: 'Traditional black & white' },
    { name: 'Cyber Blue', hue: 200, description: 'High-tech blue glow' },
    { name: 'Pink Kawaii', hue: 320, description: 'Cute pink accents' },
    { name: 'Mint Fresh', hue: 150, description: 'Cool mint green' }
  ],
  cosmic_bunny: [
    { name: 'Space White', hue: 0, description: 'Pure cosmic white' },
    { name: 'Galaxy Purple', hue: 280, description: 'Deep space purple' },
    { name: 'Stellar Blue', hue: 220, description: 'Bright star blue' },
    { name: 'Nebula Pink', hue: 330, description: 'Cosmic pink clouds' }
  ],
  lightning_cheetah: [
    { name: 'Golden Spots', hue: 45, description: 'Classic cheetah gold' },
    { name: 'Electric Blue', hue: 200, description: 'Lightning blue energy' },
    { name: 'Fire Orange', hue: 25, description: 'Blazing speed orange' },
    { name: 'Shadow Black', hue: 0, description: 'Stealth mode black' }
  ],
  mystic_fox: [
    { name: 'Autumn Fox', hue: 25, description: 'Traditional red-orange' },
    { name: 'Mystic Purple', hue: 280, description: 'Magical purple aura' },
    { name: 'Silver Spirit', hue: 0, description: 'Ethereal silver' },
    { name: 'Forest Green', hue: 120, description: 'Nature green' }
  ],
  iron_guardian: [
    { name: 'Iron Gray', hue: 0, description: 'Classic iron armor' },
    { name: 'Guardian Blue', hue: 210, description: 'Protective blue steel' },
    { name: 'Bronze Shield', hue: 35, description: 'Ancient bronze' },
    { name: 'Emerald Guard', hue: 140, description: 'Forest guardian' }
  ],
  shadow_eagle: [
    { name: 'Dark Shadow', hue: 240, description: 'Mysterious dark blue' },
    { name: 'Golden Eagle', hue: 45, description: 'Majestic golden wings' },
    { name: 'Storm Gray', hue: 0, description: 'Storm cloud gray' },
    { name: 'Crimson Hunter', hue: 350, description: 'Fierce red accents' }
  ],
  emerald_chameleon: [
    { name: 'Emerald Green', hue: 120, description: 'Classic chameleon green' },
    { name: 'Tropical Blue', hue: 180, description: 'Ocean blue blend' },
    { name: 'Sunset Orange', hue: 30, description: 'Warm sunset tones' },
    { name: 'Royal Purple', hue: 270, description: 'Regal purple hues' }
  ],
  gorilla_guardian: [
    { name: 'Silverback', hue: 0, description: 'Classic silverback gray' },
    { name: 'Forest King', hue: 90, description: 'Deep forest green' },
    { name: 'Mountain Brown', hue: 25, description: 'Earth brown tones' },
    { name: 'Midnight Blue', hue: 220, description: 'Dark protective blue' }
  ],
  cyber_dragon: [
    { name: 'Ice Dragon', hue: 180, description: 'Frozen blue scales' },
    { name: 'Fire Dragon', hue: 0, description: 'Blazing red flames' },
    { name: 'Poison Dragon', hue: 120, description: 'Toxic green breath' },
    { name: 'Shadow Dragon', hue: 270, description: 'Dark purple energy' }
  ],
  demon_bull: [
    { name: 'Crimson Fury', hue: 0, description: 'Classic demon red' },
    { name: 'Shadow Bull', hue: 240, description: 'Dark shadow energy' },
    { name: 'Electric Beast', hue: 180, description: 'Lightning blue power' },
    { name: 'Molten Core', hue: 25, description: 'Lava orange glow' }
  ]
};

export const HueCustomizer = ({ currentHue, onHueChange, characterType, previewComponent }: HueCustomizerProps) => {
  const themes = CHARACTER_THEMES[characterType as keyof typeof CHARACTER_THEMES] || CHARACTER_THEMES.steel_warrior;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Color Customization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Preview */}
        {previewComponent && (
          <div className="flex justify-center p-4 bg-muted/50 rounded-lg">
            {previewComponent}
          </div>
        )}

        {/* Manual Hue Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Custom Hue</label>
            <Badge variant="outline">{currentHue}°</Badge>
          </div>
          
          <div className="relative">
            <Slider
              value={[currentHue]}
              onValueChange={(value) => onHueChange(value[0])}
              max={360}
              min={0}
              step={1}
              className="w-full"
            />
            {/* Color preview bar */}
            <div 
              className="w-full h-2 rounded-full mt-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-red-500"
              style={{
                background: `linear-gradient(to right, 
                  hsl(0, 70%, 50%), hsl(60, 70%, 50%), hsl(120, 70%, 50%), 
                  hsl(180, 70%, 50%), hsl(240, 70%, 50%), hsl(300, 70%, 50%), hsl(360, 70%, 50%))`
              }}
            />
          </div>
        </div>

        {/* Preset Themes */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Preset Themes</label>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((theme) => (
              <Button
                key={theme.name}
                variant={currentHue === theme.hue ? "default" : "outline"}
                size="sm"
                onClick={() => onHueChange(theme.hue)}
                className="flex flex-col items-start p-3 h-auto"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: `hsl(${theme.hue}, 70%, 50%)` }}
                  />
                  <span className="font-medium text-xs">{theme.name}</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  {theme.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onHueChange(0)}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </Button>

      </CardContent>
    </Card>
  );
};