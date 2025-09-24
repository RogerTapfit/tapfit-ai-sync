import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user data for analysis
    const [profileResult, workoutData, powerLevelData, weightProgressions] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('smart_pin_data')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false }),
      supabase.from('power_level_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('weight_progressions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const profile = profileResult.data;
    const workouts = workoutData.data || [];
    const powerHistory = powerLevelData.data || [];
    const progressions = weightProgressions.data || [];

    // Analyze data and create context for AI
    const analysisData = {
      totalWorkouts: workouts.length,
      workoutFrequency: workouts.length > 0 ? Math.round(workouts.length / 4) : 0, // per week
      recentWorkouts: workouts.slice(0, 7),
      powerLevelTrend: powerHistory.length > 1 ? 
        powerHistory[0]?.score - powerHistory[powerHistory.length - 1]?.score : 0,
      currentPowerLevel: powerHistory[0]?.score || 0,
      recentProgressions: progressions.slice(0, 3),
      daysSinceLastWorkout: workouts.length > 0 ? 
        Math.floor((Date.now() - new Date(workouts[0].created_at).getTime()) / (1000 * 60 * 60 * 24)) : null
    };

    // Create AI prompt for generating insights
    const systemPrompt = `You are an AI fitness coach analyzing workout data to provide personalized insights. 
    Generate exactly 4 short, actionable insights based on the user's data. Each insight should be 1-2 sentences max.
    Focus on: strength progression, workout consistency, recovery patterns, and specific recommendations.
    
    User Data Analysis:
    - Total workouts in last 30 days: ${analysisData.totalWorkouts}
    - Average workouts per week: ${analysisData.workoutFrequency}
    - Current power level: ${analysisData.currentPowerLevel}
    - Power level trend: ${analysisData.powerLevelTrend > 0 ? `+${analysisData.powerLevelTrend} (improving)` : analysisData.powerLevelTrend < 0 ? `${analysisData.powerLevelTrend} (declining)` : 'stable'}
    - Days since last workout: ${analysisData.daysSinceLastWorkout || 'N/A'}
    - Recent weight progressions: ${progressions.length > 0 ? 'Yes' : 'None'}
    
    Return ONLY a JSON array of 4 insight objects with format: [{"text": "insight text", "type": "positive|warning|neutral"}]`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate personalized fitness insights for this user.' }
        ],
        temperature: 0.7,
      }),
    });

    const aiResponse = await response.json();
    let insights;

    try {
      insights = JSON.parse(aiResponse.choices[0].message.content);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Fallback insights based on data analysis
      insights = generateFallbackInsights(analysisData);
    }

    return new Response(JSON.stringify({ 
      insights,
      timestamp: new Date().toISOString(),
      dataPoints: {
        workouts: analysisData.totalWorkouts,
        powerLevel: analysisData.currentPowerLevel,
        trend: analysisData.powerLevelTrend
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackInsights(data: any) {
  const insights = [];
  
  if (data.totalWorkouts > 12) {
    insights.push({ text: "Excellent consistency! You're averaging " + data.workoutFrequency + " workouts per week.", type: "positive" });
  } else if (data.totalWorkouts > 4) {
    insights.push({ text: "Good progress! Try to increase frequency for faster results.", type: "neutral" });
  } else {
    insights.push({ text: "Let's build momentum! Aim for 3-4 workouts per week.", type: "warning" });
  }
  
  if (data.powerLevelTrend > 10) {
    insights.push({ text: "Power level rising fast! Your training intensity is paying off.", type: "positive" });
  } else if (data.powerLevelTrend < -10) {
    insights.push({ text: "Power level declining. Consider adjusting your training approach.", type: "warning" });
  } else {
    insights.push({ text: "Steady power level. Focus on progressive overload for growth.", type: "neutral" });
  }
  
  if (data.daysSinceLastWorkout > 3) {
    insights.push({ text: "It's been " + data.daysSinceLastWorkout + " days since your last workout. Time to get back in there!", type: "warning" });
  } else if (data.daysSinceLastWorkout === 0) {
    insights.push({ text: "Great job working out today! Remember to prioritize recovery.", type: "positive" });
  } else {
    insights.push({ text: "Good timing for your next workout. Your body has had time to recover.", type: "neutral" });
  }
  
  if (data.recentProgressions.length > 0) {
    insights.push({ text: "Recent weight increases detected! Progressive overload is working.", type: "positive" });
  } else {
    insights.push({ text: "No recent weight progressions. Consider increasing resistance gradually.", type: "neutral" });
  }
  
  return insights.slice(0, 4);
}