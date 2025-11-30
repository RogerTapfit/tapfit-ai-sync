import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ChevronLeft, ChevronRight, ExternalLink, ImageOff, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DishReview {
  rating: number;
  text: string;
  highlightedText: string;
  date: string;
  userName: string;
  userImage?: string;
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
  };
  reviews: DishReview[];
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
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (open && dishName && restaurantName) {
      fetchYelpData();
    }
  }, [open, dishName, restaurantName]);

  const fetchYelpData = async () => {
    setLoading(true);
    setError(null);
    setCurrentPhotoIndex(0);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('yelp-reviews', {
        body: {
          restaurantName,
          dishName,
        }
      });

      if (fnError) throw fnError;
      setYelpData(data);
    } catch (err) {
      console.error('Error fetching Yelp data:', err);
      setError('Failed to load photos and reviews');
    } finally {
      setLoading(false);
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

  const photos = yelpData?.restaurant?.photos || [];

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
          {restaurantName && (
            <DialogDescription>
              Photos & reviews from {restaurantName}
            </DialogDescription>
          )}
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
            {loading && (
              <div className="space-y-4">
                <Skeleton className="w-full h-64 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="w-full h-20" />
                  <Skeleton className="w-full h-20" />
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <ImageOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{error}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={fetchYelpData}>
                  Retry
                </Button>
              </div>
            )}

            {/* Photos Carousel */}
            {!loading && yelpData?.found && photos.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  📸 Restaurant Photos ({photos.length})
                </h3>
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  <img
                    src={photos[currentPhotoIndex]}
                    alt={`${restaurantName} photo ${currentPhotoIndex + 1}`}
                    className="w-full h-64 object-cover"
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
                  Real photos from Yelp users
                </p>
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
                    Reviews {yelpData.dishName && `mentioning "${yelpData.dishName}"`}
                  </h3>
                  {yelpData.dishName && yelpData.reviews.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {yelpData.matchingReviewsCount} of {yelpData.totalReviewsSearched} reviews
                    </Badge>
                  )}
                </div>

                {yelpData.reviews.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border rounded-lg space-y-3">
                    <p className="text-sm">No reviews available via API</p>
                    <p className="text-xs">Click below to see all reviews on Yelp</p>
                    {yelpData.restaurant?.yelpUrl && (
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        onClick={() => window.open(yelpData.restaurant?.yelpUrl, '_blank')}
                      >
                        <img src="https://www.yelp.com/favicon.ico" alt="Yelp" className="w-4 h-4" />
                        View All {yelpData.restaurant.reviewCount.toLocaleString()} Reviews on Yelp
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ) : (
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
