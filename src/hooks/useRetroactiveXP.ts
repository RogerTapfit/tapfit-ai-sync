import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { toast } from 'sonner';
import { XP_ACTIONS } from '@/config/gamerRanks';

const RETROACTIVE_XP_KEY = 'tapfit_retroactive_xp_done_v2';

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
      // Fetch historical data counts
      const [
        workoutsResult,
        mealsWithPhotoResult,
        mealsNoPhotoResult,
        waterGoalDaysResult,
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
        
        // Days where hydration goal was reached (using streak data as proxy)
        supabase
          .from('hydration_streaks')
          .select('total_hydration_days')
          .eq('user_id', user.id)
          .maybeSingle(),
        
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
      const currentXP = currentXPResult.data?.total_xp || 0;

      // Calculate expected XP
      const expectedWorkoutXP = workoutCount * XP_ACTIONS.WORKOUT_COMPLETE;
      const expectedMealPhotoXP = mealsWithPhoto * XP_ACTIONS.MEAL_WITH_PHOTO;
      const expectedMealNoPhotoXP = mealsNoPhoto * XP_ACTIONS.MEAL_LOGGED;
      const expectedWaterXP = hydrationDays * XP_ACTIONS.WATER_GOAL_HIT;
      
      const totalExpectedXP = expectedWorkoutXP + expectedMealPhotoXP + expectedMealNoPhotoXP + expectedWaterXP;
      
      // Calculate missing XP
      const missingXP = Math.max(0, totalExpectedXP - currentXP);

      console.log('📊 Retroactive XP calculation:', {
        workoutCount,
        mealsWithPhoto,
        mealsNoPhoto,
        hydrationDays,
        currentXP,
        totalExpectedXP,
        missingXP
      });

      // Award missing XP if significant (more than 100 XP)
      if (missingXP > 100) {
        const { data, error } = await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_xp_amount: missingXP,
          p_source: 'retroactive_sync'
        });

        if (error) {
          console.error('Error awarding retroactive XP:', error);
        } else {
          console.log('✅ Retroactive XP awarded:', missingXP);
          
          toast.success(`📊 Progress Synced! +${missingXP.toLocaleString()} XP awarded`, {
            description: `Based on ${workoutCount} workouts, ${mealsWithPhoto + mealsNoPhoto} meals, and ${hydrationDays} hydration goals`,
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
