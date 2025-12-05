import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PLATFORM_CONFIG, Platform } from '@/hooks/useScreenTimeBank';
import { Smartphone } from 'lucide-react';

interface ScreenTimePlatformSelectorProps {
  onSelect: (platform: Platform) => void;
  availableMinutes: number;
}

export const ScreenTimePlatformSelector = ({ onSelect, availableMinutes }: ScreenTimePlatformSelectorProps) => {
  const platforms: Platform[] = ['instagram', 'tiktok', 'youtube', 'snapchat', 'twitter', 'other'];

  const isDisabled = availableMinutes <= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Smartphone className="h-5 w-5" />
          Start Using Screen Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isDisabled && (
          <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
            <p className="text-sm text-orange-500">
              💪 No screen time available! Complete push-ups with your fitness alarm to earn more.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          {platforms.map((platform) => {
            const config = PLATFORM_CONFIG[platform];
            return (
              <Button
                key={platform}
                variant="outline"
                className={`h-auto py-4 flex flex-col items-center gap-2 hover:bg-gradient-to-br hover:${config.color} hover:text-white hover:border-transparent transition-all duration-300 ${isDisabled ? 'opacity-50' : ''}`}
                onClick={() => onSelect(platform)}
                disabled={isDisabled}
              >
                <span className="text-3xl">{config.icon}</span>
                <span className="font-medium text-sm">{config.name}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
