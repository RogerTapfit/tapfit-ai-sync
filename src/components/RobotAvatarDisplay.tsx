import React from 'react';
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
  // Always use CharacterAvatarDisplay - no more legacy robots
  return (
    <CharacterAvatarDisplay 
      avatarData={avatarData} 
      size={size} 
      showAnimation={showAnimation}
      className={className}
      emotion={emotion}
      pose={pose}
    />
  );
};

export default React.memo(RobotAvatarDisplay, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.avatarData) === JSON.stringify(nextProps.avatarData) &&
    prevProps.size === nextProps.size &&
    prevProps.showAnimation === nextProps.showAnimation &&
    prevProps.className === nextProps.className &&
    prevProps.emotion === nextProps.emotion &&
    prevProps.pose === nextProps.pose
  );
});
