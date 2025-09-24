/**
 * TapFit Recipe Ingredient Parser
 * Parses ingredient strings into structured data for nutrition calculation
 */

export interface ParsedIngredient {
  name: string;
  amount: number;
  unit: string;
  originalText: string;
  prep?: string;
  cookState?: string;
  notes?: string;
  confidence: number;
}

const FRACTION_MAP: Record<string, number> = {
  '¼': 0.25, '1/4': 0.25,
  '½': 0.5, '1/2': 0.5,
  '¾': 0.75, '3/4': 0.75,
  '⅓': 0.333, '1/3': 0.333,
  '⅔': 0.667, '2/3': 0.667,
  '⅛': 0.125, '1/8': 0.125,
  '⅜': 0.375, '3/8': 0.375,
  '⅝': 0.625, '5/8': 0.625,
  '⅞': 0.875, '7/8': 0.875,
};

const UNIT_SYNONYMS: Record<string, string> = {
  'tsp': 'teaspoon',
  'tbsp': 'tablespoon',
  'c': 'cup',
  'oz': 'ounce',
  'lb': 'pound',
  'lbs': 'pound',
  'g': 'gram',
  'grams': 'gram',
  'ml': 'milliliter',
  'l': 'liter',
  'liters': 'liter',
  'can': 'can',
  'jar': 'jar',
  'package': 'package',
  'pkg': 'package',
  'slice': 'slice',
  'slices': 'slice',
  'piece': 'piece',
  'pieces': 'piece',
  'clove': 'clove',
  'cloves': 'clove',
};

const PREP_KEYWORDS = [
  'diced', 'chopped', 'minced', 'sliced', 'shredded', 'grated',
  'whole', 'crushed', 'ground', 'fresh', 'dried', 'frozen',
  'cooked', 'raw', 'boiled', 'steamed', 'grilled', 'roasted',
  'drained', 'rinsed', 'melted', 'softened'
];

export function parseIngredient(ingredientText: string): ParsedIngredient {
  let confidence = 1.0;
  const originalText = ingredientText.trim();
  let workingText = originalText.toLowerCase();

  // Extract parenthetical notes
  const parenMatch = workingText.match(/\(([^)]+)\)/);
  const notes = parenMatch ? parenMatch[1] : undefined;
  if (notes) {
    workingText = workingText.replace(/\s*\([^)]+\)/, '');
    confidence -= 0.1; // Slight confidence reduction for assumptions
  }

  // Convert fractions to decimals
  for (const [fraction, decimal] of Object.entries(FRACTION_MAP)) {
    workingText = workingText.replace(new RegExp(fraction, 'g'), decimal.toString());
  }

  // Parse amount and unit
  const amountUnitRegex = /^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?)\s*([a-zA-Z/]+)?/;
  const match = workingText.match(amountUnitRegex);
  
  let amount = 1;
  let unit = 'piece';
  
  if (match) {
    // Handle mixed numbers (e.g., "1 1/2")
    const amountStr = match[1];
    if (amountStr.includes(' ')) {
      const parts = amountStr.split(' ');
      amount = parseFloat(parts[0]);
      if (parts[1] && parts[1].includes('/')) {
        const [num, den] = parts[1].split('/');
        amount += parseFloat(num) / parseFloat(den);
      }
    } else {
      amount = parseFloat(amountStr);
    }
    
    unit = match[2] ? UNIT_SYNONYMS[match[2]] || match[2] : 'piece';
    workingText = workingText.replace(match[0], '').trim();
  } else {
    confidence -= 0.2; // Reduce confidence if we can't parse amount
  }

  // Extract ingredient name (remove amount/unit)
  let name = workingText;
  
  // Extract prep/cook state
  let prep: string | undefined;
  let cookState: string | undefined;
  
  for (const keyword of PREP_KEYWORDS) {
    if (name.includes(keyword)) {
      if (['cooked', 'raw', 'boiled', 'steamed', 'grilled', 'roasted'].includes(keyword)) {
        cookState = keyword;
      } else {
        prep = keyword;
      }
    }
  }

  // Clean up name
  name = name
    .replace(/\b(and|,)\b/g, '') // Remove connecting words
    .replace(/\s+/g, ' ')
    .trim();

  // Handle special cases
  if (name.includes('ground beef')) {
    if (!notes && !name.includes('80/20') && !name.includes('85/15') && !name.includes('90/10')) {
      confidence -= 0.2; // Reduce confidence if fat content not specified
    }
  }

  if (unit === 'jar' || unit === 'can') {
    confidence -= 0.15; // Reduce confidence for container sizes we have to estimate
  }

  return {
    name,
    amount,
    unit,
    originalText,
    prep,
    cookState,
    notes,
    confidence: Math.max(0, Math.min(1, confidence))
  };
}

export function parseIngredientList(ingredients: string[]): ParsedIngredient[] {
  return ingredients.map(parseIngredient);
}