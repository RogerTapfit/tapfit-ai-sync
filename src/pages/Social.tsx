import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserSearchBar } from '@/components/social/UserSearchBar';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { UsernameSetupBanner } from '@/components/social/UsernameSetupBanner';
import { UsernameSetupDialog } from '@/components/social/UsernameSetupDialog';
import { ProfilePhotoUpload } from '@/components/social/ProfilePhotoUpload';
import { NetworkList } from '@/components/social/NetworkList';
import { WorkoutVisibilitySettings } from '@/components/social/WorkoutVisibilitySettings';
import { Search, Home, Trophy, Settings, UtensilsCrossed, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { usePageContext } from '@/hooks/usePageContext';
import { PageHeader } from '@/components/PageHeader';

export default function Social() {
  const navigate = useNavigate();
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Register page context for chatbot
  usePageContext({
    pageName: 'Social Hub',
    pageDescription: 'Connect with other users, view activity feed, and manage your social profile',
    visibleContent: username ? `Logged in as @${username}. View activity feed, search for users, manage workout visibility settings, and see your network.` : 'Social features - set up username to get started'
  });

  useEffect(() => {
    checkUsername();
  }, []);

  const checkUsername = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      setUsername(profile?.username || null);
      setAvatarUrl(profile?.avatar_url || null);
      setNeedsUsername(!profile?.username);
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-500/5 to-background">
      <PageHeader title="Social" />
      
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl pb-20">
        <div className="mb-6 pt-6">
          
          {/* Hero Header with Gradient */}
          <div className="relative overflow-hidden rounded-2xl mb-6 p-6 sm:p-8 bg-card border border-border">
            <div className="relative">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                Social
              </h1>
              <p className="text-muted-foreground">
                Connect with other users and follow their fitness journey
              </p>
              {!loading && username && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Signed in as <span className="font-medium text-red-500">@{username}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {!loading && needsUsername && (
          <UsernameSetupBanner onSetup={() => setShowUsernameDialog(true)} />
        )}

        {!loading && username && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent">
                    <Home className="h-5 w-5" />
                  </div>
                  Your Profile
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/user/${username}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View as Others
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/profile-customize')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Customize Profile
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <ProfilePhotoUpload 
                currentAvatarUrl={avatarUrl}
                username={username}
                onUploadSuccess={checkUsername}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 min-w-0">
            <ActivityFeed />
          </div>

          <div className="space-y-4 sm:space-y-6 min-w-0">
            <UserSearchBar />

            <WorkoutVisibilitySettings />

            <Card 
              className="cursor-pointer hover:border-primary/20 transition-all duration-300 group"
              onClick={() => navigate('/meal-feed')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent group-hover:bg-primary/10 transition-colors">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                  </div>
                  Meal Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-sm text-muted-foreground">
                  See what your network is eating and discover healthy meal ideas
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-red-500/20 transition-all duration-300 group"
              onClick={() => navigate('/leaderboard')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent group-hover:bg-red-500/10 transition-colors">
                    <Trophy className="h-5 w-5 text-red-500" />
                  </div>
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-sm text-muted-foreground">
                  See how you rank against other users in tap coins, workouts, and calories burned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent">
                    <Search className="h-5 w-5" />
                  </div>
                  Find Users
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-sm text-muted-foreground">
                  Search for users by username to view their profiles and follow their progress
                </p>
              </CardContent>
            </Card>

            <NetworkList />
          </div>
        </div>
      </div>

      <UsernameSetupDialog
        open={showUsernameDialog}
        onOpenChange={setShowUsernameDialog}
        onSuccess={checkUsername}
      />
    </div>
  );
}
