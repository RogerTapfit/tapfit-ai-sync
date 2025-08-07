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

  // Enhanced character-specific visual features and rendering
  const getCharacterFeatures = (characterType: string) => {
    const features = {
      shadow_eagle: {
        emoji: '🦅',
        wings: true,
        horns: false,
        tail: false,
        species: 'avian',
        personality: 'fierce',
        colors: 'from-gray-800 to-gray-600',
        accent: 'from-amber-600 to-amber-800',
        special: ['wings', 'sharp_talons', 'keen_eyes']
      },
      emerald_chameleon: {
        emoji: '🦎',
        wings: false,
        horns: false,
        tail: true,
        species: 'reptilian',
        personality: 'adaptive',
        colors: 'from-emerald-600 to-green-800',
        accent: 'from-lime-400 to-emerald-600',
        special: ['color_changing', 'long_tail', 'large_eyes']
      },
      cyber_panda: {
        emoji: '🐼',
        wings: false,
        horns: false,
        tail: false,
        species: 'ursine',
        personality: 'friendly',
        colors: 'from-gray-100 to-gray-300',
        accent: 'from-gray-800 to-gray-900',
        special: ['round_ears', 'cute_face', 'tech_patches']
      },
      lightning_cheetah: {
        emoji: '🐆',
        wings: false,
        horns: false,
        tail: true,
        species: 'feline',
        personality: 'agile',
        colors: 'from-yellow-600 to-orange-800',
        accent: 'from-blue-400 to-purple-600',
        special: ['spots', 'sleek_build', 'speed_lines']
      },
      mystic_fox: {
        emoji: '🦊',
        wings: false,
        horns: false,
        tail: true,
        species: 'vulpine',
        personality: 'wise',
        colors: 'from-orange-600 to-red-800',
        accent: 'from-purple-500 to-pink-700',
        special: ['fluffy_tail', 'pointed_ears', 'mystical_aura']
      },
      iron_guardian: {
        emoji: '🛡️',
        wings: false,
        horns: false,
        tail: false,
        species: 'armored',
        personality: 'protective',
        colors: 'from-gray-600 to-gray-800',
        accent: 'from-blue-500 to-cyan-700',
        special: ['heavy_armor', 'shield_plates', 'guardian_stance']
      },
      cosmic_bunny: {
        emoji: '🐰',
        wings: false,
        horns: false,
        tail: true,
        species: 'lagomorph',
        personality: 'energetic',
        colors: 'from-purple-600 to-blue-800',
        accent: 'from-pink-400 to-purple-600',
        special: ['long_ears', 'cotton_tail', 'cosmic_patterns']
      },
      steel_warrior: {
        emoji: '⚔️',
        wings: false,
        horns: false,
        tail: false,
        species: 'humanoid',
        personality: 'determined',
        colors: 'from-slate-500 to-slate-700',
        accent: 'from-red-500 to-orange-700',
        special: ['armor_plating', 'weapon_mounts', 'battle_stance']
      },
      cyber_dragon: {
        emoji: '🐉',
        wings: true,
        horns: true,
        tail: true,
        species: 'draconic',
        personality: 'legendary',
        colors: 'from-red-700 to-red-900',
        accent: 'from-orange-500 to-yellow-600',
        special: ['large_horns', 'dragon_wings', 'fangs', 'powerful_stance']
      },
      gorilla_guardian: {
        emoji: '🦍',
        wings: false,
        horns: false,
        tail: false,
        species: 'primate',
        personality: 'strong',
        colors: 'from-stone-700 to-stone-900',
        accent: 'from-green-500 to-teal-700',
        special: ['muscular_build', 'broad_shoulders', 'protective_stance']
      },
      demon_bull: {
        emoji: '🐂',
        wings: false,
        horns: true,
        tail: true,
        species: 'bovine',
        personality: 'intimidating',
        colors: 'from-red-900 to-black',
        accent: 'from-red-600 to-orange-800',
        special: ['large_horns', 'bull_stance', 'heavy_armor']
      }
    };

    return features[characterType as keyof typeof features] || features.steel_warrior;
  };

  // Enhanced character rendering functions
  const renderCharacterSpecificFeatures = (character: any, size: string) => {
    const characterType = avatarData.character_type;
    const bodySize = {
      small: { feature: 'w-1 h-2', large: 'w-2 h-3' },
      medium: { feature: 'w-2 h-3', large: 'w-3 h-4' },
      large: { feature: 'w-3 h-4', large: 'w-4 h-6' }
    }[size];

    switch (characterType) {
      case 'shadow_eagle':
        return (
          <>
            {/* Eagle beak */}
            <div className="absolute top-2/3 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-gradient-to-b from-yellow-600 to-orange-700 clip-triangle" />
            {/* Feather details */}
            <div className="absolute top-1/4 left-1/4 w-px h-2 bg-amber-700 transform rotate-45" />
            <div className="absolute top-1/4 right-1/4 w-px h-2 bg-amber-700 transform -rotate-45" />
          </>
        );
      
      case 'cyber_dragon':
        return (
          <>
            {/* Dragon snout */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-gradient-to-b from-red-600 to-red-800 rounded-b-lg" />
            {/* Nostril flames */}
            <div className="absolute bottom-1 left-1/3 w-1 h-1 bg-orange-500 rounded-full animate-pulse" />
            <div className="absolute bottom-1 right-1/3 w-1 h-1 bg-orange-500 rounded-full animate-pulse" />
            {/* Scale texture */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-400 rounded-full" />
              <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-red-400 rounded-full" />
              <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-red-400 rounded-full" />
            </div>
          </>
        );

      case 'cyber_panda':
        return (
          <>
            {/* Panda eye patches */}
            <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-gray-900 rounded-full" />
            <div className="absolute top-1/4 right-1/6 w-2 h-2 bg-gray-900 rounded-full" />
            {/* Tech patches on ears */}
            <div className="absolute -top-1 -left-1 w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
            <div className="absolute -top-1 -right-1 w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
          </>
        );

      case 'lightning_cheetah':
        return (
          <>
            {/* Cheetah tear marks */}
            <div className="absolute top-1/2 left-1/6 w-px h-3 bg-gray-800 rounded-full" />
            <div className="absolute top-1/2 right-1/6 w-px h-3 bg-gray-800 rounded-full" />
            {/* Lightning marks */}
            <div className="absolute top-1/4 left-1/3 w-2 h-px bg-blue-400 transform rotate-45" />
            <div className="absolute top-1/4 right-1/3 w-2 h-px bg-blue-400 transform -rotate-45" />
          </>
        );

      case 'gorilla_guardian':
        return (
          <>
            {/* Gorilla brow ridge */}
            <div className="absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-stone-800 to-stone-600 rounded-full" />
            {/* Nostril flares */}
            <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-stone-900 rounded-full" />
            <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-stone-900 rounded-full" />
          </>
        );

      case 'mystic_fox':
        return (
          <>
            {/* Fox snout */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-b from-orange-600 to-red-700 rounded-b-lg" />
            {/* Mystical markings */}
            <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-purple-500 rounded-full animate-pulse" />
            <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-500 rounded-full animate-pulse" />
            {/* Whisker marks */}
            <div className="absolute top-1/2 left-0 w-2 h-px bg-orange-700" />
            <div className="absolute top-1/2 right-0 w-2 h-px bg-orange-700" />
          </>
        );

      default:
        return null;
    }
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
        
        {/* Enhanced Wings (for flying characters) */}
        {character.wings && (
          <>
            {avatarData.character_type === 'shadow_eagle' ? (
              <>
                {/* Eagle wings with feather detail */}
                <div className="absolute -left-3 top-1/4 w-8 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full transform -rotate-12 shadow-lg">
                  <div className="absolute inset-1 border border-gray-600 rounded-full" />
                  <div className="absolute top-2 left-1 w-1 h-6 bg-gray-800 rounded-full" />
                  <div className="absolute top-4 left-2 w-1 h-4 bg-gray-800 rounded-full" />
                </div>
                <div className="absolute -right-3 top-1/4 w-8 h-12 bg-gradient-to-bl from-gray-700 to-gray-900 rounded-full transform rotate-12 shadow-lg">
                  <div className="absolute inset-1 border border-gray-600 rounded-full" />
                  <div className="absolute top-2 right-1 w-1 h-6 bg-gray-800 rounded-full" />
                  <div className="absolute top-4 right-2 w-1 h-4 bg-gray-800 rounded-full" />
                </div>
              </>
            ) : avatarData.character_type === 'cyber_dragon' ? (
              <>
                {/* Dragon wings with membrane detail */}
                <div className="absolute -left-4 top-1/4 w-10 h-14 bg-gradient-to-br from-red-800 to-red-900 transform -rotate-12 shadow-xl">
                  <div className="absolute inset-2 bg-gradient-to-br from-red-600/50 to-red-800/50 rounded" />
                  <div className="absolute top-2 left-2 w-2 h-8 bg-red-900 rounded-full" />
                  <div className="absolute top-4 left-4 w-1 h-6 bg-red-900 rounded-full" />
                  <div className="absolute bottom-2 left-1 w-3 h-2 bg-orange-600 rounded-full animate-pulse" />
                </div>
                <div className="absolute -right-4 top-1/4 w-10 h-14 bg-gradient-to-bl from-red-800 to-red-900 transform rotate-12 shadow-xl">
                  <div className="absolute inset-2 bg-gradient-to-bl from-red-600/50 to-red-800/50 rounded" />
                  <div className="absolute top-2 right-2 w-2 h-8 bg-red-900 rounded-full" />
                  <div className="absolute top-4 right-4 w-1 h-6 bg-red-900 rounded-full" />
                  <div className="absolute bottom-2 right-1 w-3 h-2 bg-orange-600 rounded-full animate-pulse" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute -left-2 top-1/3 w-6 h-8 bg-gradient-to-r from-slate-600 to-slate-400 rounded-full transform -rotate-12 animate-pulse" />
                <div className="absolute -right-2 top-1/3 w-6 h-8 bg-gradient-to-l from-slate-600 to-slate-400 rounded-full transform rotate-12 animate-pulse" />
              </>
            )}
          </>
        )}

        {/* Main Character Body */}
        <div className="relative flex flex-col items-center">
          
          {/* Enhanced Horns (for horned characters) */}
          {character.horns && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {avatarData.character_type === 'cyber_dragon' ? (
                <>
                  {/* Large dragon horns */}
                  <div className="w-2 h-6 bg-gradient-to-t from-red-900 to-red-700 rounded-full transform -rotate-12 shadow-lg">
                    <div className="absolute top-1 left-0 w-1 h-4 bg-red-800 rounded-full" />
                  </div>
                  <div className="w-2 h-6 bg-gradient-to-t from-red-900 to-red-700 rounded-full transform rotate-12 shadow-lg">
                    <div className="absolute top-1 right-0 w-1 h-4 bg-red-800 rounded-full" />
                  </div>
                </>
              ) : avatarData.character_type === 'demon_bull' ? (
                <>
                  {/* Curved bull horns */}
                  <div className="w-2 h-5 bg-gradient-to-t from-stone-800 to-stone-600 rounded-full transform -rotate-45 shadow-lg" />
                  <div className="w-2 h-5 bg-gradient-to-t from-stone-800 to-stone-600 rounded-full transform rotate-45 shadow-lg" />
                </>
              ) : (
                <>
                  <div className="w-1 h-3 bg-gradient-to-t from-stone-600 to-stone-400 rounded-full transform -rotate-12" />
                  <div className="w-1 h-3 bg-gradient-to-t from-stone-600 to-stone-400 rounded-full transform rotate-12" />
                </>
              )}
            </div>
          )}

          {/* Enhanced Character Head */}
          <div className={`${currentBodySize.head} relative bg-gradient-to-br ${character.colors} rounded-full shadow-lg border-2 border-opacity-50`}
               style={getHueRotation(avatarData.base_hue || 0)}>
            
            {/* Character-specific head features */}
            {character.species === 'ursine' && (
              <>
                {/* Panda ears */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-gray-900 rounded-full shadow-md" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-900 rounded-full shadow-md" />
                {/* Inner ears */}
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-pink-300 rounded-full" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-300 rounded-full" />
              </>
            )}
            
            {character.species === 'lagomorph' && (
              <>
                {/* Long bunny ears */}
                <div className="absolute -top-4 left-1/4 w-2 h-6 bg-gradient-to-t from-purple-600 to-purple-400 rounded-full transform -rotate-12 shadow-md" />
                <div className="absolute -top-4 right-1/4 w-2 h-6 bg-gradient-to-t from-purple-600 to-purple-400 rounded-full transform rotate-12 shadow-md" />
                {/* Cosmic patterns on ears */}
                <div className="absolute -top-3 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse" />
                <div className="absolute -top-3 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse" />
              </>
            )}

            {character.species === 'vulpine' && (
              <>
                {/* Pointed fox ears */}
                <div className="absolute -top-2 left-1/6 w-3 h-4 bg-gradient-to-t from-orange-700 to-orange-500 rounded-full transform -rotate-45 shadow-md" />
                <div className="absolute -top-2 right-1/6 w-3 h-4 bg-gradient-to-t from-orange-700 to-orange-500 rounded-full transform rotate-45 shadow-md" />
                {/* Mystical aura */}
                <div className="absolute -top-1 left-1/6 w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
                <div className="absolute -top-1 right-1/6 w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
              </>
            )}

            {character.species === 'feline' && (
              <>
                {/* Cat ears */}
                <div className="absolute -top-2 left-1/4 w-2 h-3 bg-gradient-to-t from-yellow-700 to-yellow-500 rounded-full transform -rotate-12" />
                <div className="absolute -top-2 right-1/4 w-2 h-3 bg-gradient-to-t from-yellow-700 to-yellow-500 rounded-full transform rotate-12" />
              </>
            )}

            {character.species === 'avian' && (
              <>
                {/* Eagle crest */}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-600 rounded-full" />
              </>
            )}

            {character.species === 'primate' && (
              <>
                {/* Gorilla ears */}
                <div className="absolute top-0 -left-1 w-2 h-3 bg-gradient-to-br from-stone-600 to-stone-800 rounded-full" />
                <div className="absolute top-0 -right-1 w-2 h-3 bg-gradient-to-bl from-stone-600 to-stone-800 rounded-full" />
              </>
            )}

            {character.species === 'bovine' && (
              <>
                {/* Bull ears */}
                <div className="absolute top-1/4 -left-1 w-2 h-2 bg-gradient-to-br from-red-800 to-black rounded-full" />
                <div className="absolute top-1/4 -right-1 w-2 h-2 bg-gradient-to-bl from-red-800 to-black rounded-full" />
              </>
            )}

            {character.species === 'reptilian' && (
              <>
                {/* Chameleon crest */}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-gradient-to-r from-green-600 to-emerald-800 rounded-full" />
              </>
            )}

            {/* Enhanced Eyes */}
            <div className="absolute top-1/3 left-1/4 right-1/4 flex justify-between">
              <div className={getEyeDisplay(emotion, avatarData.character_type)} />
              <div className={getEyeDisplay(emotion, avatarData.character_type)} />
            </div>

            {/* Character-specific facial features */}
            {renderCharacterSpecificFeatures(character, size)}
          </div>

          {/* Enhanced Character Body */}
          <div className={`${currentBodySize.body} relative bg-gradient-to-br ${character.colors} rounded-lg shadow-lg border-2 border-opacity-50 mt-1`}
               style={getHueRotation(avatarData.base_hue || 0)}>
            
            {/* Energy Core */}
            <div className={`${currentBodySize.core} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br ${character.accent} rounded-full shadow-lg animate-pulse`} />
            
            {/* Character-specific body features and textures */}
            {character.species === 'feline' && (
              <div className="absolute inset-0 rounded-lg">
                {/* Cheetah spots */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gray-900 rounded-full opacity-60" />
                <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-gray-900 rounded-full opacity-60" />
                <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-gray-900 rounded-full opacity-60" />
                <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-gray-900 rounded-full opacity-60" />
                <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-gray-900 rounded-full opacity-60" />
                {/* Lightning effects */}
                <div className="absolute top-1/4 left-0 w-full h-px bg-blue-400 opacity-50 animate-pulse" />
                <div className="absolute bottom-1/4 left-0 w-full h-px bg-purple-400 opacity-50 animate-pulse" />
              </div>
            )}

            {character.species === 'armored' && (
              <div className="absolute inset-0 border-2 border-cyan-300 rounded-lg opacity-60">
                <div className="absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-cyan-300 to-blue-400 opacity-80" />
                <div className="absolute bottom-1/4 left-0 right-0 h-1 bg-gradient-to-r from-cyan-300 to-blue-400 opacity-80" />
                <div className="absolute top-0 bottom-0 left-1/4 w-1 bg-gradient-to-b from-cyan-300 to-blue-400 opacity-80" />
                <div className="absolute top-0 bottom-0 right-1/4 w-1 bg-gradient-to-b from-cyan-300 to-blue-400 opacity-80" />
              </div>
            )}

            {character.species === 'draconic' && (
              <div className="absolute inset-0 rounded-lg">
                {/* Dragon scales */}
                <div className="absolute top-1/4 left-1/4 w-2 h-1 bg-red-800 rounded-full opacity-70 transform rotate-45" />
                <div className="absolute top-1/2 right-1/4 w-2 h-1 bg-red-800 rounded-full opacity-70 transform -rotate-45" />
                <div className="absolute bottom-1/4 left-1/3 w-2 h-1 bg-red-800 rounded-full opacity-70 transform rotate-12" />
                {/* Fire glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-600/20 to-transparent rounded-lg" />
              </div>
            )}

            {character.species === 'primate' && (
              <div className="absolute inset-0 rounded-lg">
                {/* Gorilla muscle definition */}
                <div className="absolute top-1/4 left-1/8 right-1/8 h-1 bg-stone-800 rounded-full opacity-60" />
                <div className="absolute bottom-1/4 left-1/8 right-1/8 h-1 bg-stone-800 rounded-full opacity-60" />
                <div className="absolute top-1/2 left-1/4 right-1/4 h-2 bg-gradient-to-r from-stone-700 to-stone-600 rounded-full opacity-40" />
              </div>
            )}

            {character.species === 'ursine' && (
              <div className="absolute inset-0 rounded-lg">
                {/* Panda tech panels */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded opacity-80" />
                <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-cyan-400 rounded opacity-80" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full animate-pulse" />
              </div>
            )}

            {character.species === 'reptilian' && (
              <div className="absolute inset-0 rounded-lg">
                {/* Chameleon texture */}
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-lime-400 rounded-full animate-pulse" />
                <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                {/* Color-changing effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-300/20 to-emerald-500/20 rounded-lg animate-pulse" />
              </div>
            )}

            {character.species === 'lagomorph' && (
              <div className="absolute inset-0 rounded-lg">
                {/* Cosmic patterns */}
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse" />
                <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-300 rounded-full animate-pulse" />
                <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-purple-300 rounded-full animate-pulse" />
                <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-pink-300 rounded-full animate-pulse" />
                {/* Star field effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-blue-600/20 rounded-lg" />
              </div>
            )}

            {character.species === 'vulpine' && (
              <div className="absolute inset-0 rounded-lg">
                {/* Mystical patterns */}
                <div className="absolute top-1/4 left-1/4 w-2 h-1 bg-purple-500 rounded-full opacity-60 animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-2 h-1 bg-pink-500 rounded-full opacity-60 animate-pulse" />
                {/* Mystical aura */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-lg animate-pulse" />
              </div>
            )}

            {character.species === 'bovine' && (
              <div className="absolute inset-0 rounded-lg">
                {/* Bull armor plates */}
                <div className="absolute top-1/4 left-1/8 right-1/8 h-1 bg-red-800 rounded-full" />
                <div className="absolute bottom-1/4 left-1/8 right-1/8 h-1 bg-red-800 rounded-full" />
                <div className="absolute top-1/2 left-1/4 right-1/4 h-2 bg-gradient-to-r from-red-900 to-black rounded-full opacity-80" />
              </div>
            )}

            {character.species === 'avian' && (
              <div className="absolute inset-0 rounded-lg">
                {/* Feather patterns */}
                <div className="absolute top-1/4 left-1/4 w-1 h-2 bg-amber-700 rounded-full transform rotate-45" />
                <div className="absolute top-1/2 right-1/4 w-1 h-2 bg-amber-700 rounded-full transform -rotate-45" />
                <div className="absolute bottom-1/4 left-1/3 w-1 h-2 bg-amber-700 rounded-full transform rotate-12" />
              </div>
            )}
          </div>

          {/* Enhanced Tail (for tailed characters) */}
          {character.tail && (
            <>
              {avatarData.character_type === 'cyber_dragon' && (
                <div className="absolute -bottom-3 -right-4 w-6 h-3 bg-gradient-to-r from-red-800 to-red-900 rounded-full transform rotate-45 shadow-lg">
                  <div className="absolute top-1 left-1 w-2 h-1 bg-red-700 rounded-full" />
                  <div className="absolute bottom-0 right-0 w-1 h-1 bg-orange-600 rounded-full animate-pulse" />
                </div>
              )}
              {avatarData.character_type === 'emerald_chameleon' && (
                <div className="absolute -bottom-4 -right-5 w-8 h-2 bg-gradient-to-r from-emerald-600 to-green-800 rounded-full transform rotate-90 shadow-md">
                  <div className="absolute top-0 left-1 w-1 h-1 bg-lime-400 rounded-full animate-pulse" />
                  <div className="absolute top-0 right-1 w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                </div>
              )}
              {avatarData.character_type === 'lightning_cheetah' && (
                <div className="absolute -bottom-2 -right-4 w-5 h-2 bg-gradient-to-r from-yellow-600 to-orange-700 rounded-full transform rotate-45 shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full animate-pulse" />
                </div>
              )}
              {avatarData.character_type === 'mystic_fox' && (
                <div className="absolute -bottom-3 -right-4 w-6 h-4 bg-gradient-to-r from-orange-600 to-red-700 rounded-full transform rotate-45 shadow-lg">
                  <div className="absolute inset-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full" />
                  <div className="absolute top-1 left-1 w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-pink-400 rounded-full animate-pulse" />
                </div>
              )}
              {avatarData.character_type === 'cosmic_bunny' && (
                <div className="absolute -bottom-1 -right-2 w-3 h-3 bg-gradient-to-br from-purple-400 to-white rounded-full shadow-md">
                  <div className="absolute inset-1 bg-white rounded-full" />
                  <div className="absolute top-0 left-0 w-1 h-1 bg-blue-300 rounded-full animate-pulse" />
                </div>
              )}
              {avatarData.character_type === 'demon_bull' && (
                <div className="absolute -bottom-2 -right-3 w-4 h-2 bg-gradient-to-r from-red-900 to-black rounded-full transform rotate-45 shadow-lg">
                  <div className="absolute top-0 right-0 w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                </div>
              )}
              {/* Default tail for other characters */}
              {!['cyber_dragon', 'emerald_chameleon', 'lightning_cheetah', 'mystic_fox', 'cosmic_bunny', 'demon_bull'].includes(avatarData.character_type) && (
                <div className="absolute -bottom-2 -right-3 w-4 h-2 bg-gradient-to-r from-slate-500 to-slate-400 rounded-full transform rotate-45" />
              )}
            </>
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