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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent">
              <Activity className="h-5 w-5 text-red-500" />
            </div>
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent">
              <Activity className="h-5 w-5 text-red-500" />
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent">
            <Activity className="h-5 w-5 text-red-500" />
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
