import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bike, Home, Clock, MapPin, Heart, Info, History } from 'lucide-react';
import { RideSettings } from '@/types/ride';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SEO from '@/components/SEO';
import { usePageContext } from '@/hooks/usePageContext';

export default function RideSetup() {
  const navigate = useNavigate();

  // Register page context for chatbot
  usePageContext({
    pageName: 'Ride Setup',
    pageDescription: 'Configure your cycling ride with training mode, goals, and heart rate zones',
    visibleContent: 'Setting up cycling ride. Training modes: Zone 2 Endurance, Zone 3 Tempo, Intervals, Recovery. Set distance/time goals and ride type (road, mountain, indoor).'
  });

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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-green-500/5">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover-scale">
                <Home className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Bike className="h-5 w-5 text-green-500" />
                </div>
                <span className="font-semibold">Setup Ride</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/ride/history')} className="hover-scale">
              <History className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="container max-w-2xl mx-auto p-4 space-y-4 animate-fade-in">
          {/* Info Banner */}
          <Alert className="border-green-500/30 bg-green-500/5 animate-fade-in">
            <div className="p-2 bg-green-500/10 rounded-full">
              <Bike className="h-4 w-4 text-green-500" />
            </div>
            <AlertDescription className="ml-2">
              GPS tracking with optional heart rate training. Pair your Apple Watch for real-time HR monitoring.
            </AlertDescription>
          </Alert>

          {/* Ride Type */}
          <Card className="hover:shadow-lg transition-all duration-300 border-green-500/20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Bike className="h-5 w-5 text-green-500" />
                </div>
                Ride Type
              </CardTitle>
              <CardDescription>Select your cycling environment</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Select value={settings.ride_type} onValueChange={(v: any) => setSettings({ ...settings, ride_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <SelectItem value="road">🚴 Road Cycling</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-popover border shadow-lg z-[100]">
                        <p className="font-semibold mb-1">Road Cycling</p>
                        <p className="text-sm">Outdoor riding on paved roads. Optimized for tracking speed, distance, and elevation on smooth surfaces. Best for training rides, group rides, or solo adventures.</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <SelectItem value="mountain">🏔️ Mountain Biking</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-popover border shadow-lg z-[100]">
                        <p className="font-semibold mb-1">Mountain Biking</p>
                        <p className="text-sm">Off-road trail riding with variable terrain. Tracks technical sections, elevation changes, and challenging trails. Perfect for singletrack, cross-country, or enduro rides.</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <SelectItem value="indoor">🏠 Indoor Trainer</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-popover border shadow-lg z-[100]">
                        <p className="font-semibold mb-1">Indoor Trainer</p>
                        <p className="text-sm">Stationary bike or smart trainer workout. Focuses on power, cadence, and heart rate without GPS tracking. Ideal for structured interval training or bad weather days.</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <SelectItem value="commute">🚲 Commute</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-popover border shadow-lg z-[100]">
                        <p className="font-semibold mb-1">Commute</p>
                        <p className="text-sm">Daily transportation cycling to work or errands. Tracks your regular routes and helps monitor commute time. Great for tracking active transportation and carbon offset.</p>
                      </TooltipContent>
                    </Tooltip>
                  </SelectContent>
                </Select>
              </TooltipProvider>
            </CardContent>
          </Card>

          {/* Training Mode */}
          <Card className="hover:shadow-lg transition-all duration-300 border-red-500/20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-red-500/10 rounded-lg animate-pulse">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
                Training Mode
              </CardTitle>
              <CardDescription>Choose heart rate training strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <TooltipProvider>
                <Select value={settings.training_mode} onValueChange={(v: any) => setSettings({ ...settings, training_mode: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <SelectItem value="pace_based">GPS Only (No HR)</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-popover border shadow-lg z-[100]">
                        <p className="font-semibold mb-1">GPS Only Mode</p>
                        <p className="text-sm">Track your ride using GPS without heart rate monitoring. Perfect for casual rides or when you don't have a heart rate monitor.</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <SelectItem value="zone2_endurance">Zone 2 Endurance</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-popover border shadow-lg z-[100]">
                        <p className="font-semibold mb-1">Zone 2 Endurance</p>
                        <p className="text-sm text-muted-foreground mb-2">60-70% of max heart rate</p>
                        <p className="text-sm">Build your aerobic base with conversational-pace riding. You should be able to hold a conversation. Ideal for 1-3 hour rides to improve fat burning and endurance.</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <SelectItem value="zone3_tempo">Zone 3 Tempo</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-popover border shadow-lg z-[100]">
                        <p className="font-semibold mb-1">Zone 3 Tempo</p>
                        <p className="text-sm text-muted-foreground mb-2">70-80% of max heart rate</p>
                        <p className="text-sm">Comfortably hard sustained effort. Improves lactate threshold and race pace. Typical duration: 30-90 minutes. You can speak in short sentences.</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <SelectItem value="intervals">Zone 4 Intervals</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-popover border shadow-lg z-[100]">
                        <p className="font-semibold mb-1">Zone 4 Intervals</p>
                        <p className="text-sm text-muted-foreground mb-2">80-90% of max heart rate</p>
                        <p className="text-sm">High-intensity interval training to build VO2 max and power. Short bursts of hard effort with recovery periods. Total workout: 20-45 minutes.</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <SelectItem value="recovery">Recovery Ride</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-popover border shadow-lg z-[100]">
                        <p className="font-semibold mb-1">Recovery Ride</p>
                        <p className="text-sm text-muted-foreground mb-2">50-60% of max heart rate</p>
                        <p className="text-sm">Very easy spinning for active recovery. Helps flush out metabolic waste from hard workouts. Keep it light: 30-60 minutes.</p>
                      </TooltipContent>
                    </Tooltip>
                  </SelectContent>
                </Select>
              </TooltipProvider>
              
              <div className="flex gap-2 p-3 bg-muted rounded-lg">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{getZoneDescription(settings.training_mode || 'pace_based')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Goal Type */}
          <Card className="hover:shadow-lg transition-all duration-300 border-blue-500/20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-500" />
                </div>
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
          <Card className="hover:shadow-lg transition-all duration-300 border-purple-500/20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                Ride Settings
              </CardTitle>
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
          <Button 
            className="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover-scale animate-fade-in" 
            size="lg" 
            onClick={handleStartRide}
            style={{ animationDelay: '0.5s' }}
          >
            <Bike className="h-5 w-5 mr-2" />
            Start Ride
          </Button>
        </div>
      </div>
    </>
  );
}
