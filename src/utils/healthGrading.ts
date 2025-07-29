import { FoodEntry, FoodItem } from '@/hooks/useNutrition';

export interface GradeResult {
  grade: string;
  score: number;
  category: string;
  insight: string;
  recommendation: string;
  healthyStreak?: boolean;
}

export const calculateHealthGrade = (
  foodItems: FoodItem[],
  totalCalories: number,
  totalProtein: number,
  totalCarbs: number,
  totalFat: number
): GradeResult => {
  let score = 0;
  const insights: string[] = [];
  
  // Analyze food items for health factors
  const hasLeanProtein = foodItems.some(item => 
    item.name.toLowerCase().includes('chicken') || 
    item.name.toLowerCase().includes('fish') || 
    item.name.toLowerCase().includes('turkey') ||
    item.name.toLowerCase().includes('tofu') ||
    (item.name.toLowerCase().includes('steak') && item.protein > 20)
  );
  
  const hasVegetables = foodItems.some(item =>
    item.name.toLowerCase().includes('vegetable') ||
    item.name.toLowerCase().includes('broccoli') ||
    item.name.toLowerCase().includes('spinach') ||
    item.name.toLowerCase().includes('pepper') ||
    item.name.toLowerCase().includes('carrot') ||
    item.name.toLowerCase().includes('lettuce') ||
    item.name.toLowerCase().includes('tomato')
  );

  const hasProcessedFood = foodItems.some(item =>
    item.name.toLowerCase().includes('fried') ||
    item.name.toLowerCase().includes('pizza') ||
    item.name.toLowerCase().includes('burger') ||
    item.name.toLowerCase().includes('fries') ||
    item.name.toLowerCase().includes('chips')
  );

  const hasHighFiber = foodItems.some(item =>
    item.name.toLowerCase().includes('bean') ||
    item.name.toLowerCase().includes('quinoa') ||
    item.name.toLowerCase().includes('oats') ||
    item.name.toLowerCase().includes('brown rice')
  );

  // Portion size assessment (rough estimate)
  const reasonablePortions = totalCalories < 800;
  const proteinRatio = totalProtein / Math.max(totalCalories / 4, 1);
  const highProtein = proteinRatio > 0.25;

  // Scoring logic
  if (hasLeanProtein) {
    score += 2;
    insights.push("Contains lean protein");
  }
  if (hasVegetables) {
    score += 2;
    insights.push("Includes vegetables");
  }
  if (reasonablePortions) {
    score += 1;
    insights.push("Reasonable portion size");
  }
  if (totalFat < totalCalories * 0.35) {
    score += 1;
    insights.push("Moderate fat content");
  }
  if (hasHighFiber) {
    score += 1;
    insights.push("Good fiber sources");
  }
  if (highProtein) {
    score += 1;
    insights.push("High protein content");
  }
  if (!hasProcessedFood) {
    score += 2;
    insights.push("Mostly whole foods");
  } else {
    score -= 2;
    insights.push("Contains processed ingredients");
  }

  // Grade mapping
  let grade: string;
  if (score >= 9) grade = "A+";
  else if (score >= 8) grade = "A";
  else if (score >= 7) grade = "A-";
  else if (score >= 6) grade = "B";
  else if (score >= 5) grade = "C";
  else if (score >= 3) grade = "D";
  else grade = "F";

  // Generate category and recommendations
  const category = foodItems.map(item => item.name).join(" with ");
  const insight = insights.slice(0, 3).join(", ");
  
  let recommendation: string;
  if (score >= 7) {
    recommendation = "Excellent choice! This meal supports your fitness goals.";
  } else if (score >= 5) {
    recommendation = "Good meal! Consider adding more vegetables for extra nutrients.";
  } else if (score >= 3) {
    recommendation = "Okay choice. Try to include more whole foods next time.";
  } else {
    recommendation = "Consider healthier alternatives with more vegetables and lean protein.";
  }

  return {
    grade,
    score,
    category,
    insight,
    recommendation,
    healthyStreak: score >= 7
  };
};

export const getGradeColor = (grade: string) => {
  if (grade?.startsWith('A')) return 'text-stats-exercises';
  if (grade?.startsWith('B')) return 'text-stats-calories';
  if (grade?.startsWith('C')) return 'text-stats-duration';
  return 'text-destructive';
};

export const getGradeBgColor = (grade: string) => {
  if (grade?.startsWith('A')) return 'bg-stats-exercises/20 border-stats-exercises/30';
  if (grade?.startsWith('B')) return 'bg-stats-calories/20 border-stats-calories/30';
  if (grade?.startsWith('C')) return 'bg-stats-duration/20 border-stats-duration/30';
  return 'bg-destructive/20 border-destructive/30';
};