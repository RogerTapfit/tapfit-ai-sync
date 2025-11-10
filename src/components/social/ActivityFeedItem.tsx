import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trophy, Award, TrendingUp, Flame, Utensils, Wine } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActivityFeedItem as ActivityFeedItemType } from '@/services/activityFeedService';
import { useNavigate } from 'react-router-dom';
import { ReactionButtons } from './ReactionButtons';
import { MealActivityDetail } from './MealActivityDetail';
import { getGradeColor, getGradeBgColor } from '@/utils/healthGrading';

interface ActivityFeedItemProps {
  activity: ActivityFeedItemType;
}

export const ActivityFeedItem = ({ activity }: ActivityFeedItemProps) => {
  const navigate = useNavigate();
  const [showMealDetail, setShowMealDetail] = useState(false);
  
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'pr':
        return <Trophy className="h-5 w-5 text-primary" />;
      case 'achievement':
        return <Award className="h-5 w-5 text-accent" />;
      case 'workout_milestone':
        return <TrendingUp className="h-5 w-5 text-secondary" />;
      case 'streak_milestone':
        return <Flame className="h-5 w-5 text-destructive" />;
      case 'meal_logged':
      case 'restaurant_meal':
        return <Utensils className="h-5 w-5 text-green-500" />;
      case 'alcohol_logged':
        return <Wine className="h-5 w-5 text-amber-500" />;
      default:
        return null;
    }
  };

  const getActivityText = () => {
    const data = activity.activity_data;
    
    switch (activity.activity_type) {
      case 'pr':
        return (
          <>
            <span className="font-semibold">set a new PR</span> on {data.machine_name}:{' '}
            <span className="text-primary font-bold">{data.weight_lbs} lbs</span> x {data.reps} reps
            {data.improvement_percentage && (
              <span className="text-muted-foreground text-sm ml-2">
                (+{data.improvement_percentage.toFixed(1)}%)
              </span>
            )}
          </>
        );
      case 'achievement':
        return (
          <>
            <span className="font-semibold">unlocked achievement:</span>{' '}
            <span className="text-accent">{data.achievement_name}</span>
            {data.coins_earned > 0 && (
              <span className="text-muted-foreground text-sm ml-2">
                +{data.coins_earned} coins
              </span>
            )}
          </>
        );
      case 'workout_milestone':
        return (
          <>
            <span className="font-semibold">reached a milestone:</span>{' '}
            <span className="text-secondary font-bold">{data.milestone} workouts completed!</span>
          </>
        );
      case 'streak_milestone':
        return (
          <>
            <span className="font-semibold">achieved a streak:</span>{' '}
            <span className="text-destructive font-bold">{data.days} day workout streak!</span>
          </>
        );
      case 'meal_logged':
        return (
          <>
            <span className="font-semibold">logged a meal:</span>{' '}
            <span className="text-green-600 dark:text-green-400">{data.meal_name}</span>
          </>
        );
      case 'restaurant_meal':
        return (
          <>
            <span className="font-semibold">enjoyed</span>{' '}
            <span className="text-green-600 dark:text-green-400">{data.meal_name}</span>
            {data.restaurant && <span> at {data.restaurant}</span>}
          </>
        );
      case 'alcohol_logged':
        return (
          <>
            <span className="font-semibold">logged</span>{' '}
            <span className="text-amber-600 dark:text-amber-400">{data.drink_type}</span>
          </>
        );
      default:
        return 'completed an activity';
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = () => {
    if (activity.profile?.username) {
      navigate(`/profile/${activity.profile.username}`);
    }
  };

  const isMealActivity = ['meal_logged', 'restaurant_meal', 'alcohol_logged'].includes(activity.activity_type);
  const data = activity.activity_data;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <Avatar 
              className="h-10 w-10 cursor-pointer flex-shrink-0" 
              onClick={handleProfileClick}
            >
              {activity.profile?.avatar_url ? (
                <AvatarImage src={activity.profile.avatar_url} alt={activity.profile.username || 'User'} />
              ) : null}
              <AvatarFallback>
                {getInitials(activity.profile?.full_name || activity.profile?.username || 'User')}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Activity Text */}
              <div className="text-sm mb-2">{getActivityText()}</div>

              {/* Meal Photo & Details */}
              {isMealActivity && (data.photo_url || data.thumbnail_url) && (
                <div className="mb-3 relative group">
                  <img
                    src={data.photo_url || data.thumbnail_url}
                    alt="Meal"
                    className="w-full max-h-64 object-cover rounded-lg cursor-pointer"
                    onClick={() => setShowMealDetail(true)}
                  />
                  {/* Nutrition overlay on image */}
                  {(activity.activity_type === 'meal_logged' || activity.activity_type === 'restaurant_meal') && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg">
                      <div className="flex items-center justify-between text-white text-xs">
                        <span>{data.calories} cal</span>
                        <span>•</span>
                        <span>{data.protein_g?.toFixed(0)}g protein</span>
                        <span>•</span>
                        <span>{data.carbs_g?.toFixed(0)}g carbs</span>
                        <span>•</span>
                        <span>{data.fat_g?.toFixed(0)}g fat</span>
                        {data.health_grade && (
                          <>
                            <span>•</span>
                            <div className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${getGradeBgColor(data.health_grade)}`}>
                              <span className={`text-xs font-bold ${getGradeColor(data.health_grade)}`}>
                                {data.health_grade}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Meal caption/notes */}
              {isMealActivity && data.notes && (
                <p className="text-sm text-muted-foreground mb-2">{data.notes}</p>
              )}

              {/* View Details button for meals */}
              {isMealActivity && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMealDetail(true)}
                  className="text-xs h-7 px-2 mb-2"
                >
                  View Details
                </Button>
              )}

              {/* Timestamp */}
              <div className="text-xs text-muted-foreground mb-3">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </div>

              {/* Reactions */}
              <ReactionButtons 
                targetType="activity_feed" 
                targetId={activity.id}
                className="mt-2"
              />
            </div>

            {/* Activity Icon */}
            <div className="flex-shrink-0">
              {getActivityIcon()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Detail Modal */}
      {isMealActivity && (
        <MealActivityDetail
          activity={activity}
          isOpen={showMealDetail}
          onClose={() => setShowMealDetail(false)}
        />
      )}
    </>
  );
};
