import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Activity, Heart, Target } from 'lucide-react';
import { useHeartRate } from '@/hooks/useHeartRate';
import { useToast } from '@/hooks/use-toast';

interface MobileActionBarProps {
  canStart: boolean;
  canRep: boolean;
  onStart: () => void;
  onRep: () => void;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({ canStart, canRep, onStart, onRep }) => {
  const { start } = useHeartRate();
  const { toast } = useToast();

  const handleLiveHR = useCallback(async () => {
    try {
      toast({ title: 'Connecting to Apple Watch…', description: 'Starting live heart rate', });
      await start('functionalStrengthTraining');
      toast({ title: 'Live HR started', description: 'Keep the TapFit watch app open on your Apple Watch.' });
    } catch (e: any) {
      toast({ title: 'Heart rate error', description: e?.message ?? 'Failed to start live HR', variant: 'destructive' });
    }
  }, [start, toast]);

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-40">
      <div className="bg-background/95 border-t shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <Button onClick={onStart} disabled={!canStart} className="flex-1">
            <Activity className="h-4 w-4 mr-2" />
            Start
          </Button>
          <Button variant="outline" onClick={onRep} disabled={!canRep} className="flex-1">
            <Target className="h-4 w-4 mr-2" />
            Rep Test
          </Button>
          <Button variant="secondary" onClick={handleLiveHR} className="flex-1">
            <Heart className="h-4 w-4 mr-2" />
            Live HR
          </Button>
        </div>
      </div>
    </div>
  );
};
