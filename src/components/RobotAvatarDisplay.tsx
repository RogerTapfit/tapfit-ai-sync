import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RobotAvatarData } from '@/hooks/useRobotAvatar';

interface RobotAvatarDisplayProps {
  avatarData: RobotAvatarData;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
  className?: string;
  emotion?: 'happy' | 'excited' | 'focused' | 'celebrating' | 'resting' | 'charging' | 'scanning';
  pose?: 'idle' | 'flexing' | 'victory' | 'workout' | 'champion' | 'power_up' | 'scan_mode';
}

export const RobotAvatarDisplay = ({ 
  avatarData, 
  size = 'medium', 
  showAnimation = true, 
  className = '',
  emotion = 'happy',
  pose = 'idle'
}: RobotAvatarDisplayProps) => {
  // Mobile-responsive size classes
  const sizeClasses = {
    small: 'w-16 h-16 min-w-16 min-h-16',
    medium: 'w-24 h-24 min-w-24 min-h-24 sm:w-32 sm:h-32 sm:min-w-32 sm:min-h-32',
    large: 'w-32 h-32 min-w-32 min-h-32 sm:w-48 sm:h-48 sm:min-w-48 sm:min-h-48'
  };

  const bodySize = {
    small: { body: 'w-6 h-8', head: 'w-4 h-4', core: 'w-2 h-2' },
    medium: { body: 'w-8 h-10 sm:w-12 sm:h-16', head: 'w-6 h-6 sm:w-8 sm:h-8', core: 'w-3 h-3 sm:w-4 sm:h-4' },
    large: { body: 'w-12 h-16 sm:w-18 sm:h-24', head: 'w-8 h-8 sm:w-12 sm:h-12', core: 'w-4 h-4 sm:w-6 sm:h-6' }
  };

  const getBackgroundGradient = (background: string) => {
    switch (background) {
      case 'tech_lab': return 'from-slate-900 via-blue-900 to-slate-800';
      case 'cyber_arena': return 'from-purple-900 via-pink-900 to-red-900';
      case 'neon_city': return 'from-indigo-900 via-cyan-900 to-teal-900';
      case 'space_station': return 'from-gray-900 via-blue-800 to-black';
      case 'quantum_realm': return 'from-violet-900 via-fuchsia-800 to-purple-900';
      default: return 'from-slate-900 via-red-900 to-slate-800';
    }
  };

  const getChassisStyle = (chassisType: string) => {
    switch (chassisType) {
      case 'bulky_bot': return 'scale-110';
      case 'agile_bot': return 'scale-95';
      case 'tall_bot': return 'scale-y-125 scale-x-95';
      case 'compact_bot': return 'scale-90';
      case 'slim_bot': return 'scale-y-105 scale-x-95';
      default: return 'scale-100';
    }
  };

  const getChassisSpecialFeatures = (chassisType: string, size: string) => {
    const iconSize = size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base';
    
    switch (chassisType) {
      case 'bulky_bot':
        return (
          <div className={`${iconSize} animate-bounce text-orange-400`}>
            🏋️💪
          </div>
        );
      case 'agile_bot':
        return (
          <div className={`${iconSize} animate-pulse text-cyan-400`}>
            ⚡🏃‍♂️
          </div>
        );
      case 'tall_bot':
        return (
          <div className={`${iconSize} animate-pulse text-yellow-400`}>
            🏀👑
          </div>
        );
      case 'compact_bot':
        return (
          <div className={`${iconSize} animate-bounce text-pink-400`}>
            💝🤖
          </div>
        );
      case 'slim_bot':
        return (
          <div className={`${iconSize} animate-pulse text-green-400`}>
            🏃‍♂️🔥
          </div>
        );
      default:
        return (
          <div className={`${iconSize} text-blue-400`}>
            🤖
          </div>
        );
    }
  };

  const getRobotEyeDisplay = (emotion: string, eyeColor: string) => {
    const baseEyeColor = eyeColor === 'blue_led' ? 'bg-blue-400' : 
                        eyeColor === 'red_led' ? 'bg-red-400' :
                        eyeColor === 'green_led' ? 'bg-green-400' :
                        eyeColor === 'yellow_led' ? 'bg-yellow-400' : 'bg-cyan-400';
    
    switch (emotion) {
      case 'excited': return `${baseEyeColor} animate-pulse`;
      case 'celebrating': return `${baseEyeColor} animate-bounce`;
      case 'focused': return `${baseEyeColor} brightness-150`;
      case 'scanning': return `${baseEyeColor} animate-ping`;
      case 'charging': return `${baseEyeColor} animate-pulse opacity-60`;
      default: return `${baseEyeColor}`;
    }
  };

  const getAnimationClass = (animation: string, emotion: string) => {
    if (!showAnimation) return '';
    
    const baseClass = 'transition-all duration-500 ease-in-out';
    
    switch (animation) {
      case 'power_up':
        return `${baseClass} animate-pulse`;
      case 'victory':
        return `${baseClass}`;
      case 'scan_mode':
        return `${baseClass}`;
      case 'workout':
        return `${baseClass}`;
      case 'champion':
        return `${baseClass}`;
      default:
        return baseClass;
    }
  };

  const getTechModuleBadges = (techModules: string[]) => {
    const moduleIcons: { [key: string]: string } = {
      'basic_scanner': '📡',
      'neural_processor': '🧠',
      'biometric_scanner': '💓',
      'audio_core': '🎵',
      'data_vault': '📊',
      'recovery_module': '🏥',
      'power_amplifier': '⚡',
      'shield_generator': '🛡️',
      'fitness_tracker': '⌚',
      'hydration_reminder': '💧',
      'nutrition_analyzer': '🥗',
      'form_checker': '✅'
    };

    return techModules.map(module => moduleIcons[module] || '⚙️').slice(0, 3);
  };

  const currentPose = pose || avatarData.animation;
  const currentBodySize = bodySize[size];
  const { primary, secondary, accent } = avatarData.color_scheme;

  return (
    <Card 
      className={`${sizeClasses[size]} ${className} relative border-2 border-primary/30 bg-gradient-to-br ${getBackgroundGradient(avatarData.background)} transition-all duration-300 flex items-center justify-center overflow-hidden`}
      style={{ 
        boxShadow: `0 0 20px ${accent}40, inset 0 0 20px ${primary}20` 
      }}
    >
      {/* Robot Figure Container */}
      <div className="relative flex flex-col items-center justify-center h-full w-full">
        
        {/* Chassis Type Label */}
        <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white">
          {avatarData.chassis_type.replace('_', ' ').toUpperCase()}
        </div>

        {/* Main Robot Body */}
        <div 
          className={`relative ${getAnimationClass(currentPose, emotion)} ${getChassisStyle(avatarData.chassis_type)}`}
        >
          {/* Robot Head */}
          <div 
            className={`${currentBodySize.head} rounded-lg border-2 border-white/20 shadow-lg mb-1 mx-auto relative`}
            style={{ 
              background: `linear-gradient(135deg, ${primary}, ${secondary})`,
              boxShadow: `0 0 8px ${accent}40`
            }}
          >
            {/* Robot Eyes */}
            <div className="flex gap-1 absolute top-1/3 left-1/2 transform -translate-x-1/2">
              <div className={`${size === 'small' ? 'w-1.5 h-1.5' : size === 'medium' ? 'w-2 h-2' : 'w-3 h-3'} rounded-sm ${getRobotEyeDisplay(emotion, avatarData.eye_color)} border border-white/20`} />
              <div className={`${size === 'small' ? 'w-1.5 h-1.5' : size === 'medium' ? 'w-2 h-2' : 'w-3 h-3'} rounded-sm ${getRobotEyeDisplay(emotion, avatarData.eye_color)} border border-white/20`} />
            </div>
          </div>

          {/* Robot Body */}
          <div 
            className={`${currentBodySize.body} rounded-lg border-2 border-white/20 shadow-lg mx-auto relative mb-1`}
            style={{ 
              background: `linear-gradient(135deg, ${primary}, ${secondary})`,
              boxShadow: `0 0 10px ${accent}60`
            }}
          >
            {/* Energy Core */}
            <div 
              className={`absolute top-2 left-1/2 transform -translate-x-1/2 ${currentBodySize.core} rounded-full border border-white/40 flex items-center justify-center`}
              style={{ 
                background: `radial-gradient(circle, ${accent}, ${primary})`,
                animation: avatarData.energy_core === 'quantum' ? 'pulse 2s infinite' : 
                          avatarData.energy_core === 'fusion' ? 'ping 3s infinite' : 'none'
              }}
            >
              <span className={`${size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base'} text-white`}>
                ❤️
              </span>
            </div>

            {/* Circuit Patterns */}
            <div className="absolute inset-1 opacity-30">
              <div className="w-full h-0.5 bg-white/40 mt-1" />
              <div className="w-0.5 h-full bg-white/40 ml-1" />
            </div>
          </div>

          {/* Robot Legs */}
          <div className="flex gap-0.5 justify-center">
            <div 
              className={`${size === 'small' ? 'w-3 h-4' : size === 'medium' ? 'w-4 h-6' : 'w-6 h-8'} rounded border-2 border-white/20 shadow-lg`}
              style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}
            />
            <div 
              className={`${size === 'small' ? 'w-3 h-4' : size === 'medium' ? 'w-4 h-6' : 'w-6 h-8'} rounded border-2 border-white/20 shadow-lg`}
              style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}
            />
          </div>

          {/* Robot Feet */}
          <div className="flex gap-0.5 justify-center mt-0.5">
            <div 
              className={`${size === 'small' ? 'w-3.5 h-2' : size === 'medium' ? 'w-5 h-3' : 'w-7 h-4'} rounded border-2 border-white/20 shadow-lg relative`}
              style={{ background: `linear-gradient(135deg, ${accent}, ${secondary})` }}
            >
              {avatarData.shoes === 'hover_boots' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400 opacity-60 animate-pulse" />
              )}
            </div>
            <div 
              className={`${size === 'small' ? 'w-3.5 h-2' : size === 'medium' ? 'w-5 h-3' : 'w-7 h-4'} rounded border-2 border-white/20 shadow-lg relative`}
              style={{ background: `linear-gradient(135deg, ${accent}, ${secondary})` }}
            >
              {avatarData.shoes === 'hover_boots' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400 opacity-60 animate-pulse" />
              )}
            </div>
          </div>

          {/* Chassis Special Features */}
          <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
            {getChassisSpecialFeatures(avatarData.chassis_type, size)}
          </div>
        </div>
      </div>

      {/* Power Level Indicator */}
      <div className="absolute top-1 left-1">
        <div className="flex items-center gap-1">
          <div className="w-8 h-1 bg-black/40 rounded-full overflow-hidden border border-white/20">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
              style={{ width: `${avatarData.power_level}%` }}
            />
          </div>
          <span className="text-xs text-white/80 font-mono">{avatarData.power_level}%</span>
        </div>
      </div>

      {/* Status Badge */}
      {showAnimation && (currentPose !== 'idle' || emotion !== 'happy') && (
        <Badge className="absolute top-1 right-1 text-xs animate-pulse" style={{ backgroundColor: accent }}>
          {currentPose === 'power_up' ? '⚡' :
           currentPose === 'victory' ? '🏆' :
           currentPose === 'scan_mode' ? '📡' :
           currentPose === 'workout' ? '🏃' :
           currentPose === 'champion' ? '👑' :
           emotion === 'celebrating' ? '🎉' :
           emotion === 'excited' ? '⚡' :
           emotion === 'scanning' ? '🔍' :
           emotion === 'charging' ? '🔋' : '🤖'}
        </Badge>
      )}

      {/* Motivational Speech Bubble */}
      {emotion === 'celebrating' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600/90 rounded-lg px-2 py-1 text-xs font-bold shadow-lg border border-green-400/40 animate-bounce text-white">
          Great workout! 💪 Keep it up!
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600/90" />
        </div>
      )}

      {emotion === 'excited' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-orange-600/90 rounded-lg px-2 py-1 text-xs font-bold shadow-lg border border-orange-400/40 animate-pulse text-white">
          Let's crush this workout! 🔥
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-600/90" />
        </div>
      )}

      {emotion === 'scanning' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-900/80 rounded-lg px-2 py-1 text-xs font-bold shadow-lg border border-cyan-400/40 animate-pulse text-cyan-100">
          Analyzing your form... 📊
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-900/80" />
        </div>
      )}

      {currentPose === 'workout' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-purple-600/90 rounded-lg px-2 py-1 text-xs font-bold shadow-lg border border-purple-400/40 animate-bounce text-white">
          You got this! 💪
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-600/90" />
        </div>
      )}
    </Card>
  );
};