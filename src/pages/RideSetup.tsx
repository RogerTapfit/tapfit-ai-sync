import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bike, Home, Clock, MapPin, Heart, Info, History } from 'lucide-react';
import { RideSettings } from '@/types/ride';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SEO from '@/components/SEO';

export default function RideSetup() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<RideSettings>({
    unit: 'km',
    auto_pause: true,
    audio_cues: true,
    goal_type: 'none',
    ride_type: 'road',
    training_mode: 'pace_based',
  });

  const handleStartRide = () => {
    localStorage.setItem('ride_settings', JSON.stringify(settings));
    navigate('/ride/active');
  };

  const getZoneDescription = (zone: string) => {
    switch (zone) {
      case 'zone2_endurance':
        return '60-70% HR max • Conversational pace • Build aerobic base • 1-3 hours typical';
      case 'zone3_tempo':
        return '70-80% HR max • Comfortably hard • Improve lactate threshold • 30-90 min typical';
      case 'intervals':
        return '80-90% HR max • High intensity intervals • Build VO2 max • 20-45 min total';
      case 'recovery':
        return '50-60% HR max • Very easy spinning • Active recovery • 30-60 min';
      default:
        return 'GPS tracking without heart rate guidance';
    }
  };

  return (
    <>
      <SEO title="Setup Ride" description="Configure your cycling workout with GPS tracking and heart rate training" />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <Home className="h-5 w-5" />
              </Button>
              <span className="font-semibold">Setup Ride</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/ride/history')}>
              <History className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="container max-w-2xl mx-auto p-4 space-y-4">
          {/* Info Banner */}
          <Alert>
            <Bike className="h-4 w-4" />
            <AlertDescription>
              GPS tracking with optional heart rate training. Pair your Apple Watch for real-time HR monitoring.
            </AlertDescription>
          </Alert>

          {/* Ride Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bike className="h-5 w-5" />
                Ride Type
              </CardTitle>
              <CardDescription>Select your cycling environment</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={settings.ride_type} onValueChange={(v: any) => setSettings({ ...settings, ride_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="road">🚴 Road Cycling</SelectItem>
                  <SelectItem value="mountain">🏔️ Mountain Biking</SelectItem>
                  <SelectItem value="indoor">🏠 Indoor Trainer</SelectItem>
                  <SelectItem value="commute">🚲 Commute</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Training Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Training Mode
              </CardTitle>
              <CardDescription>Choose heart rate training strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={settings.training_mode} onValueChange={(v: any) => setSettings({ ...settings, training_mode: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pace_based">GPS Only (No HR)</SelectItem>
                  <SelectItem value="zone2_endurance">Zone 2 Endurance</SelectItem>
                  <SelectItem value="zone3_tempo">Zone 3 Tempo</SelectItem>
                  <SelectItem value="intervals">Zone 4 Intervals</SelectItem>
                  <SelectItem value="recovery">Recovery Ride</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2 p-3 bg-muted rounded-lg">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{getZoneDescription(settings.training_mode || 'pace_based')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Goal Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={settings.goal_type} onValueChange={(v: any) => setSettings({ ...settings, goal_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Free Ride</SelectItem>
                  <SelectItem value="distance">Distance Goal</SelectItem>
                  <SelectItem value="time">Time Goal</SelectItem>
                </SelectContent>
              </Select>

              {settings.goal_type === 'distance' && (
                <Select value={settings.goal_value?.toString()} onValueChange={(v) => setSettings({ ...settings, goal_value: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select distance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10000">10 km</SelectItem>
                    <SelectItem value="20000">20 km</SelectItem>
                    <SelectItem value="30000">30 km</SelectItem>
                    <SelectItem value="50000">50 km</SelectItem>
                    <SelectItem value="100000">100 km</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {settings.goal_type === 'time' && (
                <Select value={settings.goal_value?.toString()} onValueChange={(v) => setSettings({ ...settings, goal_value: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="2700">45 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                    <SelectItem value="5400">1.5 hours</SelectItem>
                    <SelectItem value="7200">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Ride Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Ride Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-pause">Auto-pause</Label>
                <Switch
                  id="auto-pause"
                  checked={settings.auto_pause}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_pause: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="audio-cues">Audio cues</Label>
                <Switch
                  id="audio-cues"
                  checked={settings.audio_cues}
                  onCheckedChange={(checked) => setSettings({ ...settings, audio_cues: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="unit">Distance unit</Label>
                <Select value={settings.unit} onValueChange={(v: any) => setSettings({ ...settings, unit: v })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">Kilometers</SelectItem>
                    <SelectItem value="mi">Miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Start Button */}
          <Button className="w-full" size="lg" onClick={handleStartRide}>
            <Bike className="h-5 w-5 mr-2" />
            Start Ride
          </Button>
        </div>
      </div>
    </>
  );
}
