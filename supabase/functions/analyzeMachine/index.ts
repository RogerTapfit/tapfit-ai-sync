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
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, imageFormat, machineCatalog } = await req.json();
    
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
    const MACHINE_CATALOG = machineCatalog || [
      { id: 'MCH-CHEST-PRESS', name: 'Chest Press Machine', type: 'Chest Press', description: 'Machine with HANDLES/GRIPS that you grasp with your hands for horizontal pressing motion. Has a slightly reclined seat and weight stack. NO arm pads or elbow rests - you grip handles with your hands.' },
      { id: 'MCH-PEC-DECK', name: 'Pec Deck (Butterfly) Machine', type: 'Pec Deck', description: 'Machine with ARM PADS or ELBOW PADS that you rest your arms/elbows against. Arms swing together in a butterfly motion. NO handles to grip - your arms rest against pads that move inward.' },
      { id: 'MCH-INCLINE-CHEST-PRESS', name: 'Incline Chest Press Machine', type: 'Incline Press', description: 'Machine with handles for pressing at an upward angle. Seat back is significantly inclined (30-45 degrees). Pressing motion goes up and forward, not horizontal.' },
      { id: 'MCH-LAT-PULLDOWN', name: 'Lat Pulldown Machine', type: 'Lat Pulldown', description: 'Seated machine with overhead cable system and wide bar that pulls down to chest level. Has knee pads to secure legs.' },
      { id: 'MCH-SEATED-ROW', name: 'Seated Row Machine', type: 'Seated Row', description: 'Seated machine with horizontal pulling motion. Has chest pad for support and handles/cable system for pulling toward torso.' },
      { id: 'MCH-LEG-PRESS', name: 'Leg Press Machine', type: 'Leg Press', description: 'Angled machine with large foot platform for leg pressing. User sits with back support and pushes platform with feet.' },
      { id: 'MCH-LEG-EXTENSION', name: 'Leg Extension Machine', type: 'Leg Extension', description: 'Seated machine with padded lever that extends legs upward for quadriceps isolation. Ankle pad pushes legs up.' },
      { id: 'MCH-SHOULDER-PRESS', name: 'Shoulder Press Machine', type: 'Shoulder Press', description: 'Machine with handles positioned at or above shoulder level for vertical/overhead pressing. Seat back is upright (near 90 degrees). Motion is straight up, not horizontal.' },
      { id: 'MCH-TREADMILL', name: 'Treadmill', type: 'Cardio', description: 'Cardio machine with moving belt surface for walking/running. Has handrails and control panel display.' },
      { id: 'MCH-ELLIPTICAL', name: 'Elliptical Machine', type: 'Cardio', description: 'Standing cardio machine with oval foot pedals that move in elliptical motion. Has moving arm handles.' },
      { id: 'MCH-STATIONARY-BIKE', name: 'Stationary Bike', type: 'Cardio', description: 'Seated cardio machine with pedals and handlebars. Has adjustable seat and resistance controls.' },
      { id: 'MCH-ROWING-MACHINE', name: 'Rowing Machine', type: 'Cardio', description: 'Low-profile machine with sliding seat and cable/handle for rowing motion. User sits and pulls handle toward torso.' },
      { id: 'MCH-STAIR-CLIMBER', name: 'Stair Climber', type: 'Cardio', description: 'Standing cardio machine with independent step pedals that move up and down alternately.' },
      { id: 'MCH-BENCH-PRESS', name: 'Bench Press (Barbell Station)', type: 'Bench Press', description: 'Free weight station with barbell on J-hooks/rack. Has adjustable bench but NO weight stack, cables, or guided rails.' },
      { id: 'MCH-SMITH-MACHINE', name: 'Smith Machine', type: 'Smith Machine', description: 'Barbell fixed on vertical rails with safety stops. Bar moves only up and down in guided linear path.' }
    ];

    // Two-pass analysis for confused machines
    const confusedMachines = ['MCH-CHEST-PRESS', 'MCH-PEC-DECK', 'MCH-INCLINE-CHEST-PRESS', 'MCH-SHOULDER-PRESS'];
    let firstPassResult = await analyzeWithModel(imageData, imageFormat, MACHINE_CATALOG);
    let features = null;
    
    // If first pass identifies a commonly confused machine, do feature validation
    if (firstPassResult && confusedMachines.includes(firstPassResult.machineId)) {
      console.log('Running second-pass feature analysis for:', firstPassResult.machineId);
      features = await analyzeFeatures(imageData, imageFormat);
      
      // Apply guardrails
      if (features) {
        const validatedResult = applyFeatureGuardrails(firstPassResult, features);
        if (validatedResult) {
          firstPassResult = validatedResult;
        }
      }
    }

    // Find the matching machine from our catalog
    let machineMatch = null;
    if (firstPassResult && firstPassResult.machineId) {
      machineMatch = MACHINE_CATALOG.find((machine: MachineInfo) => machine.id === firstPassResult.machineId);
    }

    let finalResult = firstPassResult;
    let finalMachineName = machineMatch?.name || 'Unknown Machine';
    let finalImageUrl = machineMatch ? `/lovable-uploads/${firstPassResult?.machineId.toLowerCase().replace(/mch-|-/g, '')}.png` : null;

    // If confidence is low or machine not recognized, try online identification
    const confidenceThreshold = 0.75;
    if (!firstPassResult || firstPassResult.confidence < confidenceThreshold || firstPassResult.machineId === 'UNKNOWN') {
      console.log(`Local catalog confidence too low (${firstPassResult?.confidence || 0}), trying online identification...`);
      
      try {
        const onlineResult = await analyzeWithOnlineModel(imageData, imageFormat);
        
        if (onlineResult && onlineResult.confidence > (firstPassResult?.confidence || 0)) {
          console.log(`Online identification more confident: ${onlineResult.confidence} vs ${firstPassResult?.confidence || 0}`);
          finalResult = {
            machineId: 'ONLINE-' + onlineResult.machineName.toUpperCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
            machineName: onlineResult.machineName,
            confidence: onlineResult.confidence,
            reasoning: onlineResult.reasoning
          };
          finalMachineName = onlineResult.machineName;
          finalImageUrl = null; // No local image for online-identified machines
        }
      } catch (error) {
        console.error('Online identification failed:', error);
        // Fall back to original result
      }
    }

    const result = {
      success: true,
      analysis: {
        machineId: finalResult?.machineId || null,
        machineName: finalMachineName,
        confidence: finalResult?.confidence || 0,
        reasoning: finalResult?.reasoning || 'Analysis completed',
        imageUrl: finalImageUrl,
        features: features || null
      }
    };

    console.log('Machine analysis result:', result);

    return new Response(JSON.stringify(result), {
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

// Helper function for online AI model analysis (broader scope)
async function analyzeWithOnlineModel(imageData: string, imageFormat: string) {
  console.log('Starting online machine identification...');

  const prompt = `You are an expert at identifying gym workout machines from photos. Study the image carefully and identify the specific gym machine shown.

INSTRUCTIONS:
1. Look at the machine's key features: handles, bars, seats, cables, weight stacks, etc.
2. Identify the exercise motion and muscle groups targeted
3. Provide the specific machine name (e.g., "Oblique Crunch Machine", "Seated Lat Pulldown", "Cable Crossover")
4. Give a confidence score from 0.0 to 1.0 based on how certain you are
5. Explain your reasoning based on visual features

Return ONLY a JSON object with this exact format:
{
  "machineName": "Exact machine name",
  "confidence": 0.95,
  "reasoning": "Detailed explanation of visual features that led to this identification"
}`;

  const models = ['o4-mini-2025-04-16', 'gpt-5-mini-2025-08-07', 'gpt-4o'];
  
  for (const model of models) {
    try {
      console.log(`Trying online model: ${model}`);
      
      const requestBody: any = {
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageFormat};base64,${imageData}`,
                  detail: 'high'
                }
              }
            ]
          }
        ]
      };

      // Use max_completion_tokens for newer models, max_tokens for legacy
      if (['gpt-5-mini-2025-08-07', 'o4-mini-2025-04-16'].includes(model)) {
        requestBody.max_completion_tokens = 1000;
      } else {
        requestBody.max_tokens = 1000;
        requestBody.temperature = 0.1;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error(`Model ${model} failed with status: ${response.status}`);
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.error(`No content returned from model ${model}`);
        continue;
      }

      console.log(`Raw response from ${model}:`, content);
      
      // Parse the JSON response
      const cleanedContent = extractJson(content);
      const result = JSON.parse(cleanedContent);
      
      if (result.machineName && result.confidence && result.reasoning) {
        console.log(`Online identification successful with ${model}:`, result);
        return result;
      } else {
        console.error(`Invalid response format from ${model}:`, result);
        continue;
      }
    } catch (error) {
      console.error(`Error with model ${model}:`, error);
      continue;
    }
  }

  throw new Error('All online models failed to identify the machine');
}

// Helper function for AI model analysis with proper model handling
async function analyzeWithModel(imageData: string, imageFormat: string, machineCatalog: any[]) {
  const machineListText = machineCatalog.map((machine: MachineInfo) => 
    `- ${machine.name} (ID: ${machine.id}): ${machine.description}`
  ).join('\n');

  console.log(`Analyzing machine image with ${machineCatalog.length} machines in catalog...`);

  const prompt = `You are an expert at identifying gym workout machines from photos. Study the image carefully and identify which specific machine it shows from this exact list:

${machineListText}

CRITICAL VISUAL ANALYSIS STEPS:
1. FIRST: Look at what the user GRIPS or RESTS against:
   - HANDLES/GRIPS that you grasp with hands = Pressing machines (Chest Press, Shoulder Press, Incline Press)
   - ARM PADS/ELBOW PADS that you rest arms against = Pec Deck (Butterfly) Machine
   - CABLE/BAR systems = Lat Pulldown, Seated Row, Cable machines

2. SECOND: Determine the MOTION DIRECTION:
   - HORIZONTAL pressing (straight forward) = Chest Press Machine
   - VERTICAL/OVERHEAD pressing (straight up) = Shoulder Press Machine  
   - UPWARD-FORWARD pressing (angled up) = Incline Chest Press Machine
   - SWINGING INWARD motion (arms come together) = Pec Deck Machine

3. THIRD: Check SEAT POSITION:
   - Nearly upright seat (85-90°) = Shoulder Press
   - Slightly reclined seat (70-80°) = Chest Press
   - Significantly inclined seat (30-45°) = Incline Chest Press

MOST COMMON MISTAKES TO AVOID:
- DO NOT confuse Chest Press (has handles you grip) with Pec Deck (has arm pads you rest against)
- DO NOT confuse Shoulder Press (vertical motion, upright seat) with Chest Press (horizontal motion, reclined seat)
- DO NOT confuse machines with weight stacks vs free barbells

CONFIDENCE GUIDELINES:
- 0.9-1.0: Very clear visual features match exactly one machine type
- 0.8-0.89: Good match with minor ambiguity 
- 0.7-0.79: Reasonable match but some uncertainty
- 0.6-0.69: Partial match with significant uncertainty
- Below 0.6: Too unclear, set machineId to null

OUTPUT RULES (must follow exactly):
- Return ONLY a valid JSON object (no markdown, no code fences, no extra text).
- Keys: "machineId" (string|null, must be one of the IDs provided), "confidence" (number 0..1), "reasoning" (string).
- If confidence < 0.6 or genuinely unsure, set "machineId" to null and explain why in "reasoning".
- In reasoning, explicitly state what visual features led to your identification.`;

  // Try newer model first, fallback to gpt-4o
  const models = ['o4-mini-2025-04-16', 'gpt-5-mini-2025-08-07', 'gpt-4o'];
  
  for (const model of models) {
    try {
      const requestBody: any = {
        model,
        messages: [
          {
            role: 'system',
            content: 'You ONLY respond with a single valid JSON object. Do not include markdown, code fences, or any extra text.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/${imageFormat};base64,${imageData}`,
                  detail: 'high'
                }
              }
            ]
          }
        ]
      };

      // Handle API parameter differences
      if (['o4-mini-2025-04-16', 'gpt-5-mini-2025-08-07'].includes(model)) {
        requestBody.max_completion_tokens = 500;
        // Don't include temperature for newer models
      } else {
        requestBody.max_tokens = 500;
        requestBody.temperature = 0.1;
      }

      console.log(`Trying model: ${model}`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`${model} API error:`, response.status, errorData);
        continue; // Try next model
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content ?? '';
      console.log(`${model} Response:`, aiResponse);

      // Parse response
      const cleaned = extractJson(aiResponse);
      const analysisResult = JSON.parse(cleaned);
      
      // Normalize confidence
      if (typeof analysisResult.confidence === 'string') {
        analysisResult.confidence = parseFloat(analysisResult.confidence) || 0;
      }
      
      return analysisResult;
      
    } catch (error) {
      console.error(`Error with ${model}:`, error);
      continue; // Try next model
    }
  }
  
  throw new Error('All AI models failed');
}

