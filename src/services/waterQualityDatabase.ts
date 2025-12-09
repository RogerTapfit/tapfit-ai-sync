// Comprehensive water quality database with pH levels, grades, and mineral content

export interface WaterProduct {
  name: string;
  brand: string;
  barcodes?: string[];
  ph_level: number;
  quality_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  quality_score: number; // 0-100
  water_type: 'spring' | 'purified' | 'mineral' | 'alkaline' | 'sparkling' | 'artesian' | 'distilled';
  source_location?: string;
  minerals?: {
    calcium_mg?: number;
    magnesium_mg?: number;
    sodium_mg?: number;
    potassium_mg?: number;
    bicarbonate_mg?: number;
    silica_mg?: number;
    tds_ppm?: number; // Total Dissolved Solids
  };
  features?: string[];
  pros?: string[];
  cons?: string[];
  serving_size_oz?: number;
}

// Database of popular water brands with quality data
export const WATER_QUALITY_DATABASE: Record<string, WaterProduct> = {
  // Premium Waters - Grade A
  'fiji': {
    name: 'Fiji Natural Artesian Water',
    brand: 'Fiji',
    barcodes: ['632565000012', '632565000029'],
    ph_level: 7.7,
    quality_grade: 'A',
    quality_score: 95,
    water_type: 'artesian',
    source_location: 'Fiji Islands',
    minerals: {
      calcium_mg: 18,
      magnesium_mg: 15,
      sodium_mg: 18,
      potassium_mg: 5,
      silica_mg: 93,
      tds_ppm: 222
    },
    features: ['Natural Silica', 'Untouched by Man', 'BPA-Free Bottle'],
    pros: ['High natural silica content', 'Pristine aquifer source', 'Balanced mineral profile', 'Smooth taste'],
    cons: ['Higher carbon footprint (shipping)', 'Premium pricing', 'Plastic bottle'],
    serving_size_oz: 16.9
  },
  'evian': {
    name: 'Evian Natural Spring Water',
    brand: 'Evian',
    barcodes: ['061314000070', '079298000702'],
    ph_level: 7.2,
    quality_grade: 'A',
    quality_score: 93,
    water_type: 'spring',
    source_location: 'French Alps',
    minerals: {
      calcium_mg: 80,
      magnesium_mg: 26,
      sodium_mg: 6.5,
      potassium_mg: 1,
      bicarbonate_mg: 360,
      tds_ppm: 309
    },
    features: ['15+ Year Natural Filtration', 'Carbon Neutral Certified'],
    pros: ['Excellent mineral content', 'Natural 15-year filtration', 'Neutral pH', 'High calcium'],
    cons: ['Premium pricing', 'Imported (carbon footprint)'],
    serving_size_oz: 16.9
  },
  'essentia': {
    name: 'Essentia Ionized Alkaline Water',
    brand: 'Essentia',
    barcodes: ['851782002015', '851782002039'],
    ph_level: 9.5,
    quality_grade: 'A',
    quality_score: 91,
    water_type: 'alkaline',
    source_location: 'USA',
    minerals: {
      sodium_mg: 0,
      potassium_mg: 2,
      magnesium_mg: 1,
      calcium_mg: 3,
      tds_ppm: 70
    },
    features: ['Ionized', '99.9% Pure', 'Electrolyte Infused', 'Supercharged'],
    pros: ['High pH for alkaline benefits', 'Clean taste', 'Electrolyte enhanced', 'Domestic production'],
    cons: ['Purified (not natural)', 'Low mineral content', 'Premium pricing'],
    serving_size_oz: 20
  },
  'core': {
    name: 'Core Hydration Perfect pH Water',
    brand: 'Core',
    barcodes: ['851561003210', '851561003227'],
    ph_level: 7.4,
    quality_grade: 'A',
    quality_score: 88,
    water_type: 'purified',
    source_location: 'USA',
    minerals: {
      calcium_mg: 8,
      magnesium_mg: 6,
      potassium_mg: 3,
      tds_ppm: 45
    },
    features: ['Perfect pH 7.4', 'Electrolytes', 'Ultra-Purified', 'BPA-Free'],
    pros: ['Balanced pH matching body', 'Added electrolytes', 'Clean taste', 'Ergonomic bottle'],
    cons: ['Purified water base', 'Moderate mineral content'],
    serving_size_oz: 23.9
  },
  'mountain_valley': {
    name: 'Mountain Valley Spring Water',
    brand: 'Mountain Valley',
    barcodes: ['075140000012'],
    ph_level: 7.8,
    quality_grade: 'A',
    quality_score: 96,
    water_type: 'spring',
    source_location: 'Ouachita Mountains, Arkansas',
    minerals: {
      calcium_mg: 68,
      magnesium_mg: 8,
      sodium_mg: 2.8,
      potassium_mg: 1,
      tds_ppm: 220
    },
    features: ['Glass Bottles Available', 'Since 1871', 'Award Winning'],
    pros: ['Excellent natural source', 'High quality spring', 'Glass bottle option', 'Great mineral profile'],
    cons: ['Limited availability', 'Higher price point'],
    serving_size_oz: 16.9
  },

  // Good Quality Waters - Grade B
  'smartwater': {
    name: 'Glacéau Smartwater',
    brand: 'Smartwater',
    barcodes: ['786162002501', '786162002518'],
    ph_level: 7.0,
    quality_grade: 'B',
    quality_score: 82,
    water_type: 'purified',
    source_location: 'USA',
    minerals: {
      calcium_mg: 10,
      magnesium_mg: 15,
      potassium_mg: 10,
      tds_ppm: 30
    },
    features: ['Vapor Distilled', 'Electrolyte Enhanced'],
    pros: ['Clean neutral taste', 'Added electrolytes', 'Widely available'],
    cons: ['Vapor distilled (not natural)', 'Low TDS', 'Plastic bottle'],
    serving_size_oz: 20
  },
  'poland_spring': {
    name: 'Poland Spring 100% Natural Spring Water',
    brand: 'Poland Spring',
    barcodes: ['075720000227', '075720000210'],
    ph_level: 7.2,
    quality_grade: 'B',
    quality_score: 80,
    water_type: 'spring',
    source_location: 'Maine, USA',
    minerals: {
      calcium_mg: 9,
      magnesium_mg: 2,
      sodium_mg: 5,
      tds_ppm: 56
    },
    features: ['100% Natural Spring', 'Recyclable Bottle'],
    pros: ['Natural spring source', 'Good pH balance', 'Affordable', 'Widely available'],
    cons: ['Lower mineral content', 'Plastic packaging'],
    serving_size_oz: 16.9
  },
  'voss': {
    name: 'Voss Artesian Water',
    brand: 'Voss',
    barcodes: ['682430000011', '682430000028'],
    ph_level: 6.0,
    quality_grade: 'B',
    quality_score: 78,
    water_type: 'artesian',
    source_location: 'Norway',
    minerals: {
      calcium_mg: 5,
      magnesium_mg: 1,
      sodium_mg: 5,
      tds_ppm: 44
    },
    features: ['Artesian Source', 'Iconic Glass Bottle', 'Low Sodium'],
    pros: ['Pure taste', 'Premium glass bottle', 'Norwegian source'],
    cons: ['Slightly acidic pH', 'Low mineral content', 'Expensive'],
    serving_size_oz: 16.9
  },
  'deer_park': {
    name: 'Deer Park Natural Spring Water',
    brand: 'Deer Park',
    barcodes: ['082657000012'],
    ph_level: 7.1,
    quality_grade: 'B',
    quality_score: 77,
    water_type: 'spring',
    source_location: 'USA (Various Springs)',
    minerals: {
      calcium_mg: 15,
      magnesium_mg: 4,
      sodium_mg: 8,
      tds_ppm: 80
    },
    features: ['Natural Spring', 'Eco-Friendly Packaging'],
    pros: ['Good pH', 'Affordable', 'Natural spring source'],
    cons: ['Multiple source locations', 'Basic mineral profile'],
    serving_size_oz: 16.9
  },
  'crystal_geyser': {
    name: 'Crystal Geyser Alpine Spring Water',
    brand: 'Crystal Geyser',
    barcodes: ['654871000012'],
    ph_level: 7.0,
    quality_grade: 'B',
    quality_score: 75,
    water_type: 'spring',
    source_location: 'USA (Multiple Springs)',
    minerals: {
      calcium_mg: 11,
      magnesium_mg: 2,
      sodium_mg: 4,
      tds_ppm: 70
    },
    features: ['Alpine Spring', 'Bottled at Source'],
    pros: ['Bottled at source', 'Affordable', 'Good availability'],
    cons: ['Variable quality by source', 'Basic packaging'],
    serving_size_oz: 16.9
  },

  // Average Quality Waters - Grade C
  'dasani': {
    name: 'Dasani Purified Water',
    brand: 'Dasani',
    barcodes: ['049000042559', '049000006346'],
    ph_level: 5.6,
    quality_grade: 'C',
    quality_score: 58,
    water_type: 'purified',
    source_location: 'Municipal Water Source',
    minerals: {
      magnesium_mg: 1,
      potassium_mg: 1,
      sodium_mg: 0,
      tds_ppm: 35
    },
    features: ['Enhanced with Minerals', 'PlantBottle'],
    pros: ['Widely available', 'Affordable', 'Plant-based bottle'],
    cons: ['Acidic pH', 'Municipal tap water source', 'Added minerals for taste'],
    serving_size_oz: 20
  },
  'aquafina': {
    name: 'Aquafina Purified Drinking Water',
    brand: 'Aquafina',
    barcodes: ['012000001253', '012000001260'],
    ph_level: 5.5,
    quality_grade: 'C',
    quality_score: 55,
    water_type: 'purified',
    source_location: 'Municipal Water Source',
    minerals: {
      sodium_mg: 0,
      tds_ppm: 4
    },
    features: ['HydRO-7 Purification', 'Crisp Taste'],
    pros: ['Widely available', 'Very affordable', 'Consistent taste'],
    cons: ['Acidic pH', 'Municipal water source', 'Very low minerals', 'Heavy purification'],
    serving_size_oz: 20
  },
  'nestle_pure_life': {
    name: 'Nestlé Pure Life Purified Water',
    brand: 'Nestlé',
    barcodes: ['068274350016', '068274350023'],
    ph_level: 6.8,
    quality_grade: 'C',
    quality_score: 62,
    water_type: 'purified',
    source_location: 'Municipal/Well Sources',
    minerals: {
      calcium_mg: 8,
      magnesium_mg: 3,
      sodium_mg: 4,
      tds_ppm: 45
    },
    features: ['12-Step Quality Process', 'Enhanced with Minerals'],
    pros: ['Better pH than competitors', 'Affordable', 'Added minerals'],
    cons: ['Municipal source', 'Purified water', 'Moderate quality'],
    serving_size_oz: 16.9
  },
  'arrowhead': {
    name: 'Arrowhead Mountain Spring Water',
    brand: 'Arrowhead',
    barcodes: ['071142000012'],
    ph_level: 6.8,
    quality_grade: 'C',
    quality_score: 65,
    water_type: 'spring',
    source_location: 'California Mountains',
    minerals: {
      calcium_mg: 20,
      magnesium_mg: 5,
      sodium_mg: 3,
      tds_ppm: 120
    },
    features: ['Mountain Spring', 'Since 1894'],
    pros: ['Natural spring source', 'Good mineral content', 'Long history'],
    cons: ['Slightly acidic', 'Regional availability'],
    serving_size_oz: 16.9
  },

  // Specialty Waters
  'perrier': {
    name: 'Perrier Carbonated Mineral Water',
    brand: 'Perrier',
    barcodes: ['074780000116', '074780000123'],
    ph_level: 5.5,
    quality_grade: 'B',
    quality_score: 80,
    water_type: 'sparkling',
    source_location: 'Vergèze, France',
    minerals: {
      calcium_mg: 155,
      magnesium_mg: 6,
      sodium_mg: 11.5,
      bicarbonate_mg: 430,
      tds_ppm: 475
    },
    features: ['Natural Carbonation', 'Zero Calories', 'Iconic Green Bottle'],
    pros: ['High calcium content', 'Natural carbonation', 'Premium quality', 'Great for digestion'],
    cons: ['Acidic due to carbonation', 'Acquired taste', 'Premium price'],
    serving_size_oz: 11.15
  },
  'san_pellegrino': {
    name: 'S.Pellegrino Sparkling Natural Mineral Water',
    brand: 'S.Pellegrino',
    barcodes: ['041508800013', '041508800020'],
    ph_level: 5.6,
    quality_grade: 'A',
    quality_score: 88,
    water_type: 'sparkling',
    source_location: 'Italian Alps',
    minerals: {
      calcium_mg: 181,
      magnesium_mg: 52,
      sodium_mg: 33,
      bicarbonate_mg: 243,
      tds_ppm: 960
    },
    features: ['Fine Dining Choice', 'Natural Minerals', 'Since 1899'],
    pros: ['Exceptional mineral content', 'Fine dining standard', 'Rich taste', 'High magnesium'],
    cons: ['Acidic pH', 'Higher sodium', 'Premium price'],
    serving_size_oz: 16.9
  },
  'topo_chico': {
    name: 'Topo Chico Mineral Water',
    brand: 'Topo Chico',
    barcodes: ['021136121001'],
    ph_level: 5.8,
    quality_grade: 'B',
    quality_score: 82,
    water_type: 'sparkling',
    source_location: 'Monterrey, Mexico',
    minerals: {
      calcium_mg: 96,
      magnesium_mg: 28,
      sodium_mg: 97,
      tds_ppm: 630
    },
    features: ['Legendary Source', 'Cult Following', 'Aggressive Carbonation'],
    pros: ['Strong carbonation', 'Good minerals', 'Cult favorite', 'Great mixer'],
    cons: ['Higher sodium', 'Acidic', 'Limited availability in some regions'],
    serving_size_oz: 12
  },
  'lacroix': {
    name: 'LaCroix Sparkling Water',
    brand: 'LaCroix',
    barcodes: ['073360000126'],
    ph_level: 5.0,
    quality_grade: 'C',
    quality_score: 60,
    water_type: 'sparkling',
    source_location: 'USA',
    minerals: {
      sodium_mg: 0,
      tds_ppm: 15
    },
    features: ['Zero Calories', 'Zero Sweeteners', 'Natural Flavors'],
    pros: ['No calories or sweeteners', 'Many flavor options', 'Affordable'],
    cons: ['Very acidic', 'No mineral content', 'Purified base water'],
    serving_size_oz: 12
  },

  // Alkaline Waters
  'essentia_1l': {
    name: 'Essentia Water 1 Liter',
    brand: 'Essentia',
    barcodes: ['851782002022'],
    ph_level: 9.5,
    quality_grade: 'A',
    quality_score: 91,
    water_type: 'alkaline',
    source_location: 'USA',
    minerals: {
      sodium_mg: 0,
      potassium_mg: 2,
      magnesium_mg: 1,
      calcium_mg: 3,
      tds_ppm: 70
    },
    features: ['Ionized', '99.9% Pure', 'Electrolyte Infused'],
    pros: ['High pH', 'Clean taste', 'Electrolytes added'],
    cons: ['Purified base', 'Low natural minerals'],
    serving_size_oz: 33.8
  },
  'real_water': {
    name: 'Real Water Alkalized Water',
    brand: 'Real Water',
    barcodes: ['736211640017'],
    ph_level: 8.0,
    quality_grade: 'B',
    quality_score: 75,
    water_type: 'alkaline',
    source_location: 'USA',
    minerals: {
      sodium_mg: 4,
      potassium_mg: 1,
      tds_ppm: 50
    },
    features: ['E2 Technology', 'Stable Alkalinity'],
    pros: ['Stable pH', 'Affordable alkaline option'],
    cons: ['Purified base', 'Processed alkalinity'],
    serving_size_oz: 16.9
  },
  'waiakea': {
    name: 'Waiakea Hawaiian Volcanic Water',
    brand: 'Waiakea',
    barcodes: ['857636006100'],
    ph_level: 8.2,
    quality_grade: 'A',
    quality_score: 90,
    water_type: 'spring',
    source_location: 'Mauna Loa, Hawaii',
    minerals: {
      calcium_mg: 3,
      magnesium_mg: 2,
      sodium_mg: 5,
      potassium_mg: 1,
      silica_mg: 35,
      tds_ppm: 79
    },
    features: ['Volcanic Filtration', 'Naturally Alkaline', 'Carbon Negative'],
    pros: ['Natural alkalinity', 'Volcanic filtration', 'Sustainable brand', 'Good silica'],
    cons: ['Premium pricing', 'Limited distribution'],
    serving_size_oz: 16.9
  },

  // Distilled Water
  'distilled_generic': {
    name: 'Distilled Water',
    brand: 'Generic',
    ph_level: 7.0,
    quality_grade: 'C',
    quality_score: 50,
    water_type: 'distilled',
    source_location: 'Various',
    minerals: {
      tds_ppm: 0
    },
    features: ['100% Pure H2O', 'No Minerals', 'No Contaminants'],
    pros: ['Pure water', 'Good for appliances', 'No contaminants'],
    cons: ['No minerals at all', 'Flat taste', 'Not ideal for daily drinking'],
    serving_size_oz: 128
  }
};

