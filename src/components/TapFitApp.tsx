import React, { useState, Suspense, lazy } from "react";
import Navigation from "./Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Settings, Smartphone, Apple, Ruler } from "lucide-react";
import { useAuth } from "./AuthGuard";
import LoadingSpinner from "./LoadingSpinner";
import { VersionDisplay } from "./VersionDisplay";
import { NotificationBell } from "./social/NotificationBell";
import { useGymTheme } from "@/contexts/GymThemeContext";

// Lazy load with retry helper to mitigate Safari's "Importing a module script failed" on chunk fetch
const lazyWithRetry = (factory: () => Promise<any>) => {
  return lazy(() =>
    factory().catch((err) => {
      console.warn('Chunk load failed, retrying once...', err);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          factory().then(resolve).catch((e2) => {
            if (typeof window !== 'undefined' && !(window as any).__chunk_reload__) {
              (window as any).__chunk_reload__ = true;
              window.location.reload();
            }
            reject(e2);
          });
        }, 50);
      });
    })
  );
};

// Lazy load components for better performance (with retry)
const TapFitDashboard = lazyWithRetry(() => import("./TapFitDashboard"));
const SmartPinDashboard = lazyWithRetry(() => import("./SmartPinDashboard"));
const SubscriptionPlans = lazyWithRetry(() => import("./SubscriptionPlans"));
const ChallengesAchievements = lazyWithRetry(() => import("./ChallengesAchievements"));
const SensorWorkout = lazyWithRetry(() => import("../pages/SensorWorkout"));
const PuckTest = lazyWithRetry(() => import("../pages/PuckTest"));
const HealthDataExport = lazyWithRetry(() => import("./HealthDataExport").then(module => ({ default: module.HealthDataExport })));
const WorkoutPlanDashboard = lazyWithRetry(() => import("./WorkoutPlanDashboard"));
const AvatarGallery = lazyWithRetry(() => import("./AvatarGallery"));
const NutritionDashboard = lazyWithRetry(() => import("./NutritionDashboard"));
const NFCTagWriter = lazyWithRetry(() => import("./NFCTagWriter"));
const LogoGenerator = lazyWithRetry(() => import("./LogoGenerator").then(module => ({ default: module.LogoGenerator })));
const UnitPreferenceSettings = lazyWithRetry(() => import("./UnitPreferenceSettings").then(module => ({ default: module.UnitPreferenceSettings })));
const InjuryPreventionDashboard = lazyWithRetry(() => import("./InjuryPreventionDashboard"));
const BiometricMoodDashboard = lazyWithRetry(() => import("./BiometricMoodDashboard"));

// Error boundary to display a friendly fallback instead of blank screen
class ChunkErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('UI ErrorBoundary caught', error, info);
  }
  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="p-6 max-w-md text-center">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">We couldn’t load part of the app. Please try reloading.</p>
            <Button onClick={this.handleReload}>Reload</Button>
          </Card>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const TapFitApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user, isGuest, signOut } = useAuth();
  const { currentTheme } = useGymTheme();

  const renderSocialPage = () => (
    <div className="min-h-screen bg-background p-4 md:pl-8 space-y-6">
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Social Features</h2>
        <p className="text-muted-foreground mb-6">Connect with friends and track progress together</p>
        
        {/* View Challenges Button */}
        <Card 
          className="glow-card max-w-md mx-auto cursor-pointer hover:shadow-xl transition-all duration-300 border-primary/30"
          onClick={() => setCurrentPage('challenges')}
        >
          <div className="p-6">
            <div className="flex items-center justify-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">View Challenges</h3>
            </div>
          </div>
        </Card>

        <Card className="glow-card max-w-md mx-auto p-6 mt-6">
          <p className="text-sm text-muted-foreground">
            Follow friends, join challenges, and climb leaderboards. Coming in the next update!
          </p>
        </Card>
      </div>
    </div>
  );

  const renderChallengesPage = () => <ChallengesAchievements />;

  const renderSettingsPage = () => (
    <div className="min-h-screen bg-background p-4 md:pl-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your TapFit experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
        {/* Unit Preference Settings */}
        <div className="lg:col-span-2">
          <UnitPreferenceSettings userId={user?.id} />
        </div>

        <Card className="glow-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Connected Devices</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <div className="flex items-center gap-3">
                <Apple className="h-4 w-4" />
                <span className="text-sm">Apple Watch Series 9</span>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Add New Device
            </Button>
          </div>
        </Card>

        <Card className="glow-card p-6">
          <h3 className="font-semibold mb-4">Subscription</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Plan</span>
              <span className="text-primary font-medium">Free Trial</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Days Remaining</span>
              <span>5 days</span>
            </div>
            <Button 
              variant="glow" 
              size="sm" 
              className="w-full"
              onClick={() => setCurrentPage('subscription')}
            >
              Upgrade Now
            </Button>
          </div>
        </Card>
      </div>

      {/* Logo Generator Section */}
      <div className="max-w-4xl">
        <LogoGenerator />
      </div>

      {/* NFC Tag Programming Section */}
      <div className="max-w-4xl">
        <NFCTagWriter />
      </div>

      {/* Health Data Export Section */}
      <div className="max-w-4xl">
        <HealthDataExport />
      </div>

      {/* Version Information Section */}
      <div className="max-w-4xl">
        <VersionDisplay variant="card" showCopy={true} />
      </div>
    </div>
  );

  const renderContent = () => {
    console.log('TapFitApp rendering content for page:', currentPage);
    const content = (() => {
      switch (currentPage) {
        case 'dashboard':
          return <TapFitDashboard onPageChange={setCurrentPage} />;
        case 'smart-pins':
          return <SmartPinDashboard />;
        case 'workout-plan':
          return <WorkoutPlanDashboard />;
        case 'sensor-workout':
          return <SensorWorkout />;
        case 'puck-test':
          return <PuckTest />;
        case 'nutrition':
          return <NutritionDashboard />;
        case 'social':
          return renderSocialPage();
        case 'challenges':
          return renderChallengesPage();
        case 'settings':
          return renderSettingsPage();
        case 'subscription':
          return <SubscriptionPlans />;
        case 'injury-prevention':
          return <InjuryPreventionDashboard onBack={() => setCurrentPage('dashboard')} />;
        case 'biometric-mood':
          return <BiometricMoodDashboard onBack={() => setCurrentPage('dashboard')} />;
        case 'avatar':
          console.log('Rendering AvatarGallery component');
          return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
              <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                  <Button variant="outline" onClick={() => setCurrentPage('dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
                <AvatarGallery />
              </div>
            </div>
          );
        default:
          console.log('Rendering default dashboard');
          return <TapFitDashboard onPageChange={setCurrentPage} />;
      }
    })();

    return (
      <ChunkErrorBoundary>
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." />}>
          {content}
        </Suspense>
      </ChunkErrorBoundary>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        user={user}
        isGuest={isGuest}
        onSignOut={signOut}
      />
      <div className="flex-1 md:ml-0 pt-20 md:pt-0 relative">
        {/* Mobile Header with Gym Logo */}
        <div className="md:hidden fixed inset-x-0 top-0 z-40 safe-top flex items-center justify-center h-16 pt-3 bg-background/90 backdrop-blur-sm">
          <img 
            src={currentTheme.logoUrl} 
            alt={`${currentTheme.displayName} Logo`}
            className="h-12 max-w-[200px] object-contain drop-shadow-lg"
            style={{
              transform: `scale(${currentTheme.logoScale || 1})`
            }}
          />
        </div>
        <div className="absolute right-4 z-50 safe-top-offset">
          <NotificationBell />
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default TapFitApp;