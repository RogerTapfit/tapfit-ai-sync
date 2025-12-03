import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { message, avatarName, conversationHistory, userId, includeInjuryContext, includeMoodContext } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const coachName = avatarName || 'Coach';
    
    // Build injury prevention context if user ID provided and requested
    let injuryContext = '';
    let moodContext = '';
    let historyContext = '';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Calculate date 30 days ago for history queries
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    if (userId && includeInjuryContext) {
      try {
        // Fetch user profile for health conditions
        const { data: profile } = await supabase
          .from('profiles')
          .select('previous_injuries, health_conditions, gender, age')
          .eq('id', userId)
          .single();

        // Fetch muscle imbalances
        const { data: imbalances } = await supabase
          .from('muscle_imbalance_tracking')
          .select('*')
          .eq('user_id', userId);

        // Fetch recent form analysis
        const { data: formLogs } = await supabase
          .from('form_analysis_logs')
          .select('exercise_name, avg_form_score, injury_risk_level, flagged_patterns')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        // Calculate risk score
        const { data: riskScore } = await supabase
          .rpc('calculate_injury_risk_score', { _user_id: userId });

        // Build context string
        if (profile || imbalances?.length || formLogs?.length) {
          injuryContext = `\n\nINJURY PREVENTION CONTEXT FOR THIS USER:`;
          
          if (riskScore !== null) {
            const riskLevel = riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';
            injuryContext += `\n- Overall Injury Risk Score: ${riskScore}/100 (${riskLevel} RISK)`;
          }

          if (profile?.previous_injuries?.length) {
            injuryContext += `\n- Previous Injuries: ${profile.previous_injuries.join(', ')}`;
          }

          if (profile?.health_conditions?.length) {
            injuryContext += `\n- Health Conditions: ${profile.health_conditions.join(', ')}`;
          }

          if (imbalances?.length) {
            const significantImbalances = imbalances.filter((i: any) => i.imbalance_percentage > 10);
            if (significantImbalances.length > 0) {
              injuryContext += `\n- Muscle Imbalances Detected:`;
              significantImbalances.forEach((imb: any) => {
                const weakSide = imb.dominant_side === 'left' ? 'right' : 'left';
                injuryContext += `\n  • ${imb.muscle_group}: ${imb.imbalance_percentage.toFixed(0)}% (${weakSide} side weaker, ${imb.trend})`;
              });
            }
          }

          if (formLogs?.length) {
            const avgFormScore = formLogs.reduce((sum: number, l: any) => sum + (l.avg_form_score || 0), 0) / formLogs.length;
            const highRiskCount = formLogs.filter((l: any) => l.injury_risk_level === 'high').length;
            const allPatterns = new Set<string>();
            formLogs.forEach((l: any) => (l.flagged_patterns || []).forEach((p: string) => allPatterns.add(p)));

            injuryContext += `\n- Recent Form Analysis (last ${formLogs.length} sessions):`;
            injuryContext += `\n  • Average Form Score: ${avgFormScore.toFixed(0)}%`;
            if (highRiskCount > 0) {
              injuryContext += `\n  • High-risk sessions: ${highRiskCount}`;
            }
            if (allPatterns.size > 0) {
              injuryContext += `\n  • Recurring patterns: ${Array.from(allPatterns).join(', ')}`;
            }
          }

          injuryContext += `\n\nIMPORTANT SAFETY GUIDELINES:
1. If injury risk is HIGH (>60), recommend recovery days or significantly lighter workouts
2. Proactively address detected muscle imbalances with corrective exercise suggestions
3. Warn about exercises that could aggravate previous injuries or health conditions
4. If the user mentions ANY pain, take it seriously - recommend rest and professional consultation
5. Adjust intensity recommendations based on form scores and risk patterns`;
        }
      } catch (contextError) {
        console.error('Error fetching injury context:', contextError);
      }
    }
    
    // Build biometric mood context if requested
    if (userId && includeMoodContext) {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch today's mood
        const { data: todayMood } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', userId)
          .eq('entry_date', today)
          .order('created_at', { ascending: false })
          .limit(1);

        // Fetch correlations
        const { data: correlations } = await supabase
          .from('workout_performance_correlations')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        // Fetch last night's sleep
        const { data: lastSleep } = await supabase
          .from('sleep_logs')
          .select('duration_minutes, quality_score')
          .eq('user_id', userId)
          .order('sleep_date', { ascending: false })
          .limit(1);

        // Calculate readiness score
        const { data: readiness } = await supabase
          .rpc('calculate_readiness_score', { _user_id: userId });

        moodContext = `\n\nBIOMETRIC MOOD CONTEXT:`;
        
        if (readiness && typeof readiness === 'object') {
          const r = readiness as any;
          moodContext += `\n- Today's Readiness Score: ${r.total}% (${r.status})`;
          moodContext += `\n  • Sleep Score: ${r.sleep}%`;
          moodContext += `\n  • Mood Score: ${r.mood}%`;
          moodContext += `\n  • Stress Score: ${r.stress}% (higher = less stressed)`;
          moodContext += `\n  • Recovery Score: ${r.recovery}%`;
        }
        
        if (todayMood?.[0]) {
          const mood = todayMood[0];
          moodContext += `\n- Today's Self-Reported Mood:`;
          moodContext += `\n  • Mood: ${mood.mood_score}/10`;
          moodContext += `\n  • Energy: ${mood.energy_level}/10`;
          moodContext += `\n  • Stress: ${mood.stress_level}/10`;
          moodContext += `\n  • Motivation: ${mood.motivation_level}/10`;
          if (mood.mood_tags?.length > 0) {
            moodContext += `\n  • Feeling: ${mood.mood_tags.join(', ')}`;
          }
        }
        
        if (lastSleep?.[0]) {
          const hours = (lastSleep[0].duration_minutes / 60).toFixed(1);
          moodContext += `\n- Last Night's Sleep: ${hours} hours`;
          if (lastSleep[0].quality_score) {
            moodContext += `, Quality ${lastSleep[0].quality_score}/5`;
          }
        }
        
        if (correlations) {
          moodContext += `\n\nDISCOVERED PATTERNS FOR THIS USER:`;
          if (correlations.optimal_sleep_hours) {
            moodContext += `\n- Optimal sleep for this user: ${correlations.optimal_sleep_hours} hours`;
          }
          if (correlations.best_workout_time) {
            moodContext += `\n- Best workout time: ${correlations.best_workout_time}`;
          }
          if (correlations.best_workout_day) {
            moodContext += `\n- Best workout day: ${correlations.best_workout_day}`;
          }
          if (correlations.confidence_level) {
            moodContext += `\n- Pattern confidence: ${correlations.confidence_level} (${correlations.data_points_count} data points)`;
          }
        }
        
        moodContext += `\n\nMOOD-BASED RECOMMENDATIONS:
1. If readiness is below 50%, suggest lighter workouts or active recovery
2. If energy is low (< 5), recommend shorter, less intense sessions
3. If stress is high (> 7), suggest mindfulness or stress-relieving exercises
4. If sleep was poor (< 6 hours), recommend avoiding heavy compound lifts
5. Adjust workout recommendations based on the user's current biometric state`;

      } catch (moodError) {
        console.error('Error fetching mood context:', moodError);
      }
    }
    
    // Build comprehensive 30-day history context (ALWAYS included when userId provided)
    if (userId) {
      try {
        console.log('Fetching 30-day history for user:', userId);
        
        // Fetch all data in parallel for efficiency
        const [
          workoutHistoryResult,
          foodHistoryResult,
          hydrationHistoryResult,
          sleepHistoryResult,
          alcoholHistoryResult,
          runSessionsResult,
          rideSessionsResult,
          swimSessionsResult,
          personalRecordsResult,
          profileResult
        ] = await Promise.all([
          // Workout logs with exercises
          supabase
            .from('workout_logs')
            .select('id, workout_name, muscle_group, started_at, ended_at, duration_minutes, calories_burned, total_exercises, total_sets')
            .eq('user_id', userId)
            .gte('started_at', thirtyDaysAgoStr)
            .order('started_at', { ascending: false }),
          
          // Food entries
          supabase
            .from('food_entries')
            .select('logged_date, meal_type, food_items, total_calories, total_protein, total_carbs, total_fat, health_grade')
            .eq('user_id', userId)
            .gte('logged_date', thirtyDaysAgoStr)
            .order('logged_date', { ascending: false }),
          
          // Hydration
          supabase
            .from('water_intake')
            .select('intake_date, beverage_type, amount_ml, effective_hydration_ml, is_dehydrating')
            .eq('user_id', userId)
            .gte('intake_date', thirtyDaysAgoStr)
            .order('intake_date', { ascending: false }),
          
          // Sleep
          supabase
            .from('sleep_logs')
            .select('sleep_date, bedtime, wake_time, duration_minutes, quality_score, notes')
            .eq('user_id', userId)
            .gte('sleep_date', thirtyDaysAgoStr)
            .order('sleep_date', { ascending: false }),
          
          // Alcohol
          supabase
            .from('alcohol_entries')
            .select('logged_date, drink_type, quantity, alcohol_content')
            .eq('user_id', userId)
            .gte('logged_date', thirtyDaysAgoStr)
            .order('logged_date', { ascending: false }),
          
          // Run sessions
          supabase
            .from('run_sessions')
            .select('started_at, total_distance_m, elapsed_time_s, calories, avg_heart_rate, avg_pace_min_km')
            .eq('user_id', userId)
            .gte('started_at', thirtyDaysAgoStr)
            .order('started_at', { ascending: false }),
          
          // Ride sessions
          supabase
            .from('ride_sessions')
            .select('started_at, total_distance_m, elapsed_time_s, calories, avg_heart_rate, avg_speed_kmh')
            .eq('user_id', userId)
            .gte('started_at', thirtyDaysAgoStr)
            .order('started_at', { ascending: false }),
          
          // Swim sessions
          supabase
            .from('swim_sessions')
            .select('started_at, total_distance_m, elapsed_time_s, calories, laps_completed')
            .eq('user_id', userId)
            .gte('started_at', thirtyDaysAgoStr)
            .order('started_at', { ascending: false }),
          
          // Personal records (all time)
          supabase
            .from('personal_records')
            .select('exercise_name, machine_name, weight_lbs, reps, sets, achieved_at')
            .eq('user_id', userId)
            .order('achieved_at', { ascending: false })
            .limit(50),
          
          // Profile for context
          supabase
            .from('profiles')
            .select('primary_goal, experience_level, weight_kg, height_cm, gender, age, target_daily_calories, target_protein_grams')
            .eq('id', userId)
            .single()
        ]);
        
        const workoutHistory = workoutHistoryResult.data || [];
        const foodHistory = foodHistoryResult.data || [];
        const hydrationHistory = hydrationHistoryResult.data || [];
        const sleepHistory = sleepHistoryResult.data || [];
        const alcoholHistory = alcoholHistoryResult.data || [];
        const runSessions = runSessionsResult.data || [];
        const rideSessions = rideSessionsResult.data || [];
        const swimSessions = swimSessionsResult.data || [];
        const personalRecords = personalRecordsResult.data || [];
        const profile = profileResult.data;
        
        // Fetch exercise logs for workouts
        let exercisesByWorkout: Record<string, any[]> = {};
        if (workoutHistory.length > 0) {
          const workoutIds = workoutHistory.map(w => w.id);
          const { data: exerciseLogs } = await supabase
            .from('exercise_logs')
            .select('workout_log_id, exercise_name, machine_name, weight_used, reps_completed, sets_completed')
            .in('workout_log_id', workoutIds);
          
          if (exerciseLogs) {
            exerciseLogs.forEach(ex => {
              if (!exercisesByWorkout[ex.workout_log_id]) {
                exercisesByWorkout[ex.workout_log_id] = [];
              }
              exercisesByWorkout[ex.workout_log_id].push(ex);
            });
          }
        }
        
        // Build comprehensive history context
        historyContext = `\n\n📊 COMPLETE 30-DAY HISTORY (Use this to answer questions about past data):`;
        
        // Profile summary
        if (profile) {
          historyContext += `\n\n👤 USER PROFILE:`;
          historyContext += `\n- Goal: ${profile.primary_goal || 'Not set'}`;
          historyContext += `\n- Experience: ${profile.experience_level || 'Not set'}`;
          if (profile.weight_kg) historyContext += `\n- Weight: ${profile.weight_kg}kg`;
          if (profile.height_cm) historyContext += `\n- Height: ${profile.height_cm}cm`;
          if (profile.target_daily_calories) historyContext += `\n- Daily calorie goal: ${profile.target_daily_calories}`;
          if (profile.target_protein_grams) historyContext += `\n- Daily protein goal: ${profile.target_protein_grams}g`;
        }
        
        // Workout history
        historyContext += `\n\n🏋️ WORKOUT HISTORY (${workoutHistory.length} sessions):`;
        if (workoutHistory.length > 0) {
          // Group by date
          const workoutsByDate: Record<string, any[]> = {};
          workoutHistory.forEach(w => {
            const date = new Date(w.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            if (!workoutsByDate[date]) workoutsByDate[date] = [];
            workoutsByDate[date].push(w);
          });
          
          Object.entries(workoutsByDate).forEach(([date, workouts]) => {
            workouts.forEach(w => {
              historyContext += `\n${date}: ${w.workout_name || w.muscle_group || 'Workout'} (${w.duration_minutes || 0}min, ${w.calories_burned || 0} cal)`;
              const exercises = exercisesByWorkout[w.id] || [];
              if (exercises.length > 0) {
                exercises.forEach(ex => {
                  historyContext += `\n  • ${ex.exercise_name}: ${ex.weight_used || 0}lbs × ${ex.reps_completed} reps × ${ex.sets_completed} sets`;
                });
              }
            });
          });
        } else {
          historyContext += `\n  No workouts logged in the last 30 days`;
        }
        
        // Cardio sessions
        const totalCardio = runSessions.length + rideSessions.length + swimSessions.length;
        if (totalCardio > 0) {
          historyContext += `\n\n🏃 CARDIO SESSIONS (${totalCardio} total):`;
          
          runSessions.forEach(r => {
            const date = new Date(r.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const km = ((r.total_distance_m || 0) / 1000).toFixed(2);
            const mins = Math.round((r.elapsed_time_s || 0) / 60);
            historyContext += `\n${date}: Run - ${km}km in ${mins}min, ${r.calories || 0} cal`;
          });
          
          rideSessions.forEach(r => {
            const date = new Date(r.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const km = ((r.total_distance_m || 0) / 1000).toFixed(2);
            const mins = Math.round((r.elapsed_time_s || 0) / 60);
            historyContext += `\n${date}: Bike - ${km}km in ${mins}min, ${r.calories || 0} cal`;
          });
          
          swimSessions.forEach(s => {
            const date = new Date(s.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const meters = s.total_distance_m || 0;
            const mins = Math.round((s.elapsed_time_s || 0) / 60);
            historyContext += `\n${date}: Swim - ${meters}m in ${mins}min, ${s.laps_completed || 0} laps`;
          });
        }
        
        // Food history
        historyContext += `\n\n🍽️ FOOD HISTORY (${foodHistory.length} meals):`;
        if (foodHistory.length > 0) {
          // Group by date
          const foodByDate: Record<string, any[]> = {};
          foodHistory.forEach(f => {
            if (!foodByDate[f.logged_date]) foodByDate[f.logged_date] = [];
            foodByDate[f.logged_date].push(f);
          });
          
          Object.entries(foodByDate).slice(0, 14).forEach(([date, meals]) => {
            const dateStr = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const dayTotals = meals.reduce((acc, m) => ({
              cal: acc.cal + (m.total_calories || 0),
              protein: acc.protein + (m.total_protein || 0),
              carbs: acc.carbs + (m.total_carbs || 0),
              fat: acc.fat + (m.total_fat || 0)
            }), { cal: 0, protein: 0, carbs: 0, fat: 0 });
            
            historyContext += `\n${dateStr}: ${dayTotals.cal} cal, ${Math.round(dayTotals.protein)}g protein, ${Math.round(dayTotals.carbs)}g carbs, ${Math.round(dayTotals.fat)}g fat`;
            meals.forEach(m => {
              const foodNames = Array.isArray(m.food_items) 
                ? m.food_items.map((item: any) => item.name || item).join(', ')
                : typeof m.food_items === 'object' && m.food_items?.name 
                  ? m.food_items.name 
                  : 'meal';
              historyContext += `\n  • ${m.meal_type}: ${foodNames} (${m.total_calories} cal)`;
            });
          });
        } else {
          historyContext += `\n  No meals logged in the last 30 days`;
        }
        
        // Hydration history
        historyContext += `\n\n💧 HYDRATION HISTORY:`;
        if (hydrationHistory.length > 0) {
          // Group by date
          const hydrationByDate: Record<string, { total: number, effective: number, drinks: any[] }> = {};
          hydrationHistory.forEach(h => {
            if (!hydrationByDate[h.intake_date]) {
              hydrationByDate[h.intake_date] = { total: 0, effective: 0, drinks: [] };
            }
            hydrationByDate[h.intake_date].total += h.amount_ml || 0;
            hydrationByDate[h.intake_date].effective += h.effective_hydration_ml || 0;
            hydrationByDate[h.intake_date].drinks.push(h);
          });
          
          Object.entries(hydrationByDate).slice(0, 14).forEach(([date, data]) => {
            const dateStr = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            historyContext += `\n${dateStr}: ${data.total}ml total, ${data.effective}ml effective hydration`;
          });
        } else {
          historyContext += `\n  No hydration logged in the last 30 days`;
        }
        
        // Sleep history
        historyContext += `\n\n😴 SLEEP HISTORY:`;
        if (sleepHistory.length > 0) {
          sleepHistory.slice(0, 14).forEach(s => {
            const dateStr = new Date(s.sleep_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const hours = ((s.duration_minutes || 0) / 60).toFixed(1);
            historyContext += `\n${dateStr}: ${hours} hours, Quality: ${s.quality_score || '?'}/5`;
            if (s.notes) historyContext += ` - ${s.notes}`;
          });
        } else {
          historyContext += `\n  No sleep logged in the last 30 days`;
        }
        
        // Alcohol history
        if (alcoholHistory.length > 0) {
          historyContext += `\n\n🍺 ALCOHOL HISTORY:`;
          const alcoholByDate: Record<string, any[]> = {};
          alcoholHistory.forEach(a => {
            if (!alcoholByDate[a.logged_date]) alcoholByDate[a.logged_date] = [];
            alcoholByDate[a.logged_date].push(a);
          });
          
          Object.entries(alcoholByDate).slice(0, 14).forEach(([date, drinks]) => {
            const dateStr = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const drinkList = drinks.map(d => `${d.quantity}× ${d.drink_type}`).join(', ');
            historyContext += `\n${dateStr}: ${drinkList}`;
          });
        }
        
        // Personal records
        historyContext += `\n\n🏆 PERSONAL RECORDS:`;
        if (personalRecords.length > 0) {
          personalRecords.slice(0, 20).forEach(pr => {
            const dateStr = new Date(pr.achieved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            historyContext += `\n- ${pr.exercise_name}: ${pr.weight_lbs}lbs × ${pr.reps} reps (${dateStr})`;
          });
        } else {
          historyContext += `\n  No personal records yet`;
        }
        
        // Add summary stats
        const totalWorkoutMinutes = workoutHistory.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
        const totalCaloriesBurned = workoutHistory.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
        const avgSleepHours = sleepHistory.length > 0 
          ? (sleepHistory.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sleepHistory.length / 60).toFixed(1)
          : 0;
        
        historyContext += `\n\n📈 30-DAY SUMMARY:`;
        historyContext += `\n- Total workouts: ${workoutHistory.length}`;
        historyContext += `\n- Total workout time: ${totalWorkoutMinutes} minutes`;
        historyContext += `\n- Total calories burned: ${totalCaloriesBurned}`;
        historyContext += `\n- Total cardio sessions: ${totalCardio}`;
        historyContext += `\n- Average sleep: ${avgSleepHours} hours/night`;
        historyContext += `\n- Personal records achieved: ${personalRecords.filter(pr => {
          const prDate = new Date(pr.achieved_at);
          return prDate >= thirtyDaysAgo;
        }).length}`;
        
        console.log(`History context built: ${workoutHistory.length} workouts, ${foodHistory.length} meals, ${sleepHistory.length} sleep logs`);
        
      } catch (historyError) {
        console.error('Error fetching history context:', historyError);
      }
    }
    
    // Build comprehensive user metrics context (TODAY's data)
    let userMetricsContext = '';
    if (userId) {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('primary_goal, experience_level, weight_kg, height_cm, gender, age')
          .eq('id', userId)
          .single();
          
        // Fetch today's workouts
        const { data: todayWorkouts } = await supabase
          .from('workout_logs')
          .select('workout_name, duration_minutes, total_exercises, total_sets, calories_burned')
          .eq('user_id', userId)
          .gte('created_at', `${today}T00:00:00`)
          .order('created_at', { ascending: false });
          
        // Fetch today's hydration
        const { data: hydration } = await supabase
          .from('water_intake')
          .select('amount_ml, effective_hydration_ml')
          .eq('user_id', userId)
          .eq('intake_date', today);
          
        // Fetch today's nutrition
        const { data: nutrition } = await supabase
          .from('food_entries')
          .select('total_calories, total_protein, total_carbs, total_fat, meal_type')
          .eq('user_id', userId)
          .eq('logged_date', today);
          
        // Fetch nutrition goals
        const { data: nutritionGoals } = await supabase
          .from('nutrition_goals')
          .select('daily_calories, protein_grams, carbs_grams, fat_grams, goal_type')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();
        
        userMetricsContext = `\n\n📅 TODAY'S STATS:`;
        
        if (todayWorkouts?.length) {
          const totalCalories = todayWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
          const totalMinutes = todayWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
          userMetricsContext += `\n- Workouts: ${todayWorkouts.length} session(s), ${totalMinutes} minutes, ${totalCalories} calories burned`;
        } else {
          userMetricsContext += `\n- Workouts: None yet today`;
        }
        
        if (hydration?.length) {
          const totalWater = hydration.reduce((sum, h) => sum + (h.amount_ml || 0), 0);
          const effectiveHydration = hydration.reduce((sum, h) => sum + (h.effective_hydration_ml || 0), 0);
          userMetricsContext += `\n- Hydration: ${totalWater}ml total, ${effectiveHydration}ml effective`;
        } else {
          userMetricsContext += `\n- Hydration: No water logged yet`;
        }
        
        if (nutrition?.length) {
          const totals = nutrition.reduce((acc, n) => ({
            calories: acc.calories + (n.total_calories || 0),
            protein: acc.protein + (n.total_protein || 0),
            carbs: acc.carbs + (n.total_carbs || 0),
            fat: acc.fat + (n.total_fat || 0)
          }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
          userMetricsContext += `\n- Nutrition: ${totals.calories} cal, ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat (${nutrition.length} meals)`;
        } else {
          userMetricsContext += `\n- Nutrition: No meals logged yet`;
        }
        
        if (nutritionGoals) {
          userMetricsContext += `\n- Daily Goals: ${nutritionGoals.daily_calories} cal, ${nutritionGoals.protein_grams}g protein`;
        }
        
      } catch (metricsError) {
        console.error('Error fetching user metrics:', metricsError);
      }
    }
    
    // Build system prompt with coach personality and contexts
    const systemPrompt = `You are ${coachName}, an expert AI fitness coach for TapFit, a smart gym platform. You're knowledgeable, motivating, and personalized.

Key traits:
- Expert in exercise form, programming, nutrition, and injury prevention
- Motivational but realistic tone
- Give specific, actionable advice
- Keep responses concise (2-3 sentences max for conversational flow)
- Always prioritize safety
- Be encouraging and supportive

Specialties:
- Workout programming and exercise selection
- Form corrections and technique tips
- Nutrition and meal planning
- Recovery and injury prevention
- Goal setting and progress tracking
- Motivation and habit building

IMPORTANT: You have access to the user's COMPLETE 30-day history below. When users ask questions like:
- "What did I eat last Tuesday?" → Look up their food history for that date
- "How many workouts this week?" → Count from workout history
- "What's my squat PR?" → Check personal records
- "How much water did I drink yesterday?" → Look up hydration history
- "How did I sleep this week?" → Reference sleep history
- "Show me my progress" → Summarize from the 30-day stats

Use the specific data provided to give ACCURATE, PERSONALIZED answers. If data isn't logged, kindly mention that.
${historyContext}${userMetricsContext}${injuryContext}${moodContext}

Always provide practical, evidence-based fitness advice. Keep your responses brief and conversational - you're having a voice chat, not writing an essay. If you notice injury risks, imbalances, or low readiness in the user's data, proactively mention them and offer solutions.`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log(`Fitness chat request from ${coachName}:`, message.substring(0, 50));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits depleted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm having trouble responding. Please try again.";

    console.log('Fitness chat response generated:', aiResponse.substring(0, 50));

    return new Response(JSON.stringify({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fitness-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble connecting right now. Please try again!"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
