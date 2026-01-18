import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { toast } from 'sonner';
import { XP_ACTIONS } from '@/config/gamerRanks';

const RETROACTIVE_XP_KEY = 'tapfit_retroactive_xp_done_v3';

export const useRetroactiveXP = () => {
  const { user } = useAuth();
  const processingRef = useRef(false);

  const calculateAndAwardRetroactiveXP = useCallback(async () => {
    if (!user?.id || processingRef.current) return;
    
    // Check if already done for this user
    const doneKey = `${RETROACTIVE_XP_KEY}_${user.id}`;
    if (localStorage.getItem(doneKey)) return;
    
    processingRef.current = true;
    console.log('📊 Calculating retroactive XP for user:', user.id);

    try {
      // Fetch historical data counts for ALL activity types
      const [
        workoutsResult,
        mealsWithPhotoResult,
        mealsNoPhotoResult,
        waterGoalDaysResult,
        sleepLogsResult,
        moodEntriesResult,
        habitCompletionsResult,
        sobrietyCheckinsResult,
        fastingSessionsResult,
        cardioSessionsResult,
        runSessionsResult,
        currentXPResult
      ] = await Promise.all([
        // Completed workouts
        supabase
          .from('workout_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('completed_at', 'is', null),
        
        // Meals with photos
        supabase
          .from('food_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('photo_url', 'is', null),
        
        // Meals without photos
        supabase
          .from('food_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('photo_url', null),
        
        // Days where hydration goal was reached
        supabase
          .from('hydration_streaks')
          .select('total_hydration_days')
          .eq('user_id', user.id)
          .maybeSingle(),
        
        // Sleep logs
        supabase
          .from('sleep_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Mood entries
        supabase
          .from('mood_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Habit completions
        supabase
          .from('habit_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Sobriety check-ins
        supabase
          .from('sobriety_daily_checkins')
          .select('id', { count: 'exact', head: true }),
        
        // Fasting sessions completed
        supabase
          .from('fasting_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed'),
        
        // Cardio sessions completed
        supabase
          .from('cardio_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed'),
        
        // Run/walk sessions
        supabase
          .from('run_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed'),
        
        // Current total XP
        supabase
          .from('user_gamer_stats')
          .select('total_xp')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      const workoutCount = workoutsResult.count || 0;
      const mealsWithPhoto = mealsWithPhotoResult.count || 0;
      const mealsNoPhoto = mealsNoPhotoResult.count || 0;
      const hydrationDays = waterGoalDaysResult.data?.total_hydration_days || 0;
      const sleepLogs = sleepLogsResult.count || 0;
      const moodEntries = moodEntriesResult.count || 0;
      const habitCompletions = habitCompletionsResult.count || 0;
      const sobrietyCheckins = sobrietyCheckinsResult.count || 0;
      const fastingSessions = fastingSessionsResult.count || 0;
      const cardioSessions = cardioSessionsResult.count || 0;
      const runSessions = runSessionsResult.count || 0;
      const currentXP = currentXPResult.data?.total_xp || 0;

      // Calculate expected XP for all activities
      const expectedWorkoutXP = workoutCount * XP_ACTIONS.WORKOUT_COMPLETE;
      const expectedMealPhotoXP = mealsWithPhoto * XP_ACTIONS.MEAL_WITH_PHOTO;
      const expectedMealNoPhotoXP = mealsNoPhoto * XP_ACTIONS.MEAL_LOGGED;
      const expectedWaterXP = hydrationDays * XP_ACTIONS.WATER_GOAL_HIT;
      const expectedSleepXP = sleepLogs * XP_ACTIONS.SLEEP_LOGGED;
      const expectedMoodXP = moodEntries * XP_ACTIONS.MOOD_LOGGED;
      const expectedHabitXP = habitCompletions * XP_ACTIONS.HABIT_COMPLETE;
      const expectedSobrietyXP = sobrietyCheckins * XP_ACTIONS.SOBRIETY_CHECKIN;
      const expectedFastingXP = fastingSessions * XP_ACTIONS.FAST_COMPLETE;
      const expectedCardioXP = cardioSessions * XP_ACTIONS.CARDIO_SESSION;
      const expectedRunXP = runSessions * 80; // Average cardio XP
      
      const totalExpectedXP = 
        expectedWorkoutXP + 
        expectedMealPhotoXP + 
        expectedMealNoPhotoXP + 
        expectedWaterXP +
        expectedSleepXP +
        expectedMoodXP +
        expectedHabitXP +
        expectedSobrietyXP +
        expectedFastingXP +
        expectedCardioXP +
        expectedRunXP;
      
      // Calculate missing XP
      const missingXP = Math.max(0, totalExpectedXP - currentXP);

      console.log('📊 Retroactive XP calculation:', {
        workoutCount, mealsWithPhoto, mealsNoPhoto, hydrationDays,
        sleepLogs, moodEntries, habitCompletions, sobrietyCheckins,
        fastingSessions, cardioSessions, runSessions,
        currentXP, totalExpectedXP, missingXP
      });

      // Award missing XP if significant (more than 50 XP)
      if (missingXP > 50) {
        const { data, error } = await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_xp_amount: missingXP,
          p_source: 'retroactive_sync'
        });

        if (error) {
          console.error('Error awarding retroactive XP:', error);
        } else {
          console.log('✅ Retroactive XP awarded:', missingXP);
          
          const activityCount = workoutCount + mealsWithPhoto + mealsNoPhoto + sleepLogs + 
            moodEntries + habitCompletions + sobrietyCheckins + fastingSessions + cardioSessions + runSessions;
          
          toast.success(`📊 Progress Synced! +${missingXP.toLocaleString()} XP`, {
            description: `Awarded for ${activityCount.toLocaleString()} logged activities`,
            duration: 8000,
          });

          // Dispatch XP awarded event
          window.dispatchEvent(new CustomEvent('xpAwarded', {
            detail: {
              amount: missingXP,
              source: 'retroactive_sync',
              result: data
            }
          }));
        }
      } else if (missingXP > 0) {
        console.log('📊 Missing XP too small to award:', missingXP);
      } else {
        console.log('📊 XP is already up to date');
      }

      // Mark as done
      localStorage.setItem(doneKey, new Date().toISOString());
    } catch (error) {
      console.error('Error calculating retroactive XP:', error);
    } finally {
      processingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    // Run after a short delay to let auth settle
    const timer = setTimeout(() => {
      calculateAndAwardRetroactiveXP();
    }, 2000);

    return () => clearTimeout(timer);
  }, [calculateAndAwardRetroactiveXP]);

  return {
    calculateAndAwardRetroactiveXP,
  };
};
