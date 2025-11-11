import React, { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, VolumeX, TestTube, Upload, Mic } from "lucide-react";
import { useAudioSettings } from "@/utils/audioUtils";
import { useWorkoutAudio, type ElevenLabsVoice } from "@/hooks/useWorkoutAudio";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AudioSettings = () => {
  const { isEnabled, volume, toggleAudio, updateVolume } = useAudioSettings();
  const { selectedVoice, changeVoice, speak } = useWorkoutAudio();
  const [customSounds, setCustomSounds] = useState<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voices: { value: ElevenLabsVoice; label: string; description: string }[] = [
    { value: 'Aria', label: 'Aria', description: 'Energetic female voice' },
    { value: 'Roger', label: 'Roger', description: 'Strong male voice' },
    { value: 'Sarah', label: 'Sarah', description: 'Calm female voice' },
    { value: 'Laura', label: 'Laura', description: 'Professional female voice' },
    { value: 'Charlie', label: 'Charlie', description: 'Friendly male voice' },
    { value: 'George', label: 'George', description: 'Deep male voice' },
  ];

  const testVoice = () => {
    speak("Great work! Keep pushing through this set!", 'normal');
  };

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, soundType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    try {
      const url = URL.createObjectURL(file);
      const { audioManager } = await import('@/utils/audioUtils');
      
      // Test load the audio
      await audioManager.loadAudio(url, soundType);
      
      // Save to state
      setCustomSounds(prev => new Map(prev).set(soundType, url));
      toast.success(`Custom ${soundType} sound loaded successfully`);
    } catch (error) {
      toast.error('Failed to load audio file');
      console.error('Audio load error:', error);
    }
  };

  const testCustomSound = async (soundType: string) => {
    const url = customSounds.get(soundType);
    if (!url) return;

    const { audioManager } = await import('@/utils/audioUtils');
    await audioManager.playCustomSound(url, soundType);
  };

  // Save custom sounds to localStorage for persistence
  React.useEffect(() => {
    const soundsObj = Object.fromEntries(customSounds);
    localStorage.setItem('customSounds', JSON.stringify(soundsObj));
  }, [customSounds]);

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

      {/* Voice Selection */}
      {isEnabled && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            <p className="font-medium">Text-to-Speech Voice</p>
          </div>
          <div className="space-y-2">
            <Select value={selectedVoice} onValueChange={(value: ElevenLabsVoice) => changeVoice(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{voice.label}</span>
                      <span className="text-xs text-muted-foreground">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={testVoice}
              className="w-full"
            >
              Test Voice
            </Button>
          </div>
        </div>
      )}

      {/* Custom Sound Upload */}
      {isEnabled && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <p className="font-medium">Custom Sounds</p>
          </div>
          
          {['set-complete', 'workout-complete', 'progress-milestone'].map((soundType) => (
            <div key={soundType} className="space-y-2">
              <Label className="text-sm font-medium capitalize">
                {soundType.replace('-', ' ')} Sound
              </Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, soundType)}
                  className="flex-1"
                />
                {customSounds.has(soundType) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testCustomSound(soundType)}
                  >
                    Test
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sound Preview */}
      {isEnabled && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TestTube className="h-4 w-4 text-primary" />
            <p className="font-medium">Test Default Sounds</p>
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