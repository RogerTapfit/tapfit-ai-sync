import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Mercury levels database for fish products (FDA data in ppb - parts per billion)
const MERCURY_DATA: Record<string, { level: string; ppb: number; omega3: string; notes: string }> = {
  // Very Low (< 100 ppb)
  'salmon': { level: 'very_low', ppb: 22, omega3: 'high', notes: 'Wild salmon has lower contaminants than farmed' },
  'sockeye salmon': { level: 'very_low', ppb: 22, omega3: 'very_high', notes: 'Wild sockeye is one of the healthiest fish choices' },
  'atlantic salmon': { level: 'very_low', ppb: 22, omega3: 'high', notes: 'Almost always farm-raised - higher contaminants' },
  'pink salmon': { level: 'very_low', ppb: 22, omega3: 'high', notes: 'Usually wild-caught and affordable' },
  'sardines': { level: 'very_low', ppb: 13, omega3: 'very_high', notes: 'One of the healthiest fish choices' },
  'anchovies': { level: 'very_low', ppb: 17, omega3: 'very_high', notes: 'Very low on food chain, minimal mercury' },
  'tilapia': { level: 'very_low', ppb: 13, omega3: 'low', notes: 'Low mercury but also low omega-3, often farm-raised' },
  'cod': { level: 'very_low', ppb: 95, omega3: 'moderate', notes: 'Good lean protein source' },
  'pollock': { level: 'very_low', ppb: 38, omega3: 'moderate', notes: 'Common in fish sticks and imitation crab' },
  'shrimp': { level: 'very_low', ppb: 12, omega3: 'low', notes: 'Low mercury, low omega-3' },
  'catfish': { level: 'very_low', ppb: 49, omega3: 'low', notes: 'Low mercury, mostly farm-raised in US' },
  'crab': { level: 'very_low', ppb: 65, omega3: 'moderate', notes: 'Low mercury shellfish option' },
  'scallops': { level: 'very_low', ppb: 22, omega3: 'low', notes: 'Very low mercury shellfish' },
  'clams': { level: 'very_low', ppb: 9, omega3: 'moderate', notes: 'Very low mercury, good iron source' },
  'oysters': { level: 'very_low', ppb: 13, omega3: 'moderate', notes: 'Very low mercury, high in zinc' },
  'herring': { level: 'very_low', ppb: 44, omega3: 'very_high', notes: 'Excellent omega-3 source' },
  'trout': { level: 'very_low', ppb: 71, omega3: 'high', notes: 'Rainbow trout is usually farm-raised' },
  
  // Low (100-200 ppb)
  'canned light tuna': { level: 'low', ppb: 128, omega3: 'moderate', notes: 'Safer than albacore, usually skipjack' },
  'skipjack tuna': { level: 'low', ppb: 128, omega3: 'moderate', notes: 'Smaller tuna species, lower mercury' },
  'halibut': { level: 'low', ppb: 188, omega3: 'moderate', notes: 'Good choice, limit to 2-3 servings/week' },
  'mahi mahi': { level: 'low', ppb: 178, omega3: 'low', notes: 'Moderate mercury, lean protein' },
  'snapper': { level: 'low', ppb: 189, omega3: 'moderate', notes: 'Red snapper is moderate mercury' },
  'lobster': { level: 'low', ppb: 166, omega3: 'low', notes: 'Low to moderate mercury' },
  
  // Moderate (200-500 ppb)
  'albacore tuna': { level: 'moderate', ppb: 350, omega3: 'moderate', notes: 'Limit to 6oz/week for adults' },
  'white tuna': { level: 'moderate', ppb: 350, omega3: 'moderate', notes: 'Same as albacore - higher mercury' },
  'canned albacore tuna': { level: 'moderate', ppb: 350, omega3: 'moderate', notes: 'Limit to 1 can/week' },
  'yellowfin tuna': { level: 'moderate', ppb: 354, omega3: 'moderate', notes: 'Ahi tuna - limit consumption' },
  'ahi tuna': { level: 'moderate', ppb: 354, omega3: 'moderate', notes: 'Popular in sushi - moderate mercury' },
  'grouper': { level: 'moderate', ppb: 448, omega3: 'low', notes: 'Higher mercury, limit consumption' },
  'sea bass': { level: 'moderate', ppb: 354, omega3: 'moderate', notes: 'Chilean sea bass is higher' },
  'chilean sea bass': { level: 'moderate', ppb: 354, omega3: 'moderate', notes: 'Also called Patagonian toothfish' },
  'bluefish': { level: 'moderate', ppb: 368, omega3: 'high', notes: 'Good omega-3 but higher mercury' },
  
  // High (500-1000 ppb)
  'bigeye tuna': { level: 'high', ppb: 689, omega3: 'moderate', notes: 'Common in sushi - avoid frequent consumption' },
  'orange roughy': { level: 'high', ppb: 554, omega3: 'moderate', notes: 'High mercury, slow to reproduce' },
  'marlin': { level: 'high', ppb: 485, omega3: 'moderate', notes: 'Large predatory fish - high mercury' },
  
  // Very High (> 1000 ppb) - FDA advises avoiding
  'shark': { level: 'very_high', ppb: 988, omega3: 'moderate', notes: 'FDA advises against consumption' },
  'swordfish': { level: 'very_high', ppb: 976, omega3: 'moderate', notes: 'FDA advises against consumption' },
  'king mackerel': { level: 'very_high', ppb: 730, omega3: 'high', notes: 'Avoid despite high omega-3' },
  'tilefish': { level: 'very_high', ppb: 1450, omega3: 'moderate', notes: 'Highest mercury - FDA warning' },
  'tilefish gulf': { level: 'very_high', ppb: 1450, omega3: 'moderate', notes: 'Gulf of Mexico variety - highest mercury' },
};

