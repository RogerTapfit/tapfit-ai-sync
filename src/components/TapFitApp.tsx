import { useState, Suspense, lazy } from "react";
import Navigation from "./Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Settings, Smartphone, Apple } from "lucide-react";
import { useAuth } from "./AuthGuard";
import LoadingSpinner from "./LoadingSpinner";

// Lazy load components for better performance
const TapFitDashboard = lazy(() => import("./TapFitDashboard"));
const SmartPinDashboard = lazy(() => import("./SmartPinDashboard"));
const SubscriptionPlans = lazy(() => import("./SubscriptionPlans"));
const ChallengesAchievements = lazy(() => import("./ChallengesAchievements"));
const SensorWorkout = lazy(() => import("../pages/SensorWorkout"));
const HealthDataExport = lazy(() => import("./HealthDataExport").then(module => ({ default: module.HealthDataExport })));
const WorkoutPlanDashboard = lazy(() => import("./WorkoutPlanDashboard"));
const AvatarBuilder = lazy(() => import("./AvatarBuilder").then(module => ({ default: module.AvatarBuilder })));
const NutritionDashboard = lazy(() => import("./NutritionDashboard"));
const NFCTagWriter = lazy(() => import("./NFCTagWriter"));

const TapFitApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user, isGuest, signOut } = useAuth();

  const renderSocialPage = () => (
    <div className="min-h-screen bg-background p-4 md:pl-8 space-y-6">
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Social Features</h2>
        <p className="text-muted-foreground mb-6">Connect with friends and track progress together</p>
        <Card className="glow-card max-w-md mx-auto p-6">
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

      {/* NFC Tag Programming Section */}
      <div className="max-w-4xl">
        <NFCTagWriter />
      </div>

      {/* Health Data Export Section */}
      <div className="max-w-4xl">
        <HealthDataExport />
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
        case 'avatar':
          console.log('Rendering AvatarBuilder component');
          return <AvatarBuilder onClose={() => setCurrentPage('dashboard')} />;
        default:
          console.log('Rendering default dashboard');
          return <TapFitDashboard onPageChange={setCurrentPage} />;
      }
    })();

    return (
      <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." />}>
        {content}
      </Suspense>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        user={user}
        onSignOut={signOut}
      />
      <div className="flex-1 md:ml-0 pt-20 md:pt-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default TapFitApp;