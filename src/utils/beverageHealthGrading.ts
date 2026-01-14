import { BeverageType } from '@/lib/beverageHydration';

export interface VitaminBenefit {
  name: string;
  benefit: string;
  icon: string;
}

export interface BeverageGradeResult {
  grade: string;
  score: number;
  pros: string[];
  cons: string[];
  hydrationImpact: 'positive' | 'neutral' | 'negative';
  hydrationDescription: string;
  vitaminBenefits: VitaminBenefit[];
  standouts: string[];
  pitfalls: string[];
  insightSummary: string;
}

// Vitamin/nutrient database
const VITAMIN_DATABASE: Record<string, VitaminBenefit> = {
  'vitamin c': { name: 'Vitamin C', benefit: 'Boosts immune system and acts as a powerful antioxidant to fight cell damage', icon: '🍊' },
  'vitamin b': { name: 'B Vitamins', benefit: 'Supports energy metabolism and nervous system function', icon: '⚡' },
  'b12': { name: 'Vitamin B12', benefit: 'Essential for red blood cell formation and neurological function', icon: '🔴' },
  'b6': { name: 'Vitamin B6', benefit: 'Helps with protein metabolism and cognitive development', icon: '🧠' },
  'vitamin d': { name: 'Vitamin D', benefit: 'Supports bone health and immune function', icon: '☀️' },
  'calcium': { name: 'Calcium', benefit: 'Essential for strong bones, teeth, and muscle function', icon: '🦴' },
  'electrolyte': { name: 'Electrolytes', benefit: 'Maintains fluid balance, supports muscle and nerve function', icon: '💧' },
  'potassium': { name: 'Potassium', benefit: 'Regulates heartbeat and supports muscle contractions', icon: '💪' },
  'magnesium': { name: 'Magnesium', benefit: 'Supports muscle recovery, sleep quality, and energy production', icon: '✨' },
  'zinc': { name: 'Zinc', benefit: 'Boosts immune function and supports wound healing', icon: '🛡️' },
  'antioxidant': { name: 'Antioxidants', benefit: 'Fights free radicals and protects cells from oxidative stress', icon: '🍇' },
  'probiotic': { name: 'Probiotics', benefit: 'Supports gut health, digestion, and immune function', icon: '🦠' },
  'caffeine': { name: 'Caffeine', benefit: 'Enhances alertness, focus, and physical performance', icon: '☕' },
  'taurine': { name: 'Taurine', benefit: 'Supports cardiovascular function and exercise performance', icon: '🏃' },
  'protein': { name: 'Protein', benefit: 'Builds and repairs muscles, supports satiety', icon: '💪' },
  'fiber': { name: 'Fiber', benefit: 'Aids digestion and helps maintain stable blood sugar', icon: '🌾' },
  'iron': { name: 'Iron', benefit: 'Essential for oxygen transport and energy levels', icon: '🩸' },
  'collagen': { name: 'Collagen', benefit: 'Supports skin elasticity, joint health, and connective tissue', icon: '✨' },
};

const detectVitamins = (productName: string, category: string): VitaminBenefit[] => {
  const vitamins: VitaminBenefit[] = [];
  const nameLower = productName.toLowerCase();
  
  // Check for direct vitamin mentions
  for (const [keyword, vitamin] of Object.entries(VITAMIN_DATABASE)) {
    if (nameLower.includes(keyword)) {
      vitamins.push(vitamin);
    }
  }
  
  // Category-based defaults
  if (vitamins.length === 0) {
    if (category === 'sports_drink' || nameLower.includes('gatorade') || nameLower.includes('powerade')) {
      vitamins.push(VITAMIN_DATABASE['electrolyte']);
    }
    if (category === 'energy_drink' || nameLower.includes('energy') || nameLower.includes('monster') || nameLower.includes('red bull')) {
      vitamins.push(VITAMIN_DATABASE['vitamin b']);
      vitamins.push(VITAMIN_DATABASE['caffeine']);
    }
    if (nameLower.includes('orange') || nameLower.includes('citrus') || nameLower.includes('lemon')) {
      vitamins.push(VITAMIN_DATABASE['vitamin c']);
    }
    if (category === 'milk' || nameLower.includes('milk')) {
      vitamins.push(VITAMIN_DATABASE['calcium']);
      vitamins.push(VITAMIN_DATABASE['vitamin d']);
    }
    if (nameLower.includes('kombucha')) {
      vitamins.push(VITAMIN_DATABASE['probiotic']);
    }
    if (nameLower.includes('protein') || nameLower.includes('muscle')) {
      vitamins.push(VITAMIN_DATABASE['protein']);
    }
  }
  
  // Limit to 3 vitamins max for clean display
  return vitamins.slice(0, 3);
};

