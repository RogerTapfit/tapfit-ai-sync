import { getBeatboxProduct, getPopularAlcoholicBeverage } from './beatboxDatabase';
import { getPopularBeverage } from './popularBeveragesDatabase';

interface ProductData {
  id: string;
  name: string;
  brand?: string;
  image_url?: string;
  nutrition?: {
    calories_100g?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    salt_100g?: number;
    alcohol_100g?: number; // ABV percentage
    // Per-serving values (direct from label)
    calories_serving?: number;
    proteins_serving?: number;
    carbohydrates_serving?: number;
    fat_serving?: number;
    sugars_serving?: number;
    alcohol_serving?: number;
    // Micronutrients
    sodium_mg?: number;
    caffeine_mg?: number;
    calcium_mg?: number;
    potassium_mg?: number;
    iron_mg?: number;
    // Vitamins
    vitamin_a_mcg?: number;
    vitamin_c_mg?: number;
    vitamin_d_mcg?: number;
    vitamin_b6_mg?: number;
    vitamin_b12_mcg?: number;
    niacin_mg?: number;
    riboflavin_mg?: number;
    thiamin_mg?: number;
    biotin_mcg?: number;
    pantothenic_acid_mg?: number;
    // Minerals
    magnesium_mg?: number;
    zinc_mg?: number;
    chromium_mcg?: number;
  };
  ingredients?: string;
  serving_size?: string;
  serving_quantity_ml?: number;
  product_quantity_ml?: number;
  servings_per_container?: number;
  category?: string;
  store_info?: {
    stores?: string[];
    price_range?: string;
  };
  data_source?: string;
  confidence?: number;
}

interface APIResponse {
  success: boolean;
  product?: ProductData;
  error?: string;
}

export class EnhancedBarcodeService {
  private static API_KEYS = {
    goUPC: localStorage.getItem('go_upc_api_key'),
    barcodeSpider: localStorage.getItem('barcode_spider_api_key'),
    upcItemDB: localStorage.getItem('upc_itemdb_api_key'),
  };

  static setApiKey(service: keyof typeof this.API_KEYS, key: string) {
    localStorage.setItem(`${service.toLowerCase().replace('upc', '_upc')}_api_key`, key);
    this.API_KEYS[service] = key;
  }

  // Check if nutrition data needs AI web lookup enhancement
  private static needsAIEnhancement(product: ProductData): boolean {
    const nutrition = product.nutrition;
    if (!nutrition) return true;

    const isEnergyDrink = /energy|celsius|monster|redbull|rockstar|bang|reign|ghost|c4|3d|alani/i.test(product.name || '');
    const isVitaminEnhanced = /vitamin|enhanced|fortified|boost|plus/i.test(product.name || '');

    // Energy drinks should have caffeine and B vitamins
    if (isEnergyDrink) {
      if (!nutrition.caffeine_mg || !nutrition.vitamin_b12_mcg) {
        return true;
      }
    }

    // Check if vitamin data is missing for vitamin-enhanced products
    if (isVitaminEnhanced || isEnergyDrink) {
      const vitaminFields = [
        nutrition.vitamin_c_mg, nutrition.vitamin_b6_mg, nutrition.vitamin_b12_mcg,
        nutrition.niacin_mg, nutrition.riboflavin_mg, nutrition.biotin_mcg
      ];
      const populatedCount = vitaminFields.filter(v => v && v > 0).length;
      if (populatedCount < 2) return true;
    }

    return false;
  }

