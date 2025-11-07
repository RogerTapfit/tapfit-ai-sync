import { useActivityFeed } from '@/hooks/useActivityFeed';
import { ActivityFeedItem } from './ActivityFeedItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface ActivityFeedProps {
  limit?: number;
}

export const ActivityFeed = ({ limit = 20 }: ActivityFeedProps) => {
  const { activities, loading } = useActivityFeed(limit);

  if (loading) {
    return (
      <Card className="glow-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="glow-card border-primary/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="text-lg sm:text-xl">Activity Feed</CardTitle>
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
    <Card className="glow-card border-primary/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <CardHeader className="relative">
        <CardTitle className="text-lg sm:text-xl">Activity Feed</CardTitle>
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
