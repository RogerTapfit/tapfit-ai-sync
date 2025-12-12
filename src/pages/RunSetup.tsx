import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, MapPin, Clock, Target, Heart, Activity, Footprints } from "lucide-react";
import { RunSettings } from "@/types/run";
import { RunGPSWarningBanner } from "@/components/RunGPSWarningBanner";
import { calculateHRZones, estimateMaxHR } from "@/utils/heartRateZones";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePageContext } from '@/hooks/usePageContext';

const RunSetup = () => {
  const navigate = useNavigate();
  const [userMaxHR, setUserMaxHR] = useState<number>(180);
  const [hrZones, setHRZones] = useState(calculateHRZones(180));

  const [settings, setSettings] = useState<RunSettings>({
    activity_type: 'run',
    unit: 'km',
    auto_pause: true,
    audio_cues: true,
    goal_type: 'distance',
    goal_value: 5000,
    training_mode: 'pace_based',
  });

  // Register page context for chatbot
  usePageContext({
    pageName: 'Run/Walk Setup',
    pageDescription: 'Configure your outdoor run or walk with training mode, distance/time goals, and heart rate zones',
    visibleContent: `Setting up outdoor ${settings.activity_type || 'run'}. Activity types: Run, Walk. Training modes: Pace-Based, Steady Jog (Zone 2), Steady Run (Zone 3), Interval Training. Goal options: distance (1-10km) or time (15-60 min). Max HR: ${userMaxHR} bpm`
  });

  useEffect(() => {
    // Fetch user's HR max from profile
    const fetchUserHR = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('hr_max, age')
          .eq('id', user.id)
          .single();

        if (profile?.hr_max) {
          setUserMaxHR(profile.hr_max);
          setHRZones(calculateHRZones(profile.hr_max));
        } else if (profile?.age) {
          const estimatedMax = estimateMaxHR(profile.age);
          setUserMaxHR(estimatedMax);
          setHRZones(calculateHRZones(estimatedMax));
        }
      } catch (error) {
        console.error('Failed to fetch HR data:', error);
      }
    };

    fetchUserHR();
  }, []);

  const handleTrainingModeChange = (mode: string) => {
    const zone2 = hrZones[1]; // Zone 2 - Aerobic
    const zone3 = hrZones[2]; // Zone 3 - Tempo
    const zone4 = hrZones[3]; // Zone 4 - Threshold

    let newSettings = { ...settings, training_mode: mode as any };

    switch (mode) {
      case 'steady_jog':
        newSettings.target_hr_zone = {
          min_bpm: zone2.min_bpm,
          max_bpm: zone2.max_bpm,
          zone_name: zone2.name,
        };
        break;
      case 'steady_run':
        newSettings.target_hr_zone = {
          min_bpm: zone3.min_bpm,
          max_bpm: zone3.max_bpm,
          zone_name: zone3.name,
        };
        break;
      case 'intervals':
        newSettings.target_hr_zone = {
          min_bpm: zone2.min_bpm,
          max_bpm: zone4.max_bpm,
          zone_name: 'Zone 2-4 Intervals',
        };
        newSettings.interval_config = {
          work_zone: { min_bpm: zone4.min_bpm, max_bpm: zone4.max_bpm },
          recovery_zone: { min_bpm: zone2.min_bpm, max_bpm: zone2.max_bpm },
          work_duration_s: 120,
          recovery_duration_s: 60,
        };
        break;
      case 'pace_based':
        newSettings.target_hr_zone = undefined;
        newSettings.interval_config = undefined;
        break;
    }

    setSettings(newSettings);
  };

  const handleStart = () => {
    // Validate HR mode requires Apple Watch
    if (settings.training_mode && settings.training_mode !== 'pace_based') {
      toast.info('Make sure your Apple Watch is paired and the TapFit Watch app is installed', {
        duration: 4000,
      });
    }

    // Store settings and navigate to active run page
    sessionStorage.setItem('runSettings', JSON.stringify(settings));
    navigate('/run/active');
  };

  const zone2 = hrZones[1];
  const zone3 = hrZones[2];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-500/5 p-4">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover-scale"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${settings.activity_type === 'walk' ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                {settings.activity_type === 'walk' ? (
                  <Footprints className="h-6 w-6 text-green-500" />
                ) : (
                  <Activity className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <h1 className="text-3xl font-bold">
                Setup Your {settings.activity_type === 'walk' ? 'Walk' : 'Run'}
              </h1>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/run/history')}
            className="hover-scale"
          >
            History
          </Button>
        </div>

        {/* Activity Type Selection */}
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-primary/20 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <Label className="text-lg font-semibold">Activity Type</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSettings({ ...settings, activity_type: 'run' })}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                  settings.activity_type === 'run' 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-border hover:border-blue-500/50 hover:bg-blue-500/5'
                }`}
              >
                <Activity className={`h-8 w-8 ${settings.activity_type === 'run' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                <span className={`font-semibold ${settings.activity_type === 'run' ? 'text-blue-500' : ''}`}>Run</span>
                <span className="text-xs text-muted-foreground">Jogging or running</span>
              </button>
              
              <button
                onClick={() => setSettings({ ...settings, activity_type: 'walk', training_mode: 'pace_based' })}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                  settings.activity_type === 'walk' 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-border hover:border-green-500/50 hover:bg-green-500/5'
                }`}
              >
                <Footprints className={`h-8 w-8 ${settings.activity_type === 'walk' ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className={`font-semibold ${settings.activity_type === 'walk' ? 'text-green-500' : ''}`}>Walk</span>
                <span className="text-xs text-muted-foreground">Casual or brisk walk</span>
              </button>
            </div>
          </div>
        </Card>

        {/* GPS Warning Banner */}
        <RunGPSWarningBanner />

        {/* Training Mode - Only show for runs */}
        {settings.activity_type === 'run' && (
          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-red-500/20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-500/10 rounded-lg animate-pulse">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
                <Label className="text-lg font-semibold">Training Mode</Label>
              </div>
              
              <div className="text-sm text-muted-foreground mb-2">
                Max HR: {userMaxHR} bpm
              </div>

              <RadioGroup
                value={settings.training_mode || 'pace_based'}
                onValueChange={handleTrainingModeChange}
              >
                {/* Pace-Based (Default) */}
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent hover:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value="pace_based" id="pace_based" />
                  <Label htmlFor="pace_based" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Pace-Based Run</div>
                    <div className="text-sm text-muted-foreground">
                      Traditional pace/distance tracking
                    </div>
                  </Label>
                </div>

                {/* Steady Jog - Zone 2 */}
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent hover:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value="steady_jog" id="steady_jog" />
                  <Label htmlFor="steady_jog" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Steady Jog - Zone 2</div>
                    <div className="text-sm text-muted-foreground">
                      {zone2.min_bpm}-{zone2.max_bpm} bpm • Easy conversational pace
                    </div>
                  </Label>
                </div>

                {/* Steady Run - Zone 3 */}
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent hover:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value="steady_run" id="steady_run" />
                  <Label htmlFor="steady_run" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Steady Run - Zone 3</div>
                    <div className="text-sm text-muted-foreground">
                      {zone3.min_bpm}-{zone3.max_bpm} bpm • Moderate intensity
                    </div>
                  </Label>
                </div>

                {/* Interval Training */}
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent hover:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value="intervals" id="intervals" />
                  <Label htmlFor="intervals" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Interval Training</div>
                    <div className="text-sm text-muted-foreground">
                      Alternate between jog and run based on HR
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* Interval Note */}
              {settings.training_mode === 'intervals' && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <Label className="font-semibold">Interval Guidance</Label>
                  <p className="text-sm text-muted-foreground">
                    The app will guide you to speed up or slow down based on your heart rate zones. 
                    Work intervals target Zone 4, recovery in Zone 2.
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Run/Walk Goal */}
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-blue-500/20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <Label className="text-lg font-semibold">
                {settings.activity_type === 'walk' ? 'Walk' : 'Run'} Goal (Optional)
              </Label>
            </div>
            <RadioGroup
              value={settings.goal_type || 'none'}
              onValueChange={(value: 'distance' | 'time' | 'none') =>
                setSettings({ ...settings, goal_type: value })
              }
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent hover:border-primary transition-all cursor-pointer">
                <RadioGroupItem value="distance" id="distance" />
                <Label htmlFor="distance" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Distance Goal</div>
                  <div className="text-sm text-muted-foreground">
                    Run a specific distance
                  </div>
                </Label>
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent hover:border-primary transition-all cursor-pointer">
                <RadioGroupItem value="time" id="time" />
                <Label htmlFor="time" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Time Goal</div>
                  <div className="text-sm text-muted-foreground">
                    Run for a specific duration
                  </div>
                </Label>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent hover:border-primary transition-all cursor-pointer">
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
          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-green-500/20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-500" />
                </div>
                <Label className="text-lg font-semibold">Target Distance</Label>
              </div>
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
          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-purple-500/20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <Label className="text-lg font-semibold">Target Duration (minutes)</Label>
              </div>
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
          className={`w-full text-xl py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale animate-fade-in text-white ${
            settings.activity_type === 'walk' 
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
              : 'bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900'
          }`}
          style={{ animationDelay: '0.4s' }}
        >
          {settings.activity_type === 'walk' ? (
            <Footprints className="h-6 w-6 mr-2" />
          ) : (
            <Activity className="h-6 w-6 mr-2" />
          )}
          Start {settings.activity_type === 'walk' ? 'Walk' : 'Run'}
        </Button>
      </div>
    </div>
  );
};

export default RunSetup;
