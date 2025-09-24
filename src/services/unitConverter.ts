/**
 * TapFit Recipe Unit Converter
 * Converts various units to grams using density tables
 */

// Density data in grams per cup (240ml)
const DENSITY_TABLE: Record<string, number> = {
  // Pasta (cooked)
  'pasta cooked': 140,
  'rotini pasta': 140,
  'penne pasta': 140,
  'spaghetti pasta': 140,
  'macaroni pasta': 140,
  'fusilli pasta': 140,
  
  // Pasta (dry)
  'pasta dry': 100,
  'rotini pasta dry': 100,
  
  // Sauces
  'marinara sauce': 245,
  'tomato sauce': 245,
  'pasta sauce': 245,
  'alfredo sauce': 240,
  'pesto sauce': 220,
  
  // Cheese
  'mozzarella cheese shredded': 112,
  'cheddar cheese shredded': 113,
  'parmesan cheese grated': 100,
  'cheese shredded': 112,
  
  // Meats (raw weights typically given in pounds/ounces)
  'ground beef': 240, // per cup if somehow measured by volume
  'chicken breast': 240,
  
  // Vegetables
  'onion diced': 160,
  'bell pepper diced': 120,
  'mushrooms sliced': 70,
  'spinach fresh': 30,
  'tomatoes diced': 180,
  
  // Oils and liquids
  'olive oil': 216,
  'butter': 227,
  'milk': 245,
  'water': 240,
  'broth': 240,
};

// Standard jar/can sizes in grams
const CONTAINER_SIZES: Record<string, number> = {
  'marinara jar': 680, // 24 oz jar
  'pasta sauce jar': 680,
  'tomato sauce can': 411, // 14.5 oz can
  'diced tomatoes can': 411,
  'tomato paste can': 170, // 6 oz can
  'broth can': 411,
  'chicken broth can': 411,
};

export interface ConversionResult {
  grams: number;
  confidence: number;
  assumptions: string[];
}

export function convertToGrams(
  amount: number, 
  unit: string, 
  foodName: string, 
  prep?: string
): ConversionResult {
  const assumptions: string[] = [];
  let confidence = 1.0;
  let grams = 0;

  const normalizedUnit = unit.toLowerCase();
  const normalizedFood = foodName.toLowerCase();
  const foodKey = prep ? `${normalizedFood} ${prep}` : normalizedFood;

  switch (normalizedUnit) {
    case 'gram':
    case 'grams':
    case 'g':
      grams = amount;
      break;
      
    case 'pound':
    case 'lb':
    case 'lbs':
      grams = amount * 453.592;
      break;
      
    case 'ounce':
    case 'oz':
      grams = amount * 28.3495;
      break;
      
    case 'cup':
    case 'cups':
      // Look for specific food in density table
      let density = DENSITY_TABLE[foodKey] || DENSITY_TABLE[normalizedFood];
      
      if (!density) {
        // Try partial matches
        for (const [key, value] of Object.entries(DENSITY_TABLE)) {
          if (normalizedFood.includes(key.split(' ')[0]) || key.includes(normalizedFood.split(' ')[0])) {
            density = value;
            assumptions.push(`Used density for "${key}" for ingredient "${foodName}"`);
            confidence -= 0.1;
            break;
          }
        }
      }
      
      if (!density) {
        // Default to water density
        density = 240;
        assumptions.push(`Used default water density for unknown ingredient "${foodName}"`);
        confidence -= 0.3;
      }
      
      grams = amount * density;
      break;
      
    case 'tablespoon':
    case 'tbsp':
      // 1 tablespoon = 1/16 cup
      const tbspDensity = DENSITY_TABLE[foodKey] || DENSITY_TABLE[normalizedFood] || 240;
      grams = amount * (tbspDensity / 16);
      if (!DENSITY_TABLE[foodKey] && !DENSITY_TABLE[normalizedFood]) {
        assumptions.push(`Used default density for tablespoon measurement of "${foodName}"`);
        confidence -= 0.2;
      }
      break;
      
    case 'teaspoon':
    case 'tsp':
      // 1 teaspoon = 1/48 cup
      const tspDensity = DENSITY_TABLE[foodKey] || DENSITY_TABLE[normalizedFood] || 240;
      grams = amount * (tspDensity / 48);
      if (!DENSITY_TABLE[foodKey] && !DENSITY_TABLE[normalizedFood]) {
        assumptions.push(`Used default density for teaspoon measurement of "${foodName}"`);
        confidence -= 0.2;
      }
      break;
      
    case 'jar':
      const jarSize = CONTAINER_SIZES[`${normalizedFood} jar`] || CONTAINER_SIZES['marinara jar'];
      grams = amount * jarSize;
      if (!CONTAINER_SIZES[`${normalizedFood} jar`]) {
        assumptions.push(`Assumed jar size of ${jarSize}g for "${foodName}"`);
        confidence -= 0.2;
      }
      break;
      
    case 'can':
      const canSize = CONTAINER_SIZES[`${normalizedFood} can`] || 411; // Default 14.5 oz can
      grams = amount * canSize;
      if (!CONTAINER_SIZES[`${normalizedFood} can`]) {
        assumptions.push(`Assumed can size of ${canSize}g for "${foodName}"`);
        confidence -= 0.2;
      }
      break;
      
    case 'package':
    case 'pkg':
      // This is very food-dependent, need better assumptions
      if (normalizedFood.includes('pasta')) {
        grams = amount * 454; // 1 lb package
        assumptions.push(`Assumed 1 lb pasta package for "${foodName}"`);
      } else {
        grams = amount * 200; // Generic package size
        assumptions.push(`Assumed 200g package size for "${foodName}"`);
      }
      confidence -= 0.3;
      break;
      
    default:
      // Handle piece/slice/clove etc
      if (['slice', 'slices'].includes(normalizedUnit)) {
        if (normalizedFood.includes('bread')) {
          grams = amount * 28; // ~1 oz per slice
        } else if (normalizedFood.includes('cheese')) {
          grams = amount * 21; // thin slice
        } else {
          grams = amount * 15; // generic slice
          assumptions.push(`Assumed 15g per slice for "${foodName}"`);
          confidence -= 0.2;
        }
      } else if (['clove', 'cloves'].includes(normalizedUnit)) {
        grams = amount * 3; // garlic clove
      } else {
        // Default piece weight
        grams = amount * 50;
        assumptions.push(`Assumed 50g per piece for "${foodName}"`);
        confidence -= 0.3;
      }
      break;
  }

  return {
    grams: Math.round(grams * 10) / 10, // Round to 1 decimal
    confidence: Math.max(0, Math.min(1, confidence)),
    assumptions
  };
}