import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Star, Sparkles } from 'lucide-react';

export interface CharacterOption {
  id: string;
  name: string;
  species: string;
  emoji: string;
  personality: string[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCost: number;
  description: string;
  defaultHue: number;
  specialFeatures: string[];
}

export const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    id: 'steel_warrior',
    name: 'Steel Warrior',
    species: 'humanoid',
    emoji: '⚔️',
    personality: ['determined', 'reliable', 'focused'],
    rarity: 'common',
    unlockCost: 0,
    description: 'A dependable warrior robot with balanced capabilities',
    defaultHue: 0,
    specialFeatures: ['armor_plating', 'weapon_mounts', 'battle_stance']
  },
  {
    id: 'cyber_panda',
    name: 'Cyber Panda',
    species: 'ursine',
    emoji: '🐼',
    personality: ['friendly', 'tech_savvy', 'adaptive'],
    rarity: 'common',
    unlockCost: 50,
    description: 'An adorable panda robot with advanced tech capabilities',
    defaultHue: 200,
    specialFeatures: ['round_ears', 'cute_face', 'tech_patches']
  },
  {
    id: 'cosmic_bunny',
    name: 'Cosmic Bunny',
    species: 'lagomorph',
    emoji: '🐰',
    personality: ['energetic', 'agile', 'optimistic'],
    rarity: 'common',
    unlockCost: 75,
    description: 'A high-energy space bunny with incredible agility',
    defaultHue: 280,
    specialFeatures: ['long_ears', 'cotton_tail', 'cosmic_patterns']
  },
  {
    id: 'lightning_cheetah',
    name: 'Lightning Cheetah',
    species: 'feline',
    emoji: '🐆',
    personality: ['fast', 'agile', 'competitive'],
    rarity: 'rare',
    unlockCost: 150,
    description: 'The fastest robot in the gym with lightning reflexes',
    defaultHue: 45,
    specialFeatures: ['spots', 'sleek_build', 'speed_lines']
  },
  {
    id: 'mystic_fox',
    name: 'Mystic Fox',
    species: 'vulpine',
    emoji: '🦊',
    personality: ['wise', 'intuitive', 'mysterious'],
    rarity: 'rare',
    unlockCost: 200,
    description: 'A wise fox robot with mystical tech abilities',
    defaultHue: 25,
    specialFeatures: ['fluffy_tail', 'pointed_ears', 'mystical_aura']
  },
  {
    id: 'iron_guardian',
    name: 'Iron Guardian',
    species: 'armored',
    emoji: '🛡️',
    personality: ['protective', 'steadfast', 'loyal'],
    rarity: 'rare',
    unlockCost: 250,
    description: 'A heavily armored protector with defensive capabilities',
    defaultHue: 0,
    specialFeatures: ['heavy_armor', 'shield_plates', 'guardian_stance']
  },
  {
    id: 'shadow_eagle',
    name: 'Shadow Eagle',
    species: 'avian',
    emoji: '🦅',
    personality: ['fierce', 'independent', 'keen'],
    rarity: 'epic',
    unlockCost: 400,
    description: 'A majestic eagle robot with aerial capabilities',
    defaultHue: 240,
    specialFeatures: ['wings', 'sharp_talons', 'keen_eyes']
  },
  {
    id: 'emerald_chameleon',
    name: 'Emerald Chameleon',
    species: 'reptilian',
    emoji: '🦎',
    personality: ['adaptive', 'patient', 'strategic'],
    rarity: 'epic',
    unlockCost: 450,
    description: 'An adaptive chameleon robot with color-changing tech',
    defaultHue: 120,
    specialFeatures: ['color_changing', 'long_tail', 'large_eyes']
  },
  {
    id: 'gorilla_guardian',
    name: 'Gorilla Guardian',
    species: 'primate',
    emoji: '🦍',
    personality: ['strong', 'protective', 'wise'],
    rarity: 'epic',
    unlockCost: 500,
    description: 'A powerful gorilla robot with incredible strength',
    defaultHue: 90,
    specialFeatures: ['muscular_build', 'broad_shoulders', 'protective_stance']
  },
  {
    id: 'cyber_dragon',
    name: 'Cyber Dragon',
    species: 'draconic',
    emoji: '🐉',
    personality: ['fierce', 'powerful', 'majestic'],
    rarity: 'legendary',
    unlockCost: 800,
    description: 'A legendary dragon robot with immense power and presence',
    defaultHue: 180,
    specialFeatures: ['large_horns', 'dragon_wings', 'fangs', 'powerful_stance']
  },
  {
    id: 'demon_bull',
    name: 'Demon Bull',
    species: 'bovine',
    emoji: '🐂',
    personality: ['intimidating', 'powerful', 'unstoppable'],
    rarity: 'legendary',
    unlockCost: 1000,
    description: 'An intimidating bull robot with overwhelming strength',
    defaultHue: 0,
    specialFeatures: ['large_horns', 'bull_stance', 'heavy_armor']
  }
];

