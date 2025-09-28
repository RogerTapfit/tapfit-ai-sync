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

    // Build the machine list for the prompt
    const machineListText = MACHINE_CATALOG.map((machine: MachineInfo) => 
      `- ${machine.name} (ID: ${machine.id}): ${machine.description}`
    ).join('\n');

    console.log(`Analyzing machine image with ${MACHINE_CATALOG.length} machines in catalog...`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

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
- 0.7-0.8: Good match but some ambiguity in angle or lighting
- 0.5-0.6: Partial match but significant uncertainty
- Below 0.5: Too unclear, set machineId to null

OUTPUT RULES (must follow exactly):
- Return ONLY a valid JSON object (no markdown, no code fences, no extra text).
- Keys: "machineId" (string|null, must be one of the IDs provided), "confidence" (number 0..1), "reasoning" (string).
- If confidence < 0.7 or genuinely unsure, set "machineId" to null and explain why in "reasoning".
- In reasoning, explicitly state what visual features led to your identification.`;

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
        ],
        max_tokens: 500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content ?? '';
    console.log('AI Response raw:', aiResponse);

    // Robustly extract JSON from potential markdown/code fences
    function extractJson(input: string) {
      if (!input) return '';
      const fence = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fence) return fence[1].trim();
      const first = input.indexOf('{');
      const last = input.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) return input.slice(first, last + 1).trim();
      return input.trim();
    }

    const cleaned = extractJson(aiResponse);

    // Parse the JSON response
    let analysisResult: any;
    try {
      analysisResult = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON. Cleaned content:', cleaned);
      throw new Error('AI response format error');
    }

    // Normalize types
    if (analysisResult && typeof analysisResult.confidence === 'string') {
      const parsed = parseFloat(analysisResult.confidence);
      analysisResult.confidence = isNaN(parsed) ? 0 : parsed;
    }

    // Validate the response structure
    if (!analysisResult || typeof analysisResult.confidence !== 'number') {
      throw new Error('Invalid AI response structure');
    }

    // Find the matching machine from our catalog
    let machineMatch = null;
    if (analysisResult.machineId) {
      machineMatch = MACHINE_CATALOG.find((machine: MachineInfo) => machine.id === analysisResult.machineId);
    }

    const result = {
      success: true,
      analysis: {
        machineId: analysisResult.machineId,
        machineName: machineMatch?.name || 'Unknown Machine',
        confidence: Math.max(0, Math.min(1, analysisResult.confidence)),
        reasoning: analysisResult.reasoning || 'AI analysis completed',
        imageUrl: machineMatch ? `/lovable-uploads/${analysisResult.machineId.toLowerCase().replace(/mch-|-/g, '')}.png` : null
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