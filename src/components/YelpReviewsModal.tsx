import { useState, useEffect } from 'react';
import { Star, MapPin, ExternalLink, Loader2, X, DollarSign, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

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

interface YelpReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantName: string;
  location?: string;
}

export const YelpReviewsModal = ({ 
  open, 
  onOpenChange, 
  restaurantName, 
  location 
}: YelpReviewsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<YelpRestaurantData | null>(null);
  const [reviews, setReviews] = useState<YelpReview[]>([]);

  useEffect(() => {
    if (open && restaurantName) {
      fetchYelpData();
    }
  }, [open, restaurantName]);

  const fetchYelpData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('yelp-reviews', {
        body: { restaurantName, location }
      });

      if (fnError) throw fnError;

      if (data?.found) {
        setRestaurant(data.restaurant);
        setReviews(data.reviews || []);
      } else {
        setError(data?.message || 'Restaurant not found on Yelp');
      }
    } catch (err) {
      console.error('Error fetching Yelp data:', err);
      setError('Failed to fetch Yelp reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-500 fill-yellow-500'
            : i < rating
            ? 'text-yellow-500 fill-yellow-500/50'
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <img 
              src="https://s3-media0.fl.yelpcdn.com/assets/public/cookbook.yji-0b4a82b36a3ad13e0619.svg" 
              alt="Yelp" 
              className="h-5 w-5"
            />
            Yelp Reviews
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-60px)]">
          <div className="p-4 pt-2 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">Searching Yelp...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={fetchYelpData}
                >
                  Try Again
                </Button>
              </div>
            ) : restaurant ? (
              <>
                {/* Restaurant Image */}
                {restaurant.imageUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Restaurant Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-lg">{restaurant.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">{renderStars(restaurant.rating)}</div>
                      <span className="font-semibold">{restaurant.rating}</span>
                      <span className="text-muted-foreground text-sm">
                        ({restaurant.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {restaurant.priceRange && restaurant.priceRange !== 'N/A' && (
                      <Badge variant="secondary" className="gap-1">
                        <DollarSign className="h-3 w-3" />
                        {restaurant.priceRange}
                      </Badge>
                    )}
                    {restaurant.categories.map((cat, i) => (
                      <Badge key={i} variant="outline">{cat}</Badge>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{restaurant.address}</span>
                  </div>
                </div>

                <Separator />

                {/* Reviews */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Top Reviews
                  </h4>

                  {reviews.length > 0 ? (
                    <div className="space-y-3">
                      {reviews.map((review, i) => (
                        <Card key={i} className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              {review.userImage ? (
                                <img
                                  src={review.userImage}
                                  alt={review.userName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <span className="text-xs font-bold">
                                    {review.userName.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-sm">{review.userName}</p>
                                <div className="flex items-center gap-1">
                                  <div className="flex">
                                    {renderStars(review.rating)}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(review.date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-4">
                              {review.text}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No reviews available</p>
                  )}
                </div>

                {/* View on Yelp Button */}
                <Button
                  className="w-full bg-[#d32323] hover:bg-[#b81f1f] text-white"
                  onClick={() => window.open(restaurant.yelpUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Yelp
                </Button>
              </>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