// Feature analysis for machine disambiguation 
async function analyzeFeatures(imageData: string, imageFormat: string) {
  const featurePrompt = `Analyze this gym machine image and identify these specific visual features. Answer with YES/NO only:

1. hasHandles: Are there handles, grips, or bars that a person grasps with their hands?
2. hasArmPads: Are there arm pads, elbow rests, or cushioned surfaces where arms rest against?
3. motion: What is the primary motion direction? Answer: "horizontal", "vertical", "upward-forward", "swing-inward", or "unknown"
4. seatBack: What angle is the seat back? Answer: "upright" (85-90°), "slightly-reclined" (70-80°), "inclined" (30-45°), or "unknown"
5. hasOverheadCable: Is there a cable system above the user's head?

Return ONLY a valid JSON object with these exact keys: hasHandles, hasArmPads, motion, seatBack, hasOverheadCable`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use stable model for feature analysis
        messages: [
          {
            role: 'system',
            content: 'You ONLY respond with a single valid JSON object. Do not include markdown, code fences, or any extra text.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: featurePrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/${imageFormat};base64,${imageData}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const featuresResponse = data.choices?.[0]?.message?.content ?? '';
      const cleaned = extractJson(featuresResponse);
      return JSON.parse(cleaned);
    }
  } catch (error) {
    console.error('Feature analysis error:', error);
  }
  
  return null;
}

