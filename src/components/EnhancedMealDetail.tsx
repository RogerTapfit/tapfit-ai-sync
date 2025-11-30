import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { 
  Star, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  MapPin,
  DollarSign,
  Loader2,
  AlertTriangle,
  Leaf,
  Wheat,
  Milk,
  Fish,
  Egg,
  Nut
} from 'lucide-react';

interface YelpReview {
  rating: number;
  text: string;
  date: string;
  userName: string;
  userImage?: string;
}

interface YelpRestaurantData {
  name: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  categories: string[];
  address: string;
  imageUrl?: string;
  yelpUrl: string;
}

interface EnhancedMealDetailProps {
  restaurantName?: string;
  location?: string;
  foodItems?: Array<{
    name: string;
    quantity?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

export const EnhancedMealDetail = ({ 
  restaurantName, 
  location,
  foodItems 
}: EnhancedMealDetailProps) => {
  const [yelpData, setYelpData] = useState<{ restaurant: YelpRestaurantData; reviews: YelpReview[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);

  useEffect(() => {
    if (restaurantName) {
      fetchYelpData();
    }
  }, [restaurantName, location]);

  const fetchYelpData = async () => {
    if (!restaurantName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('yelp-reviews', {
        body: { restaurantName, location }
      });

      if (invokeError) throw invokeError;

      if (data.found) {
        setYelpData({ restaurant: data.restaurant, reviews: data.reviews });
      } else {
        setError(data.message || 'Restaurant not found on Yelp');
      }
    } catch (err) {
      console.error('Error fetching Yelp data:', err);
      setError('Failed to load restaurant reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-500/50 text-yellow-500" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-muted-foreground/30" />);
      }
    }
    return stars;
  };

  // Common allergens to check for in food items
  const detectAllergens = (items: typeof foodItems) => {
    if (!items) return [];
    
    const allergenKeywords: Record<string, { icon: any; label: string; keywords: string[] }> = {
      gluten: { icon: Wheat, label: 'Contains Gluten', keywords: ['bread', 'pasta', 'flour', 'wheat', 'noodle', 'cake', 'cookie', 'cracker'] },
      dairy: { icon: Milk, label: 'Contains Dairy', keywords: ['cheese', 'milk', 'cream', 'butter', 'yogurt', 'ice cream'] },
      seafood: { icon: Fish, label: 'Contains Seafood', keywords: ['fish', 'shrimp', 'salmon', 'tuna', 'crab', 'lobster', 'shellfish'] },
      eggs: { icon: Egg, label: 'Contains Eggs', keywords: ['egg', 'omelet', 'omelette', 'quiche', 'mayo', 'mayonnaise'] },
      nuts: { icon: Nut, label: 'Contains Nuts', keywords: ['nut', 'almond', 'peanut', 'walnut', 'cashew', 'pistachio'] },
    };

    const detected: string[] = [];
    const itemNames = items.map(i => i.name.toLowerCase()).join(' ');

    Object.entries(allergenKeywords).forEach(([key, { keywords }]) => {
      if (keywords.some(keyword => itemNames.includes(keyword))) {
        detected.push(key);
      }
    });

    return detected;
  };

  const allergens = detectAllergens(foodItems);

  return (
    <div className="space-y-4">
      {/* Allergen Warnings */}
      {allergens.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Potential Allergens Detected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergens.map(allergen => {
                const AllergenIcon = allergen === 'gluten' ? Wheat : 
                                    allergen === 'dairy' ? Milk :
                                    allergen === 'seafood' ? Fish :
                                    allergen === 'eggs' ? Egg : Nut;
                return (
                  <Badge key={allergen} variant="outline" className="border-yellow-600/50 text-yellow-700 dark:text-yellow-400">
                    <AllergenIcon className="h-3 w-3 mr-1" />
                    {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Food Items Detail */}
      {foodItems && foodItems.length > 0 && (
        <Collapsible open={isIngredientsOpen} onOpenChange={setIsIngredientsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <span className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="font-medium">Detailed Ingredients ({foodItems.length} items)</span>
              </span>
              {isIngredientsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 px-3 pb-3">
            {foodItems.map((item, index) => (
              <div key={index} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.quantity && (
                      <p className="text-xs text-muted-foreground">{item.quantity}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{item.calories} cal</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Protein</span>
                      <span>{item.protein}g</span>
                    </div>
                    <Progress value={(item.protein / 50) * 100} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Carbs</span>
                      <span>{item.carbs}g</span>
                    </div>
                    <Progress value={(item.carbs / 100) * 100} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Fat</span>
                      <span>{item.fat}g</span>
                    </div>
                    <Progress value={(item.fat / 50) * 100} className="h-1.5" />
                  </div>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Yelp Restaurant Info */}
      {restaurantName && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <img src="https://s3-media0.fl.yelpcdn.com/assets/srv0/yelp_styleguide/3ee2de1fb3e4/assets/img/brand_guidelines/yelp_fullcolor.png" 
                   alt="Yelp" 
                   className="h-5" />
              Restaurant Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading Yelp data...</span>
              </div>
            )}

            {error && !loading && (
              <p className="text-sm text-muted-foreground text-center py-2">{error}</p>
            )}

            {yelpData && !loading && (
              <>
                <div className="flex items-start gap-3">
                  {yelpData.restaurant.imageUrl && (
                    <img 
                      src={yelpData.restaurant.imageUrl} 
                      alt={yelpData.restaurant.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">{yelpData.restaurant.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {renderStars(yelpData.restaurant.rating)}
                      <span className="text-sm ml-1">{yelpData.restaurant.rating}</span>
                      <span className="text-xs text-muted-foreground">
                        ({yelpData.restaurant.reviewCount} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span>{yelpData.restaurant.priceRange}</span>
                      <span>•</span>
                      <span>{yelpData.restaurant.categories.slice(0, 2).join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{yelpData.restaurant.address}</span>
                </div>

                {/* Reviews Section */}
                {yelpData.reviews.length > 0 && (
                  <Collapsible open={isReviewsOpen} onOpenChange={setIsReviewsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span>Top Reviews ({yelpData.reviews.length})</span>
                        {isReviewsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-2">
                      {yelpData.reviews.map((review, index) => (
                        <div key={index} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            {review.userImage ? (
                              <img src={review.userImage} alt={review.userName} className="w-6 h-6 rounded-full" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                {review.userName.charAt(0)}
                              </div>
                            )}
                            <span className="text-sm font-medium">{review.userName}</span>
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">{review.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(review.date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open(yelpData.restaurant.yelpUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View on Yelp
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
