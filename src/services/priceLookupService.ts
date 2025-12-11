import { productPricingDatabase, getPricingByName, ProductPricing } from './productPricingDatabase';

export interface PriceLookupResult extends ProductPricing {
  source: 'local' | 'api' | 'estimated';
  confidence: number;
}

export type ValueRating = 'great' | 'good' | 'fair' | 'overpriced';

export const calculateValueRating = (userPrice: number, averagePrice: number): ValueRating => {
  const percentDiff = ((userPrice - averagePrice) / averagePrice) * 100;
  
  if (percentDiff <= -20) return 'great';
  if (percentDiff <= 10) return 'good';
  if (percentDiff <= 20) return 'fair';
  return 'overpriced';
};

export const getValueRatingDetails = (rating: ValueRating): { label: string; color: string; emoji: string } => {
  switch (rating) {
    case 'great':
      return { label: 'Great Value', color: 'text-green-500', emoji: '🟢' };
    case 'good':
      return { label: 'Good Value', color: 'text-yellow-500', emoji: '🟡' };
    case 'fair':
      return { label: 'Fair Price', color: 'text-orange-500', emoji: '🟠' };
    case 'overpriced':
      return { label: 'Overpriced', color: 'text-red-500', emoji: '🔴' };
  }
};

export class PriceLookupService {
  private static priceCache: Map<string, PriceLookupResult> = new Map();
  
  static async lookupPrice(barcode: string, productName?: string): Promise<PriceLookupResult | null> {
    // Check cache first
    const cacheKey = barcode || productName || '';
    if (this.priceCache.has(cacheKey)) {
      return this.priceCache.get(cacheKey)!;
    }
    
    // 1. Check local database by barcode
    if (barcode && productPricingDatabase[barcode]) {
      const result: PriceLookupResult = {
        ...productPricingDatabase[barcode],
        source: 'local',
        confidence: 1.0
      };
      this.priceCache.set(cacheKey, result);
      return result;
    }
    
    // 2. Check by product name
    if (productName) {
      const namePricing = getPricingByName(productName);
      if (namePricing) {
        const result: PriceLookupResult = {
          ...namePricing,
          source: 'local',
          confidence: 0.9
        };
        this.priceCache.set(cacheKey, result);
        return result;
      }
    }
    
    // 3. Try external API (UPCItemDB)
    if (barcode) {
      try {
        const apiResult = await this.tryUPCItemDB(barcode);
        if (apiResult) {
          this.priceCache.set(cacheKey, apiResult);
          return apiResult;
        }
      } catch (error) {
        console.log('External price API unavailable');
      }
    }
    
    return null;
  }
  
  private static async tryUPCItemDB(barcode: string): Promise<PriceLookupResult | null> {
    try {
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        const offers = item.offers || [];
        
        if (offers.length > 0) {
          const prices = offers.map((o: any) => o.price).filter((p: number) => p > 0);
          
          if (prices.length > 0) {
            const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const stores = offers.map((o: any) => o.merchant).filter(Boolean).slice(0, 5);
            
            return {
              average_price: Math.round(avgPrice * 100) / 100,
              price_low: minPrice,
              price_high: maxPrice,
              currency: 'USD',
              typical_stores: stores,
              last_updated: new Date().toISOString().slice(0, 7),
              source: 'api',
              confidence: 0.8
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('UPCItemDB lookup failed:', error);
      return null;
    }
  }
  
  static clearCache(): void {
    this.priceCache.clear();
  }
}
