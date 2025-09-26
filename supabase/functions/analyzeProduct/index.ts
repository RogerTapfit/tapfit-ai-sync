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

    // Frontend handles HEIC conversion, so we can process the image directly
    const processedImageBase64 = imageBase64;
    console.log('Processing image for analysis...');

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
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a food scientist analyzing products. Focus on accurate identification and essential health information.

CRITICAL ALCOHOL DETECTION (TOP PRIORITY):
- Examine image for alcohol indicators: ABV%, ALC/VOL%, PROOF, alcohol percentages
- Look for alcoholic beverage categories: BEER, WINE, SPIRITS, HARD SELTZER, MALT BEVERAGE, CIDER
- Read all visible text for alcohol terms and percentage values
- Identify alcoholic brands (White Claw, Truly, Corona, etc.)
- Extract exact alcohol percentage if visible (e.g., "8% ALC/VOL")

PRODUCT ANALYSIS REQUIREMENTS:
- Identify product name, brand, size with confidence score
- Extract nutrition facts from labels when visible
- Assign health grade (A-F) based on nutritional quality and processing
- Detect concerning additives: artificial dyes, high fructose corn syrup, preservatives
- Classify processing level (NOVA score 1-4)
- Note major allergens and safety concerns

RESPONSE FORMAT: Return valid JSON only, no markdown formatting.
{
  "product": {
    "name": "Product name",
    "brand": "Brand name", 
    "size": "Package size",
    "confidence": 0.95
  },
  "alcohol_analysis": {
    "is_alcoholic_beverage": false,
    "alcohol_content_percentage": 0,
    "alcohol_indicators_found": [],
    "beverage_category": "non_alcoholic",
    "visual_alcohol_text": ""
  },
  "nutrition": {
    "serving_size": "1 serving",
    "per_serving": {
      "calories": 0,
      "protein_g": 0,
      "carbs_g": 0,
      "fat_g": 0,
      "fiber_g": 0,
      "sugars_g": 0,
      "sodium_mg": 0
    }
  },
  "health_grade": {
    "letter": "C",
    "score": 60,
    "breakdown": {
      "nutritional_quality": 60,
      "ingredient_quality": 60,
      "safety_score": 80,
      "processing_level": 60
    }
  },
  "detailed_processing": {
    "nova_score": 3,
    "classification": "Processed",
    "processing_methods": ["heating", "preservation"],
    "why_processed": "Contains processed ingredients",
    "industrial_ingredients": []
  },
  "chemical_analysis": {
    "food_dyes": [],
    "preservatives": [],
    "flavor_enhancers": [],
    "emulsifiers": [],
    "artificial_ingredients": [],
    "total_additives_count": 0
  },
  "sugar_analysis": {
    "primary_sweetener": "None",
    "sweetener_breakdown": {
      "hfcs_type": "None",
      "sweetener_category": "none",
      "manufacturing_process": "Not applicable"
    },
    "metabolic_analysis": {
      "glycemic_index": 0,
      "fructose_percentage": 0,
      "glucose_percentage": 0,
      "blood_sugar_spike_score": 0,
      "insulin_response_score": 0,
      "liver_metabolism_burden": "none"
    },
    "health_impacts": {
      "immediate_effects": ["none"],
      "chronic_effects": ["none"],
      "addiction_potential": "none"
    },
    "regulatory_concerns": {
      "mercury_contamination_risk": "none",
      "gmo_source": "none",
      "countries_restricting": []
    },
    "healthier_alternatives": []
  },
  "analysis": {
    "pros": [],
    "cons": [], 
    "concerns": [],
    "alternatives": []
  },
  "safety": {
    "forever_chemicals": false,
    "concerning_additives": [],
    "allergens": [],
    "processing_level": "processed",
    "chemical_load": "low",
    "oxidative_stress_potential": "low",
    "endocrine_disruption_risk": "low"
  },
  "ingredients_analysis": "Basic ingredient analysis"
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
                  url: `data:image/jpeg;base64,${processedImageBase64}`
                }
              }
            ]
          }
        ],
        max_completion_tokens: 1500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, response.statusText, errorText);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${response.status} ${response.statusText}`,
          details: errorText
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('OpenAI Response:', content);

    // Parse the JSON response - handle markdown wrapping and extract JSON
    let analysisResult;
    try {
      let cleanContent = content.trim();
      
      // Try to extract JSON from the response
      if (cleanContent.includes('```json')) {
        // Extract content between ```json and ```
        const jsonMatch = cleanContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanContent = jsonMatch[1].trim();
        }
      } else if (cleanContent.includes('{')) {
        // Find the first { and last } to extract JSON
        const firstBrace = cleanContent.indexOf('{');
        const lastBrace = cleanContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
        }
      }
      
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw content:', content);
      
      // Return error response that matches expected format
      return new Response(
        JSON.stringify({ 
          error: 'Failed to analyze product - invalid response format',
          raw_response: content
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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