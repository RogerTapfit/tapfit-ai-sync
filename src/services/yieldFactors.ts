/**
 * TapFit Recipe Yield Factors
 * Handles cook-state transformations and mass changes during cooking
 */

export interface YieldResult {
  finalGrams: number;
  yieldFactor: number;
  assumptions: string[];
  confidence: number;
}

interface YieldFactor {
  from: string;
  to: string;
  factor: number;
  description: string;
}

const YIELD_FACTORS: YieldFactor[] = [
  // Ground Beef
  {
    from: 'ground beef raw',
    to: 'ground beef cooked',
    factor: 0.75,
    description: 'Ground beef loses ~25% mass when cooked'
  },
  {
    from: 'ground beef cooked',
    to: 'ground beef cooked drained',
    factor: 0.84,
    description: 'Cooked ground beef loses ~16% mass when fat is drained'
  },
  
  // Pasta
  {
    from: 'pasta dry',
    to: 'pasta cooked',
    factor: 2.8,
    description: 'Dry pasta gains ~180% mass when cooked (absorbs water)'
  },
  
  // Other proteins
  {
    from: 'chicken breast raw',
    to: 'chicken breast cooked',
    factor: 0.75,
    description: 'Chicken breast loses ~25% mass when cooked'
  },
  {
    from: 'chicken thigh raw',
    to: 'chicken thigh cooked',
    factor: 0.68,
    description: 'Chicken thigh loses ~32% mass when cooked'
  },
  
  // Vegetables (minimal changes for most)
  {
    from: 'spinach fresh',
    to: 'spinach cooked',
    factor: 0.2,
    description: 'Fresh spinach loses ~80% volume when cooked'
  },
];

export function applyYieldFactor(
  grams: number,
  foodName: string,
  cookState?: string,
  instructions?: string
): YieldResult {
  const assumptions: string[] = [];
  let confidence = 1.0;
  let yieldFactor = 1.0;
  
  const normalizedFood = foodName.toLowerCase();
  
  // Determine if we need to apply yield factors
  let fromState = 'raw';
  let toState = cookState || 'raw';
  
  // Check instructions for cooking hints
  if (instructions) {
    const instructLower = instructions.toLowerCase();
    if (instructLower.includes('drain') && instructLower.includes('fat')) {
      toState = 'cooked drained';
    } else if (instructLower.includes('cook') || instructLower.includes('brown')) {
      toState = 'cooked';
    }
  }
  
  // Special handling for pasta
  if (normalizedFood.includes('pasta')) {
    // If measured in cups, likely already cooked
    // If measured in ounces/pounds, likely dry
    if (cookState === 'cooked' || (!cookState && instructions?.toLowerCase().includes('cook'))) {
      fromState = 'dry';
      toState = 'cooked';
    }
  }
  
  // Special handling for ground beef
  if (normalizedFood.includes('ground beef')) {
    if (instructions?.toLowerCase().includes('drain')) {
      toState = 'cooked drained';
      // Apply two-stage transformation: raw -> cooked -> drained
      const rawToCooked = YIELD_FACTORS.find(f => 
        f.from === 'ground beef raw' && f.to === 'ground beef cooked'
      );
      const cookedToDrained = YIELD_FACTORS.find(f => 
        f.from === 'ground beef cooked' && f.to === 'ground beef cooked drained'
      );
      
      if (rawToCooked && cookedToDrained) {
        yieldFactor = rawToCooked.factor * cookedToDrained.factor;
        assumptions.push(`Applied cooking yield: ${rawToCooked.description}`);
        assumptions.push(`Applied draining yield: ${cookedToDrained.description}`);
      }
    } else if (toState === 'cooked') {
      const factor = YIELD_FACTORS.find(f => 
        f.from === 'ground beef raw' && f.to === 'ground beef cooked'
      );
      if (factor) {
        yieldFactor = factor.factor;
        assumptions.push(factor.description);
      }
    }
  } else {
    // Look for direct yield factor match
    const searchKey = `${normalizedFood} ${fromState}`;
    const targetKey = `${normalizedFood} ${toState}`;
    
    const factor = YIELD_FACTORS.find(f => 
      f.from === searchKey && f.to === targetKey
    );
    
    if (factor) {
      yieldFactor = factor.factor;
      assumptions.push(factor.description);
    } else if (fromState !== toState) {
      // Look for partial matches
      for (const yf of YIELD_FACTORS) {
        const foodInFrom = yf.from.split(' ')[0];
        const foodInTo = yf.to.split(' ')[0];
        
        if (normalizedFood.includes(foodInFrom) && 
            yf.from.includes(fromState) && 
            yf.to.includes(toState)) {
          yieldFactor = yf.factor;
          assumptions.push(`Applied similar yield factor: ${yf.description}`);
          confidence -= 0.1;
          break;
        }
      }
    }
  }
  
  // If we applied any transformation but couldn't find a factor
  if (fromState !== toState && yieldFactor === 1.0) {
    assumptions.push(`No yield factor found for ${normalizedFood} ${fromState} to ${toState}`);
    confidence -= 0.2;
  }
  
  const finalGrams = Math.round(grams * yieldFactor * 10) / 10;
  
  return {
    finalGrams,
    yieldFactor,
    assumptions,
    confidence: Math.max(0, Math.min(1, confidence))
  };
}
