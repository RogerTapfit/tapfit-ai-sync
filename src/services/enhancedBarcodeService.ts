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
      () => this.tryUSDAFoodData(barcode)
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
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      
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

  private static async tryUSDAFoodData(barcode: string): Promise<APIResponse> {
    try {
      // USDA FoodData Central doesn't directly support UPC lookup
      // This would require a different approach or additional mapping service
      return { success: false, error: 'USDA lookup not implemented for UPC codes' };
    } catch (error) {
      return { success: false, error: `USDA error: ${error}` };
    }
  }

  static getApiKeyStatus() {
    return {
      goUPC: !!this.API_KEYS.goUPC,
      barcodeSpider: !!this.API_KEYS.barcodeSpider,
      upcItemDB: true, // Free API
      openFoodFacts: true, // Free API
      usda: false // Not implemented
    };
  }
}