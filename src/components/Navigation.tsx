import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User as SupabaseUser } from '@supabase/supabase-js';
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
  User as UserIcon
} from "lucide-react";

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user: SupabaseUser | null;
  onSignOut: () => Promise<void>;
}

const Navigation = ({ currentPage, onPageChange, user, onSignOut }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'workout-plan', label: 'AI Workout Plan', icon: Brain },
    { id: 'smart-pins', label: 'Smart Pins', icon: Activity },
    { id: 'sensor-workout', label: 'BLE Sensors', icon: Bluetooth },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'avatar', label: 'Avatar', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="glow-card"
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              TapFit
            </h1>
            <p className="text-xs text-muted-foreground">AI-Powered Fitness</p>
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
                    onPageChange(item.id);
                    setIsMenuOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="pt-6 space-y-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Account
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium truncate">
                {user?.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onSignOut}
                className="w-full justify-start"
              >
                <LogOut className="h-3 w-3 mr-2" />
                Sign Out
              </Button>
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