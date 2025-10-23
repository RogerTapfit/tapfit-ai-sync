import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, MapPin, Clock, Target } from "lucide-react";
import { RunSettings } from "@/types/run";
import { RunGPSWarningBanner } from "@/components/RunGPSWarningBanner";

const RunSetup = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<RunSettings>({
    unit: 'km',
    auto_pause: true,
    audio_cues: true,
    goal_type: 'distance',
    goal_value: 5000, // 5km default
  });

  const handleStart = () => {
    // Store settings and navigate to active run page
    sessionStorage.setItem('runSettings', JSON.stringify(settings));
    navigate('/run/active');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Setup Your Run</h1>
        </div>

        {/* GPS Warning Banner */}
        <RunGPSWarningBanner />

        {/* Run Type */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <Label className="text-lg font-semibold">Run Type</Label>
            </div>
            <RadioGroup
              value={settings.goal_type || 'none'}
              onValueChange={(value: 'distance' | 'time' | 'none') =>
                setSettings({ ...settings, goal_type: value })
              }
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="distance" id="distance" />
                <Label htmlFor="distance" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Distance Goal</div>
                  <div className="text-sm text-muted-foreground">
                    Run a specific distance
                  </div>
                </Label>
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="time" id="time" />
                <Label htmlFor="time" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Time Goal</div>
                  <div className="text-sm text-muted-foreground">
                    Run for a specific duration
                  </div>
                </Label>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Free Run</div>
                  <div className="text-sm text-muted-foreground">
                    No specific goal, just run
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </Card>

        {/* Distance Goal */}
        {settings.goal_type === 'distance' && (
          <Card className="p-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Target Distance</Label>
              <RadioGroup
                value={settings.goal_value?.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, goal_value: parseInt(value) })
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="1000" id="1k" />
                    <Label htmlFor="1k" className="cursor-pointer font-medium">1 km</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="3000" id="3k" />
                    <Label htmlFor="3k" className="cursor-pointer font-medium">3 km</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="5000" id="5k" />
                    <Label htmlFor="5k" className="cursor-pointer font-medium">5 km</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="10000" id="10k" />
                    <Label htmlFor="10k" className="cursor-pointer font-medium">10 km</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </Card>
        )}

        {/* Duration Goal */}
        {settings.goal_type === 'time' && (
          <Card className="p-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Target Duration (minutes)</Label>
              <RadioGroup
                value={settings.goal_value?.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, goal_value: parseInt(value) })
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="15" id="15min" />
                    <Label htmlFor="15min" className="cursor-pointer font-medium">15 min</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="30" id="30min" />
                    <Label htmlFor="30min" className="cursor-pointer font-medium">30 min</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="45" id="45min" />
                    <Label htmlFor="45min" className="cursor-pointer font-medium">45 min</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="60" id="60min" />
                    <Label htmlFor="60min" className="cursor-pointer font-medium">60 min</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </Card>
        )}

        {/* Start Button */}
        <Button
          size="lg"
          onClick={handleStart}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xl py-6"
        >
          <MapPin className="h-6 w-6 mr-2" />
          Start Run
        </Button>
      </div>
    </div>
  );
};

export default RunSetup;
