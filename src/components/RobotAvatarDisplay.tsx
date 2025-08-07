import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RobotAvatarData } from '@/hooks/useRobotAvatar';
import { CharacterAvatarDisplay } from './CharacterAvatarDisplay';

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
  // Use new CharacterAvatarDisplay if character_type is present
  if (avatarData.character_type) {
    // Create a key that changes when custom images update to force re-render
    const customImageKey = avatarData.custom_character_images?.[avatarData.character_type] || 'default';
    const renderKey = `${avatarData.character_type}-${customImageKey}-${Date.now()}`;
    
    return (
      <CharacterAvatarDisplay
        key={renderKey}
        avatarData={avatarData}
        size={size}
        showAnimation={showAnimation}
        className={className}
        emotion={emotion}
        pose={pose}
      />
    );
  }

  // Legacy robot display for backward compatibility
  // Container-responsive size classes
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
    // Always use cyan glowing eyes for the modern look
    const baseEyeColor = 'bg-cyan-400 shadow-cyan-400/50';
    
    switch (emotion) {
      case 'excited': return `${baseEyeColor} animate-pulse shadow-lg`;
      case 'celebrating': return `${baseEyeColor} animate-bounce shadow-lg`;
      case 'focused': return `${baseEyeColor} brightness-150 shadow-lg`;
      case 'scanning': return `${baseEyeColor} animate-ping shadow-lg`;
      case 'charging': return `${baseEyeColor} animate-pulse opacity-60 shadow-lg`;
      default: return `${baseEyeColor} shadow-lg`;
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
      className={`${sizeClasses[size]} ${className} border-2 border-primary/30 bg-gradient-to-br ${getBackgroundGradient(avatarData.background)} transition-all duration-300 flex flex-col overflow-visible`}
      style={{ 
        boxShadow: `0 0 20px ${accent}40, inset 0 0 20px ${primary}20`,
        objectFit: 'contain',
        maxHeight: '100%'
      }}
    >
      {/* Header Section: Labels, Power Level, Status */}
      <div className="relative flex justify-between items-start p-2 z-10 min-h-6">
        {/* Left: Chassis Label and Power Level */}
        <div className="flex flex-col gap-1">
          <div className="bg-black/60 px-2 py-1 rounded text-xs font-bold text-white">
            {avatarData.chassis_type.replace('_', ' ').toUpperCase()}
          </div>
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
        
        {/* Right: Status Badge and Special Features */}
        <div className="flex flex-col items-end gap-1">
          {showAnimation && (currentPose !== 'idle' || emotion !== 'happy') && (
            <Badge className="text-xs animate-pulse z-20" style={{ backgroundColor: accent }}>
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
          {getChassisSpecialFeatures(avatarData.chassis_type, size)}
        </div>
      </div>

      {/* Main Robot Section */}
      <div className="flex-1 flex items-center justify-center p-2 z-5">
        <div 
          className={`relative ${getAnimationClass(currentPose, emotion)} ${getChassisStyle(avatarData.chassis_type)}`}
        >
          {/* Robot Head */}
          <div 
            className={`${currentBodySize.head} rounded-xl border border-slate-600 shadow-2xl mb-1 mx-auto relative overflow-hidden`}
            style={{ 
              background: `linear-gradient(135deg, hsl(210, 15%, 15%), hsl(210, 10%, 25%), hsl(210, 15%, 20%))`,
              boxShadow: `0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.8)`
            }}
          >
            {/* Helmet visor effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-transparent via-slate-900/50 to-black/80" />
            
            {/* Robot Eyes - Large oval glowing eyes */}
            <div className="flex gap-2 absolute top-1/3 left-1/2 transform -translate-x-1/2">
              <div 
                className={`${size === 'small' ? 'w-2 h-3' : size === 'medium' ? 'w-3 h-4' : 'w-4 h-5'} rounded-full ${getRobotEyeDisplay(emotion, avatarData.eye_color)} border border-cyan-300/30`}
                style={{ 
                  background: 'radial-gradient(ellipse at center, #00ffff, #0088ff)',
                  boxShadow: '0 0 15px cyan, inset 0 0 10px rgba(0, 255, 255, 0.5)'
                }}
              />
              <div 
                className={`${size === 'small' ? 'w-2 h-3' : size === 'medium' ? 'w-3 h-4' : 'w-4 h-5'} rounded-full ${getRobotEyeDisplay(emotion, avatarData.eye_color)} border border-cyan-300/30`}
                style={{ 
                  background: 'radial-gradient(ellipse at center, #00ffff, #0088ff)',
                  boxShadow: '0 0 15px cyan, inset 0 0 10px rgba(0, 255, 255, 0.5)'
                }}
              />
            </div>
            
            {/* Head details - subtle panel lines */}
            <div className="absolute inset-2 border border-slate-500/30 rounded-lg" />
          </div>

          {/* Robot Body */}
          <div 
            className={`${currentBodySize.body} rounded-xl border border-slate-600 shadow-2xl mx-auto relative mb-1 overflow-hidden`}
            style={{ 
              background: `linear-gradient(135deg, hsl(210, 15%, 12%), hsl(210, 10%, 22%), hsl(210, 15%, 18%))`,
              boxShadow: `0 0 25px rgba(0, 255, 255, 0.2), inset 0 0 30px rgba(0, 0, 0, 0.9)`
            }}
          >
            {/* Body armor plating effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-transparent via-slate-800/30 to-black/60" />
            
            {/* Chest Energy Core - Rectangular glowing panel */}
            <div 
              className={`absolute top-2 left-1/2 transform -translate-x-1/2 ${currentBodySize.core} rounded border border-cyan-400/50 flex items-center justify-center`}
              style={{ 
                background: `linear-gradient(135deg, rgba(0, 255, 255, 0.8), rgba(0, 136, 255, 0.6))`,
                boxShadow: '0 0 20px cyan, inset 0 0 15px rgba(0, 255, 255, 0.3)',
                animation: avatarData.energy_core === 'quantum' ? 'pulse 2s infinite' : 
                          avatarData.energy_core === 'fusion' ? 'ping 3s infinite' : 'pulse 3s infinite'
              }}
            >
              <div className="w-full h-full bg-gradient-to-b from-cyan-300/50 to-cyan-500/50 rounded" />
            </div>

            {/* Body panel details and joints */}
            <div className="absolute inset-1 border border-slate-500/20 rounded-lg" />
            <div className="absolute top-1/2 left-1 right-1 h-0.5 bg-slate-500/30" />
            <div className="absolute top-1/4 bottom-1/4 left-1/2 w-0.5 bg-slate-500/30" />
            
            {/* Shoulder joints */}
            <div className="absolute top-1 left-0 w-1 h-1 bg-slate-400 rounded-full border border-slate-600" />
            <div className="absolute top-1 right-0 w-1 h-1 bg-slate-400 rounded-full border border-slate-600" />
          </div>

          {/* Robot Legs */}
          <div className="flex gap-1 justify-center">
            <div 
              className={`${size === 'small' ? 'w-3 h-4' : size === 'medium' ? 'w-4 h-6' : 'w-6 h-8'} rounded-lg border border-slate-600 shadow-xl relative overflow-hidden`}
              style={{ 
                background: `linear-gradient(135deg, hsl(210, 15%, 15%), hsl(210, 10%, 25%))`,
                boxShadow: `0 0 15px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(0, 0, 0, 0.9)`
              }}
            >
              <div className="absolute inset-0.5 border border-slate-500/20 rounded" />
              <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-slate-500/30" />
            </div>
            <div 
              className={`${size === 'small' ? 'w-3 h-4' : size === 'medium' ? 'w-4 h-6' : 'w-6 h-8'} rounded-lg border border-slate-600 shadow-xl relative overflow-hidden`}
              style={{ 
                background: `linear-gradient(135deg, hsl(210, 15%, 15%), hsl(210, 10%, 25%))`,
                boxShadow: `0 0 15px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(0, 0, 0, 0.9)`
              }}
            >
              <div className="absolute inset-0.5 border border-slate-500/20 rounded" />
              <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-slate-500/30" />
            </div>
          </div>

          {/* Robot Feet */}
          <div className="flex gap-1 justify-center mt-0.5">
            <div 
              className={`${size === 'small' ? 'w-3.5 h-2' : size === 'medium' ? 'w-5 h-3' : 'w-7 h-4'} rounded-lg border border-slate-600 shadow-xl relative overflow-hidden`}
              style={{ 
                background: `linear-gradient(135deg, hsl(210, 12%, 18%), hsl(210, 8%, 28%))`,
                boxShadow: `0 0 10px rgba(0, 0, 0, 0.8), inset 0 0 8px rgba(0, 0, 0, 0.9)`
              }}
            >
              {avatarData.shoes === 'hover_boots' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400 opacity-80 animate-pulse shadow-cyan-400/50" 
                     style={{ boxShadow: '0 0 8px cyan' }} />
              )}
              <div className="absolute inset-0.5 border border-slate-500/20 rounded" />
            </div>
            <div 
              className={`${size === 'small' ? 'w-3.5 h-2' : size === 'medium' ? 'w-5 h-3' : 'w-7 h-4'} rounded-lg border border-slate-600 shadow-xl relative overflow-hidden`}
              style={{ 
                background: `linear-gradient(135deg, hsl(210, 12%, 18%), hsl(210, 8%, 28%))`,
                boxShadow: `0 0 10px rgba(0, 0, 0, 0.8), inset 0 0 8px rgba(0, 0, 0, 0.9)`
              }}
            >
              {avatarData.shoes === 'hover_boots' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400 opacity-80 animate-pulse shadow-cyan-400/50" 
                     style={{ boxShadow: '0 0 8px cyan' }} />
              )}
              <div className="absolute inset-0.5 border border-slate-500/20 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section: Speech Bubbles */}
      <div className="relative z-20 min-h-8 flex justify-center items-start">
        {emotion === 'celebrating' && (
          <div className="bg-green-600/90 rounded-lg px-2 py-1 text-xs font-bold shadow-lg border border-green-400/40 animate-bounce text-white max-w-40 text-center">
            Great workout! 💪 Keep it up!
          </div>
        )}
        {emotion === 'excited' && (
          <div className="bg-orange-600/90 rounded-lg px-2 py-1 text-xs font-bold shadow-lg border border-orange-400/40 animate-pulse text-white max-w-40 text-center">
            Let's crush this workout! 🔥
          </div>
        )}
        {emotion === 'scanning' && (
          <div className="bg-blue-900/80 rounded-lg px-2 py-1 text-xs font-bold shadow-lg border border-cyan-400/40 animate-pulse text-cyan-100 max-w-40 text-center">
            Analyzing your form... 📊
          </div>
        )}
        {currentPose === 'workout' && (
          <div className="bg-purple-600/90 rounded-lg px-2 py-1 text-xs font-bold shadow-lg border border-purple-400/40 animate-bounce text-white max-w-40 text-center">
            You got this! 💪
          </div>
        )}
      </div>
    </Card>
  );
};

export default React.memo(RobotAvatarDisplay, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  return (
    JSON.stringify(prevProps.avatarData) === JSON.stringify(nextProps.avatarData) &&
    prevProps.size === nextProps.size &&
    prevProps.showAnimation === nextProps.showAnimation &&
    prevProps.className === nextProps.className &&
    prevProps.emotion === nextProps.emotion &&
    prevProps.pose === nextProps.pose
  );
});