// Helper function to find mercury data for a fish product
function getMercuryData(productName: string): { level: string; ppb: number; omega3: string; notes: string } | null {
  const lowerName = productName.toLowerCase();
  
  // Try exact match first
  if (MERCURY_DATA[lowerName]) {
    return MERCURY_DATA[lowerName];
  }
  
  // Try partial match
  for (const [fishName, data] of Object.entries(MERCURY_DATA)) {
    if (lowerName.includes(fishName) || fishName.includes(lowerName.split(' ')[0])) {
      return data;
    }
  }
  
  return null;
}

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

// Dedicated barcode pre-detection pass - runs BEFORE main analysis
async function detectBarcodeOnly(imageBase64: string, apiKey: string): Promise<string | null> {
  console.log('🔍 Running dedicated barcode detection pass...');
  
  const barcodePrompt = `You are a barcode/UPC reader. ONLY look for barcode numbers in this image.

Look for:
1. UPC-A: 12 digits under barcode bars (e.g., "049000000443")
2. EAN-13: 13 digits under barcode bars
3. UPC-E: 8 digits (compact)
4. The numbers are usually printed BELOW the barcode lines

If you see a barcode, return ONLY the digits (e.g., "810051807981").
If no barcode is visible, return "NONE".

Return ONLY the digits or "NONE", nothing else.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: barcodePrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              },
              { type: "text", text: "Extract the barcode digits from this image." }
            ]
          }
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content || content === 'NONE' || content.length < 8) {
      console.log('No barcode detected in dedicated pass');
      return null;
    }
    
    // Clean to digits only
    const digits = content.replace(/[^0-9]/g, '');
    if (digits.length >= 8 && digits.length <= 14) {
      console.log('✅ Barcode detected in dedicated pass:', digits);
      return digits;
    }
    
    return null;
  } catch (error) {
    console.error('Barcode detection pass error:', error);
    return null;
  }
}

// Direct UPC/Barcode lookup on OpenFoodFacts (most accurate for branded products)
async function lookupByUPC(barcode: string): Promise<any> {
  try {
    const cleanBarcode = barcode.replace(/[^0-9]/g, '');
    if (!cleanBarcode || cleanBarcode.length < 8) {
      console.log('Invalid barcode format:', barcode);
      return null;
    }
    
    console.log('Looking up UPC directly:', cleanBarcode);
    const url = `https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TapFit App - Contact: support@tapfit.app' }
    });
    
    if (!response.ok) {
      console.log('UPC lookup failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      const product = data.product;
      const nutriments = product.nutriments || {};
      
      const servingSize = product.serving_size || '100g';
      const hasServingData = nutriments['energy-kcal_serving'] !== undefined;
      
      console.log('✅ UPC EXACT MATCH:', product.product_name, 'by', product.brands);
      
      // Extract sourcing information from OpenFoodFacts
      const labelsTags = product.labels_tags || [];
      const originsTags = product.origins_tags || [];
      const categoriesTags = product.categories_tags || [];
      const manufacturingPlaces = product.manufacturing_places_tags || [];
      
      // Parse organic status from labels
      const isOrganic = labelsTags.some((l: string) => 
        l.includes('organic') || l.includes('bio') || l.includes('usda-organic')
      );
      
      // Parse fish sourcing from labels
      const isWildCaught = labelsTags.some((l: string) => 
        l.includes('wild') || l.includes('msc') || l.includes('wild-caught')
      );
      const isFarmRaised = labelsTags.some((l: string) => 
        l.includes('farm') || l.includes('asc') || l.includes('aquaculture') || l.includes('farm-raised')
      );
      const mscCertified = labelsTags.includes('en:msc') || labelsTags.some((l: string) => l.includes('msc'));
      const ascCertified = labelsTags.includes('en:asc') || labelsTags.some((l: string) => l.includes('asc'));
      
      // Check if it's a fish product
      const isFishProduct = categoriesTags.some((c: string) => 
        c.includes('fish') || c.includes('seafood') || c.includes('salmon') || 
        c.includes('tuna') || c.includes('shrimp') || c.includes('crab')
      );
      
      // Parse country of origin
      const originCountry = originsTags.length > 0 
        ? originsTags[0].replace('en:', '').replace(/-/g, ' ')
        : (product.origins || product.countries_tags?.[0]?.replace('en:', '') || null);
      
      return {
        source: 'upc_lookup',
        exact_match: true,
        product_name: product.product_name,
        brand: product.brands,
        barcode: cleanBarcode,
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
        is_per_100g: !hasServingData,
        ingredients: product.ingredients_text,
        nova_group: product.nova_group,
        nutriscore: product.nutriscore_grade,
        ecoscore_grade: product.ecoscore_grade,
        image_url: product.image_url,
        // Sourcing data
        sourcing: {
          labels_tags: labelsTags,
          origins_tags: originsTags,
          manufacturing_places: manufacturingPlaces,
          categories_tags: categoriesTags,
          is_organic: isOrganic,
          origin_country: originCountry,
          is_fish_product: isFishProduct,
          fish_sourcing: isFishProduct ? {
            is_wild: isWildCaught,
            is_farmed: isFarmRaised,
            msc_certified: mscCertified,
            asc_certified: ascCertified,
          } : null,
        }
      };
    }
    
    console.log('UPC not found in OpenFoodFacts');
    return null;
  } catch (error) {
    console.error('UPC lookup error:', error);
    return null;
  }
}

