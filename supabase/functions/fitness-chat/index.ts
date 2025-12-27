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

    const { message, avatarName, conversationHistory, userId, includeInjuryContext, includeMoodContext, pageContext } = await req.json();

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
            .select('id, workout_name, muscle_group, started_at, completed_at, duration_minutes, calories_burned, total_exercises')
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
            .select('logged_date, beverage_type, total_amount_ml, effective_hydration_ml, is_dehydrating')
            .eq('user_id', userId)
            .gte('logged_date', thirtyDaysAgoStr)
            .order('logged_date', { ascending: false }),
          
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
            .select('started_at, total_distance_m, elapsed_time_s, calories, avg_heart_rate, avg_pace_sec_per_km')
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
    
    // Build page context section if provided
    // Debug logging for page context
    console.log('[fitness-chat] Page context received:', JSON.stringify(pageContext, null, 2));
    
    let pageContextSection = '';
    if (pageContext) {
      pageContextSection = `\n\n📍 CURRENT PAGE CONTEXT:
The user is currently viewing: ${pageContext.currentPage || 'Unknown Page'}
Page description: ${pageContext.description || 'No description'}
Route: ${pageContext.route || 'Unknown route'}
${pageContext.visibleContent ? `\nVisible Content on Screen:\n${pageContext.visibleContent}` : ''}

CRITICAL CONTEXT RULES:
1. When user says "this", "these", "the product", "what I scanned", "is this good for me", "what about this" → They are referring to the Visible Content above
2. ALWAYS use specific data from the Visible Content: exact names, numbers, ingredients, ratings, warnings
3. If you see SCANNED PRODUCT data, you have FULL access to nutrition, ingredients, quality ratings, drug interactions, and safety info
4. Reference ALL relevant details from the scanned product when answering questions about it
5. For supplement/medication questions, cite specific active ingredients, bioavailability, interactions, and safety data`;
    }
    
    // Build system prompt with comprehensive health & wellness expertise
    const systemPrompt = `You are ${coachName}, an expert AI HEALTH & WELLNESS coach for TapFit. You are a comprehensive health expert, not just a fitness coach.

═══════════════════════════════════════════════════════════════
CORE EXPERTISE AREAS (You are an expert in ALL of these):
═══════════════════════════════════════════════════════════════

💪 FITNESS & EXERCISE:
- Exercise form, technique, and injury prevention
- Workout programming, periodization, and progressive overload
- Gym equipment, machine usage, and exercise variations
- Muscle groups, biomechanics, and movement patterns
- Recovery protocols, rest days, and active recovery

🥗 NUTRITION & FOOD SCIENCE:
- Macronutrients (protein, carbs, fats) and their functions
- Micronutrients (vitamins, minerals) and deficiencies
- Food additives: dyes (Red 40, Yellow 5, Blue 1), preservatives (BHA, BHT, sodium nitrate), artificial sweeteners
- NOVA food classification and ultra-processed foods
- Glycemic index, insulin response, and blood sugar management
- Meal timing, nutrient absorption, and food combinations
- Food allergies, intolerances, and dietary restrictions
- Reading nutrition labels and ingredient lists

💊 SUPPLEMENTS & MEDICATIONS:
- Vitamin forms and bioavailability (D2 vs D3, Magnesium Glycinate vs Oxide, methylated B vitamins)
- Supplement quality indicators (USP, NSF, GMP certifications)
- Active vs inactive ingredients and their purposes
- Drug-supplement interactions and contraindications
- Dosing guidelines, timing, and absorption optimization
- Safety warnings, overdose risks, and age/pregnancy restrictions
- Herbal supplements, nootropics, and performance enhancers

🏥 HEALTH & WELLNESS:
- Sleep optimization, circadian rhythm, and sleep stages
- Stress management, cortisol, and recovery
- Hydration, electrolytes, and fluid balance
- Body composition, metabolism, and energy expenditure
- Heart health, blood pressure, and cardiovascular markers
- General health questions and wellness optimization

📊 PRODUCT ANALYSIS:
- Interpret scanned food products, supplements, and medications
- Explain health grades, quality ratings, and nutritional scores
- Identify concerning ingredients and explain their effects
- Provide personalized recommendations based on user's health data

═══════════════════════════════════════════════════════════════
RESPONSE GUIDELINES:
═══════════════════════════════════════════════════════════════

FOR QUICK/SIMPLE QUESTIONS:
- Keep responses brief (2-3 sentences)
- Be conversational and motivating

FOR DETAILED QUESTIONS (nutrition facts, ingredients, supplements, medications, drug interactions):
- Provide comprehensive, thorough answers
- Include specific data, mechanisms, and recommendations
- Explain the "why" behind your advice
- Don't limit yourself to 2-3 sentences when detail is needed

FOR SCANNED PRODUCTS:
- Reference ALL details from the Visible Content
- Cite specific ingredients, amounts, and quality ratings
- Explain health implications in user-friendly terms
- Provide actionable recommendations

PERSONALITY:
- Knowledgeable but approachable
- Evidence-based and accurate
- Motivational but realistic
- Safety-conscious and proactive
- Personalized to user's data and goals
${pageContextSection}

═══════════════════════════════════════════════════════════════
USER DATA ACCESS:
═══════════════════════════════════════════════════════════════

You have access to the user's COMPLETE 30-day history. Use it to:
- "What did I eat Tuesday?" → Look up food history
- "How many workouts this week?" → Count workouts
- "What's my squat PR?" → Check personal records
- "How much water yesterday?" → Look up hydration
- "How did I sleep?" → Reference sleep logs
- "Is this supplement safe for me?" → Cross-reference with health conditions

If data isn't logged, kindly mention that and offer to help them start tracking.
${historyContext}${userMetricsContext}${injuryContext}${moodContext}

Always provide practical, evidence-based advice. If you notice injury risks, imbalances, low readiness, or health concerns in the user's data, proactively mention them.`;

    // Navigation tool for smart app navigation
    const navigationTool = {
      type: "function",
      function: {
        name: "navigate_to_page",
        description: "Navigate the user to a specific page or feature in the TapFit app when they ask to go somewhere, start an activity, or access a feature. Use this when user wants to scan a machine, start a workout, log food, scan a menu, etc. Be PRECISE with routes - use the exact tab parameter when available. DO NOT use this for modals like water, sleep, mood, cycle, or heart rate - use open_modal instead.",
        parameters: {
          type: "object",
          properties: {
            route: {
              type: "string",
              enum: [
                // Main pages
                "/", "/workout-mode-select", "/workout-list", "/scan-machine",
                "/run/setup", "/ride/setup", "/swim/setup",
                "/body-scan", "/workouts", "/social", "/leaderboard",
                "/meal-planner", "/fitness-alarm", "/run/history", "/ride/history",
                "/swim/history", "/progress", "/settings", "/profile",
                "/notifications", "/rewards", "/achievements", "/workout-history",
                "/pr-leaderboard", "/meal-feed", "/screen-time-bank", "/avatars",
                
                // Food Scanner with SPECIFIC tabs - USE THESE FOR PRECISE NAVIGATION
                "/food-scanner",                  // Default - AI Food Analyzer
                "/food-scanner?tab=analyzer",     // AI Food Photo Analyzer
                "/food-scanner?tab=product",      // Product/Barcode Scanner
                "/food-scanner?tab=menu",         // Restaurant Menu Scanner
                "/food-scanner?tab=coach",        // Coach's Choice Recommendations
                "/food-scanner?tab=builder",      // AI Recipe Builder
                "/food-scanner?tab=restaurants",  // Restaurant Discovery
                "/food-scanner?tab=planner"       // Embedded Meal Planner
              ],
              description: "The route path to navigate to. Use query parameters for specific tabs."
            },
            pageName: {
              type: "string",
              description: "Human-readable page name to display to user"
            },
            confirmationMessage: {
              type: "string",
              description: "A friendly message to say before navigating (keep it brief and motivating)"
            }
          },
          required: ["route", "pageName", "confirmationMessage"]
        }
      }
    };

    // Modal tool for opening dashboard modals (water, sleep, mood, cycle, heart rate)
    const modalTool = {
      type: "function",
      function: {
        name: "open_modal",
        description: "Open a modal/dialog on the user's screen for features that don't have their own page. Use this for water tracking, sleep tracking, mood logging, cycle tracking, and heart rate scanning. These are NOT pages - they are modals on the dashboard.",
        parameters: {
          type: "object",
          properties: {
            modalType: {
              type: "string",
              enum: ["water", "sleep", "mood", "cycle", "heartRate"],
              description: "The type of modal to open: water (hydration tracker), sleep (sleep log), mood (mood check-in), cycle (menstrual cycle tracker), heartRate (heart rate scanner)"
            },
            modalName: {
              type: "string",
              description: "Human-readable name of the modal (e.g., 'Water Tracker', 'Sleep Log', 'Heart Rate Scanner')"
            },
            confirmationMessage: {
              type: "string",
              description: "A friendly message to say before opening the modal (keep it brief)"
            }
          },
          required: ["modalType", "modalName", "confirmationMessage"]
        }
      }
    };

    // Beverage logging tool for voice/text beverage tracking
    const beverageTool = {
      type: "function",
      function: {
        name: "log_beverage",
        description: "Log a beverage to the user's hydration tracker when they mention drinking something. Use this when the user says things like 'I had a glass of water', 'just drank coffee', 'had a beer', etc. Automatically detect the beverage type and amount from context.",
        parameters: {
          type: "object",
          properties: {
            beverageType: {
              type: "string",
              enum: ["water", "sparkling_water", "coffee", "tea", "herbal_tea", "milk", "juice", 
                     "soda", "energy_drink", "sports_drink", "beer", "wine", "cocktail", "spirits"],
              description: "The type of beverage consumed"
            },
            amountOz: {
              type: "number",
              description: "Amount in ounces. Default sizes: glass=8oz, can/bottle=12oz, large bottle=16oz, wine=5oz, cocktail=8oz, shot/spirits=1.5oz"
            },
            confirmationMessage: {
              type: "string", 
              description: "A brief, friendly confirmation message mentioning the beverage and amount logged"
            }
          },
          required: ["beverageType", "amountOz", "confirmationMessage"]
        }
      }
    };

    // Food logging tool for AI-powered food tracking with nutrition lookup and image generation
    const foodTool = {
      type: "function",
      function: {
        name: "log_food",
        description: "Log food to the user's nutrition tracker when they mention eating something. Use this for ANY food consumption like 'I had a banana', 'ate some chicken', 'had a Chipotle burrito with rice, beans, and guac', 'just ate pizza', etc. The AI will calculate accurate nutrition data.",
        parameters: {
          type: "object",
          properties: {
            foodDescription: {
              type: "string",
              description: "Full description of the food including any toppings, preparation style, ingredients, or restaurant name (e.g., 'Chipotle burrito bowl with chicken, white rice, black beans, fajita veggies, and guacamole')"
            },
            mealType: {
              type: "string",
              enum: ["breakfast", "lunch", "dinner", "snack"],
              description: "Type of meal based on context and time of day"
            },
            confirmationMessage: {
              type: "string",
              description: "A brief, friendly confirmation mentioning the food and estimated calories (e.g., 'Logged your Chipotle bowl - about 845 cal!')"
            }
          },
          required: ["foodDescription", "mealType", "confirmationMessage"]
        }
      }
    };

    // Sleep logging tool for quick sleep tracking
    const sleepTool = {
      type: "function",
      function: {
        name: "log_sleep",
        description: "Log sleep duration when user mentions how much they slept. Use this for statements like 'I got 6 hours of sleep', 'slept 7 hours', 'only slept 5 hours last night', 'had 8 hours of rest', etc.",
        parameters: {
          type: "object",
          properties: {
            durationHours: {
              type: "number",
              description: "Sleep duration in hours (e.g., 7, 7.5, 6). Support decimals like 7.5 for 'seven and a half hours'."
            },
            qualityScore: {
              type: "number",
              description: "Sleep quality 1-5 based on context. Default 3. Use 1-2 if user says 'terrible', 'bad', 'restless', 'awful'. Use 4-5 if 'great', 'amazing', 'best sleep', 'slept like a baby'."
            },
            notes: {
              type: "string",
              description: "Optional notes about the sleep quality or issues mentioned (e.g., 'woke up twice', 'vivid dreams', 'restless')"
            },
            confirmationMessage: {
              type: "string",
              description: "Brief friendly confirmation mentioning hours logged (e.g., '😴 Logged 7 hours of sleep!')"
            }
          },
          required: ["durationHours", "confirmationMessage"]
        }
      }
    };

    // Cycle tracking tool for period start/end logging
    const cycleTool = {
      type: "function",
      function: {
        name: "log_cycle_event",
        description: "Log menstrual cycle events when user mentions period start or end. Use when user says 'my period started', 'got my period', 'period ended', 'cycle started', 'menstrual cycle began', etc.",
        parameters: {
          type: "object",
          properties: {
            eventType: {
              type: "string",
              enum: ["period_start", "period_end"],
              description: "'period_start' for beginning of period, 'period_end' when period ends"
            },
            eventDate: {
              type: "string",
              description: "Date of event in YYYY-MM-DD format. Use today's date unless user specifies 'yesterday' or a specific date."
            },
            confirmationMessage: {
              type: "string",
              description: "Supportive, friendly confirmation (e.g., '🌸 Period start logged! Your cycle info has been updated.')"
            }
          },
          required: ["eventType", "confirmationMessage"]
        }
      }
    };
    
    // Extend system prompt with navigation capabilities
    const navigationInstructions = `

═══════════════════════════════════════════════════════════════
NAVIGATION COMMANDS:
═══════════════════════════════════════════════════════════════

You can navigate users around the app! When they ask to go somewhere or start an activity, use the navigate_to_page tool.

🍎 FOOD HUB - BE SPECIFIC WITH TABS:
- "scan food", "analyze food", "what's in this food", "food photo" → /food-scanner?tab=analyzer
- "scan product", "scan barcode", "nutrition label", "scan package" → /food-scanner?tab=product
- "scan menu", "restaurant menu", "menu scanner", "analyze menu" → /food-scanner?tab=menu
- "healthy choices", "coach's choice", "what should I eat", "food recommendations" → /food-scanner?tab=coach
- "build recipe", "recipe from ingredients", "what can I make", "recipe builder" → /food-scanner?tab=builder
- "find restaurants", "restaurant recommendations", "discover restaurants" → /food-scanner?tab=restaurants
- "meal planner in food hub" → /food-scanner?tab=planner
- "meal planner", "plan my meals", "weekly meals" → /meal-planner
- "meal feed", "see what friends eat" → /meal-feed

🏋️ WORKOUTS:
- "scan machine", "machine scanner", "gym machine" → /scan-machine
- "start workout", "begin workout", "do a workout" → /workout-mode-select
- "workout list", "my workouts", "saved workouts" → /workout-list
- "workout history", "past workouts", "workout logs" → /workout-history
- "workout hub", "exercises", "exercise library" → /workouts
- "PRs", "personal records", "PR leaderboard" → /pr-leaderboard

🏃 CARDIO:
- "start run", "go running", "track my run", "running" → /run/setup
- "start ride", "go cycling", "bike ride", "cycling" → /ride/setup
- "start swim", "go swimming", "pool session" → /swim/setup
- "run history", "past runs" → /run/history
- "ride history", "past rides" → /ride/history
- "swim history", "past swims" → /swim/history

📊 TRACKING & PROGRESS:
- "progress", "my progress", "stats", "analytics" → /progress
- "body scan", "measure my body", "body composition" → /body-scan
- "leaderboard", "rankings" → /leaderboard

👥 SOCIAL:
- "social", "friends", "feed", "social feed" → /social
- "achievements", "badges" → /achievements
- "rewards", "my rewards", "tap coins" → /rewards
- "avatars", "change avatar", "my avatar" → /avatars

⚙️ SETTINGS & PROFILE:
- "home", "dashboard", "main page" → /
- "settings" → /settings
- "profile", "my profile" → /profile
- "notifications" → /notifications
- "set alarm", "fitness alarm", "wake up alarm" → /fitness-alarm
- "screen time bank", "screen time" → /screen-time-bank

💧 MODAL-BASED FEATURES (use open_modal tool, NOT navigation):
- "water tracker", "log water", "hydration", "drink water", "track water" → open_modal(water, "Water Tracker")
- "sleep tracker", "log sleep", "track sleep", "how did I sleep" → open_modal(sleep, "Sleep Tracker")
- "mood tracker", "log mood", "how do I feel", "mood check" → open_modal(mood, "Mood Check-in")
- "cycle tracker", "period tracker", "menstrual cycle", "track period" → open_modal(cycle, "Cycle Tracker")
- "heart rate", "check heart rate", "scan heart", "measure pulse", "BPM" → open_modal(heartRate, "Heart Rate Scanner")

═══════════════════════════════════════════════════════════════
🥤 BEVERAGE LOGGING (use log_beverage tool):
═══════════════════════════════════════════════════════════════

When users mention drinking ANY beverage, LOG IT AUTOMATICALLY using the log_beverage tool!
This is the FASTEST way for users to track hydration - just say what they drank.

Examples of when to use log_beverage:
- "I had a glass of water" → log_beverage(water, 8, "Logged 8oz of water!")
- "Just drank some coffee" → log_beverage(coffee, 8, "Added your coffee!")
- "Had a beer" → log_beverage(beer, 12, "Logged your beer - stay hydrated!")
- "Glass of wine with dinner" → log_beverage(wine, 5, "Wine logged!")
- "Drinking an energy drink" → log_beverage(energy_drink, 8, "Energy drink added!")
- "I had 2 glasses of water" → log_beverage(water, 16, "Logged 16oz of water!")

═══════════════════════════════════════════════════════════════
😴 SLEEP LOGGING (use log_sleep tool):
═══════════════════════════════════════════════════════════════

When users mention how much they slept, LOG IT AUTOMATICALLY using the log_sleep tool!
This is the FASTEST way for users to track sleep - just say how much they slept.

Examples of when to use log_sleep:
- "I got 6 hours of sleep" → log_sleep(6, 3, null, "😴 Logged 6 hours of sleep!")
- "Slept 8 hours, felt great" → log_sleep(8, 5, null, "Amazing! 8 hours logged! 😴")
- "Only got 5 hours, terrible night" → log_sleep(5, 2, "rough night", "5 hours logged. Hope you rest better tonight! 💤")
- "Had 7 and a half hours" → log_sleep(7.5, 3, null, "7.5 hours tracked! 😴")
- "Slept like a baby for 9 hours" → log_sleep(9, 5, null, "Wow, 9 hours! Great rest! 😴")
- "Barely slept, maybe 4 hours" → log_sleep(4, 1, "very little sleep", "Only 4 hours logged. Take it easy today! 💤")

Quality scoring (1-5):
- 1-2: "terrible", "awful", "bad", "restless", "couldn't sleep", "tossed and turned", "insomnia"
- 3: neutral or no quality mentioned (default)
- 4-5: "great", "amazing", "best sleep", "slept like a baby", "fantastic", "well rested"

═══════════════════════════════════════════════════════════════
🌸 CYCLE TRACKING (use log_cycle_event tool):
═══════════════════════════════════════════════════════════════

When users mention period/menstrual cycle events, LOG IT AUTOMATICALLY using the log_cycle_event tool!
Be supportive and normalize cycle tracking.

Examples of when to use log_cycle_event:
- "My period started" → log_cycle_event("period_start", today, "🌸 Period start logged! Your cycle tracker is updated.")
- "I got my period today" → log_cycle_event("period_start", today, "Got it! Cycle updated 🌸")
- "My period ended" → log_cycle_event("period_end", today, "🌸 Period end logged! Take care of yourself!")
- "Period started yesterday" → log_cycle_event("period_start", yesterday_date, "Logged for yesterday! 🌸")
- "Cycle began this morning" → log_cycle_event("period_start", today, "🌸 Logged! Let me know if you need any support.")

Always use 🌸 emoji and be supportive. Offer workout/nutrition adjustments based on cycle phase if relevant.
- "Just finished a bottle of water" → log_beverage(water, 16, "Great hydration!")
- "Had some orange juice" → log_beverage(juice, 8, "OJ logged!")
- "Drank a soda" → log_beverage(soda, 12, "Soda tracked!")
- "A couple beers" → log_beverage(beer, 24, "Two beers logged!")

Default sizes if not specified:
- Glass = 8oz, Can/Bottle = 12oz, Large bottle = 16oz
- Wine = 5oz, Cocktail = 8oz, Shot/spirits = 1.5oz
- "A couple" or "two" = double the default

IMPORTANT: Use log_beverage for LOGGING consumed beverages.
Use open_modal(water) only when user wants to OPEN the water tracker modal.

═══════════════════════════════════════════════════════════════
🍎 FOOD LOGGING (use log_food tool):
═══════════════════════════════════════════════════════════════

When users mention eating ANY food, LOG IT AUTOMATICALLY using the log_food tool!
The AI will calculate accurate nutrition (calories, protein, carbs, fat) based on the food description.
For restaurant meals like Chipotle, it will use actual menu nutrition data.

Examples of when to use log_food:
- "I had a banana" → log_food("banana, medium", "snack", "Logged your banana - 105 cal! 🍌")
- "Ate some grilled chicken" → log_food("grilled chicken breast, ~6oz", "lunch", "Chicken logged - about 280 cal!")
- "Had a Chipotle burrito with chicken, rice, beans, and guac" → log_food("Chipotle burrito: chicken, white rice, black beans, guacamole", "lunch", "Logged your Chipotle burrito - ~950 cal! 🌯")
- "Just ate an apple" → log_food("apple, medium", "snack", "Apple logged - 95 cal! 🍎")
- "Had eggs and toast for breakfast" → log_food("2 scrambled eggs with 2 slices wheat toast", "breakfast", "Breakfast logged - about 350 cal!")
- "Grabbed a Big Mac" → log_food("McDonald's Big Mac", "lunch", "Big Mac logged - 550 cal! 🍔")
- "Ate some pizza" → log_food("2 slices cheese pizza", "dinner", "Pizza tracked - ~530 cal! 🍕")

IMPORTANT: Include as much detail as possible from the user's description:
- Restaurant name (Chipotle, McDonald's, etc.)
- Toppings and customizations
- Portion sizes when mentioned
- Cooking method (grilled, fried, baked)

The AI will generate an image of the food and look up accurate nutrition data!

IMPORTANT: For modals (water, sleep, mood, cycle, heartRate), use the open_modal tool.
For pages/features, use the navigate_to_page tool.

When using navigate_to_page or open_modal, keep confirmationMessage brief and energetic!
Examples: "Let's go!", "Taking you there now!", "Here we go!", "On it!", "Opening that for you!"`;


    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt + navigationInstructions },
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
        tools: [navigationTool, modalTool, beverageTool, foodTool, sleepTool, cycleTool],
        tool_choice: "auto"
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
    const messageData = data.choices?.[0]?.message;
    
    // Check if AI wants to use a tool (navigate or open modal)
    if (messageData?.tool_calls?.length > 0) {
      const toolCall = messageData.tool_calls[0];
      
      if (toolCall.function?.name === 'navigate_to_page') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.log('Navigation requested:', args);
          
          return new Response(JSON.stringify({ 
            response: args.confirmationMessage,
            action: {
              type: 'navigate',
              route: args.route,
              pageName: args.pageName
            },
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (parseError) {
          console.error('Error parsing navigation tool call:', parseError);
        }
      }
      
      if (toolCall.function?.name === 'open_modal') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.log('Modal requested:', args);
          
          return new Response(JSON.stringify({ 
            response: args.confirmationMessage,
            action: {
              type: 'open_modal',
              modalType: args.modalType,
              modalName: args.modalName
            },
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (parseError) {
          console.error('Error parsing modal tool call:', parseError);
        }
      }

      // Handle beverage logging tool
      if (toolCall.function?.name === 'log_beverage') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.log('Beverage logging requested:', args);

          // Beverage hydration factors (matches frontend beverageHydration.ts)
          const HYDRATION_FACTORS: Record<string, { factor: number; calories: number; isDehydrating: boolean }> = {
            'water': { factor: 1.0, calories: 0, isDehydrating: false },
            'sparkling_water': { factor: 0.95, calories: 0, isDehydrating: false },
            'coffee': { factor: 0.8, calories: 2, isDehydrating: false },
            'tea': { factor: 0.9, calories: 2, isDehydrating: false },
            'herbal_tea': { factor: 0.95, calories: 0, isDehydrating: false },
            'milk': { factor: 0.87, calories: 18, isDehydrating: false },
            'juice': { factor: 0.85, calories: 28, isDehydrating: false },
            'soda': { factor: 0.75, calories: 39, isDehydrating: false },
            'energy_drink': { factor: 0.65, calories: 27, isDehydrating: false },
            'sports_drink': { factor: 0.9, calories: 15, isDehydrating: false },
            'beer': { factor: -0.5, calories: 43, isDehydrating: true },
            'wine': { factor: -0.6, calories: 25, isDehydrating: true },
            'cocktail': { factor: -0.6, calories: 55, isDehydrating: true },
            'spirits': { factor: -0.8, calories: 65, isDehydrating: true }
          };

          const beverageInfo = HYDRATION_FACTORS[args.beverageType] || HYDRATION_FACTORS['water'];
          const amountMl = Math.round(args.amountOz * 29.5735);
          const effectiveHydrationMl = Math.round(amountMl * beverageInfo.factor);
          const today = new Date().toISOString().split('T')[0];

          // Log to water_intake table
          if (userId) {
            const { error: insertError } = await supabase
              .from('water_intake')
              .insert({
                user_id: userId,
                logged_date: today,
                beverage_type: args.beverageType,
                amount_ml: amountMl,
                total_amount_ml: amountMl,
                effective_hydration_ml: effectiveHydrationMl,
                is_dehydrating: beverageInfo.isDehydrating,
                logged_at: new Date().toISOString(),
                source: 'chatbot'
              });

            if (insertError) {
              console.error('Error logging beverage:', insertError);
            } else {
              console.log(`Logged ${args.amountOz}oz of ${args.beverageType} (${effectiveHydrationMl}ml effective)`);
            }

            // Log calories if beverage has any (for drinks with significant calories)
            if (beverageInfo.calories > 0) {
              const totalCalories = Math.round((args.amountOz / 8) * beverageInfo.calories);
              if (totalCalories > 5) {
                await supabase.from('food_entries').insert({
                  user_id: userId,
                  logged_date: today,
                  meal_type: 'snack',
                  food_items: [{ name: args.beverageType.replace('_', ' '), amount: `${args.amountOz}oz`, calories: totalCalories }],
                  total_calories: totalCalories,
                  total_protein: 0,
                  total_carbs: args.beverageType === 'juice' || args.beverageType === 'soda' ? Math.round(totalCalories / 4) : 0,
                  total_fat: 0,
                  ai_analyzed: false,
                  user_confirmed: true,
                  notes: `Logged via voice/chat: ${args.beverageType}`
                });
              }
            }
          }

          // Get the beverage icon for the response
          const beverageIcons: Record<string, string> = {
            'water': '💧', 'sparkling_water': '✨💧', 'coffee': '☕', 'tea': '🍵',
            'herbal_tea': '🌿', 'milk': '🥛', 'juice': '🧃', 'soda': '🥤',
            'energy_drink': '⚡', 'sports_drink': '🏃', 'beer': '🍺',
            'wine': '🍷', 'cocktail': '🍹', 'spirits': '🥃'
          };

          return new Response(JSON.stringify({ 
            response: args.confirmationMessage,
            action: {
              type: 'log_beverage',
              beverageType: args.beverageType,
              amountOz: args.amountOz,
              effectiveHydrationMl,
              isDehydrating: beverageInfo.isDehydrating,
              beverageIcon: beverageIcons[args.beverageType] || '💧'
            },
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (parseError) {
          console.error('Error parsing beverage tool call:', parseError);
        }
      }

      // Handle food logging tool
      if (toolCall.function?.name === 'log_food') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.log('Food logging requested:', args);

          const today = new Date().toISOString().split('T')[0];
          
          // Use AI to calculate accurate nutrition from description
          console.log('Fetching nutrition data for:', args.foodDescription);
          
          let nutritionData = {
            foodItems: [{ name: args.foodDescription, calories: 200, protein: 10, carbs: 20, fat: 8 }],
            totalCalories: 200,
            totalProtein: 10,
            totalCarbs: 20,
            totalFat: 8
          };

          try {
            const nutritionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [{
                  role: 'system',
                  content: `You are a certified nutritionist with access to restaurant nutrition databases. Calculate accurate nutrition for foods. For restaurant items (Chipotle, McDonald's, etc.), use ACTUAL published nutrition data from their official sources. For home-cooked or generic foods, estimate based on standard serving sizes.`
                }, {
                  role: 'user', 
                  content: `Calculate detailed nutrition for: "${args.foodDescription}". 
                  
For each component, provide accurate data. Return ONLY valid JSON in this exact format:
{
  "foodItems": [
    { "name": "item name", "calories": number, "protein": number, "carbs": number, "fat": number }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number
}`
                }],
                tools: [{
                  type: "function",
                  function: {
                    name: "return_nutrition",
                    description: "Return calculated nutrition data",
                    parameters: {
                      type: "object",
                      properties: {
                        foodItems: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              calories: { type: "number" },
                              protein: { type: "number" },
                              carbs: { type: "number" },
                              fat: { type: "number" }
                            },
                            required: ["name", "calories", "protein", "carbs", "fat"]
                          }
                        },
                        totalCalories: { type: "number" },
                        totalProtein: { type: "number" },
                        totalCarbs: { type: "number" },
                        totalFat: { type: "number" }
                      },
                      required: ["foodItems", "totalCalories", "totalProtein", "totalCarbs", "totalFat"]
                    }
                  }
                }],
                tool_choice: { type: "function", function: { name: "return_nutrition" } }
              }),
            });

            if (nutritionResponse.ok) {
              const nutritionResult = await nutritionResponse.json();
              const toolCallResult = nutritionResult.choices?.[0]?.message?.tool_calls?.[0];
              if (toolCallResult?.function?.arguments) {
                nutritionData = JSON.parse(toolCallResult.function.arguments);
                console.log('Nutrition data retrieved:', nutritionData);
              }
            }
          } catch (nutritionError) {
            console.error('Error fetching nutrition:', nutritionError);
            // Continue with default estimates
          }

          // Generate food image using AI
          let photoUrl: string | null = null;
          try {
            console.log('Generating food image for:', args.foodDescription);
            const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash-image-preview',
                messages: [{
                  role: 'user',
                  content: `Generate a photorealistic top-down food photography image of: ${args.foodDescription}. 
                  Style: Professional food photography, appetizing presentation, clean white plate or appropriate dish, natural lighting, sharp focus.
                  Do NOT include any text, labels, or watermarks in the image.`
                }],
                modalities: ['image', 'text']
              }),
            });

            if (imageResponse.ok) {
              const imageResult = await imageResponse.json();
              const imageData = imageResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              
              if (imageData && userId) {
                // Upload base64 image to Supabase Storage
                const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
                const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                const fileName = `${userId}/${Date.now()}-ai-food.png`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('food-photos')
                  .upload(fileName, imageBuffer, {
                    contentType: 'image/png',
                    upsert: false
                  });

                if (!uploadError && uploadData) {
                  const { data: urlData } = supabase.storage
                    .from('food-photos')
                    .getPublicUrl(fileName);
                  photoUrl = urlData.publicUrl;
                  console.log('Food image uploaded:', photoUrl);
                } else {
                  console.error('Error uploading image:', uploadError);
                }
              }
            }
          } catch (imageError) {
            console.error('Error generating food image:', imageError);
            // Continue without image
          }

          // Insert food entry into database
          if (userId) {
            const foodEntry = {
              user_id: userId,
              logged_date: today,
              meal_type: args.mealType,
              food_items: nutritionData.foodItems.map(item => ({
                name: item.name,
                quantity: '1 serving',
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat
              })),
              total_calories: nutritionData.totalCalories,
              total_protein: nutritionData.totalProtein,
              total_carbs: nutritionData.totalCarbs,
              total_fat: nutritionData.totalFat,
              photo_url: photoUrl,
              ai_analyzed: true,
              user_confirmed: true,
              notes: `Logged via chatbot: ${args.foodDescription}`
            };

            const { error: insertError } = await supabase
              .from('food_entries')
              .insert(foodEntry);

            if (insertError) {
              console.error('Error logging food entry:', insertError);
            } else {
              console.log(`Logged food: ${args.foodDescription} (${nutritionData.totalCalories} cal)`);
            }
          }

          // Get appropriate food icon
          const description = args.foodDescription.toLowerCase();
          let foodIcon = '🍽️';
          if (description.includes('banana')) foodIcon = '🍌';
          else if (description.includes('apple')) foodIcon = '🍎';
          else if (description.includes('pizza')) foodIcon = '🍕';
          else if (description.includes('burger') || description.includes('mac')) foodIcon = '🍔';
          else if (description.includes('burrito') || description.includes('taco') || description.includes('chipotle')) foodIcon = '🌯';
          else if (description.includes('chicken')) foodIcon = '🍗';
          else if (description.includes('salad')) foodIcon = '🥗';
          else if (description.includes('egg')) foodIcon = '🍳';
          else if (description.includes('sandwich')) foodIcon = '🥪';
          else if (description.includes('sushi')) foodIcon = '🍣';
          else if (description.includes('pasta') || description.includes('spaghetti')) foodIcon = '🍝';
          else if (description.includes('rice')) foodIcon = '🍚';
          else if (description.includes('bread') || description.includes('toast')) foodIcon = '🍞';
          else if (description.includes('fruit')) foodIcon = '🍓';
          else if (description.includes('vegetable') || description.includes('broccoli')) foodIcon = '🥦';
          else if (description.includes('steak') || description.includes('beef')) foodIcon = '🥩';
          else if (description.includes('fish') || description.includes('salmon')) foodIcon = '🐟';

          return new Response(JSON.stringify({ 
            response: args.confirmationMessage,
            action: {
              type: 'log_food',
              foodDescription: args.foodDescription,
              mealType: args.mealType,
              totalCalories: nutritionData.totalCalories,
              totalProtein: nutritionData.totalProtein,
              totalCarbs: nutritionData.totalCarbs,
              totalFat: nutritionData.totalFat,
              foodItems: nutritionData.foodItems,
              photoUrl: photoUrl,
              foodIcon: foodIcon
            },
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (parseError) {
          console.error('Error parsing food tool call:', parseError);
        }
      }

      // Handle sleep logging tool
      if (toolCall.function?.name === 'log_sleep') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.log('Sleep logging requested:', args);

          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const sleepDate = yesterday.toISOString().split('T')[0]; // Assume last night
          
          // Calculate bedtime and wake time (assume 7am wake by default)
          const wakeTime = new Date(today);
          wakeTime.setHours(7, 0, 0, 0);
          const bedtime = new Date(wakeTime.getTime() - (args.durationHours * 60 * 60 * 1000));
          
          const durationMinutes = Math.round(args.durationHours * 60);
          const qualityScore = args.qualityScore || 3;

          if (userId) {
            const { error: insertError } = await supabase
              .from('sleep_logs')
              .upsert({
                user_id: userId,
                sleep_date: sleepDate,
                bedtime: bedtime.toISOString(),
                wake_time: wakeTime.toISOString(),
                duration_minutes: durationMinutes,
                quality_score: qualityScore,
                source: 'chatbot',
                notes: args.notes || `Logged via chatbot: ${args.durationHours} hours`
              }, { onConflict: 'user_id,sleep_date' });

            if (insertError) {
              console.error('Error logging sleep:', insertError);
            } else {
              console.log(`Logged sleep: ${args.durationHours} hours, quality: ${qualityScore}/5`);
            }
          }

          return new Response(JSON.stringify({ 
            response: args.confirmationMessage,
            action: {
              type: 'log_sleep',
              durationHours: args.durationHours,
              qualityScore: qualityScore,
              sleepDate: sleepDate,
              durationMinutes: durationMinutes
            },
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (parseError) {
          console.error('Error parsing sleep tool call:', parseError);
        }
      }

      // Handle cycle event logging tool
      if (toolCall.function?.name === 'log_cycle_event') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.log('Cycle event logging requested:', args);

          const today = new Date().toISOString().split('T')[0];
          const eventDate = args.eventDate || today;

          if (userId) {
            if (args.eventType === 'period_start') {
              // Fetch existing cycle data to preserve settings
              const { data: existing } = await supabase
                .from('cycle_tracking')
                .select('*')
                .eq('user_id', userId)
                .single();

              const { error: upsertError } = await supabase
                .from('cycle_tracking')
                .upsert({
                  user_id: userId,
                  is_enabled: true,
                  last_period_start: eventDate,
                  average_cycle_length: existing?.average_cycle_length || 28,
                  average_period_length: existing?.average_period_length || 5
                }, { onConflict: 'user_id' });

              if (upsertError) {
                console.error('Error logging period start:', upsertError);
              } else {
                console.log(`Logged period start: ${eventDate}`);
              }

              return new Response(JSON.stringify({ 
                response: args.confirmationMessage,
                action: {
                  type: 'log_cycle_event',
                  eventType: 'period_start',
                  date: eventDate
                },
                timestamp: new Date().toISOString()
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });

            } else if (args.eventType === 'period_end') {
              // Calculate period length from last_period_start to today
              const { data: existing } = await supabase
                .from('cycle_tracking')
                .select('last_period_start, average_cycle_length')
                .eq('user_id', userId)
                .single();

              let periodLength = 5; // default
              if (existing?.last_period_start) {
                const startDate = new Date(existing.last_period_start);
                const endDate = new Date(eventDate);
                periodLength = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                
                // Update average period length
                await supabase.from('cycle_tracking').update({
                  average_period_length: periodLength
                }).eq('user_id', userId);
                
                console.log(`Logged period end: ${eventDate}, duration: ${periodLength} days`);
              }

              return new Response(JSON.stringify({ 
                response: args.confirmationMessage,
                action: {
                  type: 'log_cycle_event',
                  eventType: 'period_end',
                  date: eventDate,
                  periodLength: periodLength
                },
                timestamp: new Date().toISOString()
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        } catch (parseError) {
          console.error('Error parsing cycle tool call:', parseError);
        }
      }
    }
    
    const aiResponse = messageData?.content || "I'm having trouble responding. Please try again.";

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