const generateStandouts = (beverageInfo: BeverageType, productName: string, score: number): string[] => {
  const standouts: string[] = [];
  const nameLower = productName.toLowerCase();
  const sugar = beverageInfo.sugar ?? 0;
  const calories = beverageInfo.calories ?? 0;
  const protein = beverageInfo.protein ?? 0;
  
  if (sugar === 0) standouts.push('Zero sugar - no blood sugar spikes');
  else if (sugar <= 5) standouts.push('Low sugar content');
  
  if (calories === 0) standouts.push('Zero calorie hydration option');
  else if (calories <= 20) standouts.push('Very low calorie choice');
  
  if (protein >= 15) standouts.push(`High protein (${protein}g) for muscle recovery`);
  else if (protein >= 8) standouts.push(`Good protein source (${protein}g)`);
  
  if (beverageInfo.hydrationFactor >= 0.9) standouts.push('Excellent for hydration');
  else if (beverageInfo.hydrationFactor >= 0.7) standouts.push('Good hydration value');
  
  if (nameLower.includes('natural') || nameLower.includes('organic')) {
    standouts.push('Made with natural/organic ingredients');
  }
  
  if (nameLower.includes('sparkling') || nameLower.includes('carbonated')) {
    standouts.push('Refreshing carbonation without added sugars');
  }
  
  if (nameLower.includes('electrolyte')) {
    standouts.push('Replenishes minerals lost through sweat');
  }
  
  if (score >= 85) standouts.push('Overall excellent health profile');
  
  return standouts.slice(0, 4);
};

const generatePitfalls = (beverageInfo: BeverageType, productName: string): string[] => {
  const pitfalls: string[] = [];
  const nameLower = productName.toLowerCase();
  const sugar = beverageInfo.sugar ?? 0;
  const calories = beverageInfo.calories ?? 0;
  
  if (sugar > 25) {
    pitfalls.push(`High sugar (${sugar}g) - exceeds recommended daily intake`);
  } else if (sugar > 15) {
    pitfalls.push(`Moderate sugar (${sugar}g) - consume in moderation`);
  }
  
  if (calories > 150) {
    pitfalls.push(`High calorie content (${calories} cal) - consider portion size`);
  }
  
  if (nameLower.includes('diet') || nameLower.includes('zero') || nameLower.includes('light')) {
    pitfalls.push('Contains artificial sweeteners - may affect gut microbiome');
  }
  
  if (nameLower.includes('energy') || nameLower.includes('monster') || nameLower.includes('red bull')) {
    pitfalls.push('High caffeine - may cause jitters or affect sleep');
  } else if (nameLower.includes('coffee') || nameLower.includes('cola')) {
    pitfalls.push('Contains caffeine - limit intake later in the day');
  }
  
  if (beverageInfo.category === 'alcohol' || beverageInfo.hydrationFactor < 0) {
    pitfalls.push('Alcohol causes dehydration - drink water alongside');
  }
  
  if (nameLower.includes('soda') || nameLower.includes('pop')) {
    pitfalls.push('Carbonated sodas may affect dental health');
  }
  
  return pitfalls.slice(0, 3);
};

const generateInsightSummary = (beverageInfo: BeverageType, productName: string, score: number): string => {
  const nameLower = productName.toLowerCase();
  
  if (score >= 85) {
    return `This is an excellent beverage choice with strong nutritional benefits and good hydration value.`;
  } else if (score >= 70) {
    return `A decent beverage option. Provides some benefits but watch the ${beverageInfo.sugar && beverageInfo.sugar > 10 ? 'sugar content' : 'portion size'}.`;
  } else if (score >= 50) {
    if (nameLower.includes('energy')) {
      return `Energy drinks provide a quick boost but should be consumed occasionally due to caffeine and sugar content.`;
    }
    return `Moderate choice for occasional consumption. Consider healthier alternatives for regular hydration.`;
  } else {
    if (beverageInfo.category === 'alcohol') {
      return `Alcoholic beverages should be enjoyed responsibly and in moderation. Remember to hydrate with water.`;
    }
    return `This beverage has limited nutritional value. Consider as an occasional treat rather than regular consumption.`;
  }
};

