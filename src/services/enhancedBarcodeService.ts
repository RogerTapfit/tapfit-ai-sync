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
    // Per-serving values (direct from label)
    calories_serving?: number;
    proteins_serving?: number;
    carbohydrates_serving?: number;
    fat_serving?: number;
    sugars_serving?: number;
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
          return result.product;
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
      
      // Extract serving quantity in ml (for liquids)
      let servingQuantityMl = nutriments.serving_quantity || product.serving_quantity;
      if (!servingQuantityMl && product.serving_size) {
        // Try to parse serving size string like "1/2 cup (120ml)" or "240ml"
        const mlMatch = product.serving_size.match(/(\d+)\s*ml/i);
        if (mlMatch) servingQuantityMl = parseFloat(mlMatch[1]);
      }
      
      // Extract product quantity (total container size)
      let productQuantityMl = product.product_quantity;
      if (!productQuantityMl && product.quantity) {
        const qtyMatch = product.quantity.match(/(\d+)\s*ml/i);
        if (qtyMatch) productQuantityMl = parseFloat(qtyMatch[1]);
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
            // Per-serving values (direct from label)
            calories_serving: nutriments['energy-kcal_serving'],
            proteins_serving: nutriments.proteins_serving,
            carbohydrates_serving: nutriments.carbohydrates_serving,
            fat_serving: nutriments.fat_serving,
            sugars_serving: nutriments.sugars_serving,
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