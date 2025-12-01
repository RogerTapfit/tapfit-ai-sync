import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ChevronLeft, ChevronRight, ExternalLink, ImageOff, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DishImage {
  url: string;
  thumbnail: string;
  title: string;
  source: string;
}

interface DishReview {
  rating: number;
  text: string;
  highlightedText: string;
  date: string;
  userName: string;
  userImage?: string;
}

interface DishReviewSnippet {
  snippet: string;
  source: string;
  link: string;
}

interface YelpData {
  found: boolean;
  restaurant?: {
    name: string;
    rating: number;
    reviewCount: number;
    priceRange: string;
    categories: string[];
    address: string;
    imageUrl?: string;
    photos: string[];
    yelpUrl: string;
    alias?: string;
  };
  reviews: DishReview[];
  dishReviewSnippets?: DishReviewSnippet[];
  yelpDishSearchUrl?: string;
  dishName?: string;
  totalReviewsSearched: number;
  matchingReviewsCount: number;
}

interface DishDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dishName: string;
  restaurantName?: string;
  dishInfo?: {
    calories?: number;
    price?: number;
    description?: string;
    macros?: {
      protein?: number;
      carbs?: number;
      fat?: number;
    };
  };
}

export const DishDetailModal = ({
  open,
  onOpenChange,
  dishName,
  restaurantName,
  dishInfo
}: DishDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [yelpData, setYelpData] = useState<YelpData | null>(null);
  const [dishImages, setDishImages] = useState<DishImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [yelpPhotoSearchUrl, setYelpPhotoSearchUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && dishName) {
      fetchAllData();
    }
  }, [open, dishName, restaurantName]);

  const fetchAllData = async () => {
    setLoading(true);
    setImagesLoading(true);
    setError(null);
    setCurrentPhotoIndex(0);
    setDishImages([]);

    // Step 1: Fetch Yelp data FIRST to discover the restaurant name
    let discoveredRestaurantName = restaurantName;
    try {
      const yelpResult = await fetchYelpData();
      if (yelpResult?.restaurant?.name) {
        discoveredRestaurantName = yelpResult.restaurant.name;
        console.log('Discovered restaurant from Yelp:', discoveredRestaurantName);
      }
    } catch (err) {
      console.error('Error fetching Yelp data:', err);
    }
    setLoading(false);

    // Step 2: Now search for images WITH the discovered restaurant name
    try {
      await fetchDishImages(discoveredRestaurantName);
    } catch (err) {
      console.error('Error fetching dish images:', err);
    }
    setImagesLoading(false);
  };

  const fetchDishImages = async (restaurant?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('search-dish-images', {
        body: {
          dishName,
          restaurantName: restaurant || restaurantName,
        }
      });

      if (fnError) throw fnError;
      
      console.log('Dish images response:', data);
      
      if (data?.images && data.images.length > 0) {
        setDishImages(data.images);
      }
      
      // Store Yelp photo search URL for fallback (from edge function or build from alias)
      if (data?.yelpPhotoSearchUrl) {
        setYelpPhotoSearchUrl(data.yelpPhotoSearchUrl);
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching dish images:', err);
      throw err;
    }
  };

  const fetchYelpData = async () => {
    try {
      const searchTerm = restaurantName || dishName;
      const { data, error: fnError } = await supabase.functions.invoke('yelp-reviews', {
        body: {
          restaurantName: searchTerm,
          dishName,
        }
      });

      if (fnError) throw fnError;
      setYelpData(data);
      
      // Also store Yelp photo search URL from yelp-reviews (uses actual business alias)
      if (data?.yelpPhotoSearchUrl && !yelpPhotoSearchUrl) {
        setYelpPhotoSearchUrl(data.yelpPhotoSearchUrl);
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching Yelp data:', err);
      setError('Failed to load reviews');
      throw err;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : star - 0.5 <= rating
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  // ONLY show dish-specific images - NO generic restaurant photo fallback
  // This ensures users only see photos actually related to the dish they clicked
  const photos = dishImages.map(img => img.url);
  const isDishSpecificPhotos = dishImages.length > 0;

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{dishName}</DialogTitle>
          <DialogDescription>
            {restaurantName 
              ? `Photos & reviews from ${restaurantName}` 
              : 'Searching for photos & reviews...'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Dish Info */}
            {dishInfo && (
              <div className="flex flex-wrap gap-2">
                {dishInfo.calories && (
                  <Badge variant="outline">🔥 {dishInfo.calories} cal</Badge>
                )}
                {dishInfo.price && (
                  <Badge variant="outline">💰 ${dishInfo.price.toFixed(2)}</Badge>
                )}
                {dishInfo.macros?.protein && (
                  <Badge variant="outline">💪 {dishInfo.macros.protein}g protein</Badge>
                )}
                {dishInfo.macros?.carbs && (
                  <Badge variant="outline">🍞 {dishInfo.macros.carbs}g carbs</Badge>
                )}
                {dishInfo.macros?.fat && (
                  <Badge variant="outline">🧈 {dishInfo.macros.fat}g fat</Badge>
                )}
              </div>
            )}

            {/* Loading State */}
            {(loading || imagesLoading) && (
              <div className="space-y-4">
                <Skeleton className="w-full h-64 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="w-full h-20" />
                  <Skeleton className="w-full h-20" />
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && !imagesLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <ImageOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{error}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={fetchAllData}>
                  Retry
                </Button>
              </div>
            )}

            {/* Photos Carousel */}
            {!loading && !imagesLoading && photos.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  {isDishSpecificPhotos 
                    ? `🍽️ Photos of "${dishName}" (${photos.length})`
                    : `📸 Restaurant Photos (${photos.length})`
                  }
                </h3>
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  <img
                    src={photos[currentPhotoIndex]}
                    alt={`${dishName} photo ${currentPhotoIndex + 1}`}
                    className="w-full h-64 object-contain"
                    onError={(e) => {
                      // If image fails to load, try thumbnail or remove from list
                      const target = e.target as HTMLImageElement;
                      if (dishImages[currentPhotoIndex]?.thumbnail) {
                        target.src = dishImages[currentPhotoIndex].thumbnail;
                      }
                    }}
                  />
                  {photos.length > 1 && (
                    <>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                        onClick={prevPhoto}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                        onClick={nextPhoto}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {photos.map((_, idx) => (
                          <button
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                            onClick={() => setCurrentPhotoIndex(idx)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {isDishSpecificPhotos 
                    ? `Real photos of this dish from the web`
                    : `Photos from Yelp users`
                  }
                </p>
              </div>
            )}

            {/* No Photos Found - Show Prominent Yelp Photo Search Link */}
            {!loading && !imagesLoading && photos.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed rounded-lg space-y-4 bg-muted/30">
                <ImageOff className="h-12 w-12 mx-auto opacity-40" />
                <div className="space-y-2">
                  <p className="font-medium">No photos tagged as "{dishName}" found</p>
                  <p className="text-sm text-muted-foreground">
                    Search Yelp directly to see user-uploaded photos of this dish
                  </p>
                </div>
                {(yelpPhotoSearchUrl || yelpData?.restaurant?.alias) && (
                  <Button
                    variant="default"
                    size="lg"
                    className="gap-2 mt-2"
                    onClick={() => {
                      const url = yelpPhotoSearchUrl || 
                        `https://www.yelp.com/biz_photos/${yelpData?.restaurant?.alias}?q=${encodeURIComponent(dishName)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <img src="https://www.yelp.com/favicon.ico" alt="Yelp" className="w-5 h-5" />
                    View "{dishName}" Photos on Yelp
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Restaurant Rating - Always show when found */}
            {!loading && yelpData?.found && yelpData.restaurant && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="https://www.yelp.com/favicon.ico" alt="Yelp" className="w-5 h-5" />
                    <span className="font-semibold">{yelpData.restaurant.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(yelpData.restaurant.rating)}
                    <span className="text-sm font-medium">{yelpData.restaurant.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {yelpData.restaurant.reviewCount.toLocaleString()} reviews · {yelpData.restaurant.priceRange} · {yelpData.restaurant.categories.join(', ')}
                </p>
                <p className="text-xs text-muted-foreground">{yelpData.restaurant.address}</p>
              </div>
            )}

            {/* Reviews Section */}
            {!loading && yelpData?.found && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Reviews of "{dishName}"
                  </h3>
                  {yelpData.reviews.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {yelpData.matchingReviewsCount} found
                    </Badge>
                  )}
                </div>

                {/* Dish-specific review snippets from SerpAPI */}
                {yelpData.dishReviewSnippets && yelpData.dishReviewSnippets.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Review snippets mentioning this dish:</p>
                    {yelpData.dishReviewSnippets.map((snippet, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-1 bg-muted/30">
                        <p className="text-sm text-foreground leading-relaxed">"{snippet.snippet}"</p>
                        <a 
                          href={snippet.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Read full review <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Yelp API reviews */}
                {yelpData.reviews.length > 0 ? (
                  <div className="space-y-3">
                    {yelpData.reviews.map((review, idx) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {review.userImage ? (
                              <img
                                src={review.userImage}
                                alt={review.userName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {review.userName.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium text-sm">{review.userName}</span>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.highlightedText.split('**').map((part, i) =>
                            i % 2 === 1 ? (
                              <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 px-0.5 rounded">
                                {part}
                              </mark>
                            ) : (
                              part
                            )
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground border rounded-lg space-y-3">
                    <p className="text-sm">No reviews mentioning "{dishName}" found via API</p>
                    
                    {/* Direct Yelp search link for dish-specific reviews */}
                    {yelpData.yelpDishSearchUrl && (
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        onClick={() => window.open(yelpData.yelpDishSearchUrl!, '_blank')}
                      >
                        <img src="https://www.yelp.com/favicon.ico" alt="Yelp" className="w-4 h-4" />
                        Search Yelp for "{dishName}" reviews
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {!loading && yelpData && !yelpData.found && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Restaurant not found on Yelp</p>
              </div>
            )}

            {/* View on Yelp Button */}
            {!loading && yelpData?.restaurant?.yelpUrl && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.open(yelpData.restaurant?.yelpUrl, '_blank')}
              >
                <img src="https://www.yelp.com/favicon.ico" alt="Yelp" className="w-4 h-4" />
                View {restaurantName} on Yelp
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