// Fallback UPC lookup using UPCitemDB (free tier)
async function lookupUPCitemDB(barcode: string): Promise<any> {
  try {
    console.log('Trying UPCitemDB for:', barcode);
    const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.log('UPCitemDB failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.code === 'OK' && data.items?.length > 0) {
      const item = data.items[0];
      console.log('✅ UPCitemDB found:', item.title);
      
      return {
        source: 'upcitemdb',
        exact_match: true,
        product_name: item.title,
        brand: item.brand,
        barcode: barcode,
        // UPCitemDB doesn't provide nutrition, just product info
        nutrition: null,
        category: item.category,
        image_url: item.images?.[0],
      };
    }
    
    return null;
  } catch (error) {
    console.error('UPCitemDB error:', error);
    return null;
  }
}

// Multi-database UPC lookup with fallbacks
async function lookupUPCMultiple(barcode: string): Promise<any> {
  // Try OpenFoodFacts first (has nutrition data)
  let result = await lookupByUPC(barcode);
  if (result?.nutrition?.calories > 0) {
    return result;
  }
  
  // Try UPCitemDB as fallback (product info but no nutrition)
  const upcItemDbResult = await lookupUPCitemDB(barcode);
  if (upcItemDbResult) {
    console.log('Found product in UPCitemDB (no nutrition data)');
    return upcItemDbResult;
  }
  
  return result; // Return OpenFoodFacts result even if no calories
}

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
  isExactMatch?: boolean;
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
  
  // UPC lookup is always highest priority (exact match)
  const upcSource = validSources.find(s => s.isExactMatch);
  if (upcSource) {
    console.log('✅ Using UPC exact match - highest accuracy');
    return {
      bestSource: upcSource,
      consensusReached: true,
      matchingSources: [upcSource.name],
      qualityScore: 99,
      qualityLabel: 'verified'
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

// Validate AI response has complete nutrition data
function validateNutritionResponse(result: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!result?.nutrition) {
    issues.push('Missing nutrition object');
    return { isValid: false, issues };
  }
  
  const nutrition = result.nutrition;
  const perServing = nutrition.per_serving || nutrition;
  
  // Check for truncated/null values
  if (nutrition.serving_size === null || nutrition.serving_size === undefined) {
    issues.push('Serving size is null');
  }
  
  if (perServing.calories === null || perServing.calories === undefined || perServing.calories === 0) {
    // Allow 0 calories for water/diet drinks
    if (!result.product?.name?.toLowerCase().includes('water') && 
        !result.product?.name?.toLowerCase().includes('diet')) {
      issues.push('Calories is null or 0');
    }
  }
  
  // Check for obviously wrong values (negative, NaN)
  if (typeof perServing.calories === 'number' && (isNaN(perServing.calories) || perServing.calories < 0)) {
    issues.push('Invalid calorie value');
  }
  
  // Check if macros are all 0 (suspicious for food)
  if (perServing.protein_g === 0 && perServing.carbs_g === 0 && perServing.fat_g === 0 && perServing.calories > 50) {
    issues.push('All macros are 0 but calories > 50');
  }
  
  return { 
    isValid: issues.length === 0,
    issues 
  };
}

// Second-pass focused nutrition extraction
async function extractNutritionOnly(imageBase64: string, apiKey: string, productName?: string): Promise<any> {
  console.log('🔄 Running focused nutrition extraction pass...');
  
  const nutritionPrompt = `You are a nutrition label reader. ONLY extract exact numbers from the Nutrition Facts label in this image.

Product name for context: ${productName || 'Unknown'}

Look for the Nutrition Facts panel and extract EXACT values. Read carefully - do not estimate or guess.

Return ONLY this JSON (no markdown):
{
  "serving_size": "exact text from label (e.g., '1 package (28g)')",
  "serving_size_grams": number,
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number,
  "sugars_g": number,
  "sodium_mg": number,
  "confidence": 0.0-1.0,
  "label_visible": true/false,
  "notes": "any issues reading the label"
}

CRITICAL:
- Return EXACT numbers from the label, not estimates
- If you can't see a value clearly, use null instead of guessing
- confidence should reflect how clearly you can read the label
- label_visible should be false if no nutrition facts panel is visible`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: nutritionPrompt },
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
                text: "Extract the exact nutrition values from this label. Return ONLY valid JSON."
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.log('Nutrition extraction pass failed:', response.status);
      return null;
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) return null;
    
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(content);
    console.log('Nutrition extraction result:', result);
    
    if (result.label_visible === false || result.confidence < 0.5) {
      console.log('Low confidence or no label visible in second pass');
      return { ...result, label_not_visible: true };
    }
    
    return result;
  } catch (error) {
    console.error('Nutrition extraction error:', error);
    return null;
  }
}

