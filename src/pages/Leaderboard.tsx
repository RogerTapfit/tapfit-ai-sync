import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaderboard, LeaderboardType, LeaderboardPeriod } from '@/hooks/useLeaderboard';
import { ArrowLeft, Trophy, Coins, Dumbbell, Flame, Crown, Medal, Award, Home } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePageContext } from '@/hooks/usePageContext';
import { formatCoinsForDisplay } from '@/lib/coinUtils';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('coins');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all_time');
  const { users, loading, myRank } = useLeaderboard(leaderboardType, period);

  // Register page context for chatbot
  usePageContext({
    pageName: 'Leaderboard',
    pageDescription: 'Community rankings for tap coins, workouts, and calories burned',
    visibleContent: `Viewing ${leaderboardType} leaderboard (${period}). Your rank: #${myRank || 'N/A'}. Top users: ${users.slice(0, 3).map(u => `${u.username}: ${leaderboardType === 'coins' ? u.tap_coins_balance : leaderboardType === 'workouts' ? u.total_workouts : u.total_calories}`).join(', ')}`
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank === 2) return 'secondary';
    if (rank === 3) return 'outline';
    return 'outline';
  };

  const getStatValue = (user: typeof users[0]) => {
    if (leaderboardType === 'coins') return formatCoinsForDisplay(user.tap_coins_balance);
    if (leaderboardType === 'workouts') return user.total_workouts.toLocaleString();
    return user.total_calories.toLocaleString();
  };

  const getStatLabel = () => {
    if (leaderboardType === 'coins') return 'Tap Coins';
    if (leaderboardType === 'workouts') return 'Workouts';
    return 'Calories Burned';
  };

  const getStatIcon = () => {
    if (leaderboardType === 'coins') return <Coins className="h-4 w-4 text-yellow-500" />;
    if (leaderboardType === 'workouts') return <Dumbbell className="h-4 w-4 text-primary" />;
    return <Flame className="h-4 w-4 text-orange-500" />;
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20 pt-safe">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold">Leaderboard</h1>
            </div>
            <p className="text-muted-foreground">Top performers in the community</p>
          </div>
        </div>

        {/* My Rank Card */}
        {myRank && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                  <p className="text-2xl font-bold">#{myRank}</p>
                </div>
                <Trophy className="h-12 w-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-4 items-center flex-wrap">
          <Select value={period} onValueChange={(value) => setPeriod(value as LeaderboardPeriod)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_time">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leaderboard Tabs */}
        <Tabs value={leaderboardType} onValueChange={(value) => setLeaderboardType(value as LeaderboardType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="coins" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Tap Coins
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Workouts
            </TabsTrigger>
            <TabsTrigger value="calories" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Calories
            </TabsTrigger>
          </TabsList>

          <TabsContent value={leaderboardType} className="space-y-3 mt-6">
            {loading ? (
              [...Array(10)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : users.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No data yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to appear on the leaderboard!
                  </p>
                </CardContent>
              </Card>
            ) : (
              users.map((user) => (
                <Card
                  key={user.id}
                  className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                    user.rank <= 3 ? 'border-primary/50' : ''
                  }`}
                  onClick={() => navigate(`/profile/${user.username}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(user.rank) || (
                          <Badge variant={getRankBadgeVariant(user.rank)} className="text-lg font-bold">
                            {user.rank}
                          </Badge>
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
                        <AvatarFallback>
                          {user.username[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {user.full_name || user.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>

                      {/* Stat */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {getStatIcon()}
                          <span className="text-xl font-bold">{getStatValue(user)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{getStatLabel()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
