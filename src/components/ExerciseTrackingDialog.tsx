import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Dumbbell, CheckCircle, Camera, ArrowRight } from 'lucide-react';
import { type ExerciseType } from '@/utils/exerciseDetection';
import { getExerciseDisplayName, getExerciseIcon } from '@/utils/machineExerciseMapping';

interface ExerciseTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineName: string;
  exercise: ExerciseType;
  context: string;
  onSelectAITracking: () => void;
  onSelectMachineWorkout: () => void;
}

export function ExerciseTrackingDialog({
  open,
  onOpenChange,
  machineName,
  exercise,
  context,
  onSelectAITracking,
  onSelectMachineWorkout
}: ExerciseTrackingDialogProps) {
  const exerciseName = getExerciseDisplayName(exercise);
  const exerciseIcon = getExerciseIcon(exercise);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Warm Up with AI Form Coach?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Exercise Preview Card */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{exerciseIcon}</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{exerciseName}</h3>
                <p className="text-muted-foreground text-sm">
                  Perfect {context} for {machineName}
                </p>
              </div>
            </div>
          </Card>

          {/* Benefits Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <Camera className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Real-time Tracking</p>
            </Card>
            <Card className="p-3 text-center">
              <Activity className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Form Feedback</p>
            </Card>
            <Card className="p-3 text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Auto Rep Count</p>
            </Card>
          </div>

          {/* Setup Tip */}
          <Card className="p-4 bg-muted/50">
            <div className="flex gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <p className="font-medium text-sm mb-1">Quick Setup Tip</p>
                <p className="text-xs text-muted-foreground">
                  Position your device at a 45° angle about 6-8 feet away, ensuring your full body is visible in the frame for best results.
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onSelectAITracking}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-primary-glow shadow-lg hover:shadow-xl hover:shadow-primary/25 hover:scale-105 transition-all duration-300"
            >
              <Activity className="w-5 h-5 mr-2" />
              Track My Form with AI
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button 
              onClick={onSelectMachineWorkout}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Dumbbell className="w-5 h-5 mr-2" />
              Skip to {machineName}
            </Button>
          </div>

          {/* Rewards Hint */}
          <div className="text-center">
            <Badge variant="secondary" className="px-3 py-1">
              🪙 Earn TapCoins for completing exercises with good form!
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
