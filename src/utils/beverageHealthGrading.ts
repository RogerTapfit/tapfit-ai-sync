import { BeverageType } from '@/lib/beverageHydration';

export interface BeverageGradeResult {
  grade: string;
  score: number;
  pros: string[];
  cons: string[];
  hydrationImpact: 'positive' | 'neutral' | 'negative';
  hydrationDescription: string;
}

export const calculateBeverageHealthGrade = (
  beverageInfo: BeverageType,
  productName?: string
): BeverageGradeResult => {
  let score = 100;
  const pros: string[] = [];
  const cons: string[] = [];

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
    const nameLower = (productName || beverageInfo.name).toLowerCase();
    if (nameLower.includes('spirit') || nameLower.includes('vodka') || nameLower.includes('whiskey') || nameLower.includes('rum')) {
      score -= 15;
      cons.push('High alcohol content');
    } else if (nameLower.includes('wine')) {
      score -= 10;
    }
  }

  // Caffeine detection (based on category/name)
  const nameLower = (productName || beverageInfo.name).toLowerCase();
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

  return {
    grade,
    score,
    pros,
    cons,
    hydrationImpact,
    hydrationDescription
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
