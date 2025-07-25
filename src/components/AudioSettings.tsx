import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, TestTube } from "lucide-react";
import { useAudioSettings } from "@/utils/audioUtils";

const AudioSettings = () => {
  const { isEnabled, volume, toggleAudio, updateVolume } = useAudioSettings();

  const testSound = async () => {
    const { audioManager } = await import('@/utils/audioUtils');
    await audioManager.playSetComplete();
  };

  const testProgressSound = async () => {
    const { audioManager } = await import('@/utils/audioUtils');
    await audioManager.playProgressMilestone(50);
  };

  const testWorkoutComplete = async () => {
    const { audioManager } = await import('@/utils/audioUtils');
    await audioManager.playWorkoutComplete();
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        {isEnabled ? (
          <Volume2 className="h-5 w-5 text-primary" />
        ) : (
          <VolumeX className="h-5 w-5 text-muted-foreground" />
        )}
        <h3 className="text-lg font-semibold">Audio Settings</h3>
      </div>

      {/* Enable/Disable Audio */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Sound Effects</p>
          <p className="text-sm text-muted-foreground">
            Play audio feedback during workouts
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={toggleAudio}
        />
      </div>

      {/* Volume Control */}
      {isEnabled && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">Volume</p>
            <span className="text-sm text-muted-foreground">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={(value) => updateVolume(value[0])}
            max={1}
            min={0}
            step={0.1}
            className="w-full"
          />
        </div>
      )}

      {/* Sound Preview */}
      {isEnabled && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TestTube className="h-4 w-4 text-primary" />
            <p className="font-medium">Test Sounds</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={testSound}
              className="h-10"
            >
              Set Complete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testProgressSound}
              className="h-10"
            >
              Progress Milestone
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testWorkoutComplete}
              className="h-10"
            >
              Workout Complete
            </Button>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Sound effects enhance your workout experience with audio feedback for completed sets, progress milestones, and rest timers.
      </div>
    </Card>
  );
};

export default AudioSettings;