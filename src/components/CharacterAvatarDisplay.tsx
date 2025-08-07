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

  const bodySize = {
    small: { body: 'w-6 h-8', head: 'w-4 h-4', core: 'w-2 h-2' },
    medium: { body: 'w-8 h-10 sm:w-12 sm:h-16', head: 'w-6 h-6 sm:w-8 sm:h-8', core: 'w-3 h-3 sm:w-4 sm:h-4' },
    large: { body: 'w-12 h-16 sm:w-18 sm:h-24', head: 'w-8 h-8 sm:w-12 sm:h-12', core: 'w-4 h-4 sm:w-6 sm:h-6' }
  };

  // Character-specific visual features
  const getCharacterFeatures = (characterType: string) => {
    const features = {
      shadow_eagle: {
        emoji: '🦅',
        wings: true,
        horns: false,
        tail: false,
        species: 'avian',
        personality: 'fierce',
        special: ['wings', 'sharp_talons', 'keen_eyes']
      },
      emerald_chameleon: {
        emoji: '🦎',
        wings: false,
        horns: false,
        tail: true,
        species: 'reptilian',
        personality: 'adaptive',
        special: ['color_changing', 'long_tail', 'large_eyes']
      },
      cyber_panda: {
        emoji: '🐼',
        wings: false,
        horns: false,
        tail: false,
        species: 'ursine',
        personality: 'friendly',
        special: ['round_ears', 'cute_face', 'tech_patches']
      },
      lightning_cheetah: {
        emoji: '🐆',
        wings: false,
        horns: false,
        tail: true,
        species: 'feline',
        personality: 'agile',
        special: ['spots', 'sleek_build', 'speed_lines']
      },
      mystic_fox: {
        emoji: '🦊',
        wings: false,
        horns: false,
        tail: true,
        species: 'vulpine',
        personality: 'wise',
        special: ['fluffy_tail', 'pointed_ears', 'mystical_aura']
      },
      iron_guardian: {
        emoji: '🛡️',
        wings: false,
        horns: false,
        tail: false,
        species: 'armored',
        personality: 'protective',
        special: ['heavy_armor', 'shield_plates', 'guardian_stance']
      },
      cosmic_bunny: {
        emoji: '🐰',
        wings: false,
        horns: false,
        tail: true,
        species: 'lagomorph',
        personality: 'energetic',
        special: ['long_ears', 'cotton_tail', 'cosmic_patterns']
      },
      steel_warrior: {
        emoji: '⚔️',
        wings: false,
        horns: false,
        tail: false,
        species: 'humanoid',
        personality: 'determined',
        special: ['armor_plating', 'weapon_mounts', 'battle_stance']
      },
      cyber_dragon: {
        emoji: '🐉',
        wings: true,
        horns: true,
        tail: true,
        species: 'draconic',
        personality: 'fierce',
        special: ['large_horns', 'dragon_wings', 'fangs', 'powerful_stance']
      },
      gorilla_guardian: {
        emoji: '🦍',
        wings: false,
        horns: false,
        tail: false,
        species: 'primate',
        personality: 'strong',
        special: ['muscular_build', 'broad_shoulders', 'protective_stance']
      },
      demon_bull: {
        emoji: '🐂',
        wings: false,
        horns: true,
        tail: true,
        species: 'bovine',
        personality: 'intimidating',
        special: ['large_horns', 'bull_stance', 'heavy_armor']
      }
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

  const getEyeDisplay = (emotion: string, characterType: string) => {
    const baseClass = "w-2 h-2 bg-cyan-400 rounded-full animate-pulse";
    
    switch (emotion) {
      case 'excited': return `${baseClass} shadow-lg shadow-cyan-400/50 animate-bounce`;
      case 'focused': return `${baseClass} shadow-md shadow-blue-400/50`;
      case 'celebrating': return `${baseClass} shadow-xl shadow-yellow-400/50 animate-ping`;
      case 'charging': return `${baseClass} shadow-lg shadow-green-400/50 animate-pulse`;
      case 'scanning': return `${baseClass} shadow-md shadow-red-400/50 animate-ping`;
      default: return `${baseClass} shadow-md shadow-cyan-400/30`;
    }
  };

  const getHueRotation = (hue: number) => {
    return { filter: `hue-rotate(${hue}deg)` };
  };

  const character = getCharacterFeatures(avatarData.character_type);
  const currentPose = getCurrentPose(pose);
  const currentBodySize = bodySize[size];

  return (
    <Card className={`${sizeClasses[size]} ${className} relative overflow-hidden border-2 shadow-xl transition-all duration-300 ${showAnimation ? 'hover:scale-105' : ''}`}
          style={getHueRotation(avatarData.base_hue || 0)}>
      
      {/* Character Header */}
      <div className="absolute top-1 left-1 right-1 flex justify-between items-center z-10">
        <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
          {character.emoji} {avatarData.character_type.replace('_', ' ').toUpperCase()}
        </Badge>
        <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
          ⚡{avatarData.power_level}%
        </Badge>
      </div>

      {/* Character Body Container */}
      <div className={`absolute inset-0 flex items-center justify-center ${currentPose} transition-transform duration-300`}>
        
        {/* Wings (for flying characters) */}
        {character.wings && (
          <>
            <div className="absolute -left-2 top-1/3 w-6 h-8 bg-gradient-to-r from-slate-600 to-slate-400 rounded-full transform -rotate-12 animate-pulse" />
            <div className="absolute -right-2 top-1/3 w-6 h-8 bg-gradient-to-l from-slate-600 to-slate-400 rounded-full transform rotate-12 animate-pulse" />
          </>
        )}

        {/* Main Character Body */}
        <div className="relative flex flex-col items-center">
          
          {/* Horns (for horned characters) */}
          {character.horns && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              <div className="w-1 h-3 bg-gradient-to-t from-stone-600 to-stone-400 rounded-full transform -rotate-12" />
              <div className="w-1 h-3 bg-gradient-to-t from-stone-600 to-stone-400 rounded-full transform rotate-12" />
            </div>
          )}

          {/* Head */}
          <div className={`${currentBodySize.head} relative bg-gradient-to-br from-slate-300 to-slate-500 rounded-full shadow-lg border-2 border-slate-400`}>
            
            {/* Character-specific head features */}
            {character.species === 'ursine' && (
              <>
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-slate-400 rounded-full" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-slate-400 rounded-full" />
              </>
            )}
            
            {character.species === 'lagomorph' && (
              <>
                <div className="absolute -top-2 left-1/4 w-1 h-4 bg-slate-400 rounded-full transform -rotate-12" />
                <div className="absolute -top-2 right-1/4 w-1 h-4 bg-slate-400 rounded-full transform rotate-12" />
              </>
            )}

            {character.species === 'vulpine' && (
              <>
                <div className="absolute -top-1 left-0 w-2 h-3 bg-slate-400 rounded-full transform -rotate-45" />
                <div className="absolute -top-1 right-0 w-2 h-3 bg-slate-400 rounded-full transform rotate-45" />
              </>
            )}

            {/* Eyes */}
            <div className="absolute top-1/3 left-1/4 right-1/4 flex justify-between">
              <div className={getEyeDisplay(emotion, avatarData.character_type)} />
              <div className={getEyeDisplay(emotion, avatarData.character_type)} />
            </div>

            {/* Character Expression */}
            {character.species === 'draconic' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs">🔥</div>
            )}
          </div>

          {/* Body */}
          <div className={`${currentBodySize.body} relative bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg shadow-lg border-2 border-slate-500 mt-1`}>
            
            {/* Energy Core */}
            <div className={`${currentBodySize.core} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-lg animate-pulse`} />
            
            {/* Character-specific body features */}
            {character.species === 'feline' && (
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 to-orange-200/20 rounded-lg">
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-orange-400 rounded-full" />
                <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-orange-400 rounded-full" />
                <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-orange-400 rounded-full" />
              </div>
            )}

            {character.species === 'armored' && (
              <div className="absolute inset-0 border border-slate-300 rounded-lg">
                <div className="absolute top-1/4 left-0 right-0 h-px bg-slate-300" />
                <div className="absolute bottom-1/4 left-0 right-0 h-px bg-slate-300" />
              </div>
            )}
          </div>

          {/* Tail (for tailed characters) */}
          {character.tail && (
            <div className="absolute -bottom-2 -right-3 w-4 h-2 bg-gradient-to-r from-slate-500 to-slate-400 rounded-full transform rotate-45" />
          )}
        </div>
      </div>

      {/* Character Speech Bubble */}
      {showAnimation && emotion !== 'resting' && (
        <div className="absolute bottom-1 left-1 right-1 text-center">
          <div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs border">
            {emotion === 'celebrating' && '🎉 Victory!'}
            {emotion === 'excited' && '⚡ Ready!'}
            {emotion === 'focused' && '🎯 Focused'}
            {emotion === 'charging' && '🔋 Charging...'}
            {emotion === 'scanning' && '👁️ Scanning...'}
            {emotion === 'happy' && `💪 ${character.personality.toUpperCase()}`}
          </div>
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