// Apply guardrails based on features
function applyFeatureGuardrails(initialResult: any, features: any) {
  if (!features || !initialResult) return initialResult;
  
  console.log('Applying feature guardrails:', features);
  
  // Rule: Pec Deck must have arm pads and NO handles
  if (initialResult.machineId === 'MCH-PEC-DECK') {
    if (features.hasHandles === true || features.hasArmPads === false) {
      console.log('Pec Deck guardrail failed: hasHandles or missing armPads');
      return { 
        ...initialResult, 
        confidence: Math.max(0.3, initialResult.confidence - 0.4),
        reasoning: `${initialResult.reasoning} [Confidence lowered: Expected arm pads without handles for Pec Deck]`
      };
    }
  }
  
  // Rule: Chest Press must have handles and horizontal motion
  if (initialResult.machineId === 'MCH-CHEST-PRESS') {
    if (features.hasHandles === false || (features.motion !== 'horizontal' && features.motion !== 'unknown')) {
      console.log('Chest Press guardrail failed: no handles or wrong motion');
      return { 
        ...initialResult, 
        confidence: Math.max(0.3, initialResult.confidence - 0.3),
        reasoning: `${initialResult.reasoning} [Confidence lowered: Expected handles with horizontal motion for Chest Press]`
      };
    }
  }
  
  // Rule: Shoulder Press must have handles and vertical motion with upright seat
  if (initialResult.machineId === 'MCH-SHOULDER-PRESS') {
    if (features.hasHandles === false || (features.motion !== 'vertical' && features.motion !== 'unknown')) {
      console.log('Shoulder Press guardrail failed: no handles or wrong motion');
      return { 
        ...initialResult, 
        confidence: Math.max(0.3, initialResult.confidence - 0.3),
        reasoning: `${initialResult.reasoning} [Confidence lowered: Expected handles with vertical motion for Shoulder Press]`
      };
    }
  }
  
  return initialResult;
}

// JSON extraction helper
function extractJson(input: string) {
  if (!input) return '';
  const fence = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const first = input.indexOf('{');
  const last = input.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) return input.slice(first, last + 1).trim();
  return input.trim();
}