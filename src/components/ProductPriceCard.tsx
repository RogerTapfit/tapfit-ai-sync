import { useState } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Store, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PriceLookupResult, calculateValueRating, getValueRatingDetails } from '@/services/priceLookupService';

interface ProductPriceCardProps {
  pricing: PriceLookupResult;
  productName: string;
}

export const ProductPriceCard = ({ pricing, productName }: ProductPriceCardProps) => {
  const [userPrice, setUserPrice] = useState<string>('');
  const [showComparison, setShowComparison] = useState(false);
  
  const handlePriceSubmit = () => {
    if (userPrice && parseFloat(userPrice) > 0) {
      setShowComparison(true);
    }
  };
  
  const userPriceNum = parseFloat(userPrice) || 0;
  const valueRating = userPriceNum > 0 ? calculateValueRating(userPriceNum, pricing.average_price) : null;
  const valueDetails = valueRating ? getValueRatingDetails(valueRating) : null;
  const priceDiff = userPriceNum > 0 ? userPriceNum - pricing.average_price : 0;
  const percentDiff = userPriceNum > 0 ? ((priceDiff / pricing.average_price) * 100) : 0;
  
  // Calculate position on price range bar
  const rangeWidth = pricing.price_high - pricing.price_low;
  const avgPosition = ((pricing.average_price - pricing.price_low) / rangeWidth) * 100;
  const userPosition = userPriceNum > 0 
    ? Math.max(0, Math.min(100, ((userPriceNum - pricing.price_low) / rangeWidth) * 100))
    : null;
  
  return (
    <div className="bg-card/50 rounded-xl p-4 border border-border/50 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-green-500/20">
          <DollarSign className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Price Comparison</h3>
          <p className="text-xs text-muted-foreground">Average market prices</p>
        </div>
      </div>
      
      {/* Average Price Display */}
      <div className="text-center py-3 bg-background/50 rounded-lg">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Average Price</p>
        <p className="text-3xl font-bold text-foreground">${pricing.average_price.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Based on {pricing.source === 'local' ? 'market data' : 'current listings'}
        </p>
      </div>
      
      {/* Price Range Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low: ${pricing.price_low.toFixed(2)}</span>
          <span>High: ${pricing.price_high.toFixed(2)}</span>
        </div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-30" />
          
          {/* Average marker */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-foreground"
            style={{ left: `${avgPosition}%` }}
          />
          
          {/* User price marker */}
          {userPosition !== null && showComparison && (
            <div 
              className="absolute top-0 bottom-0 w-2 bg-primary rounded-full shadow-lg"
              style={{ left: `${userPosition}%`, transform: 'translateX(-50%)' }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-green-500 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Best deals
          </span>
          <span className="text-red-500 flex items-center gap-1">
            Premium <TrendingUp className="w-3 h-3" />
          </span>
        </div>
      </div>
      
      {/* User Price Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">What are you paying?</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={userPrice}
              onChange={(e) => {
                setUserPrice(e.target.value);
                setShowComparison(false);
              }}
              className="pl-7"
            />
          </div>
          <Button onClick={handlePriceSubmit} size="default">
            Compare
          </Button>
        </div>
      </div>
      
      {/* Value Comparison Result */}
      {showComparison && valueDetails && (
        <div className={`p-4 rounded-lg border ${
          valueRating === 'great' ? 'bg-green-500/10 border-green-500/30' :
          valueRating === 'good' ? 'bg-yellow-500/10 border-yellow-500/30' :
          valueRating === 'fair' ? 'bg-orange-500/10 border-orange-500/30' :
          'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold">
              {valueDetails.emoji} {valueDetails.label}
            </span>
            <span className={`text-sm font-medium ${valueDetails.color}`}>
              {priceDiff >= 0 ? '+' : ''}{percentDiff.toFixed(0)}%
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {priceDiff > 0 ? (
              <>You're paying <span className="font-semibold text-red-500">${Math.abs(priceDiff).toFixed(2)} more</span> than average</>
            ) : priceDiff < 0 ? (
              <>You're saving <span className="font-semibold text-green-500">${Math.abs(priceDiff).toFixed(2)}</span> compared to average</>
            ) : (
              <>You're paying exactly the average price</>
            )}
          </p>
        </div>
      )}
      
      {/* Where to Buy */}
      {pricing.typical_stores && pricing.typical_stores.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Store className="w-4 h-4" />
            <span>Where to buy</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pricing.typical_stores.map((store, idx) => (
              <span 
                key={idx}
                className="px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {store}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Confidence indicator */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
        Data confidence: {Math.round(pricing.confidence * 100)}% • 
        Last updated: {pricing.last_updated}
      </div>
    </div>
  );
};
