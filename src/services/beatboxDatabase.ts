// Custom database for popular alcoholic beverages not found in standard APIs
interface BeatboxProduct {
  barcode: string;
  name: string;
  brand: string;
  flavor: string;
  alcoholContent: number;
  calories: number;
  carbs: number;
  sugars: number;
  servingSize: string;
}

const BEATBOX_PRODUCTS: BeatboxProduct[] = [
  {
    barcode: '883350007826',
    name: 'BeatBox Blue Razzberry',
    brand: 'BeatBox Beverages',
    flavor: 'Blue Razzberry',
    alcoholContent: 11.1,
    calories: 150,
    carbs: 18,
    sugars: 18,
    servingSize: '200ml'
  },
  {
    barcode: '883350007833',
    name: 'BeatBox Fresh Watermelon',
    brand: 'BeatBox Beverages',
    flavor: 'Fresh Watermelon',
    alcoholContent: 11.1,
    calories: 150,
    carbs: 18,
    sugars: 18,
    servingSize: '200ml'
  },
  {
    barcode: '883350007840',
    name: 'BeatBox Fruit Punch',
    brand: 'BeatBox Beverages',
    flavor: 'Fruit Punch',
    alcoholContent: 11.1,
    calories: 150,
    carbs: 18,
    sugars: 18,
    servingSize: '200ml'
  },
  {
    barcode: '883350007857',
    name: 'BeatBox Pink Lemonade',
    brand: 'BeatBox Beverages',
    flavor: 'Pink Lemonade',
    alcoholContent: 11.1,
    calories: 150,
    carbs: 18,
    sugars: 18,
    servingSize: '200ml'
  },
  // Add more as needed
];

export const getBeatboxProduct = (barcode: string): BeatboxProduct | null => {
  return BEATBOX_PRODUCTS.find(product => product.barcode === barcode) || null;
};

export const getAllBeatboxProducts = (): BeatboxProduct[] => {
  return BEATBOX_PRODUCTS;
};

// Popular alcoholic beverages database
const POPULAR_ALCOHOLIC_BEVERAGES = new Map([
  // White Claw
  ['012000814488', { name: 'White Claw Hard Seltzer Black Cherry', brand: 'White Claw', alcohol: 5.0, calories: 100 }],
  ['012000814495', { name: 'White Claw Hard Seltzer Mango', brand: 'White Claw', alcohol: 5.0, calories: 100 }],
  
  // Truly
  ['087801000000', { name: 'Truly Hard Seltzer Wild Berry', brand: 'Truly', alcohol: 5.0, calories: 100 }],
  ['087801000001', { name: 'Truly Hard Seltzer Citrus', brand: 'Truly', alcohol: 5.0, calories: 100 }],
  
  // High Noon
  ['850866007000', { name: 'High Noon Peach', brand: 'High Noon', alcohol: 4.5, calories: 100 }],
  
  // Bud Light Seltzer
  ['018992000000', { name: 'Bud Light Seltzer Black Cherry', brand: 'Bud Light', alcohol: 5.0, calories: 100 }],
  
  // Corona Seltzer
  ['015000000000', { name: 'Corona Hard Seltzer Tropical Lime', brand: 'Corona', alcohol: 4.5, calories: 90 }],
]);

export const getPopularAlcoholicBeverage = (barcode: string) => {
  return POPULAR_ALCOHOLIC_BEVERAGES.get(barcode) || null;
};