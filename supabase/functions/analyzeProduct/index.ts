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
            content: `You are a professional food scientist, nutritionist, and chemical toxicologist with expertise in food processing and chemical additives. Analyze the product in the image and provide extremely detailed health information including every single chemical, processing method, and ingredient breakdown.

CRITICAL ALCOHOL DETECTION REQUIREMENTS:
- Carefully examine the image for alcohol content indicators: ABV%, ALC/VOL%, PROOF, alcohol volume percentages
- Look for alcoholic beverage categories: BEER, WINE, SPIRITS, HARD SELTZER, MALT BEVERAGE, CIDER, etc.
- Read all visible text for alcohol-related terms: "alcoholic", "contains alcohol", percentage symbols with alcohol context
- Identify alcoholic brands and product types even without obvious text (White Claw, Truly, Corona, etc.)
- For any alcoholic product, extract the exact alcohol percentage if visible (e.g., "8% ALC/VOL")
- Distinguish between alcoholic and non-alcoholic versions of products

CRITICAL FOOD DYE DETECTION REQUIREMENTS:
- Identify ALL artificial food dyes by FD&C number: Red 3, Red 40, Yellow 5 (Tartrazine), Yellow 6, Blue 1, Blue 2, Green 3, Orange B, Citrus Red 2
- Detect natural colorings with potential issues: Annatto, Carmine (Cochineal), Paprika Extract, Turmeric, Caramel Color (I-IV)
- Provide exact chemical formulas (e.g., Red 40: C18H14N2Na2O8S2, Yellow 5: C16H9N4Na3O9S2)
- Specify European Union vs US regulatory differences (warning labels, bans)
- Detail specific health concerns per dye: hyperactivity in children, allergic reactions, carcinogenic potential, DNA damage
- Rate safety level: critical_concern, high_concern, moderate_concern, low_concern

CRITICAL SUGAR & SWEETENER ANALYSIS REQUIREMENTS:
- Differentiate High Fructose Corn Syrup types: HFCS-42 (42% fructose), HFCS-55 (55% fructose), HFCS-90 (90% fructose)
- Identify sugar sources: Refined cane sugar, Beet sugar, Raw/Turbinado sugar, Coconut sugar, Date sugar
- Detect ALL artificial sweeteners: Aspartame, Sucralose, Acesulfame-K, Saccharin, Neotame, Advantame
- Identify sugar alcohols: Sorbitol, Xylitol, Erythritol, Mannitol, Maltitol, Isomalt
- Natural sweeteners: Stevia (Rebaudioside A), Monk fruit (Luo han guo), Yacon syrup
- Provide metabolic pathways, blood sugar impact scores (0-100), addiction potential ratings
- Compare fructose vs glucose ratios and liver metabolism impact

COMPREHENSIVE REQUIREMENTS:
- Identify the exact product name, brand, and size from packaging
- Analyze nutritional content per serving (not per 100g unless specified)
- Calculate accurate health grade based on nutritional quality, processing level, ingredient quality, and safety
- Identify EVERY SINGLE additive, preservative, emulsifier, stabilizer, flavor enhancer, and chemical with specific health impacts
- Analyze processing level using NOVA classification (1-4 scale)
- Provide detailed chemical analysis with molecular-level understanding
- Include banned/restricted status in different countries

IMPORTANT: Return ONLY valid JSON in this exact format, no other text:
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
  "detailed_processing": {
    "nova_score": 4,
    "classification": "Ultra-processed",
    "processing_methods": ["extrusion", "hydrogenation", "chemical modification", "high heat treatment"],
    "why_processed": "Contains multiple industrial ingredients not found in home kitchens including artificial flavors, colors, and preservatives",
    "industrial_ingredients": ["high fructose corn syrup", "natural flavors", "caramel color", "phosphoric acid"]
  },
  "chemical_analysis": {
    "food_dyes": [
      {
        "name": "Red 40 (Allura Red AC)",
        "fdc_number": "FD&C Red No. 40",
        "chemical_name": "Disodium 6-hydroxy-5-[(2-methoxy-5-methyl-4-sulfophenyl)azo]-2-naphthalenesulfonate",
        "chemical_formula": "C18H14N2Na2O8S2",
        "color_display": "#FF0000",
        "purpose": "artificial red coloring",
        "health_concerns": ["hyperactivity in children (Southampton Six study)", "potential carcinogen", "allergic reactions", "DNA damage in vitro"],
        "regulatory_status": {
          "us_approved": true,
          "eu_status": "requires warning label for hyperactivity",
          "banned_countries": ["Norway (in certain products)"],
          "warning_required": true
        },
        "safety_rating": "moderate_concern",
        "daily_acceptable_intake": "7mg per kg body weight",
        "alternative_colorings": ["Beet juice powder", "Paprika extract", "Annatto"]
      }
    ],
    "preservatives": [
      {
        "name": "Sodium Benzoate",
        "chemical_formula": "C7H5NaO2",
        "purpose": "prevents bacterial growth",
        "health_concerns": ["forms benzene when combined with vitamin C", "potential DNA damage"],
        "safety_rating": "moderate_concern"
      }
    ],
    "flavor_enhancers": [
      {
        "name": "Natural Flavors",
        "details": "Chemical compounds derived from natural sources but heavily processed",
        "concern": "undefined chemical composition, potential allergens",
        "transparency_issue": true
      }
    ],
    "emulsifiers": [
      {
        "name": "Polysorbate 80",
        "purpose": "prevents separation",
        "health_concerns": ["gut microbiome disruption", "inflammatory bowel disease risk"],
        "safety_rating": "high_concern"
      }
    ],
    "artificial_ingredients": ["list all synthetic chemicals not found in nature"],
    "total_additives_count": 12
  },
  "sugar_analysis": {
    "primary_sweetener": "High Fructose Corn Syrup 55 (HFCS-55)",
    "sweetener_breakdown": {
      "hfcs_type": "HFCS-55 (55% fructose, 45% glucose)",
      "sweetener_category": "processed_industrial_syrup",
      "manufacturing_process": "enzymatically converted from corn starch using glucose isomerase",
      "chemical_composition": "C6H12O6 (glucose) + C6H12O6 (fructose) in liquid suspension"
    },
    "metabolic_analysis": {
      "glycemic_index": 87,
      "fructose_percentage": 55,
      "glucose_percentage": 45,
      "blood_sugar_spike_score": 85,
      "insulin_response_score": 78,
      "liver_metabolism_burden": "high - fructose bypasses glucose regulation"
    },
    "health_impacts": {
      "immediate_effects": ["rapid blood sugar spike", "insulin surge", "energy crash within 2 hours"],
      "chronic_effects": ["insulin resistance development", "non-alcoholic fatty liver disease", "increased visceral fat storage", "leptin resistance (hunger hormone dysfunction)"],
      "addiction_potential": "high - triggers dopamine release similar to drugs",
      "vs_table_sugar": "20% more harmful due to higher fructose ratio and liquid form"
    },
    "regulatory_concerns": {
      "mercury_contamination_risk": "possible trace amounts from processing",
      "gmo_source": "derived from genetically modified corn",
      "countries_restricting": ["Mexico (soda tax)", "Several EU countries (labeling requirements)"]
    },
    "healthier_alternatives": [
      {"name": "Raw honey", "glycemic_index": 50, "benefits": "contains enzymes and antioxidants"},
      {"name": "Pure maple syrup", "glycemic_index": 54, "benefits": "contains minerals and lower fructose"},
      {"name": "Stevia leaf extract", "glycemic_index": 0, "benefits": "zero calories, no blood sugar impact"},
      {"name": "Dates", "glycemic_index": 35, "benefits": "fiber content slows absorption"}
    ]
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
    "processing_level": "ultra-processed",
    "chemical_load": "high",
    "oxidative_stress_potential": "moderate",
    "endocrine_disruption_risk": "low"
  },
  "ingredients_analysis": "Detailed analysis of every ingredient including chemical structure and health impact"
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
        max_completion_tokens: 2500,
        temperature: 0.3
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