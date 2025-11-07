import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSearchBar } from '@/components/social/UserSearchBar';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { UsernameSetupBanner } from '@/components/social/UsernameSetupBanner';
import { UsernameSetupDialog } from '@/components/social/UsernameSetupDialog';
import { ProfilePhotoUpload } from '@/components/social/ProfilePhotoUpload';
import { NetworkList } from '@/components/social/NetworkList';
import { Search, Home, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Social() {
  const navigate = useNavigate();
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl pb-20">
        <div className="mb-6 pt-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-accent"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
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
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent">
                  <Home className="h-5 w-5" />
                </div>
                Your Profile
              </CardTitle>
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