  // Fetch complete nutrition data via AI web search
  private static async fetchNutritionFromAI(productName: string, brand: string, barcode: string): Promise<any | null> {
    try {
      console.log('Fetching nutrition from AI for:', productName, brand);
      
      const response = await fetch('https://cxknqevfuzhcfswxdlzn.supabase.co/functions/v1/nutrition-web-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName,
          brand,
          barcode
        })
      });

      if (!response.ok) {
        console.error('AI nutrition lookup failed:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.success && data.nutrition) {
        console.log('AI nutrition data received:', data.nutrition);
        return data.nutrition;
      }

      return null;
    } catch (error) {
      console.error('Error fetching AI nutrition:', error);
      return null;
    }
  }

  // Merge AI nutrition data into product data
  private static mergeAINutrition(product: ProductData, aiNutrition: any): ProductData {
    const merged = { ...product };
    
    if (!merged.nutrition) {
      merged.nutrition = {};
    }

    // Update basic nutrition if provided
    if (aiNutrition.calories !== undefined) merged.nutrition.calories_serving = aiNutrition.calories;
    if (aiNutrition.protein_g !== undefined) merged.nutrition.proteins_serving = aiNutrition.protein_g;
    if (aiNutrition.carbs_g !== undefined) merged.nutrition.carbohydrates_serving = aiNutrition.carbs_g;
    if (aiNutrition.fat_g !== undefined) merged.nutrition.fat_serving = aiNutrition.fat_g;
    if (aiNutrition.sugars_g !== undefined) merged.nutrition.sugars_serving = aiNutrition.sugars_g;
    if (aiNutrition.sodium_mg !== undefined) merged.nutrition.sodium_mg = aiNutrition.sodium_mg;
    if (aiNutrition.caffeine_mg !== undefined) merged.nutrition.caffeine_mg = aiNutrition.caffeine_mg;

    // Process vitamins array
    if (aiNutrition.vitamins && Array.isArray(aiNutrition.vitamins)) {
      for (const vitamin of aiNutrition.vitamins) {
        const name = vitamin.name?.toLowerCase() || '';
        const amount = vitamin.amount;
        const unit = vitamin.unit?.toLowerCase() || '';

        if (name.includes('vitamin c')) merged.nutrition.vitamin_c_mg = amount;
        if (name.includes('b6')) merged.nutrition.vitamin_b6_mg = amount;
        if (name.includes('b12')) merged.nutrition.vitamin_b12_mcg = unit.includes('mcg') ? amount : amount * 1000;
        if (name.includes('riboflavin') || name.includes('b2')) merged.nutrition.riboflavin_mg = amount;
        if (name.includes('niacin') || name.includes('b3')) merged.nutrition.niacin_mg = amount;
        if (name.includes('biotin')) merged.nutrition.biotin_mcg = unit.includes('mcg') ? amount : amount * 1000;
        if (name.includes('pantothenic')) merged.nutrition.pantothenic_acid_mg = amount;
        if (name.includes('vitamin a')) merged.nutrition.vitamin_a_mcg = unit.includes('mcg') ? amount : amount;
        if (name.includes('vitamin d')) merged.nutrition.vitamin_d_mcg = unit.includes('mcg') ? amount : amount;
      }
    }

    // Process minerals array
    if (aiNutrition.minerals && Array.isArray(aiNutrition.minerals)) {
      for (const mineral of aiNutrition.minerals) {
        const name = mineral.name?.toLowerCase() || '';
        const amount = mineral.amount;

        if (name.includes('calcium')) merged.nutrition.calcium_mg = amount;
        if (name.includes('potassium')) merged.nutrition.potassium_mg = amount;
        if (name.includes('magnesium')) merged.nutrition.magnesium_mg = amount;
        if (name.includes('iron')) merged.nutrition.iron_mg = amount;
        if (name.includes('zinc')) merged.nutrition.zinc_mg = amount;
        if (name.includes('chromium')) merged.nutrition.chromium_mcg = amount;
      }
    }

    // Update serving size if provided
    if (aiNutrition.serving_size) {
      merged.serving_size = aiNutrition.serving_size;
    }

    // Mark data source
    merged.data_source = `${merged.data_source || 'Unknown'} + AI Web Search`;
    merged.confidence = Math.max(merged.confidence || 0, 0.9);

    return merged;
  }

  static async scanBarcode(barcode: string): Promise<ProductData | null> {
    // First check our comprehensive popular beverages database
    const popularBeverage = getPopularBeverage(barcode);
    if (popularBeverage) {
      return {
        id: barcode,
        name: popularBeverage.name,
        brand: popularBeverage.brand,
        category: popularBeverage.category,
        nutrition: {
          calories_100g: Math.round((popularBeverage.calories / (parseInt(popularBeverage.servingSize) / 100))),
          proteins_100g: 0,
          carbohydrates_100g: Math.round((popularBeverage.carbs / (parseInt(popularBeverage.servingSize) / 100))),
          fat_100g: 0,
          fiber_100g: 0,
          sugars_100g: Math.round((popularBeverage.sugars / (parseInt(popularBeverage.servingSize) / 100))),
          salt_100g: 0,
        },
        serving_size: popularBeverage.servingSize,
        data_source: 'Popular Beverages Database',
        confidence: 1.0
      };
    }

    // Fallback to legacy BeatBox check
    const beatboxProduct = getBeatboxProduct(barcode);
    if (beatboxProduct) {
      return {
        id: barcode,
        name: beatboxProduct.name,
        brand: beatboxProduct.brand,
        category: 'Alcoholic Beverages',
        nutrition: {
          calories_100g: Math.round((beatboxProduct.calories / (parseInt(beatboxProduct.servingSize) / 100))),
          proteins_100g: 0,
          carbohydrates_100g: Math.round((beatboxProduct.carbs / (parseInt(beatboxProduct.servingSize) / 100))),
          fat_100g: 0,
          fiber_100g: 0,
          sugars_100g: Math.round((beatboxProduct.sugars / (parseInt(beatboxProduct.servingSize) / 100))),
          salt_100g: 0,
        },
        serving_size: beatboxProduct.servingSize,
        data_source: 'BeatBox Database',
        confidence: 1.0
      };
    }

    // Check popular alcoholic beverages
    const popularDrink = getPopularAlcoholicBeverage(barcode);
    if (popularDrink) {
      return {
        id: barcode,
        name: popularDrink.name,
        brand: popularDrink.brand,
        category: 'Alcoholic Beverages',
        nutrition: {
          calories_100g: Math.round((popularDrink.calories / 3.55)), // Assuming 355ml serving
          proteins_100g: 0,
          carbohydrates_100g: 5, // Typical for hard seltzers
          fat_100g: 0,
          fiber_100g: 0,
          sugars_100g: 2,
          salt_100g: 0,
        },
        serving_size: '355ml',
        data_source: 'Popular Beverages Database',
        confidence: 0.95
      };
    }

    const apis = [
      () => this.tryGoUPC(barcode),
      () => this.tryBarcodeSpider(barcode),
      () => this.tryUPCItemDB(barcode),
      () => this.tryOpenFoodFacts(barcode),
      () => this.tryAlcoholDatabase(barcode),
      () => this.tryFDADatabase(barcode)
    ];

    for (const apiCall of apis) {
      try {
        const result = await apiCall();
        if (result.success && result.product) {
          let product = result.product;
          
          // Check if product needs AI enhancement for complete nutrition data
          if (this.needsAIEnhancement(product)) {
            console.log('Product needs AI enhancement, fetching from web...');
            const aiNutrition = await this.fetchNutritionFromAI(
              product.name,
              product.brand || '',
              barcode
            );
            
            if (aiNutrition) {
              product = this.mergeAINutrition(product, aiNutrition);
            }
          }
          
          return product;
        }
      } catch (error) {
        console.warn('API call failed, trying next:', error);
        continue;
      }
    }

    return null;
  }

  private static async tryGoUPC(barcode: string): Promise<APIResponse> {
    if (!this.API_KEYS.goUPC) {
      return { success: false, error: 'Go-UPC API key not set' };
    }

    try {
      const response = await fetch(`https://go-upc.com/api/v1/code/${barcode}`, {
        headers: {
          'Authorization': `Bearer ${this.API_KEYS.goUPC}`,
        }
      });

      if (!response.ok) {
        return { success: false, error: 'Go-UPC API request failed' };
      }

      const data = await response.json();
      
      if (data.product) {
        return {
          success: true,
          product: {
            id: barcode,
            name: data.product.name || 'Unknown Product',
            brand: data.product.brand,
            image_url: data.product.imageUrl,
            category: data.product.category,
            store_info: {
              stores: data.product.stores || [],
              price_range: data.product.price
            },
            data_source: 'Go-UPC',
            confidence: 0.9
          }
        };
      }

      return { success: false, error: 'Product not found in Go-UPC' };
    } catch (error) {
      return { success: false, error: `Go-UPC error: ${error}` };
    }
  }

  private static async tryBarcodeSpider(barcode: string): Promise<APIResponse> {
    if (!this.API_KEYS.barcodeSpider) {
      return { success: false, error: 'Barcode Spider API key not set' };
    }

    try {
      const response = await fetch(`https://api.barcodespider.com/v1/lookup?upc=${barcode}&token=${this.API_KEYS.barcodeSpider}`);
      
      if (!response.ok) {
        return { success: false, error: 'Barcode Spider API request failed' };
      }

      const data = await response.json();
      
      if (data.item_response.item_attributes) {
        const item = data.item_response.item_attributes;
        return {
          success: true,
          product: {
            id: barcode,
            name: item.title || 'Unknown Product',
            brand: item.brand,
            image_url: item.image,
            category: item.category,
            data_source: 'Barcode Spider',
            confidence: 0.85
          }
        };
      }

      return { success: false, error: 'Product not found in Barcode Spider' };
    } catch (error) {
      return { success: false, error: `Barcode Spider error: ${error}` };
    }
  }

  private static async tryUPCItemDB(barcode: string): Promise<APIResponse> {
    try {
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
        headers: {
          'User-Agent': 'TapFit-Scanner/1.0'
        }
      });
      
      if (!response.ok) {
        return { success: false, error: 'UPCItemDB API request failed' };
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        return {
          success: true,
          product: {
            id: barcode,
            name: item.title || 'Unknown Product',
            brand: item.brand,
            image_url: item.images?.[0],
            category: item.category,
            data_source: 'UPCItemDB',
            confidence: 0.8
          }
        };
      }

      return { success: false, error: 'Product not found in UPCItemDB' };
    } catch (error) {
      return { success: false, error: `UPCItemDB error: ${error}` };
    }
  }

  private static async tryOpenFoodFacts(barcode: string): Promise<APIResponse> {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (!data.product) {
        return { success: false, error: 'Product not found in OpenFoodFacts' };
      }
      
      const product = data.product;
      const nutriments = product.nutriments || {};
      
      // Helper to parse volume from string (handles ml, L, liters, oz, fl oz)
      const parseVolumeMl = (str: string | undefined | number): number | null => {
        if (!str) return null;
        if (typeof str === 'number') return str;
        
        // Match patterns like "1.5L", "1.5 L", "1500ml", "500 ml", "750 mL"
        const literMatch = str.match(/([\d.]+)\s*l(?:iter)?s?\b/i);
        if (literMatch) return parseFloat(literMatch[1]) * 1000;
        
        const mlMatch = str.match(/([\d.]+)\s*ml/i);
        if (mlMatch) return parseFloat(mlMatch[1]);
        
        // Fluid ounces: "12 fl oz", "16oz"
        const ozMatch = str.match(/([\d.]+)\s*(?:fl\.?\s*)?oz/i);
        if (ozMatch) return parseFloat(ozMatch[1]) * 29.57;
        
        return null;
      };
      
      // Extract serving quantity in ml (for liquids)
      let servingQuantityMl = nutriments.serving_quantity || product.serving_quantity;
      if (!servingQuantityMl && product.serving_size) {
        servingQuantityMl = parseVolumeMl(product.serving_size);
      }
      
      // Extract product quantity (total container size)
      let productQuantityMl = product.product_quantity;
      if (!productQuantityMl && product.quantity) {
        productQuantityMl = parseVolumeMl(product.quantity);
      }
      // Also try product name for container size (e.g., "Wine 1.5L")
      if (!productQuantityMl && product.product_name) {
        productQuantityMl = parseVolumeMl(product.product_name);
      }
      
      // Calculate servings per container
      let servingsPerContainer = product.servings_per_container;
      if (!servingsPerContainer && servingQuantityMl && productQuantityMl) {
        servingsPerContainer = Math.round(productQuantityMl / servingQuantityMl);
      }
      
      return {
        success: true,
        product: {
          id: barcode,
          name: product.product_name || 'Unknown Product',
          brand: product.brands || '',
          image_url: product.image_url,
          nutrition: {
            calories_100g: nutriments['energy-kcal_100g'],
            proteins_100g: nutriments.proteins_100g,
            carbohydrates_100g: nutriments.carbohydrates_100g,
            fat_100g: nutriments.fat_100g,
            fiber_100g: nutriments.fiber_100g,
            sugars_100g: nutriments.sugars_100g,
            salt_100g: nutriments.salt_100g,
            alcohol_100g: nutriments.alcohol_100g,
            // Per-serving values (direct from label)
            calories_serving: nutriments['energy-kcal_serving'],
            proteins_serving: nutriments.proteins_serving,
            carbohydrates_serving: nutriments.carbohydrates_serving,
            fat_serving: nutriments.fat_serving,
            sugars_serving: nutriments.sugars_serving,
            alcohol_serving: nutriments.alcohol_serving,
            // Micronutrients - extract from OpenFoodFacts nutriments
            // OpenFoodFacts stores sodium in GRAMS, convert to mg
            // sodium_serving is already per-serving in grams (e.g., 0.005g = 5mg)
            // sodium_100g is per 100g in grams
            sodium_mg: (() => {
              const servingValue = nutriments.sodium_serving;
              const per100gValue = nutriments.sodium_100g;
              
              if (servingValue !== undefined) {
                // Convert grams to mg (multiply by 1000)
                const mgValue = servingValue * 1000;
                // Sanity check: if result > 2000mg for a single serving, it's suspicious
                // Most beverages have <500mg sodium per serving
                return mgValue > 2000 ? Math.round(mgValue / 1000) : Math.round(mgValue);
              }
              if (per100gValue !== undefined) {
                const scaleFactor = servingQuantityMl ? servingQuantityMl / 100 : 1;
                const mgValue = per100gValue * 1000 * scaleFactor;
                return mgValue > 2000 ? Math.round(mgValue / 1000) : Math.round(mgValue);
              }
              return undefined;
            })(),
            caffeine_mg: nutriments.caffeine_serving || 
                        (nutriments.caffeine_100g ? nutriments.caffeine_100g * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            calcium_mg: nutriments.calcium_serving || 
                       (nutriments.calcium_100g ? nutriments.calcium_100g * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            potassium_mg: nutriments.potassium_serving || 
                         (nutriments.potassium_100g ? nutriments.potassium_100g * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            iron_mg: nutriments.iron_serving || 
                    (nutriments.iron_100g ? nutriments.iron_100g * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            // Vitamins
            vitamin_a_mcg: nutriments['vitamin-a_serving'] || 
                          (nutriments['vitamin-a_100g'] ? nutriments['vitamin-a_100g'] * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            vitamin_c_mg: nutriments['vitamin-c_serving'] || 
                         (nutriments['vitamin-c_100g'] ? nutriments['vitamin-c_100g'] * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            vitamin_d_mcg: nutriments['vitamin-d_serving'] || 
                          (nutriments['vitamin-d_100g'] ? nutriments['vitamin-d_100g'] * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            vitamin_b6_mg: nutriments['vitamin-b6_serving'] || 
                          (nutriments['vitamin-b6_100g'] ? nutriments['vitamin-b6_100g'] * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            vitamin_b12_mcg: nutriments['vitamin-b12_serving'] || 
                            (nutriments['vitamin-b12_100g'] ? nutriments['vitamin-b12_100g'] * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            niacin_mg: nutriments['niacin_serving'] || nutriments['vitamin-pp_serving'] ||
                      (nutriments['niacin_100g'] || nutriments['vitamin-pp_100g'] ? 
                       (nutriments['niacin_100g'] || nutriments['vitamin-pp_100g']) * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            riboflavin_mg: nutriments['riboflavin_serving'] || nutriments['vitamin-b2_serving'] ||
                          (nutriments['riboflavin_100g'] || nutriments['vitamin-b2_100g'] ? 
                           (nutriments['riboflavin_100g'] || nutriments['vitamin-b2_100g']) * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            thiamin_mg: nutriments['thiamin_serving'] || nutriments['vitamin-b1_serving'] ||
                       (nutriments['thiamin_100g'] || nutriments['vitamin-b1_100g'] ? 
                        (nutriments['thiamin_100g'] || nutriments['vitamin-b1_100g']) * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            biotin_mcg: nutriments['biotin_serving'] ||
                       (nutriments['biotin_100g'] ? nutriments['biotin_100g'] * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            pantothenic_acid_mg: nutriments['pantothenic-acid_serving'] ||
                                (nutriments['pantothenic-acid_100g'] ? nutriments['pantothenic-acid_100g'] * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            // Minerals
            magnesium_mg: nutriments.magnesium_serving || 
                         (nutriments.magnesium_100g ? nutriments.magnesium_100g * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            zinc_mg: nutriments.zinc_serving || 
                    (nutriments.zinc_100g ? nutriments.zinc_100g * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
            chromium_mcg: nutriments.chromium_serving || 
                         (nutriments.chromium_100g ? nutriments.chromium_100g * (servingQuantityMl ? servingQuantityMl / 100 : 1) : undefined),
          },
          ingredients: product.ingredients_text,
          serving_size: product.serving_size,
          serving_quantity_ml: servingQuantityMl,
          product_quantity_ml: productQuantityMl,
          servings_per_container: servingsPerContainer,
          category: product.categories,
          data_source: 'OpenFoodFacts',
          confidence: 0.95
        }
      };
    } catch (error) {
      return { success: false, error: `OpenFoodFacts error: ${error}` };
    }
  }

  private static async tryAlcoholDatabase(barcode: string): Promise<APIResponse> {
    try {
      // Try multiple alcohol-specific sources
      
      // First try OpenFoodFacts with alcohol-specific search
      const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      if (offResponse.ok) {
        const offData = await offResponse.json();
        if (offData.product && (
          offData.product.categories?.toLowerCase().includes('alcohol') ||
          offData.product.categories?.toLowerCase().includes('beverage') ||
          offData.product.categories?.toLowerCase().includes('drink')
        )) {
          const product = offData.product;
          return {
            success: true,
            product: {
              id: barcode,
              name: product.product_name || 'Unknown Alcoholic Beverage',
              brand: product.brands || '',
              image_url: product.image_url,
              category: product.categories || 'Alcoholic Beverages',
              nutrition: {
                calories_100g: product.nutriments?.['energy-kcal_100g'] || 
                             Math.round((product.nutriments?.alcohol || 0) * 7), // Alcohol calories
                proteins_100g: product.nutriments?.proteins_100g || 0,
                carbohydrates_100g: product.nutriments?.carbohydrates_100g || 
                                  product.nutriments?.sugars_100g || 0,
                fat_100g: product.nutriments?.fat_100g || 0,
                fiber_100g: product.nutriments?.fiber_100g || 0,
                sugars_100g: product.nutriments?.sugars_100g || 0,
                salt_100g: product.nutriments?.salt_100g || 0,
              },
              ingredients: product.ingredients_text,
              serving_size: product.serving_size || '355ml',
              data_source: 'OpenFoodFacts (Alcohol)',
              confidence: 0.9
            }
          };
        }
      }

      // Try TheCocktailDB for alcohol products (free API)
      const cocktailResponse = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${barcode}`);
      if (cocktailResponse.ok) {
        const cocktailData = await cocktailResponse.json();
        if (cocktailData.drinks && cocktailData.drinks.length > 0) {
          const drink = cocktailData.drinks[0];
          return {
            success: true,
            product: {
              id: barcode,
              name: drink.strDrink || 'Unknown Alcoholic Beverage',
              brand: 'Mixed Drink',
              image_url: drink.strDrinkThumb,
              category: 'Alcoholic Beverages',
              nutrition: {
                calories_100g: 200, // Estimate for mixed drinks
                proteins_100g: 0,
                carbohydrates_100g: 15,
                fat_100g: 0,
              },
              ingredients: drink.strInstructions,
              data_source: 'TheCocktailDB',
              confidence: 0.7
            }
          };
        }
      }
      
      return { success: false, error: 'Product not found in alcohol databases' };
    } catch (error) {
      return { success: false, error: `Alcohol database error: ${error}` };
    }
  }

  private static async tryFDADatabase(barcode: string): Promise<APIResponse> {
    try {
      // FDA Food Database for US products
      const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${barcode}&api_key=DEMO_KEY`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.foods && data.foods.length > 0) {
          const item = data.foods[0];
          const nutrients = item.foodNutrients || [];
          
          const getnutrient = (id: number) => {
            const nutrient = nutrients.find(n => n.nutrientId === id);
            return nutrient ? nutrient.value : 0;
          };
          
          return {
            success: true,
            product: {
              id: barcode,
              name: item.description || 'Unknown Food Product',
              brand: item.brandOwner || '',
              category: item.foodCategory,
              nutrition: {
                calories_100g: getnutrient(1008), // Energy
                proteins_100g: getnutrient(1003), // Protein
                carbohydrates_100g: getnutrient(1005), // Carbs
                fat_100g: getnutrient(1004), // Fat
                fiber_100g: getnutrient(1079), // Fiber
                sugars_100g: getnutrient(2000), // Sugars
                salt_100g: getnutrient(1093) / 1000, // Sodium to salt conversion
              },
              ingredients: item.ingredients,
              data_source: 'FDA Database',
              confidence: 0.9
            }
          };
        }
      }
      
      return { success: false, error: 'Product not found in FDA database' };
    } catch (error) {
      return { success: false, error: `FDA database error: ${error}` };
    }
  }

  static getApiKeyStatus() {
    return {
      goUPC: !!this.API_KEYS.goUPC,
      barcodeSpider: !!this.API_KEYS.barcodeSpider,
      upcItemDB: true, // Free API
      openFoodFacts: true, // Free API
      alcoholDatabase: true, // Free API
      fdaDatabase: true // Free API (with limitations)
    };
  }
}