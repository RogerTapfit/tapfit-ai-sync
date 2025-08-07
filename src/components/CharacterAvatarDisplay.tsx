import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RobotAvatarData } from '@/hooks/useRobotAvatar';

interface CharacterAvatarDisplayProps {
  avatarData: RobotAvatarData;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
  className?: string;
  emotion?: 'happy' | 'excited' | 'focused' | 'celebrating' | 'resting' | 'charging' | 'scanning';
  pose?: 'idle' | 'flexing' | 'victory' | 'workout' | 'champion' | 'power_up' | 'scan_mode';
}

export const CharacterAvatarDisplay = ({ 
  avatarData, 
  size = 'medium', 
  showAnimation = true, 
  className = '',
  emotion = 'happy',
  pose = 'idle'
}: CharacterAvatarDisplayProps) => {
  const sizeClasses = {
    small: 'w-16 h-16 min-w-16 min-h-16',
    medium: 'w-24 h-24 min-w-24 min-h-24 sm:w-32 sm:h-32',
    large: 'w-full h-full max-w-full max-h-full min-w-32 min-h-32'
  };

  // Character image mapping to actual robot images
  const getCharacterImage = (characterType: string) => {
    const characterImages = {
      shadow_eagle: '/lovable-uploads/27cddadb-e225-480e-a614-c725b169ba44.png', // Blue eagle robot
      emerald_chameleon: '/lovable-uploads/2a0aaf68-4405-4647-a95b-730174a6fe3a.png', // Green chameleon robot
      cyber_panda: '/lovable-uploads/79a266e1-e0f4-4558-9496-c75a57fe4fec.png', // Panda robot
      lightning_cheetah: '/lovable-uploads/11650ae8-731f-445a-8014-4248533521a7.png', // Cheetah robot
      mystic_fox: '/lovable-uploads/5cd8a425-4161-4a2f-99a6-6fe7f4285ccc.png', // Purple fox robot
      iron_guardian: '/lovable-uploads/6ba39a66-8012-413c-8358-7eff61357bb3.png', // Red guardian robot
      cosmic_bunny: '/lovable-uploads/a0730c0a-c88b-43fa-b6d0-fad9941cc39b.png', // Purple/dark bunny robot
      steel_warrior: '/lovable-uploads/207f2108-2371-4a5e-a73a-f6fa32711561.png', // Red armored warrior robot
      cyber_dragon: '/lovable-uploads/2bdee4e4-d58f-4a51-96fc-5d7e92eeced9.png', // Gray dragon robot with horns
      gorilla_guardian: '/lovable-uploads/81dac889-b82f-4359-a3a6-a77b066d007c.png', // Gray gorilla robot
      demon_bull: '/lovable-uploads/af389dea-9b59-4435-99bb-8c851f048940.png' // Red/black bull robot
    };

    return characterImages[characterType as keyof typeof characterImages] || characterImages.steel_warrior;
  };

  // Character features for display names and emojis
  const getCharacterFeatures = (characterType: string) => {
    const features = {
      shadow_eagle: { emoji: '🦅', name: 'Shadow Eagle' },
      emerald_chameleon: { emoji: '🦎', name: 'Emerald Chameleon' },
      cyber_panda: { emoji: '🐼', name: 'Cyber Panda' },
      lightning_cheetah: { emoji: '🐆', name: 'Lightning Cheetah' },
      mystic_fox: { emoji: '🦊', name: 'Mystic Fox' },
      iron_guardian: { emoji: '🛡️', name: 'Iron Guardian' },
      cosmic_bunny: { emoji: '🐰', name: 'Cosmic Bunny' },
      steel_warrior: { emoji: '⚔️', name: 'Steel Warrior' },
      cyber_dragon: { emoji: '🐉', name: 'Cyber Dragon' },
      gorilla_guardian: { emoji: '🦍', name: 'Gorilla Guardian' },
      demon_bull: { emoji: '🐂', name: 'Demon Bull' }
    };

    return features[characterType as keyof typeof features] || features.steel_warrior;
  };

  const getCurrentPose = (pose: string) => {
    switch (pose) {
      case 'flexing': return 'scale-105 -rotate-2';
      case 'victory': return 'scale-110 rotate-1';
      case 'workout': return 'scale-105 animate-pulse';
      case 'champion': return 'scale-110 animate-bounce';
      case 'power_up': return 'scale-105 animate-pulse';
      case 'scan_mode': return 'animate-pulse';
      default: return '';
    }
  };

  const getHueRotation = (hue: number) => {
    return { filter: `hue-rotate(${hue}deg)` };
  };

  const character = getCharacterFeatures(avatarData.character_type);
  const currentPose = getCurrentPose(pose);
  const characterImage = getCharacterImage(avatarData.character_type);

  return (
    <Card className={`${sizeClasses[size]} ${className} relative overflow-hidden border-2 shadow-xl transition-all duration-300 ${showAnimation ? 'hover:scale-105' : ''}`}>
      
      {/* Character Header */}
      <div className="absolute top-1 left-1 right-1 flex justify-between items-center z-10">
        <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
          {character.emoji} {character.name}
        </Badge>
        <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
          ⚡{avatarData.power_level}%
        </Badge>
      </div>

      {/* Robot Image Display */}
      <div className={`absolute inset-0 flex items-center justify-center p-2 ${currentPose} transition-transform duration-300`}>
        <img 
          src={characterImage}
          alt={`${character.name} robot avatar`}
          className="w-full h-full object-contain rounded-lg"
          style={getHueRotation(avatarData.base_hue || 0)}
          onError={(e) => {
            // Fallback to a default robot image or emoji
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.parentElement?.querySelector('.fallback-emoji');
            if (fallback) {
              (fallback as HTMLElement).style.display = 'flex';
            }
          }}
        />
        
        {/* Fallback emoji display */}
        <div className="fallback-emoji hidden w-full h-full items-center justify-center text-4xl">
          {character.emoji}
        </div>
      </div>

      {/* Speech bubble for animations */}
      {showAnimation && emotion === 'celebrating' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-lg px-2 py-1 text-xs animate-bounce">
          🎉 Level Up!
        </div>
      )}

      {showAnimation && emotion === 'scanning' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-lg px-2 py-1 text-xs animate-pulse">
          🔍 Scanning...
        </div>
      )}

      {showAnimation && emotion === 'excited' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-lg px-2 py-1 text-xs animate-bounce">
          ⚡ Ready!
        </div>
      )}

      {showAnimation && emotion === 'charging' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-lg px-2 py-1 text-xs animate-pulse">
          🔋 Charging...
        </div>
      )}
    </Card>
  );
};

export default React.memo(CharacterAvatarDisplay, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.avatarData) === JSON.stringify(nextProps.avatarData) &&
         prevProps.size === nextProps.size &&
         prevProps.emotion === nextProps.emotion &&
         prevProps.pose === nextProps.pose;
});