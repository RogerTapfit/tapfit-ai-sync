/**
 * TapFit Recipe Nutrition Calculator
 * Main engine for converting recipes to accurate per-serving nutrition
 */

import { parseIngredientList, ParsedIngredient } from './ingredientParser';
import { convertToGrams } from './unitConverter';
import { applyYieldFactor } from './yieldFactors';
import { findFoodMatch, NutritionData } from './usdaFoodDatabase';

export interface NutritionBreakdown {
  name: string;
  input: string;
  grams_used: number;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  source: string;
}

export interface RecipeNutrition {
  servings: number;
  totals_per_serving: {
    calories_kcal: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    sodium_mg?: number;
  };
  ingredients_breakdown: NutritionBreakdown[];
  assumptions: string[];
  confidence: number;
}

export function calculateRecipeNutrition(
  title: string,
  servings: number,
  ingredients: string[],
  instructions?: string
): RecipeNutrition {
  const allAssumptions: string[] = [];
  let totalConfidence = 1.0;
  const breakdown: NutritionBreakdown[] = [];
  
  // Totals (will be divided by servings at the end)
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalFiber = 0;
  let totalSodium = 0;
  
  // Parse all ingredients
  const parsedIngredients = parseIngredientList(ingredients);
  
  for (const ingredient of parsedIngredients) {
    // Convert to grams
    const conversion = convertToGrams(
      ingredient.amount,
      ingredient.unit,
      ingredient.name,
      ingredient.prep
    );
    
    // Apply yield factors for cooking
    const yieldResult = applyYieldFactor(
      conversion.grams,
      ingredient.name,
      ingredient.cookState,
      instructions
    );
    
    // Find nutrition data
    const foodMatch = findFoodMatch(
      ingredient.name,
      ingredient.prep,
      ingredient.cookState
    );
    
    // Calculate nutrition for this ingredient
    const gramsUsed = yieldResult.finalGrams;
    const nutrition = foodMatch.food;
    
    const kcal = Math.round((gramsUsed * nutrition.calories_per_100g / 100) * 5) / 5; // Round to nearest 5
    const protein = Math.round((gramsUsed * nutrition.protein_g_per_100g / 100) * 10) / 10;
    const fat = Math.round((gramsUsed * nutrition.fat_g_per_100g / 100) * 10) / 10;
    const carbs = Math.round((gramsUsed * nutrition.carbs_g_per_100g / 100) * 10) / 10;
    const fiber = Math.round((gramsUsed * nutrition.fiber_g_per_100g / 100) * 10) / 10;
    const sodium = nutrition.sodium_mg_per_100g 
      ? Math.round((gramsUsed * nutrition.sodium_mg_per_100g / 100) * 10) / 10
      : 0;
    
    // Add to totals
    totalCalories += kcal;
    totalProtein += protein;
    totalFat += fat;
    totalCarbs += carbs;
    totalFiber += fiber;
    totalSodium += sodium;
    
    // Build display name
    let displayName = ingredient.name;
    if (ingredient.cookState) displayName += ` (${ingredient.cookState})`;
    if (ingredient.prep && ingredient.prep !== ingredient.cookState) {
      displayName += `, ${ingredient.prep}`;
    }
    if (yieldResult.yieldFactor !== 1.0) {
      displayName += ingredient.cookState ? '' : ' (cooked)';
    }
    
    // Add to breakdown
    breakdown.push({
      name: displayName,
      input: ingredient.originalText,
      grams_used: gramsUsed,
      kcal,
      protein_g: protein,
      fat_g: fat,
      carbs_g: carbs,
      fiber_g: fiber,
      source: nutrition.source
    });
    
    // Collect assumptions
    allAssumptions.push(...conversion.assumptions);
    allAssumptions.push(...yieldResult.assumptions);
    allAssumptions.push(...foodMatch.assumptions);
    
    // Update confidence (geometric mean approach)
    const ingredientConfidence = ingredient.confidence * conversion.confidence * yieldResult.confidence * foodMatch.confidence;
    totalConfidence *= Math.pow(ingredientConfidence, 1 / parsedIngredients.length);
  }
  
  // Calculate per-serving values
  const perServingCalories = Math.round((totalCalories / servings) * 5) / 5; // Round to nearest 5
  const perServingProtein = Math.round((totalProtein / servings) * 10) / 10;
  const perServingFat = Math.round((totalFat / servings) * 10) / 10;
  const perServingCarbs = Math.round((totalCarbs / servings) * 10) / 10;
  const perServingFiber = Math.round((totalFiber / servings) * 10) / 10;
  const perServingSodium = totalSodium > 0 ? Math.round((totalSodium / servings) * 10) / 10 : undefined;
  
  // Remove duplicate assumptions
  const uniqueAssumptions = Array.from(new Set(allAssumptions));
  
  return {
    servings,
    totals_per_serving: {
      calories_kcal: perServingCalories,
      protein_g: perServingProtein,
      fat_g: perServingFat,
      carbs_g: perServingCarbs,
      fiber_g: perServingFiber,
      sodium_mg: perServingSodium
    },
    ingredients_breakdown: breakdown,
    assumptions: uniqueAssumptions,
    confidence: Math.round(totalConfidence * 100) / 100
  };
}

// Test function for the example recipe
export function testRecipeCalculation() {
  const testIngredients = [
    '1/2 cup rotini pasta',
    '1/4 pound ground beef (80/20)',
    '1/4 jar marinara sauce',
    '1/4 cup mozzarella cheese (shredded)'
  ];
  
  const instructions = `
    Step 1: Cook the rotini pasta according to package instructions. Drain and set aside.
    Step 2: In a large skillet, cook the ground beef over medium heat until browned. Drain any excess fat.
    Step 3: Add the marinara sauce to the beef and simmer for 5 minutes.
    Step 4: Combine the cooked pasta and beef sauce in a baking dish. Top with mozzarella cheese.
    Step 5: Bake at 350°F (175°C) for 10 minutes until the cheese is melted. Serve hot.
  `;
  
  return calculateRecipeNutrition(
    'Beef and Pasta Bake',
    1,
    testIngredients,
    instructions
  );
}