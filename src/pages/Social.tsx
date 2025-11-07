import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSearchBar } from '@/components/social/UserSearchBar';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { UsernameSetupBanner } from '@/components/social/UsernameSetupBanner';
import { UsernameSetupDialog } from '@/components/social/UsernameSetupDialog';
import { Users, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Social() {
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
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
        .select('username')
        .eq('id', user.id)
        .single();

      setUsername(profile?.username || null);
      setNeedsUsername(!profile?.username);
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Social</h1>
        <p className="text-muted-foreground">
          Connect with other users and follow their fitness journey
        </p>
        {!loading && username && (
          <p className="text-sm text-muted-foreground mt-1">
            Signed in as <span className="font-medium text-foreground">@{username}</span>
          </p>
        )}
      </div>

      {!loading && needsUsername && (
        <UsernameSetupBanner onSetup={() => setShowUsernameDialog(true)} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>

        <div className="space-y-6">
          <UserSearchBar />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Search for users by username to view their profiles and follow their progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View your followers and following list (coming soon)
              </p>
            </CardContent>
          </Card>
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
