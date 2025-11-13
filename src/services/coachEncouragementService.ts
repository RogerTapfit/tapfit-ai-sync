import { supabase } from '@/integrations/supabase/client';

interface EncouragementContext {
  workoutStreak?: number;
  recentMeals?: any[];
  recentAchievements?: any[];
  recentWorkoutCount?: number;
}

export class CoachEncouragementService {
  async fetchUserContext(userId: string): Promise<EncouragementContext> {
    const context: EncouragementContext = {};

    try {
      // Fetch workout streak
      const { data: streakData } = await supabase
        .from('workout_streaks')
        .select('current_streak, longest_streak, last_workout_date')
        .eq('user_id', userId)
        .single();
      
      if (streakData) {
        context.workoutStreak = streakData.current_streak;
      }

      // Fetch recent meals (last 24 hours)
      const { data: mealsData } = await supabase
        .from('food_entries')
        .select('meal_type, health_grade, total_calories, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (mealsData) {
        context.recentMeals = mealsData;
      }

      // Fetch recent achievements (last 7 days)
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select(`
          unlocked_at,
          achievements:achievement_id (
            name,
            description
          )
        `)
        .eq('user_id', userId)
        .gte('unlocked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('unlocked_at', { ascending: false })
        .limit(3);
      
      if (achievementsData) {
        context.recentAchievements = achievementsData;
      }

      // Fetch recent workout count (last 7 days)
      const { count } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (count !== null) {
        context.recentWorkoutCount = count;
      }
    } catch (error) {
      console.error('Error fetching encouragement context:', error);
    }

    return context;
  }

  generateEncouragementMessage(context: EncouragementContext, userName?: string): string {
    const name = userName ? `${userName}` : 'champ';
    
    // Prioritize based on what we have
    
    // Check for workout streak
    if (context.workoutStreak !== undefined && context.workoutStreak > 0) {
      if (context.workoutStreak >= 14) {
        return `Wow ${name}! ${context.workoutStreak} days straight! You're a fitness machine!`;
      } else if (context.workoutStreak >= 7) {
        return `A full week streak ${name}! ${context.workoutStreak} days and counting! You're crushing it!`;
      } else if (context.workoutStreak >= 3) {
        return `Look at you ${name}! ${context.workoutStreak} days in a row! You're building unstoppable habits!`;
      } else {
        return `You're starting strong ${name}! ${context.workoutStreak} day${context.workoutStreak > 1 ? 's' : ''} down! Let's keep this momentum going!`;
      }
    }

    // Check for recent achievements
    if (context.recentAchievements && context.recentAchievements.length > 0) {
      const latestAchievement = context.recentAchievements[0];
      const achievementName = (latestAchievement as any).achievements?.name || 'a new badge';
      return `You just unlocked ${achievementName}! That's what champions do, ${name}!`;
    }

    // Check for recent meals
    if (context.recentMeals && context.recentMeals.length > 0) {
      const latestMeal = context.recentMeals[0];
      const mealType = latestMeal.meal_type || 'meal';
      const grade = latestMeal.health_grade;
      
      if (grade && (grade === 'A' || grade === 'B')) {
        return `Grade ${grade} nutrition ${name}! That ${mealType} is fueling your success!`;
      } else {
        return `Great ${mealType} choice ${name}! Your body is thanking you!`;
      }
    }

    // Check for recent workout activity
    if (context.recentWorkoutCount && context.recentWorkoutCount > 0) {
      if (context.recentWorkoutCount >= 5) {
        return `${context.recentWorkoutCount} workouts this week ${name}! You're absolutely on fire!`;
      } else if (context.recentWorkoutCount >= 3) {
        return `${context.recentWorkoutCount} workouts this week ${name}! That's solid consistency!`;
      } else {
        return `${context.recentWorkoutCount} workout${context.recentWorkoutCount > 1 ? 's' : ''} this week ${name}! Every session counts!`;
      }
    }

    // Fallback motivational phrases
    const fallbackPhrases = [
      `You're doing amazing ${name}! Keep up the incredible work!`,
      `I believe in you ${name}! Your dedication shows every single day!`,
      `You've got what it takes ${name}! Let's reach those goals together!`,
      `Your progress is inspiring ${name}! Keep pushing forward!`,
      `Every rep, every set, every day ${name}! You're getting stronger!`,
    ];

    return fallbackPhrases[Math.floor(Math.random() * fallbackPhrases.length)];
  }
}

export const coachEncouragementService = new CoachEncouragementService();
