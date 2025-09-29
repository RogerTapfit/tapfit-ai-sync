import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface definitions
interface UserProfile {
  age?: number;
  sex?: 'male' | 'female';
  weight_kg?: number;
  height_cm?: number;
  HR_rest?: number;
  HR_max?: number;
  FTP_w?: number;
  vVO2max?: number;
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  health_conditions?: string[];
  previous_injuries?: string[];
}

interface SessionRequest {
  machine_id: string;
  machine_type: 'cardio' | 'strength';
  session_goal: 'endurance' | 'calories' | 'intervals' | 'recovery' | 'strength' | 'hypertrophy' | 'power';
  target_duration?: number; // minutes
  target_load?: number; // TRIMP points for cardio
  target_calories?: number;
  target_zone?: string; // HR zone band (e.g., Z2–Z3)
  current_fitness_level?: number; // 1-10 scale
}

interface WorkoutBlock {
  phase: string;
  time_min: number;
  zone?: string;
  intensity?: string;
  sets?: number;
  reps?: number;
  weight_percentage?: number;
  rest_seconds?: number;
  instructions?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userProfile, sessionRequest } = await req.json();
    
    if (!sessionRequest?.machine_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Machine ID is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating workout session for:', sessionRequest);

    const workoutPlan = await generateWorkoutPrescription(userProfile, sessionRequest);

    return new Response(JSON.stringify({
      success: true,
      workout: workoutPlan
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generateWorkoutSession function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Workout generation failed';
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      workout: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateWorkoutPrescription(userProfile: UserProfile, sessionRequest: SessionRequest) {
  const systemPrompt = `You are TapFit's advanced workout prescription engine. Generate precise, science-based workout plans using the provided machine and user data.

[CORE PRINCIPLES]
1. SAFETY FIRST: Always consider user's health conditions, injuries, and experience level
2. PROGRESSIVE OVERLOAD: Gradually increase intensity based on fitness level
3. SPECIFICITY: Match workout to stated goals (endurance, strength, etc.)
4. RECOVERY: Include appropriate rest periods and zones

[HEART RATE CALCULATIONS]
- HRR% = (HR_target - HR_rest) / (HR_max - HR_rest) * 100
- Zone 1: 50-60% HRR (Active Recovery)
- Zone 2: 60-70% HRR (Aerobic Base)
- Zone 3: 70-80% HRR (Tempo)
- Zone 4: 80-90% HRR (Lactate Threshold)
- Zone 5: 90-100% HRR (VO2 Max)

[TRIMP CALCULATION]
TRIMP = Duration(min) × Zone_Weight × Intensity_Factor
Zone weights: Z1=1, Z2=2, Z3=3, Z4=4, Z5=5

[STRENGTH CALCULATIONS]
- Beginner: Start at 60-70% estimated 1RM
- Intermediate: 70-85% 1RM
- Advanced: 85-95% 1RM
- Hypertrophy: 65-75% 1RM, 8-12 reps
- Power: 30-60% 1RM, 1-6 explosive reps

[MACHINE-SPECIFIC ADAPTATIONS]
Cardio machines: Focus on HR zones, TRIMP targets
Strength machines: Focus on load progression, rep schemes

Return ONLY a JSON object with this structure:
{
  "session_id": "generated_uuid",
  "machine_id": "string",
  "goal": "endurance|calories|intervals|strength|hypertrophy|power",
  "total_duration_min": 0,
  "estimated_calories": 0,
  "target_trimp": 0,
  "blocks": [
    {
      "phase": "warmup|main|cooldown",
      "time_min": 0,
      "zone": "Z1|Z2|Z3|Z4|Z5",
      "intensity": "string description",
      "sets": 0,
      "reps": 0,
      "weight_percentage": 0,
      "rest_seconds": 0,
      "instructions": "detailed guidance"
    }
  ],
  "adaptive_rules": ["string array of real-time adjustments"],
  "progression_notes": "how to progress next session",
  "safety_considerations": ["important safety notes"]
}`;

  const userPrompt = `Generate a personalized workout prescription:

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

SESSION REQUEST:
${JSON.stringify(sessionRequest, null, 2)}

Requirements:
1. Create appropriate blocks (warmup, main work, cooldown)
2. Calculate target heart rates if cardio
3. Determine loads and rep schemes if strength
4. Include safety considerations for this user
5. Provide progression guidance
6. Include real-time adaptive rules

Return only the JSON object as specified.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from AI model');
    }

    console.log('Generated workout prescription:', content);
    
    const workoutPlan = JSON.parse(content);
    
    // Add session ID if not provided
    if (!workoutPlan.session_id) {
      workoutPlan.session_id = crypto.randomUUID();
    }
    
    // Validate required fields
    if (!workoutPlan.blocks || !Array.isArray(workoutPlan.blocks)) {
      throw new Error('Invalid workout plan: missing blocks');
    }
    
    return workoutPlan;
    
  } catch (error) {
    console.error('Workout prescription generation failed:', error);
    
    // Fallback to basic template
    return generateFallbackWorkout(userProfile, sessionRequest);
  }
}

function generateFallbackWorkout(userProfile: UserProfile, sessionRequest: SessionRequest) {
  const sessionId = crypto.randomUUID();
  
  if (sessionRequest.machine_type === 'cardio') {
    const duration = sessionRequest.target_duration || 30;
    const isBeginnerLevel = (userProfile.experience_level === 'beginner' || !userProfile.experience_level);
    
    return {
      session_id: sessionId,
      machine_id: sessionRequest.machine_id,
      goal: sessionRequest.session_goal,
      total_duration_min: duration,
      estimated_calories: Math.round((userProfile.weight_kg || 70) * 0.5 * duration),
      target_trimp: Math.round(duration * (isBeginnerLevel ? 2 : 3)),
      blocks: [
        {
          phase: "warmup",
          time_min: 5,
          zone: "Z1",
          intensity: "Light, comfortable pace",
          instructions: "Gradually increase intensity to prepare body for exercise"
        },
        {
          phase: "main",
          time_min: duration - 10,
          zone: sessionRequest.session_goal === 'intervals' ? "Z4" : "Z2",
          intensity: sessionRequest.session_goal === 'intervals' ? "High intensity intervals" : "Steady aerobic pace",
          instructions: sessionRequest.session_goal === 'intervals' ? 
            "Alternate 2 minutes hard with 2 minutes easy" : 
            "Maintain steady, conversational pace"
        },
        {
          phase: "cooldown",
          time_min: 5,
          zone: "Z1",
          intensity: "Very light, recovery pace",
          instructions: "Gradually decrease intensity to aid recovery"
        }
      ],
      adaptive_rules: [
        "Adjust intensity if heart rate exceeds target zone by >5 bpm",
        "Reduce intensity if perceived exertion exceeds 8/10",
        "Stop if experiencing chest pain, dizziness, or unusual symptoms"
      ],
      progression_notes: "Increase duration by 2-3 minutes next week if workout feels comfortable",
      safety_considerations: userProfile.health_conditions || []
    };
  } else {
    // Strength training fallback
    const experienceMultiplier = userProfile.experience_level === 'beginner' ? 0.6 : 
                                 userProfile.experience_level === 'advanced' ? 0.8 : 0.7;
    
    return {
      session_id: sessionId,
      machine_id: sessionRequest.machine_id,
      goal: sessionRequest.session_goal,
      total_duration_min: 30,
      estimated_calories: Math.round((userProfile.weight_kg || 70) * 0.3 * 30),
      target_trimp: 0, // Not applicable for strength
      blocks: [
        {
          phase: "warmup",
          time_min: 5,
          sets: 1,
          reps: 10,
          weight_percentage: 0.4 * experienceMultiplier,
          rest_seconds: 60,
          instructions: "Light movement to prepare muscles and joints"
        },
        {
          phase: "main",
          time_min: 20,
          sets: 3,
          reps: sessionRequest.session_goal === 'hypertrophy' ? 10 : 8,
          weight_percentage: experienceMultiplier,
          rest_seconds: sessionRequest.session_goal === 'hypertrophy' ? 90 : 120,
          instructions: "Focus on controlled movement and proper form"
        },
        {
          phase: "cooldown",
          time_min: 5,
          instructions: "Light stretching and mobility work"
        }
      ],
      adaptive_rules: [
        "Reduce weight if unable to complete all reps with proper form",
        "Rest longer between sets if needed to maintain form",
        "Stop if experiencing joint pain or muscle strain"
      ],
      progression_notes: "Increase weight by 2.5-5% when all sets completed with good form",
      safety_considerations: userProfile.previous_injuries || []
    };
  }
}