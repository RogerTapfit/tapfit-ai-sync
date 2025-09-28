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
      { id: 'MCH-CHEST-PRESS', name: 'Chest Press Machine', type: 'Chest Press', description: 'Horizontal pressing motion with handles at chest level and slightly reclined seat' },
      { id: 'MCH-PEC-DECK', name: 'Pec Deck (Butterfly) Machine', type: 'Pec Deck', description: 'Arm pads that swing together in front of the torso for chest isolation' },
      { id: 'MCH-INCLINE-CHEST-PRESS', name: 'Incline Chest Press Machine', type: 'Incline Press', description: 'Angled pressing motion with significant upward angle and inclined seat back (30-45 degrees)' },
      { id: 'MCH-LAT-PULLDOWN', name: 'Lat Pulldown Machine', type: 'Lat Pulldown', description: 'Overhead bar pulled down to chest level while seated' },
      { id: 'MCH-SEATED-ROW', name: 'Seated Row Machine', type: 'Seated Row', description: 'Horizontal pulling motion while seated with chest pad support' },
      { id: 'MCH-LEG-PRESS', name: 'Leg Press Machine', type: 'Leg Press', description: 'Angled leg pressing platform with back support for lower body' },
      { id: 'MCH-LEG-EXTENSION', name: 'Leg Extension Machine', type: 'Leg Extension', description: 'Seated position with leg pad that extends upward for quadriceps isolation' },
      { id: 'MCH-SHOULDER-PRESS', name: 'Shoulder Press Machine', type: 'Shoulder Press', description: 'Vertical/overhead pressing path with handles above shoulder level and upright seat back' },
      { id: 'MCH-TREADMILL', name: 'Treadmill', type: 'Cardio', description: 'Moving belt for walking/running with handrails and control panel' },
      { id: 'MCH-ELLIPTICAL', name: 'Elliptical Machine', type: 'Cardio', description: 'Standing position with moving foot pedals and arm handles' },
      { id: 'MCH-STATIONARY-BIKE', name: 'Stationary Bike', type: 'Cardio', description: 'Seated cycling position with pedals and handlebars' },
      { id: 'MCH-ROWING-MACHINE', name: 'Rowing Machine', type: 'Cardio', description: 'Seated with sliding seat and pulling handle' },
      { id: 'MCH-STAIR-CLIMBER', name: 'Stair Climber', type: 'Cardio', description: 'Standing position with stepping pedals that move up and down' },
      { id: 'MCH-BENCH-PRESS', name: 'Bench Press (Barbell Station)', type: 'Bench Press', description: 'Free barbell on J-hooks with adjustable bench; no rails, guide rods, or weight stack' },
      { id: 'MCH-SMITH-MACHINE', name: 'Smith Machine', type: 'Smith Machine', description: 'Barbell fixed on vertical rails with safety stops and guided linear path' }
    ];

    // Build the machine list for the prompt
    const machineListText = MACHINE_CATALOG.map((machine: MachineInfo) => 
      `- ${machine.name} (ID: ${machine.id}): ${machine.description}`
    ).join('\n');

    console.log(`Analyzing machine image with ${MACHINE_CATALOG.length} machines in catalog...`);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `You are an expert at identifying gym workout machines from photos.
Analyze the image and identify which specific machine it shows from this exact list:

${machineListText}

CRITICAL DISTINCTIONS:
- Shoulder Press vs Chest Press: Shoulder press has a vertical/overhead pressing path with handles above shoulder level and an upright (~90°) seat back. Chest press has a horizontal pressing path with handles at chest level and a slightly reclined seat.
- Incline Chest Press vs Chest Press: Incline has a clear 30–45° seat back and an upward-forward pressing angle; regular chest press is more horizontal with a flatter seat.
- Pec Deck: Arm pads swing together in front of the torso; not a pressing motion with a bar/handles.
- Treadmill vs Other Cardio: Treadmill has a moving belt surface and handrails. Elliptical has foot pedals and arm handles. Stationary bike has a seat and pedals.
- Bench Press vs Smith Machine vs Chest Press Machine: 
  * Bench Press = Free barbell on J-hooks, no rails/guide rods, adjustable bench
  * Smith Machine = Barbell fixed on vertical rails with safety stops, guided linear path
  * Chest Press Machine = Handles/arms with weight stack, not a free barbell

OUTPUT RULES (must follow exactly):
- Return ONLY a valid JSON object (no markdown, no code fences, no extra text).
- Keys: "machineId" (string|null, must be one of the IDs provided), "confidence" (number 0..1), "reasoning" (string).
- If confidence < 0.6 or unsure, set "machineId" to null and explain why in "reasoning".`;

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