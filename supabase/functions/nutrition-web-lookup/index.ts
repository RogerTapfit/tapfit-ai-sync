import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NutritionData {
  serving_size?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  sugars_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  caffeine_mg?: number;
  cholesterol_mg?: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  vitamins?: Array<{ name: string; amount: number; unit: string; dv_percent?: number }>;
  minerals?: Array<{ name: string; amount: number; unit: string; dv_percent?: number }>;
  ingredients?: string;
  allergens?: string[];
  source?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, brand, barcode } = await req.json();
    
    if (!productName && !barcode) {
      return new Response(
        JSON.stringify({ error: 'Product name or barcode required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query
    const searchQuery = brand 
      ? `${brand} ${productName} complete nutrition facts ingredients list per serving calories protein carbs fat sugar fiber sodium caffeine vitamins minerals percent daily value`
      : `${productName} complete nutrition facts ingredients list per serving calories protein carbs fat sugar fiber sodium caffeine vitamins minerals percent daily value`;

    console.log('Searching for nutrition data:', searchQuery);

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a precise nutrition and chemical ingredient data extractor. Search the web for the COMPLETE nutrition facts, full ingredients list, AND chemical analysis of the specified product. 

IMPORTANT: Find data from the manufacturer's website, official product pages, or verified nutrition databases.

Return ONLY valid JSON with this exact structure:
{
  "serving_size": "1 can (12 fl oz)",
  "calories": 10,
  "protein_g": 0,
  "carbs_g": 2,
  "fat_g": 0,
  "sugars_g": 0,
  "fiber_g": 0,
  "sodium_mg": 5,
  "cholesterol_mg": 0,
  "saturated_fat_g": 0,
  "trans_fat_g": 0,
  "caffeine_mg": 200,
  "vitamins": [
    { "name": "Vitamin C", "amount": 60, "unit": "mg", "dv_percent": 70 },
    { "name": "Riboflavin", "amount": 1.7, "unit": "mg", "dv_percent": 130 },
    { "name": "Niacin", "amount": 20, "unit": "mg", "dv_percent": 130 },
    { "name": "Vitamin B6", "amount": 2, "unit": "mg", "dv_percent": 120 },
    { "name": "Vitamin B12", "amount": 6, "unit": "mcg", "dv_percent": 250 },
    { "name": "Biotin", "amount": 300, "unit": "mcg", "dv_percent": 1000 },
    { "name": "Pantothenic Acid", "amount": 10, "unit": "mg", "dv_percent": 200 }
  ],
  "minerals": [
    { "name": "Calcium", "amount": 50, "unit": "mg", "dv_percent": 4 },
    { "name": "Chromium", "amount": 50, "unit": "mcg", "dv_percent": 140 }
  ],
  "ingredients": "Carbonated Water, Citric Acid, Taurine, Sodium Citrate, Natural Flavors, Caffeine, Sucralose, Potassium Sorbate...",
  "allergens": ["Contains no major allergens"],
  "source": "manufacturer website or database name",
  "chemical_analysis": {
    "sweeteners": [
      { "name": "Sucralose", "category": "artificial", "gi": 0, "health_concerns": ["May affect gut microbiome"] }
    ],
    "preservatives": [
      { "name": "Potassium Sorbate", "e_code": "E202", "purpose": "Preservative", "safety_rating": "safe", "health_concerns": [] }
    ],
    "dyes": [
      { "name": "Red 40", "e_code": "E129", "color": "#FF0000", "safety_rating": "caution", "health_concerns": ["Linked to hyperactivity in children"] }
    ],
    "additives": [
      { "name": "Taurine", "category": "amino_acid", "purpose": "Energy enhancement", "concern_level": "low" },
      { "name": "L-Carnitine", "category": "amino_acid", "purpose": "Fat metabolism", "concern_level": "low" },
      { "name": "Ginseng Extract", "category": "herbal", "purpose": "Adaptogen", "concern_level": "low" },
      { "name": "Guarana Seed Extract", "category": "herbal", "purpose": "Natural caffeine source", "concern_level": "low" }
    ],
    "nova_level": 4
  }
}

CRITICAL RULES:
- Return EXACT numbers from official sources
- Include ALL vitamins and minerals listed on the product with amounts and % Daily Value
- Include COMPLETE ingredients list exactly as shown on the product
- For energy drinks, ALWAYS include caffeine amount
- Use "mg" for milligrams, "mcg" for micrograms
- Include cholesterol, saturated fat, trans fat if available
- IDENTIFY ALL SWEETENERS: sucralose, stevia, aspartame, sugar, high fructose corn syrup, etc.
- IDENTIFY ALL PRESERVATIVES: sodium benzoate, potassium sorbate, citric acid, etc.
- IDENTIFY ALL DYES: Red 40, Yellow 5, Blue 1, Caramel Color, etc.
- IDENTIFY ALL ADDITIVES: taurine, carnitine, ginseng, guarana, inositol, etc.
- Set nova_level: 1=unprocessed, 2=processed ingredients, 3=processed, 4=ultra-processed
- If a value is not found, omit it rather than guessing
- Return ONLY the JSON, no other text`
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Perplexity API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch nutrition data', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const perplexityData = await perplexityResponse.json();
    console.log('Perplexity response:', JSON.stringify(perplexityData, null, 2));

    // Extract the content from the response
    const content = perplexityData.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No content in response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON from the response
    let nutritionData: NutritionData;
    try {
      // Try to extract JSON from the response (it might have markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutritionData = JSON.parse(jsonMatch[0]);
      } else {
        nutritionData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse nutrition JSON:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse nutrition data', raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add citations if available
    const citations = perplexityData.citations || [];
    
    return new Response(
      JSON.stringify({
        success: true,
        nutrition: nutritionData,
        citations,
        searchQuery
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in nutrition-web-lookup:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
