import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { imageData, imageFormat = 'jpeg' } = await req.json();
    
    if (!imageData) {
      throw new Error('No image data provided');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Analyzing machine image with OpenAI...');

    // Create detailed prompt for machine recognition
    const machineListText = MACHINE_CATALOG.map(machine => 
      `- ${machine.name} (ID: ${machine.id}): ${machine.description}`
    ).join('\n');

    const prompt = `You are an expert at identifying gym workout machines. Analyze the image and identify which specific machine it shows from this exact list:

${machineListText}

IMPORTANT DISTINCTIONS:
- Chest Press vs Incline Chest Press: Look for the angle of the seat back and pressing angle. Incline has a significant upward angle (30-45 degrees), while regular chest press is more horizontal.
- Pay close attention to the pressing angle, seat position, and machine structure.

Respond with ONLY a JSON object in this exact format:
{
  "machineId": "MCH-EXACT-ID-FROM-LIST",
  "confidence": 0.85,
  "reasoning": "Clear explanation of why you identified this machine, mentioning key visual features that distinguish it from similar machines"
}

If you cannot identify the machine with reasonable confidence (below 0.6), set machineId to null and explain why in the reasoning.`;

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
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse);
      throw new Error('AI response format error');
    }

    // Validate the response structure
    if (!analysisResult || typeof analysisResult.confidence !== 'number') {
      throw new Error('Invalid AI response structure');
    }

    // Find the matching machine from our catalog
    let machineMatch = null;
    if (analysisResult.machineId) {
      machineMatch = MACHINE_CATALOG.find(machine => machine.id === analysisResult.machineId);
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