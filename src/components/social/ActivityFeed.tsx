import { useActivityFeed } from '@/hooks/useActivityFeed';
import { ActivityFeedItem } from './ActivityFeedItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Activity } from 'lucide-react';

interface ActivityFeedProps {
  limit?: number;
}

export const ActivityFeed = ({ limit = 20 }: ActivityFeedProps) => {
  const { activities, loading } = useActivityFeed(limit);

  if (loading) {
    return (
      <Card className="border-red-500/15 shadow-lg shadow-red-500/5">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 rounded-lg" />
        <CardHeader className="relative">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/15 to-rose-500/15">
              <Activity className="h-5 w-5 text-red-400" />
            </div>
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8 relative">
          <Loader2 className="h-8 w-8 animate-spin text-red-400" />
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="border-red-500/15 shadow-lg shadow-red-500/5">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 rounded-lg" />
        <CardHeader className="relative">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/15 to-rose-500/15">
              <Activity className="h-5 w-5 text-red-400" />
            </div>
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2 font-medium">No recent activity</p>
            <p className="text-sm">
              Follow users to see their achievements, PRs, and milestones here!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500/15 shadow-lg shadow-red-500/5">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 rounded-lg" />
      <CardHeader className="relative">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/15 to-rose-500/15">
            <Activity className="h-5 w-5 text-red-400" />
          </div>
          Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 relative">
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 p-3 sm:p-6">
            {activities.map((activity) => (
              <ActivityFeedItem key={activity.id} activity={activity} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
