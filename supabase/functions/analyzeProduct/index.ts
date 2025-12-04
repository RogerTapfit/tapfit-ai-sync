import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Search OpenFoodFacts by product name
async function searchOpenFoodFacts(productName: string, brand?: string): Promise<any> {
  try {
    const searchQuery = brand ? `${brand} ${productName}` : productName;
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=5`;
    
    console.log('Searching OpenFoodFacts for:', searchQuery);
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TapFit App - Contact: support@tapfit.app' }
    });
    
    if (!response.ok) {
      console.log('OpenFoodFacts search failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      // Find best match
      const product = data.products[0];
      const nutriments = product.nutriments || {};
      
      // Extract nutrition per serving or per 100g
      const servingSize = product.serving_size || '100g';
      const hasServingData = nutriments['energy-kcal_serving'] !== undefined;
      
      console.log('OpenFoodFacts found:', product.product_name, 'Serving data:', hasServingData);
      
      return {
        source: 'openfoodfacts',
        product_name: product.product_name,
        brand: product.brands,
        serving_size: servingSize,
        nutrition: {
          calories: hasServingData ? nutriments['energy-kcal_serving'] : nutriments['energy-kcal_100g'],
          protein_g: hasServingData ? nutriments['proteins_serving'] : nutriments['proteins_100g'],
          carbs_g: hasServingData ? nutriments['carbohydrates_serving'] : nutriments['carbohydrates_100g'],
          fat_g: hasServingData ? nutriments['fat_serving'] : nutriments['fat_100g'],
          fiber_g: hasServingData ? nutriments['fiber_serving'] : nutriments['fiber_100g'],
          sugars_g: hasServingData ? nutriments['sugars_serving'] : nutriments['sugars_100g'],
          sodium_mg: hasServingData ? (nutriments['sodium_serving'] || 0) * 1000 : (nutriments['sodium_100g'] || 0) * 1000,
        },
        is_per_serving: hasServingData,
        ingredients: product.ingredients_text,
        nova_group: product.nova_group,
        nutriscore: product.nutriscore_grade,
      };
    }
    
    console.log('No products found in OpenFoodFacts');
    return null;
  } catch (error) {
    console.error('OpenFoodFacts search error:', error);
    return null;
  }
}

// Search USDA FoodData Central by product name
async function searchUSDA(productName: string, brand?: string): Promise<any> {
  try {
    const searchQuery = brand ? `${brand} ${productName}` : productName;
    // Using DEMO_KEY - works for limited requests, production should use real key
    const apiKey = Deno.env.get('USDA_API_KEY') || 'DEMO_KEY';
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(searchQuery)}&pageSize=5&api_key=${apiKey}`;
    
    console.log('Searching USDA for:', searchQuery);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log('USDA search failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.foods && data.foods.length > 0) {
      const food = data.foods[0];
      const nutrients = food.foodNutrients || [];
      
      // Helper to find nutrient by name or ID
      const findNutrient = (names: string[]) => {
        for (const name of names) {
          const nutrient = nutrients.find((n: any) => 
            n.nutrientName?.toLowerCase().includes(name.toLowerCase()) ||
            n.nutrientId === name
          );
          if (nutrient) return nutrient.value;
        }
        return 0;
      };
      
      console.log('USDA found:', food.description, 'Brand:', food.brandOwner);
      
      return {
        source: 'usda',
        product_name: food.description,
        brand: food.brandOwner || food.brandName,
        serving_size: food.servingSize ? `${food.servingSize}${food.servingSizeUnit || 'g'}` : '100g',
        nutrition: {
          calories: findNutrient(['Energy', 'Calories']),
          protein_g: findNutrient(['Protein']),
          carbs_g: findNutrient(['Carbohydrate, by difference', 'Total Carbohydrate']),
          fat_g: findNutrient(['Total lipid (fat)', 'Total Fat']),
          fiber_g: findNutrient(['Fiber, total dietary', 'Dietary Fiber']),
          sugars_g: findNutrient(['Sugars, total', 'Total Sugars']),
          sodium_mg: findNutrient(['Sodium, Na', 'Sodium']),
        },
        is_per_serving: !!food.servingSize,
        ingredients: food.ingredients,
      };
    }
    
    console.log('No products found in USDA');
    return null;
  } catch (error) {
    console.error('USDA search error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing image for universal product analysis...');

    const systemPrompt = `You are an expert product analyst combining food science, pharmacology, and nutritional expertise. Analyze ANY product - food, beverages, supplements, vitamins, or medications.

FIRST: Detect the product type from the image:
- "food" = edible food items (cookies, snacks, candy, chips, meals, etc.)
- "beverage" = drinks ONLY (water, soda, juice, milk, coffee, tea, alcohol)
- "supplement" = vitamins, minerals, herbal supplements
- "medication" = prescription/OTC drugs, medicines

CRITICAL DETECTION RULES:
- Look for "Supplement Facts" label → supplement/vitamin
- Look for "Drug Facts" label → medication
- Look for "Nutrition Facts" label → food OR beverage (determine by product itself)
- Look for pill bottles, capsules, tablets → supplement or medication
- Look for vitamin names (D3, B12, C, etc.) → supplement
- Cookies, crackers, snacks, candy, chips = "food" (NOT beverage!)
- Only liquid drinks are "beverage"

⚠️ CRITICAL: IDENTIFY PRODUCT NAME AND BRAND FIRST
Before doing any analysis, identify:
1. The EXACT product name as shown on packaging (e.g., "Hello Panda Chocolate", "Oreos", "Lay's Classic")
2. The EXACT brand name (e.g., "Meiji", "Nabisco", "Frito-Lay")
This is crucial for database lookups.

⚠️ NUTRITION EXTRACTION RULES - PRIORITY ORDER:
1. ALWAYS attempt to read the Nutrition Facts label FIRST - this is your primary source
2. Look for: "Calories", "Total Fat", "Protein", "Total Carbohydrate" text on the label
3. Extract EXACT numbers shown (e.g., if label says "160" return 160, NOT 150 or 0)
4. Read the serving size exactly as printed (e.g., "1 package (28g)")
5. NEVER return 0 for calories unless the product truly has 0 calories (like water or diet soda)
6. Pay attention to "Calories" row - it's usually in large/bold text on US labels
7. Cross-reference: if you see "Total Carb 26g" and "Protein 2g" but calories shows 0, that's wrong - recalculate

NOTE: Nutrition data may be overridden by verified database values. The data_source field will indicate the actual source used.

FOR ALL PRODUCTS - Return valid JSON with this structure:

{
  "product_type": "food|beverage|supplement|medication",
  "product": {
    "name": "EXACT product name from packaging",
    "brand": "EXACT brand name from packaging",
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
    "serving_size": "READ_EXACT_TEXT_FROM_LABEL",
    "data_source": "ai_extracted",
    "database_name": null,
    "confidence_score": 0.85,
    "per_serving": {
      "calories": "READ_EXACT_NUMBER_FROM_LABEL",
      "protein_g": "READ_EXACT_NUMBER",
      "carbs_g": "READ_EXACT_NUMBER",
      "fat_g": "READ_EXACT_NUMBER",
      "fiber_g": "READ_EXACT_NUMBER",
      "sugars_g": "READ_EXACT_NUMBER",
      "sodium_mg": "READ_EXACT_NUMBER"
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
    "processing_methods": [],
    "why_processed": "",
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
      "immediate_effects": [],
      "chronic_effects": [],
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
  "ingredients_analysis": "",
  
  "supplement_analysis": {
    "dosage_form": "softgel|tablet|capsule|gummy|liquid|powder|spray",
    "serving_size": "1 softgel",
    "servings_per_container": 0,
    
    "quality_rating": {
      "grade": "A|B|C|D|F",
      "score": 0,
      "reasoning": ""
    },
    
    "certifications": [
      {
        "name": "USP Verified|NSF Certified|GMP Certified|Non-GMO|Organic|Vegan|Gluten-Free|Third-Party Tested",
        "verified": true,
        "description": ""
      }
    ],
    
    "active_ingredients": [
      {
        "name": "Ingredient name",
        "form": "Chemical form (e.g., Cholecalciferol, Magnesium Glycinate)",
        "amount": "Amount per serving",
        "unit": "mg|mcg|IU|CFU|g",
        "daily_value": "Percentage or null",
        "bioavailability": "low|medium|high|very_high",
        "bioavailability_notes": "",
        "source": "Natural or synthetic",
        "benefits": []
      }
    ],
    
    "inactive_ingredients": [
      {
        "name": "Ingredient name",
        "category": "filler|binder|coating|preservative|colorant|sweetener|flow_agent|carrier",
        "concern": "none|low|medium|high",
        "notes": ""
      }
    ],
    
    "allergen_warnings": [],
    
    "safety_info": {
      "max_safe_dose": "",
      "overdose_risk": "low|medium|high",
      "overdose_symptoms": [],
      "fat_soluble": false,
      "accumulation_risk": "",
      "pregnancy_category": "Safe|Consult Doctor|Avoid|Unknown",
      "age_restrictions": ""
    },
    
    "drug_interactions": [
      {
        "medication": "",
        "severity": "mild|moderate|severe",
        "effect": ""
      }
    ],
    
    "recommendations": {
      "best_time_to_take": "",
      "take_with_food": true,
      "food_pairings": "",
      "avoid_with": "",
      "storage_tips": ""
    },
    
    "overall_assessment": {
      "pros": [],
      "cons": [],
      "verdict": "",
      "alternative_suggestions": []
    }
  }
}

SUPPLEMENT/VITAMIN QUALITY RATING CRITERIA:
- A+ (95-100): Pharmaceutical-grade, third-party tested, optimal bioavailability forms, minimal fillers, gold-standard certifications
- A (90-94): Excellent quality, USP/NSF verified, great bioavailability, reputable brand
- B+ (85-89): Very good quality, some certifications, good ingredient forms
- B (75-84): Good quality, decent bioavailability, acceptable fillers
- C+ (65-74): Average quality, may have suboptimal forms, more fillers
- C (55-64): Below average, poor forms, unnecessary additives
- D (40-54): Low quality, poor bioavailability, many fillers
- F (<40): Very poor, potentially harmful, no testing verification

BIOAVAILABILITY EXAMPLES:
- Vitamin D3 (Cholecalciferol) > D2 (Ergocalciferol)
- Magnesium Glycinate/Citrate > Oxide
- Methylcobalamin > Cyanocobalamin
- Methylfolate > Folic Acid
- Zinc Picolinate > Zinc Oxide
- Vitamin K2 (MK-7) > K1
- Curcumin with Piperine > Plain Curcumin

FOOD/BEVERAGE GRADING (be strict on processed foods):
- A = Whole foods, minimal processing, nutrient-dense
- B = Lightly processed with clean ingredients
- C = Moderately processed OR high sugar/sodium/fat
- D = Ultra-processed, artificial ingredients
- F = Severe safety concerns, harmful additives

IMPORTANT: Only populate supplement_analysis fields when product_type is "supplement" or "medication". For food/beverage, leave supplement_analysis as null or empty object.

Return ONLY valid JSON, no markdown formatting.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              },
              {
                type: "text",
                text: "Analyze this product comprehensively. Detect if it's food, beverage, supplement, or medication. Provide complete analysis including quality rating, ingredients, safety, and recommendations. Return ONLY valid JSON."
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI analysis failed: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log('Raw AI response:', content.substring(0, 500));

    // Clean up response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    console.log('AI identified product:', analysisResult.product?.name, 'Brand:', analysisResult.product?.brand);

    // ===== DATABASE-FIRST NUTRITION LOOKUP =====
    // Only for food and beverage products
    if (['food', 'beverage'].includes(analysisResult.product_type)) {
      const productName = analysisResult.product?.name;
      const brand = analysisResult.product?.brand;
      
      if (productName) {
        console.log('Searching nutrition databases for:', productName, 'by', brand);
        
        // Try OpenFoodFacts first (best for packaged foods worldwide)
        let databaseResult = await searchOpenFoodFacts(productName, brand);
        
        // If not found, try USDA
        if (!databaseResult) {
          databaseResult = await searchUSDA(productName, brand);
        }
        
        // If database found, override AI nutrition with verified data
        if (databaseResult && databaseResult.nutrition) {
          console.log(`✅ Found verified nutrition in ${databaseResult.source}:`, databaseResult.nutrition);
          
          // Only override if database has actual calorie data
          if (databaseResult.nutrition.calories && databaseResult.nutrition.calories > 0) {
            analysisResult.nutrition = {
              ...analysisResult.nutrition,
              serving_size: databaseResult.serving_size || analysisResult.nutrition?.serving_size,
              data_source: 'database_verified',
              database_name: databaseResult.source === 'openfoodfacts' ? 'OpenFoodFacts' : 'USDA FoodData Central',
              confidence_score: 0.99,
              per_serving: {
                calories: Math.round(databaseResult.nutrition.calories) || 0,
                protein_g: Math.round(databaseResult.nutrition.protein_g * 10) / 10 || 0,
                carbs_g: Math.round(databaseResult.nutrition.carbs_g * 10) / 10 || 0,
                fat_g: Math.round(databaseResult.nutrition.fat_g * 10) / 10 || 0,
                fiber_g: Math.round((databaseResult.nutrition.fiber_g || 0) * 10) / 10,
                sugars_g: Math.round((databaseResult.nutrition.sugars_g || 0) * 10) / 10,
                sodium_mg: Math.round(databaseResult.nutrition.sodium_mg) || 0,
              }
            };
            
            // Add note about data being per 100g if not per serving
            if (!databaseResult.is_per_serving) {
              analysisResult.nutrition.serving_size = `100g (adjust for your serving)`;
            }
            
            // Use NOVA score if available from OpenFoodFacts
            if (databaseResult.nova_group && analysisResult.detailed_processing) {
              analysisResult.detailed_processing.nova_score = databaseResult.nova_group;
            }
          } else {
            console.log('Database found but no calorie data, keeping AI extraction');
            analysisResult.nutrition.data_source = 'ai_extracted';
            analysisResult.nutrition.database_name = null;
          }
        } else {
          console.log('No database match found, using AI extraction');
          // Mark as AI extracted
          if (analysisResult.nutrition) {
            analysisResult.nutrition.data_source = 'ai_extracted';
            analysisResult.nutrition.database_name = null;
            analysisResult.nutrition.confidence_score = 0.85;
          }
        }
      }
    }

    console.log('Final product analysis:', analysisResult.product?.name, 'Type:', analysisResult.product_type, 'Data source:', analysisResult.nutrition?.data_source);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyzeProduct function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
