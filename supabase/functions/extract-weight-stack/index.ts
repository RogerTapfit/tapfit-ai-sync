import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image provided');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Use GPT-4 Vision to extract weight values from the photo
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
            content: `You are an expert at analyzing gym equipment weight stack photos. 
Your task is to extract ALL weight values visible on the weight stack labels.

CRITICAL INSTRUCTIONS:
1. Look at the weight selector pins and labels on the weight stack
2. Extract EVERY weight value visible, in order from LIGHTEST to HEAVIEST
3. Return ONLY a JSON array of numbers representing the weights in pounds (lbs)
4. If weights are shown in kg, convert to lbs (multiply by 2.2 and round)
5. Include ALL intermediate weights you can see
6. Common patterns: 10, 20, 30... or 15, 30, 45, 60... or 5, 10, 15, 20...

IMPORTANT: The weights may NOT be linear increments. Some machines have varying gaps between weights.

Example outputs:
- Standard: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
- Non-linear: [15, 30, 45, 65, 85, 105, 125, 145, 165, 185, 205, 225, 245]
- Cable machine: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]

Return ONLY the JSON array, no other text.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all weight values from this gym machine weight stack photo. Return only a JSON array of numbers in lbs, ordered from lightest to heaviest.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
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
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    console.log('OpenAI response:', content);

    // Parse the JSON array from the response
    let weightStack: number[] = [];
    try {
      // Extract JSON array from response (handle potential markdown formatting)
      const jsonMatch = content.match(/\[[\d,\s]+\]/);
      if (jsonMatch) {
        weightStack = JSON.parse(jsonMatch[0]);
      } else {
        // Try direct parse
        weightStack = JSON.parse(content);
      }
      
      // Validate it's an array of numbers
      if (!Array.isArray(weightStack) || !weightStack.every(w => typeof w === 'number')) {
        throw new Error('Invalid weight stack format');
      }
      
      // Sort ascending
      weightStack.sort((a, b) => a - b);
      
      // Remove duplicates
      weightStack = [...new Set(weightStack)];
      
    } catch (parseError) {
      console.error('Error parsing weight stack:', parseError);
      throw new Error('Could not extract weight values from image');
    }

    console.log('Extracted weight stack:', weightStack);

    return new Response(
      JSON.stringify({ 
        success: true, 
        weightStack,
        count: weightStack.length,
        min: weightStack[0],
        max: weightStack[weightStack.length - 1]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-weight-stack:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
