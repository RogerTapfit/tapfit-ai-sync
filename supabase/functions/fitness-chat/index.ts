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
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
    
    // Build comprehensive user metrics context
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
          
        // Fetch recent exercise logs
        const { data: recentExercises } = await supabase
          .from('exercise_logs')
          .select('exercise_name, machine_name, weight_used, reps_completed, sets_completed')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
          
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
          
        // Fetch sleep data
        const { data: sleepData } = await supabase
          .from('sleep_logs')
          .select('duration_minutes, quality_score, sleep_date')
          .eq('user_id', userId)
          .order('sleep_date', { ascending: false })
          .limit(3);
          
        // Fetch nutrition goals
        const { data: nutritionGoals } = await supabase
          .from('nutrition_goals')
          .select('daily_calories, protein_grams, carbs_grams, fat_grams, goal_type')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();
        
        userMetricsContext = `\n\nUSER METRICS & DATA:`;
        
        if (profile) {
          userMetricsContext += `\n- Profile: Goal: ${profile.primary_goal || 'Not set'}, Experience: ${profile.experience_level || 'Not set'}`;
          if (profile.weight_kg) userMetricsContext += `, Weight: ${profile.weight_kg}kg`;
          if (profile.height_cm) userMetricsContext += `, Height: ${profile.height_cm}cm`;
        }
        
        if (todayWorkouts?.length) {
          const totalCalories = todayWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
          const totalMinutes = todayWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
          userMetricsContext += `\n- Today's Workouts: ${todayWorkouts.length} session(s), ${totalMinutes} minutes, ${totalCalories} calories burned`;
          userMetricsContext += `\n  Workouts: ${todayWorkouts.map(w => w.workout_name).join(', ')}`;
        } else {
          userMetricsContext += `\n- Today's Workouts: None yet`;
        }
        
        if (recentExercises?.length) {
          userMetricsContext += `\n- Recent Exercises: ${recentExercises.slice(0, 5).map(e => `${e.exercise_name} (${e.weight_used || 0}lbs x ${e.reps_completed} reps)`).join(', ')}`;
        }
        
        if (hydration?.length) {
          const totalWater = hydration.reduce((sum, h) => sum + (h.amount_ml || 0), 0);
          const effectiveHydration = hydration.reduce((sum, h) => sum + (h.effective_hydration_ml || 0), 0);
          userMetricsContext += `\n- Today's Hydration: ${totalWater}ml total, ${effectiveHydration}ml effective`;
        } else {
          userMetricsContext += `\n- Today's Hydration: No water logged yet`;
        }
        
        if (nutrition?.length) {
          const totals = nutrition.reduce((acc, n) => ({
            calories: acc.calories + (n.total_calories || 0),
            protein: acc.protein + (n.total_protein || 0),
            carbs: acc.carbs + (n.total_carbs || 0),
            fat: acc.fat + (n.total_fat || 0)
          }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
          userMetricsContext += `\n- Today's Nutrition: ${totals.calories} cal, ${totals.protein}g protein, ${totals.carbs}g carbs, ${totals.fat}g fat`;
          userMetricsContext += ` (${nutrition.length} meals logged)`;
        } else {
          userMetricsContext += `\n- Today's Nutrition: No meals logged yet`;
        }
        
        if (nutritionGoals) {
          userMetricsContext += `\n- Daily Goals: ${nutritionGoals.daily_calories} cal, ${nutritionGoals.protein_grams}g protein (${nutritionGoals.goal_type})`;
        }
        
        if (sleepData?.length) {
          const lastSleep = sleepData[0];
          const hours = (lastSleep.duration_minutes / 60).toFixed(1);
          userMetricsContext += `\n- Last Sleep: ${hours} hours, Quality: ${lastSleep.quality_score}/5`;
        }
        
        userMetricsContext += `\n\nWhen the user asks about their data, refer to these specific metrics. Be conversational and helpful!`;
        
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
${injuryContext}${moodContext}${userMetricsContext}

Always provide practical, evidence-based fitness advice. Keep your responses brief and conversational - you're having a voice chat, not writing an essay. If you notice injury risks, imbalances, or low readiness in the user's data, proactively mention them and offer solutions. When users ask about their stats, workouts, hydration, or nutrition, use the provided user metrics data to give accurate answers.`;

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
