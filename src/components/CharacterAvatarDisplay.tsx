import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RobotAvatarData } from '@/hooks/useRobotAvatar';
import { useAvatarImage, useAvatars } from '@/hooks/useAvatarImage';
import { Loader2 } from 'lucide-react';

interface CharacterAvatarDisplayProps {
  avatarData: RobotAvatarData;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
  className?: string;
  emotion?: 'happy' | 'excited' | 'focused' | 'celebrating' | 'resting' | 'charging' | 'scanning';
  pose?: 'idle' | 'flexing' | 'victory' | 'workout' | 'champion' | 'power_up' | 'scan_mode';
  onClick?: () => void;
  isClickable?: boolean;
  isSpeaking?: boolean;
}

export const CharacterAvatarDisplay = ({ 
  avatarData, 
  size = 'medium', 
  showAnimation = true, 
  className = '',
  emotion = 'happy',
  pose = 'idle',
  onClick,
  isClickable = false,
  isSpeaking = false
}: CharacterAvatarDisplayProps) => {
  // Use character_type if available, otherwise use avatar_id for backward compatibility
  const characterId = avatarData?.character_type || avatarData?.avatar_id;
  const { data: avatar, isLoading } = useAvatarImage(characterId);
  const { data: allAvatars } = useAvatars(); // Fetch all avatars to get default

  const sizeClasses = {
    small: 'w-16 h-16 min-w-16 min-h-16',
    medium: 'w-24 h-24 min-w-24 min-h-24 sm:w-32 sm:h-32',
    large: 'w-full h-full max-w-full max-h-full min-w-32 min-h-32'
  };

  console.log('CharacterAvatarDisplay:', { 
    characterId, 
    avatarData, 
    avatar, 
    isLoading,
    allAvatars
  });

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

  const currentPose = getCurrentPose(pose);

  // Do not fallback to the first avatar to avoid showing the wrong coach
  const displayAvatar = avatar;

  if (isLoading) {
    return (
      <Card className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (!displayAvatar) {
    return (
      <Card className={`${sizeClasses[size]} ${className} flex flex-col items-center justify-center p-4 text-center`}>
        <div className="text-4xl mb-2">🤖</div>
        <div className="text-xs text-muted-foreground">No coach selected</div>
      </Card>
    );
  }

  const clickableClasses = isClickable 
    ? 'cursor-pointer hover:scale-105 hover:shadow-2xl hover:ring-2 hover:ring-primary/50' 
    : '';
  const speakingClasses = isSpeaking 
    ? 'animate-pulse ring-2 ring-primary/70 shadow-[0_0_20px_rgba(var(--primary),0.4)]' 
    : '';

  return (
    <Card 
      className={`${sizeClasses[size]} ${className} relative overflow-hidden border-2 shadow-xl transition-all duration-300 ${showAnimation ? 'hover:scale-105' : ''} ${clickableClasses} ${speakingClasses}`}
      onClick={isClickable && !isSpeaking ? onClick : undefined}
      title={isClickable ? (isSpeaking ? 'Coach is speaking...' : 'Click for encouragement!') : undefined}
    >
      
      {/* Character Header */}
      <div className="absolute top-1 left-1 right-1 flex justify-between items-center z-10">
        <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
          {displayAvatar?.name || 'No coach'}
        </Badge>
        <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
          ⚡{avatarData?.power_level || 100}%
        </Badge>
      </div>

      {/* Coach Image Display */}
      <div className={`absolute inset-0 flex items-center justify-center p-2 ${currentPose} transition-transform duration-300`}>
        {displayAvatar ? (
          <img 
            src={displayAvatar.image_url}
            alt={`${displayAvatar.name} coach avatar`}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
        ) : (
          <div className="text-xs text-muted-foreground">No coach selected</div>
        )}
      </div>

      {/* Speech bubble for animations */}
      {isSpeaking && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-primary/90 text-primary-foreground border border-primary rounded-lg px-3 py-1 text-xs animate-pulse font-medium shadow-lg">
          🔊 Speaking...
        </div>
      )}

      {showAnimation && emotion === 'celebrating' && !isSpeaking && (
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