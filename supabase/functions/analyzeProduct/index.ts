import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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
            content: `You are a professional nutritionist and food safety expert. Analyze the product in the image and provide comprehensive health information.

CRITICAL REQUIREMENTS:
- Identify the exact product name, brand, and size from packaging
- Analyze nutritional content per serving (not per 100g unless specified)
- Calculate accurate health grade based on nutritional quality, processing level, ingredient quality, and safety
- Identify any concerning additives, preservatives, or chemicals
- Provide specific health recommendations and alternatives

Return JSON in this exact format:
{
  "product": {
    "name": "Product name",
    "brand": "Brand name", 
    "size": "Package size",
    "confidence": 0.95
  },
  "nutrition": {
    "serving_size": "1 can (355ml)",
    "per_serving": {
      "calories": 140,
      "protein_g": 0,
      "carbs_g": 39,
      "fat_g": 0,
      "fiber_g": 0,
      "sugars_g": 39,
      "sodium_mg": 45
    }
  },
  "health_grade": {
    "letter": "D",
    "score": 35,
    "breakdown": {
      "nutritional_quality": 20,
      "ingredient_quality": 15,
      "safety_score": 75,
      "processing_level": 25
    }
  },
  "analysis": {
    "pros": ["List positive aspects"],
    "cons": ["List negative aspects"], 
    "concerns": ["Specific health concerns"],
    "alternatives": ["Healthier alternatives"]
  },
  "safety": {
    "forever_chemicals": false,
    "concerning_additives": ["List any concerning additives"],
    "allergens": ["List allergens"],
    "processing_level": "ultra-processed"
  },
  "ingredients_analysis": "Brief analysis of ingredient quality"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: "text",
                text: "Analyze this product for comprehensive health information including nutrition facts, health grade, safety concerns, and alternatives."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('OpenAI Response:', content);

    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Fallback response
      analysisResult = {
        error: 'Failed to analyze product',
        raw_response: content
      };
    }

    return new Response(
      JSON.stringify(analysisResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyzeProduct function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze product',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});