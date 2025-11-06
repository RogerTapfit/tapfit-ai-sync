import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSearchBar } from '@/components/social/UserSearchBar';
import { Users, Search, TrendingUp } from 'lucide-react';

export default function Social() {
  return (
    <div className="container max-w-4xl mx-auto p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Social</h1>
        <p className="text-muted-foreground">
          Connect with other users and follow their fitness journey
        </p>
      </div>

      <div className="mb-6">
        <UserSearchBar />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              See workout updates from people you follow (coming soon)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