interface CharacterSelectorProps {
  selectedCharacter?: string;
  onCharacterSelect: (characterId: string) => void;
  ownedCharacters: string[];
  canAfford: (cost: number) => boolean;
  onPurchase: (characterId: string, cost: number) => void;
  onPreview?: (characterId: string) => void; // For preview updates
}

export const CharacterSelector = ({
  selectedCharacter,
  onCharacterSelect,
  ownedCharacters,
  canAfford,
  onPurchase,
  onPreview
}: CharacterSelectorProps) => {
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-muted-foreground border-muted';
      case 'rare': return 'text-blue-400 border-blue-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'legendary': return 'text-yellow-400 border-yellow-400';
      default: return 'text-muted-foreground border-muted';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'rare': return <Star className="w-3 h-3" />;
      case 'epic': return <Sparkles className="w-3 h-3" />;
      case 'legendary': return <Crown className="w-3 h-3" />;
      default: return null;
    }
  };

  const isOwned = (characterId: string) => {
    return ownedCharacters.includes(characterId) || characterId === 'steel_warrior';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {CHARACTER_OPTIONS.map((character) => {
        const owned = isOwned(character.id);
        const selected = selectedCharacter === character.id;
        const affordable = canAfford(character.unlockCost);

        return (
          <Card 
            key={character.id}
            className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
              selected ? 'ring-2 ring-primary shadow-lg' : ''
            } ${owned ? '' : 'opacity-75'}`}
            onClick={() => {
              // Always allow preview updates when clicking any character
              if (onPreview) {
                onPreview(character.id);
              }
              // Only allow selection if owned
              if (owned) {
                onCharacterSelect(character.id);
              }
            }}
          >
            <CardContent className="p-4 text-center space-y-2">
              
              {/* Character Emoji */}
              <div className="text-3xl mb-2" style={{ filter: `hue-rotate(${character.defaultHue}deg)` }}>
                {character.emoji}
              </div>
              
              {/* Character Name */}
              <h3 className="font-semibold text-sm">{character.name}</h3>
              
              {/* Rarity Badge */}
              <Badge 
                variant="outline" 
                className={`text-xs ${getRarityColor(character.rarity)}`}
              >
                {getRarityIcon(character.rarity)}
                {character.rarity.toUpperCase()}
              </Badge>
              
              {/* Description */}
              <p className="text-xs text-muted-foreground line-clamp-2">
                {character.description}
              </p>
              
              {/* Personality Traits */}
              <div className="flex flex-wrap gap-1 justify-center">
                {character.personality.slice(0, 2).map((trait) => (
                  <Badge key={trait} variant="secondary" className="text-xs px-1 py-0">
                    {trait}
                  </Badge>
                ))}
              </div>
              
              {/* Purchase/Select Button */}
              {owned ? (
                <Button 
                  size="sm" 
                  variant={selected ? "default" : "outline"}
                  className="w-full"
                  onClick={() => onCharacterSelect(character.id)}
                >
                  {selected ? '✓ Selected' : 'Select'}
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full"
                  disabled={!affordable}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPurchase(character.id, character.unlockCost);
                  }}
                >
                  {affordable ? `🪙 ${character.unlockCost}` : '🔒 Locked'}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};