// Detect if nutrition label is visible in image
async function detectNutritionLabelVisibility(imageBase64: string, apiKey: string): Promise<{ visible: boolean; confidence: number; side_detected: string }> {
  console.log('🔍 Checking if nutrition label is visible...');
  
  const detectPrompt = `Look at this product image and determine if a NUTRITION FACTS LABEL is visible.

Return ONLY this JSON:
{
  "nutrition_label_visible": true/false,
  "confidence": 0.0-1.0,
  "side_detected": "front|back|side|unknown",
  "can_read_calories": true/false,
  "notes": "what you can see"
}

- "nutrition_label_visible" = true ONLY if you can see the actual Nutrition Facts panel with calorie/macro values
- "side_detected" = which side of the package is shown
- "can_read_calories" = true if you can clearly see and read the calorie number`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: detectPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              },
              { type: "text", text: "Is the nutrition facts label visible? Return JSON." }
            ]
          }
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) return { visible: false, confidence: 0, side_detected: 'unknown' };

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return { visible: false, confidence: 0, side_detected: 'unknown' };
    
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(content);
    
    console.log('Label visibility check:', result);
    return {
      visible: result.nutrition_label_visible && result.can_read_calories,
      confidence: result.confidence || 0,
      side_detected: result.side_detected || 'unknown'
    };
  } catch (error) {
    console.error('Label visibility detection error:', error);
    return { visible: false, confidence: 0, side_detected: 'unknown' };
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

⚠️ BARCODE/UPC DETECTION - EXTREMELY IMPORTANT:
Look for ANY barcode (UPC, EAN, QR code) visible in the image:
1. Standard UPC-A: 12 digits under barcode bars (e.g., "049000000443")
2. EAN-13: 13 digits under barcode bars (e.g., "4902777273501")
3. UPC-E: 8 digits (compact version)
4. The numbers are usually printed BELOW the barcode lines
5. Return the EXACT digits you see - this enables 100% accurate database lookup

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

⚠️ SOURCING & ORIGIN DETECTION - CRITICAL FOR FOOD/BEVERAGE:
Carefully scan the packaging for sourcing information:

1. ORGANIC STATUS:
   - Look for: "USDA Organic", "Certified Organic", "EU Organic", "Bio" logo, organic certification seals
   - If not organic, assume conventional farming with potential pesticide use
   - "Non-GMO" is NOT the same as organic - many non-GMO products still use pesticides
   - For produce: conventional = pesticide concern is "moderate" to "high"

2. COUNTRY OF ORIGIN:
   - Look for: "Product of [Country]", "Made in [Country]", "Imported from [Country]", "Distributed by", origin statements
   - Look for country flags or origin seals
   - US products often show state: "California Almonds", "Wild Alaskan Salmon"
   - Common imports to note: China, India, Thailand, Chile, Vietnam, Mexico

3. FISH/SEAFOOD SOURCING (EXTREMELY IMPORTANT - affects health significantly):
   - "Wild Caught" or "Wild" = wild_caught (better)
   - "Farm Raised", "Aquaculture", "Farmed" = farm_raised (more contaminants)
   - "Atlantic Salmon" on labels = almost ALWAYS farmed (even if not stated)
   - "Sockeye", "Wild Alaskan", "Wild Pacific", "Alaskan" = usually wild
   - MSC (Marine Stewardship Council) blue logo = sustainable wild-caught
   - ASC (Aquaculture Stewardship Council) teal logo = responsible farming
   - BAP (Best Aquaculture Practices) = farm-raised certification
   
4. MERCURY LEVELS FOR FISH (provide this info in fish_analysis):
   - Very Low (<100 ppb): Salmon (all), Sardines, Tilapia, Cod, Pollock, Shrimp, Catfish
   - Low (100-200 ppb): Canned light tuna, Halibut, Mahi mahi
   - Moderate (200-500 ppb): Albacore tuna, Yellowfin tuna, Grouper, Sea bass
   - High (500-1000 ppb): Bigeye tuna, Orange roughy
   - Very High (>1000 ppb): Shark, Swordfish, King mackerel, Tilefish - FDA WARNS TO AVOID

5. FARMING METHOD INDICATORS (for meat, eggs, dairy):
   - "Grass-Fed", "100% Grass-Fed" = healthier fat profile
   - "Pasture-Raised" = animals had outdoor access
   - "Free-Range" = some outdoor access (less than pasture-raised)
   - "Cage-Free" = not in cages but usually indoors
   - No labels = assume factory farmed (conventionally raised)
   - "Antibiotic-Free", "No Hormones" = partial improvement

6. FARMED VS WILD SALMON EDUCATION (include in health_insights for salmon):
   - Farm-raised salmon concerns: 5-10x higher PCB levels, higher dioxins, artificial colorants (astaxanthin) to make flesh pink, antibiotics used, lower omega-3/omega-6 ratio, higher saturated fat
   - Wild salmon benefits: natural diet, lower contaminants, better omega ratios, no antibiotics, natural color
   - "Atlantic Salmon" = almost 100% farm-raised regardless of packaging claims
   - Best choices: Wild Alaskan, Sockeye, Pink salmon, Coho (wild)

FOR ALL PRODUCTS - Return valid JSON with this structure:

{
  "product_type": "food|beverage|supplement|medication",
  "barcode": "EXACT digits from UPC/EAN barcode if visible, or null if not visible",
  "barcode_type": "UPC-A|EAN-13|UPC-E|null",
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
  
  "sourcing_analysis": {
    "organic_status": {
      "is_organic": false,
      "certification": "USDA Organic|EU Organic|None",
      "pesticide_concern": "none|low|moderate|high",
      "pesticide_details": "Description of pesticide concerns for conventional produce"
    },
    "country_of_origin": {
      "country": "USA|China|India|Thailand|Chile|etc.",
      "region": "California, USA|Alaska, etc.",
      "text_found": "EXACT text from label like 'Product of India' or 'Imported from Chile'",
      "locally_sourced": false
    },
    "farming_method": {
      "method": "conventional|organic|wild_caught|farm_raised|pasture_raised|cage_free|free_range|grass_fed|grain_fed",
      "is_factory_farmed": false,
      "details": "Description of farming method detected from packaging",
      "health_impact": "none|positive|negative",
      "health_education": "Educational content explaining why this farming method matters for health"
    },
    "fish_analysis": {
      "is_fish_product": false,
      "fish_type": "salmon|tuna|tilapia|cod|shrimp|etc.",
      "sourcing": "wild_caught|farm_raised|unknown",
      "mercury_level": "very_low|low|moderate|high|very_high",
      "mercury_ppb": 0,
      "omega3_ratio": "high|moderate|low",
      "sustainability_rating": "MSC Certified|ASC Certified|None",
      "health_insights": {
        "pros": ["List of health benefits"],
        "cons": ["List of health concerns"],
        "recommendation": "Specific actionable recommendation"
      }
    },
    "certifications": [
      {
        "name": "USDA Organic|Non-GMO|MSC|ASC|Fair Trade|Rainforest Alliance|etc.",
        "verified": true,
        "what_it_means": "Description of what this certification guarantees"
      }
    ],
    "sourcing_grade": "A|B|C|D|F",
    "sourcing_score": 85
  },
  
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

    // Run dedicated barcode detection pass FIRST (safety net)
    const preDetectedBarcode = await detectBarcodeOnly(imageBase64, LOVABLE_API_KEY);
    if (preDetectedBarcode) {
      console.log('✅ Pre-detected barcode:', preDetectedBarcode);
    }

    // First pass - full product analysis
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
                text: "Analyze this product comprehensively. FIRST look for any barcode/UPC numbers. Detect if it's food, beverage, supplement, or medication. Provide complete analysis including quality rating, ingredients, safety, and recommendations. Return ONLY valid JSON."
              }
            ]
          }
        ],
        max_tokens: 16000, // Increased to prevent truncation
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

    console.log('Raw AI response length:', content.length);
    console.log('Raw AI response preview:', content.substring(0, 500));

    // Check for truncation (response ends mid-word or incomplete JSON)
    const isTruncated = !content.endsWith('}') && !content.endsWith('}\n') && !content.endsWith('```');
    if (isTruncated) {
      console.log('⚠️ Response appears truncated, attempting repair...');
    }

    // Clean up response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Try to extract valid JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysisResult = JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          // Try to fix common truncation issues
          let fixedContent = jsonMatch[0];
          // Count open braces and close missing ones
          const openBraces = (fixedContent.match(/\{/g) || []).length;
          const closeBraces = (fixedContent.match(/\}/g) || []).length;
          const openBrackets = (fixedContent.match(/\[/g) || []).length;
          const closeBrackets = (fixedContent.match(/\]/g) || []).length;
          
          for (let i = 0; i < openBrackets - closeBrackets; i++) fixedContent += ']';
          for (let i = 0; i < openBraces - closeBraces; i++) fixedContent += '}';
          
          analysisResult = JSON.parse(fixedContent);
          console.log('✅ Fixed truncated JSON');
        }
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    console.log('AI identified product:', analysisResult.product?.name, 'Brand:', analysisResult.product?.brand);
    console.log('Barcode detected:', analysisResult.barcode, 'Type:', analysisResult.barcode_type);
    
    // Use pre-detected barcode if main analysis missed it
    if (!analysisResult.barcode && preDetectedBarcode) {
      console.log('✅ Using pre-detected barcode:', preDetectedBarcode);
      analysisResult.barcode = preDetectedBarcode;
      analysisResult.barcode_type = preDetectedBarcode.length === 12 ? 'UPC-A' : 
                                     preDetectedBarcode.length === 13 ? 'EAN-13' : 
                                     preDetectedBarcode.length === 8 ? 'UPC-E' : 'unknown';
    }

    // ===== NUTRITION LABEL VISIBILITY CHECK =====
    const labelVisibility = await detectNutritionLabelVisibility(imageBase64, LOVABLE_API_KEY);
    console.log('Label visibility:', labelVisibility);
    
    // Add visibility info to result
    analysisResult.nutrition_label_visible = labelVisibility.visible;
    analysisResult.side_detected = labelVisibility.side_detected;
    analysisResult.needs_nutrition_scan = !labelVisibility.visible && ['food', 'beverage'].includes(analysisResult.product_type);

    // ===== RESPONSE VALIDATION & RETRY =====
    const validation = validateNutritionResponse(analysisResult);
    const nutritionLabelNotVisible = !labelVisibility.visible || labelVisibility.confidence < 0.5;
    
    if (!validation.isValid && ['food', 'beverage'].includes(analysisResult.product_type)) {
      console.log('⚠️ Nutrition validation failed:', validation.issues.join(', '));
      
      // Only try second pass if label might be partially visible
      if (!nutritionLabelNotVisible) {
        console.log('🔄 Running second-pass nutrition extraction...');
        
        const secondPassNutrition = await extractNutritionOnly(
          imageBase64, 
          LOVABLE_API_KEY, 
          analysisResult.product?.name
        );
        
        if (secondPassNutrition && !secondPassNutrition.label_not_visible && secondPassNutrition.calories > 0) {
          console.log('✅ Second pass succeeded, applying nutrition data');
          analysisResult.nutrition = {
            ...analysisResult.nutrition,
            serving_size: secondPassNutrition.serving_size || analysisResult.nutrition?.serving_size,
            serving_size_grams: secondPassNutrition.serving_size_grams || analysisResult.nutrition?.serving_size_grams,
            label_confidence: secondPassNutrition.confidence,
            per_serving: {
              calories: secondPassNutrition.calories,
              protein_g: secondPassNutrition.protein_g || 0,
              carbs_g: secondPassNutrition.carbs_g || 0,
              fat_g: secondPassNutrition.fat_g || 0,
              fiber_g: secondPassNutrition.fiber_g || 0,
              sugars_g: secondPassNutrition.sugars_g || 0,
              sodium_mg: secondPassNutrition.sodium_mg || 0,
            }
          };
          analysisResult.needs_nutrition_scan = false;
        } else if (secondPassNutrition?.label_not_visible) {
          console.log('📋 Nutrition label not visible - user needs to scan back of package');
          analysisResult.needs_nutrition_scan = true;
        }
      } else {
        console.log('📋 Nutrition label not visible - skipping second pass, will prompt user');
        analysisResult.needs_nutrition_scan = true;
      }
    }

    // ===== UPC BARCODE LOOKUP (HIGHEST PRIORITY) =====
    let upcResult = null;
    if (analysisResult.barcode) {
      console.log('🔍 Attempting multi-database UPC lookup for:', analysisResult.barcode);
      upcResult = await lookupUPCMultiple(analysisResult.barcode);
    }

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
      
      if (productName || upcResult) {
        console.log('=== MULTI-SOURCE NUTRITION LOOKUP ===');
        console.log('Searching for:', productName, 'by', brand);
        
        // Search multiple databases in parallel (skip if we have UPC result)
        let openFoodFactsResult = null;
        let usdaResult = null;
        
        // IMPORTANT: Only use database lookups if:
        // 1. We have a UPC barcode (exact match), OR
        // 2. The nutrition label IS visible (so we can validate against it)
        // If nutrition label is NOT visible, database lookups are risky (could get wrong generic product)
        const shouldUseDatabaseFallback = upcResult || labelVisibility.visible || analysisResult.barcode;
        
        if (!upcResult && shouldUseDatabaseFallback) {
          [openFoodFactsResult, usdaResult] = await Promise.all([
            searchOpenFoodFacts(productName, brand),
            searchUSDA(productName, brand)
          ]);
        } else if (!upcResult && !shouldUseDatabaseFallback) {
          console.log('⚠️ Skipping database lookups - no barcode and nutrition label not visible');
          console.log('   User should scan back of package for accurate nutrition');
        }
        
        // Build sources array for consensus voting
        const nutritionSources: NutritionSource[] = [];
        
        // UPC lookup is HIGHEST priority (exact match)
        if (upcResult?.nutrition?.calories > 0) {
          const servingGrams = upcResult.is_per_100g ? 100 : (upcResult.serving_size_grams || parseServingWeight(upcResult.serving_size));
          nutritionSources.push({
            name: 'UPC Lookup',
            priority: 0, // Highest priority
            nutrition: upcResult.nutrition,
            servingGrams: servingGrams,
            confidence: 0.99,
            isExactMatch: true
          });
          console.log('✅ UPC source added (EXACT):', upcResult.nutrition.calories, 'cal per', servingGrams, 'g');
        }
        
        // Add AI Label Reading as a source
        // PRIORITIZE confident AI reading that conflicts >50% with database results
        if (aiCalories > 0 && aiServingWeight) {
          let aiPriority = 3; // Default low priority
          
          if (aiLabelConfidence >= 0.9) {
            aiPriority = 1; // High priority if very confident
            
            // Check if database sources differ by >50% from AI reading
            const checkConflict = (dbCals: number, dbServingGrams: number) => {
              if (!dbCals || !dbServingGrams) return false;
              const aiCalsPerGram = aiCalories / aiServingWeight;
              const dbCalsPerGram = dbCals / dbServingGrams;
              const diff = Math.abs(aiCalsPerGram - dbCalsPerGram) / Math.max(aiCalsPerGram, dbCalsPerGram);
              return diff > 0.5; // >50% difference
            };
            
            // If there's a major conflict and AI is confident, trust AI
            if (openFoodFactsResult?.nutrition?.calories > 0 && 
                checkConflict(openFoodFactsResult.nutrition.calories, openFoodFactsResult.serving_size_grams)) {
              console.log('⚠️ AI Label conflicts >50% with OpenFoodFacts - prioritizing AI reading');
              aiPriority = 0; // Give AI highest priority
            }
            if (usdaResult?.nutrition?.calories > 0 && 
                checkConflict(usdaResult.nutrition.calories, usdaResult.serving_size_grams)) {
              console.log('⚠️ AI Label conflicts >50% with USDA - prioritizing AI reading');
              aiPriority = 0;
            }
          }
          
          nutritionSources.push({
            name: 'AI Label Reading',
            priority: aiPriority,
            nutrition: analysisResult.nutrition.per_serving,
            servingGrams: aiServingWeight,
            confidence: aiLabelConfidence
          });
          console.log('AI Label source added:', aiCalories, 'cal per', aiServingWeight, 'g, priority:', aiPriority);
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
          
          // For UPC exact match with per-100g data, scale to detected serving size
          if (consensus.bestSource.isExactMatch && upcResult?.is_per_100g && aiServingWeight) {
            scaleFactor = aiServingWeight / 100;
            console.log(`Scaling UPC per-100g data to ${aiServingWeight}g serving (factor: ${scaleFactor.toFixed(2)})`);
          } else if (aiServingWeight && bestServingGrams && aiServingWeight !== bestServingGrams) {
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
            data_source: consensus.bestSource.isExactMatch ? 'upc_verified' : 
                        consensus.consensusReached ? 'multi_verified' : 
                        consensus.bestSource.name === 'AI Label Reading' ? 'ai_extracted' : 'database_verified',
            database_name: consensus.bestSource.name,
            confidence_score: consensus.qualityScore / 100,
            quality_label: consensus.qualityLabel,
            matching_sources: consensus.matchingSources,
            consensus_reached: consensus.consensusReached,
            all_sources: nutritionSources.map(s => ({
              name: s.name,
              calories: s.nutrition.calories || s.nutrition.per_serving?.calories,
              serving_grams: s.servingGrams,
              confidence: s.confidence,
              is_exact_match: s.isExactMatch || false
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
          
          // Use NOVA score from OpenFoodFacts/UPC if available
          const novaSource = upcResult?.nova_group || openFoodFactsResult?.nova_group;
          if (novaSource && analysisResult.detailed_processing) {
            analysisResult.detailed_processing.nova_score = novaSource;
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

    // ===== ENRICH SOURCING ANALYSIS WITH UPC DATA =====
    if (upcResult?.sourcing && analysisResult.sourcing_analysis) {
      console.log('Enriching sourcing analysis with UPC data...');
      
      // Merge UPC sourcing data into AI-detected sourcing
      if (upcResult.sourcing.is_organic && !analysisResult.sourcing_analysis.organic_status?.is_organic) {
        analysisResult.sourcing_analysis.organic_status = {
          ...analysisResult.sourcing_analysis.organic_status,
          is_organic: true,
          certification: 'Database Verified'
        };
      }
      
      if (upcResult.sourcing.origin_country && !analysisResult.sourcing_analysis.country_of_origin?.country) {
        analysisResult.sourcing_analysis.country_of_origin = {
          country: upcResult.sourcing.origin_country,
          locally_sourced: false
        };
      }
      
      // Enrich fish sourcing from UPC data
      if (upcResult.sourcing.is_fish_product && analysisResult.sourcing_analysis.fish_analysis) {
        if (upcResult.sourcing.fish_sourcing?.is_wild && !analysisResult.sourcing_analysis.fish_analysis.sourcing) {
          analysisResult.sourcing_analysis.fish_analysis.sourcing = 'wild_caught';
        }
        if (upcResult.sourcing.fish_sourcing?.is_farmed && !analysisResult.sourcing_analysis.fish_analysis.sourcing) {
          analysisResult.sourcing_analysis.fish_analysis.sourcing = 'farm_raised';
        }
        if (upcResult.sourcing.fish_sourcing?.msc_certified) {
          analysisResult.sourcing_analysis.fish_analysis.sustainability_rating = 'MSC Certified';
        }
        if (upcResult.sourcing.fish_sourcing?.asc_certified) {
          analysisResult.sourcing_analysis.fish_analysis.sustainability_rating = 'ASC Certified';
        }
      }
    }

    // ===== ENRICH FISH ANALYSIS WITH MERCURY DATA =====
    if (analysisResult.sourcing_analysis?.fish_analysis?.is_fish_product) {
      const fishType = analysisResult.sourcing_analysis.fish_analysis.fish_type || 
                       analysisResult.product?.name || '';
      const mercuryInfo = getMercuryData(fishType);
      
      if (mercuryInfo) {
        console.log('Enriching fish analysis with mercury data for:', fishType);
        analysisResult.sourcing_analysis.fish_analysis.mercury_level = mercuryInfo.level as any;
        analysisResult.sourcing_analysis.fish_analysis.mercury_ppb = mercuryInfo.ppb;
        analysisResult.sourcing_analysis.fish_analysis.omega3_ratio = mercuryInfo.omega3 as any;
        
        // Add mercury notes to health insights
        if (!analysisResult.sourcing_analysis.fish_analysis.health_insights) {
          analysisResult.sourcing_analysis.fish_analysis.health_insights = {
            pros: [],
            cons: [],
            recommendation: ''
          };
        }
        
        // Add mercury-specific warnings for high mercury fish
        if (mercuryInfo.level === 'high' || mercuryInfo.level === 'very_high') {
          if (!analysisResult.sourcing_analysis.fish_analysis.health_insights.cons.includes(mercuryInfo.notes)) {
            analysisResult.sourcing_analysis.fish_analysis.health_insights.cons.push(mercuryInfo.notes);
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
