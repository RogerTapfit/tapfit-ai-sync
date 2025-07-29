import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Weight calculation logic (embedded for edge function)
interface UserWeightProfile {
  weight_kg: number;
  age: number;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  primary_goal: 'fat_loss' | 'muscle_building' | 'general_fitness' | 'strength_training';
  gender?: string;
  current_max_weights?: Record<string, number>;
}

const BASE_FACTORS = {
  beginner: 0.15,
  intermediate: 0.3,
  advanced: 0.5
} as const;

const GOAL_MULTIPLIERS = {
  fat_loss: 0.9,
  muscle_building: 1.1,
  general_fitness: 1.0,
  strength_training: 1.25
} as const;

const EXERCISE_MODIFIERS = {
  'chest_press': 0.8, 'bench_press': 0.7, 'shoulder_press': 0.5,
  'lat_pulldown': 0.6, 'seated_row': 0.6, 'bicep_curl': 0.2,
  'tricep_extension': 0.25, 'leg_press': 1.5, 'squat': 0.8,
  'leg_curl': 0.4, 'leg_extension': 0.5, 'calf_raise': 0.8,
  'default': 0.6
} as const;

const GENDER_MODIFIERS = {
  male: 1.0, female: 0.75, other: 0.85
} as const;

function calculateOptimalWeight(userProfile: UserWeightProfile, exerciseName: string, machineName: string): number {
  const { weight_kg, age, experience_level, primary_goal, gender = 'other', current_max_weights = {} } = userProfile;
  
  // Calculate base weight using formula
  const baseFactor = BASE_FACTORS[experience_level];
  const goalMultiplier = GOAL_MULTIPLIERS[primary_goal];
  const genderModifier = GENDER_MODIFIERS[gender as keyof typeof GENDER_MODIFIERS] || GENDER_MODIFIERS.other;
  
  const ageAdjustment = (age - 25) * 0.01;
  const ageModifier = Math.max(0.5, 1 - ageAdjustment);
  
  const exerciseKey = exerciseName.toLowerCase().replace(/\s+/g, '_');
  const exerciseModifier = EXERCISE_MODIFIERS[exerciseKey as keyof typeof EXERCISE_MODIFIERS] || EXERCISE_MODIFIERS.default;
  
  const baseWeight = weight_kg * baseFactor * goalMultiplier * genderModifier * ageModifier * exerciseModifier;
  const roundedWeight = Math.round(baseWeight / 2.5) * 2.5;
  return Math.max(5, roundedWeight);
}

function calculateSetsAndReps(goal: string, experience: string): { sets: number; reps: number; rest_seconds: number } {
  const programs = {
    fat_loss: { beginner: { sets: 2, reps: 15, rest: 45 }, intermediate: { sets: 3, reps: 12, rest: 60 }, advanced: { sets: 4, reps: 10, rest: 45 } },
    muscle_building: { beginner: { sets: 3, reps: 10, rest: 60 }, intermediate: { sets: 4, reps: 8, rest: 90 }, advanced: { sets: 4, reps: 6, rest: 120 } },
    general_fitness: { beginner: { sets: 2, reps: 12, rest: 60 }, intermediate: { sets: 3, reps: 10, rest: 75 }, advanced: { sets: 3, reps: 8, rest: 90 } },
    strength_training: { beginner: { sets: 3, reps: 8, rest: 90 }, intermediate: { sets: 4, reps: 5, rest: 180 }, advanced: { sets: 5, reps: 3, rest: 240 } }
  };

  const goalKey = goal as keyof typeof programs;
  const expKey = experience as keyof typeof programs[typeof goalKey];
  return programs[goalKey]?.[expKey] || { sets: 3, reps: 10, rest: 60 };
}

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
          .select('weight_kg, gender, height_cm, age, experience_level, primary_goal, current_max_weights')
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
      let content = aiData.choices[0].message.content;
      
      // Strip markdown code blocks if present
      if (content.includes('```json')) {
        content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\s*/g, '').replace(/```\s*$/g, '');
      }
      
      // Trim any extra whitespace
      content = content.trim();
      
      console.log('Cleaned content for parsing:', content);
      workoutPlan = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiData.choices[0].message.content);
      console.error('Parse error details:', parseError.message);
      throw new Error('Failed to parse workout plan from AI');
    }

    // Enhance workout plan with calculated weights if user profile available
    if (userProfile && userProfile.weight_kg && userProfile.age && userProfile.experience_level && userProfile.primary_goal) {
      const weightProfile: UserWeightProfile = {
        weight_kg: userProfile.weight_kg,
        age: userProfile.age,
        experience_level: userProfile.experience_level,
        primary_goal: userProfile.primary_goal,
        gender: userProfile.gender,
        current_max_weights: userProfile.current_max_weights || {}
      };

      workoutPlan.workouts.forEach((workout: any) => {
        workout.exercises.forEach((exercise: any) => {
          // Calculate optimal weight and sets/reps
          const calculatedWeight = calculateOptimalWeight(weightProfile, exercise.machine, exercise.machine);
          const setsReps = calculateSetsAndReps(userProfile.primary_goal, userProfile.experience_level);
          
          // Update exercise with calculated values
          exercise.calculated_weight = calculatedWeight;
          exercise.sets = setsReps.sets;
          exercise.reps = setsReps.reps;
          exercise.rest_seconds = setsReps.rest_seconds;
          exercise.weight_guidance = `Start with ${calculatedWeight}kg, increase by 5% weekly based on performance`;
        });
      });
    }

    console.log('Enhanced workout plan:', JSON.stringify(workoutPlan, null, 2));

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