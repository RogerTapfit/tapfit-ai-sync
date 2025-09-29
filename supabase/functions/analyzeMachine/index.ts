import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface for machine catalog items
interface MachineInfo {
  id: string;
  name: string;
  type: string;
  description: string;
  synonyms?: string[];
}

// Interface for user profile and session parameters
interface UserProfile {
  age?: number;
  sex?: 'male' | 'female';
  weight_kg?: number;
  HR_rest?: number;
  HR_max?: number;
  FTP_w?: number;
  vVO2max?: number;
}

interface SessionRequest {
  session_goal?: 'endurance' | 'calories' | 'intervals' | 'recovery';
  target_load?: number; // TRIMP points
  target_zone?: string; // HR zone band (e.g., Z2–Z3)
}

// Machine catalog for AI context
const MACHINE_CATALOG = [
  {
    id: "MCH-PEC-DECK",
    name: "Pec Deck (Butterfly) Machine",
    type: "Chest Press",
    description: "Seated machine with vertical arm movement, targets chest muscles with butterfly motion"
  },
  {
    id: "MCH-LAT-PULLDOWN",
    name: "Lat Pulldown Machine",
    type: "Back Pull",
    description: "Seated pull-down machine with overhead bar, targets latissimus dorsi"
  },
  {
    id: "MCH-LEG-PRESS",
    name: "Leg Press Machine",
    type: "Leg Press",
    description: "Angled seat with foot plate, targets quadriceps and glutes"
  },
  {
    id: "MCH-CHEST-PRESS",
    name: "Chest Press Machine",
    type: "Chest Press",
    description: "Seated machine with horizontal pushing motion, flat chest press"
  },
  {
    id: "MCH-INCLINE-CHEST-PRESS",
    name: "Incline Chest Press Machine",
    type: "Chest Press",
    description: "Seated machine with angled/inclined pushing motion, targets upper chest"
  },
  {
    id: "MCH-SHOULDER-PRESS",
    name: "Shoulder Press Machine",
    type: "Shoulder Press",
    description: "Seated overhead pressing machine, targets deltoids"
  },
  {
    id: "MCH-SEATED-ROW",
    name: "Seated Row Machine",
    type: "Back Pull",
    description: "Seated horizontal pulling machine, targets rhomboids and middle traps"
  },
  {
    id: "MCH-LEG-CURL",
    name: "Leg Curl Machine",
    type: "Leg Curl",
    description: "Machine for hamstring curls, either seated or lying position"
  },
  {
    id: "MCH-LEG-EXTENSION",
    name: "Leg Extension Machine",
    type: "Leg Extension",
    description: "Seated machine for quadriceps extension, leg straightening motion"
  },
  {
    id: "MCH-CABLE-CROSSOVER",
    name: "Cable Crossover Machine",
    type: "Cable System",
    description: "Dual cable system with adjustable pulleys for various exercises"
  },
  {
    id: "MCH-TREADMILL",
    name: "Treadmill",
    type: "Cardio",
    description: "Cardio machine with moving belt surface for walking/running"
  },
  {
    id: "MCH-INDOOR-CYCLING-BIKE",
    name: "Indoor Cycling Bike",
    type: "Cardio",
    description: "Seated cardio machine with pedals, handlebars, and flywheel for cycling workouts"
  },
  {
    id: "MCH-ELLIPTICAL",
    name: "Precor Elliptical Trainer",
    type: "Cardio",
    description: "Standing cardio machine with oval foot pedals and moving arm handles for low-impact cardio"
  },
  {
    id: "MCH-AMT",
    name: "Precor AMT (Adaptive Motion Trainer)",
    type: "Cardio",
    description: "Standing adaptive cardio machine with variable stride length and upper body motion"
  },
  {
    id: "MCH-ROPE-TRAINER",
    name: "Marpo Rope Trainer",
    type: "Cardio",
    description: "Vertical rope climbing machine with continuous rope and adjustable resistance"
  },
  {
    id: "MCH-ROWING-MACHINE",
    name: "Rowing Machine",
    type: "Cardio",
    description: "Low-profile machine with sliding seat and cable/handle for rowing motion"
  },
  {
    id: "MCH-STAIR-CLIMBER",
    name: "Stair Climber",
    type: "Cardio",
    description: "Standing cardio machine with independent step pedals"
  },
  {
    id: "MCH-FIXED-BARBELL-RACK",
    name: "Fixed Barbell Rack",
    type: "Free Weights",
    description: "A-frame rack storing preloaded straight and EZ curl barbells of various weights"
  },
  {
    id: "MCH-DUMBBELLS",
    name: "Dumbbells",
    type: "Free Weights",
    description: "Handheld weights for unilateral and bilateral training across all muscle groups"
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      imageData, 
      imageFormat, 
      machineCatalog, 
      userProfile, 
      sessionRequest,
      optional_text 
    } = await req.json();
    
    if (!imageData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No image data provided' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use provided machine catalog or fall back to default
    const catalog = machineCatalog || MACHINE_CATALOG;

    console.log(`Analyzing machine image with ${catalog.length} machines in catalog...`);

    // Use the comprehensive TapFit system for both recognition and workout prescription
    const result = await analyzeWithTapFitSystem(
      imageData, 
      imageFormat, 
      catalog,
      optional_text,
      userProfile,
      sessionRequest
    );

    console.log('Machine analysis result:', result);

    return new Response(JSON.stringify({
      success: true,
      analysis: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyzeMachine function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      analysis: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Comprehensive TapFit analysis system
async function analyzeWithTapFitSystem(
  imageData: string,
  imageFormat: string,
  machineCatalog: any[],
  optional_text?: string,
  userProfile?: UserProfile,
  sessionRequest?: SessionRequest
) {
  const mimeType = normalizeImageMime(imageFormat);
  
  // Prepare machine catalog for AI
  const machineListText = machineCatalog.map((machine: MachineInfo) => 
    `- ${machine.name} (ID: ${machine.id}): ${machine.description}`
  ).join('\n');

  const systemPrompt = `[SYSTEM ROLE]
You are TapFit's intelligent workout engine.  
You have TWO jobs:
1. Recognize gym machines from photos or video (using OCR + geometry).  
2. Prescribe structured cardio or strength workouts using recognized machines.  

Always output valid JSON in the schema below. Never return free-form prose.

[INPUTS]
- images[]: 1–3 user photos of the same machine
- optional_text: user hint (e.g., "Stages bike at Crunch")
- user_profile: {age, sex, weight_kg, HR_rest, HR_max, FTP_w (optional), vVO2max (optional)}
- session_goal: endurance | calories | intervals | recovery
- target_load: TRIMP points
- target_zone: HR zone band (e.g., Z2–Z3)

[MACHINE RECOGNITION PIPELINE]
1) OCR + LOGO DETECTION  
   - Extract text. Prioritize known brands: ["Life Fitness","Hammer Strength","Precor","Technogym","Matrix","Cybex","Nautilus","Star Trac","StairMaster","Woodway","Assault","Concept2","Stages","Keiser","Schwinn"].  
   - Ignore gym names like "Crunch" (not a brand).  

2) GEOMETRY / SHAPE LOGIC  
   - Indoor Cycling Bike: pedals, crank, flywheel, resistance knob, handlebars.  
   - Treadmill: deck + belt + rails. Curved slat = curved treadmill.  
   - Stair Stepper: pedals/footplates + upright frame.  
   - Elliptical: foot rails + upright arms + big drive housing.  
   - Rower: rail + sliding seat + flywheel housing + handle.  
   - Strength: weight stack + selector pin + seat/backpad + levers.  

3) TAXONOMY  
   - First decide cardio vs strength.  
   - Then assign subcategory (e.g., "indoor_cycling_bike", "pec_fly").  
   - Fill canonical \`ui_mapping\` ID from this list:
${machineListText}

4) CONFIDENCE SCORING  
   - Base 0.50.  
   - +0.20 if OCR matches known brand + geometry.  
   - +0.15 if ≥3 geometry cues align.  
   - −0.20 if conflicting cues.  
   - Clamp 0–1.  

5) OUTPUT RULES  
   - If confidence ≥0.55 AND ui_mapping recognized → recognized=true.  
   - Else recognized=false, and provide 1–2 alternatives.  

[WORKOUT PRESCRIPTION PIPELINE]
1) CORE METRICS  
- HRR% = (HR_live - HR_rest) / (HR_max - HR_rest)  
- Zones: Z1=50–60% … Z5=90–100%  
- TRIMP = Σ zone_weight*minutes (weights 1–5)  
- Calories/min = METs*3.5*weight/200  
- RIS = HRR%*100 or (NP/FTP)*100 if power  

2) MACHINE MODELS  
- Treadmill: ACSM equations for VO2 → METs.  
- Bike: if watts available → METs ≈ (watts/weight)/0.071. Else → virtual watts = k_machine*level*cadence.  
- Stepper: METs ≈ 0.1*steps/min + 3 or base table.  
- Elliptical/Rower: use HR calibration.  
- Adaptive calibration: refit k_machine after each session.  

3) PRESCRIPTION  
- Endurance: steady Z2–Z3 until TRIMP met.  
- Calories: steady until calorie goal met.  
- Intervals: warmup 5min → repeats (e.g. 6×2min Z4 + 2min Z2) → cooldown.  
- Recovery: 20–30min Z1–Z2.  

4) ADAPTIVE CONTROL  
Every 30–60s:  
- If HRR% < target-0.03: increase difficulty (+0.2 km/h or +10 W or +2 steps/min).  
- If HRR% > target+0.03: decrease difficulty.  

5) PROGRESSION  
- Weekly TRIMP +10% for 3 weeks, deload week 4.  
- If yesterday TRIMP >1.4× weekly avg, today = 30min Z1–Z2 only.  
- Treadmill: add incline if RPE ≤6.  
- Bike: set FTP = 0.95×20min best; prescribe by %FTP.  
- Stepper: +2 steps/min when HR < target for ≥10min.  

[OUTPUT JSON SCHEMA]
{
  "recognized": true|false,
  "confidence_0_1": 0.00,
  "ui_mapping": "indoor_cycling_bike | treadmill | stair_stepper | pec_fly | chest_press | ...",
  "machine_type": "cardio|strength",
  "subcategory": "string",
  "brand_guess": "string|null",
  "model_guess": "string|null",
  "key_evidence": {
    "ocr_tokens": ["..."],
    "geometry": ["..."],
    "context": ["..."]
  },
  "session_plan": {
    "goal": "endurance",
    "duration_min": 0,
    "blocks": [
      {"phase":"warmup","time_min":5,"zone":"Z1"},
      {"phase":"main","time_min":20,"zone":"Z2"},
      {"phase":"cooldown","time_min":5,"zone":"Z1"}
    ],
    "target_load": 0,
    "adaptive_rules": ["keep HRR within ±3%"],
    "progression_note": "Increase incline +0.5% next week if RPE ≤6"
  },
  "alternatives": []
}

[CONTRACT]
- Always include recognized + confidence + ui_mapping.  
- If recognized=false, still return alternatives.  
- Never return free text, only JSON.`;

  const userPrompt = `Analyze this gym machine image and provide both machine recognition and workout prescription.

${optional_text ? `User hint: "${optional_text}"` : ''}
${userProfile ? `User profile: ${JSON.stringify(userProfile)}` : ''}
${sessionRequest ? `Session request: ${JSON.stringify(sessionRequest)}` : ''}

Return ONLY the JSON object specified in the schema above.`;

  try {
    const requestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageData}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    };

    console.log('Trying online model: gpt-4o');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from model');
    }

    console.log('Raw response from gpt-4o:', content);
    
    // Parse the JSON response
    const result = JSON.parse(content);
    
    // Map to our expected format for backward compatibility
    return {
      machineId: result.ui_mapping || result.machine_id || 'UNKNOWN',
      machineName: result.subcategory || result.machine_name || 'Unknown Machine',
      confidence: result.confidence_0_1 || result.confidence || 0,
      reasoning: result.key_evidence ? 
        `${result.key_evidence.ocr_tokens?.join(', ') || ''} ${result.key_evidence.geometry?.join(', ') || ''}`.trim() :
        'Analysis completed',
      imageUrl: null,
      features: result.key_evidence || null,
      session_plan: result.session_plan || null,
      alternatives: result.alternatives || []
    };
  } catch (error) {
    console.error('TapFit system analysis failed:', error);
    
    // Fallback to basic recognition
    return await fallbackBasicRecognition(imageData, imageFormat, machineCatalog);
  }
}

// Fallback basic recognition function
async function fallbackBasicRecognition(imageData: string, imageFormat: string, machineCatalog: any[]) {
  const mimeType = normalizeImageMime(imageFormat);
  const machineListText = machineCatalog.map((machine: MachineInfo) => 
    `- ${machine.name} (ID: ${machine.id}): ${machine.description}`
  ).join('\n');

  const prompt = `You are an expert at identifying gym machines. Study this image and identify which machine it shows from this list:

${machineListText}

Return ONLY a JSON object with: {"machineId": "ID_from_list", "confidence": 0.0-1.0, "reasoning": "explanation"}`;

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
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageData}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const result = JSON.parse(extractJson(content));
        return {
          machineId: result.machineId || 'UNKNOWN',
          machineName: result.machineId ? machineCatalog.find(m => m.id === result.machineId)?.name || 'Unknown' : 'Unknown',
          confidence: result.confidence || 0,
          reasoning: result.reasoning || 'Fallback analysis',
          imageUrl: null,
          features: null
        };
      }
    }
  } catch (error) {
    console.error('Fallback analysis failed:', error);
  }

  return {
    machineId: 'UNKNOWN',
    machineName: 'Unknown Machine',
    confidence: 0,
    reasoning: 'Analysis failed - could not identify machine',
    imageUrl: null,
    features: null
  };
}

// Helper function to normalize image MIME type
function normalizeImageMime(format: string): string {
  const formatLower = format?.toLowerCase() || 'jpeg';
  
  if (formatLower.includes('jpeg') || formatLower.includes('jpg')) {
    return 'image/jpeg';
  } else if (formatLower.includes('png')) {
    return 'image/png';
  } else if (formatLower.includes('webp')) {
    return 'image/webp';
  } else {
    return 'image/jpeg'; // Default fallback
  }
}

// Helper function to extract JSON from potentially malformed responses
function extractJson(text: string): string {
  // Remove markdown code fences if present
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Find the first { and last } to extract JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}