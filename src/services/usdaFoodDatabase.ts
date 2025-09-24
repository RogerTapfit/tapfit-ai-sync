/**
 * TapFit USDA Food Database
 * Maps foods to USDA FoodData Central entries with nutrition per 100g
 */

export interface NutritionData {
  calories_per_100g: number;
  protein_g_per_100g: number;
  fat_g_per_100g: number;
  carbs_g_per_100g: number;
  fiber_g_per_100g: number;
  sugar_g_per_100g?: number;
  sodium_mg_per_100g?: number;
  source: string;
  fdc_id?: string;
}

export interface FoodMatch {
  food: NutritionData;
  confidence: number;
  assumptions: string[];
}

// USDA-based nutrition database (values per 100g)
const FOOD_DATABASE: Record<string, NutritionData> = {
  // Pasta (cooked, enriched)
  'rotini pasta': {
    calories_per_100g: 158,
    protein_g_per_100g: 5.8,
    fat_g_per_100g: 0.9,
    carbs_g_per_100g: 31.0,
    fiber_g_per_100g: 1.8,
    source: 'USDA FDC #2062951 - Pasta, cooked, enriched',
    fdc_id: '2062951'
  },
  'pasta cooked': {
    calories_per_100g: 158,
    protein_g_per_100g: 5.8,
    fat_g_per_100g: 0.9,
    carbs_g_per_100g: 31.0,
    fiber_g_per_100g: 1.8,
    source: 'USDA FDC #2062951 - Pasta, cooked, enriched',
    fdc_id: '2062951'
  },
  'pasta dry': {
    calories_per_100g: 371,
    protein_g_per_100g: 13.0,
    fat_g_per_100g: 1.5,
    carbs_g_per_100g: 74.7,
    fiber_g_per_100g: 3.2,
    source: 'USDA FDC #2045647 - Pasta, dry, enriched',
    fdc_id: '2045647'
  },
  
  // Ground Beef (80/20)
  'ground beef': {
    calories_per_100g: 254,
    protein_g_per_100g: 25.8,
    fat_g_per_100g: 15.4,
    carbs_g_per_100g: 0.0,
    fiber_g_per_100g: 0.0,
    source: 'USDA FDC #174038 - Beef, ground, 80% lean, 20% fat, cooked, pan-broiled',
    fdc_id: '174038'
  },
  'ground beef raw': {
    calories_per_100g: 254,
    protein_g_per_100g: 20.0,
    fat_g_per_100g: 20.0,
    carbs_g_per_100g: 0.0,
    fiber_g_per_100g: 0.0,
    source: 'USDA FDC #174037 - Beef, ground, 80% lean, 20% fat, raw',
    fdc_id: '174037'
  },
  'ground beef cooked': {
    calories_per_100g: 254,
    protein_g_per_100g: 25.8,
    fat_g_per_100g: 15.4,
    carbs_g_per_100g: 0.0,
    fiber_g_per_100g: 0.0,
    source: 'USDA FDC #174038 - Beef, ground, 80% lean, 20% fat, cooked, pan-broiled',
    fdc_id: '174038'
  },
  'ground beef cooked drained': {
    calories_per_100g: 215,
    protein_g_per_100g: 28.6,
    fat_g_per_100g: 10.1,
    carbs_g_per_100g: 0.0,
    fiber_g_per_100g: 0.0,
    source: 'USDA FDC #174039 - Beef, ground, 80% lean, 20% fat, cooked, drained',
    fdc_id: '174039'
  },
  
  // Marinara/Pasta Sauce
  'marinara sauce': {
    calories_per_100g: 29,
    protein_g_per_100g: 1.6,
    fat_g_per_100g: 0.2,
    carbs_g_per_100g: 7.0,
    fiber_g_per_100g: 1.4,
    sodium_mg_per_100g: 431,
    source: 'USDA FDC #173682 - Sauce, pasta, marinara, ready-to-serve',
    fdc_id: '173682'
  },
  'pasta sauce': {
    calories_per_100g: 29,
    protein_g_per_100g: 1.6,
    fat_g_per_100g: 0.2,
    carbs_g_per_100g: 7.0,
    fiber_g_per_100g: 1.4,
    sodium_mg_per_100g: 431,
    source: 'USDA FDC #173682 - Sauce, pasta, marinara, ready-to-serve',
    fdc_id: '173682'
  },
  
  // Mozzarella Cheese
  'mozzarella cheese': {
    calories_per_100g: 300,
    protein_g_per_100g: 22.2,
    fat_g_per_100g: 22.4,
    carbs_g_per_100g: 2.2,
    fiber_g_per_100g: 0.0,
    sodium_mg_per_100g: 627,
    source: 'USDA FDC #173441 - Cheese, mozzarella, part skim milk',
    fdc_id: '173441'
  },
  'mozzarella cheese shredded': {
    calories_per_100g: 300,
    protein_g_per_100g: 22.2,
    fat_g_per_100g: 22.4,
    carbs_g_per_100g: 2.2,
    fiber_g_per_100g: 0.0,
    sodium_mg_per_100g: 627,
    source: 'USDA FDC #173441 - Cheese, mozzarella, part skim milk',
    fdc_id: '173441'
  },
  'cheese shredded': {
    calories_per_100g: 300,
    protein_g_per_100g: 22.2,
    fat_g_per_100g: 22.4,
    carbs_g_per_100g: 2.2,
    fiber_g_per_100g: 0.0,
    sodium_mg_per_100g: 627,
    source: 'USDA FDC #173441 - Cheese, mozzarella, part skim milk (assumed)',
    fdc_id: '173441'
  },
  
  // Common vegetables
  'onion': {
    calories_per_100g: 40,
    protein_g_per_100g: 1.1,
    fat_g_per_100g: 0.1,
    carbs_g_per_100g: 9.3,
    fiber_g_per_100g: 1.7,
    source: 'USDA FDC #170000 - Onions, raw',
    fdc_id: '170000'
  },
  'bell pepper': {
    calories_per_100g: 31,
    protein_g_per_100g: 1.0,
    fat_g_per_100g: 0.3,
    carbs_g_per_100g: 7.3,
    fiber_g_per_100g: 2.5,
    source: 'USDA FDC #170427 - Peppers, sweet, red, raw',
    fdc_id: '170427'
  },
  'mushrooms': {
    calories_per_100g: 22,
    protein_g_per_100g: 3.1,
    fat_g_per_100g: 0.3,
    carbs_g_per_100g: 3.3,
    fiber_g_per_100g: 1.0,
    source: 'USDA FDC #169251 - Mushrooms, white, raw',
    fdc_id: '169251'
  },
};

