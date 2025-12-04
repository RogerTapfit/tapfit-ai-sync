import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse serving weight in grams from a serving size string
const parseServingWeight = (servingStr: string): number | null => {
  if (!servingStr) return null;
  // Match patterns like "30g", "28 g", "1 package (28g)", "100g"
  const match = servingStr.match(/(\d+(?:\.\d+)?)\s*g(?:rams?)?/i);
  return match ? parseFloat(match[1]) : null;
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
      const product = data.products[0];
      const nutriments = product.nutriments || {};
      
      const servingSize = product.serving_size || '100g';
      const hasServingData = nutriments['energy-kcal_serving'] !== undefined;
      
      console.log('OpenFoodFacts found:', product.product_name, 'Serving data:', hasServingData);
      
      return {
        source: 'openfoodfacts',
        product_name: product.product_name,
        brand: product.brands,
        serving_size: servingSize,
        serving_size_grams: parseServingWeight(servingSize),
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
      
      const servingSize = food.servingSize ? `${food.servingSize}${food.servingSizeUnit || 'g'}` : '100g';
      
      console.log('USDA found:', food.description, 'Brand:', food.brandOwner);
      
      return {
        source: 'usda',
        product_name: food.description,
        brand: food.brandOwner || food.brandName,
        serving_size: servingSize,
        serving_size_grams: food.servingSize || 100,
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

// Normalize nutrition to per-gram basis for comparison
function normalizeNutritionPerGram(nutrition: any, servingGrams: number): any {
  if (!nutrition || !servingGrams || servingGrams === 0) return null;
  return {
    calories: (nutrition.calories || 0) / servingGrams,
    protein_g: (nutrition.protein_g || 0) / servingGrams,
    carbs_g: (nutrition.carbs_g || 0) / servingGrams,
    fat_g: (nutrition.fat_g || 0) / servingGrams,
  };
}

// Compare two calorie values (returns true if they're within tolerance)
function caloriesMatch(cal1: number, cal2: number, tolerancePercent: number = 15): boolean {
  if (!cal1 || !cal2) return false;
  const diff = Math.abs(cal1 - cal2);
  const avg = (cal1 + cal2) / 2;
  return (diff / avg) * 100 <= tolerancePercent;
}

// Multi-source consensus voting for nutrition data
interface NutritionSource {
  name: string;
  priority: number; // Lower = higher priority
  nutrition: any;
  servingGrams: number | null;
  confidence: number;
}

function findConsensusNutrition(sources: NutritionSource[]): {
  bestSource: NutritionSource;
  consensusReached: boolean;
  matchingSources: string[];
  qualityScore: number;
  qualityLabel: 'verified' | 'likely_accurate' | 'estimated';
} {
  // Filter out null/invalid sources
  const validSources = sources.filter(s => 
    s.nutrition && 
    s.servingGrams && 
    s.servingGrams > 0 &&
    (s.nutrition.calories > 0 || s.nutrition.per_serving?.calories > 0)
  );
  
  if (validSources.length === 0) {
    return {
      bestSource: sources[0],
      consensusReached: false,
      matchingSources: [],
      qualityScore: 50,
      qualityLabel: 'estimated'
    };
  }
  
  // Normalize all to per-gram for comparison
  const normalizedSources = validSources.map(s => {
    const cals = s.nutrition.calories || s.nutrition.per_serving?.calories || 0;
    return {
      ...s,
      caloriesPerGram: cals / (s.servingGrams || 1)
    };
  });
  
  // Sort by priority
  normalizedSources.sort((a, b) => a.priority - b.priority);
  
  console.log('Comparing sources for consensus:');
  normalizedSources.forEach(s => {
    console.log(`  ${s.name}: ${(s.caloriesPerGram * 100).toFixed(1)} cal/100g (serving: ${s.servingGrams}g)`);
  });
  
  // Find matching sources (within 15% tolerance)
  const matchGroups: NutritionSource[][] = [];
  
  for (const source of normalizedSources) {
    let foundGroup = false;
    for (const group of matchGroups) {
      const groupCalsPerGram = (group[0] as any).caloriesPerGram;
      const sourceCalsPerGram = (source as any).caloriesPerGram;
      if (caloriesMatch(groupCalsPerGram * 100, sourceCalsPerGram * 100, 15)) {
        group.push(source);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      matchGroups.push([source]);
    }
  }
  
  // Find the largest consensus group
  matchGroups.sort((a, b) => b.length - a.length);
  const largestGroup = matchGroups[0] || [];
  const consensusReached = largestGroup.length >= 2;
  const matchingSources = largestGroup.map(s => s.name);
  
  console.log(`Consensus: ${consensusReached ? 'YES' : 'NO'}, matching sources: ${matchingSources.join(', ')}`);
  
  // Pick best source from consensus group, or highest priority overall
  let bestSource: NutritionSource;
  if (consensusReached) {
    // Use lowest priority (highest trust) from the consensus group
    largestGroup.sort((a, b) => a.priority - b.priority);
    bestSource = largestGroup[0];
  } else {
    // No consensus - use highest priority source
    bestSource = normalizedSources[0];
  }
  
  // Calculate quality score
  let qualityScore: number;
  let qualityLabel: 'verified' | 'likely_accurate' | 'estimated';
  
  if (consensusReached && largestGroup.length >= 2) {
    qualityScore = 95;
    qualityLabel = 'verified';
  } else if (bestSource.name === 'AI Label Reading' && bestSource.confidence >= 0.9) {
    qualityScore = 88;
    qualityLabel = 'likely_accurate';
  } else if (['OpenFoodFacts', 'USDA'].includes(bestSource.name)) {
    qualityScore = 80;
    qualityLabel = 'likely_accurate';
  } else {
    qualityScore = 65;
    qualityLabel = 'estimated';
  }
  
  return {
    bestSource,
    consensusReached,
    matchingSources,
    qualityScore,
    qualityLabel
  };
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
8. Set "label_confidence" to how clearly you can read the nutrition label (0.0-1.0)

⚠️ CRITICAL: PACKAGE NET WEIGHT EXTRACTION
Look for NET WT, Net Weight, or total weight on the FRONT of the package:
1. Find text like "NET WT 7 OZ (198g)", "12oz", "100g", "NET WT. 5.3 OZ"
2. Convert to grams if in ounces: 1 oz = 28.35g
3. Calculate servings_per_container: net_weight_grams / serving_size_grams
4. This is DIFFERENT from serving size - NET WT is TOTAL package weight

FOR ALL PRODUCTS - Return valid JSON with this structure:

{
  "product_type": "food|beverage|supplement|medication",
  "product": {
    "name": "EXACT product name from packaging",
    "brand": "EXACT brand name from packaging",
    "size": "Package size",
    "net_weight": "EXACT NET WT text from package front (e.g., '7 OZ (198g)', 'NET WT 12oz')",
    "net_weight_grams": "CALCULATE: total package weight in grams",
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
    "serving_size_grams": "EXTRACT: just the gram weight from serving size",
    "servings_per_container": "READ from label OR CALCULATE: net_weight_grams / serving_size_grams",
    "label_confidence": 0.95,
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

    // ===== MULTI-SOURCE NUTRITION VERIFICATION =====
    if (['food', 'beverage'].includes(analysisResult.product_type)) {
      const productName = analysisResult.product?.name;
      const brand = analysisResult.product?.brand;
      
      // Extract AI-detected values
      const aiServingWeight = parseServingWeight(analysisResult.nutrition?.serving_size) || 
                              analysisResult.nutrition?.serving_size_grams;
      const aiCalories = analysisResult.nutrition?.per_serving?.calories || 0;
      const aiLabelConfidence = analysisResult.nutrition?.label_confidence || 0.85;
      
      console.log('AI extraction:', {
        servingSize: analysisResult.nutrition?.serving_size,
        servingGrams: aiServingWeight,
        calories: aiCalories,
        confidence: aiLabelConfidence
      });
      
      if (productName) {
        console.log('=== MULTI-SOURCE NUTRITION LOOKUP ===');
        console.log('Searching for:', productName, 'by', brand);
        
        // Search multiple databases in parallel
        const [openFoodFactsResult, usdaResult] = await Promise.all([
          searchOpenFoodFacts(productName, brand),
          searchUSDA(productName, brand)
        ]);
        
        // Build sources array for consensus voting
        const nutritionSources: NutritionSource[] = [];
        
        // Add AI Label Reading as a source (highest priority when confident)
        if (aiCalories > 0 && aiServingWeight) {
          nutritionSources.push({
            name: 'AI Label Reading',
            priority: aiLabelConfidence >= 0.9 ? 1 : 3, // High priority if confident
            nutrition: analysisResult.nutrition.per_serving,
            servingGrams: aiServingWeight,
            confidence: aiLabelConfidence
          });
          console.log('AI Label source added:', aiCalories, 'cal per', aiServingWeight, 'g');
        }
        
        // Add OpenFoodFacts
        if (openFoodFactsResult?.nutrition?.calories > 0) {
          nutritionSources.push({
            name: 'OpenFoodFacts',
            priority: 2,
            nutrition: openFoodFactsResult.nutrition,
            servingGrams: openFoodFactsResult.serving_size_grams || parseServingWeight(openFoodFactsResult.serving_size),
            confidence: 0.85
          });
          console.log('OpenFoodFacts source added:', openFoodFactsResult.nutrition.calories, 'cal per', openFoodFactsResult.serving_size);
        }
        
        // Add USDA
        if (usdaResult?.nutrition?.calories > 0) {
          nutritionSources.push({
            name: 'USDA',
            priority: 2,
            nutrition: usdaResult.nutrition,
            servingGrams: usdaResult.serving_size_grams || parseServingWeight(usdaResult.serving_size),
            confidence: 0.85
          });
          console.log('USDA source added:', usdaResult.nutrition.calories, 'cal per', usdaResult.serving_size);
        }
        
        // Run consensus voting
        if (nutritionSources.length > 0) {
          const consensus = findConsensusNutrition(nutritionSources);
          
          console.log('=== CONSENSUS RESULT ===');
          console.log('Best source:', consensus.bestSource.name);
          console.log('Consensus reached:', consensus.consensusReached);
          console.log('Matching sources:', consensus.matchingSources);
          console.log('Quality:', consensus.qualityLabel, '(', consensus.qualityScore, ')');
          
          // Apply the winning source's nutrition
          const bestNutrition = consensus.bestSource.nutrition;
          const bestServingGrams = consensus.bestSource.servingGrams;
          
          // If best source serving differs from detected, scale to user's product serving
          let scaleFactor = 1;
          let finalServingSize = analysisResult.nutrition?.serving_size;
          
          if (aiServingWeight && bestServingGrams && aiServingWeight !== bestServingGrams) {
            const sizeDiff = Math.abs(aiServingWeight - bestServingGrams) / Math.max(aiServingWeight, bestServingGrams);
            if (sizeDiff > 0.15) { // More than 15% difference - scale
              scaleFactor = aiServingWeight / bestServingGrams;
              console.log(`Scaling from ${bestServingGrams}g to ${aiServingWeight}g (factor: ${scaleFactor.toFixed(2)})`);
            }
          }
          
          // Calculate servings per container
          const netWeightGrams = analysisResult.product?.net_weight_grams || null;
          const finalServingGrams = aiServingWeight || bestServingGrams;
          let servingsPerContainer = analysisResult.nutrition?.servings_per_container || null;
          
          if (netWeightGrams && finalServingGrams && !servingsPerContainer) {
            servingsPerContainer = Math.round((netWeightGrams / finalServingGrams) * 10) / 10;
            console.log(`Calculated servings: ${netWeightGrams}g / ${finalServingGrams}g = ${servingsPerContainer}`);
          }
          
          // Build final nutrition object
          const applyScale = (value: number) => Math.round(value * scaleFactor * 10) / 10;
          
          analysisResult.nutrition = {
            ...analysisResult.nutrition,
            serving_size: finalServingSize,
            serving_size_grams: finalServingGrams,
            servings_per_container: servingsPerContainer,
            data_source: consensus.consensusReached ? 'multi_verified' : 
                        consensus.bestSource.name === 'AI Label Reading' ? 'ai_extracted' : 'database_verified',
            database_name: consensus.bestSource.name === 'AI Label Reading' ? null : consensus.bestSource.name,
            confidence_score: consensus.qualityScore / 100,
            quality_label: consensus.qualityLabel,
            matching_sources: consensus.matchingSources,
            consensus_reached: consensus.consensusReached,
            all_sources: nutritionSources.map(s => ({
              name: s.name,
              calories: s.nutrition.calories || s.nutrition.per_serving?.calories,
              serving_grams: s.servingGrams,
              confidence: s.confidence
            })),
            per_serving: {
              calories: Math.round((bestNutrition.calories || bestNutrition.per_serving?.calories || 0) * scaleFactor),
              protein_g: applyScale(bestNutrition.protein_g || bestNutrition.per_serving?.protein_g || 0),
              carbs_g: applyScale(bestNutrition.carbs_g || bestNutrition.per_serving?.carbs_g || 0),
              fat_g: applyScale(bestNutrition.fat_g || bestNutrition.per_serving?.fat_g || 0),
              fiber_g: applyScale(bestNutrition.fiber_g || bestNutrition.per_serving?.fiber_g || 0),
              sugars_g: applyScale(bestNutrition.sugars_g || bestNutrition.per_serving?.sugars_g || 0),
              sodium_mg: Math.round((bestNutrition.sodium_mg || bestNutrition.per_serving?.sodium_mg || 0) * scaleFactor),
            }
          };
          
          // Use NOVA score from OpenFoodFacts if available
          if (openFoodFactsResult?.nova_group && analysisResult.detailed_processing) {
            analysisResult.detailed_processing.nova_score = openFoodFactsResult.nova_group;
          }
          
          console.log('✅ Final nutrition applied from:', consensus.bestSource.name);
          console.log('   Calories:', analysisResult.nutrition.per_serving.calories);
          console.log('   Quality:', consensus.qualityLabel);
        } else {
          // No valid sources - use AI extraction as fallback
          console.log('No valid nutrition sources found, using AI extraction');
          analysisResult.nutrition = {
            ...analysisResult.nutrition,
            data_source: 'ai_extracted',
            database_name: null,
            confidence_score: 0.70,
            quality_label: 'estimated',
            matching_sources: [],
            consensus_reached: false
          };
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
