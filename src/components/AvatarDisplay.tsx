import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarData } from '@/hooks/useAvatar';

interface AvatarDisplayProps {
  avatarData: AvatarData;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
  className?: string;
}

export const AvatarDisplay = ({ 
  avatarData, 
  size = 'medium', 
  showAnimation = true, 
  className = '' 
}: AvatarDisplayProps) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
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

  return (
    <Card className={`${sizeClasses[size]} ${className} relative overflow-hidden border-2 border-primary/30`}>
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getBackgroundGradient(avatarData.background)}`} />
      
      {/* Avatar Figure */}
      <div className="absolute inset-0 flex items-end justify-center p-2">
        <div className={`relative ${showAnimation && avatarData.animation === 'victory' ? 'animate-bounce' : ''}`}>
          {/* Body */}
          <div 
            className="w-12 h-16 rounded-t-xl rounded-b-lg relative"
            style={{ backgroundColor: getSkinToneColor(avatarData.skin_tone) }}
          >
            {/* Head */}
            <div 
              className="w-8 h-8 rounded-full absolute -top-6 left-2"
              style={{ backgroundColor: getSkinToneColor(avatarData.skin_tone) }}
            >
              {/* Hair */}
              <div 
                className={`absolute -top-1 -left-1 w-10 h-6 rounded-t-full ${
                  avatarData.hair_style === 'long' ? 'h-8' : 
                  avatarData.hair_style === 'buzz' ? 'h-4' : 'h-6'
                }`}
                style={{ backgroundColor: getHairColor(avatarData.hair_color) }}
              />
              
              {/* Eyes */}
              <div className="flex gap-1 absolute top-2 left-2">
                <div className="w-1 h-1 rounded-full bg-black" />
                <div className="w-1 h-1 rounded-full bg-black" />
              </div>
            </div>

            {/* Outfit */}
            <div className={`absolute top-2 inset-x-0 h-12 rounded ${
              avatarData.outfit === 'tank' ? 'bg-red-500' :
              avatarData.outfit === 'hoodie' ? 'bg-gray-600' :
              avatarData.outfit === 'gym' ? 'bg-blue-600' :
              avatarData.outfit === 'champion' ? 'bg-yellow-500' :
              'bg-white'
            }`} />

            {/* Accessory */}
            {avatarData.accessory && (
              <div className={`absolute -top-8 left-1 w-10 h-3 rounded ${
                avatarData.accessory === 'cap' ? 'bg-blue-700' :
                avatarData.accessory === 'sweatband' ? 'bg-red-600' :
                avatarData.accessory === 'sunglasses' ? 'bg-black' :
                avatarData.accessory === 'tracker' ? 'bg-gray-800' :
                avatarData.accessory === 'ring' ? 'bg-yellow-400' :
                'bg-gray-500'
              }`} />
            )}

            {/* Shoes */}
            <div className={`absolute -bottom-1 left-1 w-10 h-3 rounded ${
              avatarData.shoes === 'running' ? 'bg-red-600' :
              avatarData.shoes === 'basketball' ? 'bg-orange-600' :
              avatarData.shoes === 'cross' ? 'bg-purple-600' :
              avatarData.shoes === 'limited' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
              'bg-gray-700'
            }`} />
          </div>
        </div>
      </div>

      {/* Animation Badge */}
      {showAnimation && avatarData.animation !== 'idle' && (
        <Badge className="absolute top-1 right-1 text-xs">
          {avatarData.animation === 'flexing' ? '💪' :
           avatarData.animation === 'victory' ? '🏆' :
           avatarData.animation === 'workout' ? '🏃' :
           avatarData.animation === 'champion' ? '👑' : ''}
        </Badge>
      )}
    </Card>
  );
};