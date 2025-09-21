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
  };
  ingredients?: string;
  serving_size?: string;
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
      return {
        success: true,
        product: {
          id: barcode,
          name: product.product_name || 'Unknown Product',
          brand: product.brands || '',
          image_url: product.image_url,
          nutrition: {
            calories_100g: product.nutriments?.['energy-kcal_100g'],
            proteins_100g: product.nutriments?.proteins_100g,
            carbohydrates_100g: product.nutriments?.carbohydrates_100g,
            fat_100g: product.nutriments?.fat_100g,
            fiber_100g: product.nutriments?.fiber_100g,
            sugars_100g: product.nutriments?.sugars_100g,
            salt_100g: product.nutriments?.salt_100g,
          },
          ingredients: product.ingredients_text,
          serving_size: product.serving_size,
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
      // Try LCBO (Canada) API for alcohol products
      const response = await fetch(`https://lcboapi.com/products?q=${barcode}`, {
        headers: {
          'Authorization': 'Token token=MDo0ZjAyMWJjNS1jOTIwLTExZTQtOWRmNi1lZjMzYTFlYWMwOWE6'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.result && data.result.length > 0) {
          const item = data.result[0];
          return {
            success: true,
            product: {
              id: barcode,
              name: item.name || 'Unknown Alcohol Product',
              brand: item.producer_name,
              image_url: item.image_thumb_url,
              category: `${item.primary_category} - ${item.secondary_category}`,
              nutrition: {
                calories_100g: Math.round((item.alcohol_content || 0) * 7), // Rough alcohol calorie estimate
                proteins_100g: 0,
                carbohydrates_100g: item.sugar_content || 0,
                fat_100g: 0,
              },
              store_info: {
                price_range: `$${item.price_in_cents / 100}`,
                stores: ['LCBO']
              },
              data_source: 'LCBO Canada',
              confidence: 0.85
            }
          };
        }
      }
      
      return { success: false, error: 'Product not found in alcohol database' };
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