// Comprehensive database for popular beverages that might not be in standard APIs

interface BeverageProduct {
  name: string;
  brand: string;
  category: string;
  calories: number;
  carbs: number;
  sugars: number;
  caffeine?: number;
  servingSize: string;
  isAlcoholic: boolean;
  alcohol?: number;
}

// Coca-Cola Products
const COCA_COLA_PRODUCTS = new Map<string, BeverageProduct>([
  // Classic Coca-Cola
  ['049000000443', { name: 'Coca-Cola Classic', brand: 'Coca-Cola', category: 'Soft Drinks', calories: 39, carbs: 10.6, sugars: 10.6, caffeine: 34, servingSize: '355ml', isAlcoholic: false }],
  ['049000042533', { name: 'Coca-Cola Classic', brand: 'Coca-Cola', category: 'Soft Drinks', calories: 39, carbs: 10.6, sugars: 10.6, caffeine: 34, servingSize: '355ml', isAlcoholic: false }],
  ['049000050104', { name: 'Coca-Cola Classic 20oz', brand: 'Coca-Cola', category: 'Soft Drinks', calories: 65, carbs: 17.7, sugars: 17.7, caffeine: 57, servingSize: '591ml', isAlcoholic: false }],
  
  // Diet Coke
  ['049000000337', { name: 'Diet Coke', brand: 'Coca-Cola', category: 'Diet Soft Drinks', calories: 0, carbs: 0, sugars: 0, caffeine: 46, servingSize: '355ml', isAlcoholic: false }],
  ['049000042694', { name: 'Diet Coke', brand: 'Coca-Cola', category: 'Diet Soft Drinks', calories: 0, carbs: 0, sugars: 0, caffeine: 46, servingSize: '355ml', isAlcoholic: false }],
  
  // Coke Zero
  ['049000056549', { name: 'Coca-Cola Zero Sugar', brand: 'Coca-Cola', category: 'Diet Soft Drinks', calories: 0, carbs: 0, sugars: 0, caffeine: 34, servingSize: '355ml', isAlcoholic: false }],
  ['049000030730', { name: 'Coca-Cola Zero Sugar', brand: 'Coca-Cola', category: 'Diet Soft Drinks', calories: 0, carbs: 0, sugars: 0, caffeine: 34, servingSize: '355ml', isAlcoholic: false }],
  
  // Sprite
  ['049000000368', { name: 'Sprite', brand: 'Coca-Cola', category: 'Soft Drinks', calories: 38, carbs: 10, sugars: 10, caffeine: 0, servingSize: '355ml', isAlcoholic: false }],
  ['049000042540', { name: 'Sprite', brand: 'Coca-Cola', category: 'Soft Drinks', calories: 38, carbs: 10, sugars: 10, caffeine: 0, servingSize: '355ml', isAlcoholic: false }],
  
  // Fanta
  ['049000000375', { name: 'Fanta Orange', brand: 'Coca-Cola', category: 'Soft Drinks', calories: 44, carbs: 12, sugars: 12, caffeine: 0, servingSize: '355ml', isAlcoholic: false }],
  ['049000042564', { name: 'Fanta Orange', brand: 'Coca-Cola', category: 'Soft Drinks', calories: 44, carbs: 12, sugars: 12, caffeine: 0, servingSize: '355ml', isAlcoholic: false }],
]);

// Pepsi Products
const PEPSI_PRODUCTS = new Map<string, BeverageProduct>([
  ['012000161155', { name: 'Pepsi Cola', brand: 'PepsiCo', category: 'Soft Drinks', calories: 41, carbs: 11, sugars: 11, caffeine: 38, servingSize: '355ml', isAlcoholic: false }],
  ['012000161148', { name: 'Diet Pepsi', brand: 'PepsiCo', category: 'Diet Soft Drinks', calories: 0, carbs: 0, sugars: 0, caffeine: 35, servingSize: '355ml', isAlcoholic: false }],
  ['012000161162', { name: 'Pepsi Zero Sugar', brand: 'PepsiCo', category: 'Diet Soft Drinks', calories: 0, carbs: 0, sugars: 0, caffeine: 69, servingSize: '355ml', isAlcoholic: false }],
  ['012000161179', { name: 'Mountain Dew', brand: 'PepsiCo', category: 'Soft Drinks', calories: 46, carbs: 12, sugars: 12, caffeine: 54, servingSize: '355ml', isAlcoholic: false }],
]);

