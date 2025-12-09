import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced weight calculation logic from service
interface UserWeightProfile {
  weight_kg: number;
  age: number;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  primary_goal: 'fat_loss' | 'muscle_building' | 'general_fitness' | 'strength_training';
  gender?: string;
  current_max_weights?: Record<string, number>;
}

// Base multipliers for weight calculations
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

// Exercise-specific modifiers (relative to bodyweight baseline)
const EXERCISE_MODIFIERS = {
  // Upper body exercises
  'chest_press': 0.8,
  'bench_press': 0.7,
  'shoulder_press': 0.5,
  'lat_pulldown': 0.6,
  'seated_row': 0.6,
  'bicep_curl': 0.2,
  'tricep_extension': 0.25,
  
  // Lower body exercises
  'leg_press': 1.5,
  'squat': 0.8,
  'leg_curl': 0.4,
  'leg_extension': 0.5,
  'calf_raise': 0.8,
  
  // Default for unlisted exercises
  'default': 0.6
} as const;

// Gender modifiers
const GENDER_MODIFIERS = {
  male: 1.0,
  female: 0.75,
  other: 0.85
} as const;

/**
 * Calculate optimal starting weight for an exercise
 */
function calculateOptimalWeight(
  userProfile: UserWeightProfile,
  exerciseName: string,
  machineName: string
): number {
  const {
    weight_kg,
    age,
    experience_level,
    primary_goal,
    gender = 'other',
    current_max_weights = {}
  } = userProfile;

  // Check if user has a recorded max for this exercise
  const maxWeightKey = `${machineName}_${exerciseName}`.toLowerCase().replace(/\s+/g, '_');
  if (current_max_weights[maxWeightKey]) {
    // Use percentage of max based on goal and experience
    const maxWeight = current_max_weights[maxWeightKey];
    const percentageOfMax = getPercentageOfMax(experience_level, primary_goal);
    return Math.round(maxWeight * percentageOfMax);
  }

  // Calculate base weight using formula
  const baseFactor = BASE_FACTORS[experience_level];
  const goalMultiplier = GOAL_MULTIPLIERS[primary_goal];
  const genderModifier = GENDER_MODIFIERS[gender as keyof typeof GENDER_MODIFIERS] || GENDER_MODIFIERS.other;
  
  // Age adjustment: decrease 1% for every year over 25, increase for under
  const ageAdjustment = (age - 25) * 0.01;
  const ageModifier = Math.max(0.5, 1 - ageAdjustment); // Minimum 50% modifier
  
  // Get exercise-specific modifier
  const exerciseKey = exerciseName.toLowerCase().replace(/\s+/g, '_');
  const exerciseModifier = EXERCISE_MODIFIERS[exerciseKey as keyof typeof EXERCISE_MODIFIERS] || EXERCISE_MODIFIERS.default;
  
  // Calculate final weight
  const baseWeight = weight_kg * baseFactor * goalMultiplier * genderModifier * ageModifier * exerciseModifier;
  
  // Round to nearest 5 lbs/2.5 kg and ensure minimum weight
  const roundedWeight = Math.round(baseWeight / 2.5) * 2.5;
  return Math.max(5, roundedWeight); // Minimum 5kg/10lbs
}

/**
 * Get percentage of max lift to use based on experience and goal
 */
function getPercentageOfMax(
  experience: 'beginner' | 'intermediate' | 'advanced',
  goal: 'fat_loss' | 'muscle_building' | 'general_fitness' | 'strength_training'
): number {
  const basePercentages = {
    beginner: 0.6,    // 60% of max
    intermediate: 0.7, // 70% of max
    advanced: 0.8     // 80% of max
  };

  const goalAdjustments = {
    fat_loss: -0.1,          // Lower intensity for fat loss
    muscle_building: 0,      // Standard intensity
    general_fitness: -0.05,  // Slightly lower intensity
    strength_training: 0.1   // Higher intensity for strength
  };

  const basePercentage = basePercentages[experience];
  const adjustment = goalAdjustments[goal];
  
  return Math.min(0.85, Math.max(0.5, basePercentage + adjustment));
}

