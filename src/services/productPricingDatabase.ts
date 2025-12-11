// Comprehensive pricing database for common beverages and products
export interface ProductPricing {
  average_price: number;
  price_low: number;
  price_high: number;
  currency: string;
  typical_stores: string[];
  last_updated: string;
}

// Pricing database indexed by UPC barcode
export const productPricingDatabase: Record<string, ProductPricing> = {
  // === WATER BRANDS ===
  // Fiji Water
  '632565000012': { average_price: 2.49, price_low: 1.99, price_high: 3.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS', 'Whole Foods'], last_updated: '2024-12' },
  '632565000029': { average_price: 3.99, price_low: 2.99, price_high: 5.49, currency: 'USD', typical_stores: ['Target', 'Walmart', 'Costco'], last_updated: '2024-12' },
  
  // Evian
  '061314000017': { average_price: 2.29, price_low: 1.79, price_high: 3.49, currency: 'USD', typical_stores: ['Target', 'Walmart', 'Whole Foods'], last_updated: '2024-12' },
  '061314000031': { average_price: 3.49, price_low: 2.49, price_high: 4.99, currency: 'USD', typical_stores: ['Target', 'Costco'], last_updated: '2024-12' },
  
  // Essentia
  '657216000012': { average_price: 2.99, price_low: 2.29, price_high: 3.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS', 'Whole Foods'], last_updated: '2024-12' },
  
  // Smartwater
  '786162002501': { average_price: 2.19, price_low: 1.69, price_high: 2.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS', '7-Eleven'], last_updated: '2024-12' },
  
  // Dasani
  '049000006346': { average_price: 1.89, price_low: 1.29, price_high: 2.49, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS', 'Gas Stations'], last_updated: '2024-12' },
  
  // Aquafina
  '012000001307': { average_price: 1.79, price_low: 1.19, price_high: 2.49, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
  
  // Poland Spring
  '075720000012': { average_price: 1.49, price_low: 0.99, price_high: 2.29, currency: 'USD', typical_stores: ['Target', 'Walmart', 'Stop & Shop'], last_updated: '2024-12' },
  
  // Voss
  '898544001012': { average_price: 3.49, price_low: 2.49, price_high: 4.99, currency: 'USD', typical_stores: ['Target', 'Whole Foods', 'Specialty Stores'], last_updated: '2024-12' },
  
  // Core
  '851977003012': { average_price: 2.49, price_low: 1.99, price_high: 3.49, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
  
  // Liquid Death
  '850742007012': { average_price: 1.99, price_low: 1.49, price_high: 2.99, currency: 'USD', typical_stores: ['Target', 'Whole Foods', '7-Eleven'], last_updated: '2024-12' },
  
  // === SODAS ===
  // Coca-Cola
  '049000006582': { average_price: 2.29, price_low: 1.79, price_high: 2.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS', 'Gas Stations'], last_updated: '2024-12' },
  '049000050103': { average_price: 7.99, price_low: 5.99, price_high: 9.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'Costco'], last_updated: '2024-12' },
  
  // Pepsi
  '012000001925': { average_price: 2.19, price_low: 1.69, price_high: 2.89, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
  
  // Dr Pepper
  '078000000122': { average_price: 2.29, price_low: 1.79, price_high: 2.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
  
  // Sprite
  '049000006414': { average_price: 2.19, price_low: 1.69, price_high: 2.89, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
  
  // === ENERGY DRINKS ===
  // Red Bull
  '611269991000': { average_price: 3.49, price_low: 2.49, price_high: 4.49, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS', '7-Eleven'], last_updated: '2024-12' },
  
  // Monster
  '070847811169': { average_price: 2.99, price_low: 2.29, price_high: 3.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS', 'Gas Stations'], last_updated: '2024-12' },
  
  // Celsius
  '889392000016': { average_price: 2.49, price_low: 1.99, price_high: 3.29, currency: 'USD', typical_stores: ['Target', 'Walmart', 'GNC'], last_updated: '2024-12' },
  
  // === SPORTS DRINKS ===
  // Gatorade
  '052000328905': { average_price: 1.99, price_low: 1.49, price_high: 2.79, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS', 'Gas Stations'], last_updated: '2024-12' },
  
  // Bodyarmor
  '858176002015': { average_price: 2.49, price_low: 1.79, price_high: 3.29, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
  
  // Powerade
  '049000005196': { average_price: 1.79, price_low: 1.29, price_high: 2.49, currency: 'USD', typical_stores: ['Target', 'Walmart', 'Gas Stations'], last_updated: '2024-12' },
  
  // === JUICES ===
  // Tropicana
  '048500301319': { average_price: 4.99, price_low: 3.99, price_high: 6.49, currency: 'USD', typical_stores: ['Target', 'Walmart', 'Kroger'], last_updated: '2024-12' },
  
  // Simply Orange
  '025000000089': { average_price: 4.49, price_low: 3.49, price_high: 5.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'Kroger'], last_updated: '2024-12' },
  
  // === COFFEE ===
  // Starbucks Bottled
  '012000001130': { average_price: 3.49, price_low: 2.79, price_high: 4.49, currency: 'USD', typical_stores: ['Target', 'Starbucks', 'CVS'], last_updated: '2024-12' },
  
  // === ALCOHOL ===
  // Budweiser
  '018200000065': { average_price: 9.99, price_low: 7.99, price_high: 12.99, currency: 'USD', typical_stores: ['Liquor Stores', 'Walmart', 'Target'], last_updated: '2024-12' },
  
  // Corona
  '028200000068': { average_price: 15.99, price_low: 12.99, price_high: 18.99, currency: 'USD', typical_stores: ['Liquor Stores', 'Costco', 'BevMo'], last_updated: '2024-12' },
  
  // White Claw
  '688267138089': { average_price: 17.99, price_low: 14.99, price_high: 21.99, currency: 'USD', typical_stores: ['Target', 'Costco', 'Liquor Stores'], last_updated: '2024-12' },
};

// Get pricing by product name (fuzzy match)
export const getPricingByName = (productName: string): ProductPricing | null => {
  const nameLower = productName.toLowerCase();
  
  // Common product name to pricing mapping
  const namePricingMap: Record<string, ProductPricing> = {
    // Water brands
    'fiji': { average_price: 2.49, price_low: 1.99, price_high: 3.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'evian': { average_price: 2.29, price_low: 1.79, price_high: 3.49, currency: 'USD', typical_stores: ['Target', 'Walmart'], last_updated: '2024-12' },
    'essentia': { average_price: 2.99, price_low: 2.29, price_high: 3.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'smartwater': { average_price: 2.19, price_low: 1.69, price_high: 2.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'dasani': { average_price: 1.89, price_low: 1.29, price_high: 2.49, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'aquafina': { average_price: 1.79, price_low: 1.19, price_high: 2.49, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'poland spring': { average_price: 1.49, price_low: 0.99, price_high: 2.29, currency: 'USD', typical_stores: ['Target', 'Walmart'], last_updated: '2024-12' },
    'voss': { average_price: 3.49, price_low: 2.49, price_high: 4.99, currency: 'USD', typical_stores: ['Target', 'Whole Foods'], last_updated: '2024-12' },
    'core': { average_price: 2.49, price_low: 1.99, price_high: 3.49, currency: 'USD', typical_stores: ['Target', 'Walmart'], last_updated: '2024-12' },
    'liquid death': { average_price: 1.99, price_low: 1.49, price_high: 2.99, currency: 'USD', typical_stores: ['Target', 'Whole Foods'], last_updated: '2024-12' },
    'crystal geyser': { average_price: 1.29, price_low: 0.79, price_high: 1.99, currency: 'USD', typical_stores: ['Walmart', 'Target', 'Grocery Outlet', 'Dollar Tree'], last_updated: '2024-12' },
    'arrowhead': { average_price: 1.49, price_low: 0.99, price_high: 2.29, currency: 'USD', typical_stores: ['Walmart', 'Target', 'Ralph\'s'], last_updated: '2024-12' },
    'deer park': { average_price: 1.39, price_low: 0.89, price_high: 1.99, currency: 'USD', typical_stores: ['Walmart', 'Target', 'CVS'], last_updated: '2024-12' },
    'ozarka': { average_price: 1.29, price_low: 0.79, price_high: 1.89, currency: 'USD', typical_stores: ['Walmart', 'H-E-B', 'Kroger'], last_updated: '2024-12' },
    'ice mountain': { average_price: 1.39, price_low: 0.89, price_high: 1.99, currency: 'USD', typical_stores: ['Walmart', 'Meijer', 'Target'], last_updated: '2024-12' },
    'zephyrhills': { average_price: 1.29, price_low: 0.79, price_high: 1.89, currency: 'USD', typical_stores: ['Walmart', 'Publix', 'Target'], last_updated: '2024-12' },
    'mountain valley': { average_price: 3.99, price_low: 2.99, price_high: 5.49, currency: 'USD', typical_stores: ['Whole Foods', 'Sprouts', 'Natural Grocers'], last_updated: '2024-12' },
    'san pellegrino': { average_price: 2.49, price_low: 1.99, price_high: 3.49, currency: 'USD', typical_stores: ['Target', 'Whole Foods', 'Costco'], last_updated: '2024-12' },
    'perrier': { average_price: 2.29, price_low: 1.79, price_high: 2.99, currency: 'USD', typical_stores: ['Target', 'Whole Foods', 'Costco'], last_updated: '2024-12' },
    'topo chico': { average_price: 1.99, price_low: 1.49, price_high: 2.79, currency: 'USD', typical_stores: ['Target', 'H-E-B', 'Whole Foods'], last_updated: '2024-12' },
    'la croix': { average_price: 5.99, price_low: 4.49, price_high: 7.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'Costco'], last_updated: '2024-12' },
    'bubly': { average_price: 5.49, price_low: 3.99, price_high: 6.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'Costco'], last_updated: '2024-12' },
    'aha': { average_price: 5.49, price_low: 3.99, price_high: 6.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'Kroger'], last_updated: '2024-12' },
    // Sodas
    'coca-cola': { average_price: 2.29, price_low: 1.79, price_high: 2.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'coke': { average_price: 2.29, price_low: 1.79, price_high: 2.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'pepsi': { average_price: 2.19, price_low: 1.69, price_high: 2.89, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'dr pepper': { average_price: 2.29, price_low: 1.79, price_high: 2.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'sprite': { average_price: 2.19, price_low: 1.69, price_high: 2.89, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    // Energy drinks
    'red bull': { average_price: 3.49, price_low: 2.49, price_high: 4.49, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'monster': { average_price: 2.99, price_low: 2.29, price_high: 3.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'celsius': { average_price: 2.49, price_low: 1.99, price_high: 3.29, currency: 'USD', typical_stores: ['Target', 'Walmart', 'GNC'], last_updated: '2024-12' },
    // Sports drinks
    'gatorade': { average_price: 1.99, price_low: 1.49, price_high: 2.79, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'bodyarmor': { average_price: 2.49, price_low: 1.79, price_high: 3.29, currency: 'USD', typical_stores: ['Target', 'Walmart', 'CVS'], last_updated: '2024-12' },
    'powerade': { average_price: 1.79, price_low: 1.29, price_high: 2.49, currency: 'USD', typical_stores: ['Target', 'Walmart'], last_updated: '2024-12' },
    // Juices
    'tropicana': { average_price: 4.99, price_low: 3.99, price_high: 6.49, currency: 'USD', typical_stores: ['Target', 'Walmart', 'Kroger'], last_updated: '2024-12' },
    'simply orange': { average_price: 4.49, price_low: 3.49, price_high: 5.99, currency: 'USD', typical_stores: ['Target', 'Walmart', 'Kroger'], last_updated: '2024-12' },
    // Coffee
    'starbucks': { average_price: 3.49, price_low: 2.79, price_high: 4.49, currency: 'USD', typical_stores: ['Target', 'Starbucks', 'CVS'], last_updated: '2024-12' },
    // Alcohol
    'budweiser': { average_price: 9.99, price_low: 7.99, price_high: 12.99, currency: 'USD', typical_stores: ['Liquor Stores', 'Walmart'], last_updated: '2024-12' },
    'corona': { average_price: 15.99, price_low: 12.99, price_high: 18.99, currency: 'USD', typical_stores: ['Liquor Stores', 'Costco'], last_updated: '2024-12' },
    'white claw': { average_price: 17.99, price_low: 14.99, price_high: 21.99, currency: 'USD', typical_stores: ['Target', 'Costco'], last_updated: '2024-12' },
  };
  
  for (const [key, pricing] of Object.entries(namePricingMap)) {
    if (nameLower.includes(key)) {
      return pricing;
    }
  }
  
  return null;
};