export const calculateBeverageHealthGrade = (
  beverageInfo: BeverageType,
  productName?: string
): BeverageGradeResult => {
  let score = 100;
  const pros: string[] = [];
  const cons: string[] = [];
  const displayName = productName || beverageInfo.name;

  // Sugar penalties (major factor)
  const sugar = beverageInfo.sugar ?? 0;
  if (sugar === 0) {
    pros.push('Zero sugar');
  } else if (sugar <= 5) {
    pros.push('Low sugar');
    score -= 5;
  } else if (sugar <= 15) {
    cons.push(`Moderate sugar (${sugar}g)`);
    score -= 15;
  } else if (sugar <= 30) {
    cons.push(`High sugar (${sugar}g)`);
    score -= 30;
  } else {
    cons.push(`Very high sugar (${sugar}g)`);
    score -= 40;
  }

  // Calorie assessment
  const calories = beverageInfo.calories ?? 0;
  if (calories === 0) {
    pros.push('Zero calories');
  } else if (calories <= 20) {
    pros.push('Very low calories');
  } else if (calories <= 50) {
    // Neutral - no bonus or penalty
  } else if (calories <= 100) {
    score -= 10;
  } else if (calories <= 200) {
    cons.push('High calories');
    score -= 20;
  } else {
    cons.push('Very high calories');
    score -= 30;
  }

  // Protein bonus
  const protein = beverageInfo.protein ?? 0;
  if (protein >= 20) {
    pros.push(`Excellent protein (${protein}g)`);
    score += 20;
  } else if (protein >= 10) {
    pros.push(`Good protein (${protein}g)`);
    score += 15;
  } else if (protein >= 5) {
    pros.push(`Some protein (${protein}g)`);
    score += 5;
  }

  // Hydration factor assessment
  const hydrationFactor = beverageInfo.hydrationFactor;
  let hydrationImpact: 'positive' | 'neutral' | 'negative';
  let hydrationDescription: string;

  if (hydrationFactor >= 0.9) {
    hydrationImpact = 'positive';
    hydrationDescription = 'Excellent hydration';
    score += 10;
    pros.push('Highly hydrating');
  } else if (hydrationFactor >= 0.7) {
    hydrationImpact = 'positive';
    hydrationDescription = 'Good hydration';
    score += 5;
  } else if (hydrationFactor >= 0.5) {
    hydrationImpact = 'neutral';
    hydrationDescription = 'Moderate hydration';
  } else if (hydrationFactor >= 0) {
    hydrationImpact = 'neutral';
    hydrationDescription = 'Limited hydration effect';
    score -= 5;
  } else {
    hydrationImpact = 'negative';
    hydrationDescription = 'Dehydrating effect';
    cons.push('Causes dehydration');
    score -= 15;
  }

  // Category-specific adjustments
  const category = beverageInfo.category;
  
  if (category === 'alcohol') {
    cons.push('Contains alcohol');
    score -= 20;
    // Additional penalty based on assumed alcohol content
    const nameLower = displayName.toLowerCase();
    if (nameLower.includes('spirit') || nameLower.includes('vodka') || nameLower.includes('whiskey') || nameLower.includes('rum')) {
      score -= 15;
      cons.push('High alcohol content');
    } else if (nameLower.includes('wine')) {
      score -= 10;
    }
  }

  // Caffeine detection (based on category/name)
  const nameLower = displayName.toLowerCase();
  if (nameLower.includes('energy') || nameLower.includes('monster') || nameLower.includes('red bull')) {
    cons.push('High caffeine content');
    score -= 15;
  } else if (nameLower.includes('coffee')) {
    // Moderate caffeine - small penalty
    score -= 5;
    if (!cons.some(c => c.includes('caffeine'))) {
      cons.push('Contains caffeine');
    }
  } else if (nameLower.includes('cola') || nameLower.includes('pepsi') || nameLower.includes('coke') || nameLower.includes('dr pepper')) {
    cons.push('Contains caffeine');
    score -= 5;
  }

  // Artificial sweetener detection
  if (calories === 0 && (nameLower.includes('diet') || nameLower.includes('zero') || nameLower.includes('light'))) {
    cons.push('Contains artificial sweeteners');
    score -= 10;
  }

  // Fat content
  const fat = beverageInfo.fat ?? 0;
  if (fat === 0) {
    if (!pros.some(p => p.toLowerCase().includes('fat'))) {
      pros.push('Zero fat');
    }
  } else if (fat > 10) {
    cons.push(`High fat (${fat}g)`);
    score -= 10;
  }

  // Carbs without sugar might be fiber or complex carbs - slight positive
  const carbs = beverageInfo.carbs ?? 0;
  if (carbs > 0 && carbs - sugar > 5) {
    // Has complex carbs/fiber
    pros.push('Contains complex carbohydrates');
    score += 5;
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Grade mapping
  let grade: string;
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 50) grade = 'D';
  else grade = 'F';

  // Ensure at least one pro and con if lists are empty
  if (pros.length === 0) {
    pros.push('Quick energy source');
  }
  if (cons.length === 0 && score < 90) {
    cons.push('Limited nutritional value');
  }

  // Generate drink insights
  const vitaminBenefits = detectVitamins(displayName, category);
  const standouts = generateStandouts(beverageInfo, displayName, score);
  const pitfalls = generatePitfalls(beverageInfo, displayName);
  const insightSummary = generateInsightSummary(beverageInfo, displayName, score);

  return {
    grade,
    score,
    pros,
    cons,
    hydrationImpact,
    hydrationDescription,
    vitaminBenefits,
    standouts,
    pitfalls,
    insightSummary
  };
};

export const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'text-green-500';
    case 'B': return 'text-lime-500';
    case 'C': return 'text-yellow-500';
    case 'D': return 'text-orange-500';
    case 'F': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
};

export const getGradeBgColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'bg-green-500/20 border-green-500/30';
    case 'B': return 'bg-lime-500/20 border-lime-500/30';
    case 'C': return 'bg-yellow-500/20 border-yellow-500/30';
    case 'D': return 'bg-orange-500/20 border-orange-500/30';
    case 'F': return 'bg-red-500/20 border-red-500/30';
    default: return 'bg-muted/20 border-muted/30';
  }
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 60) return '#84cc16'; // lime
  if (score >= 40) return '#eab308'; // yellow
  if (score >= 20) return '#f97316'; // orange
  return '#ef4444'; // red
};
