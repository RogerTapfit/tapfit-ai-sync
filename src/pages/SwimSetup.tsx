import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Waves, Target, Ruler, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useSwimTracker } from '@/hooks/useSwimTracker';
import { SwimSettings } from '@/types/swim';
import { toast } from 'sonner';
import { calculateHRZones, estimateMaxHR } from '@/utils/heartRateZones';

export default function SwimSetup() {
  const navigate = useNavigate();
  const { initialize, start } = useSwimTracker();
  const [isStarting, setIsStarting] = useState(false);

  const [settings, setSettings] = useState<SwimSettings>({
    unit: 'm',
    audio_cues: true,
    goal_type: 'none',
    stroke_type: 'freestyle',
    pool_length_m: 25,
    training_mode: 'pace_based',
  });

  const handleStart = async () => {
    try {
      setIsStarting(true);
      
      if (settings.training_mode && settings.training_mode !== 'pace_based') {
        const age = 30;
        const maxHR = estimateMaxHR(age);
        const zones = calculateHRZones(maxHR);
        
        if (settings.training_mode === 'zone2_endurance') {
          settings.target_hr_zone = {
            min_bpm: zones[1].min_bpm,
            max_bpm: zones[1].max_bpm,
            zone_name: 'Zone 2 - Aerobic Endurance',
          };
        } else if (settings.training_mode === 'zone3_tempo') {
          settings.target_hr_zone = {
            min_bpm: zones[2].min_bpm,
            max_bpm: zones[2].max_bpm,
            zone_name: 'Zone 3 - Tempo',
          };
        }
      }

      await initialize(settings);
      start();
      navigate('/swim/active');
    } catch (error) {
      console.error('Failed to start swim:', error);
      toast.error('Failed to start swim session');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-500/5 pb-20 pt-safe">
      <div className="container max-w-2xl mx-auto p-4 space-y-6 animate-fade-in">
        {/* Header */}
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
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Swimming Setup</h1>
              <p className="text-sm text-muted-foreground">Configure your swim session</p>
            </div>
          </div>
        </div>

        {/* Pool Settings */}
        <Card className="p-6 space-y-4 border-blue-500/20 hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Pool Settings</h2>
          </div>

          <div className="space-y-2">
            <Label>Pool Length</Label>
            <Select
              value={settings.pool_length_m.toString()}
              onValueChange={(value) => setSettings({ ...settings, pool_length_m: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 meters (Short Course)</SelectItem>
                <SelectItem value="50">50 meters (Olympic)</SelectItem>
                <SelectItem value="22.86">25 yards (Short Course Yards)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stroke Type</Label>
            <Select
              value={settings.stroke_type}
              onValueChange={(value: any) => setSettings({ ...settings, stroke_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freestyle">Freestyle</SelectItem>
                <SelectItem value="backstroke">Backstroke</SelectItem>
                <SelectItem value="breaststroke">Breaststroke</SelectItem>
                <SelectItem value="butterfly">Butterfly</SelectItem>
                <SelectItem value="mixed">Mixed / IM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Distance Unit</Label>
            <Select
              value={settings.unit}
              onValueChange={(value: 'yd' | 'm') => setSettings({ ...settings, unit: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="m">Meters</SelectItem>
                <SelectItem value="yd">Yards</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Training Mode */}
        <Card className="p-6 space-y-4 border-purple-500/20 hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold">Training Mode</h2>
          </div>

          <div className="space-y-2">
            <Label>Mode</Label>
            <Select
              value={settings.training_mode}
              onValueChange={(value: any) => setSettings({ ...settings, training_mode: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pace_based">Pace Based</SelectItem>
                <SelectItem value="zone2_endurance">Zone 2 - Aerobic Endurance</SelectItem>
                <SelectItem value="zone3_tempo">Zone 3 - Tempo</SelectItem>
                <SelectItem value="intervals">Interval Training</SelectItem>
                <SelectItem value="recovery">Recovery Swim</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Goal Setting */}
        <Card className="p-6 space-y-4 border-green-500/20 hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">Goal (Optional)</h2>
          </div>

          <div className="space-y-2">
            <Label>Goal Type</Label>
            <Select
              value={settings.goal_type}
              onValueChange={(value: any) => setSettings({ ...settings, goal_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Goal</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="laps">Number of Laps</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.goal_type !== 'none' && (
            <div className="space-y-2">
              <Label>
                Target {settings.goal_type === 'distance' ? `(${settings.unit})` : 
                         settings.goal_type === 'time' ? '(minutes)' : '(laps)'}
              </Label>
              <Input
                type="number"
                value={settings.goal_value || ''}
                onChange={(e) => setSettings({ ...settings, goal_value: parseFloat(e.target.value) })}
                placeholder="Enter goal value"
              />
            </div>
          )}
        </Card>

        {/* Audio Settings */}
        <Card className="p-6 space-y-4 border-orange-500/20 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <Label>Audio Cues</Label>
              <p className="text-sm text-muted-foreground">Voice feedback for laps and milestones</p>
            </div>
            <Switch
              checked={settings.audio_cues}
              onCheckedChange={(checked) => setSettings({ ...settings, audio_cues: checked })}
            />
          </div>
        </Card>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={isStarting}
          className="w-full h-16 text-lg bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-800 hover:to-cyan-800 shadow-lg hover-scale"
        >
          <Waves className="h-6 w-6 mr-2" />
          {isStarting ? 'Starting...' : 'Start Swimming'}
        </Button>
      </div>
    </div>
  );
}
