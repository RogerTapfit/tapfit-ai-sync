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

    const prompt = `Generate a personalized weekly workout plan based on these preferences:

Fitness Goal: ${preferences.primary_goal}
Fitness Level: ${preferences.current_fitness_level}
Workout Frequency: ${preferences.workout_frequency} times per week
Session Duration: ${preferences.session_duration_preference} minutes
Available Days: ${preferences.available_days.join(', ')}
Preferred Times: ${preferences.preferred_time_slots.join(', ')}
Equipment Restrictions: ${preferences.equipment_restrictions?.join(', ') || 'None'}
Health Conditions: ${preferences.health_conditions?.join(', ') || 'None'}

Available Machines: ${availableMachines.map(m => `${m.name} (${m.type})`).join(', ')}

Create a structured workout plan with:
1. Weekly schedule matching preferred days/times
2. Targeted muscle groups for each session
3. Specific exercises using available machines
4. Sets, reps, and rest periods appropriate for the goal and fitness level
5. Progressive overload recommendations

Return the response as a valid JSON object with this structure:
{
  "workouts": [
    {
      "day": "monday",
      "time": "18:00",
      "muscle_group": "chest_triceps",
      "duration": 45,
      "exercises": [
        {
          "machine": "Chest Press",
          "sets": 3,
          "reps": 12,
          "rest_seconds": 60,
          "weight_guidance": "Start with 50% of your max, increase by 5lbs weekly",
          "order": 1
        }
      ]
    }
  ],
  "plan_name": "4-Week Muscle Building Plan",
  "notes": "Focus on progressive overload..."
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
            content: 'You are a certified personal trainer and fitness expert. Generate safe, effective workout plans based on user preferences. Always return valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    
    if (!aiData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
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