import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAvatars } from '@/hooks/useAvatarImage';
import { Loader2 } from 'lucide-react';

interface CharacterSelectorProps {
  selectedCharacter?: string;
  onCharacterSelect: (characterId: string) => void;
  onPreview?: (characterId: string) => void;
}

export const CharacterSelector = ({
  selectedCharacter,
  onCharacterSelect,
  onPreview
}: CharacterSelectorProps) => {
  const { data: avatars, isLoading } = useAvatars();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!avatars || avatars.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No coaches available. Please contact support.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {avatars.map((avatar) => {
        const selected = selectedCharacter === avatar.id;

        return (
          <Card 
            key={avatar.id}
            className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
              selected ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
            onClick={() => {
              if (onPreview) {
                onPreview(avatar.id);
              }
              onCharacterSelect(avatar.id);
            }}
          >
            <CardContent className="p-4 text-center space-y-2">
              
              {/* Coach Image */}
              <div className="w-full aspect-square mb-2 rounded-lg overflow-hidden bg-muted">
                <img 
                  src={avatar.image_url}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
              </div>
              
              {/* Coach Name */}
              <h3 className="font-semibold text-sm">{avatar.name}</h3>
              
              {/* Select Button */}
              <Button 
                size="sm" 
                variant={selected ? "default" : "outline"}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onCharacterSelect(avatar.id);
                }}
              >
                {selected ? '✓ Selected' : 'Select'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};