const FOOD_SYNONYMS: Record<string, string> = {
  // Pasta variations
  'penne': 'pasta cooked',
  'spaghetti': 'pasta cooked',
  'macaroni': 'pasta cooked',
  'fusilli': 'pasta cooked',
  'rigatoni': 'pasta cooked',
  'bow tie pasta': 'pasta cooked',
  'farfalle': 'pasta cooked',
  
  // Sauce variations
  'tomato sauce': 'marinara sauce',
  'spaghetti sauce': 'marinara sauce',
  
  // Cheese variations
  'mozz': 'mozzarella cheese',
  'mozzarella': 'mozzarella cheese',
  
  // Beef variations
  'hamburger': 'ground beef',
  'ground chuck': 'ground beef',
  'minced beef': 'ground beef',
};

export function findFoodMatch(foodName: string, prep?: string, cookState?: string): FoodMatch {
  const assumptions: string[] = [];
  let confidence = 1.0;
  
  const normalizedFood = foodName.toLowerCase().trim();
  
  // Build search key
  let searchKey = normalizedFood;
  if (cookState) {
    searchKey += ` ${cookState}`;
  }
  if (prep && !cookState) {
    searchKey += ` ${prep}`;
  }
  
  // Direct match
  let food = FOOD_DATABASE[searchKey];
  if (food) {
    return { food, confidence, assumptions };
  }
  
  // Try without prep
  food = FOOD_DATABASE[normalizedFood];
  if (food) {
    if (prep) {
      assumptions.push(`Ignored prep state "${prep}" for nutrition lookup`);
      confidence -= 0.05;
    }
    return { food, confidence, assumptions };
  }
  
  // Try synonyms
  const synonym = FOOD_SYNONYMS[normalizedFood];
  if (synonym) {
    food = FOOD_DATABASE[synonym];
    if (food) {
      assumptions.push(`Used synonym "${synonym}" for "${normalizedFood}"`);
      confidence -= 0.1;
      return { food, confidence, assumptions };
    }
  }
  
  // Try partial matches
  for (const [key, nutrition] of Object.entries(FOOD_DATABASE)) {
    const keyWords = key.split(' ');
    const foodWords = normalizedFood.split(' ');
    
    // Check if any significant words match
    const matchingWords = keyWords.filter(kw => 
      foodWords.some(fw => fw.includes(kw) || kw.includes(fw))
    );
    
    if (matchingWords.length >= 1 && keyWords.length <= 3) {
      assumptions.push(`Used partial match "${key}" for "${normalizedFood}"`);
      confidence -= 0.2;
      return { food: nutrition, confidence, assumptions };
    }
  }
  
  // Fallback to generic food
  assumptions.push(`No match found for "${normalizedFood}", using generic values`);
  confidence = 0.3;
  
  return {
    food: {
      calories_per_100g: 200,
      protein_g_per_100g: 10.0,
      fat_g_per_100g: 8.0,
      carbs_g_per_100g: 20.0,
      fiber_g_per_100g: 2.0,
      source: 'Generic fallback values'
    },
    confidence,
    assumptions
  };
}