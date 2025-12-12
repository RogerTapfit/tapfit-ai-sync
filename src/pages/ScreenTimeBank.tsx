import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useScreenTimeBank, PLATFORM_CONFIG, Platform } from '@/hooks/useScreenTimeBank';
import { usePageContext } from '@/hooks/usePageContext';
import { ArrowLeft, Clock, Dumbbell, Settings, TrendingUp } from 'lucide-react';
import { SocialMediaTimer } from '@/components/SocialMediaTimer';
import { ScreenTimePlatformSelector } from '@/components/ScreenTimePlatformSelector';
import { EarnScreenTimeModal } from '@/components/EarnScreenTimeModal';

export default function ScreenTimeBank() {
  const navigate = useNavigate();
  const {
    bank,
    availableMinutes,
    usageByPlatform,
    todayUsage,
    isLoading,
    updateExchangeRate,
  } = useScreenTimeBank();

  const [showTimer, setShowTimer] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEarnModal, setShowEarnModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(bank?.push_ups_per_minute || 5);

  // Sync exchange rate when bank loads
  useEffect(() => {
    if (bank?.push_ups_per_minute) {
      setExchangeRate(bank.push_ups_per_minute);
    }
  }, [bank?.push_ups_per_minute]);

  // Register page context for chatbot
  usePageContext({
    pageName: 'Screen Time Bank',
    pageDescription: 'Earn social media time by doing push-ups. Track your screen time usage and manage your balance.',
    visibleContent: `Screen Time Bank: ${availableMinutes} minutes available, ${todayUsage} minutes used today. Exchange rate: ${bank?.push_ups_per_minute || 5} push-ups = 1 minute.`
  });

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    setShowTimer(true);
  };

  const handleTimerClose = () => {
    setShowTimer(false);
    setSelectedPlatform(null);
  };

  const handleSaveExchangeRate = async () => {
    await updateExchangeRate({ pushUpsPerMinute: exchangeRate });
    setShowSettings(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">⏳</div>
          <p className="text-muted-foreground">Loading your screen time bank...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - safe area aware */}
      <div className="sticky z-10 bg-background/80 backdrop-blur-lg border-b border-border safe-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate('/fitness-alarm')}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Screen Time Bank</h1>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-6xl font-black text-primary mb-2">
                {availableMinutes}
              </div>
              <p className="text-lg text-muted-foreground">minutes available</p>
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Used today: {todayUsage} min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rate Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Dumbbell className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">Exchange Rate</p>
                  <p className="text-sm text-muted-foreground">
                    {bank?.push_ups_per_minute || 5} push-ups = 1 minute
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowEarnModal(true)}>
                Earn More
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Push-ups per minute: {exchangeRate}
                </label>
                <Slider
                  value={[exchangeRate]}
                  onValueChange={(v) => setExchangeRate(v[0])}
                  min={1}
                  max={20}
                  step={1}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Higher = harder to earn screen time
                </p>
              </div>
              <Button onClick={handleSaveExchangeRate} className="w-full">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Platform Selector */}
        <ScreenTimePlatformSelector
          onSelect={handlePlatformSelect}
          availableMinutes={availableMinutes}
        />

        {/* Usage Stats */}
        {Object.keys(usageByPlatform).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                This Week's Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(Object.entries(usageByPlatform) as [Platform, number][])
                  .sort(([, a], [, b]) => b - a)
                  .map(([platform, minutes]) => {
                    const config = PLATFORM_CONFIG[platform];
                    return (
                      <div key={platform} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{config?.icon || '📱'}</span>
                          <span className="font-medium">{config?.name || platform}</span>
                        </div>
                        <span className="text-muted-foreground">{minutes} min</span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <h3 className="font-bold mb-4">💡 How It Works</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <span className="text-primary font-bold">1.</span>
                <p>Set fitness alarms that require push-ups to turn off</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">2.</span>
                <p>Complete push-ups → earn screen time minutes</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">3.</span>
                <p>Use your earned minutes on social media apps</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">4.</span>
                <p>Timer alerts you when your time is up</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer Modal */}
      {showTimer && selectedPlatform && (
        <SocialMediaTimer
          platform={selectedPlatform}
          availableMinutes={availableMinutes}
          onClose={handleTimerClose}
        />
      )}

      {/* Earn Screen Time Modal */}
      <EarnScreenTimeModal
        isOpen={showEarnModal}
        onClose={() => setShowEarnModal(false)}
        initialExchangeRate={bank?.push_ups_per_minute || 5}
      />
    </div>
  );
}
