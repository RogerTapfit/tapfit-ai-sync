import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { preferences, machines } = await req.json();

    // Get user profile for age and weight considerations
    const authHeader = req.headers.get('authorization');
    let userProfile = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('weight_kg, gender, height_cm')
          .eq('id', user.id)
          .maybeSingle();
        userProfile = profile;
      }
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get available machines from database if not provided
    let availableMachines = machines;
    if (!availableMachines) {
      const { data: machinesData } = await supabase
        .from('machines')
        .select('name, type')
        .limit(20);
      availableMachines = machinesData || [];
    }

    const prompt = `Generate a personalized 5-day gym workout plan based on these preferences and equipment commonly found in 24 Hour Fitness gyms:

USER PROFILE:
${userProfile ? `
- Weight: ${userProfile.weight_kg ? `${userProfile.weight_kg}kg` : 'Not specified'}
- Height: ${userProfile.height_cm ? `${userProfile.height_cm}cm` : 'Not specified'}
- Gender: ${userProfile.gender || 'Not specified'}
` : '- Profile information not available'}

PREFERENCES:
- Fitness Goal: ${preferences.primary_goal}
- Experience Level: ${preferences.current_fitness_level}
- Workout Frequency: ${preferences.workout_frequency} days per week
- Session Duration: ${preferences.session_duration_preference} minutes
- Available Days: ${preferences.available_days.join(', ')}
- Preferred Times: ${preferences.preferred_time_slots.join(', ')}
- Target Muscle Groups: ${preferences.target_muscle_groups?.join(', ') || 'All muscle groups'}
- Available Equipment: ${preferences.available_equipment?.join(', ') || 'Standard gym equipment'}
- Equipment to Avoid: ${preferences.equipment_restrictions?.join(', ') || 'None'}
- Health Conditions: ${preferences.health_conditions?.join(', ') || 'None'}
- Preferred Workout Time: ${preferences.preferred_workout_time || 'Evening'}

WORKOUT PLAN STRUCTURE (Follow this Monday-Friday template):

Day 1 – Monday: Push Day (Chest, Shoulders, Triceps)
- Chest Press Machine
- Shoulder Press Machine  
- Cable Chest Fly
- Triceps Pushdown
- 10-min cardio (Incline Treadmill or Stairmaster)

Day 2 – Tuesday: Pull Day (Back, Biceps)
- Lat Pulldown
- Seated Row
- Cable Face Pulls
- Biceps Curl Machine
- 15-min cardio (Row Machine or AirBike)

Day 3 – Wednesday: Legs & Core
- Leg Press
- Leg Extension  
- Leg Curl
- Glute Kickback Machine
- Ab Crunch Machine
- 10-min Incline Walk

Day 4 – Thursday: Upper Body Mix + Core
- Smith Machine Incline Press
- Shoulder Press
- Cable Lateral Raises
- Seated Row
- Hanging Leg Raises / Ab Machine
- 15-min cardio

Day 5 – Friday: Glutes & Conditioning
- Stair Climber 10-min warm-up
- Glute Kickbacks
- Hip Abduction Machine
- Cable Glute Pull-through
- AirBike 20-min finisher

ADAPTATION RULES:
- If user selects fewer than 5 days, prioritize: Push, Pull, Legs (3 days) or add Upper Mix (4 days)
- Adjust sets/reps based on experience level: Beginner (2-3 sets, 12-15 reps), Intermediate (3-4 sets, 8-12 reps), Advanced (4-5 sets, 6-10 reps)
- Consider user's weight for resistance recommendations (lighter users start with lower weights)
- Match workout times to user's preferred time slots
- Avoid any equipment listed in restrictions
- Modify exercises for health conditions
- Focus on muscle groups selected by user

Return a valid JSON object with this exact structure:
{
  "workouts": [
    {
      "day": "monday",
      "time": "18:00",
      "muscle_group": "chest_shoulders_triceps",
      "duration": 60,
      "exercises": [
        {
          "machine": "Chest Press Machine",
          "sets": 3,
          "reps": 12,
          "rest_seconds": 60,
          "weight_guidance": "Start with 50% of your max, increase by 5lbs weekly",
          "order": 1
        }
      ]
    }
  ],
  "plan_name": "5-Day Gym Split Program",
  "notes": "Focus on progressive overload and proper form. Rest 48-72 hours between training same muscle groups."
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a certified personal trainer and fitness expert. Generate safe, effective workout plans based on user preferences and physical profile. Always return valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const aiData = await response.json();
    console.log('OpenAI response:', JSON.stringify(aiData, null, 2));
    
    if (!aiData.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', aiData);
      throw new Error('Invalid response from OpenAI - no content in response');
    }

    let workoutPlan;
    try {
      workoutPlan = JSON.parse(aiData.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiData.choices[0].message.content);
      throw new Error('Failed to parse workout plan from AI');
    }

    console.log('Generated workout plan:', JSON.stringify(workoutPlan, null, 2));

    return new Response(JSON.stringify(workoutPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generateWorkoutPlan function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate workout plan'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});