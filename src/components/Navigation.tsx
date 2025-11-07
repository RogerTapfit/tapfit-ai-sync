
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getShortVersionString } from "@/lib/version";
import { NotificationBell } from "@/components/social/NotificationBell";
import { 
  Home, 
  Activity, 
  Users, 
  Trophy, 
  Settings,
  Crown,
  Menu,
  X,
  LogOut,
  Bluetooth,
  Brain,
  User as UserIcon,
  Apple,
  Dumbbell
} from "lucide-react";

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user: SupabaseUser | null;
  isGuest: boolean;
  onSignOut: () => Promise<void>;
}

const Navigation = ({ currentPage, onPageChange, user, isGuest, onSignOut }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'workout-plan', label: 'AI Workout Plan', icon: Brain },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'smart-pins', label: 'Smart Pins', icon: Activity },
    { id: 'sensor-workout', label: 'BLE Sensors', icon: Bluetooth },
    { id: 'puck-test', label: 'Puck Test', icon: Bluetooth },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'avatar', label: 'Choose Coach', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed safe-top-md safe-left z-[100]">
        <Button
          variant="outline"
          size="icon"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="touch-target glow-card bg-background border-border shadow-lg"
        >
          {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-4 z-50 transition-transform duration-300
        md:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-6">
          {/* Logo */}
          <div className="text-center pt-8 md:pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                TapFit
              </h1>
              {!isGuest && (
                <div className="flex-1 flex justify-end">
                  <NotificationBell />
                </div>
              )}
              {isGuest && <div className="flex-1" />}
            </div>
            <p className="text-xs text-muted-foreground">AI-Powered Fitness</p>
            <div className="mt-1">
              <span className="text-xs text-muted-foreground font-mono">{getShortVersionString()}</span>
            </div>
          </div>

          {/* Premium Badge */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange('subscription')}
              className="glow-card border-primary/30 hover:border-primary/50"
            >
              <Crown className="h-3 w-3 mr-2" />
              <span className="text-xs">Upgrade to Pro</span>
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isActive ? 'glow-button' : 'hover:bg-accent'
                  }`}
                  onClick={() => {
                    console.log('Navigation clicked:', item.id, item.label);
                    if (item.id === 'workouts') {
                      navigate('/workouts');
                    } else if (item.id === 'avatar') {
                      navigate('/avatars');
                    } else if (item.id === 'social') {
                      navigate('/social');
                    } else {
                      console.log('Calling onPageChange with:', item.id);
                      onPageChange(item.id);
                    }
                    setIsMenuOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* User Info & Auth Action */}
          <div className="pt-6 space-y-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Account
            </div>
            <div className="space-y-3">
              {isGuest ? (
                <div className="space-y-2">
                  <Badge variant="outline" className="w-full justify-center text-xs">
                    Guest Mode
                  </Badge>
                  <Button
                    variant="glow"
                    size="sm"
                    onClick={() => {
                      navigate('/auth?mode=signup');
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start touch-target"
                  >
                    <UserIcon className="h-3 w-3 mr-2" />
                    Create Account
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-sm font-medium truncate">
                    {user?.email}
                  </div>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      await onSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start touch-target"
                  >
                    <LogOut className="h-3 w-3 mr-2" />
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pt-6 space-y-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Today's Stats
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Workouts</span>
                <Badge variant="secondary">1</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Calories</span>
                <Badge variant="secondary">280</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Streak</span>
                <Badge className="bg-primary text-primary-foreground">5 days</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Spacer for Desktop */}
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  );
};

export default Navigation;
