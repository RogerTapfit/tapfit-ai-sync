import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAvatar } from '@/lib/avatarState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Target, Clock, Coins, Medal, Star, Zap, Filter } from 'lucide-react';
import { useChallenges } from '@/hooks/useChallenges';
import { formatCoinsForDisplay } from '@/lib/coinUtils';

const ChallengesAchievements = () => {
  const {
    challenges,
    userChallenges,
    achievements,
    userAchievements,
    totalCoinsEarned,
    loading,
    joinChallenge
  } = useChallenges();
  const { avatar } = useAvatar();
  
  const [challengeFilter, setChallengeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('reward');

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-orange-500';
      case 'extreme': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 border-gray-300';
      case 'uncommon': return 'text-green-600 border-green-300';
      case 'rare': return 'text-blue-600 border-blue-300';
      case 'epic': return 'text-purple-600 border-purple-300';
      case 'legendary': return 'text-yellow-600 border-yellow-300';
      default: return 'text-gray-600 border-gray-300';
    }
  };

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'bronze': return 'bg-amber-600';
      case 'silver': return 'bg-gray-400';
      case 'gold': return 'bg-yellow-500';
      case 'platinum': return 'bg-slate-300';
      case 'legendary': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const activeChallenges = userChallenges.filter(uc => uc.status === 'active');
  const completedChallenges = userChallenges.filter(uc => uc.status === 'completed');

  const filteredChallenges = challenges.filter(challenge => {
    if (challengeFilter === 'all') return true;
    return challenge.challenge_type === challengeFilter;
  });

  const sortedChallenges = [...filteredChallenges].sort((a, b) => {
    if (sortBy === 'reward') return b.coin_reward - a.coin_reward;
    if (sortBy === 'difficulty') return a.difficulty_level.localeCompare(b.difficulty_level);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      {/* Header with Total Coins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Challenges & Achievements
            </div>
            <div className="flex items-center gap-4">
              {avatar && (
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/30">
                  <img 
                    src={avatar.mini_image_url || avatar.image_url} 
                    alt={avatar.name || "Your coach"} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 text-primary">
                <Coins className="h-5 w-5" />
                <span className="font-bold">{totalCoinsEarned} Tap Coins Earned</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="active-challenges" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active-challenges">Active Challenges</TabsTrigger>
          <TabsTrigger value="all-challenges">All Challenges</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Active Challenges */}
        <TabsContent value="active-challenges" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold">Your Active Challenges</h3>
            <Badge variant="outline">{activeChallenges.length} Active</Badge>
          </div>
          
          {activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No active challenges. Join some challenges to start earning Tap Coins!</p>
                <Button className="mt-4" onClick={() => {}}>Browse Challenges</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeChallenges.map((userChallenge) => (
                <Card key={userChallenge.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{userChallenge.challenge.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getDifficultyColor(userChallenge.challenge.difficulty_level)} text-white`}>
                          {userChallenge.challenge.difficulty_level}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{userChallenge.challenge.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{userChallenge.current_progress}/{userChallenge.target_value}</span>
                      </div>
                      <Progress 
                        value={(userChallenge.current_progress / userChallenge.target_value) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        <span>{userChallenge.challenge.coin_reward} coins</span>
                        {userChallenge.challenge.bonus_coin_reward > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{userChallenge.challenge.bonus_coin_reward} bonus
                          </Badge>
                        )}
                      </div>
                      {userChallenge.expires_at && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{getTimeRemaining(userChallenge.expires_at)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* All Challenges */}
        <TabsContent value="all-challenges" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold">Available Challenges</h3>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={challengeFilter} onValueChange={setChallengeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="workout_count">Workout Count</SelectItem>
                  <SelectItem value="streak">Streak</SelectItem>
                  <SelectItem value="muscle_group">Muscle Group</SelectItem>
                  <SelectItem value="calories">Calories</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reward">Coin Reward (High to Low)</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedChallenges.map((challenge) => {
              const isActive = activeChallenges.some(uc => uc.challenge_id === challenge.id);
              const isCompleted = completedChallenges.some(uc => uc.challenge_id === challenge.id);
              
              return (
                <Card key={challenge.id} className={`${isActive ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{challenge.name}</h4>
                      <Badge className={`${getDifficultyColor(challenge.difficulty_level)} text-white`}>
                        {challenge.difficulty_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        <span>{challenge.coin_reward} coins</span>
                        {challenge.bonus_coin_reward > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{challenge.bonus_coin_reward} bonus
                          </Badge>
                        )}
                      </div>
                      {challenge.time_limit_days && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{challenge.time_limit_days} days</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Goal: </span>
                      <span>{challenge.target_value} {challenge.challenge_type.replace('_', ' ')}</span>
                    </div>
                    
                    <Button 
                      onClick={() => joinChallenge(challenge.id)}
                      disabled={loading || isActive || isCompleted}
                      className="w-full"
                      variant={isActive ? "secondary" : "default"}
                    >
                      {isActive ? 'Active' : isCompleted ? 'Completed' : 'Join Challenge'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Completed Challenges */}
        <TabsContent value="completed" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold">Completed Challenges</h3>
            <Badge variant="outline">{completedChallenges.length} Completed</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedChallenges.map((userChallenge) => (
              <Card key={userChallenge.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{userChallenge.challenge.name}</h4>
                    <div className="flex items-center gap-1 text-green-600">
                      <Medal className="h-4 w-4" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{userChallenge.challenge.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      <span className="font-medium">{formatCoinsForDisplay(userChallenge.coins_earned)} coins earned</span>
                      {userChallenge.early_completion_bonus && (
                        <Badge variant="secondary" className="text-xs">Early bonus!</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Completed: {new Date(userChallenge.completed_at!).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold">Achievement Badges</h3>
            <Badge variant="outline">{userAchievements.length} Unlocked</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => {
              const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
              const isUnlocked = !!userAchievement;
              
              return (
                <Card 
                  key={achievement.id} 
                  className={`text-center ${isUnlocked ? getRarityColor(achievement.rarity_level) : 'opacity-50 grayscale'}`}
                >
                  <CardHeader className="pb-3">
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl ${getBadgeColor(achievement.badge_color)}`}>
                      {achievement.badge_icon || '🏆'}
                    </div>
                    <div>
                      <h4 className="font-semibold">{achievement.name}</h4>
                      <Badge variant="outline" className={`text-xs ${getRarityColor(achievement.rarity_level)}`}>
                        {achievement.rarity_level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    
                    <div className="flex items-center justify-center gap-1">
                      <Coins className="h-3 w-3" />
                      <span className="text-sm font-medium">{achievement.coin_reward} coins</span>
                    </div>
                    
                    {isUnlocked && userAchievement && (
                      <div className="text-xs text-muted-foreground">
                        Unlocked: {new Date(userAchievement.unlocked_at).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChallengesAchievements;