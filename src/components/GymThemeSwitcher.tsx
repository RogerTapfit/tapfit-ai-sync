import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGymTheme } from '@/contexts/GymThemeContext';
import { Palette, Check } from 'lucide-react';

interface GymThemeSwitcherProps {
  trigger?: React.ReactNode;
}

export const GymThemeSwitcher: React.FC<GymThemeSwitcherProps> = ({ trigger }) => {
  const { currentGym, availableGyms, setGym, isDemo } = useGymTheme();
  const [open, setOpen] = useState(false);

  const handleSelectGym = (gymId: string) => {
    setGym(gymId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Palette className="h-4 w-4" />
            Theme
            {isDemo && (
              <Badge variant="secondary" className="ml-1 text-xs">Demo</Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Gym Partner Themes
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Preview how TapFit looks with different gym partner branding
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {availableGyms.map((gym) => {
            const isSelected = currentGym === gym.id;
            const primaryHsl = gym.colors.primary;
            
            return (
              <button
                key={gym.id}
                onClick={() => handleSelectGym(gym.id)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200
                  hover:scale-[1.02] active:scale-[0.98]
                  ${isSelected 
                    ? 'border-primary ring-2 ring-primary/30' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
                style={{
                  background: `linear-gradient(135deg, hsl(${primaryHsl} / 0.15) 0%, hsl(${primaryHsl} / 0.05) 100%)`,
                }}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}

                {/* Logo */}
                <div className="h-12 mb-3 flex items-center justify-center">
                  <img 
                    src={gym.logoUrl} 
                    alt={gym.displayName}
                    className="max-h-12 max-w-full object-contain"
                  />
                </div>

                {/* Name */}
                <p className="text-sm font-medium text-center truncate">
                  {gym.displayName}
                </p>

                {/* Color preview dots */}
                <div className="flex justify-center gap-1 mt-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: `hsl(${gym.colors.primary})` }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: `hsl(${gym.colors.accent})` }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: `hsl(${gym.colors.background})` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {isDemo && (
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-center text-muted-foreground">
              <Badge variant="secondary" className="mr-1">Demo Mode</Badge>
              You're previewing partner gym branding. 
              <button 
                onClick={() => handleSelectGym('tapfit')}
                className="text-primary underline ml-1"
              >
                Reset to TapFit
              </button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
