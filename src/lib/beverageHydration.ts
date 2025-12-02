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
}

export const BEVERAGE_HYDRATION: Record<string, BeverageType> = {
  // 100% hydrating - Water
  water: { 
    name: 'Water', 
    icon: Droplet, 
    hydrationFactor: 1.0, 
    color: 'text-cyan-500',
    category: 'water'
  },
  sparkling_water: { 
    name: 'Sparkling Water', 
    icon: Sparkles, 
    hydrationFactor: 1.0, 
    color: 'text-cyan-400',
    category: 'water'
  },
  
  // High hydration (85-95%)
  herbal_tea: { 
    name: 'Herbal Tea', 
    icon: Leaf, 
    hydrationFactor: 0.95, 
    color: 'text-green-500',
    category: 'high'
  },
  decaf_coffee: { 
    name: 'Decaf Coffee', 
    icon: Coffee, 
    hydrationFactor: 0.95, 
    color: 'text-amber-600',
    category: 'high'
  },
  milk: { 
    name: 'Milk', 
    icon: Milk, 
    hydrationFactor: 0.87, 
    color: 'text-slate-100',
    category: 'high'
  },
  juice: { 
    name: 'Juice', 
    icon: Citrus, 
    hydrationFactor: 0.85, 
    color: 'text-orange-500',
    category: 'high'
  },
  
  // Moderate hydration (65-85%) - caffeine is a mild diuretic
  coffee: { 
    name: 'Coffee', 
    icon: Coffee, 
    hydrationFactor: 0.80, 
    color: 'text-amber-700',
    category: 'moderate'
  },
  tea: { 
    name: 'Tea', 
    icon: CupSoda, 
    hydrationFactor: 0.80, 
    color: 'text-emerald-600',
    category: 'moderate'
  },
  sports_drink: { 
    name: 'Sports Drink', 
    icon: Zap, 
    hydrationFactor: 0.90, 
    color: 'text-lime-500',
    category: 'moderate'
  },
  soda: { 
    name: 'Soda', 
    icon: CupSoda, 
    hydrationFactor: 0.75, 
    color: 'text-red-500',
    category: 'moderate'
  },
  energy_drink: { 
    name: 'Energy Drink', 
    icon: Zap, 
    hydrationFactor: 0.65, 
    color: 'text-yellow-500',
    category: 'moderate'
  },
  
  // DEHYDRATING - Alcohol (negative hydration effect)
  beer: { 
    name: 'Beer', 
    icon: Beer, 
    hydrationFactor: -0.4, 
    color: 'text-amber-600',
    isAlcohol: true,
    category: 'alcohol'
  },
  wine: { 
    name: 'Wine', 
    icon: Wine, 
    hydrationFactor: -0.6, 
    color: 'text-purple-600',
    isAlcohol: true,
    category: 'alcohol'
  },
  cocktail: { 
    name: 'Cocktail', 
    icon: Martini, 
    hydrationFactor: -0.8, 
    color: 'text-pink-500',
    isAlcohol: true,
    category: 'alcohol'
  },
  spirits: { 
    name: 'Spirits/Liquor', 
    icon: GlassWater, 
    hydrationFactor: -1.0, 
    color: 'text-slate-500',
    isAlcohol: true,
    category: 'alcohol'
  },
};

export const calculateEffectiveHydration = (amountOz: number, beverageType: string): number => {
  const beverage = BEVERAGE_HYDRATION[beverageType] || BEVERAGE_HYDRATION.water;
  return amountOz * beverage.hydrationFactor;
};

export const getBeveragesByCategory = (category: BeverageType['category']) => {
  return Object.entries(BEVERAGE_HYDRATION)
    .filter(([_, beverage]) => beverage.category === category)
    .map(([key, beverage]) => ({ key, ...beverage }));
};