// Helper function to find water product by barcode
export function findWaterByBarcode(barcode: string): WaterProduct | null {
  for (const [key, product] of Object.entries(WATER_QUALITY_DATABASE)) {
    if (product.barcodes?.includes(barcode)) {
      return product;
    }
  }
  return null;
}

// Helper function to find water product by name (fuzzy match)
export function findWaterByName(name: string): WaterProduct | null {
  const normalizedName = name.toLowerCase().trim();
  
  for (const [key, product] of Object.entries(WATER_QUALITY_DATABASE)) {
    const productNameLower = product.name.toLowerCase();
    const brandLower = product.brand.toLowerCase();
    
    if (
      productNameLower.includes(normalizedName) ||
      normalizedName.includes(productNameLower) ||
      normalizedName.includes(brandLower) ||
      brandLower.includes(normalizedName)
    ) {
      return product;
    }
  }
  return null;
}

// Get pH level description
export function getPHDescription(ph: number): { text: string; color: string } {
  if (ph < 6.0) return { text: 'Acidic', color: 'text-red-500' };
  if (ph < 6.5) return { text: 'Slightly Acidic', color: 'text-orange-500' };
  if (ph < 7.5) return { text: 'Neutral', color: 'text-green-500' };
  if (ph < 8.5) return { text: 'Slightly Alkaline', color: 'text-cyan-500' };
  return { text: 'Alkaline', color: 'text-blue-500' };
}

// Get grade color
export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-green-500 bg-green-500/10 border-green-500/30';
    case 'B': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    case 'C': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    case 'D': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    case 'F': return 'text-red-500 bg-red-500/10 border-red-500/30';
    default: return 'text-muted-foreground bg-muted border-border';
  }
}

// Get grade description
export function getGradeDescription(grade: string): string {
  switch (grade) {
    case 'A': return 'Excellent - Premium quality water with optimal pH and mineral content';
    case 'B': return 'Good - Quality water with decent mineral profile';
    case 'C': return 'Average - Basic hydration, may lack minerals or have sub-optimal pH';
    case 'D': return 'Below Average - Consider better alternatives';
    case 'F': return 'Poor - Not recommended for regular consumption';
    default: return 'Unknown quality';
  }
}