// Dr Pepper Products
const DR_PEPPER_PRODUCTS = new Map<string, BeverageProduct>([
  ['078000082555', { name: 'Dr Pepper', brand: 'Dr Pepper', category: 'Soft Drinks', calories: 40, carbs: 11, sugars: 10, caffeine: 41, servingSize: '355ml', isAlcoholic: false }],
  ['078000082562', { name: 'Diet Dr Pepper', brand: 'Dr Pepper', category: 'Diet Soft Drinks', calories: 0, carbs: 0, sugars: 0, caffeine: 41, servingSize: '355ml', isAlcoholic: false }],
]);

// Energy Drinks
const ENERGY_DRINKS = new Map<string, BeverageProduct>([
  ['9002490100006', { name: 'Red Bull Energy Drink', brand: 'Red Bull', category: 'Energy Drinks', calories: 45, carbs: 11, sugars: 10, caffeine: 80, servingSize: '355ml', isAlcoholic: false }],
  ['070847811022', { name: 'Monster Energy', brand: 'Monster', category: 'Energy Drinks', calories: 50, carbs: 13, sugars: 13, caffeine: 86, servingSize: '355ml', isAlcoholic: false }],
]);

// Sports Drinks
const SPORTS_DRINKS = new Map<string, BeverageProduct>([
  ['052000337914', { name: 'Gatorade Fruit Punch', brand: 'Gatorade', category: 'Sports Drinks', calories: 21, carbs: 6, sugars: 6, caffeine: 0, servingSize: '355ml', isAlcoholic: false }],
  ['052000337907', { name: 'Gatorade Lemon-Lime', brand: 'Gatorade', category: 'Sports Drinks', calories: 21, carbs: 6, sugars: 6, caffeine: 0, servingSize: '355ml', isAlcoholic: false }],
]);

// Water Products
const WATER_PRODUCTS = new Map<string, BeverageProduct>([
  ['012000638443', { name: 'Aquafina Water', brand: 'PepsiCo', category: 'Water', calories: 0, carbs: 0, sugars: 0, caffeine: 0, servingSize: '500ml', isAlcoholic: false }],
  ['049000031515', { name: 'Dasani Water', brand: 'Coca-Cola', category: 'Water', calories: 0, carbs: 0, sugars: 0, caffeine: 0, servingSize: '500ml', isAlcoholic: false }],
]);

// Alcoholic Beverages
const ALCOHOLIC_BEVERAGES = new Map<string, BeverageProduct>([
  // White Claw
  ['012000814488', { name: 'White Claw Hard Seltzer Black Cherry', brand: 'White Claw', category: 'Hard Seltzer', calories: 28, carbs: 0.7, sugars: 0.7, servingSize: '355ml', isAlcoholic: true, alcohol: 5.0 }],
  ['012000814495', { name: 'White Claw Hard Seltzer Mango', brand: 'White Claw', category: 'Hard Seltzer', calories: 28, carbs: 0.7, sugars: 0.7, servingSize: '355ml', isAlcoholic: true, alcohol: 5.0 }],
  
  // BeatBox (from previous)
  ['883350007826', { name: 'BeatBox Blue Razzberry', brand: 'BeatBox', category: 'Alcoholic Punch', calories: 75, carbs: 9, sugars: 9, servingSize: '200ml', isAlcoholic: true, alcohol: 11.1 }],
]);

// Combine all databases
const ALL_BEVERAGES = new Map<string, BeverageProduct>([
  ...COCA_COLA_PRODUCTS,
  ...PEPSI_PRODUCTS,
  ...DR_PEPPER_PRODUCTS,
  ...ENERGY_DRINKS,
  ...SPORTS_DRINKS,
  ...WATER_PRODUCTS,
  ...ALCOHOLIC_BEVERAGES
]);

export const getPopularBeverage = (barcode: string): BeverageProduct | null => {
  return ALL_BEVERAGES.get(barcode) || null;
};

export const getAllBeverages = (): Map<string, BeverageProduct> => {
  return ALL_BEVERAGES;
};

export const searchBeveragesByName = (searchTerm: string): BeverageProduct[] => {
  const results: BeverageProduct[] = [];
  const lowerSearch = searchTerm.toLowerCase();
  
  ALL_BEVERAGES.forEach(beverage => {
    if (beverage.name.toLowerCase().includes(lowerSearch) ||
        beverage.brand.toLowerCase().includes(lowerSearch)) {
      results.push(beverage);
    }
  });
  
  return results;
};