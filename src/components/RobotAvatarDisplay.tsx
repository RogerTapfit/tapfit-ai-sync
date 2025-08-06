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
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  const bodySize = {
    small: { body: 'w-8 h-12', head: 'w-6 h-6', core: 'w-3 h-3' },
    medium: { body: 'w-12 h-16', head: 'w-8 h-8', core: 'w-4 h-4' },
    large: { body: 'w-18 h-24', head: 'w-12 h-12', core: 'w-6 h-6' }
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
      case 'bulky_bot': return 'scale-125 font-bold transform rotate-2 shadow-2xl';
      case 'agile_bot': return 'scale-90 transform -skew-y-2 shadow-lg';
      case 'tall_bot': return 'scale-y-150 scale-x-85 shadow-xl';
      case 'compact_bot': return 'scale-75 rounded-2xl shadow-md';
      case 'slim_bot': return 'scale-y-110 scale-x-90 transform skew-y-1';
      default: return 'scale-100';
    }
  };

  const getChassisSpecialFeatures = (chassisType: string, size: string) => {
    const iconSize = size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base';
    
    switch (chassisType) {
      case 'bulky_bot':
        return (
          <>
            <div className={`absolute -left-2 top-1/3 transform -translate-y-1/2 ${iconSize} animate-bounce`}>
              🏋️ {/* Dumbbell attachment */}
            </div>
            <div className={`absolute -right-2 top-2/3 transform -translate-y-1/2 ${iconSize} animate-bounce delay-100`}>
              💪 {/* Strength indicator */}
            </div>
          </>
        );
      case 'agile_bot':
        return (
          <>
            <div className={`absolute -right-2 top-1/4 ${iconSize} animate-pulse`}>
              🎧 {/* Headphones for music */}
            </div>
            <div className={`absolute -left-2 top-3/4 ${iconSize} animate-ping`}>
              ⚡ {/* Speed indicator */}
            </div>
          </>
        );
      case 'tall_bot':
        return (
          <>
            <div className={`absolute top-0 left-1/4 transform -translate-y-1/2 ${iconSize} animate-pulse`}>
              🏀 {/* Height indicator */}
            </div>
            <div className={`absolute top-0 right-1/4 transform -translate-y-1/2 ${iconSize} animate-pulse delay-75`}>
              👑 {/* Leadership symbol */}
            </div>
          </>
        );
      case 'compact_bot':
        return (
          <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${iconSize} animate-bounce`}>
            💝 {/* Heart symbol for motivation */}
          </div>
        );
      case 'slim_bot':
        return (
          <>
            <div className={`absolute -right-1 top-1/3 ${iconSize} animate-pulse`}>
              🏃‍♂️ {/* Running indicator */}
            </div>
            <div className={`absolute -left-1 top-2/3 ${iconSize} animate-pulse delay-100`}>
              🔥 {/* Cardio indicator */}
            </div>
          </>
        );
      default:
        return null;
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
    
    const baseClass = 'transition-all duration-300';
    
    switch (animation) {
      case 'power_up':
        return `${baseClass} animate-pulse`;
      case 'victory':
        return `${baseClass} animate-bounce`;
      case 'scan_mode':
        return `${baseClass} animate-[ping_2s_ease-in-out_infinite]`;
      case 'workout':
        return `${baseClass} animate-[bounce_1s_ease-in-out_infinite]`;
      case 'champion':
        return `${baseClass} animate-[wiggle_1s_ease-in-out_infinite]`;
      default:
        return emotion === 'celebrating' ? `${baseClass} animate-[swing_2s_ease-in-out_infinite]` : baseClass;
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
      key={`${avatarData.chassis_type}-${avatarData.color_scheme.primary}-${avatarData.tech_modules.join(',')}`}
      className={`${sizeClasses[size]} ${className} relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br ${getBackgroundGradient(avatarData.background)} transition-all duration-500`}
      style={{ 
        boxShadow: `0 0 20px ${accent}40, inset 0 0 20px ${primary}20` 
      }}
    >
      {/* Robot Figure */}
      <div className="absolute inset-0 flex items-end justify-center p-2">
        <div className={`${getAnimationClass(currentPose, emotion)} ${getChassisStyle(avatarData.chassis_type)}`}>
          
          {/* Robot Body - Main Chassis */}
          <div 
            className={`${currentBodySize.body} rounded-lg relative border-2 border-white/20 shadow-lg overflow-hidden`}
            style={{ 
              background: `linear-gradient(135deg, ${primary}, ${secondary})`,
              boxShadow: `0 0 10px ${accent}60`
            }}
          >
            {/* Energy Core with Fitness Heart Symbol */}
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

            {/* Chassis-Specific Features */}
            {getChassisSpecialFeatures(avatarData.chassis_type, size)}

            {/* Circuit Patterns */}
            <div className="absolute inset-1 opacity-30">
              <div className="w-full h-0.5 bg-white/40 mt-1" />
              <div className="w-0.5 h-full bg-white/40 ml-1" />
              <div className="absolute bottom-1 right-1 w-2 h-2 border border-white/40 rounded-sm" />
            </div>

            {/* Robot Head */}
            <div 
              className={`${currentBodySize.head} rounded-lg absolute ${size === 'small' ? '-top-5' : size === 'medium' ? '-top-6' : '-top-8'} left-1/2 transform -translate-x-1/2 border-2 border-white/20 shadow-lg overflow-hidden`}
              style={{ 
                background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                boxShadow: `0 0 8px ${accent}40`
              }}
            >
              {/* Visor/Scanner Array */}
              {avatarData.visor_type && (
                <div 
                  className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60`}
                  style={{ 
                    animation: emotion === 'scanning' ? 'pulse 1s infinite' : 'none'
                  }}
                />
              )}
              
              {/* Robot Eyes - LED Display */}
              <div className={`flex ${size === 'small' ? 'gap-0.5' : 'gap-1'} absolute ${size === 'small' ? 'top-1.5 left-1' : size === 'medium' ? 'top-2 left-1.5' : 'top-3 left-2.5'}`}>
                <div className={`${size === 'small' ? 'w-1.5 h-1.5' : size === 'medium' ? 'w-2 h-2' : 'w-3 h-3'} rounded-sm ${getRobotEyeDisplay(emotion, avatarData.eye_color)} border border-white/20 shadow-inner`} />
                <div className={`${size === 'small' ? 'w-1.5 h-1.5' : size === 'medium' ? 'w-2 h-2' : 'w-3 h-3'} rounded-sm ${getRobotEyeDisplay(emotion, avatarData.eye_color)} border border-white/20 shadow-inner`} />
              </div>

              {/* LED Pattern Display */}
              {avatarData.led_patterns.includes('matrix') && (
                <div className={`absolute ${size === 'small' ? 'bottom-1 left-1/2' : size === 'medium' ? 'bottom-1.5 left-1/2' : 'bottom-2 left-1/2'} transform -translate-x-1/2`}>
                  <div className={`grid grid-cols-3 gap-0.5 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
                    <div className="w-0.5 h-0.5 bg-green-400 rounded-full animate-pulse" />
                    <div className="w-0.5 h-0.5 bg-green-400 rounded-full animate-pulse delay-100" />
                    <div className="w-0.5 h-0.5 bg-green-400 rounded-full animate-pulse delay-200" />
                  </div>
                </div>
              )}
            </div>

            {/* Tech Module Indicators */}
            {avatarData.tech_modules.length > 0 && (
              <div className={`absolute ${size === 'small' ? 'bottom-1 right-1' : size === 'medium' ? 'bottom-2 right-2' : 'bottom-3 right-3'} flex flex-col gap-0.5`}>
                {getTechModuleBadges(avatarData.tech_modules).map((icon, index) => (
                  <div 
                    key={index}
                    className={`${size === 'small' ? 'w-2 h-2 text-xs' : size === 'medium' ? 'w-3 h-3 text-sm' : 'w-4 h-4 text-base'} bg-black/40 rounded border border-white/20 flex items-center justify-center`}
                    style={{ fontSize: size === 'small' ? '6px' : size === 'medium' ? '8px' : '10px' }}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            )}

            {/* Robot Legs - Hydraulic/Mechanical */}
            <div className={`absolute ${size === 'small' ? '-bottom-4 left-0.5' : size === 'medium' ? '-bottom-6 left-0.5' : '-bottom-8 left-1'} flex gap-0.5`}>
              <div 
                className={`${size === 'small' ? 'w-3 h-4' : size === 'medium' ? 'w-4 h-6' : 'w-6 h-8'} rounded border-2 border-white/20 shadow-lg`}
                style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}
              />
              <div 
                className={`${size === 'small' ? 'w-3 h-4' : size === 'medium' ? 'w-4 h-6' : 'w-6 h-8'} rounded border-2 border-white/20 shadow-lg`}
                style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}
              />
            </div>

            {/* Robot Feet - Hover/Tech Boots */}
            <div className={`absolute ${size === 'small' ? '-bottom-5 left-0' : size === 'medium' ? '-bottom-7 left-0' : '-bottom-9 left-0.5'} flex gap-0.5`}>
              <div 
                className={`${size === 'small' ? 'w-3.5 h-2' : size === 'medium' ? 'w-5 h-3' : 'w-7 h-4'} rounded border-2 border-white/20 shadow-lg relative overflow-hidden`}
                style={{ background: `linear-gradient(135deg, ${accent}, ${secondary})` }}
              >
                {avatarData.shoes === 'hover_boots' && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400 opacity-60 animate-pulse" />
                )}
              </div>
              <div 
                className={`${size === 'small' ? 'w-3.5 h-2' : size === 'medium' ? 'w-5 h-3' : 'w-7 h-4'} rounded border-2 border-white/20 shadow-lg relative overflow-hidden`}
                style={{ background: `linear-gradient(135deg, ${accent}, ${secondary})` }}
              >
                {avatarData.shoes === 'hover_boots' && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400 opacity-60 animate-pulse" />
                )}
              </div>
            </div>
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