import { 
  Droplet, 
  Sparkles, 
  Coffee, 
  Leaf, 
  Milk, 
  Citrus, 
  CupSoda, 
  Zap, 
  Beer, 
  Wine, 
  Martini, 
  GlassWater 
} from 'lucide-react';

export interface BeverageType {
  name: string;
  icon: any;
  hydrationFactor: number;
  color: string;
  isAlcohol?: boolean;
  category: 'water' | 'high' | 'moderate' | 'alcohol';
  // Nutritional data per standard serving
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  servingOz: number;
  alcoholContent?: number; // ABV percentage
}

export const BEVERAGE_HYDRATION: Record<string, BeverageType> = {
  // 100% hydrating - Water
  water: { 
    name: 'Water', 
    icon: Droplet, 
    hydrationFactor: 1.0, 
    color: 'text-cyan-500',
    category: 'water',
    calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, servingOz: 8
  },
  sparkling_water: { 
    name: 'Sparkling Water', 
    icon: Sparkles, 
    hydrationFactor: 1.0, 
    color: 'text-cyan-400',
    category: 'water',
    calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, servingOz: 8
  },
  
  // High hydration (85-95%)
  herbal_tea: { 
    name: 'Herbal Tea', 
    icon: Leaf, 
    hydrationFactor: 0.95, 
    color: 'text-green-500',
    category: 'high',
    calories: 2, carbs: 0, protein: 0, fat: 0, sugar: 0, servingOz: 8
  },
  decaf_coffee: { 
    name: 'Decaf Coffee', 
    icon: Coffee, 
    hydrationFactor: 0.95, 
    color: 'text-amber-600',
    category: 'high',
    calories: 5, carbs: 0, protein: 0, fat: 0, sugar: 0, servingOz: 8
  },
  milk: { 
    name: 'Milk', 
    icon: Milk, 
    hydrationFactor: 0.87, 
    color: 'text-slate-100',
    category: 'high',
    calories: 120, carbs: 12, protein: 8, fat: 5, sugar: 12, servingOz: 8
  },
  juice: { 
    name: 'Juice', 
    icon: Citrus, 
    hydrationFactor: 0.85, 
    color: 'text-orange-500',
    category: 'high',
    calories: 110, carbs: 26, protein: 1, fat: 0, sugar: 24, servingOz: 8
  },
  cold_pressed_juice: { 
    name: 'Cold Pressed Juice', 
    icon: Citrus, 
    hydrationFactor: 0.85, 
    color: 'text-green-500',
    category: 'high',
    calories: 120, carbs: 28, protein: 1, fat: 0, sugar: 22, servingOz: 8
  },
  
  // Moderate hydration (65-85%) - caffeine is a mild diuretic
  coffee: { 
    name: 'Coffee', 
    icon: Coffee, 
    hydrationFactor: 0.80, 
    color: 'text-amber-700',
    category: 'moderate',
    calories: 5, carbs: 0, protein: 0, fat: 0, sugar: 0, servingOz: 8
  },
  tea: { 
    name: 'Tea', 
    icon: CupSoda, 
    hydrationFactor: 0.80, 
    color: 'text-emerald-600',
    category: 'moderate',
    calories: 2, carbs: 0, protein: 0, fat: 0, sugar: 0, servingOz: 8
  },
  sports_drink: { 
    name: 'Sports Drink', 
    icon: Zap, 
    hydrationFactor: 0.90, 
    color: 'text-lime-500',
    category: 'moderate',
    calories: 50, carbs: 14, protein: 0, fat: 0, sugar: 14, servingOz: 8
  },
  soda: { 
    name: 'Soda', 
    icon: CupSoda, 
    hydrationFactor: 0.75, 
    color: 'text-red-500',
    category: 'moderate',
    calories: 140, carbs: 39, protein: 0, fat: 0, sugar: 39, servingOz: 12
  },
  energy_drink: { 
    name: 'Energy Drink', 
    icon: Zap, 
    hydrationFactor: 0.65, 
    color: 'text-yellow-500',
    category: 'moderate',
    calories: 110, carbs: 28, protein: 0, fat: 0, sugar: 27, servingOz: 8
  },
  
  // DEHYDRATING - Alcohol (negative hydration effect)
  beer: { 
    name: 'Beer', 
    icon: Beer, 
    hydrationFactor: -0.4, 
    color: 'text-amber-600',
    isAlcohol: true,
    category: 'alcohol',
    calories: 150, carbs: 13, protein: 2, fat: 0, sugar: 0, servingOz: 12,
    alcoholContent: 5
  },
  wine: { 
    name: 'Wine', 
    icon: Wine, 
    hydrationFactor: -0.6, 
    color: 'text-purple-600',
    isAlcohol: true,
    category: 'alcohol',
    calories: 125, carbs: 4, protein: 0, fat: 0, sugar: 1, servingOz: 5,
    alcoholContent: 13
  },
  cocktail: { 
    name: 'Cocktail', 
    icon: Martini, 
    hydrationFactor: -0.8, 
    color: 'text-pink-500',
    isAlcohol: true,
    category: 'alcohol',
    calories: 200, carbs: 15, protein: 0, fat: 0, sugar: 12, servingOz: 8,
    alcoholContent: 12
  },
  spirits: { 
    name: 'Spirits', 
    icon: GlassWater, 
    hydrationFactor: -1.0, 
    color: 'text-slate-500',
    isAlcohol: true,
    category: 'alcohol',
    calories: 97, carbs: 0, protein: 0, fat: 0, sugar: 0, servingOz: 1.5,
    alcoholContent: 40
  },
  hard_cider: { 
    name: 'Hard Cider', 
    icon: Beer, 
    hydrationFactor: -0.4, 
    color: 'text-amber-500',
    isAlcohol: true,
    category: 'alcohol',
    calories: 200, carbs: 24, protein: 0, fat: 0, sugar: 20, servingOz: 12,
    alcoholContent: 5
  },
  hard_seltzer: { 
    name: 'Seltzer', 
    icon: Sparkles, 
    hydrationFactor: -0.3, 
    color: 'text-sky-400',
    isAlcohol: true,
    category: 'alcohol',
    calories: 100, carbs: 2, protein: 0, fat: 0, sugar: 2, servingOz: 12,
    alcoholContent: 5
  },
};

export const calculateEffectiveHydration = (amountOz: number, beverageType: string): number => {
  const beverage = BEVERAGE_HYDRATION[beverageType] || BEVERAGE_HYDRATION.water;
  return amountOz * beverage.hydrationFactor;
};

export const calculateBeverageNutrition = (amountOz: number, beverageType: string) => {
  const beverage = BEVERAGE_HYDRATION[beverageType] || BEVERAGE_HYDRATION.water;
  const ratio = amountOz / beverage.servingOz;
  
  return {
    calories: Math.round(beverage.calories * ratio),
    carbs: Math.round(beverage.carbs * ratio * 10) / 10,
    protein: Math.round(beverage.protein * ratio * 10) / 10,
    fat: Math.round(beverage.fat * ratio * 10) / 10,
    sugar: Math.round(beverage.sugar * ratio * 10) / 10,
  };
};

export const getBeveragesByCategory = (category: BeverageType['category']) => {
  return Object.entries(BEVERAGE_HYDRATION)
    .filter(([_, beverage]) => beverage.category === category)
    .map(([key, beverage]) => ({ key, ...beverage }));
};
