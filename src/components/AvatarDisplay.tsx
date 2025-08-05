import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarData } from '@/hooks/useAvatar';

interface AvatarDisplayProps {
  avatarData: AvatarData;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
  className?: string;
  emotion?: 'happy' | 'excited' | 'focused' | 'celebrating' | 'resting';
  pose?: 'idle' | 'flexing' | 'victory' | 'workout' | 'champion';
}

export const AvatarDisplay = ({ 
  avatarData, 
  size = 'medium', 
  showAnimation = true, 
  className = '',
  emotion = 'happy',
  pose = 'idle'
}: AvatarDisplayProps) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  const bodySize = {
    small: { body: 'w-8 h-12', head: 'w-6 h-6' },
    medium: { body: 'w-12 h-16', head: 'w-8 h-8' },
    large: { body: 'w-18 h-24', head: 'w-12 h-12' }
  };

  const getBackgroundGradient = (background: string) => {
    switch (background) {
      case 'gym': return 'from-slate-600 to-slate-800';
      case 'beach': return 'from-blue-400 to-yellow-400';
      case 'mountains': return 'from-green-600 to-gray-600';
      case 'stadium': return 'from-green-500 to-green-700';
      case 'space': return 'from-purple-900 to-black';
      default: return 'from-slate-600 to-slate-800';
    }
  };

  const getSkinToneColor = (tone: string) => {
    switch (tone) {
      case 'light': return '#fdbcb4';
      case 'medium': return '#e1906b';
      case 'dark': return '#8d5524';
      case 'tan': return '#deb887';
      default: return '#fdbcb4';
    }
  };

  const getHairColor = (color: string) => {
    switch (color) {
      case 'brown': return '#8b4513';
      case 'black': return '#2c2c2c';
      case 'blonde': return '#ffd700';
      case 'red': return '#dc143c';
      case 'gray': return '#808080';
      default: return '#8b4513';
    }
  };

  const getEyeExpression = (emotion: string) => {
    switch (emotion) {
      case 'excited': return '✨';
      case 'celebrating': return '🌟';
      case 'focused': return '👁️';
      case 'resting': return '😌';
      default: return '😊';
    }
  };

  const getAnimationClass = (animation: string, emotion: string) => {
    if (!showAnimation) return '';
    
    const baseClass = 'transition-all duration-300';
    
    switch (animation) {
      case 'victory':
        return `${baseClass} animate-bounce`;
      case 'flexing':
        return `${baseClass} animate-pulse`;
      case 'workout':
        return `${baseClass} animate-[bounce_1s_ease-in-out_infinite]`;
      case 'champion':
        return `${baseClass} animate-[wiggle_1s_ease-in-out_infinite]`;
      default:
        return emotion === 'celebrating' ? `${baseClass} animate-[swing_2s_ease-in-out_infinite]` : baseClass;
    }
  };

  const currentPose = pose || avatarData.animation;
  const currentBodySize = bodySize[size];

  return (
    <Card className={`${sizeClasses[size]} ${className} relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br ${getBackgroundGradient(avatarData.background)}`}>
      {/* Avatar Figure - Lego-person style */}
      <div className="absolute inset-0 flex items-end justify-center p-2">
        <div className={getAnimationClass(currentPose, emotion)}>
          {/* Body - Lego brick style */}
          <div 
            className={`${currentBodySize.body} rounded-lg relative border-2 border-black/20 shadow-lg`}
            style={{ backgroundColor: getSkinToneColor(avatarData.skin_tone) }}
          >
            {/* Lego connection studs on body */}
            <div className="absolute top-1 inset-x-0 flex justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-white/30 border border-black/20" />
              <div className="w-2 h-2 rounded-full bg-white/30 border border-black/20" />
            </div>

            {/* Head - Lego head style */}
            <div 
              className={`${currentBodySize.head} rounded-lg absolute ${size === 'small' ? '-top-5' : size === 'medium' ? '-top-6' : '-top-8'} left-1/2 transform -translate-x-1/2 border-2 border-black/20 shadow-lg`}
              style={{ backgroundColor: getSkinToneColor(avatarData.skin_tone) }}
            >
              {/* Lego connection stud on head */}
              <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-2 rounded-full bg-white/30 border border-black/20" />
              </div>

              {/* Hair - Lego hair piece */}
              <div 
                className={`absolute ${size === 'small' ? '-top-0.5 -left-0.5 w-7 h-4' : size === 'medium' ? '-top-1 -left-1 w-10 h-6' : '-top-1.5 -left-1.5 w-15 h-9'} rounded-t-lg border-2 border-black/20 shadow-lg ${
                  avatarData.hair_style === 'long' ? (size === 'small' ? 'h-6' : size === 'medium' ? 'h-8' : 'h-12') : 
                  avatarData.hair_style === 'buzz' ? (size === 'small' ? 'h-3' : size === 'medium' ? 'h-4' : 'h-6') : ''
                }`}
                style={{ backgroundColor: getHairColor(avatarData.hair_color) }}
              />
              
              {/* Eyes - Large expressive eyes */}
              <div className={`flex ${size === 'small' ? 'gap-0.5' : 'gap-1'} absolute ${size === 'small' ? 'top-1.5 left-1' : size === 'medium' ? 'top-2 left-1.5' : 'top-3 left-2.5'}`}>
                <div className={`${size === 'small' ? 'w-1.5 h-1.5' : size === 'medium' ? 'w-2 h-2' : 'w-3 h-3'} rounded-full bg-white border border-black/30`}>
                  <div className={`${size === 'small' ? 'w-1 h-1' : size === 'medium' ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-black mt-0.5 ml-0.5`} />
                </div>
                <div className={`${size === 'small' ? 'w-1.5 h-1.5' : size === 'medium' ? 'w-2 h-2' : 'w-3 h-3'} rounded-full bg-white border border-black/30`}>
                  <div className={`${size === 'small' ? 'w-1 h-1' : size === 'medium' ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-black mt-0.5 ml-0.5`} />
                </div>
              </div>

              {/* Smile - Cute Lego face */}
              <div className={`absolute ${size === 'small' ? 'bottom-1 left-1/2' : size === 'medium' ? 'bottom-1.5 left-1/2' : 'bottom-2 left-1/2'} transform -translate-x-1/2`}>
                <div className={`${size === 'small' ? 'w-3 h-1.5' : size === 'medium' ? 'w-4 h-2' : 'w-6 h-3'} rounded-full border-2 border-black/30 border-t-0`} />
              </div>
            </div>

            {/* Outfit - Lego torso piece */}
            <div className={`absolute ${size === 'small' ? 'top-1.5 inset-x-0.5 h-7' : size === 'medium' ? 'top-2 inset-x-0.5 h-10' : 'top-3 inset-x-1 h-15'} rounded border-2 border-black/20 shadow-inner ${
              avatarData.outfit === 'tank' ? 'bg-red-500' :
              avatarData.outfit === 'hoodie' ? 'bg-gray-600' :
              avatarData.outfit === 'gym' ? 'bg-blue-600' :
              avatarData.outfit === 'champion' ? 'bg-gradient-to-b from-yellow-400 to-yellow-600' :
              'bg-white'
            }`}>
              {/* Outfit details */}
              <div className="absolute inset-x-1 top-1 flex justify-center gap-1">
                <div className="w-1 h-1 rounded-full bg-white/40" />
                <div className="w-1 h-1 rounded-full bg-white/40" />
              </div>
            </div>

            {/* Accessory - Lego accessory piece */}
            {avatarData.accessory && (
              <div className={`absolute ${size === 'small' ? '-top-6 left-0.5 w-7 h-2' : size === 'medium' ? '-top-8 left-0 w-10 h-3' : '-top-12 left-0 w-15 h-4'} rounded border-2 border-black/20 shadow-lg ${
                avatarData.accessory === 'cap' ? 'bg-blue-700' :
                avatarData.accessory === 'sweatband' ? 'bg-red-600' :
                avatarData.accessory === 'sunglasses' ? 'bg-black' :
                avatarData.accessory === 'tracker' ? 'bg-gray-800' :
                avatarData.accessory === 'ring' ? 'bg-yellow-400' :
                'bg-gray-500'
              }`} />
            )}

            {/* Legs - Lego leg pieces */}
            <div className={`absolute ${size === 'small' ? '-bottom-4 left-0.5' : size === 'medium' ? '-bottom-6 left-0.5' : '-bottom-8 left-1'} flex gap-0.5`}>
              <div 
                className={`${size === 'small' ? 'w-3 h-4' : size === 'medium' ? 'w-4 h-6' : 'w-6 h-8'} rounded border-2 border-black/20 shadow-lg`}
                style={{ backgroundColor: getSkinToneColor(avatarData.skin_tone) }}
              />
              <div 
                className={`${size === 'small' ? 'w-3 h-4' : size === 'medium' ? 'w-4 h-6' : 'w-6 h-8'} rounded border-2 border-black/20 shadow-lg`}
                style={{ backgroundColor: getSkinToneColor(avatarData.skin_tone) }}
              />
            </div>

            {/* Shoes - Lego shoe pieces */}
            <div className={`absolute ${size === 'small' ? '-bottom-5 left-0' : size === 'medium' ? '-bottom-7 left-0' : '-bottom-9 left-0.5'} flex gap-0.5`}>
              <div className={`${size === 'small' ? 'w-3.5 h-2' : size === 'medium' ? 'w-5 h-3' : 'w-7 h-4'} rounded border-2 border-black/20 shadow-lg ${
                avatarData.shoes === 'running' ? 'bg-red-600' :
                avatarData.shoes === 'basketball' ? 'bg-orange-600' :
                avatarData.shoes === 'cross' ? 'bg-purple-600' :
                avatarData.shoes === 'limited' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                'bg-gray-700'
              }`} />
              <div className={`${size === 'small' ? 'w-3.5 h-2' : size === 'medium' ? 'w-5 h-3' : 'w-7 h-4'} rounded border-2 border-black/20 shadow-lg ${
                avatarData.shoes === 'running' ? 'bg-red-600' :
                avatarData.shoes === 'basketball' ? 'bg-orange-600' :
                avatarData.shoes === 'cross' ? 'bg-purple-600' :
                avatarData.shoes === 'limited' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                'bg-gray-700'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Emotion/Animation Badge */}
      {showAnimation && (currentPose !== 'idle' || emotion !== 'happy') && (
        <Badge className="absolute top-1 right-1 text-xs animate-pulse">
          {currentPose === 'flexing' ? '💪' :
           currentPose === 'victory' ? '🏆' :
           currentPose === 'workout' ? '🏃' :
           currentPose === 'champion' ? '👑' :
           emotion === 'celebrating' ? '🎉' :
           emotion === 'excited' ? '⚡' :
           emotion === 'focused' ? '🎯' : '😊'}
        </Badge>
      )}

      {/* Motivational Speech Bubble (for celebrations) */}
      {emotion === 'celebrating' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-2 py-1 text-xs font-bold shadow-lg border-2 border-primary animate-bounce">
          Great job! 🎉
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
        </div>
      )}
    </Card>
  );
};