/**
 * Calculate sets and reps based on user goal and experience
 */
function calculateSetsAndReps(
  goal: 'fat_loss' | 'muscle_building' | 'general_fitness' | 'strength_training',
  experience: 'beginner' | 'intermediate' | 'advanced',
  exerciseType: 'compound' | 'isolation' = 'compound'
): { sets: number; reps: number; rest_seconds: number } {
  const programs = {
    fat_loss: {
      beginner: { sets: 2, reps: 15, rest: 45 },
      intermediate: { sets: 3, reps: 12, rest: 60 },
      advanced: { sets: 4, reps: 10, rest: 45 }
    },
    muscle_building: {
      beginner: { sets: 3, reps: 10, rest: 60 },
      intermediate: { sets: 4, reps: 8, rest: 90 },
      advanced: { sets: 4, reps: 6, rest: 120 }
    },
    general_fitness: {
      beginner: { sets: 2, reps: 12, rest: 60 },
      intermediate: { sets: 3, reps: 10, rest: 75 },
      advanced: { sets: 3, reps: 8, rest: 90 }
    },
    strength_training: {
      beginner: { sets: 3, reps: 8, rest: 90 },
      intermediate: { sets: 4, reps: 5, rest: 180 },
      advanced: { sets: 5, reps: 3, rest: 240 }
    }
  };

  const baseProgram = programs[goal][experience];
  
  // Adjust for isolation exercises (typically higher reps, shorter rest)
  if (exerciseType === 'isolation') {
    return {
      sets: baseProgram.sets,
      reps: Math.min(20, baseProgram.reps + 3),
      rest_seconds: Math.max(30, baseProgram.rest - 15)
    };
  }

  return {
    sets: baseProgram.sets,
    reps: baseProgram.reps,
    rest_seconds: baseProgram.rest
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences } = await req.json();
    console.log('Received workout plan generation request:', preferences);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user info from authorization header
    const authorization = req.headers.get('authorization');
    if (!authorization) {
      throw new Error('No authorization header');
    }

    // Extract JWT token
    const token = authorization.replace('Bearer ', '');
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Get user profile for enhanced calculations
    let userProfile: UserWeightProfile | null = null;
    
    // Try to get calibration results first
    const { data: calibrationData } = await supabase
      .from('user_calibration_results')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get basic profile data
    const { data: profileData } = await supabase
      .from('profiles')
      .select('weight_kg, age, gender, experience_level, primary_goal')
      .eq('id', user.id)
      .single();

    if (profileData && calibrationData) {
      userProfile = {
        weight_kg: profileData.weight_kg || 70,
        age: profileData.age || 30,
        experience_level: calibrationData.fitness_assessment || preferences.current_fitness_level || 'beginner',
        primary_goal: preferences.primary_goal,
        gender: profileData.gender,
        current_max_weights: calibrationData.baseline_weights || {}
      };
    }

    // Get enhanced exercise database
    const { data: exerciseDatabase, error: exerciseError } = await supabase
      .from('exercise_database')
      .select('*')
      .eq('is_active', true);

    if (exerciseError) {
      console.error('Error fetching exercise database:', exerciseError);
    }

    const exercises = exerciseDatabase || [];

    // Get workout template based on fitness level and goal
    const { data: templateData } = await supabase
      .from('monthly_workout_templates')
      .select('*')
      .eq('fitness_level', preferences.current_fitness_level)
      .eq('primary_goal', preferences.primary_goal)
      .eq('is_active', true)
      .single();

    // Use OpenAI to generate comprehensive monthly workout plan
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Enhanced prompt for monthly workout generation with dynamic day themes
    const enhancedPrompt = `
Generate a comprehensive 30-day workout plan for a ${preferences.current_fitness_level} level person with the following details:

USER PROFILE:
- Fitness Level: ${preferences.current_fitness_level}
- Primary Goal: ${preferences.primary_goal}
- Workout Frequency: ${preferences.workout_frequency} days per week
- Session Duration: ${preferences.session_duration_preference} minutes
- Available Days: ${preferences.available_days.join(', ')}
- Preferred Time: ${preferences.preferred_time_slots?.[0] || 'flexible'}
- Target Muscle Groups: ${preferences.target_muscle_groups?.join(', ') || 'all major muscle groups'}
- Available Equipment: ${preferences.available_equipment?.join(', ') || 'gym machines and free weights'}
${userProfile ? `
- Weight: ${userProfile.weight_kg}kg
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Has Calibration Data: Yes (use provided baseline weights)
` : ''}

AVAILABLE EXERCISES:
${exercises.map(ex => `- ${ex.exercise_name} (${ex.machine_name || 'Bodyweight'}) - ${ex.muscle_groups.join(', ')} - ${ex.difficulty_level}`).join('\n')}

TEMPLATE GUIDELINES:
${templateData ? `Base Template: ${JSON.stringify(templateData.template_data)}
Week Structure: ${JSON.stringify(templateData.week_structure)}` : 'Use standard progression'}

=== MANDATORY WEEKLY STRUCTURE (DYNAMIC DAY THEMES) ===
Each week MUST follow this rotating structure with NAMED workout days:

DAY 1 - PUSH DAY (Chest + Triceps):
- Primary: Chest Press Machine, Incline Chest Press, Decline Chest Press
- Secondary: Pec Deck (Butterfly), Cable Crossover
- Triceps: Tricep Pushdown, Dip Machine, Tricep Extension
- Minimum 6 unique exercises from this list

DAY 2 - PULL DAY (Back + Biceps):
- Primary: Lat Pulldown Machine (wide grip), Seated Row Machine, Cable Row
- Secondary: T-Bar Row, Rear Delt Machine
- Biceps: Bicep Curl Machine, Preacher Curl, Cable Curl
- Minimum 6 unique exercises from this list

DAY 3 - CARDIO DAY (Running, Cycling, Swimming):
- Option A: Treadmill Running (intervals or steady-state, 30-45 min)
- Option B: Stationary Bike Cycling (HIIT or endurance, 30-45 min)
- Option C: Elliptical Machine (moderate intensity, 30-40 min)
- Option D: Swimming Laps (if pool available, 30-45 min)
- Option E: Rowing Machine (full body cardio, 20-30 min)
- Include warm-up and cool-down periods

DAY 4 - LEG DAY (Quads, Hamstrings, Glutes, Calves):
- Primary: Leg Press Machine, Squat Machine (Hack Squat/Smith)
- Quads: Leg Extension Machine
- Hamstrings: Leg Curl Machine (Seated or Lying)
- Calves: Calf Raise Machine
- Glutes: Hip Thrust, Glute Kickback Machine
- Minimum 6 unique exercises from this list

DAY 5 - SHOULDERS + CORE:
- Primary: Shoulder Press Machine, Lateral Raise Machine
- Secondary: Rear Delt Machine, Front Raise
- Core: Ab Crunch Machine, Cable Woodchops, Plank variations
- Minimum 6 unique exercises

DAY 6 - FULL BODY or ACTIVE RECOVERY:
- Light cardio (20-30 min walk/bike)
- Full body circuit with lighter weights
- OR Swimming/Yoga

DAY 7 - REST DAY

=== CARDIO EXERCISE OPTIONS TO INCLUDE ===
- Treadmill Running: Intervals (30 sec sprint/60 sec recovery), Incline Walking, Steady State
- Stationary Bike: HIIT Cycling, Hill Climbs, Endurance rides
- Elliptical: Fat burn mode, interval mode
- Swimming: Lap swimming freestyle, backstroke, breaststroke
- Rowing Machine: 500m intervals, 2000m time trials

CRITICAL VARIETY RULES:
1. Each workout day MUST have 6-8 UNIQUE exercises (NO DUPLICATES within the same day)
2. NEVER repeat the same machine/exercise more than once per day
3. Each muscle group day must include 4-5 DIFFERENT machines for that muscle group
4. Rotate exercises across the week - don't use the same machine on consecutive days
5. Mix machine types: compound movements (60%), isolation (30%), cardio warmup/finisher (10%)
6. Cardio days MUST include running, cycling, OR swimming - not just machine warmups

PROGRESSIVE VARIATION STRUCTURE:
- Week 1: Foundation exercises (60% intensity) - learn form
- Week 2: Add variety exercises (70% intensity) - build consistency
- Week 3: Increase intensity (80%) - progressive overload
- Week 4: Peak performance (85%) - test strength gains

REQUIREMENTS:
1. Create a TRUE 30-day plan (4 weeks + 2 bonus days) with progressive overload
2. Balance muscle groups across the week using the NAMED DAY THEMES above
3. Include 70% machines, 20% free weights, 10% cardio
4. Each workout MUST have 6-8 DIFFERENT exercises (NO duplicates in same workout)
5. Include at least 2 dedicated CARDIO DAYS per week with running/cycling/swimming
6. Progressive intensity: Week 1 (60%), Week 2 (70%), Week 3 (80%), Week 4 (85%)
7. Include specific weight recommendations when possible
8. Provide form instructions and progression notes
9. VALIDATE: Every workout must have unique exercises - reject if any duplicates found
10. Use descriptive muscle_group values: "chest", "back", "legs", "shoulders", "arms", "cardio", "full_body"

Return ONLY a JSON object with this exact structure (no other text):
{
  "plan_name": "30-Day [Level] [Goal] Plan",
  "total_days": 30,
  "workouts": [
    {
      "day": "monday",
      "time": "18:00",
      "muscle_group": "chest",
      "workout_theme": "Push Day",
      "duration": 60,
      "week_number": 1,
      "exercises": [
        {
          "machine": "Chest Press Machine",
          "exercise_name": "Chest Press",
          "type": "strength",
          "sets": 3,
          "reps": 12,
          "weight": 25,
          "weight_guidance": "Start with 25kg, increase by 2.5kg when you can complete all sets",
          "rest_seconds": 60,
          "order": 1,
          "form_instructions": "Keep back flat against pad, press smoothly without locking elbows"
        },
        {
          "machine": "Treadmill",
          "exercise_name": "Cardio Finisher",
          "type": "cardio",
          "duration_minutes": 12,
          "intensity": "moderate",
          "rest_seconds": 0,
          "order": 7
        }
      ]
    },
    {
      "day": "wednesday",
      "time": "18:00",
      "muscle_group": "cardio",
      "workout_theme": "Cardio Day",
      "duration": 45,
      "week_number": 1,
      "exercises": [
        {
          "machine": "Treadmill",
          "exercise_name": "Interval Running",
          "type": "cardio",
          "duration_minutes": 30,
          "intensity": "high",
          "rest_seconds": 0,
          "order": 1,
          "form_instructions": "Alternate 30 seconds sprint with 60 seconds recovery jog"
        },
        {
          "machine": "Stationary Bike",
          "exercise_name": "Cool Down Cycling",
          "type": "cardio",
          "duration_minutes": 10,
          "intensity": "low",
          "rest_seconds": 0,
          "order": 2
        }
      ]
    }
  ]
}`;

    console.log('Sending request to OpenAI with enhanced prompt...');

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
            content: 'You are a certified personal trainer and exercise physiologist specializing in creating personalized workout programs. Generate comprehensive, safe, and effective workout plans based on individual fitness assessments.'
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    let generatedContent = data.choices[0].message.content;
    console.log('Raw AI response:', generatedContent);
    
    // Validation function to ensure workout variety
    const validateWorkoutVariety = (workouts: any[]) => {
      console.log('Validating workout variety...');
      for (const workout of workouts) {
        const exercises = workout.exercises || [];
        const machineNames = exercises.map((e: any) => e.machine).filter(Boolean);
        const uniqueMachines = new Set(machineNames);
        
        // Check for duplicates
        if (uniqueMachines.size !== machineNames.length) {
          console.error(`❌ VALIDATION FAILED: Duplicate exercises in ${workout.muscle_group} - ${machineNames.length} exercises but only ${uniqueMachines.size} unique`);
          return false;
        }
        
        // Check minimum exercise count (excluding pure cardio)
        const nonCardioExercises = exercises.filter((e: any) => 
          e.type !== 'cardio' || e.exercise_name.toLowerCase().includes('warmup')
        );
        if (nonCardioExercises.length < 4) {
          console.error(`❌ VALIDATION FAILED: Too few exercises in ${workout.muscle_group} - only ${nonCardioExercises.length} found, need at least 4`);
          return false;
        }
        
        console.log(`✅ ${workout.muscle_group}: ${uniqueMachines.size} unique exercises`);
      }
      return true;
    };

    // Clean up the response to ensure it's valid JSON
    generatedContent = generatedContent.replace(/```json\n?/g, '').replace(/\n?```/g, '');
    generatedContent = generatedContent.trim();

    let workoutPlan;
    try {
      workoutPlan = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('AI response content:', generatedContent);
      throw new Error('Invalid AI response format');
    }

    // CRITICAL: Validate workout variety before proceeding
    if (workoutPlan.workouts && !validateWorkoutVariety(workoutPlan.workouts)) {
      console.error('❌ CRITICAL: AI generated plan lacks required variety');
      throw new Error('Workout plan validation failed - insufficient exercise variety. Please regenerate.');
    }
    
    console.log('✅ Workout plan passed variety validation');

    // Enhance the plan with precise weight calculations if user profile available
    if (userProfile && workoutPlan.workouts) {
      console.log('Enhancing workout plan with precise weight calculations...');
      
      workoutPlan.workouts = workoutPlan.workouts.map((workout: any) => {
        if (workout.exercises) {
          workout.exercises = workout.exercises.map((exercise: any) => {
            if (exercise.type === 'strength' && exercise.machine && exercise.exercise_name) {
              try {
                // Calculate precise weight recommendation
                const calculatedWeight = calculateOptimalWeight(
                  userProfile!,
                  exercise.exercise_name,
                  exercise.machine
                );
                
                // Calculate sets and reps based on goal and experience
                const setsAndReps = calculateSetsAndReps(
                  userProfile!.primary_goal,
                  userProfile!.experience_level,
                  exercise.type === 'compound' ? 'compound' : 'isolation'
                );
                
                // Apply week-specific intensity modifier
                const weekIntensity = workout.week_number ? 
                  (0.6 + (workout.week_number - 1) * 0.1) : 0.7;
                
                return {
                  ...exercise,
                  weight: Math.round(calculatedWeight * weekIntensity),
                  sets: setsAndReps.sets,
                  reps: setsAndReps.reps,
                  rest_seconds: setsAndReps.rest_seconds,
                  weight_guidance: `Recommended: ${Math.round(calculatedWeight * weekIntensity)}kg based on your calibration data`
                };
              } catch (error) {
                console.error('Error calculating weight for exercise:', exercise.exercise_name, error);
                return exercise; // Return original if calculation fails
              }
            }
            return exercise;
          });
        }
        return workout;
      });
    }

    console.log('Generated enhanced workout plan:', JSON.stringify(workoutPlan, null, 2));

    return new Response(JSON.stringify(workoutPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in generateWorkoutPlan function:', error);
    const errorMessage = error?.message || 'An unexpected error occurred';
    console.error('Error details:', error);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error?.stack || 'No stack trace available'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});